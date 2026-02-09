import { asyncHandler } from "../utils/asyncHandler.js";
import * as discountService from "../services/discount.service.js";
export const list = asyncHandler(async (_req, res) => {
    const discounts = await discountService.listDiscounts();
    res.json({ discounts });
});
export const get = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const discount = await discountService.getDiscount(id);
    res.json({ discount });
});
export const create = asyncHandler(async (req, res) => {
    const discount = await discountService.createDiscount(req.body);
    res.status(201).json({ discount });
});
export const update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const discount = await discountService.updateDiscount(id, req.body);
    res.json({ discount });
});
export const remove = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await discountService.deleteDiscount(id);
    res.status(204).send();
});
