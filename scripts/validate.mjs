#!/usr/bin/env node
// Repo-level validator for a Career Assistant seed repository.
// No network. No dependencies. Checks the root index, pack manifests, item
// envelopes, raw item digests and the pack digest. The app's pydantic parser
// remains authoritative for the full schema; this catches the repo contract.

import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const errors = [];
const warnings = [];
const fail = (message) => errors.push(message);
const warn = (message) => warnings.push(message);

const KEBAB = /^[a-z][a-z0-9-]{1,63}$/;
const SEED_KEY = /^[a-z][a-z0-9-]{1,63}:[a-z0-9][a-z0-9._/-]{0,119}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const SEMVER = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;
const SHA256 = /^[0-9a-f]{64}$/;
const PACK_DIGEST = /^sha256:[0-9a-f]{64}$/;
const LICENSES = new Set(["Apache-2.0", "CC-BY-4.0", "CC-BY-SA-4.0", "CC0-1.0", "MIT"]);
const FORMATS = new Set([
  "ats_presets",
  "endpoint_descriptors",
  "job_types",
  "companies",
  "roadmap_graph",
  "roadmap_content",
  "external_reference"
]);
const ALLOWED_PACK_FILES = new Set(["manifest.json", "README.md", "LICENSE", "CHANGELOG.md"]);

const readText = (path) => readFileSync(join(ROOT, path), "utf8");
const readBytes = (path) => readFileSync(join(ROOT, path));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

function readJson(path) {
  try {
    return JSON.parse(readText(path));
  } catch (error) {
    fail(`${path}: ${error.message}`);
    return null;
  }
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (isObject(value)) {
    const out = {};
    for (const key of Object.keys(value).sort()) out[key] = canonical(value[key]);
    return out;
  }
  return value;
}

function packDigest(manifest, itemFiles, packPath) {
  const hash = createHash("sha256");
  hash.update(JSON.stringify(canonical(manifest)));
  for (const entry of itemFiles) {
    hash.update("\0");
    hash.update(entry.path);
    hash.update("\0");
    hash.update(readBytes(join(packPath, entry.path)));
  }
  return `sha256:${hash.digest("hex")}`;
}

function walk(dir, out = []) {
  for (const name of readdirSync(join(ROOT, dir)).sort()) {
    const rel = join(dir, name);
    const stat = lstatSync(join(ROOT, rel));
    if (stat.isSymbolicLink()) {
      fail(`${rel}: symlinks are forbidden`);
      continue;
    }
    if (stat.isDirectory()) walk(rel, out);
    else out.push(rel);
  }
  return out;
}

const index = readJson("seed-repo.json");
if (!index) {
  report();
}

if (index) {
  if (index.schemaVersion !== 1) fail("seed-repo.json: schemaVersion must be 1");
  if (index.kind !== "career-seed-repo") fail("seed-repo.json: kind must be career-seed-repo");
  if (!isObject(index.publisher) || !KEBAB.test(index.publisher.id || "")) {
    fail("seed-repo.json: publisher.id is missing or not kebab-case");
  }
  if (!Array.isArray(index.packs) || index.packs.length === 0) {
    fail("seed-repo.json: packs must be a non-empty array");
  }
}

const publisherId = index?.publisher?.id;
const indexedPaths = new Set();
const packIds = new Set();

