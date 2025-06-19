import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AgentExecutor, createStructuredChatAgent } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import {
  DatabaseQueryTool,
  ExecuteQueryTool,
  DataExplanationTool
} from "../tools/dbTools";

export async function createAIAgent() {
  const model = new ChatGoogleGenerativeAI({
    model: "gemini-1.5-flash",
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.3,
    maxOutputTokens: 2048,
  });

  const tools = [
    new DatabaseQueryTool(),
    new ExecuteQueryTool(),
    new DataExplanationTool()
  ];

  const prompt = ChatPromptTemplate.fromTemplate(
    `You are a helpful AI assistant for Lazismu charity organization.
You have access to the following tools:

{tools}

To use a tool, respond with raw JSON containing:
- "tool": the tool name (must be one of: {tool_names})
- "tool_input": the input for the tool

ALWAYS respond with raw JSON (without markdown or code blocks) when using tools.
NEVER wrap JSON inside markdown or code fences like \`\`\`json or \`\`\`.

Only return plain JSON when calling tools.
When responding to the user directly, use natural language.

Current conversation:
{agent_scratchpad}

User input: {input}`
  );

  const agent = await createStructuredChatAgent({
    llm: model,
    tools,
    prompt,
  });

  function parseJSONFromMarkdown(text: string): any {
    try {
      const jsonMatch = text.match(/```(?:json)?\n([\s\S]*?)```/i);
      const raw = jsonMatch ? jsonMatch[1] : text;
      return JSON.parse(raw.trim());
    } catch (e) {
      console.warn("⚠️ Failed to parse JSON:", e);
      return null;
    }
  }

  return new AgentExecutor({
    agent,
    tools,
    verbose: false, // disable noisy default logging
    callbacks: [
      {
        handleAgentAction(action) {
          const parsed = parseJSONFromMarkdown(action.log);
          if (parsed?.tool && parsed?.tool_input) {
            action.tool = parsed.tool;
            action.toolInput = parsed.tool_input;

            // Logging jelas
            console.log("🤖 [AGENT ACTION]");
            console.log(`🔧 Tool   : ${parsed.tool}`);
            console.log(`📝 Input  : ${parsed.tool_input}`);
          } else {
            console.warn("⚠️ Agent returned invalid tool JSON.");
            console.log("🧾 Raw log:", action.log);
          }
        },
        handleToolEnd(output) {
          console.log("📦 [TOOL OUTPUT]");
          console.log(typeof output === 'string' ? output : JSON.stringify(output, null, 2));
        },
        handleLLMStart(prompt) {
          console.log("🧠 [LLM START]");
          console.log(prompt);
        },
        handleLLMEnd(result) {
          const generations = result.generations?.[0]?.[0];
          if (generations) {
            console.log("📨 [LLM RESPONSE]");
            console.log(generations.text);
          }
        },
        handleChainEnd(output) {
          console.log("🏁 [FINAL OUTPUT]");
          console.log(output.output || output);
        }
      }
    ]
  });
}
