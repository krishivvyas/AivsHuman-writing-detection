"""API tests. Prediction tests run against the real model and are skipped if MODEL_PATH is not usable."""

import json

import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.main import app, model_service
from app.model_service import ModelService

model_available = settings.model_path is not None and settings.model_path.is_file()
needs_model = pytest.mark.skipif(not model_available, reason="MODEL_PATH not configured")

LONG_TEXT = (
    "Technology has changed the way students learn in many important ways. Online resources make it "
    "easier to research topics, collaborate with classmates, and get feedback from teachers. However, "
    "students also face more distractions than ever before, and they need to develop good habits to "
    "manage their time. In conclusion, technology offers clear benefits for education, but only when "
    "it is used thoughtfully and responsibly by both students and teachers in the classroom."
)


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:  # runs the lifespan, which loads the model
        yield c


def test_health(client):
    body = client.get("/health").json()
    assert body["model_loaded"] is model_available, body["error"]
    if model_available:
        assert body["pipeline_steps"]["classifier"] == "LogisticRegression"
        assert 0 < body["ai_threshold"] < 1


@needs_model
def test_predict_matches_pipeline_predict_proba(client):
    res = client.post("/predict", json={"text": LONG_TEXT})
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["human_probability"] + body["ai_probability"] == pytest.approx(1.0)

    # The API must return exactly what the trained pipeline produces.
    classes = [str(c) for c in model_service.model.classes_]
    expected = model_service.model.predict_proba([LONG_TEXT])[0]
    assert body["ai_probability"] == pytest.approx(expected[classes.index(settings.ai_class_label)])

    # And the label must follow the configured threshold.
    expected_label = "AI-Generated" if body["ai_probability"] >= body["ai_threshold"] else "Human-Written"
    assert body["label"] == expected_label


@pytest.mark.parametrize("text", ["", "   \n\t "])
def test_predict_rejects_empty_text(client, text):
    res = client.post("/predict", json={"text": text})
    assert res.status_code == 422
    assert "empty" in res.json()["detail"].lower()


def test_predict_rejects_missing_field(client):
    assert client.post("/predict", json={}).status_code == 422


@needs_model
def test_predict_rejects_too_few_words(client):
    res = client.post("/predict", json={"text": "just a few words here"})
    assert res.status_code == 422
    assert f"at least {model_service.min_words} words" in res.json()["detail"]


def test_threshold_decides_label(tmp_path):
    service = ModelService(None, "1")
    service.ai_threshold = 0.65
    service._ai_index, service._human_index = 1, 0

    class Fake:
        def __init__(self, p_ai):
            self.p_ai = p_ai

        def predict_proba(self, _):
            return [[1 - self.p_ai, self.p_ai]]

    service.model = Fake(0.60)
    assert service.predict("x").label == "Human-Written"  # higher than human, but below threshold
    service.model = Fake(0.70)
    assert service.predict("x").label == "AI-Generated"


def test_missing_model_file_gives_setup_error(tmp_path):
    service = ModelService(tmp_path / "does_not_exist.joblib", "1")
    service.load()
    assert not service.is_ready
    assert "not found" in service.error


def test_unset_model_path_gives_setup_error():
    service = ModelService(None, "1")
    service.load()
    assert not service.is_ready
    assert "MODEL_PATH is not set" in service.error


def test_missing_clean_text_file_gives_setup_error(tmp_path):
    model = tmp_path / "m.joblib"
    model.write_bytes(b"")
    service = ModelService(model, "1", clean_text_path=tmp_path / "clean_text.py")
    service.load()
    assert not service.is_ready
    assert "clean_text.py not found" in service.error


def test_model_config_is_read(tmp_path):
    config = tmp_path / "cfg.json"
    config.write_text(json.dumps({"ai_threshold": 0.7, "min_words": 20}))
    service = ModelService(None, "1", model_config_path=config)
    assert service._load_model_config()
    assert (service.ai_threshold, service.min_words) == (0.7, 20)
