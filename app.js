// ==================== 🧠 المحرك البرمجي المركزي الموحد ====================
// ✅ نسخة GitHub: English Marathon - منصة الماراتون الإنجليزي
const MY_WHATSAPP_NUMBER = "201149955726";

// ==========================================
// ✅ قاعدة البيانات الموحدة الجديدة
// ==========================================
let usersDB = {
    users: [],
    settings: {
        shareImageUrl: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=1000&auto=format&fit=crop",
        platformLogo: "",
        globalAnnouncement: "",
        globalExamMode: false,
        showSubscriptionButton: true,
        customCurriculums: ["OL", "AL"],
        partnersFolderUrl: "./partners/index.html"
    },
    permissions: {
        manage_activities: "إدارة الأنشطة والأسئلة",
        manage_users: "إدارة المستخدمين (طلاب/مدرسين)",
        manage_financial: "الإدارة المالية والاشتراكات",
        manage_messages: "إدارة الرسائل والبث",
        view_reports: "عرض التقارير والإحصائيات",
        manage_exams: "إدارة امتحانات الشركاء"
    },
    teacherExams: [],
    groups: []
};

let marathonQuestionsDB = {
    activityDatabase: {
        explanation: [], exam: [], complete: [], correct: [], translate: [],
        find_the_vowel: [], grammer: [], justtalk: [], Matching: [],
        re_arrange: [], rewrite: [], Scramble: [], sequence: [],
        situations: [], sorting: [], spilling: [], Underline: [],
        vocab_listening_quiz: [], vocab_quiz: [], what_do_you_hear: [],
        vocab_choose: []
    }
};

const allActivitiesDict = {
    explanation: "📖 شرح وروابط خارجية",
    exam: "📝 امتحانات عامة",
    complete: "Complete (أكمل القطعة)",
    correct: "Correct (صحح ما بين الأقواس)",
    find_the_vowel: "Find the Vowel (أوجد الحروف المتحركة)",
    grammer: "Grammer Choose (جرامر اختياري)",
    justtalk: "Just Talk (اقرأ وتحدث)",
    Matching: "Matching the Word (توصيل)",
    re_arrange: "Re-arrange (رتب الكلمات)",
    rewrite: "Rewrite (أعد كتابة الجملة)",
    Scramble: "Scramble (أعد ترتيب الحروف)",
    sequence: "Sequence (استمع ورتب الأحداث)",
    situations: "Situations (ماذا نقول في هذا الموقف)",
    sorting: "Sorting (ضع الكلمات في الصندوق المناسب)",
    spilling: "Spilling (استمع واكتب)",
    Underline: "Underline (اختر الكلمات المطلوبة)",
    vocab_listening_quiz: "Vocab Listening Quiz (استمع واختر المعنى الصحيح)",
    vocab_quiz: "Vocab Quiz (اختر المعنى الصحيح)",
    what_do_you_hear: "What Do You Hear (استمع واختر ما سمعته)",
    vocab_choose: "Vocab Choose (اختر الكلمة المناسبة)",
    translate: "translate (الترجمة)"
};

// ✅ قاعدة بيانات الامتحانات الجديدة (محور العملية الجراحية)
let marathonExamsDB = { exams: [] };

let sessionUser = null;
let deferredPrompt = null;
let currentAdminView = 'students';

// ==========================================
// ✅ نظام الصلاحيات الموحد
// ==========================================
const PermissionSystem = {
    hasPermission(user, permission) {
        if (!user || !user.permissions) return false;
        if (user.permissions.includes('all')) return true;
        return user.permissions.includes(permission);
    },
    getAllPermissions() {
        return [
            { key: 'manage_activities', label: '📝 إدارة الأنشطة والأسئلة' },
            { key: 'manage_users', label: '👥 إدارة المستخدمين (طلاب/مدرسين)' },
            { key: 'manage_financial', label: '💰 الإدارة المالية والاشتراكات' },
            { key: 'manage_messages', label: '📢 إدارة الرسائل والبث' },
            { key: 'view_reports', label: '📊 عرض التقارير والإحصائيات' },
            { key: 'manage_exams', label: '🎯 إدارة امتحانات الشركاء' }
        ];
    },
    getRoleInfo(role) {
        const roles = {
            'admin': { name: 'مدير النظام', icon: '👑', color: '#f59e0b' },
            'assistant': { name: 'مساعد المدير', icon: '🤝', color: '#3b82f6' },
            'teacher': { name: 'مدرس شريك', icon: '👨‍🏫', color: '#10b981' },
            'student': { name: 'طالب', icon: '🎓', color: '#8b5cf6' }
        };
        return roles[role] || { name: 'مستخدم', icon: '👤', color: '#6b7280' };
    }
};

// ==========================================
// ✅ نظام التحميل الهجين (أونلاين من JSON / أوفلاين من localStorage)
// ==========================================
async function loadAllDataHybrid() {
    console.log("🔄 جاري تهيئة النظام والتحقق من مصدر البيانات...");
    
    try {
        // محاولة جلب البيانات من ملفات JSON (وضع GitHub الأونلاين)
        // نضيف ?v=Date.now() لمنع المتصفح من استخدام النسخة المخزنة (Cache)
        const timestamp = Date.now();
        const [usersRes, questionsRes, examsRes] = await Promise.all([
            fetch(`./users_db.json?v=${timestamp}`),
            fetch(`./marathonQuestionsDB.json?v=${timestamp}`),
            fetch(`./marathonExamsDB.json?v=${timestamp}`)
        ]);

        let loadedFromServer = false;

        if (usersRes.ok) {
            usersDB = await usersRes.json();
            loadedFromServer = true;
        }
        if (questionsRes.ok) {
            marathonQuestionsDB = await questionsRes.json();
            loadedFromServer = true;
        }
        if (examsRes.ok) {
            const examsData = await examsRes.json();
            marathonExamsDB = deepTrim(examsData); // استخدام دالة التنظيف الخاصة بك
            loadedFromServer = true;
        }

        if (loadedFromServer) {
            console.log("✅ تم تحميل البيانات من ملفات JSON (وضع الأونلاين)");
            // مزامنة محلية احتياطية لضمان عمل الجلسة
            localStorage.setItem('users_db', JSON.stringify(usersDB));
            localStorage.setItem('marathon_questions_db', JSON.stringify(marathonQuestionsDB));
            localStorage.setItem('marathon_exams_db', JSON.stringify(marathonExamsDB));
            return; // إنهاء الدالة بنجاح
        }
    } catch (error) {
        console.warn("⚠️ لم يتم العثور على ملفات JSON أو فشل الاتصال، جاري التحميل من localStorage (وضع الأوفلاين)...");
    }
    async function syncExamsDBFromServer() {
    try {
        const res = await fetch('marathonExamsDB.json?v=' + Date.now(), { cache: 'no-store' });
        if (res.ok) {
            const data = deepTrim(await res.json());
            if (data && Array.isArray(data.exams)) {
                marathonExamsDB = data;
                localStorage.setItem('marathon_exams_db', JSON.stringify(marathonExamsDB));
                console.log(`✅ تمت مزامنة ${data.exams.length} امتحاناً من السيرفر`);
            }
        }
    } catch (e) {
        console.warn('⚠️ تعذرت المزامنة، سأستخدم النسخة المحلية:', e.message);
    }
}

    // ==========================================
    // ✅ وضع الأوفلاين: التحميل من localStorage
    // ==========================================
    if (localStorage.getItem('users_db')) {
        try {
            usersDB = JSON.parse(localStorage.getItem('users_db'));
        } catch (e) { console.warn("⚠️ خطأ في قراءة users_db:", e); }
    } else {
        migrateOldDatabase(); // ترقية القاعدة القديمة إذا وجدت
    }

    if (localStorage.getItem('marathon_questions_db')) {
        try {
            marathonQuestionsDB = JSON.parse(localStorage.getItem('marathon_questions_db'));
        } catch (e) { console.warn("⚠️ خطأ في قراءة marathon_questions_db:", e); }
    }

    if (localStorage.getItem('marathon_exams_db')) {
        try {
            marathonExamsDB = JSON.parse(localStorage.getItem('marathon_exams_db'));
        } catch (e) { console.warn("⚠️ خطأ في قراءة marathon_exams_db:", e); }
    }
    
    console.log("✅ تم تحميل البيانات من localStorage بنجاح");
}


// ==========================================
// ✅ ترقية قاعدة البيانات القديمة
// ==========================================
function migrateOldDatabase() {
    console.log("🔄 بدء ترقية قاعدة البيانات القديمة...");
    const oldStudents = localStorage.getItem('marathon_students_db');
    usersDB.users.push({
        id: 'u1', role: 'admin', name: 'مستر إنجليزي', email: 'medo', pass: '1234',
        isActive: true, joinDate: new Date().toISOString().split('T')[0], permissions: ['all']
    });
    if (oldStudents) {
        try {
            const oldData = JSON.parse(oldStudents);
            if (oldData.students) {
                oldData.students.forEach((s, idx) => {
                    usersDB.users.push({
                        id: 'u' + (idx + 2), role: 'student', name: s.name || s.studentName,
                        email: s.email, pass: s.pass || s.password, isActive: s.isPaid !== false,
                        isPaid: s.isPaid !== false, joinDate: s.joinDate || new Date().toISOString().split('T')[0],
                        duration: s.duration || 30, level: s.level || 'primary', grade: s.grade || '1',
                        type: s.type || 'OL', status: 'free', teacherId: null, subscriptionPrice: 0,
                        customMessage: s.customMessage || "", broadcastMessage: s.broadcastMessage || ""
                    });
                });
            }
            if (oldData.shareImageUrl) usersDB.settings.shareImageUrl = oldData.shareImageUrl;
            console.log(`✅ تم ترقية ${oldData.students ? oldData.students.length : 0} طالب`);
        } catch (e) { console.error("❌ خطأ في الترقية:", e); }
    }
    localStorage.setItem('users_db', JSON.stringify(usersDB));
    localStorage.setItem('database_migrated', 'true');
}

// ==========================================
// ✅ حفظ جميع البيانات في localStorage
// ==========================================
function saveAllDataToStorage() {
    localStorage.setItem('users_db', JSON.stringify(usersDB));
    localStorage.setItem('marathon_questions_db', JSON.stringify(marathonQuestionsDB));
    localStorage.setItem('marathon_exams_db', JSON.stringify(marathonExamsDB));
    console.log("💾 تم حفظ جميع البيانات في localStorage بنجاح");
}

// ==========================================
// ✅ دوال مساعدة
// ==========================================
function getRoleLabel(role) {
    const labels = { 'student': '🎓 طالب', 'teacher': '👨‍🏫 مدرس', 'assistant': '🤝 مساعد', 'admin': '👑 أدمن' };
    return labels[role] || role;
}
function getLevelName(level) {
    const names = { 'primary': 'الابتدائية', 'preparatory': 'الإعدادية', 'secondary': 'الثانوية' };
    return names[level] || level;
}
function calculateDaysLeft(joinDate, duration) {
    if (!joinDate) return 999;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const join = new Date(joinDate);
    const expire = new Date(join);
    expire.setDate(join.getDate() + parseInt(duration || 30));
    const diff = expire.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
}
function getGradesOptions(level, selectedGrade) {
    const maxGrade = level === 'primary' ? 6 : 3;
    let options = '';
    for (let i = 1; i <= maxGrade; i++) {
        options += `<option value="${i}" ${selectedGrade == i ? 'selected' : ''}>${i}</option>`;
    }
    return options;
}

// ==========================================
// ✅ ملء قائمة الوحدات (1-12)
// ==========================================
function populateUnitsFilter(selectId, includeAllOption = true) {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = '';
    if (includeAllOption) {
        const optAll = document.createElement('option');
        optAll.value = 'all'; optAll.textContent = 'الكل';
        select.appendChild(optAll);
    }
    for (let i = 1; i <= 12; i++) {
        const opt = document.createElement('option');
        opt.value = i.toString(); opt.textContent = `Unit ${i}`;
        select.appendChild(opt);
    }
}

