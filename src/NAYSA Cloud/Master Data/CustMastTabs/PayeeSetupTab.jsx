// import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
// import FieldRenderer from "@/NAYSA Cloud/Global/FieldRenderer";

// import SearchCusMast from "@/NAYSA Cloud/Lookup/SearchCustMast.jsx";
// import SearchVendMast from "@/NAYSA Cloud/Lookup/SearchVendMast.jsx";
// import SearchBranchRef from "@/NAYSA Cloud/Lookup/SearchBranchRef.jsx";
// import SearchATCRef from "@/NAYSA Cloud/Lookup/SearchATCRef.jsx";
// import SearchVATRef from "@/NAYSA Cloud/Lookup/SearchVATRef.jsx";
// import SearchCOAMast from "@/NAYSA Cloud/Lookup/SearchCOAMast.jsx";
// import SearchPayTermRef from "@/NAYSA Cloud/Lookup/SearchPayTermRef.jsx";
// import SearchBillTermRef from "@/NAYSA Cloud/Lookup/SearchBillTermRef.jsx";
// import SearchCurrRef from "@/NAYSA Cloud/Lookup/SearchCurrRef.jsx";
// import RegistrationInfo from "@/NAYSA Cloud/Global/RegistrationInfo.jsx";
// import { useFieldLenghtCheck, useGetFieldLength } from "@/NAYSA Cloud/Global/procedure";


// const SectionHeader = ({ title }) => (
//   <div className="mb-3">
//     <div className="text-[9px] sm:text-[12px] font-bold text-slate-500 tracking-widest border-b pb-2">{title}</div>
//   </div>
// );

// const Card = ({ children, className = "" }) => (
//   <div
//     className={[
//       "global-tran-textbox-group-div-ui flex flex-col",
//       "transition-all duration-150",
//       "focus-within:ring-2 focus-within:ring-blue-400/60 focus-within:shadow-2xl",
//       "focus-within:-translate-y-[1px]",
//       className,
//     ].join(" ")}
//   >
//     {children}
//   </div>
// );

// const normalizeUpper = (v) => String(v ?? "").toUpperCase().trim();

// const PayeeSetupTab = forwardRef(
//   (
//     {
//       isLoading,
//       isEditing,
//       form,
//       sltypeOptions,
//       sourceOptions,
//       activeOptions,
//       onChangeForm,
//       onSelectCustomerCode,

//       payeeTypeOptions = [],
//       apAccountOptions = [],
//       paymentTermOptions = [],
//       taxClassOptions = [],
//       currencyOptions = [],
//     },
//     ref
//   ) => {
//     useImperativeHandle(ref, () => ({}));

//     const [tblFieldArray, setTblFieldArray] = useState([]);

//     const getLen = (col, fallback = undefined) => {
//       const n = useGetFieldLength(tblFieldArray, col);
//       return n || fallback;
//     };

//     useEffect(() => {
//       // run once (or whenever editing starts, up to you)
//       const run = async () => {
//         try {
//           // ✅ adjust these table names to your real master tables
//           // If Payee setup can be CU + Vendor types, just load both.
//           const tbls = "cust_mast,vend_mast,payee_mast";
//           const result = await useFieldLenghtCheck(tbls);
//           if (result) setTblFieldArray(result);
//         } catch (e) {
//           console.error("Failed to load field lengths:", e);
//         }
//       };

//       run();
//     }, []);

//     // ✅ SINGLE MASTER SWITCH: disable everything until Add/Edit
//     const isReadOnly = !isEditing;
//     const isDisabled = isReadOnly || isLoading;

//     // const [isSearchOpen, setIsSearchOpen] = useState(false);

//     const [salesTab, setSalesTab] = useState("sales");

//     const sl = useMemo(() => normalizeUpper(form?.sltypeCode || ""), [form?.sltypeCode]);
//     const isVendor = useMemo(() => sl !== "CU", [sl]);
//     const isCustomer = useMemo(() => sl === "CU", [sl]);

//     const [isSalesRepLookupOpen, setIsSalesRepLookupOpen] = useState(false);
//     const [isChainLookupOpen, setIsChainLookupOpen] = useState(false);
//     const [isChainCustomerLookupOpen, setIsChainCustomerLookupOpen] = useState(false);
//     const [isWarehouseLookupOpen, setIsWarehouseLookupOpen] = useState(false);
//     const [isATCGoodsLookupOpen, setIsATCGoodsLookupOpen] = useState(false);
//     const [isATCServiceLookupOpen, setIsATCServiceLookupOpen] = useState(false);
//     const [isATCRentalLookupOpen, setIsATCRentalLookupOpen] = useState(false);
//     // ✅ form field keys (used in: form[f.code], form[f.name], etc.)
//     const f = useMemo(() => {
//       if (isVendor) {
//         return {
//           code: "vendCode",
//           name: "vendName",
//           contact: "vendContact",
//           position: "vendPosition",
//           tel: "vendTelno",
//           mobile: "vendMobileno",
//           email: "vendEmail",
//           addr1: "vendAddr1",
//           addr2: "vendAddr2",
//           addr3: "vendAddr3",
//           zip: "vendZip",
//           tin: "vendTin",
//         };
//       }
//       return {
//         code: "custCode",
//         name: "custName",
//         contact: "custContact",
//         position: "custPosition",
//         tel: "custTelno",
//         mobile: "custFaxNo", // customer uses fax in your UI
//         email: "custEmail",
//         addr1: "custAddr1",
//         addr2: "custAddr2",
//         addr3: "custAddr3",
//         zip: "custZip",
//         tin: "custTin",
//       };
//     }, [isVendor]);

//     // ✅ DB columns (used only for getLen(col.xxx))
//     const col = useMemo(() => {
//       if (isVendor) {
//         return {
//           code: "vend_code",
//           name: "vend_name",
//           contact: "vend_contact",
//           position: "vend_position",
//           tel: "vend_telno",
//           mobile: "vend_mobileno",
//           email: "vend_email",
//           addr1: "vend_addr1",
//           addr2: "vend_addr2",
//           addr3: "vend_addr3",
//           zip: "vend_zip",
//           tin: "vend_tin",

//           // common payee fields (adjust to your real column names if needed)
//           businessName: "business_name",
//           checkName: "check_name",
//           firstName: "first_name",
//           middleName: "middle_name",
//           lastName: "last_name",
//           atcCode: "atc_code",
//           vatCode: "vat_code",
//           paytermCode: "payterm_code",
//           acctCode: "acct_code",
//           currCode: "curr_code",
//         };
//       }

//       return {
//         code: "cust_code",
//         name: "cust_name",
//         contact: "cust_contact",
//         position: "cust_position",
//         tel: "cust_telno",
//         mobile: "cust_faxno",
//         email: "cust_email",
//         addr1: "cust_addr1",
//         addr2: "cust_addr2",
//         addr3: "cust_addr3",
//         zip: "cust_zip",
//         tin: "cust_tin",

//         // common payee fields (adjust if needed)
//         businessName: "business_name",
//         checkName: "check_name",
//         firstName: "first_name",
//         middleName: "middle_name",
//         lastName: "last_name",
//         atcCode: "atc_code",
//         vatCode: "vat_code",
//         billtermCode: "billterm_code",
//         acctCode: "acct_code",
//         currCode: "curr_code",
//       };
//     }, [isVendor]);

//     const isEmployee = useMemo(() => sl === "EM", [sl]);
//     const isSupplier = useMemo(() => sl === "SU", [sl]);

//     const buildRegisteredName = (fn, mn, ln) => {
//       return [fn, mn, ln]
//         .map((v) => v?.trim())
//         .filter(Boolean)
//         .join(" ");
//     };

//     const mappedTaxClassOptions = useMemo(() => {
//       const base = [
//         { value: "WC", label: "Corporate" },
//         { value: "WI", label: "Individual" },
//       ];

//       const extra = (Array.isArray(taxClassOptions) ? taxClassOptions : [])
//         .map((o) => {
//           const rawValue =
//             typeof o === "string"
//               ? o
//               : (o?.value ?? o?.code ?? o?.taxClass ?? o?.tax_class ?? "");

//           const value = normalizeUpper(rawValue || "");
//           if (!value) return null;

//           let label =
//             typeof o === "string"
//               ? value
//               : String(o?.label ?? o?.name ?? o?.text ?? value);

//           if (value === "WC") label = "Corporate";
//           if (value === "WI") label = "Individual";

//           return { value, label };
//         })
//         .filter(Boolean);

//       const seen = new Set();
//       return [...base, ...extra].filter((x) => {
//         const k = x.value;
//         if (seen.has(k)) return false;
//         seen.add(k);
//         return true;
//       });
//     }, [taxClassOptions]);

//     /* ------------------------------------------------------------------
//        ✅ FIX: Tax Class default should NOT override user choice.
//        - We only auto-set when:
//          a) taxClass is empty, OR
//          b) taxClass was previously auto-set by this effect
//        - If user changes taxClass manually, we stop auto-overriding.
//     ------------------------------------------------------------------ */
//     const taxAutoRef = useRef({
//       lastAutoValue: "", // "WC"/"WI"
//       userTouched: false,
//       lastSl: "",
//     });

//     // Mark tax class as "user touched" when user changes it manually
//     const handleTaxClassChange = (v) => {
//       taxAutoRef.current.userTouched = true;
//       onChangeForm({ taxClass: v });
//     };

//     /* ------------------------------------------------------------------
//        ✅ Auto-display rules for Registered Name / Business Name / Check Name
//        - Supplier (SU): encode Registered Name, auto-fill Business Name + Check Name (editable)
//        - Employee (EM): encode First/Middle/Last, auto-fill Registered Name + Business Name + Check Name
//          (Registered & Business are disabled; Check Name stays editable)
//     ------------------------------------------------------------------ */
//     const nameAutoRef = useRef({
//       businessLastAuto: "",
//       checkLastAuto: "",
//       businessTouched: false,
//       checkTouched: false,
//       lastSl: "",
//     });

//     const handleBusinessNameChange = (v) => {
//       nameAutoRef.current.businessTouched = true;
//       onChangeForm({ businessName: v });
//     };

//     const handleCheckNameChange = (v) => {
//       nameAutoRef.current.checkTouched = true;
//       onChangeForm({ checkName: v });
//     };

//     const applyAutoNames = (updates = {}, baseName = "") => {
//       const reg = String(baseName || "").trim();

//       const currentBusiness = form?.businessName ?? "";
//       const currentCheck = form?.checkName ?? "";

//       const businessWasAuto =
//         currentBusiness && currentBusiness === nameAutoRef.current.businessLastAuto;
//       const checkWasAuto =
//         currentCheck && currentCheck === nameAutoRef.current.checkLastAuto;

//       const businessEmpty = !String(currentBusiness || "").trim();
//       const checkEmpty = !String(currentCheck || "").trim();

//       // Auto business name if empty or previously auto-set AND user didn't manually touch it
//       if ((businessEmpty || businessWasAuto) && !nameAutoRef.current.businessTouched) {
//         updates.businessName = reg;
//         nameAutoRef.current.businessLastAuto = reg;
//       }

//       // Auto check name if empty or previously auto-set AND user didn't manually touch it
//       if ((checkEmpty || checkWasAuto) && !nameAutoRef.current.checkTouched) {
//         updates.checkName = reg;
//         nameAutoRef.current.checkLastAuto = reg;
//       }

//       return updates;
//     };

//     useEffect(() => {
//       if (!isEditing) return;

//       const desired = sl === "SU" ? "WC" : sl === "EM" ? "WI" : "";
//       if (!desired) {
//         taxAutoRef.current.lastSl = sl;
//         return;
//       }

//       const current = normalizeUpper(form?.taxClass || "");

//       const wasAuto = current && current === taxAutoRef.current.lastAutoValue;
//       const isEmpty = !current;

//       // If SL type changed, we can auto-update only if:
//       // - taxClass empty OR taxClass was previously auto-set OR user hasn't touched
//       const slChanged = taxAutoRef.current.lastSl !== sl;

//       if (slChanged) {
//         // if user already picked something manually AND it's not the previous auto value, don't override
//         if (taxAutoRef.current.userTouched && !wasAuto && !isEmpty) {
//           taxAutoRef.current.lastSl = sl;
//           return;
//         }
//       }

//       if (isEmpty || wasAuto) {
//         taxAutoRef.current.lastAutoValue = desired;
//         taxAutoRef.current.userTouched = false; // reset because we’re applying a default
//         onChangeForm({ taxClass: desired });
//       }

//       taxAutoRef.current.lastSl = sl;
//       // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [sl, isEditing]);


//     useEffect(() => {
//       if (!isEditing) return;

//       const slChanged = nameAutoRef.current.lastSl !== sl;
//       if (slChanged) {
//         // reset touch flags on SL change (fresh defaults)
//         nameAutoRef.current.businessTouched = false;
//         nameAutoRef.current.checkTouched = false;
//         nameAutoRef.current.businessLastAuto = "";
//         nameAutoRef.current.checkLastAuto = "";
//       }
//       nameAutoRef.current.lastSl = sl;
//       // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [sl, isEditing]);


//     // Lookup modal states
//     const [isCustLookupOpen, setIsCustLookupOpen] = useState(false);
//     const [isVendLookupOpen, setIsVendLookupOpen] = useState(false);
//     const [isBranchLookupOpen, setIsBranchLookupOpen] = useState(false);
//     const [isATCLookupOpen, setIsATCLookupOpen] = useState(false);
//     const [isVATLookupOpen, setIsVATLookupOpen] = useState(false);
//     const [isAPAcctLookupOpen, setIsAPAcctLookupOpen] = useState(false);
//     const [isPayTermLookupOpen, setIsPayTermLookupOpen] = useState(false);
//     const [isBillingTermLookupOpen, setIsBillingTermLookupOpen] = useState(false);
//     const [isCurrLookupOpen, setIsCurrLookupOpen] = useState(false);

//     useEffect(() => {
//       if (!isEditing) return;

//       // Employee: First/Middle/Last drives Registered/Business/Check Names
//       if (isEmployee) {
//         const reg = buildRegisteredName(form.firstName, form.middleName, form.lastName);
//         const updates = {};
//         if ((form[f.name] || "") !== reg) updates[f.name] = reg;

//         applyAutoNames(updates, reg);

//         if (Object.keys(updates).length) onChangeForm(updates);
//       }

//       // Supplier: if Registered Name is present, default Business & Check when blank
//       if (isSupplier) {
//         const reg = form[f.name] || "";
//         if (String(reg || "").trim()) {
//           const updates = {};
//           applyAutoNames(updates, reg);
//           if (Object.keys(updates).length) onChangeForm(updates);
//         }
//       }
//       // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [isEmployee, isSupplier, isEditing, form.firstName, form.middleName, form.lastName, form[f.name]]);


//     // const openPayeeLookup = () => {
//     //   if (isLoading) return;
//     //   setIsSearchOpen(true);
//     // };

//     const openPayeeLookup = () => {
//       if (isLoading) return;

//       // ✅ Open correct lookup based on mode
//       if (isVendor) setIsVendLookupOpen(true);
//       else setIsCustLookupOpen(true);
//     };

//     return (
//       <>
//         {/* ============================================================
//        CUSTOMER
//     ============================================================ */}
//         {isCustomer ? (
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start rounded-lg relative">

//             {/* ================= LEFT COLUMN ================= */}
//             <div className="flex flex-col gap-6">

//               {/* BASIC INFORMATION */}
//               <Card className="border border-blue-500/30 p-6 rounded-lg">
//                 <SectionHeader title="BASIC INFORMATION" />

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                   <FieldRenderer
//                     label="SL Type"
//                     type="select"
//                     value={form.sltypeCode}
//                     options={sltypeOptions}
//                     onChange={(v) => onChangeForm({ sltypeCode: v })}
//                     readOnly={isReadOnly}
//                     disabled={isDisabled}
//                   />

