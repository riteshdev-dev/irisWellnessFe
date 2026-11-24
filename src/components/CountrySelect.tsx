import { useEffect, useId, useMemo, useRef, useState } from "react";
import { countryByIso, countries, type CountryOption } from "../data/countries.ts";
import { CountryFlag } from "./CountryFlag.tsx";

interface CountrySelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (iso2: string) => void;
  variant: "nationality" | "dial";
  invalid?: boolean;
  hideLabel?: boolean;
  placeholder?: string;
}

export function CountrySelect({
  id,
  label,
  value,
  onChange,
  variant,
  invalid = false,
  hideLabel = false,
  placeholder,
}: CountrySelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = countryByIso(value);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return countries;
    }

    return countries.filter((country) => {
      return (
        country.name.toLowerCase().includes(term) ||
        country.iso2.toLowerCase().includes(term) ||
        country.dialCode.includes(term.replace(/\s/g, ""))
      );
    });
  }, [query]);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  function choose(country: CountryOption) {
    onChange(country.iso2);
    setOpen(false);
    setQuery("");
  }

  return (
    <div
      className={`portal-select ${variant === "dial" ? "portal-select-dial" : "portal-select-country"}`}
      ref={rootRef}
    >
      <span
        className={hideLabel ? "portal-visually-hidden" : "portal-select-label"}
        id={`${id}-label`}
      >
        {label}
      </span>
      <button
        id={id}
        type="button"
        className="portal-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-invalid={invalid}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="portal-select-value" style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, overflow: "hidden" }}>
          {selected ? (
            <>
              <CountryFlag iso2={selected.iso2} />
              <span className="portal-selected-text">
                {variant === "dial" ? selected.dialCode : selected.name}
              </span>
            </>
          ) : (
            <span className="portal-select-placeholder">
              {placeholder ?? (variant === "dial" ? "Code" : "Select country")}
            </span>
          )}
        </span>
        <span className="portal-select-chevron" aria-hidden="true">
          ▾
        </span>
      </button>

      {open ? (
        <div className={`portal-select-menu ${variant === "dial" ? "portal-dial-menu" : "portal-country-menu"}`}>
          <input
            className="portal-select-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search country..."
            aria-label={`Search ${label.toLowerCase()}`}
            autoFocus
          />
          <ul id={listId} role="listbox" aria-labelledby={`${id}-label`}>
            {results.length === 0 ? <li className="portal-select-empty">No countries found</li> : null}
            {results.map((country) => (
              <li key={country.iso2}>
                <button
                  type="button"
                  role="option"
                  aria-selected={country.iso2 === value}
                  onClick={() => choose(country)}
                >
                  <CountryFlag iso2={country.iso2} />
                  <span className="portal-country-name">{country.name}</span>
                  {variant === "dial" && <span className="portal-dial">{country.dialCode}</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
