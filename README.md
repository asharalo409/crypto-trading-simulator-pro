# Crypto Trading Simulator Pro

## 📊 Phase 3 Complete: Scheduled Paper Trading Worker

**Status:** ✅ Complete  
**Version:** 3.0.0  
**Owner:** Taseen Billah

---

## 🎯 Project Overview

Advanced AI-Assisted Automated Crypto Paper Trading Platform with:
- Automated Paper Trading Engine
- DCA / Averaging Down Strategy
- No-Loss Hold Mode
- Scheduled Workers (24/7 automation)
- Market Radar with Technical Analysis
- Multi-theme Dashboard
- Bengali + English Language Support

---

## 🎯 Phase 2 Features Implemented

### ✅ Core Trading Engine
- [x] **Automated Paper BUY/SELL Engine** - Fully functional trading engine
- [x] **No-Loss Hold Mode** - Profit-only selling when enabled
- [x] **No-Loss Sell Toggle** - ON/OFF switch for risk management
- [x] **DCA / Averaging Down** - Automatic dollar-cost averaging
- [x] **Maximum 4 BUY Orders** - Per coin position limit
- [x] **Configurable DCA Trigger** - Customizable price drop percentage
- [x] **Average Entry Price Calculation** - Accurate position tracking
- [x] **Fee-Adjusted Profit Calculation** - Real trading costs included
- [x] **Slippage Calculation** - Simulated market impact
- [x] **Paper Wallet Balance Update** - Real-time balance tracking
- [x] **Open Positions Management** - Active position tracking
- [x] **Closed Positions History** - Completed trade archive
- [x] **Complete Trade History** - All trades logged with details
- [x] **Profit/Loss Tracking** - Realized and unrealized P/L
- [x] **Stop Loss / Take Profit** - Configurable risk limits
- [x] **Maximum Investment Limit** - Per-coin cap ($1,000 default)
- [x] **Duplicate Trade Prevention** - Idempotency protection
- [x] **Decimal.js Precision** - All calculations use high precision

### ✅ Technical Analysis
- [x] **RSI Calculation** - Relative Strength Index (14-period)
- [x] **EMA Calculation** - Exponential Moving Average (20, 50)
- [x] **MACD Calculation** - Moving Average Convergence Divergence
- [x] **Trend Detection** - UP/DOWN/SIDEWAYS identification
- [x] **Volatility Measurement** - Standard deviation analysis
- [x] **Signal Generation** - BUY/SELL/HOLD/DCA/WAIT signals

### ✅ User Interface
- [x] **Engine Status Panel** - Real-time engine monitoring
- [x] **Manual Trading Interface** - BUY/SELL buttons for testing
- [x] **Position Details** - DCA orders visualization
- [x] **Trade History View** - Complete trade log
- [x] **Engine Logs** - Real-time activity feed
- [x] **Risk Warnings** - Clear disclaimers displayed
- [x] **5 Theme Options** - Cyberpunk, Binance, Tokyo, Matrix, OLED
- [x] **Bilingual Support** - Bengali and English

### ✅ Database Schema
- [x] **Complete Supabase Migration** - All tables defined
- [x] **Row Level Security** - User data isolation
- [x] **Auto-triggers** - Wallet creation on signup
- [x] **Indexes** - Optimized queries
- [x] **Idempotency Tables** - Duplicate prevention

---

## 📁 File Structure

```
crypto-trading-simulator-pro/
├── src/
│   ├── engine/
│   │   ├── TradingEngine.ts       # Core trading logic
│   │   ├── PaperWallet.ts         # Virtual wallet management
│   │   └── MarketAnalyzer.ts      # Technical analysis
│   ├── contexts/
│   │   ├── TradingContext.tsx     # Engine state management
│   │   ├── ThemeContext.tsx       # Theme system
│   │   ├── LanguageContext.tsx    # i18n system
│   │   └── chartHelpers.ts       # Chart data generation
│   ├── components/
│   │   ├── EngineStatus.tsx       # Engine monitoring
│   │   ├── TradingPanel.tsx       # Trading controls
│   │   ├── MarketRadar.tsx        # Market signals
│   │   ├── Charts.tsx             # Analytics charts
│   │   ├── WalletStats.tsx        # Balance display
│   │   ├── SettingsPanel.tsx      # Configuration
│   │   └── Header.tsx             # Navigation
│   ├── types/
│   │   └── index.ts               # TypeScript definitions
│   ├── data/
│   │   ├── coins.ts               # Supported coins
│   │   └── translations.ts        # i18n strings
│   ├── App.tsx                    # Main app
│   ├── main.tsx                   # Entry point
│   └── index.css                  # Global styles
├── supabase/
│   └── migrations/
│       └── 001_phase2_schema.sql  # Database schema
├── index.html
├── package.json
└── README.md
```

---

## 🔧 Trading Engine Architecture

### Core Components

