import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

import { RootState, useAppDispatch } from '../../reducers';
import { openTableModal } from '../../reducers/chat/slice';
import { domoService } from '../../services/domoService';
import ChartView from '../ChartView/ChartView';
import QueryDetailsView from '../QueryDetailsView/QueryDetailsView';
import styles from './QueryResultsPanel.module.scss';

type ViewMode = 'table' | 'chart' | 'details';

interface QueryResultsPanelProps {
  queryText?: string;
  onClose: () => void;
}

const QueryResultsPanel = ({ queryText, onClose }: QueryResultsPanelProps) => {
  const dispatch = useAppDispatch();
  const { currentTableData } = useSelector((state: RootState) => state.chat);
  const gridRef = useRef<AgGridReact>(null);
  const [isRerunning, setIsRerunning] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect theme changes
  useEffect(() => {
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      setIsDarkMode(theme === 'dark');
    };

    checkTheme();

    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, []);

  // Prepare column definitions for AG Grid
  const columnDefs = useMemo(() => {
    if (!currentTableData) return [];
    return currentTableData.columns.map((col) => ({
      field: col,
      headerName: col,
      sortable: true,
      filter: true,
      resizable: true,
      valueFormatter: (params: any) => {
        if (params.value === null || params.value === undefined) return '';
        if (typeof params.value === 'number') {
          const rounded = Number.isInteger(params.value)
            ? params.value
            : parseFloat(params.value.toFixed(2));
          return rounded.toLocaleString();
        }
        return String(params.value);
      },
    }));
  }, [currentTableData]);

  // Default column properties
  const defaultColDef = useMemo(
    () => ({
      flex: 1,
      minWidth: 100,
      sortable: true,
      filter: true,
      resizable: true,
    }),
    [],
  );

  const handleExport = () => {
    if (gridRef.current) {
      gridRef.current.api.exportDataAsCsv({
        fileName: `query-results-${Date.now()}.csv`,
      });
    }
  };

  const handleRerun = async () => {
    if (!currentTableData?.sql) {
      console.error('No SQL query available to rerun');
      return;
    }

    setIsRerunning(true);
    try {
      const response = await domoService.executeStoredSql(currentTableData.sql);

      if (response.success && response.columns && response.rows) {
        // Update the table with fresh data
        dispatch(
          openTableModal({
            columns: response.columns,
            rows: response.rows,
            sql: currentTableData.sql,
          }),
        );
      } else {
        console.error('Failed to rerun query');
      }
    } catch (error) {
      console.error('Error rerunning query:', error);
    } finally {
      setIsRerunning(false);
    }
  };

  if (!currentTableData) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>No results to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <button
            className={styles.backButton}
            onClick={onClose}
            title="Back to query history"
          >
            ← Back
          </button>
          <h2 className={styles.title}>Query Results</h2>
        </div>
        {queryText && (
          <div className={styles.queryTextContainer}>
            <span className={styles.queryLabel}>Question:</span>
            <p className={styles.queryText}>{queryText}</p>
          </div>
        )}
        <div className={styles.resultInfo}>
          <span className={styles.resultCount}>
            {currentTableData.rows.length} rows,{' '}
            {currentTableData.columns.length} columns
          </span>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.toggleButton} ${viewMode === 'table' ? styles.active : ''}`}
              onClick={() => setViewMode('table')}
            >
              Table
            </button>
            <button
              className={`${styles.toggleButton} ${viewMode === 'chart' ? styles.active : ''}`}
              onClick={() => setViewMode('chart')}
            >
              Chart
            </button>
            <button
              className={`${styles.toggleButton} ${viewMode === 'details' ? styles.active : ''}`}
              onClick={() => setViewMode('details')}
            >
              Details
            </button>
          </div>
        </div>
      </header>

      <div className={styles.gridWrapper}>
        {viewMode === 'table' ? (
          <div
            className={`ag-theme-quartz ${isDarkMode ? 'ag-theme-quartz-dark' : ''} ${styles.gridContainer}`}
          >
            <AgGridReact
              ref={gridRef}
              rowData={currentTableData.rows}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              pagination={true}
              paginationPageSize={20}
              paginationPageSizeSelector={[10, 20, 50, 100]}
              enableCellTextSelection={true}
              ensureDomOrder={true}
              rowHeight={52}
              headerHeight={48}
            />
          </div>
        ) : viewMode === 'chart' ? (
          <div className={styles.chartWrapper}>
            <ChartView
              columns={currentTableData.columns}
              rows={currentTableData.rows}
            />
          </div>
        ) : (
          <QueryDetailsView
            queryText={queryText}
            sql={currentTableData.logicalSql || currentTableData.sql}
            analystMessage={currentTableData.analystMessage}
            columns={currentTableData.columns}
            rowCount={currentTableData.rows.length}
          />
        )}
      </div>

      <footer className={styles.footer}>
        {currentTableData?.sql && (
          <button
            onClick={handleRerun}
            className={styles.rerunButton}
            disabled={isRerunning}
          >
            {isRerunning ? 'Rerunning...' : 'Rerun Query'}
          </button>
        )}
        <button onClick={handleExport} className={styles.exportButton}>
          Export CSV
        </button>
      </footer>
    </div>
  );
};

export default QueryResultsPanel;
