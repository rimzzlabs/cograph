---
name: rfc
description: >-
  Draft a design RFC about a topic and open it as a GitHub issue. Use when the
  user asks to "write an RFC", "propose a design", "open an RFC issue", or wants
  a structured proposal for a feature, change, or decision. The RFC prose is
  written in Simplified Technical English (see the ste skill).
---

# RFC → GitHub issue

Turn a topic or question from the user into a written **RFC** (Request for
Comments) and open it as a **GitHub issue** with `gh`.

**The RFC prose follows Simplified Technical English.** Apply the rules from
the [ste](../ste/SKILL.md) skill to every section: one instruction/idea per
sentence, short sentences, active voice, simple tenses, consistent terms,
kept articles. STE keeps the proposal readable for a global audience — it
does not change the technical content.

> Requires the **ste** skill. Install both (`npx skills@latest add
> rimzzlabs/skills -s ste,rfc`) or the whole set; the link above resolves only
> when both are installed. If ste is absent, still apply those STE principles.

## Workflow

1. **Get the topic.** If the user's request is vague, ask 2–3 focused
   questions before writing: What problem does this solve? What is in scope?
   Any known constraints or deadline? Do not guess a whole design from one
   line.
2. **Gather context.** If a codebase is present, read the relevant files so
   the proposal fits the real system. Cite files as `path:line`.
3. **Pick the target repo.** Default to the current repo
   (`gh repo view --json nameWithOwner -q .nameWithOwner`). If there is no
   repo, or the user names another, use `--repo <owner>/<name>`. Confirm the
   target before you create anything.
4. **Draft the RFC** using [TEMPLATE.md](./TEMPLATE.md). Write the prose in STE.
5. **Show the full draft to the user and get approval.** Opening an issue is
   an outward-facing action — never create it before the user confirms both
   the content and the target repo.
6. **Create the issue** (see command below). Return the issue URL.

## Create the issue

Write the body to a file first (avoids shell-quoting problems with long
Markdown), then create the issue:

```bash
# body.md holds the RFC (from TEMPLATE.md, prose in STE)
gh issue create \
  --title "RFC: <title>" \
  --body-file body.md \
  --label rfc
# add --repo <owner>/<name> to target a different repo
```

- If the `rfc` label does not exist, create it once, then retry:
  `gh label create rfc --description "Design proposal" --color 5319E7`
- To open the issue in the browser after creation: `gh issue view <url> --web`

## Gotchas

- **Confirm before creating.** A GitHub issue is public to the repo's
  audience and notifies watchers. Always show the draft and the target repo
  first.
- **`--label rfc` fails if the label is missing.** Create the label (above) or
  drop the flag.
- **Long bodies:** always use `--body-file`, not `--body "..."`. Inline
  Markdown with backticks and quotes breaks the shell.
- **Wrong repo:** without `--repo`, `gh` uses the current directory's repo.
  Check with `gh repo view` if unsure.
