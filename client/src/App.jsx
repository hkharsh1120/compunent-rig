
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

import Header from './components/Header';

import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import Account from './pages/Account';

import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import MyOrders from './pages/MyOrders';
import OrderDetails from './pages/OrderDetails';

import PCBuild from './pages/PCBuild';
import LaptopUpgrade from './pages/LaptopUpgrade';

import ProtectedRoute from './components/ProtectedRoute';

import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCatalog from './pages/admin/AdminCatalog';
import AdminOrders from './pages/admin/AdminOrders';
import AdminServiceRequests from './pages/admin/AdminServiceRequests';
import AdminCustomers from './pages/admin/AdminCustomers';

function NotFound() {
    return (
        <div className="flex min-h-[70vh] items-center justify-center">
            <div className="text-center">
                <h1 className="text-5xl font-bold">404</h1>
                <p className="mt-3 text-gray-600">Page Not Found</p>
            </div>
        </div>
    );
}

function App() {
    const location = useLocation();
    const isAdminPage = location.pathname.startsWith('/admin');

    return (
        <>
            {!isAdminPage && <Header />}

            <Routes>
                {/* Public pages */}
                <Route path="/" element={<Home />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />

                <Route path="/products" element={<Products />} />
                <Route path="/products/:slug" element={<ProductDetails />} />
                <Route path="/cart" element={<Cart />} />

                <Route path="/services/pc-build" element={<PCBuild />} />
                <Route path="/services/laptop-upgrade" element={<LaptopUpgrade />} />

                {/* Customer protected pages */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/account" element={<Account />} />
                    <Route path="/account/orders" element={<MyOrders />} />
                    <Route path="/account/orders/:id" element={<OrderDetails />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/order-success" element={<OrderSuccess />} />
                </Route>

                {/* Admin protected pages */}
                <Route element={<ProtectedRoute adminOnly />}>
                    <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<Navigate to="dashboard" replace />} />
                        <Route path="dashboard" element={<AdminDashboard />} />
                        <Route path="products" element={<AdminProducts />} />
                        <Route path="catalog" element={<AdminCatalog />} />
                        <Route path="orders" element={<AdminOrders />} />
                        <Route path="service-requests" element={<AdminServiceRequests />} />
                        <Route path="customers" element={<AdminCustomers />} />
                    </Route>
                </Route>

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
            </Routes>
        </>
    );
}

export default App;
