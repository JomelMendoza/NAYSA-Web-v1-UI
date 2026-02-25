import { useState, useEffect, useRef, useCallback } from "react";
import Swal from "sweetalert2";
import { useNavigate,useLocation } from "react-router-dom";

// UI
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
 faMagnifyingGlass,
  faPlus,
  faSpinner,
  faSearch,
  faMinus,
} from "@fortawesome/free-solid-svg-icons";

// Lookup/Modal
import BranchLookupModal from "../../../Lookup/SearchBranchRef";
import CurrLookupModal from "../../../Lookup/SearchCurrRef.jsx";
import CancelTranModal from "../../../Lookup/SearchCancelRef.jsx";
import PostTranModal from "../../../Lookup/SearchPostRef.jsx";
import AttachDocumentModal from "../../../Lookup/SearchAttachment.jsx";
import DocumentSignatories from "../../../Lookup/SearchSignatory.jsx";
import AllTranHistory from "../../../Lookup/SearchGlobalTranHistory.jsx";
import RCLookupModal from "../../../Lookup/SearchRCMast.jsx";
import MSLookupModal from "../../../Lookup/SearchMSMast.jsx";
import PayeeMastLookupModal from "../../../Lookup/SearchVendMast";
import PaytermLookupModal from "../../../Lookup/SearchPayTermRef.jsx";
import VATLookupModal from "../../../Lookup/SearchVATRef.jsx";
import JobCodeLookupModal from "../../../Lookup/SearchJobCodesRef.jsx";

// JO.jsx (top of file)
import SearchPROpenModal from "../../../Lookup/SearchOpenPRBalance.jsx";

// Configuration
import { postRequest,fetchDataJson } from "../../../Configuration/BaseURL.jsx";
import { useReset } from "../../../Components/ResetContext";
import { useAuth } from "@/NAYSA Cloud/Authentication/AuthContext.jsx";


import {
  docTypeNames,
  docTypes,
  docTypeVideoGuide,
  docTypePDFGuide,
} from "@/NAYSA Cloud/Global/doctype";

import {
  useTopForexRate,
  useTopCurrencyRow,
  useTopHSOption,
  useTopDocControlRow,
  useTopDocDropDown,
  useTopPayTermRow,
  useTopVatRow,
  useTopPayeeRow,
  useTopVatAmount
} from "@/NAYSA Cloud/Global/top1RefTable";

import {
  useTransactionUpsert,
  useFetchTranData,
  useHandleCancel,
  useHandlePost,
  useFieldLenghtCheck,
  useGetFieldLength,
} from "@/NAYSA Cloud/Global/procedure";

import {
  useGetCurrentDay,
  useFormatToDate,
} from '@/NAYSA Cloud/Global/dates';

import { useHandlePrint } from "@/NAYSA Cloud/Global/report";
import {
  useSelectedHSColConfig
} from '@/NAYSA Cloud/Global/selectedData';

import {
  formatNumber,
  parseFormattedNumber,
  useSwalshowSaveSuccessDialog,
  useSwalvalidateRequiredFields,
  useSwalInfoAlert,
  useSwalConfirmAlert,
  useSwalHandleOpenSpecsModal
} from "@/NAYSA Cloud/Global/behavior";

// Header
import Header from "@/NAYSA Cloud/Components/Header";

