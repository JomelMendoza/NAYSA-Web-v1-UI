// // SearchGlobalTranHistory.jsx
// import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
// import { postRequest } from "@/NAYSA Cloud/Configuration/BaseURL";
// import { exportHistoryExcel } from "@/NAYSA Cloud/Global/report";
// import { LoadingSpinner } from "@/NAYSA Cloud/Global/utilities.jsx";
// import { format, subDays, addMonths, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
// import DatePicker from "react-datepicker";


// import "react-datepicker/dist/react-datepicker.css";
// import Modal from "react-modal";
// import { useNavigate, useLocation } from "react-router-dom";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import {
//   faList,
//   faPen,
//   faCalendarAlt,
//   faFilter,
//   faDownload,
//   faRedo,
//   faArrowUp,
//   faArrowDown,
//   faEye
// } from "@fortawesome/free-solid-svg-icons";

// import { useReturnToDate } from "@/NAYSA Cloud/Global/dates";
// import { useSelectedHSColConfig } from "@/NAYSA Cloud/Global/selectedData";
// import Header, { HeaderSpacer } from "@/NAYSA Cloud/Components/Header";
// import { useAuth } from "@/NAYSA Cloud/Authentication/AuthContext.jsx";

// Modal.setAppElement("#root");

// /* ------------------ window-level cache (survives route swaps) ------------------ */
// function getGlobalCache() {
//   if (typeof window !== "undefined") {
//     if (!window.__NAYSA_HISTORY_CACHE__) window.__NAYSA_HISTORY_CACHE__ = {};
//     return window.__NAYSA_HISTORY_CACHE__;
//   }
//   return {};
// }

// /* ---------------- Formatting helpers ---------------- */
// const formatCellValue = (value, config) => {
//   if (value === null || value === undefined) return "—";
//   switch (config.renderType) {
//     case "date": {
//       try {
//         const datePart = String(value).split("T")[0];
//         return useReturnToDate(datePart);
//       } catch {
//         return String(value);
//       }
//     }
//     case "currency":
//     case "number": {
//       const num = Number(value);
//       if (Number.isNaN(num)) return String(value);
//       const digits = typeof config.roundingOff === "number" ? config.roundingOff : 2;
//       return num.toLocaleString("en-US", {
//         minimumFractionDigits: digits,
//         maximumFractionDigits: digits
//       });
//     }
//     case "status": {
//       const map = {
//         C: { text: "CANCELLED", color: "text-red-600" },
//         F: { text: "FINALIZED", color: "text-blue-800" },
//         X: { text: "CANCELLED", color: "text-red-600" },
//         "": { text: "OPEN", color: "text-black" }
//       };
//       const sty = map[value] || map[""];
//       return <span className={sty.color + " font-semibold"}>{sty.text}</span>;
//     }
//     default:
//       return String(value);
//   }
// };

// /* -------------- Column config loader -------------- */

// // const getColumnConfig = async (groupId,UserCode) => {
// //   try {
// //     const { currentUserRow } = useAuth();
// //     const response = await useSelectedHSColConfig(groupId,currentUserRow.UserCode);
// //     let config = [];
// //     if (Array.isArray(response)) config = response;
// //     else if (
// //       response &&
// //       response.success &&
// //       response.data &&
// //       response.data[0] &&
// //       response.data[0].result
// //     ) {
// //       const parsed = JSON.parse(response.data[0].result || "[]");
// //       config = Array.isArray(parsed) ? parsed : [];
// //     } else if (response && Array.isArray(response.data)) {
// //       config = response.data;
// //     }
// //     config = (config || []).map((c) => ({
// //       key: c.key,
// //       label:
// //         c.label ||
// //         String(c.key || "")
// //           .replace(/_/g, " ")
// //           .replace(/\b\w/g, (ch) => ch.toUpperCase()),
// //       classNames: c.classNames || "text-left",
// //       renderType: c.renderType || "text",
// //       renderFormat: c.renderFormat || "",
// //       roundingOff: typeof c.roundingOff === "number" ? c.roundingOff : undefined,
// //       sortable: c.sortable !== false,
// //       hidden: !!c.hidden
// //     }));
// //     return config;
// //   } catch (err) {
// //     console.error("❌ Column config fetch failed for", groupId, err);
// //     return [];
// //   }
// // };

// /* ============================== Component =============================== */
// const AllTranHistory = (props) => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const navState = location.state || {};
//   const didInitRef = useRef(false);
//   const hydratedFromCacheRef = useRef(false);
//   const { currentUserRow } = useAuth();

//   const {
//     endpoint: endpointProp,
//     activeTabKey: activeTabKeyProp,
//     branchCode: branchCodeProp,
//     startDate: startDateProp,
//     endDate: endDateProp,
//     status: statusProp,
//     statusOptions: statusOptionsProp,
//     prefillSearchFields: prefillProp,
//     onRowDoubleClick,
//     showHeader: showHeaderProp,
//     cacheKey: cacheKeyProp,
//     historyExportName: historyExportNameProp
//   } = props || {};

//   const endpoint =
//     (endpointProp !== undefined && endpointProp) ||
//     (navState.endpoint !== undefined && navState.endpoint);

//   const baseKey =
//     (typeof cacheKeyProp === "string" && cacheKeyProp) ||
//     (typeof endpoint === "string" && endpoint) ||
//     "HISTORY";

//   const backToPath = navState.backToPath;
//   const embedded =
//     typeof onRowDoubleClick === "function" ||
//     endpointProp !== undefined ||
//     cacheKeyProp !== undefined;

//   const showHeader = showHeaderProp !== undefined ? showHeaderProp : !embedded;



//   /* -------- status options from parent (fallback if not provided) -------- */
//  const [activeTab, setActiveTab] = useState(null);
//   const fallbackStatusOptions = [
//     { value: "All", label: "All Status" },
//     { value: "F", label: "FINALIZED" },
//     { value: "C", label: "CLOSED" },
//     { value: "", label: "OPEN" },
//     { value: "X", label: "CANCELLED" }
//   ];

 
//   const restrictedTabs = ["JO_", "PO_", "PR_"];
//   const isRestricted = restrictedTabs.some(prefix => activeTab?.includes(prefix));

//   const statusOptions = Array.isArray(statusOptionsProp) && statusOptionsProp.length
//     ? statusOptionsProp
//     : fallbackStatusOptions.filter(opt => {
//         if (isRestricted) {
//           return opt.value !== "F";
//         } else {
//           return opt.value !== "C";
//         }
//       });

//   /* ---------------- Local state ---------------- */
//   const [branchCode, setBranchCode] = useState(
//     (branchCodeProp !== undefined && branchCodeProp) ||
//       (navState.branchCode !== undefined && navState.branchCode) ||
//       ""
//   );




// const getColumnConfig = async (groupId) => {
//   try {

//     const response = await useSelectedHSColConfig(groupId,currentUserRow.userCode);
//     let config = [];
//     if (Array.isArray(response)) config = response;
//     else if (
//       response &&
//       response.success &&
//       response.data &&
//       response.data[0] &&
//       response.data[0].result
//     ) {
//       const parsed = JSON.parse(response.data[0].result || "[]");
//       config = Array.isArray(parsed) ? parsed : [];
//     } else if (response && Array.isArray(response.data)) {
//       config = response.data;
//     }
//     config = (config || []).map((c) => ({
//       key: c.key,
//       label:
//         c.label ||
//         String(c.key || "")
//           .replace(/_/g, " ")
//           .replace(/\b\w/g, (ch) => ch.toUpperCase()),
//       classNames: c.classNames || "text-left",
//       renderType: c.renderType || "text",
//       renderFormat: c.renderFormat || "",
//       roundingOff: typeof c.roundingOff === "number" ? c.roundingOff : undefined,
//       sortable: c.sortable !== false,
//       hidden: !!c.hidden
//     }));
//     return config;
//   } catch (err) {
//     console.error("❌ Column config fetch failed for", groupId, err);
//     return [];
//   }
// };






//   const initialDates = () => {
//     if (startDateProp && endDateProp)
//       return [new Date(startDateProp), new Date(endDateProp)];
//     if (navState.startDate && navState.endDate)
//       return [new Date(navState.startDate), new Date(navState.endDate)];
//     return [subDays(new Date(), 6), new Date()];
//   };

//   const [dateRangeType, setDateRangeType] = useState(
//     (startDateProp && endDateProp) || (navState.startDate && navState.endDate)
//       ? "Custom Range"
//       : "Last 7 Days"
//   );
//   const [dates, setDates] = useState(initialDates());
//   const [modalIsOpen, setModalIsOpen] = useState(false);

//   const normalizeStatus = (v) => (v === "" ? "All" : v ?? "All");
//   const [status, setStatus] = useState(() => normalizeStatus(statusProp));
//   const [searchFields, setSearchFields] = useState(
//     prefillProp || navState.prefillSearchFields || {}
//   );
//   const [tabData, setTabData] = useState({});
//   const [tabConfigs, setTabConfigs] = useState({});
  
//   const [loading, setLoading] = useState(false);
//   const [exporting, setExporting] = useState(false);
//   const [sortConfig, setSortConfig] = useState({
//     key: null,
//     direction: "asc",
//     tabKey: null
//   });

//   useEffect(() => {
//     if (didInitRef.current) return;
//     didInitRef.current = true;
//   }, []);

//   /* ---------------- restore from window cache ---------------- */
//   useEffect(() => {
//     const cache = getGlobalCache();
//     let snap = cache[baseKey];
//     const incomingBranch =
//       (branchCodeProp !== undefined && branchCodeProp) ||
//       (navState.branchCode !== undefined && navState.branchCode) ||
//       "";

//     if (snap && incomingBranch && snap.branchCode && snap.branchCode !== incomingBranch) {
//       delete cache[baseKey];
//       snap = undefined;
//     }

//     if (snap) {
//       hydratedFromCacheRef.current = true;
//       setDates(snap.dates || initialDates());
//       setDateRangeType(snap.dateRangeType || "Last 7 Days");
//       const desired =
//         statusProp !== undefined
//           ? normalizeStatus(statusProp)
//           : snap.status !== undefined
//           ? normalizeStatus(snap.status)
//           : "All";
//       setStatus(desired);
//       setSearchFields(snap.searchFields || {});
//       setTabData(snap.tabData || {});
//       setTabConfigs(snap.tabConfigs || {});
//       setActiveTab(snap.activeTab || null);
//       setBranchCode(
//         (snap.branchCode !== undefined && snap.branchCode) || branchCode
//       );
//     } else {
//       if (statusProp !== undefined) setStatus(normalizeStatus(statusProp));
//     }
//   }, [baseKey, statusProp, branchCode, branchCodeProp, navState.branchCode]);

//   /* ---------------- keep cache updated on important changes ---------------- */
//   useEffect(() => {
//     const cache = getGlobalCache();
//     cache[baseKey] = {
//       dates,
//       dateRangeType,
//       status,
//       searchFields,
//       tabData,
//       tabConfigs,
//       activeTab,
//       branchCode
//     };
//   }, [
//     baseKey,
//     dates,
//     dateRangeType,
//     status,
//     searchFields,
//     tabData,
//     tabConfigs,
//     activeTab,
//     branchCode
//   ]);

//   /* ---------------- date presets ---------------- */
//   useEffect(() => {
//     const today = new Date();
//     if (dateRangeType === "Last 7 Days") {
//       setDates([subDays(today, 6), today]);
//     } else if (dateRangeType === "Last 30 Days") {
//       setDates([subDays(today, 29), today]);
//     } else if (dateRangeType === "Custom Range") {
//       setDates([null, null]);
//     }
//   }, [dateRangeType]);

//   const formatDateRange = (start, end) =>
//     start && end ? `${format(start, "MM/dd/yyyy")} - ${format(end, "MM/dd/yyyy")}` : "";

//   /* ---------------- columns for a tab ---------------- */


//   const getColumnsForTab = useCallback(
//     (tabKey) => {
//       const dataForTab = tabData[tabKey] || [];
//       const configured = tabConfigs[tabKey] || [];
//       if (configured.length > 0) return configured.filter((c) => !c.hidden);
//       if (dataForTab.length === 0) return [];
//       return Object.keys(dataForTab[0]).map((k) => ({
//         key: k,
//         label: k
//           .replace(/_/g, " ")
//           .replace(/\b\w/g, (c) => c.toUpperCase()),
//         renderType: "text",
//         sortable: true
//       }));
//     },
//     [tabData, tabConfigs]
//   );

//   const currentRows = tabData[activeTab] || [];
//   const baseColumns = useMemo(
//     () => getColumnsForTab(activeTab),
//     [activeTab, getColumnsForTab]
//   );

//   // If embedded (there’s a double-click handler), prepend a View action column like CVHistory
//   const currentColumns = useMemo(() => {
//     if (!baseColumns.length) return baseColumns;
//     if (!embedded) return baseColumns;
//     return [
//       {
//         key: "__actions",
//         label: "View",
//         sortable: false,
//         classNames: "text-center"
//       },
//       ...baseColumns
//     ];
//   }, [baseColumns, embedded]);

//   /* ---------------- filtered rows ---------------- */
//   const filteredData = useMemo(() => {
//     const base = currentRows.filter((row) =>
//       Object.entries(searchFields).every(([key, value]) => {
//         if (!value) return true;
//         return String(row?.[key] ?? "")
//           .toLowerCase()
//           .includes(String(value).toLowerCase());
//       })
//     );
//     if (status === "All") return base;

//     const statusFieldCandidates = ["C", "doc_stat", "docStatus", "status", "stat"];
//     return base.filter((row) => {
//       const rowStatus =
//         statusFieldCandidates
//           .map((f) => (row[f] !== undefined ? String(row[f]) : undefined))
//           .find((v) => v !== undefined) ?? "";
//       return rowStatus === status;
//     });
//   }, [currentRows, searchFields, status]);



  
//   /* ---------------- fetch on APPLY FILTER only ---------------- */
//   const fetchHistory = useCallback(async () => {
//     if (!dates[0] || !dates[1]) return;
//     setLoading(true);

//     setTabData({});
//     setTabConfigs({});
//     setActiveTab(null);

//     const [startDate, endDate] = dates;
//     const payload = {
//       json_data: {
//         startDate: format(startDate, "yyyy-MM-dd"),
//         endDate: format(endDate, "yyyy-MM-dd"),
//         branchCode: branchCode,
//         userCode:currentUserRow.userCode
//       }
//     };

//     try {
//       const dataResponse = await postRequest(endpoint, JSON.stringify(payload));
//       const raw =
//         dataResponse && dataResponse.data && dataResponse.data[0] && dataResponse.data[0].result
//           ? dataResponse.data[0].result
//           : "{}";
//       let parsed;
//       try {
//         parsed = JSON.parse(raw);
//       } catch (e) {
//         console.error("Failed to parse history result", e, raw);
//         setTabData({});
//         setTabConfigs({});
//         setActiveTab(null);
//         return;
//       }

//       // normalize to { tabKey: rows[] }
//       let rootDataMap = {};
//       if (Array.isArray(parsed)) {
//         rootDataMap = parsed.reduce((acc, item) => {
//           if (item && typeof item === "object" && !Array.isArray(item))
//             Object.assign(acc, item);
//           return acc;
//         }, {});
//       } else if (parsed && typeof parsed === "object") {
//         rootDataMap = parsed;
//       }

//       // unwrap { rows: [...] }
//       Object.keys(rootDataMap).forEach((k) => {
//         const v = rootDataMap[k];
//         if (v && typeof v === "object" && !Array.isArray(v) && Array.isArray(v.rows)) {
//           rootDataMap[k] = v.rows;
//         }
//       });

//       const rootKeys = Object.keys(rootDataMap);
//       const newTabConfigs = {};
//       for (const key of rootKeys) {
//       newTabConfigs[key] = await getColumnConfig(key);
//       }

//       setTabData(rootDataMap);
//       setTabConfigs(newTabConfigs);

//       const initialTabKey =
//         (activeTabKeyProp && rootKeys.includes(activeTabKeyProp) && activeTabKeyProp) ||
//         (navState.activeTabKey &&
//           rootKeys.includes(navState.activeTabKey) &&
//           navState.activeTabKey) ||
//         rootKeys[0] ||
//         null;

//       setActiveTab((prev) => (prev && rootKeys.includes(prev) ? prev : initialTabKey));
//       setSearchFields((prev) =>
//         Object.keys(prev).length ? prev : prefillProp || navState.prefillSearchFields || {}
//       );
//       setSortConfig({ key: null, direction: "asc", tabKey: initialTabKey });

//       // snapshot cache
//       const cache = getGlobalCache();
//       cache[baseKey] = {
//         dates,
//         dateRangeType,
//         status,
//         searchFields: prefillProp || navState.prefillSearchFields || {},
//         tabData: rootDataMap,
//         tabConfigs: newTabConfigs,
//         activeTab: initialTabKey,
//         branchCode
//       };
//       hydratedFromCacheRef.current = true;
//     } catch (error) {
//       console.error("Error fetching history:", error);
//       setTabData({});
//       setTabConfigs({});
//       setActiveTab(null);
//     } finally {
//       setLoading(false);
//     }
//   }, [
//     dates,
//     branchCode,
//     endpoint,
//     activeTabKeyProp,
//     prefillProp,
//     navState.activeTabKey,
//     navState.prefillSearchFields,
//     baseKey,
//     dateRangeType,
//     status
//   ]);

//   /* ---------------- handlers ---------------- */
//   const handleSearchChange = (e, key) => {
//     const { value } = e.target;
//     setSearchFields((prev) => ({ ...prev, [key]: value }));
//   };

//   const handleSort = (key) => {
//     if (key === "__actions") return;
//     let direction = "asc";
//     if (
//       sortConfig.key === key &&
//       sortConfig.direction === "asc" &&
//       sortConfig.tabKey === activeTab
//     ) {
//       direction = "desc";
//     }
//     setSortConfig({ key, direction, tabKey: activeTab });

//     const dataToSort = tabData[activeTab] || [];
//     const cols = getColumnsForTab(activeTab);
//     const colConfig = cols.find((c) => c.key === key);
//     const isNumeric =
//       colConfig && (colConfig.renderType === "number" || colConfig.renderType === "currency");

//     const sorted = [...dataToSort].sort((a, b) => {
//       const valA = a && a[key];
//       const valB = b && b[key];
//       if (isNumeric) {
//         const numA = Number(valA);
//         const numB = Number(valB);
//         if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
//           return direction === "asc" ? numA - numB : numB - numA;
//         }
//       }
//       const sA = String(valA ?? "");
//       const sB = String(valB ?? "");
//       return direction === "asc" ? sA.localeCompare(sB) : sB.localeCompare(sA);
//     });

//     setTabData((prev) => ({ ...prev, [activeTab]: sorted }));
//   };

//   const handleResetUI = () => {
//     hydratedFromCacheRef.current = false;
//     const today = new Date();
//     setDateRangeType("Last 7 Days");
//     setDates([subDays(today, 6), today]);
//     setSearchFields({});
//     setStatus("All");
//   };

//   // Row color by status in row (X=red, C|F=blue, else default)
//   const getRowClassByStatus = (row) => {
//     const statusFieldCandidates = ["C", "doc_stat", "docStatus", "status", "stat"];
//     const rowStatus =
//       statusFieldCandidates
//         .map((f) => (row[f] !== undefined ? String(row[f]) : undefined))
//         .find((v) => v !== undefined) ?? "";

//     if (rowStatus === "X" || rowStatus === "C") return "text-red-600";
//     if (rowStatus === "F") return "text-blue-700";
//     return "";
//   };

//   /* ---------------- Export helpers ---------------- */
//   const tabToSheet = (tabKey) => {
//     const cols = getColumnsForTab(tabKey);
//     const headers = cols.map((c) => c.label || c.key);

//     const rows = (tabData[tabKey] || []).map((row) => {
//       const obj = {};
//       cols.forEach((col) => {
//         const header = col.label || col.key;
//         const val = formatCellValue(row[col.key], col);
//         obj[header] = React.isValidElement(val) ? val.props?.children ?? "" : val;
//       });
//       return obj;
//     });
//     const sheetName = tabKey
//       .replace(/_/g, " ")
//       .replace(/\b\w/g, (c) => c.toUpperCase())
//       .slice(0, 31);

//     return { sheetName, headers, rows };
//   };

//   const buildJsonSheets = () =>
//     Object.keys(tabData || {}).map((tabKey) => tabToSheet(tabKey));

//   function toTabbedJson(jsonSheets) {
//     const data = {};
//     for (const tab of jsonSheets || []) {
//       const key = tab.sheetName || "Sheet";
//       data[key] = Array.isArray(tab.rows) ? tab.rows : [];
//     }
//     return {
//       Data: data
//     };
//   }

//   const exportName =
//     historyExportNameProp ??
//     (location.state && location.state.historyExportName) ??
//     "Transaction History";

//   const handleExport = async () => {
//     const tabKeys = Object.keys(tabData || {});
//     if (!tabKeys.length) {
//       alert("No data to export. Please Apply Filter first.");
//       return;
//     }
//     setExporting(true);

//     const reportName = exportName;
//     const start = dates?.[0] ? format(dates[0], "yyyy-MM-dd") : null;
//     const end = dates?.[1] ? format(dates[1], "yyyy-MM-dd") : null;

//     const sheets = buildJsonSheets();
//     const jsonData = toTabbedJson(sheets);

//     const payload = {
//       ReportName: reportName,
//       UserCode: currentUserRow?.USER_CODE,
//       Branch: branchCode || "",
//       StartDate: start,
//       EndDate: end,
//       JsonData: jsonData
//     };

//     await exportHistoryExcel(
//       "/exportHistoryReport",
//       JSON.stringify(payload),
//       setExporting,
//       reportName
//     );
//   };

//   const handleRowDoubleClick = useCallback(
//     (row) => {
//       const docNo = row?.docNo ?? row?.documentNo ?? row?.DOC_NO ?? "";
//       const bcode = row?.branchCode ?? row?.BRANCH_CODE ?? "";
//       if (!docNo || !bcode) return;

//       if (typeof onRowDoubleClick === "function") {
//         onRowDoubleClick({ ...row, docNo, branchCode: bcode });
//       } else {
//         navigate(backToPath, {
//           state: { docNo, branchCode: bcode },
//           replace: true
//         });
//       }
//     },
//     [onRowDoubleClick, navigate, backToPath]
//   );

//   const [granularity, setGranularity] = useState("day"); // "day" | "month" | "year"

//   /* ---------------- JSX ---------------- */
//   return (
//     <>
//       {showHeader && (
//         <>
//           <Header
//             activeTopTab="history"
//             detailsRoute={backToPath}
//             historyRoute="/page/AllTranHistory"
//             showActions={false}
//           />
//           <HeaderSpacer />
//         </>
//       )}

//       {/* Sticky top toolbar to mirror CVHistory feel */}
//       <div className="fixed top-[55px] left-0 w-full z-30 bg-white shadow-md dark:bg-gray-800">
//         {/* Header Tabs (CVHistory style) */}
//         {showHeader && (
//           <div className="flex flex-col md:flex-row items-center justify-between px-4 py-2 gap-2 border-b border-gray-200 dark:border-gray-700">
//             <div className="flex flex-wrap justify-center md:justify-start gap-1 lg:gap-2 w-full md:w-auto">
//               <button
//                 className={`flex items-center px-3 py-2 rounded-md text-xs md:text-sm font-bold transition-colors duration-200 group ${
//                   location.pathname === "/"
//                     ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
//                     : "text-gray-600 hover:bg-gray-100 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-blue-300"
//                 }`}
//                 onClick={() => navigate(backToPath)}
//               >
//                 <FontAwesomeIcon icon={faPen} className="w-4 h-3 mr-2" />
//                 <span className="group-hover:block">Transaction Details</span>
//               </button>
//               <button
//                 className={`flex items-center px-3 py-2 rounded-md text-xs md:text-sm font-bold transition-colors duration-200 group ${
//                   location.pathname === "/"
//                     ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
//                     : "text-gray-600 hover:bg-gray-100 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-blue-300"
//                 }`}
//                 onClick={() => navigate(backToPath)}
//               >
//                 <FontAwesomeIcon icon={faList} className="w-4 h-4 mr-2" />
//                 <span className="group-hover:block">Transaction History</span>
//               </button>
//             </div>
//           </div>
//         )}

