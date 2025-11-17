#!/bin/bash

# Market Intelligence Platform - Setup Script
# This script sets up the development environment

set -e

echo "🚀 Setting up Market Intelligence Platform..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node --version)"
    exit 1
fi

echo "✅ Node.js $(node --version) detected"

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

echo "✅ pnpm $(pnpm --version) detected"

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend && pnpm install && cd ..

# Install backend dependencies
echo "📦 Setting up backend..."
cd backend && pnpm install && cd ..

# Copy environment file
if [ ! -f ".env" ]; then
    echo "📋 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your actual API keys and configuration"
else
    echo "✅ .env file already exists"
fi

# Copy frontend environment file
if [ ! -f "frontend/.env" ]; then
    echo "📋 Creating frontend .env file..."
    cp .env.example frontend/.env
    echo "⚠️  Please edit frontend/.env file with your Supabase configuration"
else
    echo "✅ frontend/.env file already exists"
fi

# Install Supabase CLI if not present
if ! command -v supabase &> /dev/null; then
    echo "📦 Installing Supabase CLI..."
    npm install -g supabase
fi

echo "✅ Supabase CLI installed"

# Setup git hooks
echo "🔧 Setting up git hooks..."
npx husky install

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env and frontend/.env with your API keys"
echo "2. Run 'pnpm dev' to start the development server"
echo "3. Visit http://localhost:5173 to see your application"
echo ""
echo "For more information, see README.md"