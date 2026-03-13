import React, { useState, useCallback, useMemo, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faChevronLeft,
  faChevronRight,
  faMagnifyingGlass,
  faUndo,
  faPrint,
  faTimes,
  faFilter,
  faDatabase,
  faListOl,
  faTable,
  faThLarge,
} from "@fortawesome/free-solid-svg-icons";

import {
  useTopCompanyRow,
  useTopUserRow,
  useTopBranchRow,
  useTopCutOffRow,
  useTopAccountRow,
  useTopSLRow,
} from "@/NAYSA Cloud/Global/top1RefTable";
import { useSelectedHSColConfig } from "@/NAYSA Cloud/Global/selectedData";
import { fetchData } from "@/NAYSA Cloud/Configuration/BaseURL.jsx";
import { LoadingSpinner } from "@/NAYSA Cloud/Global/utilities.jsx";
import { useAuth } from "@/NAYSA Cloud/Authentication/AuthContext.jsx";

import SearchGlobalReportTable from "@/NAYSA Cloud/Lookup/SearchGlobalReportTable.jsx";
import SearchBranchRef from "@/NAYSA Cloud/Lookup/SearchBranchRef.jsx";
import SearchSLMast from "@/NAYSA Cloud/Lookup/SearchSLMast.jsx";
import SearchRCMast from "@/NAYSA Cloud/Lookup/SearchRCMast.jsx";
import SearchCutOffRef from "@/NAYSA Cloud/Lookup/SearchCutOffRef.jsx";
import COAMastLookupModal from "@/NAYSA Cloud/Lookup/SearchCOAMast.jsx";
import CurrLookupModal from "@/NAYSA Cloud/Lookup/SearchCurrRef.jsx";

import GLQueryReport from "./GLQueryReport.jsx";
import SLQueryReport from "./SLQueryReport.jsx";
import TBQueryReport from "./TBQueryReport.jsx";
import TrialBalanceReport from "./TrialBalanceReport.jsx";
import BalSheetYTDReport from "./BalSheetYTDReport.jsx";
import IncomeStatementYTDReport from "./IncomeStatementYTDReport.jsx";
import IncomeStatementMTDReport from "./IncomeStatementMTDReport.jsx";
import IncomeExpenseReport from "./IncomeExpenseReport.jsx";

