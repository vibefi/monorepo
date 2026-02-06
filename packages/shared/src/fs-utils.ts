import fs from "node:fs";
import path from "node:path";

export function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

export function walkFiles(root: string, opts?: { skipDotfiles?: boolean }): string[] {
  const skipDotfiles = opts?.skipDotfiles ?? false;
  const entries = fs.readdirSync(root, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (skipDotfiles && entry.name.startsWith(".")) {
      continue;
    }
    if (entry.name === "node_modules" || entry.name === ".git") {
      continue;
    }
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath, opts));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}
