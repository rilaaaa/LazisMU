import { StructuredTool } from "@langchain/core/tools";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";

export class DatabaseQueryTool extends StructuredTool {
  name = "generate_sql_query"; // Make sure this name is used by your agent's LLM when it calls this tool
  description = `Generates PostgreSQL SQL queries for the Lazismu charity database.
  Input should be a clear question or task description in natural language.
  This tool's output is STRICTLY the SQL query, ready for execution.
  `; // Improved description for agent's LLM

  schema = z.object({
    question: z.string().describe("Clear question or task description in natural language about the Lazismu database. E.g., 'Show total donations for July 2024'.")
  });

  private model: ChatGoogleGenerativeAI;
  private schemaInfo: string; // Store schema info once

  constructor() {
    super();
    // Ensure GEMINI_API_KEY is set in your environment variables
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is not set for DatabaseQueryTool.");
    }
    this.model = new ChatGoogleGenerativeAI({
      model: "gemini-1.5-flash",
      apiKey: process.env.GEMINI_API_KEY,
      temperature: 0.1, // Keep low for consistent SQL generation
      maxOutputTokens: 500, // SQL queries are usually not excessively long. Reduce if needed.
    });
    this.schemaInfo = this.getLazismuSchemaInfo(); // Initialize schema info
  }

  async _call(arg: { question: string }): Promise<string> {
    try {
      console.log(`🔍 DatabaseQueryTool: Attempting to generate SQL for: "${arg.question}"`);
      
      const prompt = `You are a PostgreSQL SQL query generator. Your task is to convert a natural language question into a PostgreSQL SQL query based on the provided database schema.

Database Schema:
${this.schemaInfo}

Question/Task: "${arg.question}"

IMPORTANT RULES:
- Return ONLY the PostgreSQL SQL query.
- DO NOT include any markdown (e.g., \`\`\`sql).
- DO NOT include any explanations, comments, or conversational text.
- Ensure proper JOIN syntax if relationships between tables are needed.
- Include appropriate WHERE conditions for filtering.
- If the question asks for aggregation (e.g., total, sum, count), use aggregate functions (SUM, COUNT, etc.) and GROUP BY if necessary.
- If no specific table or column seems to match the question, generate a plausible query based on the schema, or a generic selection if unsure.
- Always end the query with a semicolon if it's a complete statement.

SQL Query:`; // Prompt the LLM directly for the SQL Query

      const result = await this.model.invoke(prompt);
      
      // Aggressive cleaning to ensure only the query remains
      let query = result.content.toString().trim();
      
      // Remove any leading/trailing markdown code blocks
      query = query.replace(/^```sql\n?|```$/g, '').trim();
      query = query.replace(/^```\n?|```$/g, '').trim(); // Catch non-sql specific blocks

      // Remove any common LLM conversational intros/outros
      if (query.toLowerCase().startsWith("sql query:")) {
        query = query.substring("sql query:".length).trim();
      }
      if (query.toLowerCase().startsWith("here is the sql query:")) {
        query = query.substring("here is the sql query:".length).trim();
      }
      
      // Ensure it ends with a semicolon for consistency, unless it's an empty string
      if (query && !query.endsWith(';')) {
          query += ';';
      }

      console.log(`📝 DatabaseQueryTool: Generated SQL: "${query}"`);
      return query;
    } catch (error) {
      console.error("❌ DatabaseQueryTool Error generating SQL query:", error);
      // Re-throw the error so the agent's handleToolError can catch it
      throw new Error(`DatabaseQueryTool failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private getLazismuSchemaInfo(): string {
    return `
TABLE jurnals:
   - id: INTEGER (PK, unique identifier for a journal type)
   - name: STRING (Name of the journal type, e.g., "Zakat", "Infaq")
   - jenisJurnal: STRING (Category of the journal, e.g., "Pemasukan", "Pengeluaran")

TABLE JurnalData:
   - id: INTEGER (PK, unique identifier for a journal entry)
   - jurnal_id: INTEGER (FK, references jurnals.id, linking to the type of journal)
   - nama: STRING (Name of the donor/recipient)
   - no_hp: STRING (Phone number of the donor/recipient)
   - tanggal: DATE (Date of the transaction)
   - tahun: INTEGER (Year of the transaction, derived from tanggal)
   - zis: STRING (Zakat, Infaq, Sedekah category for the transaction)
   - via: STRING (Method of donation/payment, e.g., "Transfer", "Cash")
   - sumber_dana: STRING (Source of funds, e.g., "Donatur Umum", "Pegawai")
   - nominal: FLOAT (Amount of the transaction)
   - jenis_donatur: STRING (Type of donor, e.g., "Individu", "Badan Usaha")

TABLE JurnalDataCleanings: (This table seems to be for cleaned or processed JurnalData)
   - Same structure as JurnalData. Assume it contains cleaned/validated versions of JurnalData.
`;
  }
}