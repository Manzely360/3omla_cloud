"""
Secure Credential Manager
Handles encrypted storage and retrieval of exchange API credentials
"""

import asyncio
import json
import os
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
import structlog
import redis.asyncio as redis
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import secrets
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text
import hashlib

logger = structlog.get_logger()

@dataclass
class ExchangeCredentials:
    user_id: str
    exchange: str
    api_key: str
    secret_key: str
    passphrase: Optional[str] = None
    sandbox: bool = True
    created_at: float = 0
    last_used: float = 0
    is_active: bool = True

class SecureCredentialManager:
    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.redis = redis.from_url(self.redis_url, decode_responses=True)
        
        # Database connection
        database_url = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/coinmatcher")
        async_database_url = database_url.replace("postgresql://", "postgresql+asyncpg://")
        
        self.db_engine = create_async_engine(
            async_database_url,
            echo=False,
            pool_pre_ping=True,
            pool_recycle=300,
        )
        
        self.db_session = async_sessionmaker(
            self.db_engine,
            class_=AsyncSession,
            expire_on_commit=False
        )
        
        # Encryption setup
        self.encryption_key = self._get_or_create_encryption_key()
        self.cipher_suite = Fernet(self.encryption_key)
        
        # Supported exchanges
        self.supported_exchanges = [
            "binance",
            "bybit", 
            "kucoin",
            "coinbase",
            "kraken",
            "okx",
            "gateio",
            "huobi"
        ]
    
    def _get_or_create_encryption_key(self) -> bytes:
        """Get or create encryption key for credentials"""
        try:
            # Try to get key from environment
            key = os.getenv("CREDENTIAL_ENCRYPTION_KEY")
            if key:
                return key.encode()
            
            # Generate new key
            key = Fernet.generate_key()
            
            # Store in environment (in production, use proper secret management)
            logger.warning("Generated new encryption key. Store CREDENTIAL_ENCRYPTION_KEY in environment")
            
            return key
            
        except Exception as e:
            logger.error("Failed to get encryption key", error=str(e))
            raise
    
    def _encrypt_credential(self, credential: str) -> str:
        """Encrypt a credential string"""
        try:
            encrypted_bytes = self.cipher_suite.encrypt(credential.encode())
            return base64.b64encode(encrypted_bytes).decode()
        except Exception as e:
            logger.error("Failed to encrypt credential", error=str(e))
            raise
    
    def _decrypt_credential(self, encrypted_credential: str) -> str:
        """Decrypt a credential string"""
        try:
            encrypted_bytes = base64.b64decode(encrypted_credential.encode())
            decrypted_bytes = self.cipher_suite.decrypt(encrypted_bytes)
            return decrypted_bytes.decode()
        except Exception as e:
            logger.error("Failed to decrypt credential", error=str(e))
            raise
    
    def _hash_credential(self, credential: str) -> str:
        """Create a hash of credential for verification"""
        return hashlib.sha256(credential.encode()).hexdigest()
    
    async def store_credentials(self, credentials: ExchangeCredentials) -> bool:
        """Store encrypted credentials in database"""
        try:
            # Validate exchange
            if credentials.exchange not in self.supported_exchanges:
                raise ValueError(f"Unsupported exchange: {credentials.exchange}")
            
            # Encrypt credentials
            encrypted_api_key = self._encrypt_credential(credentials.api_key)
            encrypted_secret_key = self._encrypt_credential(credentials.secret_key)
            encrypted_passphrase = None
            if credentials.passphrase:
                encrypted_passphrase = self._encrypt_credential(credentials.passphrase)
            
            # Create credential hash for verification
            credential_hash = self._hash_credential(f"{credentials.api_key}{credentials.secret_key}")
            
            # Store in database
            async with self.db_session() as session:
                query = text("""
                    INSERT INTO exchange_credentials (
                        user_id, exchange, api_key, secret_key, passphrase,
                        sandbox, created_at, last_used, is_active, credential_hash
                    ) VALUES (
                        :user_id, :exchange, :api_key, :secret_key, :passphrase,
                        :sandbox, :created_at, :last_used, :is_active, :credential_hash
                    )
                    ON CONFLICT (user_id, exchange) 
                    DO UPDATE SET
                        api_key = EXCLUDED.api_key,
                        secret_key = EXCLUDED.secret_key,
                        passphrase = EXCLUDED.passphrase,
                        sandbox = EXCLUDED.sandbox,
                        last_used = EXCLUDED.last_used,
                        is_active = EXCLUDED.is_active,
                        credential_hash = EXCLUDED.credential_hash
                """)
                
                await session.execute(query, {
                    "user_id": credentials.user_id,
                    "exchange": credentials.exchange,
                    "api_key": encrypted_api_key,
                    "secret_key": encrypted_secret_key,
                    "passphrase": encrypted_passphrase,
                    "sandbox": credentials.sandbox,
                    "created_at": credentials.created_at or datetime.now(timezone.utc).timestamp(),
                    "last_used": credentials.last_used or 0,
                    "is_active": credentials.is_active,
                    "credential_hash": credential_hash
                })
                
                await session.commit()
            
            # Store in Redis for quick access (encrypted)
            redis_key = f"credentials:{credentials.user_id}:{credentials.exchange}"
            redis_data = {
                "user_id": credentials.user_id,
                "exchange": credentials.exchange,
                "api_key": encrypted_api_key,
                "secret_key": encrypted_secret_key,
                "passphrase": encrypted_passphrase,
                "sandbox": credentials.sandbox,
                "is_active": credentials.is_active,
                "last_used": credentials.last_used or 0
            }
            
            await self.redis.setex(redis_key, 3600, json.dumps(redis_data))  # 1 hour cache
            
            logger.info(f"Stored credentials for {credentials.user_id} on {credentials.exchange}")
            return True
            
        except Exception as e:
            logger.error("Failed to store credentials", error=str(e))
            return False
    
    async def get_credentials(self, user_id: str, exchange: str) -> Optional[ExchangeCredentials]:
        """Get decrypted credentials for a user and exchange"""
        try:
            # Try Redis first
            redis_key = f"credentials:{user_id}:{exchange}"
            redis_data = await self.redis.get(redis_key)
            
            if redis_data:
                data = json.loads(redis_data)
                
                # Decrypt credentials
                api_key = self._decrypt_credential(data["api_key"])
                secret_key = self._decrypt_credential(data["secret_key"])
                passphrase = None
                if data.get("passphrase"):
                    passphrase = self._decrypt_credential(data["passphrase"])
                
                return ExchangeCredentials(
                    user_id=data["user_id"],
                    exchange=data["exchange"],
                    api_key=api_key,
                    secret_key=secret_key,
                    passphrase=passphrase,
                    sandbox=data["sandbox"],
                    created_at=data.get("created_at", 0),
                    last_used=data.get("last_used", 0),
                    is_active=data["is_active"]
                )
            
            # Fallback to database
            async with self.db_session() as session:
                query = text("""
                    SELECT api_key, secret_key, passphrase, sandbox, 
                           created_at, last_used, is_active
                    FROM exchange_credentials 
                    WHERE user_id = :user_id AND exchange = :exchange AND is_active = true
                """)
                
                result = await session.execute(query, {
                    "user_id": user_id,
                    "exchange": exchange
                })
                
                row = result.fetchone()
                if not row:
                    return None
                
                # Decrypt credentials
                api_key = self._decrypt_credential(row[0])
                secret_key = self._decrypt_credential(row[1])
                passphrase = None
                if row[2]:
                    passphrase = self._decrypt_credential(row[2])
                
                credentials = ExchangeCredentials(
                    user_id=user_id,
                    exchange=exchange,
                    api_key=api_key,
                    secret_key=secret_key,
                    passphrase=passphrase,
                    sandbox=row[3],
                    created_at=row[4] or 0,
                    last_used=row[5] or 0,
                    is_active=row[6]
                )
                
                # Update last used timestamp
                await self.update_last_used(user_id, exchange)
                
                return credentials
                
        except Exception as e:
            logger.error("Failed to get credentials", error=str(e))
            return None
    
    async def get_all_credentials(self, user_id: str) -> List[ExchangeCredentials]:
        """Get all credentials for a user"""
        try:
            credentials_list = []
            
            for exchange in self.supported_exchanges:
                creds = await self.get_credentials(user_id, exchange)
                if creds:
                    credentials_list.append(creds)
            
            return credentials_list
            
        except Exception as e:
            logger.error("Failed to get all credentials", error=str(e))
            return []
    
    async def update_last_used(self, user_id: str, exchange: str) -> bool:
        """Update last used timestamp for credentials"""
        try:
            current_time = datetime.now(timezone.utc).timestamp()
            
            # Update database
            async with self.db_session() as session:
                query = text("""
                    UPDATE exchange_credentials 
                    SET last_used = :last_used 
                    WHERE user_id = :user_id AND exchange = :exchange
                """)
                
                await session.execute(query, {
                    "user_id": user_id,
                    "exchange": exchange,
                    "last_used": current_time
                })
                
                await session.commit()
            
            # Update Redis cache
            redis_key = f"credentials:{user_id}:{exchange}"
            redis_data = await self.redis.get(redis_key)
            if redis_data:
                data = json.loads(redis_data)
                data["last_used"] = current_time
                await self.redis.setex(redis_key, 3600, json.dumps(data))
            
            return True
            
        except Exception as e:
            logger.error("Failed to update last used", error=str(e))
            return False
    
    async def deactivate_credentials(self, user_id: str, exchange: str) -> bool:
        """Deactivate credentials for a user and exchange"""
        try:
            # Update database
            async with self.db_session() as session:
                query = text("""
                    UPDATE exchange_credentials 
                    SET is_active = false 
                    WHERE user_id = :user_id AND exchange = :exchange
                """)
                
                await session.execute(query, {
                    "user_id": user_id,
                    "exchange": exchange
                })
                
                await session.commit()
            
            # Remove from Redis cache
            redis_key = f"credentials:{user_id}:{exchange}"
            await self.redis.delete(redis_key)
            
            logger.info(f"Deactivated credentials for {user_id} on {exchange}")
            return True
            
        except Exception as e:
            logger.error("Failed to deactivate credentials", error=str(e))
            return False
    
    async def delete_credentials(self, user_id: str, exchange: str) -> bool:
        """Permanently delete credentials for a user and exchange"""
        try:
            # Delete from database
            async with self.db_session() as session:
                query = text("""
                    DELETE FROM exchange_credentials 
                    WHERE user_id = :user_id AND exchange = :exchange
                """)
                
                await session.execute(query, {
                    "user_id": user_id,
                    "exchange": exchange
                })
                
                await session.commit()
            
            # Remove from Redis cache
            redis_key = f"credentials:{user_id}:{exchange}"
            await self.redis.delete(redis_key)
            
            logger.info(f"Deleted credentials for {user_id} on {exchange}")
            return True
            
        except Exception as e:
            logger.error("Failed to delete credentials", error=str(e))
            return False
    
    async def verify_credentials(self, user_id: str, exchange: str) -> bool:
        """Verify that credentials are valid by making a test API call"""
        try:
            credentials = await self.get_credentials(user_id, exchange)
            if not credentials:
                return False
            
            # Import exchange-specific verification
            if exchange == "binance":
                return await self._verify_binance_credentials(credentials)
            elif exchange == "bybit":
                return await self._verify_bybit_credentials(credentials)
            elif exchange == "kucoin":
                return await self._verify_kucoin_credentials(credentials)
            elif exchange == "coinbase":
                return await self._verify_coinbase_credentials(credentials)
            elif exchange == "kraken":
                return await self._verify_kraken_credentials(credentials)
            elif exchange == "okx":
                return await self._verify_okx_credentials(credentials)
            elif exchange == "gateio":
                return await self._verify_gateio_credentials(credentials)
            elif exchange == "huobi":
                return await self._verify_huobi_credentials(credentials)
            
            return False
            
        except Exception as e:
            logger.error("Failed to verify credentials", error=str(e))
            return False
    
    async def _verify_binance_credentials(self, credentials: ExchangeCredentials) -> bool:
        """Verify Binance credentials"""
        try:
            import ccxt.async_support as ccxt
            
            exchange = ccxt.binance({
                'apiKey': credentials.api_key,
                'secret': credentials.secret_key,
                'sandbox': credentials.sandbox,
                'enableRateLimit': True,
            })
            
            # Test API call
            await exchange.fetch_balance()
            await exchange.close()
            
            return True
            
        except Exception as e:
            logger.error("Binance credential verification failed", error=str(e))
            return False
    
    async def _verify_bybit_credentials(self, credentials: ExchangeCredentials) -> bool:
        """Verify Bybit credentials"""
        try:
            import ccxt.async_support as ccxt
            
            exchange = ccxt.bybit({
                'apiKey': credentials.api_key,
                'secret': credentials.secret_key,
                'sandbox': credentials.sandbox,
                'enableRateLimit': True,
            })
            
            # Test API call
            await exchange.fetch_balance()
            await exchange.close()
            
            return True
            
        except Exception as e:
            logger.error("Bybit credential verification failed", error=str(e))
            return False
    
    async def _verify_kucoin_credentials(self, credentials: ExchangeCredentials) -> bool:
        """Verify KuCoin credentials"""
        try:
            import ccxt.async_support as ccxt
            
            exchange = ccxt.kucoin({
                'apiKey': credentials.api_key,
                'secret': credentials.secret_key,
                'passphrase': credentials.passphrase,
                'sandbox': credentials.sandbox,
                'enableRateLimit': True,
            })
            
            # Test API call
            await exchange.fetch_balance()
            await exchange.close()
            
            return True
            
        except Exception as e:
            logger.error("KuCoin credential verification failed", error=str(e))
            return False
    
    async def _verify_coinbase_credentials(self, credentials: ExchangeCredentials) -> bool:
        """Verify Coinbase credentials"""
        try:
            import ccxt.async_support as ccxt
            
            exchange = ccxt.coinbasepro({
                'apiKey': credentials.api_key,
                'secret': credentials.secret_key,
                'passphrase': credentials.passphrase,
                'sandbox': credentials.sandbox,
                'enableRateLimit': True,
            })
            
            # Test API call
            await exchange.fetch_balance()
            await exchange.close()
            
            return True
            
        except Exception as e:
            logger.error("Coinbase credential verification failed", error=str(e))
            return False
    
    async def _verify_kraken_credentials(self, credentials: ExchangeCredentials) -> bool:
        """Verify Kraken credentials"""
        try:
            import ccxt.async_support as ccxt
            
            exchange = ccxt.kraken({
                'apiKey': credentials.api_key,
                'secret': credentials.secret_key,
                'sandbox': credentials.sandbox,
                'enableRateLimit': True,
            })
            
            # Test API call
            await exchange.fetch_balance()
            await exchange.close()
            
            return True
            
        except Exception as e:
            logger.error("Kraken credential verification failed", error=str(e))
            return False
    
    async def _verify_okx_credentials(self, credentials: ExchangeCredentials) -> bool:
        """Verify OKX credentials"""
        try:
            import ccxt.async_support as ccxt
            
            exchange = ccxt.okx({
                'apiKey': credentials.api_key,
                'secret': credentials.secret_key,
                'passphrase': credentials.passphrase,
                'sandbox': credentials.sandbox,
                'enableRateLimit': True,
            })
            
            # Test API call
            await exchange.fetch_balance()
            await exchange.close()
            
            return True
            
        except Exception as e:
            logger.error("OKX credential verification failed", error=str(e))
            return False
    
    async def _verify_gateio_credentials(self, credentials: ExchangeCredentials) -> bool:
        """Verify Gate.io credentials"""
        try:
            import ccxt.async_support as ccxt
            
            exchange = ccxt.gateio({
                'apiKey': credentials.api_key,
                'secret': credentials.secret_key,
                'sandbox': credentials.sandbox,
                'enableRateLimit': True,
            })
            
            # Test API call
            await exchange.fetch_balance()
            await exchange.close()
            
            return True
            
        except Exception as e:
            logger.error("Gate.io credential verification failed", error=str(e))
            return False
    
    async def _verify_huobi_credentials(self, credentials: ExchangeCredentials) -> bool:
        """Verify Huobi credentials"""
        try:
            import ccxt.async_support as ccxt
            
            exchange = ccxt.huobi({
                'apiKey': credentials.api_key,
                'secret': credentials.secret_key,
                'sandbox': credentials.sandbox,
                'enableRateLimit': True,
            })
            
            # Test API call
            await exchange.fetch_balance()
            await exchange.close()
            
            return True
            
        except Exception as e:
            logger.error("Huobi credential verification failed", error=str(e))
            return False
    
    async def close(self):
        """Close database connection"""
        if self.db_engine:
            await self.db_engine.dispose()
        if self.redis:
            await self.redis.close()

# Global instance
credential_manager = SecureCredentialManager()

