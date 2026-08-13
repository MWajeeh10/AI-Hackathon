/* ==========================================================================
   Orbit Application Core Logic — Interactive Simulator
   ========================================================================== */

// ==========================================================================
// 0. Toast Notification System
// ==========================================================================
function showToast(message, type = 'info', duration = 4000) {
    // Remove any existing toast of the same type
    const existing = document.querySelector(`.orbit-toast.${type}`);
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `orbit-toast ${type}`;

    const icons = { success: '✓', warning: '⚠', error: '✕', info: 'ℹ' };
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || 'ℹ'}</span>
        <span class="toast-msg">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => toast.classList.add('visible'));

    // Auto-dismiss
    if (duration > 0) {
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 400);
        }, duration);
    }
    return toast;
}

// Persistent offline banner (stays until backend reconnects)
let offlineBanner = null;
function showOfflineBanner() {
    if (offlineBanner) return;
    offlineBanner = showToast(
        'Backend offline — changes saved locally only. Restart the server to sync.',
        'warning',
        0  // persistent
    );
}
function hideOfflineBanner() {
    if (offlineBanner) {
        offlineBanner.classList.remove('visible');
        setTimeout(() => { if (offlineBanner) { offlineBanner.remove(); offlineBanner = null; } }, 400);
    }
}

// ==========================================================================
// 1. Authentication Gate
// ==========================================================================

// Get stored JWT token
function getToken() {
    return localStorage.getItem('orbit_token');
}

// Build Authorization header for API calls
function getAuthHeaders() {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
}

// Handle 401 responses — clear token and redirect to login
function handleAuthError() {
    localStorage.removeItem('orbit_token');
    localStorage.removeItem('orbit_user');
    localStorage.removeItem('orbit_workspace_state');
    showToast('Session expired. Please sign in again.', 'warning', 2500);
    setTimeout(() => { window.location.href = '/login.html'; }, 1500);
}

// Logout handler — called by header button
window.handleLogout = function() {
    localStorage.removeItem('orbit_token');
    localStorage.removeItem('orbit_user');
    localStorage.removeItem('orbit_workspace_state');
    window.location.href = '/login.html';
};

// Auth gate — redirect to login if no valid token
(function checkAuth() {
    const token = getToken();
    if (!token) {
        window.location.href = '/login.html';
        return;
    }
    // Check token expiry by decoding payload (client-side only, server verifies on every API call)
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
            localStorage.removeItem('orbit_token');
            window.location.href = '/login.html';
        }
    } catch (e) {
        localStorage.removeItem('orbit_token');
        window.location.href = '/login.html';
    }
})();

// 1. Initial State Database (Mock DB in memory, syncs to localStorage for persistence)
const DEFAULT_STATE = {
    user: {
        name: "Alex Carter",
        email: "alex@example.com",
        loggedIn: true
    },
    workspace: {
        name: "Acme Studio",
        type: "team", // "solo" or "team"
        created: "2026-08-10"
    },
    members: [
        { id: "u-1", name: "Alex Carter", email: "alex@example.com", role: "team_head" },
        { id: "u-2", name: "Sarah Connor", email: "sarah@example.com", role: "team_member" },
        { id: "u-3", name: "John Doe", email: "john@example.com", role: "team_member" }
    ],
    invitations: [
        { id: "i-1", email: "designer@example.com", status: "pending", expires: "2026-08-20" }
    ],
    projects: [
        { id: "p-1", name: "Website Rebranding", description: "Design and implement the new corporate branding online.", status: "active", start: "2026-08-01", due: "2026-08-20" },
        { id: "p-2", name: "Mobile Application", description: "Build the iOS/Android client portal.", status: "active", start: "2026-08-05", due: "2026-08-30" }
    ],
    tasks: [
        {
            id: "t-1",
            projectId: "p-1",
            assignedTo: "u-2",
            title: "Design main branding illustrations",
            description: "Create pastel vector illustrations for the home page header area.",
            priority: "high",
            status: "in_progress",
            progress: 50, // overridden by subtasks
            start: "2026-08-01",
            due: "2026-08-15"
        },
        {
            id: "t-2",
            projectId: "p-1",
            assignedTo: "u-3",
            title: "Write styleguide documentation",
            description: "Format color palettes, typography specs, and button classes.",
            priority: "low",
            status: "not_started",
            progress: 0,
            start: "2026-08-10",
            due: "2026-08-18"
        },
        {
            id: "t-3",
            projectId: "p-2",
            assignedTo: "u-2",
            title: "Setup API Integration layers",
            description: "Connect endpoint handlers to user session authentications.",
            priority: "medium",
            status: "in_progress",
            progress: 30, // manual progress
            start: "2026-08-06",
            due: "2026-08-28"
        },
        {
            id: "t-4",
            projectId: "p-1",
            assignedTo: "u-1",
            title: "Deliver core logo vectors",
            description: "Export high-resolution variations for light/dark platforms.",
            priority: "high",
            status: "completed",
            progress: 100,
            start: "2026-08-01",
            due: "2026-08-10"
        }
    ],
    subtasks: [
        { id: "s-1", taskId: "t-1", title: "Sketch layouts on paper", completed: true },
        { id: "s-2", taskId: "t-1", title: "Trace illustrations in vector tool", completed: false }
    ],
    comments: [
        { id: "c-1", taskId: "t-1", userId: "u-2", body: "Illustrations are looking great, need copy refinement.", time: "2026-08-12T14:30:00Z" }
    ],
    activities: [
        { id: "a-1", taskId: "t-1", userId: "u-2", action: "created", details: "created the task illustration asset.", time: "2026-08-10T10:00:00Z" },
        { id: "a-2", taskId: "t-1", userId: "u-2", action: "subtask_completed", details: "marked sketch layout completed.", time: "2026-08-11T12:00:00Z" }
    ]
};

