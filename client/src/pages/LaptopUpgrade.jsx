
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { submitLaptopUpgradeRequest } from '../services/serviceRequestService';
import { useAuth } from '../context/AuthContext';

const LaptopUpgrade = () => {
    const { user, isAuthenticated } = useAuth();

    const [form, setForm] = useState({
        phone: user?.phone || '',
        laptopBrand: '',
        laptopModel: '',
        upgradeType: '',
        currentSpecifications: '',
        requirements: '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (event) => {
        setForm({
            ...form,
            [event.target.name]: event.target.value,
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await submitLaptopUpgradeRequest(form);

            setSuccess(
                'Your laptop upgrade request has been submitted. Our team will check compatibility and contact you.'
            );

            setForm({
                phone: user?.phone || '',
                laptopBrand: '',
                laptopModel: '',
                upgradeType: '',
                currentSpecifications: '',
                requirements: '',
            });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to submit your request. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="mx-auto max-w-xl px-4 py-20 text-center">
                <h1 className="text-3xl font-bold">Laptop Upgrade Service</h1>
                <p className="my-4 text-gray-600">
                    Please log in to submit your upgrade request.
                </p>
                <Link
                    to="/login"
                    className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-white"
                >
                    Login
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-12">
            <div className="mx-auto max-w-3xl">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">
                        Laptop RAM & Storage Upgrade
                    </h1>
                    <p className="mt-3 text-gray-600">
                        Share your laptop details. We'll check compatibility
                        before recommending an upgrade.
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-5 rounded-2xl bg-white p-6 shadow-sm md:p-8"
                >
                    {error && (
                        <div className="rounded-lg bg-red-100 p-4 text-red-700">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="rounded-lg bg-green-100 p-4 text-green-700">
                            {success}
                        </div>
                    )}

                    <div>
                        <label className="mb-2 block font-medium">
                            Your Phone Number
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            required
                            className="w-full rounded-lg border p-3"
                            placeholder="Enter your phone number"
                        />
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block font-medium">
                                Laptop Brand
                            </label>
                            <select
                                name="laptopBrand"
                                value={form.laptopBrand}
                                onChange={handleChange}
                                required
                                className="w-full rounded-lg border p-3"
                            >
                                <option value="">Select brand</option>
                                <option value="Dell">Dell</option>
                                <option value="HP">HP</option>
                                <option value="Lenovo">Lenovo</option>
                                <option value="ASUS">ASUS</option>
                                <option value="Acer">Acer</option>
                                <option value="Apple">Apple</option>
                                <option value="MSI">MSI</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block font-medium">
                                Laptop Model
                            </label>
                            <input
                                name="laptopModel"
                                value={form.laptopModel}
                                onChange={handleChange}
                                required
                                placeholder="e.g. Dell Inspiron 15 3520"
                                className="w-full rounded-lg border p-3"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block font-medium">
                            Upgrade Type
                        </label>
                        <select
                            name="upgradeType"
                            value={form.upgradeType}
                            onChange={handleChange}
                            required
                            className="w-full rounded-lg border p-3"
                        >
                            <option value="">Select upgrade</option>
                            <option value="ram">RAM Upgrade</option>
                            <option value="storage">Storage Upgrade</option>
                            <option value="both">RAM + Storage Upgrade</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block font-medium">
                            Current Specifications
                        </label>
                        <textarea
                            name="currentSpecifications"
                            value={form.currentSpecifications}
                            onChange={handleChange}
                            required
                            rows="3"
                            maxLength={1000}
                            placeholder="Current RAM, storage, processor, and other specifications..."
                            className="w-full rounded-lg border p-3"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block font-medium">
                            Upgrade Requirements
                        </label>
                        <textarea
                            name="requirements"
                            value={form.requirements}
                            onChange={handleChange}
                            required
                            minLength={10}
                            maxLength={2000}
                            rows="5"
                            placeholder="Describe your desired RAM or storage capacity and any other requirements..."
                            className="w-full rounded-lg border p-3"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Submitting...' : 'Submit Upgrade Request'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LaptopUpgrade;