//                   <FieldRenderer
//                     label="Active?"
//                     type="select"
//                     value={form.active}
//                     options={activeOptions}
//                     onChange={(v) => onChangeForm({ active: v })}
//                     readOnly={isReadOnly}
//                     disabled={isDisabled}
//                   />
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                   {/* Payee/Customer Code (kept as you currently designed: lookup + not editable) */}
//                   <FieldRenderer
//                     label={isVendor ? "Payee Code" : "Customer Code"}
//                     required
//                     type="lookup"
//                     value={form[f.code] || ""}
//                     onLookup={openPayeeLookup}
//                     readOnly={true}
//                     disabled={isLoading}
//                     maxLength={getLen(col.code, 20)}
//                   />

//                   <FieldRenderer
//                     label="Tax Rate Class"
//                     required
//                     type="select"
//                     value={normalizeUpper(form.taxClass || "")}
//                     options={mappedTaxClassOptions}
//                     onChange={handleTaxClassChange}     // ✅ user-touch tracking
//                     readOnly={isReadOnly}
//                     disabled={isDisabled}
//                   />
//                 </div>

//                 <FieldRenderer
//                   label="Registered Name"
//                   required
//                   type="text"
//                   value={form[f.name] || ""}
//                   onChange={(v) => {
//                     const updates = { [f.name]: v };
//                     if (isSupplier) applyAutoNames(updates, v);
//                     onChangeForm(updates);
//                   }}
//                   readOnly={isReadOnly || isEmployee}
//                   disabled={isDisabled || isEmployee}
//                   maxLength={getLen(isVendor ? "vend_name" : "cust_name", 150)} // ✅
//                 />


//                 <FieldRenderer
//                   label="Business Name"
//                   required
//                   type="text"
//                   value={form.businessName || ""}
//                   onChange={handleBusinessNameChange}
//                   readOnly={isReadOnly || isEmployee}
//                   disabled={isDisabled || isEmployee}
//                 />

//                 <FieldRenderer
//                   label="Check Name"
//                   type="text"
//                   value={form.checkName || ""}
//                   onChange={handleCheckNameChange}
//                   readOnly={isReadOnly}
//                   disabled={isDisabled}
//                 />

//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
//                   <FieldRenderer
//                     label="First Name"
//                     type="text"
//                     value={form.firstName || ""}
//                     onChange={(v) => {
//                       const updates = { firstName: v };
//                       if (isEmployee) {
//                         const reg = buildRegisteredName(v, form.middleName, form.lastName);
//                         updates[f.name] = reg;
//                         applyAutoNames(updates, reg);
//                       }
//                       onChangeForm(updates);
//                     }}
//                     readOnly={isReadOnly}
//                     disabled={isDisabled || isSupplier}
//                   />

//                   <FieldRenderer
//                     label="Middle Name"
//                     type="text"
//                     value={form.middleName || ""}
//                     onChange={(v) => {
//                       const updates = { middleName: v };
//                       if (isEmployee) {
//                         const reg = buildRegisteredName(form.firstName, v, form.lastName);
//                         updates[f.name] = reg;
//                         applyAutoNames(updates, reg);
//                       }
//                       onChangeForm(updates);
//                     }}
//                     readOnly={isReadOnly}
//                     disabled={isDisabled || isSupplier}
//                   />

//                   <FieldRenderer
//                     label="Last Name"
//                     type="text"
//                     value={form.lastName || ""}
//                     onChange={(v) => {
//                       const updates = { lastName: v };
//                       if (isEmployee) {
//                         const reg = buildRegisteredName(form.firstName, form.middleName, v);
//                         updates[f.name] = reg;
//                         applyAutoNames(updates, reg);
//                       }
//                       onChangeForm(updates);
//                     }}
//                     readOnly={isReadOnly}
//                     disabled={isDisabled || isSupplier}
//                   />
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
//                   <FieldRenderer
//                     label="Old Code"
//                     type="text"
//                     value={form.oldCode || ""}
//                     onChange={(v) => onChangeForm({ oldCode: v })}
//                     readOnly={isReadOnly}
//                     disabled={isDisabled}
//                   />

//                   <FieldRenderer
//                     label="Branch"
//                     type="lookup"
//                     value={form.branchCode || ""}
//                     onLookup={isDisabled ? undefined : () => setIsBranchLookupOpen(true)}
//                     readOnly={isReadOnly}
//                     disabled={isDisabled}
//                   />

//                   <FieldRenderer
//                     label="Payee Type"
//                     type={payeeTypeOptions?.length ? "select" : "text"}
//                     value={form.payeeType || ""}
//                     options={payeeTypeOptions}
//                     onChange={(v) => onChangeForm({ payeeType: v })}
//                     readOnly={isReadOnly}
//                     disabled={isDisabled}
//                   />
//                 </div>
//               </Card>

//               {/* CONTACT INFORMATION */}
//               <Card className="border border-blue-500/30 p-6 rounded-lg ">
//                 <SectionHeader title="CONTACT INFORMATION" />

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                   <FieldRenderer
//                     label="Contact Person"
//                     type="text"
//                     value={form[f.contact] || ""}
//                     onChange={(v) => onChangeForm({ [f.contact]: v })}
//                     readOnly={isReadOnly}
//                     disabled={isDisabled}
//                   />

//                   <FieldRenderer
//                     label="Position"
//                     type="text"
//                     value={form[f.position] || ""}
//                     onChange={(v) => onChangeForm({ [f.position]: v })}
//                     readOnly={isReadOnly}
//                     disabled={isDisabled}
//                   />
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                   <FieldRenderer
//                     label="Telephone No."
//                     type="text"
//                     value={form[f.tel] || ""}
//                     onChange={(v) => onChangeForm({ [f.tel]: v })}
//                     readOnly={isReadOnly}
//                     disabled={isDisabled}
//                   />

//                   <FieldRenderer
//                     label={isVendor ? "Mobile No." : "Fax No."}
//                     type="text"
//                     value={isVendor ? (form[f.mobile] || "") : (form.custFaxNo || "")}
//                     onChange={(v) =>
//                       isVendor ? onChangeForm({ [f.mobile]: v }) : onChangeForm({ custFaxNo: v })
//                     }
//                     readOnly={isReadOnly}
//                     disabled={isDisabled}
//                   />
//                 </div>

//                 <FieldRenderer
//                   label="Email Address"
//                   type="text"
//                   value={form[f.email] || ""}
//                   onChange={(v) => onChangeForm({ [f.email]: v })}
//                   readOnly={isReadOnly}
//                   disabled={isDisabled}
//                 />

//                 <FieldRenderer
//                   label="Address 1"
//                   required
//                   type="text"
//                   value={form[f.addr1] || ""}
//                   onChange={(v) => onChangeForm({ [f.addr1]: v })}
//                   readOnly={isReadOnly}
//                   disabled={isDisabled}
//                 />

//                 <FieldRenderer
//                   label="Address 2"
//                   type="text"
//                   value={form[f.addr2] || ""}
//                   onChange={(v) => onChangeForm({ [f.addr2]: v })}
//                   readOnly={isReadOnly}
//                   disabled={isDisabled}
//                 />

//                 <FieldRenderer
//                   label="Address 3"
//                   type="text"
//                   value={form[f.addr3] || ""}
//                   onChange={(v) => onChangeForm({ [f.addr3]: v })}
//                   readOnly={isReadOnly}
//                   disabled={isDisabled}
//                 />

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                   <FieldRenderer
//                     label="ZIP Code"
//                     type="text"
//                     value={form[f.zip] || ""}
//                     onChange={(v) => onChangeForm({ [f.zip]: v })}
//                     readOnly={isReadOnly}
//                     disabled={isDisabled}
//                   />

//                   <FieldRenderer
//                     label="Source"
//                     required
//                     type="select"
//                     value={form.source || ""}
//                     options={sourceOptions}
//                     onChange={(v) => onChangeForm({ source: v })}
//                     readOnly={isReadOnly}
//                     disabled={isDisabled}
//                   />
//                 </div>
//               </Card>

//             </div>

//             {/* ================= RIGHT COLUMN ================= */}
//             <div className="flex flex-col gap-6">

//               <Card className="border border-blue-500/30 p-6 rounded-lg ">

//                 {/* TABS */}
//                 <div className="flex border-b border-gray-300 mb-4">
//                   {[
//                     { id: "sales", label: "Sales & A/R Information" },
//                     { id: "other1", label: "Other Information 1" },
//                     { id: "other2", label: "Other Information 2" },
//                   ].map((tab) => (
//                     <button
//                       key={tab.id}
//                       type="button"
//                       onClick={() => setSalesTab(tab.id)}
//                       className={`px-4 py-2 text-sm font-semibold transition-all duration-200
//                     ${salesTab === tab.id
//                           ? "border-b-2 border-blue-600 text-blue-600"
//                           : "text-gray-500 hover:text-blue-600"
//                         }`}
//                     >
//                       {tab.label}
//                     </button>
//                   ))}
//                 </div>

//                 {/* SALES TAB */}
//                 {salesTab === "sales" && (
//                   <>
//                     <SectionHeader title="SALES INFORMATION" />
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                       {/* ROW 1 */}
//                       <FieldRenderer
//                         label="Sales Rep."
//                         required
//                         type="lookup"
//                         value={form.salesRep || ""}
//                         onLookup={isDisabled ? undefined : () => setIsSalesRepLookupOpen?.(true)}
//                         readOnly={isReadOnly}
//                         disabled={isDisabled}
//                       />

//                       <FieldRenderer
//                         label="Customer Type"
//                         type="select"
//                         value={form.customerType || ""}
//                         // options={customerTypeOptions || []}
//                         options={[]}
//                         onChange={(v) => onChangeForm({ customerType: v })}
//                         readOnly={isReadOnly}
//                         disabled={isDisabled}
//                       />

//                       {/* ROW 2 */}
//                       <FieldRenderer
//                         label="Area"
//                         type="select"
//                         value={form.area || ""}
//                         // options={areaOptions || []}
//                         options={[]}
//                         onChange={(v) => onChangeForm({ area: v })}
//                         readOnly={isReadOnly}
//                         disabled={isDisabled}
//                       />

//                       <FieldRenderer
//                         label="Zone"
//                         type="select"
//                         value={form.zone || ""}
//                         // options={zoneOptions || []}
//                         options={[]}
//                         onChange={(v) => onChangeForm({ zone: v })}
//                         readOnly={isReadOnly}
//                         disabled={isDisabled}
//                       />

//                       {/* ROW 3 */}
//                       <FieldRenderer
//                         label="Chain Flag"
//                         type="select"
//                         value={form.chainFlag || ""}
//                         // options={chainFlagOptions || []}
//                         options={[]}
//                         onChange={(v) => onChangeForm({ chainFlag: v })}
//                         readOnly={isReadOnly}
//                         disabled={isDisabled}
//                       />

//                       <FieldRenderer
//                         label="Customer Since"
//                         type="date"
//                         value={form.customerSince || ""}
//                         onChange={(v) => onChangeForm({ customerSince: v })}
//                         readOnly={isReadOnly}
//                         disabled={isDisabled}
//                       />

//                       {/* ROW 4 */}
//                       <FieldRenderer
//                         label="Chain Code"
//                         type="lookup"
//                         value={form.chainCode || ""}
//                         onLookup={isDisabled ? undefined : () => setIsChainLookupOpen?.(true)}
//                         readOnly={isReadOnly}
//                         disabled={isDisabled}
//                       />

//                       <FieldRenderer
//                         label="Chain Customer"
//                         type="lookup"
//                         value={form.chainCustomer || ""}
//                         onLookup={isDisabled ? undefined : () => setIsChainCustomerLookupOpen?.(true)}
//                         readOnly={isReadOnly}
//                         disabled={isDisabled}
//                       />

//                       {/* ROW 5 (Full Width) */}
//                       <div className="md:col-span-2">
//                         <FieldRenderer
//                           label="Shipping Lines"
//                           type="select"
//                           value={form.shippingLines || ""}
//                           // options={shippingLineOptions || []}
//                           options={[]}
//                           onChange={(v) => onChangeForm({ shippingLines: v })}
//                           readOnly={isReadOnly}
//                           disabled={isDisabled}
//                         />
//                       </div>

//                       {/* ROW 6 */}
//                       <FieldRenderer
//                         label="Source"
//                         required
//                         type="select"
//                         value={form.source || ""}
//                         // options={sourceOptions || []}
//                         options={[]}
//                         onChange={(v) => onChangeForm({ source: v })}
//                         readOnly={isReadOnly}
//                         disabled={isDisabled}
//                       />

//                       <FieldRenderer
//                         label="Currency"
//                         type="lookup"
//                         value={form.currCode || ""}
//                         onLookup={isDisabled ? undefined : () => setIsCurrLookupOpen(true)}
//                         readOnly={isReadOnly}
//                         disabled={isDisabled}
//                       />

//                       {/* ROW 7 */}
//                       <FieldRenderer
//                         label="Price Group"
//                         type="select"
//                         value={form.priceGroup || ""}
//                         // options={priceGroupOptions || []}
//                         options={[]}
//                         onChange={(v) => onChangeForm({ priceGroup: v })}
//                         readOnly={isReadOnly}
//                         disabled={isDisabled}
//                       />

//                       <FieldRenderer
//                         label="Direct SI/DR WH"
//                         type="lookup"
//                         value={form.directWarehouse || ""}
//                         onLookup={isDisabled ? undefined : () => setIsWarehouseLookupOpen?.(true)}
//                         readOnly={isReadOnly}
//                         disabled={isDisabled}
//                       />

//                     </div>


//                     <SectionHeader title="ACCOUNTING INFORMATION" />

//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                       <FieldRenderer
//                         label="TIN"
//                         required
//                         type="text"
//                         value={form[f.tin] || ""}
//                         onChange={(v) => onChangeForm({ [f.tin]: v, tin: v })}
//                         readOnly={isReadOnly}
//                         disabled={isDisabled}
//                         maxLength={getLen(col.tin, 50)}
//                       />

//                       <FieldRenderer
//                         label="ATC (Goods)"
//                         type="lookup"
//                         value={form.atcGoodsCode || ""}
//                         onLookup={isDisabled ? undefined : () => setIsATCGoodsLookupOpen(true)}
//                         readOnly={isReadOnly}
//                         disabled={isDisabled}
//                       />


//                     </div>

//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">


//                       <FieldRenderer
//                         label="ATC (Service)"
//                         type="lookup"
//                         value={form.atcServiceCode || ""}
//                         onLookup={isDisabled ? undefined : () => setIsATCServiceLookupOpen(true)}
//                         readOnly={isReadOnly}
//                         disabled={isDisabled}
//                       />
//                       <FieldRenderer
//                         label="ATC (Rental)"
//                         type="lookup"
//                         value={form.atcRentalCode || ""}
//                         onLookup={isDisabled ? undefined : () => setIsATCRentalLookupOpen(true)}
//                         readOnly={isReadOnly}
//                         disabled={isDisabled}
//                       />
//                     </div>

//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">


//                       <FieldRenderer
//                         label="VAT Code"
//                         required
//                         type="lookup"
//                         value={form.vatCode || ""}
//                         onLookup={isDisabled ? undefined : () => setIsVATLookupOpen(true)}
//                         readOnly={isReadOnly}
//                         disabled={isDisabled}
//                       />

//                       <FieldRenderer
//                         label="Billing Terms"
//                         required
//                         type="lookup"
//                         value={form.billtermCode || ""}                 // ✅ store/display code
//                         onLookup={isDisabled ? undefined : () => setIsBillingTermLookupOpen(true)}
//                         readOnly={isReadOnly}
//                         disabled={isDisabled}
//                         maxLength={getLen(col.billtermCode, 20)}        // ✅ optional
//                       />
//                     </div>

