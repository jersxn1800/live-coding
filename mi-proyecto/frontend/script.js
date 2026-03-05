// ==========================================
// 1. CONFIGURACIÓN Y VARIABLES GLOBALES
// ==========================================
const API_URL = "http://localhost:3000/api";
let loggedInUser = null; 
const textArea = document.getElementById('msgContent');

// ==========================================
// 2. AUTENTICACIÓN (LOGIN Y REGISTRO)
// ==========================================

// --- REGISTRO ---
document.getElementById('form-register').addEventListener('submit', async function(e) {
    e.preventDefault();
    const user = this.querySelector('input[type="text"]').value;
    const pass = document.getElementById('regPassword').value;
    const confirmPass = document.getElementById('confirmRegPassword').value;

    const strongPasswordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!strongPasswordRegex.test(pass)) {
        alert("🚨 Seguridad insuficiente: Mínimo 8 caracteres, una mayúscula, un número y un símbolo.");
        return;
    }
    if (pass !== confirmPass) {
        alert("❌ Las contraseñas no coinciden.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        });
        if (response.ok) {
            alert("✅ Registro exitoso. ¡Inicia sesión!");
            bootstrap.Modal.getInstance(document.getElementById('registerModal')).hide();
            this.reset();
        } else {
            const data = await response.json();
            alert("Error: " + data.error);
        }
    } catch (err) {
        alert("🔌 Error de conexión con el backend.");
    }
});

// --- LOGIN ---
document.getElementById('form-login').addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = this.querySelector('input[type="text"]').value;
    const password = this.querySelector('input[type="password"]').value;

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();

        if (response.ok) {
            loggedInUser = data.user; 
            localStorage.setItem('usuarioForo', JSON.stringify(data.user)); // Persistencia
            alert(`✅ Bienvenido, ${loggedInUser.username}`);
            bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
            actualizarInterfazPostLogin();
            cargarMensajes();
        } else {
            alert("❌ Error: " + data.error);
        }
    } catch (err) {
        alert("🔌 Error de conexión en el login.");
    }
});

// ==========================================
// 3. LÓGICA DEL FORO (MENSAJES)
// ==========================================

async function cargarMensajes() {
    try {
        const response = await fetch(`${API_URL}/posts`);
        if (!response.ok) return;
        
        const mensajes = await response.json();
        const container = document.getElementById('mensajes-container');
        container.innerHTML = ""; 

        mensajes.forEach(m => {
            agregarMensajeAlFeed(m.username, m.text);
        });
    } catch (err) {
        console.error("Error al cargar mensajes:", err);
    }
}

async function publicar() {
    if (!loggedInUser) {
        alert("Debes iniciar sesión para publicar.");
        return;
    }
    const texto = textArea.value.trim();
    if (!texto) return;

    try {
        const response = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: loggedInUser.id, text: texto })
        });

        if (response.ok) {
            agregarMensajeAlFeed(loggedInUser.username, texto);
            textArea.value = "";
            textArea.style.height = "50px"; 
        }
    } catch (err) {
        alert("Error al publicar.");
    }
}

// ==========================================
// 4. UTILIDADES DE UI
// ==========================================

function agregarMensajeAlFeed(username, contenido) {
    const container = document.getElementById('mensajes-container');
    const nuevoMensaje = document.createElement('div');
    nuevoMensaje.className = "card border-0 shadow-sm mb-3 msg-card animate-fade-in";
    nuevoMensaje.innerHTML = `
        <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="fw-bold text-primary">@${username}</span>
                <small class="text-muted">Justo ahora</small>
            </div>
            <p class="card-text"></p>
        </div>
    `;
    nuevoMensaje.querySelector('.card-text').textContent = contenido;
    container.prepend(nuevoMensaje);
}

function actualizarInterfazPostLogin() {
    const navButtonsContainer = document.querySelector('.navbar .d-flex.gap-2');
    
    const badgeClass = loggedInUser.role === 'admin' ? 'bg-danger' : 'bg-primary';
    const roleLabel = loggedInUser.role === 'admin' ? 'ADMIN' : 'USER';

    navButtonsContainer.innerHTML = `
        <div class="d-flex align-items-center">
            <span class="badge ${badgeClass} me-2">${roleLabel}</span>
            <span class="text-white me-3">@${loggedInUser.username}</span>
            <button class="btn btn-outline-danger btn-sm" id="btn-logout">Salir</button>
        </div>
    `;

    document.getElementById('btn-logout').addEventListener('click', () => {
        localStorage.removeItem('usuarioForo');
        location.reload();
    });
}

// Lógica de "Ojitos"
function setupPasswordToggle(toggleId, inputId) {
    const toggle = document.getElementById(toggleId);
    const input = document.getElementById(inputId);
    if (toggle && input) {
        toggle.addEventListener('click', () => {
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            toggle.textContent = isPassword ? '🙈' : '👁️';
        });
    }
}

setupPasswordToggle('togglePassword', 'regPassword');
setupPasswordToggle('toggleConfirmPassword', 'confirmRegPassword');

// Persistencia al recargar
function verificarSesion() {
    const sesionGuardada = localStorage.getItem('usuarioForo');
    if (sesionGuardada) {
        loggedInUser = JSON.parse(sesionGuardada);
        actualizarInterfazPostLogin();
    }
}

// Inicialización
window.onload = () => {
    verificarSesion();
    cargarMensajes();
};

// Teclado
textArea.addEventListener('input', function() {
    this.style.height = "5px"; 
    this.style.height = (this.scrollHeight) + "px";
});
textArea.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); publicar(); }
});