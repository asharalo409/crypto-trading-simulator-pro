-- ============================================================
-- Crypto Trading Simulator Pro - Phase 2 Database Schema
-- Supabase PostgreSQL Migration
-- Owner: Taseen Billah
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: profiles
-- User profile information
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: user_settings
-- User preferences (theme, language, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'cyberpunk',
  language TEXT DEFAULT 'en',
  telegram_chat_id TEXT,
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================
-- TABLE: paper_wallets
-- Virtual wallet for each user
-- ============================================================
CREATE TABLE IF NOT EXISTS paper_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  initial_balance DECIMAL(20, 8) DEFAULT 10000.00,
  available_balance DECIMAL(20, 8) DEFAULT 10000.00,
  invested_balance DECIMAL(20, 8) DEFAULT 0.00,
  realized_pnl DECIMAL(20, 8) DEFAULT 0.00,
  unrealized_pnl DECIMAL(20, 8) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================
-- TABLE: bot_config
-- Trading bot configuration per user
-- ============================================================
CREATE TABLE IF NOT EXISTS bot_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_running BOOLEAN DEFAULT false,
  no_loss_sell BOOLEAN DEFAULT true,
  trading_mode TEXT DEFAULT 'dca',
  -- DCA Settings
  initial_buy DECIMAL(10, 2) DEFAULT 10.00,
  additional_buy DECIMAL(10, 2) DEFAULT 10.00,
  dca_trigger_percent DECIMAL(5, 2) DEFAULT 3.00,
  max_buy_orders INTEGER DEFAULT 4,
  profit_target_percent DECIMAL(5, 2) DEFAULT 1.50,
  trading_fee_percent DECIMAL(5, 4) DEFAULT 0.10,
  slippage_percent DECIMAL(5, 4) DEFAULT 0.05,
  -- Risk Management
  max_investment_per_coin DECIMAL(10, 2) DEFAULT 1000.00,
  stop_loss_percent DECIMAL(5, 2) DEFAULT 5.00,
  take_profit_percent DECIMAL(5, 2) DEFAULT 3.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================
-- TABLE: bot_state
-- Current state of the trading bot (for cron workers)
-- ============================================================
CREATE TABLE IF NOT EXISTS bot_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_processed_candle_time TIMESTAMPTZ,
  last_tick_time TIMESTAMPTZ,
  total_ticks INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  is_locked BOOLEAN DEFAULT false,
  lock_acquired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================
-- TABLE: positions
-- Open and closed trading positions
-- ============================================================
CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  coin TEXT NOT NULL,
  side TEXT NOT NULL DEFAULT 'LONG',
  entry_price DECIMAL(20, 8) NOT NULL,
  quantity DECIMAL(20, 8) NOT NULL,
  total_cost DECIMAL(20, 8) NOT NULL,
  current_price DECIMAL(20, 8),
  avg_entry_price DECIMAL(20, 8) NOT NULL,
  profit_target_price DECIMAL(20, 8),
  unrealized_pnl DECIMAL(20, 8) DEFAULT 0.00,
  unrealized_pnl_percent DECIMAL(10, 4) DEFAULT 0.00,
  realized_pnl DECIMAL(20, 8),
  status TEXT NOT NULL DEFAULT 'open',
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_positions_user_status ON positions(user_id, status);
CREATE INDEX idx_positions_coin ON positions(coin);

-- ============================================================
-- TABLE: trades
-- Complete trade history
-- ============================================================
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
  coin TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('BUY', 'SELL')),
  price DECIMAL(20, 8) NOT NULL,
  quantity DECIMAL(20, 8) NOT NULL,
  total DECIMAL(20, 8) NOT NULL,
  fee DECIMAL(20, 8) NOT NULL DEFAULT 0.00,
  slippage DECIMAL(20, 8) DEFAULT 0.00,
  pnl DECIMAL(20, 8) DEFAULT 0.00,
  is_dca BOOLEAN DEFAULT false,
  dca_order_number INTEGER,
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trades_user ON trades(user_id);
CREATE INDEX idx_trades_coin ON trades(coin);
CREATE INDEX idx_trades_executed ON trades(executed_at);

-- ============================================================
-- TABLE: dca_orders
-- Individual DCA orders within a position
-- ============================================================
CREATE TABLE IF NOT EXISTS dca_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
  order_number INTEGER NOT NULL,
  price DECIMAL(20, 8) NOT NULL,
  quantity DECIMAL(20, 8) NOT NULL,
  cost DECIMAL(20, 8) NOT NULL,
  fee DECIMAL(20, 8) NOT NULL DEFAULT 0.00,
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(position_id, order_number)
);

