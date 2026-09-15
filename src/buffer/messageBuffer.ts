type BufferItem = {
  timeout: NodeJS.Timeout | null;
  messages: string[];
  isProcessing: boolean;
  onProcess: ProcessCallback;
};

type ProcessCallback = (remoteJid: string, consolidatedMessage: string) => Promise<void> | void;

export class MessageBuffer {
  private static buffers = new Map<string, BufferItem>();
  private static readonly DEBOUNCE_TIME_MS = 3500;

  /**
   * Adiciona mensagem recebida ao buffer do contato.
   * Implementa fila anti-atropelo: se a IA já estiver processando uma resposta anterior para
   * este contato, as novas mensagens são retidas na fila e só serão processadas após a
   * conclusão da resposta em andamento.
   */
  public static addMessage(
    remoteJid: string,
    text: string,
    onProcess: ProcessCallback
  ): void {
    let item = this.buffers.get(remoteJid);

    if (!item) {
      item = {
        timeout: null,
        messages: [text],
        isProcessing: false,
        onProcess,
      };
      this.buffers.set(remoteJid, item);
    } else {
      item.messages.push(text);
      item.onProcess = onProcess;
    }

    // Se a IA já estiver em processamento cognitivo para este contato, retém a mensagem na fila
    // sem disparar novo processamento paralelo concorrente (Anti-Atropelo)
    if (item.isProcessing) {
      console.log(`⏳ [Anti-Atropelo] Contato ${remoteJid} já possui processamento ativo da IA. Mensagem acumulada na fila.`);
      return;
    }

    // Reinicia o temporizador de debounce se novas mensagens chegarem em sequência rápida
    if (item.timeout) {
      clearTimeout(item.timeout);
    }

    item.timeout = setTimeout(() => {
      this.processQueue(remoteJid);
    }, this.DEBOUNCE_TIME_MS);
  }

  /**
   * Processa o lote consolidado de mensagens de forma atômica e sequencial por contato.
   */
  private static async processQueue(remoteJid: string): Promise<void> {
    const item = this.buffers.get(remoteJid);
    if (!item) return;

    if (item.isProcessing) return;

    if (item.messages.length === 0) {
      this.buffers.delete(remoteJid);
      return;
    }

    // Adquire o lock de processamento para este remoteJid
    item.isProcessing = true;
    item.timeout = null;

    // Isola o lote de mensagens atual e limpa a fila para novas chegadas
    const batch = [...item.messages];
    item.messages = [];
    const consolidated = batch.join("\n");

    try {
      await item.onProcess(remoteJid, consolidated);
    } catch (error) {
      console.error(`[MessageBuffer] Erro ao processar mensagens consolidadas de ${remoteJid}:`, error);
    } finally {
      // Libera o lock
      item.isProcessing = false;

      // Se novas mensagens chegaram DURANTE o processamento da IA:
      if (item.messages.length > 0) {
        console.log(`🔄 [Anti-Atropelo] Novas mensagens pendentes para ${remoteJid} detectadas após ciclo anterior. Agendando próximo ciclo sequencial.`);
        item.timeout = setTimeout(() => {
          this.processQueue(remoteJid);
        }, 1200);
      } else {
        // Nenhuma mensagem pendente na fila, descarta o buffer com segurança
        this.buffers.delete(remoteJid);
      }
    }
  }

  public static isBuffering(remoteJid: string): boolean {
    const item = this.buffers.get(remoteJid);
    return Boolean(item && (item.messages.length > 0 || item.isProcessing));
  }

  public static isProcessing(remoteJid: string): boolean {
    return Boolean(this.buffers.get(remoteJid)?.isProcessing);
  }
}