//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">


//                       <FieldRenderer
//                         label="Business Style"
//                         type="select"
//                         value={form.businessStyle || ""}
//                         options={[]} // put your options here
//                         onChange={(v) => onChangeForm({ businessStyle: v })}
//                         readOnly={isReadOnly}
//                         disabled={isDisabled}
//                       />
//                     </div>


//                   </>
//                 )}

//                 {/* OTHER INFO 1 */}
//                 {salesTab === "other1" && (
//                   <>
//                     <SectionHeader title="REGISTRATION INFORMATION" />
//                     <RegistrationInfo
//                       layout="twoCols"
//                       disabled
//                       data={{
//                         registeredBy: form.registeredBy || "",
//                         registeredDate: form.registeredDate || "",
//                         lastUpdatedBy: form.updatedBy || "",
//                         lastUpdatedDate: form.updatedDate || "",
//                       }}
//                     />
//                   </>
//                 )}

//                 {/* OTHER INFO 2 */}
//                 {salesTab === "other2" && (
//                   <>
//                     <SectionHeader title="REGISTRATION INFORMATION" />
//                     <RegistrationInfo
//                       layout="twoCols"
//                       disabled
//                       data={{
//                         registeredBy: form.registeredBy || "",
//                         registeredDate: form.registeredDate || "",
//                         lastUpdatedBy: form.updatedBy || "",
//                         lastUpdatedDate: form.updatedDate || "",
//                       }}
//                     />
//                   </>
//                 )}

//               </Card>

//             </div>
//           </div>
//         ) : (

//           /* ============================================================
//              PAYEE / VENDOR MODE (ORIGINAL LAYOUT)
//           ============================================================ */
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start rounded-lg relative">

//             {/* BASIC INFORMATION */}
//             <Card className="border border-blue-500/30 p-6 rounded-lg ">
//               <SectionHeader title="BASIC INFORMATION" />
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                 <FieldRenderer
//                   label="SL Type"
//                   type="select"
//                   value={form.sltypeCode}
//                   options={sltypeOptions}
//                   onChange={(v) => onChangeForm({ sltypeCode: v })}
//                   readOnly={isReadOnly}
//                   disabled={isDisabled}
//                 />

//                 <FieldRenderer
//                   label="Active?"
//                   type="select"
//                   value={form.active}
//                   options={activeOptions}
//                   onChange={(v) => onChangeForm({ active: v })}
//                   readOnly={isReadOnly}
//                   disabled={isDisabled}
//                 />
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                 {/* Payee/Customer Code (kept as you currently designed: lookup + not editable) */}
//                 {/* Payee/Customer Code (Lookup is clickable even in view mode) */}
//                 <FieldRenderer
//                   label={isVendor ? "Payee Code" : "Customer Code"}
//                   required
//                   type="lookup"
//                   value={form[f.code] || ""}
//                   onLookup={openPayeeLookup}   // ✅ always works
//                   readOnly={true}              // ✅ can't type
//                   disabled={isLoading}         // ✅ only disable when loading
//                 />

//                 <FieldRenderer
//                   label="Tax Rate Class"
//                   required
//                   type="select"
//                   value={normalizeUpper(form.taxClass || "")}
//                   options={mappedTaxClassOptions}
//                   onChange={handleTaxClassChange}     // ✅ user-touch tracking
//                   readOnly={isReadOnly}
//                   disabled={isDisabled}
//                 />
//               </div>
//               <FieldRenderer
//                 label="Registered Name"
//                 required
//                 type="text"
//                 value={form[f.name] || ""}
//                 onChange={(v) => {
//                   const updates = { [f.name]: v };
//                   if (isSupplier) applyAutoNames(updates, v);
//                   onChangeForm(updates);
//                 }}
//                 readOnly={isReadOnly || isEmployee}
//                 disabled={isDisabled || isEmployee}
//                 maxLength={getLen(col.name, 150)}
//               />

//               <FieldRenderer
//                 label="Business Name"
//                 required
//                 type="text"
//                 value={form.businessName || ""}
//                 onChange={handleBusinessNameChange}
//                 readOnly={isReadOnly || isEmployee}
//                 disabled={isDisabled || isEmployee}
//                 maxLength={getLen("business_name", 150)}
//               />

//               <FieldRenderer
//                 label="Check Name"
//                 type="text"
//                 value={form.checkName || ""}
//                 onChange={handleCheckNameChange}
//                 readOnly={isReadOnly}
//                 disabled={isDisabled}
//                 maxLength={getLen("check_name", 150)}
//               />

//               <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
//                 <FieldRenderer
//                   label="First Name"
//                   type="text"
//                   value={form.firstName || ""}
//                   onChange={(v) => {
//                     const updates = { firstName: v };
//                     if (isEmployee) {
//                       const reg = buildRegisteredName(v, form.middleName, form.lastName);
//                       updates[f.name] = reg;
//                       applyAutoNames(updates, reg);
//                     }
//                     onChangeForm(updates);
//                   }}
//                   readOnly={isReadOnly}
//                   disabled={isDisabled || isSupplier}
//                   maxLength={getLen("first_name", 50)}
//                 />

//                 <FieldRenderer
//                   label="Middle Name"
//                   type="text"
//                   value={form.middleName || ""}
//                   onChange={(v) => {
//                     const updates = { middleName: v };
//                     if (isEmployee) {
//                       const reg = buildRegisteredName(form.firstName, v, form.lastName);
//                       updates[f.name] = reg;
//                       applyAutoNames(updates, reg);
//                     }
//                     onChangeForm(updates);
//                   }}
//                   readOnly={isReadOnly}
//                   disabled={isDisabled || isSupplier}
//                   maxLength={getLen("middle_name", 50)}
//                 />

//                 <FieldRenderer
//                   label="Last Name"
//                   type="text"
//                   value={form.lastName || ""}
//                   onChange={(v) => {
//                     const updates = { lastName: v };
//                     if (isEmployee) {
//                       const reg = buildRegisteredName(form.firstName, form.middleName, v);
//                       updates[f.name] = reg;
//                       applyAutoNames(updates, reg);
//                     }
//                     onChangeForm(updates);
//                   }}
//                   readOnly={isReadOnly}
//                   disabled={isDisabled || isSupplier}
//                   maxLength={getLen("last_name", 50)}
//                 />
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
//                 <FieldRenderer
//                   label="Old Code"
//                   type="text"
//                   value={form.oldCode || ""}
//                   onChange={(v) => onChangeForm({ oldCode: v })}
//                   readOnly={isReadOnly}
//                   disabled={isDisabled}
//                 />

//                 <FieldRenderer
//                   label="Branch"
//                   type="lookup"
//                   value={form.branchCode || ""}
//                   onLookup={isDisabled ? undefined : () => setIsBranchLookupOpen(true)}
//                   readOnly={isReadOnly}
//                   disabled={isDisabled}
//                 />

//                 <FieldRenderer
//                   label="Payee Type"
//                   type={payeeTypeOptions?.length ? "select" : "text"}
//                   value={form.payeeType || ""}
//                   options={payeeTypeOptions}
//                   onChange={(v) => onChangeForm({ payeeType: v })}
//                   readOnly={isReadOnly}
//                   disabled={isDisabled}
//                 />
//               </div>
//             </Card>

//             {/* CONTACT INFORMATION */}
//             <Card className="border border-blue-500/30 p-6 rounded-lg ">
//               <SectionHeader title="CONTACT INFORMATION" />

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                 <FieldRenderer
//                   label="Contact Person"
//                   type="text"
//                   value={form[f.contact] || ""}
//                   onChange={(v) => onChangeForm({ [f.contact]: v })}
//                   readOnly={isReadOnly}
//                   disabled={isDisabled}
//                   maxLength={getLen(col.contact, 100)}
//                 />

//                 <FieldRenderer
//                   label="Position"
//                   type="text"
//                   value={form[f.position] || ""}
//                   onChange={(v) => onChangeForm({ [f.position]: v })}
//                   readOnly={isReadOnly}
//                   disabled={isDisabled}
//                   maxLength={getLen(col.position, 50)}
//                 />
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                 <FieldRenderer
//                   label="Telephone No."
//                   type="text"
//                   value={form[f.tel] || ""}
//                   onChange={(v) => onChangeForm({ [f.tel]: v })}
//                   readOnly={isReadOnly}
//                   disabled={isDisabled}
//                   maxLength={getLen(col.tel, 30)}
//                 />

//                 <FieldRenderer
//                   label={isVendor ? "Mobile No." : "Fax No."}
//                   type="text"
//                   value={isVendor ? (form[f.mobile] || "") : (form.custFaxNo || "")}
//                   onChange={(v) =>
//                     isVendor ? onChangeForm({ [f.mobile]: v }) : onChangeForm({ custFaxNo: v })
//                   }
//                   readOnly={isReadOnly}
//                   disabled={isDisabled}
//                   mmaxLength={getLen(col.mobile, 30)} axLength={getLen(isVendor ? "mobile" : "cust_fax_no", 30)}
//                 />
//               </div>

//               <FieldRenderer
//                 label="Email Address"
//                 type="text"
//                 value={form[f.email] || ""}
//                 onChange={(v) => onChangeForm({ [f.email]: v })}
//                 readOnly={isReadOnly}
//                 disabled={isDisabled}
//                 maxLength={getLen(col.email, 100)}
//               />

//               <FieldRenderer
//                 label="Address 1"
//                 required
//                 type="text"
//                 value={form[f.addr1] || ""}
//                 onChange={(v) => onChangeForm({ [f.addr1]: v })}
//                 readOnly={isReadOnly}
//                 disabled={isDisabled}
//                 maxLength={getLen(col.addr1, 200)}
//               />

//               <FieldRenderer
//                 label="Address 2"
//                 type="text"
//                 value={form[f.addr2] || ""}
//                 onChange={(v) => onChangeForm({ [f.addr2]: v })}
//                 readOnly={isReadOnly}
//                 disabled={isDisabled}
//                 maxLength={getLen(col.addr2, 200)}

//               />

//               <FieldRenderer
//                 label="Address 3"
//                 type="text"
//                 value={form[f.addr3] || ""}
//                 onChange={(v) => onChangeForm({ [f.addr3]: v })}
//                 readOnly={isReadOnly}
//                 disabled={isDisabled}
//                 maxLength={getLen(col.addr3, 200)}
//               />

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                 <FieldRenderer
//                   label="ZIP Code"
//                   type="text"
//                   value={form[f.zip] || ""}
//                   onChange={(v) => onChangeForm({ [f.zip]: v })}
//                   readOnly={isReadOnly}
//                   disabled={isDisabled}
//                   maxLength={getLen(col.zip, 20)}
//                 />

//                 <FieldRenderer
//                   label="Source"
//                   required
//                   type="select"
//                   value={form.source || ""}
//                   options={sourceOptions}
//                   onChange={(v) => onChangeForm({ source: v })}
//                   readOnly={isReadOnly}
//                   disabled={isDisabled}
//                 />
//               </div>
//             </Card>



//             {/* CARD 3: ACCOUNTING INFORMATION */}
//             <Card className="border border-blue-500/30 p-4 rounded-lg  self-start !h-fit !min-h-0">
//               <SectionHeader title="ACCOUNTING INFORMATION" />

//               <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
//                 <FieldRenderer
//                   label="TIN"
//                   required
//                   type="text"
//                   value={form.vendTin || form.custTin || form.vend_tin || form.cust_tin || form.tin || ""}
//                   onChange={(v) =>
//                     onChangeForm({
//                       vendTin: v,
//                       custTin: v,
//                       tin: v,
//                     })
//                   }
//                   readOnly={isReadOnly}
//                   disabled={isDisabled}
//                   maxLength={getLen(col.tin, 50)}
//                 />

//                 <FieldRenderer
//                   label="Default ATC"
//                   type="lookup"
//                   value={form.atcCode || ""}
//                   onLookup={isDisabled ? undefined : () => setIsATCLookupOpen(true)}
//                   readOnly={isReadOnly}
//                   disabled={isDisabled}
//                   maxLength={getLen(col.atcCode, 50)}
//                 />

//                 <FieldRenderer
//                   label="Default VAT"
//                   type="lookup"
//                   value={form.vatCode || ""}
//                   onLookup={isDisabled ? undefined : () => setIsVATLookupOpen(true)}
//                   readOnly={isReadOnly}
//                   disabled={isDisabled}
//                   maxLength={getLen(col.vatCode, 50)}
//                 />
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
//                 <FieldRenderer
//                   label="Default Payment Terms"
//                   required
//                   type="lookup"
//                   value={form.paytermCode || ""}
//                   onLookup={isDisabled ? undefined : () => setIsPayTermLookupOpen(true)}
//                   readOnly={isReadOnly}
//                   disabled={isDisabled}
//                   maxLength={getLen(col.paytermCode, 50)}
//                 />

//                 <FieldRenderer
//                   label="Default A/P Account"
//                   required
//                   type="lookup"
//                   value={form.acctCode || ""}
//                   onLookup={isDisabled ? undefined : () => setIsAPAcctLookupOpen(true)}
//                   readOnly={isReadOnly}
//                   disabled={isDisabled}
//                   maxLength={getLen(col.acctCode, 50)}
//                 />

//                 <FieldRenderer
//                   label="Currency"
//                   type="lookup"
//                   value={form.currCode || ""}
//                   onLookup={isDisabled ? undefined : () => setIsCurrLookupOpen(true)}
//                   readOnly={isReadOnly}
//                   disabled={isDisabled}
//                 />


//               </div>
//             </Card>


//             {/* REGISTRATION INFORMATION */}

//             <RegistrationInfo
//               layout="twoCols"
//               disabled
//               data={{
//                 registeredBy: form.registeredBy || "",
//                 registeredDate: form.registeredDate || "",
//                 lastUpdatedBy: form.updatedBy || "",
//                 lastUpdatedDate: form.updatedDate || "",
//               }}
//             />



//           </div>
//         )}

//         {/* LOOKUP MODALS */}
//         {/* <SearchCusMast
//           isOpen={isCustLookupOpen}
//           customParam="ActiveAll"
//           onClose={async (selected) => {
//             setIsCustLookupOpen(false);
//             if (!selected) return;

//             const code = selected?.custCode ?? selected?.cust_code ?? "";
//             if (!code) return;

//             onChangeForm({
//               custCode: code,
//               __isNew: false,
//             });

//             await onSelectCustomerCode?.(code);
//           }}
//         />

//         <SearchVendMast
//           isOpen={isVendLookupOpen}
//           customParam="ActiveAll"
//           endpoint="/lookupVendMast"
//           onClose={async (selected) => {
//             setIsVendLookupOpen(false);
//             if (!selected) return;

//             const code = selected?.vendCode ?? selected?.vend_code ?? "";
//             if (!code) return;

//             onChangeForm({
//               vendCode: code,
//               __isNew: false,
//             });

//             await onSelectCustomerCode?.(code);
//           }}
//         /> */}

//         {/* LOOKUP MODALS */}
//         <SearchCusMast
//           isOpen={isCustLookupOpen}
//           customParam="ActiveAll"
//           onClose={async (selected) => {
//             setIsCustLookupOpen(false);
//             if (!selected) return;

//             const code = selected?.custCode ?? selected?.cust_code ?? "";
//             const tin = selected?.custTin ?? selected?.cust_tin ?? selected?.tin ?? "";
//             if (!code) return;

//             // ✅ update form
//             onChangeForm({
//               custCode: code,
//               custTin: tin,
//               tin: tin,
//               __isNew: false,
//             });

//             // ✅ fetch full record in parent (CustMast)
//             await onSelectCustomerCode?.(code);
//           }}
//         />

