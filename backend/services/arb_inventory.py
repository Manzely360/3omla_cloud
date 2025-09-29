"""In-memory inventory and risk configuration for AUTO-ARBITRAGE."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict
import os

import structlog

logger = structlog.get_logger()


def _float_env(name: str, default: float) -> float:
    try:
        return float(os.getenv(name, default))
    except (ValueError, TypeError):
        return default


@dataclass
class VenueInventory:
    base: float = 0.0
    quote: float = 0.0


@dataclass
class RiskConfig:
    max_notional_per_trade: float = _float_env("AUTO_ARB_MAX_NOTIONAL", 2500.0)
    min_notional_per_trade: float = _float_env("AUTO_ARB_MIN_NOTIONAL", 50.0)
    per_minute_notional_cap: float = _float_env("AUTO_ARB_PER_MIN_CAP", 5000.0)
    dry_run: bool = os.getenv("AUTO_ARB_DRY_RUN", "true").lower() != "false"


@dataclass
class InventoryState:
    venues: Dict[str, VenueInventory] = field(default_factory=dict)

    def update(self, venue: str, delta_base: float = 0.0, delta_quote: float = 0.0) -> None:
        inv = self.venues.setdefault(venue, VenueInventory())
        inv.base += delta_base
        inv.quote += delta_quote
        logger.debug("inventory updated", venue=venue, base=inv.base, quote=inv.quote)


risk_config = RiskConfig()
inventory_state = InventoryState()


def get_risk_config() -> RiskConfig:
    return risk_config


def get_inventory() -> InventoryState:
    return inventory_state


def update_risk_config(**kwargs: float | bool) -> RiskConfig:
    global risk_config
    current = risk_config
    data = current.__dict__.copy()
    data.update({k: v for k, v in kwargs.items() if v is not None})
    risk_config = RiskConfig(**data)
    logger.info("risk config updated", **risk_config.__dict__)
    return risk_config
