#!/bin/bash

echo "🚀 HelpDesk Mini Deployment Script"
echo "=================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not initialized. Please run:"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
    exit 1
fi

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  You have uncommitted changes. Please commit them first:"
    git status --short
    echo ""
    read -p "Do you want to commit all changes now? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        git commit -m "Deploy: $(date)"
    else
        echo "❌ Please commit your changes before deploying"
        exit 1
    fi
fi

echo "✅ Code is ready for deployment"
echo ""
echo "📋 Next steps:"
echo "1. Push to GitHub: git push origin main"
echo "2. Choose a deployment platform:"
echo "   • Vercel (Recommended): https://vercel.com"
echo "   • Railway: https://railway.app"
echo "   • Render: https://render.com"
echo "   • Heroku: https://heroku.com"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"
echo ""
echo "🔧 Don't forget to set these environment variables:"
echo "   NODE_ENV=production"
echo "   JWT_SECRET=your-super-secret-jwt-key-here"
echo "   JWT_EXPIRES_IN=24h"
echo "   DATABASE_PATH=/path/to/your/database.db"
echo "   PORT=3000"
