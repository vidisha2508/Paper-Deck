# Research RAG Backend (Groq & Gemini-powered)

Implements the architecture:

```
User Query / Paper Upload
        |
Paper Retrieval Layer (arXiv + Semantic Scholar)
        |
PDF Processing
        |
Chunking
        |
Embeddings (Gemini text-embedding-004)
        |
ChromaDB Vector Store
        |
RAG Engine
        |
LLM (Groq llama-3.3-70b-versatile)
        |
 Summaries | Gap Finder | Project Ideas
        |
   Research Insights
```

## Setup

```bash
cd research-rag-backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then fill in GROQ_API_KEY and GEMINI_API_KEY
```

Get a Groq API key from https://console.groq.com/keys and a Gemini API key (for embeddings) from https://aistudio.google.com/apikey.

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

Interactive docs at `http://localhost:8000/docs`.

## Typical flow

1. **Search papers** (no indexing yet):
   `POST /papers/search {"query": "retrieval augmented generation"}`

2. **Ingest from a query** (search → PDF → chunk → embed → store, all in one call):
   `POST /ingest/query {"query": "retrieval augmented generation", "max_papers": 8}`

3. **Or upload your own PDF**:
   `POST /ingest/upload` (multipart form: `file`, `title`, optional `authors`, `year`)

4. **Ask grounded questions**:
   `POST /query {"query": "What are the main limitations of RAG systems?"}`

5. **Generate downstream insights** (same topic each time so retrieval hits the same indexed papers):
   - `POST /insights/summary {"topic": "RAG limitations"}`
   - `POST /insights/gaps {"topic": "RAG limitations"}`
   - `POST /insights/ideas {"topic": "RAG limitations"}`
   - `POST /insights/research {"topic": "RAG limitations"}` — combines all three into one report

## Notes / things to configure for production

- **Persistence**: ChromaDB and downloaded PDFs are stored under `./data` by default (`CHROMA_PERSIST_DIR`, `PDF_DOWNLOAD_DIR`). Mount a volume there in Docker/production.
- **Rate limits**: Semantic Scholar's public API is rate-limited without a key — get one at https://www.semanticscholar.org/product/api if you'll ingest heavily.
- **Model choice**: `GEMINI_LLM_MODEL` and `GEMINI_EMBEDDING_MODEL` are env-configurable in `.env` — swap in whichever current Gemini models fit your latency/cost/quality needs.
- **Concurrency**: `ingest_from_query` bounds concurrent PDF downloads/embeddings to 4 at a time to stay polite to upstream APIs; tune the `Semaphore` in `app/ingestion.py` if needed.
- **Auth**: there's no auth layer here — add an API-key or OAuth dependency in `app/main.py` before exposing this publicly.