const JO = () => {
   const loadedFromUrlRef = useRef(false);
    const navigate = useNavigate();
    const location = useLocation(); 
    const [isViewDocument, setIsViewDocument] = useState(false);
    const { companyInfo, currentUserRow } = useAuth();
    const decUPrice = companyInfo?.pur_decuprice ?? 2;
  
  
        
    useEffect(() => {
    const p = new URLSearchParams(location.search);
            if (p.get("viewDocument") === "true") {
              setIsViewDocument(true);
            }
            }, []); 
    const isViewDocumentUrl = isViewDocument;
        
        
        
    const [topTab, setTopTab] = useState("details"); 
    const { user } = useAuth();
    const { resetFlag } = useReset();

  const [state, setState] = useState({
    // HS Option / Currency
    glCurrMode: "M",
    glCurrDefault: "PHP",
    withCurr2: false,
    withCurr3: false,
    glCurrGlobal1: "",
    glCurrGlobal2: "",
    glCurrGlobal3: "",

    // Document information
    documentName: "",
    documentSeries: "Auto",
    documentDocLen: 8,
    documentID: null,
    documentNo: "",
    documentStatus: "",
    status: "",
    originalDocStatus:"O",
    documentDate:useGetCurrentDay(),  
    dateNeeded:useGetCurrentDay(),  

    currencyCode: "",
    currencyName: "Philippine Peso",
    currencyRate: "1.000000",
    defaultCurrRate: "1.000000",

    // UI state
    activeTab: "basic",
    isLoading: false,
    showSpinner: false,
    isDocNoDisabled: true,
    isSaveDisabled: false,
    isResetDisabled: false,
    isFetchDisabled: true,

    branchCode: currentUserRow.branchCode,
    branchName: currentUserRow.BranchName,
    reqRcCode: "",
    reqRcName: "",
    currCode: "",
    currName: "",
    attention: "",

    payeeName:  "",
    payeeCode:  "",
    paytermCode: "",
    paytermName: "",

    // Currency information (not used by sproc_PHP_PR but kept for UI consistency)
    currCode: "",
    currName: "",
    currRate: "",
    defaultCurrRate: "1.000000",

    tblFieldArray :[],
    prTranTypes: [],
    prTypes: [],
    selectedPrTranType: "",
    selectedPrType: "",
    cutoffCode: "",
    rcCode: "",
    rcName: "", // responsibility center name for display
    requestDept: "",
    refPrNo1: "",
    refPrNo2: "",
    remarks: "",
    billtermCode: "",
    billtermName: "",
    noReprints: "0",
    prCancelled: "",
    userCode: "NSI",
    prNo: "",
    sourcePrBranchCode: "",

    // Detail lines (PR dt1)
    detailRows: [],

    // Modal states
    modalContext: "",
    selectionContext: "",
    selectedRowIndex: null,
    currencyModalOpen: false,
    branchModalOpen: false,
    custModalOpen: false,
    billtermModalOpen: false,
    showCancelModal: false,
    showAttachModal: false,
    showSignatoryModal: false,
    showPostModal: false,
    showPaytermModal: false,
    payeeModalOpen: false,
    prLookupModalOpen: false,
    showJobCodesModal:false,

    // RC Lookup modal (table)
    rcLookupModalOpen: false,
    rcLookupContext: "", // "rc" or "reqDept"

    msLookupModalOpen: false,
    vatLookupModalOpen: false,
  });

  const updateState = (updates) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const {
    documentName,
    documentSeries,
    documentDocLen,
    documentID,
    documentStatus,
    documentNo,
    documentDate,
    status,
    originalDocStatus,
    activeTab,
    isLoading,
    showSpinner,

    isDocNoDisabled,
    isSaveDisabled,
    isResetDisabled,
    isFetchDisabled,

    glCurrMode,
    glCurrDefault,
    withCurr2,
    withCurr3,
    glCurrGlobal1,
    glCurrGlobal2,
    glCurrGlobal3,
    defaultCurrRate,


    // Header
    branchCode,
    branchName,

    payeeName,
    payeeCode,

    // Responsibility Center
    rcCode,
    rcName,

    // Requesting Dept
    reqRcCode,
    reqRcName,

    currCode,
    currName,
    attention,
    prDate,
    cutoffFrom,
    cutoffTo,
    prStatus,
    tblFieldArray,
    prTranTypes,
    prTypes,
    selectedPrTranType,
    selectedPrType,
    cutoffCode,
    requestDept,
    refPrNo1,
    refPrNo2,
    remarks,
    billtermCode,
    billtermName,
    noReprints,
    prCancelled,
    userCode,
    showPaytermModal,
    selectedRowIndex,
    prNo,
    sourcePrBranchCode,
    showJobCodesModal,

    detailRows,

    currencyCode,
    currencyName,
    currencyRate,
    payTerm,

    // Modals
    currencyModalOpen,
    branchModalOpen,
    custModalOpen,
    billtermModalOpen,
    showCancelModal,
    showAttachModal,
    showSignatoryModal,
    showPostModal,
    payeeModalOpen,
    prLookupModalOpen,
    paytermCode,
    paytermName,
    prLookupOpen,
    vatLookupModalOpen,

    // RC Lookup
    rcLookupModalOpen,
    rcLookupContext,

    msLookupModalOpen,
  } = state;

  const handleSelectPR = (result) => {
    // Always close the modal
    updateState({ prLookupModalOpen: false });

    // If user clicked Close, result will be null
    if (!result) return;

    const { header, details } = result;

    // 1) Update JO header from selected PR header
    //    Adjust these mappings to what you really want.
    updateState({
      refPrNo1: header.PRNo, // if you have refPrNo1 in JO header
      // you can also carry dept / remarks if needed:
      requestDept: header.ReqRcCode ?? state.requestDept,
      remarks: state.remarks || header.Particulars || "",
    });

    // 2) Map selected PR detail lines into JO detailRows
    //    Adjust the target fields based on your JO row schema.
    const mappedDetails = details.map((d) => ({
      // Example mapping – change to your JO detail structure:
      jobCode: d.JobCode, // or from d.Type / some lookup
      scopeOfWork: d.ScopeOfWork,
      specification: "",
      quantity: d.QtyNeeded?.toString() ?? "0",
      unitPrice: "0.000000",
      uomCode: d.UOM,
      grossAmt: "0.000000",
      discRate: "0.000000",
      discAmt: "0.000000",
      totalAmt: "0.000000",
      vatCode: "",
      vatAmt: "0.000000",
      netAmt: "0.000000",
      deliveryDate: d.DateNeeded?.substring(0, 10) || "",
      prNo: d.PRNo,
      prLn: d.Ln?.toString() ?? "",
    }));

    const newDetailRows = [...state.detailRows, ...mappedDetails];

    updateState({
      detailRows: newDetailRows,
    });
  };

  const [header, setHeader] = useState({
    jo_date: new Date().toISOString().split("T")[0],
  });

  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  const [totals, setTotals] = useState({
    totalGross: "0.000000",
    totalVat: "0.000000",
    totalNet: "0.000000",
  });

  // PR.jsx
  const docType = docTypes?.JO || "JO";

  const pdfLink = docTypePDFGuide[docType];
  const videoLink = docTypeVideoGuide[docType];
  const documentTitle = docTypeNames[docType] || "Job Order";

  const displayStatus = status || "OPEN";
  const statusMap = {
    FINALIZED: "global-tran-stat-text-finalized-ui",
    CANCELLED: "global-tran-stat-text-closed-ui",
    CLOSED: "global-tran-stat-text-closed-ui",
  };
  const statusColor = statusMap[displayStatus] || "";
  const isFormDisabled = ["FINALIZED", "CANCELLED", "CLOSED"].includes(
    displayStatus
  );

  const updateTotalsDisplay = (rows) => {
    const arr = rows || [];

    let gross = 0;
    let vat = 0;
    let net = 0;

    arr.forEach((r) => {
      gross += parseFormattedNumber(r.grossAmt || 0);
      vat += parseFormattedNumber(r.vatAmt || 0);
      net += parseFormattedNumber(r.netAmt || 0);
    });

    setTotals({
      totalGross: formatNumber(gross||0),
      totalVat: formatNumber(vat||0),
      totalNet: formatNumber(net||0),
    });
  };

  const handleCurrencyRateBlur = (e) => {
    const num = formatNumber(e.target.value, 6);
    updateState({
      currencyRate: isNaN(num) ? "0.000000" : num,
      withCurr2:
        (glCurrMode === "M" && glCurrDefault !== currencyCode) ||
        glCurrMode === "D",
      withCurr3: glCurrMode === "T",
    });
  };

  // ==========================
  // EFFECTS
  // ==========================

  useEffect(() => {
      if (resetFlag) {    
        handleReset();
      }  
      let timer;
      if (isLoading) {
        timer = setTimeout(() => updateState({ showSpinner: true }), 200);
      } else {
        updateState({ showSpinner: false });
      } 
      return () => clearTimeout(timer);
  }, [resetFlag, isLoading]);




  useEffect(() => {
    updateState({ isDocNoDisabled: !!state.documentID });
  }, [state.documentID]);


  useEffect(() => {
    if (glCurrMode && glCurrDefault && currCode) {
      loadCurrencyMode(glCurrMode, glCurrDefault, currCode);
    }
  }, [glCurrMode, glCurrDefault, currCode]);



  useEffect(() => {
    loadCompanyData();
    handleReset();
  }, []);




  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "F1") { e.preventDefault(); updateState({showAllTranDocNo:true}); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);







  const LoadingSpinner = () => (
    <div className="global-tran-spinner-main-div-ui">
      <div className="global-tran-spinner-sub-div-ui">
        <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-blue-500 mb-2" />
        <p>Please wait...</p>
      </div>
    </div>
  );


  // ==========================
  // INITIAL LOAD / RESET
  // ==========================

  const handleReset = () => {
   

    updateState({
      branchCode: currentUserRow.branchCode,
      branchName: currentUserRow.branchName,
      userCode:currentUserRow.userCode,
      documentDate:useGetCurrentDay(),
      rcCode: "",
      rcName: "",
      reqRcCode: "",
      reqRcName: "",
      refPrNo1: "",
      refPrNo2: "",
      remarks: "",
      payeeCode:"",
      payeeName:"",
      paytermName:"",
      paytermCode:"",
      attention:"",
      documentNo: "",
      documentID: "",
      documentStatus: "",
      activeTab: "basic",
      isLoading: false,
      showSpinner: false,
      isDocNoDisabled: false,
      isSaveDisabled: false,
      isResetDisabled: false,
      isFetchDisabled: false,
      status: "OPEN",
      noReprints: "0",
      prCancelled: "",
      detailRows: [],
      rcLookupModalOpen: false,
      rcLookupContext: "",
      msLookupModalOpen: false,
      selectedRowIndex: null,
    });

    updateTotalsDisplay([]);
  };


  const loadCompanyData = async () => {
    updateState({ isLoading: true });
    try {
     

      const hsOption = await useTopHSOption();
      if (hsOption) {
        updateState({
          glCurrMode: hsOption.glCurrMode,
          glCurrDefault: hsOption.glCurrDefault,
          currCode: hsOption.glCurrDefault,
          glCurrGlobal1: hsOption.glCurrGlobal1,
          glCurrGlobal2: hsOption.glCurrGlobal2,
          glCurrGlobal3: hsOption.glCurrGlobal3,
        });

        const curr = await useTopCurrencyRow(hsOption.glCurrDefault);
        if (curr) {
          updateState({
            currName: curr.currName,
            currRate: formatNumber(1, 6),
          });
        }
      }


     const tbls = 'jo_hd,jo_dt1'
     const hdtblcol_result = await useFieldLenghtCheck(tbls);
     if (hdtblcol_result){
       updateState({tblFieldArray :hdtblcol_result })
     }


    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      updateState({ isLoading: false });
    }
  };


  
  const handleClosePayeeModal = async (selectedData) => {
  if (!selectedData) {
    updateState({ payeeModalOpen: false });
    return;
  }

  updateState({ payeeModalOpen: false, isLoading: true });

  try {
    const { 
      vendCode = "", 
      vendName = "", 
      currCode = "" 
    } = selectedData;

    const payeeData = await useTopPayeeRow(vendCode);
    const payTermData = await useTopPayTermRow(payeeData?.paytermCode);

    updateState({
      payeeCode: vendCode,
      payeeName: vendName,
      attention: payeeData?.vendContact || "",
      paytermCode: payTermData?.paytermCode || "",
      paytermName: payTermData?.paytermName || "",
    });

    await handleSelectCurrency(payeeData?.currCode||"PHP");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    updateState({ isLoading: false });
  }
};


  const handleFetchDetail = async (vendCode) => {
    if (!vendCode) return [];

    try {
      const vendPayload = {
        json_data: {
          vendCode: vendCode,
        },
      };

      const vendResponse = await postRequest(
        "addPayeeDetail",
        JSON.stringify(vendPayload)
      );
      const rawResult = vendResponse.data[0]?.result;

      const parsed = JSON.parse(rawResult);
      return parsed;
    } catch (error) {
      console.error("Error fetching data:", error);
      return [];
    }
  };




  const loadCurrencyMode = (
    mode = glCurrMode,
    defaultCurr = glCurrDefault,
    curr = currCode
  ) => {
    const calcWithCurr3 = mode === "T";
    const calcWithCurr2 =
      (mode === "M" && defaultCurr !== curr) || mode === "D" || calcWithCurr3;

    updateState({
      glCurrMode: mode,
      withCurr2: calcWithCurr2,
      withCurr3: calcWithCurr3,
    });
  };

  const loadDocControl = async () => {
    const data = await useTopDocControlRow(docType);
    if (data) {
      updateState({
        documentName: data.docName,
        documentSeries: data.docName,
        documentDocLen: data.docName,
      });
    }
  };



  const handleClosePaytermModal = (selectedPayterm) => {
  if (!selectedPayterm) {
    updateState({ showPaytermModal: false });
    return;
  }

  updateState({
    paytermCode: selectedPayterm.paytermCode,
    paytermName: selectedPayterm.paytermName,
    showPaytermModal: false,
  });
};
  



