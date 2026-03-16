// import { useEffect, useRef, useState } from "react";
// import { apiClient } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";
// import { useAuth } from "@/NAYSA Cloud/Authentication/AuthContext.jsx";

// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import {
//   faPlus, faPrint, faChevronDown, faInfoCircle, faSpinner,
//   faFileCsv, faFileExcel, faFilePdf, faVideo, faSave, faUndo, faUsers, faShield, faKey,
//   faUserShield, faCheck, faEye
// } from "@fortawesome/free-solid-svg-icons";

// // Global
// import { useReset } from "../Components/ResetContext";
// import {
//   reftables,
//   reftablesPDFGuide,
//   reftablesVideoGuide,
// } from "@/NAYSA Cloud/Global/reftable";

// // Import SweetAlert utilities from behavior.js
// import {
//   useSwalInfoAlert,
// } from "@/NAYSA Cloud/Global/behavior";

// // Exports
// import * as XLSX from "xlsx";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";

// // Import tab components
// import UsersTab from "./UserAccessRightsTabs/UsersTab";
// import RolesTab from "./UserAccessRightsTabs/RolesTab";
// import RoleAccessTab from "./UserAccessRightsTabs/RoleAccessTab";
// import UserRoleTab from "./UserAccessRightsTabs/UserRoleTab";


// const UserAccessRights = () => {
//   const docType = "UserAccRight";
//   const { user } = useAuth();
//   const documentTitle = reftables[docType];
//   const pdfLink = reftablesPDFGuide[docType];
//   const videoLink = reftablesVideoGuide[docType];
//   const usersTabRef = useRef(null);
//   const rolesTabRef = useRef(null);
//   const roleAccessTabRef = useRef(null);
//   const userAccessTabRef = useRef(null);

//   const [activeTab, setActiveTab] = useState("userRoles");

//   const [roles, setRoles] = useState([]);
//   const [users, setUsers] = useState([]);
//   const [appliedUserRoles, setAppliedUserRoles] = useState(new Set());

//   // UX state
//   const [loading, setLoading] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [isOpenExport, setOpenExport] = useState(false);
//   const [isOpenGuide, setOpenGuide] = useState(false);
//   const [showSpinner, setShowSpinner] = useState(false);

//   // Refs for click-away
//   const exportRef = useRef(null);
//   const guideRef = useRef(null);

//   // Loading spinner component
//   const LoadingSpinner = () => (
//     <div className="global-tran-spinner-main-div-ui">
//       <div className="global-tran-spinner-sub-div-ui">
//         <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-blue-500 mb-2" />
//         <p>Please wait...</p>
//       </div>
//     </div>
//   );

//   // Fetch roles 
//   const fetchRoles = async () => {
//     setLoading(true);
//     try {
//       const { data } = await apiClient.get("/role");
//       const roleData =
//         Array.isArray(data?.data) && data.data[0]?.result
//           ? JSON.parse(data.data[0].result)
//           : [];
//       setRoles(roleData);
//     } catch (error) {
//       console.error("Error fetching roles:", error);
//       setRoles([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchUsers = async () => {
//     setLoading(true);
//     try {
//       const response = await apiClient.get("/load", { params: { Status: "Active" } });
//       const { data } = response;

//       let userData = [];
//       if (Array.isArray(data?.data) && data.data[0]?.result) {
//         try {
//           const resultData = typeof data.data[0].result === 'string'
//             ? JSON.parse(data.data[0].result)
//             : data.data[0].result;

//           if (Array.isArray(resultData)) {
//             userData = resultData.filter(u => u.userCode || u.userName || u.userType);
//           }
//         } catch (parseError) {
//           console.error("Error parsing user data:", parseError);
//         }
//       }

//       setUsers(userData);

//       if (userData.length === 0) {
//         await useSwalInfoAlert("No Users", "No active users found in the system.");
//       }
//     } catch (error) {
//       console.error("Error fetching users:", error);
//       setUsers([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchUserRoles = async (userCodes) => {
//     try {
//       const { data } = await apiClient.get('/getUserRoles', {
//         json_data: { users: userCodes },
//       });

//       const rows = data?.data ?? [];
//       // Accept USER_CODE/ROLE_CODE or user_code/role_code
//       const s = new Set(
//         rows
//           .map(r => {
//             const u = r.USER_CODE ?? r.user_code ?? r.userCode;
//             const rc = r.ROLE_CODE ?? r.role_code ?? r.roleCode;
//             return (u && rc) ? `${u}-${rc}` : null;
//           })
//           .filter(Boolean)
//       );

//       setAppliedUserRoles(s); // <- the Set your RolesTab consumes
//     } catch (e) {
//       console.error('fetchUserRoles failed', e);
//     }
//   };


//   useEffect(() => {
//     fetchRoles();
//   }, []);

//   useEffect(() => {
//     if (activeTab === "roleUserMatch" || activeTab === "userAccess") {
//       fetchUsers();
//       if (activeTab === "roleUserMatch") {
//         fetchUserRoles();
//       }
//     }
//   }, [activeTab]);

//   // Close menus on outside click
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       const clickedOutsideExport =
//         exportRef.current && !exportRef.current.contains(event.target);
//       const clickedOutsideGuide =
//         guideRef.current && !guideRef.current.contains(event.target);
//       if (clickedOutsideExport) setOpenExport(false);
//       if (clickedOutsideGuide) setOpenGuide(false);
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   // Loading spinner timer
//   useEffect(() => {
//     let timer;
//     if (loading) {
//       timer = setTimeout(() => setShowSpinner(true), 200);
//     } else {
//       setShowSpinner(false);
//     }
//     return () => clearTimeout(timer);
//   }, [loading]);

//   // Exports
//   const handleExport = (type) => {
//     if (!roles.length) {
//       useSwalInfoAlert("No data", "There is no data to export.");
//       return;
//     }

//     const headers = ["Code", "Description", "Active"];
//     const rows = roles.map((role) => [
//       role.roleCode || "",
//       role.roleName || "",
//       role.active || "",
//     ]);

//     if (type === "csv" || type === "excel") {
//       const wb = XLSX.utils.book_new();
//       const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
//       XLSX.utils.book_append_sheet(wb, ws, "User Roles");
//       if (type === "csv") {
//         XLSX.writeFile(wb, "user_roles.csv", { bookType: "csv" });
//       } else {
//         XLSX.writeFile(wb, "user_roles.xlsx", { bookType: "xlsx" });
//       }
//     } else if (type === "pdf") {
//       const doc = new jsPDF({
//         orientation: "landscape",
//         unit: "pt",
//         format: "A4",
//       });
//       doc.setFontSize(15);
//       doc.text("User Roles", 40, 40);
//       autoTable(doc, {
//         head: [headers],
//         body: rows,
//         startY: 60,
//         margin: { top: 50 },
//         theme: "grid",
//         styles: {
//           fontSize: 8,
//           textColor: [40, 40, 40],
//           lineColor: [60, 60, 60],
//           lineWidth: 0.1,
//         },
//         headStyles: {
//           fillColor: [0, 0, 128],
//           textColor: [255, 255, 255],
//           fontStyle: "bold",
//           halign: "center",
//         },
//       });
//       doc.save("user_roles.pdf");
//     }
//     setOpenExport(false);
//   };

