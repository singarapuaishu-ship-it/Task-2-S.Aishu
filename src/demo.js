#!/usr/bin/env node
/**
 * RecoSpark – CLI Demo
 * Run: node src/demo.js
 */

const { getRecommendations, findPatternClusters } = require("./recommendationEngine");

const RESET  = "\x1b[0m";
const BOLD   = "\x1b[1m";
const DIM    = "\x1b[2m";
const PURPLE = "\x1b[35m";
const CYAN   = "\x1b[36m";
const GREEN  = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED    = "\x1b[31m";

function bar(score, width = 20) {
  const filled = Math.round(score * width);
  return "█".repeat(filled) + "░".repeat(width - filled);
}

function typeEmoji(type) {
  return { movie: "🎬", book: "📚", music: "🎵", game: "🎮" }[type] || "✦";
}

// ── Demo Profiles ─────────────────────────────────────────────────────────────
const profiles = [
  {
    name: "Sci-Fi & Thriller Fan",
    interests: ["sci-fi", "thriller", "mystery", "adventure"],
    preferredTypes: ["movie", "book"],
    ratingThreshold: 8.0,
    topN: 5,
  },
  {
    name: "Classic Music Lover",
    interests: ["rock", "classic", "alternative", "adventure"],
    preferredTypes: ["music", "game"],
    ratingThreshold: 8.5,
    topN: 5,
  },
  {
    name: "Drama & Philosophy Reader",
    interests: ["drama", "philosophy", "classic", "social"],
    preferredTypes: [],      // any type
    ratingThreshold: 7.5,
    topN: 5,
  },
];

// ── Run Demo ──────────────────────────────────────────────────────────────────
console.log(`\n${BOLD}${PURPLE}╔══════════════════════════════════════════╗${RESET}`);
console.log(`${BOLD}${PURPLE}║      RecoSpark AI Recommendation CLI     ║${RESET}`);
console.log(`${BOLD}${PURPLE}╚══════════════════════════════════════════╝${RESET}\n`);

profiles.forEach((profile, pi) => {
  console.log(`${BOLD}${CYAN}── Profile ${pi + 1}: ${profile.name} ──${RESET}`);
  console.log(`${DIM}Interests  : ${profile.interests.join(", ")}${RESET}`);
  console.log(`${DIM}Types      : ${profile.preferredTypes.length ? profile.preferredTypes.join(", ") : "All"}${RESET}`);
  console.log(`${DIM}Min Rating : ${profile.ratingThreshold}+${RESET}\n`);

  const results = getRecommendations(profile);

  if (results.length === 0) {
    console.log(`${RED}  No matches found.${RESET}\n`);
    return;
  }

  results.forEach((item, i) => {
    const pct = (item.finalScore * 100).toFixed(1);
    console.log(`  ${BOLD}${i + 1}. ${typeEmoji(item.type)} ${item.title}${RESET} ${DIM}(${item.year})${RESET}`);
    console.log(`     ${GREEN}${bar(item.finalScore)}${RESET} ${YELLOW}${pct}%${RESET}`);
    console.log(`     Cosine ${(item.scores.cosine*100).toFixed(0)}%  Jaccard ${(item.scores.jaccard*100).toFixed(0)}%  Rating ★${item.rating}`);
    console.log(`     Matched: ${item.matchedTags.map(t => `[${t}]`).join(" ")}`);
    console.log();
  });

  // Pattern insights
  const clusters = findPatternClusters(profile.interests);
  if (clusters.length > 0) {
    console.log(`  ${DIM}Pattern clusters (related tags you might enjoy):${RESET}`);
    clusters.forEach(c => {
      console.log(`    ${PURPLE}→${RESET} ${c.tag} (co-occurrence score: ${c.relevance})`);
    });
  }

  console.log(`\n${DIM}${"─".repeat(48)}${RESET}\n`);
});

// ── Algorithm explanation ─────────────────────────────────────────────────────
console.log(`${BOLD}Algorithm Breakdown:${RESET}`);
console.log(`  ${GREEN}Cosine Similarity  40%${RESET} – vector alignment in tag space`);
console.log(`  ${CYAN}Jaccard Overlap    35%${RESET} – tag intersection / union ratio`);
console.log(`  ${YELLOW}Rating Boost       15%${RESET} – normalised community rating`);
console.log(`  ${PURPLE}Type Preference    10%${RESET} – content type match bonus`);
console.log();
