
import { useEffect, useRef, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";
import { useAuth } from "@/NAYSA Cloud/Authentication/AuthContext.jsx";
import { useSelectedHSColConfig } from "@/NAYSA Cloud/Global/selectedData";
import { LoadingSpinner } from "@/NAYSA Cloud/Global/utilities.jsx";

// Import Lookup Modals
import SearchGlobalReportTable from "../../Lookup/SearchGlobalReportTable";
import BranchLookupModal from "@/NAYSA Cloud/Lookup/SearchBranchRef";

// Icons & Globals
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faUndo, faTimes, faExchangeAlt, faInfoCircle } from "@fortawesome/free-solid-svg-icons";

// UI Helpers
import FieldRenderer from "@/NAYSA Cloud/Global/FieldRenderer";
import ButtonBar from "@/NAYSA Cloud/Global/ButtonBar";

/**
 * MODERN COMPARISON MODAL
 */
const ComparisonModal = ({ data, onClose }) => {
  if (!data) return null;

  // Proper Case Converter (AcctGroup -> Acct Group)
  const toProperCase = (str) => {
    return str
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (s) => s.toUpperCase())
      .trim();
  };

  const parseValue = (val) => {
    try {
      if (!val) return {};
      return typeof val === "string" ? JSON.parse(val) : val;
    } catch (e) {
      return {};
    }
  };

  const before = parseValue(data.beforeVal);
  const after = parseValue(data.afterVal);
  const allKeys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-gray-200 dark:border-gray-800">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 border border-blue-100 dark:border-blue-800">
                <FontAwesomeIcon icon={faExchangeAlt} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Audit Comparison</h2>
                <p className="text-[11px] text-gray-500 mt-0.5 italic">Comparing data snapshots</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition-colors">
              <FontAwesomeIcon icon={faTimes} size="lg" />
            </button>
          </div>

          {/* Context Badges */}
          <div className="mt-5 flex flex-wrap gap-2">
            {[
              { label: "Reference File", val: data.tblName },
              { label: "Modified By / Created By", val: data.userName },
              { label: "Ref Code", val: data.refCode },
              { label: "Ref Name", val: data.refName },
             
            ].map((item, idx) => (
              <div key={idx} className="bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded border border-gray-100 dark:border-gray-700">
                <span className="text-[9px] text-gray-400 font-bold uppercase block leading-none mb-1">{item.label}</span>
                <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-200">{item.val || "—"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-auto bg-gray-50/30 dark:bg-gray-950/30">
          <table className="w-full text-left text-[12px] border-separate border-spacing-0">
            <thead className="sticky top-0 bg-white dark:bg-gray-900 z-10 shadow-sm">
              <tr className="text-[10px] uppercase font-bold text-gray-400">
                <th className="px-6 py-3 border-b border-gray-100 dark:border-gray-800">Column Name</th>
                <th className="px-6 py-3 border-b border-gray-100 dark:border-gray-800 bg-red-50/20 text-red-500">Old Value</th>
                <th className="px-6 py-3 border-b border-gray-100 dark:border-gray-800 bg-green-50/20 text-green-600">New Value</th>
              </tr>
            </thead>
            <tbody>
              {allKeys.map((key) => {
                const isDiff = String(before[key]) !== String(after[key]);
                return (
                  <tr key={key} className={`hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors ${isDiff ? 'bg-amber-50/30 dark:bg-amber-900/5' : ''}`}>
                    <td className="px-6 py-3 border-b border-gray-100 dark:border-gray-800 font-medium text-gray-600 dark:text-gray-400">
                      {toProperCase(key)}
                    </td>
                    <td className="px-6 py-3 border-b border-gray-100 dark:border-gray-800 font-mono text-red-500 italic break-all">
                      {String(before[key] ?? "—")}
                    </td>
                    <td className="px-6 py-3 border-b border-gray-100 dark:border-gray-800 font-mono text-green-600 font-bold break-all">
                      {String(after[key] ?? "—")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex justify-end">
          <button 
            onClick={onClose} 
            className="bg-blue-600 text-white px-4 h-8 rounded-md text-[11px] hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faTimes} className="text-[10px]" />
            Close
          </button>
        </div>
      </div>
    </div>
  );
};



const getInitialDate = (offsetMonth = 0) => {
  const d = new Date();
  d.setMonth(d.getMonth() - offsetMonth);
  return d.toISOString().split('T')[0];
};

const TODAY = getInitialDate(0);
const ONE_MONTH_AGO = getInitialDate(1);

const AuditTrail = () => {
  const { currentUserRow } = useAuth();
  const tableRefTrans = useRef(null);
  const tableRefRef = useRef(null);
  const tableStateRef = useRef({ transactions: {}, reference: {} });

  const [activeTab, setActiveTab] = useState("transactions");
  const [selectedRowCompare, setSelectedRowCompare] = useState(null);

  const initialTrans = useMemo(() => ({
    branchCode: currentUserRow?.branchCode || "",
    branchName: currentUserRow?.branchName || "",
    docCode: "", docName: "", docNo: "", userCode: "", userName: "",
    startDate: ONE_MONTH_AGO, endDate: TODAY,
  }), [currentUserRow]);

  const initialRef = useMemo(() => ({
    refFile: "", refName: "", userCode: "", userName: "",
    startDate: ONE_MONTH_AGO, endDate: TODAY,
  }), []);

  const [filterTrans, setFilterTrans] = useState(initialTrans);
  const [filterRef, setFilterRef] = useState(initialRef);
  const [modals, setModals] = useState({ branch: false });
  const [clearedTabs, setClearedTabs] = useState({ transactions: false, reference: false });
  const [isManualSearch, setIsManualSearch] = useState(false);

  useEffect(() => {
    if (currentUserRow) {
      setFilterTrans(prev => ({
        ...prev,
        branchCode: prev.branchCode || currentUserRow.branchCode,
        branchName: prev.branchName || currentUserRow.branchName
      }));
    }
  }, [currentUserRow]);

  const fetchCols = (key, config) => useQuery({
    queryKey: ["auditCols", key],
    queryFn: () => useSelectedHSColConfig(config),
    staleTime: Infinity,
  });

  const { data: colsTrans, isLoading: isColsTransLoading } = fetchCols("TRAN", "GetDocTrail");
  const { data: colsRef, isLoading: isColsRefLoading } = fetchCols("REF", "GetRefTrail");

  const useAuditData = (key, endpoint, filters, enabledCols) => useQuery({
    queryKey: ["auditData", key],
    queryFn: async () => {
      if (clearedTabs[key === "TRAN" ? "transactions" : "reference"]) return [];
      const { data } = await apiClient.post(endpoint, { PARAMS: JSON.stringify(filters) });
      const raw = data?.data?.[0]?.result || data?.result || data?.data;
      setIsManualSearch(false);
      console.log(data)
      return typeof raw === 'string' ? JSON.parse(raw) : (raw || []);
    },
    enabled: !!enabledCols,
    refetchInterval: 30000,
  });

  const { data: dataTrans, isFetching: isFetchTrans, refetch: refetchTrans } = useAuditData("TRAN", "getDocTrail", filterTrans, colsTrans);
  const { data: dataRef, isFetching: isFetchRef, refetch: refetchRef } = useAuditData("REF", "getRefTrail", filterRef, colsRef);

  
  const handleSearch = () => {
    setClearedTabs(prev => ({ ...prev, [activeTab]: false }));
    setIsManualSearch(true);
    activeTab === "transactions" ? refetchTrans() : refetchRef();
  };



 const handleReset = () => {
    // 1. Reset the Filter state
    if (activeTab === "transactions") {
      setFilterTrans(initialTrans);
      queryClient.setQueryData(["auditData", "TRAN"], []);
    } else {
      setFilterRef(initialRef);
      queryClient.setQueryData(["auditData", "REF"], []);
    }
    setClearedTabs(p => ({ ...p, [activeTab]: true }));
    setIsManualSearch(false);
  };



  const handleViewRow = (row) => {
    if (activeTab === "reference") {
      setSelectedRowCompare(row); 
    } else {
      row.pathUrl && window.open(row.pathUrl, "_blank", "noopener,noreferrer");
    }
  };


  
  const ClearButton = ({ onClear }) => (
    <button onClick={(e) => { e.stopPropagation(); onClear(); }} className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 z-10 p-1">
      <FontAwesomeIcon icon={faTimes} className="text-[10px]" />
    </button>
  );

  return (
    <div className="global-ref-main-div-ui relative h-screen flex flex-col overflow-hidden">
      
      <ComparisonModal data={selectedRowCompare} onClose={() => setSelectedRowCompare(null)} />

      {(isManualSearch && (isFetchTrans || isFetchRef)) && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
          <div className="flex flex-col items-center gap-2">
            <LoadingSpinner />
            <span className="text-blue-600 font-semibold text-sm">Fetching Audit Data...</span>
          </div>
        </div>
      )}

      <BranchLookupModal 
        isOpen={modals.branch} 
        onClose={(v) => { 
          setModals({ branch: false }); 
          if(v) setFilterTrans(p => ({ ...p, branchCode: v.branchCode, branchName: v.branchName }));
        }} 
      />

      <div className="global-ref-header-ui flex-none">
        <div className="w-full flex flex-col gap-3 md:grid md:grid-cols-3 md:items-center">
          <h1 className="global-ref-headertext-ui truncate">Audit Trail - {activeTab === "transactions" ? "Transactions" : "Reference File"}</h1>
          <div className="flex justify-center">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              {["transactions", "reference"].map((tab) => (
                <button key={tab} onClick={() => { setActiveTab(tab); setIsManualSearch(false); }} className={`px-4 py-2 text-[12px] font-bold border-b-2 transition-all capitalize ${activeTab === tab ? "border-blue-600 text-blue-600 bg-blue-50/50" : "border-transparent text-gray-500"}`}>
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <ButtonBar buttons={[
              { key: "search", label: " Search", icon: faSearch, onClick: handleSearch, className: "bg-blue-600 text-white px-4 h-8 rounded-md text-[11px]" },
              { key: "reset", label: " Reset", icon: faUndo, onClick: handleReset, className: "bg-gray-600 text-white px-4 h-8 rounded-md text-[11px]" },
            ]} />
          </div>
        </div>
      </div>

      <div className="flex-none mt-32 sm:mt-24 bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 shadow-sm mx-4">
        {activeTab === "transactions" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            <div className="relative">
              <FieldRenderer label="Branch" type="lookup" value={filterTrans.branchName} onLookup={() => setModals({ branch: true })} />
              {filterTrans.branchName && <ClearButton onClear={() => setFilterTrans(p => ({ ...p, branchCode: "", branchName: "" }))} />}
            </div>
            <div className="relative">
              <FieldRenderer label="Document Type" type="lookup" value={filterTrans.docName} onLookup={() => {}} />
              {filterTrans.docName && <ClearButton onClear={() => setFilterTrans(p => ({ ...p, docCode: "", docName: "" }))} />}
            </div>
            <FieldRenderer label="Document No" type="text" value={filterTrans.docNo} onChange={(v) => setFilterTrans(p => ({ ...p, docNo: v }))} />
            <div className="relative">
              <FieldRenderer label="User" type="lookup" value={filterTrans.userName} onLookup={() => {}} />
              {filterTrans.userName && <ClearButton onClear={() => setFilterTrans(p => ({ ...p, userCode: "", userName: "" }))} />}
            </div>
            <FieldRenderer label="Starting Date" type="date" value={filterTrans.startDate} onChange={(v) => setFilterTrans(p => ({ ...p, startDate: v }))} />
            <FieldRenderer label="Ending Date" type="date" value={filterTrans.endDate} onChange={(v) => setFilterTrans(p => ({ ...p, endDate: v }))} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <FieldRenderer label="Reference File" type="text" value={filterRef.refFile} onChange={(v) => setFilterRef(p => ({ ...p, refFile: v }))} />
              {filterRef.refFile && <ClearButton onClear={() => setFilterRef(p => ({ ...p, refFile: "", refName: "" }))} />}
            </div>
            <div className="relative">
              <FieldRenderer label="User" type="lookup" value={filterRef.userName} onLookup={() => {}} />
              {filterRef.userName && <ClearButton onClear={() => setFilterRef(p => ({ ...p, userCode: "", userName: "" }))} />}
            </div>
            <FieldRenderer label="Starting Date" type="date" value={filterRef.startDate} onChange={(v) => setFilterRef(p => ({ ...p, startDate: v }))} />
            <FieldRenderer label="Ending Date" type="date" value={filterRef.endDate} onChange={(v) => setFilterRef(p => ({ ...p, endDate: v }))} />
          </div>
        )}
      </div>

      <div className={`mt-4 flex-1 min-h-0 px-4 ${activeTab === "transactions" ? "block" : "hidden"}`}>
        <SearchGlobalReportTable ref={tableRefTrans} loading={isColsTransLoading || (isFetchTrans && isManualSearch)} columns={colsTrans} data={dataTrans || []} itemsPerPage={50} showFilters rightActionLabel="View" onRowAction={handleViewRow} onStateChange={(tbl) => { tableStateRef.current.transactions = tbl; }} />
      </div>
      <div className={`mt-4 flex-1 min-h-0 px-4 ${activeTab === "reference" ? "block" : "hidden"}`}>
        <SearchGlobalReportTable ref={tableRefRef} loading={isColsRefLoading || (isFetchRef && isManualSearch)} columns={colsRef} data={dataRef || []} itemsPerPage={50} showFilters rightActionLabel="View" onRowAction={handleViewRow} onStateChange={(tbl) => { tableStateRef.current.reference = tbl; }} />
      </div>
    </div>
  );
};

export default AuditTrail;