// src/NAYSA Cloud/Reference File/VendMast.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useAuth } from "@/NAYSA Cloud/Authentication/AuthContext.jsx";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFolderOpen,
  faPaperclip,
  faList,
  faTags,
  faPlus,
  faSave,
  faUndo,
  faPenToSquare,
  faTrash,
  faInfoCircle,
  faChevronDown,
  faFilePdf,
  faVideo
} from "@fortawesome/free-solid-svg-icons";

import { apiClient } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";
import ButtonBar from "@/NAYSA Cloud/Global/ButtonBar";
import AttachFileModal from "@/NAYSA Cloud/Lookup/AttachFileModal.jsx";

// Import Guides
import { reftables, reftablesPDFGuide, reftablesVideoGuide } from "@/NAYSA Cloud/Global/reftable";

import { 
  useSwalErrorAlert, 
  useSwalValidationAlert, 
  useSwalSuccessAlert, 
  useSwalErrorAlertAPI, 
  useSwalDeleteConfirm, 
  useSwalDeleteRecord 
} from "@/NAYSA Cloud/Global/behavior.jsx";
import PayeeSetupTab from "@/NAYSA Cloud/Master Data/CustMastTabs/PayeeSetupTab";
import PayeeMasterDataTab from "@/NAYSA Cloud/Master Data/CustMastTabs/PayeeMasterDataTab";
import ReferenceCodesTab from "@/NAYSA Cloud/Master Data/CustMastTabs/ReferenceCodesTab";

/* -------------------- CODE SERIES -------------------- */
const SL_CHAR = { AG: "A", CU: "C", EM: "E", OT: "O", SU: "S", TN: "T" };

const normalizeSlType = (v) => {
  const s = String(v ?? "").toUpperCase().trim();
  if (!s) return "";
  if (["AG", "CU", "EM", "OT", "SU", "TN"].includes(s)) return s;
  if (s === "CUSTOMER") return "CU";
  if (s === "SUPPLIER") return "SU";
  if (s === "AGENCY") return "AG";
  if (s === "EMPLOYEE") return "EM";
  if (s === "OTHERS") return "OT";
  if (s === "TENANT") return "TN";
  return s;
};

// Construct the 2-letter prefix (e.g., "S" + "S" = "SS", "S" + "U" = "SU")
const getPayeePrefix = (sltypeCode, mode) => {
  const sl = normalizeSlType(sltypeCode) || "SU";
  const slChar = SL_CHAR[sl] || sl.charAt(0);
  return `${slChar}${mode}`; 
};

const generateNextPayeeCode = (rows = [], sltypeCode = "SU", mode = "S") => {
  const prefix = getPayeePrefix(sltypeCode, mode);

  const candidates = (Array.isArray(rows) ? rows : [])
    .map((r) => String(r?.vendCode ?? "").trim())
    .filter(Boolean)
    .filter((code) => code.toUpperCase().startsWith(prefix.toUpperCase()));

  if (!candidates.length) return `${prefix}000001`;

  const nums = candidates
    .map((code) => parseInt(code.slice(prefix.length), 10))
    .filter((n) => !Number.isNaN(n));

  const max = nums.length ? Math.max(...nums) : 0;
  return `${prefix}${String(max + 1).padStart(6, "0")}`;
};
/* ----------------------------------------------------- */

const emptyForm = {
  sltypeCode: "SU",

  vendCode: "",
  vendName: "",
  vendContact: "",
  vendPosition: "",
  vendTelno: "",
  vendMobileno: "",
  vendEmail: "",
  vendAddr1: "",
  vendAddr2: "",
  vendAddr3: "",
  vendZip: "",
  vendTin: "",

  custCode: "",
  custName: "",
  custTin: "",
  custFaxNo: "",

  businessName: "",
  firstName: "",
  middleName: "",
  lastName: "",
  taxClass: "",

  atcCode: "",
  vatCode: "",
  paytermCode: "",
  source: "L",
  currCode: "PHP",

  branchCode: "",
  acctCode: "",
  active: "Y",
  oldCode: "",
  registeredBy: "",
  registeredDate: "",
  updatedBy: "",
  updatedDate: "",

  __isNew: false,
};

