// src/NAYSA Cloud/Reference File/PayTermRef.jsx

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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faSave,
  faUndo,
  faList,
} from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";

import { apiClient } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";
import { useAuth } from "@/NAYSA Cloud/Authentication/AuthContext.jsx";
import {
  useSwalErrorAlert,
  useSwalSuccessAlert,
  useSwalDeleteConfirm,
  useSwalDeleteRecord,
} from "@/NAYSA Cloud/Global/behavior.jsx";

import FieldRenderer from "@/NAYSA Cloud/Global/FieldRenderer.jsx";
import SearchGlobalReferenceTable from "@/NAYSA Cloud/Lookup/SearchGlobalReferenceTable.jsx";
import RegistrationInfo from "@/NAYSA Cloud/Global/RegistrationInfo.jsx";
import ButtonBar from "@/NAYSA Cloud/Global/ButtonBar";

/* ================= HELPERS ================= */

const Card = ({ children }) => (
  <div className="global-tran-textbox-group-div-ui self-start !h-fit">{children}</div>
);

const SectionHeader = ({ title }) => (
  <div className="mb-3">
    <div className="text-[10px] font-bold text-slate-500 tracking-widest border-b pb-2 uppercase">{title}</div>
  </div>
);

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
  paytermCode: "",
  paytermName: "",
  daysDue: "",
  advances: "",
  registeredBy: "",
  registeredDate: "",
  lastUpdatedBy: "",
  lastUpdatedDate: "",
  __existing: false,
};

