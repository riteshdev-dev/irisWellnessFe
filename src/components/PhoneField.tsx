import { getCountryCallingCode, type CountryCode } from "libphonenumber-js";
import { CountrySelect } from "./CountrySelect.tsx";

interface PhoneFieldProps {
  country: string;
  number: string;
  onCountryChange: (iso2: string) => void;
  onNumberChange: (value: string) => void;
  invalid?: boolean;
  label?: string;
  required?: boolean;
}

export function PhoneField({
  country,
  number,
  onCountryChange,
  onNumberChange,
  invalid = false,
  label = "Mobile number",
  required = false,
}: PhoneFieldProps) {
  const dialCode = country ? `+${getCountryCallingCode(country as CountryCode)}` : "";

  return (
    <div className="portal-field phone-field-compact">
      <span id="phone-number-label" className="portal-select-label sc-label">
        {label} {required && <span className="sc-required">*</span>}
      </span>
      <div className="portal-phone-row">
        <CountrySelect
          id="phone-country"
          label="Phone country"
          value={country}
          onChange={onCountryChange}
          variant="dial"
          invalid={invalid && !country}
          hideLabel
          placeholder="Code"
        />
        <div className="portal-phone-entry">
          <input
            id="phone-number"
            name="phoneNumber"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            value={number}
            onChange={(event) => onNumberChange(event.target.value)}
            placeholder={dialCode ? `${dialCode} mobile number` : "Enter mobile number"}
            aria-invalid={invalid}
            aria-labelledby="phone-number-label"
          />
        </div>
      </div>
    </div>
  );
}
