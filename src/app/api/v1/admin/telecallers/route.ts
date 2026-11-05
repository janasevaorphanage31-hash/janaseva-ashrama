import { NextResponse } from "next/server";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

import { ensureDbSchema } from "@/db";
import { requireAdminApi } from "@/lib/admin-auth";
import { writeAudit } from "@/lib/audit";
import { clientIp } from "@/lib/server-utils";
import {
  getAdminLeaderboard,
  distributeBirthdayLeads,
  distributeT2BirthdayLeads,
  bulkReassignLeads,
  ensureTelecallersAndSeedData,
  addTelecaller,
  deleteTelecaller,
  toggleTelecallerStatus,
  uploadBulkLeads,
  distributeAllPendingLeads,
  distributeUnassignedLeads,
  distributeDualStreamBalanced,
  reallocateAbsenteeAdvanceLeads,
  toggleTelecallerAttendance,
  generateAgencyCSVExport,
  resetTelecallerPassword,
  saveCrmWhatsAppSettings,
  updateTelecallerDetails,
  clearDemoLeads,
  deleteAllLeads,
  resetDailyQuotaLeads,
  repairStudentNamesInDb,
  deduplicateDatabaseLeads,
  equalizePendingWorkload,
  rollbackUploadBatch,
  getRecentUploadBatches,
} from "@/lib/antigravity-crm";

