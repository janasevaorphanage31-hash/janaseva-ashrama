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
    razorpayOrderId: text("razorpay_order_id").unique(),
    razorpayPaymentId: text("razorpay_payment_id").unique(),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    meta: jsonb("meta"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    paidAt: timestamp("paid_at"),
    refundedAt: timestamp("refunded_at"),
  },
  (t) => [index("donations_campaign_idx").on(t.campaignId), index("donations_status_idx").on(t.status)],
);

export const donationLines = pgTable("donation_lines", {
  id: serial("id").primaryKey(),
  donationId: integer("donation_id")
    .references(() => donations.id, { onDelete: "cascade" }),
  itemSlug: text("item_slug"),
  label: text("label").notNull(),
  unitPrice: integer("unit_price").notNull(),
  qty: integer("qty").notNull(),
});

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

