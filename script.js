// ========================================
// SUPABASE CONNECTION
// ========================================
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://lxvdhlfqkeitmtybffmg.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4dmRobGZxa2VpdG10eWJmZm1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNzAyMDAsImV4cCI6MjA3Njg0NjIwMH0.pABbIykKDDva8lU7Mr9N9ay5cdiDcG8Gt7XjqClwcb4'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ========================================
// STATE VARIABLES
// ========================================
let currentEmployee = ''
let currentUserId = null
let currentStatus = 'not_started'
let records = []
let allRecords = []
let showHistory = true

// ========================================
// DATABASE API FUNCTIONS
// ========================================

async function authenticateUser(username, password) {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, name, username, role')
            .eq('username', username)
            .eq('password', password)
            .single()

        if (error) {
            console.error('Auth error:', error)
            return null
        }

        return data
    } catch (error) {
        console.error('Auth exception:', error)
        return null
    }
}

async function saveCheckIn(userId) {
    try {
        const now = new Date()
        const dateStr = now.toISOString().split('T')[0]
        const timeStr = now.toLocaleTimeString('th-TH', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        })

        const { data, error } = await supabase
            .from('attendance_records')
            .insert([
                { 
                    user_id: userId,
                    date: dateStr,
                    check_in: timeStr,
                    check_out: null,
                    break_start: null,
                    break_end: null,
                    note: null
                }
            ])
            .select()
            .single()

        if (error) {
            console.error('CheckIn error:', error)
            return Date.now()
        }

        return data.id
    } catch (error) {
        console.error('CheckIn exception:', error)
        return Date.now()
    }
}

async function saveCheckOut(recordId) {
    try {
        const now = new Date()
        const timeStr = now.toLocaleTimeString('th-TH', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        })

        const { error } = await supabase
            .from('attendance_records')
            .update({ check_out: timeStr })
            .eq('id', recordId)

        if (error) {
            console.error('CheckOut error:', error)
        }
    } catch (error) {
        console.error('CheckOut exception:', error)
    }
}

async function saveBreakStart(recordId) {
    try {
        const now = new Date()
        const timeStr = now.toLocaleTimeString('th-TH', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        })

        const { error } = await supabase
            .from('attendance_records')
            .update({ break_start: timeStr })
            .eq('id', recordId)

        if (error) {
            console.error('BreakStart error:', error)
        }
    } catch (error) {
        console.error('BreakStart exception:', error)
    }
}

async function saveBreakEnd(recordId) {
    try {
        const now = new Date()
        const timeStr = now.toLocaleTimeString('th-TH', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        })

        const { error } = await supabase
            .from('attendance_records')
            .update({ break_end: timeStr })
            .eq('id', recordId)

        if (error) {
            console.error('BreakEnd error:', error)
        }
    } catch (error) {
        console.error('BreakEnd exception:', error)
    }
}

async function saveLeave(userId) {
    try {
        const now = new Date()
        const dateStr = now.toISOString().split('T')[0]

        const { error } = await supabase
            .from('attendance_records')
            .insert([
                { 
                    user_id: userId,
                    date: dateStr,
                    check_in: null,
                    check_out: null,
                    break_start: null,
                    break_end: null,
                    note: 'ลา'
                }
            ])

        if (error) {
            console.error('Leave error:', error)
        }
    } catch (error) {
        console.error('Leave exception:', error)
    }
}

async function fetchRecords(userId, month = null) {
    try {
        let query = supabase
            .from('attendance_records')
            .select(`
                id,
                user_id,
                date,
                check_in,
                check_out,
                break_start,
                break_end,
                note,
                users (name)
            `)
            .order('date', { ascending: false })
            .order('check_in', { ascending: false })

        if (month) {
            query = query.gte('date', `${month}-01`)
                         .lte('date', `${month}-31`)
        }

        const { data, error } = await query

        if (error) {
            console.error('Fetch records error:', error)
            return []
        }

        return data.map(record => ({
            id: record.id,
            employee: record.users?.name || 'ไม่ระบุ',
            date: formatDateThai(record.date),
            dateRaw: record.date,
            checkIn: record.check_in || '-',
            checkOut: record.check_out || '-',
            breakStart: record.break_start || '-',
            breakEnd: record.break_end || '-',
            note: record.note || '-'
        }))
    } catch (error) {
        console.error('Fetch records exception:', error)
        return []
    }
}

function formatDateThai(dateStr) {
    if (!dateStr) return '-'
    
    try {
        const date = new Date(dateStr)
        return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        })
    } catch (error) {
        return dateStr
    }
}

