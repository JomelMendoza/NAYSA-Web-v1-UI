import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner, faSyncAlt, faEraser, faSort, faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons';
import { apiClient } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";

const BillCodeLookupModal = ({ isOpen, onClose, customParam }) => {
    const [filters, setFilters] = useState({ billCode: '', billName: '', uomCode: '' });
    const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });

    // Check if any filters are active for the Clear button
    const hasActiveFilters = filters.billCode !== '' || filters.billName !== '' || filters.uomCode !== '';
    const resetFilters = () => setFilters({ billCode: '', billName: '', uomCode: '' });

    // 1. TanStack Query with Polling/Auto-Refresh
    const { 
        data: billCodes = [], 
        isLoading, 
        isFetching, 
        refetch 
    } = useQuery({
        queryKey: ['lookupBillCode'],
        queryFn: async () => {
            const { data: result } = await apiClient.get("/lookupBillCode", {
                params: {
                    PARAMS: JSON.stringify({ search: "", page: 1, pageSize: 100 }),
                },
            });
            const rawData = result?.data?.[0]?.result || "[]";
            return Array.isArray(rawData) ? rawData : JSON.parse(rawData);
        },
        enabled: isOpen,           
        staleTime: 1000 * 5,       
        refetchInterval: 1000 * 15, // Auto-refresh every 15 seconds
        refetchIntervalInBackground: false,
    });

    // 2. Filtering & Sorting Logic
    const filtered = useMemo(() => {
        let data = [...billCodes];

        // Filter
        data = data.filter(item =>
            (item.billCode || '').toLowerCase().includes(filters.billCode.toLowerCase()) &&
            (item.billName || '').toLowerCase().includes(filters.billName.toLowerCase()) &&
            (item.uomCode || '').toLowerCase().includes(filters.uomCode.toLowerCase())
        );

        // Sort
        if (sortConfig.key) {
            data.sort((a, b) => {
                const aVal = a[sortConfig.key] || '';
                const bVal = b[sortConfig.key] || '';
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return data;
    }, [filters, billCodes, sortConfig]);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const renderSortIcon = (column) => {
        if (sortConfig.key === column) {
            return sortConfig.direction === 'asc' ? <FontAwesomeIcon icon={faSortUp} className="ml-1 text-blue-500" /> : <FontAwesomeIcon icon={faSortDown} className="ml-1 text-blue-500" />;
        }
        return <FontAwesomeIcon icon={faSort} className="ml-1 text-slate-300 group-hover:text-slate-400" />;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[75vh] flex flex-col relative overflow-hidden transform animate-scale-in border border-slate-200">
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <h2 className="text-sm font-bold text-blue-800 uppercase tracking-tight">Select Bill Code</h2>
                            {/* Visual indicator for auto-refresh */}
                            <div className="absolute -top-1 -right-4 flex h-2 w-2">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 ${isFetching ? 'block' : 'hidden'}`}></span>
                                <span className={`relative inline-flex rounded-full h-2 w-2 bg-blue-500 ${isFetching ? 'block' : 'hidden'}`}></span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {hasActiveFilters && (
                            <button 
                                onClick={resetFilters}
                                className="px-2 py-1 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-all flex items-center gap-1.5"
                            >
                                <FontAwesomeIcon icon={faEraser} />
                                CLEAR
                            </button>
                        )}
                        <button 
                            onClick={() => refetch()} 
                            className="p-2 text-slate-400 hover:text-blue-600 transition-all"
                            title="Manual Refresh"
                        >
                            <FontAwesomeIcon icon={faSyncAlt} size="sm" spin={isFetching} />
                        </button>
                        <button
                            onClick={() => onClose(null)}
                            className="p-2 text-slate-400 hover:text-red-600 transition-all"
                        >
                            <FontAwesomeIcon icon={faTimes} size="lg" />
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-grow overflow-hidden flex flex-col">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                            <FontAwesomeIcon icon={faSpinner} spin size="2x" className="mb-4 text-blue-500" />
                            <p className="text-sm">Fetching bill codes...</p>
                        </div>
                    ) : (
                        <div className="overflow-auto custom-scrollbar">
                            <table className="min-w-full divide-y divide-slate-200 border-separate border-spacing-0">
                                <thead className="bg-slate-100 sticky top-0 z-10">
                                    <tr>
                                        <th onClick={() => handleSort('billCode')} className="group px-4 py-3 text-left border-b border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors">
                                            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 cursor-pointer">
                                                Bill Code {renderSortIcon('billCode')}
                                            </label>
                                            <input
                                                type="text"
                                                onClick={(e) => e.stopPropagation()}
                                                value={filters.billCode}
                                                onChange={(e) => setFilters(prev => ({ ...prev, billCode: e.target.value }))}
                                                placeholder="Filter..."
                                                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-normal"
                                            />
                                        </th>
                                        <th onClick={() => handleSort('billName')} className="group px-4 py-3 text-left border-b border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors">
                                            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 cursor-pointer">
                                                Description {renderSortIcon('billName')}
                                            </label>
                                            <input
                                                type="text"
                                                onClick={(e) => e.stopPropagation()}
                                                value={filters.billName}
                                                onChange={(e) => setFilters(prev => ({ ...prev, billName: e.target.value }))}
                                                placeholder="Filter..."
                                                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-normal"
                                            />
                                        </th>
                                        <th onClick={() => handleSort('uomCode')} className="group px-4 py-3 text-left border-b border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors">
                                            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 cursor-pointer">
                                                UOM {renderSortIcon('uomCode')}
                                            </label>
                                            <input
                                                type="text"
                                                onClick={(e) => e.stopPropagation()}
                                                value={filters.uomCode}
                                                onChange={(e) => setFilters(prev => ({ ...prev, uomCode: e.target.value }))}
                                                placeholder="Filter..."
                                                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-normal"
                                            />
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filtered.length > 0 ? filtered.map((item, index) => (
                                        <tr 
                                            key={index}
                                            onClick={() => onClose(item)}
                                            className="group hover:bg-blue-50 cursor-pointer transition-colors"
                                        >
                                            <td className="px-4 py-2 text-xs font-bold text-slate-600">{item.billCode}</td>
                                            <td className="px-4 py-2 text-xs text-slate-600 font-medium">{item.billName}</td>
                                            <td className="px-4 py-2 text-xs text-slate-500">{item.uomCode}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="3" className="px-4 py-12 text-center text-slate-400 italic text-sm">
                                                No matching bill codes found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer Status Bar */}
                <div className="p-3 px-4 border-t bg-slate-50 flex justify-between items-center">
                    <span className="text-[12px] text-slate-500 font-medium">
                        {filtered.length} Entries Found
                    </span>
                    <div className="flex items-center gap-2">
                        {isFetching && (
                            <span className="text-[10px] text-blue-500 animate-pulse flex items-center gap-1 font-bold uppercase">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                Auto-Syncing...
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BillCodeLookupModal;