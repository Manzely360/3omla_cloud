"""Simplified arbitrage router stub.

This module performs basic risk checks and returns mocked order ids. It is a
starting point for integrating with real venue adapters.
"""
from __future__ import annotations

import time
import uuid
from dataclasses import dataclass

import structlog

logger = structlog.get_logger()
from services.arb_inventory import get_inventory, get_risk_config


@dataclass
class ExecutionResult:
    buy_order_id: str
    sell_order_id: str
    requested_quote: float
    timestamp: float


class RiskError(Exception):
    """Raised when a risk guard blocks execution."""


class RiskGuards:
    """Lightweight risk tracking.

    NOTE: This is an in-memory placeholder; production code should persist and
    share state between workers (e.g., Redis, database).
    """

    def __init__(self) -> None:
        self.per_min_cap = 0.0
        self.window_start = time.time()
        self.window_notional = 0.0

    def check(self, notional: float, per_min_cap: float) -> None:
        self.per_min_cap = per_min_cap
        now = time.time()
        if now - self.window_start > 60:
            self.window_start = now
            self.window_notional = 0.0
        if self.window_notional + notional > self.per_min_cap:
            raise RiskError("Per-minute notional cap exceeded")
        self.window_notional += notional


risk_tracker = RiskGuards()


def ensure_notional_bounds(order_size_quote: float) -> None:
    cfg = get_risk_config()
    if order_size_quote < cfg.min_notional_per_trade:
        raise RiskError(
            f"Order size {order_size_quote} below minimum {cfg.min_notional_per_trade}"
        )
    if order_size_quote > cfg.max_notional_per_trade:
        raise RiskError(
            f"Order size {order_size_quote} exceeds cap {cfg.max_notional_per_trade}"
        )


def submit_dual_orders(
    *,
    symbol: str,
    buy_venue: str,
    sell_venue: str,
    order_size_quote: float,
    size_mode: str,
) -> ExecutionResult:
    """Mock execution that records risk checks and returns fake order ids."""
    cfg = get_risk_config()
    ensure_notional_bounds(order_size_quote)
    risk_tracker.check(order_size_quote, cfg.per_minute_notional_cap)

    buy_order_id = f"{buy_venue}-{uuid.uuid4()}"
    sell_order_id = f"{sell_venue}-{uuid.uuid4()}"

    logger.info(
        "auto-arb submit",
        symbol=symbol,
        buy_venue=buy_venue,
        sell_venue=sell_venue,
        order_size_quote=order_size_quote,
        size_mode=size_mode,
        buy_order_id=buy_order_id,
        sell_order_id=sell_order_id,
        dry_run=cfg.dry_run,
    )

    return ExecutionResult(
        buy_order_id=buy_order_id,
        sell_order_id=sell_order_id,
        requested_quote=order_size_quote,
        timestamp=time.time(),
    )


def record_mock_fill(
    symbol: str,
    buy_venue: str,
    sell_venue: str,
    order_size_quote: float,
    base_qty: float,
) -> None:
    cfg = get_risk_config()
    inventory = get_inventory()
    if cfg.dry_run:
        inventory.update(buy_venue, delta_quote=-order_size_quote, delta_base=base_qty)
        inventory.update(sell_venue, delta_quote=order_size_quote, delta_base=-base_qty)
        logger.debug(
            "mock fill recorded",
            symbol=symbol,
            buy_venue=buy_venue,
            sell_venue=sell_venue,
            base_qty=base_qty,
        )
