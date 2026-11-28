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
const COUNTRY = /^[A-Z]{2}$/;
const REGION = /^[A-Z][A-Z0-9_-]{1,31}$/;
const LANGUAGE = /^[a-z]{2}$/;
const WORK_MODES = new Set(["remote", "hybrid", "onsite"]);
const LICENSES = new Set(["Apache-2.0", "CC-BY-4.0", "CC-BY-SA-4.0", "CC0-1.0", "MIT"]);
const FORMATS = new Set([
  "ats_presets",
  "endpoint_descriptors",
  "job_types",
  "job_families",
  "job_relations",
  "career_paths",
  "skills",
  "interest_tags",
  "assessment_questions",
  "assessment_templates",
  "cv_templates",
  "metric_dimensions",
  "metric_category_anchors",
  "skill_packs",
  "companies",
  "roadmap_graph",
  "roadmap_content",
  "external_reference"
]);
const RELATION_TYPES = new Set([
  "similar_to",
  "specialises_into",
  "leads_to",
  "alternative_to",
  "prerequisite_of"
]);
const IMPORTANCE = new Set(["core", "important", "bonus"]);
const STEP_KINDS = new Set(["education", "experience", "certification", "job"]);
const INTEREST_KINDS = new Set(["topic", "industry"]);
const QUESTION_KINDS = new Set(["scenario_mcq", "time_allocation", "ranking", "slider"]);
const METRIC_GROUPS = new Set(["interest", "value", "workstyle", "constraint", "aptitude"]);
const RIASEC_LETTERS = new Set([
  "realistic",
  "investigative",
  "artistic",
  "social",
  "enterprising",
  "conventional"
]);
const SKILL_PACK_TASKS = new Set([
  "assessment_generate",
  "template_design",
  "profile_analyze",
  "job_generate",
  "relation_suggest",
  "match_score",
  "university_parse",
  "chat",
  "chat_ops",
  "assist",
  "path_suggest",
  "posting_map",
  "job_type_proposal",
  "posting_extract",
  "posting_skill_resolve",
  "detail_triage",
  "company_triage",
  "target_resolve",
  "transcribe",
  "cv_ocr",
  "cv_parse",
  "cv_template_design",
  "cv_template_review",
  "cv_template_pick",
  "cv_build_review",
  "cv_suggest",
  "cv_cover_letter",
  "cv_builder_chat",
  "cv_draft",
  "cv_synth",
  "catalog_enrich",
  "chat_title",
  "autopilot_run",
  "interview_plan",
  "interview_turn",
  "interview_debrief",
  "embed",
  "mcp_tool_call",
  "query_curator",
  "sandbox_capability_call",
  "tool_run",
  "translate",
  "path_draft",
  "skill_relation_suggest",
  "smart_search",
  "decision",
  "decision_tool_dispatch",
  "decision_boolean_gate",
  "decision_choice",
  "decision_score"
]);
const DIMENSION_KEY = /^[a-z0-9][a-z0-9._-]{0,59}$/;
const BANK_CAPS = {
  assessment_questions: 50,
  assessment_templates: 20,
  cv_templates: 50,
  metric_dimensions: 200,
  metric_category_anchors: 200,
  skill_packs: 50
};
const ALLOWED_PACK_FILES = new Set(["manifest.json", "README.md", "LICENSE", "CHANGELOG.md"]);

const readText = (path) => readFileSync(join(ROOT, path), "utf8");
const readBytes = (path) => readFileSync(join(ROOT, path));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

function checkStringArray(value, pattern, max, label, { min = 1, allowed = null } = {}) {
  if (!Array.isArray(value)) {
    fail(`${label} must be an array`);
    return false;
  }
  if (value.length < min || value.length > max) {
    fail(`${label} must contain ${min}..${max} entries`);
    return false;
  }
  const seen = new Set();
  let ok = true;
  for (const entry of value) {
    if (
      typeof entry !== "string" ||
      (pattern && !pattern.test(entry)) ||
      (allowed && !allowed.has(entry))
    ) {
      fail(`${label} has an invalid entry`);
      ok = false;
      continue;
    }
    if (seen.has(entry)) {
      fail(`${label} has a duplicate entry`);
      ok = false;
    }
    seen.add(entry);
  }
  return ok;
}

