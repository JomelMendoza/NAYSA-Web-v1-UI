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
  Info,
} from "lucide-react";

import { apiClient } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";
import { useAuth } from "@/NAYSA Cloud/Authentication/AuthContext.jsx";
import {
  useSwalErrorAlert,
  useSwalSuccessAlert,
  useSwalInfoAlert,
  useSwalDeleteRecord,
  useSwalDeleteConfirm,
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

/* ================= CONSTANTS ================= */

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

/* ================= HELPERS ================= */

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

  if (typeof res === "object") {
    return Array.isArray(res?.result) ? res.result : [];
  }

  return [];
};

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

const mapAtcRow = (row) => ({
  atcCode:
    row?.atcCode ??
    row?.ATC_CODE ??
    row?.atc_code ??
    "",
  atcName:
    row?.atcName ??
    row?.ATC_NAME ??
    row?.atc_name ??
    "",
  atcRate: String(
    row?.atcRate ??
      row?.ATC_RATE ??
      row?.atc_rate ??
      ""
  ),
  ewtAcct:
    row?.ewtAcct ??
    row?.EWT_ACCT ??
    row?.ewt_acct ??
    "",
  ewtAcctName:
    row?.ewtAcctName ??
    row?.EWT_ACCT_NAME ??
    row?.ewt_acct_name ??
    "",
  cwtAcct:
    row?.cwtAcct ??
    row?.CWT_ACCT ??
    row?.cwt_acct ??
    "",
  cwtAcctName:
    row?.cwtAcctName ??
    row?.CWT_ACCT_NAME ??
    row?.cwt_acct_name ??
    "",
  clAcct:
    row?.clAcct ??
    row?.CL_ACCT ??
    row?.cl_acct ??
    "",
  clAcctName:
    row?.clAcctName ??
    row?.CL_ACCT_NAME ??
    row?.cl_acct_name ??
    "",
  registeredBy:
    row?.registeredBy ??
    row?.REGISTERED_BY ??
    row?.registered_by ??
    "",
  registeredDate: formatDate(
    row?.registeredDate ??
      row?.REGISTERED_DATE ??
      row?.registered_date
  ),
  lastUpdatedBy:
    row?.lastUpdatedBy ??
    row?.LAST_UPDATED_BY ??
    row?.last_updated_by ??
    "",
  lastUpdatedDate: formatDate(
    row?.lastUpdatedDate ??
      row?.LAST_UPDATED_DATE ??
      row?.last_updated_date
  ),
  __existing: true,
});

/* ================= API ================= */

const fetchAtcList = async () => {
  const res = await apiClient.post("/atc");

  if (res?.data?.success === false) {
    throw new Error(res?.data?.message || "Failed to load ATC data.");
  }

  return extractRows(res).map(mapAtcRow);
};

const checkDuplicateAtcApi = async (atcCode) => {
  const res = await apiClient.post("/checkDuplicateATC", {
    json_data: { atcCode },
  });

  if (res?.data?.success === false) {
    throw new Error(res?.data?.message || "Failed to check duplicate ATC.");
  }

  return parseResultFlag(res);
};

const checkInUsedAtcApi = async (atcCode) => {
  const res = await apiClient.post("/checkInUsedATC", {
    json_data: { atcCode },
  });

  if (res?.data?.success === false) {
    throw new Error(res?.data?.message || "Failed to validate ATC usage.");
  }

  return parseResultFlag(res);
};

const saveAtcApi = async (payload) => {
  const res = await apiClient.post("/upsertATC", {
    json_data: payload,
  });

  const data = res?.data || {};
  const firstRow = data?.data?.[0] || {};
  const errorCount = Number(firstRow?.errorcount ?? firstRow?.ERRORCOUNT ?? 0);
  const errorMsg = String(
    firstRow?.errormsg ?? firstRow?.ERRORMSG ?? data?.message ?? ""
  );

  if (data?.success === false || errorCount > 0) {
    throw new Error(errorMsg || "Failed to save ATC.");
  }

  return data;
};

const deleteAtcApi = async ({ atcCode }) => {
  const res = await apiClient.post("/deleteATC", {
    json_data: { atcCode },
  });

  const data = res?.data || {};
  const firstRow = data?.data?.[0] || {};
  const errorCount = Number(firstRow?.errorcount ?? firstRow?.ERRORCOUNT ?? 0);
  const errorMsg = String(
    firstRow?.errormsg ?? firstRow?.ERRORMSG ?? data?.message ?? ""
  );

  if (data?.success === false || errorCount > 0) {
    throw new Error(errorMsg || "Failed to delete ATC.");
  }

  return data;
};