//   // Guides
//   const handlePDFGuide = () => {
//     if (pdfLink) window.open(pdfLink, "_blank");
//     setOpenGuide(false);
//   };

//   const handleVideoGuide = () => {
//     if (videoLink) window.open(videoLink, "_blank");
//     setOpenGuide(false);
//   };

//   const primaryBtn =
//     "bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition duration-200";

//   // Define the tabs structure
//   const tabs = [
//     { id: "userRoles", label: "User Roles", icon: faUsers, color: "blue" },
//     { id: "roleUserMatch", label: "Role-User Matching", icon: faUserShield, color: "green" },
//     { id: "roleAccess", label: "Role Access Rights", icon: faShield, color: "purple" },
//     // { id: "userAccess", label: "User Access Rights", icon: faKey, color: "orange" },
//   ];
//   const renderActionButtons = () => {
//     switch (activeTab) {

//       case "userRoles":
//         return (
//           <>
//             <button className={primaryBtn} onClick={() => usersTabRef.current?.add?.()}>
//               <FontAwesomeIcon icon={faPlus} /> Add
//             </button>

//             <button className={primaryBtn} onClick={() => usersTabRef.current?.save?.()}>
//               <FontAwesomeIcon icon={faSave} /> Save
//             </button>

//             <button className={primaryBtn} onClick={() => usersTabRef.current?.reset?.()}>
//               <FontAwesomeIcon icon={faUndo} /> Reset
//             </button>
//           </>
//         );

//       case "roleUserMatch":
//         return (
//           <>
//             <button className={primaryBtn} onClick={() => rolesTabRef.current?.viewRole?.()}>
//               <FontAwesomeIcon icon={faEye} /> View Role
//             </button>

//             <button className={primaryBtn} onClick={() => rolesTabRef.current?.reset?.()}>
//               <FontAwesomeIcon icon={faUndo} /> Reset
//             </button>

//             <button className={primaryBtn} onClick={() => rolesTabRef.current?.apply?.()}>
//               <FontAwesomeIcon icon={faCheck} /> Apply
//             </button>
//           </>
//         );

//       case "roleAccess":
//         return (
//           <>
//             <button className={primaryBtn} onClick={() => roleAccessTabRef.current?.viewModules?.()}>
//               <FontAwesomeIcon icon={faEye} /> View Modules
//             </button>

//             <button className={primaryBtn} onClick={() => roleAccessTabRef.current?.reset?.()}>
//               <FontAwesomeIcon icon={faUndo} /> Reset
//             </button>

//             <button className={primaryBtn} onClick={() => roleAccessTabRef.current?.saveAccess?.()}>
//               <FontAwesomeIcon icon={faSave} /> Save Access
//             </button>
//           </>
//         );

//       case "userAccess":
//         return (
//           <>
//             <button className={primaryBtn} onClick={() => userAccessTabRef.current?.viewRights?.()}>
//               <FontAwesomeIcon icon={faEye} /> View Rights
//             </button>

//             <button className={primaryBtn} onClick={() => userAccessTabRef.current?.reset?.()}>
//               <FontAwesomeIcon icon={faUndo} /> Reset
//             </button>

//             <button className={primaryBtn} onClick={() => userAccessTabRef.current?.apply?.()}>
//               <FontAwesomeIcon icon={faCheck} /> Apply
//             </button>
//           </>
//         );

//       default:
//         return null;
//     }
//   };


//   return (
//     <div className="global-ref-main-div-ui mt-24">
//       {(loading || saving) && <LoadingSpinner />}

//       {/* Header with Tabs */}
//       <div className="fixed mt-4 top-14 left-3 right-3 sm:left-6 sm:right-6 z-30">
//         <div className="global-ref-header-ui">
//           <div className="w-full flex flex-col gap-3 md:grid md:grid-cols-3 md:items-center md:gap-0">

//             {/* 1) Title */}
//             <div className="w-full md:w-auto md:justify-start flex">
//               <h1 className="global-ref-headertext-ui w-full md:w-auto truncate text-center md:text-left">
//                 {documentTitle}
//               </h1>
//             </div>

//             {/* 2) Tabs */}
//             <div className="w-full md:justify-center flex">
//               <div className="w-full md:w-auto">
//                 <div className="flex flex-nowrap overflow-x-auto no-scrollbar border-b border-gray-200 dark:border-gray-700">
//                   {tabs.map((tab) => {
//                     const isActive = activeTab === tab.id;

//                     const activeClassMap = {
//                       blue: "border-blue-600 text-blue-600 bg-blue-50/50 dark:bg-blue-900/30 dark:text-blue-300",
//                       green: "border-green-600 text-green-600 bg-green-50/50 dark:bg-green-900/30 dark:text-green-300",
//                       red: "border-red-600 text-red-600 bg-red-50/50 dark:bg-red-900/30 dark:text-red-300",
//                       yellow: "border-yellow-600 text-yellow-600 bg-yellow-50/50 dark:bg-yellow-900/30 dark:text-yellow-300",
//                       purple: "border-purple-600 text-purple-600 bg-purple-50/50 dark:bg-purple-900/30 dark:text-purple-300",
//                       indigo: "border-indigo-600 text-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/30 dark:text-indigo-300",
//                       pink: "border-pink-600 text-pink-600 bg-pink-50/50 dark:bg-pink-900/30 dark:text-pink-300",
//                       gray: "border-gray-600 text-gray-600 bg-gray-50/50 dark:bg-gray-900/30 dark:text-gray-300",
//                     };

//                     return (
//                       <button
//                         key={tab.id}
//                         onClick={() => setActiveTab(tab.id)}
//                         className={`shrink-0 whitespace-nowrap px-3 py-2 text-[12px] sm:text-[12px] font-bold transition-all border-b-2 flex items-center gap-2
//                     ${isActive
//                             ? activeClassMap[tab.color] || activeClassMap.blue
//                             : "border-transparent text-gray-500 hover:text-blue-500 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50 dark:hover:text-blue-300"
//                           }`}
//                       >
//                         <FontAwesomeIcon icon={tab.icon} className="w-4 h-4" />
//                         <span>{tab.label}</span>
//                       </button>
//                     );
//                   })}
//                 </div>
//               </div>
//             </div>

