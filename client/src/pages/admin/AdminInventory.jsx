import { useEffect, useState } from 'react';
import {
    getInventoryOverview,
    getInventoryProducts,
    getStockHistory,
    adjustStock,
} from '../../services/adminInventoryService';

const statusColors = {
    in_stock: 'bg-green-100 text-green-800',
    low_stock: 'bg-yellow-100 text-yellow-800',
    out_of_stock: 'bg-red-100 text-red-800',
};

const stockStatusLabels = {
    in_stock: 'In Stock',
    low_stock: 'Low Stock',
    out_of_stock: 'Out of Stock',
};

const AdminInventory = () => {
    const [overview, setOverview] = useState(null);
    const [products, setProducts] = useState([]);
    const [stockHistory, setStockHistory] = useState([]);

    const [selectedProduct, setSelectedProduct] = useState(null);
    const [historyPage, setHistoryPage] = useState(1);

    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [brandFilter, setBrandFilter] = useState('');
    const [stockFilter, setStockFilter] = useState('');

    const [showingAdjustModal, setShowingAdjustModal] = useState(false);
    const [adjustProduct, setAdjustProduct] = useState(null);
    const [adjustQty, setAdjustQty] = useState('');
    const [adjustReason, setAdjustReason] = useState('');
    const [adjustType, setAdjustType] = useState('add');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const loadOverview = async () => {
        try {
            const data = await getInventoryOverview();
            setOverview(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to load inventory overview.');
        }
    };

    const loadProducts = async () => {
        setLoading(true);
        setError('');

        try {
            const filters = {};
            if (search) filters.search = search;
            if (categoryFilter) filters.category = categoryFilter;
            if (brandFilter) filters.brand = brandFilter;
            if (stockFilter) filters.stockStatus = stockFilter;

            const result = await getInventoryProducts(filters);
            setProducts(Array.isArray(result) ? result : result?.products || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to load products.');
        } finally {
            setLoading(false);
        }
    };

    const loadStockHistory = async (productId) => {
        try {
            const history = await getStockHistory(productId, { page: historyPage });
            setStockHistory(Array.isArray(history) ? history : history?.history || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to load stock history.');
        }
    };

    useEffect(() => {
        loadOverview();
    }, []);

    useEffect(() => {
        loadProducts();
    }, [search, categoryFilter, brandFilter, stockFilter]);

    useEffect(() => {
        if (selectedProduct) {
            loadStockHistory(selectedProduct._id);
        }
    }, [selectedProduct, historyPage]);

    const handleOpenAdjustModal = (product) => {
        setAdjustProduct(product);
        setAdjustQty('');
        setAdjustReason('');
        setAdjustType('add');
        setShowingAdjustModal(true);
    };

    const handleCloseAdjustModal = () => {
        setShowingAdjustModal(false);
        setAdjustProduct(null);
    };

    const handleStockAdjustment = async () => {
        if (!adjustProduct || !adjustQty) return;

        const qty = parseInt(adjustQty, 10);
        const signedQty = adjustType === 'add' ? qty : -qty;

        // Prevent reducing below zero
        if (adjustType === 'reduce' && qty > adjustProduct.stock) {
            setError('Cannot reduce stock below zero.');
            return;
        }

        setError('');
        setMessage('');

        try {
            await adjustStock(adjustProduct._id, {
                quantity: signedQty,
                reason: adjustReason,
            });

            setMessage('Stock adjusted successfully.');
            handleCloseAdjustModal();
            loadProducts();
            loadOverview();
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to adjust stock.');
        }
    };

    const determineStockStatus = (stock, threshold = 5) => {
        if (stock === 0) return 'out_of_stock';
        if (stock <= threshold) return 'low_stock';
        return 'in_stock';
    };

    const uniqueCategories = [...new Set(products.map(p => p.category?.name).filter(Boolean))];
    const uniqueBrands = [...new Set(products.map(p => p.brand?.name).filter(Boolean))];

    if (loading && products.length === 0) {
        return <p className="text-gray-600">Loading inventory...</p>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
                <p className="mt-2 text-gray-600">Monitor and manage product stock levels.</p>
            </div>

            {error && (
                <div className="rounded-lg bg-red-100 p-4 text-red-700">{error}</div>
            )}

            {message && (
                <div className="rounded-lg bg-green-100 p-4 text-green-700">{message}</div>
            )}

            {/* Overview Cards */}
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">Total Products</p>
                    <p className="mt-3 text-3xl font-bold text-gray-900">{overview?.totalProducts || 0}</p>
                </div>
                <div className="rounded-xl bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">Total Stock</p>
                    <p className="mt-3 text-3xl font-bold text-gray-900">{overview?.totalStock || 0}</p>
                </div>
                <div className="rounded-xl bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">Low Stock</p>
                    <p className="mt-3 text-3xl font-bold text-yellow-600">{overview?.lowStockCount || 0}</p>
                </div>
                <div className="rounded-xl bg-white p-6 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">Out of Stock</p>
                    <p className="mt-3 text-3xl font-bold text-red-600">{overview?.outOfStockCount || 0}</p>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="rounded-xl bg-white p-5 shadow-sm">
                <div className="flex flex-wrap gap-4">
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="rounded-lg border p-3 w-64"
                    />
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="rounded-lg border p-3"
                    >
                        <option value="">All Categories</option>
                        {uniqueCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                    <select
                        value={brandFilter}
                        onChange={(e) => setBrandFilter(e.target.value)}
                        className="rounded-lg border p-3"
                    >
                        <option value="">All Brands</option>
                        {uniqueBrands.map(brand => (
                            <option key={brand} value={brand}>{brand}</option>
                        ))}
                    </select>
                    <select
                        value={stockFilter}
                        onChange={(e) => setStockFilter(e.target.value)}
                        className="rounded-lg border p-3"
                    >
                        <option value="">All Stock Levels</option>
                        <option value="in_stock">In Stock</option>
                        <option value="low_stock">Low Stock</option>
                        <option value="out_of_stock">Out of Stock</option>
                    </select>
                </div>
            </div>

            {/* Inventory Table */}
            <div className="rounded-xl bg-white p-5 shadow-sm">
                <h2 className="mb-5 text-xl font-bold">Products ({products.length})</h2>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b bg-gray-50 text-gray-600">
                                <th className="p-3">Product</th>
                                <th className="p-3">SKU</th>
                                <th className="p-3">Category</th>
                                <th className="p-3">Brand</th>
                                <th className="p-3">Stock</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => {
                                const status = determineStockStatus(product.stock, overview?.lowStockThreshold || 5);
                                return (
                                    <tr key={product._id} className="border-b">
                                        <td className="p-3">
                                            <div className="flex items-center gap-3">
                                                {product.images?.[0]?.url && (
                                                    <img
                                                        src={product.images[0].url}
                                                        alt={product.name}
                                                        className="h-10 w-10 rounded object-cover"
                                                    />
                                                )}
                                                <span className="font-medium">{product.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-3 font-mono text-sm">{product.sku}</td>
                                        <td className="p-3">{product.category?.name || '-'}</td>
                                        <td className="p-3">{product.brand?.name || '-'}</td>
                                        <td className="p-3 font-medium">{product.stock}</td>
                                        <td className="p-3">
                                            <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-700'}`}>
                                                {stockStatusLabels[status] || 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => handleOpenAdjustModal(product)}
                                                    className="text-blue-600 hover:underline text-sm"
                                                >
                                                    Adjust
                                                </button>
                                                <button
                                                    onClick={() => setSelectedProduct(product)}
                                                    className="text-blue-600 hover:underline text-sm"
                                                >
                                                    History
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {products.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="p-6 text-center text-gray-500">
                                        No products found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Stock History Modal */}
            {selectedProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="rounded-xl bg-white w-full max-w-3xl max-h-[80vh] flex flex-col">
                        <div className="flex items-center justify-between border-b p-4">
                            <h2 className="text-xl font-bold">
                                Stock History: {selectedProduct.name}
                            </h2>
                            <button
                                onClick={() => setSelectedProduct(null)}
                                className="rounded-lg border p-2 hover:bg-gray-100"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b bg-gray-50 text-gray-600">
                                            <th className="p-3">Date</th>
                                            <th className="p-3">Change</th>
                                            <th className="p-3">Previous</th>
                                            <th className="p-3">New</th>
                                            <th className="p-3">Type</th>
                                            <th className="p-3">Reference</th>
                                            <th className="p-3">Reason</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stockHistory.map((entry) => (
                                            <tr key={entry._id} className="border-b">
                                                <td className="p-3">
                                                    {new Date(entry.createdAt).toLocaleString()}
                                                </td>
                                                <td className="p-3">
                                                    <span className={entry.change < 0 ? 'text-red-600' : 'text-green-600'}>
                                                        {entry.change > 0 ? '+' : ''}{entry.change}
                                                    </span>
                                                </td>
                                                <td className="p-3">{entry.previousStock}</td>
                                                <td className="p-3">{entry.newStock}</td>
                                                <td className="p-3 capitalize">{entry.type}</td>
                                                <td className="p-3 font-mono text-xs">{entry.reference}</td>
                                                <td className="p-3 text-gray-600">{entry.reason}</td>
                                            </tr>
                                        ))}
                                        {stockHistory.length === 0 && (
                                            <tr>
                                                <td colSpan="7" className="p-6 text-center text-gray-500">
                                                    No stock history found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 border-t p-4">
                            <button
                                onClick={() => setHistoryPage(historyPage - 1)}
                                disabled={historyPage <= 1}
                                className="rounded-lg border px-4 py-2 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-gray-600 self-center">
                                Page {historyPage}
                            </span>
                            <button
                                onClick={() => setHistoryPage(historyPage + 1)}
                                disabled={stockHistory.length < 50}
                                className="rounded-lg border px-4 py-2 disabled:opacity-50"
                            >
                                Next
                            </button>
                            <button
                                onClick={() => setSelectedProduct(null)}
                                className="rounded-lg border px-4 py-2"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stock Adjustment Modal */}
            {showingAdjustModal && adjustProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="rounded-xl bg-white w-full max-w-md p-0">
                        <div className="flex items-center justify-between border-b p-4">
                            <h2 className="text-xl font-bold">Adjust Stock</h2>
                            <button
                                onClick={handleCloseAdjustModal}
                                className="rounded-lg border p-2 hover:bg-gray-100"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="mb-4">
                                <p className="font-medium">{adjustProduct.name}</p>
                                <p className="text-sm text-gray-600">Current Stock: {adjustProduct.stock}</p>
                            </div>

                            <div className="mb-4">
                                <label className="mb-2 block text-sm font-medium">Adjustment Type</label>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setAdjustType('add')}
                                        className={`flex-1 rounded-lg p-3 font-medium ${
                                            adjustType === 'add'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-white border'
                                        }`}
                                    >
                                        Add
                                    </button>
                                    <button
                                        onClick={() => setAdjustType('reduce')}
                                        className={`flex-1 rounded-lg p-3 font-medium ${
                                            adjustType === 'reduce'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-white border'
                                        }`}
                                    >
                                        Reduce
                                    </button>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="mb-2 block text-sm font-medium">
                                    Quantity {adjustType === 'reduce' ? '(max: ' + adjustProduct.stock + ')' : ''}
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max={adjustType === 'reduce' ? adjustProduct.stock : 1000}
                                    value={adjustQty}
                                    onChange={(e) => setAdjustQty(e.target.value)}
                                    className="w-full rounded-lg border p-3"
                                    required
                                />
                            </div>

                            {adjustType === 'reduce' && adjustQty && parseInt(adjustQty) > adjustProduct.stock && (
                                <p className="mb-2 text-xs text-red-600">
                                    Cannot reduce below zero. Please enter a quantity less than or equal to {adjustProduct.stock}.
                                </p>
                            )}

                            <div className="mb-4">
                                <label className="mb-2 block text-sm font-medium">Reason</label>
                                <textarea
                                    value={adjustReason}
                                    onChange={(e) => setAdjustReason(e.target.value)}
                                    rows="2"
                                    maxLength="500"
                                    className="w-full rounded-lg border p-3"
                                    placeholder="Enter reason for this adjustment..."
                                    required
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    {adjustReason.length}/500 characters
                                </p>
                            </div>

                            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm">
                                    <span className="font-medium">New stock will be:</span>{' '}
                                    <span className="font-bold">
                                        {adjustProduct.stock + (adjustType === 'add' ? parseInt(adjustQty || 0) : -parseInt(adjustQty || 0))}
                                    </span>
                                </p>
                            </div>

                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={handleCloseAdjustModal}
                                    className="rounded-lg border px-4 py-2"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleStockAdjustment}
                                    disabled={!adjustQty || !adjustReason ||
                                                (adjustType === 'reduce' && parseInt(adjustQty) > adjustProduct.stock)}
                                    className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white disabled:opacity-50"
                                >
                                    Adjust Stock
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminInventory;