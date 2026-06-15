import { createLogger } from '@/lib/logger';

const logger = createLogger('credential-storage');

const STORAGE_KEY = 'learn-genie-saved-credentials';

/** Check if running in browser environment */
const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

/**
 * Simple XOR-based encryption for browser storage.
 * Not cryptographically secure but prevents plain-text exposure.
 * Passwords are never stored in plain text.
 */
function xorEncrypt(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result);
}

function xorDecrypt(encoded: string, key: string): string {
  try {
    const text = atob(encoded);
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  } catch {
    return '';
  }
}

/**
 * Derive a device-specific encryption key.
 * Combines user agent and a static salt for basic obfuscation.
 */
function getEncryptionKey(): string {
  const salt = 'learn-genie-v1-credential';
  const ua = navigator.userAgent || '';
  return xorEncrypt(ua, salt);
}

export interface SavedCredentials {
  email: string;
  encryptedPassword: string;
  savedAt: number;
}

/**
 * Save email and password to localStorage with basic encryption.
 * Password is encrypted using XOR with a device-derived key.
 */
export function saveCredentials(email: string, password: string): void {
  if (!isBrowser) return;
  try {
    const key = getEncryptionKey();
    const credentials: SavedCredentials = {
      email,
      encryptedPassword: xorEncrypt(password, key),
      savedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
    logger.info('Credentials saved successfully');
  } catch (e) {
    logger.error('Failed to save credentials:', e);
  }
}

/**
 * Load saved credentials from localStorage.
 * Returns email and decrypted password if found and decryptable.
 */
export function loadCredentials(): { email: string; password: string } | null {
  if (!isBrowser) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const data: SavedCredentials = JSON.parse(raw);
    if (!data.email || !data.encryptedPassword) return null;

    const key = getEncryptionKey();
    const password = xorDecrypt(data.encryptedPassword, key);
    if (!password) return null;

    return { email: data.email, password };
  } catch (e) {
    logger.error('Failed to load credentials:', e);
    return null;
  }
}

/**
 * Remove saved credentials from localStorage.
 */
export function clearCredentials(): void {
  if (!isBrowser) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    logger.info('Credentials cleared');
  } catch (e) {
    logger.error('Failed to clear credentials:', e);
  }
}

/**
 * Check if credentials are saved.
 */
export function hasSavedCredentials(): boolean {
  if (!isBrowser) return false;
  return !!localStorage.getItem(STORAGE_KEY);
}
