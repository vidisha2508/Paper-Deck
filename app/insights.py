"""
Insight generators, built on top of the RAG engine's retrieved context:
 - Summaries: per-paper or per-topic summary
 - Gap Finder: identifies under-explored areas / contradictions across papers
 - Project Ideas: concrete, actionable research/project ideas
 - Research Insights: a synthesized narrative combining the above
"""
from app.vector_store import query_similar
from app.rag_engine import _build_context_block
from app.llm import generate
import json


async def summarize_topic(topic: str, top_k: int = 6) -> dict:
    hits = await query_similar(topic, top_k=top_k)
    if not hits:
        return {"summary": "No indexed papers found for this topic.", "sources": []}

    context_block, sources = _build_context_block(hits)
    prompt = (
        f"Topic: {topic}\n\nPaper excerpts:\n\n{context_block}\n\n"
        "Write a clear, well-organized summary (4-8 sentences or bullet points) "
        "of what these papers collectively say about the topic. Use [n] citations "
        "referring to the excerpt numbers."
    )
    summary = await generate(
        prompt,
        system_instruction="You are a research analyst who writes precise, well-cited summaries.",
        temperature=0.3,
    )
    return {"summary": summary, "sources": sources}


async def find_gaps(topic: str, top_k: int = 6) -> dict:
    hits = await query_similar(topic, top_k=top_k)
    if not hits:
        return {"gaps": [], "sources": []}

    context_block, sources = _build_context_block(hits)
    prompt = (
        f"Topic: {topic}\n\nPaper excerpts:\n\n{context_block}\n\n"
        "Extract exactly 5 research gaps.\n\n"
        "Return ONLY valid JSON.\n\n"
        "{\n"
        '  "gaps":[\n'
        "    {\n"
        '      "title":"",\n'
        '      "description":"",\n'
        '      "severity":""\n'
        "    }\n"
        "  ]\n"
        "}\n\n"
        "Rules:\n"
        "- title: max 6 words\n"
        "- description: max 15 words\n"
        "- severity: Low, Medium, or High\n"
        "- No introductions\n"
        "- No explanations\n"
        "- No markdown\n"
        "- No citations\n"
        "- No phrases like:\n"
        '  "Based on the paper"\n'
        '  "The authors state"\n'
        '  "According to the research"\n'
        "- Output JSON only"
    )
    gaps_raw = await generate(
        prompt,
        system_instruction="You are a research analyst.",
        temperature=0.3,
    )
    try:
        cleaned = gaps_raw.strip()
        if cleaned.startswith("```"):
            parts = cleaned.split("```")
            if len(parts) >= 2:
                cleaned = parts[1]
                if cleaned.startswith("json"):
                    cleaned = cleaned[4:]
        cleaned = cleaned.strip()
        parsed = json.loads(cleaned)
        gaps_data = parsed.get("gaps", parsed)
    except Exception:
        gaps_data = gaps_raw

    return {"gaps": gaps_data, "sources": sources}


async def generate_project_ideas(topic: str, top_k: int = 6) -> dict:
    hits = await query_similar(topic, top_k=top_k)
    if not hits:
        return {"ideas": [], "sources": []}

    context_block, sources = _build_context_block(hits)
    prompt = (
        f"Topic: {topic}\n\nPaper excerpts:\n\n{context_block}\n\n"
        "Based on the research gaps and findings, generate EXACTLY 6 distinct research ideas.\n\n"
        "Return ONLY JSON.\n\n"
        "{\n"
        '  "ideas": [\n'
        "    {\n"
        '      "title": "",\n'
        '      "description": "",\n'
        '      "novelty": 0,\n'
        '      "difficulty": "",\n'
        '      "impact": ""\n'
        "    }\n"
        "  ]\n"
        "}\n\n"
        "Rules:\n"
        "- Generate exactly 6 ideas.\n"
        "- Each idea must be different.\n"
        "- Each idea should explore a different direction.\n"
        "- Title: maximum 8 words.\n"
        "- Description: maximum 25 words.\n"
        "- Novelty: 0-100.\n"
        "- Difficulty: Low, Medium, or High.\n"
        "- Impact: Low, Medium, or High.\n"
        "- No introductions.\n"
        "- No conclusions.\n"
        "- No markdown.\n"
        "- Output JSON only."
    )
    ideas_raw = await generate(
        prompt,
        system_instruction="You are a research innovation expert.",
        temperature=0.7,
    )
    try:
        cleaned = ideas_raw.strip()
        if cleaned.startswith("```"):
            parts = cleaned.split("```")
            if len(parts) >= 2:
                cleaned = parts[1]
                if cleaned.startswith("json"):
                    cleaned = cleaned[4:]
        cleaned = cleaned.strip()
        parsed = json.loads(cleaned)
        ideas_data = parsed.get("ideas", parsed)
    except Exception:
        ideas_data = ideas_raw

    return {"ideas": ideas_data, "sources": sources}


