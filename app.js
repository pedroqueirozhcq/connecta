// CONNECTA - Sistema local (IndexedDB)
// Tudo funciona abrindo o index.html

const DB_NAME = 'CONNECTA_DB';
const DB_VERSION = 1;

const Roles = {
  COORDENADOR: 'COORDENADOR',
  LIDER: 'LIDER'
};

const AdminCredentials = {
  user: 'admin',
  pass: 'admin123'
};

class DB {
  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('people')) {
          const store = db.createObjectStore('people', { keyPath: 'id', autoIncrement: true });
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('role', 'role', { unique: false });
          store.createIndex('coordinatorId', 'coordinatorId', { unique: false });
        }
        if (!db.objectStoreNames.contains('tasks')) {
          const store = db.createObjectStore('tasks', { keyPath: 'id', autoIncrement: true });
          store.createIndex('coordinatorId', 'coordinatorId', { unique: false });
          store.createIndex('leaderId', 'leaderId', { unique: false });
        }
        if (!db.objectStoreNames.contains('responses')) {
          const store = db.createObjectStore('responses', { keyPath: 'id', autoIncrement: true });
          store.createIndex('taskId', 'taskId', { unique: false });
          store.createIndex('leaderId', 'leaderId', { unique: false });
        }
      };
    });
  }

  getStore(name, mode = 'readonly') {
    return this.db.transaction([name], mode).objectStore(name);
  }

  getAll(name) {
    return new Promise((resolve, reject) => {
      const request = this.getStore(name).getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  add(name, value) {
    return new Promise((resolve, reject) => {
      const request = this.getStore(name, 'readwrite').add(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  update(name, id, value) {
    return new Promise((resolve, reject) => {
      value.id = id;
      const request = this.getStore(name, 'readwrite').put(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  delete(name, id) {
    return new Promise((resolve, reject) => {
      const request = this.getStore(name, 'readwrite').delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

const db = new DB();

const ui = {
  personForm: document.getElementById('personForm'),
  personId: document.getElementById('personId'),
  personName: document.getElementById('personName'),
  personRole: document.getElementById('personRole'),
  personCoordinator: document.getElementById('personCoordinator'),
  coordinatorField: document.getElementById('coordinatorField'),
  resetPersonForm: document.getElementById('resetPersonForm'),
  peopleTable: document.getElementById('peopleTable'),
  peopleEmpty: document.getElementById('peopleEmpty'),
  peopleSearch: document.getElementById('peopleSearch'),
  peopleRoleFilter: document.getElementById('peopleRoleFilter'),
  newPersonBtn: document.getElementById('newPersonBtn'),

  taskForm: document.getElementById('taskForm'),
  taskCoordinator: document.getElementById('taskCoordinator'),
  taskTitle: document.getElementById('taskTitle'),
  taskDescription: document.getElementById('taskDescription'),
  taskDeadline: document.getElementById('taskDeadline'),
  taskTarget: document.getElementById('taskTarget'),
  taskFile: document.getElementById('taskFile'),
  tasksList: document.getElementById('tasksList'),

  leaderViewer: document.getElementById('leaderViewer'),
  leaderTasks: document.getElementById('leaderTasks'),

  mapCoordinator: document.getElementById('mapCoordinator'),
  mapView: document.getElementById('mapView'),

  adminLogin: document.getElementById('adminLogin'),
  adminPanel: document.getElementById('adminPanel'),
  adminForm: document.getElementById('adminForm'),
  adminUser: document.getElementById('adminUser'),
  adminPass: document.getElementById('adminPass'),
  adminLogout: document.getElementById('adminLogout'),
  statCoordinators: document.getElementById('statCoordinators'),
  statLeaders: document.getElementById('statLeaders'),
  statTasks: document.getElementById('statTasks'),
  statResponses: document.getElementById('statResponses'),
  statExpired: document.getElementById('statExpired'),
  adminPeople: document.getElementById('adminPeople'),
  adminTasks: document.getElementById('adminTasks'),
  adminResponses: document.getElementById('adminResponses'),

  accessForm: document.getElementById('accessForm'),
  accessPerson: document.getElementById('accessPerson'),
  accessRole: document.getElementById('accessRole'),
  accessLogout: document.getElementById('accessLogout'),
  accessStatus: document.getElementById('accessStatus'),

  toast: document.getElementById('toast')
};

function showToast(message) {
  ui.toast.textContent = message;
  ui.toast.classList.remove('hidden');
  setTimeout(() => ui.toast.classList.add('hidden'), 2200);
}

function getLoggedUser(people) {
  const loggedId = Number(sessionStorage.getItem('connectaUserId'));
  if (!loggedId) return null;
  return people.find(p => p.id === loggedId) || null;
}

function formatDate(date) {
  return new Date(date).toLocaleString('pt-BR');
}

function calcDeadline(hours) {
  const now = new Date();
  return new Date(now.getTime() + Number(hours) * 60 * 60 * 1000);
}

function statusLabel(status) {
  if (status === 'Concluído') return 'Concluído';
  if (status === 'Vencido') return 'Vencido';
  return 'Em andamento';
}

function badgeStatus(status) {
  if (status === 'Concluído') return 'badge-status-Concluido';
  if (status === 'Vencido') return 'badge-status-Vencido';
  return 'badge-status-Em';
}

async function ensureSeed() {
  const people = await db.getAll('people');
  if (people.length) return;

  const now = new Date().toISOString();
  const pedroId = await db.add('people', { name: 'Pedro', role: Roles.COORDENADOR, coordinatorId: null, createdAt: now });
  await db.add('people', { name: 'Brendo', role: Roles.LIDER, coordinatorId: pedroId, createdAt: now });
  await db.add('people', { name: 'João', role: Roles.LIDER, coordinatorId: pedroId, createdAt: now });
}

async function loadPeople() {
  const people = await db.getAll('people');
  const query = ui.peopleSearch.value.trim().toLowerCase();
  const roleFilter = ui.peopleRoleFilter.value;

  const filtered = people.filter(p => {
    const matchesQuery = !query || p.name.toLowerCase().includes(query);
    const matchesRole = !roleFilter || p.role === roleFilter;
    return matchesQuery && matchesRole;
  });

  ui.peopleTable.innerHTML = '';
  ui.peopleEmpty.classList.toggle('hidden', filtered.length > 0);

  filtered.forEach(person => {
    const row = document.createElement('tr');
    const coordinator = person.role === Roles.LIDER
      ? people.find(p => p.id === person.coordinatorId)?.name || '-'
      : '-';

    row.innerHTML = `
      <td>${person.name}</td>
      <td><span class="badge badge-${person.role}">${person.role}</span></td>
      <td>${coordinator}</td>
      <td>
        <button class="btn btn-ghost" data-action="edit" data-id="${person.id}">Editar</button>
        <button class="btn btn-ghost" data-action="delete" data-id="${person.id}">Excluir</button>
      </td>
    `;
    ui.peopleTable.appendChild(row);
  });
}

async function refreshPersonSelects() {
  const people = await db.getAll('people');
  const coordinators = people.filter(p => p.role === Roles.COORDENADOR);
  const leaders = people.filter(p => p.role === Roles.LIDER);

  const loggedUser = getLoggedUser(people);

  ui.personCoordinator.innerHTML = '';
  ui.personCoordinator.appendChild(new Option(coordinators.length ? 'Selecione um coordenador' : 'Nenhum coordenador cadastrado', '', true, true));
  coordinators.forEach(c => ui.personCoordinator.appendChild(new Option(c.name, c.id)));

  ui.taskCoordinator.innerHTML = '';
  ui.taskCoordinator.appendChild(new Option(coordinators.length ? 'Selecione um coordenador' : 'Nenhum coordenador cadastrado', '', true, true));
  coordinators.forEach(c => ui.taskCoordinator.appendChild(new Option(c.name, c.id)));

  ui.taskTarget.innerHTML = '';
  ui.taskTarget.appendChild(new Option('Todos os líderes', 'ALL'));
  leaders.forEach(l => ui.taskTarget.appendChild(new Option(l.name, l.id)));

  ui.leaderViewer.innerHTML = '';
  ui.leaderViewer.appendChild(new Option(leaders.length ? 'Selecione um líder' : 'Nenhum líder cadastrado', '', true, true));
  leaders.forEach(l => ui.leaderViewer.appendChild(new Option(l.name, l.id)));

  ui.mapCoordinator.innerHTML = '';
  ui.mapCoordinator.appendChild(new Option(coordinators.length ? 'Selecione um coordenador' : 'Nenhum coordenador cadastrado', '', true, true));
  coordinators.forEach(c => ui.mapCoordinator.appendChild(new Option(c.name, c.id)));

  ui.accessPerson.innerHTML = '';
  ui.accessPerson.appendChild(new Option(people.length ? 'Selecione seu nome' : 'Nenhuma pessoa cadastrada', '', true, true));
  people.forEach(p => ui.accessPerson.appendChild(new Option(p.name, p.id)));

  if (loggedUser) {
    ui.accessPerson.value = loggedUser.id;
    ui.accessRole.value = loggedUser.role;
    ui.accessStatus.textContent = `Logado como ${loggedUser.name} (${loggedUser.role})`;
  } else {
    ui.accessRole.value = '';
    ui.accessStatus.textContent = 'Ninguém logado.';
  }
}

async function loadMap() {
  const people = await db.getAll('people');
  const coordinatorId = Number(ui.mapCoordinator.value);
  const coordinator = people.find(p => p.id === coordinatorId);

  if (!coordinator) {
    ui.mapView.innerHTML = '<p class="muted">Selecione um coordenador para ver o mapa.</p>';
    return;
  }

  const leaders = people.filter(p => p.role === Roles.LIDER && p.coordinatorId === coordinator.id);
  ui.mapView.innerHTML = `
    <div class="map-root">${coordinator.name}</div>
    <ul>
      ${leaders.length ? leaders.map(l => `<li>${l.name}</li>`).join('') : '<li class="muted">Sem líderes cadastrados</li>'}
    </ul>
  `;
}

async function loadTasks() {
  const tasks = await db.getAll('tasks');
  const responses = await db.getAll('responses');
  const people = await db.getAll('people');

  ui.tasksList.innerHTML = '';

  tasks.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).forEach(task => {
    const coordinator = people.find(p => p.id === task.coordinatorId);
    const taskResponses = responses.filter(r => r.taskId === task.id);
    const deadline = new Date(task.deadline);
    const now = new Date();
    let status = 'Em andamento';

    const targetLeaders = task.leaderId === 'ALL'
      ? people.filter(p => p.role === Roles.LIDER && p.coordinatorId === task.coordinatorId)
      : people.filter(p => p.id === Number(task.leaderId));

    const allDone = targetLeaders.length > 0 && targetLeaders.every(leader => {
      const resp = taskResponses.find(r => r.leaderId === leader.id && r.completed);
      return Boolean(resp);
    });

    if (allDone) status = 'Concluído';
    if (!allDone && now > deadline) status = 'Vencido';

    task.status = status;
    db.update('tasks', task.id, task);

    const fileLink = task.file
      ? `<a href="${URL.createObjectURL(task.file)}" download="${task.file.name}">Baixar arquivo</a>`
      : '<span class="muted">Sem arquivo</span>';

    const item = document.createElement('div');
    item.className = 'stack-item';
    item.innerHTML = `
      <div class="section-header">
        <div>
          <strong>${task.title}</strong>
          <div class="muted">Coordenador: ${coordinator?.name || '-'}</div>
        </div>
        <span class="badge ${badgeStatus(status)}">${statusLabel(status)}</span>
      </div>
      <p>${task.description || 'Sem descrição'}</p>
      <p class="muted">Criado em: ${formatDate(task.createdAt)} | Prazo final: ${formatDate(task.deadline)}</p>
      <p>${fileLink}</p>
    `;
    ui.tasksList.appendChild(item);
  });
}

async function loadLeaderTasks() {
  const leaderId = Number(ui.leaderViewer.value);
  const tasks = await db.getAll('tasks');
  const responses = await db.getAll('responses');
  const people = await db.getAll('people');

  ui.leaderTasks.innerHTML = '';

  if (!leaderId) {
    ui.leaderTasks.innerHTML = '<p class="muted">Selecione um líder para visualizar os envios.</p>';
    return;
  }

  const leader = people.find(p => p.id === leaderId);
  const leaderTasks = tasks.filter(task => {
    if (task.leaderId === 'ALL') {
      return leader && leader.coordinatorId === task.coordinatorId;
    }
    return Number(task.leaderId) === leaderId;
  });

  leaderTasks.forEach(task => {
    const existing = responses.find(r => r.taskId === task.id && r.leaderId === leaderId);
    const card = document.createElement('div');
    card.className = 'stack-item';

    const fileLink = task.file
      ? `<a href="${URL.createObjectURL(task.file)}" download="${task.file.name}">Baixar arquivo</a>`
      : '<span class="muted">Sem arquivo</span>';

    card.innerHTML = `
      <div class="section-header">
        <div>
          <strong>${task.title}</strong>
          <div class="muted">Prazo: ${formatDate(task.deadline)}</div>
        </div>
      </div>
      <p>${task.description || 'Sem descrição'}</p>
      <p>${fileLink}</p>
      <form class="response-form" data-task="${task.id}">
        <div class="field">
          <label>
            <input type="checkbox" name="completed" ${existing?.completed ? 'checked' : ''} /> Concluído
          </label>
        </div>
        <div class="field">
          <label>Comentário</label>
          <textarea name="comment" rows="2">${existing?.comment || ''}</textarea>
        </div>
        <div class="field">
          <label>Arquivo</label>
          <input type="file" name="file" />
        </div>
        <button class="btn btn-primary" type="submit">Enviar resposta</button>
      </form>
    `;
    ui.leaderTasks.appendChild(card);
  });
}

async function loadAdmin() {
  if (sessionStorage.getItem('admin') !== 'ok') {
    ui.adminLogin.classList.remove('hidden');
    ui.adminPanel.classList.add('hidden');
    return;
  }

  ui.adminLogin.classList.add('hidden');
  ui.adminPanel.classList.remove('hidden');

  const people = await db.getAll('people');
  const tasks = await db.getAll('tasks');
  const responses = await db.getAll('responses');

  ui.statCoordinators.textContent = people.filter(p => p.role === Roles.COORDENADOR).length;
  ui.statLeaders.textContent = people.filter(p => p.role === Roles.LIDER).length;
  ui.statTasks.textContent = tasks.length;
  ui.statResponses.textContent = responses.length;
  ui.statExpired.textContent = tasks.filter(t => t.status === 'Vencido').length;

  ui.adminPeople.innerHTML = people.map(p => `<div class="stack-item">${p.name} - ${p.role}</div>`).join('') || '<p class="muted">Sem pessoas.</p>';
  ui.adminTasks.innerHTML = tasks.map(t => `<div class="stack-item">${t.title} - ${t.status}</div>`).join('') || '<p class="muted">Sem envios.</p>';
  ui.adminResponses.innerHTML = responses.map(r => `<div class="stack-item">Resposta do líder ${r.leaderId} para envio ${r.taskId}</div>`).join('') || '<p class="muted">Sem respostas.</p>';
}

async function refreshAll() {
  await refreshPersonSelects();
  await loadPeople();
  await loadTasks();
  await loadLeaderTasks();
  await loadMap();
  await loadAdmin();
}

function bindEvents() {
  ui.personRole.addEventListener('change', () => {
    ui.coordinatorField.classList.toggle('hidden', ui.personRole.value !== Roles.LIDER);
  });

  ui.peopleSearch.addEventListener('input', () => loadPeople());
  ui.peopleRoleFilter.addEventListener('change', () => loadPeople());

  ui.newPersonBtn.addEventListener('click', () => ui.personForm.scrollIntoView({ behavior: 'smooth' }));
  ui.resetPersonForm.addEventListener('click', () => {
    ui.personForm.reset();
    ui.personId.value = '';
    ui.personRole.value = Roles.COORDENADOR;
    ui.coordinatorField.classList.add('hidden');
  });

  ui.personForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = ui.personName.value.trim();
    const role = ui.personRole.value;
    const coordinatorId = ui.personCoordinator.value ? Number(ui.personCoordinator.value) : null;

    if (!name) return showToast('Informe o nome.');
    if (role === Roles.LIDER && !coordinatorId) return showToast('Selecione um coordenador.');

    const payload = { name, role, coordinatorId, createdAt: new Date().toISOString() };

    if (ui.personId.value) {
      await db.update('people', Number(ui.personId.value), payload);
      showToast('Cadastro atualizado.');
    } else {
      await db.add('people', payload);
      showToast('Pessoa cadastrada.');
    }

    ui.personForm.reset();
    ui.personId.value = '';
    ui.personRole.value = Roles.COORDENADOR;
    ui.coordinatorField.classList.add('hidden');
    await refreshAll();
  });

  ui.peopleTable.addEventListener('click', async (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const id = Number(button.dataset.id);
    const action = button.dataset.action;
    const people = await db.getAll('people');
    const person = people.find(p => p.id === id);
    if (!person) return;

    if (action === 'edit') {
      ui.personId.value = person.id;
      ui.personName.value = person.name;
      ui.personRole.value = person.role;
      ui.coordinatorField.classList.toggle('hidden', person.role !== Roles.LIDER);
      ui.personCoordinator.value = person.coordinatorId || '';
      ui.personForm.scrollIntoView({ behavior: 'smooth' });
    }

    if (action === 'delete') {
      const leadersLinked = people.some(p => p.role === Roles.LIDER && p.coordinatorId === person.id);
      if (leadersLinked) return showToast('Não é possível excluir: há líderes vinculados.');
      await db.delete('people', id);
      showToast('Pessoa removida.');
      await refreshAll();
    }
  });

  ui.taskCoordinator.addEventListener('change', refreshPersonSelects);

  ui.accessPerson.addEventListener('change', async () => {
    const people = await db.getAll('people');
    const selected = people.find(p => p.id === Number(ui.accessPerson.value));
    ui.accessRole.value = selected ? selected.role : '';
  });

  ui.accessForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const people = await db.getAll('people');
    const selected = people.find(p => p.id === Number(ui.accessPerson.value));
    if (!selected) return showToast('Selecione seu nome.');
    sessionStorage.setItem('connectaUserId', String(selected.id));
    ui.accessStatus.textContent = `Logado como ${selected.name} (${selected.role})`;

    if (selected.role === Roles.LIDER) {
      ui.leaderViewer.value = selected.id;
      await loadLeaderTasks();
    }

    if (selected.role === Roles.COORDENADOR) {
      ui.taskCoordinator.value = selected.id;
    }

    showToast('Acesso liberado.');
  });

  ui.accessLogout.addEventListener('click', () => {
    sessionStorage.removeItem('connectaUserId');
    ui.accessStatus.textContent = 'Ninguém logado.';
    ui.accessRole.value = '';
    ui.accessPerson.value = '';
    showToast('Você saiu.');
  });

  ui.taskForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const coordinatorId = Number(ui.taskCoordinator.value);
    const title = ui.taskTitle.value.trim();
    const description = ui.taskDescription.value.trim();
    const deadlineHours = ui.taskDeadline.value;
    const target = ui.taskTarget.value;
    const file = ui.taskFile.files[0];

    if (!coordinatorId || !title) return showToast('Preencha os campos obrigatórios.');

    const createdAt = new Date().toISOString();
    const deadline = calcDeadline(deadlineHours).toISOString();

    const payload = {
      coordinatorId,
      title,
      description,
      deadline,
      leaderId: target,
      status: 'Em andamento',
      createdAt,
      file: file ? { name: file.name, type: file.type, blob: file } : null
    };

    await db.add('tasks', payload);
    showToast('Envio criado.');
    ui.taskForm.reset();
    await refreshAll();
  });

  ui.leaderViewer.addEventListener('change', loadLeaderTasks);

  ui.leaderTasks.addEventListener('submit', async (event) => {
    const form = event.target.closest('.response-form');
    if (!form) return;
    event.preventDefault();

    const leaderId = Number(ui.leaderViewer.value);
    const taskId = Number(form.dataset.task);
    const completed = form.querySelector('input[name="completed"]').checked;
    const comment = form.querySelector('textarea[name="comment"]').value.trim();
    const fileInput = form.querySelector('input[name="file"]');
    const file = fileInput.files[0];

    const payload = {
      taskId,
      leaderId,
      completed,
      comment,
      createdAt: new Date().toISOString(),
      file: file ? { name: file.name, type: file.type, blob: file } : null
    };

    const responses = await db.getAll('responses');
    const existing = responses.find(r => r.taskId === taskId && r.leaderId === leaderId);

    if (existing) {
      await db.update('responses', existing.id, payload);
      showToast('Resposta atualizada.');
    } else {
      await db.add('responses', payload);
      showToast('Resposta enviada.');
    }

    await refreshAll();
  });

  ui.mapCoordinator.addEventListener('change', loadMap);

  ui.adminForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (ui.adminUser.value === AdminCredentials.user && ui.adminPass.value === AdminCredentials.pass) {
      sessionStorage.setItem('admin', 'ok');
      ui.adminUser.value = '';
      ui.adminPass.value = '';
      showToast('Login realizado.');
      loadAdmin();
    } else {
      showToast('Credenciais inválidas.');
    }
  });

  ui.adminLogout.addEventListener('click', () => {
    sessionStorage.removeItem('admin');
    showToast('Logout realizado.');
    loadAdmin();
  });
}

(async function init() {
  await db.init();
  await ensureSeed();
  bindEvents();
  await refreshAll();
})();
