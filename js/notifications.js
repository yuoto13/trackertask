// Функция для отображения уведомления
function showNotification(message, type = 'info', duration = 3000) {
    const notificationElement = document.getElementById('notification');
    
    if (!notificationElement) return;
    
    // Устанавливаем текст сообщения
    notificationElement.textContent = message;
    
    // Устанавливаем класс типа уведомления
    notificationElement.className = 'notification';
    notificationElement.classList.add(type);
    
    // Показываем уведомление
    notificationElement.classList.add('show');
    
    // Скрываем уведомление через указанное время
    setTimeout(() => {
        notificationElement.classList.remove('show');
    }, duration);
}

// Функция для отправки email-уведомления (имитация)
function sendEmailNotification(recipient, subject, body) {
    // В реальном приложении здесь был бы код для отправки email через API
    console.log(`Email notification:
        To: ${recipient}
        Subject: ${subject}
        Body: ${body}`);
    
    // Показываем уведомление пользователю
    showNotification('Уведомление отправлено на email', 'success');
}

// Функция для уведомления о новой задаче
function notifyNewTask(task) {
    if (!task || !task.assignee) return;
    
    // Находим email исполнителя
    const assigneeEmail = findUserEmail(task.assignee);
    
    if (assigneeEmail) {
        const subject = `Вам назначена новая задача: ${task.id}`;
        const body = `
            Вам назначена новая задача: ${task.title}
            ID: ${task.id}
            Срок выполнения: ${task.dueDate || 'Не указан'}
            Описание: ${task.description || 'Нет описания'}
        `;
        
        sendEmailNotification(assigneeEmail, subject, body);
    }
}

// Функция для уведомления об изменении статуса задачи
function notifyTaskStatusChange(task, oldStatus) {
    if (!task || !task.assignee) return;
    
    const assigneeEmail = findUserEmail(task.assignee);
    
    if (assigneeEmail) {
        const subject = `Изменение статуса задачи: ${task.id}`;
        const body = `
            Статус задачи "${task.title}" был изменен с "${oldStatus}" на "${task.status}".
            ID: ${task.id}
            Срок выполнения: ${task.dueDate || 'Не указан'}
            Описание: ${task.description || 'Нет описания'}
        `;
        
        sendEmailNotification(assigneeEmail, subject, body);
        
        // Показываем уведомление в интерфейсе
        showNotification(`Статус задачи #${task.id} изменен на "${task.status}"`, 'info');
        
        // Если задача выполнена, отправляем уведомление менеджеру
        if (task.status === 'Выполнено') {
            notifyManagerTaskCompleted(task);
        }
    }
}

// Функция для уведомления менеджера о выполнении задачи
function notifyManagerTaskCompleted(task) {
    if (!task || !task.manager) return;
    
    const managerEmail = findUserEmail(task.manager);
    
    if (managerEmail) {
        const subject = `Задача выполнена: ${task.id}`;
        const body = `
            Задача "${task.title}" выполнена исполнителем ${task.assignee}.
            ID: ${task.id}
            Требуется проверка.
        `;
        
        sendEmailNotification(managerEmail, subject, body);
    }
}

// Функция для уведомления о приближающемся сроке выполнения
function notifyTaskDueDateApproaching(task) {
    if (!task || !task.assignee || !task.dueDate) return;
    
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    const timeDiff = dueDate - now;
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    // Уведомляем за 2 дня до срока выполнения
    if (daysDiff === 2) {
        const assigneeEmail = findUserEmail(task.assignee);
        
        if (assigneeEmail) {
            const subject = `Напоминание о сроке выполнения задачи: ${task.id}`;
            const body = `
                До срока выполнения задачи "${task.title}" осталось 2 дня.
                ID: ${task.id}
                Срок выполнения: ${task.dueDate}
                Текущий статус: ${task.status}
            `;
            
            sendEmailNotification(assigneeEmail, subject, body);
            
            // Показываем уведомление в интерфейсе
            showNotification(`До срока выполнения задачи #${task.id} осталось 2 дня`, 'warning');
        }
    }
}

// Функция для уведомления о просроченной задаче
function notifyTaskOverdue(task) {
    if (!task || !task.assignee || !task.dueDate) return;
    
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    
    if (now > dueDate && task.status !== 'Выполнено') {
        const assigneeEmail = findUserEmail(task.assignee);
        const managerEmail = findUserEmail(task.manager);
        
        // Уведомляем исполнителя
        if (assigneeEmail) {
            const subject = `Задача просрочена: ${task.id}`;
            const body = `
                Срок выполнения задачи "${task.title}" истек!
                ID: ${task.id}
                Срок выполнения: ${task.dueDate}
                Пожалуйста, завершите работу как можно скорее или обновите статус.
            `;
            
            sendEmailNotification(assigneeEmail, subject, body);
        }
        
        // Уведомляем менеджера
        if (managerEmail) {
            const subject = `Уведомление о просроченной задаче: ${task.id}`;
            const body = `
                Задача "${task.title}" просрочена.
                ID: ${task.id}
                Исполнитель: ${task.assignee}
                Срок выполнения: ${task.dueDate}
            `;
            
            sendEmailNotification(managerEmail, subject, body);
        }
        
        // Показываем уведомление в интерфейсе
        showNotification(`Задача #${task.id} просрочена!`, 'error');
    }
}

// Функция для уведомления о комментарии к задаче
function notifyTaskComment(task, comment, author) {
    if (!task || !task.assignee) return;
    
    // Находим всех участников задачи
    const participants = getTaskParticipants(task);
    
    // Отправляем уведомления всем участникам, кроме автора комментария
    participants.forEach(participant => {
        if (participant !== author) {
            const participantEmail = findUserEmail(participant);
            
            if (participantEmail) {
                const subject = `Новый комментарий к задаче: ${task.id}`;
                const body = `
                    Пользователь ${author} оставил комментарий к задаче "${task.title}":
                    "${comment}"
                    
                    ID задачи: ${task.id}
                `;
                
                sendEmailNotification(participantEmail, subject, body);
            }
        }
    });
    
    // Показываем уведомление в интерфейсе
    showNotification(`Добавлен новый комментарий к задаче #${task.id}`, 'info');
}