"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { Category } from "@/types";
import { adminApi } from "@/services/adminApi";
import { uploadFile } from "@/services/uploadApi";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ImageUpload } from "@/components/ui/ImageUpload";

const createSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  parentId: z.string().optional(),
});
type CreateValues = z.infer<typeof createSchema>;

const editSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  parentId: z.string().optional(),
});
type EditValues = z.infer<typeof editSchema>;

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createStatus, setCreateStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [editStatus, setEditStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; categoryId: string | null }>({
    open: false,
    categoryId: null,
  });
  const [createImage, setCreateImage] = useState<File | string | null>(null);
  const [editImage, setEditImage] = useState<File | string | null>(null);

  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: "", description: "", parentId: "" },
  });

  const editForm = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { name: "", description: "", parentId: "" },
  });

  const editingCategory = useMemo(
    () => categories.find((c) => c.id === editingId) ?? null,
    [categories, editingId],
  );

  const parentNameMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((category) => {
      map.set(category.id, category.name);
    });
    return map;
  }, [categories]);

  const createParentOptions = useMemo(() => categories, [categories]);
  const editParentOptions = useMemo(
    () => categories.filter((category) => category.id !== editingId),
    [categories, editingId],
  );

  const selectClassName =
    "mt-2 h-10 w-full rounded border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none " +
    "focus:ring-2 focus:ring-black/10 focus:border-zinc-300";

  const getErrorMessage = (err: unknown) => {
    const anyErr = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
    return anyErr?.response?.data?.error?.message ?? anyErr?.message ?? "Something went wrong";
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setListError(null);
        const data = await adminApi.listCategories();
        if (mounted) setCategories(data.items);
      } catch (err) {
        if (mounted) setListError(getErrorMessage(err));
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
      parentId: editingCategory.parentId ?? "",
    });
    setEditImage(editingCategory.imageUrl ?? null);
  }, [editForm, editingCategory]);

  useEffect(() => {
    setEditStatus(null);
  }, [editingId]);

  async function onCreate(values: CreateValues) {
    setCreateStatus(null);
    try {
      const categoryId = crypto.randomUUID();
      const created = await adminApi.createCategory({
        id: categoryId,
        name: values.name,
        description: values.description,
        parentId: values.parentId ? values.parentId : null,
      });
      let finalCategory = created;
      if (createImage instanceof File) {
        const uploaded = await uploadFile(createImage, created.id, "categories", "main", {
          slug: created.slug,
        });
        finalCategory = await adminApi.updateCategory(created.id, {
          imageUrl: uploaded.url,
          imageFileKey: uploaded.fileKey,
        });
      }
      setCategories((prev) =>
        [finalCategory, ...prev.filter((c) => c.id !== created.id)].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      );
      createForm.reset({ name: "", description: "", parentId: "" });
      setCreateImage(null);
      setCreateStatus({ type: "success", message: "Category created successfully." });
    } catch (err) {
      setCreateStatus({ type: "error", message: getErrorMessage(err) });
    }
  }

  async function onUpdate(values: EditValues) {
    if (!editingId || !editingCategory) return;
    setEditStatus(null);
    try {
      let payload: Parameters<typeof adminApi.updateCategory>[1] = {
        name: values.name,
        description: values.description,
        parentId: values.parentId ? values.parentId : null,
      };
      if (editImage instanceof File) {
        const uploaded = await uploadFile(
          editImage,
          editingCategory.id,
          "categories",
          "main",
          { slug: editingCategory.slug },
        );
        payload = {
          ...payload,
          imageUrl: uploaded.url,
          imageFileKey: uploaded.fileKey,
        };
      } else if (editImage === null && editingCategory.imageUrl) {
        payload = { ...payload, imageUrl: null, imageFileKey: null };
      }
      const updated = await adminApi.updateCategory(editingId, payload);
      setCategories((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c)).sort((a, b) => a.name.localeCompare(b.name)),
      );
      setEditingId(null);
      setEditImage(null);
      setEditStatus({ type: "success", message: "Category updated successfully." });
    } catch (err) {
      setEditStatus({ type: "error", message: getErrorMessage(err) });
    }
  }

  async function onDelete(id: string) {
    await adminApi.deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Categories</h1>
      <p className="mt-2 text-sm text-zinc-600">Create, edit, and remove categories.</p>

      <div className="mt-6 space-y-6">
        <section className="rounded border border-zinc-200 p-4">
          <p className="text-sm font-medium text-zinc-900">Create category</p>
          {createStatus ? (
            <div
              className={`mt-3 rounded border px-3 py-2 text-sm ${createStatus.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-800"
                }`}
            >
              {createStatus.message}
            </div>
          ) : null}
          <form className="mt-4 space-y-3" onSubmit={createForm.handleSubmit(onCreate)}>
            <div className="grid gap-2 lg:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-zinc-800">Name</label>
                <Input className="mt-2" {...createForm.register("name")} placeholder="Category name" />
                {createForm.formState.errors.name ? (
                  <p className="mt-1 text-sm text-red-600">{createForm.formState.errors.name.message}</p>
                ) : null}
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-800">Parent category</label>
                <select
                  className={selectClassName}
                  {...createForm.register("parentId")}
                  disabled={loading}
                  aria-label="Select parent category"
                >
                  <option value="">{loading ? "Loading categories..." : "None"}</option>
                  {createParentOptions.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-800">Description</label>
              <Input className="mt-2" {...createForm.register("description")} placeholder="Category description" />
              {createForm.formState.errors.description ? (
                <p className="mt-1 text-sm text-red-600">{createForm.formState.errors.description.message}</p>
              ) : null}
            </div>
            <div>
              <ImageUpload
                label="Category image (optional)"
                value={createImage}
                onChange={(file) => setCreateImage(file)}
                required={false}
              />
            </div>
            <Button type="submit" disabled={createForm.formState.isSubmitting}>
              {createForm.formState.isSubmitting ? "Creating..." : "Create"}
            </Button>
          </form>
        </section>

        <section className="rounded border border-zinc-200 p-4">
          <p className="text-sm font-medium text-zinc-900">All categories</p>
          {loading ? <p className="mt-4 text-sm text-zinc-600">Loading…</p> : null}
          {listError ? <p className="mt-4 text-sm text-red-600">{listError}</p> : null}
          {!loading && categories.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-600">No categories yet.</p>
          ) : null}

          {!loading && categories.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-[720px] w-full text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Name</th>
                    <th className="px-3 py-2 text-left font-medium">Parent</th>
                    <th className="px-3 py-2 text-left font-medium">Description</th>
                    <th className="px-3 py-2 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <Fragment key={category.id}>
                      <tr className="align-top border-b border-zinc-100 last:border-0">
                        <td className="px-3 py-3 text-zinc-900 font-medium">{category.name}</td>
                        <td className="px-3 py-3 text-zinc-600">
                          {category.parentId ? parentNameMap.get(category.parentId) ?? "Unknown" : "None"}
                        </td>
                        <td className="px-3 py-3 text-zinc-600">{category.description ?? "—"}</td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="ghost"
                              className="h-9 px-3"
                              onClick={() => setEditingId((prev) => (prev === category.id ? null : category.id))}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              className="h-9 px-3"
                              onClick={() => setDeleteConfirm({ open: true, categoryId: category.id })}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {editingId === category.id ? (
                        <tr>
                          <td className="px-3 pb-4" colSpan={4}>
                            {editStatus ? (
                              <div
                                className={`mb-3 rounded border px-3 py-2 text-sm ${editStatus.type === "success"
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                    : "border-red-200 bg-red-50 text-red-800"
                                  }`}
                              >
                                {editStatus.message}
                              </div>
                            ) : null}
                            <form className="grid gap-3" onSubmit={editForm.handleSubmit(onUpdate)}>
                              <div className="grid gap-2 lg:grid-cols-3">
                                <div>
                                  <label className="text-sm font-medium text-zinc-800">Name</label>
                                  <Input className="mt-2" {...editForm.register("name")} />
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-zinc-800">Parent category</label>
                                  <select
                                    className={selectClassName}
                                    {...editForm.register("parentId")}
                                    disabled={loading}
                                    aria-label="Select parent category"
                                  >
                                    <option value="">{loading ? "Loading categories..." : "None"}</option>
                                    {editParentOptions.map((option) => (
                                      <option key={option.id} value={option.id}>
                                        {option.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-zinc-800">Description</label>
                                  <Input className="mt-2" {...editForm.register("description")} />
                                </div>
                              </div>
                              <div>
                                <ImageUpload
                                  label="Category image (optional)"
                                  value={editImage}
                                  onChange={(file) => setEditImage(file)}
                                  required={false}
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button type="submit" disabled={editForm.formState.isSubmitting}>
                                  {editForm.formState.isSubmitting ? "Saving..." : "Save"}
                                </Button>
                                <Button variant="ghost" type="button" onClick={() => setEditingId(null)}>
                                  Cancel
                                </Button>
                              </div>
                            </form>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, categoryId: null })}
        onConfirm={async () => {
          if (!deleteConfirm.categoryId) return;
          try {
            await onDelete(deleteConfirm.categoryId);
          } catch (err) {
            setListError(getErrorMessage(err));
          }
        }}
        title="Delete Category"
        message="Are you sure you want to delete this category? This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
}



