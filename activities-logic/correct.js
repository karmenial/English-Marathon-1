window.activitiesLogic = window.activitiesLogic || {};

window.activitiesLogic.correct = {
    // ============ تحميل الأسئلة من قاعدة البيانات ============
   loadQuestions: async function(level, grade, curriculum, unit) {
    let questions = []; 
    
    // ✅ 1. المصدر الأساسي: سحب البيانات من ملف JSON (أونلاين)
    try {
        const response = await fetch('../marathonQuestionsDB.json?v=' + Date.now());
        if (response.ok) {
            const db = await response.json();
            if (db && db.activityDatabase && db.activityDatabase.correct) {
                const filtered = db.activityDatabase.correct.filter(q =>
                    q.level === level &&
                    q.grade === grade &&
                    q.curriculum === curriculum &&
                    (unit === '' || unit === undefined || q.unit === unit)
                );
                if (filtered.length > 0) {
                    console.log(`✅ correct: تم تحميل ${filtered.length} سؤال من ملف JSON`);
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
            if (db && db.activityDatabase && db.activityDatabase.correct) {
                const filtered = db.activityDatabase.correct.filter(q =>
                    q.level === level &&
                    q.grade === grade &&
                    q.curriculum === curriculum &&
                    (unit === '' || unit === undefined || q.unit === unit)
                );
                if (filtered.length > 0) {
                    console.log(`✅ correct: تم تحميل ${filtered.length} سؤال من localStorage (Fallback)`);
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
        html += `<p class="question-title-text"><b>${questionIndex + 1}.</b> Correct the error in the sentence:</p>`;
        
        // عرض الجملة مع تمييز الكلمة الخاطئة
        html += `<div class="correct-sentence-container" data-sentence="${qIdStr}" style="background: rgba(255,255,255,0.08); border: 3px solid var(--border-color); border-radius: 14px; padding: 20px; margin: 15px 0; font-size: 1.3rem; line-height: 1.8; font-weight: 700;">`;
        html += q.sentence.replace(q.errorWord, `<span class="error-word" style="background: #ef4444; color: white; padding: 4px 12px; border-radius: 8px; font-weight: 900;">${q.errorWord}</span>`);
        html += `</div>`;
        
        // حقل الإدخال وزر الميكروفون
        html += `<div style="display: flex; gap: 10px; margin: 15px 0; align-items: center;">`;
        html += `<input type="text" class="edit-input correct-answer-input" id="answerInput_${qIdStr}" placeholder="اكتب الكلمة الصحيحة هنا..." style="flex: 1; margin: 0 !important;">`;
        html += `</div>`;
        
        // ✅ أزرار التحكم (النمط الموحد)
        html += `<div class="correct-controls" data-controls="${qIdStr}" style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 15px;">`;
        html += `<button class="btn btn-info" data-action="speak" data-qid="${qIdStr}">🔊 استمع للجملة</button>`;
        html += `<button class="btn btn-primary" data-action="save" data-qid="${qIdStr}">💾 حفظ الإجابة</button>`;
        html += `<button class="btn btn-secondary" data-action="stt" data-qid="${qIdStr}">🎤 تحدث للإجابة</button>`;
        html += `</div>`;
        
        // مؤشر حالة الإدخال الصوتي
        html += `<div class="stt-status" data-stt-status="${qIdStr}" style="display:none; margin-top: 10px; padding: 10px; border-radius: 8px; font-weight: 700; text-align: center; transition: all 0.3s;"></div>`;
        
        // ✅ إخفاء الإجابة الصحيحة والأسباب (تظهر فقط للمعلم)
        html += `<div class="answer-feedback" style="display: none; margin-top: 15px;">`;
        html += `<div style="background: rgba(34, 197, 94, 0.1); padding: 12px; border-radius: 8px; margin-bottom: 10px;">`;
        html += `<b>✅ Correct Answer:</b> <span style="color: #22c55e; font-weight: 900;">${q.correctWord}</span>`;
        html += `</div>`;
        if (q.englishReason) {
            html += `<div style="background: rgba(96, 165, 250, 0.1); padding: 12px; border-radius: 8px; margin-bottom: 10px;">`;
            html += `<b>📖 English Reason:</b><br>${q.englishReason}`;
            html += `</div>`;
        }
        if (q.arabicReason) {
            html += `<div style="background: rgba(234, 179, 8, 0.1); padding: 12px; border-radius: 8px; direction: rtl; text-align: right;">`;
            html += `<b>📖 السبب بالعربية:</b><br>${q.arabicReason}`;
            html += `</div>`;
        }
        html += `</div>`;
        
        return html;
    },
    
    // ============ تهيئة التفاعلية ============
    init: function(questionId) {
        const qIdStr = String(questionId);
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;
        
        // تهيئة حالة السؤال
        if (!q.correctState) {
            q.correctState = {
                answer: '',
                isSaved: false,
                isCorrect: false
            };
        }
        
        // ربط زر الحذف
        const deleteBtn = document.querySelector(`.delete-q-btn[data-qid="${qIdStr}"]`);
        if (deleteBtn) {
            deleteBtn.onclick = () => deleteQuestion(q.id);
        }
        
        // ✅ ربط أزرار التحكم (Event Delegation)
        const controls = document.querySelector(`[data-controls="${qIdStr}"]`);
        if (controls) {
            controls.addEventListener('click', (e) => {
                const btn = e.target.closest('button[data-action]');
                if (!btn) return;
                const action = btn.dataset.action;
                const targetQid = btn.dataset.qid;
                
                if (action === 'speak') this.speakSentence(targetQid);
                else if (action === 'save') this.saveAnswer(targetQid);
                else if (action === 'stt') this.startVoiceRecognition(targetQid);
            });
        }
        
        // تتبع الكتابة اليدوية مؤقتاً
        const answerInput = document.getElementById(`answerInput_${qIdStr}`);
        if (answerInput) {
            answerInput.addEventListener('input', (e) => {
                if (q && q.correctState) {
                    q.correctState.answer = e.target.value;
                    q.correctState.isSaved = false; // إعادة تعيين حالة الحفظ عند التعديل
                    this.resetSaveButton(qIdStr);
                }
            });
        }
    },
    
    // ============ زر حفظ الإجابة ============
    saveAnswer: function(qIdStr) {
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;
        
        const answerInput = document.getElementById(`answerInput_${qIdStr}`);
        if (!answerInput || !q.correctState) return;
        
        q.correctState.answer = answerInput.value.trim();
        q.correctState.isSaved = true;
        
        const btn = document.querySelector(`[data-controls="${qIdStr}"] button[data-action="save"]`);
        if (btn) {
            btn.innerHTML = '✅ تم الحفظ';
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-success');
            setTimeout(() => {
                btn.innerHTML = '💾 حفظ الإجابة';
                btn.classList.remove('btn-success');
                btn.classList.add('btn-primary');
            }, 2000);
        }
        console.log(`✅ تم حفظ إجابة السؤال ${qIdStr}:`, q.correctState.answer);
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
        
        // إذا كان يتحدث حالياً، قم بإيقافه
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            if (btn) {
                btn.innerHTML = '🔊 استمع للجملة';
                btn.classList.remove('btn-warning');
                btn.classList.add('btn-info');
            }
            return;
        }
        
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(q.sentence);
            utterance.lang = 'en-US';
            utterance.rate = 0.9; // أبطأ قليلاً للوضوح
            utterance.pitch = 1;
            
            if (btn) {
                btn.innerHTML = '⏹️ إيقاف';
                btn.classList.remove('btn-info');
                btn.classList.add('btn-warning');
            }
            
            utterance.onend = utterance.onerror = () => {
                if (btn) {
                    btn.innerHTML = '🔊 استمع للجملة';
                    btn.classList.remove('btn-warning');
                    btn.classList.add('btn-info');
                }
            };
            
            window.speechSynthesis.speak(utterance);
        } else {
            alert("عذراً، متصفحك لا يدعم ميزة الاستماع.");
        }
    },
    
    // ============ النمط B: الإدخال الصوتي (Voice Typing) ============
    startVoiceRecognition: function(qIdStr) {
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;
        
        const btn = document.querySelector(`[data-controls="${qIdStr}"] button[data-action="stt"]`);
        const statusEl = document.querySelector(`[data-stt-status="${qIdStr}"]`);
        const answerInput = document.getElementById(`answerInput_${qIdStr}`);
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            if (btn) {
                btn.innerHTML = '⚠️ غير مدعوم';
                btn.disabled = true;
            }
            alert("متصفحك لا يدعم الإدخال الصوتي. استخدم Chrome أو Edge.");
            return;
        }
        
        // إذا كان يستمع، أوقفه
        if (btn && btn.classList.contains('listening')) {
            if (this._currentRecognition) {
                this._currentRecognition.stop();
                this._currentRecognition = null;
            }
            return;
        }
        
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
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
                statusEl.innerHTML = '🎧 قل الكلمة الصحيحة الآن...';
                statusEl.style.color = '#eab308';
                statusEl.style.background = 'rgba(234, 179, 8, 0.1)';
            }
            if (answerInput) answerInput.style.borderColor = '#ef4444';
        };
        
        recognition.onresult = (event) => {
            const spokenWord = event.results[0][0].transcript.trim();
            console.log(`🎤 الطالب قال: "${spokenWord}"`);
            
            if (answerInput) {
                answerInput.value = spokenWord;
                if (q.correctState) {
                    q.correctState.answer = spokenWord;
                    q.correctState.isSaved = false;
                    this.resetSaveButton(qIdStr);
                }
            }
            
            if (statusEl) {
                statusEl.innerHTML = `✅ تم التعرف على: "<b>${spokenWord}</b>"`;
                statusEl.style.color = '#4ade80';
                statusEl.style.background = 'rgba(74, 222, 128, 0.1)';
            }
        };
        
        recognition.onerror = (event) => {
            console.warn("Speech error:", event.error);
            if (statusEl) {
                let msg = '⚠️ ';
                if (event.error === 'no-speech') msg += 'لم أسمعك! حاول مرة أخرى بوضوح.';
                else if (event.error === 'not-allowed') msg += 'يجب السماح بالوصول للميكروفون.';
                else msg += 'حدث خطأ. حاول مرة أخرى أو اكتب يدوياً.';
                statusEl.innerHTML = msg;
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
            if (answerInput) answerInput.style.borderColor = '';
            this._currentRecognition = null;
        };
        
        try {
            recognition.start();
        } catch (e) {
            console.warn("Could not start recognition:", e);
        }
    },
    
    // ============ حساب النتيجة (سؤال واحد = درجة واحدة) ============
    calculateScore: function(questionId) {
        const qIdStr = String(questionId);
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return 0;
        
        const answerInput = document.getElementById(`answerInput_${qIdStr}`);
        const userAnswer = answerInput ? answerInput.value.trim().toLowerCase() : '';
        const correctAnswer = q.correctWord.trim().toLowerCase();
        
        if (userAnswer === correctAnswer && userAnswer !== '') {
            if (q.correctState) q.correctState.isCorrect = true;
            return 1;
        }
        
        if (q.correctState) q.correctState.isCorrect = false;
        return 0;
    },

    // ============ الحد الأقصى للدرجات ============
    getMaxScore: function(questionId) {
        return 1; // كل سؤال في هذا النشاط يساوي درجة واحدة
    }
};