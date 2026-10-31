const Product = require('../models/Product');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const ApiError = require('../utils/ApiError');
const slugify = require('../utils/slugify');

const checkCategoryAndBrand = async (categoryId, brandId) => {
    const [category, brand] = await Promise.all([
        Category.findOne({ _id: categoryId, isActive: true }),
        Brand.findOne({ _id: brandId, isActive: true }),
    ]);

    if (!category) {
        throw new ApiError(400, 'Invalid or inactive category');
    }

    if (!brand) {
        throw new ApiError(400, 'Invalid or inactive brand');
    }
};

const createProduct = async (data) => {
    await checkCategoryAndBrand(data.category, data.brand);

    const existingSKU = await Product.findOne({
        sku: data.sku.toUpperCase(),
    });

    if (existingSKU) {
        throw new ApiError(409, 'Product SKU already exists');
    }

    return Product.create({
        ...data,
        slug: slugify(data.name),
        sku: data.sku.toUpperCase(),
    });
};

const getProducts = async (filters = {}, admin = false) => {
    const {
        search,
        category,
        brand,
        minPrice,
        maxPrice,
        sort = 'newest',
        page = 1,
        limit = 12,
    } = filters;

    const query = admin ? {} : { isActive: true };

    if (category) query.category = category;
    if (brand) query.brand = brand;

    if (search) {
        query.$text = { $search: search };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
        query.price = {};

        if (minPrice !== undefined) query.price.$gte = minPrice;
        if (maxPrice !== undefined) query.price.$lte = maxPrice;
    }

    const sortOptions = {
        newest: { createdAt: -1 },
        oldest: { createdAt: 1 },
        'price-low': { price: 1 },
        'price-high': { price: -1 },
        name: { name: 1 },
    };

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
        Product.find(query)
            .populate('category', 'name slug')
            .populate('brand', 'name slug')
            .sort(sortOptions[sort])
            .skip(skip)
            .limit(limit),

        Product.countDocuments(query),
    ]);

    return {
        products,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page * limit < total,
            hasPreviousPage: page > 1,
        },
    };
};

const getProductBySlug = async (slug, admin = false) => {
    const query = { slug };

    if (!admin) query.isActive = true;

    const product = await Product.findOne(query)
        .populate('category', 'name slug')
        .populate('brand', 'name slug');

    if (!product) {
        throw new ApiError(404, 'Product not found');
    }

    return product;
};

const updateProduct = async (id, data) => {
    const product = await Product.findById(id);

    if (!product) {
        throw new ApiError(404, 'Product not found');
    }

    const nextCategory = data.category || product.category;
    const nextBrand = data.brand || product.brand;

    if (data.category || data.brand) {
        await checkCategoryAndBrand(nextCategory, nextBrand);
    }

    if (data.sku) {
        const existingSKU = await Product.findOne({
            sku: data.sku.toUpperCase(),
            _id: { $ne: id },
        });

        if (existingSKU) {
            throw new ApiError(409, 'Product SKU already exists');
        }

        data.sku = data.sku.toUpperCase();
    }

    if (data.name) {
        data.slug = slugify(data.name);
    }

    Object.assign(product, data);

    await product.save();

    return product;
};

const deactivateProduct = async (id) => {
    const product = await Product.findById(id);

    if (!product) {
        throw new ApiError(404, 'Product not found');
    }

    product.isActive = false;

    await product.save();

    return product;
};

module.exports = {
    createProduct,
    getProducts,
    getProductBySlug,
    updateProduct,
    deactivateProduct,
};