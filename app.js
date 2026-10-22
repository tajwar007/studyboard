tailwind.config = {
  theme: {
    extend: {
      colors: {
        paper: '#f5f5ef',
        ink: '#202722',
        forest: '#315c47',
        lime: '#d7e79c',
        line: '#e4e5dc'
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Playfair Display', 'serif']
      }
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const storageKey = 'studyboard-tasks-v1';
  const form = document.getElementById('task-form');
  const taskList = document.getElementById('task-list');
  const emptyState = document.getElementById('empty-state');
  let tasks = loadTasks();
  let currentFilter = 'all';

  function loadTasks() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      return Array.isArray(saved) ? saved.filter(task => task && typeof task.id === 'string' && typeof task.title === 'string') : [];
    } catch {
      return [];
    }
  }

  function saveTasks() {
    localStorage.setItem(storageKey, JSON.stringify(tasks));
  }

  function formatDueDate(value) {
    if (!value) return 'No due date';
    const due = new Date(`${value}T00:00:00`);
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(due);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  }

  function render() {
    const activeCount = tasks.filter(task => !task.completed).length;
    const completedCount = tasks.length - activeCount;
    const progress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;
    document.getElementById('todo-count').textContent = activeCount;
    document.getElementById('done-count').textContent = completedCount;
    document.getElementById('progress-label').textContent = `${progress}%`;
    document.getElementById('progress-bar').style.width = `${progress}%`;

    const visibleTasks = tasks.filter(task => currentFilter === 'all' || (currentFilter === 'active' ? !task.completed : task.completed));
    document.getElementById('visible-count').textContent = `(${visibleTasks.length})`;
    taskList.innerHTML = visibleTasks.map(task => {
      const priorityClass = task.priority === 'High' ? 'bg-rose-50 text-rose-700' : task.priority === 'Low' ? 'bg-sky-50 text-sky-700' : 'bg-stone-100 text-stone-600';
      return `<article class="task-enter flex items-start gap-3 px-4 py-4 sm:items-center sm:px-5" data-id="${escapeHtml(task.id)}">
        <button type="button" data-action="toggle" aria-label="${task.completed ? 'Mark incomplete' : 'Mark complete'}: ${escapeHtml(task.title)}" class="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${task.completed ? 'border-forest bg-forest text-white' : 'border-stone-300 text-transparent hover:border-forest'}">
          <i data-lucide="check" class="h-3 w-3"></i>
        </button>
        <div class="min-w-0 flex-1">
          <p class="break-words text-sm font-semibold ${task.completed ? 'text-stone-400 line-through' : 'text-ink'}">${escapeHtml(task.title)}</p>
          <div class="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500">
            <span>${escapeHtml(task.subject || 'General')}</span><span aria-hidden="true">·</span><span>${escapeHtml(formatDueDate(task.due))}</span>
            <span class="rounded-full px-2 py-0.5 text-[10px] font-semibold ${priorityClass}">${escapeHtml(task.priority || 'Normal')}</span>
          </div>
        </div>
        <button type="button" data-action="delete" aria-label="Delete ${escapeHtml(task.title)}" class="grid h-8 w-8 shrink-0 place-items-center rounded-md text-stone-400 transition hover:bg-rose-50 hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-300">
          <i data-lucide="trash-2" class="h-4 w-4"></i>
        </button>
      </article>`;
    }).join('');

    const isEmpty = visibleTasks.length === 0;
    taskList.classList.toggle('hidden', isEmpty);
    emptyState.classList.toggle('hidden', !isEmpty);
    document.getElementById('empty-title').textContent = tasks.length === 0 ? 'Your page is clear.' : currentFilter === 'active' ? 'Nothing left to do.' : 'No completed tasks yet.';
    document.getElementById('empty-copy').textContent = tasks.length === 0 ? 'Add a task to get your study session started.' : currentFilter === 'active' ? 'A good feeling, right? Add another task whenever you like.' : 'Finish a task and it will show up here.';
    if (window.lucide) lucide.createIcons();
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    const title = String(data.get('title') || '').trim();
    if (!title) return;
    tasks.unshift({ id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`, title, subject: data.get('subject'), due: data.get('due'), priority: data.get('priority'), completed: false });
    saveTasks();
    currentFilter = 'all';
    document.querySelectorAll('.filter-btn').forEach(button => {
      const selected = button.dataset.filter === currentFilter;
      button.classList.toggle('bg-forest', selected);
      button.classList.toggle('text-white', selected);
      button.classList.toggle('text-stone-600', !selected);
    });
    form.reset();
    document.getElementById('task-title').focus();
    render();
  });

  document.querySelectorAll('.filter-btn').forEach(button => button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;
    document.querySelectorAll('.filter-btn').forEach(item => {
      const selected = item === button;
      item.classList.toggle('bg-forest', selected);
      item.classList.toggle('text-white', selected);
      item.classList.toggle('text-stone-600', !selected);
    });
    render();
  }));

  taskList.addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const article = button.closest('[data-id]');
    const task = tasks.find(item => item.id === article.dataset.id);
    if (!task) return;
    if (button.dataset.action === 'toggle') task.completed = !task.completed;
    if (button.dataset.action === 'delete') tasks = tasks.filter(item => item.id !== task.id);
    saveTasks();
    render();
  });

  document.getElementById('date-label').textContent = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date());
  render();
});