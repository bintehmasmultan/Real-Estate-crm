export const ROLES = ["ADMIN", "MANAGER", "AGENT"] as const;
export type Role = (typeof ROLES)[number];

export const CONTACT_TYPES = [
  "BUYER",
  "SELLER",
  "LANDLORD",
  "TENANT",
  "INVESTOR",
] as const;
export type ContactType = (typeof CONTACT_TYPES)[number];

export const CONTACT_STATUSES = [
  "ACTIVE",
  "INACTIVE",
  "LEAD",
  "CLIENT",
  "ARCHIVED",
] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export const PROPERTY_TYPES = [
  "APARTMENT",
  "HOUSE",
  "PLOT",
  "COMMERCIAL",
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const PROPERTY_STATUSES = [
  "AVAILABLE",
  "UNDER_OFFER",
  "SOLD",
  "RENTED",
  "OFF_MARKET",
] as const;
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

export const LEAD_SOURCES = [
  "WEBSITE",
  "FACEBOOK",
  "REFERRAL",
  "WALK_IN",
  "ZAMEEN",
  "OLX",
  "OTHER",
] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "UNQUALIFIED",
  "CONVERTED",
  "LOST",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const PIPELINES = ["SALES", "RENTALS"] as const;
export type PipelineType = (typeof PIPELINES)[number];

export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_STATUSES = [
  "TODO",
  "IN_PROGRESS",
  "DONE",
  "CANCELLED",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const ACTIVITY_TYPES = [
  "CALL",
  "EMAIL",
  "MEETING",
  "VIEWING",
  "NOTE",
  "STATUS_CHANGE",
  "OTHER",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export function labelize(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
