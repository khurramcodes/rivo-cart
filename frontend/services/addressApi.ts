import { apiClient } from "./apiClient";
import type { Address } from "@/types";

type AddressResponse = { address: Address };
type AddressesResponse = { addresses: Address[] };

export const addressApi = {
  async list() {
    const { data } = await apiClient.get<AddressesResponse>("/api/addresses");
    return data;
  },
  async create(payload: {
    fullName: string;
    phone: string;
    country: string;
    state: string;
    city: string;
    streetAddress: string;
    postalCode?: string | null;
  }) {
    const { data } = await apiClient.post<AddressResponse>("/api/addresses", payload);
    return data;
  },
  async update(
    id: string,
    payload: Partial<{
      fullName: string;
      phone: string;
      country: string;
      state: string;
      city: string;
      streetAddress: string;
      postalCode?: string | null;
      isDefault?: boolean;
    }>
  ) {
    const { data } = await apiClient.patch<AddressResponse>(`/api/addresses/${id}`, payload);
    return data;
  },
  async remove(id: string) {
    await apiClient.delete(`/api/addresses/${id}`);
  },
  async setDefault(id: string) {
    const { data } = await apiClient.post<AddressResponse>(`/api/addresses/${id}/default`, {});
    return data;
  },
};
