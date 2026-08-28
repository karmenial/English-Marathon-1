// shared/activities-registry.js
// ==========================================
// 📋 سجل الأنشطة الموحد - يمنع التضارب
// ==========================================

const ActivitiesRegistry = {
  // قاموس الأنشطة الموحد (نفس الأسماء في كل مكان)
  activities: {
    'explanation': {
      key: 'explanation',
      name: '📖 شرح وروابط خارجية',
      nameEn: 'Explanation & Links',
      type: 'content',
      icon: '📖',
      color: '#3b82f6'
    },
    'exam': {
      key: 'exam',
      name: '📝 امتحانات عامة',
      nameEn: 'General Exams',
      type: 'content',
      icon: '📝',
      color: '#a855f7'
    },
    'complete': {
      key: 'complete',
      name: 'Complete (أكمل القطعة)',
      nameEn: 'Complete the Passage',
      type: 'activity',
      icon: '📝',
      color: '#10b981'
    },
    'correct': {
      key: 'correct',
      name: 'Correct (صحح ما بين الأقواس)',
      nameEn: 'Correct the Brackets',
      type: 'activity',
      icon: '✓',
      color: '#10b981'
    },
    'find_the_vowel': {
      key: 'find_the_vowel',
      name: 'Find the Vowel (أوجد الحروف المتحركة)',
      nameEn: 'Find the Vowel',
      type: 'activity',
      icon: '🔤',
      color: '#10b981'
    },
    'grammer': {
      key: 'grammer',
      name: 'Grammar Choose (جرامر اختياري)',
      nameEn: 'Grammar Choose',
      type: 'activity',
      icon: '📚',
      color: '#10b981'
    },
    'justtalk': {
      key: 'justtalk',
      name: 'Just Talk (اقرأ وتحدث)',
      nameEn: 'Read & Talk',
      type: 'activity',
      icon: '🗣️',
      color: '#10b981'
    },
    'Matching': {
      key: 'Matching',
      name: 'Matching the Word (توصيل)',
      nameEn: 'Word Matching',
      type: 'activity',
      icon: '🔗',
      color: '#10b981'
    },
    're_arrange': {
      key: 're_arrange',
      name: 'Re-arrange (رتب الكلمات)',
      nameEn: 'Rearrange Words',
      type: 'activity',
      icon: '🔄',
      color: '#10b981'
    },
    'rewrite': {
      key: 'rewrite',
      name: 'Rewrite (أعد كتابة الجملة)',
      nameEn: 'Rewrite Sentences',
      type: 'activity',
      icon: '✍️',
      color: '#10b981'
    },
    'Scramble': {
      key: 'Scramble',
      name: 'Scramble (أعد ترتيب الحروف)',
      nameEn: 'Letter Scramble',
      type: 'activity',
      icon: '🔀',
      color: '#10b981'
    },
    'sequence': {
      key: 'sequence',
      name: 'Sequence (استمع ورتب الأحداث)',
      nameEn: 'Listen & Sequence',
      type: 'activity',
      icon: '📊',
      color: '#10b981'
    },
    'situations': {
      key: 'situations',
      name: 'Situations (ماذا نقول في هذا الموقف)',
      nameEn: 'Situations Response',
      type: 'activity',
      icon: '💬',
      color: '#10b981'
    },
    'sorting': {
      key: 'sorting',
      name: 'Sorting (ضع الكلمات في الصندوق المناسب)',
      nameEn: 'Word Sorting',
      type: 'activity',
      icon: '📦',
      color: '#10b981'
    },
    'spilling': {
      key: 'spilling',
      name: 'Spelling (استمع واكتب)',
      nameEn: 'Listen & Spell',
      type: 'activity',
      icon: '🎧',
      color: '#10b981'
    },
    'Underline': {
      key: 'Underline',
      name: 'Underline (اختر الكلمات المطلوبة)',
      nameEn: 'Underline Words',
      type: 'activity',
      icon: '📏',
      color: '#10b981'
    },
    'vocab_listening_quiz': {
      key: 'vocab_listening_quiz',
      name: 'Vocab Listening Quiz (استمع واختر المعنى الصحيح)',
      nameEn: 'Vocab Listening Quiz',
      type: 'activity',
      icon: '🎧',
      color: '#10b981'
    },
    'vocab_quiz': {
      key: 'vocab_quiz',
      name: 'Vocab Quiz (اختر المعنى الصحيح)',
      nameEn: 'Vocab Quiz',
      type: 'activity',
      icon: '📖',
      color: '#10b981'
    },
    'what_do_you_hear': {
      key: 'what_do_you_hear',
      name: 'What Do You Hear (استمع واختر ما سمعته)',
      nameEn: 'What Do You Hear',
      type: 'activity',
      icon: '👂',
      color: '#10b981'
    },
    'vocab_choose': {
      key: 'vocab_choose',
      name: 'Vocab Choose (اختر الكلمة المناسبة)',
      nameEn: 'Vocab Choose',
      type: 'activity',
      icon: '🎯',
      color: '#10b981'
    }
  },

  // دالة الحصول على معلومات النشاط
  getActivity(key) {
    return this.activities[key] || null;
  },

  // دالة التحقق من وجود نشاط
  exists(key) {
    return key in this.activities;
  },

  // دالة الحصول على جميع الأنشطة
  getAll() {
    return this.activities;
  },

  // دالة الحصول على الأنشطة من نوع معين
  getByType(type) {
    return Object.values(this.activities).filter(a => a.type === type);
  },

  // دالة الحصول على اسم النشاط
  getName(key) {
    const activity = this.activities[key];
    return activity ? activity.name : key;
  },

  // دالة الحصول على اسم النشاط بالإنجليزية
  getNameEn(key) {
    const activity = this.activities[key];
    return activity ? activity.nameEn : key;
  }
};

// تصدير للاستخدام في المتصفح
if (typeof window !== 'undefined') {
  window.ActivitiesRegistry = ActivitiesRegistry;
}