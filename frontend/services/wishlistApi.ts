import { apiClient } from "./apiClient";
import type { WishlistItem } from "@/types";

type ToggleResponse = { added: boolean };
type ListResponse = { items: WishlistItem[] };
type IdsResponse = { productIds: string[] };

export const wishlistApi = {
  async toggle(productId: string) {
    const { data } = await apiClient.post<ToggleResponse>("/wishlist/toggle", {
      productId,
    });
    return data;
  },

  async list() {
    const { data } = await apiClient.get<ListResponse>("/wishlist");
    return data;
  },

  async getIds() {
    const { data } = await apiClient.get<IdsResponse>("/wishlist/ids", {
      skipLoading: true,
    });
    return data;
  },
};
