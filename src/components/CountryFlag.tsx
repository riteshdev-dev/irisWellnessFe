import * as FlagIcons from "country-flag-icons/react/3x2";
import type { ComponentType, SVGProps } from "react";

const flags = FlagIcons as unknown as Record<string, ComponentType<SVGProps<SVGSVGElement>>>;

export function CountryFlag({ iso2 }: { iso2: string }) {
  const Flag = flags[iso2];
  if (!Flag) {
    return <span className="portal-flag-fallback">{iso2}</span>;
  }

  return <Flag className="portal-flag" aria-hidden="true" />;
}
