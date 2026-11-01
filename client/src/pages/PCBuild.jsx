
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    getProducts,
    getCategories,
} from '../services/productService';
import { submitPCBuildRequest } from '../services/serviceRequestService';
import { checkPCCompatibility } from '../utils/pcCompatibility';

const COMPONENT_TYPES = [
    {
        key: 'cpu',
        label: 'Processor (CPU)',
        keywords: ['processor', 'cpu'],
    },
    {
        key: 'motherboard',
        label: 'Motherboard',
        keywords: ['motherboard', 'mainboard'],
    },
    {
        key: 'ram',
        label: 'Memory (RAM)',
        keywords: ['ram', 'memory'],
    },
    {
        key: 'gpu',
        label: 'Graphics Card (GPU)',
        keywords: ['graphics-card', 'graphic-card', 'gpu', 'video-card'],
    },
    {
        key: 'storage',
        label: 'Storage (SSD / HDD)',
        keywords: ['storage', 'ssd', 'hard-drive', 'hdd'],
    },
    {
        key: 'psu',
        label: 'Power Supply (PSU)',
        keywords: ['power-supply', 'powersupply', 'psu'],
    },
];

const extractArray = (data, keys) => {
    if (Array.isArray(data)) return data;

    for (const key of keys) {
        if (Array.isArray(data?.[key])) return data[key];
    }

    return [];
};

const formatPrice = (price) =>
    `₹${Number(price || 0).toLocaleString('en-IN')}`;

