# 🚀 Deployment Guide - Crypto Trading Simulator Pro

## Complete Step-by-Step Deployment Instructions

This guide will help you deploy the Crypto Trading Simulator Pro to production using free-tier services.

---

## 📋 Prerequisites

### Required Accounts (All Free)
- ✅ GitHub Account - https://github.com
- ✅ Vercel Account - https://vercel.com (use GitHub login)
- ✅ Supabase Account - https://supabase.com (use GitHub login)
- ✅ Telegram Account - https://telegram.org
- ⚠️ Cloudflare Account (Optional) - https://cloudflare.com
- ⚠️ No credit card required for any service

### Required Tools
- ✅ Web browser (Chrome/Firefox recommended)
- ✅ Git (optional, can use GitHub web interface)
- ✅ Basic understanding of web development

---

## 🎯 Phase 1: Create GitHub Repository

### Step 1.1: Create Repository

1. Go to https://github.com/new
2. Fill in details:
   - **Repository name**: `crypto-trading-simulator-pro`
   - **Description**: `Advanced AI-Assisted Crypto Paper Trading Simulator`
   - **Public** (recommended for free tier)
   - **Initialize**: DO NOT add README, .gitignore, or license
3. Click **Create repository**

### Step 1.2: Upload Project Files

#### Option A: Using GitHub Web Interface (Recommended for beginners)

1. In your new repo, click **"uploading an existing file"**
2. Drag and drop ALL project files and folders:
   ```
   📁 src/
   📁 supabase/
   📁 workers/
   📁 .github/
   📄 index.html
   📄 package.json
   📄 package-lock.json
   📄 tsconfig.json
   📄 vite.config.js
   📄 README.md
   📄 DEPLOYMENT.md
   📄 ARCHITECTURE.md
   📄 TESTING.md
   📄 TROUBLESHOOTING.md
   ```
3. Scroll down and click **Commit changes**

#### Option B: Using Git Command Line

```bash
# Navigate to your project folder
cd crypto-trading-simulator-pro

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Crypto Trading Simulator Pro v6.0"

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/crypto-trading-simulator-pro.git

# Push
git branch -M main
git push -u origin main
```

---

## 🎯 Phase 2: Deploy Frontend to Vercel

### Step 2.1: Connect Vercel to GitHub

1. Go to https://vercel.com/signup
2. Click **Continue with GitHub**
3. Authorize Vercel to access your GitHub account

### Step 2.2: Import Project

1. Click **Add New Project**
2. Find `crypto-trading-simulator-pro` in the list
3. Click **Import**

### Step 2.3: Configure Build Settings

Vercel will auto-detect Vite. Verify these settings:

```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### Step 2.4: Deploy

1. Click **Deploy**
2. Wait 2-3 minutes
3. Your site will be live at: `https://crypto-trading-simulator-pro.vercel.app`

### Step 2.5: Verify Deployment

1. Open your Vercel URL
2. Check if the dashboard loads
3. Verify all tabs work:
   - ✅ Dashboard
   - ✅ Market Radar
   - ✅ Trading
   - ✅ Analytics
   - ✅ Backtest
   - ✅ Settings

---

## 🎯 Phase 3: Setup Supabase Database

### Step 3.1: Create Supabase Project