//         {/* Tailwind CSS Animations (same helper as CVHistory) */}
//         <style jsx="true">{`
//           @keyframes fade-in-down {
//             from {
//               opacity: 0;
//               transform: translateY(-10px);
//             }
//             to {
//               opacity: 1;
//               transform: translateY(0);
//             }
//           }
//           .animate-fade-in-down {
//             animation: fade-in-down 0.2s ease-out forwards;
//           }
//         `}</style>

//         {/* Filters — re-styled to match CVHistory proportions */}
//         <div className="flex flex-col md:flex-row flex-wrap items-end gap-2 overflow-x-auto p-6 mt-8">
//           {/* Date Range */}
//           <div className="flex-shrink-0 sm:min-w-[200px]"> {/* add min-w-0 */}
//             <label className="block text-sm font-semibold text-gray-600 mb-1">
//               Date Range:
//             </label>

//             <div className="flex items-center border border-gray-300 rounded-md px-2 py-1 bg-white">
//               <select
//                 className="border-none focus:ring-0 text-sm bg-transparent pr-2"
//                 value={dateRangeType}
//                 onChange={(e) => setDateRangeType(e.target.value)}
//               >
//                 <option>Last 7 Days</option>
//                 <option>Last 30 Days</option>
//                 <option>Custom Range</option>
//               </select>

//               {/* make this flex child shrinkable */}
//               <div className="flex items-center border-l border-gray-300 pl-2 min-w-[200px]">
//                 <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400 mr-2 flex-shrink-0" />
//                 <input
//                   type="text"
//                   value={formatDateRange(dates[0], dates[1])}
//                   onClick={() => {
//                     if (dateRangeType === "Custom Range") setModalIsOpen(true);
//                   }}
//                   className="w-full min-w-0 h-[25px] border-none focus:ring-0 text-sm bg-transparent 
//                             text-gray-700 tabular-nums whitespace-nowrap pr-2"  /* pr-2 keeps last digit visible */
//                   placeholder="Select date range"
//                   readOnly
//                   title={formatDateRange(dates[0], dates[1])}  /* tooltip shows full range just in case */
//                 />
//               </div>
//             </div>
//           </div>


//           {/* Status */}
//           <div className="flex-shrink-0 min-w-[200px]">
//             <label className="block text-sm font-semibold text-gray-600 mb-1">
//               Status:
//             </label>
//             <div className="flex items-center border border-gray-300 rounded-md px-2 py-1 bg-white">
//               <FontAwesomeIcon icon={faFilter} className="text-gray-400 mr-2" />
//               <select
//                 className="w-full h-[25px] border-none focus:ring-0 text-sm"
//                 value={status}
//                 onChange={(e) => setStatus(e.target.value)}
//               >
//                 {statusOptions.map((opt) => (
//                   <option key={String(opt.value)} value={opt.value}>
//                     {opt.label}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           </div>

//           {/* Apply Filter */}
//           <div className="flex-shrink-0 w-full md:w-auto mt-auto">
//             <button
//               className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-700 shadow-md w-full"
//               onClick={fetchHistory}
//               disabled={loading}isActive = true
//             >
//               <FontAwesomeIcon icon={faFilter} className="mr-2" />
//               {loading ? "Loading..." : "Filter"}
//             </button>
//           </div>isActive = true

//           {/* Export / Reset */}
//           <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 w-full md:w-auto ml-auto">
//             <button
//               className="flex items-center justify-center bg-green-600 text-white px-6 py-2 rounded-md text-sm font-semibold hover:bg-green-700 shadow-md w-full"
//               onClick={handleExport}
//               disabled={loading || exporting || filteredData.length === 0}
//             >
//               <FontAwesomeIcon icon={faDownload} className="mr-2" />
//               <span className="truncate">{exporting ? "Exporting..." : "Export"}</span>
//             </button>
//             <button
//               className="flex items-center justify-center bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-semibold hover:bg-blue-700 shadow-md w-full"
//               onClick={handleResetUI}
//               disabled={loading || exporting}
//             >
//               <FontAwesomeIcon icon={faRedo} className="mr-2" />
//               <span className="truncate">Reset</span>
//             </button>
//           </div>
//         </div>

//         {/* Dynamic tabs (visual chips like before, consistent with CVHistory spacing) */}
//         {/* Dynamic tabs (embossed active style) */}
//         <div className="overflow-x-auto px-4">
//           {Object.keys(tabData).map((tabKey) => {
//             const isActive = activeTab === tabKey;
//             return (
//               <button
//                 key={tabKey}
//                 className={`py-2 px-10 text-sm border rounded-t-lg transition-all duration-200
//                   ${
//                     isActive
//                       ? // 🔹 Active tab: embossed effect
//                         "bg-blue-100 text-blue-700 font-semibold " +
//                         "shadow-lg shadow-blue-300 " + // inner embossed feel
//                         "relative before:absolute before:inset-x-0 before:bottom-0 before:h-[3px] before:bg-blue-700 before:rounded-t-md"
//                       : // 🔸 Inactive tab
//                         "bg-white shadow-lg shadow-blue-50 text-gray-600 font-semibold hover:text-blue-700 hover:bg-blue-50"
//                   }`}
//                 onClick={() => {
//                   setActiveTab(tabKey);
//                   setSortConfig({ key: null, direction: "asc", tabKey });
//                 }}
//               >
//                 {tabKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
//               </button>
//             );
//           })}
//         </div>


//         {/* Table */}
//         <div className="bg-white shadow-md rounded-md overflow-hidden p-4">
//           <div className="overflow-x-auto bg-white rounded-md max-h-[55vh]">
//             {loading ? (
//               <div className="text-center py-6 text-gray-500">Loading data and configurations...</div>
//             ) : !activeTab || currentColumns.length === 0 ? (
//               <div className="text-center py-10 text-gray-500">
//                 Select a date range and click ‘Filter’ to load history.
//               </div>
//             ) : (
//               <table className="min-w-[1200px] text-[12px] text-center border-collapse border border-gray-300">
//                 <thead className="text-[12px] font-medium">
//                   {/* Header row */}
//                   <tr className="bg-blue-700 text-white sticky top-0 z-30">
//                     {currentColumns.map((col) => (
//                       <th
//                         key={col.key}
//                         onClick={() => col.sortable !== false && handleSort(col.key)}
//                         className={`px-3 py-2 border whitespace-nowrap ${
//                           col.sortable !== false ? "cursor-pointer" : ""
//                         }`}
//                       >
//                         <div className="flex items-center justify-center gap-1">
//                           {col.label}
//                           {col.sortable !== false &&
//                             sortConfig.key === col.key &&
//                             sortConfig.tabKey === activeTab && (
//                               <FontAwesomeIcon
//                                 icon={sortConfig.direction === "asc" ? faArrowUp : faArrowDown}
//                                 className="text-xs"
//                               />
//                             )}
//                         </div>
//                       </th>
//                     ))}
//                   </tr>

//                   {/* Filter row — match CVHistory spacing */}
//                   <tr className="bg-gray-100 sticky top-[36px] z-20">
//                     {currentColumns.map((col) => (
//                       <td key={col.key} className="px-2 py-1 border whitespace-nowrap">
//                         {col.key !== "__actions" && (
//                           <input
//                             type="text"
//                             value={searchFields[col.key] || ""}
//                             onChange={(e) => handleSearchChange(e, col.key)}
//                             placeholder="Filter"
//                             className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 text-[10px]"
//                           />
//                         )}
//                       </td>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-200 text-[11px]">
//                   {filteredData.length > 0 ? (
//                     filteredData.map((row, idx) => {
//                       const rowClass = getRowClassByStatus(row);
//                       return (
//                         <tr
//                           key={idx}
//                           className={`hover:bg-blue-50 transition cursor-pointer ${rowClass}`}
//                           onDoubleClick={() => handleRowDoubleClick(row)}
//                         >
//                           {currentColumns.map((col) => {
//                             if (col.key === "__actions") {
//                               return (
//                                 <td key="__actions" className="px-2 py-1 border whitespace-nowrap text-center">
//                                   <button
//                                     onClick={(e) => {
//                                       e.stopPropagation();
//                                       handleRowDoubleClick(row);
//                                     }}
//                                     className="px-2 py-0.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
//                                     title="View"
//                                   >
//                                     <FontAwesomeIcon icon={faEye} className="w-4 h-3" />
//                                   </button>
//                                 </td>
//                               );
//                             }
//                             const alignRight =
//                               col.classNames?.includes("text-right") ||
//                               ["number", "currency"].includes(col.renderType);

//                             return (
                              
//                             <td
//                               key={col.key}
//                               className={`px-2 py-1 border whitespace-nowrap ${
//                                 alignRight ? "text-right" : col.classNames || "text-left"
//                               }`}
//                               title={String(row?.[col.key] ?? "")}
//                             >
//                               <div 
//                                 style={{
//                                   maxWidth: "300px", // Approximate width for ~200 chars
//                                   overflow: "hidden",
//                                   textOverflow: "ellipsis",
//                                   whiteSpace: "nowrap"
//                                 }}
//                               >
//                                 {formatCellValue(row?.[col.key], col)}
//                               </div>
//                             </td>                            
//                             );
//                           })}
//                         </tr>
//                       );
//                     })
//                   ) : (
//                     <tr>
//                       <td colSpan={currentColumns.length} className="text-center text-gray-500 py-4 border">
//                         No records found matching the filter criteria.
//                       </td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Date Picker Modal (mobile-first, 2 calendars in a row) */}
//       <Modal
//         isOpen={modalIsOpen}
//         onRequestClose={() => setModalIsOpen(false)}
//         closeTimeoutMS={150}
//         className="w-[min(100vw,500px)] sm:w-[min(100vw,500px)] h-[90vh] sm:h-auto sm:max-h-[80vh] mx-auto sm:mt-4 rounded-none sm:rounded-2xl shadow-2xl bg-white overflow-hidden outline-none"
//         overlayClassName="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50"
//       >
//         {/* Header */}
//         <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3">
//           <h2 className="text-base font-semibold">Select Custom Date Range</h2>
//           <p className="text-xs/relaxed text-white/80">
//             Choose a range or use quick presets. Press <kbd className="px-1.5 py-0.5 bg-white/20 rounded">Esc</kbd> to cancel.
//           </p>
//           <button
//             onClick={() => setModalIsOpen(false)}
//             className="absolute right-3 top-3 grid place-items-center w-8 h-8 rounded-full hover:bg-white/15 focus:ring-2 focus:ring-white/60"
//             aria-label="Close"
//             title="Close"
//           >
//             <svg viewBox="0 0 20 20" className="w-4 h-4"><path fill="currentColor" d="M11.41 10l4.3-4.29a1 1 0 10-1.42-1.42L10 8.59 5.71 4.29a1 1 0 10-1.42 1.42L8.59 10l-4.3 4.29a1 1 0 101.42 1.42L10 11.41l4.29 4.3a1 1 0 001.42-1.42z"/></svg>
//           </button>
//         </div>

//         {/* Body */}
//         {/* <div className="p-2 sm:p-2 grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-2 h-[calc(90vh-120px)] sm:h-auto overflow-auto"> */}
//         <div className="p-2 sm:p-2 grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-2 h-[calc(90vh-120px)] sm:h-auto overflow-auto">
//           {/* Quick presets */}
          
//           <div className="space-y-1 mt-2">
//             <div className="grid grid-cols-2 sm:grid-cols-1 gap-1">
//               <button className="btn-outline text-sm hover:bg-blue-100" onClick={() => { const t=new Date(); setDates([t,t]); }}>Today</button>
//               <button className="btn-outline text-sm hover:bg-blue-100" onClick={() => { const t=new Date(); const y=new Date(t); y.setDate(t.getDate()-1); setDates([y,y]); }}>Yesterday</button>
//               <button className="btn-outline text-sm hover:bg-blue-100" onClick={() => { const t=new Date(); setDates([subDays(t,6),t]); }}>Last 7 Days</button>
//               <button className="btn-outline text-sm hover:bg-blue-100" onClick={() => { const t=new Date(); setDates([subDays(t,29),t]); }}>Last 30 Days</button>
//               <button className="btn-outline text-sm hover:bg-blue-100" onClick={() => { const t=new Date(); setDates([startOfMonth(t),endOfMonth(t)]); }}>This Month</button>
//               <button className="btn-outline text-sm hover:bg-blue-100" onClick={() => { const t=new Date(); const last=addMonths(t,-1); setDates([startOfMonth(last),endOfMonth(last)]); }}>Last Month</button>
//               <button className="btn-outline text-sm hover:bg-blue-100" onClick={() => { const t=new Date(); setDates([startOfYear(t),endOfYear(t)]); }}>YTD</button>
//               <button className="btn-ghost text-sm hover:bg-blue-100" onClick={() => setDates([null,null])} title="Clear selection">Clear</button>
//             </div>

            
//             {/* Selection summary */}
//             <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-600">
//               <div className="font-semibold text-slate-700 mb-1">Selected Range</div>
//               {dates?.[0] && dates?.[1] ? (
//                 <div>{format(dates[0], "MMM dd, yyyy")} — {format(dates[1], "MMM dd, yyyy")}</div>
//               ) : (
//                 <div className="italic text-slate-400">No range selected</div>
//               )}
//               {granularity !== "day" && (
//                 <div className="mt-1 text-[11px] text-slate-500">
//                   Mode: <span className="uppercase">{granularity}</span> (one tap selects entire {granularity})
//                 </div>
//               )}
//             </div>

//           </div>

//           {/* Calendar (single) with Month/Year quick selection */}
//           <div className="rounded-xl border border-slate-200 p-2 sm:p-2">
//             {/* Granularity toggle */}
//             <div className="flex items-center gap-1 mb-2">
//               <span className="text-xs text-slate-500 mr-1">Select by:</span>
//               <div className="inline-flex rounded-lg border border-slate-300 overflow-hidden">
//                 {["day", "month", "year"].map((g) => (
//                   <button
//                     key={g}
//                     type="button"
//                     onClick={() => setGranularity(g)}
//                     className={`px-3 py-1.5 text-xs capitalize ${
//                       granularity === g
//                         ? "bg-blue-600 text-white"
//                         : "bg-white text-slate-700 hover:bg-slate-50"
//                     }`}
//                   >
//                     {g}
//                   </button>
//                 ))}
//               </div>
//             </div>

//             <div className="reactdp-one">
//               <DatePicker
//                 inline
//                 fixedHeight
//                 monthsShown={1}
//                 shouldCloseOnSelect={false}
//                 // Keep your range state; Day mode uses native range picking
//                 selectsRange={granularity === "day"}
//                 startDate={dates[0]}
//                 endDate={dates[1]}
//                 onChange={(update) => {
//                   if (granularity === "day") {
//                     setDates(update);
//                   }
//                 }}
//                 onSelect={(d) => {
//                   if (!d) return;
//                   if (granularity === "month") {
//                     setDates([startOfMonth(d), endOfMonth(d)]);
//                   } else if (granularity === "year") {
//                     setDates([startOfYear(d), endOfYear(d)]);
//                   }
//                 }}
//                 openToDate={dates?.[1] ?? dates?.[0] ?? new Date()}
//                 // Custom header with Month + Year dropdowns
//                 renderCustomHeader={({
//                   date,
//                   decreaseMonth,
//                   increaseMonth,
//                   prevMonthButtonDisabled,
//                   nextMonthButtonDisabled,
//                   changeYear,
//                   changeMonth,
//                 }) => {
//                   const months = [
//                     "January","February","March","April","May","June",
//                     "July","August","September","October","November","December"
//                   ];
//                   const currentYear = new Date().getFullYear();
//                   const years = Array.from({ length: 16 }, (_, i) => currentYear + 1 - i); // next year .. 15 yrs back

//                   return (
//                     <div className="flex items-center justify-between gap-2 px-2 py-1">
//                       <div className="flex items-center gap-1">
//                         <button
//                           onClick={decreaseMonth}
//                           disabled={prevMonthButtonDisabled}
//                           className="px-2 py-1 rounded-md hover:bg-slate-100 disabled:opacity-40"
//                           title="Previous month"
//                           type="button"
//                         >
//                           ‹
//                         </button>
//                         <button
//                           onClick={increaseMonth}
//                           disabled={nextMonthButtonDisabled}
//                           className="px-2 py-1 rounded-md hover:bg-slate-100 disabled:opacity-40"
//                           title="Next month"
//                           type="button"
//                         >
//                           ›
//                         </button>
//                       </div>

//                       {/* Month / Year dropdowns for quick jump */}
//                       <div className="flex items-center gap-2">
//                         <select
//                           className="text-sm border border-slate-300 rounded-md px-2 py-1 bg-white"
//                           value={date.getMonth()}
//                           onChange={(e) => changeMonth(Number(e.target.value))}
//                         >
//                           {months.map((m, idx) => (
//                             <option key={m} value={idx}>{m}</option>
//                           ))}
//                         </select>

//                         <select
//                           className="text-sm border border-slate-300 rounded-md px-2 py-1 bg-white"
//                           value={date.getFullYear()}
//                           onChange={(e) => changeYear(Number(e.target.value))}
//                         >
//                           {years.map((y) => (
//                             <option key={y} value={y}>{y}</option>
//                           ))}
//                         </select>
//                       </div>
//                     </div>
//                   );
//                 }}
//               />
//             </div>

//           </div>

//           {/* local styles (optional tweak) */}
//           <style jsx="true">{`
//             .reactdp-one .react-datepicker__header {
//               padding-top: 6px;
//             }
//           `}</style>

//         </div>

//         {/* Footer */}
//         <div className="sticky bottom-0 flex items-center justify-between gap-2 px-4 sm:px-5 py-3 bg-white/95 border-t border-slate-200">
//           <div className="text-[11px] text-slate-500">
//             Tip: Press <kbd className="px-1 py-0.5 bg-slate-100 rounded">Enter</kbd> to apply.
//           </div>
//           <div className="flex gap-2">
//             <button onClick={() => setModalIsOpen(false)} className="px-4 py-2 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm">Cancel</button>
//             <button
//               onClick={() => { if (dates?.[0] && dates?.[1]) setModalIsOpen(false); }}
//               disabled={!dates?.[0] || !dates?.[1]}
//               className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium enabled:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               Apply
//             </button>
//           </div>
//         </div>

//         {/* Local styles for buttons + react-datepicker row layout */}
//         <style jsx="true">{`
//           .btn-outline { 
//             @apply text-slate-700 border border-slate-300 rounded-md px-1 py-1 text-xs sm:text-xs hover:bg-slate-100 text-left;
//             min-height: 30px;
//           }
//           .btn-ghost { 
//             @apply text-slate-600 rounded-md px-1 py-1 text-xs sm:text-xs hover:bg-slate-100 text-left;
//             min-height: 30px;
//           }
//           /* Force two calendars in a HORIZONTAL row and keep them readable on small screens */
//           .reactdp-row .react-datepicker {
//             display: flex !important;
//             flex-wrap: nowrap;
//             gap: 8px;
//           }
//           .reactdp-row .react-datepicker__month-container {
//             flex: 0 0 auto;
//             width: 290px;       /* ensures two full calendars sit side-by-side */
//           }
//           .reactdp-row .react-datepicker__header {
//             padding-top: 6px;
//           }
//           @media (min-width: 640px) {
//             .reactdp-row .react-datepicker__month-container { width: 300px; }
//           }
//         `}</style>
//       </Modal>



//       {(loading || exporting) && <LoadingSpinner />}
//     </>
//   );
// };

// export default AllTranHistory;






// // SearchGlobalTranHistory. ** Working ****
// import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
// import { postRequest } from "@/NAYSA Cloud/Configuration/BaseURL";
// import { exportHistoryExcel,exportGenericQueryExcel  } from "@/NAYSA Cloud/Global/report";
// import { LoadingSpinner } from "@/NAYSA Cloud/Global/utilities.jsx";
// import {
//   format,
//   subDays,
//   addMonths,
//   startOfMonth,
//   endOfMonth,
//   startOfYear,
//   endOfYear,
// } from "date-fns";
// import DatePicker from "react-datepicker";

// import "react-datepicker/dist/react-datepicker.css";
// import Modal from "react-modal";
// import { useNavigate, useLocation } from "react-router-dom";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import {
//   faList,
//   faPen,
//   faCalendarAlt,
//   faFilter,
//   faDownload,
//   faRedo,
//   faArrowUp,
//   faArrowDown,
//   faEye,
//   faLayerGroup,
//   faChevronRight,
//   faChevronDown,
//   faTimes,
//   faCompressArrowsAlt,
//   faExpandArrowsAlt,
//   faFileExcel,
//   faColumns,
//   faFilePdf,
//   faFileImage,
//   faFileExport,
//   faFileCsv,
// } from "@fortawesome/free-solid-svg-icons";

// import { useReturnToDate } from "@/NAYSA Cloud/Global/dates";
// import { useSelectedHSColConfig } from "@/NAYSA Cloud/Global/selectedData";
// import Header, { HeaderSpacer } from "@/NAYSA Cloud/Components/Header";
// import { useAuth } from "@/NAYSA Cloud/Authentication/AuthContext.jsx";

// import Swal from "sweetalert2";
// import html2canvas from "html2canvas";
// import jsPDF from "jspdf";

// Modal.setAppElement("#root");

// const ACTION_COL_WIDTH = 64;

// /* ------------------ window-level cache (survives route swaps) ------------------ */
// function getGlobalCache() {
//   if (typeof window !== "undefined") {
//     if (!window.__NAYSA_HISTORY_CACHE__) window.__NAYSA_HISTORY_CACHE__ = {};
//     return window.__NAYSA_HISTORY_CACHE__;
//   }
//   return {};
// }

// /* ---------------- Formatting helpers ---------------- */
// const formatCellValue = (value, config) => {
//   if (value === null || value === undefined) return "—";

//   switch (config?.renderType) {
//     case "date": {
//       try {
//         const datePart = String(value).split("T")[0];
//         return useReturnToDate(datePart);
//       } catch {
//         return String(value);
//       }
//     }

//     case "currency":
//     case "number": {
//       const num = Number(String(value).replace(/,/g, ""));
//       if (Number.isNaN(num)) return String(value);
//       const digits = typeof config?.roundingOff === "number" ? config.roundingOff : 2;
//       return num.toLocaleString("en-US", {
//         minimumFractionDigits: digits,
//         maximumFractionDigits: digits,
//       });
//     }

//     case "status": {
//       const map = {
//         C: { text: "CANCELLED", color: "text-red-600" },
//         F: { text: "FINALIZED", color: "text-blue-800" },
//         X: { text: "CANCELLED", color: "text-red-600" },
//         "": { text: "OPEN", color: "text-black" },
//       };
//       const sty = map[value] || map[""];
//       return <span className={sty.color + " font-semibold"}>{sty.text}</span>;
//     }

//     default:
//       return String(value);
//   }
// };

// const parseNumber = (v) => {
//   if (v === null || v === undefined || v === "") return 0;
//   const n = Number(String(v).replace(/,/g, ""));
//   return Number.isNaN(n) ? 0 : n;
// };

// const isNumericColumn = (col) =>
//   col?.renderType === "number" || col?.renderType === "currency";

// /* ============================== Component =============================== */
// const AllTranHistory = (props) => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const navState = location.state || {};
//   const didInitRef = useRef(false);
//   const hydratedFromCacheRef = useRef(false);
//   const exportContainerRef = useRef(null);
//   const tableScrollRef = useRef(null);
//   const resizingRef = useRef(null);
//   const { currentUserRow,companyInfo } = useAuth();

//   const {
//     endpoint: endpointProp,
//     activeTabKey: activeTabKeyProp,
//     branchCode: branchCodeProp,
//     startDate: startDateProp,
//     endDate: endDateProp,
//     status: statusProp,
//     statusOptions: statusOptionsProp,
//     prefillSearchFields: prefillProp,
//     onRowDoubleClick,
//     showHeader: showHeaderProp,
//     cacheKey: cacheKeyProp,
//     historyExportName: historyExportNameProp,
//   } = props || {};

//   const endpoint =
//     (endpointProp !== undefined && endpointProp) ||
//     (navState.endpoint !== undefined && navState.endpoint);

