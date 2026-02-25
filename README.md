# EventHive Backend

Production-oriented REST API for EventHive with strict MVC + service layer architecture.

## Highlights
- JWT auth with secure HttpOnly cookie support
- Role-based access control (admin/user)
- Atomic seat booking with MongoDB transactions
- Joi validation and ObjectId checks
- Security hardening: Helmet, CORS, rate-limit, hpp, XSS clean, mongo sanitize
- Swagger docs at `/api-docs`

## Run
1. Copy `.env.example` to `.env` and fill secrets.
2. Install dependencies: `npm install`
3. Start dev server: `npm run dev`

## API Base
`/api/v1`
