// Khởi tạo trạng thái ứng dụng rỗng (Dữ liệu thực tế sẽ tải từ SQLite lên)
let state = {
    companies: [],
    categories: [],
    tasks: []
};

let currentFilter = 'all';
let taskViewMode = 'grid'; 
let selectedCompanyId = '';
let configSelectedCompanyId = '';
let selectedCategoryId = '';
let activeTab = 'dashboard';

// --- HÀM TRUNG TÂM: TẢI ĐỒNG BỘ DỮ LIỆU TỪ SQLITE LÊN GIAO DIỆN ---
async function loadDataFromSQLite() {
    try {
        // 1. Tải danh sách Công ty & Hạng mục
        const compRes = await window.electronAPI.getCompaniesData();
        if (compRes.success) {
            state.companies = compRes.data.companies;
            // Ánh xạ lại tên trường khóa ngoại từ snake_case (DB) sang camelCase (UI)
            state.categories = compRes.data.categories.map(c => ({
                id: c.id,
                name: c.name,
                companyId: c.company_id
            }));
        }

        // 2. Tải danh sách Toàn bộ hồ sơ việc kế toán
        const taskRes = await window.electronAPI.getAllTasks();
        if (taskRes.success) {
            state.tasks = taskRes.data.map(t => ({
                id: t.id,
                title: t.title,
                companyId: t.company_id,
                categoryId: t.category_id,
                amount: t.amount,
                dueDate: t.due_date,
                priority: t.priority,
                invoiceStatus: t.invoice_status,
                contractor: t.contractor,
                notes: t.notes,
                status: t.status,
                // Định dạng lại các bước việc con
                subtasks: t.subtasks ? t.subtasks.map(s => ({
                    id: s.id,
                    text: s.text,
                    completed: s.completed === 1
                })) : []
            }));
        }

        // Cấu hình các id lựa chọn mặc định ban đầu nếu chưa có
        if (!selectedCompanyId && state.companies.length > 0) selectedCompanyId = state.companies[0].id;
        if (!configSelectedCompanyId && state.companies.length > 0) configSelectedCompanyId = state.companies[0].id;

        // Tiến hành vẽ lại giao diện
        smartRender();
    } catch (error) {
        console.error("Lỗi đồng bộ SQLite:", error);
    }
}

function initClock() {
    const timeEl = document.getElementById('live-time');
    const update = () => {
        const now = new Date();
        timeEl.innerText = now.toLocaleTimeString('vi-VN') + " - " + now.toLocaleDateString('vi-VN');
    }
    setInterval(update, 1000); update();
}

function toggleDarkMode() { document.documentElement.classList.toggle('dark'); }

function switchTab(tabId) {
    activeTab = tabId;
    document.querySelectorAll('#pages-container > section').forEach(sec => sec.classList.add('hidden'));
    document.getElementById(`tab-${tabId}`).classList.remove('hidden');
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.className = "nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors";
    });
    const activeBtn = document.getElementById(`btn-${tabId}`);
    if(activeBtn) activeBtn.className = "nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors bg-primary-50 text-emerald-700 dark:bg-primary-900/30 dark:text-primary-400";
    
    smartRender();
}

function updateGlobalData() {
    document.getElementById('count-all').innerText = state.tasks.length;
    document.getElementById('count-pending').innerText = state.tasks.filter(t => t.status === 'pending').length;
    document.getElementById('count-completed').innerText = state.tasks.filter(t => t.status === 'completed').length;
    document.getElementById('count-urgent').innerText = state.tasks.filter(t => t.priority === 'Cao' && t.status === 'pending').length;
}