//   const baseKey =
//     (typeof cacheKeyProp === "string" && cacheKeyProp) ||
//     (typeof endpoint === "string" && endpoint) ||
//     "HISTORY";

//   const backToPath = navState.backToPath;
//   const embedded =
//     typeof onRowDoubleClick === "function" ||
//     endpointProp !== undefined ||
//     cacheKeyProp !== undefined;

//   const showHeader = showHeaderProp !== undefined ? showHeaderProp : !embedded;

//   const [activeTab, setActiveTab] = useState(null);

//   const fallbackStatusOptions = [
//     { value: "All", label: "All Status" },
//     { value: "F", label: "FINALIZED" },
//     { value: "C", label: "CLOSED" },
//     { value: "", label: "OPEN" },
//     { value: "X", label: "CANCELLED" },
//   ];

//   const restrictedTabs = ["JO_", "PO_", "PR_"];
//   const isRestricted = restrictedTabs.some((prefix) => activeTab?.includes(prefix));

//   const statusOptions =
//     Array.isArray(statusOptionsProp) && statusOptionsProp.length
//       ? statusOptionsProp
//       : fallbackStatusOptions.filter((opt) => {
//           if (isRestricted) return opt.value !== "F";
//           return opt.value !== "C";
//         });

//   const [branchCode, setBranchCode] = useState(
//     (branchCodeProp !== undefined && branchCodeProp) ||
//       (navState.branchCode !== undefined && navState.branchCode) ||
//       ""
//   );

//   const getColumnConfig = async (groupId) => {
//     try {
//       const response = await useSelectedHSColConfig(groupId, currentUserRow.userCode);
//       let config = [];

//       if (Array.isArray(response)) config = response;
//       else if (
//         response &&
//         response.success &&
//         response.data &&
//         response.data[0] &&
//         response.data[0].result
//       ) {
//         const parsed = JSON.parse(response.data[0].result || "[]");
//         config = Array.isArray(parsed) ? parsed : [];
//       } else if (response && Array.isArray(response.data)) {
//         config = response.data;
//       }

//       config = (config || []).map((c) => ({
//         key: c.key,
//         label:
//           c.label ||
//           String(c.key || "")
//             .replace(/_/g, " ")
//             .replace(/\b\w/g, (ch) => ch.toUpperCase()),
//         classNames: c.classNames || "text-left",
//         renderType: c.renderType || "text",
//         renderFormat: c.renderFormat || "",
//         roundingOff: typeof c.roundingOff === "number" ? c.roundingOff : undefined,
//         sortable: c.sortable !== false,
//         hidden: !!c.hidden,
//         width: c.width,
//       }));

//       return config;
//     } catch (err) {
//       console.error("❌ Column config fetch failed for", groupId, err);
//       return [];
//     }
//   };

//   const initialDates = () => {
//     if (startDateProp && endDateProp) return [new Date(startDateProp), new Date(endDateProp)];
//     if (navState.startDate && navState.endDate) return [new Date(navState.startDate), new Date(navState.endDate)];
//     return [subDays(new Date(), 6), new Date()];
//   };

//   const [dateRangeType, setDateRangeType] = useState(
//     (startDateProp && endDateProp) || (navState.startDate && navState.endDate)
//       ? "Custom Range"
//       : "Last 7 Days"
//   );
//   const [dates, setDates] = useState(initialDates());
//   const [modalIsOpen, setModalIsOpen] = useState(false);

//   const normalizeStatus = (v) => (v === "" ? "All" : v ?? "All");
//   const [status, setStatus] = useState(() => normalizeStatus(statusProp));
//   const [searchFields, setSearchFields] = useState(prefillProp || navState.prefillSearchFields || {});
//   const [tabData, setTabData] = useState({});
//   const [tabConfigs, setTabConfigs] = useState({});

//   const [loading, setLoading] = useState(false);
//   const [exporting, setExporting] = useState(false);
//   const [sortConfig, setSortConfig] = useState({
//     key: null,
//     direction: "asc",
//     tabKey: null,
//   });

//   const [granularity, setGranularity] = useState("day");

//   /* -------- added states for table functionality -------- */
//   const [columnOrderByTab, setColumnOrderByTab] = useState({});
//   const [groupByByTab, setGroupByByTab] = useState({});
//   const [expandedGroupsByTab, setExpandedGroupsByTab] = useState({});
//   const [draggedCol, setDraggedCol] = useState(null);
//   const [colWidthsByTab, setColWidthsByTab] = useState({});
//   const [userHiddenColsByTab, setUserHiddenColsByTab] = useState({});
//   const [showColumnChooser, setShowColumnChooser] = useState(false);
//   const [showExportMenu, setShowExportMenu] = useState(false);

//   useEffect(() => {
//     if (didInitRef.current) return;
//     didInitRef.current = true;
//   }, []);

//   /* ---------------- restore from window cache ---------------- */
//   useEffect(() => {
//     const cache = getGlobalCache();
//     let snap = cache[baseKey];
//     const incomingBranch =
//       (branchCodeProp !== undefined && branchCodeProp) ||
//       (navState.branchCode !== undefined && navState.branchCode) ||
//       "";

//     if (snap && incomingBranch && snap.branchCode && snap.branchCode !== incomingBranch) {
//       delete cache[baseKey];
//       snap = undefined;
//     }

//     if (snap) {
//       hydratedFromCacheRef.current = true;
//       setDates(snap.dates || initialDates());
//       setDateRangeType(snap.dateRangeType || "Last 7 Days");
//       const desired =
//         statusProp !== undefined
//           ? normalizeStatus(statusProp)
//           : snap.status !== undefined
//           ? normalizeStatus(snap.status)
//           : "All";
//       setStatus(desired);
//       setSearchFields(snap.searchFields || {});
//       setTabData(snap.tabData || {});
//       setTabConfigs(snap.tabConfigs || {});
//       setActiveTab(snap.activeTab || null);
//       setBranchCode((snap.branchCode !== undefined && snap.branchCode) || branchCode);
//       setColumnOrderByTab(snap.columnOrderByTab || {});
//       setGroupByByTab(snap.groupByByTab || {});
//       setExpandedGroupsByTab(snap.expandedGroupsByTab || {});
//       setColWidthsByTab(snap.colWidthsByTab || {});
//       setUserHiddenColsByTab(snap.userHiddenColsByTab || {});
//     } else {
//       if (statusProp !== undefined) setStatus(normalizeStatus(statusProp));
//     }
//   }, [baseKey, statusProp, branchCode, branchCodeProp, navState.branchCode]);

//   /* ---------------- keep cache updated ---------------- */
//   useEffect(() => {
//     const cache = getGlobalCache();
//     cache[baseKey] = {
//       dates,
//       dateRangeType,
//       status,
//       searchFields,
//       tabData,
//       tabConfigs,
//       activeTab,
//       branchCode,
//       columnOrderByTab,
//       groupByByTab,
//       expandedGroupsByTab,
//       colWidthsByTab,
//       userHiddenColsByTab,
//     };
//   }, [
//     baseKey,
//     dates,
//     dateRangeType,
//     status,
//     searchFields,
//     tabData,
//     tabConfigs,
//     activeTab,
//     branchCode,
//     columnOrderByTab,
//     groupByByTab,
//     expandedGroupsByTab,
//     colWidthsByTab,
//     userHiddenColsByTab,
//   ]);

//   /* ---------------- date presets ---------------- */
//   useEffect(() => {
//     const today = new Date();
//     if (dateRangeType === "Last 7 Days") {
//       setDates([subDays(today, 6), today]);
//     } else if (dateRangeType === "Last 30 Days") {
//       setDates([subDays(today, 29), today]);
//     } else if (dateRangeType === "Custom Range") {
//       setDates([null, null]);
//     }
//   }, [dateRangeType]);

//   const formatDateRange = (start, end) =>
//     start && end ? `${format(start, "MM/dd/yyyy")} - ${format(end, "MM/dd/yyyy")}` : "";

//   /* ---------------- columns for a tab ---------------- */
//   const getColumnsForTab = useCallback(
//     (tabKey) => {
//       const dataForTab = tabData[tabKey] || [];
//       const configured = tabConfigs[tabKey] || [];
//       if (configured.length > 0) return configured.filter((c) => !c.hidden);
//       if (dataForTab.length === 0) return [];
//       return Object.keys(dataForTab[0]).map((k) => ({
//         key: k,
//         label: k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
//         renderType: "text",
//         sortable: true,
//       }));
//     },
//     [tabData, tabConfigs]
//   );

//   const currentRows = tabData[activeTab] || [];
//   const baseColumns = useMemo(() => getColumnsForTab(activeTab), [activeTab, getColumnsForTab]);

//   useEffect(() => {
//     if (!activeTab || !baseColumns.length) return;

//     setColumnOrderByTab((prev) => {
//       if (prev[activeTab]?.length) return prev;
//       return {
//         ...prev,
//         [activeTab]: baseColumns.map((c) => c.key),
//       };
//     });

//     setGroupByByTab((prev) => ({
//       ...prev,
//       [activeTab]: prev[activeTab] || [],
//     }));

//     setExpandedGroupsByTab((prev) => ({
//       ...prev,
//       [activeTab]: prev[activeTab] || {},
//     }));

//     setColWidthsByTab((prev) => ({
//       ...prev,
//       [activeTab]: prev[activeTab] || {},
//     }));

//     setUserHiddenColsByTab((prev) => ({
//       ...prev,
//       [activeTab]: prev[activeTab] || [],
//     }));
//   }, [activeTab, baseColumns]);

//   const groupBy = groupByByTab[activeTab] || [];
//   const expandedGroups = expandedGroupsByTab[activeTab] || {};
//   const colWidths = colWidthsByTab[activeTab] || {};
//   const userHiddenCols = userHiddenColsByTab[activeTab] || [];
//   const columnOrder = columnOrderByTab[activeTab] || baseColumns.map((c) => c.key);

//   const orderedCols = useMemo(() => {
//     if (!baseColumns.length) return [];
//     if (!columnOrder.length) return baseColumns;
//     return columnOrder.map((key) => baseColumns.find((c) => c.key === key)).filter(Boolean);
//   }, [baseColumns, columnOrder]);

//   const visibleCols = useMemo(() => {
//     return orderedCols.filter(
//       (c) => !c.hidden && !userHiddenCols.includes(c.key) && !groupBy.includes(c.key)
//     );
//   }, [orderedCols, userHiddenCols, groupBy]);

//   /* ---------------- filtered rows ---------------- */
//   const filteredData = useMemo(() => {
//     const base = currentRows.filter((row) =>
//       Object.entries(searchFields).every(([key, value]) => {
//         if (!value) return true;
//         return String(row?.[key] ?? "")
//           .toLowerCase()
//           .includes(String(value).toLowerCase());
//       })
//     );

//     const statusFiltered = (() => {
//       if (status === "All") return base;
//       const statusFieldCandidates = ["C", "doc_stat", "docStatus", "status", "stat"];
//       return base.filter((row) => {
//         const rowStatus =
//           statusFieldCandidates
//             .map((f) => (row[f] !== undefined ? String(row[f]) : undefined))
//             .find((v) => v !== undefined) ?? "";
//         return rowStatus === status;
//       });
//     })();

//     if (!sortConfig.key || sortConfig.tabKey !== activeTab) return statusFiltered;

//     const col = baseColumns.find((c) => c.key === sortConfig.key);
//     const isNumeric = isNumericColumn(col);

//     return [...statusFiltered].sort((a, b) => {
//       const valA = a?.[sortConfig.key];
//       const valB = b?.[sortConfig.key];

//       if (isNumeric) {
//         const numA = parseNumber(valA);
//         const numB = parseNumber(valB);
//         return sortConfig.direction === "asc" ? numA - numB : numB - numA;
//       }

//       const sA = String(valA ?? "");
//       const sB = String(valB ?? "");
//       return sortConfig.direction === "asc" ? sA.localeCompare(sB) : sB.localeCompare(sA);
//     });
//   }, [currentRows, searchFields, status, sortConfig, activeTab, baseColumns]);

//   /* ---------------- grouping / totals helpers ---------------- */
//   const totalExemptions = ["rate", "percent", "ratio", "id", "code"];

//   const shouldSumColumn = useCallback(
//     (col) => {
//       const noTotalKeys = ["unitcost", "currrate", "unitprice", "runbal"];
//       if (!col) return false;

//       const key = String(col.key ?? "").toLowerCase();
//       const label = String(col.label ?? "").toLowerCase();

//       if (noTotalKeys.includes(key)) return false;
//       if (!isNumericColumn(col)) return false;
//       if (totalExemptions.some((ex) => label.includes(ex) || key.includes(ex))) return false;

//       return true;
//     },
//     []
//   );

//   const calculateAggregates = useCallback(
//     (rows) => {
//       const sums = {};
//       visibleCols.forEach((col) => {
//         if (shouldSumColumn(col)) {
//           sums[col.key] = rows.reduce((acc, curr) => acc + parseNumber(curr[col.key]), 0);
//         }
//       });
//       return sums;
//     },
//     [visibleCols, shouldSumColumn]
//   );

//   const groupData = useCallback(
//     (rows, level = 0) => {
//       if (level >= groupBy.length) return rows.map((row) => ({ ...row }));

//       const groupKey = groupBy[level];
//       const groups = {};

//       rows.forEach((row) => {
//         const val = String(row[groupKey] ?? "(Blank)");
//         if (!groups[val]) groups[val] = [];
//         groups[val].push(row);
//       });

//       const result = [];
//       Object.keys(groups)
//         .sort()
//         .forEach((key) => {
//           result.push({
//             isGroup: true,
//             key: groupKey,
//             value: key,
//             level,
//             children: groupData(groups[key], level + 1),
//             count: groups[key].length,
//             aggregates: calculateAggregates(groups[key]),
//           });
//         });

//       return result;
//     },
//     [groupBy, calculateAggregates]
//   );

//   const processRenderList = useCallback(
//     (nodes) => {
//       let list = [];
//       nodes.forEach((node) => {
//         if (node.isGroup) {
//           list.push(node);
//           const uniqueId = `${node.key}-${node.value}-${node.level}`;
//           if (expandedGroups[uniqueId]) {
//             if (node.level === groupBy.length - 1) list = list.concat(node.children);
//             else list = list.concat(processRenderList(node.children));

//             list.push({
//               isSubtotal: true,
//               groupLabel: baseColumns.find((c) => c.key === node.key)?.label,
//               groupValue: node.value,
//               aggregates: node.aggregates,
//               level: node.level,
//             });
//           }
//         } else {
//           list.push(node);
//         }
//       });
//       return list;
//     },
//     [expandedGroups, groupBy.length, baseColumns]
//   );

//   const groupedStructure = useMemo(() => {
//     if (groupBy.length === 0) return filteredData;
//     return groupData(filteredData);
//   }, [filteredData, groupBy, groupData]);

//   const fullRenderRows = useMemo(() => {
//     if (groupBy.length === 0) return filteredData;

//     const expandAll = (nodes) => {
//       let list = [];
//       nodes.forEach((node) => {
//         if (node.isGroup) {
//           list.push(node);
//           if (node.level === groupBy.length - 1) list = list.concat(node.children);
//           else list = list.concat(expandAll(node.children));

//           list.push({
//             isSubtotal: true,
//             groupLabel: baseColumns.find((c) => c.key === node.key)?.label,
//             groupValue: node.value,
//             aggregates: node.aggregates,
//             level: node.level,
//           });
//         } else {
//           list.push(node);
//         }
//       });
//       return list;
//     };

//     return expandAll(groupedStructure);
//   }, [groupBy.length, filteredData, groupedStructure, baseColumns]);

//   const displayRows = useMemo(() => {
//     if (groupBy.length === 0) return filteredData;
//     return processRenderList(groupedStructure);
//   }, [groupBy.length, filteredData, processRenderList, groupedStructure]);

//   const grandTotals = useMemo(() => calculateAggregates(filteredData), [filteredData, calculateAggregates]);

//   /* ---------------- fetch on APPLY FILTER only ---------------- */
//   const fetchHistory = useCallback(async () => {
//     if (!dates[0] || !dates[1]) return;
//     setLoading(true);

//     setTabData({});
//     setTabConfigs({});
//     setActiveTab(null);

//     const [startDate, endDate] = dates;
//     const payload = {
//       json_data: {
//         startDate: format(startDate, "yyyy-MM-dd"),
//         endDate: format(endDate, "yyyy-MM-dd"),
//         branchCode: branchCode,
//         userCode: currentUserRow.userCode,
//       },
//     };

//     try {
//       const dataResponse = await postRequest(endpoint, JSON.stringify(payload));
//       const raw =
//         dataResponse && dataResponse.data && dataResponse.data[0] && dataResponse.data[0].result
//           ? dataResponse.data[0].result
//           : "{}";

//       let parsed;
//       try {
//         parsed = JSON.parse(raw);
//       } catch (e) {
//         console.error("Failed to parse history result", e, raw);
//         setTabData({});
//         setTabConfigs({});
//         setActiveTab(null);
//         return;
//       }

//       let rootDataMap = {};
//       if (Array.isArray(parsed)) {
//         rootDataMap = parsed.reduce((acc, item) => {
//           if (item && typeof item === "object" && !Array.isArray(item)) Object.assign(acc, item);
//           return acc;
//         }, {});
//       } else if (parsed && typeof parsed === "object") {
//         rootDataMap = parsed;
//       }

//       Object.keys(rootDataMap).forEach((k) => {
//         const v = rootDataMap[k];
//         if (v && typeof v === "object" && !Array.isArray(v) && Array.isArray(v.rows)) {
//           rootDataMap[k] = v.rows;
//         }
//       });

//       const rootKeys = Object.keys(rootDataMap);
//       const newTabConfigs = {};
//       for (const key of rootKeys) {
//         newTabConfigs[key] = await getColumnConfig(key);
//       }

//       setTabData(rootDataMap);
//       setTabConfigs(newTabConfigs);

//       const initialTabKey =
//         (activeTabKeyProp && rootKeys.includes(activeTabKeyProp) && activeTabKeyProp) ||
//         (navState.activeTabKey && rootKeys.includes(navState.activeTabKey) && navState.activeTabKey) ||
//         rootKeys[0] ||
//         null;

//       const initialOrders = {};
//       const initialGroups = {};
//       const initialExpanded = {};
//       const initialWidths = {};
//       const initialHidden = {};

//       rootKeys.forEach((key) => {
//         const cols = (newTabConfigs[key] || []).length
//           ? newTabConfigs[key].filter((c) => !c.hidden)
//           : (rootDataMap[key]?.length
//               ? Object.keys(rootDataMap[key][0]).map((k) => ({ key: k }))
//               : []);
//         initialOrders[key] = cols.map((c) => c.key);
//         initialGroups[key] = [];
//         initialExpanded[key] = {};
//         initialWidths[key] = {};
//         initialHidden[key] = [];
//       });

//       setColumnOrderByTab(initialOrders);
//       setGroupByByTab(initialGroups);
//       setExpandedGroupsByTab(initialExpanded);
//       setColWidthsByTab(initialWidths);
//       setUserHiddenColsByTab(initialHidden);

//       setActiveTab((prev) => (prev && rootKeys.includes(prev) ? prev : initialTabKey));
//       setSearchFields((prev) => (Object.keys(prev).length ? prev : prefillProp || navState.prefillSearchFields || {}));
//       setSortConfig({ key: null, direction: "asc", tabKey: initialTabKey });

//       const cache = getGlobalCache();
//       cache[baseKey] = {
//         dates,
//         dateRangeType,
//         status,
//         searchFields: prefillProp || navState.prefillSearchFields || {},
//         tabData: rootDataMap,
//         tabConfigs: newTabConfigs,
//         activeTab: initialTabKey,
//         branchCode,
//         columnOrderByTab: initialOrders,
//         groupByByTab: initialGroups,
//         expandedGroupsByTab: initialExpanded,
//         colWidthsByTab: initialWidths,
//         userHiddenColsByTab: initialHidden,
//       };
//       hydratedFromCacheRef.current = true;
//     } catch (error) {
//       console.error("Error fetching history:", error);
//       setTabData({});
//       setTabConfigs({});
//       setActiveTab(null);
//     } finally {
//       setLoading(false);
//     }
//   }, [
//     dates,
//     branchCode,
//     endpoint,
//     activeTabKeyProp,
//     prefillProp,
//     navState.activeTabKey,
//     navState.prefillSearchFields,
//     baseKey,
//     dateRangeType,
//     status,
//     currentUserRow.userCode,
//   ]);

//   /* ---------------- handlers ---------------- */
//   const handleSearchChange = (e, key) => {
//     const { value } = e.target;
//     setSearchFields((prev) => ({ ...prev, [key]: value }));
//   };

//   const handleSort = (key) => {
//     let direction = "asc";
//     if (sortConfig.key === key && sortConfig.direction === "asc" && sortConfig.tabKey === activeTab) {
//       direction = "desc";
//     }
//     setSortConfig({ key, direction, tabKey: activeTab });
//   };

//   const handleResetUI = () => {
//     hydratedFromCacheRef.current = false;
//     const today = new Date();
//     setDateRangeType("Last 7 Days");
//     setDates([subDays(today, 6), today]);
//     setSearchFields({});
//     setStatus("All");
//     setGroupByByTab((prev) => ({ ...prev, [activeTab]: [] }));
//     setExpandedGroupsByTab((prev) => ({ ...prev, [activeTab]: {} }));
//     setUserHiddenColsByTab((prev) => ({ ...prev, [activeTab]: [] }));
//     setColWidthsByTab((prev) => ({ ...prev, [activeTab]: {} }));
//     if (activeTab) {
//       setColumnOrderByTab((prev) => ({
//         ...prev,
//         [activeTab]: baseColumns.map((c) => c.key),
//       }));
//     }
//   };

//   const getRowClassByStatus = (row) => {
//     const statusFieldCandidates = ["C", "doc_stat", "docStatus", "status", "stat"];
//     const rowStatus =
//       statusFieldCandidates
//         .map((f) => (row[f] !== undefined ? String(row[f]) : undefined))
//         .find((v) => v !== undefined) ?? "";

//     if (rowStatus === "X" || rowStatus === "C") return "text-red-600";
//     if (rowStatus === "F") return "text-blue-700";
//     return "";
//   };

  

//   const handleRowDoubleClick = useCallback(
//     (row) => {
//       const docNo = row?.docNo ?? row?.documentNo ?? row?.DOC_NO ?? "";
//       const bcode = row?.branchCode ?? row?.BRANCH_CODE ?? "";
//       if (!docNo || !bcode) return;

//       if (typeof onRowDoubleClick === "function") {
//         onRowDoubleClick({ ...row, docNo, branchCode: bcode });
//       } else {
//         navigate(backToPath, {
//           state: { docNo, branchCode: bcode },
//           replace: true,
//         });
//       }
//     },
//     [onRowDoubleClick, navigate, backToPath]
//   );

//   /* ---------------- column reorder / group / resize ---------------- */
//   const handleColDragStart = (e, key) => {
//     setDraggedCol(key);
//     e.dataTransfer.effectAllowed = "move";
//   };

//   const handleColDrop = (e, targetKey, isDropZone = false) => {
//     e.preventDefault();
//     if (!draggedCol || !activeTab) return;

//     if (isDropZone) {
//       if (!groupBy.includes(draggedCol)) {
//         setGroupByByTab((prev) => ({
//           ...prev,
//           [activeTab]: [...(prev[activeTab] || []), draggedCol],
//         }));
//         setExpandedGroupsByTab((prev) => ({ ...prev, [activeTab]: {} }));
//       }
//     } else {
//       if (groupBy.includes(draggedCol)) return;
//       if (draggedCol === targetKey) return;

//       const newOrder = [...columnOrder];
//       const oldIdx = newOrder.indexOf(draggedCol);
//       const newIdx = newOrder.indexOf(targetKey);

//       if (oldIdx > -1 && newIdx > -1) {
//         newOrder.splice(oldIdx, 1);
//         newOrder.splice(newIdx, 0, draggedCol);
//         setColumnOrderByTab((prev) => ({
//           ...prev,
//           [activeTab]: newOrder,
//         }));
//       }
//     }

//     setDraggedCol(null);
//   };

