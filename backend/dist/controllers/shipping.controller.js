import { asyncHandler } from "../utils/asyncHandler.js";
import * as shippingService from "../services/shipping.service.js";
import { ApiError } from "../utils/ApiError.js";
export const quote = asyncHandler(async (req, res) => {
    if (!req.user)
        throw new ApiError(401, "UNAUTHORIZED", "Missing authentication");
    const { addressId } = req.body;
    const result = await shippingService.quoteShippingForUser({
        userId: req.user.sub,
        addressId,
    });
    res.json(result);
});
