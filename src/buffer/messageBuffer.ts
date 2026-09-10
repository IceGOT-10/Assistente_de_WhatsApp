type BufferItem = {
  timeout: NodeJS.Timeout;
  messages: string[];
};

type ProcessCallback = (remoteJid: string, consolidatedMessage: string) => Promise<void> | void;

export class MessageBuffer {
  private static buffers = new Map<string, BufferItem>();
  private static readonly DEBOUNCE_TIME_MS = 5000;

  public static addMessage(
    remoteJid: string,
    text: string,
    onProcess: ProcessCallback
  ): void {
    const existing = this.buffers.get(remoteJid);

    if (existing) {
      clearTimeout(existing.timeout);
      existing.messages.push(text);
    } else {
      this.buffers.set(remoteJid, {
        timeout: setTimeout(() => {}, 0),
        messages: [text],
      });
    }

    const current = this.buffers.get(remoteJid)!;

    current.timeout = setTimeout(async () => {
      const consolidated = current.messages.join("\n");
      this.buffers.delete(remoteJid);

      try {
        await onProcess(remoteJid, consolidated);
      } catch (error) {
        console.error(`[MessageBuffer] Erro ao processar mensagem de ${remoteJid}:`, error);
      }
    }, this.DEBOUNCE_TIME_MS);
  }

  public static isBuffering(remoteJid: string): boolean {
    return this.buffers.has(remoteJid);
  }
}