-- ============================================================
-- TABLE: market_candles
-- Cached candle data for analysis
-- ============================================================
CREATE TABLE IF NOT EXISTS market_candles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coin TEXT NOT NULL,
  interval TEXT NOT NULL DEFAULT '1h',
  open_time BIGINT NOT NULL,
  close_time BIGINT NOT NULL,
  open_price DECIMAL(20, 8) NOT NULL,
  high_price DECIMAL(20, 8) NOT NULL,
  low_price DECIMAL(20, 8) NOT NULL,
  close_price DECIMAL(20, 8) NOT NULL,
  volume DECIMAL(20, 8) NOT NULL,
  is_closed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(coin, interval, open_time)
);

CREATE INDEX idx_candles_coin_time ON market_candles(coin, interval, open_time DESC);

-- ============================================================
-- TABLE: market_signals
-- Generated trading signals
-- ============================================================
CREATE TABLE IF NOT EXISTS market_signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  coin TEXT NOT NULL,
  signal TEXT NOT NULL CHECK (signal IN ('BUY', 'SELL', 'HOLD', 'DCA', 'WAIT')),
  rsi DECIMAL(5, 2),
  ema20 DECIMAL(20, 8),
  ema50 DECIMAL(20, 8),
  macd DECIMAL(20, 8),
  volume DECIMAL(20, 8),
  trend TEXT,
  price_change_24h DECIMAL(10, 4),
  current_price DECIMAL(20, 8),
  oversold BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: portfolio_snapshots
-- Periodic balance snapshots for charts
-- ============================================================
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  total_balance DECIMAL(20, 8) NOT NULL,
  available_balance DECIMAL(20, 8) NOT NULL,
  invested_balance DECIMAL(20, 8) NOT NULL,
  pnl DECIMAL(20, 8) NOT NULL,
  snapshot_time TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_snapshots_user_time ON portfolio_snapshots(user_id, snapshot_time DESC);

-- ============================================================
-- TABLE: notification_settings
-- Telegram notification preferences
-- ============================================================
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  telegram_bot_token TEXT,
  telegram_chat_id TEXT,
  notify_buy BOOLEAN DEFAULT true,
  notify_sell BOOLEAN DEFAULT true,
  notify_dca BOOLEAN DEFAULT true,
  notify_profit BOOLEAN DEFAULT true,
  notify_error BOOLEAN DEFAULT true,
  notify_daily_summary BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================
-- TABLE: worker_logs
-- Cron worker execution logs
-- ============================================================
CREATE TABLE IF NOT EXISTS worker_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  worker_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'warning')),
  message TEXT,
  trades_executed INTEGER DEFAULT 0,
  errors TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_worker_logs_time ON worker_logs(created_at DESC);

-- ============================================================
-- TABLE: processed_candles
-- Track which candles have been processed (idempotency)
-- ============================================================
CREATE TABLE IF NOT EXISTS processed_candles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  coin TEXT NOT NULL,
  candle_time BIGINT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, coin, candle_time)
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE dca_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_candles ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_candles ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access their own data
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON user_settings FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own wallet" ON paper_wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own wallet" ON paper_wallets FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own bot config" ON bot_config FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own bot config" ON bot_config FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own bot state" ON bot_state FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own bot state" ON bot_state FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own positions" ON positions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own positions" ON positions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own trades" ON trades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trades" ON trades FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own DCA orders" ON dca_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own DCA orders" ON dca_orders FOR ALL USING (auth.uid() = user_id);

-- Market candles are public (read-only)
CREATE POLICY "Anyone can view market candles" ON market_candles FOR SELECT USING (true);

CREATE POLICY "Users can view own signals" ON market_signals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service can insert signals" ON market_signals FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own snapshots" ON portfolio_snapshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service can insert snapshots" ON portfolio_snapshots FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own notification settings" ON notification_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notification settings" ON notification_settings FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own worker logs" ON worker_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service can insert worker logs" ON worker_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own processed candles" ON processed_candles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service can manage processed candles" ON processed_candles FOR ALL USING (true);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_paper_wallets_updated_at BEFORE UPDATE ON paper_wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_bot_config_updated_at BEFORE UPDATE ON bot_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_bot_state_updated_at BEFORE UPDATE ON bot_state
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_notification_settings_updated_at BEFORE UPDATE ON notification_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TRIGGERS: Auto-create wallet and config on user signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO profiles (id, username) VALUES (NEW.id, NEW.email);
  
  -- Create paper wallet
  INSERT INTO paper_wallets (user_id, initial_balance, available_balance)
  VALUES (NEW.id, 10000.00, 10000.00);
  
  -- Create bot config
  INSERT INTO bot_config (user_id) VALUES (NEW.id);
  
  -- Create bot state
  INSERT INTO bot_state (user_id) VALUES (NEW.id);
  
  -- Create user settings
  INSERT INTO user_settings (user_id) VALUES (NEW.id);
  
  -- Create notification settings
  INSERT INTO notification_settings (user_id) VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
