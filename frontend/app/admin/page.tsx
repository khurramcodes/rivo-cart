"use client";

import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Dashboard</h1>
      <p className="mt-2 text-sm text-zinc-600">Manage catalog and orders.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Link className="rounded border border-zinc-200 p-4 hover:border-zinc-300" href="/admin/products">
          <p className="text-sm font-medium text-zinc-900">Products</p>
          <p className="mt-1 text-sm font-semibold text-zinc-600">Manage Products</p>
        </Link>
        <Link className="rounded border border-zinc-200 p-4 hover:border-zinc-300" href="/admin/categories">
          <p className="text-sm font-medium text-zinc-900">Categories</p>
          <p className="mt-1 text-sm font-semibold text-zinc-600">Manage Categories</p>
        </Link>
        <Link className="rounded border border-zinc-200 p-4 hover:border-zinc-300" href="/admin/orders">
          <p className="text-sm font-medium text-zinc-900">Orders</p>
          <p className="mt-1 text-sm font-semibold text-zinc-600">Manage Orders</p>
        </Link>
      </div>
    </div>
  );
}


