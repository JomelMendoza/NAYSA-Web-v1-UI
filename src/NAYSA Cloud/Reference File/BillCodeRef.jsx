// src/NAYSA Cloud/Reference File/BillCodeRef.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Undo2, Edit, Trash2, Loader2, Info } from "lucide-react";

import Swal from "sweetalert2";

import { apiClient } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";
import { useAuth } from "@/NAYSA Cloud/Authentication/AuthContext.jsx";
import {
  useSwalErrorAlert,
  useSwalSuccessAlert,
} from "@/NAYSA Cloud/Global/behavior";

import SearchGlobalReferenceTable from "@/NAYSA Cloud/Lookup/SearchGlobalReferenceTable";
import FieldRenderer from "@/NAYSA Cloud/Global/FieldRenderer.jsx";
import RegistrationInfo from "@/NAYSA Cloud/Global/RegistrationInfo.jsx";
import SearchRCMast from "../Lookup/SearchRCMast";
import SearchCOAMast from "../Lookup/SearchCOAMast";

import {
  reftables,
  reftablesPDFGuide,
  reftablesVideoGuide,
} from "@/NAYSA Cloud/Global/reftable";

/* ================= HELPERS ================= */

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
  billCode: "",
  billName: "",
  uomCode: "",
  billingClass: "",
  unitPriceRequired: "N",
  rcCode: "",
  rcName: "",
  arAcct: "",
  arName: "",
  salesAcct: "",
  salesName: "",
  vatAcct: "",
  vatName: "",
  advancesAcct: "",
  advancesName: "",
  sDiscAcct: "",
  sDiscName: "",

  registeredBy: "",
  registeredDate: "",
  updatedBy: "",
  updatedDate: "",

  __existing: false,
};

const toYN = (v, def = "N") => {
  const x = String(v ?? "")
    .trim()
    .toUpperCase();
  if (x === "Y" || x === "YES" || x === "TRUE" || x === "1") return "Y";
  if (x === "N" || x === "NO" || x === "FALSE" || x === "0") return "N";
  return def;
};

const req = (v) => String(v || "").trim().length > 0;

/* ================= COMPONENT ================= */

