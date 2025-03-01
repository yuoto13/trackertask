// Глобальные переменные для работы с задачами
const TASKS_KEY = 'task_tracker_tasks';
let tasks = [];

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Загружаем задачи при загрузке дашборда
    if (document.querySelector('.kanban-board')) {
        loadTasks();
        renderTasks();
        setupTaskListeners();
    }
});

// Загрузка задач из localStorage
function loadTasks() {
    tasks = JSON.parse(localStorage.getItem(TASKS_KEY) || '[]');
}

// Сохранение задач в localStorage
function saveTasks() {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

// Отображение задач на доске
function renderTasks() {
    // Очищаем контейнеры задач
    document.querySelectorAll('.tasks-container').forEach(container => {
        container.innerHTML = '';
    });
    
    // Отображаем задачи в соответствующих колонках
    tasks.forEach(task => {
        const taskElement = createTaskElement(task);
        const containerId = `${task.status}-tasks`;
        document.getElementById(containerId)?.appendChild(taskElement);
    });
    
    // Обновляем выпадающий список исполнителей
    updateAssigneeFilter();
}

// Создание элемента задачи на основе шаблона
function createTaskElement(task) {
    const template = document.getElementById('task-template');
    const taskElement = document.importNode(template.content, true).querySelector('.task-card');
    
    // Устанавливаем ID задачи как атрибут данных
    taskElement.setAttribute('data-task-id', task.id);
    
    // Заполняем данные
    taskElement.querySelector('.task-id').textContent = task.id;
    taskElement.querySelector('.task-title').textContent = task.title;
    taskElement.querySelector('.task-assignee .value').textContent = task.assignee || 'Не назначено';
    
    // Форматируем дату, если она есть
    const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Не указано';
    taskElement.querySelector('.task-due-date .value').textContent = dueDate;
    
    // Если есть прикрепленные файлы
    if (task.attachments && task.attachments.length > 0) {
        taskElement.querySelector('.task-attachments-indicator').textContent = 
            `Прикрепленные файлы: ${task.attachments.length}`;
    }
    
    // Обработчики событий для кнопок
    taskElement.querySelector('.edit-task-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openTaskModal(task.id);
    });
    
    taskElement.querySelector('.delete-task-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
            deleteTask(task.id);
        }
    });
    
    // Добавляем обработчики для drag-and-drop
    taskElement.addEventListener('dragstart', handleDragStart);
    taskElement.addEventListener('dragend', handleDragEnd);
    
    // Добавляем обработчик для открытия модального окна по клику на карточку
    taskElement.addEventListener('click', () => {
        openTaskModal(task.id);
    });
    
    return taskElement;
}

// Установка всех необходимых обработчиков событий
function setupTaskListeners() {
    // Обработчик для кнопки создания задачи
    const addTaskBtn = document.getElementById('add-task-btn');
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', () => {
            openTaskModal();
        });
    }
    
    // Обработчик для формы задачи
    const taskForm = document.getElementById('task-form');
    if (taskForm) {
        taskForm.addEventListener('submit', handleTaskFormSubmit);
    }
    
    // Обработчики для закрытия модального окна
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeTaskModal);
    });
    
    // Обработчики для drag-and-drop на контейнерах задач
    document.querySelectorAll('.tasks-container').forEach(container => {
        container.addEventListener('dragover', handleDragOver);
        container.addEventListener('dragleave', handleDragLeave);
        container.addEventListener('drop', handleDrop);
    });
    
    // Обработчики для фильтров
    const statusFilter = document.getElementById('filter-status');
    const assigneeFilter = document.getElementById('filter-assignee');
    
    if (statusFilter) {
        statusFilter.addEventListener('change', filterTasks);
    }
    
    if (assigneeFilter) {
        assigneeFilter.addEventListener('change', filterTasks);
    }
}

// Обработчик отправки формы задачи
function handleTaskFormSubmit(e) {
    e.preventDefault();
    
    const taskId = document.getElementById('task-id').value;
    const title = document.getElementById('task-title').value;
    const status = document.getElementById('task-status').value;
    const assignee = document.getElementById('task-assignee').value;
    const dueDate = document.getElementById('task-due-date').value;
    const description = document.getElementById('task-description').value;
    
    // Получаем прикрепленные файлы 
    // (в реальном приложении здесь будет загрузка файлов на сервер)
    const fileInput = document.getElementById('task-attachments');
    const attachments = Array.from(fileInput.files).map(file => {
        return {
            name: file.name,
            type: file.type,
            size: file.size,
            // В реальном приложении здесь был бы URL файла на сервере
            url: URL.createObjectURL(file) 
        };
    });
    
    if (taskId) {
        // Обновляем существующую задачу
        updateTask(taskId, {
            title,
            status,
            assignee,
            dueDate,
            description,
            attachments: [...getExistingAttachments(taskId), ...attachments]
        });
    } else {
        // Создаем новую задачу
        createTask({
            title,
            status,
            assignee,
            dueDate,
            description,
            attachments
        });
    }
    
    closeTaskModal();
    showNotification('Задача сохранена успешно!', 'success');
}

// Получить существующие прикрепленные файлы задачи
function getExistingAttachments(taskId) {
    const task = tasks.find(t => t.id === taskId);
    return task && task.attachments ? task.attachments : [];
}

// Создание новой задачи
function createTask(taskData) {
    const currentUser = window.auth.getCurrentUser();
    
    const newTask = {
        id: generateTaskId(),
        ...taskData,
        createdBy: currentUser.username,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    tasks.push(newTask);
    saveTasks();
    renderTasks();
}

// Обновление существующей задачи
function updateTask(taskId, taskData) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex !== -1) {
        tasks[taskIndex] = {
            ...tasks[taskIndex],
            ...taskData,
            updatedAt: new Date().toISOString()
        };
        
        saveTasks();
        renderTasks();
    }
}

