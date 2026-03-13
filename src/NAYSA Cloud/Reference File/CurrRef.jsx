import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useAuth } from "@/NAYSA Cloud/Authentication/AuthContext.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faSave, faUndo, faTrashAlt, faEdit } from "@fortawesome/free-solid-svg-icons";

import { apiClient } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";
import FieldRenderer from "@/NAYSA Cloud/Global/FieldRenderer";
import RegistrationInfo from "@/NAYSA Cloud/Global/RegistrationInfo";
import SearchGlobalReferenceTable from "@/NAYSA Cloud/Lookup/SearchGlobalReferenceTable";

import {
  useSwalErrorAlert,
  useSwalDeleteConfirm,
  useSwalDeleteRecord,
  useSwalshowSave,
  useSwalValidationAlert,
} from "@/NAYSA Cloud/Global/behavior";

import { reftables } from "@/NAYSA Cloud/Global/reftable";

const SectionHeader = ({ title }) => (
  <div className="mb-3">
    <div className="text-sm font-bold text-gray-800 border-b pb-1">{title}</div>
  </div>
);

const parseSprocJsonResult = (rows) => {
  if (!rows || !rows.length) return null;
  const r = rows[0]?.result;
  if (!r) return null;
  try {
    return JSON.parse(r);
  } catch {
    return null;
  }
};

const getVal = (v) => (v && v.target ? v.target.value : v);

