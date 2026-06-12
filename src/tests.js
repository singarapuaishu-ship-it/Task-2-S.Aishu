/**
 * RecoSpark – Unit Tests
 * Run: node src/tests.js
 */

const {
  getRecommendations,
  findPatternClusters,
  cosineSimilarity,
  jaccardSimilarity,
  CATALOG,
  ALL_TAGS,
} = require("./recommendationEngine");

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✅ PASS  ${label}`);
    passed++;
  } else {
    console.log(`  ❌ FAIL  ${label}`);
    failed++;
  }
}

function assertEqual(a, b, label) {
  assert(a === b, `${label} (expected ${b}, got ${a})`);
}

// ─── Test Suite ───────────────────────────────────────────────────────────────
console.log("\n🧪 RecoSpark Test Suite\n");

// 1. Catalog sanity
console.log("── Catalog Integrity ──");
assert(CATALOG.length > 0, "Catalog is non-empty");
assert(ALL_TAGS.length > 0, "Tag vocabulary is non-empty");
CATALOG.forEach(item => {
  assert(item.id && item.type && item.title && item.tags && item.rating,
    `Item '${item.title}' has all required fields`);
});

// 2. Cosine Similarity
console.log("\n── Cosine Similarity ──");
assert(Math.abs(cosineSimilarity([1, 0, 1], [1, 0, 1]) - 1) < 1e-9, "Identical vectors → cosine ≈ 1");
assert(cosineSimilarity([1, 0, 0], [0, 1, 0]) === 0, "Orthogonal vectors → cosine = 0");
assert(cosineSimilarity([0, 0, 0], [1, 1, 1]) === 0, "Zero vector → cosine = 0");
const partial = cosineSimilarity([1, 1, 0], [1, 0, 0]);
assert(partial > 0 && partial < 1, "Partial overlap → 0 < cosine < 1");

// 3. Jaccard Similarity
console.log("\n── Jaccard Similarity ──");
assert(jaccardSimilarity(["a","b"], ["a","b"]) === 1, "Identical sets → jaccard = 1");
assert(jaccardSimilarity(["a"],    ["b"])     === 0, "Disjoint sets → jaccard = 0");
assert(jaccardSimilarity([],       [])        === 0, "Empty sets → jaccard = 0");
const j = jaccardSimilarity(["a","b"], ["b","c"]);
assert(Math.abs(j - 1/3) < 0.001, "Overlap of 1 in 3 → jaccard ≈ 0.333");

// 4. Recommendation results
console.log("\n── Recommendation Logic ──");
const r1 = getRecommendations({ interests: ["sci-fi", "thriller"], topN: 5 });
assert(r1.length > 0, "Returns results for known interests");
assert(r1.length <= 5, "Respects topN limit");
r1.forEach(item => assert(item.finalScore > 0, `${item.title} has positive score`));

// Results are sorted descending
for (let i = 1; i < r1.length; i++) {
  assert(r1[i - 1].finalScore >= r1[i].finalScore, `Result ${i} is correctly ordered`);
}

// Empty interests → no results
const r2 = getRecommendations({ interests: [], topN: 5 });
assert(r2.length === 0, "Empty interests → empty results");

// Rating filter
const r3 = getRecommendations({ interests: ["classic"], ratingThreshold: 9.0 });
r3.forEach(item => assert(item.rating >= 9.0, `${item.title} meets rating threshold 9.0`));

// Type filter: only movies
const r4 = getRecommendations({
  interests: ["action", "drama", "sci-fi"],
  preferredTypes: ["movie"],
  topN: 8,
});
// Type filter: movies should dominate top results
const movieResults = r4.filter(i => i.type === "movie");
const nonMovieResults = r4.filter(i => i.type !== "movie");
assert(movieResults.length > 0, "Type filter returns at least some movies");
const avgMovieScore = movieResults.reduce((s,i) => s + i.finalScore, 0) / (movieResults.length || 1);
const avgNonMovieScore = nonMovieResults.length ? nonMovieResults.reduce((s,i) => s + i.finalScore, 0) / nonMovieResults.length : 0;
assert(avgMovieScore > avgNonMovieScore, "Movies score higher on average when movie type preferred");

// 5. Pattern Clusters
console.log("\n── Pattern Matching ──");
const clusters = findPatternClusters(["sci-fi", "thriller"]);
assert(Array.isArray(clusters), "findPatternClusters returns an array");
assert(clusters.length > 0,    "Returns non-empty clusters for known interests");
clusters.forEach(c => {
  assert(c.tag && c.relevance > 0, `Cluster '${c.tag}' has valid relevance`);
});

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests.`);
if (failed === 0) {
  console.log("🎉 All tests passed!\n");
  process.exit(0);
} else {
  console.log("⚠️  Some tests failed.\n");
  process.exit(1);
}
