

// SearchGlobalTranHistory.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { postRequest } from "@/NAYSA Cloud/Configuration/BaseURL";
import { exportGenericHistoryExcel, exportGenericQueryExcel } from "@/NAYSA Cloud/Global/report";
import { LoadingSpinner } from "@/NAYSA Cloud/Global/utilities.jsx";
import {
  format,
  subDays,
  addMonths,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";
import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";
import Modal from "react-modal";
import { useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faList,
  faPen,
  faCalendarAlt,
  faFilter,
  faDownload,
  faRedo,
  faArrowUp,
  faArrowDown,
  faEye,
  faLayerGroup,
  faChevronRight,
  faChevronDown,
  faTimes,
  faCompressArrowsAlt,
  faExpandArrowsAlt,
  faFileExcel,
  faColumns,
  faFilePdf,
  faFileImage,
  faFileExport,
  faFileCsv,
  faTable,
  faThLarge,
} from "@fortawesome/free-solid-svg-icons";

import { useReturnToDate } from "@/NAYSA Cloud/Global/dates";
import { useSelectedHSColConfig } from "@/NAYSA Cloud/Global/selectedData";
import Header, { HeaderSpacer } from "@/NAYSA Cloud/Components/Header";
import { useAuth } from "@/NAYSA Cloud/Authentication/AuthContext.jsx";

import Swal from "sweetalert2";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

Modal.setAppElement("#root");

const ACTION_COL_WIDTH = 64;
const MOBILE_MAX_COLUMNS = 100;

/* ------------------ window-level cache (survives route swaps) ------------------ */
function getGlobalCache() {
  if (typeof window !== "undefined") {
    if (!window.__NAYSA_HISTORY_CACHE__) window.__NAYSA_HISTORY_CACHE__ = {};
    return window.__NAYSA_HISTORY_CACHE__;
  }
  return {};
}

/* ---------------- Formatting helpers ---------------- */
const formatCellValue = (value, config) => {
  if (value === null || value === undefined) return "—";

  switch (config?.renderType) {
    case "date": {
      try {
        const datePart = String(value).split("T")[0];
        return useReturnToDate(datePart);
      } catch {
        return String(value);
      }
    }

    case "currency":
    case "number": {
      const num = Number(String(value).replace(/,/g, ""));
      if (Number.isNaN(num)) return String(value);
      const digits = typeof config?.roundingOff === "number" ? config.roundingOff : 2;
      return num.toLocaleString("en-US", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      });
    }

    case "status": {
      const map = {
        C: { text: "CANCELLED", color: "text-red-600" },
        F: { text: "FINALIZED", color: "text-blue-800" },
        X: { text: "CANCELLED", color: "text-red-600" },
        "": { text: "OPEN", color: "text-black" },
      };
      const sty = map[value] || map[""];
      return <span className={sty.color + " font-semibold"}>{sty.text}</span>;
    }

    default:
      return String(value);
  }
};

const parseNumber = (v) => {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isNaN(n) ? 0 : n;
};

const isNumericColumn = (col) =>
  col?.renderType === "number" || col?.renderType === "currency";


