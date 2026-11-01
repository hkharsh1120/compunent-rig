
import { useEffect, useState } from 'react';

import {
    getAdminCustomers,
    getAdminCustomerDetails,
    updateCustomerStatus,
} from '../../services/adminCustomerService';

const AdminCustomers = () => {
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({
        total: 0,
        pages: 1,
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const loadCustomers = async () => {
        setLoading(true);
        setError('');

        try {
            const result = await getAdminCustomers({
                search,
                status: statusFilter,
                page,
                limit: 20,
            });

            setCustomers(result.customers || []);
            setPagination({
                total: result.total || 0,
                pages: result.pages || 1,
            });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to load customers.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCustomers();
    }, [search, statusFilter, page]);

    const handleSearch = (event) => {
        event.preventDefault();
        setPage(1);
        setSearch(searchInput.trim());
    };

    const openCustomer = async (id) => {
        setError('');
        setMessage('');

        try {
            const result = await getAdminCustomerDetails(id);
            setSelectedCustomer(result);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to load customer details.'
            );
        }
    };

    const handleStatusChange = async () => {
        if (!selectedCustomer) return;

        const customer = selectedCustomer.customer;
        const nextStatus = !customer.isActive;

        const confirmed = window.confirm(
            `Are you sure you want to ${
                nextStatus ? 'activate' : 'deactivate'
            } ${customer.name}'s account?`
        );

        if (!confirmed) return;

        setError('');
        setMessage('');

        try {
            const updatedCustomer = await updateCustomerStatus(
                customer._id,
                nextStatus
            );

            setSelectedCustomer((previous) => ({
                ...previous,
                customer: updatedCustomer,
            }));

            setMessage(
                `Customer ${nextStatus ? 'activated' : 'deactivated'} successfully.`
            );

            await loadCustomers();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to update customer account.'
            );
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">
                    Customer Management
                </h1>
                <p className="mt-2 text-gray-600">
                    View customer accounts, order history and account status.
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

            <section className="rounded-xl bg-white p-5 shadow-sm">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-xl font-bold">
                        Customers ({pagination.total})
                    </h2>

                    <div className="flex flex-wrap gap-3">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <input
                                value={searchInput}
                                onChange={(event) =>
                                    setSearchInput(event.target.value)
                                }
                                placeholder="Search name, email or phone..."
                                className="min-w-0 rounded-lg border p-3"
                            />

                            <button
                                type="submit"
                                className="rounded-lg bg-blue-600 px-4 py-2 text-white"
                            >
                                Search
                            </button>
                        </form>

                        <select
                            value={statusFilter}
                            onChange={(event) => {
                                setPage(1);
                                setStatusFilter(event.target.value);
                            }}
                            className="rounded-lg border p-3"
                        >
                            <option value="">All Accounts</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <p className="text-gray-500">Loading customers...</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b bg-gray-50 text-gray-600">
                                    <th className="p-3">Customer</th>
                                    <th className="p-3">Email</th>
                                    <th className="p-3">Phone</th>
                                    <th className="p-3">Orders</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3">Joined</th>
                                    <th className="p-3">Details</th>
                                </tr>
                            </thead>

                            <tbody>
                                {customers.map((customer) => (
                                    <tr key={customer._id} className="border-b">
                                        <td className="p-3 font-medium">
                                            {customer.name}
                                        </td>

                                        <td className="p-3">{customer.email}</td>

                                        <td className="p-3">
                                            {customer.phone || '—'}
                                        </td>

                                        <td className="p-3">
                                            {customer.orderCount}
                                        </td>

                                        <td className="p-3">
                                            <span className={
                                                customer.isActive
                                                    ? 'text-green-600'
                                                    : 'text-red-600'
                                            }>
                                                {customer.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>

                                        <td className="p-3">
                                            {new Date(customer.createdAt).toLocaleDateString('en-IN')}
                                        </td>

                                        <td className="p-3">
                                            <button
                                                onClick={() => openCustomer(customer._id)}
                                                className="font-medium text-blue-600 hover:underline"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {customers.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan="7"
                                            className="p-6 text-center text-gray-500"
                                        >
                                            No customers found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="mt-5 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Page {page} of {pagination.pages}
                    </p>

                    <div className="flex gap-2">
                        <button
                            disabled={page <= 1 || loading}
                            onClick={() => setPage((current) => current - 1)}
                            className="rounded-lg border px-4 py-2 disabled:opacity-40"
                        >
                            Previous
                        </button>

                        <button
                            disabled={page >= pagination.pages || loading}
                            onClick={() => setPage((current) => current + 1)}
                            className="rounded-lg border px-4 py-2 disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </section>

            {selectedCustomer && (
                <section className="rounded-xl bg-white p-6 shadow-sm">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-bold">
                                {selectedCustomer.customer.name}
                            </h2>
                            <p className="text-sm text-gray-500">
                                Customer account details
                            </p>
                        </div>

                        <button
                            onClick={() => setSelectedCustomer(null)}
                            className="rounded-lg border px-4 py-2"
                        >
                            Close
                        </button>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                        <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-medium">
                                {selectedCustomer.customer.email}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500">Phone</p>
                            <p className="font-medium">
                                {selectedCustomer.customer.phone || 'Not provided'}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500">Account Status</p>
                            <p className="font-medium">
                                {selectedCustomer.customer.isActive ? 'Active' : 'Inactive'}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500">Joined</p>
                            <p className="font-medium">
                                {new Date(
                                    selectedCustomer.customer.createdAt
                                ).toLocaleDateString('en-IN')}
                            </p>
                        </div>
                    </div>

                    <div className="mt-6">
                        <button
                            onClick={handleStatusChange}
                            className={`rounded-lg px-5 py-3 font-semibold text-white ${
                                selectedCustomer.customer.isActive
                                    ? 'bg-red-600 hover:bg-red-700'
                                    : 'bg-green-600 hover:bg-green-700'
                            }`}
                        >
                            {selectedCustomer.customer.isActive
                                ? 'Deactivate Customer'
                                : 'Activate Customer'}
                        </button>
                    </div>

                    <div className="mt-8 border-t pt-6">
                        <h3 className="mb-4 text-lg font-bold">
                            Recent Orders
                        </h3>

                        {selectedCustomer.orders.length === 0 ? (
                            <p className="text-gray-500">
                                This customer has no orders yet.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b bg-gray-50">
                                            <th className="p-3">Order</th>
                                            <th className="p-3">Items</th>
                                            <th className="p-3">Amount</th>
                                            <th className="p-3">Status</th>
                                            <th className="p-3">Date</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {selectedCustomer.orders.map((order) => (
                                            <tr key={order._id} className="border-b">
                                                <td className="p-3 font-medium">
                                                    {order.orderNumber}
                                                </td>

                                                <td className="p-3">
                                                    {order.items?.length || 0}
                                                </td>

                                                <td className="p-3">
                                                    ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                                                </td>

                                                <td className="p-3 capitalize">
                                                    {order.orderStatus}
                                                </td>

                                                <td className="p-3">
                                                    {new Date(order.createdAt).toLocaleDateString('en-IN')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </section>
            )}
        </div>
    );
};

export default AdminCustomers;