1. Go to https://supabase.com/dashboard/new
2. Click **New Project**
3. Fill in details:
   - **Name**: `crypto-trading-simulator`
   - **Database Password**: (save this securely!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free
4. Click **Create new project**
5. Wait 2-3 minutes for provisioning

### Step 3.2: Get Project Credentials

1. Go to **Settings** → **API**
2. Copy these values (you'll need them later):
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...`
   - **service_role key**: `eyJhbGc...` (KEEP SECRET!)

### Step 3.3: Enable Required Extensions

1. Go to **Database** → **Extensions**
2. Search and enable:
   - ✅ `pg_cron` - For scheduled tasks
   - ✅ `pg_net` - For HTTP requests
   - ✅ `uuid-ossp` - For UUID generation

### Step 3.4: Run Database Migrations

#### Migration 1: Phase 2 Schema

1. Go to **SQL Editor**
2. Click **New Query**
3. Copy content from `supabase/migrations/001_phase2_schema.sql`
4. Paste and click **Run**
5. Verify tables created:
   - ✅ profiles
   - ✅ paper_wallets
   - ✅ bot_config
   - ✅ positions
   - ✅ trades
   - ✅ dca_orders
   - ✅ market_candles
   - ✅ market_signals
   - ✅ portfolio_snapshots
   - ✅ notification_settings
   - ✅ worker_logs
   - ✅ processed_candles

#### Migration 2: Phase 3 pg_cron

1. Click **New Query**
2. Copy content from `supabase/migrations/002_phase3_pg_cron.sql`
3. Paste and click **Run**
4. Verify cron jobs:
   ```sql
   SELECT * FROM cron.job;
   ```

#### Migration 3: Phase 4 Telegram

1. Click **New Query**
2. Copy content from `supabase/migrations/003_phase4_telegram.sql`
3. Paste and click **Run**
4. Verify tables:
   - ✅ telegram_notifications
   - ✅ audit_logs
   - ✅ rate_limits

### Step 3.5: Verify RLS Policies

Run this query to check RLS is enabled:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

All tables should show `rowsecurity = true`

---

## 🎯 Phase 4: Deploy Supabase Edge Functions

### Step 4.1: Install Supabase CLI

#### On Windows:
```powershell
# Download from: https://github.com/supabase/cli/releases
# Or use npm:
npm install -g supabase
```

#### On Mac/Linux:
```bash
brew install supabase/tap/supabase
# Or:
npm install -g supabase
```

### Step 4.2: Login to Supabase

```bash
supabase login
```

This will open a browser. Authorize the CLI.

### Step 4.3: Link Project

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

Find your project ref in Supabase Dashboard → Settings → General

### Step 4.4: Deploy Trading Worker

```bash
supabase functions deploy trading-worker
```

### Step 4.5: Deploy Telegram Notification Worker

```bash
supabase functions deploy telegram-notification
```

### Step 4.6: Set Environment Secrets

```bash
# Set Supabase URL
supabase secrets set SUPABASE_URL=https://YOUR_PROJECT.supabase.co

# Set Service Role Key (KEEP SECRET!)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Set Telegram Bot Token (from Phase 6)
supabase secrets set TELEGRAM_BOT_TOKEN=your_bot_token
```

### Step 4.7: Verify Functions

```bash
supabase functions list
```

You should see:
- ✅ trading-worker
- ✅ telegram-notification

---

## 🎯 Phase 5: Setup Telegram Bot

### Step 5.1: Create Bot

1. Open Telegram
2. Search for `@BotFather`
3. Send: `/newbot`
4. Choose a name: `Crypto Trading Simulator`
5. Choose a username: `crypto_simulator_bot` (must end in 'bot')
6. **Copy the bot token**: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`
7. Save this token securely!

### Step 5.2: Get Your Chat ID

1. Open Telegram
2. Search for `@userinfobot`
3. Send: `/start`
4. **Copy your Chat ID**: `123456789`
5. Save this ID

### Step 5.3: Test Bot

1. Open your bot in Telegram
2. Send: `/start`
3. You should see a welcome message

### Step 5.4: Configure in Dashboard

1. Open your Vercel app
2. Go to **Settings** tab
3. Scroll to **Telegram Notifications**
4. Enable notifications
5. Enter your **Bot Token**
6. Enter your **Chat ID**
7. Select notification preferences
8. Click **Test Connection**
9. Verify you receive test message in Telegram
10. Click **Save Settings**

---

## 🎯 Phase 6: Setup Scheduled Workers

### Option A: Supabase pg_cron (Primary - Recommended)

Already configured in Migration 2. Verify:

```sql
SELECT * FROM cron.job WHERE jobname = 'trading-worker';
```

Should show schedule: `* * * * *` (every minute)

### Option B: Cloudflare Workers (Backup)

#### Step 6B.1: Create Cloudflare Account

1. Go to https://dash.cloudflare.com/sign-up
2. Sign up (free, no credit card)

#### Step 6B.2: Install Wrangler

```bash
npm install -g wrangler
```

#### Step 6B.3: Login

```bash
wrangler login
```

#### Step 6B.4: Deploy Worker

```bash
cd workers/trading-worker
wrangler deploy
```

#### Step 6B.5: Set Secrets

```bash
wrangler secret put SUPABASE_URL
# Enter: https://YOUR_PROJECT.supabase.co

wrangler secret put SUPABASE_SERVICE_ROLE_KEY
# Enter: your_service_role_key
```

#### Step 6B.6: Verify Cron Trigger

```bash
wrangler tail
```

You should see executions every minute.

### Option C: GitHub Actions (Third Backup)

⚠️ **Warning**: May exceed free tier (2,000 minutes/month)

#### Step 6C.1: Add Secrets to GitHub

1. Go to your GitHub repo
2. **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add:
   - **Name**: `SUPABASE_URL`
   - **Value**: `https://YOUR_PROJECT.supabase.co`
5. Add another:
   - **Name**: `SUPABASE_SERVICE_ROLE_KEY`
   - **Value**: `your_service_role_key`

#### Step 6C.2: Verify Workflow

1. Go to **Actions** tab
2. Click **Trading Worker Backup**
3. Verify it runs every minute
4. Check logs for errors

---

## 🎯 Phase 7: Environment Variables Checklist

### Vercel (Frontend)

No environment variables needed for frontend (all client-side).

### Supabase Edge Functions

```bash
✅ SUPABASE_URL=https://YOUR_PROJECT.supabase.co
✅ SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
✅ TELEGRAM_BOT_TOKEN=123456789:ABCdef...
```

### Cloudflare Workers

```bash
✅ SUPABASE_URL=https://YOUR_PROJECT.supabase.co
✅ SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### GitHub Actions

```bash
✅ SUPABASE_URL=https://YOUR_PROJECT.supabase.co
✅ SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

---

## 🎯 Phase 8: Final Verification

### Step 8.1: Test Complete Flow

1. **Open your Vercel app**
2. **Check Dashboard**:
   - ✅ Wallet stats display
   - ✅ Engine status shows
   - ✅ Worker monitoring shows
   - ✅ Charts render
3. **Test Market Radar**:
   - ✅ 12 coins displayed
   - ✅ Live prices update
   - ✅ Signals generate
4. **Test Trading**:
   - ✅ Manual BUY works
   - ✅ Manual SELL works
   - ✅ DCA triggers
   - ✅ No-Loss mode works
5. **Test Analytics**:
   - ✅ Trade journal displays
   - ✅ Charts render
   - ✅ Filters work
   - ✅ CSV export works
6. **Test Backtesting**:
   - ✅ Can select coin
   - ✅ Can run backtest
   - ✅ Results display
   - ✅ Equity curve shows
7. **Test Settings**:
   - ✅ Theme switching works
   - ✅ Language toggle works
   - ✅ DCA settings save
   - ✅ Telegram config works

### Step 8.2: Test Telegram Notifications

1. Start/stop bot → receive notification
2. Execute trade → receive notification
3. Trigger DCA → receive notification
4. Check all notification types work

### Step 8.3: Test Scheduled Workers

1. Wait 2-3 minutes
2. Check Supabase worker_logs:
   ```sql
   SELECT * FROM worker_logs ORDER BY created_at DESC LIMIT 10;
   ```
3. Verify executions happening
4. Check Cloudflare dashboard (if using)
5. Check GitHub Actions logs (if using)

### Step 8.4: Test Mobile Responsiveness

1. Open app on mobile phone
2. Check all pages render correctly
3. Test touch interactions
4. Verify charts are readable
5. Test navigation menu

---

## 🎯 Phase 9: Security Review

### Step 9.1: Verify No Secrets in Frontend

```bash
# Search for secrets in frontend code
grep -r "SERVICE_ROLE_KEY" src/
grep -r "TELEGRAM_BOT_TOKEN" src/
```

Should return NO results.

### Step 9.2: Verify RLS Policies

```sql
-- Check all tables have RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
AND rowsecurity = false;
```

Should return NO rows.

### Step 9.3: Verify User Isolation

```sql
-- Test that users can only see their own data
-- (Requires creating test users)
```

### Step 9.4: Check CORS Settings

In Supabase:
1. Go to **Authentication** → **URL Configuration**
2. Add your Vercel URL to allowed origins

---

## 🎯 Phase 10: Performance Optimization

### Step 10.1: Enable Vercel Analytics

1. Go to Vercel dashboard
2. Select your project
3. Go to **Analytics** tab
4. Enable analytics

### Step 10.2: Optimize Images

- Use WebP format
- Compress images
- Use lazy loading

### Step 10.3: Enable Caching

Vercel automatically caches. Verify in:
- Vercel Dashboard → **Settings** → **Edge Network**

---

## 🎯 Phase 11: Monitoring Setup

### Step 11.1: Supabase Monitoring

1. Go to Supabase Dashboard
2. Check **Logs** section
3. Monitor:
   - API usage
   - Database connections
   - Edge Function invocations

### Step 11.2: Vercel Monitoring

1. Go to Vercel Dashboard
2. Check **Analytics** and **Logs**
3. Monitor:
   - Bandwidth usage
   - Function invocations
   - Error rates

### Step 11.3: Worker Monitoring

Check worker health in dashboard:
- WorkerMonitoring component shows status
- Check worker_logs table regularly

---

## 🎯 Phase 12: Backup Strategy

### Step 12.1: Database Backups

Supabase Free tier includes:
- Automatic daily backups
- 7-day retention
- Point-in-time recovery

### Step 12.2: Code Backups

GitHub provides:
- Version control
- Branch protection
- Pull request workflow

### Step 12.3: Export Data

Use CSV export feature regularly:
- Export trades
- Export positions
- Export portfolio summary

---

## 🎯 Phase 13: Go Live Checklist

Before announcing your project:

- [ ] All features tested
- [ ] Telegram notifications working
- [ ] Scheduled workers running
- [ ] Mobile responsive
- [ ] Security review complete
- [ ] Performance optimized
- [ ] Monitoring setup
- [ ] Backups configured
- [ ] Documentation complete
- [ ] Disclaimers visible

---

## 📞 Support & Resources

### Documentation
- **README.md** - Project overview
- **ARCHITECTURE.md** - System architecture
- **TESTING.md** - Testing guide
- **TROUBLESHOOTING.md** - Problem solving

### External Resources
- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Telegram Bot API**: https://core.telegram.org/bots/api
- **Binance API**: https://binance-docs.github.io/apidocs/

### Community
- **GitHub Issues**: Report bugs
- **GitHub Discussions**: Ask questions

---

## ⚠️ Important Reminders

### This is a SIMULATION
- ❌ No real money trading
- ❌ No real Binance orders
- ❌ No guaranteed profits
- ✅ Paper trading only
- ✅ Educational purposes

### Free Tier Limits
- ✅ Supabase: Generous free tier
- ✅ Vercel: 100GB bandwidth/month
- ✅ Cloudflare: 100k requests/day
- ⚠️ GitHub Actions: 2k minutes/month (may exceed)

### No Credit Card Required
- ✅ GitHub: Free
- ✅ Vercel: Free (with GitHub)
- ✅ Supabase: Free
- ✅ Telegram: Free
- ✅ Cloudflare: Free

---

## 🎉 Deployment Complete!

Your Crypto Trading Simulator Pro is now live!

**Next Steps:**
1. Share with friends
2. Collect feedback
3. Monitor performance
4. Plan Phase 7 features

**Congratulations!** 🚀

---

**Developer:** Taseen Billah  
**Version:** 6.0.0 (Phase 6 Complete)  
**Status:** ✅ Production Ready
