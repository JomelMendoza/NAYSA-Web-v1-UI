
import React, { useRef } from "react";
import { PatternFormat } from "react-number-format";

export const isStrictDateAllowed = ({ value }) => {
  const cleaned = String(value || "").replace(/\D/g, "").slice(0, 8);

  const month = cleaned.slice(0, 2);
  const day = cleaned.slice(2, 4);
  const year = cleaned.slice(4, 8);

  if (month.length === 1 && !["0", "1"].includes(month)) return false;
  if (month.length === 2) {
    const m = Number(month);
    if (m < 1 || m > 12) return false;
  }

  if (day.length === 1 && !["0", "1", "2", "3"].includes(day)) return false;
  if (day.length === 2) {
    const d = Number(day);
    if (d < 1 || d > 31) return false;
  }

  if (year.length === 1 && !["1", "2"].includes(year)) return false;
  if (year.length === 4) {
    const y = Number(year);
    if (y < 1900 || y > 2099) return false;
  }

  return true;
};

export const usehandleDateChange = (value, field, updateState) => {
  const cleaned = String(value || "").replace(/\D/g, "").slice(0, 8);

  let formatted = cleaned;

  if (cleaned.length > 2 && cleaned.length <= 4) {
    formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
  } else if (cleaned.length > 4) {
    formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
  }

  updateState({ [field]: formatted });
};

export const usehandleDateBlur = (value, field, updateState) => {
  const dateStr = String(value || "").trim();

  if (!dateStr) {
    updateState({ [field]: "" });
    return false;
  }

  const regex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;

  if (!regex.test(dateStr)) {
    updateState({ [field]: "" });
    return false;
  }

  const [month, day, year] = dateStr.split("/").map(Number);

  if (year < 1900 || year > 2099) {
    updateState({ [field]: "" });
    return false;
  }

  const maxDay = new Date(year, month, 0).getDate();

  if (day < 1 || day > maxDay) {
    updateState({ [field]: "" });
    return false;
  }

  const parsed = new Date(year, month - 1, day);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    updateState({ [field]: "" });
    return false;
  }

  updateState({ [field]: dateStr });
  return true;
};

export const formatDateToMMDDYYYY = (value) => {
  if (!value) return "";

  const raw = String(value).trim();
  const datePart = raw.includes("T") ? raw.split("T")[0] : raw;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return "";

  const [year, month, day] = datePart.split("-");
  return `${month}/${day}/${year}`;
};

export const formatDateToYYYYMMDD = (value) => {
  if (!value) return "";

  const raw = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return "";

  const [month, day, year] = raw.split("/");
  return `${year}-${month}-${day}`;
};

const DateFormatInput = ({
  id,
  name,
  value,
  updateState,
  disabled = false,
  className = "peer global-tran-textbox-ui pr-10",
  placeholder = "mm/dd/yyyy",
  onChangeCustom,
  onBlurCustom,
  showCalendar = true,
  ...props
}) => {
  const fieldName = name || id;
  const nativeDateRef = useRef(null);

  const handleBlur = (e) => {
    const isValid = usehandleDateBlur(value || "", fieldName, updateState);

    if (onBlurCustom) {
      onBlurCustom(e, {
        value: value || "",
        field: fieldName,
        isValid,
      });
    }
  };

  const handleOpenCalendar = () => {
    if (disabled || !nativeDateRef.current) return;

    if (typeof nativeDateRef.current.showPicker === "function") {
      nativeDateRef.current.showPicker();
    } else {
      nativeDateRef.current.focus();
      nativeDateRef.current.click();
    }
  };

  const handleNativeDateChange = (e) => {
    const selectedValue = e.target.value; // yyyy-mm-dd
    const formattedValue = formatDateToMMDDYYYY(selectedValue);

    updateState({ [fieldName]: formattedValue });

    if (onChangeCustom) {
      onChangeCustom(selectedValue, fieldName, formattedValue);
    }
  };

  return (
    <div className="relative w-full">
      <PatternFormat
        id={id}
        name={fieldName}
        value={value || ""}
        format="##/##/####"
        mask=""
        placeholder={placeholder}
        inputMode="numeric"
        className={className}
        disabled={disabled}
        isAllowed={isStrictDateAllowed}
        onValueChange={(values) => {
          usehandleDateChange(values.value, fieldName, updateState);

          if (onChangeCustom) {
            onChangeCustom(values.value, fieldName, values.formattedValue);
          }
        }}
        onBlur={handleBlur}
        {...props}
      />

      {showCalendar && !disabled && (
        <>
          <button
            type="button"
            onClick={handleOpenCalendar}
            className="absolute top-1/2 right-2 -translate-y-1/2 text-gray-500 text-sm"
            tabIndex={-1}
          >
            📅
          </button>

          <input
            ref={nativeDateRef}
            type="date"
            value={formatDateToYYYYMMDD(value || "")}
            onChange={handleNativeDateChange}
            tabIndex={-1}
            style={{
              position: "absolute",
              width: 1,
              height: 1,
              opacity: 0,
              pointerEvents: "none",
            }}
          />
        </>
      )}
    </div>
  );
};

export default DateFormatInput;