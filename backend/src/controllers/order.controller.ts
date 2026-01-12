import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as orderService from "../services/order.service.js";
import { ApiError } from "../utils/ApiError.js";

export const place = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new ApiError(401, "UNAUTHORIZED", "Missing authentication");

  const { customerName, customerPhone, shippingAddress, items } = req.body as {
    customerName: string;
    customerPhone: string;
    shippingAddress: string;
    items: { productId: string; variantId: string; quantity: number }[];
  };

  const order = await orderService.placeOrder(req.user.sub, { customerName, customerPhone, shippingAddress, items });
  res.status(201).json({ order });
});

export const listAll = asyncHandler(async (_req: Request, res: Response) => {
  const orders = await orderService.listAllOrders();
  res.json({ orders });
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { status } = req.body as { status: "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" };
  const order = await orderService.updateOrderStatus(id, status);
  res.json({ order });
});


