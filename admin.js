// ========================================
// SUPABASE CONNECTION
// ========================================
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://lxvdhlfqkeitmtybffmg.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4dmRobGZxa2VpdG10eWJmZm1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNzAyMDAsImV4cCI6MjA3Njg0NjIwMH0.pABbIykKDDva8lU7Mr9N9ay5cdiDcG8Gt7XjqClwcb4'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ========================================
// STATE
// ========================================
let currentAdmin = ''
let currentUserId = null
let records = []
let allRecords = []
let employees = []

// ========================================
// AUTHENTICATION CHECK
// ========================================
async function checkAuth() {
    const userData = localStorage.getItem('adminUser')
    if (!userData) {
        window.location.href = 'index.html'
        return false
    }
    
    const user = JSON.parse(userData)
    
    // ตรวจสอบว่าเป็น admin หรือ finance
    if (user.role !== 'admin' && user.role !== 'finance') {
        alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้')
        window.location.href = 'index.html'
        return false
    }
    
    currentAdmin = user.name
    currentUserId = user.id
    document.getElementById('adminName').textContent = currentAdmin
    
    return true
}

// ========================================
// DATA FETCHING
// ========================================
async function fetchAllRecords(month = null) {
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

        if (error) throw error

        return data.map(record => ({
            id: record.id,
            userId: record.user_id,
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
        console.error('Error fetching records:', error)
        return []
    }
}

async function fetchEmployees() {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, name, role')
            .neq('role', 'admin')
            .neq('role', 'finance')

        if (error) throw error
        return data
    } catch (error) {
        console.error('Error fetching employees:', error)
        return []
    }
}

// ========================================
// UI UPDATES
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

    const adminTime = document.getElementById('adminTime')
    const adminDate = document.getElementById('adminDate')

    if (adminTime) adminTime.textContent = timeStr
    if (adminDate) adminDate.textContent = dateStr
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
            <td>
                <div class="action-column">
                    <button class="btn-action btn-edit" onclick="openEditModal(${record.id})">แก้ไข</button>
                    <button class="btn-action btn-delete" onclick="deleteRecord(${record.id})">ลบ</button>
                </div>
            </td>
        `
        tbody.appendChild(tr)
    })

    const totalHoursEl = document.getElementById('totalHours')
    if (totalHoursEl) {
        totalHoursEl.textContent = totalHours.toFixed(2) + ' ชม.'
    }
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

async function updateStats() {
    const today = new Date().toISOString().split('T')[0]
    const thisMonth = new Date().toISOString().slice(0, 7)
    
    // พนักงานทั้งหมด
    document.getElementById('totalEmployees').textContent = employees.length
    
    // บันทึกวันนี้
    const todayRecords = allRecords.filter(r => r.dateRaw === today)
    document.getElementById('todayRecords').textContent = todayRecords.length
    
    // ชั่วโมงรวมเดือนนี้
    const monthRecords = allRecords.filter(r => r.dateRaw && r.dateRaw.startsWith(thisMonth))
    let monthlyHours = 0
    monthRecords.forEach(record => {
        const breakHours = calculateHours(record.breakStart, record.breakEnd)
        const workHours = calculateHours(record.checkIn, record.checkOut) - breakHours
        if (workHours > 0) monthlyHours += workHours
    })
    document.getElementById('monthlyHours').textContent = monthlyHours.toFixed(0)
    
    // ลาในเดือนนี้
    const monthlyLeaves = monthRecords.filter(r => r.note === 'ลา')
    document.getElementById('monthlyLeaves').textContent = monthlyLeaves.length
}

// ========================================
// FILTERS
// ========================================
async function applyFilters() {
    const employeeFilter = document.getElementById('employeeFilter')
    const monthInput = document.getElementById('monthFilter')
    
    const selectedEmployee = employeeFilter ? employeeFilter.value : ''
    const selectedMonth = monthInput ? monthInput.value : ''

    const fetchedRecords = await fetchAllRecords(selectedMonth)
    
    if (selectedEmployee) {
        records = fetchedRecords.filter(r => r.employee === selectedEmployee)
    } else {
        records = fetchedRecords
    }
    
    renderRecords()
}

function clearFilter() {
    const monthInput = document.getElementById('monthFilter')
    const employeeFilter = document.getElementById('employeeFilter')
    
    if (monthInput) monthInput.value = ''
    if (employeeFilter) employeeFilter.value = ''
    
    records = [...allRecords]
    renderRecords()
}

// ========================================
// EDIT & DELETE
// ========================================
function openEditModal(recordId) {
    const record = records.find(r => r.id === recordId)
    if (!record) return
    
    document.getElementById('editRecordId').value = record.id
    document.getElementById('editDate').value = record.dateRaw
    document.getElementById('editCheckIn').value = record.checkIn !== '-' ? record.checkIn : ''
    document.getElementById('editCheckOut').value = record.checkOut !== '-' ? record.checkOut : ''
    document.getElementById('editBreakStart').value = record.breakStart !== '-' ? record.breakStart : ''
    document.getElementById('editBreakEnd').value = record.breakEnd !== '-' ? record.breakEnd : ''
    document.getElementById('editNote').value = record.note !== '-' ? record.note : ''
    
    document.getElementById('editModal').classList.add('active')
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('active')
}

async function saveEdit() {
    const recordId = document.getElementById('editRecordId').value
    const date = document.getElementById('editDate').value
    const checkIn = document.getElementById('editCheckIn').value || null
    const checkOut = document.getElementById('editCheckOut').value || null
    const breakStart = document.getElementById('editBreakStart').value || null
    const breakEnd = document.getElementById('editBreakEnd').value || null
    const note = document.getElementById('editNote').value || null
    
    try {
        const { error } = await supabase
            .from('attendance_records')
            .update({
                date: date,
                check_in: checkIn,
                check_out: checkOut,
                break_start: breakStart,
                break_end: breakEnd,
                note: note
            })
            .eq('id', recordId)
        
        if (error) throw error
        
        alert('บันทึกสำเร็จ')
        closeEditModal()
        await loadData()
    } catch (error) {
        console.error('Error updating record:', error)
        alert('เกิดข้อผิดพลาด: ' + error.message)
    }
}

async function deleteRecord(recordId) {
    if (!confirm('ต้องการลบข้อมูลนี้ใช่หรือไม่?')) return
    
    try {
        const { error } = await supabase
            .from('attendance_records')
            .delete()
            .eq('id', recordId)
        
        if (error) throw error
        
        alert('ลบสำเร็จ')
        await loadData()
    } catch (error) {
        console.error('Error deleting record:', error)
        alert('เกิดข้อผิดพลาด: ' + error.message)
    }
}

// ========================================
// EXPORT
// ========================================
function exportToCSV() {
    if (records.length === 0) {
        alert('ไม่มีข้อมูลให้ Export')
        return
    }
    
    let csv = 'ชื่อพนักงาน,วันที่,เข้า,ออก,เริ่มพัก,จบพัก,หัก(ชม.),ชั่วโมงรวม,หมายเหตุ\n'
    
    records.forEach(record => {
        const breakHours = calculateHours(record.breakStart, record.breakEnd)
        const workHours = calculateHours(record.checkIn, record.checkOut) - breakHours
        
        csv += `"${record.employee}","${record.date}","${record.checkIn}","${record.checkOut}","${record.breakStart}","${record.breakEnd}","${breakHours.toFixed(2)}","${workHours.toFixed(2)}","${record.note}"\n`
    })
    
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `attendance_report_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

// ========================================
// LOGOUT
// ========================================
function logout() {
    if (confirm('ต้องการออกจากระบบใช่หรือไม่?')) {
        localStorage.removeItem('adminUser')
        window.location.href = 'index.html'
    }
}

// ========================================
// INITIALIZATION
// ========================================
async function loadData() {
    employees = await fetchEmployees()
    allRecords = await fetchAllRecords()
    records = [...allRecords]
    
    populateEmployeeFilter()
    renderRecords()
    updateStats()
}

async function init() {
    const isAuthenticated = await checkAuth()
    if (!isAuthenticated) return
    
    updateTime()
    setInterval(updateTime, 1000)
    
    await loadData()
}

// Make functions global
window.applyFilters = applyFilters
window.clearFilter = clearFilter
window.openEditModal = openEditModal
window.closeEditModal = closeEditModal
window.saveEdit = saveEdit
window.deleteRecord = deleteRecord
window.exportToCSV = exportToCSV
window.logout = logout

// Start
init()