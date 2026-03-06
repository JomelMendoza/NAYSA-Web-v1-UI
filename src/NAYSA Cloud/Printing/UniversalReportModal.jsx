// import React, { useState, useMemo, useEffect } from "react";
// import { useQuery, useMutation } from "@tanstack/react-query";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { 
//   faMagnifyingGlass, faXmark, faCircleNotch, 
//   faBroom, faDownload, faCircleXmark ,faFileExcel
// } from "@fortawesome/free-solid-svg-icons";
// import Swal from "sweetalert2";

// // --- Project Imports ---
// import { fetchData } from "@/NAYSA Cloud/Configuration/BaseURL";
// import { useTopUserRow, useTopHSRptRow } from "@/NAYSA Cloud/Global/top1RefTable";
// import { 
//   useHandlePrintAPReport, useHandleDownloadExcelAPReport,
//   useHandlePrintARReport, useHandleDownloadExcelARReport,
//   useHandlePrintGLReport, useHandleDownloadExcelGLReport 
// } from "@/NAYSA Cloud/Global/report";
// import { useSelectedHSColConfig } from '@/NAYSA Cloud/Global/selectedData';
// import { exportGenericHistoryExcel } from "@/NAYSA Cloud/Global/report";
// import { useGetCurrentDay, useFormatToDate } from "@/NAYSA Cloud/Global/dates";
// import { useAuth } from "@/NAYSA Cloud/Authentication/AuthContext.jsx";
// import { LoadingSpinner } from "@/NAYSA Cloud/Global/utilities.jsx";

// // --- Lookup Modals ---
// import BranchLookupModal from "@/NAYSA Cloud/Lookup/SearchBranchRef";
// import PayeeMastLookupModal from "@/NAYSA Cloud/Lookup/SearchVendMast";
// import CustomerMastLookupModal from "@/NAYSA Cloud/Lookup/SearchCustMast";
// import COAMastLookupModal from "@/NAYSA Cloud/Lookup/SearchCOAMast";
// import SLMastLookupModal from "@/NAYSA Cloud/Lookup/SearchSLMast";
// import RCLookupModal from "@/NAYSA Cloud/Lookup/SearchRCMast";

// /** * MODULE CONFIGURATION
//  * This maps each module to its specific label, modals, and API handlers.
//  */
// const MODULE_DEFS = {
//   AP:  { label: "Payee",    lookup: PayeeMastLookupModal,    print: useHandlePrintAPReport, excel: useHandleDownloadExcelAPReport, hasExtra: false },
//   VI:  { label: "Payee",    lookup: PayeeMastLookupModal,    print: useHandlePrintAPReport, excel: useHandleDownloadExcelAPReport, hasExtra: false },
//   EWT: { label: "Payee",    lookup: PayeeMastLookupModal,    print: useHandlePrintAPReport, excel: useHandleDownloadExcelAPReport, hasExtra: false },
//   AR:  { label: "Customer", lookup: CustomerMastLookupModal, print: useHandlePrintARReport, excel: useHandleDownloadExcelARReport, hasExtra: false },
//   VO:  { label: "Customer", lookup: CustomerMastLookupModal, print: useHandlePrintARReport, excel: useHandleDownloadExcelARReport, hasExtra: false },
//   CWT: { label: "Customer", lookup: CustomerMastLookupModal, print: useHandlePrintARReport, excel: useHandleDownloadExcelARReport, hasExtra: false },
//   GL:  { label: "Account",  lookup: COAMastLookupModal,      print: useHandlePrintGLReport, excel: useHandleDownloadExcelGLReport, hasExtra: true  },
// };

// /** -----------------------------------------------------------
//  * COMPONENT
//  * ----------------------------------------------------------*/
// const UniversalReportModal = ({ isOpen, onClose, userCode, module = "AP" }) => {
//   const config = MODULE_DEFS[module] || MODULE_DEFS.AP;
//   const today = useGetCurrentDay();
//   const { companyInfo, currentUserRow } = useAuth();
//   const firstDay = useMemo(() => useFormatToDate(new Date(new Date(today).getFullYear(), new Date(today).getMonth(), 1)), [today]);


  
//   // UI Toggles
//   const [ui, setUi] = useState({
//     reportQuery: "",
//     branchModal: false,
//     mainLookup: false, // AP/AR/GL main filter
//     slModal: false,   // GL Only
//     rcModal: false,   // GL Only
//     selected: { id: 0, name: "" },
//     lookupMode: "S"   // "S"tart or "E"nd
//   });