#### 1. TradingEngine (`src/engine/TradingEngine.ts`)
Main orchestrator that coordinates all trading operations:
- Processes market ticks every 5 seconds
- Executes BUY/SELL orders
- Manages DCA strategy
- Handles No-Loss Hold logic
- Prevents duplicate trades
- Calculates fees and slippage

#### 2. PaperWallet (`src/engine/PaperWallet.ts`)
Virtual wallet with Decimal.js precision:
- Tracks available balance
- Manages invested balance
- Records realized/unrealized P/L
- Handles fund deduction/addition
- Serializes state for persistence

#### 3. MarketAnalyzer (`src/engine/MarketAnalyzer.ts`)
Technical analysis calculations:
- RSI (14-period)
- EMA (20, 50-period)
- MACD (12, 26, 9)
- Trend detection
- Volatility measurement
- Signal generation

### Trading Flow

```
Market Tick (every 5s)
    ↓
Update Price History
    ↓
Calculate Indicators (RSI, EMA, MACD)
    ↓
Generate Signal (BUY/SELL/HOLD/DCA/WAIT)
    ↓
Check Existing Positions
    ↓
├─ If Position Exists:
│   ├─ Update Unrealized P/L
│   ├─ Check DCA Trigger
│   │   └─ If triggered: Execute DCA BUY
│   └─ Check Sell Conditions
│       ├─ No-Loss Mode: Only sell at profit
│       └─ Normal Mode: Stop loss / Take profit
│
└─ If No Position:
    └─ If Signal = BUY: Execute Initial BUY
    ↓
Record Trade
    ↓
Update Wallet
    ↓
Persist State (localStorage)
```

---

## 🎮 DCA Strategy Details

### Configuration
```typescript
{
  initialBuy: $10,           // First buy amount
  additionalBuy: $10,        // DCA buy amount
  dcaTriggerPercent: 3%,     // Price drop trigger
  maxBuyOrders: 4,           // Maximum DCA orders
  profitTargetPercent: 1.5%, // Net profit target
  tradingFeePercent: 0.1%,   // Fee per trade
  slippagePercent: 0.05%     // Simulated slippage
}
```

### DCA Example (AVAX)
```
BUY 1: $37.20 × 0.269 = $10.00
BUY 2: $36.08 × 0.277 = $10.00  (after 3% drop)
BUY 3: $35.00 × 0.286 = $10.00  (after another 3% drop)
BUY 4: $33.95 × 0.295 = $10.00  (after another 3% drop)

Total Invested: $40.00
Total Quantity: 1.127 AVAX
Average Entry: $35.49
Profit Target: $36.09 (+1.5% after fees)
```

### Profit Target Calculation
```
Target Price = Avg Entry × (1 + (totalFees + totalSlippage + profitTarget) / 100)

Example:
Avg Entry: $35.49
Total Fees: 0.2% (0.1% buy + 0.1% sell)
Total Slippage: 0.1% (0.05% buy + 0.05% sell)
Profit Target: 1.5%

Target = $35.49 × (1 + 1.8/100) = $36.13
```

---

## 🛡️ No-Loss Hold Mode

### When ON:
- ✅ Only sells when net profit target is reached
- ✅ Holds through price drops
- ✅ Continues DCA if enabled
- ✅ Never sells at a loss
- ⚠️ Capital may remain locked
- ⚠️ No guaranteed profit

### When OFF:
- ✅ Respects stop loss (default 5%)
- ✅ Respects take profit (default 3%)
- ✅ Can sell at loss if stop loss triggered
- ✅ More active trading

### Risk Warning
```
⚠️ No-Loss Mode does NOT guarantee profit.
- Capital may remain locked indefinitely
- Coin value may continue decreasing
- Maximum 4 DCA orders per position
- No unlimited averaging down
- No leverage or borrowing
```

---

## 🧪 Testing Checklist

### Manual Testing

#### 1. Engine Initialization
- [ ] App loads without errors
- [ ] Wallet shows $10,000 starting balance
- [ ] Engine status shows "ACTIVE"
- [ ] No-Loss mode is ON by default
- [ ] DCA mode is selected by default

#### 2. Manual Trading
- [ ] Click "Manual Paper Trading" to expand
- [ ] Select a coin (e.g., BTC)
- [ ] Enter amount ($10)
- [ ] Click BUY - position opens
- [ ] Verify position appears in "Open Positions"
- [ ] Verify wallet balance decreased
- [ ] Click SELL - position closes
- [ ] Verify trade appears in "Trades" tab
- [ ] Verify P/L calculated correctly

#### 3. DCA Strategy
- [ ] Open position in BTC ($10)
- [ ] Wait for price to drop 3%
- [ ] Verify DCA BUY triggers automatically
- [ ] Check DCA order #2 appears
- [ ] Repeat for orders #3 and #4
- [ ] Verify max 4 orders limit enforced
- [ ] Check average entry price recalculated

