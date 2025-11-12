# Supabase Setup Guide

Since Docker is not available for local Supabase, follow these steps to connect to a remote Supabase project:

## Step 1: Create Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in:
   - **Name**: `protocol-extractor` (or any name you prefer)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to you
4. Click **"Create new project"** (takes ~2 minutes)

## Step 2: Get API Keys

1. In your Supabase project dashboard, go to:
   **Settings → API** (or direct link: `https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api`)

2. Copy these values:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **anon public** key (under "Project API keys")
   - **service_role** key (under "Project API keys")

## Step 3: Configure Environment Variables

1. Open `.env.local` in this directory
2. Fill in the values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
ANTHROPIC_API_KEY=your-anthropic-key-here
```

## Step 4: Run Database Migration

1. In Supabase dashboard, go to: **SQL Editor**
2. Click **"New Query"**
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste into the SQL Editor
5. Click **"Run"** (should see "Success" message)
6. Verify tables created: Go to **Table Editor** → Should see:
   - `users`
   - `studies`
   - `study_members`
   - `patients`

## Step 5: Configure Authentication

1. In Supabase dashboard, go to: **Authentication → URL Configuration**
2. Set:
   - **Site URL**: `http://localhost:3000`
3. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - (Later: Add your production URL when deployed)

4. Go to: **Authentication → Email Templates**
5. Verify **"Confirm signup"** template is enabled

## Step 6: Get Anthropic API Key

1. Go to [https://console.anthropic.com/](https://console.anthropic.com/)
2. Sign up or log in
3. Go to **API Keys**
4. Click **"Create Key"**
5. Copy the key and add to `.env.local`

## Step 7: Test the Setup

```bash
# Start the development server
npm run dev

# Open http://localhost:3000
# Try signing up with your email
# You should receive a magic link email
```

## Verification Checklist

- [ ] Supabase project created
- [ ] All environment variables set in `.env.local`
- [ ] Database migration ran successfully (4 tables created)
- [ ] Auth URLs configured in Supabase
- [ ] Anthropic API key obtained
- [ ] Dev server starts without errors
- [ ] Can access http://localhost:3000

## Troubleshooting

### "Failed to fetch" errors
- Check that `.env.local` has correct Supabase URL and keys
- Restart dev server after changing environment variables

### Magic link not received
- Check spam folder
- Verify email in Supabase dashboard: **Authentication → Users**
- Check Supabase logs: **Logs → All Logs**

### Database errors
- Verify migration ran successfully
- Check table structure in **Table Editor**
- Look for errors in Supabase **Logs**

### AI extraction fails
- Verify Anthropic API key is correct
- Check you have API credits: https://console.anthropic.com/
- Check Anthropic API status: https://status.anthropic.com/

## Next Steps

After setup is complete:

1. **Test the application**:
   - Sign up as PI
   - Upload a protocol PDF
   - Verify extraction works
   - Create a study

2. **Deploy to production**:
   - Push to GitHub
   - Deploy to Vercel
   - Update Supabase redirect URLs to include production URL

3. **Invite team members**:
   - Have coordinators sign up
   - Add them to studies via Team tab

## Support

If you encounter issues:
- Check Supabase logs: **Logs → All Logs**
- Check browser console for client-side errors
- Review migration SQL for any syntax errors
- Verify all environment variables are set correctly
