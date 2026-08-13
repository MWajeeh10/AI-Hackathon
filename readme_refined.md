# Internal Work Management Platform

## 1. Project Overview

This project is a lightweight **internal project and task management web application** designed for solo freelancers and very small teams.

The platform helps users organize projects, break work into tasks and subtasks, assign responsibilities, track progress, monitor deadlines, identify delayed or at-risk work, and consistently complete projects.

The product should remain simple and focused rather than becoming a complex enterprise project-management platform.

### Core Product Promise

> Know what needs to be done, who is responsible, how work is progressing, what is delayed, and what needs attention.

### Core Workflow

**Create → Organize → Assign → Work → Track → Detect Delays → Complete**

---

# 2. Target Users

The platform supports four primary use cases:

1. **Freelancers managing multiple small clients**
2. **Student groups running a project**
3. **Small startups without a dedicated PM tool**
4. **Two-to-five-person creative or development teams**

## Important Client Rule

Clients are **not platform users**.

A freelancer may create internal projects representing different clients, for example:

```text
Freelancer Workspace
├── Restaurant Website — Client A
├── E-commerce Website — Client B
└── Mobile App — Client C
```

The clients themselves:

- Cannot register as clients
- Cannot log in
- Cannot access projects
- Cannot access tasks
- Cannot access dashboards
- Cannot receive a client dashboard
- Have no client role

The system is strictly an **internal work-management platform**.

---

# 3. Workspace Types

During signup, the user must choose one of two workspace types:

```text
How will you use the platform?

○ Solo Freelancer
○ Team
```

## 3.1 Solo Freelancer Workspace

A user selecting **Solo Freelancer** creates an individual workspace.

```text
Solo Workspace
└── Freelancer / Owner
    ├── Project A
    ├── Project B
    └── Project C
```

The freelancer can manage multiple projects, including work associated with multiple small clients, personal projects, or internal work.

There are no team members required in this workspace.

### 3.1.1 Workspace Membership Constraint (MVP)

For the MVP, one account maps to exactly one workspace: either a Solo workspace or membership in a single Team workspace, not both simultaneously, and not membership in multiple teams at once.

There is no defined upgrade path from Solo → Team in the MVP (e.g., a freelancer who grows into a team must be handled as a future enhancement, not assumed to work automatically). This constraint should be enforced at signup and documented as a known limitation rather than left implicit.

---

## 3.2 Team Workspace

A user selecting **Team** creates a team workspace.

The person who creates the team automatically becomes:

**Team Head**

```text
Team Workspace
└── Team Head
    ├── Member
    ├── Member
    ├── Member
    └── Member
```

### Team Size

The total team size is limited to **2–5 people**, including the Team Head.

Examples:

- Minimum: Team Head + 1 Member = 2
- Maximum: Team Head + 4 Members = 5

The Team Head is the administrator of the workspace.

---

# 4. User Roles

There are only three platform roles:

## 4.1 Solo Owner

Used for a Solo Freelancer workspace.

Responsibilities:

- Manage their own workspace
- Create and manage projects
- Create and manage tasks
- Track progress
- Manage deadlines
- Monitor delayed work

## 4.2 Team Head

The person who creates a Team workspace.

Responsibilities:

- Create and manage projects
- Create and assign tasks
- Set priorities and deadlines
- Invite members
- Manage team members
- Remove members
- Manage team settings
- Monitor team progress
- View delayed and at-risk work

## 4.3 Team Member

A person invited to a Team workspace.

Capabilities:

- View relevant projects
- View assigned tasks
- Update task status
- Update task progress
- Complete tasks
- Add comments/updates
- View deadlines
- View relevant activity

Team Members cannot:

- Invite new members
- Remove team members
- Change team ownership
- Manage team settings

## 4.4 Team Head Continuity

Because there is only ever one Team Head, the system must define what happens if that account is deleted, deactivated, or voluntarily leaves:

- The Team Head must explicitly transfer ownership to an existing Team Member before deleting their account or leaving the team.
- A team cannot be left in a state with zero Team Heads.
- If the Team Head account is deleted without a transfer (e.g., account termination for policy reasons), the system should require an admin/support-level ownership reassignment rather than leaving the team orphaned.

---

# 5. Team Invitation System

The official team invitation method is **email invitation**.

The Team Head can enter member email addresses and send invitations.

Example:

```text
Invite Team Members

Email 1: member1@email.com
Email 2: member2@email.com
Email 3: member3@email.com

[Send Invitations]
```

## Invitation Flow

