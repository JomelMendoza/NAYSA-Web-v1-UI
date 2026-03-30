// import { useEffect, useRef, useState, useMemo } from "react";
// import { useQuery, useQueryClient } from "@tanstack/react-query";
// import { apiClient } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";
// import { useAuth } from "@/NAYSA Cloud/Authentication/AuthContext.jsx";
// import { useSelectedHSColConfig } from "@/NAYSA Cloud/Global/selectedData";
// import { LoadingSpinner } from "@/NAYSA Cloud/Global/utilities.jsx";

// // Lookup / modal components
// import SearchGlobalReportTable from "../../Lookup/SearchGlobalReportTable";
// import BranchLookupModal from "@/NAYSA Cloud/Lookup/SearchBranchRef";
// import UsersLookupModal from "@/NAYSA Cloud/Lookup/SearchUsers";
// import HSDocLookupModal from "@/NAYSA Cloud/Lookup/SearchHSDocRef";


// // FontAwesome icons used in this page
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import {
//   faSearch,
//   faUndo,
//   faTimes,
//   faExchangeAlt,
//   faTable,
//   faThLarge,
//   faExternalLinkAlt,
//   faEye,
// } from "@fortawesome/free-solid-svg-icons";

// // Reusable UI components
// import FieldRenderer from "@/NAYSA Cloud/Global/FieldRenderer";
// import ButtonBar from "@/NAYSA Cloud/Global/ButtonBar";

// /* =========================================================
//    COMPARISON MODAL
//    ---------------------------------------------------------
//    Used only for REFERENCE tab.
//    When user clicks "View" in reference records, this modal
//    displays the old value and new value side by side.
// ========================================================= */
// const ComparisonModal = ({ data, onClose }) => {
//   // If no selected data, do not render modal
//   if (!data) return null;

//   /* Convert field name to proper readable label
//      Example:
//      acctGroup   -> Acct Group
//      refCode     -> Ref Code
//   */
//   const toProperCase = (str) => {
//     return str
//       .replace(/([A-Z])/g, " $1")
//       .replace(/^./, (s) => s.toUpperCase())
//       .trim();
//   };

//   /* Some values from API may already be object,
//      some may still be JSON string.
//      This safely converts both into object.
//   */
//   const parseValue = (val) => {
//     try {
//       if (!val) return {};
//       return typeof val === "string" ? JSON.parse(val) : val;
//     } catch (e) {
//       return {};
//     }
//   };

//   // Convert before/after snapshots to objects
//   const before = parseValue(data.beforeVal);
//   const after = parseValue(data.afterVal);
//   const activityLabel =
//   String(data.activity || "").toLowerCase() === "added"
//     ? "Added By"
//     : String(data.activity || "").toLowerCase() === "deleted"
//     ? "Deleted By"
//     : String(data.activity || "").toLowerCase() === "edited"
//     ? "Edited By"
//     : "Modified By / Created By";

//   // Combine all possible keys from before and after
//   const allKeys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));

//   return (
//     <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
//       <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-gray-200 dark:border-gray-800">

//         {/* ===== Modal Header ===== */}
//         <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
//           <div className="flex justify-between items-start gap-4">
//             <div className="flex items-center gap-4 min-w-0">
//               <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 border border-blue-100 dark:border-blue-800 shrink-0">
//                 <FontAwesomeIcon icon={faExchangeAlt} />
//               </div>
//               <div className="min-w-0">
//                 <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight truncate">
//                   Audit Comparison
//                 </h2>
//                 <p className="text-[11px] text-gray-500 mt-0.5 italic truncate">
//                   Comparing data snapshots
//                 </p>
//               </div>
//             </div>

//             {/* Close modal button */}
//             <button
//               onClick={onClose}
//               className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
//             >
//               <FontAwesomeIcon icon={faTimes} size="lg" />
//             </button>
//           </div>

//           {/* Summary / context badges */}
//           <div className="mt-5 flex flex-wrap gap-2">
//             {[
//               { label: "Reference File", val: data.tblName },
//               { label: activityLabel, val: data.userName },
//               { label: "Ref Code", val: data.refCode },
//               { label: "Ref Name", val: data.refName },
//             ].map((item, idx) => (
//               <div
//                 key={idx}
//                 className="bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded border border-gray-100 dark:border-gray-700"
//               >
//                 <span className="text-[9px] text-gray-400 font-bold uppercase block leading-none mb-1">
//                   {item.label}
//                 </span>
//                 <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-200">
//                   {item.val || "—"}
//                 </span>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* ===== Modal Table Body ===== */}
//         <div className="flex-1 overflow-auto bg-gray-50/30 dark:bg-gray-950/30">
//           <table className="w-full text-left text-[12px] border-separate border-spacing-0">
//             <thead className="sticky top-0 bg-white dark:bg-gray-900 z-10 shadow-sm">
//               <tr className="text-[10px] uppercase font-bold text-gray-400">
//                 <th className="px-4 sm:px-6 py-3 border-b border-gray-100 dark:border-gray-800">
//                   Column Name
//                 </th>
//                 <th className="px-4 sm:px-6 py-3 border-b border-gray-100 dark:border-gray-800 bg-red-50/20 text-red-500">
//                   Old Value
//                 </th>
//                 <th className="px-4 sm:px-6 py-3 border-b border-gray-100 dark:border-gray-800 bg-green-50/20 text-green-600">
//                   New Value
//                 </th>
//               </tr>
//             </thead>

//             <tbody>
//               {allKeys.map((key) => {
//                 // Highlight row if value changed
//                 const isDiff = String(before[key]) !== String(after[key]);

//                 return (
//                   <tr
//                     key={key}
//                     className={`hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors ${
//                       isDiff ? "bg-amber-50/30 dark:bg-amber-900/5" : ""
//                     }`}
//                   >
//                     <td className="px-4 sm:px-6 py-3 border-b border-gray-100 dark:border-gray-800 font-medium text-gray-600 dark:text-gray-400">
//                       {toProperCase(key)}
//                     </td>
//                     <td className="px-4 sm:px-6 py-3 border-b border-gray-100 dark:border-gray-800 font-mono text-red-500 italic break-all">
//                       {String(before[key] ?? "—")}
//                     </td>
//                     <td className="px-4 sm:px-6 py-3 border-b border-gray-100 dark:border-gray-800 font-mono text-green-600 font-bold break-all">
//                       {String(after[key] ?? "—")}
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>

//         {/* ===== Modal Footer ===== */}
//         <div className="px-4 sm:px-6 py-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex justify-end">
//           <button
//             onClick={onClose}
//             className="bg-blue-600 text-white px-4 h-8 rounded-md text-[11px] hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
//           >
//             <FontAwesomeIcon icon={faTimes} className="text-[10px]" />
//             Close
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// /* =========================================================
//    DATE HELPERS
//    ---------------------------------------------------------
//    Generates default date values for the filters.
//    TODAY         = current date
//    ONE_MONTH_AGO = current date minus 1 month
// ========================================================= */
// const getInitialDate = (offsetMonth = 0) => {
//   const d = new Date();
//   d.setMonth(d.getMonth() - offsetMonth);
//   return d.toISOString().split("T")[0];
// };

// const TODAY = getInitialDate(0);
// const ONE_MONTH_AGO = getInitialDate(1);

// /* =========================================================
//    MAIN PAGE COMPONENT
// ========================================================= */
// const AuditTrail = () => {
//   // Logged-in user info from auth context
//   const { currentUserRow } = useAuth();

//   // React Query client used for clearing cache manually
//   const queryClient = useQueryClient();

//   // Optional refs for table components
//   const tableRefTrans = useRef(null);
//   const tableRefRef = useRef(null);

//   // Stores table state if SearchGlobalReportTable emits changes
//   const tableStateRef = useRef({ transactions: {}, reference: {} });

//   // Active tab: transactions or reference
//   const [activeTab, setActiveTab] = useState("transactions");

//   // Selected row for comparison modal
//   const [selectedRowCompare, setSelectedRowCompare] = useState(null);

//   // Detect mobile layout
//   const [isMobile, setIsMobile] = useState(false);

//   // Mobile mode can switch between card and table
//   const [mobileView, setMobileView] = useState("card");

//   /* ======================================================
//      DEFAULT FILTERS
//      ------------------------------------------------------
//      useMemo is used so default values are recalculated only
//      when required.
//   ====================================================== */
//   const initialTrans = useMemo(
//     () => ({
//       branchCode: currentUserRow?.branchCode || "",
//       branchName: currentUserRow?.branchName || "",
//       docCode: "",
//       docName: "",
//       docNo: "",
//       userCode: "",
//       userName: "",
//       startDate: ONE_MONTH_AGO,
//       endDate: TODAY,
//     }),
//     [currentUserRow]
//   );

//   const initialRef = useMemo(
//     () => ({
//       refFile: "",
//       refName: "",
//       userCode: "",
//       userName: "",
//       startDate: ONE_MONTH_AGO,
//       endDate: TODAY,
//     }),
//     []
//   );

//   // Live filter states
//   const [filterTrans, setFilterTrans] = useState(initialTrans);
//   const [filterRef, setFilterRef] = useState(initialRef);

//   // Modal visibility state
//   const [modals, setModals] = useState({
//     branch: false,
//     user: false,
//     docCode:false,
//   });

//   // Tracks if current tab was cleared/reset
//   const [clearedTabs, setClearedTabs] = useState({
//     transactions: false,
//     reference: false,
//   });

//   // Used for showing loading overlay only on manual search
//   const [isManualSearch, setIsManualSearch] = useState(false);

//   /* ======================================================
//      AUTO-SET USER BRANCH
//      ------------------------------------------------------
//      If transaction filter has no branch yet,
//      use current logged-in user's branch.
//   ====================================================== */
//   useEffect(() => {
//     if (currentUserRow) {
//       setFilterTrans((prev) => ({
//         ...prev,
//         branchCode: prev.branchCode || currentUserRow.branchCode,
//         branchName: prev.branchName || currentUserRow.branchName,
//       }));
//     }
//   }, [currentUserRow]);

//   /* ======================================================
//      MOBILE DETECTION
//      ------------------------------------------------------
//      Checks if current screen width is below md breakpoint.
//   ====================================================== */
//   useEffect(() => {
//     const handleResize = () => setIsMobile(window.innerWidth < 768);
//     handleResize(); // run immediately on mount
//     window.addEventListener("resize", handleResize);
//     return () => window.removeEventListener("resize", handleResize);
//   }, []);

//   /* ======================================================
//      COLUMN LOADER
//      ------------------------------------------------------
//      Loads column definitions for SearchGlobalReportTable.
//      One config for transaction trail, one for reference trail.
//   ====================================================== */
//   const fetchCols = (key, config) =>
//     useQuery({
//       queryKey: ["auditCols", key],
//       queryFn: () => useSelectedHSColConfig(config),
//       staleTime: Infinity,
//     });

//   const { data: colsTrans, isLoading: isColsTransLoading } = fetchCols("TRAN", "GetDocTrail");
//   const { data: colsRef, isLoading: isColsRefLoading } = fetchCols("REF", "GetRefTrail");

//   /* ======================================================
//      DATA LOADER
//      ------------------------------------------------------
//      Generic query function for both transaction and reference.
//      Calls API and parses returned data.
//   ====================================================== */
//   const useAuditData = (key, endpoint, filters, enabledCols) =>
//     useQuery({
//       queryKey: ["auditData", key],
//       queryFn: async () => {
//         // If tab is marked as cleared, return empty result
//         if (clearedTabs[key === "TRAN" ? "transactions" : "reference"]) return [];

//         const { data } = await apiClient.post(endpoint, {
//           PARAMS: JSON.stringify(filters),
//         });

//         const raw = data?.data?.[0]?.result || data?.result || data?.data;

//         // After query finishes, remove manual loading overlay
//         setIsManualSearch(false);

//         return typeof raw === "string" ? JSON.parse(raw) : raw || [];
//       },
//       enabled: !!enabledCols,
//       refetchInterval: 30000, // auto refresh every 30 sec
//     });

//   // Transaction dataset
//   const {
//     data: dataTrans,
//     isFetching: isFetchTrans,
//     refetch: refetchTrans,
//   } = useAuditData("TRAN", "getDocTrail", filterTrans, colsTrans);

//   // Reference dataset
//   const {
//     data: dataRef,
//     isFetching: isFetchRef,
//     refetch: refetchRef,
//   } = useAuditData("REF", "getRefTrail", filterRef, colsRef);

//   /* ======================================================
//      ACTION HANDLERS
//   ====================================================== */

//   // Manual search button handler
//   const handleSearch = () => {
//     setClearedTabs((prev) => ({ ...prev, [activeTab]: false }));
//     setIsManualSearch(true);
//     activeTab === "transactions" ? refetchTrans() : refetchRef();
//   };

//   // Reset button handler
//   const handleReset = () => {
//     if (activeTab === "transactions") {
//       setFilterTrans(initialTrans);
//       queryClient.setQueryData(["auditData", "TRAN"], []);
//     } else {
//       setFilterRef(initialRef);
//       queryClient.setQueryData(["auditData", "REF"], []);
//     }

//     setClearedTabs((p) => ({ ...p, [activeTab]: true }));
//     setIsManualSearch(false);
//   };

//   // What happens when user clicks "View"
//   const handleViewRow = (row) => {
//     if (activeTab === "reference") {
//       // For reference tab: open comparison modal
//       setSelectedRowCompare(row);
//     } else {
//       // For transactions tab: open pathUrl if available
//       row.pathUrl && window.open(row.pathUrl, "_blank", "noopener,noreferrer");
//     }
//   };

//   /* ======================================================
//      DISPLAY HELPERS
//   ====================================================== */

//   // Converts DB/property key into readable label
//   const formatLabel = (key) =>
//     String(key || "")
//       .replace(/([A-Z])/g, " $1")
//       .replace(/_/g, " ")
//       .replace(/^./, (s) => s.toUpperCase())
//       .trim();

//   // Safe value renderer
//   const renderValue = (value) => {
//     if (value === null || value === undefined || value === "") return "—";
//     return String(value);
//   };

//   /* ======================================================
//      MOBILE CARD VIEW
//      ------------------------------------------------------
//      Used only on mobile when user selects "Card" mode.
//      Desktop still uses SearchGlobalReportTable.
//   ====================================================== */
//   const CardView = ({ data = [], type = "transactions" }) => {
//     if (!data.length) {
//       return (
//         <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center text-sm text-gray-500">
//           No records found.
//         </div>
//       );
//     }

//     return (
//       <div className="grid grid-cols-1 gap-4">
//         {data.map((row, index) => {
//           // Hide some fields not needed in card body
//           const entries = Object.entries(row || {}).filter(
//             ([key]) => !["pathUrl", "beforeVal", "afterVal"].includes(key)
//           );

//           return (
//             <div
//               key={row.id || row.recNo || row.docNo || row.refCode || index}
//               className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
//             >
//               {/* Card header */}
//               <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3">
//                 <div className="min-w-0">
//                   <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">
//                     {type === "transactions"
//                       ? row.docName || row.docCode || row.docNo || "Transaction Record"
//                       : row.refName || row.refCode || row.tblName || "Reference Record"}
//                   </h3>

//                   <p className="text-[11px] text-gray-500 truncate">
//                     {type === "transactions"
//                       ? row.docNo || row.branchName || "—"
//                       : row.tblName || row.userName || "—"}
//                   </p>
//                 </div>

//                 {/* Card action button */}
//                 <button
//                   onClick={() => handleViewRow(row)}
//                   className="ml-3 shrink-0 bg-blue-600 text-white px-3 h-8 rounded-md text-[11px] hover:bg-blue-700 transition-colors flex items-center gap-2"
//                 >
//                   <FontAwesomeIcon icon={type === "transactions" ? faExternalLinkAlt : faEye} />
//                   <span>View</span>
//                 </button>
//               </div>

//               {/* Card details */}
//               <div className="px-4">
//                 <div className="grid grid-cols-1">
//                   {entries.slice(0, 8).map(([key, value]) => (
//                     <div
//                       key={key}
//                       className="grid grid-cols-2 gap-2 items-start border-b border-gray-100 dark:border-gray-700 last:border-b-0 py-1"
//                     >
//                       <div className="text-[11px] text-gray-500 dark:text-gray-400">
//                         {formatLabel(key)}
//                       </div>
//                       <div className="text-[12px] text-gray-700 dark:text-gray-200 break-words text-right">
//                         {renderValue(value)}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     );
//   };

//   /* ======================================================
//      SMALL CLEAR BUTTON
//      ------------------------------------------------------
//      Reusable clear button for lookup/text fields.
//   ====================================================== */
//   const ClearButton = ({ onClear }) => (
//     <button
//       onClick={(e) => {
//         e.stopPropagation();
//         onClear();
//       }}
//       className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 z-10 p-1"
//     >
//       <FontAwesomeIcon icon={faTimes} className="text-[10px]" />
//     </button>
//   );

//   return (
//     <div className="global-ref-main-div-ui relative h-screen flex flex-col overflow-hidden">
//       {/* Reference comparison modal */}
//       <ComparisonModal data={selectedRowCompare} onClose={() => setSelectedRowCompare(null)} />

//       {/* Manual search loading overlay */}
//       {isManualSearch && (isFetchTrans || isFetchRef) && (
//         <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
//           <div className="flex flex-col items-center gap-2">
//             <LoadingSpinner />
//             <span className="text-blue-600 font-semibold text-sm">Fetching Audit Data...</span>
//           </div>
//         </div>
//       )}

//       {/* Branch lookup modal */}
//       <BranchLookupModal
//         isOpen={modals.branch}
//         onClose={(v) => {
//           setModals((prev) => ({ ...prev, branch: false }));
//           if (v) {
//             setFilterTrans((p) => ({
//               ...p,
//               branchCode: v.branchCode,
//               branchName: v.branchName,
//             }));
//           }
//         }}
//       />



//        {/* Document Type */}
//       <HSDocLookupModal
//         isOpen={modals.docCode}
//         onClose={(v) => {
//           setModals((prev) => ({ ...prev, docCode: false }));
//           if (v) {
//             setFilterTrans((p) => ({
//               ...p,
//               docCode: v.docCode,
//               docName: v.docName,
//             }));
//           }
//         }}
//       />



//       {/* User lookup modal */}
//       <UsersLookupModal
//         isOpen={modals.user}
//         onClose={(selectedUser) => {
//           setModals((prev) => ({ ...prev, user: false }));

//           if (selectedUser) {
//             if (activeTab === "transactions") {
//               setFilterTrans((prev) => ({
//                 ...prev,
//                 userCode: selectedUser.userCode,
//                 userName: selectedUser.userName,
//               }));
//             } else {
//               setFilterRef((prev) => ({
//                 ...prev,
//                 userCode: selectedUser.userCode,
//                 userName: selectedUser.userName,
//               }));
//             }
//           }
//         }}
//       />

//       {/* ===================================================
//          HEADER SECTION
//          - page title
//          - tab buttons
//          - find/reset buttons
//       =================================================== */}
//       <div className="global-ref-header-ui flex-none">
//         <div className="w-full flex flex-col gap-3 md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center">
//           {/* Page title */}
//           <div className="min-w-0">
//             <h1 className="global-ref-headertext-ui truncate">
//               Audit Trail - {activeTab === "transactions" ? "Transactions" : "Reference File"}
//             </h1>
//           </div>

//           {/* Tab selector */}
//           <div className="flex justify-center">
//             <div className="flex border-b border-gray-200 dark:border-gray-700">
//               {["transactions", "reference"].map((tab) => (
//                 <button
//                   key={tab}
//                   onClick={() => {
//                     setActiveTab(tab);
//                     setIsManualSearch(false);
//                   }}
//                   className={`px-4 py-2 text-[12px] font-bold border-b-2 transition-all whitespace-nowrap ${
//                     activeTab === tab
//                       ? "border-blue-600 text-blue-600 bg-blue-50/50"
//                       : "border-transparent text-gray-500"
//                   }`}
//                 >
//                   {tab === "transactions" ? "Transactions" : "Reference File"}
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* Action buttons */}
//           <div className="flex justify-center md:justify-end gap-2">
//             <ButtonBar
//               buttons={[
//                 {
//                   key: "search",
//                   label: <span className="hidden sm:inline ml-2">Find</span>,
//                   icon: faSearch,
//                   onClick: handleSearch,
//                   className:
//                     "bg-blue-600 text-white w-8 sm:w-auto px-0 sm:px-4 h-8 rounded-md text-[11px] flex items-center justify-center",
//                 },
//                 {
//                   key: "reset",
//                   label: <span className="hidden sm:inline ml-2">Reset</span>,
//                   icon: faUndo,
//                   onClick: handleReset,
//                   className:
//                     "bg-blue-600 text-white w-8 sm:w-auto px-0 sm:px-4 h-8 rounded-md text-[11px] flex items-center justify-center",
//                 },
//               ]}
//             />
//           </div>
//         </div>
//       </div>

