# Data dictionary

Generated from the migrations (`supabase/migrations`). Money is in sen (1 RM = 100 sen). Do not edit by hand; regenerate after schema changes.


## `addresses`

Saved customer addresses (home, shop, office). Contractors see a snapshot on the booking, not this table.


| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` |  |
| `customer_id` | uuid | no |  |  |
| `label` | text | no | `'Home'::text` |  |
| `line1` | text | no |  |  |
| `line2` | text | yes |  |  |
| `postcode` | text | yes |  |  |
| `service_area_id` | integer | yes |  |  |
| `latitude` | numeric | yes |  |  |
| `longitude` | numeric | yes |  |  |
| `access_notes` | text | yes |  |  |
| `is_default` | boolean | no | `false` |  |
| `created_at` | timestamp with time zone | no | `now()` |  |
| `updated_at` | timestamp with time zone | no | `now()` |  |

## `audit_log`

Who viewed or changed a unit record, a payout or a dispute decision.


| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | bigint | no |  |  |
| `actor_id` | uuid | yes |  |  |
| `action` | text | no |  |  |
| `entity_type` | text | no |  |  |
| `entity_id` | uuid | yes |  |  |
| `company_id` | uuid | yes |  |  |
| `meta` | jsonb | no | `'{}'::jsonb` |  |
| `created_at` | timestamp with time zone | no | `now()` |  |

## `booking_items`

The units and services in a booking. Prices come from the contractor price list, not from the client.


| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` |  |
| `booking_id` | uuid | no |  |  |
| `unit_id` | uuid | no |  |  |
| `service_type_code` | text | no |  |  |
| `description` | text | yes |  |  |
| `quantity` | integer | no | `1` |  |
| `unit_price_sen` | bigint | no | `0` |  |
| `line_total_sen` | bigint | yes |  |  |

## `booking_messages`

Chat between customer and contractor on a booking.


| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` |  |
| `booking_id` | uuid | no |  |  |
| `sender_id` | uuid | no |  |  |
| `body` | text | no |  |  |
| `created_at` | timestamp with time zone | no | `now()` |  |

## `bookings`

One customer, one contractor company. Status changes only through the transition functions.


| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` |  |
| `booking_no` | text | no | `((('AC-'::text || to_char(now(), 'YYMM':` |  |
| `customer_id` | uuid | no |  |  |
| `company_id` | uuid | no |  |  |
| `address_id` | uuid | yes |  |  |
| `address_snapshot` | jsonb | no | `'{}'::jsonb` |  |
| `status` | booking_status | no | `'requested'::booking_status` |  |
| `fault_description` | text | yes |  |  |
| `customer_notes` | text | yes |  |  |
| `requested_start` | timestamp with time zone | yes |  |  |
| `scheduled_start` | timestamp with time zone | yes |  |  |
| `scheduled_end` | timestamp with time zone | yes |  |  |
| `assigned_to` | uuid | yes |  |  |
| `subtotal_sen` | bigint | no | `0` |  |
| `call_out_fee_sen` | bigint | no | `0` |  |
| `total_sen` | bigint | yes |  |  |
| `commission_bps` | integer | yes |  |  |
| `accepted_at` | timestamp with time zone | yes |  |  |
| `paid_at` | timestamp with time zone | yes |  |  |
| `completed_at` | timestamp with time zone | yes |  |  |
| `auto_confirm_at` | timestamp with time zone | yes |  |  |
| `confirmed_at` | timestamp with time zone | yes |  |  |
| `cancelled_at` | timestamp with time zone | yes |  |  |
| `cancel_reason` | text | yes |  |  |
| `created_at` | timestamp with time zone | no | `now()` |  |
| `updated_at` | timestamp with time zone | no | `now()` |  |

## `companies`

Contractor companies. Each company is an isolated workspace.


| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` |  |
| `slug` | text | yes |  |  |
| `name` | text | no |  |  |
| `legal_name` | text | no |  |  |
| `ssm_number` | text | no |  |  |
| `description` | text | yes |  |  |
| `phone` | text | yes |  |  |
| `email` | text | yes |  |  |
| `logo_path` | text | yes |  |  |
| `status` | company_status | no | `'pending'::company_status` |  |
| `verified_at` | timestamp with time zone | yes |  |  |
| `verified_by` | uuid | yes |  |  |
| `suspended_reason` | text | yes |  |  |
| `rating_avg` | numeric | no | `0` |  |
| `rating_count` | integer | no | `0` |  |
| `created_by` | uuid | yes |  |  |
| `created_at` | timestamp with time zone | no | `now()` |  |
| `updated_at` | timestamp with time zone | no | `now()` |  |

## `company_documents`

SSM registration, licences, insurance and identity documents reviewed by admin.


| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` |  |
| `company_id` | uuid | no |  |  |
| `doc_type` | document_type | no |  |  |
| `storage_path` | text | no |  |  |
| `status` | review_state | no | `'pending'::review_state` |  |
| `expires_on` | date | yes |  |  |
| `reviewed_by` | uuid | yes |  |  |
| `reviewed_at` | timestamp with time zone | yes |  |  |
| `review_note` | text | yes |  |  |
| `created_at` | timestamp with time zone | no | `now()` |  |

