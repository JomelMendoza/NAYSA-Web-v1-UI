import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Save,
  Undo2,
  Edit,
  Trash2,
  Info,
} from "lucide-react";

import { apiClient } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";
import { useAuth } from "@/NAYSA Cloud/Authentication/AuthContext.jsx";
import {
  useSwalErrorAlert,
  useSwalSuccessAlert,
  useSwalDeleteRecord
} from "@/NAYSA Cloud/Global/behavior.jsx";
import { LoadingSpinner } from "@/NAYSA Cloud/Global/utilities.jsx";

import SearchGlobalReferenceTable from "../Lookup/SearchGlobalReferenceTable";
import RegistrationInfo from "@/NAYSA Cloud/Global/RegistrationInfo.jsx";
import FieldRenderer from "@/NAYSA Cloud/Global/FieldRenderer.jsx";
import BankRef from "../Reference File/BankRef";

import { reftables } from "@/NAYSA Cloud/Global/reftable";

import SearchBankRef from "@/NAYSA Cloud/Lookup/SearchBankRef.jsx";
import SearchCOAMast from "../Lookup/SearchCOAMast";
import SearchCurrencyRef from "../Lookup/SearchCurrRef";

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
  bankCode: "",
  acctCode: "",
  acctName: "",
  bankAcctNo: "",
  bankAcctType: "SA",
  autoCk: "Y",
  startCheckNo: "",
  lastCheckNo: "",
  currCode: "",
  currName: "",
  bankTypeCode: "",
  bankTypeName: "",
  bankBranch: "",
  bankContact: "",
  bankAddr1: "",
  bankAddr2: "",
  bankTelNo: "",
  bankPosition: "",
  __existing: false,
};

const toYN = (v, def = "N") => {
  const x = String(v ?? "").trim().toUpperCase();
  if (x === "Y" || x === "YES" || x === "TRUE" || x === "1") return "Y";
  if (x === "N" || x === "NO" || x === "FALSE" || x === "0") return "N";
  return def;
};

/* ================= COMPONENT ================= */

