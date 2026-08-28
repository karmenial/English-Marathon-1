window.activitiesLogic = window.activitiesLogic || {};

window.activitiesLogic.rewrite = {
    // ============ تحميل الأسئلة ============
    loadQuestions: async function(level, grade, curriculum, unit) {
        let questions = [];
        try {
            const localData = localStorage.getItem('marathon_questions_db');
            if (localData) {
                const db = JSON.parse(localData);
                if (db && db.activityDatabase && db.activityDatabase.rewrite) {
                    const filtered = db.activityDatabase.rewrite.filter(q =>
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
                if (db && db.activityDatabase && db.activityDatabase.rewrite) {
                    const filtered = db.activityDatabase.rewrite.filter(q =>
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
        html += `<p class="question-title-text"><b>${questionIndex + 1}.</b> Rewrite the sentence using the word:</p>`;
        
        html += `<div class="rewrite-container" id="rewrite_${qIdStr}" style="background: rgba(255,255,255,0.08); border: 3px solid var(--border-color); border-radius: 14px; padding: 20px; margin: 15px 0;">`;
        
        // عرض الجملة الأصلية
        html += `<div class="rewrite-original-sentence" style="background: rgba(96, 165, 250, 0.1); border: 2px solid var(--btn-primary); border-radius: 12px; padding: 15px; margin-bottom: 15px;">`;
        html += `<div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 5px; font-weight: 700;">📝 Original Sentence:</div>`;
        html += `<div style="font-size: 1.3rem; font-weight: 900; line-height: 1.6;">${q.sentence}</div>`;
        html += `</div>`;
        
        // عرض الكلمة المطلوبة
        html += `<div class="rewrite-target-word" style="background: rgba(234, 179, 8, 0.1); border: 2px solid #eab308; border-radius: 12px; padding: 15px; margin-bottom: 15px; text-align: center;">`;
        html += `<div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 5px; font-weight: 700;">🎯 Use this word:</div>`;
        html += `<div style="font-size: 1.8rem; font-weight: 900; color: #eab308;">${q.targetWord}</div>`;
        html += `</div>`;
        
        // حقل الإدخال
        html += `<div style="margin-bottom: 15px;">`;
        html += `<label style="display: block; margin-bottom: 8px; font-weight: 700; font-size: 1.1rem;">✍️ Your Answer:</label>`;
        html += `<textarea id="rewriteInput_${qIdStr}" rows="3" placeholder="Write the new sentence here..." style="width: 100%; padding: 12px; border: 3px solid var(--border-color); border-radius: 10px; font-size: 1.2rem; font-weight: 700; font-family: inherit; background: rgba(255,255,255,0.08); color: var(--text-main); resize: vertical; box-sizing: border-box;"></textarea>`;
        html += `</div>`;
        
        // ✅ الأزرار الثلاثة القياسية فقط
        html += `<div class="rewrite-controls" data-controls="${qIdStr}" style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 15px;">`;
        html += `<button class="btn btn-info" data-action="speak" data-qid="${qIdStr}">🔊 استمع للجملة</button>`;
        html += `<button class="btn btn-secondary" data-action="stt" data-qid="${qIdStr}">🎤 تحدث للإجابة</button>`;
        html += `<button class="btn btn-primary" data-action="save" data-qid="${qIdStr}">💾 حفظ الإجابة</button>`;
        html += `</div>`;
        
        // مؤشر حالة الحفظ
        html += `<div class="save-status" data-save-status="${qIdStr}" style="display: none; text-align: center; font-weight: bold; color: var(--success); padding: 8px; border-radius: 8px;"></div>`;
        
        html += `</div>`; // نهاية الحاوية
        return html;
    },

    // ============ تهيئة التفاعلية ============
    init: function(questionId) {
        const qIdStr = String(questionId);
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;

        // تهيئة الحالة
        if (!q.rewriteState) {
            q.rewriteState = {
                savedAnswer: '',
                isSaved: false
            };
        }

        // 1. ربط زر الحذف
        const deleteBtn = document.querySelector(`.delete-q-btn[data-qid="${qIdStr}"]`);
        if (deleteBtn) deleteBtn.onclick = () => deleteQuestion(q.id);

        // 2. Event Delegation للأزرار الثلاثة
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

        // 3. مراقبة الكتابة اليدوية لإعادة تعيين حالة الحفظ
        const answerInput = document.getElementById(`rewriteInput_${qIdStr}`);
        if (answerInput) {
            // استرجاع الإجابة المحفوظة إن وجدت
            if (q.rewriteState.savedAnswer) {
                answerInput.value = q.rewriteState.savedAnswer;
            }
            
            answerInput.addEventListener('input', () => {
                q.rewriteState.isSaved = false;
                this.resetSaveButton(qIdStr);
            });
        }
    },

    // ============ زر حفظ الإجابة (بدون أي كشف أو قفل) ============
    saveAnswer: function(qIdStr) {
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;

        const answerInput = document.getElementById(`rewriteInput_${qIdStr}`);
        if (!answerInput) return;

        const currentText = answerInput.value.trim();
        if (!currentText) {
            alert("الرجاء كتابة الإجابة أولاً!");
            return;
        }

        // حفظ الإجابة في الحالة
        q.rewriteState.savedAnswer = currentText;
        q.rewriteState.isSaved = true;

        // تغذية راجعة بصرية مؤقتة
        const btn = document.querySelector(`[data-controls="${qIdStr}"] button[data-action="save"]`);
        const statusEl = document.querySelector(`[data-save-status="${qIdStr}"]`);
        
        if (btn) {
            btn.innerHTML = '✅ تم الحفظ';
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-success');
            setTimeout(() => {
                btn.innerHTML = '💾 حفظ الإجابة';
                btn.classList.remove('btn-success');
                btn.classList.add('btn-primary');
            }, 1500);
        }

        if (statusEl) {
            statusEl.textContent = '💾 تم حفظ إجابتك. يمكنك التعديل والحفظ مجدداً قبل إنهاء الامتحان.';
            statusEl.style.display = 'block';
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
            const utterance = new SpeechSynthesisUtterance(q.sentence);
            utterance.lang = 'en-US';
            utterance.rate = 0.9;

            if (btn) { btn.innerHTML = '⏹️ إيقاف'; btn.classList.remove('btn-info'); btn.classList.add('btn-warning'); }
            utterance.onend = utterance.onerror = () => {
                if (btn) { btn.innerHTML = '🔊 استمع للجملة'; btn.classList.remove('btn-warning'); btn.classList.add('btn-info'); }
            };
            window.speechSynthesis.speak(utterance);
        }
    },

    // ============ زر الإدخال الصوتي (STT) ============
    startVoiceRecognition: function(qIdStr) {
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;

        const btn = document.querySelector(`[data-controls="${qIdStr}"] button[data-action="stt"]`);
        const answerInput = document.getElementById(`rewriteInput_${qIdStr}`);
        
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
            if (answerInput) answerInput.style.borderColor = '#ef4444';
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.trim();
            if (answerInput) {
                // إضافة النص أو استبداله (هنا نضيف مسافة إذا كان هناك نص مسبق)
                const currentVal = answerInput.value.trim();
                answerInput.value = currentVal ? currentVal + ' ' + transcript : transcript;
                
                // تحديث الحالة
                q.rewriteState.savedAnswer = answerInput.value;
                q.rewriteState.isSaved = false;
                this.resetSaveButton(qIdStr);
            }
        };

        recognition.onerror = (event) => {
            console.warn("Speech error:", event.error);
        };

        recognition.onend = () => {
            if (btn) {
                btn.classList.remove('listening', 'btn-danger');
                btn.classList.add('btn-secondary');
                btn.innerHTML = '🎤 تحدث للإجابة';
            }
            if (answerInput) answerInput.style.borderColor = '';
            this._currentRecognition = null;
        };

        try { recognition.start(); } catch (e) { console.warn("STT Error:", e); }
    },

    // ============ حساب النتيجة (يُستدعى عند إنهاء الامتحان فقط) ============
    calculateScore: function(questionId) {
        const qIdStr = String(questionId);
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return 0;

        const answerInput = document.getElementById(`rewriteInput_${qIdStr}`);
        // نأخذ الإجابة المحفوظة، أو الحالية من الحقل إذا لم يتم الضغط على حفظ
        const userAnswer = (q.rewriteState && q.rewriteState.savedAnswer) ? q.rewriteState.savedAnswer : (answerInput ? answerInput.value.trim() : '');
        
        if (!userAnswer) return 0;

        // مقارنة مرنة (تجاهل علامات الترقيم، المسافات الزائدة، وحالة الأحرف)
        const cleanUser = userAnswer.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
        const cleanCorrect = q.correctAnswer.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();

        return (cleanUser === cleanCorrect) ? 1 : 0;
    },

    // ============ الحد الأقصى للدرجات ============
    getMaxScore: function(questionId) {
        return 1; // كل سؤال إعادة صياغة = درجة واحدة
    }
};