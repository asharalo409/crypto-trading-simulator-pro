-- ============================================================
-- Crypto Trading Simulator Pro - Phase 4: Telegram & Security
-- Supabase PostgreSQL Migration
-- Owner: Taseen Billah
-- ============================================================

-- ============================================================
-- TABLE: telegram_notifications
-- Log of all Telegram notifications sent
-- ============================================================
CREATE TABLE IF NOT EXISTS telegram_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  chat_id TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  success BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_telegram_notifications_user ON telegram_notifications(user_id);
CREATE INDEX idx_telegram_notifications_time ON telegram_notifications(sent_at DESC);

-- ============================================================
-- TABLE: audit_logs
-- Security audit trail
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_time ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- ============================================================
-- Update notification_settings table
-- Add Telegram-specific fields if not exists
-- ============================================================
ALTER TABLE notification_settings 
ADD COLUMN IF NOT EXISTS telegram_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notify_bot_started BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_bot_stopped BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_risk_warning BOOLEAN DEFAULT true;

-- ============================================================
-- TABLE: rate_limits
-- Track rate limiting for users
-- ============================================================
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  window_end TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 minute',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, action, window_start)
);

CREATE INDEX idx_rate_limits_user_action ON rate_limits(user_id, action);

-- ============================================================
-- Function: Check rate limit
-- ============================================================
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_action TEXT,
  p_max_requests INTEGER DEFAULT 10,
  p_window_seconds INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER;
  v_window_start TIMESTAMPTZ;
BEGIN
  v_window_start := NOW() - (p_window_seconds || ' seconds')::INTERVAL;
  
  SELECT COALESCE(SUM(request_count), 0)
  INTO v_count
  FROM rate_limits
  WHERE user_id = p_user_id
    AND action = p_action
    AND window_start >= v_window_start;
  
  IF v_count >= p_max_requests THEN
    RETURN false;
  END IF;
  
  -- Insert or update rate limit
  INSERT INTO rate_limits (user_id, action, request_count, window_start, window_end)
  VALUES (p_user_id, p_action, 1, NOW(), NOW() + (p_window_seconds || ' seconds')::INTERVAL)
  ON CONFLICT (user_id, action, window_start)
  DO UPDATE SET request_count = rate_limits.request_count + 1;
  
  RETURN true;
END;
$$;

-- ============================================================
-- Function: Log audit entry
-- ============================================================
CREATE OR REPLACE FUNCTION log_audit(
  p_user_id UUID,
  p_action TEXT,
  p_resource TEXT,
  p_details JSONB DEFAULT '{}',
  p_success BOOLEAN DEFAULT true,
  p_error TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, resource, details, success, error_message)
  VALUES (p_user_id, p_action, p_resource, p_details, p_success, p_error);
END;
$$;

