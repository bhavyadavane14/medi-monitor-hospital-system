// MediMonitor Frontend Application Logic
const BACKEND_URL = "https://medi-monitor-backend.onrender.com";

let socket = null;
if (typeof io !== 'undefined') {
  socket = io("https://medi-monitor-backend.onrender.com");
}

let currentUser = null;

const ROLE_PAGES = {
    'admin': '/admin.html',
    'nurse': '/nurse.html',
    'doctor': '/doctor.html'
};

document.addEventListener('DOMContentLoaded', async () => {

    await checkAuth();

    // LOGIN
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
                const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await res.json();

                if (data.error) {
                    document.getElementById('login-error').textContent = data.error;
                    document.getElementById('login-error').style.display = 'block';
                } else {
                    location.href = ROLE_PAGES[data.user.role];
                }

            } catch (err) {
                alert("Server not responding. Wait 20 sec.");
            }
        });
    }

    // LOGOUT
    document.addEventListener('click', async (e) => {
        if (e.target.closest('#logout-btn')) {
            await fetch(`${BACKEND_URL}/api/auth/logout`, { method: 'POST' });
            location.href = '/login.html';
        }
    });

    // DASHBOARD INIT
    if (currentUser) {
        const path = location.pathname;

        if (path.endsWith('nurse.html')) initNurseDashboard();
        if (path.endsWith('doctor.html')) initDoctorDashboard();
        if (path.endsWith('admin.html')) initAdminDashboard();

        if (currentUser.role === 'doctor') {
            socket.emit('joinRoom', `doctor_${currentUser.doctorId}`);
        }
    }
});

// ================= AUTH =================

async function checkAuth() {
    try {
        const res = await fetch(`${BACKEND_URL}/api/auth/me`);
        if (res.ok) {
            const data = await res.json();
            currentUser = data.user;

            const expectedPage = ROLE_PAGES[currentUser.role];

            if (location.pathname.includes('login.html')) {
                location.href = expectedPage;
            }

        } else {
            if (!location.pathname.includes('login.html')) {
                location.href = '/login.html';
            }
        }
    } catch (err) {
        console.log("Auth check failed");
    }
}

// ================= NURSE =================

async function initNurseDashboard() {
    document.getElementById('nurse-name').textContent = currentUser.name;
    loadNursePatients();
}

async function loadNursePatients() {
    const res = await fetch(`${BACKEND_URL}/api/patients`);
    const patients = await res.json();

    const table = document.querySelector('#nurse-patient-table tbody');
    table.innerHTML = '';

    patients.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.name}</td>
            <td>${p.severity}</td>
            <td>
                <button onclick="sendAlert(${p.id})">Alert</button>
            </td>
        `;
        table.appendChild(tr);
    });
}

async function sendAlert(id) {
    await fetch(`${BACKEND_URL}/api/patients/${id}/alert`, { method: 'POST' });
    alert("Alert sent!");
}

// ================= DOCTOR =================

async function initDoctorDashboard() {
    document.getElementById('doctor-name').textContent = currentUser.name;
    loadDoctorPatients();

    socket.on('emergencyAlert', (data) => {
        alert(`🚨 Emergency: ${data.patientName}`);
    });
}

async function loadDoctorPatients() {
    const res = await fetch(`${BACKEND_URL}/api/patients`);
    const patients = await res.json();

    const table = document.querySelector('#doctor-patient-table tbody');
    table.innerHTML = '';

    patients.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.name}</td>
            <td>${p.severity}</td>
        `;
        table.appendChild(tr);
    });
}

// ================= ADMIN =================

async function initAdminDashboard() {
    loadAdminStats();
}

async function loadAdminStats() {
    const res = await fetch(`${BACKEND_URL}/api/patients`);
    const patients = await res.json();

    document.getElementById('admin-stat-patients').textContent = patients.length;
}