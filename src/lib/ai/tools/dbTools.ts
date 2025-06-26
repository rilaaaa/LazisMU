import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Tool } from "langchain/tools";
import { Database, Jurnal, JurnalData, JurnalDataCleaning } from "@/db/db";

// Tool 1: Generate SQL Query
export class DatabaseQueryTool extends Tool {
  name = "generate_sql_query";
  description = `Generates SQL queries for Lazismu PostgreSQL database. Input should be a clear question or task description.`;
  private model: ChatGoogleGenerativeAI;

  constructor() {
    super();
    this.model = new ChatGoogleGenerativeAI({
      model: "gemini-1.5-flash",
      apiKey: process.env.GEMINI_API_KEY,
      temperature: 0.1,
      maxOutputTokens: 1024,
    });
  }

  async _call(input: string) {
    try {
      console.log(`🔍 Input to generate: ${input}`);
      const schemaInfo = this.getLazismuSchemaInfo();
      const prompt = `Generate a PostgreSQL SQL query for this task: "${input}"
      
Database Schema:
${schemaInfo}

Requirements:
- Return ONLY the SQL query, no explanations
- Ensure proper JOIN syntax if multiple tables needed
- Use appropriate WHERE conditions
- Perhatikan huruf besar dan kecil pada Schema ketika membuat query

Task: ${input}`;

      const result = await this.model.invoke(prompt);
      const query = result.content.toString().trim()
        .replace(/```sql/g, '')
        .replace(/```/g, '')
        .trim();
      
      console.log(`📝 Generated SQL: ${query}`);
      return query;
    } catch (error) {
      console.error("Error generating SQL query:", error);
      return `ERROR: Could not generate SQL query - ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  private getLazismuSchemaInfo(): string {
    return `
LAZISMU DATABASE SCHEMA:
1. TABLE jurnals:
   - id: INTEGER (PK, auto-increment)
   - name: STRING (not null)
   - jenisJurnal: STRING (not null)

2. TABLE JurnalData:
   - id: INTEGER (PK, auto-increment)
   - jurnal_id: INTEGER (FK to jurnals.id)
   - nama: STRING (not null)
   - no_hp: STRING (not null)
   - tanggal: DATE (not null)
   - tahun: INTEGER (not null)
   - zis: STRING (not null)
   - via: STRING (not null)
   - sumber_dana: STRING (not null)
   - nominal: FLOAT (not null)
   - jenis_donatur: STRING (not null)

3. TABLE JurnalDataCleanings:
   - Same structure as JurnalData

RELATIONSHIPS:
- jurnals (1) -> (many) JurnalData
- jurnals (1) -> (many) JurnalDataCleanings
`;
  }
}

// Tool 2: Execute SQL Query
export class ExecuteQueryTool extends Tool {
  name = "execute_sql_query";
  description = "Executes a raw SQL query and returns formatted results. Input should be a valid SQL query string.";

  async _call(query: string) {
    try {
      // Security check
      if (this.isQueryMalicious(query)) {
        return JSON.stringify({
          status: "error",
          message: "Query contains potentially dangerous operations. Only SELECT queries are allowed."
        });
      }

      console.log(`🔍 Executing query: ${query}`);
      const [results] = await Database.query(query);
      
      // Format results for better readability
      const response = {
        status: "success",
        rowCount: Array.isArray(results) ? results.length : 0,
        data: results,
        summary: Array.isArray(results) && results.length > 0 
          ? `Found ${results.length} record(s)`
          : "No records found"
      };

      console.log(`✅ Query executed successfully: ${response.summary}`);
      return JSON.stringify(response, null, 2);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("❌ Error executing SQL query:", errorMessage);
      
      return JSON.stringify({
        status: "error",
        message: errorMessage,
        query: query
      });
    }
  }

  private isQueryMalicious(query: string): boolean {
    const normalizedQuery = query.toLowerCase().trim();
    
    // Only allow SELECT queries
    if (!normalizedQuery.startsWith('select')) {
      return true;
    }

    const dangerousPatterns = [
      /drop\s+table/i,
      /truncate\s+table/i,
      /delete\s+from/i,
      /update\s+.+\s+set/i,
      /insert\s+into/i,
      /alter\s+table/i,
      /create\s+table/i,
      /grant\s+.+\s+to/i,
      /revoke\s+.+\s+from/i,
      /exec\s*\(/i,
      /execute\s*\(/i,
      /;\s*(drop|delete|update|insert|alter|create)/i
    ];

    return dangerousPatterns.some(pattern => pattern.test(query));
  }
}

// Tool 3: Data Explanation Tool
export class DataExplanationTool extends Tool {
  name = "explain_data";
  description = "Analyzes and explains Lazismu donation data in natural language. Input should be data or query results to analyze.";
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

  async _call(input: string) {
    try {
      let dataToAnalyze = input;
      
      // Try to parse JSON if input looks like JSON
      try {
        const parsed = JSON.parse(input);
        if (parsed.data && Array.isArray(parsed.data)) {
          dataToAnalyze = JSON.stringify(parsed.data, null, 2);
        }
      } catch {
        // If not JSON, use input as-is
      }

      const prompt = `Analyze this Lazismu (Islamic charity organization) donation data and provide insights:

Data to analyze:
${dataToAnalyze}

Please provide:
1. Ringkas data menjadi paragraf yang mudah dipahami.

Keep the analysis focused and practical for charity administrators.
Format with clear paragraphs and bullet points where helpful.`;

      const result = await this.model.invoke(prompt);
      const analysis = result.content.toString();
      
      console.log(`📊 Generated data analysis (${analysis.length} characters)`);
      console.log(analysis);
      return {
        "analysis_result": analysis
      };
    } catch (error) {
      console.error("Error explaining data:", error);
      return `ERROR: Could not analyze data - ${error instanceof Error ? error.message : String(error)}`;
    }
  }
}