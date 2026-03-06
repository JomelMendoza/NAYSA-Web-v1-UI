import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faMagnifyingGlass, faXmark, faCircleNotch, 
  faBroom, faDownload, faCircleXmark 
} from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";

// --- Project Imports ---
import { fetchData } from "@/NAYSA Cloud/Configuration/BaseURL";
import { useTopUserRow, useTopHSRptRow } from "@/NAYSA Cloud/Global/top1RefTable";
import { 
  useHandlePrintAPReport, useHandleDownloadExcelAPReport,
  useHandlePrintARReport, useHandleDownloadExcelARReport,
  useHandlePrintGLReport, useHandleDownloadExcelGLReport 
} from "@/NAYSA Cloud/Global/report";
import { useSelectedHSColConfig } from '@/NAYSA Cloud/Global/selectedData';
import { exportGenericHistoryExcel } from "@/NAYSA Cloud/Global/report";
import { useGetCurrentDay, useFormatToDate } from "@/NAYSA Cloud/Global/dates";
import { useAuth } from "@/NAYSA Cloud/Authentication/AuthContext.jsx";
import { LoadingSpinner } from "@/NAYSA Cloud/Global/utilities.jsx";

// --- Lookup Modals ---
import BranchLookupModal from "@/NAYSA Cloud/Lookup/SearchBranchRef";
import PayeeMastLookupModal from "@/NAYSA Cloud/Lookup/SearchVendMast";
import CustomerMastLookupModal from "@/NAYSA Cloud/Lookup/SearchCustMast";
import COAMastLookupModal from "@/NAYSA Cloud/Lookup/SearchCOAMast";
import SLMastLookupModal from "@/NAYSA Cloud/Lookup/SearchSLMast";
import RCLookupModal from "@/NAYSA Cloud/Lookup/SearchRCMast";

/** * MODULE CONFIGURATION
 * This maps each module to its specific label, modals, and API handlers.
 */
const MODULE_DEFS = {
  AP:  { label: "Payee",    lookup: PayeeMastLookupModal,    print: useHandlePrintAPReport, excel: useHandleDownloadExcelAPReport, hasExtra: false },
  VI:  { label: "Payee",    lookup: PayeeMastLookupModal,    print: useHandlePrintAPReport, excel: useHandleDownloadExcelAPReport, hasExtra: false },
  EWT: { label: "Payee",    lookup: PayeeMastLookupModal,    print: useHandlePrintAPReport, excel: useHandleDownloadExcelAPReport, hasExtra: false },
  AR:  { label: "Customer", lookup: CustomerMastLookupModal, print: useHandlePrintARReport, excel: useHandleDownloadExcelARReport, hasExtra: false },
  VO:  { label: "Customer", lookup: CustomerMastLookupModal, print: useHandlePrintARReport, excel: useHandleDownloadExcelARReport, hasExtra: false },
  CWT: { label: "Customer", lookup: CustomerMastLookupModal, print: useHandlePrintARReport, excel: useHandleDownloadExcelARReport, hasExtra: false },
  GL:  { label: "Account",  lookup: COAMastLookupModal,      print: useHandlePrintGLReport, excel: useHandleDownloadExcelGLReport, hasExtra: true  },
};

/** -----------------------------------------------------------
 * COMPONENT
 * ----------------------------------------------------------*/
