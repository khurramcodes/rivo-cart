import ImageKit from "imagekit";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
function mustGetEnv(name) {
    const val = process.env[name];
    if (!val)
        throw new ApiError(500, "CONFIG_ERROR", `Missing env var: ${name}`);
    return val;
}
function imageKit() {
    return new ImageKit({
        publicKey: mustGetEnv("IMAGEKIT_PUBLIC_KEY"),
        privateKey: mustGetEnv("IMAGEKIT_PRIVATE_KEY"),
        urlEndpoint: mustGetEnv("IMAGEKIT_URL_ENDPOINT"),
    });
}
export const authParams = asyncHandler(async (_req, res) => {
    const ik = imageKit();
    const params = ik.getAuthenticationParameters();
    res.json(params);
});
