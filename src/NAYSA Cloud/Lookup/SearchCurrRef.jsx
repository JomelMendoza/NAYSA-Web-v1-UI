import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faSpinner,
  faSyncAlt,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { apiClient } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";

const CurrLookupModal = ({ isOpen, onClose }) => {
  const [filters, setFilters] = useState({ currCode: "", currName: "" });

  // 1. Fetching with Polling (Auto-Refresh)
  const {
    data: currency = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["lookupCurrencies"],
    queryFn: async () => {
      const { data: result } = await apiClient.get("/lookupCurr", {
        params: {
          PARAMS: JSON.stringify({ search: "", page: 1, pageSize: 100 }),
        },
      });
      const rawData = result?.data?.[0]?.result || "[]";
      return Array.isArray(rawData) ? rawData : JSON.parse(rawData);
    },
    enabled: isOpen, // Only active when modal is open
    staleTime: 1000 * 5, // Consider data "stale" after 5 seconds
    refetchInterval: 1000 * 10, // 🔄 AUTO-REFRESH: Every 10 seconds
    refetchIntervalInBackground: false, // Don't waste resources if tab is hidden
  });

  // 2. High-Performance Filtering
  const filtered = useMemo(() => {
    return currency.filter(
      (item) =>
        (item.currCode || "")
          .toLowerCase()
          .includes(filters.currCode.toLowerCase()) &&
        (item.currName || "")
          .toLowerCase()
          .includes(filters.currName.toLowerCase()),
    );
  }, [filters, currency]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40  p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-sm max-w-lg max-h-[70vh] flex flex-col relative overflow-hidden transform animate-scale-in border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-slate-100">
          <div className="flex items-center gap-3">
            <div className="relative">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">
                Select Currency
              </h2>
              {/* Visual indicator for auto-refresh */}
              <div className="absolute -top-1 -right-4 flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 ${isFetching ? "block" : "hidden"}`}
                ></span>
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 bg-blue-500 ${isFetching ? "block" : "hidden"}`}
                ></span>
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
              <FontAwesomeIcon
                icon={faSpinner}
                spin
                size="2x"
                className="mb-4 text-blue-500"
              />
              <p className="text-sm">Fetching latest currencies...</p>
            </div>
          ) : (
            <div className="overflow-auto custom-scrollbar">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-200 sticky top-0 z-10 border-b border-slate-200">
                  <tr>
                    {/* Column 1: Code */}
                    <th className="px-4 py-3 text-left">
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                        Currency Code
                      </label>
                      <input
                        type="text"
                        value={filters.currCode}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            currCode: e.target.value,
                          }))
                        }
                        placeholder="Filter..."
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-normal"
                      />
                    </th>

                    {/* Column 2: Name */}
                    <th className="px-4 py-3 text-left">
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={filters.currName}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            currName: e.target.value,
                          }))
                        }
                        placeholder="Filter..."
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-normal"
                      />
                    </th>

                    {/* Actions Column Placeholder */}
                    <th className="border-b border-slate-200 w-15"></th>
                  </tr>
                </thead>
                <tbody className=" divide-y divide-slate-100">
                  {filtered.map((curr, index) => (
                    <tr
                      key={index}
                      onClick={() => onClose(curr)}
                      className="group hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-2 text-xs font-bold text-slate-600">
                        {curr.currCode}
                      </td>
                      <td className="px-4 py-2 text-xs text-slate-600">
                        {curr.currName}
                      </td>
                    </tr>
<<<<<<< HEAD
                  ))}
=======
                  ))} 
>>>>>>> d15a2d968d9eeb894dfd79bbb993444e4a8a0121
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer / Status Bar */}
        <div className="p-2 px-4 border-t bg-slate-50 flex justify-between items-center">
          <span className="text-[12px] text-slate-500 font-medium">
            {filtered.length} Currencies Available
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
        .animate-fade-in {
          animation: fadeIn 0.15s ease-out forwards;
        }
        .animate-scale-in {
          animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scaleIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
};

export default CurrLookupModal;
