export const ALLOWED_COUNTRIES = ["United States", "Pakistan"] as const;
export type AllowedCountry = (typeof ALLOWED_COUNTRIES)[number];

export const ALLOWED_COUNTRY_SET = new Set<string>(ALLOWED_COUNTRIES);
