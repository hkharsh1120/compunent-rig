import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders } from '../services/orderService';

const statusStyles = {
    pending: 'bg-yellow-900/40 text-yellow-400',
    confirmed: 'bg-blue-900/40 text-blue-400',
    processing: 'bg-purple-900/40 text-purple-400',
    shipped: 'bg-indigo-900/40 text-indigo-400',
    delivered: 'bg-green-900/40 text-green-400',
    cancelled: 'bg-red-900/40 text-red-400',
};

const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadOrders = async () => {
            try {
                const data = await getMyOrders();
                setOrders(data);
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    'Unable to load your orders.'
                );
            } finally {
                setLoading(false);
            }
        };

        loadOrders();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 p-10 text-center text-gray-400">
                Loading your orders...
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gray-950 px-4 py-10 text-white">
            <div className="mx-auto max-w-5xl">

                <h1 className="mb-8 text-3xl font-bold">My Orders</h1>

                {error && (
                    <p className="rounded-lg bg-red-950 p-4 text-red-400">
                        {error}
                    </p>
                )}

                {!error && orders.length === 0 ? (
                    <div className="rounded-xl border border-gray-800 bg-gray-900 p-10 text-center">
                        <h2 className="text-xl font-semibold">
                            No orders yet
                        </h2>

                        <Link
                            to="/products"
                            className="mt-5 inline-block rounded-lg bg-blue-600 px-6 py-3"
                        >
                            Explore Products
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {orders.map(order => (
                            <article
                                key={order._id}
                                className="rounded-xl border border-gray-800 bg-gray-900 p-5"
                            >
                                <div className="flex flex-wrap justify-between gap-4">
                                    <div>
                                        <p className="text-sm text-gray-400">
                                            Order Number
                                        </p>

                                        <p className="mt-1 font-semibold">
                                            {order.orderNumber}
                                        </p>
                                    </div>

                                    <span className={`h-fit rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                                        statusStyles[order.orderStatus] ||
                                        'bg-gray-800 text-gray-300'
                                    }`}>
                                        {order.orderStatus}
                                    </span>
                                </div>

                                <div className="mt-5 flex flex-wrap justify-between gap-4 border-t border-gray-800 pt-5">
                                    <div>
                                        <p className="text-sm text-gray-400">
                                            Order Date
                                        </p>

                                        <p>
                                            {new Date(order.createdAt).toLocaleDateString('en-IN')}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-400">
                                            Total Amount
                                        </p>

                                        <p className="font-bold">
                                            ₹{order.totalAmount.toLocaleString('en-IN')}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-400">
                                            Items
                                        </p>

                                        <p>{order.items.length} products</p>
                                    </div>
                                </div>

                                <Link
                                    to={`/account/orders/${order._id}`}
                                    className="mt-5 inline-block text-sm font-semibold text-blue-400 hover:text-blue-300"
                                >
                                    View Order Details →
                                </Link>
                            </article>
                        ))}
                    </div>
                )}

            </div>
        </main>
    );
};

export default MyOrders;