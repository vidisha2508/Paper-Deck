"""
Embeddings
Wraps Gemini's embedding model (text-embedding-004 by default) for both
document chunks (task_type=RETRIEVAL_DOCUMENT) and queries
(task_type=RETRIEVAL_QUERY), which Gemini recommends distinguishing for
best retrieval quality.
"""
import asyncio
from google import genai
from google.genai import types

from app.config import settings

_client = None


def get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.gemini_api_key)
    return _client


import time
from google.genai.errors import APIError


def _embed_sync(texts: list[str], task_type: str) -> list[list[float]]:
    client = get_client()
    for attempt in range(5):
        try:
            result = client.models.embed_content(
                model=settings.gemini_embedding_model,
                contents=texts,
                config=types.EmbedContentConfig(
                    task_type=task_type,
                    output_dimensionality=settings.embedding_output_dim,
                ),
            )
            return [e.values for e in result.embeddings]
        except APIError as e:
            if ("429" in str(e) or "RESOURCE_EXHAUSTED" in str(e) or "503" in str(e) or "UNAVAILABLE" in str(e)) and attempt < 4:
                time.sleep(15 * (attempt + 1))
            else:
                raise
    return []


async def embed_documents(texts: list[str]) -> list[list[float]]:
    """Embed a batch of document chunks."""
    if not texts:
        return []
    return await asyncio.to_thread(_embed_sync, texts, "RETRIEVAL_DOCUMENT")


async def embed_query(text: str) -> list[float]:
    """Embed a single search query."""
    vectors = await asyncio.to_thread(_embed_sync, [text], "RETRIEVAL_QUERY")
    return vectors[0]
