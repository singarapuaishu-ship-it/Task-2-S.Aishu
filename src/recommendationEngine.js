/**
 * AI Recommendation Engine
 * Core logic: pattern matching, cosine similarity, weighted scoring
 */

// ─── Item Catalog ────────────────────────────────────────────────────────────
const CATALOG = [
  // Movies
  { id: "m1",  type: "movie",  title: "Interstellar",         tags: ["sci-fi","space","drama","adventure"],       rating: 8.6, year: 2014 },
  { id: "m2",  type: "movie",  title: "The Dark Knight",      tags: ["action","thriller","crime","superhero"],    rating: 9.0, year: 2008 },
  { id: "m3",  type: "movie",  title: "Inception",            tags: ["sci-fi","thriller","mystery","adventure"],  rating: 8.8, year: 2010 },
  { id: "m4",  type: "movie",  title: "The Godfather",        tags: ["crime","drama","classic"],                  rating: 9.2, year: 1972 },
  { id: "m5",  type: "movie",  title: "Parasite",             tags: ["thriller","drama","social","mystery"],      rating: 8.6, year: 2019 },
  { id: "m6",  type: "movie",  title: "Avengers: Endgame",    tags: ["action","superhero","adventure","sci-fi"],  rating: 8.4, year: 2019 },
  { id: "m7",  type: "movie",  title: "Your Name",            tags: ["romance","anime","drama","fantasy"],        rating: 8.4, year: 2016 },
  { id: "m8",  type: "movie",  title: "Get Out",              tags: ["horror","thriller","social","mystery"],     rating: 7.7, year: 2017 },

  // Books
  { id: "b1",  type: "book",   title: "Dune",                 tags: ["sci-fi","adventure","politics","classic"],  rating: 8.3, year: 1965 },
  { id: "b2",  type: "book",   title: "Sapiens",              tags: ["history","science","non-fiction","social"], rating: 8.0, year: 2011 },
  { id: "b3",  type: "book",   title: "The Alchemist",        tags: ["adventure","philosophy","classic","drama"], rating: 7.8, year: 1988 },
  { id: "b4",  type: "book",   title: "Atomic Habits",        tags: ["self-help","science","psychology"],         rating: 8.1, year: 2018 },
  { id: "b5",  type: "book",   title: "1984",                 tags: ["sci-fi","politics","classic","thriller"],   rating: 8.7, year: 1949 },
  { id: "b6",  type: "book",   title: "Harry Potter",         tags: ["fantasy","adventure","classic","magic"],    rating: 8.3, year: 1997 },
  { id: "b7",  type: "book",   title: "The Psychology of Money", tags: ["self-help","psychology","finance"],     rating: 7.9, year: 2020 },
  { id: "b8",  type: "book",   title: "Crime and Punishment", tags: ["crime","drama","philosophy","classic"],    rating: 8.4, year: 1866 },

  // Music
  { id: "s1",  type: "music",  title: "Dark Side of the Moon",tags: ["rock","classic","psychedelic","progressive"],rating: 9.1, year: 1973 },
  { id: "s2",  type: "music",  title: "Abbey Road",           tags: ["rock","classic","pop","alternative"],      rating: 9.0, year: 1969 },
  { id: "s3",  type: "music",  title: "To Pimp a Butterfly",  tags: ["hip-hop","jazz","social","drama"],         rating: 9.0, year: 2015 },
  { id: "s4",  type: "music",  title: "Blonde",               tags: ["r&b","pop","drama","alternative"],         rating: 8.9, year: 2016 },
  { id: "s5",  type: "music",  title: "Random Access Memories",tags: ["electronic","pop","funk","adventure"],    rating: 8.8, year: 2013 },
  { id: "s6",  type: "music",  title: "Thriller",             tags: ["pop","classic","dance","horror"],          rating: 8.5, year: 1982 },
  { id: "s7",  type: "music",  title: "Led Zeppelin IV",      tags: ["rock","classic","blues","adventure"],      rating: 9.0, year: 1971 },
  { id: "s8",  type: "music",  title: "Currents",             tags: ["psychedelic","alternative","electronic","mystery"], rating: 8.7, year: 2015 },

  // Games
  { id: "g1",  type: "game",   title: "The Witcher 3",        tags: ["adventure","fantasy","drama","mystery"],   rating: 9.3, year: 2015 },
  { id: "g2",  type: "game",   title: "Portal 2",             tags: ["sci-fi","mystery","puzzle","adventure"],   rating: 9.5, year: 2011 },
  { id: "g3",  type: "game",   title: "Red Dead Redemption 2",tags: ["drama","adventure","crime","classic"],     rating: 9.7, year: 2018 },
  { id: "g4",  type: "game",   title: "Hollow Knight",        tags: ["adventure","mystery","horror","classic"],  rating: 9.0, year: 2017 },
  { id: "g5",  type: "game",   title: "Cyberpunk 2077",       tags: ["sci-fi","thriller","adventure","social"],  rating: 8.1, year: 2020 },
  { id: "g6",  type: "game",   title: "Stardew Valley",       tags: ["romance","adventure","social","classic"],  rating: 9.0, year: 2016 },
  { id: "g7",  type: "game",   title: "Dark Souls III",       tags: ["horror","action","classic","mystery"],     rating: 8.9, year: 2016 },
  { id: "g8",  type: "game",   title: "Celeste",              tags: ["drama","adventure","self-help","classic"], rating: 9.3, year: 2018 },
];

