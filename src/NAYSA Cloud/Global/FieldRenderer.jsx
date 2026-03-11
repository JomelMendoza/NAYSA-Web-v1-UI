import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

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
    rounded-lg
    ${isEnabled ? "global-ref-textbox-enabled" : "global-ref-textbox-disabled"}
    ${readOnly || isAudit ? "cursor-default" : ""}
    focus-visible:ring-0 focus-visible:ring-offset-0
    border shadow-none transition-all
  `;

  const labelClass = `global-ref-floating-label ${
    isEnabled ? "global-ref-label-enabled" : "global-ref-label-disabled"
  }`;

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
  };

  const renderLabel = () => (
    <label htmlFor={inputId} className={labelClass}>
      {required && <span className="global-ref-asterisk-ui mr-1">*</span>}
      {label}
    </label>
  );

  return (
    <div className="relative w-full">
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
              absolute right-0 h-6 sm:h-8 w-8 flex items-center justify-center rounded
              ${!disabled ? "bg-blue-200 text-blue-800 hover:bg-blue-600 hover:text-blue-50" : "bg-gray-200 text-gray-400"}
            `}
          >
            <FontAwesomeIcon icon={faMagnifyingGlass} className="text-[12px]" />
          </button>
          {renderLabel()}
        </div>
      )}

      {/* 2. TEXT / NUMBER / DATE FIELDS (Shadcn Input) */}
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
          />
          {renderLabel()}
        </>
      )}

      {/* 3. SELECT FIELD */}
      {type === "select" && (
        <>
          <Select
            value={value !== undefined && value !== null ? String(value) : ""} 
            onValueChange={(newVal) => handleChange(newVal)}
            disabled={disabled || readOnly || isAudit}
          >
            <SelectTrigger
              id={inputId}
              className={`${sharedClasses} flex items-center justify-between bg-transparent !leading-none`}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            
            <SelectContent className="rounded-xl">
              {options.map((opt) => (
                <SelectItem 
                  key={String(opt.value)} 
                  value={String(opt.value)} 
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