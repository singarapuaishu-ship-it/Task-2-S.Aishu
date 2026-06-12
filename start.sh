#!/bin/bash
# ──────────────────────────────────────────────
#  AI Classification Lab — Quick Start
# ──────────────────────────────────────────────

echo ""
echo "  🤖 AI Classification Lab"
echo "  ────────────────────────────────────"
echo ""

# Check Python
if ! command -v python3 &>/dev/null; then
  echo "  ❌ Python3 not found. Please install Python 3.10+"
  exit 1
fi

# Install dependencies
echo "  📦 Installing dependencies..."
pip install flask scikit-learn pandas numpy --quiet --break-system-packages 2>/dev/null || \
pip install flask scikit-learn pandas numpy --quiet

echo "  ✅ Dependencies ready"
echo ""
echo "  🌐 Starting server..."
echo "  ──────────────────────────────────────"
echo "  Open your browser → http://localhost:5000"
echo "  Press Ctrl+C to stop"
echo "  ──────────────────────────────────────"
echo ""

python3 app.py
