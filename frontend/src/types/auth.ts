export type UserRole = "ADMIN" | "ATENDENTE" | "DENTISTA";

export interface AuthUser {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  ativo?: boolean;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

