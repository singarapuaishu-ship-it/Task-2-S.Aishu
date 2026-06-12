"""
app.py — Full-Stack AI Classification Web App
Flask backend serving:
  GET  /                      → Dashboard
  GET  /api/results           → Model results JSON
  GET  /api/dataset           → Iris dataset (paginated)
  GET  /api/dataset/stats     → Dataset statistics
  GET  /api/spam              → Spam dataset
  POST /api/predict           → Live prediction (iris)
  POST /api/predict/spam      → Live spam prediction
  GET  /api/source/<file>     → Source code viewer
"""

from flask import Flask, jsonify, request, render_template, send_from_directory
import json, csv, os, math
import numpy as np
import pandas as pd
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.feature_extraction.text import CountVectorizer
import warnings
warnings.filterwarnings("ignore")

app = Flask(__name__, static_folder="static", template_folder="templates")

# ─── Bootstrap models on startup ──────────────────────
iris     = load_iris()
X, y     = iris.data, iris.target
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
scaler    = StandardScaler()
X_train_s = scaler.fit_transform(X_train)
X_test_s  = scaler.transform(X_test)

models = {
    "Decision Tree"      : DecisionTreeClassifier(max_depth=4, random_state=42),
    "K-Nearest Neighbors": KNeighborsClassifier(n_neighbors=5),
    "Naive Bayes"        : GaussianNB(),
}
for m in models.values():
    m.fit(X_train_s, y_train)

# Spam model
spam_df = pd.read_csv("data/email_spam.csv")
spam_vec = CountVectorizer(stop_words="english")
spam_X   = spam_vec.fit_transform(spam_df["text"])
spam_clf = GaussianNB()
spam_clf.fit(spam_X.toarray(), (spam_df["label"] == "spam").astype(int))

# ─── Page routes ──────────────────────────────────────
@app.route("/")
def index():
    return render_template("index.html")

# ─── API: model results ───────────────────────────────
@app.route("/api/results")
def api_results():
    with open("results/all_results.json") as f:
        data = json.load(f)
    return jsonify(data)

# ─── API: dataset ─────────────────────────────────────
@app.route("/api/dataset")
def api_dataset():
    page     = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 20))
    species_filter = request.args.get("species", "all")

    rows = []
    with open("data/iris_dataset.csv") as f:
        for r in csv.DictReader(f):
            rows.append(r)

    if species_filter != "all":
        rows = [r for r in rows if r["species"] == species_filter]

    total   = len(rows)
    pages   = math.ceil(total / per_page)
    start   = (page - 1) * per_page
    paged   = rows[start:start + per_page]

    return jsonify({
        "data": paged,
        "total": total,
        "page": page,
        "pages": pages,
        "per_page": per_page
    })

@app.route("/api/dataset/stats")
def api_dataset_stats():
    df = pd.read_csv("data/iris_dataset.csv")
    numeric = df.drop("species", axis=1)
    stats = {}
    for col in numeric.columns:
        stats[col] = {
            "mean"  : round(float(numeric[col].mean()), 3),
            "std"   : round(float(numeric[col].std()),  3),
            "min"   : round(float(numeric[col].min()),  3),
            "max"   : round(float(numeric[col].max()),  3),
            "median": round(float(numeric[col].median()),3),
        }
    distribution = df["species"].value_counts().to_dict()
    return jsonify({"stats": stats, "distribution": distribution, "total": len(df)})

# ─── API: spam dataset ────────────────────────────────
@app.route("/api/spam")
def api_spam():
    rows = []
    with open("data/email_spam.csv") as f:
        for r in csv.DictReader(f):
            rows.append(r)
    return jsonify(rows)

# ─── API: live iris prediction ────────────────────────
@app.route("/api/predict", methods=["POST"])
def api_predict():
    body = request.get_json()
    try:
        features = [
            float(body["sepal_length"]),
            float(body["sepal_width"]),
            float(body["petal_length"]),
            float(body["petal_width"]),
        ]
    except (KeyError, ValueError) as e:
        return jsonify({"error": str(e)}), 400

    arr     = np.array([features])
    arr_s   = scaler.transform(arr)
    results = {}
    for name, clf in models.items():
        pred  = clf.predict(arr_s)[0]
        probs = clf.predict_proba(arr_s)[0]
        results[name] = {
            "prediction"  : iris.target_names[pred],
            "confidence"  : round(float(max(probs)) * 100, 1),
            "probabilities": {
                iris.target_names[i]: round(float(p) * 100, 1)
                for i, p in enumerate(probs)
            }
        }
    return jsonify(results)

# ─── API: live spam prediction ────────────────────────
@app.route("/api/predict/spam", methods=["POST"])
def api_predict_spam():
    body = request.get_json()
    text = body.get("text", "").strip()
    if not text:
        return jsonify({"error": "No text provided"}), 400

    vec    = spam_vec.transform([text]).toarray()
    pred   = spam_clf.predict(vec)[0]
    prob   = spam_clf.predict_proba(vec)[0]
    label  = "spam" if pred == 1 else "ham"
    conf   = round(float(max(prob)) * 100, 1)
    return jsonify({"label": label, "confidence": conf,
                    "spam_prob": round(float(prob[1]) * 100, 1),
                    "ham_prob" : round(float(prob[0]) * 100, 1)})

# ─── API: source code viewer ──────────────────────────
@app.route("/api/source/<filename>")
def api_source(filename):
    allowed = {"main.py", "custom_dataset.py", "visualize.py", "app.py"}
    if filename not in allowed:
        return jsonify({"error": "File not found"}), 404
    with open(filename) as f:
        return jsonify({"filename": filename, "code": f.read()})

if __name__ == "__main__":
    print("\n  🤖 AI Classification Dashboard")
    print("  ──────────────────────────────")
    print("  Running at → http://localhost:5000\n")
    app.run(debug=True, host="0.0.0.0", port=5000)
