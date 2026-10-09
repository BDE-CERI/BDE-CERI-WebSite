export type EventRegistrationStatus = {
  event_id: string;
  registered: boolean;
  registered_at: string | null;
  registrations_count: number;
  max_capacity: number | null;
  registration_open: boolean;
  registration_enabled: boolean;
  member_eligible: boolean;
  // A registration keeps its original price if the event is edited later.
  payment_required: boolean;
  payment_amount_cents: number | null;
  // Current event link, which may be removed after a paid registration exists.
  checkout_url: string | null;
};

export type EventRegistrationErrorCode =
  | "AUTH_REQUIRED"
  | "MEMBER_REQUIRED"
  | "EVENT_NOT_FOUND"
  | "CLOSED"
  | "FULL"
  | "INVALID_INPUT"
  | "FORBIDDEN"
  | "CONFIGURATION_REQUIRED"
  | "UNAVAILABLE";

export type RegistrationActionResult =
  | { success: true; status: EventRegistrationStatus }
  | { success: false; error: string; code: EventRegistrationErrorCode };

export type EventRegistrationAttendee = {
  id: string;
  member_id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  is_visible: boolean;
  registered_at: string;
  payment_required: boolean;
  payment_amount_cents: number | null;
};

export type EventRegistrant = EventRegistrationAttendee;

export type EventRegistrationsListResult =
  | { success: true; total: number; registrations: EventRegistrationAttendee[] }
  | { success: false; error: string };

export type EventRegistrationLog = {
  id: string;
  event_id: string | null;
  event_title: string;
  member_id: string | null;
  member_name: string;
  action: "registered" | "unregistered";
  payment_required: boolean;
  payment_amount_cents: number | null;
  logged_at: string;
};

export type EventRegistrationLogsResult =
  | { success: true; total: number; logs: EventRegistrationLog[] }
  | { success: false; error: string };
