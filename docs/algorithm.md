# Algorithm Deep-Dive

## Why Two Similarity Metrics?

### Cosine vs Jaccard

| Property | Cosine | Jaccard |
|---|---|---|
| What it measures | Angular alignment | Overlap ratio |
| Sensitive to | Direction | Exact tag match |
| Best when | Tag counts differ | Tag sets are comparable |
| Range | 0 → 1 | 0 → 1 |

Using both creates a robust signal: an item must both *align with* 
and *overlap with* your interest vector to score high.

---

## Example Walkthrough

**User interests:** `["sci-fi", "thriller"]`
**Item:** Inception – tags: `["sci-fi", "thriller", "mystery", "adventure"]`

All tags vocabulary (simplified):
```
["action", "adventure", "classic", "drama", "mystery", "sci-fi", "thriller", ...]
```

User vector:    `[0, 0, 0, 0, 0, 1, 1, ...]`
Item vector:    `[0, 1, 0, 0, 1, 1, 1, ...]`

**Cosine:**
- Dot product:  0+0+0+0+0+1+1 = 2
- |User|:       √(1²+1²) = 1.414
- |Item|:       √(1²+1²+1²+1²) = 2.000
- Cosine:       2 / (1.414 × 2.000) = **0.707**

**Jaccard:**
- Intersection: {"sci-fi", "thriller"} → 2
- Union:        {"sci-fi", "thriller", "mystery", "adventure"} → 4
- Jaccard:      2/4 = **0.500**

**Final Score:**
```
0.707 × 0.40 = 0.283  (cosine)
0.500 × 0.35 = 0.175  (jaccard)
0.880 × 0.15 = 0.132  (rating 8.8 → 0.88)
1.000 × 0.10 = 0.100  (type bonus, movie selected)
─────────────────────
Total         = 0.690  (69%)
```

---

## Pattern Clustering Algorithm

The pattern-finding function builds a tag co-occurrence map:

1. For each item in the catalog, find how many user interests it shares.
2. For every *other* tag in that item, increment its co-occurrence counter
   by the number of matched interests.
3. Sort by co-occurrence score and return top 5.

This surfaces tags that "travel with" your interests, enabling
soft recommendations for expanding taste discovery.

---

## Extending the Engine

To add collaborative filtering:
1. Store user ratings per item in localStorage.
2. Compare current user's ratings against all past user profiles.
3. Find the nearest-neighbour users (by cosine on rating vectors).
4. Recommend items highly-rated by nearest neighbours but unseen by current user.

To add more items:
- Add entries to the `CATALOG` array in `recommendationEngine.js`.
- The `ALL_TAGS` set is auto-computed — no other changes needed.
