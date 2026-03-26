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
import SearchRcRef from "@/NAYSA Cloud/Lookup/SearchRcRef.jsx";

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
  const [isLoading, setIsLoading] = useState(false);
  const [isOpenGuide, setOpenGuide] = useState(false);
  const [tblFieldArray, setTblFieldArray] = useState([]);

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
      queryClient.invalidateQueries(["rcList"]);
      useSwalDeleteRecord(
        "Deleted!",
        "Record deleted successfully.",
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
          ...form,
          action: selectedRcCode ? "EDIT" : "ADD",
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
      // setIsLoading(true);
      const payload = {
        json_data: {
          rcCode: row.rcCode,
        },
      };

      // 1. Check if used in other tables via SPROC
      const response = await apiClient.post("/checkInUsedRCMast", payload);
      const sqlRow = response?.data?.data?.[0];

      const rawJsonString = sqlRow?.result || Object.values(sqlRow || {})[0];
      const parsedData = JSON.parse(rawJsonString || '{"result":"0"}');

      if (parsedData.result === "1") {
        setIsLoading(false);
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
        deleteRcMast(payload);
      }
    } catch (error) {
      useSwalErrorAlertAPI("System Error", error);
    } finally {
      setIsLoading(false);
    }
  };

  // REMOVED setIsLoading changes here to prevent loading overlay on blur
  const handleCheckDuplicate = async (code) => {
    if (isEditing && selectedRcCode) return;
    if (!code) return;

    try {
      const payload = { rcCode: code };
      const response = await apiClient.post("/checkDuplicateRCMast", {
        json_data: payload,
      });

      const sqlRow = response?.data?.data?.[0];
      const rawJsonString = sqlRow?.result;
      const parsedData = JSON.parse(rawJsonString || '{"result":"0"}');

      if (parsedData.result === "1") {
        updateForm({ rcCode: "" });
        return useSwalErrorAlert(
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
      { key: "rcCode", label: "RC Code", sortable: true },
      { key: "rcName", label: "RC Name", sortable: true },
      {
        key: "rcTypeCode",
        label: "RC Type",
        sortable: true,
        render: (row) => (
          <div className="whitespace-nowrap">
            {row.rcTypeCode
              ? `(${row.rcTypeCode}) - ${row.rcTypeName || ""}`
              : ""}
          </div>
        ),
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
      {/* Updated Modern Overlay */}
      {(isDropdownLoading ||
        isListLoading ||
        isSaving ||
        isDeleting ||
        isLoading) && (
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
          <div className="w-full md:w-auto md:justify-start flex">
            <h1 className="global-ref-headertext-ui w-full md:w-auto truncate text-center md:text-left">
              {reftables[docType] || "RC Master Data"}
            </h1>
          </div>

          {/* Middle: Tabs centered */}
          <div className="hidden md:flex justify-center items-end gap-4 h-full w-full">
            <button
              onClick={() => setActiveTab("rcMast")}
              className={`text-[11px] font-bold pb-1 border-b-2 transition-all ${
                activeTab === "rcMast"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              RC Master Data
            </button>
            <button
              onClick={() => setActiveTab("rctype")}
              className={`text-[11px] font-bold pb-1 border-b-2 transition-all ${
                activeTab === "rctype"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              RC Type
            </button>
          </div>

          {/* Right: Buttons + Info */}
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
                      setActiveTab("rcMast"); // Jump back to data entry if adding
                    },
                    className:
                      "flex items-center justify-center h-8 px-4 text-[11px] font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-all",
                  },
                  {
                    key: "save",
                    label: <span className="hidden sm:inline ml-1">Save</span>,
                    icon: faSave,
                    onClick: () => handleSave(),
                    disabled: !isEditing || isSaving || activeTab !== "rcMast",
                    className: `flex items-center justify-center h-8 px-4 text-[11px] font-medium rounded-md transition-all ${
                      !isEditing || isSaving || activeTab !== "rcMast"
                        ? "bg-blue-500 opacity-50 cursor-not-allowed text-white"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`,
                  },
                  {
                    key: "reset",
                    label: <span className="hidden sm:inline ml-1">Reset</span>,
                    icon: faUndo,
                    onClick: resetForm,
                    className:
                      "flex items-center justify-center h-8 px-4 text-[11px] font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-all",
                  },
                ]}
              />
              <div ref={guideRef} className="relative">
                <button
                  onClick={() => setOpenGuide((v) => !v)}
                  className="bg-blue-600 text-white h-8 px-4 rounded-md flex items-center justify-center gap-1 hover:bg-blue-700 transition-all"
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

          {/* Mobile Only: Tabs centered (Shown below title/buttons on small screens) */}
          <div className="flex md:hidden justify-center items-end gap-4 w-full mt-2">
            <button
              onClick={() => setActiveTab("rcMast")}
              className={`text-[11px] font-bold pb-1 border-b-2 transition-all ${
                activeTab === "rcMast"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              RC Master Data
            </button>
            <button
              onClick={() => setActiveTab("rctype")}
              className={`text-[11px] font-bold pb-1 border-b-2 transition-all ${
                activeTab === "rctype"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              RC Type
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area (Top & Bottom Layout) */}
      {activeTab === "rcMast" && (
        <div className="mt-28 md:mt-24 px-4 flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Header Data Entry Groups (Top Left) */}
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
              </div>
            </div>

            {/* Registration Info (Top Right) */}
            <div className="w-full lg:w-[320px] shrink-0 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <RegistrationInfo layout="stacked" data={registrationInfo} />
            </div>
          </div>

          {/* Data Table (Bottom) */}
          <div className="global-tran-table-main-div-ui bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <SearchGlobalReferenceTable
              docType="RC Master Data"
              columns={columns}
              data={accounts}
              isLoading={isListLoading}
              onRowDoubleClick={handleEdit}
              itemsPerPage={50}
              title="RC Master Records"
              fileName={`RCMast_Reference_${new Date().toISOString().split("T")[0]}`}
            />
          </div>
        </div>
      )}

      {/* Embedded Component for RC Type Tab */}
      {activeTab === "rctype" && (
        <div className="mt-28 md:mt-24 px-4">
          <RCType
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            embedded={false}
          />
        </div>
      )}

      {/* RC Type Lookup Modal */}
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
