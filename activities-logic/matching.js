window.activitiesLogic = window.activitiesLogic || {};

window.activitiesLogic.matching = {
    // ============ تحميل الأسئلة من قاعدة البيانات ============
   loadQuestions: async function(level, grade, curriculum, unit) {
    let questions = []; 
    
    // ✅ 1. المصدر الأساسي: سحب البيانات من ملف JSON (أونلاين)
    try {
        const response = await fetch('../marathonQuestionsDB.json?v=' + Date.now());
        if (response.ok) {
            const db = await response.json();
            if (db && db.activityDatabase && db.activityDatabase.matching) {
                const filtered = db.activityDatabase.matching.filter(q =>
                    q.level === level &&
                    q.grade === grade &&
                    q.curriculum === curriculum &&
                    (unit === '' || unit === undefined || q.unit === unit)
                );
                if (filtered.length > 0) {
                    console.log(`✅ matching: تم تحميل ${filtered.length} سؤال من ملف JSON`);
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
            if (db && db.activityDatabase && db.activityDatabase.matching) {
                const filtered = db.activityDatabase.matching.filter(q =>
                    q.level === level &&
                    q.grade === grade &&
                    q.curriculum === curriculum &&
                    (unit === '' || unit === undefined || q.unit === unit)
                );
                if (filtered.length > 0) {
                    console.log(`✅ matching: تم تحميل ${filtered.length} سؤال من localStorage (Fallback)`);
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
        html += `<p class="question-title-text"><b>${questionIndex + 1}.</b> Match the words with their definitions:</p>`;
        
        html += `<div class="matching-container" id="matching_${qIdStr}" style="background: rgba(255,255,255,0.08); border: 3px solid var(--border-color); border-radius: 14px; padding: 20px; margin: 15px 0;">`;
        html += `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">`;
        
        // العمود الأيسر: التعريفات (مع زر ميكروفون لكل تعريف)
        html += `<div class="matching-definitions" id="definitions_${qIdStr}" style="display: flex; flex-direction: column; gap: 12px;">`;
        html += `<h4 style="margin: 0 0 10px 0; color: var(--btn-primary); font-weight: 900;">📖 Definitions</h4>`;
        q.pairs.forEach((pair, index) => {
            html += `<div class="match-slot" data-idx="${index}" data-correct="${pair.word}" style="background: rgba(255,255,255,0.1); border: 2px dashed var(--border-color); border-radius: 10px; padding: 12px; min-height: 50px; display: flex; flex-direction: column; gap: 8px; transition: all 0.3s;">`;
            
            // الصف العلوي: زر الميكروفون + نص التعريف
            html += `<div style="display: flex; align-items: center; gap: 10px;">`;
            html += `<button class="match-mic-btn" data-action="stt-slot" data-idx="${index}" data-qid="${qIdStr}" style="background: var(--btn-secondary); color: white; border: none; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.2s;">🎤</button>`;
            html += `<span class="def-text" style="font-weight: 700; font-size: 1.05rem; flex: 1;">${pair.definition}</span>`;
            html += `</div>`;
            
            // مكان ظهور الكلمة المطابقة
            html += `<span class="matched-word-display" style="display: none; background: var(--success); color: white; padding: 6px 12px; border-radius: 6px; font-weight: 900; text-align: center; cursor: pointer; align-self: flex-start; font-size: 1.1rem;"></span>`;
            html += `</div>`;
        });
        html += `</div>`;
        
        // العمود الأيمن: بنك الكلمات
        html += `<div class="matching-words-bank" id="wordsBank_${qIdStr}" style="display: flex; flex-direction: column; gap: 10px;">`;
        html += `<h4 style="margin: 0 0 10px 0; color: var(--success); font-weight: 900;">🔤 Words</h4>`;
        const shuffledPairs = [...q.pairs].sort(() => Math.random() - 0.5);
        shuffledPairs.forEach(pair => {
            html += `<div class="match-word" draggable="true" data-word="${pair.word}" style="background: var(--kids-yellow); color: #854d0e; padding: 10px 16px; border-radius: 10px; font-weight: 900; font-size: 1.1rem; border: 3px dashed #ca8a04; cursor: grab; text-align: center; transition: all 0.2s;">${pair.word}</div>`;
        });
        html += `</div>`;
        
        html += `</div>`; // نهاية الـ Grid
        
        // ✅ الأزرار الثلاثة القياسية
        html += `<div class="matching-controls" data-controls="${qIdStr}" style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px;">`;
        html += `<button class="btn btn-info" data-action="speak" data-qid="${qIdStr}">🔊 استمع للتعريفات</button>`;
        html += `<button class="btn btn-primary" data-action="save" data-qid="${qIdStr}">💾 حفظ الإجابة</button>`;
        html += `</div>`;
        
        // مؤشر حالة الحفظ
        html += `<div class="save-status" data-save-status="${qIdStr}" style="display: none; margin-top: 10px; text-align: center; font-weight: bold; color: var(--success);"></div>`;
        
        html += `</div>`; // نهاية الحاوية الرئيسية
        return html;
    },

    // ============ تهيئة التفاعلية ============
    init: function(questionId) {
        const qIdStr = String(questionId);
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;

        if (!q.matchingState) {
            q.matchingState = {
                matches: {},
                isSaved: false
            };
        }

        // 1. ربط زر الحذف
        const deleteBtn = document.querySelector(`.delete-q-btn[data-qid="${qIdStr}"]`);
        if (deleteBtn) deleteBtn.onclick = () => deleteQuestion(q.id);

        // 2. أحداث السحب والإفلات والكلمات
        const wordItems = document.querySelectorAll(`#wordsBank_${qIdStr} .match-word`);
        const slots = document.querySelectorAll(`#definitions_${qIdStr} .match-slot`);

        wordItems.forEach(wordEl => {
            wordEl.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', wordEl.dataset.word);
                wordEl.style.opacity = '0.5';
            });
            wordEl.addEventListener('dragend', () => { wordEl.style.opacity = '1'; });
            wordEl.addEventListener('click', () => {
                document.querySelectorAll(`#wordsBank_${qIdStr} .match-word`).forEach(w => w.style.borderColor = '#ca8a04');
                wordEl.style.borderColor = '#ef4444';
                wordEl.dataset.selected = 'true';
            });
        });

        slots.forEach(slot => {
            slot.addEventListener('dragover', (e) => {
                e.preventDefault();
                slot.style.backgroundColor = 'rgba(74, 222, 128, 0.2)';
            });
            slot.addEventListener('dragleave', () => {
                slot.style.backgroundColor = 'rgba(255,255,255,0.1)';
            });
            slot.addEventListener('drop', (e) => {
                e.preventDefault();
                slot.style.backgroundColor = 'rgba(255,255,255,0.1)';
                const word = e.dataTransfer.getData('text/plain');
                this.placeWordInSlot(qIdStr, slot, word);
            });
            slot.addEventListener('click', (e) => {
                // منع التفعيل إذا كان النقر على زر الميكروفون أو الكلمة المضافة
                if (e.target.closest('.match-mic-btn') || e.target.classList.contains('matched-word-display')) return;
                
                const selectedWord = document.querySelector(`#wordsBank_${qIdStr} .match-word[data-selected="true"]`);
                if (selectedWord) {
                    this.placeWordInSlot(qIdStr, slot, selectedWord.dataset.word);
                    selectedWord.dataset.selected = 'false';
                    selectedWord.style.borderColor = '#ca8a04';
                }
            });
        });

        // 3. Event Delegation للأزرار (بما في ذلك أزرار الميكروفون الفردية)
        const controls = document.querySelector(`[data-controls="${qIdStr}"]`);
        if (controls) {
            controls.addEventListener('click', (e) => {
                const btn = e.target.closest('button[data-action]');
                if (!btn) return;
                const action = btn.dataset.action;
                const targetQid = btn.dataset.qid;

                if (action === 'speak') this.speakDefinitions(targetQid);
                else if (action === 'save') this.saveAnswer(targetQid);
                else if (action === 'stt-slot') {
                    const idx = btn.dataset.idx;
                    this.startSlotVoiceRecognition(targetQid, idx, btn);
                }
            });
        }

        // 4. السماح بإزالة الكلمة من الفراغ عند النقر عليها
        document.querySelectorAll(`#definitions_${qIdStr} .matched-word-display`).forEach(display => {
            display.addEventListener('click', (e) => {
                e.stopPropagation();
                const slot = display.parentElement;
                const word = display.dataset.word;
                this.returnWordToBank(qIdStr, slot, word);
            });
        });
    },

    // ============ دوال مساعدة للمطابقة ============
    placeWordInSlot: function(qIdStr, slot, word) {
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;

        const idx = slot.dataset.idx;
        const display = slot.querySelector('.matched-word-display');
        
        if (display.style.display === 'inline-block' || display.style.display === 'block') {
            const oldWord = display.dataset.word;
            this.returnWordToBank(qIdStr, slot, oldWord, true);
        }

        const wordEl = document.querySelector(`#wordsBank_${qIdStr} .match-word[data-word="${word}"]`);
        if (wordEl) wordEl.style.display = 'none';

        display.textContent = word;
        display.dataset.word = word;
        display.style.display = 'block';
        slot.style.borderColor = 'var(--btn-primary)';
        slot.style.borderStyle = 'solid';

        q.matchingState.matches[idx] = word;
        q.matchingState.isSaved = false;
        this.resetSaveButton(qIdStr);
    },

    returnWordToBank: function(qIdStr, slot, word, silent = false) {
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;

        const idx = slot.dataset.idx;
        const display = slot.querySelector('.matched-word-display');
        
        const wordEl = document.querySelector(`#wordsBank_${qIdStr} .match-word[data-word="${word}"]`);
        if (wordEl) wordEl.style.display = 'block';

        display.textContent = '';
        delete display.dataset.word;
        display.style.display = 'none';
        slot.style.borderColor = 'var(--border-color)';
        slot.style.borderStyle = 'dashed';

        delete q.matchingState.matches[idx];
        if (!silent) {
            q.matchingState.isSaved = false;
            this.resetSaveButton(qIdStr);
        }
    },

    // ============ زر حفظ الإجابة ============
    saveAnswer: function(qIdStr) {
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;

        const slots = document.querySelectorAll(`#definitions_${qIdStr} .match-slot`);
        slots.forEach(slot => {
            const idx = slot.dataset.idx;
            const display = slot.querySelector('.matched-word-display');
            if (display.style.display === 'block' && display.dataset.word) {
                q.matchingState.matches[idx] = display.dataset.word;
            } else {
                delete q.matchingState.matches[idx];
            }
        });

        q.matchingState.isSaved = true;

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
            statusEl.textContent = '💾 تم حفظ مطابقاتك. يمكنك التعديل والحفظ مجدداً.';
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

    // ============ ✅ زر الاستماع المحسّن (يقرأ التعريفات فقط) ============
    speakDefinitions: function(qIdStr) {
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;

        const btn = document.querySelector(`[data-controls="${qIdStr}"] button[data-action="speak"]`);
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            if (btn) { btn.innerHTML = '🔊 استمع للتعريفات'; btn.classList.remove('btn-warning'); btn.classList.add('btn-info'); }
            return;
        }

        // ✅ جمع جميع التعريفات فقط (بدون كلمات "Definition 1:")
        let fullText = "";
        q.pairs.forEach((pair, index) => {
            fullText += pair.definition + ". ";
        });

        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(fullText);
            
            // ✅ تحديد اللغة تلقائياً بناءً على محتوى النص
            const hasArabic = /[\u0600-\u06FF]/.test(fullText);
            utterance.lang = hasArabic ? 'ar-SA' : 'en-US';
            utterance.rate = 0.85;

            if (btn) { btn.innerHTML = '⏹️ إيقاف'; btn.classList.remove('btn-info'); btn.classList.add('btn-warning'); }
            utterance.onend = utterance.onerror = () => {
                if (btn) { btn.innerHTML = '🔊 استمع للتعريفات'; btn.classList.remove('btn-warning'); btn.classList.add('btn-info'); }
            };
            window.speechSynthesis.speak(utterance);
        }
    },

    // ============ ✅ الإدخال الصوتي المخصص لكل تعريف (Per-Slot STT) ============
    startSlotVoiceRecognition: function(qIdStr, slotIdx, micBtn) {
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            micBtn.innerHTML = '⚠️';
            micBtn.title = "غير مدعوم";
            return;
        }

        // إذا كان هذا الزر يستمع بالفعل، أوقفه
        if (micBtn.classList.contains('listening')) {
            if (this._currentRecognition) {
                this._currentRecognition.stop();
                this._currentRecognition = null;
            }
            micBtn.classList.remove('listening');
            micBtn.style.background = 'var(--btn-secondary)';
            micBtn.innerHTML = '🎤';
            return;
        }

        // إيقاف أي استماع آخر قيد التشغيل
        if (this._currentRecognition) {
            this._currentRecognition.stop();
            document.querySelectorAll(`[data-action="stt-slot"].listening`).forEach(btn => {
                btn.classList.remove('listening');
                btn.style.background = 'var(--btn-secondary)';
                btn.innerHTML = '🎤';
            });
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        this._currentRecognition = recognition;

        recognition.onstart = () => {
            micBtn.classList.add('listening');
            micBtn.style.background = '#ef4444';
            micBtn.innerHTML = '🔴';
        };

        recognition.onresult = (event) => {
            const spokenWord = event.results[0][0].transcript.trim().toLowerCase();
            
            // البحث عن الكلمة المنطوقة في بنك الكلمات المتاح
            const availableWords = document.querySelectorAll(`#wordsBank_${qIdStr} .match-word`);
            let matchedWordText = null;

            availableWords.forEach(wordEl => {
                if (wordEl.style.display !== 'none') {
                    const targetWord = wordEl.dataset.word.trim().toLowerCase();
                    // مطابقة مرنة: تتطابق تماماً أو إذا كانت الكلمة المنطوقة تحتوي على الكلمة المستهدفة
                    if (targetWord === spokenWord || spokenWord.includes(targetWord)) {
                        matchedWordText = wordEl.dataset.word;
                    }
                }
            });

            if (matchedWordText) {
                // وضع الكلمة في الفراغ المحدد
                const targetSlot = document.querySelector(`#definitions_${qIdStr} .match-slot[data-idx="${slotIdx}"]`);
                if (targetSlot) {
                    this.placeWordInSlot(qIdStr, targetSlot, matchedWordText);
                }
            } else {
                // ومضة سريعة على الزر للإشارة إلى عدم العثور على الكلمة
                micBtn.style.background = '#f59e0b';
                setTimeout(() => { micBtn.style.background = 'var(--btn-secondary)'; }, 500);
            }
        };

        recognition.onend = () => {
            micBtn.classList.remove('listening');
            micBtn.style.background = 'var(--btn-secondary)';
            micBtn.innerHTML = '🎤';
            this._currentRecognition = null;
        };

        recognition.onerror = () => {
            micBtn.classList.remove('listening');
            micBtn.style.background = 'var(--btn-secondary)';
            micBtn.innerHTML = '🎤';
            this._currentRecognition = null;
        };

        try { recognition.start(); } catch (e) { console.warn("STT Error:", e); }
    },

    // ============ حساب النتيجة ============
    calculateScore: function(questionId) {
        const qIdStr = String(questionId);
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q || !q.matchingState) return 0;

        let correctCount = 0;
        q.pairs.forEach((pair, index) => {
            const userWord = q.matchingState.matches[index];
            if (userWord && userWord.trim().toLowerCase() === pair.word.trim().toLowerCase()) {
                correctCount++;
            }
        });

        return correctCount;
    },

    // ============ الحد الأقصى للدرجات ============
    getMaxScore: function(questionId) {
        const qIdStr = String(questionId);
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q || !q.pairs) return 0;
        return q.pairs.length;
    }
};