"""
custom_dataset.py
-----------------
Generates a small custom dataset for classification practice:
  - Email Spam Detection (binary classification)
  - Saves to data/email_spam.csv
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import accuracy_score, classification_report

np.random.seed(42)


# ── 1. Create dataset ──────────────────────────────────
spam_texts = [
    "Win a free iPhone now click here",
    "Congratulations you won a prize",
    "Buy cheap medicine online discount",
    "You have been selected for cash reward",
    "Free offer limited time click now",
    "Earn money fast from home today",
    "Claim your lottery winning immediately",
    "Hot singles in your area tonight",
    "Make $$$ working from home easily",
    "Your account has been compromised click",
    "Special discount sale 90 percent off",
    "Urgent response needed wire money",
    "Free gift card waiting for you",
    "Investment opportunity guaranteed returns now",
    "Act now before offer expires today",
]

ham_texts = [
    "Meeting scheduled for tomorrow at 10am",
    "Please review the attached report file",
    "Can we reschedule our call this week",
    "Happy birthday hope you have great day",
    "The project deadline is next Friday",
    "Looking forward to our discussion today",
    "Please find the invoice attached below",
    "Team lunch is on Thursday at noon",
    "Great work on the presentation yesterday",
    "Let me know if you need any help",
    "The quarterly results look very promising",
    "See you at the conference next month",
    "Thanks for the quick response yesterday",
    "The new feature is working perfectly now",
    "Can you share your availability this week",
]

texts  = spam_texts + ham_texts
labels = ["spam"] * 15 + ["ham"] * 15

df = pd.DataFrame({"text": texts, "label": labels})
df = df.sample(frac=1, random_state=42).reset_index(drop=True)

import os
os.makedirs("data", exist_ok=True)
df.to_csv("data/email_spam.csv", index=False)

# ── 2. Train a Naive Bayes text classifier ─────────────
print("=" * 55)
print("  Custom Dataset: Email Spam Detection")
print("=" * 55)

print(f"\n  Total samples : {len(df)}")
print(f"  Spam          : {(df.label=='spam').sum()}")
print(f"  Ham (legit)   : {(df.label=='ham').sum()}")

X_train, X_test, y_train, y_test = train_test_split(
    df["text"], df["label"], test_size=0.25, random_state=42
)

vec   = CountVectorizer(stop_words="english")
X_tr  = vec.fit_transform(X_train)
X_te  = vec.transform(X_test)

model = MultinomialNB()
model.fit(X_tr, y_train)

y_pred = model.predict(X_te)
print(f"\n  Accuracy: {accuracy_score(y_test, y_pred)*100:.1f}%")
print("\n  Classification Report:")
for line in classification_report(y_test, y_pred).splitlines():
    print("    " + line)

# ── 3. Predict custom emails ───────────────────────────
new_emails = [
    "Click here to claim your free reward now",
    "The budget report is due on Monday",
    "Limited time offer buy now save big",
]

print("  New Email Predictions:")
for email in new_emails:
    vec_email = vec.transform([email])
    pred      = model.predict(vec_email)[0]
    prob      = model.predict_proba(vec_email)[0]
    print(f"    [{pred.upper():<4}] ({max(prob)*100:.0f}%) — {email}")

print("\n  ✅ Custom dataset saved → data/email_spam.csv\n")
