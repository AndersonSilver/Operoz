import { createHash, randomUUID } from "node:crypto";
import { constants as fsConstants } from "node:fs";
import { chmod, mkdir, open, readFile, rename, unlink } from "node:fs/promises";
import { dirname, join } from "node:path";

import type {
  StoreSnapshot,
  StoredClient,
  StoredConsumedTicket,
  StoredGrant,
  StoredPending,
  StoredToken,
} from "./types.js";
import { emptySnapshot } from "./types.js";

/** Chave de lookup: nunca guardamos o segredo em claro, só o SHA-256 hex. */
export function hashKey(secret: string): string {
  return createHash("sha256").update(secret, "utf8").digest("hex");
}

export type AuthStore = {
  getClient(clientId: string): Promise<StoredClient | undefined>;
  putClient(clientId: string, client: StoredClient): Promise<void>;
  touchClient(clientId: string): Promise<void>;

  putGrant(code: string, grant: StoredGrant): Promise<void>;
  peekGrant(code: string): Promise<StoredGrant | undefined>;
  /** Single-use: devolve e remove atomicamente. */
  consumeGrant(code: string): Promise<StoredGrant | undefined>;

  putToken(token: string, stored: StoredToken): Promise<void>;
  getToken(token: string): Promise<StoredToken | undefined>;
  deleteToken(token: string): Promise<StoredToken | undefined>;
  markTokenValidated(token: string, at: number): Promise<void>;
  /** Remove todos os tokens (access+refresh) de um par cliente/utilizador. Devolve os removidos. */
  deleteTokensForSubject(clientId: string, apiTokenId: string | undefined, userId?: string): Promise<StoredToken[]>;

  putPending(ticket: string, pending: StoredPending): Promise<void>;
  peekPending(ticket: string): Promise<StoredPending | undefined>;
  /** Single-use: devolve e remove atomicamente. */
  consumePending(ticket: string): Promise<StoredPending | undefined>;

  /** Recibo de consumo do ticket — torna `/oauth/web-callback` idempotente. */
  putConsumedTicket(ticket: string, entry: StoredConsumedTicket): Promise<void>;
  getConsumedTicket(ticket: string): Promise<StoredConsumedTicket | undefined>;
  /**
   * Reclama o ticket para o callback numa ÚNICA mutação: remove o pendente e grava
   * a reserva do recibo no mesmo passo. Sem isto haveria uma janela em que o
   * pendente já não existe e o recibo ainda não existe — e uma chamada concorrente
   * leria "ticket desconhecido" (`400`), que o Django trata como rejeição
   * definitiva e usa para apagar o `APIToken`.
   */
  claimPendingForCallback(ticket: string, ttlMs: number): Promise<ClaimResult>;

  /** Só para testes/diagnóstico. */
  snapshot(): Promise<StoreSnapshot>;
};

export type ClaimResult =
  /** Reclamado agora por nós: seguir para a emissão do code. */
  | { status: "claimed"; pending: StoredPending }
  /** Já reclamado antes: `receipt.redirectUrl` preenchido = responder idempotente. */
  | { status: "already"; receipt: StoredConsumedTicket }
  /** Não existe pendente nem recibo (desconhecido, expirado, ou negado). */
  | { status: "missing" };

export type JsonFileAuthStoreOptions = {
  filePath: string;
  maxClients?: number;
  now?: () => number;
};

/**
 * Store JSON com escrita atómica (`writeFile(tmp)` → `fsync` → `rename`) e escritas
 * serializadas por fila de promessas. Único processo, único container — sem
 * contenção entre processos (ver risco 9 do plano).
 */
export class JsonFileAuthStore implements AuthStore {
  private readonly filePath: string;
  private readonly maxClients: number;
  private readonly now: () => number;
  private data: StoreSnapshot | undefined;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(options: JsonFileAuthStoreOptions) {
    this.filePath = options.filePath;
    this.maxClients = options.maxClients ?? 500;
    this.now = options.now ?? (() => Date.now());
  }

