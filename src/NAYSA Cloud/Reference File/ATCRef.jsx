import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Save,
  Undo2,
  Edit,
  Trash2,
  Info
} from "lucide-react";

import { apiClient } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";
import { useAuth } from "@/NAYSA Cloud/Authentication/AuthContext.jsx";
import {
  useSwalErrorAlert,
  useSwalSuccessAlert,
  useSwalInfoAlert,
  useSwalDeleteRecord
} from "@/NAYSA Cloud/Global/behavior.jsx";
import {
  reftables,
  reftablesPDFGuide,
  reftablesVideoGuide,
} from "@/NAYSA Cloud/Global/reftable";

import FieldRenderer from "@/NAYSA Cloud/Global/FieldRenderer.jsx";
import RegistrationInfo from "@/NAYSA Cloud/Global/RegistrationInfo.jsx";
import SearchGlobalReferenceTable from "../Lookup/SearchGlobalReferenceTable.jsx";
import SearchCOAMast from "../Lookup/SearchCOAMast.jsx";
import { useReset } from "../Components/ResetContext";
import { LoadingSpinner } from "@/NAYSA Cloud/Global/utilities.jsx";

/* ================= HELPERS ================= */

const ATC_LIST_QUERY_KEY = ["ATC", "list"];

const DEFAULT_FORM = {
  atcCode: "",
  atcName: "",
  atcRate: "",
  ewtAcct: "",
  ewtAcctName: "",
  cwtAcct: "",
  cwtAcctName: "",
  clAcct: "",
  clAcctName: "",
  registeredBy: "",
  registeredDate: "",
  lastUpdatedBy: "",
  lastUpdatedDate: "",
  __existing: false,
};

const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
};

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

const mapAtcRow = (row) => ({
  atcCode: row?.atcCode || "",
  atcName: row?.atcName || "",
  atcRate: String(row?.atcRate || "0"),
  ewtAcct: row?.ewtAcct || "",
  ewtAcctName: row?.ewtAcctName || "",
  cwtAcct: row?.cwtAcct || "",
  cwtAcctName: row?.cwtAcctName || "",
  clAcct: row?.clAcct || "",
  clAcctName: row?.clAcctName || "",
  registeredBy: row?.registeredBy || "",
  registeredDate: formatDate(row?.registeredDate),
  lastUpdatedBy: row?.lastUpdatedBy || "",
  lastUpdatedDate: formatDate(row?.lastUpdatedDate),
  __existing: true,
});

/* ================= API ================= */

const fetchAtcList = async () => {
  const res = await apiClient.get("/ATC");

  if (!res?.data?.success) {
    throw new Error(res?.data?.message || "Failed to load ATC data.");
  }

  return extractRows(res).map(mapAtcRow);
};

const checkDuplicateAtcApi = async (atcCode) => {
  const res = await apiClient.post("/checkDuplicateATC", {
    json_data: { atcCode },
  });

  if (!res?.data?.success) {
    throw new Error(res?.data?.message || "Failed to check duplicate ATC.");
  }

  const rows = extractRows(res);
  const result = rows?.[0]?.result ?? rows?.[0]?.RESULT ?? "0";
  return String(result) === "1";
};

const saveAtcApi = async (payload) => {
  const { data } = await apiClient.post("/upsertATC", {
    json_data: payload,
  });

  if (data?.status !== "success" && data?.success !== true) {
    throw new Error(data?.message || "Failed to save ATC.");
  }

  const rows = extractRows({ data });
  const firstRow = rows?.[0] || data?.data?.[0] || {};
  const errorCount = Number(firstRow?.errorcount || 0);
  const errorMsg = firstRow?.errormsg || "";

  if (errorCount > 0) {
    throw new Error(errorMsg || "Failed to save ATC.");
  }

  return data;
};