```text
Team Head
    ↓
Invite Member
    ↓
Enter Email
    ↓
Send Invitation Email
    ↓
Member Opens Email
    ↓
Accept Invitation
    ↓
Existing User? ── Yes ──> Login
       │
       No
       ↓
Create Account
       ↓
Join Team
       ↓
Team Dashboard
```

Invitation requirements:

- Invitation must be associated with the correct team.
- Invitation should use a secure link/token.
- Invitation should expire after a defined period, such as 7 days.
- The Team Head should be able to see pending invitations.
- The Team Head should be able to cancel/resend invitations.
- The 5-member maximum must be enforced.
- Pending invitations should not allow the team to exceed the maximum capacity.
- Only the Team Head can invite members.

Email is the required MVP invitation mechanism. Other invitation methods such as shareable links or QR codes are not part of the core scope unless added later.

## 5.1 Member Removal & Task Reassignment

Removing a Team Member is not a pure deletion — it has downstream effects on their assigned work that must be handled explicitly:

- Before removal, the Team Head must either reassign the departing member's open (non-completed) tasks to another team member, or explicitly leave them unassigned.
- The system should surface a list of the member's open tasks at the point of removal rather than silently orphaning them.
- Completed tasks retain their historical assignee for activity-history purposes even after the member is removed.

---

# 6. Project Structure

The main application hierarchy is:

```text
Workspace
│
├── Members
│
├── Projects
│   ├── Tasks
│   │   ├── Subtasks
│   │   └── Updates/Comments
│   │
│   └── Tasks
│
└── Dashboard
```

Projects can represent:

- Client-related work
- University projects
- Startup initiatives
- Product development
- Websites
- Mobile applications
- Creative work
- Internal projects
- Personal projects

## 6.1 Data Model Constraint: Subtask Depth

Subtasks are a **single level only**. Subtasks cannot themselves have subtasks.

This must be enforced at the schema and API level, not just the UI, to avoid unbounded nesting that would complicate progress calculation, the dashboard, and task-health detection.

---

# 7. Task Structure

Each task should support:

- Title
- Description
- Assignee
- Priority
- Status
- Progress
- Start date
- Due date
- Subtasks
- Comments
- Activity history

Example:

```text
Build Login System

Assigned to: Ali
Priority: High
Status: In Progress
Progress: 65%

Start: Aug 10
Due: Aug 15

Subtasks:
✓ Database setup
✓ Login API
✓ Password validation
□ Testing
```

---

# 8. Task Status

The basic task workflow is:

```text
NOT STARTED
     ↓
IN PROGRESS
     ↓
IN REVIEW
     ↓
COMPLETED
```

Task **status** and task **health** are different concepts.

### Status

Describes the current state of the task:

- Not Started
- In Progress
- In Review
- Completed

### Health

Describes whether the task is progressing appropriately relative to its deadline:

- 🟢 On Track
- 🟡 At Risk
- 🔴 Delayed

---

# 9. Automatic Task Health

One of the project's important differentiating features is automatic task-health detection.

The system should use task progress and deadlines to identify work requiring attention.

Example:

```text
Task: Complete Homepage
Due: August 10
Current Date: August 13
Status: In Progress

Result:
Delayed — 3 days overdue
```

Possible health states:

### On Track

The task is progressing normally.

### At Risk

The deadline is approaching but progress may be insufficient.

### Delayed

The deadline has passed while the task is not completed.

## 9.1 Default "At Risk" Algorithm (MVP)

Rather than leaving this undefined, the MVP should ship with a simple, explainable default — refinable later, but not blank:

```text
Let:
  elapsed_ratio  = (today - start_date) / (due_date - start_date)
  progress_ratio = current_progress / 100

If due_date has passed AND status != Completed:
      → Delayed

Else if elapsed_ratio >= 0.7 AND progress_ratio < elapsed_ratio - 0.2:
      → At Risk   (more than 70% of the timeline has elapsed,
                    and progress is meaningfully behind schedule)

Else:
      → On Track
```

Notes:

- Tasks with no due date are always **On Track** (health detection requires a deadline to compare against).
- Tasks with no start date can use task-creation date as a fallback start.
- This is a starting heuristic, not a permanent algorithm — it should be revisited once real usage data exists, but the MVP must not ship with "At Risk" undefined, since it's a named part of the core product promise.

---

# 10. Progress Tracking

The system should support task and project progress.

Progress may be manually updated or calculated from subtasks.

Example:

```text
Website Project

Tasks:
✓ Research
✓ Wireframes
✓ UI Design
□ Development
□ Testing

Overall Progress: 60%
```

