// ==========================================
//  نظام الشهادات المركزي - English Marathon
//  التصميم العصري: أزرق داكن + سيان + ذهبي
// ==========================================

// ==========================================
// 🎯 المتغيرات العامة
// ==========================================
let certificateBlob = null;

// ==========================================
// 🎯 إعدادات النشاط (يتم تمريرها من URL)
// ==========================================
const CERTIFICATE_CONFIG = {
  activityKey: 'complete',
  activityName: 'Complete (أكمل القطعة)',
  instructorWhatsapp: '201149955726',
  platformLogo: '',
  studentData: {
    name: '',
    level: 'primary',
    grade: '4',
    curriculum: 'AL',
    unit: '1'
  },
  score: 0,
  total: 0,
  percentage: 0,
  grade: ''
};

// ==========================================
// 🎯 دالة قراءة البيانات من URL
// ==========================================
function readDataFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  
  CERTIFICATE_CONFIG.studentData.name = urlParams.get('name') || urlParams.get('studentName') || 'Student';
  CERTIFICATE_CONFIG.studentData.level = urlParams.get('level') || 'primary';
  CERTIFICATE_CONFIG.studentData.grade = urlParams.get('grade') || '4';
  CERTIFICATE_CONFIG.studentData.curriculum = urlParams.get('curriculum') || urlParams.get('type') || 'AL';
  CERTIFICATE_CONFIG.studentData.unit = urlParams.get('unit') || '1';
  
  CERTIFICATE_CONFIG.activityKey = urlParams.get('activity') || urlParams.get('activityKey') || 'complete';
  CERTIFICATE_CONFIG.activityName = urlParams.get('activityName') || CERTIFICATE_CONFIG.activityKey;
  
  CERTIFICATE_CONFIG.score = parseInt(urlParams.get('score')) || 0;
  CERTIFICATE_CONFIG.total = parseInt(urlParams.get('total')) || 0;
  
  const logoFromURL = urlParams.get('logo');
  if (logoFromURL) {
    CERTIFICATE_CONFIG.platformLogo = logoFromURL;
  }
  
  console.log('📥 تم قراءة البيانات من URL:', CERTIFICATE_CONFIG);
}

// ==========================================
// 🎯 دالة تحميل اللوجو من usersDB
// ==========================================
async function loadLogoFromUsersDB() {
  if (CERTIFICATE_CONFIG.platformLogo && CERTIFICATE_CONFIG.platformLogo.trim() !== '') {
    return CERTIFICATE_CONFIG.platformLogo;
  }
  
  try {
    const response = await fetch('../../users_db.json');
    if (response.ok) {
      const usersDB = await response.json();
      if (usersDB.settings && usersDB.settings.platformLogo) {
        CERTIFICATE_CONFIG.platformLogo = usersDB.settings.platformLogo;
        console.log('✅ تم تحميل اللوجو من users_db.json');
        return usersDB.settings.platformLogo;
      }
    }
  } catch (error) {
    console.warn('️ لم يتم العثور على users_db.json:', error);
  }
  
  return null;
}

// ==========================================
// 🎯 دالة تهيئة الشهادة
// ==========================================
async function initCertificate(config = {}) {
  Object.assign(CERTIFICATE_CONFIG, config);
  readDataFromURL();
  await loadLogoFromUsersDB();
  
  if (CERTIFICATE_CONFIG.total > 0) {
    CERTIFICATE_CONFIG.percentage = Math.round(
      (CERTIFICATE_CONFIG.score / CERTIFICATE_CONFIG.total) * 100
    );
  }
  
  CERTIFICATE_CONFIG.grade = calculateGrade(CERTIFICATE_CONFIG.percentage);
  const certId = generateCertificateId();
  fillCertificateData(certId);
  loadPlatformLogo();
  
  console.log('✅ تم تهيئة الشهادة بنجاح');
}

// ==========================================
// 🎯 دالة حساب التقدير
// ==========================================
function calculateGrade(percentage) {
  if (percentage >= 90) {
    return {
      en: 'Excellent',
      emoji: '🌟',
      motivation: 'إنجاز رائع! تفانيك في تعلم اللغة الإنجليزية ملهم حقاً. استمر في التألق وواصل هذه الرحلة المميزة نحو التميز!'
    };
  }
  if (percentage >= 80) {
    return {
      en: 'Very Good',
      emoji: '👏',
      motivation: 'عمل ممتاز! لقد أظهرت التزاماً وتقدماً كبيراً. استمر في المضي قدماً، فجهودك تؤتي ثمارها بشكل رائع!'
    };
  }
  if (percentage >= 70) {
    return {
      en: 'Good',
      emoji: '',
      motivation: 'عمل رائع! أنت على الطريق الصحيح نحو الاحتراف. حافظ على تركيزك، وتدرب يومياً، وشاهد مهاراتك تتطور بقوة كل يوم!'
    };
  }
  if (percentage >= 60) {
    return {
      en: 'Pass',
      emoji: '✅',
      motivation: 'جهد جيد! كل خبير كان مبتدئاً في يوم من الأيام. استمر في التدريب، وحافظ على حماسك، وتذكر: التقدم تقدم، مهما كان صغيراً!'
    };
  }
  return {
    en: 'Needs Improvement',
    emoji: '💪',
    motivation: 'لا تستسلم! كل تحدٍ هو فرصة للتعلم. راجع المادة، وتدرب أكثر، وستلاحظ تحسناً مذهلاً!'
  };
}

