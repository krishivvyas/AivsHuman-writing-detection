"""Loads the trained Logistic Regression pipeline and turns predict_proba() output into a response."""

import __main__
import importlib.util
import json
import logging
from dataclasses import dataclass
from pathlib import Path

import joblib

logger = logging.getLogger(__name__)

# Used only when no model config JSON is given: plain argmax and a minimal word count.
DEFAULT_AI_THRESHOLD = 0.5
DEFAULT_MIN_WORDS = 3


class ModelNotReadyError(RuntimeError):
    """Raised when a prediction is requested but the model could not be loaded."""


@dataclass
class Prediction:
    label: str  # "AI-Generated" or "Human-Written"
    human_probability: float
    ai_probability: float


class ModelService:
    def __init__(
        self,
        model_path: Path | None,
        ai_class_label: str,
        clean_text_path: Path | None = None,
        model_config_path: Path | None = None,
    ):
        self.model_path = model_path
        self.ai_class_label = ai_class_label
        self.clean_text_path = clean_text_path
        self.model_config_path = model_config_path
        self.ai_threshold = DEFAULT_AI_THRESHOLD
        self.min_words = DEFAULT_MIN_WORDS
        self.model = None
        self.error: str | None = None
        self._ai_index: int | None = None
        self._human_index: int | None = None

    @property
    def is_ready(self) -> bool:
        return self.model is not None

    def _fail(self, message: str) -> None:
        self.error = message
        logger.error(message)

    def _register_clean_text(self) -> bool:
        """The notebook pickled the pipeline with `__main__.clean_text` as the TF-IDF preprocessor,
        so that function must exist on __main__ before joblib can unpickle the model."""
        if self.clean_text_path is None:
            return True
        if not self.clean_text_path.is_file():
            self._fail(f"clean_text.py not found at '{self.clean_text_path}'. Update CLEAN_TEXT_PATH.")
            return False
        try:
            spec = importlib.util.spec_from_file_location("clean_text", self.clean_text_path)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            __main__.clean_text = module.clean_text
        except Exception as exc:
            self._fail(f"Could not import clean_text from '{self.clean_text_path}': {exc}")
            return False
        return True

    def _load_model_config(self) -> bool:
        if self.model_config_path is None:
            return True
        if not self.model_config_path.is_file():
            self._fail(f"Model config not found at '{self.model_config_path}'. Update MODEL_CONFIG_PATH.")
            return False
        try:
            config = json.loads(self.model_config_path.read_text(encoding="utf-8"))
            self.ai_threshold = float(config.get("ai_threshold", DEFAULT_AI_THRESHOLD))
            self.min_words = int(config.get("min_words", DEFAULT_MIN_WORDS))
        except (ValueError, TypeError, AttributeError) as exc:
            self._fail(f"Invalid model config '{self.model_config_path}': {exc}")
            return False
        if not 0 < self.ai_threshold < 1:
            self._fail(f"ai_threshold must be between 0 and 1, got {self.ai_threshold}.")
            return False
        return True

    def load(self) -> None:
        """Load the model once at startup. On failure, store a setup message instead of raising."""
        if self.model_path is None:
            self._fail(
                "MODEL_PATH is not set. Copy backend/.env.example to backend/.env and set MODEL_PATH "
                "to your improved_lr_pipeline.joblib file."
            )
            return

        if not self.model_path.is_file():
            self._fail(
                f"Model file not found at '{self.model_path}'. Copy improved_lr_pipeline.joblib from "
                "Kaggle and update MODEL_PATH."
            )
            return

        if not self._load_model_config() or not self._register_clean_text():
            return

        try:
            model = joblib.load(self.model_path)
        except AttributeError as exc:
            if "clean_text" in str(exc):
                self._fail(
                    "The model needs the clean_text() function it was trained with. "
                    "Set CLEAN_TEXT_PATH to your clean_text.py file."
                )
            else:
                self._fail(f"Could not load model from '{self.model_path}': {exc}")
            return
        except Exception as exc:  # unpickling errors vary widely (version mismatch, corrupt file, ...)
            logger.exception("Model load failed")
            self._fail(
                f"Could not load model from '{self.model_path}': {type(exc).__name__}: {exc}. "
                "Check that scikit-learn matches the version used on Kaggle (see requirements.txt)."
            )
            return

        if not hasattr(model, "predict_proba") or not hasattr(model, "classes_"):
            self._fail("The loaded object is not a fitted classifier with predict_proba().")
            return

        classes = [str(c) for c in model.classes_]
        if len(classes) != 2 or self.ai_class_label not in classes:
            self._fail(
                f"Model classes are {classes}, but AI_CLASS_LABEL is '{self.ai_class_label}'. "
                "Set AI_CLASS_LABEL to the class value that means AI-generated."
            )
            return

        self._ai_index = classes.index(self.ai_class_label)
        self._human_index = 1 - self._ai_index
        self.model = model
        self.error = None
        logger.info(
            "Loaded model from %s (classes=%s, ai_threshold=%s, min_words=%s)",
            self.model_path, classes, self.ai_threshold, self.min_words,
        )

    def predict(self, text: str) -> Prediction:
        if not self.is_ready:
            raise ModelNotReadyError(self.error or "Model is not loaded.")

        probabilities = self.model.predict_proba([text])[0]
        ai_probability = float(probabilities[self._ai_index])
        human_probability = float(probabilities[self._human_index])
        # The tuned threshold from the notebook: text is only called AI when the model is confident enough.
        label = "AI-Generated" if ai_probability >= self.ai_threshold else "Human-Written"
        return Prediction(label, human_probability, ai_probability)

    def describe(self) -> dict:
        """Pipeline structure, for the /health endpoint."""
        if not self.is_ready:
            return {}
        described = {}
        for name, step in getattr(self.model, "named_steps", {}).items():
            parts = getattr(step, "transformer_list", None)
            if parts:
                described[name] = {sub: type(t).__name__ for sub, t in parts}
            else:
                described[name] = type(step).__name__
        return described
