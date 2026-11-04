import type { Role } from "@/lib/constants";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  teamId?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  address?: string | null;
  city?: string | null;
  type: string;
  status: string;
  source?: string | null;
  tags: string[];
  notes?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  preferredLocation?: string | null;
  preferredType?: string | null;
  beds?: number | null;
  baths?: number | null;
  preferenceNotes?: string | null;
  assignedAgentId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Property = {
  id: string;
  title: string;
  address: string;
  city: string;
  type: string;
  status: string;
  price: number;
  area?: number | null;
  areaUnit: string;
  beds?: number | null;
  baths?: number | null;
  description?: string | null;
  photos: string[];
  documents: string[];
  listingAgentId?: string | null;
  ownerContactId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Lead = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  source: string;
  status: string;
  score: number;
  message?: string | null;
  budget?: number | null;
  preferredType?: string | null;
  preferredLocation?: string | null;
  assignedAgentId?: string | null;
  contactId?: string | null;
  convertedDealId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PipelineStage = {
  id: string;
  name: string;
  order: number;
  pipeline: string;
  color: string;
};

export type Deal = {
  id: string;
  title: string;
  pipeline: string;
  stageId: string;
  value: number;
  probability: number;
  expectedCloseDate?: string | null;
  contactId?: string | null;
  propertyId?: string | null;
  agentId?: string | null;
  notes?: string | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Task = {
  id: string;
  title: string;
  description?: string | null;
  dueAt?: string | null;
  priority: string;
  status: string;
  assigneeId?: string | null;
  createdById?: string | null;
  contactId?: string | null;
  propertyId?: string | null;
  dealId?: string | null;
  leadId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Activity = {
  id: string;
  type: string;
  subject?: string | null;
  body?: string | null;
  createdById?: string | null;
  contactId?: string | null;
  propertyId?: string | null;
  dealId?: string | null;
  leadId?: string | null;
  scheduledAt?: string | null;
  createdAt: string;
};

export type Note = {
  id: string;
  body: string;
  authorId?: string | null;
  contactId?: string | null;
  propertyId?: string | null;
  dealId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ContactProperty = {
  id: string;
  contactId: string;
  propertyId: string;
  interest?: string | null;
  createdAt: string;
};

export type Team = {
  id: string;
  name: string;
  managerId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TeamInvite = {
  id: string;
  email: string;
  teamId: string;
  role: Role;
  token: string;
  status: "PENDING" | "ACCEPTED" | "REVOKED";
  invitedById: string;
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string | null;
};

export type TeamMessage = {
  id: string;
  fromUserId: string;
  toUserId: string;
  subject: string;
  body: string;
  readAt?: string | null;
  contactId?: string | null;
  propertyId?: string | null;
  dealId?: string | null;
  leadId?: string | null;
  createdAt: string;
  updatedAt: string;
};