/* ================= COMPONENT ================= */

const ATCRef = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { setOnSave, setOnReset } = useReset();

  const docType = "ATC";
  const documentTitle = reftables?.[docType] || "Alphanumeric Tax Code";
  const pdfLink = reftablesPDFGuide?.[docType];
  const videoLink = reftablesVideoGuide?.[docType];

  const atcCodeInputRef = useRef(null);
  const enterValidatedRef = useRef(false);

  const [form, setForm] = useState(DEFAULT_FORM);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDupCode, setIsDupCode] = useState(false);

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
    setIsDupCode(false);
  }, [resetForm]);

  const saveMutation = useMutation({
    mutationFn: saveAtcApi,
    onSuccess: async (response) => {
  const sqlRow = response?.data?.data?.[0] || {};
  const errorcount = Number(sqlRow.errorcount ?? sqlRow.ERRORCOUNT ?? 0);
  const errormsg = String(sqlRow.errormsg ?? sqlRow.ERRORMSG ?? "");

  if (errorcount > 0) {
    useSwalErrorAlert("Missing Fields", errormsg || "Failed to save ATC.");
    return;
  }

  await queryClient.invalidateQueries({ queryKey: ATC_LIST_QUERY_KEY });
  useSwalSuccessAlert("Success!", "ATC saved successfully.");
  handleReset();
},
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAtcApi,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ATC_LIST_QUERY_KEY });
      useSwalDeleteRecord("Deleted", "ATC record has been removed.");
      handleReset();
    },
    onError: (error) => {
      useSwalErrorAlert(
        "System Error",
        error?.message || "Failed to delete ATC."
      );
    },
  });

  const startNew = useCallback(() => {
    resetForm(DEFAULT_FORM);
    setSelectedRow(null);
    setIsEditing(true);
    setIsDupCode(false);
    setTimeout(() => atcCodeInputRef.current?.focus?.(), 0);
  }, [resetForm]);

  const handleEdit = useCallback(async (row) => {
    try {
      const res = await apiClient.get("/getATC", {
        params: { atcCode: row?.atcCode },
      });

      const freshData = extractRows(res)?.[0];
      if (!freshData) {
        useSwalErrorAlert("Error", "Could not fetch details for this record.");
        return;
      }

      const mapped = mapAtcRow(freshData);
      setForm(mapped);
      setSelectedRow(mapped);
      setIsEditing(true);
      setIsDupCode(false);
    } catch (error) {
      useSwalErrorAlert(
        "Error",
        error?.message || "Could not fetch details for this record."
      );
    }
  }, []);

  const handleATCCodeValidate = useCallback(
    async (arg) => {
      const isEvent = arg && typeof arg === "object" && "type" in arg;

      if (isEvent && arg.type === "keydown") {
        if (arg.key !== "Enter") return;
        enterValidatedRef.current = true;
      }

      if (isEvent && arg.type === "blur" && enterValidatedRef.current) {
        enterValidatedRef.current = false;
        return;
      }

      const code = String(form.atcCode || "").trim().toUpperCase();
      if (!code || !isEditing || form.__existing) return;

      try {
        const isDuplicate = await checkDuplicateAtcApi(code);

        if (isDuplicate) {
          setIsDupCode(true);
          useSwalErrorAlert(
            "Duplicate Entry",
            `ATC Code "${code}" already exists.`
          );
          setField("atcCode", "");
          setTimeout(() => atcCodeInputRef.current?.focus?.(), 0);
          return;
        }

        setIsDupCode(false);
        setField("atcCode", code);
      } catch (error) {
        useSwalErrorAlert(
          "Validation Error",
          error?.message || "Failed to validate ATC Code."
        );
      }
    },
    [form.atcCode, form.__existing, isEditing]
  );

  const handleSave = useCallback(async () => {
  if (!isEditing || saveMutation.isPending) return;

  const code = String(form.atcCode || "").trim().toUpperCase();
  const name = String(form.atcName || "").trim();
  const rate = String(form.atcRate || "").trim();
  const ewtAcct = String(form.ewtAcct || "").trim();
  const cwtAcct = String(form.cwtAcct || "").trim();
  const clAcct = String(form.clAcct || "").trim();

  try {
    if (!form.__existing) {
      const isDuplicate = await checkDuplicateAtcApi(code);

      if (isDuplicate) {
        setIsDupCode(true);
        useSwalErrorAlert(
          "Duplicate Entry",
          `ATC Code "${code}" already exists.`
        );
        setTimeout(() => atcCodeInputRef.current?.focus?.(), 0);
        return;
      }
    }

    const parsedRate = parseFloat(rate);

    await saveMutation.mutateAsync({
      atcCode: code,
      atcName: name,
      atcRate: Number.isNaN(parsedRate) ? 0 : parsedRate,
      ewtAcct,
      cwtAcct,
      clAcct,
      userCode: user?.USER_CODE || "ADMIN",
    });
  } catch (error) {
    useSwalErrorAlert(
      "System Error",
      error?.message || "Failed to save ATC."
    );
  }
}, [form, isEditing, saveMutation, user?.USER_CODE]);

  const handleDelete = useCallback(
    async (row = selectedRow) => {
      const atcCode = String(row?.atcCode || "").trim();

      if (!atcCode) {
        useSwalErrorAlert("Error", "No ATC Code selected.");
        return;
      }

      try {
        const isInUsed = await checkInUsedAtcApi(atcCode);

        if (isInUsed) {
          useSwalErrorAlert(
            "Unable to Delete",
            `ATC "${atcCode}" is already in use.`
          );
          return;
        }

        const confirm = await useSwalDeleteConfirm(
          "Delete Record?",
          `Are you sure you want to delete ATC "${atcCode}"?`,
          "Yes, delete it"
        );

        if (!confirm?.isConfirmed) return;

        deleteMutation.mutate({ atcCode });
      } catch (error) {
        useSwalErrorAlert(
          "System Error",
          error?.message || "Failed to delete record."
        );
      }
    },
    [selectedRow, deleteMutation]
  );

  const handleSaveRef = useRef(null);
  const handleResetRef = useRef(null);

  useEffect(() => {
    handleSaveRef.current = handleSave;
  }, [handleSave]);

  useEffect(() => {
    handleResetRef.current = handleReset;
  }, [handleReset]);

  useEffect(() => {
    setOnSave(() => () => handleSaveRef.current?.());
    setOnReset(() => () => handleResetRef.current?.());

    return () => {
      setOnSave(null);
      setOnReset(null);
    };
  }, [setOnSave, setOnReset]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (isEditing && !saveMutation.isPending) {
          handleSave();
        }
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
    [handleEdit, handleDelete]
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
            onClick={() => {
              if (pdfLink || videoLink) {
                useSwalInfoAlert(
                  "Guide",
                  [
                    pdfLink ? `PDF Guide: ${pdfLink}` : null,
                    videoLink ? `Video Guide: ${videoLink}` : null,
                  ]
                    .filter(Boolean)
                    .join("\n")
                );
              } else {
                useSwalInfoAlert(
                  "Guide",
                  "No guide or video link is available for this reference."
                );
              }
            }}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Info size={16} />
            Info
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
                  onChange={(val) => {
                    setField("atcCode", val);
                    if (isDupCode) setIsDupCode(false);
                  }}
                  onBlur={handleATCCodeValidate}
                  onKeyDown={handleATCCodeValidate}
                  disabled={!isEditing || form.__existing}
                  required
                />

                <FieldRenderer
                  label="ATC Name"
                  value={form.atcName}
                  onChange={(val) => setField("atcName", val)}
                  disabled={!isEditing}
                  required
                />

                <FieldRenderer
                  label="Tax Rate (%)"
                  value={form.atcRate}
                  onChange={(val) => setField("atcRate", val)}
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
                      ? `${form.ewtAcct}${
                          form.ewtAcctName ? ` - ${form.ewtAcctName}` : ""
                        }`
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
                      ? `${form.cwtAcct}${
                          form.cwtAcctName ? ` - ${form.cwtAcctName}` : ""
                        }`
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
                      ? `${form.clAcct}${
                          form.clAcctName ? ` - ${form.clAcctName}` : ""
                        }`
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
        onClose={(value) => {
          if (value) {
            setField("ewtAcct", value?.acctCode || "");
            setField("ewtAcctName", value?.acctName || "");
          }
          setEwtAcctModalOpen(false);
        }}
      />

      <SearchCOAMast
        isOpen={isCwtAcctModalOpen}
        onClose={(value) => {
          if (value) {
            setField("cwtAcct", value?.acctCode || "");
            setField("cwtAcctName", value?.acctName || "");
          }
          setCwtAcctModalOpen(false);
        }}
      />

      <SearchCOAMast
        isOpen={isClAcctModalOpen}
        onClose={(value) => {
          if (value) {
            setField("clAcct", value?.acctCode || "");
            setField("clAcctName", value?.acctName || "");
          }
          setClAcctModalOpen(false);
        }}
      />
    </div>
  );
};

export default ATCRef;