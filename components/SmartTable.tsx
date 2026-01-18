import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Search, ArrowUpDown, Layers, SortAsc, SortDesc, List, X, ArrowRightLeft, Filter, Calculator, Sigma, LayoutList, Hash, Maximize2, Minimize2, Settings2, GripHorizontal, Check, ChevronsUpDown } from 'lucide-react';
import { SemanticData } from '../types';

interface SmartTableProps {
  data: SemanticData;
}

type SortDirection = 'asc' | 'desc';
type AggregationType = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'unique' | 'mode' | 'none';
type FilterOperator = 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'isEmpty' | 'isNotEmpty' | 'gt' | 'lt' | 'neq';

interface FilterState {
  value: string;
  operator: FilterOperator;
}

// Helper to check if a string represents a number
const isNumeric = (val: any): boolean => {
  if (Array.isArray(val)) return false;
  if (val === null || val === undefined || val === '') return false;
  return !isNaN(parseFloat(val)) && isFinite(val);
};

export const SmartTable: React.FC<SmartTableProps> = ({ data }) => {
  // Local state
  const [tableData, setTableData] = useState(data.data);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: SortDirection } | null>(null);
  
  // Filters
  const [columnFilters, setColumnFilters] = useState<Record<string, FilterState>>({});
  const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null);

  const [groupByKey, setGroupByKey] = useState<string | null>(null);
  const [isTransposed, setIsTransposed] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // View Toggles
  const [showColumnSummary, setShowColumnSummary] = useState(true);
  const [showRowSummary, setShowRowSummary] = useState(false);
  const [showRowNumbers, setShowRowNumbers] = useState(false);

  // Aggregation State
  const [columnAggregations, setColumnAggregations] = useState<Record<string, AggregationType>>({});

  // Column Reordering State
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [draggingColumn, setDraggingColumn] = useState<string | null>(null);

  // Editing State
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; colKey: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const editInputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Sync props
  useEffect(() => {
    setTableData(data.data);
    setGroupByKey(null);
    setSortConfig(null);
    setIsTransposed(false);
    setColumnFilters({});
    setColumnAggregations({});
    // Initialize column order based on default data order
    setColumnOrder(data.columns.map(c => c.key));
  }, [data]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingCell]);

  // Handle Escape key to exit full screen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
          if (activeFilterColumn) {
              setActiveFilterColumn(null);
          } else if (isFullScreen) {
              setIsFullScreen(false);
          }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen, activeFilterColumn]);

  // --- Handlers ---

  const handleCellSort = (rowIndex: number, key: string, direction: SortDirection) => {
    if (isTransposed) return;
    const newData = [...tableData];
    const cellValue = newData[rowIndex][key];

    if (Array.isArray(cellValue)) {
      const sortedArray = [...cellValue].sort((a, b) => {
        return direction === 'asc' 
          ? String(a).localeCompare(String(b))
          : String(b).localeCompare(String(a));
      });
      newData[rowIndex] = { ...newData[rowIndex], [key]: sortedArray };
      setTableData(newData);
    }
  };

  const handleSort = (key: string) => {
    if (isTransposed) return;
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const toggleFilter = (key: string) => {
      if (activeFilterColumn === key) {
          setActiveFilterColumn(null);
      } else {
          setActiveFilterColumn(key);
      }
  };

  const handleFilterChange = (key: string, updates: Partial<FilterState>) => {
      setColumnFilters(prev => {
          const current = prev[key] || { value: '', operator: 'contains' };
          const newState = { ...current, ...updates };
          
          const next = { ...prev };
          
          // If value is empty and operator requires value, treat as clearing filter for logic but maybe keep state?
          // We'll just update the state. The processing logic handles empty values.
          // However, to keep it clean, if value is empty and operator is NOT empty/isNotEmpty, we can consider it "inactive" effectively, 
          // but let's persist the operator choice for UX.
          
          if (!newState.value && !['isEmpty', 'isNotEmpty'].includes(newState.operator)) {
               delete next[key];
          } else {
               next[key] = newState;
          }
          return next;
      });
  };

  const clearFilter = (key: string) => {
    setColumnFilters(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
    });
    setActiveFilterColumn(null);
  };

  const toggleFullScreen = () => {
      setIsFullScreen(!isFullScreen);
  };

  // --- Edit Handlers ---

  const startEditing = (rowIndex: number, colKey: string, currentValue: any) => {
    if (isTransposed) return;
    setEditingCell({ rowIndex, colKey });
    
    // Format value for editing
    if (Array.isArray(currentValue)) {
      setEditValue(currentValue.join('\n'));
    } else if (typeof currentValue === 'object' && currentValue !== null) {
      setEditValue(JSON.stringify(currentValue, null, 2));
    } else {
      setEditValue(String(currentValue ?? ''));
    }
  };

  const cancelEditing = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const saveEditing = () => {
    if (!editingCell) return;
    
    const { rowIndex, colKey } = editingCell;
    const newData = [...tableData];
    const originalValue = newData[rowIndex][colKey];
    
    let newValue: any = editValue;

    // Parse based on original type or content structure
    if (Array.isArray(originalValue)) {
      // Convert newline separated string back to array
      newValue = editValue.split('\n').map(item => item.trim()).filter(item => item !== '');
    } else if (isNumeric(editValue) && typeof originalValue === 'number') {
       // Attempt to preserve number type if original was number
       newValue = parseFloat(editValue);
    }

    newData[rowIndex] = { ...newData[rowIndex], [colKey]: newValue };
    setTableData(newData);
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      cancelEditing();
    } else if (e.key === 'Enter' && !e.shiftKey && !Array.isArray(tableData[editingCell!.rowIndex][editingCell!.colKey])) {
       // Save on Enter for simple fields, allow Enter for newlines in Arrays (Textarea)
       e.preventDefault();
       saveEditing();
    } else if (e.key === 'Enter' && e.ctrlKey) {
       // Ctrl+Enter to save textarea
       saveEditing();
    }
  };

  // --- Drag and Drop Handlers ---

  const handleDragStart = (e: React.DragEvent, key: string) => {
      if (isTransposed) return; // Disable reordering in transposed view
      setDraggingColumn(key);
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault(); // Necessary to allow dropping
      e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetKey: string) => {
      e.preventDefault();
      if (!draggingColumn || draggingColumn === targetKey) {
          setDraggingColumn(null);
          return;
      }

      const newOrder = [...columnOrder];
      const draggedIdx = newOrder.indexOf(draggingColumn);
      const targetIdx = newOrder.indexOf(targetKey);

      if (draggedIdx > -1 && targetIdx > -1) {
          newOrder.splice(draggedIdx, 1); // Remove dragged
          newOrder.splice(targetIdx, 0, draggingColumn); // Insert at target
          setColumnOrder(newOrder);
      }
      setDraggingColumn(null);
  };


  // --- Data Processing ---

  const processedData = useMemo(() => {
    let processed = [...tableData];

    // 1. Apply Column Filters
    if (Object.keys(columnFilters).length > 0) {
        processed = processed.filter(row => {
            return Object.entries(columnFilters).every(([key, filter]) => {
                const { value: filterValue, operator } = filter;
                const rowVal = row[key];
                
                // Prepare values
                const strVal = Array.isArray(rowVal) ? rowVal.join(' ') : String(rowVal ?? '');
                const numVal = isNumeric(rowVal) ? parseFloat(rowVal) : NaN;
                const numFilter = isNumeric(filterValue) ? parseFloat(filterValue) : NaN;

                switch (operator) {
                    case 'contains': 
                        return strVal.toLowerCase().includes(filterValue.toLowerCase());
                    case 'equals': 
                        return strVal.toLowerCase() === filterValue.toLowerCase();
                    case 'startsWith': 
                        return strVal.toLowerCase().startsWith(filterValue.toLowerCase());
                    case 'endsWith': 
                        return strVal.toLowerCase().endsWith(filterValue.toLowerCase());
                    case 'neq': 
                        return strVal.toLowerCase() !== filterValue.toLowerCase();
                    case 'isEmpty': 
                        return !strVal.trim();
                    case 'isNotEmpty': 
                        return !!strVal.trim();
                    case 'gt':
                        if (isNaN(numVal) || isNaN(numFilter)) return false;
                        return numVal > numFilter;
                    case 'lt':
                        if (isNaN(numVal) || isNaN(numFilter)) return false;
                        return numVal < numFilter;
                    default: 
                        return true;
                }
            });
        });
    }

    // 2. Sort Rows
    if (sortConfig) {
      processed.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];

        if (isNumeric(aVal) && isNumeric(bVal)) {
            return sortConfig.direction === 'asc' 
                ? parseFloat(aVal) - parseFloat(bVal) 
                : parseFloat(bVal) - parseFloat(aVal);
        }

        const aStr = Array.isArray(aVal) ? aVal.join(' ') : String(aVal || '');
        const bStr = Array.isArray(bVal) ? bVal.join(' ') : String(bVal || '');

        if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return processed;
  }, [tableData, columnFilters, sortConfig]);

  // --- Transpose Logic ---
  const transposedView = useMemo(() => {
    if (!isTransposed) return null;

    const useFirstColAsHeader = data.columns.length > 1;
    const headerCol = useFirstColAsHeader ? data.columns[0] : null;

    const newColumns = [
        { key: 'field_name', label: headerCol ? headerCol.label : 'Field' }
    ];

    processedData.forEach((row, idx) => {
        let label = `Record ${idx + 1}`;
        if (headerCol) {
            const val = row[headerCol.key];
            const strVal = (val !== null && val !== undefined) 
                ? (Array.isArray(val) ? val.join(', ') : String(val))
                : '';
            if (strVal.trim()) {
                label = strVal.length > 40 ? strVal.substring(0, 37) + '...' : strVal;
            }
        }
        newColumns.push({ key: `record_${idx}`, label });
    });

    const colsToTranspose = useFirstColAsHeader ? data.columns.slice(1) : data.columns;
    const newData = colsToTranspose.map(col => {
        const rowObj: Record<string, any> = { field_name: col.label };
        processedData.forEach((record, idx) => {
            rowObj[`record_${idx}`] = record[col.key];
        });
        return rowObj;
    });

    return { columns: newColumns, data: newData };
  }, [isTransposed, processedData, data.columns]);


  // --- Grouping Logic ---
  const groupedData = useMemo(() => {
    if (!groupByKey || isTransposed) return null;
    const groups: Record<string, typeof tableData> = {};
    processedData.forEach(row => {
        const groupVal = String(row[groupByKey] || 'Uncategorized');
        if (!groups[groupVal]) groups[groupVal] = [];
        groups[groupVal].push(row);
    });
    return groups;
  }, [processedData, groupByKey, isTransposed]);


  // --- Active View determination ---
  
  // If transposed, use transposed columns. If not, use data.columns sorted by columnOrder
  const activeColumns = useMemo(() => {
      if (isTransposed && transposedView) return transposedView.columns;
      
      // Apply custom order
      if (columnOrder.length === 0) return data.columns;

      const ordered = [...data.columns].sort((a, b) => {
          const idxA = columnOrder.indexOf(a.key);
          const idxB = columnOrder.indexOf(b.key);
          return (idxA === -1 ? 9999 : idxA) - (idxB === -1 ? 9999 : idxB);
      });
      return ordered;
  }, [isTransposed, transposedView, data.columns, columnOrder]);

  const activeRows = isTransposed && transposedView ? transposedView.data : processedData;


  // --- Aggregation Logic ---
  
  const getAutoAggregation = (key: string): AggregationType => {
      const sampleSize = Math.min(activeRows.length, 10);
      let numCount = 0;
      for(let i=0; i<sampleSize; i++) {
          if (isNumeric(activeRows[i][key])) numCount++;
      }
      return numCount > sampleSize * 0.5 ? 'sum' : 'unique';
  };

  const calculateAggregation = (key: string, type: AggregationType) => {
      if (type === 'none') return null;
      
      const values = activeRows.map(r => r[key]).filter(v => v !== null && v !== undefined && v !== '');
      if (values.length === 0) return '-';

      if (['count', 'unique', 'mode'].includes(type)) {
          const allItems: string[] = [];
           values.forEach(v => {
              if (Array.isArray(v)) allItems.push(...v.map(String));
              else allItems.push(String(v));
          });
          
          if (type === 'count') return allItems.length.toLocaleString();
          if (type === 'unique') return new Set(allItems).size.toLocaleString();
          if (type === 'mode') {
               const freq: Record<string, number> = {};
               let maxFreq = 0;
               let mode = '-';
               allItems.forEach(i => {
                   freq[i] = (freq[i] || 0) + 1;
                   if (freq[i] > maxFreq) {
                       maxFreq = freq[i];
                       mode = i;
                   }
               });
               return mode;
          }
      }

      const numbers = values.map(v => parseFloat(v)).filter(n => !isNaN(n));
      
      if (type === 'sum') return numbers.reduce((a,b)=>a+b,0).toLocaleString(undefined, {maximumFractionDigits: 2});
      if (type === 'avg') return (numbers.reduce((a,b)=>a+b,0)/(numbers.length || 1)).toLocaleString(undefined, {maximumFractionDigits: 2});
      if (type === 'min') return numbers.length ? Math.min(...numbers).toLocaleString() : '-';
      if (type === 'max') return numbers.length ? Math.max(...numbers).toLocaleString() : '-';

      return '-';
  };

  const renderFooterCell = (colKey: string) => {
      let activeType = columnAggregations[colKey];
      if (!activeType) {
          activeType = getAutoAggregation(colKey);
      }

      const value = calculateAggregation(colKey, activeType);

      return (
          <div className="flex flex-col gap-1">
               <div className="flex items-center justify-between group/footer">
                  <span className="text-[10px] uppercase text-slate-500 font-semibold tracking-wider">{activeType}</span>
                  <div className="relative">
                       <select 
                          className="absolute inset-0 w-full opacity-0 cursor-pointer"
                          value={activeType}
                          onChange={(e) => setColumnAggregations(prev => ({...prev, [colKey]: e.target.value as AggregationType}))}
                       >
                           <option value="sum">Sum</option>
                           <option value="avg">Average</option>
                           <option value="min">Min</option>
                           <option value="max">Max</option>
                           <option value="count">Count Items</option>
                           <option value="unique">Count Unique</option>
                           <option value="mode">Mode (Most Frequent)</option>
                           <option value="none">None</option>
                       </select>
                       <Settings2 className="w-3 h-3 text-slate-600 hover:text-indigo-400 cursor-pointer" />
                  </div>
               </div>
               <div className="font-mono text-xs font-medium text-indigo-300 truncate" title={String(value)}>
                   {value}
               </div>
          </div>
      );
  };

  // Row Stats
  const getRowStats = (row: Record<string, any>) => {
      const keysToIgnore = isTransposed ? ['field_name'] : [activeColumns[0].key];
      const values = Object.entries(row)
          .filter(([k]) => !keysToIgnore.includes(k))
          .map(([, v]) => v);

      const numericValues = values.filter(isNumeric).map(v => parseFloat(v));
      
      if (numericValues.length > 0 && numericValues.length >= values.length / 2) {
           const sum = numericValues.reduce((a, b) => a + b, 0);
           const avg = sum / numericValues.length;
           return (
               <div className="text-xs space-y-1">
                   <div title="Sum"><Sigma className="inline w-3 h-3 mr-1 text-indigo-400"/>{sum.toFixed(1)}</div>
                   <div title="Average"><Calculator className="inline w-3 h-3 mr-1 text-indigo-400"/>{avg.toFixed(1)}</div>
               </div>
           );
      }
      
      let totalItems = 0;
      values.forEach(v => {
          if (Array.isArray(v)) totalItems += v.length;
          else if (v) totalItems += 1;
      });

      return (
          <div className="text-xs space-y-1">
              <div title="Total Items"><Hash className="inline w-3 h-3 mr-1 text-emerald-400"/>{totalItems} items</div>
          </div>
      );
  };


  // --- Rendering ---

  const renderCellContent = (row: any, rowIndex: number, colKey: string) => {
    const isEditable = !isTransposed;
    const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.colKey === colKey;
    const value = row[colKey];

    if (isEditing) {
      const isList = Array.isArray(value);
      const isTextArea = isList || String(value).length > 50;
      
      return (
        <div className="relative min-w-[150px]">
          {isTextArea ? (
            <textarea
              ref={editInputRef as React.RefObject<HTMLTextAreaElement>}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={saveEditing}
              className={`w-full bg-slate-800 text-slate-100 text-sm border border-indigo-500 rounded p-1.5 focus:outline-none resize-none ${isList ? 'min-h-[120px]' : ''}`}
              placeholder={isList ? "Enter items separated by new lines..." : "Enter value..."}
            />
          ) : (
            <input
              ref={editInputRef as React.RefObject<HTMLInputElement>}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={saveEditing}
              className="w-full bg-slate-800 text-slate-100 text-sm border border-indigo-500 rounded p-1.5 focus:outline-none resize-none"
              placeholder="Enter value..."
            />
          )}
          <div className="absolute right-1 bottom-1 flex gap-1">
              <button onMouseDown={(e) => { e.preventDefault(); saveEditing(); }} className="p-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded shadow-sm" title="Save">
                  <Check className="w-3 h-3" />
              </button>
              <button onMouseDown={(e) => { e.preventDefault(); cancelEditing(); }} className="p-1 bg-slate-700 hover:bg-slate-600 text-white rounded shadow-sm" title="Cancel">
                  <X className="w-3 h-3" />
              </button>
          </div>
        </div>
      );
    }

    if (Array.isArray(value)) {
        return (
            <div 
                className={`group relative min-w-[200px] ${isEditable ? 'cursor-pointer hover:bg-slate-800/50 rounded -m-2 p-2 transition-colors' : ''}`}
                onDoubleClick={() => startEditing(rowIndex, colKey, value)}
                title={isEditable ? "Double-click to edit list" : ""}
            >
                 {isEditable && (
                    <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 rounded shadow-sm border border-slate-700 flex gap-0.5 p-0.5 z-10">
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleCellSort(tableData.indexOf(row), colKey, 'asc'); }}
                            className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-indigo-400" 
                            title="Sort list A-Z"
                        >
                            <SortAsc className="w-3 h-3" />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleCellSort(tableData.indexOf(row), colKey, 'desc'); }}
                            className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-indigo-400" 
                            title="Sort list Z-A"
                        >
                            <SortDesc className="w-3 h-3" />
                        </button>
                    </div>
                 )}
                <ul className="list-disc list-inside space-y-1">
                    {value.map((item, i) => (
                        <li key={i} className="text-sm text-slate-300 leading-relaxed break-words">
                            {String(item)}
                        </li>
                    ))}
                </ul>
            </div>
        );
    }

    if (typeof value === 'object' && value !== null) {
        return <pre className="text-xs text-slate-400 font-mono">{JSON.stringify(value, null, 2)}</pre>;
    }

    return (
        <div 
            className={`${isEditable ? 'cursor-pointer hover:bg-slate-800/50 rounded -m-2 p-2 transition-colors min-h-[1.5rem]' : ''}`}
            onDoubleClick={() => startEditing(rowIndex, colKey, value)}
            title={isEditable ? "Double-click to edit" : ""}
        >
            <span className="text-sm text-slate-300 whitespace-pre-wrap font-medium">{String(value)}</span>
        </div>
    );
  };

  // Class logic for Full Screen
  const containerClass = isFullScreen 
      ? "fixed inset-0 z-[100] bg-slate-950 flex flex-col h-screen w-screen rounded-none" 
      : "bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-full shadow-sm relative transition-all";

  return (
    <div className={containerClass}>
      {/* Toolbar */}
      <div className="p-4 border-b border-slate-800 flex flex-col xl:flex-row gap-4 justify-between shrink-0 bg-slate-950/50 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
             <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                Semantic Explorer
            </h3>
            
            {/* View Toggles */}
            <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-0.5 ml-2">
                <button 
                    onClick={() => setShowRowNumbers(!showRowNumbers)}
                    disabled={isTransposed}
                    className={`p-1.5 rounded transition-colors ${isTransposed ? 'opacity-50 cursor-not-allowed' : ''} ${showRowNumbers && !isTransposed ? 'bg-slate-800 text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
                    title="Toggle Row Numbers"
                >
                    <Hash className="w-4 h-4" />
                </button>
                <button 
                    onClick={() => setShowColumnSummary(!showColumnSummary)}
                    className={`p-1.5 rounded transition-colors ${showColumnSummary ? 'bg-slate-800 text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
                    title="Toggle Column Summaries (Footer)"
                >
                    <LayoutList className="w-4 h-4" />
                </button>
                <button 
                    onClick={() => setShowRowSummary(!showRowSummary)}
                    className={`p-1.5 rounded transition-colors ${showRowSummary ? 'bg-slate-800 text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
                    title="Toggle Row Insights (Right Column)"
                >
                    <Calculator className="w-4 h-4" />
                </button>
            </div>

            {groupByKey && !isTransposed && (
                 <span className="text-xs px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30 flex items-center gap-1">
                    Grouped by: {data.columns.find(c => c.key === groupByKey)?.label || groupByKey}
                    <button onClick={() => setGroupByKey(null)} className="hover:text-white"><X className="w-3 h-3"/></button>
                 </span>
            )}
        </div>
       
        <div className="flex flex-wrap items-center gap-3">
             <button
                onClick={toggleFullScreen}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    isFullScreen 
                    ? 'bg-indigo-500 text-white border-indigo-600' 
                    : 'bg-slate-950 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
                title={isFullScreen ? "Exit Full Screen (Esc)" : "Full Screen Table"}
            >
                {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
                onClick={() => {
                    setIsTransposed(!isTransposed);
                    setGroupByKey(null); 
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    isTransposed 
                    ? 'bg-teal-500/10 text-teal-400 border-teal-500/30' 
                    : 'bg-slate-950 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
            >
                <ArrowRightLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Swap Axes</span>
            </button>

            <div className={`relative group ${isTransposed ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Layers className="w-4 h-4 text-slate-500" />
                </div>
                <select
                    value={groupByKey || ''}
                    onChange={(e) => setGroupByKey(e.target.value || null)}
                    disabled={isTransposed}
                    className="bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-8 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer hover:bg-slate-900 w-40"
                >
                    <option value="">Group By...</option>
                    {data.columns.map(col => (
                        <option key={col.key} value={col.key}>{col.label}</option>
                    ))}
                </select>
            </div>
        </div>
      </div>
      
      {/* Table Area */}
      <div className="overflow-auto flex-1 bg-slate-950/30 relative scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-950 sticky top-0 z-30 shadow-sm">
            <tr>
              {showRowNumbers && !isTransposed && (
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-800 sticky left-0 top-0 z-50 bg-slate-950 w-12 text-center border-r border-slate-800/50">
                    #
                </th>
              )}
              {activeColumns.map((col) => (
                <th
                  key={col.key}
                  draggable={!isTransposed}
                  onDragStart={(e) => handleDragStart(e, col.key)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, col.key)}
                  className={`p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider select-none border-b border-slate-800 whitespace-nowrap group 
                    ${isTransposed && col.key === 'field_name' ? 'bg-slate-900 sticky left-0 z-40 border-r border-slate-800' : ''}
                    ${draggingColumn === col.key ? 'opacity-50 bg-slate-800' : ''}
                    ${!isTransposed ? 'cursor-grab active:cursor-grabbing' : ''}
                  `}
                >
                  <div className="flex flex-col gap-2 min-w-[180px]">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 overflow-hidden">
                            {!isTransposed && <GripHorizontal className="w-3 h-3 text-slate-600 cursor-grab active:cursor-grabbing shrink-0" />}
                            <span className="truncate" title={col.label}>{col.label}</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => handleSort(col.key)}
                                className="p-1 hover:bg-slate-800 rounded hover:text-indigo-400 transition-colors"
                                title="Sort"
                            >
                                {!isTransposed && sortConfig?.key === col.key ? (
                                    sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-indigo-400" /> : <ChevronDown className="w-3 h-3 text-indigo-400" />
                                ) : (
                                    <ArrowUpDown className="w-3 h-3" />
                                )}
                            </button>
                            <button 
                                onClick={() => toggleFilter(col.key)}
                                className={`p-1 hover:bg-slate-800 rounded transition-colors ${columnFilters[col.key] ? 'text-indigo-400 opacity-100' : 'hover:text-indigo-400'}`}
                                title="Filter"
                            >
                                <Filter className="w-3 h-3" />
                            </button>
                        </div>
                      </div>
                      
                      {/* Expanded Filter Menu */}
                      {activeFilterColumn === col.key && (
                          <div className="mt-2 p-3 bg-slate-900/50 border border-slate-700 rounded-lg space-y-2 shadow-inner animate-fade-in">
                              <select 
                                  value={columnFilters[col.key]?.operator || 'contains'}
                                  onChange={(e) => handleFilterChange(col.key, { operator: e.target.value as FilterOperator })}
                                  className="w-full bg-slate-950 border border-slate-800 text-xs rounded p-1.5 text-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none"
                              >
                                  <option value="contains">Contains</option>
                                  <option value="equals">Equals</option>
                                  <option value="startsWith">Starts With</option>
                                  <option value="endsWith">Ends With</option>
                                  <option value="neq">Not Equals</option>
                                  <option value="gt">Greater Than {'>'}</option>
                                  <option value="lt">Less Than {'<'}</option>
                                  <option value="isEmpty">Is Empty</option>
                                  <option value="isNotEmpty">Is Not Empty</option>
                              </select>
                              
                              {!['isEmpty', 'isNotEmpty'].includes(columnFilters[col.key]?.operator || 'contains') && (
                                  <input 
                                    type="text"
                                    autoFocus
                                    placeholder="Value..."
                                    value={columnFilters[col.key]?.value || ''}
                                    onChange={(e) => handleFilterChange(col.key, { value: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 text-xs rounded p-1.5 text-white focus:border-indigo-500 focus:outline-none placeholder-slate-600"
                                  />
                              )}
                              
                              <div className="flex justify-between pt-1">
                                  <button 
                                    onClick={() => clearFilter(col.key)}
                                    className="text-[10px] text-slate-500 hover:text-red-400 transition-colors"
                                  >
                                    Clear Filter
                                  </button>
                                  <button 
                                    onClick={() => setActiveFilterColumn(null)}
                                    className="text-[10px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                                  >
                                    Done
                                  </button>
                              </div>
                          </div>
                      )}
                  </div>
                </th>
              ))}
              {/* Row Summary Header */}
              {showRowSummary && (
                  <th className="p-4 text-xs font-semibold text-indigo-400 uppercase tracking-wider border-b border-slate-800 sticky right-0 bg-slate-950 z-30 border-l border-slate-800/50">
                      Row Insights
                  </th>
              )}
            </tr>
          </thead>
          
          <tbody className="divide-y divide-slate-800">
            {groupByKey && groupedData ? (
                // Grouped View
                Object.entries(groupedData).map(([groupName, rows]) => (
                    <React.Fragment key={groupName}>
                        <tr className="bg-slate-900/80">
                            <td colSpan={activeColumns.length + (showRowSummary ? 1 : 0) + (showRowNumbers && !isTransposed ? 1 : 0)} className="p-3 border-b border-slate-800">
                                <div className="flex items-center gap-2 font-medium text-indigo-300">
                                    <List className="w-4 h-4" />
                                    {data.columns.find(c => c.key === groupByKey)?.label}: <span className="text-white ml-1">{groupName}</span>
                                    <span className="text-xs text-slate-500 ml-2 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                                        {rows.length}
                                    </span>
                                </div>
                            </td>
                        </tr>
                        {rows.map((row, idx) => (
                             <tr key={`${groupName}-${idx}`} className="hover:bg-slate-800/30 transition-colors">
                                {showRowNumbers && !isTransposed && (
                                    <td className="p-4 text-xs text-slate-500 border-b border-slate-800/50 bg-slate-900/80 text-center sticky left-0 z-20 border-r border-slate-800/50 font-mono select-none">
                                        {idx + 1}
                                    </td>
                                )}
                                {activeColumns.map((col) => (
                                    <td key={`${groupName}-${idx}-${col.key}`} className="p-4 border-b border-slate-800/50 align-top">
                                        {renderCellContent(row, tableData.indexOf(row), col.key)}
                                    </td>
                                ))}
                                {showRowSummary && (
                                    <td className="p-4 border-b border-slate-800/50 align-top bg-slate-950/30 border-l border-slate-800/50">
                                        {getRowStats(row)}
                                    </td>
                                )}
                             </tr>
                        ))}
                    </React.Fragment>
                ))
            ) : (
                // Standard View
                activeRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/50 transition-colors border-b border-slate-800/50 last:border-0">
                    {showRowNumbers && !isTransposed && (
                        <td className="p-4 text-xs text-slate-500 border-b border-slate-800/50 bg-slate-900/80 text-center sticky left-0 z-20 border-r border-slate-800/50 font-mono select-none">
                            {idx + 1}
                        </td>
                    )}
                    {activeColumns.map((col) => (
                    <td 
                        key={`${idx}-${col.key}`} 
                        className={`p-4 align-top ${isTransposed && col.key === 'field_name' ? 'bg-slate-950/80 font-semibold text-slate-400 sticky left-0 border-r border-slate-800' : ''}`}
                    >
                        {renderCellContent(row, idx, col.key)}
                    </td>
                    ))}
                    {showRowSummary && (
                        <td className="p-4 align-top bg-slate-950/30 border-l border-slate-800/50 sticky right-0 z-10">
                            {getRowStats(row)}
                        </td>
                    )}
                </tr>
                ))
            )}
            
            {activeRows.length === 0 && (
                <tr>
                    <td colSpan={activeColumns.length + (showRowNumbers && !isTransposed ? 1 : 0)} className="p-12 text-center text-slate-500">
                        No matching data found.
                    </td>
                </tr>
            )}
          </tbody>

          {/* Footer Summaries - Non Sticky */}
          {showColumnSummary && activeRows.length > 0 && (
              <tfoot className="bg-slate-900/50 border-t border-slate-700">
                  <tr>
                      {showRowNumbers && !isTransposed && (
                          <td className="bg-slate-900 sticky left-0 z-20 border-r border-slate-800/50 border-t border-slate-700"></td>
                      )}
                      {activeColumns.map(col => (
                          <td key={`footer-${col.key}`} className={`p-3 align-top border-r border-slate-800/50 last:border-0 ${isTransposed && col.key === 'field_name' ? 'sticky left-0 bg-slate-900 z-20' : ''}`}>
                              {renderFooterCell(col.key)}
                          </td>
                      ))}
                      {showRowSummary && <td className="bg-slate-950"></td>}
                  </tr>
              </tfoot>
          )}
        </table>
      </div>
      
      {/* Status Bar */}
      <div className="p-3 border-t border-slate-800 bg-slate-950 text-xs text-slate-500 flex justify-between items-center shrink-0">
        <div>
            {isTransposed 
                ? `Showing ${activeColumns.length - 1} Records (Transposed)` 
                : (groupByKey ? `Showing ${Object.keys(groupedData || {}).length} Groups` : 'Flat View')}
            {Object.keys(columnFilters).length > 0 && <span className="ml-2 text-indigo-400">(Filtered)</span>}
        </div>
        <div className="flex gap-4">
             {isTransposed ? `${activeRows.length} Fields` : `Total Rows: ${activeRows.length}`}
        </div>
      </div>
    </div>
  );
};