// Retrieve state or initialize
let state = JSON.parse(localStorage.getItem("orbit_workspace_state")) || DEFAULT_STATE;

// Debounce timer for backend saves — prevents excessive writes on rapid interactions
let _saveDebounceTimer = null;

function saveState() {
    // Always save to localStorage immediately (instant offline fallback)
    localStorage.setItem("orbit_workspace_state", JSON.stringify(state));

    // Debounce the backend sync — only write to db.json after 600ms of inactivity
    clearTimeout(_saveDebounceTimer);
    _saveDebounceTimer = setTimeout(() => {
        syncStateToBackend();
    }, 600);
}

function syncStateToBackend() {
    fetch('/api/state', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(state)
    })
    .then(res => {
        if (res.status === 401) { handleAuthError(); return; }
        if (!res.ok) {
            return res.json().then(err => { throw new Error(err.message || 'Save failed'); });
        }
        return res.json();
    })
    .then(data => {
        if (data) hideOfflineBanner(); // Backend responded — hide offline banner
    })
    .catch(err => {
        console.warn('Backend sync failed:', err.message);
        showOfflineBanner();
    });
}

// Active UI helpers
let selectedTaskId = null; // currently active task in drawer
let memberToRemoveId = null; // temporary store for dynamic removals

// System Date Simulator (Default: Aug 13, 2026)
let simulatedToday = new Date("2026-08-13");

// ==========================================================================
// 2. Health Calculation Engine (Phase 5 specifications)
// ==========================================================================
function calculateTaskHealth(task, todayDate) {
    if (task.status === "completed") {
        return "ontrack";
    }
    
    if (!task.due) {
        return "ontrack";
    }

    const due = new Date(task.due);
    const today = todayDate ? new Date(todayDate) : simulatedToday;

    // Rule 1: Due date passed and not completed -> Delayed
    if (today > due) {
        return "delayed";
    }

    // Use creation fallback if no start date
    const start = task.start ? new Date(task.start) : new Date(state.workspace.created);
    
    // Total duration and elapsed duration in milliseconds
    const totalDuration = due - start;
    const elapsedDuration = today - start;

    if (totalDuration <= 0) return "ontrack";

    const elapsedRatio = elapsedDuration / totalDuration;
    const progressRatio = getTaskProgress(task.id) / 100;

    // Rule 2: 70% or more of timeline elapsed AND progress is > 20 points behind elapsed time -> At Risk
    if (elapsedRatio >= 0.7 && progressRatio < (elapsedRatio - 0.2)) {
        return "atrisk";
    }

    return "ontrack";
}

// Get progress considering subtasks precedence rule (Phase 4 specs)
function getTaskProgress(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return 0;

    const taskSubtasks = state.subtasks.filter(s => s.taskId === taskId);
    if (taskSubtasks.length > 0) {
        const completed = taskSubtasks.filter(s => s.completed).length;
        return Math.round((completed / taskSubtasks.length) * 100);
    }
    
    return parseInt(task.progress || 0);
}

// Get dynamic project progress (Phase 3 specs)
function getProjectProgress(projectId) {
    const projTasks = state.tasks.filter(t => t.projectId === projectId);
    if (projTasks.length === 0) return 0;
    
    const sum = projTasks.reduce((acc, t) => acc + getTaskProgress(t.id), 0);
    return Math.round(sum / projTasks.length);
}

// ==========================================================================
// 3. Navigation & App Router
// ==========================================================================
document.querySelectorAll(".phase-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const phase = btn.dataset.phase;
        
        // Toggle Nav Buttons
        document.querySelectorAll(".phase-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        
        // Swap Views
        document.querySelectorAll(".phase-view").forEach(view => view.classList.remove("active"));
        document.getElementById(`view-phase-${phase}`).classList.add("active");

        // Execute view-specific initializations
        initPhaseView(phase);
    });
});

function initPhaseView(phase) {
    updateWorkspaceHeaderBadge();
    switch (phase) {
        case "1":
            loadPhase1Data();
            break;
        case "2":
            renderTeamRoster();
            break;
        case "3":
            renderProjectsList();
            break;
        case "4":
            renderTaskBoard();
            break;
        case "5":
            initHealthSandbox();
            break;
        case "6":
            renderDashboard();
            break;
    }
}

function updateWorkspaceHeaderBadge() {
    const badge = document.getElementById("current-ws-badge");
    const avatar = document.getElementById("header-avatar");
    
    if (state.workspace.type === "solo") {
        badge.textContent = "Solo Workspace";
        badge.style.background = "var(--accent-light)";
        badge.style.color = "var(--accent)";
    } else {
        badge.textContent = "Team Workspace";
        badge.style.background = "var(--info-light)";
        badge.style.color = "var(--info)";
    }
    
    avatar.textContent = state.user.name.charAt(0).toUpperCase();
}

// ==========================================================================
// 4. Phase-Specific Rendering & Interactivity
// ==========================================================================

// --- PHASE 1: ONBOARDING ---
function loadPhase1Data() {
    document.getElementById("reg-name").value = state.user.name;
    document.getElementById("reg-email").value = state.user.email;
    
    const options = document.querySelectorAll(".ws-opt");
    options.forEach(opt => {
        opt.classList.remove("active");
        if (opt.dataset.type === state.workspace.type) {
            opt.classList.add("active");
        }
        
        opt.onclick = () => {
            options.forEach(o => o.classList.remove("active"));
            opt.classList.add("active");
        };
    });
}

