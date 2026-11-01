import { useEffect, useState } from 'react';

import { getHealthStatus } from './services/healthService';
import { Routes, Route } from 'react-router-dom';

import Register from './pages/Register';
import Login from './pages/Login';

import ProtectedRoute from './components/ProtectedRoute';
import Account from './pages/Account';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import MyOrders from './pages/MyOrders';
import OrderDetails from './pages/OrderDetails';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCatalog from './pages/admin/AdminCatalog';
import AdminOrders from './pages/admin/AdminOrders';
import AdminServiceRequests from './pages/admin/AdminServiceRequests';
import AdminCustomers from './pages/admin/AdminCustomers';

function Home() {
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const checkBackend = async () => {
            try {
                const data = await getHealthStatus();
                setHealth(data);
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    'Unable to connect to backend'
                );
            } finally {
                setLoading(false);
            }
        };

        checkBackend();
    }, []);

    return (
        <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
            <h1 className="text-4xl font-bold mb-3">
                COMPUNENT RIG
            </h1>

            <p className="text-slate-400 mb-8">
                Computer Hardware & Custom Builds
            </p>

            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md">
                <h2 className="text-xl font-semibold mb-4">
                    System Status
                </h2>

                {loading && (
                    <p className="text-yellow-400">
                        Checking backend connection...
                    </p>
                )}

                {error && (
                    <p className="text-red-400">
                        {error}
                    </p>
                )}

                {health && (
                    <div className="space-y-3">
                        <p className="text-green-400">
                            Backend: Connected
                        </p>

                        <p className={
                            health.database === 'Connected'
                                ? 'text-green-400'
                                : 'text-red-400'
                        }>
                            Database: {health.database}
                        </p>

                        <p className="text-slate-400 text-sm">
                            {health.message}
                        </p>
                    </div>
                )}
            </div>
        </main>
    );
}

function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <h1 className="text-3xl font-bold">
                404 - Page Not Found
            </h1>
        </div>
    );
}

function App() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />

            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />

            {/* Protected routes will be added here */}

            <Route path="*" element={<NotFound />} />
            <Route element={<ProtectedRoute />}>
    <Route path="/account" element={<Account />} />
    <Route path="/products" element={<Products />} />
    <Route path="/products/:slug" element={<ProductDetails />} />
    <Route path="/cart" element={<Cart />} />
</Route>
<Route element={<ProtectedRoute />}>
    <Route path="/checkout" element={<Checkout />} />
    <Route path="/order-success" element={<OrderSuccess />} />
</Route>
<Route path="/account/orders" element={<MyOrders />} />
<Route path="/account/orders/:id" element={<OrderDetails />} />
<Route element={<ProtectedRoute adminOnly />}>
    <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="catalog" element={<AdminCatalog />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="service-requests" element={<AdminServiceRequests />} />
        <Route path="customers" element={<AdminCustomers />} />
    </Route>
    
</Route>
        </Routes>
    );
}

export default App;