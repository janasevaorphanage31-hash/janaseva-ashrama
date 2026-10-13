import { NextResponse } from "next/server";
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
} from "@/lib/antigravity-crm";

export async function GET() {
  try {
    const data = await getAdminLeaderboard();
    return NextResponse.json({ success: true, ...data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action;

    if (action === "trigger_routing") {
      const result = await distributeBirthdayLeads();
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
      return NextResponse.json({
        success: true,
        message: `Password for ${callerId} has been successfully updated.`,
      });
    }

    if (action === "export_csv") {
      const { exportType } = body;
      const result = await generateAgencyCSVExport(exportType || "performance");
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
      const updatedLeaderboard = await getAdminLeaderboard();
      return NextResponse.json({
        success: true,
        message: `Reassigned ${leadIds.length} leads to ${targetCallerId}.`,
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
