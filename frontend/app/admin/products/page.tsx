"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2, Package } from "lucide-react";
import { adminApi } from "@/services/adminApi";
import { uploadToImageKit } from "@/services/imagekitUpload";
import type { Category, Product, ProductType } from "@/types";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { VariantFormSection } from "@/components/admin/VariantFormSection";
import { addCacheBust } from "@/utils/imageCache";
import { formatPrice } from "@/config/currency";

type VariantFormData = {
  id?: string;
  sku: string;
  price: string;
  stock: string;
  isDefault: boolean;
  attributes: { name: string; value: string }[];
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    productId: string | null;
  }>({
    open: false,
    productId: null,
  });

  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    type: "SIMPLE" as ProductType,
    categoryId: "",
    mainImage: null as File | null,
    gallery1: null as File | null,
    gallery2: null as File | null,
    gallery3: null as File | null,
    variants: [
      { sku: "", price: "", stock: "0", isDefault: true, attributes: [] },
    ] as VariantFormData[],
  });

  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    type: "SIMPLE" as ProductType,
    categoryId: "",
    mainImage: null as File | string | null,
    gallery1: null as File | string | null,
    gallery2: null as File | string | null,
    gallery3: null as File | string | null,
    variants: [] as VariantFormData[],
    deleteVariantIds: [] as string[],
  });

  const [imageBust, setImageBust] = useState<Record<string, number>>({});

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        adminApi.listProducts(),
        adminApi.listCategories(),
      ]);
      setProducts(prodRes.items);
      setCategories(catRes.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function dollarsToCents(dollars: string): number {
    return Math.round(parseFloat(dollars) * 100);
  }

  function centsToDollars(cents: number): string {
    return (cents / 100).toFixed(2);
  }

  // Variant management for create
  const addVariantToCreate = () =>
    setCreateForm({
      ...createForm,
      variants: [
        ...createForm.variants,
        { sku: "", price: "", stock: "0", isDefault: false, attributes: [] },
      ],
    });
  const removeVariantFromCreate = (index: number) => {
    if (createForm.variants.length > 1)
      setCreateForm({
        ...createForm,
        variants: createForm.variants.filter((_, i) => i !== index),
      });
    else alert("At least one variant required");
  };
  const updateCreateVariant = (
    index: number,
    field: keyof VariantFormData,
    value: any
  ) => {
    const updated = [...createForm.variants];
    updated[index] = { ...updated[index], [field]: value };
    setCreateForm({ ...createForm, variants: updated });
  };
  const addAttributeToCreateVariant = (variantIndex: number) => {
    const updated = [...createForm.variants];
    updated[variantIndex].attributes.push({ name: "", value: "" });
    setCreateForm({ ...createForm, variants: updated });
  };
  const updateCreateVariantAttribute = (
    variantIndex: number,
    attrIndex: number,
    field: "name" | "value",
    value: string
  ) => {
    const updated = [...createForm.variants];
    updated[variantIndex].attributes[attrIndex][field] = value;
    setCreateForm({ ...createForm, variants: updated });
  };
  const removeAttributeFromCreateVariant = (
    variantIndex: number,
    attrIndex: number
  ) => {
    const updated = [...createForm.variants];
    updated[variantIndex].attributes.splice(attrIndex, 1);
    setCreateForm({ ...createForm, variants: updated });
  };

  // Variant management for edit
  const addVariantToEdit = () =>
    setEditForm({
      ...editForm,
      variants: [
        ...editForm.variants,
        { sku: "", price: "", stock: "0", isDefault: false, attributes: [] },
      ],
    });
  const removeVariantFromEdit = (index: number, variantId?: string) => {
    if (editForm.variants.length > 1) {
      const newVariants = editForm.variants.filter((_, i) => i !== index);
      const newDeleteIds = variantId
        ? [...editForm.deleteVariantIds, variantId]
        : editForm.deleteVariantIds;
      setEditForm({
        ...editForm,
        variants: newVariants,
        deleteVariantIds: newDeleteIds,
      });
    } else alert("At least one variant required");
  };
  const updateEditVariant = (
    index: number,
    field: keyof VariantFormData,
    value: any
  ) => {
    const updated = [...editForm.variants];
    updated[index] = { ...updated[index], [field]: value };
    setEditForm({ ...editForm, variants: updated });
  };
  const addAttributeToEditVariant = (variantIndex: number) => {
    const updated = [...editForm.variants];
    updated[variantIndex].attributes.push({ name: "", value: "" });
    setEditForm({ ...editForm, variants: updated });
  };
  const updateEditVariantAttribute = (
    variantIndex: number,
    attrIndex: number,
    field: "name" | "value",
    value: string
  ) => {
    const updated = [...editForm.variants];
    updated[variantIndex].attributes[attrIndex][field] = value;
    setEditForm({ ...editForm, variants: updated });
  };
  const removeAttributeFromEditVariant = (
    variantIndex: number,
    attrIndex: number
  ) => {
    const updated = [...editForm.variants];
    updated[variantIndex].attributes.splice(attrIndex, 1);
    setEditForm({ ...editForm, variants: updated });
  };

  async function handleCreateProduct() {
    if (!createForm.name || !createForm.categoryId || !createForm.mainImage) {
      alert("Please fill name, category, and main image");
      return;
    }
    if (createForm.variants.length === 0) {
      alert("At least one variant required");
      return;
    }
    if (createForm.variants.some((v) => !v.sku || !v.price)) {
      alert("All variants need SKU and price");
      return;
    }
    if (createForm.type === "SIMPLE" && createForm.variants.length > 1) {
      alert("Simple products can only have one variant");
      return;
    }

    setUploading(true);
    try {
      const init = await adminApi.newProductId();
      const mainUploaded = await uploadToImageKit(
        createForm.mainImage,
        init.imageFolderPath,
        "main.webp"
      );

      const galleryData: any[] = [];
      if (createForm.gallery1) {
        const g1 = await uploadToImageKit(
          createForm.gallery1,
          init.imageFolderPath,
          "gallery-1.webp"
        );
        galleryData.push({
          index: 1,
          url: g1.url,
          fileId: g1.fileId,
          filePath: g1.filePath,
        });
      }
      if (createForm.gallery2) {
        const g2 = await uploadToImageKit(
          createForm.gallery2,
          init.imageFolderPath,
          "gallery-2.webp"
        );
        galleryData.push({
          index: 2,
          url: g2.url,
          fileId: g2.fileId,
          filePath: g2.filePath,
        });
      }
      if (createForm.gallery3) {
        const g3 = await uploadToImageKit(
          createForm.gallery3,
          init.imageFolderPath,
          "gallery-3.webp"
        );
        galleryData.push({
          index: 3,
          url: g3.url,
          fileId: g3.fileId,
          filePath: g3.filePath,
        });
      }

      const variants = createForm.variants.map((v) => ({
        sku: v.sku,
        price: dollarsToCents(v.price),
        stock: parseInt(v.stock) || 0,
        isDefault: v.isDefault,
        attributes: v.attributes.filter((a) => a.name && a.value),
      }));

      const created = await adminApi.createProduct({
        id: init.id,
        name: createForm.name,
        description: createForm.description,
        type: createForm.type,
        categoryId: createForm.categoryId,
        imageUrl: mainUploaded.url,
        imageFileId: mainUploaded.fileId,
        imageFilePath: mainUploaded.filePath,
        imageFolderPath: init.imageFolderPath,
        thumbUrl: mainUploaded.url,
        thumbFileId: mainUploaded.fileId,
        thumbFilePath: mainUploaded.filePath,
        gallery: galleryData,
        variants,
      });

      setProducts((prev) => [created, ...prev]);
      setIsCreateModalOpen(false);
      setCreateForm({
        name: "",
        description: "",
        type: "SIMPLE",
        categoryId: "",
        mainImage: null,
        gallery1: null,
        gallery2: null,
        gallery3: null,
        variants: [
          { sku: "", price: "", stock: "0", isDefault: true, attributes: [] },
        ],
      });
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to create product");
    } finally {
      setUploading(false);
    }
  }

  async function handleEditProduct() {
    if (
      !editingProduct ||
      !editForm.name ||
      !editForm.categoryId ||
      !editForm.mainImage
    ) {
      alert("Fill required fields");
      return;
    }
    if (editForm.variants.some((v) => !v.sku || !v.price)) {
      alert("All variants need SKU and price");
      return;
    }

    setUploading(true);
    try {
      const folder = editingProduct.imageFolderPath!;
      const payload: any = {
        name: editForm.name,
        description: editForm.description,
        type: editForm.type,
        categoryId: editForm.categoryId,
      };

      if (editForm.mainImage instanceof File) {
        const mainUploaded = await uploadToImageKit(
          editForm.mainImage,
          folder,
          "main.webp",
          editingProduct.imageFileId
        );
        payload.imageUrl = mainUploaded.url;
        payload.imageFileId = mainUploaded.fileId;
        payload.imageFilePath = mainUploaded.filePath;
        payload.thumbUrl = mainUploaded.url;
        payload.thumbFileId = mainUploaded.fileId;
        payload.thumbFilePath = mainUploaded.filePath;
      }

      const galleryData: any[] = [];
      const galleryToDelete: number[] = [];

      for (let idx = 1; idx <= 3; idx++) {
        const formField = `gallery${idx}` as keyof typeof editForm;
        const galleryImg = editForm[formField];
        const existing = editingProduct.galleryImages?.find(
          (g) => g.index === idx
        );

        if (galleryImg instanceof File) {
          const uploaded = await uploadToImageKit(
            galleryImg,
            folder,
            `gallery-${idx}.webp`,
            existing?.fileId
          );
          galleryData.push({
            index: idx,
            url: uploaded.url,
            fileId: uploaded.fileId,
            filePath: uploaded.filePath,
          });
        } else if (galleryImg === null && existing) {
          galleryToDelete.push(idx);
        } else if (typeof galleryImg === "string" && existing) {
          galleryData.push({
            index: idx,
            url: existing.url,
            fileId: existing.fileId,
            filePath: existing.filePath,
          });
        }
      }

      if (galleryData.length > 0) payload.gallery = galleryData;
      if (galleryToDelete.length > 0)
        payload.deleteGalleryIndexes = galleryToDelete;

      payload.variants = editForm.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        price: dollarsToCents(v.price),
        stock: parseInt(v.stock) || 0,
        isDefault: v.isDefault,
        attributes: v.attributes.filter((a) => a.name && a.value),
      }));
      if (editForm.deleteVariantIds.length > 0)
        payload.deleteVariantIds = editForm.deleteVariantIds;

      const updated = await adminApi.updateProduct(editingProduct.id, payload);
      const freshProduct = await adminApi.getProduct(updated.id);
      setProducts((prev) =>
        prev.map((p) => (p.id === freshProduct.id ? freshProduct : p))
      );
      setImageBust((prev) => ({ ...prev, [updated.id]: Date.now() }));
      setIsEditModalOpen(false);
      setEditingProduct(null);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update");
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteProduct() {
    if (!deleteConfirm.productId) return;
    try {
      await adminApi.deleteProduct(deleteConfirm.productId);
      setProducts((prev) =>
        prev.filter((p) => p.id !== deleteConfirm.productId)
      );
    } catch (err) {
      alert("Failed to delete");
    }
  }

  function openEditModal(product: Product) {
    setEditingProduct(product);
    const timestamp = Date.now();
    const g1 = product.galleryImages?.find((g) => g.index === 1);
    const g2 = product.galleryImages?.find((g) => g.index === 2);
    const g3 = product.galleryImages?.find((g) => g.index === 3);

    const variantForms: VariantFormData[] = (product.variants || []).map(
      (v) => ({
        id: v.id,
        sku: v.sku,
        price: centsToDollars(v.price),
        stock: v.stock.toString(),
        isDefault: v.isDefault,
        attributes:
          v.attributes?.map((a) => ({ name: a.name, value: a.value })) || [],
      })
    );

    setEditForm({
      name: product.name,
      description: product.description || "",
      type: product.type,
      categoryId: product.categoryId,
      mainImage: product.imageUrl
        ? addCacheBust(product.imageUrl, timestamp)
        : null,
      gallery1: g1?.url ? addCacheBust(g1.url, timestamp) : null,
      gallery2: g2?.url ? addCacheBust(g2.url, timestamp) : null,
      gallery3: g3?.url ? addCacheBust(g3.url, timestamp) : null,
      variants:
        variantForms.length > 0
          ? variantForms
          : [
              {
                sku: "",
                price: "",
                stock: "0",
                isDefault: true,
                attributes: [],
              },
            ],
      deleteVariantIds: [],
    });
    setIsEditModalOpen(true);
  }

  function getProductDisplayPrice(product: Product): string {
    if (!product.variants || product.variants.length === 0) return "N/A";
    if (product.type === "SIMPLE")
      return formatPrice(product.variants[0].price);
    const prices = product.variants.map((v) => v.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max
      ? formatPrice(min)
      : `${formatPrice(min)} - ${formatPrice(max)}`;
  }

  if (loading)
    return (
      <div className='flex items-center justify-center h-64'>
        <p className='text-zinc-500'>Loading...</p>
      </div>
    );

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-zinc-900'>Products</h1>
          <p className='text-zinc-600 text-sm mt-1'>
            Manage products with variants, SKUs, and stock
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className='gap-2'>
          <Plus size={18} />
          Add Product
        </Button>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {products.map((product) => {
          const timestamp =
            imageBust[product.id] || product.updatedAt || Date.now();
          const imageUrl = addCacheBust(product.imageUrl, timestamp);
          const totalStock =
            product.variants?.reduce((sum, v) => sum + v.stock, 0) || 0;

          return (
            <div
              key={product.id}
              className='bg-white rounded border border-zinc-200 overflow-hidden hover:shadow-lg transition'>
              <img
                src={imageUrl}
                alt={product.name}
                className='w-full h-48 object-cover'
              />
              <div className='p-4'>
                <div className='flex items-center gap-2 mb-2'>
                  <span
                    className={`text-xs px-2 py-0.5 roundedll font-medium ${
                      product.type === "SIMPLE"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-purple-100 text-purple-700"
                    }`}>
                    {product.type}
                  </span>
                  <span className='text-xs text-zinc-500 flex items-center gap-1'>
                    <Package size={12} />
                    {product.variants?.length || 0} variant
                    {product.variants?.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <h3 className='font-semibold text-zinc-900 truncate'>
                  {product.name}
                </h3>
                <p className='text-sm text-zinc-600 line-clamp-2 mt-1'>
                  {product.description || "No description"}
                </p>
                <div className='flex items-center justify-between mt-4'>
                  <div>
                    <span className='text-lg font-bold text-zinc-900'>
                      {getProductDisplayPrice(product)}
                    </span>
                    <p className='text-xs text-zinc-500 mt-0.5'>
                      {totalStock} in stock
                    </p>
                  </div>
                  <div className='flex gap-2'>
                    <Button
                      variant='ghost'
                      onClick={() => openEditModal(product)}
                      className='p-2'>
                      <Pencil size={16} />
                    </Button>
                    <Button
                      variant='ghost'
                      onClick={() =>
                        setDeleteConfirm({ open: true, productId: product.id })
                      }
                      className='p-2 text-red-600 hover:bg-red-50'>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {products.length === 0 && (
        <div className='text-center py-12 bg-white rounded border border-zinc-200'>
          <p className='text-zinc-500'>No products yet!</p>
        </div>
      )}

      {/* CREATE MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title='Create Product'
        size='lg'>
        <div className='space-y-4 max-h-[70vh] overflow-y-auto pr-2'>
          <div>
            <label className='block text-sm font-medium text-zinc-700 mb-1'>
              Name <span className='text-red-500'>*</span>
            </label>
            <input
              type='text'
              value={createForm.name}
              onChange={(e) =>
                setCreateForm({ ...createForm, name: e.target.value })
              }
              className='w-full px-3 py-2 border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-black text-zinc-900'
              disabled={uploading}
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-zinc-700 mb-1'>
              Description
            </label>
            <textarea
              value={createForm.description}
              onChange={(e) =>
                setCreateForm({ ...createForm, description: e.target.value })
              }
              rows={3}
              className='w-full px-3 py-2 border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-black text-zinc-900'
              disabled={uploading}
            />
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-zinc-700 mb-1'>
                Product Type <span className='text-red-500'>*</span>
              </label>
              <select
                value={createForm.type}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    type: e.target.value as ProductType,
                  })
                }
                className='w-full px-3 py-2 border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-black text-zinc-900'
                disabled={uploading}>
                <option value='SIMPLE'>Simple Product</option>
                <option value='VARIABLE'>Variable Product</option>
              </select>
            </div>
            <div>
              <label className='block text-sm font-medium text-zinc-700 mb-1'>
                Category <span className='text-red-500'>*</span>
              </label>
              <select
                value={createForm.categoryId}
                onChange={(e) =>
                  setCreateForm({ ...createForm, categoryId: e.target.value })
                }
                className='w-full px-3 py-2 border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-black text-zinc-900'
                disabled={uploading}>
                <option value=''>Select</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <ImageUpload
            label='Main Image'
            value={createForm.mainImage}
            onChange={(file) =>
              setCreateForm({ ...createForm, mainImage: file })
            }
            required
            disabled={uploading}
          />
          <div className='grid grid-cols-3 gap-4'>
            <ImageUpload
              label='Gallery 1'
              value={createForm.gallery1}
              onChange={(file) =>
                setCreateForm({ ...createForm, gallery1: file })
              }
              disabled={uploading}
            />
            <ImageUpload
              label='Gallery 2'
              value={createForm.gallery2}
              onChange={(file) =>
                setCreateForm({ ...createForm, gallery2: file })
              }
              disabled={uploading}
            />
            <ImageUpload
              label='Gallery 3'
              value={createForm.gallery3}
              onChange={(file) =>
                setCreateForm({ ...createForm, gallery3: file })
              }
              disabled={uploading}
            />
          </div>
          <VariantFormSection
            variants={createForm.variants}
            productType={createForm.type}
            onAddVariant={addVariantToCreate}
            onRemoveVariant={removeVariantFromCreate}
            onUpdateVariant={updateCreateVariant}
            onAddAttribute={addAttributeToCreateVariant}
            onUpdateAttribute={updateCreateVariantAttribute}
            onRemoveAttribute={removeAttributeFromCreateVariant}
            disabled={uploading}
          />
          <div className='flex gap-3 justify-end pt-4 border-t border-zinc-200'>
            <Button
              variant='ghost'
              onClick={() => setIsCreateModalOpen(false)}
              disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={handleCreateProduct} disabled={uploading}>
              {uploading ? "Creating..." : "Create Product"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title='Edit Product'
        size='lg'>
        <div className='space-y-4 max-h-[70vh] overflow-y-auto pr-2'>
          <div>
            <label className='block text-sm font-medium text-zinc-700 mb-1'>
              Name <span className='text-red-500'>*</span>
            </label>
            <input
              type='text'
              value={editForm.name}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
              className='w-full px-3 py-2 border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-black text-zinc-900'
              disabled={uploading}
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-zinc-700 mb-1'>
              Description
            </label>
            <textarea
              value={editForm.description}
              onChange={(e) =>
                setEditForm({ ...editForm, description: e.target.value })
              }
              rows={3}
              className='w-full px-3 py-2 border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-black text-zinc-900'
              disabled={uploading}
            />
          </div>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-zinc-700 mb-1'>
                Product Type <span className='text-red-500'>*</span>
              </label>
              <select
                value={editForm.type}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    type: e.target.value as ProductType,
                  })
                }
                className='w-full px-3 py-2 border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-black text-zinc-900'
                disabled={uploading}>
                <option value='SIMPLE'>Simple Product</option>
                <option value='VARIABLE'>Variable Product</option>
              </select>
            </div>
            <div>
              <label className='block text-sm font-medium text-zinc-700 mb-1'>
                Category <span className='text-red-500'>*</span>
              </label>
              <select
                value={editForm.categoryId}
                onChange={(e) =>
                  setEditForm({ ...editForm, categoryId: e.target.value })
                }
                className='w-full px-3 py-2 border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-black text-zinc-900'
                disabled={uploading}>
                <option value=''>Select</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <ImageUpload
            label='Main Image'
            value={editForm.mainImage}
            onChange={(file) => setEditForm({ ...editForm, mainImage: file })}
            required
            disabled={uploading}
            disableRemove
          />
          <div className='grid grid-cols-3 gap-4'>
            <ImageUpload
              label='Gallery 1'
              value={editForm.gallery1}
              onChange={(file) => setEditForm({ ...editForm, gallery1: file })}
              disabled={uploading}
            />
            <ImageUpload
              label='Gallery 2'
              value={editForm.gallery2}
              onChange={(file) => setEditForm({ ...editForm, gallery2: file })}
              disabled={uploading}
            />
            <ImageUpload
              label='Gallery 3'
              value={editForm.gallery3}
              onChange={(file) => setEditForm({ ...editForm, gallery3: file })}
              disabled={uploading}
            />
          </div>
          <VariantFormSection
            variants={editForm.variants}
            productType={editForm.type}
            onAddVariant={addVariantToEdit}
            onRemoveVariant={removeVariantFromEdit}
            onUpdateVariant={updateEditVariant}
            onAddAttribute={addAttributeToEditVariant}
            onUpdateAttribute={updateEditVariantAttribute}
            onRemoveAttribute={removeAttributeFromEditVariant}
            disabled={uploading}
          />
          <div className='flex gap-3 justify-end pt-4 border-t border-zinc-200'>
            <Button
              variant='ghost'
              onClick={() => setIsEditModalOpen(false)}
              disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={handleEditProduct} disabled={uploading}>
              {uploading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, productId: null })}
        onConfirm={handleDeleteProduct}
        title='Delete Product?'
        message='This will permanently delete the product, all variants, and images. Cannot be undone.'
        confirmText='Delete'
        cancelText='Cancel'
        variant='danger'
      />
    </div>
  );
}
