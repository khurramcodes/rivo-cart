import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ShippingScope, ShippingZone } from "@/types";

type ZoneFormValues = {
  scope: ShippingScope;
  country?: string;
  state?: string;
  city?: string;
  isActive: boolean;
};

export function ShippingZoneForm({
  initialValues,
  onSubmit,
  onCancel,
  submitting,
}: {
  initialValues?: ShippingZone | null;
  onSubmit: (values: ZoneFormValues) => void;
  onCancel?: () => void;
  submitting?: boolean;
}) {
  const form = useForm<ZoneFormValues>({
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
        </div>
        {scope !== "COUNTRY" ? (
          <div>
            <label className="text-sm font-medium text-zinc-800">State</label>
            <Input className="mt-2" {...form.register("state")} />
          </div>
        ) : null}
      </div>
      {scope === "CITY" ? (
        <div>
          <label className="text-sm font-medium text-zinc-800">City</label>
          <Input className="mt-2" {...form.register("city")} />
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
