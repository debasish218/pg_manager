import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class RoomService {
  async getAllRooms(userId: number, searchTerm?: string, sharingType?: number) {
    try {
      const rooms = await prisma.room.findMany({
        where: {
          userId,
          ...(searchTerm && { roomNumber: parseInt(searchTerm) }),
          ...(sharingType && { sharingType }),
        },
        include: {
          tenants: {
            where: { isActive: true },
          },
        },
        orderBy: { roomNumber: 'asc' },
      });

      return rooms.map((room) => ({
        id: room.id,
        roomNumber: room.roomNumber,
        sharingType: this.getSharingType(room.sharingType),
        totalBeds: room.totalBeds,
        occupiedBeds: room.tenants.length,
        availableBeds: room.totalBeds - room.tenants.length,
        isAvailable: room.tenants.length < room.totalBeds,
        activeTenants: room.tenants.length,
        rentPerBed: room.rentPerBed,
        floor: room.floor,
        createdAt: room.createdAt,
        tenants: room.tenants.map((t) => ({
          id: t.id,
          name: t.name,
          phoneNumber: t.phoneNumber,
          roomId: t.roomId,
          roomNumber: room.roomNumber,
          sharingType: this.getSharingType(room.sharingType),
          rentAmount: room.rentPerBed,
          advanceAmount: t.advanceAmount,
          joinDate: t.joinDate,
          lastPaidDate: t.lastPaidDate,
          isActive: t.isActive,
          dueAmount: t.dueAmount,
          createdAt: t.createdAt,
        })),
      }));
    } catch (error) {
      throw error;
    }
  }

  async getRoomById(userId: number, roomId: number) {
    try {
      const room = await prisma.room.findFirst({
        where: { id: roomId, userId },
        include: {
          tenants: {
            where: { isActive: true },
          },
        },
      });

      if (!room) {
        throw new Error('Room not found');
      }

      return {
        id: room.id,
        roomNumber: room.roomNumber,
        sharingType: this.getSharingType(room.sharingType),
        totalBeds: room.totalBeds,
        occupiedBeds: room.tenants.length,
        availableBeds: room.totalBeds - room.tenants.length,
        isAvailable: room.tenants.length < room.totalBeds,
        activeTenants: room.tenants.length,
        rentPerBed: room.rentPerBed,
        floor: room.floor,
        createdAt: room.createdAt,
        tenants: room.tenants.map((t) => ({
          id: t.id,
          name: t.name,
          phoneNumber: t.phoneNumber,
          roomId: t.roomId,
          roomNumber: room.roomNumber,
          sharingType: this.getSharingType(room.sharingType),
          rentAmount: room.rentPerBed,
          advanceAmount: t.advanceAmount,
          joinDate: t.joinDate,
          lastPaidDate: t.lastPaidDate,
          isActive: t.isActive,
          dueAmount: t.dueAmount,
          createdAt: t.createdAt,
        })),
      };
    } catch (error) {
      throw error;
    }
  }

  async createRoom(userId: number, data: { roomNumber: number; sharingType: number; totalBeds: number; rentPerBed: number; floor: number }) {
    try {
      const existing = await prisma.room.findFirst({
        where: { userId, roomNumber: data.roomNumber },
      });

      if (existing) {
        throw new Error('Room number already exists');
      }

      const room = await prisma.room.create({
        data: {
          userId,
          ...data,
        },
      });

      return {
        id: room.id,
        roomNumber: room.roomNumber,
        sharingType: this.getSharingType(room.sharingType),
        totalBeds: room.totalBeds,
        occupiedBeds: 0,
        availableBeds: room.totalBeds,
        isAvailable: true,
        activeTenants: 0,
        rentPerBed: room.rentPerBed,
        floor: room.floor,
        createdAt: room.createdAt,
      };
    } catch (error) {
      throw error;
    }
  }

  async updateRoom(userId: number, roomId: number, data: { roomNumber?: number; sharingType?: number; totalBeds?: number; rentPerBed?: number; floor?: number }) {
    try {
      const room = await prisma.room.findFirst({
        where: { id: roomId, userId },
        include: {
          tenants: {
            where: { isActive: true },
          },
        },
      });

      if (!room) {
        throw new Error('Room not found');
      }

      if (data.totalBeds && data.totalBeds < room.tenants.length) {
        throw new Error('Cannot reduce beds below occupied count');
      }

      const updated = await prisma.room.update({
        where: { id: roomId },
        data,
      });

      return {
        id: updated.id,
        roomNumber: updated.roomNumber,
        sharingType: this.getSharingType(updated.sharingType),
        totalBeds: updated.totalBeds,
        occupiedBeds: room.tenants.length,
        availableBeds: updated.totalBeds - room.tenants.length,
        isAvailable: room.tenants.length < updated.totalBeds,
        activeTenants: room.tenants.length,
        rentPerBed: updated.rentPerBed,
        floor: updated.floor,
        createdAt: updated.createdAt,
      };
    } catch (error) {
      throw error;
    }
  }

  async deleteRoom(userId: number, roomId: number) {
    try {
      const room = await prisma.room.findFirst({
        where: { id: roomId, userId },
        include: {
          tenants: {
            where: { isActive: true },
          },
        },
      });

      if (!room) {
        throw new Error('Room not found');
      }

      if (room.tenants.length > 0) {
        throw new Error('Cannot delete room with active tenants');
      }

      await prisma.room.delete({
        where: { id: roomId },
      });

      return { message: 'Room deleted successfully' };
    } catch (error) {
      throw error;
    }
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