//   const toggleGroup = (node) => {
//     const uniqueId = `${node.key}-${node.value}-${node.level}`;
//     setExpandedGroupsByTab((prev) => ({
//       ...prev,
//       [activeTab]: {
//         ...(prev[activeTab] || {}),
//         [uniqueId]: !(prev[activeTab] || {})[uniqueId],
//       },
//     }));
//   };

//   const toggleAllGroups = (expand) => {
//     if (!activeTab) return;
//     if (!expand) {
//       setExpandedGroupsByTab((prev) => ({ ...prev, [activeTab]: {} }));
//       return;
//     }

//     const allKeys = {};
//     const traverse = (nodes) => {
//       nodes.forEach((n) => {
//         if (n.isGroup) {
//           allKeys[`${n.key}-${n.value}-${n.level}`] = true;
//           if (Array.isArray(n.children) && n.children[0]?.isGroup) traverse(n.children);
//         }
//       });
//     };
//     traverse(groupedStructure);

//     setExpandedGroupsByTab((prev) => ({
//       ...prev,
//       [activeTab]: allKeys,
//     }));
//   };


//   const handleRemoveGroupedColumn = (gKey) => {
//   if (!activeTab) return;

//   const nextGroups = (groupByByTab[activeTab] || []).filter((k) => k !== gKey);

//   if (nextGroups.length === 0) {
//     setGroupByByTab((prev) => ({
//       ...prev,
//       [activeTab]: [],
//     }));

//     setExpandedGroupsByTab((prev) => ({
//       ...prev,
//       [activeTab]: {},
//     }));

//     setDraggedCol(null);
//     return;
//   }

//   setGroupByByTab((prev) => ({
//     ...prev,
//     [activeTab]: nextGroups,
//   }));

//   setExpandedGroupsByTab((prev) => ({
//     ...prev,
//     [activeTab]: {},
//   }));
// };

//   const handleMouseMove = useCallback((e) => {
//     if (!resizingRef.current || !activeTab) return;
//     const { startX, startWidth, key } = resizingRef.current;
//     const delta = e.clientX - startX;
//     const newWidth = Math.max(60, startWidth + delta);

//     setColWidthsByTab((prev) => ({
//       ...prev,
//       [activeTab]: {
//         ...(prev[activeTab] || {}),
//         [key]: newWidth,
//       },
//     }));
//   }, [activeTab]);

//   const handleMouseUp = useCallback(() => {
//     if (resizingRef.current) {
//       resizingRef.current = null;
//       document.removeEventListener("mousemove", handleMouseMove);
//       document.removeEventListener("mouseup", handleMouseUp);
//     }
//   }, [handleMouseMove]);

//   const startResizing = (e, key) => {
//     e.preventDefault();
//     e.stopPropagation();
//     const th = e.currentTarget?.parentElement;
//     const currentWidth =
//       th?.offsetWidth ||
//       colWidths[key] ||
//       Number(baseColumns.find((c) => c.key === key)?.width) ||
//       120;

//     resizingRef.current = {
//       startX: e.clientX,
//       startWidth: currentWidth,
//       key,
//     };

//     document.addEventListener("mousemove", handleMouseMove);
//     document.addEventListener("mouseup", handleMouseUp);
//   };

// const stickyPlan = useMemo(() => {
//   let left = ACTION_COL_WIDTH;
//   const maxStickyCols = groupBy.length > 0 ? 1 : 0;

//   return visibleCols.map((col, index) => {
//     const resizedWidth = colWidths[col.key];
//     const isSticky = index < maxStickyCols;

//     if (isSticky) {
//       const width = (resizedWidth ?? Number(col.width)) || 140;
//       const meta = { sticky: true, left, width };
//       left += width;
//       return meta;
//     }

//     return { sticky: false, left: 0, width: resizedWidth || undefined };
//   });
// }, [visibleCols, colWidths, groupBy.length]);

//   /* ---------------- export helpers ---------------- */
//   const tabToSheet = (tabKey) => {
//     const cols = getColumnsForTab(tabKey).filter(
//       (c) =>
//         !(userHiddenColsByTab[tabKey] || []).includes(c.key) &&
//         !((groupByByTab[tabKey] || []).includes(c.key))
//     );

//     const rows = (tabData[tabKey] || []).map((row) => {
//       const obj = {};
//       cols.forEach((col) => {
//         const header = col.label || col.key;
//         const val = formatCellValue(row[col.key], col);
//         obj[header] = React.isValidElement(val) ? val.props?.children ?? "" : val;
//       });
//       return obj;
//     });

//     const sheetName = tabKey
//       .replace(/_/g, " ")
//       .replace(/\b\w/g, (c) => c.toUpperCase())
//       .slice(0, 31);

//     return { sheetName, rows };
//   };

//   const buildJsonSheets = () => Object.keys(tabData || {}).map((tabKey) => tabToSheet(tabKey));

//   function toTabbedJson(jsonSheets) {
//     const data = {};
//     for (const tab of jsonSheets || []) {
//       const key = tab.sheetName || "Sheet";
//       data[key] = Array.isArray(tab.rows) ? tab.rows : [];
//     }
//     return { Data: data };
//   }

//   const exportName =
//     historyExportNameProp ??
//     (location.state && location.state.historyExportName) ??
//     "Transaction History";

//   const getDateTimeStamp = () => {
//     const now = new Date();
//     const yyyy = now.getFullYear();
//     const mm = String(now.getMonth() + 1).padStart(2, "0");
//     const dd = String(now.getDate()).padStart(2, "0");
//     const hh = String(now.getHours()).padStart(2, "0");
//     const mi = String(now.getMinutes()).padStart(2, "0");
//     const ss = String(now.getSeconds()).padStart(2, "0");
//     return `${yyyy}${mm}${dd}_${hh}${mi}${ss}`;
//   };


//   const handleExportExcel_All = async () => {
//     const tabKeys = Object.keys(tabData || {});
//     if (!tabKeys.length) {
//       alert("No data to export. Please Apply Filter first.");
//       return;
//     }

//     setExporting(true);
//     try {

//         const now = new Date();
//         const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
//         const timePart = now.toTimeString().slice(0, 8).replace(/:/g, "");
//         const defaultFileName = `${exportName} ${datePart}_${timePart}`;

//         const { value: fileName } = await Swal.fire({
//         title: "Enter File Name",
//         input: "text",
//         inputLabel: "Export File Name:",
//         inputValue: defaultFileName,
//         width: "400px",
//         showCancelButton: true,
//         confirmButtonText: "Export",
//         inputValidator: (value) => {
//           if (!value || value.trim() === "") {
//             return "File name cannot be empty!";
//           }
//         },
//       });

//       if (!fileName) return;


//       const reportName = fileName;
//       const start = dates?.[0] ? format(dates[0], "yyyy-MM-dd") : null;
//       const end = dates?.[1] ? format(dates[1], "yyyy-MM-dd") : null;
//       const sheets = buildJsonSheets();
//       const jsonData = toTabbedJson(sheets);

//       const payload = {
//         ReportName: reportName,
//         UserCode: currentUserRow?.USER_CODE || currentUserRow?.userCode || "",
//         Branch: branchCode || "",
//         StartDate: start,
//         EndDate: end,
//         JsonData: jsonData,
//       };

//       await exportHistoryExcel(
//         "/exportHistoryReport",
//         JSON.stringify(payload),
//         setExporting,
//         reportName
//       );
//     } catch (err) {
//       console.error("Error exporting excel:", err);
//     } finally {
//       setExporting(false);
//     }
//   };


//   const handleExportExcel = async () => {
//   if (!visibleCols.length || !filteredData.length) return;

//   try {
//     const activeTabFileName = activeTab
//       ? `${activeTab.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} ${getDateTimeStamp()}`
//       : `History ${getDateTimeStamp()}`;

//     const { value: fileName } = await Swal.fire({
//       title: "Enter File Name",
//       input: "text",
//       inputLabel: "Export File Name:",
//       inputValue: activeTabFileName,
//       width: "400px",
//       showCancelButton: true,
//       confirmButtonText: "Export",
//       inputValidator: (value) => {
//         if (!value || value.trim() === "") {
//           return "File name cannot be empty!";
//         }
//       },
//     });

//     if (!fileName) return;

//     const exportData = groupBy.length > 0 ? groupedStructure : filteredData;

//     await exportGenericQueryExcel(
//       exportData,
//       grandTotals,
//       visibleCols,
//       groupBy,
//       baseColumns,
//       expandedGroups,
//       7,
//       fileName,
//       currentUserRow?.userName,
//       companyInfo?.compName,
//       companyInfo?.compAddr,
//       companyInfo?.telNo
//     );
//   } catch (err) {
//     console.error("Error exporting Excel:", err);
//   }
// };

//   const handleExportCsv = async () => {
//     if (!visibleCols.length || !filteredData.length) return;

//     try {
//       const defaultFileName = `${exportName} ${getDateTimeStamp()}`;
//       const { value: fileName } = await Swal.fire({
//         title: "Enter File Name",
//         input: "text",
//         inputLabel: "Export CSV File Name:",
//         inputValue: defaultFileName,
//         width: "400px",
//         showCancelButton: true,
//         confirmButtonText: "Export CSV",
//         inputValidator: (value) => {
//           if (!value || value.trim() === "") return "File name cannot be empty!";
//         },
//       });

//       if (!fileName) return;

//       const rowsToExport = filteredData;
//       const headerRow = visibleCols
//         .map((col) => {
//           let header = String(col.label ?? "");
//           header = header.replace(/,/g, "");
//           header = header.toUpperCase().replace(/\s+/g, "_");
//           return `"${header.replace(/"/g, '""')}"`;
//         })
//         .join(",");

//       const csvLines = [headerRow];

//       rowsToExport.forEach((row) => {
//         const line = visibleCols
//           .map((col) => {
//             const formatted = formatCellValue(row[col.key], col);
//             const noCommas = String(
//               React.isValidElement(formatted) ? formatted.props?.children ?? "" : formatted ?? ""
//             ).replace(/,/g, "");
//             return `"${String(noCommas).replace(/"/g, '""')}"`;
//           })
//           .join(",");
//         csvLines.push(line);
//       });

//       const blob = new Blob([csvLines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
//       const url = URL.createObjectURL(blob);
//       const link = document.createElement("a");
//       link.href = url;
//       link.setAttribute("download", `${fileName}.csv`);
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//       URL.revokeObjectURL(url);
//     } catch (err) {
//       console.error("Error exporting CSV:", err);
//     }
//   };

//   const handleExportPdf = async () => {
//     if (!exportContainerRef.current || !displayRows.length) return;

//     try {
//       const canvas = await html2canvas(exportContainerRef.current, { scale: 2, useCORS: true });
//       const imgData = canvas.toDataURL("image/png");

//       const defaultFileName = `${exportName} ${getDateTimeStamp()}`;
//       const { value: fileName } = await Swal.fire({
//         title: "Enter File Name",
//         input: "text",
//         inputLabel: "Export PDF File Name:",
//         inputValue: defaultFileName,
//         width: "400px",
//         showCancelButton: true,
//         confirmButtonText: "Export PDF",
//         inputValidator: (value) => {
//           if (!value || value.trim() === "") return "File name cannot be empty!";
//         },
//       });

//       if (!fileName) return;

//       const pdf = new jsPDF("l", "mm", "a4");
//       const pdfWidth = pdf.internal.pageSize.getWidth();
//       const pdfHeight = pdf.internal.pageSize.getHeight();
//       const imgWidthPx = canvas.width;
//       const imgHeightPx = canvas.height;
//       const ratio = Math.min(pdfWidth / imgWidthPx, pdfHeight / imgHeightPx);
//       const imgWidth = imgWidthPx * ratio;
//       const imgHeight = imgHeightPx * ratio;
//       const x = (pdfWidth - imgWidth) / 2;
//       const y = 5;

//       pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
//       pdf.save(`${fileName}.pdf`);
//     } catch (err) {
//       console.error("Error exporting PDF:", err);
//     }
//   };

//   const handleExportImage = async () => {
//     if (!exportContainerRef.current || !displayRows.length) return;

//     try {
//       const canvas = await html2canvas(exportContainerRef.current, { scale: 2, useCORS: true });
//       const imgData = canvas.toDataURL("image/png");

//       const defaultFileName = `${exportName} ${getDateTimeStamp()}`;
//       const { value: fileName } = await Swal.fire({
//         title: "Enter File Name",
//         input: "text",
//         inputLabel: "Export Image File Name:",
//         inputValue: defaultFileName,
//         width: "400px",
//         showCancelButton: true,
//         confirmButtonText: "Export Image",
//         inputValidator: (value) => {
//           if (!value || value.trim() === "") return "File name cannot be empty!";
//         },
//       });

//       if (!fileName) return;

//       const link = document.createElement("a");
//       link.href = imgData;
//       link.download = `${fileName}.png`;
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//     } catch (err) {
//       console.error("Error exporting image:", err);
//     }
//   };

//   const numberAlignClass = (col) =>
//     isNumericColumn(col) || col?.classNames?.includes("text-right")
//       ? "text-right tabular-nums"
//       : "text-left";

//   const commonCellClass = "px-2 py-1 border whitespace-nowrap";

//   const allChooserKeys = visibleCols
//     .concat(
//       orderedCols.filter(
//         (c) => !c.hidden && !groupBy.includes(c.key) && !visibleCols.some((vc) => vc.key === c.key)
//       )
//     )
//     .map((c) => c.key);

//   const allChecked = userHiddenCols.length === 0;

//   /* ---------------- JSX ---------------- */
//   return (
//     <>
//       {showHeader && (
//         <>
//           <Header
//             activeTopTab="history"
//             detailsRoute={backToPath}
//             historyRoute="/page/AllTranHistory"
//             showActions={false}
//           />
//           <HeaderSpacer />
//         </>
//       )}

//       <div className="fixed top-[55px] left-0 w-full z-30 bg-white shadow-md dark:bg-gray-800">
//         {showHeader && (
//           <div className="flex flex-col md:flex-row items-center justify-between px-4 py-2 gap-2 border-b border-gray-200 dark:border-gray-700">
//             <div className="flex flex-wrap justify-center md:justify-start gap-1 lg:gap-2 w-full md:w-auto">
//               <button
//                 className={`flex items-center px-3 py-2 rounded-md text-xs md:text-sm font-bold transition-colors duration-200 group ${
//                   location.pathname === "/"
//                     ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
//                     : "text-gray-600 hover:bg-gray-100 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-blue-300"
//                 }`}
//                 onClick={() => navigate(backToPath)}
//               >
//                 <FontAwesomeIcon icon={faPen} className="w-4 h-3 mr-2" />
//                 <span className="group-hover:block">Transaction Details</span>
//               </button>
//               <button
//                 className={`flex items-center px-3 py-2 rounded-md text-xs md:text-sm font-bold transition-colors duration-200 group ${
//                   location.pathname === "/"
//                     ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
//                     : "text-gray-600 hover:bg-gray-100 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-blue-300"
//                 }`}
//                 onClick={() => navigate(backToPath)}
//               >
//                 <FontAwesomeIcon icon={faList} className="w-4 h-4 mr-2" />
//                 <span className="group-hover:block">Transaction History</span>
//               </button>
//             </div>
//           </div>
//         )}

//         <style jsx="true">{`
//           @keyframes fade-in-down {
//             from {
//               opacity: 0;
//               transform: translateY(-10px);
//             }
//             to {
//               opacity: 1;
//               transform: translateY(0);
//             }
//           }
//           .animate-fade-in-down {
//             animation: fade-in-down 0.2s ease-out forwards;
//           }
//         `}</style>

//         <div className="flex flex-col md:flex-row flex-wrap items-end gap-2 overflow-x-auto p-6 mt-8">
//           <div className="flex-shrink-0 sm:min-w-[200px]">
//             <label className="block text-sm font-semibold text-gray-600 mb-1">Date Range:</label>
//             <div className="flex items-center border border-gray-300 rounded-md px-2 py-1 bg-white">
//               <select
//                 className="border-none focus:ring-0 text-sm bg-transparent pr-2"
//                 value={dateRangeType}
//                 onChange={(e) => setDateRangeType(e.target.value)}
//               >
//                 <option>Last 7 Days</option>
//                 <option>Last 30 Days</option>
//                 <option>Custom Range</option>
//               </select>

//               <div className="flex items-center border-l border-gray-300 pl-2 min-w-[200px]">
//                 <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400 mr-2 flex-shrink-0" />
//                 <input
//                   type="text"
//                   value={formatDateRange(dates[0], dates[1])}
//                   onClick={() => {
//                     if (dateRangeType === "Custom Range") setModalIsOpen(true);
//                   }}
//                   className="w-full min-w-0 h-[25px] border-none focus:ring-0 text-sm bg-transparent text-gray-700 tabular-nums whitespace-nowrap pr-2"
//                   placeholder="Select date range"
//                   readOnly
//                   title={formatDateRange(dates[0], dates[1])}
//                 />
//               </div>
//             </div>
//           </div>

//           <div className="flex-shrink-0 min-w-[200px]">
//             <label className="block text-sm font-semibold text-gray-600 mb-1">Status:</label>
//             <div className="flex items-center border border-gray-300 rounded-md px-2 py-1 bg-white">
//               <FontAwesomeIcon icon={faFilter} className="text-gray-400 mr-2" />
//               <select
//                 className="w-full h-[25px] border-none focus:ring-0 text-sm"
//                 value={status}
//                 onChange={(e) => setStatus(e.target.value)}
//               >
//                 {statusOptions.map((opt) => (
//                   <option key={String(opt.value)} value={opt.value}>
//                     {opt.label}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           </div>

//           <div className="flex-shrink-0 w-full md:w-auto mt-auto">
//             <button
//               className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-700 shadow-md w-full"
//               onClick={fetchHistory}
//               disabled={loading}
//             >
//               <FontAwesomeIcon icon={faFilter} className="mr-2" />
//               {loading ? "Loading..." : "Filter"}
//             </button>
//           </div>

//           <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 w-full md:w-auto ml-auto">
//             <button
//               className="flex items-center justify-center bg-green-600 text-white px-6 py-2 rounded-md text-sm font-semibold hover:bg-green-700 shadow-md w-full"
//               onClick={handleExportExcel_All}
//               disabled={loading || exporting || !filteredData.length}
//             >
//               <FontAwesomeIcon icon={faDownload} className="mr-2" />
//               <span className="truncate">{exporting ? "Exporting..." : "Export"}</span>
//             </button>
//             <button
//               className="flex items-center justify-center bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-semibold hover:bg-blue-700 shadow-md w-full"
//               onClick={handleResetUI}
//               disabled={loading || exporting}
//             >
//               <FontAwesomeIcon icon={faRedo} className="mr-2" />
//               <span className="truncate">Reset</span>
//             </button>
//           </div>
//         </div>

//         <div className="overflow-x-auto px-4">
//           {Object.keys(tabData).map((tabKey) => {
//             const isActive = activeTab === tabKey;
//             return (
//               <button
//                 key={tabKey}
//                 className={`py-2 px-10 text-sm border rounded-t-lg transition-all duration-200 ${
//                   isActive
//                     ? "bg-blue-100 text-blue-700 font-semibold shadow-lg shadow-blue-300 relative before:absolute before:inset-x-0 before:bottom-0 before:h-[3px] before:bg-blue-700 before:rounded-t-md"
//                     : "bg-white shadow-lg shadow-blue-50 text-gray-600 font-semibold hover:text-blue-700 hover:bg-blue-50"
//                 }`}
//                 onClick={() => {
//                   setActiveTab(tabKey);
//                   setSortConfig({ key: null, direction: "asc", tabKey });
//                   setShowColumnChooser(false);
//                   setShowExportMenu(false);
//                 }}
//               >
//                 {tabKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
//               </button>
//             );
//           })}
//         </div>

//         <div className="bg-white shadow-md rounded-md overflow-hidden p-4">
//           {activeTab && visibleCols.length > 0 && filteredData.length > 0 && (
//             <div
//               className="p-2 bg-gray-50 border flex flex-wrap gap-2 items-center min-h-[45px] shrink-0 mb-3"
//               onDragOver={(e) => e.preventDefault()}
//               onDrop={(e) => handleColDrop(e, null, true)}
//             >
//               <div className="flex-1 flex flex-wrap gap-2 items-center">
//                 <div className="text-xs font-bold text-gray-500 flex items-center">
//                   <FontAwesomeIcon icon={faLayerGroup} className="mr-2" />
//                   Group By:
//                 </div>

//                 {groupBy.length === 0 && (
//                   <div className="text-xs text-gray-400 italic border border-dashed border-gray-300 rounded px-3 py-1">
//                     Drag Header Here...
//                   </div>
//                 )}

//                 {groupBy.map((gKey) => (
//                   <div
//                     key={gKey}
//                     className="flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded border border-blue-200"
//                   >
//                     <span>{baseColumns.find((c) => c.key === gKey)?.label}</span>
//                    <button
//                       onClick={() => handleRemoveGroupedColumn(gKey)}
//                       className="ml-2 text-blue-500 hover:text-red-500"
//                     >
//                       <FontAwesomeIcon icon={faTimes} />
//                     </button>
//                   </div>
//                 ))}
//               </div>

//               <div className="flex items-center gap-2">
//                 {groupBy.length > 0 && (
//                   <>
//                     <button
//                       onClick={() => toggleAllGroups(true)}
//                       className="text-xs bg-white border px-2 py-1 rounded hover:bg-gray-100"
//                       title="Expand All"
//                     >
//                       <FontAwesomeIcon icon={faExpandArrowsAlt} /> Expand
//                     </button>

//                     <button
//                       onClick={() => toggleAllGroups(false)}
//                       className="text-xs bg-white border px-2 py-1 rounded hover:bg-gray-100"
//                       title="Collapse All"
//                     >
//                       <FontAwesomeIcon icon={faCompressArrowsAlt} /> Collapse
//                     </button>

//                     <button
//                       onClick={() => {
//                         setGroupByByTab((prev) => ({ ...prev, [activeTab]: [] }));
//                         setExpandedGroupsByTab((prev) => ({ ...prev, [activeTab]: {} }));
//                       }}
//                       className="text-xs bg-white border px-2 py-1 rounded hover:bg-gray-100"
//                       title="Remove All Groups"
//                     >
//                       <FontAwesomeIcon icon={faTimes} className="text-red-600 mr-1" />
//                       Remove
//                     </button>
//                   </>
//                 )}

//                 <div className="relative">
//                   <button
//                     type="button"
//                     onClick={() => filteredData.length && setShowExportMenu((prev) => !prev)}
//                     disabled={!filteredData.length}
//                     className="text-xs bg-white border px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-50"
//                     title="Export options"
//                   >
//                     <FontAwesomeIcon icon={faFileExport} className="text-blue-600 mr-1" />
//                     Export
//                   </button>

//                   {showExportMenu && (
//                     <div
//                       className="absolute right-0 mt-1 bg-white border rounded shadow-lg p-2 z-50 min-w-[180px]"
//                       onMouseLeave={() => setShowExportMenu(false)}
//                     >
//                       <div className="text-[11px] font-semibold mb-1 border-b pb-1">Export Options</div>

//                       <button
//                         type="button"
//                         onClick={async () => {
//                           setShowExportMenu(false);
//                           await handleExportExcel();
//                         }}
//                         className="w-full text-left text-[11px] px-2 py-1 rounded hover:bg-gray-100 flex items-center gap-2"
//                       >
//                         <FontAwesomeIcon icon={faFileExcel} className="text-green-600" />
//                         Excel
//                       </button>

//                       <button
//                         type="button"
//                         onClick={async () => {
//                           setShowExportMenu(false);
//                           await handleExportCsv();
//                         }}
//                         className="w-full text-left text-[11px] px-2 py-1 rounded hover:bg-gray-100 flex items-center gap-2"
//                       >
//                         <FontAwesomeIcon icon={faFileCsv} className="text-emerald-600" />
//                         CSV
//                       </button>

//                       <button
//                         type="button"
//                         onClick={async () => {
//                           setShowExportMenu(false);
//                           await handleExportPdf();
//                         }}
//                         className="w-full text-left text-[11px] px-2 py-1 rounded hover:bg-gray-100 flex items-center gap-2"
//                       >
//                         <FontAwesomeIcon icon={faFilePdf} className="text-red-600" />
//                         PDF
//                       </button>

