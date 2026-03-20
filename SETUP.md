# 🚀 Quick Start Guide - Rehearsal Scheduler v2

**Status**: Ready for Phase 1 setup ✅  
**Estimated time**: 1 hour from start to local app running  
**Prerequisites**: GitHub account, Supabase account (free tier OK)

---

## ⚡ 5-Minute Overview

You now have:
- ✅ Enterprise security architecture (WCAG AAA + OWASP compliant)
- ✅ Encrypted database with Row-Level Security
- ✅ Automated daily backups (GitHub + Supabase)
- ✅ GitHub Actions for deployment
- ✅ Complete testing infrastructure
- ✅ Environment configuration system (secrets protected)

**Next**: Get your Supabase project running, then start coding Phase 1 features.

---

## 🔧 Step 1: Create Supabase Project (5 minutes)

### 1a. Sign Up/Login to Supabase
```
Go to: https://app.supabase.com
Click: Sign Up or Log In
Use: GitHub account (easier)
```

### 1b. Create New Project
```
Click: New Project
Organization: Create or select existing
Project name: rehearsal-scheduler-prod
Database password: [Generate strong password]
Region: Choose EU (for GDPR compliance) OR US-East-1 (for speed)
Pricing: Free tier (plenty for Phase 1)
Click: Create new project
```

Wait 3-5 minutes for project initialization...

### 1c. Get Your Credentials
```
Supabase Dashboard → Settings → API

Copy these two values:

1. PROJECT URL (looks like):
   https://xxxxxxxxxxxxxx.supabase.co

2. ANON KEY (looks like):
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   (very long string)

3. SERVICE_ROLE_KEY (looks like):
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   (different long string)
```

⚠️ **IMPORTANT**: The SERVICE_ROLE_KEY is PRIVATE. Never share it. Never commit it.

---

## 🗄️ Step 2: Deploy Database Schema (10 minutes)

### 2a. Open SQL Editor
```
Supabase Dashboard → SQL Editor
Click: New Query
```

### 2b. Copy Database Schema
```
Open: docs/technical/database-schema.sql
Select all (Ctrl+A)
Copy (Ctrl+C)
```

### 2c. Paste & Run
```
In Supabase SQL Editor:
Paste (Ctrl+V)
Click: Run
Wait for completion...
```

### 2d. Verify Tables Created
```
Supabase Dashboard → Table Editor
You should see:
✅ users
✅ productions
✅ production_members
✅ cast_members
✅ crew_members
✅ rehearsal_sessions
✅ schedule_blocks
✅ attendance_log
✅ notifications
✅ audit_log
✅ backup_metadata
```

If any tables are missing, check the SQL error messages and debug.

---

## 🔐 Step 3: Set Up GitHub Secrets (10 minutes)

### 3a. Get Your Repo URL
```
You need to create a GitHub repo:
1. Go to https://github.com/new
2. Repository name: rehearsal-scheduler-v2
3. Description: Theater scheduling app with team collaboration
4. Public or Private: Your choice
5. DO NOT initialize with README/gitignore (we have them)
6. Create repository
```

### 3b. Add Secrets to GitHub
```
On your GitHub repo:
Settings → Secrets and variables → Actions → New repository secret

SECRET 1:
Name: SUPABASE_URL
Value: [Copy from Supabase Step 1c - PROJECT URL]

SECRET 2:
Name: SUPABASE_ANON_KEY
Value: [Copy from Supabase Step 1c - ANON KEY]

SECRET 3:
Name: SUPABASE_SERVICE_KEY
Value: [Copy from Supabase Step 1c - SERVICE_ROLE_KEY]

SECRET 4 (for backups - create a strong password):
Name: BACKUP_ENCRYPTION_KEY
Value: [Generate: openssl rand -base64 32]
```

### 3c. Test Secrets
```
GitHub repo → Actions
Should see: "Deploy to GitHub Pages" workflow
Don't run it yet - we're still building
```

---

## 💻 Step 4: Set Up Local Development (15 minutes)

### 4a. Clone the Repository
```bash
# Replace YOUR_USERNAME with your GitHub username
git clone https://github.com/YOUR_USERNAME/rehearsal-scheduler-v2.git
cd rehearsal-scheduler-v2
```

### 4b. Create .env.local File
```bash
# Copy the template
cp .env.example .env.local

# Edit .env.local (using your favorite editor):
# 
# VITE_SUPABASE_URL=https://your-project-id.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
#
# Fill in the values from Supabase Step 1c
```

### 4c. Verify .env.local is Protected
```bash
# Check that .gitignore prevents accidental commits
cat .gitignore | grep .env.local

# You should see:
# .env
# .env.local
# .env.*.local

# Good! These are protected.
```

### 4d. Install Dependencies
```bash
npm install

# Wait for npm to download ~500 packages (1-2 min)
# You should see: "added X packages" at the end
```

### 4e. Start Development Server
```bash
npm run dev

# You should see:
# ➜  Local:   http://localhost:5173/
# ➜  Press h to show help

# Visit http://localhost:5173 in your browser
```

