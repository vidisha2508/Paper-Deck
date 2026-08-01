# PaperDeck

> I turn research papers into research opportunities.

PaperDeck is an AI-powered research intelligence platform that helps students, researchers, innovators, and builders move beyond simply reading papers. Instead of spending hours navigating dense academic literature, PaperDeck transforms research into actionable insights, identifies hidden opportunities, and helps users discover what to build next.

---

## Why PaperDeck?

Research papers often answer one question while creating ten new ones.

PaperDeck helps you:

- Extract key findings instantly
- Identify research gaps
- Discover novel research directions
- Explore citation relationships
- Understand how a field evolved over time
- Generate structured research notes
- Expand ideas into complete research roadmaps

---

## Features

### Paper Analysis

Upload a research paper or search a research topic.

PaperDeck automatically generates:

- Research Summary
- Key Findings
- Research Gaps
- Future Directions
- Novel Research Opportunities

---

### Infinite Research Tree

Every generated idea can be expanded infinitely.

```text
Research Gap
│
├── Idea A
│   ├── A1
│   │   ├── A1a
│   │   ├── A1b
│   │   └── ...
│   └── ...
│
├── Idea B
├── Idea C
└── Idea D
```

Generate deeper and more specific research directions with every click.

---

### Citation Network Visualization

Visualize relationships between papers through an interactive citation graph.

Features:

- Citation Links
- Influential Papers
- Related Research
- Knowledge Flow Visualization

---

### Research Evolution Timeline

Understand how a research field evolved over time.

The timeline highlights:

- Major Breakthroughs
- Methodology Shifts
- Emerging Trends
- Research Milestones

Click any year to explore:

- Authors
- Contributions
- Technologies Used
- Limitations
- Future Scope

---

### AI Research Notes

Generate a complete research notebook with one click.

Features:

- AI-Generated Notes
- Automatic Refinement
- Edit Mode
- Auto Save
- Copy to Clipboard
- Export as PDF

PaperDeck automatically structures information using the most suitable note-taking methodologies for learning, revision, and future research.

---

### Novelty Scoring

Evaluate how unique and promising a research direction is.

PaperDeck scores ideas based on:

- Research Saturation
- Gap Uniqueness
- Innovation Potential
- Future Impact

---

## Tech Stack

### Frontend

- React
- TypeScript
- Tailwind CSS
- Framer Motion

### Backend

- Node.js
- Express

### AI

- Gemini API

### Visualization

- React Flow
- Interactive Timeline Components

---

## User Experience

PaperDeck opens with an animated origami crane that unfolds into a sheet of paper carrying a simple message:

> Every paper begins with a question.

The paper dissolves, revealing the research workspace.

---

## Vision

Research should not stop at understanding what already exists.

PaperDeck helps researchers discover:

- What has been done
- What is missing
- What should be built next

We believe the future of research lies not in reading more papers, but in uncovering better questions.

---

## Team

- Vidisha Jain
- Muskan
- Khushi
- Ananya Pathak
- Ojas Omprakash Karole

---

## Note

PaperDeck may occasionally become overly ambitious and attempt to generate an entire research roadmap from a single paper.

We consider that a feature.

---

## Tagline

**From Papers to Possibilities.**

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