  /** Serializa qualquer operação (leitura+escrita) numa única fila. */
  private run<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.queue.then(fn, fn);
    // A fila não pode morrer por causa de uma rejeição de uma operação anterior.
    this.queue = next.then(
      () => undefined,
      () => undefined
    );
    return next;
  }

  private async load(): Promise<StoreSnapshot> {
    if (this.data) return this.data;
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<StoreSnapshot>;
      this.data = {
        version: 1,
        clients: parsed.clients ?? {},
        grants: parsed.grants ?? {},
        tokens: parsed.tokens ?? {},
        pendings: parsed.pendings ?? {},
        consumed: parsed.consumed ?? {},
      };
    } catch (error) {
      const code = (error as NodeJS.ErrnoException | undefined)?.code;
      if (code !== "ENOENT") {
        // Ficheiro corrompido / JSON inválido: recomeçar vazio é preferível a não
        // arrancar. O custo é reautorizar os conectores — não há dado de negócio aqui.
        console.error("operoz-mcp auth-store: ficheiro ilegível, a recomeçar vazio.", code ?? error);
      }
      this.data = emptySnapshot();
    }
    return this.data;
  }

  private async flush(): Promise<void> {
    const data = this.data ?? emptySnapshot();
    const dir = dirname(this.filePath);
    await mkdir(dir, { recursive: true });
    const tmpPath = join(dir, `.${randomUUID()}.tmp`);
    const handle = await open(tmpPath, fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_TRUNC, 0o600);
    try {
      await handle.writeFile(JSON.stringify(data), "utf8");
      await handle.sync();
    } finally {
      await handle.close();
    }
    try {
      await rename(tmpPath, this.filePath);
    } catch (error) {
      await unlink(tmpPath).catch(() => undefined);
      throw error;
    }
    await chmod(this.filePath, 0o600).catch(() => undefined);
  }

  /** Remove entradas expiradas. Chamado antes de cada escrita. */
  private prune(data: StoreSnapshot): void {
    const now = this.now();
    for (const [key, value] of Object.entries(data.grants)) {
      if (value.expiresAt <= now) delete data.grants[key];
    }
    for (const [key, value] of Object.entries(data.tokens)) {
      if (value.expiresAt <= now) delete data.tokens[key];
    }
    for (const [key, value] of Object.entries(data.pendings)) {
      if (value.expiresAt <= now) delete data.pendings[key];
    }
    for (const [key, value] of Object.entries(data.consumed)) {
      if (value.expiresAt <= now) delete data.consumed[key];
    }
  }

  private evictClients(data: StoreSnapshot): void {
    const entries = Object.entries(data.clients);
    if (entries.length <= this.maxClients) return;
    entries.sort((a, b) => a[1].lastUsedAt - b[1].lastUsedAt);
    const excess = entries.length - this.maxClients;
    for (let index = 0; index < excess; index += 1) {
      delete data.clients[entries[index][0]];
    }
  }

  private async mutate<T>(fn: (data: StoreSnapshot) => T | Promise<T>): Promise<T> {
    return this.run(async () => {
      const data = await this.load();
      this.prune(data);
      const result = await fn(data);
      this.evictClients(data);
      await this.flush();
      return result;
    });
  }

  private async read<T>(fn: (data: StoreSnapshot) => T): Promise<T> {
    return this.run(async () => {
      const data = await this.load();
      this.prune(data);
      return fn(data);
    });
  }

  async getClient(clientId: string): Promise<StoredClient | undefined> {
    return this.read((data) => data.clients[clientId]);
  }

  async putClient(clientId: string, client: StoredClient): Promise<void> {
    await this.mutate((data) => {
      data.clients[clientId] = client;
    });
  }

  async touchClient(clientId: string): Promise<void> {
    await this.mutate((data) => {
      const client = data.clients[clientId];
      if (client) client.lastUsedAt = this.now();
    });
  }

  async putGrant(code: string, grant: StoredGrant): Promise<void> {
    await this.mutate((data) => {
      data.grants[hashKey(code)] = grant;
    });
  }

  async peekGrant(code: string): Promise<StoredGrant | undefined> {
    return this.read((data) => data.grants[hashKey(code)]);
  }

  async consumeGrant(code: string): Promise<StoredGrant | undefined> {
    return this.mutate((data) => {
      const key = hashKey(code);
      const grant = data.grants[key];
      if (grant) delete data.grants[key];
      return grant;
    });
  }

  async putToken(token: string, stored: StoredToken): Promise<void> {
    await this.mutate((data) => {
      data.tokens[hashKey(token)] = stored;
    });
  }

  async getToken(token: string): Promise<StoredToken | undefined> {
    return this.read((data) => data.tokens[hashKey(token)]);
  }

  async deleteToken(token: string): Promise<StoredToken | undefined> {
    return this.mutate((data) => {
      const key = hashKey(token);
      const stored = data.tokens[key];
      if (stored) delete data.tokens[key];
      return stored;
    });
  }

  async markTokenValidated(token: string, at: number): Promise<void> {
    await this.mutate((data) => {
      const stored = data.tokens[hashKey(token)];
      if (stored) stored.lastValidatedAt = at;
    });
  }

  async deleteTokensForSubject(
    clientId: string,
    apiTokenId: string | undefined,
    userId?: string
  ): Promise<StoredToken[]> {
    return this.mutate((data) => {
      const removed: StoredToken[] = [];
      for (const [key, value] of Object.entries(data.tokens)) {
        if (value.clientId !== clientId) continue;
        const sameUser =
          (userId !== undefined && value.subject.userId === userId) ||
          (apiTokenId !== undefined && value.subject.apiTokenId === apiTokenId);
        if (!sameUser) continue;
        removed.push(value);
        delete data.tokens[key];
      }
      return removed;
    });
  }

  async putPending(ticket: string, pending: StoredPending): Promise<void> {
    await this.mutate((data) => {
      data.pendings[hashKey(ticket)] = pending;
    });
  }

  async peekPending(ticket: string): Promise<StoredPending | undefined> {
    return this.read((data) => data.pendings[hashKey(ticket)]);
  }

  async consumePending(ticket: string): Promise<StoredPending | undefined> {
    return this.mutate((data) => {
      const key = hashKey(ticket);
      const pending = data.pendings[key];
      if (pending) delete data.pendings[key];
      return pending;
    });
  }

  async putConsumedTicket(ticket: string, entry: StoredConsumedTicket): Promise<void> {
    await this.mutate((data) => {
      data.consumed[hashKey(ticket)] = entry;
    });
  }

  async getConsumedTicket(ticket: string): Promise<StoredConsumedTicket | undefined> {
    return this.read((data) => data.consumed[hashKey(ticket)]);
  }

  async claimPendingForCallback(ticket: string, ttlMs: number): Promise<ClaimResult> {
    return this.mutate((data): ClaimResult => {
      const key = hashKey(ticket);

      const existing = data.consumed[key];
      if (existing) return { status: "already", receipt: existing };

      const pending = data.pendings[key];
      if (!pending) return { status: "missing" };

      delete data.pendings[key];
      const now = this.now();
      data.consumed[key] = { clientId: pending.clientId, consumedAt: now, expiresAt: now + ttlMs };
      return { status: "claimed", pending };
    });
  }

  async snapshot(): Promise<StoreSnapshot> {
    return this.read((data) => JSON.parse(JSON.stringify(data)) as StoreSnapshot);
  }
}