//   // Filters (Unified for all modules)
//   const [filters, setFilters] = useState({
//     branchCode: "", branchName: "",
//     startDate: firstDay, endDate: today,
//     sCode: "", sName: "",
//     eCode: "", eName: "",
//     slCode: "", slName: "", // GL Only
//     rcCode: "", rcName: ""  // GL Only
//   });

//   const updateUi = (patch) => setUi(prev => ({ ...prev, ...patch }));
//   const updateFilters = (patch) => setFilters(prev => ({ ...prev, ...patch }));

//   // TanStack Query for Report List
//   const { data, isLoading: isInitialLoading } = useQuery({
//     queryKey: ["reports", module, userCode],
//     queryFn: async () => {
//       const [rptRes, userRes] = await Promise.all([
//         fetchData("hsrpt", { mdl: module, userCode }),
//         useTopUserRow(userCode),
//       ]);
//       const list = rptRes?.data?.[0]?.result ? JSON.parse(rptRes.data[0].result) : [];
//       return { list, userDefaults: userRes };
//     },
//     enabled: isOpen,
//   });

//   // Sync Defaults
//   useEffect(() => {
//     if (data?.list?.length > 0) {
//       if (ui.selected.id === 0) updateUi({ selected: { id: data.list[0].reportId, name: data.list[0].reportName } });
//       if (data.userDefaults && !filters.branchCode) {
//         updateFilters({ branchCode: data.userDefaults.branchCode, branchName: data.userDefaults.branchName });
//       }
//     }
//   }, [data]);

//   // Mutation for Generation
//   const generateMutation = useMutation({
//     mutationFn: async () => {
//       const meta = await useTopHSRptRow(ui.selected.id);
//       const params = {
//         reportId: ui.selected.id,
//         branchCode: filters.branchCode,
//         startDate: filters.startDate,
//         endDate: filters.endDate,
//         sPayeeCode: filters.sCode, // Mapping generic to API expectation
//         ePayeeCode: filters.eCode,
//         sCustCode: filters.sCode,
//         eCustCode: filters.eCode,
//         sAccCode: filters.sCode,
//         eAccCode: filters.eCode,
//         slCode: filters.slCode,
//         rcCode: filters.rcCode,
//         userCode,
//         mode: meta.sprocMode
//       };

//       const handler = meta.export === "Y" ? config.excel : config.print;
//       const response = await handler(params);

//       if (meta.export === "Y") {
//         const colConfig = await useSelectedHSColConfig(meta.sprocMode, userCode);
//         await exportGenericHistoryExcel({
//           ReportName: meta.reportName,
//           UserCode: currentUserRow.userCode,
//           Branch: companyInfo.branchName,
//           JsonData: { "Data": { [meta.reportName]: response.data } },
//           companyName: companyInfo.compName,
//           companyAddress: companyInfo.compAddr,
//           companyTelNo: companyInfo.telNo,
//           StartDate: filters.startDate,
//           EndDate: filters.endDate,
//         }, { [meta.reportName]: colConfig });
//       }
//     },
//     onError: (e) => Swal.fire("Error", e.message, "error")
//   });

//   const filteredReports = useMemo(() => {
//     return (data?.list || []).filter(r => r.reportName?.toLowerCase().includes(ui.reportQuery.toLowerCase()));
//   }, [data?.list, ui.reportQuery]);

//   if (!isOpen) return null;

//   const MainLookupModal = config.lookup;

//   return (
//     <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-0 md:p-4">
//       {/* Container: Full screen on mobile, 55vh and max-width on desktop */}
//       <div className="relative w-full max-w-[1100px] bg-white shadow-2xl md:rounded-2xl h-full md:h-[65vh] flex flex-col overflow-hidden transition-all duration-300">
        
//         <header className="flex justify-between items-center px-4 md:px-6 py-3 md:py-4 border-b bg-blue-50">
//           <div className="flex items-center gap-3">
//             {/* Back Button for Mobile Detail View */}
//             {ui.showFormMobile && (
//                <button 
//                 className="md:hidden text-blue-600 pr-2"
//                 onClick={() => updateUi({ showFormMobile: false })}
//                >
//                  <FontAwesomeIcon icon={faXmark} className="rotate-90 mr-1" /> Back
//                </button>
//             )}
//             <h2 className="font-bold text-sm md:text-base text-blue-800 uppercase tracking-tight">
//                 {module} Reports
//             </h2>
//           </div>
//           <button onClick={onClose} className="p-2 hover:bg-blue-100 rounded-full transition-colors">
//             <FontAwesomeIcon icon={faXmark} className="text-gray-500" />
//           </button>
//         </header>