// ─── All unique tags for vector space ────────────────────────────────────────
const ALL_TAGS = [...new Set(CATALOG.flatMap(item => item.tags))].sort();

// ─── Utility: build a tag frequency vector ───────────────────────────────────
function buildVector(tags) {
  return ALL_TAGS.map(t => (tags.includes(t) ? 1 : 0));
}

// ─── Cosine Similarity ───────────────────────────────────────────────────────
function cosineSimilarity(vecA, vecB) {
  const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

// ─── Jaccard Similarity (for tag overlap) ────────────────────────────────────
function jaccardSimilarity(tagsA, tagsB) {
  const setA = new Set(tagsA);
  const setB = new Set(tagsB);
  const intersection = [...setA].filter(t => setB.has(t)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

// ─── Preference Profile Builder ──────────────────────────────────────────────
function buildUserProfile(interests, preferredTypes, ratingThreshold) {
  return {
    tags: interests,
    vector: buildVector(interests),
    preferredTypes,
    ratingThreshold,
  };
}

// ─── Scoring function ─────────────────────────────────────────────────────────
function scoreItem(item, profile) {
  const itemVec  = buildVector(item.tags);

  // 1. Cosine similarity (tag vector alignment) — weight 40%
  const cosScore = cosineSimilarity(profile.vector, itemVec);

  // 2. Jaccard similarity (tag overlap ratio) — weight 35%
  const jacScore = jaccardSimilarity(profile.tags, item.tags);

  // 3. Normalised rating (0–1 scale from 0–10) — weight 15%
  const ratingScore = item.rating / 10;

  // 4. Type preference bonus — weight 10%
  const typeBonus = profile.preferredTypes.length === 0 || profile.preferredTypes.includes(item.type) ? 1 : 0.3;

  // Weighted composite score
  const finalScore = cosScore * 0.40 + jacScore * 0.35 + ratingScore * 0.15 + typeBonus * 0.10;

  return {
    ...item,
    scores: { cosine: cosScore, jaccard: jacScore, rating: ratingScore, typeBonus },
    finalScore,
    matchedTags: item.tags.filter(t => profile.tags.includes(t)),
  };
}

// ─── Main Recommendation Function ────────────────────────────────────────────
function getRecommendations({ interests = [], preferredTypes = [], ratingThreshold = 7.0, topN = 8 }) {
  if (interests.length === 0) return [];

  const profile = buildUserProfile(interests, preferredTypes, ratingThreshold);

  const scored = CATALOG
    .filter(item => item.rating >= ratingThreshold)
    .map(item => scoreItem(item, profile))
    .filter(item => item.finalScore > 0)
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, topN);

  return scored;
}

// ─── Pattern Matching: find trending tag clusters ────────────────────────────
function findPatternClusters(interests) {
  const tagCoOccurrence = {};
  CATALOG.forEach(item => {
    const matched = item.tags.filter(t => interests.includes(t));
    if (matched.length > 0) {
      item.tags.forEach(t => {
        if (!interests.includes(t)) {
          tagCoOccurrence[t] = (tagCoOccurrence[t] || 0) + matched.length;
        }
      });
    }
  });
  return Object.entries(tagCoOccurrence)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, score]) => ({ tag, relevance: score }));
}

// ─── Exports ──────────────────────────────────────────────────────────────────
if (typeof module !== "undefined") {
  module.exports = { getRecommendations, findPatternClusters, CATALOG, ALL_TAGS, cosineSimilarity, jaccardSimilarity };
}
