import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { getProductBySlug } from '../services/productService';
import { useCart } from '../context/CartContext';

const ProductDetails = () => {
    const { slug } = useParams();
    const { addToCart } = useCart();

    const [product, setProduct] = useState(null);
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        const loadProduct = async () => {
            setLoading(true);
            setError('');

            try {
                const data = await getProductBySlug(slug);

                if (!cancelled) {
                    setProduct(data);
                    setSelectedImage(0);
                    setQuantity(1);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.response?.data?.message ||
                        'Unable to load product.'
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadProduct();

        return () => {
            cancelled = true;
        };
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 p-10 text-center text-gray-400">
                Loading product...
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-gray-950 p-10 text-center text-white">
                <h1 className="text-2xl font-bold">
                    {error || 'Product not found'}
                </h1>

                <Link to="/products" className="mt-4 inline-block text-blue-400">
                    Back to Products
                </Link>
            </div>
        );
    }

    const images = product.images || [];
    const currentImage = images[selectedImage]?.url;

    const handleAddToCart = () => {
        addToCart(product, quantity);
    };

    return (
        <main className="min-h-screen bg-gray-950 px-4 py-10 text-white">
            <div className="mx-auto max-w-7xl">

                <Link
                    to="/products"
                    className="mb-8 inline-block text-sm text-blue-400 hover:text-blue-300"
                >
                    ← Back to Products
                </Link>

                <div className="grid gap-10 lg:grid-cols-2">

                    {/* Product Images */}
                    <section>
                        <div className="flex h-96 items-center justify-center rounded-2xl border border-gray-800 bg-gray-900 p-6">
                            {currentImage ? (
                                <img
                                    src={currentImage}
                                    alt={product.name}
                                    className="h-full w-full object-contain"
                                />
                            ) : (
                                <p className="text-gray-500">
                                    No image available
                                </p>
                            )}
                        </div>

                        {images.length > 1 && (
                            <div className="mt-4 flex flex-wrap gap-3">
                                {images.map((image, index) => (
                                    <button
                                        key={image._id || image.publicId || index}
                                        onClick={() => setSelectedImage(index)}
                                        className={`h-20 w-20 rounded-lg border p-2 ${
                                            selectedImage === index
                                                ? 'border-blue-500'
                                                : 'border-gray-700'
                                        }`}
                                    >
                                        <img
                                            src={image.url}
                                            alt={`${product.name} ${index + 1}`}
                                            className="h-full w-full object-contain"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Product Information */}
                    <section>
                        <p className="mb-3 text-sm text-blue-400">
                            {product.brand?.name} / {product.category?.name}
                        </p>

                        <h1 className="text-3xl font-bold sm:text-4xl">
                            {product.name}
                        </h1>

                        <p className="mt-5 leading-7 text-gray-400">
                            {product.description}
                        </p>

                        <div className="mt-6 flex flex-wrap items-center gap-3">
                            <span className="text-3xl font-bold">
                                ₹{product.price.toLocaleString('en-IN')}
                            </span>

                            {product.originalPrice > product.price && (
                                <span className="text-lg text-gray-500 line-through">
                                    ₹{product.originalPrice.toLocaleString('en-IN')}
                                </span>
                            )}
                        </div>

                        <p className={`mt-5 text-sm ${
                            product.stock > 0
                                ? 'text-green-400'
                                : 'text-red-400'
                        }`}>
                            {product.stock > 0
                                ? `${product.stock} available`
                                : 'Currently out of stock'}
                        </p>

                        {product.stock > 0 && (
                            <>
                                <div className="mt-6">
                                    <label className="mb-2 block text-sm text-gray-300">
                                        Quantity
                                    </label>

                                    <input
                                        type="number"
                                        min="1"
                                        max={product.stock}
                                        value={quantity}
                                        onChange={e => {
                                            const value = Number(e.target.value);

                                            if (
                                                Number.isInteger(value) &&
                                                value >= 1 &&
                                                value <= product.stock
                                            ) {
                                                setQuantity(value);
                                            }
                                        }}
                                        className="w-24 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white"
                                    />
                                </div>

                                <button
                                    onClick={handleAddToCart}
                                    className="mt-6 w-full rounded-lg bg-blue-600 py-3 font-semibold hover:bg-blue-700 sm:w-auto sm:px-10"
                                >
                                    Add to Cart
                                </button>
                            </>
                        )}

                        {/* Specifications */}
                        {product.specifications &&
                            Object.keys(product.specifications).length > 0 && (
                                <div className="mt-10">
                                    <h2 className="mb-4 text-xl font-bold">
                                        Specifications
                                    </h2>

                                    <div className="divide-y divide-gray-800 rounded-xl border border-gray-800">
                                        {Object.entries(product.specifications).map(
                                            ([key, value]) => (
                                                <div
                                                    key={key}
                                                    className="flex justify-between gap-4 p-4"
                                                >
                                                    <span className="text-gray-400">
                                                        {key}
                                                    </span>

                                                    <span className="text-right">
                                                        {value}
                                                    </span>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}
                    </section>
                </div>
            </div>
        </main>
    );
};

export default ProductDetails;