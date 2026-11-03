"""Application settings, read from environment variables (or backend/.env)."""

import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent

# Load backend/.env if present. Real environment variables take precedence.
load_dotenv(BACKEND_DIR / ".env")


def _resolve_path(raw: str | None) -> Path | None:
    """Relative paths are resolved against the backend folder, not the shell's cwd."""
    if not raw or not raw.strip():
        return None
    path = Path(raw.strip().strip('"').strip("'")).expanduser()
    if not path.is_absolute():
        path = BACKEND_DIR / path
    return path.resolve()


def _split_csv(raw: str) -> list[str]:
    return [item.strip() for item in raw.split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
    # Path to the trained scikit-learn pipeline (.joblib). Required - no default is guessed.
    model_path: Path | None = field(default_factory=lambda: _resolve_path(os.getenv("MODEL_PATH")))
    # Python file defining clean_text(), which the pipeline's TF-IDF vectorizers use as preprocessor.
    clean_text_path: Path | None = field(default_factory=lambda: _resolve_path(os.getenv("CLEAN_TEXT_PATH")))
    # JSON with {"ai_threshold": ..., "min_words": ...} saved alongside the model.
    model_config_path: Path | None = field(
        default_factory=lambda: _resolve_path(os.getenv("MODEL_CONFIG_PATH"))
    )
    # The class value the model uses for AI-generated text (the dataset's `generated` column: 1 = AI).
    ai_class_label: str = field(default_factory=lambda: os.getenv("AI_CLASS_LABEL", "1").strip())
    allowed_origins: list[str] = field(
        default_factory=lambda: _split_csv(
            os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
        )
    )
    max_text_chars: int = field(default_factory=lambda: int(os.getenv("MAX_TEXT_CHARS", "50000")))


settings = Settings()