const fetchTranData = async (documentNo, branchCode,direction='') => {
  const resetState = () => {
    updateState({documentNo:'', documentID: '', isDocNoDisabled: false, isFetchDisabled: false });
    updateTotals([]);
  };

  updateState({ isLoading: true });

  try {
    const data = await useFetchTranData(documentNo, branchCode,docType,"joNo",direction);

   
    if (!data?.prId) {
      Swal.fire({ icon: 'info', title: 'No Records Found', text: 'Transaction does not exist.' });
      return resetState();
    }


    // Format rows
    const retrievedDetailRows = (data.dt1 || []).map(item => ({
      ...item,
      quantity: formatNumber(item.quantity,2),
      unitPrice: formatNumber(item.unitPrice,decUPrice),
      grossAmt: formatNumber(item.grossAmt,2),
      discRate: formatNumber(item.discRate,2),
      discAmt: formatNumber(item.discAmt,2),
      vatAmt: formatNumber(item.vatAmt,2),
      netAmt: formatNumber(item.netAmt,2),
    }));

   

  
    // Update state with fetched data
    updateState({

      documentStatus: data.joHStatus,
      status: data.joStatus,
      originalDocStatus:data.joHStatus,
      documentID: data.joId,
      documentNo: data.joNo,
      branchCode: data.branchCode,
      documentDate: useFormatToDate(data.joDate),
      rcCode: data.rcCode,
      rcName: data.rcName,
      payeeCode: data.payeeCode,
      payeeName: data.payeeName,
      currCode: data.currCode,
      currRate: formatNumber(data.currRate,6),
      paytermCode: data.paytermCode,
      paytermName: data.paytermName,
      prNo: data.prNo,   
      remarks: data.remarks,
      joCancelled: data.joCancelled ,
      noReprints: data.noReprints,
      detailRows: retrievedDetailRows,
      isDocNoDisabled: true,
      isFetchDisabled: true,
    });

   
    updateTotals(retrievedDetailRows);

  } catch (error) {
    console.error("Error fetching transaction data:", error);
    Swal.fire({ icon: 'error', title: 'Fetch Error', text: error.message });
    resetState();
  } finally {
    updateState({ isLoading: false });
  }
};













  const handleDocNoBlur = () => {
    if (!state.documentID && state.documentNo && state.branchCode) {
      fetchTranData(state.documentNo, state.branchCode);
    }
  };

  // ==========================
  // HEADER EVENTS
  // ==========================


const createEmptyDetailRow = (vatCode = "", vatName = "") => ({
  jobCode: "",
  scopeOfWork: "",
  specification: "",
  quantity: formatNumber(1, 2),
  unitPrice: formatNumber(0, decUPrice),
  uomCode: "",
  grossAmt: formatNumber(0, 2),
  discRate: formatNumber(0, 2),
  discAmt: formatNumber(0, 2),
  totalAmt: formatNumber(0, 2),
  vatCode: vatCode,
  vatName: vatName,
  vatAmt: formatNumber(0, 2),
  netAmt: formatNumber(0, 2),
  deliveryDate: documentDate,
  prNo: "",
  prLn: ""
});


const handleAddRow = async (index) => {
  await insertNewRow(index);
};


const handleAddRowClick = async () => {
  const fields = { "Header : Department": rcName, "Header : Payee": payeeCode };
  if (!useSwalvalidateRequiredFields(fields, "Add Item") || isFormDisabled) return;

  try {
    const updatedRows = await insertNewRow();
    
    const netTotal = updatedRows.reduce((acc, r) => acc + (parseFormattedNumber(r.netAmt) || 0), 0);
    updateTotalsDisplay(netTotal);
    setShowTypeDropdown(false);
  } catch (error) {
    console.error(error);
  }
};