for (const pack of index?.packs ?? []) {
  const label = `seed-repo.json pack ${pack?.id ?? "?"}`;
  if (!isObject(pack)) {
    fail(`${label}: not an object`);
    continue;
  }
  if (!KEBAB.test(pack.id || "")) fail(`${label}: id is not kebab-case`);
  const expectedPath = `packs/${publisherId}/${String(pack.path || "").split("/").pop()}`;
  if (pack.path !== expectedPath) fail(`${label}: path must be ${expectedPath}`);
  if (pack.manifest !== `${pack.path}/manifest.json`) {
    fail(`${label}: manifest must be ${pack.path}/manifest.json`);
  }
  if (!LICENSES.has(pack.license)) fail(`${label}: license ${pack.license} is not allowed`);
  if (!SEMVER.test(pack.version || "")) fail(`${label}: version is not semver`);
  if (!PACK_DIGEST.test(pack.digest || "")) fail(`${label}: digest is not sha256:hex`);
  if (pack.signature !== null && !isObject(pack.signature)) {
    fail(`${label}: signature must be null or an object`);
  }
  if (indexedPaths.has(pack.path)) fail(`${label}: duplicate path ${pack.path}`);
  if (packIds.has(pack.id)) fail(`${label}: duplicate id ${pack.id}`);
  indexedPaths.add(pack.path);
  packIds.add(pack.id);

  if (!existsSync(join(ROOT, pack.manifest))) {
    fail(`${label}: manifest not found at ${pack.manifest}`);
    continue;
  }
  const manifest = readJson(pack.manifest);
  if (!manifest) continue;

  if (manifest.id !== pack.id) fail(`${label}: manifest.id ${manifest.id} != index id`);
  if (manifest.schema_version !== "1.0") fail(`${label}: manifest schema_version must be "1.0"`);
  if (!SEMVER.test(manifest.version || "")) fail(`${label}: manifest version is not semver`);
  if (manifest.version !== pack.version) fail(`${label}: index/manifest version mismatch`);
  if (!LICENSES.has(manifest.license)) fail(`${label}: manifest license is not allowed`);
  if (manifest.license !== pack.license) fail(`${label}: index/manifest license mismatch`);
  if (manifest.scope !== "system") fail(`${label}: scope must be system in v1`);
  if (!Number.isInteger(manifest.priority) || manifest.priority < 0 || manifest.priority > 999) {
    fail(`${label}: priority must be an integer 0..999`);
  }
  if (!Array.isArray(manifest.item_files) || manifest.item_files.length === 0) {
    fail(`${label}: item_files must be a non-empty array`);
    continue;
  }

  const itemTypes = new Set();
  for (const entry of manifest.item_files) {
    const itemLabel = `${label} ${entry?.path ?? "?"}`;
    if (!isObject(entry) || typeof entry.path !== "string") {
      fail(`${itemLabel}: invalid item file entry`);
      continue;
    }
    if (!entry.path.startsWith("items/") || !entry.path.endsWith(".json")) {
      fail(`${itemLabel}: item path must be items/**.json`);
      continue;
    }
    if (entry.path.includes("..") || entry.path.includes("\\") || entry.path.startsWith("/")) {
      fail(`${itemLabel}: path traversal is forbidden`);
      continue;
    }
    if (!SHA256.test(entry.sha256 || "")) {
      fail(`${itemLabel}: sha256 must be 64 lowercase hex`);
      continue;
    }
    const absolute = join(ROOT, pack.path, entry.path);
    if (!existsSync(absolute)) {
      fail(`${itemLabel}: file not found`);
      continue;
    }
    const actual = sha256(readBytes(join(pack.path, entry.path)));
    if (actual !== entry.sha256) {
      fail(`${itemLabel}: sha256 mismatch (manifest ${entry.sha256}, actual ${actual})`);
    }

    const envelope = readJson(join(pack.path, entry.path));
    if (!envelope) continue;
    const meta = envelope.metadata;
    if (!isObject(meta)) {
      fail(`${itemLabel}: metadata is missing`);
      continue;
    }
    for (const key of ["item_type", "format", "format_version", "dataset_vintage"]) {
      if (meta[key] === undefined) fail(`${itemLabel}: metadata.${key} is required`);
    }
    if (typeof meta.item_type !== "string" || !KEBAB.test(meta.item_type.replace(/_/g, "-"))) {
      warn(`${itemLabel}: metadata.item_type is not a known slug`);
    }
    if (!Number.isInteger(meta.format_version) || meta.format_version < 1) {
      fail(`${itemLabel}: metadata.format_version must be an integer >= 1`);
    }
    if (!DATE.test(meta.dataset_vintage || "")) {
      fail(`${itemLabel}: metadata.dataset_vintage must be YYYY-MM-DD`);
    }
    if (meta.format === "external_reference") {
      // Link-only items may carry a non-redistributable label because no content travels.
    } else if (meta.license !== undefined && meta.license !== manifest.license) {
      fail(`${itemLabel}: metadata.license must match the pack license`);
    }
    if (!FORMATS.has(meta.format)) {
      warn(`${itemLabel}: format ${meta.format} is not in this validator's known list; app support is separate`);
    }
    if (!Array.isArray(envelope.items)) {
      fail(`${itemLabel}: items must be an array`);
      continue;
    }
    itemTypes.add(meta.item_type);

    if (meta.format === "ats_presets") {
      for (const item of envelope.items) {
        if (!isObject(item) || !SEED_KEY.test(item.seed_key || "")) {
          fail(`${itemLabel}: ats_presets item has an invalid seed_key`);
        }
        if (!isObject(item) || !KEBAB.test(item.slug || "")) {
          fail(`${itemLabel}: ats_presets item has an invalid slug`);
        }
      }
    }
  }

  const declaredTypes = new Set(Array.isArray(pack.itemTypes) ? pack.itemTypes : []);
  for (const type of itemTypes) {
    if (!declaredTypes.has(type)) fail(`${label}: index itemTypes is missing ${type}`);
  }
  for (const type of declaredTypes) {
    if (!itemTypes.has(type)) fail(`${label}: index itemTypes lists ${type} but no item file has it`);
  }

  const computed = packDigest(manifest, manifest.item_files, pack.path);
  if (computed !== pack.digest) {
    fail(`${label}: digest mismatch (index ${pack.digest}, computed ${computed})`);
  }
}

// Any pack directory not in the index is a validation error.
if (existsSync(join(ROOT, "packs"))) {
  for (const publisher of readdirSync(join(ROOT, "packs"))) {
    const publisherStat = lstatSync(join(ROOT, "packs", publisher));
    if (publisherStat.isSymbolicLink()) {
      fail(`packs/${publisher}: symlinks are forbidden`);
      continue;
    }
    if (!publisherStat.isDirectory()) continue;
    for (const pack of readdirSync(join(ROOT, "packs", publisher))) {
      const path = `packs/${publisher}/${pack}`;
      const packStat = lstatSync(join(ROOT, path));
      if (packStat.isSymbolicLink()) {
        fail(`${path}: symlinks are forbidden`);
        continue;
      }
      if (!packStat.isDirectory()) continue;
      if (!indexedPaths.has(path)) fail(`${path}: pack directory is not listed in seed-repo.json`);
      const files = walk(path);
      for (const file of files) {
        const rel = relative(path, file);
        if (ALLOWED_PACK_FILES.has(rel)) continue;
        if (rel.startsWith("items/") && rel.endsWith(".json")) continue;
        fail(`${file}: forbidden file in a pack (only manifest/README/LICENSE/CHANGELOG and items/**.json)`);
      }
    }
  }
}

report();

function report() {
  for (const message of warnings) console.warn(`WARN ${message}`);
  for (const message of errors) console.error(`ERROR ${message}`);
  if (errors.length > 0) {
    console.error(`\n${errors.length} error(s)`);
    process.exit(1);
  }
  console.log(`OK ${index?.packs?.length ?? 0} pack(s)`);
}
