import { useState, useMemo, useEffect } from 'react';
import { calculateFees } from '../utils/FeeCalculator';

export default function TradeCalculator({ market, profile, onLogTrade }) {
  const [direction, setDirection] = useState('long');
  const [entryPrice, setEntryPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [rrRatio, setRrRatio] = useState(profile.defaultRR || 2);
  const [symbol, setSymbol] = useState('');
  const [showFeeBreakdown, setShowFeeBreakdown] = useState(false);
  const [lotSizeOverride, setLotSizeOverride] = useState(profile.lotSize || 1);
  const [useLotSize, setUseLotSize] = useState(profile.useLotSize || false);
  const [tradeType, setTradeType] = useState('intraday');

  // Sync R:R and lot settings from profile when market changes
  useEffect(() => {
    setRrRatio(profile.defaultRR || 2);
    if (market === 'indian') {
      setLotSizeOverride(profile.lotSize || 1);
      setUseLotSize(profile.useLotSize || false);
    } else {
      setTradeType('intraday');
    }
  }, [profile, market]);

  const calculations = useMemo(() => {
    const entry = parseFloat(entryPrice);
    const sl = parseFloat(stopLoss);
    const rr = parseFloat(rrRatio);

    if (!entry || !sl || !rr || entry <= 0 || sl <= 0 || rr <= 0) {
      return null;
    }

    // Validate direction vs price relationship
    if (direction === 'long' && sl >= entry) return null;
    if (direction === 'short' && sl <= entry) return null;

    // Risk per share
    const riskPerShare = direction === 'long'
      ? entry - sl
      : sl - entry;

    if (riskPerShare <= 0) return null;

    // Risk amount from profile
    const riskAmount = profile.riskMode === 'percent'
      ? (profile.accountBalance * profile.riskPercent) / 100
      : profile.fixedRisk;

    // Base quantity
    let rawQuantity = riskAmount / riskPerShare;

    // Quantity rounding by market
    let quantity;
    if (market === 'crypto') {
      quantity = parseFloat(rawQuantity.toFixed(6)); // Allow fractional
    } else {
      if (useLotSize && lotSizeOverride > 1) {
        quantity = Math.floor(rawQuantity / lotSizeOverride) * lotSizeOverride;
      } else {
        quantity = Math.floor(rawQuantity);
      }
    }

    if (quantity <= 0) return null;

    // Target price
    const targetPrice = direction === 'long'
      ? entry + (riskPerShare * rr)
      : entry - (riskPerShare * rr);

    // Actual risk with the rounded quantity
    const actualRisk = riskPerShare * quantity;

    // Position size
    const positionSize = entry * quantity;

    // Potential reward
    const potentialReward = Math.abs(targetPrice - entry) * quantity;

    // Fee calculations
    const entryToTarget = calculateFees(market, {
      entryPrice: entry,
      exitPrice: targetPrice,
      quantity,
      leverage: profile.leverage || 1,
      tradeType,
    });

    const entryToSL = calculateFees(market, {
      entryPrice: entry,
      exitPrice: sl,
      quantity,
      leverage: profile.leverage || 1,
      tradeType,
    });

    // Net P&L after fees
    const netProfit = potentialReward - entryToTarget.totalFees;
    const netLoss   = actualRisk + entryToSL.totalFees;

    // Effective R:R after fees
    const effectiveRR = netLoss > 0 ? (netProfit / netLoss) : 0;

    return {
      riskPerShare,
      riskAmount,
      rawQuantity,
      quantity,
      targetPrice,
      actualRisk,
      positionSize,
      potentialReward,
      feesOnWin: entryToTarget,
      feesOnLoss: entryToSL,
      netProfit,
      netLoss,
      effectiveRR,
    };
  }, [entryPrice, stopLoss, rrRatio, direction, market, profile, useLotSize, lotSizeOverride, tradeType]);

  const handleLogTrade = () => {
    if (!calculations || !symbol.trim()) return;
    onLogTrade({
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      symbol: symbol.trim().toUpperCase(),
      market,
      direction,
      entry: parseFloat(entryPrice),
      stopLoss: parseFloat(stopLoss),
      target: calculations.targetPrice,
      quantity: calculations.quantity,
      totalRisk: calculations.actualRisk,
      positionSize: calculations.positionSize,
      timestamp: new Date().toISOString(),
    });
    // Clear form
    setSymbol('');
    setEntryPrice('');
    setStopLoss('');
  };

  const currency = profile.currency || '₹';

  return (
    <div className="space-y-5">
      {/* Direction Toggle */}
      <div className="flex gap-3">
        <button
          onClick={() => setDirection('long')}
          className={`flex-1 py-3 rounded-xl font-semibold text-sm tracking-wide transition-all duration-300 ${
            direction === 'long'
              ? 'bg-emerald-500/15 text-emerald-400 border-2 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
              : 'bg-gray-800/40 text-gray-500 border-2 border-transparent hover:border-gray-700 hover:text-gray-400'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
            LONG
          </span>
        </button>
        <button
          onClick={() => setDirection('short')}
          className={`flex-1 py-3 rounded-xl font-semibold text-sm tracking-wide transition-all duration-300 ${
            direction === 'short'
              ? 'bg-red-500/15 text-red-400 border-2 border-red-500/40 shadow-lg shadow-red-500/10'
              : 'bg-gray-800/40 text-gray-500 border-2 border-transparent hover:border-gray-700 hover:text-gray-400'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
            SHORT
          </span>
        </button>
      </div>

      {/* Trade Type Toggle (Indian Only) */}
      {market === 'indian' && (
        <div className="flex bg-gray-800/40 border border-gray-700/30 rounded-xl p-1">
          <button
            type="button"
            onClick={() => setTradeType('intraday')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg tracking-wider transition-all duration-200 ${
              tradeType === 'intraday'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm'
                : 'text-gray-400 hover:text-gray-300 border border-transparent'
            }`}
          >
            INTRADAY
          </button>
          <button
            type="button"
            onClick={() => setTradeType('delivery')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg tracking-wider transition-all duration-200 ${
              tradeType === 'delivery'
                ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30 shadow-sm'
                : 'text-gray-400 hover:text-gray-300 border border-transparent'
            }`}
          >
            DELIVERY
          </button>
        </div>
      )}

      {/* Input Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Symbol */}
        <div className="col-span-2 space-y-1.5">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Symbol / Ticker</label>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder={market === 'indian' ? 'e.g. RELIANCE' : 'e.g. BTCUSDT'}
            className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all font-mono"
          />
        </div>

        {/* Entry Price */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Entry Price</label>
          <input
            type="number"
            step="any"
            value={entryPrice}
            onChange={(e) => setEntryPrice(e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all font-mono"
          />
        </div>

        {/* Stop Loss */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Stop Loss</label>
          <input
            type="number"
            step="any"
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all font-mono"
          />
        </div>

        {/* Risk:Reward Ratio */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">R:R Ratio</label>
          <input
            type="number"
            step="0.1"
            min="0.1"
            value={rrRatio}
            onChange={(e) => setRrRatio(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all font-mono"
          />
        </div>

        {/* Lot Size (Indian only) */}
        {market === 'indian' && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Lot Size</label>
              <button
                onClick={() => setUseLotSize(!useLotSize)}
                className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
                  useLotSize ? 'bg-cyan-500' : 'bg-gray-600'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                  useLotSize ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </button>
            </div>
            <input
              type="number"
              min="1"
              value={lotSizeOverride}
              onChange={(e) => setLotSizeOverride(Math.max(1, parseInt(e.target.value) || 1))}
              disabled={!useLotSize}
              className={`w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all font-mono ${
                !useLotSize ? 'opacity-40 cursor-not-allowed' : ''
              }`}
            />
          </div>
        )}
      </div>

      {/* Results Panel */}
      {calculations && (
        <div className="space-y-4 animate-fade-in">
          {/* Primary outputs - Prominent display */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 rounded-2xl p-4 text-center">
              <p className="text-xs text-cyan-400/70 uppercase tracking-wider mb-1">Quantity</p>
              <p className="text-3xl font-bold text-cyan-300 font-mono tabular-nums">
                {market === 'crypto'
                  ? calculations.quantity.toFixed(6).replace(/\.?0+$/, '')
                  : calculations.quantity.toLocaleString()
                }
              </p>
              {market === 'indian' && useLotSize && lotSizeOverride > 1 && (
                <p className="text-xs text-cyan-500/50 mt-1">
                  {Math.floor(calculations.quantity / lotSizeOverride)} lot{Math.floor(calculations.quantity / lotSizeOverride) !== 1 ? 's' : ''} × {lotSizeOverride}
                </p>
              )}
            </div>

            <div className={`bg-gradient-to-br ${
              direction === 'long'
                ? 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20'
                : 'from-red-500/10 to-red-500/5 border-red-500/20'
            } border rounded-2xl p-4 text-center`}>
              <p className={`text-xs uppercase tracking-wider mb-1 ${
                direction === 'long' ? 'text-emerald-400/70' : 'text-red-400/70'
              }`}>
                Target Price
              </p>
              <p className={`text-3xl font-bold font-mono tabular-nums ${
                direction === 'long' ? 'text-emerald-300' : 'text-red-300'
              }`}>
                {calculations.targetPrice.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Secondary metrics */}
          <div className="bg-gray-800/30 border border-gray-700/30 rounded-2xl divide-y divide-gray-700/30">
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-xs text-gray-400">Risk per Share</span>
              <span className="text-sm text-white font-mono">{currency}{calculations.riskPerShare.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-xs text-gray-400">Position Risk</span>
              <span className="text-sm text-red-400 font-mono">{currency}{calculations.actualRisk.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-xs text-gray-400">Position Size</span>
              <span className="text-sm text-white font-mono">{currency}{calculations.positionSize.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-xs text-gray-400">Potential Reward (Gross)</span>
              <span className="text-sm text-emerald-400 font-mono">{currency}{calculations.potentialReward.toFixed(2)}</span>
            </div>

            {/* Fee Summary */}
            <div className="px-4 py-3">
              <button
                onClick={() => setShowFeeBreakdown(!showFeeBreakdown)}
                className="w-full flex justify-between items-center group"
              >
                <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                  Est. Fees (Round-trip)
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-sm text-amber-400 font-mono">
                    {currency}{calculations.feesOnWin.totalFees.toFixed(2)}
                  </span>
                  <svg
                    className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${showFeeBreakdown ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>

              {showFeeBreakdown && (
                <div className="mt-3 pl-2 space-y-1.5 animate-fade-in">
                  {Object.entries(calculations.feesOnWin.breakdown).map(([key, val]) => (
                    <div key={key} className="flex justify-between text-xs">
                      <span className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span className="text-gray-400 font-mono">{typeof val === 'number' ? `${currency}${val.toFixed(2)}` : val}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Net after fees */}
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-xs text-gray-400">Net Profit (after fees)</span>
              <span className={`text-sm font-mono font-semibold ${
                calculations.netProfit > 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {currency}{calculations.netProfit.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-xs text-gray-400">Net Loss (+ fees on SL)</span>
              <span className="text-sm text-red-400 font-mono font-semibold">
                {currency}{calculations.netLoss.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center px-4 py-3 bg-gray-900/30">
              <span className="text-xs font-medium text-gray-300">Effective R:R (after fees)</span>
              <span className={`text-sm font-bold font-mono ${
                calculations.effectiveRR >= 1 ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                1 : {calculations.effectiveRR.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Log Trade Button */}
          <button
            onClick={handleLogTrade}
            disabled={!symbol.trim()}
            className={`w-full py-3.5 rounded-xl font-semibold text-sm tracking-wide transition-all duration-300 ${
              symbol.trim()
                ? 'bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 active:scale-[0.98]'
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Log Active Trade
            </span>
          </button>
          {!symbol.trim() && calculations && (
            <p className="text-xs text-center text-gray-500 -mt-2">Enter a symbol to log this trade</p>
          )}
        </div>
      )}
    </div>
  );
}