function checkLocale(item, label, { requireCountry = false } = {}) {
  let ok = true;
  if (item.country !== undefined && (typeof item.country !== "string" || !COUNTRY.test(item.country))) {
    fail(`${label}.country must be a two-letter uppercase ISO code`);
    ok = false;
  }
  if (item.countries !== undefined) {
    ok = checkStringArray(item.countries, COUNTRY, 50, `${label}.countries`) && ok;
    if (item.country && Array.isArray(item.countries) && !item.countries.includes(item.country)) {
      fail(`${label}.countries must include .country`);
      ok = false;
    }
  }
  if (item.regions !== undefined) {
    ok = checkStringArray(item.regions, REGION, 10, `${label}.regions`) && ok;
  }
  if (item.languages !== undefined) {
    ok = checkStringArray(item.languages, LANGUAGE, 20, `${label}.languages`) && ok;
  }
  if (item.work_modes !== undefined) {
    ok = checkStringArray(item.work_modes, null, 3, `${label}.work_modes`, { allowed: WORK_MODES }) && ok;
  }
  if (item.homepage !== undefined) {
    if (
      typeof item.homepage !== "string" ||
      !item.homepage.startsWith("https://") ||
      item.homepage.length > 500
    ) {
      fail(`${label}.homepage must be an https URL (<= 500 chars)`);
      ok = false;
    }
  }
  if (item.worldwide !== undefined) {
    if (typeof item.worldwide !== "boolean") {
      fail(`${label}.worldwide must be a boolean`);
      ok = false;
    } else if (item.worldwide) {
      if ((item.countries ?? []).length > 0 || (item.regions ?? []).length > 0) {
        fail(`${label}: worldwide requires no countries/regions`);
        ok = false;
      }
      if (item.category !== undefined && item.category !== "remote") {
        fail(`${label}: worldwide is only valid with category "remote"`);
        ok = false;
      }
    }
  }
  if (requireCountry && !item.country && (item.countries ?? []).length === 0) {
    fail(`${label}: category "ats" requires country or countries`);
    ok = false;
  }
  return ok;
}

function checkAtsPreset(item, label) {
  if (!isObject(item)) {
    fail(`${label} must be an object`);
    return;
  }
  if (!SEED_KEY.test(item.seed_key || "")) fail(`${label}.seed_key is invalid`);
  if (!KEBAB.test(item.slug || "")) fail(`${label}.slug is invalid`);
  if (typeof item.name !== "string" || item.name.length < 1 || item.name.length > 200) {
    fail(`${label}.name is invalid`);
  }
  if (typeof item.connector_key !== "string" || item.connector_key.length === 0) {
    fail(`${label}.connector_key is required`);
  }
  if (typeof item.platform !== "string" || item.platform.length === 0) {
    fail(`${label}.platform is required`);
  }
  if (item.category !== "ats" && item.category !== "remote") {
    fail(`${label}.category must be ats or remote`);
  }
  if (!isObject(item.config)) fail(`${label}.config must be an object`);
  checkLocale(item, label, { requireCountry: item.category === "ats" });
}

function checkJobFamily(item, label) {
  if (!isObject(item)) {
    fail(`${label} must be an object`);
    return;
  }
  if (!SEED_KEY.test(item.seed_key || "") || !item.seed_key.startsWith("job-family:")) {
    fail(`${label}.seed_key must be job-family:<body>`);
  }
  if (!KEBAB.test(item.key || "")) fail(`${label}.key is invalid`);
  if (typeof item.label !== "string" || item.label.length < 1 || item.label.length > 120) {
    fail(`${label}.label is invalid`);
  }
  if (item.parent_key !== undefined && item.parent_key !== null && !KEBAB.test(item.parent_key)) {
    fail(`${label}.parent_key is invalid`);
  }
  if (item.description !== undefined && typeof item.description !== "string") {
    fail(`${label}.description must be a string`);
  }
}

