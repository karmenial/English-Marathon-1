// shared/whatsapp-system.js
// ==========================================
// 📱 نظام الواتساب المركزي الموحد
// ==========================================

const WhatsAppSystem = {
  // رقم الواتساب الرئيسي (يتم تحديده من app.js)
  teacherNumber: typeof MY_WHATSAPP_NUMBER !== 'undefined' ? MY_WHATSAPP_NUMBER : '201000000000',

  // دالة إرسال رسالة عامة
  sendMessage(message, recipientNumber = null) {
    const number = recipientNumber || this.teacherNumber;
    const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  },

  // ✅ دالة إرسال بيانات تسجيل طالب جديد (مطلوبة!)
  sendNewRegistration(studentData) {
    const pathInfo = PathFilter.getPathInfo(studentData.level, studentData.grade, studentData.type, '1');
    
    const message = `🎉 تسجيل طالب جديد في منصة English Marathon\n\n` +
                   `👤 اسم الطالب: ${studentData.name}\n` +
                   `📧 البريد الإلكتروني: ${studentData.email}\n` +
                   `🔑 كود المرور: ${studentData.pass}\n` +
                   `📚 المسار الدراسي:\n` +
                   `   • المرحلة: ${pathInfo.level}\n` +
                   `   • الصف: ${pathInfo.grade}\n` +
                   `   • المنهج: ${pathInfo.curriculum}\n\n` +
                   `⏰ تاريخ التسجيل: ${new Date().toLocaleDateString('ar-EG')}\n\n` +
                   `📝 ملاحظة: يرجى تفعيل الحساب وإرسال كود التفعيل للطالب.\n\n` +
                   `منصة English Marathon 🚀`;
    
    this.sendMessage(message);
  },

  // دالة إرسال رسالة من طالب
  sendStudentMessage(studentData, message) {
    const pathInfo = PathFilter.getPathInfo(studentData.level, studentData.grade, studentData.type || studentData.curriculum, '1');
    
    const fullMessage = `السلام عليكم يا مستر،\n` +
                       `أنا الطالب: [ ${studentData.name} ]\n` +
                       `المسار الدراسي: [ ${pathInfo.full} ]\n\n` +
                       `رسالتي واستفساري لك:\n(${message})`;
    
    this.sendMessage(fullMessage);
  },

  // دالة إرسال نتيجة نشاط
  sendActivityResult(studentData, activityKey, score, total) {
    const activityName = ActivitiesRegistry.getName(activityKey);
    const pathInfo = PathFilter.getPathInfo(studentData.level, studentData.grade, studentData.type || studentData.curriculum, '1');
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    const grade = CertificateSystem.calculateGrade(percentage);
    
    const message = `🎉 نتيجة نشاط ${activityName}\n\n` +
                   `👤 الطالب: ${studentData.name}\n` +
                   `📚 المسار: ${pathInfo.full}\n` +
                   `📊 النتيجة: ${score} / ${total} (${percentage}%)\n` +
                   `🏆 التقدير: ${grade.text}\n\n` +
                   `منصة English Marathon 🚀`;
    
    this.sendMessage(message);
  },

  // دالة إرسال رسالة ترحيب
  sendWelcomeMessage(studentData) {
    const pathInfo = PathFilter.getPathInfo(studentData.level, studentData.grade, studentData.type || studentData.curriculum, '1');
    
    const message = `🎉 مرحباً بك في منصة English Marathon!\n\n` +
                   `👤 اسم الطالب: ${studentData.name}\n` +
                   `📚 المسار: ${pathInfo.full}\n\n` +
                   `نحن سعداء بانضمامك إلينا! 🚀`;
    
    this.sendMessage(message);
  },

  // دالة إرسال رسالة دعم فني
  sendSupportMessage(studentData, issue) {
    const pathInfo = PathFilter.getPathInfo(studentData.level, studentData.grade, studentData.type || studentData.curriculum, '1');
    
    const message = `🆘 طلب دعم فني\n\n` +
                   `👤 الطالب: ${studentData.name}\n` +
                   `📚 المسار: ${pathInfo.full}\n\n` +
                   `المشكلة:\n${issue}`;
    
    this.sendMessage(message);
  },

  // ✅ دالة إرسال طلب تجديد الاشتراك
  sendRenewalRequest(studentData) {
    const pathInfo = PathFilter.getPathInfo(studentData.level, studentData.grade, studentData.type || studentData.curriculum, '1');
    
    const message = `⚠️ طلب تجديد اشتراك\n\n` +
                   `👤 الطالب: ${studentData.name}\n` +
                   `📧 البريد: ${studentData.email}\n` +
                   `📚 المسار: ${pathInfo.full}\n\n` +
                   `يرجى التواصل لتجديد الاشتراك.\n\n` +
                   `منصة English Marathon 🚀`;
    
    this.sendMessage(message);
  }
};

// تصدير للاستخدام في المتصفح
if (typeof window !== 'undefined') {
  window.WhatsAppSystem = WhatsAppSystem;
}