A future implementation may automatically calculate progress from completed subtasks.

## 10.1 Manual vs. Auto-Calculated Progress (Precedence Rule)

The original spec allows both manual progress entry and subtask-derived progress without saying which one wins if they conflict. This must be resolved explicitly:

- **If a task has subtasks**, its progress is always auto-calculated from subtask completion (e.g., completed subtasks ÷ total subtasks). Manual progress entry is disabled for that task.
- **If a task has no subtasks**, progress must be entered manually, since there's nothing to derive it from.
- Project-level progress is always an aggregate of its tasks' progress (weighted equally unless a future weighting feature is added), never manually overridden.

This keeps "progress" unambiguous instead of letting a manual number silently disagree with subtask completion.

---

# 11. Deadline Management

Tasks should support:

- Start date
- Due date
- Upcoming deadline detection
- Automatic overdue detection

The system should organize work around time, for example:

- Overdue
- Today
- Tomorrow
- This Week
- Upcoming
- No Deadline

The purpose is to help users quickly understand what needs attention.

---

# 12. Dashboard

The dashboard is the main work overview.

It should show information such as:

```text
Dashboard

Total Tasks       32
Completed         20
Delayed            3

Overall Progress
██████████████░░░░ 72%

Today's Work
□ Finish homepage
□ Review API
□ Write documentation

Needs Attention
🔴 Payment integration — overdue
🟡 Testing — deadline approaching
```

The dashboard should make it easy to answer:

- What needs to be done?
- Who is responsible?
- What is due soon?
- What is completed?
- What is delayed?
- What is at risk?
- What needs attention?
- How is the overall project progressing?

---

# 13. Functional Requirements

The functional requirements are intentionally limited to **15**.

| ID | Functional Requirement |
|---|---|
| **FR-01** | User Registration & Login: Users can create accounts and securely log in. |
| **FR-02** | Workspace Type Selection: Users choose Solo Freelancer or Team during registration. |
| **FR-03** | Solo Workspace: Solo freelancers can create and manage their own workspace and multiple projects. |
| **FR-04** | Team Workspace: A user can create a Team workspace and automatically become Team Head. |
| **FR-05** | Email Team Invitations: Team Head can invite members by email, with a 2–5 member team limit. |
| **FR-06** | Team Member Management: Team Head can view, manage, remove members, and manage pending invitations. |
| **FR-07** | Project Management: Users can create, edit, view, archive, and manage projects. |
| **FR-08** | Task & Subtask Management: Users can create, edit, assign, prioritize, organize, and complete tasks/subtasks. |
| **FR-09** | Task Status Management: Tasks can be tracked as Not Started, In Progress, In Review, or Completed. |
| **FR-10** | Progress Tracking: Task and project progress can be tracked and overall project progress calculated. |
| **FR-11** | Deadline Management: Users can set dates and the system automatically identifies overdue tasks. |
| **FR-12** | Task Health Detection: System identifies On Track, At Risk, or Delayed work based on progress/deadlines. |
| **FR-13** | Dashboard & Work Overview: Dashboard displays projects, tasks, progress, deadlines, completed work, delayed work, and attention items. |
| **FR-14** | Task Collaboration: Authorized users can add comments, updates, and activity information to tasks. |
| **FR-15** | Access & Role Control: Solo Owners, Team Heads, and Team Members receive appropriate permissions; clients have no platform access. |

---

# 14. Non-Functional Requirements

## 14.1 Usability

The interface should be simple and intuitive.

Users should be able to create projects, create tasks, understand progress, and identify delayed work without unnecessary complexity.

## 14.2 Performance

The system should respond quickly for normal operations.

Dashboard, project, task, and navigation operations should be responsive.

## 14.3 Security

The system must protect user and workspace data through:

- Secure authentication
- Password hashing
- Session management
- Authorization
- Input validation
- Secure invitation links
- Protection against unauthorized workspace access

Users must not be able to access another workspace's private data.

## 14.4 Privacy

Projects and tasks are private internal information.

Clients must never receive platform access.

## 14.5 Reliability

Created projects, tasks, progress, memberships, and completion states should persist reliably.

## 14.6 Scalability

The initial workspace size is intentionally small:

- Solo: 1 user
- Team: 2–5 users

The architecture should allow future expansion without a complete redesign.

## 14.7 Availability

The application should remain available with minimal downtime.

## 14.8 Maintainability

The application should use a modular architecture so future features can be added without major restructuring.

## 14.9 Data Integrity

The system must maintain accurate relationships between:

