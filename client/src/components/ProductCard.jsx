import { Link } from 'react-router-dom';

const ProductCard = ({ product }) => {
    const image = product.images?.[0]?.url;

    return (
        <article className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900 transition hover:-translate-y-1 hover:border-blue-500">

            <Link to={`/products/${product.slug}`}>
                <div className="flex h-52 items-center justify-center bg-gray-800 p-4">
                    {image ? (
                        <img
                            src={image}
                            alt={product.name}
                            loading="lazy"
                            className="h-full w-full object-contain"
                        />
                    ) : (
                        <span className="text-gray-500">
                            No image available
                        </span>
                    )}
                </div>
            </Link>

            <div className="p-4">
                <p className="mb-2 text-xs text-blue-400">
                    {product.brand?.name || 'Computer Component'}
                </p>

                <Link to={`/products/${product.slug}`}>
                    <h2 className="mb-3 line-clamp-2 min-h-12 font-semibold text-white hover:text-blue-400">
                        {product.name}
                    </h2>
                </Link>

                <div className="mb-4 flex items-center gap-2">
                    <span className="text-xl font-bold text-white">
                        ₹{product.price.toLocaleString('en-IN')}
                    </span>

                    {product.originalPrice > product.price && (
                        <span className="text-sm text-gray-500 line-through">
                            ₹{product.originalPrice.toLocaleString('en-IN')}
                        </span>
                    )}
                </div>

                <p className={`mb-4 text-sm ${
                    product.stock > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                    {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                </p>

                <Link
                    to={`/products/${product.slug}`}
                    className="block rounded-lg bg-blue-600 py-2 text-center font-medium text-white hover:bg-blue-700"
                >
                    View Details
                </Link>
            </div>
        </article>
    );
};

export default ProductCard;