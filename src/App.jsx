import { useState, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import SettingsModal from './components/SettingsModal';
import TradeCalculator from './components/TradeCalculator';
import CapitalLedger from './components/CapitalLedger';

const DEFAULT_PROFILES = {
  indian: {
    label: 'Indian Market (Dhan)',
    currency: '₹',
    accountBalance: 100000,
    fixedRisk: 1000,
    riskPercent: 1,
    riskMode: 'fixed',
    defaultRR: 2,
    lotSize: 1,
    useLotSize: false,
  },
  crypto: {
    label: 'Crypto (Binance)',
    currency: '$',
    accountBalance: 1000,
    fixedRisk: 10,
    riskPercent: 1,
    riskMode: 'fixed',
    defaultRR: 2,
    leverage: 10,
  },
};

export default function App() {
  const [profiles, setProfiles] = useLocalStorage('riskCalc_profiles', DEFAULT_PROFILES);
  const [activeTrades, setActiveTrades] = useLocalStorage('riskCalc_activeTrades', []);
  const [market, setMarket] = useLocalStorage('riskCalc_market', 'indian');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tradeType, setTradeType] = useState('intraday');

  // Reset tradeType to intraday if market is not indian
  useEffect(() => {
    if (market !== 'indian') {
      setTradeType('intraday');
    }
  }, [market]);

  const currentProfile = profiles[market] || DEFAULT_PROFILES[market];

  const activeLeverage = market === 'indian'
    ? (tradeType === 'intraday' ? 5 : 1)
    : (currentProfile.leverage || 1);

  const totalDeployedCapital = activeTrades
    .filter((t) => t.market === market)
    .reduce((sum, t) => sum + (t.marginUtilized || 0), 0);

  const availableBalance = currentProfile.accountBalance - totalDeployedCapital;

  const handleLogTrade = (trade) => {
    setActiveTrades((prev) => [trade, ...prev]);
  };

  const handleCloseTrade = (id) => {
    setActiveTrades((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#080a0f] text-white">
      {/* Ambient glow effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 py-6 sm:py-10">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  Risk Calculator
                </h1>
                <p className="text-xs text-gray-500">Position sizing & fee estimation</p>
              </div>
            </div>
            <button
              onClick={() => setSettingsOpen(true)}
              className="w-10 h-10 rounded-xl bg-gray-800/50 border border-gray-700/50 hover:bg-gray-700/50 hover:border-gray-600/50 flex items-center justify-center text-gray-400 hover:text-white transition-all"
              title="Settings"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>

          {/* Market Selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setMarket('indian')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${
                market === 'indian'
                  ? 'bg-gradient-to-r from-orange-500/15 to-green-500/15 text-orange-300 border border-orange-500/25 shadow-lg shadow-orange-500/5'
                  : 'bg-gray-800/30 text-gray-500 border border-transparent hover:border-gray-700 hover:text-gray-400'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                🇮🇳 Indian (Dhan)
              </span>
            </button>
            <button
              onClick={() => setMarket('crypto')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${
                market === 'crypto'
                  ? 'bg-gradient-to-r from-amber-500/15 to-yellow-500/15 text-amber-300 border border-amber-500/25 shadow-lg shadow-amber-500/5'
                  : 'bg-gray-800/30 text-gray-500 border border-transparent hover:border-gray-700 hover:text-gray-400'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                🌐 Crypto (Binance)
              </span>
            </button>
          </div>

          {/* Profile Summary Pills */}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-800/40 border border-gray-700/30 rounded-lg text-xs text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
              Balance: {currentProfile.currency}{availableBalance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-800/40 border border-gray-700/30 rounded-lg text-xs text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Risk: {currentProfile.riskMode === 'fixed'
                ? `${currentProfile.currency}${currentProfile.fixedRisk}`
                : `${currentProfile.riskPercent}%`
              }
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-800/40 border border-gray-700/30 rounded-lg text-xs text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Leverage: {activeLeverage}X
            </span>
          </div>
        </header>

        {/* Calculator Card */}
        <section className="mb-8">
          <div className="bg-[#0c0e14]/80 border border-gray-700/30 rounded-2xl p-5 sm:p-6 backdrop-blur-sm shadow-2xl shadow-black/20">
            <TradeCalculator
              market={market}
              profile={currentProfile}
              onLogTrade={handleLogTrade}
              tradeType={tradeType}
              setTradeType={setTradeType}
              availableBalance={availableBalance}
              activeLeverage={activeLeverage}
            />
          </div>
        </section>

        {/* Capital Ledger */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Capital Ledger</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-gray-700/50 to-transparent" />
            {activeTrades.length > 0 && (
              <span className="px-2 py-0.5 bg-red-500/10 text-red-400 text-xs font-mono rounded-md border border-red-500/20">
                {activeTrades.length} open
              </span>
            )}
          </div>
          <div className="bg-[#0c0e14]/80 border border-gray-700/30 rounded-2xl p-5 sm:p-6 backdrop-blur-sm shadow-2xl shadow-black/20">
            <CapitalLedger
              trades={activeTrades}
              onCloseTrade={handleCloseTrade}
              profiles={profiles}
            />
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-10 text-center">
          <p className="text-xs text-gray-600">
            All data stored locally in your browser
          </p>
        </footer>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        profiles={profiles}
        setProfiles={setProfiles}
      />
    </div>
  );
}
