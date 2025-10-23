// ========================================
// STATE VARIABLES
// ========================================
let currentEmployee = '';
let currentUserId = null;
let currentStatus = 'not_started'; // not_started, working, on_break, finished
let records = [];
let allRecords = [];
let showHistory = true;

// ========================================
// DATABASE API FUNCTIONS
// สำหรับทีม Database: แก้ไขฟังก์ชันเหล่านี้เพื่อเชื่อมต่อกับ Backend
// ========================================

/**
 * ตรวจสอบ Login
 * @param {string} username - ชื่อผู้ใช้
 * @param {string} password - รหัสผ่าน
 * @returns {Promise<Object|null>} - { id, name, role } หรือ null
 */
async function authenticateUser(username, password) {
    try {
        // TODO: เชื่อมต่อ API
        // const response = await fetch('/api/auth/login', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ username, password })
        // });
        // const data = await response.json();
        // return data.success ? { id: data.userId, name: data.name } : null;
        
        console.log('authenticateUser:', username, password);
        return null; // ให้ทีม Database แก้ไข
    } catch (error) {
        console.error('Auth error:', error);
        return null;
    }
}

/**
 * บันทึกเข้างาน
 * @param {number} userId 
 * @returns {Promise<number>} - recordId
 */
async function saveCheckIn(userId) {
    try {
        // TODO: เชื่อมต่อ API
        // const response = await fetch('/api/attendance/checkin', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ userId, timestamp: new Date() })
        // });
        // const data = await response.json();
        // return data.recordId;
        
        console.log('saveCheckIn:', userId);
        return Date.now(); // ให้ทีม Database แก้ไข
    } catch (error) {
        console.error('CheckIn error:', error);
        return Date.now();
    }
}

/**
 * บันทึกออกงาน
 * @param {number} recordId 
 */
async function saveCheckOut(recordId) {
    try {
        // TODO: เชื่อมต่อ API
        // await fetch('/api/attendance/checkout', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ recordId, timestamp: new Date() })
        // });
        
        console.log('saveCheckOut:', recordId);
    } catch (error) {
        console.error('CheckOut error:', error);
    }
}

/**
 * บันทึกเริ่มพัก
 * @param {number} recordId 
 */
async function saveBreakStart(recordId) {
    try {
        // TODO: เชื่อมต่อ API
        console.log('saveBreakStart:', recordId);
    } catch (error) {
        console.error('BreakStart error:', error);
    }
}

/**
 * บันทึกจบพัก
 * @param {number} recordId 
 */
async function saveBreakEnd(recordId) {
    try {
        // TODO: เชื่อมต่อ API
        console.log('saveBreakEnd:', recordId);
    } catch (error) {
        console.error('BreakEnd error:', error);
    }
}

/**
 * บันทึกการลา
 * @param {number} userId 
 */
async function saveLeave(userId) {
    try {
        // TODO: เชื่อมต่อ API
        console.log('saveLeave:', userId);
    } catch (error) {
        console.error('Leave error:', error);
    }
}

/**
 * ดึงประวัติการบันทึก
 * @param {number} userId 
 * @param {string|null} month - YYYY-MM format
 * @returns {Promise<Array>} - Array of records
 */
async function fetchRecords(userId, month = null) {
    try {
        // TODO: เชื่อมต่อ API
        // const url = month 
        //     ? `/api/attendance/records?userId=${userId}&month=${month}`
        //     : `/api/attendance/records?userId=${userId}`;
        // const response = await fetch(url);
        // const data = await response.json();
        // return data.records;
        
        console.log('fetchRecords:', userId, month);
        return []; // ให้ทีม Database แก้ไข
    } catch (error) {
        console.error('Fetch records error:', error);
        return [];
    }
}

