const cloudinary = require('../config/cloudinary');
const ApiError = require('../utils/ApiError');

const uploadImage = (buffer, folder = 'compunent-rig/products') => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: 'image',
                allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
            },
            (error, result) => {
                if (error) {
                    return reject(
                        new ApiError(502, 'Image upload failed')
                    );
                }

                resolve({
                    url: result.secure_url,
                    publicId: result.public_id,
                });
            }
        );

        stream.end(buffer);
    });
};

const deleteImage = async (publicId) => {
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== 'ok' && result.result !== 'not found') {
        throw new ApiError(502, 'Image deletion failed');
    }

    return result;
};

module.exports = {
    uploadImage,
    deleteImage,
};