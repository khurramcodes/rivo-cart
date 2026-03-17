"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { adminApi } from "@/services/adminApi";

export default function AdminCollectionsPage() {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-collections"],
    queryFn: adminApi.listCollections,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => adminApi.deleteCollection(id),
    onSuccess: () => {
      toast.success("Collection deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-collections"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete collection");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Collections</h1>
          <p className="text-sm text-zinc-600">
            Manage manual storefront collections and product curation.
          </p>
        </div>
        <Link href="/admin/collections/create">
          <Button>Create collection</Button>
        </Link>
      </div>

      <div className="rounded border border-zinc-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-180 text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Title</th>
                <th className="px-4 py-3 text-left font-medium">Slug</th>
                <th className="px-4 py-3 text-left font-medium">Products</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="px-4 py-10 text-center text-zinc-500" colSpan={5}>
                    Loading collections...
                  </td>
                </tr>
              ) : null}
              {!isLoading && (data?.length ?? 0) === 0 ? (
                <tr>
                  <td className="px-4 py-10 text-center text-zinc-500" colSpan={5}>
                    No collections created yet.
                  </td>
                </tr>
              ) : null}
              {(data ?? []).map((collection) => (
                <tr key={collection.id} className="border-b border-zinc-100 last:border-b-0">
                  <td className="px-4 py-3 font-medium text-zinc-900">{collection.title}</td>
                  <td className="px-4 py-3 text-zinc-600">{collection.slug}</td>
                  <td className="px-4 py-3 text-zinc-600">{collection._count?.products ?? 0}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-1 text-xs ${
                        collection.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-zinc-100 text-zinc-700"
                      }`}
                    >
                      {collection.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <Link href={`/admin/collections/${collection.id}`}>
                        <Button variant="ghost">Edit</Button>
                      </Link>
                      <Button variant="ghost" onClick={() => setDeleteId(collection.id)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) deleteMutation.mutate(deleteId);
        }}
        title="Delete Collection"
        message="Are you sure you want to delete this collection? This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
}
