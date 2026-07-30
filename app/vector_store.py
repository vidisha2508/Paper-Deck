"""
ChromaDB Vector Store
Thin wrapper around a persistent Chroma collection. Embeddings are
computed externally (via app.embeddings, Gemini) and passed in directly,
so Chroma is used purely as a vector index + metadata store.
"""
import chromadb

from app.config import settings
from app.chunking import Chunk
from app.embeddings import embed_documents, embed_query

_client = None
_collection = None


def get_collection():
    global _client, _collection
    if _collection is None:
        _client = chromadb.PersistentClient(path=settings.chroma_persist_dir)
        _collection = _client.get_or_create_collection(
            name=settings.chroma_collection_name,
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


async def upsert_chunks(chunks: list[Chunk], paper_metadata: dict) -> int:
    """
    Embeds and stores a list of chunks. `paper_metadata` is merged into
    every chunk's metadata (title, source, year, url, etc).
    Returns the number of chunks stored.
    """
    if not chunks:
        return 0

    collection = get_collection()
    texts = [c.text for c in chunks]
    vectors = await embed_documents(texts)

    ids = [c.chunk_id for c in chunks]
    metadatas = [
        {
            "paper_id": c.paper_id,
            "chunk_index": c.chunk_index,
            **paper_metadata,
        }
        for c in chunks
    ]

    collection.upsert(ids=ids, embeddings=vectors, documents=texts, metadatas=metadatas)
    return len(chunks)


async def query_similar(query: str, top_k: int = None, where: dict = None) -> list[dict]:
    """Returns top_k most similar chunks to the query, prioritizing diversity across distinct papers."""
    top_k = top_k or settings.rag_top_k
    collection = get_collection()
    query_vector = await embed_query(query)

    # Fetch a wider candidate set to ensure chunks from multiple distinct papers are retrieved
    fetch_k = min(max(top_k * 3, 20), 50)
    results = collection.query(
        query_embeddings=[query_vector],
        n_results=fetch_k,
        where=where,
    )

    docs = results.get("documents", [[]])[0]
    metas = results.get("metadatas", [[]])[0]
    dists = results.get("distances", [[]])[0]
    ids = results.get("ids", [[]])[0]

    all_hits = []
    for doc, meta, dist, _id in zip(docs, metas, dists, ids):
        all_hits.append({"id": _id, "text": doc, "metadata": meta, "distance": dist})

    # First pass: collect up to 2 top chunks per paper to guarantee paper diversity
    hits = []
    paper_counts = {}
    for hit in all_hits:
        pid = hit["metadata"].get("paper_id", "unknown")
        if paper_counts.get(pid, 0) < 2 and len(hits) < top_k:
            hits.append(hit)
            paper_counts[pid] = paper_counts.get(pid, 0) + 1

    # Second pass: fill remaining top_k slots if available
    if len(hits) < top_k:
        seen_ids = {h["id"] for h in hits}
        for hit in all_hits:
            if hit["id"] not in seen_ids and len(hits) < top_k:
                hits.append(hit)

    return hits


def paper_already_indexed(paper_id: str) -> bool:
    collection = get_collection()
    existing = collection.get(where={"paper_id": paper_id}, limit=1)
    return len(existing.get("ids", [])) > 0


def delete_paper(paper_id: str) -> None:
    collection = get_collection()
    collection.delete(where={"paper_id": paper_id})
