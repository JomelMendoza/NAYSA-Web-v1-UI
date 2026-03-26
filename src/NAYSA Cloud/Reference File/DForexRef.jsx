import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Undo2, Edit, Trash2, Info } from "lucide-react";

import { apiClient } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";
import { useAuth } from "@/NAYSA Cloud/Authentication/AuthContext.jsx";
import {
  useSwalErrorAlert,
  useSwalSuccessAlert,
  useSwalInfoAlert,
  useSwalDeleteConfirm,
  useSwalDeleteRecord,
} from "@/NAYSA Cloud/Global/behavior.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faTrashAlt,
  faInfoCircle,
  faChevronDown,
  faFilePdf,
  faVideo,
} from "@fortawesome/free-solid-svg-icons";
import { LoadingSpinner } from "@/NAYSA Cloud/Global/utilities.jsx";

import {
  reftables,
  reftablesPDFGuide,
  reftablesVideoGuide,
} from "@/NAYSA Cloud/Global/reftable";

import FieldRenderer from "@/NAYSA Cloud/Global/FieldRenderer.jsx";
import RegistrationInfo from "@/NAYSA Cloud/Global/RegistrationInfo.jsx";
import SearchGlobalReferenceTable from "@/NAYSA Cloud/Lookup/SearchGlobalReferenceTable.jsx";
import SearchCurrencyRef from "@/NAYSA Cloud/Lookup/SearchCurrRef.jsx";

/* ================= HELPERS ================= */

const extractRows = (payload) => {
  const rawData = payload?.data?.data;

  if (!rawData || !Array.isArray(rawData)) return [];

  const res = rawData[0]?.result ?? rawData[0]?.RESULT;

  if (!res) return [];

  if (Array.isArray(res)) return res;

  if (typeof res === "string") {
    try {
      return JSON.parse(res) || [];
    } catch (e) {
      console.error("JSON Parsing Error:", e);
      return [];
    }
  }

  return [];
};

const getId = (row) => {
  if (!row) return null;
  return row.tranID ?? row.TRAN_ID ?? row.tranId ?? row.id ?? null;
};

const parseDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
};

const formatDate = (value) => {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const getMonthName = (month) =>
  new Date(2000, month - 1, 1).toLocaleString("en-US", {
    month: "long",
  });

const startOfMonth = (year, month) => new Date(year, month - 1, 1);
const endOfMonth = (year, month) => new Date(year, month, 0);
const maxDate = (a, b) => (a > b ? a : b);
const minDate = (a, b) => (a < b ? a : b);

const mapRowToForm = (row = {}) => ({
  tranID: getId(row) || "",
  fromDate: formatDate(
    row.FROM_DATE ??
      row.fromDate ??
      row.fDate ??
      row.sourceFromDate ??
      row.dateFrom
  ),
  toDate: formatDate(
    row.TO_DATE ?? row.toDate ?? row.tDate ?? row.sourceToDate ?? row.dateTo
  ),
  currCode: row.CURR_CODE ?? row.currCode ?? "",
  fCurrName: row.FCURR_NAME ?? row.fCurrName ?? row.currName ?? "",
  currName: row.CURR_NAME ?? row.currName ?? row.fCurrName ?? "",
  currRate: row.CURR_RATE ?? row.currRate ?? "",
  currCode2: row.CURR_CODE2 ?? row.currCode2 ?? "",
  tCurrName: row.TCURR_NAME ?? row.tCurrName ?? row.currName2 ?? "",
  currName2: row.CURR_NAME2 ?? row.currName2 ?? row.tCurrName ?? "",
  currRate2: row.CURR_RATE2 ?? row.currRate2 ?? "",
  registeredBy: row.REGISTERED_BY ?? row.registeredBy ?? "",
  registeredDate: row.REGISTERED_DATE ?? row.registeredDate ?? "",
  updatedBy:
    row.UPDATED_BY ??
    row.updatedBy ??
    row.lastUpdatedBy ??
    row.LAST_UPDATED_BY ??
    "",
  updatedDate:
    row.UPDATED_DATE ??
    row.updatedDate ??
    row.lastUpdatedDate ??
    row.LAST_UPDATED_DATE ??
    "",
  __existing: true,
});

const buildSummaryRowsFromForex = (rows = []) => {
  const summaryRows = [];

  rows.forEach((row) => {
    const sourceFrom = parseDate(row.FROM_DATE ?? row.fromDate ?? row.fDate);
    const sourceTo = parseDate(row.TO_DATE ?? row.toDate ?? row.tDate);

    if (!sourceFrom || !sourceTo) return;

    let year = sourceFrom.getFullYear();
    let month = sourceFrom.getMonth() + 1;

    const lastYear = sourceTo.getFullYear();
    const lastMonth = sourceTo.getMonth() + 1;

    while (year < lastYear || (year === lastYear && month <= lastMonth)) {
      const monthStart = startOfMonth(year, month);
      const monthEnd = endOfMonth(year, month);

      const displayFrom = maxDate(sourceFrom, monthStart);
      const displayTo = minDate(sourceTo, monthEnd);

      if (displayFrom <= displayTo) {
        summaryRows.push({
          rangeKey: `${getId(row) ?? "NOID"}-${year}-${String(month).padStart(
            2,
            "0"
          )}`,
          tranID: getId(row),
          year,
          month,
          monthName: getMonthName(month),
          dateFrom: formatDate(displayFrom),
          dateTo: formatDate(displayTo),
          sourceFromDate: formatDate(sourceFrom),
          sourceToDate: formatDate(sourceTo),
        });
      }

      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
    }
  });

  return summaryRows.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    if (a.month !== b.month) return b.month - a.month;
    return String(a.tranID ?? "").localeCompare(String(b.tranID ?? ""));
  });
};

