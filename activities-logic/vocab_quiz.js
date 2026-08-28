window.activitiesLogic = window.activitiesLogic || {};

window.activitiesLogic.vocab_quiz = {
    // ============ تحميل الأسئلة ============
    loadQuestions: async function(level, grade, curriculum, unit) {
        let questions = [];
        try {
            const localData = localStorage.getItem('marathon_questions_db');
            if (localData) {
                const db = JSON.parse(localData);
                if (db && db.activityDatabase && db.activityDatabase.vocab_quiz) {
                    const filtered = db.activityDatabase.vocab_quiz.filter(q =>
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
                if (db && db.activityDatabase && db.activityDatabase.vocab_quiz) {
                    const filtered = db.activityDatabase.vocab_quiz.filter(q =>
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
        html += `<p class="question-title-text"><b>${questionIndex + 1}.</b> Choose the correct meaning:</p>`;
        
        html += `<div class="vocab-quiz-container" id="vocab_quiz_${qIdStr}" style="background: rgba(255,255,255,0.08); border: 3px solid var(--border-color); border-radius: 14px; padding: 20px; margin: 15px 0;">`;
        
        // عرض الكلمة
        html += `<div style="text-align: center; margin-bottom: 20px;">`;
        html += `<div style="font-size: 2.2rem; font-weight: 900; color: var(--btn-primary); margin-bottom: 10px;">${q.word}</div>`;
        html += `</div>`;
        
        // ✅ المنطق الديناميكي لتخطيط الخيارات (أفقي للكلمات القصيرة، عمودي للجمل)
        const isLongOptions = q.options.some(opt => {
            const wordCount = opt.trim().split(/\s+/).length;
            return wordCount > 2 || opt.length > 35;
        });

        const containerStyle = isLongOptions 
            ? 'display: flex; flex-direction: column; gap: 12px; width: 100%;' 
            : 'display: flex; flex-wrap: wrap; gap: 12px; width: 100%;';

        const buttonStyle = isLongOptions
            ? 'width: 100%; text-align: left; padding: 14px 20px;'
            : 'flex: 1; min-width: 120px; text-align: center; padding: 12px 16px;';

        html += `<div class="vocab-quiz-options" id="options_${qIdStr}" style="${containerStyle}">`;
        const shuffledOptions = [...q.options].sort(() => Math.random() - 0.5);
        shuffledOptions.forEach(opt => {
            const cleanOpt = opt.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
            html += `<button class="vocab-quiz-option-btn" data-option="${cleanOpt}" data-qid="${qIdStr}" 
                     style="background: rgba(255,255,255,0.08); border: 2px solid var(--border-color); border-radius: 10px; font-size: 1.1rem; font-weight: 700; cursor: pointer; transition: all 0.2s; color: var(--text-main); ${buttonStyle}">
                     ${opt}</button>`;
        });
        html += `</div>`;
        
        // ✅ أزرار التحكم الثلاثة (استمع، تحدث، حفظ) في صف واحد
        html += `<div class="vocab-quiz-controls" data-controls="${qIdStr}" style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 20px; margin-bottom: 15px;">`;
        html += `<button class="btn btn-info" data-action="speak" data-qid="${qIdStr}" style="flex: 1; min-width: 120px;">🔊 استمع</button>`;
        html += `<button class="btn btn-secondary" data-action="stt" data-qid="${qIdStr}" style="flex: 1; min-width: 120px;">🎤 تحدث</button>`;
        html += `<button class="btn btn-primary" data-action="save" data-qid="${qIdStr}" style="flex: 1; min-width: 120px;">💾 حفظ الإجابة</button>`;
        html += `</div>`;

        // مؤشر حالة الحفظ
        html += `<div class="save-status" data-save-status="${qIdStr}" style="display: none; text-align: center; font-weight: bold; color: var(--success); padding: 8px; border-radius: 8px; margin-bottom: 10px;"></div>`;

        // صندوق السبب (مخفي افتراضياً - يظهر فقط عند التصحيح النهائي)
        html += `<div id="feedback_${qIdStr}" class="answer-feedback" style="display: none; margin-top: 15px; padding: 15px; background: rgba(96, 165, 250, 0.1); border: 2px solid var(--btn-primary); border-radius: 12px;">`;
        html += `<div style="margin-bottom: 8px;"><b>✅ الإجابة الصحيحة:</b> <span style="color: var(--success); font-weight: 900;">${q.correctAnswer}</span></div>`;
        html += `<div><b>📖 السبب:</b> ${q.arabicReason || q.englishReason || 'No reason provided.'}</div>`;
        html += `</div>`;
        
        html += `</div>`;
        return html;
    },

    // ============ تهيئة التفاعلية ============
    init: function(questionId) {
        const qIdStr = String(questionId);
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;

        if (!q.vocabQuizState) {
            q.vocabQuizState = {
                selectedOption: null,
                isSaved: false
            };
        }

        // 1. ربط زر الحذف
        const deleteBtn = document.querySelector(`.delete-q-btn[data-qid="${qIdStr}"]`);
        if (deleteBtn) deleteBtn.onclick = () => deleteQuestion(q.id);

        // 2. Event Delegation للخيارات (الاختيار المحايد)
        const optionsContainer = document.getElementById(`options_${qIdStr}`);
        if (optionsContainer) {
            optionsContainer.addEventListener('click', (e) => {
                const btn = e.target.closest('.vocab-quiz-option-btn');
                if (!btn) return;

                const selectedOpt = btn.dataset.option;
                
                // حفظ الإجابة في الذاكرة
                q.vocabQuizState.selectedOption = selectedOpt;
                q.vocabQuizState.isSaved = false; // إعادة تعيين الحفظ عند التغيير
                this.resetSaveButton(qIdStr);

                // إزالة التحديد من باقي الأزرار
                Array.from(optionsContainer.children).forEach(child => {
                    child.classList.remove('student-selected');
                    child.style.background = 'rgba(255,255,255,0.08)';
                    child.style.borderColor = 'var(--border-color)';
                    child.style.color = 'var(--text-main)';
                });
                
                // تلوين الزر المختار بالأزرق الفاتح (محايد)
                btn.classList.add('student-selected');
                btn.style.background = 'rgba(96, 165, 250, 0.2)';
                btn.style.borderColor = 'var(--btn-primary)';
                btn.style.color = 'var(--text-main)';
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

                if (action === 'speak') this.speakWord(targetQid);
                else if (action === 'stt') this.startVoiceRecognition(targetQid);
                else if (action === 'save') this.saveAnswer(targetQid);
            });
        }
    },

    // ============ دالة الحفظ المؤقت (تأكيد بصري للطالب) ============
    saveAnswer: function(qIdStr) {
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;

        if (!q.vocabQuizState.selectedOption) {
            alert("الرجاء اختيار إجابة أولاً!");
            return;
        }

        q.vocabQuizState.savedOption = q.vocabQuizState.selectedOption;
        q.vocabQuizState.isSaved = true;

        const btn = document.querySelector(`[data-controls="${qIdStr}"] button[data-action="save"]`);
        const statusEl = document.querySelector(`[data-save-status="${qIdStr}"]`);
        
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
            statusEl.textContent = '💾 تم حفظ إجابتك مؤقتاً. يمكنك تغييرها قبل إنهاء الامتحان.';
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

    // ============ زر الاستماع (TTS) ============
    speakWord: function(qIdStr) {
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;

        const btn = document.querySelector(`[data-controls="${qIdStr}"] button[data-action="speak"]`);
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            if (btn) { btn.innerHTML = '🔊 استمع'; btn.classList.remove('btn-warning'); btn.classList.add('btn-info'); }
            return;
        }

        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(q.word);
            utterance.lang = 'en-US';
            utterance.rate = 0.9;

            if (btn) { btn.innerHTML = '⏹️ إيقاف'; btn.classList.remove('btn-info'); btn.classList.add('btn-warning'); }
            utterance.onend = utterance.onerror = () => {
                if (btn) { btn.innerHTML = '🔊 استمع'; btn.classList.remove('btn-warning'); btn.classList.add('btn-info'); }
            };
            window.speechSynthesis.speak(utterance);
        }
    },

    // ============ زر الإدخال الصوتي (STT) ============
    startVoiceRecognition: function(qIdStr) {
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;

        const btn = document.querySelector(`[data-controls="${qIdStr}"] button[data-action="stt"]`);
        const statusEl = document.querySelector(`[data-save-status="${qIdStr}"]`);
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
                statusEl.textContent = '🎧 قل الإجابة بوضوح...';
                statusEl.style.color = '#eab308';
                statusEl.style.background = 'rgba(234, 179, 8, 0.1)';
            }
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.trim().toLowerCase();
            const optionButtons = document.querySelectorAll(`#options_${qIdStr} .vocab-quiz-option-btn`);
            
            let matched = false;
            optionButtons.forEach(button => {
                const optText = button.dataset.option.toLowerCase().trim();
                if (optText === transcript || transcript.includes(optText)) {
                    button.click(); // محاكاة النقر لتفعيل منطق الاختيار المحايد
                    matched = true;
                }
            });

            if (statusEl) {
                if (matched) {
                    statusEl.textContent = `✅ تم اختيار: "${transcript}"`;
                    statusEl.style.color = '#4ade80';
                    statusEl.style.background = 'rgba(74, 222, 128, 0.1)';
                } else {
                    statusEl.textContent = `⚠️ لم أتعرف على أي خيار. قلت: "${transcript}"`;
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
                btn.innerHTML = '🎤 تحدث';
            }
            this._currentRecognition = null;
        };

        try { recognition.start(); } catch (e) { console.warn("STT Error:", e); }
    },

    // ============ دالة التقييم النهائي (تُستدعى فقط عند الضغط على Finish من قبل المعلم) ============
    evaluate: function(qIdStr) {
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return 0;

        const userAnswer = (q.vocabQuizState.savedOption || q.vocabQuizState.selectedOption || '').trim().toLowerCase();
        const correctAnswer = (q.correctAnswer || '').trim().toLowerCase();
        const isCorrect = (userAnswer === correctAnswer && userAnswer !== '');

        // تلوين الأزرار بناءً على النتيجة (للمعلم فقط)
        const btns = document.querySelectorAll(`#options_${qIdStr} .vocab-quiz-option-btn`);
        btns.forEach(btn => {
            const optText = btn.dataset.option.toLowerCase().trim();
            if (optText === correctAnswer) {
                btn.style.background = 'var(--success)'; // الأخضر للإجابة الصحيحة دائماً
                btn.style.borderColor = '#15803d';
                btn.style.color = 'white';
            }
            if (optText === userAnswer && !isCorrect) {
                btn.style.background = 'var(--danger)'; // الأحمر لإجابة الطالب الخاطئة
                btn.style.borderColor = '#dc2626';
                btn.style.color = 'white';
            }
            btn.style.cursor = 'default';
        });

        // إظهار صندوق السبب والإجابة الصحيحة
        const feedback = document.getElementById(`feedback_${qIdStr}`);
        if (feedback) feedback.style.display = 'block';

        return isCorrect ? 1 : 0;
    },

    // ============ حساب النتيجة (متوافق مع app.js) ============
    calculateScore: function(questionId) {
        return this.evaluate(String(questionId));
    },

    // ============ الحد الأقصى للدرجات ============
    getMaxScore: function(questionId) {
        return 1;
    }
};