// ========================================
// TIME DISPLAY
// ========================================
function updateTime() {
    const now = new Date()
    const timeStr = now.toLocaleTimeString('th-TH', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    })
    const dateStr = now.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    })

    const loginTime = document.getElementById('loginTime')
    const loginDate = document.getElementById('loginDate')
    const mainTime = document.getElementById('mainTime')
    const mainDate = document.getElementById('mainDate')

    if (loginTime) loginTime.textContent = timeStr
    if (loginDate) loginDate.textContent = dateStr
    if (mainTime) mainTime.textContent = timeStr
    if (mainDate) mainDate.textContent = dateStr
}

setInterval(updateTime, 1000)
updateTime()

// ========================================
// LOGIN & LOGOUT
// ========================================
async function login() {
    const username = document.getElementById('usernameInput').value.trim()
    const password = document.getElementById('passwordInput').value

    if (!username || !password) {
        alert('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน')
        return
    }

    const user = await authenticateUser(username, password)

    if (user) {
        console.log('Login Success:', user) // Debug
        console.log('User Role:', user.role) // Debug
        
        currentEmployee = user.name || username
        currentUserId = user.id
        
        // เก็บข้อมูล user ไว้ใน localStorage
        localStorage.setItem('adminUser', JSON.stringify(user))
        
        // ถ้าเป็น admin หรือ finance ให้ไปหน้า admin
        if (user.role === 'admin' || user.role === 'finance') {
            console.log('Redirecting to admin.html') // Debug
            alert('กำลังเข้าสู่หน้า Admin...') // ทดสอบ
            window.location.href = 'admin.html'
            return
        }
        
        console.log('Going to employee page') // Debug
        
        document.getElementById('loginView').classList.add('hidden')
        document.getElementById('mainView').classList.remove('hidden')
        document.getElementById('employeeName').textContent = currentEmployee
        document.getElementById('usernameInput').value = ''
        document.getElementById('passwordInput').value = ''
        
        await loadRecords()
        updateButtons()
    } else {
        alert('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง')
        document.getElementById('passwordInput').value = ''
    }
}

function logout() {
    if (confirm('ต้องการออกจากระบบใช่หรือไม่?')) {
        currentEmployee = ''
        currentUserId = null
        currentStatus = 'not_started'
        records = []
        allRecords = []
        
        localStorage.removeItem('adminUser')
        
        document.getElementById('mainView').classList.add('hidden')
        document.getElementById('loginView').classList.remove('hidden')
        
        updateButtons()
        renderRecords()
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const passwordInput = document.getElementById('passwordInput')
    const usernameInput = document.getElementById('usernameInput')
    
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') login()
        })
    }
    
    if (usernameInput) {
        usernameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') login()
        })
    }
})

// ========================================
// ATTENDANCE ACTIONS
// ========================================
async function checkIn() {
    if (currentStatus !== 'not_started' || !currentUserId) return

    const now = new Date()
    const recordId = await saveCheckIn(currentUserId)
    
    const record = {
        id: recordId,
        employee: currentEmployee,
        date: now.toLocaleDateString('th-TH'),
        dateRaw: now.toISOString().split('T')[0],
        checkIn: now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        checkOut: '-',
        breakStart: '-',
        breakEnd: '-',
        note: '-'
    }

    records.unshift(record)
    allRecords.unshift(record)
    currentStatus = 'working'
    updateButtons()
    renderRecords()
}

async function breakStart() {
    if (currentStatus !== 'working' || records.length === 0) return

    const now = new Date()
    const recordId = records[0].id
    
    await saveBreakStart(recordId)
    
    records[0].breakStart = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    currentStatus = 'on_break'
    updateButtons()
    renderRecords()
}

async function breakEnd() {
    if (currentStatus !== 'on_break' || records.length === 0) return

    const now = new Date()
    const recordId = records[0].id
    
    await saveBreakEnd(recordId)
    
    records[0].breakEnd = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    currentStatus = 'working'
    updateButtons()
    renderRecords()
}

async function checkOut() {
    if (currentStatus !== 'working' || records.length === 0) return

    const now = new Date()
    const recordId = records[0].id
    
    await saveCheckOut(recordId)
    
    records[0].checkOut = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    currentStatus = 'finished'
    updateButtons()
    renderRecords()
}

