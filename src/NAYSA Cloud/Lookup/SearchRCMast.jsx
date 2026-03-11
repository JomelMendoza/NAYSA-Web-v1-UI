import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner, faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import { apiClient } from "@/NAYSA Cloud/Configuration/BaseURL.jsx"; // Updated to use your apiClient

const RCLookupModal = ({ isOpen, onClose, customParam }) => {
    const [filters, setFilters] = useState({ rcCode: '', rcName: '', rcType: '' });

    // 1. Fetching with Polling (Auto-Refresh every 10s)
    const { 
        data: rcList = [], 
        isLoading, 
        isFetching, 
        error, 
        isError, 
        refetch 
    } = useQuery({
        queryKey: ['lookupRCMast', customParam],
        queryFn: async () => {
            let actualCustomParam = customParam;
            if (customParam === "apv_hd") actualCustomParam = "ActiveAll";

            const { data: result } = await apiClient.get("/lookupRCMast", {
                params: {
                    PARAMS: JSON.stringify({
                        search: "",
                        page: 1,
                        pageSize: 100, // Matches your currency logic
                    }),
                },
            });

            const rawData = result?.data?.[0]?.result || "[]";
            return Array.isArray(rawData) ? rawData : JSON.parse(rawData);
        },
        enabled: isOpen,
        staleTime: 1000 * 5,         // Consider data stale after 5s
        refetchInterval: 1000 * 10,  // 🔄 AUTO-REFRESH: Every 10 seconds
        refetchIntervalInBackground: false,
    });

    // 2. High-Performance Filtering
    const filtered = useMemo(() => {
        return rcList.filter(item =>
            (item.rcCode || '').toLowerCase().includes(filters.rcCode.toLowerCase()) &&
            (item.rcName || '').toLowerCase().includes(filters.rcName.toLowerCase()) &&
            (item.rcType || '').toLowerCase().includes(filters.rcType.toLowerCase())
        );
    }, [filters, rcList]);

    const handleApply = (selectedRC) => {
        onClose(selectedRC);
        setFilters({ rcCode: '', rcName: '', rcType: '' });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col relative overflow-hidden transform animate-scale-in border border-slate-200">
                
                {/* Header */}
                <div className="flex items-center justify-between p-2 border-b bg-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <h2 className="text-md font-bold text-blue-800 propercase tracking-tight pl-2">Select Responsibility Center</h2>
                            {/* Visual sync indicator */}
                            <div className="absolute -top-1 -right-4 flex h-2 w-2">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 ${isFetching ? "block" : "hidden"}`}></span>
                                <span className={`relative inline-flex rounded-full h-2 w-2 bg-blue-500 ${isFetching ? "block" : "hidden"}`}></span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => refetch()}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                            title="Manual Refresh"
                        >
                            <FontAwesomeIcon icon={faSyncAlt} size="sm" spin={isFetching} />
                        </button>
                        <button
                            onClick={() => onClose(null)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
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
                            <p className="text-sm">Fetching Responsibility Centers...</p>
                        </div>
                    ) : isError ? (
                        <div className="p-4 m-4 text-center bg-red-50 border border-red-200 text-red-700 rounded-lg">
                            <p className="font-bold text-sm">Error Loading Data</p>
                            <p className="text-xs">{error.message}</p>
                        </div>
                    ) : (
                        <div className="overflow-auto custom-scrollbar">
                            <table className="min-w-full divide-y divide-slate-200"> 
                                <thead className="bg-slate-200 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-4 py-2 text-left">
                                            <label className="block text-[13px] font-bold text-slate-600 propercase mb-1 ">RC Code</label>
                                            <input
                                                type="text"
                                                value={filters.rcCode}
                                                onChange={(e) => setFilters(p => ({ ...p, rcCode: e.target.value }))}
                                                placeholder="Filter..."
                                                className="w-full px-2 py-1 text-xs border rounded bg-white outline-none focus:ring-2 focus:ring-blue-500/20"
                                            />
                                        </th>
                                        <th className="px-4 py-2 text-left">
                                            <label className="block text-[13px] font-bold text-slate-600 propercase mb-1">Description</label>
                                            <input
                                                type="text"
                                                value={filters.rcName}
                                                onChange={(e) => setFilters(p => ({ ...p, rcName: e.target.value }))}
                                                placeholder="Filter..."
                                                className="w-full px-2 py-1 text-xs border rounded bg-white outline-none focus:ring-2 focus:ring-blue-500/20"
                                            />
                                        </th>
                                        <th className="px-4 py-2 text-left">
                                            <label className="block text-[13px] font-bold text-slate-600 propercase mb-1">Type</label>
                                            <input
                                                type="text"
                                                value={filters.rcType}
                                                onChange={(e) => setFilters(p => ({ ...p, rcType: e.target.value }))}
                                                placeholder="Filter..."
                                                className="w-full px-2 py-1 text-xs border rounded bg-white outline-none focus:ring-2 focus:ring-blue-500/20"
                                            />
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {filtered.length > 0 ? (
                                        filtered.map((rcItem, index) => (
                                            <tr key={index}
                                                onClick={() => handleApply(rcItem)}
                                                className="group hover:bg-blue-50 cursor-pointer transition-colors"
                                            >
                                                <td className="px-4 py-2 text-xs font-bold text-slate-700 w-[120px]">{rcItem.rcCode}</td>
                                                <td className="px-4 py-2 text-xs text-slate-600">{rcItem.rcName}</td>
                                                <td className="px-4 py-2 text-xs text-slate-600 w-[120px]">{rcItem.rcType}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="px-4 py-10 text-center text-slate-400 text-sm">
                                                No matching records found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )} 
                </div>

                {/* Footer */}
                <div className="p-2 px-4 border-t bg-slate-50 flex justify-between items-center">
                    <span className="text-[11px] text-slate-500 font-medium">
                        {filtered.length} Records Found
                    </span>
                    <div className="flex items-center gap-2">
                        {isFetching && (
                            <span className="text-[10px] text-blue-500 animate-pulse flex items-center gap-1">
                                <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                                Auto-syncing...
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <style jsx="true">{`
                .animate-fade-in { animation: fadeIn 0.15s ease-out forwards; }
                .animate-scale-in { animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
            `}</style>
        </div>
    );
};

export default RCLookupModal;