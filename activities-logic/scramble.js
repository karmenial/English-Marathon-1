window.activitiesLogic = window.activitiesLogic || {};

window.activitiesLogic.Scramble = {
    // ============ تحميل الأسئلة ============
    loadQuestions: async function(level, grade, curriculum, unit) {
        let questions = [];
        try {
            const localData = localStorage.getItem('marathon_questions_db');
            if (localData) {
                const db = JSON.parse(localData);
                if (db && db.activityDatabase && db.activityDatabase.Scramble) {
                    const filtered = db.activityDatabase.Scramble.filter(q =>
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
                if (db && db.activityDatabase && db.activityDatabase.Scramble) {
                    const filtered = db.activityDatabase.Scramble.filter(q =>
                        q.level === level && q.grade === grade && q.curriculum === curriculum &&
                        (unit === '' || unit === undefined || q.unit === unit)
                    );
                    if (filtered.length > 0) return filtered;
                }
            }
        } catch (error) { console.warn("⚠️ خطأ في JSON:", error); }
        return [];
    },

    // بعثرة الحروف
    shuffleWord: function(word) {
        const letters = word.split('');
        for (let i = letters.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [letters[i], letters[j]] = [letters[j], letters[i]];
        }
        let scrambled = letters.join('');
        if (scrambled === word && word.length > 1) {
            return this.shuffleWord(word);
        }
        return scrambled;
    },

    // ============ عرض السؤال ============
    render: function(question, questionIndex) {
        const q = question;
        const qIdStr = String(q.id);
        let html = '';
        
        const scrambledWord = this.shuffleWord(q.word);
        
        html += `<button class="delete-q-btn" data-action="delete" data-qid="${qIdStr}">🗑️</button>`;
        html += `<p class="question-title-text"><b>${questionIndex + 1}.</b> Unscramble the letters to form the correct word:</p>`;
        
        html += `<div class="scramble-container" id="scramble_${qIdStr}" style="background: rgba(255,255,255,0.08); border: 3px solid var(--border-color); border-radius: 14px; padding: 20px; margin: 15px 0;">`;
        
        // عرض الكلمة المبعثرة
        html += `<div class="scramble-word-display" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; padding: 30px; margin: 20px 0; text-align: center;">`;
        html += `<div style="font-size: 0.9rem; color: rgba(255,255,255,0.8); margin-bottom: 10px; font-weight: 700;">🔤 Scrambled Letters:</div>`;
        html += `<div style="font-size: 3rem; font-weight: 900; color: white; letter-spacing: 8px; text-transform: uppercase;">${scrambledWord}</div>`;
        html += `</div>`;
        
        // حقل الإدخال
        html += `<div style="margin-bottom: 15px;">`;
        html += `<label style="display: block; margin-bottom: 8px; font-weight: 700; font-size: 1.1rem;">✍️ Your Answer:</label>`;
        html += `<input type="text" id="scrambleInput_${qIdStr}" placeholder="Type the correct word here..." style="width: 100%; padding: 14px; border: 3px solid var(--border-color); border-radius: 10px; font-size: 1.3rem; font-weight: 700; font-family: inherit; background: rgba(255,255,255,0.08); color: var(--text-main); box-sizing: border-box; text-align: center; letter-spacing: 2px; text-transform: lowercase;">`;
        html += `</div>`;
        
        // ✅ الأزرار الثلاثة القياسية فقط
        html += `<div class="scramble-controls" data-controls="${qIdStr}" style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 15px;">`;
        html += `<button class="btn btn-info" data-action="speak" data-qid="${qIdStr}">🔊 استمع للكلمة</button>`;
        html += `<button class="btn btn-secondary" data-action="stt" data-qid="${qIdStr}">🎤 تحدث للإجابة</button>`;
        html += `<button class="btn btn-primary" data-action="save" data-qid="${qIdStr}">💾 حفظ الإجابة</button>`;
        html += `</div>`;
        
        // مؤشر حالة الحفظ
        html += `<div class="save-status" data-save-status="${qIdStr}" style="display: none; text-align: center; font-weight: bold; color: var(--success); padding: 8px; border-radius: 8px;"></div>`;
        
        html += `</div>`;
        return html;
    },

    // ============ تهيئة التفاعلية ============
    init: function(questionId) {
        const qIdStr = String(questionId);
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;

        if (!q.scrambleState) {
            q.scrambleState = {
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

                if (action === 'speak') this.speakWord(targetQid);
                else if (action === 'stt') this.startVoiceRecognition(targetQid);
                else if (action === 'save') this.saveAnswer(targetQid);
            });
        }

        // 3. مراقبة الكتابة اليدوية لإعادة تعيين حالة الحفظ
        const answerInput = document.getElementById(`scrambleInput_${qIdStr}`);
        if (answerInput) {
            if (q.scrambleState.savedAnswer) {
                answerInput.value = q.scrambleState.savedAnswer;
            }
            
            answerInput.addEventListener('input', () => {
                q.scrambleState.isSaved = false;
                this.resetSaveButton(qIdStr);
            });
        }
    },

    // ============ زر حفظ الإجابة (بدون أي كشف أو قفل) ============
    saveAnswer: function(qIdStr) {
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;

        const answerInput = document.getElementById(`scrambleInput_${qIdStr}`);
        if (!answerInput) return;

        const currentText = answerInput.value.trim();
        if (!currentText) {
            alert("الرجاء كتابة الإجابة أولاً!");
            return;
        }

        q.scrambleState.savedAnswer = currentText;
        q.scrambleState.isSaved = true;

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
    speakWord: function(qIdStr) {
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;

        const btn = document.querySelector(`[data-controls="${qIdStr}"] button[data-action="speak"]`);
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            if (btn) { btn.innerHTML = '🔊 استمع للكلمة'; btn.classList.remove('btn-warning'); btn.classList.add('btn-info'); }
            return;
        }

        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(q.word);
            utterance.lang = 'en-US';
            utterance.rate = 0.8;

            if (btn) { btn.innerHTML = '⏹️ إيقاف'; btn.classList.remove('btn-info'); btn.classList.add('btn-warning'); }
            utterance.onend = utterance.onerror = () => {
                if (btn) { btn.innerHTML = '🔊 استمع للكلمة'; btn.classList.remove('btn-warning'); btn.classList.add('btn-info'); }
            };
            window.speechSynthesis.speak(utterance);
        }
    },

    // ============ زر الإدخال الصوتي (STT) ============
    startVoiceRecognition: function(qIdStr) {
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;

        const btn = document.querySelector(`[data-controls="${qIdStr}"] button[data-action="stt"]`);
        const answerInput = document.getElementById(`scrambleInput_${qIdStr}`);
        
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
                answerInput.value = transcript;
                q.scrambleState.savedAnswer = transcript;
                q.scrambleState.isSaved = false;
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

        const answerInput = document.getElementById(`scrambleInput_${qIdStr}`);
        const userAnswer = (q.scrambleState && q.scrambleState.savedAnswer) ? q.scrambleState.savedAnswer : (answerInput ? answerInput.value.trim() : '');
        
        if (!userAnswer) return 0;

        return (userAnswer.toLowerCase() === q.word.toLowerCase()) ? 1 : 0;
    },

    // ============ الحد الأقصى للدرجات ============
    getMaxScore: function(questionId) {
        return 1;
    }
};