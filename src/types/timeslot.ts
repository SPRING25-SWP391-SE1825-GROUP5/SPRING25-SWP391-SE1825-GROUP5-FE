export interface TimeSlot {
  id: number;
  slotLabel: string;
  slotTimeStart: string;
  slotTimeEnd: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTimeSlotRequest {
  slotLabel: string;
  slotTimeStart: string;
  slotTimeEnd: string;
  isActive: boolean;
}

export type UpdateTimeSlotRequest = Partial<CreateTimeSlotRequest>;