// ========================================
// TIME DISPLAY
// ========================================
function updateTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('th-TH', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });
    const dateStr = now.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });

    document.getElementById('loginTime').textContent = timeStr;
    document.getElementById('loginDate').textContent = dateStr;
    document.getElementById('mainTime').textContent = timeStr;
    document.getElementById('mainDate').textContent = dateStr;
}

setInterval(updateTime, 1000);
updateTime();

// ========================================
// LOGIN & LOGOUT
// ========================================
async function login() {
    const username = document.getElementById('usernameInput').value.trim();
    const password = document.getElementById('passwordInput').value;

    if (!username || !password) {
        alert('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
        return;
    }

    const user = await authenticateUser(username, password);

    if (user) {
        currentEmployee = user.name || username;
        currentUserId = user.id;
        
        document.getElementById('loginView').classList.add('hidden');
        document.getElementById('mainView').classList.remove('hidden');
        document.getElementById('employeeName').textContent = currentEmployee;
        document.getElementById('usernameInput').value = '';
        document.getElementById('passwordInput').value = '';
        
        await loadRecords();
        updateButtons();
    } else {
        alert('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        document.getElementById('passwordInput').value = '';
    }
}

function logout() {
    if (confirm('ต้องการออกจากระบบใช่หรือไม่?')) {
        currentEmployee = '';
        currentUserId = null;
        currentStatus = 'not_started';
        records = [];
        allRecords = [];
        
        document.getElementById('mainView').classList.add('hidden');
        document.getElementById('loginView').classList.remove('hidden');
        
        updateButtons();
        renderRecords();
    }
}

// Enter key to login
document.addEventListener('DOMContentLoaded', function() {
    const passwordInput = document.getElementById('passwordInput');
    const usernameInput = document.getElementById('usernameInput');
    
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') login();
        });
    }
    
    if (usernameInput) {
        usernameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') login();
        });
    }
});

// ========================================
// ATTENDANCE ACTIONS
// ========================================
async function checkIn() {
    if (currentStatus !== 'not_started' || !currentUserId) return;

    const now = new Date();
    const recordId = await saveCheckIn(currentUserId);
    
    const record = {
        id: recordId,
        employee: currentEmployee,
        date: now.toLocaleDateString('th-TH'),
        checkIn: now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        checkOut: '-',
        breakStart: '-',
        breakEnd: '-',
        note: '-'
    };

    records.unshift(record);
    allRecords.unshift(record);
    currentStatus = 'working';
    updateButtons();
    renderRecords();
}

async function breakStart() {
    if (currentStatus !== 'working' || records.length === 0) return;

    const now = new Date();
    const recordId = records[0].id;
    
    await saveBreakStart(recordId);
    
    records[0].breakStart = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    currentStatus = 'on_break';
    updateButtons();
    renderRecords();
}

async function breakEnd() {
    if (currentStatus !== 'on_break' || records.length === 0) return;

    const now = new Date();
    const recordId = records[0].id;
    
    await saveBreakEnd(recordId);
    
    records[0].breakEnd = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    currentStatus = 'working';
    updateButtons();
    renderRecords();
}

async function checkOut() {
    if (currentStatus !== 'working' || records.length === 0) return;

    const now = new Date();
    const recordId = records[0].id;
    
    await saveCheckOut(recordId);
    
    records[0].checkOut = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    currentStatus = 'finished';
    updateButtons();
    renderRecords();
}

async function leave() {
    if (!currentUserId) return;

    await saveLeave(currentUserId);
    
    const now = new Date();
    const record = {
        id: Date.now(),
        employee: currentEmployee,
        date: now.toLocaleDateString('th-TH'),
        checkIn: '-',
        checkOut: '-',
        breakStart: '-',
        breakEnd: '-',
        note: 'ลา'
    };

    records.unshift(record);
    allRecords.unshift(record);
    currentStatus = 'not_started';
    updateButtons();
    renderRecords();
}

