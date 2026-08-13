# Architectural Diagrams — Internal Work Management Platform

## 1. Architecture Overview

The system is a private, multi-workspace web application supporting either:

- One Solo Freelancer workspace with one owner
- One Team workspace with 2–5 people, including one Team Head

Clients are not users and have no access.

```mermaid
flowchart TB
    U[User] --> A[Web Application]

    A --> AUTH[Authentication & Authorization]
    A --> WS[Workspace Management]
    A --> PM[Project Management]
    A --> TM[Task Management]
    A --> PH[Progress & Task Health]
    A --> DB[(Application Database)]

    AUTH --> DB
    WS --> DB
    PM --> DB
    TM --> DB
    PH --> DB

    AUTH --> EMAIL[Email Service]
    WS --> EMAIL

    PH --> DASH[Dashboard / Work Overview]
    PM --> DASH
    TM --> DASH
    DB --> DASH

    C[Client] -. No account / No access .-> A
```

---

## 2. High-Level System Architecture

```mermaid
flowchart LR
    subgraph ClientLayer["Client Layer"]
        WEB[Responsive Web Browser]
    end

    subgraph AppLayer["Application Layer"]
        API[Application/API Layer]

        AUTH[Authentication & Authorization]
        WORKSPACE[Workspace Service]
        PROJECT[Project Service]
        TASK[Task & Subtask Service]
        PROGRESS[Progress Service]
        HEALTH[Task Health Service]
        DASHBOARD[Dashboard Service]
        COLLAB[Comments & Activity Service]
    end

    subgraph DataLayer["Data Layer"]
        DB[(Relational Database)]
    end

    subgraph External["External Service"]
        EMAIL[Email Delivery Service]
    end

    WEB --> API

    API --> AUTH
    API --> WORKSPACE
    API --> PROJECT
    API --> TASK
    API --> PROGRESS
    API --> HEALTH
    API --> DASHBOARD
    API --> COLLAB

    AUTH --> DB
    WORKSPACE --> DB
    PROJECT --> DB
    TASK --> DB
    PROGRESS --> DB
    HEALTH --> DB
    DASHBOARD --> DB
    COLLAB --> DB

    WORKSPACE --> EMAIL
```

### Architectural principle

Keep the architecture modular but lightweight. The system should not be over-engineered for the initial 1–5-person workspace model.

---

## 3. User and Workspace Architecture

```mermaid
flowchart TD
    SIGNUP[Sign Up] --> CHOOSE{Choose Workspace Type}

    CHOOSE -->|Solo Freelancer| SOLO[Create Solo Workspace]
    CHOOSE -->|Team| TEAM[Create Team Workspace]

    SOLO --> OWNER[Solo Owner]
    OWNER --> SOLOPROJECTS[Multiple Projects]

    TEAM --> HEAD[Creator becomes Team Head]
    HEAD --> INVITE[Send Email Invitations]
    INVITE --> MEMBERS[Team Members]
    HEAD --> TEAMPROJECTS[Team Projects]

    MEMBERS --> TEAMPROJECTS

    CLIENT[Client] -. No Login / No Access .-> SOLOPROJECTS
    CLIENT -. No Login / No Access .-> TEAMPROJECTS
```

---

## 4. Workspace Relationship Model

### Solo

```text
User
└── Solo Workspace
    ├── Project
    │   ├── Task
    │   └── Task
    ├── Project
    └── Project
```

### Team

```text
User
└── Team Workspace
    ├── Team Head
    ├── Team Member
    ├── Team Member
    ├── Team Member
    ├── Team Member
    │
    ├── Project
    │   ├── Task → Member
    │   ├── Task → Member
    │   └── Task
    │
    └── Project
```

A Team workspace must contain exactly one Team Head and between 1 and 4 additional members.

---

## 5. Entity Relationship Diagram

