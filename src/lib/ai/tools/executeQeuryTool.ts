import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { Database } from "@/db/db";

export class ExecuteQueryTool extends StructuredTool {
  name = "execute_sql_query";
  description = "Executes a PostgreSQL SQL query and returns results. Input must be a valid SELECT query.";
  
  schema = z.object({
    query: z.string().describe("Valid PostgreSQL SELECT query to execute")
  });

  async _call(arg: { query: string }): Promise<string> {
    try {
      if (this.isQueryMalicious(arg.query)) {
        throw new Error("Query contains potentially dangerous operations. Only SELECT queries are allowed.");
      }

      console.log(`🔍 Executing query: ${arg.query}`);
      const [results] = await Database.query(arg.query);
      
      return JSON.stringify({
        status: "success",
        rowCount: Array.isArray(results) ? results.length : 0,
        data: results,
        summary: Array.isArray(results) && results.length > 0 
          ? `Found ${results.length} record(s)`
          : "No records found"
      });
    } catch (error) {
      console.error("Error executing SQL query:", error);
      throw new Error(`Query execution failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private isQueryMalicious(query: string): boolean {
    const normalizedQuery = query.toLowerCase().trim();
    
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
      /;\s*(drop|delete|update|insert|alter|create)/i
    ];

    return dangerousPatterns.some(pattern => pattern.test(query));
  }
}