const PayTermRef = forwardRef((props, ref) => {
  const title = "Payment Terms";
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const tableSize = "Half";

  const userCode =
    user?.USER_CODE || user?.userCode || user?.code || "ADMIN";

  const codeInputRef = useRef(null);
  const enterValidatedRef = useRef(false);

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

  /* ================= LOAD LIST ================= */

  const paytermListQuery = useQuery({
    queryKey: ["paytermList"],
    queryFn: async () => {
      const res = await apiClient.get("/payterm");
      return extractRows(res);
    },
  });

  const payterms = useMemo(
    () => paytermListQuery.data || [],
    [paytermListQuery.data]
  );

  const isInitialLoading = paytermListQuery.isLoading;

  /* ================= DUPLICATE CHECK ================= */

  const checkDuplicate = async (paytermCode) => {
    const c = String(paytermCode || "").trim();
    if (!c) return false;

    const res = await apiClient.post("/checkDuplicatePayterm", {
      json_data: { paytermCode: c },
    });

    const row0 = res?.data?.data?.[0] || {};
    const raw = row0?.result ?? row0?.[""] ?? '{"result":"0"}';
    const parsed = JSON.parse(raw);

    return String(parsed?.result) === "1";
  };

  const checkInUsed = async (paytermCode) => {
    const c = String(paytermCode || "").trim();
    if (!c) return false;

    const res = await apiClient.post("/checkInUsedPayterm", {
      json_data: { paytermCode: c },
    });

    const row0 = res?.data?.data?.[0] || {};
    const raw = row0?.result ?? row0?.[""] ?? '{"result":"0"}';
    const parsed = JSON.parse(raw);

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

    const code = String(form.paytermCode || "").trim();
    if (!code || !isEditing || form.__existing) return;

    const dup = await checkDuplicate(code);

    if (dup) {
      setIsDupCode(true);
      await useSwalErrorAlert(
        "Duplicate Entry",
        `Payment Term Code "${code}" already exists.`
      );
      setField("paytermCode", "");
      setTimeout(() => codeInputRef.current?.focus?.(), 0);
    } else {
      setIsDupCode(false);
    }
  };

  /* ================= SAVE ================= */
  const parseSprocStatus = (response) => {
    const row0 = response?.data?.data?.[0] || {};

    if (row0?.result) {
      try {
        const parsed = JSON.parse(row0.result);
        return {
          errorcount: Number(parsed?.errorcount ?? 0),
          errormsg: String(parsed?.errormsg ?? ""),
        };
      } catch {
        return {
          errorcount: Number(row0?.errorcount ?? response?.data?.errorcount ?? 0),
          errormsg: String(row0?.errormsg ?? response?.data?.errormsg ?? ""),
        };
      }
    }

    return {
      errorcount: Number(row0?.errorcount ?? response?.data?.errorcount ?? 0),
      errormsg: String(row0?.errormsg ?? response?.data?.errormsg ?? ""),
    };
  };

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      return apiClient.post("/upsertPayterm", {
        json_data: {
          paytermCode: payload.paytermCode,
          paytermName: payload.paytermName,
          dueDays: payload.dueDays,
          advances: payload.advances,
          userCode: payload.userCode,
        },
      });
    },
    onSuccess: async (response) => {
      const row =
        response?.data?.data?.[0] ||
        response?.data ||
        {};

      const errorcount = Number(row?.errorcount ?? 0);
      const errormsg = String(row?.errormsg ?? "");

      if (errorcount > 0) {
        await useSwalErrorAlert(
          "Validation Error",
          errormsg || "Please fill in the required field(s)."
        );
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["paytermList"] });
      await useSwalSuccessAlert(
        "Success!",
        "Payment Term saved successfully."
      );

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
        "Failed to save payment term.";

      await useSwalErrorAlert("Validation Error", msg);
    },
  });

  const handleSave = useCallback(() => {
    if (!isEditing || saveMutation.isPending) return;

    const payload = {
      paytermCode: String(form.paytermCode || "")
        .trim()
        .toUpperCase(),
      paytermName: String(form.paytermName || "").trim(),
      dueDays:
        form.daysDue === "" ? null : Number(form.daysDue),
      advances: form.advances === "Y" ? "Y" : "",
      userCode,
    };

    saveMutation.mutate(payload);
  }, [form, isEditing, saveMutation, userCode]);

  /* ================= DELETE ================= */
  const deleteMutation = useMutation({
    mutationFn: async (paytermCode) => {
      return apiClient.post("/deletePayterm", {
        json_data: { paytermCode, userCode },
      });
    },
    // Fix: Added paytermCode as the second parameter here so it reads the variable passed in
    onSuccess: async (response, paytermCode) => {
      const sqlRow = response?.data?.data?.[0] || {};
      const errorcount = Number(sqlRow.errorcount ?? 0);
      const errormsg = String(sqlRow.errormsg ?? "");

      if (errorcount > 0) {
        await useSwalErrorAlert("Error", errormsg);
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["paytermList"] });
      
      await useSwalDeleteRecord(
        "Deleted", 
        `Payment Term Code ${paytermCode} has been successfully removed.`
      );

      resetForm(DEFAULT_FORM);
      setIsEditing(false);
      setSelectedRow(null);
    },
    onError: async (error) => {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.errormsg ||
        error?.message ||
        "Failed to delete payment term.";

      await useSwalErrorAlert("Error", msg);
    },
  });

  const handleDelete = useCallback(
    async (row) => {
      const code = row?.paytermCode;
      if (!code) return;

      const used = await checkInUsed(code);

      if (used) {
        return useSwalErrorAlert(
          "Cannot Delete",
          `Payment Term "${code}" is already in use.`
        );
      }

      const confirm = await useSwalDeleteConfirm(
        "Delete Record?",
        `Are you sure you want to delete "${code}"?`
      );

      if (!confirm?.isConfirmed) return;

      deleteMutation.mutate(code);
    },
    [deleteMutation]
  );

  /* ================= EDIT ================= */

  const handleEdit = async (row) => {
    try {
      const res = await apiClient.get("/getPayterm", {
        params: { PAYTERM_CODE: row.paytermCode },
      });

      const record = extractRows(res)?.[0];
      setForm({ ...DEFAULT_FORM, ...record, __existing: true });
      setIsEditing(true);
      setSelectedRow(row);
    } catch {
      Swal.fire("Error", "Could not fetch record", "error");
    }
  };

  /* ================= TABLE ================= */

  const tableColumns = useMemo(
    () => [
      {
        key: "__actions",
        label: "Actions",
        width: 140,
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
        key: "paytermCode",
        label: "Code",
        sortable: true,
        width: 160,
      },
      {
        key: "paytermName",
        label: "Name",
        sortable: true,
        width: 380,
      },
      {
        key: "daysDue",
        label: "Due Days",
        sortable: true,
        width: 140,
      },
    ],
    [handleEdit, handleDelete]
  );

  const tableData = useMemo(
    () =>
      (Array.isArray(payterms) ? payterms : [])
        .filter((row) => {
          const s = String(search || "").trim().toLowerCase();
          if (!s) return true;

          return (
            String(row?.paytermCode || "").toLowerCase().includes(s) ||
            String(row?.paytermName || "").toLowerCase().includes(s) ||
            String(row?.daysDue || "").toLowerCase().includes(s)
          );
        })
        .map((row, index) => ({
          ...row,
          __idx: index,
        })),
    [payterms, search]
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

  /* ================= BUTTONS ================= */

  const buttons = [
    {
      key: "add",
      label: "Add",
      icon: faPlus,
      onClick: () => {
        setIsEditing(true);
        setSelectedRow(null);
        setIsDupCode(false);
        resetForm(DEFAULT_FORM);
        setTimeout(() => codeInputRef.current?.focus?.(), 0);
      },
    },
    {
      key: "save",
      label: "Save",
      icon: faSave,
      onClick: handleSave,
      disabled: !isEditing || isDupCode || saveMutation.isPending,
    },
    {
      key: "reset",
      label: "Reset",
      icon: faUndo,
      onClick: () => {
        resetForm(DEFAULT_FORM);
        setIsEditing(false);
        setSelectedRow(null);
        setIsDupCode(false);
      },
    },
  ];

  /* ================= RENDER ================= */

  return (
    <>
      <Card>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faList} />
            <div className="font-bold">{title}</div>
          </div>

          <div className="flex gap-3 items-center">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="global-tran-textbox-ui w-[250px]"
            />
            <ButtonBar buttons={buttons} />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {/* FORM */}
        <Card>
          <SectionHeader title="Basic Information" />

          <FieldRenderer
            label="Payment Term Code"
            required
            value={form.paytermCode}
            inputRef={codeInputRef}
            onChange={(v) =>
              setField("paytermCode", String(v ?? "").toUpperCase())
            }
            onBlur={handleCodeValidate}
            onKeyDown={handleCodeValidate}
            disabled={!isEditing || form.__existing}
          />

          <FieldRenderer
            label="Payment Term Name"
            required
            value={form.paytermName}
            onChange={(v) =>
              setField("paytermName", v ?? "")
            }
            disabled={!isEditing}
          />

          <FieldRenderer
            label="Due Days"
            type="number"
            value={form.daysDue}
            onChange={(v) =>
              setField("daysDue", v ?? "")
            }
            disabled={!isEditing}
          />

          <RegistrationInfo data={form} layout="stacked" />
        </Card>

        {/* LIST */}
        <div>
          <h2 className="text-base font-semibold mb-4">List</h2>

          <SearchGlobalReferenceTable
            columns={tableColumns}
            data={tableData}
            isLoading={isInitialLoading}
            docType="Payment Terms"
            itemsPerPage={10}
            onRowDoubleClick={handleEdit}
            onRowClick={(row) => setSelectedRow(row)}
            showFilters
            tableSize={tableSize}
          />
        </div>
      </div>
    </>
  );
});

export default PayTermRef;