//       {/* ===================================================
//          FILTER SECTION
//          ---------------------------------------------------
//          Changes depending on active tab.
//       =================================================== */}
//       <div className="flex-none mt-44 sm:mt-24 bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 shadow-sm mx-0">
//         {activeTab === "transactions" ? (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
//             <div className="relative">
//               <FieldRenderer
//                 label="Branch"
//                 type="lookup"
//                 value={filterTrans.branchName}
//                 onLookup={() => setModals((prev) => ({ ...prev, branch: true }))}
//               />
//               {filterTrans.branchName && (
//                 <ClearButton
//                   onClear={() =>
//                     setFilterTrans((p) => ({ ...p, branchCode: "", branchName: "" }))
//                   }
//                 />
//               )}
//             </div>

//             <div className="relative">
//               <FieldRenderer
//                 label="Document Type"
//                 type="lookup"
//                 value={filterTrans.docName}
//                 onLookup={() => setModals((prev) => ({ ...prev, docCode: true }))}
//               />
//               {filterTrans.docName && (
//                 <ClearButton
//                   onClear={() => setFilterTrans((p) => ({ ...p, docCode: "", docName: "" }))}
//                 />
//               )}
//             </div>

//             <FieldRenderer
//               label="Document No"
//               type="text"
//               value={filterTrans.docNo}
//               onChange={(v) => setFilterTrans((p) => ({ ...p, docNo: v }))}
//             />

