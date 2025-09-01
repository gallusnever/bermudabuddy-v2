#!/bin/bash

echo "🔧 Fixing deployment issues..."
echo ""

# Navigate to project root
cd /Users/rb/bermuda-buddy

# Fix 1: PyJWT is already added to requirements.txt
echo "✅ PyJWT added to requirements.txt"

# Fix 2: Update pnpm lockfile
echo "📦 Updating pnpm lockfile..."
pnpm install

# Fix 3: Show git status
echo ""
echo "📝 Changes ready to commit:"
git status --short

echo ""
echo "✅ Fixes complete! Ready to commit."
echo ""
echo "To commit and push, run:"
echo "  git add -A"
echo "  git commit -m 'fix: Add missing PyJWT dependency and update pnpm lockfile for deployment'"
echo "  git push origin main"
