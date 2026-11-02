import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { securityLayer, AuditLogEntry } from '../services/SecurityLayer';
import {
  Shield, Activity, Filter, Trash2, Download,
  CheckCircle2, XCircle, AlertTriangle, Clock,
  User, Zap, Eye
} from 'lucide-react';

export default function AuditLogViewer() {
  const { colors } = useTheme();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'success' | 'error'>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  useEffect(() => {
    loadLogs();
  }, [filter]);

  const loadLogs = () => {
    const allLogs = securityLayer.getAuditLog(undefined, 100);
    
    if (filter === 'success') {
      setLogs(allLogs.filter(log => log.success));
    } else if (filter === 'error') {
      setLogs(allLogs.filter(log => !log.success));
    } else {
      setLogs(allLogs);
    }
  };

  const handleClearLogs = () => {
    if (confirm('Are you sure you want to clear all audit logs?')) {
      securityLayer.clearAuditLog();
      loadLogs();
    }
  };

  const handleExportLogs = () => {
    const data = JSON.stringify(logs, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getActionIcon = (action: string) => {
    if (action.includes('save') || action.includes('create')) return <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />;
    if (action.includes('error') || action.includes('fail')) return <XCircle className="w-3.5 h-3.5 text-red-400" />;
    if (action.includes('warning')) return <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />;
    return <Activity className="w-3.5 h-3.5 text-blue-400" />;
  };

  const stats = securityLayer.getStats();

  return (
    <div className={`${colors.bgCard} border ${colors.border} rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-sm font-bold ${colors.text} flex items-center gap-2`}>
          <Shield className={`w-4 h-4 ${colors.accent}`} />
          Audit Log
        </h3>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] ${colors.textMuted}`}>
            {logs.length} entries
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className={`p-2 rounded-lg ${colors.bgSecondary}`}>
          <p className={`text-[9px] ${colors.textMuted}`}>Total Logs</p>
          <p className={`text-sm font-bold ${colors.text}`}>{stats.auditLogCount}</p>
        </div>
        <div className={`p-2 rounded-lg ${colors.bgSecondary}`}>
          <p className={`text-[9px] ${colors.textMuted}`}>Rate Limits</p>
          <p className={`text-sm font-bold ${colors.text}`}>{stats.rateLimitEntries}</p>
        </div>
        <div className={`p-2 rounded-lg ${colors.bgSecondary}`}>
          <p className={`text-[9px] ${colors.textMuted}`}>Last Action</p>
          <p className={`text-[10px] font-bold ${colors.text} truncate`}>
            {stats.lastAuditEntry?.action || 'None'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 px-3 py-1.5 rounded-lg text-xs transition-all ${
            filter === 'all'
              ? `${colors.bgHover} ${colors.accent}`
              : `${colors.bgSecondary} ${colors.textMuted}`
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('success')}
          className={`flex-1 px-3 py-1.5 rounded-lg text-xs transition-all ${
            filter === 'success'
              ? `${colors.bgHover} text-green-400`
              : `${colors.bgSecondary} ${colors.textMuted}`
          }`}
        >
          Success
        </button>
        <button
          onClick={() => setFilter('error')}
          className={`flex-1 px-3 py-1.5 rounded-lg text-xs transition-all ${
            filter === 'error'
              ? `${colors.bgHover} text-red-400`
              : `${colors.bgSecondary} ${colors.textMuted}`
          }`}
        >
          Errors
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleExportLogs}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs ${colors.bgSecondary} ${colors.textSecondary} border ${colors.border} hover:${colors.bgHover}`}
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </button>
        <button
          onClick={handleClearLogs}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs ${colors.bgSecondary} text-red-400 border border-red-500/30 hover:bg-red-500/10`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear
        </button>
      </div>

      {/* Log List */}
      <div className="space-y-1 max-h-[400px] overflow-y-auto">
        {logs.length === 0 ? (
          <p className={`text-xs ${colors.textMuted} text-center py-8`}>
            No audit logs yet
          </p>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              onClick={() => setSelectedLog(log)}
              className={`p-2 rounded-lg ${colors.bgSecondary} border ${colors.border} cursor-pointer hover:${colors.bgHover} transition-all`}
            >
              <div className="flex items-start gap-2">
                {getActionIcon(log.action)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs font-medium ${colors.text} truncate`}>
                      {log.action}
                    </p>
                    <span className={`text-[9px] ${colors.textMuted} whitespace-nowrap`}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] ${colors.textMuted}`}>
                      {log.resource}
                    </span>
                    {log.success ? (
                      <CheckCircle2 className="w-3 h-3 text-green-400" />
                    ) : (
                      <XCircle className="w-3 h-3 text-red-400" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className={`${colors.bgCard} border ${colors.border} rounded-xl p-4 max-w-lg w-full max-h-[80vh] overflow-y-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className={`text-sm font-bold ${colors.text} flex items-center gap-2`}>
                <Eye className={`w-4 h-4 ${colors.accent}`} />
                Log Details
              </h4>
              <button
                onClick={() => setSelectedLog(null)}
                className={`p-1 rounded-lg ${colors.bgSecondary} ${colors.textMuted} hover:${colors.text}`}
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <DetailRow label="ID" value={selectedLog.id} colors={colors} />
              <DetailRow 
                label="Timestamp" 
                value={new Date(selectedLog.timestamp).toLocaleString()} 
                colors={colors} 
              />
              <DetailRow label="User ID" value={selectedLog.userId} colors={colors} />
              <DetailRow label="Action" value={selectedLog.action} colors={colors} />
              <DetailRow label="Resource" value={selectedLog.resource} colors={colors} />
              <DetailRow 
                label="Status" 
                value={selectedLog.success ? 'Success' : 'Failed'} 
                colors={colors}
                valueColor={selectedLog.success ? 'text-green-400' : 'text-red-400'}
              />
              
              {selectedLog.error && (
                <DetailRow label="Error" value={selectedLog.error} colors={colors} valueColor="text-red-400" />
              )}

              {Object.keys(selectedLog.details).length > 0 && (
                <div>
                  <p className={`text-[10px] ${colors.textMuted} mb-1`}>Details</p>
                  <pre className={`text-[10px] ${colors.text} ${colors.bgSecondary} p-2 rounded-lg overflow-x-auto font-mono`}>
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface DetailRowProps {
  label: string;
  value: string;
  colors: any;
  valueColor?: string;
}

function DetailRow({ label, value, colors, valueColor }: DetailRowProps) {
  return (
    <div>
      <p className={`text-[10px] ${colors.textMuted}`}>{label}</p>
      <p className={`text-xs ${valueColor || colors.text} font-mono break-all`}>{value}</p>
    </div>
  );
}
