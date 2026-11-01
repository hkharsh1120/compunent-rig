import { useEffect, useState, useCallback } from 'react';
import {
    getBuildRequests,
    getUpgradeRequests,
    getStatusOptions,
    updateBuildRequest,
    updateUpgradeRequest,
} from '../../services/adminRequestService';

// Status options per request type
const statusOptions = {
    build: [
        'pending',
        'contacted',
        'quoted',
        'approved',
        'completed',
        'cancelled',
    ],
    upgrade: [
        'pending',
        'contacted',
        'compatibility_check',
        'quoted',
        'approved',
        'completed',
        'cancelled',
    ],
};

// Debounce hook
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    const [isDebouncing, setIsDebouncing] = useState(false);

    useEffect(() => {
        setIsDebouncing(true);
        const handler = setTimeout(() => {
            setDebouncedValue(value);
            setIsDebouncing(false);
        }, delay);

        return () => clearTimeout(handler);
    }, [value, delay]);

    return { debouncedValue, isDebouncing };
};

const AdminServiceRequests = () => {
    const [activeTab, setActiveTab] = useState('build');
    const [requests, setRequests] = useState([]);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
    });

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const [selectedRequest, setSelectedRequest] = useState(null);
    const [status, setStatus] = useState('pending');
    const [adminNotes, setAdminNotes] = useState('');

    const [availableStatuses, setAvailableStatuses] = useState([]);

    const [loading, setLoading] = useState(true);
    const [loadingStatuses, setLoadingStatuses] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    // Debounce search input to avoid excessive API calls
    const { debouncedValue: debouncedSearch } = useDebounce(search, 300);

    // Current page is stored in pagination state
    const currentPage = pagination.page || 1;
    const currentLimit = pagination.limit || 20;
    const totalRequests = pagination.total || 0;
    const totalPages = pagination.totalPages || 1;

    const loadStatuses = useCallback(async () => {
        setLoadingStatuses(true);
        try {
            const statuses = await getStatusOptions(activeTab);
            setAvailableStatuses(statuses);
        } catch (err) {
            // Silently fail, use default status options
        } finally {
            setLoadingStatuses(false);
        }
    }, [activeTab]);

    // Extract params based on current filter state
    const buildParams = useCallback(() => {
        const params = {
            page: currentPage,
            limit: currentLimit,
        };

        if (debouncedSearch) {
            params.search = debouncedSearch;
        }

        if (statusFilter) {
            params.status = statusFilter;
        }

        if (dateFrom) {
            params.dateFrom = dateFrom;
        }

        if (dateTo) {
            params.dateTo = dateTo;
        }

        return params;
    }, [currentPage, currentLimit, debouncedSearch, statusFilter, dateFrom, dateTo]);

    const loadRequests = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const params = buildParams();

            const data = activeTab === 'build'
                ? await getBuildRequests(params)
                : await getUpgradeRequests(params);

            // The service returns response.data.data which contains {requests, pagination}
            const responseData = data;
            setRequests(responseData.requests || []);
            setPagination({
                page: responseData.pagination?.page || 1,
                limit: responseData.pagination?.limit || 20,
                total: responseData.pagination?.total || 0,
                totalPages: responseData.pagination?.totalPages || 1,
            });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to load service requests.'
            );
        } finally {
            setLoading(false);
        }
    }, [buildParams, activeTab]);

    // Load statuses when tab changes
    useEffect(() => {
        loadStatuses();
    }, [activeTab, loadStatuses]);

    // Reset to first page when filters change
    useEffect(() => {
        if (debouncedSearch || statusFilter || dateFrom || dateTo) {
            setPagination(prev => ({ ...prev, page: 1 }));
        }
    }, [debouncedSearch, statusFilter, dateFrom, dateTo]);

    // Load requests when page or tab changes
    useEffect(() => {
        loadRequests();
    }, [loadRequests, activeTab]);

    // Load requests when page changes (separate effect to handle pagination)
    useEffect(() => {
        // Page changes trigger loadRequests via buildParams dependency
    }, [currentPage]);

    const goToPage = (page) => {
        if (page < 1 || page > totalPages || page === currentPage) return;
        setPagination(prev => ({ ...prev, page }));
    };

    const selectRequest = (request) => {
        setSelectedRequest(request);
        setStatus(request.status);
        setAdminNotes(request.adminNotes || '');
        setError('');
        setMessage('');
    };

    const handleSave = async () => {
        if (!selectedRequest) return;

        setSaving(true);
        setError('');
        setMessage('');

        try {
            const data = {
                status,
                adminNotes,
            };

            if (activeTab === 'build') {
                await updateBuildRequest(selectedRequest._id, data);
            } else {
                await updateUpgradeRequest(selectedRequest._id, data);
            }

            setMessage('Service request updated successfully.');
            setSelectedRequest(null);

            // Refresh list after update
            loadRequests();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to update service request.'
            );
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (date) =>
        new Date(date).toLocaleString('en-IN');

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('');
        setDateFrom('');
        setDateTo('');
    };

    const customerFields = activeTab === 'build'
        ? [
            ['Budget', 'budget'],
            ['Purpose', 'purpose'],
            ['Requirements', 'requirements'],
        ]
        : [
            ['Laptop Brand', 'laptopBrand'],
            ['Laptop Model', 'laptopModel'],
            ['Upgrade Type', 'upgradeType'],
            ['Current Specifications', 'currentSpecifications'],
            ['Requirements', 'requirements'],
        ];

    // Get status label with proper formatting
    const getStatusLabel = (status) => {
        return status.replaceAll('_', ' ');
    };

    // Get the current status options for the active tab
    const currentStatusOptions = statusOptions[activeTab] || [];

    // Calculate total pages for pagination display
    const displayedTotalPages = Math.ceil(totalRequests / currentLimit);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">
                    Service Requests
                </h1>
                <p className="mt-2 text-gray-600">
                    Manage custom PC builds and laptop upgrades.
                </p>
            </div>

            {/* Search and Filters */}
            <div className="rounded-xl bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center gap-4">
                    <input
                        type="text"
                        placeholder="Search by name, email, or enquiry ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="rounded-lg border p-3 w-72"
                    />

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="rounded-lg border p-3"
                    >
                        <option value="">All Statuses</option>
                        {currentStatusOptions.map((s) => (
                            <option key={s} value={s}>
                                {getStatusLabel(s)}
                            </option>
                        ))}
                    </select>

                    <div className="flex flex-wrap items-center gap-3">
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="rounded-lg border p-3"
                            title="From Date"
                        />
                        <span className="self-center text-gray-500">to</span>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="rounded-lg border p-3"
                            title="To Date"
                        />
                    </div>

                    {(search || statusFilter || dateFrom || dateTo) && (
                        <button
                            onClick={clearFilters}
                            className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>

                {/* Result Summary */}
                {!loading && (
                    <div className="text-sm text-gray-600">
                        Showing {requests.length} of {totalRequests} request{totalRequests !== 1 ? 's' : ''}
                    </div>
                )}
            </div>

            <div className="flex flex-wrap gap-3">
                <button
                    onClick={() => setActiveTab('build')}
                    className={`rounded-lg px-5 py-3 font-medium ${
                        activeTab === 'build'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700'
                    }`}
                >
                    PC Build Requests
                </button>

                <button
                    onClick={() => setActiveTab('upgrade')}
                    className={`rounded-lg px-5 py-3 font-medium ${
                        activeTab === 'upgrade'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700'
                    }`}
                >
                    Laptop Upgrade Requests
                </button>
            </div>

            {error && (
                <div className="rounded-lg bg-red-100 p-4 text-red-700">
                    {error}
                </div>
            )}

            <section className="rounded-xl bg-white p-5 shadow-sm">
                <h2 className="mb-5 text-xl font-bold">
                    {activeTab === 'build'
                        ? 'Custom PC Build Enquiries'
                        : 'Laptop Upgrade Enquiries'}
                </h2>

                {loading ? (
                    <p className="text-gray-500">Loading requests...</p>
                ) : (
                    <>
                        {requests.length === 0 ? (
                            <p className="text-gray-500">No requests found.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b bg-gray-50 text-gray-600">
                                            <th className="p-3">Customer</th>
                                            <th className="p-3">Email</th>
                                            <th className="p-3">Phone</th>
                                            <th className="p-3">Request</th>
                                            <th className="p-3">Status</th>
                                            <th className="p-3">Date</th>
                                            <th className="p-3">Action</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {requests.map((request) => (
                                            <tr key={request._id} className="border-b">
                                                <td className="p-3 font-medium">
                                                    {request.customerName}
                                                </td>

                                                <td className="p-3">
                                                    {request.email}
                                                </td>

                                                <td className="p-3">
                                                    {request.phone}
                                                </td>

                                                <td className="p-3">
                                                    {activeTab === 'build'
                                                        ? request.purpose
                                                        : `${request.laptopBrand || ''} ${request.laptopModel || ''}`}
                                                </td>

                                                <td className="p-3 capitalize">
                                                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                                                        request.status === 'pending'
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : request.status === 'completed'
                                                                ? 'bg-green-100 text-green-800'
                                                                : request.status === 'cancelled'
                                                                    ? 'bg-red-100 text-red-800'
                                                                    : 'bg-blue-100 text-blue-800'
                                                        }`}>
                                                        {getStatusLabel(request.status)}
                                                    </span>
                                                </td>

                                                <td className="p-3">
                                                    {formatDate(request.createdAt)}
                                                </td>

                                                <td className="p-3">
                                                    <button
                                                        onClick={() => selectRequest(request)}
                                                        className="font-medium text-blue-600 hover:underline"
                                                    >
                                                        Manage
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="mt-6 flex items-center justify-between">
                                <button
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage === 1 || loading}
                                    className="rounded-lg border px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>

                                <span className="text-sm text-gray-600">
                                    Page {currentPage} of {totalPages}
                                </span>

                                <button
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={currentPage === totalPages || loading}
                                    className="rounded-lg border px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </section>

            {selectedRequest && (
                <section className="rounded-xl bg-white p-6 shadow-sm">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-xl font-bold">
                            Request Details
                        </h2>

                        <button
                            onClick={() => setSelectedRequest(null)}
                            className="rounded-lg border px-4 py-2"
                        >
                            Close
                        </button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <p className="text-sm text-gray-500">Customer Name</p>
                            <p className="font-medium">
                                {selectedRequest.customerName}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-medium">
                                {selectedRequest.email}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500">Phone</p>
                            <p className="font-medium">
                                {selectedRequest.phone}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500">Submitted</p>
                            <p className="font-medium">
                                {formatDate(selectedRequest.createdAt)}
                            </p>
                        </div>

                        {selectedRequest.updatedAt && selectedRequest.updatedAt !== selectedRequest.createdAt && (
                            <div>
                                <p className="text-sm text-gray-500">Updated</p>
                                <p className="font-medium text-gray-600">
                                    {formatDate(selectedRequest.updatedAt)}
                                </p>
                            </div>
                        )}

                        {customerFields.map(([label, field]) => (
                            <div key={field} className="md:col-span-2">
                                <p className="text-sm text-gray-500">{label}</p>
                                <p className="whitespace-pre-wrap font-medium">
                                    {selectedRequest[field] || 'Not provided'}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 space-y-4 border-t pt-6">
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Request Status
                            </label>

                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full rounded-lg border p-3"
                            >
                                {currentStatusOptions.map((option) => (
                                    <option key={option} value={option}>
                                        {getStatusLabel(option)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Internal Admin Notes
                            </label>

                            <textarea
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                rows="5"
                                maxLength={5000}
                                placeholder="Add internal notes about customer contact, compatibility, quotation, etc."
                                className="w-full rounded-lg border p-3"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                {adminNotes.length}/5000 characters
                            </p>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Request'}
                        </button>
                    </div>
                </section>
            )}
        </div>
    );
};

export default AdminServiceRequests;