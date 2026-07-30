"""
LLM wrapper (Groq generation with Gemini fallback).
All prompting for summaries / gap-finding / project ideas / insight
synthesis routes through `generate`, so model choice/config lives in one place.
"""
import asyncio
import logging
import time
import httpx

from app.config import settings

logger = logging.getLogger(__name__)

GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"


_groq_semaphore = None


def _get_semaphore() -> asyncio.Semaphore:
    global _groq_semaphore
    if _groq_semaphore is None:
        _groq_semaphore = asyncio.Semaphore(1)
    return _groq_semaphore


async def generate(prompt: str, system_instruction: str = None, temperature: float = 0.4) -> str:
    """Generate text completion using Groq LLM (or fallback to Gemini)."""
    api_key = settings.groq_api_key
    if api_key:
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": settings.groq_llm_model,
            "messages": messages,
            "temperature": temperature,
        }

        semaphore = _get_semaphore()
        async with semaphore:
            async with httpx.AsyncClient(timeout=60.0) as client:
                for attempt in range(6):
                    try:
                        response = await client.post(GROQ_ENDPOINT, headers=headers, json=payload)
                        if response.status_code == 200:
                            data = response.json()
                            return data["choices"][0]["message"]["content"] or ""
                        elif response.status_code in (429, 500, 503) and attempt < 5:
                            retry_after = response.headers.get("retry-after")
                            if retry_after:
                                try:
                                    val = float(retry_after)
                                    wait_time = min(val, 15.0) + 0.5
                                except ValueError:
                                    wait_time = (2 ** attempt) + 1.0
                            else:
                                wait_time = (2 ** attempt) + 1.0
                            logger.warning(
                                f"Groq API status {response.status_code} ({response.text[:200]}), waiting {wait_time:.1f}s (attempt {attempt+1}/6)..."
                            )
                            await asyncio.sleep(wait_time)
                        else:
                            response.raise_for_status()
                    except Exception as e:
                        if attempt < 5:
                            await asyncio.sleep((2 ** attempt) + 1.0)
                        else:
                            logger.error(f"Groq API error: {e}")
                            break
        return ""

    # Fallback to Gemini if Groq API key is not set
    try:
        from app.embeddings import get_client
        from google.genai import types

        client = get_client()
        config = types.GenerateContentConfig(
            temperature=temperature,
            system_instruction=system_instruction,
        )

        def _generate_gemini_sync():
            try:
                response = client.models.generate_content(
                    model=settings.gemini_llm_model,
                    contents=prompt,
                    config=config,
                )
                return response.text or ""
            except Exception as e:
                logger.error(f"Gemini LLM error: {e}")
                return ""

        return await asyncio.to_thread(_generate_gemini_sync)
    except Exception as e:
        logger.error(f"LLM fallback error: {e}")
        return ""