function checkJobType(item, label) {
  if (!isObject(item)) {
    fail(`${label} must be an object`);
    return;
  }
  if (!SEED_KEY.test(item.seed_key || "") || !item.seed_key.startsWith("job-type:")) {
    fail(`${label}.seed_key must be job-type:<body>`);
  }
  if (!KEBAB.test(item.code || "")) fail(`${label}.code is invalid`);
  if (typeof item.title !== "string" || item.title.length < 1 || item.title.length > 160) {
    fail(`${label}.title is invalid`);
  }
  if (!KEBAB.test(item.family_key || "")) fail(`${label}.family_key is invalid`);
  if (item.summary !== undefined && typeof item.summary !== "string") {
    fail(`${label}.summary must be a string`);
  }
  if (!isObject(item.attributes)) fail(`${label}.attributes must be an object`);
  if (!Array.isArray(item.skills) || item.skills.length > 40) {
    fail(`${label}.skills must be an array of at most 40`);
  } else {
    for (const [index, ref] of item.skills.entries()) {
      const refLabel = `${label}.skills[${index}]`;
      if (!isObject(ref) || !KEBAB.test(ref.skill_key || "")) {
        fail(`${refLabel}.skill_key is invalid`);
        continue;
      }
      if (ref.required_level !== undefined && (!Number.isInteger(ref.required_level) || ref.required_level < 1 || ref.required_level > 10)) {
        fail(`${refLabel}.required_level must be 1..10`);
      }
      if (ref.importance !== undefined && !IMPORTANCE.has(ref.importance)) {
        fail(`${refLabel}.importance is invalid`);
      }
    }
  }
  if (!Array.isArray(item.interests) || item.interests.length > 40) {
    fail(`${label}.interests must be an array of at most 40`);
  } else {
    for (const key of item.interests) {
      if (typeof key !== "string" || !KEBAB.test(key)) fail(`${label}.interests has an invalid key`);
    }
  }
}

function checkJobRelation(item, label) {
  if (!isObject(item)) {
    fail(`${label} must be an object`);
    return;
  }
  if (!SEED_KEY.test(item.seed_key || "") || !item.seed_key.startsWith("job-relation:")) {
    fail(`${label}.seed_key must be job-relation:<from>/<to>/<type>`);
  }
  if (!KEBAB.test(item.from || "")) fail(`${label}.from is invalid`);
  if (!KEBAB.test(item.to || "")) fail(`${label}.to is invalid`);
  if (!RELATION_TYPES.has(item.type)) fail(`${label}.type is invalid`);
  if (typeof item.weight !== "number" || item.weight < 0 || item.weight > 1) {
    fail(`${label}.weight must be 0..1`);
  }
  if (item.rationale !== undefined && typeof item.rationale !== "string") {
    fail(`${label}.rationale must be a string`);
  }
}

function checkCareerPath(item, label) {
  if (!isObject(item)) {
    fail(`${label} must be an object`);
    return;
  }
  if (!SEED_KEY.test(item.seed_key || "") || !item.seed_key.startsWith("career-path:")) {
    fail(`${label}.seed_key must be career-path:<job>/<slug>`);
  }
  if (!KEBAB.test(item.job || "")) fail(`${label}.job is invalid`);
  if (typeof item.title !== "string" || item.title.length < 1 || item.title.length > 160) {
    fail(`${label}.title is invalid`);
  }
  if (!Array.isArray(item.steps) || item.steps.length > 20) {
    fail(`${label}.steps must be an array of at most 20`);
    return;
  }
  for (const [index, step] of item.steps.entries()) {
    const stepLabel = `${label}.steps[${index}]`;
    if (!isObject(step) || !STEP_KINDS.has(step.kind)) {
      fail(`${stepLabel}.kind is invalid`);
      continue;
    }
    if (step.label !== undefined && typeof step.label !== "string") {
      fail(`${stepLabel}.label must be a string`);
    }
    if (step.optional !== undefined && typeof step.optional !== "boolean") {
      fail(`${stepLabel}.optional must be a boolean`);
    }
    if (step.family_key !== undefined && !KEBAB.test(step.family_key)) {
      fail(`${stepLabel}.family_key is invalid`);
    }
    if (step.skill_key !== undefined && !KEBAB.test(step.skill_key)) {
      fail(`${stepLabel}.skill_key is invalid`);
    }
    if (step.education_level !== undefined && typeof step.education_level !== "string") {
      fail(`${stepLabel}.education_level must be a string`);
    }
  }
}

