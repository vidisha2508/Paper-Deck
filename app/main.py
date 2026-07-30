"""
FastAPI app wiring together the full architecture:

  User Query / Paper Upload
        |
  Paper Retrieval Layer (arXiv + Semantic Scholar)
        |
  PDF Processing -> Chunking -> Embeddings (Gemini) -> ChromaDB Vector Store
        |
  RAG Engine -> LLM (Groq)
        |
  Summaries | Gap Finder | Project Ideas -> Research Insights
"""
import shutil
import tempfile
from typing import Optional

import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.config import settings
from app.retrieval import search_papers, Paper
from app.ingestion import ingest_from_query, ingest_paper
from app.pdf_processor import extract_text
from app.chunking import chunk_text
from app.vector_store import upsert_chunks
from app.rag_engine import answer_query
from app.insights import (
    summarize_topic,
    find_gaps,
    generate_project_ideas,
    generate_research_insights,
    extract_key_findings,
    calculate_novelty_score,
    expand_research_idea,
    generate_research_evolution_timeline,
)
from app.citation_network import generate_citation_network

app = FastAPI(
    title="Research RAG Backend",
    description="arXiv/Semantic Scholar retrieval + Groq-powered RAG for research insights",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")


# ---------- Request / response models ----------

class SearchRequest(BaseModel):
    query: str
    sources: Optional[list[str]] = None  # ["arxiv", "semantic_scholar"]


class IngestRequest(BaseModel):
    query: str
    sources: Optional[list[str]] = None
    max_papers: int = 10


class QueryRequest(BaseModel):
    query: str
    top_k: Optional[int] = None


class TopicRequest(BaseModel):
    topic: str
    top_k: Optional[int] = None


class ExpandIdeaRequest(BaseModel):
    idea: str
    lineage: Optional[list[str]] = None
    depth: Optional[int] = 1
    top_k: Optional[int] = None


class CitationNetworkRequest(BaseModel):
    topic: Optional[str] = None
    paper_ids: Optional[list[str]] = None


# ---------- Root & Health ----------

@app.get("/")
async def root():
    index_path = os.path.join(os.path.dirname(__file__), "static", "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "PaperDeck Backend API is running."}


@app.get("/health")
async def health():
    return {"status": "ok"}


# ---------- Paper Retrieval Layer ----------

@app.post("/papers/search")
async def papers_search(req: SearchRequest):
    """Search arXiv + Semantic Scholar without ingesting anything yet."""
    papers = await search_papers(req.query, sources=req.sources)
    return {"count": len(papers), "papers": [p.to_dict() for p in papers]}


# ---------- Full ingestion pipeline (Retrieval -> PDF -> Chunking -> Embeddings -> Vector Store) ----------

@app.post("/ingest/query")
async def ingest_query(req: IngestRequest):
    """
    Given a user query, search for relevant papers and run each through
    PDF processing -> chunking -> embedding -> ChromaDB storage.
    """
    result = await ingest_from_query(req.query, sources=req.sources, max_papers=req.max_papers)
    return result


@app.post("/ingest/upload")
async def ingest_upload(
    file: UploadFile = File(...),
    title: str = Form(...),
    paper_id: Optional[str] = Form(None),
    year: Optional[int] = Form(None),
    authors: Optional[str] = Form(None),
):
    """
    Ingest a user-uploaded PDF directly (the 'Paper Upload' path in the
    architecture diagram), bypassing paper retrieval.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF uploads are supported.")

    paper_id = paper_id or f"upload:{file.filename}"

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    text = extract_text(tmp_path)
    if not text:
        raise HTTPException(422, "Could not extract text from the uploaded PDF.")

    chunks = chunk_text(paper_id, text)
    metadata = {
        "title": title,
        "source": "upload",
        "year": year or 0,
        "external_url": "",
        "authors": authors or "",
    }
    count = await upsert_chunks(chunks, metadata)
    return {"paper_id": paper_id, "status": "indexed", "chunks": count}


@app.post("/ingest/paper")
async def ingest_single_paper(paper: dict):
    """Ingest a single paper dict (as returned by /papers/search)."""
    p = Paper(**paper)
    result = await ingest_paper(p)
    return result


# ---------- RAG Engine ----------

@app.post("/query")
async def query(req: QueryRequest):
    """Ask a question answered strictly from indexed paper content."""
    result = await answer_query(req.query, top_k=req.top_k)
    return {"answer": result.answer, "sources": result.sources}


# ---------- Downstream insight generators ----------

@app.post("/insights/summary")
async def insights_summary(req: TopicRequest):
    return await summarize_topic(req.topic, top_k=req.top_k or 6)


@app.post("/insights/gaps")
async def insights_gaps(req: TopicRequest):
    return await find_gaps(req.topic, top_k=req.top_k or 6)


@app.post("/insights/ideas")
async def insights_ideas(req: TopicRequest):
    return await generate_project_ideas(req.topic, top_k=req.top_k or 6)


@app.post("/insights/ideas/expand")
async def insights_ideas_expand(req: ExpandIdeaRequest):
    return await expand_research_idea(req.idea, lineage=req.lineage, depth=req.depth or 1, top_k=req.top_k or 6)


@app.post("/insights/findings")
async def insights_findings(req: TopicRequest):
    return await extract_key_findings(req.topic, top_k=req.top_k or 6)


@app.post("/insights/novelty")
async def insights_novelty(req: TopicRequest):
    return await calculate_novelty_score(req.topic, top_k=req.top_k or 6)


@app.post("/insights/research")
async def insights_research(req: TopicRequest):
    """The final 'Research Insights' node: synthesizes summary + gaps + ideas."""
    return await generate_research_insights(req.topic, top_k=req.top_k or 6)


@app.post("/insights/timeline")
async def insights_timeline(req: TopicRequest):
    """Generates the Research Evolution Timeline for a given topic."""
    return await generate_research_evolution_timeline(req.topic, top_k=req.top_k or 8)


@app.get("/papers/citation-network")
@app.post("/papers/citation-network")
@app.post("/insights/citation-network")
async def citation_network_endpoint(req: Optional[CitationNetworkRequest] = None, topic: Optional[str] = None):
    t = (req.topic if req and req.topic else topic) or ""
    p_ids = req.paper_ids if req else None
    return await generate_citation_network(topic=t, paper_ids=p_ids)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=True)
