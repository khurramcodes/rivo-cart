export type UserRole = "USER" | "ADMIN";

export type User = {
  id: string;
  name: string;
  firstName: string;
  lastName?: string | null;
  email: string;
  role: UserRole;
  createdAt: string;
};

export type Address = {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  country: string;
  state: string;
  city: string;
  streetAddress: string;
  postalCode?: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
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
  ratingAverage?: number;
  ratingCount?: number;
  reviewCount?: number;
  createdAt: string;
  updatedAt?: string;
  category?: Category;
};

export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED" | "REMOVED";

export type ReviewReply = {
  id: string;
  reviewId: string;
  adminId: string;
  message: string;
  createdAt: string;
  updatedAt: string;
  admin?: Pick<User, "id" | "name">;
};

export type Review = {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  reportCount: number;
  approvedAt?: string | null;
  approvedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, "id" | "name"> & { email?: string };
  product?: Pick<Product, "id" | "name">;
  reply?: ReviewReply | null;
};

export type QuestionStatus = "VISIBLE" | "HIDDEN" | "REMOVED";
export type AnswerStatus = "VISIBLE" | "HIDDEN" | "REMOVED";

export type Question = {
  id: string;
  productId: string;
  userId: string;
  question: string;
  status: QuestionStatus;
  helpfulCount: number;
  reportCount: number;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, "id" | "name">;
  product?: Pick<Product, "id" | "name">;
  answers?: Answer[];
};

export type Answer = {
  id: string;
  questionId: string;
  adminId: string;
  answer: string;
  status: AnswerStatus;
  helpfulCount: number;
  reportCount: number;
  createdAt: string;
  updatedAt: string;
  admin?: Pick<User, "id" | "name">;
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

export type OrderStatus = "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";

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
  shippingCost?: number;
  shippingMethodId?: string | null;
  paymentMethod: "COD";
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  createdAt: string;
  items?: OrderItem[];
  user?: Pick<User, "id" | "name" | "email" | "role" | "createdAt">;
};

export type ShippingType = "STANDARD" | "EXPRESS" | "FREE";
export type ShippingScope = "COUNTRY" | "STATE" | "CITY";
export type ShippingConditionType = "NONE" | "MIN_ORDER_VALUE" | "WEIGHT_RANGE" | "DIMENSION_RANGE";

export type ShippingZone = {
  id: string;
  scope: ShippingScope;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ShippingMethod = {
  id: string;
  type: ShippingType;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ShippingRule = {
  id: string;
  zoneId: string;
  methodId: string;
  baseCost: number;
  priority: number;
  isActive: boolean;
  conditionType: ShippingConditionType;
  conditionConfig?: { minOrderValue?: number } | null;
  createdAt: string;
  updatedAt: string;
  zone?: ShippingZone;
  method?: ShippingMethod;
};

export type CartItem = {
  id: string;
  cartId: string;
  productId: string;
  variantId: string;
  quantity: number;
  priceSnapshot: number; // cents
  createdAt: string;
  updatedAt: string;
  product: Pick<Product, "id" | "name" | "imageUrl">;
  variant: ProductVariant;
};

export type Cart = {
  id: string;
  userId?: string | null;
  sessionId?: string | null;
  appliedCouponId?: string | null;
  createdAt: string;
  updatedAt: string;
  items: CartItem[];
};