function checkSkill(item, label) {
  if (!isObject(item)) {
    fail(`${label} must be an object`);
    return;
  }
  if (!SEED_KEY.test(item.seed_key || "") || !item.seed_key.startsWith("skill:")) {
    fail(`${label}.seed_key must be skill:<body>`);
  }
  if (!KEBAB.test(item.key || "")) fail(`${label}.key is invalid`);
  if (typeof item.label !== "string" || item.label.length < 1 || item.label.length > 120) {
    fail(`${label}.label is invalid`);
  }
  if (typeof item.category !== "string" || item.category.length < 1 || item.category.length > 60) {
    fail(`${label}.category is invalid`);
  }
  if (item.description !== undefined && typeof item.description !== "string") {
    fail(`${label}.description must be a string`);
  }
  if (item.parent_key !== undefined && item.parent_key !== null && !KEBAB.test(item.parent_key)) {
    fail(`${label}.parent_key is invalid`);
  }
}

function checkInterestTag(item, label) {
  if (!isObject(item)) {
    fail(`${label} must be an object`);
    return;
  }
  if (!SEED_KEY.test(item.seed_key || "") || !item.seed_key.startsWith("interest:")) {
    fail(`${label}.seed_key must be interest:<body>`);
  }
  if (!KEBAB.test(item.key || "")) fail(`${label}.key is invalid`);
  if (typeof item.label !== "string" || item.label.length < 1 || item.label.length > 120) {
    fail(`${label}.label is invalid`);
  }
  if (typeof item.category !== "string" || item.category.length < 1 || item.category.length > 60) {
    fail(`${label}.category is invalid`);
  }
  if (item.kind !== undefined && !INTEREST_KINDS.has(item.kind)) {
    fail(`${label}.kind is invalid`);
  }
}

function checkVersionedSeedKey(item, label, prefix, keyPattern = KEBAB) {
  if (!isObject(item)) return;
  if (!Number.isInteger(item.version) || item.version < 1) {
    fail(`${label}.version must be a positive integer`);
    return;
  }
  if (typeof item.key !== "string" || !keyPattern.test(item.key)) {
    fail(`${label}.key is invalid`);
    return;
  }
  const expected = `${prefix}:${item.key}/v${item.version}`;
  if (!SEED_KEY.test(item.seed_key || "") || item.seed_key !== expected) {
    fail(`${label}.seed_key must be ${expected}`);
  }
}

function checkAssessmentQuestion(item, label) {
  if (!isObject(item)) {
    fail(`${label} must be an object`);
    return;
  }
  if (
    !SEED_KEY.test(item.seed_key || "") ||
    !item.seed_key.startsWith("assessment-question:")
  ) {
    fail(`${label}.seed_key must be assessment-question:<key>`);
  }
  if (typeof item.prompt !== "string" || item.prompt.length < 1 || item.prompt.length > 2000) {
    fail(`${label}.prompt is invalid`);
  }
  if (item.help !== undefined && (typeof item.help !== "string" || item.help.length > 2000)) {
    fail(`${label}.help is invalid`);
  }
  if (!Number.isInteger(item.phase) || item.phase < 1 || item.phase > 10) {
    fail(`${label}.phase must be 1..10`);
  }
  if (!QUESTION_KINDS.has(item.kind)) fail(`${label}.kind is invalid`);
  if (!Array.isArray(item.options) || item.options.length > 12) {
    fail(`${label}.options must be an array of at most 12`);
  } else {
    const ids = new Set();
    for (const [index, option] of item.options.entries()) {
      const optionLabel = `${label}.options[${index}]`;
      if (!isObject(option)) {
        fail(`${optionLabel} must be an object`);
        continue;
      }
      if (typeof option.id !== "string" || option.id.length < 1 || option.id.length > 60) {
        fail(`${optionLabel}.id is invalid`);
      } else if (ids.has(option.id)) {
        fail(`${optionLabel}.id is duplicated`);
      } else {
        ids.add(option.id);
      }
      if (
        typeof option.label !== "string" ||
        option.label.length < 1 ||
        option.label.length > 300
      ) {
        fail(`${optionLabel}.label is invalid`);
      }
      if (option.detail !== undefined && typeof option.detail !== "string") {
        fail(`${optionLabel}.detail must be a string`);
      }
      if (option.scores !== undefined && !isObject(option.scores)) {
        fail(`${optionLabel}.scores must be an object`);
      } else if (option.scores && Array.isArray(option.scores.interest_keys)) {
        if (option.scores.interest_keys.length > 10) {
          fail(`${optionLabel}.scores.interest_keys must have at most 10 keys`);
        }
        for (const key of option.scores.interest_keys) {
          if (typeof key !== "string" || !KEBAB.test(key)) {
            fail(`${optionLabel}.scores.interest_keys has an invalid key`);
          }
        }
      }
    }
  }
  if (item.sort_index !== undefined && (!Number.isInteger(item.sort_index) || item.sort_index < 0)) {
    fail(`${label}.sort_index must be an integer >= 0`);
  }
  if (item.audience_stages !== undefined) {
    checkStringArray(item.audience_stages, null, 10, `${label}.audience_stages`, { min: 0 });
  }
  if (item.time_split !== undefined && item.time_split !== null && !isObject(item.time_split)) {
    fail(`${label}.time_split must be an object or null`);
  }
}