//             <div className="relative">
//               <FieldRenderer
//                 label="User"
//                 type="lookup"
//                 value={filterTrans.userName}
//                 onLookup={() => setModals((p) => ({ ...p, user: true }))}
//               />
//               {filterTrans.userName && (
//                 <ClearButton
//                   onClear={() => setFilterTrans((p) => ({ ...p, userCode: "", userName: "" }))}
//                 />
//               )}
//             </div>

//             <FieldRenderer
//               label="Starting Date"
//               type="date"
//               value={filterTrans.startDate}
//               onChange={(v) => setFilterTrans((p) => ({ ...p, startDate: v }))}
//             />

//             <FieldRenderer
//               label="Ending Date"
//               type="date"
//               value={filterTrans.endDate}
//               onChange={(v) => setFilterTrans((p) => ({ ...p, endDate: v }))}
//             />
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//             <div className="relative">
//               <FieldRenderer
//                 label="Reference File"
//                 type="text"
//                 value={filterRef.refFile}
//                 onChange={(v) => setFilterRef((p) => ({ ...p, refFile: v }))}
//               />
//               {filterRef.refFile && (
//                 <ClearButton
//                   onClear={() => setFilterRef((p) => ({ ...p, refFile: "", refName: "" }))}
//                 />
//               )}
//             </div>