/* ============================== Component =============================== */
const AllTranHistory = (props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const navState = location.state || {};

  const {
    endpoint: endpointProp,
    activeTabKey: activeTabKeyProp,
    branchCode: branchCodeProp,
    startDate: startDateProp,
    endDate: endDateProp,
    status: statusProp,
    statusOptions: statusOptionsProp,
    prefillSearchFields: prefillProp,
    onRowDoubleClick,
    showHeader: showHeaderProp,
    cacheKey: cacheKeyProp,
    historyExportName: historyExportNameProp,
    isActive = true,
  } = props || {};

  const didInitRef = useRef(false);
  const hydratedFromCacheRef = useRef(false);
  const exportContainerRef = useRef(null);
  const tableScrollRef = useRef(null);
  const resizingRef = useRef(null);
  const wasActiveRef = useRef(isActive);

  const { currentUserRow, companyInfo } = useAuth();

  const endpoint =
    (endpointProp !== undefined && endpointProp) ||
    (navState.endpoint !== undefined && navState.endpoint);

  const baseKey =
    (typeof cacheKeyProp === "string" && cacheKeyProp) ||
    (typeof endpoint === "string" && endpoint) ||
    "HISTORY";

  const backToPath = navState.backToPath;
  const embedded =
    typeof onRowDoubleClick === "function" ||
    endpointProp !== undefined ||
    cacheKeyProp !== undefined;

  const showHeader = showHeaderProp !== undefined ? showHeaderProp : !embedded;

  const [activeTab, setActiveTab] = useState(null);

  const fallbackStatusOptions = [
    { value: "All", label: "All Status" },
    { value: "F", label: "FINALIZED" },
    { value: "C", label: "CLOSED" },
    { value: "", label: "OPEN" },
    { value: "X", label: "CANCELLED" },
  ];

  const restrictedTabs = ["JO_", "PO_", "PR_"];
  const isRestricted = restrictedTabs.some((prefix) => activeTab?.includes(prefix));

  const statusOptions =
    Array.isArray(statusOptionsProp) && statusOptionsProp.length
      ? statusOptionsProp
      : fallbackStatusOptions.filter((opt) => {
          if (isRestricted) return opt.value !== "F";
          return opt.value !== "C";
        });

  const getColumnConfig = useCallback(
    async (groupId) => {
      try {
        const response = await useSelectedHSColConfig(groupId, currentUserRow?.userCode || "");
        let config = [];

        if (Array.isArray(response)) config = response;
        else if (
          response &&
          response.success &&
          response.data &&
          response.data[0] &&
          response.data[0].result
        ) {
          const parsed = JSON.parse(response.data[0].result || "[]");
          config = Array.isArray(parsed) ? parsed : [];
        } else if (response && Array.isArray(response.data)) {
          config = response.data;
        }

        config = (config || []).map((c) => ({
          key: c.key,
          label:
            c.label ||
            String(c.key || "")
              .replace(/_/g, " ")
              .replace(/\b\w/g, (ch) => ch.toUpperCase()),
          classNames: c.classNames || "text-left",
          renderType: c.renderType || "text",
          renderFormat: c.renderFormat || "",
          roundingOff: typeof c.roundingOff === "number" ? c.roundingOff : undefined,
          sortable: c.sortable !== false,
          hidden: !!c.hidden,
          width: c.width,
        }));

        return config;
      } catch (err) {
        console.error("❌ Column config fetch failed for", groupId, err);
        return [];
      }
    },
    [currentUserRow?.userCode]
  );

  const initialDates = useCallback(() => {
    if (startDateProp && endDateProp) return [new Date(startDateProp), new Date(endDateProp)];
    if (navState.startDate && navState.endDate)
      return [new Date(navState.startDate), new Date(navState.endDate)];
    return [subDays(new Date(), 6), new Date()];
  }, [startDateProp, endDateProp, navState.startDate, navState.endDate]);

  const normalizeStatus = (v) => (v === "" ? "All" : v ?? "All");

  const [dateRangeType, setDateRangeType] = useState(
    (startDateProp && endDateProp) || (navState.startDate && navState.endDate)
      ? "Custom Range"
      : "Last 7 Days"
  );

  const [dates, setDates] = useState(initialDates());
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [status, setStatus] = useState(() => normalizeStatus(statusProp));
  const [searchFields, setSearchFields] = useState(prefillProp || navState.prefillSearchFields || {});
  const [tabData, setTabData] = useState({});
  const [tabConfigs, setTabConfigs] = useState({});
  const [exporting, setExporting] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
    tabKey: null,
  });

  const [granularity, setGranularity] = useState("day");

  /* -------- table states -------- */
  const [columnOrderByTab, setColumnOrderByTab] = useState({});
  const [groupByByTab, setGroupByByTab] = useState({});
  const [expandedGroupsByTab, setExpandedGroupsByTab] = useState({});
  const [draggedCol, setDraggedCol] = useState(null);
  const [colWidthsByTab, setColWidthsByTab] = useState({});
  const [userHiddenColsByTab, setUserHiddenColsByTab] = useState({});
  const [showColumnChooser, setShowColumnChooser] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  const [useCardView, setUseCardView] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  const [branchCode, setBranchCode] = useState(
    (branchCodeProp !== undefined && branchCodeProp) ||
      (navState.branchCode !== undefined && navState.branchCode) ||
      ""
  );

  const [appliedFilters, setAppliedFilters] = useState(() => {
    const [startDate, endDate] = initialDates();
    return {
      startDate: startDate ? format(startDate, "yyyy-MM-dd") : null,
      endDate: endDate ? format(endDate, "yyyy-MM-dd") : null,
      branchCode:
        (branchCodeProp !== undefined && branchCodeProp) ||
        (navState.branchCode !== undefined && navState.branchCode) ||
        "",
    };
  });

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      if (!mobile) {
        setUseCardView(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* ---------------- restore from window cache ---------------- */
  useEffect(() => {
    const cache = getGlobalCache();
    let snap = cache[baseKey];

    const incomingBranch =
      (branchCodeProp !== undefined && branchCodeProp) ||
      (navState.branchCode !== undefined && navState.branchCode) ||
      "";

    if (snap && incomingBranch && snap.branchCode && snap.branchCode !== incomingBranch) {
      delete cache[baseKey];
      snap = undefined;
    }

    if (snap) {
      hydratedFromCacheRef.current = true;
      setDates(snap.dates || initialDates());
      setDateRangeType(snap.dateRangeType || "Last 7 Days");

      const desired =
        statusProp !== undefined
          ? normalizeStatus(statusProp)
          : snap.status !== undefined
          ? normalizeStatus(snap.status)
          : "All";

      setStatus(desired);
      setSearchFields(snap.searchFields || {});
      setTabData(snap.tabData || {});
      setTabConfigs(snap.tabConfigs || {});
      setActiveTab(snap.activeTab || null);
      setBranchCode(
        (snap.branchCode !== undefined && snap.branchCode) ||
          incomingBranch ||
          ""
      );
      setColumnOrderByTab(snap.columnOrderByTab || {});
      setGroupByByTab(snap.groupByByTab || {});
      setExpandedGroupsByTab(snap.expandedGroupsByTab || {});
      setColWidthsByTab(snap.colWidthsByTab || {});
      setUserHiddenColsByTab(snap.userHiddenColsByTab || {});
    } else {
      if (statusProp !== undefined) setStatus(normalizeStatus(statusProp));
    }
  }, [baseKey, statusProp, branchCodeProp, navState.branchCode, initialDates]);

  /* ---------------- keep window cache updated ---------------- */
  useEffect(() => {
    const cache = getGlobalCache();
    cache[baseKey] = {
      dates,
      dateRangeType,
      status,
      searchFields,
      tabData,
      tabConfigs,
      activeTab,
      branchCode,
      columnOrderByTab,
      groupByByTab,
      expandedGroupsByTab,
      colWidthsByTab,
      userHiddenColsByTab,
    };
  }, [
    baseKey,
    dates,
    dateRangeType,
    status,
    searchFields,
    tabData,
    tabConfigs,
    activeTab,
    branchCode,
    columnOrderByTab,
    groupByByTab,
    expandedGroupsByTab,
    colWidthsByTab,
    userHiddenColsByTab,
  ]);

  /* ---------------- date presets ---------------- */
  useEffect(() => {
    const today = new Date();
    if (dateRangeType === "Last 7 Days") {
      setDates([subDays(today, 6), today]);
    } else if (dateRangeType === "Last 30 Days") {
      setDates([subDays(today, 29), today]);
    } else if (dateRangeType === "Custom Range") {
      setDates([null, null]);
    }
  }, [dateRangeType]);

  const formatDateRange = (start, end) =>
    start && end ? `${format(start, "MM/dd/yyyy")} - ${format(end, "MM/dd/yyyy")}` : "";

  /* ---------------- query fetcher ---------------- */
  const fetchHistoryData = useCallback(
    async ({ queryKey }) => {
      const [, params] = queryKey;

      const payload = {
        json_data: {
          startDate: params.startDate,
          endDate: params.endDate,
          branchCode: params.branchCode,
          userCode: params.userCode,
        },
      };

      const dataResponse = await postRequest(params.endpoint, JSON.stringify(payload));
      const raw =
        dataResponse &&
        dataResponse.data &&
        dataResponse.data[0] &&
        dataResponse.data[0].result
          ? dataResponse.data[0].result
          : "{}";

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (e) {
        console.error("Failed to parse history result", e, raw);
        return { rootDataMap: {}, newTabConfigs: {}, rootKeys: [] };
      }

      let rootDataMap = {};
      if (Array.isArray(parsed)) {
        rootDataMap = parsed.reduce((acc, item) => {
          if (item && typeof item === "object" && !Array.isArray(item)) Object.assign(acc, item);
          return acc;
        }, {});
      } else if (parsed && typeof parsed === "object") {
        rootDataMap = parsed;
      }

      Object.keys(rootDataMap).forEach((k) => {
        const v = rootDataMap[k];
        if (v && typeof v === "object" && !Array.isArray(v) && Array.isArray(v.rows)) {
          rootDataMap[k] = v.rows;
        }
      });

      const rootKeys = Object.keys(rootDataMap);
      const newTabConfigs = {};
      for (const key of rootKeys) {
        newTabConfigs[key] = await getColumnConfig(key);
      }

      return { rootDataMap, newTabConfigs, rootKeys };
    },
    [getColumnConfig]
  );

  const {
    data: historyQueryData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: [
      "all-tran-history",
      {
        endpoint,
        startDate: appliedFilters.startDate,
        endDate: appliedFilters.endDate,
        branchCode: appliedFilters.branchCode,
        userCode: currentUserRow?.userCode,
      },
    ],
    queryFn: fetchHistoryData,
    enabled: Boolean(
      endpoint &&
        appliedFilters?.startDate &&
        appliedFilters?.endDate &&
        currentUserRow?.userCode
    ),
    staleTime: 1000 * 10,
    gcTime: 1000 * 60 * 30,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    placeholderData: (previousData) => previousData,
  });

  useEffect(() => {
    if (isActive && !wasActiveRef.current) {
      refetch();
    }
    wasActiveRef.current = isActive;
  }, [isActive, refetch]);

  const loading = isLoading;
  const refreshing = isFetching && !isLoading;

  /* ---------------- apply query result ---------------- */
  useEffect(() => {
    if (!historyQueryData) return;

    const { rootDataMap, newTabConfigs, rootKeys } = historyQueryData;

    setTabData(rootDataMap);
    setTabConfigs(newTabConfigs);

    const initialTabKey =
      (activeTabKeyProp && rootKeys.includes(activeTabKeyProp) && activeTabKeyProp) ||
      (navState.activeTabKey && rootKeys.includes(navState.activeTabKey) && navState.activeTabKey) ||
      rootKeys[0] ||
      null;

    const initialOrders = {};
    const initialGroups = {};
    const initialExpanded = {};
    const initialWidths = {};
    const initialHidden = {};

    rootKeys.forEach((key) => {
      const cols =
        (newTabConfigs[key] || []).length
          ? newTabConfigs[key].filter((c) => !c.hidden)
          : rootDataMap[key]?.length
          ? Object.keys(rootDataMap[key][0]).map((k) => ({ key: k }))
          : [];

      initialOrders[key] = cols.map((c) => c.key);
      initialGroups[key] = [];
      initialExpanded[key] = {};
      initialWidths[key] = {};
      initialHidden[key] = [];
    });

    setColumnOrderByTab((prev) => {
      if (Object.keys(prev).length) return prev;
      return initialOrders;
    });

    setGroupByByTab((prev) => {
      if (Object.keys(prev).length) return prev;
      return initialGroups;
    });

    setExpandedGroupsByTab((prev) => {
      if (Object.keys(prev).length) return prev;
      return initialExpanded;
    });

    setColWidthsByTab((prev) => {
      if (Object.keys(prev).length) return prev;
      return initialWidths;
    });

    setUserHiddenColsByTab((prev) => {
      if (Object.keys(prev).length) return prev;
      return initialHidden;
    });

    setActiveTab((prev) => (prev && rootKeys.includes(prev) ? prev : initialTabKey));

    setSearchFields((prev) =>
      Object.keys(prev).length ? prev : prefillProp || navState.prefillSearchFields || {}
    );

    setSortConfig((prev) =>
      prev?.tabKey ? prev : { key: null, direction: "asc", tabKey: initialTabKey }
    );

    hydratedFromCacheRef.current = true;
  }, [
    historyQueryData,
    activeTabKeyProp,
    navState.activeTabKey,
    navState.prefillSearchFields,
    prefillProp,
  ]);

  /* ---------------- columns for a tab ---------------- */
  const getColumnsForTab = useCallback(
    (tabKey) => {
      const dataForTab = tabData[tabKey] || [];
      const configured = tabConfigs[tabKey] || [];
      if (configured.length > 0) return configured.filter((c) => !c.hidden);
      if (dataForTab.length === 0) return [];
      return Object.keys(dataForTab[0]).map((k) => ({
        key: k,
        label: k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        renderType: "text",
        sortable: true,
      }));
    },
    [tabData, tabConfigs]
  );

  const currentRows = tabData[activeTab] || [];
  const baseColumns = useMemo(() => getColumnsForTab(activeTab), [activeTab, getColumnsForTab]);

  useEffect(() => {
    if (!activeTab || !baseColumns.length) return;

    setColumnOrderByTab((prev) => {
      if (prev[activeTab]?.length) return prev;
      return {
        ...prev,
        [activeTab]: baseColumns.map((c) => c.key),
      };
    });

    setGroupByByTab((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab] || [],
    }));

    setExpandedGroupsByTab((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab] || {},
    }));

    setColWidthsByTab((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab] || {},
    }));

    setUserHiddenColsByTab((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab] || [],
    }));
  }, [activeTab, baseColumns]);

  const groupBy = groupByByTab[activeTab] || [];
  const expandedGroups = expandedGroupsByTab[activeTab] || {};
  const colWidths = colWidthsByTab[activeTab] || {};
  const userHiddenCols = userHiddenColsByTab[activeTab] || [];
  const columnOrder = columnOrderByTab[activeTab] || baseColumns.map((c) => c.key);

  const orderedCols = useMemo(() => {
    if (!baseColumns.length) return [];
    if (!columnOrder.length) return baseColumns;
    return columnOrder.map((key) => baseColumns.find((c) => c.key === key)).filter(Boolean);
  }, [baseColumns, columnOrder]);

  const visibleCols = useMemo(() => {
    return orderedCols.filter(
      (c) => !c.hidden && !userHiddenCols.includes(c.key) && !groupBy.includes(c.key)
    );
  }, [orderedCols, userHiddenCols, groupBy]);

    const renderVisibleCols = useMemo(() => {
      return visibleCols;
    }, [visibleCols]);

  const primaryCardCol = useMemo(() => {
    if (!visibleCols.length) return null;

    const preferredKeys = [
      "docNo",
      "documentNo",
      "DOC_NO",
      "doc_code",
      "code",
      "name",
      "referenceNo",
      "refNo",
    ];

    return (
      visibleCols.find((col) => preferredKeys.includes(col.key)) ||
      visibleCols[0]
    );
  }, [visibleCols]);

  const cardDetailCols = useMemo(() => {
    if (!primaryCardCol) return visibleCols;
    return visibleCols.filter((col) => col.key !== primaryCardCol.key);
  }, [visibleCols, primaryCardCol]);

  /* ---------------- filtered rows ---------------- */
  const filteredData = useMemo(() => {
    const base = currentRows.filter((row) =>
      Object.entries(searchFields).every(([key, value]) => {
        if (!value) return true;
        return String(row?.[key] ?? "")
          .toLowerCase()
          .includes(String(value).toLowerCase());
      })
    );

    const statusFiltered = (() => {
      if (status === "All") return base;
      const statusFieldCandidates = ["C", "doc_stat", "docStatus", "status", "stat"];
      return base.filter((row) => {
        const rowStatus =
          statusFieldCandidates
            .map((f) => (row[f] !== undefined ? String(row[f]) : undefined))
            .find((v) => v !== undefined) ?? "";
        return rowStatus === status;
      });
    })();

    if (!sortConfig.key || sortConfig.tabKey !== activeTab) return statusFiltered;

    const col = baseColumns.find((c) => c.key === sortConfig.key);
    const isNum = isNumericColumn(col);

    return [...statusFiltered].sort((a, b) => {
      const valA = a?.[sortConfig.key];
      const valB = b?.[sortConfig.key];

      if (isNum) {
        const numA = parseNumber(valA);
        const numB = parseNumber(valB);
        return sortConfig.direction === "asc" ? numA - numB : numB - numA;
      }

      const sA = String(valA ?? "");
      const sB = String(valB ?? "");
      return sortConfig.direction === "asc" ? sA.localeCompare(sB) : sB.localeCompare(sA);
    });
  }, [currentRows, searchFields, status, sortConfig, activeTab, baseColumns]);

  /* ---------------- grouping / totals helpers ---------------- */
  const totalExemptions = ["rate", "percent", "ratio", "id", "code"];

  const shouldSumColumn = useCallback((col) => {
    const noTotalKeys = ["unitcost", "currrate", "unitprice", "runbal"];
    if (!col) return false;

    const key = String(col.key ?? "").toLowerCase();
    const label = String(col.label ?? "").toLowerCase();

    if (noTotalKeys.includes(key)) return false;
    if (!isNumericColumn(col)) return false;
    if (totalExemptions.some((ex) => label.includes(ex) || key.includes(ex))) return false;

    return true;
  }, []);

  const calculateAggregates = useCallback(
    (rows) => {
      const sums = {};
      visibleCols.forEach((col) => {
        if (shouldSumColumn(col)) {
          sums[col.key] = rows.reduce((acc, curr) => acc + parseNumber(curr[col.key]), 0);
        }
      });
      return sums;
    },
    [visibleCols, shouldSumColumn]
  );

  const groupData = useCallback(
    (rows, level = 0) => {
      if (level >= groupBy.length) return rows.map((row) => ({ ...row }));

      const groupKey = groupBy[level];
      const groups = {};

      rows.forEach((row) => {
        const val = String(row[groupKey] ?? "(Blank)");
        if (!groups[val]) groups[val] = [];
        groups[val].push(row);
      });

      const result = [];
      Object.keys(groups)
        .sort()
        .forEach((key) => {
          result.push({
            isGroup: true,
            key: groupKey,
            value: key,
            level,
            children: groupData(groups[key], level + 1),
            count: groups[key].length,
            aggregates: calculateAggregates(groups[key]),
          });
        });

      return result;
    },
    [groupBy, calculateAggregates]
  );

  const processRenderList = useCallback(
    (nodes) => {
      let list = [];
      nodes.forEach((node) => {
        if (node.isGroup) {
          list.push(node);
          const uniqueId = `${node.key}-${node.value}-${node.level}`;
          if (expandedGroups[uniqueId]) {
            if (node.level === groupBy.length - 1) list = list.concat(node.children);
            else list = list.concat(processRenderList(node.children));

            list.push({
              isSubtotal: true,
              groupLabel: baseColumns.find((c) => c.key === node.key)?.label,
              groupValue: node.value,
              aggregates: node.aggregates,
              level: node.level,
            });
          }
        } else {
          list.push(node);
        }
      });
      return list;
    },
    [expandedGroups, groupBy.length, baseColumns]
  );

  const groupedStructure = useMemo(() => {
    if (groupBy.length === 0) return filteredData;
    return groupData(filteredData);
  }, [filteredData, groupBy, groupData]);

  const fullRenderRows = useMemo(() => {
    if (groupBy.length === 0) return filteredData;

    const expandAll = (nodes) => {
      let list = [];
      nodes.forEach((node) => {
        if (node.isGroup) {
          list.push(node);
          if (node.level === groupBy.length - 1) list = list.concat(node.children);
          else list = list.concat(expandAll(node.children));

          list.push({
            isSubtotal: true,
            groupLabel: baseColumns.find((c) => c.key === node.key)?.label,
            groupValue: node.value,
            aggregates: node.aggregates,
            level: node.level,
          });
        } else {
          list.push(node);
        }
      });
      return list;
    };

    return expandAll(groupedStructure);
  }, [groupBy.length, filteredData, groupedStructure, baseColumns]);

  const displayRows = useMemo(() => {
    if (groupBy.length === 0) return filteredData;
    return processRenderList(groupedStructure);
  }, [groupBy.length, filteredData, processRenderList, groupedStructure]);

  const grandTotals = useMemo(() => calculateAggregates(filteredData), [filteredData, calculateAggregates]);

  /* ---------------- handlers ---------------- */
  const handleSearchChange = (e, key) => {
    const { value } = e.target;
    setSearchFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc" && sortConfig.tabKey === activeTab) {
      direction = "desc";
    }
    setSortConfig({ key, direction, tabKey: activeTab });
  };

  const handleApplyFilter = useCallback(() => {
    if (!dates?.[0] || !dates?.[1]) return;

    const nextFilters = {
      startDate: format(dates[0], "yyyy-MM-dd"),
      endDate: format(dates[1], "yyyy-MM-dd"),
      branchCode,
    };

    const isSameFilter =
      appliedFilters?.startDate === nextFilters.startDate &&
      appliedFilters?.endDate === nextFilters.endDate &&
      appliedFilters?.branchCode === nextFilters.branchCode;

    if (isSameFilter) {
      refetch();
      return;
    }

    hydratedFromCacheRef.current = false;
    setSearchFields(prefillProp || navState.prefillSearchFields || {});
    setTabData({});
    setTabConfigs({});
    setActiveTab(null);
    setShowColumnChooser(false);
    setShowExportMenu(false);
    setGroupByByTab({});
    setExpandedGroupsByTab({});
    setColumnOrderByTab({});
    setColWidthsByTab({});
    setUserHiddenColsByTab({});
    setSortConfig({ key: null, direction: "asc", tabKey: null });

    setAppliedFilters(nextFilters);
  }, [
    dates,
    branchCode,
    appliedFilters,
    refetch,
    prefillProp,
    navState.prefillSearchFields,
  ]);

  const handleResetUI = () => {
    hydratedFromCacheRef.current = false;
    const today = new Date();
    const newDates = [subDays(today, 6), today];

    setDateRangeType("Last 7 Days");
    setDates(newDates);
    setSearchFields({});
    setStatus("All");
    setGroupByByTab((prev) => ({ ...prev, [activeTab]: [] }));
    setExpandedGroupsByTab((prev) => ({ ...prev, [activeTab]: {} }));
    setUserHiddenColsByTab((prev) => ({ ...prev, [activeTab]: [] }));
    setColWidthsByTab((prev) => ({ ...prev, [activeTab]: {} }));

    if (activeTab) {
      setColumnOrderByTab((prev) => ({
        ...prev,
        [activeTab]: baseColumns.map((c) => c.key),
      }));
    }

    setAppliedFilters({
      startDate: format(newDates[0], "yyyy-MM-dd"),
      endDate: format(newDates[1], "yyyy-MM-dd"),
      branchCode: branchCode || "",
    });

    refetch();
  };

  const getRowClassByStatus = (row) => {
    const statusFieldCandidates = ["C", "doc_stat", "docStatus", "status", "stat"];
    const rowStatus =
      statusFieldCandidates
        .map((f) => (row[f] !== undefined ? String(row[f]) : undefined))
        .find((v) => v !== undefined) ?? "";

    if (rowStatus === "X" || rowStatus === "C") return "text-red-600";
    if (rowStatus === "F") return "text-blue-700";
    return "";
  };

  const handleRowDoubleClick = useCallback(
    (row) => {
      const docNo = row?.docNo ?? row?.documentNo ?? row?.DOC_NO ?? "";
      const bcode = row?.branchCode ?? row?.BRANCH_CODE ?? "";
      if (!docNo || !bcode) return;

      if (typeof onRowDoubleClick === "function") {
        onRowDoubleClick({ ...row, docNo, branchCode: bcode });
      } else {
        navigate(backToPath, {
          state: { docNo, branchCode: bcode },
          replace: true,
        });
      }
    },
    [onRowDoubleClick, navigate, backToPath]
  );

  /* ---------------- column reorder / group / resize ---------------- */
  const handleColDragStart = (e, key) => {
    setDraggedCol(key);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleColDrop = (e, targetKey, isDropZone = false) => {
    e.preventDefault();
    if (!draggedCol || !activeTab) return;

    if (isDropZone) {
      if (!groupBy.includes(draggedCol)) {
        setGroupByByTab((prev) => ({
          ...prev,
          [activeTab]: [...(prev[activeTab] || []), draggedCol],
        }));
        setExpandedGroupsByTab((prev) => ({ ...prev, [activeTab]: {} }));
      }
    } else {
      if (groupBy.includes(draggedCol)) return;
      if (draggedCol === targetKey) return;

      const newOrder = [...columnOrder];
      const oldIdx = newOrder.indexOf(draggedCol);
      const newIdx = newOrder.indexOf(targetKey);

      if (oldIdx > -1 && newIdx > -1) {
        newOrder.splice(oldIdx, 1);
        newOrder.splice(newIdx, 0, draggedCol);
        setColumnOrderByTab((prev) => ({
          ...prev,
          [activeTab]: newOrder,
        }));
      }
    }

    setDraggedCol(null);
  };

  const toggleGroup = (node) => {
    const uniqueId = `${node.key}-${node.value}-${node.level}`;
    setExpandedGroupsByTab((prev) => ({
      ...prev,
      [activeTab]: {
        ...(prev[activeTab] || {}),
        [uniqueId]: !(prev[activeTab] || {})[uniqueId],
      },
    }));
  };

  const toggleAllGroups = (expand) => {
    if (!activeTab) return;
    if (!expand) {
      setExpandedGroupsByTab((prev) => ({ ...prev, [activeTab]: {} }));
      return;
    }

    const allKeys = {};
    const traverse = (nodes) => {
      nodes.forEach((n) => {
        if (n.isGroup) {
          allKeys[`${n.key}-${n.value}-${n.level}`] = true;
          if (Array.isArray(n.children) && n.children[0]?.isGroup) traverse(n.children);
        }
      });
    };
    traverse(groupedStructure);

    setExpandedGroupsByTab((prev) => ({
      ...prev,
      [activeTab]: allKeys,
    }));
  };

  const handleRemoveGroupedColumn = (gKey) => {
    if (!activeTab) return;

    const nextGroups = (groupByByTab[activeTab] || []).filter((k) => k !== gKey);

    if (nextGroups.length === 0) {
      setGroupByByTab((prev) => ({
        ...prev,
        [activeTab]: [],
      }));

      setExpandedGroupsByTab((prev) => ({
        ...prev,
        [activeTab]: {},
      }));

      setDraggedCol(null);
      return;
    }

    setGroupByByTab((prev) => ({
      ...prev,
      [activeTab]: nextGroups,
    }));

    setExpandedGroupsByTab((prev) => ({
      ...prev,
      [activeTab]: {},
    }));
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (!resizingRef.current || !activeTab) return;
      const { startX, startWidth, key } = resizingRef.current;
      const delta = e.clientX - startX;
      const newWidth = Math.max(60, startWidth + delta);

      setColWidthsByTab((prev) => ({
        ...prev,
        [activeTab]: {
          ...(prev[activeTab] || {}),
          [key]: newWidth,
        },
      }));
    },
    [activeTab]
  );

  const handleMouseUp = useCallback(() => {
    if (resizingRef.current) {
      resizingRef.current = null;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }
  }, [handleMouseMove]);

  const startResizing = (e, key) => {
    e.preventDefault();
    e.stopPropagation();
    const th = e.currentTarget?.parentElement;
    const currentWidth =
      th?.offsetWidth ||
      colWidths[key] ||
      Number(baseColumns.find((c) => c.key === key)?.width) ||
      120;

    resizingRef.current = {
      startX: e.clientX,
      startWidth: currentWidth,
      key,
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const stickyPlan = useMemo(() => {
    let left = ACTION_COL_WIDTH;
    const maxStickyCols = groupBy.length > 0 ? 1 : 0;

    return renderVisibleCols.map((col, index) => {
      const resizedWidth = colWidths[col.key];
      const isSticky = index < maxStickyCols;

      if (isSticky) {
        const width = (resizedWidth ?? Number(col.width)) || 140;
        const meta = { sticky: true, left, width };
        left += width;
        return meta;
      }

      return { sticky: false, left: 0, width: resizedWidth || undefined };
    });
  }, [renderVisibleCols, colWidths, groupBy.length]);

  /* ---------------- export helpers ---------------- */
  const tabToSheet = (tabKey) => {
    const cols = getColumnsForTab(tabKey).filter(
      (c) =>
        !(userHiddenColsByTab[tabKey] || []).includes(c.key) &&
        !((groupByByTab[tabKey] || []).includes(c.key))
    );

    const rows = (tabData[tabKey] || []).map((row) => {
      const obj = {};
      cols.forEach((col) => {
        const header = col.label || col.key;
        const val = formatCellValue(row[col.key], col);
        obj[header] = React.isValidElement(val) ? val.props?.children ?? "" : val;
      });
      return obj;
    });

    const sheetName = tabKey
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .slice(0, 31);

    return { sheetName, rows };
  };

  const buildJsonSheets = () => Object.keys(tabData || {}).map((tabKey) => tabToSheet(tabKey));

  function toTabbedJson(jsonSheets) {
    const data = {};
    for (const tab of jsonSheets || []) {
      const key = tab.sheetName || "Sheet";
      data[key] = Array.isArray(tab.rows) ? tab.rows : [];
    }
    return { Data: data };
  }

  const exportName =
    historyExportNameProp ??
    (location.state && location.state.historyExportName) ??
    "Transaction History";

  const getDateTimeStamp = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const mi = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    return `${yyyy}${mm}${dd}_${hh}${mi}${ss}`;
  };

  // const handleExportExcel_All = async () => {
  //   const tabKeys = Object.keys(tabData || {});
  //   if (!tabKeys.length) {
  //     alert("No data to export. Please Apply Filter first.");
  //     return;
  //   }

  //   setExporting(true);
  //   try {
  //     const now = new Date();
  //     const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
  //     const timePart = now.toTimeString().slice(0, 8).replace(/:/g, "");
  //     const defaultFileName = `${exportName} ${datePart}_${timePart}`;

  //     const { value: fileName } = await Swal.fire({
  //       title: "Enter File Name",
  //       input: "text",
  //       inputLabel: "Export File Name:",
  //       inputValue: defaultFileName,
  //       width: "400px",
  //       showCancelButton: true,
  //       confirmButtonText: "Export",
  //       inputValidator: (value) => {
  //         if (!value || value.trim() === "") {
  //           return "File name cannot be empty!";
  //         }
  //       },
  //     });

  //     if (!fileName) return;

  //     const reportName = fileName;
  //     const start = dates?.[0] ? format(dates[0], "yyyy-MM-dd") : null;
  //     const end = dates?.[1] ? format(dates[1], "yyyy-MM-dd") : null;
  //     const sheets = buildJsonSheets();
  //     const jsonData = toTabbedJson(sheets);

  //     const payload = {
  //       ReportName: reportName,
  //       UserCode: currentUserRow?.USER_CODE || currentUserRow?.userCode || "",
  //       Branch: branchCode || "",
  //       StartDate: start,
  //       EndDate: end,
  //       JsonData: jsonData,
  //     };

  //     await exportHistoryExcel(
  //       "/exportHistoryReport",
  //       JSON.stringify(payload),
  //       setExporting,
  //       reportName
  //     );
  //   } catch (err) {
  //     console.error("Error exporting excel:", err);
  //   } finally {
  //     setExporting(false);
  //   }
  // };




  const handleExportExcel_All = async () => {
    const tabKeys = Object.keys(tabData || {});
    if (!tabKeys.length) {
      alert("No data to export. Please Apply Filter first.");
      return;
    }

    setExporting(true);
    try {
      const now = new Date();
      const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
      const timePart = now.toTimeString().slice(0, 8).replace(/:/g, "");
      const defaultFileName = `${exportName} ${datePart}_${timePart}`;




      const { value: fileName } = await Swal.fire({
        input: "text",
        inputLabel: "Export File Name:",
        inputValue: defaultFileName,
        width: "520px",
        showCancelButton: true,
        confirmButtonText: "Export",
        customClass: {
          input: "swal-wide-input",
        },
        inputValidator: (value) => {
          if (!value || value.trim() === "") {
            return "File name cannot be empty!";
          }
        },
      });



      if (!fileName) return;
      const reportName = fileName.trim();
      const start = dates?.[0] ? format(dates[0], "yyyy-MM-dd") : null;
      const end = dates?.[1] ? format(dates[1], "yyyy-MM-dd") : null;
      const exportData = { Data: {} };
      const columnConfigsMap = {};


      Object.keys(tabData || {}).forEach((tabKey) => {
        const sheetName = tabKey
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())
          .slice(0, 31);

        const groupCols = groupByByTab[tabKey] || [];
        const hiddenCols = userHiddenColsByTab[tabKey] || [];

        const cols = getColumnsForTab(tabKey).filter(
          (c) => !c.hidden && !hiddenCols.includes(c.key) && !groupCols.includes(c.key)
        );

        const rows = Array.isArray(tabData[tabKey]) ? tabData[tabKey] : [];
        exportData.Data[sheetName] = rows;
        columnConfigsMap[sheetName] = cols;
      });

      const payload = {
        ReportName: reportName,
        UserCode: currentUserRow?.userCode ||  "",
        Branch: branchCode || "",
        StartDate: start,
        EndDate: end,
        JsonData: exportData,
        companyName: companyInfo?.compName || "",
        companyAddress: companyInfo?.compAddr || "",
        companyTelNo: companyInfo?.telNo || ""
      };

      await exportGenericHistoryExcel(payload, columnConfigsMap);
    } catch (err) {
      console.error("Error exporting excel:", err);
    } finally {
      setExporting(false);
    }
  };





  const handleExportExcel = async () => {
    if (!visibleCols.length || !filteredData.length) return;

    try {
      const activeTabFileName = activeTab
        ? `${activeTab.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} ${getDateTimeStamp()}`
        : `History ${getDateTimeStamp()}`;

      const formatMMddyyyyNoSlash = (dateValue) => {
        if (!dateValue) return "";
        return format(new Date(dateValue), "MMddyyyy");
      };

      const reportTitle = activeTab
        ? `${activeTab.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} ${formatMMddyyyyNoSlash(
            dates?.[0]
          )} to ${formatMMddyyyyNoSlash(dates?.[1])}`
        : `History ${formatMMddyyyyNoSlash(dates?.[0])} to ${formatMMddyyyyNoSlash(dates?.[1])}`;

      const { value: fileName } = await Swal.fire({
        input: "text",
        inputLabel: "Export File Name:",
        inputValue: activeTabFileName,
        width: "400px",
        showCancelButton: true,
        confirmButtonText: "Export",
        inputValidator: (value) => {
          if (!value || value.trim() === "") {
            return "File name cannot be empty!";
          }
        },
      });

      if (!fileName) return;



      const exportData = groupBy.length > 0 ? groupedStructure : filteredData;
      await exportGenericQueryExcel(
        exportData,
        grandTotals,
        visibleCols,
        groupBy,
        baseColumns,
        expandedGroups,
        7,
        fileName,
        currentUserRow?.userName,
        companyInfo?.compName,
        companyInfo?.compAddr,
        companyInfo?.telNo,
        reportTitle
      );
    } catch (err) {
      console.error("Error exporting Excel:", err);
    }
  };



  
  const handleExportCsv = async () => {
    if (!visibleCols.length || !filteredData.length) return;

    try {
      const defaultFileName = `${exportName} ${getDateTimeStamp()}`;
      const { value: fileName } = await Swal.fire({
        title: "Enter File Name",
        input: "text",
        inputLabel: "Export CSV File Name:",
        inputValue: defaultFileName,
        width: "400px",
        showCancelButton: true,
        confirmButtonText: "Export CSV",
        inputValidator: (value) => {
          if (!value || value.trim() === "") return "File name cannot be empty!";
        },
      });

      if (!fileName) return;

      const rowsToExport = filteredData;
      const headerRow = visibleCols
        .map((col) => {
          let header = String(col.label ?? "");
          header = header.replace(/,/g, "");
          header = header.toUpperCase().replace(/\s+/g, "_");
          return `"${header.replace(/"/g, '""')}"`;
        })
        .join(",");

      const csvLines = [headerRow];

      rowsToExport.forEach((row) => {
        const line = visibleCols
          .map((col) => {
            const formatted = formatCellValue(row[col.key], col);
            const noCommas = String(
              React.isValidElement(formatted) ? formatted.props?.children ?? "" : formatted ?? ""
            ).replace(/,/g, "");
            return `"${String(noCommas).replace(/"/g, '""')}"`;
          })
          .join(",");
        csvLines.push(line);
      });

      const blob = new Blob([csvLines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${fileName}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting CSV:", err);
    }
  };

  const handleExportPdf = async () => {
    if (!exportContainerRef.current || !displayRows.length) return;

    try {
      const canvas = await html2canvas(exportContainerRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");

      const defaultFileName = `${exportName} ${getDateTimeStamp()}`;
      const { value: fileName } = await Swal.fire({
        title: "Enter File Name",
        input: "text",
        inputLabel: "Export PDF File Name:",
        inputValue: defaultFileName,
        width: "400px",
        showCancelButton: true,
        confirmButtonText: "Export PDF",
        inputValidator: (value) => {
          if (!value || value.trim() === "") return "File name cannot be empty!";
        },
      });

      if (!fileName) return;

      const pdf = new jsPDF("l", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidthPx = canvas.width;
      const imgHeightPx = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidthPx, pdfHeight / imgHeightPx);
      const imgWidth = imgWidthPx * ratio;
      const imgHeight = imgHeightPx * ratio;
      const x = (pdfWidth - imgWidth) / 2;
      const y = 5;

      pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
      pdf.save(`${fileName}.pdf`);
    } catch (err) {
      console.error("Error exporting PDF:", err);
    }
  };

  const handleExportImage = async () => {
    if (!exportContainerRef.current || !displayRows.length) return;

    try {
      const canvas = await html2canvas(exportContainerRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");

      const defaultFileName = `${exportName} ${getDateTimeStamp()}`;
      const { value: fileName } = await Swal.fire({
        title: "Enter File Name",
        input: "text",
        inputLabel: "Export Image File Name:",
        inputValue: defaultFileName,
        width: "400px",
        showCancelButton: true,
        confirmButtonText: "Export Image",
        inputValidator: (value) => {
          if (!value || value.trim() === "") return "File name cannot be empty!";
        },
      });

      if (!fileName) return;

      const link = document.createElement("a");
      link.href = imgData;
      link.download = `${fileName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error exporting image:", err);
    }
  };

  const numberAlignClass = (col) =>
    isNumericColumn(col) || col?.classNames?.includes("text-right")
      ? "text-right tabular-nums"
      : "text-left";

  const commonCellClass = "px-2 py-1 border whitespace-nowrap";

  const allChooserKeys = visibleCols
    .concat(
      orderedCols.filter(
        (c) => !c.hidden && !groupBy.includes(c.key) && !visibleCols.some((vc) => vc.key === c.key)
      )
    )
    .map((c) => c.key);

  const allChecked = userHiddenCols.length === 0;

  /* ---------------- mobile card renderers ---------------- */
  const renderMobileCard = useCallback(
    (row, idx) => {
      const rowClass = getRowClassByStatus(row);
      const headerCol = primaryCardCol;
      const headerLabel = (headerCol?.label || headerCol?.key || "Record");
      const headerValue = headerCol ? formatCellValue(row?.[headerCol.key], headerCol) : `Record ${idx + 1}`;

      return (
        <div
          key={row.__idx ?? idx}
          className="rounded-lg border bg-white shadow-sm px-3 py-2 cursor-pointer active:scale-[0.99] transition"
          onClick={() => handleRowDoubleClick(row)}
        >
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-semibold text-gray-500 leading-tight">
                {headerLabel}
              </div>
              <div className={`text-[12px] font-bold leading-tight truncate ${rowClass || "text-slate-800"}`}>
                {headerValue}
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRowDoubleClick(row);
              }}
              className="h-7 w-7 rounded-md bg-blue-500 text-white hover:bg-blue-600 shrink-0"
              title="View"
            >
              <FontAwesomeIcon icon={faEye} className="text-[11px]" />
            </button>
          </div>

          <div className="space-y-0">
            {cardDetailCols.map((col) => {
              const formatted = formatCellValue(row?.[col.key], col);
              const alignRight =
                isNumericColumn(col) || col?.classNames?.includes("text-right");

              return (
                <div
                  key={col.key}
                  className="grid grid-cols-[110px_1fr] gap-x-2 py-[2px] text-[11px] leading-tight"
                >
                  <div className="font-semibold text-gray-500">
                    {(col.label || col.key)}
                  </div>
                  <div
                    className={`min-w-0 break-words ${
                      alignRight ? "text-right tabular-nums" : "text-left"
                    }`}
                  >
                    {formatted}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    },
    [cardDetailCols, handleRowDoubleClick, primaryCardCol]
  );

  const renderMobileGroupRow = useCallback(
    (row, idx) => {
      const uniqueId = `${row.key}-${row.value}-${row.level}`;
      const isExpanded = expandedGroups[uniqueId];

      return (
        <button
          key={`group-${uniqueId}-${idx}`}
          type="button"
          className="w-full rounded-lg border bg-gray-50 px-3 py-2 text-left"
          onClick={() => toggleGroup(row)}
        >
          <div className="flex items-center gap-2" style={{ paddingLeft: row.level * 14 }}>
            <FontAwesomeIcon
              icon={isExpanded ? faChevronDown : faChevronRight}
              className="text-[11px] text-gray-500"
            />
            <span className="text-[11px] font-semibold text-gray-600">
              {(baseColumns.find((c) => c.key === row.key)?.label || row.key)}:
            </span>
            <span className="text-[11px] font-bold text-blue-900">{row.value}</span>
            <span className="ml-auto rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
              {row.count}
            </span>
          </div>
        </button>
      );
    },
    [expandedGroups, baseColumns]
  );

  const renderMobileSubtotalCard = useCallback(
    (row, idx) => {
      const subtotalCols = visibleCols.filter((col) => row.aggregates[col.key] !== undefined);

      return (
        <div
          key={`subtotal-${idx}`}
          className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2"
        >
          <div className="text-[11px] font-bold text-yellow-800 leading-tight mb-1">
            Sub Total for {(row.groupLabel)}: {row.groupValue}
          </div>

          <div className="space-y-0">
            {subtotalCols.map((col) => {
              const formatted = formatCellValue(row.aggregates[col.key], col);
              const alignRight =
                isNumericColumn(col) || col?.classNames?.includes("text-right");

              return (
                <div
                  key={col.key}
                  className="grid grid-cols-[110px_1fr] gap-x-2 py-[2px] text-[11px] leading-tight"
                >
                  <div className="font-semibold text-yellow-700">
                    {(col.label || col.key)}
                  </div>
                  <div className={alignRight ? "text-right tabular-nums" : "text-left"}>
                    {formatted}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    },
    [visibleCols]
  );

  const renderMobileGrandTotalCard = useCallback(() => {
    const totalCols = visibleCols.filter((col) => grandTotals[col.key] !== undefined);

    if (!totalCols.length) return null;

    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
        <div className="text-[11px] font-bold text-blue-900 leading-tight mb-1">
          {groupBy.length > 0 ? "Grand Total" : "Total"}
        </div>

        <div className="space-y-0">
          {totalCols.map((col) => {
            const formatted = formatCellValue(grandTotals[col.key], col);
            const alignRight =
              isNumericColumn(col) || col?.classNames?.includes("text-right");

            return (
              <div
                key={col.key}
                className="grid grid-cols-[110px_1fr] gap-x-2 py-[2px] text-[11px] leading-tight"
              >
                <div className="font-semibold text-blue-700">
                  {(col.label || col.key)}
                </div>
                <div className={alignRight ? "text-right tabular-nums" : "text-left"}>
                  {formatted}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }, [visibleCols, grandTotals, groupBy.length]);

  return (
    <>
      {showHeader && (
        <>
          <Header
            activeTopTab="history"
            detailsRoute={backToPath}
            historyRoute="/page/AllTranHistory"
            showActions={false}
          />
          <HeaderSpacer />
        </>
      )}

      <div className="fixed top-[55px] left-0 w-full z-30 bg-white shadow-md dark:bg-gray-800">
        {showHeader && (
          <div className="flex flex-col md:flex-row items-center justify-between px-4 py-2 gap-2 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap justify-center md:justify-start gap-1 lg:gap-2 w-full md:w-auto">
              <button
                className={`flex items-center px-3 py-2 rounded-md text-xs md:text-sm font-bold transition-colors duration-200 group ${
                  location.pathname === "/"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : "text-gray-600 hover:bg-gray-100 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-blue-300"
                }`}
                onClick={() => navigate(backToPath)}
              >
                <FontAwesomeIcon icon={faPen} className="w-4 h-3 mr-2" />
                <span className="group-hover:block">Transaction Details</span>
              </button>
              <button
                className={`flex items-center px-3 py-2 rounded-md text-xs md:text-sm font-bold transition-colors duration-200 group ${
                  location.pathname === "/"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : "text-gray-600 hover:bg-gray-100 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-blue-300"
                }`}
                onClick={() => navigate(backToPath)}
              >
                <FontAwesomeIcon icon={faList} className="w-4 h-4 mr-2" />
                <span className="group-hover:block">Transaction History</span>
              </button>
            </div>
          </div>
        )}

        <style jsx="true">{`
          @keyframes fade-in-down {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fade-in-down {
            animation: fade-in-down 0.2s ease-out forwards;
          }
        `}</style>

     {isMobile ? (
  <div className="p-3 mt-4">
    <div className="flex items-end gap-1.5 mt-4 overflow-x-auto">
      <div className="min-w-0 flex-1">
        <label className="block text-[10px] font-semibold text-gray-600 mb-1">
          Date Range
        </label>
        <div className="flex items-center border border-gray-300 rounded-md px-1.5 py-1 bg-white h-[36px]">
          <select
            className="w-[92px] min-w-[92px] border-none focus:ring-0 text-[10px] bg-transparent pr-1"
            value={dateRangeType}
            onChange={(e) => setDateRangeType(e.target.value)}
          >
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Custom Range</option>
          </select>

          <div className="flex items-center border-l border-gray-300 pl-1.5 min-w-0 flex-1">
            <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400 mr-1.5 text-[10px]" />
            <input
              type="text"
              value={formatDateRange(dates[0], dates[1])}
              onClick={() => {
                if (dateRangeType === "Custom Range") setModalIsOpen(true);
              }}
              className="w-full min-w-0 border-none focus:ring-0 text-[10px] bg-transparent text-gray-700 whitespace-nowrap"
              placeholder="Select"
              readOnly
              title={formatDateRange(dates[0], dates[1])}
            />
          </div>
        </div>
      </div>

      <div className="w-[100px] shrink-0">
        <label className="block text-[10px] font-semibold text-gray-600 mb-1">
          Status
        </label>
        <div className="flex items-center border border-gray-300 rounded-md px-1.5 py-1 bg-white h-[36px]">
          <FontAwesomeIcon icon={faFilter} className="text-gray-400 mr-1.5 text-[10px]" />
          <select
            className="w-full min-w-0 border-none focus:ring-0 text-[10px] bg-transparent"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {statusOptions.map((opt) => (
              <option key={String(opt.value)} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-end gap-1 shrink-0">
        <button
          className="flex items-center justify-center bg-blue-600 text-white h-[36px] w-[36px] rounded-md text-[10px] font-semibold hover:bg-blue-700 shadow-md"
          onClick={handleApplyFilter}
          disabled={loading || exporting}
          title="Filter"
          aria-label="Filter"
        >
          <FontAwesomeIcon icon={faFilter} className="text-[10px]" />
        </button>

        <button
          className="flex items-center justify-center bg-green-600 text-white h-[36px] w-[36px] rounded-md text-[10px] font-semibold hover:bg-green-700 shadow-md"
          onClick={handleExportExcel_All}
          disabled={loading || exporting || !filteredData.length}
          title="Export"
          aria-label="Export"
        >
          <FontAwesomeIcon icon={faDownload} className="text-[10px]" />
        </button>
      </div>
    </div>
  </div>
) : (
          <div className="flex flex-col md:flex-row flex-wrap items-end gap-2 overflow-x-auto p-6 mt-8">
            <div className="flex-shrink-0 sm:min-w-[200px]">
              <label className="block text-sm font-semibold text-gray-600 mb-1">Date Range:</label>
              <div className="flex items-center border border-gray-300 rounded-md px-2 py-1 bg-white">
                <select
                  className="border-none focus:ring-0 text-sm bg-transparent pr-2"
                  value={dateRangeType}
                  onChange={(e) => setDateRangeType(e.target.value)}
                >
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                  <option>Custom Range</option>
                </select>

                <div className="flex items-center border-l border-gray-300 pl-2 min-w-[200px]">
                  <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400 mr-2 flex-shrink-0" />
                  <input
                    type="text"
                    value={formatDateRange(dates[0], dates[1])}
                    onClick={() => {
                      if (dateRangeType === "Custom Range") setModalIsOpen(true);
                    }}
                    className="w-full min-w-0 h-[25px] border-none focus:ring-0 text-sm bg-transparent text-gray-700 tabular-nums whitespace-nowrap pr-2"
                    placeholder="Select date range"
                    readOnly
                    title={formatDateRange(dates[0], dates[1])}
                  />
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 min-w-[200px]">
              <label className="block text-sm font-semibold text-gray-600 mb-1">Status:</label>
              <div className="flex items-center border border-gray-300 rounded-md px-2 py-1 bg-white">
                <FontAwesomeIcon icon={faFilter} className="text-gray-400 mr-2" />
                <select
                  className="w-full h-[25px] border-none focus:ring-0 text-sm"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {statusOptions.map((opt) => (
                    <option key={String(opt.value)} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex-shrink-0 w-full md:w-auto mt-auto">
              <button
                className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-700 shadow-md w-full"
                onClick={handleApplyFilter}
                disabled={loading || exporting}
              >
                <FontAwesomeIcon icon={faFilter} className="mr-2" />
                {loading ? "Loading..." : "Filter"}
              </button>
            </div>

            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 w-full md:w-auto ml-auto">
              <button
                className="flex items-center justify-center bg-green-600 text-white px-6 py-2 rounded-md text-sm font-semibold hover:bg-green-700 shadow-md w-full"
                onClick={handleExportExcel_All}
                disabled={loading || exporting || !filteredData.length}
              >
                <FontAwesomeIcon icon={faDownload} className="mr-2" />
                <span className="truncate">{exporting ? "Exporting..." : "Export"}</span>
              </button>
              <button
                className="flex items-center justify-center bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-semibold hover:bg-blue-700 shadow-md w-full"
                onClick={handleResetUI}
                disabled={loading || exporting}
              >
                <FontAwesomeIcon icon={faRedo} className="mr-2" />
                <span className="truncate">Reset</span>
              </button>
            </div>
          </div>
        )}

      

<div className="px-4 overflow-x-auto">
  <div className="flex items-center justify-between gap-2 min-w-max">
    <div className={`flex gap-1 whitespace-nowrap`}>
      {Object.keys(tabData).map((tabKey) => {
        const isTabActive = activeTab === tabKey;
        const tabLabel = tabKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

        return (
          <button
            key={tabKey}
            title={tabLabel}
            aria-label={tabLabel}
            className={`py-2 ${isMobile ? "px-1.5 min-w-[60px]" : "px-10"} text-sm text-center border rounded-t-lg transition-all duration-200 ${
              isTabActive
                ? "bg-blue-100 text-blue-700 font-semibold shadow-lg shadow-blue-300 relative before:absolute before:inset-x-0 before:bottom-0 before:h-[3px] before:bg-blue-700 before:rounded-t-md"
                : "bg-white shadow-lg shadow-blue-50 text-gray-600 font-semibold hover:text-blue-700 hover:bg-blue-50"
            }`}
            onClick={() => {
              setActiveTab(tabKey);
              setSortConfig({ key: null, direction: "asc", tabKey });
              setShowColumnChooser(false);
              setShowExportMenu(false);
            }}
          >
            <span
              className={`block w-full text-center ${
                isMobile ? "text-[12px] leading-none" : "text-sm"
              } truncate`}
            >
              {tabLabel}
            </span>
          </button>
        );
      })}
    </div>

        <div className="flex items-center shrink-0 min-w-[28px] justify-end">
          {refreshing && (
            <svg
              className="animate-spin h-4 w-4 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              title="Refreshing..."
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          </div>
        </div>
      </div>

        <div className="bg-white shadow-md rounded-md overflow-hidden p-4">
          {activeTab && visibleCols.length > 0 && filteredData.length > 0 && (
            <div
              className="p-2 bg-gray-50 border flex flex-wrap gap-2 items-center min-h-[45px] shrink-0 mb-3"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleColDrop(e, null, true)}
            >
              <div className="flex-1 flex flex-wrap gap-2 items-center">
                <div className="text-xs font-bold text-gray-500 flex items-center">
                  <FontAwesomeIcon icon={faLayerGroup} className="mr-2" />
                  Group By:
                </div>

                {groupBy.length === 0 && (
                  <div className="text-xs text-gray-400 italic border border-dashed border-gray-300 rounded px-3 py-1">
                    Drag Header Here...
                  </div>
                )}

                {groupBy.map((gKey) => (
                  <div
                    key={gKey}
                    className="flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded border border-blue-200"
                  >
                    <span>{baseColumns.find((c) => c.key === gKey)?.label}</span>
                    <button
                      onClick={() => handleRemoveGroupedColumn(gKey)}
                      className="ml-2 text-blue-500 hover:text-red-500"
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {isMobile && (
                  <div className="inline-flex overflow-hidden rounded-md border border-gray-300">
                    <button
                      type="button"
                      onClick={() => setUseCardView(false)}
                      className={`h-8 w-8 ${
                        !useCardView ? "bg-blue-600 text-white" : "bg-white text-gray-600"
                      }`}
                      title="Table View"
                    >
                      <FontAwesomeIcon icon={faTable} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseCardView(true)}
                      className={`h-8 w-8 ${
                        useCardView ? "bg-blue-600 text-white" : "bg-white text-gray-600"
                      }`}
                      title="Card View"
                    >
                      <FontAwesomeIcon icon={faThLarge} />
                    </button>
                  </div>
                )}

                {groupBy.length > 0 && (
                  <>
                    <button
                      onClick={() => toggleAllGroups(true)}
                      className="text-xs bg-white border px-2 py-1 rounded hover:bg-gray-100"
                      title="Expand All"
                    >
                      <FontAwesomeIcon icon={faExpandArrowsAlt} /> Expand
                    </button>

                    <button
                      onClick={() => toggleAllGroups(false)}
                      className="text-xs bg-white border px-2 py-1 rounded hover:bg-gray-100"
                      title="Collapse All"
                    >
                      <FontAwesomeIcon icon={faCompressArrowsAlt} /> Collapse
                    </button>

                    <button
                      onClick={() => {
                        setGroupByByTab((prev) => ({ ...prev, [activeTab]: [] }));
                        setExpandedGroupsByTab((prev) => ({ ...prev, [activeTab]: {} }));
                      }}
                      className="text-xs bg-white border px-2 py-1 rounded hover:bg-gray-100"
                      title="Remove All Groups"
                    >
                      <FontAwesomeIcon icon={faTimes} className="text-red-600 mr-1" />
                      Remove
                    </button>
                  </>
                )}

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => filteredData.length && setShowExportMenu((prev) => !prev)}
                    disabled={!filteredData.length}
                    className="text-xs bg-white border px-2 py-1 rounded hover:bg-gray-100 disabled:opacity-50"
                    title="Export options"
                  >
                    <FontAwesomeIcon icon={faFileExport} className="text-blue-600 mr-1" />
                    Export
                  </button>

                  {showExportMenu && (
                    <div
                      className="absolute right-0 mt-1 bg-white border rounded shadow-lg p-2 z-50 min-w-[180px]"
                      onMouseLeave={() => setShowExportMenu(false)}
                    >
                      <div className="text-[11px] font-semibold mb-1 border-b pb-1">Export Options</div>

                      <button
                        type="button"
                        onClick={async () => {
                          setShowExportMenu(false);
                          await handleExportExcel();
                        }}
                        className="w-full text-left text-[11px] px-2 py-1 rounded hover:bg-gray-100 flex items-center gap-2"
                      >
                        <FontAwesomeIcon icon={faFileExcel} className="text-green-600" />
                        Excel
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          setShowExportMenu(false);
                          await handleExportCsv();
                        }}
                        className="w-full text-left text-[11px] px-2 py-1 rounded hover:bg-gray-100 flex items-center gap-2"
                      >
                        <FontAwesomeIcon icon={faFileCsv} className="text-emerald-600" />
                        CSV
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          setShowExportMenu(false);
                          await handleExportPdf();
                        }}
                        className="w-full text-left text-[11px] px-2 py-1 rounded hover:bg-gray-100 flex items-center gap-2"
                      >
                        <FontAwesomeIcon icon={faFilePdf} className="text-red-600" />
                        PDF
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          setShowExportMenu(false);
                          await handleExportImage();
                        }}
                        className="w-full text-left text-[11px] px-2 py-1 rounded hover:bg-gray-100 flex items-center gap-2"
                      >
                        <FontAwesomeIcon icon={faFileImage} className="text-blue-600" />
                        Image
                      </button>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowColumnChooser((prev) => !prev)}
                    className="text-xs bg-white border px-2 py-1 rounded hover:bg-gray-100"
                  >
                    <FontAwesomeIcon icon={faColumns} className="text-green-600" /> Columns
                  </button>

                  {showColumnChooser && (
                    <div
                      className="absolute right-0 mt-1 bg-white border rounded shadow-lg p-2 max-h-64 overflow-auto z-50 min-w-[220px]"
                      onMouseLeave={() => setShowColumnChooser(false)}
                    >
                      <div className="flex items-center justify-between text-[11px] font-semibold mb-1 border-b pb-1">
                        <span>Show / Hide Columns</span>
                        <label className="flex items-center gap-1 text-[11px]">
                          <input
                            type="checkbox"
                            className="h-3 w-3"
                            checked={allChecked}
                            onChange={() => {
                              setUserHiddenColsByTab((prev) => ({
                                ...prev,
                                [activeTab]: allChecked ? allChooserKeys : [],
                              }));
                            }}
                          />
                          <span>Select All</span>
                        </label>
                      </div>

                      {orderedCols
                        .filter((col) => !col.hidden && !groupBy.includes(col.key))
                        .map((col) => (
                          <label key={col.key} className="flex items-center text-[11px] gap-2 mb-1">
                            <input
                              type="checkbox"
                              className="h-3 w-3"
                              checked={!userHiddenCols.includes(col.key)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setUserHiddenColsByTab((prev) => {
                                  const current = prev[activeTab] || [];
                                  return {
                                    ...prev,
                                    [activeTab]: checked
                                      ? current.filter((k) => k !== col.key)
                                      : [...current, col.key],
                                  };
                                });
                              }}
                            />
                            <span className="truncate">{col.label}</span>
                          </label>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div
            ref={tableScrollRef}
            className="overflow-x-auto bg-white rounded-md max-h-[55vh] relative"
          >
            {loading ? (
              <div className="text-center py-6 text-gray-500">Loading data and configurations...</div>
            ) : !activeTab || visibleCols.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                Select a date range and click ‘Filter’ to load history.
              </div>
            ) : isMobile && useCardView ? (
              <div className="space-y-2">
                {displayRows.length > 0 ? (
                  <>
                    {displayRows.map((row, idx) => {
                      if (groupBy.length > 0 && row.isGroup) {
                        return renderMobileGroupRow(row, idx);
                      }

                      if (groupBy.length > 0 && row.isSubtotal) {
                        return renderMobileSubtotalCard(row, idx);
                      }

                      return renderMobileCard(row, idx);
                    })}

                    {filteredData.length > 0 && renderMobileGrandTotalCard()}
                  </>
                ) : (
                  <div className="rounded-md border py-4 text-center text-gray-500">
                    No records found matching the filter criteria.
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* {refreshing && (
                  <div className="mb-2 flex items-center gap-2 text-xs text-blue-600 font-medium">
                    <svg 
                      className="animate-spin h-4 w-4 text-blue-600" 
                      xmlns="http://www.w3.org/2000/svg" 
                      fill="none" 
                      viewBox="0 0 24 24"
                    >
                      <circle 
                        className="opacity-25" 
                        cx="12" 
                        cy="12" 
                        r="10" 
                        stroke="currentColor" 
                        strokeWidth="4"
                      ></circle>
                      <path 
                        className="opacity-75" 
                        fill="currentColor" 
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </div>
                )} */}

                {isMobile && visibleCols.length > MOBILE_MAX_COLUMNS && (
                  <div className="mb-2 text-[11px] text-gray-500">
                    Showing first {MOBILE_MAX_COLUMNS} columns on mobile table view.
                  </div>
                )}

               <table
                    className="w-full text-[12px] text-center border-collapse border border-gray-300 table-auto min-w-[1200px]"
                  >
                  <thead className="text-[12px] font-medium sticky top-0 z-30">
                    <tr className="bg-blue-200 text-blue-900">
                      <th
                        className="sticky left-0 top-0 z-50 px-2 py-2 border-r border-blue-300 bg-blue-200 text-blue-900 w-[64px]"
                        style={{ minWidth: ACTION_COL_WIDTH, maxWidth: ACTION_COL_WIDTH }}
                      >
                        View
                      </th>

                      {renderVisibleCols.map((col, i) => {
                        const meta = stickyPlan[i];
                        const style = meta.sticky
                          ? {
                              left: meta.left,
                              width: meta.width || 140,
                              minWidth: meta.width || 140,
                              maxWidth: 400,
                            }
                          : {
                              width: meta.width || undefined,
                              minWidth: meta.width || undefined,
                              maxWidth: 400,
                            };

                        return (
                          <th
                            key={col.key}
                            draggable={!groupBy.includes(col.key)}
                            onDragStart={(e) => handleColDragStart(e, col.key)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleColDrop(e, col.key)}
                            onClick={() => col.sortable !== false && handleSort(col.key)}
                            className={`px-3 py-2 border whitespace-nowrap select-none relative ${
                              col.sortable !== false ? "cursor-pointer" : ""
                            } ${meta.sticky ? "sticky z-40 bg-blue-200" : ""} ${numberAlignClass(col)}`}
                            style={style}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="truncate">{col.label}</span>
                              {col.sortable !== false &&
                              sortConfig.key === col.key &&
                              sortConfig.tabKey === activeTab ? (
                                <FontAwesomeIcon
                                  icon={sortConfig.direction === "asc" ? faArrowUp : faArrowDown}
                                  className="text-xs"
                                />
                              ) : null}
                            </div>

                            <div
                              className="absolute top-0 right-0 h-full w-1 cursor-col-resize select-none"
                              onMouseDown={(e) => startResizing(e, col.key)}
                            />
                          </th>
                        );
                      })}
                    </tr>

                    <tr className="bg-gray-100 sticky top-[36px] z-20">
                      <td className="sticky left-0 z-40 px-2 py-1 border bg-gray-100" />
                      {renderVisibleCols.map((col, i) => {
                        const meta = stickyPlan[i];
                        const style = meta.sticky
                          ? {
                              left: meta.left,
                              width: meta.width || undefined,
                              minWidth: meta.width || undefined,
                            }
                          : {
                              width: meta.width || undefined,
                              minWidth: meta.width || undefined,
                            };

                        return (
                          <td
                            key={col.key}
                            className={`px-2 py-1 border whitespace-nowrap ${
                              meta.sticky ? "sticky z-30 bg-gray-100" : ""
                            }`}
                            style={style}
                          >
                            <input
                              type="text"
                              value={searchFields[col.key] || ""}
                              onChange={(e) => handleSearchChange(e, col.key)}
                              placeholder="Filter"
                              className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 text-[10px]"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200 text-[11px]">
                    {displayRows.length > 0 ? (
                      <>
                        {displayRows.map((row, idx) => {
                          if (groupBy.length > 0 && row.isGroup) {
                            const uniqueId = `${row.key}-${row.value}-${row.level}`;
                            const isExpanded = expandedGroups[uniqueId];
                            return (
                              <tr
                                key={`g-${uniqueId}`}
                                className="bg-gray-100 hover:bg-gray-200 cursor-pointer"
                                onClick={() => toggleGroup(row)}
                              >
                                <td
                                  colSpan={renderVisibleCols.length + 1}
                                  className="px-2 py-2 font-semibold border-b border-gray-300 text-blue-900 whitespace-nowrap"
                                >
                                  <div className="flex items-center" style={{ paddingLeft: row.level * 20 }}>
                                    <FontAwesomeIcon
                                      icon={isExpanded ? faChevronDown : faChevronRight}
                                      className="w-3 h-3 mr-2 text-gray-500"
                                    />
                                    <span className="mr-2 text-gray-600">
                                      {baseColumns.find((c) => c.key === row.key)?.label}:
                                    </span>
                                    <span className="mr-2 font-bold">{row.value}</span>
                                    <span className="bg-blue-200 text-blue-800 text-[9px] px-1.5 rounded-full">
                                      {row.count}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          if (groupBy.length > 0 && row.isSubtotal) {
                            return (
                              <tr
                                key={`sub-${row.groupValue}-${idx}`}
                                className="bg-yellow-50 font-bold border-b border-gray-300"
                              >
                                <td className="sticky left-0 bg-yellow-50 border-r border-gray-300 z-10" />
                                {renderVisibleCols.map((col, i) => {
                                  const meta = stickyPlan[i];
                                  const val = row.aggregates[col.key];
                                  const style = meta.sticky
                                    ? {
                                        left: meta.left,
                                        width: meta.width || undefined,
                                        minWidth: meta.width || undefined,
                                      }
                                    : {
                                        width: meta.width || undefined,
                                        minWidth: meta.width || undefined,
                                      };

                                  return (
                                    <td
                                      key={col.key}
                                      className={`${commonCellClass} ${numberAlignClass(col)} ${
                                        meta.sticky ? "sticky z-10 bg-yellow-50" : ""
                                      }`}
                                      style={style}
                                    >
                                      {i === 0 && (
                                        <div
                                          className="float-left text-left font-bold"
                                          style={{ paddingLeft: row.level * 20 }}
                                        >
                                          <span className="text-gray-600">Sub Total for {row.groupLabel}:</span>
                                          <span className="ml-1 text-blue-900">{row.groupValue}</span>
                                        </div>
                                      )}
                                      {val !== undefined ? formatCellValue(val, col) : ""}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          }

                          const rowClass = getRowClassByStatus(row);
                          return (
                            <tr
                              key={idx}
                              className={`hover:bg-blue-50 transition cursor-pointer ${rowClass} ${
                                idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                              }`}
                              onDoubleClick={() => handleRowDoubleClick(row)}
                            >
                              <td className="sticky left-0 z-10 px-2 py-1 border-r border-gray-200 bg-inherit text-center w-[64px] min-w-[64px]">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRowDoubleClick(row);
                                  }}
                                  className="px-2 py-0.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                                  title="View"
                                >
                                  <FontAwesomeIcon icon={faEye} className="w-4 h-3" />
                                </button>
                              </td>

                              {renderVisibleCols.map((col, i) => {
                                const meta = stickyPlan[i];
                                const alignRight =
                                  isNumericColumn(col) || col.classNames?.includes("text-right");
                                const style = meta.sticky
                                  ? {
                                      left: meta.left,
                                      width: meta.width || undefined,
                                      minWidth: meta.width || undefined,
                                      maxWidth: 400,
                                    }
                                  : {
                                      width: meta.width || undefined,
                                      minWidth: meta.width || undefined,
                                      maxWidth: 400,
                                    };

                                return (
                                  <td
                                    key={col.key}
                                    className={`px-2 py-1 border whitespace-nowrap ${
                                      alignRight ? "text-right" : col.classNames || "text-left"
                                    } ${meta.sticky ? "sticky z-10 bg-inherit" : ""}`}
                                    title={String(row?.[col.key] ?? "")}
                                    style={style}
                                  >
                                   <div
                                    style={{
                                      maxWidth: isMobile ? "180px" : "420px",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {formatCellValue(row?.[col.key], col)}
                                  </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </>
                    ) : (
                      <tr>
                        <td colSpan={renderVisibleCols.length + 1} className="text-center text-gray-500 py-4 border">
                          No records found matching the filter criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>

                  {filteredData.length > 0 && (
                    <tfoot className="sticky bottom-0 z-30 shadow-[0_-4px_6px_rgba(0,0,0,0.1)] text-[11px]">
                      <tr className="bg-gray-100 font-bold border-t border-blue-400">
                        <td className="sticky left-0 bg-gray-100 border-r border-gray-300 z-40" />
                        {renderVisibleCols.map((col, i) => {
                          const meta = stickyPlan[i];
                          const val = grandTotals[col.key];
                          const style = meta.sticky
                            ? {
                                left: meta.left,
                                width: meta.width || undefined,
                                minWidth: meta.width || undefined,
                              }
                            : {
                                width: meta.width || undefined,
                                minWidth: meta.width || undefined,
                              };

                          return (
                            <td
                              key={col.key}
                              className={`px-2 py-1 border ${numberAlignClass(col)} ${
                                meta.sticky ? "sticky z-30 bg-gray-100" : ""
                              }`}
                              style={style}
                            >
                              {i === 0 && (
                                <span className="text-gray-700 uppercase tracking-wide">
                                  {groupBy.length > 0 ? "Grand Total" : "Total"}
                                </span>
                              )}
                              {val !== undefined ? formatCellValue(val, col) : ""}
                            </td>
                          );
                        })}
                      </tr>
                    </tfoot>
                  )}
                </table>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hidden export table */}
      {activeTab && filteredData.length > 0 && (
        <div ref={exportContainerRef} style={{ position: "absolute", left: "-99999px", top: 0 }}>
          <table className="border-collapse text-[8px]">
            <thead>
              <tr>
                {visibleCols.map((col) => (
                  <th
                    key={col.key}
                    className="border px-2 py-1 text-left bg-gray-200 align-top"
                    style={{ maxWidth: 150, whiteSpace: "normal", wordBreak: "break-word" }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {(groupBy.length === 0 ? filteredData : fullRenderRows).map((row, idx) => {
                if (groupBy.length > 0 && row.isGroup) {
                  return (
                    <tr key={`exp-g-${row.key}-${row.value}-${row.level}-${idx}`}>
                      <td
                        colSpan={visibleCols.length}
                        className="border px-2 py-1 font-semibold bg-gray-100"
                        style={{ whiteSpace: "normal", wordBreak: "break-word" }}
                      >
                        {baseColumns.find((c) => c.key === row.key)?.label}: {row.value} ({row.count})
                      </td>
                    </tr>
                  );
                }

                if (groupBy.length > 0 && row.isSubtotal) {
                  return (
                    <tr key={`exp-sub-${row.groupValue}-${idx}`}>
                      {visibleCols.map((col, i) => {
                        const val = row.aggregates[col.key];
                        return (
                          <td
                            key={col.key}
                            className="border px-2 py-1 font-semibold bg-yellow-50 align-top"
                            style={{ maxWidth: 150, whiteSpace: "normal", wordBreak: "break-word" }}
                          >
                            {i === 0 && (
                              <>
                                Sub Total for {row.groupLabel}: {row.groupValue}{" "}
                              </>
                            )}
                            {val !== undefined ? formatCellValue(val, col) : ""}
                          </td>
                        );
                      })}
                    </tr>
                  );
                }

                return (
                  <tr key={`exp-row-${idx}`}>
                    {visibleCols.map((col) => (
                      <td
                        key={col.key}
                        className="border px-2 py-1 align-top"
                        style={{ maxWidth: 150, whiteSpace: "normal", wordBreak: "break-word" }}
                      >
                        {formatCellValue(row[col.key], col)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>

            <tfoot>
              <tr>
                {visibleCols.map((col, i) => (
                  <td
                    key={col.key}
                    className="border px-2 py-1 font-bold bg-gray-100 align-top"
                    style={{ maxWidth: 150, whiteSpace: "normal", wordBreak: "break-word" }}
                  >
                    {i === 0 && (groupBy.length > 0 ? "Grand Total" : "Total")}
                    {grandTotals[col.key] !== undefined ? ` ${formatCellValue(grandTotals[col.key], col)}` : ""}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Date Picker Modal */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        closeTimeoutMS={150}
        className="w-[min(100vw,500px)] sm:w-[min(100vw,500px)] h-[90vh] sm:h-auto sm:max-h-[80vh] mx-auto sm:mt-4 rounded-none sm:rounded-2xl shadow-2xl bg-white overflow-hidden outline-none"
        overlayClassName="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50"
      >
        <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3">
          <h2 className="text-base font-semibold">Select Custom Date Range</h2>
          <p className="text-xs/relaxed text-white/80">
            Choose a range or use quick presets. Press{" "}
            <kbd className="px-1.5 py-0.5 bg-white/20 rounded">Esc</kbd> to cancel.
          </p>
          <button
            onClick={() => setModalIsOpen(false)}
            className="absolute right-3 top-3 grid place-items-center w-8 h-8 rounded-full hover:bg-white/15 focus:ring-2 focus:ring-white/60"
            aria-label="Close"
            title="Close"
          >
            <svg viewBox="0 0 20 20" className="w-4 h-4">
              <path
                fill="currentColor"
                d="M11.41 10l4.3-4.29a1 1 0 10-1.42-1.42L10 8.59 5.71 4.29a1 1 0 10-1.42 1.42L8.59 10l-4.3 4.29a1 1 0 101.42 1.42L10 11.41l4.29 4.3a1 1 0 001.42-1.42z"
              />
            </svg>
          </button>
        </div>

        <div className="p-2 sm:p-2 grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-2 h-[calc(90vh-120px)] sm:h-auto overflow-auto">
          <div className="space-y-1 mt-2">
            <div className="grid grid-cols-2 sm:grid-cols-1 gap-1">
              <button
                className="btn-outline text-sm hover:bg-blue-100"
                onClick={() => {
                  const t = new Date();
                  setDates([t, t]);
                }}
              >
                Today
              </button>
              <button
                className="btn-outline text-sm hover:bg-blue-100"
                onClick={() => {
                  const t = new Date();
                  const y = new Date(t);
                  y.setDate(t.getDate() - 1);
                  setDates([y, y]);
                }}
              >
                Yesterday
              </button>
              <button
                className="btn-outline text-sm hover:bg-blue-100"
                onClick={() => {
                  const t = new Date();
                  setDates([subDays(t, 6), t]);
                }}
              >
                Last 7 Days
              </button>
              <button
                className="btn-outline text-sm hover:bg-blue-100"
                onClick={() => {
                  const t = new Date();
                  setDates([subDays(t, 29), t]);
                }}
              >
                Last 30 Days
              </button>
              <button
                className="btn-outline text-sm hover:bg-blue-100"
                onClick={() => {
                  const t = new Date();
                  setDates([startOfMonth(t), endOfMonth(t)]);
                }}
              >
                This Month
              </button>
              <button
                className="btn-outline text-sm hover:bg-blue-100"
                onClick={() => {
                  const t = new Date();
                  const last = addMonths(t, -1);
                  setDates([startOfMonth(last), endOfMonth(last)]);
                }}
              >
                Last Month
              </button>
              <button
                className="btn-outline text-sm hover:bg-blue-100"
                onClick={() => {
                  const t = new Date();
                  setDates([startOfYear(t), endOfYear(t)]);
                }}
              >
                YTD
              </button>
              <button
                className="btn-ghost text-sm hover:bg-blue-100"
                onClick={() => setDates([null, null])}
                title="Clear selection"
              >
                Clear
              </button>
            </div>

            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-600">
              <div className="font-semibold text-slate-700 mb-1">Selected Range</div>
              {dates?.[0] && dates?.[1] ? (
                <div>
                  {format(dates[0], "MMM dd, yyyy")} — {format(dates[1], "MMM dd, yyyy")}
                </div>
              ) : (
                <div className="italic text-slate-400">No range selected</div>
              )}
              {granularity !== "day" && (
                <div className="mt-1 text-[11px] text-slate-500">
                  Mode: <span className="uppercase">{granularity}</span> (one tap selects entire{" "}
                  {granularity})
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-2 sm:p-2">
            <div className="flex items-center gap-1 mb-2">
              <span className="text-xs text-slate-500 mr-1">Select by:</span>
              <div className="inline-flex rounded-lg border border-slate-300 overflow-hidden">
                {["day", "month", "year"].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGranularity(g)}
                    className={`px-3 py-1.5 text-xs capitalize ${
                      granularity === g ? "bg-blue-600 text-white" : "bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="reactdp-one">
              <DatePicker
                inline
                fixedHeight
                monthsShown={1}
                shouldCloseOnSelect={false}
                selectsRange={granularity === "day"}
                startDate={dates[0]}
                endDate={dates[1]}
                onChange={(update) => {
                  if (granularity === "day") setDates(update);
                }}
                onSelect={(d) => {
                  if (!d) return;
                  if (granularity === "month") setDates([startOfMonth(d), endOfMonth(d)]);
                  else if (granularity === "year") setDates([startOfYear(d), endOfYear(d)]);
                }}
                openToDate={dates?.[1] ?? dates?.[0] ?? new Date()}
                renderCustomHeader={({
                  date,
                  decreaseMonth,
                  increaseMonth,
                  prevMonthButtonDisabled,
                  nextMonthButtonDisabled,
                  changeYear,
                  changeMonth,
                }) => {
                  const months = [
                    "January",
                    "February",
                    "March",
                    "April",
                    "May",
                    "June",
                    "July",
                    "August",
                    "September",
                    "October",
                    "November",
                    "December",
                  ];
                  const currentYear = new Date().getFullYear();
                  const years = Array.from({ length: 16 }, (_, i) => currentYear + 1 - i);

                  return (
                    <div className="flex items-center justify-between gap-2 px-2 py-1">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={decreaseMonth}
                          disabled={prevMonthButtonDisabled}
                          className="px-2 py-1 rounded-md hover:bg-slate-100 disabled:opacity-40"
                          title="Previous month"
                          type="button"
                        >
                          ‹
                        </button>
                        <button
                          onClick={increaseMonth}
                          disabled={nextMonthButtonDisabled}
                          className="px-2 py-1 rounded-md hover:bg-slate-100 disabled:opacity-40"
                          title="Next month"
                          type="button"
                        >
                          ›
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          className="text-sm border border-slate-300 rounded-md px-2 py-1 bg-white"
                          value={date.getMonth()}
                          onChange={(e) => changeMonth(Number(e.target.value))}
                        >
                          {months.map((m, idx) => (
                            <option key={m} value={idx}>
                              {m}
                            </option>
                          ))}
                        </select>

                        <select
                          className="text-sm border border-slate-300 rounded-md px-2 py-1 bg-white"
                          value={date.getFullYear()}
                          onChange={(e) => changeYear(Number(e.target.value))}
                        >
                          {years.map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                }}
              />
            </div>
          </div>

          <style jsx="true">{`
            .reactdp-one .react-datepicker__header {
              padding-top: 6px;
            }
          `}</style>
        </div>

        <div className="sticky bottom-0 flex items-center justify-between gap-2 px-4 sm:px-5 py-3 bg-white/95 border-t border-slate-200">
          <div className="text-[11px] text-slate-500">
            Tip: Press <kbd className="px-1 py-0.5 bg-slate-100 rounded">Enter</kbd> to apply.
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setModalIsOpen(false)}
              className="px-4 py-2 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (dates?.[0] && dates?.[1]) setModalIsOpen(false);
              }}
              disabled={!dates?.[0] || !dates?.[1]}
              className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium enabled:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply
            </button>
          </div>
        </div>

        <style jsx="true">{`
          .btn-outline {
            @apply text-slate-700 border border-slate-300 rounded-md px-1 py-1 text-xs sm:text-xs hover:bg-slate-100 text-left;
            min-height: 30px;
          }
          .btn-ghost {
            @apply text-slate-600 rounded-md px-1 py-1 text-xs sm:text-xs hover:bg-slate-100 text-left;
            min-height: 30px;
          }
          .reactdp-row .react-datepicker {
            display: flex !important;
            flex-wrap: nowrap;
            gap: 8px;
          }
          .reactdp-row .react-datepicker__month-container {
            flex: 0 0 auto;
            width: 290px;
          }
          .reactdp-row .react-datepicker__header {
            padding-top: 6px;
          }
          @media (min-width: 640px) {
            .reactdp-row .react-datepicker__month-container {
              width: 300px;
            }
          }
        `}</style>
      </Modal>

      {(loading || exporting) && <LoadingSpinner />}
    </>
  );
};

export default AllTranHistory;