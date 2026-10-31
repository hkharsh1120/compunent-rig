const Category = require('../models/Category');
const ApiError = require('../utils/ApiError');
const slugify = require('../utils/slugify');

const getCategories = async (admin = false) => {
    const filter = admin ? {} : { isActive: true };

    return Category.find(filter).sort({ sortOrder: 1, name: 1 });
};

const createCategory = async (data) => {
    const slug = slugify(data.name);

    if (!slug) {
        throw new ApiError(400, 'Invalid category name');
    }

    return Category.create({
        ...data,
        slug,
    });
};

const updateCategory = async (id, data) => {
    const category = await Category.findById(id);

    if (!category) {
        throw new ApiError(404, 'Category not found');
    }

    if (data.name) {
        category.name = data.name;
        category.slug = slugify(data.name);
    }

    if (data.description !== undefined) {
        category.description = data.description;
    }

    if (data.sortOrder !== undefined) {
        category.sortOrder = data.sortOrder;
    }

    await category.save();
    return category;
};

const deactivateCategory = async (id) => {
    const category = await Category.findById(id);

    if (!category) {
        throw new ApiError(404, 'Category not found');
    }

    category.isActive = false;
    await category.save();

    return category;
};

module.exports = {
    getCategories,
    createCategory,
    updateCategory,
    deactivateCategory,
};