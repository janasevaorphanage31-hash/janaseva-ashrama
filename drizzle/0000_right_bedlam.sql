CREATE TABLE "admin_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_user_id" integer NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"display_name" text NOT NULL,
	"password_hash" text,
	"role" text DEFAULT 'SUPER_ADMIN' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "ag_call_logs" (
	"log_id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer NOT NULL,
	"caller_id" text NOT NULL,
	"disposition" text NOT NULL,
	"reason" text,
	"callback_time" timestamp,
	"notes" text,
	"amount" integer,
	"utr" text,
	"is_edited" boolean DEFAULT false NOT NULL,
	"edited_at" timestamp,
	"original_disposition" text,
	"original_amount" integer,
	"eod_submitted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ag_daily_submissions" (
	"submission_id" serial PRIMARY KEY NOT NULL,
	"caller_id" text NOT NULL,
	"submission_date" text NOT NULL,
	"total_calls" integer DEFAULT 0 NOT NULL,
	"total_interested" integer DEFAULT 0 NOT NULL,
	"total_donated" integer DEFAULT 0 NOT NULL,
	"claimed_amount" integer DEFAULT 0 NOT NULL,
	"verified_amount" integer DEFAULT 0 NOT NULL,
	"submission_type" text DEFAULT 'MANUAL' NOT NULL,
	"status" text DEFAULT 'SUBMITTED' NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "ag_donations" (
	"txn_id" text PRIMARY KEY NOT NULL,
	"gateway_order_id" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"payment_status" text DEFAULT 'captured' NOT NULL,
	"caller_ref_id" text,
	"lead_id" integer,
	"donor_name" text,
	"donor_phone" text,
	"donor_email" text,
	"metadata" jsonb,
	"verification_status" text DEFAULT 'PENDING_APPROVAL' NOT NULL,
	"verified_amount" integer,
	"verified_by" text,
	"verified_at" timestamp,
	"rejection_reason" text,
	"admin_notes" text,
	"payment_mode" text DEFAULT 'UPI' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ag_leads" (
	"lead_id" serial PRIMARY KEY NOT NULL,
	"stream" text DEFAULT 'DIRECT_DONOR' NOT NULL,
	"name" text NOT NULL,
	"parent_name" text,
	"child_name" text,
	"phone" text NOT NULL,
	"whatsapp_phone" text,
	"email" text,
	"dob_day" integer NOT NULL,
	"dob_month" integer NOT NULL,
	"assigned_caller_id" text,
	"status" text DEFAULT 'Pending' NOT NULL,
	"disposition_reason" text,
	"preferred_language" text,
	"validation_status" text DEFAULT 'UNVERIFIED' NOT NULL,
	"last_donation_year" integer,
	"lifetime_donations" integer DEFAULT 0 NOT NULL,
	"reschedule_date" timestamp,
	"last_contacted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ag_telecallers" (
	"caller_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"whatsapp_number" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"daily_quota" integer DEFAULT 50 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_working_today" boolean DEFAULT true NOT NULL,
	"attendance_date" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ag_telecallers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event" text NOT NULL,
	"session_id" text NOT NULL,
	"meta" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"actor_admin_user_id" integer,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text,
	"before_state" jsonb,
	"after_state" jsonb,
	"ip_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_members" (
	"campaign_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"email" text,
	"role" text DEFAULT 'member' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"occasion" text NOT NULL,
	"campaign_type" text NOT NULL,
	"story" text NOT NULL,
	"cover_image" text,
	"organizer_name" text NOT NULL,
	"organizer_email" text,
	"organizer_phone" text,
	"goal_amount" integer NOT NULL,
	"end_date" timestamp,
	"display_name" text,
	"moderation_note" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"is_sample" boolean DEFAULT false NOT NULL,
	"paused_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "campaigns_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "celebration_bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"reference" text NOT NULL,
	"celebrant_name" text NOT NULL,
	"occasion" text NOT NULL,
	"celebration_date" text NOT NULL,
	"package_id" text NOT NULL,
	"package_name" text NOT NULL,
	"amount" integer NOT NULL,
	"visit_mode" text DEFAULT 'in_person' NOT NULL,
	"time_slot" text,
	"guest_count" text,
	"blessing_message" text,
	"donor_name" text NOT NULL,
	"donor_phone" text NOT NULL,
	"donor_email" text,
	"donor_pan" text,
	"payment_status" text DEFAULT 'pending' NOT NULL,
	"donation_id" integer,
	"celebration_status" text DEFAULT 'CONFIRMED' NOT NULL,
	"photo_proof_url" text,
	"video_proof_url" text,
	"wish_video_url" text,
	"staff_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "celebration_bookings_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "community_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"role" text DEFAULT 'VOLUNTEER' NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"city" text,
	"handle_or_org" text,
	"reach" text,
	"skills" text,
	"message" text,
	"whatsapp_opt_in" boolean DEFAULT true NOT NULL,
	"status" text DEFAULT 'NEW' NOT NULL,
	"admin_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo_url" text,
	"contact_person" text,
	"email" text,
	"phone" text,
	"industry" text,
	"website" text,
	"employee_count" integer,
	"csr_interest" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "companies_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "content_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"author_id" integer,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "content_entries_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "creator_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"slug" text NOT NULL,
	"image_url" text,
	"bio" text,
	"social_links" jsonb,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "creator_profiles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "csr_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer,
	"title" text NOT NULL,
	"period_label" text,
	"content" text,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"version" text,
	"published_on" text,
	"file_url" text,
	"note" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "donation_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"donation_id" integer,
	"item_slug" text,
	"label" text NOT NULL,
	"unit_price" integer NOT NULL,
	"qty" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "donations" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" text NOT NULL,
	"receipt_no" text,
	"status" text DEFAULT 'created' NOT NULL,
	"mode" text DEFAULT 'razorpay' NOT NULL,
	"amount" integer NOT NULL,
	"donor_name" text NOT NULL,
	"donor_email" text NOT NULL,
	"donor_phone" text,
	"anonymous" boolean DEFAULT false NOT NULL,
	"campaign_id" integer,
	"subscription_id" integer,
	"recurring_cycle" integer,
	"razorpay_order_id" text,
	"razorpay_payment_id" text,
	"idempotency_key" text NOT NULL,
	"meta" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"paid_at" timestamp,
	"refunded_at" timestamp,
	CONSTRAINT "donations_public_id_unique" UNIQUE("public_id"),
	CONSTRAINT "donations_receipt_no_unique" UNIQUE("receipt_no"),
	CONSTRAINT "donations_razorpay_order_id_unique" UNIQUE("razorpay_order_id"),
	CONSTRAINT "donations_razorpay_payment_id_unique" UNIQUE("razorpay_payment_id"),
	CONSTRAINT "donations_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "employee_teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"campaign_id" integer,
	"goal_amount" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "employee_teams_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "impact_certificates" (
	"id" serial PRIMARY KEY NOT NULL,
	"reference" text NOT NULL,
	"donation_id" integer NOT NULL,
	"display_name" text,
	"statement" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "impact_certificates_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "impact_gifts" (
	"id" serial PRIMARY KEY NOT NULL,
	"reference" text NOT NULL,
	"donation_id" integer,
	"occasion" text NOT NULL,
	"recipient_name" text NOT NULL,
	"sender_name" text,
	"message" text,
	"allow_sender_name" boolean DEFAULT true NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "impact_gifts_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "impact_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"unit_price" integer NOT NULL,
	"icon" text DEFAULT 'heart' NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"unit_label" text,
	"image_url" text,
	"featured" boolean DEFAULT false NOT NULL,
	"today_need" boolean DEFAULT false NOT NULL,
	"future_flag" boolean DEFAULT false NOT NULL,
	"future_project" boolean,
	"accounting_meaning" text,
	"operational_meaning" text,
	"finance_approval" text DEFAULT 'pending' NOT NULL,
	"accounting_approved" boolean,
	"starts_at" timestamp,
	"ends_at" timestamp,
	"gallery" text,
	"schemes" text,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "impact_items_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "impact_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"value" integer,
	"unit" text,
	"source" text,
	"period_label" text,
	"published" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "impact_metrics_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "impact_missions" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"target_units" integer,
	"unit_label" text,
	"target_amount" integer,
	"mission_type" text DEFAULT 'public' NOT NULL,
	"campaign_id" integer,
	"starts_at" timestamp,
	"ends_at" timestamp,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "impact_missions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "influencer_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"influencer_code" text NOT NULL,
	"display_name" text NOT NULL,
	"instagram_handle" text,
	"whatsapp_number" text NOT NULL,
	"target_goal_amount" integer DEFAULT 50000 NOT NULL,
	"campaign_story" text,
	"cover_image_url" text,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "influencer_profiles_influencer_code_unique" UNIQUE("influencer_code")
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"kind" text NOT NULL,
	"original_url" text,
	"public_url" text,
	"poster_url" text,
	"alt_text" text,
	"caption" text,
	"credit" text,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"reviewed_by" integer,
	"reviewed_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "media_assets_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "media_consents" (
	"id" serial PRIMARY KEY NOT NULL,
	"media_id" integer NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"reviewer_id" integer,
	"restrictions" text,
	"consented_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mission_contributions" (
	"id" serial PRIMARY KEY NOT NULL,
	"mission_id" integer NOT NULL,
	"donation_id" integer NOT NULL,
	"donation_line_id" integer,
	"allocated_amount" integer DEFAULT 0 NOT NULL,
	"allocated_units" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ngo_partners" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"registration_info" text,
	"location" text,
	"focus_areas" text,
	"website" text,
	"contact_name" text,
	"contact_email" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partnership_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"ngo_partner_id" integer,
	"message" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recurring_giving_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"amount" integer NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"provider_subscription_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recurring_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" text NOT NULL,
	"status" text DEFAULT 'created' NOT NULL,
	"mode" text DEFAULT 'razorpay' NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"frequency" text DEFAULT 'monthly' NOT NULL,
	"donor_name" text NOT NULL,
	"donor_email" text NOT NULL,
	"donor_phone" text,
	"donor_pan" text,
	"razorpay_plan_id" text,
	"razorpay_subscription_id" text,
	"mandate_status" text DEFAULT 'pending' NOT NULL,
	"current_cycle" integer DEFAULT 0 NOT NULL,
	"total_cycles" integer DEFAULT 60 NOT NULL,
	"charge_count" integer DEFAULT 0 NOT NULL,
	"next_charge_at" timestamp,
	"last_payment_id" text,
	"last_payment_at" timestamp,
	"cancelled_at" timestamp,
	"cancel_reason" text,
	"idempotency_key" text NOT NULL,
	"meta" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "recurring_subscriptions_public_id_unique" UNIQUE("public_id"),
	CONSTRAINT "recurring_subscriptions_razorpay_subscription_id_unique" UNIQUE("razorpay_subscription_id"),
	CONSTRAINT "recurring_subscriptions_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "today_updates" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"category" text NOT NULL,
	"image_url" text,
	"is_sample" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"published_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "volunteer_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"skills" text,
	"availability" text,
	"interest_area" text NOT NULL,
	"message" text,
	"consent" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'NEW' NOT NULL,
	"admin_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "volunteer_signups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"interest" text NOT NULL,
	"message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whats_app_automation_executions" (
	"id" serial PRIMARY KEY NOT NULL,
	"automation_id" integer NOT NULL,
	"event_id" text NOT NULL,
	"contact_id" integer,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"result" jsonb,
	"error" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	CONSTRAINT "whats_app_automation_executions_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "whats_app_automations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"trigger_type" text NOT NULL,
	"configuration" jsonb DEFAULT '{}'::jsonb,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whats_app_campaign_recipients" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"contact_id" integer NOT NULL,
	"status" text DEFAULT 'QUEUED' NOT NULL,
	"message_id" integer,
	"wam_id" text,
	"failure_reason" text,
	"parameters" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"read_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "whats_app_campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"purpose" text DEFAULT 'ANNADANA_APPEAL' NOT NULL,
	"template_id" integer,
	"template_name" text,
	"audience_criteria" jsonb DEFAULT '{}'::jsonb,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"total_recipients" integer DEFAULT 0 NOT NULL,
	"eligible_recipients" integer DEFAULT 0 NOT NULL,
	"suppressed_recipients" integer DEFAULT 0 NOT NULL,
	"queued_count" integer DEFAULT 0 NOT NULL,
	"sent_count" integer DEFAULT 0 NOT NULL,
	"delivered_count" integer DEFAULT 0 NOT NULL,
	"read_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"scheduled_at" timestamp,
	"created_by" integer,
	"approved_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "whats_app_consents" (
	"id" serial PRIMARY KEY NOT NULL,
	"contact_id" integer NOT NULL,
	"purpose" text DEFAULT 'TRANSACTIONAL' NOT NULL,
	"status" text DEFAULT 'GRANTED' NOT NULL,
	"source" text DEFAULT 'CHECKOUT' NOT NULL,
	"policy_version" text DEFAULT 'v1.0',
	"captured_at" timestamp DEFAULT now() NOT NULL,
	"withdrawn_at" timestamp,
	"evidence_reference" text
);
--> statement-breakpoint
CREATE TABLE "whats_app_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"donor_id" integer,
	"normalized_phone" text NOT NULL,
	"whatsapp_id" text,
	"display_name" text,
	"email" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"custom_fields" jsonb DEFAULT '{}'::jsonb,
	"preferred_language" text DEFAULT 'en' NOT NULL,
	"last_seva_type" text,
	"last_donation_amount" integer,
	"last_donation_at" timestamp,
	"opt_in_status" boolean DEFAULT true NOT NULL,
	"consent_source" text DEFAULT 'DIRECT',
	"consent_timestamp" timestamp DEFAULT now(),
	"opt_out_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "whats_app_contacts_normalized_phone_unique" UNIQUE("normalized_phone")
);
--> statement-breakpoint
CREATE TABLE "whats_app_conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"contact_id" integer NOT NULL,
	"assigned_user_id" integer,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"unread_count" integer DEFAULT 0 NOT NULL,
	"ai_enabled" boolean DEFAULT true NOT NULL,
	"last_inbound_at" timestamp,
	"last_message_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whats_app_knowledge_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"source_type" text DEFAULT 'FAQ' NOT NULL,
	"source_reference" text,
	"language" text DEFAULT 'en' NOT NULL,
	"status" text DEFAULT 'PUBLISHED' NOT NULL,
	"updated_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whats_app_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"contact_id" integer NOT NULL,
	"conversation_id" integer NOT NULL,
	"wam_id" text,
	"direction" text NOT NULL,
	"message_type" text DEFAULT 'text' NOT NULL,
	"content" text,
	"media_url" text,
	"template_name" text,
	"campaign_id" integer,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"failure_code" text,
	"failure_reason" text,
	"raw_payload" jsonb,
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "whats_app_messages_wam_id_unique" UNIQUE("wam_id")
);
--> statement-breakpoint
CREATE TABLE "whats_app_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"meta_template_id" text,
	"name" text NOT NULL,
	"category" text DEFAULT 'UTILITY' NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"components" jsonb DEFAULT '[]'::jsonb,
	"status" text DEFAULT 'APPROVED' NOT NULL,
	"rejection_reason" text,
	"last_synced_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "whats_app_templates_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ag_call_logs" ADD CONSTRAINT "ag_call_logs_lead_id_ag_leads_lead_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."ag_leads"("lead_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ag_donations" ADD CONSTRAINT "ag_donations_lead_id_ag_leads_lead_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."ag_leads"("lead_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ag_leads" ADD CONSTRAINT "ag_leads_assigned_caller_id_ag_telecallers_caller_id_fk" FOREIGN KEY ("assigned_caller_id") REFERENCES "public"."ag_telecallers"("caller_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_admin_user_id_admin_users_id_fk" FOREIGN KEY ("actor_admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_members" ADD CONSTRAINT "campaign_members_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "celebration_bookings" ADD CONSTRAINT "celebration_bookings_donation_id_donations_id_fk" FOREIGN KEY ("donation_id") REFERENCES "public"."donations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_entries" ADD CONSTRAINT "content_entries_author_id_admin_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "csr_reports" ADD CONSTRAINT "csr_reports_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donation_lines" ADD CONSTRAINT "donation_lines_donation_id_donations_id_fk" FOREIGN KEY ("donation_id") REFERENCES "public"."donations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "donations" ADD CONSTRAINT "donations_subscription_id_recurring_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."recurring_subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_teams" ADD CONSTRAINT "employee_teams_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_teams" ADD CONSTRAINT "employee_teams_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "impact_certificates" ADD CONSTRAINT "impact_certificates_donation_id_donations_id_fk" FOREIGN KEY ("donation_id") REFERENCES "public"."donations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "impact_gifts" ADD CONSTRAINT "impact_gifts_donation_id_donations_id_fk" FOREIGN KEY ("donation_id") REFERENCES "public"."donations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "impact_missions" ADD CONSTRAINT "impact_missions_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_reviewed_by_admin_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_consents" ADD CONSTRAINT "media_consents_media_id_media_assets_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media_assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_consents" ADD CONSTRAINT "media_consents_reviewer_id_admin_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_contributions" ADD CONSTRAINT "mission_contributions_mission_id_impact_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."impact_missions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_contributions" ADD CONSTRAINT "mission_contributions_donation_id_donations_id_fk" FOREIGN KEY ("donation_id") REFERENCES "public"."donations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_contributions" ADD CONSTRAINT "mission_contributions_donation_line_id_donation_lines_id_fk" FOREIGN KEY ("donation_line_id") REFERENCES "public"."donation_lines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partnership_requests" ADD CONSTRAINT "partnership_requests_ngo_partner_id_ngo_partners_id_fk" FOREIGN KEY ("ngo_partner_id") REFERENCES "public"."ngo_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whats_app_automation_executions" ADD CONSTRAINT "whats_app_automation_executions_automation_id_whats_app_automations_id_fk" FOREIGN KEY ("automation_id") REFERENCES "public"."whats_app_automations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whats_app_automation_executions" ADD CONSTRAINT "whats_app_automation_executions_contact_id_whats_app_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."whats_app_contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whats_app_automations" ADD CONSTRAINT "whats_app_automations_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whats_app_campaign_recipients" ADD CONSTRAINT "whats_app_campaign_recipients_campaign_id_whats_app_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."whats_app_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whats_app_campaign_recipients" ADD CONSTRAINT "whats_app_campaign_recipients_contact_id_whats_app_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."whats_app_contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whats_app_campaign_recipients" ADD CONSTRAINT "whats_app_campaign_recipients_message_id_whats_app_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."whats_app_messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whats_app_campaigns" ADD CONSTRAINT "whats_app_campaigns_template_id_whats_app_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."whats_app_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whats_app_campaigns" ADD CONSTRAINT "whats_app_campaigns_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whats_app_campaigns" ADD CONSTRAINT "whats_app_campaigns_approved_by_admin_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whats_app_consents" ADD CONSTRAINT "whats_app_consents_contact_id_whats_app_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."whats_app_contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whats_app_contacts" ADD CONSTRAINT "whats_app_contacts_donor_id_donations_id_fk" FOREIGN KEY ("donor_id") REFERENCES "public"."donations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whats_app_conversations" ADD CONSTRAINT "whats_app_conversations_contact_id_whats_app_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."whats_app_contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whats_app_conversations" ADD CONSTRAINT "whats_app_conversations_assigned_user_id_admin_users_id_fk" FOREIGN KEY ("assigned_user_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whats_app_knowledge_documents" ADD CONSTRAINT "whats_app_knowledge_documents_updated_by_admin_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whats_app_messages" ADD CONSTRAINT "whats_app_messages_contact_id_whats_app_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."whats_app_contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whats_app_messages" ADD CONSTRAINT "whats_app_messages_conversation_id_whats_app_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."whats_app_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ag_call_logs_lead_idx" ON "ag_call_logs" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "ag_call_logs_caller_idx" ON "ag_call_logs" USING btree ("caller_id","created_at");--> statement-breakpoint
CREATE INDEX "ag_call_logs_eod_idx" ON "ag_call_logs" USING btree ("caller_id","eod_submitted");--> statement-breakpoint
CREATE INDEX "ag_daily_sub_caller_date_idx" ON "ag_daily_submissions" USING btree ("caller_id","submission_date");--> statement-breakpoint
CREATE INDEX "ag_daily_sub_status_idx" ON "ag_daily_submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ag_donations_caller_idx" ON "ag_donations" USING btree ("caller_ref_id","created_at");--> statement-breakpoint
CREATE INDEX "ag_donations_order_idx" ON "ag_donations" USING btree ("gateway_order_id");--> statement-breakpoint
CREATE INDEX "ag_donations_verif_idx" ON "ag_donations" USING btree ("verification_status","created_at");--> statement-breakpoint
CREATE INDEX "ag_leads_dob_idx" ON "ag_leads" USING btree ("dob_month","dob_day");--> statement-breakpoint
CREATE INDEX "ag_leads_assigned_idx" ON "ag_leads" USING btree ("assigned_caller_id","status");--> statement-breakpoint
CREATE INDEX "ag_leads_phone_idx" ON "ag_leads" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "ag_leads_stream_dob_idx" ON "ag_leads" USING btree ("stream","dob_month","dob_day","status");--> statement-breakpoint
CREATE INDEX "ag_leads_validation_idx" ON "ag_leads" USING btree ("validation_status");--> statement-breakpoint
CREATE INDEX "analytics_event_idx" ON "analytics_events" USING btree ("event");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor_admin_user_id");--> statement-breakpoint
CREATE INDEX "celebration_date_idx" ON "celebration_bookings" USING btree ("celebration_date");--> statement-breakpoint
CREATE INDEX "celebration_status_idx" ON "celebration_bookings" USING btree ("celebration_status");--> statement-breakpoint
CREATE INDEX "comm_mem_role_idx" ON "community_members" USING btree ("role");--> statement-breakpoint
CREATE INDEX "comm_mem_status_idx" ON "community_members" USING btree ("status");--> statement-breakpoint
CREATE INDEX "comm_mem_phone_idx" ON "community_members" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "don_lines_donation_idx" ON "donation_lines" USING btree ("donation_id");--> statement-breakpoint
CREATE INDEX "donations_campaign_idx" ON "donations" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "donations_status_idx" ON "donations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "donations_subscription_idx" ON "donations" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "donations_paid_at_idx" ON "donations" USING btree ("paid_at");--> statement-breakpoint
CREATE INDEX "donations_created_at_idx" ON "donations" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "influencer_code_idx" ON "influencer_profiles" USING btree ("influencer_code");--> statement-breakpoint
CREATE INDEX "influencer_status_idx" ON "influencer_profiles" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "mission_donation_line_unique" ON "mission_contributions" USING btree ("mission_id","donation_id","donation_line_id");--> statement-breakpoint
CREATE INDEX "mission_contrib_mission_idx" ON "mission_contributions" USING btree ("mission_id");--> statement-breakpoint
CREATE INDEX "rec_subs_status_idx" ON "recurring_subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "rec_subs_email_idx" ON "recurring_subscriptions" USING btree ("donor_email");--> statement-breakpoint
CREATE INDEX "rec_subs_rzp_sub_idx" ON "recurring_subscriptions" USING btree ("razorpay_subscription_id");--> statement-breakpoint
CREATE INDEX "volunteer_app_status_idx" ON "volunteer_applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "wa_auto_exec_event_idx" ON "whats_app_automation_executions" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "wa_auto_exec_status_idx" ON "whats_app_automation_executions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "wa_auto_trigger_idx" ON "whats_app_automations" USING btree ("trigger_type","enabled");--> statement-breakpoint
CREATE UNIQUE INDEX "wa_camp_recip_unique" ON "whats_app_campaign_recipients" USING btree ("campaign_id","contact_id");--> statement-breakpoint
CREATE INDEX "wa_camp_recip_status" ON "whats_app_campaign_recipients" USING btree ("campaign_id","status");--> statement-breakpoint
CREATE INDEX "wa_camp_status_idx" ON "whats_app_campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "wa_camp_sched_idx" ON "whats_app_campaigns" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "wa_consents_contact_idx" ON "whats_app_consents" USING btree ("contact_id","purpose");--> statement-breakpoint
CREATE INDEX "wa_contacts_phone_idx" ON "whats_app_contacts" USING btree ("normalized_phone");--> statement-breakpoint
CREATE INDEX "wa_contacts_optin_idx" ON "whats_app_contacts" USING btree ("opt_in_status");--> statement-breakpoint
CREATE INDEX "wa_contacts_donation_idx" ON "whats_app_contacts" USING btree ("last_donation_at");--> statement-breakpoint
CREATE INDEX "wa_conv_contact_idx" ON "whats_app_conversations" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "wa_conv_status_idx" ON "whats_app_conversations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "wa_conv_last_msg_idx" ON "whats_app_conversations" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX "wa_know_type_idx" ON "whats_app_knowledge_documents" USING btree ("source_type","status");--> statement-breakpoint
CREATE INDEX "wa_know_lang_idx" ON "whats_app_knowledge_documents" USING btree ("language");--> statement-breakpoint
CREATE INDEX "wa_msg_conv_idx" ON "whats_app_messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "wa_msg_wamid_idx" ON "whats_app_messages" USING btree ("wam_id");--> statement-breakpoint
CREATE INDEX "wa_msg_contact_idx" ON "whats_app_messages" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "wa_tpl_name_idx" ON "whats_app_templates" USING btree ("name");--> statement-breakpoint
CREATE INDEX "wa_tpl_status_idx" ON "whats_app_templates" USING btree ("status");