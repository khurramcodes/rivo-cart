import { prisma } from "../prisma/client.js";
import { ApiError } from "../utils/ApiError.js";
import { generateCategorySlug } from "../utils/slug.js";
export async function listCategories() {
    return prisma.category.findMany({ orderBy: { name: "asc" } });
}
export async function createCategory(input) {
    const name = input.name.trim();
    const slug = await generateCategorySlug(name);
    try {
        return await prisma.category.create({
            data: {
                name,
                slug,
                description: input.description?.trim() || null,
                parentId: input.parentId ?? null,
            },
        });
    }
    catch {
        throw new ApiError(409, "CATEGORY_EXISTS", "Category name already exists");
    }
}
export async function updateCategory(id, input) {
    const data = {};
    if (input.name !== undefined)
        data.name = input.name.trim();
    if (input.description !== undefined)
        data.description = input.description.trim() || null;
    if (input.parentId !== undefined)
        data.parentId = input.parentId;
    try {
        return await prisma.category.update({ where: { id }, data });
    }
    catch {
        throw new ApiError(404, "CATEGORY_NOT_FOUND", "Category not found");
    }
}
export async function deleteCategory(id) {
    try {
        await prisma.category.delete({ where: { id } });
    }
    catch {
        throw new ApiError(404, "CATEGORY_NOT_FOUND", "Category not found");
    }
}