// ==========================================
// ✅ ملء قائمة المناهج (تشمل المخصصة)
// ==========================================
function fillCurriculumsSelect(selectId, includeAll = false) {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = '';
    if (includeAll) {
        const optAll = document.createElement('option');
        optAll.value = 'all'; optAll.textContent = 'الكل';
        select.appendChild(optAll);
    }
    const curriculums = [...new Set(['OL', 'AL', ...usersDB.settings.customCurriculums])];
    curriculums.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c; opt.textContent = c;
        select.appendChild(opt);
    });
}

// ==========================================
// ✅ تهيئة الصفحة عند التحميل
// ==========================================
// ==========================================
// ✅ تهيئة الصفحة عند التحميل
// ==========================================
window.addEventListener('DOMContentLoaded', async () => {
    // 1. تحميل البيانات (هجين: أونلاين أو أوفلاين)
    await loadAllDataHybrid();
    
    // 2. التأكد من وجود هياكل البيانات الأساسية
    if (!marathonQuestionsDB.activityDatabase) marathonQuestionsDB.activityDatabase = {};
    if (!marathonQuestionsDB.activityDatabase.explanation) marathonQuestionsDB.activityDatabase.explanation = [];
    if (!marathonQuestionsDB.activityDatabase.exam) marathonQuestionsDB.activityDatabase.exam = [];
    if (!marathonExamsDB.exams) marathonExamsDB.exams = [];

      adaptGradesSelector('filterLevel', 'filterGrade', true);
    adaptGradesSelector('qFilterLevel', 'qFilterGrade', true);
    adaptGradesSelector('msgFilterLevel', 'msgFilterGrade', true);
    adaptGradesSelector('newStudentLevel', 'newStudentGrade');
    
    // ✅ إضافة جراحية: ضمان تعبئة قوائم المناهج في جميع الفلاتر عند التحميل
    fillCurriculumsSelect('filterType', true);
    fillCurriculumsSelect('msgFilterType', true);
    fillCurriculumsSelect('qFilterCurriculum', true);
    populateUnitsFilter('qFilterUnit', true);
    populateUnitsFilter('previewUnitFilter', false);
    fillCurriculumsSelect('qFilterCurriculum', true);
    
    const selectAct = document.getElementById('qFilterActivity');
    if (selectAct) {
        Object.keys(allActivitiesDict).forEach(k => {
            if (k !== 'explanation' && k !== 'exam') {
                let opt = document.createElement('option');
                opt.value = k; opt.textContent = '🎮 ' + allActivitiesDict[k];
                selectAct.appendChild(opt);
            }
        });
    }

    const imgInput = document.getElementById('adminShareImgUrlInput');
    if (imgInput) imgInput.value = usersDB.settings.shareImageUrl || '';
    
    loadSavedLogo();
    checkRememberedOrSession();
});

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const pwaBtn = document.getElementById('menu-item-pwa');
    if (pwaBtn) pwaBtn.classList.remove('hidden');
});
function triggerPWAInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
            const pwaBtn = document.getElementById('menu-item-pwa');
            if (pwaBtn) pwaBtn.classList.add('hidden');
        }
        deferredPrompt = null;
    });
}

function adaptGradesSelector(levelSelectId, gradeSelectId, includeAllOption = false) {
    const lvlSel = document.getElementById(levelSelectId);
    const grdSel = document.getElementById(gradeSelectId);
    if (!lvlSel || !grdSel) return;
    const val = lvlSel.value;
    grdSel.innerHTML = '';
    if (includeAllOption) {
        let optAll = document.createElement('option');
        optAll.value = 'all'; optAll.textContent = 'الكل';
        grdSel.appendChild(optAll);
    }
    let maxGrade = 3;
    if (val === 'primary') maxGrade = 6;
    if (val === 'preparatory') maxGrade = 3;
    if (val === 'secondary') maxGrade = 3;
    if (val === 'all' && includeAllOption) maxGrade = 6;
    for (let i = 1; i <= maxGrade; i++) {
        let opt = document.createElement('option');
        opt.value = i.toString(); opt.textContent = i.toString();
        grdSel.appendChild(opt);
    }
}

function saveShareImageUrl() {
    const url = document.getElementById('adminShareImgUrlInput').value.trim();
    if (!url) { alert("من فضلك أدخل رابطاً صحيحاً أولاً!"); return; }
    usersDB.settings.shareImageUrl = url;
    saveAllDataToStorage();
    alert("✅ تم حفظ وتحديث رابط صورة المشاركة بنجاح!");
}
function saveLogoUrl() {
    const input = document.getElementById('adminLogoUrlInput');
    if (!input) return;
    const url = input.value.trim();
    if (!url) { alert("من فضلك أدخل رابطاً صحيحاً أولاً!"); return; }
    usersDB.settings.platformLogo = url;
    localStorage.setItem('marathon_platform_logo', url);
    const logoImg = document.getElementById('platformLogo');
    if (logoImg) logoImg.src = url;
    alert("✅ تم حفظ وتحديث رابط اللوجو بنجاح!");
}
function loadSavedLogo() {
    if (usersDB.settings.platformLogo) {
        const logoImg = document.getElementById('platformLogo');
        if (logoImg) logoImg.src = usersDB.settings.platformLogo;
        const logoInput = document.getElementById('adminLogoUrlInput');
        if (logoInput) logoInput.value = usersDB.settings.platformLogo;
    }
}
function checkRememberedOrSession() {
    const remembered = localStorage.getItem('marathon_remembered');
    const session = localStorage.getItem('marathon_session');
    const data = remembered || session;
    if (data) {
        try {
            sessionUser = JSON.parse(data);
            if (sessionUser && sessionUser.role) { showDashboardLayout(); return; }
        } catch (e) { console.warn("خطأ في قراءة الجلسة:", e); }
    }
}

// ==========================================
// ✅ معالجة تسجيل الدخول
// ==========================================
function handleAuth() {
    const email = document.getElementById('authEmail').value.trim();
    const pass = document.getElementById('authPass').value.trim();
    const rememberMe = document.getElementById('authRemember').checked;
    if (!email || !pass) { alert("من فضلك ادخل البريد وكود المرور بشكل صحيح!"); return; }
    const user = usersDB.users.find(u => u.email === email && u.pass === pass);
    if (!user) {
        if (email === 'medo' && pass === '1234') {
            sessionUser = { role: 'admin', name: 'مستر إنجليزي 👑', permissions: ['all'] };
            saveSession(rememberMe);
            showDashboardLayout();
            return;
        }
        alert("❌ بيانات الدخول غير صحيحة!");
        return;
    }
    if (!user.isActive) { alert('⚠️ حسابك معلق حالياً!\n\nيرجى التواصل مع الإدارة.'); return; }
    if (user.role === 'student') {
        const daysLeft = calculateDaysLeft(user.joinDate, user.duration);
        if (daysLeft < 0) {
            alert('🚫 حسابك تم تعليقه لانتهاء مدة الاشتراك.\n\nمن فضلك اتصل بالمنصة لتجديد الاشتراك.');
            return;
        }
    }
    sessionUser = user;
    saveSession(rememberMe);
    user.lastLogin = new Date().toISOString();
    showDashboardLayout();
    if (user.role === 'student') {
        if (user.customMessage && user.customMessage.trim() !== "") {
            setTimeout(() => { alert('💬 رسالة خاصة من المستر لك:\n\n' + user.customMessage); }, 600);
        }
        if (user.broadcastMessage && user.broadcastMessage.trim() !== "") {
            setTimeout(() => {
                alert('📢 رسالة هامة:\n\n' + user.broadcastMessage);
                user.broadcastMessage = "";
            }, 1200);
        }
    }
}
function saveSession(rememberMe) {
    if (rememberMe) localStorage.setItem('marathon_remembered', JSON.stringify(sessionUser));
    localStorage.setItem('marathon_session', JSON.stringify(sessionUser));
}
function logout() {
    localStorage.removeItem('marathon_session');
    localStorage.removeItem('marathon_remembered');
    location.reload();
}

// ==========================================
// ✅ عرض لوحة التحكم حسب الدور
// ==========================================
function showDashboardLayout() {
    document.getElementById('authBox').classList.add('hidden');
    document.getElementById('mainDashboardLayout').classList.remove('hidden');
    hideAllMenuItems();
    if (sessionUser.role === 'admin') setupAdminDashboard();
    else if (sessionUser.role === 'assistant') setupAssistantDashboard();
    else if (sessionUser.role === 'teacher') setupTeacherDashboard();
    else if (sessionUser.role === 'student') setupStudentDashboard();
}
function hideAllMenuItems() {
    const menuItems = [
        'menu-item-students','sidebar-import-students',
'sidebar-clear-students', 'menu-item-questions', 'menu-item-my-exams', 'menu-item-messages',
        'menu-item-preview', 'menu-item-groups', 'menu-item-teacher-exams', 'menu-item-images',
        'sidebar-download-students', 'sidebar-download-questions', 'adminShareImgGroup', 'adminLogoGroup',
        'menu-item-pwa', 'menu-item-my-group', 'menu-item-contact', 'menu-item-toggle-view'
    ];
    menuItems.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
}
function setupAdminDashboard() {
    document.getElementById('sidebarTitle').textContent = "👑 لوحة المستر";
    ['menu-item-students', 'menu-item-questions', 'menu-item-messages', 'menu-item-preview',
        'menu-item-groups','sidebar-import-students',
'sidebar-clear-students', 'menu-item-images', 'sidebar-download-students', 'sidebar-download-questions',
        'menu-item-pwa'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('hidden');
    });
    const examsBtn = document.getElementById('menu-item-exams');
    if (examsBtn) examsBtn.classList.remove('hidden');
    const groupsBtnText = document.getElementById('groupsBtnText');
    if (groupsBtnText) groupsBtnText.textContent = 'إدارة المجموعات والشركاء';
    const backBtn = document.getElementById('menu-item-back-to-admin');
    if (backBtn) backBtn.classList.add('hidden');
    const studentSidebar = document.getElementById('studentNameSidebar');
    if (studentSidebar) studentSidebar.style.display = 'none';
    renderAdminStats();
    switchMainTab('students');
}
function setupAssistantDashboard() {
    document.getElementById('sidebarTitle').textContent = "🤝 لوحة المساعد";
    const permissions = sessionUser.permissions || [];
    if (PermissionSystem.hasPermission(sessionUser, 'manage_users')) document.getElementById('menu-item-students').classList.remove('hidden');
    if (PermissionSystem.hasPermission(sessionUser, 'manage_activities')) document.getElementById('menu-item-questions').classList.remove('hidden');
    if (PermissionSystem.hasPermission(sessionUser, 'manage_messages')) document.getElementById('menu-item-messages').classList.remove('hidden');
    if (PermissionSystem.hasPermission(sessionUser, 'view_reports')) document.getElementById('menu-item-preview').classList.remove('hidden');
    if (PermissionSystem.hasPermission(sessionUser, 'manage_exams')) document.getElementById('menu-item-groups').classList.remove('hidden');
    if (permissions.includes('manage_users')) switchMainTab('students');
    else if (permissions.includes('manage_activities')) switchMainTab('questions');
    else switchMainTab('preview');
}
if (tabName === 'exams') {
    adaptGradesSelector('examFilterLevel', 'examFilterGrade', true);
    fillCurriculumsSelect('examFilterCurriculum', true);
    renderExamsAdmin();
}
function setupTeacherDashboard() {
    document.getElementById('sidebarTitle').textContent = "👨‍🏫 لوحة المدرس";
    const groupsBtnText = document.getElementById('groupsBtnText');
    if (groupsBtnText) groupsBtnText.textContent = 'مجموعاتي';
    document.getElementById('menu-item-groups').classList.remove('hidden');
    document.getElementById('menu-item-teacher-exams').classList.remove('hidden');
    document.getElementById('menu-item-contact').classList.remove('hidden');
    renderTeacherDashboard();
    switchMainTab('groups');
}
function setupStudentDashboard() {
    document.getElementById('sidebarTitle').textContent = "🎓 لوحة الطالب";
    const studentSidebar = document.getElementById('studentNameSidebar');
    if (studentSidebar) {
        studentSidebar.style.display = 'block';
        const nameText = document.getElementById('studentNameSidebarText');
        if (nameText) nameText.textContent = sessionUser.name || '---';
    }
    document.getElementById('menu-item-toggle-view').classList.remove('hidden');
    document.getElementById('menu-item-contact').classList.remove('hidden');
    document.getElementById('menu-item-my-exams').classList.remove('hidden');
    window.studentViewMode = sessionUser.teacherId ? 'mygroup' : 'marathon';
    updateToggleButtons();
    calculateStudentSubscriptionPulse();
    switchMainTab('preview');
    setupStudentDashboardView(sessionUser);
    loadSavedLogo();
}

