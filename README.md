# RecoSpark — AI Recommendation Engine

A fully client-side AI recommendation system that matches your taste preferences
to movies, books, music, and games using vector similarity algorithms.

---

## Project Structure

```
ai-recommender/
├── index.html                   ← Main UI (open in browser)
├── src/
│   ├── recommendationEngine.js  ← Core algorithm (cosine + jaccard + scoring)
│   ├── app.js                   ← UI controller and event handling
│   ├── demo.js                  ← Node.js CLI demo
│   └── tests.js                 ← Unit test suite
├── styles/
│   └── main.css                 ← Dark-theme stylesheet
├── data/
│   └── catalog.json             ← Item catalog (32 items across 4 categories)
└── docs/
    └── algorithm.md             ← Algorithm deep-dive
```

---

## How to Run

### Browser (no install needed)
Just open `index.html` in any modern browser. No server required.

### Node.js CLI Demo
```bash
node src/demo.js
```

### Tests
```bash
node src/tests.js
```

---

## Key Concepts

### 1. Vector Space Encoding
Each item and user preference is encoded as a binary vector across all known tags.
```
Tags:  ["sci-fi", "drama", "action", ...]
User:  [  1,        1,       0,      ...]
Item:  [  1,        0,       1,      ...]
```

### 2. Cosine Similarity (40% weight)
Measures the angle between two vectors — direction alignment, not magnitude.
```
cosine(A, B) = (A · B) / (|A| × |B|)
```
- Result: 0 (no alignment) to 1 (perfect alignment)
- Best for: finding directional taste match even when tag counts differ

### 3. Jaccard Similarity (35% weight)
Measures tag overlap as a ratio of shared tags to total unique tags.
```
jaccard(A, B) = |A ∩ B| / |A ∪ B|
```
- Result: 0 (no overlap) to 1 (identical tag sets)
- Best for: penalising items with many unrelated tags

### 4. Rating Boost (15% weight)
Normalises the item's community rating to 0–1 scale:
```
ratingScore = item.rating / 10
```

### 5. Type Preference (10% weight)
Items matching selected content types receive a full 1.0 bonus;
unmatched types receive a 0.3 penalty factor.

### 6. Pattern Matching (Insights)
Finds tags that co-occur with your interests across the catalog,
revealing adjacent themes you might enjoy.

---

## Scoring Formula
```
finalScore = cosine × 0.40
           + jaccard × 0.35
           + (rating/10) × 0.15
           + typeBonus × 0.10
```

---

## Catalog
32 curated items across four categories:
- 🎬 **Movies** (8): Sci-Fi, Drama, Thriller, Crime, Horror, Romance
- 📚 **Books** (8): Classic, Sci-Fi, Self-Help, Philosophy, Crime
- 🎵 **Music** (8): Rock, Hip-Hop, Electronic, R&B, Classic
- 🎮 **Games** (8): Adventure, Mystery, Sci-Fi, Horror, Puzzle

---

## Skills Demonstrated
- ✅ Logic building (weighted scoring system)
- ✅ Pattern matching (tag co-occurrence analysis)
- ✅ Recommendation concepts (collaborative filtering principles)
- ✅ Vector algebra (cosine similarity)
- ✅ Set theory (Jaccard similarity)
- ✅ UI/UX design (interactive chip selection, match bars)
- ✅ Unit testing (assertion-based test suite)