const insertNewRow = async (index = -1) => {
  let vatCode = "";
  let vatName = "";


  if (detailRows.length > 0) {
    vatCode = detailRows[0].vatCode || "";
    vatName = detailRows[0].vatName || "";
  } else {
    const data = await handleFetchDetail(payeeCode);
    const item = Array.isArray(data) ? data[0] : data;
    vatCode = item?.vatCode || "";
    vatName = item?.vatName || "";
  }

  const newRow = createEmptyDetailRow(vatCode, vatName);
  const updatedRows = [...detailRows];

  if (index === -1 || documentNo) {
    updatedRows.push(newRow);
  } else {
    updatedRows.splice(index + 1, 0, newRow);
  }

  updateState({ detailRows: updatedRows });
  return updatedRows;
};







  // When user picks FG / MS / RM
  // const handleSelectTypeAndAddRow = (typeCode) => {
  //   const today = documentDate || new Date().toISOString().split("T")[0];

  //   const newRow = {
  //     invType: typeCode,
  //     groupId: "",
  //     prStatus: status || "",
  //     itemCode: "",
  //     itemName: "",
  //     uomCode: "",
  //     qtyOnHand: "0.000000",
  //     qtyAlloc: "0.000000",
  //     qtyNeeded: "0.000000",
  //     uomCode2: "",
  //     uomQty2: "0.000000",
  //     itemSpecs: "",
  //     serviceCode: "",
  //     serviceName: "",
  //     poQty: "0.000000",
  //     rrQty: "0.000000",
  //   };

  //   const updatedRows = [...detailRows, newRow];
  //   updateState({ detailRows: updatedRows });

  //   const totalQty = updatedRows.reduce(
  //     (acc, r) => acc + (parseFormattedNumber(r.qtyNeeded) || 0),
  //     0
  //   );
  //   updateTotalsDisplay(totalQty);

  //   setShowTypeDropdown(false);
  // };

  // const handleOpenMSLookup = () => {
  //   if (isFormDisabled) return;
  //   setShowTypeDropdown(false);
  //   updateState({ msLookupModalOpen: true });
  // };



  const handleDeleteRow = (index) => {
    const updatedRows = [...detailRows];
    updatedRows.splice(index, 1);

    updateState({ detailRows: updatedRows });

    const netTotal = updatedRows.reduce(
      (acc, r) => acc + (parseFormattedNumber(r.netAmt) || 0),
      0
    );
    updateTotalsDisplay(updatedRows);
  };



 const handleDetailChange = async (index, field, value, runCalculations = true) => {
  const updatedRows = [...detailRows];
  let row = { ...updatedRows[index], [field]: value };

  if (field === 'vatCode') {
    row.vatCode = value.vatCode;
    row.vatName = value.vatName;
  }


 if (field === 'jobCode') {
    row.jobCode = value.jobCode;
    row.scopeOfWork = value.jobName;
    row.uomCode = value.uomCode;
  }


  if (runCalculations) {
    const qty = parseFormattedNumber(row.quantity) || 0;
    const price = parseFormattedNumber(row.unitPrice) || 0;
    const gross = +(qty * price).toFixed(2);
    
    let dAmt = parseFormattedNumber(row.discAmt) || 0;
    let dRate = parseFormattedNumber(row.discRate) || 0;

    if (['quantity', 'unitPrice', 'discRate'].includes(field)) {
      dRate = field === 'discRate' ? parseFormattedNumber(value) : dRate;
      dAmt = +(dRate * gross * 0.01).toFixed(2);
    } else if (field === 'discAmt') {
      dAmt = parseFormattedNumber(value);
      dRate = gross !== 0 ? +((dAmt / gross) * 100).toFixed(2) : 0;
    }

    const total = +(gross - dAmt).toFixed(2);
    
    // Kunin ang pinakabagong vatCode para sa recalculation
    const vCode = row.vatCode || "";
    const vAmt = vCode ? await useTopVatAmount(vCode, total) : 0;
    const net = +(total - vAmt).toFixed(2);

    row = {
      ...row,
      grossAmt: formatNumber(gross),
      totalAmt: formatNumber(total),
      vatAmt: formatNumber(vAmt),
      netAmt: formatNumber(net),
      quantity: formatNumber(qty),
      unitPrice: formatNumber(price, decUPrice),
      discRate: formatNumber(dRate),
      discAmt: formatNumber(dAmt)
    };
  }

  updatedRows[index] = row;
  updateState({ detailRows: updatedRows });
  updateTotalsDisplay(updatedRows);
};


  
  // ==========================
  // SAVE / UPSERT (PR + DT1)
  // ==========================
  const handleActivityOption = async (mode) => {
    if (originalDocStatus !=="O" || detailRows.length===0 ) {
      return;
    }

 
    updateState({ isLoading: true });

    try {
      const {
        branchCode,
        documentNo,
        documentID,
        attention,
        payeeCode,
        payeeName,
        currCode,
        currRate,
        paytermCode,
        prNo,
        documentDate,
        rcCode,
        remarks,
        detailRows,
        documentStatus,
      } = state;

 

      const joData = {
        branchCode: branchCode,
        joNo:  documentNo || "",
        joId: documentID || "",
        joDate: documentDate,
        rcCode: rcCode || "",
        payeeCode: payeeCode || "",
        payeeName: payeeName || "",
        attention: attention || "",
        currCode: currCode || "",
        currRate: currRate || 1,
        paytermCode: paytermCode || "",
        prNo:prNo || "",
        remarks: remarks || "",
        joStatus: documentStatus?.length ? documentStatus : "O",
        userCode: userCode,

        dt1: detailRows.map((row, index) => ({
          lnNo: index + 1,
          groupId: row.groupId || "",   
          jobCode: row.jobCode || "",
          scopeOfWork: row.scopeOfWork || "",
          specification: row.specification || "",
          quantity: parseFormattedNumber(row.quantity || 0),
          unitPrice: parseFormattedNumber(row.unitPrice || 0),
          uomCode: row.uomCode || "",
          grossAmt: parseFormattedNumber(row.grossAmt || 0),
          discRate: parseFormattedNumber(row.discRate || 0),
          discAmt: parseFormattedNumber(row.discAmt || 0),
          totalAmt: parseFormattedNumber(row.totalAmt || 0),
          vatCode: row.vatCode || "",
          vatAmt: parseFormattedNumber(row.vatAmt || 0),
          netAmt: parseFormattedNumber(row.netAmt || 0),
          deliveryDate: row.deliveryDate || null    
        })),
      };


    
      const response = await useTransactionUpsert(docType,joData,updateState,"joId","joNo");

      if (response) {

        if (documentStatus==="C"){
          await fetchTranData(documentNo,branchCode)
        }

    
        const isZero = Number(noReprints) === 0;
                        const onSaveAndPrint =
                          isZero
                            ? () => updateState({ showSignatoryModal: true })                  
                            : () => handleSaveAndPrint(response.data[0].prId); 
                        useSwalshowSaveSuccessDialog(
                          handleReset,          
                          onSaveAndPrint       
                        );

      }

      updateState({ isDocNoDisabled: true, isFetchDisabled: true });
    } catch (error) {
      console.error("Error during transaction upsert:", error);
    } finally {
      updateState({ isLoading: false });
    }
  };



  // ==========================
  // PRINT / CANCEL / POST / ATTACH
  // ==========================



  
  const handlePrint = async () => {
    if (!documentID) return;
    updateState({ showSignatoryModal: true });
  };

  const handleCancel = async () => {
    if (documentID && documentStatus === "") {
      updateState({ showCancelModal: true });
    }
  };

  const handlePost = async () => {
    if (documentID && documentStatus === "") {
      updateState({ showPostModal: true });
    }
  };

  const handleAttach = async () => {
    updateState({ showAttachModal: true });
  };

  const handleCopy = async () => {
    if (detailRows.length === 0) return;

    if (documentID) {
      updateState({
        documentNo: "",
        documentID: "",
        documentStatus: "",
        status: "Open",
      });
    }
  };


  
  const handleHeaderStatusChange = (value) => {
    if (value === "X" || value === "C") {
      const isCancel = value === "X";
      const actionWord = isCancel ? "CANCEL" : "CLOSE";
  
      useSwalConfirmAlert(
        `Confirm Full Document ${isCancel ? "Cancellation" : "Closing"}?`,
        `Are you sure you want to ${actionWord} this entire JO? This action is permanent and will affect all open line items.`
      ).then((result) => {
        if (result.isConfirmed) {
          if (isCancel) {
            handleCancel(); 
          } else {
            const updatedRows = detailRows.map(row => {
              if (row.joStatus === "O" || !row.joStatus) {
                return { ...row, joStatus: "C" };
              }
              return row;
            });
  
            updateState({ 
              documentStatus: "C", 
              detailRows: updatedRows,
              isFormDisabled:true,
            });
          }
        } else {
          updateState({ documentStatus: "O" });
        }
      });
    } else {
      updateState({ documentStatus: value });
    }
  };
  






  // ==========================
  // HISTORY – URL PARAM HANDLING
  // ==========================

  

const cleanUrl = useCallback(() => {
  window.history.replaceState({}, "", window.location.origin);
}, []);
const handleHistoryRowPick = useCallback(
  async (row) => {
    const docNo = row?.docNo;
    const branchCode = row?.branchCode;
    if (!docNo || !branchCode) return;

    await fetchTranData(docNo, branchCode); 
    setTopTab("details");
    cleanUrl(); // 
  },
  [fetchTranData, cleanUrl]
);



useEffect(() => {
  const params = new URLSearchParams(location.search);
  const docNo = params.get("jONo");
  const branchCode = params.get("branchCode");

  if (!loadedFromUrlRef.current && docNo && branchCode) {
    loadedFromUrlRef.current = true;
    handleHistoryRowPick({ docNo, branchCode });
  }
}, [location.search, handleHistoryRowPick]);




  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const docNo = params.get("prNo");
    const brCode = params.get("branchCode");

    if (!loadedFromUrlRef.current && docNo && brCode) {
      loadedFromUrlRef.current = true;
      handleHistoryRowPick({ docNo, branchCode: brCode });
      cleanUrl();
    }
  }, [location.search, handleHistoryRowPick, cleanUrl]);

  const printData = {
    pr_no: documentNo,
    branch: branchCode,
    doc_id: docType,
  };

  // ==========================
  // MODAL CLOSE HANDLERS
  // ==========================

  const handleCloseCancel = async (confirmation) => {
    if (confirmation && documentStatus !== "OPEN" && documentID !== null) {
      const result = await useHandleCancel(
        docType,
        documentID,
        userCode || "NSI",
        confirmation.reason,
        updateState
      );

      if (result.success) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: result.message,
        });
      }

      await fetchTranData(documentNo, branchCode);
    }
    updateState({ showCancelModal: false });
  };

  const handleClosePost = async () => {
    if (documentStatus !== "OPEN" && documentID !== null) {
      const result = await useHandlePost(
        docType,
        documentID,
        userCode,
        updateState
      );
      if (result.success) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: result.message,
        });
      }
      await fetchTranData(documentNo, branchCode);
    }
    updateState({ showPostModal: false });
  };

  const handleCloseSignatory = async (mode) => {
    updateState({
      showSpinner: true,
      showSignatoryModal: false,
      noReprints: mode === "Final" ? 1 : 0,
    });
    await useHandlePrint(documentID, docType, mode);
    updateState({
      showSpinner: false,
    });
  };

  const handleSaveAndPrint = async (prId) => {
    updateState({ showSpinner: true });
    await useHandlePrint(prId, docType);
    updateState({ showSpinner: false });
  };

  const handleCloseBranchModal = (selectedBranch) => {
    if (selectedBranch) {
      updateState({
        branchCode: selectedBranch.branchCode,
        branchName: selectedBranch.branchName,
      });
    }
    updateState({ branchModalOpen: false });
  };


const handleCloseRCModal = (selectedRC) => {
  if (selectedRC) {
    updateState({
      ...selectedRC,
      rcLookupModalOpen: false
    });
  }
};




