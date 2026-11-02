# 🏗️ System Architecture - Crypto Trading Simulator Pro

## Complete Technical Architecture Documentation

---

## 📊 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                           │
│                    (React + Vite + Tailwind)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │Dashboard │ │  Radar   │ │ Trading  │ │Analytics │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                        │
│  │ Backtest │ │ Settings │ │  Theme   │                        │
│  └──────────┘ └──────────┘ └──────────┘                        │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND SERVICES                           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │ TradingEngine│ │MarketAnalyzer│ │ PaperWallet  │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │BacktestEngine│ │ BinanceAPI   │ │  CSVExport   │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
│  ┌──────────────┐ ┌──────────────┐                              │
│  │SecurityLayer │ │TelegramService│                             │
│  └──────────────┘ └──────────────┘                              │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL APIS (Public)                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │ Binance API  │ │Binance Vision│ │  CoinGecko   │            │
│  │  (Primary)   │ │  (Fallback)  │ │  (Fallback)  │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND SERVICES                            │
│  ┌────────────────────────────────────────────────────────┐     │
│  │              SUPABASE (PostgreSQL)                      │     │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │     │
│  │  │ profiles │ │  wallet  │ │positions │ │  trades  │ │     │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │     │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │     │
│  │  │bot_config│ │bot_state │ │  candles │ │ signals  │ │     │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │     │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │     │
│  │  │  audit   │ │telegram  │ │rate_limit│ │processed │ │     │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐     │
│  │          SUPABASE EDGE FUNCTIONS                        │     │
│  │  ┌──────────────────┐ ┌──────────────────┐             │     │
│  │  │  trading-worker  │ │telegram-notification│           │     │
│  │  │   (Deno/TypeScript)│ │  (Deno/TypeScript)│          │     │
│  │  └──────────────────┘ └──────────────────┘             │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐     │
│  │              SCHEDULERS                                 │     │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐         │     │
│  │  │ Supabase   │ │ Cloudflare │ │  GitHub    │         │     │
│  │  │  pg_cron   │ │  Workers   │ │  Actions   │         │     │
│  │  │ (Primary)  │ │  (Backup)  │ │(3rd Backup)│         │     │
│  │  └────────────┘ └────────────┘ └────────────┘         │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NOTIFICATION SYSTEM                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Telegram Bot API                       │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │  │
│  │  │ Bot Start│ │  BUY     │ │   SELL   │ │   DCA    │   │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │  │
│  │  │  Profit  │ │  Daily   │ │  Worker  │ │   Risk   │   │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ File Structure

```
crypto-trading-simulator-pro/
│
├── 📁 src/                          # Frontend source code
│   ├── 📁 components/               # React components
│   │   ├── Header.tsx              # Navigation header
│   │   ├── WalletStats.tsx         # Balance display
│   │   ├── EngineStatus.tsx        # Engine monitoring
│   │   ├── WorkerMonitoring.tsx    # Worker status
│   │   ├── MarketRadar.tsx         # Market signals
│   │   ├── Charts.tsx              # Analytics charts
│   │   ├── TradingPanel.tsx        # Trading controls
│   │   ├── AdvancedAnalytics.tsx   # Advanced analytics
│   │   ├── BacktestingPanel.tsx    # Backtesting UI
│   │   ├── TelegramSettings.tsx    # Telegram config
│   │   ├── AuditLogViewer.tsx      # Security audit
│   │   └── SettingsPanel.tsx       # App settings
│   │
│   ├── 📁 contexts/                 # React contexts
│   │   ├── ThemeContext.tsx        # Theme management
│   │   ├── LanguageContext.tsx     # i18n management
│   │   ├── TradingContext.tsx      # Trading state
│   │   └── chartHelpers.ts        # Chart utilities
│   │
│   ├── 📁 engine/                   # Trading engine
│   │   ├── TradingEngine.ts        # Core trading logic
│   │   ├── PaperWallet.ts          # Virtual wallet
│   │   ├── MarketAnalyzer.ts       # Technical analysis
│   │   └── BacktestEngine.ts       # Backtesting engine
│   │
│   ├── 📁 services/                 # External services
│   │   ├── BinanceAPI.ts           # Market data API
│   │   ├── TelegramService.ts      # Telegram notifications
│   │   ├── SecurityLayer.ts        # Security & validation
│   │   └── CSVExport.ts            # Data export
│   │
│   ├── 📁 data/                     # Static data
│   │   ├── coins.ts                # Supported coins
│   │   └── translations.ts         # i18n strings
│   │
│   ├── 📁 types/                    # TypeScript types
│   │   └── index.ts                # Type definitions
│   │
│   ├── App.tsx                      # Main app component
│   ├── main.tsx                     # Entry point
│   └── index.css                    # Global styles
│
├── 📁 supabase/                     # Supabase backend
│   ├── 📁 functions/                # Edge Functions
│   │   ├── 📁 trading-worker/      # Main trading worker
│   │   │   └── index.ts
│   │   └── 📁 telegram-notification/ # Telegram worker
│   │       └── index.ts
│   │
│   └── 📁 migrations/               # Database migrations
│       ├── 001_phase2_schema.sql   # Phase 2 tables
│       ├── 002_phase3_pg_cron.sql  # Phase 3 cron
│       └── 003_phase4_telegram.sql # Phase 4 telegram
│
├── 📁 workers/                      # Cloudflare Workers
│   └── 📁 trading-worker/
│       ├── 📁 src/
│       │   └── index.ts
│       └── wrangler.toml
│
├── 📁 .github/                      # GitHub Actions
│   └── 📁 workflows/
│       ├── trading-worker.yml
│       └── trading-worker-script.js
│
├── 📄 index.html                    # HTML entry
├── 📄 package.json                  # Dependencies
├── 📄 tsconfig.json                 # TypeScript config
├── 📄 vite.config.js               # Vite config
│
├── 📄 README.md                     # Project overview
├── 📄 DEPLOYMENT.md                 # Deployment guide
├── 📄 ARCHITECTURE.md              # This file
├── 📄 TESTING.md                    # Testing guide
├── 📄 TROUBLESHOOTING.md           # Problem solving
└── 📄 PHASE*_SUMMARY.md            # Phase summaries
```

