import { apiClient } from "./apiClient";
import type { ShippingMethod, ShippingRule, ShippingZone } from "@/types";

export const adminShippingApi = {
  async listZones() {
    const { data } = await apiClient.get<{ zones: ShippingZone[] }>("/shipping/zones");
    return data.zones;
  },
  async createZone(payload: Partial<ShippingZone>) {
    const { data } = await apiClient.post<{ zone: ShippingZone }>("/shipping/zones", payload);
    return data.zone;
  },
  async updateZone(id: string, payload: Partial<ShippingZone>) {
    const { data } = await apiClient.put<{ zone: ShippingZone }>(`/shipping/zones/${id}`, payload);
    return data.zone;
  },
  async deleteZone(id: string) {
    await apiClient.delete(`/shipping/zones/${id}`);
  },

  async listMethods() {
    const { data } = await apiClient.get<{ methods: ShippingMethod[] }>("/shipping/methods");
    return data.methods;
  },
  async createMethod(payload: Partial<ShippingMethod>) {
    const { data } = await apiClient.post<{ method: ShippingMethod }>("/shipping/methods", payload);
    return data.method;
  },
  async updateMethod(id: string, payload: Partial<ShippingMethod>) {
    const { data } = await apiClient.put<{ method: ShippingMethod }>(`/shipping/methods/${id}`, payload);
    return data.method;
  },
  async deleteMethod(id: string) {
    await apiClient.delete(`/shipping/methods/${id}`);
  },

  async listRules() {
    const { data } = await apiClient.get<{ rules: ShippingRule[] }>("/shipping/rules");
    return data.rules;
  },
  async createRule(payload: {
    zoneId: string;
    methodId: string;
    baseCost: number;
    priority?: number;
    isActive?: boolean;
    conditionType?: ShippingRule["conditionType"];
    minOrderValue?: number;
  }) {
    const { data } = await apiClient.post<{ rule: ShippingRule }>("/shipping/rules", payload);
    return data.rule;
  },
  async updateRule(id: string, payload: Partial<ShippingRule> & { minOrderValue?: number }) {
    const { data } = await apiClient.put<{ rule: ShippingRule }>(`/shipping/rules/${id}`, payload);
    return data.rule;
  },
  async deleteRule(id: string) {
    await apiClient.delete(`/shipping/rules/${id}`);
  },
};
