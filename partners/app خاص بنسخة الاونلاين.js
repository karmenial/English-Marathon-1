// ==========================================
// ☁️ نسخة الأونلاين - تستخدم fetch من users_db.json
// ==========================================

let usersDB = { users: [], teacherExams: [] };
let currentUser = null;

// ==========================================
// 📥 1. تحميل البيانات من GitHub
// ==========================================
async function loadPartnersData() {
    try {
        const response = await fetch('../users_db.json');
        if (response.ok) {
            usersDB = await response.json();
            console.log('✅ تم تحميل بيانات الشركاء من users_db.json');
        }
    } catch (error) {
        console.warn('⚠️ خطأ في تحميل البيانات:', error);
    }
}

// ==========================================
// 🔐 2. نظام تسجيل الدخول
// ==========================================
async function handleLogin(e) {
    e.preventDefault();
    await loadPartnersData(); // تحميل البيانات أولاً
    
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value.trim();
    const errorMsg = document.getElementById('login-error');

    const user = usersDB.users.find(u => u.email === email && u.pass === pass && u.role === 'teacher');

    if (user) {
        currentUser = user;
        errorMsg.classList.add('hidden');
        document.getElementById('login-container').classList.add('hidden');
        document.getElementById('dashboard-container').classList.remove('hidden');
        initDashboard();
    } else {
        errorMsg.textContent = '❌ بيانات الدخول غير صحيحة أو الحساب غير مفعل.';
        errorMsg.classList.remove('hidden');
    }
}

function handleLogout() {
    currentUser = null;
    document.getElementById('dashboard-container').classList.add('hidden');
    document.getElementById('login-container').classList.remove('hidden');
    document.getElementById('login-form').reset();
}

// ==========================================
// 🚀 3. تهيئة لوحة التحكم
// ==========================================
function initDashboard() {
    document.getElementById('sidebar-teacher-name').textContent = currentUser.name;
    document.getElementById('profile-name').textContent = currentUser.name;
    document.getElementById('profile-email').textContent = currentUser.email;
    document.getElementById('profile-phone').textContent = currentUser.phone || '---';
    document.getElementById('profile-commission').textContent = currentUser.commission + '%';
    document.getElementById('profile-join-date').textContent = currentUser.joinDate;
    showTab('my-groups');
}

// ==========================================
// 🧭 4. التنقل بين التبويبات
// ==========================================
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    const targetTab = document.getElementById('tab-' + tabId);
    if (targetTab) targetTab.classList.remove('hidden');

    const activeBtn = Array.from(document.querySelectorAll('.nav-btn')).find(btn => btn.getAttribute('onclick').includes(tabId));
    if (activeBtn) activeBtn.classList.add('active');

    if (tabId === 'my-groups') renderGroups();
    if (tabId === 'my-files') renderFiles();
    if (tabId === 'statistics') updateStatistics();
}

// ==========================================
// 👥 5. تبويب: مجموعاتي
// ==========================================
function renderGroups() {
    const grid = document.getElementById('groups-grid');
    grid.innerHTML = '';

    const myStudents = usersDB.users.filter(u => u.role === 'student' && u.teacherId === currentUser.id);
    const groups = {};

    myStudents.forEach(s => {
        const key = `${s.level}-${s.grade}-${s.type}`;
        if (!groups[key]) {
            groups[key] = { 
                title: `${getLevelName(s.level)} - Grade ${s.grade} [${s.type}]`, 
                path: key, 
                students: [],
                filesCount: 0
            };
        }
        groups[key].students.push(s);
    });

    (usersDB.teacherExams || []).filter(ex => ex.teacherId === currentUser.id).forEach(ex => {
        const key = `${ex.level}-${ex.grade}-${ex.type}`;
        if (groups[key]) groups[key].filesCount++;
    });

    Object.values(groups).forEach(group => {
        const card = document.createElement('div');
        card.className = 'group-card';
        card.onclick = () => openGroupDetails(group);
        card.innerHTML = `
            <h3>${group.title}</h3>
            <div class="meta">المسار: ${group.path}</div>
            <div class="stats">
                <span><i class="fas fa-users"></i> ${group.students.length} طالب</span>
                <span class="file-count"><i class="fas fa-file-alt"></i> ${group.filesCount} ملف</span>
            </div>
        `;
        grid.appendChild(card);
    });

    if (Object.keys(groups).length === 0) {
        grid.innerHTML = '<p style="color:var(--text-muted); text-align:center; grid-column: 1/-1;">لا توجد مجموعات حالياً.</p>';
    }
}

