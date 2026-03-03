import { useEffect } from 'react';

import { RecentQuery } from '../../services/recentQueriesService';
import styles from './QueryDetailsModal.module.scss';

interface QueryDetailsModalProps {
  isOpen: boolean;
  query: RecentQuery | null;
  onClose: () => void;
  onRunSql: (sql: string, queryText?: string) => void;
}

const QueryDetailsModal = ({
  isOpen,
  query,
  onClose,
  onRunSql,
}: QueryDetailsModalProps) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !query) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleRunClick = () => {
    onRunSql(query.sql_generated, query.query_text);
    onClose();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const resultColumns = query.result_columns
    ? JSON.parse(query.result_columns)
    : [];

  return (
    <div className={`${styles.modal} ${styles.isOpen}`}>
      <div className={styles.modalOverlay} onClick={handleOverlayClick}>
        <div
          className={styles.modalContainer}
          onClick={(e) => e.stopPropagation()}
        >
          <header className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>Query Details</h2>
            <button className={styles.modalClose} onClick={onClose}>
              ×
            </button>
          </header>
          <main className={styles.modalContent}>
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Question</h3>
              <p className={styles.queryText}>
                {query.query_text || 'No question text available'}
              </p>
            </div>

            {query.analyst_message && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Analyst Response</h3>
                <p className={styles.analystMessage}>{query.analyst_message}</p>
              </div>
            )}

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Generated SQL</h3>
              <pre className={styles.sqlCode}>
                <code>{query.sql_generated || 'No SQL query available'}</code>
              </pre>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Results Summary</h3>
              <div className={styles.resultsSummary}>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Rows:</span>
                  <span className={styles.summaryValue}>
                    {query.result_row_count || 0}
                  </span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Columns:</span>
                  <span className={styles.summaryValue}>
                    {resultColumns.length}
                  </span>
                </div>
              </div>
              {resultColumns.length > 0 && (
                <div className={styles.columnsList}>
                  <p className={styles.columnsLabel}>Column names:</p>
                  <div className={styles.columnTags}>
                    {resultColumns.map((col: string, idx: number) => (
                      <span key={idx} className={styles.columnTag}>
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Metadata</h3>
              <div className={styles.metadata}>
                <div className={styles.metadataItem}>
                  <span className={styles.metadataLabel}>Created:</span>
                  <span className={styles.metadataValue}>
                    {formatDate(query.createdOn || query.created_at)}
                  </span>
                </div>
                {query.id && (
                  <div className={styles.metadataItem}>
                    <span className={styles.metadataLabel}>ID:</span>
                    <span className={styles.metadataValue}>{query.id}</span>
                  </div>
                )}
              </div>
            </div>
          </main>
          <footer className={styles.modalFooter}>
            <button onClick={onClose} className={styles.closeButton}>
              Close
            </button>
            <button onClick={handleRunClick} className={styles.runButton}>
              Run Query
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default QueryDetailsModal;
