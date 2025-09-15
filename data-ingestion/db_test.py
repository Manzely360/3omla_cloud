import asyncio, os
import asyncpg
async def main():
    dsn=os.getenv('DATABASE_URL')
    print('DB URL:', dsn)
    conn=await asyncpg.connect(dsn)
    row=await conn.fetchrow('SELECT 1 as x')
    print('DB ok', row)
    await conn.close()
asyncio.run(main())
