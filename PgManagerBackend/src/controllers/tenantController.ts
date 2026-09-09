import { Context } from 'hono';
import { TenantService } from '../services/tenantService';

const tenantService = new TenantService();

export const getAllTenants = async (c: Context) => {
  try {
    const userId = c.get('userId');
    const searchTerm = c.req.query('searchTerm');
    const sharingType = c.req.query('sharingType');
    const isActive = c.req.query('isActive');

    const tenants = await tenantService.getAllTenants(
      userId,
      searchTerm,
      sharingType ? parseInt(sharingType) : undefined,
      isActive ? isActive === 'true' : undefined
    );

    return c.json({ success: true, message: 'Tenants retrieved', data: tenants });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
};

export const getTenantById = async (c: Context) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');

    const tenant = await tenantService.getTenantById(userId, parseInt(id));
    return c.json({ success: true, message: 'Tenant retrieved', data: tenant });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 404);
  }
};

export const getOverdueTenants = async (c: Context) => {
  try {
    const userId = c.get('userId');

    const tenants = await tenantService.getOverdueTenants(userId);
    return c.json({ success: true, message: 'Overdue tenants retrieved', data: tenants });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
};

export const createTenant = async (c: Context) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const { name, phoneNumber, roomId, advanceAmount, joinDate, lastPaidDate, isActive, dueAmount } = body;

    if (!name || !phoneNumber || !roomId || advanceAmount === undefined || !joinDate) {
      return c.json({ success: false, message: 'Missing required fields' }, 400);
    }

    const tenant = await tenantService.createTenant(userId, {
      name,
      phoneNumber,
      roomId,
      advanceAmount,
      joinDate: new Date(joinDate),
      lastPaidDate: lastPaidDate ? new Date(lastPaidDate) : undefined,
      isActive,
      dueAmount,
    });

    return c.json({ success: true, message: 'Tenant created', data: tenant }, 201);
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 400);
  }
};

export const updateTenant = async (c: Context) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');
    const body = await c.req.json();

    const tenant = await tenantService.updateTenant(userId, parseInt(id), body);
    return c.json({ success: true, message: 'Tenant updated', data: tenant });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 400);
  }
};

export const updatePayment = async (c: Context) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');
    const body = await c.req.json();
    const { paidAmount, paymentDate } = body;

    if (!paidAmount || !paymentDate) {
      return c.json({ success: false, message: 'Missing required fields' }, 400);
    }

    const tenant = await tenantService.updatePayment(
      userId,
      parseInt(id),
      paidAmount,
      new Date(paymentDate)
    );

    return c.json({ success: true, message: 'Payment updated', data: tenant });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 400);
  }
};

export const deleteTenant = async (c: Context) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');

    const result = await tenantService.deleteTenant(userId, parseInt(id));
    return c.json({ success: true, message: result.message });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 400);
  }
};
