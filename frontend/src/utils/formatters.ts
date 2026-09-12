import type { PeriodoPreferencia } from "../types/lead";

/**
 * Formata um telefone para o formato padrão legível brasileiro.
 * Ex: 5511988887777 -> (11) 98888-7777
 */
export function formatPhone(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");

  // Se vier com o DDI 55
  if (cleaned.length === 13 && cleaned.startsWith("55")) {
    const ddd = cleaned.substring(2, 4);
    const parte1 = cleaned.substring(4, 9);
    const parte2 = cleaned.substring(9, 13);
    return `(${ddd}) ${parte1}-${parte2}`;
  }

  // 11 dígitos com 9 dígitos no celular
  if (cleaned.length === 11) {
    const ddd = cleaned.substring(0, 2);
    const parte1 = cleaned.substring(2, 7);
    const parte2 = cleaned.substring(7, 11);
    return `(${ddd}) ${parte1}-${parte2}`;
  }

  // 10 dígitos (fixo)
  if (cleaned.length === 10) {
    const ddd = cleaned.substring(0, 2);
    const parte1 = cleaned.substring(2, 6);
    const parte2 = cleaned.substring(6, 10);
    return `(${ddd}) ${parte1}-${parte2}`;
  }

  return phone;
}

/**
 * Gera o link direto para o WhatsApp do paciente.
 */
export function getWhatsAppLink(phone: string, name?: string): string {
  const cleaned = phone.replace(/\D/g, "");
  const number = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
  const text = name
    ? `Olá, ${name}! Tudo bem? Sou da equipe OdontoPrime e estou entrando em contato sobre a sua solicitação.`
    : `Olá! Sou da equipe OdontoPrime e estou entrando em contato sobre a sua solicitação.`;

  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

/**
 * Formata a data de criação em tempo decorrido relativo ("Há 5 minutos", "Há 2 horas", etc.)
 */
export function formatTimeAgo(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHour / 24);

    if (diffSec < 45) {
      return "Agora mesmo";
    }
    if (diffMin < 60) {
      return `Há ${diffMin} ${diffMin === 1 ? "min" : "min"}`;
    }
    if (diffHour < 24) {
      return `Há ${diffHour} ${diffHour === 1 ? "hora" : "horas"}`;
    }
    if (diffDays === 1) {
      return "Ontem";
    }
    if (diffDays < 7) {
      return `Há ${diffDays} dias`;
    }

    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

/**
 * Retorna data e hora completas para exibição detalhada
 */
export function formatFullDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

/**
 * Retorna iniciais para o avatar a partir do nome
 */
export function getInitials(name: string): string {
  if (!name) return "PT";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Retorna paleta de cor de avatar com base no nome para consistência visual
 */
export function getAvatarColor(name: string): string {
  const colors = [
    "bg-indigo-100 text-indigo-700 border-indigo-200",
    "bg-blue-100 text-blue-700 border-blue-200",
    "bg-teal-100 text-teal-700 border-teal-200",
    "bg-emerald-100 text-emerald-700 border-emerald-200",
    "bg-violet-100 text-violet-700 border-violet-200",
    "bg-rose-100 text-rose-700 border-rose-200",
    "bg-amber-100 text-amber-700 border-amber-200",
    "bg-cyan-100 text-cyan-700 border-cyan-200",
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

/**
 * Converte código do período em texto humanizado
 */
export function getPeriodoInfo(periodo?: PeriodoPreferencia): {
  label: string;
  icon: "sun" | "moon" | "clock";
} {
  switch (periodo) {
    case "MANHA":
      return { label: "Manhã (08h - 12h)", icon: "sun" };
    case "TARDE":
      return { label: "Tarde (13h - 18h)", icon: "moon" };
    case "QUALQUER":
    default:
      return { label: "Qualquer horário", icon: "clock" };
  }
}
