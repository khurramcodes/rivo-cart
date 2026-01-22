"use client";

import { useEffect, useState } from "react";
import type { City, Country, State } from "react-country-state-city/dist/esm/types";
import { GetCity, GetCountries, GetState } from "react-country-state-city";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ALLOWED_COUNTRY_SET } from "@/config/geo";

export type AddressFormValues = {
  fullName: string;
  phone: string;
  country: string;
  state: string;
  city: string;
  streetAddress: string;
  postalCode?: string | null;
};

export type AddressFormProps = {
  initialValues?: Partial<AddressFormValues>;
  submitLabel?: string;
  loading?: boolean;
  showFullName?: boolean;
  fullNameValue?: string;
  asForm?: boolean;
  onSubmit: (values: AddressFormValues) => void | Promise<void>;
  onCancel?: () => void;
};

export function AddressForm({
  initialValues,
  submitLabel = "Save address",
  loading,
  showFullName = true,
  fullNameValue,
  asForm = true,
  onSubmit,
  onCancel,
}: AddressFormProps) {
  const [countries, setCountries] = useState<Country[]>([]);

  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedState, setSelectedState] = useState<State | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  const [fullName, setFullName] = useState(initialValues?.fullName ?? fullNameValue ?? "");
  const [phone, setPhone] = useState(initialValues?.phone ?? "");
  const [streetAddress, setStreetAddress] = useState(initialValues?.streetAddress ?? "");
  const [postalCode, setPostalCode] = useState(initialValues?.postalCode ?? "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const all = await GetCountries();
      const filtered = all.filter((country) => ALLOWED_COUNTRY_SET.has(country.name));
      if (mounted) setCountries(filtered);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!initialValues || countries.length === 0) return;
    setFullName(initialValues.fullName ?? fullNameValue ?? "");
    setPhone(initialValues.phone ?? "");
    setStreetAddress(initialValues.streetAddress ?? "");
    setPostalCode(initialValues.postalCode ?? "");

    const country = countries.find((c) => c.name === initialValues.country) ?? null;
    setSelectedCountry(country);
    if (country) {
      (async () => {
        const nextStates = await GetState(country.id);
        setStates(nextStates);
        const state = nextStates.find((s) => s.name === initialValues.state) ?? null;
        setSelectedState(state);
        if (state) {
          const nextCities = await GetCity(country.id, state.id);
          setCities(nextCities);
          const city = nextCities.find((c) => c.name === initialValues.city) ?? null;
          setSelectedCity(city);
        } else {
          setCities([]);
          setSelectedCity(null);
        }
      })();
    } else {
      setStates([]);
      setCities([]);
      setSelectedState(null);
      setSelectedCity(null);
    }
  }, [countries, fullNameValue, initialValues]);

  const handleCountryChange = async (countryId: number) => {
    const country = countries.find((c) => c.id === countryId) ?? null;
    setSelectedCountry(country);
    setSelectedState(null);
    setSelectedCity(null);
    setCities([]);

    if (country) {
      const nextStates = await GetState(country.id);
      setStates(nextStates);
    } else {
      setStates([]);
    }
  };

  const handleStateChange = async (stateId: number) => {
    if (!selectedCountry) return;
    const state = states.find((s) => s.id === stateId) ?? null;
    setSelectedState(state);
    setSelectedCity(null);

    if (state) {
      const nextCities = await GetCity(selectedCountry.id, state.id);
      setCities(nextCities);
    } else {
      setCities([]);
    }
  };

  const handleCityChange = (cityId: number) => {
    const city = cities.find((c) => c.id === cityId) ?? null;
    setSelectedCity(city);
  };

  const handleSubmit = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    setError(null);

    if (!selectedCountry || !selectedState || !selectedCity) {
      setError("Please select your country, state, and city.");
      return;
    }

    const resolvedFullName = showFullName ? fullName.trim() : (fullNameValue ?? fullName).trim();
    if (!resolvedFullName || !phone.trim() || !streetAddress.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    await onSubmit({
      fullName: resolvedFullName,
      phone: phone.trim(),
      country: selectedCountry.name,
      state: selectedState.name,
      city: selectedCity.name,
      streetAddress: streetAddress.trim(),
      postalCode: postalCode?.trim() || null,
    });
  };

  const formContent = (
    <>
      <div className={`grid gap-4 ${showFullName ? "sm:grid-cols-2" : ""}`}>
        {showFullName ? (
          <div>
            <label className="text-sm font-medium text-zinc-800">Full name</label>
            <Input
              className="mt-2"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
        ) : null}
        <div>
          <label className="text-sm font-medium text-zinc-800">Phone number</label>
          <Input
            className="mt-2"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="text-zinc-800 grid gap-4 sm:grid-cols-3">
        <div>
          <label className="text-sm font-medium">Country</label>
          <select
            className="mt-2 w-full rounded border border-zinc-200 bg-white px-3 py-2 text-sm"
            value={selectedCountry?.id ?? ""}
            onChange={(e) => handleCountryChange(Number(e.target.value))}
            required
          >
            <option value="" disabled>
              Select country
            </option>
            {countries.map((country) => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">State</label>
          <select
            className="mt-2 w-full rounded border border-zinc-200 bg-white px-3 py-2 text-sm disabled:bg-zinc-50"
            value={selectedState?.id ?? ""}
            onChange={(e) => handleStateChange(Number(e.target.value))}
            disabled={!selectedCountry}
            required
          >
            <option value="" disabled>
              Select state
            </option>
            {states.map((state) => (
              <option key={state.id} value={state.id}>
                {state.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">City</label>
          <select
            className="mt-2 w-full rounded border border-zinc-200 bg-white px-3 py-2 text-sm disabled:bg-zinc-50"
            value={selectedCity?.id ?? ""}
            onChange={(e) => handleCityChange(Number(e.target.value))}
            disabled={!selectedState}
            required
          >
            <option value="" disabled>
              Select city
            </option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-zinc-800">Street address</label>
        <Input
          className="mt-2"
          value={streetAddress}
          onChange={(e) => setStreetAddress(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium text-zinc-800">Postal code (optional)</label>
        <Input
          className="mt-2"
          value={postalCode ?? ""}
          onChange={(e) => setPostalCode(e.target.value)}
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex items-center gap-3">
        <Button type={asForm ? "submit" : "button"} disabled={loading} onClick={!asForm ? () => handleSubmit() : undefined}>
          {loading ? "Saving..." : submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </>
  );

  return asForm ? (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {formContent}
    </form>
  ) : (
    <div className="space-y-4">{formContent}</div>
  );
}

export function ShippingAddressForm(props: Omit<AddressFormProps, "showFullName">) {
  return (
    <AddressForm
      {...props}
      showFullName={false}
      asForm={false}
      submitLabel={props.submitLabel ?? "Save address"}
    />
  );
}
