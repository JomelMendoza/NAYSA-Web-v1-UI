import React from "react";
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
}) => {
  // ✅ LOGIC: If variant is "audit", we bypass disabled styling to keep it looking clean/white
  const isAudit = variant === "audit";
  const isEnabled = !disabled || isAudit;

  const labelText = typeof label === "string" ? label : "";
  const idSource = id || name || labelText;

  const inputId = idSource
    ? String(idSource)
        .toLowerCase()
        .replace(/[^a-z0-9]+/gi, "_")
    : undefined;

  // ✅ SHARED CLASSES: Conditional styling based on isEnabled (or audit bypass)
  const sharedClasses = `
    peer w-full h-10
    global-ref-textbox-ui 
    !px-4 
    !text-xs font-normal
    rounded-lg
    ${isEnabled ? "global-ref-textbox-enabled" : "global-ref-textbox-disabled"}
    ${readOnly || isAudit ? "cursor-default" : ""}
    focus-visible:ring-0 focus-visible:ring-offset-0
    border shadow-none transition-all
  `;

  const labelClass = `global-ref-floating-label ${
    isEnabled ? "global-ref-label-enabled" : "global-ref-label-disabled"
  }`;

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
  };

  const renderLabel = () => (
    <label htmlFor={inputId} className={labelClass}>
      {required && <span className="global-ref-asterisk-ui mr-1">*</span>}
      {label}
    </label>
  );

  return (
    <div className="relative w-full">

      {type === "lookup" && (
        <div className="relative flex items-center w-full">
          <Input
            id={inputId}
            value={value || ""}
            readOnly
            placeholder={placeholder}
            className={`${sharedClasses} cursor-pointer pr-12 !rounded-r-none`}
            onClick={() => !disabled && !isAudit && onLookup?.()}
          />
          <button
            type="button"
            onClick={() => !disabled && onLookup?.()}
            disabled={disabled || isAudit}
            className={`
        absolute right-0 top-0 h-10 w-10 flex items-center justify-center
        rounded-r-sm border border-l-0  transition-colors
        ${
          !disabled && !isAudit
            ? "bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-200 hover:text-blue transition-colors"
            : "bg-gray-100 text-gray-400 border-gray-300"
        }
      `}
          >
            
            <Search className="h-4 w-4" strokeWidth={3} />
          </button>
          {renderLabel()}
        </div>
      )}

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