//         <SearchVendMast
//           isOpen={isVendLookupOpen}
//           customParam="ActiveAll"
//           endpoint="/lookupVendMast"
//           onClose={async (selected) => {
//             setIsVendLookupOpen(false);
//             if (!selected) return;

//             const code = selected?.vendCode ?? selected?.vend_code ?? "";
//             const tin = selected?.vendTin ?? selected?.vend_tin ?? selected?.tin ?? "";
//             if (!code) return;

//             // ✅ update form
//             onChangeForm({
//               vendCode: code,
//               vendTin: tin,
//               tin: tin,
//               __isNew: false,
//             });

//             // ✅ fetch full record in parent (VendMast)
//             await onSelectCustomerCode?.(code);
//           }}
//         />

//         <SearchBranchRef
//           isOpen={isBranchLookupOpen}
//           onClose={(selected) => {
//             setIsBranchLookupOpen(false);
//             if (!selected) return;
//             const branchCode = selected?.branchCode ?? selected?.branch_code ?? "";
//             if (!branchCode) return;
//             onChangeForm({ branchCode });
//           }}
//         />

//         <SearchATCRef
//           isOpen={isATCLookupOpen}
//           onClose={(selected) => {
//             setIsATCLookupOpen(false);
//             if (!selected) return;
//             const atcCode = selected?.atcCode ?? selected?.atc_code ?? "";
//             if (!atcCode) return;
//             onChangeForm({ atcCode });
//           }}
//         />

//         <SearchATCRef
//           isOpen={isATCGoodsLookupOpen}
//           onClose={(selected) => {
//             setIsATCGoodsLookupOpen(false);
//             if (!selected) return;
//             const atc = selected?.atcCode ?? selected?.atc_code ?? "";
//             if (!atc) return;
//             onChangeForm({ atcGoodsCode: atc });
//           }}
//         />

//         <SearchATCRef
//           isOpen={isATCServiceLookupOpen}
//           onClose={(selected) => {
//             setIsATCServiceLookupOpen(false);
//             if (!selected) return;
//             const atc = selected?.atcCode ?? selected?.atc_code ?? "";
//             if (!atc) return;
//             onChangeForm({ atcServiceCode: atc });
//           }}
//         />

//         <SearchATCRef
//           isOpen={isATCRentalLookupOpen}
//           onClose={(selected) => {
//             setIsATCRentalLookupOpen(false);
//             if (!selected) return;
//             const atc = selected?.atcCode ?? selected?.atc_code ?? "";
//             if (!atc) return;
//             onChangeForm({ atcRentalCode: atc });
//           }}
//         />

//         <SearchVATRef
//           isOpen={isVATLookupOpen}
//           onClose={(selected) => {
//             setIsVATLookupOpen(false);
//             if (!selected) return;
//             const vatCode = selected?.vatCode ?? selected?.vat_code ?? "";
//             if (!vatCode) return;
//             onChangeForm({ vatCode });
//           }}
//         />

//         <SearchPayTermRef
//           isOpen={isPayTermLookupOpen}
//           onClose={(selected) => {
//             setIsPayTermLookupOpen(false);
//             if (!selected) return;
//             onChangeForm({
//               paytermCode: selected.paytermCode,
//               paytermName: selected.paytermName,
//             });
//           }}
//         />

//         <SearchBillTermRef
//           isOpen={isBillingTermLookupOpen}
//           onClose={(selected) => {
//             setIsBillingTermLookupOpen(false);
//             if (!selected) return;

//             const code =
//               selected?.billtermCode ??
//               selected?.billterm_code ??
//               selected?.code ??
//               "";

//             const name =
//               selected?.billtermName ??
//               selected?.billterm_name ??
//               selected?.name ??
//               "";

//             if (!code) return;

//             onChangeForm({
//               billtermCode: code,
//               billtermName: name,
//             });
//           }}
//         />

//         <SearchCOAMast
//           isOpen={isAPAcctLookupOpen}
//           customParam="APGL"
//           source="AP"
//           onClose={(selected) => {
//             setIsAPAcctLookupOpen(false);
//             if (!selected) return;

//             onChangeForm({
//               apAccount: selected.acctCode,
//               acctCode: selected.acctCode,
//               apAccountName: selected.acctName,
//               reqSL: selected.slReq,
//               reqRC: selected.rcReq,
//             });
//           }}
//         />

//         <SearchCurrRef
//           isOpen={isCurrLookupOpen}
//           onClose={(selected) => {
//             setIsCurrLookupOpen(false);
//             if (!selected) return;

//             onChangeForm({
//               currCode: selected.currCode,
//               currName: selected.currName,
//             });
//           }}
//         />
//       </>

//     );
//   }
// );

// PayeeSetupTab.displayName = "PayeeSetupTab";
// export default PayeeSetupTab;
// import React, {
//   forwardRef,
//   useEffect,
//   useImperativeHandle,
//   useMemo,
//   useRef,
//   useState,
// } from "react";
// import FieldRenderer from "@/NAYSA Cloud/Global/FieldRenderer";

// import SearchCusMast from "@/NAYSA Cloud/Lookup/SearchCustMast.jsx";
// import SearchVendMast from "@/NAYSA Cloud/Lookup/SearchVendMast.jsx";
// import SearchBranchRef from "@/NAYSA Cloud/Lookup/SearchBranchRef.jsx";
// import SearchATCRef from "@/NAYSA Cloud/Lookup/SearchATCRef.jsx";
// import SearchVATRef from "@/NAYSA Cloud/Lookup/SearchVATRef.jsx";
// import SearchCOAMast from "@/NAYSA Cloud/Lookup/SearchCOAMast.jsx";
// import SearchPayTermRef from "@/NAYSA Cloud/Lookup/SearchPayTermRef.jsx";
// import SearchBillTermRef from "@/NAYSA Cloud/Lookup/SearchBillTermRef.jsx";
// import SearchCurrRef from "@/NAYSA Cloud/Lookup/SearchCurrRef.jsx";
// import RegistrationInfo from "@/NAYSA Cloud/Global/RegistrationInfo.jsx";
// import {
//   useFieldLenghtCheck,
//   useGetFieldLength,
// } from "@/NAYSA Cloud/Global/procedure";

// const SectionHeader = ({ title }) => (
//   <div className="mb-3">
//     <div className="text-[9px] sm:text-[12px] font-bold text-slate-500 tracking-widest border-b pb-2">
//       {title}
//     </div>
//   </div>
// );

// const Card = ({ children, className = "" }) => (
//   <div
//     className={[
//       "global-tran-textbox-group-div-ui flex flex-col",
//       "transition-all duration-150",
//       "focus-within:ring-2 focus-within:ring-blue-400/60 focus-within:shadow-2xl",
//       "focus-within:-translate-y-[1px]",
//       className,
//     ].join(" ")}
//   >
//     {children}
//   </div>
// );

// const normalizeUpper = (v) => String(v ?? "").toUpperCase().trim();

// const getValue = (input) => {
//   if (input && typeof input === "object") {
//     if ("target" in input) return input.target?.value ?? "";
//     if ("value" in input) return input.value ?? "";
//   }
//   return input ?? "";
// };

// const PayeeSetupTab = forwardRef(
//   (
//     {
//       isLoading,
//       isEditing,
//       form = {},
//       sltypeOptions,
//       sourceOptions,
//       activeOptions,
//       onChangeForm,
//       onSelectCustomerCode,
//       payeeTypeOptions = [],
//       apAccountOptions = [],
//       paymentTermOptions = [],
//       taxClassOptions = [],
//       currencyOptions = [],
//     },
//     ref
//   ) => {
//     useImperativeHandle(ref, () => ({}));

//     const [tblFieldArray, setTblFieldArray] = useState([]);

//     const getLen = (col, fallback = undefined) => {
//       const n = useGetFieldLength(tblFieldArray, col);
//       return n || fallback;
//     };

//     useEffect(() => {
//       const run = async () => {
//         try {
//           const tbls = "cust_mast,vend_mast,payee_mast";
//           const result = await useFieldLenghtCheck(tbls);
//           if (result) setTblFieldArray(result);
//         } catch (e) {
//           console.error("Failed to load field lengths:", e);
//         }
//       };

//       run();
//     }, []);

//     const isReadOnly = !isEditing;
//     const isDisabled = isReadOnly || isLoading;

//     const [salesTab, setSalesTab] = useState("sales");

//     const sl = useMemo(
//       () => normalizeUpper(form?.sltypeCode || ""),
//       [form?.sltypeCode]
//     );
//     const isVendor = useMemo(() => sl !== "CU", [sl]);
//     const isCustomer = useMemo(() => sl === "CU", [sl]);

//     const [isSalesRepLookupOpen, setIsSalesRepLookupOpen] = useState(false);
//     const [isChainLookupOpen, setIsChainLookupOpen] = useState(false);
//     const [isChainCustomerLookupOpen, setIsChainCustomerLookupOpen] =
//       useState(false);
//     const [isWarehouseLookupOpen, setIsWarehouseLookupOpen] = useState(false);
//     const [isATCGoodsLookupOpen, setIsATCGoodsLookupOpen] = useState(false);
//     const [isATCServiceLookupOpen, setIsATCServiceLookupOpen] = useState(false);
//     const [isATCRentalLookupOpen, setIsATCRentalLookupOpen] = useState(false);


//     const f = useMemo(
//   () => ({
//     code: "vendCode",
//     name: "vendName",
//     contact: "vendContact",
//     position: "vendPosition",
//     tel: "vendTelno",
//     mobile: "vendMobileno",
//     email: "vendEmail",
//     addr1: "vendAddr1",
//     addr2: "vendAddr2",
//     addr3: "vendAddr3",
//     zip: "vendZip",
//     tin: "vendTin",
//   }),
//   []
// );

// const col = useMemo(
//   () => ({
//     code: "vend_code",
//     name: "vend_name",
//     contact: "vend_contact",
//     position: "vend_position",
//     tel: "vend_telno",
//     mobile: "vend_mobileno",
//     email: "vend_email",
//     addr1: "vend_addr1",
//     addr2: "vend_addr2",
//     addr3: "vend_addr3",
//     zip: "vend_zip",
//     tin: "vend_tin",
//     businessName: "business_name",
//     checkName: "check_name",
//     firstName: "first_name",
//     middleName: "middle_name",
//     lastName: "last_name",
//     atcCode: "atc_code",
//     vatCode: "vat_code",
//     paytermCode: "payterm_code",
//     acctCode: "acct_code",
//     currCode: "curr_code",
//   }),
//   []
// );

//     const taxClass = useMemo(
//       () => normalizeUpper(form?.taxClass || ""),
//       [form?.taxClass]
//     );

//     const isIndividualTaxClass = useMemo(() => taxClass === "WI", [taxClass]);
//     const isCorporateTaxClass = useMemo(() => taxClass === "WC", [taxClass]);

//     const shouldAutoNameFromParts = isEmployee || isIndividualTaxClass;
//     const shouldDisableBusinessName = isEmployee || isIndividualTaxClass;
//     const shouldLockNameParts = isSupplier && !isIndividualTaxClass;
//     const isTinRequired = !isIndividualTaxClass;

//     const buildRegisteredName = (fn, mn, ln) => {
//       return [fn, mn, ln]
//         .map((v) => String(v ?? "").trim())
//         .filter(Boolean)
//         .join(" ");
//     };

//     const mappedTaxClassOptions = useMemo(() => {
//       const base = [
//         { value: "WC", label: "Corporate" },
//         { value: "WI", label: "Individual" },
//       ];

//       const extra = (Array.isArray(taxClassOptions) ? taxClassOptions : [])
//         .map((o) => {
//           const rawValue =
//             typeof o === "string"
//               ? o
//               : o?.value ?? o?.code ?? o?.taxClass ?? o?.tax_class ?? "";

//           const value = normalizeUpper(rawValue || "");
//           if (!value) return null;

//           let label =
//             typeof o === "string"
//               ? value
//               : String(o?.label ?? o?.name ?? o?.text ?? value);

//           if (value === "WC") label = "Corporate";
//           if (value === "WI") label = "Individual";

//           return { value, label };
//         })
//         .filter(Boolean);

//       const seen = new Set();
//       return [...base, ...extra].filter((x) => {
//         const k = x.value;
//         if (seen.has(k)) return false;
//         seen.add(k);
//         return true;
//       });
//     }, [taxClassOptions]);

//     const taxAutoRef = useRef({
//       lastAutoValue: "",
//       userTouched: false,
//       lastSl: "",
//     });

//     const handleTaxClassChange = (v) => {
//       const value = getValue(v);
//       taxAutoRef.current.userTouched = true;
//       onChangeForm({ taxClass: value });
//     };

//     const nameAutoRef = useRef({
//       businessLastAuto: "",
//       checkLastAuto: "",
//       businessTouched: false,
//       checkTouched: false,
//       lastSl: "",
//     });

//     const handleBusinessNameChange = (v) => {
//       const value = getValue(v);
//       nameAutoRef.current.businessTouched = true;
//       onChangeForm({ businessName: value });
//     };

//     const handleCheckNameChange = (v) => {
//       const value = getValue(v);
//       nameAutoRef.current.checkTouched = true;
//       onChangeForm({ checkName: value });
//     };

//     const applyAutoNames = (updates = {}, baseName = "") => {
//       const reg = String(baseName || "").trim();

//       const currentBusiness = form?.businessName ?? "";
//       const currentCheck = form?.checkName ?? "";

//       const businessWasAuto =
//         currentBusiness &&
//         currentBusiness === nameAutoRef.current.businessLastAuto;
//       const checkWasAuto =
//         currentCheck && currentCheck === nameAutoRef.current.checkLastAuto;

//       const businessEmpty = !String(currentBusiness || "").trim();
//       const checkEmpty = !String(currentCheck || "").trim();

//       if (
//         (businessEmpty || businessWasAuto) &&
//         !nameAutoRef.current.businessTouched
//       ) {
//         updates.businessName = reg;
//         nameAutoRef.current.businessLastAuto = reg;
//       }

//       if ((checkEmpty || checkWasAuto) && !nameAutoRef.current.checkTouched) {
//         updates.checkName = reg;
//         nameAutoRef.current.checkLastAuto = reg;
//       }

//       return updates;
//     };

//     useEffect(() => {
//       if (!isEditing) return;

//       const desired = sl === "SU" ? "WC" : sl === "EM" ? "WI" : "";
//       if (!desired) {
//         taxAutoRef.current.lastSl = sl;
//         return;
//       }

//       const current = normalizeUpper(form?.taxClass || "");
//       const wasAuto = current && current === taxAutoRef.current.lastAutoValue;
//       const isEmpty = !current;
//       const slChanged = taxAutoRef.current.lastSl !== sl;

//       if (slChanged) {
//         if (taxAutoRef.current.userTouched && !wasAuto && !isEmpty) {
//           taxAutoRef.current.lastSl = sl;
//           return;
//         }
//       }

//       if (isEmpty || wasAuto) {
//         taxAutoRef.current.lastAutoValue = desired;
//         taxAutoRef.current.userTouched = false;
//         onChangeForm({ taxClass: desired });
//       }

//       taxAutoRef.current.lastSl = sl;
//     }, [sl, isEditing, form?.taxClass, onChangeForm]);

//     useEffect(() => {
//       if (!isEditing) return;

//       const slChanged = nameAutoRef.current.lastSl !== sl;
//       if (slChanged) {
//         nameAutoRef.current.businessTouched = false;
//         nameAutoRef.current.checkTouched = false;
//         nameAutoRef.current.businessLastAuto = "";
//         nameAutoRef.current.checkLastAuto = "";
//       }
//       nameAutoRef.current.lastSl = sl;
//     }, [sl, isEditing]);

