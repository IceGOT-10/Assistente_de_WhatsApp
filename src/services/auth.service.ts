import { PrismaClient, Role, User } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env";

const prisma = new PrismaClient();

export interface UserTokenPayload {
  id: string;
  nome: string;
  email: string;
  role: Role;
}

export interface LoginResult {
  token: string;
  user: {
    id: string;
    nome: string;
    email: string;
    role: Role;
  };
}

export class AuthService {
  /**
   * Garante a existência do usuário administrador inicial no banco de dados.
   */
  public static async ensureDefaultAdmin(): Promise<void> {
    const adminEmail = "admin@odontoprime.com.br";
    const existing = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!existing) {
      const senhaHash = await bcrypt.hash("admin123", 10);
      await prisma.user.create({
        data: {
          nome: "Administrador OdontoPrime",
          email: adminEmail,
          senhaHash,
          role: Role.ADMIN,
          ativo: true,
        },
      });
      console.log("👤 [Auth] Usuário administrador padrão criado (admin@odontoprime.com.br).");
    }
  }

  /**
   * Autentica um usuário com email e senha e devolve o token JWT com seus dados.
   */
  public static async login(email: string, senhaPlana: string): Promise<LoginResult> {
    if (!email || !senhaPlana) {
      throw new Error("E-mail e senha são obrigatórios.");
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user || !user.ativo) {
      throw new Error("Credenciais inválidas ou usuário inativo.");
    }

    const senhaCorreta = await bcrypt.compare(senhaPlana, user.senhaHash);
    if (!senhaCorreta) {
      throw new Error("Credenciais inválidas ou usuário inativo.");
    }

    const payload: UserTokenPayload = {
      id: user.id,
      nome: user.nome,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, ENV.JWT_SECRET, {
      expiresIn: "7d",
    });

    return {
      token,
      user: payload,
    };
  }

  /**
   * Retorna os dados do operador logado a partir do seu ID.
   */
  public static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        ativo: true,
        createdAt: true,
      },
    });

    if (!user || !user.ativo) {
      throw new Error("Usuário não encontrado ou inativo.");
    }

    return user;
  }
}

