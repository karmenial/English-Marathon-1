// shared/path-filter.js
// ==========================================
// 🎯 نظام الفلاتر الموحد للمسار الدراسي
// ✅ محدث: يدعم المناهج المخصصة ديناميكياً
// ==========================================
const PathFilter = {
  // المستويات الدراسية
  levels: {
    'primary': { name: 'الابتدائية', nameEn: 'Primary', grades: [1, 2, 3, 4, 5, 6] },
    'preparatory': { name: 'الإعدادية', nameEn: 'Preparatory', grades: [1, 2, 3] },
    'secondary': { name: 'الثانوية', nameEn: 'Secondary', grades: [1, 2, 3] }
  },
  
  // أنواع المناهج الأساسية
  curriculums: {
    'OL': { name: 'مستوى عام (OL)', nameEn: 'Ordinary Level' },
    'AL': { name: 'مستوى متقدم (AL)', nameEn: 'Advanced Level' }
  },
  
  // الوحدات (حتى 12 وحدة)
  units: Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    name: `Unit ${i + 1}`
  })),

  // ==========================================
  // ✅ دالة تحميل المناهج المخصصة ديناميكياً
  // ==========================================
  loadCustomCurriculums() {
    // التحقق من وجود usersDB (يعمل في النسختين: الأوفلاين والأونلاين)
    if (typeof usersDB !== 'undefined' && 
        usersDB.settings && 
        Array.isArray(usersDB.settings.customCurriculums)) {
      
      usersDB.settings.customCurriculums.forEach(curr => {
        // إضافة المنهج فقط إذا لم يكن موجوداً بالفعل
        if (!this.curriculums[curr]) {
          this.curriculums[curr] = { 
            name: curr, 
            nameEn: curr 
          };
        }
      });
    }
  },

  // دالة الحصول على المستويات
  getLevels() {
    return this.levels;
  },

  // ✅ دالة الحصول على المناهج (تشمل المخصصة)
  getCurriculums() {
    this.loadCustomCurriculums();
    return this.curriculums;
  },

  // دالة الحصول على الوحدات
  getUnits() {
    return this.units;
  },

  // دالة الحصول على الصفوف لمستوى معين
  getGrades(level) {
    const levelData = this.levels[level];
    return levelData ? levelData.grades : [];
  },

  // دالة ملء قائمة المستويات
  fillLevelsSelect(selectId, includeAll = false) {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = '';

    if (includeAll) {
      const allOption = document.createElement('option');
      allOption.value = 'all';
      allOption.textContent = 'الكل';
      select.appendChild(allOption);
    }

    Object.keys(this.levels).forEach(key => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = this.levels[key].name;
      select.appendChild(option);
    });
  },

  // دالة ملء قائمة الصفوف
  fillGradesSelect(selectId, level, includeAll = false) {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = '';

    if (includeAll) {
      const allOption = document.createElement('option');
      allOption.value = 'all';
      allOption.textContent = 'الكل';
      select.appendChild(allOption);
    }

    const grades = this.getGrades(level);
    grades.forEach(grade => {
      const option = document.createElement('option');
      option.value = grade.toString();
      option.textContent = grade.toString();
      select.appendChild(option);
    });
  },

  // ✅ دالة ملء قائمة المناهج (تشمل المخصصة ديناميكياً)
  fillCurriculumsSelect(selectId, includeAll = false) {
    // تحميل المناهج المخصصة أولاً
    this.loadCustomCurriculums();
    
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = '';

    if (includeAll) {
      const allOption = document.createElement('option');
      allOption.value = 'all';
      allOption.textContent = 'الكل';
      select.appendChild(allOption);
    }

    Object.keys(this.curriculums).forEach(key => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = this.curriculums[key].name;
      select.appendChild(option);
    });
  },

  // دالة ملء قائمة الوحدات
  fillUnitsSelect(selectId, includeAll = false) {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = '';

    if (includeAll) {
      const allOption = document.createElement('option');
      allOption.value = 'all';
      allOption.textContent = 'الكل';
      select.appendChild(allOption);
    }

    this.units.forEach(unit => {
      const option = document.createElement('option');
      option.value = unit.value;
      option.textContent = unit.name;
      select.appendChild(option);
    });
  },

  // دالة فلترة الأسئلة
  filterQuestions(questions, filters) {
    return questions.filter(q => {
      if (filters.level && filters.level !== 'all' && q.level !== filters.level) return false;
      if (filters.grade && filters.grade !== 'all' && q.grade !== filters.grade) return false;
      if (filters.curriculum && filters.curriculum !== 'all' && q.curriculum !== filters.curriculum) return false;
      if (filters.unit && filters.unit !== 'all' && q.unit !== filters.unit) return false;
      return true;
    });
  },

  // ✅ دالة الحصول على معلومات المسار الكامل (تشمل المناهج المخصصة)
  getPathInfo(level, grade, curriculum, unit) {
    // تحميل المناهج المخصصة أولاً
    this.loadCustomCurriculums();
    
    return {
      level: this.levels[level]?.name || level,
      levelEn: this.levels[level]?.nameEn || level,
      grade: `Grade ${grade}`,
      curriculum: this.curriculums[curriculum]?.name || curriculum,
      curriculumEn: this.curriculums[curriculum]?.nameEn || curriculum,
      unit: `Unit ${unit}`,
      full: `${this.levels[level]?.name || level} - Grade ${grade} - ${this.curriculums[curriculum]?.name || curriculum} - Unit ${unit}`
    };
  }
};

// تصدير للاستخدام في المتصفح
if (typeof window !== 'undefined') {
  window.PathFilter = PathFilter;
}