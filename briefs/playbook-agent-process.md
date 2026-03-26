# hiac Agent Playbook

How we work with AI coding agents in this project.

---

## The Stack

| Tool | Purpose |
|------|---------|
| **td** | Task & session management |
| **pi (sidecar)** | Agent harness - single context point |
| **GitHub PRs** | Human review gate |

---

## Session Workflow

### Start of Session

```bash
# 1. Check what needs doing
td usage -q

# 2. Start a new session (fresh context window)
td usage --new-session

# 3. Pick up where last session left off
td list
```

### During Work

```bash
# Track progress on tasks
td start td-XXXXX

# Log progress
td log "Did X" td-XXXXX --type progress

# Mark done and submit for review
td review td-XXXXX
```

### End of Session

```bash
# Capture working state
td handoff

# Push work
git add -A && git commit -m "meaningful message" && git push
```

---

## Task Lifecycle

```
open → started → in_progress → in_review → approved/closed
```

| Status | Meaning | Who |
|--------|---------|-----|
| `open` | Needs doing | PM/Human |
| `started` | Claimed | Agent |
| `in_progress` | Actively working | Agent |
| `in_review` | Done, needs human check | Human |
| `approved/closed` | Verified complete | Human |

### Rules

1. **Implementer ≠ Approver** - Can't approve your own work
2. **Handoff must include verification** - Code must actually be committed
3. **Review gate** - Every fix goes through PR review

---

## PR Workflow

```
Agent implements → Push to feature branch → Open PR → Human reviews → Merge
                                                                    ↓
                                                            DELETE SOURCE BRANCH
```

### PR Checklist

Before merging, verify:
- [ ] Tests pass (`bun test`)
- [ ] Code compiles (`bun build`)
- [ ] Changes are intentional (review diff)
- [ ] **Source branch will be deleted after merge**

### Post-Merge Cleanup

```bash
# Delete source branch (done in GitHub UI or cli)
git push origin --delete feature-branch

# Close td tasks
td close td-XXXXX

# Check for orphaned worktrees
git worktree list
```

---

## Branch Management

### Keep It Clean

- One feature branch per task/PR
- Delete branch immediately after merge
- Don't leave branches "for later"

### Identifying Stale Branches

```bash
# Merged into main (safe to delete)
git branch --merged main | grep -v main

# Not merged (review these)
git branch --no-merged main

# Remote cleanup
git fetch --prune
git remote prune origin
```

---

## Handling Multiple Agents

If multiple agents touch the same repo:

1. **One branch per agent** - Never two agents on same branch
2. **Coordinate via td** - Check `td list` before starting
3. **Communicate in handoffs** - `td log` what was attempted

---

## Common Issues & Fixes

### "Session doesn't know what last session did"

```bash
td handoff  # Captures state
# Share handoff output with new session
```

### "Code claim doesn't match reality"

Verify before reviewing:
```bash
git diff HEAD~1  # Check what's actually changed
git log --oneline -5  # Check commit history
```

### "Orphaned worktrees piling up"

```bash
git worktree list
git worktree remove /path/to/stale-worktree
```

### "Can't approve my own PR"

Have someone else review, or:
- Self-review for correctness
- Another human approves

---

## When Things Go Wrong

### Agent created garbage branches/PRs

1. Merge/close the PRs
2. Delete the branches
3. Close associated td tasks
4. Clean up any temp files

### Work lost between sessions

- Always push before ending session
- Use `td handoff` to capture state
- Check `git status` before starting new work

### td task stuck in wrong state

```bash
td log "Resetting state" td-XXXXX
td reject td-XXXXX  # Back to open
# or
td reopen td-XXXXX
```

---

## Principles

1. **Sidecar is the single point of contact** - All work through one agent context
2. **td provides continuity** - Sessions know what came before
3. **PRs are the quality gate** - Human review before anything lands
4. **Cleanup is part of done** - No PR is complete until branch is deleted
5. **Treat agents like contractors** - They create work; someone must close the loop

---

## Quick Reference

```bash
# Start session
td usage --new-session

# What needs doing
td usage -q

# Start task
td start td-XXXXX

# Submit for review
td review td-XXXXX

# Approve (different session)
td approve td-XXXXX

# Close task
td close td-XXXXX

# Clean up branches
git fetch --prune && git remote prune origin
```