// ==========================================
// ✅ دالة ذكية: تتصرف حسب دور المستخدم
// ==========================================
function handleGroupsClick() {
    if (sessionUser.role === 'admin') openGroupsModal();
    else if (sessionUser.role === 'teacher') { renderTeacherDashboard(); switchMainTab('groups'); }
}

// ==========================================
// ✅ تبديل التبويبات
// ==========================================
function switchMainTab(tabName) {
    document.querySelectorAll('.admin-tab').forEach(function(t) { t.classList.add('hidden'); });
    document.querySelectorAll('.sidebar-menu li').forEach(function(l) { l.classList.remove('active'); });
    const targetTab = document.getElementById('tab-' + tabName);
    if (targetTab) targetTab.classList.remove('hidden');
    const menuItem = document.getElementById('menu-item-' + tabName);
    if (menuItem) menuItem.classList.add('active');
    if (tabName === 'students') {
        currentAdminView = 'students';
        renderAdminStats();
        renderUsersTable();
        document.getElementById('studentsTableContainer').classList.remove('hidden');
        document.getElementById('teachersTableContainer').classList.add('hidden');
        document.getElementById('btnAddUser').textContent = '➕ إضافة طالب جديد';
    }
    if (tabName === 'preview') {
        populateUnits();
        if (sessionUser && sessionUser.role === 'admin') {
            const backBtn = document.getElementById('menu-item-back-to-admin');
            if (backBtn) backBtn.classList.remove('hidden');
            setupStudentDashboardView({ name: "المستر (معاينة حية)", level: "primary", grade: "3", type: "AL" });
        }
    }
    if (tabName === 'groups') {
        if (sessionUser.role === 'teacher') renderTeacherDashboard();
    }
}
function showStudentsTable() {
    currentAdminView = 'students';
    document.getElementById('studentsTableContainer').classList.remove('hidden');
    document.getElementById('teachersTableContainer').classList.add('hidden');
    document.getElementById('btnAddUser').textContent = '➕ إضافة طالب جديد';
    renderUsersTable();
}
function showTeachersTable() {
    currentAdminView = 'teachers';
    document.getElementById('studentsTableContainer').classList.add('hidden');
    document.getElementById('teachersTableContainer').classList.remove('hidden');
    document.getElementById('btnAddUser').textContent = '➕ إضافة مدرس جديد';
    renderTeachersTable();
}

// ==========================================
// ✅ إدارة الإحصائيات
// ==========================================
function renderAdminStats() {
    const totalUsers = usersDB.users.filter(u => u.role !== 'admin').length;
    const activeUsers = usersDB.users.filter(u => u.role !== 'admin' && u.isActive).length;
    const totalTeachers = usersDB.users.filter(u => u.role === 'teacher').length;
    const statTotal = document.getElementById('statTotalUsers');
    const statActive = document.getElementById('statActiveUsers');
    const statTeachers = document.getElementById('statTotalTeachers');
    if (statTotal) statTotal.textContent = totalUsers;
    if (statActive) statActive.textContent = activeUsers;
    if (statTeachers) statTeachers.textContent = totalTeachers;
}

// ==========================================
// ✅ امتحاناتي - صفحة الكروت المربعة (الخطوة 1 + تعديلات الخطوة 2)
// ==========================================
function showMyExams() {
    if (!sessionUser || sessionUser.role !== 'student') {
        alert("⚠️ هذه الميزة للطالب فقط!");
        return;
    }
    renderMyExamsCards();
    switchMainTab('my-exams');
}
function renderMyExamsCards() {
    const grid = document.getElementById('myExamsCardsGrid');
    if (!grid) return;
    // ✅ فلترة بالمسار فقط (مرحلة + صف + منهج) — كل امتحانات المسار تظهر
    const myExams = marathonExamsDB.exams.filter(exam =>
        exam.level === sessionUser.level &&
        String(exam.grade) === String(sessionUser.grade) &&
        exam.curriculum === sessionUser.type
    );
    if (myExams.length === 0) {
        grid.innerHTML = '<div class="no-activities-msg">📭 لا توجد امتحانات لمسارك الدراسي حالياً.</div>';
        return;
    }
    grid.innerHTML = myExams.map(exam => `
        <div class="exam-square-card" onclick="onExamCardClick('${exam.id}')">
            <div class="exam-card-icon">📝</div>
            <div class="exam-card-title">${exam.quizTitle || exam.title || 'بدون عنوان'}</div>
            <div class="exam-card-path">${getLevelName(exam.level)} - Grade ${exam.grade} - ${exam.curriculum}</div>
        </div>
    `).join('');
}
// 🎯 الخطوة 2: الكارت يقود إلى صفحة الامتحان الديناميكية
function onExamCardClick(examId) {
    window.location.href = 'exams/exam-player.html?examId=' + encodeURIComponent(examId);
}
function closeMyExamsModal() {
    document.getElementById('myExamsModal').classList.add('hidden');
}

// ==========================================
// ✅ بدء الامتحان (نظام قديم - يُترك للتوافق)
// ==========================================
function startStudentExam(examId) {
    const examsDB = JSON.parse(localStorage.getItem('marathon_exams_db') || '{"exams": []}');
    const exam = examsDB.exams.find(e => String(e.id) === String(examId));
    if (!exam) { alert("⚠️ الامتحان غير موجود!"); return; }
    localStorage.setItem('current_exam_session', JSON.stringify({
        examId: exam.id,
        examTitle: exam.quizTitle || exam.title,
        studentName: sessionUser.name,
        studentLevel: sessionUser.level,
        studentGrade: sessionUser.grade,
        studentCurriculum: sessionUser.type,
        studentUnit: window.currentActiveUnit || '1',
        startDate: new Date().toISOString()
    }));
    window.location.href = `exams/exam-player.html?examId=${exam.id}`;
}

// ⬅️ نهاية الجزء الأول — يتبع الجزء الثاني مباشرة
// ==========================================
// ✅ لوحة المدرس الخاصة
// ==========================================
function renderTeacherDashboard() {
    if (!sessionUser || sessionUser.role !== 'teacher') return;
    const teacherId = sessionUser.id;
    document.getElementById('teacherWelcomeName').textContent = sessionUser.name;
    document.getElementById('teacherPhoneDisplay').textContent = sessionUser.phone || '---';
    document.getElementById('teacherCommissionDisplay').textContent = (sessionUser.commission || 15) + '%';
    const myStudents = usersDB.users.filter(u => u.role === 'student' && u.teacherId === teacherId);
    const activeStudents = myStudents.filter(s => s.isActive);
    const groups = {};
    myStudents.forEach(s => {
        const key = `${s.level}-${s.grade}-${s.type}`;
        if (!groups[key]) {
            groups[key] = { title: `${getLevelName(s.level)} - Grade ${s.grade} [${s.type}]`, path: key, students: [], filesCount: 0 };
        }
        groups[key].students.push(s);
    });
    (usersDB.teacherExams || []).filter(ex => ex.teacherId === teacherId).forEach(ex => {
        const key = `${ex.level}-${ex.grade}-${ex.type}`;
        if (groups[key]) groups[key].filesCount++;
    });
    document.getElementById('teacherGroupsCount').textContent = Object.keys(groups).length;
    document.getElementById('teacherTotalStudents').textContent = myStudents.length;
    document.getElementById('teacherActiveStudents').textContent = activeStudents.length;
    const totalRevenue = activeStudents.reduce((sum, s) => sum + (parseFloat(s.subscriptionPrice) || 0), 0);
    const earnings = totalRevenue * (parseFloat(sessionUser.commission) || 15) / 100;
    document.getElementById('teacherMonthlyEarnings').textContent = earnings.toFixed(2) + ' ج.م';
    const grid = document.getElementById('teacherGroupsGrid');
    if (Object.keys(groups).length === 0) {
        grid.innerHTML = '<div class="no-activities-msg">📋 لا توجد مجموعات حالياً</div>';
    } else {
        grid.innerHTML = Object.values(groups).map(group => `<div class="group-card" onclick="showTeacherGroupDetails('${group.path}', '${group.title}', ${JSON.stringify(group.students).replace(/'/g, "\\'")})"> <h3>${group.title}</h3> <div class="meta">المسار: ${group.path}</div> <div class="stats"> <span> ${group.students.length} طالب</span> <span class="file-count">📁 ${group.filesCount} ملف</span> </div> </div>`).join('');
    }
}
function showTeacherGroupDetails(path, title, students) {
    document.getElementById('teacherGroupsGrid').classList.add('hidden');
    document.getElementById('teacherGroupDetails').classList.remove('hidden');
    document.getElementById('teacherGroupTitle').textContent = 'طلاب مجموعة: ' + title;
    const tbody = document.getElementById('teacherGroupStudentsTable');
    tbody.innerHTML = students.map((s, index) => {
        const daysLeft = calculateDaysLeft(s.joinDate, s.duration);
        const statusText = !s.isActive ? 'معلق' : (daysLeft < 0 ? 'منتهي' : (daysLeft <= 5 ? 'قارب على الانتهاء' : 'مفعل'));
        const statusClass = !s.isActive ? 'badge-danger' : (daysLeft < 0 ? 'badge-danger' : (daysLeft <= 5 ? 'badge-warning' : 'badge-success'));
        const daysText = daysLeft < 0 ? 'منتهي' : (daysLeft === 999 ? '---' : daysLeft + ' يوم');
        return `<tr>
  <td>${index + 1}</td>
  <td><strong>${s.name}</strong></td>
  <td>${s.email}</td>
  <td>${s.subscriptionPrice || 0} ج.م</td>
  <td><span class="badge ${statusClass}">${statusText}</span></td>
  <td>${daysText}</td>
</tr>`;
    }).join('');
}
function backToTeacherGroups() {
    document.getElementById('teacherGroupDetails').classList.add('hidden');
    document.getElementById('teacherGroupsGrid').classList.remove('hidden');
}