//             <div className="relative">
//               <FieldRenderer
//                 label="User"
//                 type="lookup"
//                 value={filterRef.userName}
//                 onLookup={() => setModals((p) => ({ ...p, user: true }))}
//               />
//               {filterRef.userName && (
//                 <ClearButton
//                   onClear={() => setFilterRef((p) => ({ ...p, userCode: "", userName: "" }))}
//                 />
//               )}
//             </div>

//             <FieldRenderer
//               label="Starting Date"
//               type="date"
//               value={filterRef.startDate}
//               onChange={(v) => setFilterRef((p) => ({ ...p, startDate: v }))}
//             />

//             <FieldRenderer
//               label="Ending Date"
//               type="date"
//               value={filterRef.endDate}
//               onChange={(v) => setFilterRef((p) => ({ ...p, endDate: v }))}
//             />
//           </div>
//         )}
//       </div>

//       {/* ===================================================
//          MOBILE VIEW TOGGLE
//          ---------------------------------------------------
//          Only shown on mobile.
//          Lets user switch between card and table layout.
//       =================================================== */}
//       {isMobile && (
//         <div className="mt-4 px-4 flex justify-end">
//           <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
//             <button
//               type="button"
//               onClick={() => setMobileView("card")}
//               className={`px-3 h-9 text-[11px] font-semibold flex items-center gap-2 ${
//                 mobileView === "card"
//                   ? "bg-blue-600 text-white"
//                   : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
//               }`}
//             >
//               <FontAwesomeIcon icon={faThLarge} />
//               Card
//             </button>

