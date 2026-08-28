window.activitiesLogic = window.activitiesLogic || {};

window.activitiesLogic.re_arrange = {
    // ============ تحميل الأسئلة ============
    loadQuestions: async function(level, grade, curriculum, unit) {
        let questions = [];
        try {
            const localData = localStorage.getItem('marathon_questions_db');
            if (localData) {
                const db = JSON.parse(localData);
                if (db && db.activityDatabase && db.activityDatabase.re_arrange) {
                    const filtered = db.activityDatabase.re_arrange.filter(q =>
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
                if (db && db.activityDatabase && db.activityDatabase.re_arrange) {
                    const filtered = db.activityDatabase.re_arrange.filter(q =>
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
        html += `<p class="question-title-text"><b>${questionIndex + 1}.</b> Arrange the words to form a correct sentence:</p>`;
        
        html += `<div class="rearrange-container" id="rearrange_${qIdStr}" style="background: rgba(255,255,255,0.08); border: 3px solid var(--border-color); border-radius: 14px; padding: 20px; margin: 15px 0;">`;
        
        // منطقة الهدف (الإجابة)
        html += `<div class="rearrange-target" id="target_${qIdStr}" style="min-height: 60px; background: rgba(34, 197, 94, 0.1); border: 3px dashed #22c55e; border-radius: 12px; padding: 15px; margin-bottom: 15px; display: flex; flex-wrap: wrap; gap: 10px; align-items: center; transition: all 0.3s;"></div>`;
        
        // بنك الكلمات
        html += `<div class="rearrange-bank" id="bank_${qIdStr}" style="min-height: 60px; background: rgba(96, 165, 250, 0.1); border: 3px dashed var(--btn-primary); border-radius: 12px; padding: 15px; display: flex; flex-wrap: wrap; gap: 10px; align-items: center; transition: all 0.3s;"></div>`;
        
        // ✅ الأزرار الثلاثة القياسية فقط
        html += `<div class="rearrange-controls" data-controls="${qIdStr}" style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 15px;">`;
        html += `<button class="btn btn-info" data-action="speak" data-qid="${qIdStr}">🔊 استمع</button>`;
        html += `<button class="btn btn-secondary" data-action="stt" data-qid="${qIdStr}">🎤 تحدث للترتيب</button>`;
        html += `<button class="btn btn-primary" data-action="save" data-qid="${qIdStr}">💾 حفظ الإجابة</button>`;
        html += `</div>`;
        
        // مؤشر حالة الحفظ / الصوت
        html += `<div class="stt-status" data-stt-status="${qIdStr}" style="display: none; margin-top: 10px; text-align: center; font-weight: bold; padding: 8px; border-radius: 8px;"></div>`;
        
        html += `</div>`; // نهاية الحاوية
        return html;
    },

    // ============ تهيئة التفاعلية ============
    init: function(questionId) {
        const qIdStr = String(questionId);
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;

        if (!q.rearrangeState) {
            q.rearrangeState = {
                savedWords: [],
                isSaved: false
            };
        }

        // 1. ربط زر الحذف
        const deleteBtn = document.querySelector(`.delete-q-btn[data-qid="${qIdStr}"]`);
        if (deleteBtn) deleteBtn.onclick = () => deleteQuestion(q.id);

        // 2. تقسيم الجملة إلى كلمات وخلطها
        const words = q.sentence.trim().split(/\s+/);
        const shuffledWords = [...words].sort(() => Math.random() - 0.5);
        
        const bank = document.getElementById(`bank_${qIdStr}`);
        const target = document.getElementById(`target_${qIdStr}`);
        bank.innerHTML = '';
        target.innerHTML = '';

        // 3. إنشاء عناصر الكلمات
        shuffledWords.forEach((word, index) => {
            const wordEl = document.createElement('div');
            wordEl.className = 'rearrange-word';
            wordEl.textContent = word;
            wordEl.draggable = true;
            wordEl.dataset.word = word;
            wordEl.dataset.origIndex = index;
            wordEl.style.cssText = `
                background: var(--kids-yellow);
                color: #854d0e;
                padding: 8px 16px;
                border-radius: 10px;
                font-weight: 900;
                font-size: 1.1rem;
                border: 3px dashed #ca8a04;
                cursor: grab;
                user-select: none;
                transition: all 0.2s;
            `;

            // أحداث السحب
            wordEl.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', word);
                wordEl.style.opacity = '0.5';
            });
            wordEl.addEventListener('dragend', () => {
                wordEl.style.opacity = '1';
            });

            // حدث النقر (للنقل السريع بين البنك والهدف)
            wordEl.addEventListener('click', () => {
                if (wordEl.parentElement === bank) {
                    target.appendChild(wordEl);
                } else {
                    bank.appendChild(wordEl);
                }
                // إعادة تعيين حالة الحفظ عند أي تعديل
                q.rearrangeState.isSaved = false;
                this.resetSaveButton(qIdStr);
            });

            bank.appendChild(wordEl);
        });

        // 4. أحداث الإفلات (Drop)
        [target, bank].forEach(zone => {
            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
                zone.style.backgroundColor = zone.id === `target_${qIdStr}` ? 'rgba(34, 197, 94, 0.2)' : 'rgba(96, 165, 250, 0.2)';
            });
            zone.addEventListener('dragleave', () => {
                zone.style.backgroundColor = zone.id === `target_${qIdStr}` ? 'rgba(34, 197, 94, 0.1)' : 'rgba(96, 165, 250, 0.1)';
            });
            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                zone.style.backgroundColor = zone.id === `target_${qIdStr}` ? 'rgba(34, 197, 94, 0.1)' : 'rgba(96, 165, 250, 0.1)';
                const word = e.dataTransfer.getData('text/plain');
                const wordEl = document.querySelector(`.rearrange-word[data-word="${word}"]`);
                if (wordEl) {
                    zone.appendChild(wordEl);
                    q.rearrangeState.isSaved = false;
                    this.resetSaveButton(qIdStr);
                }
            });
        });

        // 5. Event Delegation للأزرار الثلاثة
        const controls = document.querySelector(`[data-controls="${qIdStr}"]`);
        if (controls) {
            controls.addEventListener('click', (e) => {
                const btn = e.target.closest('button[data-action]');
                if (!btn) return;
                const action = btn.dataset.action;
                const targetQid = btn.dataset.qid;

                if (action === 'speak') this.speakSentence(targetQid);
                else if (action === 'stt') this.startVoiceArrange(targetQid);
                else if (action === 'save') this.saveAnswer(targetQid);
            });
        }
    },

    // ============ زر حفظ الإجابة (بدون قفل أو كشف) ============
    saveAnswer: function(qIdStr) {
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;

        const target = document.getElementById(`target_${qIdStr}`);
        const words = Array.from(target.querySelectorAll('.rearrange-word')).map(el => el.textContent);
        
        q.rearrangeState.savedWords = words;
        q.rearrangeState.isSaved = true;

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
            statusEl.textContent = '💾 تم حفظ ترتيبك. يمكنك التعديل والحفظ مجدداً قبل إنهاء الامتحان.';
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

    // ============ زر الاستماع المحسّن (TTS) ============
    speakSentence: function(qIdStr) {
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
            const utterance = new SpeechSynthesisUtterance(q.sentence);
            utterance.lang = 'en-US';
            utterance.rate = 0.9;

            if (btn) { btn.innerHTML = '⏹️ إيقاف'; btn.classList.remove('btn-info'); btn.classList.add('btn-warning'); }
            utterance.onend = utterance.onerror = () => {
                if (btn) { btn.innerHTML = '🔊 استمع'; btn.classList.remove('btn-warning'); btn.classList.add('btn-info'); }
            };
            window.speechSynthesis.speak(utterance);
        }
    },

    // ============ ✅ النمط A: الإدخال الصوتي الذكي للترتيب ============
    startVoiceArrange: function(qIdStr) {
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
                btn.innerHTML = '🔴 قل الجملة...';
                btn.classList.remove('btn-secondary');
                btn.classList.add('btn-danger');
            }
            if (statusEl) {
                statusEl.style.display = 'block';
                statusEl.textContent = '🎧 اقرأ الجملة بصوت واضح...';
                statusEl.style.color = '#eab308';
                statusEl.style.background = 'rgba(234, 179, 8, 0.1)';
            }
        };

        recognition.onresult = (event) => {
            const spokenText = event.results[0][0].transcript.trim().toLowerCase();
            console.log(`🎤 الطالب قال: "${spokenText}"`);

            const spokenWords = spokenText.split(/\s+/);
            const bank = document.getElementById(`bank_${qIdStr}`);
            const target = document.getElementById(`target_${qIdStr}`);
            
            let matchedCount = 0;

            // محاولة مطابقة الكلمات المنطوقة مع الكلمات المتاحة في البنك وترتيبها
            spokenWords.forEach(spokenWord => {
                // البحث عن الكلمة في البنك (تجاهل علامات الترقيم للمطابقة المرنة)
                const cleanSpoken = spokenWord.replace(/[^\w\s]/gi, '').toLowerCase();
                const wordEl = Array.from(bank.querySelectorAll('.rearrange-word')).find(el => 
                    el.dataset.word.replace(/[^\w\s]/gi, '').toLowerCase() === cleanSpoken
                );

                if (wordEl) {
                    target.appendChild(wordEl);
                    matchedCount++;
                }
            });

            if (matchedCount > 0) {
                if (statusEl) {
                    statusEl.textContent = `✅ تم التقاط ${matchedCount} كلمات وترتيبها. راجع الترتيب!`;
                    statusEl.style.color = '#4ade80';
                    statusEl.style.background = 'rgba(74, 222, 128, 0.1)';
                }
                q.rearrangeState.isSaved = false;
                this.resetSaveButton(qIdStr);
            } else {
                if (statusEl) {
                    statusEl.textContent = '⚠️ لم أتطابق مع الكلمات. حاول ترتيبها يدوياً أو تحدث بوضوح.';
                    statusEl.style.color = '#ef4444';
                    statusEl.style.background = 'rgba(239, 68, 68, 0.1)';
                }
            }
        };

        recognition.onend = () => {
            if (btn) {
                btn.classList.remove('listening', 'btn-danger');
                btn.classList.add('btn-secondary');
                btn.innerHTML = '🎤 تحدث للترتيب';
            }
            this._currentRecognition = null;
        };

        recognition.onerror = (event) => {
            console.warn("Speech error:", event.error);
            if (statusEl) {
                statusEl.textContent = '⚠️ خطأ في التعرف على الصوت. حاول مرة أخرى.';
                statusEl.style.color = '#ef4444';
                statusEl.style.background = 'rgba(239, 68, 68, 0.1)';
            }
            if (btn) {
                btn.classList.remove('listening', 'btn-danger');
                btn.classList.add('btn-secondary');
                btn.innerHTML = '🎤 تحدث للترتيب';
            }
            this._currentRecognition = null;
        };

        try { recognition.start(); } catch (e) { console.warn("STT Error:", e); }
    },

    // ============ حساب النتيجة (يُستدعى عند إنهاء الامتحان) ============
    calculateScore: function(questionId) {
        const qIdStr = String(questionId);
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q || !q.rearrangeState) return 0;

        // نأخذ الكلمات من حالة الحفظ، أو من الـ DOM إذا لم يتم الحفظ
        let userWords = q.rearrangeState.savedWords;
        if (!userWords || userWords.length === 0) {
            const target = document.getElementById(`target_${qIdStr}`);
            if (target) {
                userWords = Array.from(target.querySelectorAll('.rearrange-word')).map(el => el.textContent);
            }
        }

        const userSentence = userWords.join(' ').trim().toLowerCase();
        const correctSentence = q.sentence.trim().toLowerCase();

        return (userSentence === correctSentence) ? 1 : 0;
    },

    // ============ الحد الأقصى للدرجات ============
    getMaxScore: function(questionId) {
        return 1; // كل سؤال ترتيب = درجة واحدة
    }
};