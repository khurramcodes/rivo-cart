import { prisma } from "../prisma/client.js";
import { ApiError } from "../utils/ApiError.js";

type AddressInput = {
  fullName?: string;
  phone?: string;
  country?: string;
  state?: string;
  city?: string;
  streetAddress?: string;
  postalCode?: string | null;
  isDefault?: boolean;
};

type CreateAddressInput = {
  fullName: string;
  phone: string;
  country: string;
  state: string;
  city: string;
  streetAddress: string;
  postalCode?: string | null;
  isDefault?: boolean;
};

function normalizeInput(input: AddressInput) {
  const data: AddressInput = {};
  if (input.fullName !== undefined) data.fullName = input.fullName.trim();
  if (input.phone !== undefined) data.phone = input.phone.trim();
  if (input.country !== undefined) data.country = input.country.trim();
  if (input.state !== undefined) data.state = input.state.trim();
  if (input.city !== undefined) data.city = input.city.trim();
  if (input.streetAddress !== undefined) data.streetAddress = input.streetAddress.trim();
  if (input.postalCode !== undefined) {
    data.postalCode = input.postalCode?.trim() || null;
  }
  return data;
}

export async function listAddresses(userId: string) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}

export async function createAddress(userId: string, input: CreateAddressInput) {
  const data = {
    fullName: input.fullName.trim(),
    phone: input.phone.trim(),
    country: input.country.trim(),
    state: input.state.trim(),
    city: input.city.trim(),
    streetAddress: input.streetAddress.trim(),
    postalCode: input.postalCode?.trim() || null,
  };

  return prisma.$transaction(async (tx) => {
    const existingDefault = await tx.address.findFirst({
      where: { userId, isDefault: true },
      select: { id: true },
    });

    const shouldDefault = input.isDefault === true || !existingDefault;

    if (shouldDefault) {
      await tx.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return tx.address.create({
      data: {
        ...data,
        userId,
        isDefault: shouldDefault,
      },
    });
  });
}

export async function updateAddress(userId: string, id: string, input: AddressInput) {
  const data = normalizeInput(input);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.address.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new ApiError(404, "ADDRESS_NOT_FOUND", "Address not found");
    }

    if (input.isDefault === true) {
      await tx.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
      data.isDefault = true;
    }

    if (input.isDefault === false && existing.isDefault) {
      const replacement = await tx.address.findFirst({
        where: { userId, NOT: { id } },
        orderBy: { createdAt: "desc" },
      });
      if (replacement) {
        await tx.address.update({
          where: { id: replacement.id },
          data: { isDefault: true },
        });
        data.isDefault = false;
      } else {
        data.isDefault = true;
      }
    }

    return tx.address.update({
      where: { id },
      data,
    });
  });
}

export async function deleteAddress(userId: string, id: string) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.address.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new ApiError(404, "ADDRESS_NOT_FOUND", "Address not found");
    }

    await tx.address.delete({ where: { id } });

    if (existing.isDefault) {
      const replacement = await tx.address.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
      if (replacement) {
        await tx.address.update({
          where: { id: replacement.id },
          data: { isDefault: true },
        });
      }
    }
  });
}

export async function setDefaultAddress(userId: string, id: string) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.address.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new ApiError(404, "ADDRESS_NOT_FOUND", "Address not found");
    }

    await tx.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });

    return tx.address.update({
      where: { id },
      data: { isDefault: true },
    });
  });
}
