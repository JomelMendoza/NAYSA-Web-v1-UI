import React, { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import Swal from "sweetalert2";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Upload,
  FolderOpen,
  FileSpreadsheet,
  RefreshCcw,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  FileWarning,
} from "lucide-react";

/**
 * ExcelBatchUploadModal
 *
 * Flow:
 * 1) Select .xlsx files or folder
 * 2) Check duplicate file names
 * 3) Check all files have same exact headers and same order
 * 4) Convert all rows to one JSON
 * 5) Validate via API
 * 6) Show preview + counts
 * 7) Upload only when validation is successful
 *
 * Props:
 * - isOpen: boolean
 * - onClose: function
 * - validateApiUrl: string
 * - uploadApiUrl: string
 * - title?: string
 *
 * Notes:
 * - The component preserves exact Excel column names.
 * - It adds:
 *    fileName
 *    rowNo
 * - Validation API is expected to return per-row status/error info.
 * - Because API shapes vary, a normalizer is included below.
 */
export default function ExcelBatchUploadModal({
  isOpen,
  onClose,
  validateApiUrl = "/api/validateExcelBatch",
  uploadApiUrl = "/api/uploadExcelBatch",
  title = "Upload Excel Files",
}) {
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [rejectedFiles, setRejectedFiles] = useState([]);
  const [headerCheck, setHeaderCheck] = useState({
    passed: false,
    referenceFileName: "",
    referenceHeaders: [],
    mismatches: [],
  });

  const [rawMergedRows, setRawMergedRows] = useState([]);
  const [validatedRows, setValidatedRows] = useState([]);
  const [previewColumns, setPreviewColumns] = useState([]);

  const [isPreparing, setIsPreparing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [hasValidated, setHasValidated] = useState(false);

  const [validationSummary, setValidationSummary] = useState({
    totalFiles: 0,
    totalRecords: 0,
    passed: 0,
    failed: 0,
  });

  useEffect(() => {
    if (!isOpen) {
      resetAll();
    }
  }, [isOpen]);

  useEffect(() => {
    if (folderInputRef.current) {
      folderInputRef.current.setAttribute("webkitdirectory", "");
      folderInputRef.current.setAttribute("directory", "");
      folderInputRef.current.setAttribute("multiple", "");
      folderInputRef.current.setAttribute("accept", ".xlsx");
    }
  }, [isOpen]);

  const resetAll = () => {
    setSelectedFiles([]);
    setRejectedFiles([]);
    setHeaderCheck({
      passed: false,
      referenceFileName: "",
      referenceHeaders: [],
      mismatches: [],
    });
    setRawMergedRows([]);
    setValidatedRows([]);
    setPreviewColumns([]);
    setIsPreparing(false);
    setIsValidating(false);
    setIsUploading(false);
    setHasValidated(false);
    setValidationSummary({
      totalFiles: 0,
      totalRecords: 0,
      passed: 0,
      failed: 0,
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
    if (folderInputRef.current) folderInputRef.current.value = "";
  };

  const showError = async (title, text) => {
    await Swal.fire({
      icon: "error",
      title,
      text,
      confirmButtonColor: "#2563eb",
    });
  };

  const showWarning = async (title, text) => {
    await Swal.fire({
      icon: "warning",
      title,
      text,
      confirmButtonColor: "#2563eb",
    });
  };

  const showSuccess = async (title, text) => {
    await Swal.fire({
      icon: "success",
      title,
      text,
      confirmButtonColor: "#2563eb",
    });
  };

  const isXlsxFile = (file) => {
    const name = file?.name?.toLowerCase?.() || "";
    return name.endsWith(".xlsx");
  };

  const dedupeByFileName = (files) => {
    const seen = new Set();
    const valid = [];
    const rejected = [];

    for (const file of files) {
      const lowerName = (file.name || "").toLowerCase();
      if (seen.has(lowerName)) {
        rejected.push({
          fileName: file.name,
          reason: "Duplicate file name is not allowed.",
        });
      } else {
        seen.add(lowerName);
        valid.push(file);
      }
    }

    return { valid, rejected };
  };

  const filterXlsxFiles = (files) => {
    const valid = [];
    const rejected = [];

    for (const file of files) {
      if (isXlsxFile(file)) {
        valid.push(file);
      } else {
        rejected.push({
          fileName: file.name,
          reason: "Only .xlsx files are allowed.",
        });
      }
    }

    return { valid, rejected };
  };

  const readWorkbookFromFile = async (file) => {
    const buffer = await file.arrayBuffer();
    return XLSX.read(buffer, { type: "array" });
  };

  const getFirstSheetName = (workbook) => workbook?.SheetNames?.[0] || "";

  const getSheetHeadersExact = (worksheet) => {
    const rows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
      blankrows: false,
      raw: false,
    });

    if (!rows.length) return [];

    const firstRow = Array.isArray(rows[0]) ? rows[0] : [];
    return firstRow.map((h) => String(h ?? ""));
  };

  const sheetToJsonPreserveHeaders = (worksheet) => {
    return XLSX.utils.sheet_to_json(worksheet, {
      defval: "",
      raw: false,
      blankrows: false,
    });
  };

  const headersAreExactMatch = (referenceHeaders, currentHeaders) => {
    if (referenceHeaders.length !== currentHeaders.length) return false;
    for (let i = 0; i < referenceHeaders.length; i += 1) {
      if (referenceHeaders[i] !== currentHeaders[i]) return false;
    }
    return true;
  };

  const buildMismatchReason = (referenceHeaders, currentHeaders) => {
    if (referenceHeaders.length !== currentHeaders.length) {
      return `Column count mismatch. Expected ${referenceHeaders.length} but found ${currentHeaders.length}.`;
    }

    for (let i = 0; i < referenceHeaders.length; i += 1) {
      if (referenceHeaders[i] !== currentHeaders[i]) {
        return `Column ${i + 1} mismatch. Expected "${referenceHeaders[i]}" but found "${currentHeaders[i]}".`;
      }
    }

    return "Header mismatch detected.";
  };

  const prepareSelectedFiles = async (incomingFiles) => {
    if (!incomingFiles?.length) return;

    setIsPreparing(true);
    setHasValidated(false);
    setValidatedRows([]);
    setPreviewColumns([]);
    setRawMergedRows([]);
    setValidationSummary({
      totalFiles: 0,
      totalRecords: 0,
      passed: 0,
      failed: 0,
    });

    try {
      const asArray = Array.from(incomingFiles);

      const { valid: xlsxValid, rejected: xlsxRejected } = filterXlsxFiles(asArray);
      const { valid: uniqueValid, rejected: duplicateRejected } = dedupeByFileName(xlsxValid);

      const combinedRejected = [...xlsxRejected, ...duplicateRejected];
      setRejectedFiles(combinedRejected);
      setSelectedFiles(uniqueValid);

      if (!uniqueValid.length) {
        setHeaderCheck({
          passed: false,
          referenceFileName: "",
          referenceHeaders: [],
          mismatches: [],
        });
        setRawMergedRows([]);
        setValidationSummary({
          totalFiles: 0,
          totalRecords: 0,
          passed: 0,
          failed: 0,
        });

        if (combinedRejected.length > 0) {
          await showWarning(
            "No valid files selected",
            "Please select valid .xlsx files with unique file names."
          );
        }
        return;
      }

      const fileMeta = [];
      const mismatches = [];
      let referenceHeaders = [];
      let referenceFileName = "";

      for (let i = 0; i < uniqueValid.length; i += 1) {
        const file = uniqueValid[i];
        const workbook = await readWorkbookFromFile(file);
        const sheetName = getFirstSheetName(workbook);

        if (!sheetName) {
          mismatches.push({
            fileName: file.name,
            reason: "No worksheet found.",
            expectedHeaders: referenceHeaders,
            actualHeaders: [],
          });
          continue;
        }

        const worksheet = workbook.Sheets[sheetName];
        const headers = getSheetHeadersExact(worksheet);
        const rows = sheetToJsonPreserveHeaders(worksheet);

        if (i === 0) {
          referenceHeaders = headers;
          referenceFileName = file.name;
        } else if (!headersAreExactMatch(referenceHeaders, headers)) {
          mismatches.push({
            fileName: file.name,
            reason: buildMismatchReason(referenceHeaders, headers),
            expectedHeaders: referenceHeaders,
            actualHeaders: headers,
          });
        }

        fileMeta.push({
          file,
          fileName: file.name,
          headers,
          rows,
        });
      }

      const headerPassed = mismatches.length === 0;
      setHeaderCheck({
        passed: headerPassed,
        referenceFileName,
        referenceHeaders,
        mismatches,
      });

      if (!headerPassed) {
        setRawMergedRows([]);
        setValidationSummary({
          totalFiles: uniqueValid.length,
          totalRecords: 0,
          passed: 0,
          failed: 0,
        });
        return;
      }

      const merged = [];
      for (const meta of fileMeta) {
        meta.rows.forEach((row, idx) => {
          merged.push({
            ...row,
            fileName: meta.fileName,
            rowNo: idx + 1,
          });
        });
      }

      setRawMergedRows(merged);
      setPreviewColumns([...referenceHeaders, "fileName", "rowNo"]);
      setValidationSummary({
        totalFiles: uniqueValid.length,
        totalRecords: merged.length,
        passed: 0,
        failed: 0,
      });
    } catch (error) {
      console.error(error);
      await showError("Preparation Error", error.message || "Failed to read Excel files.");
    } finally {
      setIsPreparing(false);
    }
  };

  const handleChooseFiles = async (event) => {
    const files = event.target.files;
    await prepareSelectedFiles(files);
    event.target.value = "";
  };

  const handleChooseFolder = async (event) => {
    const files = event.target.files;
    await prepareSelectedFiles(files);
    event.target.value = "";
  };

  const normalizeValidateResponse = (responseData, fallbackRows) => {
    /**
     * Supported shapes:
     * 1) { data: [...] }
     * 2) { rows: [...] }
     * 3) { data: { rows: [...] } }
     * 4) array directly
     *
     * Expected row-level fields from API may vary:
     * - status / validationStatus / resultStatus
     * - errorLog / errorMsg / errormsg / remarks
     *
     * If the API returns nothing row-level, we fallback to the original rows.
     */
    let rows = [];

    if (Array.isArray(responseData)) {
      rows = responseData;
    } else if (Array.isArray(responseData?.data)) {
      rows = responseData.data;
    } else if (Array.isArray(responseData?.rows)) {
      rows = responseData.rows;
    } else if (Array.isArray(responseData?.data?.rows)) {
      rows = responseData.data.rows;
    } else if (Array.isArray(responseData?.data?.data)) {
      rows = responseData.data.data;
    }

    if (!rows.length) {
      rows = fallbackRows.map((row) => ({
        ...row,
        status: "Passed",
        errorLog: "",
      }));
    }

    const normalized = rows.map((row, index) => {
      const status =
        row.status ||
        row.validationStatus ||
        row.resultStatus ||
        row.result ||
        "Passed";

      const errorLog =
        row.errorLog ||
        row.errorMsg ||
        row.errormsg ||
        row.remarks ||
        row.message ||
        "";

      return {
        ...fallbackRows[index],
        ...row,
        status: String(status),
        errorLog: String(errorLog || ""),
      };
    });

    return normalized;
  };

  const handleValidate = async () => {
    if (!selectedFiles.length) {
      await showWarning("No files selected", "Please select .xlsx files first.");
      return;
    }

    if (!headerCheck.passed) {
      await showWarning(
        "Header mismatch",
        "All selected files must have the same exact Excel column names and order."
      );
      return;
    }

    if (!rawMergedRows.length) {
      await showWarning("No records found", "No data rows were found in the selected files.");
      return;
    }

    setIsValidating(true);

    try {
      const payload = {
        json_data: rawMergedRows,
      };

      const response = await axios.post(validateApiUrl, payload);
      const normalizedRows = normalizeValidateResponse(response.data, rawMergedRows);

      const allColumns = new Set();
      normalizedRows.forEach((row) => {
        Object.keys(row).forEach((key) => allColumns.add(key));
      });

      const orderedBaseColumns = headerCheck.referenceHeaders || [];
      const tailColumns = ["fileName", "rowNo", "status", "errorLog"];
      const remaining = Array.from(allColumns).filter(
        (c) => !orderedBaseColumns.includes(c) && !tailColumns.includes(c)
      );

      const finalColumns = [
        ...orderedBaseColumns,
        "fileName",
        "rowNo",
        ...remaining,
        "status",
        "errorLog",
      ];

      const passedCount = normalizedRows.filter(
        (row) => String(row.status).toLowerCase() === "passed"
      ).length;

      const failedCount = normalizedRows.length - passedCount;

      setValidatedRows(normalizedRows);
      setPreviewColumns(finalColumns);
      setHasValidated(true);
      setValidationSummary({
        totalFiles: selectedFiles.length,
        totalRecords: normalizedRows.length,
        passed: passedCount,
        failed: failedCount,
      });

      if (failedCount > 0) {
        await showWarning(
          "Validation completed with errors",
          `${failedCount} record(s) failed validation. Upload is disabled until all errors are fixed.`
        );
      } else {
        await showSuccess(
          "Validation successful",
          "All records passed validation. You can now upload."
        );
      }
    } catch (error) {
      console.error(error);
      await showError(
        "Validation Failed",
        error?.response?.data?.message || error.message || "Failed to validate data."
      );
    } finally {
      setIsValidating(false);
    }
  };

  const canUpload = useMemo(() => {
    return (
      hasValidated &&
      validatedRows.length > 0 &&
      validationSummary.failed === 0 &&
      !isUploading &&
      !isValidating
    );
  }, [
    hasValidated,
    validatedRows.length,
    validationSummary.failed,
    isUploading,
    isValidating,
  ]);

  const handleUpload = async () => {
    if (!canUpload) {
      await showWarning(
        "Upload not allowed",
        "Please make sure validation is complete and there are no failed records."
      );
      return;
    }

    setIsUploading(true);

    try {
      const payload = {
        json_data: validatedRows,
      };

      const response = await axios.post(uploadApiUrl, payload);

      await showSuccess(
        "Upload successful",
        response?.data?.message || "The validated records were uploaded successfully."
      );

      resetAll();
      onClose?.();
    } catch (error) {
      console.error(error);
      await showError(
        "Upload Failed",
        error?.response?.data?.message || error.message || "Failed to upload records."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadErrors = () => {
    const errorRows = validatedRows.filter(
      (row) => String(row.status).toLowerCase() !== "passed"
    );

    if (!errorRows.length) {
      Swal.fire({
        icon: "info",
        title: "No errors found",
        text: "There are no failed records to export.",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    const ws = XLSX.utils.json_to_sheet(errorRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Errors");
    XLSX.writeFile(wb, "Excel_Upload_Error_Log.xlsx");
  };

  const previewRows = useMemo(() => {
    if (validatedRows.length) return validatedRows;
    return rawMergedRows;
  }, [validatedRows, rawMergedRows]);

  const visibleRows = useMemo(() => {
    return previewRows.slice(0, 200);
  }, [previewRows]);

  const getStatusBadge = (status) => {
    const normalized = String(status || "").toLowerCase();
    if (normalized === "passed") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
          <CheckCircle2 size={14} />
          Passed
        </span>
      );
    }

    if (!normalized) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600">
          Pending
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
        <XCircle size={14} />
        Failed
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/55 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.18 }}
          className="flex h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 px-6 py-5 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight">{title}</h2>
                <p className="mt-1 text-sm text-white/90">
                  Select .xlsx files or a folder → validate → review → upload
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-white/90 transition hover:bg-white/15 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Step indicator */}
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold">
              <div className="rounded-full bg-white/20 px-3 py-1">1 Select Files</div>
              <div className="text-white/70">→</div>
              <div className="rounded-full bg-white/20 px-3 py-1">2 Validate</div>
              <div className="text-white/70">→</div>
              <div className="rounded-full bg-white/20 px-3 py-1">3 Review</div>
              <div className="text-white/70">→</div>
              <div className="rounded-full bg-white/20 px-3 py-1">4 Upload</div>
            </div>
          </div>

          {/* Body */}
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden bg-slate-50 p-5">
            {/* Upload Panel */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
                <div>
                  <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
                    <div className="flex flex-col items-start gap-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
                          <FileSpreadsheet size={22} />
                        </div>
                        <div>
                          <div className="text-base font-semibold text-slate-800">
                            Upload .xlsx Files Only
                          </div>
                          <div className="text-sm text-slate-500">
                            Duplicate file names are blocked. All selected files must have the same exact headers.
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                        >
                          <Upload size={16} />
                          Choose Files
                        </button>

                        <button
                          type="button"
                          onClick={() => folderInputRef.current?.click()}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          <FolderOpen size={16} />
                          Choose Folder
                        </button>

                        <button
                          type="button"
                          onClick={handleValidate}
                          disabled={
                            isPreparing ||
                            isValidating ||
                            !selectedFiles.length ||
                            !headerCheck.passed ||
                            !rawMergedRows.length
                          }
                          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition ${
                            isPreparing ||
                            isValidating ||
                            !selectedFiles.length ||
                            !headerCheck.passed ||
                            !rawMergedRows.length
                              ? "cursor-not-allowed bg-slate-200 text-slate-500"
                              : "bg-emerald-600 text-white hover:bg-emerald-700"
                          }`}
                        >
                          <RefreshCcw size={16} />
                          {isValidating ? "Validating..." : hasValidated ? "Revalidate" : "Validate Data"}
                        </button>

                        <button
                          type="button"
                          onClick={resetAll}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          <Trash2 size={16} />
                          Clear
                        </button>

                        <button
                          type="button"
                          onClick={handleDownloadErrors}
                          disabled={!validatedRows.some((row) => String(row.status).toLowerCase() !== "passed")}
                          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                            validatedRows.some((row) => String(row.status).toLowerCase() !== "passed")
                              ? "border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                              : "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400"
                          }`}
                        >
                          <FileWarning size={16} />
                          Download Errors
                        </button>
                      </div>

                      <div className="text-xs text-slate-500">
                        Rules: only <span className="font-semibold">.xlsx</span>, no duplicate file names, exact same headers and order across all files.
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".xlsx"
                        onChange={handleChooseFiles}
                        className="hidden"
                      />

                      <input
                        ref={folderInputRef}
                        type="file"
                        onChange={handleChooseFolder}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* File checks */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 text-sm font-semibold text-slate-800">
                    Selected Files Check
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      {selectedFiles.length > 0 && rejectedFiles.every((r) => !r.reason.includes(".xlsx")) ? (
                        <CheckCircle2 size={16} className="text-emerald-600" />
                      ) : (
                        <AlertTriangle size={16} className="text-amber-600" />
                      )}
                      <span className="text-slate-700">Only .xlsx files allowed</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!rejectedFiles.some((r) => r.reason.toLowerCase().includes("duplicate")) ? (
                        <CheckCircle2 size={16} className="text-emerald-600" />
                      ) : (
                        <XCircle size={16} className="text-red-600" />
                      )}
                      <span className="text-slate-700">Duplicate file names are not allowed</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {headerCheck.passed && selectedFiles.length > 0 ? (
                        <CheckCircle2 size={16} className="text-emerald-600" />
                      ) : (
                        <XCircle size={16} className="text-red-600" />
                      )}
                      <span className="text-slate-700">All files must have identical headers and order</span>
                    </div>
                  </div>

                  {!!headerCheck.referenceHeaders.length && (
                    <div className="mt-4 rounded-xl bg-white p-3 text-xs text-slate-600">
                      <div className="font-semibold text-slate-700">
                        Reference File: {headerCheck.referenceFileName}
                      </div>
                      <div className="mt-2 break-words">
                        {headerCheck.referenceHeaders.join(" | ")}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Rejected files */}
              {rejectedFiles.length > 0 && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
                  <div className="mb-2 text-sm font-semibold text-red-700">
                    Rejected Files
                  </div>
                  <div className="space-y-2 text-sm">
                    {rejectedFiles.map((item, idx) => (
                      <div
                        key={`${item.fileName}-${idx}`}
                        className="flex items-start gap-2 text-red-700"
                      >
                        <XCircle size={16} className="mt-0.5 shrink-0" />
                        <div>
                          <span className="font-semibold">{item.fileName}</span>
                          <span className="ml-2">{item.reason}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Header mismatches */}
              {!headerCheck.passed && headerCheck.mismatches.length > 0 && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
                  <div className="mb-2 text-sm font-semibold text-red-700">
                    Column Mismatch Detected
                  </div>

                  <div className="space-y-3">
                    {headerCheck.mismatches.map((item, idx) => (
                      <div
                        key={`${item.fileName}-${idx}`}
                        className="rounded-xl border border-red-100 bg-white p-3 text-sm"
                      >
                        <div className="font-semibold text-slate-800">{item.fileName}</div>
                        <div className="mt-1 text-red-700">{item.reason}</div>

                        <div className="mt-2 text-xs text-slate-600">
                          <div>
                            <span className="font-semibold">Expected:</span>{" "}
                            {item.expectedHeaders.join(" | ")}
                          </div>
                          <div className="mt-1">
                            <span className="font-semibold">Found:</span>{" "}
                            {item.actualHeaders.join(" | ")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected file list */}
              {selectedFiles.length > 0 && (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="mb-3 text-sm font-semibold text-slate-800">
                    Accepted Files
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selectedFiles.map((file) => (
                      <span
                        key={file.name}
                        className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700"
                      >
                        <CheckCircle2 size={14} />
                        {file.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                label="Total Files"
                value={validationSummary.totalFiles}
                icon={<FileSpreadsheet size={18} />}
                tone="blue"
              />
              <SummaryCard
                label="Total Records"
                value={validationSummary.totalRecords}
                icon={<Upload size={18} />}
                tone="slate"
              />
              <SummaryCard
                label="Passed"
                value={validationSummary.passed}
                icon={<CheckCircle2 size={18} />}
                tone="emerald"
              />
              <SummaryCard
                label="Failed"
                value={validationSummary.failed}
                icon={<XCircle size={18} />}
                tone="red"
              />
            </div>

            {/* Table */}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <div>
                  <div className="text-sm font-semibold text-slate-800">
                    Preview Data
                  </div>
                  <div className="text-xs text-slate-500">
                    Showing up to 200 rows for preview
                  </div>
                </div>

                <div className="text-xs text-slate-500">
                  {isPreparing
                    ? "Reading files..."
                    : isValidating
                    ? "Validating data..."
                    : isUploading
                    ? "Uploading..."
                    : hasValidated
                    ? "Validation completed"
                    : "Waiting for validation"}
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-auto">
                {previewColumns.length === 0 || visibleRows.length === 0 ? (
                  <div className="flex h-full items-center justify-center p-8 text-center text-sm text-slate-500">
                    No preview data yet. Select valid .xlsx files with matching headers, then validate.
                  </div>
                ) : (
                  <table className="min-w-full border-separate border-spacing-0 text-sm">
                    <thead className="sticky top-0 z-10 bg-slate-100">
                      <tr>
                        {previewColumns.map((column) => (
                          <th
                            key={column}
                            className="border-b border-r border-slate-200 px-3 py-2 text-left font-semibold text-slate-700 first:border-l"
                          >
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {visibleRows.map((row, rowIndex) => {
                        const failed = String(row.status || "").toLowerCase() !== "" &&
                          String(row.status || "").toLowerCase() !== "passed";

                        return (
                          <tr
                            key={`${row.fileName || "row"}-${row.rowNo || rowIndex}-${rowIndex}`}
                            className={failed ? "bg-red-50/60" : "bg-white"}
                          >
                            {previewColumns.map((column) => (
                              <td
                                key={`${rowIndex}-${column}`}
                                className="border-b border-r border-slate-100 px-3 py-2 align-top text-slate-700 first:border-l"
                              >
                                {column === "status" ? (
                                  getStatusBadge(row[column])
                                ) : column === "errorLog" ? (
                                  <span className={failed ? "text-red-700" : "text-slate-500"}>
                                    {String(row[column] ?? "")}
                                  </span>
                                ) : (
                                  <span>{String(row[column] ?? "")}</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-slate-200 bg-white px-5 py-4">
            <div className="text-xs text-slate-500">
              Exact Excel column names are preserved in the JSON payload.
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>

              <button
                type="button"
                onClick={handleUpload}
                disabled={!canUpload}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm transition ${
                  canUpload
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "cursor-not-allowed bg-slate-200 text-slate-500"
                }`}
              >
                <Send size={16} />
                {isUploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function SummaryCard({ label, value, icon, tone = "slate" }) {
  const toneMap = {
    blue: {
      wrap: "border-blue-200 bg-blue-50",
      icon: "bg-blue-100 text-blue-700",
      text: "text-blue-800",
    },
    slate: {
      wrap: "border-slate-200 bg-slate-50",
      icon: "bg-slate-200 text-slate-700",
      text: "text-slate-800",
    },
    emerald: {
      wrap: "border-emerald-200 bg-emerald-50",
      icon: "bg-emerald-100 text-emerald-700",
      text: "text-emerald-800",
    },
    red: {
      wrap: "border-red-200 bg-red-50",
      icon: "bg-red-100 text-red-700",
      text: "text-red-800",
    },
  };

  const styles = toneMap[tone] || toneMap.slate;

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${styles.wrap}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {label}
          </div>
          <div className={`mt-2 text-2xl font-bold ${styles.text}`}>{value}</div>
        </div>

        <div className={`rounded-xl p-3 ${styles.icon}`}>{icon}</div>
      </div>
    </div>
  );
}