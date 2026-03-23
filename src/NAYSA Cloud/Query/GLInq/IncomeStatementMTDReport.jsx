import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarDay } from "@fortawesome/free-solid-svg-icons";

function IncomeStatementMTDReport({ view, tabConfig, SearchGlobalReportTable, NoRecordsState }) {
  if (!view.hasLoaded) {
    return (
      <div className="p-8 text-sm text-gray-500 flex items-center gap-2">
        <FontAwesomeIcon icon={faCalendarDay} className="text-blue-300" />
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
      key={`isMTD-${view.loadedAt || "idle"}`}
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

IncomeStatementMTDReport.meta = {
  key: "isMTD",
  label: "Income Statement (MTD)",
  icon: faCalendarDay,
  filters: ["Branch", "Start Cut Off", "End Cut Off", "Starting RC", "Ending RC", "Currency"],
  endpoint: "getGLINQ_IncomeStmtMTD",
};

IncomeStatementMTDReport.buildPayload = (f) => ({
  branchCode: f.branchCode || "",
  cutoffStart: f.cutoffStartCode || "",
  cutoffEnd: f.cutoffEndCode || "",
  rcCodeStart: f.rcCodeStart || "",
  rcCodeEnd: f.rcCodeEnd || "",
  currCode: f.currCode || "PHP",
});

IncomeStatementMTDReport.buildJsonData = (payload) => ({
  mode: "data",
  branchCode: payload.branchCode || "",
  cutoffStart: payload.cutoffStart || "",
  cutoffEnd: payload.cutoffEnd || "",
  rcCodeStart: payload.rcCodeStart || "",
  rcCodeEnd: payload.rcCodeEnd || "",
  currCode: payload.currCode || "PHP",
});

export default IncomeStatementMTDReport;