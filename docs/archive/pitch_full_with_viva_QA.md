# Pitch: AI vs Human Text Classifier

Source content for the presentation `AI_vs_Human_Text_Classifier.pptx`. Each `## Slide` section below gives the title, content and talking points for one slide, so this file can also be pasted into any slide generator.

- **Course:** ECSCI24302 – Machine Learning Essentials, Project-Based Learning
- **Project title:** End-to-End Machine Learning Project: AI-Generated vs Human-Written Text Classification
- **Core message:** Near-perfect test scores did not guarantee reliable results on other human writing. Error analysis led to a better suited final model.
- **Sources of every number:** `model_training/notebookc4a5d79b4f.ipynb`, `final_model_comparison.csv`, and the saved files in `saved models/`.
- **Colour convention:** human = teal, AI = violet, warnings and missing values = amber.

---

## Fill in before submitting

These items are not in the project files, so they are left as visible amber placeholders or need your input. Nothing was invented to fill them.

| # | Item | Where | How to get it |
|---|---|---|---|
| 1 | Team names and enrollment numbers | Slide 1 | You supply these |
| 2 | Mean CV macro F1 for tuned Logistic Regression | Slides 11, 12 | Re-run notebook cell 28 (Step 15) |
| 3 | Selected C and mean CV macro F1 for tuned Linear SVM | Slides 11, 12 | Re-run notebook cell 29 (Step 16) |
| 4 | Dataset licence and usage terms (brief, stage 2) | Report | Check each Kaggle dataset page |

**Why these are missing:** the notebook only kept its outputs up to the start of Step 15. Every later cell has no saved output, including tuning results, the SVM confusion matrix, and the v2 comparison tables. The later figures used here come from the notebook's written notes (cell 47) and `final_model_comparison.csv`. **Re-run the whole notebook before submitting** so the outputs back up the deck; the brief's checklist asks for a reproducible notebook. If re-run numbers differ from the deck, update the deck.

**Known differences you should be ready to explain:**

1. **Three outcomes vs two labels.** The notebook's final function returns Human, Uncertain or AI. The web app only shows Human-Written or AI-Generated, so scores from 0.50 to 0.64 appear as Human-Written. Texts under 50 words are rejected by the app, while the notebook still scores them but never labels them AI.
2. **Streamlit vs React + FastAPI.** The notebook's introduction plans Streamlit deployment. The real app uses React and FastAPI. Update the notebook's text if you want them to match.
3. **Hand-typed table.** Cell 53 types the comparison values by hand and calls them "corrected". Be ready to show where they came from, ideally from a re-run of cell 30.
4. **Test data reused.** The same held-out data compared model versions in Step 26. The brief warns against repeatedly inspecting test performance, so slide 21 states this as a limitation. A fresh test set is the proper fix.
5. **Thin spots in the notebook against the brief:** there is no explicit outlier analysis, and bivariate EDA covers only length by class. The outlier justification on slide 7 (genuine texts kept; TF-IDF normalisation limits their effect) is reasoning added for this deck, so make sure your team agrees with it. Adding a short outlier cell would strengthen the 20% EDA component.
6. **Final-model word weights (slide 19) are not in the notebook.** They were read directly from the saved model, using `model.named_steps["classifier"].coef_` and the `words` vectorizer's feature names. Add a cell doing this so the result is reproducible.
7. **Tuned LR C = 1.0** comes from inspecting the earlier saved `tuned_logistic_regression_pipeline.joblib`, which is no longer in the folder. A re-run of cell 28 will confirm it.

---

## Slide 1: Can a model tell AI writing from human writing?

- AI vs Human Text Classifier: an end-to-end Machine Learning project
- ECSCI24302 – Machine Learning Essentials, Project-Based Learning
- Team: **[Name 1 – Enrollment No.] · [Name 2 – Enrollment No.] · [Name 3 – Enrollment No.]**
- Visual: real model output, AI-Generated, Human 21.7%, AI 78.3%

## Slide 2: Near-perfect test scores still let human writing get flagged as AI, so we rebuilt

