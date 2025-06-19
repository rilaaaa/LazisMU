import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Tool } from "langchain/tools";
import { Database, Jurnal, JurnalData, JurnalDataCleaning } from "@/db/db";

// Tool 1: Generate SQL Query using Gemini with Sequelize knowledge
export class DatabaseQueryTool extends Tool {
  name = "generate_sql_query";
  description = `Generates SQL queries for Lazismu PostgreSQL database using Sequelize ORM. Provide the question or task in natural language.`;

  private model: ChatGoogleGenerativeAI;

  constructor() {
    super();
    this.model = new ChatGoogleGenerativeAI({
      model: "gemini-1.5-flash",
      apiKey: process.env.GEMINI_API_KEY,
      temperature: 0.1,
      maxOutputTokens: 2048,
    });
  }

  async _call(input: string) {
    try {
      const schemaInfo = this.getLazismuSchemaInfo();

      const prompt = `You are a PostgreSQL SQL query generator for Lazismu database that understands Sequelize ORM.
      
      Database Schema:
      ${schemaInfo}

      Task: ${input}

      Generate a valid PostgreSQL SQL query to accomplish this task. 
      Return ONLY the SQL query without any additional explanation or markdown formatting.
      Only query tables that exist in the schema (jurnals, JurnalData, JurnalDataCleanings).`;

      const result = await this.model.invoke(prompt);
      const query = result.content.toString().trim();

      return query;
    } catch (error) {
      console.error("Error generating SQL query:", error);
      return "Error generating SQL query";
    }
  }

  private getLazismuSchemaInfo(): string {
    // Lazismu specific schema information
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
- jurnals has many JurnalData (foreign key: jurnal_id)
- jurnals has many JurnalDataCleanings (foreign key: jurnal_id)
`;
  }
}

// Tool 2: Execute SQL Query on Lazismu PostgreSQL
export class ExecuteQueryTool extends Tool {
  name = "execute_sql_query";
  description = "Executes a raw SQL query on the Lazismu PostgreSQL database and returns the results.";

  async _call(query: string) {
    try {
      // Validate the query to prevent potential SQL injection
      if (this.isQueryMalicious(query)) {
        throw new Error("Query contains potentially dangerous operations");
      }

      const [results] = await Database.query(query);
      return JSON.stringify(results, null, 2);
    } catch (error) {
      console.error("Error executing SQL query:", error);
      return `Error executing query: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  private isQueryMalicious(query: string): boolean {
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
    ];

    return dangerousPatterns.some(pattern => pattern.test(query));
  }
}

// Tool 3: Explain Lazismu Data using Gemini
export class DataExplanationTool extends Tool {
  name = "explain_data";
  description = "Analyzes and explains Lazismu donation data in natural language. Provide the data and any specific questions you have about it.";

  private model: ChatGoogleGenerativeAI;

  constructor() {
    super();
    this.model = new ChatGoogleGenerativeAI({
      model: "gemini-1.5-flash",
      apiKey: process.env.GEMINI_API_KEY,
      temperature: 0.3,
      maxOutputTokens: 2048,
    });
  }

  async _call(input: string) {
    try {
      const prompt = `You are a data analysis assistant for Lazismu (Islamic charity organization). 
Analyze and explain the following donation data:

${input}

Provide insights about:
- Donation patterns
- Donor information
- Amount trends
- Time-based analysis (if dates are available)
- Any interesting observations

Format your response with clear paragraphs and bullet points when appropriate.
Focus on information relevant to charity management and reporting.`;

      const result = await this.model.invoke(prompt);
      return result.content.toString();
    } catch (error) {
      console.error("Error explaining data:", error);
      return "Error explaining data";
    }
  }
}