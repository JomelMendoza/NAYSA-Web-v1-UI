// src/NAYSA Cloud/Reference File/CustMast.jsx
import React, { useEffect, useMemo, useState } from "react";
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
    faBackwardFast,
    faChevronLeft,
    faChevronRight,
    faForwardFast,
    faTrash
} from "@fortawesome/free-solid-svg-icons";

import { apiClient } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";
import ButtonBar from "@/NAYSA Cloud/Global/ButtonBar";
import CustomerMastLookupModal from "@/NAYSA Cloud/Lookup/SearchCustMast.jsx";
import AttachFileModal from "@/NAYSA Cloud/Lookup/AttachFileModal.jsx";
import AllTranDocNo from "@/NAYSA Cloud/Lookup/SearchDocNo.jsx";
// ✅ FIXED PATHS (as you requested: MasterData/CustMastTabs under Reference File)
import PayeeSetupTab from "@/NAYSA Cloud/Master Data/CustMastTabs/PayeeSetupTab";
import PayeeMasterDataTab from "@/NAYSA Cloud/Master Data/CustMastTabs/PayeeMasterDataTab";
import ReferenceCodesTab from "@/NAYSA Cloud/Master Data/CustMastTabs/ReferenceCodesTab";

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
    paytermCode: "",
    source: "L",
    currCode: "PHP",
};