const CurrRef = () => {
  const docType = "CURR";
  const documentTitle = reftables[docType] || "Currency";

  const { user } = useAuth();
  const userCode = user?.userCode || user?.USER_CODE || "ADMIN";

  const emptyForm = useMemo(
    () => ({
      code: "",
      name: "",
      active: "Y",
      registeredBy: "",
      registeredDate: "",
      lastUpdatedBy: "",
      lastUpdatedDate: "",
    }),
    []
  );

  const [form, setForm] = useState(emptyForm);
  const [rows, setRows] = useState([]);
  const [selectedCode, setSelectedCode] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // ✅ true when adding new record
  const isAddMode = isEditing && !selectedCode;

  const nameRef = useRef(null);

  const updateForm = useCallback((patch) => {
    setForm((p) => ({ ...p, ...patch }));
  }, []);

  const normalizeRow = useCallback((x) => {
    return {
      code: x?.currCode ??  "",
      name: x?.currName ??  "",
      registeredBy: x?.registeredBy ?? "",
      registeredDate: x?.registeredDate ?? "",
      lastUpdatedBy: x?.lastUpdatedBy ?? "",
      lastUpdatedDate: x?.lastUpdatedDate ?? "",
    };
  }, []);

  const loadList = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get("/curr");
      const raw = parseSprocJsonResult(res.data?.data) || [];
      setRows(raw.map(normalizeRow));
    } catch (err) {
      await useSwalErrorAlert("Error", "Failed to load Currency");
    } finally {
      setIsLoading(false);
    }
  }, [normalizeRow]);

  const latestGetRef = useRef(0);
  
  const fetchOne = useCallback(
  async (code) => {
    if (!code) return null;

    const reqId = ++latestGetRef.current;

    try {
      // setIsLoading(true);

      const res = await apiClient.get("/getCurr", { params: { CURR_CODE: code } });
      const row = parseSprocJsonResult(res?.data?.data)?.[0];


      console.log("res",res)

      if (!row) return null;


      // ignore old request
      if (reqId !== latestGetRef.current) return null;

      const normalized = normalizeRow(row);
      setForm(normalized);

      // ✅ selectedCode must be STRING
      setSelectedCode(normalized.code);

      return normalized;
    } catch (e) {
      await useSwalErrorAlert("Error", "Failed to fetch record.");
      return null;
    } finally {
      setIsLoading(false);
    }
  },
  [normalizeRow]
);


  const resetForm = useCallback(() => {
    setForm(emptyForm);
    setSelectedCode("");
    setIsEditing(false);
  }, [emptyForm]);

  /* ================= HANDLERS ================= */

  // ✅ IMPORTANT: keep deps so it always uses latest fetchOne
  const handleEditAccount = useCallback(
  async (row) => {
    const code = row?.code || "";
    if (!code) return;

    // ✅ set selection immediately (string)
    setSelectedCode(code);

    // fetch record then enable edit
    const full = await fetchOne(code);

    if (full) {
      setIsEditing(true);

      // focus name (optional)
      setTimeout(() => nameRef.current?.focus?.(), 0);
    }
  },
  [fetchOne]
);
const handleDeleteAccount = useCallback(
  async (row) => {
    try {
      // setIsLoading(true);

      // 1. Check if the currency is in use
      const checkResp = await apiClient.post("/checkInUsedCurr", {
        json_data: { currCode: row.code },
      });

      // Parse the result from the sproc
      const rawResult = checkResp?.data?.data?.[0]?.result;
      const parsed = typeof rawResult === 'string' ? JSON.parse(rawResult) : rawResult;
      // const isInUsed = String(parsed?.result) === "1";
      const isInUsed = checkResp.data.isInUsed;

      if (isInUsed) {
        await useSwalValidationAlert({
          title: "Cannot Delete",
          message: `Currency "${row.code}" is currently in use by other records and cannot be deleted.`,
        });
        return;
      }

      // 2. Proceed with Delete Confirmation if NOT in use
      const result = await useSwalDeleteConfirm(
        "Delete Confirmation",
        `Are you sure you want to delete currency "${row.code}"?`
      );

      if (!result?.isConfirmed) return;

      const response = await apiClient.post("/deleteCurr", {
        json_data: { currCode: row.code, userCode },
      });

      if (response?.data?.success) {
        await useSwalDeleteRecord();
        await loadList();
        resetForm();
      } else {
        await useSwalErrorAlert("Error", response?.data?.message || "Delete failed");
      }
    } catch (err) {
      console.error(err);
      await useSwalErrorAlert("Error", "Server error occurred during deletion check.");
    } finally {
      setIsLoading(false);
    }
  },
  [loadList, resetForm, userCode]
);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const payload = {
        json_data: {
          currCode: form.code,
          currName: form.name,
          userCode,
        },
      };

      const resp = await apiClient.post("/upsertCurr", payload);

      if (resp?.data?.errorcount > 0) {
        await useSwalValidationAlert({
          title: "Validation Error",
          message: resp.data.errormsg,
        });
        return;
      }

      await useSwalshowSave();
      setIsEditing(false);
      await loadList();
      setSelectedCode(form.code);
    } catch (err) {
      console.error(err);
      await useSwalErrorAlert("Error", "A server error occurred while saving.");
    } finally {
      setSaving(false);
    }
  }, [form.code, form.name, loadList, userCode]);

  const columns = useMemo(
    () => [
      { key: "code", label: "Code", sortable: true },
      { key: "name", label: "Currency Name", sortable: true },
      {
        key: "__actions",
        label: "Actions",
        sortable: false,
        renderType: "actions",
        render: (row) => (
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              className="px-2 py-1 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700"
              onClick={(e) => {
                e.stopPropagation();
                handleEditAccount(row);
              }}
              title="Edit"
            >
              <FontAwesomeIcon icon={faEdit} />
            </button>
            <button
              type="button"
              className="px-2 py-1 text-xs rounded-md bg-red-600 text-white hover:bg-red-700"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteAccount(row);
              }}
              title="Delete"
            >
              <FontAwesomeIcon icon={faTrashAlt} />
            </button>
          </div>
        ),
      },
    ],
    [handleDeleteAccount, handleEditAccount]
  );

  useEffect(() => {
    loadList();
  }, [loadList]);

const codeRef = useRef(null);
const [dupChecking, setDupChecking] = useState(false);


