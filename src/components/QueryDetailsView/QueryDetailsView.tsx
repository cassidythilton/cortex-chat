import styles from './QueryDetailsView.module.scss';

interface QueryDetailsViewProps {
  queryText?: string;
  sql?: string; // Display SQL (logical SQL)
  analystMessage?: string;
  columns?: string[];
  rowCount?: number;
}

export const QueryDetailsView: React.FC<QueryDetailsViewProps> = ({
  queryText,
  sql,
  analystMessage,
  columns,
  rowCount,
}) => {
  return (
    <div className={styles.container}>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>QUESTION</h3>
        <div className={styles.content}>
          {queryText || 'No question available'}
        </div>
      </section>

      {analystMessage && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>ANALYST RESPONSE</h3>
          <div className={styles.content}>{analystMessage}</div>
        </section>
      )}

      {sql && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>GENERATED SQL</h3>
          <pre className={styles.codeBlock}>
            <code>{sql}</code>
          </pre>
        </section>
      )}

      {columns && columns.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>RESULTS SUMMARY</h3>
          <div className={styles.summary}>
            <div className={styles.summaryRow}>
              <span className={styles.label}>Rows:</span>
              <span className={styles.value}>{rowCount || 0}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.label}>Columns:</span>
              <span className={styles.value}>{columns.length}</span>
            </div>
          </div>
          <div className={styles.columnList}>
            <h4 className={styles.columnListTitle}>Column names:</h4>
            <div className={styles.badges}>
              {columns.map((col, index) => (
                <span key={index} className={styles.badge}>
                  {col}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>METADATA</h3>
        <div className={styles.metadata}>
          <div className={styles.metadataRow}>
            <span className={styles.label}>Created:</span>
            <span className={styles.value}>
              {new Date().toLocaleString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                hour12: true,
              })}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default QueryDetailsView;
