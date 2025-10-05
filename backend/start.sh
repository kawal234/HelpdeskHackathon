#!/bin/bash

echo "🚀 Starting HelpDesk Mini Application"
echo "====================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Navigate to project directory
cd "$(dirname "$0")"

echo "📁 Project directory: $(pwd)"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed successfully"
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚙️  Setting up environment variables..."
    cp env.example .env
    echo "✅ Environment variables configured"
fi

# Check if database exists
if [ ! -f "database/helpdesk.db" ]; then
    echo "🗄️  Initializing database..."
    npm run migrate
    if [ $? -ne 0 ]; then
        echo "❌ Failed to initialize database"
        exit 1
    fi
    echo "✅ Database initialized with sample data"
fi

# Check if port 3000 is available
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 3000 is already in use. Stopping existing processes..."
    pkill -f "node src/server.js" 2>/dev/null || true
    sleep 2
fi

echo "🌐 Starting server..."
echo ""
echo "📋 Access URLs:"
echo "   • Web Interface: http://localhost:3000"
echo "   • API Documentation: http://localhost:3000/api"
echo "   • Health Check: http://localhost:3000/health"
echo ""
echo "🔑 Login Credentials:"
echo "   • Admin: admin@helpdesk.com / Admin123!"
echo "   • Agent: agent1@helpdesk.com / Agent123!"
echo "   • User: user1@helpdesk.com / User123!"
echo ""
echo "Press Ctrl+C to stop the server"
echo "====================================="

# Start the server
npm start

