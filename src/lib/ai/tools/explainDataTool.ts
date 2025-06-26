import { StructuredTool } from "@langchain/core/tools";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";

export class DataExplanationTool extends StructuredTool {
  name = "explain_data";
  description = "Analyzes and explains Lazismu donation data in natural language. Input should be JSON data or query results.";
  
  schema = z.object({
    data: z.union([
      z.string().describe("JSON string of data to analyze"),
      z.record(z.any()).describe("Data object to analyze")
    ])
  });

  private model: ChatGoogleGenerativeAI;

  constructor() {
    super();
    this.model = new ChatGoogleGenerativeAI({
      model: "gemini-1.5-flash",
      apiKey: process.env.GEMINI_API_KEY,
      temperature: 0.3,
      maxOutputTokens: 1024,
    });
  }

  async _call(arg: { data: string | Record<string, any> }): Promise<string> {
    let dataToAnalyze = arg.data;
    
    try {
      if (typeof dataToAnalyze === 'string') {
        dataToAnalyze = JSON.parse(dataToAnalyze);
      }

      const prompt = `Analyze this Lazismu (Islamic charity) donation data:

Data:
${JSON.stringify(dataToAnalyze, null, 2)}

Provide:
1. Summary of key findings
2. Notable patterns or trends
3. Recommendations if any

Use professional but clear language in Bahasa Indonesia.`;

      const result = await this.model.invoke(prompt);
      const analysis = result.content.toString();
      
      return JSON.stringify({
        analysis: analysis,
        summary: "Data analysis completed"
      });
    } catch (error) {
      console.error("Error explaining data:", error);
      throw new Error(`Data analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}