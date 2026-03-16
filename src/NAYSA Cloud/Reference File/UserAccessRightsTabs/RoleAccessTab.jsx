// // RoleAccessTab.jsx — DB-driven menus via MenuController + role overlay via AccessRights sproc
// import { useState, forwardRef, useImperativeHandle, useMemo } from "react";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faEye, faSpinner, faList } from "@fortawesome/free-solid-svg-icons";
// import { apiClient } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";
// import { useAuth } from "@/NAYSA Cloud/Authentication/AuthContext.jsx";

// import {
//   useSwalSuccessAlert,
//   useSwalErrorAlert,
//   useSwalInfoAlert,
// } from "@/NAYSA Cloud/Global/behavior";


// const RoleAccessTab = forwardRef(({ roles }, ref) => {
//   const { user } = useAuth(); // expecting user?.userCode
//   const currentUserCode = useMemo(() => user?.userCode || user?.USER_CODE || "", [user]);

//   // left table (roles)
//   const [selectedRoles, setSelectedRoles] = useState([]);

//   // right table (menus)
//   const [menus, setMenus] = useState([]); // [{menuCode, menuName}]
//   const [checkedMenus, setCheckedMenus] = useState(new Set()); // Set<string>
//   const [showMenus, setShowMenus] = useState(false);

//   // UX
//   const [loadingMenus, setLoadingMenus] = useState(false);
//   const [saving, setSaving] = useState(false);




//   const loadRoleMenus = async (roleCode) => {
//     setLoadingMenus(true);
//     setShowMenus(false);
//     setMenus([]);
//     setCheckedMenus(new Set());

//     try {
//       const rc = String(roleCode ?? "").trim();
//       if (!rc) {
//         await useSwalErrorAlert("No Role Selected", "Please select one role to continue.");
//         return;
//       }

//       const { data } = await apiClient.get("/getRoleMenu", {
//         params: { ROLE_CODE: rc }  // <-- uppercase, matches controller validator
//       });

//       const rows =
//         Array.isArray(data?.data) && data.data[0]?.result
//           ? JSON.parse(data.data[0].result)
//           : Array.isArray(data?.data)
//             ? data.data
//             : Array.isArray(data)
//               ? data
//               : [];

//       setMenus(rows || []);
//       setCheckedMenus(
//         new Set(
//           (rows || [])
//             .filter((r) => Number(r?.selectedMenu) === 1 || r?.selectedMenu === true)
//             .map((r) => r?.menuCode)
//             .filter(Boolean)
//         )
//       );
//       setShowMenus(true);
//     } catch (err) {
//       console.error("getRoleMenu failed:", err);
//       const detail =
//         err?.response?.data?.message ||
//         err?.response?.data?.error ||
//         err?.response?.data?.errors?.[0]?.detail ||
//         err?.message ||
//         "Unable to load menus for the selected role.";
//       await useSwalErrorAlert("Error", detail);
//     } finally {
//       setLoadingMenus(false);
//     }
//   };



//   /** Header action: View Modules */
//   const handleViewMenus = async () => {
//     if (selectedRoles.length === 0) {
//       await useSwalErrorAlert("No Role Selected", "Please select one role to continue.");
//       return;
//     }
//     if (selectedRoles.length > 1) {
//       await useSwalErrorAlert("Multiple Roles Selected", "Please select only one role when configuring access.");
//       return;
//     }
//     await loadRoleMenus(selectedRoles[0]);
//   };

//   /** Header action: Save Access (AccessRights:UpsertRoleMenu) */
//   const handleSaveAccess = async () => {
//     if (selectedRoles.length !== 1) {
//       await useSwalErrorAlert("Select Exactly One Role", "Pick a single role, then click Save Access.");
//       return;
//     }
//     if (!showMenus) {
//       await useSwalErrorAlert("Nothing to Save", "Click View Modules first, then modify and save.");
//       return;
//     }

//     const rc = String(selectedRoles[0] ?? "").trim();
//     const dt1 = Array.from(checkedMenus).map((menuCode) => ({ menuCode }));

//     setSaving(true);
//     try {
//       // EXACT shape the controller/sproc reads:
//       const payload = { json_data: { roleCode: rc, dt1 } };

//       const { data: res } = await apiClient.post("/upsertRoleMenu", payload);

//       // many of your controllers return { success, data:{status}, message }
//       const ok =
//         res?.success === true ||
//         res?.data?.status === "success" ||
//         res?.message?.toLowerCase?.().includes("saved");

