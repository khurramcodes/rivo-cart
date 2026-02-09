import { prisma } from "../prisma/client.js";
import { ApiError } from "./ApiError.js";
export function slugify(input) {
    return input
        .trim()
        .toLowerCase()
        .replace(/['"]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}
function getNextSlug(base, existing) {
    if (!existing.includes(base))
        return base;
    let max = 1;
    const prefix = `${base}-`;
    for (const slug of existing) {
        if (slug === base)
            continue;
        if (!slug.startsWith(prefix))
            continue;
        const suffix = Number(slug.slice(prefix.length));
        if (Number.isInteger(suffix) && suffix > max)
            max = suffix;
    }
    return `${base}-${max + 1}`;
}
export async function generateCategorySlug(name) {
    const base = slugify(name);
    if (!base)
        throw new ApiError(400, "INVALID_SLUG", "Category name must include letters or numbers");
    const existing = await prisma.category.findMany({
        where: { slug: { startsWith: base } },
        select: { slug: true },
    });
    return getNextSlug(base, existing.map((item) => item.slug));
}
export async function generateProductSlug(name) {
    const base = slugify(name);
    if (!base)
        throw new ApiError(400, "INVALID_SLUG", "Product name must include letters or numbers");
    const existing = await prisma.product.findMany({
        where: { slug: { startsWith: base } },
        select: { slug: true },
    });
    return getNextSlug(base, existing.map((item) => item.slug));
}
