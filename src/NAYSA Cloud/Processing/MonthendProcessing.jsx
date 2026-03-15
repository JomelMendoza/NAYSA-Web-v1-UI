import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import Swal from "sweetalert2";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  X,
  ShieldCheck,
  CalendarRange,
  LockKeyhole,
  Eye,
  EyeOff,
  FileSpreadsheet,
  TriangleAlert,
  CheckCircle2,
  Loader2,
} from "lucide-react";

import { apiClient } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";
import { useAuth } from "@/NAYSA Cloud/Authentication/AuthContext.jsx";
import {
  useSwalErrorAlert,
  useSwalSuccessAlert,
} from "@/NAYSA Cloud/Global/behavior";

const MonthendGLProcessingModal = ({
  isOpen,
  onClose,
  defaultCutOff = "",
  onProcessed,
}) => {
  const [mounted, setMounted] = useState(false);
  const { companyInfo, currentUserRow } = useAuth();
  const swalError = useSwalErrorAlert();
  const swalSuccess = useSwalSuccessAlert();

  const [selectedCutOff, setSelectedCutOff] = useState(defaultCutOff || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [validationDone, setValidationDone] = useState(false);
  const [validationPassed, setValidationPassed] = useState(false);
  const [validationMessage, setValidationMessage] = useState(
    "Select a cut off, then click Check Transactions."
  );
  const [issueCount, setIssueCount] = useState(0);
  const [downloadReady, setDownloadReady] = useState(false);
  const [excelFileName, setExcelFileName] = useState("");

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    setPassword("");
    setShowPassword(false);
    setValidationDone(false);
    setValidationPassed(false);
    setIssueCount(0);
    setDownloadReady(false);
    setExcelFileName("");
    setValidationMessage("Select a cut off, then click Check Transactions.");
  }, [isOpen]);

  const showErrorAlert = async ({ title, text }) => {
    try {
      if (swalError?.fire) {
        await swalError.fire({ title, text });
        return;
      }
    } catch (error) {
      console.error("Custom error alert failed:", error);
    }

    await Swal.fire({
      icon: "error",
      title,
      text,
      confirmButtonColor: "#dc2626",
    });
  };

  const showSuccessAlert = async ({ title, text }) => {
    try {
      if (swalSuccess?.fire) {
        await swalSuccess.fire({ title, text });
        return;
      }
    } catch (error) {
      console.error("Custom success alert failed:", error);
    }

    await Swal.fire({
      icon: "success",
      title,
      text,
      confirmButtonColor: "#2563eb",
    });
  };

  const showInfoAlert = async ({ title, text }) => {
    await Swal.fire({
      icon: "info",
      title,
      text,
      confirmButtonColor: "#2563eb",
    });
  };

  const resetValidationState = () => {
    setPassword("");
    setShowPassword(false);
    setValidationDone(false);
    setValidationPassed(false);
    setIssueCount(0);
    setDownloadReady(false);
    setExcelFileName("");
    setValidationMessage("Cut off changed. Please click Check Transactions again.");
  };

  const handleCutOffChange = (e) => {
    setSelectedCutOff(e.target.value);
    resetValidationState();
  };

  // =========================================================
  // API 1: LOAD CUT OFF
  // This runs only when modal is open
  // Replace endpoint/payload based on your backend
  // =========================================================
  const {
    data: cutOffData = [],
    isLoading: isLoadingCutOff,
    refetch: refetchCutOff,
  } = useQuery({
    queryKey: ["monthend-gl-cutoff-list"],
    enabled: isOpen,
    queryFn: async () => {

       const { data: response } = await apiClient.get("/lookupCutOff", {
                         params: {
                             PARAMS:  "Open", // Pass filter parameter directly
                         }
                     });
    const rawResult = response?.data?.[0]?.result;
    const parsedRows = rawResult ? JSON.parse(rawResult) : [];

    return Array.isArray(parsedRows)
      ? parsedRows.map((item) => ({
          value: item.cutoffCode ?? "",
          label: item.cutoffName ?? "",
        }))
      : [];
      // ===================================================
    },
    onSuccess: (rows) => {
      if (!selectedCutOff && defaultCutOff) {
        setSelectedCutOff(defaultCutOff);
        return;
      }

      if (!selectedCutOff && rows.length > 0) {
        setSelectedCutOff(rows[0].value);
      }
    },
    onError: async (error) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to load cut off list.";

      await showErrorAlert({
        title: "Load Cut Off Failed",
        text: message,
      });
    },
  });

  const selectedCutOffLabel = useMemo(() => {
    const found = cutOffData.find((item) => item.value === selectedCutOff);
    return found?.label || selectedCutOff || "";
  }, [cutOffData, selectedCutOff]);

  // =========================================================
  // API 2: COUNT OPEN / UNPOSTED TRANSACTIONS
  // This checks if selected cutoff still has open/unposted
  // =========================================================
  const countOpenTransactionsMutation = useMutation({
    mutationFn: async () => {


        
      const response = await apiClient.post(
        "/api/gl/monthend/count-open-transactions",
        {
          cutoff: selectedCutOff,
          userCode:
            user?.userCode || user?.user_code || user?.code || user?.id || "",
        }
      );

      return response?.data;
    },
    onSuccess: async (data) => {
      const count = Number(
        data?.count ??
          data?.openCount ??
          data?.unpostedCount ??
          data?.open_transaction_count ??
          0
      );

      setValidationDone(true);
      setIssueCount(count);

      if (count > 0) {
        setValidationPassed(false);
        setDownloadReady(true);
        setExcelFileName(
          data?.fileName || data?.excelFileName || "unposted-transactions.xlsx"
        );
        setValidationMessage(
          data?.message ||
            `${count} open/unposted transaction(s) found for the selected cut off.`
        );

        await showInfoAlert({
          title: "Transactions Found",
          text: `${count} open/unposted transaction(s) found. Please generate the Excel file.`,
        });
      } else {
        setValidationPassed(true);
        setDownloadReady(false);
        setExcelFileName("");
        setValidationMessage(
          data?.message ||
            "No open or unposted transactions were found. Password is now enabled."
        );

        await showSuccessAlert({
          title: "Validation Passed",
          text: "No open or unposted transactions found. Password is now enabled.",
        });
      }
    },
    onError: async (error) => {
      setValidationDone(true);
      setValidationPassed(false);
      setPassword("");
      setIssueCount(0);
      setDownloadReady(false);
      setExcelFileName("");

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to count open transactions.";

      setValidationMessage(message);

      await showErrorAlert({
        title: "Validation Failed",
        text: message,
      });
    },
  });

  // =========================================================
  // API 3: GENERATE EXCEL FILE
  // Trigger only if count > 0
  // You can use URL or blob response
  // =========================================================
  const generateExcelMutation = useMutation({
    mutationFn: async () => {
      // OPTION A: if backend returns file/blob directly
      const response = await apiClient.post(
        "/api/gl/monthend/generate-open-transaction-excel",
        {
          cutoff: selectedCutOff,
          userCode:
            user?.userCode || user?.user_code || user?.code || user?.id || "",
        },
        {
          responseType: "blob",
        }
      );

      return response;
    },
    onSuccess: async (response) => {
      try {
        const blob = new Blob([response.data], {
          type:
            response.headers["content-type"] ||
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = excelFileName || "open-unposted-transactions.xlsx";
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);

        await showSuccessAlert({
          title: "Excel Generated",
          text: "The Excel file for open/unposted transactions has been downloaded.",
        });
      } catch (error) {
        console.error("Excel download handling failed:", error);
        await showErrorAlert({
          title: "Excel Download Failed",
          text: "The Excel file was generated but could not be downloaded properly.",
        });
      }
    },
    onError: async (error) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to generate Excel file.";

      await showErrorAlert({
        title: "Excel Generation Failed",
        text: message,
      });
    },
  });

  // =========================================================
  // API 4: MONTHEND PROCESSING
  // Final processing after validation passed and password entered
  // =========================================================
  const processMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post("/api/gl/monthend/process", {
        cutoff: selectedCutOff,
        password,
        userCode:
          user?.userCode || user?.user_code || user?.code || user?.id || "",
      });

      return response?.data;
    },
    onSuccess: async (data) => {
      await showSuccessAlert({
        title: "Success",
        text: data?.message || "Month-end processing completed successfully.",
      });

      onProcessed?.(data);
      onClose?.();
    },
    onError: async (error) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to process month-end.";

      await showErrorAlert({
        title: "Processing Failed",
        text: message,
      });
    },
  });

  const handleCheckTransactions = async () => {
    if (!selectedCutOff) {
      await Swal.fire({
        icon: "warning",
        title: "Missing Cut Off",
        text: "Please select a cut off first.",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    setPassword("");
    setShowPassword(false);
    setValidationDone(false);
    setValidationPassed(false);
    setIssueCount(0);
    setDownloadReady(false);
    setExcelFileName("");
    setValidationMessage("Checking transactions for the selected cut off...");

    countOpenTransactionsMutation.mutate();
  };

  const handleGenerateExcel = async () => {
    if (!selectedCutOff) return;
    generateExcelMutation.mutate();
  };

  const handleFinalOk = async () => {
    if (!validationPassed || !password.trim()) return;

    const result = await Swal.fire({
      title: "Confirm Month-End GL Processing",
      html: `
        <div style="text-align:left">
          <div><strong>Cut Off:</strong> ${selectedCutOffLabel || "-"}</div>
          <div style="margin-top:10px;color:#b45309;">
            This action will proceed with Monthend GL Processing for the selected period.
          </div>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Final OK",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#64748b",
    });

    if (!result.isConfirmed) return;

    processMutation.mutate();
  };

  const isChecking = countOpenTransactionsMutation.isPending;
  const isGeneratingExcel = generateExcelMutation.isPending;
  const isProcessing = processMutation.isPending;

  const canCheck =
    !!selectedCutOff &&
    !isChecking &&
    !isGeneratingExcel &&
    !isProcessing &&
    !isLoadingCutOff;

  const passwordEnabled =
    validationPassed &&
    validationDone &&
    !isChecking &&
    !isGeneratingExcel &&
    !isProcessing;

  const canFinalOk =
    passwordEnabled &&
    password.trim() !== "" &&
    !isProcessing;

  const currentUserName = currentUserRow.userName
  if (!mounted || !isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-start sm:items-center justify-center bg-black/50 backdrop-blur-[1px] p-2 sm:p-3 overflow-y-auto">
      <div className="w-full max-w-[92vw] sm:max-w-5xl lg:max-w-6xl bg-white rounded-lg sm:rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-2 sm:my-0 max-h-none sm:max-h-[90vh]">
        <div className="bg-blue-200 text-slate-800 px-3 sm:px-5 py-2.5 sm:py-3 border-b border-blue-300">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="sm:w-[18px] sm:h-[18px]" />
                <h2 className="text-sm sm:text-lg font-semibold">
                  Monthend GL Processing
                </h2>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-700 mt-0.5">
                Validate the selected cut off before allowing password entry and final processing.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-md p-1 hover:bg-white/40 transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="px-2.5 sm:px-4 py-2.5 sm:py-3 space-y-3 bg-slate-50 overflow-visible sm:overflow-y-auto">
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 shadow-sm">
            <div className="flex items-start gap-2.5">
              <TriangleAlert className="text-amber-600 mt-0.5 shrink-0" size={16} />
              <div>
                <div className="text-xs sm:text-sm font-semibold text-amber-800">
                  Reminder
                </div>
                <div className="text-[11px] sm:text-xs text-amber-700 mt-0.5 leading-5">
                  Validate first if the selected period still has open or unposted transactions. If transactions are found, Excel generation will be required and password entry must remain disabled.
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_.95fr] gap-3">
            <div className="space-y-3">
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-3 py-2 border-b bg-slate-50">
                  <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs sm:text-sm">
                    <CalendarRange size={16} className="text-blue-600" />
                    Period Details
                  </div>
                </div>

                <div className="p-3">
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Cut Off
                  </label>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={selectedCutOff}
                      onChange={handleCutOffChange}
                      disabled={isLoadingCutOff}
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
                    >
                      <option value="">
                        {isLoadingCutOff ? "Loading Cut Off..." : "Select Cut Off"}
                      </option>
                      {cutOffData.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={handleCheckTransactions}
                      disabled={!canCheck}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs sm:text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isChecking ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Checking...
                        </>
                      ) : (
                        <>
                          <FileSpreadsheet size={14} />
                          Check Transactions
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-3 py-2 border-b bg-slate-50">
                  <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs sm:text-sm">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    Validation Result
                  </div>
                </div>

                <div className="p-3 space-y-3">
                  <div
                    className={`rounded-lg border px-3 py-2.5 text-[11px] sm:text-xs ${
                      !validationDone
                        ? "border-slate-200 bg-slate-50 text-slate-600"
                        : validationPassed
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-rose-200 bg-rose-50 text-rose-700"
                    }`}
                  >
                    {validationMessage}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="rounded-lg border bg-slate-50 px-3 py-2.5">
                      <div className="text-[10px] sm:text-[11px] text-slate-500">
                        Selected Cut Off
                      </div>
                      <div className="mt-0.5 text-xs sm:text-sm font-semibold text-slate-800 break-words">
                        {selectedCutOffLabel || "-"}
                      </div>
                    </div>

                    <div className="rounded-lg border bg-slate-50 px-3 py-2.5">
                      <div className="text-[10px] sm:text-[11px] text-slate-500">
                        Issue Count
                      </div>
                      <div className="mt-0.5 text-xs sm:text-sm font-semibold text-slate-800">
                        {validationDone ? issueCount : "-"}
                      </div>
                    </div>

                    <div className="rounded-lg border bg-slate-50 px-3 py-2.5">
                      <div className="text-[10px] sm:text-[11px] text-slate-500">
                        Excel Action
                      </div>
                      <div className="mt-0.5 text-xs sm:text-sm font-semibold text-slate-800">
                        {downloadReady ? "Ready" : "None"}
                      </div>
                    </div>
                  </div>

                  {downloadReady && (
                    <div className="flex justify-stretch sm:justify-end">
                      <button
                        type="button"
                        onClick={handleGenerateExcel}
                        disabled={isGeneratingExcel}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs sm:text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                      >
                        {isGeneratingExcel ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Generating Excel...
                          </>
                        ) : (
                          <>
                            <FileSpreadsheet size={14} />
                            Generate Excel File
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {!validationPassed && validationDone && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] sm:text-xs text-amber-800">
                      Password remains disabled until no open or unposted transactions are found for the selected cut off.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-3 py-2 border-b bg-slate-50">
                  <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs sm:text-sm">
                    <LockKeyhole size={16} className="text-violet-600" />
                    Authorization
                  </div>
                </div>

                <div className="p-3 space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      User
                    </label>
                    <input
                      value={currentUserName}
                      readOnly
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Password
                    </label>

                    <div className="flex gap-2">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={!passwordEnabled}
                        placeholder={
                          passwordEnabled
                            ? "Enter your password"
                            : "Password disabled until validation passes"
                        }
                        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs sm:text-sm text-slate-700 disabled:bg-slate-100 disabled:text-slate-400"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        disabled={!passwordEnabled}
                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>

                    <div className="mt-1.5 text-[10px] sm:text-[11px] text-slate-500 leading-4">
                      Password is enabled only after the selected period is confirmed to have no open or unposted transactions.
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-3 py-2 border-b bg-slate-50">
                  <div className="text-slate-800 font-semibold text-xs sm:text-sm">
                    Processing Guide
                  </div>
                </div>

                <div className="p-3">
                  <ol className="space-y-2.5 text-[11px] sm:text-xs text-slate-700">
                    <li className="flex gap-2.5">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                        1
                      </span>
                      <span>Select the cut off period to process.</span>
                    </li>
                    <li className="flex gap-2.5">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                        2
                      </span>
                      <span>Click Check Transactions to count open/unposted entries.</span>
                    </li>
                    <li className="flex gap-2.5">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                        3
                      </span>
                      <span>If transactions exist, generate the Excel file first.</span>
                    </li>
                    <li className="flex gap-2.5">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                        4
                      </span>
                      <span>If none are found, enter your password and click Final OK.</span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t bg-white px-2.5 sm:px-4 py-2.5 sm:py-3 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div className="text-[10px] sm:text-[11px] text-slate-500">
            Only authorized users should perform Monthend GL Processing.
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                resetValidationState();
                onClose?.();
              }}
              className="w-full sm:w-auto rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleFinalOk}
              disabled={!canFinalOk}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>Final OK</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default MonthendGLProcessingModal;