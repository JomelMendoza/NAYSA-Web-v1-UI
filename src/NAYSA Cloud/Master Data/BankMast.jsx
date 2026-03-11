import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Save,
  Undo2,
  Edit,
  Trash2,
  Loader2,
  FileText,
  Info,
} from "lucide-react";

import { apiClient } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";
import { useAuth } from "@/NAYSA Cloud/Authentication/AuthContext.jsx";
import {
  useSwalErrorAlert,
  useSwalSuccessAlert,
} from "@/NAYSA Cloud/Global/behavior";

import SearchGlobalReferenceTable from "../Lookup/SearchGlobalReferenceTable";
import RegistrationInfo from "@/NAYSA Cloud/Global/RegistrationInfo.jsx";
import FieldRenderer from "@/NAYSA Cloud/Global/FieldRenderer.jsx";
import BankRef from "../Reference File/BankRef";

import Swal from "sweetalert2";

import {
  reftables,
  reftablesPDFGuide,
  reftablesVideoGuide,
} from "@/NAYSA Cloud/Global/reftable";

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

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
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
    onSuccess: (response) => {
      const sqlRow = response?.data?.data?.[0] || {};
      const errorcount = Number(sqlRow.errorcount ?? sqlRow.ERRORCOUNT ?? 0);
      const errormsg = String(sqlRow.errormsg ?? sqlRow.ERRORMSG ?? "");

      if (errorcount > 0) {
        useSwalErrorAlert("Error", errormsg);
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["bankList"] });
      useSwalSuccessAlert("Success!", "Bank record saved successfully.");
      setIsEditing(false);
      resetForm(DEFAULT_FORM);
      setSelectedRow(null);
    },
    onError: (error) => {
      useSwalErrorAlert("System Error", error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (bankCode) => {
      return apiClient.post("/deleteBank", { json_data: { bankCode } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bankList"] });
      Swal.fire("Deleted", "Bank record has been removed.", "success");
      handleReset();
    },
    onError: (error) => {
      useSwalErrorAlert("System Error", error.message);
    },
  });

  /* ================= ACTIONS ================= */

  const checkDuplicate = async (bankCode) => {
    const c = String(bankCode || "").trim();
    if (!c) return false;

    const res = await apiClient.post("/checkDuplicateBank", {
      json_data: { bankCode: c },
    });

    const row0 = res?.data?.data?.[0] || {};
    const raw = row0?.result ?? row0?.[""] ?? '{"result":"0"}';
    const parsed = JSON.parse(raw);

    return String(parsed?.result) === "1";
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

    const code = String(form.bankCode || "").trim();
    if (!code || !isEditing || form.__existing) return;

    const dup = await checkDuplicate(code);

    if (dup) {
      setIsDupCode(true);
      Swal.fire("Duplicate Entry", `Bank Code "${code}" is already in use.`, "error");
      setField("bankCode", "");
      setTimeout(() => bankCodeInputRef.current?.focus?.(), 0);
    } else {
      setIsDupCode(false);
    }
  };

  const handleSave = async () => {
    if (!isEditing || saveMutation.isPending) return;

    const { __existing, acctName, currName, bankTypeName, ...payload } = form;

    saveMutation.mutate({
      ...payload,
      bankCode: String(form.bankCode || "").trim().toUpperCase(),
      autoCk: toYN(form.autoCk, "Y"),
      userCode: user?.USER_CODE || "ADMIN",
    });
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
    } catch {
      Swal.fire("Error", "Could not fetch record", "error");
    }
  };

  /* ================= TABLE COLUMNS ================= */

  const columns = useMemo(
    () => [
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
      {
        key: "__actions",
        label: "Actions",
        sortable: false,
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
                deleteMutation.mutate(row.bankCode);
              }}
              className="p-1 rounded-md bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  /* ================= DYNAMIC HEADER BUTTONS ================= */

  const bankMastButtons = (
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
          !isEditing || saveMutation.isPending ? "opacity-50 cursor-not-allowed" : ""
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
    </div>
  );

  const bankTypeButtons = (
    <div className="flex gap-2 justify-center text-xs flex-wrap">
      <button
        type="button"
        onClick={() => bankRefTabRef.current?.startNew?.()}
        className="bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
      >
        <Plus size={16} /> Add
      </button>

      <button
        type="button"
        onClick={() => bankRefTabRef.current?.save?.()}
        className="bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
      >
        <Save size={16} /> Save
      </button>

      <button
        type="button"
        onClick={() => bankRefTabRef.current?.reset?.()}
        className="bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
      >
        <Undo2 size={16} /> Reset
      </button>


      <button
        type="button"
        onClick={() => bankRefTabRef.current?.openInfo?.()}
        className="bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
      >
        <Info size={16} /> Info
      </button>
    </div>
  );

  const activeHeaderButtons =
    activeTab === "banktypes" ? bankTypeButtons : bankMastButtons;

  /* ================= RENDER ================= */

  return (
    <div className="global-ref-main-div-ui mt-24">
      {/* HEADER */}
      <div className="fixed mt-4 top-14 left-6 right-6 z-30 global-ref-header-ui flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white/80 backdrop-blur p-3 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="global-ref-headertext-ui">{activeHeaderTitle}</h1>

        <div className="flex flex-wrap gap-1 overflow-x-hidden">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center px-3 py-2 rounded-md text-xs md:text-sm font-bold transition-colors duration-200 mr-1 ${
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

      {/* BODY */}
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
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-10 bg-white p-6 rounded-xl border shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div className="flex flex-col gap-4">
                    <FieldRenderer
                      label="Bank Code"
                      value={form.bankCode}
                      inputRef={bankCodeInputRef}
                      onChange={(e) =>
                        setField("bankCode", e.target.value.toUpperCase())
                      }
                      onBlur={handleBankCodeValidate}
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
                        form.currCode ? `${form.currCode} - ${form.currName || ""}` : ""
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
      

      {/* LOOKUP MODALS */}
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