import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { initializeAgentExecutorWithOptions } from "langchain/agents";

import { DatabaseQueryTool } from "../tools/generateQueryTool"
import { ExecuteQueryTool } from "../tools/executeQeuryTool"
import { DataExplanationTool } from "../tools/explainDataTool"

export async function createAIAgent() {
  // Initialize LLM
  const model = new ChatGoogleGenerativeAI({
    model: "gemini-1.5-flash",
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.1,
    maxOutputTokens: 2048
  });

  // Define tools
  const tools = [
    new DatabaseQueryTool(),
    new ExecuteQueryTool(),
    new DataExplanationTool()
  ];

  // Debug tools
  console.log("🔧 Tool Names:", tools.map(t => t.name));
  console.log("📖 Tool Descriptions:\n", tools.map(t => `- ${t.name}: ${t.description}`).join("\n"));

  // Create the agent executor
  const executor = await initializeAgentExecutorWithOptions(tools, model, {
    agentType: "structured-chat-zero-shot-react-description",
    verbose: false,
    agentArgs: {
      prefix: `You are a strict AI assistant for Lazismu charity organization.
Your job is to use ONLY the provided tools to answer user questions.

RULES:
1. You MUST use tools to answer every question.
2. NEVER return a final answer unless all tools have failed.
3. If no tools can help, return:
"I'm unable to answer that question with the tools provided."`
    },
    handleParsingErrors: (error: any) => {
      console.warn("⚠️ Failed to parse agent output:", error);
      return "There was an error processing your request. Please try again.";
    },
    maxIterations: 5,
    returnIntermediateSteps: true
  });

  // Add custom callbacks
  executor.callbacks = [
    {
      handleAgentAction(action) {
        console.log("🤖 [AGENT ACTION]");
        console.log(`🔧 Tool: ${action.tool}`);
        console.log(`📝 Input: ${JSON.stringify(action.toolInput)}`);
        console.log(`📄 Log: ${action.log}`);
      },
      handleToolStart(tool, input) {
        console.log(`🛠️ [TOOL START] ${tool.name}`);
        console.log(`📥 Input: ${JSON.stringify(input)}`);
      },
      handleToolEnd(output) {
        console.log(`✅ [TOOL END]`);
        console.log(`📤 Full Output Length: ${output.length}`); // Add this
        console.log(`📤 Output (first 500 chars): ${output.substring(0, 500)}${output.length > 500 ? '...' : ''}`); // Increase visibility
        // You might even want to try to parse it here to see if the tool output itself is valid JSON
        try {
            JSON.parse(output);
            console.log("    -> Tool output IS valid JSON");
        } catch (e) {
            console.log("    -> Tool output IS NOT valid JSON or unexpected format");
        }
      },
      handleToolError(error) {
        console.log(`❌ [TOOL ERROR] ${error}`);
      },
      handleAgentEnd(output) {
        console.log("🏁 [AGENT END]");
        const finalOutput = output.returnValues?.output ?? '';
        console.log(`📋 Final output: ${finalOutput}`);
      },
      handleChainError(error) {
        console.log(`💥 [CHAIN ERROR] ${error}`);
      }
    }
  ];

  return executor;
}