---

## 🔧 Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2.0 | UI framework |
| TypeScript | Latest | Type safety |
| Vite | 6.4.3 | Build tool |
| Tailwind CSS | 4.1.7 | Styling |
| Recharts | 2.10.0 | Charts |
| Lightweight Charts | 5.2.1 | TradingView charts |
| Decimal.js | Latest | Precision math |
| Lucide React | 0.294.0 | Icons |
| UUID | 9.0.1 | Unique IDs |

### Backend
| Technology | Purpose |
|------------|---------|
| Supabase | Database + Auth + Edge Functions |
| PostgreSQL | Relational database |
| pg_cron | Scheduled tasks |
| pg_net | HTTP requests from DB |
| Deno | Edge Function runtime |

### Deployment
| Service | Purpose | Free Tier |
|---------|---------|-----------|
| GitHub | Code hosting | Unlimited |
| Vercel | Frontend hosting | 100GB/month |
| Supabase | Backend | 500MB DB |
| Cloudflare | Worker backup | 100k req/day |
| GitHub Actions | Worker backup | 2k min/month |

### External APIs
| API | Purpose | Auth Required |
|-----|---------|---------------|
| Binance API | Market data | No |
| Binance Vision | Fallback data | No |
| CoinGecko | Fallback data | No |
| Telegram Bot API | Notifications | Bot Token |

---

## 🔄 Data Flow

### Market Data Flow
```
Binance API
    ↓ (REST)
BinanceAPI Service
    ↓ (fallback)
Binance Vision / CoinGecko
    ↓
MarketAnalyzer
    ↓
TradingEngine
    ↓
UI Components
```

### Trading Flow
```
User Action / Cron Tick
    ↓
TradingEngine.processTick()
    ↓
├─► Fetch prices
├─► Calculate indicators
├─► Generate signals
├─► Check positions
├─► Execute trades
├─► Update wallet
└─► Log results
    ↓
UI Updates
    ↓
Telegram Notifications
```

### Backtest Flow
```
User Configuration
    ↓
Fetch Historical Candles
    ↓
BacktestEngine.run()
    ↓
├─► Process each candle
├─► Simulate trades
├─► Calculate metrics
└─► Generate equity curve
    ↓
Display Results
    ↓
Export to CSV
```

---

## 🗄️ Database Schema

### Core Tables

#### profiles
```sql
- id (UUID, PK)
- username (TEXT)
- display_name (TEXT)
- avatar_url (TEXT)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

#### paper_wallets
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- initial_balance (DECIMAL)
- available_balance (DECIMAL)
- invested_balance (DECIMAL)
- realized_pnl (DECIMAL)
- unrealized_pnl (DECIMAL)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

#### bot_config
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- is_running (BOOLEAN)
- no_loss_sell (BOOLEAN)
- trading_mode (TEXT)
- initial_buy (DECIMAL)
- additional_buy (DECIMAL)
- dca_trigger_percent (DECIMAL)
- max_buy_orders (INTEGER)
- profit_target_percent (DECIMAL)
- trading_fee_percent (DECIMAL)
- slippage_percent (DECIMAL)
- max_investment_per_coin (DECIMAL)
- stop_loss_percent (DECIMAL)
- take_profit_percent (DECIMAL)
```