const DEFAULT_FORM = {
  tranID: "",
  fromDate: "",
  toDate: "",
  currCode: "",
  fCurrName: "",
  currName: "",
  currRate: "",
  currCode2: "",
  tCurrName: "",
  currName2: "",
  currRate2: "",
  registeredBy: "",
  registeredDate: "",
  updatedBy: "",
  updatedDate: "",
  __existing: false,
};

/* ================= COMPONENT ================= */

const DForexRef = ({ onSelect }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const docType = "DForexRef";
  const documentTitle = reftables?.[docType] || "Daily Forex Reference";
    const guideRef = useRef(null);
    const pdfLink = reftablesPDFGuide?.[docType];
    const videoLink = reftablesVideoGuide?.[docType];

  const fromDateRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedDateRangeRow, setSelectedDateRangeRow] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);

  const [isCurr1ModalOpen, setCurr1ModalOpen] = useState(false);
  const [isCurr2ModalOpen, setCurr2ModalOpen] = useState(false);
    const [isOpenGuide, setOpenGuide] = useState(false);

  const setField = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const resetForm = (next = DEFAULT_FORM) => setForm(next);

  /* ================= EFFECTS ================= */

  useEffect(() => {
    const handleKey = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (isEditing && !saveMutation.isPending) {
          handleSave();
        }
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  /* ================= QUERIES ================= */

  const forexListQuery = useQuery({
    queryKey: ["dforexList"],
    queryFn: async () => {
      const res = await apiClient.get("/DForex");
      return extractRows(res);
    },
    // ✅ ADDED: Auto-sync and manual refresh support
    staleTime: 0,
    refetchInterval: 1000 * 30,
  });

  const forexRows = useMemo(
    () => forexListQuery.data || [],
    [forexListQuery.data]
  );

  const isInitialLoading = forexListQuery.isLoading;

  const dateRangeRows = useMemo(() => {
    return buildSummaryRowsFromForex(forexRows);
  }, [forexRows]);

  const resolveForexRow = (row) => {
    if (!row) return null;

    const directId = getId(row);
    if (directId) {
      return (
        forexRows.find((r) => String(getId(r)) === String(directId)) || row
      );
    }

    return row;
  };

  const filteredForexRows = useMemo(() => {
    if (!selectedDateRangeRow || !forexRows.length) return [];

    const selFrom = new Date(selectedDateRangeRow.dateFrom);
    const selTo = new Date(selectedDateRangeRow.dateTo);

    selFrom.setHours(0, 0, 0, 0);
    selTo.setHours(23, 59, 59, 999);

    return forexRows.filter((row) => {
      const rawFrom = row.FROM_DATE ?? row.fromDate ?? row.fDate;
      const rawTo = row.TO_DATE ?? row.toDate ?? row.tDate;

      if (!rawFrom || !rawTo) return false;

      const rFrom = new Date(rawFrom);
      const rTo = new Date(rawTo);

      if (isNaN(rFrom.getTime()) || isNaN(rTo.getTime())) return false;

      rFrom.setHours(0, 0, 0, 0);
      rTo.setHours(0, 0, 0, 0);

      return rFrom <= selTo && rTo >= selFrom;
    });
  }, [forexRows, selectedDateRangeRow]);

  /* ================= MUTATIONS ================= */

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      return apiClient.post("/upsertDForex", {
        json_data: payload,
      });
    },
    onSuccess: async (response) => {
      const data = response?.data || {};
      const sqlRow = data?.data?.[0] || {};
      const errorcount = Number(sqlRow.errorcount ?? sqlRow.ERRORCOUNT ?? 0);
      const errormsg = String(sqlRow.errormsg ?? sqlRow.ERRORMSG ?? "");

      if (errorcount > 0) {
        useSwalErrorAlert("Error", errormsg || "Failed to save forex record.");
        return;
      }

      if (data?.success || data?.status === "success") {
        await queryClient.invalidateQueries({ queryKey: ["dforexList"] });
        useSwalSuccessAlert(
          "Success!",
          form.__existing
            ? "Forex record updated successfully."
            : "Forex record saved successfully."
        );
        setIsEditing(false);
        resetForm(DEFAULT_FORM);
        setSelectedRow(null);
        setSelectedDateRangeRow(null);
      } else {
        useSwalErrorAlert("Error", data?.message || "Failed to save forex record.");
      }
    },
    onError: (error) => {
      useSwalErrorAlert(
        "System Error",
        error?.response?.data?.message ||
          JSON.stringify(error?.response?.data?.errors || {}) ||
          error?.message ||
          "Failed to save forex record."
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (tranID) => {
      return apiClient.post("/deleteDForex", {
        json_data: { tranID },
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dforexList"] });
      useSwalDeleteRecord("Deleted!", "Forex record has been removed.");
      handleReset();
    },
    onError: (error) => {
      useSwalErrorAlert(
        "System Error",
        error?.response?.data?.message || error?.message || "Delete failed."
      );
    },
  });

  const isBusy =
    isInitialLoading || saveMutation.isPending || deleteMutation.isPending;

  /* ================= ACTIONS ================= */

  const startNew = () => {
    resetForm(DEFAULT_FORM);
    setSelectedRow(null);
    setSelectedDateRangeRow(null);
    setIsEditing(true);
    setTimeout(() => fromDateRef.current?.focus?.(), 0);
  };

  const handleReset = () => {
    resetForm(DEFAULT_FORM);
    setSelectedRow(null);
    setSelectedDateRangeRow(null);
    setIsEditing(false);
  };

  const handleEdit = async (row) => {
    if (!row) return;

    const rawRow = resolveForexRow(row);
    const tranID = getId(rawRow);

    if (!tranID) {
      useSwalErrorAlert("Error", "Selected row has no tranID.");
      return;
    }

    try {
      const res = await apiClient.get("/getDForex", {
        params: { tranID },
      });

      const record = extractRows(res)?.[0];
      const finalRecord = record || rawRow;

      resetForm({
        ...DEFAULT_FORM,
        ...mapRowToForm(finalRecord),
        __existing: true,
      });
      setIsEditing(true);
      setSelectedRow(rawRow);
      onSelect?.(finalRecord);
    } catch (error) {
      useSwalErrorAlert(
        "Error",
        error?.response?.data?.message || "Could not fetch record"
      );
    }
  };

  const handleDelete = async (row) => {
    if (!row) {
      useSwalErrorAlert("Error", "Please select a forex record to delete.");
      return;
    }

    const rawRow = resolveForexRow(row);
    const tranID = getId(rawRow);

    if (!tranID) {
      useSwalErrorAlert("Error", "Selected row has no tranID.");
      return;
    }

    const confirm = await useSwalDeleteConfirm(
      "Delete this forex record?",
      `From ${formatDate(
        rawRow.FROM_DATE ?? rawRow.fromDate ?? rawRow.fDate
      )} to ${formatDate(rawRow.TO_DATE ?? rawRow.toDate ?? rawRow.tDate)}`,
      "Yes, delete it"
    );

    if (!confirm?.isConfirmed) return;

    deleteMutation.mutate(tranID);
  };

  const handleRowClick = (row) => {
    const rawRow = resolveForexRow(row);
    setSelectedRow(rawRow);

    if (!isEditing) {
      resetForm({
        ...DEFAULT_FORM,
        ...mapRowToForm(rawRow),
        __existing: true,
      });
    }

    onSelect?.(rawRow);
  };

  const handleDateRangeClick = (row) => {
    setSelectedDateRangeRow(row);
    setSelectedRow(null);

    if (!isEditing) {
      setField("fromDate", row.dateFrom);
      setField("toDate", row.dateTo);
    }
  };

  const handleSave = async () => {
    if (!isEditing || saveMutation.isPending) return;

    const missing = [];
    if (!form.fromDate) missing.push("• Start Date");
    if (!form.toDate) missing.push("• End Date");
    if (!String(form.currCode || "").trim()) missing.push("• Currency");
    if (!String(form.currCode2 || "").trim()) missing.push("• Currency 2");
    if (!String(form.currRate2 || "").trim()) missing.push("• Currency Rate 2");

    if (missing.length) {
      useSwalErrorAlert(
        "Error!",
        `Please fill out all required fields:\n${missing.join("\n")}`
      );
      return;
    }

    const payload = {
      tranID: form.__existing ? form.tranID || "" : "",
      fromDate: form.fromDate,
      toDate: form.toDate,
      currCode: String(form.currCode || "").trim().toUpperCase(),
      currRate: String(form.currRate || "").trim(),
      currCode2: String(form.currCode2 || "").trim().toUpperCase(),
      currRate2: String(form.currRate2 || "").trim(),
      userCode: user?.USER_CODE || user?.username || "SYSTEM",
    };

    saveMutation.mutate(payload);
  };

  const handleOpenInfo = () => {
    const messages = [];

    if (pdfLink) messages.push(`PDF Guide: ${pdfLink}`);
    if (videoLink) messages.push(`Video Guide: ${videoLink}`);

    if (!messages.length) {
      useSwalInfoAlert("Info", "No guide available for this page.");
      return;
    }

    useSwalInfoAlert("Reference Information", messages.join("\n"));
  };

  /* ================= TABLE COLUMNS ================= */

  const dateRangeColumns = useMemo(
    () => [
      { key: "year", label: "Year", sortable: true },
      { key: "monthName", label: "Month", sortable: true },
      { key: "dateFrom", label: "Date From", sortable: true },
      { key: "dateTo", label: "Date To", sortable: true },
    ],
    []
  );

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
        key: "currCode",
        label: "Currency",
        sortable: true,
        render: (row) => row.currCode || "",
      },
      {
        key: "fCurrName",
        label: "From Currency",
        sortable: true,
        render: (row) => row.fCurrName ?? row.FCURR_NAME ?? "",
      },
      {
        key: "currCode2",
        label: "Currency 2",
        sortable: true,
        render: (row) => row.currCode2 ?? row.CURR_CODE2 ?? "",
      },
      {
        key: "tCurrName",
        label: "To Currency",
        sortable: true,
        render: (row) => row.tCurrName ?? row.TCURR_NAME ?? "",
      },
      {
        key: "currRate2",
        label: "Currency Rate 2",
        sortable: true,
        render: (row) => row.currRate2 ?? row.CURR_RATE2 ?? "",
      },
    ],
    []
  );

  /* ================= RENDER ================= */

  return (
    <div className="global-ref-main-div-ui mt-24">
      {isBusy && <LoadingSpinner />}

      <div className="global-ref-header-ui fixed left-6 right-6 top-14 z-30 mt-4 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white/80 p-3 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <h1 className="global-ref-headertext-ui">{documentTitle}</h1>

        <div className="flex flex-wrap justify-center gap-2 text-xs">
          <button
            type="button"
            onClick={startNew}
            className={`flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 ${
              isEditing || isBusy ? "cursor-not-allowed opacity-50" : ""
            }`}
            disabled={isEditing || isBusy}
          >
            <Plus size={16} /> Add
          </button>

          <button
            type="button"
            onClick={handleSave}
            className={`flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 ${
              !isEditing || saveMutation.isPending || isBusy
                ? "cursor-not-allowed opacity-50"
                : ""
            }`}
            disabled={!isEditing || saveMutation.isPending || isBusy}
            title="Ctrl+S to Save"
          >
            <Save size={16} />
            Save
          </button>

          <button
            type="button"
            onClick={handleReset}
            className={`flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 ${
              isBusy ? "cursor-not-allowed opacity-50" : ""
            }`}
            disabled={isBusy}
          >
            <Undo2 size={16} /> Reset
          </button>

          {/* Info Dropdown */}
                          <div ref={guideRef} className="relative">
                            <button
                              onClick={() => setOpenGuide((v) => !v)}
                              className="bg-blue-600 text-white h-7 w-16 sm:w-auto sm:h-8 sm:px-4 rounded-md flex items-center justify-center gap-1 hover:bg-blue-700 transition-all"
                            >
                              <FontAwesomeIcon icon={faInfoCircle} className="text-[12px]" />
                              <span className="sm:inline ml-1 text-[11px] font-medium">
                                Info
                              </span>
                              <FontAwesomeIcon
                                icon={faChevronDown}
                                className="hidden sm:inline text-[10px] opacity-80"
                              />
                            </button>
                
                            {isOpenGuide && (
                              <div className="absolute right-0 mt-2 w-52 rounded-md shadow-xl bg-white ring-1 ring-black/10 z-[60] dark:bg-gray-800 overflow-hidden">
                                <button
                                  onClick={() => {
                                    window.open(pdfLink, "_blank");
                                    setOpenGuide(false);
                                  }}
                                  className="block w-full text-left px-4 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900 border-b border-gray-100 dark:border-gray-700"
                                >
                                  <FontAwesomeIcon
                                    icon={faFilePdf}
                                    className="mr-2 text-red-500"
                                  />{" "}
                                  PDF Guide
                                </button>
                                <button
                                  onClick={() => {
                                    window.open(videoLink, "_blank");
                                    setOpenGuide(false);
                                  }}
                                  className="block w-full text-left px-4 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900"
                                >
                                  <FontAwesomeIcon
                                    icon={faVideo}
                                    className="mr-2 text-blue-500"
                                  />{" "}
                                  Video Guide
                                </button>
                              </div>
                            )}
                          </div>
        </div>
      </div>

      <div
        className="global-tran-tab-div-ui mt-8 p-6"
        style={{ minHeight: "calc(100vh - 170px)" }}
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <div className="rounded-xl border bg-white p-6 shadow-sm md:col-span-8">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="flex flex-col gap-4">
                <FieldRenderer
                  label="Start Date"
                  type="date"
                  value={form.fromDate}
                  inputRef={fromDateRef}
                  onChange={(e) => setField("fromDate", e.target.value)}
                  disabled={!isEditing || isBusy}
                  required
                />

                <FieldRenderer
                  label="End Date"
                  type="date"
                  value={form.toDate}
                  onChange={(e) => setField("toDate", e.target.value)}
                  disabled={!isEditing || isBusy}
                  required
                />

                <FieldRenderer
                  label="Currency"
                  type="lookup"
                  value={
                    form.currCode
                      ? `${form.currCode}${
                          form.currName ? ` - ${form.currName}` : ""
                        }`
                      : ""
                  }
                  onLookup={() => setCurr1ModalOpen(true)}
                  disabled={!isEditing || isBusy}
                  required
                  readOnly
                />
              </div>

              <div className="flex flex-col gap-4">
                <FieldRenderer
                  label="Currency 2"
                  type="lookup"
                  value={
                    form.currCode2
                      ? `${form.currCode2}${
                          form.currName2 ? ` - ${form.currName2}` : ""
                        }`
                      : ""
                  }
                  onLookup={() => setCurr2ModalOpen(true)}
                  disabled={!isEditing || isBusy}
                  required
                  readOnly
                />

                <FieldRenderer
                  label="Currency Rate 2"
                  type="number"
                  value={form.currRate2}
                  onChange={(e) => setField("currRate2", e.target.value)}
                  disabled={!isEditing || isBusy}
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex md:col-span-4 md:justify-end">
            <div className="w-full max-w-[450px]">
              <RegistrationInfo
                data={{
                  registeredBy: form.registeredBy,
                  registeredDate: form.registeredDate,
                  updatedBy: form.updatedBy,
                  updatedDate: form.updatedDate,
                }}
                layout="minimize"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="xl:col-span-5">
            <div className="global-tran-table-main-div-ui relative overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <SearchGlobalReferenceTable
                docType={`${docType}_DateRange`}
                columns={dateRangeColumns}
                data={dateRangeRows}
                itemsPerPage={50}
                showFilters
                showGlobalSearch={false}
                showExport={false}
                showColumnChooser={false}
                showAutoFitToggle={true}
                showGroupBy={true}
                initialState={{ groupBy: ["year", "monthName"] }}
                onRowClick={handleDateRangeClick}
                onRowDoubleClick={handleDateRangeClick}
                selectedRow={selectedDateRangeRow}
                isLoading={isInitialLoading} 
              />
            </div>
          </div>

          <div className="xl:col-span-7">
            <div className="global-tran-table-main-div-ui relative overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <SearchGlobalReferenceTable
                docType={docType}
                columns={columns}
                data={filteredForexRows}
                itemsPerPage={50}
                showFilters
                isLoading={isInitialLoading}
                onRowDoubleClick={handleEdit}
                selectedRow={selectedRow}
                showGlobalSearch={false}
                onRowClick={handleRowClick}
                showExport={true}
                showColumnChooser={true}
                showAutoFitToggle={true}
                showGroupBy={true}
                isFetching={forexListQuery.isFetching} // Added UI sync
                onRefresh={() => forexListQuery.refetch()} // Added manual refresh
              />
            </div>
          </div>
        </div>
      </div>

      <SearchCurrencyRef
        isOpen={isCurr1ModalOpen}
        onClose={(value) => {
          if (value) {
            setField("currCode", value.currCode || "");
            setField("currName", value.currName || "");
            setField("fCurrName", value.currName || "");
          }
          setCurr1ModalOpen(false);
        }}
      />

      <SearchCurrencyRef
        isOpen={isCurr2ModalOpen}
        onClose={(value) => {
          if (value) {
            setField("currCode2", value.currCode2 ?? value.currCode ?? "");
            setField("currName2", value.currName2 ?? value.currName ?? "");
            setField("tCurrName", value.currName2 ?? value.currName ?? "");
          }
          setCurr2ModalOpen(false);
        }}
      />
    </div>
  );
};

export default DForexRef;