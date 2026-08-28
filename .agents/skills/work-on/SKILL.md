---
name: work-on
description: >-
  Track a piece of work as a living GitHub issue. Use when the user says "work
  on", "let's build", "start working on", "track this", "make a tracking issue",
  or begins a task worth tracking. Opens one tracking issue, then keeps it
  updated as decisions and scope change during the conversation, so human and
  agent share one source of truth. Issue prose follows the ste skill.
---

# work-on → living tracking issue

Turn a request into **one GitHub issue that stays current**. Open it at the
start, then update it whenever a decision, scope change, or status change
happens in the conversation. The issue is the shared record — a human reading
it later, or a fresh agent session, must be able to see what was decided and
where things stand.

**Issue prose follows Simplified Technical English** — apply the
[ste](../ste/SKILL.md) rules to every section.

> Requires the **ste** skill. Install both (`npx skills@latest add
> rimzzlabs/skills -s ste,work-on`) or the whole set; the link above resolves
> only when both are installed. If ste is absent, still apply those STE
> principles.

## When you start work (create the issue)

1. **Understand the request.** If it is vague, ask 2–3 focused questions
   first: What is the goal? What is in scope? Any constraints or deadline?
2. **Pick the target repo.** Default to the current repo
   (`gh repo view --json nameWithOwner -q .nameWithOwner`). Use
   `--repo <owner>/<name>` for another. Confirm the target before you create.
3. **Draft the body** from [TEMPLATE.md](./TEMPLATE.md).
4. **Confirm, then create.** Show the draft. Opening an issue is
   outward-facing — do not create it before the user approves content and repo.
5. **Remember the issue number.** You will update this same issue for the rest
   of the work. Note its number/URL so later updates target it.

```bash
# body.md holds the tracking issue (TEMPLATE.md, prose in STE)
gh issue create --title "<title>" --body-file body.md --label tracking
# prints the issue URL — keep it
```

## During the conversation (keep it updated)

Update the **same** issue as things change. Do not open a second issue.

- **A decision is made** → append it to the Decisions log:
  ```bash
  gh issue comment <number> --body "Decision: <what>. Reason: <why>."
  ```
- **Scope or tasks change** → edit the body to check off / add / remove tasks:
  ```bash
  gh issue edit <number> --body-file body.md
  ```
- **Status changes** → note it in a comment (started, blocked, in review, done).
- **A PR or commit relates to it** → mention the issue number in the PR/commit
  so GitHub links them automatically.
- **Work is finished** → post a closing summary comment, then
  `gh issue close <number>`.

Prefer **comments for the timeline** (decisions, status) and **body edits for
the current state** (task checklist, goal). Keep the body a truthful snapshot;
keep comments the history of how it got there.

## Gotchas

- **One issue per task.** Reuse the number you created. Search first if unsure:
  `gh issue list --label tracking --search "<keywords>"`.
- **Confirm before creating.** Issues notify watchers and are visible to the
  repo's audience.
- **`--label tracking` fails if the label is missing.** Create it once, then
  retry: `gh label create tracking --description "Tracked work" --color 0E8A16`.
- **Long bodies:** always use `--body-file`, never inline `--body "..."` for
  multi-line Markdown.
- **Wrong repo:** without `--repo`, `gh` uses the current directory's repo.
  Check with `gh repo view`.

## Relation to the rfc skill

- Use **rfc** to propose a design and gather comments *before* building.
- Use **work-on** to track the *doing* — the tasks, decisions, and status of
  work already agreed. An RFC issue can link to its work-on tracking issue.