//         <main className="flex-1 flex overflow-hidden relative">
          
//           {/* Sidebar / Report List */}
//           <aside className={`
//             w-full md:w-1/3 border-r bg-gray-50 flex flex-col transition-transform duration-300
//             ${ui.showFormMobile ? "-translate-x-full md:translate-x-0 absolute md:relative" : "translate-x-0 relative"}
//           `}>
//             <div className="p-3 bg-white border-b">
//               <div className="relative">
//                 <input 
//                   type="text" 
//                   placeholder="Filter reports..." 
//                   className="w-full border p-2 pl-8 text-xs rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" 
//                   value={ui.reportQuery} 
//                   onChange={e => updateUi({ reportQuery: e.target.value })} 
//                 />
//                 <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//               </div>
//             </div>
//             <div className="flex-1 overflow-y-auto">
//               {filteredReports.map(r => (
//                 <button 
//                   key={r.reportId} 
//                   onClick={() => updateUi({ selected: { id: r.reportId, name: r.reportName }, showFormMobile: true })}
//                   className={`w-full text-left p-4 text-xs border-b transition-colors ${ui.selected.id === r.reportId ? "bg-blue-600 text-white" : "hover:bg-gray-100 bg-white"}`}
//                 >
//                   <div className="flex justify-between items-center">
//                     <span className="font-medium">{r.reportName}</span>
//                     {r.export === "Y" && (
//                       <span className={`shrink-0 flex items-center gap-1 ${ui.selected.id === r.reportId ? "text-white" : "text-emerald-600"}`}>
//                         <FontAwesomeIcon icon={faDownload} />
//                       </span>
//                     )}
//                   </div>
//                 </button>
//               ))}
//             </div>
//           </aside>

//           {/* Configuration Form */}
//           <section className={`
//             flex-1 p-4 md:p-6 space-y-4 overflow-y-auto bg-white transition-transform duration-300
//             ${ui.showFormMobile ? "translate-x-0 absolute inset-0 md:relative" : "translate-x-full md:translate-x-0 absolute md:relative"}
//           `}>
//             <div className="flex items-center justify-between border-b pb-2 mb-4">
//                 <h3 className="text-sm font-bold text-blue-700">{ui.selected.name}</h3>
//                 {ui.selected.id > 0 && data?.list.find(x => x.reportId === ui.selected.id)?.export === 'Y' && (
//                     <span className="text-emerald-600 text-[10px] font-bold uppercase border border-emerald-600 px-2 py-0.5 rounded">Excel Export</span>
//                 )}
//             </div>
            
//             <div className="grid grid-cols-1 md:grid-cols-[9rem_1fr] gap-3 md:gap-4 items-center">
//               <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase">Branch</label>
//               <div className="relative">
//                 <input readOnly value={filters.branchName} className="w-full border rounded-lg p-2.5 text-xs bg-gray-50 outline-none" />
//                 <button onClick={() => updateUi({ branchModal: true })} className="absolute right-1 top-1 bottom-1 bg-blue-600 text-white px-3 rounded-md active:bg-blue-800 transition-colors"><FontAwesomeIcon icon={faMagnifyingGlass} /></button>
//               </div>

//               <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase">Start/End Date</label>
//               <div className="flex flex-col sm:flex-row gap-2">
//                 <input type="date" value={filters.startDate} onChange={e => updateFilters({ startDate: e.target.value })} className="border p-2.5 text-xs rounded-lg w-full outline-none focus:border-blue-500" />
//                 <input type="date" value={filters.endDate} onChange={e => updateFilters({ endDate: e.target.value })} className="border p-2.5 text-xs rounded-lg w-full outline-none focus:border-blue-500" />
//               </div>

//               {["s", "e"].map(dir => (
//                 <React.Fragment key={dir}>
//                   <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase">{dir === "s" ? "Starting" : "Ending"} {config.label}</label>
//                   <div className="relative">
//                     <input readOnly value={filters[`${dir}Name`]} placeholder={`Select ${config.label}...`} className="w-full border rounded-lg p-2.5 text-xs outline-none focus:border-blue-500" />
//                     <button onClick={() => updateUi({ lookupMode: dir.toUpperCase(), mainLookup: true })} className="absolute right-1 top-1 bottom-1 bg-blue-600 text-white px-3 rounded-md active:bg-blue-800 transition-colors"><FontAwesomeIcon icon={faMagnifyingGlass} /></button>
//                   </div>
//                 </React.Fragment>
//               ))}

