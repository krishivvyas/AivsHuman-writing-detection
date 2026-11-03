# AI vs Human Text Classifier

A web app for the college Machine Learning project **AI-Generated vs Human-Generated Text Classification**.
You paste text into a React dashboard. A FastAPI backend runs it through the trained
**word + character TF-IDF + Logistic Regression** pipeline (`predict_proba()`) and sends back the
predicted class with the estimated Human and AI probabilities.

**Quick start (Windows):** double-click `run.bat`. It sets everything up on first run and starts both servers.

> These are machine-learning estimates, not proof of authorship. The probabilities show how confident
> the classifier is. They do **not** say what percentage of the text was written by AI.

## Project structure

```
New folder/
├── final_model_comparison.csv           # model metrics from the notebook
├── saved models/                        # ← exported from Kaggle (the app reads these, never modifies them)
│   ├── improved_lr_pipeline.joblib      # trained pipeline
│   ├── clean_text.py                    # text-cleaning function the pipeline was trained with
│   ├── improved_model_config.json       # {"ai_threshold": 0.65, "min_words": 50}
│   └── ai_text_detector_model.zip       # the same three files zipped (not used by the app)
├── backend/
│   ├── app/
│   │   ├── config.py          # reads settings from env / backend/.env
│   │   ├── model_service.py   # loads the pipeline + config, runs predict_proba()
│   │   └── main.py            # FastAPI app: GET /health, POST /predict
│   ├── tests/test_api.py
│   ├── models/                # optional alternative place for the model files
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/        # Header, TextInput, ResultCard, HistoryPanel, AboutModel, ...
│   │   └── lib/               # API client, sample texts, session history hook
│   ├── package.json
│   └── .env.example
└── run.bat                    # one-click start on Windows
```

## Model files: what to copy from Kaggle

The app needs **three files** from your Kaggle notebook's output (Notebook → **Output** tab). They are
also bundled in `ai_text_detector_model.zip`:

| File | Purpose | Setting in `backend/.env` |
|---|---|---|
| `improved_lr_pipeline.joblib` | Fitted `Pipeline(FeatureUnion[word TF-IDF, char TF-IDF] → LogisticRegression)` | `MODEL_PATH` |
| `clean_text.py` | The `clean_text()` preprocessor. The pipeline was pickled from the notebook with a reference to `__main__.clean_text`, so it **cannot be loaded without this file** | `CLEAN_TEXT_PATH` |
| `improved_model_config.json` | Tuned decision threshold (`ai_threshold`) and minimum input length (`min_words`) | `MODEL_CONFIG_PATH` |

In this folder they are already in `saved models/`, and `backend/.env` points to them:

```
MODEL_PATH=../saved models/improved_lr_pipeline.joblib
CLEAN_TEXT_PATH=../saved models/clean_text.py
MODEL_CONFIG_PATH=../saved models/improved_model_config.json
```

Relative paths are resolved from the `backend/` folder. If you put the files in `backend/models/`
instead, use `models/<file>` paths. If any file is missing or fails to load, the app shows a
**Setup required** banner and `/predict` returns HTTP 503. It never substitutes a different model.

**scikit-learn version:** the model was saved with scikit-learn **1.6.1**, so `requirements.txt` pins
that version. If you retrain on Kaggle with a different version, update the pin to match
(check it in the notebook with `import sklearn; sklearn.__version__`).

**Class labels:** the pipeline's classes are `[0, 1]`, taken from the dataset's `generated` column
(`1` = AI-generated). This mapping is set by `AI_CLASS_LABEL=1`.

**Decision rule:** text is labelled *AI-Generated* only when the AI probability is at least
`ai_threshold` (0.65). Otherwise it is labelled *Human-Written*. For example, a text with a 60% AI
probability is still labelled Human-Written. Texts shorter than `min_words` (50) are rejected
because the model is unreliable on them.

## Prerequisites

- Python 3.10+ (tested with 3.12)
- Node.js 18+ (tested with 22)

## 1. Backend (FastAPI)

Windows PowerShell:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env        # then edit MODEL_PATH (see above)
uvicorn app.main:app --reload --port 8000
```

macOS / Linux:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # then edit MODEL_PATH
uvicorn app.main:app --reload --port 8000
```

Check it at <http://localhost:8000/health> (`"model_loaded": true`). Interactive API docs are at
<http://localhost:8000/docs>.

> Use a virtual environment. The base Anaconda environment on this machine has a NumPy/SciPy version
> mismatch that stops scikit-learn from importing.

Run the tests (with the venv active, from `backend/`):

```bash
python -m pytest -q
```

## 2. Frontend (React + Vite + Tailwind)

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. The frontend calls `http://localhost:8000` by default. To use a
different backend URL, copy `frontend/.env.example` to `frontend/.env` and change `VITE_API_URL`.
If you serve the frontend from a different origin, add it to `ALLOWED_ORIGINS` in `backend/.env`.

## API

### `GET /health`

```json
{ "status": "ok", "model_loaded": true, "model_path": "...",
  "pipeline_steps": { "features": { "words": "TfidfVectorizer", "chars": "TfidfVectorizer" },
                      "classifier": "LogisticRegression" },
  "ai_threshold": 0.65, "min_words": 50, "max_chars": 50000, "error": null }
```

### `POST /predict`

Request:

```json
{ "text": "Paste the passage here..." }
```

Response:

```json
{
  "label": "AI-Generated",
  "human_probability": 0.112,
  "ai_probability": 0.888,
  "ai_threshold": 0.65,
  "disclaimer": "These are machine-learning estimates, not proof of authorship."
}
```

Errors return `{ "detail": "<readable message>" }`:

- `422` when the text is empty, shorter than `min_words` (50, from the model config), or longer than `MAX_TEXT_CHARS` (50,000)
- `503` when the model is not loaded (setup problem)
- `500` for an unexpected prediction failure

## Configuration (`backend/.env`)

| Variable | Default | Meaning |
|---|---|---|
| `MODEL_PATH` | *(none, required)* | Path to the `.joblib` pipeline |
| `CLEAN_TEXT_PATH` | *(none)* | Path to `clean_text.py` (required by the improved pipeline) |
| `MODEL_CONFIG_PATH` | *(none)* | Path to the JSON with `ai_threshold` and `min_words` (without it: argmax, 3 words) |
| `AI_CLASS_LABEL` | `1` | Class value that means AI-generated |
| `ALLOWED_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | CORS origins |
| `MAX_TEXT_CHARS` | `50000` | Maximum input length |

## How the model works (short version)

1. **Cleaning:** `clean_text()` lower-cases the text, straightens curly quotes, and collapses whitespace.
2. **TF-IDF, two views combined (`FeatureUnion`):**
   - words and word pairs (1–2-grams, up to 100,000 features, punctuation kept as tokens)
   - character 3–5-grams within word boundaries (up to 150,000 features), which capture style and spelling
3. **Logistic Regression** (C=0.5) gives each feature a learned weight, adds them up, and applies the
   sigmoid function to get class probabilities.
4. The label is *AI-Generated* if the AI probability is at least the tuned threshold (0.65).

Text that is unlike the training essays (other topics, very short passages, newer AI models) may
score worse than the notebook's test-set metrics suggest.
#   A i v s H u m a n - w r i t i n g - d e t e c t i o n  
 