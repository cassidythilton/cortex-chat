import { Eye, Loader2, Play, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { RootState, useAppDispatch } from '../../reducers';
import {
  addMessage,
  deleteRecentQuery,
  loadRecentQueries,
  openTableModal,
  showResults,
} from '../../reducers/chat/slice';
import { domoService } from '../../services/domoService';
import { RecentQuery } from '../../services/recentQueriesService';
import ConfirmModal from '../ConfirmModal/ConfirmModal';
import QueryDetailsModal from '../QueryDetailsModal/QueryDetailsModal';
import styles from './RecentQueries.module.scss';

const RecentQueries = () => {
  const dispatch = useAppDispatch();
  const { recentQueries, isLoadingQueries, currentTableData } = useSelector(
    (state: RootState) => state.chat,
  );
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [queryToDelete, setQueryToDelete] = useState<string | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<RecentQuery | null>(null);
  const [runningQueryId, setRunningQueryId] = useState<string | null>(null);

  useEffect(() => {
    // Load recent queries on mount
    dispatch(loadRecentQueries());
  }, [dispatch]);

  const handleQueryClick = async (query: RecentQuery) => {
    console.log('Query clicked:', query);
    console.log('Query fields:', {
      id: query.id,
      query_text: query.query_text,
      sql_generated: query.sql_generated,
      result_columns: query.result_columns,
      result_row_count: query.result_row_count,
      created_at: query.created_at,
      createdOn: query.createdOn,
      analyst_message: query.analyst_message,
    });

    // Execute the SQL to get the full data and show results panel
    setRunningQueryId(query.id || 'loading');
    try {
      const response = await domoService.executeStoredSql(query.sql_generated);

      if (response.success && response.columns && response.rows) {
        // Open the results panel with table/chart/details tabs
        dispatch(
          openTableModal({
            columns: response.columns,
            rows: response.rows,
            sql: query.sql_generated, // Physical SQL for rerun
            logicalSql: query.logical_sql || query.sql_generated, // Logical SQL for display
            queryText: query.query_text,
            analystMessage: query.analyst_message,
          }),
        );

        // Show the results panel
        dispatch(showResults());
      } else {
        console.error('Failed to retrieve query results');
        dispatch(
          addMessage({
            sender: 'bot',
            content: 'Failed to retrieve query results',
            isError: true,
          }),
        );
      }
    } catch (error) {
      console.error('Error loading query results:', error);
      dispatch(
        addMessage({
          sender: 'bot',
          content: `Error: ${(error as Error).message}`,
          isError: true,
        }),
      );
    } finally {
      setRunningQueryId(null);
    }
  };

  const handleCloseDetails = () => {
    setDetailsModalOpen(false);
    setSelectedQuery(null);
  };

  const handleRunFromDetails = async (sql: string, queryText?: string) => {
    // Execute the stored SQL to get the data
    setRunningQueryId('details-modal');
    try {
      const response = await domoService.executeStoredSql(sql);

      if (response.success && response.columns && response.rows) {
        // Open the table with results and SQL for rerunning
        dispatch(
          openTableModal({
            columns: response.columns,
            rows: response.rows,
            sql: sql,
            queryText: queryText,
          }),
        );
      } else {
        console.error('Failed to retrieve stored query results');
        dispatch(
          addMessage({
            sender: 'bot',
            content: 'Failed to retrieve stored query results',
            isError: true,
          }),
        );
      }
    } catch (error) {
      console.error('Error viewing stored query:', error);
      dispatch(
        addMessage({
          sender: 'bot',
          content: `Error: ${(error as Error).message}`,
          isError: true,
        }),
      );
    } finally {
      setRunningQueryId(null);
    }
  };

  const handleDeleteClick = (queryId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent query click
    setQueryToDelete(queryId);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!queryToDelete) return;

    try {
      await dispatch(deleteRecentQuery(queryToDelete));
      setDeleteConfirmOpen(false);
      setQueryToDelete(null);
    } catch (error) {
      console.error('Error deleting query:', error);
      dispatch(
        addMessage({
          sender: 'bot',
          content: `Error deleting query: ${(error as Error).message}`,
          isError: true,
        }),
      );
      setDeleteConfirmOpen(false);
      setQueryToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setQueryToDelete(null);
  };

  const handleRunSql = async (
    sql: string,
    queryText: string,
    queryId: string,
    event: React.MouseEvent,
  ) => {
    event.stopPropagation(); // Prevent query click

    // Add user message showing they're rerunning the SQL
    dispatch(
      addMessage({
        sender: 'user',
        content: `Re-running: "${queryText}"`,
      }),
    );

    setRunningQueryId(queryId);
    try {
      const response = await domoService.executeStoredSql(sql);

      if (response.success && response.sql) {
        // Add SQL display
        dispatch(
          addMessage({
            sender: 'bot',
            content: `**📝 SQL:**\n\`\`\`sql\n${response.sql}\n\`\`\``,
          }),
        );

        // Display results if available
        if (response.columns && response.rows && response.rows.length > 0) {
          const tablePreviewHTML = `
            <div style="margin: 16px 0;">
              <strong>Query Results (${response.rows.length} rows):</strong>
              <div style="margin-top: 8px; padding: 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #e5e7eb;">
                <p style="margin: 0 0 8px 0;">
                  <strong>Columns:</strong> ${response.columns.join(', ')}
                </p>
                <p style="margin: 0;">
                  Click to view full results in table →
                </p>
              </div>
            </div>
          `;

          dispatch(
            addMessage({
              sender: 'bot',
              content: tablePreviewHTML,
              isHTML: true,
            }),
          );

          dispatch(
            openTableModal({
              columns: response.columns,
              rows: response.rows,
              sql: sql,
              queryText: queryText,
            }),
          );
        }
      }
    } catch (error) {
      dispatch(
        addMessage({
          sender: 'bot',
          content: `Error executing SQL: ${(error as Error).message}`,
          isError: true,
        }),
      );
    } finally {
      setRunningQueryId(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown date';

    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} min ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    }
  };

  if (isLoadingQueries) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>My recent questions</h2>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (recentQueries.length === 0) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>My recent questions</h2>
        <div className={styles.empty}>
          No recent questions yet. Ask a question to get started!
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>My recent questions</h2>
        {currentTableData && (
          <button
            className={styles.viewResultsButton}
            onClick={() => dispatch(showResults())}
            title="View current query results"
            aria-label="View current query results"
          >
            <Eye className={styles.buttonIcon} />
          </button>
        )}
      </div>
      <div className={styles.queryList}>
        {recentQueries.slice(0, 10).map((query, index) => {
          // Use createdOn from AppDB or created_at from content
          const dateToUse = query.createdOn || query.created_at;
          const isLoadingThis = runningQueryId === (query.id || 'loading');
          return (
            <div
              key={query.id || `query-${index}`}
              className={styles.queryItem}
            >
              <div
                className={`${styles.queryContent} ${isLoadingThis ? styles.loading : ''}`}
                onClick={() => !isLoadingThis && handleQueryClick(query)}
                style={{ cursor: isLoadingThis ? 'wait' : 'pointer' }}
              >
                <div className={styles.queryText}>
                  {isLoadingThis
                    ? 'Loading results...'
                    : query.query_text || 'No question text available'}
                </div>
                <div className={styles.queryDate}>
                  Asked on {formatDate(dateToUse)}
                </div>
              </div>
              <div className={styles.queryActions}>
                <button
                  className={styles.runSqlButton}
                  onClick={(e) =>
                    handleRunSql(
                      query.sql_generated,
                      query.query_text,
                      query.id || `query-${index}`,
                      e,
                    )
                  }
                  title="Run the stored SQL from this query"
                  aria-label="Run SQL query"
                  disabled={runningQueryId === (query.id || `query-${index}`)}
                >
                  {runningQueryId === (query.id || `query-${index}`) ? (
                    <Loader2
                      className={`${styles.buttonIcon} ${styles.spinning}`}
                    />
                  ) : (
                    <Play className={styles.buttonIcon} />
                  )}
                </button>
                <button
                  className={styles.deleteButton}
                  onClick={(e) => handleDeleteClick(query.id!, e)}
                  title="Delete this query from history"
                  aria-label="Delete query"
                  disabled={!query.id || runningQueryId !== null}
                >
                  <Trash2 className={styles.buttonIcon} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <QueryDetailsModal
        isOpen={detailsModalOpen}
        query={selectedQuery}
        onClose={handleCloseDetails}
        onRunSql={handleRunFromDetails}
      />

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        title="Delete Query"
        message="Are you sure you want to delete this query from your history? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

export default RecentQueries;
