import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ShippingConditionType, ShippingMethod, ShippingRule, ShippingZone } from "@/types";

type RuleFormValues = {
  zoneId: string;
  methodId: string;
  baseCost: number;
  priority: number;
  isActive: boolean;
  conditionType: ShippingConditionType;
  minOrderValue?: number;
};

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
  onSubmit: (values: RuleFormValues) => void;
  onCancel?: () => void;
  submitting?: boolean;
}) {
  const form = useForm<RuleFormValues>({
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
      baseCost: initialValues.baseCost,
      priority: initialValues.priority,
      isActive: initialValues.isActive,
      conditionType: initialValues.conditionType,
      minOrderValue: initialValues.conditionConfig?.minOrderValue ?? undefined,
    });
  }, [form, initialValues, zones, methods]);

  const conditionType = form.watch("conditionType");

  return (
    <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-zinc-800">Zone</label>
          <select
            className="mt-2 h-10 w-full rounded border border-zinc-200 px-3 text-sm text-zinc-800"
            {...form.register("zoneId")}
          >
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.scope} · {zone.country}
                {zone.state ? ` / ${zone.state}` : ""}
                {zone.city ? ` / ${zone.city}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-800">Method</label>
          <select
            className="mt-2 h-10 w-full rounded border border-zinc-200 px-3 text-sm text-zinc-800"
            {...form.register("methodId")}
          >
            {methods.map((method) => (
              <option key={method.id} value={method.id}>
                {method.name} ({method.type})
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-zinc-800">Base cost (cents)</label>
          <Input className="mt-2" type="number" min={0} {...form.register("baseCost", { valueAsNumber: true })} />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-800">Priority</label>
          <Input className="mt-2" type="number" min={0} {...form.register("priority", { valueAsNumber: true })} />
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
            <label className="text-sm font-medium text-zinc-800">Min order value (cents)</label>
            <Input className="mt-2" type="number" min={0} {...form.register("minOrderValue", { valueAsNumber: true })} />
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
