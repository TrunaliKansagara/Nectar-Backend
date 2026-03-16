# Nectar Backend

Production-ready, scalable Node.js (Express) + TypeScript backend foundation for **Nectar**.

## Tech Stack
- Node.js, Express.js, TypeScript
- PostgreSQL (`pg`) + Supabase client ready
- `dotenv` environment configuration
- Centralized response + error handling
- ESLint + Prettier

## Getting Started

### 1) Install dependencies
```bash
npm install
```

### 2) Configure environment
```bash
cp .env.example .env
```
Fill the values in `.env`.

### 3) Run in development
```bash
npm run dev
```

### 4) Build & run production
```bash
npm run build
npm start
```

## Health Check
`GET /health`

Response:
```json
{
  "status": "OK",
  "message": "Nectar backend is running"
}
```

## Project Structure
`src/` contains the application code organized by responsibility:
- `config/` environment, database, supabase client
- `middleware/` auth/validation placeholders, global error middleware
- `routes/` route registration (currently only health)
- `controllers/`, `services/` clean separation for future APIs (not implemented yet)
- `utils/` logger + response handler
- `constants/` messages and status codes

