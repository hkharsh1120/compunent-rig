import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getOrderById } from '../services/orderService';

const OrderDetails = () => {
    const { id } = useParams();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        const loadOrder = async () => {
            setLoading(true);
            setError('');

            try {
                const data = await getOrderById(id);

                if (!cancelled) setOrder(data);
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.response?.data?.message ||
                        'Unable to load order details.'
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadOrder();

        return () => {
            cancelled = true;
        };
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 p-10 text-center text-gray-400">
                Loading order...
            </div>
        );
    }

    if (error || !order) {
        return (
            <main className="min-h-screen bg-gray-950 p-10 text-center text-white">
                <h1 className="text-2xl font-bold">
                    {error || 'Order not found'}
                </h1>

                <Link to="/account/orders" className="mt-4 inline-block text-blue-400">
                    Back to My Orders
                </Link>
            </main>
        );
    }

    const statusSteps = [
        'pending',
        'confirmed',
        'processing',
        'shipped',
        'delivered',
    ];

    const currentStep = statusSteps.indexOf(order.orderStatus);

    return (
        <main className="min-h-screen bg-gray-950 px-4 py-10 text-white">
            <div className="mx-auto max-w-4xl">

                <Link
                    to="/account/orders"
                    className="mb-6 inline-block text-sm text-blue-400"
                >
                    ← Back to My Orders
                </Link>

                <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">

                    <div className="flex flex-wrap justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold">
                                Order Details
                            </h1>

                            <p className="mt-2 text-sm text-gray-400">
                                {order.orderNumber}
                            </p>
                        </div>

                        <span className="h-fit rounded-full bg-blue-900/40 px-4 py-2 text-sm capitalize text-blue-400">
                            {order.orderStatus}
                        </span>
                    </div>

                    {order.orderStatus === 'cancelled' ? (
                        <p className="mt-8 rounded-lg bg-red-950/40 p-4 text-red-400">
                            This order has been cancelled.
                        </p>
                    ) : (
                        <div className="mt-8">
                            <h2 className="mb-5 font-semibold">
                                Order Progress
                            </h2>

                            <div className="space-y-4">
                                {statusSteps.map((step, index) => (
                                    <div key={step} className="flex items-center gap-3">
                                        <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                                            currentStep >= index
                                                ? 'bg-green-600 text-white'
                                                : 'bg-gray-700 text-gray-400'
                                        }`}>
                                            {currentStep >= index ? '✓' : index + 1}
                                        </div>

                                        <span className={`capitalize ${
                                            currentStep >= index
                                                ? 'text-white'
                                                : 'text-gray-500'
                                        }`}>
                                            {step}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-10 border-t border-gray-800 pt-6">
                        <h2 className="mb-5 text-xl font-semibold">
                            Ordered Products
                        </h2>

                        <div className="space-y-4">
                            {order.items.map((item, index) => (
                                <div
                                    key={item.product?._id || index}
                                    className="flex items-center justify-between gap-4"
                                >
                                    <div>
                                        <p className="font-medium">
                                            {item.name}
                                        </p>

                                        <p className="text-sm text-gray-400">
                                            {item.sku} × {item.quantity}
                                        </p>
                                    </div>

                                    <p className="whitespace-nowrap font-semibold">
                                        ₹{item.subtotal.toLocaleString('en-IN')}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-8 grid gap-8 border-t border-gray-800 pt-6 sm:grid-cols-2">

                        <div>
                            <h2 className="mb-3 font-semibold">
                                Delivery Details
                            </h2>

                            <p>{order.customerDetails.name}</p>
                            <p className="text-sm text-gray-400">
                                {order.customerDetails.phone}
                            </p>
                            <p className="text-sm text-gray-400">
                                {order.customerDetails.email}
                            </p>
                            <p className="mt-2 text-sm text-gray-400">
                                {order.customerDetails.address},
                                {' '}{order.customerDetails.city},
                                {' '}{order.customerDetails.state}
                                {' '}{order.customerDetails.pincode}
                            </p>
                        </div>

                        <div>
                            <h2 className="mb-3 font-semibold">
                                Payment Summary
                            </h2>

                            <p className="text-sm text-gray-400">
                                Method: {order.paymentMethod.replaceAll('_', ' ')}
                            </p>

                            <p className="text-sm text-gray-400">
                                Payment: {order.paymentStatus}
                            </p>

                            <p className="mt-4 text-xl font-bold">
                                Total: ₹{order.totalAmount.toLocaleString('en-IN')}
                            </p>
                        </div>

                    </div>
                </div>
            </div>
        </main>
    );
};

export default OrderDetails;