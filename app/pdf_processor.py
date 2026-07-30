"""
PDF Processing
Downloads a paper's PDF (or accepts an uploaded file) and extracts clean text.
"""
import os
import hashlib
from pathlib import Path

import httpx
import fitz  # PyMuPDF

from app.config import settings

Path(settings.pdf_download_dir).mkdir(parents=True, exist_ok=True)


def _path_for(paper_id: str) -> str:
    safe_name = hashlib.sha1(paper_id.encode()).hexdigest()
    return os.path.join(settings.pdf_download_dir, f"{safe_name}.pdf")


async def download_pdf(paper_id: str, pdf_url: str) -> str:
    """Downloads a PDF to disk (if not already cached) and returns the local path."""
    local_path = _path_for(paper_id)
    if os.path.exists(local_path):
        return local_path

    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    try:
        async with httpx.AsyncClient(timeout=60.0, follow_redirects=True, headers=headers) as client:
            resp = await client.get(pdf_url)
            resp.raise_for_status()

        with open(local_path, "wb") as f:
            f.write(resp.content)
        return local_path
    except Exception:
        return ""


def extract_text(pdf_path: str) -> str:
    """Extracts and cleans text from a PDF file using PyMuPDF (fitz)."""
    if not pdf_path or not os.path.exists(pdf_path):
        return ""
    try:
        doc = fitz.open(pdf_path)
        pages_text = []
        for page in doc:
            try:
                # sort=True preserves natural reading order across multi-column layouts
                text = page.get_text("text", sort=True) or ""
                pages_text.append(text)
            except Exception:
                continue
        doc.close()

        full_text = "\n".join(pages_text)
        lines = [line.strip() for line in full_text.splitlines()]
        lines = [line for line in lines if line]
        clean_text = "\n".join(lines)
        return clean_text
    except Exception:
        return ""


async def process_paper_pdf(paper_id: str, pdf_url: str) -> str:
    """Full pipeline: download then extract. Returns extracted text (may be empty)."""
    if not pdf_url:
        return ""
    local_path = await download_pdf(paper_id, pdf_url)
    return extract_text(local_path)
