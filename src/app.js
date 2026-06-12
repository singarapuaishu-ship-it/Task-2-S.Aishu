/**
 * RecoSpark – App Controller
 * Handles UI state, chip selection, and rendering results
 */

// ─── State ────────────────────────────────────────────────────────────────────
const state = {
  selectedTypes: ["movie", "book", "music", "game"],
  selectedTags:  [],
  ratingThreshold: 7.5,
  topN: 8,
};

// ─── DOM Refs ─────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

// ─── Chip Toggle Logic ────────────────────────────────────────────────────────
function initChips() {
  // Type chips (toggle in/out of selectedTypes)
  document.querySelectorAll(".type-chip").forEach(btn => {
    btn.addEventListener("click", () => {
      const val = btn.dataset.value;
      if (state.selectedTypes.includes(val)) {
        if (state.selectedTypes.length === 1) return; // keep at least 1
        state.selectedTypes = state.selectedTypes.filter(t => t !== val);
        btn.classList.remove("active");
      } else {
        state.selectedTypes.push(val);
        btn.classList.add("active");
      }
    });
  });

  // Tag chips
  document.querySelectorAll(".tag-chip").forEach(btn => {
    btn.addEventListener("click", () => {
      const val = btn.dataset.value;
      if (state.selectedTags.includes(val)) {
        state.selectedTags = state.selectedTags.filter(t => t !== val);
        btn.classList.remove("active");
      } else {
        state.selectedTags.push(val);
        btn.classList.add("active");
      }
    });
  });

  // Count chips
  document.querySelectorAll(".count-chip").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".count-chip").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.topN = parseInt(btn.dataset.value, 10);
    });
  });
}

// ─── Rating Slider ────────────────────────────────────────────────────────────
function initSlider() {
  const slider = $("ratingSlider");
  const valDisplay = $("ratingVal");
  slider.addEventListener("input", () => {
    state.ratingThreshold = parseFloat(slider.value);
    valDisplay.textContent = slider.value + "+";
  });
}

// ─── Render a single result card ──────────────────────────────────────────────
function typeEmoji(type) {
  return { movie: "🎬", book: "📚", music: "🎵", game: "🎮" }[type] || "✦";
}

function renderCard(item) {
  const matchPct = Math.round(item.finalScore * 100);
  const barWidth = Math.min(matchPct, 100);

  const tagPills = item.tags.map(t => {
    const matched = item.matchedTags.includes(t);
    return `<span class="tag-pill ${matched ? "matched" : ""}">${t}</span>`;
  }).join("");

  return `
    <article class="result-card" style="animation-delay:${Math.random() * 0.3}s">
      <div class="card-type-badge">${typeEmoji(item.type)} ${item.type}</div>
      <h3 class="card-title">${item.title}</h3>
      <p class="card-year">${item.year}</p>

      <div class="match-bar-wrap">
        <div class="match-label">
          <span>Match</span><span class="match-pct">${matchPct}%</span>
        </div>
        <div class="match-bar-track">
          <div class="match-bar-fill" style="width:${barWidth}%"></div>
        </div>
      </div>

      <div class="card-scores">
        <div class="score-item">
          <span class="score-name">Cosine</span>
          <span class="score-val">${(item.scores.cosine * 100).toFixed(0)}%</span>
        </div>
        <div class="score-item">
          <span class="score-name">Jaccard</span>
          <span class="score-val">${(item.scores.jaccard * 100).toFixed(0)}%</span>
        </div>
        <div class="score-item">
          <span class="score-name">Rating</span>
          <span class="score-val">★ ${item.rating}</span>
        </div>
      </div>

      <div class="tag-pills">${tagPills}</div>
    </article>
  `;
}

// ─── Show Insights ────────────────────────────────────────────────────────────
function showInsights(interests) {
  const clusters = findPatternClusters(interests);
  if (clusters.length === 0) return;

  const insightBox  = $("insightBox");
  const insightTags = $("insightTags");

  insightTags.innerHTML = clusters.map(c =>
    `<span class="insight-tag">${c.tag} <em>${c.relevance}</em></span>`
  ).join("");

  insightBox.style.display = "block";
}

// ─── Main Recommend Handler ───────────────────────────────────────────────────
function handleRecommend() {
  const btn = $("recommendBtn");
  btn.classList.add("loading");
  btn.textContent = "Matching…";

  setTimeout(() => {
    const results = getRecommendations({
      interests: state.selectedTags,
      preferredTypes: state.selectedTypes,
      ratingThreshold: state.ratingThreshold,
      topN: state.topN,
    });

    const grid   = $("resultsGrid");
    const empty  = $("emptyState");
    const algo   = $("algoPanel");
    const count  = $("resultsCount");
    const title  = $("resultsTitle");

    if (state.selectedTags.length === 0) {
      empty.style.display = "flex";
      empty.querySelector(".empty-title").textContent = "No genres selected";
      empty.querySelector(".empty-sub").textContent   = "Pick at least one genre to get recommendations.";
      grid.innerHTML = "";
      algo.style.display = "none";
      count.textContent  = "";
    } else if (results.length === 0) {
      empty.style.display = "flex";
      empty.querySelector(".empty-title").textContent = "No matches found";
      empty.querySelector(".empty-sub").textContent   = "Try lowering the rating threshold or adding more genres.";
      grid.innerHTML = "";
      algo.style.display = "none";
      count.textContent  = "";
    } else {
      empty.style.display = "none";
      grid.innerHTML = results.map(renderCard).join("");
      algo.style.display  = "block";
      count.textContent   = `${results.length} found`;
      title.textContent   = `Recommended for You`;
      showInsights(state.selectedTags);
    }

    btn.classList.remove("loading");
    btn.innerHTML = '<span class="btn-icon">✦</span> Get Recommendations';
  }, 400);
}

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initChips();
  initSlider();
  $("recommendBtn").addEventListener("click", handleRecommend);
});
