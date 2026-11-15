import { useEffect, useState } from 'react';
import {
    getAdminOrders,
    getAdminOrderDetails,
    updateAdminOrderStatus,
} from '../../services/adminOrderService';

const statuses = [
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
];

const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-indigo-100 text-indigo-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
};

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const loadOrders = async () => {
        setLoading(true);
        setError('');

        try {
            const result = await getAdminOrders(
                statusFilter ? { status: statusFilter } : {}
            );

            setOrders(
                Array.isArray(result)
                    ? result
                    : result?.orders || []
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to load orders.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, [statusFilter]);

    const openOrder = async (id) => {
        setError('');
        setMessage('');

        try {
            const order = await getAdminOrderDetails(id);
            setSelectedOrder(order);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to load order details.'
            );
        }
    };

    const handleStatusUpdate = async () => {
        if (!selectedOrder) return;

        setUpdating(true);
        setError('');
        setMessage('');

        try {
            await updateAdminOrderStatus(
                selectedOrder._id,
                selectedOrder.orderStatus
            );

            setMessage('Order status updated successfully.');

            const refreshedOrder = await getAdminOrderDetails(
                selectedOrder._id
            );

            setSelectedOrder(refreshedOrder);
            await loadOrders();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to update order status.'
            );
        } finally {
            setUpdating(false);
        }
    };

    if (loading && orders.length === 0) {
        return <p className="text-gray-600">Loading orders...</p>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">
                    Order Management
                </h1>
                <p className="mt-2 text-gray-600">
                    View customer orders and manage their status.
                </p>
            </div>

            {error && (
                <div className="rounded-lg bg-red-100 p-4 text-red-700">
                    {error}
                </div>
            )}

            {message && (
                <div className="rounded-lg bg-green-100 p-4 text-green-700">
                    {message}
                </div>
            )}

            {/* Orders Table */}
            <section className="rounded-xl bg-white p-5 shadow-sm">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-xl font-bold">
                        Customer Orders ({orders.length})
                    </h2>

                    <select
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                        className="rounded-lg border p-3"
                    >
                        <option value="">All Orders</option>
                        {statuses.map((status) => (
                            <option key={status} value={status}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>

                {loading ? (
                    <p>Loading orders...</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b bg-gray-50 text-gray-600">
                                    <th className="p-3">Order Number</th>
                                    <th className="p-3">Customer</th>
                                    <th className="p-3">Amount</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3">Date</th>
                                    <th className="p-3">Details</th>
                                </tr>
                            </thead>

                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order._id} className="border-b">
                                        <td className="p-3 font-medium">
                                            {order.orderNumber}
                                        </td>

                                        <td className="p-3">
                                            {order.customerDetails?.name}
                                        </td>

                                        <td className="p-3">
                                            ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                                        </td>

                                        <td className="p-3">
                                            <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                                                statusColors[order.orderStatus] ||
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                                {order.orderStatus}
                                            </span>
                                        </td>

                                        <td className="p-3">
                                            {new Date(order.createdAt).toLocaleDateString('en-IN')}
                                        </td>

                                        <td className="p-3">
                                            <button
                                                onClick={() => openOrder(order._id)}
                                                className="font-medium text-blue-600 hover:underline"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {orders.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="p-6 text-center text-gray-500">
                                            No orders found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Order Details Modal/Details */}
            {selectedOrder && (
                <section className="rounded-xl bg-white p-6 shadow-sm">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-bold">
                                Order {selectedOrder.orderNumber}
                            </h2>
                            <p className="text-sm text-gray-500">
                                {new Date(selectedOrder.createdAt).toLocaleString()}
                            </p>
                        </div>

                        <button
                            onClick={() => setSelectedOrder(null)}
                            className="rounded-lg border px-4 py-2"
                        >
                            Close
                        </button>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div>
                            <h3 className="mb-3 font-semibold">
                                Customer Details
                            </h3>

                            <p>{selectedOrder.customerDetails?.name}</p>
                            <p>{selectedOrder.customerDetails?.email}</p>
                            <p>{selectedOrder.customerDetails?.phone}</p>

                            <p className="mt-2 text-sm text-gray-600">
                                {selectedOrder.customerDetails?.address},
                                {' '}{selectedOrder.customerDetails?.city},
                                {' '}{selectedOrder.customerDetails?.state}
                                {' '}{selectedOrder.customerDetails?.pincode}
                            </p>
                        </div>

                        <div>
                            <h3 className="mb-3 font-semibold">
                                Payment Details
                            </h3>

                            <p>
                                Method: {selectedOrder.paymentMethod?.replaceAll('_', ' ')}
                            </p>

                            <p>
                                Payment Status: {selectedOrder.paymentStatus}
                            </p>

                            <p className="mt-2 font-bold">
                                Total: ₹{Number(selectedOrder.totalAmount).toLocaleString('en-IN')}
                            </p>
                        </div>
                    </div>

                    <div className="mt-6">
                        <h3 className="mb-3 font-semibold">Ordered Products</h3>

                        <div className="space-y-3">
                            {selectedOrder.items?.map((item, index) => (
                                <div
                                    key={item.product || item._id || index}
                                    className="flex items-center justify-between gap-4 rounded-lg border p-3"
                                >
                                    <div>
                                        <p className="font-medium">{item.name}</p>
                                        <p className="text-sm text-gray-500">
                                            SKU: {item.sku} · Quantity: {item.quantity}
                                        </p>
                                    </div>

                                    <p className="font-semibold">
                                        ₹{Number(item.subtotal).toLocaleString('en-IN')}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {selectedOrder.notes && (
                        <div className="mt-5">
                            <h3 className="mb-2 font-semibold">Customer Notes</h3>
                            <p className="text-gray-600">{selectedOrder.notes}</p>
                        </div>
                    )}

                    <div className="mt-8 border-t pt-6">
                        <h3 className="mb-3 font-semibold">
                            Update Order Status
                        </h3>

                        <div className="flex flex-wrap gap-3">
                            <select
                                value={selectedOrder.orderStatus}
                                onChange={(event) =>
                                    setSelectedOrder({
                                        ...selectedOrder,
                                        orderStatus: event.target.value,
                                    })
                                }
                                disabled={updating}
                                className="rounded-lg border p-3"
                            >
                                {statuses.map((status) => (
                                    <option key={status} value={status}>
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </option>
                                ))}
                            </select>

                            <button
                                onClick={handleStatusUpdate}
                                disabled={
                                    updating ||
                                    selectedOrder.orderStatus === 'cancelled' ||
                                    selectedOrder.orderStatus === 'delivered'
                                }
                                className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white disabled:opacity-50"
                            >
                                {updating ? 'Updating...' : 'Save Status'}
                            </button>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};

export default AdminOrders;
