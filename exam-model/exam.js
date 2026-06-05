(function () {
	'use strict';

	var BASE_POINTS = 1;
	var labels = ['a', 'b', 'c', 'd'];
	var questions = (typeof QUESTIONS !== 'undefined') ? QUESTIONS : [];
	var POINTS_PER_QUESTION = questions.length ? (9 / questions.length) : 0;

	var LANG_MAP = { html: 'xml', javascript: 'javascript', css: 'css' };

	function highlightCode(code, lang) {
		var hljsLang = LANG_MAP[lang] || lang;
		try {
			if (hljs.getLanguage(hljsLang)) {
				return hljs.highlight(code, { language: hljsLang }).value;
			}
		} catch (e) { /* fall through */ }
		return hljs.highlightAuto(code).value;
	}

	function renderCodeFiles() {
		var container = document.getElementById('code-files');
		if (!container || typeof CODE_FILES === 'undefined') return;

		CODE_FILES.forEach(function (file) {
			var panel = document.createElement('div');
			panel.className = 'code-panel';

			var header = document.createElement('div');
			header.className = 'code-panel-header';
			header.textContent = file.name;
			panel.appendChild(header);

			var body = document.createElement('div');
			body.className = 'code-panel-body';

			var pre = document.createElement('pre');
			pre.className = 'code-pre';

			var code = document.createElement('code');
			code.className = 'hljs language-' + file.lang;

			var highlighted = highlightCode(file.code, file.lang);
			var lines = file.code.split('\n');
			var highlightedLines = highlighted.split('\n');

			lines.forEach(function (_, i) {
				var row = document.createElement('div');
				row.className = 'code-line-row';

				var ln = document.createElement('span');
				ln.className = 'code-ln';
				ln.textContent = i + 1;

				var lc = document.createElement('span');
				lc.className = 'code-lc';
				lc.innerHTML = highlightedLines[i] !== undefined ? highlightedLines[i] : '&nbsp;';

				row.appendChild(ln);
				row.appendChild(lc);
				code.appendChild(row);
			});

			pre.appendChild(code);
			body.appendChild(pre);
			panel.appendChild(body);
			container.appendChild(panel);
		});
	}

	function renderQuestions() {
		var container = document.getElementById('quiz-questions');
		container.innerHTML = questions.map(function (q, i) {
			var opts = q.options.map(function (opt, j) {
				return '<div class="option" data-q="' + i + '" data-opt="' + j + '">' +
					'<input type="radio" name="q' + i + '" id="q' + i + '-' + j + '" value="' + j + '">' +
					'<label for="q' + i + '-' + j + '">' + labels[j] + ') ' + opt + '</label>' +
					'</div>';
			}).join('');
			return '<div class="question" id="question-' + i + '" data-index="' + i + '">' +
				'<p class="question-text">' + (i + 1) + '. ' + q.text + '</p>' +
				opts +
				'<div class="feedback" id="feedback-' + i + '" role="status"></div>' +
				'</div>';
		}).join('');

		container.querySelectorAll('.option').forEach(function (el) {
			el.addEventListener('click', function (e) {
				if (e.target.tagName === 'INPUT') return;
				el.querySelector('input').checked = true;
			});
		});
	}

	function addBadge(optionEl, text, kind) {
		var badge = document.createElement('span');
		badge.className = 'answer-badge ' + kind;
		badge.textContent = text;
		optionEl.appendChild(badge);
	}

	function checkAnswers() {
		var correctCount = 0;
		var unanswered = 0;

		questions.forEach(function (q, i) {
			var questionEl = document.getElementById('question-' + i);
			var feedbackEl = document.getElementById('feedback-' + i);
			var selected = document.querySelector('input[name="q' + i + '"]:checked');
			var options = questionEl.querySelectorAll('.option');

			options.forEach(function (opt) {
				opt.classList.remove('selected-correct', 'selected-wrong', 'correct-answer');
				var oldBadge = opt.querySelector('.answer-badge');
				if (oldBadge) oldBadge.remove();
			});
			feedbackEl.className = 'feedback';
			questionEl.classList.remove('checked-correct', 'checked-wrong');

			if (!selected) {
				unanswered++;
				options[q.correct].classList.add('correct-answer');
				addBadge(options[q.correct], 'Correct answer', 'is-key');
				feedbackEl.className = 'feedback visible bad';
				feedbackEl.innerHTML = '<span class="feedback-label">Feedback</span>' +
					'<span class="feedback-result">No answer selected (0)</span>' +
					'<mark class="feedback-text">' + q.feedbackBad + '</mark>';
				questionEl.classList.add('checked-wrong');
				return;
			}

			var chosen = parseInt(selected.value, 10);
			var chosenOpt = options[chosen];
			var correctOpt = options[q.correct];

			if (chosen === q.correct) {
				correctCount++;
				chosenOpt.classList.add('selected-correct');
				addBadge(chosenOpt, 'Your answer (correct)', 'is-correct');
				feedbackEl.className = 'feedback visible ok';
				feedbackEl.innerHTML = '<span class="feedback-label">Feedback</span>' +
					'<span class="feedback-result">Correct</span>' +
					'<mark class="feedback-text">' + q.feedbackOk + '</mark>';
				questionEl.classList.add('checked-correct');
			} else {
				chosenOpt.classList.add('selected-wrong');
				addBadge(chosenOpt, 'Your answer', 'is-wrong');
				correctOpt.classList.add('correct-answer');
				addBadge(correctOpt, 'Correct answer', 'is-key');
				feedbackEl.className = 'feedback visible bad';
				feedbackEl.innerHTML = '<span class="feedback-label">Feedback</span>' +
					'<span class="feedback-result">Incorrect</span>' +
					'<mark class="feedback-text">' + q.feedbackBad + '</mark>';
				questionEl.classList.add('checked-wrong');
			}
		});

		var earned = correctCount * POINTS_PER_QUESTION;
		var total = BASE_POINTS + earned;
		var panel = document.getElementById('score-panel');

		panel.classList.add('visible');
		document.getElementById('score-value').textContent = total.toFixed(2) + ' / 10 points';
		document.getElementById('score-detail').textContent = correctCount + ' of ' + questions.length +
			' correct (' + earned.toFixed(2) + ' pts) + ' + BASE_POINTS + ' base point. Unanswered: ' + unanswered + '.';

		panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	function resetQuiz() {
		document.getElementById('quiz-form').reset();
		document.getElementById('score-panel').classList.remove('visible');
		questions.forEach(function (q, i) {
			var questionEl = document.getElementById('question-' + i);
			var feedbackEl = document.getElementById('feedback-' + i);
			questionEl.classList.remove('checked-correct', 'checked-wrong');
			feedbackEl.className = 'feedback';
			feedbackEl.innerHTML = '';
			questionEl.querySelectorAll('.option').forEach(function (opt) {
				opt.classList.remove('selected-correct', 'selected-wrong', 'correct-answer');
				var oldBadge = opt.querySelector('.answer-badge');
				if (oldBadge) oldBadge.remove();
			});
		});
	}

	renderCodeFiles();
	renderQuestions();
	document.getElementById('check-btn').addEventListener('click', checkAnswers);
	document.getElementById('reset-btn').addEventListener('click', resetQuiz);

	var backToTop = document.getElementById('back-to-top');
	if (backToTop) {
		backToTop.addEventListener('click', function () {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		});
	}
	window.addEventListener('scroll', function () {
		document.body.classList.toggle('scrolled', window.scrollY > 300);
	});
})();