document.getElementById("onboarding-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("reg-name").value;
    const email = document.getElementById("reg-email").value;
    const type = document.querySelector(".ws-opt.active").dataset.type;
    
    // Save registration details
    state.user.name = name;
    state.user.email = email;
    
    const typeChanged = state.workspace.type !== type;
    state.workspace.type = type;
    
    if (type === "solo") {
        state.workspace.name = `${name}'s Workspace`;
        state.members = [
            { id: "u-1", name: name, email: email, role: "solo_owner" }
        ];
        state.invitations = [];
    } else {
        if (typeChanged) {
            state.workspace.name = "Acme Team Workspace";
            state.members = [
                { id: "u-1", name: name, email: email, role: "team_head" },
                { id: "u-2", name: "Sarah Connor", email: "sarah@example.com", role: "team_member" },
                { id: "u-3", name: "John Doe", email: "john@example.com", role: "team_member" }
            ];
            state.invitations = [
                { id: "i-1", email: "designer@example.com", status: "pending", expires: "2026-08-20" }
            ];
        } else {
            // Keep head updated
            const head = state.members.find(m => m.role === "team_head" || m.role === "solo_owner");
            if (head) {
                head.name = name;
                head.email = email;
                head.role = "team_head";
            }
        }
    }
    
    saveState();
    updateWorkspaceHeaderBadge();
    
    // Transition to Phase 2
    document.querySelector('.phase-btn[data-phase="2"]').click();
});


// --- PHASE 2: TEAM MANAGEMENT ---
function renderTeamRoster() {
    const banner = document.getElementById("solo-warning-banner");
    const content = document.getElementById("team-content-area");
    
    if (state.workspace.type === "solo") {
        banner.style.display = "block";
        content.style.display = "none";
        return;
    }
    
    banner.style.display = "none";
    content.style.display = "grid";
    
    // Capacity Calculations (members + pending invites)
    const activeCount = state.members.length;
    const pendingCount = state.invitations.filter(i => i.status === "pending").length;
    const totalOccupancy = activeCount + pendingCount;
    
    document.getElementById("capacity-text").textContent = `${totalOccupancy} / 5 Slots`;
    document.getElementById("capacity-fill-bar").style.width = `${(totalOccupancy / 5) * 100}%`;
    
    const rosterContainer = document.getElementById("roster-container");
    rosterContainer.innerHTML = "";
    
    // Render Active Members
    state.members.forEach(member => {
        const item = document.createElement("div");
        item.className = "roster-item";
        
        const isHead = member.role === "team_head";
        const isCurrentUser = member.email === state.user.email;
        
        item.innerHTML = `
            <div class="roster-info">
                <div class="roster-avatar ${isHead ? 'head' : ''}">
                    ${member.name.charAt(0).toUpperCase()}
                </div>
                <div class="roster-details">
                    <h4>${member.name} ${isCurrentUser ? '(You)' : ''}</h4>
                    <span>${member.email}</span>
                </div>
            </div>
            <div class="roster-actions">
                <span class="badge-role ${isHead ? 'head' : 'member'}">${isHead ? 'Team Head' : 'Member'}</span>
                ${(!isHead && isCurrentUser === false) ? `
                    <button class="btn-remove-member" onclick="triggerMemberRemoval('${member.id}')">×</button>
                ` : ''}
            </div>
        `;
        rosterContainer.appendChild(item);
    });
    
    // Render Pending Invites
    state.invitations.forEach(invite => {
        const item = document.createElement("div");
        item.className = "roster-item";
        item.innerHTML = `
            <div class="roster-info">
                <div class="roster-avatar invite">?</div>
                <div class="roster-details">
                    <h4>${invite.email}</h4>
                    <span>Pending Invite — Expires ${invite.expires}</span>
                </div>
            </div>
            <div class="roster-actions">
                <span class="badge-role pending">Pending</span>
                <button class="btn-cancel-invite" onclick="cancelInvitation('${invite.id}')">×</button>
            </div>
        `;
        rosterContainer.appendChild(item);
    });
}

// Add invite handler
document.getElementById("invite-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const emailInput = document.getElementById("invite-email");
    const email = emailInput.value.trim();
    const errorMsg = document.getElementById("invite-error-msg");
    errorMsg.textContent = "";
    
    const activeCount = state.members.length;
    const pendingCount = state.invitations.filter(i => i.status === "pending").length;
    
    // Enforce 5 total occupancy limit
    if (activeCount + pendingCount >= 5) {
        errorMsg.textContent = "Error: Team capacity limit reached (maximum 5 slots).";
        return;
    }
    
    // Check if email already in use
    const alreadyMember = state.members.some(m => m.email.toLowerCase() === email.toLowerCase());
    const alreadyInvited = state.invitations.some(i => i.email.toLowerCase() === email.toLowerCase() && i.status === 'pending');
    
    if (alreadyMember || alreadyInvited) {
        errorMsg.textContent = "Error: User is already a member or has a pending invite.";
        return;
    }
    
    // Create invite
    const newInvite = {
        id: "i-" + Date.now(),
        email: email,
        status: "pending",
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    
    state.invitations.push(newInvite);
    
    // Log Activity
    logSystemActivity(null, `Invited ${email} to join the workspace.`);
    
    saveState();
    emailInput.value = "";
    renderTeamRoster();
});

function cancelInvitation(inviteId) {
    const invite = state.invitations.find(i => i.id === inviteId);
    state.invitations = state.invitations.filter(i => i.id !== inviteId);
    if (invite) {
        logSystemActivity(null, `Cancelled invitation for ${invite.email}`);
    }
    saveState();
    renderTeamRoster();
}

