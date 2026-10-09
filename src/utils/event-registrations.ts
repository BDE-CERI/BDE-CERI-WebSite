import "server-only";

import { createClient } from "@/utils/supabase/server";
import { normalizeHelloAssoCheckoutUrl } from "@/utils/event-payment";
import type { EventRegistrationAttendee, EventRegistrationLog, EventRegistrationStatus } from "@/types/event-registrations";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isEventRegistrationId(value: unknown): value is string {
  return typeof value === "string" && value.length === 36 && uuidPattern.test(value);
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function count(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function validPayment(required: unknown, amount: unknown): boolean {
  return typeof required === "boolean" && (required
    ? typeof amount === "number" && Number.isSafeInteger(amount) && amount > 0 && amount <= 2_147_483_647
    : amount === null);
}

function date(value: unknown): value is string {
  return typeof value === "string" && value.length <= 64 && Number.isFinite(Date.parse(value));
}

export function parseEventRegistrationStatus(value: unknown, eventId: string): EventRegistrationStatus | null {
  if (!record(value)
    || !isEventRegistrationId(value.event_id)
    || value.event_id.toLowerCase() !== eventId.toLowerCase()
    || typeof value.registered !== "boolean"
    || !(value.registered_at === null || date(value.registered_at))
    || !count(value.registrations_count)
    || !(value.max_capacity === null || (count(value.max_capacity) && value.max_capacity > 0))
    || typeof value.registration_open !== "boolean"
    || typeof value.registration_enabled !== "boolean"
    || typeof value.member_eligible !== "boolean"
    || !validPayment(value.payment_required, value.payment_amount_cents)
    || !(value.checkout_url === null || normalizeHelloAssoCheckoutUrl(value.checkout_url) !== null)
    || (value.payment_required === false && value.checkout_url !== null)
    || (!value.registered && value.payment_required === true && value.checkout_url === null)
    || (value.registered && value.registered_at === null)
    || (!value.registered && value.registered_at !== null)) {
    return null;
  }

  return {
    event_id: value.event_id,
    registered: value.registered,
    registered_at: value.registered_at,
    registrations_count: value.registrations_count,
    max_capacity: value.max_capacity,
    registration_open: value.registration_open,
    registration_enabled: value.registration_enabled,
    member_eligible: value.member_eligible,
    payment_required: value.payment_required as boolean,
    payment_amount_cents: value.payment_amount_cents as number | null,
    checkout_url: value.checkout_url === null ? null : normalizeHelloAssoCheckoutUrl(value.checkout_url),
  };
}

export function parseEventRegistrationsList(value: unknown): { total: number; registrations: EventRegistrationAttendee[] } | null {
  if (!record(value) || !count(value.total) || !Array.isArray(value.registrations) || value.registrations.length > 50) {
    return null;
  }

  const registrations: EventRegistrationAttendee[] = [];
  for (const row of value.registrations as unknown[]) {
    if (!record(row)
      || !isEventRegistrationId(row.id)
      || !isEventRegistrationId(row.member_id)
      || typeof row.first_name !== "string"
      || typeof row.last_name !== "string"
      || !(row.photo_url === null || typeof row.photo_url === "string")
      || typeof row.is_visible !== "boolean"
      || !date(row.registered_at)
      || !validPayment(row.payment_required, row.payment_amount_cents)) {
      return null;
    }

    registrations.push({
      id: row.id,
      member_id: row.member_id,
      first_name: row.first_name,
      last_name: row.last_name,
      photo_url: row.photo_url,
      is_visible: row.is_visible,
      registered_at: row.registered_at,
      payment_required: row.payment_required as boolean,
      payment_amount_cents: row.payment_amount_cents as number | null,
    });
  }

  return { total: value.total, registrations };
}

export function parseEventRegistrationLogs(value: unknown): { total: number; logs: EventRegistrationLog[] } | null {
  if (!record(value) || !count(value.total) || !Array.isArray(value.logs) || value.logs.length > 100) return null;
  const logs: EventRegistrationLog[] = [];
  for (const row of value.logs as unknown[]) {
    if (!record(row) || !isEventRegistrationId(row.id)
      || !(row.event_id === null || isEventRegistrationId(row.event_id))
      || typeof row.event_title !== "string" || row.event_title.length > 200
      || !(row.member_id === null || isEventRegistrationId(row.member_id))
      || typeof row.member_name !== "string" || row.member_name.length > 200
      || (row.action !== "registered" && row.action !== "unregistered")
      || !validPayment(row.payment_required, row.payment_amount_cents)
      || !date(row.logged_at)) return null;
    logs.push({
      id: row.id, event_id: row.event_id, event_title: row.event_title,
      member_id: row.member_id, member_name: row.member_name, action: row.action,
      payment_required: row.payment_required as boolean,
      payment_amount_cents: row.payment_amount_cents as number | null,
      logged_at: row.logged_at,
    });
  }
  return { total: value.total, logs };
}

export async function getEventRegistrationStatus(eventId: string): Promise<{ status: EventRegistrationStatus | null; error: boolean }> {
  if (!isEventRegistrationId(eventId)) return { status: null, error: true };

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("bde_event_registration_status", { p_event_id: eventId });
    if (error) return { status: null, error: true };

    const status = parseEventRegistrationStatus(data as unknown, eventId);
    return { status, error: status === null };
  } catch {
    // An unavailable registration service must not prevent reading the event.
    return { status: null, error: true };
  }
}
