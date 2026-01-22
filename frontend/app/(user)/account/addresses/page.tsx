"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AddressForm, AddressFormValues } from "@/components/user/AddressForm";
import { Button } from "@/components/ui/Button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addAddress,
  deleteAddress,
  fetchAddresses,
  setDefaultAddress,
  updateAddress,
} from "@/store/slices/addressSlice";
import type { Address } from "@/types";

export default function AddressesPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const { items, status, error } = useAppSelector((s) => s.addresses);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    void dispatch(fetchAddresses());
  }, [dispatch, user]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
  }, [items]);

  const handleCreate = async (values: AddressFormValues) => {
    setSaving(true);
    try {
      await dispatch(addAddress(values)).unwrap();
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (values: AddressFormValues) => {
    if (!editing) return;
    setSaving(true);
    try {
      await dispatch(updateAddress({ id: editing.id, updates: values })).unwrap();
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this address?")) return;
    await dispatch(deleteAddress(id));
  };

  const handleSetDefault = async (id: string) => {
    await dispatch(setDefaultAddress(id));
  };

  if (!user) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Addresses</h1>
        <p className="mt-2 text-sm text-zinc-600">Please login to manage addresses.</p>
        <Link href="/login" className="mt-4 inline-block">
          <Button>Login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Addresses</h1>
          <p className="mt-1 text-sm text-zinc-600">Manage your saved shipping addresses.</p>
        </div>
        <Button onClick={() => setShowForm((prev) => !prev)}>
          {showForm ? "Close" : "Add address"}
        </Button>
      </div>

      {showForm ? (
        <div className="rounded border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold text-zinc-900">New address</h2>
          <div className="mt-4">
            <AddressForm
              onSubmit={handleCreate}
              loading={saving}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      ) : null}

      {editing ? (
        <div className="rounded border border-zinc-200 p-6">
          <h2 className="text-lg font-semibold text-zinc-900">Edit address</h2>
          <div className="mt-4">
            <AddressForm
              initialValues={editing}
              submitLabel="Update address"
              onSubmit={handleUpdate}
              loading={saving}
              onCancel={() => setEditing(null)}
            />
          </div>
        </div>
      ) : null}

      {status === "loading" ? (
        <p className="text-sm text-zinc-600">Loading addresses…</p>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="space-y-4">
        {sortedItems.length === 0 && status !== "loading" ? (
          <p className="text-sm text-zinc-600">No addresses saved yet.</p>
        ) : null}
        {sortedItems.map((address) => (
          <div
            key={address.id}
            className="rounded border border-zinc-200 p-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
          >
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-zinc-900">{address.fullName}</h3>
                {address.isDefault ? (
                  <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    Default
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-zinc-600">{address.phone}</p>
              <p className="text-sm text-zinc-600">
                {address.streetAddress}, {address.city}, {address.state}, {address.country}
              </p>
              {address.postalCode ? (
                <p className="text-sm text-zinc-600">Postal code: {address.postalCode}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!address.isDefault ? (
                <Button
                  variant="ghost"
                  className="h-9 px-3"
                  onClick={() => handleSetDefault(address.id)}
                >
                  Make default
                </Button>
              ) : null}
              <Button variant="ghost" className="h-9 px-3" onClick={() => setEditing(address)}>
                Edit
              </Button>
              <Button variant="ghost" className="h-9 px-3" onClick={() => handleDelete(address.id)}>
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
