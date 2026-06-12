/* app.js — AI Classification Lab frontend */

// ─── Navigation ──────────────────────────────────────────
const navItems  = document.querySelectorAll('.nav-item');
const pages     = document.querySelectorAll('.page');
const pageTitle = document.getElementById('pageTitle');
const menuBtn   = document.getElementById('menuBtn');
const sidebar   = document.getElementById('sidebar');

const pageTitles = {
  dashboard: 'Dashboard',
  models:    'Model Performance',
  dataset:   'Dataset Explorer',
  predict:   'Live Predictor',
  spam:      'Spam Detector',
  charts:    'Visualisations',
  source:    'Source Code',
};

navItems.forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    const pg = item.dataset.page;
    navItems.forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    pages.forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + pg).classList.add('active');
    pageTitle.textContent = pageTitles[pg];
    sidebar.classList.remove('open');
    onPageLoad(pg);
  });
});

menuBtn.addEventListener('click', () => sidebar.classList.toggle('open'));

// ─── Page load actions ────────────────────────────────────
const loaded = {};
function onPageLoad(pg) {
  if (loaded[pg]) return;
  loaded[pg] = true;
  if (pg === 'dashboard') loadDashboard();
  if (pg === 'models')    loadModels();
  if (pg === 'dataset')   loadDataset();
  if (pg === 'spam')      loadSpamTable();
  if (pg === 'source')    loadSource('main.py', document.querySelector('.tab.active'));
}

// ─── Dashboard ────────────────────────────────────────────
async function loadDashboard() {
  const [statsRes, resultsRes] = await Promise.all([
    fetch('/api/dataset/stats'),
    fetch('/api/results'),
  ]);
  const stats   = await statsRes.json();
  const results = await resultsRes.json();

  document.getElementById('statSamples').textContent = stats.total;

  const best = Object.entries(results)
    .sort((a,b) => b[1].accuracy - a[1].accuracy)[0];
  document.getElementById('statBest').textContent = (best[1].accuracy * 100).toFixed(1) + '%';

  // Leaderboard
  const lb = document.getElementById('leaderboard');
  const sorted = Object.entries(results).sort((a,b) => b[1].accuracy - a[1].accuracy);
  lb.innerHTML = sorted.map(([name, data], i) => `
    <div class="lb-card ${i === 0 ? 'best' : ''}">
      <div class="lb-name">${name}</div>
      <div class="lb-acc">${(data.accuracy * 100).toFixed(1)}<span style="font-size:.9rem;color:var(--muted)">%</span></div>
      <div class="lb-acc-lbl">Test Accuracy</div>
      <div class="lb-cv">CV: ${(data.cv_mean * 100).toFixed(1)}% ±${(data.cv_std * 100).toFixed(1)}%</div>
      <div class="lb-bar"><div class="lb-bar-fill" style="width:${data.accuracy * 100}%"></div></div>
    </div>
  `).join('');

  // Distribution bars
  const dist = stats.distribution;
  const total = Object.values(dist).reduce((a, b) => a + b, 0);
  ['setosa','versicolor','virginica'].forEach(sp => {
    const pct = ((dist[sp] / total) * 100).toFixed(0);
    const row = document.querySelector(`.dist-row span:first-child[textContent="${sp}"]`);
    document.querySelectorAll('.dist-row').forEach(r => {
      if (r.querySelector('span').textContent === sp) {
        r.querySelector('.bar-fill').style.width = pct + '%';
        r.querySelector('.bar-count').textContent = dist[sp];
      }
    });
  });
}

