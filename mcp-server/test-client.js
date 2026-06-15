import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function run() {
  const transport = new StdioClientTransport({
    command: "node",
    args: ["server.js"],
    env: {
      ...process.env,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    },
  });

  const client = new Client({
    name: "test-client",
    version: "1.0.0",
  });

  await client.connect(transport);

  console.log("✅ Connected to MCP server");

  const tools = await client.listTools();
  console.log("\n🧰 Tools disponibles:\n", JSON.stringify(tools, null, 2));

  // ✅ LLAMADA CORRECTA
  const result = await client.callTool({
    name: "ask_assistant",
    arguments: {
      question: "What is Siemens S7-1200 and what is its price?",
    },
  });

  console.log("\n🤖 RESPONSE:\n");

  console.log(
    result?.content?.[0]?.text ||
    JSON.stringify(result, null, 2)
  );

  process.exit(0);
}

run().catch(console.error);