//             {/* 3) Buttons */}
//             <div className="w-full md:w-auto flex md:justify-end">
//               <div className="w-full md:w-auto flex items-center justify-center md:justify-end gap-2 flex-wrap text-xs">

//                 {/* Common buttons */}
//                 <div className="flex flex-wrap justify-center md:justify-end gap-2">
//                   {renderActionButtons()}
//                 </div>

//                 {/* Export Dropdown */}
//                 <div ref={exportRef} className="relative">
//                   <button
//                     onClick={() => setOpenExport((v) => !v)}
//                     className={`${primaryBtn} h-8 px-3 sm:px-4 text-[11px] flex items-center gap-1`}
//                   >
//                     <FontAwesomeIcon icon={faPrint} />
//                     <span className="hidden sm:inline">Export</span>
//                     <FontAwesomeIcon icon={faChevronDown} className="text-[10px]" />
//                   </button>

//                   {isOpenExport && (
//                     <div className="absolute right-0 mt-2 w-40 rounded-lg shadow-lg bg-white ring-1 ring-black/10 z-[60] dark:bg-gray-800 overflow-hidden">
//                       <button
//                         onClick={() => {
//                           handleExport("csv");
//                           setOpenExport(false);
//                         }}
//                         className="block w-full text-left px-4 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900"
//                       >
//                         <FontAwesomeIcon icon={faFileCsv} className="mr-2 text-green-600" />
//                         CSV
//                       </button>

//                       <button
//                         onClick={() => {
//                           handleExport("excel");
//                           setOpenExport(false);
//                         }}
//                         className="block w-full text-left px-4 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900"
//                       >
//                         <FontAwesomeIcon icon={faFileExcel} className="mr-2 text-green-600" />
//                         Excel
//                       </button>

//                       <button
//                         onClick={() => {
//                           handleExport("pdf");
//                           setOpenExport(false);
//                         }}
//                         className="block w-full text-left px-4 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900"
//                       >
//                         <FontAwesomeIcon icon={faFilePdf} className="mr-2 text-red-600" />
//                         PDF
//                       </button>
//                     </div>
//                   )}
//                 </div>

//                 {/* Help Dropdown */}
//                 <div ref={guideRef} className="relative">
//                   <button
//                     onClick={() => setOpenGuide((v) => !v)}
//                     className={`${primaryBtn} h-8 px-3 sm:px-4 text-[11px] flex items-center gap-1`}
//                   >
//                     <FontAwesomeIcon icon={faInfoCircle} />
//                     <span className="hidden sm:inline">Help</span>
//                     <FontAwesomeIcon icon={faChevronDown} className="text-[10px]" />
//                   </button>

//                   {isOpenGuide && (
//                     <div className="absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black/10 z-[60] dark:bg-gray-800 overflow-hidden">
//                       <button
//                         onClick={() => {
//                           handlePDFGuide();
//                           setOpenGuide(false);
//                         }}
//                         className="block w-full text-left px-4 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900"
//                       >
//                         <FontAwesomeIcon icon={faFilePdf} className="mr-2 text-red-600" />
//                         User Guide
//                       </button>

//                       <button
//                         onClick={() => {
//                           handleVideoGuide();
//                           setOpenGuide(false);
//                         }}
//                         className="block w-full text-left px-4 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900"
//                       >
//                         <FontAwesomeIcon icon={faVideo} className="mr-2 text-blue-600" />
//                         Video Guide
//                       </button>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Tab Content */}
//       <div className="global-tran-tab-div-ui mt-5">
//         {activeTab === "userRoles" && (
//           <UsersTab
//             ref={usersTabRef}
//             roles={roles}
//             fetchRoles={fetchRoles}
//             user={user}
//             saving={saving}
//             setSaving={setSaving}
//           />
//         )}

//         {activeTab === "roleUserMatch" && (
//           <RolesTab
//             ref={rolesTabRef}
//             users={users}
//             roles={roles}
//             appliedUserRoles={appliedUserRoles}
//             setAppliedUserRoles={setAppliedUserRoles}
//             fetchUserRoles={fetchUserRoles}
//           />
//         )}

//         {activeTab === "roleAccess" && (
//           <RoleAccessTab ref={roleAccessTabRef} roles={roles} />
//         )}

//         {activeTab === "userAccess" && (
//           <UserRoleTab ref={userAccessTabRef} users={users} />
//         )}
//       </div>
//     </div>
//   );
// };

// export default UserAccessRights;


// import { useEffect, useRef, useState } from "react";
// import { apiClient } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";
// import { useAuth } from "@/NAYSA Cloud/Authentication/AuthContext.jsx";

// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import {
//   faPlus,
//   faPrint,
//   faChevronDown,
//   faInfoCircle,
//   faSpinner,
//   faFileCsv,
//   faFileExcel,
//   faFilePdf,
//   faVideo,
//   faSave,
//   faUndo,
//   faUsers,
//   faShield,
//   faKey,
//   faUserShield,
//   faCheck,
//   faEye,
// } from "@fortawesome/free-solid-svg-icons";

// // Global
// import { useReset } from "../Components/ResetContext";
// import {
//   reftables,
//   reftablesPDFGuide,
//   reftablesVideoGuide,
// } from "@/NAYSA Cloud/Global/reftable";

// import { useSwalInfoAlert } from "@/NAYSA Cloud/Global/behavior";

// // Exports
// import * as XLSX from "xlsx";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";

// // Import tab components
// import UsersTab from "./UserAccessRightsTabs/UsersTab";
// import RolesTab from "./UserAccessRightsTabs/RolesTab";
// import RoleAccessTab from "./UserAccessRightsTabs/RoleAccessTab";
// import UserRoleTab from "./UserAccessRightsTabs/UserRoleTab";

// const UserAccessRights = () => {
//   const docType = "UserAccRight";
//   const { user } = useAuth();
//   const documentTitle = reftables[docType];
//   const pdfLink = reftablesPDFGuide[docType];
//   const videoLink = reftablesVideoGuide[docType];

//   const usersTabRef = useRef(null);
//   const rolesTabRef = useRef(null);
//   const roleAccessTabRef = useRef(null);
//   const userAccessTabRef = useRef(null);

//   const [activeTab, setActiveTab] = useState("userRoles");

//   const [roles, setRoles] = useState([]);
//   const [users, setUsers] = useState([]);
//   const [appliedUserRoles, setAppliedUserRoles] = useState(new Set());

//   const [loading, setLoading] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [isOpenExport, setOpenExport] = useState(false);
//   const [isOpenGuide, setOpenGuide] = useState(false);
//   const [showSpinner, setShowSpinner] = useState(false);

//   const exportRef = useRef(null);
//   const guideRef = useRef(null);