//               {config.hasExtra && (
//                 <>
//                   <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase">Sub-Ledger</label>
//                   <div className="relative">
//                     <input readOnly value={filters.slName} className="w-full border rounded-lg p-2.5 text-xs outline-none focus:border-blue-500" />
//                     <button onClick={() => updateUi({ slModal: true })} className="absolute right-1 top-1 bottom-1 bg-blue-600 text-white px-3 rounded-md active:bg-blue-800 transition-colors"><FontAwesomeIcon icon={faMagnifyingGlass} /></button>
//                   </div>

//                   <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase">Resp. Center</label>
//                   <div className="relative">
//                     <input readOnly value={filters.rcName} className="w-full border rounded-lg p-2.5 text-xs outline-none focus:border-blue-500" />
//                     <button onClick={() => updateUi({ rcModal: true })} className="absolute right-1 top-1 bottom-1 bg-blue-600 text-white px-3 rounded-md active:bg-blue-800 transition-colors"><FontAwesomeIcon icon={faMagnifyingGlass} /></button>
//                   </div>
//                 </>
//               )}
//             </div>

//             <div className="pt-6 md:border-t flex flex-col sm:flex-row justify-end gap-2 md:mt-4">
//               <button 
//                 onClick={() => updateFilters({ sCode: "", sName: "", eCode: "", eName: "", slCode: "", slName: "", rcCode: "", rcName: "" })} 
//                 className="order-2 sm:order-1 p-3 text-xs font-bold text-gray-500 hover:text-red-500 transition-colors flex items-center justify-center gap-2"
//               >
//                 <FontAwesomeIcon icon={faBroom} /> Clear Filters
//               </button>
//               <button 
//                 onClick={() => generateMutation.mutate()} 
//                 disabled={generateMutation.isPending || !ui.selected.id}
//                 className="order-1 sm:order-2 bg-blue-600 text-white px-10 py-3.5 rounded-xl md:rounded-lg font-black text-xs uppercase shadow-lg active:scale-95 transition-all disabled:bg-gray-300"
//               >
//                 {generateMutation.isPending ? <FontAwesomeIcon icon={faCircleNotch} spin /> : "Generate Report"}
//               </button>
//             </div>
//           </section>
//         </main>

//         {(isInitialLoading || generateMutation.isPending) && <LoadingSpinner />}
        
//         {/* Modals remain the same ... */}
//         {ui.branchModal && <BranchLookupModal isOpen={ui.branchModal} onClose={p => { if(p?.branchCode) updateFilters({ branchCode: p.branchCode, branchName: p.branchName }); updateUi({ branchModal: false }); }} />}
//         {ui.mainLookup && <MainLookupModal isOpen={ui.mainLookup} onClose={p => {
//           if (p) {
//             const code = p.payeeCode || p.vendCode || p.custCode || p.accCode;
//             const name = p.payeeName || p.vendName || p.custName || p.accName;
//             if (ui.lookupMode === "S") updateFilters({ sCode: code, sName: name, eCode: code, eName: name });
//             else updateFilters({ eCode: code, eName: name });
//           }
//           updateUi({ mainLookup: false });
//         }} />}
//         {ui.slModal && <SLMastLookupModal isOpen={ui.slModal} onClose={p => { if(p) updateFilters({ slCode: p.slCode, slName: p.slName }); updateUi({ slModal: false }); }} />}
//         {ui.rcModal && <RCLookupModal isOpen={ui.rcModal} onClose={p => { if(p) updateFilters({ rcCode: p.rcCode, rcName: p.rcName }); updateUi({ rcModal: false }); }} />}
//       </div>
//     </div>
//   );
// };
// export default UniversalReportModal;


import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faMagnifyingGlass, faXmark, faCircleNotch, 
  faBroom, faDownload, faCircleXmark, faChevronLeft 
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

