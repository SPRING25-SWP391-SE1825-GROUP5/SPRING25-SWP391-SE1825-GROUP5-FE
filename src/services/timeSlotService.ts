import api from './api';
import { TimeSlot, CreateTimeSlotRequest, UpdateTimeSlotRequest } from '../types/timeslot';

const API_URL = '/TimeSlot';

export const getAllTimeSlots = async (status: string = 'all') => {
  const url = status === 'all' ? API_URL : `${API_URL}?active=${status === 'active'}`;
  const res = await api.get(url);
  return res.data;
};

export const getTimeSlotById = async (id: number) => {
  const res = await api.get(`${API_URL}/${id}`);
  return res.data;
};

export const createTimeSlot = async (body: CreateTimeSlotRequest) => {
  const res = await api.post(API_URL, body);
  return res.data;
};

export const updateTimeSlot = async (id: number, body: UpdateTimeSlotRequest) => {
  const res = await api.put(`${API_URL}/${id}`, body);
  return res.data;
};

export const deleteTimeSlot = async (id: number) => {
  const res = await api.delete(`${API_URL}/${id}`);
  return res.data;
};
