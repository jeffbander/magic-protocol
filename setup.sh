#!/usr/bin/env bash
set -e

# Protocol Extractor - Local Development Setup
# This script sets up the project for local development.

echo "=================================================="
echo " Protocol Extractor - Local Development Setup"
echo "=================================================="
echo ""

# 1. Check Node.js version
echo "Checking Node.js version..."
NODE_VERSION=$(node --version 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1)
if [ -z "$NODE_VERSION" ] || [ "$NODE_VERSION" -lt 18 ]; then
  echo "ERROR: Node.js 18+ is required. Found: $(node --version 2>/dev/null || echo 'not installed')"
  echo "Install from: https://nodejs.org/"
  exit 1
fi
echo "  Node.js $(node --version) - OK"
echo ""

# 2. Install dependencies
echo "Installing dependencies..."
npm install
echo ""

# 3. Set up .env.local
if [ ! -f .env.local ]; then
  echo "Creating .env.local from example..."
  cp .env.local.example .env.local
  echo ""
  echo "  .env.local created. You MUST fill in the following values:"
  echo ""
  echo "    NEXT_PUBLIC_SUPABASE_URL      - Your Supabase project URL"
  echo "    NEXT_PUBLIC_SUPABASE_ANON_KEY - Your Supabase anon/public key"
  echo "    SUPABASE_SERVICE_ROLE_KEY     - Your Supabase service role key"
  echo "    ANTHROPIC_API_KEY             - Your Anthropic API key"
  echo ""
  echo "  See SETUP.md for detailed instructions on getting these values."
  echo ""
else
  echo ".env.local already exists - skipping creation"
  echo ""
fi

# 4. Run verification
echo "Running setup verification..."
node scripts/verify-setup.js

echo ""
echo "=================================================="
echo " Setup complete!"
echo "=================================================="
echo ""
echo "If all environment variables are filled in, start the dev server:"
echo ""
echo "  npm run dev"
echo ""
echo "Then open: http://localhost:3000"
echo ""
echo "See SETUP.md for Supabase and Anthropic setup instructions."
echo ""