//                       <button
//                         type="button"
//                         onClick={async () => {
//                           setShowExportMenu(false);
//                           await handleExportImage();
//                         }}
//                         className="w-full text-left text-[11px] px-2 py-1 rounded hover:bg-gray-100 flex items-center gap-2"
//                       >
//                         <FontAwesomeIcon icon={faFileImage} className="text-blue-600" />
//                         Image
//                       </button>
//                     </div>
//                   )}
//                 </div>

//                 <div className="relative">
//                   <button
//                     type="button"
//                     onClick={() => setShowColumnChooser((prev) => !prev)}
//                     className="text-xs bg-white border px-2 py-1 rounded hover:bg-gray-100"
//                   >
//                     <FontAwesomeIcon icon={faColumns} className="text-green-600" /> Columns
//                   </button>

//                   {showColumnChooser && (
//                     <div
//                       className="absolute right-0 mt-1 bg-white border rounded shadow-lg p-2 max-h-64 overflow-auto z-50 min-w-[220px]"
//                       onMouseLeave={() => setShowColumnChooser(false)}
//                     >
//                       <div className="flex items-center justify-between text-[11px] font-semibold mb-1 border-b pb-1">
//                         <span>Show / Hide Columns</span>
//                         <label className="flex items-center gap-1 text-[11px]">
//                           <input
//                             type="checkbox"
//                             className="h-3 w-3"
//                             checked={allChecked}
//                             onChange={() => {
//                               setUserHiddenColsByTab((prev) => ({
//                                 ...prev,
//                                 [activeTab]: allChecked ? allChooserKeys : [],
//                               }));
//                             }}
//                           />
//                           <span>Select All</span>
//                         </label>
//                       </div>

//                       {orderedCols
//                         .filter((col) => !col.hidden && !groupBy.includes(col.key))
//                         .map((col) => (
//                           <label key={col.key} className="flex items-center text-[11px] gap-2 mb-1">
//                             <input
//                               type="checkbox"
//                               className="h-3 w-3"
//                               checked={!userHiddenCols.includes(col.key)}
//                               onChange={(e) => {
//                                 const checked = e.target.checked;
//                                 setUserHiddenColsByTab((prev) => {
//                                   const current = prev[activeTab] || [];
//                                   return {
//                                     ...prev,
//                                     [activeTab]: checked
//                                       ? current.filter((k) => k !== col.key)
//                                       : [...current, col.key],
//                                   };
//                                 });
//                               }}
//                             />
//                             <span className="truncate">{col.label}</span>
//                           </label>
//                         ))}
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           )}

//           <div
//             ref={tableScrollRef}
//             className="overflow-x-auto bg-white rounded-md max-h-[55vh] relative"
//           >
//             {loading ? (
//               <div className="text-center py-6 text-gray-500">Loading data and configurations...</div>
//             ) : !activeTab || visibleCols.length === 0 ? (
//               <div className="text-center py-10 text-gray-500">
//                 Select a date range and click ‘Filter’ to load history.
//               </div>
//             ) : (
//               <table className="min-w-[1200px] text-[12px] text-center border-collapse border border-gray-300 table-fixed">
//                 <thead className="text-[12px] font-medium sticky top-0 z-30">
//                   <tr className="bg-blue-700 text-white">
//                     <th
//                       className="sticky left-0 top-0 z-50 px-2 py-2 border-r border-blue-800 bg-blue-700 w-[64px]"
//                       style={{ minWidth: ACTION_COL_WIDTH, maxWidth: ACTION_COL_WIDTH }}
//                     >
//                       View
//                     </th>

//                     {visibleCols.map((col, i) => {
//                       const meta = stickyPlan[i];
//                       const style = meta.sticky
//                         ? {
//                             left: meta.left,
//                             width: meta.width || 140,
//                             minWidth: meta.width || 140,
//                             maxWidth: meta.width || 400,
//                           }
//                         : {
//                             width: meta.width || undefined,
//                             minWidth: meta.width || undefined,
//                             maxWidth: 400,
//                           };

//                       return (
//                         <th
//                           key={col.key}
//                           draggable={!groupBy.includes(col.key)}
//                           onDragStart={(e) => handleColDragStart(e, col.key)}
//                           onDragOver={(e) => e.preventDefault()}
//                           onDrop={(e) => handleColDrop(e, col.key)}
//                           onClick={() => col.sortable !== false && handleSort(col.key)}
//                           className={`px-3 py-2 border whitespace-nowrap select-none relative ${
//                             col.sortable !== false ? "cursor-pointer" : ""
//                           } ${meta.sticky ? "sticky z-40 bg-blue-700" : ""} ${numberAlignClass(col)}`}
//                           style={style}
//                         >
//                           <div className="flex items-center justify-between gap-1">
//                             <span className="truncate">{col.label}</span>
//                             {col.sortable !== false && sortConfig.key === col.key && sortConfig.tabKey === activeTab ? (
//                               <FontAwesomeIcon
//                                 icon={sortConfig.direction === "asc" ? faArrowUp : faArrowDown}
//                                 className="text-xs"
//                               />
//                             ) : null}
//                           </div>

//                           <div
//                             className="absolute top-0 right-0 h-full w-1 cursor-col-resize select-none"
//                             onMouseDown={(e) => startResizing(e, col.key)}
//                           />
//                         </th>
//                       );
//                     })}
//                   </tr>

//                   <tr className="bg-gray-100 sticky top-[36px] z-20">
//                     <td className="sticky left-0 z-40 px-2 py-1 border bg-gray-100" />
//                     {visibleCols.map((col, i) => {
//                       const meta = stickyPlan[i];
//                       const style = meta.sticky
//                         ? {
//                             left: meta.left,
//                             width: meta.width || undefined,
//                             minWidth: meta.width || undefined,
//                           }
//                         : {
//                             width: meta.width || undefined,
//                             minWidth: meta.width || undefined,
//                           };

//                       return (
//                         <td
//                           key={col.key}
//                           className={`px-2 py-1 border whitespace-nowrap ${meta.sticky ? "sticky z-30 bg-gray-100" : ""}`}
//                           style={style}
//                         >
//                           <input
//                             type="text"
//                             value={searchFields[col.key] || ""}
//                             onChange={(e) => handleSearchChange(e, col.key)}
//                             placeholder="Filter"
//                             className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 text-[10px]"
//                           />
//                         </td>
//                       );
//                     })}
//                   </tr>
//                 </thead>

//                 <tbody className="divide-y divide-gray-200 text-[11px]">
//                   {displayRows.length > 0 ? (
//                     <>
//                       {displayRows.map((row, idx) => {
//                         if (groupBy.length > 0 && row.isGroup) {
//                           const uniqueId = `${row.key}-${row.value}-${row.level}`;
//                           const isExpanded = expandedGroups[uniqueId];
//                           return (
//                             <tr
//                               key={`g-${uniqueId}`}
//                               className="bg-gray-100 hover:bg-gray-200 cursor-pointer"
//                               onClick={() => toggleGroup(row)}
//                             >
//                               <td
//                                 colSpan={visibleCols.length + 1}
//                                 className="px-2 py-2 font-semibold border-b border-gray-300 text-blue-900 whitespace-nowrap"
//                               >
//                                 <div className="flex items-center" style={{ paddingLeft: row.level * 20 }}>
//                                   <FontAwesomeIcon
//                                     icon={isExpanded ? faChevronDown : faChevronRight}
//                                     className="w-3 h-3 mr-2 text-gray-500"
//                                   />
//                                   <span className="mr-2 text-gray-600">
//                                     {baseColumns.find((c) => c.key === row.key)?.label}:
//                                   </span>
//                                   <span className="mr-2 font-bold">{row.value}</span>
//                                   <span className="bg-blue-200 text-blue-800 text-[9px] px-1.5 rounded-full">
//                                     {row.count}
//                                   </span>
//                                 </div>
//                               </td>
//                             </tr>
//                           );
//                         }

//                         if (groupBy.length > 0 && row.isSubtotal) {
//                           return (
//                             <tr
//                               key={`sub-${row.groupValue}-${idx}`}
//                               className="bg-yellow-50 font-bold border-b border-gray-300"
//                             >
//                               <td className="sticky left-0 bg-yellow-50 border-r border-gray-300 z-10" />
//                               {visibleCols.map((col, i) => {
//                                 const meta = stickyPlan[i];
//                                 const val = row.aggregates[col.key];
//                                 const style = meta.sticky
//                                   ? {
//                                       left: meta.left,
//                                       width: meta.width || undefined,
//                                       minWidth: meta.width || undefined,
//                                     }
//                                   : {
//                                       width: meta.width || undefined,
//                                       minWidth: meta.width || undefined,
//                                     };

//                                 return (
//                                   <td
//                                     key={col.key}
//                                     className={`${commonCellClass} ${numberAlignClass(col)} ${
//                                       meta.sticky ? "sticky z-10 bg-yellow-50" : ""
//                                     }`}
//                                     style={style}
//                                   >
//                                     {i === 0 && (
//                                       <div className="float-left text-left font-bold" style={{ paddingLeft: row.level * 20 }}>
//                                         <span className="text-gray-600">Sub Total for {row.groupLabel}:</span>
//                                         <span className="ml-1 text-blue-900">{row.groupValue}</span>
//                                       </div>
//                                     )}
//                                     {val !== undefined ? formatCellValue(val, col) : ""}
//                                   </td>
//                                 );
//                               })}
//                             </tr>
//                           );
//                         }

//                         const rowClass = getRowClassByStatus(row);
//                         return (
//                           <tr
//                             key={idx}
//                             className={`hover:bg-blue-50 transition cursor-pointer ${rowClass} ${
//                               idx % 2 === 0 ? "bg-white" : "bg-gray-50"
//                             }`}
//                             onDoubleClick={() => handleRowDoubleClick(row)}
//                           >
//                             <td className="sticky left-0 z-10 px-2 py-1 border-r border-gray-200 bg-inherit text-center w-[64px] min-w-[64px]">
//                               <button
//                                 onClick={(e) => {
//                                   e.stopPropagation();
//                                   handleRowDoubleClick(row);
//                                 }}
//                                 className="px-2 py-0.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
//                                 title="View"
//                               >
//                                 <FontAwesomeIcon icon={faEye} className="w-4 h-3" />
//                               </button>
//                             </td>

//                             {visibleCols.map((col, i) => {
//                               const meta = stickyPlan[i];
//                               const alignRight = isNumericColumn(col) || col.classNames?.includes("text-right");
//                               const style = meta.sticky
//                                 ? {
//                                     left: meta.left,
//                                     width: meta.width || undefined,
//                                     minWidth: meta.width || undefined,
//                                     maxWidth: 400,
//                                   }
//                                 : {
//                                     width: meta.width || undefined,
//                                     minWidth: meta.width || undefined,
//                                     maxWidth: 400,
//                                   };

//                               return (
//                                 <td
//                                   key={col.key}
//                                   className={`px-2 py-1 border whitespace-nowrap ${
//                                     alignRight ? "text-right" : col.classNames || "text-left"
//                                   } ${meta.sticky ? "sticky z-10 bg-inherit" : ""}`}
//                                   title={String(row?.[col.key] ?? "")}
//                                   style={style}
//                                 >
//                                   <div
//                                     style={{
//                                       maxWidth: "300px",
//                                       overflow: "hidden",
//                                       textOverflow: "ellipsis",
//                                       whiteSpace: "nowrap",
//                                     }}
//                                   >
//                                     {formatCellValue(row?.[col.key], col)}
//                                   </div>
//                                 </td>
//                               );
//                             })}
//                           </tr>
//                         );
//                       })}
//                     </>
//                   ) : (
//                     <tr>
//                       <td colSpan={visibleCols.length + 1} className="text-center text-gray-500 py-4 border">
//                         No records found matching the filter criteria.
//                       </td>
//                     </tr>
//                   )}
//                 </tbody>

//                 {filteredData.length > 0 && (
//                   <tfoot className="sticky bottom-0 z-30 shadow-[0_-4px_6px_rgba(0,0,0,0.1)] text-[11px]">
//                     <tr className="bg-gray-100 font-bold border-t border-blue-400">
//                       <td className="sticky left-0 bg-gray-100 border-r border-gray-300 z-40" />
//                       {visibleCols.map((col, i) => {
//                         const meta = stickyPlan[i];
//                         const val = grandTotals[col.key];
//                         const style = meta.sticky
//                           ? {
//                               left: meta.left,
//                               width: meta.width || undefined,
//                               minWidth: meta.width || undefined,
//                             }
//                           : {
//                               width: meta.width || undefined,
//                               minWidth: meta.width || undefined,
//                             };

//                         return (
//                           <td
//                             key={col.key}
//                             className={`px-2 py-1 border ${numberAlignClass(col)} ${
//                               meta.sticky ? "sticky z-30 bg-gray-100" : ""
//                             }`}
//                             style={style}
//                           >
//                             {i === 0 && (
//                               <span className="text-gray-700 uppercase tracking-wide">
//                                 {groupBy.length > 0 ? "Grand Total" : "Total"}
//                               </span>
//                             )}
//                             {val !== undefined ? formatCellValue(val, col) : ""}
//                           </td>
//                         );
//                       })}
//                     </tr>
//                   </tfoot>
//                 )}
//               </table>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Hidden export table */}
//       {activeTab && filteredData.length > 0 && (
//         <div ref={exportContainerRef} style={{ position: "absolute", left: "-99999px", top: 0 }}>
//           <table className="border-collapse text-[8px]">
//             <thead>
//               <tr>
//                 {visibleCols.map((col) => (
//                   <th
//                     key={col.key}
//                     className="border px-2 py-1 text-left bg-gray-200 align-top"
//                     style={{ maxWidth: 150, whiteSpace: "normal", wordBreak: "break-word" }}
//                   >
//                     {col.label}
//                   </th>
//                 ))}
//               </tr>
//             </thead>

//             <tbody>
//               {(groupBy.length === 0 ? filteredData : fullRenderRows).map((row, idx) => {
//                 if (groupBy.length > 0 && row.isGroup) {
//                   return (
//                     <tr key={`exp-g-${row.key}-${row.value}-${row.level}-${idx}`}>
//                       <td
//                         colSpan={visibleCols.length}
//                         className="border px-2 py-1 font-semibold bg-gray-100"
//                         style={{ whiteSpace: "normal", wordBreak: "break-word" }}
//                       >
//                         {baseColumns.find((c) => c.key === row.key)?.label}: {row.value} ({row.count})
//                       </td>
//                     </tr>
//                   );
//                 }

//                 if (groupBy.length > 0 && row.isSubtotal) {
//                   return (
//                     <tr key={`exp-sub-${row.groupValue}-${idx}`}>
//                       {visibleCols.map((col, i) => {
//                         const val = row.aggregates[col.key];
//                         return (
//                           <td
//                             key={col.key}
//                             className="border px-2 py-1 font-semibold bg-yellow-50 align-top"
//                             style={{ maxWidth: 150, whiteSpace: "normal", wordBreak: "break-word" }}
//                           >
//                             {i === 0 && (
//                               <>
//                                 Sub Total for {row.groupLabel}: {row.groupValue}{" "}
//                               </>
//                             )}
//                             {val !== undefined ? formatCellValue(val, col) : ""}
//                           </td>
//                         );
//                       })}
//                     </tr>
//                   );
//                 }

//                 return (
//                   <tr key={`exp-row-${idx}`}>
//                     {visibleCols.map((col) => (
//                       <td
//                         key={col.key}
//                         className="border px-2 py-1 align-top"
//                         style={{ maxWidth: 150, whiteSpace: "normal", wordBreak: "break-word" }}
//                       >
//                         {formatCellValue(row[col.key], col)}
//                       </td>
//                     ))}
//                   </tr>
//                 );
//               })}
//             </tbody>

//             <tfoot>
//               <tr>
//                 {visibleCols.map((col, i) => (
//                   <td
//                     key={col.key}
//                     className="border px-2 py-1 font-bold bg-gray-100 align-top"
//                     style={{ maxWidth: 150, whiteSpace: "normal", wordBreak: "break-word" }}
//                   >
//                     {i === 0 && (groupBy.length > 0 ? "Grand Total" : "Total")}
//                     {grandTotals[col.key] !== undefined ? ` ${formatCellValue(grandTotals[col.key], col)}` : ""}
//                   </td>
//                 ))}
//               </tr>
//             </tfoot>
//           </table>
//         </div>
//       )}

//       {/* Date Picker Modal */}
//       <Modal
//         isOpen={modalIsOpen}
//         onRequestClose={() => setModalIsOpen(false)}
//         closeTimeoutMS={150}
//         className="w-[min(100vw,500px)] sm:w-[min(100vw,500px)] h-[90vh] sm:h-auto sm:max-h-[80vh] mx-auto sm:mt-4 rounded-none sm:rounded-2xl shadow-2xl bg-white overflow-hidden outline-none"
//         overlayClassName="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50"
//       >
//         <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3">
//           <h2 className="text-base font-semibold">Select Custom Date Range</h2>
//           <p className="text-xs/relaxed text-white/80">
//             Choose a range or use quick presets. Press{" "}
//             <kbd className="px-1.5 py-0.5 bg-white/20 rounded">Esc</kbd> to cancel.
//           </p>
//           <button
//             onClick={() => setModalIsOpen(false)}
//             className="absolute right-3 top-3 grid place-items-center w-8 h-8 rounded-full hover:bg-white/15 focus:ring-2 focus:ring-white/60"
//             aria-label="Close"
//             title="Close"
//           >
//             <svg viewBox="0 0 20 20" className="w-4 h-4">
//               <path
//                 fill="currentColor"
//                 d="M11.41 10l4.3-4.29a1 1 0 10-1.42-1.42L10 8.59 5.71 4.29a1 1 0 10-1.42 1.42L8.59 10l-4.3 4.29a1 1 0 101.42 1.42L10 11.41l4.29 4.3a1 1 0 001.42-1.42z"
//               />
//             </svg>
//           </button>
//         </div>

//         <div className="p-2 sm:p-2 grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-2 h-[calc(90vh-120px)] sm:h-auto overflow-auto">
//           <div className="space-y-1 mt-2">
//             <div className="grid grid-cols-2 sm:grid-cols-1 gap-1">
//               <button className="btn-outline text-sm hover:bg-blue-100" onClick={() => { const t = new Date(); setDates([t, t]); }}>Today</button>
//               <button className="btn-outline text-sm hover:bg-blue-100" onClick={() => { const t = new Date(); const y = new Date(t); y.setDate(t.getDate() - 1); setDates([y, y]); }}>Yesterday</button>
//               <button className="btn-outline text-sm hover:bg-blue-100" onClick={() => { const t = new Date(); setDates([subDays(t, 6), t]); }}>Last 7 Days</button>
//               <button className="btn-outline text-sm hover:bg-blue-100" onClick={() => { const t = new Date(); setDates([subDays(t, 29), t]); }}>Last 30 Days</button>
//               <button className="btn-outline text-sm hover:bg-blue-100" onClick={() => { const t = new Date(); setDates([startOfMonth(t), endOfMonth(t)]); }}>This Month</button>
//               <button className="btn-outline text-sm hover:bg-blue-100" onClick={() => { const t = new Date(); const last = addMonths(t, -1); setDates([startOfMonth(last), endOfMonth(last)]); }}>Last Month</button>
//               <button className="btn-outline text-sm hover:bg-blue-100" onClick={() => { const t = new Date(); setDates([startOfYear(t), endOfYear(t)]); }}>YTD</button>
//               <button className="btn-ghost text-sm hover:bg-blue-100" onClick={() => setDates([null, null])} title="Clear selection">Clear</button>
//             </div>

//             <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-600">
//               <div className="font-semibold text-slate-700 mb-1">Selected Range</div>
//               {dates?.[0] && dates?.[1] ? (
//                 <div>{format(dates[0], "MMM dd, yyyy")} — {format(dates[1], "MMM dd, yyyy")}</div>
//               ) : (
//                 <div className="italic text-slate-400">No range selected</div>
//               )}
//               {granularity !== "day" && (
//                 <div className="mt-1 text-[11px] text-slate-500">
//                   Mode: <span className="uppercase">{granularity}</span> (one tap selects entire {granularity})
//                 </div>
//               )}
//             </div>
//           </div>

//           <div className="rounded-xl border border-slate-200 p-2 sm:p-2">
//             <div className="flex items-center gap-1 mb-2">
//               <span className="text-xs text-slate-500 mr-1">Select by:</span>
//               <div className="inline-flex rounded-lg border border-slate-300 overflow-hidden">
//                 {["day", "month", "year"].map((g) => (
//                   <button
//                     key={g}
//                     type="button"
//                     onClick={() => setGranularity(g)}
//                     className={`px-3 py-1.5 text-xs capitalize ${
//                       granularity === g ? "bg-blue-600 text-white" : "bg-white text-slate-700 hover:bg-slate-50"
//                     }`}
//                   >
//                     {g}
//                   </button>
//                 ))}
//               </div>
//             </div>

//             <div className="reactdp-one">
//               <DatePicker
//                 inline
//                 fixedHeight
//                 monthsShown={1}
//                 shouldCloseOnSelect={false}
//                 selectsRange={granularity === "day"}
//                 startDate={dates[0]}
//                 endDate={dates[1]}
//                 onChange={(update) => {
//                   if (granularity === "day") setDates(update);
//                 }}
//                 onSelect={(d) => {
//                   if (!d) return;
//                   if (granularity === "month") setDates([startOfMonth(d), endOfMonth(d)]);
//                   else if (granularity === "year") setDates([startOfYear(d), endOfYear(d)]);
//                 }}
//                 openToDate={dates?.[1] ?? dates?.[0] ?? new Date()}
//                 renderCustomHeader={({
//                   date,
//                   decreaseMonth,
//                   increaseMonth,
//                   prevMonthButtonDisabled,
//                   nextMonthButtonDisabled,
//                   changeYear,
//                   changeMonth,
//                 }) => {
//                   const months = [
//                     "January", "February", "March", "April", "May", "June",
//                     "July", "August", "September", "October", "November", "December"
//                   ];
//                   const currentYear = new Date().getFullYear();
//                   const years = Array.from({ length: 16 }, (_, i) => currentYear + 1 - i);

//                   return (
//                     <div className="flex items-center justify-between gap-2 px-2 py-1">
//                       <div className="flex items-center gap-1">
//                         <button
//                           onClick={decreaseMonth}
//                           disabled={prevMonthButtonDisabled}
//                           className="px-2 py-1 rounded-md hover:bg-slate-100 disabled:opacity-40"
//                           title="Previous month"
//                           type="button"
//                         >
//                           ‹
//                         </button>
//                         <button
//                           onClick={increaseMonth}
//                           disabled={nextMonthButtonDisabled}
//                           className="px-2 py-1 rounded-md hover:bg-slate-100 disabled:opacity-40"
//                           title="Next month"
//                           type="button"
//                         >
//                           ›
//                         </button>
//                       </div>

//                       <div className="flex items-center gap-2">
//                         <select
//                           className="text-sm border border-slate-300 rounded-md px-2 py-1 bg-white"
//                           value={date.getMonth()}
//                           onChange={(e) => changeMonth(Number(e.target.value))}
//                         >
//                           {months.map((m, idx) => (
//                             <option key={m} value={idx}>{m}</option>
//                           ))}
//                         </select>

//                         <select
//                           className="text-sm border border-slate-300 rounded-md px-2 py-1 bg-white"
//                           value={date.getFullYear()}
//                           onChange={(e) => changeYear(Number(e.target.value))}
//                         >
//                           {years.map((y) => (
//                             <option key={y} value={y}>{y}</option>
//                           ))}
//                         </select>
//                       </div>
//                     </div>
//                   );
//                 }}
//               />
//             </div>
//           </div>

//           <style jsx="true">{`
//             .reactdp-one .react-datepicker__header {
//               padding-top: 6px;
//             }
//           `}</style>
//         </div>

