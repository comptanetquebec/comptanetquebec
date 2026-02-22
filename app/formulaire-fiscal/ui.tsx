"use client";

import React, { useId } from "react";

export type YesNo = "oui" | "non" | "";
export type FieldStatus = "valid" | "invalid" | null;

/* ===========================
   helpers
=========================== */
function statusClass(status?: FieldStatus) {
  if (status === "valid") return "ff-valid";
  if (status === "invalid") return "ff-invalid";
  return "";
}

/* ===========================
   Field
=========================== */

export type FieldProps = {
  label: React.ReactNode;
  value: string;
  onChange: (v: string) => void;

  required?: boolean;
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
  formatter?: (v: string) => string;

  autoComplete?: string;
  name?: string;
  min?: string | number;
  max?: string | number;
  pattern?: string;
  disabled?: boolean;

  // ✅ vert/rouge
  status?: FieldStatus;
  hint?: React.ReactNode;
};

export function Field({
  label,
  value,
  onChange,
  required = false,
  placeholder,
  type = "text",
  inputMode,
  maxLength,
  formatter,
  autoComplete,
  name,
  min,
  max,
  pattern,
  disabled = false,
  status = null,
  hint,
}: FieldProps) {
  const id = useId();
  const cls = statusClass(status);

  return (
    <div className={`ff-field ${cls}`}>
      <label className="ff-label" htmlFor={id}>
        {label}
        {required ? " *" : ""}
      </label>

      <input
        id={id}
        name={name}
        className="ff-input"
        value={value}
        onChange={(e) => {
          const raw = e.currentTarget.value;
          onChange(formatter ? formatter(raw) : raw);
        }}
        placeholder={placeholder}
        required={required}
        aria-required={required || undefined}
        aria-invalid={status === "invalid" ? true : undefined}
        type={type}
        inputMode={inputMode}
        maxLength={maxLength}
        autoComplete={autoComplete}
        min={min}
        max={max}
        pattern={pattern}
        disabled={disabled}
      />

      {hint ? <div className="ff-hint">{hint}</div> : null}
    </div>
  );
}

/* ===========================
   CheckboxField
=========================== */

export type CheckboxFieldProps = {
  label: React.ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;

  // ✅ vert/rouge (souvent utilisé pour confirmations obligatoires)
  status?: FieldStatus;
  hint?: React.ReactNode;
};

export function CheckboxField({
  label,
  checked,
  onChange,
  disabled = false,
  status = null,
  hint,
}: CheckboxFieldProps) {
  const id = useId();
  const cls = statusClass(status);

  return (
    <div className={`ff-check ${cls}`}>
      <input
        id={id}
        type="checkbox"
        className="ff-checkbox"
        checked={checked}
        onChange={(e) => onChange(e.currentTarget.checked)}
        disabled={disabled}
        aria-invalid={status === "invalid" ? true : undefined}
      />
      <label htmlFor={id}>{label}</label>

      {hint ? <div className="ff-hint">{hint}</div> : null}
    </div>
  );
}

/* ===========================
   YesNoField (SANS “EFFACER”)
=========================== */

export type YesNoFieldProps = {
  label: React.ReactNode;
  value: YesNo;
  onChange: (v: YesNo) => void;
  name: string; // stable
  required?: boolean;
  disabled?: boolean;
  labels?: { yes: string; no: string };

  // ✅ vert/rouge
  status?: FieldStatus;
  hint?: React.ReactNode;
};

export function YesNoField({
  label,
  value,
  onChange,
  name,
  required = false,
  disabled = false,
  labels = { yes: "Oui", no: "Non" },
  status = null,
  hint,
}: YesNoFieldProps) {
  const cls = statusClass(status);

  return (
    <div className={`ff-yn ${cls}`}>
      <div className="ff-label">
        {label}
        {required ? " *" : ""}
      </div>

      <div
        className="ff-yn-row"
        aria-invalid={status === "invalid" ? true : undefined}
      >
        <label className="ff-radio">
          <input
            type="radio"
            name={name}
            value="oui"
            checked={value === "oui"}
            onChange={() => onChange("oui")}
            required={required}
            disabled={disabled}
          />
          <span>{labels.yes}</span>
        </label>

        <label className="ff-radio">
          <input
            type="radio"
            name={name}
            value="non"
            checked={value === "non"}
            onChange={() => onChange("non")}
            required={required}
            disabled={disabled}
          />
          <span>{labels.no}</span>
        </label>
      </div>

      {hint ? <div className="ff-hint">{hint}</div> : null}
    </div>
  );
}

/* ===========================
   SelectField
=========================== */

export type SelectOption<T extends string> = {
  value: Exclude<T, "">;
  label: string;
};

export type SelectFieldProps<T extends string> = {
  label: React.ReactNode;
  value: T;
  onChange: (v: T) => void;
  options: Array<SelectOption<T>>;
  required?: boolean;
  placeholderText?: string;
  disabled?: boolean;
  name?: string;
  autoComplete?: string;

  // ✅ vert/rouge
  status?: FieldStatus;
  hint?: React.ReactNode;
};

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  required = false,
  placeholderText,
  disabled = false,
  name,
  autoComplete,
  status = null,
  hint,
}: SelectFieldProps<T>) {
  const id = useId();
  const cls = statusClass(status);

  return (
    <div className={`ff-field ${cls}`}>
      <label className="ff-label" htmlFor={id}>
        {label}
        {required ? " *" : ""}
      </label>

      <select
        id={id}
        name={name}
        className="ff-select"
        value={value}
        onChange={(e) => onChange(e.currentTarget.value as T)}
        required={required}
        aria-required={required || undefined}
        aria-invalid={status === "invalid" ? true : undefined}
        disabled={disabled}
        autoComplete={autoComplete}
      >
        <option value="">{placeholderText ?? (required ? "Choisir…" : "—")}</option>

        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {hint ? <div className="ff-hint">{hint}</div> : null}
    </div>
  );
}
