import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrder } from '../services/orderService';

const Checkout = () => {
    const { user } = useAuth();
    const { cartItems, cartTotal, clearCart } = useCart();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: '',
        address: '',
        city: '',
        state: 'Gujarat',
        pincode: '',
        paymentMethod: 'offline',
        notes: '',
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData(current => ({
            ...current,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (cartItems.length === 0) {
            setError('Your shopping cart is empty.');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const orderData = {
                items: cartItems.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                })),

                customerDetails: {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    address: formData.address,
                    city: formData.city,
                    state: formData.state,
                    pincode: formData.pincode,
                },

                paymentMethod: formData.paymentMethod,
                notes: formData.notes,
            };

            const order = await createOrder(orderData);

            clearCart();

            navigate('/order-success', {
                replace: true,
                state: { order },
            });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to place your order. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    if (cartItems.length === 0) {
        return (
            <main className="min-h-screen bg-gray-950 p-10 text-center text-white">
                <h1 className="text-2xl font-bold">Your cart is empty</h1>
                <Link to="/products" className="mt-4 inline-block text-blue-400">
                    Browse Products
                </Link>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-950 px-4 py-10 text-white">
            <div className="mx-auto max-w-6xl">

                <h1 className="mb-8 text-3xl font-bold">Checkout</h1>

                {error && (
                    <div className="mb-6 rounded-lg border border-red-800 bg-red-950 p-4 text-red-300">
                        {error}
                    </div>
                )}

                <div className="grid gap-8 lg:grid-cols-3">

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-5 rounded-xl border border-gray-800 bg-gray-900 p-6 lg:col-span-2"
                    >
                        <h2 className="text-xl font-semibold">
                            Delivery Information
                        </h2>

                        {[
                            { name: 'name', label: 'Full Name', maxLength: 50 },
                            { name: 'email', label: 'Email', type: 'email' },
                            { name: 'phone', label: 'Phone Number', type: 'tel', maxLength: 15 },
                            { name: 'address', label: 'Full Address', maxLength: 300 },
                            { name: 'city', label: 'City', maxLength: 80 },
                            { name: 'state', label: 'State', maxLength: 80 },
                            { name: 'pincode', label: 'PIN Code', maxLength: 6 },
                        ].map(field => (
                            <div key={field.name}>
                                <label className="mb-2 block text-sm text-gray-300">
                                    {field.label}
                                </label>

                                <input
                                    name={field.name}
                                    type={field.type || 'text'}
                                    value={formData[field.name]}
                                    onChange={handleChange}
                                    required
                                    maxLength={field.maxLength}
                                    autoComplete={
                                        field.name === 'name' ? 'name' :
                                        field.name === 'email' ? 'email' :
                                        field.name === 'phone' ? 'tel' :
                                        field.name === 'address' ? 'street-address' :
                                        'off'
                                    }
                                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 outline-none focus:border-blue-500"
                                />
                            </div>
                        ))}

                        <div>
                            <label className="mb-2 block text-sm text-gray-300">
                                Payment Method
                            </label>

                            <select
                                name="paymentMethod"
                                value={formData.paymentMethod}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3"
                            >
                                <option value="offline">Pay Offline</option>
                                <option value="cash_on_delivery">Cash on Delivery</option>
                                <option value="pay_at_store">Pay at Store</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm text-gray-300">
                                Additional Notes (Optional)
                            </label>

                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                maxLength={1000}
                                rows={3}
                                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-blue-600 py-3 font-semibold hover:bg-blue-700 disabled:opacity-60"
                        >
                            {loading ? 'Placing Order...' : 'Place Order'}
                        </button>
                    </form>

                    <aside className="h-fit rounded-xl border border-gray-800 bg-gray-900 p-6">
                        <h2 className="mb-5 text-xl font-semibold">
                            Order Summary
                        </h2>

                        <div className="space-y-4">
                            {cartItems.map(item => (
                                <div
                                    key={item.productId}
                                    className="flex justify-between gap-4 text-sm"
                                >
                                    <span className="text-gray-400">
                                        {item.name} × {item.quantity}
                                    </span>

                                    <span className="whitespace-nowrap">
                                        ₹{(
                                            item.price * item.quantity
                                        ).toLocaleString('en-IN')}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 border-t border-gray-700 pt-5">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Subtotal</span>
                                <span>₹{cartTotal.toLocaleString('en-IN')}</span>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-between border-t border-gray-700 pt-5 text-lg font-bold">
                            <span>Final Total</span>
                            <span>₹{cartTotal.toLocaleString('en-IN')}</span>
                        </div>

                        <p className="mt-4 text-xs text-gray-500">
                            Final prices and stock are confirmed by the server
                            when your order is submitted.
                        </p>
                    </aside>

                </div>
            </div>
        </main>
    );
};

export default Checkout;