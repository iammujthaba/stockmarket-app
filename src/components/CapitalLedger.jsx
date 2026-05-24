import { useState } from 'react';
import CloseTradeModal from './CloseTradeModal';
import TradeDetailsModal from './TradeDetailsModal';

export default function CapitalLedger({ trades, onCloseTrade, profiles }) {
  const [selectedTradeToClose, setSelectedTradeToClose] = useState(null);
  const [selectedTradeDetails, setSelectedTradeDetails] = useState(null);

  if (!trades || trades.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-800/50 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <p className="text-gray-500 text-sm">No active trades</p>
        <p className="text-gray-600 text-xs mt-1">Logged trades will appear here</p>
      </div>
    );
  }

  const totalRisk = trades.reduce((sum, t) => sum + (t.netLoss || t.totalRisk), 0);

  // Group by market for grouped currency display
  const indianRisk = trades.filter(t => t.market === 'indian').reduce((s, t) => s + (t.netLoss || t.totalRisk), 0);
  const cryptoRisk = trades.filter(t => t.market === 'crypto').reduce((s, t) => s + (t.netLoss || t.totalRisk), 0);

  const getCurrency = (market) => (market === 'indian' ? '₹' : '$');

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Active Trades</p>
          <p className="text-2xl font-bold text-white mt-1 font-mono">{trades.length}</p>
        </div>
        {indianRisk > 0 && (
          <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-3 text-center">
            <p className="text-xs text-red-400/60 uppercase tracking-wider">Risk (INR)</p>
            <p className="text-2xl font-bold text-red-400 mt-1 font-mono">₹{indianRisk.toFixed(0)}</p>
          </div>
        )}
        {cryptoRisk > 0 && (
          <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-3 text-center">
            <p className="text-xs text-red-400/60 uppercase tracking-wider">Risk (USDT)</p>
            <p className="text-2xl font-bold text-red-400 mt-1 font-mono">${cryptoRisk.toFixed(2)}</p>
          </div>
        )}
        {indianRisk > 0 && cryptoRisk > 0 && (
          <div className="col-span-2 sm:col-span-3 bg-amber-500/5 border border-amber-500/15 rounded-xl p-2 text-center">
            <p className="text-xs text-amber-400/70">Multi-market risk deployed — track independently</p>
          </div>
        )}
      </div>

      {/* Trade Rows */}
      <div className="space-y-2">
        {trades.map((trade) => (
          <div
            key={trade.id}
            onClick={() => setSelectedTradeDetails(trade)}
            className="bg-gray-800/20 border border-gray-700/30 rounded-xl p-4 hover:bg-gray-800/30 transition-colors group cursor-pointer"
          >
            {/* Top row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  trade.direction === 'long'
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-red-500/15 text-red-400'
                }`}>
                  {trade.direction}
                </span>
                <span className="text-white font-semibold font-mono text-sm">{trade.symbol}</span>
                <span className="text-gray-600 text-xs">{trade.market === 'indian' ? '🇮🇳' : '🌐'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600 text-xs">{formatTime(trade.timestamp)}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTradeToClose(trade);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 text-gray-400 hover:bg-red-500/10 hover:text-red-400 border border-gray-700/50 hover:border-red-500/30 transition-all active:scale-[0.97]"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5 text-xs">
              <div>
                <span className="text-gray-500">Entry</span>
                <span className="text-white font-mono ml-2">{getCurrency(trade.market)}{trade.entry.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-500">SL</span>
                <span className="text-red-400/80 font-mono ml-2">{getCurrency(trade.market)}{trade.stopLoss.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-500">Target</span>
                <span className="text-emerald-400/80 font-mono ml-2">{getCurrency(trade.market)}{trade.target.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-500">Qty</span>
                <span className="text-white font-mono ml-2">
                  {trade.market === 'crypto'
                    ? trade.quantity.toString()
                    : trade.quantity.toLocaleString()
                  }
                </span>
              </div>
            </div>

            {/* Risk bar */}
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-1 bg-gray-700/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, ((trade.netLoss || trade.totalRisk) / (profiles[trade.market]?.accountBalance || 1)) * 100)}%`,
                  }}
                />
              </div>
              <span className="text-red-400 text-xs font-mono whitespace-nowrap">
                {getCurrency(trade.market)}{(trade.netLoss || trade.totalRisk).toFixed(2)} risk
              </span>
            </div>
          </div>
        ))}
      </div>

      {selectedTradeToClose && (
        <CloseTradeModal
          trade={selectedTradeToClose}
          onClose={(id) => {
            if (id) {
              onCloseTrade(id);
            }
            setSelectedTradeToClose(null);
          }}
        />
      )}

      {selectedTradeDetails && (
        <TradeDetailsModal
          trade={selectedTradeDetails}
          onClose={() => setSelectedTradeDetails(null)}
        />
      )}
    </div>
  );
}