const BillCodeRef = React.forwardRef((props, ref) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const docType = "BillCode";
  const documentTitle = reftables?.[docType];

  const pdfLink = reftablesPDFGuide?.[docType];
  const videoLink = reftablesVideoGuide?.[docType];

  const billCodeInputRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [isRCModalOpen, setRCModalOpen] = useState(false);
  const [isAccountModalOpen, setAccountModalOpen] = useState(false);
  const [activeAccountField, setActiveAccountField] = useState(null);

  const setField = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));
  const resetForm = (next = DEFAULT_FORM) => setForm(next);

  const handleOpenAccountLookup = (fieldName) => {
    setActiveAccountField(fieldName);
    setAccountModalOpen(true);
  };

  useEffect(() => {
    document.title = documentTitle;
  }, [documentTitle]);

  /* ================= DUPLICATE & USAGE CHECKS ================= */

  const checkDuplicate = async (billCode) => {
    const c = String(billCode || "").trim();
    if (!c) return false;

    const res = await apiClient.post("/checkDuplicatebillCode", {
      json_data: { billCode: c },
    });

    const row0 = res?.data?.data?.[0] || {};
    const raw = row0?.result ?? row0?.[""] ?? '{"result":"0"}';
    const parsed = JSON.parse(raw);
    return String(parsed?.result) === "1";
  };

  const checkInUsed = async (billCode) => {
    const c = String(billCode || "").trim();
    const res = await apiClient.post("/checkInUsedbillCode", {
      json_data: { billCode: c },
    });

    const row0 = res?.data?.data?.[0] || {};
    const raw = row0?.result ?? row0?.[""] ?? '{"result":"0"}';
    const parsed = JSON.parse(raw);
    return String(parsed?.result) === "1";
  };

  const startNew = () => {
    resetForm(DEFAULT_FORM);
    setIsEditing(true);
    setSelectedRow(null);
    setTimeout(() => billCodeInputRef.current?.focus?.(), 0);
  };

  const handleReset = () => {
    resetForm(DEFAULT_FORM);
    setIsEditing(false);
    setSelectedRow(null);
  };

  /* ================= TANSTACK QUERY ================= */

  const billCodeListQuery = useQuery({
    queryKey: ["billCodeList"],
    queryFn: async () => {
      const res = await apiClient.get("/billCode");
      return extractRows(res);
    },
  });

  const billCodes = useMemo(
    () => billCodeListQuery.data || [],
    [billCodeListQuery.data],
  );

  const isInitialLoading = billCodeListQuery.isLoading;

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      return apiClient.post("/upsertbillCode", {
        json_data: payload,
      });
    },
    onSuccess: (response) => {
      const row0 = response?.data?.data?.[0] || {};
      const errorcount = Number(row0.errorcount ?? row0.ERRORCOUNT ?? 0);
      const errormsg = String(row0.errormsg ?? row0.ERRORMSG ?? "");

      if (errorcount > 0) {
        useSwalErrorAlert("Error", errormsg);
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["billCodeList"] });
      useSwalSuccessAlert("Success!", "Bill code saved successfully.");
      setIsEditing(false);
      resetForm(DEFAULT_FORM);
      setSelectedRow(null);
    },
    onError: (error) => {
      useSwalErrorAlert(
        "System Error",
        error?.response?.data?.message || error.message,
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (billCode) => {
      return apiClient.post("/deletebillCode", {
        json_data: { billCode },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billCodeList"] });
      Swal.fire("Deleted", "Bill code has been removed.", "success");
      handleReset();
    },
    onError: (error) => {
      useSwalErrorAlert(
        "System Error",
        error?.response?.data?.message || error.message,
      );
    },
  });

  /* ================= ACTIONS ================= */

  const handleSave = async () => {
    if (!isEditing || saveMutation.isPending) return;

    const confirm = await Swal.fire({
      title: "Save Bill Code?",
      text: "Make sure details are correct.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Save",
    });

    if (!confirm.isConfirmed) return;

    const {
      __existing,
      registeredBy,
      registeredDate,
      updatedBy,
      updatedDate,
      ...payload
    } = form;

    saveMutation.mutate({
      ...payload,
      billCode: String(form.billCode || "")
        .trim()
        .toUpperCase(),
      unitPriceRequired: toYN(form.unitPriceRequired, "N"),
      userCode: user?.USER_CODE || "ADMIN",
    });
  };

  const handleEdit = async (row) => {
    const code = row?.billCode ?? row?.BILLCODE ?? row?.bill_code ?? "";

    if (!String(code).trim()) {
      useSwalErrorAlert("Error", "Selected row has no Bill Code.");
      return;
    }

    try {
      const res = await apiClient.get("/getbillCode", {
        params: { billCode: code },
      });

      const record = extractRows(res)?.[0] || row;

      resetForm({
        ...DEFAULT_FORM,
        ...record,
        __existing: true,
      });

      setIsEditing(true);
      setSelectedRow(row);
    } catch (error) {
      useSwalErrorAlert(
        "System Error",
        error?.response?.data?.message || error.message,
      );
    }
  };

  const handleDelete = async (row) => {
    // Check if used before confirming
    const isUsed = await checkInUsed(row.billCode);
    if (isUsed) {
      useSwalErrorAlert(
        "Restricted",
        "This Bill Code is in use and cannot be deleted.",
      );
      return;
    }

    const confirm = await Swal.fire({
      title: "Delete this Bill Code?",
      text: `${row.billCode} - ${row.billName}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#d33",
    });

    if (!confirm.isConfirmed) return;
    deleteMutation.mutate(row.billCode);
  };

  const handleOpenInfo = async () => {
    const actions = [];

    if (pdfLink) actions.push({ label: "User Guide", value: "pdf" });
    if (videoLink) actions.push({ label: "Video Guide", value: "video" });

    if (!actions.length) {
      Swal.fire("Info", "No guide available for this page.", "info");
      return;
    }

    const { isConfirmed, value } = await Swal.fire({
      title: "Reference Information",
      input: "radio",
      inputOptions: actions.reduce((acc, item) => {
        acc[item.value] = item.label;
        return acc;
      }, {}),
      inputValidator: (value) => (!value ? "Please select one option." : null),
      showCancelButton: true,
      confirmButtonText: "Open",
    });

    if (!isConfirmed || !value) return;

    if (value === "pdf" && pdfLink) window.open(pdfLink, "_blank");
    if (value === "video" && videoLink) window.open(videoLink, "_blank");
  };

  /* ================= TABLE COLUMNS ================= */

  const columns = useMemo(
    () => [
      {
        key: "billCode",
        label: "Bill Code",
        sortable: true,
        className: "sticky left-0 z-10 bg-white shadow-[1px_0_0_0_#e2e8f0]",
      },
      {
        key: "billName",
        label: "Description",
        sortable: true,
        className:
          "sticky left-[120px] z-10 bg-white shadow-[1px_0_0_0_#e2e8f0]",
      },
      {
        key: "uomCode",
        label: "UOM",
        sortable: true,
        className:
          "sticky left-[300px] z-10 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]",
      },
      { key: "billingClass", label: "Billing Class", sortable: true },
      {
        key: "unitPriceRequired",
        label: "Unit Price Required?",
        sortable: true,
        render: (row) =>
          String(row.unitPriceRequired).toUpperCase() === "Y" ? "Yes" : "No",
      },
      { key: "rcCode", label: "RC Code", sortable: true },
      { key: "arAcct", label: "AR Account", sortable: true },
      { key: "salesAcct", label: "Sales Account", sortable: true },
      { key: "vatAcct", label: "VAT Account", sortable: true },
      { key: "advancesAcct", label: "Advances Account", sortable: true },
      { key: "sDiscAcct", label: "Discount Account", sortable: true },
      {
        key: "__actions",
        label: "Actions",
        sortable: false,
        renderType: "actions",
        render: (row) => (
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(row);
              }}
              className="p-1 rounded-md bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white transition-colors"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(row);
              }}
              className="p-1 rounded-md bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  /* ================= EXPOSE METHODS ================= */

  React.useImperativeHandle(ref, () => ({
    startNew,
    save: handleSave,
    reset: handleReset,
    openInfo: handleOpenInfo,
  }));

  /* ================= HEADER BUTTONS ================= */

  const headerButtons = (
    <div className="flex gap-2 justify-center text-xs flex-wrap">
      <button
        type="button"
        onClick={startNew}
        className={`bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 ${
          isEditing ? "opacity-50 cursor-not-allowed" : ""
        }`}
        disabled={isEditing}
      >
        <Plus size={16} /> Add
      </button>

      <button
        type="button"
        onClick={handleSave}
        className={`bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 ${
          !isEditing || saveMutation.isPending
            ? "opacity-50 cursor-not-allowed"
            : ""
        }`}
        disabled={!isEditing || saveMutation.isPending}
      >
        <Save size={16} /> Save
      </button>

      <button
        type="button"
        onClick={handleReset}
        className="bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        disabled={saveMutation.isPending}
      >
        <Undo2 size={16} /> Reset
      </button>

      <button
        type="button"
        onClick={handleOpenInfo}
        className="bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
      >
        <Info size={16} /> Info
      </button>
    </div>
  );

  /* ================= RENDER ================= */

  return (
    <div className="global-ref-main-div-ui mt-24">
      <div className="fixed mt-4 top-14 left-6 right-6 z-30 global-ref-header-ui flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white/80 backdrop-blur p-3 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="global-ref-headertext-ui">{documentTitle}</h1>
        {headerButtons}
      </div>

      <div
        className="global-tran-tab-div-ui mt-8 p-6"
        style={{ minHeight: "calc(100vh - 170px)" }}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-10 bg-white p-6 rounded-xl border shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="flex flex-col gap-4">
                <FieldRenderer
                  label="Bill Code"
                  value={form.billCode}
                  inputRef={billCodeInputRef}
                  onChange={(e) =>
                    setField("billCode", e.target.value.toUpperCase())
                  }
                  onBlur={async () => {
                    if (!isEditing || form.__existing) return;
                    const isDup = await checkDuplicate(form.billCode);
                    if (isDup) {
                      useSwalErrorAlert(
                        "Duplicate Entry",
                        "Bill Code already exists.",
                      );
                      setField("billCode", "");
                      setTimeout(() => billCodeInputRef.current?.focus?.(), 0);
                    }
                  }}
                  disabled={!isEditing || form.__existing}
                  required
                />

                <FieldRenderer
                  label="Description"
                  value={form.billName}
                  onChange={(e) => setField("billName", e.target.value)}
                  disabled={!isEditing}
                  required
                />

                <FieldRenderer
                  label="UOM"
                  value={form.uomCode}
                  onChange={(e) => setField("uomCode", e.target.value)}
                  disabled={!isEditing}
                  required
                />

                <FieldRenderer
                  label="Billing Class"
                  value={form.billingClass}
                  onChange={(e) => setField("billingClass", e.target.value)}
                  disabled={!isEditing}
                />
              </div>

              <div className="flex flex-col gap-4">
                <FieldRenderer
                  label="Unit Price Required?"
                  type="select"
                  value={form.unitPriceRequired}
                  onChange={(val) => setField("unitPriceRequired", val)}
                  options={[
                    { value: "Y", label: "Yes" },
                    { value: "N", label: "No" },
                  ]}
                  disabled={!isEditing}
                />

                <FieldRenderer
                  type="lookup"
                  label="RC Code"
                  value={
                    form.rcCode
                      ? `${form.rcCode}${form.rcName ? ` - ${form.rcName}` : ""}`
                      : ""
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    setField("rcCode", val);
                  }}
                  onLookup={() => setRCModalOpen(true)}
                  disabled={!isEditing}
                  required
                />

                <FieldRenderer
                  label="AR Account"
                  type="lookup"
                  value={
                    form.arAcct
                      ? `${form.arAcct}${form.arName ? ` - ${form.arName}` : ""}`
                      : ""
                  }
                  onChange={(e) => setField("arAcct", e.target.value)}
                  onLookup={() => handleOpenAccountLookup("arAcct")}
                  disabled={!isEditing}
                  required
                />

                <FieldRenderer
                  label="Sales Account"
                  type="lookup"
                  value={
                    form.salesAcct
                      ? `${form.salesAcct}${form.salesName ? ` - ${form.salesName}` : ""}`
                      : ""
                  }
                  onChange={(e) => setField("salesAcct", e.target.value)}
                  onLookup={() => handleOpenAccountLookup("salesAcct")}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="flex flex-col gap-4">
                <FieldRenderer
                  label="VAT Account"
                  type="lookup"
                  value={
                    form.vatAcct
                      ? `${form.vatAcct}${form.vatName ? ` - ${form.vatName}` : ""}`
                      : ""
                  }
                  onChange={(e) => setField("vatAcct", e.target.value)}
                  onLookup={() => handleOpenAccountLookup("vatAcct")}
                  disabled={!isEditing}
                  required
                />

                <FieldRenderer
                  label="Advances Account"
                  type="lookup"
                  value={
                    form.advancesAcct
                      ? `${form.advancesAcct}${form.advancesName ? ` - ${form.advancesName}` : ""}`
                      : ""
                  }
                  onChange={(e) => setField("advancesAcct", e.target.value)}
                  onLookup={() => handleOpenAccountLookup("advancesAcct")}
                  disabled={!isEditing}
                />

                <FieldRenderer
                  label="Discount Account"
                  type="lookup"
                  value={
                    form.sDiscAcct
                      ? `${form.sDiscAcct}${form.sDiscName ? ` - ${form.sDiscName}` : ""}`
                      : ""
                  }
                  onChange={(e) => setField("sDiscAcct", e.target.value)}
                  onLookup={() => handleOpenAccountLookup("sDiscAcct")}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <RegistrationInfo data={form} layout="stacked" />
          </div>
        </div>

        <div className="global-tran-table-main-div-ui mt-6 relative border border-slate-200 rounded-xl overflow-x-auto bg-white shadow-sm">
          {isInitialLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 z-20 backdrop-blur-sm">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
              <p className="mt-3 text-sm font-bold text-slate-600 animate-pulse">
                Synchronizing Data...
              </p>
            </div>
          )}

          <SearchGlobalReferenceTable
            docType={docType}
            columns={columns}
            data={billCodes}
            itemsPerPage={50}
            showFilters
            onRowDoubleClick={handleEdit}
            selectedRow={selectedRow}
            onRowClick={(row) => setSelectedRow(row)}
          />
        </div>
      </div>

      <SearchRCMast
        isOpen={isRCModalOpen}
        onClose={(v) => {
          if (v) {
            setField("rcCode", v.rcCode);
            setField("rcName", v.rcName);
          }
          setRCModalOpen(false);
        }}
      />

      <SearchCOAMast
        isOpen={isAccountModalOpen}
        onClose={(v) => {
          if (v && activeAccountField) {
            const code = v.acctCode;
            const name = v.acctName;

            if (activeAccountField === "arAcct") {
              setForm((prev) => ({ ...prev, arAcct: code, arName: name }));
            } else if (activeAccountField === "salesAcct") {
              setForm((prev) => ({
                ...prev,
                salesAcct: code,
                salesName: name,
              }));
            } else if (activeAccountField === "vatAcct") {
              setForm((prev) => ({ ...prev, vatAcct: code, vatName: name }));
            } else if (activeAccountField === "advancesAcct") {
              setForm((prev) => ({
                ...prev,
                advancesAcct: code,
                advancesName: name,
              }));
            } else if (activeAccountField === "sDiscAcct") {
              setForm((prev) => ({
                ...prev,
                sDiscAcct: code,
                sDiscName: name,
              }));
            }
          }
          setAccountModalOpen(false);
          setActiveAccountField(null);
        }}
      />
    </div>
  );
});

export default BillCodeRef;
