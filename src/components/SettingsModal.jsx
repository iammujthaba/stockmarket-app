import { useState, useEffect } from 'react';

const DEFAULT_PROFILES = {
  indian: {
    label: 'Indian Market (Dhan)',
    currency: '₹',
    accountBalance: 100000,
    fixedRisk: 1000,
    riskPercent: 1,
    riskMode: 'fixed', // 'fixed' | 'percent'
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

export default function SettingsModal({ isOpen, onClose, profiles, setProfiles }) {
  const [activeTab, setActiveTab] = useState('indian');
  const [draft, setDraft] = useState({});

  // Sync draft from profiles when modal opens
  useEffect(() => {
    if (isOpen) {
      setDraft(JSON.parse(JSON.stringify(profiles)));
    }
  }, [isOpen, profiles]);

  if (!isOpen) return null;

  const current = draft[activeTab] || DEFAULT_PROFILES[activeTab];

  const updateField = (field, value) => {
    setDraft((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [field]: value,
      },
    }));
  };

  const handleSave = () => {
    setProfiles(draft);
    onClose();
  };

  const handleReset = () => {
    setDraft((prev) => ({
      ...prev,
      [activeTab]: { ...DEFAULT_PROFILES[activeTab] },
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-[#0f1117] border border-gray-700/50 rounded-2xl shadow-2xl shadow-cyan-500/5 overflow-hidden animate-modal-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/50 bg-gradient-to-r from-cyan-500/5 to-purple-500/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white">Market Profiles</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 pt-4 gap-2">
          {Object.entries(DEFAULT_PROFILES).map(([key, profile]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === key
                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50 border border-transparent'
              }`}
            >
              {profile.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {/* Account Balance */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Account Balance ({current.currency})
            </label>
            <input
              type="number"
              value={current.accountBalance}
              onChange={(e) => updateField('accountBalance', +e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
            />
          </div>

          {/* Risk Mode Toggle */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Risk Mode
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => updateField('riskMode', 'fixed')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  current.riskMode === 'fixed'
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                    : 'bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:text-gray-300'
                }`}
              >
                Fixed Amount
              </button>
              <button
                onClick={() => updateField('riskMode', 'percent')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  current.riskMode === 'percent'
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                    : 'bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:text-gray-300'
                }`}
              >
                % of Balance
              </button>
            </div>
          </div>

          {/* Risk Value */}
          {current.riskMode === 'fixed' ? (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Fixed Risk Amount ({current.currency})
              </label>
              <input
                type="number"
                value={current.fixedRisk}
                onChange={(e) => updateField('fixedRisk', +e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Risk % of Balance
              </label>
              <input
                type="number"
                step="0.1"
                value={current.riskPercent}
                onChange={(e) => updateField('riskPercent', +e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
              />
            </div>
          )}

          {/* Default R:R */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Default Risk : Reward Ratio
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={current.defaultRR}
              onChange={(e) => updateField('defaultRR', +e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
            />
          </div>

          {/* Market-specific fields */}
          {activeTab === 'indian' && (
            <>
              <div className="flex items-center justify-between py-2">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Use Lot Size (F&O)
                </label>
                <button
                  onClick={() => updateField('useLotSize', !current.useLotSize)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                    current.useLotSize ? 'bg-cyan-500' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                      current.useLotSize ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              {current.useLotSize && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Lot Size
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={current.lotSize}
                    onChange={(e) => updateField('lotSize', Math.max(1, +e.target.value))}
                    className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                  />
                </div>
              )}
            </>
          )}

          {activeTab === 'crypto' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Default Leverage
              </label>
              <input
                type="number"
                min="1"
                max="125"
                value={current.leverage || 1}
                onChange={(e) => updateField('leverage', Math.max(1, +e.target.value))}
                className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700/50 bg-gray-900/30">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm text-gray-400 hover:text-red-400 transition-colors"
          >
            Reset to Defaults
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2 text-sm text-gray-400 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 rounded-xl transition-all shadow-lg shadow-cyan-500/20"
            >
              Save Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