// Member Removal with explicit task reassignment check
window.triggerMemberRemoval = function(memberId) {
    const member = state.members.find(m => m.id === memberId);
    if (!member) return;
    
    memberToRemoveId = memberId;
    
    // Check for open tasks
    const openTasks = state.tasks.filter(t => t.assignedTo === memberId && t.status !== "completed");
    
    if (openTasks.length > 0) {
        document.getElementById("departing-member-name").textContent = member.name;
        const reassignList = document.getElementById("reassign-task-list");
        reassignList.innerHTML = "";
        
        // Render each open task with a dropdown selection
        openTasks.forEach(task => {
            const row = document.createElement("div");
            row.className = "reassign-row";
            
            // Build option list of other members
            let optionsHTML = `<option value="unassigned">Leave Unassigned</option>`;
            state.members.forEach(other => {
                if (other.id !== memberId) {
                    optionsHTML += `<option value="${other.id}">Reassign to ${other.name}</option>`;
                }
            });
            
            row.innerHTML = `
                <span>${task.title}</span>
                <select class="reassign-select" data-task-id="${task.id}">
                    ${optionsHTML}
                </select>
            `;
            reassignList.appendChild(row);
        });
        
        document.getElementById("reassign-overlay").classList.add("active");
    } else {
        // No open tasks, remove immediately
        completeMemberRemoval();
    }
};

document.getElementById("cancel-removal-btn").addEventListener("click", () => {
    document.getElementById("reassign-overlay").classList.remove("active");
    memberToRemoveId = null;
});

document.getElementById("confirm-removal-btn").addEventListener("click", () => {
    const selects = document.querySelectorAll(".reassign-select");
    
    selects.forEach(sel => {
        const taskId = sel.dataset.taskId;
        const newAssignee = sel.value;
        const task = state.tasks.find(t => t.id === taskId);
        
        if (task) {
            task.assignedTo = newAssignee === "unassigned" ? null : newAssignee;
            logSystemActivity(taskId, `Task reassigned to ${newAssignee === 'unassigned' ? 'unassigned' : state.members.find(m => m.id === newAssignee).name} due to member departure.`);
        }
    });
    
    completeMemberRemoval();
    document.getElementById("reassign-overlay").classList.remove("active");
});

function completeMemberRemoval() {
    if (!memberToRemoveId) return;
    const member = state.members.find(m => m.id === memberToRemoveId);
    
    // Filter out member
    state.members = state.members.filter(m => m.id !== memberToRemoveId);
    
    if (member) {
        logSystemActivity(null, `Removed member ${member.name} from workspace.`);
    }
    
    memberToRemoveId = null;
    saveState();
    renderTeamRoster();
}


