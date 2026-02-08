import fs from "node:fs";
import path from "node:path";
import { ensureDir, walkFiles } from "./fs-utils";

type ManifestFile = { path: string; bytes: number };
type Manifest = {
  name?: string;
  version?: string;
  description?: string;
  entry?: string;
  files?: ManifestFile[];
};

function normalizeGateway(gateway: string): string {
  return gateway.endsWith("/") ? gateway.slice(0, -1) : gateway;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} ${text}`);
  }
  return (await res.json()) as T;
}

async function fetchBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} ${text}`);
  }
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

export async function ipfsAdd(
  outDir: string,
  ipfsApi: string,
  opts?: { pin?: boolean; onlyHash?: boolean }
): Promise<string> {
  const form = new FormData();
  const files = walkFiles(outDir);
  for (const file of files) {
    const rel = path.relative(outDir, file).replace(/\\/g, "/");
    const data = fs.readFileSync(file);
    form.append("file", new Blob([data]), rel);
  }

  const url = new URL("/api/v0/add", ipfsApi);
  url.searchParams.set("recursive", "true");
  url.searchParams.set("wrap-with-directory", "true");
  url.searchParams.set("cid-version", "1");
  url.searchParams.set("pin", opts?.pin ? "true" : "false");
  if (opts?.onlyHash) {
    url.searchParams.set("only-hash", "true");
  }

  const response = await fetch(url.toString(), { method: "POST", body: form });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`IPFS add failed: ${response.status} ${text}`);
  }
  const body = await response.text();
  const lines = body.trim().split("\n").filter(Boolean);
  if (lines.length === 0) {
    throw new Error("IPFS add returned empty response");
  }
  const last = JSON.parse(lines[lines.length - 1]) as { Hash?: string; Cid?: { "/": string } };
  const cid = last.Hash ?? last.Cid?.["/"];
  if (!cid) {
    throw new Error("IPFS add response missing CID");
  }
  return cid;
}

export async function computeIpfsCid(outDir: string, ipfsApi: string): Promise<string> {
  return ipfsAdd(outDir, ipfsApi, { onlyHash: true });
}

export async function fetchDappManifest(rootCid: string, ipfsGateway: string): Promise<Manifest> {
  const gateway = normalizeGateway(ipfsGateway);
  const url = `${gateway}/ipfs/${rootCid}/manifest.json`;
  const manifest = await fetchJson<Manifest>(url);
  if (!manifest || !Array.isArray(manifest.files)) {
    throw new Error("manifest.json missing files list");
  }
  return manifest;
}

export async function downloadDappBundle(
  rootCid: string,
  outDir: string,
  ipfsGateway: string,
  manifest: Manifest
) {
  const gateway = normalizeGateway(ipfsGateway);
  // Avoid stale files from previous fetches affecting local verification.
  fs.rmSync(outDir, { recursive: true, force: true });
  ensureDir(outDir);
  fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));

  const files = manifest.files ?? [];
  for (const entry of files) {
    const rel = entry.path;
    const url = `${gateway}/ipfs/${rootCid}/${rel}`;
    const data = await fetchBytes(url);
    const dest = path.join(outDir, rel);
    ensureDir(path.dirname(dest));
    fs.writeFileSync(dest, data);
  }
}

export { normalizeGateway };