function setTaskViewMode(mode) {
    taskViewMode = mode;
    const btnGrid = document.getElementById('btn-view-grid');
    const btnList = document.getElementById('btn-view-list');
    if(!btnGrid || !btnList) return;
    
    if (mode === 'grid') {
        btnGrid.className = "p-1.5 rounded-lg transition-all bg-white dark:bg-slate-800 text-emerald-600 shadow-sm";
        btnList.className = "p-1.5 rounded-lg transition-all text-slate-400 hover:text-slate-600 dark:hover:text-slate-200";
    } else {
        btnGrid.className = "p-1.5 rounded-lg transition-all text-slate-400 hover:text-slate-600 dark:hover:text-slate-200";
        btnList.className = "p-1.5 rounded-lg transition-all bg-white dark:bg-slate-800 text-emerald-600 shadow-sm";
    }
    smartRender();
}

// --- XỬ LÝ VIỆC CON (SUBTASKS) ĐỒNG BỘ XUỐNG SQLITE ---
async function saveTaskToDbDirectly(task) {
    const dbPayload = {
        id: task.id,
        title: task.title,
        company_id: task.companyId,
        category_id: task.categoryId,
        amount: task.amount,
        due_date: task.dueDate,
        priority: task.priority,
        invoice_status: task.invoiceStatus,
        contractor: task.contractor,
        notes: task.notes,
        status: task.status,
        subtasks: task.subtasks.map(s => ({
            id: s.id,
            text: s.text,
            completed: s.completed ? 1 : 0
        }))
    };
    await window.electronAPI.saveTask(dbPayload);
    await loadDataFromSQLite();
}

async function addSubTask(taskId) {
    const input = document.getElementById(`subtask-input-${taskId}`);
    const text = input ? input.value.trim() : '';
    if (!text) return;
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
        task.subtasks = task.subtasks || [];
        task.subtasks.push({ id: 'sub-' + Date.now(), text: text, completed: false });
        if(input) input.value = '';
        await saveTaskToDbDirectly(task);
    }
}

async function handleToggleSubtask(taskId, subtaskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (task && task.subtasks) {
        const sub = task.subtasks.find(s => s.id === subtaskId);
        if (sub) { 
            sub.completed = !sub.completed; 
            await saveTaskToDbDirectly(task);
        }
    }
}

async function handleEditSubtask(taskId, subtaskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (task && task.subtasks) {
        const sub = task.subtasks.find(s => s.id === subtaskId);
        if (sub) {
            const newText = prompt("Sửa nội dung việc con:", sub.text);
            if (newText && newText.trim()) { 
                sub.text = newText.trim(); 
                await saveTaskToDbDirectly(task);
            }
        }
    }
}

async function handleDeleteSubtask(taskId, subtaskId) {
    if (confirm('Xóa công việc con này?')) {
        const task = state.tasks.find(t => t.id === taskId);
        if (task && task.subtasks) {
            task.subtasks = task.subtasks.filter(s => s.id !== subtaskId);
            await saveTaskToDbDirectly(task);
        }
    }
}

function getSubtaskHTMLBlock(t) {
    t.subtasks = t.subtasks || [];
    const total = t.subtasks.length;
    const done = t.subtasks.filter(s => s.completed).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    let html = `
        <div class="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 space-y-2">
            <div class="flex justify-between items-center text-[11px] font-semibold text-slate-500">
                <span class="flex items-center gap-1"><i data-lucide="check-square" class="w-3 h-3 text-primary-600"></i> Các bước thực hiện (${done}/${total})</span>
                <span>${pct}%</span>
            </div>
            <div class="w-full bg-slate-100 dark:bg-slate-700 h-1 rounded-full overflow-hidden">
                <div class="bg-primary-500 h-full transition-all duration-300" style="width: ${pct}%"></div>
            </div>
            <div class="max-h-24 overflow-y-auto space-y-1 pr-1 my-1">
    `;

    if (total === 0) {
        html += `<p class="text-[11px] text-slate-400 italic py-0.5">Chưa tạo danh mục việc con.</p>`;
    } else {
        html += t.subtasks.map(s => `
            <div class="flex items-center justify-between gap-2 p-1 bg-slate-50 dark:bg-slate-900/40 rounded-lg group text-[11px]">
                <label class="flex items-center gap-2 min-w-0 cursor-pointer flex-1">
                    <input type="checkbox" ${s.completed ? 'checked' : ''} onclick="handleToggleSubtask('${t.id}', '${s.id}')" class="rounded text-primary-600 border-slate-300 focus:ring-primary-500 w-3 h-3">
                    <span class="truncate ${s.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-300'}">${s.text}</span>
                </label>
                <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick="handleEditSubtask('${t.id}', '${s.id}')" class="text-slate-400 hover:text-blue-500"><i data-lucide="edit-2" class="w-2.5 h-2.5"></i></button>
                    <button onclick="handleDeleteSubtask('${t.id}', '${s.id}')" class="text-slate-400 hover:text-rose-500"><i data-lucide="trash-2" class="w-2.5 h-2.5"></i></button>
                </div>
            </div>
        `).join('');
    }

    html += `
            </div>
            <div class="flex gap-1.5 mt-2">
                <input type="text" id="subtask-input-${t.id}" placeholder="Thêm bước xử lý..." class="flex-1 px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] focus:outline-none focus:border-primary-500">
                <button onclick="addSubTask('${t.id}')" class="px-2 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-[11px] font-bold shrink-0"><i data-lucide="plus" class="w-3 h-3"></i></button>
            </div>
        </div>
    `;
    return html;
}

