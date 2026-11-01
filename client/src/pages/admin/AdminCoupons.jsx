import { useEffect, useState } from 'react';
import {
    getCoupons,
    getCoupon,
    createCoupon,
    updateCoupon,
    deleteCoupon,
} from '../../services/adminCouponService';

const statusColors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
};

const typeColors = {
    percentage: 'bg-blue-100 text-blue-800',
    fixed: 'bg-purple-100 text-purple-800',
};

const statusLabels = {
    active: 'Active',
    inactive: 'Inactive',
};

const typeLabels = {
    percentage: 'Percentage',
    fixed: 'Fixed Amount',
};

const AdminCoupons = () => {
    const [coupons, setCoupons] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    // Modal states
    const [showingForm, setShowingForm] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        code: '',
        type: 'percentage',
        value: '',
        maxDiscount: '',
        minOrderAmount: 0,
        usageLimit: '',
        perCustomerLimit: '',
        startDate: '',
        expiryDate: '',
        description: '',
        isActive: true,
    });

    const loadCoupons = async () => {
        setLoading(true);
        setError('');

        try {
            const filters = {
                page: pagination.page,
                limit: pagination.limit,
                search: search || undefined,
                type: typeFilter === 'all' ? undefined : typeFilter,
                isActive: activeFilter === 'all' ? undefined : activeFilter === 'active',
            };

            const data = await getCoupons(filters);
            setCoupons(data.coupons || []);
            setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to load coupons.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCoupons();
    }, [activeFilter, typeFilter]);

    useEffect(() => {
        if (search) {
            const delay = setTimeout(() => loadCoupons(), 300);
            return () => clearTimeout(delay);
        }
    }, [search]);

    const handleOpenCreateForm = () => {
        setEditingCoupon(null);
        setFormData({
            code: '',
            type: 'percentage',
            value: '',
            maxDiscount: '',
            minOrderAmount: 0,
            usageLimit: '',
            perCustomerLimit: '',
            startDate: '',
            expiryDate: '',
            description: '',
            isActive: true,
        });
        setShowingForm(true);
    };

    const handleOpenEditForm = async (coupon) => {
        setEditingCoupon(coupon);
        setFormData({
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            maxDiscount: coupon.maxDiscount || '',
            minOrderAmount: coupon.minOrderAmount || 0,
            usageLimit: coupon.usageLimit || '',
            perCustomerLimit: coupon.perCustomerLimit || '',
            startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().slice(0, 16) : '',
            expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().slice(0, 16) : '',
            description: coupon.description || '',
            isActive: coupon.isActive,
        });
        setShowingForm(true);
    };

    const handleCloseForm = () => {
        setShowingForm(false);
        setEditingCoupon(null);
        setError('');
        setMessage('');
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        try {
            const submitData = {
                ...formData,
                usageLimit: formData.usageLimit ? parseInt(formData.usageLimit, 10) : null,
                perCustomerLimit: formData.perCustomerLimit ? parseInt(formData.perCustomerLimit, 10) : null,
                minOrderAmount: formData.minOrderAmount ? parseInt(formData.minOrderAmount, 10) : 0,
                maxDiscount: formData.maxDiscount ? parseInt(formData.maxDiscount, 10) : undefined,
            };

            if (editingCoupon) {
                await updateCoupon(editingCoupon._id, submitData);
                setMessage('Coupon updated successfully.');
            } else {
                await createCoupon(submitData);
                setMessage('Coupon created successfully.');
            }

            handleCloseForm();
            loadCoupons();
        } catch (err) {
            setError(err.response?.data?.errors?.[0]?.message || err.response?.data?.message || 'Unable to save coupon.');
        }
    };

    const handleToggleStatus = async (coupon) => {
        try {
            await updateCoupon(coupon._id, { isActive: !coupon.isActive });
            setMessage(`Coupon ${coupon.isActive ? 'deactivated' : 'activated'} successfully.`);
            loadCoupons();
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to update coupon status.');
        }
    };

    const handleDelete = async (coupon) => {
        if (!confirm(`Are you sure you want to deactivate coupon "${coupon.code}"?`)) return;

        try {
            await deleteCoupon(coupon._id);
            setMessage('Coupon deactivated successfully.');
            loadCoupons();
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to delete coupon.');
        }
    };

    const determineExpiryStatus = (coupon) => {
        if (!coupon.expiryDate) return 'active';
        if (new Date(coupon.expiryDate) < new Date()) return 'expired';
        return 'active';
    };

    if (loading && coupons.length === 0) {
        return (
            <div className="space-y-8">
                <h1 className="text-3xl font-bold text-gray-900">Coupon Management</h1>
                <p className="text-gray-600">Loading coupons...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Coupon Management</h1>
                    <p className="mt-2 text-gray-600">Create, edit, and manage promotional coupons.</p>
                </div>
                <button
                    onClick={handleOpenCreateForm}
                    className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                >
                    Create Coupon
                </button>
            </div>

            {error && (
                <div className="rounded-lg bg-red-100 p-4 text-red-700">{error}</div>
            )}

            {message && (
                <div className="rounded-lg bg-green-100 p-4 text-green-700">{message}</div>
            )}

            {/* Filters */}
            <div className="rounded-xl bg-white p-5 shadow-sm">
                <div className="flex flex-wrap gap-4">
                    <input
                        type="text"
                        placeholder="Search by code..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="rounded-lg border p-3 w-64"
                    />
                    <select
                        value={activeFilter}
                        onChange={(e) => setActiveFilter(e.target.value)}
                        className="rounded-lg border p-3"
                    >
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="rounded-lg border p-3"
                    >
                        <option value="all">All Types</option>
                        <option value="percentage">Percentage</option>
                        <option value="fixed">Fixed Amount</option>
                    </select>
                </div>
            </div>

            {/* Coupons Table */}
            <div className="rounded-xl bg-white p-5 shadow-sm">
                <h2 className="mb-5 text-xl font-bold">Coupons ({coupons.length})</h2>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b bg-gray-50 text-gray-600">
                                <th className="p-3">Code</th>
                                <th className="p-3">Type</th>
                                <th className="p-3">Value</th>
                                <th className="p-3">Discount</th>
                                <th className="p-3">Usage</th>
                                <th className="p-3">Dates</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {coupons.map((coupon) => {
                                const expired = determineExpiryStatus(coupon) === 'expired';
                                return (
                                    <tr key={coupon._id} className="border-b">
                                        <td className="p-3 font-mono text-sm font-medium">{coupon.code}</td>
                                        <td className="p-3">
                                            <span className={`rounded-full px-3 py-1 text-xs font-medium ${typeColors[coupon.type] || 'bg-gray-100 text-gray-700'}`}>
                                                {typeLabels[coupon.type] || coupon.type}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            {coupon.type === 'percentage' ? `${coupon.value}%` : `₹${coupon.value}`}
                                            {coupon.maxDiscount && coupon.type === 'percentage' && (
                                                <span className="block text-xs text-gray-500">
                                                    (max: {coupon.maxDiscount})
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            {coupon.type === 'percentage' ? (
                                                <span className="text-sm">
                                                    ₹{coupon.value <= 100 ? 'N/A' : coupon.maxDiscount || 'N/A'}
                                                </span>
                                            ) : (
                                                <span className="text-sm">₹{coupon.value}</span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            <span className="text-sm">
                                                {coupon.usageCount || 0} / {coupon.usageLimit || '∞'}
                                            </span>
                                            {coupon.perCustomerLimit && (
                                                <span className="block text-xs text-gray-500">
                                                    Per customer: {coupon.perCustomerLimit}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            <span className="text-sm">
                                                {coupon.startDate ? new Date(coupon.startDate).toLocaleDateString() : 'No start'}
                                            </span>
                                            <span className="block text-xs text-gray-500">
                                                → {coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString() : 'No expiry'}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                                                expired || !coupon.isActive ? 'bg-gray-100 text-gray-700' : 'bg-green-100 text-green-800'
                                            }`}>
                                                {expired ? 'Expired' : statusLabels[coupon.isActive ? 'active' : 'inactive']}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => handleOpenEditForm(coupon)}
                                                    className="text-blue-600 hover:underline text-sm"
                                                >
                                                    Edit
                                                </button>
                                                {(!expired && coupon.isActive) && (
                                                    <button
                                                        onClick={() => handleToggleStatus(coupon)}
                                                        className="text-orange-600 hover:underline text-sm"
                                                    >
                                                        Deactivate
                                                    </button>
                                                )}
                                                {(expired || !coupon.isActive) && (
                                                    <button
                                                        onClick={() => handleToggleStatus(coupon)}
                                                        className="text-green-600 hover:underline text-sm"
                                                    >
                                                        Activate
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(coupon)}
                                                    className="text-red-600 hover:underline text-sm"
                                                    disabled={expired}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {coupons.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="p-6 text-center text-gray-500">
                                        No coupons found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="mt-6 flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                            Page {pagination.page} of {pagination.totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
                                disabled={pagination.page <= 1}
                                className="rounded-lg border px-4 py-2 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPagination(p => ({ ...p, page: Math.min(pagination.totalPages, p.page + 1) }))}
                                disabled={pagination.page >= pagination.totalPages}
                                className="rounded-lg border px-4 py-2 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit Form Modal */}
            {showingForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="rounded-xl bg-white w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between border-b p-4">
                            <h2 className="text-xl font-bold">
                                {editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
                            </h2>
                            <button
                                onClick={handleCloseForm}
                                className="rounded-lg border p-2 hover:bg-gray-100"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
                            <div className="space-y-4">
                                {/* Code */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium">Coupon Code *</label>
                                    <input
                                        type="text"
                                        name="code"
                                        value={formData.code}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border p-3"
                                        placeholder="SAVE10"
                                        required
                                        disabled={!!editingCoupon}
                                    />
                                </div>

                                {/* Type */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium">Discount Type *</label>
                                    <select
                                        name="type"
                                        value={formData.type}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border p-3"
                                    >
                                        <option value="percentage">Percentage</option>
                                        <option value="fixed">Fixed Amount</option>
                                    </select>
                                </div>

                                {/* Value */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium">
                                        {formData.type === 'percentage' ? 'Percentage' : 'Amount'} *
                                    </label>
                                    <input
                                        type="number"
                                        name="value"
                                        value={formData.value}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border p-3"
                                        min="0.01"
                                        step="0.01"
                                        required
                                    />
                                    {formData.type === 'percentage' && (
                                        <p className="mt-1 text-xs text-gray-500">Must be between 0.01% and 100%</p>
                                    )}
                                </div>

                                {/* Max Discount */}
                                {formData.type === 'percentage' && (
                                    <div>
                                        <label className="mb-2 block text-sm font-medium">Maximum Discount</label>
                                        <input
                                            type="number"
                                            name="maxDiscount"
                                            value={formData.maxDiscount}
                                            onChange={handleChange}
                                            className="w-full rounded-lg border p-3"
                                            min="0.01"
                                            step="0.01"
                                            placeholder="e.g., 500"
                                        />
                                    </div>
                                )}

                                {/* Min Order Amount */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium">Minimum Order Amount</label>
                                    <input
                                        type="number"
                                        name="minOrderAmount"
                                        value={formData.minOrderAmount}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border p-3"
                                        min="0"
                                        step="1"
                                    />
                                </div>

                                {/* Usage Limits */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium">Global Usage Limit</label>
                                        <input
                                            type="number"
                                            name="usageLimit"
                                            value={formData.usageLimit}
                                            onChange={handleChange}
                                            className="w-full rounded-lg border p-3"
                                            min="1"
                                            step="1"
                                            placeholder="Leave empty for unlimited"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium">Per Customer Limit</label>
                                        <input
                                            type="number"
                                            name="perCustomerLimit"
                                            value={formData.perCustomerLimit}
                                            onChange={handleChange}
                                            className="w-full rounded-lg border p-3"
                                            min="1"
                                            step="1"
                                            placeholder="Leave empty for no limit"
                                        />
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium">Start Date</label>
                                        <input
                                            type="datetime-local"
                                            name="startDate"
                                            value={formData.startDate}
                                            onChange={handleChange}
                                            className="w-full rounded-lg border p-3"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium">Expiry Date</label>
                                        <input
                                            type="datetime-local"
                                            name="expiryDate"
                                            value={formData.expiryDate}
                                            onChange={handleChange}
                                            className="w-full rounded-lg border p-3"
                                        />
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium">Description</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border p-3"
                                        rows="2"
                                        placeholder="Internal notes..."
                                        maxLength="500"
                                    />
                                </div>

                                {/* Active Checkbox */}
                                <div>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            name="isActive"
                                            checked={formData.isActive}
                                            onChange={handleChange}
                                            className="rounded border-gray-300"
                                        />
                                        <span className="text-sm font-medium">Active</span>
                                    </label>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseForm}
                                    className="rounded-lg border px-4 py-2"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700"
                                >
                                    {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCoupons;