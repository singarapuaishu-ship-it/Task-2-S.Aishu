"""
AI Data Classification Project
================================
A complete supervised learning pipeline demonstrating:
- Dataset loading and exploration
- Train/test splitting
- Multiple classification algorithms
- Model evaluation and comparison
"""

import os
import json
import numpy as np
import pandas as pd
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.metrics import (
    accuracy_score, classification_report,
    confusion_matrix
)
import warnings
warnings.filterwarnings("ignore")


# ─────────────────────────────────────────────
# 1. LOAD AND UNDERSTAND THE DATASET
# ─────────────────────────────────────────────
def load_and_explore():
    print("=" * 55)
    print("  AI DATA CLASSIFICATION PROJECT")
    print("=" * 55)
    print("\n📂 Step 1: Loading Dataset (Iris)\n")

    iris = load_iris()
    df = pd.DataFrame(iris.data, columns=iris.feature_names)
    df["species"] = pd.Categorical.from_codes(iris.target, iris.target_names)

    print(f"  Shape         : {df.shape[0]} rows × {df.shape[1]} columns")
    print(f"  Features      : {list(iris.feature_names)}")
    print(f"  Target Classes: {list(iris.target_names)}")
    print(f"\n  Class Distribution:")
    for cls, cnt in df["species"].value_counts().items():
        print(f"    {cls:<20} {cnt} samples")

    print("\n  First 5 rows:")
    print(df.head().to_string(index=False))

    print("\n  Basic Statistics:")
    print(df.describe().round(2).to_string())

    # Save dataset
    os.makedirs("data", exist_ok=True)
    df.to_csv("data/iris_dataset.csv", index=False)
    print("\n  ✅ Dataset saved → data/iris_dataset.csv")

    return iris.data, iris.target, iris.target_names, df


# ─────────────────────────────────────────────
# 2. SPLIT DATA INTO TRAIN / TEST SETS
# ─────────────────────────────────────────────
def split_data(X, y):
    print("\n" + "=" * 55)
    print("  Step 2: Splitting Data (80 % Train / 20 % Test)")
    print("=" * 55)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s  = scaler.transform(X_test)

    print(f"\n  Training samples : {len(X_train)}")
    print(f"  Testing  samples : {len(X_test)}")
    print("  Feature scaling  : StandardScaler applied ✅")

    return X_train_s, X_test_s, y_train, y_test, scaler


# ─────────────────────────────────────────────
# 3. TRAIN & EVALUATE CLASSIFIERS
# ─────────────────────────────────────────────
def train_and_evaluate(X_train, X_test, y_train, y_test, target_names):
    print("\n" + "=" * 55)
    print("  Step 3: Training Classification Models")
    print("=" * 55)

    classifiers = {
        "Decision Tree"     : DecisionTreeClassifier(max_depth=4, random_state=42),
        "K-Nearest Neighbors": KNeighborsClassifier(n_neighbors=5),
        "Naive Bayes"       : GaussianNB(),
    }

    results = {}
    os.makedirs("results", exist_ok=True)

    for name, clf in classifiers.items():
        print(f"\n  ── {name} ──")

        clf.fit(X_train, y_train)
        y_pred   = clf.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)

        cv_scores = cross_val_score(clf, X_train, y_train, cv=5)
        cm        = confusion_matrix(y_test, y_pred)
        report    = classification_report(y_test, y_pred,
                                          target_names=target_names,
                                          output_dict=True)

        print(f"    Test Accuracy      : {accuracy*100:.2f}%")
        print(f"    CV Accuracy (5-fold): {cv_scores.mean()*100:.2f}% "
              f"(±{cv_scores.std()*100:.2f}%)")

        print("\n    Classification Report:")
        report_str = classification_report(y_test, y_pred,
                                           target_names=target_names)
        for line in report_str.splitlines():
            print("    " + line)

        print("    Confusion Matrix:")
        cm_df = pd.DataFrame(cm, index=target_names, columns=target_names)
        print(cm_df.to_string())

        results[name] = {
            "accuracy"   : round(accuracy, 4),
            "cv_mean"    : round(cv_scores.mean(), 4),
            "cv_std"     : round(cv_scores.std(), 4),
            "confusion_matrix": cm.tolist(),
            "report"     : report,
        }

    # Save all results
    with open("results/all_results.json", "w") as f:
        json.dump(results, f, indent=2)
    print("\n  ✅ Results saved → results/all_results.json")

    return results, classifiers


# ─────────────────────────────────────────────
# 4. SUMMARY COMPARISON
# ─────────────────────────────────────────────
def print_summary(results):
    print("\n" + "=" * 55)
    print("  Step 4: Model Comparison Summary")
    print("=" * 55)

    summary = pd.DataFrame([
        {
            "Model"       : name,
            "Test Acc %"  : f"{v['accuracy']*100:.2f}",
            "CV Acc %"    : f"{v['cv_mean']*100:.2f}",
            "CV Std %"    : f"{v['cv_std']*100:.2f}",
        }
        for name, v in results.items()
    ])
    print("\n" + summary.to_string(index=False))

    best = max(results, key=lambda k: results[k]["accuracy"])
    print(f"\n  🏆 Best Model: {best} "
          f"({results[best]['accuracy']*100:.2f}% accuracy)")

    summary.to_csv("results/model_comparison.csv", index=False)
    print("  ✅ Comparison saved → results/model_comparison.csv")


# ─────────────────────────────────────────────
# 5. PREDICT NEW SAMPLES
# ─────────────────────────────────────────────
def predict_new_samples(classifiers, scaler, target_names):
    print("\n" + "=" * 55)
    print("  Step 5: Predicting New Samples")
    print("=" * 55)

    new_samples = np.array([
        [5.1, 3.5, 1.4, 0.2],   # likely setosa
        [6.3, 3.3, 4.7, 1.6],   # likely versicolor
        [6.7, 3.0, 5.2, 2.3],   # likely virginica
    ])
    new_scaled = scaler.transform(new_samples)

    print("\n  Sample Features → [sepal_len, sepal_wid, petal_len, petal_wid]")
    for i, sample in enumerate(new_samples):
        print(f"\n  Sample {i+1}: {sample}")
        for name, clf in classifiers.items():
            pred = clf.predict(new_scaled[[i]])[0]
            prob = clf.predict_proba(new_scaled[[i]])[0]
            top  = target_names[np.argmax(prob)]
            print(f"    {name:<25} → {target_names[pred]:<15}"
                  f"(conf: {max(prob)*100:.1f}%)")


# ─────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────
if __name__ == "__main__":
    X, y, target_names, df = load_and_explore()
    X_train, X_test, y_train, y_test, scaler = split_data(X, y)
    results, classifiers = train_and_evaluate(X_train, X_test,
                                               y_train, y_test,
                                               target_names)
    print_summary(results)
    predict_new_samples(classifiers, scaler, target_names)

    print("\n" + "=" * 55)
    print("  ✅ Project Complete! Check results/ and data/ folders.")
    print("=" * 55 + "\n")
