from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, validator
from typing_extensions import Literal

from services.arb_calc import OrderBookLevel, arb_eval
from services.arb_router import RiskError, submit_dual_orders
from services.arb_inventory import (
    get_inventory,
    get_risk_config,
    update_risk_config,
)
from services.arb_router import record_mock_fill
from models.auto_arbitrage import AutoArbEvaluationLog, AutoArbExecutionLog
from core.database import get_async_session

router = APIRouter()


class BookLevels(BaseModel):
    p: float = Field(..., gt=0, description="Price")
    q: float = Field(..., gt=0, description="Base quantity")


class EvaluateRequest(BaseModel):
    symbol: str
    buy_venue: str
    sell_venue: str
    order_size_quote: float = Field(..., gt=0)
    assume_maker: bool = False
    use_transfer_mode: bool = False
    vol_bps_per_min: float = Field(0, ge=0)
    expected_transfer_min: float = Field(0, ge=0)
    safety_buffer_bps: float = Field(10.0, ge=0)
    max_slippage_bps: float = Field(5.0, ge=0)
    buy_fee: float = Field(0.001, ge=0, description="Taker fee as decimal")
    sell_fee: float = Field(0.001, ge=0, description="Taker fee as decimal")
    withdraw_fee_quote: float = Field(0.0, ge=0)
    asks_buy: List[BookLevels]
    bids_sell: List[BookLevels]

    @validator("symbol")
    def symbol_upper(cls, value: str) -> str:
        return value.upper()


class EvaluateResponse(BaseModel):
    exec_spread_bps: float
    slippage_bps: float
    latency_bps: float
    break_even_bps: float
    net_pnl_quote: float
    net_margin_pct: float
    decision: str
    notes: Optional[str] = None
    base_qty: Optional[float] = None
    buy_vwap: Optional[float] = None
    sell_vwap: Optional[float] = None


def _compute_evaluation(payload: EvaluateRequest) -> tuple[EvaluateResponse, dict]:
    calc = arb_eval(
        order_size_quote=payload.order_size_quote,
        asks_buy=[OrderBookLevel(p=item.p, q=item.q) for item in payload.asks_buy],
        bids_sell=[OrderBookLevel(p=item.p, q=item.q) for item in payload.bids_sell],
        fee_buy=payload.buy_fee,
        fee_sell=payload.sell_fee,
        withdraw_fee_quote=payload.withdraw_fee_quote,
        expected_transfer_min=payload.expected_transfer_min if payload.use_transfer_mode else 0.0,
        vol_bps_per_min=payload.vol_bps_per_min,
        safety_bps=payload.safety_buffer_bps,
    )

    if calc is None:
        raise HTTPException(status_code=400, detail="Insufficient depth or invalid inputs")

    exec_spread = calc["exec_spread_bps"]
    break_even = calc["break_even_bps"]
    net_quote = calc["net_pnl_quote"]

    decision = "EXECUTE" if exec_spread > break_even and net_quote > 0 else "SKIP"

    notes = (
        f"Buy VWAP {calc['buy_vwap']:.8f}, sell VWAP {calc['sell_vwap']:.8f}."
        f" Base qty {calc['base_qty']:.8f}."
    )

    response = EvaluateResponse(
        exec_spread_bps=calc["exec_spread_bps"],
        slippage_bps=calc["slippage_bps"],
        latency_bps=calc["latency_bps"],
        break_even_bps=calc["break_even_bps"],
        net_pnl_quote=net_quote,
        net_margin_pct=calc["net_margin_pct"],
        decision=decision,
        notes=notes,
        base_qty=calc["base_qty"],
        buy_vwap=calc["buy_vwap"],
        sell_vwap=calc["sell_vwap"],
    )

    return response, calc


@router.post("/evaluate", response_model=EvaluateResponse)
async def evaluate_opportunity(payload: EvaluateRequest) -> EvaluateResponse:
    result, calc_data = _compute_evaluation(payload)

    async with get_async_session() as session:
        log = AutoArbEvaluationLog(
            symbol=payload.symbol,
            buy_venue=payload.buy_venue,
            sell_venue=payload.sell_venue,
            order_size_quote=payload.order_size_quote,
            exec_spread_bps=calc_data["exec_spread_bps"],
            break_even_bps=calc_data["break_even_bps"],
            net_pnl_quote=calc_data["net_pnl_quote"],
            decision=result.decision,
            payload=payload.dict(),
        )
        session.add(log)
        await session.commit()

    return result


class ExecuteRequest(EvaluateRequest):
    size_mode: Literal["quote", "base"] = "quote"


class ExecuteResponse(BaseModel):
    status: str
    buy_order_id: str
    sell_order_id: str
    requested_quote: float


class Opportunity(BaseModel):
    symbol: str
    buy_venue: str
    sell_venue: str
    indicative_spread_bps: float
    indicative_size_quote: float
    vol_bps_per_min: float
    asks_buy: List[BookLevels]
    bids_sell: List[BookLevels]


class RiskConfigResponse(BaseModel):
    max_notional_per_trade: float
    min_notional_per_trade: float
    per_minute_notional_cap: float
    dry_run: bool


class RiskConfigUpdateRequest(BaseModel):
    max_notional_per_trade: Optional[float] = Field(None, ge=0)
    min_notional_per_trade: Optional[float] = Field(None, ge=0)
    per_minute_notional_cap: Optional[float] = Field(None, ge=0)
    dry_run: Optional[bool] = None


class VenueInventoryResponse(BaseModel):
    base: float
    quote: float


class InventoryResponse(BaseModel):
    venues: dict[str, VenueInventoryResponse]


