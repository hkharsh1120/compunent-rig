import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders, cancelOrder } from '../services/orderService';

const statusStyles = {
    pending: 'bg-yellow-900/40 text-yellow-400',
    confirmed: 'bg-blue-900/40 text-blue-400',
    processing: 'bg-purple-900/40 text-purple-400',
    shipped: 'bg-indigo-900/40 text-indigo-400',
    delivered: 'bg-green-900/40 text-green-400',
    cancelled: 'bg-red-900/40 text-red-400',
};

// Backend only allows cancellation before an order ships.
const cancellableStatuses = ['pending', 'confirmed', 'processing'];

const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Cancellation modal state
    const [cancelOrderId, setCancelOrderId] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelling, setCancelling] = useState(false);

    const loadOrders = async () => {
        const orderData = await getMyOrders();
        setOrders(orderData);
    };

    useEffect(() => {
        const load = async () => {
            try {
                await loadOrders();
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    'Unable to load your orders.'
                );
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    const openCancelModal = (orderId) => {
        setCancelOrderId(orderId);
        setCancelReason('');
        setError('');
        setSuccess('');
    };

    const handleCancellation = async (event) => {
        event.preventDefault();

        if (!cancelReason.trim()) {
            setError('Please provide a reason for cancelling your order.');
            return;
        }

        setCancelling(true);
        setError('');
        setSuccess('');

        try {
            await cancelOrder(cancelOrderId, cancelReason.trim());

            setSuccess('Your order has been cancelled successfully.');
            setCancelOrderId(null);
            setCancelReason('');

            await loadOrders();
        } catch (err) {
            setError(
                err.response?.data?.message || 'Unable to cancel order.'
            );
        } finally {
            setCancelling(false);
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

                {success && (
                    <p className="rounded-lg bg-green-950 p-4 text-green-400 mb-4">
                        {success}
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
                            const canCancel = cancellableStatuses.includes(order.orderStatus);

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
                                            ₹{Number(order.totalAmount).toLocaleString('en-IN')}
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
                                            onClick={() => openCancelModal(order._id)}
                                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                                        >
                                            Cancel Order
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

                {/* Cancellation Reason Modal */}
                {cancelOrderId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
                        <form
                            onSubmit={handleCancellation}
                            className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-900 p-6 text-white"
                        >
                            <h2 className="text-xl font-semibold">
                                Cancel Order
                            </h2>

                            <p className="mt-2 text-sm text-gray-400">
                                Please tell us why you want to cancel this order.
                            </p>

                            <textarea
                                value={cancelReason}
                                onChange={(event) =>
                                    setCancelReason(event.target.value)
                                }
                                required
                                maxLength={500}
                                rows={4}
                                placeholder="Reason for cancellation..."
                                className="mt-4 w-full rounded-lg border border-gray-700 bg-gray-800 p-3 outline-none focus:border-blue-500"
                            />

                            <div className="mt-5 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setCancelOrderId(null)}
                                    disabled={cancelling}
                                    className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold hover:bg-gray-800 disabled:opacity-50"
                                >
                                    Keep Order
                                </button>

                                <button
                                    type="submit"
                                    disabled={cancelling}
                                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                                >
                                    {cancelling
                                        ? 'Cancelling...'
                                        : 'Confirm Cancellation'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

            </div>
        </main>
    );
};

export default MyOrders;