//       if (!ok) {
//         throw new Error(res?.message || "Error executing Role Menu Upsert.");
//       }

//       await useSwalSuccessAlert("Saved!", "Role menu access has been updated.");
//       await loadRoleMenus(rc);
//     } catch (err) {
//       console.error("UpsertRoleMenu failed:", err);
//       const detail =
//         err?.response?.data?.message ||
//         err?.response?.data?.error ||
//         err?.response?.data?.errors?.[0]?.detail ||
//         err?.message ||
//         "Error executing Role Menu Upsert.";
//       await useSwalErrorAlert("Save Failed", detail);
//     } finally {
//       setSaving(false);
//     }
//   };


//   /** Header action: Reset */
//   const handleReset = () => {
//     setSelectedRoles([]);
//     setMenus([]);
//     setCheckedMenus(new Set());
//     setShowMenus(false);
//   };

//   /** Expose actions to the header container (UserAccessRights.jsx) */
//   useImperativeHandle(ref, () => ({
//     viewModules: handleViewMenus,
//     saveAccess: handleSaveAccess,
//     reset: handleReset,
//   }));

//   /** Toggle a menu checkbox */
//   const toggleMenu = (menuCode) => {
//     setCheckedMenus((prev) => {
//       const next = new Set(prev);
//       if (next.has(menuCode)) next.delete(menuCode);
//       else next.add(menuCode);
//       return next;
//     });
//   };

//   /** Toggle all menu checkboxes */
//   const toggleSelectAllMenus = () => {
//     setCheckedMenus((prev) => {
//       if (menus.length > 0 && prev.size === menus.length) {
//         return new Set();
//       }
//       return new Set(menus.map((m) => m.menuCode).filter(Boolean));
//     });
//   };

//   return (
//     <div className="w-full">
//       <div className="flex flex-col md:flex-row gap-6">
//         {/* Roles (left) */}
//         <div className="w-full md:w-1/3">
//           <h2 className="text-lg font-semibold mb-2 text-gray-700">Roles</h2>
//           <div className="global-ref-table-main-div-ui">
//             <div className="global-ref-table-main-sub-div-ui">
//               <div className="global-ref-table-div-ui">
//                 <table className="global-ref-table-div-ui">
//                   <thead className="global-ref-thead-div-ui">
//                     <tr>
//                       <th className="global-ref-th-ui">Role Code</th>
//                       <th className="global-ref-th-ui">Role Name</th>
//                       <th className="global-ref-th-ui text-center">Select</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {roles?.length ? (
//                       roles.map((role, idx) => (
//                         <tr key={role.roleCode ?? idx} className="global-tran-tr-ui">
//                           <td className="global-ref-td-ui">{role.roleCode}</td>
//                           <td className="global-ref-td-ui">{role.roleName}</td>
//                           <td className="global-ref-td-ui text-center">
//                             <input
//                               type="checkbox"
//                               className="h-3 w-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
//                               checked={selectedRoles.includes(role.roleCode)}
//                               onChange={() =>
//                                 setSelectedRoles((prev) =>
//                                   prev.includes(role.roleCode)
//                                     ? prev.filter((rc) => rc !== role.roleCode)
//                                     : [...prev, role.roleCode]
//                                 )
//                               }
//                             />
//                           </td>
//                         </tr>
//                       ))
//                     ) : (
//                       <tr>
//                         <td colSpan="3" className="global-ref-norecords-ui">
//                           No roles found
//                         </td>
//                       </tr>
//                     )}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           </div>

//           {selectedRoles.length > 0 && (
//             <div className="mt-3 bg-blue-50 p-2 rounded text-xs">
//               {selectedRoles.length === 1
//                 ? `Selected role: ${selectedRoles[0]}`
//                 : `Selected roles: ${selectedRoles.join(", ")}`}
//             </div>
//           )}
//         </div>

//         {/* Menus (right) */}
//         <div className="w-full md:w-2/3">
//           <h2 className="text-lg font-semibold mb-2 text-gray-700">Menus (Access Rights)</h2>
//           <div className="global-ref-table-main-div-ui">
//             <div className="global-ref-table-main-sub-div-ui">
//               <div className="global-ref-table-div-ui">

