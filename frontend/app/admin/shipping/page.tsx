"use client";

import { useEffect, useMemo, useState } from "react";
import { adminShippingApi } from "@/services/adminShippingApi";
import { formatPrice } from "@/config/currency";
import { ShippingMethodForm } from "@/components/admin/shipping/ShippingMethodForm";
import { ShippingRuleForm } from "@/components/admin/shipping/ShippingRuleForm";
import { ShippingZoneForm } from "@/components/admin/shipping/ShippingZoneForm";
import type { ShippingMethod, ShippingRule, ShippingZone } from "@/types";
import { Button } from "@/components/ui/Button";

export default function AdminShippingPage() {
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [rules, setRules] = useState<ShippingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);
  const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null);
  const [editingRule, setEditingRule] = useState<ShippingRule | null>(null);

  const refreshAll = async () => {
    try {
      setLoading(true);
      const [zonesData, methodsData, rulesData] = await Promise.all([
        adminShippingApi.listZones(),
        adminShippingApi.listMethods(),
        adminShippingApi.listRules(),
      ]);
      setZones(zonesData);
      setMethods(methodsData);
      setRules(rulesData);
      setError(null);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load shipping configuration.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshAll();
  }, []);

  const zoneById = useMemo(() => new Map(zones.map((z) => [z.id, z])), [zones]);
  const methodById = useMemo(() => new Map(methods.map((m) => [m.id, m])), [methods]);

  const handleZoneSubmit = async (values: any) => {
    if (editingZone) {
      const updated = await adminShippingApi.updateZone(editingZone.id, values);
      setZones((prev) => prev.map((z) => (z.id === updated.id ? updated : z)));
      setEditingZone(null);
    } else {
      const created = await adminShippingApi.createZone(values);
      setZones((prev) => [created, ...prev]);
    }
  };

  const handleMethodSubmit = async (values: any) => {
    if (editingMethod) {
      const updated = await adminShippingApi.updateMethod(editingMethod.id, values);
      setMethods((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setEditingMethod(null);
    } else {
      const created = await adminShippingApi.createMethod(values);
      setMethods((prev) => [created, ...prev]);
    }
  };

  const handleRuleSubmit = async (values: any) => {
    const payload = {
      ...values,
      minOrderValue: values.conditionType === "MIN_ORDER_VALUE" ? values.minOrderValue : undefined,
    };
    if (editingRule) {
      const updated = await adminShippingApi.updateRule(editingRule.id, payload);
      setRules((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setEditingRule(null);
    } else {
      const created = await adminShippingApi.createRule(payload);
      setRules((prev) => [created, ...prev]);
    }
  };

  const handleDeleteZone = async (id: string) => {
    if (!confirm("Delete this zone?")) return;
    await adminShippingApi.deleteZone(id);
    setZones((prev) => prev.filter((z) => z.id !== id));
  };

  const handleDeleteMethod = async (id: string) => {
    if (!confirm("Delete this method?")) return;
    await adminShippingApi.deleteMethod(id);
    setMethods((prev) => prev.filter((m) => m.id !== id));
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm("Delete this rate?")) return;
    await adminShippingApi.deleteRule(id);
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Shipping</h1>
        <p className="text-sm text-zinc-600">Manage zones, methods, and rates.</p>
      </div>

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
      ) : null}

      {/* Zones */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <section className="rounded border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900">Zones</h2>
            {editingZone ? (
              <Button variant="ghost" className="h-8 px-3" onClick={() => setEditingZone(null)}>
                New zone
              </Button>
            ) : null}
          </div>
          {zones.length === 0 && !loading ? (
            <p className="mt-3 text-sm text-zinc-500">No zones created yet.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-zinc-500">
                    <th className="py-2">Scope</th>
                    <th className="py-2">Country</th>
                    <th className="py-2">State</th>
                    <th className="py-2">City</th>
                    <th className="py-2">Active</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {zones.map((zone) => (
                    <tr key={zone.id} className="border-t border-zinc-100">
                      <td className="py-2">{zone.scope}</td>
                      <td className="py-2">{zone.country ?? "-"}</td>
                      <td className="py-2">{zone.state ?? "-"}</td>
                      <td className="py-2">{zone.city ?? "-"}</td>
                      <td className="py-2">{zone.isActive ? "Yes" : "No"}</td>
                      <td className="py-2 text-right space-x-2">
                        <Button variant="ghost" className="h-8 px-3" onClick={() => setEditingZone(zone)}>
                          Edit
                        </Button>
                        <Button variant="ghost" className="h-8 px-3" onClick={() => handleDeleteZone(zone.id)}>
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-zinc-900">{editingZone ? "Edit zone" : "Create zone"}</h2>
          <div className="mt-4">
            <ShippingZoneForm
              initialValues={editingZone}
              onSubmit={handleZoneSubmit}
              onCancel={() => setEditingZone(null)}
            />
          </div>
        </section>
      </div>

      {/* Methods */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <section className="rounded border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900">Methods</h2>
            {editingMethod ? (
              <Button variant="ghost" className="h-8 px-3" onClick={() => setEditingMethod(null)}>
                New method
              </Button>
            ) : null}
          </div>
          {methods.length === 0 && !loading ? (
            <p className="mt-3 text-sm text-zinc-500">No methods created yet.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-zinc-500">
                    <th className="py-2">Type</th>
                    <th className="py-2">Name</th>
                    <th className="py-2">Active</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {methods.map((method) => (
                    <tr key={method.id} className="border-t border-zinc-100">
                      <td className="py-2">{method.type}</td>
                      <td className="py-2">{method.name}</td>
                      <td className="py-2">{method.isActive ? "Yes" : "No"}</td>
                      <td className="py-2 text-right space-x-2">
                        <Button variant="ghost" className="h-8 px-3" onClick={() => setEditingMethod(method)}>
                          Edit
                        </Button>
                        <Button variant="ghost" className="h-8 px-3" onClick={() => handleDeleteMethod(method.id)}>
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-zinc-900">{editingMethod ? "Edit method" : "Create method"}</h2>
          <div className="mt-4">
            <ShippingMethodForm
              initialValues={editingMethod}
              onSubmit={handleMethodSubmit}
              onCancel={() => setEditingMethod(null)}
            />
          </div>
        </section>
      </div>

      {/* Rates */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <section className="rounded border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900">Rates</h2>
            {editingRule ? (
              <Button variant="ghost" className="h-8 px-3" onClick={() => setEditingRule(null)}>
                New rate
              </Button>
            ) : null}
          </div>
          {rules.length === 0 && !loading ? (
            <p className="mt-3 text-sm text-zinc-500">No rates created yet.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-zinc-500">
                    <th className="py-2">Zone</th>
                    <th className="py-2">Method</th>
                    <th className="py-2">Cost</th>
                    <th className="py-2">Condition</th>
                    <th className="py-2">Priority</th>
                    <th className="py-2">Active</th>
                    <th className="py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => {
                    const zone = rule.zone ?? zoneById.get(rule.zoneId);
                    const method = rule.method ?? methodById.get(rule.methodId);
                    const minOrderValue = rule.conditionConfig?.minOrderValue;
                    return (
                      <tr key={rule.id} className="border-t border-zinc-100">
                        <td className="py-2">
                          {zone ? `${zone.scope} · ${zone.country}${zone.state ? ` / ${zone.state}` : ""}${zone.city ? ` / ${zone.city}` : ""}` : "-"}
                        </td>
                        <td className="py-2">{method ? `${method.name} (${method.type})` : "-"}</td>
                        <td className="py-2">{formatPrice(rule.baseCost)}</td>
                        <td className="py-2">
                          {rule.conditionType === "MIN_ORDER_VALUE" && minOrderValue != null
                            ? `Min order ${formatPrice(minOrderValue)}`
                            : rule.conditionType}
                        </td>
                        <td className="py-2">{rule.priority}</td>
                        <td className="py-2">{rule.isActive ? "Yes" : "No"}</td>
                        <td className="py-2 text-right space-x-2">
                          <Button variant="ghost" className="h-8 px-3" onClick={() => setEditingRule(rule)}>
                            Edit
                          </Button>
                          <Button variant="ghost" className="h-8 px-3" onClick={() => handleDeleteRule(rule.id)}>
                            Delete
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-zinc-900">{editingRule ? "Edit rate" : "Create rate"}</h2>
          <div className="mt-4">
            <ShippingRuleForm
              zones={zones}
              methods={methods}
              initialValues={editingRule}
              onSubmit={handleRuleSubmit}
              onCancel={() => setEditingRule(null)}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
