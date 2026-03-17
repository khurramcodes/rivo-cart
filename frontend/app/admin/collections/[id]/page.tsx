"use client";

import { useParams } from "next/navigation";
import { CollectionEditor } from "@/components/admin/collections/CollectionEditor";

export default function AdminEditCollectionPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  return <CollectionEditor collectionId={id} />;
}
