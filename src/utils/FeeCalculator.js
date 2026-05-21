/**
 * FeeCalculator.js
 *
 * Pure utility functions for computing broker fees & taxes.
 * Each market profile has its own calculator that returns a
 * breakdown object AND the total round-trip cost.
 *
 * All monetary values are in the market's native currency
 * (₹ for Dhan, USDT for Binance).
 */

// ─────────────────────────────────────────────
//  Dhan — Indian Equity Intraday
// ─────────────────────────────────────────────

/**
 * Calculates the total round-trip fees for an Intraday Equity trade on Dhan.
 *
 * @param {number} entryPrice  - Per-share entry price
 * @param {number} exitPrice   - Per-share exit price
 * @param {number} quantity    - Number of shares
 * @returns {{ breakdown: object, totalFees: number }}
 */
export function calculateDhanFees(entryPrice, exitPrice, quantity) {
  if (!entryPrice || !exitPrice || !quantity) {
    return { breakdown: {}, totalFees: 0 };
  }

  const buyTurnover  = entryPrice * quantity;
  const sellTurnover = exitPrice  * quantity;
  const totalTurnover = buyTurnover + sellTurnover;

  // 1. Brokerage: Lower of ₹20 or 0.03% per executed order (buy + sell)
  const buyBrokerage  = Math.min(20, buyTurnover  * 0.0003);
  const sellBrokerage = Math.min(20, sellTurnover * 0.0003);
  const brokerage = buyBrokerage + sellBrokerage;

  // 2. STT (Securities Transaction Tax): 0.025% on Sell side ONLY
  const stt = sellTurnover * 0.00025;

  // 3. Transaction Charges (NSE): 0.00325% on both sides
  const txnCharges = totalTurnover * 0.0000325;

  // 4. GST: 18% on (Brokerage + Transaction Charges)
  const gst = (brokerage + txnCharges) * 0.18;

  // 5. SEBI Charges: 0.0001% on both sides
  const sebiCharges = totalTurnover * 0.000001;

  // 6. Stamp Duty: 0.003% on Buy side ONLY
  const stampDuty = buyTurnover * 0.00003;

  const totalFees = brokerage + stt + txnCharges + gst + sebiCharges + stampDuty;

  return {
    breakdown: {
      brokerage:   +brokerage.toFixed(2),
      stt:         +stt.toFixed(2),
      txnCharges:  +txnCharges.toFixed(2),
      gst:         +gst.toFixed(2),
      sebiCharges: +sebiCharges.toFixed(4),
      stampDuty:   +stampDuty.toFixed(2),
    },
    totalFees: +totalFees.toFixed(2),
  };
}


// ─────────────────────────────────────────────
//  Binance — USDS-M Futures (Taker)
// ─────────────────────────────────────────────

/**
 * Calculates round-trip fees for a Binance USDS-M Futures trade.
 * Assumes Taker fee for conservative risk math.
 *
 * @param {number} entryPrice   - Per-unit entry price in USDT
 * @param {number} exitPrice    - Per-unit exit price in USDT
 * @param {number} quantity     - Number of units (can be fractional)
 * @param {number} leverage     - Leverage multiplier (default 1)
 * @returns {{ breakdown: object, totalFees: number }}
 */
export function calculateBinanceFees(entryPrice, exitPrice, quantity, leverage = 1) {
  if (!entryPrice || !exitPrice || !quantity) {
    return { breakdown: {}, totalFees: 0 };
  }

  const TAKER_RATE = 0.0005; // 0.0500%

  // Nominal position size = Price * Quantity (leverage already reflected in quantity/margin)
  const entryNotional = entryPrice * quantity;
  const exitNotional  = exitPrice  * quantity;

  const entryFee = entryNotional * TAKER_RATE;
  const exitFee  = exitNotional  * TAKER_RATE;
  const totalFees = entryFee + exitFee;

  return {
    breakdown: {
      entryFee: +entryFee.toFixed(4),
      exitFee:  +exitFee.toFixed(4),
      takerRate: `${(TAKER_RATE * 100).toFixed(4)}%`,
    },
    totalFees: +totalFees.toFixed(4),
  };
}


// ─────────────────────────────────────────────
//  Dispatcher — pick the right calculator
// ─────────────────────────────────────────────

/**
 * Routes to the correct fee calculator based on market profile.
 *
 * @param {'indian' | 'crypto'} market
 * @param {object} params - { entryPrice, exitPrice, quantity, leverage? }
 * @returns {{ breakdown: object, totalFees: number }}
 */
export function calculateFees(market, { entryPrice, exitPrice, quantity, leverage }) {
  switch (market) {
    case 'indian':
      return calculateDhanFees(entryPrice, exitPrice, quantity);
    case 'crypto':
      return calculateBinanceFees(entryPrice, exitPrice, quantity, leverage);
    default:
      console.warn(`[FeeCalculator] Unknown market: ${market}`);
      return { breakdown: {}, totalFees: 0 };
  }
}

export default { calculateDhanFees, calculateBinanceFees, calculateFees };