```text
Workspace → Users → Projects → Tasks → Subtasks
```

## 14.10 Compatibility

The web application should support modern browsers and responsive layouts for desktop, laptop, tablet, and mobile.

## 14.11 Invitation Reliability

Email invitations should:

- Send reliably
- Use secure invitation links
- Be associated with the correct team
- Expire after a defined period
- Prevent unauthorized joining
- Respect the 5-member limit

## 14.12 Simplicity

The application should avoid unnecessary enterprise-level complexity and remain focused on the core workflow.

---

# 15. Requirement Prioritization

## 15.1 Most Important — MVP Core

These are the essential requirements:

- FR-01 — User Registration & Login
- FR-02 — Solo Freelancer / Team Selection
- FR-03 — Solo Workspace
- FR-04 — Team Workspace & Team Head
- FR-05 — Email Team Invitations
- FR-06 — Team Member Management
- FR-07 — Project Management
- FR-08 — Task & Subtask Management
- FR-09 — Task Status Management
- FR-10 — Progress Tracking
- FR-11 — Deadline Management
- FR-12 — Task Health Detection
- FR-13 — Dashboard & Work Overview
- FR-15 — Access & Role Control

These define the core product.

## 15.2 Less Important — Supporting Features

- FR-14 — Task Collaboration
- Reliability improvements
- Scalability improvements
- Availability improvements
- Data integrity improvements
- Invitation reliability improvements

These should follow the fundamental workflow.

## 15.3 Good to Have — Future/Quality Enhancements

Potential additions include:

- Advanced usability improvements
- Advanced performance optimization
- Enhanced privacy controls
- Advanced responsive/mobile optimization
- Advanced analytics/reporting
- Advanced calendar/timeline views
- Notifications
- AI-assisted task planning
- AI task breakdown
- AI deadline-risk prediction
- Productivity insights
- Workload analysis

Security, authentication, authorization, privacy, and basic data integrity are mandatory even in the MVP and should not actually be postponed.

---

# 16. Seven Development Phases

## Phase 1 — Foundation & Authentication

### Goal

Establish the application's technical foundation and authentication.

### Includes

- Project setup
- Database setup
- User registration
- Login/logout
- Password security
- Session management
- Basic profile
- Solo Freelancer / Team selection

### Outcome

Users can register, authenticate, and select their workspace type.

---

## Phase 2 — Workspace & Team Management

### Goal

Implement Solo and Team workspace models.

### Includes

- Solo workspace creation
- Team workspace creation
- Team Head assignment
- Team roles
- Email invitations
- Invitation acceptance
- Invitation expiration
- Pending invitations
- 2–5 member restriction
- Team member removal
- Role-based access

### Outcome

Solo users can create private workspaces, while Team Heads can create teams and invite members by email.

---

## Phase 3 — Project Management

### Goal

Allow users to organize work into projects.

### Includes

- Create project
- Edit project
- View project
- Archive project
- Project description
- Project dates
- Project status
- Project overview

### Outcome

Users can manage multiple independent projects.

---

## Phase 4 — Task & Subtask Management

### Goal

Break projects into actionable work.

### Includes

- Create tasks
- Edit tasks
- Delete/archive tasks
- Assign tasks
- Create subtasks
- Task descriptions
- Priorities
- Statuses
- Start dates
- Due dates
- Comments/updates

### Outcome

Projects can be broken into manageable tasks and subtasks.

---

## Phase 5 — Progress, Deadlines & Task Health

### Goal

Make the system understand the state and health of work.

### Includes

- Task progress
- Project progress
- Automatic overdue detection
- On Track
- At Risk
- Delayed
- Deadline monitoring
- Automatic progress calculations

### Outcome

The system can highlight work that requires attention.

---

## Phase 6 — Dashboard & Collaboration

### Goal

Build the central work-management experience.

### Includes

- Main dashboard
- Project progress overview
- Today's tasks
- Upcoming deadlines
- Completed tasks
- Delayed tasks
- At-risk tasks
- Team workload overview
- Task comments
- Task activity history
- Responsive interface
- Usability improvements

### Outcome

Users can understand the overall state of their work from one place.

---

## Phase 7 — Testing, Quality & Deployment

### Goal

Make the application secure, reliable, maintainable, and deployable.

### Includes

- Functional testing
- Security testing
- Authorization testing
- Invitation testing
- Data-integrity testing
- Performance optimization
- Browser compatibility testing
- Responsive testing
- Error handling
- Database backup/recovery
- Deployment
- Documentation

### Future-ready architecture

The system may later support:

- Advanced calendar/timeline
- Notifications
- Advanced analytics
- Workload analysis
- AI task breakdown
- AI deadline-risk prediction
- Productivity insights

These are future enhancements and should not distract from the core MVP.

---

# 17. Development Roadmap

```text
Phase 1
Foundation & Authentication
        ↓
Phase 2
Workspace & Team Management
        ↓
Phase 3
Project Management
        ↓
Phase 4
Task & Subtask Management
        ↓
Phase 5
Progress, Deadlines & Task Health
        ↓
Phase 6
Dashboard & Collaboration
        ↓
Phase 7
Testing, Quality & Deployment
```

---

# 18. MVP Definition

After Phase 6, the core product should support:

## Solo Freelancer

```text
Solo Workspace
    ↓
Multiple Projects
    ↓
Tasks & Subtasks
    ↓
Progress
    ↓
Deadlines
    ↓
Automatic Delay Detection
    ↓
Dashboard
    ↓
Completion
```

## Small Team

```text
Team Head
    ↓
Email Invitations
    ↓
2–5 Team Members
    ↓
Projects
    ↓
Assigned Tasks
    ↓
Progress
    ↓
Deadlines
    ↓
Delay/Health Detection
    ↓
Dashboard
    ↓
Completion
```

Phase 7 prepares the working MVP for reliable deployment.

---

# 19. Important Scope Boundaries

The following rules should remain fixed unless the project scope is explicitly changed:

1. **No client accounts.**
2. **No client dashboard.**
3. **No client login.**
4. **No client access to projects or tasks.**
5. **Solo Freelancer and Team are the only workspace types.**
6. **Team Head is automatically assigned when a Team workspace is created.**
7. **Team size is limited to 2–5 people, including the Team Head.**
8. **Team members are invited through email.**
9. **Only the Team Head manages team membership.**
10. **The system is primarily for internal work organization and completion.**
11. **The MVP should remain simple rather than becoming an enterprise PM platform.**
12. **The core differentiator is visibility into progress, deadlines, delays, and work requiring attention.**

---

# 20. Guidance for Future AI Agents

Any AI agent continuing this project should treat this README as the **baseline specification**.

Before proposing additional features or architecture:

1. Preserve the existing user types.
2. Preserve the Solo Freelancer / Team workspace selection.
3. Preserve the Team Head role.
4. Preserve the 2–5 team-member limit.
5. Preserve email-only team invitations for the MVP.
6. Never introduce client accounts unless the project scope is explicitly changed.
7. Keep projects, tasks, progress, deadlines, and task-health detection central.
8. Do not unnecessarily expand the platform into an enterprise project-management system.
9. Respect the 15-functional-requirement limit unless explicitly asked to revise it.
10. Build according to the seven defined development phases.
11. Treat security, authorization, privacy, and data integrity as mandatory.
12. Future features should be proposed as extensions rather than replacing the core MVP.

The next AI agent can use this document to elaborate the system into detailed **requirements, user stories, architecture, database schema, API design, UI/UX specifications, development tasks, testing strategy, and deployment plans** while maintaining the defined scope.

---

# 21. Open Decisions (Refinement Notes)

These are gaps identified during review. They are **flagged, not resolved**, since Section 20 explicitly instructs future agents to respect the existing 15-FR limit and scope boundaries unless the project owner says otherwise. Sections 3.1.1, 4.4, 5.1, 6.1, 9.1, and 10.1 above resolved the *implementation-ambiguity* gaps (rules that were missing entirely). The item below is a *product-scope* question and is left for you to decide:

## 21.1 Proactive Delay Notification

The core product promise is "identify delayed or at-risk work" — but as scoped, the system only surfaces this passively, when a user opens the dashboard. Nothing pushes it to them. Notifications are currently listed under Section 15.3 ("Good to Have — Future"), alongside genuinely non-essential items like AI task breakdown.

Worth deciding explicitly, since it changes how much the MVP actually delivers on its own promise:

- **Option A — Keep as scoped.** Notifications stay fully post-MVP. Users must check the dashboard themselves to learn something is delayed.
- **Option B — Minimal in-app-only signal at MVP.** No email/push infrastructure; just a lightweight "X items need attention" indicator visible on login (e.g., a badge count), without building a notification system. This is a small addition, not a new subsystem.
- **Option C — Full notification system.** Move email/push notifications into the MVP scope as a new functional requirement. This is the most work and the most likely to cause scope creep, given the document's own emphasis on staying lightweight.

No option is applied here — this is intentionally left as a decision for the project owner rather than assumed.