async def generate_research_insights(topic: str, top_k: int = 6) -> dict:
    """Combines summary + gaps + ideas into one synthesized narrative report."""
    summary_result = await summarize_topic(topic, top_k=top_k)
    gaps_result = await find_gaps(topic, top_k=top_k)
    ideas_result = await generate_project_ideas(topic, top_k=top_k)

    gaps_val = gaps_result.get("gaps", "")
    if isinstance(gaps_val, list):
        gaps_text = "\n".join(
            f"- [{g.get('severity', 'Medium')}] {g.get('title', '')}: {g.get('description', '')}"
            if isinstance(g, dict) else str(g)
            for g in gaps_val
        )
    else:
        gaps_text = str(gaps_val)

    ideas_val = ideas_result.get("ideas", "")
    if isinstance(ideas_val, list):
        ideas_text = "\n".join(
            f"- {i.get('title', '')} (Novelty: {i.get('novelty', 50)}%, Impact: {i.get('impact', 'High')}): {i.get('description', '')}"
            if isinstance(i, dict) else str(i)
            for i in ideas_val
        )
    else:
        ideas_text = str(ideas_val)

    prompt = (
        f"Topic: {topic}\n\n"
        f"Summary of existing work:\n{summary_result['summary']}\n\n"
        f"Identified gaps:\n{gaps_text}\n\n"
        f"Candidate project ideas:\n{ideas_text}\n\n"
        "Synthesize the above into a single cohesive 'Research Insights' "
        "report with three sections: 'State of the Art', 'Key Gaps', and "
        "'Recommended Directions'. Keep citations [n] as they already appear; "
        "do not renumber them."
    )
    narrative = await generate(
        prompt,
        system_instruction="You write cohesive, decision-useful research insight reports.",
        temperature=0.4,
    )

    all_sources = {s["paper_id"]: s for s in (
        summary_result["sources"] + gaps_result["sources"] + ideas_result["sources"]
    ) if s.get("paper_id")}

    return {
        "report": narrative,
        "summary": summary_result["summary"],
        "gaps": gaps_result["gaps"],
        "ideas": ideas_result["ideas"],
        "sources": list(all_sources.values()),
    }


async def extract_key_findings(topic: str, top_k: int = 6) -> dict:
    hits = await query_similar(topic, top_k=top_k)
    if not hits:
        return {"findings": [], "sources": []}

    context_block, sources = _build_context_block(hits)
    prompt = (
        f"Topic: {topic}\n\nPaper excerpts:\n\n{context_block}\n\n"
        "Extract exactly 5 key findings.\n\n"
        "Return ONLY valid JSON.\n\n"
        "{\n"
        '  "findings":[\n'
        "    {\n"
        '      "title":"",\n'
        '      "impact":""\n'
        "    }\n"
        "  ]\n"
        "}\n\n"
        "Rules:\n"
        "- title: max 8 words\n"
        "- impact: max 8 words\n"
        "- No introductions\n"
        "- No citations\n"
        "- No markdown\n"
        "- Output JSON only"
    )
    findings_raw = await generate(
        prompt,
        system_instruction="You are a research analyst.",
        temperature=0.3,
    )
    try:
        cleaned = findings_raw.strip()
        if cleaned.startswith("```"):
            parts = cleaned.split("```")
            if len(parts) >= 2:
                cleaned = parts[1]
                if cleaned.startswith("json"):
                    cleaned = cleaned[4:]
        cleaned = cleaned.strip()
        parsed = json.loads(cleaned)
        findings_data = parsed.get("findings", parsed)
    except Exception:
        findings_data = findings_raw

    return {"findings": findings_data, "sources": sources}


async def calculate_novelty_score(topic: str, top_k: int = 6) -> dict:
    hits = await query_similar(topic, top_k=top_k)
    if not hits:
        return {"novelty_score": 0, "reason": "No literature found.", "sources": []}

    context_block, sources = _build_context_block(hits)
    prompt = (
        f"Topic/Idea: {topic}\n\nPaper excerpts:\n\n{context_block}\n\n"
        "Evaluate the novelty of this topic or idea relative to the existing literature.\n\n"
        "Return ONLY valid JSON.\n\n"
        "{\n"
        '  "novelty_score": 0,\n'
        '  "reason": ""\n'
        "}\n\n"
        "Rules:\n"
        "- score: 0-100\n"
        "- reason: max 10 words\n"
        "- No introductions\n"
        "- No citations\n"
        "- No markdown\n"
        "- Output JSON only"
    )
    score_raw = await generate(
        prompt,
        system_instruction="You are a research evaluator assessing novelty.",
        temperature=0.3,
    )
    try:
        cleaned = score_raw.strip()
        if cleaned.startswith("```"):
            parts = cleaned.split("```")
            if len(parts) >= 2:
                cleaned = parts[1]
                if cleaned.startswith("json"):
                    cleaned = cleaned[4:]
        cleaned = cleaned.strip()
        parsed = json.loads(cleaned)
        novelty_score = parsed.get("novelty_score", 50)
        reason = parsed.get("reason", "")
    except Exception:
        novelty_score = 50
        reason = score_raw

    return {
        "novelty_score": novelty_score,
        "reason": reason,
        "sources": sources,
    }