// Удаление задачи
function deleteTask(taskId) {
    tasks = tasks.filter(t => t.id !== taskId);
    saveTasks();
    renderTasks();
    showNotification('Задача удалена', 'success');
}

// Генерация ID задачи в формате TTW-X
function generateTaskId() {
    const prefix = 'TTW-';
    // Находим максимальный ID
    let maxNumber = 0;
    
    tasks.forEach(task => {
        if (task.id.startsWith(prefix)) {
            const num = parseInt(task.id.substring(prefix.length));
            if (!isNaN(num) && num > maxNumber) {
                maxNumber = num;
            }
        }
    });
    
    return `${prefix}${maxNumber + 1}`;
}

// Открытие модального окна для создания/редактирования задачи
function openTaskModal(taskId = null) {
    const modal = document.getElementById('task-modal');
    const form = document.getElementById('task-form');
    const modalTitle = document.getElementById('modal-title');
    const attachmentsPreview = document.getElementById('attachments-preview');
    
    // Очищаем форму
    form.reset();
    document.getElementById('task-id').value = '';
    attachmentsPreview.innerHTML = '';
    
    if (taskId) {
        // Редактирование существующей задачи
        const task = tasks.find(t => t.id === taskId);
        
        if (task) {
            modalTitle.textContent = `Редактирование задачи ${task.id}`;
            
            // Заполняем поля формы
            document.getElementById('task-id').value = task.id;
            document.getElementById('task-title').value = task.title;
            document.getElementById('task-status').value = task.status;
            document.getElementById('task-assignee').value = task.assignee || '';
            
            if (task.dueDate) {
                document.getElementById('task-due-date').value = task.dueDate;
            }
            
            document.getElementById('task-description').value = task.description || '';
            
            // Показываем прикрепленные файлы
            if (task.attachments && task.attachments.length > 0) {
                task.attachments.forEach(attachment => {
                    const attachmentEl = document.createElement('div');
                    attachmentEl.className = 'attachment-item';
                    
                    if (attachment.type.startsWith('image/')) {
                        const img = document.createElement('img');
                        img.src = attachment.url;
                        img.alt = attachment.name;
                        attachmentEl.appendChild(img);
                    } else {
                        const fileEl = document.createElement('div');
                        fileEl.className = 'attachment-file';
                        fileEl.textContent = attachment.name;
                        attachmentEl.appendChild(fileEl);
                    }
                    
                    attachmentsPreview.appendChild(attachmentEl);
                });
            }
        }
    } else {
        // Создание новой задачи
        modalTitle.textContent = 'Новая задача';
        
        // Устанавливаем статус "Новая" по умолчанию
        document.getElementById('task-status').value = 'new';
        
        // Устанавливаем текущего пользователя как исполнителя по умолчанию
        const currentUser = window.auth.getCurrentUser();
        if (currentUser) {
            document.getElementById('task-assignee').value = currentUser.username;
        }
    }
    
    // Открываем модальное окно
    modal.classList.add('open');
}

// Закрытие модального окна
function closeTaskModal() {
    const modal = document.getElementById('task-modal');
    modal.classList.remove('open');
}

// Обновление фильтра исполнителей
function updateAssigneeFilter() {
    const assigneeFilter = document.getElementById('filter-assignee');
    if (!assigneeFilter) return;
    
    // Сохраняем текущее значение
    const currentValue = assigneeFilter.value;
    
    // Очищаем список, оставляя только опцию "Все"
    while (assigneeFilter.options.length > 1) {
        assigneeFilter.remove(1);
    }
    
    // Получаем уникальный список исполнителей
    const assignees = [...new Set(
        tasks
            .map(task => task.assignee)
            .filter(assignee => assignee) // Удаляем пустые значения
    )];
    
    // Добавляем исполнителей в список
    assignees.forEach(assignee => {
        const option = document.createElement('option');
        option.value = assignee;
        option.textContent = assignee;
        assigneeFilter.appendChild(option);
    });
    
    // Восстанавливаем значение, если оно есть в списке
    if (assignees.includes(currentValue)) {
        assigneeFilter.value = currentValue;
    }
}

// Фильтрация задач
function filterTasks() {
    const statusFilter = document.getElementById('filter-status');
    const assigneeFilter = document.getElementById('filter-assignee');
    
    if (!statusFilter || !assigneeFilter) return;
    
    const statusValue = statusFilter.value;
    const assigneeValue = assigneeFilter.value;
    
    // Скрываем все задачи
    document.querySelectorAll('.task-card').forEach(card => {
        card.style.display = 'none';
    });
    
    // Фильтруем задачи и показываем соответствующие
    tasks.forEach(task => {
        // Проверяем, соответствует ли задача фильтрам
        const statusMatch = statusValue === 'all' || task.status === statusValue;
        const assigneeMatch = assigneeValue === 'all' || task.assignee === assigneeValue;
        
        if (statusMatch && assigneeMatch) {
            const taskElement = document.querySelector(`.task-card[data-task-id="${task.id}"]`);
            if (taskElement) {
                taskElement.style.display = 'block';
            }
        }
    });
}

// Обработчики для drag-and-drop
function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.getAttribute('data-task-id'));
    e.target.classList.add('dragging');
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const taskId = e.dataTransfer.getData('text/plain');
    const newStatus = e.currentTarget.id.replace('-tasks', '');
    
    // Обновляем статус задачи
    updateTask(taskId, { status: newStatus });
}

// Экспорт функций для использования в других модулях
window.tasks = {
    createTask,
    updateTask,
    deleteTask,
    openTaskModal,
    closeTaskModal
};