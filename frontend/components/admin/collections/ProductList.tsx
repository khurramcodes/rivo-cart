"use client";

import { CSS } from "@dnd-kit/utilities";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Product } from "@/types";
import { formatPrice } from "@/config/currency";

export type CollectionProductItem = {
  productId: string;
  position: number;
  product: Product;
};

type SortableRowProps = {
  item: CollectionProductItem;
  removing: boolean;
  onRemove: (productId: string) => void;
};

function toDisplayPrice(product: Product) {
  if (!product.variants || product.variants.length === 0) return "N/A";
  const prices = product.variants.map((entry) => entry.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? formatPrice(min) : `${formatPrice(min)} - ${formatPrice(max)}`;
}

function SortableRow({ item, removing, onRemove }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: item.productId,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded border border-zinc-200 bg-white px-3 py-2"
    >
      <button
        type="button"
        className="cursor-grab text-zinc-400 hover:text-zinc-700"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </button>
      <img
        src={item.product.thumbUrl || item.product.imageUrl}
        alt={item.product.name}
        className="h-10 w-10 rounded object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-900">{item.product.name}</p>
        <p className="text-xs text-zinc-500">{toDisplayPrice(item.product)}</p>
      </div>
      <span className="text-xs text-zinc-500">#{item.position}</span>
      <Button
        type="button"
        variant="ghost"
        disabled={removing}
        className="text-red-600 hover:bg-red-50"
        onClick={() => onRemove(item.productId)}
      >
        <Trash2 size={16} />
      </Button>
    </div>
  );
}

type Props = {
  items: CollectionProductItem[];
  removingProductId?: string | null;
  savingOrder?: boolean;
  onRemove: (productId: string) => void;
  onReorder: (fromId: string, toId: string) => void;
};

export function ProductList({
  items,
  removingProductId,
  savingOrder,
  onRemove,
  onReorder,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onReorder(String(active.id), String(over.id));
  };

  return (
    <section className="rounded border border-zinc-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900">Selected Products</h2>
        {savingOrder ? <span className="text-xs text-zinc-500">Saving order...</span> : null}
      </div>

      {items.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">No products selected.</p>
      ) : (
        <div className="mt-3">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((item) => item.productId)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {items.map((item) => (
                  <SortableRow
                    key={item.productId}
                    item={item}
                    removing={removingProductId === item.productId}
                    onRemove={onRemove}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </section>
  );
}
