import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const Cart = () => {
    const {
        cartItems,
        cartCount,
        cartTotal,
        updateQuantity,
        removeFromCart,
        clearCart,
    } = useCart();

    return (
        <main className="min-h-screen bg-gray-950 px-4 py-10 text-white">
            <div className="mx-auto max-w-5xl">

                <h1 className="mb-8 text-3xl font-bold">
                    Shopping Cart ({cartCount})
                </h1>

                {cartItems.length === 0 ? (
                    <div className="rounded-xl border border-gray-800 bg-gray-900 p-10 text-center">
                        <h2 className="text-xl font-semibold">
                            Your cart is empty
                        </h2>

                        <Link
                            to="/products"
                            className="mt-5 inline-block rounded-lg bg-blue-600 px-6 py-3 hover:bg-blue-700"
                        >
                            Explore Products
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-8 lg:grid-cols-3">

                        <div className="space-y-4 lg:col-span-2">
                            {cartItems.map(item => (
                                <div
                                    key={item.productId}
                                    className="flex flex-wrap items-center gap-4 rounded-xl border border-gray-800 bg-gray-900 p-4"
                                >
                                    <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-gray-800 p-2">
                                        {item.image ? (
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="h-full w-full object-contain"
                                            />
                                        ) : (
                                            <span className="text-xs text-gray-500">
                                                No image
                                            </span>
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <Link
                                            to={`/products/${item.slug}`}
                                            className="font-semibold hover:text-blue-400"
                                        >
                                            {item.name}
                                        </Link>

                                        <p className="mt-1 text-sm text-gray-400">
                                            ₹{item.price.toLocaleString('en-IN')}
                                        </p>

                                        <p className="mt-1 text-sm text-gray-500">
                                            Subtotal: ₹{(
                                                item.price * item.quantity
                                            ).toLocaleString('en-IN')}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            min="1"
                                            max={item.stock}
                                            value={item.quantity}
                                            onChange={e => {
                                                const value = Number(e.target.value);

                                                if (
                                                    Number.isInteger(value) &&
                                                    value >= 1 &&
                                                    value <= item.stock
                                                ) {
                                                    updateQuantity(
                                                        item.productId,
                                                        value
                                                    );
                                                }
                                            }}
                                            className="w-16 rounded-lg border border-gray-700 bg-gray-800 p-2 text-center"
                                        />

                                        <button
                                            onClick={() => removeFromCart(item.productId)}
                                            className="text-sm text-red-400 hover:text-red-300"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={clearCart}
                                className="text-sm text-red-400 hover:text-red-300"
                            >
                                Clear Cart
                            </button>
                        </div>

                        <aside className="h-fit rounded-xl border border-gray-800 bg-gray-900 p-6">
                            <h2 className="mb-5 text-xl font-bold">
                                Order Summary
                            </h2>

                            <div className="flex justify-between text-gray-400">
                                <span>Total Items</span>
                                <span>{cartCount}</span>
                            </div>

                            <div className="mt-4 flex justify-between text-lg font-bold">
                                <span>Total</span>
                                <span>
                                    ₹{cartTotal.toLocaleString('en-IN')}
                                </span>
                            </div>

                            <p className="mt-4 text-xs text-gray-500">
                                Final prices and stock availability will be
                                confirmed when you submit your order.
                            </p>

                            <Link
    to="/checkout"
    className="mt-6 block w-full rounded-lg bg-blue-600 py-3 text-center font-semibold hover:bg-blue-700"
>
    Proceed to Checkout
</Link>

                            <Link
                                to="/products"
                                className="mt-4 block text-center text-sm text-blue-400"
                            >
                                Continue Shopping
                            </Link>
                        </aside>

                    </div>
                )}
            </div>
        </main>
    );
};

export default Cart;