## `company_members`

Staff of a contractor company: owner, dispatcher or technician.


| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `company_id` | uuid | no |  |  |
| `user_id` | uuid | no |  |  |
| `role` | company_role | no |  |  |
| `is_active` | boolean | no | `true` |  |
| `created_at` | timestamp with time zone | no | `now()` |  |

## `company_service_areas`

Where a company works, with its call-out fee per area.


| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `company_id` | uuid | no |  |  |
| `service_area_id` | integer | no |  |  |
| `call_out_fee_sen` | bigint | no | `0` |  |

## `company_services`

A contractor price list: fixed price per service type and unit type.


| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` |  |
| `company_id` | uuid | no |  |  |
| `service_type_code` | text | no |  |  |
| `unit_type` | unit_type | yes |  |  |
| `price_sen` | bigint | yes |  |  |
| `duration_minutes` | integer | yes |  |  |
| `is_active` | boolean | no | `true` |  |
| `created_at` | timestamp with time zone | no | `now()` |  |
| `updated_at` | timestamp with time zone | no | `now()` |  |

## `company_subscriptions`

The plan a company is on. A new company starts on the Starter plan.


| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` |  |
| `company_id` | uuid | no |  |  |
| `plan_code` | text | no |  |  |
| `status` | subscription_status | no | `'active'::subscription_status` |  |
| `started_at` | timestamp with time zone | no | `now()` |  |
| `current_period_end` | timestamp with time zone | yes |  |  |
| `cancelled_at` | timestamp with time zone | yes |  |  |
| `gateway_ref` | text | yes |  |  |
| `created_at` | timestamp with time zone | no | `now()` |  |

## `dispute_messages`


| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` |  |
| `dispute_id` | uuid | no |  |  |
| `author_id` | uuid | no |  |  |
| `body` | text | no |  |  |
| `attachment_paths` | ARRAY | no | `'{}'::text[]` |  |
| `created_at` | timestamp with time zone | no | `now()` |  |

## `disputes`

Customer or contractor disputes. An open dispute freezes the payout until admin decides.


| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` |  |
| `booking_id` | uuid | no |  |  |
| `raised_by` | uuid | no |  |  |
| `reason` | text | no |  |  |
| `status` | dispute_status | no | `'open'::dispute_status` |  |
| `refund_sen` | bigint | no | `0` |  |
| `resolution_note` | text | yes |  |  |
| `decided_by` | uuid | yes |  |  |
| `decided_at` | timestamp with time zone | yes |  |  |
| `created_at` | timestamp with time zone | no | `now()` |  |
| `updated_at` | timestamp with time zone | no | `now()` |  |

## `job_report_parts`

Parts replaced or fitted during a job.


| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` |  |
| `job_report_id` | uuid | no |  |  |
| `description` | text | no |  |  |
| `quantity` | integer | no | `1` |  |
| `unit_price_sen` | bigint | yes |  |  |

## `job_report_photos`

Before and after photos, nameplate and fault photos for a job report.


| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` |  |
| `job_report_id` | uuid | no |  |  |
| `storage_path` | text | no |  |  |
| `kind` | photo_kind | no | `'other'::photo_kind` |  |
| `caption` | text | yes |  |  |
| `created_at` | timestamp with time zone | no | `now()` |  |

## `job_reports`

The unit history. One report per unit per job; final reports cannot be changed or deleted.


| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` |  |
| `booking_id` | uuid | no |  |  |
| `unit_id` | uuid | no |  |  |
| `company_id` | uuid | no |  |  |
| `author_id` | uuid | no |  |  |
| `supersedes_id` | uuid | yes |  |  |
| `status` | report_status | no | `'draft'::report_status` |  |
| `work_done` | text | no |  |  |
| `findings` | text | yes |  |  |
| `refrigerant_type` | text | yes |  |  |
| `gas_added_grams` | integer | yes |  |  |
| `readings` | jsonb | no | `'{}'::jsonb` |  |
| `recommended_next_service_on` | date | yes |  |  |
| `customer_signoff_name` | text | yes |  |  |
| `customer_signoff_at` | timestamp with time zone | yes |  |  |
| `finalised_at` | timestamp with time zone | yes |  |  |
| `created_at` | timestamp with time zone | no | `now()` |  |
| `updated_at` | timestamp with time zone | no | `now()` |  |

## `ledger_entries`

Append-only money ledger. +payment_received, -commission, -gateway_fee, -payout, -refund.


| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | bigint | no |  |  |
| `booking_id` | uuid | no |  |  |
| `company_id` | uuid | yes |  |  |
| `payment_id` | uuid | yes |  |  |
| `payout_id` | uuid | yes |  |  |
| `entry_type` | ledger_entry_type | no |  |  |
| `amount_sen` | bigint | no |  |  |
| `memo` | text | yes |  |  |
| `created_at` | timestamp with time zone | no | `now()` |  |

## `notifications`

Outbound WhatsApp, push and email messages, sent by a worker.


| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` |  |
| `user_id` | uuid | no |  |  |
| `channel` | notification_channel | no |  |  |
| `template` | text | no |  |  |
| `payload` | jsonb | no | `'{}'::jsonb` |  |
| `status` | notification_status | no | `'queued'::notification_status` |  |
| `attempts` | smallint | no | `0` |  |
| `sent_at` | timestamp with time zone | yes |  |  |
| `error` | text | yes |  |  |
| `created_at` | timestamp with time zone | no | `now()` |  |

## `payments`

Customer payments through the gateway. The platform holds the funds until the booking is closed.


| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` |  |
| `booking_id` | uuid | no |  |  |
| `customer_id` | uuid | no |  |  |
| `method` | payment_method | yes |  |  |
| `gateway` | text | no |  |  |
| `gateway_ref` | text | no |  |  |
| `amount_sen` | bigint | no |  |  |
| `refunded_sen` | bigint | no | `0` |  |
| `status` | payment_status | no | `'pending'::payment_status` |  |
| `paid_at` | timestamp with time zone | yes |  |  |
| `created_at` | timestamp with time zone | no | `now()` |  |
| `updated_at` | timestamp with time zone | no | `now()` |  |

## `payouts`

One payout per closed booking: gross, less commission and gateway fee.


| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` |  |
| `company_id` | uuid | no |  |  |
| `booking_id` | uuid | no |  |  |
| `gross_sen` | bigint | no |  |  |
| `commission_sen` | bigint | no |  |  |
| `gateway_fee_sen` | bigint | no | `0` |  |
| `net_sen` | bigint | no |  |  |
| `status` | payout_status | no | `'queued'::payout_status` |  |
| `scheduled_for` | date | no |  |  |
| `paid_at` | timestamp with time zone | yes |  |  |
| `gateway_ref` | text | yes |  |  |
| `created_at` | timestamp with time zone | no | `now()` |  |
| `updated_at` | timestamp with time zone | no | `now()` |  |

## `platform_admins`

Platform operations staff. Rows are managed with the service role only.


| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `user_id` | uuid | no |  |  |
| `created_at` | timestamp with time zone | no | `now()` |  |

## `platform_settings`

Tunable platform rules, such as the auto-confirm window.


| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `key` | text | no |  |  |
| `value` | jsonb | no |  |  |
| `description` | text | yes |  |  |
| `updated_at` | timestamp with time zone | no | `now()` |  |

## `profiles`

One row per user. Customer, contractor staff and admin are roles of the same person.


| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no |  |  |
| `full_name` | text | no | `''::text` |  |
| `phone` | text | yes |  |  |
| `email` | text | yes |  |  |
| `locale` | text | no | `'en'::text` |  |
| `notify_whatsapp` | boolean | no | `true` |  |
| `notify_push` | boolean | no | `true` |  |
| `notify_email` | boolean | no | `true` |  |
| `created_at` | timestamp with time zone | no | `now()` |  |
| `updated_at` | timestamp with time zone | no | `now()` |  |

## `quote_lines`


| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` |  |
| `quote_id` | uuid | no |  |  |
| `kind` | quote_line_kind | no | `'other'::quote_line_kind` |  |
| `description` | text | no |  |  |
| `quantity` | integer | no | `1` |  |
| `unit_price_sen` | bigint | no |  |  |
| `line_total_sen` | bigint | yes |  |  |
| `sort_order` | smallint | no | `0` |  |

## `quotes`

Quote path for repair, install and gas top-up. The customer pays only after accepting.


| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` |  |
| `booking_id` | uuid | no |  |  |
| `version` | integer | no | `1` |  |
| `status` | quote_status | no | `'draft'::quote_status` |  |
| `valid_until` | timestamp with time zone | yes |  |  |
| `note` | text | yes |  |  |
| `created_by` | uuid | yes |  |  |
| `sent_at` | timestamp with time zone | yes |  |  |
| `decided_at` | timestamp with time zone | yes |  |  |
| `created_at` | timestamp with time zone | no | `now()` |  |

