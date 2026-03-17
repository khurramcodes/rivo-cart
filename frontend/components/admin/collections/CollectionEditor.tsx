"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { arrayMove } from "@dnd-kit/sortable";
import { toast } from "react-toastify";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { adminApi } from "@/services/adminApi";
import type { Collection, Product } from "@/types";
import { slugify } from "@/utils/slug";
import {
  CollectionForm,
  type CollectionFormValues,
} from "./CollectionForm";
import {
  ProductList,
  type CollectionProductItem,
} from "./ProductList";
import { ProductPicker } from "./ProductPicker";

type Props = {
  collectionId?: string;
};

function normalizeItems(items: Collection["products"] | undefined): CollectionProductItem[] {
  return (items ?? [])
    .map((entry) => ({
      productId: entry.productId,
      position: entry.position,
      product: entry.product,
    }))
    .sort((a, b) => a.position - b.position)
    .map((entry, index) => ({ ...entry, position: index + 1 }));
}

function compactPositions(items: CollectionProductItem[]) {
  return items.map((entry, index) => ({
    ...entry,
    position: index + 1,
  }));
}

export function CollectionEditor({ collectionId }: Props) {
  const isEditMode = Boolean(collectionId);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formValues, setFormValues] = useState<CollectionFormValues>({
    title: "",
    slug: "",
    description: "",
    isActive: true,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CollectionFormValues, string>>>({});
  const [slugTouched, setSlugTouched] = useState(false);
  const [items, setItems] = useState<CollectionProductItem[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [removingProductId, setRemovingProductId] = useState<string | null>(null);

  const collectionQuery = useQuery({
    queryKey: ["admin-collection", collectionId],
    queryFn: async () => adminApi.getCollection(collectionId as string),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (!collectionQuery.data) return;
    const collection = collectionQuery.data;
    setFormValues({
      title: collection.title,
      slug: collection.slug,
      description: collection.description ?? "",
      isActive: collection.isActive,
    });
    setItems(normalizeItems(collection.products));
    setSlugTouched(true);
  }, [collectionQuery.data]);

  const selectedProductIds = useMemo(
    () => items.map((entry) => entry.productId),
    [items],
  );

  const collectionMutation = useMutation({
    mutationFn: async () => {
      const title = formValues.title.trim();
      const rawSlug = formValues.slug.trim() || title;
      const slug = slugify(rawSlug);
      if (!title) throw new Error("Collection title is required");
      if (!slug) throw new Error("Collection slug is required");

      if (isEditMode) {
        return adminApi.updateCollection(collectionId as string, {
          title,
          slug,
          description: formValues.description.trim(),
          isActive: formValues.isActive,
        });
      }

      const created = await adminApi.createCollection({
        title,
        slug,
        description: formValues.description.trim(),
        isActive: formValues.isActive,
      });

      if (items.length > 0) {
        await adminApi.addCollectionProducts(
          created.id,
          items.map((entry) => entry.productId),
        );
        await adminApi.reorderCollectionProducts(
          created.id,
          items.map((entry, index) => ({
            productId: entry.productId,
            position: index + 1,
          })),
        );
      }
      return created;
    },
    onSuccess: (collection) => {
      queryClient.invalidateQueries({ queryKey: ["admin-collections"] });
      if (isEditMode) {
        queryClient.invalidateQueries({ queryKey: ["admin-collection", collectionId] });
        toast.success("Collection updated");
      } else {
        toast.success("Collection created");
        router.replace(`/admin/collections/${collection.id}`);
      }
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || error?.message || "Failed to save collection";
      toast.error(message);
    },
  });

  const addProductsMutation = useMutation({
    mutationFn: async (productIds: string[]) =>
      adminApi.addCollectionProducts(collectionId as string, productIds),
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to add products");
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (productId: string) =>
      adminApi.removeCollectionProduct(collectionId as string, productId),
    onMutate: async (productId: string) => {
      const previous = items;
      setRemovingProductId(productId);
      setItems((current) =>
        compactPositions(current.filter((entry) => entry.productId !== productId)),
      );
      return { previous };
    },
    onError: (_error, _productId, context) => {
      if (context?.previous) setItems(context.previous);
      toast.error("Failed to remove product");
    },
    onSuccess: (updatedItems) => {
      setItems(normalizeItems(updatedItems));
      toast.success("Product removed");
    },
    onSettled: () => {
      setRemovingProductId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-collection", collectionId] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (nextItems: CollectionProductItem[]) =>
      adminApi.reorderCollectionProducts(
        collectionId as string,
        nextItems.map((entry) => ({
          productId: entry.productId,
          position: entry.position,
        })),
      ),
    onMutate: async (nextItems) => {
      const previous = items;
      setItems(nextItems);
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) setItems(context.previous);
      toast.error("Failed to reorder products");
    },
    onSuccess: (updatedItems) => {
      setItems(normalizeItems(updatedItems));
      toast.success("Order saved");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-collection", collectionId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => adminApi.deleteCollection(collectionId as string),
    onSuccess: () => {
      toast.success("Collection deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-collections"] });
      router.replace("/admin/collections");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete collection");
    },
  });

  const onFormChange = <K extends keyof CollectionFormValues>(key: K, value: CollectionFormValues[K]) => {
    setFormValues((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "title" && !slugTouched) {
        next.slug = slugify(String(value));
      }
      return next;
    });
    if (key === "slug") setSlugTouched(true);
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const onAddProduct = (product: Product) => {
    if (selectedProductIds.includes(product.id)) return;

    if (!isEditMode) {
      setItems((prev) =>
        compactPositions([
          ...prev,
          {
            productId: product.id,
            position: prev.length + 1,
            product,
          },
        ]),
      );
      return;
    }

    const previous = items;
    const optimistic = compactPositions([
      ...items,
      { productId: product.id, product, position: items.length + 1 },
    ]);
    setItems(optimistic);
    addProductsMutation.mutate([product.id], {
      onSuccess: (updatedItems) => {
        setItems(normalizeItems(updatedItems));
        toast.success("Product added");
        queryClient.invalidateQueries({ queryKey: ["admin-collection", collectionId] });
      },
      onError: () => {
        setItems(previous);
      },
    });
  };

  const onRemoveProduct = (productId: string) => {
    if (!isEditMode) {
      setItems((prev) => compactPositions(prev.filter((entry) => entry.productId !== productId)));
      return;
    }
    removeMutation.mutate(productId);
  };

  const onReorderProducts = (fromId: string, toId: string) => {
    const fromIndex = items.findIndex((entry) => entry.productId === fromId);
    const toIndex = items.findIndex((entry) => entry.productId === toId);
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;

    const nextItems = compactPositions(arrayMove(items, fromIndex, toIndex));
    if (!isEditMode) {
      setItems(nextItems);
      return;
    }
    reorderMutation.mutate(nextItems);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Partial<Record<keyof CollectionFormValues, string>> = {};
    if (!formValues.title.trim()) nextErrors.title = "Title is required";
    if (!slugify(formValues.slug.trim() || formValues.title.trim())) {
      nextErrors.slug = "Slug is required";
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    collectionMutation.mutate();
  };

  if (isEditMode && collectionQuery.isLoading) {
    return <p className="text-sm text-zinc-500">Loading collection...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">
            {isEditMode ? "Edit Collection" : "Create Collection"}
          </h1>
          <p className="text-sm text-zinc-600">
            Build manual collections with custom product ordering.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/collections">
            <Button variant="ghost">Back to collections</Button>
          </Link>
          {isEditMode ? (
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <section className="rounded border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-zinc-900">Collection Details</h2>
          <div className="mt-3">
            <CollectionForm
              values={formValues}
              errors={errors}
              onChange={onFormChange}
              onSubmit={onSubmit}
              submitting={collectionMutation.isPending}
              submitLabel={isEditMode ? "Save changes" : "Create collection"}
            />
          </div>
        </section>

        <div className="space-y-6">
          <ProductPicker selectedProductIds={selectedProductIds} onAddProduct={onAddProduct} />
          <ProductList
            items={items}
            removingProductId={removingProductId}
            savingOrder={reorderMutation.isPending}
            onRemove={onRemoveProduct}
            onReorder={onReorderProducts}
          />
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Collection"
        message="Are you sure you want to delete this collection? This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
}
