import { calculateTradeFees } from '../utils/FeeCalculator';

export default function TradeDetailsModal({ trade, onClose }) {
  if (!trade) return null;

  const currency = trade.market === 'indian' ? '₹' : '$';

  // Format Trade Open Date
  const formatOpenDate = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      const date = new Date(isoString);
      return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  // Iterative Solver for Breakeven Price (absorbing round-trip fees)
  const getBreakevenPrice = () => {
    let exit = trade.entry;
    const stepSize = trade.market === 'indian' ? 0.05 : (trade.entry > 1000 ? 0.1 : 0.001);
    let iter = 0;
    const maxIter = 5000;

    while (iter < maxIter) {
      const fees = calculateTradeFees(
        trade.market,
        trade.tradeType || 'intraday',
        trade.entry,
        exit,
        trade.quantity,
        trade.activeLeverage || 1
      );

      const grossPnL = trade.direction === 'long'
        ? (exit - trade.entry) * trade.quantity
        : (trade.entry - exit) * trade.quantity;

      if (grossPnL - fees >= 0) {
        break;
      }

      exit = trade.direction === 'long' ? exit + stepSize : exit - stepSize;
      iter++;
    }

    return Number(exit).toFixed(trade.market === 'crypto' ? 4 : 2);
  };

  const breakevenPrice = getBreakevenPrice();

  const stopLossFees = calculateTradeFees(
    trade.market,
    trade.tradeType || 'intraday',
    trade.entry,
    trade.stopLoss,
    trade.quantity,
    trade.activeLeverage || 1
  );

  const targetFees = calculateTradeFees(
    trade.market,
    trade.tradeType || 'intraday',
    trade.entry,
    trade.target,
    trade.quantity,
    trade.activeLeverage || 1
  );

  const marginAmt = trade.marginUtilized || (trade.positionValue / (trade.leverage || 1)) || 0;
  const leverageMultiplier = trade.leverage || (marginAmt > 0 ? Math.round(trade.positionValue / marginAmt) : 1) || 1;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="relative w-full max-w-sm bg-[#0c0e14]/98 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden p-5 sm:p-6 backdrop-blur-md">
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-emerald-500" />

        {/* Close Header Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Title / Symbol */}
        <div className="mb-5">
          <h3 className="text-base font-bold text-white tracking-tight">Active Trade Details</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-bold text-gray-200 font-mono text-sm tracking-tight">{trade.symbol}</span>
            <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
              trade.direction === 'long' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' : 'bg-red-500/10 text-red-400 border border-red-500/10'
            }`}>
              {trade.direction}
            </span>
            <span className="text-gray-500 text-xs font-mono">• {trade.market === 'indian' ? 'Indian Stock' : 'Crypto'}</span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="space-y-3 font-sans">
          {/* Open Date (Full width) */}
          <div className="p-3 bg-gray-900/40 border border-gray-800/60 rounded-xl flex justify-between items-center text-xs">
            <span className="text-gray-500 font-medium tracking-wide">Opened On</span>
            <span className="text-gray-300 font-mono">{formatOpenDate(trade.timestamp)}</span>
          </div>

          {/* Position Size (Full width) */}
          <div className="p-3 bg-gray-900/40 border border-gray-800/60 rounded-xl flex justify-between items-center text-xs">
            <span className="text-gray-500 font-medium tracking-wide">Position Size</span>
            <span className="text-gray-100 font-mono font-bold text-sm flex items-center gap-1.5">
              {currency}{marginAmt > 0 ? marginAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A'}
              <span className="text-[10px] text-gray-400 font-semibold px-1 py-0.5 rounded bg-gray-800/60 border border-gray-700/40 font-sans">
                {leverageMultiplier}x
              </span>
            </span>
          </div>

          {/* Est. Fees Grid (Side-by-side) */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 bg-gray-900/20 border border-gray-800/40 rounded-xl flex flex-col justify-center items-center text-center">
              <span className="text-[9px] text-gray-500 uppercase tracking-wider mb-0.5 font-medium">SL Fee (Est)</span>
              <span className="text-gray-300 font-mono font-bold">
                {currency}{stopLossFees.toFixed(2)}
              </span>
            </div>
            <div className="p-2.5 bg-gray-900/20 border border-gray-800/40 rounded-xl flex flex-col justify-center items-center text-center">
              <span className="text-[9px] text-gray-500 uppercase tracking-wider mb-0.5 font-medium">Target Fee (Est)</span>
              <span className="text-gray-300 font-mono font-bold">
                {currency}{targetFees.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Risk vs Reward Row (Side-by-side) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl text-center flex flex-col items-center justify-center">
              <span className="text-[9px] text-red-400/60 uppercase tracking-wider mb-0.5 font-medium">Net Risk</span>
              <span className="text-red-400 font-mono font-bold text-sm sm:text-base">
                -{currency}{trade.netLoss ? trade.netLoss.toFixed(2) : (trade.totalRisk ? trade.totalRisk.toFixed(2) : '0.00')}
              </span>
            </div>
            <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-center flex flex-col items-center justify-center">
              <span className="text-[9px] text-emerald-400/60 uppercase tracking-wider mb-0.5 font-medium">Net Reward</span>
              <span className="text-emerald-400 font-mono font-bold text-sm sm:text-base">
                +{currency}{trade.netProfit ? trade.netProfit.toFixed(2) : '0.00'}
              </span>
            </div>
          </div>

          {/* Breakeven Price Card (Full width, High visibility) */}
          <div className="p-3.5 bg-amber-500/5 border border-amber-500/15 rounded-xl text-center shadow-inner">
            <p className="text-[9px] text-amber-400/70 uppercase tracking-wider mb-0.5 font-medium">Breakeven Exit Price (With Fees)</p>
            <p className="text-xl font-bold font-mono text-amber-400 tracking-wide">
              {currency}{parseFloat(breakevenPrice).toLocaleString(undefined, { minimumFractionDigits: trade.market === 'crypto' ? 4 : 2, maximumFractionDigits: trade.market === 'crypto' ? 4 : 2 })}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full mt-5 py-3 bg-gray-800/80 hover:bg-gray-700 border border-gray-700/60 rounded-xl text-xs font-semibold text-gray-300 hover:text-white transition-all active:scale-[0.99] shadow-md"
        >
          Dismiss Details
        </button>
      </div>
    </div>
  );
}
