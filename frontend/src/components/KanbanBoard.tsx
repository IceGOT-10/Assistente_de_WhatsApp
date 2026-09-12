import type { ColumnConfig, Lead, LeadStatus } from "../types/lead";
import { KanbanColumn } from "./KanbanColumn";

interface KanbanBoardProps {
  leads: Lead[];
  onUpdateStatus: (id: string, newStatus: LeadStatus) => Promise<void>;
  onResetSession: (telefone: string) => Promise<void>;
  onOpenDetails: (lead: Lead) => void;
  updatingId: string | null;
}

const COLUMNS: ColumnConfig[] = [
  {
    key: "NOVO",
    label: "Novos Leads",
    shortLabel: "Novos",
    description: "Recém captados via WhatsApp",
    color: {
      border: "border-blue-500",
      badge: "bg-blue-50 text-blue-700 border-blue-200",
      bg: "bg-blue-50/20",
      accent: "text-blue-600",
      dot: "bg-blue-500",
      headerBg: "from-blue-500/10 to-transparent",
    },
  },
  {
    key: "AGUARDANDO_CONFIRMACAO",
    label: "Aguardando Confirmação",
    shortLabel: "Confirmação",
    description: "Triados, aguardando validação",
    color: {
      border: "border-amber-500",
      badge: "bg-amber-50 text-amber-700 border-amber-200",
      bg: "bg-amber-50/20",
      accent: "text-amber-600",
      dot: "bg-amber-500",
      headerBg: "from-amber-500/10 to-transparent",
    },
  },
  {
    key: "AGENDADO",
    label: "Agendados",
    shortLabel: "Agendados",
    description: "Horário confirmado na agenda",
    color: {
      border: "border-emerald-500",
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
      bg: "bg-emerald-50/20",
      accent: "text-emerald-600",
      dot: "bg-emerald-500",
      headerBg: "from-emerald-500/10 to-transparent",
    },
  },
  {
    key: "TRANSBORDO_HUMANO",
    label: "Transbordo Humano",
    shortLabel: "Transbordo",
    description: "Transferidos para recepção física",
    color: {
      border: "border-purple-500",
      badge: "bg-purple-50 text-purple-700 border-purple-200",
      bg: "bg-purple-50/20",
      accent: "text-purple-600",
      dot: "bg-purple-500",
      headerBg: "from-purple-500/10 to-transparent",
    },
  },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  leads,
  onUpdateStatus,
  onResetSession,
  onOpenDetails,
  updatingId,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
      {COLUMNS.map((column) => {
        const columnLeads = leads.filter((l) => l.status === column.key);
        return (
          <KanbanColumn
            key={column.key}
            column={column}
            leads={columnLeads}
            onUpdateStatus={onUpdateStatus}
            onResetSession={onResetSession}
            onOpenDetails={onOpenDetails}
            updatingId={updatingId}
          />
        );
      })}
    </div>
  );
};
