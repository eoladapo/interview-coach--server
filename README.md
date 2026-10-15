# Interview Coach - Backend API

Backend API for the AI-powered Software Engineering Interview Coach platform.

## Features

- 🔐 JWT-based authentication
- 🤖 AI-powered interview sessions with Google Gemini
- 🎙️ Real-time voice interviews via WebSocket
- 📊 Comprehensive interview reports and analytics
- 🎯 Skill-based assessments
- 💾 PostgreSQL database with Prisma ORM

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: SQLite (dev) / PostgreSQL (production)
- **ORM**: Prisma
- **AI**: Google Gemini API
- **Real-time**: Socket.io & WebSockets
- **Authentication**: JWT with bcrypt

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Google Gemini API key ([Get it here](https://makersuite.google.com/app/apikey))

### Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Set up environment variables**:
```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
```env
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL="file:./dev.db"

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# AI Configuration
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-2.0-flash-exp
USE_OLLAMA=false

# Optional: Ollama (local AI alternative)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:3b

# CORS
CLIENT_URL=http://localhost:5173
```

3. **Set up database**:
```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:push

# Seed database (optional)
npm run db:seed
```

4. **Start development server**:
```bash
npm run dev
```

The API will be running at `http://localhost:3000`

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:push` | Push schema changes to database |
| `npm run db:migrate` | Run migrations (production) |
| `npm run db:studio` | Open Prisma Studio (database GUI) |
| `npm run db:seed` | Seed database with sample data |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests |

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/me` | Get current user | Yes |

### Profile

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/profile` | Get user profile | Yes |
| POST | `/api/profile` | Create/update profile | Yes |

### Interviews

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/interviews` | Get user's interviews | Yes |
| POST | `/api/interviews` | Create new interview | Yes |
| GET | `/api/interviews/:id` | Get interview details | Yes |
| PATCH | `/api/interviews/:id/status` | Update interview status | Yes |
| GET | `/api/interviews/:id/report` | Get interview report | Yes |

### Questions

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/questions` | Get questions (with filters) | Yes |
| GET | `/api/questions/:id` | Get question by ID | Yes |

### Skills

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/skills` | Get all skills | Yes |
| GET | `/api/skills/progress` | Get user skill progress | Yes |

### Reports

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/reports/:sessionId` | Get interview report | Yes |

### WebSocket Events

#### Text Interview (Socket.io)

Connect to: `ws://localhost:3000`

**Client Events:**
- `interview:start` - Start interview session
- `interview:answer` - Submit answer
- `interview:end` - End interview

**Server Events:**
- `interview:question` - Receive question
- `interview:feedback` - Receive feedback
- `interview:complete` - Interview completed
- `error` - Error occurred

#### Voice Interview (WebSocket)

Connect to: `ws://localhost:3000/voice`

**Client Messages:**
- `start_interview` - Initialize voice interview
- Binary audio data - Stream audio chunks
- `stop` - End interview

**Server Messages:**
- JSON: `{ type: 'question', content: '...' }`
- JSON: `{ type: 'complete', report: {...} }`

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.ts
│   │   ├── middleware.ts
│   │   ├── routes.ts
│   │   ├── socket.ts
│   │   └── voice-socket.ts
│   ├── controllers/     # Route controllers
│   │   ├── auth.controller.ts
│   │   ├── interview.controller.ts
│   │   ├── profile.controller.ts
│   │   └── question.controller.ts
│   ├── services/        # Business logic
│   │   ├── auth.service.ts
│   │   ├── interview.service.ts
│   │   ├── ai-interviewer.service.ts
│   │   └── voice-interview.service.ts
│   ├── middleware/      # Express middleware
│   │   ├── auth.ts
│   │   ├── validation.ts
│   │   └── errorHandler.ts
│   ├── routes/          # API routes
│   │   ├── auth.routes.ts
│   │   ├── interview.routes.ts
│   │   └── ...
│   ├── utils/           # Utility functions
│   │   ├── gemini.ts
│   │   ├── jwt.ts
│   │   └── password.ts
│   ├── interfaces/      # TypeScript interfaces
│   └── index.ts         # App entry point
├── prisma/
│   ├── schema.prisma    # Database schema
│   ├── migrations/      # Database migrations
│   └── seed.ts          # Database seeder
├── .env                 # Environment variables
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Database Schema

Key models:
- **User**: Authentication and user data
- **CandidateProfile**: User preferences and interview settings
- **InterviewSession**: Interview sessions
- **Question**: Question bank
- **Skill**: Skills taxonomy
- **InterviewReport**: Generated feedback and scores
- **SkillAssessment**: Per-skill evaluations

See `prisma/schema.prisma` for full schema.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Environment mode |
| `PORT` | No | `3000` | Server port |
| `DATABASE_URL` | Yes | - | Database connection string |
| `JWT_SECRET` | Yes | - | Secret for JWT signing |
| `GEMINI_API_KEY` | Yes* | - | Google Gemini API key |
| `GEMINI_MODEL` | No | `gemini-2.0-flash-exp` | Gemini model to use |
| `USE_OLLAMA` | No | `false` | Use Ollama instead of Gemini |
| `OLLAMA_BASE_URL` | No | - | Ollama API URL |
| `OLLAMA_MODEL` | No | - | Ollama model name |
| `CLIENT_URL` | No | `http://localhost:5173` | Frontend URL for CORS |

*Required unless using Ollama

## Deployment

See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for detailed deployment instructions to Render.

Quick steps:
1. Push code to GitHub
2. Create PostgreSQL database on Render
3. Create Web Service on Render
4. Set environment variables
5. Deploy!

## Development Tips

### Database Management

```bash
# View database in browser
npm run db:studio

# Reset database
rm prisma/dev.db
npm run db:push
npm run db:seed

# Create migration
npx prisma migrate dev --name your_migration_name
```

### Testing API

Use tools like:
- **Postman**: Import endpoints
- **Thunder Client**: VS Code extension
- **curl**: Command line

Example:
```bash
# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Troubleshooting

### "Prisma Client did not initialize"
```bash
npm run db:generate
```

### Port already in use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Database locked (SQLite)
```bash
rm prisma/dev.db
npm run db:push
```

## Security

- Passwords hashed with bcrypt
- JWT tokens for authentication
- Helmet.js for security headers
- Rate limiting on auth endpoints
- Input validation with Joi
- CORS configured for frontend only

## Contributing

1. Create a feature branch
2. Make your changes
3. Add tests
4. Submit a pull request

## License

ISC

## Support

For issues and questions:
- GitHub Issues
- Email: your-email@example.com
