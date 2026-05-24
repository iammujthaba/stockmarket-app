import { useState } from 'react';
import { calculateTradeFees } from '../utils/FeeCalculator';

const GOOGLE_APP_URL = "https://script.google.com/macros/s/AKfycbxhDA4ykFkzejH70uABk-zSr8uXuUuoh7cN5T_vseNdWwMvrZMfAAL_7hLxSJFVnB-1/exec";

export default function CloseTradeModal({ trade, onClose }) {
  const [step, setStep] = useState(1);
  const [outcome, setOutcome] = useState('');
  const [exitPrice, setExitPrice] = useState('');
  const [loading, setLoading] = useState(false);

  const currency = trade.market === 'indian' ? '₹' : '$';

  const handleOutcomeSelect = (selectedOutcome) => {
    setOutcome(selectedOutcome);
    let defaultExit = trade.entry;
    if (selectedOutcome === 'win') {
      defaultExit = trade.target;
    } else if (selectedOutcome === 'loss') {
      defaultExit = trade.stopLoss;
    } else if (selectedOutcome === 'breakeven') {
      let exit = trade.entry;
      // Define tick step size
      let stepSize = trade.market === 'indian' ? 0.05 : (trade.entry > 1000 ? 0.1 : 0.001);
      let iter = 0;
      let maxIter = 5000;

      while (iter < maxIter) {
        // Calculate fees for current estimated exit
        let fees = calculateTradeFees(
          trade.market,
          trade.tradeType || 'intraday',
          trade.entry,
          exit,
          trade.quantity,
          trade.activeLeverage || 1
        );

        // Calculate gross PnL
        let grossPnL = trade.direction === 'long'
          ? (exit - trade.entry) * trade.quantity
          : (trade.entry - exit) * trade.quantity;

        // If Net PnL covers fees, break loop
        if (grossPnL - fees >= 0) {
          break;
        }

        // Step the price in the profitable direction
        exit = trade.direction === 'long' ? exit + stepSize : exit - stepSize;
        iter++;
      }

      defaultExit = Number(exit).toFixed(trade.market === 'crypto' ? 4 : 2);
    }
    setExitPrice(defaultExit.toString());
    setStep(2);
  };

  const handleCancelExecute = () => {
    // If trade was not executed, instantly remove from active trades
    onClose(trade.id);
  };

  const actualExitPrice = exitPrice;
  const actualFees = calculateTradeFees(
    trade.market,
    trade.tradeType || 'intraday',
    trade.entry,
    Number(actualExitPrice),
    trade.quantity,
    1 // activeLeverage fallback
  );

  const grossRealizedPnL = trade.direction === 'long'
    ? (Number(actualExitPrice) - trade.entry) * trade.quantity
    : (trade.entry - Number(actualExitPrice)) * trade.quantity;

  const trueNetPnL = grossRealizedPnL - actualFees;

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    fetch(GOOGLE_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        market: trade.market,
        symbol: trade.symbol,
        direction: trade.direction,
        entryPrice: trade.entry,
        stopLossPrice: trade.stopLoss,
        targetPrice: trade.target,
        exitPrice: Number(actualExitPrice),
        result: outcome,
        tradeType: trade.tradeType || 'N/A',
        quantity: trade.quantity,
        positionValue: trade.positionValue,
        grossRisk: trade.grossRisk,
        grossReward: trade.grossReward,
        effectiveReward: grossRealizedPnL,
        effectiveRR: trade.effectiveRR ? `1:${Number(trade.effectiveRR).toFixed(2)}` : 'N/A',
        actualFees: actualFees,
        netPnL: trueNetPnL
      })
    })
      .then(() => {
        onClose(trade.id);
      })
      .catch((err) => {
        console.error("Journaling failed:", err);
        onClose(trade.id); // Still close it even if fetch fails to avoid UI locking
      });
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="relative w-full max-w-md bg-[#0c0e14]/95 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden p-6 backdrop-blur-md">
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-red-500" />

        {/* Close Button */}
        <button
          onClick={() => onClose()}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
          disabled={loading}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Title */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-white tracking-tight">Close Trade Journal</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Record outcome for <span className="font-semibold text-gray-300 font-mono">{trade.symbol}</span> ({trade.direction.toUpperCase()})
          </p>
        </div>

        {/* Step 1: Outcome Selector */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Summary details */}
            <div className="p-3 bg-gray-800/20 border border-gray-700/30 rounded-xl grid grid-cols-2 gap-2 text-xs font-mono text-gray-400">
              <div>Entry Price: <span className="text-white">{currency}{trade.entry.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
              <div>Quantity: <span className="text-white">{trade.quantity.toLocaleString()}</span></div>
              <div>Stop Loss: <span className="text-red-400">{currency}{trade.stopLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
              <div>Target: <span className="text-emerald-400">{currency}{trade.target.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => handleOutcomeSelect('win')}
                className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-left border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 text-emerald-400 transition-all flex items-center justify-between group active:scale-[0.99]"
              >
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500" />
                  Win (Target Hit)
                </span>
                <span className="text-emerald-500/50 group-hover:translate-x-1 transition-transform">→</span>
              </button>

              <button
                type="button"
                onClick={() => handleOutcomeSelect('loss')}
                className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-left border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/30 text-red-400 transition-all flex items-center justify-between group active:scale-[0.99]"
              >
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 shadow-sm shadow-red-500" />
                  Loss (Stop Hit)
                </span>
                <span className="text-red-500/50 group-hover:translate-x-1 transition-transform">→</span>
              </button>

              <button
                type="button"
                onClick={() => handleOutcomeSelect('breakeven')}
                className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-left border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/30 text-blue-400 transition-all flex items-center justify-between group active:scale-[0.99]"
              >
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500" />
                  Breakeven / Manual Exit
                </span>
                <span className="text-blue-500/50 group-hover:translate-x-1 transition-transform">→</span>
              </button>

              <button
                type="button"
                onClick={handleCancelExecute}
                className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-left border border-gray-700/40 bg-gray-800/20 hover:bg-gray-800/40 hover:border-gray-600/40 text-gray-400 transition-all flex items-center justify-between group active:scale-[0.99]"
              >
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-500" />
                  Cancel (Did not execute)
                </span>
                <span className="text-gray-500 group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Slippage Editor & Realization */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Outcome tag */}
            <div className="flex justify-between items-center bg-gray-800/10 border border-gray-800 p-2.5 rounded-xl text-xs">
              <span className="text-gray-500">Outcome Selected:</span>
              <span className={`px-2.5 py-0.5 rounded font-bold uppercase tracking-wider text-[10px] ${
                outcome === 'win' ? 'bg-emerald-500/15 text-emerald-400' :
                outcome === 'loss' ? 'bg-red-500/15 text-red-400' :
                'bg-blue-500/15 text-blue-400'
              }`}>
                {outcome}
              </span>
            </div>

            {/* Exit price input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Actual Exit Price
              </label>
              <input
                type="number"
                step="any"
                required
                disabled={loading}
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all font-mono"
              />
            </div>

            {/* Realized PnL Card */}
            <div className={`p-4 rounded-xl border text-center transition-all ${
              trueNetPnL > 0
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : trueNetPnL < 0
                ? 'bg-red-500/10 border-red-500/20 text-red-300'
                : 'bg-gray-800/20 border-gray-700/30 text-gray-300'
            }`}>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                Realized P&L
              </p>
              <p className="text-2xl font-bold font-mono">
                {trueNetPnL > 0 ? '+' : ''}
                {currency}
                {trueNetPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={loading}
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-xs font-semibold text-gray-300 hover:text-white transition-all disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-500/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Journaling...
                  </>
                ) : (
                  'Confirm & Journal'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
