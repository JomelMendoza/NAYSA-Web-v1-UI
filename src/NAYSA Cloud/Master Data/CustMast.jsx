// src/NAYSA Cloud/Reference File/CustMast.jsx
import React, { useEffect, useMemo, useState } from "react";
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
} from "@fortawesome/free-solid-svg-icons";

import { apiClient } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";
import ButtonBar from "@/NAYSA Cloud/Global/ButtonBar";
import AttachFileModal from "@/NAYSA Cloud/Lookup/AttachFileModal.jsx";
import AllTranDocNo from "@/NAYSA Cloud/Lookup/SearchDocNo.jsx";

import {
    useSwalErrorAlert,
    useSwalValidationAlert,
    useSwalSuccessAlert,
    useSwalErrorAlertAPI,
    useSwalDeleteConfirm,
    useSwalDeleteRecord,
} from "@/NAYSA Cloud/Global/behavior.jsx";

import CustSetupTab from "./CustSetupTab";
import CustMasterDataTab from "@/NAYSA Cloud/Master Data/CustMasterDataTab.jsx";
import ReferenceCodesTab from "@/NAYSA Cloud/Master Data/CustMastTabs/ReferenceCodesTab";

/* ----------------------------------------------------- */
/* CONSTANT OPTIONS
/* ----------------------------------------------------- */
const SL_PREFIX = { CU: "CU", AG: "AG", OT: "OT" };

const normalizeSlType = (v) => {
    const s = String(v ?? "").toUpperCase().trim();
    if (!s) return "";
    if (["CU", "AG", "OT"].includes(s)) return s;
    if (s === "CUSTOMER") return "CU";
    if (s === "AGENCY") return "AG";
    if (s === "OTHERS") return "OT";
    return s;
};

const sltypeOptions = [
    { value: "CU", label: "CUSTOMER" },
    { value: "AG", label: "AGENCY" },
    { value: "OT", label: "OTHERS" },
];

const activeOptions = [
    { value: "Y", label: "Yes" },
    { value: "N", label: "No" },
];

const sourceOptions = [
    { value: "L", label: "Local" },
    { value: "F", label: "Foreign" },
];

const mappedTaxClassOptions = [
    { value: "WC", label: "Corporate" },
    { value: "WI", label: "Individual" },
];

const payeeTypeOptions = [];

const generateNextCustomerCode = (rows = [], sltypeCode = "CU") => {
    const sl = normalizeSlType(sltypeCode) || "CU";
    const prefix = SL_PREFIX[sl] || sl;

    const candidates = (Array.isArray(rows) ? rows : [])
        .filter((r) => normalizeSlType(r?.sltypeCode || "CU") === sl)
        .map((r) => String(r?.custCode ?? "").trim())
        .filter(Boolean)
        .filter((code) => code.startsWith(prefix));

    if (!candidates.length) return `${prefix}000001`;

    const nums = candidates
        .map((code) => parseInt(code.slice(prefix.length), 10))
        .filter((n) => !Number.isNaN(n));

    const max = nums.length ? Math.max(...nums) : 0;
    return `${prefix}${String(max + 1).padStart(6, "0")}`;
};

const emptyForm = {
    sltypeCode: "CU",
    custCode: "",
    taxClass: "",
    custName: "",
    businessName: "",
    firstName: "",
    middleName: "",
    lastName: "",
    oldCode: "",
    branchCode: "",
    active: "Y",

    custContact: "",
    custPosition: "",
    custTelno: "",
    custMobileno: "",
    custEmail: "",
    custAddr1: "",
    custAddr2: "",
    custAddr3: "",
    custZip: "",

    custTin: "",
    atcCode: "",
    vatCode: "",
    billtermCode: "",
    source: "L",
    currCode: "PHP",

    registeredBy: "",
    registeredDate: "",
    updatedBy: "",
    updatedDate: "",
    creditInvestigator: "",
    creditLimit: "0",
    totalAR: "",
    creditBalance: "0",

    customerRemarks: "",
    customizedDrForm: "",
    customizedSiForm: "",
    customizedDrcForm: "",
    customizedBsForm: "",
    customizedSviForm: "",

    taxSignatoryName: "",
    taxSignatoryTin: "",
    taxSignatoryPosition: "",
    taxSignatoryEmail: "",
    taxSignatoryZip: "",

    shipmentCode1: "",
    shipmentCode2: "",
    shipmentCode3: "",
    shipmentCode4: "",
    destination2: "",

    __isNew: false,
};

