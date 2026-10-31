import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/** Impact areas shown in the Impact Cart. Prices are admin-controlled and enforced server-side. */
export const impactItems = pgTable("impact_items", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  unitPrice: integer("unit_price").notNull(), // INR (whole rupees)
  icon: text("icon").notNull().default("heart"),
  category: text("category").notNull().default("general"),
  unitLabel: text("unit_label"),
  imageUrl: text("image_url"),
  featured: boolean("featured").notNull().default(false),
  todayNeed: boolean("today_need").notNull().default(false),
  futureFlag: boolean("future_flag").notNull().default(false),
  /** Legacy column retained so safe synchronization never drops existing data. */
  legacyFutureProject: boolean("future_project"),
  accountingMeaning: text("accounting_meaning"),
  operationalMeaning: text("operational_meaning"),
  financeApproval: text("finance_approval").notNull().default("pending"),
  /** Legacy approval column retained during the non-destructive migration window. */
  legacyAccountingApproved: boolean("accounting_approved"),
  startsAt: timestamp("starts_at"),
  endsAt: timestamp("ends_at"),
  gallery: text("gallery"),
  schemes: text("schemes"),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

/** "Today at Janaseva" feed. */
export const todayUpdates = pgTable("today_updates", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url"),
  isSample: boolean("is_sample").notNull().default(false),
  status: text("status").notNull().default("published"),
  publishedAt: timestamp("published_at").notNull().defaultNow(),
});

