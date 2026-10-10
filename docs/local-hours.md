# Local BDE hours and the Taverne

## Supabase setup

Apply `supabase/migrations/202610090011_local_hours_and_keyholders.sql` in the Supabase SQL editor (or through the project migration workflow). It adds `members.is_keyholder`, the editable hours and messages, and the weekday shift table with row-level security.

After applying the migration, bureau members can mark keyholders under **Profil → Membres & rôles**. The restricted board can manage local hours after completing MFA. Keyholders in the bureau can also manage the shifts and messages from **Profil → Local**. Only members marked as keyholders can be assigned to a shift.

## Opening rules

- Possible hours default to Monday through Friday, 08:30–19:00, in the `Europe/Paris` time zone.
- The local and the Taverne count as open only while an announced weekday shift is active and a keyholder is assigned. Weekends and French public holidays are always closed.
- Create and update shifts under **Profil → Local**. A shift must fit inside the configured possible hours, and shifts on the same day cannot overlap.
- The floating local-hours panel shows the current state, keyholder, weekly shifts, 90-minute time markers, and the current-time position. The Contact page displays the possible hours and explains that the local may be closed if nobody is present.
- When closed, the HelloAsso frame is covered and disabled, checkout links are hidden, and the Taverne purchase server action checks the active shift before changing stock. Branding products remain available independently of the local schedule.

Messages for open, no posted shift, before opening, after closing, weekends, and holidays can be edited in French and English. Supported placeholders are `{opening}`, `{closing}`, `{responsible}`, `{next_day}`, and `{next_opening}`.

To change the default messages before the migration is applied, edit the `messages` JSON default and insert in the migration. After application, update them through **Profil → Local**.
