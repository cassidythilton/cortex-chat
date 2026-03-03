import { useEffect, useMemo, useState } from 'react';
import Plot from 'react-plotly.js';

import styles from './ChartView.module.scss';

interface ChartViewProps {
  columns: string[];
  rows: Record<string, unknown>[];
}

type AggregationType = 'none' | 'day' | 'week' | 'month' | 'year';

// Helper to detect column types
const detectColumnType = (
  column: string,
  rows: Record<string, unknown>[],
): 'date' | 'number' | 'string' => {
  const sampleValues = rows.slice(0, 10).map((row) => row[column]);

  // Check if column name suggests it's a date
  const datePatterns = ['date', 'time', 'created', 'updated', 'timestamp'];
  const columnLower = column.toLowerCase();
  const hasDatePattern = datePatterns.some((pattern) =>
    columnLower.includes(pattern),
  );

  // If column name suggests date, verify with stricter date validation
  if (hasDatePattern) {
    const hasValidDates = sampleValues.every((val) => {
      if (!val) return false;
      const valStr = String(val);

      // Skip if it's just a plain number (like 2, 3, 4)
      if (/^\d+$/.test(valStr) && valStr.length <= 4) return false;

      // Skip short date labels like "Sep 24", "Oct 24" - these are categorical labels, not dates
      // Pattern: 3-letter month abbreviation followed by space and 2 digits
      if (/^[A-Z][a-z]{2}\s+\d{2}$/i.test(valStr)) return false;

      // Must have ISO format (YYYY-MM-DD), full date format, or timestamp
      const isoDatePattern = /^\d{4}-\d{2}-\d{2}/;
      const fullDatePattern = /^\d{4}\/\d{2}\/\d{2}/;
      const timestampPattern = /^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}/;

      if (
        !isoDatePattern.test(valStr) &&
        !fullDatePattern.test(valStr) &&
        !timestampPattern.test(valStr)
      ) {
        return false;
      }

      const date = new Date(valStr);
      // Check if it's a valid date and makes sense (not year < 1900 or > 2100)
      if (isNaN(date.getTime())) return false;
      const year = date.getFullYear();
      return year >= 1900 && year <= 2100;
    });

    if (hasValidDates) {
      return 'date';
    }
  }

  // Check if it's a number
  if (
    sampleValues.every((val) => typeof val === 'number' || !isNaN(Number(val)))
  ) {
    return 'number';
  }

  return 'string';
};