//                 {!showMenus ? (
//                   // --- Match the 'Role selection hidden' design ---
//                   <div className="py-16 text-center text-gray-500 bg-gray-50 rounded-lg">
//                     <FontAwesomeIcon icon={faList} className="text-xl mb-2 text-gray-400" />
//                     <h3 className="font-medium text-sm mb-1">Module Selection Hidden</h3>
//                     <p className="text-xs">
//                       Select exactly one role and click <strong>View Modules</strong> to see and configure access rights.
//                     </p>
//                   </div>
//                 ) : (
//                   // --- Actual table when modules are visible ---
//                   <table className="global-ref-table-div-ui">
//                     <thead className="global-ref-thead-div-ui">
//                       <tr>
//                         <th className="global-ref-th-ui">Menu Code</th>
//                         <th className="global-ref-th-ui">Menu Name</th>
//                         <th className="global-ref-th-ui text-center">
//                           <div className="flex items-center justify-center gap-1">
//                             Access
//                             <input
//                               type="checkbox"
//                               className="h-3 w-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
//                               checked={menus.length > 0 && checkedMenus.size === menus.length}
//                               onChange={toggleSelectAllMenus}
//                             />
//                           </div>
//                         </th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {menus?.length ? (
//                         menus.map((m, i) => (
//                           <tr key={m.menuCode ?? i} className="global-tran-tr-ui">
//                             <td className="global-ref-td-ui">{m.menuCode}</td>
//                             <td className="global-ref-td-ui">{m.menuName}</td>
//                             <td className="global-ref-td-ui text-center">
//                               <input
//                                 type="checkbox"
//                                 className="h-3 w-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
//                                 checked={checkedMenus.has(m.menuCode)}
//                                 onChange={() => toggleMenu(m.menuCode)}
//                               />
//                             </td>
//                           </tr>
//                         ))
//                       ) : (
//                         <tr>
//                           <td colSpan="3" className="global-ref-norecords-ui">No menus found</td>
//                         </tr>
//                       )}
//                     </tbody>
//                   </table>
//                 )}

//               </div>
//             </div>
//           </div>

//           {showMenus && checkedMenus.size > 0 && (
//             <div className="mt-2 bg-green-50 p-2 rounded text-xs">
//               {`${checkedMenus.size} menu(s) selected for access.`}
//             </div>
//           )}
//         </div>

//       </div>

//       {(saving || loadingMenus) && (
//         <div className="fixed inset-0 z-[70] bg-black/20 backdrop-blur-sm flex items-center justify-center">
//           <div className="bg-white dark:bg-gray-800 rounded-xl px-6 py-4 shadow-xl text-sm">
//             <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
//             {saving ? "Saving…" : "Loading…"}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// });

// export default RoleAccessTab;

// RoleAccessTab.jsx — DB-driven menus via MenuController + role overlay via AccessRights sproc
import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useCallback,
} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faList,
  faArrowLeft,
  faShieldAlt,
  faCheckSquare,
  faSquare,
} from "@fortawesome/free-solid-svg-icons";
import { apiClient } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";
import { useAuth } from "@/NAYSA Cloud/Authentication/AuthContext.jsx";

import {
  useSwalSuccessAlert,
  useSwalErrorAlert,
} from "@/NAYSA Cloud/Global/behavior";

import SearchGlobalReferenceTable from "@/NAYSA Cloud/Lookup/SearchGlobalReferenceTable.jsx";

