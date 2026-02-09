import { asyncHandler } from "../utils/asyncHandler.js";
import * as addressService from "../services/address.service.js";
export const list = asyncHandler(async (req, res) => {
    const userId = req.user?.sub;
    const addresses = await addressService.listAddresses(userId);
    res.json({ addresses });
});
export const create = asyncHandler(async (req, res) => {
    const userId = req.user?.sub;
    const address = await addressService.createAddress(userId, req.body);
    res.status(201).json({ address });
});
export const update = asyncHandler(async (req, res) => {
    const userId = req.user?.sub;
    const { id } = req.params;
    const address = await addressService.updateAddress(userId, id, req.body);
    res.json({ address });
});
export const remove = asyncHandler(async (req, res) => {
    const userId = req.user?.sub;
    const { id } = req.params;
    await addressService.deleteAddress(userId, id);
    res.status(204).send();
});
export const setDefault = asyncHandler(async (req, res) => {
    const userId = req.user?.sub;
    const { id } = req.params;
    const address = await addressService.setDefaultAddress(userId, id);
    res.json({ address });
});
