import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";
import { useAuth } from "@/NAYSA Cloud/Authentication/AuthContext.jsx";

// Import Lookup Modals
import SearchGlobalReferenceTable from "@/NAYSA Cloud/Lookup/SearchGlobalReferenceTable";
import SearchCOAMast from "@/NAYSA Cloud/Lookup/SearchCOAMast";

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
import { useTopDocDropDown } from "@/NAYSA Cloud/Global/top1RefTable";
import {
  useSwalErrorAlert,
  useSwalSuccessAlert,
  useSwalErrorAlertAPI,
  useSwalDeleteConfirm,
  useSwalDeleteRecord,
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
  vatCode: "",
  vatName: "",
  vatType: "",
  vatClass: "",
  vatRate: "0.00",
  vatCategory: "",
  acctCode: "",
  acctName: "",
  tblFieldArray: [],
};

const INITIAL_REG = {
  registeredBy: "",
  registeredDate: "",
  lastUpdatedBy: "",
  lastUpdatedDate: "",
};

const VATRef = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const docType = "VATRef";
  const guideRef = useRef(null);
  const pdfLink = reftablesPDFGuide[docType];
  const videoLink = reftablesVideoGuide[docType];

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [registrationInfo, setRegistrationInfo] = useState(INITIAL_REG);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedVatCode, setSelectedAcctCode] = useState(null);
  const [modals, setModals] = useState({ coaClass: false, guide: false });
  const [isOpenGuide, setOpenGuide] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tblFieldArray, setTblFieldArray] = useState([]);

  const [vatAcct, setvatAcct] = useState(null);

  // const [isAccountModalOpen, setAccountModalOpen] = useState(false);

  const toggleModal = (name, isOpen) =>
    setModals((prev) => ({ ...prev, [name]: isOpen }));

  // --- TANSTACK QUERY: Fetch Dropdowns & List ---
  const { data: dropdowns, isLoading: isDropdownLoading } = useQuery({
    queryKey: ["vatDropdowns"],
    queryFn: async () => {
      const [cat, typ, cls] = await Promise.all([
        useTopDocDropDown("VATREF", "VAT_CATEGORY"),
        useTopDocDropDown("VATREF", "VAT_TYPE"),
        useTopDocDropDown("VATREF", "VAT_CLASS"),
      ]);
      return { cat, typ, cls };
    },
  });

  const { data: accounts = [], isLoading: isListLoading } = useQuery({
    queryKey: ["vatList"],
    queryFn: async () => {
      const { data } = await apiClient.get("/vat");
      const raw = data?.data?.[0]?.result || data?.result;
      return raw ? JSON.parse(raw) : [];
    },
  });

  // --- Updated Save Mutation ---
  const { mutate: saveVAT, isLoading: isSaving } = useMutation({
    mutationFn: async (payload) => await apiClient.post("/upsertVat", payload),

    onSuccess: (response) => {
      // 1) SPROC row style (errorcount/errormsg)
      const sqlRow = response?.data?.data?.[0];
      if (sqlRow?.errorcount > 0) {
        useSwalErrorAlert("Error", sqlRow?.errormsg || "Failed to save VAT .");
        return; // Removed resetForm here so user doesn't lose data on simple validation error
      }

      // 2) API status style
      const status = response?.data?.status ?? response?.data?.data?.status;
      const success =
        response?.data?.success || status === "success" || !status;

      if (!success) {
        useSwalErrorAlert(
          "Error",
          response?.data?.message ||
            response?.data?.data?.message ||
            "An error occurred while saving the VAT record.",
        );
        return;
      }

      // ✅ Success path
      queryClient.invalidateQueries({ queryKey: ["vatList"] });
      useSwalSuccessAlert("Success!", "VAT Code Saved Successfully!");
      resetForm();
    },

    onError: (error) => {
      useSwalErrorAlertAPI(
        "System Error",
        error?.response?.status
          ? `HTTP Error ${error.response.status}: ${error.response.statusText}`
          : error?.message || String(error),
      );
    },
  });

  // --- UPDATED ACTIONS ---
  const handleSave = () => {
    // 1. Basic Validations (Matching Cutoff style)
    if (!formData.vatCode || !formData.vatName || !formData.acctCode) {
      return useSwalErrorAlert(
        "Validation Error",
        "Please fill in all required fields.",
      );
    }

    // 2. VAT Rate specific validation
    if (parseFloat(formData.vatRate) < 0) {
      return useSwalErrorAlert("Invalid Rate", "VAT Rate cannot be negative.");
    }

    const payload = {
      json_data: JSON.stringify({
        json_data: {
          ...formData,
          vatRate: formData.vatRate || "0.00", // Ensure no nulls are sent
          action: selectedVatCode ? "EDIT" : "ADD",
          userCode: user?.USER_CODE || "ADMIN",
        },
      }),
    };
    saveVAT(payload);
  };

  // --- MUTATION: UPSERT ---

  const resetForm = () => {
    setFormData(INITIAL_FORM);
    setRegistrationInfo(INITIAL_REG);
    setSelectedAcctCode(null);
    setIsEditing(false);
  };

  const handleEdit = (row) => {
    const classNameFromRow = row.className;

    const classNameFromDropdown =
      dropdowns?.cls?.find((d) => d.DROPDOWN_CODE === row.classCode)
        ?.DROPDOWN_NAME || "";

    setSelectedAcctCode(row.vatCode);

    setFormData({
      ...INITIAL_FORM,
      ...row,
      classCode: row.classCode,
      acctName: row.acctName,
      className: classNameFromRow || classNameFromDropdown, // ✅ important
      vatRate: row.vatRate !== undefined ? row.vatRate : 0,
    });

    setRegistrationInfo({
      registeredBy: row.registeredBy,
      registeredDate: row.registeredDate,
      lastUpdatedBy: row.lastUpdatedBy,
      lastUpdatedDate: row.lastUpdatedDate,
    });

    console.log("Edit Row:", row);
    setIsEditing(true);
  };

  const { mutate: deleteVat, isLoading: isDeleting } = useMutation({
    mutationFn: async (payload) => await apiClient.post("/deleteVat", payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries(["vatList"]);
      useSwalDeleteRecord(
        "Deleted!",
        "The VAT has been removed from the system.",
      );
      resetForm();
    },
    onError: (error) => useSwalErrorAlertAPI("Delete Error", error),
  });

  const handleDelete = async (row) => {
    try {
      setIsLoading(true); // Ensure you have a general loading state or use the mutation's state
      const payload = {
        json_data: {
          vatCode: row.vatCode,
        },
      };

      // 1. Check if used in other tables via SPROC
      const response = await apiClient.post("/checkInUsedVat", payload);
      const sqlRow = response?.data?.data?.[0];
      const rawJsonString = sqlRow?.result || Object.values(sqlRow || {})[0];
      const parsedData = JSON.parse(rawJsonString || '{"result":"0"}');

      if (parsedData.result === "1") {
        setIsLoading(false);
        return useSwalErrorAlertAPI(
          `Cannot Delete VAT Code: ${row.vatCode}`,
          `Code was already used.`,
        );
      }

      // 2. Confirmations
      const confirm = await useSwalDeleteConfirm(
        "Confirm Delete",
        `Are you sure you want to delete Code: ${row.vatCode}?`,
      );

      if (confirm.isConfirmed) {
        deleteVat(payload);
      }
    } catch (error) {
      useSwalErrorAlertAPI("System Error", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- VALIDATION: Check for Duplicate Code ---
  const handleCheckDuplicate = async (code) => {
    if (selectedVatCode) return;
    if (!code) return;

    try {
      setIsLoading(true);
      const payload = { json_data: { vatCode: code } };
      const response = await apiClient.post("/checkDuplicateVat", payload);

      const sqlRow = response?.data?.data?.[0];
      const rawJsonString = sqlRow?.result || Object.values(sqlRow || {})[0];
      const parsedData = JSON.parse(rawJsonString || '{"result":"0"}');

      if (parsedData.result === "1") {
        updateForm({ vatCode: "" }); // Clear the code on duplicate
        setIsLoading(false);
        return useSwalErrorAlert(
          "Duplicate VAT Code",
          `The VAT Code ${code} is already in use. Please enter a unique code.`,
        );
      }
    } catch (error) {
      console.error("Duplicate Check Error:", error);
    } finally {
      setIsLoading(false);
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
            {/* Updated Edit Button matching CutoffRef style */}
            <button
              onClick={() => handleEdit(row)}
              className="p-1.5 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white transition-colors"
              title="Edit"
            >
              <FontAwesomeIcon icon={faEdit} />
            </button>

            {/* Updated Delete Button matching CutoffRef style */}
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
      { key: "vatCode", label: "VAT Code", sortable: true },
      { key: "vatName", label: "VAT Name", sortable: true },
      {
        key: "vatType",
        label: "VAT Type",
        sortable: true,
        render: (row) => {
          const match = dropdowns?.typ?.find(
            (d) => d.DROPDOWN_CODE === row.vatType,
          );
          return match ? match.DROPDOWN_NAME : row.vatType;
        },
      },
      {
        key: "vatClass",
        label: "VAT Classification",
        sortable: true,
        render: (row) => {
          const match = dropdowns?.cls?.find(
            (d) => d.DROPDOWN_CODE === row.vatClass,
          );
          return match ? match.DROPDOWN_NAME : row.vatClass;
        },
      },
      {
        key: "vatRate",
        label: "VAT Rate (%)",
        sortable: true,
        className: "text-right font-mono",
        render: (row) => {
          const rate = parseFloat(row.vatRate || 0);
          return `${rate.toFixed(2)}%`;
        },
      },
      {
        key: "vatCategory",
        label: "VAT Category",
        sortable: true,
        render: (row) => {
          const match = dropdowns?.cat?.find(
            (d) => d.DROPDOWN_CODE === row.vatCategory,
          );
          return match ? match.DROPDOWN_NAME : row.vatCategory;
        },
      },
      { key: "acctCode", label: "Account Code", sortable: true },
      { key: "acctName", label: "Account Name", sortable: true },
    ],
    [dropdowns, handleEdit, handleDelete],
  );

  useEffect(() => {
    const handleKey = (e) => {
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        handleSave();
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
  }, [formData]);

  // load max length metadata once
  useEffect(() => {
    let mounted = true;

    (async () => {
      const res = await useFieldLenghtCheck("VAT_REF");
      if (mounted) setTblFieldArray(res || []);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const getMax = (col) => useGetFieldLength(tblFieldArray, col);

  console.log("Current VAT Type:", formData.vatType);
  return (
    <div className="global-ref-main-div-ui">
      {(isDropdownLoading || isListLoading || isSaving || isDeleting) && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-blue-100 dark:border-gray-700 rounded-full"></div>
              <div className="absolute top-0 left-0 w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <span className="text-sm font-semibold animate-pulse">
              {isSaving
                ? "Saving..."
                : isDeleting
                  ? "Deleting..."
                  : "Loading..."}
            </span>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="global-ref-header-ui">
        <div className="w-full flex flex-col gap-3 md:grid md:grid-cols-3 md:items-center md:gap-0">
          {/* 1) Title */}
          <div className="w-full md:w-auto md:justify-start flex">
            <h1 className="global-ref-headertext-ui w-full md:w-auto truncate text-center md:text-left">
              {reftables[docType] || "VAT Refrence Table"}
            </h1>
          </div>

          {/* Middle: spacer (no tabs) */}
          <div className="hidden md:flex justify-center w-full" />

          {/* 3) Buttons + Info */}
          <div className="w-full md:w-auto flex md:justify-end">
            <div className="w-full md:w-auto flex items-center justify-center md:justify-end gap-2 flex-wrap">
              {/* ButtonBar: allow wrapping on mobile */}
              <div className="flex flex-wrap justify-center md:justify-end gap-2">
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
                      className:
                        "flex items-center justify-center h-8 w-8 sm:w-auto sm:h-8 sm:px-4 text-[11px] font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-all",
                    },
                    {
                      key: "save",
                      label: (
                        <span className="hidden sm:inline ml-1">Save</span>
                      ),
                      icon: faSave,
                      onClick: handleSave,
                      disabled: !isEditing || isSaving,
                      className: `flex items-center justify-center h-8 w-8 sm:w-auto sm:h-8 sm:px-4 text-[11px] font-medium rounded-md transition-all
                        ${
                          !isEditing || isSaving
                            ? "bg-blue-500 opacity-50 cursor-not-allowed text-white"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`,
                    },
                    {
                      key: "reset",
                      label: (
                        <span className="hidden sm:inline ml-1">Reset</span>
                      ),
                      icon: faUndo,
                      onClick: resetForm,
                      className:
                        "flex items-center justify-center h-8 w-8 sm:w-auto sm:h-8 sm:px-4 text-[11px] font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-all",
                    },
                  ]}
                />
              </div>

              {/* Info Dropdown */}
              <div ref={guideRef} className="relative">
                <button
                  onClick={() => setOpenGuide((v) => !v)}
                  className="bg-blue-600 text-white h-8 w-8 sm:w-auto sm:h-8 sm:px-4 rounded-md flex items-center justify-center gap-1 hover:bg-blue-700 transition-all"
                >
                  <FontAwesomeIcon
                    icon={faInfoCircle}
                    className="text-[12px]"
                  />
                  <span className="hidden sm:inline ml-1 text-[11px] font-medium">
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
        </div>
      </div>

      {/* Main Content */}
      <div className="mt-24 flex flex-col lg:flex-row lg:items-stretch gap-2">
        {/* LEFT DIV: Main Form Fields (Takes 75% of width on large screens) */}
        <div className="flex-1 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-lg grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {/* Sub-Column 1 (Internal Grid) */}
          <div className="space-y-6">
            <FieldRenderer
              label="VAT Code"
              required
              type="text"
              value={formData.vatCode}
              disabled={!isEditing || (isEditing && selectedVatCode)}
              onChange={(v) => updateForm({ vatCode: v })}
              onBlur={(e) => handleCheckDuplicate(e.target.value)}
              maxLength={getMax("VAT_CODE")}
            />

            <FieldRenderer
              label="VAT Name"
              required
              type="text"
              value={formData.vatName}
              disabled={!isEditing}
              onChange={(v) => updateForm({ vatName: v })}
              maxLength={getMax("VAT_NAME")}
            />

            <FieldRenderer
              label="VAT Type"
              required
              type="select"
              value={formData.vatType}
              disabled={!isEditing}
              options={dropdowns?.typ?.map((d) => ({
                value: d.DROPDOWN_CODE,
                label: d.DROPDOWN_NAME,
              }))}
              onChange={(v) => updateForm({ vatType: v })}
            />
            <FieldRenderer
              label="VAT Classification"
              required
              type="select"
              value={formData.vatClass}
              disabled={!isEditing}
              options={dropdowns?.cls?.map((d) => ({
                value: d.DROPDOWN_CODE,
                label: d.DROPDOWN_NAME,
              }))}
              onChange={(v) => updateForm({ vatClass: v })}
            />
          </div>

          {/* Sub-Column 2 (Internal Grid) */}
          <div className="space-y-6">
            <FieldRenderer
              label="VAT Rate (%)"
              type="number"
              value={formData.vatRate}
              disabled={!isEditing}
              placeholder="0.00"
              step="0.01"
              onChange={(v) => {
                // Prevent negative rates immediately during typing
                const numericValue = Math.max(0, parseFloat(v) || 0);
                // If user is still typing (e.g., just a dot), we allow the string 'v'
                // but we'll clean it up on blur
                updateForm({ vatRate: v });
              }}
              onBlur={(e) => {
                // Force formatting and ensure no negatives/nulls on exit
                const val = parseFloat(e.target.value || 0);
                const sanitized = Math.max(0, val).toFixed(2);
                updateForm({ vatRate: sanitized });
              }}
            />

            <FieldRenderer
              label="VAT Category"
              required
              type="select"
              value={formData.vatCategory}
              disabled={!isEditing}
              options={dropdowns?.cat?.map((d) => ({
                value: d.DROPDOWN_CODE,
                label: d.DROPDOWN_NAME,
              }))}
              onChange={(v) => updateForm({ vatCategory: v })}
            />

            <FieldRenderer
              label="Account Code"
              type="lookup"
              value={
                formData.acctCode
                  ? `(${formData.acctCode}) - ${formData.acctName}`
                  : ""
              }
              onLookup={() => {
                setvatAcct("acctCode");
                toggleModal("coa", true);
              }}
              disabled={!isEditing}
              required
              readOnly
            />
          </div>
        </div>

        {/* RIGHT: Registration Info */}
        <div className="w-full lg:w-[320px]">
          <RegistrationInfo layout="stacked" data={registrationInfo} />
        </div>
      </div>

      {/* Table Section */}
      <div className="global-tran-table-main-div-ui mt-4">
        <SearchGlobalReferenceTable
          docType={docType}
          columns={columns}
          data={accounts}
          isLoading={isListLoading}
          onRowDoubleClick={handleEdit}
          itemsPerPage={50}
        />
      </div>

      <SearchCOAMast
        isOpen={modals.coa}
        customParam={
          formData.vatType === "I" ? "VATInputAcct" : "VATOutputAcct"
        }
        onClose={(v) => {
          toggleModal("coa", false);
          if (v && vatAcct) {
            updateForm({ acctCode: v.acctCode, acctName: v.acctName });
          }
        }}
      />
    </div>
  );
};

export default VATRef;
