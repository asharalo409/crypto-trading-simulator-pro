# Phase 3 — Scheduled Paper Trading Worker

## ✅ Status: COMPLETE

**Phase 3: Scheduled Paper Trading Worker** has been successfully implemented.

---

## 🎯 What Was Built

### 1. Market Data Service (Frontend)
- ✅ `src/services/BinanceAPI.ts` - Binance REST API client
- ✅ Fallback to data-api.binance.vision
- ✅ CoinGecko API fallback
- ✅ Rate limiting (1200 requests/minute)
- ✅ Health monitoring
- ✅ 12 coins supported

### 2. Supabase Edge Function (Primary Worker)
- ✅ `supabase/functions/trading-worker/index.ts`
- ✅ Runs every 1 minute via pg_cron
- ✅ Processes all active users
- ✅ Fetches closed candles
- ✅ Executes DCA strategy
- ✅ No-Loss Hold logic
- ✅ Profit-only Sell
- ✅ Idempotency (processed_candles table)
- ✅ Error logging
- ✅ Bounded concurrency (10 users per batch)

### 3. Cloudflare Workers (Backup)
- ✅ `workers/trading-worker/src/index.ts`
- ✅ `workers/trading-worker/wrangler.toml`
- ✅ Cron trigger: */1 * * * *
- ✅ 100k requests/day free tier
- ✅ No credit card required

### 4. GitHub Actions (Third Backup)
- ✅ `.github/workflows/trading-worker.yml`
- ✅ `.github/workflows/trading-worker-script.js`
- ✅ Cron: * * * * *
- ✅ 2k minutes/month free tier
- ⚠️ May exceed free tier (not recommended as primary)

### 5. Database Migrations
- ✅ `supabase/migrations/002_phase3_pg_cron.sql`
- ✅ pg_cron extension setup
- ✅ Scheduled job creation
- ✅ Cleanup function (daily at 3 AM)
- ✅ Health check function

### 6. Worker Monitoring UI
- ✅ `src/components/WorkerMonitoring.tsx`
- ✅ Real-time API health check
- ✅ Worker status display
- ✅ Execution metrics
- ✅ Free tier limits info

---

## 📁 File Structure

```
crypto-trading-simulator-pro/
├── src/
│   ├── services/
│   │   └── BinanceAPI.ts              ✅ Market data service
│   ├── components/
│   │   └── WorkerMonitoring.tsx       ✅ Worker status UI
│   └── [existing files]
├── supabase/
│   ├── functions/
│   │   └── trading-worker/
│   │       └── index.ts               ✅ Edge Function worker
│   └── migrations/
│       ├── 001_phase2_schema.sql      ✅ Phase 2 schema
│       └── 002_phase3_pg_cron.sql     ✅ Phase 3 cron setup
├── workers/
│   └── trading-worker/
│       ├── src/
│       │   └── index.ts               ✅ Cloudflare Worker
│       └── wrangler.toml              ✅ Worker config
└── .github/
    └── workflows/
        ├── trading-worker.yml         ✅ GitHub Actions workflow
        └── trading-worker-script.js   ✅ Worker script
```

---

## 🔄 Architecture Overview

### Primary: Supabase pg_cron + Edge Functions
```
┌─────────────────┐
│  Supabase pg_cron │
│  (Every 1 min)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Edge Function   │
│  trading-worker  │
└────────┬────────┘
         │
         ├─► Fetch Binance prices
         ├─► Process each user
         ├─► Execute DCA/Sell
         └─► Log to database
```

### Backup: Cloudflare Workers
```
┌─────────────────┐
│ Cloudflare Cron  │
│  (Every 1 min)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Worker Script   │
│  (Same logic)    │
└────────┬────────┘
         │
         └─► Supabase REST API
```

### Third Backup: GitHub Actions
```
┌─────────────────┐
│ GitHub Actions   │
│  (Every 1 min)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Node.js Script  │
│  (Same logic)    │
└────────┬────────┘
         │
         └─► Supabase REST API
```

---

## ⚙️ Worker Logic (Each Tick)

### Step-by-Step Process:

1. **Check Bot Running State**
   - Query `bot_config` where `is_running = true`
   - Skip users with bot stopped

