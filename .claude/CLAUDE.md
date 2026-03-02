# Source control
  - Prefer graphite cli (gt) over github for commits
  - DO NOT run gt sync unless instructed explicitly
  - DO NOT run gt submit unless instructed explicitly
  - PRs should always be created as a draft first
  - Create/update PRs on github via the gh cli
  - For pull requests, use the template here .github/PULL_REQUEST_TEMPLATE.md
  - For the template, do not leave the default text in place, fill it out
    meaningfully or delete it (e.g. _why_ this PR is needed should not appear,
    but be replaced with an actual reason)
  - When commiting, set HK_PROFILE=slow to ensure proper linting and formatting
  - Feel free to make use of github specific markdown tags like:
    - > [!NOTE]
    - > [!WARNING]
    - > [!TIP]
    - > [!IMPORTANT]
    - > [!CAUTION]

# General principles
  - keep the diff small
  - don’t invent new abstractions
  - don't test edge cases that are unlikely to occur in production
  - use red/green TDD

## Workflow Orchestration
### 1. Plan Node Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity
### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One tack per subagent for focused execution
### 3. Self-Improvement Loop
- After ANY correction from the user: update '~/agent-tasks/lessons.md' with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project
### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness
### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes - don't over-engineer
- Challenge your own work before presenting it
### 6. Autonomous Bug Fizing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests - then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management
1. **Plan First**: Write plan to "~/agent-tasks/{repo}/{branch}/todo.md" with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to 'tasks/todo.md"
6. **Capture Lessons**: Update '~/agent-tasks/{repo}/lessons.md' after corrections

## Core Principles
- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimat Impact**: Changes should only touch what's necessary. Avoid introducing bugs.
