import { useState, useEffect, useRef, useCallback } from "react";
import Swal from "sweetalert2";
import { useNavigate,useLocation  } from "react-router-dom";
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
import CustomerMastLookupModal from "../../../Lookup/SearchCustMast";
import CancelTranModal from "../../../Lookup/SearchCancelRef.jsx";
import PostTranModal from "../../../Lookup/SearchPostRef.jsx";
import AttachDocumentModal from "../../../Lookup/SearchAttachment.jsx";
import DocumentSignatories from "../../../Lookup/SearchSignatory.jsx";
import AllTranHistory from "../../../Lookup/SearchGlobalTranHistory.jsx";
import RCLookupModal from "../../../Lookup/SearchRCMast.jsx";
import AllTranDocNo from "../../../Lookup/SearchDocNo.jsx";
import GlobalLookupModalv1 from "../../../Lookup/SearchGlobalLookupv1.jsx";
import JobCodeLookupModal from "../../../Lookup/SearchJobCodesRef.jsx";

// Configuration
import {  apiClient,fetchDataJson } from "../../../Configuration/BaseURL.jsx";
import { useReset } from "../../../Components/ResetContext";
import { useAuth } from "@/NAYSA Cloud/Authentication/AuthContext.jsx";

import {
  docTypeNames,
  docTypes,
  docTypeVideoGuide,
  docTypePDFGuide,
} from "@/NAYSA Cloud/Global/doctype";

import {
  useTopCurrencyRow,
  useTopHSOption,
  useTopDocControlRow,
  useTopDocDropDown,
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
  useSelectedHSColConfig,
  useSelectedIteBranchBalance
} from '@/NAYSA Cloud/Global/selectedData';

import {
  useGetCurrentDay,
  useFormatToDate,
} from '@/NAYSA Cloud/Global/dates';

