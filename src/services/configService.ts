// Configuration Service for Domo Datastores
export interface SnowflakeConfig {
  snowflake_database: string;
  snowflake_schema: string;
  snowflake_role: string;
  snowflake_warehouse: string;
  snowflake_view: string;
}

class ConfigService {
  private collectionName = 'configuration';
  private documentId: string | null = null;

  /**
   * Save configuration to Domo datastore
   */
  async saveConfig(config: SnowflakeConfig): Promise<unknown> {
    try {
      const documentContent = {
        content: config,
      };

      let response: any;

      // Check if document already exists
      const existingConfig = await this.getConfig();

      if (existingConfig !== null && this.documentId) {
        // Update existing document
        response = await domo.put(
          `/domo/datastores/v1/collections/${this.collectionName}/documents/${this.documentId}`,
          documentContent,
        );
      } else {
        // Create new document (only if none exists)
        response = await domo.post(
          `/domo/datastores/v1/collections/${this.collectionName}/documents/`,
          documentContent,
        );
        this.documentId = response.id;
      }

      return response;
    } catch (error) {
      console.error('Error saving configuration:', error);
      throw new Error(
        `Failed to save configuration: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Retrieve configuration from Domo datastore
   */
  async getConfig(): Promise<SnowflakeConfig | null> {
    try {
      // Get all documents from the collection
      const response: any = await domo.get(
        `/domo/datastores/v1/collections/${this.collectionName}/documents/`,
      );

      if (response && Array.isArray(response) && response.length > 0) {
        // Use the first (and only) document
        const configDoc = response[0];
        this.documentId = configDoc.id;
        return configDoc.content;
      }

      return null;
    } catch (error) {
      console.error('Error retrieving configuration:', error);
      return null;
    }
  }
}

export const configService = new ConfigService();
