"""
Ingestion Pipeline
Orchestrates the top half of the architecture diagram:
  User Query -> Paper Retrieval Layer -> PDF Processing -> Chunking
  -> Embeddings -> ChromaDB Vector Store
"""
import asyncio

from app.retrieval import search_papers, Paper
from app.pdf_processor import process_paper_pdf
from app.chunking import chunk_text
from app.vector_store import upsert_chunks, paper_already_indexed


async def ingest_paper(paper: Paper, force: bool = False) -> dict:
    """Ingests a single paper: PDF -> text -> chunks -> embeddings -> Chroma."""
    if not force and paper_already_indexed(paper.paper_id):
        return {"paper_id": paper.paper_id, "status": "already_indexed", "chunks": 0}

    text = await process_paper_pdf(paper.paper_id, paper.pdf_url) if paper.pdf_url else ""
    # Fall back to abstract if full text isn't available (e.g. no open-access PDF)
    if not text:
        text = paper.abstract
    if not text:
        return {"paper_id": paper.paper_id, "status": "no_content", "chunks": 0}

    chunks = chunk_text(paper.paper_id, text)
    metadata = {
        "title": paper.title,
        "source": paper.source,
        "year": paper.year if paper.year is not None else 0,
        "external_url": paper.external_url or "",
        "authors": ", ".join(paper.authors) if paper.authors else "",
    }
    count = await upsert_chunks(chunks, metadata)
    return {"paper_id": paper.paper_id, "status": "indexed", "chunks": count}


async def ingest_from_query(query: str, sources: list[str] = None, max_papers: int = 10) -> dict:
    """
    Full pipeline entry point matching the diagram: given a user query,
    search for papers, then ingest each one (bounded concurrency).
    """
    papers = await search_papers(query, sources=sources)
    papers = papers[:max_papers]

    semaphore = asyncio.Semaphore(4)

    async def _bounded(p: Paper):
        async with semaphore:
            return await ingest_paper(p)

    results = await asyncio.gather(*[_bounded(p) for p in papers])
    return {
        "query": query,
        "papers_found": len(papers),
        "results": results,
        "papers": [p.to_dict() for p in papers],
    }
