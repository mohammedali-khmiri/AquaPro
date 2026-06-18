export interface Swimmer {
  id?: number;
  registrationNumber?: string;
  level?: string;
  category?: string;
  dateOfBirth?: string;
  medicalRecordPath?: string;
  isActive?: boolean;
  userId?: number;
  userFirstName: string;
  userLastName: string;
  email?: string;
}

export interface Coach {
  id?: number;
  specialization: string;
  certificationNumber: string;
  bio?: string;
  experience: number;
  isActive?: boolean;
  userId: number;
  userFirstName?: string;
  userLastName?: string;
  userEmail?: string;
}

export interface Competition {
  id?: number;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  location: string;
  level?: string;
  maxParticipants?: number;
  status?: string;
  createdBy?: number;
  participantsCount?: number;
}

export interface TrainingSession {
  id?: number;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location: string;
  maxCapacity: number;
  level?: string;
  isCancelled?: boolean;
  coachId: number;
  coachName?: string;
  createdBy?: number;
  swimmersCount?: number;
}
