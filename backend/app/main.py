"""FastAPI app: GET /health and POST /predict for AI vs Human text classification."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator

from .config import settings
from .model_service import ModelNotReadyError, ModelService

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(name)s: %(message)s")

DISCLAIMER = "These are machine-learning estimates, not proof of authorship."

model_service = ModelService(
    settings.model_path,
    settings.ai_class_label,
    clean_text_path=settings.clean_text_path,
    model_config_path=settings.model_config_path,
)


@asynccontextmanager
async def lifespan(_: FastAPI):
    model_service.load()
    yield


app = FastAPI(
    title="AI vs Human Text Classifier API",
    description="Serves a trained word + character TF-IDF + Logistic Regression pipeline.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class PredictRequest(BaseModel):
    text: str = Field(..., description="The text to classify.")

    @field_validator("text")
    @classmethod
    def validate_text(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Text is empty. Please paste some text to analyze.")
        if len(stripped) > settings.max_text_chars:
            raise ValueError(
                f"Text is too long ({len(stripped):,} characters). "
                f"The limit is {settings.max_text_chars:,} characters."
            )
        return stripped


class PredictResponse(BaseModel):
    label: str = Field(..., description="'AI-Generated' or 'Human-Written'")
    human_probability: float = Field(..., ge=0, le=1)
    ai_probability: float = Field(..., ge=0, le=1)
    ai_threshold: float = Field(..., description="AI probability at or above which the label is AI-Generated")
    disclaimer: str = DISCLAIMER


@app.exception_handler(RequestValidationError)
async def validation_error_handler(_: Request, exc: RequestValidationError):
    # Flatten pydantic's error list into one readable message for the frontend.
    messages = []
    for error in exc.errors():
        msg = str(error.get("msg", "Invalid input"))
        messages.append(msg.removeprefix("Value error, "))
    return JSONResponse(status_code=422, content={"detail": " ".join(messages) or "Invalid request."})


@app.get("/health")
def health():
    return {
        "status": "ok" if model_service.is_ready else "model_not_loaded",
        "model_loaded": model_service.is_ready,
        "model_path": str(model_service.model_path) if model_service.model_path else None,
        "pipeline_steps": model_service.describe(),
        "ai_threshold": model_service.ai_threshold,
        "min_words": model_service.min_words,
        "max_chars": settings.max_text_chars,
        "error": model_service.error,
    }


@app.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest):
    # The minimum comes from the model config, so it is checked here rather than in the schema.
    word_count = len(request.text.split())
    if model_service.is_ready and word_count < model_service.min_words:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Please enter at least {model_service.min_words} words (you entered {word_count}). "
                "The model is unreliable on very short texts."
            ),
        )

    try:
        result = model_service.predict(request.text)
    except ModelNotReadyError as exc:
        raise HTTPException(status_code=503, detail=f"Model not available: {exc}") from exc
    except Exception as exc:
        logging.getLogger(__name__).exception("Prediction failed")
        raise HTTPException(status_code=500, detail="Prediction failed due to an internal error.") from exc

    return PredictResponse(
        label=result.label,
        human_probability=result.human_probability,
        ai_probability=result.ai_probability,
        ai_threshold=model_service.ai_threshold,
    )
