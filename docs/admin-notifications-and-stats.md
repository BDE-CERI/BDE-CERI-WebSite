# Admin notifications and visitor statistics

## Unread content badges

Apply `supabase/migrations/202610100001_admin_activity_notifications.sql`. Database triggers record new events, event registrations, news, poles, account email requests, and member badges. The restricted board sees the unread count in the matching admin sections and overview cards. Visiting a section marks its notices read for that member; notices are stored per board account, and the shared activity feed is visible only after MFA.

The notification badge is separate from the existing total item count. The migration starts tracking new inserts when it is applied; it does not mark old records as new.

## Visitor statistics 503 errors

The local `.env` must provide a server-only Supabase key and an HMAC secret:

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
VISITOR_HASH_SECRET=your-random-secret-at-least-32-bytes
```

Recent Supabase secret API keys can be supplied as `SUPABASE_SECRET_KEY` instead of `SUPABASE_SERVICE_ROLE_KEY`. Never prefix either variable with `NEXT_PUBLIC_` or expose its value to browser code.

Generate a 32-byte HMAC secret in PowerShell with `[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).ToLowerInvariant()`, then set the resulting value in your local environment and deployment. For Vercel, add both variables under **Project → Settings → Environment Variables** for Production (and Preview if needed), then redeploy. The server key is needed to read protected counters and call the visit-recording RPC; `VISITOR_HASH_SECRET` is needed to hash IP addresses before database storage.

Apply both `202610080001_visitor_analytics.sql` and `202610090002_visitor_paris_timezone.sql` to Supabase. The API now returns distinct internal error codes for missing server configuration and database query failures, and logs the failing query on the server without sending database details to the browser.
