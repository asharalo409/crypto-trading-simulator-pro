# 🔧 Troubleshooting Guide - Crypto Trading Simulator Pro

## Common Issues and Solutions

---

## 📋 Quick Reference

| Issue | Solution |
|-------|----------|
| App won't load | Check [Frontend Issues](#frontend-issues) |
| Prices not updating | Check [Market Data Issues](#market-data-issues) |
| Trades not executing | Check [Trading Issues](#trading-issues) |
| Worker not running | Check [Worker Issues](#worker-issues) |
| Telegram not working | Check [Telegram Issues](#telegram-issues) |
| Database errors | Check [Database Issues](#database-issues) |
| Build fails | Check [Build Issues](#build-issues) |

---

## 🌐 Frontend Issues

### Issue: App Won't Load

**Symptoms:**
- Blank white page
- Console errors
- Loading spinner forever

**Solutions:**

1. **Clear Browser Cache**
   ```
   Chrome: Ctrl+Shift+Delete → Clear cache
   Firefox: Ctrl+Shift+Delete → Clear cache
   Safari: Cmd+Option+E → Empty cache
   ```

2. **Check Browser Console**
   - Press F12
   - Go to Console tab
   - Look for red errors
   - Share error message for help

3. **Check Vercel Deployment**
   - Go to Vercel dashboard
   - Check deployment status
   - View deployment logs
   - Redeploy if needed

4. **Check Environment**
   - Ensure Node.js 18+ installed
   - Run `npm install` again
   - Run `npm run build` locally

**Status:** Common issue, usually cache-related

---

### Issue: Theme Not Applying

**Symptoms:**
- Theme selection doesn't change UI
- Colors stay the same

**Solutions:**

1. **Clear LocalStorage**
   ```javascript
   // In browser console:
   localStorage.clear();
   location.reload();
   ```

2. **Check Theme Context**
   - Open browser console
   - Check for React errors
   - Verify ThemeContext is working

3. **Hard Refresh**
   ```
   Chrome: Ctrl+Shift+R
   Firefox: Ctrl+Shift+R
   Safari: Cmd+Shift+R
   ```

**Status:** Rare, usually localStorage issue

---

### Issue: Language Toggle Not Working

**Symptoms:**
- Clicking language button does nothing
- Text doesn't change

**Solutions:**

1. **Check Translation Keys**
   - Open browser console
   - Look for missing translation errors
   - Verify all keys exist in translations.ts

2. **Clear LocalStorage**
   ```javascript
   localStorage.removeItem('ctsp-lang');
   location.reload();
   ```

3. **Check LanguageContext**
   - Verify context is working
   - Check for React errors

**Status:** Rare, check translation keys

---

## 📊 Market Data Issues

### Issue: Prices Not Updating

**Symptoms:**
- Prices stay the same
- Market Radar shows old data
- No price changes

**Solutions:**

1. **Check Internet Connection**
   - Verify you're online
   - Try loading Binance.com
   - Check firewall settings

2. **Check API Status**
   - Visit https://api.binance.com/api/v3/ping
   - Should return `{}`
   - If error, API is down

3. **Check Browser Console**
   - Press F12
   - Look for API errors
   - Check for CORS issues

4. **Check Rate Limits**
   - Binance allows 1200 requests/minute
   - Wait 1 minute if rate limited
   - Check if using too many tabs

5. **Check Fallback APIs**
   - Primary: api.binance.com
   - Fallback 1: data-api.binance.vision
   - Fallback 2: api.coingecko.com
   - Check which is working

**Debug Code:**
```javascript
// In browser console:
fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

**Status:** Common, usually network or rate limit

---

### Issue: API Rate Limit Exceeded

**Symptoms:**
- Error 429 in console
- "Too many requests" message
- Prices stop updating

**Solutions:**

1. **Wait 1 Minute**
   - Binance rate limit resets every minute
   - Stop refreshing for 60 seconds
   - Try again

2. **Close Extra Tabs**
   - Each tab makes API calls
   - Close unused tabs
   - Keep only 1-2 tabs open

3. **Check Worker Frequency**
   - Worker runs every 1 minute
   - Should not exceed limits
   - Check worker_logs for errors

4. **Use Fallback API**
   - System should auto-fallback
   - Check if fallback is working
   - Manual fallback in code if needed

**Status:** Common, wait or reduce requests

---

### Issue: Charts Not Rendering

**Symptoms:**
- Blank chart area
- Chart loading forever
- Chart errors in console

**Solutions:**

1. **Check Data Availability**
   - Verify price data exists
   - Check if candles are fetched
   - Look for data errors

2. **Check Chart Library**
   - Lightweight Charts loaded?
   - Recharts loaded?
   - Check for import errors

3. **Clear Cache**
   ```javascript
   localStorage.clear();
   location.reload();
   ```

4. **Check Browser Compatibility**
   - Use modern browser (Chrome/Firefox)
   - Update browser
   - Try incognito mode

**Status:** Rare, usually data or library issue

---

## 💹 Trading Issues

### Issue: Trades Not Executing

**Symptoms:**
- Click BUY but nothing happens
- No position opens
- No error message

**Solutions:**

1. **Check Available Balance**
   - Verify you have funds
   - Check wallet stats
   - Ensure balance > trade amount

2. **Check Trade Amount**
   - Minimum: $1
   - Maximum: $1,000
   - Must be valid number

3. **Check Bot Status**
   - Is bot running?
   - Check Engine Status panel
   - Start bot if stopped

4. **Check Console Errors**
   - Press F12
   - Look for trading errors
   - Check for validation errors

5. **Check TradingEngine**
   - Open browser console
   - Check if engine is initialized
   - Verify engine methods work

**Debug Code:**
```javascript
// In browser console (if engine exposed):
// Check current state
console.log('Positions:', engine.getPositions());
console.log('Wallet:', engine.getWalletState());
```

**Status:** Common, usually balance or validation

---

### Issue: DCA Not Triggering

**Symptoms:**
- Price drops but no DCA
- DCA orders not executing
- Position stays at 1 order

**Solutions:**

1. **Check DCA Settings**
   - Verify DCA trigger % (default 3%)
   - Check max orders (default 4)
   - Ensure DCA mode enabled

2. **Check Price Drop**
   - Price must drop by trigger %
   - From last buy price
   - Not from initial price

3. **Check Available Balance**
   - Must have funds for DCA
   - DCA amount = additional buy
   - Default $10

4. **Check Max Orders**
   - Max 4 DCA orders per position
   - Check current order count
   - If at max, no more DCA

5. **Check Worker**
   - Worker must be running
   - Check worker_logs
   - Verify tick processing

**Status:** Common, check settings and balance

---

### Issue: No-Loss Mode Not Working

**Symptoms:**
- Sells at loss despite No-Loss ON
- Position closes at loss
- No-Loss toggle not working

**Solutions:**

1. **Verify No-Loss is ON**
   - Check Trading panel
   - Verify toggle is ON
   - Check Engine Status

2. **Check Sell Logic**
   - No-Loss should block loss sells
   - Only sell at profit target
   - Check TradingEngine code

3. **Check Profit Target**
   - Calculate profit target
   - Target = avg entry + fees + slippage + profit %
   - Must reach target to sell

4. **Check for Bugs**
   - Open browser console
   - Look for logic errors
   - Check TradingEngine.sell()

**Status:** Rare, check logic and settings

---

### Issue: P/L Calculation Wrong

**Symptoms:**
- P/L doesn't match expectations
- Fees not included
- Slippage not applied

**Solutions:**

1. **Check Fee Calculation**
   - Fee = amount × 0.1%
   - Applied on BUY and SELL
   - Check TradingEngine code

2. **Check Slippage**
   - Slippage = 0.05%
   - BUY: price × 1.0005
   - SELL: price × 0.9995
   - Check execution price

3. **Check Decimal Precision**
   - Using Decimal.js?
   - No floating point errors?
   - Check PaperWallet code

4. **Manual Calculation**
   - Calculate expected P/L manually
   - Compare with shown P/L
   - Identify discrepancy

**Example:**
```
BUY: $10 @ $100
Fee: $10 × 0.1% = $0.01
Slippage: $100 × 1.0005 = $100.05
Quantity: $10 / $100.05 = 0.09995

SELL: 0.09995 @ $102
Slippage: $102 × 0.9995 = $101.949
Gross: 0.09995 × $101.949 = $10.19
Fee: $10.19 × 0.1% = $0.01
Net: $10.19 - $0.01 = $10.18

P/L: $10.18 - $10.00 = $0.18
```

**Status:** Rare, check calculation logic

---

## ⚙️ Worker Issues

### Issue: Supabase Worker Not Running

**Symptoms:**
- No entries in worker_logs
- Trades not executing automatically
- pg_cron job not running

**Solutions:**

1. **Check pg_cron Enabled**
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```
   Should return 1 row. If not, enable in Supabase dashboard.

2. **Check Cron Job**
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'trading-worker';
   ```
   Should show schedule `* * * * *`

3. **Check Edge Function**
   ```bash
   supabase functions list
   ```
   Should show `trading-worker`

4. **Check Function Logs**
   - Go to Supabase dashboard
   - Edge Functions → trading-worker
   - Check logs for errors

5. **Redeploy Function**
   ```bash
   supabase functions deploy trading-worker
   ```

6. **Check Environment Variables**
   ```bash
   supabase secrets list
   ```
   Should show:
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY

**Status:** Common, check pg_cron and deployment

---

### Issue: Cloudflare Worker Not Running

**Symptoms:**
- No logs in Supabase
- Worker not executing
- Cloudflare dashboard shows errors

**Solutions:**

1. **Check Worker Deployment**
   ```bash
   wrangler deployments list
   ```

2. **Check Cron Trigger**
   - Go to Cloudflare dashboard
   - Workers → trading-worker
   - Check Triggers tab
   - Verify cron schedule

3. **Check Worker Logs**
   ```bash
   wrangler tail
   ```

4. **Check Secrets**
   ```bash
   wrangler secret list
   ```
   Should show:
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY

5. **Redeploy Worker**
   ```bash
   cd workers/trading-worker
   wrangler deploy
   ```

6. **Check Request Count**
   - Cloudflare dashboard → Workers
   - Check requests today
   - Must be < 100,000

**Status:** Rare, check deployment and secrets

---

### Issue: GitHub Actions Not Running

**Symptoms:**
- Workflow not triggering
- Actions tab shows no runs
- Exceeded free tier

**Solutions:**

1. **Check Workflow File**
   - Verify `.github/workflows/trading-worker.yml` exists
   - Check cron schedule: `* * * * *`
   - Verify syntax

2. **Check Secrets**
   - Go to repo Settings → Secrets
   - Verify SUPABASE_URL exists
   - Verify SUPABASE_SERVICE_ROLE_KEY exists

3. **Check Minute Usage**
   - Go to repo Settings → Billing
   - Check Actions minutes used
   - Free tier: 2,000 minutes/month
   - This workflow uses ~43,200 minutes/month ⚠️

4. **Disable if Over Limit**
   - Go to Actions tab
   - Click workflow
   - Click "Disable workflow"
   - Use Supabase or Cloudflare instead

**Status:** Common, usually exceeds free tier

---

## 📱 Telegram Issues

### Issue: Telegram Notifications Not Sending

**Symptoms:**
- No messages in Telegram
- Test connection fails
- Error in logs

**Solutions:**

1. **Check Bot Token**
   - Verify token format: `123456789:ABCdef...`
   - Token from @BotFather
   - No extra spaces

2. **Check Chat ID**
   - Verify chat ID is numeric
   - From @userinfobot
   - No extra characters

3. **Test Bot Manually**
   - Open bot in Telegram
   - Send `/start`
   - Should respond

4. **Check Edge Function**
   ```bash
   supabase functions logs telegram-notification
   ```

5. **Check Environment Variable**
   ```bash
   supabase secrets list
   ```
   Should show TELEGRAM_BOT_TOKEN

6. **Check Notification Settings**
   - Go to Settings tab
   - Verify notifications enabled
   - Check specific notification types

7. **Check Rate Limits**
   - Telegram: 30 messages/second
   - Check if rate limited
   - Wait and try again

**Status:** Common, check token and chat ID

---

### Issue: Telegram Test Connection Fails

**Symptoms:**
- Click "Test Connection" but fails
- Error message shown
- No test message received

**Solutions:**

1. **Verify Bot is Active**
   - Open bot in Telegram
   - Send any message
   - Bot should respond

2. **Check Bot Privacy Mode**
   - @BotFather → /mybots
   - Select your bot
   - Bot Settings → Group Privacy
   - Turn off (allow all messages)

3. **Check Chat ID Format**
   - Must be numeric
   - Positive for private chats
   - Negative for groups

4. **Check Network**
   - Can you reach Telegram API?
   ```bash
   curl https://api.telegram.org/botYOUR_TOKEN/getMe
   ```
   Should return bot info

5. **Check Firewall**
   - Ensure api.telegram.org not blocked
   - Check corporate firewall
   - Try different network

**Status:** Common, check bot status and network

---

## 🗄️ Database Issues

### Issue: Database Connection Failed

**Symptoms:**
- "Connection refused" error
- Cannot save data
- Supabase errors

**Solutions:**

1. **Check Supabase Status**
   - Visit https://status.supabase.com
   - Check for outages

2. **Check Project URL**
   - Verify SUPABASE_URL correct
   - Format: `https://xxxxx.supabase.co`
   - No trailing slash

3. **Check API Keys**
   - Verify anon key correct
   - Verify service role key correct
   - No extra spaces

4. **Check Database Password**
   - Go to Supabase dashboard
   - Settings → Database
   - Verify password correct
   - Reset if needed

5. **Check Network**
   - Can you reach Supabase?
   ```bash
   curl https://YOUR_PROJECT.supabase.co/rest/v1/
   ```
   Should return API info

**Status:** Rare, usually configuration

---

### Issue: RLS Policy Blocking Access

**Symptoms:**
- "New row violates row-level security" error
- Cannot insert data
- Cannot read data

**Solutions:**

1. **Check RLS Enabled**
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```

2. **Check Policies**
   ```sql
   SELECT * FROM pg_policies WHERE schemaname = 'public';
   ```

3. **Check User Authentication**
   - Are you logged in?
   - Check auth.uid() in queries
   - Verify user exists in profiles

4. **Test with Service Role**
   - Service role bypasses RLS
   - Use for backend operations
   - Never expose in frontend

5. **Re-run Migrations**
   ```sql
   -- Re-apply RLS policies
   -- Run migration files again
   ```

**Status:** Common for new users, check auth

---

### Issue: Migrations Failed

**Symptoms:**
- Tables not created
- SQL errors
- Missing columns

**Solutions:**

1. **Check Migration Order**
   - Run 001 first
   - Then 002
   - Then 003
   - Order matters

2. **Check for Errors**
   - Read error message carefully
   - Check line number
   - Fix SQL syntax

3. **Drop and Recreate**
   ```sql
   -- WARNING: Deletes all data!
   DROP TABLE IF EXISTS table_name CASCADE;
   -- Then re-run migration
   ```

4. **Check Dependencies**
   - Foreign keys must reference existing tables
   - Extensions must be enabled
   - Check migration file

**Status:** Rare, check SQL syntax

---

## 🔨 Build Issues

### Issue: npm run build Fails

**Symptoms:**
- Build errors
- TypeScript errors
- Missing dependencies

**Solutions:**

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Check Node Version**
   ```bash
   node --version
   ```
   Should be 18+

3. **Clear Cache**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Check TypeScript Errors**
   ```bash
   npm run typecheck
   ```
   Fix all errors

5. **Check Import Paths**
   - Verify all imports correct
   - Check file extensions
   - Verify module exists

**Status:** Common, usually dependencies

---

### Issue: Vercel Deployment Fails

**Symptoms:**
- Deployment error
- Build failed
- Cannot access site

**Solutions:**

1. **Check Build Logs**
   - Go to Vercel dashboard
   - Select deployment
   - Check build logs
   - Find error

2. **Check Framework Preset**
   - Should be "Vite"
   - Build command: `npm run build`
   - Output directory: `dist`

3. **Check Environment Variables**
   - Vercel dashboard → Settings → Environment Variables
   - Add required variables
   - Redeploy

4. **Check Node Version**
   - Vercel Settings → General
   - Node.js version: 18.x

5. **Redeploy**
   - Vercel dashboard → Deployments
   - Click "Redeploy" on latest

**Status:** Common, check build logs

---

## 🐛 Debugging Tips

### 1. Browser Console

Always check browser console first:
```
Press F12 → Console tab
```

Look for:
- Red errors
- Yellow warnings
- Failed network requests

### 2. Network Tab

Check API calls:
```
Press F12 → Network tab
```

Look for:
- Failed requests (red)
- Slow requests (> 1s)
- Wrong response codes

### 3. Application Tab

Check localStorage:
```
Press F12 → Application → Local Storage
```

Look for:
- Corrupted data
- Missing keys
- Wrong values

### 4. React DevTools

Install React DevTools extension:
- Check component state
- Check props
- Check context

### 5. Supabase Dashboard

Check database:
- Table Editor → View data
- Logs → Check errors
- Edge Functions → Check logs

---

## 📞 Getting Help

### Before Asking for Help

1. ✅ Check this troubleshooting guide
2. ✅ Check browser console for errors
3. ✅ Check network tab for failed requests
4. ✅ Try clearing cache and reloading
5. ✅ Try incognito mode
6. ✅ Check if issue is reproducible

### How to Ask for Help

1. **GitHub Issues**
   - https://github.com/YOUR_USERNAME/crypto-trading-simulator-pro/issues
   - Use clear title
   - Describe steps to reproduce
   - Include screenshots
   - Include console errors

2. **Include:**
   - Browser and version
   - Device (desktop/mobile)
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots/videos
   - Console errors
   - Network errors

3. **Don't Include:**
   - Secret keys
   - Personal information
   - Large log files (use gist)

---

## 📊 Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Failed to fetch" | Network error | Check internet, try again |
| "Rate limit exceeded" | Too many requests | Wait 1 minute |
| "Invalid API key" | Wrong credentials | Check environment variables |
| "RLS policy violation" | Auth issue | Check login, check policies |
| "Build failed" | Code error | Check build logs, fix errors |
| "Module not found" | Missing dependency | Run `npm install` |
| "Type error" | TypeScript error | Fix type errors |
| "Connection refused" | Service down | Check service status |

---

## 🎯 Prevention Tips

### 1. Regular Backups
- Export data regularly
- Keep code in Git
- Backup Supabase database

### 2. Monitor Usage
- Check API usage
- Monitor worker logs
- Track minute usage (GitHub)

### 3. Test Changes
- Test in development first
- Use staging environment
- Don't deploy untested code

### 4. Keep Updated
- Update dependencies regularly
- Check for security updates
- Update documentation

### 5. Document Everything
- Keep notes of changes
- Document configurations
- Save important settings

---

**Developer:** Taseen Billah  
**Version:** 6.0.0  
**Last Updated:** Phase 6 Complete

**Remember**: Most issues are solved by clearing cache, checking console errors, and verifying configuration. When in doubt, check the browser console first!
