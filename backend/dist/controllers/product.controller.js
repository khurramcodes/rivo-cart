import { asyncHandler } from "../utils/asyncHandler.js";
import * as productService from "../services/product.service.js";
export const list = asyncHandler(async (req, res) => {
    const { q, categoryId, page, limit, sortBy, sortDir, minPrice, maxPrice } = req.query;
    const result = await productService.listProducts({
        q,
        categoryId,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        sortBy: sortBy,
        sortDir: sortDir,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
    });
    res.json(result);
});
export const get = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const product = await productService.getProduct(id);
    res.json({ product });
});
export const create = asyncHandler(async (req, res) => {
    const { id, name, description, type, imageUrl, imageFileId, imageFilePath, imageFolderPath, thumbUrl, thumbFileId, thumbFilePath, gallery, categoryId, variants, } = req.body;
    const product = await productService.createProduct({
        id,
        name,
        description,
        type,
        imageUrl,
        imageFileId,
        imageFilePath,
        imageFolderPath,
        thumbUrl,
        thumbFileId,
        thumbFilePath,
        gallery,
        categoryId,
        variants,
    });
    res.status(201).json({ product });
});
export const update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, type, imageUrl, imageFileId, imageFilePath, thumbUrl, thumbFileId, thumbFilePath, gallery, deleteGalleryIndexes, categoryId, variants, deleteVariantIds, } = req.body;
    const product = await productService.updateProduct(id, {
        name,
        description,
        type,
        imageUrl,
        imageFileId,
        imageFilePath,
        thumbUrl,
        thumbFileId,
        thumbFilePath,
        gallery,
        deleteGalleryIndexes,
        categoryId,
        variants,
        deleteVariantIds,
    });
    res.json({ product });
});
export const remove = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await productService.deleteProduct(id);
    res.status(204).send();
});