//     const [isCustLookupOpen, setIsCustLookupOpen] = useState(false);
//     const [isVendLookupOpen, setIsVendLookupOpen] = useState(false);
//     const [isBranchLookupOpen, setIsBranchLookupOpen] = useState(false);
//     const [isATCLookupOpen, setIsATCLookupOpen] = useState(false);
//     const [isVATLookupOpen, setIsVATLookupOpen] = useState(false);
//     const [isAPAcctLookupOpen, setIsAPAcctLookupOpen] = useState(false);
//     const [isPayTermLookupOpen, setIsPayTermLookupOpen] = useState(false);
//     const [isBillingTermLookupOpen, setIsBillingTermLookupOpen] =
//       useState(false);
//     const [isCurrLookupOpen, setIsCurrLookupOpen] = useState(false);

//     useEffect(() => {
//       if (!isEditing) return;

//       if (shouldAutoNameFromParts) {
//         const reg = buildRegisteredName(
//           form.firstName,
//           form.middleName,
//           form.lastName
//         );

//         const updates = {};

//         if ((form[f.name] || "") !== reg) {
//           updates[f.name] = reg;
//         }

//         if ((form.businessName || "") !== reg) {
//           updates.businessName = reg;
//         }

//         applyAutoNames(updates, reg);

//         if (Object.keys(updates).length) {
//           onChangeForm(updates);
//         }
//         return;
//       }

//       if (isSupplier) {
//         const reg = form[f.name] || "";
//         if (String(reg || "").trim()) {
//           const updates = {};
//           applyAutoNames(updates, reg);
//           if (Object.keys(updates).length) onChangeForm(updates);
//         }
//       }
//     }, [
//       shouldAutoNameFromParts,
//       isSupplier,
//       isEditing,
//       form.firstName,
//       form.middleName,
//       form.lastName,
//       form.businessName,
//       form.checkName,
//       form[f.name],
//       onChangeForm,
//       f,
//     ]);

//     const openPayeeLookup = () => {
//       if (isLoading) return;
//       if (isVendor) setIsVendLookupOpen(true);
//       else setIsCustLookupOpen(true);
//     };

//     return (
//       <>
//         {isCustomer ? (
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start rounded-lg relative">
//             <div className="flex flex-col gap-6">
//               <Card className="border border-blue-500/30 p-6 rounded-lg">
//                 <SectionHeader title="BASIC INFORMATION" />

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                   <FieldRenderer
//                     label="SL Type"
//                     type="select"
//                     value={form.sltypeCode}
//                     options={sltypeOptions}
//                     onChange={(v) => onChangeForm({ sltypeCode: getValue(v) })}
//                     readOnly={isReadOnly}
//                     disabled={isDisabled}
//                   />

//                   <FieldRenderer
//                     label="Active?"
//                     type="select"
//                     value={form.active}
//                     options={activeOptions}
//                     onChange={(v) => onChangeForm({ active: getValue(v) })}
//                     readOnly={isReadOnly}
//                     disabled={isDisabled}
//                   />
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                   <FieldRenderer
//                     label={isVendor ? "Payee Code" : "Customer Code"}
//                     required
//                     type="lookup"
//                     value={form[f.code] || ""}
//                     onLookup={openPayeeLookup}
//                     readOnly={true}
//                     disabled={isLoading}
//                     maxLength={getLen(col.code, 20)}
//                   />

//                   <FieldRenderer
//                     label="Tax Rate Class"
//                     required
//                     type="select"
//                     value={normalizeUpper(form.taxClass || "")}
//                     options={mappedTaxClassOptions}
//                     onChange={handleTaxClassChange}
//                     readOnly={isReadOnly}
//                     disabled={isDisabled}
//                   />
//                 </div>

//                 <FieldRenderer
//                   label="Registered Name"
//                   required
//                   type="text"
//                   value={form[f.name] || ""}
//                   onChange={(v) => {
//                     const value = getValue(v);
//                     const updates = { [f.name]: value };
//                     if (isSupplier && !isIndividualTaxClass) {
//                       applyAutoNames(updates, value);
//                     }
//                     onChangeForm(updates);
//                   }}
//                   readOnly={isReadOnly || shouldAutoNameFromParts}
//                   disabled={isDisabled || shouldAutoNameFromParts}
//                   maxLength={getLen(isVendor ? "vend_name" : "cust_name", 150)}
//                 />

//                 <FieldRenderer
//                   label="Business Name"
//                   required={!isIndividualTaxClass}
//                   type="text"
//                   value={form.businessName || ""}
//                   onChange={handleBusinessNameChange}
//                   readOnly={isReadOnly || shouldDisableBusinessName}
//                   disabled={isDisabled || shouldDisableBusinessName}
//                 />

//                 <FieldRenderer
//                   label="Check Name"
//                   type="text"
//                   value={form.checkName || ""}
//                   onChange={handleCheckNameChange}
//                   readOnly={isReadOnly}
//                   disabled={isDisabled}
//                 />


//                   <FieldRenderer
//                     label="First Name"
//                     required={isIndividualTaxClass}
//                     type="text"
//                     value={form.firstName || ""}
//                     onChange={(v) => {
//                       const value = getValue(v);
//                       const updates = { firstName: value };
//                       if (shouldAutoNameFromParts) {
//                         const reg = buildRegisteredName(
//                           value,
//                           form.middleName,
//                           form.lastName
//                         );
//                         updates[f.name] = reg;
//                         updates.businessName = reg;
//                         applyAutoNames(updates, reg);
//                       }
//                       onChangeForm(updates);
//                     }}
//                     readOnly={isReadOnly}
//                     disabled={isDisabled || shouldLockNameParts}
//                   />

//                   <FieldRenderer
//                     label="Middle Name"
//                     type="text"
//                     value={form.middleName || ""}
//                     onChange={(v) => {
//                       const value = getValue(v);
//                       const updates = { middleName: value };
//                       if (shouldAutoNameFromParts) {
//                         const reg = buildRegisteredName(
//                           form.firstName,
//                           value,
//                           form.lastName
//                         );
//                         updates[f.name] = reg;
//                         updates.businessName = reg;
//                         applyAutoNames(updates, reg);
//                       }
//                       onChangeForm(updates);
//                     }}
//                     readOnly={isReadOnly}
//                     disabled={isDisabled || shouldLockNameParts}
//                   />

//                   <FieldRenderer
//                     label="Last Name"
//                     required={isIndividualTaxClass}
//                     type="text"
//                     value={form.lastName || ""}
//                     onChange={(v) => {
//                       const value = getValue(v);
//                       const updates = { lastName: value };
//                       if (shouldAutoNameFromParts) {
//                         const reg = buildRegisteredName(
//                           form.firstName,
//                           form.middleName,
//                           value
//                         );
//                         updates[f.name] = reg;
//                         updates.businessName = reg;
//                         applyAutoNames(updates, reg);
//                       }
//                       onChangeForm(updates);
//                     }}
//                     readOnly={isReadOnly}
//                     disabled={isDisabled || shouldLockNameParts}
//                   />

//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
//                     <FieldRenderer
//                       label="Old Code"
//                       type="text"
//                       value={form.oldCode || ""}
//                       onChange={(v) => onChangeForm({ oldCode: getValue(v) })}
//                       readOnly={isReadOnly}
//                       disabled={isDisabled}
//                     />

//                     <FieldRenderer
//                       label="Branch"
//                       type="lookup"
//                       value={form.branchCode || ""}
//                       onLookup={
//                         isDisabled
//                           ? undefined
//                           : () => setIsBranchLookupOpen(true)
//                       }
//                       readOnly={isReadOnly}
//                       disabled={isDisabled}
//                     />

//                     <FieldRenderer
//                       label="Payee Type"
//                       type={payeeTypeOptions?.length ? "select" : "text"}
//                       value={form.payeeType || ""}
//                       options={payeeTypeOptions}
//                       onChange={(v) => onChangeForm({ payeeType: getValue(v) })}
//                       readOnly={isReadOnly}
//                       disabled={isDisabled}
//                     />
//                   </div>
//               </Card>

//               <Card className="border border-blue-500/30 p-6 rounded-lg ">
//                 <SectionHeader title="CONTACT INFORMATION" />

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                   <FieldRenderer
//                     label="Contact Person"
//                     type="text"
//                     value={form[f.contact] || ""}
//                     onChange={(v) =>
//                       onChangeForm({ [f.contact]: getValue(v) })
//                     }
//                     readOnly={isReadOnly}
//                     disabled={isDisabled}
//                   />

//                   <FieldRenderer
//                     label="Position"
//                     type="text"
//                     value={form[f.position] || ""}
//                     onChange={(v) =>
//                       onChangeForm({ [f.position]: getValue(v) })
//                     }
//                     readOnly={isReadOnly}
//                     disabled={isDisabled}
//                   />
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                   <FieldRenderer
//                     label="Telephone No."
//                     type="text"
//                     value={form[f.tel] || ""}
//                     onChange={(v) => onChangeForm({ [f.tel]: getValue(v) })}
//                     readOnly={isReadOnly}
//                     disabled={isDisabled}
//                   />

//                   <FieldRenderer
//                     label={isVendor ? "Mobile No." : "Fax No."}
//                     type="text"
//                     value={
//                       isVendor ? form[f.mobile] || "" : form.custFaxNo || ""
//                     }
//                     onChange={(v) =>
//                       isVendor
//                         ? onChangeForm({ [f.mobile]: getValue(v) })
//                         : onChangeForm({ custFaxNo: getValue(v) })
//                     }
//                     readOnly={isReadOnly}
//                     disabled={isDisabled}
//                   />
//                 </div>

//                 <FieldRenderer
//                   label="Email Address"
//                   type="text"
//                   value={form[f.email] || ""}
//                   onChange={(v) => onChangeForm({ [f.email]: getValue(v) })}
//                   readOnly={isReadOnly}
//                   disabled={isDisabled}
//                 />

//                 <FieldRenderer
//                   label="Address 1"
//                   required
//                   type="text"
//                   value={form[f.addr1] || ""}
//                   onChange={(v) => onChangeForm({ [f.addr1]: getValue(v) })}
//                   readOnly={isReadOnly}
//                   disabled={isDisabled}
//                 />

//                 <FieldRenderer
//                   label="Address 2"
//                   type="text"
//                   value={form[f.addr2] || ""}
//                   onChange={(v) => onChangeForm({ [f.addr2]: getValue(v) })}
//                   readOnly={isReadOnly}
//                   disabled={isDisabled}
//                 />

//                 <FieldRenderer
//                   label="Address 3"
//                   type="text"
//                   value={form[f.addr3] || ""}
//                   onChange={(v) => onChangeForm({ [f.addr3]: getValue(v) })}
//                   readOnly={isReadOnly}
//                   disabled={isDisabled}
//                 />

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                   <FieldRenderer
//                     label="ZIP Code"
//                     type="text"
//                     value={form[f.zip] || ""}
//                     onChange={(v) => onChangeForm({ [f.zip]: getValue(v) })}
//                     readOnly={isReadOnly}
//                     disabled={isDisabled}
//                   />

//                   <FieldRenderer
//                     label="Source"
//                     required
//                     type="select"
//                     value={form.source || ""}
//                     options={sourceOptions}
//                     onChange={(v) => onChangeForm({ source: getValue(v) })}
//                     readOnly={isReadOnly}
//                     disabled={isDisabled}
//                   />
//                 </div>
//               </Card>
//             </div>

//             <div className="flex flex-col gap-6">
//               <Card className="border border-blue-500/30 p-6 rounded-lg ">
//                 <div className="flex border-b border-gray-300 mb-4">
//                   {[
//                     { id: "sales", label: "Sales & A/R Information" },
//                     { id: "other1", label: "Other Information 1" },
//                     { id: "other2", label: "Other Information 2" },
//                   ].map((tab) => (
//                     <button
//                       key={tab.id}
//                       type="button"
//                       onClick={() => setSalesTab(tab.id)}
//                       className={`px-4 py-2 text-sm font-semibold transition-all duration-200
//                     ${salesTab === tab.id
//                           ? "border-b-2 border-blue-600 text-blue-600"
//                           : "text-gray-500 hover:text-blue-600"
//                         }`}
//                     >
//                       {tab.label}
//                     </button>
//                   ))}
//                 </div>

//                 {salesTab === "sales" && (
//                   <>
//                     <SectionHeader title="SALES INFORMATION" />
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                       <FieldRenderer
//                         label="Sales Rep."
//                         required
//                         type="lookup"
//                         value={form.salesRep || ""}
//                         onLookup={
//                           isDisabled
//                             ? undefined
//                             : () => setIsSalesRepLookupOpen(true)
//                         }
//                         readOnly={isReadOnly}
//                         disabled={isDisabled}
//                       />

//                       <FieldRenderer
//                         label="Customer Type"
//                         type="select"
//                         value={form.customerType || ""}
//                         options={[]}
//                         onChange={(v) =>
//                           onChangeForm({ customerType: getValue(v) })
//                         }
//                         readOnly={isReadOnly}
//                         disabled={isDisabled}
//                       />

//                       <FieldRenderer
//                         label="Area"
//                         type="select"
//                         value={form.area || ""}
//                         options={[]}
//                         onChange={(v) => onChangeForm({ area: getValue(v) })}
//                         readOnly={isReadOnly}
//                         disabled={isDisabled}
//                       />

//                       <FieldRenderer
//                         label="Zone"
//                         type="select"
//                         value={form.zone || ""}
//                         options={[]}
//                         onChange={(v) => onChangeForm({ zone: getValue(v) })}
//                         readOnly={isReadOnly}
//                         disabled={isDisabled}
//                       />

//                       <FieldRenderer
//                         label="Chain Flag"
//                         type="select"
//                         value={form.chainFlag || ""}
//                         options={[]}
//                         onChange={(v) =>
//                           onChangeForm({ chainFlag: getValue(v) })
//                         }
//                         readOnly={isReadOnly}
//                         disabled={isDisabled}
//                       />

//                       <FieldRenderer
//                         label="Customer Since"
//                         type="date"
//                         value={form.customerSince || ""}
//                         onChange={(v) =>
//                           onChangeForm({ customerSince: getValue(v) })
//                         }
//                         readOnly={isReadOnly}
//                         disabled={isDisabled}
//                       />

//                       <FieldRenderer
//                         label="Chain Code"
//                         type="lookup"
//                         value={form.chainCode || ""}
//                         onLookup={
//                           isDisabled
//                             ? undefined
//                             : () => setIsChainLookupOpen(true)
//                         }
//                         readOnly={isReadOnly}
//                         disabled={isDisabled}
//                       />

//                       <FieldRenderer
//                         label="Chain Customer"
//                         type="lookup"
//                         value={form.chainCustomer || ""}
//                         onLookup={
//                           isDisabled
//                             ? undefined
//                             : () => setIsChainCustomerLookupOpen(true)
//                         }
//                         readOnly={isReadOnly}
//                         disabled={isDisabled}
//                       />

//                       <div className="md:col-span-2">
//                         <FieldRenderer
//                           label="Shipping Lines"
//                           type="select"
//                           value={form.shippingLines || ""}
//                           options={[]}
//                           onChange={(v) =>
//                             onChangeForm({ shippingLines: getValue(v) })
//                           }
//                           readOnly={isReadOnly}
//                           disabled={isDisabled}
//                         />
//                       </div>

//                       <FieldRenderer
//                         label="Source"
//                         required
//                         type="select"
//                         value={form.source || ""}
//                         options={sourceOptions}
//                         onChange={(v) =>
//                           onChangeForm({ source: getValue(v) })
//                         }
//                         readOnly={isReadOnly}
//                         disabled={isDisabled}
//                       />

//                       <FieldRenderer
//                         label="Currency"
//                         type="lookup"
//                         value={form.currCode || ""}
//                         onLookup={
//                           isDisabled
//                             ? undefined
//                             : () => setIsCurrLookupOpen(true)
//                         }
//                         readOnly={isReadOnly}
//                         disabled={isDisabled}
//                       />