// ==========================================
// ✅ Modal إدارة المجموعات والشركاء (للأدمن)
// ==========================================
function openGroupsModal() {
    document.getElementById('groupsModal').classList.remove('hidden');
    document.getElementById('teacherDetails').classList.add('hidden');
    document.getElementById('teachersOverview').classList.remove('hidden');
    renderTeachersOverview();
}
function closeGroupsModal() { document.getElementById('groupsModal').classList.add('hidden'); }
function renderTeachersOverview() {
    const container = document.getElementById('teachersList');
    const teachers = usersDB.users.filter(u => u.role === 'teacher' && u.isActive);
    if (teachers.length === 0) {
        container.innerHTML = '<div class="no-activities-msg">📋 لا يوجد مدرسون شركاء حتى الآن</div>';
        return;
    }
    container.innerHTML = teachers.map(teacher => {
        const studentsCount = usersDB.users.filter(u => u.role === 'student' && u.teacherId === teacher.id && u.isActive).length;
        const examsCount = (usersDB.teacherExams || []).filter(e => e.teacherId === teacher.id).length;
        const totalRevenue = usersDB.users.filter(u => u.role === 'student' && u.teacherId === teacher.id && u.isActive)
            .reduce((sum, s) => sum + (parseFloat(s.subscriptionPrice) || 0), 0);
        const earnings = totalRevenue * (parseFloat(teacher.commission) || 15) / 100;
        return `
   <button class="teacher-wide-btn" onclick="showTeacherDetails('${teacher.id}')">
     <div class="teacher-btn-content">
       <div class="teacher-btn-icon">👨‍🏫</div>
       <div class="teacher-btn-info">
         <div class="teacher-btn-name">${teacher.name}</div>
         <div class="teacher-btn-email">${teacher.email}</div>
       </div>
       <div class="teacher-btn-stats">
         <div class="stat-item"><span class="stat-value">${studentsCount}</span><span class="stat-label">طالب</span></div>
         <div class="stat-item"><span class="stat-value">${examsCount}</span><span class="stat-label">امتحان</span></div>
         <div class="stat-item"><span class="stat-value">${teacher.commission || 15}%</span><span class="stat-label">عمولة</span></div>
         <div class="stat-item"><span class="stat-value">${earnings.toFixed(0)} ج</span><span class="stat-label">مستحقات</span></div>
       </div>
       <div class="teacher-btn-arrow">←</div>
     </div>
   </button>
 `;
    }).join('');
}
function showTeacherDetails(teacherId) {
    const teacher = usersDB.users.find(u => u.id === teacherId);
    if (!teacher) return;
    document.getElementById('teachersOverview').classList.add('hidden');
    document.getElementById('teacherDetails').classList.remove('hidden');
    document.getElementById('teacherNameDisplay').textContent = teacher.name;
    document.getElementById('teacherPhoneDisplay').textContent = teacher.phone || '---';
    document.getElementById('teacherCommissionDisplay').textContent = teacher.commission || 15;
    const students = usersDB.users.filter(u => u.role === 'student' && u.teacherId === teacherId);
    document.getElementById('teacherStudentsCountDisplay').textContent = students.length;
    const totalRevenue = students.filter(s => s.isActive).reduce((sum, s) => sum + (parseFloat(s.subscriptionPrice) || 0), 0);
    const earnings = totalRevenue * (parseFloat(teacher.commission) || 15) / 100;
    document.getElementById('teacherEarningsDisplay').textContent = earnings.toFixed(0) + ' ج';
    const tbody = document.getElementById('teacherStudentsTable');
    tbody.innerHTML = students.map(s => {
        const daysLeft = calculateDaysLeft(s.joinDate, s.duration);
        const statusText = !s.isActive ? 'معلق' : (daysLeft < 0 ? 'منتهي' : (daysLeft <= 5 ? 'قارب على الانتهاء' : 'مفعل'));
        const statusClass = !s.isActive ? 'badge-danger' : (daysLeft < 0 ? 'badge-danger' : (daysLeft <= 5 ? 'badge-warning' : 'badge-success'));
        return `<tr> <td>${s.name}</td> <td>${s.level} - G${s.grade} - ${s.type}</td> <td><span class="badge ${statusClass}">${statusText}</span></td> <td>${daysLeft < 0 ? 'منتهي' : daysLeft + ' يوم'}</td> </tr>`;
    }).join('');
}
function backToTeachersList() {
    document.getElementById('teacherDetails').classList.add('hidden');
    document.getElementById('teachersOverview').classList.remove('hidden');
}

// ==========================================
// ✅ عرض امتحانات المدرس (للمدرس)
// ==========================================
function showTeacherExams() {
    if (!sessionUser || sessionUser.role !== 'teacher') return;
    const teacherId = sessionUser.id;
    const myExams = (usersDB.teacherExams || []).filter(ex => ex.teacherId === teacherId);
    const tbody = document.getElementById('teacherExamsModalTable');
    if (myExams.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:30px;">📋 لا توجد امتحانات مضافة بعد</td></tr>';
    } else {
        tbody.innerHTML = myExams.map((exam, index) => {
            const pathInfo = `${getLevelName(exam.level)} - Grade ${exam.grade} - ${exam.curriculum || exam.type} - Unit ${exam.unit}`;
            const addedDate = exam.addedDate ? new Date(exam.addedDate).toLocaleDateString('ar-EG') : '---';
            return `<tr>
    <td>${index + 1}</td>
    <td><strong>${exam.title}</strong></td>
    <td style="font-size: 12px;">${pathInfo}</td>
    <td>${addedDate}</td>
    <td>
      <a href="${exam.url}" target="_blank" class="btn btn-success btn-small" style="width: auto; padding: 5px 12px; text-decoration: none;">
        🚀 فتح
      </a>
    </td>
  </tr>`;
        }).join('');
    }
    document.getElementById('teacherExamsModal').classList.remove('hidden');
}
function closeTeacherExamsModal() { document.getElementById('teacherExamsModal').classList.add('hidden'); }

// ==========================================
// ✅ Modal معلومات المدرس (للطالب)
// ==========================================
function openMyGroupModal() {
    if (!sessionUser || sessionUser.role !== 'student') { alert("هذه الميزة للطالب فقط"); return; }
    if (!sessionUser.teacherId) { alert("⚠️ أنت غير منضم لأي مدرس حالياً. يرجى التواصل مع الإدارة للانضمام."); return; }
    const teacher = usersDB.users.find(u => u.id === sessionUser.teacherId && u.role === 'teacher');
    if (!teacher) { alert("⚠️ لم يتم العثور على معلومات المدرس"); return; }
    document.getElementById('modalTeacherName').textContent = teacher.name;
    document.getElementById('modalTeacherPhone').textContent = teacher.phone || '---';
    document.getElementById('modalTeacherEmail').textContent = teacher.email || '---';
    const examsList = document.getElementById('modalTeacherExamsList');
    const teacherExams = (usersDB.teacherExams || []).filter(ex =>
        ex.teacherId === teacher.id &&
        ex.level === sessionUser.level &&
        ex.grade === sessionUser.grade &&
        ex.curriculum === sessionUser.type
    );
    if (teacherExams.length === 0) {
        examsList.innerHTML = '<div class="no-activities-msg">📝 لا توجد امتحانات متاحة حالياً</div>';
    } else {
        examsList.innerHTML = teacherExams.map(exam => `<div class="exam-card" onclick="window.open('${exam.url}', '_blank')"> <h4>${exam.title}</h4> <p>📚 ${getLevelName(exam.level)} - Grade ${exam.grade} - ${exam.curriculum} - Unit ${exam.unit}</p> <p>📅 تاريخ الإضافة: ${exam.addedDate || '---'}</p> </div>`).join('');
    }
    document.getElementById('teacherInfoModal').classList.remove('hidden');
}
function closeTeacherInfoModal() { document.getElementById('teacherInfoModal').classList.add('hidden'); }

// ==========================================
// ✅ Modal إدارة الصور
// ==========================================
function openImagesModal() {
    document.getElementById('shareImageUrlInput').value = usersDB.settings.shareImageUrl || '';
    document.getElementById('logoUrlInput').value = usersDB.settings.platformLogo || '';
    document.getElementById('imagesModal').classList.remove('hidden');
}
function closeImagesModal() { document.getElementById('imagesModal').classList.add('hidden'); }
function saveImagesSettings() {
    const shareUrl = document.getElementById('shareImageUrlInput').value.trim();
    const logoUrl = document.getElementById('logoUrlInput').value.trim();
    if (shareUrl) usersDB.settings.shareImageUrl = shareUrl;
    if (logoUrl) {
        usersDB.settings.platformLogo = logoUrl;
        const logoImg = document.getElementById('platformLogo');
        if (logoImg) logoImg.src = logoUrl;
    }
    saveAllDataToStorage();
    closeImagesModal();
    alert("✅ تم حفظ إعدادات الصور بنجاح!");
}

// ==========================================
// ✅ Modal الاشتراك
// ==========================================
function openSubscriptionModal() {
    const title = document.getElementById('subscriptionModalTitle');
    const content = document.getElementById('subscriptionModalContent');
    if (!sessionUser || sessionUser.role !== 'student') return;
    const daysLeft = calculateDaysLeft(sessionUser.joinDate, sessionUser.duration);
    if (daysLeft <= 5 && daysLeft >= 0) {
        title.textContent = '⚠️ تنبيه: الاشتراك على وشك الانتهاء';
        content.innerHTML = `<div class="subscription-message warning"> <p>متبقي على انتهاء اشتراكك: <strong>${daysLeft} يوم</strong></p> <p>يرجى دفع الاشتراك وإرسال إيصال الدفع عبر واتساب لتجديد اشتراكك.</p> </div> <a href="https://wa.me/201149955726?text=${encodeURIComponent('السلام عليكم، أريد تجديد اشتراكي في منصة English Marathon')}" target="_blank" class="whatsapp-btn"> 📱 إرسال إيصال الدفع عبر واتساب </a>`;
    } else if (daysLeft < 0) {
        title.textContent = '🚫 الاشتراك منتهي';
        content.innerHTML = `<div class="subscription-message warning"> <p>❌ اشتراكك منتهي منذ <strong>${Math.abs(daysLeft)} يوم</strong></p> <p>يرجى دفع الاشتراك وإرسال إيصال الدفع عبر واتساب لتجديد اشتراكك.</p> </div> <a href="https://wa.me/201149955726?text=${encodeURIComponent('السلام عليكم، أريد تجديد اشتراكي في منصة English Marathon')}" target="_blank" class="whatsapp-btn"> 📱 إرسال إيصال الدفع عبر واتساب </a>`;
    } else {
        title.textContent = '🎉 مبروك! اشتراكك نشط';
        content.innerHTML = `<div class="subscription-message success"> <p>✅ متبقي على اشتراكك: <strong>${daysLeft} يوم</strong></p> <p>استمتع بكل مميزات المنصة وأكمل تحدي الماراثون! 🏆</p> </div> <button class="btn btn-success" onclick="closeSubscriptionModal()" style="margin-top: 15px;"> 🚀 متابعة التحدي </button>`;
    }
    document.getElementById('subscriptionModal').classList.remove('hidden');
}
function closeSubscriptionModal() { document.getElementById('subscriptionModal').classList.add('hidden'); }

// ==========================================
// ✅ دالة التبديل بين "مجموعتي" و "Marathon"
// ==========================================
function toggleStudentView(mode) {
    window.studentViewMode = mode;
    updateToggleButtons();
    switchMainTab('preview'); // ✅ السطر السحري: يُرجع الشاشة لشاشة الأنشطة
    renderStudentActivities();
}
function updateToggleButtons() {
    const btnMyGroup = document.getElementById('btnMyGroup');
    const btnMarathon = document.getElementById('btnMarathon');
    if (window.studentViewMode === 'mygroup') {
        btnMyGroup.classList.add('active');
        btnMarathon.classList.remove('active');
    } else {
        btnMyGroup.classList.remove('active');
        btnMarathon.classList.add('active');
    }
}