//             <button
//               type="button"
//               onClick={() => setMobileView("table")}
//               className={`px-3 h-9 text-[11px] font-semibold flex items-center gap-2 ${
//                 mobileView === "table"
//                   ? "bg-blue-600 text-white"
//                   : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
//               }`}
//             >
//               <FontAwesomeIcon icon={faTable} />
//               Table
//             </button>
//           </div>
//         </div>
//       )}

//       {/* ===================================================
//          TRANSACTIONS RESULT SECTION
//       =================================================== */}
      
//       <div
//         className={`global-tran-table-main-div-ui mt-4 p-4 ${
//           activeTab === "transactions" ? "block" : "hidden"
//         }`}
//       >
//         {isMobile && mobileView === "card" ? (
//           <CardView data={dataTrans || []} type="transactions" />
//         ) : (
//          <div className="max-h-[600px] overflow-y-auto relative">
//             <SearchGlobalReportTable
//               ref={tableRefTrans}
//               loading={isColsTransLoading || (isFetchTrans && isManualSearch)}
//               columns={colsTrans}
//               data={dataTrans || []}
//               // itemsPerPage={50}
//               showFilters
//               rightActionLabel="View"
//               onRowAction={handleViewRow}
//               onStateChange={(tbl) => {
//                 tableStateRef.current.transactions = tbl;
//               }}
//             />
//           </div>
//         )}
//       </div>

//       {/* ===================================================
//          REFERENCE RESULT SECTION
//       =================================================== */}
//       <div
//         className={`global-tran-table-main-div-ui mt-4 p-4 ${
//           activeTab === "reference" ? "block" : "hidden"
//         }`}
//       >
//         {isMobile && mobileView === "card" ? (
//           <CardView data={dataRef || []} type="reference" />
//         ) : (
//           <div className="max-h-[600px] overflow-y-auto relative">
//             <SearchGlobalReportTable
//               ref={tableRefRef}
//               loading={isColsRefLoading || (isFetchRef && isManualSearch)}
//               columns={colsRef}
//               data={dataRef || []}
//               // itemsPerPage={10}
//               showFilters
//               rightActionLabel="View"
//               onRowAction={handleViewRow}
//               onStateChange={(tbl) => {
//                 tableStateRef.current.reference = tbl;
//               }}
//             />
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default AuditTrail;