//                       <FieldRenderer
//                         label="Price Group"
//                         type="select"
//                         value={form.priceGroup || ""}
//                         options={[]}
//                         onChange={(v) =>
//                           onChangeForm({ priceGroup: getValue(v) })
//                         }
//                         readOnly={isReadOnly}
//                         disabled={isDisabled}
//                       />

//                       <FieldRenderer
//                         label="Direct SI/DR WH"
//                         type="lookup"
//                         value={form.directWarehouse || ""}
//                         onLookup={
//                           isDisabled
//                             ? undefined
//                             : () => setIsWarehouseLookupOpen(true)
//                         }
//                         readOnly={isReadOnly}
//                         disabled={isDisabled}
//                       />
//                     </div>

//                     <SectionHeader title="ACCOUNTING INFORMATION" />

//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                       <FieldRenderer
//                         label="TIN"
//                         required={isTinRequired}
//                         type="text"
//                         value={form[f.tin] || ""}
//                         onChange={(v) => {
//                           const value = getValue(v);
//                           onChangeForm({ [f.tin]: value, tin: value });
//                         }}
//                         readOnly={isReadOnly}
//                         disabled={isDisabled}
//                         maxLength={getLen(col.tin, 50)}
//                       />

//                       <FieldRenderer
//                         label="ATC (Goods)"
//                         type="lookup"
//                         value={form.atcGoodsCode || ""}
//                         onLookup={
//                           isDisabled
//                             ? undefined
//                             : () => setIsATCGoodsLookupOpen(true)
//                         }
//                         readOnly={isReadOnly}
//                         disabled={isDisabled}
//                       />
//                     </div>

//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                       <FieldRenderer
//                         label="ATC (Service)"
//                         type="lookup"
//                         value={form.atcServiceCode || ""}
//                         onLookup={
//                           isDisabled
//                             ? undefined
//                             : () => setIsATCServiceLookupOpen(true)
//                         }
//                         readOnly={isReadOnly}
//                         disabled={isDisabled}
//                       />
//                       <FieldRenderer
//                         label="ATC (Rental)"
//                         type="lookup"
//                         value={form.atcRentalCode || ""}
//                         onLookup={
//                           isDisabled
//                             ? undefined
//                             : () => setIsATCRentalLookupOpen(true)
//                         }
//                         readOnly={isReadOnly}
//                         disabled={isDisabled}
//                       />
//                     </div>

//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                       <FieldRenderer
//                         label="VAT Code"
//                         required
//                         type="lookup"
//                         value={form.vatCode || ""}
//                         onLookup={
//                           isDisabled
//                             ? undefined
//                             : () => setIsVATLookupOpen(true)
//                         }
//                         readOnly={isReadOnly}
//                         disabled={isDisabled}
//                       />

//                       <FieldRenderer
//                         label="Billing Terms"
//                         required
//                         type="lookup"
//                         value={form.billtermCode || ""}
//                         onLookup={
//                           isDisabled
//                             ? undefined
//                             : () => setIsBillingTermLookupOpen(true)
//                         }
//                         readOnly={isReadOnly}
//                         disabled={isDisabled}
//                         maxLength={getLen(col.billtermCode, 20)}
//                       />
//                     </div>

//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                       <FieldRenderer
//                         label="Business Style"
//                         type="select"
//                         value={form.businessStyle || ""}
//                         options={[]}
//                         onChange={(v) =>
//                           onChangeForm({ businessStyle: getValue(v) })
//                         }
//                         readOnly={isReadOnly}
//                         disabled={isDisabled}
//                       />
//                     </div>
//                   </>
//                 )}

//                 {salesTab === "other1" && (
//                   <>
//                     <SectionHeader title="REGISTRATION INFORMATION" />
//                     <RegistrationInfo
//                       layout="twoCols"
//                       disabled
//                       data={{
//                         registeredBy: form.registeredBy || "",
//                         registeredDate: form.registeredDate || "",
//                         lastUpdatedBy: form.updatedBy || "",
//                         lastUpdatedDate: form.updatedDate || "",
//                       }}
//                     />
//                   </>
//                 )}

//                 {salesTab === "other2" && (
//                   <>
//                     <SectionHeader title="REGISTRATION INFORMATION" />
//                     <RegistrationInfo
//                       layout="twoCols"
//                       disabled
//                       data={{
//                         registeredBy: form.registeredBy || "",
//                         registeredDate: form.registeredDate || "",
//                         lastUpdatedBy: form.updatedBy || "",
//                         lastUpdatedDate: form.updatedDate || "",
//                       }}
//                     />
//                   </>
//                 )}
//               </Card>
//             </div>
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start rounded-lg relative">
//             <Card className="border border-blue-500/30 p-6 rounded-lg ">
//               <SectionHeader title="BASIC INFORMATION" />
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                 <FieldRenderer
//                   label="SL Type"
//                   type="select"
//                   value={form.sltypeCode}
//                   options={sltypeOptions}
//                   onChange={(v) => onChangeForm({ sltypeCode: getValue(v) })}
//                   readOnly={isReadOnly}
//                   disabled={isDisabled}
//                 />

//                 <FieldRenderer
//                   label="Active?"
//                   type="select"
//                   value={form.active}
//                   options={activeOptions}
//                   onChange={(v) => onChangeForm({ active: getValue(v) })}
//                   readOnly={isReadOnly}
//                   disabled={isDisabled}
//                 />
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                 <FieldRenderer
//                   label={isVendor ? "Payee Code" : "Customer Code"}
//                   required
//                   type="lookup"
//                   value={form[f.code] || ""}
//                   onLookup={openPayeeLookup}
//                   readOnly={true}
//                   disabled={isLoading}
//                 />

//                 <FieldRenderer
//                   label="Tax Rate Class"
//                   required
//                   type="select"
//                   value={normalizeUpper(form.taxClass || "")}
//                   options={mappedTaxClassOptions}
//                   onChange={handleTaxClassChange}
//                   readOnly={isReadOnly}
//                   disabled={isDisabled}
//                 />
//               </div>

//               <FieldRenderer
//                 label="Registered Name"
//                 required
//                 type="text"
//                 value={form[f.name] || ""}
//                 onChange={(v) => {
//                   const value = getValue(v);
//                   const updates = { [f.name]: value };
//                   if (isSupplier && !isIndividualTaxClass) {
//                     applyAutoNames(updates, value);
//                   }
//                   onChangeForm(updates);
//                 }}
//                 readOnly={isReadOnly || shouldAutoNameFromParts}
//                 disabled={isDisabled || shouldAutoNameFromParts}
//                 maxLength={getLen(col.name, 150)}
//               />

//               <FieldRenderer
//                 label="Business Name"
//                 required={!isIndividualTaxClass}
//                 type="text"
//                 value={form.businessName || ""}
//                 onChange={handleBusinessNameChange}
//                 readOnly={isReadOnly || shouldDisableBusinessName}
//                 disabled={isDisabled || shouldDisableBusinessName}
//                 maxLength={getLen("business_name", 150)}
//               />

//               <FieldRenderer
//                 label="Check Name"
//                 type="text"
//                 value={form.checkName || ""}
//                 onChange={handleCheckNameChange}
//                 readOnly={isReadOnly}
//                 disabled={isDisabled}
//                 maxLength={getLen("check_name", 150)}
//               />

//               <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
//                 <FieldRenderer
//                   label="First Name"
//                   type="text"
//                   value={form.firstName || ""}
//                   onChange={(v) => {
//                     const value = getValue(v);
//                     const updates = { firstName: value };
//                     if (shouldAutoNameFromParts) {
//                       const reg = buildRegisteredName(
//                         value,
//                         form.middleName,
//                         form.lastName
//                       );
//                       updates[f.name] = reg;
//                       updates.businessName = reg;
//                       applyAutoNames(updates, reg);
//                     }
//                     onChangeForm(updates);
//                   }}
//                   readOnly={isReadOnly}
//                   disabled={isDisabled || shouldLockNameParts}
//                   maxLength={getLen("first_name", 50)}
//                 />

//                 <FieldRenderer
//                   label="Middle Name"
//                   type="text"
//                   value={form.middleName || ""}
//                   onChange={(v) => {
//                     const value = getValue(v);
//                     const updates = { middleName: value };
//                     if (shouldAutoNameFromParts) {
//                       const reg = buildRegisteredName(
//                         form.firstName,
//                         value,
//                         form.lastName
//                       );
//                       updates[f.name] = reg;
//                       updates.businessName = reg;
//                       applyAutoNames(updates, reg);
//                     }
//                     onChangeForm(updates);
//                   }}
//                   readOnly={isReadOnly}
//                   disabled={isDisabled || shouldLockNameParts}
//                   maxLength={getLen("middle_name", 50)}
//                 />

//                 <FieldRenderer
//                   label="Last Name"
//                   type="text"
//                   value={form.lastName || ""}
//                   onChange={(v) => {
//                     const value = getValue(v);
//                     const updates = { lastName: value };
//                     if (shouldAutoNameFromParts) {
//                       const reg = buildRegisteredName(
//                         form.firstName,
//                         form.middleName,
//                         value
//                       );
//                       updates[f.name] = reg;
//                       updates.businessName = reg;
//                       applyAutoNames(updates, reg);
//                     }
//                     onChangeForm(updates);
//                   }}
//                   readOnly={isReadOnly}
//                   disabled={isDisabled || shouldLockNameParts}
//                   maxLength={getLen("last_name", 50)}
//                 />
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
//                 <FieldRenderer
//                   label="Old Code"
//                   type="text"
//                   value={form.oldCode || ""}
//                   onChange={(v) => onChangeForm({ oldCode: getValue(v) })}
//                   readOnly={isReadOnly}
//                   disabled={isDisabled}
//                 />

//                 <FieldRenderer
//                   label="Branch"
//                   type="lookup"
//                   value={form.branchCode || ""}
//                   onLookup={
//                     isDisabled ? undefined : () => setIsBranchLookupOpen(true)
//                   }
//                   readOnly={isReadOnly}
//                   disabled={isDisabled}
//                 />

//                 <FieldRenderer
//                   label="Payee Type"
//                   type={payeeTypeOptions?.length ? "select" : "text"}
//                   value={form.payeeType || ""}
//                   options={payeeTypeOptions}
//                   onChange={(v) => onChangeForm({ payeeType: getValue(v) })}
//                   readOnly={isReadOnly}
//                   disabled={isDisabled}
//                 />
//               </div>
//             </Card>

//             <Card className="border border-blue-500/30 p-6 rounded-lg ">
//               <SectionHeader title="CONTACT INFORMATION" />

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                 <FieldRenderer
//                   label="Contact Person"
//                   type="text"
//                   value={form[f.contact] || ""}
//                   onChange={(v) =>
//                     onChangeForm({ [f.contact]: getValue(v) })
//                   }
//                   readOnly={isReadOnly}
//                   disabled={isDisabled}
//                   maxLength={getLen(col.contact, 100)}
//                 />

//                 <FieldRenderer
//                   label="Position"
//                   type="text"
//                   value={form[f.position] || ""}
//                   onChange={(v) =>
//                     onChangeForm({ [f.position]: getValue(v) })
//                   }
//                   readOnly={isReadOnly}
//                   disabled={isDisabled}
//                   maxLength={getLen(col.position, 50)}
//                 />
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                 <FieldRenderer
//                   label="Telephone No."
//                   type="text"
//                   value={form[f.tel] || ""}
//                   onChange={(v) => onChangeForm({ [f.tel]: getValue(v) })}
//                   readOnly={isReadOnly}
//                   disabled={isDisabled}
//                   maxLength={getLen(col.tel, 30)}
//                 />

//                 <FieldRenderer
//                   label={isVendor ? "Mobile No." : "Fax No."}
//                   type="text"
//                   value={
//                     isVendor ? form[f.mobile] || "" : form.custFaxNo || ""
//                   }
//                   onChange={(v) =>
//                     isVendor
//                       ? onChangeForm({ [f.mobile]: getValue(v) })
//                       : onChangeForm({ custFaxNo: getValue(v) })
//                   }
//                   readOnly={isReadOnly}
//                   disabled={isDisabled}
//                   maxLength={getLen(col.mobile, 30)}
//                 />
//               </div>

//               <FieldRenderer
//                 label="Email Address"
//                 type="text"
//                 value={form[f.email] || ""}
//                 onChange={(v) => onChangeForm({ [f.email]: getValue(v) })}
//                 readOnly={isReadOnly}
//                 disabled={isDisabled}
//                 maxLength={getLen(col.email, 100)}
//               />

//               <FieldRenderer
//                 label="Address 1"
//                 required
//                 type="text"
//                 value={form[f.addr1] || ""}
//                 onChange={(v) => onChangeForm({ [f.addr1]: getValue(v) })}
//                 readOnly={isReadOnly}
//                 disabled={isDisabled}
//                 maxLength={getLen(col.addr1, 200)}
//               />

//               <FieldRenderer
//                 label="Address 2"
//                 type="text"
//                 value={form[f.addr2] || ""}
//                 onChange={(v) => onChangeForm({ [f.addr2]: getValue(v) })}
//                 readOnly={isReadOnly}
//                 disabled={isDisabled}
//                 maxLength={getLen(col.addr2, 200)}
//               />

//               <FieldRenderer
//                 label="Address 3"
//                 type="text"
//                 value={form[f.addr3] || ""}
//                 onChange={(v) => onChangeForm({ [f.addr3]: getValue(v) })}
//                 readOnly={isReadOnly}
//                 disabled={isDisabled}
//                 maxLength={getLen(col.addr3, 200)}
//               />

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                 <FieldRenderer
//                   label="ZIP Code"
//                   type="text"
//                   value={form[f.zip] || ""}
//                   onChange={(v) => onChangeForm({ [f.zip]: getValue(v) })}
//                   readOnly={isReadOnly}
//                   disabled={isDisabled}
//                   maxLength={getLen(col.zip, 20)}
//                 />

//                 <FieldRenderer
//                   label="Source"
//                   required
//                   type="select"
//                   value={form.source || ""}
//                   options={sourceOptions}
//                   onChange={(v) => onChangeForm({ source: getValue(v) })}
//                   readOnly={isReadOnly}
//                   disabled={isDisabled}
//                 />
//               </div>
//             </Card>

//             <Card className="border border-blue-500/30 p-4 rounded-lg self-start !h-fit !min-h-0">
//               <SectionHeader title="ACCOUNTING INFORMATION" />

//               <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
//                 <FieldRenderer
//                   label="TIN"
//                   required={isTinRequired}
//                   type="text"
//                   value={
//                     form.vendTin ||
//                     form.custTin ||
//                     form.vend_tin ||
//                     form.cust_tin ||
//                     form.tin ||
//                     ""
//                   }
//                   onChange={(v) => {
//                     const value = getValue(v);
//                     onChangeForm({
//                       vendTin: value,
//                       custTin: value,
//                       tin: value,
//                     });
//                   }}
//                   readOnly={isReadOnly}
//                   disabled={isDisabled}
//                   maxLength={getLen(col.tin, 50)}
//                 />

//                 <FieldRenderer
//                   label="Default ATC"
//                   type="lookup"
//                   value={form.atcCode || ""}
//                   onLookup={
//                     isDisabled ? undefined : () => setIsATCLookupOpen(true)
//                   }
//                   readOnly={isReadOnly}
//                   disabled={isDisabled}
//                   maxLength={getLen(col.atcCode, 50)}
//                 />

