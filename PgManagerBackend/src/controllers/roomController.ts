import { Context } from 'hono';
import { RoomService } from '../services/roomService';

const roomService = new RoomService();

export const getAllRooms = async (c: Context) => {
  try {
    const userId = c.get('userId');
    const searchTerm = c.req.query('searchTerm');
    const sharingType = c.req.query('sharingType');

    const rooms = await roomService.getAllRooms(
      userId,
      searchTerm,
      sharingType ? parseInt(sharingType) : undefined
    );

    return c.json({ success: true, message: 'Rooms retrieved', data: rooms });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 500);
  }
};

export const getRoomById = async (c: Context) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');

    const room = await roomService.getRoomById(userId, parseInt(id));
    return c.json({ success: true, message: 'Room retrieved', data: room });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 404);
  }
};

export const createRoom = async (c: Context) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const { roomNumber, sharingType, totalBeds, rentPerBed, floor } = body;

    if (!roomNumber || !sharingType || !totalBeds) {
      return c.json({ success: false, message: 'Missing required fields' }, 400);
    }

    const room = await roomService.createRoom(userId, {
      roomNumber,
      sharingType,
      totalBeds,
      rentPerBed: rentPerBed || 0,
      floor: floor || 0,
    });

    return c.json({ success: true, message: 'Room created', data: room }, 201);
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 400);
  }
};

export const updateRoom = async (c: Context) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');
    const body = await c.req.json();
    const { roomNumber, sharingType, totalBeds, rentPerBed, floor } = body;

    const room = await roomService.updateRoom(userId, parseInt(id), {
      roomNumber,
      sharingType,
      totalBeds,
      rentPerBed,
      floor,
    });

    return c.json({ success: true, message: 'Room updated', data: room });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 400);
  }
};

export const deleteRoom = async (c: Context) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');

    const result = await roomService.deleteRoom(userId, parseInt(id));
    return c.json({ success: true, message: result.message });
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 400);
  }
};
