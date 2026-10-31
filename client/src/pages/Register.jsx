import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must contain at least 8 characters');
            return;
        }

        setLoading(true);

        try {
            await register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
            });

            navigate('/');
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Registration failed. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4 py-10">
            <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-xl">

                <h1 className="mb-2 text-3xl font-bold text-white">
                    Create Account
                </h1>

                <p className="mb-8 text-gray-400">
                    Join Compunent Rig and explore computer components.
                </p>

                {error && (
                    <div className="mb-5 rounded-lg border border-red-800 bg-red-950/50 p-3 text-sm text-red-400">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">

                    <div>
                        <label className="mb-2 block text-sm text-gray-300">
                            Full Name
                        </label>

                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter your name"
                            required
                            minLength={2}
                            maxLength={50}
                            autoComplete="name"
                            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-gray-300">
                            Email Address
                        </label>

                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            required
                            autoComplete="email"
                            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-gray-300">
                            Password
                        </label>

                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Minimum 8 characters"
                            required
                            minLength={8}
                            maxLength={128}
                            autoComplete="new-password"
                            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm text-gray-300">
                            Confirm Password
                        </label>

                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirm your password"
                            required
                            autoComplete="new-password"
                            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none focus:border-blue-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>

                </form>

                <p className="mt-6 text-center text-sm text-gray-400">
                    Already have an account?{' '}
                    <Link
                        to="/login"
                        className="font-semibold text-blue-400 hover:text-blue-300"
                    >
                        Login
                    </Link>
                </p>

            </div>
        </div>
    );
};

export default Register;