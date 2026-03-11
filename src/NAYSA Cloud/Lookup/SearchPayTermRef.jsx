import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faSyncAlt, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { apiClient } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";

const SearchPayTermRef = ({ isOpen, onClose }) => {
  const [filters, setFilters] = useState({
    paytermCode: "",
    paytermName: "",
  });

  const {
    data: payterms = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["lookupPayterms"],
    queryFn: async () => {
      const { data: result } = await apiClient.get("/payterm", {
        params: {
          PARAMS: JSON.stringify({
            search: "",
            page: 1,
            pageSize: 100,
          }),
        },
      });

      const rawData = result?.data?.[0]?.result || "[]";
      return Array.isArray(rawData) ? rawData : JSON.parse(rawData);
    },
    enabled: isOpen,
  });
  const filtered = useMemo(() => {
    return payterms.filter(
      (item) =>
        (item.paytermCode || "")
          .toLowerCase()
          .includes(filters.paytermCode.toLowerCase()) &&
        (item.paytermName || "")
          .toLowerCase()
          .includes(filters.paytermName.toLowerCase())
    );
  }, [filters, payterms]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-white w-full max-w-lg rounded shadow-lg overflow-hidden">

        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 bg-slate-200 border-b">
          <h2 className="text-sm font-bold text-slate-700 uppercase">
            Select Payment Term
          </h2>

          <div className="flex gap-3 items-center">
            <button
              onClick={() => refetch()}
              className="text-slate-500 hover:text-blue-600"
            >
              <FontAwesomeIcon icon={faSyncAlt} spin={isFetching} />
            </button>

            <button
              onClick={() => onClose(null)}
              className="text-slate-500 hover:text-red-600"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-auto">

          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-slate-500">
              <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
              Loading...
            </div>
          ) : (
            <table className="min-w-full text-xs">
              <thead className="bg-slate-100 border-b">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-slate-600">
                    Payment Term
                    <input
                      type="text"
                      placeholder="Filter..."
                      value={filters.paytermCode}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          paytermCode: e.target.value,
                        }))
                      }
                      className="mt-1 w-full px-2 py-1 border rounded text-xs"
                    />
                  </th>

                  <th className="px-4 py-2 text-left font-semibold text-slate-600">
                    Description
                    <input
                      type="text"
                      placeholder="Filter..."
                      value={filters.paytermName}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          paytermName: e.target.value,
                        }))
                      }
                      className="mt-1 w-full px-2 py-1 border rounded text-xs"
                    />
                  </th>

                  <th className="px-4 py-2 text-left font-semibold text-slate-600">
                    Due Days
                  </th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((row, index) => (
                  <tr
                    key={index}
                    onClick={() => onClose(row)}
                    className="hover:bg-blue-50 cursor-pointer border-b"
                  >
                    <td className="px-4 py-2 font-semibold text-slate-700">
                      {row.paytermCode}
                    </td>
                    <td className="px-4 py-2 text-slate-600">
                      {row.paytermName}
                    </td>
                    <td className="px-4 py-2 text-slate-600">
                      {row.daysDue}
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan="3"
                      className="text-center py-6 text-slate-400"
                    >
                      No Payment Terms Found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-slate-100 border-t text-xs text-slate-600">
          {filtered.length} Payment Terms Available
        </div>
      </div>
    </div>
  );
};

export default SearchPayTermRef;