//   const LoadingSpinner = () => (
//     <div className="global-tran-spinner-main-div-ui">
//       <div className="global-tran-spinner-sub-div-ui">
//         <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-blue-500 mb-2" />
//         <p>Please wait...</p>
//       </div>
//     </div>
//   );

//   const fetchRoles = async () => {
//     setLoading(true);
//     try {
//       const { data } = await apiClient.get("/role");
//       const roleData =
//         Array.isArray(data?.data) && data.data[0]?.result
//           ? JSON.parse(data.data[0].result)
//           : [];
//       setRoles(roleData);
//     } catch (error) {
//       console.error("Error fetching roles:", error);
//       setRoles([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchUsers = async () => {
//     setLoading(true);
//     try {
//       const response = await apiClient.get("/load", { params: { Status: "Active" } });
//       const { data } = response;

//       let userData = [];
//       if (Array.isArray(data?.data) && data.data[0]?.result) {
//         try {
//           const resultData =
//             typeof data.data[0].result === "string"
//               ? JSON.parse(data.data[0].result)
//               : data.data[0].result;

//           if (Array.isArray(resultData)) {
//             userData = resultData.filter((u) => u.userCode || u.userName || u.userType);
//           }
//         } catch (parseError) {
//           console.error("Error parsing user data:", parseError);
//         }
//       }

//       setUsers(userData);

//       if (userData.length === 0) {
//         await useSwalInfoAlert("No Users", "No active users found in the system.");
//       }

