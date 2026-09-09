import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class TenantService {
  async getAllTenants(userId: number, searchTerm?: string, sharingType?: number, isActive?: boolean) {
    try {
      const tenants = await prisma.tenant.findMany({
        where: {
          userId,
          ...(searchTerm && {
            OR: [
              { name: { contains: searchTerm, mode: 'insensitive' } },
              { phoneNumber: { contains: searchTerm } },
            ],
          }),
          ...(isActive !== undefined && { isActive }),
        },
        include: { room: true },
        orderBy: [{ isActive: 'desc' }, { dueAmount: 'desc' }],
      });

      return tenants.map((t) => this.formatTenantDto(t));
    } catch (error) {
      throw error;
    }
  }

  async getTenantById(userId: number, tenantId: number) {
    try {
      const tenant = await prisma.tenant.findFirst({
        where: { id: tenantId, userId },
        include: { room: true },
      });

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      return this.formatTenantDto(tenant);
    } catch (error) {
      throw error;
    }
  }

  async getOverdueTenants(userId: number) {
    try {
      const tenants = await prisma.tenant.findMany({
        where: { userId, isActive: true },
        include: { room: true },
      });

      const overdue = tenants
        .filter((t) => this.isOverdue(t))
        .sort((a, b) => this.getDaysSinceLastPayment(b) - this.getDaysSinceLastPayment(a));

      return overdue.map((t) => this.formatTenantDto(t));
    } catch (error) {
      throw error;
    }
  }

  async createTenant(userId: number, data: {
    name: string;
    phoneNumber: string;
    roomId: number;
    advanceAmount: number;
    joinDate: Date;
    lastPaidDate?: Date;
    isActive?: boolean;
    dueAmount?: number;
  }) {
    try {
      // Validate phone number (10 digits)
      if (!/^\d{10}$/.test(data.phoneNumber)) {
        throw new Error('Phone number must be 10 digits');
      }

      // Check room exists and has capacity
      const room = await prisma.room.findFirst({
        where: { id: data.roomId, userId },
        include: { tenants: { where: { isActive: true } } },
      });

      if (!room) {
        throw new Error('Room not found');
      }

      if (room.tenants.length >= room.totalBeds) {
        throw new Error('Room is full');
      }

      const tenant = await prisma.tenant.create({
        data: {
          userId,
          name: data.name,
          phoneNumber: data.phoneNumber,
          roomId: data.roomId,
          advanceAmount: data.advanceAmount,
          joinDate: data.joinDate,
          lastPaidDate: data.lastPaidDate,
          isActive: data.isActive !== false,
          dueAmount: data.dueAmount || 0,
        },
        include: { room: true },
      });

      return this.formatTenantDto(tenant);
    } catch (error) {
      throw error;
    }
  }

  async updateTenant(userId: number, tenantId: number, data: any) {
    try {
      const tenant = await prisma.tenant.findFirst({
        where: { id: tenantId, userId },
        include: { room: true },
      });

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      const updateData: any = {};

      if (data.name) updateData.name = data.name;
      if (data.phoneNumber) updateData.phoneNumber = data.phoneNumber;
      if (data.advanceAmount !== undefined) updateData.advanceAmount = data.advanceAmount;
      if (data.joinDate) updateData.joinDate = data.joinDate;
      if (data.lastPaidDate !== undefined) {
        updateData.lastPaidDate = data.lastPaidDate;
        if (data.lastPaidDate) updateData.dueAmount = 0;
      }
      if (data.dueAmount !== undefined) updateData.dueAmount = data.dueAmount;

      // Handle room change
      if (data.roomId && data.roomId !== tenant.roomId) {
        const newRoom = await prisma.room.findFirst({
          where: { id: data.roomId, userId },
          include: { tenants: { where: { isActive: true } } },
        });

        if (!newRoom) {
          throw new Error('New room not found');
        }

        if (newRoom.tenants.length >= newRoom.totalBeds && tenant.isActive) {
          throw new Error('New room is full');
        }

        updateData.roomId = data.roomId;
      }

      // Handle isActive change
      if (data.isActive !== undefined && data.isActive !== tenant.isActive) {
        updateData.isActive = data.isActive;
      }

      const updated = await prisma.tenant.update({
        where: { id: tenantId },
        data: updateData,
        include: { room: true },
      });

      return this.formatTenantDto(updated);
    } catch (error) {
      throw error;
    }
  }

  async updatePayment(userId: number, tenantId: number, paidAmount: number, paymentDate: Date) {
    try {
      const tenant = await prisma.tenant.findFirst({
        where: { id: tenantId, userId },
        include: { room: true },
      });

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      if (paidAmount <= 0) {
        throw new Error('Payment amount must be greater than 0');
      }

      const currentDue = this.getCurrentDue(tenant);
      if (paidAmount > currentDue) {
        throw new Error(`Payment cannot exceed current due (₹${currentDue})`);
      }

      const updated = await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          lastPaidDate: paymentDate,
          dueAmount: currentDue - paidAmount,
        },
        include: { room: true },
      });

      return this.formatTenantDto(updated);
    } catch (error) {
      throw error;
    }
  }

  async deleteTenant(userId: number, tenantId: number) {
    try {
      const tenant = await prisma.tenant.findFirst({
        where: { id: tenantId, userId },
      });

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      await prisma.tenant.delete({
        where: { id: tenantId },
      });

      return { message: 'Tenant deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

  // Helper methods
  private formatTenantDto(tenant: any) {
    return {
      id: tenant.id,
      name: tenant.name,
      phoneNumber: tenant.phoneNumber,
      roomId: tenant.roomId,
      roomNumber: tenant.room?.roomNumber || 0,
      sharingType: tenant.room ? this.getSharingType(tenant.room.sharingType) : '',
      rentAmount: tenant.room?.rentPerBed || 0,
      advanceAmount: tenant.advanceAmount,
      joinDate: tenant.joinDate,
      lastPaidDate: tenant.lastPaidDate,
      isActive: tenant.isActive,
      dueAmount: tenant.dueAmount,
      daysSinceLastPayment: this.getDaysSinceLastPayment(tenant),
      isOverdue: this.isOverdue(tenant),
      currentDue: this.getCurrentDue(tenant),
      monthsElapsed: this.getMonthsElapsed(tenant),
      createdAt: tenant.createdAt,
    };
  }

  private getMonthsElapsed(tenant: any): number {
    const referenceDate = tenant.lastPaidDate || tenant.joinDate;
    const today = new Date();
    let months = 0;

    const nextDate = new Date(referenceDate);
    while (nextDate.setMonth(nextDate.getMonth() + 1) <= today) {
      months++;
    }

    return months;
  }

  private getDaysSinceLastPayment(tenant: any): number {
    const referenceDate = tenant.lastPaidDate || tenant.joinDate;
    const today = new Date();
    const timeDiff = today.getTime() - new Date(referenceDate).getTime();
    return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  }

  private isOverdue(tenant: any): boolean {
    if (!tenant.lastPaidDate) return true;
    return this.getMonthsElapsed(tenant) > 0;
  }

  private getCurrentDue(tenant: any): number {
    const rent = tenant.room?.rentPerBed || 0;
    if (!tenant.lastPaidDate) {
      return tenant.dueAmount + (this.getMonthsElapsed(tenant) + 1) * rent;
    }
    return tenant.dueAmount + this.getMonthsElapsed(tenant) * rent;
  }

  private getSharingType(type: number): string {
    const types: { [key: number]: string } = {
      1: 'Single',
      2: 'Double',
      3: 'Triple',
      4: 'Four',
      5: 'Five',
      6: 'Six',
    };
    return types[type] || 'Unknown';
  }
}