//         <div className="sticky bottom-0 flex items-center justify-between gap-2 px-4 sm:px-5 py-3 bg-white/95 border-t border-slate-200">
//           <div className="text-[11px] text-slate-500">
//             Tip: Press <kbd className="px-1 py-0.5 bg-slate-100 rounded">Enter</kbd> to apply.
//           </div>
//           <div className="flex gap-2">
//             <button onClick={() => setModalIsOpen(false)} className="px-4 py-2 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm">
//               Cancel
//             </button>
//             <button
//               onClick={() => { if (dates?.[0] && dates?.[1]) setModalIsOpen(false); }}
//               disabled={!dates?.[0] || !dates?.[1]}
//               className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium enabled:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               Apply
//             </button>
//           </div>
//         </div>

//         <style jsx="true">{`
//           .btn-outline {
//             @apply text-slate-700 border border-slate-300 rounded-md px-1 py-1 text-xs sm:text-xs hover:bg-slate-100 text-left;
//             min-height: 30px;
//           }
//           .btn-ghost {
//             @apply text-slate-600 rounded-md px-1 py-1 text-xs sm:text-xs hover:bg-slate-100 text-left;
//             min-height: 30px;
//           }
//           .reactdp-row .react-datepicker {
//             display: flex !important;
//             flex-wrap: nowrap;
//             gap: 8px;
//           }
//           .reactdp-row .react-datepicker__month-container {
//             flex: 0 0 auto;
//             width: 290px;
//           }
//           .reactdp-row .react-datepicker__header {
//             padding-top: 6px;
//           }
//           @media (min-width: 640px) {
//             .reactdp-row .react-datepicker__month-container {
//               width: 300px;
//             }
//           }
//         `}</style>
//       </Modal>

//       {(loading || exporting) && <LoadingSpinner />}
//     </>
//   );
// };

// export default AllTranHistory;








// ** Part 3
// SearchGlobalTranHistory.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { postRequest } from "@/NAYSA Cloud/Configuration/BaseURL";
import { exportHistoryExcel, exportGenericQueryExcel } from "@/NAYSA Cloud/Global/report";
import { LoadingSpinner } from "@/NAYSA Cloud/Global/utilities.jsx";
import {
  format,
  subDays,
  addMonths,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";
import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";
import Modal from "react-modal";
import { useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faList,
  faPen,
  faCalendarAlt,
  faFilter,
  faDownload,
  faRedo,
  faArrowUp,
  faArrowDown,
  faEye,
  faLayerGroup,
  faChevronRight,
  faChevronDown,
  faTimes,
  faCompressArrowsAlt,
  faExpandArrowsAlt,
  faFileExcel,
  faColumns,
  faFilePdf,
  faFileImage,
  faFileExport,
  faFileCsv,
} from "@fortawesome/free-solid-svg-icons";

import { useReturnToDate } from "@/NAYSA Cloud/Global/dates";
import { useSelectedHSColConfig } from "@/NAYSA Cloud/Global/selectedData";
import Header, { HeaderSpacer } from "@/NAYSA Cloud/Components/Header";
import { useAuth } from "@/NAYSA Cloud/Authentication/AuthContext.jsx";

import Swal from "sweetalert2";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

Modal.setAppElement("#root");

const ACTION_COL_WIDTH = 64;

/* ------------------ window-level cache (survives route swaps) ------------------ */
function getGlobalCache() {
  if (typeof window !== "undefined") {
    if (!window.__NAYSA_HISTORY_CACHE__) window.__NAYSA_HISTORY_CACHE__ = {};
    return window.__NAYSA_HISTORY_CACHE__;
  }
  return {};
}

/* ---------------- Formatting helpers ---------------- */
const formatCellValue = (value, config) => {
  if (value === null || value === undefined) return "—";

  switch (config?.renderType) {
    case "date": {
      try {
        const datePart = String(value).split("T")[0];
        return useReturnToDate(datePart);
      } catch {
        return String(value);
      }
    }

    case "currency":
    case "number": {
      const num = Number(String(value).replace(/,/g, ""));
      if (Number.isNaN(num)) return String(value);
      const digits = typeof config?.roundingOff === "number" ? config.roundingOff : 2;
      return num.toLocaleString("en-US", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      });
    }

    case "status": {
      const map = {
        C: { text: "CANCELLED", color: "text-red-600" },
        F: { text: "FINALIZED", color: "text-blue-800" },
        X: { text: "CANCELLED", color: "text-red-600" },
        "": { text: "OPEN", color: "text-black" },
      };
      const sty = map[value] || map[""];
      return <span className={sty.color + " font-semibold"}>{sty.text}</span>;
    }

    default:
      return String(value);
  }
};

const parseNumber = (v) => {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isNaN(n) ? 0 : n;
};

const isNumericColumn = (col) =>
  col?.renderType === "number" || col?.renderType === "currency";