export async function GET(req: Request) {
  try {
    const session = await requireAdminApi();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Administrator login required." },
        { status: 401 }
      );
    }

    await ensureTelecallersAndSeedData();
    const data = await getAdminLeaderboard();
    return NextResponse.json({ success: true, ...data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAdminApi();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Administrator login required." },
        { status: 401 }
      );
    }

    await ensureDbSchema();
    await ensureTelecallersAndSeedData();
    const body = await req.json();
    const action = body.action;
    const ip = clientIp(req);

    if (action === "trigger_routing" || action === "distribute_tomorrow_mix") {
      const result = await distributeBirthdayLeads();
      await writeAudit({
        actorAdminUserId: session.user.id ?? null,
        action: "crm.distribute_birthday_leads",
        entity: "ag_leads",
        afterState: result,
        ipAddress: ip,
      });

      const updatedLeaderboard = await getAdminLeaderboard();
      return NextResponse.json({
        success: true,
        message: `Distributed ${result.distributed} tomorrow's advance leads (${result.parentsDistributed || 0} Parents + ${result.donorsDistributed || 0} Donors) across ${result.callersCount} active telecallers.`,
        distributionResult: result,
        ...updatedLeaderboard,
      });
    }

    if (action === "distribute_t2_leads" || action === "distribute_t2_mix") {
      const result = await distributeT2BirthdayLeads();
      await writeAudit({
        actorAdminUserId: session.user.id ?? null,
        action: "crm.distribute_t2_birthday_leads",
        entity: "ag_leads",
        afterState: result,
        ipAddress: ip,
      });

      const updatedLeaderboard = await getAdminLeaderboard();
      return NextResponse.json({
        success: true,
        message: `Distributed ${result.distributed} Day-After-Tomorrow (T+2) advance leads (${result.parentsDistributed || 0} Parents + ${result.donorsDistributed || 0} Donors) across ${result.callersCount} active telecallers.`,
        distributionResult: result,
        ...updatedLeaderboard,
      });
    }

    if (action === "add_caller") {
      const { callerId, name, whatsappNumber, email, password, dailyQuota } = body;
      if (!name || !whatsappNumber) {
        return NextResponse.json({ error: "Name and WhatsApp number are required." }, { status: 400 });
      }
      const newCaller = await addTelecaller({
        callerId,
        name,
        whatsappNumber,
        email,
        password,
        dailyQuota: dailyQuota ? parseInt(String(dailyQuota), 10) : 50,
      });

      await writeAudit({
        actorAdminUserId: session.user.id ?? null,
        action: "crm.add_telecaller",
        entity: "ag_telecallers",
        entityId: newCaller.callerId,
        afterState: { name: newCaller.name, callerId: newCaller.callerId },
        ipAddress: ip,
      });

      const updatedLeaderboard = await getAdminLeaderboard();
      return NextResponse.json({
        success: true,
        message: `Telecaller ${newCaller.callerId} (${newCaller.name}) added successfully.`,
        caller: newCaller,
        ...updatedLeaderboard,
      });
    }

    if (action === "delete_caller") {
      const { callerId, redistributeLeads } = body;
      if (!callerId) {
        return NextResponse.json({ error: "Caller ID is required to delete." }, { status: 400 });
      }
      const res = await deleteTelecaller(callerId, redistributeLeads !== false);

      await writeAudit({
        actorAdminUserId: session.user.id ?? null,
        action: "crm.delete_telecaller",
        entity: "ag_telecallers",
        entityId: callerId,
        afterState: res,
        ipAddress: ip,
      });

      const updatedLeaderboard = await getAdminLeaderboard();
      return NextResponse.json({
        success: true,
        message: `Telecaller ${callerId} removed. ${res.unassignedLeads} leads unassigned (${res.redistributedCount} redistributed).`,
        ...updatedLeaderboard,
      });
    }

    if (action === "toggle_active") {
      const { callerId, isActive, redistributeLeads } = body;
      if (!callerId || typeof isActive !== "boolean") {
        return NextResponse.json({ error: "Caller ID and isActive status are required." }, { status: 400 });
      }
      const res = await toggleTelecallerStatus(callerId, isActive, redistributeLeads !== false);

      await writeAudit({
        actorAdminUserId: session.user.id ?? null,
        action: "crm.toggle_telecaller_status",
        entity: "ag_telecallers",
        entityId: callerId,
        afterState: { isActive },
        ipAddress: ip,
      });

      const updatedLeaderboard = await getAdminLeaderboard();
      return NextResponse.json({
        success: true,
        message: `Telecaller ${callerId} is now ${isActive ? "Active" : "Inactive"}.`,
        ...updatedLeaderboard,
      });
    }

    if (action === "toggle_attendance") {
      const { callerId, isWorkingToday, reallocateLeads } = body;
      if (!callerId || typeof isWorkingToday !== "boolean") {
        return NextResponse.json({ error: "Caller ID and isWorkingToday boolean are required." }, { status: 400 });
      }
      const res = await toggleTelecallerAttendance(callerId, isWorkingToday, reallocateLeads !== false);

      await writeAudit({
        actorAdminUserId: session.user.id ?? null,
        action: "crm.toggle_telecaller_attendance",
        entity: "ag_telecallers",
        entityId: callerId,
        afterState: { isWorkingToday, reallocatedCount: res.reallocatedCount },
        ipAddress: ip,
      });

      const updatedLeaderboard = await getAdminLeaderboard();
      return NextResponse.json({
        success: true,
        message: `Telecaller ${callerId} is marked as ${isWorkingToday ? "Working Today" : "Absent Today"}.${res.reallocatedCount > 0 ? ` Reallocated ${res.reallocatedCount} advance leads to present floor callers.` : ""}`,
        attendanceResult: res,
        ...updatedLeaderboard,
      });
    }

    if (action === "upload_chunk" || action === "upload_leads") {
      const { leads, autoDistribute, mode, uploadBatchId } = body;
      if (!leads || !Array.isArray(leads) || leads.length === 0) {
        return NextResponse.json({ error: "Please provide an array of leads to upload." }, { status: 400 });
      }
      const shouldDistribute = autoDistribute === true;
      const res = await uploadBulkLeads(leads, shouldDistribute, mode || "balanced", uploadBatchId);

      await writeAudit({
        actorAdminUserId: session.user.id ?? null,
        action: action === "upload_chunk" ? "crm.upload_chunk" : "crm.upload_bulk_leads",
        entity: "ag_leads",
        afterState: { uploaded: res.validInserted, distributed: res.distributed, uploadBatchId: (res as any).uploadBatchId },
        ipAddress: ip,
      });

      // For chunked ingestion, return fast response without recalculating entire admin leaderboard
      if (action === "upload_chunk") {
        const enrichNote = (res as any).enrichedUpdatedCount > 0 ? `, ${(res as any).enrichedUpdatedCount} existing leads updated with Student Names` : "";
        return NextResponse.json({
          success: true,
          message: `Chunk processed: ${res.validInserted} inserted, ${res.distributed} distributed${enrichNote}, ${res.alreadyInDbSkipped} duplicates skipped.`,
          uploadResult: res,
        });
      }

      const updatedLeaderboard = await getAdminLeaderboard();
      const enrichMsg = (res as any).enrichedUpdatedCount > 0 ? ` (${(res as any).enrichedUpdatedCount} existing leads updated with Student Names)` : "";
      return NextResponse.json({
        success: true,
        message: `Uploaded ${res.validInserted} leads successfully${enrichMsg}. ${res.distributed} leads distributed equally among active telecallers.`,
        uploadResult: res,
        ...updatedLeaderboard,
      });
    }

    if (action === "get_upload_batches") {
      const batches = await getRecentUploadBatches();
      return NextResponse.json({
        success: true,
        batches,
      });
    }

    if (action === "rollback_upload_batch") {
      const { batchId } = body;
      const res = await rollbackUploadBatch(batchId);

      await writeAudit({
        actorAdminUserId: session.user.id ?? null,
        action: "crm.rollback_upload_batch",
        entity: "ag_leads",
        afterState: res,
        ipAddress: ip,
      });

      const updatedLeaderboard = await getAdminLeaderboard();
      return NextResponse.json({
        success: true,
        message: res.message,
        rollbackResult: res,
        ...updatedLeaderboard,
      });
    }

    if (action === "repair_student_names") {
      const res = await repairStudentNamesInDb();
      await writeAudit({
        actorAdminUserId: session.user.id ?? null,
        action: "crm.repair_student_names",
        entity: "ag_leads",
        afterState: { updatedCount: res.updatedCount },
        ipAddress: ip,
      });

      const updatedLeaderboard = await getAdminLeaderboard();
      return NextResponse.json({
        success: true,
        message: res.message,
        ...updatedLeaderboard,
      });
    }

    if (action === "deduplicate_database") {
      const res = await deduplicateDatabaseLeads();
      await writeAudit({
        actorAdminUserId: session.user.id ?? null,
        action: "crm.deduplicate_database",
        entity: "ag_leads",
        afterState: res,
        ipAddress: ip,
      });

      const updatedLeaderboard = await getAdminLeaderboard();
      return NextResponse.json({
        success: true,
        message: res.message,
        dedupResult: res,
        ...updatedLeaderboard,
      });
    }

    if (action === "equalize_pending_workload") {
      const res = await equalizePendingWorkload();
      await writeAudit({
        actorAdminUserId: session.user.id ?? null,
        action: "crm.equalize_pending_workload",
        entity: "ag_leads",
        afterState: res,
        ipAddress: ip,
      });

      const updatedLeaderboard = await getAdminLeaderboard();
      return NextResponse.json({
        success: true,
        message: res.message,
        equalizeResult: res,
        ...updatedLeaderboard,
      });
    }

    if (action === "distribute_unassigned") {
      const { mode } = body;
      const res = await distributeUnassignedLeads(mode || "balanced");

      await writeAudit({
        actorAdminUserId: session.user.id ?? null,
        action: "crm.distribute_unassigned_leads",
        entity: "ag_leads",
        afterState: res,
        ipAddress: ip,
      });

      const updatedLeaderboard = await getAdminLeaderboard();
      return NextResponse.json({
        success: true,
        message: `Equally distributed ${res.distributed} newly uploaded unassigned leads across active telecallers.`,
        distributionResult: res,
        ...updatedLeaderboard,
      });
    }

    if (action === "distribute_equally" || action === "distribute_dual_stream") {
      const { mode, unassignedOnly } = body;
      const res = await distributeDualStreamBalanced({
        unassignedOnly: unassignedOnly === true,
        mode: mode || "balanced",
      });

      await writeAudit({
        actorAdminUserId: session.user.id ?? null,
        action: action === "distribute_dual_stream" ? "crm.distribute_dual_stream" : "crm.distribute_pending_leads",
        entity: "ag_leads",
        afterState: res,
        ipAddress: ip,
      });

      const updatedLeaderboard = await getAdminLeaderboard();
      return NextResponse.json({
        success: true,
        message: `Distributed ${res.distributed} leads (👶 ${res.parentsDistributed} Parents + 🎂 ${res.donorsDistributed} Donors) equally across ${res.callersCount} callers.`,
        distributionResult: res,
        ...updatedLeaderboard,
      });
    }

    if (action === "reallocate_absentee_advance") {
      const { includeT2 } = body;
      const res = await reallocateAbsenteeAdvanceLeads({ includeT2: includeT2 !== false });

      await writeAudit({
        actorAdminUserId: session.user.id ?? null,
        action: "crm.reallocate_absentee_advance",
        entity: "ag_leads",
        afterState: res,
        ipAddress: ip,
      });

      const updatedLeaderboard = await getAdminLeaderboard();
      return NextResponse.json({
        success: true,
        message: `Harvested ${res.harvestedFromAbsentCount} advance leads from absent callers and reallocated ${res.reallocatedToPresentCount} leads equally across ${res.presentCallersCount} present floor callers.`,
        reallocationResult: res,
        ...updatedLeaderboard,
      });
    }

    if (action === "reset_password") {
      const { callerId, newPassword } = body;
      if (!callerId || !newPassword) {
        return NextResponse.json({ error: "Caller ID and new password are required." }, { status: 400 });
      }
      await resetTelecallerPassword(callerId, newPassword);

      await writeAudit({
        actorAdminUserId: session.user.id ?? null,
        action: "crm.reset_telecaller_password",
        entity: "ag_telecallers",
        entityId: callerId,
        ipAddress: ip,
      });

      return NextResponse.json({
        success: true,
        message: `Password for ${callerId} has been successfully updated.`,
      });
    }

    if (action === "export_csv") {
      const { exportType, callerId } = body;
      const result = await generateAgencyCSVExport(exportType || "performance", callerId);

      await writeAudit({
        actorAdminUserId: session.user.id ?? null,
        action: "crm.export_agency_csv",
        entity: "ag_telecallers",
        afterState: { exportType },
        ipAddress: ip,
      });

      return NextResponse.json({
        success: true,
        ...result,
      });
    }

    if (action === "bulk_reassign") {
      const leadIds = body.leadIds as number[];
      const targetCallerId = body.targetCallerId as string;

      if (!leadIds || leadIds.length === 0 || !targetCallerId) {
        return NextResponse.json({ error: "Lead IDs and target caller are required" }, { status: 400 });
      }

      await bulkReassignLeads(leadIds, targetCallerId);

      await writeAudit({
        actorAdminUserId: session.user.id ?? null,
        action: "crm.bulk_reassign_leads",
        entity: "ag_leads",
        afterState: { leadCount: leadIds.length, targetCallerId },
        ipAddress: ip,
      });

      const updatedLeaderboard = await getAdminLeaderboard();
      return NextResponse.json({
        success: true,
        message: `Reassigned ${leadIds.length} leads to ${targetCallerId}.`,
        ...updatedLeaderboard,
      });
    }

    if (action === "save_whatsapp_settings") {
      const { settings } = body;
      if (!settings || typeof settings !== "object") {
        return NextResponse.json({ error: "Invalid WhatsApp settings payload." }, { status: 400 });
      }

      const updatedSettings = await saveCrmWhatsAppSettings(settings);

      await writeAudit({
        actorAdminUserId: session.user.id ?? null,
        action: "crm.save_whatsapp_settings",
        entity: "crm_settings",
        afterState: updatedSettings,
        ipAddress: ip,
      });

      const updatedLeaderboard = await getAdminLeaderboard();
      return NextResponse.json({
        success: true,
        message: "Outreach WhatsApp settings saved successfully.",
        settings: updatedSettings,
        ...updatedLeaderboard,
      });
    }

    if (action === "update_caller") {
      const { callerId, name, whatsappNumber, email, dailyQuota, isActive } = body;
      if (!callerId) {
        return NextResponse.json({ error: "Caller ID is required." }, { status: 400 });
      }

      const res = await updateTelecallerDetails(callerId, {
        name,
        whatsappNumber,
        email,
        dailyQuota: dailyQuota ? parseInt(String(dailyQuota), 10) : undefined,
        isActive: typeof isActive === "boolean" ? isActive : undefined,
      });

      await writeAudit({
        actorAdminUserId: session.user.id ?? null,
        action: "crm.update_telecaller",
        entity: "ag_telecallers",
        entityId: callerId,
        afterState: { name, whatsappNumber, email, dailyQuota, isActive },
        ipAddress: ip,
      });

      const updatedLeaderboard = await getAdminLeaderboard();
      return NextResponse.json({
        success: true,
        message: `Telecaller ${callerId} details updated successfully.`,
        ...updatedLeaderboard,
      });
    }

    if (action === "clear_leads") {
      const { onlySample, wipeAll } = body;
      const shouldWipeAll = wipeAll === true || onlySample === false;
      const res = await clearDemoLeads(!shouldWipeAll);

      await writeAudit({
        actorAdminUserId: session.user.id ?? null,
        action: "crm.clear_leads",
        entity: "ag_leads",
        afterState: { onlySample: !shouldWipeAll, wipeAll: shouldWipeAll },
        ipAddress: ip,
      });

      const updatedLeaderboard = await getAdminLeaderboard();
      return NextResponse.json({
        success: true,
        message: shouldWipeAll
          ? "All leads and call logs deleted. Telecaller staff accounts are preserved."
          : "Demo test leads removed successfully.",
        ...updatedLeaderboard,
      });
    }

    if (action === "delete_all_leads") {
      const res = await deleteAllLeads();

      await writeAudit({
        actorAdminUserId: session.user.id ?? null,
        action: "crm.delete_all_leads",
        entity: "ag_leads",
        afterState: res,
        ipAddress: ip,
      });

      const updatedLeaderboard = await getAdminLeaderboard();
      return NextResponse.json({
        success: true,
        message: "All leads and call logs permanently deleted. Telecaller staff accounts remain active.",
        ...updatedLeaderboard,
      });
    }

    if (action === "reset_daily_quota" || action === "reset_daily_leads") {
      const { mode } = body;
      const res = await resetDailyQuotaLeads(mode || "balanced");

      await writeAudit({
        actorAdminUserId: session.user.id ?? null,
        action: "crm.reset_daily_quota",
        entity: "ag_leads",
        afterState: res,
        ipAddress: ip,
      });

      const updatedLeaderboard = await getAdminLeaderboard();
      return NextResponse.json({
        success: true,
        message: res.message,
        resetResult: res,
        ...updatedLeaderboard,
      });
    }

    if (action === "seed_sample") {
      await ensureTelecallersAndSeedData();
      const updatedLeaderboard = await getAdminLeaderboard();
      return NextResponse.json({
        success: true,
        message: "Seeded initial telecallers and birthday leads successfully.",
        ...updatedLeaderboard,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