function openGroupDetails(group) {
    document.getElementById('group-details-title').textContent = `طلاب مجموعة: ${group.title}`;
    const tbody = document.getElementById('group-students-tbody');
    tbody.innerHTML = '';

    group.students.forEach((s, index) => {
        const status = getSubscriptionStatus(s);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${s.name}</strong></td>
            <td>${s.email}</td>
            <td><span class="badge ${status.class}">${status.text}</span></td>
            <td>${status.endDate}</td>
        `;
        tbody.appendChild(tr);
    });

    showTab('group-details');
}

// ==========================================
// 📁 6. تبويب: ملفاتي
// ==========================================
function renderFiles() {
    const tbody = document.getElementById('files-tbody');
    tbody.innerHTML = '';

    const myFiles = (usersDB.teacherExams || []).filter(ex => ex.teacherId === currentUser.id);

    myFiles.forEach(file => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${file.title}</strong></td>
            <td>${getLevelName(file.level)} - G${file.grade} [${file.type}] - Unit ${file.unit}</td>
            <td>${file.addedDate}</td>
            <td><a href="${file.url}" target="_blank" class="badge badge-success" style="text-decoration:none;">فتح الرابط</a></td>
        `;
        tbody.appendChild(tr);
    });

    if (myFiles.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">لا توجد ملفات مرفوعة.</td></tr>';
    }
}

// ==========================================
// 📊 7. تبويب: إحصاءات
// ==========================================
function updateStatistics() {
    const myStudents = usersDB.users.filter(u => u.role === 'student' && u.teacherId === currentUser.id);
    const total = myStudents.length;
    const active = myStudents.filter(s => s.isPaid).length;
    const rate = total > 0 ? Math.round((active / total) * 100) : 0;
    
    const revenuePerStudent = 100; 
    const totalEarnings = (active * revenuePerStudent * currentUser.commission) / 100;

    document.getElementById('stat-total-students').textContent = total;
    document.getElementById('stat-active-students').textContent = active;
    document.getElementById('stat-activation-rate').textContent = rate + '%';
    document.getElementById('stat-total-earnings').textContent = totalEarnings.toFixed(2) + ' ج.م';
    document.getElementById('stat-commission-rate').textContent = `نسبة عمولتك: ${currentUser.commission}%`;
}

// ==========================================
// 🛠️ دوال مساعدة
// ==========================================
function getLevelName(level) {
    const names = { 'primary': 'الابتدائية', 'preparatory': 'الإعدادية', 'secondary': 'الثانوية' };
    return names[level] || level;
}

function getSubscriptionStatus(student) {
    if (!student.isPaid) return { text: 'معلق', class: 'badge-danger', endDate: '---' };
    
    const join = new Date(student.joinDate);
    const expire = new Date(join);
    expire.setDate(join.getDate() + parseInt(student.duration || 30));
    const today = new Date();
    const diffTime = expire - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: 'منتهي', class: 'badge-danger', endDate: expire.toLocaleDateString('ar-EG') };
    if (diffDays <= 5) return { text: 'قارب على الانتهاء', class: 'badge-warning', endDate: expire.toLocaleDateString('ar-EG') };
    return { text: 'مفعل', class: 'badge-success', endDate: expire.toLocaleDateString('ar-EG') };
}

function handleContactSubmit(e) {
    e.preventDefault();
    alert('✅ تم إرسال رسالتك إلى إدارة المنصة بنجاح! سيتم الرد عليك قريباً.');
    e.target.reset();
}