#### positions
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- coin (TEXT)
- side (TEXT)
- entry_price (DECIMAL)
- quantity (DECIMAL)
- total_cost (DECIMAL)
- current_price (DECIMAL)
- avg_entry_price (DECIMAL)
- profit_target_price (DECIMAL)
- unrealized_pnl (DECIMAL)
- status (TEXT)
- opened_at (TIMESTAMPTZ)
- closed_at (TIMESTAMPTZ)
```

#### trades
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- position_id (UUID, FK)
- coin (TEXT)
- side (TEXT)
- price (DECIMAL)
- quantity (DECIMAL)
- total (DECIMAL)
- fee (DECIMAL)
- pnl (DECIMAL)
- is_dca (BOOLEAN)
- dca_order_number (INTEGER)
- executed_at (TIMESTAMPTZ)
```

---

## 🔒 Security Architecture

### Authentication
- Supabase Auth (email/password)
- JWT tokens
- Session management

### Authorization
- Row Level Security (RLS)
- User-specific data isolation
- Service role for backend

### Data Protection
- No secrets in frontend
- Environment variables only
- Encrypted at rest (Supabase)
- HTTPS only

### Rate Limiting
- Telegram: 30 msg/sec
- API: 1200 req/min
- User actions: 10 req/min
- Duplicate prevention: 5 sec

### Audit Trail
- All actions logged
- Timestamps recorded
- Success/failure tracked
- Exportable logs

---

## 📈 Performance Considerations

### Frontend
- React.memo for expensive components
- Lazy loading for routes
- Debounced API calls
- Optimistic UI updates

### Backend
- Database indexes on foreign keys
- Batch processing for workers
- Connection pooling (Supabase)
- Query optimization

### Caching
- LocalStorage for settings
- Browser cache for static assets
- CDN for Vercel deployment
- Supabase edge caching

---

## 🌐 Deployment Architecture

```
┌─────────────────┐
│   GitHub Repo   │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌────────────┐
│ Vercel │ │  Supabase  │
│(Frontend)│ │  (Backend) │
└────────┘ └─────┬──────┘
                 │
          ┌──────┴──────┐
          │             │
          ▼             ▼
    ┌──────────┐ ┌──────────┐
    │Edge Func │ │ pg_cron  │
    │(Workers) │ │(Scheduler)│
    └──────────┘ └──────────┘
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
┌──────────┐ ┌──────────┐
│Cloudflare│ │ GitHub   │
│ Workers  │ │ Actions  │
│ (Backup) │ │ (Backup) │
└──────────┘ └──────────┘
```

---

## 🎯 Key Design Decisions

### 1. Paper Trading Only
- No real money
- No real orders
- Educational purposes
- Risk-free testing

### 2. Free Tier First
- No credit card required
- Sustainable on free plans
- Upgrade path available
- Cost-effective

### 3. Multiple Worker Backups
- Primary: Supabase pg_cron
- Backup: Cloudflare Workers
- Third: GitHub Actions
- Redundancy for reliability

### 4. Client-Side Engine
- Trading logic in browser
- No server dependency for UI
- Works offline (partial)
- Fast response times

### 5. Decimal.js Precision
- All money calculations
- No floating point errors
- Accurate P/L tracking
- Professional grade

### 6. Theme System
- 5 beautiful themes
- User preference stored
- Consistent design
- Mobile optimized

### 7. Bilingual Support
- Bengali and English
- Easy to add languages
- Cultural accessibility
- Global reach

---

## 📊 Scaling Considerations

### Current Limits (Free Tier)
- Users: Unlimited (Supabase)
- Storage: 500MB (Supabase)
- Bandwidth: 100GB/month (Vercel)
- Edge Functions: 500k/month (Supabase)
- API calls: 1200/min (Binance)

### Scaling Path
1. **Supabase Pro** ($25/month)
   - 8GB database
   - 250GB bandwidth
   - 1M Edge Function invocations

2. **Vercel Pro** ($20/month)
   - 1TB bandwidth
   - Unlimited builds

3. **Custom Backend** (if needed)
   - Migrate to dedicated server
   - Keep same API structure
   - Minimal code changes

---

## 🔮 Future Architecture Enhancements

### Phase 7+
- WebSocket for real-time updates
- Redis for caching
- Message queue for workers
- Multi-region deployment
- Advanced analytics pipeline

### Phase 8+
- Machine learning signals
- Social trading features
- Mobile native apps
- API for third-party integrations
- White-label solutions

---

**Developer:** Taseen Billah  
**Version:** 6.0.0  
**Last Updated:** Phase 6 Complete
