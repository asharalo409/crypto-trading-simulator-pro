/**
 * CSVExportService - Export trading data to CSV
 * 
 * Exports trades, positions, and analytics to CSV format
 * For offline analysis and record keeping
 */
import { Trade, Position } from '../types';

export class CSVExportService {
  /**
   * Export trades to CSV
   */
  static exportTrades(trades: Trade[]): string {
    const headers = [
      'Date',
      'Time',
      'Coin',
      'Side',
      'Price',
      'Quantity',
      'Total',
      'Fee',
      'P/L',
      'Is DCA',
      'DCA Order #',
    ];

    const rows = trades.map(trade => {
      const date = new Date(trade.timestamp);
      return [
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        trade.coin,
        trade.side,
        trade.price.toFixed(6),
        trade.quantity.toFixed(8),
        trade.total.toFixed(2),
        trade.fee.toFixed(4),
        trade.pnl.toFixed(2),
        trade.isDCA ? 'Yes' : 'No',
        trade.dcaOrderNumber || '',
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Export positions to CSV
   */
  static exportPositions(positions: Position[]): string {
    const headers = [
      'Coin',
      'Status',
      'Entry Price',
      'Current Price',
      'Quantity',
      'Total Cost',
      'Avg Entry',
      'Unrealized P/L',
      'Unrealized P/L %',
      'Realized P/L',
      'DCA Orders',
      'Opened',
      'Closed',
    ];

    const rows = positions.map(pos => [
      pos.coin,
      pos.status,
      pos.entryPrice.toFixed(6),
      pos.currentPrice.toFixed(6),
      pos.quantity.toFixed(8),
      pos.totalCost.toFixed(2),
      pos.avgEntryPrice.toFixed(6),
      pos.unrealizedPnl.toFixed(2),
      pos.unrealizedPnlPercent.toFixed(2),
      pos.realizedPnl?.toFixed(2) || '0.00',
      pos.dcaOrders.length.toString(),
      new Date(pos.openedAt).toLocaleString(),
      pos.closedAt ? new Date(pos.closedAt).toLocaleString() : '',
    ].join(','));

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Export portfolio summary to CSV
   */
  static exportPortfolioSummary(data: {
    totalBalance: number;
    availableBalance: number;
    investedBalance: number;
    totalPnl: number;
    realizedPnl: number;
    unrealizedPnl: number;
    todayPnl: number;
    totalTrades: number;
    winRate: number;
    buyCount: number;
    sellCount: number;
  }): string {
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Balance', `$${data.totalBalance.toFixed(2)}`],
      ['Available Balance', `$${data.availableBalance.toFixed(2)}`],
      ['Invested Balance', `$${data.investedBalance.toFixed(2)}`],
      ['Total P/L', `$${data.totalPnl.toFixed(2)}`],
      ['Realized P/L', `$${data.realizedPnl.toFixed(2)}`],
      ['Unrealized P/L', `$${data.unrealizedPnl.toFixed(2)}`],
      ['Today P/L', `$${data.todayPnl.toFixed(2)}`],
      ['Total Trades', data.totalTrades.toString()],
      ['Win Rate', `${data.winRate.toFixed(1)}%`],
      ['Buy Count', data.buyCount.toString()],
      ['Sell Count', data.sellCount.toString()],
    ].map(row => row.join(','));

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Export backtest results to CSV
   */
  static exportBacktestResults(result: any): string {
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Coin', result.config.coin],
      ['Strategy', result.config.strategy],
      ['Initial Balance', `$${result.initialBalance.toFixed(2)}`],
      ['Final Balance', `$${result.finalBalance.toFixed(2)}`],
      ['Total P/L', `$${result.totalPnl.toFixed(2)}`],
      ['Total P/L %', `${result.totalPnlPercent.toFixed(2)}%`],
      ['Total Trades', result.totalTrades.toString()],
      ['Buy Count', result.buyCount.toString()],
      ['Sell Count', result.sellCount.toString()],
      ['DCA Count', result.dcaCount.toString()],
      ['Win Rate', `${result.winRate.toFixed(1)}%`],
      ['Profit Factor', result.profitFactor.toFixed(2)],
      ['Max Drawdown', `$${result.maxDrawdown.toFixed(2)}`],
      ['Max Drawdown %', `${result.maxDrawdownPercent.toFixed(2)}%`],
      ['Sharpe Ratio', result.sharpeRatio.toFixed(2)],
      ['Duration', result.duration],
    ].map(row => row.join(','));

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Download CSV file
   */
  static downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Export all data
   */
  static exportAll(
    trades: Trade[],
    positions: Position[],
    portfolio: any
  ): void {
    const timestamp = new Date().toISOString().split('T')[0];
    
    // Export trades
    const tradesCSV = this.exportTrades(trades);
    this.downloadCSV(tradesCSV, `trades-${timestamp}.csv`);

    // Export positions
    const positionsCSV = this.exportPositions(positions);
    this.downloadCSV(positionsCSV, `positions-${timestamp}.csv`);

    // Export portfolio summary
    const portfolioCSV = this.exportPortfolioSummary(portfolio);
    this.downloadCSV(portfolioCSV, `portfolio-${timestamp}.csv`);
  }
}
