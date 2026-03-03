import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

import { RootState, useAppDispatch } from '../../reducers';
import { closeTableModal, openTableModal } from '../../reducers/chat/slice';
import { domoService } from '../../services/domoService';
import ChartView from '../ChartView/ChartView';
import styles from './TableModal.module.scss';

type ViewMode = 'table' | 'chart';

const TableModal = () => {
  const dispatch = useAppDispatch();
  const { isTableModalOpen, currentTableData } = useSelector(
    (state: RootState) => state.chat,
  );
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

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isTableModalOpen) {
        dispatch(closeTableModal());
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isTableModalOpen, dispatch]);

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

  if (!isTableModalOpen || !currentTableData) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      dispatch(closeTableModal());
    }
  };

  const handleClose = () => {
    dispatch(closeTableModal());
  };

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
        // Update the table modal with fresh data
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

  return (
    <div className={`${styles.modal} ${styles.isOpen}`}>
      <div className={styles.modalOverlay} onClick={handleOverlayClick}>
        <div
          className={styles.modalContainer}
          onClick={(e) => e.stopPropagation()}
        >
          <header className={styles.modalHeader}>
            <div className={styles.headerLeft}>
              <h2 className={styles.modalTitle}>
                Query Results ({currentTableData.rows.length} rows)
              </h2>
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
              </div>
            </div>
            <button className={styles.modalClose} onClick={handleClose}>
              ×
            </button>
          </header>
          <main className={styles.modalContent}>
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
            ) : (
              <ChartView
                columns={currentTableData.columns}
                rows={currentTableData.rows}
              />
            )}
          </main>
          <footer className={styles.modalFooter}>
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
            <button onClick={handleClose} className={styles.modalBtn}>
              Close
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default TableModal;
