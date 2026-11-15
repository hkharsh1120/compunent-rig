
import { useEffect, useState } from 'react';
import {
    getAdminProducts,
    createProduct,
    updateProduct,
    deactivateProduct,
    uploadProductImages,
    deleteProductImage,
} from '../../services/adminProductService';
import { getCategories, getBrands } from '../../services/productService';

const initialForm = {
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    stock: '',
    sku: '',
    category: '',
    brand: '',
    specifications: '',
    compatibilityComponentType: '',
    compatibilitySocket: '',
    compatibilityRamType: '',
    compatibilityWattage: '',
    compatibilityRecommendedPsuWattage: '',
    compatibilityInterface: '',
    supportedStorageInterfaces: [],
    maxRamCapacity: '',
    compatibilityCapacity: '',
    isFeatured: false,
    isActive: true,
};

const extractList = (result, key) => {
    if (Array.isArray(result)) return result;
    return result?.[key] || result?.data?.[key] || [];
};

const AdminProducts = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);

    const [form, setForm] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);
    const [selectedImages, setSelectedImages] = useState([]);

    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const loadData = async () => {
        setLoading(true);
        setError('');

        try {
            const [productResult, categoryResult, brandResult] =
                await Promise.all([
                    getAdminProducts({ limit: 100 }),
                    getCategories(),
                    getBrands(),
                ]);

            const productList = extractList(productResult, 'products');

            setProducts(productList);
            setCategories(Array.isArray(categoryResult) ? categoryResult : extractList(categoryResult, 'categories') || []);
            setBrands(Array.isArray(brandResult) ? brandResult : extractList(brandResult, 'brands') || []);
        } catch (err) {
            const errors = err.response?.data?.errors || [];
            const errorMessages = errors.length > 0
                ? errors.map(e => `${e.field}: ${e.message}`).join('\n')
                : err.response?.data?.message ||
                'Unable to load product management data.';
            setError(errorMessages);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const resetForm = () => {
        setForm(initialForm);
        setEditingId(null);
        setSelectedImages([]);
    };

    const handleEdit = (product) => {
        const specifications = product.specifications instanceof Map
            ? Object.fromEntries(product.specifications)
            : product.specifications || {};

        setForm({
            name: product.name || '',
            description: product.description || '',
            price: product.price ?? '',
            originalPrice: product.originalPrice ?? '',
            stock: product.stock ?? '',
            sku: product.sku || '',
            category: product.category?._id || product.category || '',
            brand: product.brand?._id || product.brand || '',
            specifications: Object.entries(specifications)
                .map(([key, value]) => `${key}: ${value}`)
                .join('\n'),
                compatibilityComponentType:
                product.compatibility?.componentType || '',
            
            compatibilitySocket:
                product.compatibility?.socket || '',
            
            compatibilityRamType:
                product.compatibility?.ramType || '',
            
            compatibilityWattage:
                product.compatibility?.wattage ?? '',
            
            compatibilityRecommendedPsuWattage:
                product.compatibility?.recommendedPsuWattage ?? '',
            
            compatibilityInterface:
                product.compatibility?.interface || '',
            supportedStorageInterfaces:
                product.compatibility?.supportedStorageInterfaces || [],

            maxRamCapacity:
                product.compatibility?.maxRamCapacity ?? '',
            compatibilityCapacity:
                product.compatibility?.capacity ?? '',
            isFeatured: Boolean(product.isFeatured),
            isActive: Boolean(product.isActive),
        });

        setEditingId(product._id);
        setSelectedImages([]);

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const fieldLabels = {
        category: 'Category',
        brand: 'Brand',
        name: 'Product Name',
        description: 'Description',
        price: 'Price',
        stock: 'Stock',
        sku: 'SKU',
        'compatibility.componentType': 'Component Type',
        'compatibility.capacity': 'RAM Capacity',
        'compatibility.socket': 'Socket',
        'compatibility.ramType': 'RAM Type',
        'compatibility.wattage': 'Wattage',
        'compatibility.recommendedPsuWattage': 'Recommended PSU Wattage',
        'compatibility.interface': 'Interface',
        'compatibility.maxRamCapacity': 'Max RAM Capacity',
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        // Validate required selections
        if (!form.category) {
            setError('Please select a category.');
            return;
        }
        if (!form.brand) {
            setError('Please select a brand.');
            return;
        }

        setSaving(true);
        setError('');
        setMessage('');

        try {
            const specifications = {};

            form.specifications
                .split('\n')
                .filter((line) => line.trim())
                .forEach((line) => {
                    const separator = line.indexOf(':');

                    if (separator > 0) {
                        const key = line.slice(0, separator).trim();
                        const value = line.slice(separator + 1).trim();

                        if (key && value) {
                            specifications[key] = value;
                        }
                    }
                });

            const productData = {
                name: form.name.trim(),
                description: form.description.trim(),
                price: Number(form.price),
                originalPrice: form.originalPrice
                    ? Number(form.originalPrice)
                    : undefined,
                stock: Number(form.stock),
                sku: form.sku.trim(),
                category: form.category,
                brand: form.brand,
                specifications,
                compatibility: {
                    componentType: form.compatibilityComponentType || undefined,
                    socket: form.compatibilitySocket.trim() || undefined,
                    ramType: form.compatibilityRamType.trim() || undefined,
                    wattage: form.compatibilityWattage
                        ? Number(form.compatibilityWattage)
                        : undefined,
                    recommendedPsuWattage: form.compatibilityRecommendedPsuWattage
                        ? Number(form.compatibilityRecommendedPsuWattage)
                        : undefined,
                    interface: form.compatibilityInterface.trim() || undefined,
                    supportedStorageInterfaces: form.supportedStorageInterfaces || [],
                    maxRamCapacity: form.maxRamCapacity
                        ? Number(form.maxRamCapacity)
                        : undefined,
                    capacity: form.compatibilityCapacity
                        ? Number(form.compatibilityCapacity)
                        : undefined,
                },
                isFeatured: form.isFeatured,
                isActive: form.isActive,
            };

            let savedProduct;

            if (editingId) {
                savedProduct = await updateProduct(editingId, productData);
            } else {
                savedProduct = await createProduct(productData);
            }

            const productId = savedProduct?._id || editingId;

            if (!productId) {
                setError('Failed to get product ID for image upload.');
                return;
            }

            // Only attempt image upload if images were selected
            // Use a check that verifies we have actual File objects
            if (selectedImages.length > 0) {
                await uploadProductImages(productId, selectedImages);
            }

            setMessage(
                editingId
                    ? 'Product updated successfully.'
                    : 'Product created successfully.'
            );

            resetForm();
            await loadData();
        } catch (err) {
            const errors = err.response?.data?.errors || [];
            let errorMessage = err.response?.data?.message || 'Unable to save product.';

            if (errors.length > 0) {
                // Format field-specific errors
                const fieldErrors = errors.map(e => {
                    // Handle nested compatibility fields
                    let fieldLabel = fieldLabels[e.field] || e.field;
                    if (e.field.startsWith('compatibility.')) {
                        const compatField = e.field.replace('compatibility.', '');
                        fieldLabel = `Compatibility: ${fieldLabels[compatField] || compatField}`;
                    }
                    return `${fieldLabel}: ${e.message}`;
                }).join('\n');
                errorMessage = fieldErrors;
            }

            setError(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    const handleDeactivate = async (id) => {
        if (!window.confirm('Are you sure you want to deactivate this product?')) {
            return;
        }

        setError('');
        setMessage('');

        try {
            await deactivateProduct(id);
            setMessage('Product deactivated successfully.');
            await loadData();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to deactivate product.'
            );
        }
    };

    const handleDeleteImage = async (productId, imageId) => {
        setError('');

        try {
            await deleteProductImage(productId, imageId);
            setMessage('Product image deleted successfully.');
            await loadData();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to delete product image.'
            );
        }
    };

    const filteredProducts = products.filter((product) =>
        `${product.name} ${product.sku}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    if (loading) {
        return <p className="text-gray-600">Loading products...</p>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">
                    Product Management
                </h1>
                <p className="mt-2 text-gray-600">
                    Add, edit and manage your computer products.
                </p>
            </div>

            {error && (
                <div className="rounded-lg bg-red-100 p-4 text-red-700">
                    {error}
                </div>
            )}

            {message && (
                <div className="rounded-lg bg-green-100 p-4 text-green-700">
                    {message}
                </div>
            )}

            {/* Product Form */}
            <section className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="mb-6 text-xl font-bold">
                    {editingId ? 'Edit Product' : 'Add New Product'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid gap-5 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Product Name
                            </label>
                            <input
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                required
                                className="w-full rounded-lg border p-3"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                SKU
                            </label>
                            <input
                                name="sku"
                                value={form.sku}
                                onChange={handleChange}
                                required
                                className="w-full rounded-lg border p-3"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Price (₹)
                            </label>
                            <input
                                type="number"
                                name="price"
                                min="0"
                                step="0.01"
                                value={form.price}
                                onChange={handleChange}
                                required
                                className="w-full rounded-lg border p-3"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Original Price (₹)
                            </label>
                            <input
                                type="number"
                                name="originalPrice"
                                min="0"
                                step="0.01"
                                value={form.originalPrice}
                                onChange={handleChange}
                                className="w-full rounded-lg border p-3"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Stock Quantity
                            </label>
                            <input
                                type="number"
                                name="stock"
                                min="0"
                                value={form.stock}
                                onChange={handleChange}
                                required
                                className="w-full rounded-lg border p-3"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Category
                            </label>
                            <select
                                name="category"
                                value={form.category}
                                onChange={handleChange}
                                required
                                className="w-full rounded-lg border p-3"
                            >
                                <option value="">Select category</option>
                                {categories.map((category) => (
                                    <option key={category._id} value={category._id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Brand
                            </label>
                            <select
                                name="brand"
                                value={form.brand}
                                onChange={handleChange}
                                required
                                className="w-full rounded-lg border p-3"
                            >
                                <option value="">Select brand</option>
                                {brands.map((brand) => (
                                    <option key={brand._id} value={brand._id}>
                                        {brand.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            required
                            rows="4"
                            className="w-full rounded-lg border p-3"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Specifications
                        </label>
                        <textarea
                            name="specifications"
                            value={form.specifications}
                            onChange={handleChange}
                            rows="5"
                            placeholder={'Processor: Intel Core i5\nRAM: 16GB\nStorage: 512GB SSD'}
                            className="w-full rounded-lg border p-3"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Enter one specification per line in Key: Value format.
                        </p>
                    </div>
                    {/* Compatibility */}
                    <div className="rounded-lg border border-gray-200 p-4">
                        <h3 className="mb-4 font-semibold">Compatibility</h3>

                        <div className="grid gap-5 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Component Type
                                </label>
                                <select
                                    name="compatibilityComponentType"
                                    value={form.compatibilityComponentType}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border p-3"
                                >
                                    <option value="">Not set</option>
                                    {['cpu', 'motherboard', 'ram', 'gpu', 'storage', 'psu', 'case', 'cooler'].map((type) => (
                                        <option key={type} value={type}>
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Socket
                                </label>
                                <input
                                    name="compatibilitySocket"
                                    value={form.compatibilitySocket}
                                    onChange={handleChange}
                                    placeholder="Example: AM5"
                                    className="w-full rounded-lg border p-3"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    RAM Type
                                </label>
                                <input
                                    name="compatibilityRamType"
                                    value={form.compatibilityRamType}
                                    onChange={handleChange}
                                    placeholder="Example: DDR5"
                                    className="w-full rounded-lg border p-3"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Interface
                                </label>
                                <input
                                    name="compatibilityInterface"
                                    value={form.compatibilityInterface}
                                    onChange={handleChange}
                                    placeholder="Example: PCIe 4.0"
                                    className="w-full rounded-lg border p-3"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Wattage (W)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    name="compatibilityWattage"
                                    value={form.compatibilityWattage}
                                    onChange={handleChange}
                                    placeholder="Example: 650"
                                    className="w-full rounded-lg border p-3"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Recommended PSU Wattage (W)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    name="compatibilityRecommendedPsuWattage"
                                    value={form.compatibilityRecommendedPsuWattage}
                                    onChange={handleChange}
                                    placeholder="Example: 750"
                                    className="w-full rounded-lg border p-3"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Maximum RAM Capacity (GB)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    name="maxRamCapacity"
                                    value={form.maxRamCapacity}
                                    onChange={handleChange}
                                    placeholder="Example: 128"
                                    className="w-full rounded-lg border p-3"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    RAM Capacity (GB)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    name="compatibilityCapacity"
                                    value={form.compatibilityCapacity}
                                    onChange={handleChange}
                                    placeholder="Example: 16"
                                    className="w-full rounded-lg border p-3"
                                />
                            </div>
                        </div>

                        <div className="mt-5">
                            <label className="mb-2 block text-sm font-medium">
                                Supported Storage Interfaces
                            </label>

                            <div className="flex flex-wrap gap-4">
                                {['SATA', 'NVMe', 'PCIe'].map((item) => (
                                    <label key={item} className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={form.supportedStorageInterfaces.includes(item)}
                                            onChange={(event) => {
                                                setForm((previous) => ({
                                                    ...previous,
                                                    supportedStorageInterfaces: event.target.checked
                                                        ? [...previous.supportedStorageInterfaces, item]
                                                        : previous.supportedStorageInterfaces.filter(
                                                            (value) => value !== item
                                                        ),
                                                }));
                                            }}
                                        />
                                        {item}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Product Images
                        </label>
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            onChange={(event) =>
                                setSelectedImages(Array.from(event.target.files || []))
                            }
                            className="w-full rounded-lg border p-3"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Maximum 5 images per upload, 5 MB each. JPEG, PNG and WebP.
                        </p>
                    </div>

                    {editingId && (
                        <div className="rounded-lg border p-4">
                            <h3 className="mb-3 font-semibold">Existing Images</h3>

                            <div className="flex flex-wrap gap-4">
                                {products
                                    .find((product) => product._id === editingId)
                                    ?.images?.map((image) => (
                                        <div key={image._id} className="w-28">
                                            <img
                                                src={image.url}
                                                alt="Product"
                                                className="h-24 w-28 rounded-lg object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleDeleteImage(editingId, image._id)
                                                }
                                                className="mt-2 text-xs text-red-600 hover:underline"
                                            >
                                                Delete image
                                            </button>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-6">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                name="isFeatured"
                                checked={form.isFeatured}
                                onChange={handleChange}
                            />
                            Featured Product
                        </label>

                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                name="isActive"
                                checked={form.isActive}
                                onChange={handleChange}
                            />
                            Active Product
                        </label>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {saving
                                ? 'Saving...'
                                : editingId
                                    ? 'Update Product'
                                    : 'Create Product'}
                        </button>

                        {editingId && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="rounded-lg border px-6 py-3"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </section>

            {/* Product List */}
            <section className="rounded-xl bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-xl font-bold">
                        All Products ({products.length})
                    </h2>

                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search name or SKU..."
                        className="w-full rounded-lg border p-3 sm:w-72"
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b bg-gray-50 text-gray-600">
                                <th className="p-3">Product</th>
                                <th className="p-3">SKU</th>
                                <th className="p-3">Price</th>
                                <th className="p-3">Stock</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredProducts.map((product) => (
                                <tr key={product._id} className="border-b">
                                    <td className="p-3">
                                        <div className="flex items-center gap-3">
                                            {product.images?.[0]?.url && (
                                                <img
                                                    src={product.images[0].url}
                                                    alt={product.name}
                                                    className="h-12 w-12 rounded object-cover"
                                                />
                                            )}
                                            <span className="font-medium">
                                                {product.name}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="p-3">{product.sku}</td>

                                    <td className="p-3">
                                        ₹{Number(product.price).toLocaleString('en-IN')}
                                    </td>

                                    <td className="p-3">{product.stock}</td>

                                    <td className="p-3">
                                        <span className={
                                            product.isActive
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                        }>
                                            {product.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>

                                    <td className="p-3">
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => handleEdit(product)}
                                                className="font-medium text-blue-600 hover:underline"
                                            >
                                                Edit
                                            </button>

                                            {product.isActive && (
                                                <button
                                                    onClick={() => handleDeactivate(product._id)}
                                                    className="font-medium text-red-600 hover:underline"
                                                >
                                                    Deactivate
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {filteredProducts.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="p-6 text-center text-gray-500">
                                        No products found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default AdminProducts;
