"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useCoupons } from "@/hooks/useCoupons";

export function CouponSection() {
  const {
    coupons,
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
  } = useCoupons();

  return (
    <>
      <div className='grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]'>
        <section className='rounded border border-zinc-200 bg-white p-4'>
          <h2 className='text-sm font-semibold text-zinc-900'>Coupons</h2>
          {coupons.length === 0 && !loading ? (
            <p className='mt-3 text-sm text-zinc-500'>
              No coupons created yet.
            </p>
          ) : (
            <div className='mt-3 space-y-2'>
              {coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className='flex items-center justify-between rounded border border-zinc-200 px-3 py-2 text-sm'>
                  <div>
                    <p className='font-medium text-zinc-900'>{coupon.code}</p>
                    <p className='text-xs text-zinc-500'>
                      {coupon.discountType} · {coupon.discountValue}
                    </p>
                  </div>
                  <div className='flex gap-2'>
                    <Button
                      variant='ghost'
                      className='h-8 px-3'
                      onClick={() => handleEdit(coupon)}>
                      Edit
                    </Button>
                    <Button
                      variant='ghost'
                      className='h-8 px-3'
                      onClick={() =>
                        setDeleteConfirm({ open: true, id: coupon.id })
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
            {editingId ? "Edit coupon" : "Create coupon"}
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
              <label className='text-sm font-medium text-zinc-800'>Code</label>
              <Input
                className='mt-2'
                {...form.register("code")}
                disabled={!!editingId}
              />
              {form.formState.errors.code ? (
                <p className='mt-1 text-xs text-red-600'>
                  {form.formState.errors.code.message}
                </p>
              ) : null}
              {editingId ? (
                <p className='mt-1 text-xs text-zinc-500'>
                  Code cannot be changed when editing.
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
                  className='mt-2 h-10 w-full rounded border border-zinc-200 px-3 text-sm'
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
                  Minimum cart value
                </label>
                <Input
                  className='mt-2'
                  type='number'
                  min={0}
                  {...form.register("minimumCartValue")}
                />
              </div>
              <div>
                <label className='text-sm font-medium text-zinc-800'>
                  Max redemptions
                </label>
                <Input
                  className='mt-2'
                  type='number'
                  min={1}
                  {...form.register("maxRedemptions")}
                />
              </div>
            </div>
            <div className='grid gap-3 sm:grid-cols-2'>
              <div>
                <label className='text-sm font-medium text-zinc-800'>
                  Max redemptions per user
                </label>
                <Input
                  className='mt-2'
                  type='number'
                  min={1}
                  {...form.register("maxRedemptionsPerUser")}
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
        title='Delete Coupon'
        message='Are you sure you want to delete this coupon? This action cannot be undone.'
        confirmText='Delete'
      />
    </>
  );
}