class ExecutionLogEntry(BaseModel):
    symbol: str
    buy_venue: str
    sell_venue: str
    request_quote: float
    buy_order_id: str
    sell_order_id: str
    dry_run: bool
    decision: str
    created_at: datetime


MOCK_OPPORTUNITIES: List[Opportunity] = [
    Opportunity(
        symbol="BTCUSDT",
        buy_venue="okx",
        sell_venue="binance",
        indicative_spread_bps=38.5,
        indicative_size_quote=1000.0,
        vol_bps_per_min=18.0,
        asks_buy=[BookLevels(p=109600.1, q=0.8), BookLevels(p=109601.0, q=1.0)],
        bids_sell=[BookLevels(p=109642.6, q=0.6), BookLevels(p=109641.4, q=1.1)],
    ),
    Opportunity(
        symbol="ETHUSDT",
        buy_venue="kraken",
        sell_venue="bybit",
        indicative_spread_bps=26.1,
        indicative_size_quote=600.0,
        vol_bps_per_min=24.0,
        asks_buy=[BookLevels(p=3521.4, q=8), BookLevels(p=3522.2, q=9)],
        bids_sell=[BookLevels(p=3528.8, q=5), BookLevels(p=3527.9, q=10)],
    ),
    Opportunity(
        symbol="SOLUSDT",
        buy_venue="kucoin",
        sell_venue="okx",
        indicative_spread_bps=18.7,
        indicative_size_quote=400.0,
        vol_bps_per_min=30.0,
        asks_buy=[BookLevels(p=178.35, q=150), BookLevels(p=178.40, q=220)],
        bids_sell=[BookLevels(p=178.92, q=120), BookLevels(p=178.88, q=260)],
    ),
]


@router.post("/execute", response_model=ExecuteResponse)
async def execute_opportunity(payload: ExecuteRequest) -> ExecuteResponse:
    calc, calc_data = _compute_evaluation(payload)
    if calc.decision != "EXECUTE":
        raise HTTPException(status_code=400, detail="Opportunity not executable under current parameters")

    try:
        result = submit_dual_orders(
            symbol=payload.symbol,
            buy_venue=payload.buy_venue,
            sell_venue=payload.sell_venue,
            order_size_quote=payload.order_size_quote,
            size_mode=payload.size_mode,
        )
    except RiskError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc

    response = ExecuteResponse(
        status="submitted",
        buy_order_id=result.buy_order_id,
        sell_order_id=result.sell_order_id,
        requested_quote=result.requested_quote,
    )

    # Mock fill updates inventory in dry-run mode using the VWAPs from evaluation
    record_mock_fill(
        symbol=payload.symbol,
        buy_venue=payload.buy_venue,
        sell_venue=payload.sell_venue,
        order_size_quote=payload.order_size_quote,
        base_qty=calc_data.get("base_qty", 0.0),
    )

    async with get_async_session() as session:
        log = AutoArbExecutionLog(
            symbol=payload.symbol,
            buy_venue=payload.buy_venue,
            sell_venue=payload.sell_venue,
            request_quote=result.requested_quote,
            buy_order_id=result.buy_order_id,
            sell_order_id=result.sell_order_id,
            dry_run=str(get_risk_config().dry_run).lower(),
            decision="EXECUTE",
            payload=payload.dict(),
        )
        session.add(log)
        await session.commit()

    return response


@router.get("/opportunities", response_model=List[Opportunity])
async def list_opportunities(symbol: Optional[str] = None, min_edge_bps: Optional[float] = None) -> List[Opportunity]:
    """Return mocked opportunity list; production should pull from calc service."""
    result = MOCK_OPPORTUNITIES
    if symbol:
        symbol_upper = symbol.upper()
        result = [opp for opp in result if opp.symbol == symbol_upper]
    if min_edge_bps is not None:
        result = [opp for opp in result if opp.indicative_spread_bps >= min_edge_bps]
    return result


@router.get("/risk_config", response_model=RiskConfigResponse)
async def fetch_risk_config() -> RiskConfigResponse:
    cfg = get_risk_config()
    return RiskConfigResponse(**cfg.__dict__)


@router.post("/risk_config", response_model=RiskConfigResponse)
async def update_risk(payload: RiskConfigUpdateRequest) -> RiskConfigResponse:
    cfg = update_risk_config(**payload.dict(exclude_unset=True))
    return RiskConfigResponse(**cfg.__dict__)


@router.get("/inventory", response_model=InventoryResponse)
async def fetch_inventory() -> InventoryResponse:
    inv = get_inventory()
    venues = {venue: VenueInventoryResponse(base=vals.base, quote=vals.quote) for venue, vals in inv.venues.items()}
    return InventoryResponse(venues=venues)


@router.get("/executions", response_model=List[ExecutionLogEntry])
async def list_executions(limit: int = 20) -> List[ExecutionLogEntry]:
    async with get_async_session() as session:
        result = await session.execute(
            AutoArbExecutionLog.__table__.select().order_by(AutoArbExecutionLog.created_at.desc()).limit(limit)
        )
        rows = result.fetchall()

    entries: List[ExecutionLogEntry] = []
    for row in rows:
        data = dict(row._mapping)
        entries.append(
            ExecutionLogEntry(
                symbol=data["symbol"],
                buy_venue=data["buy_venue"],
                sell_venue=data["sell_venue"],
                request_quote=data["request_quote"],
                buy_order_id=data["buy_order_id"],
                sell_order_id=data["sell_order_id"],
                dry_run=data["dry_run"] == "true",
                decision=data["decision"],
                created_at=data["created_at"],
            )
        )
    return entries
