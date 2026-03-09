import React, { useEffect, useMemo, useRef, useState, forwardRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";
import { useAuth } from "@/NAYSA Cloud/Authentication/AuthContext.jsx";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faSave,
  faUndo,
  faTrashAlt,
  faInfoCircle,
  faChevronDown,
  faFilePdf,
  faVideo,
  faClipboardList,
} from "@fortawesome/free-solid-svg-icons";

import ButtonBar from "@/NAYSA Cloud/Global/ButtonBar.jsx";
import RegistrationInfo from "@/NAYSA Cloud/Global/RegistrationInfo.jsx";

import {
  reftablesPDFGuide,
  reftablesVideoGuide,
} from "@/NAYSA Cloud/Global/reftable";

import {
  useSwalErrorAlert,
  useSwalSuccessAlert,
  useSwalErrorAlertAPI,
  useSwalDeleteConfirm,
  useSwalDeleteRecord,
} from "@/NAYSA Cloud/Global/behavior";

import { useFieldLenghtCheck, useGetFieldLength } from "@/NAYSA Cloud/Global/procedure";
import { useTopDocDropDown } from "@/NAYSA Cloud/Global/top1RefTable";

const DOC_TYPE = "FSConso";

const EMPTY_ROW = {
  fsConsoCode: "",
  fsConsoName: "",
  fsType: "",
  acctBalance: "",
  sumGrp: "",
  sumOper: "",
  topLine: "",
  bottomLine: "",
  currSign: "N",
  registeredBy: "",
  registeredDate: "",
  lastUpdatedBy: "",
  lastUpdatedDate: "",
  __isNew: true,
  __isDirty: true,
};

