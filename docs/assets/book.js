/* 학습 교재 런타임 — textbook-html 스킬 동봉본
   - 외부 의존 없음. file:// 로 열려도 동작한다 (fetch / module script 미사용)
   - 담당: 목차 사이드바, 화면 넘김, 진행률, 퀴즈 채점, Before/After 탭,
           용어 툴팁, 코드 하이라이팅, 진도 저장
   - 교재마다 고쳐야 하는 곳은 아래 [교재별] 다섯 블록뿐이다. 그 밖은 손대지 않는다. */
(function () {
  'use strict';

  /* ── [교재별 1/5] 교재 제목 — 사이드바 머리와 표지에 쓰인다 ──── */
  var TITLE = 'DB 설계 첫걸음';
  var SUBTITLE = '동백커피로 배우는 정규화·제약·스키마 진화';

  /* ── [교재별 2/5] 책 전체 목차 — 모든 페이지가 공유하는 단일 진실 원천 ──
        커리큘럼이 확정되면 이 배열을 그대로 옮겨 적는다.
        screens/hours 는 커리큘럼의 값. part 는 사이드바의 묶음 제목.
        ready:true 인 장만 링크가 되고 "이어서 읽기" 대상이 된다 —
        집필 전 장은 ready 를 빼 두면 목차에 회색으로 남는다. */
  var BOOK = [
    { id: 'ch00', num: '0장', title: '이 교재를 읽는 방법과 동백커피 이야기', part: '입문', screens: 8, hours: 1.25, ready: true },
    { id: 'ch01', num: '1장', title: '엑셀 한 장의 고통: 나쁜 설계와 이상현상', part: '입문', screens: 12, hours: 2.0, ready: true },
    { id: 'ch02', num: '2장', title: '테이블 나누기: 엔터티·키·관계', part: '기본 이론', screens: 13, hours: 2.5, ready: true },
    { id: 'ch03', num: '3장', title: '정규화: 나눈 설계를 검증하는 도구', part: '기본 이론', screens: 16, hours: 3.0, ready: true },
    { id: 'ch04', num: '4장', title: '제약조건: 규칙을 DB에 맡기기', part: '기본 이론', screens: 11, hours: 2.0, ready: true },
    { id: 'ch05', num: '5장', title: '옵션과 세트: 변형이 폭발하는 메뉴', part: '요구사항 변화', screens: 13, hours: 2.5 },
    { id: 'ch06', num: '6장', title: '가격이 변할 때: 스냅샷·이력·할인·멤버십', part: '요구사항 변화', screens: 13, hours: 2.5 },
    { id: 'ch07', num: '7장', title: '데이터가 커질 때: 인덱스와 의도적 비정규화', part: '운영 접점', screens: 12, hours: 2.25 },
    { id: 'ch08', num: '8장', title: '동시에 들어올 때: 트랜잭션과 제약', part: '운영 접점', screens: 14, hours: 2.5 },
    { id: 'ch09', num: '9장', title: '가게가 늘어날 때: 스키마를 데이터째 바꾸기', part: '운영 접점', screens: 13, hours: 2.5 },
    { id: 'ch10', num: '10장', title: '마무리: 언제 깨고, 언제 쓰지 말까', part: '마무리', screens: 7, hours: 1.0 },
    { id: 'glossary', num: '부록', title: '용어집', part: '부록', screens: 1, hours: 0 }
  ];

  /* ── [교재별 3/5] 용어집 — 툴팁의 원천 ────────────────────────
        본문의 <span class="term" data-term="키">낱말</span> 이 이 표에서 뜻을 찾는다.
        표에 없는 키를 쓰면 툴팁이 조용히 안 나온다(점검 절차의 termsMissing 이 잡는다).
        _smoke 항목은 _smoke.html 이 참조하므로 지우지 않는다. */
  var TERMS = {
    _smoke: '스모크 점검용 항목 — 이 줄은 지우지 않는다.',
    table: '테이블(릴레이션) — 같은 모양의 행을 모은 표. 엑셀 시트와 달리 행 순서가 없고, 열마다 타입이 있고, 제약이 붙는다.',
    dbms: 'DBMS(Database Management System, 데이터베이스 관리 시스템) — 데이터를 저장하고 꺼내 주고 규칙을 지켜 주는 프로그램. PostgreSQL, MySQL, SQLite가 DBMS다. "DB"는 데이터 자체를, DBMS는 그것을 관리하는 소프트웨어를 가리키지만 일상에서는 섞어 쓴다.',
    schema: '스키마 — 어떤 테이블이 있고 각 테이블에 어떤 열과 규칙이 있는지 정한 설계. 데이터(행)가 아니라 그 데이터를 담는 틀이다.',
    pk: '기본키(PK, Primary Key) — 행 하나를 유일하게 가리키는 열(들). 같은 값이 두 행에 있을 수 없고 비어 있을 수 없다.',
    fk: '외래키(FK, Foreign Key) — 다른 테이블의 행을 가리키는 열. 없는 행을 가리키는 값은 DB가 막는다. C++ 포인터와 닮았지만 댕글링을 DB가 막아 준다는 점이 다르다.',
    constraint: '제약조건 — 데이터가 지켜야 할 규칙을 DB에 선언한 것(NOT NULL, UNIQUE, CHECK, 외래키 등). 어기는 입력은 DB가 거부한다.',
    index: '인덱스 — 원하는 행을 빨리 찾게 해 주는 색인 구조. 제약조건과 목적이 다르다(찾기 속도 vs 규칙 강제). 자세히는 7장.',
    transaction: '트랜잭션 — 여러 작업을 한 묶음으로 처리해 전부 성공하거나 전부 취소되게 하는 단위. 자세히는 8장.',
    anomaly: '이상현상 — 같은 사실이 여러 곳에 적히거나 서로 다른 종류의 사실이 한 행에 섞여서, 고치기·넣기·지우기에서 생기는 오류(갱신·삽입·삭제 이상). 버그가 아니라 설계 결함이다.',
    redundancy: '중복 — 같은 사실이 둘 이상의 자리에 저장된 것. 값이 우연히 같은 것과는 다르다.',
    integrity: '무결성 — 데이터가 서로 모순되지 않고 정해진 규칙에 맞는 상태.',
    entity: '엔터티 — 요구사항에서 독립해서 구별되고 여러 사실이 딸린 대상(메뉴, 회원, 주문). 나중에 테이블이 된다.',
    attribute: '속성 — 엔터티에 딸린 정보 하나(메뉴의 이름, 가격). 나중에 테이블의 열이 된다.',
    candkey: '후보키 — 행을 유일하게 구별하면서(유일성) 열을 하나라도 빼면 그 성질이 깨지는(최소성) 열 조합. 그중 대표로 뽑은 것이 기본키다.',
    natkey: '자연키 — 업무에 원래 있는 값을 그대로 키로 쓴 것(전화번호, 이메일). 바뀔 수 있다는 것이 약점이다.',
    surkey: '대리키 — 의미 없이 시스템이 붙인 번호를 키로 쓴 것(member_id). 값이 바뀌지 않지만 같은 사람인지는 알려 주지 못한다.',
    cardinality: '카디널리티 — 관계에서는 두 엔터티가 몇 대 몇으로 이어지는가(1:N, N:M). 인덱스 문맥(7장)에서는 열이 가진 서로 다른 값의 수를 뜻해 다른 개념이다.',
    refint: '참조 무결성 — 외래키가 가리키는 행이 실제로 존재한다는 보장. 없는 행을 가리키는 값은 DB가 거부한다.',
    erd: 'ER 다이어그램 — 엔터티(상자), 속성, 키, 관계(선, 1과 N)를 한 장에 그린 설계도.',
    fd: '함수 종속(FD) — A 값이 정해지면 B 값이 하나로 정해지는 관계(A → B). 데이터가 아니라 업무 규칙이다. 왼쪽 A를 결정자라고 부른다.',
    determinant: '결정자 — 함수 종속 A → B 의 왼쪽 A. 이 값이 정해지면 오른쪽 값이 하나로 정해진다.',
    atomic: '원자값 — 업무에서 더 쪼개면 뜻이 깨지는 값 하나. 한 칸에 목록을 넣지 않는 것이 1NF의 요구다.',
    partdep: '부분 종속 — 복합 키의 일부만으로 정해지는 열이 있는 상태. 2NF가 금지한다.',
    transdep: '이행 종속 — 키가 아닌 열이 다른 키가 아닌 열을 거쳐서 정해지는 상태(키 → 열 → 열). 3NF가 금지한다.',
    derived: '파생값 — 다른 열에서 계산할 수 있는 값(합계 = 단가 × 수량). 저장하면 원본과 어긋날 위험이 생긴다.',
    lossless: '무손실 분해 — 표를 나눈 뒤 다시 이었을 때 원래의 행이 정확히 복원되는 분해. 공통 열이 한쪽 표의 후보키이면 보장된다.',
    join: '조인(JOIN) — 두 테이블의 행을 키가 같은 것끼리 이어 붙여 한 결과 표로 만드는 조회.',
    null: 'NULL — 값이 없다 또는 알 수 없다는 표시. 0도 빈 글자도 아니다. NULL과의 비교는 참도 거짓도 아닌 "알 수 없음"이 되어 NULL = NULL 도 참이 아니다. NULL 여부는 IS NULL 로 묻는다.',
    tvl: '3값 논리 — SQL의 조건식이 참·거짓·알 수 없음 세 가지 결과를 갖는 셈법. WHERE 는 참인 행만 남기고, CHECK 는 거짓인 행만 거부하므로 알 수 없음이면 통과한다.',
    floatpt: '부동소수점(float) — 2진수로 실수를 근사해 저장하는 타입. 0.1 같은 값을 정확히 담지 못해 금액에는 쓰지 않는다. 정확한 십진수는 NUMERIC.',
    defaultval: 'DEFAULT — INSERT 에서 그 열을 적지 않았을 때 DB가 대신 넣는 값. 규칙이 아니라 편의이며, 열에 NULL을 명시하면 적용되지 않는다.',
    unique: 'UNIQUE — 같은 값이 두 행에 있을 수 없게 하는 제약. 기본키와 달리 한 표에 여러 개 둘 수 있고 PostgreSQL에서는 NULL 을 여러 행에 넣을 수 있다.',
    check: 'CHECK — 한 행의 값이 조건식을 만족해야 저장되게 하는 제약. 그 행의 열만 볼 수 있고, 조건이 NULL(알 수 없음)이면 통과한다.',
    ondelete: 'ON DELETE — 외래키가 가리키는 행(부모)을 지울 때 참조하는 행(자식)을 어떻게 할지 정하는 절. NO ACTION(기본)·RESTRICT 는 거부, CASCADE 는 함께 삭제, SET NULL·SET DEFAULT 는 값 변경.',
    softdelete: '소프트 삭제 — 행을 실제로 지우지 않고 "쓰지 않음" 표시(판매중지 플래그)만 남기는 방식. 과거 기록이 가리키는 행을 보존한다.'
  };

  /* ── [교재별 4/5] 진도 저장 키 — 교재 슬러그를 접두어로 둔다 ─────
        file:// 에서는 로컬로 열린 모든 페이지가 저장소를 공유하므로,
        접두어가 겹치면 다른 교재의 진도를 덮어쓴다. */
  var STORE_KEY = 'dbdesign-book:progress';

  /* ── 진도 저장 (file:// 에서는 모든 로컬 페이지가 저장소를 공유하므로
        키에 반드시 접두어를 붙인다) ──────────────────────────────── */
  function loadProgress() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveProgress(p) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(p)); } catch (e) { /* 저장 못해도 교재는 동작한다 */ }
  }

  /* ── [교재별 5/5] 코드 하이라이터 키워드 ──────────────────────
        기본은 Python. 다른 언어면 이 목록만 교체한다.
        한 교재에 언어가 둘이면 합집합으로 둔다 — 오탐이 조금 늘지만 충분하다.
        주석·문자열 표기 자체가 다른 언어(슬래시 두 개로 주석을 여는 계열 등)는
        아래 PY_RE 의 첫 두 그룹도 함께 고쳐야 한다. */
  var PY_KW = 'False|None|True|and|as|assert|async|await|break|class|continue|def|del|elif|' +
              'else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|' +
              'pass|raise|return|try|while|with|yield|match|case|' +
              /* SQL — 대문자로 쓰는 것이 이 교재의 규약(하이라이터가 대소문자를 구분한다) */
              'SELECT|FROM|WHERE|GROUP|BY|ORDER|HAVING|JOIN|INNER|LEFT|RIGHT|OUTER|ON|USING|' +
              'INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|ALTER|DROP|TABLE|INDEX|VIEW|ADD|COLUMN|' +
              'PRIMARY|KEY|FOREIGN|REFERENCES|UNIQUE|CHECK|NOT|NULL|DEFAULT|CONSTRAINT|CASCADE|RESTRICT|' +
              'BEGIN|COMMIT|ROLLBACK|FOR|DISTINCT|AS|IN|IS|LIKE|BETWEEN|EXISTS|CASE|WHEN|THEN|ELSE|END|' +
              'LIMIT|OFFSET|UNION|ALL|ANY|RETURNING|WITH|EXCLUDE|EXPLAIN|ANALYZE|TRUE|FALSE|AND|OR|' +
              'COUNT|SUM|AVG|MIN|MAX|COALESCE|NOW|GENERATED|ALWAYS|IDENTITY|' +
              'INTEGER|INT|BIGINT|SMALLINT|NUMERIC|TEXT|VARCHAR|BOOLEAN|DATE|TIMESTAMP|TIMESTAMPTZ|' +
              'GENERATED|ALWAYS|IDENTITY|SERIAL';

  var PY_RE = new RegExp(
    '(#[^\\n]*|--[^\\n]*)' +
    '|([fFrRbBuU]{0,2}(?:"""[\\s\\S]*?"""|\'\'\'[\\s\\S]*?\'\'\'|"(?:\\\\.|[^"\\\\\\n])*"|\'(?:\\\\.|[^\'\\\\\\n])*\'))' +
    '|(@[A-Za-z_][\\w.]*)' +
    '|\\b(def|class)(\\s+)([A-Za-z_]\\w*)' +
    '|\\b(self|cls)\\b' +
    '|\\b(' + PY_KW + ')\\b' +
    '|\\b(\\d[\\d_]*(?:\\.\\d+)?)\\b',
    'g');

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function highlightPython(src) {
    return esc(src).replace(PY_RE, function (m, com, str, dec, defkw, gap, name, slf, kw, num) {
      if (com) return '<span class="tok-com">' + com + '</span>';
      if (str) return '<span class="tok-str">' + str + '</span>';
      if (dec) return '<span class="tok-dec">' + dec + '</span>';
      if (defkw) return '<span class="tok-kw">' + defkw + '</span>' + gap + '<span class="tok-fn">' + name + '</span>';
      if (slf) return '<span class="tok-self">' + slf + '</span>';
      if (kw) return '<span class="tok-kw">' + kw + '</span>';
      if (num) return '<span class="tok-num">' + num + '</span>';
      return m;
    });
  }

  /* code 안의 텍스트 노드만 색칠한다. 저자가 직접 넣은 <b class="hl"> 같은
     강조 표시를 지우지 않기 위한 방식. */
  function highlightAll(root) {
    var blocks = root.querySelectorAll('pre > code, pre code.python');
    Array.prototype.forEach.call(blocks, function (code) {
      if (code.dataset.hl === 'done' || code.classList.contains('plain')) return;
      var texts = [];
      var walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT, null, false);
      while (walker.nextNode()) texts.push(walker.currentNode);
      texts.forEach(function (t) {
        var span = document.createElement('span');
        span.innerHTML = highlightPython(t.nodeValue);
        t.parentNode.replaceChild(span, t);
      });
      code.dataset.hl = 'done';
    });
  }

  /* ── 용어 툴팁 ──────────────────────────────────────────────── */
  function initTerms(root) {
    Array.prototype.forEach.call(root.querySelectorAll('.term[data-term]'), function (el) {
      var def = TERMS[el.dataset.term];
      if (!def) return;
      el.setAttribute('data-def', def);
      el.setAttribute('tabindex', '0');
    });
  }

  /* ── Before / After 탭 ──────────────────────────────────────── */
  function initTabs(root) {
    Array.prototype.forEach.call(root.querySelectorAll('.tabs'), function (wrap) {
      if (wrap.dataset.init) return;
      var tabs = wrap.querySelectorAll(':scope > .tab');
      if (!tabs.length) return;
      var bar = document.createElement('div');
      bar.className = 'tabbar';
      Array.prototype.forEach.call(tabs, function (tab, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = tab.dataset.label || ('탭 ' + (i + 1));
        b.addEventListener('click', function () {
          Array.prototype.forEach.call(bar.children, function (x, j) { x.classList.toggle('on', i === j); });
          Array.prototype.forEach.call(tabs, function (x, j) { x.classList.toggle('on', i === j); });
        });
        bar.appendChild(b);
        tab.classList.toggle('on', i === 0);
      });
      bar.children[0].classList.add('on');
      wrap.insertBefore(bar, wrap.firstChild);
      wrap.dataset.init = '1';
    });
  }

  /* ── 퀴즈 ───────────────────────────────────────────────────── */
  function initQuiz(root) {
    Array.prototype.forEach.call(root.querySelectorAll('.quiz'), function (quiz, qi) {
      if (quiz.dataset.init) return;
      var answer = parseInt(quiz.dataset.answer, 10);
      var opts = quiz.querySelectorAll('ol.options > li');

      var qn = quiz.querySelector('.qn');
      if (!qn) {
        qn = document.createElement('p');
        qn.className = 'qn';
        qn.textContent = '퀴즈 ' + (qi + 1);
        quiz.insertBefore(qn, quiz.firstChild);
      }

      Array.prototype.forEach.call(opts, function (li, i) {
        if (li.dataset.why) {
          var why = document.createElement('div');
          why.className = 'why';
          why.textContent = li.dataset.why;
          li.appendChild(why);
        }
        li.addEventListener('click', function () {
          if (quiz.classList.contains('done')) return;
          var picked = i + 1;
          li.classList.add('picked', picked === answer ? 'pick-good' : 'pick-bad');
          if (picked !== answer && opts[answer - 1]) {
            opts[answer - 1].classList.add('pick-good', 'picked');
          }
          quiz.classList.add('done');
        });
      });
      quiz.dataset.init = '1';
    });
  }

  /* ── 목차 사이드바 ──────────────────────────────────────────── */
  function buildSidebar(currentId, screenTitles, onJump) {
    var progress = loadProgress();
    var toc = document.createElement('nav');
    toc.id = 'toc';

    var brand = document.createElement('a');
    brand.className = 'brand';
    brand.href = 'index.html';
    brand.innerHTML = '<b>' + TITLE + '</b><span>' + SUBTITLE + '</span>';
    toc.appendChild(brand);

    var lastPart = null;
    BOOK.forEach(function (ch) {
      if (ch.part !== lastPart) {
        lastPart = ch.part;
        var p = document.createElement('div');
        p.className = 'part';
        p.textContent = ch.part;
        toc.appendChild(p);
      }
      var done = progress[ch.id] && progress[ch.id].done;
      var label = '<em>' + ch.num + (done ? ' <span class="tick">✓</span>' : '') + '</em>' + ch.title;
      var node;
      if (ch.ready) {
        node = document.createElement('a');
        node.className = 'ch';
        node.href = ch.id + '.html';
      } else {
        node = document.createElement('span');
        node.className = 'ch';
        node.title = '아직 집필 전입니다';
      }
      node.innerHTML = label;
      toc.appendChild(node);

      if (ch.id === currentId) {
        node.classList.add('here');
        if (screenTitles && screenTitles.length) {
          var ol = document.createElement('ol');
          ol.className = 'screens';
          screenTitles.forEach(function (t, i) {
            var li = document.createElement('li');
            var b = document.createElement('button');
            b.type = 'button';
            b.textContent = (i + 1) + '. ' + t;
            b.addEventListener('click', function () { onJump(i); });
            li.appendChild(b);
            ol.appendChild(li);
          });
          toc.appendChild(ol);
        }
      }
    });

    document.body.appendChild(toc);

    var toggle = document.createElement('button');
    toggle.id = 'toc-toggle';
    toggle.type = 'button';
    toggle.textContent = '☰';
    toggle.setAttribute('aria-label', '목차 열기');
    toggle.addEventListener('click', function () { document.body.classList.toggle('toc-open'); });
    document.body.appendChild(toggle);

    return toc;
  }

  /* ── 장 페이지 초기화 ───────────────────────────────────────── */
  function initChapter() {
    var chId = document.documentElement.dataset.chapter;
    var idx = -1;
    BOOK.forEach(function (c, i) { if (c.id === chId) idx = i; });
    var meta = BOOK[idx] || { num: '', title: document.title };

    var book = document.getElementById('book');
    var screens = book.querySelectorAll('.screen');
    if (!screens.length) return;

    var titles = Array.prototype.map.call(screens, function (s, i) {
      return s.dataset.title || (i + 1) + '번째 화면';
    });

    var cur = 0;

    var bar = document.createElement('div');
    bar.id = 'progress';
    bar.innerHTML = '<i></i>';
    document.body.appendChild(bar);
    var fill = bar.firstChild;

    var nav = document.createElement('div');
    nav.id = 'nav';
    nav.innerHTML =
      '<button type="button" id="prev">← 이전</button>' +
      '<div class="where"><b>' + meta.num + '</b> · 화면 <b class="cnt"></b></div>' +
      '<button type="button" id="next">다음 →</button>';
    document.body.appendChild(nav);

    var prevBtn = nav.querySelector('#prev');
    var nextBtn = nav.querySelector('#next');
    var cnt = nav.querySelector('.cnt');

    var toc = buildSidebar(chId, titles, function (i) {
      show(i);
      document.body.classList.remove('toc-open');
    });
    var screenItems = toc.querySelectorAll('ol.screens > li');

    function neighbourReady(step) {
      var j = idx + step;
      while (j >= 0 && j < BOOK.length) {
        if (BOOK[j].ready) return BOOK[j];
        j += step;
      }
      return null;
    }
    var prevCh = neighbourReady(-1);
    var nextCh = neighbourReady(1);

    // writeLast=false 이면 이 장의 진도만 남기고 '이어서 읽기' 기준점은 건드리지 않는다.
    // (#s5 같은 딥링크로 특정 화면만 열어볼 때 기준점이 그리로 끌려가는 것을 막는다)
    function remember(writeLast) {
      var p = loadProgress();
      var rec = p[chId] || {};
      rec.screen = cur;
      if (cur === screens.length - 1) rec.done = true;
      p[chId] = rec;
      if (writeLast) p['_last'] = { id: chId, screen: cur };
      saveProgress(p);
    }

    function show(i, silentLast) {
      cur = Math.max(0, Math.min(screens.length - 1, i));
      Array.prototype.forEach.call(screens, function (s, j) {
        s.classList.toggle('is-active', j === cur);
      });
      Array.prototype.forEach.call(screenItems, function (li, j) {
        li.classList.toggle('on', j === cur);
      });
      cnt.textContent = (cur + 1) + ' / ' + screens.length;
      fill.style.width = ((cur + 1) / screens.length * 100) + '%';

      prevBtn.disabled = (cur === 0 && !prevCh);
      nextBtn.disabled = (cur === screens.length - 1 && !nextCh);
      prevBtn.textContent = (cur === 0 && prevCh) ? '← ' + prevCh.num : '← 이전';
      nextBtn.textContent = (cur === screens.length - 1 && nextCh) ? nextCh.num + ' →' : '다음 →';

      window.scrollTo(0, 0);
      remember(!silentLast);
    }

    prevBtn.addEventListener('click', function () {
      if (cur === 0) { if (prevCh) location.href = prevCh.id + '.html#last'; return; }
      show(cur - 1);
    });
    nextBtn.addEventListener('click', function () {
      if (cur === screens.length - 1) { if (nextCh) location.href = nextCh.id + '.html'; return; }
      show(cur + 1);
    });

    document.addEventListener('keydown', function (e) {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      var t = e.target.tagName;
      if (t === 'INPUT' || t === 'TEXTAREA') return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); nextBtn.click(); }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prevBtn.click(); }
    });

    highlightAll(book);
    initTerms(book);
    initTabs(book);
    initQuiz(book);

    // 시작 화면 결정: #last → 마지막, #s3 → 3번째, 그 외에는 저장된 진도
    var start = 0;
    var hash = location.hash;
    if (hash === '#last') {
      start = screens.length - 1;
    } else if (/^#s\d+$/.test(hash)) {
      start = parseInt(hash.slice(2), 10) - 1;
    } else {
      var saved = loadProgress()[chId];
      if (saved && typeof saved.screen === 'number') start = saved.screen;
    }
    show(start, !!hash);
  }

  /* ── 표지(index.html) 초기화 ────────────────────────────────── */
  function initCover() {
    var progress = loadProgress();
    var list = document.getElementById('toc-list');
    if (list) {
      var lastPart = null;
      BOOK.forEach(function (ch) {
        if (ch.part !== lastPart) {
          lastPart = ch.part;
          var h = document.createElement('div');
          h.className = 'parts';
          h.textContent = ch.part;
          list.appendChild(h);
        }
        var li = document.createElement('li');
        var done = progress[ch.id] && progress[ch.id].done;
        var meta = ch.hours ? (ch.screens + '화면 · ' + ch.hours + '시간') : '';
        var inner =
          '<span class="n">' + ch.num + '</span>' +
          '<span class="t">' + ch.title + (done ? ' <span class="tick">✓</span>' : '') + '</span>' +
          '<span class="meta">' + (ch.ready ? meta : '집필 예정') + '</span>';
        if (ch.ready) {
          li.innerHTML = '<a href="' + ch.id + '.html">' + inner + '</a>';
        } else {
          li.innerHTML = '<span class="off">' + inner + '</span>';
        }
        list.appendChild(li);
      });
    }

    var resume = document.getElementById('resume');
    if (resume) {
      var last = progress['_last'];
      var target = BOOK[0];
      if (last) {
        BOOK.forEach(function (c) { if (c.id === last.id && c.ready) target = c; });
      }
      if (last && target.id === last.id && last.screen > 0) {
        resume.href = target.id + '.html#s' + (last.screen + 1);
        resume.textContent = '이어서 읽기 — ' + target.num + ' 화면 ' + (last.screen + 1);
      } else {
        resume.href = target.id + '.html';
        resume.textContent = '처음부터 읽기 — ' + target.num;
      }
    }

    highlightAll(document);
    initTerms(document);
    initTabs(document);
    initQuiz(document);
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (document.documentElement.dataset.page === 'cover') initCover();
    else initChapter();
  });
})();
