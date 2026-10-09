export type AccountEmailRequestStatus = "pending" | "resolved" | "rejected";
export type AccountEmailRequestReviewStatus = Exclude<AccountEmailRequestStatus, "pending">;
export type AccountActionResult = { error?: string; success?: boolean };

export type AccountEmailRequest = {
  id: string;
  member_id: string;
  requested_by: string;
  current_email: string;
  requested_email: string;
  reason: string;
  status: AccountEmailRequestStatus;
  created_at: string;
  reviewed_at: string | null;
  review_response: string | null;
  requester_name?: string;
};
