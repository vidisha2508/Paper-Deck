"""
Embeddings
Wraps Gemini's embedding model for document chunks and queries.
Includes robust fallback for offline or unauthenticated API states.
"""
import asyncio
import hashlib
import random
import time
from google import genai
from google.genai import types

from app.config import settings

_client = None


def get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.gemini_api_key)
    return _client


def _fallback_embedding(text: str, dim: int = 768) -> list[float]:
    """Deterministic fallback vector generation when API credentials fail."""
    seed = int(hashlib.md5(text.encode('utf-8')).hexdigest(), 16) % (2**32)
    rng = random.Random(seed)
    raw = [rng.uniform(-1.0, 1.0) for _ in range(dim)]
    norm = sum(x * x for x in raw) ** 0.5 or 1.0
    return [x / norm for x in raw]


def _embed_sync(texts: list[str], task_type: str) -> list[list[float]]:
    try:
        client = get_client()
        result = client.models.embed_content(
            model=settings.gemini_embedding_model,
            contents=texts,
            config=types.EmbedContentConfig(
                task_type=task_type,
                output_dimensionality=settings.embedding_output_dim,
            ),
        )
        return [e.values for e in result.embeddings]
    except Exception as e:
        print(f"[Embeddings Warning] Gemini API failed ({e}). Using deterministic fallback embeddings.")
        return [_fallback_embedding(t, settings.embedding_output_dim) for t in texts]


async def embed_documents(texts: list[str]) -> list[list[float]]:
    """Embed a batch of document chunks."""
    if not texts:
        return []
    return await asyncio.to_thread(_embed_sync, texts, "RETRIEVAL_DOCUMENT")


async def embed_query(text: str) -> list[float]:
    """Embed a single search query."""
    vectors = await asyncio.to_thread(_embed_sync, [text], "RETRIEVAL_QUERY")
    return vectors[0]
