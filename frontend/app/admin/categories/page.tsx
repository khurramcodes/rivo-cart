"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { Category } from "@/types";
import { catalogApi } from "@/services/catalogApi";
import { adminApi } from "@/services/adminApi";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const createSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
});
type CreateValues = z.infer<typeof createSchema>;

const editSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
});
type EditValues = z.infer<typeof editSchema>;

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: "", description: "" },
  });

  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { name: "", description: "" },
  });

  const editingCategory = useMemo(
    () => categories.find((c) => c.id === editingId) ?? null,
    [categories, editingId],
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await catalogApi.listCategories();
        if (mounted) setCategories(data);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!editingCategory) return;
    editForm.reset({
      name: editingCategory.name,
      description: editingCategory.description ?? "",
    });
  }, [editForm, editingCategory]);

  async function onCreate(values: CreateValues) {
    const created = await adminApi.createCategory(values);
    setCategories((prev) => [created, ...prev].sort((a, b) => a.name.localeCompare(b.name)));
    createForm.reset({ name: "", description: "" });
  }

  async function onUpdate(values: EditValues) {
    if (!editingId) return;
    const updated = await adminApi.updateCategory(editingId, values);
    setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setEditingId(null);
  }

  async function onDelete(id: string) {
    await adminApi.deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Categories</h1>
      <p className="mt-2 text-sm text-zinc-600">Create, edit, and remove categories.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded border border-zinc-200 p-4">
          <p className="text-sm font-medium text-zinc-900">Create category</p>
          <form className="mt-4 space-y-3" onSubmit={createForm.handleSubmit(onCreate)}>
            <div>
              <label className="text-sm font-medium text-zinc-800">Name</label>
              <Input className="mt-2" {...createForm.register("name")} />
              {createForm.formState.errors.name ? (
                <p className="mt-1 text-sm text-red-600">{createForm.formState.errors.name.message}</p>
              ) : null}
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-800">Description</label>
              <Input className="mt-2" {...createForm.register("description")} />
              {createForm.formState.errors.description ? (
                <p className="mt-1 text-sm text-red-600">{createForm.formState.errors.description.message}</p>
              ) : null}
            </div>
            <Button type="submit">Create</Button>
          </form>
        </section>

        <section className="rounded border border-zinc-200 p-4">
          <p className="text-sm font-medium text-zinc-900">All categories</p>
          {loading ? <p className="mt-4 text-sm text-zinc-600">Loading…</p> : null}
          {!loading && categories.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-600">No categories yet.</p>
          ) : null}

          <div className="mt-4 space-y-2">
            {categories.map((c) => (
              <div key={c.id} className="rounded border border-zinc-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{c.name}</p>
                    {c.description ? <p className="mt-1 text-sm text-zinc-600">{c.description}</p> : null}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      className="h-9 px-3"
                      onClick={() => setEditingId((prev) => (prev === c.id ? null : c.id))}
                    >
                      Edit
                    </Button>
                    <Button variant="ghost" className="h-9 px-3" onClick={() => void onDelete(c.id)}>
                      Delete
                    </Button>
                  </div>
                </div>

                {editingId === c.id ? (
                  <form className="mt-3 grid gap-3" onSubmit={editForm.handleSubmit(onUpdate)}>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium text-zinc-800">Name</label>
                        <Input className="mt-2" {...editForm.register("name")} />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-zinc-800">Description</label>
                        <Input className="mt-2" {...editForm.register("description")} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit">Save</Button>
                      <Button variant="ghost" type="button" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}



