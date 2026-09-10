import fs from "fs";
import path from "path";
import { Boom } from "@hapi/boom";
import qrcode from "qrcode-terminal";
import pino from "pino";
import { MessageBuffer } from "../buffer/messageBuffer";

export class WhatsAppGateway {
  public static sock: any = null;
  private static onMessageCallback: ((jid: string, text: string) => Promise<string | void>) | null = null;

  private static async getBaileys(): Promise<any> {
    return await (eval('import("@whiskeysockets/baileys")') as Promise<any>);
  }

  public static async init(onMessageReceived: (jid: string, text: string) => Promise<string | void>): Promise<any> {
    this.onMessageCallback = onMessageReceived;
    const baileys = await this.getBaileys();
    const {
      default: makeWASocket,
      DisconnectReason,
      useMultiFileAuthState,
      fetchLatestBaileysVersion,
    } = baileys;

    const authFolder = path.resolve(process.cwd(), "auth_info_baileys");
    const { state, saveCreds } = await useMultiFileAuthState(authFolder);
    const { version, isLatest } = await fetchLatestBaileysVersion();

    console.log(`[Gateway] Usando WhatsApp Web v${version.join(".")} (Última: ${isLatest})`);

    const socket = makeWASocket({
      version,
      auth: state,
      logger: pino({ level: "silent" }) as any,
      printQRInTerminal: false,
    });

    this.sock = socket;

    socket.ev.on("connection.update", (update: any) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log("\n=======================================================");
        console.log("ESCANEE O QR CODE COM SEU WHATSAPP PARA CONECTAR:");
        console.log("=======================================================\n");
        qrcode.generate(qr, { small: true });
      }

      if (connection === "close") {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.log(`[WhatsApp] Conexão fechada. Reconectando: ${shouldReconnect}`);
        if (shouldReconnect) {
          WhatsAppGateway.init(onMessageReceived);
        }
      } else if (connection === "open") {
        console.log("✅ [WhatsApp] Gateway conectado com sucesso!");
      }
    });

    socket.ev.on("creds.update", saveCreds);

    socket.ev.on("messages.upsert", async ({ messages, type }: any) => {
      if (type !== "notify") return;

      for (const msg of messages) {
        if (msg.key.fromMe) continue;

        const remoteJid = msg.key.remoteJid;
        const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;

        if (remoteJid && text && !remoteJid.includes("@g.us")) {
          MessageBuffer.addMessage(remoteJid, text, async (jid, fullText) => {
            const reply = await onMessageReceived(jid, fullText);
            if (reply && WhatsAppGateway.sock) {
              await WhatsAppGateway.sock.sendMessage(jid, { text: reply });
            }
          });
        }
      }
    });

    return socket;
  }

  public static async desconectarEReiniciar(): Promise<void> {
    if (this.sock) {
      await this.sock.logout();
      this.sock = null;
    }

    const authFolder = path.resolve(process.cwd(), "auth_info_baileys");
    fs.rmSync(authFolder, { recursive: true, force: true });

    if (this.onMessageCallback) {
      await this.init(this.onMessageCallback);
    }
  }
}