// Helper to aggregate data
const aggregateData = (
  rows: Record<string, unknown>[],
  xColumn: string,
  yColumns: string[],
  aggregation: AggregationType,
  xType: 'date' | 'number' | 'string',
) => {
  if (aggregation === 'none') {
    return rows;
  }

  if (
    xType === 'date' &&
    (aggregation === 'day' ||
      aggregation === 'week' ||
      aggregation === 'month' ||
      aggregation === 'year')
  ) {
    // Group by date aggregation
    const grouped = new Map<string, Record<string, number[]>>();

    rows.forEach((row) => {
      const dateVal = new Date(row[xColumn] as string);
      if (isNaN(dateVal.getTime())) return;

      let key: string;
      if (aggregation === 'day') {
        key = dateVal.toISOString().split('T')[0];
      } else if (aggregation === 'week') {
        const weekStart = new Date(dateVal);
        weekStart.setDate(dateVal.getDate() - dateVal.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else if (aggregation === 'month') {
        key = `${dateVal.getFullYear()}-${String(dateVal.getMonth() + 1).padStart(2, '0')}`;
      } else {
        key = String(dateVal.getFullYear());
      }

      if (!grouped.has(key)) {
        grouped.set(key, {});
        yColumns.forEach((col) => {
          grouped.get(key)![col] = [];
        });
      }

      yColumns.forEach((col) => {
        const val = Number(row[col]);
        if (!isNaN(val)) {
          grouped.get(key)![col].push(val);
        }
      });
    });

    // Convert to array and average values
    return Array.from(grouped.entries())
      .map(([key, values]) => {
        const result: Record<string, unknown> = { [xColumn]: key };
        yColumns.forEach((col) => {
          const vals = values[col];
          result[col] =
            vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        });
        return result;
      })
      .sort((a, b) => String(a[xColumn]).localeCompare(String(b[xColumn])));
  }

  // Category aggregation (for string x-axis)
  if (xType === 'string') {
    const grouped = new Map<string, Record<string, number[]>>();

    rows.forEach((row) => {
      const key = String(row[xColumn]);

      if (!grouped.has(key)) {
        grouped.set(key, {});
        yColumns.forEach((col) => {
          grouped.get(key)![col] = [];
        });
      }

      yColumns.forEach((col) => {
        const val = Number(row[col]);
        if (!isNaN(val)) {
          grouped.get(key)![col].push(val);
        }
      });
    });

    return Array.from(grouped.entries()).map(([key, values]) => {
      const result: Record<string, unknown> = { [xColumn]: key };
      yColumns.forEach((col) => {
        const vals = values[col];
        result[col] =
          vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      });
      return result;
    });
  }

  return rows;
};

const ChartView = ({ columns, rows }: ChartViewProps) => {
  const [selectedYColumns, setSelectedYColumns] = useState<string[]>([]);
  const [aggregation, setAggregation] = useState<AggregationType>('none');

  // Detect column types
  const columnTypes = useMemo(() => {
    const types: Record<string, 'date' | 'number' | 'string'> = {};
    columns.forEach((col) => {
      types[col] = detectColumnType(col, rows);
    });
    return types;
  }, [columns, rows]);

  // Auto-detect X-axis (prefer date columns)
  const xColumn = useMemo(() => {
    // First, look for date columns
    const dateColumn = columns.find((col) => columnTypes[col] === 'date');
    if (dateColumn) return dateColumn;

    // Otherwise, use first column
    return columns[0];
  }, [columns, columnTypes]);

  // Get numeric columns for Y-axis
  const numericColumns = useMemo(() => {
    return columns.filter(
      (col) => columnTypes[col] === 'number' && col !== xColumn,
    );
  }, [columns, columnTypes, xColumn]);

  // Initialize selected Y columns and aggregation based on data
  useEffect(() => {
    if (numericColumns.length > 0 && selectedYColumns.length === 0) {
      const xType = columnTypes[xColumn];

      // If x-axis is a date and we have multiple numeric columns
      if (xType === 'date' && numericColumns.length > 1) {
        // Select first 2 columns and default to month aggregation for cleaner visualization
        setSelectedYColumns(numericColumns.slice(0, 2));
        setAggregation('month');
      } else if (xType === 'date') {
        // Single numeric column with date - default to month aggregation
        setSelectedYColumns([numericColumns[0]]);
        setAggregation('month');
      } else {
        // Non-date x-axis: select up to 3 columns, no aggregation needed
        const columnsToSelect = numericColumns.slice(
          0,
          Math.min(3, numericColumns.length),
        );
        setSelectedYColumns(columnsToSelect);
      }
    }
  }, [numericColumns, columnTypes, xColumn]);

  // Determine chart type based on X-axis type
  // Also check column name for date-related keywords as fallback
  const columnNameHasDate = xColumn
    .toLowerCase()
    .match(/date|time|month|year|quarter/);
  const chartType =
    columnTypes[xColumn] === 'date' || columnNameHasDate ? 'line' : 'bar';

  // Aggregate data
  const processedData = useMemo(() => {
    return aggregateData(
      rows,
      xColumn,
      selectedYColumns,
      aggregation,
      columnTypes[xColumn],
    );
  }, [rows, xColumn, selectedYColumns, aggregation, columnTypes]);

  // Snowflake-inspired blue gradient palette
  const chartColors = [
    '#03045E', // Dark Navy
    '#0077B6', // Medium Blue
    '#00B4D8', // Bright Blue
    '#90E0EF', // Light Blue
    '#CAF0F8', // Pale Blue
  ];

  // Helper to parse month labels like "Sep 24" to sortable date
  const parseMonthLabel = (label: string): Date | null => {
    const match = label.match(/^([A-Z][a-z]{2})\s+(\d{2})$/i);
    if (match) {
      const monthMap: Record<string, number> = {
        jan: 0,
        feb: 1,
        mar: 2,
        apr: 3,
        may: 4,
        jun: 5,
        jul: 6,
        aug: 7,
        sep: 8,
        oct: 9,
        nov: 10,
        dec: 11,
      };
      const month = monthMap[match[1].toLowerCase()];
      const year = 2000 + parseInt(match[2]); // Assume 2000s for 2-digit years
      if (month !== undefined) {
        return new Date(year, month, 1);
      }
    }
    return null;
  };

  // Sort data chronologically if x-axis contains month labels
  const sortedData = useMemo(() => {
    const data = [...processedData];

    // Check if x-axis values are month labels like "Sep 24"
    const firstValue = data[0]?.[xColumn];
    if (
      firstValue &&
      typeof firstValue === 'string' &&
      /^[A-Z][a-z]{2}\s+\d{2}$/i.test(firstValue)
    ) {
      data.sort((a, b) => {
        const dateA = parseMonthLabel(String(a[xColumn]));
        const dateB = parseMonthLabel(String(b[xColumn]));
        if (dateA && dateB) {
          return dateA.getTime() - dateB.getTime();
        }
        return 0;
      });
    }

    return data;
  }, [processedData, xColumn]);

  // Prepare Plotly data
  const plotData = useMemo(() => {
    return selectedYColumns.map((yCol, index) => {
      // Convert x-values to strings to prevent date parsing by Plotly
      const xValues = sortedData.map((row) => String(row[xColumn]));
      const yValues = sortedData.map((row) => Number(row[yCol]) || 0);

      const color = chartColors[index % chartColors.length];

      return {
        x: xValues,
        y: yValues,
        type: chartType === 'line' ? 'scatter' : 'bar',
        mode: chartType === 'line' ? 'lines+markers' : undefined,
        name: yCol,
        yaxis: index === 0 ? 'y' : `y${index + 1}`,
        line:
          chartType === 'line'
            ? {
                color,
                width: 3,
              }
            : undefined,
        marker: {
          size: chartType === 'line' ? 8 : undefined,
          color,
          line:
            chartType === 'line'
              ? {
                  color: 'white',
                  width: 2,
                }
              : undefined,
        },
      };
    });
  }, [sortedData, xColumn, selectedYColumns, chartType, chartColors]);

  // Prepare layout with multiple y-axes
  const layout = useMemo(() => {
    const baseLayout: any = {
      xaxis: {
        title: {
          text: xColumn,
          font: {
            size: 12,
            family: 'Inter, sans-serif',
            weight: 600,
            color: '#64748b',
          },
        },
        // Use 'category' to preserve pre-aggregated date labels like "Dec 24"
        // Using 'date' would cause Plotly to parse as "Dec 24, 2001"
        type: 'category',
        gridcolor: 'rgba(148, 163, 184, 0.2)',
        showline: true,
        linecolor: 'rgba(148, 163, 184, 0.3)',
        tickfont: { color: '#64748b' },
      },
      yaxis: {
        title: {
          text: selectedYColumns[0] || 'Value',
          font: {
            size: 12,
            family: 'Inter, sans-serif',
            weight: 600,
            color: '#64748b',
          },
        },
        gridcolor: 'rgba(148, 163, 184, 0.2)',
        showline: true,
        linecolor: 'rgba(148, 163, 184, 0.3)',
        tickfont: { color: '#64748b' },
      },
      showlegend: selectedYColumns.length > 1,
      legend: {
        orientation: 'h',
        yanchor: 'bottom',
        y: 1.02,
        xanchor: 'right',
        x: 1,
        font: { size: 11, family: 'Inter, sans-serif', color: '#64748b' },
      },
      height: 500,
      margin: { l: 70, r: 70, t: 50, b: 80 },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      font: { family: 'Inter, sans-serif', size: 11, color: '#64748b' },
      hovermode: 'x unified',
    };

    // Add additional y-axes for multiple series
    if (selectedYColumns.length > 1) {
      selectedYColumns.slice(1).forEach((col, index) => {
        baseLayout[`yaxis${index + 2}`] = {
          title: {
            text: col,
            font: {
              size: 12,
              family: 'Inter, sans-serif',
              weight: 600,
              color: '#64748b',
            },
          },
          overlaying: 'y',
          side: index % 2 === 0 ? 'right' : 'left',
          position:
            index % 2 === 0 ? 1 - (index + 1) * 0.05 : (index + 1) * 0.05,
          gridcolor: 'rgba(148, 163, 184, 0.2)',
          showline: true,
          linecolor: 'rgba(148, 163, 184, 0.3)',
          tickfont: { color: '#64748b' },
        };
      });
    }

    return baseLayout;
  }, [xColumn, selectedYColumns, chartType, columnTypes]);

  const handleYColumnToggle = (column: string) => {
    setSelectedYColumns((prev) =>
      prev.includes(column)
        ? prev.filter((c) => c !== column)
        : [...prev, column],
    );
  };

  return (
    <div className={styles.chartView}>
      <div className={styles.chartContainer}>
        {selectedYColumns.length > 0 ? (
          <Plot
            data={plotData as any}
            layout={layout}
            config={{
              responsive: true,
              displaylogo: false,
              modeBarButtonsToRemove: ['lasso2d', 'select2d'],
            }}
            style={{ width: '100%', height: '100%' }}
            useResizeHandler={true}
          />
        ) : (
          <div className={styles.emptyState}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 11L12 14L22 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p>
              Select at least one Y-axis column below to visualize the data.
            </p>
          </div>
        )}
      </div>

      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Y-Axis Columns</label>
          <div className={styles.columnSelector}>
            {numericColumns.length > 0 ? (
              numericColumns.map((col) => {
                // Truncate long column names for display
                const displayName =
                  col.length > 20 ? `${col.substring(0, 17)}...` : col;
                return (
                  <button
                    key={col}
                    onClick={() => handleYColumnToggle(col)}
                    className={`${styles.columnButton} ${selectedYColumns.includes(col) ? styles.selected : ''}`}
                    title={col} // Show full name on hover
                  >
                    {displayName}
                  </button>
                );
              })
            ) : (
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                No numeric columns available
              </span>
            )}
          </div>
        </div>

        {columnTypes[xColumn] === 'date' && (
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel}>Time Aggregation</label>
            <select
              value={aggregation}
              onChange={(e) =>
                setAggregation(e.target.value as AggregationType)
              }
              className={styles.select}
            >
              <option value="none">None (Raw Data)</option>
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
              <option value="year">Yearly</option>
            </select>
          </div>
        )}

        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>X-Axis</label>
          <div className={styles.xAxisLabel}>
            <span>Column:</span>
            <span className={styles.xAxisValue}>{xColumn}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartView;