//       return userData;
//     } catch (error) {
//       console.error("Error fetching users:", error);
//       setUsers([]);
//       return [];
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchUserRoles = async (userCodes = []) => {
//     try {
//       if (!Array.isArray(userCodes) || userCodes.length === 0) {
//         setAppliedUserRoles(new Set());
//         return;
//       }

//       const { data } = await apiClient.get("/getUserRoles", {
//         params: { users: userCodes.join(",") },
//       });

//       const rows = data?.data ?? [];
//       const s = new Set(
//         rows
//           .map((r) => {
//             const u = r.USER_CODE ?? r.user_code ?? r.userCode;
//             const rc = r.ROLE_CODE ?? r.role_code ?? r.roleCode;
//             return u && rc ? `${u}-${rc}` : null;
//           })
//           .filter(Boolean)
//       );

//       setAppliedUserRoles(s);
//     } catch (e) {
//       console.error("fetchUserRoles failed", e);
//       setAppliedUserRoles(new Set());
//     }
//   };

//   useEffect(() => {
//     fetchRoles();
//   }, []);

//   useEffect(() => {
//     const loadTabData = async () => {
//       if (activeTab === "roleUserMatch" || activeTab === "userAccess") {
//         const loadedUsers = await fetchUsers();

//         if (activeTab === "roleUserMatch" && loadedUsers.length > 0) {
//           const userCodes = loadedUsers
//             .map((u) => u.userCode || u.USER_CODE)
//             .filter(Boolean);

//           await fetchUserRoles(userCodes);
//         }
//       }
//     };

//     loadTabData();
//   }, [activeTab]);

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       const clickedOutsideExport =
//         exportRef.current && !exportRef.current.contains(event.target);
//       const clickedOutsideGuide =
//         guideRef.current && !guideRef.current.contains(event.target);

//       if (clickedOutsideExport) setOpenExport(false);
//       if (clickedOutsideGuide) setOpenGuide(false);
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   useEffect(() => {
//     let timer;
//     if (loading) {
//       timer = setTimeout(() => setShowSpinner(true), 200);
//     } else {
//       setShowSpinner(false);
//     }
//     return () => clearTimeout(timer);
//   }, [loading]);

//   const handleExport = (type) => {
//     if (!roles.length) {
//       useSwalInfoAlert("No data", "There is no data to export.");
//       return;
//     }

//     const headers = ["Code", "Description", "Active"];
//     const rows = roles.map((role) => [
//       role.roleCode || "",
//       role.roleName || "",
//       role.active || "",
//     ]);

//     if (type === "csv" || type === "excel") {
//       const wb = XLSX.utils.book_new();
//       const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
//       XLSX.utils.book_append_sheet(wb, ws, "User Roles");

//       if (type === "csv") {
//         XLSX.writeFile(wb, "user_roles.csv", { bookType: "csv" });
//       } else {
//         XLSX.writeFile(wb, "user_roles.xlsx", { bookType: "xlsx" });
//       }
//     } else if (type === "pdf") {
//       const doc = new jsPDF({
//         orientation: "landscape",
//         unit: "pt",
//         format: "A4",
//       });

//       doc.setFontSize(15);
//       doc.text("User Roles", 40, 40);

//       autoTable(doc, {
//         head: [headers],
//         body: rows,
//         startY: 60,
//         margin: { top: 50 },
//         theme: "grid",
//         styles: {
//           fontSize: 8,
//           textColor: [40, 40, 40],
//           lineColor: [60, 60, 60],
//           lineWidth: 0.1,
//         },
//         headStyles: {
//           fillColor: [0, 0, 128],
//           textColor: [255, 255, 255],
//           fontStyle: "bold",
//           halign: "center",
//         },
//       });

//       doc.save("user_roles.pdf");
//     }

//     setOpenExport(false);
//   };

//   const handlePDFGuide = () => {
//     if (pdfLink) window.open(pdfLink, "_blank");
//     setOpenGuide(false);
//   };

//   const handleVideoGuide = () => {
//     if (videoLink) window.open(videoLink, "_blank");
//     setOpenGuide(false);
//   };

//   const primaryBtn =
//     "flex items-center justify-center h-8 w-8 sm:w-auto sm:h-8 sm:px-4 text-[11px] font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-all";

//   const tabs = [
//     { id: "userRoles", label: "User Roles", icon: faUsers, color: "blue" },
//     { id: "roleUserMatch", label: "Role-User Matching", icon: faUserShield, color: "green" },
//     { id: "roleAccess", label: "Role Access Rights", icon: faShield, color: "purple" },
//     // { id: "userAccess", label: "User Access Rights", icon: faKey, color: "orange" },
//   ];

//   const renderActionButtons = () => {
//     switch (activeTab) {
//       case "userRoles":
//         return (
//           <>
//             <button className={primaryBtn} onClick={() => usersTabRef.current?.add?.()}>
//               <FontAwesomeIcon icon={faPlus} />
//               <span className="hidden sm:inline ml-1">Add</span>
//             </button>

//             <button className={primaryBtn} onClick={() => usersTabRef.current?.save?.()}>
//               <FontAwesomeIcon icon={faSave} />
//               <span className="hidden sm:inline ml-1">Save</span>
//             </button>

//             <button className={primaryBtn} onClick={() => usersTabRef.current?.reset?.()}>
//               <FontAwesomeIcon icon={faUndo} />
//               <span className="hidden sm:inline ml-1">Reset</span>
//             </button>
//           </>
//         );

//       case "roleUserMatch":
//         return (
//           <>
//             <button className={primaryBtn} onClick={() => rolesTabRef.current?.viewRole?.()}>
//               <FontAwesomeIcon icon={faEye} />
//               <span className="hidden sm:inline ml-1">View Role</span>
//             </button>

//             <button className={primaryBtn} onClick={() => rolesTabRef.current?.reset?.()}>
//               <FontAwesomeIcon icon={faUndo} />
//               <span className="hidden sm:inline ml-1">Reset</span>
//             </button>

//             <button className={primaryBtn} onClick={() => rolesTabRef.current?.apply?.()}>
//               <FontAwesomeIcon icon={faCheck} />
//               <span className="hidden sm:inline ml-1">Apply</span>
//             </button>
//           </>
//         );

//       case "roleAccess":
//         return (
//           <>
//             <button className={primaryBtn} onClick={() => roleAccessTabRef.current?.viewModules?.()}>
//               <FontAwesomeIcon icon={faEye} />
//               <span className="hidden sm:inline ml-1">View Modules</span>
//             </button>

//             <button className={primaryBtn} onClick={() => roleAccessTabRef.current?.reset?.()}>
//               <FontAwesomeIcon icon={faUndo} />
//               <span className="hidden sm:inline ml-1">Reset</span>
//             </button>

//             <button className={primaryBtn} onClick={() => roleAccessTabRef.current?.saveAccess?.()}>
//               <FontAwesomeIcon icon={faSave} />
//               <span className="hidden sm:inline ml-1">Save Access</span>
//             </button>
//           </>
//         );

//       case "userAccess":
//         return (
//           <>
//             <button className={primaryBtn} onClick={() => userAccessTabRef.current?.viewRights?.()}>
//               <FontAwesomeIcon icon={faEye} />
//               <span className="hidden sm:inline ml-1">View Rights</span>
//             </button>

//             <button className={primaryBtn} onClick={() => userAccessTabRef.current?.reset?.()}>
//               <FontAwesomeIcon icon={faUndo} />
//               <span className="hidden sm:inline ml-1">Reset</span>
//             </button>

//             <button className={primaryBtn} onClick={() => userAccessTabRef.current?.apply?.()}>
//               <FontAwesomeIcon icon={faCheck} />
//               <span className="hidden sm:inline ml-1">Apply</span>
//             </button>
//           </>
//         );

//       default:
//         return null;
//     }
//   };

//   return (
//     <div className="global-ref-main-div-ui">
//       {(loading || saving || showSpinner) && <LoadingSpinner />}

//       <div className="global-ref-header-ui">
//         <div className="w-full flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">

//           {/* 1) Title */}
//           <div className="flex justify-center xl:justify-start xl:flex-shrink-0">
//             <h1 className="global-ref-headertext-ui text-center xl:text-left truncate">
//               {documentTitle}
//             </h1>
//           </div>

//           {/* 2) Tabs */}
//           <div className="flex-1 min-w-0 flex xl:justify-center">
//             <div className="max-w-full">
//               <div className="flex flex-nowrap overflow-x-auto no-scrollbar border-b border-gray-200 dark:border-gray-700">
//                 {tabs.map((tab) => {
//                   const isActive = activeTab === tab.id;

//                   return (
//                     <button
//                       key={tab.id}
//                       onClick={() => setActiveTab(tab.id)}
//                       className={`shrink-0 whitespace-nowrap px-3 py-2 text-[12px] font-bold transition-all border-b-2 flex items-center gap-2
//               ${isActive
//                           ? "border-blue-600 text-blue-600 bg-blue-50/50 dark:bg-blue-900/30 dark:text-blue-300"
//                           : "border-transparent text-gray-500 hover:text-blue-500 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50 dark:hover:text-blue-300"
//                         }`}
//                     >
//                       <FontAwesomeIcon icon={tab.icon} className="w-4 h-4" />
//                       <span>{tab.label}</span>
//                     </button>
//                   );
//                 })}
//               </div>
//             </div>
//           </div>

//           {/* 3) Buttons */}
//           <div className="flex justify-center xl:justify-end xl:flex-shrink-0">
//             <div className="flex items-center justify-center xl:justify-end gap-2 flex-wrap text-xs">
//               <div className="flex flex-wrap justify-center xl:justify-end gap-2">
//                 {renderActionButtons()}
//               </div>

//               <div ref={exportRef} className="relative">
//                 <button
//                   onClick={() => setOpenExport((v) => !v)}
//                   className={`${primaryBtn}`}
//                 >
//                   <FontAwesomeIcon icon={faPrint} />
//                   <span className="hidden sm:inline ml-1">Export</span>
//                   <FontAwesomeIcon icon={faChevronDown} className="text-[10px] ml-1" />
//                 </button>
//               </div>

//               <div ref={guideRef} className="relative">
//                 <button
//                   onClick={() => setOpenGuide((v) => !v)}
//                   className={`${primaryBtn}`}
//                 >
//                   <FontAwesomeIcon icon={faInfoCircle} />
//                   <span className="hidden sm:inline ml-1">Help</span>
//                   <FontAwesomeIcon icon={faChevronDown} className="text-[10px] ml-1" />
//                 </button>
//               </div>
//             </div>
//           </div>

//         </div>
//       </div>

//       {/* Tab Content */}
//       <div className="mt-44 sm:mt-28 lg:mt-24">
//         <div className="global-tran-tab-div-ui">
//           {activeTab === "userRoles" && (
//             <UsersTab
//               ref={usersTabRef}
//               roles={roles}
//               fetchRoles={fetchRoles}
//               user={user}
//               saving={saving}
//               setSaving={setSaving}
//             />
//           )}

//           {activeTab === "roleUserMatch" && (
//             <RolesTab
//               ref={rolesTabRef}
//               users={users}
//               roles={roles}
//               appliedUserRoles={appliedUserRoles}
//               setAppliedUserRoles={setAppliedUserRoles}
//               fetchUserRoles={fetchUserRoles}
//             />
//           )}

//           {activeTab === "roleAccess" && (
//             <RoleAccessTab ref={roleAccessTabRef} roles={roles} />
//           )}

//           {activeTab === "userAccess" && (
//             <UserRoleTab ref={userAccessTabRef} users={users} />
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default UserAccessRights;
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { apiClient } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";
import { useAuth } from "@/NAYSA Cloud/Authentication/AuthContext.jsx";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faPrint,
  faChevronDown,
  faInfoCircle,
  faSpinner,
  faFileCsv,
  faFileExcel,
  faFilePdf,
  faVideo,
  faSave,
  faUndo,
  faUsers,
  faShield,
  faUserShield,
  faCheck,
  faEye,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";

import {
  reftables,
  reftablesPDFGuide,
  reftablesVideoGuide,
} from "@/NAYSA Cloud/Global/reftable";

import { useSwalInfoAlert } from "@/NAYSA Cloud/Global/behavior";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Swal from "sweetalert2";
import { exportGenericQueryExcel } from "@/NAYSA Cloud/Global/report";

import UsersTab from "./UserAccessRightsTabs/UsersTab";
import RolesTab from "./UserAccessRightsTabs/RolesTab";
import RoleAccessTab from "./UserAccessRightsTabs/RoleAccessTab";
import UserRoleTab from "./UserAccessRightsTabs/UserRoleTab";

const UserAccessRights = () => {
  const docType = "UserAccRight";
  const { user, companyInfo } = useAuth();

  const documentTitle = reftables[docType];
  const pdfLink = reftablesPDFGuide[docType];
  const videoLink = reftablesVideoGuide[docType];

  const usersTabRef = useRef(null);
  const rolesTabRef = useRef(null);
  const roleAccessTabRef = useRef(null);
  const userAccessTabRef = useRef(null);

  const exportRef = useRef(null);
  const guideRef = useRef(null);

  const [activeTab, setActiveTab] = useState("userRoles");
  const [showMobileMenu, setShowMobileMenu] = useState(true);

  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [appliedUserRoles, setAppliedUserRoles] = useState(new Set());

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isOpenExport, setOpenExport] = useState(false);
  const [isOpenGuide, setOpenGuide] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);

  const tabs = useMemo(
    () => [
      { id: "userRoles", label: "User Roles", icon: faUsers },
      { id: "roleUserMatch", label: "User-Role Matching", icon: faUserShield },
      { id: "roleAccess", label: "Role Access Rights", icon: faShield },
    ],
    []
  );

  const activeTabIndex = tabs.findIndex((tab) => tab.id === activeTab);

  const LoadingSpinner = () => (
    <div className="global-tran-spinner-main-div-ui">
      <div className="global-tran-spinner-sub-div-ui">
        <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-blue-500 mb-2" />
        <p>Please wait...</p>
      </div>
    </div>
  );

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/role");
      const roleData =
        Array.isArray(data?.data) && data.data[0]?.result
          ? JSON.parse(data.data[0].result)
          : [];
      setRoles(roleData);
      return roleData;
    } catch (error) {
      console.error("Error fetching roles:", error);
      setRoles([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/load", {
        params: { Status: "Active" },
      });
      const { data } = response;

      let userData = [];
      if (Array.isArray(data?.data) && data.data[0]?.result) {
        try {
          const resultData =
            typeof data.data[0].result === "string"
              ? JSON.parse(data.data[0].result)
              : data.data[0].result;

          if (Array.isArray(resultData)) {
            userData = resultData.filter(
              (u) => u.userCode || u.userName || u.userType
            );
          }
        } catch (parseError) {
          console.error("Error parsing user data:", parseError);
        }
      }

      setUsers(userData);

      if (userData.length === 0) {
        await useSwalInfoAlert("No Users", "No active users found in the system.");
      }

      return userData;
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRoles = async (userCodes = []) => {
    try {
      if (!Array.isArray(userCodes) || userCodes.length === 0) {
        setAppliedUserRoles(new Set());
        return;
      }

      const { data } = await apiClient.get("/getUserRoles", {
        params: { users: userCodes.join(",") },
      });

      const rows = data?.data ?? [];
      const s = new Set(
        rows
          .map((r) => {
            const u = r.USER_CODE ?? r.user_code ?? r.userCode;
            const rc = r.ROLE_CODE ?? r.role_code ?? r.roleCode;
            return u && rc ? `${u}-${rc}` : null;
          })
          .filter(Boolean)
      );

      setAppliedUserRoles(s);
    } catch (e) {
      console.error("fetchUserRoles failed", e);
      setAppliedUserRoles(new Set());
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    const loadTabData = async () => {
      if (activeTab === "roleUserMatch" || activeTab === "userAccess") {
        const loadedUsers = await fetchUsers();

        if (activeTab === "roleUserMatch" && loadedUsers.length > 0) {
          const userCodes = loadedUsers
            .map((u) => u.userCode || u.USER_CODE)
            .filter(Boolean);

          await fetchUserRoles(userCodes);
        }
      }
    };

    const isDesktop = window.innerWidth >= 768;

    if (isDesktop || !showMobileMenu) {
      loadTabData();
    }
  }, [activeTab, showMobileMenu]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedOutsideExport =
        exportRef.current && !exportRef.current.contains(event.target);
      const clickedOutsideGuide =
        guideRef.current && !guideRef.current.contains(event.target);

      if (clickedOutsideExport) setOpenExport(false);
      if (clickedOutsideGuide) setOpenGuide(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let timer;
    if (loading) {
      timer = setTimeout(() => setShowSpinner(true), 200);
    } else {
      setShowSpinner(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

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

  const getActiveExportConfig = () => {
    if (activeTab === "userRoles") {
      const rows = (Array.isArray(roles) ? roles : []).map((r) => ({
        roleCode: r.roleCode || "",
        roleName: r.roleName || "",
        active: r.active === "Y" ? "Yes" : "No",
      }));

      return {
        fileName: "User Roles",
        rows,
        columns: [
          { key: "roleCode", label: "Role Code" },
          { key: "roleName", label: "Role Name" },
          { key: "active", label: "Active" },
        ],
      };
    }

    if (activeTab === "roleUserMatch") {
      return rolesTabRef.current?.getExportData?.() || {
        fileName: "User Role Matching",
        rows: [],
        columns: [],
      };
    }

    if (activeTab === "roleAccess") {
      return roleAccessTabRef.current?.getExportData?.() || {
        fileName: "Role Access Rights",
        rows: [],
        columns: [],
      };
    }

    return {
      fileName: "Export",
      rows: [],
      columns: [],
    };
  };

  const handleExport = async (type) => {
    const exportConfig = getActiveExportConfig();
    const exportRows = Array.isArray(exportConfig?.rows) ? exportConfig.rows : [];
    const exportColumns = Array.isArray(exportConfig?.columns)
      ? exportConfig.columns
      : [];

    if (!exportRows.length || !exportColumns.length) {
      useSwalInfoAlert("No data", "There is no data to export.");
      return;
    }

    try {
      const defaultFileName = `${exportConfig.fileName} ${getDateTimeStamp()}`;

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

      if (type === "excel") {
        await exportGenericQueryExcel(
          exportRows,                  // data
          {},                          // grand totals
          exportColumns,               // visibleCols
          [],                          // groupBy
          exportColumns,               // columns
          {},                          // expandedGroups
          7,                           // rounding or template arg
          fileName,                    // file name
          user?.USER_NAME || user?.userName || "",
          companyInfo?.compName || "",
          companyInfo?.compAddr || "",
          companyInfo?.telNo || ""
        );

        setOpenExport(false);
        return;
      }

      // fallback CSV / PDF export
      const headers = exportColumns.map((c) => c.label);
      const rows = exportRows.map((row) =>
        exportColumns.map((c) => row[c.key] ?? "")
      );

      if (type === "csv") {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        XLSX.utils.book_append_sheet(wb, ws, exportConfig.fileName);
        XLSX.writeFile(wb, `${fileName}.csv`, { bookType: "csv" });
      } else if (type === "pdf") {
        const doc = new jsPDF({
          orientation: "landscape",
          unit: "pt",
          format: "A4",
        });

        doc.setFontSize(15);
        doc.text(exportConfig.fileName, 40, 40);

        autoTable(doc, {
          head: [headers],
          body: rows,
          startY: 60,
          margin: { top: 50 },
          theme: "grid",
          styles: {
            fontSize: 8,
            textColor: [40, 40, 40],
            lineColor: [60, 60, 60],
            lineWidth: 0.1,
          },
          headStyles: {
            fillColor: [0, 0, 128],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            halign: "center",
          },
        });

        doc.save(`${fileName}.pdf`);
      }

      setOpenExport(false);
    } catch (err) {
      console.error("Export error:", err);
      useSwalInfoAlert("Export Error", "Failed to export file.");
    }
  };

  const handlePDFGuide = () => {
    if (pdfLink) window.open(pdfLink, "_blank");
    setOpenGuide(false);
  };

  const handleVideoGuide = () => {
    if (videoLink) window.open(videoLink, "_blank");
    setOpenGuide(false);
  };

  const primaryBtn =
    "inline-flex items-center justify-center gap-1.5 h-9 px-3 text-[11px] font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-all whitespace-nowrap";
  const openMobileTab = (tabId) => {
    setActiveTab(tabId);
    setShowMobileMenu(false);
  };

  const renderActionButtons = () => {
    switch (activeTab) {
      case "userRoles":
        return (
          <>
            <button className={primaryBtn} onClick={() => usersTabRef.current?.add?.()}>
              <FontAwesomeIcon icon={faPlus} />
              <span>Add</span>
            </button>

            <button className={primaryBtn} onClick={() => usersTabRef.current?.save?.()}>
              <FontAwesomeIcon icon={faSave} />
              <span>Save</span>
            </button>

            <button className={primaryBtn} onClick={() => usersTabRef.current?.reset?.()}>
              <FontAwesomeIcon icon={faUndo} />
              <span>Reset</span>
            </button>
          </>
        );

      case "roleUserMatch":
        return (
          <>
            <button className={primaryBtn} onClick={() => rolesTabRef.current?.viewRole?.()}>
              <FontAwesomeIcon icon={faEye} />
              <span>View Role</span>
            </button>

            <button className={primaryBtn} onClick={() => rolesTabRef.current?.reset?.()}>
              <FontAwesomeIcon icon={faUndo} />
              <span>Reset</span>
            </button>

            <button className={primaryBtn} onClick={() => rolesTabRef.current?.apply?.()}>
              <FontAwesomeIcon icon={faCheck} />
              <span>Apply</span>
            </button>
          </>
        );

      case "roleAccess":
        return (
          <>
            <button
              className={primaryBtn}
              onClick={() => roleAccessTabRef.current?.viewModules?.()}
            >
              <FontAwesomeIcon icon={faEye} />
              <span>View Modules</span>
            </button>

            <button className={primaryBtn} onClick={() => roleAccessTabRef.current?.reset?.()}>
              <FontAwesomeIcon icon={faUndo} />
              <span>Reset</span>
            </button>

            <button
              className={primaryBtn}
              onClick={() => roleAccessTabRef.current?.saveAccess?.()}
            >
              <FontAwesomeIcon icon={faSave} />
              <span>Save Access</span>
            </button>
          </>
        );

      default:
        return null;
    }
  };
  const renderTabContent = () => {
    if (activeTab === "userRoles") {
      return (
        <UsersTab
          ref={usersTabRef}
          roles={roles}
          fetchRoles={fetchRoles}
          user={user}
          saving={saving}
          setSaving={setSaving}
        />
      );
    }

    if (activeTab === "roleUserMatch") {
      return (
        <RolesTab
          ref={rolesTabRef}
          users={users}
          roles={roles}
          appliedUserRoles={appliedUserRoles}
          setAppliedUserRoles={setAppliedUserRoles}
          fetchUserRoles={fetchUserRoles}
        />
      );
    }

    if (activeTab === "roleAccess") {
      return <RoleAccessTab ref={roleAccessTabRef} roles={roles} />;
    }

    if (activeTab === "userAccess") {
      return <UserRoleTab ref={userAccessTabRef} users={users} />;
    }

    return null;
  };

  return (
    <div className="global-ref-main-div-ui">
      {(loading || saving || showSpinner) && <LoadingSpinner />}

      {/* MOBILE */}
      <div className="md:hidden pt-[30px]">
        <AnimatePresence mode="wait" initial={false}>
          {showMobileMenu ? (
            <motion.div
              key="mobile-menu"
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 18 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="bg-white"
            >
              <div className="bg-blue-50 border-b border-blue-100">
                <div className="px-4 py-4">
                  <h2 className="font-bold text-base text-blue-800 uppercase tracking-tight">
                    {documentTitle}
                  </h2>
                </div>
              </div>

              <div className="bg-white">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => openMobileTab(tab.id)}
                    className="w-full flex items-center gap-3 px-5 py-6 text-left text-sm border-b border-gray-200 bg-white hover:bg-blue-50 transition-colors"
                  >
                    <span className="text-blue-600 w-5 flex justify-center">
                      <FontAwesomeIcon icon={tab.icon} />
                    </span>
                    <span className="font-medium text-gray-900">{tab.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={`mobile-content-${activeTab}`}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="min-h-screen bg-white"
            >
              <div className="sticky top-0 z-30 bg-blue-50 border-b">
                <div className="flex items-center justify-between px-4 py-3">
                  <button
                    onClick={() => setShowMobileMenu(true)}
                    className="text-blue-600 text-sm font-medium flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faArrowLeft} />
                    Back
                  </button>

                  <div className="text-sm font-bold text-blue-800 text-center">
                    {tabs.find((t) => t.id === activeTab)?.label || documentTitle}
                  </div>

                  <div className="w-[48px]" />
                </div>

                <div className="px-3 pb-3">
                  <div className="flex flex-wrap gap-2 justify-center">
                    {renderActionButtons()}

                    <div ref={exportRef} className="relative">
                      <button onClick={() => setOpenExport((v) => !v)} className={primaryBtn}>
                        <FontAwesomeIcon icon={faPrint} />
                        <span>Export</span>
                      </button>

                      {isOpenExport && (
                        <div className="absolute right-0 mt-2 w-40 rounded-lg shadow-lg bg-white ring-1 ring-black/10 z-[60] overflow-hidden">
                          {/* <button
                            onClick={() => {
                              handleExport("csv");
                              setOpenExport(false);
                            }}
                            className="block w-full text-left px-4 py-2 text-xs hover:bg-blue-50"
                          >
                            <FontAwesomeIcon icon={faFileCsv} className="mr-2 text-green-600" />
                            CSV
                          </button> */}

                          <button
                            onClick={() => {
                              handleExport("excel");
                              setOpenExport(false);
                            }}
                            className="block w-full text-left px-4 py-2 text-xs hover:bg-blue-50"
                          >
                            <FontAwesomeIcon icon={faFileExcel} className="mr-2 text-green-600" />
                            Excel
                          </button>

                          {/* <button
                            onClick={() => {
                              handleExport("pdf");
                              setOpenExport(false);
                            }}
                            className="block w-full text-left px-4 py-2 text-xs hover:bg-blue-50"
                          >
                            <FontAwesomeIcon icon={faFilePdf} className="mr-2 text-red-600" />
                            PDF
                          </button> */}
                        </div>
                      )}
                    </div>

                    <div ref={guideRef} className="relative">
                      <button onClick={() => setOpenGuide((v) => !v)} className={primaryBtn}>
                        <FontAwesomeIcon icon={faInfoCircle} />
                        <span>Help</span>
                      </button>

                      {isOpenGuide && (
                        <div className="absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black/10 z-[60] overflow-hidden">
                          <button
                            onClick={() => {
                              handlePDFGuide();
                              setOpenGuide(false);
                            }}
                            className="block w-full text-left px-4 py-2 text-xs hover:bg-blue-50"
                          >
                            <FontAwesomeIcon icon={faFilePdf} className="mr-2 text-red-600" />
                            User Guide
                          </button>

                          <button
                            onClick={() => {
                              handleVideoGuide();
                              setOpenGuide(false);
                            }}
                            className="block w-full text-left px-4 py-2 text-xs hover:bg-blue-50"
                          >
                            <FontAwesomeIcon icon={faVideo} className="mr-2 text-blue-600" />
                            Video Guide
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: "easeOut", delay: 0.03 }}
                className="p-3 pb-24"
              >
                {renderTabContent()}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* DESKTOP */}
      <div className="hidden md:block">
        <div className="fixed mt-4 top-14 left-3 right-3 sm:left-6 sm:right-6 z-30">
          <div className="global-ref-header-ui">
            <div className="w-full flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex justify-center xl:justify-start xl:flex-shrink-0">
                <h1 className="global-ref-headertext-ui text-center xl:text-left truncate">
                  {documentTitle}
                </h1>
              </div>

              <div className="flex-1 min-w-0 flex justify-start xl:justify-center">
                <div className="w-full max-w-[620px]">
                  <div className="relative grid grid-cols-3 rounded-xl border border-blue-100 bg-white p-1 shadow-sm overflow-hidden">
                    <motion.span
                      layout
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      className="absolute top-1 bottom-1 rounded-lg bg-blue-600 shadow-sm"
                      style={{
                        width: "calc(33.333333% - 0.333rem)",
                        left: `calc(${activeTabIndex * 33.333333}% + 0.17rem)`,
                      }}
                    />

                    {tabs.map((tab) => {
                      const isActive = activeTab === tab.id;

                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTab(tab.id)}
                          className={`relative z-10 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-[12px] font-bold transition-colors duration-300 ${isActive ? "text-white" : "text-gray-500 hover:text-blue-600"
                            }`}
                        >
                          <FontAwesomeIcon icon={tab.icon} className="w-4 h-4" />
                          <span className="truncate">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-center xl:justify-end xl:flex-shrink-0">
                <div className="flex items-center justify-center xl:justify-end gap-2 flex-wrap text-xs">
                  <div className="flex flex-wrap justify-center xl:justify-end gap-2">
                    {renderActionButtons()}
                  </div>

                  <div ref={exportRef} className="relative">
                    <button onClick={() => setOpenExport((v) => !v)} className={primaryBtn}>
                      <FontAwesomeIcon icon={faPrint} />
                      <span className="hidden sm:inline ml-1">Export</span>
                      <FontAwesomeIcon icon={faChevronDown} className="text-[10px] ml-1" />
                    </button>

                    {isOpenExport && (
                      <div className="absolute right-0 mt-2 w-40 rounded-lg shadow-lg bg-white ring-1 ring-black/10 z-[60] overflow-hidden">
                        {/* <button
                          onClick={() => {
                            handleExport("csv");
                            setOpenExport(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-xs hover:bg-blue-50"
                        >
                          <FontAwesomeIcon icon={faFileCsv} className="mr-2 text-green-600" />
                          CSV
                        </button> */}

                        <button
                          onClick={() => {
                            handleExport("excel");
                            setOpenExport(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-xs hover:bg-blue-50"
                        >
                          <FontAwesomeIcon icon={faFileExcel} className="mr-2 text-green-600" />
                          Excel
                        </button>

                        {/* <button
                          onClick={() => {
                            handleExport("pdf");
                            setOpenExport(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-xs hover:bg-blue-50"
                        >
                          <FontAwesomeIcon icon={faFilePdf} className="mr-2 text-red-600" />
                          PDF
                        </button> */}
                      </div>
                    )}
                  </div>

                  <div ref={guideRef} className="relative">
                    <button onClick={() => setOpenGuide((v) => !v)} className={primaryBtn}>
                      <FontAwesomeIcon icon={faInfoCircle} />
                      <span className="hidden sm:inline ml-1">Help</span>
                      <FontAwesomeIcon icon={faChevronDown} className="text-[10px] ml-1" />
                    </button>

                    {isOpenGuide && (
                      <div className="absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black/10 z-[60] overflow-hidden">
                        <button
                          onClick={() => {
                            handlePDFGuide();
                            setOpenGuide(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-xs hover:bg-blue-50"
                        >
                          <FontAwesomeIcon icon={faFilePdf} className="mr-2 text-red-600" />
                          User Guide
                        </button>

                        <button
                          onClick={() => {
                            handleVideoGuide();
                            setOpenGuide(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-xs hover:bg-blue-50"
                        >
                          <FontAwesomeIcon icon={faVideo} className="mr-2 text-blue-600" />
                          Video Guide
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-44 sm:mt-28 lg:mt-24">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.995 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="global-tran-tab-div-ui"
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default UserAccessRights;