def _clean_json_output(raw_text: str) -> dict | list | None:
    if not raw_text:
        return None
    cleaned = raw_text.strip()
    start_idx = min(
        [i for i in [cleaned.find('{'), cleaned.find('[')] if i != -1],
        default=-1,
    )
    end_idx = max(cleaned.rfind('}'), cleaned.rfind(']'))
    if start_idx != -1 and end_idx != -1 and end_idx >= start_idx:
        cleaned = cleaned[start_idx : end_idx + 1]
    try:
        return json.loads(cleaned)
    except Exception:
        return None


async def expand_research_idea(idea: str, lineage: list[str] = None, depth: int = 1, top_k: int = 6) -> dict:
    hits = await query_similar(idea, top_k=top_k)
    context_block, sources = _build_context_block(hits) if hits else ("", [])

    lineage_str = " -> ".join(lineage) if lineage else "None"

    prompt = (
        "TASK:\n"
        "Expand the given research idea into EXACTLY 5 new child research ideas.\n\n"
        f"PARENT IDEA:\n{idea}\n\n"
        f"RESEARCH LINEAGE:\n{lineage_str}\n\n"
        f"CURRENT DEPTH:\n{depth}\n\n"
        f"Paper Excerpts Context:\n{context_block}\n\n"
        "OBJECTIVE:\n"
        "Generate 5 distinct child ideas that are:\n"
        "- More specific than the parent.\n"
        "- Novel and non-overlapping.\n"
        "- Research-feasible.\n"
        "- Strong enough to become standalone research papers.\n"
        "- Logically connected to the parent idea.\n\n"
        "Each child MUST represent a different dimension:\n"
        "1. Algorithmic Innovation\n"
        "2. System Architecture\n"
        "3. Scalability & Optimization\n"
        "4. Real-World Application\n"
        "5. Cross-Domain Extension\n\n"
        "RULES:\n"
        "- Generate EXACTLY 5 ideas.\n"
        "- Do NOT repeat concepts from the lineage.\n"
        "- Do NOT create simple variations of wording.\n"
        "- Do NOT generate generic AI ideas.\n"
        "- Each idea should introduce a genuinely new direction.\n"
        "- Increase specificity as depth increases.\n"
        "  * Depth 1: Broad research directions.\n"
        "  * Depth 2: Concrete methods.\n"
        "  * Depth 3: Technical implementations.\n"
        "  * Depth 4+: Experimental frameworks and deployment strategies.\n"
        "- Keep titles under 8 words.\n"
        "- Keep descriptions under 30 words.\n"
        "- Novelty score: 0-100.\n\n"
        "Return ONLY valid JSON matching this schema:\n\n"
        "{\n"
        '  "child_ideas": [\n'
        "    {\n"
        '      "category": "Algorithmic Innovation",\n'
        '      "title": "",\n'
        '      "description": "",\n'
        '      "research_question": "",\n'
        '      "novelty": 0,\n'
        '      "difficulty": "Low|Medium|High",\n'
        '      "impact": "Low|Medium|High"\n'
        "    },\n"
        "    {\n"
        '      "category": "System Architecture",\n'
        '      "title": "",\n'
        '      "description": "",\n'
        '      "research_question": "",\n'
        '      "novelty": 0,\n'
        '      "difficulty": "Low|Medium|High",\n'
        '      "impact": "Low|Medium|High"\n'
        "    },\n"
        "    {\n"
        '      "category": "Scalability & Optimization",\n'
        '      "title": "",\n'
        '      "description": "",\n'
        '      "research_question": "",\n'
        '      "novelty": 0,\n'
        '      "difficulty": "Low|Medium|High",\n'
        '      "impact": "Low|Medium|High"\n'
        "    },\n"
        "    {\n"
        '      "category": "Real-World Application",\n'
        '      "title": "",\n'
        '      "description": "",\n'
        '      "research_question": "",\n'
        '      "novelty": 0,\n'
        '      "difficulty": "Low|Medium|High",\n'
        '      "impact": "Low|Medium|High"\n'
        "    },\n"
        "    {\n"
        '      "category": "Cross-Domain Extension",\n'
        '      "title": "",\n'
        '      "description": "",\n'
        '      "research_question": "",\n'
        '      "novelty": 0,\n'
        '      "difficulty": "Low|Medium|High",\n'
        '      "impact": "Low|Medium|High"\n'
        "    }\n"
        "  ]\n"
        "}\n"
    )

    child_raw = await generate(
        prompt,
        system_instruction="You are an elite research strategist and innovation scientist.",
        temperature=0.7,
    )

    parsed = _clean_json_output(child_raw)
    if isinstance(parsed, dict) and "child_ideas" in parsed:
        child_data = parsed["child_ideas"]
    elif isinstance(parsed, list):
        child_data = parsed
    else:
        child_data = child_raw

    return {"child_ideas": child_data, "sources": sources}


