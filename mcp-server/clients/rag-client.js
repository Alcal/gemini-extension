const RAG_URL = process.env.RAG_URL ?? "http://rag-server:8000";

/**
 * Search technical specifications via the RAG server. Returns
 * { query, backend, rag_url, results } where each result is
 * { text, score, metadata }. On any failure or no match, results is [] so the
 * assistant can state it has no answer instead of hallucinating (HU-03).
 */
export async function searchSpecs(query, k = 5) {
  const url = `${RAG_URL}/search?query=${encodeURIComponent(query)}&k=${k}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`[rag-client] RAG server responded ${response.status}`);
      return { query, backend: "rag", rag_url: RAG_URL, results: [] };
    }
    const data = await response.json();
    return {
      query,
      backend: "rag",
      rag_url: RAG_URL,
      results: Array.isArray(data.results) ? data.results : [],
    };
  } catch (error) {
    console.error(`[rag-client] request to ${RAG_URL} failed: ${error.message}`);
    return { query, backend: "rag", rag_url: RAG_URL, results: [] };
  }
}
