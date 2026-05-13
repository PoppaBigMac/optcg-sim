# Standard Prompt Template

Every Claude Code instruction for this project follows this format:

## Template

> On a new branch `<phase>/<short-description>`, <one-sentence goal>. Commit after each logical step.
>
> **Context:** <what already exists, what this builds on, any constraints from prior steps>
>
> **Rules reference:** <cite sections of _RULES_REFERENCE.md if applicable>
>
> **Deliverables:**
> 1. <file or change> — <description>
> 2. ...
>
> **Constraints:**
> - Strict TypeScript, no `any`
> - No filesystem copies — use git for cross-repo imports
> - <other constraints>
>
> **Done when:**
> - <self-verifiable acceptance criterion>
> - `pnpm test` passes
> - `pnpm typecheck` passes
> - <manual verification step if applicable>
>
> **Update on completion:** Update `docs/build-plan.md` — change the relevant 🔲 to ✅ and commit the change.

## Rules
- One step per branch.
- Every commit message references the relevant rules-doc section if rules logic is touched (e.g. "per rules §4 Step 3").
- Self-verify before reporting done: run tests, typecheck, and follow the Done-when checklist.
- Update `docs/build-plan.md` as the last commit of every branch.
- If verification fails, do NOT report done — fix or report the blocker.