async def generate_research_evolution_timeline(topic: str, top_k: int = 8) -> dict:
    """
    Generates a structured Research Evolution Timeline JSON for a given topic
    matching the schema expected by the frontend Timeline component.
    """
    hits = await query_similar(topic, top_k=top_k)
    context_block, sources = _build_context_block(hits) if hits else ("", [])

    prompt = (
        f"Topic: {topic}\n\nPaper excerpts:\n\n{context_block}\n\n"
        "Generate a structured Research Evolution Timeline JSON analyzing how this research field evolved over time.\n\n"
        "Return ONLY valid JSON matching this schema:\n\n"
        "{\n"
        '  "topic": "' + topic + '",\n'
        '  "papers": [\n'
        "    {\n"
        '      "id": "paper-1",\n'
        '      "title": "",\n'
        '      "year": 2020,\n'
        '      "authors": ["Author 1", "Author 2"],\n'
        '      "contribution": "",\n'
        '      "methodology": "",\n'
        '      "limitation": "",\n'
        '      "future_scope": "",\n'
        '      "citation_count": 100\n'
        "    }\n"
        "  ],\n"
        '  "summary": {\n'
        '    "major_breakthroughs": ["..."],\n'
        '    "methodology_evolution": "",\n'
        '    "current_state": ""\n'
        "  },\n"
        '  "gaps": [\n'
        "    {\n"
        '      "id": "gap-1",\n'
        '      "title": "",\n'
        '      "description": "",\n'
        '      "severity": "High"\n'
        "    }\n"
        "  ],\n"
        '  "turning_points": {\n'
        '    "most_influential_paper": {\n'
        '      "id": "paper-1",\n'
        '      "title": "",\n'
        '      "reason": "",\n'
        '      "year": 2020\n'
        "    },\n"
        '    "most_cited_paper": {\n'
        '      "id": "paper-1",\n'
        '      "title": "",\n'
        '      "citation_count": 100,\n'
        '      "year": 2020\n'
        "    },\n"
        '    "biggest_methodology_shift": {\n'
        '      "title": "",\n'
        '      "from_method": "",\n'
        '      "to_method": "",\n'
        '      "impact": "",\n'
        '      "year": 2022\n'
        "    },\n"
        '    "emerging_trend": {\n'
        '      "trend": "",\n'
        '      "description": "",\n'
        '      "key_papers": ["Paper A", "Paper B"]\n'
        "    }\n"
        "  }\n"
        "}\n\n"
        "Rules:\n"
        "- Generate 4 to 7 papers in chronological order of year\n"
        "- Provide 3 to 5 research gaps with severity Low, Medium, or High\n"
        "- Provide non-empty summary fields\n"
        "- Output ONLY JSON. No markdown backticks."
    )

    raw_output = await generate(
        prompt,
        system_instruction="You are an expert research analyst and literature lineage synthesizer.",
        temperature=0.3,
    )

    parsed = _clean_json_output(raw_output)
    if isinstance(parsed, dict) and "papers" in parsed:
        return {**parsed, "sources": sources}

    # Fallback default structure if LLM output parsing fails
    return {
        "topic": topic,
        "papers": [],
        "summary": {
            "major_breakthroughs": ["Analysis in progress..."],
            "methodology_evolution": "Evolution analysis ongoing.",
            "current_state": "Active research domain."
        },
        "gaps": [],
        "turning_points": {
            "most_influential_paper": {"id": "", "title": "Literature Synthesis", "reason": "Initial paper analysis", "year": 2024},
            "most_cited_paper": {"id": "", "title": "Foundational Study", "citation_count": 0, "year": 2024},
            "biggest_methodology_shift": {"title": "Methodology Transition", "from_method": "Traditional models", "to_method": "Modern architectures", "impact": "Increased accuracy", "year": 2024},
            "emerging_trend": {"trend": "AI-Driven Synthesis", "description": "Continuous evolution", "key_papers": []}
        },
        "sources": sources
    }