const FSConsolidation = forwardRef(function FSConsolidation(
  {
    embedded = false,
    activeTab = "fsconso",
    setActiveTab = () => {},
    tabs = [],
  },
  ref
) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const guideRef = useRef(null);
  const pdfLink = reftablesPDFGuide[DOC_TYPE];
  const videoLink = reftablesVideoGuide[DOC_TYPE];

  const [isOpenGuide, setOpenGuide] = useState(false);
  const [rows, setRows] = useState([]);
  const [registrationInfo, setRegistrationInfo] = useState({
    registeredBy: "",
    registeredDate: "",
    lastUpdatedBy: "",
    lastUpdatedDate: "",
  });
  const [selectedRow, setSelectedRow] = useState(null);
  const [tblFieldArray, setTblFieldArray] = useState([]);
  const [savingAll, setSavingAll] = useState(false);

  const userCode = user?.USER_CODE || "ADMIN";

  const { data: dropdowns, isLoading: isDropdownLoading } = useQuery({
    queryKey: ["fsconsoDropdowns"],
    queryFn: async () => {
      const [bal, typ] = await Promise.all([
        useTopDocDropDown("COAMAST", "NBAL"),
        useTopDocDropDown("COAMAST", "ACCT_TYPE"),
      ]);
      return { bal, typ };
    },
  });

  const { data: fsconso = [], isLoading: isListLoading } = useQuery({
    queryKey: ["fsconsoList"],
    queryFn: async () => {
      const { data } = await apiClient.get("/fsconso");
      const raw = data?.data?.[0]?.result || data?.[0]?.result || data?.result;
      return raw ? JSON.parse(raw) : [];
    },
  });

  useEffect(() => {
    const normalized = (fsconso || []).map((row) => ({
      ...row,
      fsType: row.fsType ?? "",
      fsConsoCode: row.fsConsoCode ?? "",
      fsConsoName: row.fsConsoName ?? "",
      acctBalance: row.acctBalance ?? "",
      sumGrp: row.sumGrp ?? "",
      sumOper: String(row.sumOper || "A").toUpperCase() === "S" ? "S" : "A",
      topLine: String(row.topLine || "S").toUpperCase() === "D" ? "D" : "S",
      bottomLine: String(row.bottomLine || "S").toUpperCase() === "D" ? "D" : "S",
      currSign: String(row.currSign || "N").toUpperCase() === "Y" ? "Y" : "N",
      __isNew: false,
      __isDirty: false,
    }));
    setRows(normalized);
  }, [fsconso]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await useFieldLenghtCheck("FS_CONSOLIDATION");
      if (mounted) setTblFieldArray(res || []);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const getMax = (col) => useGetFieldLength(tblFieldArray, col);

  const { mutateAsync: deleteFSConso, isLoading: isDeleting } = useMutation({
    mutationFn: async (payload) => await apiClient.post("/deleteFSConso", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fsconsoList"] });
      useSwalDeleteRecord("Deleted!", "The FS Consolidation has been removed from the system.");
    },
    onError: (error) => useSwalErrorAlertAPI("Delete Error", error),
  });

  const handleRowSelect = (row) => {
    setSelectedRow(row.fsConsoCode || row.__tempId || null);
    setRegistrationInfo({
      registeredBy: row.registeredBy || "",
      registeredDate: row.registeredDate || "",
      lastUpdatedBy: row.lastUpdatedBy || "",
      lastUpdatedDate: row.lastUpdatedDate || "",
    });
  };

  const updateRow = (rowKey, field, value) => {
    setRows((prev) =>
      prev.map((row) => {
        const key = row.fsConsoCode || row.__tempId;
        if (key !== rowKey) return row;
        return {
          ...row,
          [field]: value,
          __isDirty: true,
        };
      })
    );
  };

  const addRow = () => {
    const tempId = `NEW-${Date.now()}`;
    const newRow = {
      ...EMPTY_ROW,
      __tempId: tempId,
    };
    setRows((prev) => [newRow, ...prev]);
    setSelectedRow(tempId);
    setRegistrationInfo({
      registeredBy: "",
      registeredDate: "",
      lastUpdatedBy: "",
      lastUpdatedDate: "",
    });
  };

  const resetTable = () => {
    const normalized = (fsconso || []).map((row) => ({
      ...row,
      fsType: row.fsType ?? "",
      fsConsoCode: row.fsConsoCode ?? "",
      fsConsoName: row.fsConsoName ?? "",
      acctBalance: row.acctBalance ?? "",
      sumGrp: row.sumGrp ?? "",
      sumOper: String(row.sumOper || "A").toUpperCase() === "S" ? "S" : "A",
      topLine: String(row.topLine || "S").toUpperCase() === "D" ? "D" : "S",
      bottomLine: String(row.bottomLine || "S").toUpperCase() === "D" ? "D" : "S",
      currSign: String(row.currSign || "N").toUpperCase() === "Y" ? "Y" : "N",
      __isNew: false,
      __isDirty: false,
    }));
    setRows(normalized);
    setSelectedRow(null);
    setRegistrationInfo({
      registeredBy: "",
      registeredDate: "",
      lastUpdatedBy: "",
      lastUpdatedDate: "",
    });
  };

  const validateRow = (row) => {
    const missing = [];
    if (!row.fsConsoCode?.trim()) missing.push("FS Conso Code");
    if (!row.fsConsoName?.trim()) missing.push("FS Conso Name");
    if (!row.fsType?.trim()) missing.push("FS Type");

    if (missing.length) {
      useSwalErrorAlert("Validation Error", `Please fill in: ${missing.join(", ")}`);
      return false;
    }
    return true;
  };

  const checkDuplicate = async (row) => {
    if (!row.__isNew) return false;

    const payload = {
      json_data: {
        fsConsoCode: row.fsConsoCode,
      },
    };

    const response = await apiClient.post("/checkDuplicateFSConso", payload);
    const sqlRow = response?.data?.data?.[0];
    const rawJsonString = sqlRow?.result || Object.values(sqlRow || {})[0];
    const parsedData = JSON.parse(rawJsonString || '{"result":"0"}');

    return parsedData.result === "1";
  };

  const saveOneRow = async (row) => {
    const payload = {
      json_data: JSON.stringify({
        json_data: {
          fsConsoCode: row.fsConsoCode,
          fsConsoName: row.fsConsoName,
          fsType: row.fsType,
          acctBalance: row.acctBalance,
          sumGrp: row.sumGrp,
          sumOper: row.sumOper,
          topLine: row.topLine,
          bottomLine: row.bottomLine,
          currSign: row.currSign,
          action: row.__isNew ? "ADD" : "EDIT",
          userCode,
        },
      }),
    };

    const response = await apiClient.post("/upsertFSConso", payload);
    const sqlRow = response?.data?.data?.[0];

    if (sqlRow?.errorcount > 0) {
      throw new Error(sqlRow?.errormsg || `Failed to save ${row.fsConsoCode}`);
    }

    const status = response?.data?.status ?? response?.data?.data?.status;
    const success = response?.data?.success || status === "success" || !status;

    if (!success) {
      throw new Error(
        response?.data?.message ||
          response?.data?.data?.message ||
          `Failed to save ${row.fsConsoCode}`
      );
    }
  };

  const handleSaveAll = async () => {
    const dirtyRows = rows.filter((r) => r.__isDirty);

    if (!dirtyRows.length) {
      return useSwalErrorAlert("No Changes", "There are no modified rows to save.");
    }

    try {
      setSavingAll(true);

      for (const row of dirtyRows) {
        if (!validateRow(row)) {
          setSavingAll(false);
          return;
        }

        if (row.__isNew) {
          const isDuplicate = await checkDuplicate(row);
          if (isDuplicate) {
            setSavingAll(false);
            return useSwalErrorAlert(
              "Duplicate Code",
              `FS Conso Code already exists: ${row.fsConsoCode}`
            );
          }
        }

        await saveOneRow(row);
      }

      await queryClient.invalidateQueries({ queryKey: ["fsconsoList"] });
      useSwalSuccessAlert("Success!", "All modified FS Consolidation rows were saved.");
    } catch (error) {
      useSwalErrorAlertAPI("Save Error", error?.message || error);
    } finally {
      setSavingAll(false);
    }
  };

  const handleDelete = async (row) => {
    try {
      if (row.__isNew) {
        setRows((prev) =>
          prev.filter((r) => (r.fsConsoCode || r.__tempId) !== (row.fsConsoCode || row.__tempId))
        );
        return;
      }

      const payload = {
        json_data: {
          fsConsoCode: row.fsConsoCode,
        },
      };

      const response = await apiClient.post("/checkInUsedFSConso", payload);
      const sqlRow = response?.data?.data?.[0];
      const rawJsonString = sqlRow?.result || Object.values(sqlRow || {})[0];
      const parsedData = JSON.parse(rawJsonString || '{"result":"0"}');

      if (parsedData.result === "1") {
        return useSwalErrorAlertAPI(
          `Cannot Delete FS Consolidation Code: ${row.fsConsoCode}`,
          `Code was already used.`
        );
      }

      const confirm = await useSwalDeleteConfirm(
        "Confirm Delete",
        `Are you sure you want to delete Code: ${row.fsConsoCode}?`
      );

      if (!confirm.isConfirmed) return;

      await deleteFSConso(payload);
    } catch (error) {
      useSwalErrorAlertAPI("System Error", error);
    }
  };

  useEffect(() => {
    const handleClick = (e) => {
      if (guideRef.current && !guideRef.current.contains(e.target)) setOpenGuide(false);
    };

    const handleKey = (e) => {
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        handleSaveAll();
      }
    };

    document.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, [rows]);

  const tableInputClass =
    "w-full min-w-[80px] rounded-md border border-gray-300 px-1 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-400";
  const tableSelectClass =
    "w-full min-w-[80px] rounded-md border border-gray-300 px-1 py-1 text-[11px] bg-white focus:outline-none focus:ring-1 focus:ring-blue-400";

  const selectedRowData = useMemo(() => {
    return rows.find((r) => (r.fsConsoCode || r.__tempId) === selectedRow) || null;
  }, [rows, selectedRow]);

  return (
    <div className="global-ref-main-div-ui">
      {(isDropdownLoading || isListLoading || isDeleting || savingAll) && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-blue-100 dark:border-gray-700 rounded-full"></div>
              <div className="absolute top-0 left-0 w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <span className="text-sm font-semibold animate-pulse">
              {savingAll ? "Saving changes..." : isDeleting ? "Deleting..." : "Loading..."}
            </span>
          </div>
        </div>
      )}

      <div className="global-ref-header-ui">
        <div className="w-full flex flex-col md:grid md:grid-cols-3 md:items-center gap-3 md:gap-0">
          <div className="w-full md:w-auto flex">
            <h1 className="global-ref-headertext-ui">FS Consolidation</h1>
          </div>

          <div className="w-full md:justify-center flex" />

          <div className="w-full md:w-auto flex md:justify-end">
            <div className="w-full md:w-auto flex items-center justify-center md:justify-end gap-2 flex-wrap">
              <ButtonBar
                buttons={[
                  {
                    key: "add",
                    label: <span className="hidden sm:inline ml-1">Add Row</span>,
                    icon: faPlus,
                    onClick: addRow,
                    className:
                      "flex items-center justify-center h-8 w-8 sm:w-auto sm:h-9 sm:px-4 text-[11px] font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-all",
                  },
                  {
                    key: "save",
                    label: <span className="hidden sm:inline ml-1">Save All</span>,
                    icon: faSave,
                    onClick: handleSaveAll,
                    className:
                      "flex items-center justify-center h-8 w-8 sm:w-auto sm:h-9 sm:px-4 text-[11px] font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-all",
                  },
                  {
                    key: "reset",
                    label: <span className="hidden sm:inline ml-1">Reset</span>,
                    icon: faUndo,
                    onClick: resetTable,
                    className:
                      "flex items-center justify-center h-8 w-8 sm:w-auto sm:h-9 sm:px-4 text-[11px] font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-all",
                  },
                ]}
              />

              <div ref={guideRef} className="relative">
                <button
                  onClick={() => setOpenGuide((v) => !v)}
                  className="bg-blue-600 text-white h-8 w-8 sm:w-auto sm:h-9 sm:px-4 rounded-md flex items-center justify-center gap-1 hover:bg-blue-700 transition-all"
                >
                  <FontAwesomeIcon icon={faInfoCircle} className="text-[12px]" />
                  <span className="hidden sm:inline ml-1 text-[11px] font-medium">Info</span>
                  <FontAwesomeIcon icon={faChevronDown} className="hidden sm:inline text-[10px] opacity-80" />
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
                      <FontAwesomeIcon icon={faFilePdf} className="mr-2 text-red-500" /> PDF Guide
                    </button>
                    <button
                      onClick={() => {
                        window.open(videoLink, "_blank");
                        setOpenGuide(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900"
                    >
                      <FontAwesomeIcon icon={faVideo} className="mr-2 text-blue-500" /> Video Guide
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-20 flex flex-col lg:flex-row lg:items-start gap-3">
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-lg overflow-auto">
          <table className="min-w-full border-collapse text-xs">
            <thead>
              <tr className="bg-blue-100 text-gray-800">
                <th className=" px-2 py-2 text-left">FS Type</th>
                <th className=" px-2 py-2 text-left">FS Conso Code</th>
                <th className=" px-2 py-2 text-left">FS Conso Name</th>
                {/* <th className=" px-2 py-2 text-left">Balance</th> */}
                <th className=" px-2 py-2 text-left">Summary Group</th>
                <th className=" px-2 py-2 text-left">Sum Operation</th>
                {/* <th className=" px-2 py-2 text-left">Top Line</th> */}
                <th className=" px-2 py-2 text-left">Bottom Line</th>
                <th className=" px-2 py-2 text-left">Curr Sign</th>
                <th className=" px-2 py-2 text-center"></th>
                <th className=" px-2 py-2 text-center"></th>
                <th className=" px-2 py-2 text-center"></th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="border px-3 py-6 text-center text-gray-500">
                    No data found
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => {
                  const rowKey = row.fsConsoCode || row.__tempId;
                  const isSelected = selectedRow === rowKey;

                  return (
                    <tr
                      key={rowKey}
                      className={`${isSelected ? "bg-blue-50" : "bg-white"} hover:bg-gray-50 text-[8px]` }
                      onClick={() => handleRowSelect(row)}
                    >
                      <td className="px-2 py-1 w-[140px]">
                        <select
                          className={tableSelectClass}
                          value={row.fsType}
                          onChange={(e) => updateRow(rowKey, "fsType", e.target.value)}
                        >
                          <option value="">Select</option>
                          {(dropdowns?.typ || []).map((d) => (
                            <option key={d.DROPDOWN_CODE} value={d.DROPDOWN_CODE}>
                              {d.DROPDOWN_NAME}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-2 py-1 w-[100px]">
                        <input
                          className={tableInputClass}
                          value={row.fsConsoCode}
                          maxLength={getMax("FSCONSO_CODE")}
                          disabled={!row.__isNew}
                          onChange={(e) =>
                            updateRow(rowKey, "fsConsoCode", (e.target.value || "").toUpperCase())
                          }
                        />
                      </td>

                      <td className="px-2 py-1 min-w-[200px]">
                        <input
                          className={tableInputClass}
                          value={row.fsConsoName}
                          maxLength={getMax("FSCONSO_NAME")}
                          onChange={(e) => updateRow(rowKey, "fsConsoName", e.target.value)}
                        />
                      </td>
{/* 
                      <td className="px-2 py-1 w-[100px]">
                        <select
                          className={tableSelectClass}
                          value={row.acctBalance}
                          onChange={(e) => updateRow(rowKey, "acctBalance", e.target.value)}
                        >
                          <option value="">Select</option>
                          {(dropdowns?.bal || []).map((d) => (
                            <option key={d.DROPDOWN_CODE} value={d.DROPDOWN_CODE}>
                              {d.DROPDOWN_NAME}
                            </option>
                          ))}
                        </select>
                      </td> */}

                      <td className="px-2 py-1 w-[120px]">
                        <input
                          className={tableInputClass}
                          value={row.sumGrp}
                          maxLength={getMax("SUMMARY_GROUP")}
                          onChange={(e) => updateRow(rowKey, "sumGrp", e.target.value)}
                        />
                      </td>

                      <td className="px-2 py-1 w-[100px]">
                        <select
                          className={tableSelectClass}
                          value={row.sumOper}
                          onChange={(e) => updateRow(rowKey, "sumOper", e.target.value)}
                        >
                          <option value="A">Added</option>
                          <option value="S">Subtracted</option>
                        </select>
                      </td>
{/* 
                      <td className="px-2 py-1 w-[100px]">
                        <select
                          className={tableSelectClass}
                          value={row.topLine}
                          onChange={(e) => updateRow(rowKey, "topLine", e.target.value)}
                        >
                          <option value="S">Single</option>
                          <option value="D">Double</option>
                        </select>
                      </td> */}

                      <td className="px-2 py-1 w-[100px]">
                        <select
                          className={tableSelectClass}
                          value={row.bottomLine}
                          onChange={(e) => updateRow(rowKey, "bottomLine", e.target.value)}
                        >
                          <option value="S">Single</option>
                          <option value="D">Double</option>
                        </select>
                      </td>

                      <td className="px-2 py-1 w-[100px]">
                        <select
                          className={tableSelectClass}
                          value={row.currSign}
                          onChange={(e) => updateRow(rowKey, "currSign", e.target.value)}
                        >
                          <option value="Y">Yes</option>
                          <option value="N">No</option>
                        </select>
                      </td>

                      <td className="px-0 py-1 text-center w-[30px] text-xs">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(row);
                          }}
                          className="py-1 px-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                          title="Delete"
                        >
                          <FontAwesomeIcon icon={faTrashAlt} />
                        </button>
                      </td>
                      
                      <td className="px-0 py-1 text-center w-[30px] text-xs">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addRow();
                          }}
                          className="py-1 px-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                          title="Add"
                        >
                          <FontAwesomeIcon icon={faPlus} />
                        </button>
                      </td>
                       <td className="px-0 py-1 text-center w-[30px] text-xs">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addRow();
                          }}
                          className="py-1 px-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                          title="Registration Info"
                        >
                          <FontAwesomeIcon icon={faClipboardList} />
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div> 
      </div>

        <div className="mt-4 w-full lg:w-[320px]">
          <RegistrationInfo layout="stacked" data={registrationInfo} />
        </div>

    </div>

  );
});

export default FSConsolidation;