window.activitiesLogic = window.activitiesLogic || {};

window.activitiesLogic.grammer = {
    // ============ تحميل الأسئلة من قاعدة البيانات ============
   loadQuestions: async function(level, grade, curriculum, unit) {
    let questions = []; 
    
    // ✅ 1. المصدر الأساسي: سحب البيانات من ملف JSON (أونلاين)
    try {
        const response = await fetch('../marathonQuestionsDB.json?v=' + Date.now());
        if (response.ok) {
            const db = await response.json();
            if (db && db.activityDatabase && db.activityDatabase.grammer) {
                const filtered = db.activityDatabase.grammer.filter(q =>
                    q.level === level &&
                    q.grade === grade &&
                    q.curriculum === curriculum &&
                    (unit === '' || unit === undefined || q.unit === unit)
                );
                if (filtered.length > 0) {
                    console.log(`✅ grammer: تم تحميل ${filtered.length} سؤال من ملف JSON`);
                    return filtered;
                }
            }
        }
    } catch (error) {
        console.warn("️ فشل جلب ملف JSON، جاري التحقق من الذاكرة المحلية...", error);
    }

    // 🛡️ 2. المصدر البديل: الذاكرة المحلية (أوفلاين فقط عند الضرورة)
    try {
        const localData = localStorage.getItem('marathon_questions_db');
        if (localData) {
            const db = JSON.parse(localData);
            if (db && db.activityDatabase && db.activityDatabase.grammer) {
                const filtered = db.activityDatabase.grammer.filter(q =>
                    q.level === level &&
                    q.grade === grade &&
                    q.curriculum === curriculum &&
                    (unit === '' || unit === undefined || q.unit === unit)
                );
                if (filtered.length > 0) {
                    console.log(`✅ grammer: تم تحميل ${filtered.length} سؤال من localStorage (Fallback)`);
                    return filtered;
                }
            }
        }
    } catch (e) {
        console.warn("️ خطأ في localStorage: ", e);
    }
    
    return [];
},

    // ============ عرض السؤال ============
    render: function(question, questionIndex) {
        const q = question;
        const qIdStr = String(q.id);
        let html = '';
        
        html += `<button class="delete-q-btn" data-action="delete" data-qid="${qIdStr}">🗑️</button>`;
        html += `<p class="question-title-text"><b>${questionIndex + 1}.</b> Choose the correct answer:</p>`;
        
        const questionWithBlank = q.question.replace(/\.{3,}/g, 
            `<span class="grammar-blank" id="blank_${qIdStr}" style="display: inline-block; min-width: 80px; border-bottom: 3px dashed var(--border-color); padding: 4px 12px; margin: 0 8px; text-align: center; font-weight: 900; color: var(--text-muted);">___</span>`
        );
        html += `<div class="grammar-question-text" id="question_${qIdStr}" style="font-size: 1.2rem; line-height: 1.8; margin-bottom: 15px;">${questionWithBlank}</div>`;
        
        // المنطق الذكي: هل الخيارات جمل طويلة أم كلمات قصيرة؟
        const avgLength = q.options.reduce((sum, opt) => sum + opt.length, 0) / q.options.length;
        const isLongOptions = avgLength > 35;
        const layoutStyle = isLongOptions 
            ? 'display: flex; flex-direction: column; gap: 12px; width: 100%;' 
            : 'display: flex; flex-wrap: wrap; gap: 12px; width: 100%;';

        html += `<div class="grammar-options-grid" id="options_${qIdStr}" style="${layoutStyle}">`;
        const shuffledOptions = [...q.options].sort(() => Math.random() - 0.5);
        
        shuffledOptions.forEach(opt => {
            const cleanOpt = opt.replace(/[^a-zA-Z0-9]/g, '_');
            const optId = `opt_${qIdStr}_${cleanOpt}`;
            const btnStyle = isLongOptions 
                ? 'width: 100%; text-align: left; padding: 14px 20px;' 
                : 'flex: 1; min-width: 120px; text-align: center; padding: 12px 16px;';
            
            html += `<button class="grammar-option-btn" id="${optId}" data-option="${opt}" data-qid="${qIdStr}" style="background: rgba(255,255,255,0.08); border: 2px solid var(--border-color); border-radius: 12px; font-size: 1.1rem; font-weight: 700; cursor: pointer; transition: all 0.2s; ${btnStyle}">${opt}</button>`;
        });
        html += `</div>`;
        
        // ✅ الأزرار الثلاثة القياسية فقط (لا يوجد غيرها)
        html += `<div class="grammar-controls" data-controls="${qIdStr}" style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px;">`;
        html += `<button class="btn btn-info" data-action="speak" data-qid="${qIdStr}">🔊 استمع</button>`;
        html += `<button class="btn btn-secondary" data-action="stt" data-qid="${qIdStr}">🎤 تحدث</button>`;
        html += `<button class="btn btn-primary" data-action="save" data-qid="${qIdStr}">💾 حفظ</button>`;
        html += `</div>`;
        
        // مؤشر حالة الحفظ (مخفي افتراضياً)
        html += `<div class="save-status" data-save-status="${qIdStr}" style="display: none; margin-top: 10px; text-align: center; font-weight: bold; color: var(--success);"></div>`;
        
        return html;
    },

    // ============ تهيئة التفاعلية ============
    init: function(questionId) {
        const qIdStr = String(questionId);
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;

        if (!q.grammerState) {
            q.grammerState = {
                selectedOption: null,
                selectedOptionText: '',
                isSaved: false
            };
        }

        const deleteBtn = document.querySelector(`.delete-q-btn[data-qid="${qIdStr}"]`);
        if (deleteBtn) deleteBtn.onclick = () => deleteQuestion(q.id);

        // Event Delegation للخيارات (يسمح بالتغيير في أي وقت قبل "إنهاء الامتحان")
        const optionsGrid = document.getElementById(`options_${qIdStr}`);
        if (optionsGrid) {
            optionsGrid.addEventListener('click', (e) => {
                const optBtn = e.target.closest('.grammar-option-btn');
                if (!optBtn) return;

                const optionText = optBtn.dataset.option;
                const optId = optBtn.id;
                this.selectOption(qIdStr, optionText, optId);
            });
        }

        // Event Delegation للأزرار الثلاثة
        const controls = document.querySelector(`[data-controls="${qIdStr}"]`);
        if (controls) {
            controls.addEventListener('click', (e) => {
                const btn = e.target.closest('button[data-action]');
                if (!btn) return;
                const action = btn.dataset.action;
                const targetQid = btn.dataset.qid;

                if (action === 'speak') this.speakQuestion(targetQid);
                else if (action === 'stt') this.startVoiceInput(targetQid);
                else if (action === 'save') this.saveAnswer(targetQid);
            });
        }
    },

    // ============ اختيار خيار (تحديث الحالة بدون قفل) ============
    selectOption: function(qIdStr, optionText, optId) {
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;

        // إزالة التحديد السابق
        const prevOptId = q.grammerState.selectedOption;
        if (prevOptId) {
            const prevBtn = document.getElementById(prevOptId);
            if (prevBtn) {
                prevBtn.style.background = 'rgba(255,255,255,0.08)';
                prevBtn.style.borderColor = 'var(--border-color)';
                prevBtn.style.color = 'var(--text-main)';
                prevBtn.style.transform = 'scale(1)';
                prevBtn.style.opacity = '1';
            }
        }

        // تطبيق تحديد محايد جديد (أزرق فاتح) ليعرف الطالب ما اختاره فقط
        const selectedBtn = document.getElementById(optId);
        if (selectedBtn) {
            selectedBtn.style.background = 'rgba(96, 165, 250, 0.2)';
            selectedBtn.style.borderColor = 'var(--btn-primary)';
            selectedBtn.style.color = 'var(--text-main)';
            selectedBtn.style.transform = 'scale(0.97)';
        }

        // تحديث الفراغ بشكل محايد
        const blankSpace = document.getElementById(`blank_${qIdStr}`);
        if (blankSpace) {
            blankSpace.textContent = optionText;
            blankSpace.style.color = 'var(--btn-primary)';
            blankSpace.style.borderBottomColor = 'var(--btn-primary)';
            blankSpace.style.borderBottomStyle = 'dashed';
        }

        q.grammerState.selectedOption = optId;
        q.grammerState.selectedOptionText = optionText;
        q.grammerState.isSaved = false; // إعادة التعيين لأن الطالب غيّر الإجابة
        
        // إخفاء مؤشر الحفظ السابق
        const statusEl = document.querySelector(`[data-save-status="${qIdStr}"]`);
        if (statusEl) statusEl.style.display = 'none';
    },

    // ============ زر حفظ الإجابة (يحفظ فقط، بدون قفل) ============
    saveAnswer: function(qIdStr) {
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q || !q.grammerState || !q.grammerState.selectedOptionText) {
            alert("الرجاء اختيار إجابة أولاً!");
            return;
        }

        // 1. حفظ الحالة في الكائن (وهذا ما سيُحفظ لاحقاً في JSON أو LocalStorage عند إعادة التحميل)
        q.grammerState.isSaved = true;
        q.grammerState.finalAnswer = q.grammerState.selectedOptionText;

        // 2. تغذية راجعة بصرية مؤقتة على الزر فقط (بدون تغيير ألوان الخيارات)
        const saveBtn = document.querySelector(`[data-controls="${qIdStr}"] button[data-action="save"]`);
        const statusEl = document.querySelector(`[data-save-status="${qIdStr}"]`);
        
        if (saveBtn) {
            const originalText = saveBtn.innerHTML;
            saveBtn.innerHTML = '✅ تم الحفظ';
            saveBtn.classList.remove('btn-primary');
            saveBtn.classList.add('btn-success');

            setTimeout(() => {
                saveBtn.innerHTML = originalText;
                saveBtn.classList.remove('btn-success');
                saveBtn.classList.add('btn-primary');
            }, 1500);
        }

        if (statusEl) {
            statusEl.textContent = '💾 تم حفظ إجابتك مؤقتاً. يمكنك تغييرها قبل إنهاء الامتحان.';
            statusEl.style.display = 'block';
            setTimeout(() => { statusEl.style.display = 'none'; }, 3000);
        }

        // ⛔ ملاحظة هامة: لا يوجد هنا أي كود يقوم بـ disabled أو تغيير الألوان للأخضر/الأحمر.
        // الطالب حر تماماً في النقر على خيار آخر والضغط على حفظ مجدداً.
    },

    // ============ زر الإدخال الصوتي (يحاكي اختيار الخيار) ============
    startVoiceInput: function(qIdStr) {
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;

        const btn = document.querySelector(`[data-controls="${qIdStr}"] button[data-action="stt"]`);
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            if (btn) btn.innerHTML = '⚠️ غير مدعوم';
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
        };

        recognition.onresult = (event) => {
            const spokenWord = event.results[0][0].transcript.trim().toLowerCase();
            
            // البحث عن الخيار المطابق للكلمة المنطوقة
            const matchedBtn = Array.from(document.querySelectorAll(`#options_${qIdStr} .grammar-option-btn`))
                .find(b => b.dataset.option.trim().toLowerCase() === spokenWord);

            if (matchedBtn) {
                matchedBtn.click(); // محاكاة النقر على الخيار
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

    // ============ زر الاستماع المحسّن (TTS) ============
    speakQuestion: function(qIdStr) {
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;

        const btn = document.querySelector(`[data-controls="${qIdStr}"] button[data-action="speak"]`);
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            if (btn) { btn.innerHTML = '🔊 استمع'; btn.classList.remove('btn-warning'); btn.classList.add('btn-info'); }
            return;
        }

        const cleanQuestion = q.question.replace(/\.{3,}/g, " blank ");
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(cleanQuestion);
            utterance.lang = 'en-US';
            utterance.rate = 0.9;

            if (btn) { btn.innerHTML = '⏹️ إيقاف'; btn.classList.remove('btn-info'); btn.classList.add('btn-warning'); }
            utterance.onend = utterance.onerror = () => {
                if (btn) { btn.innerHTML = '🔊 استمع'; btn.classList.remove('btn-warning'); btn.classList.add('btn-info'); }
            };
            window.speechSynthesis.speak(utterance);
        }
    },

    // ============ حساب النتيجة (يُستدعى فقط عند "إنهاء الامتحان" من app.js) ============
    calculateScore: function(questionId) {
        const qIdStr = String(questionId);
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q || !q.grammerState || !q.grammerState.finalAnswer) return 0;
        
        const userAnswer = q.grammerState.finalAnswer.trim().toLowerCase();
        const correctAnswer = q.correctAnswer.trim().toLowerCase();
        
        return (userAnswer === correctAnswer) ? 1 : 0;
    },

    // ============ الحد الأقصى للدرجات ============
    getMaxScore: function(questionId) {
        return 1;
    }
};