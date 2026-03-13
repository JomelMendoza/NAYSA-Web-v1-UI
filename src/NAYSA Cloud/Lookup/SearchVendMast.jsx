import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faTimes, faSort, faSortUp, faSortDown, 
    faSpinner, faSearch, faFilter, faUser, faSyncAlt, faEraser
} from '@fortawesome/free-solid-svg-icons';
import { apiClient } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";

// Debounce hook to prevent hammering the Sproc on every keystroke
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

const PayeeMastLookupModal = ({ isOpen, onClose, customParam }) => {
    const columnConfig = [
        { key: 'vendCode', label: 'Payee Code', width: '120px' },
        { key: 'vendName', label: 'Payee Name', width: '350px' },
        { key: 'source',   label: 'Source',     width: '80px'  },
        { key: 'vendTin',  label: 'TIN',        width: '200px' },
        { key: 'atcCode',  label: 'ATC',        width: '60px'  },
        { key: 'vatCode',  label: 'VAT',        width: '60px'  },
        { key: 'addr',     label: 'Address',    width: 'auto'  }
    ];

    // Search and UI State
    const [searchTerm, setSearchTerm] = useState('');
    const [searchMode, setSearchMode] = useState('part'); 
    const [filters, setFilters] = useState(columnConfig.reduce((acc, col) => ({ ...acc, [col.key]: '' }), {}));
    const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    const debouncedSearch = useDebounce(searchTerm, 500);

    // 1. Data Fetching with Auto-Sync
    const { 
        data: payees = [], 
        isLoading, 
        isFetching, 
        refetch 
    } = useQuery({
        // Query triggers whenever search text or mode changes
        queryKey: ['lookupVendMast', debouncedSearch, searchMode, customParam],
        queryFn: async () => {
            const payload = { 
                json_data: {
                    search: debouncedSearch.trim() || null,
                    filter: customParam || "ActiveAll",
                    searchMode: searchMode 
                } 
            };
            const { data: result } = await apiClient.get("/lookupVendMast", {
                params: { json_data: JSON.stringify(payload) }
            });

            const rawData = result?.data?.[0]?.result;
            return rawData ? JSON.parse(rawData) : [];
        },
        enabled: isOpen,
        staleTime: 1000 * 60, // 1 minute cache
        refetchInterval: 1000 * 30, // 🔄 AUTO-SYNC: Poll every 30s
        placeholderData: keepPreviousData, 
    });

    // 2. Client-Side Filtering (for the sub-filters in the table headers)
    const filteredAndSorted = useMemo(() => {
        let result = [...payees].filter(item =>
            columnConfig.every(col => 
                (item[col.key] || '').toLowerCase().includes((filters[col.key] || '').toLowerCase())
            )
        );

        if (sortConfig.key) {
            result.sort((a, b) => {
                const aVal = String(a[sortConfig.key] || '');
                const bVal = String(b[sortConfig.key] || '');
                return sortConfig.direction === 'asc' 
                    ? aVal.localeCompare(bVal, undefined, { numeric: true })
                    : bVal.localeCompare(aVal, undefined, { numeric: true });
            });
        }
        return result;
    }, [payees, filters, sortConfig]);

    // Reset page on search
    useEffect(() => { setCurrentPage(1); }, [debouncedSearch, filters]);

    if (!isOpen) return null;

    const paginatedData = filteredAndSorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalItems = filteredAndSorted.length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col relative overflow-hidden border border-slate-200">
                
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Select Payee</h2>
                            {isFetching && (
                                <span className="absolute -top-1 -right-4 flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => refetch()} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                            <FontAwesomeIcon icon={faSyncAlt} spin={isFetching} size="sm" />
                        </button>
                        <button onClick={() => onClose(null)} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                            <FontAwesomeIcon icon={faTimes} size="lg" />
                        </button>
                    </div>
                </div>

                {/* Search Bar & Mode Toggle */}
                <div className="p-3 bg-white border-b flex flex-wrap gap-4 items-center">
                    <div className="relative flex-grow max-w-md">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                            <FontAwesomeIcon icon={faSearch} />
                        </span>
                        <input
                            type="text"
                            placeholder="Type name to search database..."
                            className="block w-full pl-10 pr-10 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-0 pr-3 text-slate-300 hover:text-red-500">
                                <FontAwesomeIcon icon={faEraser} size="sm" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-4 px-4 border-l border-slate-200">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="radio" name="sm" value="start" checked={searchMode === 'start'} onChange={(e) => setSearchMode(e.target.value)} className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                            <span className="text-xs font-medium text-slate-600 group-hover:text-blue-600">Starts with</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="radio" name="sm" value="part" checked={searchMode === 'part'} onChange={(e) => setSearchMode(e.target.value)} className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                            <span className="text-xs font-medium text-slate-600 group-hover:text-blue-600">Contains</span>
                        </label>
                    </div>

                    {isFetching && <span className="text-[10px] text-blue-500 font-bold animate-pulse uppercase">Syncing...</span>}
                </div>

                {/* Table Section */}
                <div className="flex-grow overflow-hidden flex flex-col bg-white">
                    {isLoading && payees.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                            <FontAwesomeIcon icon={faSpinner} spin size="2x" className="mb-4 text-blue-500" />
                            <p className="text-sm font-medium">Connecting to server...</p>
                        </div>
                    ) : (
                        <div className="overflow-auto custom-scrollbar flex-grow">
                            <table className="w-full border-separate border-spacing-0">
                                <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        {columnConfig.map(col => (
                                            <th key={col.key} style={{ width: col.width, minWidth: col.width }} className="px-4 py-3 text-left border-b border-slate-200 group">
                                                <div 
                                                    className="flex items-center justify-between cursor-pointer mb-2" 
                                                    onClick={() => setSortConfig({ key: col.key, direction: sortConfig.key === col.key && sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
                                                >
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider group-hover:text-blue-600 transition-colors">{col.label}</span>
                                                    <FontAwesomeIcon icon={sortConfig.key === col.key ? (sortConfig.direction === 'asc' ? faSortUp : faSortDown) : faSort} className={`text-[10px] ${sortConfig.key === col.key ? 'text-blue-500' : 'text-slate-300'}`} />
                                                </div>
                                                <input 
                                                    type="text" 
                                                    value={filters[col.key]} 
                                                    onChange={(e) => setFilters({ ...filters, [col.key]: e.target.value })} 
                                                    placeholder="Filter list..." 
                                                    className="block w-full px-2 py-1 text-[10px] border border-slate-200 rounded bg-white focus:border-blue-400 outline-none font-normal" 
                                                />
                                            </th>
                                        ))}
                                        <th className="px-4 py-3 border-b border-slate-200 w-[80px]"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginatedData.map((payee, index) => (
                                        <tr key={index} className="hover:bg-blue-50/50 transition-colors cursor-pointer group" onClick={() => onClose(payee)}>
                                            {columnConfig.map(col => (
                                                <td key={col.key} className="px-4 py-3 text-xs text-slate-600 whitespace-normal align-top leading-relaxed">
                                                    {col.key === 'vendCode' ? <span className="font-bold text-blue-700">{payee[col.key]}</span> : payee[col.key]}
                                                </td>
                                            ))}
                                            <td className="px-4 py-3 align-top text-right">
                                                <button className="px-3 py-1 bg-slate-100 text-slate-600 group-hover:bg-blue-600 group-hover:text-white rounded text-[10px] font-bold uppercase transition-all">Apply</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination Footer */}
                <div className="p-3 border-t bg-slate-50 flex justify-between items-center text-[11px] font-bold text-slate-500">
                    <div className="uppercase tracking-widest">
                        Total Found: {totalItems}
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                            disabled={currentPage === 1} 
                            className="px-4 py-1.5 bg-white border border-slate-200 rounded shadow-sm disabled:opacity-30 hover:bg-slate-50 transition-all uppercase"
                        >
                            Prev
                        </button>
                        <span className="text-slate-700 uppercase">Page {currentPage} of {Math.ceil(totalItems / itemsPerPage) || 1}</span>
                        <button 
                            onClick={() => setCurrentPage(p => p + 1)} 
                            disabled={totalItems <= currentPage * itemsPerPage} 
                            className="px-4 py-1.5 bg-white border border-slate-200 rounded shadow-sm disabled:opacity-30 hover:bg-slate-50 transition-all uppercase"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PayeeMastLookupModal;