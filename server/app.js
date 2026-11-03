const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const healthRoutes = require('./routes/healthRoutes');
const adminDashboardRoutes = require('./routes/adminDashboardRoutes');
const notFoundMiddleware = require('./middleware/notFoundMiddleware');
const errorMiddleware = require('./middleware/errorMiddleware');
const adminRequestRoutes = require('./routes/adminRequestRoutes');
const adminCustomerRoutes = require('./routes/adminCustomerRoutes');
const serviceRequestRoutes = require('./routes/serviceRequestRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const couponRoutes = require('./routes/couponRoutes');
const couponCustomerRoutes = require('./routes/couponCustomerRoutes');

const app = express();

// CORS configuration
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));

// Global middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/brands', require('./routes/brandRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/admin/requests', adminRequestRoutes);
app.use('/api/admin/customers', adminCustomerRoutes);
app.use('/api/service-requests', serviceRequestRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/admin/coupons', couponRoutes);
app.use('/api/coupons', couponCustomerRoutes);
app.use('/api/returns', require('./routes/returnRoutes'));

// 404 handler
app.use(notFoundMiddleware);

// Global error handler
app.use(errorMiddleware);

module.exports = app;