## `reviews`

One review per closed booking. Admin can remove a review but cannot change its rating.


| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` |  |
| `booking_id` | uuid | no |  |  |
| `customer_id` | uuid | no |  |  |
| `company_id` | uuid | no |  |  |
| `rating` | smallint | no |  |  |
| `comment` | text | yes |  |  |
| `company_reply` | text | yes |  |  |
| `replied_at` | timestamp with time zone | yes |  |  |
| `visibility` | review_visibility | no | `'visible'::review_visibility` |  |
| `removed_reason` | text | yes |  |  |
| `removed_by` | uuid | yes |  |  |
| `created_at` | timestamp with time zone | no | `now()` |  |

## `service_areas`

State and district pairs that contractors can serve and customers can book in.


| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | integer | no |  |  |
| `state` | text | no |  |  |
| `district` | text | no |  |  |
| `is_active` | boolean | no | `true` |  |

## `service_reminders`

Next-service reminders per unit, created when a job report is finalised.


| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` |  |
| `unit_id` | uuid | no |  |  |
| `service_type_code` | text | no |  |  |
| `due_on` | date | no |  |  |
| `status` | reminder_status | no | `'pending'::reminder_status` |  |
| `source_report_id` | uuid | yes |  |  |
| `sent_at` | timestamp with time zone | yes |  |  |
| `created_at` | timestamp with time zone | no | `now()` |  |

## `service_types`

Kinds of job. requires_quote sends the booking through the quote path; default_interval_months drives reminders.


| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `code` | text | no |  |  |
| `name` | text | no |  |  |
| `description` | text | yes |  |  |
| `requires_quote` | boolean | no | `false` |  |
| `default_interval_months` | smallint | yes |  |  |
| `sort_order` | smallint | no | `0` |  |
| `is_active` | boolean | no | `true` |  |

## `subscription_invoices`

Billing history for contractor subscriptions.


| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` |  |
| `company_id` | uuid | no |  |  |
| `subscription_id` | uuid | no |  |  |
| `period_start` | date | no |  |  |
| `period_end` | date | no |  |  |
| `amount_sen` | bigint | no |  |  |
| `status` | invoice_status | no | `'open'::invoice_status` |  |
| `paid_at` | timestamp with time zone | yes |  |  |
| `gateway_ref` | text | yes |  |  |
| `created_at` | timestamp with time zone | no | `now()` |  |

## `subscription_plans`

Contractor plans. commission_bps is in basis points (1000 = 10%). Values are proposed starting points.


| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `code` | text | no |  |  |
| `name` | text | no |  |  |
| `monthly_fee_sen` | bigint | no |  |  |
| `commission_bps` | integer | no |  |  |
| `max_members` | integer | yes |  |  |
| `features` | jsonb | no | `'[]'::jsonb` |  |
| `is_available` | boolean | no | `true` |  |
| `sort_order` | smallint | no | `0` |  |

## `unit_access_grants`

Which contractor company may read which unit. Created by a booking; the customer can revoke after the job is closed.


| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` |  |
| `unit_id` | uuid | no |  |  |
| `company_id` | uuid | no |  |  |
| `booking_id` | uuid | no |  |  |
| `granted_at` | timestamp with time zone | no | `now()` |  |
| `revoked_at` | timestamp with time zone | yes |  |  |
| `revoked_by` | uuid | yes |  |  |

## `units`

Customer-owned aircond units. The core asset of the platform.


| Column | Type | Null | Default | Notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` |  |
| `customer_id` | uuid | no |  |  |
| `address_id` | uuid | yes |  |  |
| `nickname` | text | yes |  |  |
| `brand` | text | yes |  |  |
| `model` | text | yes |  |  |
| `serial_number` | text | yes |  |  |
| `unit_type` | unit_type | no | `'wall_split'::unit_type` |  |
| `horsepower` | numeric | yes |  |  |
| `refrigerant` | text | yes |  |  |
| `install_date` | date | yes |  |  |
| `warranty_ends_on` | date | yes |  |  |
| `location_in_property` | text | yes |  |  |
| `nameplate_photo_path` | text | yes |  |  |
| `notes` | text | yes |  |  |
| `is_archived` | boolean | no | `false` |  |
| `created_at` | timestamp with time zone | no | `now()` |  |
| `updated_at` | timestamp with time zone | no | `now()` |  |
