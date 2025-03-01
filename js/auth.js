// Глобальные переменные для аутентификации
let currentUser = null;
const TOKEN_KEY = 'task_tracker_token';
const USERS_KEY = 'task_tracker_users';

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем, авторизован ли пользователь
    checkAuth();
    
    // Обработчики для страницы авторизации
    if (document.getElementById('login-form')) {
        setupAuthPage();
    }
    
    // Обработчик кнопки выхода на странице дашборда
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});

// Проверка авторизации
function checkAuth() {
    const token = localStorage.getItem(TOKEN_KEY);
    
    if (token) {
        try {
            // Расшифровываем токен (в реальном проекте здесь будет проверка JWT)
            const userData = JSON.parse(decodeURIComponent(atob(token.split('.')[1])));
            currentUser = userData;
            
            // Если мы на странице авторизации, перенаправляем на дашборд
            if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
                window.location.href = 'dashboard.html';
                return;
            }
            
            // Обновляем интерфейс дашборда
            if (document.getElementById('username')) {
                document.getElementById('username').textContent = currentUser.username;
            }
        } catch (error) {
            console.error('Ошибка при проверке токена:', error);
            localStorage.removeItem(TOKEN_KEY);
            redirectToLogin();
        }
    } else if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
        // Если нет токена и мы не на странице входа, перенаправляем на вход
        redirectToLogin();
    }
}

// Настройка страницы авторизации
function setupAuthPage() {
    // Переключение между вкладками входа и регистрации
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Удаляем активный класс у всех кнопок и форм
            document.querySelectorAll('.tab-btn, .auth-form').forEach(el => {
                el.classList.remove('active');
            });
            
            // Добавляем активный класс к нажатой кнопке и соответствующей форме
            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            document.getElementById(`${tabId}-form`).classList.add('active');
            
            // Очищаем сообщения
            document.getElementById('auth-message').textContent = '';
        });
    });
    
    // Обработчик формы входа
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        
        login(username, password);
    });
    
    // Обработчик формы регистрации
    const registerForm = document.getElementById('register-form');
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        
        register(username, email, password, confirmPassword);
    });
}

// Функция входа в систему
function login(username, password) {
    // Получаем список пользователей
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    
    // Ищем пользователя
    const user = users.find(u => u.username === username && u.password === hashPassword(password));
    
    if (user) {
        // Создаем JWT-подобный токен (в реальном приложении здесь будет настоящий JWT)
        const payload = { 
            id: user.id,
            username: user.username,
            email: user.email
        };
        const token = createToken(payload);
        
        // Сохраняем токен
        localStorage.setItem(TOKEN_KEY, token);
        
        // Перенаправляем на дашборд
        window.location.href = 'dashboard.html';
    } else {
        // Показываем сообщение об ошибке
        const msgEl = document.getElementById('auth-message');
        msgEl.textContent = 'Неверное имя пользователя или пароль';
        msgEl.className = 'auth-message error';
    }
}

// Функция регистрации
function register(username, email, password, confirmPassword) {
    const msgEl = document.getElementById('auth-message');
    
    // Проверяем, совпадают ли пароли
    if (password !== confirmPassword) {
        msgEl.textContent = 'Пароли не совпадают';
        msgEl.className = 'auth-message error';
        return;
    }
    
    // Получаем список пользователей
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    
    // Проверяем, существует ли уже пользователь с таким именем или email
    if (users.some(u => u.username === username)) {
        msgEl.textContent = 'Пользователь с таким именем уже существует';
        msgEl.className = 'auth-message error';
        return;
    }
    
    if (users.some(u => u.email === email)) {
        msgEl.textContent = 'Пользователь с таким email уже существует';
        msgEl.className = 'auth-message error';
        return;
    }
    
    // Создаем нового пользователя
    const newUser = {
        id: generateId(),
        username,
        email,
        password: hashPassword(password),
        createdAt: new Date().toISOString()
    };
    
    // Добавляем пользователя в список
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    // Показываем успешное сообщение
    msgEl.textContent = 'Регистрация успешна! Теперь вы можете войти';
    msgEl.className = 'auth-message success';
    
    // Переключаемся на вкладку входа
    document.querySelector('[data-tab="login"]').click();
}

// Функция выхода
function logout() {
    localStorage.removeItem(TOKEN_KEY);
    redirectToLogin();
}

// Перенаправление на страницу входа
function redirectToLogin() {
    window.location.href = 'index.html';
}

// Создание простого JWT-подобного токена
function createToken(payload) {
    const header = { alg: 'none', typ: 'JWT' };
    // Используем encodeURIComponent перед btoa для поддержки Unicode
    const headerStr = btoa(encodeURIComponent(JSON.stringify(header)));
    const payloadStr = btoa(encodeURIComponent(JSON.stringify(payload)));
    
    // В настоящем JWT здесь был бы подписанный секретным ключом хэш
    const signature = btoa(encodeURIComponent('signature'));
    
    return `${headerStr}.${payloadStr}.${signature}`;
}

// Простое хэширование пароля (в реальном приложении использовать bcrypt или подобное)
function hashPassword(password) {
    // Это очень простая "хэш-функция" только для демонстрации
    // В реальном приложении используйте безопасные алгоритмы хеширования
    return btoa(encodeURIComponent(password + 'salt'));
}

// Генерация уникального ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Функция для получения текущего пользователя
function getCurrentUser() {
    return currentUser;
}

// Экспорт функций для использования в других модулях
window.auth = {
    getCurrentUser,
    login,
    logout,
    register
};