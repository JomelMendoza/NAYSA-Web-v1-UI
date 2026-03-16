// import { useEffect, useMemo, useState, forwardRef, useImperativeHandle } from "react";
// import { apiClient } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faEdit, faTrashAlt, faPlus, faSave, faUndo } from "@fortawesome/free-solid-svg-icons";

// import {
//   useSwalErrorAlert,
//   useSwalSuccessAlert,
//   useSwalDeleteConfirm,
//   useSwalDeleteSuccess
// } from "@/NAYSA Cloud/Global/behavior";

// const UsersTab = forwardRef(({ roles, fetchRoles, user, saving, setSaving }, ref) => {
//   const [isEditing, setIsEditing] = useState(false);
//   const [roleCode, setRoleCode] = useState("");
//   const [roleName, setRoleName] = useState("");
//   const [active, setRoleActive] = useState("Y");
//   const [editingRole, setEditingRole] = useState(null);

//   // Table helpers
//   const [query, setQuery] = useState("");
//   const [sortBy, setSortBy] = useState("code");
//   const [sortDir, setSortDir] = useState("asc");
//   const [page, setPage] = useState(1);
//   const [pageSize, setPageSize] = useState(10);

//   // Per-column filters
//   const [columnFilters, setColumnFilters] = useState({
//     code: "",
//     description: "",
//     active: "",
//   });

//   const isEditingExisting = !!editingRole;

//   // Global Ctrl+S
//   useEffect(() => {
//     const onKey = (e) => {
//       if (e.ctrlKey && e.key.toLowerCase() === "s") {
//         e.preventDefault();
//         if (!saving && isEditing) handleSaveRole();
//       }
//     };
//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, [saving, isEditing, editingRole]);

//   // Helper function for case-insensitive string includes
//   const includesCI = (str, searchValue) => {
//     return String(str || "").toLowerCase().includes(String(searchValue).toLowerCase());
//   };

//   // Search + COLUMN FILTERS + sort + pagination
//   const filtered = useMemo(() => {
//     const q = query.trim().toLowerCase();

//     const base = q
//       ? roles.filter((r) =>
//           [r.roleCode, r.roleName].some((x) =>
//             String(x || "")
//               .toLowerCase()
//               .includes(q)
//           )
//         )
//       : roles;

//     const withColFilters = base.filter((r) => {
//       const f = columnFilters;
//       if (f.code && !includesCI(r.roleCode, f.code)) return false;
//       if (f.description && !includesCI(r.roleName, f.description)) return false;
//       if (f.active && String(r.active ?? "") !== String(f.active)) return false;
//       return true;
//     });

//     const factor = sortDir === "asc" ? 1 : -1;
//     return [...withColFilters].sort((a, b) => {
//       const A = String(a?.[sortBy] ?? "");
//       const B = String(b?.[sortBy] ?? "");
//       return A.localeCompare(B) * factor;
//     });
//   }, [roles, query, columnFilters, sortBy, sortDir]);

//   const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
//   const pageRows = useMemo(() => {
//     const start = (page - 1) * pageSize;
//     return filtered.slice(start, start + pageSize);
//   }, [filtered, page, pageSize]);

//   const handleSaveRole = async () => {
//     setSaving(true);
//     if (!roleCode || !roleName) {
//       await useSwalErrorAlert("Error!", "Please fill out Role Code and Description.");
//       setSaving(false);
//       return;
//     }
//     try {
//       const payload = {
//         roleCode: roleCode,
//         roleName: roleName,
//         active: active || "Y",
//         userCode: user.USER_CODE
//       };

//       const { data: res } = await apiClient.post("/upsertRole", { 
//         json_data: { json_data: payload } 
//       });

