window.activitiesLogic = window.activitiesLogic || {};

window.activitiesLogic.situations = {
    // ============ تحميل الأسئلة ============
    loadQuestions: async function(level, grade, curriculum, unit) {
        let questions = [];
        try {
            const localData = localStorage.getItem('marathon_questions_db');
            if (localData) {
                const db = JSON.parse(localData);
                if (db && db.activityDatabase && db.activityDatabase.situations) {
                    const filtered = db.activityDatabase.situations.filter(q =>
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
                if (db && db.activityDatabase && db.activityDatabase.situations) {
                    const filtered = db.activityDatabase.situations.filter(q =>
                        q.level === level && q.grade === grade && q.curriculum === curriculum &&
                        (unit === '' || unit === undefined || q.unit === unit)
                    );
                    if (filtered.length > 0) return filtered;
                }
            }
        } catch (error) { console.warn("⚠️ خطأ في JSON:", error); }
        return [];
    },

    // ============ عرض السؤال ============
    render: function(question, questionIndex) {
        const q = question;
        const qIdStr = String(q.id);
        let html = '';
        
        html += `<button class="delete-q-btn" data-action="delete" data-qid="${qIdStr}">🗑️</button>`;
        html += `<p class="question-title-text"><b>${questionIndex + 1}.</b> What would you say in this situation?</p>`;
        
        html += `<div class="situations-container" id="situations_${qIdStr}" style="background: rgba(255,255,255,0.08); border: 3px solid var(--border-color); border-radius: 14px; padding: 20px; margin: 15px 0;">`;
        
        // عرض السؤال
        html += `<div class="situations-question-text" style="background: rgba(96, 165, 250, 0.1); border: 2px solid var(--btn-primary); border-radius: 12px; padding: 15px; margin-bottom: 15px; font-size: 1.2rem; font-weight: 700; line-height: 1.6;">`;
        html += `<span>${q.question}</span>`;
        html += `</div>`;
        
        // ✅ الخيارات عمودية دائماً (لأنها جمل)
        html += `<div class="situations-options" id="options_${qIdStr}" style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 15px;">`;
        const shuffledOptions = [...q.options].sort(() => Math.random() - 0.5);
        shuffledOptions.forEach(opt => {
            const cleanOpt = opt.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            html += `<button class="situations-option-btn" data-option="${cleanOpt}" data-qid="${qIdStr}" style="background: rgba(255,255,255,0.08); border: 2px solid var(--border-color); border-radius: 10px; padding: 14px; font-size: 1.1rem; font-weight: 700; cursor: pointer; text-align: left; transition: all 0.2s; color: var(--text-main); font-family: inherit; line-height: 1.5;">${opt}</button>`;
        });
        html += `</div>`;
        
        // ✅ الأزرار الثلاثة القياسية في صف واحد
        html += `<div class="situations-controls" data-controls="${qIdStr}" style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px;">`;
        html += `<button class="btn btn-info" data-action="speak" data-qid="${qIdStr}" style="flex: 1; min-width: 120px;">🔊 استمع للسؤال</button>`;
        html += `<button class="btn btn-secondary" data-action="stt" data-qid="${qIdStr}" style="flex: 1; min-width: 120px;">🎤 تحدث بالإجابة</button>`;
        html += `<button class="btn btn-primary" data-action="save" data-qid="${qIdStr}" style="flex: 1; min-width: 120px;">💾 حفظ الإجابة</button>`;
        html += `</div>`;
        
        // مؤشر حالة الحفظ / الصوت
        html += `<div class="stt-status" data-stt-status="${qIdStr}" style="display: none; text-align: center; margin-top: 15px; font-weight: 700; padding: 8px; border-radius: 8px;"></div>`;
        
        html += `</div>`;
        return html;
    },

    // ============ تهيئة التفاعلية ============
    init: function(questionId) {
        const qIdStr = String(questionId);
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;

        if (!q.situationsState) {
            q.situationsState = {
                selectedOption: null,
                isSaved: false
            };
        }

        // 1. ربط زر الحذف
        const deleteBtn = document.querySelector(`.delete-q-btn[data-qid="${qIdStr}"]`);
        if (deleteBtn) deleteBtn.onclick = () => deleteQuestion(q.id);

        // 2. Event Delegation للخيارات (تحديد محايد)
        const optionsContainer = document.getElementById(`options_${qIdStr}`);
        if (optionsContainer) {
            optionsContainer.addEventListener('click', (e) => {
                const btn = e.target.closest('.situations-option-btn');
                if (!btn) return;

                const selectedOpt = btn.dataset.option;
                
                // إزالة التحديد السابق
                const prevSelected = optionsContainer.querySelector('.situations-option-btn.selected');
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

                q.situationsState.selectedOption = selectedOpt;
                q.situationsState.isSaved = false;
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

                if (action === 'speak') this.speakQuestion(targetQid);
                else if (action === 'stt') this.startVoiceRecognition(targetQid);
                else if (action === 'save') this.saveAnswer(targetQid);
            });
        }
    },

    // ============ زر الاستماع المحسّن (TTS) ============
    speakQuestion: function(qIdStr) {
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;

        const btn = document.querySelector(`[data-controls="${qIdStr}"] button[data-action="speak"]`);
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            if (btn) { btn.innerHTML = '🔊 استمع للسؤال'; btn.classList.remove('btn-warning'); btn.classList.add('btn-info'); }
            return;
        }

        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(q.question);
            utterance.lang = 'en-US';
            utterance.rate = 0.9;

            if (btn) { btn.innerHTML = '⏹️ إيقاف'; btn.classList.remove('btn-info'); btn.classList.add('btn-warning'); }
            utterance.onend = utterance.onerror = () => {
                if (btn) { btn.innerHTML = '🔊 استمع للسؤال'; btn.classList.remove('btn-warning'); btn.classList.add('btn-info'); }
            };
            window.speechSynthesis.speak(utterance);
        }
    },

    // ============ زر الإدخال الصوتي (STT) ============
    startVoiceRecognition: function(qIdStr) {
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;

        const btn = document.querySelector(`[data-controls="${qIdStr}"] button[data-action="stt"]`);
        const statusEl = document.querySelector(`[data-stt-status="${qIdStr}"]`);
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            if (btn) { btn.innerHTML = '⚠️ غير مدعوم'; btn.disabled = true; }
            return;
        }

        if (btn && btn.classList.contains('listening')) {
            if (this._currentRecognition) { this._currentRecognition.stop(); this._currentRecognition = null; }
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        this._currentRecognition = recognition;

        recognition.onstart = () => {
            if (btn) {
                btn.classList.add('listening');
                btn.innerHTML = '🔴 جاري الاستماع...';
                btn.classList.remove('btn-secondary');
                btn.classList.add('btn-danger');
            }
            if (statusEl) {
                statusEl.style.display = 'block';
                statusEl.textContent = '🎧 قل الإجابة المناسبة بوضوح...';
                statusEl.style.color = '#eab308';
                statusEl.style.background = 'rgba(234, 179, 8, 0.1)';
            }
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.trim().toLowerCase();
            const optionButtons = document.querySelectorAll(`#options_${qIdStr} .situations-option-btn`);
            let matched = false;
            
            optionButtons.forEach(button => {
                const optText = button.dataset.option.trim().toLowerCase();
                // مطابقة مرنة: إذا كان النص المنطوق يطابق الخيار أو يحتوي عليه بشكل واضح
                if (optText === transcript || transcript.includes(optText) || optText.includes(transcript)) {
                    button.click(); // محاكاة النقر لتفعيل التحديد المحايد
                    matched = true;
                }
            });

            if (statusEl) {
                if (matched) {
                    statusEl.textContent = `✅ تم اختيار الإجابة المنطوقة`;
                    statusEl.style.color = '#4ade80';
                    statusEl.style.background = 'rgba(74, 222, 128, 0.1)';
                } else {
                    statusEl.textContent = `⚠️ لم أتعرف على الخيار. قلت: "${transcript}"`;
                    statusEl.style.color = '#ef4444';
                    statusEl.style.background = 'rgba(239, 68, 68, 0.1)';
                }
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
                btn.innerHTML = '🎤 تحدث بالإجابة';
            }
            this._currentRecognition = null;
        };

        try { recognition.start(); } catch (e) { console.warn("STT Error:", e); }
    },

    // ============ زر حفظ الإجابة (بدون قفل أو كشف) ============
    saveAnswer: function(qIdStr) {
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;

        if (!q.situationsState.selectedOption) {
            alert("الرجاء اختيار إجابة أولاً!");
            return;
        }

        q.situationsState.savedOption = q.situationsState.selectedOption;
        q.situationsState.isSaved = true;

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
        if (!q || !q.situationsState) return 0;

        const userAnswer = (q.situationsState.savedOption || q.situationsState.selectedOption || '').trim().toLowerCase();
        const correctAnswer = (q.correctAnswer || '').trim().toLowerCase();

        return (userAnswer === correctAnswer && userAnswer !== '') ? 1 : 0;
    },

    // ============ الحد الأقصى للدرجات ============
    getMaxScore: function(questionId) {
        return 1; // كل سؤال موقف = درجة واحدة
    }
};