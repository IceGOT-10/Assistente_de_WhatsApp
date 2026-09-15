import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env";
import { UserTokenPayload } from "../services/auth.service";

export interface AuthenticatedRequest extends Request {
  user?: UserTokenPayload;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Token de autenticação ausente ou malformatado.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as UserTokenPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: "Sessão expirada ou token inválido. Por favor, faça login novamente.",
    });
  }
}

