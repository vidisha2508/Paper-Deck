"""
LLM wrapper (Groq generation with fast Gemini fallback).
All prompting for summaries / gap-finding / project ideas / insight
synthesis routes through `generate`, so model choice/config lives in one place.
"""
import asyncio
import logging
import httpx

from app.config import settings

logger = logging.getLogger(__name__)

GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"

_groq_semaphore = None


def _get_semaphore() -> asyncio.Semaphore:
    global _groq_semaphore
    if _groq_semaphore is None:
        _groq_semaphore = asyncio.Semaphore(3)
    return _groq_semaphore


async def generate(prompt: str, system_instruction: str = None, temperature: float = 0.4) -> str:
    """Generate text completion using Groq LLM with fast fallback to Gemini."""
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
        try:
            async with semaphore:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    for attempt in range(2):
                        try:
                            response = await client.post(GROQ_ENDPOINT, headers=headers, json=payload)
                            if response.status_code == 200:
                                data = response.json()
                                res_text = data["choices"][0]["message"]["content"] or ""
                                if res_text:
                                    return res_text
                            elif response.status_code == 429:
                                logger.warning(f"Groq API 429 Rate Limit (attempt {attempt+1}/2). Falling back fast.")
                                await asyncio.sleep(1.0)
                            else:
                                logger.warning(f"Groq API status {response.status_code}")
                                break
                        except Exception as err:
                            logger.warning(f"Groq request error: {err}")
                            break
        except Exception as e:
            logger.error(f"Groq Execution Exception: {e}")

    # Fallback to Gemini if Groq fails or API key is not set
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

        gemini_result = await asyncio.to_thread(_generate_gemini_sync)
        if gemini_result:
            return gemini_result
    except Exception as e:
        logger.error(f"LLM fallback error: {e}")

    return ""
