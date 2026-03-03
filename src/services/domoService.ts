import { mockAnalystResponse } from '../utils/mockData';
import { configService, SnowflakeConfig } from './configService';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AnalystResponse {
  success: boolean;
  sql?: string; // Physical SQL (actually executed)
  logicalSql?: string; // Logical SQL (for display to user)
  columns?: string[];
  rows?: Record<string, unknown>[];
  analyst?: {
    message?: {
      content: {
        type: string;
        text?: string;
        suggestions?: string[];
      }[];
    };
    response_metadata?: {
      analyst_latency_ms?: number;
    };
  };
  conversationHistory?: ConversationMessage[];
  error?: string;
}

class DomoService {
  private config: SnowflakeConfig | null = null;
  private conversationHistory: ConversationMessage[] = [];
  private useMockData = false;

  async loadConfiguration(): Promise<void> {
    try {
      this.config = await configService.getConfig();
      console.log('Configuration loaded:', this.config);
    } catch (error) {
      console.error('Error loading configuration:', error);
      this.config = null;
    }
  }

  getConfig(): SnowflakeConfig | null {
    return this.config;
  }

  clearConversationHistory(): void {
    this.conversationHistory = [];
    console.log('Conversation history cleared');
  }

  getConversationHistory(): ConversationMessage[] {
    return this.conversationHistory;
  }

  setMockMode(enabled: boolean): void {
    this.useMockData = enabled;
    console.log('Mock mode:', enabled ? 'enabled' : 'disabled');
  }

  isMockMode(): boolean {
    return this.useMockData;
  }

  async startFunction(
    functionAlias: string,
    inputParameters: Record<string, unknown> = {},
  ): Promise<unknown> {
    const response = await domo.post(
      `/domo/codeengine/v2/packages/${functionAlias}`,
      inputParameters,
    );
    return response;
  }

  async executeStoredSql(
    sql: string,
    retryCount = 0,
  ): Promise<AnalystResponse> {
    console.log('Executing stored SQL');

    if (!this.config || Object.keys(this.config).length === 0) {
      throw new Error(
        'Configuration not loaded. Please configure the app first.',
      );
    }

    const maxRetries = 2;
    const timeoutMs = 30000; // 30 second timeout

    try {
      // Prepare parameters for the executeStoredSql function
      const sqlParams = {
        sql,
        database: this.config.snowflake_database,
        schema: this.config.snowflake_schema,
        role: this.config.snowflake_role,
        warehouse: this.config.snowflake_warehouse,
      };

      console.log('Executing SQL with parameters:', {
        ...sqlParams,
        sql: sql.substring(0, 100) + '...',
      });

      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
      });

      // Call the executeStoredSql function with timeout
      const response: any = await Promise.race([
        this.startFunction('executeStoredSql', sqlParams),
        timeoutPromise,
      ]);

      console.log(
        'Raw response from executeStoredSql:',
        JSON.stringify(response, null, 2),
      );

      // Unwrap response if it's wrapped
      let actualResponse: AnalystResponse = response;
      if (response && response.result && typeof response.result === 'object') {
        actualResponse = response.result;
      }

      // Check if response was successful
      if (!actualResponse || !actualResponse.success) {
        console.error('Response failure:', actualResponse);
        const errorMsg = actualResponse?.error || 'Unknown error occurred';
        throw new Error(errorMsg);
      }

      return actualResponse;
    } catch (error) {
      console.error('Error in executeStoredSql:', error);

      // Retry logic for certain errors
      if (
        retryCount < maxRetries &&
        error instanceof Error &&
        (error.message.includes('timeout') ||
          error.message.includes('network') ||
          error.message.includes('fetch'))
      ) {
        console.log(
          `Retrying request (attempt ${retryCount + 1}/${maxRetries})`,
        );
        await this.delay(1000 * (retryCount + 1)); // Exponential backoff
        return this.executeStoredSql(sql, retryCount + 1);
      }

      throw error;
    }
  }

  async sendMessage(message: string, retryCount = 0): Promise<AnalystResponse> {
    console.log('Sending message to Domo:', message);

    // Return mock data if mock mode is enabled
    if (this.useMockData) {
      console.log('Using mock data response');
      await this.delay(500); // Simulate network delay
      return mockAnalystResponse.sql;
    }

    if (!this.config || Object.keys(this.config).length === 0) {
      throw new Error(
        'Configuration not loaded. Please configure the app first.',
      );
    }

    const maxRetries = 2;
    const timeoutMs = 30000; // 30 second timeout

    try {
      // Prepare parameters for the callAnalyst function
      const analystParams = {
        database: this.config.snowflake_database,
        schema: this.config.snowflake_schema,
        role: this.config.snowflake_role,
        warehouse: this.config.snowflake_warehouse,
        view: this.config.snowflake_view,
        message,
        conversationHistory: this.conversationHistory,
      };

      console.log('Calling analyst with parameters:', analystParams);

      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
      });

      // Call the callAnalyst function with timeout
      const response: any = await Promise.race([
        this.startFunction('callAnalyst', analystParams),
        timeoutPromise,
      ]);

      console.log(
        'Raw response from callAnalyst:',
        JSON.stringify(response, null, 2),
      );

      // Unwrap response if it's wrapped in 'sql' property (Domo Code Engine format)
      let actualResponse: AnalystResponse = response;
      if (response && response.sql && typeof response.sql === 'object') {
        actualResponse = response.sql;
      }

      // Enhanced logging for debugging SQL fields
      console.log('Response SQL fields:', {
        hasSql: !!actualResponse.sql,
        hasLogicalSql: !!actualResponse.logicalSql,
        rowCount: actualResponse.rows?.length,
        columnCount: actualResponse.columns?.length,
      });

      // Check if response was successful
      if (!actualResponse || !actualResponse.success) {
        console.error('Response failure:', actualResponse);
        const errorMsg = actualResponse?.error || 'Unknown error occurred';
        throw new Error(errorMsg);
      }

      // Update conversation history if provided
      if (actualResponse.conversationHistory) {
        this.conversationHistory = actualResponse.conversationHistory;
        console.log(
          'Conversation history updated:',
          this.conversationHistory.length,
          'messages',
        );
      }

      return actualResponse;
    } catch (error) {
      console.error('Error in sendMessage:', error);

      // Retry logic for certain errors
      if (
        retryCount < maxRetries &&
        error instanceof Error &&
        (error.message.includes('timeout') ||
          error.message.includes('network') ||
          error.message.includes('fetch'))
      ) {
        console.log(
          `Retrying request (attempt ${retryCount + 1}/${maxRetries})`,
        );
        await this.delay(1000 * (retryCount + 1)); // Exponential backoff
        return this.sendMessage(message, retryCount + 1);
      }

      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const domoService = new DomoService();
