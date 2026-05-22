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
export function calculateDhanFees(entryPrice, exitPrice, quantity, tradeType = 'intraday') {
  if (!entryPrice || !exitPrice || !quantity) {
    return { breakdown: {}, totalFees: 0 };
  }

  const buyTurnover  = entryPrice * quantity;
  const sellTurnover = exitPrice  * quantity;
  const totalTurnover = buyTurnover + sellTurnover;

  let brokerage = 0;
  let stt = 0;
  let txnCharges = 0;
  let gst = 0;
  let sebiCharges = 0;
  let stampDuty = 0;
  let dpCharges = 0;

  if (tradeType === 'delivery') {
    // Delivery Logic
    // Brokerage: ₹0
    brokerage = 0;
    // STT: 0.1% on both Buy and Sell sides
    stt = totalTurnover * 0.001;
    // Exchange Transaction Charges: 0.00325% on both sides
    txnCharges = totalTurnover * 0.0000325;
    // GST: 18% on (Brokerage + Transaction Charges)
    gst = (brokerage + txnCharges) * 0.18;
    // SEBI Charges: 0.0001% on both sides
    sebiCharges = totalTurnover * 0.000001;
    // Stamp Duty: 0.015% on Buy side ONLY
    stampDuty = buyTurnover * 0.00015;
    // DP Charges: Flat ₹14.75 on Sell side ONLY
    dpCharges = 14.75;
  } else {
    // Intraday Logic (Default)
    // Brokerage: Lower of ₹20 or 0.03% on each side
    const buyBrokerage  = Math.min(20, buyTurnover  * 0.0003);
    const sellBrokerage = Math.min(20, sellTurnover * 0.0003);
    brokerage = buyBrokerage + sellBrokerage;
    // STT: 0.025% on Sell side ONLY
    stt = sellTurnover * 0.00025;
    // Exchange Transaction Charges: 0.00325% on both sides
    txnCharges = totalTurnover * 0.0000325;
    // GST: 18% on (Brokerage + Transaction Charges)
    gst = (brokerage + txnCharges) * 0.18;
    // SEBI Charges: 0.0001% on both sides
    sebiCharges = totalTurnover * 0.000001;
    // Stamp Duty: 0.003% on Buy side ONLY
    stampDuty = buyTurnover * 0.00003;
    // DP Charges: ₹0
    dpCharges = 0;
  }

  const totalFees = brokerage + stt + txnCharges + gst + sebiCharges + stampDuty + dpCharges;

  return {
    breakdown: {
      brokerage:   +brokerage.toFixed(2),
      stt:         +stt.toFixed(2),
      txnCharges:  +txnCharges.toFixed(2),
      gst:         +gst.toFixed(2),
      sebiCharges: +sebiCharges.toFixed(4),
      stampDuty:   +stampDuty.toFixed(2),
      dpCharges:   +dpCharges.toFixed(2),
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


export function calculateFees(market, { entryPrice, exitPrice, quantity, leverage, tradeType }) {
  switch (market) {
    case 'indian':
      return calculateDhanFees(entryPrice, exitPrice, quantity, tradeType);
    case 'crypto':
      return calculateBinanceFees(entryPrice, exitPrice, quantity, leverage);
    default:
      console.warn(`[FeeCalculator] Unknown market: ${market}`);
      return { breakdown: {}, totalFees: 0 };
  }
}

export function calculateTradeFees(market, tradeType, entry, exit, quantity, activeLeverage) {
  if (market === 'indian') {
    return calculateDhanFees(entry, exit, quantity, tradeType).totalFees;
  } else if (market === 'crypto') {
    return calculateBinanceFees(entry, exit, quantity, activeLeverage).totalFees;
  }
  return 0;
}

export default { calculateDhanFees, calculateBinanceFees, calculateFees, calculateTradeFees };
