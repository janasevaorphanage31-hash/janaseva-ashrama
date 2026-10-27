/**
 * WhatsApp Multi-Device Gateway using @whiskeysockets/baileys
 * Open-source GitHub library for automated WhatsApp messaging with real images, videos & documents.
 * 
 * Allows staff or admin to connect an Ashrama WhatsApp phone session via QR code.
 * Once connected, messages are dispatched automatically with the REAL media attached (not a URL link).
 */

import path from "node:path";
import fs from "node:fs";
import QRCode from "qrcode";
import pino from "pino";

export type BaileysStatus = "disconnected" | "connecting" | "qr_ready" | "connected" | "error";

interface BaileysGlobalState {
  socket: any | null;
  status: BaileysStatus;
  qrCodeDataUrl: string | null;
  connectedPhone: string | null;
  lastError: string | null;
  initPromise: Promise<any> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var __baileysGateway: BaileysGlobalState | undefined;
}

if (!globalThis.__baileysGateway) {
  globalThis.__baileysGateway = {
    socket: null,
    status: "disconnected",
    qrCodeDataUrl: null,
    connectedPhone: null,
    lastError: null,
    initPromise: null,
  };
}

const gatewayState = globalThis.__baileysGateway;

const AUTH_DIR = path.join(process.cwd(), "data", "baileys_auth");

/**
 * Normalizes phone number into WhatsApp JID (e.g. 919980359595@s.whatsapp.net)
 */
export function formatToJid(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, "");
  const last10 = digits.length >= 10 ? digits.slice(-10) : digits;
  return `91${last10}@s.whatsapp.net`;
}

/**
 * Initializes or returns the existing Baileys WebSocket connection
 */
export async function getBaileysSocket(): Promise<any> {
  if (gatewayState.socket && gatewayState.status === "connected") {
    return gatewayState.socket;
  }

  if (gatewayState.initPromise) {
    return gatewayState.initPromise;
  }

  gatewayState.initPromise = (async () => {
    try {
      gatewayState.status = "connecting";
      gatewayState.lastError = null;

      if (!fs.existsSync(AUTH_DIR)) {
        fs.mkdirSync(AUTH_DIR, { recursive: true });
      }

      // Dynamic import to support SSR and Next.js bundling
      const baileys = await import("@whiskeysockets/baileys");
      const makeWASocket = baileys.default || baileys.makeWASocket;
      const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = baileys;

      const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
      let version: [number, number, number] = [2, 3000, 1015901307];
      try {
        const v = await fetchLatestBaileysVersion();
        if (v && v.version) version = v.version;
      } catch {
        // Fallback to stable default version
      }

      const logger = pino({ level: "silent" });

      const sock = makeWASocket({
        version,
        auth: state,
        logger,
        printQRInTerminal: false,
        browser: ["Janaseva Ashrama", "Chrome", "1.0.0"],
        syncFullHistory: false,
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
      });

      gatewayState.socket = sock;

      sock.ev.on("creds.update", saveCreds);

      sock.ev.on("connection.update", async (update: any) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          try {
            gatewayState.qrCodeDataUrl = await QRCode.toDataURL(qr, { margin: 2, width: 300 });
            gatewayState.status = "qr_ready";
          } catch (err: any) {
            console.error("Failed to generate QR code data URL:", err);
          }
        }

        if (connection === "open") {
          gatewayState.status = "connected";
          gatewayState.qrCodeDataUrl = null;
          gatewayState.connectedPhone = sock.user?.id ? sock.user.id.split(":")[0] : "Connected";
          gatewayState.lastError = null;
        }

        if (connection === "close") {
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

          gatewayState.status = "disconnected";
          gatewayState.socket = null;
          gatewayState.initPromise = null;

          if (shouldReconnect) {
            console.log("Baileys connection closed; attempting reconnect in 5s...");
            setTimeout(() => {
              void getBaileysSocket();
            }, 5000);
          } else {
            gatewayState.lastError = "Logged out from WhatsApp. Please scan QR code again.";
            // Remove old credentials
            try {
              fs.rmSync(AUTH_DIR, { recursive: true, force: true });
            } catch {}
          }
        }
      });

      return sock;
    } catch (err: any) {
      gatewayState.status = "error";
      gatewayState.lastError = err.message || "Failed to initialize Baileys";
      gatewayState.initPromise = null;
      throw err;
    }
  })();

  return gatewayState.initPromise;
}

/**
 * Returns current status of the Baileys WhatsApp Gateway
 */
export async function getBaileysGatewayStatus(): Promise<{
  status: BaileysStatus;
  qrCodeDataUrl: string | null;
  connectedPhone: string | null;
  lastError: string | null;
  hasStoredAuth: boolean;
}> {
  const hasCreds = fs.existsSync(path.join(AUTH_DIR, "creds.json"));
  return {
    status: gatewayState.status,
    qrCodeDataUrl: gatewayState.qrCodeDataUrl,
    connectedPhone: gatewayState.connectedPhone,
    lastError: gatewayState.lastError,
    hasStoredAuth: hasCreds,
  };
}

/**
 * Sends a WhatsApp message with real attached media using Baileys
 */
export async function sendBaileysMediaMessage(params: {
  to: string;
  caption?: string;
  mediaUrl?: string;
  mediaType?: "image" | "video" | "document" | "link";
  filename?: string;
}): Promise<{ success: boolean; messageId: string; phone: string }> {
  const sock = await getBaileysSocket();
  if (gatewayState.status !== "connected") {
    throw new Error("Ashrama WhatsApp is not connected. Please scan QR code in settings.");
  }

  const jid = formatToJid(params.to);

  let messagePayload: any = {};

  if (params.mediaUrl && params.mediaType !== "link") {
    if (params.mediaType === "image" || !params.mediaType) {
      messagePayload = {
        image: { url: params.mediaUrl },
        caption: params.caption || "",
      };
    } else if (params.mediaType === "video") {
      messagePayload = {
        video: { url: params.mediaUrl },
        caption: params.caption || "",
      };
    } else if (params.mediaType === "document") {
      messagePayload = {
        document: { url: params.mediaUrl },
        fileName: params.filename || "Janaseva-Ashrama-Document.pdf",
        caption: params.caption || "",
      };
    }
  } else {
    messagePayload = {
      text: params.caption || "",
    };
  }

  const sent = await sock.sendMessage(jid, messagePayload);

  return {
    success: true,
    messageId: sent?.key?.id || "baileys_msg",
    phone: params.to,
  };
}

/**
 * Disconnects the active Baileys session and cleans up credentials
 */
export async function disconnectBaileysSession(): Promise<boolean> {
  try {
    if (gatewayState.socket) {
      await gatewayState.socket.logout();
    }
  } catch {}

  gatewayState.socket = null;
  gatewayState.status = "disconnected";
  gatewayState.qrCodeDataUrl = null;
  gatewayState.connectedPhone = null;
  gatewayState.initPromise = null;

  try {
    if (fs.existsSync(AUTH_DIR)) {
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    }
  } catch {}

  return true;
}
