# Etsy Listing Compliance Checker

A full-stack SaaS application that helps Etsy sellers check their product listings against Etsy's policies to avoid account suspensions.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt
- **State Management**: React Query + Context API
- **Styling**: TailwindCSS
- **Payment**: Stripe (ready for integration)

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── layout/     # Header, Sidebar, MainLayout
│   │   │   └── common/     # Buttons, inputs, etc.
│   │   ├── context/        # React Context providers
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service functions
│   │   ├── styles/         # Global CSS styles
│   │   └── types/          # TypeScript type definitions
│   ├── package.json
│   └── vite.config.ts
│
├── server/                 # Express backend
│   ├── src/
│   │   ├── config/         # Database and CORS configuration
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Auth, error handling, rate limiting
│   │   ├── routes/         # API route definitions
│   │   ├── services/       # Business logic
│   │   └── types/          # TypeScript type definitions
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── seed.ts         # Database seed script
│   └── package.json
│
└── README.md
```

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd etsy-compliance-checker
```

### 2. Set Up the Database

Create a PostgreSQL database:

```sql
CREATE DATABASE etsy_compliance;
```

### 3. Configure Environment Variables

#### Backend (`server/.env`)

Copy the example environment file and update with your values:

```bash
cd server
cp .env.example .env
```

Update the `.env` file:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/etsy_compliance?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV="development"

# Frontend URL (for CORS)
CLIENT_URL="http://localhost:5173"

# Stripe (optional - for payment integration)
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"
```

### 4. Install Dependencies

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 5. Set Up the Database Schema

```bash
cd server

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed the database with policy rules
npm run db:seed
```

### 6. Start the Development Servers

In two separate terminals:

**Backend:**
```bash
cd server
npm run dev
```

**Frontend:**
```bash
cd client
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- API Health Check: http://localhost:3001/health

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile
- `PATCH /api/auth/profile` - Update user profile

### Listings
- `GET /api/listings` - Get all listings (paginated)
- `GET /api/listings/:id` - Get a specific listing
- `POST /api/listings` - Create a new listing
- `PATCH /api/listings/:id` - Update a listing
- `DELETE /api/listings/:id` - Delete a listing

### Compliance Checks
- `POST /api/checks/listing/:listingId` - Run a compliance check
- `GET /api/checks/listing/:listingId/history` - Get check history
- `GET /api/checks/:id` - Get specific check result

### Policy Rules
- `GET /api/rules` - Get all policy rules
- `GET /api/rules/:id` - Get a specific rule

## Database Schema

### Users
- `id` - Unique identifier
- `email` - User email (unique)
- `password_hash` - Hashed password
- `subscription_tier` - FREE, BASIC, PRO, ENTERPRISE
- `subscription_status` - ACTIVE, CANCELLED, PAST_DUE, TRIALING
- `created_at`, `updated_at` - Timestamps

### Listings
- `id` - Unique identifier
- `user_id` - Reference to user
- `title`, `description` - Listing content
- `tags`, `materials` - Arrays
- `category`, `price` - Listing details
- `created_at`, `updated_at` - Timestamps

### Policy Rules
- `id` - Unique identifier
- `category` - Rule category
- `rule_name`, `rule_text` - Rule details
- `severity` - LOW, MEDIUM, HIGH, CRITICAL
- `keywords` - Trigger keywords array

### Violation Checks
- `id` - Unique identifier
- `listing_id` - Reference to listing
- `check_date` - When the check was run
- `violations_found` - Count of violations
- `status` - PENDING, IN_PROGRESS, COMPLETED, FAILED

### Violations
- `id` - Unique identifier
- `check_id` - Reference to violation check
- `policy_rule_id` - Reference to policy rule
- `violation_text`, `suggestion` - Details
- `severity` - Severity level
- `matched_text` - Text that triggered the violation

## Subscription Tiers

| Feature | FREE | BASIC | PRO | ENTERPRISE |
|---------|------|-------|-----|------------|
| Listings | 5 | 50 | 500 | Unlimited |
| Checks/month | 10 | 100 | 1,000 | Unlimited |
| Detailed Reports | - | ✓ | ✓ | ✓ |
| Bulk Checking | - | - | ✓ | ✓ |
| API Access | - | - | ✓ | ✓ |
| Custom Rules | - | - | - | ✓ |
| Price | $0 | $9/mo | $29/mo | $99/mo |

## Deployment

### Frontend (Vercel)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set the root directory to `client`
4. Add environment variables:
   - `VITE_API_URL`: Your backend API URL

### Backend (Railway/Render)

1. Push your code to GitHub
2. Create a new project on Railway or Render
3. Set the root directory to `server`
4. Add environment variables from `.env`
5. Set build command: `npm run build`
6. Set start command: `npm start`

### Database (Railway/Render/Supabase)

1. Create a PostgreSQL database instance
2. Update `DATABASE_URL` in your backend environment

## Development Commands

### Backend

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio
```

### Frontend

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License