const RoleAccessTab = forwardRef(({ roles = [] }, ref) => {
  const { user } = useAuth();
  const currentUserCode = useMemo(
    () => user?.userCode || user?.USER_CODE || "",
    [user]
  );

  const [selectedRoles, setSelectedRoles] = useState([]);
  const [menus, setMenus] = useState([]);
  const [checkedMenus, setCheckedMenus] = useState(new Set());
  const [showMenus, setShowMenus] = useState(false);

  const [loadingMenus, setLoadingMenus] = useState(false);
  const [saving, setSaving] = useState(false);

  const [mobileStep, setMobileStep] = useState("roles");

  const selectedRoleDetails = useMemo(() => {
    return (Array.isArray(roles) ? roles : []).filter((r) =>
      selectedRoles.includes(r.roleCode)
    );
  }, [roles, selectedRoles]);

  const allRoleCodes = useMemo(
    () =>
      (Array.isArray(roles) ? roles : [])
        .map((r) => r.roleCode)
        .filter(Boolean),
    [roles]
  );

  const allRolesSelected =
    allRoleCodes.length > 0 && selectedRoles.length === allRoleCodes.length;

  const allMenuCodes = useMemo(
    () =>
      (Array.isArray(menus) ? menus : [])
        .map((m) => m.menuCode)
        .filter(Boolean),
    [menus]
  );

  const allMenusSelected =
    allMenuCodes.length > 0 && checkedMenus.size === allMenuCodes.length;

  const loadRoleMenus = async (roleCode) => {
    setLoadingMenus(true);
    setShowMenus(false);
    setMenus([]);
    setCheckedMenus(new Set());

    try {
      const rc = String(roleCode ?? "").trim();
      if (!rc) {
        await useSwalErrorAlert(
          "No Role Selected",
          "Please select one role to continue."
        );
        return;
      }

      const { data } = await apiClient.get("/getRoleMenu", {
        params: { ROLE_CODE: rc },
      });

      const rows =
        Array.isArray(data?.data) && data.data[0]?.result
          ? JSON.parse(data.data[0].result)
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data)
              ? data
              : [];

      setMenus(rows || []);
      setCheckedMenus(
        new Set(
          (rows || [])
            .filter(
              (r) => Number(r?.selectedMenu) === 1 || r?.selectedMenu === true
            )
            .map((r) => r?.menuCode)
            .filter(Boolean)
        )
      );
      setShowMenus(true);
      setMobileStep("menus");
    } catch (err) {
      console.error("getRoleMenu failed:", err);
      const detail =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.response?.data?.errors?.[0]?.detail ||
        err?.message ||
        "Unable to load menus for the selected role.";
      await useSwalErrorAlert("Error", detail);
    } finally {
      setLoadingMenus(false);
    }
  };

  const handleViewMenus = useCallback(async () => {
    if (selectedRoles.length === 0) {
      await useSwalErrorAlert(
        "No Role Selected",
        "Please select one role to continue."
      );
      return;
    }
    if (selectedRoles.length > 1) {
      await useSwalErrorAlert(
        "Multiple Roles Selected",
        "Please select only one role when configuring access."
      );
      return;
    }
    await loadRoleMenus(selectedRoles[0]);
  }, [selectedRoles]);

  const handleSaveAccess = useCallback(async () => {
    if (selectedRoles.length !== 1) {
      await useSwalErrorAlert(
        "Select Exactly One Role",
        "Pick a single role, then click Save Access."
      );
      return;
    }
    if (!showMenus) {
      await useSwalErrorAlert(
        "Nothing to Save",
        "Click View Modules first, then modify and save."
      );
      return;
    }

    const rc = String(selectedRoles[0] ?? "").trim();
    const dt1 = Array.from(checkedMenus).map((menuCode) => ({ menuCode }));

    setSaving(true);
    try {
      const payload = {
        json_data: {
          roleCode: rc,
          dt1,
          userCode: currentUserCode,
        },
      };

      const { data: res } = await apiClient.post("/upsertRoleMenu", payload);

      const ok =
        res?.success === true ||
        res?.data?.status === "success" ||
        res?.message?.toLowerCase?.().includes("saved");

      if (!ok) {
        throw new Error(res?.message || "Error executing Role Menu Upsert.");
      }

      await useSwalSuccessAlert(
        "Saved!",
        "Role menu access has been updated."
      );
      await loadRoleMenus(rc);
    } catch (err) {
      console.error("UpsertRoleMenu failed:", err);
      const detail =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.response?.data?.errors?.[0]?.detail ||
        err?.message ||
        "Error executing Role Menu Upsert.";
      await useSwalErrorAlert("Save Failed", detail);
    } finally {
      setSaving(false);
    }
  }, [selectedRoles, showMenus, checkedMenus, currentUserCode]);

  const handleReset = useCallback(() => {
    setSelectedRoles([]);
    setMenus([]);
    setCheckedMenus(new Set());
    setShowMenus(false);
    setMobileStep("roles");
  }, []);

  useImperativeHandle(ref, () => ({
    viewModules: handleViewMenus,
    saveAccess: handleSaveAccess,
    reset: handleReset,
    getExportData: () => {
      const selectedRole = selectedRoleDetails?.[0] || null;

      const rows = (Array.isArray(menus) ? menus : []).map((m) => ({
        roleCode: selectedRole?.roleCode || "",
        roleName: selectedRole?.roleName || "",
        menuCode: m.menuCode || "",
        menuName: m.menuName || "",
        access: checkedMenus.has(m.menuCode) ? "Yes" : "No",
      }));

      return {
        fileName: "Role Access Rights",
        rows,
        columns: [
          { key: "roleCode", label: "Role Code" },
          { key: "roleName", label: "Role Name" },
          { key: "menuCode", label: "Menu Code" },
          { key: "menuName", label: "Menu Name" },
          { key: "access", label: "Access" },
        ],
      };
    },
  }));

  const toggleRole = useCallback((roleCode) => {
    setSelectedRoles((prev) =>
      prev.includes(roleCode)
        ? prev.filter((rc) => rc !== roleCode)
        : [...prev, roleCode]
    );
  }, []);

  const toggleMenu = useCallback((menuCode) => {
    setCheckedMenus((prev) => {
      const next = new Set(prev);
      if (next.has(menuCode)) next.delete(menuCode);
      else next.add(menuCode);
      return next;
    });
  }, []);

  const toggleSelectAllMenus = useCallback(() => {
    setCheckedMenus((prev) => {
      if (menus.length > 0 && prev.size === menus.length) {
        return new Set();
      }
      return new Set(menus.map((m) => m.menuCode).filter(Boolean));
    });
  }, [menus]);

  const toggleSelectAllRoles = useCallback(() => {
    setSelectedRoles((prev) =>
      prev.length === allRoleCodes.length ? [] : [...allRoleCodes]
    );
  }, [allRoleCodes]);

  const roleColumns = useMemo(
    () => [
      {
        key: "__select",
        label: (
          <div className="flex items-center justify-end md:justify-center gap-1">
            <span>Select</span>
            <input
              type="checkbox"
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              checked={allRolesSelected}
              onChange={toggleSelectAllRoles}
              onClick={(e) => e.stopPropagation()}
              title="Select All Roles"
            />
          </div>
        ),
        sortable: false,
        width: 90,
        render: (row) => (
          <div className="flex justify-end md:justify-center">
            <input
              type="checkbox"
              className="h-6 w-6 md:h-4 md:w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              checked={selectedRoles.includes(row.roleCode)}
              onClick={(e) => e.stopPropagation()}
              onChange={() => toggleRole(row.roleCode)}
            />
          </div>
        ),
      },
      {
        key: "roleCode",
        label: "Role Code",
        sortable: true,
        width: 160,
      },
      {
        key: "roleName",
        label: "Role Name",
        sortable: true,
        width: 260,
      },
    ],
    [selectedRoles, toggleRole, allRolesSelected, toggleSelectAllRoles]
  );

  const menuColumns = useMemo(
    () => [
      {
        key: "__select",
        label: "Access",
        sortable: false,
        width: 90,
        render: (row) => (
          <div className="flex justify-end md:justify-center">
            <input
              type="checkbox"
              className="h-6 w-6 md:h-4 md:w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              checked={checkedMenus.has(row.menuCode)}
              onClick={(e) => e.stopPropagation()}
              onChange={() => toggleMenu(row.menuCode)}
            />
          </div>
        ),
      },
      {
        key: "menuCode",
        label: "Menu Code",
        sortable: true,
        width: 170,
      },
      {
        key: "menuName",
        label: "Menu Name",
        sortable: true,
        width: 300,
      },
    ],
    [checkedMenus, toggleMenu]
  );

  const roleTableData = useMemo(
    () =>
      (Array.isArray(roles) ? roles : []).map((row, index) => ({
        ...row,
        __idx: index,
      })),
    [roles]
  );

  const menuTableData = useMemo(
    () =>
      (Array.isArray(menus) ? menus : []).map((row, index) => ({
        ...row,
        __idx: index,
      })),
    [menus]
  );

  return (
    <div className="w-full">
      <div className="md:hidden mb-3">
        {mobileStep === "menus" && (
          <button
            type="button"
            onClick={() => setMobileStep("roles")}
            className="text-blue-600 text-sm font-medium flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Back to Roles
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row md:items-stretch gap-4">
        {/* ROLES PANEL */}
        <div
          className={`w-full md:w-1/2 ${mobileStep === "roles" ? "block" : "hidden md:block"
            }`}
        >
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 h-full flex flex-col">
            <h2 className="text-lg font-semibold mb-2 text-gray-700">Roles</h2>

            <div className="flex-1 min-h-0">
              <SearchGlobalReferenceTable
                docType="UserAccRight"
                columns={roleColumns}
                data={roleTableData}
                isLoading={false}
                itemsPerPage={10}
                showFilters={true}
                onRowDoubleClick={(row) => toggleRole(row.roleCode)}
                onRowClick={(row) => toggleRole(row.roleCode)}
                mobileSelectable={true}
                selectedRowChecker={(row) =>
                  selectedRoles.includes(row.roleCode)
                }
                className="h-full"
              />
            </div>
          </div>
        </div>

        {/* MENUS PANEL */}
        <div
          className={`w-full md:w-1/2 ${mobileStep === "menus" ? "block" : "hidden md:block"
            }`}
        >
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-2 gap-3">
              <h2 className="text-lg font-semibold text-gray-700">
                Menus (Access Rights)
              </h2>

              {showMenus && (
                <button
                  type="button"
                  onClick={toggleSelectAllMenus}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors"
                >
                  <FontAwesomeIcon
                    icon={allMenusSelected ? faSquare : faCheckSquare}
                  />
                  {allMenusSelected ? "Unselect All" : "Select All"}
                </button>
              )}
            </div>

            {showMenus ? (
              <>
                <div className="mb-2">
                  <div className="inline-flex max-w-full items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-2">
                    <FontAwesomeIcon
                      icon={faShieldAlt}
                      className="text-blue-600 text-sm shrink-0"
                    />
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-blue-700 shrink-0">
                        Selected Role
                      </span>

                      {selectedRoleDetails.length === 0 ? (
                        <span className="text-xs text-gray-500">None</span>
                      ) : selectedRoleDetails.length === 1 ? (
                        <span className="inline-flex items-center rounded-full border border-blue-200 bg-white px-2 py-0.5 text-xs font-medium text-blue-800 max-w-[260px] truncate">
                          {selectedRoleDetails[0].roleCode} -{" "}
                          {selectedRoleDetails[0].roleName}
                        </span>
                      ) : (
                        <>
                          <span className="inline-flex items-center rounded-full border border-blue-200 bg-white px-2 py-0.5 text-xs font-medium text-blue-800">
                            {selectedRoleDetails.length} roles
                          </span>

                          {selectedRoleDetails.slice(0, 1).map((role) => (
                            <span
                              key={role.roleCode}
                              className="inline-flex items-center rounded-full border border-blue-200 bg-white px-2 py-0.5 text-[11px] text-blue-700"
                            >
                              {role.roleCode}
                            </span>
                          ))}

                          {selectedRoleDetails.length > 1 && (
                            <span className="inline-flex items-center rounded-full border border-blue-200 bg-white px-2 py-0.5 text-[11px] text-blue-700">
                              +{selectedRoleDetails.length - 1} more
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-h-0">
                  <SearchGlobalReferenceTable
                    docType="UserAccRight"
                    columns={menuColumns}
                    data={menuTableData}
                    isLoading={loadingMenus}
                    itemsPerPage={10}
                    showFilters={true}
                    onRowDoubleClick={(row) => toggleMenu(row.menuCode)}
                    onRowClick={(row) => toggleMenu(row.menuCode)}
                    mobileSelectable={true}
                    selectedRowChecker={(row) => checkedMenus.has(row.menuCode)}
                    className="h-full"
                  />
                </div>
              </>
            ) : (
              <div className="h-full min-h-[320px] flex items-center justify-center text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <FontAwesomeIcon
                    icon={faList}
                    className="text-xl mb-2 text-gray-400"
                  />
                  <h3 className="font-medium text-sm mb-1">
                    Module Selection Hidden
                  </h3>
                  <p className="text-xs px-4">
                    Select exactly one role and click "View Modules" to see and
                    configure access rights.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedRoles.length > 0 && (
        <div className="mt-3 bg-blue-50 p-2 rounded text-xs">
          {selectedRoles.length === 1
            ? `Selected role: ${selectedRoles[0]}`
            : `Selected roles: ${selectedRoles.join(", ")}`}
        </div>
      )}

      {showMenus && checkedMenus.size > 0 && (
        <div className="mt-2 bg-green-50 p-2 rounded text-xs">
          {`${checkedMenus.size} menu(s) selected for access.`}
        </div>
      )}

      {(saving || loadingMenus) && (
        <div className="fixed inset-0 z-[70] bg-black/20 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl px-6 py-4 shadow-xl text-sm">
            <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
            {saving ? "Saving…" : "Loading…"}
          </div>
        </div>
      )}
    </div>
  );
});

export default RoleAccessTab;