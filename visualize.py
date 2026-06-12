"""
visualize.py
------------
Generates all charts and saves them to results/:
  1. Feature distribution box plots
  2. Correlation heatmap
  3. Model accuracy comparison bar chart
  4. Decision tree visualization
  5. Confusion matrix heatmap
  6. KNN accuracy vs K value
"""

import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import seaborn as sns
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeClassifier, plot_tree
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.metrics import (
    accuracy_score, confusion_matrix, ConfusionMatrixDisplay
)
import warnings
warnings.filterwarnings("ignore")

os.makedirs("results", exist_ok=True)

PALETTE  = ["#4C72B0", "#DD8452", "#55A868"]
sns.set_theme(style="whitegrid", palette=PALETTE)
plt.rcParams.update({"figure.dpi": 130, "font.size": 11})

# ── Data ───────────────────────────────────────────────
iris = load_iris()
df   = pd.DataFrame(iris.data, columns=iris.feature_names)
df["species"] = pd.Categorical.from_codes(iris.target, iris.target_names)

X = iris.data; y = iris.target
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
scaler     = StandardScaler()
X_train_s  = scaler.fit_transform(X_train)
X_test_s   = scaler.transform(X_test)


# ── 1. Feature Box Plots ───────────────────────────────
fig, axes = plt.subplots(1, 4, figsize=(16, 5))
for ax, col in zip(axes, iris.feature_names):
    df.boxplot(column=col, by="species", ax=ax, patch_artist=True)
    ax.set_title(col, fontsize=10)
    ax.set_xlabel("")
plt.suptitle("Feature Distributions by Species", fontsize=13, y=1.02)
plt.tight_layout()
plt.savefig("results/feature_distributions.png", bbox_inches="tight")
plt.close()
print("  ✅ results/feature_distributions.png")


# ── 2. Correlation Heatmap ─────────────────────────────
fig, ax = plt.subplots(figsize=(7, 5))
corr = df.drop("species", axis=1).corr()
mask = np.triu(np.ones_like(corr, dtype=bool))
sns.heatmap(corr, annot=True, fmt=".2f", cmap="coolwarm",
            mask=mask, linewidths=0.5, ax=ax)
ax.set_title("Feature Correlation Heatmap")
plt.tight_layout()
plt.savefig("results/correlation_heatmap.png", bbox_inches="tight")
plt.close()
print("  ✅ results/correlation_heatmap.png")


# ── 3. Model Accuracy Bar Chart ────────────────────────
models = {
    "Decision Tree" : DecisionTreeClassifier(max_depth=4, random_state=42),
    "KNN (k=5)"     : KNeighborsClassifier(n_neighbors=5),
    "Naive Bayes"   : GaussianNB(),
}
names, test_acc, cv_acc = [], [], []
for name, mdl in models.items():
    mdl.fit(X_train_s, y_train)
    names.append(name)
    test_acc.append(accuracy_score(y_test, mdl.predict(X_test_s)) * 100)
    cv_acc.append(cross_val_score(mdl, X_train_s, y_train, cv=5).mean() * 100)

x    = np.arange(len(names))
w    = 0.35
fig, ax = plt.subplots(figsize=(9, 5))
b1 = ax.bar(x - w/2, test_acc, w, label="Test Accuracy",  color=PALETTE[0])
b2 = ax.bar(x + w/2, cv_acc,   w, label="CV Accuracy",    color=PALETTE[1])
ax.set_ylim(80, 105)
ax.set_ylabel("Accuracy (%)")
ax.set_title("Model Accuracy Comparison")
ax.set_xticks(x); ax.set_xticklabels(names)
ax.legend()
for rect in list(b1) + list(b2):
    h = rect.get_height()
    ax.text(rect.get_x() + rect.get_width()/2, h + 0.3, f"{h:.1f}%",
            ha="center", va="bottom", fontsize=9)
plt.tight_layout()
plt.savefig("results/model_comparison_chart.png", bbox_inches="tight")
plt.close()
print("  ✅ results/model_comparison_chart.png")


# ── 4. Decision Tree Visualization ─────────────────────
dt = models["Decision Tree"]
fig, ax = plt.subplots(figsize=(16, 7))
plot_tree(dt, feature_names=iris.feature_names,
          class_names=iris.target_names,
          filled=True, rounded=True, fontsize=9, ax=ax)
ax.set_title("Decision Tree — Trained on Iris Dataset", fontsize=13)
plt.tight_layout()
plt.savefig("results/decision_tree.png", bbox_inches="tight")
plt.close()
print("  ✅ results/decision_tree.png")


# ── 5. Confusion Matrix ────────────────────────────────
y_pred = dt.predict(X_test_s)
cm     = confusion_matrix(y_test, y_pred)
fig, ax = plt.subplots(figsize=(6, 5))
ConfusionMatrixDisplay(cm, display_labels=iris.target_names).plot(
    cmap="Blues", ax=ax, colorbar=False
)
ax.set_title("Decision Tree — Confusion Matrix")
plt.tight_layout()
plt.savefig("results/confusion_matrix.png", bbox_inches="tight")
plt.close()
print("  ✅ results/confusion_matrix.png")


# ── 6. KNN — Accuracy vs K ────────────────────────────
k_vals = range(1, 21)
k_accs = []
for k in k_vals:
    knn = KNeighborsClassifier(n_neighbors=k)
    knn.fit(X_train_s, y_train)
    k_accs.append(accuracy_score(y_test, knn.predict(X_test_s)) * 100)

fig, ax = plt.subplots(figsize=(9, 5))
ax.plot(list(k_vals), k_accs, marker="o", color=PALETTE[0], linewidth=2)
best_k = list(k_vals)[np.argmax(k_accs)]
ax.axvline(best_k, color=PALETTE[1], linestyle="--",
           label=f"Best k = {best_k}")
ax.set_xlabel("Number of Neighbours (k)")
ax.set_ylabel("Test Accuracy (%)")
ax.set_title("KNN — Accuracy vs k")
ax.legend()
plt.tight_layout()
plt.savefig("results/knn_k_selection.png", bbox_inches="tight")
plt.close()
print(f"  ✅ results/knn_k_selection.png  (best k={best_k})")

print("\n  All charts generated! ✅\n")
