
import { useEffect, useState } from 'react';

import {
    getBuildRequests,
    getUpgradeRequests,
    updateBuildRequest,
    updateUpgradeRequest,
} from '../../services/adminRequestService';

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

const AdminServiceRequests = () => {
    const [activeTab, setActiveTab] = useState('build');
    const [requests, setRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [status, setStatus] = useState('pending');
    const [adminNotes, setAdminNotes] = useState('');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const loadRequests = async () => {
        setLoading(true);
        setError('');

        try {
            const data = activeTab === 'build'
                ? await getBuildRequests()
                : await getUpgradeRequests();

            setRequests(data);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to load service requests.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setSelectedRequest(null);
        loadRequests();
    }, [activeTab]);

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

            await loadRequests();
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

            {message && (
                <div className="rounded-lg bg-green-100 p-4 text-green-700">
                    {message}
                </div>
            )}

            <section className="rounded-xl bg-white p-5 shadow-sm">
                <h2 className="mb-5 text-xl font-bold">
                    {activeTab === 'build'
                        ? 'Custom PC Build Enquiries'
                        : 'Laptop Upgrade Enquiries'} ({requests.length})
                </h2>

                {loading ? (
                    <p className="text-gray-500">Loading requests...</p>
                ) : requests.length === 0 ? (
                    <p className="text-gray-500">No requests received yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b bg-gray-50 text-gray-600">
                                    <th className="p-3">Customer</th>
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
                                            {request.phone}
                                        </td>

                                        <td className="p-3">
                                            {activeTab === 'build'
                                                ? request.purpose
                                                : `${request.laptopBrand || ''} ${request.laptopModel || ''}`}
                                        </td>

                                        <td className="p-3 capitalize">
                                            {request.status.replaceAll('_', ' ')}
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
                                onChange={(event) => setStatus(event.target.value)}
                                className="w-full rounded-lg border p-3 md:w-96"
                            >
                                {statusOptions[activeTab].map((option) => (
                                    <option key={option} value={option}>
                                        {option.replaceAll('_', ' ')}
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
                                onChange={(event) => setAdminNotes(event.target.value)}
                                rows="5"
                                maxLength={5000}
                                placeholder="Add internal notes about customer contact, compatibility, quotation, etc."
                                className="w-full rounded-lg border p-3"
                            />
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
