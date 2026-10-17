-- 0019_notification_channel_in_app.sql
-- A new enum value must be committed before it can be used, so it has its own migration.
alter type public.notification_channel add value if not exists 'in_app';
