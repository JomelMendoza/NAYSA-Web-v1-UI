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
import {
  Edit,
  Trash2,
  Plus,
  Save,
  Undo2,
  Info,
  ChevronDown,
  FileText,
  Video,
} from "lucide-react";
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
// import RCMast from "@/NAYSA Cloud/Master Data/RCMast.jsx";

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
  rcTypeCode: "",
  rcTypeName: "",
  registeredBy: "",
  registeredDate: "",
  lastUpdatedBy: "",
  lastUpdatedDate: "",
  __existing: false,
};

const RcRef = forwardRef(
  (
    {
      embedded = false,
      activeTab = "rctype",
      setActiveTab = () => {},
      tabs = [],
    },
    ref
  ) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const docType = "RcType";
    const documentTitle = reftables?.[docType] || "RC Type Codes";
    const pdfLink = reftablesPDFGuide?.[docType];
    const videoLink = reftablesVideoGuide?.[docType];

    const codeInputRef = useRef(null);
    const tableRef = useRef(null);
    const enterValidatedRef = useRef(false);
    const guideRef = useRef(null);

    const [selectedRow, setSelectedRow] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isDupCode, setIsDupCode] = useState(false);
    const [isOpenGuide, setIsOpenGuide] = useState(false);

    const [form, setForm] = useState(DEFAULT_FORM);

    const setField = (key, value) =>
      setForm((prev) => ({ ...prev, [key]: value }));

    const resetForm = useCallback((next = DEFAULT_FORM) => {
      setForm(next);
    }, []);

    useEffect(() => {
      if (!embedded) document.title = documentTitle;
    }, [documentTitle, embedded]);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (guideRef.current && !guideRef.current.contains(event.target)) {
          setIsOpenGuide(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const rcTypeListQuery = useQuery({
      queryKey: ["rcTypeList"],
      queryFn: async () => {
        const res = await apiClient.get("/rcType");
        return extractRows(res);
      },
      enabled: activeTab === "rctype",
    });

    const rcTypes = useMemo(
      () => rcTypeListQuery.data || [],
      [rcTypeListQuery.data]
    );

    const isInitialLoading = rcTypeListQuery.isLoading;

    const saveMutation = useMutation({
      mutationFn: async (payload) => {
        return apiClient.post("/upsertRcType", {
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

        queryClient.invalidateQueries({ queryKey: ["rcTypeList"] });
        useSwalSuccessAlert("Success!", "RC Type saved successfully.");
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
      mutationFn: async (rcTypeCode) => {
        return apiClient.post("/deleteRcType", {
          json_data: { rcTypeCode },
        });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["rcTypeList"] });
        Swal.fire("Deleted", "RC Type record has been removed.", "success");
        handleReset();
      },
      onError: (error) => {
        useSwalErrorAlert("System Error", error.message);
      },
    });

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

    const checkDuplicate = async (rcTypeCode) => {
      const c = String(rcTypeCode || "").trim();
      if (!c) return false;

      const res = await apiClient.post("/checkDuplicateRcType", {
        json_data: { rcTypeCode: c },
      });

      const row0 = res?.data?.data?.[0] || {};
      const raw = row0?.result ?? row0?.[""] ?? '{"result":"0"}';
      const parsed = JSON.parse(raw);

      return String(parsed?.result) === "1";
    };

    const checkInUsed = async (rcTypeCode) => {
      const c = String(rcTypeCode || "").trim();
      if (!c) return false;

      const res = await apiClient.post("/checkInUsedRcType", {
        json_data: { rcTypeCode: c },
      });

      const row0 = res?.data?.data?.[0] || {};
      const raw = row0?.result ?? row0?.[""] ?? '{"result":"0"}';
      const parsed = JSON.parse(raw);

      return String(parsed?.result) === "1";
    };

    const handleRcTypeCodeValidate = async (arg) => {
      const isEvent = arg && typeof arg === "object" && "type" in arg;

      if (isEvent && arg.type === "keydown") {
        if (arg.key !== "Enter") return;
        enterValidatedRef.current = true;
      }

      if (isEvent && arg.type === "blur" && enterValidatedRef.current) {
        enterValidatedRef.current = false;
        return;
      }

      const code = String(form.rcTypeCode || "").trim();
      if (!code || !isEditing || form.__existing) return;

      const dup = await checkDuplicate(code);

      if (dup) {
        setIsDupCode(true);
        Swal.fire(
          "Duplicate Entry",
          `RC Type Code "${code}" is already in use.`,
          "error"
        );
        setField("rcTypeCode", "");
        setTimeout(() => codeInputRef.current?.focus?.(), 0);
      } else {
        setIsDupCode(false);
      }
    };

    const handleSave = useCallback(() => {
      if (!isEditing || saveMutation.isPending) return;

      const payload = {
        rcTypeCode: String(form.rcTypeCode || "").trim().toUpperCase(),
        rcTypeName: String(form.rcTypeName || "").trim(),
        userCode: user?.USER_CODE || "ADMIN",
      };

      if (!payload.rcTypeCode || !payload.rcTypeName) {
        Swal.fire(
          "Validation",
          "RC Type Code and RC Type Name are required.",
          "warning"
        );
        return;
      }

      saveMutation.mutate(payload);
    }, [form, isEditing, saveMutation, user?.USER_CODE]);

    const handleEdit = useCallback(
      async (row) => {
        try {
          const res = await apiClient.get("/getRcType", {
            params: { rcTypeCode: row.rcTypeCode },
          });

          const record = extractRows(res)?.[0];
          resetForm({ ...DEFAULT_FORM, ...record, __existing: true });
          setIsEditing(true);
          setSelectedRow(row);
        } catch {
          Swal.fire("Error", "Could not fetch record", "error");
        }
      },
      [resetForm]
    );

    const handleDelete = useCallback(
      async (row) => {
        const code = row?.rcTypeCode ?? "";

        if (!code) {
          return Swal.fire("Error", "No record selected.", "error");
        }

        const used = await checkInUsed(code);

        if (used) {
          return Swal.fire(
            "Cannot Delete",
            `RC Type Code "${code}" is already in use.`,
            "warning"
          );
        }

        const confirm = await Swal.fire({
          title: "Delete Record?",
          text: `Are you sure you want to delete RC Type "${code}"?`,
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
        queryClient.invalidateQueries({ queryKey: ["rcTypeList"] }),
      exportData,
      openInfo,
    }));

    const tableColumns = useMemo(
      () => [
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
        {
          key: "rcTypeCode",
          label: "Code",
          sortable: true,
          width: 140,
          render: (row) => row?.rcTypeCode,
        },
        {
          key: "rcTypeName",
          label: "Name",
          sortable: true,
          width: 360,
          render: (row) => row?.rcTypeName,
        },
      ],
      [handleEdit, handleDelete]
    );

    const tableData = useMemo(
      () =>
        (Array.isArray(rcTypes) ? rcTypes : []).map((row, index) => ({
          ...row,
          __idx: index,
          rcTypeCode: row?.rcTypeCode,
          rcTypeName: row?.rcTypeName,
        })),
      [rcTypes]
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

    // if (activeTab === "rcMast") {
    //   return (
    //     <RCMast
    //       embedded={embedded}
    //       activeTab={activeTab}
    //       setActiveTab={setActiveTab}
    //       tabs={tabs}
    //     />
    //   );
    // }

    return (
      <div className={embedded ? "w-full" : "global-ref-main-div-ui"}>
        <div className="global-ref-header-ui mb-4">
          <div className="w-full flex flex-col gap-3 md:grid md:grid-cols-3 md:items-center">
            <div className="flex flex-col">
              <h1 className="global-ref-headertext-ui text-center md:text-left">
                {reftables?.[docType] || "RC Reference Type"}
              </h1>
            </div>

            <div className="flex gap-4 justify-center items-end h-full">
              <button
  type="button"
  onClick={() => setActiveTab("rcMast")}
  className={`text-[11px] font-bold pb-1 border-b-2 transition-all ${
    activeTab === "rcMast"
      ? "border-blue-600 text-blue-600"
      : "border-transparent text-gray-400 hover:text-gray-600"
  }`}
>
  RC Master
</button>

<button
  type="button"
  onClick={() => setActiveTab("rctype")}
  className={`text-[11px] font-bold pb-1 border-b-2 transition-all ${
    activeTab === "rctype"
      ? "border-blue-600 text-blue-600"
      : "border-transparent text-gray-400 hover:text-gray-600"
  }`}
>
  RC Reference Type
</button>
            </div>

            <div className="flex items-center justify-center md:justify-end gap-2 flex-wrap">
              <button
                type="button"
                onClick={startNew}
                className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-bold shadow-sm hover:bg-blue-700 transition-all flex items-center gap-1"
              >
                <Plus size={14} />
                <span className="hidden sm:inline">Add</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={!isEditing || saveMutation.isPending}
                className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-bold shadow-sm hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <Save size={14} />
                <span className="hidden sm:inline">
                  {saveMutation.isPending ? "Saving..." : "Save"}
                </span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="bg-gray-500 text-white px-3 py-1.5 rounded text-xs font-bold shadow-sm hover:bg-gray-600 transition-all flex items-center gap-1"
              >
                <Undo2 size={14} />
                <span className="hidden sm:inline">Reset</span>
              </button>

              <div ref={guideRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsOpenGuide((v) => !v)}
                  className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-bold shadow-sm flex items-center justify-center gap-1 hover:bg-blue-700 transition-all"
                >
                  <Info size={14} />
                  <span className="hidden sm:inline">Info</span>
                  <ChevronDown size={12} className="hidden sm:inline" />
                </button>

                {isOpenGuide && (
                  <div className="absolute right-0 mt-2 w-52 rounded-md shadow-xl bg-white ring-1 ring-black/10 z-[60] overflow-hidden">
                    {pdfLink && (
                      <button
                        type="button"
                        onClick={() => {
                          window.open(pdfLink, "_blank");
                          setIsOpenGuide(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-xs hover:bg-blue-50 border-b border-gray-100"
                      >
                        <FileText size={14} className="inline mr-2 text-red-500" />
                        PDF Guide
                      </button>
                    )}

                    {videoLink && (
                      <button
                        type="button"
                        onClick={() => {
                          window.open(videoLink, "_blank");
                          setIsOpenGuide(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-xs hover:bg-blue-50"
                      >
                        <Video size={14} className="inline mr-2 text-blue-500" />
                        Video Guide
                      </button>
                    )}

                    {!pdfLink && !videoLink && (
                      <div className="px-4 py-2 text-xs text-gray-500">
                        No guide available.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-[905px] mx-auto px-4">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            <div className="xl:col-span-4">
              <div className="flex flex-col gap-4">
                <div className="border rounded-lg p-4 bg-white">
                  <div className="grid grid-cols-1 gap-4">
                    <FieldRenderer
                      label="RC Type Code"
                      required
                      value={form.rcTypeCode}
                      inputRef={codeInputRef}
                      onChange={(e) =>
                        setField(
                          "rcTypeCode",
                          String(e.target.value || "").toUpperCase()
                        )
                      }
                      onBlur={handleRcTypeCodeValidate}
                      onKeyDown={handleRcTypeCodeValidate}
                      disabled={!isEditing || form.__existing}
                    />

                    <FieldRenderer
                      label="RC Type Name"
                      required
                      value={form.rcTypeName}
                      onChange={(e) => setField("rcTypeName", e.target.value)}
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
              <div className="w-full h-[426px] border rounded-lg p-2 min-w-0 bg-white">
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

export default RcRef;