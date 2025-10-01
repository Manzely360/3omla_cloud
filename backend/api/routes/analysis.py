"""
Real-time analysis API endpoints
Provides technical indicators and trading signals
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Optional, Any
import json
import redis.asyncio as redis
import structlog
from datetime import datetime, timezone
import os

logger = structlog.get_logger()

router = APIRouter()

# Redis connection
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
redis_client = redis.from_url(redis_url, decode_responses=True)

@router.get("/indicators/{symbol}")
async def get_indicators(symbol: str):
    """Get technical indicators for a symbol"""
    try:
        key = f"indicators:{symbol}"
        data = await redis_client.get(key)
        
        if not data:
            raise HTTPException(status_code=404, detail="Indicators not found for symbol")
        
        indicators = json.loads(data)
        
        return {
            "symbol": symbol,
            "indicators": indicators,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error("Failed to get indicators", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/signals/{symbol}")
async def get_signals(symbol: str):
    """Get trading signals for a symbol"""
    try:
        key = f"signals:{symbol}"
        data = await redis_client.get(key)
        
        if not data:
            return {
                "symbol": symbol,
                "signals": [],
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        
        signals = json.loads(data)
        
        return {
            "symbol": symbol,
            "signals": signals,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error("Failed to get signals", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/analysis/{symbol}")
async def get_analysis(symbol: str):
    """Get complete analysis (indicators + signals) for a symbol"""
    try:
        key = f"analysis:{symbol}"
        data = await redis_client.get(key)
        
        if not data:
            raise HTTPException(status_code=404, detail="Analysis not found for symbol")
        
        analysis = json.loads(data)
        
        return {
            "symbol": symbol,
            "analysis": analysis,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error("Failed to get analysis", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/signals")
async def get_all_signals(
    limit: int = Query(50, ge=1, le=200),
    signal_type: Optional[str] = Query(None),
    min_strength: float = Query(0.6, ge=0.0, le=1.0)
):
    """Get all trading signals across all symbols"""
    try:
        # Get all signal keys
        pattern = "signals:*"
        keys = await redis_client.keys(pattern)
        
        all_signals = []
        for key in keys:
            data = await redis_client.get(key)
            if data:
                signals = json.loads(data)
                symbol = key.split(":")[1]
                
                for signal in signals:
                    signal["symbol"] = symbol
                    all_signals.append(signal)
        
        # Filter by signal type and strength
        filtered_signals = []
        for signal in all_signals:
            if signal_type and signal.get("signal_type") != signal_type:
                continue
            if signal.get("strength", 0) < min_strength:
                continue
            filtered_signals.append(signal)
        
        # Sort by strength and timestamp
        filtered_signals.sort(key=lambda x: (x.get("strength", 0), x.get("timestamp", 0)), reverse=True)
        
        # Limit results
        filtered_signals = filtered_signals[:limit]
        
        return {
            "signals": filtered_signals,
            "total": len(filtered_signals),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error("Failed to get all signals", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/indicators")
async def get_all_indicators(
    limit: int = Query(50, ge=1, le=200),
    indicator_type: Optional[str] = Query(None)
):
    """Get all technical indicators across all symbols"""
    try:
        # Get all indicator keys
        pattern = "indicators:*"
        keys = await redis_client.keys(pattern)
        
        all_indicators = []
        for key in keys:
            data = await redis_client.get(key)
            if data:
                indicators = json.loads(data)
                symbol = key.split(":")[1]
                
                # Filter by indicator type if specified
                if indicator_type and indicator_type not in indicators:
                    continue
                
                all_indicators.append({
                    "symbol": symbol,
                    "indicators": indicators,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
        
        # Limit results
        all_indicators = all_indicators[:limit]
        
        return {
            "indicators": all_indicators,
            "total": len(all_indicators),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error("Failed to get all indicators", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/summary")
async def get_analysis_summary():
    """Get analysis summary across all symbols"""
    try:
        # Get all analysis keys
        pattern = "analysis:*"
        keys = await redis_client.keys(pattern)
        
        summary = {
            "total_symbols": len(keys),
            "signals_by_type": {},
            "top_signals": [],
            "indicators_available": set(),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        all_signals = []
        for key in keys:
            data = await redis_client.get(key)
            if data:
                analysis = json.loads(data)
                symbol = analysis.get("symbol", "unknown")
                
                # Count signals by type
                signals = analysis.get("signals", [])
                for signal in signals:
                    signal_type = signal.get("signal_type", "unknown")
                    summary["signals_by_type"][signal_type] = summary["signals_by_type"].get(signal_type, 0) + 1
                    
                    signal["symbol"] = symbol
                    all_signals.append(signal)
                
                # Collect available indicators
                indicators = analysis.get("indicators", {})
                summary["indicators_available"].update(indicators.keys())
        
        # Get top signals by strength
        all_signals.sort(key=lambda x: x.get("strength", 0), reverse=True)
        summary["top_signals"] = all_signals[:10]
        
        # Convert set to list for JSON serialization
        summary["indicators_available"] = list(summary["indicators_available"])
        
        return summary
        
    except Exception as e:
        logger.error("Failed to get analysis summary", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/health")
async def get_analysis_health():
    """Get analysis engine health status"""
    try:
        # Check Redis connection
        await redis_client.ping()
        
        # Get basic metrics
        pattern = "analysis:*"
        keys = await redis_client.keys(pattern)
        
        # Check recent activity
        recent_activity = 0
        current_time = datetime.now(timezone.utc).timestamp()
        
        for key in keys:
            data = await redis_client.get(key)
            if data:
                analysis = json.loads(data)
                timestamp = analysis.get("timestamp", 0)
                if current_time - timestamp < 300:  # 5 minutes
                    recent_activity += 1
        
        return {
            "status": "healthy",
            "redis_connected": True,
            "total_symbols": len(keys),
            "recent_activity": recent_activity,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error("Analysis health check failed", error=str(e))
        return {
            "status": "unhealthy",
            "redis_connected": False,
            "error": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

