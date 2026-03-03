/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unused-vars */
const codeengine = require('codeengine');
const sdk = require('sdk');
const axios = require('axios');

// =====================================================================
// Configuration
// =====================================================================

const ACCOUNT_ID = 0; // Replace with your Domo account ID where OAuth secrets are stored
const ACCOUNT = 'your-account.us-east-1'; // Replace with your Snowflake account identifier (e.g., 'ab12345.us-east-2')
const REQUEST_TIMEOUT_MS = 120000; // 2 minutes
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// =====================================================================
// Utility Functions
// =====================================================================

/**
 * Removes surrounding quotes and trims whitespace from a string
 */
function dequoteAndTrim(s) {
  if (typeof s !== 'string') return s;
  let out = s.trim();
  if (out.length >= 2 && out[0] === '"' && out[out.length - 1] === '"') {
    out = out.substring(1, out.length - 1).trim();
  }
  return out;
}

/**
 * Normalizes a dotted identifier (e.g., database.schema.table)
 * Removes quotes and trims each segment
 */
function normalizeDottedIdent(s) {
  if (typeof s !== 'string') {
    throw new Error('normalizeDottedIdent expects a string');
  }
  s = dequoteAndTrim(s);
  const parts = s.split('.');
  return parts.map((part) => dequoteAndTrim(part)).join('.');
}

/**
 * Extracts SQL statements from a Cortex Analyst response
 * Returns both logical query (for display) and physical query (for execution)
 */
function extractSqlFromAnalystResponse(data) {
  if (!data || typeof data !== 'object') {
    return { logicalSql: null, physicalSql: null };
  }

  const message = data.message;
  const content = message && message.content;

  if (!Array.isArray(content) || content.length === 0) {
    return { logicalSql: null, physicalSql: null };
  }

  const sqlStatements = [];

  // Collect all SQL statements
  for (const item of content) {
    if (item && item.type === 'sql' && item.statement) {
      sqlStatements.push(item.statement);
    }
  }

  if (sqlStatements.length === 0) {
    return { logicalSql: null, physicalSql: null };
  }

  // If only one SQL found, use it for both
  if (sqlStatements.length === 1) {
    return { logicalSql: sqlStatements[0], physicalSql: sqlStatements[0] };
  }

  // If multiple SQL statements:
  // - Use the SAME query for execution and display (keep working behavior)
  // - But try to find the cleaner logical one for display
  // The first statement is what Cortex wants us to execute
  const physicalSql = sqlStatements[0];
  
  // Look for a simpler logical query (without CTEs or long WITH clauses)
  let logicalSql = physicalSql;
  for (const sql of sqlStatements) {
    // Prefer SQL without "WITH" (CTEs) as it's likely the logical query
    if (!sql.trim().toUpperCase().startsWith('WITH')) {
      logicalSql = sql;
      break;
    }
  }

  return { logicalSql, physicalSql };
}

/**
 * Extracts the first SQL statement from a Cortex Analyst response (legacy)
 */
function firstSqlFromAnalystResponse(data) {
  const { physicalSql } = extractSqlFromAnalystResponse(data);
  return physicalSql;
}

/**
 * Builds the request body for Cortex Analyst API
 * Handles various semantic model specification formats and conversation history
 */
function buildAnalystBody(
  question,
  semanticModel,
  database,
  schema,
  conversationHistory,
) {
  if (!question || typeof question !== 'string' || !question.trim()) {
    throw new Error('question is required and must be a non-empty string');
  }

  // Build messages array with conversation history
  const messages = [];

  // Add conversation history if provided
  if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
    messages.push(...conversationHistory);
  }

  // Add the current user message
  messages.push({
    role: 'user',
    content: [{ type: 'text', text: String(question).trim() }],
  });

  const body = { messages };

  // Handle string-based semantic model specifications
  if (typeof semanticModel === 'string') {
    const s = semanticModel.trim();
    if (!s) {
      throw new Error('semanticModel cannot be empty');
    }

    // Stage YAML file (starts with @)
    if (s.startsWith('@')) {
      body.semantic_model_file = s;
    }
    // Fully-qualified semantic view (contains dots)
    else if (s.includes('.')) {
      body.semantic_view = normalizeDottedIdent(s);
    }
    // Inline YAML (contains newlines or colons)
    else if (s.includes('\n') || s.includes(':')) {
      body.semantic_model = s;
    }
    // Unqualified name - needs database and schema
    else {
      if (!database || !schema) {
        throw new Error(
          'Unqualified semantic view name requires database and schema parameters',
        );
      }
      body.semantic_view = normalizeDottedIdent(`${database}.${schema}.${s}`);
    }
  }
  // Handle object-based semantic model specifications
  else if (semanticModel && typeof semanticModel === 'object') {
    if (semanticModel.semantic_view) {
      body.semantic_view = normalizeDottedIdent(
        String(semanticModel.semantic_view),
      );
    } else if (semanticModel.semantic_model) {
      body.semantic_model = String(semanticModel.semantic_model);
    } else if (semanticModel.semantic_model_file) {
      body.semantic_model_file = String(semanticModel.semantic_model_file);
    } else {
      throw new Error(
        'semanticModel object must include one of: semantic_view, semantic_model, or semantic_model_file',
      );
    }
  } else {
    throw new Error('semanticModel must be a string or an object');
  }

  return body;
}

