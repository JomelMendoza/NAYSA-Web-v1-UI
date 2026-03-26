import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import {
  X,
  Building2,
  CheckSquare,
  Square,
  Search,
  CheckCircle2,
} from "lucide-react";

const BranchSelectionModal = ({
  isOpen,
  onClose,
  branchData = [],
  selectedBranches = [],
  onApply,
  isLoading = false,
}) => {
  const [tempSelected, setTempSelected] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setTempSelected(selectedBranches);
    setSearch("");
  }, [isOpen, selectedBranches]);

  const filteredBranchData = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return branchData;

    return branchData.filter(
      (item) =>
        item.value?.toLowerCase().includes(keyword) ||
        item.label?.toLowerCase().includes(keyword)
    );
  }, [branchData, search]);

  const selectedBranchItems = useMemo(() => {
    const map = new Map(branchData.map((item) => [item.value, item]));
    return tempSelected.map(
      (code) => map.get(code) || { value: code, label: code }
    );
  }, [tempSelected, branchData]);

  const allFilteredSelected =
    filteredBranchData.length > 0 &&
    filteredBranchData.every((item) => tempSelected.includes(item.value));

  const toggleBranch = (branchCode) => {
    setTempSelected((prev) => {
      const exists = prev.includes(branchCode);
      return exists
        ? prev.filter((code) => code !== branchCode)
        : [...prev, branchCode];
    });
  };

  const handleSelectAllFiltered = () => {
    if (filteredBranchData.length === 0) return;

    const visibleCodes = filteredBranchData.map((item) => item.value);

    const nextSelection = allFilteredSelected
      ? tempSelected.filter((code) => !visibleCodes.includes(code))
      : Array.from(new Set([...tempSelected, ...visibleCodes]));

    setTempSelected(nextSelection);
  };

  const handleClear = () => {
    setTempSelected([]);
  };

  const handleApply = () => {
    onApply?.(tempSelected);
    onClose?.();
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/30 p-3">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 bg-blue-200 border-b border-blue-300 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800">
            <Building2 size={18} />
            <div>
              <div className="text-sm sm:text-base font-semibold">
                Select Branches
              </div>
              <div className="text-[11px] sm:text-xs text-slate-700">
                Choose one or more branches for processing.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 hover:bg-white/40 transition"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 bg-slate-50 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search branch code or branch name..."
                className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <button
              type="button"
              onClick={handleSelectAllFiltered}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <CheckSquare size={14} />
              {allFilteredSelected ? "Unselect Filtered" : "Select All Filtered"}
            </button>

            <button
              type="button"
              onClick={handleClear}
              disabled={tempSelected.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <Square size={14} />
              Clear
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_.85fr] gap-3">
            <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
              <div className="px-3 py-2 bg-slate-50 border-b text-[11px] sm:text-xs font-medium text-slate-600 flex items-center justify-between">
                <span>Available Branches</span>
                <span>{filteredBranchData.length} found</span>
              </div>

              <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
                {isLoading ? (
                  <div className="px-3 py-3 text-xs text-slate-500">
                    Loading branches...
                  </div>
                ) : filteredBranchData.length === 0 ? (
                  <div className="px-3 py-3 text-xs text-slate-500">
                    No branches found.
                  </div>
                ) : (
                  filteredBranchData.map((item) => {
                    const checked = tempSelected.includes(item.value);

                    return (
                      <label
                        key={item.value}
                        className={`flex items-start gap-3 px-3 py-2.5 cursor-pointer transition ${
                          checked ? "bg-blue-50" : "hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleBranch(item.value)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />

                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-medium text-slate-800">
                            {item.value}
                          </div>
                          <div className="text-[11px] text-slate-500 break-words">
                            {item.label}
                          </div>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
              <div className="px-3 py-2 bg-slate-50 border-b text-[11px] sm:text-xs font-medium text-slate-600 flex items-center justify-between">
                <span>Selected Branches</span>
                <span>{tempSelected.length}</span>
              </div>

              <div className="min-h-[220px] max-h-[360px] overflow-y-auto p-3">
                {selectedBranchItems.length === 0 ? (
                  <div className="text-xs text-slate-400">
                    No branches selected.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedBranchItems.map((item) => (
                      <div
                        key={item.value}
                        className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] sm:text-xs text-blue-700"
                      >
                        <span className="max-w-[220px] truncate">
                          {item.value} - {item.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleBranch(item.value)}
                          className="rounded-full hover:bg-blue-100 p-0.5"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-t bg-white flex items-center justify-between gap-2">
          <div className="text-[11px] text-slate-500">
            {tempSelected.length > 0
              ? `${tempSelected.length} branch(es) selected`
              : "No branches selected"}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApply}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700"
            >
              <CheckCircle2 size={14} />
              Apply Selection
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default BranchSelectionModal;