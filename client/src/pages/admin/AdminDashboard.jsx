import { useEffect, useState } from 'react';
import { getAdminDashboard } from '../../services/adminService';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const data = await getAdminDashboard();
                setStats(data);
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    'Unable to load dashboard statistics.'
                );
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, []);

    if (loading) {
        return <p className="text-gray-600">Loading dashboard...</p>;
    }

    if (error) {
        return <p className="text-red-600">{error}</p>;
    }

    const cards = [
        { title: 'Total Customers', value: stats.totalCustomers },
        { title: 'Active Products', value: stats.totalProducts },
        { title: 'Total Orders', value: stats.totalOrders },
        { title: 'Pending Orders', value: stats.pendingOrders },
        { title: 'PC Build Requests', value: stats.pendingBuildRequests },
        { title: 'Laptop Upgrade Requests', value: stats.pendingUpgradeRequests },
        {
            title: 'Paid Revenue',
            value: `₹${Number(stats.totalRevenue).toLocaleString('en-IN')}`,
        },
    ];

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">
                    Dashboard
                </h1>
                <p className="mt-2 text-gray-600">
                    Welcome to the Compunent Rig administration panel.
                </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {cards.map((card) => (
                    <div
                        key={card.title}
                        className="rounded-xl bg-white p-6 shadow-sm"
                    >
                        <p className="text-sm font-medium text-gray-500">
                            {card.title}
                        </p>
                        <p className="mt-3 text-3xl font-bold text-gray-900">
                            {card.value}
                        </p>
                    </div>
                ))}
            </div>

            <section className="mt-8 rounded-xl bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-xl font-bold text-gray-900">
                    Recent Orders
                </h2>

                {stats.recentOrders.length === 0 ? (
                    <p className="text-gray-500">No orders received yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b text-gray-500">
                                    <th className="p-3">Order Number</th>
                                    <th className="p-3">Customer</th>
                                    <th className="p-3">Amount</th>
                                    <th className="p-3">Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {stats.recentOrders.map((order) => (
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
                                        <td className="p-3 capitalize">
                                            {order.orderStatus}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
};

export default AdminDashboard;