-- ============================================================
-- Function: Log Telegram notification
-- ============================================================
CREATE OR REPLACE FUNCTION log_telegram_notification(
  p_user_id UUID,
  p_notification_type TEXT,
  p_chat_id TEXT,
  p_message TEXT,
  p_success BOOLEAN,
  p_error TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO telegram_notifications (
    user_id, notification_type, chat_id, message, success, error_message
  )
  VALUES (
    p_user_id, p_notification_type, p_chat_id, p_message, p_success, p_error
  );
END;
$$;

-- ============================================================
-- Function: Cleanup old audit logs (keep 90 days)
-- ============================================================
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  DELETE FROM telegram_notifications
  WHERE sent_at < NOW() - INTERVAL '30 days';
  
  DELETE FROM rate_limits
  WHERE window_end < NOW() - INTERVAL '1 hour';
  
  RAISE NOTICE 'Cleanup completed at %', NOW();
END;
$$;

-- Schedule cleanup weekly
SELECT cron.schedule(
  'cleanup-audit-logs',
  '0 4 * * 0',  -- Every Sunday at 4 AM
  'SELECT cleanup_old_audit_logs();'
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE telegram_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "Users can view own telegram notifications" 
  ON telegram_notifications FOR SELECT 
  USING (auth.uid() = user_id);

-- Service role can insert notifications
CREATE POLICY "Service can insert telegram notifications" 
  ON telegram_notifications FOR INSERT 
  WITH CHECK (true);

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs" 
  ON audit_logs FOR SELECT 
  USING (auth.uid() = user_id);

-- Service can insert audit logs
CREATE POLICY "Service can insert audit logs" 
  ON audit_logs FOR INSERT 
  WITH CHECK (true);

-- Users can view their own rate limits
CREATE POLICY "Users can view own rate limits" 
  ON rate_limits FOR SELECT 
  USING (auth.uid() = user_id);

-- Service can manage rate limits
CREATE POLICY "Service can manage rate limits" 
  ON rate_limits FOR ALL 
  USING (true);

-- ============================================================
-- Trigger: Auto-log user actions
-- ============================================================
CREATE OR REPLACE FUNCTION log_user_action()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log bot config changes
  IF TG_TABLE_NAME = 'bot_config' THEN
    PERFORM log_audit(
      NEW.user_id,
      'bot_config_updated',
      'bot_config',
      jsonb_build_object(
        'is_running', NEW.is_running,
        'no_loss_sell', NEW.no_loss_sell,
        'trading_mode', NEW.trading_mode
      ),
      true
    );
  END IF;
  
  -- Log trade executions
  IF TG_TABLE_NAME = 'trades' THEN
    PERFORM log_audit(
      NEW.user_id,
      'trade_executed',
      'trades',
      jsonb_build_object(
        'coin', NEW.coin,
        'side', NEW.side,
        'price', NEW.price,
        'quantity', NEW.quantity,
        'pnl', NEW.pnl
      ),
      true
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER trigger_log_bot_config
  AFTER INSERT OR UPDATE ON bot_config
  FOR EACH ROW EXECUTE FUNCTION log_user_action();

CREATE TRIGGER trigger_log_trades
  AFTER INSERT ON trades
  FOR EACH ROW EXECUTE FUNCTION log_user_action();

-- ============================================================
-- Views for monitoring
-- ============================================================

-- View: Recent notifications
CREATE OR REPLACE VIEW recent_notifications AS
SELECT 
  tn.id,
  tn.user_id,
  tn.notification_type,
  tn.chat_id,
  tn.success,
  tn.sent_at,
  p.username
FROM telegram_notifications tn
LEFT JOIN profiles p ON p.id = tn.user_id
ORDER BY tn.sent_at DESC
LIMIT 100;

-- View: Audit summary
CREATE OR REPLACE VIEW audit_summary AS
SELECT 
  action,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE success = true) as success_count,
  COUNT(*) FILTER (WHERE success = false) as error_count,
  MAX(created_at) as last_occurrence
FROM audit_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY action
ORDER BY count DESC;

-- View: User activity
CREATE OR REPLACE VIEW user_activity AS
SELECT 
  u.id as user_id,
  u.username,
  COUNT(DISTINCT al.id) as total_actions,
  COUNT(DISTINCT tn.id) as notifications_sent,
  COUNT(DISTINCT t.id) as trades_executed,
  MAX(al.created_at) as last_activity
FROM profiles u
LEFT JOIN audit_logs al ON al.user_id = u.id
LEFT JOIN telegram_notifications tn ON tn.user_id = u.id
LEFT JOIN trades t ON t.user_id = u.id
GROUP BY u.id, u.username
ORDER BY last_activity DESC NULLS LAST;

-- ============================================================
-- Notes:
-- 
-- 1. Audit logs are kept for 90 days
-- 2. Telegram notifications kept for 30 days
-- 3. Rate limits cleaned hourly
-- 4. All actions are logged automatically via triggers
-- 5. Views provide easy monitoring
-- 
-- To check audit logs:
-- SELECT * FROM audit_logs WHERE user_id = '...' ORDER BY created_at DESC;
-- 
-- To check notifications:
-- SELECT * FROM telegram_notifications WHERE user_id = '...' ORDER BY sent_at DESC;
-- 
-- To check activity:
-- SELECT * FROM user_activity;
-- ============================================================