// ==========================================
// 🎯 دالة توليد رقم الشهادة
// ==========================================
function generateCertificateId() {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `EM-${year}-${random}`;
}

// ==========================================
// 🎯 دالة ملء بيانات الشهادة
// ==========================================
function fillCertificateData(certId) {
  const config = CERTIFICATE_CONFIG;
  
  document.getElementById('certName').textContent = config.studentData.name || 'Student';
  document.getElementById('certActivity').textContent = config.activityName;
  
  const gradeBadge = document.getElementById('certGradeBadge');
  gradeBadge.textContent = `${config.grade.emoji} ${config.grade.en}`;
  
  document.getElementById('certScore').textContent = `${config.score} / ${config.total}`;
  document.getElementById('certPercentage').textContent = `${config.percentage}%`;
  
  const levelNames = {
    'primary': 'Primary',
    'preparatory': 'Preparatory',
    'secondary': 'Secondary'
  };
  
  document.getElementById('certLevel').textContent = levelNames[config.studentData.level] || config.studentData.level;
  document.getElementById('certGrade').textContent = `Grade ${config.studentData.grade}`;
  document.getElementById('certCurriculum').textContent = config.studentData.curriculum;
  document.getElementById('certUnit').textContent = `Unit ${config.studentData.unit}`;
  
  document.getElementById('certId').textContent = certId;
  document.getElementById('certMotivation').textContent = config.grade.motivation;
  
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  document.getElementById('certDate').textContent = dateStr;
  document.getElementById('certYear').textContent = today.getFullYear();
}

// ==========================================
// 🎯 دالة تحميل اللوجو
// ==========================================
function loadPlatformLogo() {
  const logoUrl = CERTIFICATE_CONFIG.platformLogo;
  if (logoUrl && logoUrl.trim() !== '') {
    const logoEl = document.getElementById('certLogo');
    logoEl.src = logoUrl;
    logoEl.style.display = 'block';
    logoEl.onerror = function() {
      this.style.display = 'none';
      console.warn('⚠️ فشل تحميل اللوجو، سيتم إخفاؤه');
    };
  } else {
    console.log('ℹ️ لا يوجد لوجو متاح');
  }
}

// ==========================================
// 🎯 دالة توليد Blob الشهادة
// ==========================================
async function generateCertificateBlob() {
  try {
    const certificateCard = document.getElementById('certificateCard');
    const canvas = await html2canvas(certificateCard, {
      scale: 2,
      backgroundColor: null,
      useCORS: true,
      logging: false
    });
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        certificateBlob = blob;
        resolve(blob);
      }, 'image/png', 1.0);
    });
  } catch (error) {
    console.error('❌ خطأ في توليد الشهادة:', error);
    return null;
  }
}

// ==========================================
// 🎯 دالة تنزيل الشهادة
// ==========================================
async function downloadCertificate() {
  const btn = document.getElementById('downloadBtn');
  const loading = document.getElementById('loadingOverlay');
  
  btn.disabled = true;
  loading.classList.add('show');
  
  try {
    let blob = certificateBlob;
    if (!blob) {
      blob = await generateCertificateBlob();
    }
    
    if (!blob) {
      alert('️ Error preparing certificate');
      return;
    }
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    const studentName = CERTIFICATE_CONFIG.studentData.name || 'Student';
    const safeName = studentName.replace(/[^a-zA-Z0-9\u0600-\u06FF ]/g, '').trim();
    a.download = `Certificate_${safeName}_EnglishMarathon.png`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    loading.classList.remove('show');
    btn.disabled = false;
    
    console.log('✅ تم تنزيل الشهادة بنجاح');
    
  } catch (error) {
    console.error('❌ خطأ في التنزيل:', error);
    loading.classList.remove('show');
    btn.disabled = false;
  }
}