const BankMast = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { showError } = useSwalErrorAlert();
  const { showSuccess } = useSwalSuccessAlert();
  const { showDeleteRecord } = useSwalDeleteRecord();

  const docType = "BankMast";
  const documentTitle = reftables?.[docType] || "Bank Master";

  const bankRefTabRef = useRef(null);
  const bankCodeInputRef = useRef(null);
  const enterValidatedRef = useRef(false);

  const [isDupCode, setIsDupCode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const [isBankTypeModalOpen, setBankTypeModalOpen] = useState(false);
  const [isAccountModalOpen, setAccountModalOpen] = useState(false);
  const [isCurrencyModalOpen, setCurrencyModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState("bamast");
  const [form, setForm] = useState(DEFAULT_FORM);

  const setField = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const resetForm = (next = DEFAULT_FORM) => setForm(next);

  const tabs = useMemo(
    () => [
      { id: "bamast", label: "Bank Master Data" },
      { id: "banktypes", label: "Bank Types" },
    ],
    []
  );

  const activeHeaderTitle =
    activeTab === "banktypes" ? "Bank Type Codes" : "Bank Master Data";

  useEffect(() => {
    document.title = activeHeaderTitle || documentTitle;
  }, [activeHeaderTitle, documentTitle]);

  const startNew = () => {
    resetForm(DEFAULT_FORM);
    setIsEditing(true);
    setSelectedRow(null);
    setIsDupCode(false);
    setTimeout(() => bankCodeInputRef.current?.focus?.(), 0);
  };

  const handleReset = () => {
    resetForm(DEFAULT_FORM);
    setIsEditing(false);
    setSelectedRow(null);
    setIsDupCode(false);
  };

  /* ================= TANSTACK QUERY ================= */

  const bankListQuery = useQuery({
    queryKey: ["bankList"],
    queryFn: async () => {
      const res = await apiClient.get("/bank");
      return extractRows(res);
    },
  });

  const banks = useMemo(() => bankListQuery.data || [], [bankListQuery.data]);
  const isInitialLoading = bankListQuery.isLoading;

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      const requestBody = {
        json_data: JSON.stringify({ json_data: payload }),
      };
      return apiClient.post("/upsertBank", requestBody);
    },
    onSuccess: async (response) => {
      const sqlRow = response?.data?.data?.[0] || {};
      const errorcount = Number(sqlRow.errorcount ?? sqlRow.ERRORCOUNT ?? 0);
      const errormsg = String(sqlRow.errormsg ?? sqlRow.ERRORMSG ?? "");

      if (errorcount > 0) {
        showError("Error", errormsg || "Failed to save bank record.");
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["bankList"] });
      showSuccess("Success!", "Bank record saved successfully.");
      setIsEditing(false);
      resetForm(DEFAULT_FORM);
      setSelectedRow(null);
    },
    onError: (error) => {
      showError("System Error", error?.message || "Failed to save record.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (bankCode) => {
      return apiClient.post("/deleteBank", { json_data: { bankCode } });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["bankList"] });
      showDeleteRecord("Deleted!", "Record has been successfully removed.");
      handleReset();
    },
    onError: (error) => {
      showError("System Error", error?.message || "Failed to delete record.");
    },
  });

  /* ================= ACTIONS ================= */

  const parseResultFlag = (res) => {
    const row0 = res?.data?.data?.[0] || {};
    const raw = row0?.result ?? row0?.[""] ?? '{"result":"0"}';

    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      return String(parsed?.result) === "1";
    } catch {
      return false;
    }
  };

  const checkDuplicate = async (bankCode) => {
    const c = String(bankCode || "").trim();
    if (!c) return false;

    const res = await apiClient.post("/checkDuplicateBank", {
      json_data: { bankCode: c },
    });

    return parseResultFlag(res);
  };

  const checkInUsed = async (bankCode) => {
    const c = String(bankCode || "").trim();
    if (!c) return false;

    const res = await apiClient.post("/checkInUsedBank", {
      json_data: { bankCode: c },
    });

    return parseResultFlag(res);
  };

  const handleBankCodeValidate = async (arg) => {
    const isEvent = arg && typeof arg === "object" && "type" in arg;

    if (isEvent && arg.type === "keydown") {
      if (arg.key !== "Enter") return;
      enterValidatedRef.current = true;
    }

    if (isEvent && arg.type === "blur" && enterValidatedRef.current) {
      enterValidatedRef.current = false;
      return;
    }

    const code = String(form.bankCode || "").trim().toUpperCase();
    if (!code || !isEditing || form.__existing) return;

    try {
      const dup = await checkDuplicate(code);

      if (dup) {
        setIsDupCode(true);
        showError("Duplicate Code", `Bank Code "${code}" already exists.`);
        setField("bankCode", "");
        setTimeout(() => bankCodeInputRef.current?.focus?.(), 0);
      } else {
        setIsDupCode(false);
      }
    } catch (error) {
      showError(
        "Validation Error",
        error?.message || "Failed to validate Bank Code."
      );
    }
  };

  const handleSave = async () => {
    if (!isEditing || saveMutation.isPending) return;

    const bankCode = String(form.bankCode || "").trim().toUpperCase();

    const missing = [];
    if (!bankCode) missing.push("• Bank Code");
    if (!String(form.acctCode || "").trim()) missing.push("• Account Code");
    if (!String(form.bankAcctNo || "").trim()) missing.push("• Bank Account No");
    if (!String(form.bankAcctType || "").trim()) missing.push("• Bank Account Type");
    if (!String(form.currCode || "").trim()) missing.push("• Currency");

    if (missing.length) {
      showError(
        "Error!",
        `Please fill in the required field(s):\n${missing.join("\n")}`
      );
      return;
    }

    try {
      if (!form.__existing) {
        const dup = await checkDuplicate(bankCode);
        if (dup) {
          showError("Duplicate Code", `Bank Code "${bankCode}" already exists.`);
          setTimeout(() => bankCodeInputRef.current?.focus?.(), 0);
          return;
        }
      }

      const { __existing, acctName, currName, bankTypeName, ...payload } = form;

      saveMutation.mutate({
        ...payload,
        bankCode,
        autoCk: toYN(form.autoCk, "Y"),
        userCode: user?.USER_CODE || "ADMIN",
      });
    } catch (error) {
      showError(
        "System Error",
        error?.message || "Failed to save bank record."
      );
    }
  };

  const handleEdit = async (row) => {
    try {
      const res = await apiClient.get("/getBank", {
        params: { bankCode: row.bankCode },
      });

      const record = extractRows(res)?.[0];
      resetForm({ ...DEFAULT_FORM, ...record, __existing: true });
      setIsEditing(true);
      setSelectedRow(row);
      setIsDupCode(false);
    } catch {
      showError("Error", "Could not fetch record");
    }
  };

  const handleDelete = async (row) => {
    const code = row?.bankCode ?? "";

    try {
      const used = await checkInUsed(code);

      if (used) {
        showError("Cannot Delete", `Bank Code "${code}" is already in use.`);
        return;
      }

      const result = await useSwalDeleteConfirm(
        "Delete Record?",
        `Are you sure you want to delete Bank "${code}"?`,
        "Yes, delete it"
      );

      if (!result?.isConfirmed) return;

      deleteMutation.mutate(code);
    } catch (error) {
      showError(
        "System Error",
        error?.message || "Failed to delete record."
      );
    }
  };

  /* ================= TABLE COLUMNS ================= */

  const columns = useMemo(
    () => [
      {
        key: "__actions",
        label: "Actions",
        sortable: false,
        render: (row) => (
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(row);
              }}
              className="rounded-md border border-blue-200 bg-blue-50 p-1 text-blue-600 transition-colors hover:bg-blue-600 hover:text-white"
            >
              <Edit size={16} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(row);
              }}
              className="rounded-md border border-red-200 bg-red-50 p-1 text-red-600 transition-colors hover:bg-red-600 hover:text-white"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ),
      },
      {
        key: "bankCode",
        label: "Bank Code",
        sortable: true,
        className: "sticky left-0 z-10 bg-white shadow-[1px_0_0_0_#e2e8f0]",
      },
      {
        key: "bankTypeCode",
        label: "Bank Type",
        sortable: true,
        className: "sticky left-[100px] z-10 bg-white shadow-[1px_0_0_0_#e2e8f0]",
      },
      {
        key: "acctCode",
        label: "Account Code",
        sortable: true,
        className: "sticky left-[200px] z-10 bg-white shadow-[1px_0_0_0_#e2e8f0]",
      },
      {
        key: "acctName",
        label: "Account Name",
        sortable: true,
        className:
          "sticky left-[320px] z-10 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]",
      },
      { key: "bankAcctNo", label: "Bank Account No", sortable: true },
      { key: "bankAcctType", label: "Account Type", sortable: true },
      { key: "autoCk", label: "Auto Generated", sortable: true },
      { key: "startCheckNo", label: "Start Check No", sortable: true },
      { key: "lastCheckNo", label: "Last Check No", sortable: true },
      { key: "currCode", label: "Currency", sortable: true },
      { key: "bankBranch", label: "Branch", sortable: true },
      {
        key: "fullAddress",
        label: "Address",
        sortable: false,
        render: (row) =>
          `${row.bankAddr1 || ""} ${row.bankAddr2 || ""}`.trim() || "-",
      },
      { key: "bankContact", label: "Contact Person", sortable: true },
      { key: "bankTelNo", label: "Contact No", sortable: true },
      { key: "bankPosition", label: "Position", sortable: true },
    ],
    []
  );

  /* ================= DYNAMIC HEADER BUTTONS ================= */

  const bankMastButtons = (
    <div className="flex flex-wrap justify-center gap-2 text-xs">
      <button
        type="button"
        onClick={startNew}
        className={`flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 ${
          isEditing ? "cursor-not-allowed opacity-50" : ""
        }`}
        disabled={isEditing}
      >
        <Plus size={16} /> Add
      </button>

      <button
        type="button"
        onClick={handleSave}
        className={`flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 ${
          !isEditing || saveMutation.isPending
            ? "cursor-not-allowed opacity-50"
            : ""
        }`}
        disabled={!isEditing || saveMutation.isPending}
      >
        <Save size={16} /> Save
      </button>

      <button
        type="button"
        onClick={handleReset}
        className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
        disabled={saveMutation.isPending}
      >
        <Undo2 size={16} /> Reset
      </button>

      <button
        type="button"
        onClick={() => bankRefTabRef.current?.openInfo?.()}
        className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
      >
        <Info size={16} /> Info
      </button>
    </div>
  );

  const bankTypeButtons = (
    <div className="flex flex-wrap justify-center gap-2 text-xs">
      <button
        type="button"
        onClick={() => bankRefTabRef.current?.startNew?.()}
        className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
      >
        <Plus size={16} /> Add
      </button>

      <button
        type="button"
        onClick={() => bankRefTabRef.current?.save?.()}
        className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
      >
        <Save size={16} /> Save
      </button>

      <button
        type="button"
        onClick={() => bankRefTabRef.current?.reset?.()}
        className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
      >
        <Undo2 size={16} /> Reset
      </button>

      <button
        type="button"
        onClick={() => bankRefTabRef.current?.openInfo?.()}
        className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
      >
        <Info size={16} /> Info
      </button>
    </div>
  );

  const activeHeaderButtons =
    activeTab === "banktypes" ? bankTypeButtons : bankMastButtons;

  const showGlobalLoading =
    isInitialLoading || saveMutation.isPending || deleteMutation.isPending;

  return (
    <div className="global-ref-main-div-ui mt-24">
      {showGlobalLoading && <LoadingSpinner />}

      <div className="global-ref-header-ui fixed left-6 right-6 top-10 z-30 mt-4 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white/80 p-3 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <h1 className="global-ref-headertext-ui">{activeHeaderTitle}</h1>

        <div className="flex flex-wrap gap-1 overflow-x-hidden">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`mr-1 flex items-center rounded-md px-3 py-2 text-xs font-bold transition-colors duration-200 md:text-sm ${
                activeTab === t.id
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-blue-700"
              }`}
            >
              <span className="whitespace-nowrap">{t.label}</span>
            </button>
          ))}
        </div>

        {activeHeaderButtons}
      </div>

      <div
        className="global-tran-tab-div-ui mt-8 p-6"
        style={{ minHeight: "calc(100vh - 170px)" }}
      >
        {activeTab === "banktypes" ? (
          <BankRef
            ref={bankRefTabRef}
            embedded
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            tabs={tabs}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
              <div className="rounded-xl border bg-white p-6 shadow-sm md:col-span-10">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                  <div className="flex flex-col gap-4">
                    <FieldRenderer
                      label="Bank Code"
                      value={form.bankCode}
                      inputRef={bankCodeInputRef}
                      onChange={(e) =>
                        setField("bankCode", e.target.value.toUpperCase())
                      }
                      onBlur={handleBankCodeValidate}
                      onKeyDown={handleBankCodeValidate}
                      disabled={!isEditing || form.__existing}
                      required
                    />

                    <FieldRenderer
                      label="Account Code"
                      type="lookup"
                      value={form.acctCode}
                      onLookup={() => setAccountModalOpen(true)}
                      disabled={!isEditing}
                      required
                      readOnly
                    />

                    <FieldRenderer
                      label="Account Name"
                      value={form.acctName}
                      readOnly
                      disabled={!isEditing}
                    />

                    <FieldRenderer
                      label="Bank Account No"
                      value={form.bankAcctNo}
                      onChange={(e) => setField("bankAcctNo", e.target.value)}
                      disabled={!isEditing}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-4">
                    <FieldRenderer
                      label="Bank Account Type"
                      type="select"
                      value={form.bankAcctType}
                      onChange={(val) => setField("bankAcctType", val)}
                      options={[
                        { value: "SA", label: "Savings Account" },
                        { value: "CA", label: "Current Account" },
                      ]}
                      disabled={!isEditing}
                      required
                    />

                    <FieldRenderer
                      label="Auto Generated?"
                      type="select"
                      value={form.autoCk}
                      onChange={(val) => setField("autoCk", val)}
                      options={[
                        { value: "Y", label: "Yes" },
                        { value: "N", label: "No" },
                      ]}
                      disabled={!isEditing}
                    />

                    <FieldRenderer
                      label="Start Check No"
                      value={form.startCheckNo}
                      onChange={(e) => setField("startCheckNo", e.target.value)}
                      disabled={!isEditing || form.autoCk === "N"}
                    />

                    <FieldRenderer
                      label="Last Check No"
                      value={form.lastCheckNo}
                      onChange={(e) => setField("lastCheckNo", e.target.value)}
                      disabled={!isEditing || form.autoCk === "N"}
                    />
                  </div>

                  <div className="flex flex-col gap-4">
                    <FieldRenderer
                      label="Currency"
                      type="lookup"
                      value={
                        form.currCode
                          ? `${form.currCode} - ${form.currName || ""}`
                          : ""
                      }
                      onLookup={() => setCurrencyModalOpen(true)}
                      disabled={!isEditing}
                      required
                      readOnly
                    />

                    <FieldRenderer
                      label="Bank Type"
                      type="lookup"
                      value={
                        form.bankTypeCode
                          ? `${form.bankTypeCode} - ${form.bankTypeName || ""}`
                          : ""
                      }
                      onLookup={() => setBankTypeModalOpen(true)}
                      disabled={!isEditing}
                      readOnly
                    />

                    <FieldRenderer
                      label="Bank Branch"
                      value={form.bankBranch}
                      onChange={(e) => setField("bankBranch", e.target.value)}
                      disabled={!isEditing}
                    />

                    <FieldRenderer
                      label="Contact Person"
                      value={form.bankContact}
                      onChange={(e) => setField("bankContact", e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="flex flex-col gap-4">
                    <FieldRenderer
                      label="Address 1"
                      value={form.bankAddr1}
                      onChange={(e) => setField("bankAddr1", e.target.value)}
                      disabled={!isEditing}
                    />

                    <FieldRenderer
                      label="Address 2"
                      value={form.bankAddr2}
                      onChange={(e) => setField("bankAddr2", e.target.value)}
                      disabled={!isEditing}
                    />

                    <FieldRenderer
                      label="Contact No"
                      value={form.bankTelNo}
                      onChange={(e) => setField("bankTelNo", e.target.value)}
                      disabled={!isEditing}
                    />

                    <FieldRenderer
                      label="Position"
                      value={form.bankPosition}
                      onChange={(e) => setField("bankPosition", e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <RegistrationInfo data={form} layout="stacked" />
              </div>
            </div>

            <div className="global-tran-table-main-div-ui relative mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <SearchGlobalReferenceTable
                docType={docType}
                columns={columns}
                data={banks}
                itemsPerPage={50}
                showFilters
                onRowDoubleClick={handleEdit}
                selectedRow={selectedRow}
                onRowClick={(row) => setSelectedRow(row)}
              />
            </div>
          </>
        )}
      </div>

      <SearchBankRef
        isOpen={isBankTypeModalOpen}
        onClose={(v) => {
          if (v) {
            setField("bankTypeCode", v.bankTypeCode);
            setField("bankTypeName", v.bankTypeName);
          }
          setBankTypeModalOpen(false);
        }}
      />

      <SearchCOAMast
        isOpen={isAccountModalOpen}
        onClose={(v) => {
          if (v) {
            setField("acctCode", v.acctCode);
            setField("acctName", v.acctName);
          }
          setAccountModalOpen(false);
        }}
      />

      <SearchCurrencyRef
        isOpen={isCurrencyModalOpen}
        onClose={(v) => {
          if (v) {
            setField("currCode", v.currCode);
            setField("currName", v.currName);
          }
          setCurrencyModalOpen(false);
        }}
      />
    </div>
  );
};

export default BankMast;