// ==========================================
// ✅ عرض جدول المستخدمين (الطلاب)
// ==========================================
function renderUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const lvl = document.getElementById('filterLevel')?.value || 'all';
    const grd = document.getElementById('filterGrade')?.value || 'all';
    const typ = document.getElementById('filterType')?.value || 'all';
    const paid = document.getElementById('filterPaid')?.value || 'all';
    const exp = document.getElementById('filterExpiry')?.value || 'all';
    usersDB.users.forEach((user, idx) => {
        if (user.role !== 'student') return;
        if (lvl !== 'all' && user.level !== lvl) return;
        if (grd !== 'all' && user.grade !== grd) return;
        if (typ !== 'all' && user.type !== typ) return;
        if (paid === 'active' && !user.isActive) return;
        if (paid === 'suspended' && user.isActive) return;
        const daysLeft = calculateDaysLeft(user.joinDate, user.duration);
        let currentStatus = 'valid';
        if (daysLeft < 0) currentStatus = 'expired';
        else if (daysLeft <= 5) currentStatus = 'warning';
        if (exp !== 'all' && currentStatus !== exp) return;
        const isPulsing = (currentStatus === 'warning' || currentStatus === 'expired');
        const daysText = daysLeft < 0 ? 'منتهي' : (daysLeft === 999 ? '---' : daysLeft + ' يوم');
        const msgBtnText = user.customMessage ? 'تعديل' : 'إضافة';
        const tr = document.createElement('tr');
        tr.innerHTML = `
   <td>
     <input type="text" class="table-input" value="${user.name || ''}" onchange="updateUserField(${idx}, 'name', this.value)" style="font-weight: bold; margin-bottom:5px;">
     <input type="email" class="table-input" value="${user.email || ''}" onchange="updateUserField(${idx}, 'email', this.value)" style="font-size: 11px;">
   </td>
   <td><input type="text" class="table-input" value="${user.pass || ''}" onchange="updateUserField(${idx}, 'pass', this.value)" style="color: var(--warning);"></td>
   <td>
     <select class="role-select" onchange="changeUserRole(${idx}, this.value)">
       <option value="student" ${user.role === 'student' ? 'selected' : ''}>🎓 طالب</option>
       <option value="teacher" ${user.role === 'teacher' ? 'selected' : ''}>👨‍🏫 مدرس</option>
       <option value="assistant" ${user.role === 'assistant' ? 'selected' : ''}>🤝 مساعد</option>
     </select>
   </td>
   <td>
     <select class="role-select" onchange="handleGroupChange(${idx}, this.value)">
       <option value="free" ${!user.teacherId ? 'selected' : ''}>حر</option>
       <option value="joined" ${user.teacherId ? 'selected' : ''}>🔗 منضم</option>
     </select>
   </td>
   <td><input type="date" class="table-input ${isPulsing ? 'pulsing-red-cell' : ''}" value="${user.joinDate || ''}" onchange="updateUserField(${idx}, 'joinDate', this.value)"></td>
   <td><input type="number" class="table-input ${isPulsing ? 'pulsing-red-cell' : ''}" value="${user.duration || 30}" min="1" onchange="updateUserField(${idx}, 'duration', this.value)"></td>
   <td><span class="badge ${currentStatus === 'expired' ? 'badge-danger' : (currentStatus === 'warning' ? 'badge-danger' : 'badge-success')} ${isPulsing ? 'pulsing-red-cell' : ''}">${daysText}</span></td>
   <td><button class="btn btn-small" style="background: ${user.isActive ? 'var(--success)' : 'var(--danger)'};" onclick="toggleUserStatus(${idx})">${user.isActive ? '✅ مفعل' : '❌ معلق'}</button></td>
   <td><button class="btn btn-warning btn-small" onclick="openMessageModal(${idx})">💬 ${msgBtnText}</button></td>
   <td>
     <div style="display: flex; gap: 4px;">
       <button class="btn btn-success btn-small" onclick="saveAllDataToStorage();">💾</button>
       <button class="btn btn-danger btn-small" onclick="deleteUser(${idx})">🗑️</button>
     </div>
   </td>
 `;
        tbody.appendChild(tr);
    });
}

// ==========================================
// ✅ عرض جدول المدرسين
// ==========================================
function renderTeachersTable() {
    const tbody = document.getElementById('teachersTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    usersDB.users.forEach((user, idx) => {
        if (user.role !== 'teacher') return;
        const studentsCount = usersDB.users.filter(u => u.role === 'student' && u.teacherId === user.id && u.isActive).length;
        const totalRevenue = usersDB.users.filter(u => u.role === 'student' && u.teacherId === user.id && u.isActive).reduce((sum, s) => sum + (parseFloat(s.subscriptionPrice) || 0), 0);
        const teacherEarnings = totalRevenue * (parseFloat(user.commission) || 0) / 100;
        const tr = document.createElement('tr');
        tr.innerHTML = `
   <td><input type="text" class="table-input" value="${user.name || ''}" onchange="updateUserField(${idx}, 'name', this.value)"></td>
   <td><input type="email" class="table-input" value="${user.email || ''}" onchange="updateUserField(${idx}, 'email', this.value)"></td>
   <td><input type="text" class="table-input" value="${user.pass || ''}" onchange="updateUserField(${idx}, 'pass', this.value)"></td>
   <td><input type="number" class="table-input" value="${user.commission || 15}" min="0" max="100" onchange="updateUserField(${idx}, 'commission', this.value)">%</td>
   <td><input type="text" class="table-input" value="${user.phone || ''}" onchange="updateUserField(${idx}, 'phone', this.value)"></td>
   <td><strong>${studentsCount}</strong></td>
   <td><strong style="color: var(--success);">${teacherEarnings.toFixed(2)} ج.م</strong></td>
   <td>${user.joinDate || '---'}</td>
   <td><button class="btn btn-small" style="background: ${user.isActive ? 'var(--success)' : 'var(--danger)'};" onclick="toggleUserStatus(${idx})">${user.isActive ? '✅ مفعل' : '❌ معلق'}</button></td>
   <td>
     <div style="display: flex; gap: 4px;">
       <button class="btn btn-success btn-small" onclick="saveAllDataToStorage();">💾</button>
       <button class="btn btn-danger btn-small" onclick="deleteUser(${idx})">🗑️</button>
     </div>
   </td>
 `;
        tbody.appendChild(tr);
    });
}

// ==========================================
// ✅ دوال تحديث المستخدم
// ==========================================
function updateUserField(idx, field, value) { usersDB.users[idx][field] = value; }
function toggleUserStatus(idx) {
    usersDB.users[idx].isActive = !usersDB.users[idx].isActive;
    saveAllDataToStorage();
    if (currentAdminView === 'students') renderUsersTable();
    else renderTeachersTable();
}
function deleteUser(idx) {
    if (confirm("⚠️ هل أنت متأكد من حذف هذا المستخدم نهائياً؟")) {
        usersDB.users.splice(idx, 1);
        saveAllDataToStorage();
        if (currentAdminView === 'students') renderUsersTable();
        else renderTeachersTable();
        renderAdminStats();
    }
}
function changeUserRole(idx, newRole) {
    const user = usersDB.users[idx];
    const oldRole = user.role;
    if (confirm(`⚠️ هل أنت متأكد من تحويل "${user.name}" من ${getRoleLabel(oldRole)} إلى ${getRoleLabel(newRole)}؟`)) {
        user.role = newRole;
        if (newRole === 'teacher') {
            user.commission = user.commission || 15; user.phone = user.phone || '';
            delete user.level; delete user.grade; delete user.type; delete user.teacherId;
        } else if (newRole === 'student') {
            user.level = user.level || 'primary'; user.grade = user.grade || '1'; user.type = user.type || 'OL';
            user.isActive = user.isActive !== undefined ? user.isActive : true;
            user.joinDate = user.joinDate || new Date().toISOString().split('T')[0];
            user.duration = user.duration || 30; user.teacherId = null;
            delete user.commission; delete user.phone;
        } else if (newRole === 'assistant') {
            user.permissions = user.permissions || ['manage_users'];
            delete user.level; delete user.grade; delete user.type; delete user.commission; delete user.phone;
        }
        saveAllDataToStorage();
        renderUsersTable();
        renderAdminStats();
    } else { renderUsersTable(); }
}
let pendingGroupChangeIdx = null;
function handleGroupChange(idx, value) {
    const user = usersDB.users[idx];
    if (value === 'joined' && !user.teacherId) {
        pendingGroupChangeIdx = idx;
        openJoinTeacherModal();
    } else if (value === 'free' && user.teacherId) {
        if (confirm("هل تريد إزالة ارتباط الطالب بالمدرس؟")) {
            user.teacherId = null; user.subscriptionPrice = 0;
            saveAllDataToStorage(); renderUsersTable();
        } else { renderUsersTable(); }
    }
}
function openJoinTeacherModal() {
    const modal = document.getElementById('selectTeacherModal');
    if (!modal) { alert("خطأ: نافذة اختيار المدرس غير موجودة في HTML"); return; }
    const select = document.getElementById('selectTeacherList');
    select.innerHTML = '<option value="">-- اختر المدرس --</option>';
    usersDB.users.filter(u => u.role === 'teacher' && u.isActive).forEach(t => {
        select.innerHTML += `<option value="${t.id}">${t.name} (عمولة ${t.commission}%)</option>`;
    });
    document.getElementById('selectTeacherStudentName').textContent = usersDB.users[pendingGroupChangeIdx].name;
    modal.classList.remove('hidden');
}
function closeSelectTeacherModal() {
    document.getElementById('selectTeacherModal').classList.add('hidden');
    pendingGroupChangeIdx = null;
    renderUsersTable();
}
function confirmSelectTeacher() {
    const teacherId = document.getElementById('selectTeacherList').value;
    if (!teacherId) { alert("يرجى اختيار مدرس!"); return; }
    const price = document.getElementById('selectTeacherSubscriptionPrice').value;
    usersDB.users[pendingGroupChangeIdx].teacherId = teacherId;
    usersDB.users[pendingGroupChangeIdx].subscriptionPrice = parseFloat(price) || 0;
    usersDB.users[pendingGroupChangeIdx].status = 'joined';
    saveAllDataToStorage();
    closeSelectTeacherModal();
}
function openAddUserModal() {
    document.getElementById('addUserModal').classList.remove('hidden');
    document.getElementById('newStudentJoinDate').value = new Date().toISOString().split('T')[0];
    fillTeacherSelect(); fillPermissionsList(); onUserRoleChange();
}
function closeAddUserModal() { document.getElementById('addUserModal').classList.add('hidden'); }
function onUserRoleChange() {
    const role = document.getElementById('newUserRole').value;
    document.getElementById('studentFields').classList.add('hidden');
    document.getElementById('teacherFields').classList.add('hidden');
    document.getElementById('assistantFields').classList.add('hidden');
    if (role === 'student') {
        document.getElementById('studentFields').classList.remove('hidden');
        adaptGradesSelector('newStudentLevel', 'newStudentGrade');
        fillCurriculumsSelect('newStudentType');
    } else if (role === 'teacher') {
        document.getElementById('teacherFields').classList.remove('hidden');
    } else if (role === 'assistant') {
        document.getElementById('assistantFields').classList.remove('hidden');
    }
}
function fillTeacherSelect() {
    const select = document.getElementById('newStudentTeacher');
    if (!select) return;
    const teachers = usersDB.users.filter(u => u.role === 'teacher' && u.isActive);
    select.innerHTML = '<option value="">-- حر (بدون مدرس) --</option>';
    teachers.forEach(t => { select.innerHTML += `<option value="${t.id}">${t.name}</option>`; });
}
function fillPermissionsList() {
    const container = document.getElementById('permissionsList');
    if (!container) return;
    const permissions = PermissionSystem.getAllPermissions();
    container.innerHTML = permissions.map(p => `<label style="display: flex; align-items: center; gap: 10px; padding: 8px; cursor: pointer;"> <input type="checkbox" value="${p.key}" class="permission-checkbox" style="width: 18px; height: 18px;"> <span>${p.label}</span> </label>`).join('');
}
function saveNewUser() {
    const role = document.getElementById('newUserRole').value;
    const name = document.getElementById('newUserName').value.trim();
    const email = document.getElementById('newUserEmail').value.trim();
    const pass = document.getElementById('newUserPass').value.trim();
    if (!name || !email || !pass) { alert("⚠️ من فضلك أكمل البيانات الأساسية!"); return; }
    if (usersDB.users.find(u => u.email === email)) { alert("⚠️ هذا البريد مستخدم بالفعل!"); return; }
    const newUser = {
        id: 'u' + Date.now(), role: role, name: name, email: email, pass: pass,
        isActive: true, joinDate: new Date().toISOString().split('T')[0], lastLogin: null
    };
    if (role === 'student') {
        const teacherId = document.getElementById('newStudentTeacher').value;
        const subscriptionPrice = teacherId ? (parseFloat(document.getElementById('newStudentSubscriptionPrice').value) || 0) : 0;
        Object.assign(newUser, {
            isPaid: true, duration: parseInt(document.getElementById('newStudentDuration').value) || 30,
            level: document.getElementById('newStudentLevel').value,
            grade: document.getElementById('newStudentGrade').value,
            type: document.getElementById('newStudentType').value,
            status: teacherId ? 'joined' : 'free',
            teacherId: teacherId || null, subscriptionPrice: subscriptionPrice,
            customMessage: "", broadcastMessage: ""
        });
    } else if (role === 'teacher') {
        Object.assign(newUser, {
            commission: parseInt(document.getElementById('newTeacherCommission').value) || 15,
            phone: document.getElementById('newTeacherPhone').value.trim(),
            totalStudents: 0, totalEarnings: 0
        });
    } else if (role === 'assistant') {
        const permissions = Array.from(document.querySelectorAll('.permission-checkbox:checked')).map(cb => cb.value);
        if (permissions.length === 0) { alert("⚠️ يجب منح صلاحية واحدة على الأقل!"); return; }
        newUser.permissions = permissions;
    }
    usersDB.users.push(newUser);
    saveAllDataToStorage();
    alert(`✅ تم إضافة ${role === 'student' ? 'الطالب' : role === 'teacher' ? 'المدرس' : 'المساعد'} بنجاح! (في نسخة GitHub، عدّل مباشرة في users_db.json)`);
    closeAddUserModal();
    renderAdminStats();
    if (currentAdminView === 'students') renderUsersTable();
    else renderTeachersTable();
}

