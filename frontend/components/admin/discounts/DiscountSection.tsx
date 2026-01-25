"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useDiscounts } from "@/hooks/useDiscounts";

import type { ProductVariant } from "@/types";

const toggleSelection = (items: string[], id: string) =>
  items.includes(id) ? items.filter((item) => item !== id) : [...items, id];

export function DiscountSection() {
  const {
    discounts,
    products,
    categories,
    loading,
    error,
    editingId,
    status,
    deleteConfirm,
    setDeleteConfirm,
    form,
    resetForm,
    handleEdit,
    handleSubmit,
    handleDelete,
    scopeLocked,
  } = useDiscounts();

  const productOptions = useMemo(
    () => products.map((p) => ({ id: p.id, name: p.name })),
    [products],
  );

  const variantsByProduct = useMemo(() => {
    const map = new Map<string, ProductVariant[]>();
    products.forEach((product) => {
      map.set(product.id, product.variants ?? []);
    });
    return map;
  }, [products]);

  const renderScopeSelectors = () => {
    const scope = form.watch("scope");
    const productIds = form.watch("productIds") ?? [];
    const variantIds = form.watch("variantIds") ?? [];
    const categoryIds = form.watch("categoryIds") ?? [];
    const collectionIds = form.watch("collectionIds") ?? [];

    if (scope === "PRODUCT") {
      return (
        <div className='space-y-2'>
          <p className='text-sm font-medium text-zinc-800'>Products</p>
          <div className='max-h-52 overflow-y-auto rounded border border-zinc-200 p-3 space-y-2'>
            {productOptions.map((product) => (
              <label
                key={product.id}
                className='flex items-center gap-2 text-sm text-zinc-700'>
                <input
                  type='checkbox'
                  checked={productIds.includes(product.id)}
                  onChange={() => {
                    const newIds = toggleSelection(productIds, product.id);
                    form.setValue("productIds", newIds);
                  }}
                />
                {product.name}
              </label>
            ))}
          </div>
        </div>
      );
    }

    if (scope === "VARIANT") {
      return (
        <div className='space-y-3'>
          <p className='text-sm font-medium text-zinc-800'>
            Variants by product
          </p>
          <div className='max-h-60 overflow-y-auto space-y-4 rounded border border-zinc-200 p-3'>
            {products.map((product) => (
              <div key={product.id} className='space-y-2'>
                <p className='text-xs font-semibold uppercase tracking-wide text-zinc-500'>
                  {product.name}
                </p>
                <div className='space-y-2'>
                  {(variantsByProduct.get(product.id) ?? []).map((variant) => (
                    <label
                      key={variant.id}
                      className='flex items-center gap-2 text-sm text-zinc-700'>
                      <input
                        type='checkbox'
                        checked={variantIds.includes(variant.id)}
                        onChange={() => {
                          const newIds = toggleSelection(variantIds, variant.id);
                          form.setValue("variantIds", newIds);
                        }}
                      />
                      <span className='text-zinc-800'>{variant.sku}</span>
                      <span className='text-xs text-zinc-500'>
                        ({variant.price} cents)
                      </span>
                    </label>
                  ))}
                  {(variantsByProduct.get(product.id) ?? []).length === 0 ? (
                    <p className='text-xs text-zinc-400'>No variants</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (scope === "CATEGORY") {
      return (
        <div className='space-y-2'>
          <p className='text-sm font-medium text-zinc-800'>Categories</p>
          <div className='max-h-52 overflow-y-auto rounded border border-zinc-200 p-3 space-y-2'>
            {categories.map((category) => (
              <label
                key={category.id}
                className='flex items-center gap-2 text-sm text-zinc-700'>
                <input
                  type='checkbox'
                  checked={categoryIds.includes(category.id)}
                  onChange={() => {
                    const newIds = toggleSelection(categoryIds, category.id);
                    form.setValue("categoryIds", newIds);
                  }}
                />
                {category.name}
              </label>
            ))}
          </div>
        </div>
      );
    }

    if (scope === "COLLECTION") {
      return (
        <div className='space-y-2'>
          <p className='text-sm font-medium text-zinc-800'>Collections</p>
          <div className='rounded border border-dashed border-zinc-200 p-4 text-sm text-zinc-500'>
            Collections are not configured yet.
          </div>
        </div>
      );
    }

    return (
      <p className='text-sm text-zinc-500'>
        Site-wide discounts apply to all products.
      </p>
    );
  };

  return (
    <>
      <div className='grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]'>
        <section className='rounded border border-zinc-200 bg-white p-4'>
          <h2 className='text-sm font-semibold text-zinc-900'>Discounts</h2>
          {discounts.length === 0 && !loading ? (
            <p className='mt-3 text-sm text-zinc-500'>
              No discounts created yet.
            </p>
          ) : (
            <div className='mt-3 space-y-2'>
              {discounts.map((discount) => (
                <div
                  key={discount.id}
                  className='flex items-center justify-between rounded border border-zinc-200 px-3 py-2 text-sm'>
                  <div>
                    <p className='font-medium text-zinc-900'>{discount.name}</p>
                    <p className='text-xs text-zinc-500'>
                      {discount.scope} · {discount.discountType} ·{" "}
                      {discount.discountValue}
                    </p>
                  </div>
                  <div className='flex gap-2'>
                    <Button
                      variant='ghost'
                      className='h-8 px-3'
                      onClick={() => handleEdit(discount)}>
                      Edit
                    </Button>
                    <Button
                      variant='ghost'
                      className='h-8 px-3'
                      onClick={() =>
                        setDeleteConfirm({ open: true, id: discount.id })
                      }>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className='rounded border border-zinc-200 bg-white p-4'>
          <h2 className='text-sm font-semibold text-zinc-900'>
            {editingId ? "Edit discount" : "Create discount"}
          </h2>
          {status ? (
            <div
              className={`mt-3 rounded border px-3 py-2 text-sm ${
                status.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}>
              {status.message}
            </div>
          ) : null}
          {error ? (
            <div className='mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800'>
              {error}
            </div>
          ) : null}
          <form className='mt-4 space-y-3' onSubmit={handleSubmit}>
            <div>
              <label className='text-sm font-medium text-zinc-800'>Name</label>
              <Input
                className='mt-2'
                {...form.register("name")}
              />
              {form.formState.errors.name ? (
                <p className='mt-1 text-xs text-red-600'>
                  {form.formState.errors.name.message}
                </p>
              ) : null}
            </div>
            <div>
              <label className='text-sm font-medium text-zinc-800'>
                Description
              </label>
              <Input
                className='mt-2'
                {...form.register("description")}
              />
            </div>
            <div className='grid gap-3 sm:grid-cols-2'>
              <div>
                <label className='text-sm font-medium text-zinc-800'>Type</label>
                <select
                  className='mt-2 h-10 w-full rounded border border-zinc-200 px-3 text-sm text-zinc-800'
                  {...form.register("discountType")}>
                  <option value='PERCENTAGE'>Percentage</option>
                  <option value='FIXED'>Fixed</option>
                </select>
              </div>
              <div>
                <label className='text-sm font-medium text-zinc-800'>Value</label>
                <Input
                  className='mt-2'
                  type='number'
                  min={0}
                  {...form.register("discountValue", { valueAsNumber: true })}
                />
                {form.formState.errors.discountValue ? (
                  <p className='mt-1 text-xs text-red-600'>
                    {form.formState.errors.discountValue.message}
                  </p>
                ) : null}
              </div>
            </div>
            <div className='grid gap-3 sm:grid-cols-2'>
              <div>
                <label className='text-sm font-medium text-zinc-800'>
                  Start date
                </label>
                <Input
                  className='mt-2'
                  type='date'
                  {...form.register("startDate")}
                />
                {form.formState.errors.startDate ? (
                  <p className='mt-1 text-xs text-red-600'>
                    {form.formState.errors.startDate.message}
                  </p>
                ) : null}
              </div>
              <div>
                <label className='text-sm font-medium text-zinc-800'>
                  End date
                </label>
                <Input
                  className='mt-2'
                  type='date'
                  {...form.register("endDate")}
                />
                {form.formState.errors.endDate ? (
                  <p className='mt-1 text-xs text-red-600'>
                    {form.formState.errors.endDate.message}
                  </p>
                ) : null}
              </div>
            </div>
            <div className='grid gap-3 sm:grid-cols-2'>
              <div>
                <label className='text-sm font-medium text-zinc-800'>
                  Priority
                </label>
                <Input
                  className='mt-2'
                  type='number'
                  min={0}
                  {...form.register("priority", { valueAsNumber: true })}
                />
              </div>
              <div className='flex items-center gap-3 pt-6'>
                <label className='flex items-center gap-2 text-sm text-zinc-700'>
                  <input
                    type='checkbox'
                    {...form.register("isStackable")}
                  />
                  Stackable
                </label>
                <label className='flex items-center gap-2 text-sm text-zinc-700'>
                  <input
                    type='checkbox'
                    {...form.register("isActive")}
                  />
                  Active
                </label>
              </div>
            </div>
            <div>
              <label className='text-sm font-medium text-zinc-800'>Scope</label>
              <select
                className='mt-2 h-10 w-full rounded border border-zinc-200 px-3 text-sm text-zinc-800 disabled:bg-zinc-50'
                {...form.register("scope")}
                disabled={scopeLocked}>
                <option value='SITE_WIDE'>Site-wide</option>
                <option value='PRODUCT'>Product</option>
                <option value='VARIANT'>Variant</option>
                <option value='CATEGORY'>Category</option>
                <option value='COLLECTION'>Collection</option>
              </select>
              {scopeLocked ? (
                <p className='mt-1 text-xs text-zinc-500'>
                  Scope is locked while editing.
                </p>
              ) : null}
            </div>
            {renderScopeSelectors()}
            <div className='flex gap-2'>
              <Button type='submit' disabled={form.formState.isSubmitting}>
                {editingId ? "Save" : "Create"}
              </Button>
              {editingId ? (
                <Button variant='ghost' type='button' onClick={resetForm}>
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        </section>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: null })}
        onConfirm={() => {
          if (deleteConfirm.id) {
            void handleDelete(deleteConfirm.id);
          }
        }}
        title='Delete Discount'
        message='Are you sure you want to delete this discount? This action cannot be undone.'
        confirmText='Delete'
      />
    </>
  );
}
