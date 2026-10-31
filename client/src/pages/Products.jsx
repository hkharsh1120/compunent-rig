import { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard';

import {
    getProducts,
    getCategories,
    getBrands,
} from '../services/productService';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [pagination, setPagination] = useState({});

    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [brand, setBrand] = useState('');
    const [sort, setSort] = useState('newest');
    const [page, setPage] = useState(1);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Load categories and brands
    useEffect(() => {
        const loadFilters = async () => {
            try {
                const [categoryData, brandData] = await Promise.all([
                    getCategories(),
                    getBrands(),
                ]);

                setCategories(categoryData);
                setBrands(brandData);
            } catch {
                setError('Unable to load catalogue filters.');
            }
        };

        loadFilters();
    }, []);

    // Load products whenever filters change
    useEffect(() => {
        let cancelled = false;

        const loadProducts = async () => {
            setLoading(true);
            setError('');

            try {
                const result = await getProducts({
                    search: search.trim() || undefined,
                    category: category || undefined,
                    brand: brand || undefined,
                    sort,
                    page,
                    limit: 12,
                });

                if (!cancelled) {
                    setProducts(result.products);
                    setPagination(result.pagination);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.response?.data?.message ||
                        'Unable to load products.'
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadProducts();

        return () => {
            cancelled = true;
        };
    }, [search, category, brand, sort, page]);

    const changeFilter = (setter, value) => {
        setter(value);
        setPage(1);
    };

    return (
        <main className="min-h-screen bg-gray-950 px-4 py-10 text-white">
            <div className="mx-auto max-w-7xl">

                <div className="mb-8">
                    <h1 className="text-3xl font-bold sm:text-4xl">
                        Computer Components
                    </h1>

                    <p className="mt-2 text-gray-400">
                        Explore components and build your perfect PC.
                    </p>
                </div>

                {/* Search and filters */}
                <div className="mb-8 grid gap-4 rounded-xl border border-gray-800 bg-gray-900 p-4 sm:grid-cols-2 lg:grid-cols-4">

                    <input
                        type="search"
                        value={search}
                        onChange={e => changeFilter(setSearch, e.target.value)}
                        placeholder="Search products..."
                        className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none focus:border-blue-500"
                    />

                    <select
                        value={category}
                        onChange={e => changeFilter(setCategory, e.target.value)}
                        className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white"
                    >
                        <option value="">All Categories</option>

                        {categories.map(item => (
                            <option key={item._id} value={item._id}>
                                {item.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={brand}
                        onChange={e => changeFilter(setBrand, e.target.value)}
                        className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white"
                    >
                        <option value="">All Brands</option>

                        {brands.map(item => (
                            <option key={item._id} value={item._id}>
                                {item.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={sort}
                        onChange={e => changeFilter(setSort, e.target.value)}
                        className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white"
                    >
                        <option value="newest">Newest First</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="name">Name: A to Z</option>
                    </select>
                </div>

                {/* Product results */}
                {error && (
                    <p className="mb-6 rounded-lg bg-red-950 p-4 text-red-400">
                        {error}
                    </p>
                )}

                {loading ? (
                    <p className="py-16 text-center text-gray-400">
                        Loading products...
                    </p>
                ) : products.length === 0 ? (
                    <div className="py-16 text-center">
                        <h2 className="text-xl font-semibold">
                            No products found
                        </h2>
                        <p className="mt-2 text-gray-400">
                            Try changing your search or filters.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="mb-5 flex items-center justify-between">
                            <p className="text-sm text-gray-400">
                                {pagination.total} products found
                            </p>

                            <p className="text-sm text-gray-400">
                                Page {pagination.page} of {pagination.totalPages}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {products.map(product => (
                                <ProductCard
                                    key={product._id}
                                    product={product}
                                />
                            ))}
                        </div>

                        {/* Pagination */}
                        <div className="mt-10 flex items-center justify-center gap-4">
                            <button
                                disabled={!pagination.hasPreviousPage}
                                onClick={() => setPage(current => current - 1)}
                                className="rounded-lg border border-gray-700 px-5 py-2 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Previous
                            </button>

                            <span className="text-gray-400">
                                {pagination.page} / {pagination.totalPages}
                            </span>

                            <button
                                disabled={!pagination.hasNextPage}
                                onClick={() => setPage(current => current + 1)}
                                className="rounded-lg border border-gray-700 px-5 py-2 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </>
                )}
            </div>
        </main>
    );
};

export default Products;