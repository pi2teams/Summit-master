import { jwtVerify, SignJWT } from "jose";

export interface SummitJwtPayload {
  userId: string;
  email?: string;
  piUid?: string;
  piUsername?: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

export function getRawTokenFromAuthHeader(authHeader: string | null) {
  if (!authHeader) return null;
  // Support both: "Bearer <token>" and legacy "<token>"
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  return (m ? m[1] : authHeader).trim();
}

export async function verifySummitToken(authHeader: string | null): Promise<SummitJwtPayload> {
  const raw = getRawTokenFromAuthHeader(authHeader);
  if (!raw) throw new Error("missing_token");
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("missing_jwt_secret");
  const { payload } = await jwtVerify(raw, new TextEncoder().encode(secret));
  return payload as unknown as SummitJwtPayload;
}

export async function signSummitToken(payload: { userId: string; email?: string; piUid?: string; piUsername?: string }) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("missing_jwt_secret");
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(process.env.JWT_ISSUER || "https://summit.local")
    .setAudience(process.env.JWT_AUDIENCE || "https://summit.local")
    .setExpirationTime(process.env.JWT_EXPIRES_IN || "7d")
    .sign(new TextEncoder().encode(secret));
}