// ==========================================
// ✅ معاينة الطالب
// ==========================================
function populateUnits() {
    const sel = document.getElementById('previewUnitFilter');
    if (!sel) return;
    sel.innerHTML = '';
    for (let i = 1; i <= 12; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = `Unit ${i}`;
        sel.appendChild(opt);
    }
    if (!sel.value) sel.value = '1';
}
function setupStudentDashboardView(uData) {
    const lblName = document.getElementById('previewStudentName');
    if (lblName) lblName.textContent = uData.name || '--';
    const lblLevel = document.getElementById('previewLevel');
    if (lblLevel) lblLevel.textContent = getLevelName(uData.level);
    const lblGrade = document.getElementById('previewGrade');
    if (lblGrade) lblGrade.textContent = uData.grade || '--';
    const lblType = document.getElementById('previewType');
    if (lblType) lblType.textContent = uData.type || '--';
    populateUnits();
    window.currentActiveUnit = '1';
    window.currentActivePath = uData;
    renderStudentActivities();
    calculateStudentSubscriptionPulse();
    const teacherExamsSection = document.getElementById('teacherExamsSection');
    if (teacherExamsSection) {
        if (uData.teacherId) {
            teacherExamsSection.classList.remove('hidden');
            renderTeacherExamsForStudent();
        } else {
            teacherExamsSection.classList.add('hidden');
        }
    }
}
function updateUnitFilter(unit) {
    window.currentActiveUnit = unit;
    renderStudentActivities();
}
function calculateStudentSubscriptionPulse() {
    const badge = document.getElementById('studentExpiryBadge');
    if (!badge || !sessionUser || sessionUser.role !== 'student') return;
    const daysLeft = calculateDaysLeft(sessionUser.joinDate, sessionUser.duration);
    if (daysLeft <= 5 && daysLeft >= 0) {
        badge.classList.remove('hidden');
        badge.textContent = `⚠️ باقي ${daysLeft} يوم جدد الآن`;
        badge.style.background = 'rgba(239, 68, 68, 0.2)';
        badge.style.color = '#ef4444';
        badge.style.borderColor = 'rgba(239, 68, 68, 0.5)';
        badge.style.animation = 'pulseDanger 1.5s infinite';
        badge.onclick = () => openSubscriptionModal();
    } else if (daysLeft < 0) {
        badge.classList.remove('hidden');
        badge.textContent = '🚫 الاشتراك منتهي';
        badge.style.background = 'rgba(239, 68, 68, 0.2)';
        badge.style.color = '#ef4444';
        badge.style.borderColor = 'rgba(239, 68, 68, 0.5)';
        badge.style.animation = 'pulseDanger 1.5s infinite';
        badge.onclick = () => openSubscriptionModal();
    } else {
        badge.classList.remove('hidden');
        badge.textContent = '✅ الاشتراك نشط';
        badge.style.background = 'rgba(16, 185, 129, 0.2)';
        badge.style.color = '#10b981';
        badge.style.borderColor = 'rgba(16, 185, 129, 0.5)';
        badge.style.animation = 'none';
        badge.onclick = () => openSubscriptionModal();
    }
}
function renderStudentActivities() {
    const grid = document.getElementById('previewActivitiesGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    const activeUnit = window.currentActiveUnit || '1';
    const activePath = window.currentActivePath || sessionUser;
    if (!activePath) return;

    if (window.studentViewMode === 'mygroup') {
        if (!sessionUser.teacherId) {
            grid.innerHTML = '<div class="no-activities-msg">📋 أنت غير منضم لأي مدرس حالياً</div>';
            return;
        }
        renderTeacherExamsForStudent();
        return;
    }

    // ==========================================
    // ✅ إضافة كارت "اشرحلي" (الملخص التفاعلي) في البداية
    // ==========================================
    const summaryCard = document.createElement('div');
    summaryCard.className = 'activity-card';
    summaryCard.style.borderTopColor = 'var(--admin-gold)'; 
    summaryCard.innerHTML = `
        <div>
            <h4 style="font-size:18px; color: var(--admin-gold); font-weight:bold;">💡 اشرحلي (الملخص التفاعلي)</h4>
            <p style="font-size:12px; color:var(--text-muted)">شرح مبسط، تفاعلي، ومختصر لقواعد Unit ${activeUnit}</p>
            <span class="badge" style="background:#0f172a; color:var(--success)">🚀 ابدأ التعلم</span>
        </div>
        <button class="btn btn-gold-pulse" style="margin-top:20px;" onclick="launchInteractiveSummary()">📖 اشرحلي الآن</button>
    `;
    grid.appendChild(summaryCard);
    // ==========================================

    // ✅ باقي الأنشطة الأصلية (الكود الكامل بدون اختصارات)
    let counter = 0;
    Object.keys(marathonQuestionsDB.activityDatabase).forEach(function(key) {
        const list = marathonQuestionsDB.activityDatabase[key] || [];
        const matching = list.filter(q =>
            q.level === activePath.level &&
            q.grade === activePath.grade &&
            q.curriculum === (activePath.type || activePath.curriculum) &&
            q.unit === activeUnit
        );
        
        if (matching.length === 0) return;
        counter++;
        
        const card = document.createElement('div');
        card.className = 'activity-card';
        card.innerHTML = `
            <div>
                <h4 style="font-size:16px; color: var(--text-main); font-weight:bold;">${allActivitiesDict[key]}</h4>
                <p style="font-size:12px; color:var(--text-muted)">المسار: Unit ${activeUnit}</p>
                <span class="badge" style="background:#0f172a; color:var(--warning)">📊 ${matching.length} عنصر</span>
            </div>
            <button class="btn btn-success" style="margin-top:20px;" onclick="launchStudentActivity('${key}', '${activeUnit}')">🎮 ابدأ</button>
        `;
        grid.appendChild(card);
    });

    if (counter === 0 && !document.querySelector('.activity-card')) {
         grid.innerHTML = '<div class="no-activities-msg">لا توجد أنشطة لـ Unit ' + activeUnit + '</div>';
    }
}
function launchStudentActivity(key, unit) {
    const activePath = window.currentActivePath || sessionUser;
    const url = 'activities/' + key + '/index.html?level=' + activePath.level + '&grade=' + activePath.grade + '&type=' + (activePath.type || activePath.curriculum) + '&unit=' + unit + '&studentName=' + encodeURIComponent(activePath.name);
    window.open(url, '_self');
}
function exitStudentPreview() {
    const backBtn = document.getElementById('menu-item-back-to-admin');
    if (backBtn) backBtn.classList.add('hidden');
    switchMainTab('students');
}

// ==========================================
// ✅ الرسائل والبث
// ==========================================
function openMessageModal(idx) {
    const s = usersDB.users[idx];
    document.getElementById('msgModalTargetName').textContent = 'الطالب: ' + s.name;
    document.getElementById('msgModalTargetIdx').value = idx;
    document.getElementById('studentCustomMsgInput').value = s.customMessage || "";
    document.getElementById('messageModal').classList.remove('hidden');
}
function closeMessageModal() { document.getElementById('messageModal').classList.add('hidden'); }
function saveStudentCustomMessage() {
    const idx = document.getElementById('msgModalTargetIdx').value;
    usersDB.users[idx].customMessage = document.getElementById('studentCustomMsgInput').value.trim();
    saveAllDataToStorage();
    closeMessageModal();
    renderUsersTable();
}
function openContactUsModal() { document.getElementById('contactUsModal').classList.remove('hidden'); }
function closeContactUsModal() { document.getElementById('contactUsModal').classList.add('hidden'); }
function sendWhatsAppMessageToTeacher() {
    const msg = document.getElementById('studentContactInput').value.trim();
    if (!msg) { alert("من فضلك اكتب استفسارك أولاً!"); return; }
    const u = window.currentActivePath || sessionUser || { name: "زائر", level: "primary", grade: "1", type: "OL" };
    const fullText = 'السلام عليكم،\nأنا الطالب: [ ' + u.name + ' ]\nالمسار: [ ' + u.level + ' - Grade ' + u.grade + ' - ' + (u.type || 'OL') + ' ]\n\nرسالتي:\n(' + msg + ')';
    window.open('https://wa.me/' + MY_WHATSAPP_NUMBER + '?text=' + encodeURIComponent(fullText), '_blank');
    closeContactUsModal();
}
function openStudentReportModal() {
    const daysLeft = calculateDaysLeft(sessionUser.joinDate, sessionUser.duration);
    const text = daysLeft < 0 ? 'عذراً يا بطل، لقد انتهت مدة الاشتراك. من فضلك تواصل مع المستر فوراً لتجديد الاشتراك!' : 'تنبيه: متبقي على انتهاء صلاحية حسابك ' + daysLeft + ' أيام فقط! برجاء التواصل مع المستر لتجديد التفعيل.';
    document.getElementById('studentReportModalText').textContent = text;
    document.getElementById('studentReportModal').classList.remove('hidden');
}
function closeStudentReportModal() { document.getElementById('studentReportModal').classList.add('hidden'); }

// ==========================================
// ✅ المناهج المخصصة
// ==========================================
function openAddCurriculumModal() { document.getElementById('addCurriculumModal').classList.remove('hidden'); }
function closeAddCurriculumModal() {
    document.getElementById('addCurriculumModal').classList.add('hidden');
    document.getElementById('newCurriculumName').value = '';
}
function saveNewCurriculum() {
    const name = document.getElementById('newCurriculumName').value.trim();
    if (!name) { alert('⚠️ من فضلك أدخل اسم المنهج!'); return; }
    const existing = ['OL', 'AL', ...usersDB.settings.customCurriculums];
    if (existing.includes(name)) { alert('⚠️ هذا المنهج موجود بالفعل!'); return; }
    usersDB.settings.customCurriculums.push(name);
    saveAllDataToStorage();
    closeAddCurriculumModal();
    fillCurriculumsSelect('qFilterCurriculum', true);
    renderUsersTable();
    alert(`✅ تم إضافة منهج "${name}" بنجاح! (في نسخة GitHub، عدّل مباشرة في users_db.json)`);
}

// ==========================================
// ✅ محقن المحتوى ومحرر JSON
// ==========================================
function openInjectorModal() { document.getElementById('injectorModal').classList.remove('hidden'); }
function closeInjectorModal() { document.getElementById('injectorModal').classList.add('hidden'); }
function processInjection() {
    const actType = document.getElementById('qFilterActivity').value;
    const lvl = document.getElementById('qFilterLevel').value;
    const grd = document.getElementById('qFilterGrade').value;
    const curr = document.getElementById('qFilterCurriculum').value;
    const unit = document.getElementById('qFilterUnit').value;
    const lessonTitle = document.getElementById('injLessonTitle').value.trim();
    const rawJson = document.getElementById('injJsonInput').value.trim();
    if (actType === 'all') { alert("❌ من فضلك حدد نوع نشاط محدد قبل الحقن!"); return; }
    if (!rawJson) { alert("الرجاء لصق كود الـ JSON!"); return; }
    try {
        const parsed = JSON.parse(rawJson);
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        arr.forEach(function(q) {
            const autoId = (marathonQuestionsDB.activityDatabase[actType] || []).length + 1;
            let item = Object.assign({}, q, {
                id: autoId,
                level: (lvl === 'all' ? "primary" : lvl),
                grade: (grd === 'all' ? "1" : grd),
                curriculum: (curr === 'all' ? "OL" : curr),
                unit: (unit === 'all' ? "1" : unit)
            });
            if (lessonTitle !== "") item.lessonTitle = lessonTitle;
            if (!marathonQuestionsDB.activityDatabase[actType]) marathonQuestionsDB.activityDatabase[actType] = [];
            marathonQuestionsDB.activityDatabase[actType].push(item);
        });
        saveAllDataToStorage();
        alert('✅ تم بنجاح دمج وحقن عدد (' + arr.length + ') عنصر!');
        document.getElementById('injJsonInput').value = '';
        closeInjectorModal();
        const editorZone = document.getElementById('jsonEditorZone');
        if (editorZone && !editorZone.classList.contains('hidden')) fetchAndDisplayQuestionsJSON();
    } catch (err) { alert("❌ خطأ في كود الـ JSON:\n" + err.message); }
}
function fetchAndDisplayQuestionsJSON() {
    const act = document.getElementById('qFilterActivity').value;
    const lvl = document.getElementById('qFilterLevel').value;
    const grd = document.getElementById('qFilterGrade').value;
    const curr = document.getElementById('qFilterCurriculum').value;
    const unit = document.getElementById('qFilterUnit').value;
    let targetDump = {};
    const keys = act === 'all' ? Object.keys(marathonQuestionsDB.activityDatabase) : [act];
    keys.forEach(function(k) {
        const list = marathonQuestionsDB.activityDatabase[k] || [];
        const filtered = list.filter(function(q) {
            if (lvl !== 'all' && q.level !== lvl) return false;
            if (grd !== 'all' && q.grade !== grd) return false;
            if (curr !== 'all' && q.curriculum !== curr) return false;
            if (unit !== 'all' && q.unit !== unit) return false;
            return true;
        });
        if (filtered.length > 0) targetDump[k] = filtered;
    });
    document.getElementById('jsonEditorZone').classList.remove('hidden');
    document.getElementById('liveJsonTextarea').value = JSON.stringify(targetDump, null, 2);
}
function saveLiveJsonEdits() {
    const raw = document.getElementById('liveJsonTextarea').value.trim();
    if (!raw) return;
    try {
        const editedDump = JSON.parse(raw);
        const act = document.getElementById('qFilterActivity').value;
        const lvl = document.getElementById('qFilterLevel').value;
        const grd = document.getElementById('qFilterGrade').value;
        const curr = document.getElementById('qFilterCurriculum').value;
        const unit = document.getElementById('qFilterUnit').value;
        const keysToClear = act === 'all' ? Object.keys(marathonQuestionsDB.activityDatabase) : [act];
        keysToClear.forEach(function(k) {
            if (!marathonQuestionsDB.activityDatabase[k]) marathonQuestionsDB.activityDatabase[k] = [];
            marathonQuestionsDB.activityDatabase[k] = marathonQuestionsDB.activityDatabase[k].filter(function(q) {
                if (lvl !== 'all' && q.level !== lvl) return true;
                if (grd !== 'all' && q.grade !== grd) return true;
                if (curr !== 'all' && q.curriculum !== curr) return true;
                if (unit !== 'all' && q.unit !== unit) return true;
                return false;
            });
        });
        Object.keys(editedDump).forEach(function(k) {
            if (!marathonQuestionsDB.activityDatabase[k]) marathonQuestionsDB.activityDatabase[k] = [];
            editedDump[k].forEach(function(item) { marathonQuestionsDB.activityDatabase[k].push(item); });
        });
        saveAllDataToStorage();
        alert("💾 تم تحديث وحفظ المحتوى بنجاح!");
    } catch (err) { alert("❌ خطأ في هيكل الـ JSON:\n" + err.message); }
}
function sendBroadcastMessage() {
    const lvl = document.getElementById('msgFilterLevel').value;
    const grd = document.getElementById('msgFilterGrade').value;
    const typ = document.getElementById('msgFilterType').value;
    const paid = document.getElementById('msgFilterPaid').value;
    const exp = document.getElementById('msgFilterExpiry').value;
    const msgText = document.getElementById('broadcastMessageInput').value.trim();
    if (!msgText) { alert("من فضلك اكتب رسالة أولاً!"); return; }
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let counter = 0;
    usersDB.users.forEach(function(s) {
        if (s.role !== 'student') return;
        const join = new Date(s.joinDate || new Date());
        const expire = new Date(join);
        expire.setDate(join.getDate() + parseInt(s.duration || 30));
        const diff = expire.getTime() - today.getTime();
        const daysLeft = Math.ceil(diff / (1000 * 3600 * 24));
        let currentStatus = 'valid';
        if (daysLeft < 0) currentStatus = 'expired';
        else if (daysLeft <= 5) currentStatus = 'warning';
        if (lvl !== 'all' && s.level !== lvl) return;
        if (grd !== 'all' && s.grade !== grd) return;
        if (typ !== 'all' && s.type !== typ) return;
        if (paid === 'active' && !s.isActive) return;
        if (paid === 'suspended' && s.isActive) return;
        if (exp !== 'all' && currentStatus !== exp) return;
        s.broadcastMessage = msgText;
        counter++;
    });
    saveAllDataToStorage();
    alert('📢 تم بث الرسالة لعدد (' + counter + ') طالب مستهدف!');
    document.getElementById('broadcastMessageInput').value = '';
}

// ==========================================
// ✅ التصدير (GitHub)
// ==========================================
function exportStudentsDB() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(usersDB, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", "users_db.json");
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
}
function exportQuestionsDB() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(marathonQuestionsDB, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", "marathonQuestionsDB.json");
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
}

// ==========================================
// ✅ استيراد ودمج الأسئلة بذكاء وأمان (يمنع حذف البيانات)
// ==========================================
function importQuestionsDB(event, mergeMode = true) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const parsed = JSON.parse(e.target.result);
            if (!parsed || !parsed.activityDatabase) {
                alert("❌ ملف غير مطابق لهيكل قاعدة البيانات (يجب أن يحتوي على activityDatabase).");
                return;
            }
            if (mergeMode) {
                let totalAdded = 0;
                Object.keys(parsed.activityDatabase).forEach(actKey => {
                    if (!marathonQuestionsDB.activityDatabase[actKey]) {
                        marathonQuestionsDB.activityDatabase[actKey] = [];
                    }
                    const currentArray = marathonQuestionsDB.activityDatabase[actKey];
                    const newQuestions = parsed.activityDatabase[actKey];
                    let maxId = 0;
                    if (currentArray.length > 0) {
                        maxId = Math.max(...currentArray.map(q => q.id || 0));
                    }
                    newQuestions.forEach((q, index) => {
                        currentArray.push({ ...q, id: maxId + index + 1 });
                        totalAdded++;
                    });
                });
                saveAllDataToStorage();
                alert(`✅ تم دمج (${totalAdded}) سؤال جديد بنجاح مع الاحتفاظ بجميع الأسئلة القديمة!`);
            } else {
                if (confirm("⚠️ تحذير: هذا الخيار سيحذف جميع الأسئلة الحالية ويستبدلها بالملف الجديد.\n\nهل أنت متأكد أنك تريد المتابعة؟")) {
                    marathonQuestionsDB = parsed;
                    saveAllDataToStorage();
                    alert("✅ تم استبدال قاعدة البيانات بنجاح.");
                } else { return; }
            }
            const editorZone = document.getElementById('jsonEditorZone');
            if (editorZone && !editorZone.classList.contains('hidden')) fetchAndDisplayQuestionsJSON();
        } catch (err) { alert("❌ خطأ في قراءة الملف: " + err.message); }
    };
    reader.readAsText(file);
}

