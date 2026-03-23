import React from "react";
import FieldRenderer from "./FieldRenderer";

const RegistrationInfo = ({ data = {}, layout = "stacked", showHeader = true }) => {
  const v = data || {};

  const parseSqlLocal = (value) => {
    if (!value) return null;
    const s = String(value).trim();
    const [datePart, timePartRaw] = s.includes("T") ? s.split("T") : s.split(" ");
    if (!datePart) return null;

    const [yyyy, mm, dd] = datePart.split("-").map(Number);
    if (!yyyy || !mm || !dd) return null;

    let hh = 0, mi = 0, ss = 0;
    if (timePartRaw) {
      const timePart = timePartRaw.split(".")[0];
      const t = timePart.split(":").map(Number);
      hh = t[0] || 0;
      mi = t[1] || 0;
      ss = t[2] || 0;
    }
    return new Date(yyyy, mm - 1, dd, hh, mi, ss);
  };

  const formatDateTime = (value) => {
    const d = parseSqlLocal(value);
    if (!d) return value ? String(value) : "";

    const monthsFull = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const pad = (n) => String(n).padStart(2, "0");

    let hours = d.getHours();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;

    return `${monthsFull[d.getMonth()]} ${pad(d.getDate())}, ${d.getFullYear()} ${pad(
      hours
    )}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${ampm}`;
  };

  const auditFields = [
    { label: "Registered By", value: v.registeredBy },
    { label: "Registered Date", value: formatDateTime(v.registeredDate) },
    { label: "Updated By", value: v.lastUpdatedBy },
    { label: "Updated Date", value: formatDateTime(v.lastUpdatedDate) },
  ];

// ... inside RegistrationInfo component

const getAuditClasses = (isReadOnly) => `
  peer w-full 
  h-6 sm:h-8
  !px-2 
  text-[10px] sm:text-[12px] font-normal
  focus-visible:ring-0 focus-visible:ring-offset-0
  border shadow-none transition-all
  bg-gray-50 border-gray-200 text-gray-500
  ${isReadOnly ? "cursor-default" : ""}
`;

const renderFields = () =>
  auditFields.map((field) => (
    <FieldRenderer
      key={field.label}
      type="text"
      label={field.label}
      value={field.value || ""}
      readOnly={true}
      disabled={true}     
      variant="audit"    
      // Pass the classes here
      className={getAuditClasses(true)}
    />
  ));

  return (
    <div className="bg-white p-4 rounded-lg border shadow-lg h-full flex flex-col gap-4 min-w-[300px]">
      {showHeader && (
        <h3 className="text-[9px] sm:text-[12px] font-bold text-slate-500 tracking-widest border-b pb-2 uppercase">
          Registration Information
        </h3>
      )}
      
      <div className={layout === "twoCols" 
        ? "grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4" 
        : "flex flex-col gap-4"}
      >
        {renderFields()}
      </div>
    </div>
  );
};

export default RegistrationInfo;