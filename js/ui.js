// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Инициализируем модальные окна
    initModals();
});

// Инициализация модальных окон
function initModals() {
    // Получаем все модальные окна
    const modals = document.querySelectorAll('.modal');
    
    // Добавляем обработчик для закрытия модальных окон по клику на фон
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('open');
            }
        });
    });
    
    // Добавляем обработчик для закрытия по клавише Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            modals.forEach(modal => {
                modal.classList.remove('open');
            });
        }
    });
}

// Показать модальное окно
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('open');
    }
}

// Скрыть модальное окно
function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('open');
    }
}

// Создать и отобразить элемент для предпросмотра файла
function createFilePreview(file) {
    const previewContainer = document.createElement('div');
    previewContainer.className = 'attachment-item';
    
    // Создаем кнопку удаления
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-attachment';
    removeBtn.innerHTML = '&times;';
    removeBtn.addEventListener('click', () => {
        previewContainer.remove();
    });
    previewContainer.appendChild(removeBtn);
    
    // Проверяем, является ли файл изображением
    if (file.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(img.src); // Освобождаем ресурсы
        };
        previewContainer.appendChild(img);
    } else {
        const fileElement = document.createElement('div');
        fileElement.className = 'attachment-file';
        fileElement.textContent = file.name;
        previewContainer.appendChild(fileElement);
    }
    
    return previewContainer;
}

// Обработчик загрузки файлов
function handleFileUpload(fileInput, previewContainer) {
    if (!fileInput || !previewContainer) return;
    
    // Очищаем предыдущие превью
    previewContainer.innerHTML = '';
    
    // Создаем превью для каждого файла
    Array.from(fileInput.files).forEach(file => {
        const preview = createFilePreview(file);
        previewContainer.appendChild(preview);
    });
}

// Настройка обработчика загрузки файлов
function setupFileUpload(fileInputId, previewContainerId) {
    const fileInput = document.getElementById(fileInputId);
    const previewContainer = document.getElementById(previewContainerId);
    
    if (fileInput && previewContainer) {
        fileInput.addEventListener('change', () => {
            handleFileUpload(fileInput, previewContainer);
        });
    }
}

// Инициализация обработчика загрузки файлов при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    setupFileUpload('task-attachments', 'attachments-preview');
});

// Экспорт функций для использования в других модулях
window.ui = {
    showModal,
    hideModal,
    handleFileUpload
};