async function leave() {
    if (!currentUserId) return

    await saveLeave(currentUserId)
    
    const now = new Date()
    const record = {
        id: Date.now(),
        employee: currentEmployee,
        date: now.toLocaleDateString('th-TH'),
        dateRaw: now.toISOString().split('T')[0],
        checkIn: '-',
        checkOut: '-',
        breakStart: '-',
        breakEnd: '-',
        note: 'ลา'
    }

    records.unshift(record)
    allRecords.unshift(record)
    currentStatus = 'not_started'
    updateButtons()
    renderRecords()
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
    }

    const statusEl = document.getElementById('statusText')
    if (statusEl) statusEl.textContent = statusText[currentStatus]

    const btnCheckIn = document.getElementById('btnCheckIn')
    if (btnCheckIn) btnCheckIn.disabled = currentStatus !== 'not_started'
    
    const btnBreakStart = document.getElementById('btnBreakStart')
    const btnBreakEnd = document.getElementById('btnBreakEnd')
    if (btnBreakStart) btnBreakStart.disabled = currentStatus !== 'working'
    if (btnBreakEnd) btnBreakEnd.disabled = currentStatus !== 'on_break'
    
    const btnCheckOut = document.getElementById('btnCheckOut')
    if (btnCheckOut) btnCheckOut.disabled = currentStatus !== 'working'
}

// ========================================
// RECORDS MANAGEMENT
// ========================================
async function loadRecords() {
    if (!currentUserId) return
    
    const fetchedRecords = await fetchRecords(currentUserId)
    records = fetchedRecords
    allRecords = [...fetchedRecords]
    
    populateEmployeeFilter()
    
    renderRecords()
}

function populateEmployeeFilter() {
    const employeeFilter = document.getElementById('employeeFilter')
    if (!employeeFilter) return
    
    const uniqueEmployees = [...new Set(allRecords.map(r => r.employee))]
    
    employeeFilter.innerHTML = '<option value="">ทุกคน</option>'
    
    uniqueEmployees.forEach(name => {
        const option = document.createElement('option')
        option.value = name
        option.textContent = name
        employeeFilter.appendChild(option)
    })
}

function calculateHours(timeStr1, timeStr2) {
    if (timeStr1 === '-' || timeStr2 === '-') return 0
    
    const time1 = new Date(`2000-01-01 ${timeStr1}`)
    const time2 = new Date(`2000-01-01 ${timeStr2}`)
    return (time2 - time1) / (1000 * 60 * 60)
}

function renderRecords() {
    const tbody = document.getElementById('recordsBody')
    const emptyState = document.getElementById('emptyState')
    const recordsTable = document.getElementById('recordsTable')
    
    if (!tbody) return
    
    tbody.innerHTML = ''

    if (records.length === 0) {
        if (emptyState) emptyState.style.display = 'block'
        if (recordsTable) recordsTable.style.display = 'none'
        return
    }

    if (emptyState) emptyState.style.display = 'none'
    if (recordsTable) recordsTable.style.display = 'table'

    let totalHours = 0

    records.forEach(record => {
        const breakHours = calculateHours(record.breakStart, record.breakEnd)
        const workHours = calculateHours(record.checkIn, record.checkOut) - breakHours
        
        if (workHours > 0) totalHours += workHours

        const tr = document.createElement('tr')
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
        `
        tbody.appendChild(tr)
    })

    const totalHoursEl = document.getElementById('totalHours')
    if (totalHoursEl) {
        totalHoursEl.textContent = totalHours.toFixed(2) + ' ชม.'
    }
}

// ========================================
// FILTER & HISTORY
// ========================================
async function applyFilters() {
    const employeeFilter = document.getElementById('employeeFilter')
    const monthInput = document.getElementById('monthFilter')
    
    const selectedEmployee = employeeFilter ? employeeFilter.value : ''
    const selectedMonth = monthInput ? monthInput.value : ''

    const fetchedRecords = await fetchRecords(currentUserId, selectedMonth)
    
    if (selectedEmployee) {
        records = fetchedRecords.filter(r => r.employee === selectedEmployee)
    } else {
        records = fetchedRecords
    }
    
    renderRecords()
}

async function filterByMonth() {
    await applyFilters()
}

function clearFilter() {
    const monthInput = document.getElementById('monthFilter')
    const employeeFilter = document.getElementById('employeeFilter')
    
    if (monthInput) monthInput.value = ''
    if (employeeFilter) employeeFilter.value = ''
    
    records = [...allRecords]
    renderRecords()
}

function toggleHistory() {
    showHistory = !showHistory
    const historyContent = document.getElementById('historyContent')
    const toggleText = document.getElementById('toggleHistoryText')
    
    if (historyContent) {
        historyContent.style.display = showHistory ? 'block' : 'none'
    }
    if (toggleText) {
        toggleText.textContent = showHistory ? 'ซ่อน' : 'แสดง'
    }
}

// Make functions global
window.login = login
window.logout = logout
window.checkIn = checkIn
window.breakStart = breakStart
window.breakEnd = breakEnd
window.checkOut = checkOut
window.leave = leave
window.applyFilters = applyFilters
window.filterByMonth = filterByMonth
window.clearFilter = clearFilter
window.toggleHistory = toggleHistory

// Initialize
updateButtons()
renderRecords()