/**
 * Delays execution for a specified time (for retry logic)
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Transforms Snowflake API response into a structured format
 * Converts array-based rows into objects with column names as keys
 */
function mapRows(respData) {
  if (!respData || typeof respData !== 'object') {
    return { columns: [], rows: [] };
  }

  const meta = respData.resultSetMetaData;
  const rowType = meta && meta.rowType;

  // Extract column names from metadata
  const columns = [];
  if (Array.isArray(rowType) && rowType.length > 0) {
    for (const col of rowType) {
      if (col && col.name) {
        columns.push(col.name);
      }
    }
  }

  // Transform raw data arrays into objects
  const rawRows = respData.data || [];
  const rows = [];

  for (const rawRow of rawRows) {
    if (!Array.isArray(rawRow)) {
      continue;
    }

    const rowObj = {};
    for (let i = 0; i < columns.length; i++) {
      rowObj[columns[i]] = rawRow[i];
    }
    rows.push(rowObj);
  }

  return { columns, rows };
}

// =====================================================================
// OAuth & Authentication
// =====================================================================

/**
 * Retrieves OAuth credentials from Domo account and mints a new access token
 * Uses the refresh token flow to obtain a fresh access token from Snowflake
 */
async function getAccessTokenFromRefresh() {
  let acct;
  try {
    acct = await sdk.getAccount(ACCOUNT_ID);
  } catch (error) {
    throw new Error(
      `Failed to retrieve account ${ACCOUNT_ID}: ${error.message}`,
    );
  }

  // Extract OAuth credentials from account properties
  const clientId = acct && acct.properties && acct.properties.username;
  const clientSecret = acct && acct.properties && acct.properties.password;
  const refreshToken =
    acct && acct.properties && acct.properties.domoAccessToken;

  // Validate all required credentials are present
  if (!clientId || !clientSecret || !refreshToken) {
    const missing = [];
    if (!clientId) missing.push('username (client_id)');
    if (!clientSecret) missing.push('password (client_secret)');
    if (!refreshToken) missing.push('domoAccessToken (refresh_token)');

    throw new Error(
      `Missing OAuth credentials in account ${ACCOUNT_ID}: ${missing.join(
        ', ',
      )}`,
    );
  }

  // Build OAuth token request
  const baseUrl = `https://${ACCOUNT}.snowflakecomputing.com`;
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
    'base64',
  );

  const form = new URLSearchParams();
  form.append('grant_type', 'refresh_token');
  form.append('refresh_token', refreshToken);

  let resp;
  try {
    resp = await fetch(`${baseUrl}/oauth/token-request`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form,
    });
  } catch (error) {
    throw new Error(`Network error during token refresh: ${error.message}`);
  }

  // Handle non-OK responses
  if (!resp.ok) {
    let errorText = '';
    try {
      errorText = await resp.text();
    } catch {
      // Ignore error reading response
    }

    throw new Error(
      `Token refresh failed with status ${resp.status}: ${
        errorText || 'No error details'
      }`,
    );
  }

  // Parse and validate response
  let json;
  try {
    json = await resp.json();
  } catch {
    throw new Error('Invalid JSON response from token endpoint');
  }

  if (!json || !json.access_token) {
    throw new Error('No access_token in refresh response');
  }

  return json.access_token;
}