function checkAssessmentTemplate(item, label) {
  if (!isObject(item)) {
    fail(`${label} must be an object`);
    return;
  }
  checkVersionedSeedKey(item, label, "assessment-template");
  if (typeof item.title !== "string" || item.title.length < 1 || item.title.length > 200) {
    fail(`${label}.title is invalid`);
  }
  if (item.description !== undefined && typeof item.description !== "string") {
    fail(`${label}.description must be a string`);
  }
  if (item.audience_stages !== undefined) {
    checkStringArray(item.audience_stages, null, 10, `${label}.audience_stages`, { min: 0 });
  }
  if (item.language !== undefined && !LANGUAGE.test(item.language)) {
    fail(`${label}.language must be a two-letter code`);
  }
  if (
    item.schema_version !== undefined &&
    (!Number.isInteger(item.schema_version) || item.schema_version < 1 || item.schema_version > 99)
  ) {
    fail(`${label}.schema_version must be 1..99`);
  }
  if (!isObject(item.content)) fail(`${label}.content must be an object`);
  if (isObject(item.content) && !Array.isArray(item.content.phases)) {
    fail(`${label}.content.phases must be an array`);
  }
}

function checkCvTemplate(item, label) {
  if (!isObject(item)) {
    fail(`${label} must be an object`);
    return;
  }
  checkVersionedSeedKey(item, label, "cv-template");
  if (typeof item.title !== "string" || item.title.length < 1 || item.title.length > 200) {
    fail(`${label}.title is invalid`);
  }
  if (item.description !== undefined && typeof item.description !== "string") {
    fail(`${label}.description must be a string`);
  }
  if (item.language !== undefined && !LANGUAGE.test(item.language)) {
    fail(`${label}.language must be a two-letter code`);
  }
  if (item.page_size !== undefined && !["a4", "letter"].includes(item.page_size)) {
    fail(`${label}.page_size must be a4 or letter`);
  }
  if (item.ats_safe !== undefined && typeof item.ats_safe !== "boolean") {
    fail(`${label}.ats_safe must be a boolean`);
  }
  if (!isObject(item.content)) fail(`${label}.content must be an object`);
  if (isObject(item.content) && !Array.isArray(item.content.blocks)) {
    fail(`${label}.content.blocks must be an array`);
  }
}

function checkMetricDimension(item, label) {
  if (!isObject(item)) {
    fail(`${label} must be an object`);
    return;
  }
  if (typeof item.key !== "string" || !DIMENSION_KEY.test(item.key)) {
    fail(`${label}.key is invalid`);
  } else if (item.seed_key !== `metric-dimension:${item.key}`) {
    fail(`${label}.seed_key must be metric-dimension:${item.key}`);
  }
  if (typeof item.label !== "string" || item.label.length < 1 || item.label.length > 80) {
    fail(`${label}.label is invalid`);
  }
  if (!METRIC_GROUPS.has(item.group)) fail(`${label}.group is invalid`);
  if (item.description !== undefined && typeof item.description !== "string") {
    fail(`${label}.description must be a string`);
  }
  if (item.scale !== undefined && !["scalar", "vector"].includes(item.scale)) {
    fail(`${label}.scale must be scalar or vector`);
  }
  if (item.reverse_score !== undefined && typeof item.reverse_score !== "boolean") {
    fail(`${label}.reverse_score must be a boolean`);
  }
  if (item.sources !== undefined) {
    checkStringArray(item.sources, null, 20, `${label}.sources`, { min: 0 });
  }
  if (item.consumers !== undefined) {
    checkStringArray(item.consumers, null, 20, `${label}.consumers`, { min: 0 });
  }
}