//       if (res.data?.status === "success") {
//         await useSwalSuccessAlert("Success!", "Role saved successfully!");
//         await fetchRoles();
//         resetForm();
//         setIsEditing(false);
//       } else {
//         await useSwalErrorAlert("Error!", res.data?.message || "Something went wrong.");
//       }
//     } catch (e) {
//       console.error("Error saving role:", e);
//       await useSwalErrorAlert(
//         "Error!", 
//         e?.response?.data?.message || "Error saving role. Please check the console for details."
//       );
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleDeleteRole = async (index) => {
//     const r = roles[index];
//     if (!r?.roleCode) return;

//     const confirm = await useSwalDeleteConfirm(
//       "Delete this role?",
//       `Code: ${r.roleCode} | Description: ${r.roleName || ""}`,
//       "Yes, delete it"
//     );

//     if (!confirm.isConfirmed) return;

//     try {
//       const { data: response } = await apiClient.post("/deleteRole", { ROLE_CODE: r.roleCode });

//       if (response.data.status === "success") {
//         await useSwalDeleteSuccess();
//         await fetchRoles();
//       } else {
//         await useSwalErrorAlert("Error", response.data.message || "Failed to delete role.");
//       }
//     } catch (error) {
//       console.error("Delete error:", error);
//       await useSwalErrorAlert("Error", "Failed to delete role.");
//     }
//   };

//   const resetForm = () => {
//     setRoleCode("");
//     setRoleName("");
//     setRoleActive("Y");
//     setEditingRole(null);
//     setIsEditing(false);
//   };

//   const handleEditRow = (index) => {
//     const role = roles[index];
//     setRoleCode(role.roleCode);
//     setRoleName(role.roleName);
//     setRoleActive(role.active);
//     setEditingRole(role);
//     setIsEditing(true);
//   };

//   const startNew = () => {
//     resetForm();
//     setIsEditing(true);
//   };

//    useImperativeHandle(ref, () => ({
//     add: startNew,
//     save: handleSaveRole,
//     reset: resetForm,
//   }));

//   return (
//     <div className="w-full">


//       {/* Two Columns Side by Side */}
//       <div className="flex flex-col md:flex-row gap-6">
//         {/* Form Column */}
//         <div className="w-full md:w-1/3">
//           <div className="global-ref-textbox-group-div-ui">
//             {/* Role Code */}
//             <div className="relative">
//               <input
//                 type="text"
//                 id="roleCode"
//                 placeholder=" "
//                 value={roleCode}
//                 onChange={(e) => setRoleCode(e.target.value.toUpperCase())}
//                 disabled={!isEditing || isEditingExisting}
//                 className={`peer global-ref-textbox-ui ${
//                   isEditing && !isEditingExisting ? "global-ref-textbox-enabled" : "global-ref-textbox-disabled"
//                 } ${isEditingExisting ? 'bg-blue-100 cursor-not-allowed' : ''}`}
//               />
//               <label htmlFor="roleCode" className={`global-ref-floating-label ${!isEditing ? "global-ref-label-disabled" : "global-ref-label-enabled"}`}>
//                 <span className="global-ref-asterisk-ui">*</span> Role Code
//               </label>
//             </div>

//             {/* Role Name */}
//             <div className="relative">
//               <input
//                 type="text"
//                 id="roleName"
//                 placeholder=" "
//                 value={roleName}
//                 onChange={(e) => setRoleName(e.target.value)}
//                 disabled={!isEditing}
//                 className={`peer global-ref-textbox-ui ${isEditing ? "global-ref-textbox-enabled" : "global-ref-textbox-disabled"}`}
//               />
//               <label htmlFor="roleName" className={`global-ref-floating-label ${!isEditing ? "global-ref-label-disabled" : "global-ref-label-enabled"}`}>
//                 <span className="global-ref-asterisk-ui">*</span> Role Name
//               </label>
//             </div>

//             {/* Active */}
//             <div className="relative">
//               <select
//                 id="active"
//                 value={active}
//                 onChange={(e) => setRoleActive(e.target.value)}
//                 disabled={!isEditing}
//                 className={`peer global-ref-textbox-ui ${isEditing ? "global-ref-textbox-enabled" : "global-ref-textbox-disabled"}`}
//               >
//                 <option value="Y">Yes</option>
//                 <option value="N">No</option>
//               </select>
//               <label htmlFor="active" className={`global-ref-floating-label ${!isEditing ? "global-ref-label-disabled" : "global-ref-label-enabled"}`}>Active?</label>
//               <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
//                 <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
//                 </svg>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Roles Table */}
//         <div className="w-full md:w-2/3">
//           <div className="global-ref-table-main-div-ui">
//             <div className="global-ref-table-main-sub-div-ui">
//               <div className="global-ref-table-div-ui">
//                 <table className="global-ref-table-div-ui">
//                   <thead className="global-ref-thead-div-ui">
//                     <tr>
//                       <th className="global-ref-th-ui">Role Code</th>
//                       <th className="global-ref-th-ui">Role Name</th>
//                       <th className="global-ref-th-ui">Status</th>
//                       <th className="global-ref-th-ui">Edit</th>
//                       <th className="global-ref-th-ui">Delete</th>
//                     </tr>
//                     {/* Filter row */}
//                     <tr>
//                       <th className="global-ref-th-ui">
//                         <input
//                           className="w-full global-ref-filterbox-ui global-ref-filterbox-enabled"
//                           placeholder="Filter…"
//                           value={columnFilters.code}
//                           onChange={(e) => { setColumnFilters(s => ({ ...s, code: e.target.value })); setPage(1); }}
//                         />
//                       </th>
//                       <th className="global-ref-th-ui">
//                         <input
//                           className="w-full global-ref-filterbox-ui global-ref-filterbox-enabled"
//                           placeholder="Filter…"
//                           value={columnFilters.description}
//                           onChange={(e) => { setColumnFilters(s => ({ ...s, description: e.target.value })); setPage(1); }}
//                         />
//                       </th>
//                       <th className="global-ref-th-ui">
//                         <select
//                           className="w-full global-ref-filterbox-ui global-ref-filterbox-enabled"
//                           value={columnFilters.active}
//                           onChange={(e) => { setColumnFilters(s => ({ ...s, active: e.target.value })); setPage(1); }}
//                         >
//                           <option value="">All</option>
//                           <option value="Y">Yes</option>
//                           <option value="N">No</option>
//                         </select>
//                       </th>
//                       <th className="global-ref-th-ui"></th>
//                       <th className="global-ref-th-ui"></th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {roles.length > 0 ? (
//                       roles.map((role, index) => (
//                         <tr
//                           key={index}
//                           className={`global-tran-tr-ui ${editingRole?.roleCode === role.roleCode ? 'bg-blue-50' : ''}`}
//                           onClick={() => handleEditRow(index)}
//                         >
//                           <td className="global-ref-td-ui">{role.roleCode}</td>
//                           <td className="global-ref-td-ui">{role.roleName || "-"}</td>
//                           <td className="global-ref-td-ui text-center">
//                             <span
//                               className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${
//                                 role.active === "Y"
//                                   ? "bg-green-100 text-green-800"
//                                   : "bg-red-100 text-red-800"
//                               }`}
//                             >
//                               {role.active === "Y" ? "Yes" : "No"}
//                             </span>
//                           </td>
//                           <td className="global-ref-td-ui text-center sticky right-10">
//                             <button
//                               onClick={(e) => {
//                                 e.stopPropagation();
//                                 handleEditRow(index);
//                               }}
//                               className="global-ref-td-button-edit-ui"
//                             >
//                               <FontAwesomeIcon icon={faEdit} />
//                             </button>
//                           </td>
//                           <td className="global-ref-td-ui text-center sticky right-0">
//                             <button
//                               onClick={(e) => {
//                                 e.stopPropagation();
//                                 handleDeleteRole(index);
//                               }}
//                               className="global-ref-td-button-delete-ui"
//                             >
//                               <FontAwesomeIcon icon={faTrashAlt} />
//                             </button>
//                           </td>
//                         </tr>
//                       ))
//                      ) : (
//                       <tr>
//                         <td colSpan="5" className="global-ref-norecords-ui">
//                           No User Roles found
//                         </td>
//                       </tr>
//                     )}
//                   </tbody>
//                 </table>

//                 {/* Pagination */}
//                 <div className="flex items-center justify-between p-3">
//                   <div className="text-xs opacity-80 font-semibold">
//                     Total Records: {filtered.length}
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <select
//                       className="px-7 py-2 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
//                       value={pageSize}
//                       onChange={(e) => {
//                         setPageSize(Number(e.target.value));
//                         setPage(1);
//                       }}
//                     >
//                       {[10, 20, 50, 100].map((n) => (
//                         <option key={n} value={n}>
//                           {n}/page
//                         </option>
//                       ))}
//                     </select>
//                     <div className="text-xs opacity-80 font-semibold">
//                       Page {page} of {totalPages}
//                     </div>
//                     <button
//                       disabled={page <= 1}
//                       onClick={() => setPage((p) => Math.max(1, p - 1))}
//                       className="px-7 py-2 text-xs font-medium text-white bg-blue-800 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
//                     >
//                       Prev
//                     </button>
//                     <button
//                       disabled={page >= totalPages}
//                       onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
//                       className="px-7 py-2 text-xs font-medium text-white bg-blue-800 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
//                     >
//                       Next
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// });

// export default UsersTab;

// import {
//   useEffect,
//   useMemo,
//   useState,
//   forwardRef,
//   useImperativeHandle,
// } from "react";
// import { apiClient } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faEdit, faTrashAlt } from "@fortawesome/free-solid-svg-icons";

// import {
//   useSwalErrorAlert,
//   useSwalSuccessAlert,
//   useSwalDeleteConfirm,
//   useSwalDeleteSuccess,
// } from "@/NAYSA Cloud/Global/behavior";

// const UsersTab = forwardRef(
//   ({ roles = [], fetchRoles, user, saving, setSaving }, ref) => {
//     const [isEditing, setIsEditing] = useState(false);
//     const [roleCode, setRoleCode] = useState("");
//     const [roleName, setRoleName] = useState("");
//     const [active, setRoleActive] = useState("Y");
//     const [editingRole, setEditingRole] = useState(null);

//     // Table helpers
//     const [query, setQuery] = useState("");
//     const [sortBy, setSortBy] = useState("roleCode");
//     const [sortDir, setSortDir] = useState("asc");
//     const [page, setPage] = useState(1);
//     const [pageSize, setPageSize] = useState(10);

//     // Per-column filters
//     const [columnFilters, setColumnFilters] = useState({
//       code: "",
//       description: "",
//       active: "",
//     });

//     const isEditingExisting = !!editingRole;

//     useEffect(() => {
//       const onKey = (e) => {
//         if (e.ctrlKey && e.key.toLowerCase() === "s") {
//           e.preventDefault();
//           if (!saving && isEditing) handleSaveRole();
//         }
//       };

//       window.addEventListener("keydown", onKey);
//       return () => window.removeEventListener("keydown", onKey);
//     }, [saving, isEditing, roleCode, roleName, active, editingRole]);

//     const includesCI = (str, searchValue) =>
//       String(str || "").toLowerCase().includes(String(searchValue || "").toLowerCase());

//     const handleSort = (field) => {
//       if (sortBy === field) {
//         setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
//       } else {
//         setSortBy(field);
//         setSortDir("asc");
//       }
//       setPage(1);
//     };

//     const filtered = useMemo(() => {
//       const q = query.trim().toLowerCase();

//       const base = q
//         ? roles.filter((r) =>
//           [r.roleCode, r.roleName, r.active === "Y" ? "Yes" : "No"].some((x) =>
//             String(x || "").toLowerCase().includes(q)
//           )
//         )
//         : roles;

//       const withColumnFilters = base.filter((r) => {
//         if (columnFilters.code && !includesCI(r.roleCode, columnFilters.code)) return false;
//         if (columnFilters.description && !includesCI(r.roleName, columnFilters.description))
//           return false;
//         if (
//           columnFilters.active &&
//           String(r.active ?? "").toUpperCase() !== String(columnFilters.active).toUpperCase()
//         )
//           return false;

//         return true;
//       });

//       const factor = sortDir === "asc" ? 1 : -1;

//       return [...withColumnFilters].sort((a, b) => {
//         const aVal = String(a?.[sortBy] ?? "").toLowerCase();
//         const bVal = String(b?.[sortBy] ?? "").toLowerCase();
//         return aVal.localeCompare(bVal) * factor;
//       });
//     }, [roles, query, columnFilters, sortBy, sortDir]);

//     const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

//     const pageRows = useMemo(() => {
//       const start = (page - 1) * pageSize;
//       return filtered.slice(start, start + pageSize);
//     }, [filtered, page, pageSize]);

//     useEffect(() => {
//       if (page > totalPages) {
//         setPage(totalPages);
//       }
//     }, [page, totalPages]);

//     const resetForm = () => {
//       setRoleCode("");
//       setRoleName("");
//       setRoleActive("Y");
//       setEditingRole(null);
//       setIsEditing(false);
//     };

//     const handleEditRow = (role) => {
//       setRoleCode(role?.roleCode || "");
//       setRoleName(role?.roleName || "");
//       setRoleActive(role?.active || "Y");
//       setEditingRole(role || null);
//       setIsEditing(true);
//     };

//     const startNew = () => {
//       resetForm();
//       setIsEditing(true);
//     };

//     const handleSaveRole = async () => {
//       if (saving) return;

//       if (!roleCode?.trim() || !roleName?.trim()) {
//         await useSwalErrorAlert("Error!", "Please fill out Role Code and Role Name.");
//         return;
//       }

//       setSaving(true);

//       try {
//         const payload = {
//           roleCode: String(roleCode).trim().toUpperCase(),
//           roleName: String(roleName).trim(),
//           active: active || "Y",
//           userCode: user?.USER_CODE || "",
//         };

//         const { data: res } = await apiClient.post("/upsertRole", {
//           json_data: { json_data: payload },
//         });

//         if (res?.data?.status === "success") {
//           await useSwalSuccessAlert("Success!", "Role saved successfully!");
//           await fetchRoles?.();
//           resetForm();
//         } else {
//           await useSwalErrorAlert(
//             "Error!",
//             res?.data?.message || "Something went wrong while saving the role."
//           );
//         }
//       } catch (e) {
//         console.error("Error saving role:", e);
//         await useSwalErrorAlert(
//           "Error!",
//           e?.response?.data?.message || "Error saving role. Please check the console for details."
//         );
//       } finally {
//         setSaving(false);
//       }
//     };

//     const handleDeleteRole = async (role) => {
//       if (!role?.roleCode) return;

//       const confirm = await useSwalDeleteConfirm(
//         "Delete this role?",
//         `Code: ${role.roleCode} | Description: ${role.roleName || ""}`,
//         "Yes, delete it"
//       );

//       if (!confirm?.isConfirmed) return;

//       try {
//         const { data: response } = await apiClient.post("/deleteRole", {
//           ROLE_CODE: role.roleCode,
//         });

//         if (response?.data?.status === "success") {
//           await useSwalDeleteSuccess();
//           await fetchRoles?.();

//           if (editingRole?.roleCode === role.roleCode) {
//             resetForm();
//           }
//         } else {
//           await useSwalErrorAlert(
//             "Error",
//             response?.data?.message || "Failed to delete role."
//           );
//         }
//       } catch (error) {
//         console.error("Delete error:", error);
//         await useSwalErrorAlert("Error", "Failed to delete role.");
//       }
//     };

//     useImperativeHandle(ref, () => ({
//       add: startNew,
//       save: handleSaveRole,
//       reset: resetForm,
//     }));

//     const renderSortIcon = (field) => {
//       if (sortBy !== field) return "↕";
//       return sortDir === "asc" ? "↑" : "↓";
//     };

//     return (
//       <div className="w-full">
//         <div className="flex flex-col xl:flex-row gap-4 lg:gap-6">
//           {/* FORM COLUMN */}
//           <div className="w-full xl:w-[32%]">
//             <div className="bg-white rounded-xl p-3 sm:p-4">
//               <div className="global-ref-textbox-group-div-ui">
//                 {/* Role Code */}
//                 <div className="relative">
//                   <input
//                     type="text"
//                     id="roleCode"
//                     placeholder=" "
//                     value={roleCode}
//                     onChange={(e) => setRoleCode(e.target.value.toUpperCase())}
//                     disabled={!isEditing || isEditingExisting}
//                     className={`peer global-ref-textbox-ui ${isEditing && !isEditingExisting
//                       ? "global-ref-textbox-enabled"
//                       : "global-ref-textbox-disabled"
//                       } ${isEditingExisting ? "bg-blue-100 cursor-not-allowed" : ""}`}
//                   />
//                   <label
//                     htmlFor="roleCode"
//                     className={`global-ref-floating-label ${!isEditing ? "global-ref-label-disabled" : "global-ref-label-enabled"
//                       }`}
//                   >
//                     <span className="global-ref-asterisk-ui">*</span> Role Code
//                   </label>
//                 </div>

//                 {/* Role Name */}
//                 <div className="relative">
//                   <input
//                     type="text"
//                     id="roleName"
//                     placeholder=" "
//                     value={roleName}
//                     onChange={(e) => setRoleName(e.target.value)}
//                     disabled={!isEditing}
//                     className={`peer global-ref-textbox-ui ${isEditing
//                       ? "global-ref-textbox-enabled"
//                       : "global-ref-textbox-disabled"
//                       }`}
//                   />
//                   <label
//                     htmlFor="roleName"
//                     className={`global-ref-floating-label ${!isEditing ? "global-ref-label-disabled" : "global-ref-label-enabled"
//                       }`}
//                   >
//                     <span className="global-ref-asterisk-ui">*</span> Role Name
//                   </label>
//                 </div>

//                 {/* Active */}
//                 <div className="relative">
//                   <select
//                     id="active"
//                     value={active}
//                     onChange={(e) => setRoleActive(e.target.value)}
//                     disabled={!isEditing}
//                     className={`peer global-ref-textbox-ui appearance-none ${isEditing
//                       ? "global-ref-textbox-enabled"
//                       : "global-ref-textbox-disabled"
//                       }`}
//                   >
//                     <option value="Y">Yes</option>
//                     <option value="N">No</option>
//                   </select>

//                   <label
//                     htmlFor="active"
//                     className={`global-ref-floating-label ${!isEditing ? "global-ref-label-disabled" : "global-ref-label-enabled"
//                       }`}
//                   >
//                     Active?
//                   </label>

//                   <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
//                     <svg
//                       className="h-4 w-4 text-gray-500"
//                       fill="none"
//                       stroke="currentColor"
//                       strokeWidth="2"
//                       viewBox="0 0 24 24"
//                     >
//                       <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
//                     </svg>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* TABLE COLUMN */}
//           <div className="w-full xl:w-[68%] min-w-0">
//             <div className="global-ref-table-main-div-ui">
//               <div className="global-ref-table-main-sub-div-ui">
//                 <div className="global-ref-table-div-ui">
//                   {/* SEARCH */}
//                   <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2 sm:p-3">
//                     <div className="text-sm font-semibold text-slate-700">
//                       User Roles List
//                     </div>

//                     <div className="w-full sm:w-auto">
//                       <input
//                         type="text"
//                         value={query}
//                         onChange={(e) => {
//                           setQuery(e.target.value);
//                           setPage(1);
//                         }}
//                         placeholder="Search roles..."
//                         className="w-full sm:w-64 h-9 px-3 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-300"
//                       />
//                     </div>
//                   </div>

//                   {/* TABLE WRAPPER */}
//                   <div className="w-full overflow-x-auto">
//                     <table className="min-w-[720px] w-full border-collapse">
//                       <thead className="global-ref-thead-div-ui">
//                         <tr>
//                           <th
//                             className="global-ref-th-ui cursor-pointer select-none"
//                             onClick={() => handleSort("roleCode")}
//                           >
//                             <div className="flex items-center justify-between gap-2">
//                               <span>Role Code</span>
//                               <span className="text-[10px]">{renderSortIcon("roleCode")}</span>
//                             </div>
//                           </th>

//                           <th
//                             className="global-ref-th-ui cursor-pointer select-none"
//                             onClick={() => handleSort("roleName")}
//                           >
//                             <div className="flex items-center justify-between gap-2">
//                               <span>Role Name</span>
//                               <span className="text-[10px]">{renderSortIcon("roleName")}</span>
//                             </div>
//                           </th>

//                           <th
//                             className="global-ref-th-ui cursor-pointer select-none"
//                             onClick={() => handleSort("active")}
//                           >
//                             <div className="flex items-center justify-between gap-2">
//                               <span>Status</span>
//                               <span className="text-[10px]">{renderSortIcon("active")}</span>
//                             </div>
//                           </th>

//                           <th className="global-ref-th-ui text-center w-[70px]">Edit</th>
//                           <th className="global-ref-th-ui text-center w-[80px]">Delete</th>
//                         </tr>

//                         <tr>
//                           <th className="global-ref-th-ui">
//                             <input
//                               className="w-full min-w-0 global-ref-filterbox-ui global-ref-filterbox-enabled text-xs"
//                               placeholder="Filter..."
//                               value={columnFilters.code}
//                               onChange={(e) => {
//                                 setColumnFilters((s) => ({ ...s, code: e.target.value }));
//                                 setPage(1);
//                               }}
//                             />
//                           </th>

//                           <th className="global-ref-th-ui">
//                             <input
//                               className="w-full min-w-0 global-ref-filterbox-ui global-ref-filterbox-enabled text-xs"
//                               placeholder="Filter..."
//                               value={columnFilters.description}
//                               onChange={(e) => {
//                                 setColumnFilters((s) => ({
//                                   ...s,
//                                   description: e.target.value,
//                                 }));
//                                 setPage(1);
//                               }}
//                             />
//                           </th>

//                           <th className="global-ref-th-ui">
//                             <select
//                               className="w-full min-w-0 global-ref-filterbox-ui global-ref-filterbox-enabled text-xs"
//                               value={columnFilters.active}
//                               onChange={(e) => {
//                                 setColumnFilters((s) => ({ ...s, active: e.target.value }));
//                                 setPage(1);
//                               }}
//                             >
//                               <option value="">All</option>
//                               <option value="Y">Yes</option>
//                               <option value="N">No</option>
//                             </select>
//                           </th>

//                           <th className="global-ref-th-ui"></th>
//                           <th className="global-ref-th-ui"></th>
//                         </tr>
//                       </thead>

//                       <tbody>
//                         {pageRows.length > 0 ? (
//                           pageRows.map((role, index) => (
//                             <tr
//                               key={`${role.roleCode}-${index}`}
//                               className={`global-tran-tr-ui cursor-pointer ${editingRole?.roleCode === role.roleCode ? "bg-blue-50" : ""
//                                 }`}
//                               onClick={() => handleEditRow(role)}
//                             >
//                               <td className="global-ref-td-ui whitespace-nowrap">
//                                 {role.roleCode}
//                               </td>

//                               <td className="global-ref-td-ui">
//                                 <div className="truncate max-w-[220px] sm:max-w-none">
//                                   {role.roleName || "-"}
//                                 </div>
//                               </td>

//                               <td className="global-ref-td-ui text-center whitespace-nowrap">
//                                 <span
//                                   className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${role.active === "Y"
//                                     ? "bg-green-100 text-green-800"
//                                     : "bg-red-100 text-red-800"
//                                     }`}
//                                 >
//                                   {role.active === "Y" ? "Yes" : "No"}
//                                 </span>
//                               </td>

//                               <td className="global-ref-td-ui text-center whitespace-nowrap">
//                                 <button
//                                   onClick={(e) => {
//                                     e.stopPropagation();
//                                     handleEditRow(role);
//                                   }}
//                                   className="global-ref-td-button-edit-ui"
//                                 >
//                                   <FontAwesomeIcon icon={faEdit} />
//                                 </button>
//                               </td>

//                               <td className="global-ref-td-ui text-center whitespace-nowrap">
//                                 <button
//                                   onClick={(e) => {
//                                     e.stopPropagation();
//                                     handleDeleteRole(role);
//                                   }}
//                                   className="global-ref-td-button-delete-ui"
//                                 >
//                                   <FontAwesomeIcon icon={faTrashAlt} />
//                                 </button>
//                               </td>
//                             </tr>
//                           ))
//                         ) : (
//                           <tr>
//                             <td colSpan="5" className="global-ref-norecords-ui">
//                               No User Roles found
//                             </td>
//                           </tr>
//                         )}
//                       </tbody>
//                     </table>
//                   </div>

//                   {/* PAGINATION */}
//                   <div className="p-3 border-t border-gray-100 dark:border-gray-700">
//                     <div className="flex items-center justify-between gap-2">
//                       <div className="text-xs font-semibold text-slate-700 whitespace-nowrap shrink-0">
//                         Total Records: {filtered.length}
//                       </div>

//                       <div className="flex items-center gap-2 shrink-0">
//                         <select
//                           className="h-8 w-[84px] px-2 text-[11px] font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
//                           value={pageSize}
//                           onChange={(e) => {
//                             setPageSize(Number(e.target.value));
//                             setPage(1);
//                           }}
//                         >
//                           {[10, 20, 50, 100].map((n) => (
//                             <option key={n} value={n}>
//                               {n}/page
//                             </option>
//                           ))}
//                         </select>

//                         <div className="h-8 px-1 flex items-center justify-center text-xs font-semibold text-slate-700 whitespace-nowrap leading-none">
//                           {page}/{totalPages}
//                         </div>

//                         <button
//                           disabled={page <= 1}
//                           onClick={() => setPage((p) => Math.max(1, p - 1))}
//                           className="h-8 w-[70px] text-[11px] font-medium text-white bg-blue-800 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
//                         >
//                           Prev
//                         </button>

//                         <button
//                           disabled={page >= totalPages}
//                           onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
//                           className="h-8 w-[70px] text-[11px] font-medium text-white bg-blue-800 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
//                         >
//                           Next
//                         </button>
//                       </div>
//                     </div>
//                   </div>
//                   {/* END PAGINATION */}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }
// );

// export default UsersTab;
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, Trash2 } from "lucide-react";

