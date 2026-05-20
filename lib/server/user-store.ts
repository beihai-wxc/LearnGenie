import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '.data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

export interface StoredUser {
  phone: string;
  passwordHash: string;
  nickname: string;
  avatar: string;
  createdAt: string;
  updatedAt: string;
}

let cache: Record<string, StoredUser> | null = null;
let writeLock: Promise<void> = Promise.resolve();

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readUsers(): Promise<Record<string, StoredUser>> {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(USERS_FILE, 'utf-8');
    cache = JSON.parse(raw);
    return cache ?? {};
  } catch {
    cache = {};
    return cache;
  }
}

async function writeUsers(users: Record<string, StoredUser>) {
  cache = users;
  writeLock = writeLock.then(async () => {
    await ensureDataDir();
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  });
  await writeLock;
}

export async function getUserByPhone(phone: string): Promise<StoredUser | undefined> {
  const users = await readUsers();
  return users[phone];
}

export async function getUserByPhoneWithPassword(
  phone: string,
): Promise<StoredUser | undefined> {
  return getUserByPhone(phone);
}

export async function createUser(user: StoredUser): Promise<StoredUser> {
  const users = await readUsers();
  if (users[user.phone]) {
    throw new Error('User already exists');
  }
  users[user.phone] = user;
  await writeUsers(users);
  return user;
}

export async function updateUser(
  phone: string,
  updates: Partial<Pick<StoredUser, 'nickname' | 'avatar' | 'passwordHash'>>,
): Promise<StoredUser | null> {
  const users = await readUsers();
  const existing = users[phone];
  if (!existing) return null;
  users[phone] = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  await writeUsers(users);
  return users[phone];
}
