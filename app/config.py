"""
Central configuration for the Research RAG backend.
All values can be overridden via environment variables (see .env.example).
"""
import os
from dataclasses import dataclass, field
from dotenv import load_dotenv

load_dotenv()


@dataclass
class Settings:
    # --- Groq / Gemini API ---
    groq_api_key: str = os.getenv("GROQ_API_KEY", "")
    groq_llm_model: str = os.getenv("GROQ_LLM_MODEL", "llama-3.1-8b-instant")
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    gemini_llm_model: str = os.getenv("GEMINI_LLM_MODEL", "gemini-2.5-flash")
    gemini_embedding_model: str = os.getenv("GEMINI_EMBEDDING_MODEL", "models/text-embedding-004")
    embedding_output_dim: int = int(os.getenv("EMBEDDING_OUTPUT_DIM", "768"))

    # --- Paper retrieval ---
    arxiv_max_results: int = int(os.getenv("ARXIV_MAX_RESULTS", "10"))
    semantic_scholar_max_results: int = int(os.getenv("SEMANTIC_SCHOLAR_MAX_RESULTS", "10"))
    semantic_scholar_api_key: str = os.getenv("SEMANTIC_SCHOLAR_API_KEY", "")  # optional, raises rate limit

    # --- PDF processing / chunking ---
    pdf_download_dir: str = os.getenv("PDF_DOWNLOAD_DIR", "./data/pdfs")
    chunk_size_tokens: int = int(os.getenv("CHUNK_SIZE_TOKENS", "800"))
    chunk_overlap_tokens: int = int(os.getenv("CHUNK_OVERLAP_TOKENS", "120"))

    # --- Vector store ---
    chroma_persist_dir: str = os.getenv("CHROMA_PERSIST_DIR", "./data/chroma")
    chroma_collection_name: str = os.getenv("CHROMA_COLLECTION_NAME", "papers")

    # --- RAG ---
    rag_top_k: int = int(os.getenv("RAG_TOP_K", "8"))

    # --- Server ---
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "8000"))
    cors_origins: list = field(default_factory=lambda: os.getenv("CORS_ORIGINS", "*").split(","))


settings = Settings()