const handleCloseJobCodesLookup = (selectedItems) => {
  if (selectedItems) {
   handleDetailChange(selectedRowIndex, 'jobCode', selectedItems, false)
  }
  updateState({ showJobCodesModal: false });
};


  
  const handleCloseVATLookup = async (selectedVat) => {
  if (selectedVat && selectedRowIndex !== null) {
    const result = await useTopVatRow(selectedVat.vatCode);
    if (result) handleDetailChange(selectedRowIndex, 'vatCode', result, true);
  }

  updateState({ 
    vatLookupModalOpen: false, 
    selectedRowIndex: null 
  });
};
  



  

  const handleCloseCurrencyModal = async (selectedCurrency) => {
    if (selectedCurrency) {
    handleSelectCurrency(selectedCurrency.currCode);
  };
    updateState({ currencyModalOpen: false });
  }




  const handleSelectCurrency = async (currCode) => {
    if (currCode) {

     const result = await useTopCurrencyRow(currCode);
      if (result) {
        const rate = currCode === glCurrDefault
          ? defaultCurrRate
          : await useTopForexRate(currCode, documentDate);

        updateState({
          currCode: result.currCode,
          currName: result.currName,
          currRate: formatNumber(parseFormattedNumber(rate),6)
        });
      }
    }
  };




  const handleClosePRLookup = (selectedRow) => {
    if (!selectedRow) {
      updateState({ prLookupModalOpen: false });
      return;
    }

    // Map all the fields you want from the selected PR
    updateState({
      prLookupModalOpen: false,
      prNo: selectedRow.prNo || "",
      sourcePrBranchCode: selectedRow.branchCode || "",
      // Optional: pre-fill some JO header values from PR
      reqRcCode: selectedRow.reqRcCode || state.reqRcCode,
      reqRcName: selectedRow.reqRcName || state.reqRcName,
      remarks: state.remarks || selectedRow.remarks || "",
    });
  };


 const hasExistingJO = detailRows.some(row => {
  return row.joNo !== null && row.joNo !== undefined && row.joNo.toString().trim() !== "";
});


  return (
    <div className="global-tran-main-div-ui">
      {showSpinner && <LoadingSpinner />}

      <div className="global-tran-headerToolbar-ui">
        <Header
          docType={docType} 
          pdfLink={pdfLink} 
          videoLink={videoLink}
          onPrint={handlePrint} 
          onPost={handlePost} 
          printData={printData} 
          onReset={handleReset}
          onSave={() => handleActivityOption('Upsert')}
          onCancel={handleCancel} 
          onCopy={handleCopy} 
          onAttach={handleAttach}

          activeTopTab={topTab} 
          showActions={topTab === "details"} 
          showBIRForm={false}   
          showCopyForm ={true} 
          isViewDocument={isViewDocument}  
          onDetails={() => setTopTab("details")}
          onHistory={() => setTopTab("history")}
          disableRouteNavigation={true}         
          isSaveDisabled={isSaveDisabled} 
          isResetDisabled={isResetDisabled} 
          detailsRoute="/page/JO"
        />
      </div>

      <div className={topTab === "details" ? "" : "hidden"}>
        {/* Header Section */}
        <div className="global-tran-header-ui">
          <div className="global-tran-headertext-div-ui">
            <h1 className="global-tran-headertext-ui">{documentTitle}</h1>
          </div>

          <div className="global-tran-headerstat-div-ui">
            <div>
              <p className="global-tran-headerstat-text-ui">
                Transaction Status
              </p>
              <h1 className={`global-tran-stat-text-ui ${statusColor}`}>
                {displayStatus}
              </h1>
            </div>
          </div>
        </div>

        {/* Form Layout with Tabs */}
        <div className="global-tran-header-div-ui">
          {/* Tab Navigation */}
          <div className="global-tran-header-tab-div-ui">
            <button
              className={`global-tran-tab-padding-ui ${
                activeTab === "basic"
                  ? "global-tran-tab-text_active-ui"
                  : "global-tran-tab-text_inactive-ui"
              }`}
              onClick={() => updateState({ activeTab: "basic" })}
            >
              Basic Information
            </button>
          </div>

          {/* PR Header Form Section */}
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 rounded-lg relative"
            id="pr_hd"
          >
            {/* Columns 1–3 (Header fields) */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Column 1: Branch / PR No / PR Date */}
              <div className="global-tran-textbox-group-div-ui">
                {/* Branch */}
                <div className="relative">
                  <input
                    type="text"
                    id="branchName"
                    placeholder=" "
                    value={branchName}
                    readOnly
                    onFocus={(e) => e.target.blur()}
                    className="peer global-tran-textbox-ui cursor-pointer select-none"
                  />
                  <label
                    htmlFor="branchName"
                    className="global-tran-floating-label"
                  >
                    Branch
                  </label>
                  <button
                    type="button"
                    className={`global-tran-textbox-button-search-padding-ui ${
                      isFetchDisabled
                        ? "global-tran-textbox-button-search-disabled-ui"
                        : "global-tran-textbox-button-search-enabled-ui"
                    } global-tran-textbox-button-search-ui`}
                    disabled={
                      state.isFetchDisabled ||
                      state.isDocNoDisabled ||
                      isFormDisabled
                    }
                    onClick={() =>
                      !isFormDisabled && updateState({ branchModalOpen: true })
                    }
                  >
                    <FontAwesomeIcon icon={faMagnifyingGlass} />
                  </button>
                </div>

                {/* PR No */}
                <div className="relative">
                  <input
                    type="text"
                    id="documentNo"
                    value={state.documentNo}
                    onChange={(e) =>
                      updateState({ documentNo: e.target.value })
                    }
                    onBlur={handleDocNoBlur}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        document.getElementById("documentDate")?.focus();
                      }
                    }}
                    placeholder=" "
                    className={`peer global-tran-textbox-ui ${
                      state.isDocNoDisabled
                        ? "bg-blue-100 cursor-not-allowed"
                        : ""
                    }`}
                    disabled={state.isDocNoDisabled}
                  />
                  <label htmlFor="joNo" className="global-tran-floating-label">
                    JO No.
                  </label>
                  <button
                    className={`global-tran-textbox-button-search-padding-ui ${
                      state.isFetchDisabled || state.isDocNoDisabled
                        ? "global-tran-textbox-button-search-disabled-ui"
                        : "global-tran-textbox-button-search-enabled-ui"
                    } global-tran-textbox-button-search-ui`}
                    disabled={state.isFetchDisabled || state.isDocNoDisabled}
                    onClick={() => {
                      if (!state.isDocNoDisabled) {
                        fetchTranData(state.documentNo, state.branchCode);
                      }
                    }}
                  >
                    <FontAwesomeIcon icon={faMagnifyingGlass} />
                  </button>
                </div>

                {/* PR Date */}
                <div className="relative">
                  <input
                    type="date"
                    id="documentDate"
                    className="peer global-tran-textbox-ui"
                    value={state.documentDate}
                    onChange={(e) =>
                      setHeader((prev) => ({
                        ...prev,
                        pr_date: e.target.value,
                      }))
                    }
                    disabled={isFormDisabled}
                  />
                  <label
                    htmlFor="documentDate"
                    className="global-tran-floating-label"
                  >
                    JO Date
                  </label>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    id="prNo"
                    value={prNo}
                    readOnly
                    placeholder=" "
                    className="peer global-tran-textbox-ui cursor-pointer select-none"
                    onFocus={(e) => e.target.blur()}
                  />
                  <label
                    htmlFor="prNo"
                    className="global-tran-floating-label"
                  >
                    PR No.
                  </label>
                  <button
                    type="button"
                    className={`global-tran-textbox-button-search-padding-ui ${
                      isFormDisabled
                        ? "global-tran-textbox-button-search-disabled-ui"
                        : "global-tran-textbox-button-search-enabled-ui"
                    } global-tran-textbox-button-search-ui`}
                    disabled={isFormDisabled}
                    onClick={() => updateState({ prLookupModalOpen: true })}
                  >
                    <FontAwesomeIcon icon={faMagnifyingGlass} />
                  </button>
                </div>
              </div>

              {/* Column 2: Responsibility Center / Requesting Dept / Tran Type */}
              <div className="global-tran-textbox-group-div-ui">
                {/* Responsibility Center */}

                {/* Requesting Dept. */}
                <div className="relative group flex-[1.3]">
                  <input
                    type="text"
                    id="rcName"
                    value={rcName}
                    readOnly
                    placeholder=" "
                    className="peer global-tran-textbox-ui"
                  />
                  <label
                    htmlFor="rcName"
                    className="global-tran-floating-label"
                  >
                    Department
                  </label>
                  <button
                    type="button"
                    className={`global-tran-textbox-button-search-padding-ui ${
                      isFetchDisabled
                        ? "global-tran-textbox-button-search-disabled-ui"
                        : "global-tran-textbox-button-search-enabled-ui"
                    } global-tran-textbox-button-search-ui`}
                    disabled={isFormDisabled}
                    onClick={() =>
                      !isFormDisabled &&
                      updateState({
                        rcLookupModalOpen: true,
                        rcLookupContext: "reqDept",
                      })
                    }
                  >
                    <FontAwesomeIcon icon={faMagnifyingGlass} />
                  </button>
                </div>

                {/* PR Tran Type */}
                {/* Payee Code Input with optional lookup */}
                <div className="relative">
                  <input
                    type="text"
                    id="payeeCode"
                    value={payeeCode || ""}
                    readOnly
                    placeholder=" "
                    className="peer global-tran-textbox-ui"
                    disabled={isFormDisabled}
                  />
                  <label
                    htmlFor="payeeCode"
                    className="global-tran-floating-label"
                  >
                    <span className="global-tran-asterisk-ui"> * </span>
                    Payee Code
                  </label>
                  <button
                    type="button"
                    onClick={() => updateState({ payeeModalOpen: true })}
                    className={`global-tran-textbox-button-search-padding-ui ${
                      isFetchDisabled
                        ? "global-tran-textbox-button-search-disabled-ui"
                        : "global-tran-textbox-button-search-enabled-ui"
                    } global-tran-textbox-button-search-ui`}
                    disabled={isFormDisabled}
                  >
                    <FontAwesomeIcon icon={faMagnifyingGlass} />
                  </button>
                </div>

                {/* Payee Name Display */}
                <div className="relative">
                  <input
                    type="text"
                    id="payeeName"
                    placeholder=" "
                    value={payeeName || ""}
                    className="peer global-tran-textbox-ui"
                    disabled={isFormDisabled}
                  />
                  <label
                    htmlFor="payeeName"
                    className="global-tran-floating-label"
                  >
                    <span className="global-tran-asterisk-ui"> * </span>
                    Payee Name
                  </label>
                </div>

                {/* Ref No (Ref PR No1) */}
                <div className="relative">
                  <input
                    type="text"
                    id="attention"
                    value={attention}
                    placeholder=" "
                    onChange={(e) => updateState({ attention: e.target.value })}
                    className="peer global-tran-textbox-ui"
                    disabled={isFormDisabled}
                    maxLength={useGetFieldLength(tblFieldArray, "vend_contact")} 
                  />
                  <label
                    htmlFor="attention"
                    className="global-tran-floating-label"
                  >
                    Attention
                  </label>
                </div>
              </div>

              {/* Column 3: PR Type / Date Needed / Ref No / Total Qty */}
              <div className="global-tran-textbox-group-div-ui">
                <div className="relative">
                  <input
                    type="text"
                    id="currCode"
                    placeholder=" "
                    value={currName}
                    readOnly
                    className="peer global-tran-textbox-ui"
                    disabled={isFormDisabled}
                  />
                  <label
                    htmlFor="currCode"
                    className="global-tran-floating-label"
                  >
                    Currency
                  </label>
                  <button
                    onClick={() => updateState({ currencyModalOpen: true })}
                    className={`global-tran-textbox-button-search-padding-ui ${
                      isFetchDisabled
                        ? "global-tran-textbox-button-search-disabled-ui"
                        : "global-tran-textbox-button-search-enabled-ui"
                    } global-tran-textbox-button-search-ui`}
                    disabled={isFormDisabled}
                  >
                    <FontAwesomeIcon icon={faMagnifyingGlass} />
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    id="currRate"
                    value={currencyRate}
                    onChange={(e) =>
                      updateState({ currencyRate: e.target.value })
                    }
                    onBlur={handleCurrencyRateBlur}
                    placeholder=" "
                    className="peer global-tran-textbox-ui"
                    disabled={isFormDisabled || glCurrDefault === currencyCode}
                  />
                  <label
                    htmlFor="currRate"
                    className="global-tran-floating-label"
                  >
                    Currency Rate
                  </label>
                </div>

                {/* Date Needed */}
                <div className="relative">
                  <input
                    type="text"
                    id="payTerm"
                    value={paytermName}
                    placeholder=" "
                    onChange={(e) =>
                      updateState({ paytermName: e.target.value })
                    }
                    className="peer global-tran-textbox-ui"
                    disabled={isFormDisabled}
                  />
                  <label
                    htmlFor="payTerm"
                    className="global-tran-floating-label"
                  >
                    Payment Term
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      updateState({
                        showPaytermModal: true,
                        selectedRowIndex: null,
                      })
                    }
                    className={`global-tran-textbox-button-search-padding-ui ${
                      isFetchDisabled
                        ? "global-tran-textbox-button-search-disabled-ui"
                        : "global-tran-textbox-button-search-enabled-ui"
                    } global-tran-textbox-button-search-ui`}
                    disabled={isFormDisabled}
                  >
                    <FontAwesomeIcon icon={faMagnifyingGlass} />
                  </button>
                </div>

                {/* JO Status */}
                <div className="relative">
                <select
                id="documentStatus"
                className="peer global-tran-textbox-ui"
                value={documentStatus || "O"}
                onChange={(e) => handleHeaderStatusChange(e.target.value)}
                disabled={isFormDisabled || !documentID?.length || documentStatus !=="O" }
              >
                <option value="O">Open</option>
                <option value="C">Closed</option>
                
                {/* 2. Only render "Cancelled" if no rows have a PO record */}
                {!hasExistingJO && documentStatus ==="O" && (
                  <option value="X">Cancelled</option>
                )}
              </select>
                <label htmlFor="documentStatus" className="global-tran-floating-label">
                  JO Status
                </label>
                <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                  <svg
                    className="h-4 w-4 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
              </div>


              {/* Remarks (spans all 3 header columns) */}
              <div className="col-span-full">
                <div className="relative p-2">
                  <textarea
                    id="remarks"
                    placeholder=""
                    rows={4}
                    className="peer global-tran-textbox-remarks-ui pt-2"
                    value={remarks}
                    onChange={(e) => updateState({ remarks: e.target.value })}
                    disabled={isFormDisabled}
                  />
                  <label
                    htmlFor="remarks"
                    className="global-tran-floating-label-remarks"
                  >
                    Remarks
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =====================
            PR DETAIL TABLE (DT1)
           ===================== */}
        <div className="global-tran-tab-div-ui">
          <div className="global-tran-tab-nav-ui">
            <div className="flex flex-row sm:flex-row">
              <span className="global-tran-tab-padding-ui global-tran-tab-text_active-ui">
                Job Detail
              </span>
            </div>
          </div>

          <div className="global-tran-table-main-div-ui">
            <div className="global-tran-table-main-sub-div-ui">
              <table className="min-w-full border-collapse">
                <thead className="global-tran-thead-div-ui">
                  <tr>
                    <th className="global-tran-th-ui">LN</th>
                    <th className="global-tran-th-ui">Job Code</th>
                    <th className="global-tran-th-ui">Scope of Work</th>
                    <th className="global-tran-th-ui">Specification</th>
                    <th className="global-tran-th-ui">Quantity</th>
                    <th className="global-tran-th-ui">Unit Price</th>
                    <th className="global-tran-th-ui">UOM</th>
                    <th className="global-tran-th-ui">Gross Amount</th>
                    <th className="global-tran-th-ui">Disc Rate</th>
                    <th className="global-tran-th-ui">Disc Amount</th>
                    <th className="global-tran-th-ui">Total Amount</th>
                    <th className="global-tran-th-ui">VAT Code</th>
                    <th className="global-tran-th-ui">VAT Name</th>
                    <th className="global-tran-th-ui">VAT Amount</th>
                    <th className="global-tran-th-ui">Net Amount</th>
                    <th className="global-tran-th-ui">Delivery Date</th>
                    <th className="global-tran-th-ui">PR No</th>
                    <th className="global-tran-th-ui">PR LN</th>
                    <th className="hidden">Group ID</th>
                    {!isFormDisabled &&  (
                  <>
                    <th className="global-tran-th-ui sticky right-[43px] bg-blue-300 dark:bg-blue-900 z-30">
                      Add
                    </th>
                    <th className="global-tran-th-ui sticky right-0 bg-blue-300 dark:bg-blue-900 z-30">
                      Delete
                    </th>
                  </>
                )}

                   
                  </tr>
                </thead>

                <tbody>
                  {detailRows.map((row, index) => (
                    <tr key={index} className="global-tran-tr-ui">
                      {/* LN */}
                      <td className="global-tran-td-ui text-center">
                        {index + 1}
                      </td>

                      {/* Job Code */}
                       <td className="global-tran-td-ui relative" >
                            <div className="flex items-center">
                              <input
                                type="text"
                                className={`w-[100px] global-tran-td-inputclass-ui`}
                                value={row.jobCode || ""}
                                readOnly
                                onChange={(e) => handleDetailChange(index, 'jobCode', e.target.value,false)}
                              />
                                {!isFormDisabled && (
                                <FontAwesomeIcon 
                                  icon={faMagnifyingGlass} 
                                  className="absolute right-2 text-blue-600 text-lg cursor-pointer hover:text-blue-900"
                                  onClick={() => updateState({ showJobCodesModal: true, selectedRowIndex: index })}                                                             
                                />)}
                              </div>
                          </td>

                      {/* Scope of Work */}
                      {/* <td className="global-tran-td-ui">
                        <input
                          type="text"
                          className="w-[220px] global-tran-td-inputclass-ui"
                          value={row.scopeOfWork || ""}
                          onChange={(e) =>
                            handleDetailChange(
                              index,
                              "scopeOfWork",
                              e.target.value
                            )
                          }
                          disabled={isFormDisabled}
                        />
                      </td> */}

                       <td className="global-tran-td-ui relative">
                          <div className="flex items-center">
                            <input
                              type="text"
                              className="w-[300px] global-tran-td-inputclass-ui pr-8"
                              value={row.scopeOfWork || ""}
                              onChange={(e) => handleDetailChange(index, "scopeOfWork", e.target.value,false)}
                              readOnly={isFormDisabled}
                            />
                            {!isFormDisabled  && (
                              <FontAwesomeIcon 
                                icon={faSearch} 
                                className="absolute right-2 text-blue-600 text-lg cursor-pointer hover:text-blue-900"
                                onClick={() => useSwalHandleOpenSpecsModal(
                                index, 
                                detailRows, 
                                handleDetailChange, 
                                row.scopeOfWork,    // rowValue                            
                                'Scope of Work',
                                'scopeOfWork',    // rowTitle (the field key in your state)
                                `Enter scope of work for ${row.jobCode || 'this item'}...` // placeHolderValue
                              )} 
                              />
                            )}
                          </div>
                        </td>


                        <td className="global-tran-td-ui relative">
                          <div className="flex items-center">
                            <input
                              type="text"
                              className="w-[300px] global-tran-td-inputclass-ui pr-8"
                              value={row.specification || ""}
                              onChange={(e) => handleDetailChange(index, "specification", e.target.value,false)}
                              readOnly={isFormDisabled }
                            />
                            {!isFormDisabled && (
                              <FontAwesomeIcon 
                                icon={faSearch} 
                                className="absolute right-2 text-blue-600 text-lg cursor-pointer hover:text-blue-900"
                                onClick={() => useSwalHandleOpenSpecsModal(
                                index, 
                                detailRows, 
                                handleDetailChange, 
                                row.specification,  
                                'Specification',    // rowValue
                                'specification',                                   // rowTitle (the field key in your state)
                                `Enter specification for ${row.jobCode || 'this item'}...` // placeHolderValue
                              )} 
                              />
                            )}
                          </div>
                        </td>
                     

                      {/* Quantity */}
                      <td className="global-tran-td-ui" >
                    <input
                        type="text"
                        className="w-[100px] h-7 text-xs bg-transparent text-right focus:outline-none focus:ring-0"
                        value={row.quantity || ""}
                        readOnly={isFormDisabled}
                        onChange={(e) => {
                                const inputValue = e.target.value;
                                const sanitizedValue = inputValue.replace(/[^0-9.-]/g, '');
                                if (/^-?\d*\.?\d{0,2}$/.test(sanitizedValue) || sanitizedValue === "") {
                                    handleDetailChange(index, "quantity", sanitizedValue, false);
                                }
                            }}                  
                        onFocus={(e) => {
                            if ((e.target.value === "0.00" || parseFormattedNumber(e.target.value) === 0)) {
                              e.target.value = "";
                            }
                          }}                   
                       onBlur={(e) => {
                          const num = parseFormattedNumber(e.target.value);
                          if (!isNaN(num)) handleDetailChange(index, "quantity", num,true);
                        }}
                        onKeyDown={async (e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                const value = e.target.value;   
                                const num = parseFormattedNumber(value);
                                if (!isNaN(num)) {
                                    await handleDetailChange(index, "quantity", num,true);
                                }
                                e.target.blur();
                            }
                        }}
                        />
                      </td>


                    <td className="global-tran-td-ui" >
                    <input
                        type="text"
                        className="w-[100px] h-7 text-xs bg-transparent text-right focus:outline-none focus:ring-0"
                        value={row.unitPrice || ""}
                        readOnly={isFormDisabled}
                        onChange={(e) => {
                            const inputValue = e.target.value;
                             const sanitizedValue = inputValue.replace(/[^0-9.-]/g, '');
                            if (/^-?\d*\.?\d{0,2}$/.test(sanitizedValue) || sanitizedValue === "") {
                                handleDetailChange(index, "unitPrice", sanitizedValue,false);
                            }
                        }}                   
                        onFocus={(e) => {
                            if ((e.target.value === "0.00" || parseFormattedNumber(e.target.value) === 0)) {
                              e.target.value = "";
                            }
                          }}                   
                        onBlur={(e) => {
                          const num = parseFormattedNumber(e.target.value);
                          if (!isNaN(num)) handleDetailChange(index, "unitPrice", num, true);
                        }}
                        onKeyDown={async (e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                const value = e.target.value;   
                                const num = parseFormattedNumber(value);
                                if (!isNaN(num)) {
                                    await handleDetailChange(index, "unitPrice", num, true);
                                }
                                e.target.blur();
                            }
                        }}
                        />
                      </td>

                      

                      {/* UOM */}
                      <td className="global-tran-td-ui">
                        <input
                          type="text"
                          className="w-[80px] global-tran-td-inputclass-ui"
                          value={row.uomCode || ""}
                          onChange={(e) =>
                            handleDetailChange(index, "uomCode", e.target.value,false)
                          }
                          disabled={isFormDisabled}
                          maxLength={useGetFieldLength(tblFieldArray, "uom_code")} 

                        />
                      </td>

                      {/* Gross Amt */}
                       <td className="global-tran-td-ui text-right">
                      <input
                        type="text"
                        className="w-[110px] global-tran-td-inputclass-ui text-right"
                        value={row.grossAmt || ""}
                        onChange={(e) => handleDetailChange(index, "grossAmt", e.target.value,false)}
                        disabled={isFormDisabled}
                      />
                      </td>

                      {/* Disc Rate */}
                     <td className="global-tran-td-ui">
                    <input
                      type="text"
                      className="w-[100px] h-7 text-xs bg-transparent text-right focus:outline-none focus:ring-0"
                      value={row.discRate || ""}
                      readOnly={isFormDisabled || parseFormattedNumber(row.grossAmt)===0 }
                      onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.-]/g, '');
                          if (/^-?\d*\.?\d{0,2}$/.test(val) || val === "") {
                            // While typing, we allow the input so the user can finish their thought
                            handleDetailChange(index, "discRate", val, false);
                          }
                        }}
                        onFocus={(e) => {
                          if (parseFormattedNumber(e.target.value) === 0) {
                            handleDetailChange(index, "discRate", "", false);
                          }
                        }}
                        onBlur={async (e) => {
                          let num = parseFormattedNumber(e.target.value);

                          if (num > 99.99) {
                            useSwalInfoAlert('Invalid Discount Rate','Discount Rate must not be more than 99.99%')                       
                            num = 0;
                          }

                          if (isNaN(num) || num < 0) {
                            num = 0;
                          }
                          
                          handleDetailChange(index, "discRate", num, true);
                        }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          e.target.blur();
                        }
                      }}
                    />
                  </td>

                  
                    {/* Disc Amt */}
                    <td className="global-tran-td-ui">
                      <input
                        type="text"
                        className="w-[100px] h-7 text-xs bg-transparent text-right focus:outline-none focus:ring-0"
                        value={row.discAmt || ""}
                        readOnly={isFormDisabled ||  parseFormattedNumber(row.grossAmt)===0 }
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.-]/g, '');
                          if (/^-?\d*\.?\d{0,2}$/.test(val) || val === "") {
                            handleDetailChange(index, "discAmt", val, false);
                          }
                        }}
                        onFocus={() => {
                          if (parseFormattedNumber(row.discAmt) === 0) {
                            handleDetailChange(index, "discAmt", "", false);
                          }
                        }}
                        onBlur={async (e) => {
                          const num = parseFormattedNumber(e.target.value);
                          const gross = parseFormattedNumber(row.grossAmt) || 0;

                          if (num > gross) {
                            useSwalInfoAlert('Invalid Discount','Discount amount cannot be greater than the Gross Amount.')                       
                            handleDetailChange(index, "discAmt", 0, true);
                          } else {
                            const finalNum = isNaN(num) || num < 0 ? 0 : num;
                            handleDetailChange(index, "discAmt", finalNum, true);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            e.target.blur();
                          }
                        }}
                      />
                    </td>                   

                    {/* Total Amt (Net of Discount) */}
                    <td className="global-tran-td-ui">
                      <input
                        type="text"
                        className="w-[110px] h-7 text-xs bg-gray-50 text-right"
                        value={row.totalAmt || ""}
                        readOnly
                      />
                    </td>


                      {/* VAT Code */}
                      <td className="global-tran-td-ui relative">
                      <div className="flex items-center">
                        <input
                          type="text"
                          className="w-[100px] global-tran-td-inputclass-ui text-center pr-6 cursor-pointer"
                          value={row.vatCode || ""}
                          readOnly
                        />
                        {!isFormDisabled && (
                        <FontAwesomeIcon 
                          icon={faMagnifyingGlass} 
                          className="absolute right-2 text-blue-600 text-lg cursor-pointer hover:text-blue-900"
                          onClick={() => {
                            updateState({ selectedRowIndex: index,
                                          vatLookupModalOpen: true}); 
                          }}
                        />)}
                      </div>
                     </td>


                     <td className="global-tran-td-ui">
                      <input
                          type="text"
                          className="w-[200px] global-tran-td-inputclass-ui"
                          value={row.vatName || ""}
                          readOnly
                      />
                    </td>


                      {/* VAT Amt */}
                      <td className="global-tran-td-ui text-right">
                        <input
                          type="text"
                          className="w-[110px] global-tran-td-inputclass-ui text-right"
                          value={row.vatAmt || ""}
                          onChange={(e) =>
                            handleDetailChange(index, "vatAmt", e.target.value)
                          }
                          disabled={isFormDisabled}
                        />
                      </td>


                      {/* Net Amt */}
                      <td className="global-tran-td-ui text-right">
                        <input
                          type="text"
                          className="w-[110px] global-tran-td-inputclass-ui text-right"
                          value={row.netAmt || ""}
                          onChange={(e) =>
                            handleDetailChange(index, "netAmt", e.target.value)
                          }
                          disabled={isFormDisabled}
                        />
                      </td>

                      {/* Delivery Date */}
                      <td className="global-tran-td-ui text-center">
                        <input
                          type="date"
                          className="w-[130px] global-tran-td-inputclass-ui text-center"
                          value={row.deliveryDate || ""}
                          onChange={(e) => handleDetailChange(index, "deliveryDate", e.target.value)}
                          disabled={isFormDisabled}
                        />
                      </td>

                      {/* PR No */}
                      <td className="global-tran-td-ui">
                          <input
                            type="text"
                            className="w-[120px] global-tran-td-inputclass-ui bg-gray-50 cursor-not-allowed"
                            value={row.prNo || ""}
                            readOnly
                          />
                        </td>

                      {/* PR LN */}
                     <td className="global-tran-td-ui text-center">
                      <input
                        type="text"
                        className="w-[80px] global-tran-td-inputclass-ui text-center bg-gray-50 cursor-not-allowed"
                        value={row.prLn || ""}
                        readOnly
                      />
                    </td>

                       <td className="hidden">
                        <input 
                          value={row.groupId || ""} 
                          onChange={(e) => handleDetailChange(index, "groupId", e.target.value)} 
                        />
                      </td>

                   
                      {/* Delete */}
                      {!isFormDisabled && (
                          <td className="global-tran-td-ui text-center sticky right-12">
                          <button
                             className="global-tran-td-button-add-ui"
                             onClick={() => handleAddRow(index)}
                           >
                            <FontAwesomeIcon icon={faPlus} />
                            </button>
                            </td>
                            )}
                      
                           {!isFormDisabled && (
                           <td className="global-tran-td-ui text-center sticky right-0">
                            <button
                            className="global-tran-td-button-delete-ui"
                            onClick={() => handleDeleteRow(index)}
                            >
                            <FontAwesomeIcon icon={faMinus} />
                            </button>
                             </td>
                         )}

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail Footer: Add Button + Total */}
          <div className="global-tran-tab-footer-main-div-ui">
            <div className="global-tran-tab-footer-button-div-ui">
              <div className="inline-block">
                <button
                  onClick={handleAddRowClick}
                  disabled={isFormDisabled}
                  className={`global-tran-tab-footer-button-add-ui`}
                >
                  <FontAwesomeIcon icon={faPlus} className="mr-2" />
                  Add
                </button>
              </div>
            </div>

            <div className="global-tran-tab-footer-total-main-div-ui">
              <div className="global-tran-tab-footer-total-div-ui">
                <label
                  htmlFor="TotalGross"
                  className="global-tran-tab-footer-total-label-ui"
                >
                  Gross Amount:
                </label>
                <label
                  htmlFor="TotalGross"
                  className="global-tran-tab-footer-total-value-ui"
                >
                  {totals.totalGross}
                </label>
              </div>

              <div className="global-tran-tab-footer-total-div-ui">
                <label
                  htmlFor="TotalVat"
                  className="global-tran-tab-footer-total-label-ui"
                >
                  VAT Amount:
                </label>
                <label
                  htmlFor="TotalVat"
                  className="global-tran-tab-footer-total-value-ui"
                >
                  {totals.totalVat}
                </label>
              </div>

              <div className="global-tran-tab-footer-total-div-ui">
                <label
                  htmlFor="TotalNet"
                  className="global-tran-tab-footer-total-label-ui"
                >
                  Net Amount:
                </label>
                <label
                  htmlFor="TotalNet"
                  className="global-tran-tab-footer-total-value-ui"
                >
                  {totals.totalNet}
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* HISTORY TAB */}
      <div className={topTab === "history" ? "" : "hidden"}>
        <AllTranHistory
        showHeader={false}
        endpoint="/getJOHistory"
        cacheKey={`JO:${state.branchCode || ""}:${state.docNo || ""}`}  // ✅ per-transaction
        activeTabKey="JO_Summary"
        branchCode={state.branchCode}
        startDate={state.fromDate}
        endDate={state.toDate}
          status={(() => {
            const s = (state.status || "").toUpperCase();
            if (s === "FINALIZED") return "F";
            if (s === "CANCELLED") return "X";
            if (s === "CLOSED")    return "C";
            if (s === "OPEN")      return "";
            return "All";
          })()}
          onRowDoubleClick={handleHistoryRowPick}
          historyExportName={`${documentTitle} History`} 
    />
      </div>

      {/* MODALS */}
      {branchModalOpen && (
        <BranchLookupModal
          isOpen={branchModalOpen}
          onClose={handleCloseBranchModal}
        />
      )}


 
       
      {showJobCodesModal && (
         <JobCodeLookupModal
           isOpen={showJobCodesModal}
           onClose={handleCloseJobCodesLookup}
           />
        )}
            


      {rcLookupModalOpen && (
        <RCLookupModal
          isOpen={rcLookupModalOpen}
          onClose={handleCloseRCModal}
          customParam="ActiveDept"
        />
      )}

      {currencyModalOpen && (
        <CurrLookupModal
          isOpen={currencyModalOpen}
          onClose={handleCloseCurrencyModal}
        />
      )}

      {/* Payment Terms Lookup Modal */}
      {showPaytermModal && (
        <PaytermLookupModal
          isOpen={showPaytermModal}
          onClose={handleClosePaytermModal}
        />
      )}


      {prLookupModalOpen && (
        <SearchPROpenModal
          isOpen={prLookupModalOpen}
          onClose={handleSelectPR}
          branchCode={branchCode}
          prTranType="PR02" // JO = PR02
        />
      )}

      {payeeModalOpen && (
        <PayeeMastLookupModal
          isOpen={payeeModalOpen}
          onClose={handleClosePayeeModal}
        />
      )}

      {showCancelModal && (
        <CancelTranModal isOpen={showCancelModal} onClose={handleCloseCancel} />
      )}

      {showPostModal && (
        <PostTranModal isOpen={showPostModal} onClose={handleClosePost} />
      )}

      {showAttachModal && (
        <AttachDocumentModal
          isOpen={showAttachModal}
          params={{
            DocumentID: documentID,
            DocumentName: documentName,
            BranchName: branchName,
            DocumentNo: documentNo,
          }}
          onClose={() => updateState({ showAttachModal: false })}
        />
      )}

      {showSignatoryModal && (
        <DocumentSignatories
          isOpen={showSignatoryModal}
          params={{ noReprints, documentID, docType }}
          onClose={handleCloseSignatory}
          onCancel={() => updateState({ showSignatoryModal: false })}
        />
      )}

     

      {vatLookupModalOpen && (
        <VATLookupModal
          isOpen={vatLookupModalOpen}
          onClose={handleCloseVATLookup}
          customParam="InputService"
        />
      )}

      {showSpinner && <LoadingSpinner />}
    </div>
  );
};

export default JO;
