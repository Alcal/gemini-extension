"""FastAPI RAG server: semantic search over hardware manuals and error codes.

Embeddings are produced with multilingual-e5 (see embeddings.py) and stored in a
persistent ChromaDB collection using cosine distance. On first startup the
collection is seeded from the sample documents; subsequent restarts reuse the
persisted volume.

GET /search returns only results whose cosine similarity clears RAG_MIN_SCORE, so
an out-of-scope question yields an empty list and the assistant can say it does
not have the answer (HU-03).
"""
from __future__ import annotations

import os
from contextlib import asynccontextmanager

import chromadb
from fastapi import FastAPI, Query

from .embeddings import embed_query
from .ingest import ingest

CHROMA_PATH = os.environ.get("RAG_CHROMA_PATH", "/data/chroma")
COLLECTION_NAME = os.environ.get("RAG_COLLECTION", "hardware_docs")
MIN_SCORE = float(os.environ.get("RAG_MIN_SCORE", "0.80"))

_client = chromadb.PersistentClient(path=CHROMA_PATH)
_collection = _client.get_or_create_collection(
    name=COLLECTION_NAME, metadata={"hnsw:space": "cosine"}
)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    count = _collection.count()
    if count == 0:
        n = ingest(_collection)
        print(f"[rag] ingested {n} chunks into '{COLLECTION_NAME}'", flush=True)
    else:
        print(f"[rag] collection '{COLLECTION_NAME}' has {count} chunks", flush=True)
    yield


app = FastAPI(title="Hardware RAG Server", lifespan=lifespan)


@app.get("/health")
def health():
    return {"status": "ok", "chunks": _collection.count(), "min_score": MIN_SCORE}


@app.get("/search")
def search(query: str = Query(..., min_length=1), k: int = 5):
    response = _collection.query(query_embeddings=[embed_query(query)], n_results=k)
    documents = response.get("documents", [[]])[0]
    metadatas = response.get("metadatas", [[]])[0]
    distances = response.get("distances", [[]])[0]

    results = []
    for document, metadata, distance in zip(documents, metadatas, distances):
        score = 1.0 - float(distance)
        if score < MIN_SCORE:
            continue
        results.append(
            {"text": document, "score": round(score, 4), "metadata": metadata}
        )

    return {"query": query, "backend": "rag", "results": results}
