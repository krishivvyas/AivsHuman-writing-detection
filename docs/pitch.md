# Pitch: AI vs Human Text Classifier

Source content for the 8-slide presentation `AI_vs_Human_Text_Classifier.pptx`. It covers the final model only. Each `## Slide` section can also be pasted into a slide generator.

- **Course:** ECSCI24302 – Machine Learning Essentials, Project-Based Learning
- **Core message:** The final model reads writing style, rarely flags human text, and gives evidence rather than proof.
- **Before presenting:** add team names and enrollment numbers to slide 1. Re-run the notebook, because results after Step 15 have no saved output, and update the slides if any number changes.

---

## Slide 1: Can a model tell AI writing from human writing?

- AI vs Human Text Classifier: an end-to-end Machine Learning project
- ECSCI24302 – Machine Learning Essentials, Project-Based Learning
- Team: **[Name 1 – Enrollment No.] · [Name 2 – Enrollment No.] · [Name 3 – Enrollment No.]**
- Visual: real model output, AI-Generated, Human 21.7%, AI 78.3%

## Slide 2: False AI flags harm real writers, so careful detection is the goal

- Input: raw text. Model: word + character TF-IDF with Logistic Regression. Output: class plus estimated Human and AI probabilities.
- AI text generators make it harder for teachers and editors to judge how a text was produced
- A wrong AI flag can damage a real writer, so false positives matter most
- Task: supervised binary classification on `generated` (0 = human, 1 = AI)
- Goal: keep false AI flags low, still catch most AI text, and report estimates honestly

## Slide 3: Essays, blogs and news give the model a wider view of human writing

- Main dataset after cleaning: 487,231 texts (305,797 human, 181,434 AI)
- 0 missing values or exact duplicates, 4 blank rows removed

| Source (Kaggle) | Used as | Used in the final model |
|---|---|---|
| [AI vs Human Text](https://www.kaggle.com/datasets/shanegerami/ai-vs-human-text) | Human essays and AI text | 40,000 essays for training, plus 15,000 for validation |
| [Blog Authorship Corpus](https://www.kaggle.com/datasets/rtatman/blog-authorship-corpus) | Human, 2004 | Up to 20,000 posts sampled, 50–800 words |
| [BBC Full Text](https://www.kaggle.com/datasets/alfathterry/bbc-full-text-document-classification) | Human, 2004–2005 | Full set, de-duplicated |

- Random 15–150-word snippets were added so the model learns from short text

## Slide 4: The final model reads writing style through words and characters

- Pipeline: raw text → `clean_text()` → word TF-IDF (100,000 features) + character 3–5-gram TF-IDF (150,000 features) → Logistic Regression (C = 0.5)
- Function words and punctuation are kept because they carry style
- Decision zones for the estimated AI probability: below 0.50 Human-Written, 0.50 to 0.65 Uncertain, 0.65 and above AI-Generated
- Threshold 0.65 is the highest value that still catches at least 90% of AI text on validation data
- Texts under 50 words are never labelled AI, because very short text is unreliable

## Slide 5: On held-out data, the model rarely flags human text and catches most AI

- **0.4%** of short human essay snippets wrongly flagged as AI
- **0.1%** of short human blog and news snippets wrongly flagged as AI
- **96.8%** of full-length AI essays correctly detected

| Dry test text | AI probability | Label |
|---|---|---|
| AI samples 1–3 | 99.4–100.0% | AI-Generated |
| Human sample 1 | 2.2% | Human-Written |
| Human sample 2 | 14.8% | Human-Written |
| Human sample 3 | 27.3% | Human-Written |

Six paragraphs are a sanity check, not a measurement.

## Slide 6: The model leans on punctuation and style, not only topic

Weights read from the saved final model:

- Toward AI: `like ,` 5.41 · `. this` 3.90 · `, i` 3.72 · `. however` 2.11 · `important to` 1.99 · `example ,` 1.92
- Toward Human: `. .` 5.21 · `-` 3.68 · `. "` 3.13 · `the students` 2.77 · `very` 2.68 · `because` 2.53 (size of negative weight)
- Weights are correlations in this training data, so they describe the dataset and not all AI writing

## Slide 7: Demo: the model runs behind a fast web app

- Visual: real app screenshot. Dataset sample labelled AI: 78.3% AI, 21.7% Human
- React + FastAPI + joblib: `POST /predict` calls the saved pipeline's `predict_proba()`
- Benchmarks on one laptop (Intel Core i7-1360P, one server worker): **4.6 ms** to score a 400-word text, **7.0 ms** API response for 400 words, **215 MB** server memory, stable after 500 requests

**Live demo:** double-click `run.bat`, paste unseen text of at least 50 words, then click **Analyze Text**. The app currently shows scores of 0.50–0.64 as Human-Written and rejects texts under 50 words.

## Slide 8: It gives evidence, not proof

Limitations:

- AI examples are essay-only, so AI-written blogs or news could be missed
- Held-out data guided development, so results may be slightly optimistic
- Newer AI generators may write differently
- Short and unusual text remains less reliable

Future work:

- Add AI-written blogs and news
- Test on a fresh, untouched set
- Check probability calibration
- Compare with DistilBERT
- Show Uncertain in the web app

Data from Kaggle: shanegerami/ai-vs-human-text, rtatman/blog-authorship-corpus, alfathterry/bbc-full-text-document-classification. Web app and slides built with AI coding assistance (Claude Code).

These are machine-learning estimates, not proof of authorship.
