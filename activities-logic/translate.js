window.activitiesLogic = window.activitiesLogic || {};

window.activitiesLogic.translate = {
    // ============ تحميل الأسئلة ============
    loadQuestions: async function(level, grade, curriculum, unit) {
        let questions = [];
        try {
            const localData = localStorage.getItem('marathon_questions_db');
            if (localData) {
                const db = JSON.parse(localData);
                if (db && db.activityDatabase && db.activityDatabase.translate) {
                    const filtered = db.activityDatabase.translate.filter(q =>
                        q.level === level && q.grade === grade && q.curriculum === curriculum &&
                        (unit === '' || unit === undefined || q.unit === unit)
                    );
                    if (filtered.length > 0) return filtered;
                }
            }
        } catch (e) { console.warn("⚠️ خطأ في localStorage:", e); }
        
        try {
            const response = await fetch('./marathonQuestionsDB.json');
            if (response.ok) {
                const db = await response.json();
                if (db && db.activityDatabase && db.activityDatabase.translate) {
                    const filtered = db.activityDatabase.translate.filter(q =>
                        q.level === level && q.grade === grade && q.curriculum === curriculum &&
                        (unit === '' || unit === undefined || q.unit === unit)
                    );
                    if (filtered.length > 0) return filtered;
                }
            }
        } catch (error) { console.warn("⚠️ خطأ في JSON:", error); }
        return [];
    },

    // ============ دالة مساعدة لبعثرة المصفوفة ============
    shuffleArray: function(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    },

    // ============ عرض السؤال ============
    render: function(question, questionIndex) {
        const q = question;
        const qIdStr = String(q.id);
        let html = '';
        
        html += `<button class="delete-q-btn" data-action="delete" data-qid="${qIdStr}">🗑️</button>`;
        html += `<p class="question-title-text"><b>${questionIndex + 1}.</b> Translate the sentence:</p>`;
        
        html += `<div class="translate-container" id="translate_${qIdStr}" style="background: rgba(255,255,255,0.08); border: 3px solid var(--border-color); border-radius: 14px; padding: 20px; margin: 15px 0;">`;
        
        // ✅ 1. إخفاء الجملة الإنجليزية تماماً (مخفية بصرياً ولكن موجودة في DOM لمحرك النطق)
        html += `<span class="hidden-target-word" style="display: none; visibility: hidden; position: absolute;" aria-hidden="true" data-word="${q.word}">${q.word}</span>`;
        
        // ✅ 2. الخيارات عمودية دائماً
        const containerStyle = 'display: flex; flex-direction: column; gap: 12px; width: 100%; margin-bottom: 20px;';
        const buttonStyle = 'width: 100%; text-align: center; padding: 14px 20px;';

        html += `<div class="translate-options" id="options_${qIdStr}" style="${containerStyle}">`;
        const shuffledOptions = this.shuffleArray([...q.options]);
        shuffledOptions.forEach(opt => {
            const cleanOpt = opt.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            // إضافة dir="rtl" لدعم النص العربي بشكل صحيح
            html += `<button class="translate-option-btn" data-option="${cleanOpt}" data-qid="${qIdStr}" style="background: rgba(255,255,255,0.08); border: 2px solid var(--border-color); border-radius: 10px; font-size: 1.15rem; font-weight: 700; cursor: pointer; transition: all 0.2s; color: var(--text-main); font-family: inherit; ${buttonStyle}" dir="rtl">${opt}</button>`;
        });
        html += `</div>`;
        
        // ✅ 3. الأزرار الثلاثة القياسية فقط في شريط واحد (لا يوجد زر استماع داخل حاوية السؤال)
        html += `<div class="translate-controls" data-controls="${qIdStr}" style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px;">`;
        html += `<button class="btn btn-info" data-action="speak" data-qid="${qIdStr}" style="flex: 1; min-width: 120px;">🔊 استمع للجملة</button>`;
        html += `<button class="btn btn-secondary" data-action="stt" data-qid="${qIdStr}" style="flex: 1; min-width: 120px;">🎤 تحدث بالترجمة</button>`;
        html += `<button class="btn btn-primary" data-action="save" data-qid="${qIdStr}" style="flex: 1; min-width: 120px;">💾 حفظ الإجابة</button>`;
        html += `</div>`;

        // مؤشر حالة الحفظ / الصوت
        html += `<div class="stt-status" data-stt-status="${qIdStr}" style="display: none; text-align: center; margin-top: 15px; font-weight: 700; padding: 8px; border-radius: 8px;"></div>`;
        
        // ⛔ تم إزالة رسائل النجاح والأسباب تماماً للحفاظ على نزاهة الامتحان
        
        html += `</div>`;
        return html;
    },

    // ============ تهيئة التفاعلية ============
    init: function(questionId) {
        const qIdStr = String(questionId);
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;

        if (!q.translateState) {
            q.translateState = {
                selectedOption: null,
                isSaved: false,
                recognition: null
            };
        }

        // 1. ربط زر الحذف
        const deleteBtn = document.querySelector(`.delete-q-btn[data-qid="${qIdStr}"]`);
        if (deleteBtn) deleteBtn.onclick = () => deleteQuestion(q.id);

        // 2. Event Delegation للخيارات (تحديد محايد أزرق فاتح)
        const optionsContainer = document.getElementById(`options_${qIdStr}`);
        if (optionsContainer) {
            optionsContainer.addEventListener('click', (e) => {
                const btn = e.target.closest('.translate-option-btn');
                if (!btn) return;

                const selectedOpt = btn.dataset.option;
                
                // إزالة التحديد السابق
                const prevSelected = optionsContainer.querySelector('.translate-option-btn.selected');
                if (prevSelected) {
                    prevSelected.classList.remove('selected');
                    prevSelected.style.background = 'rgba(255,255,255,0.08)';
                    prevSelected.style.borderColor = 'var(--border-color)';
                    prevSelected.style.color = 'var(--text-main)';
                }

                // تطبيق التحديد الجديد (محايد)
                btn.classList.add('selected');
                btn.style.background = 'rgba(96, 165, 250, 0.2)';
                btn.style.borderColor = 'var(--btn-primary)';
                btn.style.color = 'var(--text-main)';

                q.translateState.selectedOption = selectedOpt;
                q.translateState.isSaved = false;
                this.resetSaveButton(qIdStr);
            });
        }

        // 3. Event Delegation لأزرار التحكم
        const controls = document.querySelector(`[data-controls="${qIdStr}"]`);
        if (controls) {
            controls.addEventListener('click', (e) => {
                const btn = e.target.closest('button[data-action]');
                if (!btn) return;
                const action = btn.dataset.action;
                const targetQid = btn.dataset.qid;

                if (action === 'speak') this.speakSentence(targetQid);
                else if (action === 'stt') this.startVoiceRecognition(targetQid);
                else if (action === 'save') this.saveAnswer(targetQid);
            });
        }

        // 4. تهيئة التعرف على الصوت (باللغة العربية)
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'ar-SA'; // العربية للترجمة
            q.translateState.recognition = recognition;
        }
    },

    // ============ زر الاستماع المحسّن (TTS) ============
    speakSentence: function(qIdStr) {
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;

        const btn = document.querySelector(`[data-controls="${qIdStr}"] button[data-action="speak"]`);
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            if (btn) { btn.innerHTML = '🔊 استمع للجملة'; btn.classList.remove('btn-warning'); btn.classList.add('btn-info'); }
            return;
        }

        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            // نقرأ الجملة الإنجليزية المخزنة في q.word
            const utterance = new SpeechSynthesisUtterance(q.word);
            utterance.lang = 'en-US';
            utterance.rate = 0.9;

            if (btn) { btn.innerHTML = '⏹️ إيقاف'; btn.classList.remove('btn-info'); btn.classList.add('btn-warning'); }
            utterance.onend = utterance.onerror = () => {
                if (btn) { btn.innerHTML = '🔊 استمع للجملة'; btn.classList.remove('btn-warning'); btn.classList.add('btn-info'); }
            };
            window.speechSynthesis.speak(utterance);
        }
    },

    // ============ زر الإدخال الصوتي (STT - بالعربية) ============
    startVoiceRecognition: function(qIdStr) {
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q || !q.translateState.recognition) {
            alert("عذراً، متصفحك لا يدعم الإدخال الصوتي.");
            return;
        }

        const btn = document.querySelector(`[data-controls="${qIdStr}"] button[data-action="stt"]`);
        const statusEl = document.querySelector(`[data-stt-status="${qIdStr}"]`);
        const recognition = q.translateState.recognition;

        if (btn && btn.classList.contains('listening')) {
            recognition.stop();
            return;
        }

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.trim();
            const cleanTranscript = transcript.replace(/\s+/g, ' ').toLowerCase();
            
            const optionButtons = document.querySelectorAll(`#options_${qIdStr} .translate-option-btn`);
            let matched = false;
            
            optionButtons.forEach(button => {
                const optText = button.dataset.option.trim().toLowerCase();
                const cleanOpt = optText.replace(/\s+/g, ' ');
                
                // مطابقة مرنة للنص العربي
                if (cleanOpt === cleanTranscript || cleanOpt.includes(cleanTranscript) || cleanTranscript.includes(cleanOpt)) {
                    button.click(); // محاكاة النقر لتفعيل التحديد المحايد
                    matched = true;
                }
            });

            if (statusEl) {
                if (matched) {
                    statusEl.textContent = `✅ تم اختيار: "${transcript}"`;
                    statusEl.style.color = '#4ade80';
                    statusEl.style.background = 'rgba(74, 222, 128, 0.1)';
                } else {
                    statusEl.textContent = `⚠️ لم أتعرف على الخيار. قلت: "${transcript}"`;
                    statusEl.style.color = '#ef4444';
                    statusEl.style.background = 'rgba(239, 68, 68, 0.1)';
                }
            }
        };

        recognition.onstart = () => {
            if (btn) {
                btn.classList.add('listening');
                btn.innerHTML = '🔴 جاري الاستماع...';
                btn.classList.remove('btn-secondary');
                btn.classList.add('btn-danger');
            }
            if (statusEl) {
                statusEl.style.display = 'block';
                statusEl.textContent = '🎧 قل الترجمة بالعربية بوضوح...';
                statusEl.style.color = '#eab308';
                statusEl.style.background = 'rgba(234, 179, 8, 0.1)';
            }
        };

        recognition.onerror = (event) => {
            if (statusEl) {
                statusEl.textContent = '⚠️ لم أسمعك بوضوح، حاول مرة أخرى أو اختر يدوياً.';
                statusEl.style.color = '#ef4444';
                statusEl.style.background = 'rgba(239, 68, 68, 0.1)';
            }
        };

        recognition.onend = () => {
            if (btn) {
                btn.classList.remove('listening', 'btn-danger');
                btn.classList.add('btn-secondary');
                btn.innerHTML = '🎤 تحدث بالترجمة';
            }
        };

        try { recognition.start(); } catch (e) { console.warn("STT Error:", e); }
    },

    // ============ زر حفظ الإجابة (بدون قفل أو كشف) ============
    saveAnswer: function(qIdStr) {
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;

        if (!q.translateState.selectedOption) {
            alert("الرجاء اختيار إجابة أولاً!");
            return;
        }

        q.translateState.savedOption = q.translateState.selectedOption;
        q.translateState.isSaved = true;

        const btn = document.querySelector(`[data-controls="${qIdStr}"] button[data-action="save"]`);
        const statusEl = document.querySelector(`[data-stt-status="${qIdStr}"]`);
        
        if (btn) {
            const originalText = btn.innerHTML;
            btn.innerHTML = '✅ تم الحفظ';
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-success');
            
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.classList.remove('btn-success');
                btn.classList.add('btn-primary');
            }, 1500);
        }

        if (statusEl) {
            statusEl.textContent = '💾 تم حفظ إجابتك. يمكنك التعديل والحفظ مجدداً قبل إنهاء الامتحان.';
            statusEl.style.display = 'block';
            statusEl.style.color = 'var(--success)';
            statusEl.style.background = 'rgba(34, 197, 94, 0.1)';
            setTimeout(() => { statusEl.style.display = 'none'; }, 3000);
        }
    },

    resetSaveButton: function(qIdStr) {
        const btn = document.querySelector(`[data-controls="${qIdStr}"] button[data-action="save"]`);
        if (btn) {
            btn.innerHTML = '💾 حفظ الإجابة';
            btn.classList.remove('btn-success');
            btn.classList.add('btn-primary');
        }
    },

    // ============ حساب النتيجة (يُستدعى عند إنهاء الامتحان فقط) ============
    calculateScore: function(questionId) {
        const qIdStr = String(questionId);
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q || !q.translateState) return 0;

        const userAnswer = (q.translateState.savedOption || q.translateState.selectedOption || '').trim().toLowerCase().replace(/\s+/g, ' ');
        const correctAnswer = (q.meaning || '').trim().toLowerCase().replace(/\s+/g, ' ');

        // مقارنة مرنة للنص العربي
        return (userAnswer === correctAnswer || userAnswer.includes(correctAnswer) || correctAnswer.includes(userAnswer)) && userAnswer !== '' ? 1 : 0;
    },

    // ============ الحد الأقصى للدرجات ============
    getMaxScore: function(questionId) {
        return 1;
    }
};