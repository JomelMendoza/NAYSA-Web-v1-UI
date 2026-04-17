
import React, { useMemo, useState } from "react";
import {
  Search, Filter, FileText, ShoppingCart, PackageCheck,
  Receipt, Wallet, Clock3, CheckCircle2, AlertCircle,
  TrendingUp, ChevronRight, X, LayoutList, Download, CalendarDays, Building2
} from "lucide-react";

// ── per-stage mock detail data ────
const stageDetails = {
  pr: {
    fields: [
      { label: "PR Number",   key: "prNo"      },
      { label: "Date Filed",  key: "prDate"    },
      { label: "Requestor",   key: "requestor" },
      { label: "Department",  key: "department"},
      { label: "Purpose",     key: "remarks"   },
    ],
    extra: {
      "PR-2026-00041": [{ "Approved By": "V. Reyes", "Approval Date": "Apr 10, 2026", "Priority": "Normal" }],
      "PR-2026-00042": [{ "Approved By": "V. Reyes", "Approval Date": "Apr 11, 2026", "Priority": "Normal" }],
      "PR-2026-00043": [{ "Approved By": "B. Lim",   "Approval Date": "Apr 12, 2026", "Priority": "Urgent" }],
      "PR-2026-00044": [{ "Approved By": "Pending",  "Approval Date": "—",            "Priority": "Normal" }],
      "PR-2026-00045": [{ "Approved By": "—",        "Approval Date": "—",            "Priority": "Low"    }],
    },
  },
  po: {
    fields: [
      { label: "Supplier",   key: "supplier"  },
      { label: "PR Amount",  key: "amount"    },
    ],
    extra: {
      "PR-2026-00041": [
        { "PO Number": "PO-2026-00191", "PO Date": "Apr 10, 2026", "Amount": "₱50,000.00", "Terms": "30 days net", "Status": "Approved" },
        { "PO Number": "PO-2026-00192", "PO Date": "Apr 10, 2026", "Amount": "₱75,000.00", "Terms": "30 days net", "Status": "Approved" }
      ],
      "PR-2026-00042": [{ "PO Number": "PO-2026-00193", "PO Date": "Apr 11, 2026", "Amount": "₱48,560.00", "Terms": "COD", "Status": "Approved" }],
      "PR-2026-00043": [{ "PO Number": "PO-2026-00194", "PO Date": "Apr 12, 2026", "Amount": "₱312,900.00", "Terms": "15 days", "Status": "Approved" }],
      "PR-2026-00044": [{ "PO Number": "Pending",       "PO Date": "—",            "Amount": "—",           "Terms": "—", "Status": "For Approval" }],
      "PR-2026-00045": [],
    },
  },
  rr: {
    fields: [
      { label: "Supplier",   key: "supplier"  },
    ],
    extra: {
      "PR-2026-00041": [
        { "RR Number": "RR-2026-00088", "Ref PO": "PO-2026-00191", "Date": "Apr 10", "Received By": "K. Flores", "Condition": "Good", "Qty": "Complete" },
        { "RR Number": "RR-2026-00089", "Ref PO": "PO-2026-00192", "Date": "Apr 11", "Received By": "K. Flores", "Condition": "Good", "Qty": "Partial" },
        { "RR Number": "RR-2026-00090", "Ref PO": "PO-2026-00192", "Date": "Apr 12", "Received By": "K. Flores", "Condition": "Good", "Qty": "Balance" }
      ],
      "PR-2026-00042": [{ "RR Number": "RR-2026-00091", "Ref PO": "PO-2026-00193", "Date": "Apr 12", "Received By": "K. Flores", "Condition": "Good", "Qty": "Complete" }],
      "PR-2026-00043": [{ "RR Number": "RR-2026-00092", "Ref PO": "PO-2026-00194", "Date": "Apr 13", "Received By": "P. Navarro","Condition": "Good", "Qty": "30/60 pcs" }],
      "PR-2026-00044": [],
      "PR-2026-00045": [],
    },
  },
  apv: {
    fields: [
      { label: "Supplier",    key: "supplier"},
    ],
    extra: {
      "PR-2026-00041": [
        { "APV Number": "APV-2026-00055", "Invoice No": "INV-4421", "Gross Amt": "₱50,000.00", "APCM (Credit)": "₱0.00", "APDM (Debit)": "-₱1,200.00", "Net Payable": "₱48,800.00", "Posted By": "C. Tan" },
        { "APV Number": "APV-2026-00056", "Invoice No": "INV-4422", "Gross Amt": "₱75,000.00", "APCM (Credit)": "+₱500.00", "APDM (Debit)": "₱0.00", "Net Payable": "₱75,500.00", "Posted By": "C. Tan" }
      ],
      "PR-2026-00042": [{ "APV Number": "In Progress",    "Invoice No": "INV-5503", "Gross Amt": "₱48,560.00", "APCM (Credit)": "₱0.00", "APDM (Debit)": "₱0.00", "Net Payable": "Pending", "Posted By": "Pending" }],
      "PR-2026-00043": [],
      "PR-2026-00044": [],
      "PR-2026-00045": [],
    },
  },
  cv: {
    fields: [
      { label: "Supplier",    key: "supplier"},
    ],
    extra: {
      "PR-2026-00041": [
        { "CV Number": "CV-2026-00031", "Ref APV": "APV-2026-00055", "Check No": "CHK-009821", "Bank": "BDO", "Amount": "₱48,800.00", "Released By": "M. Santos" },
        { "CV Number": "CV-2026-00032", "Ref APV": "APV-2026-00056", "Check No": "CHK-009822", "Bank": "BDO", "Amount": "₱75,500.00", "Released By": "M. Santos" }
      ],
      "PR-2026-00042": [],
      "PR-2026-00043": [],
      "PR-2026-00044": [],
      "PR-2026-00045": [],
    },
  },
};

