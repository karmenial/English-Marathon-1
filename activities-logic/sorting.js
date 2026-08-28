window.activitiesLogic = window.activitiesLogic || {};

window.activitiesLogic.sorting = {
    // ============ تحميل الأسئلة ============
    loadQuestions: async function(level, grade, curriculum, unit) {
        let questions = [];
        try {
            const localData = localStorage.getItem('marathon_questions_db');
            if (localData) {
                const db = JSON.parse(localData);
                if (db && db.activityDatabase && db.activityDatabase.sorting) {
                    const filtered = db.activityDatabase.sorting.filter(q =>
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
                if (db && db.activityDatabase && db.activityDatabase.sorting) {
                    const filtered = db.activityDatabase.sorting.filter(q =>
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
        html += `<p class="question-title-text"><b>${questionIndex + 1}.</b> ${q.title || 'Sort the words by category'}:</p>`;
        
        html += `<div class="sorting-container" id="sorting_${qIdStr}" style="background: rgba(255,255,255,0.08); border: 3px solid var(--border-color); border-radius: 14px; padding: 20px; margin: 15px 0;">`;
        
        // ✅ حاوية الفئات (ديناميكية: تتسع لـ 2 أو 3 أو 4 فئات تلقائياً)
        html += `<div class="sorting-categories" id="categories_${qIdStr}" style="display: grid; grid-template-columns: repeat(${q.categories.length}, 1fr); gap: 15px; margin-bottom: 20px;">`;
        
        q.categories.forEach(cat => {
            html += `<div class="sorting-category" id="catBox_${qIdStr}_${cat.id}" style="background: rgba(255,255,255,0.05); border: 3px dashed var(--border-color); border-radius: 12px; padding: 15px; min-height: 150px; display: flex; flex-direction: column;">`;
            
            // ✅ رأس الصندوق: اسم الفئة + زر الميكروفون الصغير
            html += `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 2px solid var(--border-color); padding-bottom: 8px;">`;
            html += `<h4 style="margin: 0; color: var(--btn-primary); font-weight: 900; font-size: 1.1rem;">${cat.name}</h4>`;
            html += `<button class="sort-mic-btn" data-cat="${cat.id}" data-qid="${qIdStr}" style="background: var(--btn-secondary); color: white; border: none; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" title="تحدث لإضافة كلمة لهذا الصندوق">🎤</button>`;
            html += `</div>`;
            
            // منطقة الإفلات
            html += `<div class="sorting-drop-area" data-category="${cat.id}" style="flex: 1; display: flex; flex-wrap: wrap; gap: 8px; align-content: flex-start;"></div>`;
            html += `</div>`;
        });
        html += `</div>`;
        
        // بنك الكلمات غير المرتبة
        html += `<div class="sorting-unsorted" id="unsorted_${qIdStr}" style="background: rgba(255,255,255,0.05); border: 3px dashed var(--border-color); border-radius: 12px; padding: 15px; margin-bottom: 15px;">`;
        html += `<h4 style="margin: 0 0 10px 0; color: var(--text-muted); font-weight: 700;">📦 Unsorted Words:</h4>`;
        html += `<div class="sorting-words-bank" id="bank_${qIdStr}" style="display: flex; flex-wrap: wrap; gap: 10px;">`;
        
        const shuffledWords = [...q.wordList].sort(() => Math.random() - 0.5);
        shuffledWords.forEach(word => {
            html += `<div class="sorting-word-item" draggable="true" data-word="${word}" style="background: var(--kids-yellow); color: #854d0e; padding: 8px 16px; border-radius: 10px; font-weight: 900; font-size: 1.1rem; border: 3px dashed #ca8a04; cursor: grab;">${word}</div>`;
        });
        html += `</div>`;
        html += `</div>`;
        
        // ✅ أزرار التحكم
        html += `<div class="sorting-controls" data-controls="${qIdStr}" style="display: flex; gap: 10px; flex-wrap: wrap;">`;
        html += `<button class="btn btn-primary" data-action="save" data-qid="${qIdStr}">💾 حفظ الإجابة</button>`;
        html += `</div>`;
        
        // مؤشر حالة الحفظ
        html += `<div class="save-status" data-save-status="${qIdStr}" style="display: none; margin-top: 10px; text-align: center; font-weight: bold; color: var(--success); padding: 8px; border-radius: 8px;"></div>`;
        
        html += `</div>`;
        return html;
    },

    // ============ تهيئة التفاعلية ============
    init: function(questionId) {
        const qIdStr = String(questionId);
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;

        if (!q.sortingState) {
            q.sortingState = {
                placedWords: {}, // { "word": "categoryId" }
                isSaved: false
            };
        }

        // 1. ربط زر الحذف
        const deleteBtn = document.querySelector(`.delete-q-btn[data-qid="${qIdStr}"]`);
        if (deleteBtn) deleteBtn.onclick = () => deleteQuestion(q.id);

        // 2. ربط أزرار الميكروفون المباشرة (بسيطة ومضمونة)
        document.querySelectorAll(`.sort-mic-btn[data-qid="${qIdStr}"]`).forEach(btn => {
            btn.addEventListener('click', () => {
                this.startVoiceRecognition(qIdStr, btn.dataset.cat, btn);
            });
        });

        // 3. ربط زر الحفظ
        const saveBtn = document.querySelector(`[data-controls="${qIdStr}"] button[data-action="save"]`);
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveAnswer(qIdStr));
        }

        // 4. إعداد السحب والإفلات (Drag & Drop)
        this.setupDragAndDrop(qIdStr);
    },

    // ============ دوال مساعدة للسحب والإفلات ============
    setupDragAndDrop: function(qIdStr) {
        const bank = document.getElementById(`bank_${qIdStr}`);
        const dropAreas = document.querySelectorAll(`#categories_${qIdStr} .sorting-drop-area`);

        // إعداد الكلمات في البنك
        bank.querySelectorAll('.sorting-word-item').forEach(el => {
            el.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', el.dataset.word);
                el.style.opacity = '0.5';
            });
            el.addEventListener('dragend', () => { el.style.opacity = '1'; });
        });

        // إعداد مناطق الإفلات
        dropAreas.forEach(area => {
            area.addEventListener('dragover', (e) => {
                e.preventDefault();
                area.style.backgroundColor = 'rgba(74, 222, 128, 0.2)';
            });
            area.addEventListener('dragleave', () => {
                area.style.backgroundColor = '';
            });
            area.addEventListener('drop', (e) => {
                e.preventDefault();
                area.style.backgroundColor = '';
                const word = e.dataTransfer.getData('text/plain');
                this.moveWordToCategory(qIdStr, word, area.dataset.category);
            });
        });
    },

    // ============ ✅ نقل الكلمة إلى الفئة (تم إصلاح الخطأ هنا) ============
    moveWordToCategory: function(qIdStr, word, categoryId) {
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;
        
        // 1. إزالة الكلمة من أي مكان آخر (بنك أو فئة أخرى)
        const existingEl = document.querySelector(`.sorting-word-item[data-word="${word}"]`);
        if (existingEl) existingEl.remove();

        // 2. إضافة الكلمة للفئة الجديدة
        const dropArea = document.querySelector(`#catBox_${qIdStr}_${categoryId} .sorting-drop-area`);
        if (dropArea) {
            const el = document.createElement('div');
            el.className = 'sorting-word-item';
            el.dataset.word = word;
            el.textContent = word;
            // تنسيق الكلمة بعد وضعها في الصندوق
            el.style.cssText = 'background: var(--success); color: white; padding: 8px 16px; border-radius: 10px; font-weight: 900; font-size: 1.1rem; border: 3px solid #15803d; cursor: pointer;';
            
            // النقر على الكلمة المرتبة يعيدها للبنك
            el.addEventListener('click', () => this.returnWordToBank(qIdStr, word));
            
            dropArea.appendChild(el);
        }

        // 3. تحديث الحالة
        q.sortingState.placedWords[word] = categoryId;
        q.sortingState.isSaved = false;
        this.resetSaveButton(qIdStr);
    },

    // ============ إعادة الكلمة إلى البنك ============
    returnWordToBank: function(qIdStr, word) {
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;
        
        // إزالة الكلمة من الفئة
        const existingEl = document.querySelector(`.sorting-word-item[data-word="${word}"]`);
        if (existingEl) existingEl.remove();

        // إعادتها للبنك
        const bank = document.getElementById(`bank_${qIdStr}`);
        if (bank) {
            const el = document.createElement('div');
            el.className = 'sorting-word-item';
            el.draggable = true;
            el.dataset.word = word;
            el.textContent = word;
            el.style.cssText = 'background: var(--kids-yellow); color: #854d0e; padding: 8px 16px; border-radius: 10px; font-weight: 900; font-size: 1.1rem; border: 3px dashed #ca8a04; cursor: grab;';
            
            el.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', word);
                el.style.opacity = '0.5';
            });
            el.addEventListener('dragend', () => { el.style.opacity = '1'; });
            
            bank.appendChild(el);
        }

        // تحديث الحالة
        delete q.sortingState.placedWords[word];
        q.sortingState.isSaved = false;
        this.resetSaveButton(qIdStr);
    },

    // ============ الإدخال الصوتي المخصص لكل فئة ============
    startVoiceRecognition: function(qIdStr, categoryId, micBtn) {
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            micBtn.innerHTML = '⚠️';
            return;
        }

        // إيقاف أي تسجيل سابق
        if (micBtn.classList.contains('listening')) {
            if (this._currentRecognition) { this._currentRecognition.stop(); this._currentRecognition = null; }
            micBtn.classList.remove('listening');
            micBtn.style.background = 'var(--btn-secondary)';
            micBtn.innerHTML = '🎤';
            return;
        }

        if (this._currentRecognition) {
            this._currentRecognition.stop();
            document.querySelectorAll('.sort-mic-btn.listening').forEach(btn => {
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
            
            // البحث عن الكلمة المنطوقة في بنك الكلمات غير المرتبة فقط
            const bank = document.getElementById(`bank_${qIdStr}`);
            const wordEl = Array.from(bank.querySelectorAll('.sorting-word-item')).find(el => 
                el.dataset.word.trim().toLowerCase() === spokenWord
            );

            if (wordEl) {
                const word = wordEl.dataset.word;
                this.moveWordToCategory(qIdStr, word, categoryId);
                
                // ومضة خضراء على الصندوق لتأكيد النجاح
                const catBox = document.getElementById(`catBox_${qIdStr}_${categoryId}`);
                catBox.style.borderColor = '#22c55e';
                setTimeout(() => { catBox.style.borderColor = 'var(--border-color)'; }, 800);
            } else {
                // ومضة برتقالية إذا لم تُعثر على الكلمة
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

    // ============ زر حفظ الإجابة ============
    saveAnswer: function(qIdStr) {
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;

        // قراءة الحالة الحالية من الـ DOM لضمان الدقة
        const placedWords = {};
        document.querySelectorAll(`#categories_${qIdStr} .sorting-drop-area`).forEach(area => {
            const catId = area.dataset.category;
            area.querySelectorAll('.sorting-word-item').forEach(el => {
                placedWords[el.dataset.word] = catId;
            });
        });

        q.sortingState.placedWords = placedWords;
        q.sortingState.isSaved = true;

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
            statusEl.textContent = '💾 تم حفظ تصنيفك. يمكنك التعديل والحفظ مجدداً.';
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

    // ============ حساب النتيجة ============
    calculateScore: function(questionId) {
        const qIdStr = String(questionId);
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q || !q.sortingState) return 0;

        let correctCount = 0;
        q.wordList.forEach(word => {
            const expectedCategory = q.answerKey[word];
            const actualCategory = q.sortingState.placedWords[word];
            if (actualCategory === expectedCategory) {
                correctCount++; // كل كلمة صحيحة = درجة واحدة
            }
        });

        return correctCount;
    },

    // ============ الحد الأقصى للدرجات ============
    getMaxScore: function(questionId) {
        const qIdStr = String(questionId);
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q || !q.wordList) return 0;
        return q.wordList.length;
    }
};