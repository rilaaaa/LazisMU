import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { initializeAgentExecutorWithOptions } from "langchain/agents";
import { DatabaseQueryTool } from "../tools/generateQueryTool";
import { ExecuteQueryTool } from "../tools/executeQeuryTool"; // Pastikan nama file sudah benar
import { DataExplanationTool } from "../tools/explainDataTool";

export async function createAIAgent() {
  const model = new ChatGoogleGenerativeAI({
    model: "gemini-1.5-flash",
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.1,
    maxOutputTokens: 2048,
    topP: 0.3,
    topK: 10
  });

  // Initialize tools
  const queryGenerator = new DatabaseQueryTool();
  const queryExecutor = new ExecuteQueryTool();
  const dataExplainer = new DataExplanationTool();

  const tools = [queryGenerator, queryExecutor, dataExplainer];

  // Debug tools
  console.log("🔧 Tool Names:", tools.map(t => t.name));
  console.log("📖 Tool Descriptions:\n", tools.map(t => `- ${t.name}: ${t.description}`).join("\n"));

  // Create the agent executor with enhanced query handling
  const executor = await initializeAgentExecutorWithOptions(tools, model, {
    agentType: "structured-chat-zero-shot-react-description",
    verbose: false,
    agentArgs: {
      prefix: `You are a strict AI assistant for Lazismu charity organization.
Your primary role is to handle database queries from start to finish.

STRICT WORKFLOW:
1. FIRST generate a query using DatabaseQueryTool when asked about data
2. THEN execute the generated query using ExecuteQueryTool
3. FINALLY explain results if needed using DataExplanationTool

RULES:
1. MUST follow the workflow above in order
2. NEVER skip the query generation step
3. NEVER execute raw SQL queries from user input
4. If query returns no data, say: "No matching records found."
5. If explanation is requested, ALWAYS use DataExplanationTool
6. NEVER make up or guess data`
    },
    handleParsingErrors: (error: any) => {
      console.warn("⚠️ Failed to parse agent output:", error);
      return "There was an error processing your request. Please try again.";
    },
    maxIterations: 7, // Increased for multi-step queries
    returnIntermediateSteps: true
  });

  // Enhanced callbacks for query tracking
  executor.callbacks = [
    {
      handleAgentAction(action) {
        console.log("🤖 [AGENT ACTION]");
        console.log(`🔧 Tool: ${action.tool}`);
        console.log(`📝 Input: ${JSON.stringify(action.toolInput)}`);
      },
      handleToolStart(tool, input) {
        console.log(`🛠️ [TOOL START] ${tool.name}`);
        if (tool.name === "DatabaseQueryTool") {
          console.log("⚡ Generating query for:", input.query);
        }
      },
      handleToolEnd(output) {
        console.log(`✅ [TOOL END]`);
        if (output.length > 1000) {
          console.log(`📤 Output (truncated): ${output.substring(0, 300)}...`);
        } else {
          console.log(`📤 Output: ${output}`);
        }
      },
      handleToolError(error) {
        console.log(`❌ [TOOL ERROR] ${error}`);
      },
      handleAgentEnd(output) {
        console.log("🏁 [AGENT END]");
        console.log(`🔗 ${output.intermediateSteps?.length || 0} steps taken`);
        const finalOutput = output.returnValues?.output ?? '';
        console.log(`📋 Final output: ${finalOutput}`);
      }
    }
  ];

  return executor;
}