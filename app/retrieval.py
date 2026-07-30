"""
Paper Retrieval Layer
Searches arXiv and Semantic Scholar for papers matching a query, and
normalizes both sources into a common `Paper` shape.
"""
import xml.etree.ElementTree as ET
from dataclasses import dataclass, asdict
from typing import Optional

import httpx

from app.config import settings

ARXIV_API_URL = "https://export.arxiv.org/api/query"
S2_API_URL = "https://api.semanticscholar.org/graph/v1/paper/search"
ARXIV_NS = {"atom": "http://www.w3.org/2005/Atom"}
DEFAULT_HEADERS = {"User-Agent": "ResearchRAG/1.0 (https://github.com/research-rag)"}


@dataclass
class Paper:
    paper_id: str          # unique id we use everywhere downstream
    source: str             # "arxiv" | "semantic_scholar"
    title: str
    abstract: str
    authors: list
    year: Optional[int]
    pdf_url: Optional[str]
    external_url: Optional[str]

    def to_dict(self):
        return asdict(self)


async def search_arxiv(query: str, max_results: Optional[int] = None) -> list[Paper]:
    max_results = max_results or settings.arxiv_max_results
    clean_q = query.strip().replace('"', '')
    # Formulate precise query matching title, abstract, or text
    search_expr = f'ti:"{clean_q}" OR abs:"{clean_q}" OR all:{clean_q}'
    
    params = {
        "search_query": search_expr,
        "start": 0,
        "max_results": max_results,
        "sortBy": "relevance",
        "sortOrder": "descending",
    }
    
    async with httpx.AsyncClient(timeout=30, follow_redirects=True, headers=DEFAULT_HEADERS) as client:
        resp = await client.get(ARXIV_API_URL, params=params)
        resp.raise_for_status()

    root = ET.fromstring(resp.text)
    papers = []
    for entry in root.findall("atom:entry", ARXIV_NS):
        arxiv_id = entry.findtext("atom:id", default="", namespaces=ARXIV_NS)
        arxiv_id = arxiv_id.rsplit("/", 1)[-1] if arxiv_id else ""
        title = (entry.findtext("atom:title", default="", namespaces=ARXIV_NS) or "").strip().replace("\n", " ")
        abstract = (entry.findtext("atom:summary", default="", namespaces=ARXIV_NS) or "").strip().replace("\n", " ")
        published = entry.findtext("atom:published", default="", namespaces=ARXIV_NS)
        year = int(published[:4]) if published else None
        authors = [
            a.findtext("atom:name", default="", namespaces=ARXIV_NS)
            for a in entry.findall("atom:author", ARXIV_NS)
        ]
        pdf_url = None
        for link in entry.findall("atom:link", ARXIV_NS):
            if link.attrib.get("title") == "pdf" or link.attrib.get("type") == "application/pdf":
                pdf_url = link.attrib.get("href")
        if not pdf_url and arxiv_id:
            pdf_url = f"https://arxiv.org/pdf/{arxiv_id}.pdf"

        papers.append(Paper(
            paper_id=f"arxiv:{arxiv_id}",
            source="arxiv",
            title=title,
            abstract=abstract,
            authors=authors,
            year=year,
            pdf_url=pdf_url,
            external_url=f"https://arxiv.org/abs/{arxiv_id}" if arxiv_id else None,
        ))

    # Fallback to general query if specific search yields few results
    if len(papers) < 3:
        params["search_query"] = f"all:{clean_q}"
        try:
            async with httpx.AsyncClient(timeout=30, follow_redirects=True, headers=DEFAULT_HEADERS) as client:
                resp = await client.get(ARXIV_API_URL, params=params)
                if resp.status_code == 200:
                    root = ET.fromstring(resp.text)
                    existing_ids = {p.paper_id for p in papers}
                    for entry in root.findall("atom:entry", ARXIV_NS):
                        arxiv_id = entry.findtext("atom:id", default="", namespaces=ARXIV_NS)
                        arxiv_id = arxiv_id.rsplit("/", 1)[-1] if arxiv_id else ""
                        pid = f"arxiv:{arxiv_id}"
                        if pid not in existing_ids and arxiv_id:
                            title = (entry.findtext("atom:title", default="", namespaces=ARXIV_NS) or "").strip().replace("\n", " ")
                            abstract = (entry.findtext("atom:summary", default="", namespaces=ARXIV_NS) or "").strip().replace("\n", " ")
                            published = entry.findtext("atom:published", default="", namespaces=ARXIV_NS)
                            year = int(published[:4]) if published else None
                            authors = [
                                a.findtext("atom:name", default="", namespaces=ARXIV_NS)
                                for a in entry.findall("atom:author", ARXIV_NS)
                            ]
                            pdf_url = f"https://arxiv.org/pdf/{arxiv_id}.pdf"
                            papers.append(Paper(
                                paper_id=pid,
                                source="arxiv",
                                title=title,
                                abstract=abstract,
                                authors=authors,
                                year=year,
                                pdf_url=pdf_url,
                                external_url=f"https://arxiv.org/abs/{arxiv_id}",
                            ))
        except Exception:
            pass

    return papers


async def search_semantic_scholar(query: str, max_results: Optional[int] = None) -> list[Paper]:
    max_results = max_results or settings.semantic_scholar_max_results
    headers = {}
    if settings.semantic_scholar_api_key:
        headers["x-api-key"] = settings.semantic_scholar_api_key

    params = {
        "query": query,
        "limit": max_results,
        "fields": "title,abstract,authors,year,openAccessPdf,externalIds,url",
    }
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(S2_API_URL, params=params, headers=headers)
            if resp.status_code != 200:
                return []
            data = resp.json()

        papers = []
        for item in data.get("data", []):
            pdf_url = None
            oa = item.get("openAccessPdf")
            if oa and oa.get("url"):
                pdf_url = oa["url"]
            papers.append(Paper(
                paper_id=f"s2:{item.get('paperId')}",
                source="semantic_scholar",
                title=item.get("title") or "",
                abstract=item.get("abstract") or "",
                authors=[a.get("name", "") for a in (item.get("authors") or [])],
                year=item.get("year"),
                pdf_url=pdf_url,
                external_url=item.get("url"),
            ))
        return papers
    except Exception:
        return []


async def search_papers(query: str, sources: Optional[list[str]] = None) -> list[Paper]:
    """
    Search across configured sources and de-duplicate by normalized title.
    sources: subset of ["arxiv", "semantic_scholar"]; defaults to both.
    """
    sources = sources or ["arxiv", "semantic_scholar"]
    results: list[Paper] = []

    if "arxiv" in sources:
        try:
            results.extend(await search_arxiv(query))
        except Exception:
            pass
    if "semantic_scholar" in sources:
        try:
            results.extend(await search_semantic_scholar(query))
        except Exception:
            pass

    seen_titles = set()
    deduped = []
    for p in results:
        key = p.title.strip().lower()
        if key and key not in seen_titles:
            seen_titles.add(key)
            deduped.append(p)
    return deduped
