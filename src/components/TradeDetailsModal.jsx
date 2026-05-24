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
        second: '2-digit',
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

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="relative w-full max-w-md bg-[#0c0e14]/95 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden p-6 backdrop-blur-md">
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
          <h3 className="text-lg font-bold text-white tracking-tight">Active Trade Details</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-semibold text-gray-300 font-mono text-sm">{trade.symbol}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              trade.direction === 'long' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
            }`}>
              {trade.direction}
            </span>
            <span className="text-gray-500 text-xs font-mono">• {trade.market === 'indian' ? 'Indian Stock' : 'Crypto'}</span>
          </div>
        </div>

        {/* Details List */}
        <div className="space-y-3.5">
          {/* Open Date */}
          <div className="p-3 bg-gray-800/10 border border-gray-800 p-2.5 rounded-xl flex justify-between items-center text-xs">
            <span className="text-gray-500 font-medium uppercase tracking-wider">Trade Open Date</span>
            <span className="text-gray-300 font-mono font-medium">{formatOpenDate(trade.timestamp)}</span>
          </div>

          {/* Position Size */}
          <div className="p-3 bg-gray-800/10 border border-gray-800 p-2.5 rounded-xl flex justify-between items-center text-xs">
            <span className="text-gray-500 font-medium uppercase tracking-wider">Position Size</span>
            <span className="text-gray-100 font-mono font-bold text-sm">
              {currency}{trade.positionValue ? trade.positionValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A'}
            </span>
          </div>

          {/* Est. Fees Row */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-gray-800/10 border border-gray-800 rounded-xl text-center">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Est. Fees (on Stop Loss)</span>
              <span className="text-gray-300 font-mono font-semibold">
                {currency}{stopLossFees.toFixed(2)}
              </span>
            </div>
            <div className="p-3 bg-gray-800/10 border border-gray-800 rounded-xl text-center">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Est. Fees (on Profit)</span>
              <span className="text-gray-300 font-mono font-semibold">
                {currency}{targetFees.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Risk vs Reward Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl text-center">
              <span className="text-[10px] text-red-400/60 uppercase tracking-wider block mb-1">Net Risk Amount</span>
              <span className="text-red-400 font-mono font-bold text-base">
                -{currency}{trade.netLoss ? trade.netLoss.toFixed(2) : (trade.totalRisk ? trade.totalRisk.toFixed(2) : '0.00')}
              </span>
            </div>
            <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-center">
              <span className="text-[10px] text-emerald-400/60 uppercase tracking-wider block mb-1">Net Reward Amount</span>
              <span className="text-emerald-400 font-mono font-bold text-base">
                +{currency}{trade.netProfit ? trade.netProfit.toFixed(2) : '0.00'}
              </span>
            </div>
          </div>

          {/* Breakeven Price Card */}
          <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl text-center">
            <p className="text-[10px] text-amber-400/60 uppercase tracking-wider mb-1">Breakeven Price (Including Fees)</p>
            <p className="text-2xl font-bold font-mono text-amber-300">
              {currency}{parseFloat(breakevenPrice).toLocaleString(undefined, { minimumFractionDigits: trade.market === 'crypto' ? 4 : 2, maximumFractionDigits: trade.market === 'crypto' ? 4 : 2 })}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full mt-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-xs font-semibold text-gray-300 hover:text-white transition-all active:scale-[0.99]"
        >
          Dismiss Details
        </button>
      </div>
    </div>
  );
}