// ─── Models page ─────────────────────────────────────────
async function loadModels() {
  const res = await fetch('/api/results');
  const results = await res.json();
  const sorted = Object.entries(results).sort((a,b) => b[1].accuracy - a[1].accuracy);
  const classes = ['setosa', 'versicolor', 'virginica'];

  document.getElementById('modelsGrid').innerHTML = sorted.map(([name, data], idx) => {
    const cm = data.confusion_matrix;
    const cmHtml = cm.map((row, i) =>
      row.map((val, j) => `<div class="cm-cell ${i===j ? 'hit' : ''}">${val}</div>`).join('')
    ).join('');

    const reportRows = classes.map(cls => {
      const r = data.report[cls];
      if (!r) return '';
      return `
        <div class="metric-row"><span>${cls}</span></div>
        <div class="metric-row"><span style="padding-left:.8rem">Precision</span><span class="metric-val">${(r.precision*100).toFixed(1)}%</span></div>
        <div class="metric-row"><span style="padding-left:.8rem">Recall</span><span class="metric-val">${(r.recall*100).toFixed(1)}%</span></div>
        <div class="metric-row"><span style="padding-left:.8rem">F1-score</span><span class="metric-val">${(r['f1-score']*100).toFixed(1)}%</span></div>
      `;
    }).join('');

    return `
      <div class="model-card ${idx === 0 ? 'best' : ''}">
        <div class="model-name">${idx===0 ? '🏆 ' : ''}${name}</div>
        <div class="metric-row"><span>Test Accuracy</span><span class="metric-val">${(data.accuracy*100).toFixed(1)}%</span></div>
        <div class="metric-row"><span>CV Accuracy</span><span class="metric-val">${(data.cv_mean*100).toFixed(1)}%</span></div>
        <div class="metric-row"><span>CV Std Dev</span><span class="metric-val">±${(data.cv_std*100).toFixed(1)}%</span></div>
        ${reportRows}
        <div class="section-label" style="margin-top:1rem">Confusion Matrix</div>
        <div class="cm-grid">${cmHtml}</div>
        <div class="cm-hdr">Predicted →</div>
      </div>
    `;
  }).join('');
}

// ─── Dataset page ─────────────────────────────────────────
let currentPage = 1;

async function loadDataset(page = 1, species = 'all') {
  currentPage = page;
  const res  = await fetch(`/api/dataset?page=${page}&per_page=20&species=${species}`);
  const data = await res.json();

  document.getElementById('rowCount').textContent = `${data.total} rows`;

  const body = document.getElementById('dataBody');
  if (!data.data.length) {
    body.innerHTML = '<tr><td colspan="6" class="loading-cell">No data found</td></tr>';
    return;
  }
  const offset = (page - 1) * 20;
  body.innerHTML = data.data.map((r, i) => `
    <tr>
      <td>${offset + i + 1}</td>
      <td>${r['sepal length (cm)']}</td>
      <td>${r['sepal width (cm)']}</td>
      <td>${r['petal length (cm)']}</td>
      <td>${r['petal width (cm)']}</td>
      <td><span class="badge ${r.species}">${r.species}</span></td>
    </tr>
  `).join('');

  // Pagination
  const pg = document.getElementById('pagination');
  pg.innerHTML = '';
  for (let p = 1; p <= data.pages; p++) {
    const btn = document.createElement('button');
    btn.className = 'page-btn' + (p === page ? ' active' : '');
    btn.textContent = p;
    btn.onclick = () => loadDataset(p, document.getElementById('speciesFilter').value);
    pg.appendChild(btn);
  }

  // Stats (load once)
  if (!loaded['dataset-stats']) {
    loaded['dataset-stats'] = true;
    const sRes = await fetch('/api/dataset/stats');
    const sData = await sRes.json();
    const cols = Object.keys(sData.stats);
    document.getElementById('statsGrid').innerHTML = cols.map(col => {
      const s = sData.stats[col];
      return `
        <div class="stats-card">
          <div class="stats-card-name">${col}</div>
          <div class="stats-row"><span>Mean</span><span>${s.mean}</span></div>
          <div class="stats-row"><span>Std</span><span>${s.std}</span></div>
          <div class="stats-row"><span>Min</span><span>${s.min}</span></div>
          <div class="stats-row"><span>Max</span><span>${s.max}</span></div>
          <div class="stats-row"><span>Median</span><span>${s.median}</span></div>
        </div>
      `;
    }).join('');
  }
}

document.getElementById('speciesFilter').addEventListener('change', e => {
  loadDataset(1, e.target.value);
});

// ─── Predict ─────────────────────────────────────────────
function updateSlider(id, valId) {
  const v = document.getElementById(id).value;
  document.getElementById(valId).textContent = v;
}