const PCBuild = () => {
    const { user, isAuthenticated } = useAuth();

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [productError, setProductError] = useState('');

    const [selected, setSelected] = useState({});
    const [compatibility, setCompatibility] = useState({
        isCompatible: true,
        errors: [],
        warnings: [],
    });

    const [form, setForm] = useState({
        phone: user?.phone || '',
        budget: '',
        purpose: '',
        requirements: '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const loadBuilderData = async () => {
            try {
                const [productResult, categoryResult] = await Promise.all([
                    getProducts({ limit: 100 }),
                    getCategories(),
                ]);

                setProducts(
                    extractArray(productResult, [
                        'products',
                        'items',
                        'results',
                    ])
                );

                setCategories(
                    extractArray(categoryResult, [
                        'categories',
                        'items',
                        'results',
                    ])
                );
            } catch (err) {
                console.error('PC Builder loading error:', err);
                setProductError(
                    'Unable to load components. Please try again later.'
                );
            } finally {
                setLoadingProducts(false);
            }
        };

        loadBuilderData();
    }, []);

    const categoryById = useMemo(() => {
        return Object.fromEntries(
            categories.map((category) => [
                String(category._id || category.id),
                category,
            ])
        );
    }, [categories]);

    const getProductCategory = (product) => {
        if (product.category && typeof product.category === 'object') {
            return product.category;
        }

        return categoryById[String(product.category)] || {};
    };

    const getProductsForType = (type) => {
        return products.filter((product) => {
            const category = getProductCategory(product);

            const categoryText = [
                category.name,
                category.slug,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase()
                .replace(/\s+/g, '-');

                const productType = product.compatibility?.componentType;

                const matchesCategory = productType
                    ? productType === type.key
                    : type.keywords.some((keyword) =>
                        categoryText.includes(keyword)
                    );

            return matchesCategory && Number(product.stock) > 0;
        });
    };

    const handleComponentChange = (key, productId) => {
        setSelected((previous) => ({
            ...previous,
            [key]: productId,
        }));
    };

    const selectedProducts = useMemo(() => {
        return COMPONENT_TYPES.map((type) => {
            const product = products.find(
                (item) =>
                    String(item._id || item.id) === selected[type.key]
            );

            return product ? { ...type, product } : null;
        }).filter(Boolean);
    }, [products, selected]);
    const selectedComponentProducts = useMemo(() => {
        return Object.fromEntries(
            COMPONENT_TYPES.map((type) => {
                const product = products.find(
                    (item) =>
                        String(item._id || item.id) === selected[type.key]
                );
    
                return [type.key, product || null];
            })
        );
    }, [products, selected]);
    
    useEffect(() => {
        setCompatibility(
            checkPCCompatibility(selectedComponentProducts)
        );
    }, [selectedComponentProducts]);

    const totalPrice = selectedProducts.reduce(
        (total, item) => total + Number(item.product.price || 0),
        0
    );

    const handleFormChange = (event) => {
        setForm((previous) => ({
            ...previous,
            [event.target.name]: event.target.value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (selectedProducts.length === 0) {
            setError('Please select at least one component.');
            return;
        }
        if (!compatibility.isCompatible) {
            setError('Your selected components are incompatible. Please fix the issues before submitting.');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        const componentDetails = selectedProducts
            .map(
                ({ label, product }) =>
                    `${label}: ${product.name} - ${formatPrice(product.price)}`
            )
            .join('\n');

        const requirements = [
            'CUSTOM PC BUILD - SELECTED COMPONENTS',
            '',
            componentDetails,
            '',
            `Estimated component total: ${formatPrice(totalPrice)}`,
            '',
            `Additional requirements: ${form.requirements || 'None provided'}`,
        ].join('\n');

        try {
            await submitPCBuildRequest({
                ...form,
                requirements,
            });

            setSuccess(
                'Your PC build request has been submitted successfully. Our team will contact you.'
            );

            setSelected({});
            setForm({
                phone: user?.phone || '',
                budget: '',
                purpose: '',
                requirements: '',
            });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to submit your request. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="mx-auto max-w-xl px-4 py-20 text-center">
                <h1 className="text-3xl font-bold">
                    Custom PC Builder
                </h1>

                <p className="my-4 text-gray-600">
                    Please log in to create and submit your custom PC build.
                </p>

                <Link
                    to="/login"
                    className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-white"
                >
                    Login
                </Link>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 px-4 py-12">
            <div className="mx-auto max-w-7xl">

                <header className="mb-10 text-center">
                    <p className="font-semibold uppercase tracking-widest text-blue-600">
                        Compunent Rig
                    </p>

                    <h1 className="mt-3 text-3xl font-extrabold text-gray-900 md:text-5xl">
                        Build Your Dream PC
                    </h1>

                    <p className="mx-auto mt-4 max-w-2xl text-gray-600">
                        Choose your components, calculate your estimated
                        build price, and send your configuration to our team.
                    </p>
                </header>

                {error && (
                    <div className="mb-6 rounded-lg bg-red-100 p-4 text-red-700">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-6 rounded-lg bg-green-100 p-4 text-green-700">
                        {success}
                    </div>
                )}

                {productError && (
                    <div className="mb-6 rounded-lg bg-red-100 p-4 text-red-700">
                        {productError}
                    </div>
                )}

                {loadingProducts ? (
                    <div className="rounded-xl bg-white p-12 text-center text-gray-500">
                        Loading available components...
                    </div>
                ) : (
                    <div className="grid gap-8 lg:grid-cols-3">

                        <section className="space-y-5 lg:col-span-2">
                            <div className="rounded-xl bg-white p-6 shadow-sm">
                                <h2 className="mb-6 text-xl font-bold text-gray-900">
                                    1. Select Your Components
                                </h2>
                                {(compatibility.errors.length > 0 ||
    compatibility.warnings.length > 0) && (
    <div className="mb-6 space-y-3">
        {compatibility.errors.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <h3 className="font-bold text-red-800">
                    Compatibility Issues
                </h3>

                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-700">
                    {compatibility.errors.map((message, index) => (
                        <li key={index}>{message}</li>
                    ))}
                </ul>
            </div>
        )}

        {compatibility.warnings.length > 0 && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <h3 className="font-bold text-yellow-800">
                    Compatibility Warnings
                </h3>

                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-yellow-700">
                    {compatibility.warnings.map((message, index) => (
                        <li key={index}>{message}</li>
                    ))}
                </ul>
            </div>
        )}
    </div>
)}

                                <div className="space-y-5">
                                    {COMPONENT_TYPES.map((type) => {
                                        const availableProducts =
                                            getProductsForType(type);

                                        return (
                                            <div key={type.key}>
                                                <label
                                                    htmlFor={type.key}
                                                    className="mb-2 block font-semibold text-gray-800"
                                                >
                                                    {type.label}
                                                </label>

                                                <select
                                                    id={type.key}
                                                    value={selected[type.key] || ''}
                                                    onChange={(event) =>
                                                        handleComponentChange(
                                                            type.key,
                                                            event.target.value
                                                        )
                                                    }
                                                    className="w-full rounded-lg border border-gray-300 bg-white p-3 outline-none focus:border-blue-500"
                                                >
                                                    <option value="">
                                                        {availableProducts.length
                                                            ? 'Choose a component'
                                                            : 'No products available in this category'}
                                                    </option>

                                                    {availableProducts.map(
                                                        (product) => (
                                                            <option
    key={product._id || product.id}
    value={product._id || product.id}
>
    {product.name} — {formatPrice(product.price)}
    {product.compatibility?.socket
        ? ` | ${product.compatibility.socket}`
        : ''}
    {product.compatibility?.ramType
        ? ` | ${product.compatibility.ramType}`
        : ''}
    {product.compatibility?.capacity
        ? ` | ${product.compatibility.capacity}GB`
        : ''}
    {product.compatibility?.wattage
        ? ` | ${product.compatibility.wattage}W`
        : ''}
</option>
                                                        )
                                                    )}
                                                </select>

                                                {availableProducts.length === 0 && (
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        Add active products to the matching category in the admin dashboard.
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <form
                                onSubmit={handleSubmit}
                                className="space-y-5 rounded-xl bg-white p-6 shadow-sm"
                            >
                                <h2 className="text-xl font-bold text-gray-900">
                                    2. Build Requirements
                                </h2>

                                <div>
                                    <label className="mb-2 block font-medium">
                                        Your Phone Number
                                    </label>

                                    <input
                                        type="tel"
                                        name="phone"
                                        value={form.phone}
                                        onChange={handleFormChange}
                                        required
                                        className="w-full rounded-lg border p-3"
                                        placeholder="Enter your phone number"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block font-medium">
                                        Your Budget
                                    </label>

                                    <select
                                        name="budget"
                                        value={form.budget}
                                        onChange={handleFormChange}
                                        required
                                        className="w-full rounded-lg border p-3"
                                    >
                                        <option value="">
                                            Select your budget
                                        </option>
                                        <option value="Under ₹30,000">
                                            Under ₹30,000
                                        </option>
                                        <option value="₹30,000 - ₹50,000">
                                            ₹30,000 - ₹50,000
                                        </option>
                                        <option value="₹50,000 - ₹75,000">
                                            ₹50,000 - ₹75,000
                                        </option>
                                        <option value="₹75,000 - ₹1,00,000">
                                            ₹75,000 - ₹1,00,000
                                        </option>
                                        <option value="Above ₹1,00,000">
                                            Above ₹1,00,000
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block font-medium">
                                        Primary Purpose
                                    </label>

                                    <select
                                        name="purpose"
                                        value={form.purpose}
                                        onChange={handleFormChange}
                                        required
                                        className="w-full rounded-lg border p-3"
                                    >
                                        <option value="">
                                            Select purpose
                                        </option>
                                        <option value="Gaming">Gaming</option>
                                        <option value="Video Editing">
                                            Video Editing
                                        </option>
                                        <option value="Programming and Development">
                                            Programming and Development
                                        </option>
                                        <option value="Office and Productivity">
                                            Office and Productivity
                                        </option>
                                        <option value="AI and Machine Learning">
                                            AI and Machine Learning
                                        </option>
                                        <option value="Workstation">
                                            Workstation
                                        </option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block font-medium">
                                        Additional Requirements
                                    </label>

                                    <textarea
                                        name="requirements"
                                        value={form.requirements}
                                        onChange={handleFormChange}
                                        rows={4}
                                        maxLength={2000}
                                        placeholder="Mention preferred cabinet, cooling, monitor, accessories or other requirements..."
                                        className="w-full rounded-lg border p-3"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || loadingProducts}
                                    className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {loading
                                        ? 'Submitting...'
                                        : 'Submit PC Build Request'}
                                </button>
                            </form>
                        </section>

                        <aside className="h-fit rounded-xl bg-gray-950 p-6 text-white lg:sticky lg:top-6">
                            <h2 className="text-xl font-bold">
                                Your Build Summary
                            </h2>
                            <div className={`mt-4 rounded-lg p-3 text-sm font-semibold ${
    compatibility.errors.length > 0
        ? 'bg-red-900/50 text-red-300'
        : compatibility.warnings.length > 0
            ? 'bg-yellow-900/50 text-yellow-300'
            : 'bg-green-900/50 text-green-300'
}`}>
    {compatibility.errors.length > 0
        ? 'Compatibility issues found'
        : compatibility.warnings.length > 0
            ? 'Compatibility not fully verified'
            : 'No known compatibility issues'}
</div>

                            <p className="mt-2 text-sm text-gray-400">
                                Selected components
                            </p>

                            <div className="my-6 space-y-4">
                                {selectedProducts.length === 0 ? (
                                    <p className="text-sm text-gray-400">
                                        No components selected yet.
                                    </p>
                                ) : (
                                    selectedProducts.map(
                                        ({ key, label, product }) => (
                                            <div
                                                key={key}
                                                className="flex justify-between gap-3 border-b border-gray-800 pb-3"
                                            >
                                                <div>
                                                    <p className="text-xs text-blue-400">
                                                        {label}
                                                    </p>

                                                    <p className="mt-1 text-sm font-medium">
                                                        {product.name}
                                                    </p>
                                                    <div className="mt-1 space-y-1 text-xs text-gray-400">
    {product.compatibility?.socket && (
        <p>Socket: {product.compatibility.socket}</p>
    )}

    {product.compatibility?.ramType && (
        <p>RAM: {product.compatibility.ramType}</p>
    )}

    {product.compatibility?.capacity && (
        <p>Capacity: {product.compatibility.capacity}GB</p>
    )}

    {product.compatibility?.interface && (
        <p>Interface: {product.compatibility.interface}</p>
    )}

    {product.compatibility?.wattage && (
        <p>Power: {product.compatibility.wattage}W</p>
    )}
</div>
                                                    {product.compatibility?.componentType && (
    <p className="mt-1 text-xs text-gray-400">
        Type: {product.compatibility.componentType.toUpperCase()}
    </p>
)}
                                                </div>

                                                <p className="whitespace-nowrap text-sm font-semibold">
                                                    {formatPrice(product.price)}
                                                </p>
                                            </div>
                                        )
                                    )
                                )}
                            </div>

                            <div className="border-t border-gray-700 pt-5">
                                <p className="text-sm text-gray-400">
                                    Estimated Component Total
                                </p>

                                <p className="mt-2 text-3xl font-extrabold text-blue-400">
                                    {formatPrice(totalPrice)}
                                </p>
                                <div className="mt-5 border-t border-gray-700 pt-4">
    <div className="flex justify-between text-sm">
        <span className="text-gray-400">Selected components</span>
        <span className="font-semibold">{selectedProducts.length}</span>
    </div>

    <div className="mt-2 flex justify-between text-sm">
        <span className="text-gray-400">Compatibility</span>
        <span className={
            compatibility.errors.length > 0
                ? 'font-semibold text-red-400'
                : compatibility.warnings.length > 0
                    ? 'font-semibold text-yellow-400'
                    : 'font-semibold text-green-400'
        }>
            {compatibility.errors.length > 0
                ? 'Issues found'
                : compatibility.warnings.length > 0
                    ? 'Warnings'
                    : 'No known issues'}
        </span>
    </div>
</div>
                            </div>

                            <p className="mt-5 text-xs leading-relaxed text-gray-400">
                                This is an estimated component price only.
                                Final compatibility, availability, assembly
                                charges and pricing will be confirmed by our team.
                            </p>
                        </aside>

                    </div>
                )}
            </div>
        </main>
    );
};

export default PCBuild;