//                 <FieldRenderer
//                   label="Default VAT"
//                   type="lookup"
//                   value={form.vatCode || ""}
//                   onLookup={
//                     isDisabled ? undefined : () => setIsVATLookupOpen(true)
//                   }
//                   readOnly={isReadOnly}
//                   disabled={isDisabled}
//                   maxLength={getLen(col.vatCode, 50)}
//                 />
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
//                 <FieldRenderer
//                   label="Default Payment Terms"
//                   required
//                   type="lookup"
//                   value={form.paytermCode || ""}
//                   onLookup={
//                     isDisabled ? undefined : () => setIsPayTermLookupOpen(true)
//                   }
//                   readOnly={isReadOnly}
//                   disabled={isDisabled}
//                   maxLength={getLen(col.paytermCode, 50)}
//                 />

//                 <FieldRenderer
//                   label="Default A/P Account"
//                   required
//                   type="lookup"
//                   value={form.acctCode || ""}
//                   onLookup={
//                     isDisabled ? undefined : () => setIsAPAcctLookupOpen(true)
//                   }
//                   readOnly={isReadOnly}
//                   disabled={isDisabled}
//                   maxLength={getLen(col.acctCode, 50)}
//                 />

//                 <FieldRenderer
//                   label="Currency"
//                   type="lookup"
//                   value={form.currCode || ""}
//                   onLookup={
//                     isDisabled ? undefined : () => setIsCurrLookupOpen(true)
//                   }
//                   readOnly={isReadOnly}
//                   disabled={isDisabled}
//                 />
//               </div>
//             </Card>

//             <RegistrationInfo
//               layout="twoCols"
//               disabled
//               data={{
//                 registeredBy: form.registeredBy || "",
//                 registeredDate: form.registeredDate || "",
//                 lastUpdatedBy: form.updatedBy || "",
//                 lastUpdatedDate: form.updatedDate || "",
//               }}
//             />
//           </div>
//         )}

//         <SearchCusMast
//           isOpen={isCustLookupOpen}
//           customParam="ActiveAll"
//           onClose={async (selected) => {
//             setIsCustLookupOpen(false);
//             if (!selected) return;

//             const code =
//               getValue(selected?.custCode) || getValue(selected?.cust_code);
//             const tin =
//               getValue(selected?.custTin) ||
//               getValue(selected?.cust_tin) ||
//               getValue(selected?.tin);
//             if (!code) return;

//             onChangeForm({
//               custCode: code,
//               custTin: tin,
//               tin: tin,
//               __isNew: false,
//             });

//             await onSelectCustomerCode?.(code);
//           }}
//         />

//         <SearchVendMast
//           isOpen={isVendLookupOpen}
//           customParam="ActiveAll"
//           endpoint="/lookupVendMast"
//           onClose={async (selected) => {
//             setIsVendLookupOpen(false);
//             if (!selected) return;

//             const code =
//               getValue(selected?.vendCode) || getValue(selected?.vend_code);
//             const tin =
//               getValue(selected?.vendTin) ||
//               getValue(selected?.vend_tin) ||
//               getValue(selected?.tin);
//             if (!code) return;

//             onChangeForm({
//               vendCode: code,
//               vendTin: tin,
//               tin: tin,
//               __isNew: false,
//             });

//             await onSelectCustomerCode?.(code);
//           }}
//         />

//         <SearchBranchRef
//           isOpen={isBranchLookupOpen}
//           onClose={(selected) => {
//             setIsBranchLookupOpen(false);
//             if (!selected) return;
//             const branchCode =
//               getValue(selected?.branchCode) || getValue(selected?.branch_code);
//             if (!branchCode) return;
//             onChangeForm({ branchCode });
//           }}
//         />

//         <SearchATCRef
//           isOpen={isATCLookupOpen}
//           onClose={(selected) => {
//             setIsATCLookupOpen(false);
//             if (!selected) return;
//             const atcCode =
//               getValue(selected?.atcCode) || getValue(selected?.atc_code);
//             if (!atcCode) return;
//             onChangeForm({ atcCode });
//           }}
//         />

//         <SearchATCRef
//           isOpen={isATCGoodsLookupOpen}
//           onClose={(selected) => {
//             setIsATCGoodsLookupOpen(false);
//             if (!selected) return;
//             const atc =
//               getValue(selected?.atcCode) || getValue(selected?.atc_code);
//             if (!atc) return;
//             onChangeForm({ atcGoodsCode: atc });
//           }}
//         />

//         <SearchATCRef
//           isOpen={isATCServiceLookupOpen}
//           onClose={(selected) => {
//             setIsATCServiceLookupOpen(false);
//             if (!selected) return;
//             const atc =
//               getValue(selected?.atcCode) || getValue(selected?.atc_code);
//             if (!atc) return;
//             onChangeForm({ atcServiceCode: atc });
//           }}
//         />

//         <SearchATCRef
//           isOpen={isATCRentalLookupOpen}
//           onClose={(selected) => {
//             setIsATCRentalLookupOpen(false);
//             if (!selected) return;
//             const atc =
//               getValue(selected?.atcCode) || getValue(selected?.atc_code);
//             if (!atc) return;
//             onChangeForm({ atcRentalCode: atc });
//           }}
//         />

//         <SearchVATRef
//           isOpen={isVATLookupOpen}
//           onClose={(selected) => {
//             setIsVATLookupOpen(false);
//             if (!selected) return;
//             const vatCode =
//               getValue(selected?.vatCode) || getValue(selected?.vat_code);
//             if (!vatCode) return;
//             onChangeForm({ vatCode });
//           }}
//         />

//         <SearchPayTermRef
//           isOpen={isPayTermLookupOpen}
//           onClose={(selected) => {
//             setIsPayTermLookupOpen(false);
//             if (!selected) return;
//             onChangeForm({
//               paytermCode: getValue(selected?.paytermCode),
//               paytermName: getValue(selected?.paytermName),
//             });
//           }}
//         />

//         <SearchBillTermRef
//           isOpen={isBillingTermLookupOpen}
//           onClose={(selected) => {
//             setIsBillingTermLookupOpen(false);
//             if (!selected) return;

//             const code =
//               getValue(selected?.billtermCode) ||
//               getValue(selected?.billterm_code) ||
//               getValue(selected?.code);

//             const name =
//               getValue(selected?.billtermName) ||
//               getValue(selected?.billterm_name) ||
//               getValue(selected?.name);

//             if (!code) return;

//             onChangeForm({
//               billtermCode: code,
//               billtermName: name,
//             });
//           }}
//         />

//         <SearchCOAMast
//           isOpen={isAPAcctLookupOpen}
//           customParam="APGL"
//           source="AP"
//           onClose={(selected) => {
//             setIsAPAcctLookupOpen(false);
//             if (!selected) return;

//             onChangeForm({
//               apAccount: getValue(selected?.acctCode),
//               acctCode: getValue(selected?.acctCode),
//               apAccountName: getValue(selected?.acctName),
//               reqSL: getValue(selected?.slReq),
//               reqRC: getValue(selected?.rcReq),
//             });
//           }}
//         />

//         <SearchCurrRef
//           isOpen={isCurrLookupOpen}
//           onClose={(selected) => {
//             setIsCurrLookupOpen(false);
//             if (!selected) return;

//             onChangeForm({
//               currCode: getValue(selected?.currCode),
//               currName: getValue(selected?.currName),
//             });
//           }}
//         />
//       </>
//     );
//   }
// );

// PayeeSetupTab.displayName = "PayeeSetupTab";
// export default PayeeSetupTab;
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import FieldRenderer from "@/NAYSA Cloud/Global/FieldRenderer";

import SearchVendMast from "@/NAYSA Cloud/Lookup/SearchVendMast.jsx";
import SearchBranchRef from "@/NAYSA Cloud/Lookup/SearchBranchRef.jsx";
import SearchATCRef from "@/NAYSA Cloud/Lookup/SearchATCRef.jsx";
import SearchVATRef from "@/NAYSA Cloud/Lookup/SearchVATRef.jsx";
import SearchCOAMast from "@/NAYSA Cloud/Lookup/SearchCOAMast.jsx";
import SearchPayTermRef from "@/NAYSA Cloud/Lookup/SearchPayTermRef.jsx";
import SearchCurrRef from "@/NAYSA Cloud/Lookup/SearchCurrRef.jsx";
import RegistrationInfo from "@/NAYSA Cloud/Global/RegistrationInfo.jsx";
import {
  useFieldLenghtCheck,
  useGetFieldLength,
} from "@/NAYSA Cloud/Global/procedure";

const SectionHeader = ({ title }) => (
  <div className="mb-3">
    <div className="text-[9px] sm:text-[12px] font-bold text-slate-500 tracking-widest border-b pb-2">
      {title}
    </div>
  </div>
);

const Card = ({ children, className = "" }) => (
  <div
    className={[
      "global-tran-textbox-group-div-ui flex flex-col",
      "transition-all duration-150",
      "focus-within:ring-2 focus-within:ring-blue-400/60 focus-within:shadow-2xl",
      "focus-within:-translate-y-[1px]",
      className,
    ].join(" ")}
  >
    {children}
  </div>
);

const normalizeUpper = (v) => String(v ?? "").toUpperCase().trim();

const getValue = (input) => {
  if (input && typeof input === "object") {
    if ("target" in input) return input.target?.value ?? "";
    if ("value" in input) return input.value ?? "";
  }
  return input ?? "";
};