// ==========================================
// ⚠️ مسح قاعدة بيانات الأسئلة بالكامل (مع حماية مزدوجة)
// ==========================================
function clearAllQuestionsDB() {
    const firstWarning = "⚠️ تحذير خطير جداً!\n\nهل أنت متأكد تماماً من حذف جميع الأسئلة من قاعدة البيانات؟\nهذا الإجراء لا يمكن التراجع عنه وسيحذف كل الأنشطة والأسئلة المخزنة نهائياً!";
    if (confirm(firstWarning)) {
        const secondWarning = "⚠️ تأكيد أخير وأخير!\n\nبمجرد الضغط على 'موافق'، سيتم حذف كل شيء. هل تريد حقاً المتابعة؟";
        if (confirm(secondWarning)) {
            marathonQuestionsDB = {
                activityDatabase: {
                    explanation: [], exam: [], complete: [], correct: [], translate: [],
                    find_the_vowel: [], grammer: [], justtalk: [], Matching: [],
                    re_arrange: [], rewrite: [], Scramble: [], sequence: [],
                    situations: [], sorting: [], spilling: [], Underline: [],
                    vocab_listening_quiz: [], vocab_quiz: [], what_do_you_hear: [],
                    vocab_choose: []
                }
            };
            saveAllDataToStorage();
            alert("✅ تم مسح قاعدة بيانات الأسئلة بالكامل بنجاح!");
            const editorZone = document.getElementById('jsonEditorZone');
            if (editorZone && !editorZone.classList.contains('hidden')) fetchAndDisplayQuestionsJSON();
        }
    }
}

// ==========================================
// ✅ بوابة استقبال الأسئلة من مولد الذكاء الاصطناعي
// ==========================================
function receiveQuestionsFromAI(newQuestionsArray, activityType, pathData) {
    try {
        if (!marathonQuestionsDB.activityDatabase[activityType]) {
            marathonQuestionsDB.activityDatabase[activityType] = [];
        }
        const currentArray = marathonQuestionsDB.activityDatabase[activityType];
        let maxId = currentArray.length > 0 ? Math.max(...currentArray.map(q => q.id || 0)) : 0;
        const formattedQuestions = newQuestionsArray.map((q, index) => ({
            ...q,
            id: maxId + index + 1,
            level: pathData.level,
            grade: pathData.grade,
            curriculum: pathData.curriculum,
            unit: pathData.unit
        }));
        marathonQuestionsDB.activityDatabase[activityType].push(...formattedQuestions);
        saveAllDataToStorage();
        console.log(`✅ تم استيراد ${formattedQuestions.length} سؤال من AI بنجاح للنشاط: ${activityType}`);
        return true;
    } catch (error) {
        console.error("❌ فشل في استقبال الأسئلة من AI:", error);
        return false;
    }
}
function toggleAuthMode() { alert("⚠️ ميزة التسجيل الذاتي غير مفعلة حالياً. يرجى التواصل مع المستر لتسجيل حسابك."); }
function openBenefitsModal() { document.getElementById('benefitsModal').classList.remove('hidden'); }
function closeBenefitsModal() { document.getElementById('benefitsModal').classList.add('hidden'); }
function closeBenefitsModalAndRegister() { closeBenefitsModal(); toggleAuthMode(); }

