import { neon, NeonQueryFunction } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL || '';

// Create the neon SQL function 
// sql.query() returns {rows, fields, rowCount} - standard pg-style response
let sqlInstance: NeonQueryFunction<false, false>;

function getSql() {
  if (!sqlInstance) {
    sqlInstance = neon(connectionString);
  }
  return sqlInstance;
}

export default getSql;

export interface QueryResult {
  rows: Record<string, unknown>[];
  rowCount: number;
}

// Wrapper using sql.query() which supports parameterized queries
export async function query(text: string, params?: unknown[]): Promise<QueryResult> {
  const sql = getSql();
  try {
    let result;
    if (params && params.length > 0) {
      result = await sql.query(text, params as unknown[]);
    } else {
      result = await sql.query(text);
    }
    
    // Debug: log the raw result structure in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[DB DEBUG] Result type:', typeof result, 'isArray:', Array.isArray(result));
      console.log('[DB DEBUG] Result keys:', result ? Object.keys(result as object) : 'null');
    }
    
    // neon sql.query() may return rows directly as an array OR as {rows, rowCount}
    if (Array.isArray(result)) {
      return { rows: result as Record<string, unknown>[], rowCount: result.length };
    }
    const r = result as { rows?: unknown[]; rowCount?: number };
    return {
      rows: (r.rows || []) as Record<string, unknown>[],
      rowCount: r.rowCount ?? (r.rows?.length || 0),
    };
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}
