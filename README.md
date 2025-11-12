# Protocol Extractor

AI-powered clinical trial protocol extraction and study management platform.

## Features

- **AI Protocol Extraction**: Upload protocol PDFs and automatically extract key study data using Claude AI
- **Role-Based Access**: Support for PIs, Research Coordinators, and Admins with appropriate permissions
- **Study Management**: Create, view, and edit clinical trial studies
- **Team Collaboration**: Assign team members to studies
- **Patient Tracking**: Track patient enrollment progress
- **Magic Link Authentication**: Passwordless authentication via email

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase (PostgreSQL + Auth)
- **AI**: Anthropic Claude 3.5 Sonnet
- **Deployment**: Vercel

## Quick Start

### Prerequisites

- Node.js 18+
- Supabase account (free tier)
- Anthropic API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/jeffbander/magic-protocol.git
cd magicprotocol
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=your-anthropic-key
```

4. Run the database migration:
   - Go to your Supabase dashboard → SQL Editor
   - Run the SQL from `supabase/migrations/001_initial_schema.sql`

5. Configure Supabase Auth:
   - In Supabase dashboard → Authentication → URL Configuration
   - Set Site URL: `http://localhost:3000`
   - Add Redirect URL: `http://localhost:3000/auth/callback`

6. Start the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
app/
├── (auth)/              # Authentication pages
│   ├── login/
│   ├── signup/
│   └── auth/callback/
├── (dashboard)/         # Protected pages
│   ├── page.tsx         # Dashboard
│   ├── upload/          # Protocol upload
│   └── studies/         # Study management
├── api/                 # API routes
│   ├── extract/         # AI extraction
│   ├── studies/         # Study CRUD
│   └── ...
components/              # React components
├── ui/                  # Base UI components
└── ...
lib/                     # Utilities
├── supabase/            # Supabase clients
├── anthropic/           # AI extraction
└── utils.ts
types/                   # TypeScript types
supabase/
└── migrations/          # Database migrations
```

## User Roles

- **PI (Principal Investigator)**: Create studies, upload protocols, manage teams
- **Research Coordinator**: View assigned studies, track patients
- **Admin**: Full access to all studies and features

## Key Workflows

### 1. Upload & Extract Protocol
1. Sign up/login as PI
2. Navigate to "Upload Protocol"
3. Select PDF file (max 50MB)
4. Click "Extract" (takes 30-120 seconds)
5. Review extracted data
6. Click "Confirm & Create Study"

### 2. Manage Team
1. Open study detail page
2. Go to "Team" tab
3. Click "Add Team Member"
4. Enter email and select role
5. User gains immediate access

### 3. Track Patients
1. Open study detail page
2. Go to "Patients" tab
3. Click "Add Patient"
4. Enter name and enrollment date
5. Counter updates automatically

## Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy
5. Update Supabase redirect URLs to include Vercel URL

## Configuration

### Supabase Auth Settings

- Magic link expiration: 15 minutes
- Session duration: 7 days
- Email templates: Confirm Email enabled

### File Limits

- Maximum PDF size: 50MB
- AI extraction timeout: 5 minutes

## Documentation

- Full specification: `specs/001-protocol-extractor/spec.md`
- Implementation plan: `specs/001-protocol-extractor/plan.md`
- Database schema: `specs/001-protocol-extractor/data-model.md`
- API contract: `specs/001-protocol-extractor/contracts/api-contract.md`
- Task breakdown: `specs/001-protocol-extractor/tasks.md`

## License

MIT

## Support

For issues and questions, please file a GitHub issue.