function checkMetricCategoryAnchor(item, label) {
  if (!isObject(item)) {
    fail(`${label} must be an object`);
    return;
  }
  if (
    typeof item.category !== "string" ||
    item.category.length < 1 ||
    item.category.length > 60
  ) {
    fail(`${label}.category is invalid`);
  } else if (item.seed_key !== `interest-category:${item.category}`) {
    fail(`${label}.seed_key must be interest-category:${item.category}`);
  }
  if (!RIASEC_LETTERS.has(item.letter)) {
    fail(`${label}.letter must be a Holland code`);
  }
}

function checkSkillPack(item, label) {
  if (!isObject(item)) {
    fail(`${label} must be an object`);
    return;
  }
  checkVersionedSeedKey(item, label, "skill-pack");
  if (typeof item.title !== "string" || item.title.length < 1 || item.title.length > 200) {
    fail(`${label}.title is invalid`);
  }
  if (!SKILL_PACK_TASKS.has(item.task)) fail(`${label}.task is invalid`);
  if (
    typeof item.instructions !== "string" ||
    item.instructions.length < 1 ||
    item.instructions.length > 20000
  ) {
    fail(`${label}.instructions must be 1..20000 chars`);
  }
}

function checkEndpoint(item, label) {
  if (!isObject(item)) {
    fail(`${label} must be an object`);
    return;
  }
  if (!SEED_KEY.test(item.seed_key || "") || !item.seed_key.startsWith("endpoint:")) {
    fail(`${label}.seed_key must be endpoint:<body>`);
  }
  if (typeof item.label !== "string" || item.label.length < 1 || item.label.length > 120) {
    fail(`${label}.label is invalid`);
  }
  if (typeof item.connector_key !== "string" || item.connector_key.length === 0) {
    fail(`${label}.connector_key is required`);
  }
  if (typeof item.server !== "string" || !item.server.startsWith("https://")) {
    fail(`${label}.server must be https`);
  }
  if (item.method !== "GET") fail(`${label}.method must be GET`);
  if (typeof item.path !== "string" || !item.path.startsWith("/")) {
    fail(`${label}.path must start with /`);
  }
  if (!["none", "api_key", "bearer", "oauth"].includes(item.auth)) {
    fail(`${label}.auth is invalid`);
  }
  if (item.params !== undefined) {
    if (!Array.isArray(item.params) || item.params.length > 20) {
      fail(`${label}.params must be an array of at most 20`);
    } else {
      for (const param of item.params) {
        if (!isObject(param) || typeof param.name !== "string" || param.name.length === 0) {
          fail(`${label}.params has an invalid entry`);
        }
      }
    }
  }
  if (item.docs_url !== undefined && (typeof item.docs_url !== "string" || !item.docs_url.startsWith("https://"))) {
    fail(`${label}.docs_url must be https`);
  }
  checkLocale(item, label);
}

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
  const catalog = { families: [], jobs: [], relations: [], paths: [], skills: [], interests: [] };
  const banks = {
    questions: [],
    templates: [],
    cvTemplates: [],
    dimensions: [],
    anchors: [],
    skillPacks: []
  };
  const seedKeys = new Set();
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

    if (BANK_CAPS[meta.format] !== undefined && envelope.items.length > BANK_CAPS[meta.format]) {
      fail(`${itemLabel}: at most ${BANK_CAPS[meta.format]} ${meta.format} items per file`);
    }
    for (const item of envelope.items) {
      if (isObject(item) && typeof item.seed_key === "string") {
        if (seedKeys.has(item.seed_key)) fail(`${itemLabel}: duplicate seed_key ${item.seed_key}`);
        seedKeys.add(item.seed_key);
      }
    }

    if (meta.format === "ats_presets") {
      envelope.items.forEach((item, index) => checkAtsPreset(item, `${itemLabel} item ${index}`));
    }
    if (meta.format === "endpoint_descriptors") {
      envelope.items.forEach((item, index) => checkEndpoint(item, `${itemLabel} item ${index}`));
    }
    if (meta.format === "job_families") {
      envelope.items.forEach((item, index) => checkJobFamily(item, `${itemLabel} item ${index}`));
      catalog.families.push(...envelope.items);
    }
    if (meta.format === "job_types") {
      if (meta.format_version !== 2) fail(`${itemLabel}: job_types must use format_version 2`);
      envelope.items.forEach((item, index) => checkJobType(item, `${itemLabel} item ${index}`));
      catalog.jobs.push(...envelope.items);
    }
    if (meta.format === "job_relations") {
      envelope.items.forEach((item, index) => checkJobRelation(item, `${itemLabel} item ${index}`));
      catalog.relations.push(...envelope.items);
    }
    if (meta.format === "career_paths") {
      envelope.items.forEach((item, index) => checkCareerPath(item, `${itemLabel} item ${index}`));
      catalog.paths.push(...envelope.items);
    }
    if (meta.format === "skills") {
      envelope.items.forEach((item, index) => checkSkill(item, `${itemLabel} item ${index}`));
      catalog.skills.push(...envelope.items);
    }
    if (meta.format === "interest_tags") {
      envelope.items.forEach((item, index) => checkInterestTag(item, `${itemLabel} item ${index}`));
      catalog.interests.push(...envelope.items);
    }
    if (meta.format === "assessment_questions") {
      envelope.items.forEach((item, index) => checkAssessmentQuestion(item, `${itemLabel} item ${index}`));
      banks.questions.push(...envelope.items);
    }
    if (meta.format === "assessment_templates") {
      envelope.items.forEach((item, index) => checkAssessmentTemplate(item, `${itemLabel} item ${index}`));
      banks.templates.push(...envelope.items);
    }
    if (meta.format === "cv_templates") {
      envelope.items.forEach((item, index) => checkCvTemplate(item, `${itemLabel} item ${index}`));
      banks.cvTemplates.push(...envelope.items);
    }
    if (meta.format === "metric_dimensions") {
      envelope.items.forEach((item, index) => checkMetricDimension(item, `${itemLabel} item ${index}`));
      banks.dimensions.push(...envelope.items);
    }
    if (meta.format === "metric_category_anchors") {
      envelope.items.forEach((item, index) => checkMetricCategoryAnchor(item, `${itemLabel} item ${index}`));
      banks.anchors.push(...envelope.items);
    }
    if (meta.format === "skill_packs") {
      envelope.items.forEach((item, index) => checkSkillPack(item, `${itemLabel} item ${index}`));
      banks.skillPacks.push(...envelope.items);
    }
  }

  const declaredTypes = new Set(Array.isArray(pack.itemTypes) ? pack.itemTypes : []);
  for (const type of itemTypes) {
    if (!declaredTypes.has(type)) fail(`${label}: index itemTypes is missing ${type}`);
  }
  for (const type of declaredTypes) {
    if (!itemTypes.has(type)) fail(`${label}: index itemTypes lists ${type} but no item file has it`);
  }

  checkCatalogReferences(catalog, label);
  checkBankReferences(banks, label);

  const computed = packDigest(manifest, manifest.item_files, pack.path);
  if (computed !== pack.digest) {
    fail(`${label}: digest mismatch (index ${pack.digest}, computed ${computed})`);
  }
}

