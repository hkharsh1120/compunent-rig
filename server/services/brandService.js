const Brand = require('../models/Brand');
const ApiError = require('../utils/ApiError');
const slugify = require('../utils/slugify');

const getBrands = async (admin = false) => {
    const filter = admin ? {} : { isActive: true };

    return Brand.find(filter).sort({ name: 1 });
};

const createBrand = async (data) => {
    const slug = slugify(data.name);

    if (!slug) {
        throw new ApiError(400, 'Invalid brand name');
    }

    return Brand.create({
        ...data,
        slug,
    });
};

const updateBrand = async (id, data) => {
    const brand = await Brand.findById(id);

    if (!brand) {
        throw new ApiError(404, 'Brand not found');
    }

    if (data.name) {
        brand.name = data.name;
        brand.slug = slugify(data.name);
    }

    if (data.description !== undefined) {
        brand.description = data.description;
    }

    await brand.save();
    return brand;
};

const deactivateBrand = async (id) => {
    const brand = await Brand.findById(id);

    if (!brand) {
        throw new ApiError(404, 'Brand not found');
    }

    brand.isActive = false;
    await brand.save();

    return brand;
};

module.exports = {
    getBrands,
    createBrand,
    updateBrand,
    deactivateBrand,
};