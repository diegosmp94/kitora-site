import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";

// This is a CI integrity gate, not a GitHub branch-protection rule.
// A GitHub Ruleset must additionally require this check for enforcement.
const load = path => readFileSync(path, "utf8");
const json = path => JSON.parse(load(path));
const dir = "security/github-rulesets/";
const main = json(dir + "main.json");
const release = json(dir + "release.json");
const working = json(dir + "working.json");
const types = obj => obj.rules.map(rule => rule.type);
for (const [file, value] of [["main", main], ["release", release], ["working", working]]) {
  assert.equal(value.target, "branch", file + " must target branches");
  assert.equal(value.enforcement, "active", file + " must use active enforcement");
  assert.deepEqual(value.bypass_actors, [], file + " has unexpected rule bypasses");
  assert.ok(Array.isArray(value.conditions.ref_name.include) && value.conditions.ref_name.include.length > 0);
  assert.ok(types(value).includes("non_fast_forward"), file + " must prohibit force pushes");
}
assert.deepEqual(main.conditions.ref_name.include, ["refs/heads/main"]);
assert.ok(types(main).includes("deletion"), "main must prohibit deletion");
assert.ok(types(main).includes("required_linear_history"), "main must enforce squash/rebase");
const pr = main.rules.find(rule => rule.type === "pull_request")?.parameters;
assert.ok(pr, "main must require a pull request");
assert.deepEqual(pr.allowed_merge_methods, ["squash"]);
assert.equal(pr.required_review_thread_resolution, true);
assert.equal(pr.require_code_owner_review, false, "do not lock sole owner out without a separate reviewer");
assert.equal(pr.required_approving_review_count, 0, "set 1 only after an independent maintainer joins");
const status = main.rules.find(rule => rule.type === "required_status_checks")?.parameters;
assert.ok(status, "main must require GitHub Actions checks");
assert.equal(status.strict_required_status_checks_policy, true);
const contexts = status.required_status_checks.map(check => check.context);
assert.equal(new Set(contexts).size, contexts.length, "duplicate required checks");
const checks = new Map([
  ["Site, plans, IA and payment guardrails", ".github/workflows/kitora-v1-ci.yml"],
  ["solutions", ".github/workflows/kitora-solutions.yml"],
  ["workspace", ".github/workflows/kitora3-workspace.yml"],
  ["catalogue", ".github/workflows/kits-catalogue.yml"],
  ["legal", ".github/workflows/kitora-legal.yml"],
  ["branch-security-gate", ".github/workflows/kitora-branch-security.yml"]
]);
assert.deepEqual(new Set(contexts), new Set(checks.keys()));
for (const [context, path] of checks) {
  assert.ok(existsSync(path), path + " missing");
  const workflow = load(path);
  assert.match(workflow, /pull_request:/, path + " must run on PR");
  assert.match(workflow, /\bmain\b/, path + " must target main");
  assert.match(workflow, /permissions:\s*\n\s*contents:\s*read/, path + " must have read-only base permissions");
  assert.ok(workflow.includes("  " + context + ":") || workflow.includes("    name: " + context),
    "check name " + context + " missing from " + path);
}
assert.ok(types(release).includes("deletion"), "release branches must be preserved");
assert.ok(release.conditions.ref_name.include.includes("refs/heads/release/*"));
for (const pattern of ["feature/*", "fix/*", "security/*", "maintenance/*", "tests/*"]) {
  assert.ok(working.conditions.ref_name.include.includes("refs/heads/" + pattern));
}
const owners = load(".github/CODEOWNERS");
assert.match(owners, /\/\.github\/ @diegosmp94/);
assert.match(owners, /\/supabase\/ @diegosmp94/);

// High-confidence prevention of accidentally committing live private credentials.
// Publishable (public) Supabase keys and Stripe price IDs are intentionally allowed.
const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);
const privateKeys = [
  { name:"Stripe private key",re:/\b(?:sk|rk)_live_[A-Za-z0-9]{18,}\b/g },
  { name:"Stripe webhook signing secret",re:/\bwhsec_[A-Za-z0-9]{20,}\b/g },
  { name:"Supabase server-side secret",re:/\bsb_secret_[A-Za-z0-9_-]{20,}\b/g },
  { name:"GitHub personal access token",re:/\bghp_[A-Za-z0-9]{30,}\b/g },
  { name:"GitHub fine-grained token",re:/\bgithub_pat_[A-Za-z0-9_]{45,}\b/g },
  { name:"Private key PEM",re:/-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g }
];
const violations = [];
for (const path of tracked) {
  if (/\.(?:pem|p12|pfx|p8)$/i.test(path) || /(^|\/)\.env(?!\.example$)(?:\.[^/]+)?$/i.test(path)) {
    violations.push(path + ": prohibited credential file");
    continue;
  }
  if (!/\.(?:js|mjs|ts|html|md|json|ya?ml|sql|txt|css)$/i.test(path)) continue;
  if (!existsSync(path)) continue;
  const content = load(path);
  for (const {name,re} of privateKeys) {
    re.lastIndex = 0;
    if (re.test(content)) violations.push(path + ": " + name);
  }
}
assert.deepEqual(violations, [], "potential secrets detected: " + violations.join("; "));
console.log("Kitora branch governance: 3 import-ready rulesets, 6 required CI checks, CODEOWNERS and credential scan OK.");