// ==========================================
// 🎯 دالة إرسال الشهادة عبر واتساب
// ==========================================
async function sendToWhatsApp() {
  const btn = document.getElementById('whatsappBtn');
  const loading = document.getElementById('loadingOverlay');
  
  btn.disabled = true;
  loading.classList.add('show');
  
  try {
    let blob = certificateBlob;
    if (!blob) {
      blob = await generateCertificateBlob();
    }
    
    const config = CERTIFICATE_CONFIG;
    
    const message = `🎉 *Certificate of Completion* 🎉

 *Student:* ${config.studentData.name}
📚 *Activity:* ${config.activityName}
📊 *Score:* ${config.score} / ${config.total} (${config.percentage}%)
 *Grade:* ${config.grade.emoji} ${config.grade.en}

📍 *Path:*
   • Level: ${config.studentData.level}
   • Grade: ${config.studentData.grade}
   • Curriculum: ${config.studentData.curriculum}
   • Unit: ${config.studentData.unit}

📎 Please find my certificate attached!

---
 English Marathon Platform 🚀`;
    
    const whatsappUrl = `https://wa.me/${config.instructorWhatsapp}?text=${encodeURIComponent(message)}`;
    
    if (blob && navigator.canShare && navigator.canShare({ files: [new File([blob], 'certificate.png', { type: 'image/png' })] })) {
      try {
        await navigator.share({
          title: '🏆 English Marathon Certificate',
          text: message,
          files: [new File([blob], `Certificate_${config.studentData.name}.png`, { type: 'image/png' })]
        });
        
        loading.classList.remove('show');
        btn.disabled = false;
        console.log('✅ تم المشاركة بنجاح');
        return;
        
      } catch (e) {
        if (e.name === 'AbortError') {
          loading.classList.remove('show');
          btn.disabled = false;
          return;
        }
        console.warn('⚠️ فشل Web Share API، استخدام البديل');
      }
    }
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Certificate_${config.studentData.name}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    setTimeout(() => {
      URL.revokeObjectURL(url);
      window.open(whatsappUrl, '_blank');
      loading.classList.remove('show');
      btn.disabled = false;
      alert('✅ Certificate downloaded as image\n\nPlease attach the image in the WhatsApp conversation that was opened');
    }, 1500);
    
  } catch (error) {
    console.error(' خطأ في الإرسال:', error);
    loading.classList.remove('show');
    btn.disabled = false;
  }
}

// ==========================================
// 🎯 دالة إعادة النشاط
// ==========================================
function retakeActivity() {
  if (confirm('Do you want to retake the activity from the beginning?')) {
    window.history.back();
  }
}

// ==========================================
// 🎯 دالة مشاركة الشهادة
// ==========================================
async function shareCertificate() {
  const btn = document.getElementById('shareBtn');
  const loading = document.getElementById('loadingOverlay');
  
  btn.disabled = true;
  loading.classList.add('show');
  
  try {
    let blob = certificateBlob;
    if (!blob) {
      blob = await generateCertificateBlob();
    }
    
    if (!blob) {
      alert('⚠️ Error preparing certificate');
      return;
    }
    
    const config = CERTIFICATE_CONFIG;
    
    const shareData = {
      title: '🏆 English Marathon Certificate',
      text: `I just completed ${config.activityName} on English Marathon! 🎉\n\n Score: ${config.score}/${config.total} (${config.percentage}%)\n🏆 Grade: ${config.grade.emoji} ${config.grade.en}`,
      files: [new File([blob], `Certificate_${config.studentData.name}.png`, { type: 'image/png' })]
    };
    
    if (navigator.canShare && navigator.canShare({ files: [new File([blob], 'certificate.png', { type: 'image/png' })] })) {
      try {
        await navigator.share(shareData);
        console.log('✅ تم المشاركة بنجاح');
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('⚠️ فشل المشاركة، استخدام البديل');
          await downloadCertificate();
          alert('📥 Certificate downloaded\n\nPlease share it manually from your gallery');
        }
      }
    } else {
      await downloadCertificate();
      alert('📥 Certificate downloaded\n\nPlease share it manually from your gallery');
    }
    
    loading.classList.remove('show');
    btn.disabled = false;
    
  } catch (error) {
    console.error('❌ خطأ في المشاركة:', error);
    loading.classList.remove('show');
    btn.disabled = false;
  }
}

// ==========================================
// 🎯 تصدير الدوال للاستخدام الخارجي
// ==========================================
if (typeof window !== 'undefined') {
  window.CertificateSystem = {
    init: initCertificate,
    download: downloadCertificate,
    sendWhatsApp: sendToWhatsApp,
    share: shareCertificate,
    retake: retakeActivity,
    calculateGrade: calculateGrade
  };
}

// ==========================================
// 🎯 تهيئة تلقائية عند تحميل الصفحة
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🎨 Certificate System Ready');
  console.log('📋 Initializing certificate...');
  await initCertificate();
});