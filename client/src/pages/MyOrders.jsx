import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders, getOrderCancellationStatus, requestOrderCancellation, cancelOrder } from '../services/orderService';

const statusStyles = {
    pending: 'bg-yellow-900/40 text-yellow-400',
    confirmed: 'bg-blue-900/40 text-blue-400',
    processing: 'bg-purple-900/40 text-purple-400',
    shipped: 'bg-indigo-900/40 text-indigo-400',
    delivered: 'bg-green-900/40 text-green-400',
    cancelled: 'bg-red-900/40 text-red-400',
    returned: 'bg-teal-900/40 text-teal-400',
};

// Statuses that are eligible for cancellation
const cancellableStatuses = ['pending', 'confirmed', 'processing', 'shipped'];

// Statuses that are eligible for return (must be delivered first)
const returnableStatuses = ['delivered'];

const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [cancellingOrderId, setCancellingOrderId] = useState(null);
    const [returnModalOpen, setReturnModalOpen] = useState(null);
    const [returnReason, setReturnReason] = useState('');
    const [returnDescription, setReturnDescription] = useState('');

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

    const handleCancellation = async (orderId) => {
        try {
            // Request cancellation
            await requestOrderCancellation(orderId, 'Customer requested cancellation');

            // Confirm cancellation
            await cancelOrder(orderId);

            // Refresh orders
            const data = await getMyOrders();
            setOrders(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to cancel order.');
        }
    };

    const handleReturnRequest = async (orderId) => {
        try {
            // For now, we'll just open a modal to collect reason
            // In a real implementation, you'd also need to select items
            const data = await getOrderCancellationStatus(orderId);
            setError('Return request created. Check email for next steps.');
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to create return request.');
        }
    };

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
                    <p className="rounded-lg bg-red-950 p-4 text-red-400 mb-4">
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
                        {orders.map(order => {
                            const canCancel = cancellableStatuses.includes(order.orderStatus) && !order.returnRequested;
                            const canReturn = returnableStatuses.includes(order.orderStatus) && !order.returnRequested;

                            return (
                            <article
                                key={order._id}
                                className="rounded-xl border border-gray-800 bg-gray-900 p-5 relative"
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

                                {/* Action buttons */}
                                {canCancel && (
                                    <div className="mt-4 flex gap-3">
                                        <button
                                            onClick={() => handleCancellation(order._id)}
                                            disabled={cancellingOrderId === order._id}
                                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                                        >
                                            {cancellingOrderId === order._id ? 'Cancelling...' : 'Cancel Order'}
                                        </button>
                                    </div>
                                )}

                                {canReturn && (
                                    <div className="mt-4 flex gap-3">
                                        <button
                                            onClick={() => setReturnModalOpen(order._id)}
                                            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
                                        >
                                            Request Return
                                        </button>
                                    </div>
                                )}

                                <Link
                                    to={`/account/orders/${order._id}`}
                                    className="mt-5 inline-block text-sm font-semibold text-blue-400 hover:text-blue-300"
                                >
                                    View Order Details →
                                </Link>
                            </article>
                            );
                        })}
                    </div>
                )}

            </div>
        </main>
    );
};

export default MyOrders;