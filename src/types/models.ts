export type UserRole = 'admin' | 'user' | 'moderator';

export type UserType = 'student' | 'elev' | 'rezident';

// Our MongoDB User interface (this is our main user type)
export interface User {
  _id: string;
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  userType: UserType;
}

// For Clerk user type, we'll use the imported type from @clerk/nextjs/server

export interface Workshop {
  _id?: string | { toString(): string }; // MongoDB ObjectId
  id?: string; // For serialized versions
  title: string;
  description: string;
  date: Date | string; // Support both Date objects and serialized strings
  time: string;
  location: string;
  maxParticipants: number;
  currentParticipants: number;
  instructor: string;
  status: 'active' | 'cancelled' | 'completed';
  wsType: 'workshop' | 'conferinta';
  url?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// MongoDB Registration interface
export interface WorkshopRegistration {
  _id: string;
  userId: string; // Clerk user ID
  workshopId: string; // Workshop ID
  attendance: {
    confirmed: boolean;
    confirmedAt?: Date | string;
    confirmedBy?: string; // Admin user ID who confirmed
  };
  createdAt: Date;
  updatedAt: Date;
}

// User with attendance info (for admin workshop display)
export interface UserWithAttendance extends User {
  attendance?: {
    confirmed: boolean;
    confirmedAt?: Date | string;
    confirmedBy?: string;
  };
}

export interface AuthUser {
  id: string;
  email: string;
  app_metadata: {
    provider?: string;
    [key: string]: unknown;
  };
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
    [key: string]: unknown;
  };
}

export interface Registrations{
  _id: string;
  userId: string;
  workshopId: string;
}

// Payment interface for client-side usage
export interface Payment {
  _id: string;
  clerkId: string;
  stripeSessionId: string;
  stripePaymentIntentId?: string;
  amount: number;
  currency: string;
  ticketId?: string;
  ticketType?: string;
  ticketCategory?: 'workshop' | 'ball';
  quantity: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  metadata?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Ticket {
  _id?: string // MongoDB ObjectId
  id?: string; // For serialized versions
  title: string; // Ticket name
  type: string;
  description: string; // Ticket description
  price: number; // Ticket price in RON
  features: string[]; // List of features
  enabled: boolean; // Whether the ticket is available for purchase
  category: 'workshop' | 'ball'; // Which event type this ticket belongs to
  createdAt?: Date;
  updatedAt?: Date;
}