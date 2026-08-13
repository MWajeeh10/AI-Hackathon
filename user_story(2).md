# User Stories — Internal Work Management Platform

## 1. Purpose

This document defines the user stories for the internal work-management platform described in `readme_refined.md`.

The stories cover:

- Solo Freelancers
- Team Heads
- Team Members

Clients are intentionally excluded because they are not platform users.

---

# 2. Actors

## 2.1 Solo Owner

A freelancer using the platform alone.

## 2.2 Team Head

The user who creates a Team workspace and becomes its administrator.

## 2.3 Team Member

A person who joins a Team workspace through an email invitation.

## 2.4 System

The application automatically performs actions such as:

- Authentication
- Workspace validation
- Invitation validation
- Progress calculation
- Deadline classification
- Task-health detection
- Access control

---

# 3. Epic Overview

| Epic | Description | Primary Actors |
|---|---|---|
| EPIC-01 | Account & Authentication | All users |
| EPIC-02 | Workspace Setup | Solo Owner, Team Head |
| EPIC-03 | Team Invitations | Team Head, Team Member |
| EPIC-04 | Team Management | Team Head |
| EPIC-05 | Project Management | Solo Owner, Team Head |
| EPIC-06 | Task & Subtask Management | Solo Owner, Team Head, Team Member |
| EPIC-07 | Progress Tracking | All authorized users |
| EPIC-08 | Deadline & Task Health | All authorized users |
| EPIC-09 | Dashboard | All authorized users |
| EPIC-10 | Collaboration | Authorized workspace users |
| EPIC-11 | Access Control | System / All users |
| EPIC-12 | Team Continuity & Task Reassignment | Team Head |

---

# 4. EPIC-01 — Account & Authentication

## US-001 — Register an Account

**As a new user, I want to create an account so that I can use the work-management platform.**

### Acceptance Criteria

- User can provide required registration information.
- Email must be valid.
- Password must meet defined security requirements.
- Duplicate account emails are rejected.
- Account is securely stored.
- User proceeds to workspace-type selection.

---

## US-002 — Log In

**As a registered user, I want to log in securely so that I can access my private workspace.**

### Acceptance Criteria

- Valid credentials allow access.
- Invalid credentials are rejected.
- User can log out.
- Authentication state is maintained securely.
- User cannot access workspace data without authentication.

---

## US-003 — Maintain One-Workspace MVP Constraint

**As the system, I want to restrict each account to one workspace so that the MVP maintains a simple workspace model.**

### Acceptance Criteria

- An account belongs to exactly one workspace.
- A user cannot join multiple Team workspaces.
- A user cannot simultaneously own a Solo workspace and belong to a Team workspace.
- No automatic Solo → Team upgrade exists in the MVP.

---

# 5. EPIC-02 — Workspace Setup

## US-004 — Choose Solo Freelancer Workspace

**As a freelancer, I want to choose Solo Freelancer during signup so that I can manage my work independently.**

### Acceptance Criteria

- Signup presents Solo Freelancer as an option.
- Selecting it creates a Solo workspace.
- The creator becomes the Solo Owner.
- No additional members are required.
- The user is taken to their workspace/dashboard.

---

## US-005 — Create Team Workspace

**As a user, I want to choose Team during signup so that I can create a workspace for my small team.**

### Acceptance Criteria

- Signup presents Team as an option.
- Team name can be provided.
- The creator automatically becomes Team Head.
- Team starts with one member: the Team Head.
- Team cannot exceed five total members.

---

# 6. EPIC-03 — Team Invitations

## US-006 — Invite a Team Member by Email

**As a Team Head, I want to send an invitation email to a potential team member so that they can join my team.**

### Acceptance Criteria

- Team Head can enter an email address.
- System validates team capacity.
- Invitation is associated with the correct workspace.
- Invitation contains a secure token/link.
- Invitation is sent through email.
- Invitation appears as pending.

---

## US-007 — Prevent Team Overcapacity