// ========================================
// UI UPDATES
// ========================================
function updateButtons() {
    const statusText = {
        'not_started': 'ยังไม่เข้างาน',
        'working': 'กำลังทำงาน',
        'on_break': 'กำลังพัก',
        'finished': 'เสร็จสิ้นแล้ว'
    };

    const statusEl = document.getElementById('statusText');
    if (statusEl) statusEl.textContent = statusText[currentStatus];

    const btnCheckIn = document.getElementById('btnCheckIn');
    if (btnCheckIn) btnCheckIn.disabled = currentStatus !== 'not_started';
    
    const btnBreakStart = document.getElementById('btnBreakStart');
    const btnBreakEnd = document.getElementById('btnBreakEnd');
    if (btnBreakStart) btnBreakStart.disabled = currentStatus !== 'working';
    if (btnBreakEnd) btnBreakEnd.disabled = currentStatus !== 'on_break';
    
    const btnCheckOut = document.getElementById('btnCheckOut');
    if (btnCheckOut) btnCheckOut.disabled = currentStatus !== 'working';
}

// ========================================
// RECORDS MANAGEMENT
// ========================================
async function loadRecords() {
    if (!currentUserId) return;
    
    const fetchedRecords = await fetchRecords(currentUserId);
    records = fetchedRecords;
    allRecords = [...fetchedRecords];
    renderRecords();
}

function calculateHours(timeStr1, timeStr2) {
    if (timeStr1 === '-' || timeStr2 === '-') return 0;
    
    const time1 = new Date(`2000-01-01 ${timeStr1}`);
    const time2 = new Date(`2000-01-01 ${timeStr2}`);
    return (time2 - time1) / (1000 * 60 * 60);
}

function renderRecords() {
    const tbody = document.getElementById('recordsBody');
    const emptyState = document.getElementById('emptyState');
    const recordsTable = document.getElementById('recordsTable');
    
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (records.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        if (recordsTable) recordsTable.style.display = 'none';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (recordsTable) recordsTable.style.display = 'table';

    let totalHours = 0;

    records.forEach(record => {
        const breakHours = calculateHours(record.breakStart, record.breakEnd);
        const workHours = calculateHours(record.checkIn, record.checkOut) - breakHours;
        
        if (workHours > 0) totalHours += workHours;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${record.employee}</td>
            <td>${record.date}</td>
            <td>${record.checkIn}</td>
            <td>${record.checkOut}</td>
            <td>${record.breakStart}</td>
            <td>${record.breakEnd}</td>
            <td>${breakHours > 0 ? breakHours.toFixed(2) : '0.00'}</td>
            <td>${workHours > 0 ? workHours.toFixed(2) : '0.00'}</td>
            <td>${record.note}</td>
        `;
        tbody.appendChild(tr);
    });

    const totalHoursEl = document.getElementById('totalHours');
    if (totalHoursEl) {
        totalHoursEl.textContent = totalHours.toFixed(2) + ' ชม.';
    }
}

// ========================================
// FILTER & HISTORY
// ========================================
async function filterByMonth() {
    const monthInput = document.getElementById('monthFilter');
    if (!monthInput || !monthInput.value) {
        alert('กรุณาเลือกเดือน');
        return;
    }

    const selectedMonth = monthInput.value;
    
    const fetchedRecords = await fetchRecords(currentUserId, selectedMonth);
    records = fetchedRecords;
    renderRecords();
}

function clearFilter() {
    document.getElementById('monthFilter').value = '';
    records = [...allRecords];
    renderRecords();
}

function toggleHistory() {
    showHistory = !showHistory;
    const historyContent = document.getElementById('historyContent');
    const toggleText = document.getElementById('toggleHistoryText');
    
    if (historyContent) {
        historyContent.style.display = showHistory ? 'block' : 'none';
    }
    if (toggleText) {
        toggleText.textContent = showHistory ? 'ซ่อน' : 'แสดง';
    }
}

// Initialize
updateButtons();
renderRecords();