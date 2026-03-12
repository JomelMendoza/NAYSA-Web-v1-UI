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
import Swal from "sweetalert2";

import { apiClient } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";
import { useAuth } from "@/NAYSA Cloud/Authentication/AuthContext.jsx";
import {
  useSwalErrorAlert,
  useSwalSuccessAlert,
} from "@/NAYSA Cloud/Global/behavior";
import {
  reftables,
  reftablesPDFGuide,
  reftablesVideoGuide,
} from "@/NAYSA Cloud/Global/reftable";
import FieldRenderer from "@/NAYSA Cloud/Global/FieldRenderer.jsx";
import SearchGlobalReferenceTable from "@/NAYSA Cloud/Lookup/SearchGlobalReferenceTable.jsx";
import RegistrationInfo from "@/NAYSA Cloud/Global/RegistrationInfo.jsx";

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
  bankTypeCode: "",
  bankTypeName: "",
  __existing: false,
};

const BankRef = forwardRef(
  (
    {
      embedded = false,
      activeTab = "banktypes",
      setActiveTab = () => {},
      tabs = [],
    },
    ref
  ) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const docType = "BankType";
    const documentTitle = reftables?.[docType] || "Bank Type Codes";
    const pdfLink = reftablesPDFGuide?.[docType];
    const videoLink = reftablesVideoGuide?.[docType];

    const codeInputRef = useRef(null);
    const tableRef = useRef(null);
    const enterValidatedRef = useRef(false);

    const [selectedRow, setSelectedRow] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isDupCode, setIsDupCode] = useState(false);

    const [form, setForm] = useState(DEFAULT_FORM);

    const setField = (key, value) =>
      setForm((prev) => ({ ...prev, [key]: value }));

    const resetForm = useCallback((next = DEFAULT_FORM) => {
      setForm(next);
    }, []);

    useEffect(() => {
      if (!embedded) document.title = documentTitle;
    }, [documentTitle, embedded]);

    /* ================= TANSTACK QUERY ================= */

    const bankTypeListQuery = useQuery({
      queryKey: ["bankTypeList"],
      queryFn: async () => {
        const res = await apiClient.get("/bankType");
        return extractRows(res);
      },
    });

    const bankTypes = useMemo(
      () => bankTypeListQuery.data || [],
      [bankTypeListQuery.data]
    );

    const isInitialLoading = bankTypeListQuery.isLoading;

    const saveMutation = useMutation({
      mutationFn: async (payload) => {
        return apiClient.post("/upsertBankType", {
          json_data: JSON.stringify(payload),
        });
      },
      onSuccess: (response) => {
        const sqlRow = response?.data?.data?.[0] || {};
        const errorcount = Number(sqlRow.errorcount ?? sqlRow.ERRORCOUNT ?? 0);
        const errormsg = String(sqlRow.errormsg ?? sqlRow.ERRORMSG ?? "");

        if (errorcount > 0) {
          useSwalErrorAlert("Error", errormsg);
          return;
        }

        queryClient.invalidateQueries({ queryKey: ["bankTypeList"] });
        useSwalSuccessAlert("Success!", "Bank Type saved successfully.");
        setIsEditing(false);
        setSelectedRow(null);
        setIsDupCode(false);
        resetForm(DEFAULT_FORM);
      },
      onError: (error) => {
        useSwalErrorAlert("System Error", error.message);
      },
    });

    const deleteMutation = useMutation({
      mutationFn: async (bankTypeCode) => {
        return apiClient.post("/deleteBankType", {
          json_data: { bankTypeCode },
        });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["bankTypeList"] });
        Swal.fire("Deleted", "Bank Type record has been removed.", "success");
        handleReset();
      },
      onError: (error) => {
        useSwalErrorAlert("System Error", error.message);
      },
    });

    /* ================= ACTIONS ================= */

    const startNew = useCallback(() => {
      resetForm(DEFAULT_FORM);
      setIsEditing(true);
      setSelectedRow(null);
      setIsDupCode(false);
      setTimeout(() => codeInputRef.current?.focus?.(), 0);
    }, [resetForm]);

    const handleReset = useCallback(() => {
      resetForm(DEFAULT_FORM);
      setIsEditing(false);
      setSelectedRow(null);
      setIsDupCode(false);
    }, [resetForm]);

    const checkDuplicate = async (bankTypeCode) => {
      const c = String(bankTypeCode || "").trim();
      if (!c) return false;

      const res = await apiClient.post("/checkDuplicateBankType", {
        json_data: { bankTypeCode: c },
      });

      const row0 = res?.data?.data?.[0] || {};
      const raw = row0?.result ?? row0?.[""] ?? '{"result":"0"}';
      const parsed = JSON.parse(raw);

      return String(parsed?.result) === "1";
    };

    const checkInUsed = async (bankTypeCode) => {
      const c = String(bankTypeCode || "").trim();
      if (!c) return false;

      const res = await apiClient.post("/checkInUsedBankType", {
        json_data: { bankTypeCode: c },
      });

      const row0 = res?.data?.data?.[0] || {};
      const raw = row0?.result ?? row0?.[""] ?? '{"result":"0"}';
      const parsed = JSON.parse(raw);

      return String(parsed?.result) === "1";
    };

    const handleBankTypeCodeValidate = async (arg) => {
      const isEvent = arg && typeof arg === "object" && "type" in arg;

      if (isEvent && arg.type === "keydown") {
        if (arg.key !== "Enter") return;
        enterValidatedRef.current = true;
      }

      if (isEvent && arg.type === "blur" && enterValidatedRef.current) {
        enterValidatedRef.current = false;
        return;
      }

      const code = String(form.bankTypeCode || "").trim();
      if (!code || !isEditing || form.__existing) return;

      const dup = await checkDuplicate(code);

      if (dup) {
        setIsDupCode(true);
        Swal.fire(
          "Duplicate Entry",
          `Bank Type Code "${code}" is already in use.`,
          "error"
        );
        setField("bankTypeCode", "");
        setTimeout(() => codeInputRef.current?.focus?.(), 0);
      } else {
        setIsDupCode(false);
      }
    };

    const handleSave = useCallback(() => {
      if (!isEditing || saveMutation.isPending) return;

      const payload = {
        bankTypeCode: String(form.bankTypeCode || "").trim().toUpperCase(),
        bankTypeName: String(form.bankTypeName || "").trim(),
        userCode: user?.USER_CODE || "ADMIN",
      };

      saveMutation.mutate(payload);
    }, [form, isEditing, saveMutation, user?.USER_CODE]);

    const handleEdit = async (row) => {
        try {
          const res = await apiClient.get("/getBankType", {
            params: { bankTypeCode: row.bankTypeCode },
          });
    
          const record = extractRows(res)?.[0];
          resetForm({ ...DEFAULT_FORM, ...record, __existing: true });
          setIsEditing(true);
          setSelectedRow(row);
        } catch {
          Swal.fire("Error", "Could not fetch record", "error");
        }
      };

    const handleDelete = useCallback(
      async (row) => {
        const code = row?.bankTypeCode ?? row?.banktype_code ?? "";

        if (!code) {
          return Swal.fire("Error", "No record selected.", "error");
        }

        const used = await checkInUsed(code);

        if (used) {
          return Swal.fire(
            "Cannot Delete",
            `Bank Type Code "${code}" is already in use.`,
            "warning"
          );
        }

        const confirm = await Swal.fire({
          title: "Delete Record?",
          text: `Are you sure you want to delete Bank Type "${code}"?`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Yes, delete it",
          cancelButtonText: "Cancel",
        });

        if (!confirm.isConfirmed) return;

        deleteMutation.mutate(code);
      },
      [deleteMutation]
    );

    const editSelected = useCallback(() => {
      if (!selectedRow) {
        return Swal.fire("Info", "Please select a record first.", "info");
      }
      handleEdit(selectedRow);
    }, [selectedRow, handleEdit]);

    const deleteSelected = useCallback(async () => {
      if (!selectedRow) {
        return Swal.fire("Info", "Please select a record first.", "info");
      }
      await handleDelete(selectedRow);
    }, [selectedRow, handleDelete]);

    const exportData = useCallback(() => {
      tableRef.current?.getState?.();
    }, []);

    const openInfo = useCallback(() => {
      const htmlParts = [];

      if (pdfLink) {
        htmlParts.push(
          `<div style="margin-bottom:8px;"><a href="${pdfLink}" target="_blank" rel="noopener noreferrer">Open PDF Guide</a></div>`
        );
      }

      if (videoLink) {
        htmlParts.push(
          `<div><a href="${videoLink}" target="_blank" rel="noopener noreferrer">Open Video Guide</a></div>`
        );
      }

      Swal.fire({
        title: documentTitle,
        html:
          htmlParts.join("") ||
          "<div>No guide or video link is available for this reference.</div>",
        icon: "info",
      });
    }, [documentTitle, pdfLink, videoLink]);

    useImperativeHandle(ref, () => ({
      startNew,
      edit: editSelected,
      editSelected,
      deleteSelected,
      save: handleSave,
      reset: handleReset,
      refresh: () =>
        queryClient.invalidateQueries({ queryKey: ["bankTypeList"] }),
      exportData,
      openInfo,
    }));

    /* ================= TABLE COLUMNS ================= */

    const tableColumns = useMemo(
      () => [
        {
          key: "bankTypeCode",
          label: "Code",
          sortable: true,
          width: 140,
          render: (row) => row?.bankTypeCode,
        },
        {
          key: "bankTypeName",
          label: "Name",
          sortable: true,
          width: 360,
          render: (row) => row?.bankTypeName,
        },
        {
          key: "__actions",
          label: "Actions",
          sortable: false,
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
      ],
      [handleEdit, handleDelete]
    );

    const tableData = useMemo(
      () =>
        (Array.isArray(bankTypes) ? bankTypes : []).map((row, index) => ({
          ...row,
          __idx: index,
          bankTypeCode: row?.bankTypeCode,
          bankTypeName: row?.bankTypeName,
        })),
      [bankTypes]
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

    return (
      <div className={embedded ? "w-full" : "global-ref-main-div-ui mt-24"}>
        <div className="w-full max-w-[905px] mx-auto px-4">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            <div className="xl:col-span-4">
              <div className="flex flex-col gap-4">
                <div className="border rounded-lg p-4">
                  <div className="grid grid-cols-1 gap-4">
                    <FieldRenderer
                      label="Bank Type Code"
                      required
                      value={form.bankTypeCode}
                      inputRef={codeInputRef}
                      onChange={(e) =>
                        setField(
                          "bankTypeCode",
                          String(e.target.value || "").toUpperCase()
                        )
                      }
                      onBlur={handleBankTypeCodeValidate}
                      disabled={!isEditing || form.__existing}
                    />

                    <FieldRenderer
                      label="Bank Type Name"
                      required
                      value={form.bankTypeName}
                      onChange={(e) =>
                        setField("bankTypeName", e.target.value)
                      }
                      disabled={!isEditing || saveMutation.isPending}
                    />
                  </div>
                </div>

                <RegistrationInfo
                  data={registrationData}
                  layout="stacked"
                  showHeader={true}
                />
              </div>
            </div>

            <div className="xl:col-span-8 flex items-start">
              <div className="w-full h-[426px] border rounded-lg p-2 min-w-0">
                <SearchGlobalReferenceTable
                  ref={tableRef}
                  docType={docType}
                  columns={tableColumns}
                  data={tableData}
                  itemsPerPage={10}
                  showFilters
                  isLoading={isInitialLoading}
                  className="h-full"
                  onRowDoubleClick={handleEdit}
                  selectedRow={selectedRow}
                  onRowClick={(row) => setSelectedRow(row)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default BankRef;