window.activitiesLogic = window.activitiesLogic || {};

window.activitiesLogic.sequence = {
    // ============ تحميل الأسئلة ============
    loadQuestions: async function(level, grade, curriculum, unit) {
        let questions = [];
        try {
            const localData = localStorage.getItem('marathon_questions_db');
            if (localData) {
                const db = JSON.parse(localData);
                if (db && db.activityDatabase && db.activityDatabase.sequence) {
                    const filtered = db.activityDatabase.sequence.filter(q =>
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
                if (db && db.activityDatabase && db.activityDatabase.sequence) {
                    const filtered = db.activityDatabase.sequence.filter(q =>
                        q.level === level && q.grade === grade && q.curriculum === curriculum &&
                        (unit === '' || unit === undefined || q.unit === unit)
                    );
                    if (filtered.length > 0) return filtered;
                }
            }
        } catch (error) { console.warn("⚠️ خطأ في JSON:", error); }
        return [];
    },

    // بعثرة المصفوفة
    shuffleArray: function(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    },

    // ============ عرض السؤال ============
    render: function(question, questionIndex) {
        const q = question;
        const qIdStr = String(q.id);
        let html = '';
        
        html += `<button class="delete-q-btn" data-action="delete" data-qid="${qIdStr}">🗑️</button>`;
        html += `<p class="question-title-text"><b>${questionIndex + 1}.</b> Listen and arrange the events in the correct order:</p>`;
        
        html += `<div class="sequence-container" id="sequence_${qIdStr}" style="background: rgba(255,255,255,0.08); border: 3px solid var(--border-color); border-radius: 14px; padding: 20px; margin: 15px 0;">`;
        
        // منطقة الخيارات القابلة للسحب
        html += `<div class="sequence-options" id="options_${qIdStr}" style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 15px;">`;
        
        const shuffledOptions = this.shuffleArray(q.options);
        
        shuffledOptions.forEach((option, position) => {
            const originalIndex = q.options.indexOf(option);
            html += `<div class="option-container" draggable="true" data-idx="${originalIndex}" style="background: rgba(255,255,255,0.1); border: 2px solid var(--border-color); border-radius: 10px; padding: 12px; display: flex; align-items: center; gap: 12px; cursor: grab; transition: all 0.2s;">`;
            html += `<span class="option-number" style="background: var(--btn-primary); color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 0.9rem; flex-shrink: 0;">${position + 1}</span>`;
            html += `<span class="option-text" style="flex: 1; color: var(--text-main); font-size: 1.1rem; font-weight: 700; text-align: left; font-family: inherit;">${option}</span>`;
            html += `<span style="font-size: 1.2rem; cursor: grab; color: var(--text-muted);">⋮⋮</span>`;
            html += `</div>`;
        });
        
        html += `</div>`;
        
        // ✅ الأزرار الثلاثة القياسية المكيفة لهذا النشاط
        html += `<div class="sequence-controls" data-controls="${qIdStr}" style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 15px;">`;
        html += `<button class="btn btn-info" data-action="speak-story" data-qid="${qIdStr}">🔊 استمع للقصة</button>`;
        html += `<button class="btn btn-secondary" data-action="speak-order" data-qid="${qIdStr}">🎤 استمع لترتيبي</button>`;
        html += `<button class="btn btn-primary" data-action="save" data-qid="${qIdStr}">💾 حفظ الترتيب</button>`;
        html += `</div>`;
        
        // مؤشر حالة الحفظ
        html += `<div class="save-status" data-save-status="${qIdStr}" style="display: none; text-align: center; font-weight: bold; color: var(--success); padding: 8px; border-radius: 8px;"></div>`;
        
        // ⛔ تم إزالة successMsg و feedback تماماً للحفاظ على نزاهة الامتحان
        
        html += `</div>`;
        return html;
    },

    // ============ تهيئة التفاعلية (السحب والإفلات + اللمس) ============
    init: function(questionId) {
        const qIdStr = String(questionId);
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;

        if (!q.sequenceState) {
            q.sequenceState = {
                savedOrder: [],
                isSaved: false
            };
        }

        // 1. ربط زر الحذف
        const deleteBtn = document.querySelector(`.delete-q-btn[data-qid="${qIdStr}"]`);
        if (deleteBtn) deleteBtn.onclick = () => deleteQuestion(q.id);

        // 2. Event Delegation لأزرار التحكم
        const controls = document.querySelector(`[data-controls="${qIdStr}"]`);
        if (controls) {
            controls.addEventListener('click', (e) => {
                const btn = e.target.closest('button[data-action]');
                if (!btn) return;
                const action = btn.dataset.action;
                const targetQid = btn.dataset.qid;

                if (action === 'speak-story') this.speakStory(targetQid);
                else if (action === 'speak-order') this.speakCurrentOrder(targetQid);
                else if (action === 'save') this.saveOrder(targetQid);
            });
        }

        // 3. إعداد السحب والإفلات (Drag & Drop) واللمس (Touch)
        const containers = document.querySelectorAll(`#options_${qIdStr} .option-container`);
        let draggedItem = null;

        containers.forEach(container => {
            // أحداث الكمبيوتر (Drag & Drop)
            container.addEventListener('dragstart', function(e) {
                draggedItem = this;
                setTimeout(() => this.style.opacity = '0.5', 0);
            });
            
            container.addEventListener('dragend', function() {
                this.style.opacity = '1';
                draggedItem = null;
                // أي تغيير في الترتيب يلغي حالة الحفظ
                q.sequenceState.isSaved = false;
                this.resetSaveButton && window.activitiesLogic.sequence.resetSaveButton(qIdStr);
            }.bind(this)); // bind لضمان عمل resetSaveButton
            
            container.addEventListener('dragover', function(e) { e.preventDefault(); });
            
            container.addEventListener('dragenter', function(e) {
                e.preventDefault();
                this.style.boxShadow = '0 0 20px var(--btn-primary)';
            });
            
            container.addEventListener('dragleave', function() {
                this.style.boxShadow = 'none';
            });
            
            container.addEventListener('drop', function() {
                this.style.boxShadow = 'none';
                if (draggedItem !== this) {
                    const parent = this.parentNode;
                    const allItems = [...parent.querySelectorAll('.option-container')];
                    const fromIndex = allItems.indexOf(draggedItem);
                    const toIndex = allItems.indexOf(this);
                    if (fromIndex < toIndex) {
                        parent.insertBefore(draggedItem, this.nextSibling);
                    } else {
                        parent.insertBefore(draggedItem, this);
                    }
                    window.activitiesLogic.sequence.updateNumbers(qIdStr);
                    q.sequenceState.isSaved = false;
                    window.activitiesLogic.sequence.resetSaveButton(qIdStr);
                }
            });

            // أحداث اللمس (Touch) للأجهزة المحمولة
            container.addEventListener('touchstart', function(e) {
                draggedItem = this;
                this.style.opacity = '0.5';
            }, {passive: true});
            
            container.addEventListener('touchmove', function(e) {
                if (!draggedItem) return;
                const touch = e.touches[0];
                const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
                if (dropTarget) {
                    const overContainer = dropTarget.classList.contains('option-container') ? dropTarget : dropTarget.closest('.option-container');
                    if (overContainer && overContainer !== draggedItem) {
                        const parent = overContainer.parentNode;
                        const allItems = [...parent.querySelectorAll('.option-container')];
                        const fromIndex = allItems.indexOf(draggedItem);
                        const toIndex = allItems.indexOf(overContainer);
                        if (fromIndex < toIndex) {
                            parent.insertBefore(draggedItem, overContainer.nextSibling);
                        } else {
                            parent.insertBefore(draggedItem, overContainer);
                        }
                        window.activitiesLogic.sequence.updateNumbers(qIdStr);
                        q.sequenceState.isSaved = false;
                        window.activitiesLogic.sequence.resetSaveButton(qIdStr);
                    }
                }
            }, {passive: false});
            
            container.addEventListener('touchend', function() {
                if (draggedItem) {
                    draggedItem.style.opacity = '1';
                    draggedItem = null;
                }
            }, {passive: true});
        });
    },

    // تحديث الأرقام بعد السحب
    updateNumbers: function(qIdStr) {
        const containers = document.querySelectorAll(`#options_${qIdStr} .option-container`);
        containers.forEach((container, index) => {
            const numberSpan = container.querySelector('.option-number');
            if (numberSpan) {
                numberSpan.textContent = index + 1;
            }
        });
    },

    // الحصول على الترتيب الحالي من الـ DOM
    getCurrentOrder: function(qIdStr) {
        const containers = document.querySelectorAll(`#options_${qIdStr} .option-container`);
        return Array.from(containers).map(el => parseInt(el.dataset.idx));
    },

    // ============ زر الاستماع للقصة الأصلية (TTS) ============
    speakStory: function(qIdStr) {
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;

        const btn = document.querySelector(`[data-controls="${qIdStr}"] button[data-action="speak-story"]`);
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            if (btn) { btn.innerHTML = '🔊 استمع للقصة'; btn.classList.remove('btn-warning'); btn.classList.add('btn-info'); }
            return;
        }

        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(q.question);
            utterance.lang = 'en-US';
            utterance.rate = 0.9;

            if (btn) { btn.innerHTML = '⏹️ إيقاف'; btn.classList.remove('btn-info'); btn.classList.add('btn-warning'); }
            utterance.onend = utterance.onerror = () => {
                if (btn) { btn.innerHTML = '🔊 استمع للقصة'; btn.classList.remove('btn-warning'); btn.classList.add('btn-info'); }
            };
            window.speechSynthesis.speak(utterance);
        }
    },

    // ============ زر الاستماع للترتيب الحالي (ميزة مساعدة للطالب) ============
    speakCurrentOrder: function(qIdStr) {
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;

        const currentOrderIndices = this.getCurrentOrder(qIdStr);
        const orderedSentences = currentOrderIndices.map(idx => q.options[idx]);
        const textToSpeak = orderedSentences.join(". ");

        const btn = document.querySelector(`[data-controls="${qIdStr}"] button[data-action="speak-order"]`);
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            if (btn) { btn.innerHTML = '🎤 استمع لترتيبي'; btn.classList.remove('btn-warning'); btn.classList.add('btn-secondary'); }
            return;
        }

        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            utterance.lang = 'en-US';
            utterance.rate = 0.9;

            if (btn) { btn.innerHTML = '⏹️ إيقاف'; btn.classList.remove('btn-secondary'); btn.classList.add('btn-warning'); }
            utterance.onend = utterance.onerror = () => {
                if (btn) { btn.innerHTML = '🎤 استمع لترتيبي'; btn.classList.remove('btn-warning'); btn.classList.add('btn-secondary'); }
            };
            window.speechSynthesis.speak(utterance);
        }
    },

    // ============ زر حفظ الترتيب (بدون كشف أو قفل) ============
    saveOrder: function(qIdStr) {
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;

        // قراءة الترتيب الحالي من الشاشة وحفظه
        q.sequenceState.savedOrder = this.getCurrentOrder(qIdStr);
        q.sequenceState.isSaved = true;

        const btn = document.querySelector(`[data-controls="${qIdStr}"] button[data-action="save"]`);
        const statusEl = document.querySelector(`[data-save-status="${qIdStr}"]`);
        
        if (btn) {
            btn.innerHTML = '✅ تم الحفظ';
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-success');
            setTimeout(() => {
                btn.innerHTML = '💾 حفظ الترتيب';
                btn.classList.remove('btn-success');
                btn.classList.add('btn-primary');
            }, 1500);
        }

        if (statusEl) {
            statusEl.textContent = '💾 تم حفظ الترتيب. يمكنك التعديل والحفظ مجدداً قبل إنهاء الامتحان.';
            statusEl.style.display = 'block';
            setTimeout(() => { statusEl.style.display = 'none'; }, 3000);
        }
    },

    resetSaveButton: function(qIdStr) {
        const btn = document.querySelector(`[data-controls="${qIdStr}"] button[data-action="save"]`);
        if (btn) {
            btn.innerHTML = '💾 حفظ الترتيب';
            btn.classList.remove('btn-success');
            btn.classList.add('btn-primary');
        }
    },

    // ============ حساب النتيجة (يُستدعى عند إنهاء الامتحان فقط) ============
    calculateScore: function(questionId) {
        const qIdStr = String(questionId);
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q || !q.sequenceState) return 0;

        // نأخذ الترتيب المحفوظ، أو الترتيب الحالي في الشاشة إذا لم يتم الحفظ
        const finalOrder = q.sequenceState.savedOrder.length > 0 ? q.sequenceState.savedOrder : this.getCurrentOrder(qIdStr);
        
        // مقارنة المصفوفتين
        const isCorrect = JSON.stringify(finalOrder) === JSON.stringify(q.correctOrder);
        
        return isCorrect ? 1 : 0;
    },

    // ============ الحد الأقصى للدرجات ============
    getMaxScore: function(questionId) {
        return 1; // السؤال الواحد (كترتيب كامل) = درجة واحدة
    }
};