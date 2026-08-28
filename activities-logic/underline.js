window.activitiesLogic = window.activitiesLogic || {};

window.activitiesLogic.Underline = {
    // ============ تحميل الأسئلة ============
    loadQuestions: async function(level, grade, curriculum, unit) {
        let questions = [];
        try {
            const localData = localStorage.getItem('marathon_questions_db');
            if (localData) {
                const db = JSON.parse(localData);
                if (db && db.activityDatabase && db.activityDatabase.Underline) {
                    const filtered = db.activityDatabase.Underline.filter(q =>
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
                if (db && db.activityDatabase && db.activityDatabase.Underline) {
                    const filtered = db.activityDatabase.Underline.filter(q =>
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
        html += `<p class="question-title-text"><b>${questionIndex + 1}.</b> ${q.instruction || 'Underline the required words:'}</p>`;
        
        html += `<div class="underline-container" id="underline_${qIdStr}" style="background: rgba(255,255,255,0.08); border: 3px solid var(--border-color); border-radius: 14px; padding: 20px; margin: 15px 0;">`;
        
        // عرض الجملة مع الكلمات القابلة للنقر
        html += `<div class="underline-sentence" id="sentence_${qIdStr}" style="background: rgba(255,255,255,0.1); border: 2px solid var(--btn-primary); border-radius: 12px; padding: 20px; margin: 15px 0; font-size: 1.4rem; font-weight: 700; line-height: 2.2; text-align: center; user-select: none;">`;
        
        const words = q.sentence.split(' ');
        words.forEach((word, index) => {
            const cleanWord = word.replace(/[.,!?;:'"]/g, '');
            html += `<span class="underline-word" data-word="${cleanWord}" data-original="${word}" data-index="${index}" style="display: inline-block; padding: 4px 8px; margin: 2px; border-radius: 6px; cursor: pointer; transition: all 0.2s;">${word}</span> `;
        });
        
        html += `</div>`;
        
        // ✅ الأزرار الثلاثة القياسية
        html += `<div class="underline-controls" data-controls="${qIdStr}" style="display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-top: 15px;">`;
        html += `<button class="btn btn-info" data-action="speak" data-qid="${qIdStr}">🔊 استمع للجملة</button>`;
        html += `<button class="btn btn-secondary" data-action="stt" data-qid="${qIdStr}">🎤 تحدث لتحديد الكلمات</button>`;
        html += `<button class="btn btn-primary" data-action="save" data-qid="${qIdStr}">💾 حفظ التحديد</button>`;
        html += `</div>`;
        
        // مؤشر حالة الحفظ
        html += `<div class="save-status" data-save-status="${qIdStr}" style="display: none; text-align: center; margin: 15px 0; font-weight: 700; padding: 8px; border-radius: 8px;"></div>`;
        
        // ⛔ تم إزالة successMsg و feedback تماماً لضمان عدم كشف الإجابة
        
        html += `</div>`;
        return html;
    },

    // ============ تهيئة التفاعلية ============
    init: function(questionId) {
        const qIdStr = String(questionId);
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;

        if (!q.underlineState) {
            q.underlineState = {
                selectedWords: [],
                isSaved: false
            };
        }

        // 1. ربط زر الحذف
        const deleteBtn = document.querySelector(`.delete-q-btn[data-qid="${qIdStr}"]`);
        if (deleteBtn) deleteBtn.onclick = () => deleteQuestion(q.id);

        // 2. Event Delegation للنقر على الكلمات (تحديد / إلغاء تحديد)
        const sentenceContainer = document.getElementById(`sentence_${qIdStr}`);
        if (sentenceContainer) {
            sentenceContainer.addEventListener('click', (e) => {
                const wordEl = e.target.closest('.underline-word');
                if (!wordEl) return;

                const word = wordEl.dataset.word;
                
                if (wordEl.classList.contains('selected')) {
                    // إلغاء التحديد
                    wordEl.classList.remove('selected');
                    wordEl.style.background = '';
                    wordEl.style.color = '';
                    wordEl.style.textDecoration = '';
                    wordEl.style.fontWeight = '700';
                    
                    const idx = q.underlineState.selectedWords.indexOf(word);
                    if (idx > -1) q.underlineState.selectedWords.splice(idx, 1);
                } else {
                    // التحديد (لون أزرق فاتح محايد دائماً)
                    wordEl.classList.add('selected');
                    wordEl.style.background = 'rgba(96, 165, 250, 0.3)'; // أزرق فاتح
                    wordEl.style.color = 'var(--btn-primary)';
                    wordEl.style.textDecoration = 'underline';
                    wordEl.style.fontWeight = '900';
                    
                    if (!q.underlineState.selectedWords.includes(word)) {
                        q.underlineState.selectedWords.push(word);
                    }
                }
                
                // أي تغيير يلغي حالة الحفظ
                q.underlineState.isSaved = false;
                this.resetSaveButton(qIdStr);
            });
        }

        // 3. Event Delegation للأزرار
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

    // ============ زر الإدخال الصوتي لتحديد الكلمات (STT) ============
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
                btn.innerHTML = '🔴 قل الكلمات...';
                btn.classList.remove('btn-secondary');
                btn.classList.add('btn-danger');
            }
            if (statusEl) {
                statusEl.style.display = 'block';
                statusEl.textContent = '🎧 قل الكلمات التي تريد تحديدها...';
                statusEl.style.color = '#eab308';
                statusEl.style.background = 'rgba(234, 179, 8, 0.1)';
            }
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.trim().toLowerCase();
            const spokenWords = transcript.split(/\s+/);
            
            const wordElements = document.querySelectorAll(`#sentence_${qIdStr} .underline-word`);
            let matchedCount = 0;

            wordElements.forEach(wordEl => {
                const cleanWord = wordEl.dataset.word.toLowerCase();
                if (spokenWords.includes(cleanWord)) {
                    if (!wordEl.classList.contains('selected')) {
                        // محاكاة النقر للتحديد
                        wordEl.classList.add('selected');
                        wordEl.style.background = 'rgba(96, 165, 250, 0.3)';
                        wordEl.style.color = 'var(--btn-primary)';
                        wordEl.style.textDecoration = 'underline';
                        wordEl.style.fontWeight = '900';
                        
                        if (!q.underlineState.selectedWords.includes(cleanWord)) {
                            q.underlineState.selectedWords.push(cleanWord);
                        }
                        matchedCount++;
                    }
                }
            });

            if (statusEl) {
                if (matchedCount > 0) {
                    statusEl.textContent = `✅ تم تحديد ${matchedCount} كلمات.`;
                    statusEl.style.color = '#4ade80';
                    statusEl.style.background = 'rgba(74, 222, 128, 0.1)';
                } else {
                    statusEl.textContent = '⚠️ لم أتعرف على أي كلمة من الجملة.';
                    statusEl.style.color = '#ef4444';
                    statusEl.style.background = 'rgba(239, 68, 68, 0.1)';
                }
            }
            
            q.underlineState.isSaved = false;
            this.resetSaveButton(qIdStr);
        };

        recognition.onerror = (event) => {
            console.warn("Speech error:", event.error);
            if (statusEl) {
                statusEl.textContent = '⚠️ خطأ في التعرف على الصوت.';
                statusEl.style.color = '#ef4444';
                statusEl.style.background = 'rgba(239, 68, 68, 0.1)';
            }
        };

        recognition.onend = () => {
            if (btn) {
                btn.classList.remove('listening', 'btn-danger');
                btn.classList.add('btn-secondary');
                btn.innerHTML = '🎤 تحدث لتحديد الكلمات';
            }
            this._currentRecognition = null;
        };

        try { recognition.start(); } catch (e) { console.warn("STT Error:", e); }
    },

    // ============ زر حفظ التحديد (بدون قفل أو كشف) ============
    saveAnswer: function(qIdStr) {
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;

        if (q.underlineState.selectedWords.length === 0) {
            alert("الرجاء تحديد كلمة واحدة على الأقل!");
            return;
        }

        // حفظ نسخة من التحديد الحالي
        q.underlineState.savedWords = [...q.underlineState.selectedWords];
        q.underlineState.isSaved = true;

        const btn = document.querySelector(`[data-controls="${qIdStr}"] button[data-action="save"]`);
        const statusEl = document.querySelector(`[data-save-status="${qIdStr}"]`);
        
        if (btn) {
            btn.innerHTML = '✅ تم الحفظ';
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-success');
            setTimeout(() => {
                btn.innerHTML = '💾 حفظ التحديد';
                btn.classList.remove('btn-success');
                btn.classList.add('btn-primary');
            }, 1500);
        }

        if (statusEl) {
            statusEl.textContent = '💾 تم حفظ تحديدك. يمكنك التعديل والحفظ مجدداً قبل إنهاء الامتحان.';
            statusEl.style.display = 'block';
            statusEl.style.color = 'var(--success)';
            statusEl.style.background = 'rgba(34, 197, 94, 0.1)';
            setTimeout(() => { statusEl.style.display = 'none'; }, 3000);
        }
    },

    resetSaveButton: function(qIdStr) {
        const btn = document.querySelector(`[data-controls="${qIdStr}"] button[data-action="save"]`);
        if (btn) {
            btn.innerHTML = '💾 حفظ التحديد';
            btn.classList.remove('btn-success');
            btn.classList.add('btn-primary');
        }
    },

    // ============ حساب النتيجة (كل كلمة صحيحة = درجة واحدة) ============
    calculateScore: function(questionId) {
        const qIdStr = String(questionId);
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q || !q.underlineState) return 0;

        // نأخذ الكلمات المحفوظة، أو المحددة حالياً إذا لم يتم الحفظ
        const userSelected = (q.underlineState.savedWords && q.underlineState.savedWords.length > 0) 
            ? q.underlineState.savedWords 
            : q.underlineState.selectedWords;

        // تنظيف الكلمات للمقارنة (إزالة علامات الترقيم وتوحيد الحالة)
        const cleanCorrect = q.correctWords.map(w => w.toLowerCase().replace(/[.,!?;:'"]/g, ''));
        const cleanUser = userSelected.map(w => w.toLowerCase().replace(/[.,!?;:'"]/g, ''));

        let score = 0;
        // حساب عدد الكلمات الصحيحة التي نجح الطالب في تحديدها
        cleanCorrect.forEach(correctWord => {
            if (cleanUser.includes(correctWord)) {
                score++;
            }
        });

        return score;
    },

    // ============ الحد الأقصى للدرجات ============
    getMaxScore: function(questionId) {
        const qIdStr = String(questionId);
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q || !q.correctWords) return 0;
        return q.correctWords.length; // كل كلمة صحيحة في القاعدة = درجة واحدة
    }
};