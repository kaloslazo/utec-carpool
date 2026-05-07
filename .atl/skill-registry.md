# Skill Registry

**Delegator use only.** Any agent that launches sub-agents reads this registry to resolve compact rules, then injects them directly into sub-agent prompts. Sub-agents do NOT read this registry or individual SKILL.md files.

See `_shared/skill-resolver.md` for the full resolution protocol.

## User Skills

| Trigger | Skill | Path |
|---------|-------|------|
| When writing Go tests, using teatest, or adding test coverage | go-testing | ~/.claude/skills/go-testing/SKILL.md |
| When user asks to create a new skill, add agent instructions, or document patterns for AI | skill-creator | ~/.claude/skills/skill-creator/SKILL.md |
| When creating a pull request, opening a PR, or preparing changes for review | branch-pr | ~/.claude/skills/branch-pr/SKILL.md |
| When user says "judgment day", "judgment-day", "review adversarial", "dual review", "doble review", "juzgar", "que lo juzguen" | judgment-day | ~/.claude/skills/judgment-day/SKILL.md |
| When creating a GitHub issue, reporting a bug, or requesting a feature | issue-creation | ~/.claude/skills/issue-creation/SKILL.md |

## Compact Rules

Pre-digested rules per skill. Delegators copy matching blocks into sub-agent prompts as `## Project Standards (auto-resolved)`.

### go-testing
- Use table-driven tests (`[]struct{ name, input, expected, wantErr }`) for all unit tests
- Test Bubbletea Model state by calling `m.Update(msg)` directly — no rendering needed
- Use `teatest.NewTestModel(t, m)` for full interactive flow tests
- Use golden files in `testdata/` for View output comparisons; update with `-update` flag
- Mock system dependencies via interfaces injected into the model
- Run: `go test ./...`, coverage: `go test -cover ./...`, skip integration: `go test -short ./...`
- Test files co-located with source: `model_test.go` next to `model.go`

### skill-creator
- Create skill only for repeated patterns, project-specific conventions, or complex workflows
- Never create a skill for one-off tasks or trivial/self-explanatory patterns
- Structure: `skills/{name}/SKILL.md` (required) + `assets/` (templates/schemas) + `references/` (doc links)
- Frontmatter must include: `name`, `description` (with Trigger line), `license`, `metadata.author`, `metadata.version`
- Compact rules MUST be 5-15 lines — concise, actionable, no motivation/context
- Use `assets/` for code templates and schemas; use `references/` for links to existing docs

### branch-pr
- Every PR MUST link an approved GitHub issue (`status:approved`) — no exceptions
- Branch naming: `type/description` matching `^(feat|fix|chore|docs|style|refactor|perf|test|build|ci|revert)\/[a-z0-9._-]+$`
- PR body MUST contain `Closes #N` (or `Fixes`/`Resolves`) to link the issue
- Add exactly one `type:*` label per PR
- Run shellcheck on modified scripts before opening PR
- Automated checks must pass before merge; blank PRs without issue linkage are blocked

### judgment-day
- Launch TWO independent judge sub-agents in parallel — never sequentially, never do review yourself
- Each judge receives identical target + criteria but no knowledge of the other judge
- Synthesize results: Confirmed (both found) → fix immediately; Suspect (one found) → triage; Contradiction → escalate
- Classify every WARNING as "real" (normal user can trigger) or "theoretical" (contrived/impossible scenario)
- Theoretical warnings → report as INFO only, do NOT fix, do NOT block
- Fix Agent is a separate delegation after synthesis; then re-judge both in parallel
- Inject project standards (compact rules from skill registry) into BOTH judge prompts

### issue-creation
- Blank issues are disabled — MUST use bug report or feature request template
- Every new issue auto-gets `status:needs-review`; a maintainer must add `status:approved` before any PR
- Search for duplicates before creating; questions go to Discussions, not issues
- Bug reports require: pre-flight checks, description, steps to reproduce, expected vs actual behavior, OS
- Feature requests require: pre-flight checks, problem statement, proposed solution, alternatives considered

## Project Conventions

| File | Path | Notes |
|------|------|-------|
| — | — | No project-level convention files found (empty project) |

Read the convention files listed above for project-specific patterns and rules.