function checkBankReferences(banks, label) {
  // Cross-item checks inside one reference-banks pack: a versioned identity
  // body is unique per (key, version) and the singleton banks have one row
  // per key/letter.
  const versionBodies = new Set();
  const versioned = [
    ["assessment template", banks.templates],
    ["CV template", banks.cvTemplates],
    ["skill pack", banks.skillPacks]
  ];
  for (const [what, items] of versioned) {
    const versions = new Map();
    for (const item of items) {
      if (!isObject(item) || typeof item.key !== "string") continue;
      const body = `${item.key}/v${item.version}`;
      if (versionBodies.has(`${what}:${body}`)) {
        fail(`${label}: duplicate ${what} version ${body}`);
      }
      versionBodies.add(`${what}:${body}`);
      const seen = versions.get(item.key) ?? new Set();
      if (seen.has(item.version)) fail(`${label}: duplicate ${what} ${body}`);
      seen.add(item.version);
      versions.set(item.key, seen);
    }
  }

  const dimensionKeys = new Set();
  for (const item of banks.dimensions) {
    if (!isObject(item) || typeof item.key !== "string") continue;
    if (dimensionKeys.has(item.key)) fail(`${label}: duplicate metric dimension ${item.key}`);
    dimensionKeys.add(item.key);
  }

  const categories = new Set();
  for (const item of banks.anchors) {
    if (!isObject(item) || typeof item.category !== "string") continue;
    if (categories.has(item.category)) fail(`${label}: duplicate interest category ${item.category}`);
    categories.add(item.category);
  }

  const prompts = new Set();
  for (const item of banks.questions) {
    if (!isObject(item) || typeof item.prompt !== "string") continue;
    if (prompts.has(item.prompt)) fail(`${label}: duplicate assessment question prompt`);
    prompts.add(item.prompt);
  }
}

