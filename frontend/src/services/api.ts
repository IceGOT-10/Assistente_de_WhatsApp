import axios from "axios";
import type { Lead, LeadStatus } from "../types/lead";

const API_BASE_URL = "http://localhost:3000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const api = {
  /**
   * Busca a lista completa de leads triados.
   */
  async getLeads(): Promise<Lead[]> {
    const response = await apiClient.get<Lead[]>("/leads");
    return response.data;
  },

  /**
   * Atualiza a etapa (status) de um lead no Kanban.
   */
  async updateLeadStatus(id: string, status: LeadStatus): Promise<Lead> {
    const response = await apiClient.patch<Lead>(`/leads/${id}/status`, {
      status,
    });
    return response.data;
  },

  /**
   * Reseta a sessão de atendimento do WhatsApp e libera a pausa da IA.
   */
  async resetSession(
    telefone: string
  ): Promise<{ success: boolean; message: string }> {
    const cleanTelefone = telefone.replace(/\D/g, "");
    const response = await apiClient.post<{ success: boolean; message: string }>(
      `/sessions/${cleanTelefone}/reset`
    );
    return response.data;
  },

  /**
   * Verifica a conectividade e saúde da API do backend.
   */
  async checkHealth(): Promise<{ status: string; clinic?: string }> {
    const response = await apiClient.get<{ status: string; clinic?: string }>(
      "/health"
    );
    return response.data;
  },
};