import { useHandlePrint } from "@/NAYSA Cloud/Global/report";

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

  const PR = () => {
  const loadedFromUrlRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation(); 
  const [isViewDocument, setIsViewDocument] = useState(false);
  const { companyInfo, currentUserRow } = useAuth();
  const decQty = companyInfo?.itemDecqtyPur ?? 2;


      
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
    documentDate:useGetCurrentDay(),  
    dateNeeded:useGetCurrentDay(),  
    headerDateNeeded:useGetCurrentDay(),  
    documentNo: "",
    documentStatus: "",
    status: "",
    originalDocStatus:"O",

    // UI state
    activeTab: "basic",
    isLoading: false,
    showSpinner: false,
    isDocNoDisabled: true,
    isSaveDisabled: false,
    isResetDisabled: false,
    isFetchDisabled: true,
    showAllTranDocNo:false,
    itemSingleSelect:false,
    branchCode: currentUserRow.branchCode,
    branchName: currentUserRow.BranchName,
    reqRcCode: "",
    reqRcName: "",
    currCode: "",
    currName: "",
    attention: "",

    // Currency information (not used by sproc_PHP_PR but kept for UI consistency)
    currCode: "",
    currName: "",
    currRate: "",
    defaultCurrRate: "1.000000",

    // Other Header Info (aligned to PR header fields)
    tblFieldArray :[],
    sviTypes :[],
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
    userCode:currentUserRow.userCode,

    // Detail lines (PR dt1)
    detailRows: [],
    globalLookupRow:[],
    globalLookupHeader:[],


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
    showJobCodesModal:false,
    rcLookupModalOpen: false,
    rcLookupContext: "", 
    msLookupModalOpen: false,
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


    // Header
    branchCode,
    branchName,
    rcCode,
    rcName,
    reqRcCode,
    reqRcName,

    currCode,
    userCode,
    tblFieldArray,
    selectedPrTranType,
    selectedPrType,
    documentDate,
    headerDateNeeded,
    refPrNo1,
    refPrNo2,
    remarks,
    noReprints,
    showAllTranDocNo,
    showJobCodesModal,
    itemSingleSelect,
    selectedRowIndex,

    
    detailRows,
    globalLookupRow,
    globalLookupHeader,

    branchModalOpen,
    custModalOpen,
    showCancelModal,
    showAttachModal,
    showSignatoryModal,
    showPostModal,

    rcLookupModalOpen,
    rcLookupContext,
    msLookupModalOpen,
  } = state;

  const isJobOrder = selectedPrTranType === "PR02";
  const [focusedCell, setFocusedCell] = useState(null);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [totals, setTotals] = useState({
    totalQtyNeeded: "",
  });

  // PR.jsx
  const docType = docTypes?.PR || "PR";

  const pdfLink = docTypePDFGuide[docType];
  const videoLink = docTypeVideoGuide[docType];
  const documentTitle = docTypeNames[docType] || "Purchase Requisition";

  const displayStatus = status || "OPEN";
  const statusMap = {
    FINALIZED: "global-tran-stat-text-finalized-ui",
    CANCELLED: "global-tran-stat-text-closed-ui",
    CLOSED: "global-tran-stat-text-finalized-ui",
  };
  const statusColor = statusMap[displayStatus] || "";
  const isFormDisabled = ["FINALIZED", "CANCELLED", "CLOSED"].includes(
    displayStatus
  );

 const updateTotalsDisplay = (qtyNeeded) => {
  setTotals({ totalQtyNeeded: formatNumber(qtyNeeded, 2) });
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
    handleReset();
  }, []);

  useEffect(() => {
    if (glCurrMode && glCurrDefault && currCode) {
      loadCurrencyMode(glCurrMode, glCurrDefault, currCode);
    }
  }, [glCurrMode, glCurrDefault, currCode]);

  const LoadingSpinner = () => (
    <div className="global-tran-spinner-main-div-ui">
      <div className="global-tran-spinner-sub-div-ui">
        <FontAwesomeIcon
          icon={faSpinner}
          spin
          size="2x"
          className="text-blue-500 mb-2"
        />
        <p>Please wait...</p>
      </div>
    </div>
  );


  
  // ==========================
  // INITIAL LOAD / RESET
  // ==========================

  const handleReset = () => {
    loadDocDropDown();
    loadDocControl();
    loadCompanyData();

    const today = new Date().toISOString().split("T")[0];

    updateState({
      branchCode: currentUserRow.branchCode,
      branchName: currentUserRow.branchName,
      userCode:currentUserRow.userCode,
      headerDateNeeded:useGetCurrentDay(),
      documentDate:useGetCurrentDay(),
      documentStatus:"O",
      cutoffCode: "",
      rcCode: "",
      rcName: "",
      reqRcCode: "",
      reqRcName: "",
      dateNeeded: useGetCurrentDay(),
      
      refPrNo1: "",
      refPrNo2: "",
      remarks: "",
      documentNo: "",
      documentID: "",
      documentStatus: "O",
      activeTab: "basic",
      isLoading: false,
      showSpinner: false,
      isDocNoDisabled: false,
      isSaveDisabled: false,
      isResetDisabled: false,
      isFetchDisabled: false,
      status: "",
      originalDocStatus:"O",
      noReprints: "",
      prCancelled: "",
      detailRows: [],
      rcLookupModalOpen: false,
      rcLookupContext: "",
      msLookupModalOpen: false,
    });

    updateTotalsDisplay(0);
  };

  const loadCompanyData = async () => {
    updateState({ isLoading: true });
    try {
      const [prTranDrop, prTypeDrop] = await Promise.all([
        useTopDocDropDown(docType, "PRTRAN_TYPE"),
        useTopDocDropDown(docType, "PR_TYPE"),
      ]);

      if (prTranDrop) {
        updateState({
          prTranTypes: prTranDrop,
          selectedPrTranType: prTranDrop[0]?.DROPDOWN_CODE ?? "",
        });
      }
      if (prTypeDrop) {
        updateState({
          prTypes: prTypeDrop,
          selectedPrType: prTypeDrop[0]?.DROPDOWN_CODE ?? "",
        });
      }

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

        

     const tbls = 'pr_hd,pr_dt1'
     const hdtblcol_result = await useFieldLenghtCheck(tbls);
     if (hdtblcol_result){
       updateState({tblFieldArray :hdtblcol_result })
     }



      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      updateState({ isLoading: false });
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

  const loadDocDropDown = async () => {
    const data = await useTopDocDropDown(docType, "PRTRAN_TYPE");
    if (data) {
      updateState({
        prTranTypes: data,
        selectedPrTranType: data[0]?.DROPDOWN_CODE ?? "",
      });
    }
  };

  // ==========================
  // FETCH (GET) – PR HEADER + DT1
  // ==========================



const fetchTranData = async (documentNo, branchCode,direction='') => {
  const resetState = () => {
    updateState({documentNo:'', documentID: '', isDocNoDisabled: false, isFetchDisabled: false });
    updateTotals([]);
  };

  updateState({ isLoading: true });

  try {
    const data = await useFetchTranData(documentNo, branchCode,docType,"prNo",direction);

   
    if (!data?.prId) {
      Swal.fire({ icon: 'info', title: 'No Records Found', text: 'Transaction does not exist.' });
      return resetState();
    }


    // Format rows
    const retrievedDetailRows = (data.dt1 || []).map(item => ({
      ...item,
      qtyOnHand: formatNumber(item.qtyOnHand,decQty),
      qtyAlloc: formatNumber(item.qtyAlloc,decQty),
      qtyNeeded: formatNumber(item.qtyNeeded,decQty),
      poQty: formatNumber(item.poQty,decQty),
      rrQty: formatNumber(item.rrQty,decQty),
    }));

   

  
    // Update state with fetched data

 
    updateState({

      documentStatus: data.prHStatus,
      status: data.prStatus,
      originalDocStatus:data.prHStatus,
      documentID: data.prId,
      documentNo: data.prNo,
      branchCode: data.branchCode,
      documentDate: useFormatToDate(data.prDate),
      headerDateNeeded:useFormatToDate(data.dateNeeded),
      rcCode: data.rcCode,
      rcName: data.rcName,
      reqRcCode: data.reqRcCode,
      reqRcName: data.reqRcName,
      selectedPrTranType: data.prTranType,
      selectedPrType: data.prType,
      refPrNo1: data.refPrNo1,
      refPrNo2: data.refPrNo2,
      remarks: data.remarks,
      prCancelled: data.prCancelled ,
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
  const docNo = params.get("prNo");
  const branchCode = params.get("branchCode");

  if (!loadedFromUrlRef.current && docNo && branchCode) {
    loadedFromUrlRef.current = true;
    handleHistoryRowPick({ docNo, branchCode });
  }
}, [location.search, handleHistoryRowPick]);





const handleCloseJobCodesLookup = (selectedItems) => {
  if (selectedItems) {
   handleDetailChange(selectedRowIndex, 'serviceCode', selectedItems, false)
  }
  updateState({ showJobCodesModal: false });
};


const handleCloseMSLookup = (selectedItems) => {
  if (!selectedItems) {
    updateState({ msLookupModalOpen: false });
    return;
  }

  const itemsArray = Array.isArray(selectedItems.records)
    ? selectedItems.records
    : selectedItems.records ? [selectedItems.records] : [];

  if (itemsArray.length === 0) {
    updateState({ msLookupModalOpen: false });
    return;
  }

  // Per Item Selection
  if (itemSingleSelect) {
    const singleItem = itemsArray[0];
    const isDuplicate = detailRows.some(row => row.itemCode === singleItem.itemCode);

    if (isDuplicate) {
      useSwalConfirmAlert(
        "Duplicate Item Detected",
        "This item is already in the list. Do you want to select it anyway?"
      ).then((result) => {
        if (result.isConfirmed) {
          handleDetailChange(selectedRowIndex, 'itemCode', singleItem, false);
          updateState({ itemSingleSelect: false, msLookupModalOpen: false });
        }
      });
    } else {
      handleDetailChange(selectedRowIndex, 'itemCode', singleItem, false);
      updateState({ itemSingleSelect: false, msLookupModalOpen: false });
    }
    return;
  }



  // Multiple Item Selection
  const duplicateItems = itemsArray.filter(newItem => 
    detailRows.some(existingRow => existingRow.itemCode === newItem.itemCode)
  );

  const processAddition = (itemsToAdd) => {
    const newRows = itemsToAdd.map((item) => ({
      invType: "MS",
      groupId: "",
      prStatus: "O",
      itemCode: item?.itemCode || "",
      itemName: item?.itemName || "",
      uomCode: item?.uomCode || "",
      qtyOnHand: formatNumber(item?.qtyHand ?? 0, 6),
      qtyAlloc: "0.000000",
      qtyNeeded: "0.000000",
      uomCode2: item?.uomCode || "",
      uomQty2: "0.000000",
      dateNeeded: headerDateNeeded,
      itemSpecs: "",
      serviceCode: "",
      serviceName: "",
      poQty: "0.000000",
      rrQty: "0.000000",
    }));

    updateState({
      detailRows: [...detailRows, ...newRows],
      msLookupModalOpen: false,
      itemSingleSelect: false
    });
  };

  if (duplicateItems.length > 0) {
    useSwalConfirmAlert(
      "Duplicate Items Detected",
      "Some items are already in the list. Do you want to add them anyway?"
    ).then((result) => {
      if (result.isConfirmed) {
        processAddition(itemsArray);
      } else {
        const uniqueOnly = itemsArray.filter(newItem => 
          !detailRows.some(existingRow => existingRow.itemCode === newItem.itemCode)
        );
        
        if (uniqueOnly.length > 0) {
          processAddition(uniqueOnly);
        } else {
          updateState({ msLookupModalOpen: false });
        }
      }
    });
  } else {
    processAddition(itemsArray);
  }
};



const handleAddBlankRow = (index) => {

  if (documentStatus !=="O"){
        return;
      }
  const blankRow = {
    invType: isJobOrder ? "JO" : "",
    groupId: "", 
    prStatus: "O",
    itemCode: "",
    itemName: "",
    uomCode: isJobOrder ? "Lot" : "",
    qtyOnHand:formatNumber(0,decQty),
    qtyNeeded: formatNumber(0,decQty),
    uomCode2: "",
    uomQty2: formatNumber(0,decQty),
    dateNeeded: headerDateNeeded,
    itemSpecs: "",
    serviceCode: "",
    serviceName: "",
    poQty: formatNumber(0,decQty),
    rrQty: formatNumber(0,decQty),
    joNo: "",
  };

  const updatedRows = [...detailRows];
  updatedRows.splice(index + 1, 0, blankRow); 
  updateState({
    detailRows: updatedRows
  });
};



  // ==========================
  // HEADER EVENTS
  // ==========================

 

  const handlePrTranTypeChange = (e) => {
    updateState({ selectedPrTranType: e.target.value });
  };

  const handlePrTypeChange = (e) => {
    updateState({ selectedPrType: e.target.value });
  };

  // ==========================
  // DETAIL (PR_DT1) HANDLERS
  // ==========================

  // When user clicks the "Add Line" button
  // When user clicks the "Add Line" button
  const handleAddRowClick = () => {

      if (documentStatus !=="O"){
        return;
      }

      const fieldsToCheck = {
          "Header : Responsibility Center": rcCode,
          "Header : Requesting Department": reqRcCode,
          "Header : Remarks": remarks,
        };
        const isValid = useSwalvalidateRequiredFields(fieldsToCheck, "Add Item");
        if (!isValid) return;
        if (isFormDisabled) return;

    if (isJobOrder) {
      handleSelectTypeAndAddRow("JO"); 
      return;
    }
    setShowTypeDropdown((prev) => !prev);
  };

  // When user picks FG / MS / RM
  const handleSelectTypeAndAddRow = (typeCode) => {
 
    const newRow = {
      invType: typeCode,
      groupId: "",
      prStatus: "O",
      itemCode: "",
      serviceCode:"",
      serviceName:"",
      itemName: "",
      uomCode: isJobOrder ? "Lot" : "",
      qtyOnHand: "0.000000",
      qtyAlloc: "0.000000",
      qtyNeeded: "0.000000",
      uomCode2: "",
      uomQty2: "0.000000",
      dateNeeded: headerDateNeeded,
      itemSpecs: "",
      poQty: "0.000000",
      rrQty: "0.000000",
      joNo:"",
    };

    const updatedRows = [...detailRows, newRow];
    updateState({ detailRows: updatedRows });

    const totalQty = updatedRows.reduce(
      (acc, r) => acc + (parseFormattedNumber(r.qtyNeeded) || 0),
      0
    );
    updateTotalsDisplay(totalQty);
  };



  // const handleOpenMSLookup = () => {
  //   if (isFormDisabled) return;
  //   setShowTypeDropdown(false);
  //   updateState({ msLookupModalOpen: true });
  // };

  
  const handleAddItem = async (index,invType) => {

      updateState({ selectedRowIndex: index}); 
      await handleOpenMSLookup(true,invType);
      return;
  };


  
    const handleOpenMSLookup = async (itemSingleSelect, docType) => {
      try {
  
        setShowTypeDropdown(false);
        updateState({ isLoading: true,
                      itemSingleSelect : itemSingleSelect });
    
        const endpoint ="getInvLookupMS"

        

        const response = await fetchDataJson(endpoint, { userCode, docType, branchCode });
        const custData = response?.data?.[0]?.result ? JSON.parse(response.data[0].result) : [];
    
  
        const colConfig = await useSelectedHSColConfig("AllMastItemLookup");
  
  
       if (custData.length === 0) {
          useSwalInfoAlert("MS Master Data" ,"No records found")
           updateState({ isLoading: false });
          return; 
        }
    
        updateState({ globalLookupRow: custData,
                      globalLookupHeader:colConfig,
                      msLookupModalOpen: true,
                      isLoading: false
          });
    
  
      } catch (error) {
        console.log(error)
        useSwalInfoAlert("MS Master Data" ,"Error in Fetching Record")
        updateState({ 
            globalLookupRow: [] ,
            globalLookupHeader: [],
            isLoading: false  });
      }
    };
    
    









const handleDeleteRow = (index) => {
  const row = detailRows[index];

  if (documentStatus !== "O") {
    return;
  }

  const poQty = parseFloat(row?.poQty) || 0;
  if (poQty > 0 || row?.prStatus !== "O") {
    Swal.fire({
      icon: "warning",
      title: "Action Restricted",
      text: "Items with a PO reference or a status other than 'Open' cannot be deleted.",
      timer: 2500,
      showConfirmButton: false,
      customClass: {
        popup: "rounded-xl shadow-2xl",
      },
    });
    return;
  }

  if ((detailRows?.length || 0) <= 1) {
    Swal.fire({
      icon: "warning",
      title: "Cannot Delete",
      text: "At least one item row must remain.",
      timer: 2200,
      showConfirmButton: false,
      customClass: {
        popup: "rounded-xl shadow-2xl",
      },
    });
    return;
  }

  const updatedRows = [...detailRows];
  updatedRows.splice(index, 1);

  updateState({ detailRows: updatedRows });

  const totalQty = updatedRows.reduce(
    (acc, r) => acc + (parseFormattedNumber(r.qtyNeeded) || 0),
    0
  );
  updateTotalsDisplay(totalQty);
};



  const updateTotals = (rows) => {
  let totalQuantity = 0;
  rows.forEach(row => {
    const item_Quantity = parseFormattedNumber(row.qtyNeeded || 0) || 0
    totalQuantity+= item_Quantity;
  });
    updateTotalsDisplay (totalQuantity);
};


  


const finalizeUpdate = (index, row) => {
  const updatedRows = [...detailRows];
  updatedRows[index] = row;

  updateState({ detailRows: updatedRows });
  const totalQty = updatedRows.reduce(
    (acc, r) => acc + (parseFormattedNumber(r.qtyNeeded) || 0),
    0
  );
  updateTotalsDisplay(totalQty);
};



const handleDetailChange = (index, field, value, runCalculations = false) => {
  const updatedRows = [...detailRows];
  const row = { ...(updatedRows[index] || {}) };
  const numericFields = ["qtyOnHand", "qtyAlloc", "qtyNeeded", "uomQty2", "poQty", "rrQty"];

  // --- 1. Handle Numeric Fields ---
  if (numericFields.includes(field)) {
    const raw = value === null || value === undefined ? "" : String(value);
    const sanitized = raw.replace(/[^0-9.-]/g, ""); 

    if (runCalculations) {
      const num = parseFormattedNumber(sanitized);
      row[field] = Number.isFinite(num)
        ? formatNumber(num, field === "qtyNeeded" ? decQty : 2)
        : "";
    } else {
      row[field] = sanitized;
    }
  }

  if (field === 'itemCode') {
    row["itemCode"] = value.itemCode;
    row["itemName"] = value.itemName;
    row["uomCode"] = value.uomCode;
    row["qtyOnHand"] = formatNumber(value.qtyHand, 6);
  }



if (field !== 'itemCode' && field !== 'serviceCode' && !numericFields.includes(field) && field !== 'prStatus') {
  row[field] = value;
}


if (field === 'serviceCode') {
  row["serviceCode"] = value?.jobCode || "";
  row["serviceName"] = value?.jobName || "";
}



if (field === 'prStatus') {
  if (value === "X" || value === "C") {
    const isCancel = value === "X";
    const actionText = isCancel ? "CANCEL" : "CLOSE";
    
   useSwalConfirmAlert(
      `Confirm Line ${isCancel ? "Cancellation" : "Closing"}?`, 
      `Are you sure you want to ${actionText} this specific item? This action is permanent for this line and cannot be undone.`
    ).then((result) => {
      if (result.isConfirmed) {
        if (isCancel) {
          row["qtyOnHand"] = formatNumber(0, 6);
          row["qtyNeeded"] = formatNumber(0, 6);
          row["prStatus"] = "X";
        } else {
          row["prStatus"] = "C";
        }
        finalizeUpdate(index, row);
      } else {
        row["prStatus"] = "O";
        finalizeUpdate(index, row);
      }
    });
    return; 
  } else {
    row["prStatus"] = value || "O";
  }
}
  finalizeUpdate(index, row);
};



  const handleOpenSpecsModal = (index) => {
  const row = detailRows[index];

  Swal.fire({
    title: 'Specifications',
    input: 'textarea',
    inputValue: row.itemSpecs || '',
    inputPlaceholder: `Enter remarks for ${row.itemName || 'this item'}...`,
    showCancelButton: true,
    confirmButtonText: 'Save',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#3b82f6',
    cancelButtonColor: '#64748b',
    reverseButtons: true, // Optional: puts 'Save' on the right, 'Cancel' on the left
    inputAttributes: {
      'aria-label': 'Type your specifications here',
      'style': 'height: 150px; font-size: 0.875rem;' // Optional: consistent sizing
    },
    customClass: {
      actions: 'w-full px-6 gap-2', // Containers for buttons
      confirmButton: 'flex-1 py-2', // Forces Save to take half width
      cancelButton: 'flex-1 py-2',  // Forces Cancel to take half width
      input: 'focus:ring-blue-500'   
    },
    buttonsStyling: true, 
  }).then((result) => {
    if (result.isConfirmed) {
      handleDetailChange(index, "itemSpecs", result.value);
    }
  });
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
        selectedPrTranType,
        selectedPrType,
        refPrNo1,
        refPrNo2,
        cutoffCode,
        rcCode,
        reqRcCode,
        reqRcName,
        headerDateNeeded,
        remarks,
        prCancelled,
        detailRows,
        documentStatus,
      } = state;

 

      const prData = {
        branchCode: branchCode,
        prNo:  documentNo || "",
        prId: documentID || "",
        prDate: mode === "onCopy" ? useGetCurrentDay() : documentDate,
        cutoffCode: cutoffCode || "",
        rcCode: rcCode || "",
        reqRcCode: reqRcCode || "",
        reqRcName: reqRcName || "",
        prTranType: selectedPrTranType,
        dateNeeded: headerDateNeeded || null,
        prType: selectedPrType,
        refPrNo1: refPrNo1 || "",
        refPrNo2: refPrNo2 || "",
        remarks: remarks || "",
        prStatus: documentStatus?.length ? documentStatus : "O",
        userCode: userCode,
        // ⬇️ THIS PART guarantees ALL CURRENT detailRows (including newly added) are sent
        dt1: detailRows.map((row, index) => ({
          prId: documentID || "",
          groupId: row.groupId || "",       
          invType: row.invType || "",
          prStatus:row.prStatus|| "O",
          lnNo: index + 1,
          itemCode: row.itemCode || "",
          itemName: row.itemName || "",
          uomCode: row.uomCode || "",
          qtyOnHand: parseFormattedNumber(row.qtyOnHand || 0),
          qtyAlloc: parseFormattedNumber(row.qtyAlloc || 0),
          qtyNeeded: parseFormattedNumber(row.qtyNeeded || 0),
          uomCode2: row.uomCode2 || "",
          uomQty2: parseFormattedNumber(row.uomQty2 || 0),
          dateNeeded: row.dateNeeded || null,
          itemSpecs: row.itemSpecs || "",
          serviceCode: row.serviceCode || "",
          serviceName: row.serviceName || "",
          joNo: row.joNo || "",
          poQty: parseFormattedNumber(row.poQty || 0),
          rrQty: parseFormattedNumber(row.rrQty || 0)
        
        })),
      };


    
      if (mode === "onCopy") {
        try {
          const response = await useSelectedIteBranchBalance(prData);
          if (response) {
            return response;
          }
        } catch (error) {
          console.error(error);
        } finally {
          updateState({ isLoading: false });
        }
        return [];
      }





      const response = await useTransactionUpsert(docType,prData,updateState,"prId","prNo");

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
    if (documentID && documentStatus === "O") {
      updateState({ showCancelModal: true });
    }
  };

const handleHeaderStatusChange = (value) => {
  if (value === "X" || value === "C") {
    const isCancel = value === "X";
    const actionWord = isCancel ? "CANCEL" : "CLOSE";

    useSwalConfirmAlert(
      `Confirm Full Document ${isCancel ? "Cancellation" : "Closing"}?`,
      `Are you sure you want to ${actionWord} this entire PR? This action is permanent and will affect all open line items.`
    ).then((result) => {
      if (result.isConfirmed) {
        if (isCancel) {
          handleCancel(); 
        } else {
          const updatedRows = detailRows.map(row => {
            if (row.prStatus === "O" || !row.prStatus) {
              return { ...row, prStatus: "C" };
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




  const handlePost = async () => {
    if (documentID && documentStatus === "O") {
      updateState({ showPostModal: true });
    }
  };

  const handleAttach = async () => {
    updateState({ showAttachModal: true });
  };





  const handleCopy = async () => {
  if (detailRows.length === 0) return;

  const qtyHandDetail = !isJobOrder ? await handleActivityOption('onCopy') : [];

  const updatedRows = detailRows.map((row) => {
    const match = !isJobOrder && qtyHandDetail?.find(
      (item) => item.itemCode === row.itemCode && item.invType === row.invType
    );

    return {
      ...row,
      prStatus: "O",
      poQty: formatNumber(0, decQty),
      rrQty: formatNumber(0, decQty),
      qtyOnHand: formatNumber(match ? match.quantity : 0, decQty),
      qtyAlloc: formatNumber(0, decQty),
      groupID: "",
      dateNeeded: useGetCurrentDay()
    };
  });

  if (documentID) {
    const commonDate = useGetCurrentDay();
    
    updateState({
      documentNo: "",
      documentID: "",
      documentStatus: "O",
      status: "",
      originalDocStatus: "O",
      documentDate: commonDate,
      headerDateNeeded: commonDate,
      detailRows: updatedRows,
    });

    const totalQty = updatedRows.reduce(
      (acc, r) => acc + (parseFormattedNumber(r.qtyNeeded) || 0),
      0
    );
    updateTotalsDisplay(totalQty);
  }
};



  // ==========================
  // HISTORY – URL PARAM HANDLING
  // ==========================


  const printData = {
    pr_no: documentNo,
    branch: branchCode,
    doc_id: docType,
  };

  // ==========================
  // MODAL CLOSE HANDLERS
  // ==========================

  const handleCloseCancel = async (confirmation) => {
      if(confirmation && originalDocStatus === "O" && documentID !== null ) {
  
        const result = await useHandleCancel(docType,documentID,userCode,confirmation.password,confirmation.reason,updateState);
        if (result.success) 
        {
         Swal.fire({
            icon: "success",
            title: "Success",
            text: "Cancellation Completed",
            timer: 5000, 
            timerProgressBar: true,
            showConfirmButton: false,
          });    
        }    
       await fetchTranData(documentNo,branchCode);
      }
      updateState({showCancelModal: false});
  };


  const handleClosePost = async () => {
    if (documentStatus !== "O" && documentID !== null) {
      const result = await useHandlePost(docType, documentID, updateState);
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
    // Just closing
    if (!selectedRC) {
      updateState({
        rcLookupModalOpen: false,
        rcLookupContext: "",
      });
      return;
    }

    // Common mapping from modal row
    const { rcCode: selectedCode, rcName: selectedName } = selectedRC;

    if (rcLookupContext === "rc") {
      // Selecting Responsibility Center:
      //  - RC changes
      //  - Requesting Dept follows by default
      updateState({
        rcCode: selectedCode,
        rcName: selectedName,
        reqRcCode: selectedCode,
        reqRcName: selectedName,
        rcLookupModalOpen: false,
        rcLookupContext: "",
      });
    } else if (rcLookupContext === "reqDept") {
      // Selecting Requesting Dept:
      //  - Only Requesting Dept changes
      //  - Responsibility Center stays as-is
      updateState({
        reqRcCode: selectedCode,
        reqRcName: selectedName,
        rcLookupModalOpen: false,
        rcLookupContext: "",
      });
    } else {
      updateState({
        rcLookupModalOpen: false,
        rcLookupContext: "",
      });
    }
  };



  useEffect(() => {
      const onKey = (e) => {
        if (e.key === "F1") { e.preventDefault(); updateState({showAllTranDocNo:true}); }
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, []);


const handleTranDocNoRetrieval = async (data) => {



  await fetchTranData(data.docNo, data.branchCode || branchCode, data.key);
  updateState({ showAllTranDocNo: data.modalClose });
};




const handleTranDocNoSelection = async (data) => {
    
    handleReset();
    updateState({showAllTranDocNo: false, documentNo:data.docNo });
};

const handleDocNoBlur = () => {

    if (!state.documentID && state.documentNo && state.branchCode) { 
        fetchTranData(state.documentNo,state.branchCode);
    }
};


const hasExistingPO = detailRows.some(row => (parseFloat(row.poQty) || 0) > 0);

  // ==========================
  // RENDER
  // ==========================

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
          detailsRoute="/page/PR"
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
                            id="prNo"
                            value={state.documentNo}
                            onChange={(e) => updateState({ documentNo: e.target.value })}
                            // onBlur={handleDocNoBlur}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleDocNoBlur();
                                e.preventDefault(); 
                                document.getElementById("prDate")?.focus();
                              }}}
                            placeholder=" "
                            className={`peer global-tran-textbox-ui ${state.isDocNoDisabled ? 'bg-blue-100 cursor-not-allowed' : ''}`}
                            disabled={state.isDocNoDisabled}
                        />
                        <label htmlFor="prNo" className="global-tran-floating-label">
                    PR No.
                  </label>
                  <button
                            className={`global-tran-textbox-button-search-padding-ui ${
                                (state.isFetchDisabled || state.isDocNoDisabled)
                                ? "global-tran-textbox-button-search-disabled-ui"
                                : "global-tran-textbox-button-search-enabled-ui"
                            } global-tran-textbox-button-search-ui`}
                            // disabled={state.isFetchDisabled || state.isDocNoDisabled}
                            onClick={() => {updateState({showAllTranDocNo:true})}}
                        >
                            <FontAwesomeIcon icon={faMagnifyingGlass} />
                        </button>
                </div>

                {/* PR Date */}
                <div className="relative">
                  <input
                    type="date"
                    id="PRDate"
                    className="peer global-tran-textbox-ui"
                    value={documentDate}
                    onChange={(e) => updateState({ documentDate: e.target.value })} 
                    disabled={isFormDisabled}
                  />
                  <label
                    htmlFor="PRDate"
                    className="global-tran-floating-label"
                  >
                    PR Date
                  </label>
                </div>

                {/* PR Tran Type */}
                <div className="relative">
                  <select
                    id="prTranType"
                    className="peer global-tran-textbox-ui"
                    value={selectedPrTranType}
                    onChange={handlePrTranTypeChange}
                    disabled={isFormDisabled || detailRows.length>0 }
                  >
                    <option value="PRO1">Regular Transaction</option>
                    <option value="PR02">Job Order</option>
                  </select>
                  <label
                    htmlFor="prTranType"
                    className="global-tran-floating-label"
                  >
                    Tran Type
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

              {/* Column 2: Responsibility Center / Requesting Dept / Tran Type */}
              <div className="global-tran-textbox-group-div-ui">
                {/* Responsibility Center */}
                <div className="relative">
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
                    Responsibility Center
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
                        rcLookupContext: "rc",
                      })
                    }
                  >
                    <FontAwesomeIcon icon={faMagnifyingGlass} />
                  </button>
                </div>

                {/* Requesting Dept. */}
                <div className="relative group flex-[1.3]">
                  <input
                    type="text"
                    id="rcName"
                    value={reqRcName}
                    readOnly
                    placeholder=" "
                    className="peer global-tran-textbox-ui"
                  />
                  <label
                    htmlFor="reqRcName"
                    className="global-tran-floating-label"
                  >
                    Requesting Dept.
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

                {/* PR Type */}
                <div className="relative">
                  <select
                    id="prType"
                    className="peer global-tran-textbox-ui"
                    value={selectedPrType}
                    onChange={handlePrTypeChange}
                    disabled={isFormDisabled}
                  >
                    <option value="">Regular</option>
                    <option value="">Priority</option>
                    <option value="">Urgent</option>
                  </select>
                  <label
                    htmlFor="prType"
                    className="global-tran-floating-label"
                  >
                    PR Type
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

                {/* Date Needed */}
                <div className="relative">
                  <input
                    type="date"
                    id="headerDateNeeded"
                    value={headerDateNeeded}
                    placeholder=" "
                    onChange={(e) => updateState({ headerDateNeeded: e.target.value })} 
                    className="peer global-tran-textbox-ui"
                    disabled={isFormDisabled}
                  />
                  <label
                    htmlFor="dateNeeded"
                    className="global-tran-floating-label"
                  >
                    Date Needed
                  </label>
                </div>

                
              </div>

              {/* Column 3: PR Type / Date Needed / Ref No / Total Qty */}
              <div className="global-tran-textbox-group-div-ui">
                

                {/* Ref No (Ref PR No1) */}
                <div className="relative">
                  <input
                    type="text"
                    id="refPrNo1"
                    value={refPrNo1}
                    placeholder=" "
                    onChange={(e) => updateState({ refPrNo1: e.target.value })}
                    className="peer global-tran-textbox-ui"                  
                    disabled={isFormDisabled}
                    maxLength={useGetFieldLength(tblFieldArray, "refpr_no1")} 
                  />
                  <label
                    htmlFor="refPrNo1"
                    className="global-tran-floating-label"
                  >
                    Ref Doc No1.
                  </label>
                </div>


                 {/* Ref No (Ref PR No1) */}
                <div className="relative">
                  <input
                    type="text"
                    id="refPrNo2"
                    value={refPrNo2}
                    placeholder=" "
                    onChange={(e) => updateState({ refPrNo2: e.target.value })}
                    className="peer global-tran-textbox-ui"                  
                    disabled={isFormDisabled}
                    maxLength={useGetFieldLength(tblFieldArray, "refpr_no2")} 
                  />
                  <label
                    htmlFor="refPrNo2"
                    className="global-tran-floating-label"
                  >
                    Ref Doc No2.
                  </label>
                </div>



                {/* PR Type */}
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
                {!hasExistingPO && documentStatus ==="O" && (
                  <option value="X">Cancelled</option>
                )}
              </select>
                <label htmlFor="prType" className="global-tran-floating-label">
                  PR Status
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
                    maxLength={useGetFieldLength(tblFieldArray, "remarks")} 
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
                Item Detail
              </span>
            </div>
          </div>
          <div className="global-tran-table-main-div-ui">
            <div className="global-tran-table-main-sub-div-ui">
              <table className="min-w-full border-collapse">
                <thead className="global-tran-thead-div-ui">
                  <tr>
                    <th className="global-tran-th-ui">LN</th>                   
                    <th className="global-tran-th-ui">PR Status</th>
                    <th className="global-tran-th-ui">Type</th>
                    <th className={`global-tran-th-ui ${!isJobOrder ? 'hidden' : ''}`}>Job Code</th>
                    <th className={`global-tran-th-ui ${!isJobOrder ? 'hidden' : ''}`}>Scope of Work</th>
                    <th className={`global-tran-th-ui ${isJobOrder ? 'hidden' : ''}`}>Item Code</th>
                    <th className={`global-tran-th-ui ${isJobOrder ? 'hidden' : ''}`}>Item Description</th>
                    <th className="global-tran-th-ui">Specification</th>
                    <th className="global-tran-th-ui">UOM</th>
                    <th className={`global-tran-th-ui ${isJobOrder ? 'hidden' : ''}`}>Qty on Hand</th>
                    <th className="global-tran-th-ui">Qty Needed</th>
                    <th className="global-tran-th-ui">Date Needed</th>
                    <th className={`global-tran-th-ui ${isJobOrder ? 'hidden' : ''}`}>PO Qty</th>
                    <th className={`global-tran-th-ui ${isJobOrder ? 'hidden' : ''}`}>RR Qty</th>
                    <th className={`global-tran-th-ui ${!isJobOrder ? 'hidden' : ''}`}>JO No.</th>
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

                     
                          {/* PR Status */}
                          <td className="global-tran-td-ui">
                          <select
                            className="w-[80px] global-tran-td-inputclass-ui"
                            value={row.prStatus || "O"}
                            onChange={(e) => handleDetailChange(index, "prStatus", e.target.value)}
                            disabled={isFormDisabled || !documentID?.length || row.prStatus !== "O" || row.joNo?.length }
                          >
                            <option value="O">Open</option>
                            <option value="C">Closed</option>
                            {(!row.poQty || parseFloat(row.poQty) === 0) && (
                              <option value="X">Cancelled</option>
                            )}
                          </select>
                        </td>
                         {/* Type */}
                          <td className="global-tran-td-ui">
                            <select
                              className="w-[60px] global-tran-td-inputclass-ui bg-white outline-none"
                              value={row.invType || ""}
                              onChange={(e) => handleDetailChange(index, "invType", e.target.value)}
                              disabled={isFormDisabled || (row.itemCode?.length > 0)|| isJobOrder  }
                           >
                            <option value="" disabled>Select</option>
                            {isJobOrder ? (
                              <option value="JO">JO</option>
                            ) : (
                              <>
                                <option value="MS">MS</option>
                                <option value="RM">RM</option>
                                <option value="FG">FG</option>
                              </>
                            )}
                          </select>
                          </td>
                       



                          {/* Job/Service Code */}
                          <td className="global-tran-td-ui relative" hidden={!isJobOrder} >
                            <div className="flex items-center">
                              <input
                                type="text"
                                className={`w-[100px] global-tran-td-inputclass-ui`}
                                value={row.serviceCode || ""}
                                readOnly
                                onChange={(e) => handleDetailChange(index, 'serviceCode', e.target.value)}
                              />
                                {!isFormDisabled &&  row.prStatus === "O" && (
                                <FontAwesomeIcon 
                                  icon={faMagnifyingGlass} 
                                  className="absolute right-2 text-blue-600 text-lg cursor-pointer hover:text-blue-900"
                                  onClick={() => updateState({ showJobCodesModal: true, selectedRowIndex: index })}                                                             
                                />)}
                              </div>
                          </td>



                          {/* Job/Service Name */}
                          <td className="global-tran-td-ui relative" hidden={!isJobOrder}>
                            <input
                              type="text"
                              className="w-[300px] global-tran-td-inputclass-ui"
                              value={row.serviceName || ""}
                              onChange={(e) => handleDetailChange(index, "serviceName", e.target.value)}
                              readOnly={isFormDisabled}
                            />
                          </td>


                          
                          {/* Item Code */}
                          <td className="global-tran-td-ui relative" hidden={isJobOrder}>
                            <div className="flex items-center">
                              <input
                                type="text"
                                className={`w-[100px] global-tran-td-inputclass-ui`}
                                value={row.itemCode || ""}
                                readOnly
                                onChange={(e) => handleDetailChange(index, 'itemCode', e.target.value)}
                              />
                                {!isFormDisabled && Number(row.poQty || 0) === 0 && row.prStatus === "O" && (
                                <FontAwesomeIcon 
                                  icon={faMagnifyingGlass} 
                                  className="absolute right-2 text-blue-600 text-lg cursor-pointer hover:text-blue-900"
                                  onClick={() => handleAddItem(index,"PR"+row.invType)}                                                                
                                />)}
                              </div>
                          </td>
          


                          {/* Item Description */}
                          <td className="global-tran-td-ui" hidden={isJobOrder}>
                            <input
                              type="text"
                              className="w-[300px] global-tran-td-inputclass-ui cursor-not-allowed"
                              value={row.itemName || ""}
                              onChange={(e) => handleDetailChange(index, "itemName", e.target.value)}
                              disabled={isFormDisabled}
                            />
                          </td>

                        
                         {/* Specification */}
                        <td className="global-tran-td-ui relative">
                          <div className="flex items-center">
                            <input
                              type="text"
                              className="w-[300px] global-tran-td-inputclass-ui pr-8"
                              value={row.itemSpecs || ""}
                              onChange={(e) => handleDetailChange(index, "itemSpecs", e.target.value)}
                              readOnly={isFormDisabled || row.prStatus !== "O" || row.poQty > 0}
                            />
                            {!isFormDisabled && row.prStatus === "O" && (
                              <FontAwesomeIcon 
                                icon={faSearch} 
                                className="absolute right-2 text-blue-600 text-lg cursor-pointer hover:text-blue-900"
                                onClick={() => useSwalHandleOpenSpecsModal(
                                index, 
                                detailRows, 
                                handleDetailChange, 
                                row.itemSpecs,    // rowValue                              
                                'Specification', 
                                'itemSpecs',     // rowTitle (the field key in your state)
                                `Enter specification for ${row.itemName || 'this item'}...` // placeHolderValue
                              )} 
                              />
                            )}
                          </div>
                        </td>




                          {/* UOM */}
                          <td className="global-tran-td-ui">
                            <input
                              type="text"
                              className="w-[50px] global-tran-td-inputclass-ui"
                              value={row.uomCode || ""}
                              onChange={(e) => handleDetailChange(index, "uomCode", e.target.value)}
                              readOnly={isFormDisabled || row.prStatus !== "O" || row.poQty > 0 || !isJobOrder }
                            />
                          </td>

                          {/* Qty on Hand */}
                          <td className="global-tran-td-ui text-right" hidden={isJobOrder}>
                            <input
                              type="text"
                              className="w-[120px] global-tran-td-inputclass-ui text-right cursor-not-allowed"
                              value={row.qtyOnHand ?? ""}
                              readOnly
                              tabIndex={-1}
                            />
                          </td>

                          {/* Qty Needed */}
                    <td className="global-tran-td-ui" >
                    <input
                        type="text"
                        className="w-[100px] h-7 text-xs bg-transparent text-right focus:outline-none focus:ring-0"
                        value={row.qtyNeeded || ""}
                        readOnly={isFormDisabled || row.prStatus !== "O" || row.poQty > 0}
                        onChange={(e) => {
                            const inputValue = e.target.value;
                             const sanitizedValue = inputValue.replace(/[^0-9.-]/g, '');
                            if (/^-?\d*\.?\d{0,2}$/.test(sanitizedValue) || sanitizedValue === "") {
                                handleDetailChange(index, "qtyNeeded", sanitizedValue, false);
                            }
                        }}                   
                        onFocus={(e) => {
                            if ((e.target.value === "0.00" || parseFormattedNumber(e.target.value) === 0) && row.prStatus ==="O" ) {
                              e.target.value = "";
                            }
                          }}                   
                        onBlur={async (e) => {
                            const value = e.target.value;
                            const num = parseFormattedNumber(value);
                            if (!isNaN(num)) {
                                 handleDetailChange(index, "qtyNeeded", num, true);
                            }
                            setFocusedCell(null);
                        }}
                        onKeyDown={async (e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                const value = e.target.value;   
                                const num = parseFormattedNumber(value);
                                if (!isNaN(num)) {
                                    await handleDetailChange(index, "qtyNeeded", num, true);
                                }
                                e.target.blur();
                            }
                        }}
                        />
                      </td>

                          {/* Date Needed */}
                          <td className="global-tran-td-ui">
                            <input
                              type="date"
                              className="w-[130px] global-tran-td-inputclass-ui text-center" // Added text-center here
                              value={row.dateNeeded || ""}
                              onChange={(e) => handleDetailChange(index, "dateNeeded", e.target.value)}
                              readOnly={isFormDisabled || row.prStatus !== "O" || row.poQty > 0}
                            />
                          </td>


                          {/* PO Qty */}
                          <td className="global-tran-td-ui text-right" hidden={isJobOrder}>
                            <input
                              type="text"
                              className="w-[120px] global-tran-td-inputclass-ui text-right"
                              value={row.poQty || ""}
                              onChange={(e) => handleDetailChange(index, "poQty", e.target.value)}
                              disabled={isFormDisabled}
                            />
                          </td>

                          {/* RR Qty */}
                          <td className="global-tran-td-ui text-right" hidden={isJobOrder}>
                            <input
                              type="text"
                              className="w-[120px] global-tran-td-inputclass-ui text-right"
                              value={row.rrQty || ""}
                              onChange={(e) => handleDetailChange(index, "rrQty", e.target.value)}
                              disabled={isFormDisabled}
                            />
                          </td>

                          {/* JO No */}
                          <td className="global-tran-td-ui" hidden={!isJobOrder}>
                            <input
                              type="text"
                              className="w-[100px] global-tran-td-inputclass-ui cursor-not-allowed"
                              value={row.joNo || ""}
                              onChange={(e) => handleDetailChange(index, "joNo", e.target.value)}
                              readOnly
                            />
                          </td>

                       
                    

                       {!isFormDisabled && (
                          <td className="global-tran-td-ui text-center sticky right-12">
                          <button
                             className="global-tran-td-button-add-ui"
                             onClick={() => handleAddBlankRow(index)}
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
              <div className="relative inline-block">
  {/* Dropdown overlay (absolute so it will NOT expand layout) */}
  {!isJobOrder && showTypeDropdown && (
    <div className="absolute bottom-[110%] left-0 mb-2 bg-white dark:bg-slate-800 border rounded-md shadow-lg z-[9999] min-w-[140px]">
      <button
        type="button"
        className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700"
        onClick={() => handleSelectTypeAndAddRow("FG")}
      >
        FG
      </button>

      <button
        type="button"
        className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700"
         onClick={() => handleOpenMSLookup(false,"PRMS")}
        // onClick={handleOpenMSLookup(false,"PRMS")}
      >
        MS
      </button>

      <button
        type="button"
        className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700"
        onClick={() => handleSelectTypeAndAddRow("RM")}
      >
        RM
      </button>
    </div>
  )}

  <button
    onClick={handleAddRowClick}
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
                  htmlFor="TotalQty"
                  className="global-tran-tab-footer-total-label-ui"
                >
                  Total Qty Needed:
                </label>
                <label
                  htmlFor="TotalQty"
                  className="global-tran-tab-footer-total-value-ui"
                >
                  {totals.totalQtyNeeded}
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
        endpoint="/getPRHistory"
        cacheKey={`PR:${state.branchCode || ""}:${state.docNo || ""}`}  // ✅ per-transaction
        activeTabKey="PR_Summary"
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

      {rcLookupModalOpen && (
        <RCLookupModal
          isOpen={rcLookupModalOpen}
          onClose={handleCloseRCModal}
          customParam="ActiveDept"
        />
      )}


      {showAllTranDocNo && (
          <AllTranDocNo
          isOpen={showAllTranDocNo}
          params={{branchCode,branchName,docType,documentTitle,fieldNo : "prNo"}}
          onRetrieve={handleTranDocNoRetrieval}
          onResponse={{documentNo}}
          onSelected={handleTranDocNoSelection}
          onClose={() => updateState({ showAllTranDocNo: false })}
          />
      )} 



      
      {showJobCodesModal && (
        <JobCodeLookupModal
          isOpen={showJobCodesModal}
          onClose={handleCloseJobCodesLookup}
          />
        )}
      


      {custModalOpen && (
        <CustomerMastLookupModal
          isOpen={custModalOpen}
          onClose={handleCloseCustModal}
        />
      )}

      {/* Cancellation Modal */}
      {showCancelModal && (
        <CancelTranModal
          isOpen={showCancelModal}
          onClose={handleCloseCancel}
        />
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


    {msLookupModalOpen && (
        <GlobalLookupModalv1
        isOpen={msLookupModalOpen}
        data={globalLookupRow}
        btnCaption="Get Selected Items"
        title="Master Data"
        endpoint={globalLookupHeader}
        onClose={handleCloseMSLookup}
        onCancel={() => updateState({ msLookupModalOpen: false })}
        singleSelect={itemSingleSelect}
         />
        )}      




      {showSpinner && <LoadingSpinner />}
    </div>
  );
};

export default PR;