const UniversalReportModal = ({ isOpen, onClose, userCode, module = "AP" }) => {
  const config = MODULE_DEFS[module] || MODULE_DEFS.AP;
  const today = useGetCurrentDay();
  const { companyInfo, currentUserRow } = useAuth();
  const firstDay = useMemo(() => useFormatToDate(new Date(new Date(today).getFullYear(), new Date(today).getMonth(), 1)), [today]);


  
  // UI Toggles
  const [ui, setUi] = useState({
    reportQuery: "",
    branchModal: false,
    mainLookup: false, // AP/AR/GL main filter
    slModal: false,   // GL Only
    rcModal: false,   // GL Only
    selected: { id: 0, name: "" },
    lookupMode: "S"   // "S"tart or "E"nd
  });

  // Filters (Unified for all modules)
  const [filters, setFilters] = useState({
    branchCode: "", branchName: "",
    startDate: firstDay, endDate: today,
    sCode: "", sName: "",
    eCode: "", eName: "",
    slCode: "", slName: "", // GL Only
    rcCode: "", rcName: ""  // GL Only
  });

  const updateUi = (patch) => setUi(prev => ({ ...prev, ...patch }));
  const updateFilters = (patch) => setFilters(prev => ({ ...prev, ...patch }));

  // TanStack Query for Report List
  const { data, isLoading: isInitialLoading } = useQuery({
    queryKey: ["reports", module, userCode],
    queryFn: async () => {
      const [rptRes, userRes] = await Promise.all([
        fetchData("hsrpt", { mdl: module, userCode }),
        useTopUserRow(userCode),
      ]);
      const list = rptRes?.data?.[0]?.result ? JSON.parse(rptRes.data[0].result) : [];
      return { list, userDefaults: userRes };
    },
    enabled: isOpen,
  });

  // Sync Defaults
  useEffect(() => {
    if (data?.list?.length > 0) {
      if (ui.selected.id === 0) updateUi({ selected: { id: data.list[0].reportId, name: data.list[0].reportName } });
      if (data.userDefaults && !filters.branchCode) {
        updateFilters({ branchCode: data.userDefaults.branchCode, branchName: data.userDefaults.branchName });
      }
    }
  }, [data]);

  // Mutation for Generation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const meta = await useTopHSRptRow(ui.selected.id);
      const params = {
        reportId: ui.selected.id,
        branchCode: filters.branchCode,
        startDate: filters.startDate,
        endDate: filters.endDate,
        sPayeeCode: filters.sCode, // Mapping generic to API expectation
        ePayeeCode: filters.eCode,
        sCustCode: filters.sCode,
        eCustCode: filters.eCode,
        sAccCode: filters.sCode,
        eAccCode: filters.eCode,
        slCode: filters.slCode,
        rcCode: filters.rcCode,
        userCode,
        mode: meta.sprocMode
      };

      const handler = meta.export === "Y" ? config.excel : config.print;
      const response = await handler(params);

      if (meta.export === "Y") {
        const colConfig = await useSelectedHSColConfig(meta.sprocMode, userCode);
        await exportGenericHistoryExcel({
          ReportName: meta.reportName,
          UserCode: currentUserRow.userCode,
          Branch: companyInfo.branchName,
          JsonData: { "Data": { [meta.reportName]: response.data } },
          companyName: companyInfo.compName,
          companyAddress: companyInfo.compAddr,
          companyTelNo: companyInfo.telNo,
          StartDate: filters.startDate,
          EndDate: filters.endDate,
        }, { [meta.reportName]: colConfig });
      }
    },
    onError: (e) => Swal.fire("Error", e.message, "error")
  });

  const filteredReports = useMemo(() => {
    return (data?.list || []).filter(r => r.reportName?.toLowerCase().includes(ui.reportQuery.toLowerCase()));
  }, [data?.list, ui.reportQuery]);

  if (!isOpen) return null;

  const MainLookupModal = config.lookup;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-[1100px] bg-white shadow-2xl rounded-2xl h-[85vh] flex flex-col overflow-hidden">
        
        <header className="flex justify-between px-6 py-4 border-b bg-blue-50">
          <h2 className="font-bold text-blue-800">{module} Reports</h2>
          <button onClick={onClose}><FontAwesomeIcon icon={faXmark} /></button>
        </header>

        <main className="flex-1 flex overflow-hidden">
          {/* Report Selection Sidebar */}
          <aside className="w-1/3 border-r bg-gray-50 flex flex-col">
            <div className="p-3 bg-white border-b">
              <input type="text" placeholder="Filter reports..." className="w-full border p-2 text-xs rounded" value={ui.reportQuery} onChange={e => updateUi({ reportQuery: e.target.value })} />
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredReports.map(r => (
                <button key={r.reportId} onClick={() => updateUi({ selected: { id: r.reportId, name: r.reportName } })}
                  className={`w-full text-left p-3 text-xs border-b ${ui.selected.id === r.reportId ? "bg-blue-600 text-white" : "hover:bg-gray-100"}`}>
                  {r.reportName}
                </button>
              ))}
            </div>
          </aside>

          {/* Configuration Form */}
          <section className="flex-1 p-6 space-y-4 overflow-y-auto bg-white">
            <h3 className="text-sm font-bold text-blue-700 border-b pb-2">{ui.selected.name}</h3>
            
            <div className="grid grid-cols-[9rem_1fr] gap-4 items-center">
              <label className="text-xs font-bold text-gray-500 uppercase">Branch</label>
              <div className="relative">
                <input readOnly value={filters.branchName} className="w-full border rounded p-2 text-xs bg-gray-50" />
                <button onClick={() => updateUi({ branchModal: true })} className="absolute right-1 top-1 bottom-1 bg-blue-600 text-white px-2 rounded"><FontAwesomeIcon icon={faMagnifyingGlass} /></button>
              </div>

              <label className="text-xs font-bold text-gray-500 uppercase">Start/End Date</label>
              <div className="flex gap-2">
                <input type="date" value={filters.startDate} onChange={e => updateFilters({ startDate: e.target.value })} className="border p-2 text-xs rounded w-full" />
                <input type="date" value={filters.endDate} onChange={e => updateFilters({ endDate: e.target.value })} className="border p-2 text-xs rounded w-full" />
              </div>

              {/* Main Dynamic Filter (Payee/Customer/Account) */}
              {["s", "e"].map(dir => (
                <React.Fragment key={dir}>
                  <label className="text-xs font-bold text-gray-500 uppercase">{dir === "s" ? "Starting" : "Ending"} {config.label}</label>
                  <div className="relative">
                    <input readOnly value={filters[`${dir}Name`]} className="w-full border rounded p-2 text-xs" />
                    <button onClick={() => updateUi({ lookupMode: dir.toUpperCase(), mainLookup: true })} className="absolute right-1 top-1 bottom-1 bg-blue-600 text-white px-2 rounded"><FontAwesomeIcon icon={faMagnifyingGlass} /></button>
                  </div>
                </React.Fragment>
              ))}

              {/* GL EXTRA FILTERS (Sub-Ledger and RC) */}
              {config.hasExtra && (
                <>
                  <label className="text-xs font-bold text-gray-500 uppercase">Sub-Ledger</label>
                  <div className="relative">
                    <input readOnly value={filters.slName} className="w-full border rounded p-2 text-xs" />
                    <button onClick={() => updateUi({ slModal: true })} className="absolute right-1 top-1 bottom-1 bg-blue-600 text-white px-2 rounded"><FontAwesomeIcon icon={faMagnifyingGlass} /></button>
                  </div>

                  <label className="text-xs font-bold text-gray-500 uppercase">Resp. Center</label>
                  <div className="relative">
                    <input readOnly value={filters.rcName} className="w-full border rounded p-2 text-xs" />
                    <button onClick={() => updateUi({ rcModal: true })} className="absolute right-1 top-1 bottom-1 bg-blue-600 text-white px-2 rounded"><FontAwesomeIcon icon={faMagnifyingGlass} /></button>
                  </div>
                </>
              )}
            </div>

            <div className="pt-6 border-t flex justify-end gap-2">
              <button onClick={() => updateFilters({ sCode: "", sName: "", eCode: "", eName: "", slCode: "", slName: "", rcCode: "", rcName: "" })} 
                className="p-2 text-xs font-bold text-gray-500 hover:text-blue-600"><FontAwesomeIcon icon={faBroom} /> Clear Filters</button>
              <button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending || !ui.selected.id}
                className="bg-blue-600 text-white px-10 py-2 rounded font-bold text-xs uppercase shadow-lg">
                {generateMutation.isPending ? <FontAwesomeIcon icon={faCircleNotch} spin /> : "Generate"}
              </button>
            </div>
          </section>
        </main>

        {(isInitialLoading || generateMutation.isPending) && <LoadingSpinner />}

        {/* Dynamic Modals */}
        {ui.branchModal && <BranchLookupModal isOpen={ui.branchModal} onClose={p => { if(p?.branchCode) updateFilters({ branchCode: p.branchCode, branchName: p.branchName }); updateUi({ branchModal: false }); }} />}
        {ui.mainLookup && <MainLookupModal isOpen={ui.mainLookup} onClose={p => {
          if (p) {
            const code = p.payeeCode || p.vendCode || p.custCode || p.accCode;
            const name = p.payeeName || p.vendName || p.custName || p.accName;
            if (ui.lookupMode === "S") updateFilters({ sCode: code, sName: name, eCode: code, eName: name });
            else updateFilters({ eCode: code, eName: name });
          }
          updateUi({ mainLookup: false });
        }} />}
        {ui.slModal && <SLMastLookupModal isOpen={ui.slModal} onClose={p => { if(p) updateFilters({ slCode: p.slCode, slName: p.slName }); updateUi({ slModal: false }); }} />}
        {ui.rcModal && <RCLookupModal isOpen={ui.rcModal} onClose={p => { if(p) updateFilters({ rcCode: p.rcCode, rcName: p.rcName }); updateUi({ rcModal: false }); }} />}
      </div>
    </div>
  );
};

export default UniversalReportModal;