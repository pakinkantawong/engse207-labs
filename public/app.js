const API = '/api/tasks';

document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    document.getElementById('addTaskForm').addEventListener('submit', handleAddTask);
});

async function handleAddTask(e) {
    e.preventDefault();
    const task = {
        title: document.getElementById('title').value.trim(),
        description: document.getElementById('description').value.trim(),
        status: document.getElementById('status').value
    };

    if (!task.title) {
        showMessage('Please enter a title', true);
        return;
    }

    try {
        await fetch(API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
        });

        e.target.reset();
        showMessage('Task added');
        loadTasks();
    } catch (err) {
        showMessage('Failed to add task', true);
        console.error(err);
    }
}

async function loadTasks() {
    try {
        const res = await fetch(API);
        const json = await res.json();
        const data = json.data || [];

        // Clear columns
        ['TODO', 'IN_PROGRESS', 'DONE'].forEach(status => {
            const el = document.getElementById(status);
            if (el) el.innerHTML = '';
        });

        data.forEach(task => renderTaskCard(task));
    } catch (err) {
        console.error('Failed to load tasks', err);
    }
}

function renderTaskCard(task) {
    const col = document.getElementById(task.status) || document.getElementById('TODO');
    if (!col) return;

    const card = document.createElement('article');
    // Add status class for colorful accent
    card.className = `task-card status-${task.status} enter`;
    // store dataset for undo and re-create
    card.dataset.id = task.id;
    card.dataset.title = task.title || '';
    card.dataset.description = task.description || '';
    card.dataset.status = task.status || '';
    if (task.created_at) card.dataset.createdAt = task.created_at;
    card.innerHTML = `
        <h3><span class="status-dot"></span>${escapeHtml(task.title)}</h3>
        <p>${escapeHtml(task.description || '')}</p>
        <div class="task-meta">
            <div class="task-actions">
                <select aria-label="Change status" data-id="${task.id}" onchange="updateStatusHandler(event)">
                    <option value="TODO" ${task.status==='TODO' ? 'selected' : ''}>To Do</option>
                    <option value="IN_PROGRESS" ${task.status==='IN_PROGRESS' ? 'selected' : ''}>In Progress</option>
                    <option value="DONE" ${task.status==='DONE' ? 'selected' : ''}>Done</option>
                </select>
                <button class="ripple" type="button" data-id="${task.id}" onclick="deleteTask(${task.id})">Delete</button>
            </div>
            <small>${task.created_at ? new Date(task.created_at).toLocaleString() : ''}</small>
        </div>
    `;

    col.appendChild(card);

    // staggered entrance: small delay based on current children
    const idx = col.children.length;
    card.style.animationDelay = `${Math.min(0.08 * idx, 0.5)}s`;

    // wire ripple effect
    const btn = card.querySelector('.ripple');
    if (btn) setupRipple(btn);
}

// Provide a small message to the user
function showMessage(msg, isError = false) {
    const el = document.getElementById('formMessage');
    if (!el) return;
    el.className = isError ? '' : '';
    el.textContent = msg;
    // make it visible briefly for non-screenreader users
    if (!el.classList.contains('sr-visible')) {
        el.classList.add('sr-visible');
        setTimeout(() => { el.textContent = ''; el.classList.remove('sr-visible'); }, 3000);
    }
}