**As the system, I want to prevent invitations from exceeding five total team members so that the workspace respects the team-size limit.**

### Acceptance Criteria

- Maximum total team size is five.
- Pending invitations are considered when enforcing capacity.
- New invitations are blocked when no capacity remains.
- Existing invitations cannot be used to exceed five members.

---

## US-008 — Accept Team Invitation

**As an invited person, I want to accept an invitation so that I can join the team.**

### Acceptance Criteria

- Invitation link is validated.
- Expired invitations are rejected.
- Invalid invitations are rejected.
- Existing users can log in and accept.
- New users can create an account and accept.
- Successful acceptance creates Team Member membership.
- User enters the Team workspace.

---

## US-009 — Manage Pending Invitations

**As a Team Head, I want to view and manage pending invitations so that I know who has been invited.**

### Acceptance Criteria

- Team Head can view pending invitations.
- Invitation email is visible.
- Invitation status is visible.
- Expiration is visible.
- Team Head can cancel a pending invitation.
- Team Head can resend an expired/cancelled invitation when capacity allows.

---

# 7. EPIC-04 — Team Management

## US-010 — View Team Members

**As a Team Head, I want to view team members so that I can manage the workspace.**

### Acceptance Criteria

- Team Head can view all current members.
- Each member's role is visible.
- Exactly one Team Head is shown.
- Team size is visible.

---

## US-011 — Remove a Team Member

**As a Team Head, I want to remove a member so that I can keep team membership accurate.**

### Acceptance Criteria

- Only Team Head can remove members.
- System checks whether the member has open tasks.
- Completed-task history remains intact.
- Open tasks are presented for reassignment or leaving unassigned.
- Member loses workspace access after removal.

---

## US-012 — Reassign Open Tasks Before Member Removal

**As a Team Head, I want to reassign a departing member's open tasks so that work does not become accidentally orphaned.**

### Acceptance Criteria

- System lists open tasks assigned to the member.
- Team Head can select another team member for reassignment.
- Team Head can explicitly leave a task unassigned.
- Completed tasks retain historical assignment.
- Member can then be removed.

---

## US-013 — Transfer Team Head Role

**As a Team Head, I want to transfer ownership to an existing Team Member before leaving so that the team remains operational.**

### Acceptance Criteria

- Team Head can select an existing Team Member.
- Selected member becomes the new Team Head.
- Previous Team Head becomes a normal Team Member if they remain in the workspace.
- The system does not allow a team to have zero Team Heads.
- Team Head cannot leave/delete their account without transferring ownership.

---

# 8. EPIC-05 — Project Management

## US-014 — Create a Project

**As an authorized workspace user, I want to create a project so that I can organize a body of work.**

### Acceptance Criteria

- User can provide a project name.
- User can provide a description.
- Project belongs to the current workspace.
- Project is not visible outside the workspace.
- Project appears in the project list.

---

## US-015 — Manage Projects

**As an authorized user, I want to view and manage projects so that I can keep work organized.**

### Acceptance Criteria

- User can view projects they are authorized to access.
- Authorized users can edit projects.
- Projects can be archived.
- Archived projects remain protected from unauthorized access.
- Project details include relevant dates/status information.

---

## US-016 — Manage Multiple Projects

**As a Solo Owner, I want to manage multiple projects so that I can keep work for different clients or activities organized separately.**

### Acceptance Criteria

- Freelancer can create multiple projects.
- Projects can represent different clients internally.
- Clients are not given accounts or access.
- Projects remain within the freelancer's private workspace.

---

# 9. EPIC-06 — Task & Subtask Management

## US-017 — Create a Task

**As an authorized user, I want to create a task so that I can turn project work into an actionable item.**

### Acceptance Criteria

- Task requires a title.
- Description can be added.
- Task can have a priority.
- Task can have an assignee where applicable.
- Task can have a start date.
- Task can have a due date.
- Task belongs to a project.

---

## US-018 — Assign a Task

**As a Team Head, I want to assign tasks to team members so that everyone knows who is responsible.**

