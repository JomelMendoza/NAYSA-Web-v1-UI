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

import RCType from "@/NAYSA Cloud/Reference File/RCRef.jsx";

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
} from "@/NAYSA Cloud/Global/behavior";
import {
  useFieldLenghtCheck,
  useGetFieldLength,
} from "@/NAYSA Cloud/Global/procedure";

import SearchRcRef from "@/NAYSA Cloud/Lookup/SearchRcRef.jsx";

// UI Helpers
import FieldRenderer from "@/NAYSA Cloud/Global/FieldRenderer";
import ButtonBar from "@/NAYSA Cloud/Global/ButtonBar";
import RegistrationInfo from "@/NAYSA Cloud/Global/RegistrationInfo.jsx";

const INITIAL_FORM = {
  rcCode: "",
  rcName: "",
  rcTypeCode: "",
  rcTypeName: "",
  rcGroup: "N",
  groupCode: "",
  active: "Y",
};

const INITIAL_REG = {
  registeredBy: "",
  registeredDate: "",
  lastUpdatedBy: "",
  lastUpdatedDate: "",
};

const RCMast = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const docType = "RCMast";
  const guideRef = useRef(null);
  const pdfLink = reftablesPDFGuide[docType];
  const videoLink = reftablesVideoGuide[docType];

  const [form, setForm] = useState(INITIAL_FORM);
  const [isRcTypeModalOpen, setRcTypeModalOpen] = useState(false);
  const [registrationInfo, setRegistrationInfo] = useState(INITIAL_REG);
  const [modals, setModals] = useState({ rcType: false, guide: false });
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRcCode, setSelectedRcCode] = useState(null);
  const [activeTab, setActiveTab] = useState("rcMast");
  const [isLoading, setIsLoading] = useState(false); // Add this line
  const [isOpenGuide, setOpenGuide] = useState(false);
  const [tblFieldArray, setTblFieldArray] = useState([]);
  const setField = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const [vatAcct, setRcType] = useState(null);

  const toggleModal = (name, isOpen) =>
    setModals((prev) => ({ ...prev, [name]: isOpen }));

  // --- FETCH DROPDOWNS ---
  const { data: dropdowns, isLoading: isDropdownLoading } = useQuery({
    queryKey: ["rcDropdowns"],
    queryFn: async () => {
      const [typ, grp] = await Promise.all([
        useTopDocDropDown("RCMAST", "RC_TYPE"),
        useTopDocDropDown("RCMAST", "RC_GROUP"),
      ]);
      return { typ, grp };
    },
    initialData: { typ: [], grp: [] },
  });

  // --- FETCH TABLE DATA ---
  const { data: accounts = [], isLoading: isListLoading } = useQuery({
    queryKey: ["rcList"],
    queryFn: async () => {
      const { data } = await apiClient.get("/rcMast");
      const raw = data?.data?.[0]?.result || data?.result;
      return raw ? JSON.parse(raw) : [];
    },
  });

  // --- MEMOIZED GROUP OPTIONS ---
  // Place it here, so it has access to 'accounts'
  const groupOptions = useMemo(() => {
    const filtered = (accounts || [])
      .filter((acc) => acc.rcGroup === "Y")
      .map((acc) => ({
        value: acc.rcCode,
        label: `(${acc.rcCode}) - ${acc.rcName || ""}`,
      }));

    return [{ value: "N", label: "--- None ---" }, ...filtered];
  }, [accounts]);

  // --- MUTATIONS ---
  const { mutate: saveRC, isLoading: isSaving } = useMutation({
    mutationFn: async (payload) =>
      await apiClient.post("/upsertRCMast", payload),

    onSuccess: (response) => {
      const sqlRow = response?.data?.data?.[0];
      if (sqlRow?.errorcount > 0) {
        useSwalErrorAlert("Error", sqlRow?.errormsg || "Failed to save.");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["rcList"] });
      useSwalSuccessAlert("Success!", "RC saved successfully!");
      resetForm();
    },
    onError: (error) => useSwalErrorAlertAPI("System Error", error),
  });

  const { mutate: deleteRcMast, isLoading: isDeleting } = useMutation({
    mutationFn: async (payload) =>
      await apiClient.post("/deleteRCMast", payload),
    onSuccess: (response) => {
      // FIX: Change 'vatList' to 'rcList' to match your Fetch Query Key
      queryClient.invalidateQueries(["rcList"]);
      useSwalDeleteRecord(
        "Deleted!",
        "The Responsibility Center has been removed.",
      );
      resetForm();
    },
    onError: (error) => useSwalErrorAlertAPI("Delete Error", error),
  });

  // --- ACTIONS ---

  const handleSave = () => {
    const payload = {
      json_data: JSON.stringify({
        json_data: {
          // This nesting matches: JSON_VALUE(@params, '$.json_data.rcCode')
          ...form,
          action: selectedRcCode ? "EDIT" : "ADD", // Fixed variable name
          userCode: user?.USER_CODE || "ADMIN",
        },
      }),
    };
    saveRC(payload);
  };

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setRegistrationInfo(INITIAL_REG);
    setSelectedRcCode(null);
    setIsEditing(false);
  };

  const updateForm = (updates) => setForm((prev) => ({ ...prev, ...updates }));

  const handleEdit = (row) => {
    setSelectedRcCode(row.rcCode);
    setForm({ ...INITIAL_FORM, ...row });
    setRegistrationInfo({
      registeredBy: row.registeredBy,
      registeredDate: row.registeredDate,
      lastUpdatedBy: row.lastUpdatedBy,
      lastUpdatedDate: row.lastUpdatedDate,
    });
    setIsEditing(true);
  };

  const handleDelete = async (row) => {
    try {
      setIsLoading(true);
      const payload = {
        json_data: {
          rcCode: row.rcCode, // Ensure this matches what the SPROC expects
        },
      };

      // 1. Check if used in other tables via SPROC
      const response = await apiClient.post("/checkInUsedRCMast", payload);
      const sqlRow = response?.data?.data?.[0];

      // PHP returns { "result": "1" } inside a result string or object
      const rawJsonString = sqlRow?.result || Object.values(sqlRow || {})[0];
      const parsedData = JSON.parse(rawJsonString || '{"result":"0"}');

      if (parsedData.result === "1") {
        setIsLoading(false);
        // FIX: Changed "VAT Code" to "RC Code" to match your module
        return useSwalErrorAlert(
          "Cannot Delete",
          `RC Code ${row.rcCode} is currently in use by other transactions.`,
        );
      }

      // 2. Confirmations
      const confirm = await useSwalDeleteConfirm(
        "Confirm Delete",
        `Are you sure you want to delete RC Code: ${row.rcCode}?`,
      );

      if (confirm.isConfirmed) {
        deleteRcMast(payload); // FIX: Ensure this calls your mutation
      }
    } catch (error) {
      useSwalErrorAlertAPI("System Error", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckDuplicate = async (code) => {
    if (isEditing && selectedRcCode) return;
    if (!code) return;

    try {
      // Send a flat object because the PHP Controller adds the 'json_data' wrapper
      const payload = { rcCode: code };
      const response = await apiClient.post("/checkDuplicateRCMast", {
        json_data: payload,
      });

      const sqlRow = response?.data?.data?.[0];
      const rawJsonString = sqlRow?.result;
      const parsedData = JSON.parse(rawJsonString || '{"result":"0"}');

      if (parsedData.result === "1") {
        // setIsLoading(false); // Ensure this state exists in your component
        resetForm();
        return useSwalErrorAlert(
          // Use standard alert if API alert expects an error object
          "Duplicate RC Code",
          `The code '${code}' is already in use.`,
        );
      }
    } catch (error) {
      console.error("Duplicate Check Error:", error);
    }
  };

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
            >
              <FontAwesomeIcon icon={faEdit} />
            </button>

            {/* Updated Delete Button */}
            <button
              onClick={() => handleDelete(row)}
              className="p-1.5 rounded-md bg-red-100 text-red-700 hover:bg-red-600 hover:text-white transition-colors"
            >
              <FontAwesomeIcon icon={faTrashAlt} />
            </button>
          </div>
        ),
      },
      { key: "rcCode", label: "RC Code", sortable: true },
      { key: "rcName", label: "RC Name", sortable: true },
      {
        key: "rcTypeCode",
        label: "RC Type",
        sortable: true,
        render: (row) =>
          row.rcTypeCode ? `(${row.rcTypeCode}) - ${row.rcTypeName || ""}` : "",
      },
      {
        key: "rcGroup",
        label: "RC Group",
        render: (row) => (row.rcGroup === "Y" ? "Yes" : "No"),
      },
      { key: "groupCode", label: "Group Code", sortable: true },
      {
        key: "active",
        label: "Active",
        render: (row) => (row.active === "Y" ? "Yes" : "No"),
      },
    ],
    [dropdowns, deleteRcMast],
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
  }, [form]);

  useEffect(() => {
    (async () => {
      const res = await useFieldLenghtCheck("RC_MAST");
      setTblFieldArray(res || []);
    })();
  }, []);

  const getMax = (col) => useGetFieldLength(tblFieldArray, col);

  return (
    <div className="global-ref-main-div-ui">
      {(isDropdownLoading || isListLoading || isSaving) && (
        <div className="fixed inset-0 z-[100] bg-slate-900/30 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-2xl flex flex-col items-center gap-2">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-bold">Processing...</span>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="global-ref-header-ui">
        <div className="w-full flex flex-col gap-3 md:grid md:grid-cols-3 md:items-center">
          {/* Left: Title Only */}
          <div className="flex flex-col">
            <h1 className="global-ref-headertext-ui text-center md:text-left">
              {reftables[docType] || "RC Master Data"}
            </h1>
          </div>

          {/* Middle: Tabs centered */}
          <div className="flex gap-4 justify-center items-end h-full">
            <button
              onClick={() => setActiveTab("rcMast")}
              className={`text-[11px] font-bold pb-1 border-b-2 transition-all ${activeTab === "rcMast" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}
            >
              RC Master Data
            </button>
            <button
              onClick={() => setActiveTab("rctype")}
              className={`text-[11px] font-bold pb-1 border-b-2 transition-all ${activeTab === "rctype" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}
            >
              RC Type
            </button>
          </div>

          {/* Right: Buttons + Info */}
          <div className="flex items-center justify-center md:justify-end gap-2">
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
                    "bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-bold shadow-sm",
                },

                {
                  key: "save",
                  label: <span className="hidden sm:inline ml-1">Save</span>,
                  icon: faSave,
                  onClick: () => handleSave(),
                  disabled: !isEditing || isSaving || activeTab !== "rcMast",
                  className:
                    "bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-bold shadow-sm disabled:opacity-50",
                },

                {
                  key: "reset",
                  label: <span className="hidden sm:inline ml-1">Reset</span>,
                  icon: faUndo,
                  onClick: resetForm,
                  className:
                    "bg-gray-500 text-white px-3 py-1.5 rounded text-xs font-bold shadow-sm",
                },
              ]}
            />
            <div ref={guideRef} className="relative">
              <button
                onClick={() => setOpenGuide((v) => !v)}
                // Added px-3, py-1.5, and text-xs font-bold to match ButtonBar styles
                className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-bold shadow-sm flex items-center justify-center gap-1 hover:bg-blue-700 transition-all h-[30px]"
              >
                <FontAwesomeIcon icon={faInfoCircle} className="text-[12px]" />
                <span className="hidden sm:inline ml-1">Info</span>
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

      {activeTab === "rcMast" && (
        <div className="mt-24 px-4 flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Header Data Entry Groups */}
            <div className="flex-1 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-4">
                <FieldRenderer
                  label="RC Code"
                  required
                  value={form.rcCode}
                  disabled={!isEditing || !!selectedRcCode}
                  onChange={(v) => updateForm({ rcCode: v })}
                  onBlur={(e) => handleCheckDuplicate(e.target.value)}
                  maxLength={getMax("RC_CODE")}
                />

                <FieldRenderer
                  label="RC Name"
                  required
                  value={form.rcName}
                  disabled={!isEditing}
                  onChange={(v) => updateForm({ rcName: v })}
                  maxLength={getMax("RC_NAME")}
                />

                <FieldRenderer
                  label="RC Type"
                  type="lookup"
                  value={
                    form.rcTypeCode
                      ? `${form.rcTypeCode} - ${form.rcTypeName || ""}`
                      : ""
                  }
                  onLookup={() => setRcTypeModalOpen(true)}
                  disabled={!isEditing}
                  readOnly
                />
              </div>

              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <FieldRenderer
                    label="RC Group"
                    type="select"
                    value={form.rcGroup}
                    disabled={!isEditing}
                    options={[
                      { value: "Y", label: "Yes" },
                      { value: "N", label: "No" },
                    ]}
                    onChange={(v) => updateForm({ rcGroup: v })}
                  />

                  <FieldRenderer
                    label="Active"
                    type="select"
                    value={form.active}
                    disabled={!isEditing}
                    options={[
                      { value: "Y", label: "Yes" },
                      { value: "N", label: "No" },
                    ]}
                    onChange={(v) => updateForm({ active: v })}
                  />
                </div>

                {form.rcGroup !== "Y" && (
                  <FieldRenderer
                    label="Group Code"
                    type="select"
                    value={form.groupCode}
                    disabled={!isEditing}
                    options={(accounts || [])
                      .filter(
                        (acc) =>
                          acc.rcGroup === "Y" && acc.rcCode !== form.rcCode,
                      )
                      .map((acc) => ({
                        value: acc.rcCode,
                        label: `(${acc.rcCode}) - ${acc.rcName || "Unnamed Group"}`,
                      }))}
                    onChange={(v) => updateForm({ groupCode: v })}
                  />
                )}
              </div>
            </div>

            {/* Registration Info */}
            <div className="w-full lg:w-[320px] shrink-0">
              <RegistrationInfo layout="stacked" data={registrationInfo} />
            </div>
          </div>

          {/* Data Table */}
          <div className="global-tran-table-main-div-ui">
            <SearchGlobalReferenceTable
              docType={docType}
              columns={columns}
              data={accounts}
              isLoading={isListLoading}
              onRowDoubleClick={handleEdit}
              itemsPerPage={50}
            />
          </div>
        </div>
      )}

      {activeTab === "rctype" && (
        <div className="mt-24 px-4">
          <RCType
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            embedded={false}
          />
        </div>
      )}

      <SearchRcRef
        isOpen={isRcTypeModalOpen}
        onClose={(row) => {
          if (row) {
            updateForm({
              rcTypeCode: row.rcTypeCode || "",
              rcTypeName: row.rcTypeName || "",
            });
          }
          setRcTypeModalOpen(false);
        }}
      />
    </div>
  );
};

export default RCMast;