function smartRender() {
    updateGlobalData();
    switch(activeTab) {
        case 'dashboard': renderDashboard(); break;
        case 'tasks': renderTasks(); break;
        case 'companies': renderCompaniesView(); renderCategoryTasksSubPanel(); break;
        case 'settings': renderSettingsTab(); break;
    }
    requestAnimationFrame(() => lucide.createIcons());
}

function renderDashboard() {
    let totalAmount = 0, pending = 0, completed = 0, urgentTasks = [];
    
    state.tasks.forEach(t => {
        totalAmount += Number(t.amount || 0);
        if(t.status === 'pending') {
            pending++;
            if(t.priority === 'Cao') urgentTasks.push(t);
        } else if (t.status === 'completed') {
            completed++;
        }
    });

    const totalTasks = state.tasks.length;
    const pct = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

    document.getElementById('stat-total-amount').innerText = totalAmount.toLocaleString('vi-VN') + ' ₫';
    document.getElementById('stat-total-tasks').innerText = totalTasks;
    document.getElementById('stat-pending-tasks').innerText = pending;
    document.getElementById('stat-completed-tasks').innerText = completed;
    document.getElementById('progress-percentage').innerText = pct + '%';
    document.getElementById('progress-bar').style.width = pct + '%';

    const urgentContainer = document.getElementById('dashboard-urgent-tasks');
    if(urgentContainer) {
        if(urgentTasks.length === 0) {
            urgentContainer.innerHTML = `<div class="text-center py-2 text-slate-400 text-xs">Không có đầu việc khẩn cấp.</div>`;
        } else {
            urgentContainer.innerHTML = urgentTasks.map(t => `
                <div class="p-2.5 bg-rose-50 dark:bg-rose-950/20 rounded-xl border border-rose-100 flex justify-between items-center text-xs">
                    <span class="font-bold truncate max-w-[70%]">${t.title}</span>
                    <span class="text-rose-600 font-extrabold">${Number(t.amount||0).toLocaleString('vi-VN')} ₫</span>
                </div>
            `).join('');
        }
    }

    const projProgress = document.getElementById('dashboard-projects-progress');
    if(projProgress) {
        projProgress.innerHTML = state.companies.map(c => {
            const compTasks = state.tasks.filter(t => t.companyId === c.id);
            const compCompleted = compTasks.filter(t => t.status === 'completed').length;
            const compPct = compTasks.length > 0 ? Math.round((compCompleted / compTasks.length) * 100) : 0;
            return `
                <div class="space-y-1 text-xs">
                    <div class="flex justify-between font-semibold">
                        <span class="truncate">${c.name}</span>
                        <span>${compPct}%</span>
                    </div>
                    <div class="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div class="bg-primary-500 h-full" style="width: ${compPct}%"></div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

function setTaskFilter(filter) {
    currentFilter = filter;
    const buttons = document.querySelectorAll('#task-filter-group button');
    buttons.forEach(b => {
        b.className = "flex items-center gap-2 py-1.5 px-3 rounded-md transition-all hover:text-slate-900 dark:hover:text-white";
        const span = b.querySelector('span');
        if(span) span.className = "bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs text-slate-600 dark:text-slate-400 font-bold ml-0.5";
    });

    const targetBtn = document.querySelector(`#task-filter-group button[data-filter="${filter}"]`);
    if (targetBtn) {
        targetBtn.className = "flex items-center gap-2 py-1.5 px-3 rounded-md transition-all bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 font-semibold";
        const targetSpan = targetBtn.querySelector('span');
        if(targetSpan) targetSpan.className = "bg-emerald-200/60 dark:bg-emerald-800 px-1.5 py-0.5 rounded text-xs text-emerald-800 dark:text-emerald-200 font-bold ml-0.5";
    }
    smartRender();
}

function renderTasks() {
    const search = document.getElementById('task-search-input').value.toLowerCase();
    const sortOrder = document.getElementById('task-sort-select').value;
    const container = document.getElementById('tasks-list');
    if(!container) return;
    
    if (taskViewMode === 'grid') {
        container.className = "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4";
    } else {
        container.className = "flex flex-col gap-3";
    }

    const companyMap = Object.fromEntries(state.companies.map(c => [c.id, c.name]));

    let filtered = state.tasks.filter(t => {
        const matchStr = t.title.toLowerCase().includes(search) || 
                         (t.notes && t.notes.toLowerCase().includes(search)) ||
                         (t.contractor && t.contractor.toLowerCase().includes(search));
        if(currentFilter === 'pending') return matchStr && t.status === 'pending';
        if(currentFilter === 'completed') return matchStr && t.status === 'completed';
        if(currentFilter === 'urgent') return matchStr && t.priority === 'Cao' && t.status === 'pending';
        return matchStr;
    });

    filtered.sort((a, b) => {
        const dateA = new Date(a.dueDate);
        const dateB = new Date(b.dueDate);
        return sortOrder === 'date-desc' ? dateB - dateA : dateA - dateB;
    });

    if(filtered.length === 0) {
        container.innerHTML = `<div class="col-span-full text-center text-slate-400 py-6 text-xs">Không có hồ sơ nào tương ứng bộ lọc hiện tại.</div>`;
        return;
    }

    container.innerHTML = filtered.map(t => {
        const compName = companyMap[t.companyId] || 'N/A';
        
        if (taskViewMode === 'grid') {
            return `
                <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between shadow-sm hover:shadow transition-all">
                    <div>
                        <div class="flex justify-between text-[10px] mb-2">
                            <span class="px-2 py-0.5 rounded font-bold ${t.priority==='Cao'?'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400':'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}">${t.priority}</span>
                            <span class="font-bold ${t.status==='completed'?'text-emerald-600':'text-amber-500'}">${t.status==='completed'?'Đã hoàn thành':'Chờ xử lý'}</span>
                        </div>
                        <h4 class="font-bold text-sm mb-1 text-slate-900 dark:text-white line-clamp-1">${t.title}</h4>
                        <p class="text-[10px] text-slate-400 mb-2 truncate">${compName} ${t.contractor ? `| Đối tác: ${t.contractor}` : ''}</p>
                        <div class="bg-slate-50 dark:bg-slate-900 p-2 rounded-lg mb-2 flex justify-between items-center border border-slate-100 dark:border-slate-800">
                            <span class="font-extrabold text-emerald-600">${Number(t.amount||0).toLocaleString('vi-VN')} ₫</span>
                            <span class="text-[9px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border dark:border-slate-700 font-semibold">${t.invoiceStatus}</span>
                        </div>
                        <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">${t.notes || 'Không ghi chú.'}</p>
                        
                        ${getSubtaskHTMLBlock(t)}
                    </div>
                    <div class="border-t dark:border-slate-700 pt-2 mt-3 flex justify-between items-center text-[11px] text-slate-400">
                        <span class="flex items-center gap-1"><i data-lucide="calendar" class="w-3 h-3"></i> Hạn: ${t.dueDate}</span>
                        <div class="flex gap-2">
                            <button onclick="editTask('${t.id}')" class="text-blue-500 hover:underline">Sửa</button>
                            <button onclick="deleteTask('${t.id}')" class="text-rose-500 hover:underline">Xóa</button>
                            ${t.status === 'pending' ? `<button onclick="quickComplete('${t.id}')" class="px-2 py-0.5 bg-primary-600 text-white rounded font-bold text-[10px]">Duyệt xong</button>` : ''}
                        </div>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col shadow-sm hover:shadow transition-all gap-3">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div class="flex-1 min-w-0 space-y-1">
                            <div class="flex items-center gap-2 text-[10px]">
                                <span class="px-2 py-0.5 rounded font-bold ${t.priority==='Cao'?'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400':'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}">${t.priority}</span>
                                <span class="font-bold ${t.status==='completed'?'text-emerald-600':'text-amber-500'}">${t.status==='completed'?'Đã hoàn thành':'Chờ xử lý'}</span>
                                <span class="text-slate-300 dark:text-slate-600">|</span>
                                <span class="flex items-center gap-1 text-slate-400"><i data-lucide="calendar" class="w-3 h-3"></i> Hạn: ${t.dueDate}</span>
                            </div>
                            <h4 class="font-bold text-sm text-slate-900 dark:text-white truncate">${t.title}</h4>
                            <p class="text-[10px] text-slate-400 truncate">${compName} ${t.contractor ? `| Đối tác: ${t.contractor}` : ''}</p>
                            <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">${t.notes || 'Không ghi chú.'}</p>
                        </div>
                        <div class="flex flex-row items-center justify-between sm:justify-end gap-4 shrink-0 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-700">
                            <div class="bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg flex flex-col items-start sm:items-end border border-slate-100 dark:border-slate-800 min-w-[140px]">
                                <span class="font-extrabold text-emerald-600 text-xs sm:text-sm">${Number(t.amount||0).toLocaleString('vi-VN')} ₫</span>
                                <span class="text-[9px] text-slate-400 font-semibold mt-0.5">${t.invoiceStatus}</span>
                            </div>
                            <div class="flex gap-3 text-[11px] shrink-0">
                                <button onclick="editTask('${t.id}')" class="text-blue-500 hover:underline">Sửa</button>
                                <button onclick="deleteTask('${t.id}')" class="text-rose-500 hover:underline">Xóa</button>
                                ${t.status === 'pending' ? `<button onclick="quickComplete('${t.id}')" class="px-2 py-0.5 bg-primary-600 text-white rounded font-bold text-[10px] shadow-sm">Duyệt xong</button>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="max-w-2xl">
                        ${getSubtaskHTMLBlock(t)}
                    </div>
                </div>
            `;
        }
    }).join('');
}

function selectCategoryToViewTasks(catId) {
    selectedCategoryId = catId;
    smartRender();
}

function renderCategoryTasksSubPanel() {
    if (activeTab !== 'companies') return;

    const titleEl = document.getElementById('selected-cat-name-title');
    const countEl = document.getElementById('selected-cat-count');
    const listContainer = document.getElementById('company-tasks-list');
    if(!listContainer) return;

    const targetCat = state.categories.find(c => c.id === selectedCategoryId);
    if(!targetCat) {
        titleEl.innerText = "Chọn một hạng mục nghiệp vụ";
        countEl.innerText = "0 công việc";
        listContainer.innerHTML = `<div class="col-span-full text-center text-slate-400 py-6 text-xs italic">Vui lòng bấm chọn một hạng mục ở lưới phía trên để tra cứu hồ sơ.</div>`;
        return;
    }

    titleEl.innerText = targetCat.name;
    const subTasks = state.tasks.filter(t => t.companyId === selectedCompanyId && t.categoryId === selectedCategoryId);
    countEl.innerText = `${subTasks.length} công việc`;

    if(subTasks.length === 0) {
        listContainer.innerHTML = `<div class="col-span-full text-center text-slate-400 py-8 text-xs italic">Hạng mục này hiện tại không có đầu việc nào.</div>`;
        return;
    }

    listContainer.innerHTML = subTasks.map(t => `
        <div class="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md transition-all space-y-3">
            <div class="flex items-center justify-between">
                <span class="text-[9px] px-2 py-0.5 font-bold rounded ${t.priority === 'Cao' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}">${t.priority}</span>
                <span class="text-[10px] font-bold ${t.status === 'completed' ? 'text-emerald-600' : 'text-amber-500'}">
                    ${t.status === 'completed' ? 'Đã hoàn thành' : 'Đang chờ'}
                </span>
            </div>
            <div>
                <h5 class="text-sm font-bold text-slate-900 dark:text-white">${t.title}</h5>
                ${t.contractor ? `<p class="text-[11px] font-medium text-slate-600 dark:text-slate-400 mt-0.5">Nhà thầu: ${t.contractor}</p>` : ''}
                <p class="text-[11px] text-slate-500 mt-1 line-clamp-2">${t.notes || 'Không có ghi chú.'}</p>
            </div>
            <div class="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <span class="font-bold text-emerald-600 text-xs">${Number(t.amount || 0).toLocaleString('vi-VN')} ₫</span>
                <div class="flex gap-1">
                    <button onclick="editTask('${t.id}')" class="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 rounded">
                        <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
                    </button>
                    <button onclick="deleteTask('${t.id}')" class="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 rounded">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    </button>
                    ${t.status === 'pending' ? `
                        <button onclick="quickComplete('${t.id}')" class="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 rounded">
                            <i data-lucide="check-circle" class="w-3.5 h-3.5"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

function renderCompaniesView() {
    if (activeTab !== 'companies') return;

    const listContainer = document.getElementById('company-tab-list');
    const boardContainer = document.getElementById('company-categories-board');
    
    listContainer.innerHTML = state.companies.map(c => {
        const isActive = selectedCompanyId === c.id;
        const compTasksCount = state.tasks.filter(t => t.companyId === c.id).length;
        return `
            <button onclick="selectedCompanyId='${c.id}'; selectedCategoryId=''; smartRender();" 
                class="px-4 py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5
                ${isActive ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'}">
                <span>${c.name}</span>
                <span class="px-1.5 py-0.5 rounded text-[10px] font-extrabold ${isActive ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}">${compTasksCount}</span>
            </button>
        `;
    }).join('');

    const activeCategories = state.categories.filter(cat => cat.companyId === selectedCompanyId);

    if (activeCategories.length === 0) {
        boardContainer.innerHTML = `<div class="col-span-full text-center text-slate-400 py-8 text-xs italic">Chưa có hạng mục nghiệp vụ nào được thiết lập.</div>`;
        return;
    }

    boardContainer.innerHTML = activeCategories.map(cat => {
        const tasksInCat = state.tasks.filter(t => t.companyId === selectedCompanyId && t.categoryId === cat.id);
        const totalAmount = tasksInCat.reduce((sum, t) => sum + Number(t.amount || 0), 0);
        const isSelected = selectedCategoryId === cat.id;

        return `
            <div onclick="selectCategoryToViewTasks('${cat.id}')" 
                class="p-5 rounded-2xl border bg-white dark:bg-slate-800 flex items-center justify-between cursor-pointer transition-all duration-150 hover:shadow-md hover:scale-[1.01]
                ${isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md dark:border-emerald-400' : 'border-slate-200 dark:border-slate-700 shadow-sm'}">
                <div class="flex items-start gap-3 min-w-0">
                    <span class="w-3 h-3 rounded-full border mt-1 shrink-0 transition-colors ${isSelected ? 'bg-emerald-500 border-emerald-600' : 'bg-slate-100 border-slate-200 dark:bg-slate-700 dark:border-slate-600'}"></span>
                    <div class="min-w-0">
                        <h4 class="font-bold text-sm text-slate-900 dark:text-white truncate pr-2">${cat.name}</h4>
                        <p class="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">${totalAmount.toLocaleString('vi-VN')} ₫</p>
                    </div>
                </div>
                <span class="bg-slate-50 dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 shrink-0">
                    ${tasksInCat.length} việc
                </span>
            </div>
        `;
    }).join('');
}

function renderSettingsTab() {
    if (!configSelectedCompanyId && state.companies.length > 0) configSelectedCompanyId = state.companies[0].id;

    const selectDropdown = document.getElementById('cfg-company-select');
    if (selectDropdown) {
        selectDropdown.innerHTML = state.companies.map(c => `<option value="${c.id}" ${c.id === configSelectedCompanyId ? 'selected' : ''}>${c.name}</option>`).join('');
    }

    const activeCompany = state.companies.find(c => c.id === configSelectedCompanyId);
    const titleSpan = document.getElementById('cfg-selected-company-title');
    if (titleSpan) titleSpan.innerText = activeCompany ? activeCompany.name : '...';

    const compContainer = document.getElementById('cfg-companies-list');
    if (compContainer) {
        compContainer.innerHTML = state.companies.map(c => `
            <div class="group flex justify-between items-center px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-200 shadow-sm">
                <span class="truncate pr-2">${c.name}</span>
                <button onclick="deleteCompanyConfig('${c.id}')" class="text-rose-500 opacity-0 group-hover:opacity-100 hover:underline transition-opacity text-[11px] font-normal shrink-0">Xóa</button>
            </div>
        `).join('');
    }

    const catContainer = document.getElementById('cfg-categories-grid');
    if (catContainer) {
        const displayCats = state.categories.filter(cat => cat.companyId === configSelectedCompanyId);
        if (displayCats.length === 0) {
            catContainer.innerHTML = `<div class="col-span-2 text-center py-6 text-slate-400 text-xs italic">Chưa có hạng mục nào cho đơn vị này.</div>`;
        } else {
            catContainer.innerHTML = displayCats.map(cat => `
                <div class="group flex justify-between items-center px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-xs text-slate-700 dark:text-slate-200 shadow-sm">
                    <span class="truncate pr-2">${cat.name}</span>
                    <button onclick="deleteCategoryConfig('${cat.id}')" class="text-rose-500 opacity-0 group-hover:opacity-100 hover:underline transition-opacity text-[11px] shrink-0">Xóa</button>
                </div>
            `).join('');
        }
    }
}

function onConfigCompanyChange() { configSelectedCompanyId = document.getElementById('cfg-company-select').value; smartRender(); }

// --- CÁC HÀM THAO TÁC DOANH NGHIỆP / HẠNG MỤC GHI XUỐNG SQLITE ---
async function addCompanyConfig() {
    const input = document.getElementById('cfg-company-input');
    const name = input.value.trim();
    if (!name) return;
    
    await window.electronAPI.addCompany({ name: name.toUpperCase() });
    input.value = ''; 
    await loadDataFromSQLite();
}

async function addCategoryConfig() {
    const input = document.getElementById('cfg-category-input');
    const name = input.value.trim();
    if (!name || !configSelectedCompanyId) return;

    await window.electronAPI.addCategory({ name: name, company_id: configSelectedCompanyId });
    input.value = ''; 
    await loadDataFromSQLite();
}

async function deleteCompanyConfig(id) {
    if (confirm('Xóa công ty này sẽ xóa toàn bộ danh mục và công việc trực thuộc trên CSDL?')) {
        await window.electronAPI.deleteCompany(id);
        selectedCategoryId = '';
        await loadDataFromSQLite();
    }
}

async function deleteCategoryConfig(id) {
    if (confirm('Xóa hạng mục kiểm toán này?')) {
        await window.electronAPI.deleteCategory(id);
        if (selectedCategoryId === id) selectedCategoryId = '';
        await loadDataFromSQLite();
    }
}

function openQuickTaskModal() {
    document.getElementById('form-task-id').value = '';
    document.getElementById('task-form').reset();
    const compSelect = document.getElementById('form-company');
    compSelect.innerHTML = state.companies.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
    updateFormCategories();
    document.getElementById('task-modal').classList.remove('hidden');
}

function updateFormCategories() {
    const compId = document.getElementById('form-company').value;
    const catSelect = document.getElementById('form-category');
    catSelect.innerHTML = state.categories.filter(cat => cat.companyId === compId).map(cat=>`<option value="${cat.id}">${cat.name}</option>`).join('');
}

function closeQuickTaskModal() { document.getElementById('task-modal').classList.add('hidden'); }

// --- LƯU HOẶC SỬA HỒ SƠ VIỆC TRỰC TIẾP XUỐNG SQLITE ---
async function saveTaskData(e) {
    e.preventDefault();
    const id = document.getElementById('form-task-id').value;
    const existingTask = id ? state.tasks.find(t => t.id === id) : null;
    
    const target = {
        id: id || null, // Nếu null, SQLite tự tạo ID
        title: document.getElementById('form-title').value,
        companyId: document.getElementById('form-company').value,
        categoryId: document.getElementById('form-category').value,
        amount: Number(document.getElementById('form-amount').value || 0),
        dueDate: document.getElementById('form-date').value,
        priority: document.getElementById('form-priority').value,
        invoiceStatus: document.getElementById('form-invoice').value,
        contractor: document.getElementById('form-contractor').value,
        notes: document.getElementById('form-notes').value,
        status: document.getElementById('form-status').value,
        subtasks: existingTask ? (existingTask.subtasks || []) : []
    };

    // Chuẩn bị payload chuẩn hóa tên trường tương thích với SQLite Database
    const dbPayload = {
        id: target.id,
        title: target.title,
        company_id: target.companyId,
        category_id: target.categoryId,
        amount: target.amount,
        due_date: target.dueDate,
        priority: target.priority,
        invoice_status: target.invoiceStatus,
        contractor: target.contractor,
        notes: target.notes,
        status: target.status,
        subtasks: target.subtasks.map(s => ({
            id: s.id,
            text: s.text,
            completed: s.completed ? 1 : 0
        }))
    };

    await window.electronAPI.saveTask(dbPayload);
    closeQuickTaskModal(); 
    await loadDataFromSQLite();
}

function editTask(id) {
    const t = state.tasks.find(item => item.id === id); if(!t) return;
    openQuickTaskModal();
    document.getElementById('form-task-id').value = t.id;
    document.getElementById('form-title').value = t.title;
    document.getElementById('form-company').value = t.companyId;
    updateFormCategories();
    document.getElementById('form-category').value = t.categoryId;
    document.getElementById('form-amount').value = t.amount;
    document.getElementById('form-date').value = t.dueDate;
    document.getElementById('form-priority').value = t.priority;
    document.getElementById('form-invoice').value = t.invoiceStatus;
    document.getElementById('form-status').value = t.status;
    document.getElementById('form-contractor').value = t.contractor || '';
    document.getElementById('form-notes').value = t.notes || '';
}

async function deleteTask(id) {
    if(confirm('Xóa hồ sơ nghiệp vụ này khỏi cơ sở dữ liệu?')) { 
        await window.electronAPI.deleteTask(id);
        await loadDataFromSQLite();
    }
}

async function quickComplete(id) {
    await window.electronAPI.quickCompleteTask(id);
    await loadDataFromSQLite();
}

// Giữ nguyên các hàm bổ trợ Import/Export dạng file backup cục bộ
function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 4));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `SO_NGHIEP_VU_SQLITE_BACKUP_${new Date().toISOString().slice(0,10)}.json`);
    dlAnchor.click();
}

// Kích hoạt khi chạy ứng dụng
window.onload = () => { 
    initClock();
    loadDataFromSQLite(); 
};