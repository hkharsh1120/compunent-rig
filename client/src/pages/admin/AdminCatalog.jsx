
import { useEffect, useState } from 'react';
import {
    getAdminCategories,
    createCategory,
    updateCategory,
    deactivateCategory,
    getAdminBrands,
    createBrand,
    updateBrand,
    deactivateBrand,
} from '../../services/adminCatalogService';

const initialForm = {
    name: '',
    description: '',
    sortOrder: 0,
};

const AdminCatalog = () => {
    const [activeTab, setActiveTab] = useState('categories');
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [form, setForm] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const isCategory = activeTab === 'categories';
    const items = isCategory ? categories : brands;

    const loadData = async () => {
        setLoading(true);
        setError('');

        try {
            const [categoryResult, brandResult] = await Promise.all([
                getAdminCategories(),
                getAdminBrands(),
            ]);

            setCategories(
                Array.isArray(categoryResult)
                    ? categoryResult
                    : categoryResult?.categories || []
            );

            setBrands(
                Array.isArray(brandResult)
                    ? brandResult
                    : brandResult?.brands || []
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to load categories and brands.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const resetForm = () => {
        setForm(initialForm);
        setEditingId(null);
    };

    const handleEdit = (item) => {
        setEditingId(item._id);

        setForm({
            name: item.name || '',
            description: item.description || '',
            sortOrder: item.sortOrder ?? 0,
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError('');
        setMessage('');

        try {
            const data = {
                name: form.name.trim(),
                description: form.description.trim(),
            };

            if (isCategory) {
                data.sortOrder = Number(form.sortOrder);
            }

            if (editingId) {
                if (isCategory) {
                    await updateCategory(editingId, data);
                } else {
                    await updateBrand(editingId, data);
                }
            } else {
                if (isCategory) {
                    await createCategory(data);
                } else {
                    await createBrand(data);
                }
            }

            setMessage(
                `${isCategory ? 'Category' : 'Brand'} ${
                    editingId ? 'updated' : 'created'
                } successfully.`
            );

            resetForm();
            await loadData();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                `Unable to save ${isCategory ? 'category' : 'brand'}.`
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDeactivate = async (id) => {
        if (!window.confirm(`Deactivate this ${isCategory ? 'category' : 'brand'}?`)) {
            return;
        }

        setError('');
        setMessage('');

        try {
            if (isCategory) {
                await deactivateCategory(id);
            } else {
                await deactivateBrand(id);
            }

            setMessage(
                `${isCategory ? 'Category' : 'Brand'} deactivated successfully.`
            );

            await loadData();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to deactivate this item.'
            );
        }
    };

    const switchTab = (tab) => {
        setActiveTab(tab);
        resetForm();
        setError('');
        setMessage('');
    };

    if (loading) {
        return <p className="text-gray-600">Loading catalogue...</p>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">
                    Category & Brand Management
                </h1>
                <p className="mt-2 text-gray-600">
                    Organize your product catalogue.
                </p>
            </div>

            <div className="flex gap-3">
                <button
                    onClick={() => switchTab('categories')}
                    className={`rounded-lg px-5 py-3 font-medium ${
                        isCategory
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700'
                    }`}
                >
                    Categories
                </button>

                <button
                    onClick={() => switchTab('brands')}
                    className={`rounded-lg px-5 py-3 font-medium ${
                        !isCategory
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700'
                    }`}
                >
                    Brands
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

            <section className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-xl font-bold">
                    {editingId ? 'Edit' : 'Add'} {isCategory ? 'Category' : 'Brand'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Name
                        </label>

                        <input
                            name="name"
                            value={form.name}
                            onChange={(event) =>
                                setForm({
                                    ...form,
                                    name: event.target.value,
                                })
                            }
                            required
                            className="w-full rounded-lg border p-3"
                            placeholder={isCategory ? 'Graphics Cards' : 'NVIDIA'}
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Description
                        </label>

                        <textarea
                            value={form.description}
                            onChange={(event) =>
                                setForm({
                                    ...form,
                                    description: event.target.value,
                                })
                            }
                            rows="3"
                            className="w-full rounded-lg border p-3"
                            placeholder="Enter a short description..."
                        />
                    </div>

                    {isCategory && (
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Sort Order
                            </label>

                            <input
                                type="number"
                                min="0"
                                value={form.sortOrder}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        sortOrder: event.target.value,
                                    })
                                }
                                className="w-full rounded-lg border p-3"
                            />
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white disabled:opacity-50"
                        >
                            {saving
                                ? 'Saving...'
                                : editingId
                                    ? 'Update'
                                    : 'Create'}
                        </button>

                        {editingId && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="rounded-lg border px-6 py-3"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </section>

            <section className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-xl font-bold">
                    All {isCategory ? 'Categories' : 'Brands'} ({items.length})
                </h2>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b bg-gray-50 text-gray-600">
                                <th className="p-3">Name</th>
                                <th className="p-3">Slug</th>
                                {isCategory && (
                                    <th className="p-3">Sort Order</th>
                                )}
                                <th className="p-3">Status</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {items.map((item) => (
                                <tr key={item._id} className="border-b">
                                    <td className="p-3 font-medium">
                                        {item.name}
                                    </td>

                                    <td className="p-3 text-gray-500">
                                        {item.slug}
                                    </td>

                                    {isCategory && (
                                        <td className="p-3">
                                            {item.sortOrder ?? 0}
                                        </td>
                                    )}

                                    <td className="p-3">
                                        <span
                                            className={
                                                item.isActive
                                                    ? 'text-green-600'
                                                    : 'text-red-600'
                                            }
                                        >
                                            {item.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>

                                    <td className="p-3">
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="text-blue-600 hover:underline"
                                            >
                                                Edit
                                            </button>

                                            {item.isActive && (
                                                <button
                                                    onClick={() => handleDeactivate(item._id)}
                                                    className="text-red-600 hover:underline"
                                                >
                                                    Deactivate
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {items.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={isCategory ? 5 : 4}
                                        className="p-6 text-center text-gray-500"
                                    >
                                        No {isCategory ? 'categories' : 'brands'} found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default AdminCatalog;
