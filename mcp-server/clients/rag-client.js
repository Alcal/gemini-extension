import { PRODUCTS } from "./mock-data.js";

const RAG_URL = process.env.RAG_URL ?? "http://rag-server:8000";

function tokenize(text) {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1);
}

function scoreProduct(queryTokens, product) {
  const searchable = [
    product.part_number,
    product.product_name,
    product.brand,
    product.category,
    ...product.specs,
  ]
    .join(" ")
    .toLowerCase();

  let score = 0;
  for (const token of queryTokens) {
    if (searchable.includes(token)) {
      score += 1;
    }
  }
  return score;
}

/**
 * Search technical specifications. Returns mock results until the RAG server
 * at RAG_URL is implemented and wired in.
 */
export async function searchSpecs(query) {
  console.error(`[rag-client] mock search (RAG_URL=${RAG_URL}): ${query}`);

  const queryTokens = tokenize(query);
  const results = PRODUCTS.map((product) => {
    const score = scoreProduct(queryTokens, product);
    return {
      part_number: product.part_number,
      product_name: product.product_name,
      brand: product.brand,
      category: product.category,
      score: score > 0 ? score / queryTokens.length : 0,
      excerpt: product.specs[0],
    };
  })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score);

  return {
    query,
    backend: "mock",
    rag_url: RAG_URL,
    results,
  };
}