// Toasts with optional undo
let toastTimeouts = [];
let lastDeleted = null;
function showToast(message, {undoText, undoCallback, duration=6000} = {}){
    const container = document.getElementById('toastContainer');
    if(!container) return;
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<div class="toast-text">${escapeHtml(message)}</div>`;
    if(undoText && undoCallback){
        const btn = document.createElement('button');
        btn.textContent = undoText;
        btn.addEventListener('click', ()=>{ undoCallback(); container.removeChild(t); });
        t.appendChild(btn);
    }
    container.appendChild(t);
    const id = setTimeout(()=>{ if(container.contains(t)) container.removeChild(t); }, duration);
    toastTimeouts.push(id);
}

async function deleteTask(id) {
    if (!confirm('Delete this task?')) return;
    // find card and extract data for undo
    const card = document.querySelector(`[data-id="${id}"]`);
    let taskCopy = null;
    if(card){
        taskCopy = {
            id: card.dataset.id,
            title: card.dataset.title,
            description: card.dataset.description,
            status: card.dataset.status,
            created_at: card.dataset.createdAt
        };
        // optimistic remove from DOM
        card.remove();
        updateCounts();
    }

    // send delete request
    try {
        await fetch(`${API}/${id}`, { method: 'DELETE' });
        showMessage('Task deleted');
        lastDeleted = taskCopy;
        if(lastDeleted){
            showToast('Task deleted', { undoText: 'Undo', undoCallback: async ()=>{
                try{
                    // recreate
                    await fetch(API, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({title:lastDeleted.title, description:lastDeleted.description, status:lastDeleted.status}) });
                    showMessage('Restored');
                    loadTasks();
                }catch(e){ console.error(e); showMessage('Restore failed', true); }
            }});
        }
    } catch (err) {
        showMessage('Failed to delete', true);
        console.error(err);
        // if optimistic removed, reload to restore
        loadTasks();
    }
}

// Handler for select onchange wired via inline handler in card
async function updateStatusHandler(e) {
    const select = e.target;
    const id = select.getAttribute('data-id');
    const newStatus = select.value;

    try {
        // Try to update via PUT; backend may vary — adjust if needed
        await fetch(`${API}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        showMessage('Status updated');
        loadTasks();
        // if moved to DONE, trigger confetti
        if(newStatus === 'DONE') triggerConfetti();
    } catch (err) {
        showMessage('Failed to update status', true);
        console.error(err);
    }
}

// Basic HTML escape helper
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Expose handler to global scope for inline onchange in generated HTML
window.updateStatusHandler = updateStatusHandler;

// Update column counts
function updateCounts(){
    ['TODO','IN_PROGRESS','DONE'].forEach(s=>{
        const el = document.getElementById(`count-${s}`);
        const col = document.getElementById(s);
        if(el && col) el.textContent = col.children.length;
    });
}

// Ripple setup
function setupRipple(btn){
    btn.addEventListener('click', function(e){
        const rect = btn.getBoundingClientRect();
        const circle = document.createElement('span');
        circle.className = 'ripple-circle';
        const size = Math.max(rect.width, rect.height);
        circle.style.width = circle.style.height = size + 'px';
        circle.style.left = (e.clientX - rect.left - size/2) + 'px';
        circle.style.top = (e.clientY - rect.top - size/2) + 'px';
        btn.appendChild(circle);
        setTimeout(()=> circle.remove(), 700);
    });
}

// Keyboard shortcut: press 'n' to focus new title
document.addEventListener('keydown', (e)=>{
    if(document.activeElement.tagName.toLowerCase() === 'input' || document.activeElement.tagName.toLowerCase() === 'textarea') return;
    if(e.key === 'n' || e.key === 'N'){
        const t = document.getElementById('title');
        if(t){ t.focus(); t.select(); }
    }
});

// Confetti generator (small)
function triggerConfetti(){
    const colors = ['#7c3aed','#ff7a18','#06b6d4','#16a34a','#f59e0b'];
    const count = 18;
    for(let i=0;i<count;i++){
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.background = colors[Math.floor(Math.random()*colors.length)];
        piece.style.left = (20 + Math.random()*60) + 'vw';
        piece.style.top = (-10 - Math.random()*20) + 'vh';
        piece.style.width = (6 + Math.random()*10)+'px';
        piece.style.height = (8 + Math.random()*14)+'px';
        piece.style.transform = `rotate(${Math.random()*360}deg)`;
        piece.style.animationDuration = (1.2 + Math.random()*1.4)+'s';
        document.body.appendChild(piece);
        setTimeout(()=> piece.remove(), 2400);
    }
}

// ensure counts updated after load
const origLoadTasks = loadTasks;
loadTasks = async function(){
    await origLoadTasks();
    updateCounts();
}