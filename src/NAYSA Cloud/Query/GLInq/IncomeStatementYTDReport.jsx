

import React, { useMemo, useState, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartSimple,
  faChevronRight,
  faChevronDown,
  faFolderTree,
  faBuilding,
  faAddressBook,
  faCircleInfo,
  faArrowUpRightFromSquare,
} from "@fortawesome/free-solid-svg-icons";

function IncomeStatementYTDReport({
  view,
  tabConfig,
  NoRecordsState,
  onJumpToGLInquiry,
  expandedMap = {},
  setExpandedMap,
}) {


  const periods = useMemo(() => {
    return Array.isArray(view?.comparisonPeriods) && view.comparisonPeriods.length > 0
      ? view.comparisonPeriods
      : [];
  }, [view?.comparisonPeriods]);

  const treeData = useMemo(
    () => buildIncomeStatementTree(view?.rows || [], periods),
    [view?.rows, periods]
  );

  const toggleNode = useCallback((nodeId) => {
    setExpandedMap((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  }, []);

  const expandAll = useCallback(() => {
    const allIds = {};
    const visit = (nodes) => {
      nodes.forEach((node) => {
        if (node.children?.length) {
          allIds[node.id] = true;
          visit(node.children);
        }
      });
    };
    visit(treeData);
    setExpandedMap(allIds);
  }, [treeData]);

  const collapseAll = useCallback(() => {
    setExpandedMap({});
  }, []);

  const handleJumpToGLInquiry = useCallback(
    (node) => {
      if (typeof onJumpToGLInquiry !== "function" || !node?.acctCode) return;

      const isRC = node.rowType === "detail" && node.detailType === "RC";
      const isSL = node.rowType === "detail" && node.detailType === "SL";

      onJumpToGLInquiry({
        acctCode: node.acctCode,
        acctName: node.acctName || "",
        rcCode: isRC ? node.code || "" : "",
        rcName: isRC ? node.label || "" : "",
        slCode: isSL ? node.code || "" : "",
        slName: isSL ? node.label || "" : "",
        fsCode: node.fsCode || "",
        label: node.label || "",
        node,
      });
    },
    [onJumpToGLInquiry]
  );

  if (!view?.hasLoaded) {
    return (
      <div className="flex items-center gap-2 p-8 text-sm text-gray-500">
        <FontAwesomeIcon icon={faChartSimple} className="text-blue-300" />
        <span>
          Click <b>Filter</b> then <b>Apply Filters</b> to load <b>{tabConfig.label}</b>.
        </span>
      </div>
    );
  }

  if (view?.isEmpty) {
    return (
      <NoRecordsState
        title="No records found"
        subtitle={view.emptyMessage || "Try adjusting your filters."}
        hint={`Report: ${tabConfig.label}`}
      />
    );
  }

  const safePeriods = periods.length > 0 ? periods : ["CURRENT"];
  const gridTemplateColumns = `minmax(420px, 1.5fr) 88px ${safePeriods
    .map(() => "minmax(130px, 1fr)")
    .join(" ")}`;

  return (
    <div className="w-full bg-white">
      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-[13px] font-medium text-gray-700">
              Drilldown Financial Statement
            </div>
            <div className="mt-1 text-[11px] text-gray-500">
              Expand FS groups to view account details, then RC / SL details.
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={expandAll}
              className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-normal text-gray-700 transition hover:bg-slate-100"
            >
              Expand All
            </button>

            <button
              type="button"
              onClick={collapseAll}
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-normal text-gray-700 transition hover:bg-slate-50"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      <div className="max-h-[600px] overflow-x-auto overflow-y-auto">
        <div className="min-w-[1180px]">
          <div
             className="sticky top-0 z-20 grid border-b border-blue-300 bg-blue-100 text-[11px] font-bold text-blue-900 shadow-sm"
            style={{ gridTemplateColumns }}
          >
            <div className="border-r border-blue-200 px-4 py-2.5">
              Particulars
            </div>

            <div className="border-r border-blue-200 px-3 py-2.5 text-center">
              Type
            </div>

            {safePeriods.map((periodCode, idx) => (
              <div
                key={periodCode}
                className={`px-4 py-2.5 text-right ${
                  idx < safePeriods.length - 1 ? "border-r border-blue-200" : ""
                }`}
              >
                {periodCode === "CURRENT"
                  ? "Amount"
                  : formatCutoffHeaderLabel(periodCode)}
              </div>
            ))}
          </div>

          <div className="divide-y divide-slate-200">
            {treeData.map((node) => (
              <IncomeStatementNodeRow
                key={node.id}
                node={node}
                level={0}
                periods={safePeriods}
                gridTemplateColumns={gridTemplateColumns}
                expandedMap={expandedMap}
                onToggle={toggleNode}
                onJumpToGLInquiry={handleJumpToGLInquiry}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function IncomeStatementNodeRow({
  node,
  level,
  periods,
  gridTemplateColumns,
  expandedMap,
  onToggle,
  onJumpToGLInquiry,
}) {
  const isExpanded = !!expandedMap[node.id];
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  const paddingLeft = 14 + level * 20;
  const typeMeta = getTypeMeta(node);

  const canJumpToGL = node.rowType === "account" && !!node.acctCode;
  const canJumpToRC =
    node.rowType === "detail" &&
    node.detailType === "RC" &&
    !!node.acctCode &&
    !!node.code;
  const canJumpToSL =
    node.rowType === "detail" &&
    node.detailType === "SL" &&
    !!node.acctCode &&
    !!node.code;

  const isClickableLabel =
    (canJumpToGL || canJumpToRC || canJumpToSL) &&
    typeof onJumpToGLInquiry === "function";

  const rowClass =
    node.rowType === "fs"
      ? "bg-slate-50/70 text-gray-700"
      : node.rowType === "account"
      ? "bg-white text-gray-700"
      : "bg-white text-gray-600";

  const handleRowJump = () => {
    if (!isClickableLabel) return;
    onJumpToGLInquiry(node);
  };

  return (
    <>
      <div
        className={`grid items-center border-b border-slate-100 ${rowClass} transition hover:bg-blue-50/20`}
        style={{ gridTemplateColumns }}
      >
        <div
          className="border-r border-slate-100 px-4 py-2"
          style={{ paddingLeft: `${paddingLeft}px` }}
        >
          <div className="group flex min-h-[26px] items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              {hasChildren ? (
                <button
                  type="button"
                  onClick={() => onToggle(node.id)}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-slate-200 bg-white text-gray-500 hover:bg-slate-100"
                >
                  <FontAwesomeIcon
                    icon={isExpanded ? faChevronDown : faChevronRight}
                    className="text-[9px]"
                  />
                </button>
              ) : (
                <div className="flex h-5 w-5 shrink-0 items-center justify-center text-slate-300">
                  <span className="text-[9px]">•</span>
                </div>
              )}

              <div className="flex min-w-0 flex-col">
                <button
                  type="button"
                  onClick={handleRowJump}
                  className={`min-w-0 truncate text-left leading-5 ${
                    node.rowType === "fs"
                      ? "text-[12px] font-medium"
                      : node.rowType === "account"
                      ? "text-[11.5px] font-normal"
                      : "text-[11px] font-normal"
                  } ${
                    isClickableLabel
                      ? "cursor-pointer text-blue-700 transition hover:text-blue-800 hover:underline"
                      : "cursor-default"
                  }`}
                  title={
                    canJumpToGL
                      ? `Open GL Inquiry for ${node.acctCode}`
                      : canJumpToRC
                      ? `Open GL Inquiry for ${node.acctCode} / ${node.code}`
                      : canJumpToSL
                      ? `Open GL Inquiry for ${node.acctCode} / ${node.code}`
                      : node.label
                  }
                >
                  {node.label}
                </button>

                {node.subLabel ? (
                  <div className="truncate text-[10px] leading-4 text-gray-400">
                    {node.subLabel}
                  </div>
                ) : null}
              </div>
            </div>

            {canJumpToGL || canJumpToRC || canJumpToSL ? (
              <button
                type="button"
                onClick={handleRowJump}
                className="shrink-0 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-700 opacity-0 transition hover:bg-blue-100 group-hover:opacity-100"
                title={
                  canJumpToGL
                    ? `Open GL Inquiry for ${node.acctCode}`
                    : `Open GL Inquiry for ${node.acctCode} / ${node.code}`
                }
              >
                <span className="flex items-center gap-1">
                  <FontAwesomeIcon
                    icon={faArrowUpRightFromSquare}
                    className="text-[9px]"
                  />
                  {canJumpToRC ? "RC Inquiry" : canJumpToSL ? "SL Inquiry" : "GL Inquiry"}
                </span>
              </button>
            ) : null}
          </div>
        </div>

        <div className="border-r border-slate-100 px-2 py-2">
          <div className="flex items-center justify-center">
            <div
              className={`inline-flex min-w-[54px] items-center justify-center gap-1 rounded-full border px-2 py-1 text-[10px] font-medium ${typeMeta.badgeClass}`}
              title={typeMeta.label}
            >
              <FontAwesomeIcon icon={typeMeta.icon} className={typeMeta.iconClass} />
              <span>{typeMeta.label}</span>
            </div>
          </div>
        </div>

        {periods.map((periodCode, idx) => {
          const rawAmount = toNumber(node.amounts?.[periodCode]);

          const displayAmount =
            node.rowType === "fs" && hasChildren && isExpanded ? 0 : rawAmount;

          return (
            <div
              key={`${node.id}-${periodCode}`}
              className={`px-4 py-2 text-right tabular-nums ${
                idx < periods.length - 1 ? "border-r border-slate-100" : ""
              }`}
            >
              <span className={getAmountClass(displayAmount, node.rowType)}>
                {formatNumberDisplay(displayAmount)}
              </span>
            </div>
          );
        })}
      </div>

      {hasChildren && isExpanded
        ? node.children.map((child) => (
            <IncomeStatementNodeRow
              key={child.id}
              node={child}
              level={level + 1}
              periods={periods}
              gridTemplateColumns={gridTemplateColumns}
              expandedMap={expandedMap}
              onToggle={onToggle}
              onJumpToGLInquiry={onJumpToGLInquiry}
            />
          ))
        : null}
    </>
  );
}

function buildIncomeStatementTree(rows, periods) {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  const safePeriods = periods.length > 0 ? periods : ["CURRENT"];
  const fsMap = new Map();
  const acctMap = new Map();

  rows.forEach((row, index) => {
    const fsCode = sanitize(row?.fsconso_code);
    const fsName = sanitize(row?.fsconso_name);
    const acctCode = sanitize(row?.acct_code);
    const acctName = sanitize(row?.acct_name);
    const rcCode = sanitize(row?.rc_code);
    const rcName = sanitize(row?.rc_name);
    const slCode = sanitize(row?.sl_code);
    const slName = sanitize(row?.sl_name);

    if (!fsCode) return;

    if (!fsMap.has(fsCode)) {
      fsMap.set(fsCode, {
        id: `fs-${fsCode}`,
        rowType: "fs",
        code: fsCode,
        label: fsName || fsCode,
        subLabel: "",
        amounts: buildAmountsByType(row, safePeriods, "fs"),
        sortIndex: index,
        children: [],
      });
    } else {
      const existingFs = fsMap.get(fsCode);
      mergeAmounts(
        existingFs.amounts,
        buildAmountsByType(row, safePeriods, "fs"),
        safePeriods
      );

      if (!existingFs.label && fsName) {
        existingFs.label = fsName;
      }
    }

    if (!acctCode) return;

    const acctKey = `${fsCode}|${acctCode}`;

    if (!acctMap.has(acctKey)) {
      const accountNode = {
        id: `acct-${fsCode}-${acctCode}`,
        rowType: "account",
        fsCode,
        acctCode,
        acctName,
        label: `${acctCode}${acctName ? ` - ${acctName}` : ""}`,
        subLabel: "",
        amounts: buildAmountsByType(row, safePeriods, "account"),
        sortIndex: index,
        children: [],
      };

      acctMap.set(acctKey, accountNode);
      fsMap.get(fsCode).children.push(accountNode);
    } else {
      const existingAcct = acctMap.get(acctKey);
      mergeAmounts(
        existingAcct.amounts,
        buildAmountsByType(row, safePeriods, "account"),
        safePeriods
      );

      if (!existingAcct.label && acctCode) {
        existingAcct.label = `${acctCode}${acctName ? ` - ${acctName}` : ""}`;
      }

      if (!existingAcct.acctName && acctName) {
        existingAcct.acctName = acctName;
      }
    }

    if (slCode) {
      const slNode = {
        id: `sl-${fsCode}-${acctCode}-${slCode}-${index}`,
        rowType: "detail",
        detailType: "SL",
        fsCode,
        acctCode,
        acctName,
        code: slCode,
        label: slName || slCode,
        subLabel: slCode,
        amounts: buildAmountsByType(row, safePeriods, "sl"),
        sortIndex: index,
        children: [],
      };

      acctMap.get(acctKey).children.push(slNode);
      return;
    }

    if (rcCode) {
      const rcNode = {
        id: `rc-${fsCode}-${acctCode}-${rcCode}-${index}`,
        rowType: "detail",
        detailType: "RC",
        fsCode,
        acctCode,
        acctName,
        code: rcCode,
        label: rcName || rcCode,
        subLabel: rcCode,
        amounts: buildAmountsByType(row, safePeriods, "rc"),
        sortIndex: index,
        children: [],
      };

      acctMap.get(acctKey).children.push(rcNode);
    }
  });

  const fsNodes = Array.from(fsMap.values()).sort(
    (a, b) => (a.sortIndex || 0) - (b.sortIndex || 0)
  );

  fsNodes.forEach((fsNode) => {
    fsNode.children.sort((a, b) => (a.sortIndex || 0) - (b.sortIndex || 0));
    fsNode.children.forEach((acctNode) => {
      acctNode.children.sort((a, b) => (a.sortIndex || 0) - (b.sortIndex || 0));
    });
  });

  return fsNodes;
}

function buildAmountsByType(row, periods, mode) {
  const amounts = {};

  periods.forEach((periodCode) => {
    if (periodCode === "CURRENT") {
      if (mode === "fs") {
        amounts[periodCode] = toNumber(row?.fs_amount);
      } else if (mode === "account") {
        amounts[periodCode] = toNumber(row?.gl_amount);
      } else if (mode === "rc") {
        amounts[periodCode] = toNumber(row?.rc_amount);
      } else if (mode === "sl") {
        amounts[periodCode] = toNumber(row?.sl_amount);
      } else {
        amounts[periodCode] = 0;
      }
      return;
    }

    if (mode === "fs") {
      amounts[periodCode] = toNumber(row?.periodFsAmounts?.[periodCode]);
    } else if (mode === "account") {
      amounts[periodCode] = toNumber(row?.periodGlAmounts?.[periodCode]);
    } else if (mode === "rc") {
      amounts[periodCode] = toNumber(row?.periodRcAmounts?.[periodCode]);
    } else if (mode === "sl") {
      amounts[periodCode] = toNumber(row?.periodSlAmounts?.[periodCode]);
    } else {
      amounts[periodCode] = toNumber(row?.periodAmounts?.[periodCode]);
    }
  });

  return amounts;
}

function mergeAmounts(target, source, periods) {
  periods.forEach((periodCode) => {
    const current = toNumber(target?.[periodCode]);
    const next = toNumber(source?.[periodCode]);

    if (current === 0 && next !== 0) {
      target[periodCode] = next;
    }
  });
}

function sanitize(value) {
  if (value == null) return "";
  return String(value).trim();
}

function toNumber(value) {
  if (value == null || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  const parsed = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatNumberDisplay(value) {
  const num = toNumber(value);
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatCutoffHeaderLabel(cutoffCode) {
  const safe = sanitize(cutoffCode);
  if (!/^\d{6}$/.test(safe)) return safe;

  const year = Number(safe.slice(0, 4));
  const month = Number(safe.slice(4, 6));

  const date = new Date(year, month - 1, 1);

  return date.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function getAmountClass(value, rowType) {
  const num = toNumber(value);

  if (num < 0) {
    return rowType === "fs"
      ? "text-[12px] font-medium text-red-600"
      : "text-[11px] font-normal text-red-600";
  }

  if (num > 0) {
    return rowType === "fs"
      ? "text-[12px] font-medium text-gray-700"
      : "text-[11px] font-normal text-gray-700";
  }

  return "text-[11px] font-normal text-gray-400";
}

function getTypeMeta(node) {
  if (node.rowType === "detail" && node.detailType === "RC") {
    return {
      label: "RC",
      icon: faBuilding,
      iconClass: "text-[10px]",
      badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (node.rowType === "detail" && node.detailType === "SL") {
    return {
      label: "SL",
      icon: faAddressBook,
      iconClass: "text-[10px]",
      badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  if (node.rowType === "account") {
    return {
      label: "GL",
      icon: faCircleInfo,
      iconClass: "text-[10px]",
      badgeClass: "border-blue-200 bg-blue-50 text-blue-700",
    };
  }

  return {
    label: "FS",
    icon: faFolderTree,
    iconClass: "text-[10px]",
    badgeClass: "border-slate-200 bg-slate-100 text-slate-700",
  };
}

IncomeStatementYTDReport.meta = {
  key: "incStatementYTD",
  label: "Income Statement YTD",
  icon: faChartSimple,
  filters: ["Branch", "Cut Off", "RC Code", "Currency", "Compare Years"],
  endpoint: "getBSIS_YTD",
};

IncomeStatementYTDReport.buildPayload = (f) => ({
  branchCode: f.branchCode || "",
  cutoffCode: f.cutoffCode || "",
  rcCode: f.rcCode || "",
  currCode: f.currCode || "PHP",
  compareYears: f.compareYears || 1,
});

IncomeStatementYTDReport.buildJsonData = (payload) => ({
  mode: "data",
  branchCode: payload.branchCode || "",
  cutoffCode: payload.cutoffCode || "",
  rcCode: payload.rcCode || "",
  currCode: payload.currCode || "PHP",
});

export default IncomeStatementYTDReport;