```mermaid
erDiagram
    USER ||--|| WORKSPACE : owns_or_belongs_to
    WORKSPACE ||--o{ PROJECT : contains
    WORKSPACE ||--o{ MEMBERSHIP : has
    USER ||--o{ MEMBERSHIP : has

    PROJECT ||--o{ TASK : contains
    TASK ||--o{ SUBTASK : contains
    TASK ||--o{ COMMENT : has
    TASK ||--o{ ACTIVITY : records

    USER ||--o{ TASK : assigned_to
    USER ||--o{ COMMENT : writes
    USER ||--o{ ACTIVITY : performs

    WORKSPACE ||--o{ INVITATION : sends
    USER ||--o{ INVITATION : creates

    USER {
        uuid id PK
        string name
        string email
        string password_hash
        datetime created_at
    }

    WORKSPACE {
        uuid id PK
        string name
        enum type
        datetime created_at
    }

    MEMBERSHIP {
        uuid id PK
        uuid user_id FK
        uuid workspace_id FK
        enum role
        datetime joined_at
    }

    INVITATION {
        uuid id PK
        uuid workspace_id FK
        uuid invited_by FK
        string email
        string token_hash
        enum status
        datetime expires_at
        datetime created_at
    }

    PROJECT {
        uuid id PK
        uuid workspace_id FK
        string name
        text description
        enum status
        date start_date
        date due_date
        datetime created_at
    }

    TASK {
        uuid id PK
        uuid project_id FK
        uuid assigned_to FK
        string title
        text description
        enum priority
        enum status
        integer progress
        date start_date
        date due_date
        datetime created_at
    }

    SUBTASK {
        uuid id PK
        uuid task_id FK
        string title
        boolean completed
        datetime created_at
    }

    COMMENT {
        uuid id PK
        uuid task_id FK
        uuid user_id FK
        text body
        datetime created_at
    }

    ACTIVITY {
        uuid id PK
        uuid task_id FK
        uuid user_id FK
        string action
        text details
        datetime created_at
    }
```

### Important data rules

1. One account maps to exactly one workspace in the MVP.
2. A user cannot belong to multiple Team workspaces.
3. A Team workspace has one Team Head.
4. Team membership is limited to 2–5 total people.
5. Subtasks have one level only; subtasks cannot contain subtasks.
6. Completed task history retains the historical assignee.
7. Open tasks of a removed member must be reassigned or explicitly left unassigned.
8. Clients have no user records or workspace membership.

---

## 6. Task Lifecycle

```mermaid
stateDiagram-v2
    [*] --> NOT_STARTED

    NOT_STARTED --> IN_PROGRESS
    IN_PROGRESS --> IN_REVIEW
    IN_REVIEW --> COMPLETED

    IN_REVIEW --> IN_PROGRESS
    IN_PROGRESS --> NOT_STARTED

    COMPLETED --> [*]
```

Task health is separate from task status.

```mermaid
flowchart TD
    START[Task Health Evaluation] --> DEADLINE{Has due date?}

    DEADLINE -->|No| TRACK[On Track]
    DEADLINE -->|Yes| EXPIRED{Due date passed?}

    EXPIRED -->|Yes and not Completed| DELAYED[Delayed]
    EXPIRED -->|No| RISK{Timeline >= 70% elapsed<br/>and progress is meaningfully behind?}

    RISK -->|Yes| ATRISK[At Risk]
    RISK -->|No| TRACK
```

### MVP health rules

- Due date passed and status is not Completed → **Delayed**
- No due date → **On Track**
- No start date → use task creation date as fallback
- 70% or more of the timeline elapsed and progress is more than 20 percentage points behind elapsed time → **At Risk**
- Otherwise → **On Track**

---

## 7. Progress Architecture

```mermaid
flowchart TD
    TASK[Task] --> SUB{Has Subtasks?}

    SUB -->|Yes| AUTO[Calculate Progress from Completed Subtasks]
    SUB -->|No| MANUAL[Use Manual Task Progress]

    AUTO --> TASKPROGRESS[Task Progress]
    MANUAL --> TASKPROGRESS

    TASKPROGRESS --> PROJECT[Aggregate Task Progress]
    PROJECT --> PROJECTPROGRESS[Project Progress]
    PROJECTPROGRESS --> DASHBOARD[Dashboard]
```

### Progress precedence

- A task with subtasks uses automatically calculated progress.
- A task without subtasks uses manually entered progress.
- Project progress is an aggregate of task progress.
- Manual project-level override is not supported in the MVP.

---

## 8. Team Invitation Architecture

```mermaid
sequenceDiagram
    actor Head as Team Head
    participant Web as Web App
    participant API as Application API
    participant DB as Database
    participant Email as Email Service
    actor Member as Invited Person

    Head->>Web: Enter member email
    Web->>API: Create invitation
    API->>DB: Validate team capacity
    DB-->>API: Capacity available
    API->>DB: Store invitation/token
    API->>Email: Send invitation email
    Email-->>Member: Invitation email

    Member->>Web: Open invitation
    Web->>API: Validate invitation token
    API->>DB: Check token/team/expiry

    alt Existing account
        API-->>Web: Request login
        Member->>Web: Login
    else New account
        API-->>Web: Request registration
        Member->>Web: Create account
    end

    Web->>API: Accept invitation
    API->>DB: Create membership
    API-->>Member: Team joined
```

---

## 9. Member Removal and Task Reassignment

```mermaid
flowchart TD
    HEAD[Team Head] --> REMOVE[Remove Member]
    REMOVE --> TASKS{Does member have open tasks?}

    TASKS -->|No| DELETE[Remove Membership]
    TASKS -->|Yes| REVIEW[Show Open Tasks]

    REVIEW --> DECIDE{Choose action}

    DECIDE -->|Reassign| MEMBER[Select another Team Member]
    MEMBER --> REASSIGN[Reassign Tasks]
    REASSIGN --> DELETE

    DECIDE -->|Leave Unassigned| UNASSIGNED[Tasks become Unassigned]
    UNASSIGNED --> DELETE

    DELETE --> HISTORY[Preserve completed-task history]
```

