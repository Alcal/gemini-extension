"""Embedding helpers around the multilingual-e5 model.

e5 is asymmetric: indexed text must be prefixed with "passage: " and search
text with "query: ". Vectors are L2-normalized so the ChromaDB cosine space
yields distance = 1 - cosine_similarity.
"""
from __future__ import annotations

import os
from functools import lru_cache

from sentence_transformers import SentenceTransformer

MODEL_NAME = os.environ.get("RAG_EMBED_MODEL", "intfloat/multilingual-e5-base")


@lru_cache(maxsize=1)
def _model() -> SentenceTransformer:
    return SentenceTransformer(MODEL_NAME)


def embed_passages(texts: list[str]) -> list[list[float]]:
    prefixed = [f"passage: {t}" for t in texts]
    vectors = _model().encode(prefixed, normalize_embeddings=True)
    return vectors.tolist()


def embed_query(text: str) -> list[float]:
    vector = _model().encode(f"query: {text}", normalize_embeddings=True)
    return vector.tolist()
