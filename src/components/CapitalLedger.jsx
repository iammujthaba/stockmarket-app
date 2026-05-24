import { useState } from 'react';
import CloseTradeModal from './CloseTradeModal';
import TradeDetailsModal from './TradeDetailsModal';

export default function CapitalLedger({ trades, onCloseTrade, profiles }) {
  const [selectedTradeToClose, setSelectedTradeToClose] = useState(null);
  const [selectedTradeDetails, setSelectedTradeDetails] = useState(null);
  const [marketFilter, setMarketFilter] = useState('all'); // 'all', 'indian', 'crypto'

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
      {(indianRisk > 0 || cryptoRisk > 0) && (
        <div className={`grid gap-3 mb-1 ${indianRisk > 0 && cryptoRisk > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
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
        </div>
      )}

      {/* Category Navigation Tabs */}
      <div className="flex bg-gray-900/50 border border-gray-800/40 rounded-xl p-1 mb-4 mt-4">
        <button
          onClick={() => setMarketFilter('all')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 ${
            marketFilter === 'all'
              ? 'bg-gray-850 text-white shadow-sm border border-gray-700/30'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <span>All</span>
          <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold font-mono ${
            marketFilter === 'all' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-gray-800 text-gray-500'
          }`}>
            {trades.length}
          </span>
        </button>

        <button
          onClick={() => setMarketFilter('indian')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 ${
            marketFilter === 'indian'
              ? 'bg-gray-850 text-white shadow-sm border border-gray-700/30'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <span>🇮🇳 Indian</span>
          <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold font-mono ${
            marketFilter === 'indian' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-gray-800 text-gray-500'
          }`}>
            {trades.filter(t => t.market === 'indian').length}
          </span>
        </button>

        <button
          onClick={() => setMarketFilter('crypto')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 ${
            marketFilter === 'crypto'
              ? 'bg-gray-850 text-white shadow-sm border border-gray-700/30'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <span>🌐 Crypto</span>
          <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold font-mono ${
            marketFilter === 'crypto' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-gray-800 text-gray-500'
          }`}>
            {trades.filter(t => t.market === 'crypto').length}
          </span>
        </button>
      </div>

      {/* Trade Rows */}
      {trades.filter(t => marketFilter === 'all' || t.market === marketFilter).length === 0 ? (
        <div className="text-center py-8 border border-dashed border-gray-800/80 rounded-xl bg-gray-900/10">
          <p className="text-gray-500 text-xs font-medium">No active trades in this category</p>
        </div>
      ) : (
        <div className="space-y-3">
          {trades
            .filter(t => marketFilter === 'all' || t.market === marketFilter)
            .map((trade) => (
              <div
                key={trade.id}
                onClick={() => setSelectedTradeDetails(trade)}
                className="bg-gray-800/10 border border-gray-800/60 rounded-xl p-4 hover:bg-gray-800/25 transition-all group cursor-pointer"
              >
                {/* Top row */}
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                      trade.direction === 'long'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                        : 'bg-red-500/10 text-red-400 border border-red-500/10'
                    }`}>
                      {trade.direction}
                    </span>
                    <span className="text-white font-bold font-mono text-sm tracking-tight">{trade.symbol}</span>
                    <span className="text-[10px] text-gray-500 font-medium font-mono flex items-center gap-1">
                      {trade.market === 'indian' ? '🇮🇳 Stock' : '🌐 Crypto'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-gray-500 text-[10px] font-mono">{formatTime(trade.timestamp)}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTradeToClose(trade);
                      }}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-gray-850 hover:bg-red-500/10 hover:text-red-400 border border-gray-700/50 hover:border-red-500/30 transition-all active:scale-[0.97] text-gray-400"
                    >
                      Close
                    </button>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-gray-900/35 border border-gray-800/40 rounded-lg p-2.5 text-xs">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Entry</span>
                    <span className="text-gray-200 font-mono font-medium mt-0.5">
                      {getCurrency(trade.market)}{trade.entry.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Stop Loss</span>
                    <span className="text-red-400/90 font-mono font-medium mt-0.5">
                      {getCurrency(trade.market)}{trade.stopLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Target</span>
                    <span className="text-emerald-400/90 font-mono font-medium mt-0.5">
                      {getCurrency(trade.market)}{trade.target.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Quantity</span>
                    <span className="text-gray-200 font-mono font-medium mt-0.5">
                      {trade.market === 'crypto'
                        ? trade.quantity.toString()
                        : trade.quantity.toLocaleString()
                      }
                    </span>
                  </div>
                </div>

                {/* Risk Indicator Widget */}
                <div className="mt-3.5 pt-2 border-t border-gray-800/30">
                  <div className="flex justify-between items-center text-[10px] font-mono mb-1.5">
                    <span className="text-gray-500 font-medium">Risk Exposure</span>
                    <span className="text-red-400 font-bold">
                      {getCurrency(trade.market)}{(trade.netLoss || trade.totalRisk).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, ((trade.netLoss || trade.totalRisk) / (profiles[trade.market]?.accountBalance || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

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
