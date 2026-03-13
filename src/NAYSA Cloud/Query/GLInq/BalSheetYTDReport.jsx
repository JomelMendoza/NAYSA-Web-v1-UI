import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMoneyBillTrendUp } from "@fortawesome/free-solid-svg-icons";

function BalSheetYTDReport({ view, tabConfig, SearchGlobalReportTable, NoRecordsState }) {
  if (!view.hasLoaded) {
    return (
      <div className="p-8 text-sm text-gray-500 flex items-center gap-2">
        <FontAwesomeIcon icon={faMoneyBillTrendUp} className="text-blue-300" />
        <span>
          Click <b>Filter</b> then <b>Apply Filters</b> to load <b>{tabConfig.label}</b>.
        </span>
      </div>
    );
  }

  if (view.isEmpty) {
    return (
      <NoRecordsState
        title="No records found"
        subtitle={view.emptyMessage || "Try adjusting your filters."}
        hint={`Report: ${tabConfig.label}`}
      />
    );
  }

  return (
    <SearchGlobalReportTable
      key={`balSheetYTD-${view.loadedAt || "idle"}`}
      columns={view.cols}
      data={view.rows}
      itemsPerPage={50}
      rightActionLabel={view.rightActionLabel || "View"}
      onRowAction={(row) => {
        if (!row?.pathUrl) return;
        const url = `${window.location.origin}${row.pathUrl}`;
        window.open(url, "_blank", "noopener,noreferrer");
      }}
    />
  );
}

BalSheetYTDReport.meta = {
  key: "balSheetYTD",
  label: "Balance Sheet YTD",
  icon: faMoneyBillTrendUp,
  filters: ["Branch", "Cut Off", "RC Code", "Currency"],
  endpoint: "getGLINQ_BalSheetYTD",
};

BalSheetYTDReport.buildPayload = (f) => ({
  branchCode: f.branchCode || "",
  cutoffCode: f.cutoffCode || "",
  rcCode: f.rcCode || "",
  currCode: f.currCode || "PHP",
});

BalSheetYTDReport.buildJsonData = (payload) => ({
  mode: "data",
  branchCode: payload.branchCode || "",
  cutoffCode: payload.cutoffCode || "",
  rcCode: payload.rcCode || "",
  currCode: payload.currCode || "PHP",
});

export default BalSheetYTDReport;