// ==========================================
// ✅ امتحانات المدرسين (النظام القديم بالروابط)
// ==========================================
function openAddExamModal() {
    document.getElementById('addExamModal').classList.remove('hidden');
    const select = document.getElementById('examTeacherSelect');
    const teachers = usersDB.users.filter(u => u.role === 'teacher' && u.isActive);
    select.innerHTML = '<option value="">-- اختر المدرس --</option>' + teachers.map(t => `<option value="${t.id}">${t.name} (${t.email})</option>`).join('');
    fillCurriculumsSelect('examCurriculum');
    const unitSelect = document.getElementById('examUnit');
    unitSelect.innerHTML = Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}">Unit ${i + 1}</option>`).join('');
    adaptGradesSelector('examLevel', 'examGrade');
}
function closeAddExamModal() {
    document.getElementById('addExamModal').classList.add('hidden');
    document.getElementById('examTeacherInfo').classList.add('hidden');
}
function onExamTeacherChange() {
    const teacherId = document.getElementById('examTeacherSelect').value;
    if (!teacherId) { document.getElementById('examTeacherInfo').classList.add('hidden'); return; }
    const teacher = usersDB.users.find(u => u.id === teacherId);
    if (teacher) {
        const studentsCount = usersDB.users.filter(u => u.role === 'student' && u.teacherId === teacherId).length;
        document.getElementById('examTeacherName').textContent = teacher.name;
        document.getElementById('examTeacherStudentsCount').textContent = studentsCount;
        document.getElementById('examTeacherCommission').textContent = teacher.commission || 15;
        document.getElementById('examTeacherInfo').classList.remove('hidden');
    }
}
function saveNewExam() {
    const teacherId = document.getElementById('examTeacherSelect').value;
    const title = document.getElementById('examTitle').value.trim();
    const url = document.getElementById('examUrl').value.trim();
    const level = document.getElementById('examLevel').value;
    const grade = document.getElementById('examGrade').value;
    const curriculum = document.getElementById('examCurriculum').value;
    const unit = document.getElementById('examUnit').value;
    if (!teacherId || !title || !url) { alert('⚠️ من فضلك أكمل البيانات الأساسية (المدرس، العنوان، الرابط)!'); return; }
    const newExam = {
        id: 'e' + Date.now(), teacherId: teacherId, title: title, url: url,
        level: level, grade: grade, curriculum: curriculum, unit: unit,
        isActive: true, addedDate: new Date().toISOString().split('T')[0]
    };
    if (!usersDB.teacherExams) usersDB.teacherExams = [];
    usersDB.teacherExams.push(newExam);
    saveAllDataToStorage();
    closeAddExamModal();
    alert('✅ تم إضافة الامتحان/اللينك بنجاح! (في نسخة GitHub، عدّل مباشرة في users_db.json)');
}
function deleteExam(examId) {
    if (confirm('⚠️ هل أنت متأكد من حذف هذا الامتحان؟')) {
        usersDB.teacherExams = usersDB.teacherExams.filter(e => e.id !== examId);
        saveAllDataToStorage();
    }
}
// ==========================================
// ✅ إدارة قاعدة بيانات الامتحانات (للأدمن)
// ==========================================
// ==========================================
// ✅ إدارة قاعدة بيانات الامتحانات (للأدمن)
// ==========================================
function renderExamsAdmin() {
    const grid = document.getElementById('examsAdminGrid');
    const badge = document.getElementById('examsCountBadge');
    if (!grid) return;
    
    const lvl = document.getElementById('examFilterLevel')?.value || 'all';
    const grd = document.getElementById('examFilterGrade')?.value || 'all';
    const curr = document.getElementById('examFilterCurriculum')?.value || 'all';

    // 🛡️ ضمان تعبئة فلاتر الامتحانات ذاتياً إذا كانت فارغة
    const currSel = document.getElementById('examFilterCurriculum');
    if (currSel && currSel.children.length <= 1) {
        fillCurriculumsSelect('examFilterCurriculum', true);
    }
    const grdSel = document.getElementById('examFilterGrade');
    if (grdSel && grdSel.children.length === 0) {
        adaptGradesSelector('examFilterLevel', 'examFilterGrade', true);
    }

    const filtered = (marathonExamsDB.exams || []).filter(ex => {
        if (lvl !== 'all' && ex.level !== lvl) return false;
        if (grd !== 'all' && String(ex.grade) !== String(grd)) return false;
        if (curr !== 'all' && ex.curriculum !== curr) return false;
        return true;
    });

    if (badge) badge.textContent = '📊 عدد الامتحانات: ' + filtered.length;
    
    if (filtered.length === 0) {
        grid.innerHTML = '<div class="no-activities-msg">📭 لا توجد امتحانات مطابقة لهذا المسار.</div>';
        return;
    } 

    grid.innerHTML = filtered.map(ex => {
        const title = ex.quizTitle || ex.title || 'بدون عنوان';
        const count = (ex.questionsList || ex.questions || []).length;
        const date = ex.createdAt ? new Date(ex.createdAt).toLocaleDateString('ar-EG') : '---';
        const units = (ex.units || [ex.unit || '-']).join(', ');
        return `
        <div class="activity-card card-exam">
            <div>
                <h4 style="font-size:16px; color: var(--text-main); font-weight:bold;">📝 ${title}</h4>
                <p style="font-size:12px; color:var(--text-muted); margin-top:6px;">${getLevelName(ex.level)} - Grade ${ex.grade} - ${ex.curriculum} | Units: ${units}</p>
                <p style="font-size:12px; color:var(--text-muted);">📊 ${count} سؤال | 📅 ${date}</p>
                <span class="badge" style="background:#0f172a; color:var(--warning);">ID: ${ex.id}</span>
            </div>
            <div style="margin-top:15px;">
                <button class="btn btn-info" style="width:auto; padding:8px 20px;" onclick="previewExamAsAdmin('${ex.id}')">👀 مشاهدة الامتحان</button>
            </div>
        </div>`;

    }).join('');
}

// 💾 تنزيل قاعدة الامتحانات (على غرار الأسئلة والمستخدمين)
function exportExamsDB() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(marathonExamsDB, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", "marathonExamsDB.json");
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
}

// 📤 استيراد قاعدة الامتحانات (يدعم شكلين: {exams:[...]} أو مصفوفة مباشرة)
function importExamsDB(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            let parsed = JSON.parse(e.target.result);
            if (typeof deepTrim === 'function') parsed = deepTrim(parsed);
            let examsArray = null;
            if (Array.isArray(parsed)) examsArray = parsed;
            else if (parsed && Array.isArray(parsed.exams)) examsArray = parsed.exams;
            if (!examsArray) {
                alert('❌ ملف غير مطابق! يجب أن يحتوي على { "exams": [...] } أو مصفوفة امتحانات مباشرة.');
                return;
            }
            if (!confirm(`سيتم استبدال القاعدة الحالية (${(marathonExamsDB.exams || []).length} امتحان) بالملف الجديد (${examsArray.length} امتحان).\n\nهل تريد المتابعة؟`)) return;
            marathonExamsDB = { exams: examsArray };
            localStorage.setItem('marathon_exams_db', JSON.stringify(marathonExamsDB));
            renderExamsAdmin();
            alert('✅ تم تحميل قاعدة الامتحانات بنجاح!\n\n💡 لحفظها نهائياً على GitHub: اضغط زر التنزيل ثم ارفع الملف إلى المستودع.');
        } catch (err) {
            alert('❌ خطأ في قراءة الملف: ' + err.message);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}
// 👀 مشاهدة الامتحان بعين الأدمن (تفتح في تبويب جديد بالنسخة المحلية)
function previewExamAsAdmin(examId) {
    window.open('exams/exam-player.html?examId=' + encodeURIComponent(examId) + '&src=local', '_blank');
}
// ==========================================
// ✅ استيراد قاعدة بيانات المستخدمين (دمج ذكي أو استبدال)
// ==========================================
function importUsersDB(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const parsed = JSON.parse(e.target.result);
            if (!parsed || !Array.isArray(parsed.users)) {
                alert('❌ ملف غير مطابق! يجب أن يحتوي على { "users": [...] }.');
                return;
            }
            const incoming = parsed.users.filter(u => u && u.email);
            if (incoming.length === 0) { alert('❌ الملف لا يحتوي على أي مستخدم صالح.'); return; }

            const merge = confirm(`✅ الملف صالح ويحتوي ${incoming.length} مستخدماً.\n\nاضغط "موافق" = دمج مع الحاليين (بدون تكرار).\nاضغط "إلغاء" = استبدال كامل للقاعدة الحالية.`);
            if (merge) {
                let added = 0, skipped = 0;
                incoming.forEach(u => {
                    if (usersDB.users.find(x => x.email === u.email)) { skipped++; return; }
                    if (!u.id) u.id = 'u' + Date.now() + '_' + added;
                    usersDB.users.push(u);
                    added++;
                });
                if (parsed.settings) Object.keys(parsed.settings).forEach(k => {
                    if (usersDB.settings[k] === undefined) usersDB.settings[k] = parsed.settings[k];
                });
                if (Array.isArray(parsed.teacherExams)) {
                    parsed.teacherExams.forEach(ex => {
                        if (!usersDB.teacherExams.find(x => x.id === ex.id)) usersDB.teacherExams.push(ex);
                    });
                }
                saveAllDataToStorage();
                alert(`✅ تم الدمج: أُضيف ${added} مستخدم جديد، وتُخطي ${skipped} (مكرر).`);
            } else {
                if (!confirm(`⚠️ تحذير: سيتم حذف جميع المستخدمين الحاليين (${usersDB.users.length}) واستبدالهم بالملف (${incoming.length}).\n\nهل أنت متأكد؟`)) return;
                usersDB.users = incoming;
                if (parsed.settings) usersDB.settings = Object.assign({}, usersDB.settings, parsed.settings);
                if (Array.isArray(parsed.teacherExams)) usersDB.teacherExams = parsed.teacherExams;
                ensureAdminExists();
                saveAllDataToStorage();
                alert('✅ تم استبدال قاعدة المستخدمين بنجاح.');
            }
            renderUsersTable();
            renderTeachersTable();
            renderAdminStats();
        } catch (err) {
            alert('❌ خطأ في قراءة الملف: ' + err.message);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// 🛡️ ضمان وجود حساب أدمن دائماً (لمنع فقدان الدخول للمنصة)
function ensureAdminExists() {
    if (!usersDB.users.some(u => u.role === 'admin')) {
        usersDB.users.push({
            id: 'u1', role: 'admin', name: 'مستر إنجليزي', email: 'medo', pass: '1234',
            isActive: true, joinDate: new Date().toISOString().split('T')[0], permissions: ['all']
        });
    }
}

// ==========================================
// ⚠️ حذف جميع المستخدمين (حماية مزدوجة + الإبقاء على الأدمن)
// ==========================================
function clearAllUsersDB() {
    const firstWarning = '⚠️ تحذير خطير!\n\nسيتم حذف جميع المستخدمين (طلاب/مدرسين/مساعدين) وامتحانات المدرسين نهائياً، مع الإبقاء على حساب الأدمن الأساسي والإعدادات.\nهل أنت متأكد؟';
    if (confirm(firstWarning)) {
        const secondWarning = '⚠️ تأكيد أخير!\n\nسيُحذف ' + usersDB.users.length + ' مستخدم ولا يمكن التراجع.\nمتابعة؟';
        if (confirm(secondWarning)) {
            const keepSettings = usersDB.settings;
            const keepPermissions = usersDB.permissions;
            usersDB.users = [];
            usersDB.teacherExams = [];
            usersDB.groups = [];
            usersDB.settings = keepSettings;
            usersDB.permissions = keepPermissions;
            ensureAdminExists();
            saveAllDataToStorage();
            renderUsersTable();
            renderTeachersTable();
            renderAdminStats();
            alert('✅ تم حذف جميع المستخدمين والإبقاء على حساب الأدمن الأساسي.');
        }
    }
}
// ✅ دالة جديدة لفتح صفحة الملخص التفاعلي
function launchInteractiveSummary() {
    const activePath = window.currentActivePath || sessionUser;
    if (!activePath) return;

    // بناء الرابط ديناميكياً بناءً على مسار الطالب والوحدة المختارة
    const url = 'summaries/index.html?level=' + activePath.level + 
                '&grade=' + activePath.grade + 
                '&type=' + (activePath.type || activePath.curriculum) + 
                '&unit=' + (window.currentActiveUnit || '1') + 
                '&studentName=' + encodeURIComponent(activePath.name);
                
    // فتح الصفحة في نفس التبويب (يمكنك تغييرها إلى '_blank' إذا أرددتها في نافذة جديدة)
    window.open(url, '_self'); 
}

// ==================== نهاية الملف ====================