const VendMast = () => {
  // 'M' = User Defined, 'U' = Auto Assigned, 'S' = System Generated
  // TODO: Tie this to your backend system configuration settings in the future.
  const [generationMode, setGenerationMode] = useState("U");

  // Document Info Guide State
  const docType = "VendMast"; // Change this if your reftable.js uses a different key for Payee Master
  const guideRef = useRef(null);
  const pdfLink = reftablesPDFGuide?.[docType] || "#";
  const videoLink = reftablesVideoGuide?.[docType] || "#";
  const [isOpenGuide, setOpenGuide] = useState(false);

  const [activeTab, setActiveTab] = useState("setup");
  const [isLoading, setIsLoading] = useState(false);

  const { user } = useAuth();
  const userCode = user?.userCode || user?.USER_CODE || user?.code || "";

  const [form, setForm] = useState({ ...emptyForm });
  const [selectedVendCode, setSelectedVendCode] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [isAttachOpen, setIsAttachOpen] = useState(false);
  const [attachmentRows, setAttachmentRows] = useState([]);

  const [subsidiaryType, setSubsidiaryType] = useState("");
  const [masterFilters, setMasterFilters] = useState({});
  const [masterAllRows, setMasterAllRows] = useState([]);
  const [masterRows, setMasterRows] = useState([]);

  // Close Info Dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (guideRef.current && !guideRef.current.contains(e.target)) {
        setOpenGuide(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, []);

  // Handles updating the form and auto-assigning codes if mode is 'U'
  const updateForm = (patch) => {
    setForm((prev) => {
      const updated = { ...prev, ...patch };

      if (patch.sltypeCode !== undefined && patch.sltypeCode !== prev.sltypeCode) {
        if (prev.__isNew && generationMode === "U") {
          const newSl = normalizeSlType(patch.sltypeCode) || "SU";
          const nextCode = generateNextPayeeCode(masterAllRows, newSl, "U");
          updated.vendCode = nextCode;
          updated.custCode = nextCode;
        }
      }

      return updated;
    });
  };

  const showValidation = async (title, lines) => {
    const msg = Array.isArray(lines) ? lines.join("\n") : String(lines || "");
    return useSwalValidationAlert({ icon: "error", title, message: msg });
  };

  const checkDuplicateVendor = async (vendCode) => {
    const payload = {
      json_data: JSON.stringify({
        json_data: { vendCode: String(vendCode || "").trim() },
      }),
    };
    const res = await apiClient.post("/checkDuplicatePayee", payload);
    const rows = res?.data?.data || [];
    return Number(rows?.[0]?.result ?? 0) === 1;
  };

  const checkInUsedVendor = async (vendCode) => {
    const payload = {
      json_data: JSON.stringify({
        json_data: { vendCode: String(vendCode || "").trim() },
      }),
    };
    const res = await apiClient.post("/checkInUsedPayee", payload);
    const rows = res?.data?.data || [];
    return Number(rows?.[0]?.result ?? 0) === 1;
  };

  const extractSprocError = (axiosResponse) => {
    const payload = axiosResponse?.data;
    const data = payload?.data;

    if (
      Array.isArray(data) &&
      data[0] &&
      (data[0].errorCount !== undefined ||
        data[0].errorMsg !== undefined ||
        data[0].errorcount !== undefined ||
        data[0].errormsg !== undefined)
    ) {
      const errorCount = Number(data[0].errorCount ?? data[0].errorcount ?? 0);
      const errorMsg = String(data[0].errorMsg ?? data[0].errormsg ?? "");
      return { errorCount, errorMsg };
    }

    if (Array.isArray(data) && data[0]?.result) {
      try {
        const parsed = JSON.parse(data[0].result);
        const row = Array.isArray(parsed) ? parsed[0] : parsed;
        if (
          row &&
          (row.errorCount !== undefined ||
            row.errorMsg !== undefined ||
            row.errorcount !== undefined ||
            row.errormsg !== undefined)
        ) {
          return {
            errorCount: Number(row.errorCount ?? row.errorcount ?? 0),
            errorMsg: String(row.errorMsg ?? row.errormsg ?? ""),
          };
        }
      } catch {
        // ignore
      }
    }

    const fallbackMsg = payload?.message || payload?.error || payload?.msg;
    if (fallbackMsg) return { errorCount: 1, errorMsg: String(fallbackMsg) };

    return null;
  };

  const documentNo = useMemo(() => {
    return String(form?.vendCode || form?.custCode || "").trim();
  }, [form]);

  const [recentCodes, setRecentCodes] = useState([]);

  const currentCode = useMemo(
    () => String(form?.vendCode || form?.custCode || "").trim(),
    [form]
  );

  const indexInRows = useMemo(() => {
    if (!currentCode) return -1;
    return masterRows.findIndex(
      (r) =>
        String(r?.vendCode || "").trim().toUpperCase() ===
        currentCode.toUpperCase()
    );
  }, [masterRows, currentCode]);

  const pushRecent = (code) => {
    const c = String(code || "").trim();
    if (!c) return;
    setRecentCodes((prev) => [c, ...prev.filter((x) => x !== c)].slice(0, 20));
  };

  const parseSprocJsonResult = (rows) => {
    if (!rows) return [];
    const r = rows?.[0]?.result;
    if (typeof r === "string") {
      try {
        return JSON.parse(r);
      } catch {
        return [];
      }
    }
    if (Array.isArray(rows) && rows.length && typeof rows[0] === "object") return rows;
    return [];
  };

  const loadMasterList = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get("/payee");
      const parsed = parseSprocJsonResult(res?.data?.data);
      const list = Array.isArray(parsed) ? parsed : [];

      const normalized = list.map((x) => ({
        ...x,
        sltypeCode: normalizeSlType(x?.sltypeCode),
        vendCode: x?.vendCode ?? "",
        vendName: x?.vendName ?? "",
        address:
          x?.address ??
          [x?.vendAddr1, x?.vendAddr2, x?.vendAddr3].filter(Boolean).join(" "),
      }));

      setMasterAllRows(normalized);
      setMasterRows(normalized);
    } catch (e) {
      console.error(e);
      Swal.fire("Error", "Failed to load payee list.", "error");
      setMasterAllRows([]);
      setMasterRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMasterList();
  }, []);

  const handleOpenAttach = async () => {
    const code = String(form?.vendCode || form?.custCode || "").trim();
    if (!code) {
      await useSwalValidationAlert({
        icon: "warning",
        title: "Required",
        message: "Payee Code is required.",
      });
      return;
    }
    setIsAttachOpen(true);
  };

  const fetchVendorByCode = async (vendCode) => {
    const code = String(vendCode || "").trim();
    if (!code) return;

    setIsLoading(true);
    try {
      const res = await apiClient.post("/getPayee", { VEND_CODE: code });
      const parsed = parseSprocJsonResult(res?.data?.data);
      const row = Array.isArray(parsed) ? parsed?.[0] : null;

      if (!row) {
        await useSwalErrorAlert("Info", "Payee not found.");
        return;
      }

      const sl = normalizeSlType(row?.sltypeCode ?? "SU");

      updateForm({
        ...emptyForm,
        __isNew: false,
        sltypeCode: sl,

        vendCode: code,
        custCode: code,

        vendName: row?.vendName ?? "",
        custName: row?.vendName ?? "",

        vendContact: row?.vendContact ?? "",
        vendPosition: row?.vendPosition ?? "",
        vendTelno: row?.vendTelno ?? "",
        vendMobileno: row?.vendMobileno ?? "",
        vendEmail: row?.vendEmail ?? "",

        vendAddr1: row?.vendAddr1 ?? "",
        vendAddr2: row?.vendAddr2 ?? "",
        vendAddr3: row?.vendAddr3 ?? "",
        vendZip: row?.vendZip ?? "",
        vendTin: row?.vendTin ?? "",

        custTin: row?.vendTin ?? "",

        businessName: row?.businessName ?? "",
        firstName: row?.firstName ?? "",
        middleName: row?.middleName ?? "",
        lastName: row?.lastName ?? "",
        taxClass: row?.taxClass ?? "",

        branchCode: row?.branchCode ?? "",
        source: row?.source ?? "L",
        currCode: row?.currCode ?? "PHP",
        vatCode: row?.vatCode ?? "",
        atcCode: row?.atcCode ?? "",
        paytermCode: row?.paytermCode ?? "",
        acctCode: row?.acctCode ?? "",
        active: row?.active ?? "Y",
        oldCode: row?.oldcode ?? row?.oldCode ?? "",
        registeredBy: row?.registeredBy ?? row?.registered_by ?? "",
        registeredDate: row?.registeredDate ?? row?.registered_date ?? "",
        updatedBy: row?.updatedBy ?? row?.updated_by ?? "",
        updatedDate: row?.updatedDate ?? row?.updated_date ?? "",
      });

      setSelectedVendCode(code);
      pushRecent(code);
    } catch (e) {
      console.error(e);
      await useSwalErrorAlertAPI("Fetch Error", e?.message || "Failed to fetch payee.");
    } finally {
      setIsLoading(false);
    }
  };

  const navOpen = async (targetCode) => {
    const code = String(targetCode || "").trim();
    if (!code) return;
    setActiveTab("setup");
    setIsEditing(false);
    await fetchVendorByCode(code);
  };

  const deleteVendor = async () => {
    const code = String(form?.vendCode || form?.custCode || "").trim();
    if (!code) {
      await showValidation("Missing Required Field(s)", ["• Payee Code"]);
      return;
    }

    const isUsed = await checkInUsedVendor(code);
    if (isUsed) {
      await useSwalErrorAlert(
        "Delete Not Allowed",
        `Payee Code ${code} is already used in transaction(s).`
      );
      return;
    }

    const confirm = await useSwalDeleteConfirm(
      "Delete Payee?",
      `This will permanently delete Payee Code ${code}. This action cannot be undone.`
    );
    if (!confirm?.isConfirmed) return;

    setIsLoading(true);
    try {
      const res = await apiClient.post("/deletePayee", {
        VEND_CODE: code,
        USER_CODE: userCode,
      });

      const rows = res?.data?.data || [];
      const r0 = rows[0] || {};

      const errorCount = Number(r0.errorcount ?? r0.errorCount ?? 0);
      const errorMsg = String(r0.errormsg ?? r0.errorMsg ?? "");

      if (errorCount > 0) {
        await useSwalErrorAlert(
          "Delete Not Allowed",
          errorMsg || "Unable to delete payee."
        );
        return;
      }

      await useSwalDeleteRecord(
        "Deleted", 
        `Payee Code ${code} has been successfully removed.`
      );

      setForm({ ...emptyForm });
      setSelectedVendCode("");
      setIsEditing(false);
      setAttachmentRows([]);

      await loadMasterList();
    } catch (e) {
      console.error(e);
      await useSwalErrorAlert(
        "Error",
        e?.response?.data?.message || e?.message || "Failed to delete payee."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const upsertVendor = async () => {
    let code = String(form?.vendCode || form?.custCode || "").trim();
    const isAddMode = !selectedVendCode;

    // SCENARIO 1 & 3 LOGIC
    if (isAddMode) {
      if (generationMode === "M" && !code) {
        await showValidation("Required", ["• Please enter a User Defined Payee Code."]);
        return;
      }
      
      if (generationMode === "S" && !code) {
        const sl = normalizeSlType(form.sltypeCode || "SU");
        code = generateNextPayeeCode(masterAllRows, sl, "S");
      }
    }

    setIsLoading(true);
    try {
      const jsonData = {
        json_data: {
          action: selectedVendCode ? "edit" : "add",

          vendCode: code,
          vendName: form.vendName || form.custName || "",
          businessName: form.businessName || "",

          firstName: form.firstName || "",
          middleName: form.middleName || "",
          lastName: form.lastName || "",

          taxClass: form.taxClass || "",

          vendAddr1: form.vendAddr1 || "",
          vendAddr2: form.vendAddr2 || "",
          vendAddr3: form.vendAddr3 || "",
          vendZip: form.vendZip || "",
          vendTin: form.vendTin || form.custTin || "",

          branchCode: form.branchCode || "",
          vendContact: form.vendContact || "",
          vendPosition: form.vendPosition || "",
          vendTelno: form.vendTelno || "",
          vendMobileno: form.vendMobileno || "",
          vendEmail: form.vendEmail || "",

          source: form.source || "",
          currCode: form.currCode || "",
          vatCode: form.vatCode || "",
          atcCode: form.atcCode || "",
          paytermCode: form.paytermCode || "",

          acctCode: form.acctCode || "",
          sltypeCode: normalizeSlType(form.sltypeCode),
          active: form.active || "Y",
          oldCode: form.oldCode || "",
          userCode,
        },
      };

      const payload = {
        json_data: JSON.stringify(jsonData),
      };

      if (isAddMode) {
        const isDuplicate = await checkDuplicateVendor(code);
        if (isDuplicate) {
          await useSwalErrorAlert(
            "Duplicate Record",
            `Payee Code ${code} already exists.`
          );
          return;
        }
      }

      const res = await apiClient.post("/upsertPayee", payload);

      const rows = res?.data?.data || [];
      const r0 = rows[0] || {};

      const errorCount = Number(r0.errorcount ?? r0.errorCount ?? 0);
      const errorMsg = String(r0.errormsg ?? r0.errorMsg ?? "");

      if (errorCount > 0) {
        await useSwalErrorAlert(
          "Missing Required Field(s)",
          errorMsg || "Please complete the required fields."
        );
        return;
      }

      await useSwalSuccessAlert("Success!", "Payee saved successfully.");
      setSelectedVendCode(code);
      pushRecent(code);
      setIsEditing(false);
      await loadMasterList();
      await fetchVendorByCode(code);
    } catch (e) {
      console.error(e);

      const sprocErr = extractSprocError(e?.response);
      if (sprocErr?.errorMsg) {
        await useSwalErrorAlert(
          "Missing Required Field(s)",
          String(sprocErr.errorMsg)
        );
        return;
      }

      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.response?.data?.msg ||
        e?.message ||
        "Failed to save payee.";

      await useSwalErrorAlert("Save Failed", msg);
    } finally {
      setIsLoading(false);
    }
  };

  const applyMasterFilters = () => {
    const selectedType = normalizeSlType(subsidiaryType);

    const filtered = masterAllRows.filter((row) => {
      const rowType = normalizeSlType(row?.sltypeCode);
      if (selectedType && rowType !== selectedType) return false;

      for (const [key, val] of Object.entries(masterFilters || {})) {
        const q = String(val || "").trim().toLowerCase();
        if (!q) continue;
        const cell = String(row?.[key] || "").toLowerCase();
        if (!cell.includes(q)) return false;
      }
      return true;
    });

    setMasterRows(filtered);
  };

  const resetMasterFilters = () => {
    setSubsidiaryType("");
    setMasterFilters({});
    setMasterRows(masterAllRows);
  };

  const handleChangeMasterFilter = (key, value) => {
    setMasterFilters((p) => ({ ...p, [key]: value }));
  };

  const handleAdd = () => {
    const sl = normalizeSlType(form?.sltypeCode || "SU") || "SU";
    
    let nextCode = "";
    // SCENARIO 2 LOGIC
    if (generationMode === "U") {
      nextCode = generateNextPayeeCode(masterAllRows, sl, "U");
    }

    setSelectedVendCode("");
    setForm({
      ...emptyForm,
      sltypeCode: sl,
      vendCode: nextCode,
      custCode: nextCode,
      __isNew: true,
    });

    setIsEditing(true);
    setActiveTab("setup");
    setAttachmentRows([]);
  };

  const handleEdit = async () => {
    const code = String(form?.vendCode || "").trim();
    if (!code) {
      await useSwalErrorAlert({
        icon: "warning",
        title: "Required",
        message: "Please select a Payee record first.",
      });
      return;
    }
    setIsEditing(true);
    setActiveTab("setup");
  };

  const handleResetSetup = () => {
    setSelectedVendCode("");
    setForm({ ...emptyForm });
    setIsEditing(false);
    setAttachmentRows([]);
  };

  const tabs = useMemo(
    () => [
      { id: "setup", label: "Payee Set-Up", icon: faFolderOpen },
      { id: "master", label: "Payee Master Data", icon: faList },
      { id: "ref", label: "Reference Codes", icon: faTags },
    ],
    []
  );

  const handleMasterRowDoubleClick = async (row) => {
    const code = String(row?.vendCode || row?.code || "").trim();
    if (!code) return;
    setActiveTab("setup");
    setIsEditing(false);
    await fetchVendorByCode(code);
  };

  const headerButtons = useMemo(() => {
    if (activeTab !== "setup") return [];

    const hasRecord =
      String(form?.vendCode || form?.custCode || "").trim() && !form.__isNew;

    return [
      {
        key: "add",
        label: <span className="sm:inline ml-1">Add</span>,
        icon: faPlus,
        onClick: handleAdd,
        disabled: isLoading,
        className:
          "flex items-center justify-center h-7 w-16 sm:w-auto sm:h-8 sm:px-4 text-[11px] font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-all",
      },
      {
        key: "save",
        label: <span className="sm:inline ml-1">Save</span>,
        icon: faSave,
        onClick: upsertVendor,
        disabled: isLoading || !isEditing,
        className: `flex items-center justify-center h-7 w-16 sm:w-auto sm:h-8 sm:px-4 text-[11px] font-medium rounded-md transition-all ${
          isLoading || !isEditing
            ? "bg-blue-500 opacity-50 cursor-not-allowed text-white"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`,
      },
      {
        key: "reset",
        label: <span className="sm:inline ml-1">Reset</span>,
        icon: faUndo,
        onClick: handleResetSetup,
        disabled: isLoading,
        className:
          "flex items-center justify-center h-7 w-16 sm:w-auto sm:h-8 sm:px-4 text-[11px] font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-all",
      },
      {
        key: "edit",
        label: <span className="sm:inline ml-1">Edit</span>,
        icon: faPenToSquare,
        onClick: handleEdit,
        disabled: isLoading,
        className:
          "flex items-center justify-center h-7 w-16 sm:w-auto sm:h-8 sm:px-4 text-[11px] font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-all",
      },
      {
        key: "attach",
        label: <span className="sm:inline ml-1">Attach File</span>,
        icon: faPaperclip,
        onClick: handleOpenAttach,
        disabled: isLoading,
        className:
          "flex items-center justify-center h-7 w-auto sm:h-8 sm:px-4 text-[11px] font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-all",
      },
      {
        key: "delete",
        label: <span className="sm:inline ml-1">Delete</span>,
        icon: faTrash,
        onClick: deleteVendor,
        disabled: isLoading || isEditing || !hasRecord,
        className: `flex items-center justify-center h-7 w-16 sm:w-auto sm:h-8 sm:px-4 text-[11px] font-medium rounded-md transition-all ${
          isLoading || isEditing || !hasRecord
            ? "bg-red-400 opacity-50 cursor-not-allowed text-white"
            : "bg-red-500 text-white hover:bg-red-600"
        }`,
      },
    ];
  }, [activeTab, isLoading, isEditing, form]);

  return (
    <div className="global-ref-main-div-ui">

      {/* ── HEADER — mirrors COAMast layout exactly ─────────────────────── */}
      <div className="global-ref-header-ui">
        <div className="w-full flex flex-col gap-3 md:grid md:grid-cols-3 md:items-center md:gap-0">

          {/* 1) Title */}
          <div className="w-full md:w-auto md:justify-start flex">
            <h1 className="global-ref-headertext-ui w-full md:w-auto truncate text-center md:text-left">
              {activeTab === "setup" && "Payee Master Data"}
              {activeTab === "master" && "Payee Master Data"}
              {activeTab === "ref" && "Reference Codes"}
            </h1>
          </div>

          {/* 2) Tabs — same pill style as COAMast */}
          <div className="w-full md:justify-center flex">
            <div className="w-full md:w-auto">
              <div className="flex flex-nowrap overflow-x-auto no-scrollbar border-b border-blue-300 dark:border-gray-700">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`shrink-0 whitespace-nowrap px-3 py-1 sm:py-2 sm:px-4 text-[10px] sm:text-[13px] font-bold transition-all border-b-2 rounded-md
                      ${activeTab === tab.id
                        ? "border-blue-700 text-blue-700 bg-blue-50/50"
                        : "border-transparent text-gray-500 hover:text-blue-500"
                      }`}
                  >
                    <FontAwesomeIcon icon={tab.icon} className="mr-1.5" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3) Buttons — same size/style as COAMast */}
          <div className="w-full md:w-auto flex md:justify-end">
            <div className="w-full md:w-auto flex items-center justify-center md:justify-end gap-2 flex-wrap">
              {!!headerButtons.length && (
                <div className="flex flex-wrap justify-center md:justify-end gap-2">
                  <ButtonBar buttons={headerButtons} />
                </div>
              )}

              {/* Info Dropdown */}
              <div ref={guideRef} className="relative">
                <button
                  onClick={() => setOpenGuide((v) => !v)}
                  className="bg-blue-600 text-white h-7 w-16 sm:w-auto sm:h-8 sm:px-4 rounded-md flex items-center justify-center gap-1 hover:bg-blue-700 transition-all"
                >
                  <FontAwesomeIcon icon={faInfoCircle} className="text-[12px]" />
                  <span className="sm:inline ml-1 text-[11px] font-medium">Info</span>
                  <FontAwesomeIcon icon={faChevronDown} className="hidden sm:inline text-[10px] opacity-80" />
                </button>

                {isOpenGuide && (
                  <div className="absolute right-0 mt-2 w-52 rounded-md shadow-xl bg-white ring-1 ring-black/10 z-[60] dark:bg-gray-800 overflow-hidden">
                    <button
                      onClick={() => { window.open(pdfLink, "_blank"); setOpenGuide(false); }}
                      className="block w-full text-left px-4 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900 border-b border-gray-100 dark:border-gray-700"
                    >
                      <FontAwesomeIcon icon={faFilePdf} className="mr-2 text-red-500" /> PDF Guide
                    </button>
                    <button
                      onClick={() => { window.open(videoLink, "_blank"); setOpenGuide(false); }}
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
      {/* ─────────────────────────────────────────────────────────────────── */}

      <div
        className="global-tran-tab-div-ui mt-40 sm:mt-24"
        style={{ minHeight: "calc(100vh - 170px)" }}
      >
        {activeTab === "setup" && (
          <PayeeSetupTab
            isLoading={isLoading}
            isEditing={isEditing}
            form={form}
            generationMode={generationMode}
            sltypeOptions={[
              { value: "AG", label: "AGENCY" },
              { value: "EM", label: "EMPLOYEE" },
              { value: "OT", label: "OTHERS" },
              { value: "SU", label: "SUPPLIER" },
            ]}
            sourceOptions={[
              { value: "L", label: "Local" },
              { value: "F", label: "Foreign" },
            ]}
            activeOptions={[
              { value: "Y", label: "Yes" },
              { value: "N", label: "No" },
            ]}
            onChangeForm={updateForm}
            onSelectCustomerCode={fetchVendorByCode}
            onSearchCode={() => setIsSearchOpen(true)}
          />
        )}

        {activeTab === "master" && (
          <PayeeMasterDataTab
            isLoading={isLoading}
            subsidiaryType={subsidiaryType}
            onChangeSubsidiaryType={setSubsidiaryType}
            filters={masterFilters}
            onChangeFilter={handleChangeMasterFilter}
            rows={masterRows}
            onFilter={applyMasterFilters}
            onReset={resetMasterFilters}
            onPrint={() => Swal.fire("Info", "Print not yet wired.", "info")}
            onExport={() => Swal.fire("Info", "Export not yet wired.", "info")}
            onRowDoubleClick={handleMasterRowDoubleClick}
          />
        )}

        {activeTab === "ref" && <ReferenceCodesTab variant="vendor" />}
      </div>

      <AttachFileModal
        isOpen={isAttachOpen}
        onClose={() => setIsAttachOpen(false)}
        transaction="Payee Master Data"
        branch={form.branchCode || "HO"}
        documentNo={documentNo}
        rows={attachmentRows}
      />
    </div>
  );
};

export default VendMast;