const CustMast = () => {
    const [activeTab, setActiveTab] = useState("setup");
    const [isLoading, setIsLoading] = useState(false);

    const { user } = useAuth();
    const userCode =
        user?.userCode || user?.USER_CODE || user?.user_code || user?.code || "";

    const [form, setForm] = useState({ ...emptyForm });
    const [selectedCustCode, setSelectedCustCode] = useState("");
    const [isEditing, setIsEditing] = useState(false);

    const [isAttachOpen, setIsAttachOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const [attachmentRows, setAttachmentRows] = useState([]);

    const [subsidiaryType, setSubsidiaryType] = useState("");
    const [masterFilters, setMasterFilters] = useState({});
    const [masterAllRows, setMasterAllRows] = useState([]);
    const [masterRows, setMasterRows] = useState([]);

    const [, setRecentCodes] = useState([]);

    const updateForm = (patch) => setForm((p) => ({ ...p, ...patch }));

    const showValidation = async (title, lines) => {
        const msg = Array.isArray(lines) ? lines.join("\n") : String(lines || "");
        return useSwalValidationAlert({ icon: "error", title, message: msg });
    };

    const checkDuplicateCustomer = async (custCode) => {
        const payload = {
            json_data: JSON.stringify({
                json_data: { custCode: String(custCode || "").trim() },
            }),
        };

        const res = await apiClient.post("/checkDuplicateCustomer", payload);
        const rows = res?.data?.data || [];
        return Number(rows?.[0]?.result ?? 0) === 1;
    };

    const checkInUsedCustomer = async (custCode) => {
        const payload = {
            json_data: JSON.stringify({
                json_data: { custCode: String(custCode || "").trim() },
            }),
        };

        const res = await apiClient.post("/checkInUsedCustomer", payload);
        const rows = res?.data?.data || [];
        return Number(rows?.[0]?.result ?? 0) === 1;
    };

    // const extractSprocError = (axiosResponse) => {
    //     const payload = axiosResponse?.data;
    //     const data = payload?.data;

    //     if (
    //         Array.isArray(data) &&
    //         data[0] &&
    //         (data[0].errorCount !== undefined ||
    //             data[0].errorMsg !== undefined ||
    //             data[0].errorcount !== undefined ||
    //             data[0].errormsg !== undefined)
    //     ) {
    //         return {
    //             errorCount: Number(data[0].errorCount ?? data[0].errorcount ?? 0),
    //             errorMsg: String(data[0].errorMsg ?? data[0].errormsg ?? ""),
    //         };
    //     }

    //     if (Array.isArray(data) && data[0]?.result) {
    //         try {
    //             const parsed = JSON.parse(data[0].result);
    //             const row = Array.isArray(parsed) ? parsed[0] : parsed;
    //             if (
    //                 row &&
    //                 (row.errorCount !== undefined ||
    //                     row.errorMsg !== undefined ||
    //                     row.errorcount !== undefined ||
    //                     row.errormsg !== undefined)
    //             ) {
    //                 return {
    //                     errorCount: Number(row.errorCount ?? row.errorcount ?? 0),
    //                     errorMsg: String(row.errorMsg ?? row.errormsg ?? ""),
    //                 };
    //             }
    //         } catch {
    //             // ignore
    //         }
    //     }

    //     const fallbackMsg = payload?.message || payload?.error || payload?.msg;
    //     if (fallbackMsg) return { errorCount: 1, errorMsg: String(fallbackMsg) };

    //     return null;
    // };

    const extractSprocValidation = (responseLike) => {
        const payload = responseLike?.data ?? responseLike;
        const data = payload?.data;

        if (
            Array.isArray(data) &&
            data[0] &&
            (data[0].errorCount !== undefined ||
                data[0].errorMsg !== undefined ||
                data[0].errorcount !== undefined ||
                data[0].errormsg !== undefined)
        ) {
            return {
                errorCount: Number(data[0].errorCount ?? data[0].errorcount ?? 0),
                errorMsg: String(data[0].errorMsg ?? data[0].errormsg ?? ""),
            };
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

        return null;
    };

    const documentNo = useMemo(() => {
        return String(form?.custCode || "").trim();
    }, [form]);

    const currentCode = useMemo(() => String(form?.custCode || "").trim(), [form]);

    const indexInRows = useMemo(() => {
        if (!currentCode) return -1;
        return masterRows.findIndex(
            (r) =>
                String(r?.custCode || "").trim().toUpperCase() ===
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
        if (Array.isArray(rows) && rows.length && typeof rows[0] === "object") {
            return rows;
        }
        return [];
    };

    const handleTaxClassChange = (v) => updateForm({ taxClass: v });
    const handleBusinessNameChange = (v) => updateForm({ businessName: v });
    const handleCheckNameChange = () => { };

    const applyAutoNames = (updates = {}, baseName = "") => {
        const reg = String(baseName || "").trim();
        const currentBusiness = form?.businessName ?? "";
        const currentCheck = form?.checkName ?? "";

        if (!String(currentBusiness).trim()) updates.businessName = reg;
        if (!String(currentCheck).trim()) updates.checkName = reg;

        return updates;
    };

    const loadMasterList = async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.get("/customer");
            const parsed = parseSprocJsonResult(res?.data?.data);
            const list = Array.isArray(parsed) ? parsed : [];

            const normalized = list.map((x) => ({
                ...x,
                sltypeCode: normalizeSlType(x?.sltypeCode ?? "CU"),
                custCode: x?.custCode ?? "",
                custName: x?.custName ?? "",
                address:
                    x?.address ??
                    [x?.custAddr1, x?.custAddr2, x?.custAddr3].filter(Boolean).join(" "),
            }));

            setMasterAllRows(normalized);
            setMasterRows(normalized);
        } catch (e) {
            console.error(e);
            await useSwalErrorAlert("Error", "Failed to load customer list.");
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
        const code = String(form?.custCode || "").trim();
        if (!code) {
            await useSwalValidationAlert({
                icon: "warning",
                title: "Required",
                message: "Customer Code is required.",
            });
            return;
        }
        setIsAttachOpen(true);
    };

    const fetchCustomerByCode = async (custCode) => {
        const code = String(custCode || "").trim();
        if (!code) return;

        setIsLoading(true);
        try {
            const res = await apiClient.post("/getCustomer", { CUST_CODE: code });
            const parsed = parseSprocJsonResult(res?.data?.data);
            const row = Array.isArray(parsed) ? parsed?.[0] : null;

            if (!row) {
                await useSwalErrorAlert("Info", "Customer not found.");
                return;
            }

            const sl = normalizeSlType(row?.sltypeCode ?? "CU");

            updateForm({
                ...emptyForm,
                __isNew: false,
                sltypeCode: sl,

                custCode: code,
                custName: row?.custName ?? "",
                businessName: row?.businessName ?? "",
                firstName: row?.firstName ?? "",
                middleName: row?.middleName ?? "",
                lastName: row?.lastName ?? "",
                taxClass: row?.taxClass ?? "",

                custAddr1: row?.custAddr1 ?? "",
                custAddr2: row?.custAddr2 ?? "",
                custAddr3: row?.custAddr3 ?? "",
                custZip: row?.custZip ?? "",
                custTin: row?.custTin ?? "",

                branchCode: row?.branchCode ?? "",
                custContact: row?.custContact ?? "",
                custPosition: row?.custPosition ?? "",
                custTelno: row?.custTelno ?? "",
                custMobileno: row?.custMobileno ?? "",
                custEmail: row?.custEmail ?? "",

                source: row?.source ?? "L",
                currCode: row?.currCode ?? "PHP",
                vatCode: row?.vatCode ?? "",
                atcCode: row?.atcCode ?? "",
                billtermCode: row?.billtermCode ?? row?.paytermCode ?? "",

                active: row?.active ?? "Y",
                oldCode: row?.oldcode ?? row?.oldCode ?? "",

                creditInvestigator: row?.creditInvestigator ?? "",
                creditLimit: row?.creditLimit ?? "0",
                totalAR: row?.totalAR ?? "",
                creditBalance: row?.creditBalance ?? "0",

                customerRemarks: row?.customerRemarks ?? "",
                customizedDrForm: row?.customizedDrForm ?? "",
                customizedSiForm: row?.customizedSiForm ?? "",
                customizedDrcForm: row?.customizedDrcForm ?? "",
                customizedBsForm: row?.customizedBsForm ?? "",
                customizedSviForm: row?.customizedSviForm ?? "",

                taxSignatoryName: row?.taxSignatoryName ?? "",
                taxSignatoryTin: row?.taxSignatoryTin ?? "",
                taxSignatoryPosition: row?.taxSignatoryPosition ?? "",
                taxSignatoryEmail: row?.taxSignatoryEmail ?? "",
                taxSignatoryZip: row?.taxSignatoryZip ?? "",

                shipmentCode1: row?.shipmentCode1 ?? "",
                shipmentCode2: row?.shipmentCode2 ?? "",
                shipmentCode3: row?.shipmentCode3 ?? "",
                shipmentCode4: row?.shipmentCode4 ?? "",
                destination2: row?.destination2 ?? "",

                registeredBy: row?.registeredBy ?? row?.registered_by ?? "",
                registeredDate: row?.registeredDate ?? row?.registered_date ?? "",
                updatedBy: row?.updatedBy ?? row?.updated_by ?? "",
                updatedDate: row?.updatedDate ?? row?.updated_date ?? "",
            });

            setSelectedCustCode(code);
            pushRecent(code);
        } catch (e) {
            console.error(e);
            await useSwalErrorAlertAPI(
                "Fetch Error",
                e?.message || "Failed to fetch customer."
            );
        } finally {
            setIsLoading(false);
        }
    };

    const navOpen = async (targetCode) => {
        const code = String(targetCode || "").trim();
        if (!code) return;
        setActiveTab("setup");
        setIsEditing(false);
        await fetchCustomerByCode(code);
    };


    const upsertCustomer = async () => {
        const code = String(form?.custCode || "").trim();

        setIsLoading(true);
        try {
            const jsonData = {
                json_data: {
                    action: selectedCustCode ? "edit" : "add",

                    custCode: code,
                    custName: form.custName || "",
                    businessName: form.businessName || "",

                    firstName: form.firstName || "",
                    middleName: form.middleName || "",
                    lastName: form.lastName || "",

                    taxClass: form.taxClass || "",

                    custAddr1: form.custAddr1 || "",
                    custAddr2: form.custAddr2 || "",
                    custAddr3: form.custAddr3 || "",
                    custZip: form.custZip || "",
                    custTin: form.custTin || "",

                    branchCode: form.branchCode || "",
                    custContact: form.custContact || "",
                    custPosition: form.custPosition || "",
                    custTelno: form.custTelno || "",
                    custMobileno: form.custMobileno || "",
                    custEmail: form.custEmail || "",

                    source: form.source || "",
                    currCode: form.currCode || "",
                    vatCode: form.vatCode || "",
                    atcCode: form.atcCode || "",
                    billtermCode: form.billtermCode || "",

                    sltypeCode: normalizeSlType(form.sltypeCode || "CU"),
                    active: form.active || "Y",
                    oldCode: form.oldCode || "",

                    creditInvestigator: form.creditInvestigator || "",
                    creditLimit: form.creditLimit || 0,
                    customerRemarks: form.customerRemarks || "",
                    customizedDrForm: form.customizedDrForm || "",
                    customizedSiForm: form.customizedSiForm || "",
                    customizedDrcForm: form.customizedDrcForm || "",
                    customizedBsForm: form.customizedBsForm || "",
                    customizedSviForm: form.customizedSviForm || "",

                    taxSignatoryName: form.taxSignatoryName || "",
                    taxSignatoryTin: form.taxSignatoryTin || "",
                    taxSignatoryPosition: form.taxSignatoryPosition || "",
                    taxSignatoryEmail: form.taxSignatoryEmail || "",
                    taxSignatoryZip: form.taxSignatoryZip || "",

                    shipmentCode1: form.shipmentCode1 || "",
                    shipmentCode2: form.shipmentCode2 || "",
                    shipmentCode3: form.shipmentCode3 || "",
                    shipmentCode4: form.shipmentCode4 || "",
                    destination2: form.destination2 || "",

                    userCode,
                },
            };

            const payload = {
                json_data: JSON.stringify(jsonData),
            };

            const isAddMode = !selectedCustCode;

            if (isAddMode) {
                const isDuplicate = await checkDuplicateCustomer(code);
                if (isDuplicate) {
                    await useSwalErrorAlert(
                        "Duplicate Record",
                        `Customer Code ${code} already exists.`
                    );
                    return;
                }
            }

            const res = await apiClient.post("/upsertCustomer", payload);
            console.log("upsertCustomer success response:", res?.data);

            const sprocValidation = extractSprocValidation(res?.data);

            if (Number(sprocValidation?.errorCount ?? 0) > 0) {
                await useSwalErrorAlert(
                    "Missing Required Field(s)",
                    String(
                        sprocValidation?.errorMsg ||
                        "Please complete the required fields."
                    )
                );
                return;
            }

            if (res?.data?.success === false || res?.data?.status === "error") {
                await useSwalErrorAlert(
                    "Save Failed",
                    res?.data?.message || "Failed to save customer."
                );
                return;
            }

            await useSwalSuccessAlert("Success!", "Customer saved successfully.");
            setSelectedCustCode(code);
            pushRecent(code);
            setIsEditing(false);
            await loadMasterList();
            await fetchCustomerByCode(code);
        } catch (e) {
            console.error(e);

            const sprocValidation = extractSprocValidation(e?.response?.data);

            if (Number(sprocValidation?.errorCount ?? 0) > 0) {
                await useSwalErrorAlert(
                    "Missing Required Field(s)",
                    String(
                        sprocValidation?.errorMsg ||
                        "Please complete the required fields."
                    )
                );
                return;
            }

            const msg =
                e?.response?.data?.message ||
                e?.response?.data?.error ||
                e?.response?.data?.msg ||
                e?.message ||
                "Failed to save customer.";

            await useSwalErrorAlert("Save Failed", msg);
        } finally {
            setIsLoading(false);
        }
    };

    const deleteCustomer = async () => {
        const code = String(form?.custCode || "").trim();

        if (!code) {
            await showValidation("Missing Required Field(s)", ["• Customer Code"]);
            return;
        }

        const confirm = await useSwalDeleteConfirm(
            "Delete Customer?",
            `This will permanently delete Customer Code ${code}. This action cannot be undone.`
        );
        if (!confirm?.isConfirmed) return;

        setIsLoading(true);
        try {
            const res = await apiClient.post("/deleteCustomer", {
                CUST_CODE: code,
            });

            const row = res?.data?.data?.[0] || {};
            const errorCount = Number(row?.errorcount ?? row?.errorCount ?? 0);
            const errorMsg = String(row?.errormsg ?? row?.errorMsg ?? "");

            if (res?.data?.success === false || errorCount > 0) {
                await useSwalErrorAlert(
                    "Delete Not Allowed",
                    errorMsg || res?.data?.message || "Failed to delete customer."
                );
                return;
            }

            await useSwalDeleteRecord("Customer");

            setForm({ ...emptyForm });
            setSelectedCustCode("");
            setIsEditing(false);
            setAttachmentRows([]);

            await loadMasterList();
        } catch (e) {
            console.error(e);

            const row = e?.response?.data?.data?.[0] || {};
            const errorMsg =
                row?.errormsg ||
                row?.errorMsg ||
                e?.response?.data?.message ||
                "Failed to delete customer.";

            await useSwalErrorAlert("Delete Not Allowed", String(errorMsg));
        } finally {
            setIsLoading(false);
        }
    };

    const applyMasterFilters = () => {
        const selectedType = normalizeSlType(subsidiaryType);

        const filtered = masterAllRows.filter((row) => {
            const rowType = normalizeSlType(row?.sltypeCode || "CU");
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
        const sl = normalizeSlType(form?.sltypeCode || "CU") || "CU";
        const nextCode = generateNextCustomerCode(masterAllRows, sl);

        setSelectedCustCode("");
        setForm({
            ...emptyForm,
            sltypeCode: sl,
            custCode: nextCode,
            __isNew: true,
        });

        setIsEditing(true);
        setActiveTab("setup");
        setAttachmentRows([]);
    };

    const handleEdit = async () => {
        const code = String(form?.custCode || "").trim();
        if (!code) {
            await useSwalErrorAlert(
                "Required",
                "Please select a Customer record first."
            );
            return;
        }
        setIsEditing(true);
        setActiveTab("setup");
    };

    const handleResetSetup = () => {
        setSelectedCustCode("");
        setForm({ ...emptyForm });
        setIsEditing(false);
        setAttachmentRows([]);
    };

    const tabs = useMemo(
        () => [
            { id: "setup", label: "Customer Set-Up", icon: faFolderOpen },
            { id: "master", label: "Customer Master Data", icon: faList },
            { id: "ref", label: "Reference Codes", icon: faTags },
        ],
        []
    );

    const handleMasterRowDoubleClick = async (row) => {
        const code = String(row?.custCode || row?.code || "").trim();
        if (!code) return;
        setActiveTab("setup");
        setIsEditing(false);
        await fetchCustomerByCode(code);
    };

    const headerButtons = useMemo(() => {
        if (activeTab !== "setup") return [];

        const hasRecord = String(form?.custCode || "").trim() && !form.__isNew;

        return [
            {
                key: "add",
                label: "Add",
                icon: faPlus,
                onClick: handleAdd,
                disabled: isLoading,
            },
            {
                key: "edit",
                label: "Edit",
                icon: faPenToSquare,
                onClick: handleEdit,
                disabled: isLoading,
            },
            {
                key: "save",
                label: "Save",
                icon: faSave,
                onClick: upsertCustomer,
                disabled: isLoading || !isEditing,
            },
            {
                key: "reset",
                label: "Reset",
                icon: faUndo,
                onClick: handleResetSetup,
                disabled: isLoading,
            },
            {
                key: "attach",
                label: "Attach File",
                icon: faPaperclip,
                onClick: handleOpenAttach,
                disabled: isLoading,
                variant: "ghost",
            },
            {
                key: "delete",
                label: "Delete",
                icon: faTrash,
                onClick: deleteCustomer,
                disabled: isLoading || isEditing || !hasRecord,
                variant: "danger",
            },
        ];
    }, [activeTab, isLoading, isEditing, form]);

    return (
        <div className="global-ref-main-div-ui mt-24">
            <div className="fixed mt-4 top-14 left-6 right-6 z-30 global-ref-header-ui flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <h1 className="global-ref-headertext-ui">Customer Master Data</h1>
                </div>

                <div className="flex flex-wrap gap-1 overflow-x-hidden">
                    {tabs.map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setActiveTab(t.id)}
                            className={`flex items-center px-3 py-2 rounded-md text-xs md:text-sm font-bold transition-colors duration-200 mr-1 ${activeTab === t.id
                                ? "bg-blue-100 text-blue-700"
                                : "text-gray-600 hover:bg-gray-100 hover:text-blue-700"
                                }`}
                        >
                            <FontAwesomeIcon icon={t.icon} className="w-4 h-4 mr-2" />
                            <span className="whitespace-nowrap">{t.label}</span>
                        </button>
                    ))}
                </div>

                <div className="flex gap-2 justify-center text-xs items-center">
                    {!!headerButtons.length && <ButtonBar buttons={headerButtons} />}
                </div>
            </div>

            <div
                className="global-tran-tab-div-ui mt-5"
                style={{ minHeight: "calc(100vh - 170px)" }}
            >
                {activeTab === "setup" && (
                    <CustSetupTab
                        form={form}
                        isEditing={isEditing}
                        isLoading={isLoading}
                        onChangeForm={updateForm}
                        onLookupCode={() => setIsSearchOpen(true)}
                        onSelectCustomerCode={fetchCustomerByCode}
                        sltypeOptions={sltypeOptions}
                        activeOptions={activeOptions}
                        sourceOptions={sourceOptions}
                        mappedTaxClassOptions={mappedTaxClassOptions}
                        payeeTypeOptions={payeeTypeOptions}
                        handleTaxClassChange={handleTaxClassChange}
                        handleBusinessNameChange={handleBusinessNameChange}
                        handleCheckNameChange={handleCheckNameChange}
                        applyAutoNames={applyAutoNames}
                    />
                )}

                {activeTab === "master" && (
                    <CustMasterDataTab
                        isLoading={isLoading}
                        rows={masterRows}
                        onRowDoubleClick={handleMasterRowDoubleClick}
                        subsidiaryType={subsidiaryType}
                        onChangeSubsidiaryType={setSubsidiaryType}
                        filters={masterFilters}
                        onChangeFilter={handleChangeMasterFilter}
                        onFilter={applyMasterFilters}
                        onReset={resetMasterFilters}
                    />
                )}

                {activeTab === "ref" && <ReferenceCodesTab variant="customer" />}
            </div>

            <AttachFileModal
                isOpen={isAttachOpen}
                onClose={() => setIsAttachOpen(false)}
                transaction="Customer Master Data"
                branch={form.branchCode || "HO"}
                documentNo={documentNo}
                rows={attachmentRows}
            />

            <AllTranDocNo
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                source="customer"
                params={{
                    branchCode: form.branchCode || "HO",
                    branchName: form.branchCode || "HO",
                    documentTitle: "Customer Lookup",
                    docType: "CUSTOMER",
                    fieldNo: "custCode",
                }}
                docNo={form.custCode}
                onRetrieve={({ docNo, key }) => {
                    if (key === "F") goFirst();
                    else if (key === "P") goPrev();
                    else if (key === "N") goNext();
                    else if (key === "L") goLast();
                    else fetchCustomerByCode(docNo);

                    setIsSearchOpen(false);
                }}
                onSelected={({ docNo }) => {
                    fetchCustomerByCode(docNo);
                    setIsSearchOpen(false);
                }}
            />
        </div>
    );
};

export default CustMast;