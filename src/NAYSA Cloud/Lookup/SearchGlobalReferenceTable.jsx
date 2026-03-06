// SearchGlobalReferenceTable.jsx
import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSort,
  faSortUp,
  faSortDown,
  faChevronRight,
  faChevronDown,
  faTimes,
  faLayerGroup,
  faCompressArrowsAlt,
  faExpandArrowsAlt,
  faFileExcel,
  faColumns,
  faFilePdf,
  faFileImage,
  faFileExport,
  faFileCsv,
} from "@fortawesome/free-solid-svg-icons";

import { reftables } from "@/NAYSA Cloud/Global/reftable";
import { exportGenericQueryExcel } from "@/NAYSA Cloud/Global/report";
import { useAuth } from "@/NAYSA Cloud/Authentication/AuthContext.jsx";
import { formatNumber, parseFormattedNumber } from "@/NAYSA Cloud/Global/behavior";
import { useReturnToDate } from "@/NAYSA Cloud/Global/dates";
import Swal from "sweetalert2";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const TableLoader = () => <div className="global-ref-norecords-ui">Loading...</div>;

const SearchGlobalReferenceTable = forwardRef(
  (
    {
      columns = [],
      data = [],
      itemsPerPage = 50,
      showFilters = true,
      docType,
      onRowDoubleClick,
      className = "",
      initialState,
      onStateChange,
      totalExemptions = ["rate", "percent", "ratio", "id", "code"],
      isLoading = false,
    },
    ref,
  ) => {
    const scrollRef = useRef(null);
    const exportContainerRef = useRef(null);

    // ✅ Mobile detection + view toggle
    const [isMobile, setIsMobile] = useState(false);
    const [forceTableView, setForceTableView] = useState(false);
    const useCardView = isMobile && !forceTableView;

    useEffect(() => {
      const mq = window.matchMedia("(max-width: 768px)");
      const apply = () => setIsMobile(mq.matches);
      apply();
      mq.addEventListener?.("change", apply);
      return () => mq.removeEventListener?.("change", apply);
    }, []);

    const [filters, setFilters] = useState(() => initialState?.filters || {});
    const [globalSearch, setGlobalSearch] = useState(() => initialState?.globalSearch || "");

    const [sortConfig, setSortConfig] = useState(
      () => initialState?.sortConfig || { key: null, direction: null },
    );
    const [currentPage, setCurrentPage] = useState(
      () => Number(initialState?.currentPage) || 1,
    );

    // ✅ Rows per page (supports: 10/20/50/100) — (All not shown in dropdown)
    const [rowsPerPage, setRowsPerPage] = useState(() => {
      const init = Number(initialState?.itemsPerPage ?? itemsPerPage ?? 50);
      return Number.isFinite(init) ? init : 50;
    });

    const [columnOrder, setColumnOrder] = useState([]);
    const [groupBy, setGroupBy] = useState(() => initialState?.groupBy || []);
    const [expandedGroups, setExpandedGroups] = useState({});
    const [draggedCol, setDraggedCol] = useState(null);

    const [colWidths, setColWidths] = useState({});
    const resizingRef = useRef(null);

    const [userHiddenCols, setUserHiddenCols] = useState(
      () => initialState?.userHiddenCols || [],
    );

    const [showColumnChooser, setShowColumnChooser] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);

    const { companyInfo, currentUserRow } = useAuth();

    // ✅ keep columnOrder in sync with columns (dynamic cols like __actions)
    useEffect(() => {
      const keys = (columns || []).map((c) => c.key).filter(Boolean);
      if (!keys.length) return;

      setColumnOrder((prev) => {
        const prevArr = Array.isArray(prev) ? prev : [];
        const prevSet = new Set(prevArr);

        const kept = prevArr.filter((k) => keys.includes(k));
        const added = keys.filter((k) => !prevSet.has(k));

        if (kept.length === prevArr.length && added.length === 0) return prevArr;
        return [...kept, ...added];
      });
    }, [columns]);

    // notify parent
    useEffect(() => {
      onStateChange?.({
        filters,
        sortConfig,
        currentPage,
        groupBy,
        userHiddenCols,
        itemsPerPage: rowsPerPage,
        globalSearch, // ✅ add
      });
    }, [
      filters,
      sortConfig,
      currentPage,
      groupBy,
      userHiddenCols,
      rowsPerPage,
      globalSearch,   // ✅ add
      onStateChange,
    ]);

    // reset expansions when grouping changes
    useEffect(() => {
      setExpandedGroups({});
      setCurrentPage(1);
    }, [groupBy]);

    // clear grouping if data becomes empty
    useEffect(() => {
      if (!data || data.length === 0) {
        if (groupBy.length > 0) setGroupBy([]);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data]);

    // Close menus when clicking outside (mobile friendly)
    useEffect(() => {
      const onDown = (e) => {
        const t = e.target;
        // close export/columns when clicking outside (simple approach)
        if (!t.closest?.("[data-sgrt-export]")) setShowExportMenu(false);
        if (!t.closest?.("[data-sgrt-cols]")) setShowColumnChooser(false);
      };
      document.addEventListener("mousedown", onDown);
      document.addEventListener("touchstart", onDown, { passive: true });
      return () => {
        document.removeEventListener("mousedown", onDown);
        document.removeEventListener("touchstart", onDown);
      };
    }, []);

    // --- Utilities ---
    const parseNumber = (v) => {
      if (typeof parseFormattedNumber === "function") {
        const n = parseFormattedNumber(v);
        return typeof n === "number" ? n : Number(String(v ?? "").replace(/,/g, ""));
      }
      return typeof v === "number" ? v : Number(String(v ?? "").replace(/,/g, ""));
    };

    const formatValue = (value, col) => {
      if (value === null || value === undefined) return "";
      switch (col?.renderType) {
        case "number":
        case "currency": {
          const digits = typeof col?.roundingOff === "number" ? col.roundingOff : 2;
          return typeof formatNumber === "function"
            ? formatNumber(value, digits)
            : Number(parseNumber(value)).toLocaleString("en-US", {
                minimumFractionDigits: digits,
                maximumFractionDigits: digits,
              });
        }
        case "date": {
          try {
            const datePart = String(value).split("T")[0];
            return typeof useReturnToDate === "function" ? useReturnToDate(datePart) : datePart;
          } catch {
            return String(value);
          }
        }
        default:
          return String(value ?? "");
      }
    };

    // --- Columns processing ---
    const orderedCols = useMemo(() => {
      if (columnOrder.length === 0) return columns;
      return columnOrder.map((key) => columns.find((c) => c.key === key)).filter(Boolean);
    }, [columns, columnOrder]);

    const baseVisibleColumns = useMemo(() => orderedCols.filter((c) => !c.hidden), [orderedCols]);

    const visibleCols = useMemo(
      () =>
        baseVisibleColumns.filter(
          (c) => !userHiddenCols.includes(c.key) && !groupBy.includes(c.key),
        ),
      [baseVisibleColumns, userHiddenCols, groupBy],
    );

    // ✅ treat "__actions" / Actions column as non-exportable
    const isActionColumn = (c) =>
      c?.key === "__actions" ||
      c?.renderType === "actions" ||
      String(c?.label || "").toLowerCase() === "actions";

    const exportVisibleCols = useMemo(
      () => visibleCols.filter((c) => !isActionColumn(c)),
      [visibleCols],
    );

    const exportColumns = useMemo(() => (columns || []).filter((c) => !isActionColumn(c)), [columns]);

    const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

    // estimate width by character length (simple + fast)
    const estimatePx = (text) => {
      const s = String(text ?? "");
      return s.length * 7 + 40;
    };

    const headerCellWrap = "w-full min-w-0 overflow-hidden text-ellipsis whitespace-nowrap";
    const hasActionCol = useMemo(() => visibleCols.some((c) => isActionColumn(c)), [visibleCols]);

    // --- Drag/drop ---
    const handleColDragStart = (e, key) => {
      setDraggedCol(key);
      e.dataTransfer.effectAllowed = "move";
    };

    const handleColDrop = (e, targetKey, isDropZone = false) => {
      e.preventDefault();
      if (!draggedCol) return;

      if (isDropZone) {
        if (!groupBy.includes(draggedCol)) setGroupBy((p) => [...p, draggedCol]);
      } else {
        if (groupBy.includes(draggedCol)) return;
        if (draggedCol === targetKey) return;

        const newOrder = [...columnOrder];
        const oldIdx = newOrder.indexOf(draggedCol);
        const newIdx = newOrder.indexOf(targetKey);
        if (oldIdx > -1 && newIdx > -1) {
          newOrder.splice(oldIdx, 1);
          newOrder.splice(newIdx, 0, draggedCol);
          setColumnOrder(newOrder);
        }
      }
      setDraggedCol(null);
    };

    // --- Sorting ---
    const handleSort = useCallback((key, sortable) => {
      if (sortable === false) return;
      setSortConfig((prev) => {
        if (prev.key === key) {
          if (prev.direction === "asc") return { key, direction: "desc" };
          if (prev.direction === "desc") return { key: null, direction: null };
        }
        return { key, direction: "asc" };
      });
      setCurrentPage(1);
    }, []);

    // --- Filtering + sorting data ---
    const filteredData = useMemo(() => {
      const active = Object.entries(filters).filter(([, v]) => String(v || "").trim() !== "");
      let rows = Array.isArray(data) ? data : [];

      if (active.length) {
        rows = rows.filter((r) =>
          active.every(([k, v]) =>
            String(r?.[k] ?? "").toLowerCase().includes(String(v).toLowerCase()),
          ),
        );
      }

      // ✅ Global search across all visible columns
      const q = String(globalSearch || "").trim().toLowerCase();
      if (q) {
        const keys = (visibleCols || []).map((c) => c.key).filter(Boolean);

        rows = rows.filter((r) =>
          keys.some((k) => String(r?.[k] ?? "").toLowerCase().includes(q))
        );
      }

      if (sortConfig?.key && sortConfig?.direction) {
        const { key, direction } = sortConfig;
        const col = columns.find((c) => c.key === key);
        const isNumeric = col?.renderType === "number" || col?.renderType === "currency";
        const norm = (val) => (isNumeric ? parseNumber(val) || 0 : String(val ?? "").toLowerCase());

        rows = [...rows].sort((a, b) => {
          const A = norm(a?.[key]);
          const B = norm(b?.[key]);
          const cmp = isNumeric
            ? A - B
            : String(A).localeCompare(String(B), undefined, { numeric: true });
          return direction === "asc" ? cmp : -cmp;
        });
      }

      return rows.map((row) => {
        const cleanRow = { ...row };
        delete cleanRow.isGroup;
        delete cleanRow.children;
        return cleanRow;
      });
    }, [data, filters, globalSearch, visibleCols, sortConfig, columns]);

    const autoColWidths = useMemo(() => {
      const MIN = 90;
      const MAX = 260;
      const SAMPLE = 80;

      const sampleRows = (Array.isArray(filteredData) ? filteredData : []).slice(0, SAMPLE);
      const out = {};

      visibleCols.forEach((col) => {
        let w = estimatePx(col.label);

        for (const r of sampleRows) {
          const val =
            typeof col.render === "function" ? col.render(r) : formatValue(r?.[col.key], col);

          const str =
            typeof val === "string" || typeof val === "number"
              ? String(val)
              : String(r?.[col.key] ?? "");

          w = Math.max(w, estimatePx(str));
        }

        const colBase = Number(col.width);
        if (Number.isFinite(colBase)) w = Math.max(w, colBase);

        out[col.key] = clamp(w, MIN, MAX);
      });

      return out;
    }, [visibleCols, filteredData]);

    const shouldSumColumn = (col) => {
      const noTotalKeys = ["unitcost", "currrate", "unitprice", "runbal"];
      if (!col) return false;

      const key = String(col.key ?? "").toLowerCase();
      const label = String(col.label ?? "").toLowerCase();

      if (noTotalKeys.includes(key)) return false;
      if (col.renderType !== "number" && col.renderType !== "currency") return false;

      if (totalExemptions.some((ex) => label.includes(ex) || key.includes(ex))) return false;

      return true;
    };

    const calculateAggregates = (rows) => {
      const sums = {};
      exportVisibleCols.forEach((col) => {
        if (shouldSumColumn(col)) {
          sums[col.key] = (rows || []).reduce((acc, r) => acc + (parseNumber(r?.[col.key]) || 0), 0);
        }
      });
      return sums;
    };

    // --- Grouping ---
    const groupData = (rows, level = 0) => {
      if (level >= groupBy.length) return rows.map((r) => ({ ...r }));

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
    };

    const buildExpandedExportRows = (nodes) => {
      const firstKey = exportVisibleCols?.[0]?.key;
      const out = [];

      const walk = (arr) => {
        (arr || []).forEach((node) => {
          if (node?.isGroup) {
            const headerRow = {};
            exportColumns.forEach((c) => (headerRow[c.key] = ""));
            if (firstKey) {
              const label = columns.find((c) => c.key === node.key)?.label || node.key;
              headerRow[firstKey] = `${label}: ${node.value} (${node.count})`;
            }
            out.push(headerRow);

            const uniqueId = `${node.key}-${node.value}-${node.level}`;
            if (expandedGroups[uniqueId]) walk(node.children);
          } else {
            const clean = { ...node };
            delete clean.isGroup;
            delete clean.isSubtotal;
            delete clean.children;
            delete clean.aggregates;
            out.push(clean);
          }
        });
      };

      walk(nodes);
      return out;
    };

    const processRenderList = (nodes) => {
      let list = [];
      nodes.forEach((node) => {
        if (node.isGroup) {
          list.push(node);
          const uniqueId = `${node.key}-${node.value}-${node.level}`;
          if (expandedGroups[uniqueId]) {
            if (node.level === groupBy.length - 1) list = list.concat(node.children);
            else list = list.concat(processRenderList(node.children));
          }
        } else {
          list.push(node);
        }
      });
      return list;
    };

    const groupedStructure = useMemo(() => {
      if (groupBy.length === 0) return filteredData;
      return groupData(filteredData);
    }, [filteredData, groupBy]);

    const fullRenderRows = useMemo(() => {
      if (groupBy.length === 0) return filteredData;

      const expandAll = (nodes) => {
        let list = [];
        nodes.forEach((node) => {
          if (node.isGroup) {
            list.push(node);
            if (node.level === groupBy.length - 1) list = list.concat(node.children);
            else list = list.concat(expandAll(node.children));
          } else {
            list.push(node);
          }
        });
        return list;
      };

      return expandAll(groupedStructure);
    }, [filteredData, groupedStructure, groupBy]);

    // --- Pagination ---
    const totalItems = groupBy.length > 0 ? groupedStructure.length : filteredData.length;
    const totalPages = rowsPerPage > 0 ? Math.max(1, Math.ceil(totalItems / rowsPerPage)) : 1;
    const safePage = Math.min(Math.max(1, currentPage), totalPages);

    useEffect(() => {
      if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
      else if (currentPage < 1 && totalPages > 0) setCurrentPage(1);
    }, [currentPage, totalPages]);

    const displayRows = useMemo(() => {
      const start = rowsPerPage > 0 ? (safePage - 1) * rowsPerPage : 0;

      if (groupBy.length === 0) {
        return rowsPerPage > 0 ? filteredData.slice(start, start + rowsPerPage) : filteredData;
      }

      const pagedGroups =
        rowsPerPage > 0 ? groupedStructure.slice(start, start + rowsPerPage) : groupedStructure;

      return processRenderList(pagedGroups);
    }, [safePage, rowsPerPage, filteredData, groupedStructure, expandedGroups, groupBy]);

    const grandTotals = useMemo(() => ({}), []);
    const hasDataFiltered = Array.isArray(filteredData) && filteredData.length > 0;

    // --- Expand/Collapse ---
    const toggleGroup = (node) => {
      const uniqueId = `${node.key}-${node.value}-${node.level}`;
      setExpandedGroups((prev) => ({ ...prev, [uniqueId]: !prev[uniqueId] }));
    };

    const toggleAll = (expand) => {
      if (!expand) return setExpandedGroups({});
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
      setExpandedGroups(allKeys);
    };

    // --- Column resize ---
    const handleMouseMove = useCallback((e) => {
      if (!resizingRef.current) return;
      const { startX, startWidth, key } = resizingRef.current;
      const delta = e.clientX - startX;
      const newWidth = Math.max(60, startWidth + delta);
      setColWidths((prev) => ({ ...prev, [key]: newWidth }));
    }, []);

    const handleMouseUp = useCallback(() => {
      if (!resizingRef.current) return;
      resizingRef.current = null;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }, [handleMouseMove]);

    const startResizing = (e, key) => {
      e.preventDefault();
      e.stopPropagation();
      const th = e.currentTarget?.parentElement;
      const currentWidth =
        th?.offsetWidth ||
        colWidths[key] ||
        Number(columns.find((c) => c.key === key)?.width) ||
        140;

      resizingRef.current = { startX: e.clientX, startWidth: currentWidth, key };
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    };

    const sanitizeFileName = (name) =>
      String(name ?? "")
        .trim()
        .replace(/[\\/:*?"<>|]/g, "")
        .replace(/\s+/g, " ")
        .substring(0, 120);

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

    const getDefaultExportFileName = () => {
      const effectiveDocType = String(docType ?? "").trim();
      const title = reftables?.[effectiveDocType] || effectiveDocType || "Reference";
      return sanitizeFileName(`${title}_${getDateTimeStamp()}`);
    };

    // --- Export handlers ---
    const handleExportExcel = async () => {
      if (!hasDataFiltered) return;

      const defaultFileName = getDefaultExportFileName();
      const { value: fileName } = await Swal.fire({
        // title: "Export Excel File Name:",
        input: "text",
        inputLabel: "Export Excel File Name:",
        inputValue: defaultFileName,
        width: "400px",
        showCancelButton: true,
        confirmButtonText: "Export",
        inputValidator: (value) =>
          !value || value.trim() === "" ? "File name cannot be empty!" : null,
      });
      if (!fileName) return;

      const exportData = groupBy.length > 0 ? buildExpandedExportRows(groupedStructure) : filteredData;

      await exportGenericQueryExcel(
        exportData,
        grandTotals,
        exportVisibleCols,
        [], // disable grouping in exporter
        exportColumns,
        {},
        7,
        fileName,
        currentUserRow?.userName,
        companyInfo?.compName,
        companyInfo?.compAddr,
        companyInfo?.telNo,
      );
    };

    const handleExportCsv = async () => {
      if (!hasDataFiltered) return;

      const defaultFileName = getDefaultExportFileName();
      const { value: fileName } = await Swal.fire({
        // title: "Enter File Name",
        input: "text",
        inputLabel: "Export CSV File Name:",
        inputValue: defaultFileName,
        width: "400px",
        showCancelButton: true,
        confirmButtonText: "Export CSV",
        inputValidator: (value) =>
          !value || value.trim() === "" ? "File name cannot be empty!" : null,
      });
      if (!fileName) return;

      const headerRow = exportVisibleCols
        .map((col) => {
          let header = String(col.label ?? "");
          header = header.replace(/,/g, "");
          header = header.toUpperCase().replace(/\s+/g, "_");
          const escaped = header.replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(",");

      const csvLines = [headerRow];
      filteredData.forEach((row) => {
        const line = exportVisibleCols
          .map((col) => {
            const formatted = formatValue(row[col.key], col);
            const noCommas = String(formatted ?? "").replace(/,/g, "");
            const escaped = noCommas.replace(/"/g, '""');
            return `"${escaped}"`;
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
    };

    const handleExportPdf = async () => {
      if (!hasDataFiltered || !exportContainerRef.current) return;

      const defaultFileName = getDefaultExportFileName();
      const { value: fileName } = await Swal.fire({
        // title: "Enter File Name",
        input: "text",
        inputLabel: "Export PDF File Name:",
        inputValue: defaultFileName,
        width: "400px",
        showCancelButton: true,
        confirmButtonText: "Export PDF",
        inputValidator: (value) =>
          !value || value.trim() === "" ? "File name cannot be empty!" : null,
      });
      if (!fileName) return;

      const canvas = await html2canvas(exportContainerRef.current, { scale: 2, useCORS: true });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("l", "mm", "a4");

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);

      const imgWidth = canvas.width * ratio;
      const imgHeight = canvas.height * ratio;
      const x = (pdfWidth - imgWidth) / 2;
      const y = (pdfHeight - imgHeight) / 2;

      pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
      pdf.save(`${fileName}.pdf`);
    };

    const handleExportImage = async () => {
      if (!hasDataFiltered || !exportContainerRef.current) return;

      const defaultFileName = getDefaultExportFileName();
      const { value: fileName } = await Swal.fire({
        // title: "Enter File Name",
        input: "text",
        inputLabel: "Export Image File Name:",
        inputValue: defaultFileName,
        width: "400px",
        showCancelButton: true,
        confirmButtonText: "Export Image",
        inputValidator: (value) =>
          !value || value.trim() === "" ? "File name cannot be empty!" : null,
      });
      if (!fileName) return;

      const canvas = await html2canvas(exportContainerRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = imgData;
      link.download = `${fileName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    // --- Imperative API ---
    useImperativeHandle(ref, () => ({
      getState: () => ({
        filters,
        sortConfig,
        currentPage: safePage,
        groupBy,
        userHiddenCols,
        itemsPerPage: rowsPerPage,
        globalSearch, // ✅ add
      }),
      scrollRef,
      clearAllState: () => {
        setFilters({});
        setSortConfig({ key: null, direction: null });
        setGroupBy([]);
        setUserHiddenCols([]);
        setRowsPerPage(Number(itemsPerPage) || 50);
        setGlobalSearch(""); // ✅ add
      },
      resetFilters: () => setFilters({}),
      clearSort: () => setSortConfig({ key: null, direction: null }),
      goToPage: (p) => setCurrentPage(Math.max(1, Number(p) || 1)),
      setCardView: (on) => setForceTableView(!on),
    }));

    const isLoadingColumns = isLoading || columns.length === 0;

    // Column chooser helpers
    const allChooserKeys = baseVisibleColumns.map((c) => c.key);
    const allChecked = userHiddenCols.length === 0;
    const toggleSelectAll = () => {
      if (allChecked) setUserHiddenCols(allChooserKeys);
      else setUserHiddenCols([]);
    };

    const canRemoveSingleGroup = groupBy.length <= 1;

    const filterInputClass =
      "w-full min-w-0 px-2 py-1.5 text-[11px] rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-300";

    // ✅ Mobile Card renderer
    const renderMobileCard = (row, idx) => {
      const primaryCol = visibleCols?.[0];

      const title =
        primaryCol
          ? typeof primaryCol.render === "function"
            ? primaryCol.render(row)
            : formatValue(row?.[primaryCol.key], primaryCol)
          : `Row ${idx + 1}`;

      return (
        <div
          key={row.__idx ?? idx}
          className="border rounded-xl bg-white shadow-sm p-3 space-y-2 active:scale-[0.99] transition"
          onDoubleClick={() => onRowDoubleClick?.(row)}
        >
          <div className="text-sm font-semibold text-gray-900 truncate">{title}</div>

          <div className="grid grid-cols-1 gap-1">
            {visibleCols.slice(1).map((col) => (
              <div key={col.key} className="flex items-start justify-between gap-3">
                <div className="text-[11px] text-gray-500 w-32 shrink-0">{col.label}</div>
                <div className="text-[11px] text-gray-800 text-right break-words">
                  {typeof col.render === "function"
                    ? col.render(row)
                    : formatValue(row?.[col.key], col)}
                </div>
              </div>
            ))}
          </div>

          <div className="text-[10px] text-gray-400 pt-1 border-t">
            Double-tap / double-click to open
          </div>
        </div>
      );
    };

    return (
      <div
        className={[
          "global-tran-table-main-div-ui flex flex-col flex-1 min-h-0 overflow-hidden",
          className,
        ].join(" ")}
      >
        {/* TOP BAR */}
        {hasDataFiltered && (
          <div
            className="p-2 bg-gray-50 border border-gray-200 rounded-md mb-2
                       flex flex-col md:flex-row md:items-center md:justify-between gap-2"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleColDrop(e, null, true)}
          >
            <div className="flex-1 flex flex-wrap gap-2 items-center">
              <div className="text-xs font-bold text-gray-600 flex items-center">
                <FontAwesomeIcon icon={faLayerGroup} className="mr-2" />
                Group By:
              </div>

              {groupBy.length === 0 && (
                <div className="text-sm text-gray-400 italic border border-dashed border-gray-300 rounded px-3 py-1">
                  Drag Header Here...
                </div>
              )}

              {groupBy.map((gKey) => (
                <div
                  key={gKey}
                  className="flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded border border-blue-200"
                >
                  <span>{columns.find((c) => c.key === gKey)?.label}</span>

                  {canRemoveSingleGroup && (
                    <button
                      type="button"
                      onClick={() => setGroupBy((p) => p.filter((k) => k !== gKey))}
                      className="ml-2 text-blue-600 hover:text-red-600"
                      title="Remove group"
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  )}
                </div>
              ))}

              {/* Mobile view toggle */}
              {isMobile && (
                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    className="px-3 py-2 h-9 text-xs font-medium bg-white border rounded-md hover:bg-gray-100 active:scale-[0.98] transition"
                    onClick={() => setForceTableView((p) => !p)}
                    title="Toggle Card/Table View"
                  >
                    {useCardView ? "Table View" : "Card View"}
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              {groupBy.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => toggleAll(true)}
                    className="px-3 py-2 h-9 text-xs font-medium text-blue-800 bg-white border rounded-md hover:bg-gray-100 active:scale-[0.98] transition"
                    title="Expand All"
                  >
                    <FontAwesomeIcon icon={faExpandArrowsAlt} className="mr-1" />
                    Expand
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleAll(false)}
                    className="px-3 py-2 h-9 text-xs font-medium text-blue-800 bg-white border rounded-md hover:bg-gray-100 active:scale-[0.98] transition"
                    title="Collapse All"
                  >
                    <FontAwesomeIcon icon={faCompressArrowsAlt} className="mr-1" />
                    Collapse
                  </button>
                  <button
                    type="button"
                    onClick={() => setGroupBy([])}
                    className="px-3 py-2 h-9 text-xs font-medium text-red-700 bg-white border rounded-md hover:bg-gray-100 active:scale-[0.98] transition"
                    title="Remove All Groups"
                  >
                    <FontAwesomeIcon icon={faTimes} className="mr-1" />
                    Remove
                  </button>
                </>
              )}


              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => {
                    setGlobalSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search all columns..."
                  className="h-8 w-full md:w-64 px-3 text-xs rounded-md border border-gray-300
                            focus:outline-none focus:ring-1 focus:ring-blue-300"
                />

                {globalSearch?.trim() && (
                  <button
                    type="button"
                    className="h-8 px-3 text-xs rounded-md bg-gray-200 hover:bg-gray-300"
                    onClick={() => {
                      setGlobalSearch("");
                      setCurrentPage(1);
                    }}
                    title="Clear search"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* EXPORT */}
              <div className="relative" data-sgrt-export>
                <button
                  type="button"
                  onClick={() => hasDataFiltered && setShowExportMenu((p) => !p)}
                  disabled={!hasDataFiltered}
                  className="px-3 py-2 h-8 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 active:scale-[0.98] transition"
                >
                  <FontAwesomeIcon icon={faFileExport} className="mr-1" />
                  Export
                </button>

                {showExportMenu && (
                  <div className="absolute right-0 mt-1 w-44 rounded-lg shadow-lg bg-white ring-1 ring-black/10 z-[60] overflow-hidden">
                    <button
                      type="button"
                      onClick={async () => {
                        setShowExportMenu(false);
                        await handleExportExcel();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-blue-50"
                    >
                      <FontAwesomeIcon icon={faFileExcel} className="mr-2 text-green-600" />
                      Excel
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setShowExportMenu(false);
                        await handleExportCsv();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-blue-50"
                    >
                      <FontAwesomeIcon icon={faFileCsv} className="mr-2 text-emerald-600" />
                      CSV
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setShowExportMenu(false);
                        await handleExportPdf();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-blue-50"
                    >
                      <FontAwesomeIcon icon={faFilePdf} className="mr-2 text-red-600" />
                      PDF
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setShowExportMenu(false);
                        await handleExportImage();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-blue-50"
                    >
                      <FontAwesomeIcon icon={faFileImage} className="mr-2 text-blue-600" />
                      Image
                    </button>
                  </div>
                )}
              </div>

              {/* COLUMNS */}
              <div className="relative" data-sgrt-cols>
                <button
                  type="button"
                  onClick={() => setShowColumnChooser((p) => !p)}
                  className="px-3 py-2 h-8 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 active:scale-[0.98] transition"
                >
                  <FontAwesomeIcon icon={faColumns} className="mr-1" />
                  Columns
                </button>

                {showColumnChooser && (
                  <div
                    className="absolute right-0 mt-1 bg-white border rounded shadow-lg p-2 max-h-64 overflow-auto z-50 min-w-[240px]"
                  >
                    <div className="flex items-center justify-between text-[11px] font-semibold mb-1 border-b pb-1">
                      <span>Show / Hide Columns</span>
                      <label className="flex items-center gap-1 text-[11px]">
                        <input
                          type="checkbox"
                          className="h-3 w-3"
                          checked={allChecked}
                          onChange={toggleSelectAll}
                        />
                        <span>Select All</span>
                      </label>
                    </div>

                    {baseVisibleColumns.map((col) => (
                      <label
                        key={col.key}
                        className="flex items-center text-[11px] gap-2 mb-1"
                      >
                        <input
                          type="checkbox"
                          className="h-3 w-3"
                          checked={!userHiddenCols.includes(col.key)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setUserHiddenCols((prev) =>
                              checked ? prev.filter((k) => k !== col.key) : [...prev, col.key],
                            );
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

        {/* TABLE / CARD VIEW */}
        <div className="global-tran-table-main-sub-div-ui flex flex-col flex-1 min-h-0 h-0">
          {isLoadingColumns ? (
            <TableLoader />
          ) : useCardView ? (
            <div className="flex-1 overflow-auto space-y-3 p-2">
              {displayRows.map((row, idx) => {
                if (groupBy.length > 0 && row.isGroup) {
                  const uniqueId = `${row.key}-${row.value}-${row.level}`;
                  const isExpanded = expandedGroups[uniqueId];
                  return (
                    <button
                      key={`g-${uniqueId}`}
                      type="button"
                      className="w-full text-left border rounded-xl p-3 bg-gray-50 active:scale-[0.99] transition"
                      onClick={() => toggleGroup(row)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-blue-900">
                          {columns.find((c) => c.key === row.key)?.label}: {row.value}
                        </div>
                        <div className="text-xs text-gray-500">
                          {isExpanded ? "Hide" : "Show"} ({row.count})
                        </div>
                      </div>
                    </button>
                  );
                }

                return renderMobileCard(row, idx);
              })}
            </div>
          ) : (
            <div
              ref={scrollRef}
              className="flex-1 overflow-auto border border-gray-200 rounded-sm relative custom-scrollbar"
            >
              <div className="text-[10px] text-gray-400 px-2 py-1 md:hidden">
                Tip: swipe left/right to see more columns
              </div>

              <table className="global-tran-table-div-ui border-collapse table-auto min-w-max w-max">
                <thead className="global-tran-thead-div-ui text-[11px] sticky top-0 z-30 bg-white">
                  <tr>
                    {visibleCols.map((col, index) => {
                      const isFirstTwo = index < 2;
                      // Calculate the 'left' offset for the second sticky column
                      const leftOffset = index === 0 ? 0 : (colWidths[visibleCols[0].key] || autoColWidths[visibleCols[0].key] || 140);
                      
                      return (
                        <th
                          key={col.key}
                          className={`global-tran-th-ui bg-blue-100 cursor-pointer select-none relative ${isFirstTwo ? "sticky z-40" : ""}`}
                          draggable={!groupBy.includes(col.key)}
                          onDragStart={(e) => handleColDragStart(e, col.key)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => handleColDrop(e, col.key)}
                          onClick={() => handleSort(col.key, col.sortable)}
                          title="Click to sort • Drag to reorder"
                          style={{
                            width: colWidths[col.key] || autoColWidths[col.key] || 140,
                            minWidth: 90,
                            left: isFirstTwo ? leftOffset : undefined,
                          }}
                        >
                          <div className="flex items-center justify-between gap-2 min-w-0">
                            <span className={headerCellWrap}>{col.label}</span>
                            {sortConfig.key === col.key ? (
                              <FontAwesomeIcon
                                icon={sortConfig.direction === "asc" ? faSortUp : faSortDown}
                              />
                            ) : (
                              <FontAwesomeIcon icon={faSort} className="opacity-30" />
                            )}
                          </div>

                          {/* resize handle */}
                          <div
                            className="absolute top-0 right-0 h-full w-2 cursor-col-resize select-none z-50"
                            onMouseDown={(e) => {
                              e.stopPropagation(); // Prevent sort on resize
                              startResizing(e, col.key);
                            }}
                          />
                        </th>
                      );
                    })}
                  </tr>

                  {showFilters && hasDataFiltered && (
                    <tr className="sticky top-[34px] z-20 bg-white">
                      {visibleCols.map((col, index) => {
                        const isFirstTwo = index < 2;
                        const leftOffset = index === 0 ? 0 : (colWidths[visibleCols[0].key] || autoColWidths[visibleCols[0].key] || 140);

                        return (
                          <th 
                            key={`f-${col.key}`} 
                            className={`global-tran-th-ui px-2 py-1 bg-white ${isFirstTwo ? "sticky z-30" : ""}`}
                            style={{ left: isFirstTwo ? leftOffset : undefined }}
                          >
                            <input
                              className={filterInputClass}
                              placeholder="Filter..."
                              value={filters[col.key] || ""}
                              onChange={(e) => {
                                setFilters((p) => ({ ...p, [col.key]: e.target.value }));
                                setCurrentPage(1);
                              }}
                            />
                          </th>
                        );
                      })}
                    </tr>
                  )}
                </thead>

                <tbody>
                  {!hasDataFiltered ? (
                    <tr>
                      <td
                        colSpan={visibleCols.length + (hasActionCol ? 1 : 0)}
                        className="global-ref-norecords-ui"
                      >
                        {Array.isArray(data) && data.length > 0 ? "No records found" : "No data"}
                      </td>
                    </tr>
                  ) : (
                    displayRows.map((row, idx) => {
                      const isGrouped = groupBy.length > 0;

                      if (isGrouped && row.isGroup) {
                        const uniqueId = `${row.key}-${row.value}-${row.level}`;
                        const isExpanded = expandedGroups[uniqueId];
                        return (
                          <tr
                            key={`g-${uniqueId}`}
                            className="global-tran-tr-ui bg-gray-100 cursor-pointer"
                            onClick={() => toggleGroup(row)}
                          >
                            <td
                              colSpan={visibleCols.length + (hasActionCol ? 1 : 0)}
                              className="global-tran-td-ui font-semibold text-blue-900 sticky left-0"
                            >
                              <div
                                className="flex items-center"
                                style={{ paddingLeft: row.level * 20 }}
                              >
                                <FontAwesomeIcon
                                  icon={isExpanded ? faChevronDown : faChevronRight}
                                  className="mr-2 text-gray-500"
                                />
                                <span className="mr-2 text-gray-600">
                                  {columns.find((c) => c.key === row.key)?.label}:
                                </span>
                                <span className="mr-2 font-bold">{row.value}</span>
                                <span className="bg-blue-200 text-blue-800 text-[10px] px-2 rounded-full">
                                  {row.count}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr
                          key={row.__idx ?? idx}
                          className="global-tran-tr-ui hover:bg-gray-50"
                          onDoubleClick={() => onRowDoubleClick?.(row)}
                        >
                          {visibleCols.map((col, index) => {
                            const isFirstTwo = index < 2;
                            const leftOffset = index === 0 ? 0 : (colWidths[visibleCols[0].key] || autoColWidths[visibleCols[0].key] || 140);

                            return (
                              <td
                                key={col.key}
                                className={`global-tran-td-ui align-center bg-white ${isFirstTwo ? "sticky z-10" : ""}`}
                                style={{
                                  width: colWidths[col.key] || autoColWidths[col.key] || 140,
                                  left: isFirstTwo ? leftOffset : undefined,
                                }}
                              >
                                <div className="w-full">
                                  {typeof col.render === "function"
                                    ? col.render(row)
                                    : formatValue(row[col.key], col)}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* PAGINATION FOOTER */}
        {hasDataFiltered && (
          <div
            className="px-3 py-2 border-t bg-white text-xs shrink-0
                       flex flex-col md:flex-row md:items-center md:justify-between gap-2"
          >
            <div>
              Showing <b>{rowsPerPage > 0 ? (safePage - 1) * rowsPerPage + 1 : 1}</b>–
              <b>{rowsPerPage > 0 ? Math.min(safePage * rowsPerPage, totalItems) : totalItems}</b>{" "}
              of <b>{totalItems}</b>
            </div>

            <div className="flex items-center gap-3 flex-wrap justify-end">
              <div>Rows per page</div>

              <select
                className="global-tran-textbox-ui global-tran-textbox-enabled w-20 h-9"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                {[10, 20, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>

              <button
                className="global-tran-btn-ui px-3 py-2 h-9 active:scale-[0.98] transition"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>

              <div>
                Page <b>{safePage}</b> / <b>{totalPages}</b>
              </div>

              <button
                className="global-tran-btn-ui px-3 py-2 h-9 active:scale-[0.98] transition"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* HIDDEN EXPORT TABLE (PDF/IMAGE) */}
        {hasDataFiltered && (
          <div
            ref={exportContainerRef}
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              width: 0,
              height: 0,
              overflow: "hidden",
              opacity: 0,
              pointerEvents: "none",
            }}
          >
            <table className="border-collapse text-[5px]">
              <thead>
                <tr>
                  {exportVisibleCols.map((col) => (
                    <th
                      key={col.key}
                      className="border px-2 py-1 text-left bg-gray-200 align-bottom"
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
                          colSpan={exportVisibleCols.length}
                          className="border px-2 py-1 font-semibold bg-gray-100"
                        >
                          {columns.find((c) => c.key === row.key)?.label}: {row.value} ({row.count})
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={`exp-row-${idx}`}>
                      {exportVisibleCols.map((col) => (
                        <td
                          key={col.key}
                          className="border px-2 py-1 align-bottom"
                          style={{ maxWidth: 150, whiteSpace: "normal", wordBreak: "break-word" }}
                        >
                          {formatValue(row[col.key], col)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  },
);

export default SearchGlobalReferenceTable;