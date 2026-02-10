import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ShippingZone } from "@/types";
import { shippingZoneSchema, type ShippingZoneFormData } from "@/schemas/shippingZone.schema";

export function ShippingZoneForm({
  initialValues,
  onSubmit,
  onCancel,
  submitting,
}: {
  initialValues?: ShippingZone | null;
  onSubmit: (values: ShippingZoneFormData) => void;
  onCancel?: () => void;
  submitting?: boolean;
}) {
  const form = useForm<ShippingZoneFormData>({
    resolver: zodResolver(shippingZoneSchema),
    defaultValues: {
      scope: "COUNTRY",
      country: "",
      state: "",
      city: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (!initialValues) {
      form.reset({ scope: "COUNTRY", country: "", state: "", city: "", isActive: true });
      return;
    }
    form.reset({
      scope: initialValues.scope,
      country: initialValues.country ?? "",
      state: initialValues.state ?? "",
      city: initialValues.city ?? "",
      isActive: initialValues.isActive,
    });
  }, [form, initialValues]);

  const scope = form.watch("scope");

  return (
    <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
      <div>
        <label className="text-sm font-medium text-zinc-800">Scope</label>
        <select
          className="mt-2 h-10 w-full rounded border border-zinc-200 px-3 text-sm text-zinc-800"
          {...form.register("scope")}
        >
          <option value="COUNTRY">Country</option>
          <option value="STATE">State</option>
          <option value="CITY">City</option>
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-zinc-800">Country</label>
          <Input className="mt-2" {...form.register("country")} />
          {form.formState.errors.country ? (
            <p className="mt-1 text-xs text-red-600">{form.formState.errors.country.message}</p>
          ) : null}
        </div>
        {scope !== "COUNTRY" ? (
          <div>
            <label className="text-sm font-medium text-zinc-800">State</label>
            <Input className="mt-2" {...form.register("state")} />
            {form.formState.errors.state ? (
              <p className="mt-1 text-xs text-red-600">{form.formState.errors.state.message}</p>
            ) : null}
          </div>
        ) : null}
      </div>
      {scope === "CITY" ? (
        <div>
          <label className="text-sm font-medium text-zinc-800">City</label>
          <Input className="mt-2" {...form.register("city")} />
          {form.formState.errors.city ? (
            <p className="mt-1 text-xs text-red-600">{form.formState.errors.city.message}</p>
          ) : null}
        </div>
      ) : null}
      <label className="flex items-center gap-2 text-sm text-zinc-700">
        <input type="checkbox" {...form.register("isActive")} />
        Active
      </label>
      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {initialValues ? "Update zone" : "Create zone"}
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
