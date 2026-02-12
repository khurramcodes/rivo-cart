import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Prisma, type ShippingType } from "@prisma/client";
import { prisma } from "../prisma/client.js";
import { ApiError } from "../utils/ApiError.js";

function normalizeZoneInput(input: {
  scope: "COUNTRY" | "STATE" | "CITY";
  country?: string | null;
  state?: string | null;
  city?: string | null;
  isActive?: boolean;
}) {
  const country = input.country?.trim() || null;
  const state = input.state?.trim() || null;
  const city = input.city?.trim() || null;

  if (input.scope === "COUNTRY") {
    if (!country) throw new ApiError(400, "INVALID_ZONE", "Country is required for country scope");
    return { scope: input.scope, country, state: null, city: null, isActive: input.isActive ?? true };
  }
  if (input.scope === "STATE") {
    if (!country || !state) throw new ApiError(400, "INVALID_ZONE", "Country and state are required for state scope");
    return { scope: input.scope, country, state, city: null, isActive: input.isActive ?? true };
  }
  if (input.scope === "CITY") {
    if (!country || !state || !city) {
      throw new ApiError(400, "INVALID_ZONE", "Country, state, and city are required for city scope");
    }
    return { scope: input.scope, country, state, city, isActive: input.isActive ?? true };
  }
  throw new ApiError(400, "INVALID_ZONE", "Unsupported zone scope");
}

export const listZones = asyncHandler(async (_req: Request, res: Response) => {
  const zones = await prisma.shippingZone.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json({ zones });
});

export const createZone = asyncHandler(async (req: Request, res: Response) => {
  const data = normalizeZoneInput(req.body);
  console.log(data);
  const zone = await prisma.shippingZone.create({ data });
  res.status(201).json({ zone });
});

export const updateZone = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const existing = await prisma.shippingZone.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "ZONE_NOT_FOUND", "Shipping zone not found");

  const merged = {
    scope: (req.body.scope ?? existing.scope) as "COUNTRY" | "STATE" | "CITY",
    country: req.body.country ?? existing.country,
    state: req.body.state ?? existing.state,
    city: req.body.city ?? existing.city,
    isActive: req.body.isActive ?? existing.isActive,
  };
  const data = normalizeZoneInput(merged);
  const zone = await prisma.shippingZone.update({ where: { id }, data });
  res.json({ zone });
});

export const removeZone = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  await prisma.shippingZone.delete({ where: { id } });
  res.status(204).send();
});

export const listMethods = asyncHandler(async (_req: Request, res: Response) => {
  const methods = await prisma.shippingMethod.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json({ methods });
});

export const createMethod = asyncHandler(async (req: Request, res: Response) => {
  const { type, name, description, isActive } = req.body as {
    type: ShippingType;
    name: string;
    description?: string | null;
    isActive?: boolean;
  };
  const method = await prisma.shippingMethod.create({
    data: {
      type,
      name: name.trim(),
      description: description?.trim() || null,
      isActive: isActive ?? true,
    },
  });
  res.status(201).json({ method });
});

export const updateMethod = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { type, name, description, isActive } = req.body as {
    type?: ShippingType;
    name?: string;
    description?: string | null;
    isActive?: boolean;
  };
  const method = await prisma.shippingMethod.update({
    where: { id },
    data: {
      type,
      name: name?.trim(),
      description: description?.trim() || description,
      isActive,
    },
  });
  res.json({ method });
});

export const removeMethod = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  await prisma.shippingMethod.delete({ where: { id } });
  res.status(204).send();
});

export const listRules = asyncHandler(async (_req: Request, res: Response) => {
  const rules = await prisma.shippingRule.findMany({
    include: { zone: true, method: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ rules });
});

export const createRule = asyncHandler(async (req: Request, res: Response) => {
  const { zoneId, methodId, baseCost, priority, isActive, conditionType, minOrderValue } = req.body as {
    zoneId: string;
    methodId: string;
    baseCost: number;
    priority?: number;
    isActive?: boolean;
    conditionType?: "NONE" | "MIN_ORDER_VALUE" | "WEIGHT_RANGE" | "DIMENSION_RANGE";
    minOrderValue?: number;
  };

  const finalConditionType = conditionType ?? "NONE";
  const conditionConfig =
    finalConditionType === "MIN_ORDER_VALUE"
      ? { minOrderValue: Number(minOrderValue ?? 0) }
      : Prisma.JsonNull;

  const rule = await prisma.shippingRule.create({
    data: {
      zoneId,
      methodId,
      baseCost,
      priority: priority ?? 0,
      isActive: isActive ?? true,
      conditionType: finalConditionType,
      conditionConfig,
    },
    include: { zone: true, method: true },
  });
  res.status(201).json({ rule });
});

export const updateRule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { zoneId, methodId, baseCost, priority, isActive, conditionType, minOrderValue } = req.body as {
    zoneId?: string;
    methodId?: string;
    baseCost?: number;
    priority?: number;
    isActive?: boolean;
    conditionType?: "NONE" | "MIN_ORDER_VALUE" | "WEIGHT_RANGE" | "DIMENSION_RANGE";
    minOrderValue?: number;
  };

  const data: Record<string, any> = {
    zoneId,
    methodId,
    baseCost,
    priority,
    isActive,
  };

  if (conditionType) {
    data.conditionType = conditionType;
    data.conditionConfig =
      conditionType === "MIN_ORDER_VALUE"
        ? { minOrderValue: Number(minOrderValue ?? 0) }
        : Prisma.JsonNull;
  }

  const rule = await prisma.shippingRule.update({
    where: { id },
    data,
    include: { zone: true, method: true },
  });
  res.json({ rule });
});

export const removeRule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  await prisma.shippingRule.delete({ where: { id } });
  res.status(204).send();
});