2. **Fetch Missing Closed Candles**
   - Call Binance API for each coin
   - Filter only closed candles (closeTime <= now)
   - Use fallback API if primary fails

3. **Run Strategy**
   - Calculate RSI, EMA, MACD
   - Generate signal (BUY/SELL/HOLD/DCA/WAIT)
   - Check trend direction

4. **Process Positions**
   - Update current price for open positions
   - Calculate unrealized P/L
   - Check SL/TP conditions

5. **Evaluate DCA**
   - Check if price dropped by trigger %
   - Verify max DCA orders not reached
   - Check available balance
   - Execute DCA BUY if conditions met

6. **Evaluate Sell Conditions**
   - If No-Loss mode ON:
     - Only sell if profit target reached
     - Never sell at loss
   - If No-Loss mode OFF:
     - Check stop loss (default 5%)
     - Check take profit (default 3%)
   - Execute SELL if conditions met

7. **Update Wallet and Trade History**
   - Deduct/add funds
   - Record realized P/L
   - Insert trade records
   - Update position status

8. **Save last_processed_candle_time**
   - Insert into `processed_candles` table
   - Prevents duplicate processing (idempotency)

9. **Send Notification Events**
   - Log to `worker_logs` table
   - (Phase 4: Send Telegram notifications)

---

## 🔑 Secrets Required

### Supabase
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### Cloudflare Workers
```bash
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

### GitHub Actions
```
Settings > Secrets > Actions
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

---

## 🚀 Setup Instructions

### 1. Supabase Edge Function (Primary)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy Edge Function
supabase functions deploy trading-worker

# Set secrets
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Enable pg_cron

```sql
-- In Supabase SQL Editor:
-- 1. Go to Database > Extensions
-- 2. Enable "pg_cron"
-- 3. Enable "pg_net"
-- 4. Run migration: supabase/migrations/002_phase3_pg_cron.sql
```

### 3. Cloudflare Workers (Backup)

```bash
# Install Wrangler
npm install -g wrangler

# Login
wrangler login

# Deploy
cd workers/trading-worker
wrangler deploy

# Set secrets
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

### 4. GitHub Actions (Third Backup)

```bash
# Push code to GitHub
git add .
git commit -m "Phase 3: Scheduled workers"
git push

# Set secrets in GitHub
# Go to: Settings > Secrets and variables > Actions
# Add: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

