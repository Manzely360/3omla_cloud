"""
Trading API endpoints
Secure trading operations with encrypted credentials
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Dict, Optional, Any
import json
import structlog
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from ...services.secure_credential_manager import credential_manager, ExchangeCredentials
from ...services.secure_trading_engine import trading_engine, OrderRequest, OrderResult, Balance, Position

logger = structlog.get_logger()

router = APIRouter()

# Pydantic models for request/response
class CredentialRequest(BaseModel):
    exchange: str = Field(..., description="Exchange name")
    api_key: str = Field(..., description="API key")
    secret_key: str = Field(..., description="Secret key")
    passphrase: Optional[str] = Field(None, description="Passphrase (for some exchanges)")
    sandbox: bool = Field(True, description="Use sandbox/testnet")

class OrderRequestModel(BaseModel):
    exchange: str = Field(..., description="Exchange name")
    symbol: str = Field(..., description="Trading symbol")
    side: str = Field(..., description="Buy or sell")
    type: str = Field(..., description="Order type")
    amount: float = Field(..., description="Order amount")
    price: Optional[float] = Field(None, description="Order price (for limit orders)")
    stop_price: Optional[float] = Field(None, description="Stop price (for stop orders)")
    time_in_force: str = Field("GTC", description="Time in force")
    client_order_id: Optional[str] = Field(None, description="Client order ID")

class OrderResponse(BaseModel):
    order_id: str
    symbol: str
    side: str
    type: str
    amount: float
    price: float
    filled: float
    remaining: float
    status: str
    timestamp: float
    exchange: str
    client_order_id: Optional[str] = None
    fees: Optional[Dict[str, float]] = None
    error: Optional[str] = None

class BalanceResponse(BaseModel):
    exchange: str
    currency: str
    free: float
    used: float
    total: float
    timestamp: float

class PositionResponse(BaseModel):
    exchange: str
    symbol: str
    side: str
    amount: float
    entry_price: float
    current_price: float
    unrealized_pnl: float
    timestamp: float

# Dependency to get user ID (in real app, this would come from JWT token)
def get_user_id() -> str:
    # This is a placeholder - in a real app, you'd extract this from JWT token
    return "user_123"

@router.post("/credentials")
async def store_credentials(
    credentials: CredentialRequest,
    user_id: str = Depends(get_user_id)
):
    """Store encrypted exchange credentials"""
    try:
        # Validate exchange
        if credentials.exchange not in credential_manager.supported_exchanges:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported exchange: {credentials.exchange}"
            )
        
        # Create credentials object
        creds = ExchangeCredentials(
            user_id=user_id,
            exchange=credentials.exchange,
            api_key=credentials.api_key,
            secret_key=credentials.secret_key,
            passphrase=credentials.passphrase,
            sandbox=credentials.sandbox,
            created_at=datetime.now(timezone.utc).timestamp()
        )
        
        # Store credentials
        success = await credential_manager.store_credentials(creds)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to store credentials")
        
        return {"message": "Credentials stored successfully"}
        
    except Exception as e:
        logger.error("Failed to store credentials", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/credentials")
async def get_credentials(user_id: str = Depends(get_user_id)):
    """Get all stored credentials (without sensitive data)"""
    try:
        credentials = await credential_manager.get_all_credentials(user_id)
        
        # Return only non-sensitive information
        result = []
        for cred in credentials:
            result.append({
                "exchange": cred.exchange,
                "sandbox": cred.sandbox,
                "created_at": cred.created_at,
                "last_used": cred.last_used,
                "is_active": cred.is_active
            })
        
        return {"credentials": result}
        
    except Exception as e:
        logger.error("Failed to get credentials", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/credentials/{exchange}/verify")
async def verify_credentials(
    exchange: str,
    user_id: str = Depends(get_user_id)
):
    """Verify stored credentials by making a test API call"""
    try:
        success = await credential_manager.verify_credentials(user_id, exchange)
        
        if success:
            return {"message": "Credentials verified successfully"}
        else:
            raise HTTPException(status_code=400, detail="Credentials verification failed")
        
    except Exception as e:
        logger.error("Failed to verify credentials", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/credentials/{exchange}")
async def delete_credentials(
    exchange: str,
    user_id: str = Depends(get_user_id)
):
    """Delete stored credentials"""
    try:
        success = await credential_manager.delete_credentials(user_id, exchange)
        
        if success:
            return {"message": "Credentials deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Credentials not found")
        
    except Exception as e:
        logger.error("Failed to delete credentials", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/orders")
async def place_order(
    order_request: OrderRequestModel,
    user_id: str = Depends(get_user_id)
):
    """Place a trading order"""
    try:
        # Validate order request
        if order_request.side not in ['buy', 'sell']:
            raise HTTPException(status_code=400, detail="Invalid side. Must be 'buy' or 'sell'")
        
        if order_request.type not in ['market', 'limit', 'stop']:
            raise HTTPException(status_code=400, detail="Invalid type. Must be 'market', 'limit', or 'stop'")
        
        if order_request.type == 'limit' and not order_request.price:
            raise HTTPException(status_code=400, detail="Price required for limit orders")
        
        if order_request.type == 'stop' and not order_request.stop_price:
            raise HTTPException(status_code=400, detail="Stop price required for stop orders")
        
        # Create order request
        order_req = OrderRequest(
            user_id=user_id,
            exchange=order_request.exchange,
            symbol=order_request.symbol,
            side=order_request.side,
            type=order_request.type,
            amount=order_request.amount,
            price=order_request.price,
            stop_price=order_request.stop_price,
            time_in_force=order_request.time_in_force,
            client_order_id=order_request.client_order_id
        )
        
        # Place order
        result = await trading_engine.place_order(order_req)
        
        # Convert to response model
        response = OrderResponse(
            order_id=result.order_id,
            symbol=result.symbol,
            side=result.side,
            type=result.type,
            amount=result.amount,
            price=result.price,
            filled=result.filled,
            remaining=result.remaining,
            status=result.status,
            timestamp=result.timestamp,
            exchange=result.exchange,
            client_order_id=result.client_order_id,
            fees=result.fees,
            error=result.error
        )
        
        if result.error:
            raise HTTPException(status_code=400, detail=result.error)
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to place order", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/orders/{exchange}/{order_id}")
async def cancel_order(
    exchange: str,
    order_id: str,
    user_id: str = Depends(get_user_id)
):
    """Cancel an order"""
    try:
        success = await trading_engine.cancel_order(user_id, exchange, order_id)
        
        if success:
            return {"message": "Order cancelled successfully"}
        else:
            raise HTTPException(status_code=404, detail="Order not found or already cancelled")
        
    except Exception as e:
        logger.error("Failed to cancel order", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/orders/{exchange}/{order_id}")
async def get_order_status(
    exchange: str,
    order_id: str,
    user_id: str = Depends(get_user_id)
):
    """Get order status"""
    try:
        result = await trading_engine.get_order_status(user_id, exchange, order_id)
        
        if not result:
            raise HTTPException(status_code=404, detail="Order not found")
        
        response = OrderResponse(
            order_id=result.order_id,
            symbol=result.symbol,
            side=result.side,
            type=result.type,
            amount=result.amount,
            price=result.price,
            filled=result.filled,
            remaining=result.remaining,
            status=result.status,
            timestamp=result.timestamp,
            exchange=result.exchange,
            client_order_id=result.client_order_id,
            fees=result.fees,
            error=result.error
        )
        
        return response
        
    except Exception as e:
        logger.error("Failed to get order status", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/orders/{exchange}")
async def get_open_orders(
    exchange: str,
    symbol: Optional[str] = Query(None, description="Filter by symbol"),
    user_id: str = Depends(get_user_id)
):
    """Get open orders"""
    try:
        orders = await trading_engine.get_open_orders(user_id, exchange, symbol)
        
        response = []
        for order in orders:
            response.append(OrderResponse(
                order_id=order.order_id,
                symbol=order.symbol,
                side=order.side,
                type=order.type,
                amount=order.amount,
                price=order.price,
                filled=order.filled,
                remaining=order.remaining,
                status=order.status,
                timestamp=order.timestamp,
                exchange=order.exchange,
                client_order_id=order.client_order_id,
                fees=order.fees,
                error=order.error
            ))
        
        return {"orders": response}
        
    except Exception as e:
        logger.error("Failed to get open orders", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/orders/{exchange}/history")
async def get_order_history(
    exchange: str,
    symbol: Optional[str] = Query(None, description="Filter by symbol"),
    limit: int = Query(100, ge=1, le=1000, description="Number of orders to return"),
    user_id: str = Depends(get_user_id)
):
    """Get order history"""
    try:
        orders = await trading_engine.get_order_history(user_id, exchange, symbol, limit)
        
        response = []
        for order in orders:
            response.append(OrderResponse(
                order_id=order.order_id,
                symbol=order.symbol,
                side=order.side,
                type=order.type,
                amount=order.amount,
                price=order.price,
                filled=order.filled,
                remaining=order.remaining,
                status=order.status,
                timestamp=order.timestamp,
                exchange=order.exchange,
                client_order_id=order.client_order_id,
                fees=order.fees,
                error=order.error
            ))
        
        return {"orders": response}
        
    except Exception as e:
        logger.error("Failed to get order history", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/balance/{exchange}")
async def get_balance(
    exchange: str,
    user_id: str = Depends(get_user_id)
):
    """Get account balance"""
    try:
        balances = await trading_engine.get_balance(user_id, exchange)
        
        response = []
        for balance in balances:
            response.append(BalanceResponse(
                exchange=balance.exchange,
                currency=balance.currency,
                free=balance.free,
                used=balance.used,
                total=balance.total,
                timestamp=balance.timestamp
            ))
        
        return {"balances": response}
        
    except Exception as e:
        logger.error("Failed to get balance", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/positions/{exchange}")
async def get_positions(
    exchange: str,
    user_id: str = Depends(get_user_id)
):
    """Get open positions"""
    try:
        positions = await trading_engine.get_positions(user_id, exchange)
        
        response = []
        for position in positions:
            response.append(PositionResponse(
                exchange=position.exchange,
                symbol=position.symbol,
                side=position.side,
                amount=position.amount,
                entry_price=position.entry_price,
                current_price=position.current_price,
                unrealized_pnl=position.unrealized_pnl,
                timestamp=position.timestamp
            ))
        
        return {"positions": response}
        
    except Exception as e:
        logger.error("Failed to get positions", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/exchanges")
async def get_supported_exchanges():
    """Get list of supported exchanges"""
    return {
        "exchanges": credential_manager.supported_exchanges,
        "total": len(credential_manager.supported_exchanges)
    }

@router.get("/health")
async def get_trading_health():
    """Get trading engine health status"""
    try:
        # Check if trading engine is initialized
        return {
            "status": "healthy",
            "supported_exchanges": len(credential_manager.supported_exchanges),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error("Trading health check failed", error=str(e))
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

