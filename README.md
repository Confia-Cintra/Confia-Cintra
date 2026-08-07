# Cintra

Interactive cybersecurity and AI-literacy training platform. Week 1 foundation:
auth, course/module/lesson structure, progress tracking, and an instructor
dashboard, with one full demo module seeded and ready to click through.

## What's here

- Student login/signup, dashboard with progress bars
- Lesson player supporting **two lesson types from one data model**: standard
  (reading + quiz) and interactive (scenario-based)
- Progress is written to the database on every lesson completion
- Instructor/admin dashboard showing cohort-wide completion and scores
- PT/EN language toggle throughout
- Multi-institution ready (institutions table, RLS scoped by institution)

## 1. Local setup

```bash
npm install
cp .env.example .env
```

## 2. Create your Supabase project

1. Go to https://supabase.com, create a new project (free tier is enough for the pilot)
2. In the project, go to **SQL Editor**, paste the contents of `supabase/schema.sql`, run it
3. Go to **Settings -> API**, copy the **Project URL** and **anon public key** into your `.env`:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=xxxxx
   ```

## 3. Seed the demo content

The seed script needs your **service role key** (different from the anon key,
found on the same Settings -> API page) because it inserts directly, bypassing
row-level security.

```bash
SUPABASE_URL=https://xxxx.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=xxxxx \
npm run seed
```

This creates one course ("Recognizing Digital Fraud"), one module, and 5
lessons (3 interactive scenarios + 2 standard reading/quiz lessons) — pulled
from `content/module-1-lessons.json`. To add more lessons later, extend that
JSON file and re-run the script (or write new lessons directly in the
Supabase table editor).

## 4. Run it

```bash
npm run dev
```

Visit the local URL, click "Don't have an account? Create one," sign up as a
student, and you'll see the seeded course on the dashboard.

## 5. Making yourself an instructor (to see the admin dashboard)

By default every signup is a `student`. To test the instructor view, open
Supabase's **Table Editor -> profiles**, find your row, and change `role` to
`instructor`. Refresh the app — you'll see an "Instructor panel" link in the
top bar.

## 6. Deploying for the demo

Push this to a GitHub repo, then:

1. Go to https://vercel.com, import the repo
2. Add the same two env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in Vercel's project settings
3. Deploy — you'll get a public URL to send to UEM for their own testing

## What's deliberately not built yet

See the project plan — mobile apps, payments, SSO, AI-personalized paths, and
content-authoring tools for faculty are all out of scope for this pilot.
Don't add them without checking whether they're actually needed before Sept 10.

## Next steps (weeks 2-5)

- [ ] Expand content: more lessons per module, a second module
- [ ] Polish: loading states, empty states, mobile responsiveness pass
- [ ] Light gamification: completion badges, streaks
- [ ] In-app feedback form for UEM's pilot testers
- [ ] Seed realistic demo data (fake cohort at varied progress levels) for the live demo
- [ ] Full rehearsal on the actual presentation device/network
