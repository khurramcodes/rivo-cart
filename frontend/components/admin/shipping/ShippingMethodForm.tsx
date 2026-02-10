import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ShippingMethod, ShippingType } from "@/types";

type MethodFormValues = {
  type: ShippingType;
  name: string;
  description?: string;
  isActive: boolean;
};

export function ShippingMethodForm({
  initialValues,
  onSubmit,
  onCancel,
  submitting,
}: {
  initialValues?: ShippingMethod | null;
  onSubmit: (values: MethodFormValues) => void;
  onCancel?: () => void;
  submitting?: boolean;
}) {
  const form = useForm<MethodFormValues>({
    defaultValues: {
      type: "STANDARD",
      name: "",
      description: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (!initialValues) {
      form.reset({ type: "STANDARD", name: "", description: "", isActive: true });
      return;
    }
    form.reset({
      type: initialValues.type,
      name: initialValues.name,
      description: initialValues.description ?? "",
      isActive: initialValues.isActive,
    });
  }, [form, initialValues]);

  return (
    <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-zinc-800">Type</label>
          <select
            className="mt-2 h-10 w-full rounded border border-zinc-200 px-3 text-sm text-zinc-800"
            {...form.register("type")}
          >
            <option value="STANDARD">Standard</option>
            <option value="EXPRESS">Express</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-800">Name</label>
          <Input className="mt-2" {...form.register("name")} />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-zinc-800">Description</label>
        <Input className="mt-2" {...form.register("description")} />
      </div>
      <label className="flex items-center gap-2 text-sm text-zinc-700">
        <input type="checkbox" {...form.register("isActive")} />
        Active
      </label>
      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {initialValues ? "Update method" : "Create method"}
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
