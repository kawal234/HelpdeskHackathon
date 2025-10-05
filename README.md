# HelpDesk Mini - Ticketing System

A robust ticketing system with backend API and frontend web interface, featuring role-based access control, SLA tracking, and threaded communication.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation & Setup

1. **Clone and navigate to the project:**
   ```bash
   git clone <repository-url>
   cd HackathonProject
   ```

2. **Install dependencies:**
   ```bash
   npm run install:all
   ```

3. **Set up environment:**
   ```bash
   cp backend/env.example backend/.env
   ```

4. **Initialize database:**
   ```bash
   npm run migrate
   ```

5. **Start the application:**
   ```bash
   npm start
   ```

### Access the Application

- **🌐 Web Interface:** http://localhost:3000
- **📚 API Documentation:** http://localhost:3000/api
- **🏥 Health Check:** http://localhost:3000/health

### Default Login Credentials

| Role  | Email | Password | Username |
|-------|-------|----------|----------|
| Admin | admin@helpdesk.com | Admin123! | admin |
| Agent | agent1@helpdesk.com | Agent123! | agent1 |
| User  | user1@helpdesk.com | User123! | user1 |
| User  | user2@helpdesk.com | User123! | user2 |

## 📁 Project Structure

```
├── backend/                    # Backend API server
│   ├── src/                   # Server-side code
│   ├── database/              # Database files
│   ├── tests/                 # Test files
│   └── package.json           # Backend dependencies
├── frontend/                  # Frontend web interface
│   ├── public/                # HTML files and static assets
│   └── demo.js                # API demo script
└── package.json               # Root project configuration
```

## 🛠️ Available Scripts

```bash
# Install all dependencies
npm run install:all

# Start the server
npm start

# Start in development mode (with auto-reload)
npm run dev

# Run database migrations
npm run migrate

# Run tests
npm test
```

## 🎯 Features

- **Ticket Management**: Create, read, update, and track support tickets
- **Role-Based Access Control**: User, Agent, and Admin roles
- **SLA Tracking**: Automatic SLA calculation and breach detection
- **Threaded Communication**: Comments system with parent-child relationships
- **Full-Text Search**: Search across tickets and comments
- **Rate Limiting**: 60 requests per minute per user
- **Idempotency**: Safe retry for POST requests

## 🔧 Configuration

Environment variables in `backend/.env`:

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
DATABASE_PATH=./database/helpdesk.db
```

## 🧪 Testing

Run the test suite:
```bash
npm test
```

## 🚀 Deployment

Deploy your application to make it live! See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### Quick Deploy Options:

1. **Vercel (Recommended)**: Free, easy setup, automatic deployments
2. **Railway**: Great for apps with databases
3. **Render**: Free hosting with automatic deployments
4. **Heroku**: Popular platform with good documentation

### Quick Start:
```bash
# Run the deployment helper
./deploy.sh

# Or manually:
git add .
git commit -m "Deploy to production"
git push origin main
```

Then follow the platform-specific instructions in [DEPLOYMENT.md](./DEPLOYMENT.md).

## 🔧 Troubleshooting

### Common Issues

**Port Already in Use:**
```bash
pkill -f "node src/server.js"
```

**Database Issues:**
```bash
npm run migrate
```

**Reset Everything:**
```bash
pkill -f "node src/server.js"
rm -f backend/database/helpdesk.db
rm -rf backend/node_modules
npm run install:all
npm run migrate
npm start
```

## 📝 License

MIT License