import { apiClient } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";
import {
  useSwalErrorAlert,
  useSwalSuccessAlert,
  useSwalDeleteConfirm,
  useSwalDeleteRecord,
} from "@/NAYSA Cloud/Global/behavior";

import SearchGlobalReferenceTable from "@/NAYSA Cloud/Lookup/SearchGlobalReferenceTable";
import FieldRenderer from "@/NAYSA Cloud/Global/FieldRenderer.jsx";

const extractRows = (payload) => {
  const res =
    payload?.data?.data?.[0]?.result ??
    payload?.data?.result ??
    payload?.data?.data;

  if (!res) return [];
  if (Array.isArray(res)) return res;

  if (typeof res === "string") {
    try {
      return JSON.parse(res) || [];
    } catch {
      return [];
    }
  }

  return [];
};

const DEFAULT_FORM = {
  roleCode: "",
  roleName: "",
  active: "Y",
  registeredBy: "",
  registeredDate: "",
  lastUpdatedBy: "",
  lastUpdatedDate: "",
  __existing: false,
};

const UsersTab = forwardRef(
  ({ roles = [], fetchRoles, user, saving, setSaving }, ref) => {
    const queryClient = useQueryClient();
    const codeInputRef = useRef(null);
    const enterValidatedRef = useRef(false);

    const userCode =
      user?.USER_CODE || user?.USERCODE || user?.userCode || user?.code || "ADMIN";

    const [form, setForm] = useState(DEFAULT_FORM);
    const [selectedRow, setSelectedRow] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isDupCode, setIsDupCode] = useState(false);
    const [search, setSearch] = useState("");

    const setField = (key, value) =>
      setForm((prev) => ({ ...prev, [key]: value }));

    const resetForm = useCallback((next = DEFAULT_FORM) => {
      setForm(next);
    }, []);

    const isEditingExisting = !!form.__existing;

    useEffect(() => {
      const onKey = (e) => {
        if (e.ctrlKey && e.key.toLowerCase() === "s") {
          e.preventDefault();
          if (!saveMutation.isPending && isEditing) {
            handleSave();
          }
        }
      };

      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [isEditing, form]);

    /* ================= LOAD LIST ================= */

    const roleListQuery = useQuery({
      queryKey: ["accessRightsRoleList"],
      queryFn: async () => {
        if (typeof fetchRoles === "function") {
          const result = await fetchRoles();
          return Array.isArray(result) ? result : roles || [];
        }

        const res = await apiClient.get("/loadRole");
        return extractRows(res);
      },
      initialData: Array.isArray(roles) ? roles : [],
    });

    const roleList = useMemo(() => {
      if (Array.isArray(roles) && roles.length > 0) return roles;
      return roleListQuery.data || [];
    }, [roles, roleListQuery.data]);

    /* ================= DUPLICATE CHECK ================= */

    const checkDuplicate = async (roleCode) => {
      const c = String(roleCode || "").trim();
      if (!c) return false;

      const res = await apiClient.get("/checkDuplicateRole", {
        params: { ROLE_CODE: c },
      });

      const raw =
        res?.data?.data?.raw?.[0]?.result ??
        `{"result":"${res?.data?.data?.result ?? "0"}"}`;

      let parsed = { result: "0" };
      try {
        parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      } catch {
        parsed = { result: String(res?.data?.data?.result ?? "0") };
      }

      return String(parsed?.result) === "1";
    };

    const checkInUsed = async (roleCode) => {
      const c = String(roleCode || "").trim();
      if (!c) return false;

      const res = await apiClient.get("/checkInUsedRole", {
        params: { ROLE_CODE: c },
      });

      const raw =
        res?.data?.data?.raw?.[0]?.result ??
        `{"result":"${res?.data?.data?.result ?? "0"}"}`;

      let parsed = { result: "0" };
      try {
        parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      } catch {
        parsed = { result: String(res?.data?.data?.result ?? "0") };
      }

      return String(parsed?.result) === "1";
    };

    /* ================= VALIDATE CODE ================= */

    const handleCodeValidate = async (arg) => {
      const isEvent = arg && typeof arg === "object" && "type" in arg;

      if (isEvent && arg.type === "keydown") {
        if (arg.key !== "Enter") return;
        enterValidatedRef.current = true;
      }

      if (isEvent && arg.type === "blur" && enterValidatedRef.current) {
        enterValidatedRef.current = false;
        return;
      }

      const code = String(form.roleCode || "").trim();
      if (!code || !isEditing || form.__existing) return;

      const dup = await checkDuplicate(code);

      if (dup) {
        setIsDupCode(true);
        await useSwalErrorAlert(
          "Duplicate Entry",
          `Role Code "${code}" already exists.`
        );
        setField("roleCode", "");
        setTimeout(() => codeInputRef.current?.focus?.(), 0);
      } else {
        setIsDupCode(false);
      }
    };

    /* ================= SAVE ================= */

    const saveMutation = useMutation({
      mutationFn: async (payload) => {
        return apiClient.post("/upsertRole", {
          json_data: {
            roleCode: payload.roleCode,
            roleName: payload.roleName,
            active: payload.active,
            userCode: payload.userCode,
          },
        });
      },
      onSuccess: async (response) => {
        const row = response?.data?.data || {};
        const errorcount = Number(row?.errorcount ?? 0);
        const errormsg = String(row?.errormsg ?? "");

        if (errorcount > 0) {
          await useSwalErrorAlert(
            "Validation Error",
            errormsg || "Please fill in the required field(s)."
          );
          return;
        }

        await queryClient.invalidateQueries({ queryKey: ["accessRightsRoleList"] });
        if (typeof fetchRoles === "function") {
          await fetchRoles();
        }

        await useSwalSuccessAlert("Success!", "Role saved successfully.");

        setIsEditing(false);
        setSelectedRow(null);
        setIsDupCode(false);
        resetForm(DEFAULT_FORM);
      },
      onError: async (error) => {
        const msg =
          error?.response?.data?.message ||
          error?.response?.data?.errormsg ||
          error?.message ||
          "Failed to save role.";

        await useSwalErrorAlert("Validation Error", msg);
      },
    });

    const handleSave = useCallback(() => {
      if (!isEditing || saveMutation.isPending || isDupCode) return;

      const payload = {
        roleCode: String(form.roleCode || "").trim().toUpperCase(),
        roleName: String(form.roleName || "").trim(),
        active: form.active === "N" ? "N" : "Y",
        userCode,
      };

      saveMutation.mutate(payload);
    }, [form, isEditing, saveMutation, isDupCode, userCode]);

    /* ================= DELETE ================= */

    const deleteMutation = useMutation({
      mutationFn: async (role) => {
        return apiClient.post("/deleteRole", {
          json_data: {
            roleCode: role.roleCode,
            roleName: role.roleName || "",
            userCode,
          },
        });
      },
      onSuccess: async (response) => {
        const sqlRow = response?.data?.data?.[0] || {};
        const errorcount = Number(sqlRow.errorcount ?? 0);
        const errormsg = String(sqlRow.errormsg ?? "");

        if (errorcount > 0) {
          await useSwalErrorAlert("Error", errormsg);
          return;
        }

        await queryClient.invalidateQueries({ queryKey: ["accessRightsRoleList"] });
        if (typeof fetchRoles === "function") {
          await fetchRoles();
        }

        await useSwalDeleteRecord("Deleted");

        resetForm(DEFAULT_FORM);
        setIsEditing(false);
        setSelectedRow(null);
      },
      onError: async (error) => {
        const msg =
          error?.response?.data?.message ||
          error?.response?.data?.errormsg ||
          error?.message ||
          "Failed to delete role.";

        await useSwalErrorAlert("Error", msg);
      },
    });

    const handleDelete = useCallback(
      async (row) => {
        const code = row?.roleCode;
        if (!code) return;

        const used = await checkInUsed(code);

        if (used) {
          return useSwalErrorAlert(
            "Cannot Delete",
            `Role Code "${code}" is already in use.`
          );
        }

        const confirm = await useSwalDeleteConfirm(
          "Delete Record?",
          `Are you sure you want to delete "${code}"?`
        );

        if (!confirm?.isConfirmed) return;

        deleteMutation.mutate(row);
      },
      [deleteMutation]
    );

    /* ================= EDIT ================= */

    const handleEdit = async (row) => {
      try {
        const res = await apiClient.get("/getRole", {
          params: { ROLE_CODE: row.roleCode },
        });

        const record = extractRows(res)?.[0];
        setForm({ ...DEFAULT_FORM, ...record, __existing: true });
        setIsEditing(true);
        setSelectedRow(row);
      } catch {
        await useSwalErrorAlert("Error", "Could not fetch record.");
      }
    };

    /* ================= TABLE ================= */

    const tableColumns = useMemo(
      () => [
        {
          key: "__actions",
          label: "Actions",
          sortable: false,
          width: 160,
          render: (row) => (
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(row);
                }}
                className="p-1 rounded-md bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white transition-colors"
                title="Edit"
              >
                <Edit size={16} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(row);
                }}
                className="p-1 rounded-md bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white transition-colors"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ),
        },
        {
          key: "roleCode",
          label: "Role Code",
          sortable: true,
          width: 260,
        },
        {
          key: "roleName",
          label: "Role Name",
          sortable: true,
          width: 620,
        },
        {
          key: "active",
          label: "Status",
          sortable: true,
          width: 200,
          render: (row) => (
            <span
              className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${row.active === "Y"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
                }`}
            >
              {row.active === "Y" ? "Yes" : "No"}
            </span>
          ),
        },
      ],
      [handleEdit, handleDelete]
    );
    const tableData = useMemo(
      () =>
        (Array.isArray(roleList) ? roleList : [])
          .filter((row) => {
            const s = String(search || "").trim().toLowerCase();
            if (!s) return true;

            return (
              String(row?.roleCode || "").toLowerCase().includes(s) ||
              String(row?.roleName || "").toLowerCase().includes(s) ||
              String(row?.active || "").toLowerCase().includes(s)
            );
          })
          .map((row, index) => ({
            ...row,
            __idx: index,
          })),
      [roleList, search]
    );

    /* ================= EXPOSE TO PARENT ================= */

    useImperativeHandle(ref, () => ({
      add: () => {
        setIsEditing(true);
        setSelectedRow(null);
        setIsDupCode(false);
        resetForm(DEFAULT_FORM);
        setTimeout(() => codeInputRef.current?.focus?.(), 0);
      },
      save: handleSave,
      reset: () => {
        resetForm(DEFAULT_FORM);
        setIsEditing(false);
        setSelectedRow(null);
        setIsDupCode(false);
      },
    }));

    return (
      <div className="w-full">
        <div className="flex flex-col xl:flex-row items-start gap-4 xl:gap-3">
          {/* FORM COLUMN */}
          <div className="w-full xl:w-[380px] xl:flex-shrink-0">
            <div className="w-full bg-white rounded-xl p-3 sm:p-4 border border-gray-100 shadow-sm">
              <div className="space-y-4">
                <FieldRenderer
                  label="Role Code"
                  required
                  type="text"
                  inputRef={codeInputRef}
                  value={form.roleCode}
                  onChange={(e) =>
                    setField("roleCode", String(e.target.value || "").toUpperCase())
                  }
                  onBlur={handleCodeValidate}
                  onKeyDown={handleCodeValidate}
                  disabled={!isEditing || form.__existing}
                />

                <FieldRenderer
                  label="Role Name"
                  required
                  type="text"
                  value={form.roleName}
                  onChange={(e) => setField("roleName", e.target.value)}
                  disabled={!isEditing}
                />

                <FieldRenderer
                  label="Active?"
                  type="select"
                  value={form.active}
                  onChange={(e) => setField("active", e.target.value)}
                  disabled={!isEditing}
                  options={[
                    { value: "Y", label: "Yes" },
                    { value: "N", label: "No" },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* TABLE COLUMN */}
          <div className="w-full xl:flex-1 min-w-0 flex xl:justify-center">
            <div className="w-full xl:w-[900px]">
              <SearchGlobalReferenceTable
                docType="UserAccRight"
                columns={tableColumns}
                data={tableData}
                itemsPerPage={10}
                showFilters={true}
                isLoading={roleListQuery.isLoading}
                onRowDoubleClick={handleEdit}
                onRowClick={(row) => setSelectedRow(row)}
                className="h-full"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default UsersTab;