const checkDuplicate = useCallback(
  async (code) => {
    const clean = (code || "").trim().toUpperCase();
    console.log("checkDuplicate fired:", clean);

    if (!clean) return false;
    if (!isAddMode) {
      console.log("skip duplicate check - not add mode", { isEditing, selectedCode });
      return false;
    }

    try {
      setDupChecking(true);

      const resp = await apiClient.post("/checkDuplicateCurr", {
        json_data: { currCode: clean },
      });

      console.log("dup api resp:", resp?.data);

      if (!resp?.data?.success) {
        await useSwalErrorAlert("Error", resp?.data?.message || "Duplicate check failed");
        return false;
      }

      const result = resp?.data?.result; // should be "1" or "0"
      const isDup = String(result) === "1";

      if (isDup) {
        await useSwalValidationAlert({
          title: "Duplicate Code",
          message: `Currency code "${clean}" already exists.`,
        });

        updateForm({ code: "" });
        setTimeout(() => codeRef.current?.focus?.(), 0);
        return true;
      }

      return false;
    } catch (e) {
      console.error("dup error:", e?.response?.status, e?.response?.data, e);
      await useSwalErrorAlert("Error", "Failed to check duplicate code.");
      return false;
    } finally {
      setDupChecking(false);
    }
  },
  [isAddMode, isEditing, selectedCode, updateForm]
);


const handleCodeBlur = useCallback(async () => {
  await checkDuplicate(form.code);
}, [checkDuplicate, form.code]);

const handleCodeKeyDown = useCallback(
  async (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();

    const dup = await checkDuplicate(form.code);
    if (!dup) {
      // move focus to name if not duplicate
      setTimeout(() => nameRef.current?.focus?.(), 0);
    }
  },
  [checkDuplicate, form.code]
);


  return (
    <div className="global-ref-main-div-ui mt-24">
      {/* HEADER */}
      <div className="fixed mt-4 top-14 left-6 right-6 z-30 global-ref-header-ui flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="global-ref-headertext-ui">{documentTitle}</h1>

        <div className="flex gap-2 text-xs">
          <button
            onClick={() => {
              setForm(emptyForm);
              setSelectedCode(""); // ✅ add mode
              setIsEditing(true);
              setTimeout(() => nameRef.current?.focus?.(), 0);
            }}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <FontAwesomeIcon icon={faPlus} /> Add
          </button>

          <button
            onClick={save}
            disabled={!isEditing || saving}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faSave} /> Save
          </button>

          <button
            onClick={resetForm}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <FontAwesomeIcon icon={faUndo} /> Reset
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="global-tran-tab-div-ui mt-5" style={{ minHeight: "calc(100vh - 170px)" }}>
        <div className="grid grid-cols-1 md:grid-cols-[400px_1fr] gap-6">
          <div className="global-ref-textbox-group-div-ui space-y-4 h-fit">
            {/* <SectionHeader title="Currency Details" /> */}

            {/* ✅ CODE: editable ONLY in Add mode */}
            <FieldRenderer
              id="currCode"
              name="code"
              label="Code"
              type="text"
              value={form.code}
              onChange={(v) => updateForm({ code: (getVal(v) || "").toUpperCase() })}
              disabled={!isAddMode}
              required
              inputRef={codeRef}
              onBlur={handleCodeBlur}
              // onKeyDown={handleCodeKeyDown}             
              loading={dupChecking} // optional if your FieldRenderer supports it
            />

            <FieldRenderer
              id="currName"
              name="name"
              label="Name"
              type="text"
              value={form.name}
              onChange={(v) => updateForm({ name: getVal(v) || "" })}
              disabled={!isEditing}   // ✅ editable on add/edit
              required
              inputRef={nameRef}
            />
            
            <RegistrationInfo data={form} layout="stacked" disabled />

          </div>

          <SearchGlobalReferenceTable
            columns={columns}
            data={rows}
            docType="CURR"
            isLoading={isLoading}
            onRowDoubleClick={(row) => handleEditAccount(row)}
            tableSize="Half"
            
          />
        </div>
      </div>
    </div>
  );
};

export default CurrRef;