/** * MODULE CONFIGURATION */
const MODULE_DEFS = {
  AP:  { label: "Payee",    lookup: PayeeMastLookupModal,    print: useHandlePrintAPReport, excel: useHandleDownloadExcelAPReport, hasExtra: false },
  VI:  { label: "Payee",    lookup: PayeeMastLookupModal,    print: useHandlePrintAPReport, excel: useHandleDownloadExcelAPReport, hasExtra: false },
  EWT: { label: "Payee",    lookup: PayeeMastLookupModal,    print: useHandlePrintAPReport, excel: useHandleDownloadExcelAPReport, hasExtra: false },
  AR:  { label: "Customer", lookup: CustomerMastLookupModal, print: useHandlePrintARReport, excel: useHandleDownloadExcelARReport, hasExtra: false },
  VO:  { label: "Customer", lookup: CustomerMastLookupModal, print: useHandlePrintARReport, excel: useHandleDownloadExcelARReport, hasExtra: false },
  CWT: { label: "Customer", lookup: CustomerMastLookupModal, print: useHandlePrintARReport, excel: useHandleDownloadExcelARReport, hasExtra: false },
  GL:  { label: "Account",  lookup: COAMastLookupModal,      print: useHandlePrintGLReport, excel: useHandleDownloadExcelGLReport, hasExtra: true  },
};

