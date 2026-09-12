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
    label: "Pré-Agendamentos",
    shortLabel: "Pré-Agendamentos",
    description: "Novos triados pela IA",
    color: {
      border: "border-blue-500",
      badge: "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      bg: "bg-blue-50/20 dark:bg-blue-950/10",
      accent: "text-blue-600 dark:text-blue-400",
      dot: "bg-blue-500",
      headerBg: "from-blue-500/10 to-transparent",
    },
  },
  {
    key: "AGUARDANDO_CONFIRMACAO",
    label: "Em Negociação",
    shortLabel: "Em Negociação",
    description: "Recepção conversando",
    color: {
      border: "border-amber-500",
      badge: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      bg: "bg-amber-50/20 dark:bg-amber-950/10",
      accent: "text-amber-600 dark:text-amber-400",
      dot: "bg-amber-500",
      headerBg: "from-amber-500/10 to-transparent",
    },
  },
  {
    key: "AGENDADO",
    label: "Consultas Agendadas",
    shortLabel: "Agendadas",
    description: "Data e hora confirmadas",
    color: {
      border: "border-emerald-500",
      badge: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      bg: "bg-emerald-50/20 dark:bg-emerald-950/10",
      accent: "text-emerald-600 dark:text-emerald-400",
      dot: "bg-emerald-500",
      headerBg: "from-emerald-500/10 to-transparent",
    },
  },
  {
    key: "TRANSBORDO_HUMANO",
    label: "Atenção da Recepção",
    shortLabel: "Atenção",
    description: "Casos de intervenção humana (Sofia em pausa)",
    color: {
      border: "border-purple-500",
      badge: "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
      bg: "bg-purple-50/20 dark:bg-purple-950/10",
      accent: "text-purple-600 dark:text-purple-400",
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