/** Personal / community fundraising campaigns (reviewed before going live). */
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  occasion: text("occasion").notNull(),
  campaignType: text("campaign_type").notNull(),
  story: text("story").notNull(),
  coverImage: text("cover_image"),
  organizerName: text("organizer_name").notNull(),
  organizerEmail: text("organizer_email"),
  organizerPhone: text("organizer_phone"),
  goalAmount: integer("goal_amount").notNull(),
  endDate: timestamp("end_date"),
  displayName: text("display_name"),
  moderationNote: text("moderation_note"),
  status: text("status").notNull().default("pending"),
  isSample: boolean("is_sample").notNull().default(false),
  /** Existing operational fields are retained for compatibility with the current local database. */
  pausedAt: timestamp("paused_at"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** Campaign members are kept separate from public campaign progress. */
export const campaignMembers = pgTable("campaign_members", {
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  id: serial("id").primaryKey(),
  displayName: text("display_name").notNull(),
  email: text("email"),
  role: text("role").notNull().default("member"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** V1.1 Impact mission foundation. */
export const impactMissions = pgTable("impact_missions", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  targetUnits: integer("target_units"),
  unitLabel: text("unit_label"),
  targetAmount: integer("target_amount"),
  missionType: text("mission_type").notNull().default("public"),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  startsAt: timestamp("starts_at"),
  endsAt: timestamp("ends_at"),
  status: text("status").notNull().default("DRAFT"), // DRAFT|ACTIVE|PAUSED|COMPLETED|EXPIRED|ARCHIVED
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const recurringSubscriptions = pgTable(
  "recurring_subscriptions",
  {
    id: serial("id").primaryKey(),
    publicId: text("public_id").notNull().unique(), // e.g. "sub_pub_..."
    status: text("status").notNull().default("created"), // created|authenticated|active|halted|cancelled|completed|demo
    mode: text("mode").notNull().default("razorpay"), // razorpay|demo
    amount: integer("amount").notNull(), // Monthly INR amount
    currency: text("currency").notNull().default("INR"),
    frequency: text("frequency").notNull().default("monthly"),
    donorName: text("donor_name").notNull(),
    donorEmail: text("donor_email").notNull(),
    donorPhone: text("donor_phone"),
    donorPan: text("donor_pan"),
    razorpayPlanId: text("razorpay_plan_id"),
    razorpaySubscriptionId: text("razorpay_subscription_id").unique(),
    mandateStatus: text("mandate_status").notNull().default("pending"), // pending|active|failed|cancelled
    currentCycle: integer("current_cycle").notNull().default(0),
    totalCycles: integer("total_cycles").notNull().default(60),
    chargeCount: integer("charge_count").notNull().default(0),
    nextChargeAt: timestamp("next_charge_at"),
    lastPaymentId: text("last_payment_id"),
    lastPaymentAt: timestamp("last_payment_at"),
    cancelledAt: timestamp("cancelled_at"),
    cancelReason: text("cancel_reason"),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    meta: jsonb("meta"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("rec_subs_status_idx").on(t.status),
    index("rec_subs_email_idx").on(t.donorEmail),
    index("rec_subs_rzp_sub_idx").on(t.razorpaySubscriptionId),
  ],
);

export const donations = pgTable(
  "donations",
  {
    id: serial("id").primaryKey(),
    publicId: text("public_id").notNull().unique(),
    receiptNo: text("receipt_no").unique(),
    status: text("status").notNull().default("created"), // created|paid|refunded|demo
    mode: text("mode").notNull().default("razorpay"),
    amount: integer("amount").notNull(),
    donorName: text("donor_name").notNull(),
    donorEmail: text("donor_email").notNull(),
    donorPhone: text("donor_phone"),
    anonymous: boolean("anonymous").notNull().default(false),
    campaignId: integer("campaign_id").references(() => campaigns.id),
    subscriptionId: integer("subscription_id").references(() => recurringSubscriptions.id, { onDelete: "set null" }),
    recurringCycle: integer("recurring_cycle"),
    razorpayOrderId: text("razorpay_order_id").unique(),
    razorpayPaymentId: text("razorpay_payment_id").unique(),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    meta: jsonb("meta"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    paidAt: timestamp("paid_at"),
    refundedAt: timestamp("refunded_at"),
  },
  (t) => [
    index("donations_campaign_idx").on(t.campaignId),
    index("donations_status_idx").on(t.status),
    index("donations_subscription_idx").on(t.subscriptionId),
    index("donations_paid_at_idx").on(t.paidAt),
    index("donations_created_at_idx").on(t.createdAt),
  ],
);

export const donationLines = pgTable(
  "donation_lines",
  {
    id: serial("id").primaryKey(),
    donationId: integer("donation_id")
      .references(() => donations.id, { onDelete: "cascade" }),
    itemSlug: text("item_slug"),
    label: text("label").notNull(),
    unitPrice: integer("unit_price").notNull(),
    qty: integer("qty").notNull(),
  },
  (t) => [
    index("don_lines_donation_idx").on(t.donationId),
  ],
);

/** Donation support tagged to missions; only paid non-refunded donations count. */
export const missionContributions = pgTable(
  "mission_contributions",
  {
    id: serial("id").primaryKey(),
    missionId: integer("mission_id")
      .notNull()
      .references(() => impactMissions.id, { onDelete: "cascade" }),
    donationId: integer("donation_id")
      .notNull()
      .references(() => donations.id, { onDelete: "cascade" }),
    donationLineId: integer("donation_line_id").references(() => donationLines.id, { onDelete: "cascade" }),
    allocatedAmount: integer("allocated_amount").notNull().default(0),
    allocatedUnits: integer("allocated_units").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("mission_donation_line_unique").on(t.missionId, t.donationId, t.donationLineId), index("mission_contrib_mission_idx").on(t.missionId)],
);

/** V1.1 Gift an Impact records. */
export const impactGifts = pgTable("impact_gifts", {
  id: serial("id").primaryKey(),
  reference: text("reference").notNull().unique(),
  donationId: integer("donation_id")
    .references(() => donations.id, { onDelete: "cascade" }),
  occasion: text("occasion").notNull(),
  recipientName: text("recipient_name").notNull(),
  senderName: text("sender_name"),
  message: text("message"),
  allowSenderName: boolean("allow_sender_name").notNull().default(true),
  status: text("status").notNull().default("pending"), // pending|ready|cancelled
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** V1.1 Impact certificates generated server-side from verified donations. */
export const impactCertificates = pgTable("impact_certificates", {
  id: serial("id").primaryKey(),
  reference: text("reference").notNull().unique(),
  donationId: integer("donation_id")
    .notNull()
    .references(() => donations.id, { onDelete: "cascade" }),
  displayName: text("display_name"),
  statement: text("statement").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** Transparency documents: name + publication date + version. */
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  version: text("version"),
  publishedOn: text("published_on"),
  fileUrl: text("file_url"),
  note: text("note"),
  status: text("status").notNull().default("pending"),
  sortOrder: integer("sort_order").notNull().default(0),
});

/** Verified impact numbers. Public UI must only use published rows. */
export const impactMetrics = pgTable("impact_metrics", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  label: text("label").notNull(),
  value: integer("value"),
  unit: text("unit"),
  source: text("source"),
  periodLabel: text("period_label"),
  published: boolean("published").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

/** Legacy V1 volunteer form table (kept for compatibility). */
export const volunteerSignups = pgTable("volunteer_signups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  interest: text("interest").notNull(),
  message: text("message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** V1.1 volunteer pipeline entity with statuses. */
export const volunteerApplications = pgTable(
  "volunteer_applications",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    skills: text("skills"),
    availability: text("availability"),
    interestArea: text("interest_area").notNull(),
    message: text("message"),
    consent: boolean("consent").notNull().default(false),
    status: text("status").notNull().default("NEW"), // NEW|REVIEWING|CONTACTED|APPROVED|DECLINED|COMPLETED
    adminNotes: text("admin_notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("volunteer_app_status_idx").on(t.status)],
);

/** V2 foundation: company impact hub. */
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
  contactPerson: text("contact_person"),
  email: text("email"),
  phone: text("phone"),
  industry: text("industry"),
  website: text("website"),
  employeeCount: integer("employee_count"),
  csrInterest: text("csr_interest"),
  status: text("status").notNull().default("PENDING"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const employeeTeams = pgTable("employee_teams", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  goalAmount: integer("goal_amount"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const creatorProfiles = pgTable("creator_profiles", {
  id: serial("id").primaryKey(),
  displayName: text("display_name").notNull(),
  slug: text("slug").notNull().unique(),
  imageUrl: text("image_url"),
  bio: text("bio"),
  socialLinks: jsonb("social_links"),
  status: text("status").notNull().default("PENDING"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const ngoPartners = pgTable("ngo_partners", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  registrationInfo: text("registration_info"),
  location: text("location"),
  focusAreas: text("focus_areas"),
  website: text("website"),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  status: text("status").notNull().default("PENDING"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const partnershipRequests = pgTable("partnership_requests", {
  id: serial("id").primaryKey(),
  ngoPartnerId: integer("ngo_partner_id").references(() => ngoPartners.id, { onDelete: "cascade" }),
  message: text("message"),
  status: text("status").notNull().default("PENDING"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const csrReports = pgTable("csr_reports", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  periodLabel: text("period_label"),
  content: text("content"),
  status: text("status").notNull().default("DRAFT"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** First-party journey analytics. */
export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: serial("id").primaryKey(),
    event: text("event").notNull(),
    sessionId: text("session_id").notNull(),
    meta: jsonb("meta"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("analytics_event_idx").on(t.event)],
);


export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  passwordHash: text("password_hash"),
  role: text("role").notNull().default("SUPER_ADMIN"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const adminSessions = pgTable("admin_sessions", {
  id: text("id").primaryKey(),
  adminUserId: integer("admin_user_id").notNull().references(() => adminUsers.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  actorAdminUserId: integer("actor_admin_user_id").references(() => adminUsers.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  beforeState: jsonb("before_state"),
  afterState: jsonb("after_state"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("audit_logs_entity_idx").on(t.entity, t.entityId), index("audit_logs_actor_idx").on(t.actorAdminUserId)]);

export const mediaAssets = pgTable("media_assets", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  kind: text("kind").notNull(),
  originalUrl: text("original_url"),
  publicUrl: text("public_url"),
  posterUrl: text("poster_url"),
  altText: text("alt_text"),
  caption: text("caption"),
  credit: text("credit"),
  status: text("status").notNull().default("DRAFT"),
  reviewedBy: integer("reviewed_by").references(() => adminUsers.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const mediaConsents = pgTable("media_consents", {
  id: serial("id").primaryKey(),
  mediaId: integer("media_id").notNull().references(() => mediaAssets.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("PENDING"),
  reviewerId: integer("reviewer_id").references(() => adminUsers.id, { onDelete: "set null" }),
  restrictions: text("restrictions"),
  consentedAt: timestamp("consented_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const contentEntries = pgTable("content_entries", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  status: text("status").notNull().default("DRAFT"),
  authorId: integer("author_id").references(() => adminUsers.id, { onDelete: "set null" }),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/** Regular-giving interest. Automatic billing is not activated by this record alone. */
export const recurringGivingRequests = pgTable("recurring_giving_requests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  amount: integer("amount").notNull(),
  status: text("status").notNull().default("PENDING"),
  providerSubscriptionId: text("provider_subscription_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** Special Day Celebrations (Birthdays, Anniversaries, Memorials, Milestones). */
export const celebrationBookings = pgTable(
  "celebration_bookings",
  {
    id: serial("id").primaryKey(),
    reference: text("reference").notNull().unique(), // e.g. "JA-CELEB-202610-8492"
    celebrantName: text("celebrant_name").notNull(),
    occasion: text("occasion").notNull(), // Birthday | Anniversary | Memorial | Milestone | Festival | Other
    celebrationDate: text("celebration_date").notNull(), // YYYY-MM-DD
    packageId: text("package_id").notNull(), // breakfast | snacks | lunch-special | full-day | grand-birthday | custom
    packageName: text("package_name").notNull(),
    amount: integer("amount").notNull(), // INR
    visitMode: text("visit_mode").notNull().default("in_person"), // in_person | remote
    timeSlot: text("time_slot"), // morning | evening | full_day | remote
    guestCount: text("guest_count"), // 1-2 | 3-5 | 6-10 | none
    blessingMessage: text("blessing_message"),
    donorName: text("donor_name").notNull(),
    donorPhone: text("donor_phone").notNull(),
    donorEmail: text("donor_email"),
    donorPan: text("donor_pan"),
    paymentStatus: text("payment_status").notNull().default("pending"), // pending | paid | offline_pledged
    donationId: integer("donation_id").references(() => donations.id, { onDelete: "set null" }),
    celebrationStatus: text("celebration_status").notNull().default("CONFIRMED"), // PENDING | CONFIRMED | FOOD_PREPARED | CELEBRATED | PHOTOS_SENT | CANCELLED
    photoProofUrl: text("photo_proof_url"),
    videoProofUrl: text("video_proof_url"),
    wishVideoUrl: text("wish_video_url"), // Personalized wish greeting video delivered to donor
    staffNotes: text("staff_notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("celebration_date_idx").on(t.celebrationDate),
    index("celebration_status_idx").on(t.celebrationStatus),
  ],
);

/** V2 Community, Volunteer, Influencer & Corporate WhatsApp filing table. */
export const communityMembers = pgTable(
  "community_members",
  {
    id: serial("id").primaryKey(),
    role: text("role").notNull().default("VOLUNTEER"), // VOLUNTEER | INFLUENCER | COMPANY_CSR | WHATSAPP_AMBASSADOR
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(), // WhatsApp contact number
    city: text("city"),
    handleOrOrg: text("handle_or_org"), // Instagram/YouTube handle, or Company Name
    reach: text("reach"), // e.g. "10k-50k followers", "50-200 employees"
    skills: text("skills"), // Specific skills / contribution area
    message: text("message"),
    whatsappOptIn: boolean("whatsapp_opt_in").notNull().default(true),
    status: text("status").notNull().default("NEW"), // NEW | CONTACTED | APPROVED | ADDED_TO_WHATSAPP | ARCHIVED
    adminNotes: text("admin_notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("comm_mem_role_idx").on(t.role),
    index("comm_mem_status_idx").on(t.status),
    index("comm_mem_phone_idx").on(t.phone),
  ],
);

/**
 * ============================================================================
 * ANTIGRAVITY CRM: 15 TELECALLERS & BIRTHDAY LEAD ATTRIBUTION SYSTEM
 * ============================================================================
 */

export const agTelecallers = pgTable("ag_telecallers", {
  callerId: text("caller_id").primaryKey(), // e.g. "TC01", "TC02" ... "TC15"
  name: text("name").notNull(),
  whatsappNumber: text("whatsapp_number").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  dailyQuota: integer("daily_quota").notNull().default(50),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const agLeads = pgTable(
  "ag_leads",
  {
    leadId: serial("lead_id").primaryKey(),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    dobDay: integer("dob_day").notNull(), // 1 - 31
    dobMonth: integer("dob_month").notNull(), // 1 - 12 (leap-year agnostic)
    assignedCallerId: text("assigned_caller_id").references(() => agTelecallers.callerId, { onDelete: "set null" }),
    status: text("status").notNull().default("Pending"), // Pending | Interested | Rejected | Reschedule | Donated
    rescheduleDate: timestamp("reschedule_date"),
    lastContactedAt: timestamp("last_contacted_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("ag_leads_dob_idx").on(t.dobMonth, t.dobDay),
    index("ag_leads_assigned_idx").on(t.assignedCallerId, t.status),
    index("ag_leads_phone_idx").on(t.phone),
  ],
);

export const agCallLogs = pgTable(
  "ag_call_logs",
  {
    logId: serial("log_id").primaryKey(),
    leadId: integer("lead_id").notNull().references(() => agLeads.leadId, { onDelete: "cascade" }),
    callerId: text("caller_id").notNull().references(() => agTelecallers.callerId, { onDelete: "cascade" }),
    disposition: text("disposition").notNull(), // Interested | Rejected | Reschedule | No_Answer | Wrong_Number
    callbackTime: timestamp("callback_time"),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("ag_call_logs_lead_idx").on(t.leadId),
    index("ag_call_logs_caller_idx").on(t.callerId, t.createdAt),
  ],
);

export const agDonations = pgTable(
  "ag_donations",
  {
    txnId: text("txn_id").primaryKey(), // Gateway payment_id e.g. 'pay_Plq982...'
    gatewayOrderId: text("gateway_order_id").notNull(),
    amount: integer("amount").notNull(), // Amount in INR whole rupees
    currency: text("currency").notNull().default("INR"),
    paymentStatus: text("payment_status").notNull().default("captured"),
    callerRefId: text("caller_ref_id"),
    leadId: integer("lead_id").references(() => agLeads.leadId, { onDelete: "set null" }),
    donorName: text("donor_name"),
    donorPhone: text("donor_phone"),
    donorEmail: text("donor_email"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("ag_donations_caller_idx").on(t.callerRefId, t.createdAt),
    index("ag_donations_order_idx").on(t.gatewayOrderId),
  ],
);

export const influencerProfiles = pgTable(
  "influencer_profiles",
  {
    id: serial("id").primaryKey(),
    influencerCode: text("influencer_code").notNull().unique(), // e.g. "ROHIT_FIT"
    displayName: text("display_name").notNull(),               // e.g. "Rohit Sharma"
    instagramHandle: text("instagram_handle"),                 // e.g. "@rohit_fitness"
    whatsappNumber: text("whatsapp_number").notNull(),         // e.g. "9880123456"
    targetGoalAmount: integer("target_goal_amount").notNull().default(50000), // e.g. ₹50,000
    campaignStory: text("campaign_story"),
    coverImageUrl: text("cover_image_url"),
    status: text("status").notNull().default("ACTIVE"),        // ACTIVE | PAUSED
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("influencer_code_idx").on(t.influencerCode),
    index("influencer_status_idx").on(t.status),
  ],
);

// ==============================================================================
// WHATSAPP CRM & META CLOUD API ARCHITECTURE (10 Core Models)
// ==============================================================================

/** 1. WhatsApp Contact & Donor Identity Profile */
export const whatsAppContacts = pgTable(
  "whats_app_contacts",
  {
    id: serial("id").primaryKey(),
    donorId: integer("donor_id").references(() => donations.id, { onDelete: "set null" }),
    normalizedPhone: text("normalized_phone").notNull().unique(), // E.164 e.g. +919876543210
    whatsappId: text("whatsapp_id"),
    displayName: text("display_name"),
    email: text("email"),
    tags: jsonb("tags").$type<string[]>().default([]),
    customFields: jsonb("custom_fields").$type<Record<string, any>>().default({}),
    preferredLanguage: text("preferred_language").notNull().default("en"), // en | kn
    lastSevaType: text("last_seva_type"),
    lastDonationAmount: integer("last_donation_amount"),
    lastDonationAt: timestamp("last_donation_at"),
    optInStatus: boolean("opt_in_status").notNull().default(true),
    consentSource: text("consent_source").default("DIRECT"), // CHECKOUT | INBOUND | FORM | IMPORT
    consentTimestamp: timestamp("consent_timestamp").defaultNow(),
    optOutAt: timestamp("opt_out_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("wa_contacts_phone_idx").on(t.normalizedPhone),
    index("wa_contacts_optin_idx").on(t.optInStatus),
    index("wa_contacts_donation_idx").on(t.lastDonationAt),
  ],
);

/** 2. WhatsApp Consents & Regulatory Audit Trail */
export const whatsAppConsents = pgTable(
  "whats_app_consents",
  {
    id: serial("id").primaryKey(),
    contactId: integer("contact_id").notNull().references(() => whatsAppContacts.id, { onDelete: "cascade" }),
    purpose: text("purpose").notNull().default("TRANSACTIONAL"), // TRANSACTIONAL | MARKETING | ALL
    status: text("status").notNull().default("GRANTED"), // GRANTED | REVOKED
    source: text("source").notNull().default("CHECKOUT"),
    policyVersion: text("policy_version").default("v1.0"),
    capturedAt: timestamp("captured_at").notNull().defaultNow(),
    withdrawnAt: timestamp("withdrawn_at"),
    evidenceReference: text("evidence_reference"),
  },
  (t) => [
    index("wa_consents_contact_idx").on(t.contactId, t.purpose),
  ],
);

/** 3. WhatsApp Conversations (Team Inbox Threads) */
export const whatsAppConversations = pgTable(
  "whats_app_conversations",
  {
    id: serial("id").primaryKey(),
    contactId: integer("contact_id").notNull().references(() => whatsAppContacts.id, { onDelete: "cascade" }),
    assignedUserId: integer("assigned_user_id").references(() => adminUsers.id, { onDelete: "set null" }),
    status: text("status").notNull().default("OPEN"), // OPEN | WAITING | RESOLVED | CLOSED
    unreadCount: integer("unread_count").notNull().default(0),
    aiEnabled: boolean("ai_enabled").notNull().default(true),
    lastInboundAt: timestamp("last_inbound_at"),
    lastMessageAt: timestamp("last_message_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("wa_conv_contact_idx").on(t.contactId),
    index("wa_conv_status_idx").on(t.status),
    index("wa_conv_last_msg_idx").on(t.lastMessageAt),
  ],
);

/** 4. WhatsApp Messages (Inbound & Outbound) */
export const whatsAppMessages = pgTable(
  "whats_app_messages",
  {
    id: serial("id").primaryKey(),
    contactId: integer("contact_id").notNull().references(() => whatsAppContacts.id, { onDelete: "cascade" }),
    conversationId: integer("conversation_id").notNull().references(() => whatsAppConversations.id, { onDelete: "cascade" }),
    wamId: text("wam_id").unique(), // Meta wamid.HBg...
    direction: text("direction").notNull(), // INBOUND | OUTBOUND
    messageType: text("message_type").notNull().default("text"), // text | template | image | video | document | interactive
    content: text("content"),
    mediaUrl: text("media_url"),
    templateName: text("template_name"),
    campaignId: integer("campaign_id"),
    status: text("status").notNull().default("PENDING"), // PENDING | SENT | DELIVERED | READ | FAILED
    failureCode: text("failure_code"),
    failureReason: text("failure_reason"),
    rawPayload: jsonb("raw_payload"),
    sentAt: timestamp("sent_at"),
    deliveredAt: timestamp("delivered_at"),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("wa_msg_conv_idx").on(t.conversationId, t.createdAt),
    index("wa_msg_wamid_idx").on(t.wamId),
    index("wa_msg_contact_idx").on(t.contactId),
  ],
);

/** 5. WhatsApp Message Templates (Meta Approved Cache) */
export const whatsAppTemplates = pgTable(
  "whats_app_templates",
  {
    id: serial("id").primaryKey(),
    metaTemplateId: text("meta_template_id"),
    name: text("name").notNull().unique(),
    category: text("category").notNull().default("UTILITY"), // UTILITY | MARKETING | AUTHENTICATION
    language: text("language").notNull().default("en"),
    components: jsonb("components").$type<any[]>().default([]),
    status: text("status").notNull().default("APPROVED"), // APPROVED | PENDING | REJECTED | PAUSED | DISABLED
    rejectionReason: text("rejection_reason"),
    lastSyncedAt: timestamp("last_synced_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("wa_tpl_name_idx").on(t.name),
    index("wa_tpl_status_idx").on(t.status),
  ],
);

/** 6. WhatsApp Broadcast Campaigns */
export const whatsAppCampaigns = pgTable(
  "whats_app_campaigns",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    purpose: text("purpose").notNull().default("ANNADANA_APPEAL"),
    templateId: integer("template_id").references(() => whatsAppTemplates.id, { onDelete: "set null" }),
    templateName: text("template_name"),
    audienceCriteria: jsonb("audience_criteria").$type<Record<string, any>>().default({}),
    status: text("status").notNull().default("DRAFT"), // DRAFT | SCHEDULED | QUEUED | PROCESSING | COMPLETED | PAUSED | CANCELLED
    totalRecipients: integer("total_recipients").notNull().default(0),
    eligibleRecipients: integer("eligible_recipients").notNull().default(0),
    suppressedRecipients: integer("suppressed_recipients").notNull().default(0),
    queuedCount: integer("queued_count").notNull().default(0),
    sentCount: integer("sent_count").notNull().default(0),
    deliveredCount: integer("delivered_count").notNull().default(0),
    readCount: integer("read_count").notNull().default(0),
    failedCount: integer("failed_count").notNull().default(0),
    scheduledAt: timestamp("scheduled_at"),
    createdBy: integer("created_by").references(() => adminUsers.id, { onDelete: "set null" }),
    approvedBy: integer("approved_by").references(() => adminUsers.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    completedAt: timestamp("completed_at"),
  },
  (t) => [
    index("wa_camp_status_idx").on(t.status),
    index("wa_camp_sched_idx").on(t.scheduledAt),
  ],
);

/** 7. WhatsApp Campaign Recipients (Durable Send Queue) */
export const whatsAppCampaignRecipients = pgTable(
  "whats_app_campaign_recipients",
  {
    id: serial("id").primaryKey(),
    campaignId: integer("campaign_id").notNull().references(() => whatsAppCampaigns.id, { onDelete: "cascade" }),
    contactId: integer("contact_id").notNull().references(() => whatsAppContacts.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("QUEUED"), // QUEUED | SENT | DELIVERED | READ | FAILED | SUPPRESSED
    messageId: integer("message_id").references(() => whatsAppMessages.id, { onDelete: "set null" }),
    wamId: text("wam_id"),
    failureReason: text("failure_reason"),
    parameters: jsonb("parameters").$type<Record<string, any>>().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    sentAt: timestamp("sent_at"),
    deliveredAt: timestamp("delivered_at"),
    readAt: timestamp("read_at"),
  },
  (t) => [
    uniqueIndex("wa_camp_recip_unique").on(t.campaignId, t.contactId),
    index("wa_camp_recip_status").on(t.campaignId, t.status),
  ],
);

/** 8. WhatsApp Automations (Workflow Rules Engine) */
export const whatsAppAutomations = pgTable(
  "whats_app_automations",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    triggerType: text("trigger_type").notNull(), // DONATION_CAPTURED | RECEIPT_READY | BIRTHDAY_SEVA | INBOUND_GREETING | MEDIA_PROOF
    configuration: jsonb("configuration").$type<Record<string, any>>().default({}),
    enabled: boolean("enabled").notNull().default(true),
    createdBy: integer("created_by").references(() => adminUsers.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("wa_auto_trigger_idx").on(t.triggerType, t.enabled),
  ],
);

/** 9. WhatsApp Automation Executions (Idempotent Execution Audit) */
export const whatsAppAutomationExecutions = pgTable(
  "whats_app_automation_executions",
  {
    id: serial("id").primaryKey(),
    automationId: integer("automation_id").notNull().references(() => whatsAppAutomations.id, { onDelete: "cascade" }),
    eventId: text("event_id").notNull().unique(), // e.g. "don_pay_12345_wa_receipt"
    contactId: integer("contact_id").references(() => whatsAppContacts.id, { onDelete: "set null" }),
    status: text("status").notNull().default("PENDING"), // PENDING | COMPLETED | FAILED | SKIPPED
    result: jsonb("result"),
    error: text("error"),
    startedAt: timestamp("started_at").notNull().defaultNow(),
    completedAt: timestamp("completed_at"),
  },
  (t) => [
    index("wa_auto_exec_event_idx").on(t.eventId),
    index("wa_auto_exec_status_idx").on(t.status),
  ],
);

/** 10. WhatsApp Grounded Knowledge Documents (Grounded AI RAG) */
export const whatsAppKnowledgeDocuments = pgTable(
  "whats_app_knowledge_documents",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    sourceType: text("source_type").notNull().default("FAQ"), // FAQ | LEGAL | SEVA_CATALOG | ASHRAMA_STORY | VISITING_HOURS
    sourceReference: text("source_reference"),
    language: text("language").notNull().default("en"), // en | kn | both
    status: text("status").notNull().default("PUBLISHED"), // PUBLISHED | DRAFT | ARCHIVED
    updatedBy: integer("updated_by").references(() => adminUsers.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("wa_know_type_idx").on(t.sourceType, t.status),
    index("wa_know_lang_idx").on(t.language),
  ],
);