const deleteAtcApi = async (payload) => {
  const res = await apiClient.post("/deleteATC", {
    json_data: payload,
  });

  const data = res?.data || {};
  const rows = extractRows(res);
  const firstRow = rows?.[0] || data?.data?.[0] || {};
  const errorCount = Number(firstRow?.errorcount ?? 0);
  const errorMsg =
    firstRow?.errormsg ?? data?.message ?? "Failed to delete ATC.";

  if (
    errorCount > 0 ||
    (data?.success === false && data?.status !== "success")
  ) {
    throw new Error(errorMsg);
  }

  return data;
};

/* ================= COMPONENT ================= */

const ATCRef = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { setOnSave, setOnReset } = useReset();


  const { showSuccess } = useSwalSuccessAlert();
  const { showError } = useSwalErrorAlert();
  const { showDeleteRecord } = useSwalDeleteRecord();
  const { showInfo } = useSwalInfoAlert();

  const docType = "ATC";
  const documentTitle = reftables?.[docType] || "Alphanumeric Tax Code";
  const pdfLink = reftablesPDFGuide?.[docType];
  const videoLink = reftablesVideoGuide?.[docType];

  const atcCodeInputRef = useRef(null);

  const [form, setForm] = useState(DEFAULT_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const [isEwtAcctModalOpen, setEwtAcctModalOpen] = useState(false);
  const [isCwtAcctModalOpen, setCwtAcctModalOpen] = useState(false);
  const [isClAcctModalOpen, setClAcctModalOpen] = useState(false);

  const setField = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const resetForm = useCallback((next = DEFAULT_FORM) => {
    setForm(next);
  }, []);

  useEffect(() => {
    document.title = documentTitle;
  }, [documentTitle]);

  const atcListQuery = useQuery({
    queryKey: ATC_LIST_QUERY_KEY,
    queryFn: fetchAtcList,
    refetchOnWindowFocus: false,
  });

  const atcs = useMemo(() => atcListQuery.data || [], [atcListQuery.data]);
  const isInitialLoading = atcListQuery.isLoading;

  const handleReset = useCallback(() => {
    resetForm(DEFAULT_FORM);
    setSelectedRow(null);
    setIsEditing(false);
  }, [resetForm]);

  const saveMutation = useMutation({
    mutationFn: saveAtcApi,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ATC_LIST_QUERY_KEY });

      showSuccess("Success!", "ATC saved successfully.");
    },
    onError: (error) => {
      showError("Error", error?.message || "Error saving ATC.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAtcApi,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ATC_LIST_QUERY_KEY });
      showDeleteRecord("Deleted", "ATC record has been removed.");
      handleReset();
    },
    onError: (error) => {
      showError("Error", error?.message || "Failed to delete ATC.");
    },
  });

  const startNew = useCallback(() => {
    resetForm(DEFAULT_FORM);
    setSelectedRow(null);
    setIsEditing(true);
    setTimeout(() => atcCodeInputRef.current?.focus?.(), 0);
  }, [resetForm]);

  const handleEdit = async (row) => {
    try {
      const res = await apiClient.get("/getATC", {
        params: { atcCode: row.atcCode },
      });

      const freshData = extractRows(res)?.[0];
      if (freshData) {
        const mapped = mapAtcRow(freshData);
        setForm(mapped);
        setSelectedRow(mapped);
        setIsEditing(true);
      }
    } catch {
      showError("Error", "Could not fetch details for this record.");
    }
  };

  const handleSave = useCallback(async () => {
    if (!isEditing || saveMutation.isPending) return;

    const missing = [];
    if (!String(form.atcCode || "").trim()) missing.push("• ATC Code");
    if (!String(form.atcName || "").trim()) missing.push("• ATC Description");
    if (!String(form.atcRate || "").trim()) missing.push("• ATC Rate");
    if (!String(form.ewtAcct || "").trim()) missing.push("• EWT Account");
    if (!String(form.cwtAcct || "").trim()) missing.push("• CWT Account");
    if (!String(form.clAcct || "").trim())
      missing.push("• CWT Clearing Account");

    if (missing.length) {
      showError(
        "Error!",
        `Please fill in the required field(s):\n${missing.join("\n")}`
      );
      return;
    }

    const code = String(form.atcCode || "").trim().toUpperCase();

    try {
      if (!form.__existing) {
        const isDuplicate = await checkDuplicateAtcApi(code);

        if (isDuplicate) {
          showError("Duplicate ATC Code", `ATC Code "${code}" already exists.`);
          return;
        }
      }

      const parsedRate = parseFloat(form.atcRate);

      await saveMutation.mutateAsync({
        atcCode: code,
        atcName: String(form.atcName || "").trim(),
        atcRate: Number.isNaN(parsedRate) ? 0 : parsedRate,
        ewtAcct: String(form.ewtAcct || "").trim(),
        cwtAcct: String(form.cwtAcct || "").trim(),
        clAcct: String(form.clAcct || "").trim(),
        userCode: user?.USER_CODE || "ADMIN",
      });
    } catch (error) {
      showError("Error", error?.message || "Error saving ATC.");
    }
  }, [form, isEditing, saveMutation, user?.USER_CODE, showError]);

  const handleDelete = useCallback(
    async (row = selectedRow) => {
      const atcCode = String(row?.atcCode || "").trim();

      if (!atcCode) {
        showError("Error", "No ATC Code selected.");
        return;
      }

      try {
        const confirm = await useSwalDeleteConfirm(
          "Delete Record?",
          `Are you sure you want to delete ATC "${atcCode}"?`,
          "Yes, delete it"
        );

        if (!confirm?.isConfirmed) return;

        deleteMutation.mutate({ atcCode });
      } catch (error) {
        showError(
          "System Error",
          error?.message || "Failed to delete record."
        );
      }
    },
    [selectedRow, deleteMutation, useSwalDeleteConfirm, showError]
  );

  useEffect(() => {
    setOnSave(() => handleSave);
    setOnReset(() => handleReset);

    return () => {
      setOnSave(null);
      setOnReset(null);
    };
  }, [setOnSave, setOnReset, handleSave, handleReset]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (isEditing && !saveMutation.isPending) handleSave();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isEditing, saveMutation.isPending, handleSave]);

  const columns = useMemo(
    () => [
      {
        key: "__actions",
        label: "Actions",
        sortable: false,
        render: (row) => (
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(row);
              }}
              className="p-1 rounded-md bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white transition-colors"
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
            >
              <Trash2 size={16} />
            </button>
          </div>
        ),
      },
      {
        key: "atcCode",
        label: "ATC",
        sortable: true,
        render: (row) => row?.atcCode,
      },
      {
        key: "atcName",
        label: "ATC Name",
        sortable: true,
        render: (row) => row?.atcName,
      },
      {
        key: "atcRate",
        label: "Tax Rate",
        sortable: true,
        render: (row) => `${parseFloat(row?.atcRate || 0).toFixed(2)}%`,
      },
      {
        key: "ewtAcct",
        label: "EWT Account",
        sortable: true,
        render: (row) => row?.ewtAcct,
      },
      {
        key: "cwtAcct",
        label: "CWT Account",
        sortable: true,
        render: (row) => row?.cwtAcct,
      },
      {
        key: "clAcct",
        label: "CWT Clearing Account",
        sortable: true,
        render: (row) => row?.clAcct,
      },
    ],
    [handleDelete]
  );

  const tableData = useMemo(
    () =>
      (Array.isArray(atcs) ? atcs : []).map((row, index) => ({
        ...row,
        __idx: index,
      })),
    [atcs]
  );

  const registrationData = useMemo(
    () => ({
      registeredBy: form?.registeredBy,
      registeredDate: form?.registeredDate,
      lastUpdatedBy: form?.lastUpdatedBy,
      lastUpdatedDate: form?.lastUpdatedDate,
    }),
    [form]
  );

  const showGlobalLoading =
    isInitialLoading ||
    saveMutation.isPending ||
    deleteMutation.isPending;

  return (
    <div className="global-ref-main-div-ui mt-24">
      {showGlobalLoading && <LoadingSpinner />}

      <div className="fixed mt-4 top-14 left-6 right-6 z-30 global-ref-header-ui flex justify-between items-center bg-white/80 backdrop-blur p-3 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="global-ref-headertext-ui">{documentTitle}</h1>

        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={startNew}
            disabled={isEditing}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
          >
            <Plus size={16} />
            Add
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!isEditing || saveMutation.isPending}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={16} />
            Save
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center gap-2"
          >
            <Undo2 size={16} />
            Reset
          </button>
          <button
                  type="button"
                  className="bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                >
                  <Info size={16} /> Info
                </button>
        </div>
      </div>

      <div
        className="global-tran-tab-div-ui mt-8 p-6"
        style={{ minHeight: "calc(100vh - 170px)" }}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-9 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-4">
              <div className="flex flex-col gap-4">
                <FieldRenderer
                  label="ATC"
                  value={form.atcCode}
                  inputRef={atcCodeInputRef}
                  onChange={(e) =>
                    setField(
                      "atcCode",
                      String(e?.target?.value || "").toUpperCase()
                    )
                  }
                  disabled={!isEditing || form.__existing}
                  required
                />

                <FieldRenderer
                  label="ATC Name"
                  value={form.atcName}
                  onChange={(e) =>
                    setField("atcName", e?.target?.value || "")
                  }
                  disabled={!isEditing}
                  required
                />

                <FieldRenderer
                  label="Tax Rate (%)"
                  value={form.atcRate}
                  onChange={(e) =>
                    setField(
                      "atcRate",
                      String(e?.target?.value || "").replace(/[^0-9.]/g, "")
                    )
                  }
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="flex flex-col gap-4">
                <FieldRenderer
                  label="EWT Account"
                  type="lookup"
                  value={
                    form.ewtAcct
                      ? `${form.ewtAcct}${form.ewtAcctName ? ` - ${form.ewtAcctName}` : ""}`
                      : ""
                  }
                  onLookup={() => setEwtAcctModalOpen(true)}
                  disabled={!isEditing}
                  readOnly
                  required
                />

                <FieldRenderer
                  label="CWT Account"
                  type="lookup"
                  value={
                    form.cwtAcct
                      ? `${form.cwtAcct}${form.cwtAcctName ? ` - ${form.cwtAcctName}` : ""}`
                      : ""
                  }
                  onLookup={() => setCwtAcctModalOpen(true)}
                  disabled={!isEditing}
                  readOnly
                  required
                />

                <FieldRenderer
                  label="CWT Clearing Account"
                  type="lookup"
                  value={
                    form.clAcct
                      ? `${form.clAcct}${form.clAcctName ? ` - ${form.clAcctName}` : ""}`
                      : ""
                  }
                  onLookup={() => setClAcctModalOpen(true)}
                  disabled={!isEditing}
                  readOnly
                  required
                />
              </div>
            </div>
          </div>

          <div className="md:col-span-3">
            <RegistrationInfo data={registrationData} layout="stacked" />
          </div>
        </div>

        <div className="global-tran-table-main-div-ui mt-6 relative border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
          <SearchGlobalReferenceTable
            docType={docType}
            columns={columns}
            data={tableData}
            itemsPerPage={50}
            showFilters
            onRowDoubleClick={handleEdit}
            selectedRow={selectedRow}
            onRowClick={setSelectedRow}
            pdfLink={pdfLink}
            videoLink={videoLink}
          />
        </div>
      </div>

      <SearchCOAMast
        isOpen={isEwtAcctModalOpen}
        onClose={(v) => {
          if (v) {
            setField("ewtAcct", v.acctCode || "");
            setField("ewtAcctName", v.acctName || "");
          }
          setEwtAcctModalOpen(false);
        }}
      />

      <SearchCOAMast
        isOpen={isCwtAcctModalOpen}
        onClose={(v) => {
          if (v) {
            setField("cwtAcct", v.acctCode || "");
            setField("cwtAcctName", v.acctName || "");
          }
          setCwtAcctModalOpen(false);
        }}
      />

      <SearchCOAMast
        isOpen={isClAcctModalOpen}
        onClose={(v) => {
          if (v) {
            setField("clAcct", v.acctCode || "");
            setField("clAcctName", v.acctName || "");
          }
          setClAcctModalOpen(false);
        }}
      />
    </div>
  );
};

export default ATCRef;