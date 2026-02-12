export const IPFS_READ_KINDS = ["json", "text", "snippet", "image"] as const;

export type IpfsReadKind = (typeof IPFS_READ_KINDS)[number];

export type ManifestIpfsAllowEntry = {
  cid?: string;
  paths: string[];
  as: IpfsReadKind[];
  maxBytes?: number;
};

export type ManifestCapabilities = {
  ipfs?: {
    allow: ManifestIpfsAllowEntry[];
  };
};

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function normalizePathPattern(input: string): string {
  const trimmed = input.trim();
  if (!trimmed || trimmed === "/") return "**";
  return trimmed.replace(/^\/+/, "");
}

function ensureReadKinds(value: unknown, label: string): IpfsReadKind[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${label} must be a non-empty array`);
  }
  const allowed = new Set<string>(IPFS_READ_KINDS);
  const out: IpfsReadKind[] = [];
  for (const entry of value) {
    if (typeof entry !== "string" || !allowed.has(entry)) {
      throw new Error(`${label} contains invalid read kind: ${String(entry)}`);
    }
    out.push(entry as IpfsReadKind);
  }
  return Array.from(new Set(out));
}

function ensurePathPatterns(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${label} must be a non-empty array`);
  }
  const out: string[] = [];
  for (const entry of value) {
    if (typeof entry !== "string") {
      throw new Error(`${label} contains invalid path pattern: ${String(entry)}`);
    }
    out.push(normalizePathPattern(entry));
  }
  return Array.from(new Set(out));
}

function parseIpfsEntry(input: unknown, index: number): ManifestIpfsAllowEntry {
  if (!isObject(input)) {
    throw new Error(`capabilities.ipfs.allow[${index}] must be an object`);
  }

  const paths = ensurePathPatterns(input.paths, `capabilities.ipfs.allow[${index}].paths`);
  const as = ensureReadKinds(input.as, `capabilities.ipfs.allow[${index}].as`);

  const cid = input.cid;
  if (cid !== undefined && (typeof cid !== "string" || cid.trim().length === 0)) {
    throw new Error(`capabilities.ipfs.allow[${index}].cid must be a non-empty string when set`);
  }

  const maxBytes = input.maxBytes;
  if (maxBytes !== undefined) {
    if (
      typeof maxBytes !== "number" ||
      !Number.isInteger(maxBytes) ||
      maxBytes <= 0
    ) {
      throw new Error(`capabilities.ipfs.allow[${index}].maxBytes must be a positive integer when set`);
    }
  }

  return {
    cid: typeof cid === "string" ? cid.trim() : undefined,
    paths,
    as,
    maxBytes: typeof maxBytes === "number" ? maxBytes : undefined
  };
}

export function validateManifestCapabilities(input: unknown): ManifestCapabilities | undefined {
  if (input === undefined || input === null) return undefined;
  if (!isObject(input)) {
    throw new Error("capabilities must be an object");
  }

  const out: ManifestCapabilities = {};

  if (input.ipfs !== undefined) {
    if (!isObject(input.ipfs)) {
      throw new Error("capabilities.ipfs must be an object");
    }
    const allowRaw = input.ipfs.allow;
    if (!Array.isArray(allowRaw)) {
      throw new Error("capabilities.ipfs.allow must be an array");
    }
    out.ipfs = {
      allow: allowRaw.map((entry, index) => parseIpfsEntry(entry, index))
    };
  }

  return out;
}

