import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWallet } from "@fortawesome/free-solid-svg-icons";

function IncomeExpenseReport({ view, tabConfig, SearchGlobalReportTable, NoRecordsState }) {
  if (!view.hasLoaded) {
    return (
      <div className="p-8 text-sm text-gray-500 flex items-center gap-2">
        <FontAwesomeIcon icon={faWallet} className="text-blue-300" />
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
      key={`incExp-${view.loadedAt || "idle"}`}
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

IncomeExpenseReport.meta = {
  key: "incExp",
  label: "Income and Expense",
  icon: faWallet,
  filters: [
    "Branch",
    "Starting Account",
    "Ending Account",
    "Start Cut Off",
    "End Cut Off",
    "Starting RC",
    "Ending RC",
  ],
  endpoint: "getGLINQ_IncomeExpense",
};

IncomeExpenseReport.buildPayload = (f) => ({
  branchCode: f.branchCode || "",
  accCodeStart: f.accCodeStart || "",
  accCodeEnd: f.accCodeEnd || "",
  cutoffStart: f.cutoffStartCode || "",
  cutoffEnd: f.cutoffEndCode || "",
  rcCodeStart: f.rcCodeStart || "",
  rcCodeEnd: f.rcCodeEnd || "",
});

IncomeExpenseReport.buildJsonData = (payload) => ({
  mode: "data",
  branchCode: payload.branchCode || "",
  accCodeStart: payload.accCodeStart || "",
  accCodeEnd: payload.accCodeEnd || "",
  cutoffStart: payload.cutoffStart || "",
  cutoffEnd: payload.cutoffEnd || "",
  rcCodeStart: payload.rcCodeStart || "",
  rcCodeEnd: payload.rcCodeEnd || "",
});

export default IncomeExpenseReport;