const stageColor = {
  done:   { badge: "bg-emerald-100 text-emerald-700 border-emerald-200", header: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
  active: { badge: "bg-amber-100 text-amber-700 border-amber-200",       header: "bg-amber-50 border-amber-200",     dot: "bg-amber-500"   },
  todo:   { badge: "bg-slate-100 text-slate-500 border-slate-200",       header: "bg-slate-50 border-slate-200",     dot: "bg-slate-300"   },
};
const stageStatusLabel = { done: "Completed", active: "In Progress", todo: "Pending" };

// ── DrilldownModal ───────────────────────────────────────────────────────────
function DrilldownModal({ row, stageKey, stageList, onClose, onStage }) {
  const stage     = stageList.find((s) => s.key === stageKey);
  const stateKey  = row.flow[stageKey];
  const sc        = stageColor[stateKey];
  const Icon      = stage.icon;
  const detail    = stageDetails[stageKey];
  const extraDocs = detail.extra[row.prNo] || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ background: "rgba(15,23,42,0.6)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl rounded-[28px] bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`border-b ${sc.header} px-6 pt-6 pb-5 shrink-0`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${sc.badge}`}>
                <Icon size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-slate-900">{stage.label}</span>
                  <span className="text-slate-300">—</span>
                  <span className="text-sm text-slate-500">{stage.name}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${sc.badge}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                    {stageStatusLabel[stateKey]}
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">{row.prNo}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-6 overflow-y-auto bg-slate-50/50 flex-1">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Transaction Info</p>
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">
              {detail.fields.map((f) => (
                <div key={f.key} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-xs text-slate-500">{f.label}</span>
                  <span className="text-xs font-semibold text-slate-800">{row[f.key]}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
               <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{stage.name} Documents</p>
               {extraDocs.length > 1 && (
                 <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                    <LayoutList size={10} /> {extraDocs.length} Records found
                 </span>
               )}
            </div>
            
            {extraDocs.length === 0 ? (
               <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                  <p className="text-xs text-slate-400">No documents generated yet for this stage.</p>
               </div>
            ) : (
               <div className="space-y-3">
                 {extraDocs.map((doc, idx) => (
                   <div key={idx} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                     {extraDocs.length > 1 && (
                       <div className="bg-slate-50 border-b border-slate-100 px-4 py-2 flex items-center justify-between">
                         <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Document {idx + 1}</span>
                         <span className="text-[11px] font-mono text-slate-400">
                           {doc["PO Number"] || doc["RR Number"] || doc["APV Number"] || doc["CV Number"]}
                         </span>
                       </div>
                     )}
                     
                     <div className="divide-y divide-slate-100">
                       {Object.entries(doc).map(([label, value]) => {
                         if (extraDocs.length > 1 && ["PO Number", "RR Number", "APV Number", "CV Number"].includes(label)) return null;
                         
                         const isAdjustment = label.includes("APCM") || label.includes("APDM");
                         const isNet = label.includes("Net Payable");

                         return (
                           <div key={label} className={`flex items-center justify-between px-4 py-2.5 ${isNet ? 'bg-slate-50/50' : ''}`}>
                             <span className={`text-xs ${isAdjustment ? 'text-amber-600 font-medium' : 'text-slate-500'}`}>{label}</span>
                             <span className={`text-xs ${
                               value === "—" || value === "Pending" ? "text-slate-400" 
                               : isNet ? "font-bold text-slate-900 text-[13px]"
                               : "font-semibold text-slate-800"
                             }`}>
                               {value}
                             </span>
                           </div>
                         );
                       })}
                     </div>
                   </div>
                 ))}
               </div>
            )}
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white px-6 py-4 shrink-0">
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Jump to stage</p>
          <div className="flex gap-2 flex-wrap">
            {stageList.map((s) => {
              const isActive = s.key === stageKey;
              const sState   = row.flow[s.key];
              const sc2      = stageColor[sState];
              const SIcon    = s.icon;
              return (
                <button
                  key={s.key}
                  onClick={() => onStage(s.key)}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-semibold transition-all ${
                    isActive
                      ? "border-blue-400 bg-blue-600 text-white shadow-sm"
                      : `${sc2.badge} hover:opacity-75 cursor-pointer`
                  }`}
                >
                  <SIcon size={11} />
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function PRInq() {
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [branchFilter, setBranchFilter] = useState("All");
  const [fromDate, setFromDate]         = useState("");
  const [toDate, setToDate]             = useState("");
  const [drilldown, setDrilldown]       = useState(null);

  const stageList = [
    { key: "pr",  label: "PR",  name: "Purchase Requisition",     icon: FileText     },
    { key: "po",  label: "PO",  name: "Purchase Order",           icon: ShoppingCart },
    { key: "rr",  label: "RR",  name: "Receiving Report",         icon: PackageCheck },
    { key: "apv", label: "APV", name: "Accounts Payable Voucher", icon: Receipt      },
    { key: "cv",  label: "CV",  name: "Check Voucher",            icon: Wallet       },
  ];

  const data = [
    {
      prNo: "PR-2026-00041", prDate: "Apr 10, 2026",
      supplier: "ABC Industrial Supply", branch: "Main", department: "Operations",
      amount: "₱125,000.00", requestor: "J. Santos",
      currentStatus: "Completed", aging: "0 day", agingDays: 0,
      remarks: "Paid and released (Split 2 POs)", progress: 100,
      flow: { pr: "done", po: "done", rr: "done", apv: "done", cv: "done" },
      counts: { po: 2, rr: 3, apv: 2, cv: 2 }
    },
    {
      prNo: "PR-2026-00042", prDate: "Apr 11, 2026",
      supplier: "Prime Office Mart", branch: "Cebu", department: "Admin",
      amount: "₱48,560.00", requestor: "M. Cruz",
      currentStatus: "For APV", aging: "2 days", agingDays: 2,
      remarks: "Invoice received, for APV preparation", progress: 78,
      flow: { pr: "done", po: "done", rr: "done", apv: "active", cv: "todo" },
      counts: { po: 1, rr: 1, apv: 1, cv: 0 }
    },
    {
      prNo: "PR-2026-00043", prDate: "Apr 12, 2026",
      supplier: "Metro Builders Trading", branch: "Davao", department: "Engineering",
      amount: "₱312,900.00", requestor: "R. Dela Paz",
      currentStatus: "Partial RR", aging: "4 days", agingDays: 4,
      remarks: "Waiting balance delivery", progress: 62,
      flow: { pr: "done", po: "done", rr: "active", apv: "todo", cv: "todo" },
      counts: { po: 1, rr: 1, apv: 0, cv: 0 }
    },
    {
      prNo: "PR-2026-00044", prDate: "Apr 13, 2026",
      supplier: "Northstar Packaging", branch: "Main", department: "Production",
      amount: "₱89,750.00", requestor: "L. Garcia",
      currentStatus: "For PO Approval", aging: "1 day", agingDays: 1,
      remarks: "Pending purchasing approval", progress: 40,
      flow: { pr: "done", po: "active", rr: "todo", apv: "todo", cv: "todo" },
      counts: { po: 1, rr: 0, apv: 0, cv: 0 }
    },
    {
      prNo: "PR-2026-00045", prDate: "Apr 13, 2026",
      supplier: "Vertex Tech Solutions", branch: "Baguio", department: "IT",
      amount: "₱156,000.00", requestor: "A. Rivera",
      currentStatus: "Draft PR", aging: "Today", agingDays: 0,
      remarks: "Initial request encoded", progress: 15,
      flow: { pr: "active", po: "todo", rr: "todo", apv: "todo", cv: "todo" },
      counts: {}
    },
  ];

  const summary = [
    { title: "Total PR",     value: "148", sub: "+12 this week",         icon: FileText,     color: "text-blue-600",   bg: "bg-blue-50",    border: "border-blue-100",   trend: "+8.8%",        trendUp: true  },
    { title: "Active PO",    value: "26",  sub: "Ongoing purchases",      icon: ShoppingCart, color: "text-violet-600", bg: "bg-violet-50",  border: "border-violet-100", trend: "3 new today",  trendUp: true  },
    { title: "For APV",      value: "9",   sub: "Needs accounting action", icon: Receipt,      color: "text-amber-600",  bg: "bg-amber-50",   border: "border-amber-100",  trend: "Action needed",trendUp: false },
    { title: "Completed CV", value: "86",  sub: "Released and posted",     icon: Wallet,       color: "text-emerald-600",bg: "bg-emerald-50", border: "border-emerald-100",trend: "+3 today",     trendUp: true  },
  ];

  const filteredData = useMemo(() => data.filter((row) => {
    const matchesSearch = [row.prNo, row.supplier, row.branch, row.department, row.requestor, row.currentStatus]
      .join(" ").toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "All" || row.currentStatus === statusFilter;
    const matchesBranch = branchFilter === "All" || row.branch === branchFilter;

    const rowDate = new Date(row.prDate);
    const hasValidRowDate = !Number.isNaN(rowDate.getTime());
    const fromDateValue = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
    const toDateValue = toDate ? new Date(`${toDate}T23:59:59`) : null;
    const matchesFromDate = !fromDateValue || (hasValidRowDate && rowDate >= fromDateValue);
    const matchesToDate = !toDateValue || (hasValidRowDate && rowDate <= toDateValue);

    return matchesSearch && matchesStatus && matchesBranch && matchesFromDate && matchesToDate;
  }), [search, statusFilter, branchFilter, fromDate, toDate]);

  const branchOptions = useMemo(() => ["All", ...new Set(data.map((row) => row.branch))], []);

  const exportToExcel = () => {
    const headers = [
      "PR No",
      "PR Date",
      "Branch",
      "Supplier",
      "Department",
      "Requestor",
      "Amount",
      "Status",
      "Aging",
      "Remarks",
    ];

    const escapeCell = (value) => {
      const cell = `${value ?? ""}`.replace(/"/g, '""');
      return `"${cell}"`;
    };

    const rows = filteredData.map((row) => [
      row.prNo,
      row.prDate,
      row.branch,
      row.supplier,
      row.department,
      row.requestor,
      row.amount,
      row.currentStatus,
      row.aging,
      row.remarks,
    ]);

    const csvContent = [headers, ...rows].map((line) => line.map(escapeCell).join(",")).join("\n");
    const blob = new Blob([`\uFEFF${csvContent}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `transaction-monitor-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const statusConfig = {
    Completed:         { cls: "bg-emerald-100 text-emerald-700 border border-emerald-200", dot: "bg-emerald-500" },
    "For APV":         { cls: "bg-violet-100 text-violet-700 border border-violet-200",    dot: "bg-violet-500"  },
    "Partial RR":      { cls: "bg-sky-100 text-sky-700 border border-sky-200",             dot: "bg-sky-500"     },
    "For PO Approval": { cls: "bg-amber-100 text-amber-700 border border-amber-200",       dot: "bg-amber-500"   },
    "Draft PR":        { cls: "bg-slate-100 text-slate-600 border border-slate-200",       dot: "bg-slate-400"   },
  };

  const agingConfig = (d) =>
    d === 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
    : d <= 2 ? "bg-amber-50 text-amber-700 border border-amber-200"
    : "bg-red-50 text-red-700 border border-red-200";

  const agingIcon = (d) => d === 0 ? <CheckCircle2 size={12} /> : d <= 2 ? <Clock3 size={12} /> : <AlertCircle size={12} />;

  const progressColor = (p) =>
    p === 100 ? "bg-emerald-500" : p >= 60 ? "bg-blue-500" : p >= 30 ? "bg-amber-500" : "bg-slate-400";

  const stageStepStyle = {
    done:   { ring: "border-emerald-400 bg-emerald-500", text: "text-white"     },
    active: { ring: "border-amber-400 bg-amber-500",     text: "text-white"     },
    todo:   { ring: "border-slate-200 bg-white",         text: "text-slate-300" },
  };

  const bottlenecks = [
    { count: 7, label: "pending PO approval", detail: "beyond 2 days",         color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
    { count: 4, label: "partial RR pending",  detail: "awaiting final delivery",color: "text-sky-700",   bg: "bg-sky-50",   border: "border-sky-200"   },
  ];
  const completed = [
    { count: 3, label: "PR to CV cycles", detail: "completed today",      color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
    { count: 2, label: "APV posted",      detail: "for payment release",  color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  ];
  const suggestions = [
    { text: "Approval history timeline", icon: "🕐" },
    { text: "Document drilldown modal",  icon: "📄" },
    { text: "Per-stage aging KPI cards", icon: "📊" },
  ];

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6 mt-4 font-sans">
      <div className="mx-auto max-w-8xl space-y-6">

        {/* ── Header ── */}
        <section className="overflow-hidden rounded-[28px] bg-blue-600 p-6 text-white">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-blue-100">
                <Clock3 size={13} /> End-to-End Procurement Monitoring
              </div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">PR Tracker</h1>
              <p className="mt-2 max-w-xl text-sm text-blue-200 leading-relaxed">
                Monitor the full procurement lifecycle — PR to CV — track bottlenecks, splits, and optimize purchasing efficiency.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:min-w-[520px]">
              {summary.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-2xl bg-white p-4 flex flex-col gap-1 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-slate-500">{item.title}</span>
                      <div className={`flex h-7 w-7 items-center justify-center rounded-xl ${item.bg} ${item.border} border`}>
                        <Icon size={14} className={item.color} />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 leading-none">{item.value}</div>
                    <div className={`mt-1 inline-flex items-center gap-1 text-[11px] font-medium ${item.trendUp ? "text-emerald-600" : "text-amber-600"}`}>
                      <TrendingUp size={11} />{item.trend}
                    </div>
                    <div className="text-[11px] text-slate-400">{item.sub}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Tracker flow + search ── */}
        <section className="grid gap-4 lg:grid-cols-[1.2fr_2fr]">
          <div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="mb-5">
              <h2 className="text-base font-semibold text-slate-900">Procurement Flow</h2>
              <p className="text-xs text-slate-500 mt-0.5">5-stage lifecycle per transaction</p>
            </div>
            <div className="relative">
              <div className="absolute left-[21px] top-6 bottom-6 w-0.5 bg-slate-100 z-0" />
              <div className="space-y-3 relative z-10">
                {stageList.map((stage) => {
                  const Icon = stage.icon;
                  return (
                    <div key={stage.key} className="flex items-center gap-3">
                      <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border-2 bg-blue-600 border-blue-600 text-white shadow-sm">
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">{stage.label}</span>
                          <span className="text-slate-300 text-xs">·</span>
                          <span className="text-xs text-slate-500">{stage.name}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-slate-200 flex flex-col justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Transaction Monitor</h2>
                <p className="text-xs text-slate-500 mt-0.5">Search and filter live procurement records</p>
              </div>
              
              {/* EXPORT BUTTON */}
              <button
                type="button"
                onClick={exportToExcel}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <Download size={15} />
                Export Excel
              </button>
            </div>

            {/* REORGANIZED FILTER SECTION */}
            <div className="mt-4 flex flex-col gap-3">
              
              {/* Top Row: Status & Branch */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="relative">
                  <Filter size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-10 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 pl-9 pr-8 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
                  >
                    <option>All</option>
                    <option>Completed</option>
                    <option>For APV</option>
                    <option>Partial RR</option>
                    <option>For PO Approval</option>
                    <option>Draft PR</option>
                  </select>
                </div>
                <div className="relative">
                  <Building2 size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                    className="h-10 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 pl-9 pr-8 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
                  >
                    {branchOptions.map((branch) => (
                      <option key={branch} value={branch}>{branch}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Middle Row: From Date & To Date */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="relative">
                  <CalendarDays size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="h-10 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
                  />
                </div>
                <div className="relative">
                  <CalendarDays size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="h-10 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
                  />
                </div>
              </div>

              {/* Bottom Row: Search Bar */}
              <div className="relative">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search PR no, supplier, branch, department..."
                  className="h-10 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
                />
              </div>

            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400">
                Showing <span className="font-semibold text-slate-700">{filteredData.length}</span> of{" "}
                <span className="font-semibold text-slate-700">{data.length}</span> transactions
              </span>
              {statusFilter !== "All" && (
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${statusConfig[statusFilter]?.cls}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${statusConfig[statusFilter]?.dot}`} />
                  {statusFilter}
                </span>
              )}
              {branchFilter !== "All" && (
                <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  {branchFilter}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* ── Table ── */}
        <section className="rounded-[28px] bg-white shadow-sm ring-1 ring-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">PR Details</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Supplier / Branch / Dept</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">Amount</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 min-w-[260px]">
                    Flow Progress
                    <span className="ml-2 normal-case font-normal text-[10px] text-slate-300">↑ click any stage</span>
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Aging</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredData.map((row) => {
                  const sc = statusConfig[row.currentStatus];
                  return (
                    <tr key={row.prNo} className="hover:bg-slate-50/70 transition-colors">

                      <td className="px-5 py-4">
                        <div className="font-mono text-[13px] font-semibold text-blue-700">{row.prNo}</div>
                        <div className="mt-0.5 text-[11px] text-slate-400">{row.prDate}</div>
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <div className="h-5 w-5 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-600">
                            {row.requestor.split(".")[0].trim()}
                          </div>
                          <span className="text-[11px] text-slate-500">{row.requestor}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4 max-w-[200px]">
                        <div className="font-medium text-slate-800 text-[13px] leading-snug">{row.supplier}</div>
                        <div className="mt-0.5 inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                          {row.branch} · {row.department}
                        </div>
                        <div className="mt-1.5 text-[11px] text-slate-400 italic leading-snug">{row.remarks}</div>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="text-[15px] font-bold text-slate-900 tabular-nums">{row.amount}</div>
                      </td>

                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${sc.cls}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                          {row.currentStatus}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="mb-2.5 flex items-center gap-2">
                          <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div className={`h-full rounded-full transition-all ${progressColor(row.progress)}`}
                              style={{ width: `${row.progress}%` }} />
                          </div>
                          <span className="text-[11px] font-semibold text-slate-500 tabular-nums w-8 text-right">
                            {row.progress}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {stageList.map((stage, idx) => {
                            const s    = stageStepStyle[row.flow[stage.key]];
                            const Icon = stage.icon;
                            const stateKey = row.flow[stage.key];
                            const docCount = row.counts?.[stage.key] || 1;

                            return (
                              <React.Fragment key={stage.key}>
                                <button
                                  title={`View ${stage.name}`}
                                  onClick={() => setDrilldown({ row, stageKey: stage.key })}
                                  className="group relative flex flex-col items-center gap-1 rounded-xl p-1 transition-all hover:scale-110 active:scale-95 cursor-pointer"
                                >
                                  {docCount > 1 && (
                                    <span className="absolute -top-1 -right-0.5 flex h-[15px] w-[15px] items-center justify-center rounded-full bg-blue-600 text-[8px] font-bold text-white border-2 border-white shadow-sm z-10">
                                      {docCount}
                                    </span>
                                  )}
                                  
                                  <div className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all ${s.ring} group-hover:ring-2 group-hover:ring-offset-1 group-hover:ring-blue-200`}>
                                    <Icon size={12} className={s.text} />
                                  </div>
                                  <span className={`text-[9px] font-bold ${stateKey === "todo" ? "text-slate-300" : stateKey === "active" ? "text-amber-600" : "text-emerald-600"}`}>
                                    {stage.label}
                                  </span>
                                </button>
                                {idx < stageList.length - 1 && (
                                  <div className={`mb-3.5 h-px w-3 shrink-0 ${row.flow[stageList[idx + 1].key] === "todo" ? "bg-slate-200" : "bg-emerald-300"}`} />
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold ${agingConfig(row.agingDays)}`}>
                          {agingIcon(row.agingDays)}
                          {row.aging}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Bottom insights ── */}
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 border border-amber-200">
                <Clock3 size={15} className="text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Pending Bottlenecks</h3>
                <p className="text-[11px] text-slate-400">Requires immediate attention</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {bottlenecks.map((b, i) => (
                <div key={i} className={`flex items-start gap-3 rounded-2xl border ${b.border} ${b.bg} p-3`}>
                  <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white border ${b.border}`}>
                    <span className={`text-sm font-bold ${b.color}`}>{b.count}</span>
                  </div>
                  <div>
                    <div className={`text-xs font-semibold ${b.color}`}>{b.label}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{b.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200">
                <CheckCircle2 size={15} className="text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Today's Completed</h3>
                <p className="text-[11px] text-slate-400">As of end of day</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {completed.map((c, i) => (
                <div key={i} className={`flex items-start gap-3 rounded-2xl border ${c.border} ${c.bg} p-3`}>
                  <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white border ${c.border}`}>
                    <span className={`text-sm font-bold ${c.color}`}>{c.count}</span>
                  </div>
                  <div>
                    <div className={`text-xs font-semibold ${c.color}`}>{c.label}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{c.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 border border-blue-200">
                <Receipt size={15} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Suggested Enhancements</h3>
                <p className="text-[11px] text-slate-400">Next widgets to build</p>
              </div>
            </div>
            <div className="space-y-2">
              {suggestions.map((s, i) => (
                <div key={i} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                  <span className="text-base">{s.icon}</span>
                  <span className="text-xs font-medium text-slate-600">{s.text}</span>
                  <ChevronRight size={13} className="ml-auto text-slate-300" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ── Drilldown modal ── */}
      {drilldown && (
        <DrilldownModal
          row={drilldown.row}
          stageKey={drilldown.stageKey}
          stageList={stageList}
          onClose={() => setDrilldown(null)}
          onStage={(key) => setDrilldown({ row: drilldown.row, stageKey: key })}
        />
      )}
    </div>
  );
}