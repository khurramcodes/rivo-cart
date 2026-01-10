import { X, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "../ui/Button";
import { useState, useEffect } from "react";
import { CURRENCY } from './../../config/currency';

type VariantFormData = {
  id?: string;
  sku: string;
  price: string;
  stock: string;
  isDefault: boolean;
  attributes: { name: string; value: string }[];
};

type Props = {
  variants: VariantFormData[];
  productType: "SIMPLE" | "VARIABLE";
  onAddVariant: () => void;
  onRemoveVariant: (index: number, variantId?: string) => void;
  onUpdateVariant: (index: number, field: keyof VariantFormData, value: any) => void;
  onAddAttribute: (variantIndex: number) => void;
  onUpdateAttribute: (variantIndex: number, attrIndex: number, field: "name" | "value", value: string) => void;
  onRemoveAttribute: (variantIndex: number, attrIndex: number) => void;
  disabled?: boolean;
};

export function VariantFormSection({
  variants,
  productType,
  onAddVariant,
  onRemoveVariant,
  onUpdateVariant,
  onAddAttribute,
  onUpdateAttribute,
  onRemoveAttribute,
  disabled,
}: Props) {
  // Track which variants are expanded (default: all expanded)
  const [expandedVariants, setExpandedVariants] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    variants.forEach((_, idx) => { initial[idx] = true; });
    return initial;
  });

  // Auto-expand new variants
  useEffect(() => {
    setExpandedVariants((prev) => {
      const updated = { ...prev };
      variants.forEach((_, idx) => {
        if (updated[idx] === undefined) {
          updated[idx] = true; // New variant - expand by default
        }
      });
      return updated;
    });
  }, [variants.length]);

  const toggleVariant = (index: number) => {
    setExpandedVariants((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-zinc-800">
          Variants <span className="text-red-500">*</span>
        </label>
        {productType === "VARIABLE" && (
          <Button
            type="button"
            variant="ghost"
            onClick={onAddVariant}
            disabled={disabled}
            className="gap-1 text-xs h-8"
          >
            <Plus size={14} />
            Add Variant
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {variants.map((variant, vIdx) => {
          const isExpanded = expandedVariants[vIdx] ?? true;
          
          return (
          <div
            key={vIdx}
            className="border-2 border-zinc-200 rounded bg-zinc-50"
          >
            {/* Collapsible Header */}
            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-100/50 transition"
                 onClick={() => toggleVariant(vIdx)}>
              <div className="flex items-center gap-3">
                <button type="button" className="text-zinc-600 hover:text-zinc-900">
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                <span className="text-sm font-medium text-zinc-700">
                  Variant {vIdx + 1}
                  {variant.sku && <span className="ml-2 text-xs text-zinc-500">({variant.sku})</span>}
                  {variant.isDefault && (
                    <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      Default
                    </span>
                  )}
                </span>
              </div>
              {variants.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveVariant(vIdx, variant.id);
                  }}
                  disabled={disabled}
                  className="p-1 h-auto text-red-600 hover:bg-red-50"
                >
                  <X size={16} />
                </Button>
              )}
            </div>

            {/* Collapsible Body */}
            {isExpanded && (
            <div className="px-4 py-4 space-y-3 border-t border-zinc-200">

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  SKU <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={variant.sku}
                  onChange={(e) => onUpdateVariant(vIdx, "sku", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-black text-zinc-900"
                  placeholder="e.g., ALM-500G"
                  disabled={disabled}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Price ({CURRENCY.symbol}) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={variant.price}
                  onChange={(e) => onUpdateVariant(vIdx, "price", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-black text-zinc-900"
                  placeholder="0.00"
                  disabled={disabled}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Stock <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={variant.stock}
                  onChange={(e) => onUpdateVariant(vIdx, "stock", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-black text-zinc-900"
                  placeholder="0"
                  disabled={disabled}
                />
              </div>

              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={variant.isDefault}
                    onChange={(e) => onUpdateVariant(vIdx, "isDefault", e.target.checked)}
                    className="h-4 w-4 border-zinc-300 text-black focus:ring-black rounded"
                    disabled={disabled}
                  />
                  <span className="text-xs text-zinc-700">Set as default</span>
                </label>
              </div>
            </div>

            {/* Attributes Section (for VARIABLE products) */}
            {productType === "VARIABLE" && (
              <div className="border-t border-zinc-300 pt-3 mt-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-zinc-700">
                    Attributes (e.g., Weight, Size, Color)
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onAddAttribute(vIdx)}
                    disabled={disabled}
                    className="gap-1 text-xs h-7"
                  >
                    <Plus size={12} />
                    Add
                  </Button>
                </div>

                <div className="space-y-2">
                  {variant.attributes.map((attr, aIdx) => (
                    <div key={aIdx} className="flex gap-2">
                      <input
                        type="text"
                        value={attr.name}
                        onChange={(e) => onUpdateAttribute(vIdx, aIdx, "name", e.target.value)}
                        className="flex-1 px-2 py-1.5 text-xs border border-zinc-300 rounded focus:outline-none focus:ring-1 focus:ring-black text-zinc-900"
                        placeholder="Attribute (e.g., Weight)"
                        disabled={disabled}
                      />
                      <input
                        type="text"
                        value={attr.value}
                        onChange={(e) => onUpdateAttribute(vIdx, aIdx, "value", e.target.value)}
                        className="flex-1 px-2 py-1.5 text-xs border border-zinc-300 rounded focus:outline-none focus:ring-1 focus:ring-black text-zinc-900"
                        placeholder="Value (e.g., 500g)"
                        disabled={disabled}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => onRemoveAttribute(vIdx, aIdx)}
                        disabled={disabled}
                        className="p-1 h-auto text-red-600 hover:bg-red-50"
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  ))}

                  {variant.attributes.length === 0 && (
                    <p className="text-xs text-zinc-500 italic">
                      No attributes. Click "Add" to add attributes for this variant.
                    </p>
                  )}
                </div>
              </div>
            )}
            </div>
            )}
          </div>
          );
        })}
      </div>

      {productType === "SIMPLE" && variants.length > 0 && (
        <p className="text-xs text-zinc-500 italic">
          Simple products have one variant. Attributes are not used.
        </p>
      )}

      {productType === "VARIABLE" && (
        <p className="text-xs text-zinc-500 italic">
          Variable products can have multiple variants with different attributes and prices.
        </p>
      )}
    </div>
  );
}

