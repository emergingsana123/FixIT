import asyncio
from dedalus_labs import AsyncDedalus, DedalusRunner
from dotenv import load_dotenv

load_dotenv()

async def main():
    client = AsyncDedalus()
    runner = DedalusRunner(client)
    
    result = await runner.run(
        input="What is 2+2?",
        model="openai/gpt-4"
    )
    print(f"✓ Dedalus working: {result.final_output}")

if __name__ == "__main__":
    asyncio.run(main())
