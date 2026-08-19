import { v2 as cloudinary } from 'cloudinary'

let configured = false;

// Configures Cloudinary on first use only, so unrelated pages/bundles never trigger it.
export const getCloudinary = () => {
    if (!configured) {
        cloudinary.config(process.env.CLOUDINARY_URL || "");
        configured = true;
    }
    return cloudinary;
}