function setSample(sl, sw, pl, pw) {
  document.getElementById('sl').value = sl; document.getElementById('slv').textContent = sl;
  document.getElementById('sw').value = sw; document.getElementById('swv').textContent = sw;
  document.getElementById('pl').value = pl; document.getElementById('plv').textContent = pl;
  document.getElementById('pw').value = pw; document.getElementById('pwv').textContent = pw;
  runPredict();
}

async function runPredict() {
  const btn = document.getElementById('predictBtn');
  btn.textContent = '⏳ Predicting…';
  btn.disabled = true;

  const payload = {
    sepal_length: document.getElementById('sl').value,
    sepal_width:  document.getElementById('sw').value,
    petal_length: document.getElementById('pl').value,
    petal_width:  document.getElementById('pw').value,
  };

  try {
    const res  = await fetch('/api/predict', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    const data = await res.json();

    const colors = { setosa: 'var(--setosa)', versicolor: 'var(--versi)', virginica: 'var(--virgi)' };
    const classes = ['setosa', 'versicolor', 'virginica'];

    document.getElementById('predictResults').innerHTML = Object.entries(data).map(([name, r]) => `
      <div class="result-model">
        <div class="result-model-name">${name}</div>
        <div class="result-species" style="color:${colors[r.prediction] || 'var(--accent2)'}">${r.prediction}</div>
        <div class="result-conf">Confidence: <strong>${r.confidence}%</strong></div>
        <div class="prob-bars">
          ${classes.map(cls => `
            <div class="prob-row">
              <span>${cls}</span>
              <div class="prob-track"><div class="prob-fill" style="width:${r.probabilities[cls]}%;background:${colors[cls]}"></div></div>
              <span class="prob-pct">${r.probabilities[cls]}%</span>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  } catch(e) {
    document.getElementById('predictResults').innerHTML = `<p style="color:var(--red)">Error: ${e.message}</p>`;
  }

  btn.textContent = '▶ Run Prediction';
  btn.disabled = false;
}

// ─── Spam ─────────────────────────────────────────────────
function setSpamText(t) {
  document.getElementById('spamText').value = t;
  runSpam();
}

async function runSpam() {
  const text = document.getElementById('spamText').value.trim();
  if (!text) return;

  const res  = await fetch('/api/predict/spam', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ text }) });
  const data = await res.json();

  document.getElementById('spamResult').innerHTML = `
    <div class="spam-verdict ${data.label}">${data.label.toUpperCase()}</div>
    <div class="spam-conf">Confidence: ${data.confidence}%</div>
    <div class="spam-bars">
      <div class="prob-row" style="margin-top:1rem">
        <span style="font-size:.8rem">Spam</span>
        <div class="prob-track"><div class="prob-fill" style="width:${data.spam_prob}%;background:var(--red)"></div></div>
        <span class="prob-pct">${data.spam_prob}%</span>
      </div>
      <div class="prob-row" style="margin-top:.5rem">
        <span style="font-size:.8rem">Ham</span>
        <div class="prob-track"><div class="prob-fill" style="width:${data.ham_prob}%;background:var(--green)"></div></div>
        <span class="prob-pct">${data.ham_prob}%</span>
      </div>
    </div>
  `;
}

async function loadSpamTable() {
  const res  = await fetch('/api/spam');
  const data = await res.json();
  document.getElementById('spamTableBody').innerHTML = data.map((r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${r.text}</td>
      <td><span class="badge ${r.label}">${r.label}</span></td>
    </tr>
  `).join('');
}

// ─── Source code ──────────────────────────────────────────
async function loadSource(filename, btn) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.getElementById('sourceCode').textContent = 'Loading…';

  const res  = await fetch('/api/source/' + filename);
  const data = await res.json();
  if (data.error) {
    document.getElementById('sourceCode').textContent = 'Error: ' + data.error;
  } else {
    document.getElementById('sourceCode').textContent = data.code;
  }
}

// ─── Init ─────────────────────────────────────────────────
loadDashboard();
loaded['dashboard'] = true;