### Acceptance Criteria

- Team Head can select an existing Team Member.
- Assignee must belong to the same workspace.
- Task displays its assignee.
- Unauthorized users cannot assign tasks to users outside their workspace.

---

## US-019 — Update Task Status

**As an authorized user, I want to update task status so that the team can see its current state.**

### Acceptance Criteria

Supported statuses are:

- Not Started
- In Progress
- In Review
- Completed

Status changes are saved and reflected wherever the task appears.

---

## US-020 — Create Subtasks

**As an authorized user, I want to create subtasks so that I can break a task into smaller pieces of work.**

### Acceptance Criteria

- Subtasks belong to a parent task.
- Subtasks can be marked completed/incomplete.
- Subtasks cannot contain further subtasks.
- Subtask completion contributes to parent-task progress.

---

## US-021 — Enforce Single-Level Subtasks

**As the system, I want to prevent nested subtasks so that task structure remains simple and calculations remain predictable.**

### Acceptance Criteria

- A subtask cannot become the parent of another subtask.
- API validation rejects nested-subtask creation.
- UI does not expose nested-subtask controls.
- Database constraints or service-level validation enforce the rule.

---

## US-022 — Update Task Progress

**As an authorized user, I want to update task progress so that I can communicate how much work is complete.**

### Acceptance Criteria

- Tasks without subtasks allow manual progress.
- Progress is represented from 0–100%.
- Tasks with subtasks use automatic subtask-based progress.
- Manual progress is unavailable when subtasks exist.

---

# 10. EPIC-07 — Progress Tracking

## US-023 — Automatically Calculate Task Progress

**As a user, I want task progress to reflect completed subtasks so that progress is objective and consistent.**

### Acceptance Criteria

- Completed subtasks are counted.
- Parent task progress equals completed subtasks divided by total subtasks.
- Progress updates when subtask completion changes.
- Manual progress cannot override calculated progress.

---

## US-024 — Calculate Project Progress

**As a user, I want project progress to be calculated from its tasks so that I can understand overall project completion.**

### Acceptance Criteria

- Each task contributes its progress.
- Project progress is an aggregate of task progress.
- Tasks are weighted equally in the MVP.
- Project progress updates when task progress changes.
- Project progress cannot be manually overridden.

---

# 11. EPIC-08 — Deadlines & Task Health

## US-025 — Set Task Dates

**As an authorized user, I want to set task start and due dates so that work can be planned around time.**

### Acceptance Criteria

- Start date can be specified.
- Due date can be specified.
- Due date cannot be invalid relative to the task's date rules.
- Tasks without a due date are allowed.

---

## US-026 — Identify Overdue Tasks

**As a user, I want the system to automatically identify overdue tasks so that I do not have to manually mark them.**

### Acceptance Criteria

- System compares the current date with the due date.
- A task past its due date and not Completed becomes Delayed.
- Delayed status/health appears on relevant task and dashboard views.
- Completed tasks are not marked Delayed because their due date has passed.

---

## US-027 — Identify At-Risk Tasks

**As a user, I want the system to identify tasks that are falling behind so that I can act before the deadline is missed.**

### Acceptance Criteria

For the MVP:

- Task must have a due date.
- If 70% or more of the timeline has elapsed and progress is more than 20 percentage points behind elapsed time, task is At Risk.
- Tasks with no due date are On Track.
- Tasks with no start date use creation date as fallback.
- A task past its due date is Delayed, not At Risk.

---

## US-028 — View Task Health

**As a user, I want to see whether a task is On Track, At Risk, or Delayed so that I can prioritize attention.**

### Acceptance Criteria

- Health is displayed separately from task status.
- Health can be calculated automatically.
- Health is visible in relevant task/project/dashboard views.

---

# 12. EPIC-09 — Dashboard

## US-029 — View Work Dashboard

**As a user, I want a dashboard showing my work at a glance so that I can quickly understand what needs attention.**

### Acceptance Criteria

Dashboard includes relevant information such as:

- Total tasks
- Completed tasks
- Delayed tasks
- Overall progress
- Today's work
- Upcoming deadlines
- At-risk work
- Delayed work

---

## US-030 — View Today's Work

**As a user, I want to see tasks requiring attention today so that I know what to work on.**

### Acceptance Criteria

- Tasks due today are identifiable.
- Relevant assigned tasks are visible.
- Completed tasks are distinguishable.
- Delayed items can be identified separately.

---

## US-031 — View Project Progress

**As a user, I want to see project progress so that I can understand whether a project is moving toward completion.**

### Acceptance Criteria

- Project progress is displayed.
- Progress reflects current task progress.
- Progress updates when task/subtask completion changes.

---

# 13. EPIC-10 — Collaboration

## US-032 — Comment on a Task

**As an authorized workspace user, I want to comment on a task so that I can communicate relevant information without leaving the project context.**

### Acceptance Criteria

- Authorized users can add comments.
- Comments are attached to the correct task.
- Comment author is recorded.
- Timestamp is recorded.
- Unauthorized users cannot view or add comments.

---

## US-033 — View Task Activity

**As an authorized user, I want to see task activity so that I can understand what changed and who changed it.**

### Acceptance Criteria

Activity can record relevant events such as:

- Task created
- Task assigned
- Status changed
- Progress changed
- Comment added
- Task completed

Activity belongs to the workspace/task context and is not publicly accessible.

---

# 14. EPIC-11 — Access & Role Control

## US-034 — Protect Workspace Data

**As a user, I want my workspace data to remain private so that other users cannot access my projects and tasks.**

### Acceptance Criteria

- Authentication is required.
- Workspace membership is checked server-side.
- Users cannot access another workspace by changing an ID in a URL/API request.
- Clients have no access path.
- Unauthorized requests are rejected.

---

## US-035 — Enforce Team Head Permissions

**As the system, I want to enforce Team Head permissions so that only the Team Head can perform administrative actions.**

### Acceptance Criteria

Only the Team Head can:

- Invite members
- Cancel/resend invitations
- Remove members
- Manage team settings
- Transfer Team Head ownership

---

## US-036 — Enforce Team Member Permissions

**As a Team Member, I want access to the work I need without administrative permissions so that I can focus on assigned work.**

### Acceptance Criteria

Team Members can:

- View relevant work
- Update assigned tasks
- Update progress
- Complete tasks
- Comment on tasks

Team Members cannot:

- Invite members
- Remove members
- Change team ownership
- Manage team settings

---

## US-037 — Prevent Client Access

**As the system, I want to have no client role or client workspace access so that the platform remains an internal work-management system.**

### Acceptance Criteria

- No Client role exists.
- Clients cannot register as clients.
- No client dashboard exists.
- Client-related projects are internal workspace projects only.
- There is no client authentication flow.

---

# 15. EPIC-12 — Team Continuity

## US-038 — Prevent Orphaned Teams

**As the system, I want to prevent a Team Head from leaving without transferring ownership so that a Team workspace always has an administrator.**

### Acceptance Criteria

- Team Head cannot leave while remaining the only Team Head.
- Ownership transfer must target an existing Team Member.
- New Team Head receives administrative permissions.
- Team continues functioning after transfer.

---

# 16. User Story Priority

## Most Important — MVP Core

| ID | Story |
|---|---|
| US-001 | Register an Account |
| US-002 | Log In |
| US-003 | Maintain One-Workspace Constraint |
| US-004 | Choose Solo Workspace |
| US-005 | Create Team Workspace |
| US-006 | Invite Member by Email |
| US-007 | Prevent Team Overcapacity |
| US-008 | Accept Team Invitation |
| US-010 | View Team Members |
| US-014 | Create Project |
| US-015 | Manage Projects |
| US-016 | Manage Multiple Projects |
| US-017 | Create Task |
| US-018 | Assign Task |
| US-019 | Update Task Status |
| US-020 | Create Subtasks |
| US-021 | Enforce Single-Level Subtasks |
| US-022 | Update Task Progress |
| US-023 | Calculate Task Progress |
| US-024 | Calculate Project Progress |
| US-025 | Set Task Dates |
| US-026 | Identify Overdue Tasks |
| US-027 | Identify At-Risk Tasks |
| US-028 | View Task Health |
| US-029 | View Work Dashboard |
| US-030 | View Today's Work |
| US-031 | View Project Progress |
| US-034 | Protect Workspace Data |
| US-035 | Enforce Team Head Permissions |
| US-036 | Enforce Team Member Permissions |
| US-037 | Prevent Client Access |