// =====================================================================
// Snowflake API Interactions
// =====================================================================

/**
 * Calls Snowflake Cortex Analyst API
 * Returns analyst response with SQL if available, or just the message if not
 * Includes retry logic for transient failures
 */
async function callAnalystAndGetSql(accessToken, analystBody, retryCount) {
  if (typeof retryCount === 'undefined') {
    retryCount = 0;
  }

  if (!accessToken || typeof accessToken !== 'string') {
    throw new Error('accessToken is required and must be a string');
  }
  if (!analystBody || typeof analystBody !== 'object') {
    throw new Error('analystBody is required and must be an object');
  }

  const url = `https://${ACCOUNT}.snowflakecomputing.com/api/v2/cortex/analyst/message`;

  try {
    const resp = await axios.post(url, analystBody, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: REQUEST_TIMEOUT_MS,
    });

    const data = resp && resp.data;
    if (!data) {
      throw new Error('Empty response from Cortex Analyst');
    }

    const { logicalSql, physicalSql } = extractSqlFromAnalystResponse(data);

    // Return response with both logical (for display) and physical (for execution) SQL
    return {
      sql: physicalSql || null, // Physical SQL for execution
      logicalSql: logicalSql || null, // Logical SQL for display
      analyst: data,
      hasSql: !!(physicalSql || logicalSql),
    };
  } catch (error) {
    // Handle Axios errors
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      console.error('Cortex Analyst API error:', {
        status,
        data: JSON.stringify(data, null, 2),
        message: error.message,
      });

      // Retry on transient errors (429, 503, 504)
      if ([429, 503, 504].includes(status) && retryCount < MAX_RETRIES) {
        const delayMs = RETRY_DELAY_MS * Math.pow(2, retryCount);
        await delay(delayMs);
        return callAnalystAndGetSql(accessToken, analystBody, retryCount + 1);
      }

      throw new Error(
        `Cortex Analyst API failed (${status}): ${JSON.stringify(data)}`,
      );
    }

    // Timeout errors
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      throw new Error(`Request timeout after ${REQUEST_TIMEOUT_MS}ms`);
    }

    // Log full error details
    console.error('Full error details:', error);
    throw new Error(`Cortex Analyst error: ${error.message}`);
  }
}

/**
 * Executes a SQL statement on Snowflake via REST API
 */
async function executeSql(
  accessToken,
  statement,
  warehouse,
  database,
  schema,
  role,
) {
  // Validate required parameters
  if (!accessToken || typeof accessToken !== 'string') {
    throw new Error('accessToken is required and must be a string');
  }
  if (!statement || typeof statement !== 'string') {
    throw new Error('statement is required and must be a string');
  }
  if (!warehouse || typeof warehouse !== 'string') {
    throw new Error('warehouse is required and must be a string');
  }
  if (!database || typeof database !== 'string') {
    throw new Error('database is required and must be a string');
  }
  if (!schema || typeof schema !== 'string') {
    throw new Error('schema is required and must be a string');
  }

  const url = `https://${ACCOUNT}.snowflakecomputing.com/api/v2/statements`;
  const body = {
    statement: statement,
    warehouse: warehouse,
    database: database,
    schema: schema,
  };

  if (role) {
    body.role = role;
  }

  try {
    const resp = await axios.post(url, body, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: REQUEST_TIMEOUT_MS,
    });

    const data = resp && resp.data;
    if (!data) {
      throw new Error('Empty response from /api/v2/statements');
    }

    const mapped = mapRows(data);

    return {
      columns: mapped.columns,
      rows: mapped.rows,
      rowsRaw: data.data || [],
      statementHandle: data.statementHandle || undefined,
    };
  } catch (error) {
    // Handle Axios errors
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      console.error('SQL execution API error:', {
        status,
        data: JSON.stringify(data, null, 2),
        statement: statement.substring(0, 200),
        message: error.message,
      });

      throw new Error(
        `SQL execution failed (${status}): ${JSON.stringify(data)}`,
      );
    }

    // Timeout errors
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      throw new Error(`SQL execution timeout after ${REQUEST_TIMEOUT_MS}ms`);
    }

    // Unknown error
    console.error('SQL execution error details:', error);
    throw new Error(`SQL execution error: ${error.message}`);
  }
}

// =====================================================================
// Main Public API
// =====================================================================

