import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { searchSpecs } from "./clients/rag-client.js";
import {
  getStockAndPrice,
  listParts,
} from "./clients/sql-client.js";

import { askGemini } from "./geminiService.js";

const server = new McpServer({
  name: "hardware-mcp",
  version: "1.0.0",
});

// Best-effort extraction of a part identifier (material number R9xxxxxxxx or a
// dashed typecode like COREX-C-X3-11-ANNN-21.01-VSRS-NN-NN) from free text, used
// to chain a RAG hit into an SQL price/stock lookup inside ask_assistant.
function extractPartNumber(text) {
  if (!text) return null;
  const material = text.match(/\bR9\d{8}\b/);
  if (material) return material[0];
  const typecode = text.match(/\b[A-Z]{2,}[A-Z0-9]*(?:-[A-Z0-9.]+){2,}\b/);
  return typecode ? typecode[0] : null;
}

// 🔹 RAG
server.registerTool(
  "search_specs",
  {
    description: "Search technical specifications",
    inputSchema: {
      query: z.string().min(1),
    },
  },
  async ({ query }) => {
    const results = await searchSpecs(query);
    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
    };
  }
);

// 🔹 SQL
server.registerTool(
  "get_stock_and_price",
  {
    description: "Get price and stock",
    inputSchema: {
      part_number: z.string().min(1),
    },
  },
  async ({ part_number }) => {
    const result = await getStockAndPrice(part_number);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// 🔹 LIST
server.registerTool(
  "list_parts",
  {
    description: "List parts",
    inputSchema: {},
  },
  async () => {
    const result = await listParts();
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

// 🔥 ASSISTANT (TU PARTE)
server.registerTool(
  "ask_assistant",
  {
    description: "Main assistant",
    inputSchema: {
      question: z.string(),
    },
  },
  async ({ question }) => {
    try {
      console.error("👉 Pregunta:", question);

      const ragResults = await searchSpecs(question);
      const ragItems = ragResults?.results ?? [];

      // Chain into SQL when a part identifier appears in the question or the
      // retrieved technical text.
      let sqlResults = null;
      const haystack = [question, ...ragItems.map((r) => r.text ?? "")].join(" ");
      const part = extractPartNumber(haystack);
      if (part) {
        sqlResults = await getStockAndPrice(part);
      }

      const techContext = ragItems.length
        ? ragItems.map((r) => `- ${r.text}`).join("\n")
        : "(no relevant documents found)";

      const context = `TECH SPECS:
${techContext}

INVENTORY / PRICE:
${sqlResults ? JSON.stringify(sqlResults) : "(no SQL match)"}`;

      console.error("⏳ Gemini...");

      const answer = await askGemini(question, context);

      console.error("✅ Respuesta lista");

      return {
        content: [{ type: "text", text: answer }],
      };

    } catch (error) {
      console.error("❌ Error:", error);
      return {
        content: [{ type: "text", text: "Error processing request" }],
      };
    }
  }
);

// ✅ INICIO
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("hardware-mcp server running on stdio");
}

main().catch(console.error);