---

## Less Important — Supporting Features

| ID | Story |
|---|---|
| US-009 | Manage Pending Invitations |
| US-011 | Remove Team Member |
| US-012 | Reassign Open Tasks |
| US-013 | Transfer Team Head Role |
| US-032 | Comment on a Task |
| US-033 | View Task Activity |
| US-038 | Prevent Orphaned Teams |

These are important supporting behaviors but can follow the fundamental workspace/project/task workflow during implementation.

---

# 17. Story-to-Phase Mapping

| Phase | User Stories |
|---|---|
| **Phase 1 — Foundation & Authentication** | US-001, US-002, US-003 |
| **Phase 2 — Workspace & Team Management** | US-004, US-005, US-006, US-007, US-008, US-009, US-010, US-011, US-012, US-013, US-034, US-035, US-036, US-037, US-038 |
| **Phase 3 — Project Management** | US-014, US-015, US-016 |
| **Phase 4 — Task & Subtask Management** | US-017, US-018, US-019, US-020, US-021, US-022, US-032, US-033 |
| **Phase 5 — Progress, Deadlines & Task Health** | US-023, US-024, US-025, US-026, US-027, US-028 |
| **Phase 6 — Dashboard & Collaboration** | US-029, US-030, US-031, US-032, US-033 |
| **Phase 7 — Testing, Quality & Deployment** | All stories validated through functional, security, authorization, invitation, data-integrity, performance, browser, and responsive testing |

---

# 18. Core User Journeys

## 18.1 Solo Freelancer Journey

```text
Register
   ↓
Choose "Solo Freelancer"
   ↓
Create Solo Workspace
   ↓
Create Project
   ↓
Create Tasks
   ↓
Set Dates / Priority
   ↓
Track Progress
   ↓
System Detects Health
   ↓
Dashboard Shows Attention Items
   ↓
Complete Work
```

---

## 18.2 Team Creation Journey

```text
Register
   ↓
Choose "Team"
   ↓
Create Team
   ↓
Become Team Head
   ↓
Send Email Invitations
   ↓
Members Accept
   ↓
Team Reaches 2–5 Members
   ↓
Create Projects
   ↓
Assign Tasks
   ↓
Track Team Progress
   ↓
Complete Work
```

---

## 18.3 Team Member Journey

```text
Receive Invitation Email
   ↓
Open Secure Link
   ↓
Accept Invitation
   ↓
Login / Create Account
   ↓
Join Team
   ↓
View Relevant Work
   ↓
Work on Assigned Tasks
   ↓
Update Status / Progress
   ↓
Comment / Complete
```

---

## 18.4 Delayed Task Journey

```text
Task Created
   ↓
Start Work
   ↓
Progress Updated
   ↓
Deadline Approaches
   ↓
System Evaluates Health
   ↓
At Risk
   ↓
Deadline Passes Without Completion
   ↓
Delayed
   ↓
Dashboard Highlights Task
   ↓
User Takes Action
   ↓
Task Completed
```

---

# 19. Definition of Done — Core User Stories

A story should be considered complete only when:

- The intended user can perform the action.
- Unauthorized roles cannot perform the action.
- Workspace boundaries are enforced server-side.
- Relevant data is persisted correctly.
- Validation and error handling are present.
- The behavior works for both Solo and Team contexts where applicable.
- The behavior does not introduce client access.
- Relevant acceptance criteria pass automated/manual tests.
