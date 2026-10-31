import { NextResponse } from "next/server";
import { ensureDbSchema } from "@/db";
import { requireAdminApi } from "@/lib/admin-auth";
import { writeAudit } from "@/lib/audit";
import { clientIp } from "@/lib/server-utils";
import {
  getAdminLeaderboard,
  distributeBirthdayLeads,
  bulkReassignLeads,
  ensureTelecallersAndSeedData,
  addTelecaller,
  deleteTelecaller,
  toggleTelecallerStatus,
  uploadBulkLeads,
  distributeAllPendingLeads,
  generateAgencyCSVExport,
  resetTelecallerPassword,
  saveCrmWhatsAppSettings,
  updateTelecallerDetails,
  clearDemoLeads,
  deleteAllLeads,
  resetDailyQuotaLeads,
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

    await ensureDbSchema();
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

    if (action === "trigger_routing") {
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
        message: `Distributed ${result.distributed} birthday leads across ${result.callersCount} active telecallers.`,
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

    if (action === "upload_leads") {
      const { leads, autoDistribute, mode } = body;
      if (!leads || !Array.isArray(leads) || leads.length === 0) {
        return NextResponse.json({ error: "Please provide an array of leads to upload." }, { status: 400 });
      }
      const res = await uploadBulkLeads(leads, autoDistribute !== false, mode || "balanced");

      await writeAudit({
        actorAdminUserId: session.user.id ?? null,
        action: "crm.upload_bulk_leads",
        entity: "ag_leads",
        afterState: { uploaded: res.validInserted, distributed: res.distributed },
        ipAddress: ip,
      });

      const updatedLeaderboard = await getAdminLeaderboard();
      return NextResponse.json({
        success: true,
        message: `Uploaded ${res.validInserted} leads successfully. ${res.distributed} leads distributed equally among active telecallers.`,
        uploadResult: res,
        ...updatedLeaderboard,
      });
    }

    if (action === "distribute_equally") {
      const { mode } = body;
      const res = await distributeAllPendingLeads(mode || "balanced");

      await writeAudit({
        actorAdminUserId: session.user.id ?? null,
        action: "crm.distribute_pending_leads",
        entity: "ag_leads",
        afterState: res,
        ipAddress: ip,
      });

      const updatedLeaderboard = await getAdminLeaderboard();
      return NextResponse.json({
        success: true,
        message: `Equally distributed ${res.distributed} pending leads using ${mode || "balanced"} algorithm.`,
        distributionResult: res,
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
      const { exportType } = body;
      const result = await generateAgencyCSVExport(exportType || "performance");

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
