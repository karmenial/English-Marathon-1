window.activitiesLogic = window.activitiesLogic || {};

window.activitiesLogic.justtalk = {
    // ============ تحميل الأسئلة من قاعدة البيانات ============
   loadQuestions: async function(level, grade, curriculum, unit) {
    let questions = []; 
    
    // ✅ 1. المصدر الأساسي: سحب البيانات من ملف JSON (أونلاين)
    try {
        const response = await fetch('../marathonQuestionsDB.json?v=' + Date.now());
        if (response.ok) {
            const db = await response.json();
            if (db && db.activityDatabase && db.activityDatabase.justtalk) {
                const filtered = db.activityDatabase.justtalk.filter(q =>
                    q.level === level &&
                    q.grade === grade &&
                    q.curriculum === curriculum &&
                    (unit === '' || unit === undefined || q.unit === unit)
                );
                if (filtered.length > 0) {
                    console.log(`✅ justtalk: تم تحميل ${filtered.length} سؤال من ملف JSON`);
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
            if (db && db.activityDatabase && db.activityDatabase.justtalk) {
                const filtered = db.activityDatabase.justtalk.filter(q =>
                    q.level === level &&
                    q.grade === grade &&
                    q.curriculum === curriculum &&
                    (unit === '' || unit === undefined || q.unit === unit)
                );
                if (filtered.length > 0) {
                    console.log(`✅ justtalk: تم تحميل ${filtered.length} سؤال من localStorage (Fallback)`);
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
        html += `<p class="question-title-text"><b>${questionIndex + 1}.</b> Read and Speak:</p>`;
        
        html += `<div class="justtalk-container" id="justtalk_${qIdStr}" style="background: rgba(255,255,255,0.08); border: 3px solid var(--border-color); border-radius: 14px; padding: 20px; margin: 15px 0;">`;
        
        // مؤشر التقدم المحايد (يظهر التقدم في الجمل فقط بدون درجات)
        html += `<div class="justtalk-progress" style="margin-bottom: 15px;">`;
        html += `<div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-weight: 700; color: var(--text-muted);">`;
        html += `<span>Sentence <span id="currentSentence_${qIdStr}">1</span> of ${q.sentences.length}</span>`;
        html += `</div>`;
        html += `<div style="background: rgba(255,255,255,0.2); border-radius: 10px; height: 8px; overflow: hidden;">`;
        html += `<div id="progressBar_${qIdStr}" style="background: var(--btn-primary); height: 100%; width: 0%; transition: width 0.3s;"></div>`;
        html += `</div>`;
        html += `</div>`;
        
        // عرض الجملة الحالية
        html += `<div class="justtalk-sentence-display" id="sentenceDisplay_${qIdStr}" style="background: rgba(255,255,255,0.1); border: 2px solid var(--btn-primary); border-radius: 12px; padding: 20px; margin: 15px 0; font-size: 1.4rem; font-weight: 700; text-align: center; line-height: 1.6; min-height: 60px; display: flex; align-items: center; justify-content: center;">`;
        html += q.sentences[0].text;
        html += `</div>`;
        
        // ✅ الأزرار الثلاثة القياسية فقط
        html += `<div class="justtalk-controls" data-controls="${qIdStr}" style="display: flex; gap: 10px; justify-content: center; margin: 15px 0; flex-wrap: wrap;">`;
        html += `<button class="btn btn-info" data-action="speak" data-qid="${qIdStr}">🔊 استمع</button>`;
        html += `<button class="btn btn-secondary" data-action="stt" data-qid="${qIdStr}">🎤 تحدث</button>`;
        html += `<button class="btn btn-primary" data-action="save" data-qid="${qIdStr}">💾 حفظ وانتقل</button>`;
        html += `</div>`;
        
        // حالة التسجيل (محايدة: تعرض ما تم التقاطه فقط)
        html += `<div id="recordingStatus_${qIdStr}" style="text-align: center; margin: 10px 0; font-weight: 700; min-height: 24px; color: var(--text-muted);"></div>`;
        
        // رسالة إتمام النشاط (محايدة)
        html += `<div id="completionMsg_${qIdStr}" style="display: none; background: rgba(34, 197, 94, 0.1); border: 2px solid var(--success); color: var(--success); padding: 15px; border-radius: 10px; text-align: center; font-weight: 900; font-size: 1.2rem; margin-top: 15px;">✅ تم إكمال هذا النشاط بنجاح!</div>`;
        
        html += `</div>`;
        return html;
    },

    // ============ تهيئة التفاعلية ============
    init: function(questionId) {
        const qIdStr = String(questionId);
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q) return;

        if (!q.justtalkState) {
            q.justtalkState = {
                currentSentenceIndex: 0,
                savedTranscripts: {}, // لتخزين ما قاله الطالب لكل جملة
                isRecording: false,
                recognition: null,
                isCompleted: false
            };
        }

        // ربط زر الحذف
        const deleteBtn = document.querySelector(`.delete-q-btn[data-qid="${qIdStr}"]`);
        if (deleteBtn) deleteBtn.onclick = () => deleteQuestion(q.id);

        // تهيئة التعرف على الصوت (Speech Recognition)
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';
            q.justtalkState.recognition = recognition;

            recognition.onstart = () => {
                q.justtalkState.isRecording = true;
                const btn = document.querySelector(`[data-controls="${qIdStr}"] button[data-action="stt"]`);
                if (btn) {
                    btn.classList.add('listening');
                    btn.innerHTML = '🔴 جاري الاستماع...';
                    btn.classList.remove('btn-secondary');
                    btn.classList.add('btn-danger');
                }
                const status = document.getElementById(`recordingStatus_${qIdStr}`);
                if (status) {
                    status.textContent = '🎤 استمع جيداً ثم تحدث الآن...';
                    status.style.color = '#eab308';
                }
            };

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript.trim();
                const status = document.getElementById(`recordingStatus_${qIdStr}`);
                if (status) {
                    status.textContent = `📝 تم التسجيل: "${transcript}"`;
                    status.style.color = 'var(--success)';
                }
                // حفظ مؤقت في الذاكرة حتى يضغط الطالب على "حفظ"
                q.justtalkState.currentTranscript = transcript;
            };

            recognition.onerror = (event) => {
                console.warn('Speech recognition error:', event.error);
                const status = document.getElementById(`recordingStatus_${qIdStr}`);
                if (status) {
                    status.textContent = '⚠️ لم يتم التقاط الصوت، حاول مرة أخرى.';
                    status.style.color = '#ef4444';
                }
            };

            recognition.onend = () => {
                q.justtalkState.isRecording = false;
                const btn = document.querySelector(`[data-controls="${qIdStr}"] button[data-action="stt"]`);
                if (btn) {
                    btn.classList.remove('listening', 'btn-danger');
                    btn.classList.add('btn-secondary');
                    btn.innerHTML = '🎤 تحدث';
                }
            };
        }

        // ✅ Event Delegation للأزرار الثلاثة
        const controls = document.querySelector(`[data-controls="${qIdStr}"]`);
        if (controls) {
            controls.addEventListener('click', (e) => {
                const btn = e.target.closest('button[data-action]');
                if (!btn) return;
                const action = btn.dataset.action;
                const targetQid = btn.dataset.qid;

                if (action === 'speak') this.speakSentence(targetQid);
                else if (action === 'stt') this.startRecording(targetQid);
                else if (action === 'save') this.saveAndAdvance(targetQid);
            });
        }
        
        this.updateProgressBar(qIdStr);
    },

    // ============ زر الاستماع (TTS) ============
    speakSentence: function(qIdStr) {
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q || !q.justtalkState || q.justtalkState.isCompleted) return;
        
        const currentSentence = q.sentences[q.justtalkState.currentSentenceIndex];
        const btn = document.querySelector(`[data-controls="${qIdStr}"] button[data-action="speak"]`);

        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            if (btn) { btn.innerHTML = '🔊 استمع'; btn.classList.remove('btn-warning'); btn.classList.add('btn-info'); }
            return;
        }

        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(currentSentence.text);
            utterance.lang = 'en-US';
            utterance.rate = 0.9;

            if (btn) { btn.innerHTML = '⏹️ إيقاف'; btn.classList.remove('btn-info'); btn.classList.add('btn-warning'); }
            utterance.onend = utterance.onerror = () => {
                if (btn) { btn.innerHTML = '🔊 استمع'; btn.classList.remove('btn-warning'); btn.classList.add('btn-info'); }
            };
            window.speechSynthesis.speak(utterance);
        }
    },

    // ============ زر التسجيل الصوتي (STT) ============
    startRecording: function(qIdStr) {
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q || !q.justtalkState || q.justtalkState.isCompleted) return;
        if (q.justtalkState.isRecording) {
            if (q.justtalkState.recognition) q.justtalkState.recognition.stop();
            return;
        }
        if (!q.justtalkState.recognition) {
            alert("متصفحك لا يدعم الإدخال الصوتي. يرجى استخدام Chrome أو Edge.");
            return;
        }
        
        // مسح الحالة السابقة
        const status = document.getElementById(`recordingStatus_${qIdStr}`);
        if (status) { status.textContent = ''; status.style.color = 'var(--text-muted)'; }
        q.justtalkState.currentTranscript = '';
        
        try {
            q.justtalkState.recognition.start();
        } catch (error) {
            console.error('Error starting recognition:', error);
        }
    },

    // ============ زر الحفظ والانتقال ============
    saveAndAdvance: function(qIdStr) {
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q || !q.justtalkState || q.justtalkState.isCompleted) return;

        const transcript = q.justtalkState.currentTranscript;
        if (!transcript || transcript.trim() === '') {
            alert("الرجاء تسجيل صوتك أولاً قبل الحفظ!");
            return;
        }

        // 1. حفظ التسجيل الحالي للجملة الحالية
        q.justtalkState.savedTranscripts[q.justtalkState.currentSentenceIndex] = transcript;

        // 2. الانتقال للجملة التالية
        q.justtalkState.currentSentenceIndex++;
        q.justtalkState.currentTranscript = ''; // تصفير للحالة التالية

        if (q.justtalkState.currentSentenceIndex >= q.sentences.length) {
            // انتهى النشاط
            q.justtalkState.isCompleted = true;
            const completionMsg = document.getElementById(`completionMsg_${qIdStr}`);
            if (completionMsg) completionMsg.style.display = 'block';
            
            // إخفاء أزرار التحكم
            const controls = document.querySelector(`[data-controls="${qIdStr}"]`);
            if (controls) controls.style.display = 'none';
            
            const status = document.getElementById(`recordingStatus_${qIdStr}`);
            if (status) status.style.display = 'none';
        } else {
            // تحديث واجهة المستخدم للجملة التالية
            const sentenceDisplay = document.getElementById(`sentenceDisplay_${qIdStr}`);
            const currentSentenceSpan = document.getElementById(`currentSentence_${qIdStr}`);
            const status = document.getElementById(`recordingStatus_${qIdStr}`);
            
            if (sentenceDisplay) sentenceDisplay.textContent = q.sentences[q.justtalkState.currentSentenceIndex].text;
            if (currentSentenceSpan) currentSentenceSpan.textContent = q.justtalkState.currentSentenceIndex + 1;
            if (status) { status.textContent = '📝 تم حفظ الجملة السابقة. سجل الجملة الجديدة.'; status.style.color = 'var(--text-muted)'; }
            
            this.updateProgressBar(qIdStr);
        }
    },

    updateProgressBar: function(qIdStr) {
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q || !q.justtalkState) return;
        const progress = ((q.justtalkState.currentSentenceIndex) / q.sentences.length) * 100;
        const progressBar = document.getElementById(`progressBar_${qIdStr}`);
        if (progressBar) progressBar.style.width = progress + '%';
    },

    // ============ حساب التشابه (للتصحيح في الخلفية فقط) ============
    calculateSimilarity: function(text1, text2) {
        const words1 = text1.toLowerCase().split(/\s+/).filter(w => w.length > 0);
        const words2 = text2.toLowerCase().split(/\s+/).filter(w => w.length > 0);
        if (words1.length === 0 && words2.length === 0) return 1;
        if (words1.length === 0 || words2.length === 0) return 0;
        
        let matches = 0;
        words1.forEach(word => {
            if (words2.includes(word)) matches++;
        });
        return matches / Math.max(words1.length, words2.length);
    },

    // ============ حساب النتيجة النهائية (يُستدعى عند إنهاء الامتحان) ============
    calculateScore: function(questionId) {
        const qIdStr = String(questionId);
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q || !q.justtalkState) return 0;

        let score = 0;
        q.sentences.forEach((sentence, index) => {
            const savedText = q.justtalkState.savedTranscripts[index] || '';
            const similarity = this.calculateSimilarity(sentence.target, savedText);
            // نعتبر الإجابة صحيحة إذا كان التشابه 80% أو أكثر
            if (similarity >= 0.8) {
                score++;
            }
        });

        return score;
    },

    // ============ الحد الأقصى للدرجات ============
    getMaxScore: function(questionId) {
        const qIdStr = String(questionId);
        const q = questionsList.find(q => String(q.id) === qIdStr);
        if (!q || !q.sentences) return 0;
        return q.sentences.length; // كل جملة صحيحة = درجة واحدة
    }
};