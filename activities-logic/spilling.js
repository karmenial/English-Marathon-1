window.activitiesLogic = window.activitiesLogic || {};

window.activitiesLogic.spilling = {
    // ============ تحميل الأسئلة ============
    loadQuestions: async function(level, grade, curriculum, unit) {
        let questions = [];
        try {
            const localData = localStorage.getItem('marathon_questions_db');
            if (localData) {
                const db = JSON.parse(localData);
                if (db && db.activityDatabase && db.activityDatabase.spilling) {
                    const filtered = db.activityDatabase.spilling.filter(q =>
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
                if (db && db.activityDatabase && db.activityDatabase.spilling) {
                    const filtered = db.activityDatabase.spilling.filter(q =>
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
        html += `<p class="question-title-text"><b>${questionIndex + 1}.</b> Listen and spell the word:</p>`;
        
        html += `<div class="spilling-container" id="spilling_${qIdStr}" style="background: rgba(255,255,255,0.08); border: 3px solid var(--border-color); border-radius: 14px; padding: 20px; margin: 15px 0; position: relative;">`;
        
        // ✅ التعديل هنا: الأزرار الثلاثة مجمعة في صف واحد أسفل العنوان وأعلى الإجابة
        html += `<div class="spilling-controls" data-controls="${qIdStr}" style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-bottom: 20px;">`;
        html += `<button class="btn btn-info" data-action="speak" data-qid="${qIdStr}" style="padding: 12px 20px; font-size: 1rem;">🔊 استمع للكلمة</button>`;
        html += `<button class="btn btn-secondary" data-action="stt" data-qid="${qIdStr}" style="padding: 12px 20px; font-size: 1rem;">🎤 تحدث للإجابة</button>`;
        html += `<button class="btn btn-primary" data-action="save" data-qid="${qIdStr}" style="padding: 12px 20px; font-size: 1rem;">💾 حفظ الإجابة</button>`;
        html += `</div>`;
        
        // مربعات الحروف
        html += `<div class="spilling-letters" id="lettersContainer_${qIdStr}" style="display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; margin: 20px 0;">`;
        const targetWord = (q.word || q["word "] || "").trim();
        for (let i = 0; i < targetWord.length; i++) {
            html += `<input type="text" class="spilling-letter-input" data-index="${i}" data-qid="${qIdStr}" maxlength="1" style="width: 50px; height: 60px; text-align: center; font-size: 1.8rem; font-weight: 900; border: 3px solid var(--border-color); border-radius: 10px; background: rgba(255,255,255,0.1); color: var(--text-main); text-transform: uppercase; box-sizing: border-box; transition: all 0.2s;">`;
        }
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

        if (!q.spillingState) {
            q.spillingState = {
                savedAnswer: '',
                isSaved: false
            };
        }

        // 1. ربط زر الحذف
        const deleteBtn = document.querySelector(`.delete-q-btn[data-qid="${qIdStr}"]`);
        if (deleteBtn) deleteBtn.onclick = () => deleteQuestion(q.id);

        // 2. Event Delegation للأزرار (يعمل الآن على الحاوية الموحدة الجديدة)
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

        // 3. منطق التنقل الذكي بين مربعات الحروف
        const inputs = document.querySelectorAll(`.spilling-letter-input[data-qid="${qIdStr}"]`);
        inputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                input.value = input.value.toUpperCase().replace(/[^A-Z]/g, '');
                if (input.value.length === 1 && index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }
                q.spillingState.isSaved = false;
                this.resetSaveButton(qIdStr);
            });
            
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !input.value && index > 0) {
                    inputs[index - 1].focus();
                    inputs[index - 1].value = '';
                }
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.saveAnswer(qIdStr);
                }
            });

            input.addEventListener('focus', () => {
                input.style.background = 'rgba(255,255,255,0.15)';
                input.style.borderColor = 'var(--btn-primary)';
            });
            input.addEventListener('blur', () => {
                input.style.background = 'rgba(255,255,255,0.1)';
                input.style.borderColor = 'var(--border-color)';
            });
        });
        
        if (inputs.length > 0) {
            setTimeout(() => inputs[0].focus(), 100);
        }
    },

    // ============ زر الاستماع ============
    speakWord: function(qIdStr) {
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;

        const targetWord = (q.word || q["word "] || "").trim();
        if (!targetWord) return;

        const btn = document.querySelector(`[data-controls="${qIdStr}"] button[data-action="speak"]`);
        
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            if (btn) { btn.innerHTML = '🔊 استمع للكلمة'; btn.classList.remove('btn-warning'); btn.classList.add('btn-info'); }
            return;
        }

        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(targetWord);
            utterance.lang = 'en-US';
            utterance.rate = 0.8;

            if (btn) { 
                btn.innerHTML = '⏹️ إيقاف'; 
                btn.classList.remove('btn-info'); 
                btn.classList.add('btn-warning'); 
            }
            
            utterance.onend = utterance.onerror = () => {
                if (btn) { 
                    btn.innerHTML = '🔊 استمع للكلمة'; 
                    btn.classList.remove('btn-warning'); 
                    btn.classList.add('btn-info'); 
                }
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
                statusEl.textContent = '🎧 قل الكلمة بوضوح...';
                statusEl.style.color = '#eab308';
                statusEl.style.background = 'rgba(234, 179, 8, 0.1)';
            }
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.trim().toLowerCase();
            const cleanWord = transcript.replace(/[^a-z]/g, '');
            
            const inputs = document.querySelectorAll(`.spilling-letter-input[data-qid="${qIdStr}"]`);
            inputs.forEach((input, i) => {
                if (i < cleanWord.length) {
                    input.value = cleanWord[i].toUpperCase();
                } else {
                    input.value = '';
                }
            });

            if (statusEl) {
                statusEl.textContent = `✅ تم التقاط: "${cleanWord.toUpperCase()}"`;
                statusEl.style.color = '#4ade80';
                statusEl.style.background = 'rgba(74, 222, 128, 0.1)';
            }

            q.spillingState.isSaved = false;
            this.resetSaveButton(qIdStr);
        };

        recognition.onerror = (event) => {
            if (statusEl) {
                statusEl.textContent = '⚠️ لم أسمعك بوضوح، حاول مرة أخرى أو اكتب يدوياً.';
                statusEl.style.color = '#ef4444';
                statusEl.style.background = 'rgba(239, 68, 68, 0.1)';
            }
        };

        recognition.onend = () => {
            if (btn) {
                btn.classList.remove('listening', 'btn-danger');
                btn.classList.add('btn-secondary');
                btn.innerHTML = '🎤 تحدث للإجابة';
            }
            this._currentRecognition = null;
        };

        try { recognition.start(); } catch (e) { console.warn("STT Error:", e); }
    },

    // ============ زر حفظ الإجابة ============
    saveAnswer: function(qIdStr) {
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;

        const inputs = document.querySelectorAll(`.spilling-letter-input[data-qid="${qIdStr}"]`);
        let currentAnswer = '';
        inputs.forEach(input => currentAnswer += input.value.toUpperCase());

        if (!currentAnswer) {
            alert("الرجاء كتابة أو نطق الكلمة أولاً!");
            return;
        }

        q.spillingState.savedAnswer = currentAnswer;
        q.spillingState.isSaved = true;

        const btn = document.querySelector(`[data-controls="${qIdStr}"] button[data-action="save"]`);
        const statusEl = document.querySelector(`[data-stt-status="${qIdStr}"]`);
        
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

    // ============ حساب النتيجة ============
    calculateScore: function(questionId) {
        const qIdStr = String(questionId);
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return 0;

        const targetWord = (q.word || q["word "] || "").trim().toUpperCase();
        let userAnswer = q.spillingState.savedAnswer;
        
        if (!userAnswer) {
            const inputs = document.querySelectorAll(`.spilling-letter-input[data-qid="${qIdStr}"]`);
            inputs.forEach(input => userAnswer += input.value.toUpperCase());
        }

        return (userAnswer === targetWord) ? 1 : 0;
    },

    // ============ الحد الأقصى للدرجات ============
    getMaxScore: function(questionId) {
        return 1;
    }
};