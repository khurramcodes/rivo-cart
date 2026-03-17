"use client";

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { FormEvent } from "react";

export type CollectionFormValues = {
  title: string;
  slug: string;
  description: string;
  isActive: boolean;
};

type Props = {
  values: CollectionFormValues;
  errors?: Partial<Record<keyof CollectionFormValues, string>>;
  submitting?: boolean;
  submitLabel: string;
  onChange: <K extends keyof CollectionFormValues>(key: K, value: CollectionFormValues[K]) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function CollectionForm({
  values,
  errors,
  submitting,
  submitLabel,
  onChange,
  onSubmit,
}: Props) {
  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div>
        <label className="text-sm font-medium text-zinc-800">Title</label>
        <Input
          className="mt-2"
          value={values.title}
          onChange={(event) => onChange("title", event.target.value)}
          placeholder="Summer Specials"
        />
        {errors?.title ? <p className="mt-1 text-xs text-red-600">{errors.title}</p> : null}
      </div>

      <div>
        <label className="text-sm font-medium text-zinc-800">Slug</label>
        <Input
          className="mt-2"
          value={values.slug}
          onChange={(event) => onChange("slug", event.target.value)}
          placeholder="summer-specials"
        />
        {errors?.slug ? <p className="mt-1 text-xs text-red-600">{errors.slug}</p> : null}
      </div>

      <div>
        <label className="text-sm font-medium text-zinc-800">Description</label>
        <textarea
          className="mt-2 min-h-24 w-full rounded border border-zinc-200 bg-transparent px-3 py-2 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-black/10 focus:border-zinc-300"
          value={values.description}
          onChange={(event) => onChange("description", event.target.value)}
          placeholder="Optional description for this collection"
        />
      </div>

      <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
        <input
          type="checkbox"
          checked={values.isActive}
          onChange={(event) => onChange("isActive", event.target.checked)}
        />
        Active collection
      </label>

      <div>
        <Button type="submit" disabled={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