- **487,231** texts after cleaning, from a public Kaggle dataset
- **99.95%** best test accuracy on the original split (Tuned Linear SVM)
- **8.5% → 0.4%** short human essay snippets wrongly flagged as AI, original recipe vs final model
- Final model: word + character TF-IDF with Logistic Regression, trained on essays, short snippets, blogs and news, AI threshold 0.65, behind a React + FastAPI web app
- Scores are estimates of class membership, never proof of authorship

## Slide 3: False AI flags harm real writers, so careful detection is the goal

**Stage 1, Problem Definition**

- Input: raw text. Model: TF-IDF + Logistic Regression. Output: class plus estimated Human and AI probabilities.
- AI text generators make it harder for teachers and editors to judge how a text was produced
- A wrong AI flag can damage a real writer, so false positives matter most
- Task: supervised binary classification on `generated` (0 = human, 1 = AI)
- Expected outcome: beat a baseline, keep false AI flags low, report estimates honestly

## Slide 4: One large Kaggle dataset, extended with pre-AI human writing

**Stages 2–3, Dataset Acquisition and Understanding**

| Dataset | Source | Size | Role |
|---|---|---|---|
| AI vs Human Text | [Kaggle: shanegerami](https://www.kaggle.com/datasets/shanegerami/ai-vs-human-text) | 487,235 rows, 2 columns, 1.03 GB | Main dataset. `text` = input, `generated` = target |
| Blog Authorship Corpus | [Kaggle: rtatman](https://www.kaggle.com/datasets/rtatman/blog-authorship-corpus) | Up to 20,000 posts sampled (50–800 words) | Extra human text, 2004 |
| BBC Full Text Classification | [Kaggle: alfathterry](https://www.kaggle.com/datasets/alfathterry/bbc-full-text-document-classification) | Full set, de-duplicated | Extra human text, 2004–2005 |

- Before cleaning: 305,797 human (62.76%), 181,438 AI (37.24%)
- No identifier, numeric or categorical input columns
- The main human class is only student essays, so pre-AI blogs and news widen it with trustworthy labels

## Slide 5: The data was clean: only 4 of 487,235 rows had to be removed

**Stage 4, Data Quality Check**

- 0 missing text or labels, 0 invalid labels, 0 exact duplicates, 0 empty or non-string texts
- 4 whitespace-only rows removed, 487,231 kept
- Chunked reading (50,000 rows), SHA-256 hashes for duplicates, labels validated against {0, 1}
- After normalising case and spacing, 2 train-test pairs had effectively identical text but opposite labels (a school lunch essay and a Generic_City essay)

## Slide 6: Classes are imbalanced, so accuracy alone would mislead

**Stage 5, EDA, univariate**

- Chart: 305,797 human vs 181,434 AI (after cleaning), 62.76% / 37.24%
- Always guessing human already scores 62.76%, which is the baseline
- Macro F1 weights both classes equally; ROC-AUC measures ranking across thresholds; stratified splitting preserves the ratio
- Metric rationale: precision matters because of false flags, recall because AI text should still be caught

## Slide 7: Human texts run longer, but length alone cannot separate them

**Stage 5, EDA, bivariate, on a sample of 20,000 records (`random_state=42`)**

| | Human | AI |
|---|---|---|
| Mean words | 421.17 | 342.90 |
| Median words | 387 | 337 |
| Mean characters | 2,350.27 | 2,116.55 |
| Word range | 75–1,651 | 14–1,029 |

- Visual: the notebook's box plot of word counts
- The distributions overlap, so text content must drive the model
- Outliers are genuine texts and were kept; TF-IDF normalisation limits their effect

## Slide 8: Preprocessing stays minimal, and fitted steps see training data only

**Stages 6 and 9, Preprocessing and Train-Test Split**

- 487,235 raw → 487,231 cleaned → 341,061 training (70%) + 146,170 test (30%), stratified, `random_state=42`
- No missing values to impute; labels already 0/1; no categorical inputs, so no encoding
- TF-IDF vectors are L2-normalised by default, so no extra scaler
- Leakage control: TF-IDF inside a `Pipeline` during CV, fitted on training folds only; zero overlap between train and test indexes

## Slide 9: TF-IDF turns text into features, and its settings do the selection

**Stages 7–8, Feature Engineering and Selection**

- TF-IDF(t, d) = TF(t, d) × IDF(t)
- Training matrix 341,061 × 50,000, only 0.34% of cells non-zero, sparse CSR

| Original setting | Value | Decision |
|---|---|---|
| `ngram_range` | (1, 2) | Keep word pairs for phrase context |
| `stop_words` | english | Remove function words (later reversed) |
| `max_features` | 50,000; 30,000 in tuning | Limit features for memory and time |
| `min_df` | 2 | Drop one-off terms |
| `max_df` | 0.95 | Drop near-universal terms |
| `sublinear_tf` | True | Dampen repeated words |

## Slide 10: A baseline plus three linear models suited to sparse text

**Stages 10–12, Baseline, Model Selection, Training**

- Baseline: DummyClassifier (`most_frequent`), accuracy 62.76%
- Model 1: Multinomial Naive Bayes (`alpha=0.1`), fast and designed for word-frequency features, 97.92%
- Model 2: Logistic Regression (`liblinear`), probabilities and readable weights, 99.70% when tuned
- Model 3: Linear SVM (`LinearSVC`), maximises the margin and works well in high dimensions, 99.95% when tuned

## Slide 11: Tuning used 3-fold cross-validation on training data only

**Stage 13, Hyperparameter Tuning**

- GridSearchCV, stratified 3-fold (shuffled), scored on macro F1, refit on all training data
- One LR fit took about 3.6 minutes, so the grid was kept small; smaller C means stronger regularisation

| Model | Search space | Selected | Mean CV macro F1 |
|---|---|---|---|
| Logistic Regression | C ∈ {0.5, 1.0} | C = 1.0 | **[re-run cell 28]** |
| Linear SVM | C ∈ {0.5, 1.0} | **[re-run cell 29]** | **[re-run cell 29]** |
| Naive Bayes | Not tuned | alpha = 0.1 | Not applicable |
| Final LR v2 | Set by design, no grid | C = 0.5 | Not grid-searched; threshold chosen on validation |

## Slide 12: On the original test split, every model beat the baseline by a wide margin

**Stages 14–15, Evaluation and Comparison (brief section 14 table), 146,170 test records**

| Model | Best hyperparameters | Validation | Accuracy | Macro F1 | ROC-AUC | Observation |
|---|---|---|---|---|---|---|
| Dummy baseline | most_frequent | Not applicable | 0.6276 | 0.39 | n/a | Never predicts AI |
| Naive Bayes | alpha = 0.1 | Not tuned | 0.9792 | 0.9777 | 0.9976 | Fastest, weakest of three |
| Tuned LR | C = 1.0 | **[CV F1]** | 0.9970 | 0.9968 | 0.9999 | Gives real probabilities |
| Tuned Linear SVM | **[C]** | **[CV F1]** | 0.9995 | 0.9994 | 1.0000 | Best on this split |

Train and test come from the same essay collection, so these scores cannot show how a model handles other writing.

## Slide 13: Logistic Regression cut both error types compared with Naive Bayes

**Prediction and error plots (LR here: 50,000 features, C = 1.0, accuracy 99.71%)**

| Actual ↓ / Predicted → | NB: Human | NB: AI | LR: Human | LR: AI |
|---|---|---|---|---|
| Human (91,740) | 90,646 | 1,094 | 91,683 | 57 |
| AI (54,430) | 1,941 | 52,489 | 369 | 54,061 |

- Human flagged as AI: 1.19% → 0.06%
- AI text missed: 3.57% → 0.68%

## Slide 14: High scores hid a weakness: real human writing was flagged as AI

**Stage 16, Error Analysis**

- Original LR recipe on known human paragraphs (retrained on the 40,000-essay subsample): sample 2 = 68.2% AI, sample 3 = 65.1% AI, sample 1 = 27.9% AI
- Strongest Linear SVM features. AI: additionally, essay, important, essential, firstly. Human: people, venus, student_name, probably, percent.
- Causes: stop-word removal lost style signal; trained only on long essays (about 400 words); fixed 0.5 threshold; human class is only student essays

## Slide 15: Four changes targeted those causes directly

1. **Keep style signals:** function words and punctuation kept, character 3–5-grams added (100,000 word + 150,000 character features)
2. **Train on short text:** each essay also contributes a random 15–150-word snippet, so 40,000 essays become 80,000 rows
3. **Widen human writing:** blogs and BBC news added as human text, split 65 / 15 / 20 into train, validation and test
4. **Decide with care:** AI threshold chosen on validation data, an Uncertain zone added, regularisation raised to C = 0.5

## Slide 16: A validation-chosen threshold separates three outcomes

- Below 0.50: Human-Written. 0.50 to 0.65: Uncertain. 0.65 and above: AI-Generated.
- Rule: highest threshold on a 0.05 grid that still catches at least 90% of AI text on validation data, giving 0.65
- An earlier 99th-percentile rule (Step 22) was replaced
- Texts under 50 words are never labelled AI in the notebook
- Web demo today: two labels, 0.50–0.64 displays as Human-Written, texts under 50 words are rejected

## Slide 17: False AI flags dropped sharply while most AI essays are still caught

- Human essay snippets wrongly flagged: 8.5% (original recipe) → 0.4% (final)
- Blog and news snippets wrongly flagged: 4.3% (first improved model) → 0.1% (final)
- **96.8%** of full-length AI essays still detected; this is the price of fewer false flags

| Dry test text | Original: AI % | Final: AI % |
|---|---|---|
| AI samples 1–3 | 99.0–99.7 | 99.4–100.0 |
| Human sample 1 | 27.9 | 2.2 |
| Human sample 2 | 68.2 (wrong) | 14.8 |
| Human sample 3 | 65.1 (wrong) | 27.3 |

The Final column was re-verified against the saved model. Six paragraphs are a sanity check, not a measurement.

## Slide 18: We chose Logistic Regression v2 over the higher-scoring SVM

| Criterion | Tuned Linear SVM | Logistic Regression v2 (final) |
|---|---|---|
| Best evidence | 99.95% accuracy on the essay test split | 0.4% false flags on short essays; 96.8% of AI essays caught |
| Probability estimates | No `predict_proba`, margin scores only | Yes, `predict_proba` |
| Training text | Full student and AI essays only | Essays, short snippets, blogs and news |
| Decision rule | Fixed sign of margin | Threshold 0.65 chosen on validation |
| Interpretability | Linear weights | Linear weights over word and character features |
| Size and speed | Linear, 30,000 features | Linear, 250,000 features, about 10 MB file, runs on a laptop |

These figures come from different test conditions, so they are not head-to-head. The choice rests on suitability.

## Slide 19: The final model leans on punctuation and style, not only topic

**Stage 17, Interpretation (weights read from the saved final model)**

- Toward AI: `like ,` 5.41 · `. this` 3.90 · `, i` 3.72 · `. however` 2.11 · `important to` 1.99 · `example ,` 1.92
- Toward Human: `. .` 5.21 · `-` 3.68 · `. "` 3.13 · `the students` 2.77 · `very` 2.68 · `because` 2.53 (size of negative weight)
- Weights are correlations in this training data, so they describe the dataset and not all AI writing

## Slide 20: Demo: the final model runs behind a web app

**Stage 18, Final Prediction / Demonstration**

- Visual: real app screenshot. Dataset sample labelled AI: AI-Generated, 78.3% AI, 21.7% Human
- React + Tailwind → FastAPI (`POST /predict`, `GET /health`) → joblib pipeline (`clean_text` → TF-IDF → `predict_proba`)
- Shows a clear setup error if the model file is missing; never substitutes another model

**Live demo steps:** double-click `run.bat`, wait for the browser, click a sample button or paste unseen text of at least 50 words, then click **Analyze Text**. Keep this screenshot as a backup in case the live demo fails.

## Slide 21: Limits of this model: it gives evidence, not proof

- **AI side is essay-only:** blogs and news are human-only, so non-essay style may simply read as human. AI blog posts could be missed.
- **Test set reused:** held-out data compared model versions, so improvement figures may be slightly optimistic
- **Generators change:** newer AI models may write differently from those behind the training data
- **Subsampled training:** the final model used 40,000 essays, not all 341,061 training records
- **Small dry test:** six paragraphs show direction only
- **Label noise:** identical texts with opposite labels exist

## Slide 22: Error analysis mattered more than the top score

**Stage 19, Conclusion**

- Full pipeline completed: EDA, cleaning, TF-IDF, baseline, three models, tuning, evaluation
- Near-perfect test scores did not guarantee reliable results on other human writing
- Style features, short text, wider human data and a tuned threshold reduced false AI flags
- Future work: AI-written blogs and news; a fresh test set; transformer comparison such as DistilBERT; probability calibration; show Uncertain in the app

## Slide 23: References and acknowledgements

- Datasets: the three Kaggle links on slide 4
- Tools: Python, pandas, NumPy, Matplotlib, scikit-learn 1.6.1, joblib, kagglehub, Kaggle notebooks, FastAPI, React, Vite, Tailwind CSS
- Acknowledgement: the web application and this presentation were built with AI coding assistance (Claude Code). The brief's academic integrity section requires this. Add any other sources your team used.

---

## Brief coverage

| Pipeline stage (brief section 7) | Slide |
|---|---|
| 1 Problem Definition | 3 |
| 2 Dataset Acquisition, 3 Dataset Understanding | 4 |
| 4 Data Quality Check | 5 |
| 5 Exploratory Data Analysis | 6, 7 |
| 6 Data Preprocessing | 8 |
| 7 Feature Engineering, 8 Feature Selection | 9, 15 |
| 9 Train-Test Split | 8 |
| 10 Baseline, 11 Model Selection, 12 Model Training | 10 |
| 13 Hyperparameter Tuning | 11 |
| 14 Model Evaluation, 15 Model Comparison | 12, 13, 18 |
| 16 Error Analysis | 14, 15, 16, 17 |
| 17 Interpretation | 14, 19 |
| 18 Final Prediction / Demonstration | 20 |
| 19 Conclusion, limitations, future work | 21, 22 |

Timing: with 23 slides, plan about 20 minutes. For a shorter slot, skip slides 9, 13 and 15 in the talk and keep them for questions.

---

## Viva preparation

The brief says every team member must be able to explain the code and pipeline.

**Why this dataset and problem?** It is large, labelled and public, and fits the brief's text classification domain. False authorship accusations make the errors meaningful.

**Why macro F1 instead of only accuracy?** The classes are 63/37, so always guessing human scores 62.76%. Macro F1 averages each class's F1 equally, so the minority class counts just as much.

**What does TF-IDF do?** It scores a term by how frequent it is in a document, reduced if the term is common across documents. `sublinear_tf` dampens repeats, and vectors are L2-normalised.

**Why did you keep stop words in the final model?** Function words and punctuation carry writing style. Removing them pushed the model towards topic and formal words such as "additionally", which caused false AI flags.

**What is C in Logistic Regression and SVM?** Inverse regularisation strength. Smaller C means stronger regularisation: simpler weights and less overfitting.

**How do Logistic Regression and Linear SVM differ?** Both learn linear boundaries. Logistic Regression minimises log loss and outputs probabilities through the sigmoid function. Linear SVM maximises the margin with hinge loss and outputs distances, so it has no `predict_proba`.

**What is data leakage, and how did you prevent it?** Leakage is information from the test set influencing training. TF-IDF sits in a `Pipeline`, so it is fitted only on training folds, and the threshold was chosen on validation data. The weak point is that held-out data compared model versions, which we state as a limitation.

**Overfitting or underfitting?** Train/test scores were not recorded, but the test scores are high, so there is no sign of underfitting on the essays. The drop on unfamiliar text shows a generalisation problem across domains: a form of overfitting to the dataset's style that a same-source test split cannot detect.

**Why not choose the SVM with the best score?** It has no probabilities and was trained only on essays. The product needs reliable estimates and few false flags. The two results come from different test conditions.

**Why was 0.65 chosen?** It is the highest value on a 0.05 grid that still catches at least 90% of AI text on validation data. Raising the threshold reduces false flags but misses more AI text.

**What does "78.3% AI" mean?** It is the model's estimated probability of class 1, based on patterns in its training data. It does not mean 78.3% of the text was written by AI, and it is not proof of authorship.

**Why might the final model fail?** AI-written blogs could read as human because blogs were only human in training. Newer AI models and very short or unusual texts are also risks.

**Why is feature scaling not needed?** TF-IDF already L2-normalises each vector and all features share a similar scale.