// --- PHASE 3: PROJECTS ---
function renderProjectsList() {
    const container = document.getElementById("projects-deck-container");
    container.innerHTML = "";

    if (state.projects.length === 0) {
        container.innerHTML = `<div class="empty-state"><span class="empty-icon">📂</span><p>No projects yet. Create your first project to get started.</p></div>`;
        return;
    }
    
    state.projects.forEach(project => {
        const progress = getProjectProgress(project.id);
        const isArchived = project.status === 'archived';
        const card = document.createElement("div");
        card.className = `project-card ${isArchived ? 'archived' : ''}`;
        
        // Calculate circle path metrics
        const strokeDashOffset = 100 - progress;
        const taskCount = state.tasks.filter(t => t.projectId === project.id).length;
        
        card.innerHTML = `
            <div class="proj-top">
                <div class="proj-header-row">
                    <h3>${project.name}</h3>
                    <div class="proj-actions">
                        ${!isArchived ? `
                            <button class="btn-proj-action archive" title="Archive project"
                                onclick="archiveProject('${project.id}', event)">Archive</button>
                        ` : `
                            <button class="btn-proj-action unarchive" title="Restore project"
                                onclick="unarchiveProject('${project.id}', event)">Restore</button>
                        `}
                    </div>
                </div>
                <p>${project.description || 'No description provided.'}</p>
                ${isArchived ? '<span class="archived-badge">Archived</span>' : ''}
            </div>
            <div class="proj-bottom">
                <div class="proj-dates">
                    <div>Start: ${project.start || 'TBD'}</div>
                    <div>Due: ${project.due || 'TBD'}</div>
                    <div class="proj-task-count">${taskCount} task${taskCount !== 1 ? 's' : ''}</div>
                </div>
                <div class="proj-progress-ring">
                    <svg class="progress-circle" width="48" height="48" viewBox="0 0 36 36">
                        <path class="progress-circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path class="progress-circle-fill" stroke-dasharray="100, 100" style="stroke-dashoffset: ${strokeDashOffset};" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <div class="progress-ring-text">${progress}%</div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Archive / Restore project actions
window.archiveProject = function(projectId, event) {
    event.stopPropagation();
    const project = state.projects.find(p => p.id === projectId);
    if (!project) return;
    project.status = 'archived';
    logSystemActivity(null, `Archived project "${project.name}"`);
    saveState();
    renderProjectsList();
    showToast(`Project "${project.name}" archived.`, 'success');
};

window.unarchiveProject = function(projectId, event) {
    event.stopPropagation();
    const project = state.projects.find(p => p.id === projectId);
    if (!project) return;
    project.status = 'active';
    logSystemActivity(null, `Restored project "${project.name}"`);
    saveState();
    renderProjectsList();
    showToast(`Project "${project.name}" restored.`, 'success');
};

// Modal open/close listeners for Project creation
document.getElementById("open-new-project-modal").addEventListener("click", () => {
    document.getElementById("project-modal").classList.add("active");
});

document.getElementById("close-project-modal").addEventListener("click", () => {
    document.getElementById("project-modal").classList.remove("active");
});

document.getElementById("project-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("proj-name").value;
    const desc = document.getElementById("proj-desc").value;
    const start = document.getElementById("proj-start").value;
    const due = document.getElementById("proj-due").value;
    
    const newProj = {
        id: "p-" + Date.now(),
        name: name,
        description: desc,
        status: "active",
        start: start || null,
        due: due || null
    };
    
    state.projects.push(newProj);
    logSystemActivity(null, `Created project "${name}"`);
    saveState();
    
    document.getElementById("project-modal").classList.remove("active");
    document.getElementById("project-form").reset();
    renderProjectsList();
});


// --- PHASE 4: TASKS & SUBTASKS ---
function renderTaskBoard() {
    const listIds = ["not_started", "in_progress", "in_review", "completed"];
    
    // Reset lists and counts
    listIds.forEach(id => {
        document.getElementById(`list-${id}`).innerHTML = "";
        document.getElementById(`count-${id}`).textContent = "0";
    });
    
    // Group tasks and append
    state.tasks.forEach(task => {
        const card = document.createElement("div");
        card.className = "task-card";
        card.onclick = () => openTaskDetailDrawer(task.id);
        
        const health = calculateTaskHealth(task);
        const progress = getTaskProgress(task.id);
        const assignee = state.members.find(m => m.id === task.assignedTo);
        const assigneeInit = assignee ? assignee.name.charAt(0).toUpperCase() : "?";
        
        card.innerHTML = `
            <div class="task-card-header">
                <span class="badge-priority ${task.priority}">${task.priority}</span>
                <span class="task-health-dot ${health}"></span>
            </div>
            <h4>${task.title}</h4>
            <div class="task-progress-box">
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" style="width: ${progress}%;"></div>
                </div>
            </div>
            <div class="task-card-meta">
                <span class="task-card-dates">${task.due ? `Due ${task.due}` : 'No deadline'}</span>
                <span class="task-card-assignee" title="${assignee ? assignee.name : 'Unassigned'}">${assigneeInit}</span>
            </div>
        `;
        
        const columnList = document.getElementById(`list-${task.status}`);
        if (columnList) {
            columnList.appendChild(card);
            
            // Update counter
            const counter = document.getElementById(`count-${task.status}`);
            counter.textContent = parseInt(counter.textContent) + 1;
        }
    });
}

// Open / Close Task Creation Modal
document.getElementById("open-new-task-modal").addEventListener("click", () => {
    // Populate projects dropdown
    const projSel = document.getElementById("task-project");
    projSel.innerHTML = "";
    state.projects.forEach(p => {
        projSel.innerHTML += `<option value="${p.id}">${p.name}</option>`;
    });
    
    // Populate assignees dropdown
    const assSel = document.getElementById("task-assignee");
    assSel.innerHTML = `<option value="">Unassigned</option>`;
    state.members.forEach(m => {
        assSel.innerHTML += `<option value="${m.id}">${m.name}</option>`;
    });
    
    document.getElementById("task-modal").classList.add("active");
});

document.getElementById("close-task-modal").addEventListener("click", () => {
    document.getElementById("task-modal").classList.remove("active");
});

document.getElementById("task-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const projId = document.getElementById("task-project").value;
    const title = document.getElementById("task-title").value;
    const desc = document.getElementById("task-desc").value;
    const priority = document.getElementById("task-priority").value;
    const assignee = document.getElementById("task-assignee").value;
    const status = document.getElementById("task-status").value;
    const start = document.getElementById("task-start").value;
    const due = document.getElementById("task-due").value;
    
    const newTask = {
        id: "t-" + Date.now(),
        projectId: projId,
        assignedTo: assignee || null,
        title: title,
        description: desc,
        priority: priority,
        status: status,
        progress: 0,
        start: start || null,
        due: due || null
    };
    
    state.tasks.push(newTask);
    logSystemActivity(newTask.id, `Created task: "${title}"`);
    saveState();
    
    document.getElementById("task-modal").classList.remove("active");
    document.getElementById("task-form").reset();
    renderTaskBoard();
});

// Detail Panel Drawer controllers
function openTaskDetailDrawer(taskId) {
    selectedTaskId = taskId;
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const drawer = document.getElementById("task-detail-drawer");
    
    // Text contents
    document.getElementById("detail-task-title").textContent = task.title;
    document.getElementById("detail-task-desc").textContent = task.description || "No description provided.";
    
    const proj = state.projects.find(p => p.id === task.projectId);
    document.getElementById("detail-task-project").textContent = proj ? proj.name : "None";
    
    const assignee = state.members.find(m => m.id === task.assignedTo);
    document.getElementById("detail-task-assignee").textContent = assignee ? assignee.name : "Unassigned";
    
    document.getElementById("detail-task-dates").textContent = `${task.start || 'TBD'} — ${task.due || 'TBD'}`;
    
    // Status Select
    const statusSelect = document.getElementById("detail-change-status");
    statusSelect.value = task.status;
    
    // Priority badge style
    const priBadge = document.getElementById("detail-task-priority");
    priBadge.textContent = task.priority;
    priBadge.className = `badge-priority ${task.priority}`;
    
    // Render subtasks
    renderSubtasksList(taskId);
    renderCommentsList(taskId);
    
    drawer.classList.add("active");
}

document.getElementById("close-detail-drawer").addEventListener("click", () => {
    document.getElementById("task-detail-drawer").classList.remove("active");
    selectedTaskId = null;
    renderTaskBoard(); // refresh board state values
});

// Real-time status update from drawer dropdown
document.getElementById("detail-change-status").addEventListener("change", (e) => {
    if (!selectedTaskId) return;
    const task = state.tasks.find(t => t.id === selectedTaskId);
    if (task) {
        const oldStatus = task.status;
        task.status = e.target.value;
        
        // Log action
        logSystemActivity(task.id, `Status updated from ${oldStatus.replace('_', ' ')} to ${task.status.replace('_', ' ')}`);
        
        // Mark completion values if completed
        if (task.status === "completed") {
            task.progress = 100;
        } else if (oldStatus === "completed") {
            task.progress = 50; // reset back to something intermediate
        }
        
        saveState();
        renderSubtasksList(selectedTaskId); // refresh manual slider view
    }
});

function renderSubtasksList(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    const subContainer = document.getElementById("detail-subtask-container");
    subContainer.innerHTML = "";
    
    const taskSubtasks = state.subtasks.filter(s => s.taskId === taskId);
    const hasSubtasks = taskSubtasks.length > 0;
    
    const progress = getTaskProgress(taskId);
    document.getElementById("detail-progress-pct").textContent = `${progress}%`;
    document.getElementById("detail-progress-bar").style.width = `${progress}%`;
    
    const precPrompt = document.getElementById("detail-precedence-note");
    const manualBox = document.getElementById("detail-manual-progress-box");
    
    if (hasSubtasks) {
        // Enforce automatic progress calculation: show note, hide manual range
        precPrompt.style.display = "block";
        manualBox.style.display = "none";
        
        taskSubtasks.forEach(sub => {
            const item = document.createElement("div");
            item.className = "subtask-item";
            item.innerHTML = `
                <input type="checkbox" id="sub-${sub.id}" ${sub.completed ? 'checked' : ''} onchange="toggleSubtask('${sub.id}', ${taskId})">
                <label for="sub-${sub.id}">${sub.title}</label>
            `;
            subContainer.appendChild(item);
        });
    } else {
        // Enforce manual progress: hide note, show range slider
        precPrompt.style.display = "none";
        manualBox.style.display = "flex";
        
        const progressSlider = document.getElementById("detail-manual-progress-input");
        const progressValue = document.getElementById("detail-manual-progress-value");
        
        progressSlider.value = task.progress || 0;
        progressValue.textContent = `${task.progress || 0}%`;
        
        // Enable slider if not completed (completed tasks are locked to 100%)
        if (task.status === "completed") {
            progressSlider.disabled = true;
            progressSlider.value = 100;
            progressValue.textContent = "100% (Completed)";
        } else {
            progressSlider.disabled = false;
        }
    }
}

// Dynamic checklist completion toggle
window.toggleSubtask = function(subId, taskId) {
    const sub = state.subtasks.find(s => s.id === subId);
    if (sub) {
        sub.completed = !sub.completed;
        
        logSystemActivity(taskId, `${sub.completed ? 'Marked' : 'Unmarked'} checklist item "${sub.title}"`);
        
        saveState();
        renderSubtasksList(taskId);
    }
};

// Add subtask checklist item
document.getElementById("new-subtask-form").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!selectedTaskId) return;
    
    const input = document.getElementById("new-subtask-title");
    const title = input.value.trim();
    
    const newSub = {
        id: "s-" + Date.now(),
        taskId: selectedTaskId,
        title: title,
        completed: false
    };
    
    state.subtasks.push(newSub);
    logSystemActivity(selectedTaskId, `Added checklist item: "${title}"`);
    saveState();
    
    input.value = "";
    renderSubtasksList(selectedTaskId);
});

// Manual range slider tracker
document.getElementById("detail-manual-progress-input").addEventListener("input", (e) => {
    if (!selectedTaskId) return;
    const task = state.tasks.find(t => t.id === selectedTaskId);
    if (task) {
        task.progress = parseInt(e.target.value);
        document.getElementById("detail-manual-progress-value").textContent = `${task.progress}%`;
        
        // Update bar in real-time
        document.getElementById("detail-progress-pct").textContent = `${task.progress}%`;
        document.getElementById("detail-progress-bar").style.width = `${task.progress}%`;
        
        saveState();
    }
});

// Render comment feeds & logs
function renderCommentsList(taskId) {
    const container = document.getElementById("detail-comments-container");
    container.innerHTML = "";
    
    // Combine logs (activities) and comments together for a clean unified stream
    const taskComments = state.comments.filter(c => c.taskId === taskId).map(c => ({...c, type: 'comment'}));
    const taskLogs = state.activities.filter(a => a.taskId === taskId).map(a => ({...a, type: 'log'}));
    
    const stream = [...taskComments, ...taskLogs].sort((a,b) => new Date(a.time) - new Date(b.time));
    
    if (stream.length === 0) {
        container.innerHTML = `<div class="card-subtitle">No comment threads or updates logged yet.</div>`;
        return;
    }
    
    stream.forEach(item => {
        const el = document.createElement("div");
        const formattedTime = new Date(item.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        if (item.type === 'comment') {
            const author = state.members.find(m => m.id === item.userId) || { name: "System User" };
            el.className = "comment-card";
            el.innerHTML = `
                <div class="comment-card-meta">
                    <span class="comment-author">${author.name}</span>
                    <span class="comment-time">${formattedTime}</span>
                </div>
                <p>${item.body}</p>
            `;
        } else {
            const actor = state.members.find(m => m.id === item.userId) || { name: "System User" };
            el.className = "log-item";
            el.innerHTML = `
                <strong>${actor.name}</strong> ${item.details} <span class="comment-time">${formattedTime}</span>
            `;
        }
        container.appendChild(el);
    });
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

// Post comment handler
document.getElementById("task-comment-form").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!selectedTaskId) return;
    
    const input = document.getElementById("task-comment-body");
    const body = input.value.trim();
    
    const newComment = {
        id: "c-" + Date.now(),
        taskId: selectedTaskId,
        userId: "u-1", // mock current user
        body: body,
        time: new Date().toISOString()
    };
    
    state.comments.push(newComment);
    saveState();
    
    input.value = "";
    renderCommentsList(selectedTaskId);
});

// Core Activity Logging helper
function logSystemActivity(taskId, details) {
    const newAct = {
        id: "a-" + Date.now(),
        taskId: taskId,
        userId: "u-1",
        action: "update",
        details: details,
        time: new Date().toISOString()
    };
    state.activities.push(newAct);
}


// --- PHASE 5: HEALTH RULES SANDBOX ENGINE ---
function initHealthSandbox() {
    // Config default values in sandbox inputs
    document.getElementById("sb-start-date").value = "2026-08-01";
    document.getElementById("sb-due-date").value = "2026-08-20";
    
    // Calculate and render initially
    updateSandboxHealth();
}

// Add event listeners to sandbox inputs
document.getElementById("sb-task-name").addEventListener("input", updateSandboxHealth);
document.getElementById("sb-start-date").addEventListener("input", updateSandboxHealth);
document.getElementById("sb-due-date").addEventListener("input", updateSandboxHealth);
document.getElementById("sb-progress").addEventListener("input", (e) => {
    document.getElementById("sb-progress-value").textContent = `${e.target.value}%`;
    updateSandboxHealth();
});
document.getElementById("sb-current-date-slider").addEventListener("input", (e) => {
    // Convert slider (0 - 100) to actual simulator date relative to sandbox dates
    const startStr = document.getElementById("sb-start-date").value;
    const dueStr = document.getElementById("sb-due-date").value;
    
    if (!startStr || !dueStr) return;
    
    const start = new Date(startStr);
    const due = new Date(dueStr);
    const range = due - start;
    
    // Set simulated target date
    const targetTime = start.getTime() + (range * (e.target.value / 100));
    const targetDate = new Date(targetTime);
    
    document.getElementById("sb-current-date-value").textContent = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    updateSandboxHealth(targetDate);
});

function updateSandboxHealth(providedSimulatedDate) {
    const title = document.getElementById("sb-task-name").value;
    const startStr = document.getElementById("sb-start-date").value;
    const dueStr = document.getElementById("sb-due-date").value;
    const progress = parseInt(document.getElementById("sb-progress").value);
    
    if (!startStr || !dueStr) return;
    
    const start = new Date(startStr);
    const due = new Date(dueStr);
    const totalDays = Math.ceil((due - start) / (1000 * 60 * 60 * 24));
    
    // Retrieve target simulator date
    let targetDate = providedSimulatedDate;
    if (!targetDate) {
        // derive from current slider position
        const sliderVal = document.getElementById("sb-current-date-slider").value;
        const range = due - start;
        targetDate = new Date(start.getTime() + (range * (sliderVal / 100)));
        document.getElementById("sb-current-date-value").textContent = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    
    // Health logic calculations
    let health = "ontrack";
    let explanationText = "";
    
    const elapsedMs = targetDate - start;
    const totalMs = due - start;
    const elapsedRatio = totalMs > 0 ? (elapsedMs / totalMs) : 0;
    const progressRatio = progress / 100;
    
    if (targetDate > due) {
        health = "delayed";
        explanationText = `Task is overdue! The simulated current date (${targetDate.toLocaleDateString()}) has passed the due date (${due.toLocaleDateString()}) and the progress is incomplete.`;
    } else if (elapsedRatio >= 0.7 && progressRatio < (elapsedRatio - 0.2)) {
        health = "atrisk";
        explanationText = `Task is At Risk! More than 70% of the timeline has elapsed (${Math.round(elapsedRatio * 100)}%), but current progress (${progress}%) lags more than 20 percentage points behind scheduled progress.`;
    } else {
        health = "ontrack";
        explanationText = `Task is On Track. Time elapsed is ${Math.round(elapsedRatio * 100)}% and progress is ${progress}%, which falls within healthy margins.`;
    }
    
    // Render UI output
    const gauge = document.getElementById("sb-health-gauge");
    const gaugeText = document.getElementById("sb-health-text");
    
    gauge.className = "health-gauge";
    if (health === "ontrack") {
        gaugeText.textContent = "ON TRACK";
    } else if (health === "atrisk") {
        gauge.classList.add("at-risk");
        gaugeText.textContent = "AT RISK";
    } else {
        gauge.classList.add("delayed");
        gaugeText.textContent = "DELAYED";
    }
    
    document.getElementById("sb-elapsed-pct").textContent = `${Math.max(0, Math.round(elapsedRatio * 100))}%`;
    document.getElementById("sb-current-prog-display").textContent = `${progress}%`;
    
    const diffPct = Math.round((progressRatio - elapsedRatio) * 100);
    const marginStatus = document.getElementById("sb-margin-status");
    if (diffPct < 0) {
        marginStatus.textContent = `${Math.abs(diffPct)}% behind schedule`;
        marginStatus.style.color = "var(--danger)";
    } else {
        marginStatus.textContent = `${diffPct}% ahead of schedule`;
        marginStatus.style.color = "var(--success)";
    }
    
    document.getElementById("sb-rule-text").textContent = explanationText;
}


// --- PHASE 6: SUMMARY DASHBOARD ---
function renderDashboard() {
    // 1. Gather stats metrics
    let total = state.tasks.length;
    let completed = state.tasks.filter(t => t.status === "completed").length;
    let risk = 0;
    let delayed = 0;
    
    state.tasks.forEach(t => {
        const health = calculateTaskHealth(t);
        if (health === "atrisk") risk++;
        if (health === "delayed") delayed++;
    });
    
    document.getElementById("dash-stat-total").textContent = total;
    document.getElementById("dash-stat-completed").textContent = completed;
    document.getElementById("dash-stat-risk").textContent = risk;
    document.getElementById("dash-stat-delayed").textContent = delayed;
    
    document.getElementById("dashboard-welcome").textContent = `${state.user.name}'s Workspace`;
    
    // 2. Render Attention inbox list (Delayed or At Risk tasks)
    const attentionList = document.getElementById("dash-attention-list");
    attentionList.innerHTML = "";
    
    const urgentTasks = state.tasks.filter(t => {
        const health = calculateTaskHealth(t);
        return health === "atrisk" || health === "delayed";
    });
    
    if (urgentTasks.length === 0) {
        attentionList.innerHTML = `<div class="attention-item" style="border-left-color: var(--success); background: var(--success-light); color: var(--success)">
            <div class="attention-info">
                <h4>All work on track!</h4>
                <span>No active items require immediate action.</span>
            </div>
        </div>`;
    } else {
        urgentTasks.forEach(task => {
            const health = calculateTaskHealth(task);
            const item = document.createElement("div");
            item.className = `attention-item ${health}`;
            item.onclick = () => {
                // Redirect and open drawer
                document.querySelector('.phase-btn[data-phase="4"]').click();
                openTaskDetailDrawer(task.id);
            };
            item.innerHTML = `
                <div class="attention-info">
                    <h4>${task.title}</h4>
                    <span>Due: ${task.due || 'TBD'} • Progress: ${getTaskProgress(task.id)}%</span>
                </div>
                <span class="attention-tag ${health}">${health === 'atrisk' ? 'At Risk' : 'Overdue'}</span>
            `;
            attentionList.appendChild(item);
        });
    }
    
    // 3. Render Team Workload distribution bar graph
    const workloadContainer = document.getElementById("dash-workload-list");
    workloadContainer.innerHTML = "";
    
    if (state.workspace.type === "solo") {
        const totalSoloTasks = state.tasks.filter(t => t.status !== 'completed').length;
        workloadContainer.innerHTML = `
            <div class="workload-item">
                <div class="workload-meta">
                    <span class="workload-name">${state.user.name} (Solo Owner)</span>
                    <span class="workload-count">${totalSoloTasks} open tasks</span>
                </div>
                <div class="workload-bar-bg">
                    <div class="workload-bar-fill" style="width: 100%;"></div>
                </div>
            </div>
        `;
    } else {
        // Calculate max task load to scale bar width
        let maxLoad = 1;
        const distribution = state.members.map(member => {
            const openTasksCount = state.tasks.filter(t => t.assignedTo === member.id && t.status !== "completed").length;
            if (openTasksCount > maxLoad) maxLoad = openTasksCount;
            return { name: member.name, count: openTasksCount };
        });
        
        distribution.forEach(dist => {
            const pct = Math.round((dist.count / maxLoad) * 100);
            const item = document.createElement("div");
            item.className = "workload-item";
            item.innerHTML = `
                <div class="workload-meta">
                    <span class="workload-name">${dist.name}</span>
                    <span class="workload-count">${dist.count} active</span>
                </div>
                <div class="workload-bar-bg">
                    <div class="workload-bar-fill" style="width: ${pct}%;"></div>
                </div>
            </div>
            `;
            workloadContainer.appendChild(item);
        });
    }
    
    // 4. Render Project Summaries rows
    const projContainer = document.getElementById("dash-projects-list");
    projContainer.innerHTML = "";
    
    state.projects.forEach(proj => {
        const progress = getProjectProgress(proj.id);
        const row = document.createElement("div");
        row.className = "dash-project-row";
        row.innerHTML = `
            <div class="dash-project-info">
                <h4>${proj.name}</h4>
                <p>Due date: ${proj.due || 'TBD'}</p>
            </div>
            <div class="dash-project-progress">
                <div class="dash-project-bar-bg">
                    <div class="dash-project-bar-fill" style="width: ${progress}%;"></div>
                </div>
                <span class="dash-project-pct">${progress}%</span>
            </div>
        `;
        projContainer.appendChild(row);
    });
    
    // 5. Render Activity feed (last 5)
    const feedContainer = document.getElementById("dash-activity-feed");
    feedContainer.innerHTML = "";
    
    const lastActivities = [...state.activities]
        .sort((a,b) => new Date(b.time) - new Date(a.time))
        .slice(0, 5);
        
    lastActivities.forEach(act => {
        const item = document.createElement("div");
        item.className = "activity-feed-item";
        
        const member = state.members.find(m => m.id === act.userId) || { name: "Workspace User" };
        const timeFormatted = new Date(act.time).toLocaleDateString([], { month: 'short', day: 'numeric' }) + " " + new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        item.innerHTML = `
            <strong>${member.name}</strong> ${act.details}
            <span class="activity-time">${timeFormatted}</span>
        `;
        feedContainer.appendChild(item);
    });
}

// Smart routing — determines the best starting phase based on workspace state
// Phase 1 (Onboarding) is skipped for all authenticated users.
// Team users without teammates → Phase 2 (Team & Invites)
// Everyone else → Phase 3 (Projects)
function getInitialPhase(wsState) {
    const type = wsState?.workspace?.type;
    const memberCount = (wsState?.members || []).length;
    const projectCount = (wsState?.projects || []).length;

    // Team workspace with only the owner → prompt to invite team
    if (type === 'team' && memberCount <= 1) {
        return '2';
    }
    // Has projects → go straight to projects board
    if (projectCount > 0) {
        return '3';
    }
    // Default: projects page (shows empty state with "Create project" CTA)
    return '3';
}

// Sync with backend API on boot
async function syncWithBackend() {
    let backendAvailable = false;

    try {
        const healthRes = await fetch('/api/health', { signal: AbortSignal.timeout(3000) });
        backendAvailable = healthRes.ok;
    } catch (e) {
        backendAvailable = false;
    }

    if (backendAvailable) {
        try {
            const res = await fetch('/api/state', { headers: getAuthHeaders() });
            if (res.status === 401) {
                handleAuthError();
                return;
            }
            if (res.ok) {
                const serverState = await res.json();
                state = serverState;
                localStorage.setItem('orbit_workspace_state', JSON.stringify(state));
                console.log('✅ State synced from backend database.');
            } else {
                console.warn('Backend returned non-OK. Using localStorage fallback.');
                showToast('Could not load from server. Using local data.', 'warning');
            }
        } catch (e) {
            console.warn('State fetch failed:', e.message);
            showToast('Could not load from server. Using local data.', 'warning');
        }
    } else {
        console.warn('⚠️ Backend not reachable. Running in offline mode.');
        showOfflineBanner();
    }

    // Route to the appropriate starting phase — skip Phase 1 for all auth'd users
    const startPhase = getInitialPhase(state);
    initPhaseView(startPhase);
    updateWorkspaceHeaderBadge();
}

syncWithBackend();