const UniversalReportModal = ({ isOpen, onClose, userCode, module = "AP" }) => {
  const config = MODULE_DEFS[module] || MODULE_DEFS.AP;
  const today = useGetCurrentDay();
  const { companyInfo, currentUserRow } = useAuth();
  const firstDay = useMemo(() => useFormatToDate(new Date(new Date(today).getFullYear(), new Date(today).getMonth(), 1)), [today]);

  // UI States
  const [ui, setUi] = useState({
    reportQuery: "",
    branchModal: false,
    mainLookup: false,
    slModal: false,
    rcModal: false,
    selected: { id: 0, name: "" },
    lookupMode: "S",
    showFormMobile: false // Master-Detail Toggle
  });

  // Filters
  const [filters, setFilters] = useState({
    branchCode: "", branchName: "",
    startDate: firstDay, endDate: today,
    sCode: "", sName: "",
    eCode: "", eName: "",
    slCode: "", slName: "", 
    rcCode: "", rcName: ""
  });

  const updateUi = (patch) => setUi(prev => ({ ...prev, ...patch }));
  const updateFilters = (patch) => setFilters(prev => ({ ...prev, ...patch }));

  // Reset mobile view when modal opens/closes
  useEffect(() => {
    if (!isOpen) updateUi({ showFormMobile: false });
  }, [isOpen]);

  // Fetch Report List
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

  // Generate Mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const meta = await useTopHSRptRow(ui.selected.id);
      const params = {
        reportId: ui.selected.id,
        branchCode: filters.branchCode,
        startDate: filters.startDate,
        endDate: filters.endDate,
        sPayeeCode: filters.sCode, sCustCode: filters.sCode, sAccCode: filters.sCode,
        ePayeeCode: filters.eCode, eCustCode: filters.eCode, eAccCode: filters.eCode,
        slCode: filters.slCode, rcCode: filters.rcCode,
        userCode, mode: meta.sprocMode
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 md:p-4">
      <div className="relative w-full max-w-[1100px] bg-white shadow-2xl md:rounded-2xl h-full md:h-[70vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <header className="flex justify-between items-center px-4 py-3 md:px-6 border-b bg-blue-50 shrink-0">
          <div className="flex items-center gap-2">
            {ui.showFormMobile && (
              <button onClick={() => updateUi({ showFormMobile: false })} className="md:hidden p-2 -ml-2 text-blue-600 active:bg-blue-100 rounded-full">
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
            )}
            <h2 className="font-bold text-sm md:text-base text-blue-800 uppercase tracking-wide">{module} Reports</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </header>

        <main className="flex-1 flex overflow-hidden relative">
          {/* Master: Report List */}
          <aside className={`
            absolute inset-0 z-10 md:relative md:w-1/3 border-r bg-gray-50 flex flex-col transition-transform duration-300 ease-in-out
            ${ui.showFormMobile ? "-translate-x-full md:translate-x-0" : "translate-x-0"}
          `}>
            <div className="p-3 bg-white border-b">
              <div className="relative">
                <input type="text" placeholder="Filter reports..." className="w-full border p-2 pl-8 text-xs rounded-lg outline-none focus:ring-2 focus:ring-blue-400" value={ui.reportQuery} onChange={e => updateUi({ reportQuery: e.target.value })} />
                <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredReports.map(r => (
                <button key={r.reportId} onClick={() => updateUi({ selected: { id: r.reportId, name: r.reportName }, showFormMobile: true })}
                  className={`w-full text-left p-4 text-xs border-b transition-colors ${ui.selected.id === r.reportId ? "bg-blue-600 text-white shadow-md" : "hover:bg-blue-50 bg-white"}`}>
                  <div className="flex justify-between items-center">
                    <span className={ui.selected.id === r.reportId ? "font-bold" : "font-medium"}>{r.reportName}</span>
                    {r.export === "Y" && <FontAwesomeIcon icon={faDownload} className={ui.selected.id === r.reportId ? "text-white" : "text-emerald-500"} />}
                  </div>
                </button>
              ))}
            </div>
          </aside>

          {/* Detail: Configuration Form */}
          <section className={`
            absolute inset-0 bg-white md:relative md:flex-1 p-4 md:p-6 flex flex-col transition-transform duration-300 ease-in-out
            ${ui.showFormMobile ? "translate-x-0" : "translate-x-full md:translate-x-0"}
          `}>
            <div className="flex justify-between items-start mb-6 border-b pb-2">
              <h3 className="text-sm font-bold text-blue-700 leading-tight">{ui.selected.name}</h3>
              {data?.list.find(x => x.reportId === ui.selected.id)?.export === 'Y' && (
                <span className="shrink-0 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded ml-2 border border-emerald-200">EXCEL EXPORT</span>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-5 pb-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Branch</label>
                <div className="relative">
                  <input readOnly value={filters.branchName} className="w-full border rounded-xl p-3 text-xs bg-gray-50 outline-none" />
                  <button onClick={() => updateUi({ branchModal: true })} className="absolute right-1.5 top-1.5 bottom-1.5 bg-blue-600 text-white px-3 rounded-lg hover:bg-blue-700"><FontAwesomeIcon icon={faMagnifyingGlass} /></button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Start Date</label>
                  <input type="date" value={filters.startDate} onChange={e => updateFilters({ startDate: e.target.value })} className="w-full border p-3 text-xs rounded-xl outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">End Date</label>
                  <input type="date" value={filters.endDate} onChange={e => updateFilters({ endDate: e.target.value })} className="w-full border p-3 text-xs rounded-xl outline-none focus:border-blue-500" />
                </div>
              </div>

              {["s", "e"].map(dir => (
                <div key={dir} className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{dir === "s" ? "Starting" : "Ending"} {config.label}</label>
                  <div className="relative">
                    <input readOnly value={filters[`${dir}Name`]} placeholder={`Select ${config.label}...`} className="w-full border rounded-xl p-3 text-xs outline-none focus:border-blue-500" />
                    <div className="absolute right-1.5 top-1.5 bottom-1.5 flex gap-1">
                       {filters[`${dir}Name`] && <button onClick={() => updateFilters({ [`${dir}Code`]: "", [`${dir}Name`]: "" })} className="p-2 text-gray-300 hover:text-red-500"><FontAwesomeIcon icon={faCircleXmark} /></button>}
                       <button onClick={() => updateUi({ lookupMode: dir.toUpperCase(), mainLookup: true })} className="bg-blue-600 text-white px-3 rounded-lg hover:bg-blue-700 transition-colors"><FontAwesomeIcon icon={faMagnifyingGlass} /></button>
                    </div>
                  </div>
                </div>
              ))}

              {config.hasExtra && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sub-Ledger</label>
                    <div className="relative">
                      <input readOnly value={filters.slName} className="w-full border rounded-xl p-3 text-xs outline-none" />
                      <button onClick={() => updateUi({ slModal: true })} className="absolute right-1.5 top-1.5 bottom-1.5 bg-blue-600 text-white px-3 rounded-lg"><FontAwesomeIcon icon={faMagnifyingGlass} /></button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Resp. Center</label>
                    <div className="relative">
                      <input readOnly value={filters.rcName} className="w-full border rounded-xl p-3 text-xs outline-none" />
                      <button onClick={() => updateUi({ rcModal: true })} className="absolute right-1.5 top-1.5 bottom-1.5 bg-blue-600 text-white px-3 rounded-lg"><FontAwesomeIcon icon={faMagnifyingGlass} /></button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t flex flex-col gap-2 bg-white mt-auto">
              <button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending || !ui.selected.id}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-xs uppercase shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:bg-gray-300">
                {generateMutation.isPending ? <FontAwesomeIcon icon={faCircleNotch} spin /> : "Generate Report"}
              </button>
              <button onClick={() => updateFilters({ sCode: "", sName: "", eCode: "", eName: "", slCode: "", slName: "", rcCode: "", rcName: "" })} 
                className="w-full p-2 text-[11px] font-bold text-gray-400 hover:text-blue-600 flex items-center justify-center gap-2 transition-colors">
                <FontAwesomeIcon icon={faBroom} /> Clear Filters
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
