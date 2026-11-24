import { getCountries, getCountryCallingCode, isValidPhoneNumber, type CountryCode } from "libphonenumber-js";

export interface CountryOption {
  iso2: CountryCode;
  name: string;
  dialCode: string;
}

const displayNames = new Intl.DisplayNames(["en"], { type: "region" });

export const countries: CountryOption[] = getCountries()
  .map((iso2) => ({
    iso2,
    name: displayNames.of(iso2) ?? iso2,
    dialCode: `+${getCountryCallingCode(iso2)}`,
  }))
  .sort((left, right) => left.name.localeCompare(right.name));

export function countryByIso(iso2: string): CountryOption | undefined {
  return countries.find((country) => country.iso2 === iso2);
}

export function phoneIsValid(country: string, number: string): boolean {
  if (!country || !number.trim()) {
    return false;
  }

  return isValidPhoneNumber(number.replace(/\D/g, ""), country as CountryCode);
}

export function countryName(iso2: string | null | undefined): string {
  if (!iso2) {
    return "Not provided";
  }

  return countryByIso(iso2)?.name ?? iso2;
}
