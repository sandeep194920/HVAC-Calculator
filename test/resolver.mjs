/**
 * Module resolver for `node --test`.
 *
 * The engine is written the way Next.js expects — `@/` path aliases and
 * extensionless imports. Node's own resolver wants neither. This hook bridges
 * the two so `lib/` can be unit tested directly, without a bundler and without
 * writing the source to suit the test runner.
 */
import { fileURLToPath, pathToFileURL } from "node:url";
import { existsSync } from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXTENSIONS = [".ts", ".tsx", ".js", ".mjs"];

/** Add an extension, or resolve a directory to its index file. */
function withExtension(absPath) {
  if (existsSync(absPath) && path.extname(absPath)) return absPath;
  for (const ext of EXTENSIONS) {
    if (existsSync(absPath + ext)) return absPath + ext;
  }
  for (const ext of EXTENSIONS) {
    const indexPath = path.join(absPath, `index${ext}`);
    if (existsSync(indexPath)) return indexPath;
  }
  return null;
}

export function resolve(specifier, context, nextResolve) {
  // "@/lib/units" -> "<root>/lib/units.ts"
  if (specifier.startsWith("@/")) {
    const resolved = withExtension(path.join(projectRoot, specifier.slice(2)));
    if (resolved) return { url: pathToFileURL(resolved).href, shortCircuit: true };
  }

  // "./units" -> "./units.ts"
  if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
    const parentDir = path.dirname(fileURLToPath(context.parentURL));
    const resolved = withExtension(path.resolve(parentDir, specifier));
    if (resolved) return { url: pathToFileURL(resolved).href, shortCircuit: true };
  }

  return nextResolve(specifier, context);
}
