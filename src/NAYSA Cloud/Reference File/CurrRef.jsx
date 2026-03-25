import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";
import { useAuth } from "@/NAYSA Cloud/Authentication/AuthContext.jsx";

// Import Lookup Modals
import SearchGlobalReferenceTable from "@/NAYSA Cloud/Lookup/SearchGlobalReferenceTable";

// Icons & Globals
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faSave,
  faUndo,
  faEdit,
  faTrashAlt,
  faInfoCircle,
  faChevronDown,
  faFilePdf,
  faVideo,
} from "@fortawesome/free-solid-svg-icons";
import {
  reftables,
  reftablesPDFGuide,
  reftablesVideoGuide,
} from "@/NAYSA Cloud/Global/reftable";

import {
  useSwalErrorAlert,
  useSwalSuccessAlert,
  useSwalErrorAlertAPI,
  useSwalDeleteConfirm,
  useSwalDeleteRecord,
  useSwalValidationAlert,
} from "@/NAYSA Cloud/Global/behavior.jsx";
import {
  useFieldLenghtCheck,
  useGetFieldLength,
} from "@/NAYSA Cloud/Global/procedure";

// UI Helpers
import FieldRenderer from "@/NAYSA Cloud/Global/FieldRenderer";
import ButtonBar from "@/NAYSA Cloud/Global/ButtonBar";
import RegistrationInfo from "@/NAYSA Cloud/Global/RegistrationInfo.jsx";

const INITIAL_FORM = {
  currCode: "",
  currName: "",
  active: "Y",
};

const INITIAL_REG = {
  registeredBy: "",
  registeredDate: "",
  lastUpdatedBy: "",
  lastUpdatedDate: "",
};

