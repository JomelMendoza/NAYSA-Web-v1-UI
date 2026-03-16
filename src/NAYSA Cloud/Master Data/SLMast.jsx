import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";
import { useAuth } from "@/NAYSA Cloud/Authentication/AuthContext.jsx";
import SearchGlobalReferenceTable from "@/NAYSA Cloud/Lookup/SearchGlobalReferenceTable";
import FieldRenderer from "@/NAYSA Cloud/Global/FieldRenderer";
import RegistrationInfo from "@/NAYSA Cloud/Global/RegistrationInfo.jsx";
import ButtonBar from "@/NAYSA Cloud/Global/ButtonBar";
import { LoadingSpinner } from "@/NAYSA Cloud/Global/utilities.jsx";

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
  faLink,
} from "@fortawesome/free-solid-svg-icons";

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

const DOC_TYPE = "SLMast";

const INITIAL_SL_FORM = {
  slTypeCode: "",
  slTypeName: "",
  slCode: "",
  slName: "",
  address1: "",
  address2: "",
  address3: "",
  tin: "",
  active: "Y",
};

const INITIAL_SLTYPE_FORM = {
  slTypeCode: "",
  slTypeName: "",
  active: "Y",
  incSu: "N",
  incCu: "N",
};

const INITIAL_REG = {
  registeredBy: "",
  registeredDate: "",
  lastUpdatedBy: "",
  lastUpdatedDate: "",
};