#### 4. No-Loss Mode
- [ ] Enable No-Loss mode
- [ ] Open position at loss
- [ ] Verify SELL blocked with message
- [ ] Wait for profit target
- [ ] Verify SELL executes at profit
- [ ] Disable No-Loss mode
- [ ] Verify stop loss works

#### 5. Fee & Slippage
- [ ] Execute BUY - verify fee deducted
- [ ] Execute SELL - verify fee deducted
- [ ] Check slippage applied to execution price
- [ ] Verify profit target includes all costs

#### 6. Persistence
- [ ] Make trades
- [ ] Refresh page
- [ ] Verify positions restored
- [ ] Verify trades restored
- [ ] Verify wallet balance correct

#### 7. UI/UX
- [ ] Switch between all 5 themes
- [ ] Toggle language (EN/বাংলা)
- [ ] Check mobile responsiveness
- [ ] Verify all charts render
- [ ] Check engine logs update

#### 8. Edge Cases
- [ ] Try BUY with insufficient balance
- [ ] Try BUY > $1,000 (max limit)
- [ ] Try BUY < $1 (min limit)
- [ ] Try SELL with no position
- [ ] Verify duplicate trade prevention

---

## 🚀 Deployment Instructions

### For Android GitHub Users

#### Step 1: Create Repository
```bash
# On GitHub.com
1. Click "New Repository"
2. Name: crypto-trading-simulator-pro
3. Public
4. Click "Create repository"
```

#### Step 2: Upload Files
```bash
# Option A: GitHub Web Interface
1. Go to your repo
2. Click "Add file" → "Upload files"
3. Drag all project files
4. Commit changes

# Option B: Git Commands (if you have Git)
git init
git add .
git commit -m "Phase 2: Paper Trading Engine"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/crypto-trading-simulator-pro.git
git push -u origin main
```

#### Step 3: Deploy to Vercel
```bash
1. Go to vercel.com
2. Sign up with GitHub
3. Click "New Project"
4. Import your repository
5. Framework: Vite
6. Click "Deploy"
7. Wait 2-3 minutes
8. Your app is live!
```

#### Step 4: Setup Supabase (Phase 3)
```bash
1. Go to supabase.com
2. Create new project
3. Go to SQL Editor
4. Copy content from supabase/migrations/001_phase2_schema.sql
5. Paste and run
6. Save your project URL and anon key
```

---

## 📊 Database Schema Summary

### Tables Created:
1. **profiles** - User information
2. **user_settings** - Theme, language preferences
3. **paper_wallets** - Virtual wallet balances
4. **bot_config** - Trading configuration
5. **bot_state** - Engine state for cron workers
6. **positions** - Open/closed positions
7. **trades** - Complete trade history
8. **dca_orders** - Individual DCA orders
9. **market_candles** - Cached price data
10. **market_signals** - Generated signals
11. **portfolio_snapshots** - Balance history
12. **notification_settings** - Telegram config
13. **worker_logs** - Cron execution logs
14. **processed_candles** - Idempotency tracking

### Security:
- ✅ Row Level Security (RLS) enabled
- ✅ Users can only access their own data
- ✅ Auto-create wallet on signup
- ✅ No exposed secrets

---

## ⚙️ Configuration Options

### Trading Modes
1. **Smart Trend** - EMA crossover strategy
2. **Scalping** - Quick small-profit trades
3. **No-Loss Hold** - Hold until profit
4. **DCA** - Dollar-cost averaging (default)

### Risk Settings
```typescript
maxInvestmentPerCoin: $1,000
stopLossPercent: 5%
takeProfitPercent: 3%
```

### DCA Settings
```typescript
initialBuy: $10
additionalBuy: $10
dcaTriggerPercent: 3%
maxBuyOrders: 4
profitTargetPercent: 1.5%
tradingFeePercent: 0.1%
slippagePercent: 0.05%
```

---

## 🔒 Important Disclaimers

### ⚠️ This is a SIMULATION
- ❌ No real money trading
- ❌ No real Binance orders
- ❌ No guaranteed profits
- ❌ Not financial advice

### 📝 Risk Factors
- Capital may remain locked in No-Loss mode
- Coin values can decrease indefinitely
- Maximum 4 DCA orders per position
- No leverage or borrowing
- Past performance ≠ future results

---

## 🎯 Phase 3 Preview

Next phase will implement:
- [ ] Supabase integration
- [ ] Real-time market data from Binance API
- [ ] Cron workers for 24/7 automation
- [ ] Telegram notifications
- [ ] User authentication
- [ ] Multi-user support
- [ ] Cloud deployment

---

## 📞 Support

**Developer:** Taseen Billah  
**Repository:** https://github.com/taseenbillah/crypto-trading-simulator-pro  
**Version:** 2.0.0 (Phase 2)

---

## 📜 License

MIT License - Free for educational purposes

---

**Last Updated:** Phase 2 Complete ✅  
**Build Status:** ✅ Passing  
**Next Phase:** Phase 3 - Supabase Integration & Live Data