const CustMast = () => {
    const [activeTab, setActiveTab] = useState("setup");
    const [isLoading, setIsLoading] = useState(false);

    const [form, setForm] = useState({ ...emptyForm });
    const [selectedCustCode, setSelectedCustCode] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [isAttachOpen, setIsAttachOpen] = useState(false);

    const [isSearchOpen, setIsSearchOpen] = useState(false);
    
    const documentNo = useMemo(() => {
        if (!form) return "";
        const code = form.custCode || form.vendCode || "";
        return `${form.sltypeCode}${code}`;
    }, [form]);
    // Attachments state
    const [attachmentRows, setAttachmentRows] = useState([]);
    const handleOpenAttach = () => {
        if (!form?.custCode || !form.custCode.trim()) {
            Swal.fire({
                icon: "warning",
                title: "Required",
                text: "Customer Code is required.",
            });
            return;
        }

        setIsAttachOpen(true);
    };


    // MASTER DATA GRID STATES
    const [subsidiaryType, setSubsidiaryType] = useState(""); // ✅ ALL
    const [masterFilters, setMasterFilters] = useState({});
    const [masterAllRows, setMasterAllRows] = useState([]);
    const [masterRows, setMasterRows] = useState([]);

    const currentCode = useMemo(
        () => String(form?.custCode || "").trim(),
        [form]
    );

    const indexInRows = useMemo(() => {
        if (!currentCode) return -1;
        return masterRows.findIndex(
            (r) =>
                String(r?.custCode || "").trim().toUpperCase() ===
                currentCode.toUpperCase()
        );
    }, [masterRows, currentCode]);

    const navOpen = async (targetCode) => {
        const code = String(targetCode || "").trim();
        if (!code) return;
        setActiveTab("setup");
        setIsEditing(false);
        await fetchCustomerByCode(code);
    };

    const goFirst = async () => {
        if (!masterRows.length) return;
        await navOpen(masterRows[0]?.custCode);
    };

    const goLast = async () => {
        if (!masterRows.length) return;
        await navOpen(masterRows[masterRows.length - 1]?.custCode);
    };

    const goPrev = async () => {
        if (indexInRows <= 0) return;
        await navOpen(masterRows[indexInRows - 1]?.custCode);
    };

    const goNext = async () => {
        if (indexInRows < 0 || indexInRows >= masterRows.length - 1) return;
        await navOpen(masterRows[indexInRows + 1]?.custCode);
    };

    // Lookup modal
    const [isCustLookupOpen, setIsCustLookupOpen] = useState(false);
    const [custLookupParam, setCustLookupParam] = useState("ActiveAll");

    const updateForm = (patch) => setForm((p) => ({ ...p, ...patch }));

    const parseSprocJsonResult = (rows) => {
        if (!rows || !rows.length) return null;
        const r = rows[0]?.result;
        if (!r) return null;
        try {
            return JSON.parse(r);
        } catch {
            return null;
        }
    };

    const loadMasterList = async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.get("/customer"); // mode Load
            const parsed = parseSprocJsonResult(res?.data?.data);
            const list = Array.isArray(parsed) ? parsed : [];

            // normalize address column for your grid
            const normalized = list.map((x) => ({
                ...x,
                address:
                    x.address ??
                    [x.custAddr1, x.custAddr2, x.custAddr3].filter(Boolean).join(" ") ??
                    x.addr ??
                    "",
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

    const fetchCustomerByCode = async (custCode) => {
        if (!custCode) return;

        setIsLoading(true);
        try {
            const res = await apiClient.post("/getCustomer", { CUST_CODE: custCode });
            const parsed = parseSprocJsonResult(res?.data?.data);
            const row = Array.isArray(parsed) ? parsed?.[0] : null;

            if (!row) {
                Swal.fire("Info", "Payee not found.", "info");
                return;
            }

            updateForm({
                custCode,
                custName: row.custName ?? "",
                businessName: row.businessName ?? "",
                firstName: row.firstName ?? "",
                middleName: row.middleName ?? "",
                lastName: row.lastName ?? "",
                taxClass: row.taxClass ?? "",
                custAddr1: row.custAddr1 ?? "",
                custAddr2: row.custAddr2 ?? "",
                custAddr3: row.custAddr3 ?? "",
                custZip: row.custZip ?? "",
                branchCode: row.branchCode ?? "",
                custContact: row.custContact ?? "",
                custPosition: row.custPosition ?? "",
                custTelno: row.custTelno ?? "",
                custMobileno: row.custMobileno ?? "",
                custEmail: row.custEmail ?? "",
                source: row.source ?? "L",
                currCode: row.currCode ?? "PHP",
                vatCode: row.vatCode ?? "",
                atcCode: row.atcCode ?? "",
                paytermCode: row.billtermCode ?? row.paytermCode ?? "",
                sltypeCode: (row.sltypeCode ?? form.sltypeCode ?? "CU"),
                active: row.active ?? "Y",
                oldCode: row.oldcode ?? "",
                custTin: row.custTin ?? "",

                // extra fields if returned
                checkName: row.checkName ?? "",
                custFaxNo: row.custFaxNo ?? "",
                payeeType: row.payeeType ?? "",
                apAccount: row.apAccount ?? "",
                registeredBy: row.registeredBy ?? "",
                registeredDate: row.registeredDate ?? "",
                updatedBy: row.updatedBy ?? "",
                updatedDate: row.updatedDate ?? "",
            });

            setSelectedCustCode(custCode);
        } catch (e) {
            console.error(e);
            Swal.fire("Error", "Failed to fetch payee.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const upsertCustomer = async () => {
        const code = String(form?.custCode || "").trim();

        setIsLoading(true);

        try {
            const payload = {
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
                paytermCode: form.paytermCode || "",

                sltypeCode: "CU",
                active: form.active || "Y",
                oldCode: form.oldCode || "",
            };

            const res = await apiClient.post("/upsertCustomer", {
                json_data: payload,
            });

            // ✅ SQL VALIDATION (same as VendMast)
            const rows = res?.data?.data || [];
            const r0 = rows[0] || {};

            const errorCount = Number(r0.errorcount ?? 0);
            const errorMsg = String(r0.errormsg ?? "");

            if (errorCount > 0) {
                await Swal.fire({
                    icon: "error",
                    title: "Missing Required Field(s)",
                    text: errorMsg,
                });
                return;
            }

            await Swal.fire("Saved", "Customer saved successfully.", "success");

            setSelectedCustCode(code);
            pushRecent(code); // ✅ recent memory
            setIsEditing(false);

            await loadMasterList();

        } catch (e) {
            console.error(e);
            Swal.fire("Error", "Failed to save customer.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = () => {
        if (!form.custCode) {
            return Swal.fire("Info", "Select a record first.", "info");
        }
        setIsEditing(true);
    };

    const handleDelete = async () => {
        if (!form.custCode) {
            return Swal.fire("Info", "Select a record first.", "info");
        }

        const confirm = await Swal.fire({
            title: "Delete?",
            text: "Are you sure you want to delete this record?",
            icon: "warning",
            showCancelButton: true,
        });

        if (!confirm.isConfirmed) return;

        try {
            await apiClient.post("/deleteCustomer", {
                CUST_CODE: form.custCode,
            });

            Swal.fire("Deleted", "Customer deleted.", "success");
            handleResetSetup();
            await loadMasterList();
        } catch (e) {
            Swal.fire("Error", "Failed to delete.", "error");
        }
    };

    const applyMasterFilters = () => {
        const selectedType = String(subsidiaryType || "").toUpperCase().trim();

        const filtered = masterAllRows.filter((row) => {
            const rowType = String(row?.sltypeCode || "").toUpperCase().trim();

            // ✅ HARD FILTER BY SL TYPE
            if (selectedType !== "" && rowType !== selectedType) {
                return false; // ❌ DO NOT RETRIEVE
            }

            // ✅ Apply column filters only AFTER SLTYPE matches
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
        setSubsidiaryType(""); // ✅ ALL
        setMasterFilters({});
        setMasterRows(masterAllRows);
    };


    const handleChangeMasterFilter = (key, value) => {
        setMasterFilters((p) => ({ ...p, [key]: value }));
    };

    const handleAdd = () => {
        const nextCode = generateNextCustomerCode(masterAllRows);

        setSelectedCustCode("");

        setForm({
            ...emptyForm,
            custCode: nextCode,
            __isNew: true,
        });

        setIsEditing(true);
        setActiveTab("setup");
    };

    const handleResetSetup = () => {
        setSelectedCustCode("");
        setForm({ ...emptyForm });
        setIsEditing(false); // 🔒 VIEW MODE
    };

    const handleOpenCustLookup = () => {
        setCustLookupParam("ActiveAll");
        setIsCustLookupOpen(true);
    };

    const handleCustLookupClose = async (selected) => {
        setIsCustLookupOpen(false);
        if (!selected) return;

        const code = selected?.custCode || "";
        if (!code) return;

        updateForm({ custCode: code });
        await fetchCustomerByCode(code);
    };

    useEffect(() => {
        loadMasterList();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const tabs = useMemo(
        () => [
            { id: "setup", label: "Customer Set-Up", icon: faFolderOpen },
            { id: "master", label: "Customer Master Data", icon: faList },
            { id: "ref", label: "Reference Codes", icon: faTags },
        ],
        []
    );

    const handleMasterRowDoubleClick = async ({ code }) => {
        if (!code) return;
        setActiveTab("setup");
        setIsEditing(false);
        await fetchCustomerByCode(code); // POST /getCustMast (your customer fetch)
    };

    /* -------------------- CODE SERIES -------------------- */
    const PREFIX = "CU";

    const generateNextCustomerCode = (rows = []) => {
        const candidates = (Array.isArray(rows) ? rows : [])
            .map((r) => String(r?.custCode ?? "").trim())
            .filter(Boolean)
            .filter((code) => code.startsWith(PREFIX));

        if (!candidates.length) return `${PREFIX}000001`;

        const nums = candidates
            .map((code) => parseInt(code.slice(PREFIX.length), 10))
            .filter((n) => !Number.isNaN(n));

        const max = nums.length ? Math.max(...nums) : 0;

        return `${PREFIX}${String(max + 1).padStart(6, "0")}`;
    };
    /* ----------------------------------------------------- */


    const headerButtons = useMemo(() => {
        if (activeTab !== "setup") return [];

        const hasRecord =
            String(form?.custCode || "").trim() && !form.__isNew;

        return [
            { key: "add", label: "Add", icon: faPlus, onClick: handleAdd, disabled: isLoading },
            { key: "edit", label: "Edit", icon: faPenToSquare, onClick: handleEdit, disabled: isLoading },
            { key: "save", label: "Save", icon: faSave, onClick: upsertCustomer, disabled: isLoading || !isEditing },
            { key: "reset", label: "Reset", icon: faUndo, onClick: handleResetSetup, disabled: isLoading },
            { key: "attach", label: "Attach File", icon: faPaperclip, onClick: handleOpenAttach, disabled: isLoading, variant: "ghost" },
            { key: "delete", label: "Delete", icon: faTrash, onClick: handleDelete, disabled: isLoading || isEditing || !hasRecord, variant: "danger" },
        ];
    }, [activeTab, isLoading, isEditing, form]);

    return (
        <div className="global-ref-main-div-ui mt-24">
            {/* Header + Tabs (AccessRights-like) */}
            <div className="fixed mt-4 top-14 left-6 right-6 z-30 global-ref-header-ui flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <h1 className="global-ref-headertext-ui">Customer Master Data</h1>
                </div>

                <div className="flex overflow-x-auto scrollbar-hide">
                    {tabs.map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setActiveTab(t.id)}
                            className={`flex items-center px-3 py-2 rounded-md text-xs md:text-sm font-bold transition-colors duration-200 mr-1
                ${activeTab === t.id
                                    ? "bg-blue-100 text-blue-700"
                                    : "text-gray-600 hover:bg-gray-100 hover:text-blue-700"
                                }`}
                        >
                            <FontAwesomeIcon icon={t.icon} className="w-4 h-4 mr-2" />
                            <span className="whitespace-nowrap">{t.label}</span>
                        </button>
                    ))}
                </div>

                {/* <div className="flex gap-2 justify-center text-xs">
                    {!!headerButtons.length && <ButtonBar buttons={headerButtons} />}
                </div> */}
                <div className="flex gap-2 justify-center text-xs items-center">



                    {!!headerButtons.length && <ButtonBar buttons={headerButtons} />}
                </div>
            </div>

            {/* TAB CONTENT */}
            <div
                className="global-tran-tab-div-ui mt-5"
                style={{ minHeight: "calc(100vh - 170px)" }}
            >


                {activeTab === "setup" && (
                    <PayeeSetupTab
                        isLoading={isLoading}
                        isEditing={isEditing}
                        form={form}
                        sltypeOptions={[
                            { value: "", label: "ALL" },
                            { value: "AG", label: "AGENCY" },
                            { value: "CU", label: "CUSTOMER" },
                            { value: "OT", label: "OTHERS" },
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
                        onSelectCustomerCode={fetchCustomerByCode}   // ✅ ADD THIS
                        onSearchCode={() => setIsSearchOpen(true)}
                    />

                )}

                {activeTab === "master" && (
                    <PayeeMasterDataTab
                        isLoading={isLoading}
                        subsidiaryType="CU"          // ✅ FORCE CUSTOMER MODE
                        onChangeSubsidiaryType={() => { }}  // disable change
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
                {activeTab === "ref" && <ReferenceCodesTab variant="customer" />}

            </div>

            <CustomerMastLookupModal
                isOpen={isCustLookupOpen}
                customParam={custLookupParam}
                onClose={handleCustLookupClose}
            />

            <AttachFileModal
                isOpen={isAttachOpen}
                onClose={() => setIsAttachOpen(false)}
                transaction="Customer Master Data"
                branch={form.branchCode || "HO"}
                documentNo={documentNo}
                rows={attachmentRows} // later from API
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
                    else fetchVendorByCode(docNo);

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