export default function GLINQ() {
  const { user, companyInfo, currentUserRow } = useAuth();

  const [activeTab, setActiveTab] = useState("glQuery");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [hideNav, setHideNav] = useState(false);

  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState("table"); // table | card

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setMobileView("table");
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const tabRegistry = useMemo(
    () => ({
      glQuery: GLQueryReport,
      slQuery: SLQueryReport,
      tbQuery: TBQueryReport,
      trialBalance: TrialBalanceReport,
      balSheetYTD: BalSheetYTDReport,
      incStatementYTD: IncomeStatementYTDReport,
      isMTD: IncomeStatementMTDReport,
      incExp: IncomeExpenseReport,
    }),
    []
  );

  const tabConfigs = useMemo(() => {
    const entries = Object.entries(tabRegistry).map(([key, Report]) => [
      key,
      Report?.meta || {
        label: key,
        filters: [],
        icon: faListOl,
      },
    ]);

    return Object.fromEntries(entries);
  }, [tabRegistry]);

  const DEFAULT_FILTERS = useMemo(
    () => ({
      branchCode: currentUserRow?.branchCode || "",
      branchName: currentUserRow?.branchName || "",

      currCode: companyInfo?.currCode || "",
      currName: companyInfo?.currName || "",

      accCode: "",
      accName: "",
      accCodeStart: "",
      accNameStart: "",
      accCodeEnd: "",
      accNameEnd: "",

      slCode: "",
      slName: "",

      rcCode: "",
      rcName: "",
      rcCodeStart: "",
      rcNameStart: "",
      rcCodeEnd: "",
      rcNameEnd: "",

      cutoffCode: companyInfo?.cutoffCode || "",
      cutoffName: companyInfo?.cutoffName || "",
      cutoffStartCode: companyInfo?.cutoffCode || "",
      cutoffStartName: companyInfo?.cutoffName || "",
      cutoffEndCode: companyInfo?.cutoffCode || "",
      cutoffEndName: companyInfo?.cutoffName || "",

      showLookupModal: false,
      lookupType: "",
      cutoffModalType: "",
    }),
    [companyInfo, currentUserRow]
  );

  const [filtersByTab, setFiltersByTab] = useState(() => {
    const init = {};
    Object.keys(tabConfigs).forEach((k) => {
      init[k] = { ...DEFAULT_FILTERS };
    });
    return init;
  });

  const EMPTY_VIEW = useMemo(
    () => ({
      cols: [],
      rows: [],
      rightActionLabel: "View",
      hasLoaded: false,
      appliedFilters: null,
      loadedAt: null,
      isEmpty: false,
      emptyMessage: "",
      summary: {
        totalDebit: 0,
        totalCredit: 0,
        netBalance: 0,
        totalRows: 0,
      },
    }),
    []
  );

  const [views, setViews] = useState(() => {
    const init = {};
    Object.keys(tabConfigs).forEach((k) => {
      init[k] = { ...EMPTY_VIEW };
    });
    return init;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);

  useEffect(() => {
    let t;
    if (isLoading) t = setTimeout(() => setShowSpinner(true), 200);
    else setShowSpinner(false);
    return () => clearTimeout(t);
  }, [isLoading]);

  useEffect(() => {
    setFiltersByTab((prev) => {
      const next = { ...prev };
      Object.keys(tabConfigs).forEach((k) => {
        if (!next[k]) next[k] = { ...DEFAULT_FILTERS };
      });
      return next;
    });

    setViews((prev) => {
      const next = { ...prev };
      Object.keys(tabConfigs).forEach((k) => {
        if (!next[k]) next[k] = { ...EMPTY_VIEW };
      });
      return next;
    });
  }, [tabConfigs, DEFAULT_FILTERS, EMPTY_VIEW]);

  const filters = filtersByTab[activeTab] || DEFAULT_FILTERS;
  const view = views[activeTab] || EMPTY_VIEW;
  const activeTabConfig = tabConfigs[activeTab] || tabConfigs.glQuery || {
    label: "GL Inquiry",
    filters: [],
    icon: faListOl,
  };

  const updateFilters = useCallback(
    (patch, tabKey = activeTab) => {
      setFiltersByTab((prev) => ({
        ...prev,
        [tabKey]: { ...(prev[tabKey] || DEFAULT_FILTERS), ...patch },
      }));
    },
    [activeTab, DEFAULT_FILTERS]
  );

  const applyToAllTabs = useCallback(
    (patch) => {
      setFiltersByTab((prev) => {
        const next = { ...prev };
        Object.keys(tabConfigs).forEach((k) => {
          next[k] = { ...(next[k] || DEFAULT_FILTERS), ...patch };
        });
        return next;
      });
    },
    [tabConfigs, DEFAULT_FILTERS]
  );

  const normalizeRows = useCallback((resp) => {
    const directRows =
      resp?.data?.rows ??
      resp?.data?.data ??
      resp?.data?.data?.rows ??
      resp?.data?.rowsData;

    if (Array.isArray(directRows)) return directRows;

    const jsonText = resp?.data?.[0]?.result;
    if (jsonText) {
      const parsed = JSON.parse(jsonText);
      const block = parsed?.[0] || {};
      const rows = block?.dt1 ?? block?.rows ?? block?.data ?? [];
      return Array.isArray(rows) ? rows : [];
    }

    return [];
  }, []);

  const safeRightActionLabel = useCallback((colsResp) => {
    if (colsResp?.rightActionLabel) return colsResp.rightActionLabel;
    return "View";
  }, []);

  const parseAmount = useCallback((v) => {
    if (v == null) return 0;
    if (typeof v === "number") return Number.isFinite(v) ? v : 0;

    const cleaned = String(v).replace(/,/g, "").trim();
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }, []);

  const summarizeRows = useCallback(
    (rows = []) => {
      let totalDebit = 0;
      let totalCredit = 0;

      rows.forEach((row) => {
        totalDebit += parseAmount(
          row?.debit ??0
        );

        totalCredit += parseAmount(
          row?.credit ??0
        );
      });

      return {
        totalDebit,
        totalCredit,
        netBalance: totalDebit - totalCredit,
        totalRows: Array.isArray(rows) ? rows.length : 0,
      };
    },
    [parseAmount]
  );

  const runTabQuery = useCallback(
    async (tabKey, f) => {
      const Report = tabRegistry[tabKey];
      if (!Report) return;

      setIsLoading(true);

      const endpoint = Report?.meta?.endpoint;
      if (
        !endpoint ||
        typeof Report?.buildPayload !== "function" ||
        typeof Report?.buildJsonData !== "function"
      ) {
        console.error(`[GLINQ] Missing meta/builders for tab: ${tabKey}`);
        setIsLoading(false);
        return;
      }

      const payload = Report.buildPayload(f);
      const jsonData = Report.buildJsonData(payload);
      const startedAt = new Date().toISOString();

      try {
        const [colsResp, rowsResp] = await Promise.all([
          useSelectedHSColConfig(endpoint),
          fetchData(endpoint, { json_data: { json_data: jsonData } }),
        ]);

        const colsArray = Array.isArray(colsResp) ? colsResp : [];
        const finalRows = normalizeRows(rowsResp);
        const isEmpty = !finalRows || finalRows.length === 0;

        setViews((prev) => ({
          ...prev,
          [tabKey]: {
            cols: colsArray,
            rows: finalRows,
            rightActionLabel: safeRightActionLabel(colsResp),
            hasLoaded: true,
            appliedFilters: payload,
            loadedAt: startedAt,
            isEmpty,
            emptyMessage: isEmpty ? "No records found for the selected filters." : "",
            summary: summarizeRows(finalRows),
          },
        }));
      } catch (e) {
        console.error(`[GLINQ] runTabQuery failed for ${tabKey}:`, e);
        setViews((prev) => ({
          ...prev,
          [tabKey]: {
            ...(prev[tabKey] || EMPTY_VIEW),
            hasLoaded: true,
            isEmpty: true,
            emptyMessage: "Unable to load records. Please try again.",
            loadedAt: new Date().toISOString(),
            summary: {
              totalDebit: 0,
              totalCredit: 0,
              netBalance: 0,
              totalRows: 0,
            },
          },
        }));
      } finally {
        setIsLoading(false);
      }
    },
    [tabRegistry, normalizeRows, safeRightActionLabel, summarizeRows, EMPTY_VIEW]
  );

  const parseGroupId = useCallback((groupId, tabSource) => {
    if (!groupId) return null;

    const parts = String(groupId)
      .split(/[|~]/)
      .map((p) => p.trim());

    if (parts.length <= 1) return null;

    switch (tabSource) {
      case "slQuery": {
        const [branchCode, cutOffCode, acctCode, sltypeCode, slCode] = parts;
        return { branchCode, cutOffCode, acctCode, sltypeCode, slCode };
      }
      case "tbQuery": {
        const [tbCutOff, tbAcct, rcCode] = parts;
        return { cutOffCode: tbCutOff, acctCode: tbAcct, rcCode };
      }
      default:
        return null;
    }
  }, []);

  const jumpToGLQueryFromSL = useCallback(
    async (row) => {
      const decoded = parseGroupId(row?.groupId, "slQuery");
      if (!decoded) return;

      const currentGL = filtersByTab.glQuery || DEFAULT_FILTERS;

      const [fBranch, fAcct, fPeriod, fSL] = await Promise.all([
        useTopBranchRow(decoded?.branchCode),
        useTopAccountRow(decoded?.acctCode),
        useTopCutOffRow(decoded?.cutOffCode),
        useTopSLRow(decoded?.slCode),
      ]);

      const glFilters = {
        ...currentGL,
        branchCode: decoded.branchCode,
        branchName: fBranch?.branchName || "",
        accCode: decoded.acctCode,
        accName: fAcct?.acctName || "",
        slCode: decoded.slCode,
        slName: fSL?.slName || "",
        cutoffStartCode: decoded.cutOffCode,
        cutoffStartName: fPeriod?.cutoffName || "",
        cutoffEndCode: decoded.cutOffCode,
        cutoffEndName: fPeriod?.cutoffName || "",
        rcCode: "",
        rcName: "",
        rcCodeStart: "",
        rcNameStart: "",
        rcCodeEnd: "",
        rcNameEnd: "",
      };

      updateFilters(glFilters, "glQuery");
      setActiveTab("glQuery");
      await runTabQuery("glQuery", glFilters);
    },
    [parseGroupId, filtersByTab, DEFAULT_FILTERS, updateFilters, runTabQuery]
  );

  const jumpToGLQueryFromTB = useCallback(
    async (row) => {
      const decoded = parseGroupId(row?.groupId, "tbQuery");
      if (!decoded) return;

      const currentGL = filtersByTab.glQuery || DEFAULT_FILTERS;

      const [fAcct, fPeriod] = await Promise.all([
        useTopAccountRow(decoded?.acctCode),
        useTopCutOffRow(decoded?.cutOffCode),
      ]);

      const glFilters = {
        ...currentGL,
        branchCode: "",
        branchName: "",
        accCode: decoded.acctCode,
        accName: fAcct?.acctName || "",
        slCode: "",
        slName: "",
        cutoffStartCode: decoded.cutOffCode,
        cutoffStartName: fPeriod?.cutoffName || "",
        cutoffEndCode: decoded.cutOffCode,
        cutoffEndName: fPeriod?.cutoffName || "",
        rcCode: "",
        rcName: "",
        rcCodeStart: "",
        rcNameStart: "",
        rcCodeEnd: "",
        rcNameEnd: "",
      };

      updateFilters(glFilters, "glQuery");
      setActiveTab("glQuery");
      await runTabQuery("glQuery", glFilters);
    },
    [parseGroupId, filtersByTab, DEFAULT_FILTERS, updateFilters, runTabQuery]
  );

  const loadDefaults = useCallback(async () => {
    try {
      const [hsCompany, hsUser] = await Promise.all([
        useTopCompanyRow(),
        useTopUserRow(user?.USER_CODE),
      ]);

      if (hsCompany) {
        applyToAllTabs({
          cutoffCode: hsCompany.cutoffCode,
          cutoffName: hsCompany.cutoffName,
          cutoffStartCode: hsCompany.cutoffCode,
          cutoffStartName: hsCompany.cutoffName,
          cutoffEndCode: hsCompany.cutoffCode,
          cutoffEndName: hsCompany.cutoffName,
          currCode: hsCompany.currCode || companyInfo?.currCode || "",
          currName: hsCompany.currName || companyInfo?.currName || "",
        });
      }

      if (hsUser) {
        const hsBranch = await useTopBranchRow(hsUser.branchCode);
        applyToAllTabs({
          branchCode: hsUser.branchCode,
          branchName: hsBranch?.branchName || hsUser.branchName,
        });
      }
    } catch (err) {
      console.error("Error loading defaults:", err);
    }
  }, [applyToAllTabs, user?.USER_CODE, companyInfo]);

  useEffect(() => {
    if (!user?.USER_CODE) return;
    loadDefaults();
  }, [user?.USER_CODE, loadDefaults]);

  const handleReset = useCallback(() => {
    updateFilters(
      {
        ...DEFAULT_FILTERS,
        branchCode: filters.branchCode,
        branchName: filters.branchName,
        cutoffCode: filters.cutoffCode,
        cutoffName: filters.cutoffName,
        cutoffStartCode: filters.cutoffStartCode,
        cutoffStartName: filters.cutoffStartName,
        cutoffEndCode: filters.cutoffEndCode,
        cutoffEndName: filters.cutoffEndName,
        currCode: filters.currCode,
        currName: filters.currName,
      },
      activeTab
    );

    setViews((prev) => ({
      ...prev,
      [activeTab]: { ...EMPTY_VIEW },
    }));
  }, [updateFilters, DEFAULT_FILTERS, filters, activeTab, EMPTY_VIEW]);

  const handleNavSelect = useCallback((tabKey) => {
    setActiveTab(tabKey);
    setIsMobileNavOpen(false);
  }, []);

  const handlePrint = useCallback(() => window.print(), []);
  const handleFind = useCallback(() => setShowFilterModal(true), []);
  const handleApplyFilters = useCallback(async () => {
    setShowFilterModal(false);
    await runTabQuery(activeTab, filters);
  }, [activeTab, filters, runTabQuery]);

  const ActiveReport = tabRegistry[activeTab];
  const currentContext = buildContextText(filters);

  return (
    <div className="global-ref-main-div-ui">
      {showSpinner && <LoadingSpinner />}

      <div className="global-ref-header-ui">
      <div className="w-full flex flex-col gap-6 md:flex-row md:items-center md:justify-between lg:min-h-[40px]">
          <div className="w-full md:w-auto flex md:justify-start">
            <h1 className="global-ref-headertext-ui w-full md:w-auto truncate text-center md:text-left">
              GL Inquiry
            </h1>
          </div>

          <div className="w-full md:w-auto flex md:justify-end">
            <div className="w-full md:w-auto overflow-visible">
              <div className="flex flex-nowrap items-center justify-center md:justify-end gap-2">
                <button
                  onClick={() => setIsMobileNavOpen(true)}
                  className="shrink-0 px-3 py-2 text-xs font-medium rounded-md text-white bg-blue-600 hover:opacity-90 lg:hidden"
                >
                  <FontAwesomeIcon icon={faBars} />
                </button>

                <button
                  onClick={handleFind}
                  className="shrink-0 px-3 py-2 text-xs font-medium rounded-md text-white bg-blue-600 hover:opacity-90"
                >
                  <FontAwesomeIcon icon={faMagnifyingGlass} />
                  <span className="hidden lg:inline ml-2">Filter</span>
                </button>

                <button
                  onClick={handleReset}
                  className="shrink-0 px-3 py-2 text-xs font-medium rounded-md text-white bg-blue-600 hover:opacity-90"
                >
                  <FontAwesomeIcon icon={faUndo} />
                  <span className="hidden lg:inline ml-2">Reset</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="shrink-0 px-3 py-2 text-xs font-medium rounded-md text-white bg-blue-600 hover:opacity-90"
                >
                  <FontAwesomeIcon icon={faPrint} />
                  <span className="hidden lg:inline ml-2">Print</span>
                </button>

                <button
                  onClick={() => setHideNav((v) => !v)}
                  className="hidden lg:inline-flex shrink-0 px-3 py-2 text-xs font-medium rounded-md text-white bg-blue-600 hover:opacity-90"
                >
                  <FontAwesomeIcon
                    icon={hideNav ? faChevronRight : faChevronLeft}
                  />
                  <span className="hidden xl:inline ml-2">
                    {hideNav ? "Expand Nav" : "Collapse Nav"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

       <div className="mt-32 sm:mt-24 px-0">
        <div className="flex gap-3">
          <aside
            className={`hidden lg:block transition-all duration-200 ${
              hideNav ? "w-[88px]" : "w-[290px]"
            }`}
          >
            <div className="global-tran-tab-div-ui h-full">
              <div className="bg-white rounded-2xl shadow-sm border overflow-hidden h-full">
                <div className="px-4 py-4 border-b">
                  {!hideNav ? (
                    <>
                      <div className="text-sm font-semibold text-gray-800">
                        GL Reports
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Select a report, set filters, then load data.
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-[11px] font-semibold text-blue-700">
                      GL
                    </div>
                  )}
                </div>

                <div className="p-3">
                  <ReportNavList
                    activeTab={activeTab}
                    tabConfigs={tabConfigs}
                    handleSelect={handleNavSelect}
                    collapsed={hideNav}
                  />
                </div>
              </div>
            </div>
          </aside>



          <div className="flex-1 min-w-0">          
            <div className="global-tran-tab-div-ui">
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-4 py-3 border-b bg-gradient-to-r from-blue-50 to-white">
                <div className="flex flex-col gap-1.5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-base font-semibold text-gray-800">
                      {activeTabConfig.label}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      Review balances, movements, and drilldown results using your
                      selected filters.
                    </div>
                  </div>

                  <div className="text-[10px] text-gray-600 leading-4 md:text-right">
                    {currentContext}
                  </div>
                </div>
              </div>

            <div className="p-4">
              <ContextCards filters={filters} summary={view.summary} />
            </div>
          </div>
        </div>



            <div className="global-tran-tab-div-ui">
              <div className="global-tran-tab-nav-ui">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <button className="global-tran-tab-padding-ui global-tran-tab-text_active-ui">
                      {activeTabConfig.label}
                    </button>

                  
                  </div>

                  {isMobile && (
                    <div className="inline-flex overflow-hidden rounded-md border border-gray-300 bg-white">
                      <button
                        type="button"
                        onClick={() => setMobileView("table")}
                        className={`h-8 px-3 text-[11px] font-medium flex items-center gap-1 ${
                          mobileView === "table"
                            ? "bg-blue-600 text-white"
                            : "bg-white text-gray-600"
                        }`}
                      >
                        <FontAwesomeIcon icon={faTable} />
                        Table
                      </button>

                      <button
                        type="button"
                        onClick={() => setMobileView("card")}
                        className={`h-8 px-3 text-[11px] font-medium flex items-center gap-1 ${
                          mobileView === "card"
                            ? "bg-blue-600 text-white"
                            : "bg-white text-gray-600"
                        }`}
                      >
                        <FontAwesomeIcon icon={faThLarge} />
                        Card
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="global-tran-table-main-div-ui">
                <div className="max-h-[92vh] overflow-y-auto relative">
                  <ActiveReport
                    view={view}
                    filters={filters}
                    tabConfig={activeTabConfig}
                    isMobile={isMobile}
                    mobileView={mobileView}
                    onJumpToGLFromSL={jumpToGLQueryFromSL}
                    onJumpToGLFromTB={jumpToGLQueryFromTB}
                    SearchGlobalReportTable={SearchGlobalReportTable}
                    NoRecordsState={NoRecordsState}
                  />
                </div>
              </div>
            </div>
          </div>




        </div>
      </div> 



      {showFilterModal && (
        <FilterModal
          tabConfig={activeTabConfig}
          filters={filters}
          onClose={() => setShowFilterModal(false)}
          onApply={handleApplyFilters}
          updateLookupState={updateFilters}
          isLoading={isLoading}
        />
      )}

      <MobileNavDrawer
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        activeTab={activeTab}
        tabConfigs={tabConfigs}
        handleSelect={handleNavSelect}
      />

      <LookupManager filters={filters} updateFilters={updateFilters} />
    </div>
  );
}

function buildContextText(filters) {
  const branch = filters?.branchName || filters?.branchCode || "All Branches";
  const currency = filters?.currName || filters?.currCode || "Default Currency";

  const cutoff =
    filters?.cutoffName ||
    [filters?.cutoffStartName, filters?.cutoffEndName]
      .filter(Boolean)
      .join(" → ") ||
    [filters?.cutoffStartCode, filters?.cutoffEndCode]
      .filter(Boolean)
      .join(" → ") ||
    "No Cut Off";

  return `Branch: ${branch} | Period: ${cutoff} | Currency: ${currency}`;
}

function formatLoadedAt(v) {
  if (!v) return "";
  try {
    return new Date(v).toLocaleString();
  } catch {
    return "";
  }
}

function formatNumberDisplay(v) {
  const num = Number(v || 0);
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const ContextCards = ({ summary }) => {
  const totals = [
    { label: "Total Debit", value: formatNumberDisplay(summary?.totalDebit) },
    { label: "Total Credit", value: formatNumberDisplay(summary?.totalCredit) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full md:w-auto">
          {totals.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border bg-white px-4 py-3 shadow-sm min-w-[260px]"
            >
              <div className="text-xs text-gray-500">{item.label}</div>
              <div className="mt-1 text-base font-semibold text-gray-800 text-right">
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ReportNavList = ({ activeTab, tabConfigs, handleSelect, collapsed }) => (
  <ul className="space-y-2 text-sm w-full">
    {Object.keys(tabConfigs).map((key) => {
      const config = tabConfigs[key];
      if (!config) return null;

      return (
        <li key={key} className="w-full">
          <button
            onClick={() => handleSelect(key)}
            title={collapsed ? config.label || key : undefined}
            className={`w-full rounded-xl border transition text-left ${
              activeTab === key
                ? "bg-blue-50 text-blue-700 border-blue-200 shadow-sm"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            } ${
              collapsed
                ? "px-2 py-3 flex justify-center"
                : "px-3 py-2.5 flex items-center"
            }`}
          >
            <FontAwesomeIcon
              icon={config.icon || faListOl}
              className={`${collapsed ? "" : "mr-2"} text-[13px]`}
            />
            {!collapsed && (
              <span className="text-xs sm:text-sm font-medium truncate">
                {config.label || key}
              </span>
            )}
          </button>
        </li>
      );
    })}
  </ul>
);

const MobileNavDrawer = ({
  isOpen,
  onClose,
  activeTab,
  tabConfigs,
  handleSelect,
}) => {
  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-200 lg:hidden ${
        isOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
      }`}
      onClick={onClose}
    >
      <div
        className={`absolute inset-0 bg-black/40 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        className="absolute right-0 top-0 bottom-0 w-80 bg-white p-4 shadow-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h3 className="text-lg font-semibold text-gray-800">GL Reports</h3>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-800">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <ReportNavList
          activeTab={activeTab}
          tabConfigs={tabConfigs}
          handleSelect={handleSelect}
          collapsed={false}
        />
      </div>
    </div>
  );
};

const NoRecordsState = ({ title, subtitle, hint }) => (
  <div className="p-10 flex items-center justify-center">
    <div className="w-full max-w-xl border rounded-2xl bg-slate-50/60 p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
          <FontAwesomeIcon icon={faDatabase} />
        </div>

        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-800">{title}</div>
          <div className="text-xs text-gray-600 mt-1 leading-5">{subtitle}</div>
          {hint ? <div className="mt-3 text-[11px] text-gray-500">{hint}</div> : null}
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-600">
        Tip: Open <b>Filter</b> and broaden the range or clear account / SL / RC filters.
      </div>
    </div>
  </div>
);

// const FilterModal = ({ tabConfig, filters, onClose, onApply, updateLookupState, isLoading }) => {
//   const hasBranchAcc = tabConfig.filters.some((f) =>
//     ["Branch", "Account Code", "Starting Account", "Ending Account"].includes(f)
//   );
//   const hasSLRC = tabConfig.filters.some((f) =>
//     ["SL Code", "RC Code", "Starting RC", "Ending RC"].includes(f)
//   );
//   const hasCutoff = tabConfig.filters.some((f) =>
//     ["Cut Off", "Start Cut Off", "End Cut Off"].includes(f)
//   );
//   const hasCurrency = tabConfig.filters.includes("Currency");

//   return (
//     <div
//       className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-3"
//       onClick={onClose}
//     >
//       <div
//         className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[88vh]"
//         onClick={(e) => e.stopPropagation()}
//       >
//         <div className="px-4 py-3 border-b flex justify-between items-center bg-gradient-to-r from-blue-50 to-white">
//           <h3 className="text-[15px] sm:text-base font-semibold text-gray-800 flex items-center gap-2">
//             <FontAwesomeIcon icon={faFilter} className="text-blue-600" />
//             <span>Filters – {tabConfig.label}</span>
//           </h3>

//           <button
//             onClick={onClose}
//             className="text-gray-500 hover:text-gray-800 p-1.5 transition"
//             disabled={isLoading}
//           >
//             <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
//           </button>
//         </div>

//         <div className="p-3 sm:p-4 space-y-3 overflow-y-auto">
//           {hasBranchAcc && (
//             <ModalSection title="Branch & Account">
//               {tabConfig.filters.includes("Branch") && (
//                 <DualFilterInput
//                   labelCode="Branch Code"
//                   labelName="Branch Name"
//                   codeValue={filters.branchCode}
//                   nameValue={filters.branchName}
//                   modalType="branch"
//                   updateLookupState={updateLookupState}
//                   disabled={isLoading}
//                   onClear={() => updateLookupState({ branchCode: "", branchName: "" })}
//                 />
//               )}

//               {tabConfig.filters.includes("Account Code") && (
//                 <DualFilterInput
//                   labelCode="Account Code"
//                   labelName="Account Name"
//                   codeValue={filters.accCode}
//                   nameValue={filters.accName}
//                   modalType="acc"
//                   updateLookupState={updateLookupState}
//                   disabled={isLoading}
//                   onClear={() => updateLookupState({ accCode: "", accName: "" })}
//                 />
//               )}

//               {tabConfig.filters.includes("Starting Account") && (
//                 <DualFilterInput
//                   labelCode="Starting Account"
//                   labelName="Account Name"
//                   codeValue={filters.accCodeStart}
//                   nameValue={filters.accNameStart}
//                   modalType="accStart"
//                   updateLookupState={updateLookupState}
//                   disabled={isLoading}
//                   onClear={() => updateLookupState({ accCodeStart: "", accNameStart: "" })}
//                 />
//               )}

//               {tabConfig.filters.includes("Ending Account") && (
//                 <DualFilterInput
//                   labelCode="Ending Account"
//                   labelName="Account Name"
//                   codeValue={filters.accCodeEnd}
//                   nameValue={filters.accNameEnd}
//                   modalType="accEnd"
//                   updateLookupState={updateLookupState}
//                   disabled={isLoading}
//                   onClear={() => updateLookupState({ accCodeEnd: "", accNameEnd: "" })}
//                 />
//               )}
//             </ModalSection>
//           )}

//           {hasSLRC && (
//             <ModalSection title="SL & Responsibility Center">
//               {tabConfig.filters.includes("SL Code") && (
//                 <DualFilterInput
//                   labelCode="SL Code"
//                   labelName="SL Name"
//                   codeValue={filters.slCode}
//                   nameValue={filters.slName}
//                   modalType="sl"
//                   updateLookupState={updateLookupState}
//                   disabled={isLoading}
//                   onClear={() => updateLookupState({ slCode: "", slName: "" })}
//                 />
//               )}

//               {tabConfig.filters.includes("RC Code") && (
//                 <DualFilterInput
//                   labelCode="RC Code"
//                   labelName="RC Name"
//                   codeValue={filters.rcCode}
//                   nameValue={filters.rcName}
//                   modalType="rc"
//                   updateLookupState={updateLookupState}
//                   disabled={isLoading}
//                   onClear={() => updateLookupState({ rcCode: "", rcName: "" })}
//                 />
//               )}

//               {tabConfig.filters.includes("Starting RC") && (
//                 <DualFilterInput
//                   labelCode="Starting RC"
//                   labelName="RC Name"
//                   codeValue={filters.rcCodeStart}
//                   nameValue={filters.rcNameStart}
//                   modalType="rcStart"
//                   updateLookupState={updateLookupState}
//                   disabled={isLoading}
//                   onClear={() => updateLookupState({ rcCodeStart: "", rcNameStart: "" })}
//                 />
//               )}

//               {tabConfig.filters.includes("Ending RC") && (
//                 <DualFilterInput
//                   labelCode="Ending RC"
//                   labelName="RC Name"
//                   codeValue={filters.rcCodeEnd}
//                   nameValue={filters.rcNameEnd}
//                   modalType="rcEnd"
//                   updateLookupState={updateLookupState}
//                   disabled={isLoading}
//                   onClear={() => updateLookupState({ rcCodeEnd: "", rcNameEnd: "" })}
//                 />
//               )}
//             </ModalSection>
//           )}

//           {hasCutoff && (
//             <ModalSection title="Cut Off">
//               {tabConfig.filters.includes("Cut Off") && (
//                 <DualFilterInput
//                   labelCode="Cut Off"
//                   labelName="Description"
//                   codeValue={filters.cutoffCode}
//                   nameValue={filters.cutoffName}
//                   modalType="cutoffSingle"
//                   updateLookupState={updateLookupState}
//                   disabled={isLoading}
//                   onClear={() => updateLookupState({ cutoffCode: "", cutoffName: "" })}
//                 />
//               )}

//               {tabConfig.filters.includes("Start Cut Off") && (
//                 <DualFilterInput
//                   labelCode="Start Cut Off"
//                   labelName="Description"
//                   codeValue={filters.cutoffStartCode}
//                   nameValue={filters.cutoffStartName}
//                   modalType="cutoffStart"
//                   updateLookupState={updateLookupState}
//                   disabled={isLoading}
//                   onClear={() => updateLookupState({ cutoffStartCode: "", cutoffStartName: "" })}
//                 />
//               )}

//               {tabConfig.filters.includes("End Cut Off") && (
//                 <DualFilterInput
//                   labelCode="End Cut Off"
//                   labelName="Description"
//                   codeValue={filters.cutoffEndCode}
//                   nameValue={filters.cutoffEndName}
//                   modalType="cutoffEnd"
//                   updateLookupState={updateLookupState}
//                   disabled={isLoading}
//                   onClear={() => updateLookupState({ cutoffEndCode: "", cutoffEndName: "" })}
//                 />
//               )}
//             </ModalSection>
//           )}

//           {hasCurrency && (
//             <ModalSection title="Currency">
//               <DualFilterInput
//                 labelCode="Currency Code"
//                 labelName="Currency Name"
//                 codeValue={filters.currCode}
//                 nameValue={filters.currName}
//                 modalType="currency"
//                 updateLookupState={updateLookupState}
//                 disabled={isLoading}
//                 onClear={() =>
//                   updateLookupState({
//                     currCode: "PHP",
//                     currName: "Philippine Peso",
//                   })
//                 }
//               />
//             </ModalSection>
//           )}
//         </div>

//         <div className="px-3 sm:px-4 py-2.5 border-t bg-gray-50">
//         <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
//           <button
//             onClick={onClose}
//             className="w-full sm:w-auto sm:min-w-[110px] px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white border hover:bg-gray-100 transition inline-flex items-center justify-center gap-1.5"
//             disabled={isLoading}
//           >
//             <FontAwesomeIcon icon={faTimes} className="w-3.5 h-3.5" />
//             Close
//           </button>

//           <button
//             onClick={onApply}
//             className="w-full sm:w-auto sm:min-w-[110px] px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md text-white bg-blue-600 hover:bg-blue-700 transition inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
//             disabled={isLoading}
//           >
//             <FontAwesomeIcon icon={faMagnifyingGlass} className="w-3.5 h-3.5" />
//             Apply
//           </button>
//         </div>
//       </div>

      
//       </div>
//     </div>
//   );
// };



const FilterModal = ({ tabConfig, filters, onClose, onApply, updateLookupState, isLoading }) => {
  const hasBranchAcc = tabConfig.filters.some((f) =>
    ["Branch", "Account Code", "Starting Account", "Ending Account"].includes(f)
  );
  const hasSLRC = tabConfig.filters.some((f) =>
    ["SL Code", "RC Code", "Starting RC", "Ending RC"].includes(f)
  );
  const hasCutoff = tabConfig.filters.some((f) =>
    ["Cut Off", "Start Cut Off", "End Cut Off"].includes(f)
  );
  const hasCurrency = tabConfig.filters.includes("Currency");

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-2 sm:p-3"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg sm:rounded-xl shadow-2xl w-full max-w-[95vw] sm:max-w-4xl overflow-hidden flex flex-col max-h-[84vh] sm:max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b flex justify-between items-center bg-gradient-to-r from-blue-50 to-white">
          <h3 className="text-sm sm:text-base font-semibold text-gray-800 flex items-center gap-2">
            <FontAwesomeIcon icon={faFilter} className="text-blue-600 text-[13px] sm:text-sm" />
            <span className="truncate">Filters – {tabConfig.label}</span>
          </h3>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 p-1 transition"
            disabled={isLoading}
          >
            <FontAwesomeIcon icon={faTimes} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        <div className="p-2.5 sm:p-4 space-y-2.5 sm:space-y-3 overflow-y-auto">
          {hasBranchAcc && (
            <ModalSection title="Branch & Account">
              {tabConfig.filters.includes("Branch") && (
                <DualFilterInput
                  labelCode="Branch Code"
                  labelName="Branch Name"
                  codeValue={filters.branchCode}
                  nameValue={filters.branchName}
                  modalType="branch"
                  updateLookupState={updateLookupState}
                  disabled={isLoading}
                  onClear={() => updateLookupState({ branchCode: "", branchName: "" })}
                />
              )}

              {tabConfig.filters.includes("Account Code") && (
                <DualFilterInput
                  labelCode="Account Code"
                  labelName="Account Name"
                  codeValue={filters.accCode}
                  nameValue={filters.accName}
                  modalType="acc"
                  updateLookupState={updateLookupState}
                  disabled={isLoading}
                  onClear={() => updateLookupState({ accCode: "", accName: "" })}
                />
              )}

              {tabConfig.filters.includes("Starting Account") && (
                <DualFilterInput
                  labelCode="Starting Account"
                  labelName="Account Name"
                  codeValue={filters.accCodeStart}
                  nameValue={filters.accNameStart}
                  modalType="accStart"
                  updateLookupState={updateLookupState}
                  disabled={isLoading}
                  onClear={() => updateLookupState({ accCodeStart: "", accNameStart: "" })}
                />
              )}

              {tabConfig.filters.includes("Ending Account") && (
                <DualFilterInput
                  labelCode="Ending Account"
                  labelName="Account Name"
                  codeValue={filters.accCodeEnd}
                  nameValue={filters.accNameEnd}
                  modalType="accEnd"
                  updateLookupState={updateLookupState}
                  disabled={isLoading}
                  onClear={() => updateLookupState({ accCodeEnd: "", accNameEnd: "" })}
                />
              )}
            </ModalSection>
          )}

          {hasSLRC && (
            <ModalSection title="SL & Responsibility Center">
              {tabConfig.filters.includes("SL Code") && (
                <DualFilterInput
                  labelCode="SL Code"
                  labelName="SL Name"
                  codeValue={filters.slCode}
                  nameValue={filters.slName}
                  modalType="sl"
                  updateLookupState={updateLookupState}
                  disabled={isLoading}
                  onClear={() => updateLookupState({ slCode: "", slName: "" })}
                />
              )}

              {tabConfig.filters.includes("RC Code") && (
                <DualFilterInput
                  labelCode="RC Code"
                  labelName="RC Name"
                  codeValue={filters.rcCode}
                  nameValue={filters.rcName}
                  modalType="rc"
                  updateLookupState={updateLookupState}
                  disabled={isLoading}
                  onClear={() => updateLookupState({ rcCode: "", rcName: "" })}
                />
              )}

              {tabConfig.filters.includes("Starting RC") && (
                <DualFilterInput
                  labelCode="Starting RC"
                  labelName="RC Name"
                  codeValue={filters.rcCodeStart}
                  nameValue={filters.rcNameStart}
                  modalType="rcStart"
                  updateLookupState={updateLookupState}
                  disabled={isLoading}
                  onClear={() => updateLookupState({ rcCodeStart: "", rcNameStart: "" })}
                />
              )}

              {tabConfig.filters.includes("Ending RC") && (
                <DualFilterInput
                  labelCode="Ending RC"
                  labelName="RC Name"
                  codeValue={filters.rcCodeEnd}
                  nameValue={filters.rcNameEnd}
                  modalType="rcEnd"
                  updateLookupState={updateLookupState}
                  disabled={isLoading}
                  onClear={() => updateLookupState({ rcCodeEnd: "", rcNameEnd: "" })}
                />
              )}
            </ModalSection>
          )}

          {hasCutoff && (
            <ModalSection title="Cut Off">
              {tabConfig.filters.includes("Cut Off") && (
                <DualFilterInput
                  labelCode="Cut Off"
                  labelName="Description"
                  codeValue={filters.cutoffCode}
                  nameValue={filters.cutoffName}
                  modalType="cutoffSingle"
                  updateLookupState={updateLookupState}
                  disabled={isLoading}
                  onClear={() => updateLookupState({ cutoffCode: "", cutoffName: "" })}
                />
              )}

              {tabConfig.filters.includes("Start Cut Off") && (
                <DualFilterInput
                  labelCode="Start Cut Off"
                  labelName="Description"
                  codeValue={filters.cutoffStartCode}
                  nameValue={filters.cutoffStartName}
                  modalType="cutoffStart"
                  updateLookupState={updateLookupState}
                  disabled={isLoading}
                  onClear={() => updateLookupState({ cutoffStartCode: "", cutoffStartName: "" })}
                />
              )}

              {tabConfig.filters.includes("End Cut Off") && (
                <DualFilterInput
                  labelCode="End Cut Off"
                  labelName="Description"
                  codeValue={filters.cutoffEndCode}
                  nameValue={filters.cutoffEndName}
                  modalType="cutoffEnd"
                  updateLookupState={updateLookupState}
                  disabled={isLoading}
                  onClear={() => updateLookupState({ cutoffEndCode: "", cutoffEndName: "" })}
                />
              )}
            </ModalSection>
          )}

          {hasCurrency && (
            <ModalSection title="Currency">
              <DualFilterInput
                labelCode="Currency Code"
                labelName="Currency Name"
                codeValue={filters.currCode}
                nameValue={filters.currName}
                modalType="currency"
                updateLookupState={updateLookupState}
                disabled={isLoading}
                onClear={() =>
                  updateLookupState({
                    currCode: "PHP",
                    currName: "Philippine Peso",
                  })
                }
              />
            </ModalSection>
          )}
        </div>

        <div className="px-3 sm:px-4 py-2.5 border-t bg-gray-50">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
            <button
              onClick={onClose}
              className="w-full sm:w-auto sm:min-w-[110px] px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white border hover:bg-gray-100 transition inline-flex items-center justify-center gap-1.5"
              disabled={isLoading}
            >
              <FontAwesomeIcon icon={faTimes} className="w-3.5 h-3.5" />
              Close
            </button>

            <button
              onClick={onApply}
              className="w-full sm:w-auto sm:min-w-[110px] px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md text-white bg-blue-600 hover:bg-blue-700 transition inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
              disabled={isLoading}
            >
              <FontAwesomeIcon icon={faMagnifyingGlass} className="w-3.5 h-3.5" />
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


const ModalSection = ({ title, children }) => (
  <div className="border rounded-lg p-3 bg-slate-50/60 shadow-sm">
    <p className="text-sm font-semibold text-gray-700 mb-2">{title}</p>
    <div className="grid grid-cols-1 gap-2">{children}</div>
  </div>
);


const DualFilterInput = ({
  labelCode,
  labelName,
  codeValue,
  nameValue,
  modalType,
  updateLookupState,
  disabled,
  onClear,
}) => {
  const codeId = `${modalType}_code`;
  const nameId = `${modalType}_name`;

  const hasValue =
    (codeValue ?? "").toString().trim() !== "" ||
    (nameValue ?? "").toString().trim() !== "";

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start">
      <div className="md:col-span-4">
        <div className="relative">
          <input
            type="text"
            id={codeId}
            placeholder=" "
            value={codeValue || ""}
            readOnly
            className="peer global-tran-textbox-ui cursor-pointer py-2 text-xs sm:text-sm pr-20"
            disabled={disabled}
            onClick={() =>
              !disabled &&
              updateLookupState({
                showLookupModal: true,
                lookupType: codeId,
                cutoffModalType: modalType,
              })
            }
          />
          <label
            htmlFor={codeId}
            className="global-tran-floating-label text-[10px] sm:text-xs"
          >
            {labelCode}
          </label>

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {hasValue && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClear?.();
                }}
                disabled={disabled}
                className="h-5 w-5 rounded-full border border-gray-300 bg-white text-[10px] text-gray-500 hover:bg-gray-100 hover:text-gray-700 flex items-center justify-center transition disabled:opacity-50"
                title={`Clear ${labelCode}`}
              >
                <FontAwesomeIcon icon={faTimes} className="text-[9px]" />
              </button>
            )}

            <button
              type="button"
              className="h-6 w-6 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition flex items-center justify-center disabled:opacity-60"
              onClick={(e) => {
                e.stopPropagation();
                updateLookupState({
                  showLookupModal: true,
                  lookupType: codeId,
                  cutoffModalType: modalType,
                });
              }}
              disabled={disabled}
              title={`Find ${labelCode}`}
            >
              <FontAwesomeIcon icon={faMagnifyingGlass} className="text-[11px]" />
            </button>
          </div>
        </div>
      </div>

      <div className="md:col-span-8">
        <div className="relative">
          <input
            type="text"
            id={nameId}
            placeholder=" "
            value={nameValue || ""}
            readOnly
            className="peer global-tran-textbox-ui py-2 text-xs sm:text-sm"
            disabled={disabled}
          />
          <label
            htmlFor={nameId}
            className="global-tran-floating-label text-[10px] sm:text-xs"
          >
            {labelName}
          </label>
        </div>
      </div>
    </div>
  );
};






const LookupManager = ({ filters, updateFilters }) => {
  const { showLookupModal, cutoffModalType } = filters;
  if (!showLookupModal) return null;

  const close = () =>
    updateFilters({
      showLookupModal: false,
      lookupType: "",
      cutoffModalType: "",
    });

  const handleBranchSelect = (row) => {
    updateFilters({
      branchCode: row.branchCode || row.brCode || row.code,
      branchName: row.branchName || row.brName || row.name,
      showLookupModal: false,
      lookupType: "",
      cutoffModalType: "",
    });
  };

  const handleAccountSelect = (row) => {
    const code = row.acctCode;
    const name = row.acctName;

    if (cutoffModalType === "accStart") updateFilters({ accCodeStart: code, accNameStart: name });
    else if (cutoffModalType === "accEnd") updateFilters({ accCodeEnd: code, accNameEnd: name });
    else updateFilters({ accCode: code, accName: name });

    updateFilters({ showLookupModal: false, lookupType: "", cutoffModalType: "" });
  };

  const handleSLSelect = (row) => {
    updateFilters({
      slCode: row.slCode,
      slName: row.slName,
      showLookupModal: false,
      lookupType: "",
      cutoffModalType: "",
    });
  };

  const handleRCSelect = (row) => {
    const rcCode = row.rcCode || row.rc_code || row.code;
    const rcName = row.rcName || row.rc_name || row.name;

    if (cutoffModalType === "rcStart") updateFilters({ rcCodeStart: rcCode, rcNameStart: rcName });
    else if (cutoffModalType === "rcEnd")
      updateFilters({ rcCodeEnd: rcCode, rcNameEnd: rcName });
    else updateFilters({ rcCode, rcName });

    updateFilters({ showLookupModal: false, lookupType: "", cutoffModalType: "" });
  };

  const handleCutoffSelect = (row) => {
    const cutCode = row.cutoffCode || row.cutOffCode || row.code;
    const cutName = row.cutoffName || row.cutOffName || row.name;

    if (cutoffModalType === "cutoffStart")
      updateFilters({ cutoffStartCode: cutCode, cutoffStartName: cutName });
    else if (cutoffModalType === "cutoffEnd")
      updateFilters({ cutoffEndCode: cutCode, cutoffEndName: cutName });
    else updateFilters({ cutoffCode: cutCode, cutoffName: cutName });

    updateFilters({ showLookupModal: false, lookupType: "", cutoffModalType: "" });
  };

  const handleCurrencySelect = (row) => {
    updateFilters({
      currCode: row.currCode || "PHP",
      currName: row.currName || "Philippine Peso",
      showLookupModal: false,
      lookupType: "",
      cutoffModalType: "",
    });
  };

  switch (cutoffModalType) {
    case "branch":
      return <SearchBranchRef isOpen={showLookupModal} onClose={handleBranchSelect} />;
    case "sl":
      return <SearchSLMast isOpen={showLookupModal} onClose={handleSLSelect} context="sl" />;
    case "acc":
    case "accStart":
    case "accEnd":
      return (
        <COAMastLookupModal
          isOpen={showLookupModal}
          onClose={handleAccountSelect}
          context={cutoffModalType}
        />
      );
    case "rc":
    case "rcStart":
    case "rcEnd":
      return <SearchRCMast isOpen={showLookupModal} onClose={handleRCSelect} context="rc" />;
    case "cutoffSingle":
    case "cutoffStart":
    case "cutoffEnd":
      return (
        <SearchCutOffRef
          isOpen={showLookupModal}
          onClose={handleCutoffSelect}
          context={cutoffModalType}
        />
      );
    case "currency":
      return (
        <CurrLookupModal
          isOpen={showLookupModal}
          onClose={handleCurrencySelect}
          context={cutoffModalType}
        />
      );
    default:
      close();
      return null;
  }
};