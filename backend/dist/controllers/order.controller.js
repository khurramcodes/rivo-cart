import { asyncHandler } from "../utils/asyncHandler.js";
import * as orderService from "../services/order.service.js";
import { ApiError } from "../utils/ApiError.js";
export const place = asyncHandler(async (req, res) => {
    if (!req.user)
        throw new ApiError(401, "UNAUTHORIZED", "Missing authentication");
    const { customerName, customerPhone, shippingAddress, items } = req.body;
    const order = await orderService.placeOrder(req.user.sub, { customerName, customerPhone, shippingAddress, items });
    res.status(201).json({ order });
});
export const listAll = asyncHandler(async (_req, res) => {
    const orders = await orderService.listAllOrders();
    res.json({ orders });
});
export const updateStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const order = await orderService.updateOrderStatus(id, status);
    res.json({ order });
});
