import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as addressService from "../services/address.service.js";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.sub as string;
  const addresses = await addressService.listAddresses(userId);
  res.json({ addresses });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.sub as string;
  const address = await addressService.createAddress(userId, req.body);
  res.status(201).json({ address });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.sub as string;
  const { id } = req.params as { id: string };
  const address = await addressService.updateAddress(userId, id, req.body);
  res.json({ address });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.sub as string;
  const { id } = req.params as { id: string };
  await addressService.deleteAddress(userId, id);
  res.status(204).send();
});

export const setDefault = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.sub as string;
  const { id } = req.params as { id: string };
  const address = await addressService.setDefaultAddress(userId, id);
  res.json({ address });
});
