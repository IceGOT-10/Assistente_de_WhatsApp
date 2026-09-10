import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";

const FAKE_REMOTE_JID = "5511988887777@s.whatsapp.net";
const API_URL = "http://localhost:3000/api/test/simulate-message";
const RESET_URL = "http://localhost:3000/api/sessions/5511988887777/reset";
const DISCONNECT_URL = "http://localhost:3000/api/whatsapp/disconnect";

async function main() {
  const rl = readline.createInterface({ input, output });

  console.log("====================================================");
  console.log("  SIMULADOR DE PACIENTE — CLI DE TESTES DA SOFIA   ");
  console.log("====================================================");
  console.log(`Simulando paciente: ${FAKE_REMOTE_JID}`);
  console.log("Comandos:");
  console.log("  /sair         -> Fecha este chat simulador");
  console.log("  /limpar       -> Reseta a sessão do paciente no servidor");
  console.log("  /desvincular  -> Desconecta o WhatsApp e gera novo QR Code");
  console.log("----------------------------------------------------\n");

  while (true) {
    const texto = await rl.question("Você (Paciente) > ");
    const trimmed = texto.trim();

    if (!trimmed) continue;

    if (trimmed === "/sair") {
      console.log("Encerrando simulador.");
      rl.close();
      return;
    }

    if (trimmed === "/limpar") {
      try {
        const resetRes = await fetch(RESET_URL, { method: "POST" });
        if (resetRes.ok) {
          console.log("🧹 [Simulador] Atendimento e sessão resetados no servidor!\n");
        } else {
          console.error("❌ Falha ao resetar sessão.");
        }
      } catch {
        console.error("❌ Não foi possível conectar ao servidor (Porta 3000 ativa?).");
      }
      continue;
    }

    if (trimmed === "/desvincular") {
      try {
        console.log("⏳ Solicitando desconexão do WhatsApp ao servidor...");
        const disconnectRes = await fetch(DISCONNECT_URL, { method: "POST" });
        if (disconnectRes.ok) {
          console.log("📲 [WhatsApp] Desconectado! Verifique o terminal do servidor para escanear o novo QR Code.\n");
        } else {
          console.error("❌ Erro ao desvincular WhatsApp.");
        }
      } catch {
        console.error("❌ Servidor indisponível na porta 3000.");
      }
      continue;
    }

    try {
      console.log("⏳ Enviando para o servidor da clínica...");
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remoteJid: FAKE_REMOTE_JID, text: trimmed }),
      });

      if (!response.ok) {
        console.error(`❌ Erro do servidor: Status ${response.status}`);
        continue;
      }

      const data = (await response.json()) as { reply: string; source: string };
      console.log(`\n🤖 Sofia [${data.source.toUpperCase()}] >`);
      console.log(`${data.reply}\n`);
    } catch {
      console.error(
        "❌ Erro de conexão com o servidor. O comando 'npm run dev' está rodando na porta 3000?\n",
      );
    }
  }
}

main().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
