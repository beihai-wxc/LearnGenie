import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '.data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

export interface StoredUser {
  email: string;
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

export async function getUserByEmail(email: string): Promise<StoredUser | undefined> {
  const users = await readUsers();
  return users[email];
}

export async function getUserByEmailWithPassword(
  email: string,
): Promise<StoredUser | undefined> {
  return getUserByEmail(email);
}

export async function createUser(user: StoredUser): Promise<StoredUser> {
  const users = await readUsers();
  if (users[user.email]) {
    throw new Error('User already exists');
  }
  users[user.email] = user;
  await writeUsers(users);
  return user;
}

export async function updateUser(
  email: string,
  updates: Partial<Pick<StoredUser, 'nickname' | 'avatar' | 'passwordHash'>>,
): Promise<StoredUser | null> {
  const users = await readUsers();
  const existing = users[email];
  if (!existing) return null;
  users[email] = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  await writeUsers(users);
  return users[email];
}
