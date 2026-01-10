export type UserRole = "USER" | "ADMIN";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
};

export type Category = {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
};

export type ProductType = "SIMPLE" | "VARIABLE";

export type ProductVariantAttribute = {
  id: string;
  variantId: string;
  name: string;
  value: string;
  createdAt: string;
};

export type ProductVariant = {
  id: string;
  productId: string;
  sku: string;
  price: number; // cents
  stock: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  attributes?: ProductVariantAttribute[];
};

export type Product = {
  id: string;
  name: string;
  description?: string | null;
  type: ProductType;
  imageUrl: string;
  imageFileId?: string | null;
  imageFilePath?: string | null;
  imageFolderPath?: string | null;
  thumbUrl?: string | null;
  thumbFileId?: string | null;
  thumbFilePath?: string | null;
  galleryImages?: ProductGalleryImage[];
  variants?: ProductVariant[];
  categoryId: string;
  createdAt: string;
  updatedAt?: string;
  category?: Category;
};

export type ProductGalleryImage = {
  id: string;
  productId: string;
  index: number;
  url: string;
  fileId: string;
  filePath: string;
  createdAt: string;
  updatedAt: string;
};

export type OrderStatus = "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED";

export type OrderItem = {
  id: string;
  orderId: string;
  productId: string;
  variantId?: string | null;
  sku: string;
  quantity: number;
  price: number; // cents snapshot
  variantSnapshot?: string | null; // JSON string of attributes
  product?: Pick<Product, "id" | "name" | "imageUrl">;
};

export type Order = {
  id: string;
  userId: string;
  totalAmount: number; // cents
  paymentMethod: "COD";
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  createdAt: string;
  items?: OrderItem[];
  user?: Pick<User, "id" | "name" | "email" | "role" | "createdAt">;
};


