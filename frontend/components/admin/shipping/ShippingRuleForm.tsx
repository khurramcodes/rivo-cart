import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ShippingMethod, ShippingRule, ShippingZone } from "@/types";
import { shippingRuleSchema, type ShippingRuleFormData } from "@/schemas/shippingRule.schema";

export function ShippingRuleForm({
  zones,
  methods,
  initialValues,
  onSubmit,
  onCancel,
  submitting,
}: {
  zones: ShippingZone[];
  methods: ShippingMethod[];
  initialValues?: ShippingRule | null;
  onSubmit: (values: ShippingRuleFormData) => void;
  onCancel?: () => void;
  submitting?: boolean;
}) {
  const form = useForm<ShippingRuleFormData>({
    resolver: zodResolver(shippingRuleSchema),
    defaultValues: {
      zoneId: "",
      methodId: "",
      baseCost: 0,
      priority: 0,
      isActive: true,
      conditionType: "NONE",
      minOrderValue: undefined,
    },
  });

  useEffect(() => {
    if (!initialValues) {
      form.reset({
        zoneId: zones[0]?.id ?? "",
        methodId: methods[0]?.id ?? "",
        baseCost: 0,
        priority: 0,
        isActive: true,
        conditionType: "NONE",
        minOrderValue: undefined,
      });
      return;
    }
    form.reset({
      zoneId: initialValues.zoneId,
      methodId: initialValues.methodId,
      baseCost: initialValues.baseCost / 100,
      priority: initialValues.priority,
      isActive: initialValues.isActive,
      conditionType: initialValues.conditionType,
      minOrderValue:
        initialValues.conditionConfig?.minOrderValue != null
          ? initialValues.conditionConfig.minOrderValue / 100
          : undefined,
    });
  }, [form, initialValues, zones, methods]);

  const conditionType = form.watch("conditionType");

  return (
    <form
      className="space-y-3"
      onSubmit={form.handleSubmit((values) => {
        onSubmit({
          ...values,
          baseCost: Math.round(values.baseCost * 100),
          minOrderValue:
            values.minOrderValue != null ? Math.round(values.minOrderValue * 100) : undefined,
        });
      })}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-zinc-800">Zone</label>
          <select
            className="mt-2 h-10 w-full rounded border border-zinc-200 px-3 text-sm text-zinc-800"
            {...form.register("zoneId")}
          >
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.country}
                {zone.state ? ` / ${zone.state}` : ""}
                {zone.city ? ` / ${zone.city}` : ""}
              </option>
            ))}
          </select>
          {form.formState.errors.zoneId ? (
            <p className="mt-1 text-xs text-red-600">{form.formState.errors.zoneId.message}</p>
          ) : null}
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-800">Method</label>
          <select
            className="mt-2 h-10 w-full rounded border border-zinc-200 px-3 text-sm text-zinc-800"
            {...form.register("methodId")}
          >
            {methods.map((method) => (
              <option key={method.id} value={method.id}>
                {method.name}
              </option>
            ))}
          </select>
          {form.formState.errors.methodId ? (
            <p className="mt-1 text-xs text-red-600">{form.formState.errors.methodId.message}</p>
          ) : null}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-zinc-800">Base cost (PKR)</label>
          <Input className="mt-2" type="number" min={0} step="1" {...form.register("baseCost")} />
          {form.formState.errors.baseCost ? (
            <p className="mt-1 text-xs text-red-600">{form.formState.errors.baseCost.message}</p>
          ) : null}
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-800">Priority</label>
          <Input className="mt-2" type="number" min={0} {...form.register("priority")} />
          {form.formState.errors.priority ? (
            <p className="mt-1 text-xs text-red-600">{form.formState.errors.priority.message}</p>
          ) : null}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-zinc-800">Condition</label>
          <select
            className="mt-2 h-10 w-full rounded border border-zinc-200 px-3 text-sm text-zinc-800"
            {...form.register("conditionType")}
          >
            <option value="NONE">None</option>
            <option value="MIN_ORDER_VALUE">Min order value</option>
          </select>
        </div>
        {conditionType === "MIN_ORDER_VALUE" ? (
          <div>
            <label className="text-sm font-medium text-zinc-800">Min order value (PKR)</label>
            <Input className="mt-2" type="number" min={0} step="1" {...form.register("minOrderValue")} />
            {form.formState.errors.minOrderValue ? (
              <p className="mt-1 text-xs text-red-600">{form.formState.errors.minOrderValue.message}</p>
            ) : null}
          </div>
        ) : null}
      </div>
      <label className="flex items-center gap-2 text-sm text-zinc-700">
        <input type="checkbox" {...form.register("isActive")} />
        Active
      </label>
      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {initialValues ? "Update rate" : "Create rate"}
        </Button>
        {initialValues && onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