export default function SLMast() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("slmaster");
  const [selectedSLTypeCode, setSelectedSLTypeCode] = useState("");
  const [selectedSLCode, setSelectedSLCode] = useState(null);
  const [selectedSLTypeRow, setSelectedSLTypeRow] = useState(null);

  const [slForm, setSLForm] = useState(INITIAL_SL_FORM);
  const [slTypeForm, setSLTypeForm] = useState(INITIAL_SLTYPE_FORM);
  const [registrationInfo, setRegistrationInfo] = useState(INITIAL_REG);

  const [isEditingSL, setIsEditingSL] = useState(false);
  const [isEditingSLType, setIsEditingSLType] = useState(false);

  const [selectedGLAccounts, setSelectedGLAccounts] = useState([]);
  const [isOpenGuide, setOpenGuide] = useState(false);
  const guideRef = useRef(null);

  const pdfLink = reftablesPDFGuide?.[DOC_TYPE];
  const videoLink = reftablesVideoGuide?.[DOC_TYPE];

  const { data: slTypes = [], isLoading: isLoadingTypes } = useQuery({
    queryKey: ["slTypeList"],
    queryFn: async () => {
      const { data } = await apiClient.get("/slType");
      const raw = data?.data?.[0]?.result || data?.result;
      return raw ? JSON.parse(raw) : [];
    },
  });

  const { data: slMasterList = [], isLoading: isLoadingSL } = useQuery({
    queryKey: ["slMasterList"],
    queryFn: async () => {
      const { data } = await apiClient.get("/sLMast");
      const raw = data?.data?.[0]?.result || data?.result;
      return raw ? JSON.parse(raw) : [];
    },
  });

  const { data: slCoaList = [], isLoading: isLoadingSLCoa } = useQuery({
    queryKey: ["slCoaList"],
    queryFn: async () => {
      const { data } = await apiClient.get("/sLCoa");
      const raw = data?.data?.[0]?.result || data?.result;
      return raw ? JSON.parse(raw) : [];
    },
  });

  const { data: coaList = [], isLoading: isLoadingCOA } = useQuery({
    queryKey: ["coaListForSLMatching"],
    queryFn: async () => {
      const { data } = await apiClient.get("/cOA");
      const raw = data?.data?.[0]?.result || data?.result;
      const parsed = raw ? JSON.parse(raw) : [];
      return parsed.filter((x) => x.reqSL === "Y");
    },
  });

  const selectedSLType = useMemo(() => {
    return slTypes.find((x) => x.slTypeCode === selectedSLTypeCode) || null;
  }, [slTypes, selectedSLTypeCode]);

  const filteredSLMasterList = useMemo(() => {
    if (!selectedSLTypeCode) return [];
    return slMasterList.filter((x) => x.slTypeCode === selectedSLTypeCode);
  }, [slMasterList, selectedSLTypeCode]);

  const matchedGLAccounts = useMemo(() => {
    if (!selectedSLTypeCode) return [];
    return slCoaList.filter((x) => x.slTypeCode === selectedSLTypeCode);
  }, [slCoaList, selectedSLTypeCode]);

  useEffect(() => {
    setSelectedGLAccounts(matchedGLAccounts.map((x) => x.acctCode));
  }, [matchedGLAccounts]);

  const canAddSL = useMemo(() => {
    if (!selectedSLType) return false;
    return selectedSLType.incCu !== "Y" && selectedSLType.incSu !== "Y";
  }, [selectedSLType]);

  const canDeleteSL = useMemo(() => {
    if (!selectedSLType) return false;
    return !(selectedSLType.incCu === "Y" || selectedSLType.incSu === "Y");
  }, [selectedSLType]);

  const updateSLForm = (updates) => setSLForm((prev) => ({ ...prev, ...updates }));
  const updateSLTypeForm = (updates) => setSLTypeForm((prev) => ({ ...prev, ...updates }));

  const resetSLForm = () => {
    setSLForm({
      ...INITIAL_SL_FORM,
      slTypeCode: selectedSLType?.slTypeCode || "",
      slTypeName: selectedSLType?.slTypeName || "",
    });
    setSelectedSLCode(null);
    setIsEditingSL(false);
    setRegistrationInfo(INITIAL_REG);
  };

  const resetSLTypeForm = () => {
    setSLTypeForm(INITIAL_SLTYPE_FORM);
    setSelectedSLTypeRow(null);
    setIsEditingSLType(false);
  };

  const handleEditSL = (row) => {
    setSelectedSLCode(row.slCode);
    setSLForm({
      slTypeCode: row.slTypeCode || "",
      slTypeName: row.slTypeName || "",
      slCode: row.slCode || "",
      slName: row.slName || "",
      address1: row.address1 || "",
      address2: row.address2 || "",
      address3: row.address3 || "",
      tin: row.tin || "",
      active: row.active || "Y",
    });
    setRegistrationInfo({
      registeredBy: row.registeredBy || "",
      registeredDate: row.registeredDate || "",
      lastUpdatedBy: row.lastUpdatedBy || "",
      lastUpdatedDate: row.lastUpdatedDate || "",
    });
    setIsEditingSL(true);
  };

  const handleEditSLType = (row) => {
    setSelectedSLTypeRow(row);
    setSLTypeForm({
      slTypeCode: row.slTypeCode || "",
      slTypeName: row.slTypeName || "",
      active: row.active || "Y",
      incSu: row.incSu || "N",
      incCu: row.incCu || "N",
    });
    setSelectedSLTypeCode(row.slTypeCode || "");
    setIsEditingSLType(true);
  };

  const { mutate: saveSL, isLoading: isSavingSL } = useMutation({
    mutationFn: async (payload) => await apiClient.post("/upsertSLMast", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slMasterList"] });
      useSwalSuccessAlert("Success!", "SL Master saved successfully.");
      resetSLForm();
    },
    onError: (error) => useSwalErrorAlertAPI("Save Error", error),
  });

  const { mutate: deleteSL, isLoading: isDeletingSL } = useMutation({
    mutationFn: async (payload) => await apiClient.post("/deleteSLMast", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slMasterList"] });
      useSwalDeleteRecord("Deleted!", "SL Master deleted successfully.");
      resetSLForm();
    },
    onError: (error) => useSwalErrorAlertAPI("Delete Error", error),
  });

  const { mutate: saveSLType, isLoading: isSavingSLType } = useMutation({
    mutationFn: async (payload) => await apiClient.post("/upsertSLType", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slTypeList"] });
      useSwalSuccessAlert("Success!", "SL Type saved successfully.");
      resetSLTypeForm();
    },
    onError: (error) => useSwalErrorAlertAPI("Save Error", error),
  });

  const { mutate: deleteSLType, isLoading: isDeletingSLType } = useMutation({
    mutationFn: async (payload) => await apiClient.post("/deleteSLType", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slTypeList"] });
      queryClient.invalidateQueries({ queryKey: ["slCoaList"] });
      useSwalDeleteRecord("Deleted!", "SL Type deleted successfully.");
      resetSLTypeForm();
    },
    onError: (error) => useSwalErrorAlertAPI("Delete Error", error),
  });

  const { mutate: saveMatching, isLoading: isSavingMatching } = useMutation({
    mutationFn: async (payload) => await apiClient.post("/upsertSLTypeGLMatching", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slCoaList"] });
      useSwalSuccessAlert("Success!", "SL-GL Matching saved successfully.");
    },
    onError: (error) => useSwalErrorAlertAPI("Save Error", error),
  });

  const handleSaveSL = () => {
    if (!slForm.slTypeCode) return useSwalErrorAlert("Validation Error", "SL Type is required.");
    if (!slForm.slCode) return useSwalErrorAlert("Validation Error", "SL Code is required.");
    if (!slForm.slName) return useSwalErrorAlert("Validation Error", "SL Name is required.");

    const payload = {
      json_data: JSON.stringify({
        json_data: {
          ...slForm,
          action: selectedSLCode ? "EDIT" : "ADD",
          userCode: user?.USER_CODE || "ADMIN",
        },
      }),
    };

    saveSL(payload);
  };

  const handleDeleteSL = async (row) => {
    if (!canDeleteSL) {
      return useSwalErrorAlert(
        "Delete Restricted",
        "Delete is not allowed when selected SL Type is tagged in incCu or incSu."
      );
    }

    const confirm = await useSwalDeleteConfirm(
      "Confirm Delete",
      `Are you sure you want to delete SL Code: ${row.slCode}?`
    );

    if (!confirm?.isConfirmed) return;

    deleteSL({
      json_data: {
        slTypeCode: row.slTypeCode,
        slCode: row.slCode,
      },
    });
  };

  const handleSaveSLType = () => {
    if (!slTypeForm.slTypeCode) return useSwalErrorAlert("Validation Error", "SL Type Code is required.");
    if (!slTypeForm.slTypeName) return useSwalErrorAlert("Validation Error", "SL Type Name is required.");

    const payload = {
      json_data: JSON.stringify({
        json_data: {
          ...slTypeForm,
          action: isEditingSLType ? "EDIT" : "ADD",
          userCode: user?.USER_CODE || "ADMIN",
        },
      }),
    };

    saveSLType(payload);
  };

  const handleDeleteSLType = async (row) => {
    const confirm = await useSwalDeleteConfirm(
      "Confirm Delete",
      `Are you sure you want to delete SL Type: ${row.slTypeCode}?`
    );

    if (!confirm?.isConfirmed) return;

    deleteSLType({
      json_data: {
        slTypeCode: row.slTypeCode,
      },
    });
  };

  const handleSaveMatching = () => {
    if (!selectedSLTypeCode) {
      return useSwalErrorAlert("Validation Error", "Please select an SL Type.");
    }

    const payload = {
      json_data: JSON.stringify({
        json_data: {
          slTypeCode: selectedSLTypeCode,
          acctCodes: selectedGLAccounts,
          userCode: user?.USER_CODE || "ADMIN",
        },
      }),
    };

    saveMatching(payload);
  };

  const toggleGLSelection = (acctCode) => {
    setSelectedGLAccounts((prev) =>
      prev.includes(acctCode)
        ? prev.filter((x) => x !== acctCode)
        : [...prev, acctCode]
    );
  };

  const slMasterColumns = useMemo(
    () => [
      {
        key: "__actions",
        label: "Actions",
        sortable: false,
        render: (row) => (
          <div className="flex gap-1 justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditSL(row);
              }}
              disabled={!canDeleteSL}
              className={`py-1 px-2 rounded-md transition-colors ${
                canDeleteSL
                  ? "bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
              title="Edit"
            >
              <FontAwesomeIcon icon={faEdit} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteSL(row);
              }}
              disabled={!canDeleteSL}
              className={`py-1 px-2 rounded-md transition-colors ${
                canDeleteSL
                  ? "bg-red-100 text-red-600 hover:bg-red-600 hover:text-white"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
              title="Delete"
            >
              <FontAwesomeIcon icon={faTrashAlt} />
            </button>
          </div>
        ),
      },
      { key: "slTypeCode", label: "SL Type Code", sortable: true },
      { key: "slTypeName", label: "SL Type Name", sortable: true },
      { key: "slCode", label: "SL Code", sortable: true },
      { key: "slName", label: "SL Name", sortable: true },
      { key: "address1", label: "Address 1", sortable: true },
      { key: "address2", label: "Address 2", sortable: true },
      { key: "address3", label: "Address 3", sortable: true },
      { key: "tin", label: "TIN", sortable: true },
      {
        key: "active",
        label: "Active",
        sortable: true,
        render: (row) => (row.active === "Y" ? "Y" : "N"),
      },
    ],
    [canDeleteSL]
  );

  const slTypeColumns = useMemo(
    () => [
      {
        key: "__actions",
        label: "Actions",
        sortable: false,
        render: (row) => (
          <div className="flex gap-1 justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditSLType(row);
              }}
              className="py-1 px-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-600 hover:text-white transition-colors"
              title="Edit"
            >
              <FontAwesomeIcon icon={faEdit} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteSLType(row);
              }}
              className="py-1 px-2 bg-red-100 text-red-600 rounded-md hover:bg-red-600 hover:text-white transition-colors"
              title="Delete"
            >
              <FontAwesomeIcon icon={faTrashAlt} />
            </button>
          </div>
        ),
      },
      { key: "slTypeCode", label: "SL Type Code", sortable: true },
      { key: "slTypeName", label: "SL Type Name", sortable: true },
      { key: "active", label: "Active", sortable: true },
      { key: "incSu", label: "Payee", sortable: true },
      { key: "incCu", label: "Customer", sortable: true },
    ],
    []
  );

  const slCoaColumns = useMemo(
    () => [
      {
        key: "__check",
        label: "Select",
        sortable: false,
        render: (row) => (
          <div className="flex justify-center">
            <input
              type="checkbox"
              checked={selectedGLAccounts.includes(row.acctCode)}
              onChange={() => toggleGLSelection(row.acctCode)}
              className="h-4 w-4 accent-blue-600"
            />
          </div>
        ),
      },
      { key: "acctCode", label: "GL Account Code", sortable: true },
      { key: "acctName", label: "GL Account Name", sortable: true },
    ],
    [selectedGLAccounts]
  );

  useEffect(() => {
    const handleClick = (e) => {
      if (guideRef.current && !guideRef.current.contains(e.target)) {
        setOpenGuide(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="global-ref-main-div-ui">
      {(isLoadingTypes ||
        isLoadingSL ||
        isLoadingSLCoa ||
        isLoadingCOA ||
        isSavingSL ||
        isDeletingSL ||
        isSavingSLType ||
        isDeletingSLType ||
        isSavingMatching) && <LoadingSpinner />}

      <div className="global-ref-header-ui">
        <div className="w-full flex flex-col gap-3 md:grid md:grid-cols-3 md:items-center md:gap-0">
          <div className="w-full md:w-auto flex">
            <h1 className="global-ref-headertext-ui w-full md:w-auto truncate text-center md:text-left">
              SL Master Data
            </h1>
          </div>

          <div className="w-full md:justify-center flex">
            <div className="flex flex-nowrap overflow-x-auto no-scrollbar border-b border-blue-300 dark:border-gray-700">
              {[
                { id: "slmaster", label: "SL Master Data" },
                { id: "sltype", label: "SL Type and SL-GL Matching" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`shrink-0 whitespace-nowrap px-3 py-1 sm:py-2 sm:px-4 text-[10px] sm:text-[13px] font-bold transition-all border-b-2 rounded-md ${
                    activeTab === tab.id
                      ? "border-blue-700 text-blue-700 bg-blue-50/50"
                      : "border-transparent text-gray-500 hover:text-blue-500"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full md:w-auto flex md:justify-end">
            <div className="w-full md:w-auto flex items-center justify-center md:justify-end gap-2 flex-wrap">
              <div ref={guideRef} className="relative">
                <button
                  onClick={() => setOpenGuide((v) => !v)}
                  className="bg-blue-600 text-white h-7 w-14 sm:w-auto sm:h-8 sm:px-4 rounded-md flex items-center justify-center gap-1 hover:bg-blue-700 transition-all"
                >
                  <FontAwesomeIcon icon={faInfoCircle} className="text-[12px]" />
                  <span className="sm:inline ml-1 text-[11px] font-medium">Info</span>
                  <FontAwesomeIcon icon={faChevronDown} className="hidden sm:inline text-[10px] opacity-80" />
                </button>

                {isOpenGuide && (
                  <div className="absolute right-0 mt-2 w-52 rounded-md shadow-xl bg-white ring-1 ring-black/10 z-[60] dark:bg-gray-800 overflow-hidden">
                    <button
                      onClick={() => {
                        if (pdfLink) window.open(pdfLink, "_blank");
                        setOpenGuide(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-xs hover:bg-blue-50"
                    >
                      <FontAwesomeIcon icon={faFilePdf} className="mr-2 text-red-500" />
                      PDF Guide
                    </button>
                    <button
                      onClick={() => {
                        if (videoLink) window.open(videoLink, "_blank");
                        setOpenGuide(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-xs hover:bg-blue-50"
                    >
                      <FontAwesomeIcon icon={faVideo} className="mr-2 text-blue-500" />
                      Video Guide
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {activeTab === "slmaster" && (
        <div className="mt-24 flex flex-col gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border shadow-lg">
            <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
              <div className="w-full lg:w-[320px]">
                <FieldRenderer
                  label="SL Type Filtering"
                  type="select"
                  value={selectedSLTypeCode}
                  options={slTypes.map((x) => ({
                    value: x.slTypeCode,
                    label: `${x.slTypeCode} - ${x.slTypeName}`,
                  }))}
                  onChange={(v) => {
                    const row = slTypes.find((x) => x.slTypeCode === v);
                    setSelectedSLTypeCode(v);
                    setSLForm({
                      ...INITIAL_SL_FORM,
                      slTypeCode: row?.slTypeCode || "",
                      slTypeName: row?.slTypeName || "",
                    });
                    setSelectedSLCode(null);
                    setRegistrationInfo(INITIAL_REG);
                    setIsEditingSL(false);
                  }}
                />
              </div>

              <ButtonBar
                buttons={[
                  {
                    key: "add",
                    label: <span className="sm:inline ml-1">Add</span>,
                    icon: faPlus,
                    onClick: () => {
                      if (!canAddSL) {
                        return useSwalErrorAlert(
                          "Add Restricted",
                          "New SL Code is not allowed when selected SL Type is tagged in incCu or incSu."
                        );
                      }
                      setIsEditingSL(true);
                      setSLForm({
                        ...INITIAL_SL_FORM,
                        slTypeCode: selectedSLType?.slTypeCode || "",
                        slTypeName: selectedSLType?.slTypeName || "",
                      });
                      setSelectedSLCode(null);
                    },
                    className:
                      "flex items-center justify-center h-8 px-4 text-[11px] font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-all",
                  },
                  {
                    key: "save",
                    label: <span className="sm:inline ml-1">Save</span>,
                    icon: faSave,
                    onClick: handleSaveSL,
                    className:
                      "flex items-center justify-center h-8 px-4 text-[11px] font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-all",
                  },
                  {
                    key: "reset",
                    label: <span className="sm:inline ml-1">Reset</span>,
                    icon: faUndo,
                    onClick: resetSLForm,
                    className:
                      "flex items-center justify-center h-8 px-4 text-[11px] font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-all",
                  },
                ]}
              />
            </div>
          </div>

          <div className="flex flex-col xl:flex-row gap-4">
            <div className="flex-1 bg-white dark:bg-gray-800 p-6 rounded-xl border shadow-lg grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <FieldRenderer label="SL Type Code" type="text" value={slForm.slTypeCode} disabled />
              <FieldRenderer label="SL Type Name" type="text" value={slForm.slTypeName} disabled />

              <FieldRenderer
                label="SL Code"
                type="text"
                value={slForm.slCode}
                disabled={!isEditingSL || !!selectedSLCode}
                onChange={(v) => updateSLForm({ slCode: v })}
              />
              <FieldRenderer
                label="SL Name"
                type="text"
                value={slForm.slName}
                disabled={!isEditingSL}
                onChange={(v) => updateSLForm({ slName: v })}
              />

              <FieldRenderer
                label="Address 1"
                type="text"
                value={slForm.address1}
                disabled={!isEditingSL}
                onChange={(v) => updateSLForm({ address1: v })}
              />
              <FieldRenderer
                label="Address 2"
                type="text"
                value={slForm.address2}
                disabled={!isEditingSL}
                onChange={(v) => updateSLForm({ address2: v })}
              />

              <FieldRenderer
                label="Address 3"
                type="text"
                value={slForm.address3}
                disabled={!isEditingSL}
                onChange={(v) => updateSLForm({ address3: v })}
              />
              <FieldRenderer
                label="TIN"
                type="text"
                value={slForm.tin}
                disabled={!isEditingSL}
                onChange={(v) => updateSLForm({ tin: v })}
              />

              <FieldRenderer
                label="Active"
                type="select"
                value={slForm.active}
                disabled={!isEditingSL}
                options={[
                  { value: "Y", label: "Y" },
                  { value: "N", label: "N" },
                ]}
                onChange={(v) => updateSLForm({ active: v })}
              />
            </div>

            <div className="w-full xl:w-[320px]">
              <RegistrationInfo layout="stacked" data={registrationInfo} />
            </div>
          </div>

          {/* <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border shadow-lg"> */}
            <SearchGlobalReferenceTable
              docType={`${DOC_TYPE}_MASTER`}
              columns={slMasterColumns}
              data={filteredSLMasterList}
              isLoading={isLoadingSL}
              itemsPerPage={200}
              onRowDoubleClick={handleEditSL}
            />
          {/* </div> */}
        </div>
      )}

      {activeTab === "sltype" && (
        <div className="mt-24 grid grid-cols-1 xl:grid-cols-[750px,1fr] gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-blue-700">SL Types</div>
              <ButtonBar
                buttons={[
                  {
                    key: "add",
                    label: <span className="sm:inline ml-1">Add</span>,
                    icon: faPlus,
                    onClick: () => {
                      resetSLTypeForm();
                      setIsEditingSLType(true);
                    },
                    className:
                      "flex items-center justify-center h-8 px-3 text-[11px] font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-all",
                  },
                  {
                    key: "save",
                    label: <span className="sm:inline ml-1">Save</span>,
                    icon: faSave,
                    onClick: handleSaveSLType,
                    className:
                      "flex items-center justify-center h-8 px-3 text-[11px] font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-all",
                  },
                  {
                    key: "reset",
                    label: <span className="sm:inline ml-1">Reset</span>,
                    icon: faUndo,
                    onClick: resetSLTypeForm,
                    className:
                      "flex items-center justify-center h-8 px-3 text-[11px] font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-all",
                  },
                ]}
              />
            </div>

            <div className="space-y-4 mb-4">
              <FieldRenderer
                label="SL Type Code"
                type="text"
                value={slTypeForm.slTypeCode}
                disabled={!isEditingSLType || !!selectedSLTypeRow}
                onChange={(v) => updateSLTypeForm({ slTypeCode: v })}
              />
              <FieldRenderer
                label="SL Type Name"
                type="text"
                value={slTypeForm.slTypeName}
                disabled={!isEditingSLType}
                onChange={(v) => updateSLTypeForm({ slTypeName: v })}
              />

               <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
                    
              <FieldRenderer
                label="Active"
                type="select"
                value={slTypeForm.active}
                disabled={!isEditingSLType}
                options={[
                  { value: "Y", label: "Y" },
                  { value: "N", label: "N" },
                ]}
                onChange={(v) => updateSLTypeForm({ active: v })}
              />
                    <FieldRenderer
                        label="Payee"
                        type="select"
                        value={slTypeForm.incSu}
                        disabled={!isEditingSLType}
                        options={[
                        { value: "Y", label: "Y" },
                        { value: "N", label: "N" },
                        ]}
                        onChange={(v) => updateSLTypeForm({ incSu: v })}
                    />
                    <FieldRenderer
                        label="Customer"
                        type="select"
                        value={slTypeForm.incCu}
                        disabled={!isEditingSLType}
                        options={[
                        { value: "Y", label: "Y" },
                        { value: "N", label: "N" },
                        ]}
                        onChange={(v) => updateSLTypeForm({ incCu: v })}
                    />
                </div>

            </div>
<div>
            <SearchGlobalReferenceTable
              docType={`${DOC_TYPE}_TYPE`}
              columns={slTypeColumns}
              data={slTypes}
              isLoading={isLoadingTypes}
              itemsPerPage={100}
              onRowClick={(row) => {
                setSelectedSLTypeCode(row.slTypeCode);
                handleEditSLType(row);
              }}
              onRowDoubleClick={handleEditSLType}
                tableSize = "Half"
            />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-blue-700">
                SL {selectedSLType ? ` (${selectedSLType.slTypeName})` : ""} - GL Matching
              </div>
              <button
                onClick={handleSaveMatching}
                className="h-8 px-4 rounded-md bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-all"
              >
                <FontAwesomeIcon icon={faLink} className="mr-2" />
                Save Matching
              </button>
            </div>

            <SearchGlobalReferenceTable
              docType={`${DOC_TYPE}_COA`}
              columns={slCoaColumns}
              data={coaList}
              isLoading={isLoadingCOA}
              itemsPerPage={300}
                tableSize = "Half"
            />
          </div>
        </div>
      )}
    </div>
  );
}