import { useEffect, useRef, useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";
import { useAuth } from "@/NAYSA Cloud/Authentication/AuthContext.jsx";
import { useSelectedHSColConfig } from "@/NAYSA Cloud/Global/selectedData";
import { LoadingSpinner } from "@/NAYSA Cloud/Global/utilities.jsx";

// Lookup / modal components
import SearchGlobalReportTable from "../../Lookup/SearchGlobalReportTable";
import BranchLookupModal from "@/NAYSA Cloud/Lookup/SearchBranchRef";
import UsersLookupModal from "@/NAYSA Cloud/Lookup/SearchUsers";
import HSDocLookupModal from "@/NAYSA Cloud/Lookup/SearchHSDocRef";

// FontAwesome icons used in this page
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faUndo,
  faTimes,
  faExchangeAlt,
  faExternalLinkAlt,
  faEye,
} from "@fortawesome/free-solid-svg-icons";

// Reusable UI components
import FieldRenderer from "@/NAYSA Cloud/Global/FieldRenderer";
import ButtonBar from "@/NAYSA Cloud/Global/ButtonBar";

/* =========================================================
   COMPARISON MODAL
========================================================= */
const ComparisonModal = ({ data, onClose }) => {
  if (!data) return null;

  const toProperCase = (str) => {
    return str
      .replace(/([A-Z])/g, " $1")
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

  const activityLabel =
    String(data.activity || "").toLowerCase() === "added"
      ? "Added By"
      : String(data.activity || "").toLowerCase() === "deleted"
      ? "Deleted By"
      : String(data.activity || "").toLowerCase() === "edited"
      ? "Edited By"
      : "Modified By / Created By";

  const allKeys = Array.from(
    new Set([...Object.keys(before), ...Object.keys(after)])
  );

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-gray-200 dark:border-gray-800">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex justify-between items-start gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 border border-blue-100 dark:border-blue-800 shrink-0">
                <FontAwesomeIcon icon={faExchangeAlt} />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight truncate">
                  Audit Comparison
                </h2>
                <p className="text-[11px] text-gray-500 mt-0.5 italic truncate">
                  Comparing data snapshots
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
            >
              <FontAwesomeIcon icon={faTimes} size="lg" />
            </button>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {[
              { label: "Reference File", val: data.tblName },
              { label: activityLabel, val: data.userName },
              { label: "Ref Code", val: data.refCode },
              { label: "Ref Name", val: data.refName },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded border border-gray-100 dark:border-gray-700"
              >
                <span className="text-[9px] text-gray-400 font-bold uppercase block leading-none mb-1">
                  {item.label}
                </span>
                <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-200">
                  {item.val || "—"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-gray-50/30 dark:bg-gray-950/30">
          <table className="w-full text-left text-[12px] border-separate border-spacing-0">
            <thead className="sticky top-0 bg-white dark:bg-gray-900 z-10 shadow-sm">
              <tr className="text-[10px] uppercase font-bold text-gray-400">
                <th className="px-4 sm:px-6 py-3 border-b border-gray-100 dark:border-gray-800">
                  Column Name
                </th>
                <th className="px-4 sm:px-6 py-3 border-b border-gray-100 dark:border-gray-800 bg-red-50/20 text-red-500">
                  Old Value
                </th>
                <th className="px-4 sm:px-6 py-3 border-b border-gray-100 dark:border-gray-800 bg-green-50/20 text-green-600">
                  New Value
                </th>
              </tr>
            </thead>

            <tbody>
              {allKeys.map((key) => {
                const isDiff = String(before[key]) !== String(after[key]);

                return (
                  <tr
                    key={key}
                    className={`hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors ${
                      isDiff ? "bg-amber-50/30 dark:bg-amber-900/5" : ""
                    }`}
                  >
                    <td className="px-4 sm:px-6 py-3 border-b border-gray-100 dark:border-gray-800 font-medium text-gray-600 dark:text-gray-400">
                      {toProperCase(key)}
                    </td>
                    <td className="px-4 sm:px-6 py-3 border-b border-gray-100 dark:border-gray-800 font-mono text-red-500 italic break-all">
                      {String(before[key] ?? "—")}
                    </td>
                    <td className="px-4 sm:px-6 py-3 border-b border-gray-100 dark:border-gray-800 font-mono text-green-600 font-bold break-all">
                      {String(after[key] ?? "—")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-4 sm:px-6 py-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex justify-end">
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

/* =========================================================
   DATE HELPERS
========================================================= */
const getInitialDate = (offsetMonth = 0) => {
  const d = new Date();
  d.setMonth(d.getMonth() - offsetMonth);
  return d.toISOString().split("T")[0];
};

const TODAY = getInitialDate(0);
const ONE_MONTH_AGO = getInitialDate(1);

/* =========================================================
   MAIN PAGE COMPONENT
========================================================= */
const AuditTrail = () => {
  const { currentUserRow } = useAuth();
  const queryClient = useQueryClient();

  const tableRefTrans = useRef(null);
  const tableRefRef = useRef(null);

  const tableStateRef = useRef({ transactions: {}, reference: {} });

  const [activeTab, setActiveTab] = useState("transactions");
  const [selectedRowCompare, setSelectedRowCompare] = useState(null);

  const initialTrans = useMemo(
    () => ({
      branchCode: currentUserRow?.branchCode || "",
      branchName: currentUserRow?.branchName || "",
      docCode: "",
      docName: "",
      docNo: "",
      userCode: "",
      userName: "",
      startDate: ONE_MONTH_AGO,
      endDate: TODAY,
    }),
    [currentUserRow]
  );

  const initialRef = useMemo(
    () => ({
      refFile: "",
      refName: "",
      userCode: "",
      userName: "",
      startDate: ONE_MONTH_AGO,
      endDate: TODAY,
    }),
    []
  );

  const [filterTrans, setFilterTrans] = useState(initialTrans);
  const [filterRef, setFilterRef] = useState(initialRef);

  const [modals, setModals] = useState({
    branch: false,
    user: false,
    docCode: false,
  });

  const [clearedTabs, setClearedTabs] = useState({
    transactions: false,
    reference: false,
  });

  const [isManualSearch, setIsManualSearch] = useState(false);

  useEffect(() => {
    if (currentUserRow) {
      setFilterTrans((prev) => ({
        ...prev,
        branchCode: prev.branchCode || currentUserRow.branchCode,
        branchName: prev.branchName || currentUserRow.branchName,
      }));
    }
  }, [currentUserRow]);

  const fetchCols = (key, config) =>
    useQuery({
      queryKey: ["auditCols", key],
      queryFn: () => useSelectedHSColConfig(config),
      staleTime: Infinity,
    });

  const { data: colsTrans, isLoading: isColsTransLoading } = fetchCols(
    "TRAN",
    "GetDocTrail"
  );
  const { data: colsRef, isLoading: isColsRefLoading } = fetchCols(
    "REF",
    "GetRefTrail"
  );

  const useAuditData = (key, endpoint, filters, enabledCols) =>
    useQuery({
      queryKey: ["auditData", key],
      queryFn: async () => {
        if (clearedTabs[key === "TRAN" ? "transactions" : "reference"]) {
          return [];
        }

        const { data } = await apiClient.post(endpoint, {
          PARAMS: JSON.stringify(filters),
        });

        const raw = data?.data?.[0]?.result || data?.result || data?.data;

        setIsManualSearch(false);

        return typeof raw === "string" ? JSON.parse(raw) : raw || [];
      },
      enabled: !!enabledCols,
      refetchInterval: 30000,
    });

  const {
    data: dataTrans,
    isFetching: isFetchTrans,
    refetch: refetchTrans,
  } = useAuditData("TRAN", "getDocTrail", filterTrans, colsTrans);

  const {
    data: dataRef,
    isFetching: isFetchRef,
    refetch: refetchRef,
  } = useAuditData("REF", "getRefTrail", filterRef, colsRef);

  const handleSearch = () => {
    setClearedTabs((prev) => ({ ...prev, [activeTab]: false }));
    setIsManualSearch(true);
    activeTab === "transactions" ? refetchTrans() : refetchRef();
  };

  const handleReset = () => {
    if (activeTab === "transactions") {
      setFilterTrans(initialTrans);
      queryClient.setQueryData(["auditData", "TRAN"], []);
    } else {
      setFilterRef(initialRef);
      queryClient.setQueryData(["auditData", "REF"], []);
    }

    setClearedTabs((p) => ({ ...p, [activeTab]: true }));
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
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClear();
      }}
      className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 z-10 p-1"
    >
      <FontAwesomeIcon icon={faTimes} className="text-[10px]" />
    </button>
  );

  return (
    <div className="global-ref-main-div-ui relative min-h-screen flex flex-col">
      <ComparisonModal
        data={selectedRowCompare}
        onClose={() => setSelectedRowCompare(null)}
      />

      {isManualSearch && (isFetchTrans || isFetchRef) && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
          <div className="flex flex-col items-center gap-2">
            <LoadingSpinner />
            <span className="text-blue-600 font-semibold text-sm">
              Fetching Audit Data...
            </span>
          </div>
        </div>
      )}

      <BranchLookupModal
        isOpen={modals.branch}
        onClose={(v) => {
          setModals((prev) => ({ ...prev, branch: false }));
          if (v) {
            setFilterTrans((p) => ({
              ...p,
              branchCode: v.branchCode,
              branchName: v.branchName,
            }));
          }
        }}
      />

      <HSDocLookupModal
        isOpen={modals.docCode}
        onClose={(v) => {
          setModals((prev) => ({ ...prev, docCode: false }));
          if (v) {
            setFilterTrans((p) => ({
              ...p,
              docCode: v.docCode,
              docName: v.docName,
            }));
          }
        }}
      />

      <UsersLookupModal
        isOpen={modals.user}
        onClose={(selectedUser) => {
          setModals((prev) => ({ ...prev, user: false }));

          if (selectedUser) {
            if (activeTab === "transactions") {
              setFilterTrans((prev) => ({
                ...prev,
                userCode: selectedUser.userCode,
                userName: selectedUser.userName,
              }));
            } else {
              setFilterRef((prev) => ({
                ...prev,
                userCode: selectedUser.userCode,
                userName: selectedUser.userName,
              }));
            }
          }
        }}
      />

      <div className="global-ref-header-ui flex-none">
        <div className="w-full flex flex-col gap-3 md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center">
          <div className="min-w-0">
            <h1 className="global-ref-headertext-ui truncate">
              Audit Trail -{" "}
              {activeTab === "transactions" ? "Transactions" : "Reference File"}
            </h1>
          </div>

          <div className="flex justify-center">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              {["transactions", "reference"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setIsManualSearch(false);
                  }}
                  className={`px-4 py-2 text-[12px] font-bold border-b-2 transition-all whitespace-nowrap ${
                    activeTab === tab
                      ? "border-blue-600 text-blue-600 bg-blue-50/50"
                      : "border-transparent text-gray-500"
                  }`}
                >
                  {tab === "transactions" ? "Transactions" : "Reference File"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-center md:justify-end gap-2">
            <ButtonBar
              buttons={[
                {
                  key: "search",
                  label: <span className="hidden sm:inline ml-2">Find</span>,
                  icon: faSearch,
                  onClick: handleSearch,
                  className:
                    "bg-blue-600 text-white w-8 sm:w-auto px-0 sm:px-4 h-8 rounded-md text-[11px] flex items-center justify-center",
                },
                {
                  key: "reset",
                  label: <span className="hidden sm:inline ml-2">Reset</span>,
                  icon: faUndo,
                  onClick: handleReset,
                  className:
                    "bg-blue-600 text-white w-8 sm:w-auto px-0 sm:px-4 h-8 rounded-md text-[11px] flex items-center justify-center",
                },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="flex-none mt-44 sm:mt-24 bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 shadow-sm mx-0">
        {activeTab === "transactions" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            <div className="relative">
              <FieldRenderer
                label="Branch"
                type="lookup"
                value={filterTrans.branchName}
                onLookup={() => setModals((prev) => ({ ...prev, branch: true }))}
              />
              {filterTrans.branchName && (
                <ClearButton
                  onClear={() =>
                    setFilterTrans((p) => ({
                      ...p,
                      branchCode: "",
                      branchName: "",
                    }))
                  }
                />
              )}
            </div>

            <div className="relative">
              <FieldRenderer
                label="Document Type"
                type="lookup"
                value={filterTrans.docName}
                onLookup={() => setModals((prev) => ({ ...prev, docCode: true }))}
              />
              {filterTrans.docName && (
                <ClearButton
                  onClear={() =>
                    setFilterTrans((p) => ({
                      ...p,
                      docCode: "",
                      docName: "",
                    }))
                  }
                />
              )}
            </div>

            <FieldRenderer
              label="Document No"
              type="text"
              value={filterTrans.docNo}
              onChange={(v) => setFilterTrans((p) => ({ ...p, docNo: v }))}
            />

            <div className="relative">
              <FieldRenderer
                label="User"
                type="lookup"
                value={filterTrans.userName}
                onLookup={() => setModals((p) => ({ ...p, user: true }))}
              />
              {filterTrans.userName && (
                <ClearButton
                  onClear={() =>
                    setFilterTrans((p) => ({
                      ...p,
                      userCode: "",
                      userName: "",
                    }))
                  }
                />
              )}
            </div>

            <FieldRenderer
              label="Starting Date"
              type="date"
              value={filterTrans.startDate}
              onChange={(v) => setFilterTrans((p) => ({ ...p, startDate: v }))}
            />

            <FieldRenderer
              label="Ending Date"
              type="date"
              value={filterTrans.endDate}
              onChange={(v) => setFilterTrans((p) => ({ ...p, endDate: v }))}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <FieldRenderer
                label="Reference File"
                type="text"
                value={filterRef.refFile}
                onChange={(v) => setFilterRef((p) => ({ ...p, refFile: v }))}
              />
              {filterRef.refFile && (
                <ClearButton
                  onClear={() =>
                    setFilterRef((p) => ({
                      ...p,
                      refFile: "",
                      refName: "",
                    }))
                  }
                />
              )}
            </div>

            <div className="relative">
              <FieldRenderer
                label="User"
                type="lookup"
                value={filterRef.userName}
                onLookup={() => setModals((p) => ({ ...p, user: true }))}
              />
              {filterRef.userName && (
                <ClearButton
                  onClear={() =>
                    setFilterRef((p) => ({
                      ...p,
                      userCode: "",
                      userName: "",
                    }))
                  }
                />
              )}
            </div>

            <FieldRenderer
              label="Starting Date"
              type="date"
              value={filterRef.startDate}
              onChange={(v) => setFilterRef((p) => ({ ...p, startDate: v }))}
            />

            <FieldRenderer
              label="Ending Date"
              type="date"
              value={filterRef.endDate}
              onChange={(v) => setFilterRef((p) => ({ ...p, endDate: v }))}
            />
          </div>
        )}
      </div>

      <div
        className={`global-tran-table-main-div-ui mt-4 p-4 ${
          activeTab === "transactions" ? "block" : "hidden"
        }`}
      >
        <SearchGlobalReportTable
          ref={tableRefTrans}
          loading={isColsTransLoading || (isFetchTrans && isManualSearch)}
          columns={colsTrans}
          data={dataTrans || []}
          itemsPerPage={50}
          showFilters
          rightActionLabel="View"
          onRowAction={handleViewRow}
          onStateChange={(tbl) => {
            tableStateRef.current.transactions = tbl;
          }}
        />
      </div>

      <div
        className={`global-tran-table-main-div-ui mt-4 p-4 ${
          activeTab === "reference" ? "block" : "hidden"
        }`}
      >
        <SearchGlobalReportTable
          ref={tableRefRef}
          loading={isColsRefLoading || (isFetchRef && isManualSearch)}
          columns={colsRef}
          data={dataRef || []}
          itemsPerPage={50}
          showFilters
          rightActionLabel="View"
          onRowAction={handleViewRow}
          onStateChange={(tbl) => {
            tableStateRef.current.reference = tbl;
          }}
        />
      </div>
    </div>
  );
};

export default AuditTrail;