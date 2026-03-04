import { AppDBClient } from '@domoinc/toolkit';

import { extractAppDbData } from '../utils/appDbHelpers';

// Recent Query interface
export interface RecentQuery {
  id?: string;
  query_text: string;
  sql_generated: string; // Physical SQL for execution
  logical_sql?: string; // Logical SQL for display
  result_columns?: string; // JSON stringified array
  result_row_count?: number;
  created_at?: string; // ISO timestamp
  analyst_message?: string;
  createdOn?: string;
  owner?: number;
}

// AppDB client for recent queries collection
const recentQueryClient = new AppDBClient.DocumentsClient<
  Omit<RecentQuery, 'id' | 'createdOn' | 'owner'>
>('recent_queries');

/**
 * Fetch all recent queries, sorted by creation date (most recent first)
 */
const fetchRecentQueries = async (): Promise<RecentQuery[]> => {
  try {
    const rawResponse = await recentQueryClient.get({});

    const queries =
      extractAppDbData<Omit<RecentQuery, 'id' | 'createdOn' | 'owner'>>(
        rawResponse,
      );

    // Sort by created_at or createdOn descending (most recent first)
    queries.sort((a, b) => {
      const dateA = new Date(a.created_at || a.createdOn || 0).getTime();
      const dateB = new Date(b.created_at || b.createdOn || 0).getTime();
      return dateB - dateA;
    });

    return queries;
  } catch (error) {
    console.error('Error fetching recent queries:', error);
    return [];
  }
};

/**
 * Save a new query to the recent queries collection
 */
const saveQuery = async (
  query: Omit<RecentQuery, 'id' | 'createdOn' | 'owner'>,
): Promise<RecentQuery> => {
  try {
    const response = await recentQueryClient.create(query);

    // Extract the data from the response
    const extracted =
      extractAppDbData<Omit<RecentQuery, 'id' | 'createdOn' | 'owner'>>(
        response,
      );

    const newQuery = extracted[0];

    // Prune old queries after saving (don't await to avoid blocking)
    pruneOldQueries().catch((error) =>
      console.error('Error pruning queries:', error),
    );

    return newQuery;
  } catch (error) {
    console.error('Error saving query:', error);
    throw new Error(`Failed to save query: ${(error as Error).message}`);
  }
};

/**
 * Delete a specific query by ID
 */
const deleteQuery = async (queryId: string): Promise<void> => {
  try {
    await recentQueryClient.delete(queryId);
  } catch (error) {
    console.error('Error deleting query:', error);
    throw new Error(`Failed to delete query: ${(error as Error).message}`);
  }
};

/**
 * Clear all queries from the collection
 */
const clearAllQueries = async (): Promise<void> => {
  try {
    const queries = await fetchRecentQueries();

    // Delete each query
    await Promise.all(
      queries.map((query) => {
        if (query.id) {
          return deleteQuery(query.id);
        }
        return Promise.resolve();
      }),
    );

  } catch (error) {
    console.error('Error clearing queries:', error);
    throw new Error(`Failed to clear queries: ${(error as Error).message}`);
  }
};

/**
 * Prune old queries to keep only the most recent 50
 */
const pruneOldQueries = async (maxQueries = 50): Promise<void> => {
  try {
    const queries = await fetchRecentQueries();

    // If we have more than maxQueries, delete the oldest ones
    if (queries.length > maxQueries) {
      const queriesToDelete = queries.slice(maxQueries);

      await Promise.all(
        queriesToDelete.map((query) => {
          if (query.id) {
            return deleteQuery(query.id);
          }
          return Promise.resolve();
        }),
      );

    }
  } catch (error) {
    console.error('Error pruning old queries:', error);
    // Don't throw - pruning is a best-effort operation
  }
};

export const RecentQueriesService = {
  fetchRecentQueries,
  saveQuery,
  deleteQuery,
  clearAllQueries,
  pruneOldQueries,
};
