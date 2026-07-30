"""
Chunking
Splits long document text into overlapping chunks sized in (approximate)
tokens, using a simple whitespace-based tokenizer to avoid a heavy
tokenizer dependency. Good enough for chunk-boundary purposes.
"""
from dataclasses import dataclass

from app.config import settings


@dataclass
class Chunk:
    chunk_id: str
    paper_id: str
    text: str
    chunk_index: int


def _split_into_words(text: str) -> list[str]:
    return text.split()


def chunk_text(paper_id: str, text: str,
               chunk_size: int = None, overlap: int = None) -> list[Chunk]:
    chunk_size = chunk_size or settings.chunk_size_tokens
    overlap = overlap or settings.chunk_overlap_tokens

    words = _split_into_words(text)
    if not words:
        return []

    chunks = []
    start = 0
    idx = 0
    step = max(chunk_size - overlap, 1)

    while start < len(words):
        end = min(start + chunk_size, len(words))
        chunk_words = words[start:end]
        chunk_str = " ".join(chunk_words)
        chunks.append(Chunk(
            chunk_id=f"{paper_id}::chunk{idx}",
            paper_id=paper_id,
            text=chunk_str,
            chunk_index=idx,
        ))
        idx += 1
        if end == len(words):
            break
        start += step

    return chunks