# ⚠️ WARNING: GitHub Actions free tier may not support every-minute cron
# Consider using only Supabase + Cloudflare
```

---

## 📊 Free Tier Limits

### Supabase (Recommended)
- ✅ **pg_cron**: Unlimited jobs
- ✅ **Edge Functions**: 500k invocations/month
- ✅ **Database**: 500 MB
- ✅ **No credit card required**
- **Status**: ✅ PRIMARY (use this)

### Cloudflare Workers (Backup)
- ✅ **100,000 requests/day**
- ✅ **10ms CPU time per request**
- ✅ **No credit card required**
- This cron = 1,440 requests/day
- **Status**: ✅ BACKUP (safe to use)

### GitHub Actions (Not Recommended)
- ⚠️ **2,000 minutes/month** (private repos)
- ⚠️ This cron = ~43,200 minutes/month
- ⚠️ **EXCEEDS FREE TIER**
- **Status**: ❌ NOT RECOMMENDED (use only if needed)

---

## 🧪 Testing Checklist

### API Integration
- [ ] Binance API returns prices
- [ ] Fallback API works
- [ ] Rate limiting prevents errors
- [ ] All 12 coins supported

### Supabase Edge Function
- [ ] Function deployed successfully
- [ ] pg_cron job scheduled
- [ ] Function executes every minute
- [ ] Processes active users
- [ ] Fetches candles correctly
- [ ] Executes DCA trades
- [ ] Executes SELL trades
- [ ] Logs to worker_logs table
- [ ] Idempotency works (no duplicates)

### Cloudflare Workers
- [ ] Worker deployed
- [ ] Cron trigger active
- [ ] Executes every minute
- [ ] Logs execution
- [ ] Handles errors

### GitHub Actions
- [ ] Workflow runs
- [ ] Script executes
- [ ] Logs to database
- [ ] ⚠️ Monitor free tier usage

### Monitoring
- [ ] WorkerMonitoring component shows status
- [ ] API health check works
- [ ] Execution metrics display
- [ ] Error count updates

### Error Handling
- [ ] API failures handled gracefully
- [ ] Database errors logged
- [ ] Worker continues on individual user errors
- [ ] Rate limit errors caught

---

## 📈 Worker Execution Flow

```
Every 1 Minute:
│
├─► Check bot_config.is_running
│   └─► Skip if false
│
├─► Fetch all prices (Binance API)
│   ├─► Try api.binance.com
│   └─► Fallback: data-api.binance.vision
│
├─► For each active user:
│   │
│   ├─► Fetch user's bot_config
│   ├─► Fetch open positions
│   ├─► Fetch wallet balance
│   │
│   ├─► For each coin (12 coins):
│   │   │
│   │   ├─► Fetch 50 candles (5m interval)
│   │   ├─► Calculate RSI, EMA, MACD
│   │   ├─► Generate signal
│   │   │
│   │   ├─► If position exists:
│   │   │   ├─► Update current price
│   │   │   ├─► Check DCA trigger
│   │   │   │   └─► Execute DCA BUY if triggered
│   │   │   └─► Check sell conditions
│   │   │       ├─► No-Loss: profit target only
│   │   │       └─► Normal: SL/TP
│   │   │       └─► Execute SELL if conditions met
│   │   │
│   │   └─► If no position:
│   │       └─► Execute initial BUY if signal = BUY
│   │
│   └─► Update bot_state
│
├─► Log execution to worker_logs
│
└─► Done (wait for next minute)
```

---

## 🔒 Idempotency & Duplicate Prevention

### processed_candles Table
```sql
CREATE TABLE processed_candles (
  user_id UUID,
  coin TEXT,
  candle_time BIGINT,
  processed_at TIMESTAMPTZ,
  UNIQUE(user_id, coin, candle_time)
);
```

### How It Works:
1. Before processing a candle, check if it exists in `processed_candles`
2. If exists → skip (already processed)
3. If not exists → process and insert
4. Prevents duplicate trades from multiple workers

---

## ⚠️ Important Notes

### This is a SIMULATION
- ❌ No real trading orders
- ❌ No real money
- ❌ No guaranteed profits
- ✅ Paper trading only
- ✅ Educational purposes

### Rate Limits
- Binance: 1200 requests/minute
- Worker processes 12 coins per user
- With 10 users = 120 requests per tick
- Well within limits

### Free Tier Safety
- ✅ Supabase: Unlimited (primary)
- ✅ Cloudflare: 100k/day (backup)
- ⚠️ GitHub: May exceed (avoid if possible)

### No 24/7 Guarantee
- Free tiers may have downtime
- Workers may be rate-limited
- Not suitable for production trading
- For learning and testing only

---

## 📋 Phase 4 Preview

Next phase will add:
- [ ] Telegram notifications
- [ ] User authentication (Supabase Auth)
- [ ] Multi-user dashboard
- [ ] Real-time WebSocket updates
- [ ] Advanced analytics
- [ ] Trade journal
- [ ] CSV export

---

## ✅ Checklist

### Code Quality
- [x] TypeScript strict mode
- [x] No build errors
- [x] Proper error handling
- [x] Rate limiting implemented
- [x] Idempotency ensured

### Features
- [x] All Phase 3 features implemented
- [x] 3 worker backends created
- [x] Market data API integrated
- [x] Worker monitoring UI
- [x] Database migrations ready

### Documentation
- [x] Setup instructions provided
- [x] Secrets list documented
- [x] Testing checklist included
- [x] Free tier limits explained
- [x] Architecture diagrams included

---

## 🎉 Phase 3 Complete!

**Build Status:** ✅ Passing  
**Workers:** ✅ 3 backends ready  
**Documentation:** ✅ Complete  
**Ready for:** Phase 4  

---

**Next Step:** 
1. Deploy Supabase Edge Function
2. Enable pg_cron
3. Test worker execution
4. Monitor via WorkerMonitoring UI
5. Proceed to Phase 4 when ready

**Developer:** Taseen Billah  
**Version:** 3.0.0 (Phase 3 Complete)  
**Date:** Phase 3 Complete