---

## 10. Team Head Continuity

```mermaid
flowchart TD
    HEAD[Current Team Head] --> ACTION{Wants to leave/delete?}

    ACTION --> TRANSFER[Transfer Team Head role]
    TRANSFER --> MEMBER[Existing Team Member]
    MEMBER --> NEWHEAD[New Team Head]

    NEWHEAD --> CONTINUE[Team continues]

    ACTION --> SUPPORT[Exceptional account termination]
    SUPPORT --> REASSIGN[Admin/Support ownership reassignment]
    REASSIGN --> CONTINUE
```

The system must never intentionally leave a Team workspace without a Team Head.

---

## 11. Dashboard Data Flow

```mermaid
flowchart LR
    DB[(Database)]

    DB --> TASKS[Tasks]
    DB --> PROJECTS[Projects]
    DB --> MEMBERS[Members]
    DB --> ACTIVITIES[Activity]

    TASKS --> STATUS[Status Aggregation]
    TASKS --> PROGRESS[Progress Aggregation]
    TASKS --> HEALTH[Health Calculation]
    TASKS --> DEADLINES[Deadline Classification]

    PROJECTS --> PROJECTVIEW[Project Overview]
    MEMBERS --> TEAMVIEW[Team Overview]
    ACTIVITIES --> ACTIVITYVIEW[Recent Activity]

    STATUS --> DASH[Dashboard]
    PROGRESS --> DASH
    HEALTH --> DASH
    DEADLINES --> DASH
    PROJECTVIEW --> DASH
    TEAMVIEW --> DASH
    ACTIVITYVIEW --> DASH
```

---

## 12. Authorization Model

```mermaid
flowchart TD
    REQUEST[Authenticated Request] --> AUTH{Authenticated?}

    AUTH -->|No| DENY[Reject Request]
    AUTH -->|Yes| WORKSPACE{Correct Workspace?}

    WORKSPACE -->|No| DENY
    WORKSPACE -->|Yes| ROLE{User Role}

    ROLE -->|Solo Owner| SOLOPERMS[Owner Permissions]
    ROLE -->|Team Head| HEADPERMS[Administrative + Work Permissions]
    ROLE -->|Team Member| MEMBERPERMS[Work Permissions]

    SOLOPERMS --> ALLOW[Allow]
    HEADPERMS --> ALLOW
    MEMBERPERMS --> ALLOW

    CLIENT[Client] --> DENY
```

Authorization must be enforced on the server/API layer, not only through UI visibility.

---

## 13. Suggested Frontend Structure

```text
src/
├── auth/
│   ├── signup
│   ├── login
│   └── invitation
│
├── workspace/
│   ├── workspace-selection
│   ├── solo
│   └── team
│
├── dashboard/
│
├── projects/
│   ├── project-list
│   ├── project-detail
│   └── project-form
│
├── tasks/
│   ├── task-list
│   ├── task-detail
│   ├── task-form
│   └── subtasks
│
├── team/
│   ├── members
│   ├── invitations
│   └── settings
│
└── shared/
    ├── components
    ├── layouts
    └── utilities
```

This is a conceptual structure; the eventual framework may change it.

---

## 14. Suggested Backend Modules

```text
backend/
├── auth
├── users
├── workspaces
├── memberships
├── invitations
├── projects
├── tasks
├── subtasks
├── comments
├── activities
├── progress
├── task-health
└── dashboard
```

Each module should enforce workspace boundaries and role permissions.

---

## 15. Phase-to-Architecture Mapping

| Phase | Main Architectural Components |
|---|---|
| Phase 1 | Authentication, Users, Database foundation |
| Phase 2 | Workspaces, Memberships, Roles, Invitations |
| Phase 3 | Projects |
| Phase 4 | Tasks, Subtasks, Comments, Activities |
| Phase 5 | Progress, Deadline Classification, Task Health |
| Phase 6 | Dashboard, Collaboration, Responsive UI |
| Phase 7 | Testing, Security, Performance, Deployment |

---

## 16. Architecture Scope Boundaries

The architecture must preserve these constraints:

- No client authentication
- No client authorization
- No client dashboard
- No client workspace membership
- Solo or Team workspace selection at signup
- One workspace per account in MVP
- Team Head automatically assigned
- 2–5 total team members
- Email-only invitations in MVP
- Single-level subtasks
- Explicit task reassignment when members are removed
- Team Head continuity
- Separate task status and task health
- Explicit progress precedence rules
- Lightweight architecture suitable for small teams
