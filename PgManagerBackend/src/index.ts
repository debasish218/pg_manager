import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from './middleware/auth';

// Controllers
import * as authController from './controllers/authController';
import * as roomController from './controllers/roomController';
import * as tenantController from './controllers/tenantController';

const app = new Hono();

// Middleware
app.use('*', cors());

// Health check
app.get('/health', (c) => c.json({ status: 'OK', message: 'Backend is running' }));

// Auth Routes (No authentication required)
app.post('/api/auth/setup', authController.setup);
app.post('/api/auth/login', authController.login);

// Auth Routes (Authentication required)
app.get('/api/auth/me', authMiddleware, authController.getMe);
app.put('/api/auth/profile', authMiddleware, authController.updateProfile);
app.delete('/api/auth/profile', authMiddleware, authController.deleteProfile);

// Room Routes
app.get('/api/rooms', authMiddleware, roomController.getAllRooms);
app.get('/api/rooms/:id', authMiddleware, roomController.getRoomById);
app.post('/api/rooms', authMiddleware, roomController.createRoom);
app.put('/api/rooms/:id', authMiddleware, roomController.updateRoom);
app.delete('/api/rooms/:id', authMiddleware, roomController.deleteRoom);

// Tenant Routes
app.get('/api/tenants', authMiddleware, tenantController.getAllTenants);
app.get('/api/tenants/overdue', authMiddleware, tenantController.getOverdueTenants);
app.get('/api/tenants/:id', authMiddleware, tenantController.getTenantById);
app.post('/api/tenants', authMiddleware, tenantController.createTenant);
app.put('/api/tenants/:id', authMiddleware, tenantController.updateTenant);
app.patch('/api/tenants/:id/payment', authMiddleware, tenantController.updatePayment);
app.delete('/api/tenants/:id', authMiddleware, tenantController.deleteTenant);

export default app;
