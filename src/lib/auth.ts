import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development_myfinance_secure_key_123';
const TOKEN_COOKIE_NAME = 'myfinance_token';

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin';
}

/**
 * Hash password with bcryptjs
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare password with hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Sign JWT token
 */
export function signToken(payload: TokenPayload, expiresIn: string = '7d'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions);
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Generate secure random hex token (for password reset, email verification)
 */
export function generateRandomToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Extract authenticated user session from Request or Next.js cookies
 */
export async function getAuthSession(req?: Request): Promise<TokenPayload | null> {
  let token: string | undefined;

  // 1. Check Bearer Authorization header if req is provided
  if (req) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  // 2. Fall back to reading cookie
  if (!token) {
    try {
      const cookieStore = cookies();
      const cookie = cookieStore.get(TOKEN_COOKIE_NAME);
      if (cookie) {
        token = cookie.value;
      }
    } catch {
      // Cookies not accessible in current context
    }
  }

  if (!token) return null;
  return verifyToken(token);
}

/**
 * In-memory rate limiter for authentication endpoints to prevent brute-force
 */
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

export function checkRateLimit(key: string, limit: number = 5, windowMs: number = 60000): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.expiresAt) {
    rateLimitMap.set(key, { count: 1, expiresAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, remaining: limit - record.count };
}

export { TOKEN_COOKIE_NAME };

