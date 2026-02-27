// src/NAYSA Cloud/Master Data/CustMastTabs/PayeeMasterDataTab.jsx
import React, { useMemo, useEffect, useState, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFilter,
  faUndo,
  faPrint,
  faFileExcel,
} from "@fortawesome/free-solid-svg-icons";
// import ButtonBar from "@/NAYSA Cloud/Global/ButtonBar";
import SearchGlobalReportTable from "@/NAYSA Cloud/Lookup/SearchGlobalReportTable.jsx";
import SearchGlobalReferenceTable from "@/NAYSA Cloud/Lookup/SearchGlobalReferenceTable";

const pick = (obj, keys = []) => {
  for (const k of keys) {
    const val = obj?.[k];
    if (val !== null && val !== undefined && String(val).trim() !== "") return val;
  }
  return "";
};

const SLTYPE_OPTIONS = [
  { value: "", label: "" },
  { value: "AG", label: "AGENCY" },
  { value: "CU", label: "CUSTOMER" },
  { value: "EM", label: "EMPLOYEE" },
  { value: "OT", label: "OTHERS" },
  { value: "SU", label: "SUPPLIER" },
  { value: "TN", label: "TENANT" },
];

const PayeeMasterDataTab = ({
  isLoading = false,
  subsidiaryType = "", // AG | CU | EM | OT | SU | TN
  onChangeSubsidiaryType,
  filters = {},
  onChangeFilter,
  rows = [],
  onFilter,
  onReset,
  onPrint,
  onExport,
  onRowDoubleClick,
}) => {
  const slType = String(subsidiaryType || "").toUpperCase().trim();
  const isCustomer = slType === "CU";

  const col = useMemo(() => {
    if (isCustomer) {
      return {
        codeLabel: "Customer Code",
        nameLabel: "Customer Name",
        codeKey: "custCode",
        nameKey: "custName",
        zipKey: "custZip",
        tinKey: "custTin",
      };
    }

    return {
      codeLabel: "Payee Code",
      nameLabel: "Payee Name",
      codeKey: "vendCode",
      nameKey: "vendName",
      zipKey: "vendZip",
      tinKey: "vendTin",
    };
  }, [isCustomer]);

  const getCode = useCallback(
    (r) =>
      pick(r, [
        col.codeKey,
        col.codeKey.toLowerCase(),
        col.codeKey.toUpperCase(),
        col.codeKey.replace(/[A-Z]/g, (m) => `_${m}`).toLowerCase(),
      ]),
    [col]
  );

  const getName = useCallback(
    (r) =>
      pick(r, [
        col.nameKey,
        col.nameKey.toLowerCase(),
        col.nameKey.toUpperCase(),
        col.nameKey.replace(/[A-Z]/g, (m) => `_${m}`).toLowerCase(),
      ]),
    [col]
  );

  const getZip = useCallback(
    (r) =>
      pick(r, [
        col.zipKey,
        col.zipKey.toLowerCase(),
        col.zipKey.toUpperCase(),
        col.zipKey.replace(/[A-Z]/g, (m) => `_${m}`).toLowerCase(),
      ]),
    [col]
  );

  const getTin = useCallback(
    (r) =>
      pick(r, [
        col.tinKey,
        col.tinKey.toLowerCase(),
        col.tinKey.toUpperCase(),
        col.tinKey.replace(/[A-Z]/g, (m) => `_${m}`).toLowerCase(),
      ]),
    [col]
  );

  // ✅ Auto-filter when subsidiaryType changes (NO local loading)
  useEffect(() => {
    if (typeof onFilter === "function") onFilter();
  }, [subsidiaryType, onFilter]);

  const buttons = useMemo(
    () => [
      { key: "filter", label: "Filter", icon: faFilter, onClick: onFilter, disabled: isLoading },
      { key: "reset", label: "Reset", icon: faUndo, onClick: onReset, disabled: isLoading },
      { key: "print", label: "Print", icon: faPrint, onClick: onPrint, disabled: isLoading },
      { key: "export", label: "Export", icon: faFileExcel, onClick: onExport, disabled: isLoading },
    ],
    [isLoading, onFilter, onReset, onPrint, onExport]
  );





  const handleRowDblClick = (row) => {
    const code = getCode(row);
    if (!code) return;
    onRowDoubleClick?.({ code, subsidiaryType });
  };

  const tableColumns = useMemo(() => {
    return [
      { key: col.codeKey, label: col.codeLabel, sortable: true, width: 160 },
      { key: col.nameKey, label: col.nameLabel, sortable: true, width: 260 },
      { key: "taxClass", label: "Tax Rate Class", sortable: true, width: 140 },
      { key: "firstName", label: "First Name", sortable: true, width: 140 },
      { key: "middleName", label: "Middle Name", sortable: true, width: 140 },
      { key: "lastName", label: "Last Name", sortable: true, width: 140 },
      { key: col.tinKey, label: "TIN", sortable: true, width: 140 },
      { key: "address", label: "Address", sortable: true, width: 320 },
      // { key: col.zipKey, label: "ZIP Code", sortable: true, width: 110 },
      { key: "branchCode", label: "Branch Code", sortable: true, width: 120 },
    ];
  }, [col]);

  const tableData = useMemo(() => {
    const list = Array.isArray(rows) ? rows : [];
    return list.map((r) => ({
      ...r,
      [col.codeKey]: getCode(r),
      [col.nameKey]: getName(r),
      [col.zipKey]: getZip(r),
      [col.tinKey]: getTin(r),

      taxClass: pick(r, ["taxClass", "tax_class"]),
      firstName: pick(r, ["firstName", "first_name"]),
      middleName: pick(r, ["middleName", "middle_name"]),
      lastName: pick(r, ["lastName", "last_name"]),
      address: pick(r, ["address", "addr"]),
      branchCode: pick(r, ["branchCode", "branch_code"]),
    }));
  }, [rows, col, getCode, getName, getZip, getTin]);


  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

      {/* Top bar */}
      <div className="flex items-center gap-3 mb-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="text-xs font-bold text-gray-700">
            Subsidiary Type
          </div>

          <select
            value={subsidiaryType}
            onChange={(e) => onChangeSubsidiaryType?.(e.target.value)}
            className="global-tran-textbox-ui global-tran-textbox-enabled w-44"
          >
            {SLTYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TABLE AREA (THIS FIXES HEIGHT) */}

        {/* Scrollable Table */}
   
          <SearchGlobalReferenceTable
            columns={tableColumns}
            data={tableData}
            itemsPerPage={50}
            showFilters
            rightActionLabel="View"
            docType="VendMast"
            onRowDoubleClick={(row) => handleRowDblClick(row)}
          />
       
   </div>
  );
};

export default PayeeMasterDataTab;

