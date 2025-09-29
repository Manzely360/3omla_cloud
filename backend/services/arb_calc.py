"""Deterministic arbitrage profitability calculator."""
from __future__ import annotations

from typing import Iterable, List, Optional, Tuple, TypedDict


class OrderBookLevel(TypedDict):
    p: float  # price
    q: float  # quantity (base asset)


class ArbInputs(TypedDict, total=False):
    order_size_quote: float
    asks_buy: List[OrderBookLevel]
    bids_sell: List[OrderBookLevel]
    fee_buy: float
    fee_sell: float
    withdraw_fee_quote: float
    expected_transfer_min: float
    vol_bps_per_min: float
    safety_bps: float


def depth_fill_price(levels: Iterable[OrderBookLevel], target_base: float) -> Tuple[Optional[float], float]:
    """Return VWAP to fill target_base and slippage in bps relative to best level.

    Parameters
    ----------
    levels: iterable sorted best-to-worst.
    target_base: quantity we need to fill (base asset).
    """
    levels_list = list(levels)
    if not levels_list or target_base <= 0:
        return None, 0.0

    filled = 0.0
    cost = 0.0
    best_price = levels_list[0]["p"]

    for level in levels_list:
        remaining = target_base - filled
        if remaining <= 0:
            break
        take = level["q"] if level["q"] < remaining else remaining
        cost += take * level["p"]
        filled += take
        if filled >= target_base:
            break

    if filled + 1e-12 < target_base:
        return None, 0.0

    vwap = cost / filled
    slippage_bps = abs(vwap - best_price) / best_price * 1e4 if best_price else 0.0
    return vwap, slippage_bps


def arb_eval(
    *,
    order_size_quote: float,
    asks_buy: List[OrderBookLevel],
    bids_sell: List[OrderBookLevel],
    fee_buy: float,
    fee_sell: float,
    withdraw_fee_quote: float = 0.0,
    expected_transfer_min: float = 0.0,
    vol_bps_per_min: float = 0.0,
    safety_bps: float = 10.0,
) -> Optional[dict]:
    """Evaluate arbitrage opportunity economics."""
    if order_size_quote <= 0:
        return None
    if not asks_buy or not bids_sell:
        return None

    best_ask = asks_buy[0]["p"]
    best_bid = bids_sell[0]["p"]
    if best_ask <= 0 or best_bid <= 0:
        return None

    initial_base_guess = order_size_quote / best_ask

    buy_vwap, slip_buy = depth_fill_price(asks_buy, initial_base_guess)
    if buy_vwap is None or buy_vwap <= 0:
        return None

    base_qty = order_size_quote / buy_vwap

    sell_vwap, slip_sell = depth_fill_price(bids_sell, base_qty)
    if sell_vwap is None:
        return None

    mid_price = 0.5 * (best_ask + best_bid)
    gross_quote = base_qty * (sell_vwap * (1 - fee_sell) - buy_vwap * (1 + fee_buy))

    latency_bps = 0.0
    latency_cost = 0.0
    if expected_transfer_min > 0:
        latency_bps = min(max(2 * vol_bps_per_min * expected_transfer_min, 50.0), 300.0)
        latency_cost = (latency_bps / 1e4) * base_qty * mid_price

    net_quote = gross_quote - withdraw_fee_quote - latency_cost

    exec_spread_bps = ((sell_vwap - buy_vwap) / mid_price) * 1e4 if mid_price else 0.0
    slippage_bps = slip_buy + slip_sell
    break_even_bps = (fee_buy + fee_sell) * 1e4 + slippage_bps + safety_bps

    return {
        "exec_spread_bps": exec_spread_bps,
        "slippage_bps": slippage_bps,
        "latency_bps": latency_bps,
        "break_even_bps": break_even_bps,
        "net_pnl_quote": net_quote,
        "net_margin_pct": 100 * net_quote / order_size_quote if order_size_quote else 0.0,
        "base_qty": base_qty,
        "buy_vwap": buy_vwap,
        "sell_vwap": sell_vwap,
    }