function checkCatalogReferences(catalog, label) {
  // Cross-item checks inside one catalog pack. Unresolved references are
  // warnings: a pack may legally build on taxonomy from another applied pack.
  const seen = (items, keyOf, what) => {
    const keys = new Set();
    for (const item of items) {
      const key = keyOf(item);
      if (keys.has(key)) fail(`${label}: duplicate ${what} ${key}`);
      keys.add(key);
    }
    return keys;
  };
  const jobCodes = seen(catalog.jobs, (item) => item.code, "job code");
  const familyKeys = seen(catalog.families, (item) => item.key, "family key");
  const skillKeys = seen(catalog.skills, (item) => item.key, "skill key");
  const interestKeys = seen(catalog.interests, (item) => item.key, "interest key");

  for (const job of catalog.jobs) {
    if (catalog.families.length > 0 && !familyKeys.has(job.family_key)) {
      warn(`${label}: job ${job.code} family ${job.family_key} is not in this pack`);
    }
    for (const ref of job.skills || []) {
      if (catalog.skills.length > 0 && !skillKeys.has(ref.skill_key)) {
        warn(`${label}: job ${job.code} skill ${ref.skill_key} is not in this pack`);
      }
    }
    for (const key of job.interests || []) {
      if (catalog.interests.length > 0 && !interestKeys.has(key)) {
        warn(`${label}: job ${job.code} interest ${key} is not in this pack`);
      }
    }
  }

  const triples = new Set();
  const connected = new Set();
  for (const rel of catalog.relations) {
    if (rel.from === rel.to) fail(`${label}: relation ${rel.seed_key} is a self-loop`);
    const triple = `${rel.from}/${rel.to}/${rel.type}`;
    if (triples.has(triple)) fail(`${label}: duplicate relation ${triple}`);
    triples.add(triple);
    connected.add(rel.from).add(rel.to);
    if (catalog.jobs.length > 0 && (!jobCodes.has(rel.from) || !jobCodes.has(rel.to))) {
      warn(`${label}: relation ${triple} points outside this pack`);
    }
  }
  if (catalog.relations.length > 0) {
    for (const job of catalog.jobs) {
      if (!connected.has(job.code)) warn(`${label}: job ${job.code} has no relation`);
    }
  }

  for (const path of catalog.paths) {
    if (catalog.jobs.length > 0 && !jobCodes.has(path.job)) {
      warn(`${label}: path ${path.seed_key} job ${path.job} is not in this pack`);
    }
    for (const step of path.steps || []) {
      if (step.skill_key && catalog.skills.length > 0 && !skillKeys.has(step.skill_key)) {
        warn(`${label}: path ${path.seed_key} skill ${step.skill_key} is not in this pack`);
      }
      if (step.family_key && catalog.families.length > 0 && !familyKeys.has(step.family_key)) {
        warn(`${label}: path ${path.seed_key} family ${step.family_key} is not in this pack`);
      }
    }
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
