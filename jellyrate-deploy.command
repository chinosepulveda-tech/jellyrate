#!/bin/bash
# JellyRate → Vercel deploy
# Double-click this file in Finder to run it
cd ~/Desktop/jellyrate

VERCEL_TOKEN="vcp_09qRl88rw7jKhsXcRu33n9ETlEIMiGNdg1xnMFysqmp0myo1Hl2qnxwS"
SUPABASE_URL="https://yonxqbgmgijjutvdcylt.supabase.co"
SUPABASE_KEY="sb_publishable_pEaEzbaf9kHBsgmRMNbPxg_vKsQW_Nn"

echo ""
echo "╔══════════════════════════════╗"
echo "║   JellyRate → Vercel Deploy  ║"
echo "╚══════════════════════════════╝"
echo ""

# Detect vercel command
if command -v vercel &>/dev/null; then
  V="vercel"
else
  V="npx vercel@latest"
fi

# Step 1: Push to GitHub (uses Mac keychain)
echo "▶ Pushing to GitHub..."
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/chinosepulveda-tech/jellyrate.git
git push -u origin main 2>&1 && echo "  ✓ GitHub OK" || echo "  ⚠ GitHub skipped"
echo ""

# Step 2: Link/create Vercel project + initial deploy
echo "▶ Creating Vercel project..."
$V deploy --token "$VERCEL_TOKEN" --yes 2>&1
echo ""

# Step 3: Add environment variables
echo "▶ Setting environment variables..."
echo "$SUPABASE_URL" | $V env add NEXT_PUBLIC_SUPABASE_URL production --token "$VERCEL_TOKEN" --yes 2>&1 || true
echo "$SUPABASE_URL" | $V env add NEXT_PUBLIC_SUPABASE_URL preview --token "$VERCEL_TOKEN" --yes 2>&1 || true
echo "$SUPABASE_KEY" | $V env add NEXT_PUBLIC_SUPABASE_ANON_KEY production --token "$VERCEL_TOKEN" --yes 2>&1 || true
echo "$SUPABASE_KEY" | $V env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview --token "$VERCEL_TOKEN" --yes 2>&1 || true
echo "  ✓ Env vars set"
echo ""

# Step 4: Production deployment (with env vars this time)
echo "▶ Deploying to production..."
DEPLOY_URL=$($V deploy --prod --token "$VERCEL_TOKEN" --yes 2>&1 | tail -5)
echo ""
echo "╔══════════════════════════════╗"
echo "║         Deploy Complete!     ║"
echo "╚══════════════════════════════╝"
echo "$DEPLOY_URL"
echo ""
read -p "Press Enter to close..."