/* ============================== Component =============================== */
const AllTranHistory = (props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const navState = location.state || {};


 

 const {
  endpoint: endpointProp,
  activeTabKey: activeTabKeyProp,
  branchCode: branchCodeProp,
  startDate: startDateProp,
  endDate: endDateProp,
  status: statusProp,
  statusOptions: statusOptionsProp,
  prefillSearchFields: prefillProp,
  onRowDoubleClick,
  showHeader: showHeaderProp,
  cacheKey: cacheKeyProp,
  historyExportName: historyExportNameProp,
  isActive = true,
} = props || {};


  const didInitRef = useRef(false);
  const hydratedFromCacheRef = useRef(false);
  const exportContainerRef = useRef(null);
  const tableScrollRef = useRef(null);
  const resizingRef = useRef(null);
  const wasActiveRef = useRef(isActive);
  const { currentUserRow, companyInfo } = useAuth();
  const endpoint =
    (endpointProp !== undefined && endpointProp) ||
    (navState.endpoint !== undefined && navState.endpoint);

  const baseKey =
    (typeof cacheKeyProp === "string" && cacheKeyProp) ||
    (typeof endpoint === "string" && endpoint) ||
    "HISTORY";

  const backToPath = navState.backToPath;
  const embedded =
    typeof onRowDoubleClick === "function" ||
    endpointProp !== undefined ||
    cacheKeyProp !== undefined;

  const showHeader = showHeaderProp !== undefined ? showHeaderProp : !embedded;

  const [activeTab, setActiveTab] = useState(null);

  const fallbackStatusOptions = [
    { value: "All", label: "All Status" },
    { value: "F", label: "FINALIZED" },
    { value: "C", label: "CLOSED" },
    { value: "", label: "OPEN" },
    { value: "X", label: "CANCELLED" },
  ];

  const restrictedTabs = ["JO_", "PO_", "PR_"];
  const isRestricted = restrictedTabs.some((prefix) => activeTab?.includes(prefix));

  const statusOptions =
    Array.isArray(statusOptionsProp) && statusOptionsProp.length
      ? statusOptionsProp
      : fallbackStatusOptions.filter((opt) => {
          if (isRestricted) return opt.value !== "F";
          return opt.value !== "C";
        });

  const getColumnConfig = useCallback(
    async (groupId) => {
      try {
        const response = await useSelectedHSColConfig(groupId, currentUserRow.userCode);
        let config = [];

        if (Array.isArray(response)) config = response;
        else if (
          response &&
          response.success &&
          response.data &&
          response.data[0] &&
          response.data[0].result
        ) {
          const parsed = JSON.parse(response.data[0].result || "[]");
          config = Array.isArray(parsed) ? parsed : [];
        } else if (response && Array.isArray(response.data)) {
          config = response.data;
        }

        config = (config || []).map((c) => ({
          key: c.key,
          label:
            c.label ||
            String(c.key || "")
              .replace(/_/g, " ")
              .replace(/\b\w/g, (ch) => ch.toUpperCase()),
          classNames: c.classNames || "text-left",
          renderType: c.renderType || "text",
          renderFormat: c.renderFormat || "",
          roundingOff: typeof c.roundingOff === "number" ? c.roundingOff : undefined,
          sortable: c.sortable !== false,
          hidden: !!c.hidden,
          width: c.width,
        }));

        return config;
      } catch (err) {
        console.error("❌ Column config fetch failed for", groupId, err);
        return [];
      }
    },
    [currentUserRow?.userCode||"", ]
  );

  const initialDates = useCallback(() => {
    if (startDateProp && endDateProp) return [new Date(startDateProp), new Date(endDateProp)];
    if (navState.startDate && navState.endDate)
      return [new Date(navState.startDate), new Date(navState.endDate)];
    return [subDays(new Date(), 6), new Date()];
  }, [startDateProp, endDateProp, navState.startDate, navState.endDate]);

  const normalizeStatus = (v) => (v === "" ? "All" : v ?? "All");

  const [dateRangeType, setDateRangeType] = useState(
    (startDateProp && endDateProp) || (navState.startDate && navState.endDate)
      ? "Custom Range"
      : "Last 7 Days"
  );

  const [dates, setDates] = useState(initialDates());
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [status, setStatus] = useState(() => normalizeStatus(statusProp));
  const [searchFields, setSearchFields] = useState(prefillProp || navState.prefillSearchFields || {});
  const [tabData, setTabData] = useState({});
  const [tabConfigs, setTabConfigs] = useState({});
  const [exporting, setExporting] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
    tabKey: null,
  });

  const [granularity, setGranularity] = useState("day");

  /* -------- table states -------- */
  const [columnOrderByTab, setColumnOrderByTab] = useState({});
  const [groupByByTab, setGroupByByTab] = useState({});
  const [expandedGroupsByTab, setExpandedGroupsByTab] = useState({});
  const [draggedCol, setDraggedCol] = useState(null);
  const [colWidthsByTab, setColWidthsByTab] = useState({});
  const [userHiddenColsByTab, setUserHiddenColsByTab] = useState({});
  const [showColumnChooser, setShowColumnChooser] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const [branchCode, setBranchCode] = useState(
    (branchCodeProp !== undefined && branchCodeProp) ||
      (navState.branchCode !== undefined && navState.branchCode) ||
      ""
  );

  // These are the actual query-driving filters
  const [appliedFilters, setAppliedFilters] = useState(() => {
    const [startDate, endDate] = initialDates();
    return {
      startDate: startDate ? format(startDate, "yyyy-MM-dd") : null,
      endDate: endDate ? format(endDate, "yyyy-MM-dd") : null,
      branchCode:
        (branchCodeProp !== undefined && branchCodeProp) ||
        (navState.branchCode !== undefined && navState.branchCode) ||
        "",
    };
  });

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
  }, []);

  /* ---------------- restore from window cache ---------------- */
  useEffect(() => {
    const cache = getGlobalCache();
    let snap = cache[baseKey];
    const incomingBranch =
      (branchCodeProp !== undefined && branchCodeProp) ||
      (navState.branchCode !== undefined && navState.branchCode) ||
      "";

    if (snap && incomingBranch && snap.branchCode && snap.branchCode !== incomingBranch) {
      delete cache[baseKey];
      snap = undefined;
    }

    if (snap) {
      hydratedFromCacheRef.current = true;
      setDates(snap.dates || initialDates());
      setDateRangeType(snap.dateRangeType || "Last 7 Days");
      const desired =
        statusProp !== undefined
          ? normalizeStatus(statusProp)
          : snap.status !== undefined
          ? normalizeStatus(snap.status)
          : "All";
      setStatus(desired);
      setSearchFields(snap.searchFields || {});
      setTabData(snap.tabData || {});
      setTabConfigs(snap.tabConfigs || {});
      setActiveTab(snap.activeTab || null);
      setBranchCode((snap.branchCode !== undefined && snap.branchCode) || branchCode);
      setColumnOrderByTab(snap.columnOrderByTab || {});
      setGroupByByTab(snap.groupByByTab || {});
      setExpandedGroupsByTab(snap.expandedGroupsByTab || {});
      setColWidthsByTab(snap.colWidthsByTab || {});
      setUserHiddenColsByTab(snap.userHiddenColsByTab || {});
    } else {
      if (statusProp !== undefined) setStatus(normalizeStatus(statusProp));
    }
  }, [baseKey, statusProp, branchCode, branchCodeProp, navState.branchCode, initialDates]);

  /* ---------------- keep window cache updated ---------------- */
  useEffect(() => {
    const cache = getGlobalCache();
    cache[baseKey] = {
      dates,
      dateRangeType,
      status,
      searchFields,
      tabData,
      tabConfigs,
      activeTab,
      branchCode,
      columnOrderByTab,
      groupByByTab,
      expandedGroupsByTab,
      colWidthsByTab,
      userHiddenColsByTab,
    };
  }, [
    baseKey,
    dates,
    dateRangeType,
    status,
    searchFields,
    tabData,
    tabConfigs,
    activeTab,
    branchCode,
    columnOrderByTab,
    groupByByTab,
    expandedGroupsByTab,
    colWidthsByTab,
    userHiddenColsByTab,
  ]);

  /* ---------------- date presets ---------------- */
  useEffect(() => {
    const today = new Date();
    if (dateRangeType === "Last 7 Days") {
      setDates([subDays(today, 6), today]);
    } else if (dateRangeType === "Last 30 Days") {
      setDates([subDays(today, 29), today]);
    } else if (dateRangeType === "Custom Range") {
      setDates([null, null]);
    }
  }, [dateRangeType]);

  const formatDateRange = (start, end) =>
    start && end ? `${format(start, "MM/dd/yyyy")} - ${format(end, "MM/dd/yyyy")}` : "";

  /* ---------------- query fetcher ---------------- */
  const fetchHistoryData = useCallback(
    async ({ queryKey }) => {
      const [, params] = queryKey;

      const payload = {
        json_data: {
          startDate: params.startDate,
          endDate: params.endDate,
          branchCode: params.branchCode,
          userCode: params.userCode,
        },
      };

      const dataResponse = await postRequest(params.endpoint, JSON.stringify(payload));
      const raw =
        dataResponse && dataResponse.data && dataResponse.data[0] && dataResponse.data[0].result
          ? dataResponse.data[0].result
          : "{}";

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (e) {
        console.error("Failed to parse history result", e, raw);
        return { rootDataMap: {}, newTabConfigs: {}, rootKeys: [] };
      }

      let rootDataMap = {};
      if (Array.isArray(parsed)) {
        rootDataMap = parsed.reduce((acc, item) => {
          if (item && typeof item === "object" && !Array.isArray(item)) Object.assign(acc, item);
          return acc;
        }, {});
      } else if (parsed && typeof parsed === "object") {
        rootDataMap = parsed;
      }

      Object.keys(rootDataMap).forEach((k) => {
        const v = rootDataMap[k];
        if (v && typeof v === "object" && !Array.isArray(v) && Array.isArray(v.rows)) {
          rootDataMap[k] = v.rows;
        }
      });

      const rootKeys = Object.keys(rootDataMap);
      const newTabConfigs = {};
      for (const key of rootKeys) {
        newTabConfigs[key] = await getColumnConfig(key);
      }

      return { rootDataMap, newTabConfigs, rootKeys };
    },
    [getColumnConfig]
  );


  const {
    data: historyQueryData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: [
      "all-tran-history",
      {
        endpoint,
        startDate: appliedFilters.startDate,
        endDate: appliedFilters.endDate,
        branchCode: appliedFilters.branchCode,
        userCode: currentUserRow?.userCode,
      },
    ],
    queryFn: fetchHistoryData,
    enabled: Boolean(
      endpoint &&
        appliedFilters?.startDate &&
        appliedFilters?.endDate &&
        currentUserRow?.userCode
    ),
    staleTime: 1000 * 10,
    gcTime: 1000 * 60 * 30,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    placeholderData: (previousData) => previousData,
  });

  useEffect(() => {
    if (isActive && !wasActiveRef.current) {
      refetch();
    }
    wasActiveRef.current = isActive;
  }, [isActive, refetch]);

  const loading = isLoading;
  const refreshing = isFetching && !isLoading;

  /* ---------------- apply query result ---------------- */
  useEffect(() => {
    if (!historyQueryData) return;

    const { rootDataMap, newTabConfigs, rootKeys } = historyQueryData;

    setTabData(rootDataMap);
    setTabConfigs(newTabConfigs);

    const initialTabKey =
      (activeTabKeyProp && rootKeys.includes(activeTabKeyProp) && activeTabKeyProp) ||
      (navState.activeTabKey && rootKeys.includes(navState.activeTabKey) && navState.activeTabKey) ||
      rootKeys[0] ||
      null;

    const initialOrders = {};
    const initialGroups = {};
    const initialExpanded = {};
    const initialWidths = {};
    const initialHidden = {};

    rootKeys.forEach((key) => {
      const cols = (newTabConfigs[key] || []).length
        ? newTabConfigs[key].filter((c) => !c.hidden)
        : (rootDataMap[key]?.length
            ? Object.keys(rootDataMap[key][0]).map((k) => ({ key: k }))
            : []);

      initialOrders[key] = cols.map((c) => c.key);
      initialGroups[key] = [];
      initialExpanded[key] = {};
      initialWidths[key] = {};
      initialHidden[key] = [];
    });

    setColumnOrderByTab((prev) =>
      Object.keys(prev).length ? prev : initialOrders
    );
    setGroupByByTab((prev) =>
      Object.keys(prev).length ? prev : initialGroups
    );
    setExpandedGroupsByTab((prev) =>
      Object.keys(prev).length ? prev : initialExpanded
    );
    setColWidthsByTab((prev) =>
      Object.keys(prev).length ? prev : initialWidths
    );
    setUserHiddenColsByTab((prev) =>
      Object.keys(prev).length ? prev : initialHidden
    );

    setActiveTab((prev) => (prev && rootKeys.includes(prev) ? prev : initialTabKey));
    setSearchFields((prev) =>
      Object.keys(prev).length ? prev : prefillProp || navState.prefillSearchFields || {}
    );
    setSortConfig((prev) =>
      prev?.tabKey ? prev : { key: null, direction: "asc", tabKey: initialTabKey }
    );

    const cache = getGlobalCache();
    cache[baseKey] = {
      dates,
      dateRangeType,
      status,
      searchFields,
      tabData: rootDataMap,
      tabConfigs: newTabConfigs,
      activeTab: initialTabKey,
      branchCode,
      columnOrderByTab: Object.keys(columnOrderByTab).length ? columnOrderByTab : initialOrders,
      groupByByTab: Object.keys(groupByByTab).length ? groupByByTab : initialGroups,
      expandedGroupsByTab: Object.keys(expandedGroupsByTab).length
        ? expandedGroupsByTab
        : initialExpanded,
      colWidthsByTab: Object.keys(colWidthsByTab).length ? colWidthsByTab : initialWidths,
      userHiddenColsByTab: Object.keys(userHiddenColsByTab).length
        ? userHiddenColsByTab
        : initialHidden,
    };
    hydratedFromCacheRef.current = true;
  }, [
    historyQueryData,
    activeTabKeyProp,
    navState.activeTabKey,
    navState.prefillSearchFields,
    prefillProp,
    baseKey,
    dates,
    dateRangeType,
    status,
    searchFields,
    branchCode,
    columnOrderByTab,
    groupByByTab,
    expandedGroupsByTab,
    colWidthsByTab,
    userHiddenColsByTab,
  ]);


  /* ---------------- columns for a tab ---------------- */
  const getColumnsForTab = useCallback(
    (tabKey) => {
      const dataForTab = tabData[tabKey] || [];
      const configured = tabConfigs[tabKey] || [];
      if (configured.length > 0) return configured.filter((c) => !c.hidden);
      if (dataForTab.length === 0) return [];
      return Object.keys(dataForTab[0]).map((k) => ({
        key: k,
        label: k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        renderType: "text",
        sortable: true,
      }));
    },
    [tabData, tabConfigs]
  );

  const currentRows = tabData[activeTab] || [];
  const baseColumns = useMemo(() => getColumnsForTab(activeTab), [activeTab, getColumnsForTab]);

  useEffect(() => {
    if (!activeTab || !baseColumns.length) return;

    setColumnOrderByTab((prev) => {
      if (prev[activeTab]?.length) return prev;
      return {
        ...prev,
        [activeTab]: baseColumns.map((c) => c.key),
      };
    });

    setGroupByByTab((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab] || [],
    }));

    setExpandedGroupsByTab((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab] || {},
    }));

    setColWidthsByTab((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab] || {},
    }));

    setUserHiddenColsByTab((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab] || [],
    }));
  }, [activeTab, baseColumns]);

  const groupBy = groupByByTab[activeTab] || [];
  const expandedGroups = expandedGroupsByTab[activeTab] || {};
  const colWidths = colWidthsByTab[activeTab] || {};
  const userHiddenCols = userHiddenColsByTab[activeTab] || [];
  const columnOrder = columnOrderByTab[activeTab] || baseColumns.map((c) => c.key);

  const orderedCols = useMemo(() => {
    if (!baseColumns.length) return [];
    if (!columnOrder.length) return baseColumns;
    return columnOrder.map((key) => baseColumns.find((c) => c.key === key)).filter(Boolean);
  }, [baseColumns, columnOrder]);

  const visibleCols = useMemo(() => {
    return orderedCols.filter(
      (c) => !c.hidden && !userHiddenCols.includes(c.key) && !groupBy.includes(c.key)
    );
  }, [orderedCols, userHiddenCols, groupBy]);

  /* ---------------- filtered rows ---------------- */
  const filteredData = useMemo(() => {
    const base = currentRows.filter((row) =>
      Object.entries(searchFields).every(([key, value]) => {
        if (!value) return true;
        return String(row?.[key] ?? "")
          .toLowerCase()
          .includes(String(value).toLowerCase());
      })
    );

    const statusFiltered = (() => {
      if (status === "All") return base;
      const statusFieldCandidates = ["C", "doc_stat", "docStatus", "status", "stat"];
      return base.filter((row) => {
        const rowStatus =
          statusFieldCandidates
            .map((f) => (row[f] !== undefined ? String(row[f]) : undefined))
            .find((v) => v !== undefined) ?? "";
        return rowStatus === status;
      });
    })();

    if (!sortConfig.key || sortConfig.tabKey !== activeTab) return statusFiltered;

    const col = baseColumns.find((c) => c.key === sortConfig.key);
    const isNumeric = isNumericColumn(col);

    return [...statusFiltered].sort((a, b) => {
      const valA = a?.[sortConfig.key];
      const valB = b?.[sortConfig.key];

      if (isNumeric) {
        const numA = parseNumber(valA);
        const numB = parseNumber(valB);
        return sortConfig.direction === "asc" ? numA - numB : numB - numA;
      }

      const sA = String(valA ?? "");
      const sB = String(valB ?? "");
      return sortConfig.direction === "asc" ? sA.localeCompare(sB) : sB.localeCompare(sA);
    });
  }, [currentRows, searchFields, status, sortConfig, activeTab, baseColumns]);

  /* ---------------- grouping / totals helpers ---------------- */
  const totalExemptions = ["rate", "percent", "ratio", "id", "code"];

  const shouldSumColumn = useCallback((col) => {
    const noTotalKeys = ["unitcost", "currrate", "unitprice", "runbal"];
    if (!col) return false;

    const key = String(col.key ?? "").toLowerCase();
    const label = String(col.label ?? "").toLowerCase();

    if (noTotalKeys.includes(key)) return false;
    if (!isNumericColumn(col)) return false;
    if (totalExemptions.some((ex) => label.includes(ex) || key.includes(ex))) return false;

    return true;
  }, []);

  const calculateAggregates = useCallback(
    (rows) => {
      const sums = {};
      visibleCols.forEach((col) => {
        if (shouldSumColumn(col)) {
          sums[col.key] = rows.reduce((acc, curr) => acc + parseNumber(curr[col.key]), 0);
        }
      });
      return sums;
    },
    [visibleCols, shouldSumColumn]
  );

  const groupData = useCallback(
    (rows, level = 0) => {
      if (level >= groupBy.length) return rows.map((row) => ({ ...row }));

      const groupKey = groupBy[level];
      const groups = {};

      rows.forEach((row) => {
        const val = String(row[groupKey] ?? "(Blank)");
        if (!groups[val]) groups[val] = [];
        groups[val].push(row);
      });

      const result = [];
      Object.keys(groups)
        .sort()
        .forEach((key) => {
          result.push({
            isGroup: true,
            key: groupKey,
            value: key,
            level,
            children: groupData(groups[key], level + 1),
            count: groups[key].length,
            aggregates: calculateAggregates(groups[key]),
          });
        });

      return result;
    },
    [groupBy, calculateAggregates]
  );

  const processRenderList = useCallback(
    (nodes) => {
      let list = [];
      nodes.forEach((node) => {
        if (node.isGroup) {
          list.push(node);
          const uniqueId = `${node.key}-${node.value}-${node.level}`;
          if (expandedGroups[uniqueId]) {
            if (node.level === groupBy.length - 1) list = list.concat(node.children);
            else list = list.concat(processRenderList(node.children));

            list.push({
              isSubtotal: true,
              groupLabel: baseColumns.find((c) => c.key === node.key)?.label,
              groupValue: node.value,
              aggregates: node.aggregates,
              level: node.level,
            });
          }
        } else {
          list.push(node);
        }
      });
      return list;
    },
    [expandedGroups, groupBy.length, baseColumns]
  );

  const groupedStructure = useMemo(() => {
    if (groupBy.length === 0) return filteredData;
    return groupData(filteredData);
  }, [filteredData, groupBy, groupData]);

  const fullRenderRows = useMemo(() => {
    if (groupBy.length === 0) return filteredData;

    const expandAll = (nodes) => {
      let list = [];
      nodes.forEach((node) => {
        if (node.isGroup) {
          list.push(node);
          if (node.level === groupBy.length - 1) list = list.concat(node.children);
          else list = list.concat(expandAll(node.children));

          list.push({
            isSubtotal: true,
            groupLabel: baseColumns.find((c) => c.key === node.key)?.label,
            groupValue: node.value,
            aggregates: node.aggregates,
            level: node.level,
          });
        } else {
          list.push(node);
        }
      });
      return list;
    };

    return expandAll(groupedStructure);
  }, [groupBy.length, filteredData, groupedStructure, baseColumns]);

  const displayRows = useMemo(() => {
    if (groupBy.length === 0) return filteredData;
    return processRenderList(groupedStructure);
  }, [groupBy.length, filteredData, processRenderList, groupedStructure]);

  const grandTotals = useMemo(() => calculateAggregates(filteredData), [filteredData, calculateAggregates]);

  /* ---------------- handlers ---------------- */
  const handleSearchChange = (e, key) => {
    const { value } = e.target;
    setSearchFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc" && sortConfig.tabKey === activeTab) {
      direction = "desc";
    }
    setSortConfig({ key, direction, tabKey: activeTab });
  };

  const handleApplyFilter = useCallback(() => {
    if (!dates?.[0] || !dates?.[1]) return;

    const nextFilters = {
      startDate: format(dates[0], "yyyy-MM-dd"),
      endDate: format(dates[1], "yyyy-MM-dd"),
      branchCode,
    };

    const isSameFilter =
      appliedFilters?.startDate === nextFilters.startDate &&
      appliedFilters?.endDate === nextFilters.endDate &&
      appliedFilters?.branchCode === nextFilters.branchCode;

    if (isSameFilter) {
      refetch();
      return;
    }

    hydratedFromCacheRef.current = false;
    setSearchFields(prefillProp || navState.prefillSearchFields || {});
    setTabData({});
    setTabConfigs({});
    setActiveTab(null);
    setShowColumnChooser(false);
    setShowExportMenu(false);
    setGroupByByTab({});
    setExpandedGroupsByTab({});
    setColumnOrderByTab({});
    setColWidthsByTab({});
    setUserHiddenColsByTab({});
    setSortConfig({ key: null, direction: "asc", tabKey: null });

    setAppliedFilters(nextFilters);
  }, [
    dates,
    branchCode,
    appliedFilters,
    refetch,
    prefillProp,
    navState.prefillSearchFields,
  ]);

  const handleResetUI = () => {
    hydratedFromCacheRef.current = false;
    const today = new Date();
    const newDates = [subDays(today, 6), today];

    setDateRangeType("Last 7 Days");
    setDates(newDates);
    setSearchFields({});
    setStatus("All");
    setGroupByByTab((prev) => ({ ...prev, [activeTab]: [] }));
    setExpandedGroupsByTab((prev) => ({ ...prev, [activeTab]: {} }));
    setUserHiddenColsByTab((prev) => ({ ...prev, [activeTab]: [] }));
    setColWidthsByTab((prev) => ({ ...prev, [activeTab]: {} }));

    if (activeTab) {
      setColumnOrderByTab((prev) => ({
        ...prev,
        [activeTab]: baseColumns.map((c) => c.key),
      }));
    }

    setAppliedFilters({
      startDate: format(newDates[0], "yyyy-MM-dd"),
      endDate: format(newDates[1], "yyyy-MM-dd"),
      branchCode: branchCode || "",
    });

    refetch();
  };

  const getRowClassByStatus = (row) => {
    const statusFieldCandidates = ["C", "doc_stat", "docStatus", "status", "stat"];
    const rowStatus =
      statusFieldCandidates
        .map((f) => (row[f] !== undefined ? String(row[f]) : undefined))
        .find((v) => v !== undefined) ?? "";

    if (rowStatus === "X" || rowStatus === "C") return "text-red-600";
    if (rowStatus === "F") return "text-blue-700";
    return "";
  };

  const handleRowDoubleClick = useCallback(
    (row) => {
      const docNo = row?.docNo ?? row?.documentNo ?? row?.DOC_NO ?? "";
      const bcode = row?.branchCode ?? row?.BRANCH_CODE ?? "";
      if (!docNo || !bcode) return;

      if (typeof onRowDoubleClick === "function") {
        onRowDoubleClick({ ...row, docNo, branchCode: bcode });
      } else {
        navigate(backToPath, {
          state: { docNo, branchCode: bcode },
          replace: true,
        });
      }
    },
    [onRowDoubleClick, navigate, backToPath]
  );

  /* ---------------- column reorder / group / resize ---------------- */
  const handleColDragStart = (e, key) => {
    setDraggedCol(key);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleColDrop = (e, targetKey, isDropZone = false) => {
    e.preventDefault();
    if (!draggedCol || !activeTab) return;

    if (isDropZone) {
      if (!groupBy.includes(draggedCol)) {
        setGroupByByTab((prev) => ({
          ...prev,
          [activeTab]: [...(prev[activeTab] || []), draggedCol],
        }));
        setExpandedGroupsByTab((prev) => ({ ...prev, [activeTab]: {} }));
      }
    } else {
      if (groupBy.includes(draggedCol)) return;
      if (draggedCol === targetKey) return;

      const newOrder = [...columnOrder];
      const oldIdx = newOrder.indexOf(draggedCol);
      const newIdx = newOrder.indexOf(targetKey);

      if (oldIdx > -1 && newIdx > -1) {
        newOrder.splice(oldIdx, 1);
        newOrder.splice(newIdx, 0, draggedCol);
        setColumnOrderByTab((prev) => ({
          ...prev,
          [activeTab]: newOrder,
        }));
      }
    }

    setDraggedCol(null);
  };

  const toggleGroup = (node) => {
    const uniqueId = `${node.key}-${node.value}-${node.level}`;
    setExpandedGroupsByTab((prev) => ({
      ...prev,
      [activeTab]: {
        ...(prev[activeTab] || {}),
        [uniqueId]: !(prev[activeTab] || {})[uniqueId],
      },
    }));
  };

  const toggleAllGroups = (expand) => {
    if (!activeTab) return;
    if (!expand) {
      setExpandedGroupsByTab((prev) => ({ ...prev, [activeTab]: {} }));
      return;
    }

    const allKeys = {};
    const traverse = (nodes) => {
      nodes.forEach((n) => {
        if (n.isGroup) {
          allKeys[`${n.key}-${n.value}-${n.level}`] = true;
          if (Array.isArray(n.children) && n.children[0]?.isGroup) traverse(n.children);
        }
      });
    };
    traverse(groupedStructure);

    setExpandedGroupsByTab((prev) => ({
      ...prev,
      [activeTab]: allKeys,
    }));
  };

  const handleRemoveGroupedColumn = (gKey) => {
    if (!activeTab) return;

    const nextGroups = (groupByByTab[activeTab] || []).filter((k) => k !== gKey);

    if (nextGroups.length === 0) {
      setGroupByByTab((prev) => ({
        ...prev,
        [activeTab]: [],
      }));

      setExpandedGroupsByTab((prev) => ({
        ...prev,
        [activeTab]: {},
      }));

      setDraggedCol(null);
      return;
    }

    setGroupByByTab((prev) => ({
      ...prev,
      [activeTab]: nextGroups,
    }));

    setExpandedGroupsByTab((prev) => ({
      ...prev,
      [activeTab]: {},
    }));
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (!resizingRef.current || !activeTab) return;
      const { startX, startWidth, key } = resizingRef.current;
      const delta = e.clientX - startX;
      const newWidth = Math.max(60, startWidth + delta);

      setColWidthsByTab((prev) => ({
        ...prev,
        [activeTab]: {
          ...(prev[activeTab] || {}),
          [key]: newWidth,
        },
      }));
    },
    [activeTab]
  );

  const handleMouseUp = useCallback(() => {
    if (resizingRef.current) {
      resizingRef.current = null;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }
  }, [handleMouseMove]);

  const startResizing = (e, key) => {
    e.preventDefault();
    e.stopPropagation();
    const th = e.currentTarget?.parentElement;
    const currentWidth =
      th?.offsetWidth ||
      colWidths[key] ||
      Number(baseColumns.find((c) => c.key === key)?.width) ||
      120;

    resizingRef.current = {
      startX: e.clientX,
      startWidth: currentWidth,
      key,
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const stickyPlan = useMemo(() => {
    let left = ACTION_COL_WIDTH;
    const maxStickyCols = groupBy.length > 0 ? 1 : 0;

    return visibleCols.map((col, index) => {
      const resizedWidth = colWidths[col.key];
      const isSticky = index < maxStickyCols;

      if (isSticky) {
        const width = (resizedWidth ?? Number(col.width)) || 140;
        const meta = { sticky: true, left, width };
        left += width;
        return meta;
      }

      return { sticky: false, left: 0, width: resizedWidth || undefined };
    });
  }, [visibleCols, colWidths, groupBy.length]);

  /* ---------------- export helpers ---------------- */
  const tabToSheet = (tabKey) => {
    const cols = getColumnsForTab(tabKey).filter(
      (c) =>
        !(userHiddenColsByTab[tabKey] || []).includes(c.key) &&
        !((groupByByTab[tabKey] || []).includes(c.key))
    );

    const rows = (tabData[tabKey] || []).map((row) => {
      const obj = {};
      cols.forEach((col) => {
        const header = col.label || col.key;
        const val = formatCellValue(row[col.key], col);
        obj[header] = React.isValidElement(val) ? val.props?.children ?? "" : val;
      });
      return obj;
    });

    const sheetName = tabKey
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .slice(0, 31);

    return { sheetName, rows };
  };

  const buildJsonSheets = () => Object.keys(tabData || {}).map((tabKey) => tabToSheet(tabKey));

  function toTabbedJson(jsonSheets) {
    const data = {};
    for (const tab of jsonSheets || []) {
      const key = tab.sheetName || "Sheet";
      data[key] = Array.isArray(tab.rows) ? tab.rows : [];
    }
    return { Data: data };
  }

  const exportName =
    historyExportNameProp ??
    (location.state && location.state.historyExportName) ??
    "Transaction History";

  const getDateTimeStamp = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const mi = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    return `${yyyy}${mm}${dd}_${hh}${mi}${ss}`;
  };

  const handleExportExcel_All = async () => {
    const tabKeys = Object.keys(tabData || {});
    if (!tabKeys.length) {
      alert("No data to export. Please Apply Filter first.");
      return;
    }

    setExporting(true);
    try {
      const now = new Date();
      const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
      const timePart = now.toTimeString().slice(0, 8).replace(/:/g, "");
      const defaultFileName = `${exportName} ${datePart}_${timePart}`;

      const { value: fileName } = await Swal.fire({
        title: "Enter File Name",
        input: "text",
        inputLabel: "Export File Name:",
        inputValue: defaultFileName,
        width: "400px",
        showCancelButton: true,
        confirmButtonText: "Export",
        inputValidator: (value) => {
          if (!value || value.trim() === "") {
            return "File name cannot be empty!";
          }
        },
      });

      if (!fileName) return;

      const reportName = fileName;
      const start = dates?.[0] ? format(dates[0], "yyyy-MM-dd") : null;
      const end = dates?.[1] ? format(dates[1], "yyyy-MM-dd") : null;
      const sheets = buildJsonSheets();
      const jsonData = toTabbedJson(sheets);

      const payload = {
        ReportName: reportName,
        UserCode: currentUserRow?.USER_CODE || currentUserRow?.userCode || "",
        Branch: branchCode || "",
        StartDate: start,
        EndDate: end,
        JsonData: jsonData,
      };

      await exportHistoryExcel(
        "/exportHistoryReport",
        JSON.stringify(payload),
        setExporting,
        reportName
      );
    } catch (err) {
      console.error("Error exporting excel:", err);
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    if (!visibleCols.length || !filteredData.length) return;

    try {
      const activeTabFileName = activeTab
        ? `${activeTab.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} ${getDateTimeStamp()}`
        : `History ${getDateTimeStamp()}`;

      const { value: fileName } = await Swal.fire({
        title: "Enter File Name",
        input: "text",
        inputLabel: "Export File Name:",
        inputValue: activeTabFileName,
        width: "400px",
        showCancelButton: true,
        confirmButtonText: "Export",
        inputValidator: (value) => {
          if (!value || value.trim() === "") {
            return "File name cannot be empty!";
          }
        },
      });

      if (!fileName) return;

      const exportData = groupBy.length > 0 ? groupedStructure : filteredData;

      await exportGenericQueryExcel(
        exportData,
        grandTotals,
        visibleCols,
        groupBy,
        baseColumns,
        expandedGroups,
        7,
        fileName,
        currentUserRow?.userName,
        companyInfo?.compName,
        companyInfo?.compAddr,
        companyInfo?.telNo
      );
    } catch (err) {
      console.error("Error exporting Excel:", err);
    }
  };

  const handleExportCsv = async () => {
    if (!visibleCols.length || !filteredData.length) return;

    try {
      const defaultFileName = `${exportName} ${getDateTimeStamp()}`;
      const { value: fileName } = await Swal.fire({
        title: "Enter File Name",
        input: "text",
        inputLabel: "Export CSV File Name:",
        inputValue: defaultFileName,
        width: "400px",
        showCancelButton: true,
        confirmButtonText: "Export CSV",
        inputValidator: (value) => {
          if (!value || value.trim() === "") return "File name cannot be empty!";
        },
      });

      if (!fileName) return;

      const rowsToExport = filteredData;
      const headerRow = visibleCols
        .map((col) => {
          let header = String(col.label ?? "");
          header = header.replace(/,/g, "");
          header = header.toUpperCase().replace(/\s+/g, "_");
          return `"${header.replace(/"/g, '""')}"`;
        })
        .join(",");

      const csvLines = [headerRow];

      rowsToExport.forEach((row) => {
        const line = visibleCols
          .map((col) => {
            const formatted = formatCellValue(row[col.key], col);
            const noCommas = String(
              React.isValidElement(formatted) ? formatted.props?.children ?? "" : formatted ?? ""
            ).replace(/,/g, "");
            return `"${String(noCommas).replace(/"/g, '""')}"`;
          })
          .join(",");
        csvLines.push(line);
      });

      const blob = new Blob([csvLines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${fileName}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting CSV:", err);
    }
  };

  const handleExportPdf = async () => {
    if (!exportContainerRef.current || !displayRows.length) return;

    try {
      const canvas = await html2canvas(exportContainerRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");

      const defaultFileName = `${exportName} ${getDateTimeStamp()}`;
      const { value: fileName } = await Swal.fire({
        title: "Enter File Name",
        input: "text",
        inputLabel: "Export PDF File Name:",
        inputValue: defaultFileName,
        width: "400px",
        showCancelButton: true,
        confirmButtonText: "Export PDF",
        inputValidator: (value) => {
          if (!value || value.trim() === "") return "File name cannot be empty!";
        },
      });

      if (!fileName) return;

      const pdf = new jsPDF("l", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidthPx = canvas.width;
      const imgHeightPx = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidthPx, pdfHeight / imgHeightPx);
      const imgWidth = imgWidthPx * ratio;
      const imgHeight = imgHeightPx * ratio;
      const x = (pdfWidth - imgWidth) / 2;
      const y = 5;

      pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
      pdf.save(`${fileName}.pdf`);
    } catch (err) {
      console.error("Error exporting PDF:", err);
    }
  };

  const handleExportImage = async () => {
    if (!exportContainerRef.current || !displayRows.length) return;

    try {
      const canvas = await html2canvas(exportContainerRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");

      const defaultFileName = `${exportName} ${getDateTimeStamp()}`;
      const { value: fileName } = await Swal.fire({
        title: "Enter File Name",
        input: "text",
        inputLabel: "Export Image File Name:",
        inputValue: defaultFileName,
        width: "400px",
        showCancelButton: true,
        confirmButtonText: "Export Image",
        inputValidator: (value) => {
          if (!value || value.trim() === "") return "File name cannot be empty!";
        },
      });

      if (!fileName) return;

      const link = document.createElement("a");
      link.href = imgData;
      link.download = `${fileName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error exporting image:", err);
    }
  };

  const numberAlignClass = (col) =>
    isNumericColumn(col) || col?.classNames?.includes("text-right")
      ? "text-right tabular-nums"
      : "text-left";

  const commonCellClass = "px-2 py-1 border whitespace-nowrap";

  const allChooserKeys = visibleCols
    .concat(
      orderedCols.filter(
        (c) => !c.hidden && !groupBy.includes(c.key) && !visibleCols.some((vc) => vc.key === c.key)
      )
    )
    .map((c) => c.key);

  const allChecked = userHiddenCols.length === 0;

  return (
    <>
      {showHeader && (
        <>
          <Header
            activeTopTab="history"
            detailsRoute={backToPath}
            historyRoute="/page/AllTranHistory"
            showActions={false}
          />
          <HeaderSpacer />
        </>
      )}

      <div className="fixed top-[55px] left-0 w-full z-30 bg-white shadow-md dark:bg-gray-800">
        {showHeader && (
          <div className="flex flex-col md:flex-row items-center justify-between px-4 py-2 gap-2 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap justify-center md:justify-start gap-1 lg:gap-2 w-full md:w-auto">
              <button
                className={`flex items-center px-3 py-2 rounded-md text-xs md:text-sm font-bold transition-colors duration-200 group ${
                  location.pathname === "/"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : "text-gray-600 hover:bg-gray-100 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-blue-300"
                }`}
                onClick={() => navigate(backToPath)}
              >
                <FontAwesomeIcon icon={faPen} className="w-4 h-3 mr-2" />
                <span className="group-hover:block">Transaction Details</span>
              </button>
              <button
                className={`flex items-center px-3 py-2 rounded-md text-xs md:text-sm font-bold transition-colors duration-200 group ${
                  location.pathname === "/"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : "text-gray-600 hover:bg-gray-100 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-blue-300"
                }`}
                onClick={() => navigate(backToPath)}
              >
                <FontAwesomeIcon icon={faList} className="w-4 h-4 mr-2" />
                <span className="group-hover:block">Transaction History</span>
              </button>
            </div>
          </div>
        )}

        <style jsx="true">{`
          @keyframes fade-in-down {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fade-in-down {
            animation: fade-in-down 0.2s ease-out forwards;
          }
        `}</style>

        <div className="flex flex-col md:flex-row flex-wrap items-end gap-2 overflow-x-auto p-6 mt-8">
          <div className="flex-shrink-0 sm:min-w-[200px]">
            <label className="block text-sm font-semibold text-gray-600 mb-1">Date Range:</label>
            <div className="flex items-center border border-gray-300 rounded-md px-2 py-1 bg-white">
              <select
                className="border-none focus:ring-0 text-sm bg-transparent pr-2"
                value={dateRangeType}
                onChange={(e) => setDateRangeType(e.target.value)}
              >
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Custom Range</option>
              </select>

              <div className="flex items-center border-l border-gray-300 pl-2 min-w-[200px]">
                <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400 mr-2 flex-shrink-0" />
                <input
                  type="text"
                  value={formatDateRange(dates[0], dates[1])}
                  onClick={() => {
                    if (dateRangeType === "Custom Range") setModalIsOpen(true);
                  }}
                  className="w-full min-w-0 h-[25px] border-none focus:ring-0 text-sm bg-transparent text-gray-700 tabular-nums whitespace-nowrap pr-2"
                  placeholder="Select date range"
                  readOnly
                  title={formatDateRange(dates[0], dates[1])}
                />
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 min-w-[200px]">
            <label className="block text-sm font-semibold text-gray-600 mb-1">Status:</label>
            <div className="flex items-center border border-gray-300 rounded-md px-2 py-1 bg-white">
              <FontAwesomeIcon icon={faFilter} className="text-gray-400 mr-2" />
              <select
                className="w-full h-[25px] border-none focus:ring-0 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {statusOptions.map((opt) => (
                  <option key={String(opt.value)} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-shrink-0 w-full md:w-auto mt-auto">
            <button
              className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-700 shadow-md w-full"
              onClick={handleApplyFilter}
              disabled={loading || exporting}
            >
              <FontAwesomeIcon icon={faFilter} className="mr-2" />
              {loading ? "Loading..." : "Filter"}
            </button>
          </div>

          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 w-full md:w-auto ml-auto">
            <button
              className="flex items-center justify-center bg-green-600 text-white px-6 py-2 rounded-md text-sm font-semibold hover:bg-green-700 shadow-md w-full"
              onClick={handleExportExcel_All}
              disabled={loading || exporting || !filteredData.length}
            >
              <FontAwesomeIcon icon={faDownload} className="mr-2" />
              <span className="truncate">{exporting ? "Exporting..." : "Export"}</span>
            </button>
            <button
              className="flex items-center justify-center bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-semibold hover:bg-blue-700 shadow-md w-full"
              onClick={handleResetUI}
              disabled={loading || exporting}
            >
              <FontAwesomeIcon icon={faRedo} className="mr-2" />
              <span className="truncate">Reset</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto px-4">

       {Object.keys(tabData).map((tabKey) => {
              const isTabActive = activeTab === tabKey;
              return (
                <button
                  key={tabKey}
                  className={`py-2 px-10 text-sm border rounded-t-lg transition-all duration-200 ${
                    isTabActive
                      ? "bg-blue-100 text-blue-700 font-semibold shadow-lg shadow-blue-300 relative before:absolute before:inset-x-0 before:bottom-0 before:h-[3px] before:bg-blue-700 before:rounded-t-md"
                      : "bg-white shadow-lg shadow-blue-50 text-gray-600 font-semibold hover:text-blue-700 hover:bg-blue-50"
                  }`}
                  onClick={() => {
                    setActiveTab(tabKey);
                    setSortConfig({ key: null, direction: "asc", tabKey });
                    setShowColumnChooser(false);
                    setShowExportMenu(false);
                  }}
                >
                  {tabKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </button>
              );
            })}         


        </div>

        <div className="bg-white shadow-md rounded-md overflow-hidden p-4">
          {activeTab && visibleCols.length > 0 && filteredData.length > 0 && (
            <div
              className="p-2 bg-gray-50 border flex flex-wrap gap-2 items-center min-h-[45px] shrink-0 mb-3"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleColDrop(e, null, true)}
            >
              <div className="flex-1 flex flex-wrap gap-2 items-center">
                <div className="text-xs font-bold text-gray-500 flex items-center">
                  <FontAwesomeIcon icon={faLayerGroup} className="mr-2" />
                  Group By:
                </div>

                {groupBy.length === 0 && (
                  <div className="text-xs text-gray-400 italic border border-dashed border-gray-300 rounded px-3 py-1">
                    Drag Header Here...
                  </div>
                )}

                {groupBy.map((gKey) => (
                  <div
                    key={gKey}
                    className="flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded border border-blue-200"
                  >
                    <span>{baseColumns.find((c) => c.key === gKey)?.label}</span>
                    <button
                      onClick={() => handleRemoveGroupedColumn(gKey)}
                      className="ml-2 text-blue-500 hover:text-red-500"
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                {groupBy.length > 0 && (
                  <>
                    <button
                      onClick={() => toggleAllGroups(true)}
                      className="text-xs bg-white border px-2 py-1 rounded hover:bg-gray-100"
                      title="Expand All"
                    >
                      <FontAwesomeIcon icon={faExpandArrowsAlt} /> Expand
                    </button>

                    <button
                      onClick={() => toggleAllGroups(false)}
                      className="text-xs bg-white border px-2 py-1 rounded hover:bg-gray-100"
                      title="Collapse All"
                    >
                      <FontAwesomeIcon icon={faCompressArrowsAlt} /> Collapse
                    </button>

                    <button
                      onClick={() => {
                        setGroupByByTab((prev) => ({ ...prev, [activeTab]: [] }));
                        setExpandedGroupsByTab((prev) => ({ ...prev, [activeTab]: {} }));
                      }}
                      className="text-xs bg-white border px-2 py-1 rounded hover:bg-gray-100"
                      title="Remove All Groups"
                    >
                      <FontAwesomeIcon icon={faTimes} className="text-red-600 mr-1" />
                      Remove
                    </button>
                  </>
                )}

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => filteredData.length && setShowExportMenu((prev) => !prev)}
                    disabled={!filteredData.length}
                    className="text-xs bg-white border px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-50"
                    title="Export options"
                  >
                    <FontAwesomeIcon icon={faFileExport} className="text-blue-600 mr-1" />
                    Export
                  </button>

                  {showExportMenu && (
                    <div
                      className="absolute right-0 mt-1 bg-white border rounded shadow-lg p-2 z-50 min-w-[180px]"
                      onMouseLeave={() => setShowExportMenu(false)}
                    >
                      <div className="text-[11px] font-semibold mb-1 border-b pb-1">Export Options</div>

                      <button
                        type="button"
                        onClick={async () => {
                          setShowExportMenu(false);
                          await handleExportExcel();
                        }}
                        className="w-full text-left text-[11px] px-2 py-1 rounded hover:bg-gray-100 flex items-center gap-2"
                      >
                        <FontAwesomeIcon icon={faFileExcel} className="text-green-600" />
                        Excel
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          setShowExportMenu(false);
                          await handleExportCsv();
                        }}
                        className="w-full text-left text-[11px] px-2 py-1 rounded hover:bg-gray-100 flex items-center gap-2"
                      >
                        <FontAwesomeIcon icon={faFileCsv} className="text-emerald-600" />
                        CSV
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          setShowExportMenu(false);
                          await handleExportPdf();
                        }}
                        className="w-full text-left text-[11px] px-2 py-1 rounded hover:bg-gray-100 flex items-center gap-2"
                      >
                        <FontAwesomeIcon icon={faFilePdf} className="text-red-600" />
                        PDF
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          setShowExportMenu(false);
                          await handleExportImage();
                        }}
                        className="w-full text-left text-[11px] px-2 py-1 rounded hover:bg-gray-100 flex items-center gap-2"
                      >
                        <FontAwesomeIcon icon={faFileImage} className="text-blue-600" />
                        Image
                      </button>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowColumnChooser((prev) => !prev)}
                    className="text-xs bg-white border px-2 py-1 rounded hover:bg-gray-100"
                  >
                    <FontAwesomeIcon icon={faColumns} className="text-green-600" /> Columns
                  </button>

                  {showColumnChooser && (
                    <div
                      className="absolute right-0 mt-1 bg-white border rounded shadow-lg p-2 max-h-64 overflow-auto z-50 min-w-[220px]"
                      onMouseLeave={() => setShowColumnChooser(false)}
                    >
                      <div className="flex items-center justify-between text-[11px] font-semibold mb-1 border-b pb-1">
                        <span>Show / Hide Columns</span>
                        <label className="flex items-center gap-1 text-[11px]">
                          <input
                            type="checkbox"
                            className="h-3 w-3"
                            checked={allChecked}
                            onChange={() => {
                              setUserHiddenColsByTab((prev) => ({
                                ...prev,
                                [activeTab]: allChecked ? allChooserKeys : [],
                              }));
                            }}
                          />
                          <span>Select All</span>
                        </label>
                      </div>

                      {orderedCols
                        .filter((col) => !col.hidden && !groupBy.includes(col.key))
                        .map((col) => (
                          <label key={col.key} className="flex items-center text-[11px] gap-2 mb-1">
                            <input
                              type="checkbox"
                              className="h-3 w-3"
                              checked={!userHiddenCols.includes(col.key)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setUserHiddenColsByTab((prev) => {
                                  const current = prev[activeTab] || [];
                                  return {
                                    ...prev,
                                    [activeTab]: checked
                                      ? current.filter((k) => k !== col.key)
                                      : [...current, col.key],
                                  };
                                });
                              }}
                            />
                            <span className="truncate">{col.label}</span>
                          </label>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div
            ref={tableScrollRef}
            className="overflow-x-auto bg-white rounded-md max-h-[55vh] relative"
          >
            {loading ? (
              <div className="text-center py-6 text-gray-500">Loading data and configurations...</div>
            ) : !activeTab || visibleCols.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                Select a date range and click ‘Filter’ to load history.
              </div>
            ) : (
              <>
                {refreshing && (
                  <div className="mb-2 text-xs text-blue-600 font-medium">
                    Refreshing latest transactions...
                  </div>
                )}

                <table className="min-w-[1200px] text-[12px] text-center border-collapse border border-gray-300 table-fixed">
                  <thead className="text-[12px] font-medium sticky top-0 z-30">
                    <tr className="bg-blue-700 text-white">
                      <th
                        className="sticky left-0 top-0 z-50 px-2 py-2 border-r border-blue-800 bg-blue-700 w-[64px]"
                        style={{ minWidth: ACTION_COL_WIDTH, maxWidth: ACTION_COL_WIDTH }}
                      >
                        View
                      </th>

                      {visibleCols.map((col, i) => {
                        const meta = stickyPlan[i];
                        const style = meta.sticky
                          ? {
                              left: meta.left,
                              width: meta.width || 140,
                              minWidth: meta.width || 140,
                              maxWidth: meta.width || 400,
                            }
                          : {
                              width: meta.width || undefined,
                              minWidth: meta.width || undefined,
                              maxWidth: 400,
                            };

                        return (
                          <th
                            key={col.key}
                            draggable={!groupBy.includes(col.key)}
                            onDragStart={(e) => handleColDragStart(e, col.key)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleColDrop(e, col.key)}
                            onClick={() => col.sortable !== false && handleSort(col.key)}
                            className={`px-3 py-2 border whitespace-nowrap select-none relative ${
                              col.sortable !== false ? "cursor-pointer" : ""
                            } ${meta.sticky ? "sticky z-40 bg-blue-700" : ""} ${numberAlignClass(col)}`}
                            style={style}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="truncate">{col.label}</span>
                              {col.sortable !== false &&
                              sortConfig.key === col.key &&
                              sortConfig.tabKey === activeTab ? (
                                <FontAwesomeIcon
                                  icon={sortConfig.direction === "asc" ? faArrowUp : faArrowDown}
                                  className="text-xs"
                                />
                              ) : null}
                            </div>

                            <div
                              className="absolute top-0 right-0 h-full w-1 cursor-col-resize select-none"
                              onMouseDown={(e) => startResizing(e, col.key)}
                            />
                          </th>
                        );
                      })}
                    </tr>

                    <tr className="bg-gray-100 sticky top-[36px] z-20">
                      <td className="sticky left-0 z-40 px-2 py-1 border bg-gray-100" />
                      {visibleCols.map((col, i) => {
                        const meta = stickyPlan[i];
                        const style = meta.sticky
                          ? {
                              left: meta.left,
                              width: meta.width || undefined,
                              minWidth: meta.width || undefined,
                            }
                          : {
                              width: meta.width || undefined,
                              minWidth: meta.width || undefined,
                            };

                        return (
                          <td
                            key={col.key}
                            className={`px-2 py-1 border whitespace-nowrap ${
                              meta.sticky ? "sticky z-30 bg-gray-100" : ""
                            }`}
                            style={style}
                          >
                            <input
                              type="text"
                              value={searchFields[col.key] || ""}
                              onChange={(e) => handleSearchChange(e, col.key)}
                              placeholder="Filter"
                              className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 text-[10px]"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 text-[11px]">
                    {displayRows.length > 0 ? (
                      <>
                        {displayRows.map((row, idx) => {
                          if (groupBy.length > 0 && row.isGroup) {
                            const uniqueId = `${row.key}-${row.value}-${row.level}`;
                            const isExpanded = expandedGroups[uniqueId];
                            return (
                              <tr
                                key={`g-${uniqueId}`}
                                className="bg-gray-100 hover:bg-gray-200 cursor-pointer"
                                onClick={() => toggleGroup(row)}
                              >
                                <td
                                  colSpan={visibleCols.length + 1}
                                  className="px-2 py-2 font-semibold border-b border-gray-300 text-blue-900 whitespace-nowrap"
                                >
                                  <div className="flex items-center" style={{ paddingLeft: row.level * 20 }}>
                                    <FontAwesomeIcon
                                      icon={isExpanded ? faChevronDown : faChevronRight}
                                      className="w-3 h-3 mr-2 text-gray-500"
                                    />
                                    <span className="mr-2 text-gray-600">
                                      {baseColumns.find((c) => c.key === row.key)?.label}:
                                    </span>
                                    <span className="mr-2 font-bold">{row.value}</span>
                                    <span className="bg-blue-200 text-blue-800 text-[9px] px-1.5 rounded-full">
                                      {row.count}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          if (groupBy.length > 0 && row.isSubtotal) {
                            return (
                              <tr
                                key={`sub-${row.groupValue}-${idx}`}
                                className="bg-yellow-50 font-bold border-b border-gray-300"
                              >
                                <td className="sticky left-0 bg-yellow-50 border-r border-gray-300 z-10" />
                                {visibleCols.map((col, i) => {
                                  const meta = stickyPlan[i];
                                  const val = row.aggregates[col.key];
                                  const style = meta.sticky
                                    ? {
                                        left: meta.left,
                                        width: meta.width || undefined,
                                        minWidth: meta.width || undefined,
                                      }
                                    : {
                                        width: meta.width || undefined,
                                        minWidth: meta.width || undefined,
                                      };

                                  return (
                                    <td
                                      key={col.key}
                                      className={`${commonCellClass} ${numberAlignClass(col)} ${
                                        meta.sticky ? "sticky z-10 bg-yellow-50" : ""
                                      }`}
                                      style={style}
                                    >
                                      {i === 0 && (
                                        <div
                                          className="float-left text-left font-bold"
                                          style={{ paddingLeft: row.level * 20 }}
                                        >
                                          <span className="text-gray-600">Sub Total for {row.groupLabel}:</span>
                                          <span className="ml-1 text-blue-900">{row.groupValue}</span>
                                        </div>
                                      )}
                                      {val !== undefined ? formatCellValue(val, col) : ""}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          }

                          const rowClass = getRowClassByStatus(row);
                          return (
                            <tr
                              key={idx}
                              className={`hover:bg-blue-50 transition cursor-pointer ${rowClass} ${
                                idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                              }`}
                              onDoubleClick={() => handleRowDoubleClick(row)}
                            >
                              <td className="sticky left-0 z-10 px-2 py-1 border-r border-gray-200 bg-inherit text-center w-[64px] min-w-[64px]">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRowDoubleClick(row);
                                  }}
                                  className="px-2 py-0.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                                  title="View"
                                >
                                  <FontAwesomeIcon icon={faEye} className="w-4 h-3" />
                                </button>
                              </td>

                              {visibleCols.map((col, i) => {
                                const meta = stickyPlan[i];
                                const alignRight =
                                  isNumericColumn(col) || col.classNames?.includes("text-right");
                                const style = meta.sticky
                                  ? {
                                      left: meta.left,
                                      width: meta.width || undefined,
                                      minWidth: meta.width || undefined,
                                      maxWidth: 400,
                                    }
                                  : {
                                      width: meta.width || undefined,
                                      minWidth: meta.width || undefined,
                                      maxWidth: 400,
                                    };

                                return (
                                  <td
                                    key={col.key}
                                    className={`px-2 py-1 border whitespace-nowrap ${
                                      alignRight ? "text-right" : col.classNames || "text-left"
                                    } ${meta.sticky ? "sticky z-10 bg-inherit" : ""}`}
                                    title={String(row?.[col.key] ?? "")}
                                    style={style}
                                  >
                                    <div
                                      style={{
                                        maxWidth: "300px",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {formatCellValue(row?.[col.key], col)}
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </>
                    ) : (
                      <tr>
                        <td colSpan={visibleCols.length + 1} className="text-center text-gray-500 py-4 border">
                          No records found matching the filter criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>

                  {filteredData.length > 0 && (
                    <tfoot className="sticky bottom-0 z-30 shadow-[0_-4px_6px_rgba(0,0,0,0.1)] text-[11px]">
                      <tr className="bg-gray-100 font-bold border-t border-blue-400">
                        <td className="sticky left-0 bg-gray-100 border-r border-gray-300 z-40" />
                        {visibleCols.map((col, i) => {
                          const meta = stickyPlan[i];
                          const val = grandTotals[col.key];
                          const style = meta.sticky
                            ? {
                                left: meta.left,
                                width: meta.width || undefined,
                                minWidth: meta.width || undefined,
                              }
                            : {
                                width: meta.width || undefined,
                                minWidth: meta.width || undefined,
                              };

                          return (
                            <td
                              key={col.key}
                              className={`px-2 py-1 border ${numberAlignClass(col)} ${
                                meta.sticky ? "sticky z-30 bg-gray-100" : ""
                              }`}
                              style={style}
                            >
                              {i === 0 && (
                                <span className="text-gray-700 uppercase tracking-wide">
                                  {groupBy.length > 0 ? "Grand Total" : "Total"}
                                </span>
                              )}
                              {val !== undefined ? formatCellValue(val, col) : ""}
                            </td>
                          );
                        })}
                      </tr>
                    </tfoot>
                  )}
                </table>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hidden export table */}
      {activeTab && filteredData.length > 0 && (
        <div ref={exportContainerRef} style={{ position: "absolute", left: "-99999px", top: 0 }}>
          <table className="border-collapse text-[8px]">
            <thead>
              <tr>
                {visibleCols.map((col) => (
                  <th
                    key={col.key}
                    className="border px-2 py-1 text-left bg-gray-200 align-top"
                    style={{ maxWidth: 150, whiteSpace: "normal", wordBreak: "break-word" }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {(groupBy.length === 0 ? filteredData : fullRenderRows).map((row, idx) => {
                if (groupBy.length > 0 && row.isGroup) {
                  return (
                    <tr key={`exp-g-${row.key}-${row.value}-${row.level}-${idx}`}>
                      <td
                        colSpan={visibleCols.length}
                        className="border px-2 py-1 font-semibold bg-gray-100"
                        style={{ whiteSpace: "normal", wordBreak: "break-word" }}
                      >
                        {baseColumns.find((c) => c.key === row.key)?.label}: {row.value} ({row.count})
                      </td>
                    </tr>
                  );
                }

                if (groupBy.length > 0 && row.isSubtotal) {
                  return (
                    <tr key={`exp-sub-${row.groupValue}-${idx}`}>
                      {visibleCols.map((col, i) => {
                        const val = row.aggregates[col.key];
                        return (
                          <td
                            key={col.key}
                            className="border px-2 py-1 font-semibold bg-yellow-50 align-top"
                            style={{ maxWidth: 150, whiteSpace: "normal", wordBreak: "break-word" }}
                          >
                            {i === 0 && (
                              <>
                                Sub Total for {row.groupLabel}: {row.groupValue}{" "}
                              </>
                            )}
                            {val !== undefined ? formatCellValue(val, col) : ""}
                          </td>
                        );
                      })}
                    </tr>
                  );
                }

                return (
                  <tr key={`exp-row-${idx}`}>
                    {visibleCols.map((col) => (
                      <td
                        key={col.key}
                        className="border px-2 py-1 align-top"
                        style={{ maxWidth: 150, whiteSpace: "normal", wordBreak: "break-word" }}
                      >
                        {formatCellValue(row[col.key], col)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>

            <tfoot>
              <tr>
                {visibleCols.map((col, i) => (
                  <td
                    key={col.key}
                    className="border px-2 py-1 font-bold bg-gray-100 align-top"
                    style={{ maxWidth: 150, whiteSpace: "normal", wordBreak: "break-word" }}
                  >
                    {i === 0 && (groupBy.length > 0 ? "Grand Total" : "Total")}
                    {grandTotals[col.key] !== undefined ? ` ${formatCellValue(grandTotals[col.key], col)}` : ""}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Date Picker Modal */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        closeTimeoutMS={150}
        className="w-[min(100vw,500px)] sm:w-[min(100vw,500px)] h-[90vh] sm:h-auto sm:max-h-[80vh] mx-auto sm:mt-4 rounded-none sm:rounded-2xl shadow-2xl bg-white overflow-hidden outline-none"
        overlayClassName="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50"
      >
        <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3">
          <h2 className="text-base font-semibold">Select Custom Date Range</h2>
          <p className="text-xs/relaxed text-white/80">
            Choose a range or use quick presets. Press{" "}
            <kbd className="px-1.5 py-0.5 bg-white/20 rounded">Esc</kbd> to cancel.
          </p>
          <button
            onClick={() => setModalIsOpen(false)}
            className="absolute right-3 top-3 grid place-items-center w-8 h-8 rounded-full hover:bg-white/15 focus:ring-2 focus:ring-white/60"
            aria-label="Close"
            title="Close"
          >
            <svg viewBox="0 0 20 20" className="w-4 h-4">
              <path
                fill="currentColor"
                d="M11.41 10l4.3-4.29a1 1 0 10-1.42-1.42L10 8.59 5.71 4.29a1 1 0 10-1.42 1.42L8.59 10l-4.3 4.29a1 1 0 101.42 1.42L10 11.41l4.29 4.3a1 1 0 001.42-1.42z"
              />
            </svg>
          </button>
        </div>

        <div className="p-2 sm:p-2 grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-2 h-[calc(90vh-120px)] sm:h-auto overflow-auto">
          <div className="space-y-1 mt-2">
            <div className="grid grid-cols-2 sm:grid-cols-1 gap-1">
              <button className="btn-outline text-sm hover:bg-blue-100" onClick={() => { const t = new Date(); setDates([t, t]); }}>Today</button>
              <button className="btn-outline text-sm hover:bg-blue-100" onClick={() => { const t = new Date(); const y = new Date(t); y.setDate(t.getDate() - 1); setDates([y, y]); }}>Yesterday</button>
              <button className="btn-outline text-sm hover:bg-blue-100" onClick={() => { const t = new Date(); setDates([subDays(t, 6), t]); }}>Last 7 Days</button>
              <button className="btn-outline text-sm hover:bg-blue-100" onClick={() => { const t = new Date(); setDates([subDays(t, 29), t]); }}>Last 30 Days</button>
              <button className="btn-outline text-sm hover:bg-blue-100" onClick={() => { const t = new Date(); setDates([startOfMonth(t), endOfMonth(t)]); }}>This Month</button>
              <button className="btn-outline text-sm hover:bg-blue-100" onClick={() => { const t = new Date(); const last = addMonths(t, -1); setDates([startOfMonth(last), endOfMonth(last)]); }}>Last Month</button>
              <button className="btn-outline text-sm hover:bg-blue-100" onClick={() => { const t = new Date(); setDates([startOfYear(t), endOfYear(t)]); }}>YTD</button>
              <button className="btn-ghost text-sm hover:bg-blue-100" onClick={() => setDates([null, null])} title="Clear selection">Clear</button>
            </div>

            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-600">
              <div className="font-semibold text-slate-700 mb-1">Selected Range</div>
              {dates?.[0] && dates?.[1] ? (
                <div>{format(dates[0], "MMM dd, yyyy")} — {format(dates[1], "MMM dd, yyyy")}</div>
              ) : (
                <div className="italic text-slate-400">No range selected</div>
              )}
              {granularity !== "day" && (
                <div className="mt-1 text-[11px] text-slate-500">
                  Mode: <span className="uppercase">{granularity}</span> (one tap selects entire {granularity})
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-2 sm:p-2">
            <div className="flex items-center gap-1 mb-2">
              <span className="text-xs text-slate-500 mr-1">Select by:</span>
              <div className="inline-flex rounded-lg border border-slate-300 overflow-hidden">
                {["day", "month", "year"].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGranularity(g)}
                    className={`px-3 py-1.5 text-xs capitalize ${
                      granularity === g ? "bg-blue-600 text-white" : "bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="reactdp-one">
              <DatePicker
                inline
                fixedHeight
                monthsShown={1}
                shouldCloseOnSelect={false}
                selectsRange={granularity === "day"}
                startDate={dates[0]}
                endDate={dates[1]}
                onChange={(update) => {
                  if (granularity === "day") setDates(update);
                }}
                onSelect={(d) => {
                  if (!d) return;
                  if (granularity === "month") setDates([startOfMonth(d), endOfMonth(d)]);
                  else if (granularity === "year") setDates([startOfYear(d), endOfYear(d)]);
                }}
                openToDate={dates?.[1] ?? dates?.[0] ?? new Date()}
                renderCustomHeader={({
                  date,
                  decreaseMonth,
                  increaseMonth,
                  prevMonthButtonDisabled,
                  nextMonthButtonDisabled,
                  changeYear,
                  changeMonth,
                }) => {
                  const months = [
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                  ];
                  const currentYear = new Date().getFullYear();
                  const years = Array.from({ length: 16 }, (_, i) => currentYear + 1 - i);

                  return (
                    <div className="flex items-center justify-between gap-2 px-2 py-1">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={decreaseMonth}
                          disabled={prevMonthButtonDisabled}
                          className="px-2 py-1 rounded-md hover:bg-slate-100 disabled:opacity-40"
                          title="Previous month"
                          type="button"
                        >
                          ‹
                        </button>
                        <button
                          onClick={increaseMonth}
                          disabled={nextMonthButtonDisabled}
                          className="px-2 py-1 rounded-md hover:bg-slate-100 disabled:opacity-40"
                          title="Next month"
                          type="button"
                        >
                          ›
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          className="text-sm border border-slate-300 rounded-md px-2 py-1 bg-white"
                          value={date.getMonth()}
                          onChange={(e) => changeMonth(Number(e.target.value))}
                        >
                          {months.map((m, idx) => (
                            <option key={m} value={idx}>{m}</option>
                          ))}
                        </select>

                        <select
                          className="text-sm border border-slate-300 rounded-md px-2 py-1 bg-white"
                          value={date.getFullYear()}
                          onChange={(e) => changeYear(Number(e.target.value))}
                        >
                          {years.map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                }}
              />
            </div>
          </div>

          <style jsx="true">{`
            .reactdp-one .react-datepicker__header {
              padding-top: 6px;
            }
          `}</style>
        </div>

        <div className="sticky bottom-0 flex items-center justify-between gap-2 px-4 sm:px-5 py-3 bg-white/95 border-t border-slate-200">
          <div className="text-[11px] text-slate-500">
            Tip: Press <kbd className="px-1 py-0.5 bg-slate-100 rounded">Enter</kbd> to apply.
          </div>
          <div className="flex gap-2">
            <button onClick={() => setModalIsOpen(false)} className="px-4 py-2 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm">
              Cancel
            </button>
            <button
              onClick={() => { if (dates?.[0] && dates?.[1]) setModalIsOpen(false); }}
              disabled={!dates?.[0] || !dates?.[1]}
              className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium enabled:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply
            </button>
          </div>
        </div>

        <style jsx="true">{`
          .btn-outline {
            @apply text-slate-700 border border-slate-300 rounded-md px-1 py-1 text-xs sm:text-xs hover:bg-slate-100 text-left;
            min-height: 30px;
          }
          .btn-ghost {
            @apply text-slate-600 rounded-md px-1 py-1 text-xs sm:text-xs hover:bg-slate-100 text-left;
            min-height: 30px;
          }
          .reactdp-row .react-datepicker {
            display: flex !important;
            flex-wrap: nowrap;
            gap: 8px;
          }
          .reactdp-row .react-datepicker__month-container {
            flex: 0 0 auto;
            width: 290px;
          }
          .reactdp-row .react-datepicker__header {
            padding-top: 6px;
          }
          @media (min-width: 640px) {
            .reactdp-row .react-datepicker__month-container {
              width: 300px;
            }
          }
        `}</style>
      </Modal>

      {(loading || exporting) && <LoadingSpinner />}
    </>
  );
};

export default AllTranHistory;