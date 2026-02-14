import { asyncHandler } from "../utils/asyncHandler.js";
import * as categoryService from "../services/category.service.js";
export const list = asyncHandler(async (_req, res) => {
    const categories = await categoryService.listCategories();
    res.json({ categories });
});
export const get = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const category = await categoryService.getCategoryBySlug(slug);
    res.json({ category });
});
export const create = asyncHandler(async (req, res) => {
    const { name, description, parentId } = req.body;
    const category = await categoryService.createCategory({ name, description, parentId });
    res.status(201).json({ category });
});
export const update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, parentId } = req.body;
    const category = await categoryService.updateCategory(id, { name, description, parentId });
    res.json({ category });
});
export const remove = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await categoryService.deleteCategory(id);
    res.status(204).send();
});