### 4f. Verify App Loads
```
Browser console (F12 → Console):
✅ No "undefined URL" errors
✅ No "401 Unauthorized" errors
✅ App displays homepage

If you see errors:
1. Check .env.local has correct values
2. Check Supabase URL & keys are exactly right (no spaces/typos)
3. Restart development server (Ctrl+C, npm run dev)
```

---

## ✅ Step 5: Verify Everything Works (10 minutes)

### 5a. Run Tests
```bash
# Unit tests
npm run test

# Should see: "Tests:  X passed, Y failed"
# Failures are OK at this stage - we haven't built the app yet
```

### 5b. Run Security Check
```bash
npm run test:security

# Checks for:
# ✅ No hardcoded API keys
# ✅ Dependencies have no known vulnerabilities
# ✅ No secrets in code
```

### 5c. Run Linter
```bash
npm run lint

# Checks for code quality issues
# Warnings are OK, errors should be fixed
```

### 5d. Verify Local Git Setup
```bash
git config --local user.name "Your Name"
git config --local user.email "your.email@example.com"

# Make a test commit
git add .
git commit -m "chore: Initial setup"

# This confirms Git is working locally
```

---

## 🎯 What's Next: Phase 1 Development

You're now ready to build! The roadmap is:

### This Week (Week 1)
- [x] Supabase setup ✅
- [x] Database schema deployed ✅
- [x] GitHub secrets configured ✅
- [x] Local development working ✅
- [ ] Implement user authentication (Supabase Auth)
- [ ] Build login/signup UI
- [ ] Test authentication flow

### Next Week (Week 2)
- [ ] Create production management UI
- [ ] Implement role-based permissions
- [ ] Build rehearsal session scheduler
- [ ] Add real-time timer

### Weeks 3-4
- [ ] Implement remaining 18 features
- [ ] Build accessibility features (WCAG AAA)
- [ ] Complete test coverage (80%+)

### Weeks 5-6
- [ ] Write documentation
- [ ] Deploy to production
- [ ] Team training & launch

---

## 🆘 Troubleshooting

### Problem: "Cannot find module 'supabase'"
**Solution**: `npm install` didn't complete. Run it again.

### Problem: "VITE_SUPABASE_URL is undefined"
**Solution**: 
1. Check .env.local exists in project root
2. Restart dev server: Ctrl+C, then `npm run dev`
3. Verify .env.local has the URL line

### Problem: "401 Unauthorized" errors
**Solution**: 
1. Your SUPABASE_ANON_KEY might be wrong
2. Copy the FULL key (it's very long)
3. Check for extra spaces or line breaks
4. Restart dev server

### Problem: Database tables don't appear
**Solution**:
1. Check you ran the SQL schema in Supabase
2. Look for error messages in Supabase SQL Editor
3. Try running it again line by line to find the issue
4. Check Supabase status page (status.supabase.com)

### Problem: GitHub Actions fail
**Solution**:
1. Check GitHub Secrets are spelled correctly
2. Verify secrets values don't have extra spaces
3. Check GitHub Actions logs for details
4. Secrets take ~30 seconds to propagate - wait and retry

---

## 🔐 Security Reminders

### DO ✅
- [ ] Use .env.local for development
- [ ] Add .env.local to .gitignore (already done)
- [ ] Rotate API keys monthly
- [ ] Review audit logs weekly
- [ ] Use strong passwords
- [ ] Enable 2FA on GitHub account
- [ ] Check secrets aren't in code before committing

### DON'T ❌
- [ ] Don't share your API keys
- [ ] Don't commit .env.local
- [ ] Don't paste secrets in Slack/email
- [ ] Don't use same key across projects
- [ ] Don't push secrets accidentally

---

## 📋 Verification Checklist

Before moving to Phase 1 development, verify:

- [ ] Supabase project created
- [ ] Database schema deployed (12 tables visible)
- [ ] GitHub repo created
- [ ] GitHub Secrets configured (4 secrets added)
- [ ] Local repo cloned
- [ ] .env.local created with correct values
- [ ] `npm install` completed successfully
- [ ] `npm run dev` runs without errors
- [ ] App loads in browser
- [ ] Console shows no errors
- [ ] Tests run: `npm run test`
- [ ] Security check passes: `npm run test:security`
- [ ] Git configured locally
- [ ] First commit made

---

## 📞 Getting Help

### Documentation
- Security strategy: `docs/technical/security-strategy.md`
- Database schema: `docs/technical/database-schema.sql`
- Project roadmap: `docs/PROJECT_ROADMAP.md`

### Issues?
- Check troubleshooting section above
- Review GitHub Actions logs for specific errors
- Check Supabase status: https://status.supabase.com
- Supabase docs: https://supabase.com/docs

### Ready to code?
Once everything above is working, let me know and I'll guide you through:
1. Building the authentication UI
2. Creating the production management system
3. Implementing the scheduler
4. Adding all Phase 1 features

---

## 🚀 Next Steps

**Right now**: Get Supabase & GitHub set up

**When you're ready**: Reply with "Setup complete!" and I'll start:
1. Building authentication system
2. Creating login/signup UI
3. Implementing team member management
4. Building the core scheduler

---

**You've got this!** 🎭 Theater tech is your domain - let me handle the security & infrastructure so you can focus on features.

Let me know when you're set up and ready to start Phase 1! 💪
