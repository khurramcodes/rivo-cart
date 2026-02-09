import { z } from "zod";
const allowedCountries = ["United States", "Pakistan"];
const addressBodySchema = z.object({
    fullName: z.string().min(2).max(120),
    phone: z.string().min(6).max(30),
    country: z.enum(allowedCountries),
    state: z.string().min(2).max(120),
    city: z.string().min(2).max(120),
    streetAddress: z.string().min(3).max(200),
    postalCode: z.string().min(2).max(20).optional(),
    isDefault: z.boolean().optional(),
});
export const listAddressesSchema = z.object({
    query: z.object({}),
});
export const createAddressSchema = z.object({
    body: addressBodySchema,
});
export const updateAddressSchema = z.object({
    params: z.object({
        id: z.string().min(1),
    }),
    body: addressBodySchema.partial(),
});
export const deleteAddressSchema = z.object({
    params: z.object({
        id: z.string().min(1),
    }),
});
export const setDefaultAddressSchema = z.object({
    params: z.object({
        id: z.string().min(1),
    }),
});
