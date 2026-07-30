"""
RAG Engine
Retrieves relevant chunks from the vector store for a user query and
asks the LLM (Groq) to answer strictly grounded in that context, with structured JSON output.
"""
from dataclasses import dataclass
import json

from app.vector_store import query_similar
from app.llm import generate

SYSTEM_INSTRUCTION = (
    "You are a research assistant answering questions using strictly the provided paper excerpts. "
    "Return ONLY a single valid JSON object. Do not include markdown code block formatting, "
    "no explanations, no text outside the JSON object."
)


@dataclass
class RAGResult:
    answer: dict
    sources: list[dict]


def _build_context_block(hits: list[dict], max_chars: int = 3500) -> tuple[str, list[dict]]:
    lines = []
    sources = []
    seen_paper_ids = set()
    total_len = 0

    for i, hit in enumerate(hits, start=1):
        meta = hit["metadata"]
        title = meta.get("title", "Unknown title")
        paper_id = meta.get("paper_id")
        text = hit["text"]

        if total_len + len(text) > max_chars:
            text = text[: max(0, max_chars - total_len)] + "..."
        entry = f"[{i}] ({title})\n{text}"
        lines.append(entry)

        # Collapse sources to one entry per unique paper_id, preserving order of first appearance
        if paper_id and paper_id not in seen_paper_ids:
            seen_paper_ids.add(paper_id)
            sources.append({
                "index": len(sources) + 1,
                "paper_id": paper_id,
                "title": title,
                "source": meta.get("source"),
                "external_url": meta.get("external_url"),
                "year": meta.get("year"),
            })

        total_len += len(entry)
        if total_len >= max_chars:
            break

    return "\n\n---\n\n".join(lines), sources


def _parse_rag_json(raw_text: str) -> dict | None:
    if not raw_text:
        return None
    try:
        cleaned = raw_text.strip()
        if cleaned.startswith("```"):
            parts = cleaned.split("```")
            if len(parts) >= 2:
                cleaned = parts[1]
                if cleaned.startswith("json"):
                    cleaned = cleaned[4:]
        cleaned = cleaned.strip()
        parsed = json.loads(cleaned)
        if isinstance(parsed, dict) and "direct_answer" in parsed:
            return {
                "direct_answer": str(parsed.get("direct_answer", "")),
                "key_points": list(parsed.get("key_points", [])) if isinstance(parsed.get("key_points"), list) else [],
                "trade_offs": list(parsed.get("trade_offs", [])) if isinstance(parsed.get("trade_offs"), list) else [],
                "confidence": str(parsed.get("confidence", "Medium")),
                "citations_used": list(parsed.get("citations_used", [])) if isinstance(parsed.get("citations_used"), list) else [],
            }
    except Exception:
        pass
    return None


async def answer_query(query: str, top_k: int = None, where: dict = None) -> RAGResult:
    hits = await query_similar(query, top_k=top_k, where=where)
    if not hits:
        fallback_answer = {
            "direct_answer": "No indexed content matches this query yet. Try ingesting some papers first.",
            "key_points": [],
            "trade_offs": [],
            "confidence": "Low",
            "citations_used": [],
        }
        return RAGResult(answer=fallback_answer, sources=[])

    context_block, sources = _build_context_block(hits)
    prompt = (
        f"Question: {query}\n\n"
        f"Paper excerpts:\n\n{context_block}\n\n"
        "Return ONLY a JSON object matching this exact schema:\n"
        "{\n"
        '  "direct_answer": "",\n'
        '  "key_points": ["", ""],\n'
        '  "trade_offs": [],\n'
        '  "confidence": "High",\n'
        '  "citations_used": [1]\n'
        "}\n\n"
        "Rules:\n"
        "- direct_answer: one sentence, maximum 30 words, answers the question directly.\n"
        "- key_points: 2-5 bullet points, each maximum 20 words, distinct facts/findings from the excerpts.\n"
        "- trade_offs: 0-3 bullet points, maximum 20 words each. Return [] if no trade-offs apply.\n"
        "- confidence: exactly one of 'High', 'Medium', or 'Low' based on context sufficiency.\n"
        "- citations_used: array of integer excerpt numbers (e.g. [1, 2]) referenced in your analysis.\n"
        "- No introductions, no conclusions, no markdown formatting, no text outside the JSON object."
    )

    answer_raw = await generate(prompt, system_instruction=SYSTEM_INSTRUCTION, temperature=0.3)
    parsed = _parse_rag_json(answer_raw)

    if parsed is None:
        # Retry once with a stricter reminder
        strict_prompt = prompt + "\n\nCRITICAL REMINDER: Output ONLY valid raw JSON."
        answer_raw_retry = await generate(strict_prompt, system_instruction=SYSTEM_INSTRUCTION, temperature=0.2)
        parsed = _parse_rag_json(answer_raw_retry)

    if parsed is None:
        # Fallback if JSON parsing failed
        parsed = {
            "direct_answer": answer_raw.strip() if answer_raw else "No structured answer generated.",
            "key_points": [],
            "trade_offs": [],
            "confidence": "Low",
            "citations_used": [],
        }

    return RAGResult(answer=parsed, sources=sources)