const PayeeSetupTab = forwardRef(
  (
    {
      isLoading,
      isEditing,
      form = {},
      sltypeOptions = [],
      sourceOptions = [],
      activeOptions = [],
      onChangeForm,
      onSelectCustomerCode, // kept as-is so no parent change needed
      payeeTypeOptions = [],
      taxClassOptions = [],
    },
    ref
  ) => {
    useImperativeHandle(ref, () => ({}));

    const [tblFieldArray, setTblFieldArray] = useState([]);

    useEffect(() => {
      const run = async () => {
        try {
          const result = await useFieldLenghtCheck("vend_mast,payee_mast");
          if (result) setTblFieldArray(result);
        } catch (e) {
          console.error("Failed to load field lengths:", e);
        }
      };
      run();
    }, []);

    const getLen = (col, fallback = undefined) => {
      const n = useGetFieldLength(tblFieldArray, col);
      return n || fallback;
    };

    const isReadOnly = !isEditing;
    const isDisabled = isReadOnly || isLoading;

    const sl = useMemo(
      () => normalizeUpper(form?.sltypeCode || "SU"),
      [form?.sltypeCode]
    );

    const taxClass = useMemo(
      () => normalizeUpper(form?.taxClass || ""),
      [form?.taxClass]
    );

    const isEmployee = sl === "EM";
    const isSupplier = sl === "SU";
    const isIndividualTaxClass = taxClass === "WI";

    const isTinRequired = !isIndividualTaxClass;
    const shouldAutoNameFromParts = isEmployee;
    const shouldDisableBusinessName = isEmployee;
    const shouldLockNameParts = isSupplier && !isIndividualTaxClass;

    const f = useMemo(
      () => ({
        code: "vendCode",
        name: "vendName",
        contact: "vendContact",
        position: "vendPosition",
        tel: "vendTelno",
        mobile: "vendMobileno",
        email: "vendEmail",
        addr1: "vendAddr1",
        addr2: "vendAddr2",
        addr3: "vendAddr3",
        zip: "vendZip",
        tin: "vendTin",
      }),
      []
    );

    const col = useMemo(
      () => ({
        code: "vend_code",
        name: "vend_name",
        contact: "vend_contact",
        position: "vend_position",
        tel: "vend_telno",
        mobile: "vend_mobileno",
        email: "vend_email",
        addr1: "vend_addr1",
        addr2: "vend_addr2",
        addr3: "vend_addr3",
        zip: "vend_zip",
        tin: "vend_tin",
        businessName: "business_name",
        checkName: "check_name",
        firstName: "first_name",
        middleName: "middle_name",
        lastName: "last_name",
        atcCode: "atc_code",
        vatCode: "vat_code",
        paytermCode: "payterm_code",
        acctCode: "acct_code",
        currCode: "curr_code",
      }),
      []
    );

    const mappedTaxClassOptions = useMemo(() => {
      const base = [
        { value: "WC", label: "Corporate" },
        { value: "WI", label: "Individual" },
      ];

      const extra = (Array.isArray(taxClassOptions) ? taxClassOptions : [])
        .map((o) => {
          const rawValue =
            typeof o === "string"
              ? o
              : o?.value ?? o?.code ?? o?.taxClass ?? o?.tax_class ?? "";

          const value = normalizeUpper(rawValue || "");
          if (!value) return null;

          let label =
            typeof o === "string"
              ? value
              : String(o?.label ?? o?.name ?? o?.text ?? value);

          if (value === "WC") label = "Corporate";
          if (value === "WI") label = "Individual";

          return { value, label };
        })
        .filter(Boolean);

      const seen = new Set();
      return [...base, ...extra].filter((x) => {
        if (seen.has(x.value)) return false;
        seen.add(x.value);
        return true;
      });
    }, [taxClassOptions]);

    const buildRegisteredName = (fn, mn, ln) => {
      return [fn, mn, ln]
        .map((v) => String(v ?? "").trim())
        .filter(Boolean)
        .join(" ");
    };

    const taxAutoRef = useRef({
      lastAutoValue: "",
      userTouched: false,
      lastSl: "",
    });

    const nameAutoRef = useRef({
      businessLastAuto: "",
      checkLastAuto: "",
      businessTouched: false,
      checkTouched: false,
      lastSl: "",
    });

    const handleTaxClassChange = (v) => {
      const value = getValue(v);
      taxAutoRef.current.userTouched = true;
      onChangeForm({ taxClass: value });
    };

    const handleBusinessNameChange = (v) => {
      const value = getValue(v);
      nameAutoRef.current.businessTouched = true;
      onChangeForm({ businessName: value });
    };

    const handleCheckNameChange = (v) => {
      const value = getValue(v);
      nameAutoRef.current.checkTouched = true;
      onChangeForm({ checkName: value });
    };

    const applyAutoNames = (updates = {}, baseName = "") => {
      const reg = String(baseName || "").trim();

      const currentBusiness = form?.businessName ?? "";
      const currentCheck = form?.checkName ?? "";

      const businessWasAuto =
        currentBusiness &&
        currentBusiness === nameAutoRef.current.businessLastAuto;

      const checkWasAuto =
        currentCheck && currentCheck === nameAutoRef.current.checkLastAuto;

      const businessEmpty = !String(currentBusiness || "").trim();
      const checkEmpty = !String(currentCheck || "").trim();

      if (
        (businessEmpty || businessWasAuto) &&
        !nameAutoRef.current.businessTouched
      ) {
        updates.businessName = reg;
        nameAutoRef.current.businessLastAuto = reg;
      }

      if ((checkEmpty || checkWasAuto) && !nameAutoRef.current.checkTouched) {
        updates.checkName = reg;
        nameAutoRef.current.checkLastAuto = reg;
      }

      return updates;
    };

    useEffect(() => {
      if (!isEditing) return;

      const desired = sl === "SU" ? "WC" : sl === "EM" ? "WI" : "";
      if (!desired) {
        taxAutoRef.current.lastSl = sl;
        return;
      }

      const current = normalizeUpper(form?.taxClass || "");
      const wasAuto = current && current === taxAutoRef.current.lastAutoValue;
      const isEmpty = !current;
      const slChanged = taxAutoRef.current.lastSl !== sl;

      if (slChanged) {
        if (taxAutoRef.current.userTouched && !wasAuto && !isEmpty) {
          taxAutoRef.current.lastSl = sl;
          return;
        }
      }

      if (isEmpty || wasAuto) {
        taxAutoRef.current.lastAutoValue = desired;
        taxAutoRef.current.userTouched = false;
        onChangeForm({ taxClass: desired });
      }

      taxAutoRef.current.lastSl = sl;
    }, [sl, isEditing, form?.taxClass, onChangeForm]);

    useEffect(() => {
      if (!isEditing) return;

      const slChanged = nameAutoRef.current.lastSl !== sl;
      if (slChanged) {
        nameAutoRef.current.businessTouched = false;
        nameAutoRef.current.checkTouched = false;
        nameAutoRef.current.businessLastAuto = "";
        nameAutoRef.current.checkLastAuto = "";
      }
      nameAutoRef.current.lastSl = sl;
    }, [sl, isEditing]);

    useEffect(() => {
      if (!isEditing) return;

      if (shouldAutoNameFromParts) {
        const reg = buildRegisteredName(
          form.firstName,
          form.middleName,
          form.lastName
        );

        const updates = {};

        if ((form[f.name] || "") !== reg) updates[f.name] = reg;
        if ((form.businessName || "") !== reg) updates.businessName = reg;

        applyAutoNames(updates, reg);

        if (Object.keys(updates).length) onChangeForm(updates);
        return;
      }

      if (isSupplier && !isIndividualTaxClass) {
        const reg = form[f.name] || "";
        if (String(reg || "").trim()) {
          const updates = {};
          applyAutoNames(updates, reg);
          if (Object.keys(updates).length) onChangeForm(updates);
        }
      }
    }, [
      shouldAutoNameFromParts,
      isSupplier,
      isIndividualTaxClass,
      isEditing,
      form.firstName,
      form.middleName,
      form.lastName,
      form.businessName,
      form.checkName,
      form[f.name],
      onChangeForm,
      f,
    ]);

    const [isVendLookupOpen, setIsVendLookupOpen] = useState(false);
    const [isBranchLookupOpen, setIsBranchLookupOpen] = useState(false);
    const [isATCLookupOpen, setIsATCLookupOpen] = useState(false);
    const [isVATLookupOpen, setIsVATLookupOpen] = useState(false);
    const [isAPAcctLookupOpen, setIsAPAcctLookupOpen] = useState(false);
    const [isPayTermLookupOpen, setIsPayTermLookupOpen] = useState(false);
    const [isCurrLookupOpen, setIsCurrLookupOpen] = useState(false);

    const openPayeeLookup = () => {
      if (isLoading) return;
      setIsVendLookupOpen(true);
    };

    return (
      <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start rounded-lg relative">
          <Card className="border border-blue-500/30 p-6 rounded-lg">
            <SectionHeader title="BASIC INFORMATION" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FieldRenderer
                label="SL Type"
                type="select"
                value={form.sltypeCode || ""}
                options={sltypeOptions}
                onChange={(v) => onChangeForm({ sltypeCode: getValue(v) })}
                readOnly={isReadOnly}
                disabled={isDisabled}
              />

              <FieldRenderer
                label="Active?"
                type="select"
                value={form.active || "Y"}
                options={activeOptions}
                onChange={(v) => onChangeForm({ active: getValue(v) })}
                readOnly={isReadOnly}
                disabled={isDisabled}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FieldRenderer
                label="Payee Code"
                required
                type="lookup"
                value={form[f.code] || ""}
                onLookup={openPayeeLookup}
                readOnly={true}
                disabled={isLoading}
                maxLength={getLen(col.code, 20)}
              />

              <FieldRenderer
                label="Tax Rate Class"
                required
                type="select"
                value={normalizeUpper(form.taxClass || "")}
                options={mappedTaxClassOptions}
                onChange={handleTaxClassChange}
                readOnly={isReadOnly}
                disabled={isDisabled}
              />
            </div>

            <FieldRenderer
              label="Registered Name"
              required
              type="text"
              value={form[f.name] || ""}
              onChange={(v) => {
                const value = getValue(v);
                const updates = { [f.name]: value };

                if (isSupplier && !isIndividualTaxClass) {
                  applyAutoNames(updates, value);
                }

                onChangeForm(updates);
              }}
              readOnly={isReadOnly || shouldAutoNameFromParts}
              disabled={isDisabled || shouldAutoNameFromParts}
              maxLength={getLen(col.name, 150)}
            />

            <FieldRenderer
              label="Business Name"
              required={!isIndividualTaxClass}
              type="text"
              value={form.businessName || ""}
              onChange={handleBusinessNameChange}
              readOnly={isReadOnly || shouldDisableBusinessName}
              disabled={isDisabled || shouldDisableBusinessName}
              maxLength={getLen(col.businessName, 150)}
            />

            <FieldRenderer
              label="Check Name"
              type="text"
              value={form.checkName || ""}
              onChange={handleCheckNameChange}
              readOnly={isReadOnly}
              disabled={isDisabled}
              maxLength={getLen(col.checkName, 150)}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <FieldRenderer
                label="First Name"
                required={isIndividualTaxClass}
                type="text"
                value={form.firstName || ""}
                onChange={(v) => {
                  const value = getValue(v);
                  const updates = { firstName: value };

                  if (shouldAutoNameFromParts) {
                    const reg = buildRegisteredName(
                      value,
                      form.middleName,
                      form.lastName
                    );
                    updates[f.name] = reg;
                    updates.businessName = reg;
                    applyAutoNames(updates, reg);
                  }

                  onChangeForm(updates);
                }}
                readOnly={isReadOnly}
                disabled={isDisabled || shouldLockNameParts}
                maxLength={getLen(col.firstName, 50)}
              />

              <FieldRenderer
                label="Middle Name"
                type="text"
                value={form.middleName || ""}
                onChange={(v) => {
                  const value = getValue(v);
                  const updates = { middleName: value };

                  if (shouldAutoNameFromParts) {
                    const reg = buildRegisteredName(
                      form.firstName,
                      value,
                      form.lastName
                    );
                    updates[f.name] = reg;
                    updates.businessName = reg;
                    applyAutoNames(updates, reg);
                  }

                  onChangeForm(updates);
                }}
                readOnly={isReadOnly}
                disabled={isDisabled || shouldLockNameParts}
                maxLength={getLen(col.middleName, 50)}
              />

              <FieldRenderer
                label="Last Name"
                required={isIndividualTaxClass}
                type="text"
                value={form.lastName || ""}
                onChange={(v) => {
                  const value = getValue(v);
                  const updates = { lastName: value };

                  if (shouldAutoNameFromParts) {
                    const reg = buildRegisteredName(
                      form.firstName,
                      form.middleName,
                      value
                    );
                    updates[f.name] = reg;
                    updates.businessName = reg;
                    applyAutoNames(updates, reg);
                  }

                  onChangeForm(updates);
                }}
                readOnly={isReadOnly}
                disabled={isDisabled || shouldLockNameParts}
                maxLength={getLen(col.lastName, 50)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <FieldRenderer
                label="Old Code"
                type="text"
                value={form.oldCode || ""}
                onChange={(v) => onChangeForm({ oldCode: getValue(v) })}
                readOnly={isReadOnly}
                disabled={isDisabled}
              />

              <FieldRenderer
                label="Branch"
                type="lookup"
                value={form.branchCode || ""}
                onLookup={
                  isDisabled ? undefined : () => setIsBranchLookupOpen(true)
                }
                readOnly={isReadOnly}
                disabled={isDisabled}
              />

              <FieldRenderer
                label="Payee Type"
                type={payeeTypeOptions?.length ? "select" : "text"}
                value={form.payeeType || ""}
                options={payeeTypeOptions}
                onChange={(v) => onChangeForm({ payeeType: getValue(v) })}
                readOnly={isReadOnly}
                disabled={isDisabled}
              />
            </div>
          </Card>

          <Card className="border border-blue-500/30 p-6 rounded-lg">
            <SectionHeader title="CONTACT INFORMATION" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FieldRenderer
                label="Contact Person"
                type="text"
                value={form[f.contact] || ""}
                onChange={(v) => onChangeForm({ [f.contact]: getValue(v) })}
                readOnly={isReadOnly}
                disabled={isDisabled}
                maxLength={getLen(col.contact, 100)}
              />

              <FieldRenderer
                label="Position"
                type="text"
                value={form[f.position] || ""}
                onChange={(v) => onChangeForm({ [f.position]: getValue(v) })}
                readOnly={isReadOnly}
                disabled={isDisabled}
                maxLength={getLen(col.position, 50)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FieldRenderer
                label="Telephone No."
                type="text"
                value={form[f.tel] || ""}
                onChange={(v) => onChangeForm({ [f.tel]: getValue(v) })}
                readOnly={isReadOnly}
                disabled={isDisabled}
                maxLength={getLen(col.tel, 30)}
              />

              <FieldRenderer
                label="Mobile No."
                type="text"
                value={form[f.mobile] || ""}
                onChange={(v) => onChangeForm({ [f.mobile]: getValue(v) })}
                readOnly={isReadOnly}
                disabled={isDisabled}
                maxLength={getLen(col.mobile, 30)}
              />
            </div>

            <FieldRenderer
              label="Email Address"
              type="text"
              value={form[f.email] || ""}
              onChange={(v) => onChangeForm({ [f.email]: getValue(v) })}
              readOnly={isReadOnly}
              disabled={isDisabled}
              maxLength={getLen(col.email, 100)}
            />

            <FieldRenderer
              label="Address 1"
              required
              type="text"
              value={form[f.addr1] || ""}
              onChange={(v) => onChangeForm({ [f.addr1]: getValue(v) })}
              readOnly={isReadOnly}
              disabled={isDisabled}
              maxLength={getLen(col.addr1, 200)}
            />

            <FieldRenderer
              label="Address 2"
              type="text"
              value={form[f.addr2] || ""}
              onChange={(v) => onChangeForm({ [f.addr2]: getValue(v) })}
              readOnly={isReadOnly}
              disabled={isDisabled}
              maxLength={getLen(col.addr2, 200)}
            />

            <FieldRenderer
              label="Address 3"
              type="text"
              value={form[f.addr3] || ""}
              onChange={(v) => onChangeForm({ [f.addr3]: getValue(v) })}
              readOnly={isReadOnly}
              disabled={isDisabled}
              maxLength={getLen(col.addr3, 200)}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FieldRenderer
                label="ZIP Code"
                type="text"
                value={form[f.zip] || ""}
                onChange={(v) => onChangeForm({ [f.zip]: getValue(v) })}
                readOnly={isReadOnly}
                disabled={isDisabled}
                maxLength={getLen(col.zip, 20)}
              />

              <FieldRenderer
                label="Source"
                required
                type="select"
                value={form.source || ""}
                options={sourceOptions}
                onChange={(v) => onChangeForm({ source: getValue(v) })}
                readOnly={isReadOnly}
                disabled={isDisabled}
              />
            </div>
          </Card>

          <Card className="border border-blue-500/30 p-4 rounded-lg self-start !h-fit !min-h-0">
            <SectionHeader title="ACCOUNTING INFORMATION" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <FieldRenderer
                label="TIN"
                required={isTinRequired}
                type="text"
                value={form.vendTin || form.vend_tin || form.tin || ""}
                onChange={(v) => {
                  const value = getValue(v);
                  onChangeForm({
                    vendTin: value,
                    tin: value,
                  });
                }}
                readOnly={isReadOnly}
                disabled={isDisabled}
                maxLength={getLen(col.tin, 50)}
              />

              <FieldRenderer
                label="Default ATC"
                type="lookup"
                value={form.atcCode || ""}
                onLookup={
                  isDisabled ? undefined : () => setIsATCLookupOpen(true)
                }
                readOnly={isReadOnly}
                disabled={isDisabled}
                maxLength={getLen(col.atcCode, 50)}
              />

              <FieldRenderer
                label="Default VAT"
                type="lookup"
                value={form.vatCode || ""}
                onLookup={
                  isDisabled ? undefined : () => setIsVATLookupOpen(true)
                }
                readOnly={isReadOnly}
                disabled={isDisabled}
                maxLength={getLen(col.vatCode, 50)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
              <FieldRenderer
                label="Default Payment Terms"
                required
                type="lookup"
                value={form.paytermCode || ""}
                onLookup={
                  isDisabled ? undefined : () => setIsPayTermLookupOpen(true)
                }
                readOnly={isReadOnly}
                disabled={isDisabled}
                maxLength={getLen(col.paytermCode, 50)}
              />

              <FieldRenderer
                label="Default A/P Account"
                required
                type="lookup"
                value={form.acctCode || ""}
                onLookup={
                  isDisabled ? undefined : () => setIsAPAcctLookupOpen(true)
                }
                readOnly={isReadOnly}
                disabled={isDisabled}
                maxLength={getLen(col.acctCode, 50)}
              />

              <FieldRenderer
                label="Currency"
                type="lookup"
                value={form.currCode || ""}
                onLookup={
                  isDisabled ? undefined : () => setIsCurrLookupOpen(true)
                }
                readOnly={isReadOnly}
                disabled={isDisabled}
              />
            </div>
          </Card>

          <RegistrationInfo
            layout="twoCols"
            disabled
            data={{
              registeredBy: form.registeredBy || "",
              registeredDate: form.registeredDate || "",
              lastUpdatedBy: form.updatedBy || "",
              lastUpdatedDate: form.updatedDate || "",
            }}
          />
        </div>

        <SearchVendMast
          isOpen={isVendLookupOpen}
          customParam="ActiveAll"
          endpoint="/lookupVendMast"
          onClose={async (selected) => {
            setIsVendLookupOpen(false);
            if (!selected) return;

            const code =
              getValue(selected?.vendCode) || getValue(selected?.vend_code);
            const tin =
              getValue(selected?.vendTin) ||
              getValue(selected?.vend_tin) ||
              getValue(selected?.tin);

            if (!code) return;

            onChangeForm({
              vendCode: code,
              vendTin: tin,
              tin,
              __isNew: false,
            });

            await onSelectCustomerCode?.(code);
          }}
        />

        <SearchBranchRef
          isOpen={isBranchLookupOpen}
          onClose={(selected) => {
            setIsBranchLookupOpen(false);
            if (!selected) return;

            const branchCode =
              getValue(selected?.branchCode) || getValue(selected?.branch_code);

            if (!branchCode) return;
            onChangeForm({ branchCode });
          }}
        />

        <SearchATCRef
          isOpen={isATCLookupOpen}
          onClose={(selected) => {
            setIsATCLookupOpen(false);
            if (!selected) return;

            const atcCode =
              getValue(selected?.atcCode) || getValue(selected?.atc_code);

            if (!atcCode) return;
            onChangeForm({ atcCode });
          }}
        />

        <SearchVATRef
          isOpen={isVATLookupOpen}
          onClose={(selected) => {
            setIsVATLookupOpen(false);
            if (!selected) return;

            const vatCode =
              getValue(selected?.vatCode) || getValue(selected?.vat_code);

            if (!vatCode) return;
            onChangeForm({ vatCode });
          }}
        />

        <SearchPayTermRef
          isOpen={isPayTermLookupOpen}
          onClose={(selected) => {
            setIsPayTermLookupOpen(false);
            if (!selected) return;

            onChangeForm({
              paytermCode: getValue(selected?.paytermCode),
              paytermName: getValue(selected?.paytermName),
            });
          }}
        />

        <SearchCOAMast
          isOpen={isAPAcctLookupOpen}
          customParam="APGL"
          source="AP"
          onClose={(selected) => {
            setIsAPAcctLookupOpen(false);
            if (!selected) return;

            onChangeForm({
              apAccount: getValue(selected?.acctCode),
              acctCode: getValue(selected?.acctCode),
              apAccountName: getValue(selected?.acctName),
              reqSL: getValue(selected?.slReq),
              reqRC: getValue(selected?.rcReq),
            });
          }}
        />

        <SearchCurrRef
          isOpen={isCurrLookupOpen}
          onClose={(selected) => {
            setIsCurrLookupOpen(false);
            if (!selected) return;

            onChangeForm({
              currCode: getValue(selected?.currCode),
              currName: getValue(selected?.currName),
            });
          }}
        />
      </>
    );
  }
);

PayeeSetupTab.displayName = "PayeeSetupTab";
export default PayeeSetupTab;