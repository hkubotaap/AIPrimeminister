# 🚀 Quick Supabase Setup - Copy & Paste Ready

## Step 1: Create Supabase Project (2 minutes)
1. Go to https://supabase.com → "Start your project"
2. Project name: `prime-minister-simulator`
3. Set database password (remember this!)

## Step 2: Run Database Schema (1 minute)
1. In Supabase dashboard → "SQL Editor"
2. Copy and paste the entire contents from `supabase-schema.sql`
3. Click "RUN" → Should create table with 5 sample records

## Step 3: Get Keys (1 minute)
1. Supabase dashboard → "Settings" → "API"
2. Copy "Project URL" → This is your `SUPABASE_URL`
3. Copy "anon public" key → This is your `SUPABASE_ANON_KEY`

## Step 4: Configure Vercel (1 minute)
1. Vercel dashboard → Your project → "Settings" → "Environment Variables"
2. Add these 3 variables:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
GEMINI_API_KEY=your-existing-gemini-key
```

## Step 5: Redeploy (30 seconds)
1. Vercel → "Deployments" → Click "Redeploy" on latest deployment
2. Wait for deployment to complete

## Verification
- Rankings should show 5 sample records instead of empty array
- New scores should save to database permanently
- Check Supabase dashboard → "Table Editor" to see data

Total time: ~5 minutes