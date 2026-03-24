import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/NAYSA Cloud/Authentication/AuthContext.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faSave,
  faUndo,
  faTrashAlt,
  faEdit,
} from "@fortawesome/free-solid-svg-icons";

import { apiClient } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";
import FieldRenderer from "@/NAYSA Cloud/Global/FieldRenderer";
import RegistrationInfo from "@/NAYSA Cloud/Global/RegistrationInfo";
import SearchGlobalReferenceTable from "@/NAYSA Cloud/Lookup/SearchGlobalReferenceTable";

import {
  useSwalErrorAlert,
  useSwalDeleteConfirm,
  useSwalDeleteRecord,
  useSwalValidationAlert,
  useSwalSuccessAlert,
  useSwalErrorAlertAPI,
} from "@/NAYSA Cloud/Global/behavior.jsx";

import {
  useFieldLenghtCheck,
  useGetFieldLength,
} from "@/NAYSA Cloud/Global/procedure";

import { reftables } from "@/NAYSA Cloud/Global/reftable";

const INITIAL_FORM = {
  currCode: "",
  currName: "",
  active: "Y",
  registeredBy: "",
  registeredDate: "",
  lastUpdatedBy: "",
  lastUpdatedDate: "",
};

const CurrRef = () => {
  const queryClient = useQueryClient();
  const docType = "CURR";
  const documentTitle = reftables[docType] || "Currency";

  const { user } = useAuth();
  const userCode = user?.userCode || user?.USER_CODE || "ADMIN";

  const [form, setForm] = useState(INITIAL_FORM);
  const [rows, setRows] = useState([]);
  const [selectedCode, setSelectedCode] = useState(null); 
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false); 
  const [tblFieldArray, setTblFieldArray] = useState([]); // Added missing state

  const nameRef = useRef(null);
  const codeRef = useRef(null);

  const updateForm = (patch) => setForm((p) => ({ ...p, ...patch }));

  const resetForm = useCallback(() => {
    setForm(INITIAL_FORM);
    setSelectedCode(null);
    setIsEditing(false);
  }, []);

  /* ================= METADATA LOAD ================= */

  // Load max length metadata for the Currency table
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await useFieldLenghtCheck("CURR_REF"); // Adjusted to match Currency Table name
        if (mounted) setTblFieldArray(res || []);
      } catch (err) {
        console.error("Failed to fetch field lengths:", err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const getMax = (col) => useGetFieldLength(tblFieldArray, col) || 100; // Default fallback

  /* ================= API ACTIONS ================= */

  const { mutate: saveCurrency } = useMutation({
    mutationFn: async (payload) => await apiClient.post("/upsertCurr", payload),
    onSuccess: (resp) => {
      const sqlRow = resp?.data?.data?.[0] || resp?.data; // Handle both controller formats
      if (sqlRow?.errorcount > 0) {
        useSwalErrorAlert("Error", sqlRow?.errormsg || "Failed to save.");
        return;
      }

      useSwalSuccessAlert("Success!", "Currency saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["currencyList"] });
      loadList(); 
      resetForm();
    },
    onError: (err) => useSwalErrorAlertAPI("System Error", err),
  });

  /* ================= LOGIC HANDLERS ================= */

  const handleCheckDuplicate = async (code) => {
    if (selectedCode || !code) return;
    try {
      const clean = code.trim().toUpperCase();
      const resp = await apiClient.post("/checkDuplicateCurr", {
        json_data: { currCode: clean },
      });

      const sqlRow = resp?.data?.data?.[0] || resp?.data;
      const rawJsonString = sqlRow?.result || Object.values(sqlRow || {})[0];
      const parsedData = typeof rawJsonString === 'string' ? JSON.parse(rawJsonString) : rawJsonString;

      if (parsedData?.result === "1" || sqlRow?.result === "1") {
        updateForm({ currCode: "" });
        return useSwalErrorAlert("Duplicate Error", `The Code "${clean}" is already used.`);
      }
    } catch (error) {
      console.error("Duplicate Check Error:", error);
    }
  };

  const handleSave = async () => {
    if (!form.currCode || !form.currName) {
      return useSwalErrorAlert("Validation Error", "All fields are required.");
    }

    // Validation for length before sending to API
    if (form.currCode.length > getMax("CURR_CODE")) {
        return useSwalValidationAlert("Length Error", `Code cannot exceed ${getMax("CURR_CODE")} characters.`);
    }

    if (!selectedCode) {
      const resp = await apiClient.post("/checkDuplicateCurr", {
        json_data: { currCode: form.currCode },
      });
      const sqlRow = resp?.data?.data?.[0] || resp?.data;
      const parsedData = typeof sqlRow?.result === 'string' ? JSON.parse(sqlRow?.result) : sqlRow;
      
      if (parsedData?.result === "1" || sqlRow?.result === "1") {
        return useSwalErrorAlert("Duplicate Error", `Code ${form.currCode} is already used.`);
      }
    }

    saveCurrency({
      json_data: {
        currCode: form.currCode,
        currName: form.currName,
        userCode,
      },
    });
  };

  const handleDelete = async (row) => {
    try {
      const checkResp = await apiClient.post("/checkInUsedCurr", { 
        json_data: { currCode: row.currCode } 
      });
      
      const sqlRow = checkResp?.data?.data?.[0] || checkResp?.data;
      if (sqlRow?.isInUsed) {
        return useSwalErrorAlert("Cannot Delete", `Currency "${row.currCode}" is in use.`);
      }

      const confirm = await useSwalDeleteConfirm("Confirm Delete", `Delete Currency: ${row.currCode}?`);
      if (confirm.isConfirmed) {
        const response = await apiClient.post("/deleteCurr", {
          json_data: { currCode: row.currCode, userCode },
        });

        if (response?.data?.success) {
          useSwalDeleteRecord("Deleted!", "The currency has been successfully removed.");
          loadList();
          resetForm();
        }
      }
    } catch (err) {
      useSwalErrorAlertAPI("System Error", err);
    }
  };

  const loadList = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get("/curr");
      const r = res.data?.data?.[0]?.result || res.data?.result;
      setRows(typeof r === 'string' ? JSON.parse(r) : (r || []));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleEdit = (row) => {
    setForm({ ...INITIAL_FORM, ...row });
    setSelectedCode(row.currCode); 
    setIsEditing(true);
    setTimeout(() => nameRef.current?.focus?.(), 0);
  };

  useEffect(() => { loadList(); }, [loadList]);

  const columns = useMemo(() => [
    {
      key: "__actions",
      label: "Actions",
      render: (row) => (
        <div className="flex gap-2 justify-center">
          <button onClick={() => handleEdit(row)} className="p-1.5 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white">
            <FontAwesomeIcon icon={faEdit} />
          </button>
          <button onClick={() => handleDelete(row)} className="p-1.5 rounded-md bg-red-100 text-red-700 hover:bg-red-600 hover:text-white">
            <FontAwesomeIcon icon={faTrashAlt} />
          </button>
        </div>
      ),
    },
    { key: "currCode", label: "Currency Code", sortable: true },
    { key: "currName", label: "Currency Name", sortable: true },
  ], [loadList]);

  return (
    <div className="global-ref-main-div-ui">
      {isLoading && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center">
            <div className="bg-white p-6 rounded-2xl flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-semibold">Loading...</span>
            </div>
        </div>
      )}

      <div className="global-ref-header-ui">
        <div className="w-full flex justify-between items-center px-4">
          <h1 className="global-ref-headertext-ui">{documentTitle}</h1>
          <div className="flex gap-2">
            <button onClick={() => { resetForm(); setIsEditing(true); }} className="bg-blue-600 text-white h-8 px-4 rounded-md text-[11px]">
              <FontAwesomeIcon icon={faPlus} className="mr-1" /> Add
            </button>
            <button onClick={handleSave} disabled={!isEditing} className="bg-blue-600 text-white h-8 px-4 rounded-md text-[11px]">
              <FontAwesomeIcon icon={faSave} className="mr-1" /> Save
            </button>
            <button onClick={resetForm} className="bg-blue-600 text-white h-8 px-4 rounded-md text-[11px]">
              <FontAwesomeIcon icon={faUndo} className="mr-1" /> Reset
            </button>
          </div>
        </div>
      </div>

      <div className="mt-24 px-4 pb-10">
        <div className="flex flex-col xl:flex-row gap-6">
          <div className="w-full xl:w-[400px] flex flex-col gap-4 shrink-0">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 shadow-lg">
              <h2 className="text-sm font-bold text-blue-600 mb-6 uppercase tracking-wider border-b pb-2">Entry Details</h2>
              <div className="space-y-6">
                <FieldRenderer
                  label="Currency Code"
                  required
                  type="text"
                  value={form.currCode}
                  onChange={(v) => updateForm({ currCode: (v || "").toUpperCase() })}
                  disabled={!isEditing || !!selectedCode}
                  onBlur={(e) => handleCheckDuplicate(e.target.value)}
                  inputRef={codeRef}
                  maxLength={getMax("CURR_CODE")} 
                />
                <FieldRenderer
                  label="Currency Name"
                  required
                  type="text"
                  value={form.currName}
                  onChange={(v) => updateForm({ currName: v || "" })}
                  disabled={!isEditing}
                  inputRef={nameRef}
                  maxLength={getMax("CURR_NAME")} 
                />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100">
              <RegistrationInfo data={form} layout="stacked" />
            </div>
          </div>

          <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 shadow-lg overflow-hidden flex flex-col min-h-[500px]">
            <SearchGlobalReferenceTable
              columns={columns}
              data={rows}
              docType="Currency"
              isLoading={isLoading}
              onRowDoubleClick={handleEdit}
              tableSize="Half"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrRef;