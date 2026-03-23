import React from "react";
<<<<<<< HEAD
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
=======
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
>>>>>>> 701b926012ee5f3eb7e717f57ad3049d410c556c

// Shadcn UI Component Imports
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const FieldRenderer = ({
  id,
  name,
  label,
  required = false,
  type = "text",
  value,
  onChange,
  onLookup,
  onBlur,
  onKeyDown,
  disabled,
  options = [],
  readOnly = false,
  placeholder = " ",
  inputRef,
<<<<<<< HEAD
  variant = "default", // "default" or "audit"
=======
  variant = "default",
>>>>>>> 701b926012ee5f3eb7e717f57ad3049d410c556c
  maxLength,
  onPaste,
  ...props
}) => {
  const isAudit = variant === "audit";
  const isEnabled = !disabled || isAudit;

  const labelText = typeof label === "string" ? label : "";
  const idSource = id || name || labelText;

  const inputId = idSource
    ? String(idSource).toLowerCase().replace(/[^a-z0-9]+/gi, "_")
    : undefined;

<<<<<<< HEAD
  /**
   * SHARED MINIMIZED STYLES
   * h-8: Compact height (32px)
   * !text-xs: Minimized font size (12px)
   * !px-2: Tightened horizontal padding
   */
  const sharedClasses = `
    peer w-full 
    h-6 sm:h-8
    !px-2 
    text-[10px] sm:text-[12px] font-normal
    focus-visible:ring-0 focus-visible:ring-offset-0
    border shadow-none transition-all
=======
  const sharedClasses = `
    peer w-full h-8 sm:h-8
    global-ref-textbox-ui 
    !px-2 
    !font-normal
>>>>>>> 701b926012ee5f3eb7e717f57ad3049d410c556c
    rounded-lg
    ${isEnabled ? "global-ref-textbox-enabled" : "global-ref-textbox-disabled"}
    ${readOnly || isAudit ? "cursor-default" : ""}
    focus-visible:ring-0 focus-visible:ring-offset-0
    border shadow-none transition-all
  `;

  const labelClass = `global-ref-floating-label ${
    isEnabled ? "global-ref-label-enabled" : "global-ref-label-disabled"
  }`;

<<<<<<< HEAD
  // const handleChange = (e) => {
  //   if (!onChange || readOnly || isAudit) return;
    
  //   const val = e?.target ? e.target.value : e;
    
  //   if (name) onChange({ target: { name, value: val } });
  //   else onChange(val);
  // };

// add/keep this
  const ml = Number(maxLength) > 0 ? Number(maxLength) : undefined;

  const handleChange = (e) => {
    if (!onChange || readOnly || isAudit) return;

    const raw = e?.target ? e.target.value : e;

    // ✅ enforce max length
    const val =
      ml && typeof raw === "string" ? raw.slice(0, ml) : raw;

    if (name) onChange({ target: { name, value: val } });
    else onChange(val);
=======
  const getDisplayValue = (val, fieldType = "text") => {
    if (val === undefined || val === null) return "";
    if (typeof val !== "object") return String(val);

    if (fieldType === "select") {
      return val.value !== undefined && val.value !== null ? String(val.value) : "";
    }

    return val.label ?? val.value ?? "";
  };

  const handleChange = (val) => {
    if (!onChange || readOnly || isAudit) return;

    const isEvent = val && typeof val === "object" && "target" in val;
    const finalValue = isEvent ? val.target.value : val;

    onChange(finalValue);
>>>>>>> 701b926012ee5f3eb7e717f57ad3049d410c556c
  };

  const renderLabel = () => (
    <label htmlFor={inputId} className={labelClass}>
      {required && <span className="global-ref-asterisk-ui mr-1">*</span>}
      {label}
    </label>
  );

  return (
    <div className="relative w-full">
<<<<<<< HEAD
      {/* 1. LOOKUP FIELD (Shadcn Input + Icon Button) */}
      {type === "lookup" && (
        <div className="relative flex items-center">
          <Input
            id={inputId}
            value={value || ""}
            readOnly
            placeholder={placeholder}
            className={`${sharedClasses} cursor-pointer pr-10`}
            onClick={() => isEnabled && !isAudit && onLookup?.()}
          />
          <button
            type="button"
            onClick={() => isEnabled && onLookup?.()}
            disabled={!isEnabled || isAudit}
            className={`
              absolute right-0 h-7 sm:h-8 w-8 flex items-center justify-center rounded
              ${!disabled ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-200 text-gray-400"}
            `}
          >
            <FontAwesomeIcon icon={faMagnifyingGlass} className="text-[12px]" />
=======
      {type === "lookup" && (
        <div className="relative flex items-center w-full">
          <Input
            id={inputId}
            value={getDisplayValue(value, "lookup")}
            readOnly
            placeholder={placeholder}
            className={`${sharedClasses} cursor-pointer pr-12`}
            onClick={() => !disabled && !isAudit && onLookup?.()}
          />
          <button
            type="button"
            onClick={() => !disabled && !isAudit && onLookup?.()}
            disabled={disabled || isAudit}
            title="Search"
            className={`
              absolute right-0 top-0 h-8 sm:h-8 w-10 flex items-center justify-center
              rounded-r-lg border border-l-0 transition-colors
              ${
                !disabled && !isAudit
                  ? "bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white"
                  : "bg-gray-100 text-gray-400"
              }
            `}
          >
            <Search className="h-4 w-4" strokeWidth={3} />
>>>>>>> 701b926012ee5f3eb7e717f57ad3049d410c556c
          </button>
          {renderLabel()}
        </div>
      )}

<<<<<<< HEAD
      {/* 2. TEXT / NUMBER / DATE FIELDS (Shadcn Input) */}
=======
>>>>>>> 701b926012ee5f3eb7e717f57ad3049d410c556c
      {(type === "text" || type === "number" || type === "date") && (
        <>
          <Input
            id={inputId}
            ref={inputRef}
            type={type}
            placeholder={placeholder}
<<<<<<< HEAD
            value={value || ""}
=======
            value={getDisplayValue(value, type)}
>>>>>>> 701b926012ee5f3eb7e717f57ad3049d410c556c
            onChange={handleChange}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            disabled={disabled}
            readOnly={readOnly || isAudit}
            className={sharedClasses}
<<<<<<< HEAD
            maxLength={type === "text" ? ml : undefined}  // ✅ only for text
            onPaste={(e) => {
              if (!ml) return;
              const paste = e.clipboardData.getData("text") || "";
              const current = value || "";
              if ((current + paste).length > ml) e.preventDefault();
            }}
=======
            maxLength={maxLength}
            onPaste={onPaste}
            {...props}
>>>>>>> 701b926012ee5f3eb7e717f57ad3049d410c556c
          />
          {renderLabel()}
        </>
      )}

<<<<<<< HEAD
      {/* 3. SELECT FIELD */}
      {type === "select" && (
        <>
          <Select
            value={value !== undefined && value !== null ? String(value) : ""} 
=======
      {type === "select" && (
        <>
          <Select
            value={getDisplayValue(value, "select")}
>>>>>>> 701b926012ee5f3eb7e717f57ad3049d410c556c
            onValueChange={(newVal) => handleChange(newVal)}
            disabled={disabled || readOnly || isAudit}
          >
            <SelectTrigger
              id={inputId}
              className={`${sharedClasses} flex items-center justify-between bg-transparent !leading-none`}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
<<<<<<< HEAD
            
            <SelectContent className="rounded-xl">
              {options.map((opt) => (
                <SelectItem 
                  key={String(opt.value)} 
                  value={String(opt.value)} 
=======

            <SelectContent className="rounded-xl">
              {options.map((opt) => (
                <SelectItem
                  key={String(opt.value)}
                  value={String(opt.value)}
>>>>>>> 701b926012ee5f3eb7e717f57ad3049d410c556c
                  className="text-xs rounded-lg"
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {renderLabel()}
        </>
      )}
    </div>
  );
};

export default FieldRenderer;