import axios from "axios";
import type { Lead, LeadStatus, UpdateLeadDTO } from "../types/lead";
import type { AppointmentItem, CreateAppointmentDTO } from "../types/appointment";
import type { ConversationSummary, ChatMessage } from "../types/chat";
import type { CustomerListResponse, CustomerItem } from "../types/customer";
import type { AiConfigData } from "../types/aiConfig";
import type { DashboardStatsData, UpcomingAppointment } from "../types/dashboard";

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
   * Verifica a conectividade e saúde da API do backend.
   */
  async checkHealth(): Promise<{ status: string; clinic?: string }> {
    const response = await apiClient.get<{ status: string; clinic?: string }>("/health");
    return response.data;
  },

  /**
   * Busca a lista completa de leads triados.
   */
  async getLeads(): Promise<Lead[]> {
    const response = await apiClient.get<Lead[]>("/leads");
    return response.data;
  },

  /**
   * Atualiza os dados cadastrais do lead (edição na recepção).
   */
  async updateLead(id: string, data: UpdateLeadDTO): Promise<Lead> {
    const response = await apiClient.put<Lead>(`/leads/${id}`, data);
    return response.data;
  },

  /**
   * Atualiza a etapa (status) de um lead no Kanban.
   */
  async updateLeadStatus(id: string, status: LeadStatus): Promise<Lead> {
    const response = await apiClient.patch<Lead>(`/leads/${id}/status`, { status });
    return response.data;
  },

  /**
   * Reseta a sessão de atendimento do WhatsApp e libera a pausa da IA.
   */
  async resetSession(telefone: string): Promise<{ success: boolean; message: string }> {
    const cleanTelefone = telefone.replace(/\D/g, "");
    const response = await apiClient.post<{ success: boolean; message: string }>(
      `/sessions/${cleanTelefone}/reset`
    );
    return response.data;
  },

  // ==================== DASHBOARD ====================
  async getDashboardStats(): Promise<DashboardStatsData> {
    const response = await apiClient.get<DashboardStatsData>("/dashboard/stats");
    return response.data;
  },

  async getUpcomingAppointments(): Promise<UpcomingAppointment[]> {
    const response = await apiClient.get<UpcomingAppointment[]>("/dashboard/upcoming");
    return response.data;
  },

  // ==================== AGENDA (APPOINTMENTS) ====================
  async getAppointments(filters?: {
    startDate?: string;
    endDate?: string;
    profissional?: string;
    status?: string;
  }): Promise<AppointmentItem[]> {
    const response = await apiClient.get<AppointmentItem[]>("/appointments", {
      params: filters,
    });
    return response.data;
  },

  async createAppointment(data: CreateAppointmentDTO): Promise<AppointmentItem> {
    const response = await apiClient.post<AppointmentItem>("/appointments", data);
    return response.data;
  },

  async updateAppointmentStatus(id: string, status: string): Promise<AppointmentItem> {
    const response = await apiClient.patch<AppointmentItem>(`/appointments/${id}/status`, {
      status,
    });
    return response.data;
  },

  async updateAppointment(id: string, data: Partial<CreateAppointmentDTO>): Promise<AppointmentItem> {
    const response = await apiClient.put<AppointmentItem>(`/appointments/${id}`, data);
    return response.data;
  },

  // ==================== CHAT & WHATSAPP ====================
  async getConversations(): Promise<ConversationSummary[]> {
    const response = await apiClient.get<ConversationSummary[]>("/chat/conversations");
    return response.data;
  },

  async getMessages(telefone: string): Promise<ChatMessage[]> {
    const cleanTelefone = telefone.replace(/\D/g, "");
    const response = await apiClient.get<ChatMessage[]>(`/chat/messages/${cleanTelefone}`);
    return response.data;
  },

  async sendMessage(telefone: string, texto: string): Promise<ChatMessage> {
    const cleanTelefone = telefone.replace(/\D/g, "");
    const response = await apiClient.post<ChatMessage>("/chat/send", {
      telefone: cleanTelefone,
      texto,
    });
    return response.data;
  },

  async takeoverSession(telefone: string): Promise<{ success: boolean; message: string }> {
    const cleanTelefone = telefone.replace(/\D/g, "");
    const response = await apiClient.post<{ success: boolean; message: string }>(
      `/chat/takeover/${cleanTelefone}`
    );
    return response.data;
  },

  async markMessagesRead(telefone: string): Promise<{ success: boolean }> {
    const cleanTelefone = telefone.replace(/\D/g, "");
    const response = await apiClient.patch<{ success: boolean }>(`/chat/read/${cleanTelefone}`);
    return response.data;
  },

  // ==================== CLIENTES (CUSTOMERS) ====================
  async getCustomers(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<CustomerListResponse> {
    const response = await apiClient.get<CustomerListResponse>("/customers", {
      params,
    });
    return response.data;
  },

  async createCustomer(data: Partial<CustomerItem>): Promise<CustomerItem> {
    const response = await apiClient.post<CustomerItem>("/customers", data);
    return response.data;
  },

  async updateCustomer(id: string, data: Partial<CustomerItem>): Promise<CustomerItem> {
    const response = await apiClient.put<CustomerItem>(`/customers/${id}`, data);
    return response.data;
  },

  // ==================== CONFIGURAÇÃO DA IA ====================
  async getAiConfig(): Promise<AiConfigData> {
    const response = await apiClient.get<AiConfigData>("/ai/config");
    return response.data;
  },

  async updateAiConfig(data: Partial<AiConfigData>): Promise<AiConfigData> {
    const response = await apiClient.put<AiConfigData>("/ai/config", data);
    return response.data;
  },
};
