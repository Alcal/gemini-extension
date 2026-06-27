"""Build the vector index from the curated sample documents.

Two sources are indexed:
  - PDF manuals in documents/ — extracted per page with PyMuPDF and split into
    overlapping chunks.
  - documents/error_codes.json — one chunk per error code so a fault lookup
    retrieves the exact entry (HU-04).
"""
from __future__ import annotations

import json
import os
from pathlib import Path

import fitz  # PyMuPDF
from langchain_text_splitters import RecursiveCharacterTextSplitter

from .embeddings import embed_passages

DOCS_DIR = Path(os.environ.get("RAG_DOCS_DIR", "/app/documents"))
CHUNK_SIZE = int(os.environ.get("RAG_CHUNK_SIZE", "1600"))
CHUNK_OVERLAP = int(os.environ.get("RAG_CHUNK_OVERLAP", "200"))
MIN_CHUNK_CHARS = 40

_splitter = RecursiveCharacterTextSplitter(
    chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP
)


def _family_from_name(filename: str) -> str:
    lower = filename.lower()
    if "core" in lower:
        return "ctrlX CORE"
    if "_io_" in lower or "io_" in lower or " io" in lower:
        return "ctrlX IO"
    if "drive" in lower:
        return "ctrlX DRIVE"
    if "safety" in lower:
        return "ctrlX SAFETY"
    return "ctrlX"


def _pdf_chunks():
    docs, metas, ids = [], [], []
    for pdf in sorted(DOCS_DIR.glob("*.pdf")):
        family = _family_from_name(pdf.name)
        with fitz.open(pdf) as doc:
            for page_num, page in enumerate(doc, start=1):
                text = page.get_text("text").strip()
                if not text:
                    continue
                for i, chunk in enumerate(_splitter.split_text(text)):
                    chunk = chunk.strip()
                    if len(chunk) < MIN_CHUNK_CHARS:
                        continue
                    docs.append(chunk)
                    metas.append(
                        {
                            "source_file": pdf.name,
                            "page": page_num,
                            "doc_type": "manual",
                            "product_family": family,
                        }
                    )
                    ids.append(f"{pdf.stem}-p{page_num}-c{i}")
    return docs, metas, ids


def _error_chunks():
    docs, metas, ids = [], [], []
    path = DOCS_DIR / "error_codes.json"
    if not path.exists():
        return docs, metas, ids
    for entry in json.loads(path.read_text(encoding="utf-8")):
        family = entry.get("product_family", "ctrlX")
        text = (
            f"Error code {entry['error_code']} ({family}): {entry['title']}. "
            f"Cause: {entry['cause']} Resolution: {entry['resolution']}"
        )
        docs.append(text)
        metas.append(
            {
                "source_file": "error_codes.json",
                "doc_type": "error_code",
                "error_code": entry["error_code"],
                "product_family": family,
            }
        )
        ids.append(f"error-{entry['error_code']}")
    return docs, metas, ids


def ingest(collection, batch_size: int = 64) -> int:
    """Embed and upsert all sample chunks into the collection. Returns the count."""
    docs, metas, ids = _pdf_chunks()
    edocs, emetas, eids = _error_chunks()
    docs += edocs
    metas += emetas
    ids += eids
    if not docs:
        return 0
    for start in range(0, len(docs), batch_size):
        sl = slice(start, start + batch_size)
        collection.add(
            ids=ids[sl],
            documents=docs[sl],
            embeddings=embed_passages(docs[sl]),
            metadatas=metas[sl],
        )
    return len(docs)