/**
 * Executes stored SQL directly without calling Cortex Analyst
 * Use this when reusing SQL from a previous query
 *
 * @param {string} sql - The SQL statement to execute
 * @param {string} database - Snowflake database name
 * @param {string} schema - Snowflake schema name
 * @param {string} role - Snowflake role
 * @param {string} warehouse - Snowflake warehouse name
 * @returns {Promise<{success: boolean, sql: string, columns: string[], rows: object[]}>}
 */
async function executeStoredSql(sql, database, schema, role, warehouse) {
  console.log('executeStoredSql invoked:', {
    sql: sql ? sql.substring(0, 100) + '...' : null,
    database,
    schema,
    role,
    warehouse,
  });

  try {
    // Get access token
    console.log('Getting access token...');
    const token = await getAccessTokenFromRefresh();
    console.log('Token obtained');

    // Execute the SQL
    console.log('Executing stored SQL...');
    const sqlResult = await executeSql(
      token,
      sql,
      warehouse,
      database,
      schema,
      role,
    );
    console.log('SQL execution complete:', sqlResult.rows.length, 'rows');

    // Return results without analyst message
    return {
      success: true,
      sql: sql,
      columns: sqlResult.columns,
      rows: sqlResult.rows,
      statementHandle: sqlResult.statementHandle,
    };
  } catch (error) {
    console.error('executeStoredSql error:', error.message);
    console.error('Full error stack:', error.stack);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Simplified passthrough: proxies request to Snowflake Cortex Analyst
 *
 * @param {string} message - Natural language question
 * @param {string|object} view - Semantic view specification
 * @param {string} database - Snowflake database name
 * @param {string} schema - Snowflake schema name
 * @param {string} role - Snowflake role
 * @param {string} warehouse - Snowflake warehouse name
 * @param {Array} conversationHistory - Optional array of previous messages for context
 * @returns {Promise<{success: boolean, analyst: object, sql: string, columns: string[], rows: object[], conversationHistory: Array}>}
 */
async function callAnalyst(
  message,
  view,
  database,
  schema,
  role,
  warehouse,
  conversationHistory,
) {
  console.log('callAnalyst invoked:', {
    message,
    view,
    database,
    schema,
    role,
    warehouse,
    historyLength: conversationHistory ? conversationHistory.length : 0,
  });

  try {
    // Get access token
    console.log('Getting access token...');
    const token = await getAccessTokenFromRefresh();
    console.log('Token obtained');

    // Build and call Cortex Analyst
    console.log('Building analyst body...');
    const analystBody = buildAnalystBody(
      message,
      view,
      database,
      schema,
      conversationHistory,
    );
    console.log('Analyst body:', JSON.stringify(analystBody, null, 2));

    console.log('Calling Cortex Analyst API...');
    const analystResult = await callAnalystAndGetSql(token, analystBody);

    // Build updated conversation history
    const updatedHistory = [
      ...(conversationHistory || []),
      {
        role: 'user',
        content: [{ type: 'text', text: message }],
      },
      analystResult.analyst.message,
    ];

    // If no SQL was generated, return just the analyst message
    if (!analystResult.hasSql) {
      console.log('No SQL generated - returning analyst message only');
      return {
        success: true,
        analyst: analystResult.analyst,
        sql: null,
        columns: [],
        rows: [],
        conversationHistory: updatedHistory,
      };
    }

    // Execute the generated SQL (physical query)
    console.log('Logical SQL (for display):', analystResult.logicalSql);
    console.log('Physical SQL (executing):', analystResult.sql);
    const sqlResult = await executeSql(
      token,
      analystResult.sql,
      warehouse,
      database,
      schema,
      role,
    );
    console.log('SQL execution complete:', sqlResult.rows.length, 'rows');

    // Return raw data for frontend to handle
    return {
      success: true,
      analyst: analystResult.analyst,
      sql: analystResult.sql, // Physical SQL (actually executed)
      logicalSql: analystResult.logicalSql, // Logical SQL (for display)
      columns: sqlResult.columns,
      rows: sqlResult.rows,
      conversationHistory: updatedHistory,
    };
  } catch (error) {
    console.error('callAnalyst error:', error.message);
    console.error('Full error stack:', error.stack);
    return {
      success: false,
      error: error.message,
    };
  }
}
