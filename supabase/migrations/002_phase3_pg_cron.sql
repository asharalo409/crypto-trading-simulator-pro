-- ============================================================
-- Supabase pg_cron Setup for Trading Worker
-- 
-- This sets up the primary scheduled worker using Supabase pg_cron
-- Runs every 1 minute to process trading logic
-- 
-- IMPORTANT: pg_cron must be enabled in your Supabase project
-- Go to: Database > Extensions > Enable "pg_cron"
-- ============================================================

-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================
-- Schedule the trading worker to run every 1 minute
-- ============================================================

-- Remove existing job if it exists
SELECT cron.unschedule('trading-worker') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'trading-worker'
);

-- Schedule new job
SELECT cron.schedule(
  'trading-worker',
  '* * * * *',  -- Every 1 minute
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.edge_function_url') || '/trading-worker',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- ============================================================
-- Alternative: Direct database processing (no Edge Function needed)
-- This is more efficient but requires more setup
-- ============================================================

-- Function to process trading logic directly in database
CREATE OR REPLACE FUNCTION process_trading_tick()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_prices JSONB;
  v_config RECORD;
  v_positions RECORD;
  v_wallet RECORD;
  v_current_price NUMERIC;
  v_signal TEXT;
  v_should_buy BOOLEAN;
  v_should_sell BOOLEAN;
BEGIN
  -- This is a simplified version
  -- Full implementation would fetch prices and process all users
  
  RAISE NOTICE 'Trading tick executed at %', NOW();
  
  -- Log execution
  INSERT INTO worker_logs (worker_type, status, message, created_at)
  VALUES ('pg_cron_direct', 'success', 'Tick executed', NOW());
END;
$$;

-- Schedule direct processing (alternative to Edge Function)
-- SELECT cron.schedule(
--   'trading-worker-direct',
--   '* * * * *',
--   'SELECT process_trading_tick();'
-- );

-- ============================================================
-- Monitor job status
-- ============================================================

-- View all scheduled jobs
-- SELECT * FROM cron.job;

-- View job run history
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- ============================================================
-- Cleanup old data (run daily)
-- ============================================================

-- Function to cleanup old processed candles (keep last 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete processed candles older than 7 days
  DELETE FROM processed_candles
  WHERE processed_at < NOW() - INTERVAL '7 days';
  
  -- Delete worker logs older than 30 days
  DELETE FROM worker_logs
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Delete market candles older than 30 days
  DELETE FROM market_candles
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  RAISE NOTICE 'Cleanup completed at %', NOW();
END;
$$;

-- Schedule cleanup to run daily at 3 AM
SELECT cron.schedule(
  'cleanup-old-data',
  '0 3 * * *',  -- Daily at 3 AM
  'SELECT cleanup_old_data();'
);

-- ============================================================
-- Health check function
-- ============================================================

CREATE OR REPLACE FUNCTION check_worker_health()
RETURNS TABLE(
  last_execution TIMESTAMPTZ,
  execution_count BIGINT,
  error_count BIGINT,
  avg_execution_time_ms NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    MAX(created_at) as last_execution,
    COUNT(*) as execution_count,
    COUNT(*) FILTER (WHERE status = 'error') as error_count,
    AVG(execution_time_ms) as avg_execution_time_ms
  FROM worker_logs
  WHERE created_at > NOW() - INTERVAL '1 hour';
END;
$$;

-- ============================================================
-- Notes:
-- 
-- 1. pg_cron runs in UTC timezone
-- 2. Free tier allows unlimited cron jobs
-- 3. Each execution has a 1-minute timeout
-- 4. Use Edge Functions for complex logic
-- 5. Monitor with: SELECT * FROM cron.job_run_details
-- 
-- To check if job is running:
-- SELECT * FROM cron.job WHERE jobname = 'trading-worker';
-- 
-- To pause the job:
-- SELECT cron.unschedule('trading-worker');
-- 
-- To resume:
-- Re-run the schedule command above
-- ============================================================
