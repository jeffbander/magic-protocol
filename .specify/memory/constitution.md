<!--
SYNC IMPACT REPORT
==================
Constitution Version: 0.0.0 → 1.0.0 (Initial Ratification)

Changes:
- Initial ratification of project constitution
- Established 5 core principles:
  1. Specification-First Development
  2. Independent User Stories
  3. Test-Driven Development (TDD)
  4. Incremental Delivery
  5. Simplicity & Observability

Sections Added:
- Core Principles (5 principles)
- Development Workflow
- Quality Standards
- Governance

Templates Status:
✅ plan-template.md - Constitution Check section aligns with principles
✅ spec-template.md - User story independence aligns with Principle II
✅ tasks-template.md - Incremental delivery structure aligns with Principle IV
⚠ Command files - Pending verification of agent-neutral language

Follow-up TODOs:
- Review .claude/commands/*.md files to ensure no Claude-specific language when generic guidance needed
- Update constitution if project diverges from standard Specify workflow
- Add project-specific constraints if needed (e.g., compliance, performance SLAs)
-->

# MagicProtocol Constitution

## Core Principles

### I. Specification-First Development

Every feature MUST begin with a complete specification before any implementation work starts.

**Rules**:
- User scenarios and acceptance criteria MUST be documented in spec.md
- Functional requirements MUST be clearly enumerated
- Success criteria MUST be measurable and technology-agnostic
- Specifications MUST be approved before planning phase begins

**Rationale**: Clear specifications prevent scope creep, enable accurate estimation, ensure alignment with user needs, and provide a definitive contract for what constitutes "done."

### II. Independent User Stories

User stories MUST be designed to be independently implementable, testable, and deliverable.

**Rules**:
- Each user story MUST be assigned a priority (P1, P2, P3, etc.)
- Stories MUST NOT have circular dependencies
- Any single story MUST constitute a viable MVP that delivers value
- Stories MUST include explicit "Independent Test" descriptions
- Implementation MUST follow priority order unless parallel work is explicitly planned

**Rationale**: Independent stories enable incremental delivery, allow parallel development by multiple team members, reduce integration risk, and provide clear checkpoints for validation and deployment.

### III. Test-Driven Development (TDD) (NON-NEGOTIABLE)

When tests are required for a feature, they MUST be written before implementation and MUST fail before code is written.

**Rules**:
- Contract tests for APIs MUST be written first
- Integration tests for user journeys MUST be written first
- Tests MUST fail initially (Red phase)
- Implementation proceeds only after test failure is verified (Green phase)
- Refactoring occurs only after tests pass (Refactor phase)
- Tests are OPTIONAL - only required when explicitly requested in feature specification

**Rationale**: TDD ensures code meets requirements, prevents regressions, encourages better design through testability, and provides living documentation of system behavior.

### IV. Incremental Delivery

Features MUST be implemented in phases that enable delivery of working subsets.

**Rules**:
- Setup and Foundational phases MUST complete before user story implementation
- Each user story completion MUST produce independently functional software
- Higher priority stories (P1) MUST be completed before lower priority stories (P2, P3, etc.)
- Each story completion MUST be validated independently before proceeding
- Deployment/demo is permitted after any story completion

**Rationale**: Incremental delivery enables early user feedback, reduces risk, validates assumptions quickly, and ensures the team can pivot without losing all prior work.

### V. Simplicity & Observability

Code and architecture MUST remain simple, and system behavior MUST be observable.

**Rules**:
- YAGNI (You Aren't Gonna Need It): Do not build functionality until it is needed
- Complexity MUST be justified in the Complexity Tracking section of plan.md
- Simpler alternatives MUST be documented and their rejection reasoned
- Logging MUST be structured and cover key operations
- Text-based I/O is preferred for debuggability (stdin/stdout/stderr)

**Rationale**: Simple systems are easier to understand, maintain, and debug. Observable systems enable rapid troubleshooting and performance optimization. Complexity without justification creates technical debt.

## Development Workflow

### Specification Phase
1. User creates feature description
2. `/speckit.specify` command generates spec.md with user stories
3. `/speckit.clarify` command identifies underspecified areas (optional)
4. User approves specification

### Planning Phase
1. `/speckit.plan` command generates implementation plan
2. Plan includes Constitution Check validation
3. Technical context and project structure defined
4. Complexity violations justified if present

### Task Generation Phase
1. `/speckit.tasks` command generates dependency-ordered task list
2. Tasks organized by user story for independent delivery
3. Parallel opportunities marked with [P] flag

### Implementation Phase
1. `/speckit.implement` command executes task list
2. TDD cycle enforced when tests are requested
3. Each user story validated independently at checkpoints
4. Commit after each logical task completion

### Quality Assurance Phase
1. `/speckit.analyze` performs cross-artifact consistency analysis
2. `/speckit.checklist` generates custom validation checklist
3. All acceptance scenarios verified
4. Success criteria measured

## Quality Standards

### Documentation Requirements
- Every feature MUST have a spec.md with user scenarios
- Plan.md MUST document technical decisions and structure
- Contracts MUST be defined for all APIs/interfaces
- Quickstart.md MUST provide step-by-step usage instructions

### Testing Requirements
- Contract tests required for all API changes (when tests requested)
- Integration tests required for inter-service communication (when tests requested)
- Tests MUST be written before implementation (when tests requested)
- Unit tests are optional and added during Polish phase (when tests requested)

### Code Quality Requirements
- Linting and formatting tools MUST be configured
- Error handling MUST be comprehensive
- Logging MUST cover security events and key operations
- Code reviews MUST verify constitution compliance

### Versioning Requirements
- Constitution follows semantic versioning (MAJOR.MINOR.PATCH)
- MAJOR: Backward incompatible governance changes
- MINOR: New principles or materially expanded guidance
- PATCH: Clarifications, wording, non-semantic refinements

## Governance

### Constitution Authority
This constitution supersedes all other development practices and guidelines. When conflicts arise between this constitution and other documentation, the constitution takes precedence.

### Amendment Process
1. Proposed changes MUST be documented with rationale
2. Version bump type MUST be determined (MAJOR/MINOR/PATCH)
3. All dependent templates MUST be updated for consistency
4. Sync Impact Report MUST be generated
5. Changes require approval before adoption
6. Last Amended date MUST be updated to amendment date

### Compliance Review
- All pull requests MUST verify compliance with constitution principles
- Constitution Check gates in plan.md MUST pass before implementation
- Complexity violations MUST be documented and justified
- `/speckit.analyze` MUST be run before feature completion

### Template Synchronization
- plan-template.md Constitution Check section MUST align with principles
- spec-template.md requirements MUST reflect principle constraints
- tasks-template.md structure MUST support incremental delivery
- Command files MUST reference current principle numbering and names

### Deferred Definitions
No items currently deferred. All core principles and governance rules are defined.

**Version**: 1.0.0 | **Ratified**: 2025-11-11 | **Last Amended**: 2025-11-11
