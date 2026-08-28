window.activitiesLogic = window.activitiesLogic || {};

window.activitiesLogic.complete = {
    // ============ تحميل الأسئلة من قاعدة البيانات ============
   loadQuestions: async function(level, grade, curriculum, unit) {
    let questions = []; 
    
    // ✅ 1. المصدر الأساسي: سحب البيانات من ملف JSON (أونلاين)
    try {
        const response = await fetch('../marathonQuestionsDB.json?v=' + Date.now());
        if (response.ok) {
            const db = await response.json();
            if (db && db.activityDatabase && db.activityDatabase.complete) {
                const filtered = db.activityDatabase.complete.filter(q =>
                    q.level === level &&
                    q.grade === grade &&
                    q.curriculum === curriculum &&
                    (unit === '' || unit === undefined || q.unit === unit)
                );
                if (filtered.length > 0) {
                    console.log(`✅ Complete: تم تحميل ${filtered.length} سؤال من ملف JSON`);
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
            if (db && db.activityDatabase && db.activityDatabase.complete) {
                const filtered = db.activityDatabase.complete.filter(q =>
                    q.level === level &&
                    q.grade === grade &&
                    q.curriculum === curriculum &&
                    (unit === '' || unit === undefined || q.unit === unit)
                );
                if (filtered.length > 0) {
                    console.log(`✅ Complete: تم تحميل ${filtered.length} سؤال من localStorage (Fallback)`);
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
        html += `<p class="question-title-text"><b>${questionIndex + 1}.</b> Complete the passage:</p>`;

        // حاوية الفقرة مع الفراغات
        html += `<div class="complete-passage-container" data-passage="${qIdStr}">`;
        let passageHtml = q.passage;
        for (let i = 0; i < q.correctAnswer.length; i++) {
            passageHtml = passageHtml.replace(`{blank${i + 1}}`,
                `<span class="complete-blank" data-index="${i}" data-correct="${q.correctAnswer[i]}" data-qid="${qIdStr}">___</span>`);
        }
        html += passageHtml;
        html += `</div>`;

        // بنك الكلمات (مع خلط عشوائي)
        html += `<div class="complete-words-bank" data-words-bank="${qIdStr}">`;
        const shuffledWords = [...q.options].sort(() => Math.random() - 0.5);
        shuffledWords.forEach(word => {
            html += `<span class="complete-word-item" draggable="true" data-word="${word}" data-qid="${qIdStr}">${word}</span>`;
        });
        html += `</div>`;

        // أزرار التحكم (3 أزرار: استماع، حفظ، إدخال صوتي)
        html += `<div class="complete-controls" data-controls="${qIdStr}">`;
        html += `<button class="btn btn-info" data-action="speak" data-qid="${qIdStr}">🔊 استمع للفقرة</button>`;
        html += `<button class="btn btn-primary" data-action="save" data-qid="${qIdStr}">💾 حفظ الإجابة</button>`;
        html += `<button class="btn btn-secondary" data-action="stt" data-qid="${qIdStr}">🎤 تحدث لملء الفراغ</button>`;
        html += `</div>`;

        // مؤشر حالة الإدخال الصوتي
        html += `<div class="stt-status" data-stt-status="${qIdStr}" style="display:none;"></div>`;

        // الإجابة الصحيحة (للمعلم فقط)
        html += `<div class="answer-feedback" style="display:none;">${i18n[currentLang].correctAnswerText} <input type="text" class="edit-input" value="${q.correctAnswer.join(', ')}" readonly></div>`;

        return html;
    },

    // ============ تهيئة التفاعلية ============
    init: function(questionId) {
        const qIdStr = String(questionId);
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;

        // تهيئة حالة السؤال
        if (!q.completeState) {
            q.completeState = { answers: {}, isSaved: false, score: 0, total: q.correctAnswer.length };
        }

        // ربط زر الحذف
        const deleteBtn = document.querySelector(`.delete-q-btn[data-qid="${qIdStr}"]`);
        if (deleteBtn) {
            deleteBtn.onclick = () => deleteQuestion(q.id);
        }

        // أحداث بنك الكلمات (سحب + نقر)
        document.querySelectorAll(`.complete-word-item[data-qid="${qIdStr}"]`).forEach(wordEl => {
            wordEl.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', wordEl.dataset.word);
                wordEl.classList.add('dragging');
            });
            wordEl.addEventListener('dragend', () => wordEl.classList.remove('dragging'));
            wordEl.addEventListener('click', () => {
                const blanks = document.querySelectorAll(`.complete-blank[data-qid="${qIdStr}"]:not(.filled)`);
                if (blanks.length > 0) {
                    this.fillBlank(blanks[0], wordEl.dataset.word, qIdStr);
                    wordEl.remove();
                }
            });
        });

        // أحداث الفراغات (إفلات + نقر للإزالة)
        document.querySelectorAll(`.complete-blank[data-qid="${qIdStr}"]`).forEach(blank => {
            blank.addEventListener('dragover', (e) => {
                e.preventDefault();
                blank.style.backgroundColor = 'rgba(74, 222, 128, 0.3)';
            });
            blank.addEventListener('dragleave', () => {
                if (!blank.classList.contains('filled')) {
                    blank.style.backgroundColor = 'rgba(96, 165, 250, 0.1)';
                }
            });
            blank.addEventListener('drop', (e) => {
                e.preventDefault();
                const word = e.dataTransfer.getData('text/plain');
                this.fillBlank(blank, word, qIdStr);
                const wordEl = document.querySelector(`.complete-word-item[data-word="${word}"][data-qid="${qIdStr}"]`);
                if (wordEl) wordEl.remove();
            });
            blank.addEventListener('click', () => {
                if (blank.classList.contains('filled')) {
                    const word = blank.textContent;
                    blank.textContent = '___';
                    blank.classList.remove('filled', 'correct', 'wrong');
                    blank.style.backgroundColor = 'rgba(96, 165, 250, 0.1)';

                    const wordsBank = document.querySelector(`[data-words-bank="${qIdStr}"]`);
                    const newWord = document.createElement('span');
                    newWord.className = 'complete-word-item';
                    newWord.draggable = true;
                    newWord.dataset.word = word;
                    newWord.dataset.qid = qIdStr;
                    newWord.textContent = word;
                    wordsBank.appendChild(newWord);

                    // إعادة تهيئة الأحداث للكلمة المُعادة
                    newWord.addEventListener('dragstart', (e) => {
                        e.dataTransfer.setData('text/plain', newWord.dataset.word);
                        newWord.classList.add('dragging');
                    });
                    newWord.addEventListener('dragend', () => newWord.classList.remove('dragging'));
                    newWord.addEventListener('click', () => {
                        const blanks = document.querySelectorAll(`.complete-blank[data-qid="${qIdStr}"]:not(.filled)`);
                        if (blanks.length > 0) {
                            this.fillBlank(blanks[0], newWord.dataset.word, qIdStr);
                            newWord.remove();
                        }
                    });

                    if (q.completeState) {
                        q.completeState.answers[blank.dataset.index] = '';
                        q.completeState.isSaved = false;
                        this.resetSaveButton(qIdStr);
                    }
                }
            });
        });

        // ربط أزرار التحكم (Event Delegation)
        const controls = document.querySelector(`[data-controls="${qIdStr}"]`);
        if (controls) {
            controls.addEventListener('click', (e) => {
                const btn = e.target.closest('button[data-action]');
                if (!btn) return;
                const action = btn.dataset.action;
                const targetQid = btn.dataset.qid;

                if (action === 'speak') this.speakPassage(targetQid);
                else if (action === 'save') this.saveAnswer(targetQid);
                else if (action === 'stt') this.startSmartDrop(targetQid);
            });
        }
    },

    // ============ ملء الفراغ ============
    fillBlank: function(blank, word, qIdStr) {
        blank.textContent = word;
        blank.classList.add('filled');
        blank.classList.remove('correct', 'wrong');
        blank.style.backgroundColor = '';

        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (q && q.completeState) {
            q.completeState.answers[blank.dataset.index] = word;
            q.completeState.isSaved = false;
            this.resetSaveButton(qIdStr);
        }
    },

    // ============ زر حفظ الإجابة ============
    saveAnswer: function(qIdStr) {
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;

        if (!q.completeState) {
            q.completeState = { answers: {}, isSaved: false, score: 0, total: q.correctAnswer.length };
        }

        document.querySelectorAll(`.complete-blank[data-qid="${qIdStr}"]`).forEach(blank => {
            const currentText = blank.textContent.trim();
            q.completeState.answers[blank.dataset.index] = (currentText === '___') ? '' : currentText;
        });

        q.completeState.isSaved = true;

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
        console.log(`✅ تم حفظ إجابة السؤال ${qIdStr}:`, q.completeState.answers);
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
    speakPassage: function(qIdStr) {
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;

        const btn = document.querySelector(`[data-controls="${qIdStr}"] button[data-action="speak"]`);

        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            if (btn) {
                btn.innerHTML = '🔊 استمع للفقرة';
                btn.classList.remove('btn-warning');
                btn.classList.add('btn-info');
            }
            return;
        }

        const fullText = q.passage.replace(/{blank\d+}/g, " ... ");

        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(fullText);
            utterance.lang = 'en-US';
            utterance.rate = 0.9;
            utterance.pitch = 1;

            if (btn) {
                btn.innerHTML = '⏹️ إيقاف';
                btn.classList.remove('btn-info');
                btn.classList.add('btn-warning');
            }

            utterance.onend = utterance.onerror = () => {
                if (btn) {
                    btn.innerHTML = '🔊 استمع للفقرة';
                    btn.classList.remove('btn-warning');
                    btn.classList.add('btn-info');
                }
            };

            window.speechSynthesis.speak(utterance);
        } else {
            alert("عذراً، متصفحك لا يدعم ميزة الاستماع.");
        }
    },

    // ============ النمط A: الإدخال الصوتي الذكي (Smart Drop) ============
    startSmartDrop: function(qIdStr) {
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;

        const btn = document.querySelector(`[data-controls="${qIdStr}"] button[data-action="stt"]`);
        const statusEl = document.querySelector(`[data-stt-status="${qIdStr}"]`);

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
                statusEl.innerHTML = '🎧 قل كلمة من بنك الكلمات...';
                statusEl.style.color = '#eab308';
                statusEl.style.padding = '8px';
                statusEl.style.borderRadius = '8px';
                statusEl.style.background = 'rgba(234, 179, 8, 0.1)';
            }
        };

        recognition.onresult = (event) => {
            const spokenWord = event.results[0][0].transcript.trim().toLowerCase();
            console.log(`🎤 الطالب قال: "${spokenWord}"`);

            const wordBank = document.querySelectorAll(`.complete-word-item[data-qid="${qIdStr}"]`);
            let matchedWordEl = null;
            let matchedWord = null;

            wordBank.forEach(wordEl => {
                if (wordEl.dataset.word.trim().toLowerCase() === spokenWord) {
                    matchedWordEl = wordEl;
                    matchedWord = wordEl.dataset.word;
                }
            });

            if (matchedWordEl) {
                const blanks = document.querySelectorAll(`.complete-blank[data-qid="${qIdStr}"]:not(.filled)`);
                if (blanks.length > 0) {
                    const firstBlank = blanks[0];
                    this.fillBlank(firstBlank, matchedWord, qIdStr);
                    matchedWordEl.remove();

                    firstBlank.style.transition = 'all 0.3s';
                    firstBlank.style.boxShadow = '0 0 20px #4ade80';
                    setTimeout(() => firstBlank.style.boxShadow = '', 800);

                    if (statusEl) {
                        statusEl.innerHTML = `✅ أحسنت! كلمة "<b>${matchedWord}</b>" في مكانها`;
                        statusEl.style.color = '#4ade80';
                        statusEl.style.background = 'rgba(74, 222, 128, 0.1)';
                    }
                } else {
                    if (statusEl) {
                        statusEl.innerHTML = '⚠️ جميع الفراغات ممتلئة!';
                        statusEl.style.color = '#eab308';
                    }
                }
            } else {
                if (statusEl) {
                    statusEl.innerHTML = `❌ كلمة "<b>${spokenWord}</b>" غير موجودة في البنك`;
                    statusEl.style.color = '#ef4444';
                    statusEl.style.background = 'rgba(239, 68, 68, 0.1)';
                }
                const bank = document.querySelector(`[data-words-bank="${qIdStr}"]`);
                if (bank) {
                    bank.style.transition = 'all 0.3s';
                    bank.style.boxShadow = '0 0 20px #ef4444';
                    setTimeout(() => bank.style.boxShadow = '', 800);
                }
            }
        };

        recognition.onerror = (event) => {
            console.warn("Speech error:", event.error);
            if (statusEl) {
                let msg = '⚠️ ';
                if (event.error === 'no-speech') msg += 'لم أسمعك! حاول مرة أخرى.';
                else if (event.error === 'not-allowed') msg += 'يجب السماح بالوصول للميكروفون.';
                else msg += 'حدث خطأ. حاول مرة أخرى.';
                statusEl.innerHTML = msg;
                statusEl.style.color = '#ef4444';
                statusEl.style.background = 'rgba(239, 68, 68, 0.1)';
            }
        };

        recognition.onend = () => {
            if (btn) {
                btn.classList.remove('listening', 'btn-danger');
                btn.classList.add('btn-secondary');
                btn.innerHTML = '🎤 تحدث لملء الفراغ';
            }
            this._currentRecognition = null;
        };

        try {
            recognition.start();
        } catch (e) {
            console.warn("Could not start recognition:", e);
        }
    },

    // ============ التحقق من الإجابات ============
    checkAnswers: function(qIdStr) {
        document.querySelectorAll(`.complete-blank[data-qid="${qIdStr}"]`).forEach(blank => {
            const correct = blank.dataset.correct.trim().toLowerCase();
            const userAnswer = blank.textContent.trim().toLowerCase();
            blank.classList.remove('correct', 'wrong');
            if (userAnswer === correct && userAnswer !== '') blank.classList.add('correct');
            else if (userAnswer !== '___' && userAnswer !== '') blank.classList.add('wrong');
        });
    },

    // ============ ✅ حساب النتيجة: كل فراغ = درجة واحدة ============
    calculateScore: function(questionId) {
        const qIdStr = String(questionId);
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return 0;

        let correctCount = 0;
        const totalBlanks = q.correctAnswer.length;

        document.querySelectorAll(`.complete-blank[data-qid="${qIdStr}"]`).forEach(blank => {
            const correct = blank.dataset.correct.trim().toLowerCase();
            const userAnswer = blank.textContent.trim().toLowerCase();
            if (userAnswer === correct && userAnswer !== '') {
                correctCount++;
            }
        });

        if (q.completeState) {
            q.completeState.score = correctCount;
            q.completeState.total = totalBlanks;
        }

        // ✅ كل فراغ = درجة واحدة (5 فراغات = 5 درجات)
        return correctCount;
    },

    // ============ ✅ الحد الأقصى للدرجات (يُستخدم في submitStudentAnswers) ============
    getMaxScore: function(questionId) {
        const qIdStr = String(questionId);
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return 0;
        // كل فراغ = درجة واحدة
        return q.correctAnswer ? q.correctAnswer.length : 0;
    }
};