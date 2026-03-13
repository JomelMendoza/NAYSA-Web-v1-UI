import React from "react";
<<<<<<< HEAD
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
=======
import { Search } from "lucide-react";

// Shadcn UI Component Imports
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
>>>>>>> d15a2d968d9eeb894dfd79bbb993444e4a8a0121

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
  variant = "default", // "default" or "audit"
<<<<<<< HEAD
  maxLength,
  onPaste,
  ...props
}) => {
=======
}) => {
  // ✅ LOGIC: If variant is "audit", we bypass disabled styling to keep it looking clean/white
>>>>>>> d15a2d968d9eeb894dfd79bbb993444e4a8a0121
  const isAudit = variant === "audit";
  const isEnabled = !disabled || isAudit;

  const labelText = typeof label === "string" ? label : "";
  const idSource = id || name || labelText;

  const inputId = idSource
<<<<<<< HEAD
    ? String(idSource).toLowerCase().replace(/[^a-z0-9]+/gi, "_")
    : undefined;

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
    ? String(idSource)
        .toLowerCase()
        .replace(/[^a-z0-9]+/gi, "_")
    : undefined;

  // ✅ SHARED CLASSES: Conditional styling based on isEnabled (or audit bypass)
  const sharedClasses = `
    peer w-full h-8 sm:h-8
    global-ref-textbox-ui 
    !px-2 
    !font-normal
>>>>>>> d15a2d968d9eeb894dfd79bbb993444e4a8a0121
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
  const handleChange = (val) => {
    if (!onChange || readOnly || isAudit) return;

    const isEvent = val && typeof val === "object" && "target" in val;
    const finalValue = isEvent ? val.target.value : val;

    if (!isEvent) {
      onChange(finalValue);
      return;
    }

    if (name) {
      onChange({
        target: {
          name,
          value: finalValue,
        },
      });
    } else {
      onChange(val);
    }
>>>>>>> d15a2d968d9eeb894dfd79bbb993444e4a8a0121
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
=======

      {type === "lookup" && (
        <div className="relative flex items-center w-full">
>>>>>>> d15a2d968d9eeb894dfd79bbb993444e4a8a0121
          <Input
            id={inputId}
            value={value || ""}
            readOnly
            placeholder={placeholder}
<<<<<<< HEAD
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
            className={`${sharedClasses} cursor-pointer pr-12 !important`}
            onClick={() => !disabled && !isAudit && onLookup?.()}
          />
          <button
            type="button"
            onClick={() => !disabled && onLookup?.()}
            disabled={disabled || isAudit}
            title="Search"
            className={`
              absolute right-0 top-0 h-8 sm:h-8 w-10 flex items-center justify-center
              rounded-r-lg border border-l-0  transition-colors
        ${
          !disabled && !isAudit
            ? "bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors"
            : "bg-gray-100 text-gray-400"
        }
      `}
          >
            
            <Search className="h-4 w-4" strokeWidth={3} />
>>>>>>> d15a2d968d9eeb894dfd79bbb993444e4a8a0121
          </button>
          {renderLabel()}
        </div>
      )}

<<<<<<< HEAD
      {/* 2. TEXT / NUMBER / DATE FIELDS (Shadcn Input) */}
=======
>>>>>>> d15a2d968d9eeb894dfd79bbb993444e4a8a0121
      {(type === "text" || type === "number" || type === "date") && (
        <>
          <Input
            id={inputId}
            ref={inputRef}
            type={type}
            placeholder={placeholder}
            value={value || ""}
            onChange={handleChange}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
<<<<<<< HEAD
            disabled={disabled}
            readOnly={readOnly || isAudit}
            className={sharedClasses}
            maxLength={type === "text" ? ml : undefined}  // ✅ only for text
            onPaste={(e) => {
              if (!ml) return;
              const paste = e.clipboardData.getData("text") || "";
              const current = value || "";
              if ((current + paste).length > ml) e.preventDefault();
            }}
=======
            disabled={disabled} 
            readOnly={readOnly || isAudit}
            className={sharedClasses}
>>>>>>> d15a2d968d9eeb894dfd79bbb993444e4a8a0121
          />
          {renderLabel()}
        </>
      )}

      {/* 3. SELECT FIELD */}
      {type === "select" && (
        <>
          <Select
<<<<<<< HEAD
            value={value !== undefined && value !== null ? String(value) : ""} 
=======
            value={value !== undefined && value !== null ? String(value) : ""}
>>>>>>> d15a2d968d9eeb894dfd79bbb993444e4a8a0121
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
>>>>>>> d15a2d968d9eeb894dfd79bbb993444e4a8a0121
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