const CurrRef = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const docType = "CURR"; 
  const guideRef = useRef(null);
  const pdfLink = reftablesPDFGuide[docType];
  const videoLink = reftablesVideoGuide[docType];

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [registrationInfo, setRegistrationInfo] = useState(INITIAL_REG);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCurrCode, setSelectedCurrCode] = useState(null);
  const [isOpenGuide, setOpenGuide] = useState(false);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [tblFieldArray, setTblFieldArray] = useState([]);

  // --- TANSTACK QUERY: Fetch List ---
  const { data: accounts = [], isLoading: isListLoading } = useQuery({
    queryKey: ["currencyList"],
    queryFn: async () => {
      const { data } = await apiClient.get("/curr");
      const raw = data?.data?.[0]?.result || data?.result;
      return raw ? JSON.parse(raw) : [];
    },
  });

  // --- TANSTACK QUERY: Save Mutation ---
  const { mutate: saveCurrency, isLoading: isSaving } = useMutation({
    mutationFn: async (payload) => await apiClient.post("/upsertCurr", payload),
    onSuccess: (response) => {
      const sqlRow = response?.data?.data?.[0];
      if (sqlRow?.errorcount > 0) {
        useSwalErrorAlert("Error", sqlRow?.errormsg || "Failed to save Currency.");
        resetForm();
        return;
      }

      const status = response?.data?.status ?? response?.data?.data?.status;
      const success = response?.data?.success || status === "success" || !status;

      if (!success) {
        useSwalErrorAlert(
          "Error",
          response?.data?.message || response?.data?.data?.message || "Failed to save Currency."
        );
        resetForm();
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["currencyList"] });
      useSwalSuccessAlert("Success!", "Currency saved successfully!");
      resetForm();
    },
    onError: (error) => {
      useSwalErrorAlertAPI(
        "System Error",
        error?.response?.status ? `HTTP ${error.response.status}` : error?.message || String(error)
      );
      resetForm();
    },
  });

  // --- TANSTACK QUERY: Delete Mutation ---
  const { mutate: deleteCurrency, isLoading: isDeleting } = useMutation({
    mutationFn: async (payload) => await apiClient.post("/deleteCurr", payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["currencyList"]);
      useSwalDeleteRecord("Deleted!", "The currency has been successfully removed.");
      resetForm();
    },
    onError: (error) => useSwalErrorAlertAPI("Delete Error", error),
  });

  // --- ACTIONS ---
  const handleSave = async () => {
    // 1. Basic Validations
    if (!formData.currCode || !formData.currName) {
      return useSwalErrorAlert("Validation Error", "All fields are required.");
    }

    if (formData.currCode.length > getMax("CURR_CODE")) {
        return useSwalValidationAlert("Length Error", `Code cannot exceed ${getMax("CURR_CODE")} characters.`);
    }

    // 2. Final Duplicate Check for New Records
    if (!selectedCurrCode) {
      try {
        setIsLoadingAction(true);
        const checkRes = await apiClient.post("/checkDuplicateCurr", {
          json_data: { currCode: formData.currCode },
        });

        const sqlRow = checkRes?.data?.data?.[0] || checkRes?.data;
        const parsedData = typeof sqlRow?.result === 'string' ? JSON.parse(sqlRow?.result) : sqlRow;
        
        if (parsedData?.result === "1" || sqlRow?.result === "1") {
          setIsLoadingAction(false);
          return useSwalErrorAlert("Duplicate Error", `The Code ${formData.currCode} is already used.`);
        }
      } catch (error) {
        console.error("Validation Error:", error);
      } finally {
        setIsLoadingAction(false);
      }
    }

    // 3. Proceed with Save
    const payload = {
      json_data: {
        currCode: formData.currCode,
        currName: formData.currName,
        active: formData.active || "Y",
        userCode: user?.USER_CODE || "ADMIN",
      },
    };

    saveCurrency(payload);
  };

  const handleDelete = async (row) => {
    try {
      setIsLoadingAction(true);
      
      // 1. Check if in use
      const checkResp = await apiClient.post("/checkInUsedCurr", { 
        json_data: { currCode: row.currCode } 
      });
      
      const sqlRow = checkResp?.data?.data?.[0] || checkResp?.data;
      if (sqlRow?.isInUsed) {
        setIsLoadingAction(false);
        return useSwalErrorAlert("Cannot Delete", `Currency "${row.currCode}" is in use.`);
      }

      // 2. Confirmations
      const confirm = await useSwalDeleteConfirm(
        "Confirm Delete",
        `Are you sure you want to delete Currency: ${row.currCode}?`
      );

      if (confirm.isConfirmed) {
        deleteCurrency({
          json_data: { currCode: row.currCode, userCode: user?.USER_CODE || "ADMIN" },
        });
      }
    } catch (error) {
      useSwalErrorAlertAPI("System Error", error);
    } finally {
      setIsLoadingAction(false);
    }
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM);
    setRegistrationInfo(INITIAL_REG);
    setIsEditing(false);
    setSelectedCurrCode(null);
  };

  const handleEdit = (row) => {
    setFormData({
      currCode: row.currCode || "",
      currName: row.currName || "",
      active: row.active || "Y",
    });

    setRegistrationInfo({
      registeredBy: row.registeredBy,
      registeredDate: row.registeredDate,
      lastUpdatedBy: row.lastUpdatedBy,
      lastUpdatedDate: row.lastUpdatedDate,
    });

    setSelectedCurrCode(row.currCode);
    setIsEditing(true);
  };

  // --- VALIDATION: Check for Duplicate Code ---
  const handleCheckDuplicate = async (code) => {
    if (selectedCurrCode || !code) return;

    try {
      setIsLoadingAction(true);
      const clean = code.trim().toUpperCase();
      const response = await apiClient.post("/checkDuplicateCurr", {
        json_data: { currCode: clean },
      });

      const sqlRow = response?.data?.data?.[0] || response?.data;
      const rawJsonString = sqlRow?.result || Object.values(sqlRow || {})[0];
      const parsedData = typeof rawJsonString === 'string' ? JSON.parse(rawJsonString) : rawJsonString;

      if (parsedData?.result === "1" || sqlRow?.result === "1") {
        updateForm({ currCode: "" });
        setIsLoadingAction(false);
        return useSwalErrorAlertAPI(
          `Duplicate Code: ${clean}`,
          `This code is already in use. Please enter a unique code.`
        );
      }
    } catch (error) {
      console.error("Duplicate Check Error:", error);
    } finally {
      setIsLoadingAction(false);
    }
  };

  const updateForm = (updates) =>
    setFormData((prev) => ({ ...prev, ...updates }));

  // --- TABLE COLUMNS ---
  const columns = useMemo(
    () => [
      {
        key: "__actions",
        label: "Actions",
        render: (row) => (
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => handleEdit(row)}
              className="p-1.5 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white transition-colors"
              title="Edit"
            >
              <FontAwesomeIcon icon={faEdit} />
            </button>
            <button
              onClick={() => handleDelete(row)}
              className="p-1.5 rounded-md bg-red-100 text-red-700 hover:bg-red-600 hover:text-white transition-colors"
              title="Delete"
            >
              <FontAwesomeIcon icon={faTrashAlt} />
            </button>
          </div>
        ),
      },
      { key: "currCode", label: "Currency Code", sortable: true },
      { key: "currName", label: "Currency Name", sortable: true },
    ],
    []
  );

  // --- EFFECTS ---
  useEffect(() => {
    const handleKey = (e) => {
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        if (isEditing && !isSaving && !isLoadingAction) handleSave();
      }
    };
    const handleClick = (e) => {
      if (guideRef.current && !guideRef.current.contains(e.target))
        setOpenGuide(false);
    };
    window.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [formData, isEditing, isSaving, isLoadingAction]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await useFieldLenghtCheck("CURR_REF"); 
        if (mounted) setTblFieldArray(res || []);
      } catch (err) {
        console.error("Failed to fetch field lengths:", err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const getMax = (col) => useGetFieldLength(tblFieldArray, col) || 100;

  return (
    <div className="global-ref-main-div-ui">
      {/* Loading Overlay */}
      {(isListLoading || isSaving || isDeleting || isLoadingAction) && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-blue-100 dark:border-gray-700 rounded-full"></div>
              <div className="absolute top-0 left-0 w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <span className="text-sm font-semibold animate-pulse">
              {isSaving ? "Saving..." : isDeleting ? "Deleting..." : "Loading..."}
            </span>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="global-ref-header-ui">
        <div className="w-full flex flex-col gap-3 md:grid md:grid-cols-3 md:items-center md:gap-0">
          <div className="w-full md:w-auto md:justify-start flex">
            <h1 className="global-ref-headertext-ui w-full md:w-auto truncate text-center md:text-left">
              {reftables[docType] || "Currency Reference"}
            </h1>
          </div>
          <div className="hidden md:flex justify-center w-full" />

          <div className="w-full md:w-auto flex md:justify-end">
            <div className="w-full md:w-auto flex items-center justify-center md:justify-end gap-2 flex-wrap">
              <ButtonBar
                buttons={[
                  {
                    key: "add",
                    label: <span className="hidden sm:inline ml-1">Add</span>,
                    icon: faPlus,
                    onClick: () => {
                      resetForm();
                      setIsEditing(true);
                    },
                    className: "flex items-center justify-center h-8 px-4 text-[11px] font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-all",
                  },
                  {
                    key: "save",
                    label: <span className="hidden sm:inline ml-1">Save</span>,
                    icon: faSave,
                    onClick: handleSave,
                    disabled: !isEditing || isSaving || isLoadingAction,
                    className: `flex items-center justify-center h-8 px-4 text-[11px] font-medium rounded-md transition-all ${!isEditing || isSaving || isLoadingAction ? "bg-blue-500 opacity-50 cursor-not-allowed text-white" : "bg-blue-600 text-white hover:bg-blue-700"}`,
                  },
                  {
                    key: "reset",
                    label: <span className="hidden sm:inline ml-1">Reset</span>,
                    icon: faUndo,
                    onClick: resetForm,
                    className: "flex items-center justify-center h-8 px-4 text-[11px] font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-all",
                  },
                ]}
              />

              <div ref={guideRef} className="relative">
                <button
                  onClick={() => setOpenGuide((v) => !v)}
                  className="bg-blue-600 text-white h-8 px-4 rounded-md flex items-center justify-center gap-1 hover:bg-blue-700 transition-all"
                >
                  <FontAwesomeIcon icon={faInfoCircle} className="text-[12px]" />
                  <span className="hidden sm:inline ml-1 text-[11px] font-medium">Info</span>
                  <FontAwesomeIcon icon={faChevronDown} className="hidden sm:inline text-[10px] opacity-80" />
                </button>

                {isOpenGuide && (
                  <div className="absolute right-0 mt-2 w-52 rounded-md shadow-xl bg-white ring-1 ring-black/10 z-[60] dark:bg-gray-800 overflow-hidden">
                    <button
                      onClick={() => window.open(pdfLink, "_blank")}
                      className="block w-full text-left px-4 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900 border-b border-gray-100 dark:border-gray-700"
                    >
                      <FontAwesomeIcon icon={faFilePdf} className="mr-2 text-red-500" /> PDF Guide
                    </button>
                    <button
                      onClick={() => window.open(videoLink, "_blank")}
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

      {/* MAIN LAYOUT: SIDE-BY-SIDE */}
      <div className="mt-24 flex flex-col xl:flex-row gap-4 px-4 h-[calc(100vh-130px)]">
        
        {/* LEFT PANEL */}
        <div className="w-full xl:w-[400px] flex flex-col gap-4 h-fit">
          {/* Entry Details Card */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-lg">
            <h2 className="text-sm font-bold text-blue-600 mb-6 uppercase tracking-wider border-b pb-2">
              Entry Details
            </h2>

            <div className="space-y-6">
              <FieldRenderer
                label="Currency Code"
                required
                type="text"
                value={formData.currCode}
                disabled={!isEditing || !!selectedCurrCode} // Locked if modifying existing
                onChange={(v) => updateForm({ currCode: (v || "").toUpperCase() })}
                onBlur={(e) => handleCheckDuplicate(e.target.value)}
                maxLength={getMax("CURR_CODE")}
              />
              <FieldRenderer
                label="Currency Name"
                required
                type="text"
                value={formData.currName}
                disabled={!isEditing}
                onChange={(v) => updateForm({ currName: v || "" })}
                maxLength={getMax("CURR_NAME")}
              />
            </div>
          </div>

          {/* Registration Information Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 mb-8">
            <RegistrationInfo layout="stacked" data={registrationInfo} />
          </div>
        </div>

        {/* RIGHT PANEL: Global Reference Table */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-lg overflow-hidden flex flex-col">
          <SearchGlobalReferenceTable
            columns={columns}
            data={accounts}
            isLoading={isListLoading}
            docType="Currency"
            fileName={`Currency_Reference_${new Date().toISOString().split("T")[0]}`}
            title="Currency Reference Records"
            tableSize="Half"
          />
        </div>
      </div>
    </div>
  );
};

export default CurrRef;