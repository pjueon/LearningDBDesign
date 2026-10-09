/* 학습 교재 런타임
   - 외부 의존 없음. file:// 로 열려도 동작한다 (fetch / module script 미사용)
   - 담당: 목차 사이드바, 페이지 넘김, 진행률, 퀴즈 채점, Before/After 탭,
           용어 툴팁, 페이지 참조 링크(이동·돌아가기), 코드 하이라이팅, 진도 저장
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
    { id: 'ch04', num: '4장', title: '제약조건: 규칙을 DB에 맡기기', part: '기본 이론', screens: 11, hours: 2.25, ready: true },
    { id: 'ch05', num: '5장', title: '옵션과 세트: 변형이 폭발하는 메뉴', part: '요구사항 변화', screens: 13, hours: 3.0, ready: true },
    { id: 'ch06', num: '6장', title: '가격이 변할 때: 스냅샷·이력·할인·멤버십', part: '요구사항 변화', screens: 13, hours: 3.0, ready: true },
    { id: 'ch07', num: '7장', title: '데이터가 커질 때: 인덱스와 의도적 비정규화', part: '운영 접점', screens: 12, hours: 2.25, ready: true },
    { id: 'ch08', num: '8장', title: '동시에 들어올 때: 트랜잭션과 제약', part: '운영 접점', screens: 14, hours: 2.5, ready: true },
    { id: 'ch09', num: '9장', title: '가게가 늘어날 때: 스키마를 데이터째 바꾸기', part: '운영 접점', screens: 13, hours: 3.0, ready: true },
    { id: 'ch10', num: '10장', title: '마무리: 언제 깨고, 언제 쓰지 말까', part: '마무리', screens: 8, hours: 1.25, ready: true },
    { id: 'glossary', num: '부록', title: '용어집', part: '부록', screens: 9, hours: 0.5, ready: true }
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
    determinant: '결정자 — 함수 종속 A → B의 왼쪽 A. 이 값이 정해지면 오른쪽 값이 하나로 정해진다.',
    atomic: '원자값 — 업무에서 더 쪼개면 뜻이 깨지는 값 하나. 한 칸에 목록을 넣지 않는 것이 1NF의 요구다.',
    partdep: '부분 종속 — 복합 키의 일부만으로 정해지는 키가 아닌 열이 있는 상태. 2NF가 금지한다.',
    transdep: '이행 종속 — 키가 아닌 열이 다른 키가 아닌 열을 거쳐서 정해지는 상태(키 → 열 → 열). 3NF가 금지한다.',
    derived: '파생값 — 다른 열에서 계산할 수 있는 값(합계 = 단가 × 수량). 저장하면 원본과 어긋날 위험이 생긴다.',
    lossless: '무손실 분해 — 표를 나눈 뒤 다시 이었을 때 원래의 행이 정확히 복원되는 분해. 공통 열이 한쪽 표의 후보키이면 보장된다.',
    join: '조인(JOIN) — 두 테이블의 행을 키가 같은 것끼리 이어 붙여 한 결과 표로 만드는 조회.',
    null: 'NULL — 값이 없다 또는 알 수 없다는 표시. 0도 빈 글자도 아니다. NULL과의 비교는 참도 거짓도 아닌 "알 수 없음"이 되어 NULL = NULL도 참이 아니다. NULL 여부는 IS NULL로 묻는다.',
    tvl: '3값 논리 — SQL의 조건식이 참·거짓·알 수 없음 세 가지 결과를 갖는 셈법. WHERE는 참인 행만 남기고, CHECK는 거짓인 행만 거부하므로 알 수 없음이면 통과한다.',
    floatpt: '부동소수점(float) — 2진수로 실수를 근사해 저장하는 타입. 0.1 같은 값을 정확히 담지 못해 금액에는 쓰지 않는다. 정확한 십진수는 NUMERIC.',
    defaultval: 'DEFAULT — INSERT에서 그 열을 적지 않았을 때 DB가 대신 넣는 값. 규칙이 아니라 편의이며, 열에 NULL을 명시하면 적용되지 않는다.',
    unique: 'UNIQUE — 같은 값이 두 행에 있을 수 없게 하는 제약. 기본키와 달리 한 표에 여러 개 둘 수 있고 PostgreSQL에서는 NULL을 여러 행에 넣을 수 있다.',
    check: 'CHECK — 한 행의 값이 조건식을 만족해야 저장되게 하는 제약. 그 행의 열만 볼 수 있고, 조건이 NULL(알 수 없음)이면 통과한다.',
    ondelete: 'ON DELETE — 외래키가 가리키는 행(부모)을 지울 때 참조하는 행(자식)을 어떻게 할지 정하는 절. NO ACTION(기본)·RESTRICT는 거부, CASCADE는 함께 삭제, SET NULL·SET DEFAULT는 값 변경.',
    softdelete: '소프트 삭제 — 행을 실제로 지우지 않고 "쓰지 않음" 표시(판매중지 플래그)만 남기는 방식. 과거 기록이 가리키는 행을 보존한다.',
    option: '옵션 — 손님이 메뉴에 덧붙이거나 바꾸는 선택지 하나(샷 추가, 얼음 적게). 메뉴를 바꾸지만 다른 메뉴로 만들지는 않으며, 가격이 붙고 0원일 수도 있다. 세트와 달리 메뉴를 묶지 않는다.',
    optgroup: '옵션 그룹 — 같은 종류의 옵션을 모은 묶음(샷, 시럽, 얼음). 그룹마다 고를 수 있는 개수의 범위(최소~최대)를 가진다.',
    setmenu: '세트 — 여러 메뉴를 묶어 하나의 가격으로 파는 상품(음료 + 케이크). 옵션이 메뉴를 바꾼다면 세트는 메뉴를 묶는다.',
    slot: '구성 슬롯 — 세트 안에서 채워야 하는 자리(음료 1, 디저트 1). 슬롯마다 들어갈 수 있는 후보 메뉴가 정해져 있다.',
    compfk: '복합 외래키 — 열 둘 이상을 한 덩어리로 묶어 다른 표의 복합키를 가리키는 외래키. 열 조합 전체가 그 표에 있는 행이어야 저장된다.',
    selfref: '자기 참조 — 외래키가 같은 표의 기본키를 가리키는 것(분류의 상위 분류). 트리를 한 표에 담는 방법이다.',
    recursive: '재귀 조회(WITH RECURSIVE) — 조회 결과를 다시 조회의 입력으로 넣어 트리를 위아래로 끝까지 따라가는 SQL 문법.',
    eav: 'EAV(Entity-Attribute-Value) — 속성 이름과 값을 행으로 쌓는 설계(엔터티, 속성 이름, 값 세 열). 열을 늘리지 않고 속성을 더할 수 있지만 타입·제약·외래키·조회를 잃는다.',
    snapshot: '스냅샷 — 주문을 만들 때 그 순간의 이름·단가·옵션가를 주문 라인에 복사해 둔 값. 메뉴가 바뀌어도 고치지 않는다. 지금 값과 잠시 같을 뿐 의미가 다른 사실이라 중복이 아니다.',
    history: '이력 — 값이 바뀐 내역을 기간과 함께 쌓아 둔 기록. 스냅샷이 "이 주문이 받은 값"이라면 이력은 "이 메뉴가 언제 얼마였나"이고, 잘못 적었으면 바로잡는다.',
    validity: '유효 기간 — 한 값이 참이던 기간 [시작, 끝). 이 교재는 시작 포함·끝 제외로 적고 끝이 NULL이면 지금도 유효하다는 뜻이다.',
    exclude: 'EXCLUDE 제약 — 조건을 만족하는 두 행이 함께 있으면 거부하는 PostgreSQL 제약. UNIQUE가 같은 값을 막는다면 EXCLUDE는 겹치는 구간도 막을 수 있다. 정수 열을 함께 쓰려면 btree_gist 확장이 필요하다.',
    promotion: '프로모션 — 기간을 정한 이벤트. 받는 주인이 없고 조건(기간, 대상 메뉴)만 맞으면 누구나 받는다. 회원이 받는 쿠폰, 회원의 상태인 등급과 구별된다.',
    coupon: '쿠폰 — 회원이 발급받아 한 번 쓰는 혜택. 종류(coupon)와 발급(coupon_issue)을 나누어 적는다. 사용 여부는 열로 저장하지 않고 할인 내역에서 유도한다.',
    grade: '멤버십 등급 — 회원에게 붙은 상시 자격(일반·실버·골드)과 등급별 할인율. 등급은 바뀌므로 주문이 그때의 등급을 스냅샷으로 가지고 있어야 한다.',
    ledger: '원장(ledger) — 증감 사건을 쌓기만 하는 표. 잔액은 사건의 합계로 구하고, 잘못은 고치지 않고 반대 방향의 행을 더해 바로잡는다. 덮어쓰는 잔액 열과 다르다.',
    partialidx: '부분 UNIQUE 인덱스 — WHERE 조건을 만족하는 행 사이에서만 유일성을 검사하는 인덱스(CREATE UNIQUE INDEX ... WHERE ...). "한 주문에 등급 할인은 한 번"처럼 조건부 유일성에 쓴다.',
    backfill: 'backfill — 새 열을 더한 뒤 이미 있던 행의 값을 채우는 작업. 채울 값을 지금 값에서 가져오면 "그 뒤로 바뀐 적이 없다"는 가정이 필요하다.',
    temporal: '시간 이력 테이블(temporal table) — 행에 시간 축(유효 시간, 기록 시간)을 붙여 관리하는 표. SQL:2011에 표준이 있고 제품마다 지원이 다르다. 두 시간을 모두 쓰면 양방향(bitemporal)이라 한다.',
    fullscan: '풀스캔(full scan) — 인덱스 없이 표의 모든 행을 처음부터 끝까지 읽으며 조건을 검사하는 것. PostgreSQL 실행 계획의 Seq Scan. 비용은 표의 페이지 수에 비례한다.',
    pagebuf: '페이지(버퍼) — DB가 디스크를 읽고 쓰는 고정 크기 덩어리(PostgreSQL은 8KB). 행 하나가 필요해도 그 행이 든 페이지 전체를 읽는다. 이 교재의 "읽은 페이지 수"가 비용의 척도다.',
    btree: 'B-tree — 값을 정렬해 페이지에 담고 루트·중간·잎의 나무로 쌓은 인덱스 구조. 모든 잎이 같은 깊이이고 한 페이지에 수백 개의 갈래가 있어 100만 행도 3~4쪽으로 찾는다. 등호·범위·정렬에 쓰이는 기본 인덱스 종류다.',
    compidx: '복합 인덱스 — 열 둘 이상을 앞 열부터 차례로 정렬해 담은 인덱스. 앞 열(선두 열)의 조건이 있어야 잘 쓰이고, 등호 조건 열을 앞에, 범위나 정렬 열을 뒤에 둔다.',
    selectivity: '선택도 — 조건 하나가 행을 얼마나 잘 걸러 내는가. 고르는 행의 비율이 작을수록 선택도가 높다고 말한다(비율 자체를 선택도라 부르는 문서도 있어 숫자는 거꾸로다). 인덱스는 선택도가 높은 조건에서 효과가 크다. 열의 카디널리티(서로 다른 값의 수)와 관련되지만 값의 분포에 따라 값마다 다르다.',
    explain: 'EXPLAIN — DB가 조회를 어떻게 실행할지의 계획을 보여 주는 명령. EXPLAIN ANALYZE는 실제로 실행해 실제 행 수와 시간을, BUFFERS는 읽은 페이지 수를 붙인다.',
    denorm: '비정규화 — 성능을 위해 정규화된 설계를 일부러 되돌려 같은 사실을 중복해 두는 것. 정규화를 안 한 것이 아니라 한 뒤에 되돌린 것이며, 어긋남을 막는 갱신 경로와 점검이 따라와야 한다.',
    summarytbl: '요약 테이블 — 원본을 미리 집계해 저장한 파생 표(일 매출 daily_sales). 읽는 단위에 맞춰 행 수를 줄여 조회를 빠르게 하지만 원본의 사본이라 어긋날 수 있다.',
    idempotent: '멱등 — 같은 작업을 몇 번 실행해도 한 번 실행한 것과 결과가 같은 성질. 지우고 다시 계산하기는 멱등이고 증감을 더하기는 아니다.',
    keyset: 'keyset 페이지네이션 — OFFSET으로 건너뛰는 대신 마지막으로 본 행의 키를 기억하고 그 이후를 조회하는 방식. 몇 번째 페이지든 읽는 양이 같다.',
    partition: '파티셔닝 — 큰 표를 기간 같은 기준으로 여러 물리 표(파티션)로 나누어 한 표처럼 쓰는 것. 기간 조회는 해당 파티션만 읽고 오래된 기간은 표째로 버릴 수 있다.',
    archive: '아카이브 — 오래된 행을 보관용 표로 옮기고 원본에서 지우는 것. 자식 표의 순서, 합계가 필요한 표(원장), 요약의 재생성 가능성을 따져야 한다.',
    stockitem: '재고 품목 — 수량을 세어 관리하는 대상 한 가지(치즈케이크, 원두). 손님이 사는 그대로인 완제품과 메뉴를 만드는 데 들어가는 원재료로 나뉜다. 남은 양은 기본 단위(g, ml, 개)의 정수로 저장한다.',
    recipe: '레시피(소요량) — 메뉴 1개 또는 옵션 1회가 재고 품목을 얼마나 쓰는지 적은 연결. 소요량은 (메뉴, 품목) 쌍에 딸린 값이라 연결 테이블의 속성이다.',
    acid: 'ACID — 트랜잭션이 지키는 네 성질. 원자성(전부 되거나 전부 안 됨), 일관성(커밋된 상태는 선언한 제약을 지킴), 격리성(동시 트랜잭션이 서로의 중간 상태를 못 봄, 정도를 고른다), 지속성(커밋은 서버가 꺼져도 남음). 일관성은 업무적 옳음을 뜻하지 않는다.',
    lock: '락(잠금) — 행을 고치는 트랜잭션이 끝날 때까지 다른 트랜잭션이 같은 행을 고치지 못하게 막는 표시. UPDATE가 자동으로 걸고 SELECT ... FOR UPDATE는 읽으면서 건다. 막힌 쪽은 기다린다. 일반 SELECT는 락을 걸지도 기다리지도 않는다.',
    race: '경쟁 상태(race condition) — 동시 요청의 실행 순서에 따라 결과가 달라지는 버그. 읽고 판단하고 쓰는 사이의 틈에서 생긴다.',
    lostupdate: '갱신 손실(lost update) — 두 트랜잭션이 같은 값을 읽고 각자 계산한 값을 써서 한쪽의 변경이 사라지는 사고. 앱이 계산한 값으로 덮어쓸 때 생긴다.',
    optlock: '낙관적 락 — 충돌이 드물다고 보고 미리 잠그지 않는 방식. 쓸 때 읽은 뒤로 바뀌지 않았는지(version 열 등)만 조건에 넣어 확인한다. 미리 잠그는 쪽은 비관적 락(FOR UPDATE)이다.',
    deadlock: '교착(데드락) — 두 트랜잭션이 서로 상대가 가진 락을 기다려 영원히 못 나아가는 상태. DB가 감지해 한쪽을 오류(40P01)로 중단시키며, 모두가 같은 순서로 락을 잡는 것이 예방이다.',
    isolation: '격리 수준 — 동시에 실행되는 트랜잭션이 서로의 변경을 얼마나 보는지 정하는 설정. PostgreSQL은 READ COMMITTED(기본), REPEATABLE READ, SERIALIZABLE. 올릴수록 보이는 것이 고정되지만 직렬화 실패(40001) 재시도가 필요해진다.',
    pickupslot: '픽업 슬롯 — 픽업 시간대 하나(30분 간격)와 그 정원. 주문 1건이 정원 1을 쓴다. 5장의 세트 구성 슬롯과는 다른 개념이다.',
    storescope: '매장 범위 — 표의 행이 매장 소유인지(store_id가 키나 열에 들어간다), 부모 행을 따라 매장을 아는지(상속, 열을 더하지 않는다), 모든 매장이 같은 행을 보는지(브랜드 공통)의 분류. 값이 매장마다 다른가, 한 매장의 사건인가, 부모로 알 수 있는가를 묻는다.',
    expandcontract: '확장→이전→축소(expand-contract) — 운영 중인 구조를 바꿀 때 새 구조를 옛 구조 옆에 더하고(확장), 새 앱을 배포하고 데이터를 채워 옮기고(이전), 아무도 옛 구조를 안 쓰는 것을 확인한 뒤 지우는(축소) 순서. 각 단계 사이에 옛 앱과 새 앱이 모두 동작해야 한다. 되돌릴 수 없는 일은 맨 끝에 몰아 둔다.',
    tablelock: '표 잠금 — 표 전체에 거는 락. ALTER TABLE은 대개 ACCESS EXCLUSIVE(읽기까지 막는 가장 센 락)를 요구하고, 그 표를 쓰는 트랜잭션이 끝나지 않았으면 기다린다. 기다리는 동안 뒤에 온 요청도 줄을 선다. 8장의 락은 행을 잠그고 표 잠금은 표 전체를 잠가서, 잠그는 대상이 다르다.',
    locktimeout: 'lock_timeout — 락을 이 시간 안에 못 얻으면 기다리지 않고 오류(55P03)로 포기하게 하는 설정. 스키마 변경이 줄을 세워 서비스를 멈추는 것을 막는다.',
    notvalid: 'NOT VALID — CHECK·외래키 제약을 "앞으로 들어오는 행만" 검사하는 상태로 걸고, 기존 행 검사는 나중에 VALIDATE CONSTRAINT로 하는 방법. 긴 검사가 쓰기를 막지 않는다. 단 기존 행을 UPDATE 하면 그 행은 검사된다.',
    multitenant: '멀티테넌시 — 여러 고객(여기서는 매장)이 한 시스템을 나눠 쓰는 구조. 같은 표에 store_id 열을 두는 공유 스키마, 고객마다 스키마를 나누는 방식, 고객마다 DB를 나누는 방식이 있다.',
    normalization: '정규화 — 함수 종속을 따라 표를 나눠 같은 사실이 한 곳에만 있게 하는 과정이자, 설계를 검증하는 도구. 단계가 정규형이다(1NF 원자값, 2NF 부분 종속 없음, 3NF 이행 종속 없음, 더 엄격한 BCNF). 이 교재는 3NF에서 멈추고, 값의 의미(그때의 가격인지 지금의 가격인지)까지는 보장하지 않는다.',
    orm: 'ORM(Object-Relational Mapping) — 표의 행과 프로그램의 객체를 자동으로 오가게 해 주는 라이브러리. 반복 코드가 줄지만 읽어서 고치고 저장하는 흐름이 8장의 읽고 판단하고 쓰기와 같아서, 낙관적 락 같은 보호를 직접 켜야 한다.',
    sqlstate: 'SQLSTATE — DB가 오류를 알릴 때 붙이는 다섯 글자 분류 코드(표준 SQL의 개념이고 PostgreSQL이 따른다). 23505 유일성 위반, 23503 외래키 위반, 23514 CHECK 위반, 40001 직렬화 실패, 40P01 교착, 55P03 락 시간 초과. 글자 P가 든 40P01, 55P03은 PostgreSQL이 따로 정한 코드다. 앱은 이 코드와 제약 이름으로 오류를 번역할지 재시도할지 구분한다.',
    linktable: '연결 테이블 — N:M 관계를 풀려고 두 표 사이에 끼운 표. 한 행이 두 엔터티의 짝 하나(이 주문에 이 메뉴)를 뜻하고, 관계 자체에 딸린 값(수량)이 여기에 자리를 얻는다.',
    compkey: '복합키(복합 키) — 열 둘 이상을 묶어 하나의 키로 쓴 것. 한 열만으로는 유일하지 않아도 조합이 유일하면 된다(order_line의 (order_id, menu_id)).',
    migration: '마이그레이션 — 스키마를 바꾸는 SQL을 번호 붙은 파일로 두고 순서대로 적용하며, 어디까지 적용했는지를 DB 안에 기록하는 방식. 실패하면 되돌릴 수 있는지를 단계마다 따진다.',
    commitrollback: '커밋/롤백 — 트랜잭션을 끝내는 두 방법. COMMIT은 묶음의 변경을 확정하고, ROLLBACK은 그 변경을 전부 버린다. 커밋 전의 변경은 다른 연결에 보이지 않는다.',
    pessimistic: '비관적 락 — 충돌이 잦다고 보고 읽을 때부터 행에 락을 걸어 두는 방식(SELECT ... FOR UPDATE). 락을 가지는 시간이 읽는 순간부터 커밋까지라 길어지기 쉽고, 충돌이 몰리는 곳에 어울린다.',
    deferrable: '지연 가능 제약(DEFERRABLE) — 검사를 저장할 때마다가 아니라 트랜잭션이 끝날 때(커밋)까지 미루도록 선언한 제약(DEFERRABLE INITIALLY DEFERRED). 이 교재는 외래키에서 다룬다. 지연 가능 제약이 필요한 설계는 중복 열을 만들고 그 열을 늘 맞춰야 하는 부담이 있어서 이 교재는 쓰지 않는다.'
  };

  /* ── [교재별 3/5 이어서] 규칙·미뤄 둔 문제·스키마 버전 번호 — 번호 툴팁의 원천 ──
        본문 텍스트의 C1~C17, D1~D5, v1~v7·v5.1 을 찾아 이 뜻을 툴팁으로 단다(마크업 불필요).
        번호를 다른 뜻으로 쓰는 일이 생기면 그 자리를 <code> 로 감싸면 건너뛴다. */
  var RULES = {
    C1: 'C1 · 주문은 라인이 1개 이상이다. DB 선언으로는 지키지 않고 앱 + 트랜잭션이 지킨다(4장에서 한계를 확인하고 8장에서 트랜잭션으로 지킨다).',
    C2: 'C2 · 라인 수량은 1 이상이다. CHECK로 DB가 지킨다(4장).',
    C3: 'C3 · 한 주문에서 같은 메뉴(5장부터는 같은 메뉴 + 옵션 조합)는 한 라인으로 합친다(4장 → 5장).',
    C4: 'C4 · 메뉴 이름은 겹치지 않는다. UNIQUE로 DB가 지킨다(4장).',
    C5: 'C5 · 없는 메뉴·회원·주문을 참조할 수 없다. 외래키로 DB가 지킨다(2장 → 4장).',
    C6: 'C6 · 메뉴를 내려도 과거 주문은 남는다. ON DELETE RESTRICT + 판매중지 표시(4장 → 6장).',
    C7: 'C7 · 주문 상태는 접수 → 제조중 → 완료 → 픽업 순으로만 가고, 취소는 접수·제조중에서만 된다. 값 목록은 CHECK, 순서는 앱(4장 → 8장).',
    C8: 'C8 · 주문 시점의 메뉴명·단가·옵션가를 주문에 복사해 둔다(스냅샷, 6장).',
    C9: 'C9 · 옵션 그룹마다 고를 수 있는 개수 범위가 있다(예: 샷 0~3, 시럽 0~1). 앱이 지킨다(5장).',
    C10: 'C10 · 세트는 구성 칸(음료 1 + 디저트 1)을 모두 채워야 한다. 앱 + 구성 테이블(5장).',
    C11: 'C11 · 쿠폰은 회원당 한 번만 쓸 수 있다. UNIQUE로 DB가 지킨다(6장 → 8장).',
    C12: 'C12 · 포인트 잔액은 음수가 될 수 없다. 원장 합계 검증 + 락(6장 → 8장).',
    C13: 'C13 · 재고는 음수가 될 수 없다. CHECK + 조건부 UPDATE(8장).',
    C14: 'C14 · 픽업 슬롯 정원을 넘길 수 없다(8장).',
    C15: 'C15 · 매장마다 판매 메뉴·가격이 다를 수 있다(9장).',
    C16: 'C16 · 스키마를 바꿔도 과거 데이터는 보존된다. 확장 → 이전 → 축소 절차(9장).',
    C17: 'C17 · 재료가 부족한 메뉴·옵션은 주문할 수 없다. 조회로 품절 표시, 주문 트랜잭션의 재고 차감으로 최종 확인(8장).',
    D1: 'D1 · 미뤄 둔 문제: 주문 라인이 단가를 갖지 않아 메뉴 가격을 고치면 과거 주문 금액이 바뀐다. 6장에서 해결한다.',
    D2: 'D2 · 미뤄 둔 문제: 모든 표가 매장 1개를 가정한다. 9장에서 해결한다.',
    D3: 'D3 · 미뤄 둔 문제: 라인 기본키가 (order_id, menu_id)라 같은 메뉴를 두 라인으로 못 담는다. 5장에서 해결한다.',
    D4: 'D4 · 미뤄 둔 문제: 주문 총액을 저장하지 않고 라인에서 계산한다. 7장에서 요약 테이블로 해결한다.',
    D5: 'D5 · 미뤄 둔 문제: C1(라인 1개 이상)을 DB 선언에 맡기지 않고 앱이 지킨다. 8장에서 트랜잭션으로 해결한다.',
    v1: 'v1 · 2장에서 만든 첫 스키마. menu, member, orders, order_line 표 4개.',
    v2: 'v2 · 3장에서 v1을 정규화로 검증한 결과. 표는 그대로다.',
    v3: 'v3 · 4장에서 v2에 제약조건(C1~C7)을 붙인 스키마.',
    v4: 'v4 · 5장에서 옵션·세트를 더한 스키마(표 11개).',
    v5: 'v5 · 6장에서 가격 이력·주문 스냅샷·쿠폰·멤버십·포인트 원장을 더한 스키마(표 17개).',
    'v5.1': 'v5.1 · 7장에서 인덱스와 일 매출 요약 표를 더한 스키마(표 18개).',
    v6: 'v6 · 8장에서 재고·레시피·픽업 슬롯을 더한 스키마(표 22개).',
    v7: 'v7 · 9장에서 매장과 매장별 메뉴·가격을 더한 스키마(표 25개).'
  };
  // 번호를 처음 소개하는 장. 그보다 앞 장에서는 뜻 대신 중립 문구를 띄워
  // 뒷장의 요구사항이 미리 드러나지 않게 한다.
  var RULE_INTRO = {
    C1: 4, C2: 4, C3: 4, C4: 4, C5: 4, C6: 4, C7: 4, C8: 6, C9: 5, C10: 5,
    C11: 6, C12: 6, C13: 8, C14: 8, C15: 9, C16: 9, C17: 8,
    D1: 2, D2: 2, D3: 2, D4: 3, D5: 4,
    v1: 2, v2: 3, v3: 4, v4: 5, v5: 6, 'v5.1': 7, v6: 8, v7: 9
  };
  function ruleDef(key, chNum) {
    var at = RULE_INTRO[key];
    if (chNum == null || !at || chNum >= at) return RULES[key];
    if (key.charAt(0) === 'C') return key + ' · ' + at + '장에서 정하는 규칙입니다.';
    if (key.charAt(0) === 'D') return key + ' · 지금은 일부러 미뤄 둔 문제의 번호입니다. 4장에서 목록으로 정리합니다.';
    return key + ' · ' + at + '장에서 만드는 스키마 버전입니다.';
  }

  /* ── [교재별 4/5] 진도 저장 키 — 교재 슬러그를 접두어로 둔다 ─────
        file:// 에서는 로컬로 열린 모든 페이지가 저장소를 공유하므로,
        접두어가 겹치면 다른 교재의 진도를 덮어쓴다. */
  var STORE_KEY = 'dbdesign-book:progress';
  var NAV_KEY = 'dbdesign-book:nav';     // '다음 장'으로 넘어왔는지 (sessionStorage)
  var BACK_KEY = 'dbdesign-book:back';   // 다른 장의 참조 링크를 누른 자리 (sessionStorage)

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
              'GENERATED|ALWAYS|IDENTITY|SERIAL|RECURSIVE|OVER|PARTITION|ROW_NUMBER|' +
              'EXTENSION|LEAD|VALID|TSTZRANGE|WITHOUT|OVERLAPS|' +
              'CONFLICT|DO|EXCLUDED|INCLUDE|DESC|ASC|AT|TIME|ZONE|FULL|RANGE|OF|TO|DETACH|ATTACH|' +
              'MATERIALIZED|REFRESH|CONCURRENTLY|' +
              'NOWAIT|SKIP|LOCKED|ISOLATION|LEVEL|READ|COMMITTED|REPEATABLE|SERIALIZABLE|' +
              'VALIDATE|RENAME|LOCK|SHARE|ROW|EXCLUSIVE|MODE';

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

  /* 말풍선은 body 에 하나만 두고 화면 안에 들어오게 자리를 잡는다.
     마우스를 올리거나, 탭(포커스)하면 뜨고, 벗어나거나 Esc 를 누르면 닫힌다. */
  var tip = null, tipFor = null;
  function showTip(el) {
    if (!tip) {
      tip = document.createElement('div');
      tip.id = 'tip';
      tip.setAttribute('role', 'tooltip');
      document.body.appendChild(tip);
    }
    tip.textContent = el.getAttribute('data-def');
    tip.classList.add('on');
    tipFor = el;
    var r = el.getBoundingClientRect();
    var vw = document.documentElement.clientWidth, vh = window.innerHeight;
    var w = tip.offsetWidth, h = tip.offsetHeight;
    var left = Math.max(8, Math.min(r.left, vw - w - 8));
    var top = r.bottom + 6;
    if (top + h > vh - 8 && r.top - h - 6 > 8) top = r.top - h - 6;
    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
  }
  function hideTip() {
    if (tip) tip.classList.remove('on');
    tipFor = null;
  }
  function initTip() {
    function termOf(e) { return e.target.closest ? e.target.closest('.term[data-def]') : null; }
    document.addEventListener('mouseover', function (e) { var t = termOf(e); if (t) showTip(t); });
    document.addEventListener('mouseout', function (e) {
      var t = termOf(e);
      if (t && t === tipFor && !t.contains(e.relatedTarget) && document.activeElement !== t) hideTip();
    });
    document.addEventListener('focusin', function (e) { var t = termOf(e); if (t) showTip(t); });
    document.addEventListener('focusout', function (e) { if (termOf(e) === tipFor) hideTip(); });
    window.addEventListener('scroll', hideTip, true);
    window.addEventListener('resize', hideTip);
  }

  /* ── 규칙·미뤄 둔 문제·버전 번호 툴팁, 페이지 참조 링크 ──────────────────────
     본문 텍스트에서 "N장 페이지 M", "페이지 N", C/D/v 번호를 찾아 바꾼다.
     코드, 이미 링크인 곳, kicker, 그림 안은 건드리지 않는다.
     링크로 만들고 싶지 않은 자리는 <code> 로 감싸면 건너뛴다. */
  var REF_RE = /(\d{1,2})장 페이지 (\d{1,2})((?:\s?[·,~]\s?\d{1,2})*)|페이지 (\d{1,2})(?!\d|개|페이지)((?:\s?[·,~]\s?\d{1,2})*)|(^|[^A-Za-z0-9_.])(C1[0-7]|C[1-9]|D[1-5]|v5\.1|v[1-7])(?![0-9A-Za-z_]|\.\d)/g;
  var SKIP_SEL = 'pre, code, a, button, svg, .kicker, .term, .cap, script, style, #tip';

  function chapterOf(num) {
    var id = 'ch' + (num < 10 ? '0' : '') + num;
    for (var i = 0; i < BOOK.length; i++) if (BOOK[i].id === id && BOOK[i].ready) return BOOK[i];
    return null;
  }

  function linkRefs(root, chId, screenCount) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!n.nodeValue || !/페이지 \d|[CDv]\d/.test(n.nodeValue)) return NodeFilter.FILTER_REJECT;
        return n.parentNode.closest(SKIP_SEL) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    }, false);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    var chNum = /^ch\d+$/.test(chId) ? parseInt(chId.slice(2), 10) : null;  // 용어집은 제한 없음

    nodes.forEach(function (node) {
      var text = node.nodeValue, frag = document.createDocumentFragment(), last = 0, m, changed = false;
      REF_RE.lastIndex = 0;
      function put(s) { if (s) frag.appendChild(document.createTextNode(s)); }
      // "페이지 4·6", "4장 페이지 2~3" 처럼 이어지는 번호도 하나씩 링크로 만든다
      function putList(prefix, first, tail, make) {
        var a = make(parseInt(first, 10), prefix + first);
        if (!a) return false;
        frag.appendChild(a);
        var re = /(\s?[·,~]\s?)(\d{1,2})/g, t;
        while ((t = re.exec(tail))) {
          put(t[1]);
          var b = make(parseInt(t[2], 10), t[2]);
          if (b) frag.appendChild(b); else put(t[2]);
        }
        return true;
      }
      while ((m = REF_RE.exec(text))) {
        var start = m.index;
        if (m[1]) {
          var ch = chapterOf(parseInt(m[1], 10));
          if (!ch) continue;
          put(text.slice(last, start));
          var sameCh = ch.id === chId;
          putList(m[1] + '장 페이지 ', m[2], m[3] || '', function (n, label) {
            if (n < 1 || n > ch.screens) return null;
            return sameCh ? makeXref(n, label) : makeChRef(ch, n, label);
          });
        } else if (m[4]) {
          if (!screenCount) continue;
          put(text.slice(last, start));
          if (!putList('페이지 ', m[4], m[5] || '', function (n, label) {
            return (n >= 1 && n <= screenCount) ? makeXref(n, label) : null;
          })) put(m[0]);
        } else {
          put(text.slice(last, start) + m[6]);
          var s = document.createElement('span');
          s.className = 'term rule';
          s.textContent = m[7];
          s.setAttribute('data-def', ruleDef(m[7], chNum));
          s.setAttribute('tabindex', '0');
          frag.appendChild(s);
        }
        last = REF_RE.lastIndex;
        changed = true;
      }
      if (!changed) return;
      put(text.slice(last));
      node.parentNode.replaceChild(frag, node);
    });
  }

  function makeXref(n, label) {
    var a = document.createElement('a');
    a.className = 'xref';
    a.href = '#s' + n;
    a.setAttribute('data-screen', n);
    a.textContent = label;
    return a;
  }
  function makeChRef(ch, n, label) {
    var a = document.createElement('a');
    a.className = 'xref xref-ch';
    a.href = ch.id + '.html#s' + n;
    a.textContent = label;
    a.title = ch.num + ' 페이지 ' + n + '(으)로 이동합니다';
    return a;
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
        // 키보드로도 고를 수 있게 한다(Tab 으로 옮기고 Enter·Space 로 고른다)
        li.setAttribute('tabindex', '0');
        li.setAttribute('role', 'button');
        li.addEventListener('keydown', function (e) {
          if (e.target !== li) return;
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); li.click(); }
        });
        li.addEventListener('click', function (e) {
          if (e.target.closest && e.target.closest('a, .term')) return;
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

    // 모바일에서 목차를 열면 본문을 막으로 덮고, 막을 누르면 닫는다
    var scrim = document.createElement('div');
    scrim.id = 'toc-scrim';
    scrim.addEventListener('click', function () { document.body.classList.remove('toc-open'); });
    document.body.appendChild(scrim);

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
      return s.dataset.title || (i + 1) + '번째 페이지';
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
      '<div class="where"><b>' + meta.num + '</b> · 페이지 <b class="cnt"></b></div>' +
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
    // (#s5 같은 딥링크로 특정 페이지만 열어볼 때 기준점이 그리로 끌려가는 것을 막는다)
    // 완독(✓)은 직전 페이지에서 '다음'으로 마지막 페이지에 왔을 때만 남긴다.
    function remember(writeLast, finished) {
      var p = loadProgress();
      var rec = p[chId] || {};
      rec.screen = cur;
      if (finished && cur === screens.length - 1) rec.done = true;
      p[chId] = rec;
      if (writeLast) p['_last'] = { id: chId, screen: cur };
      saveProgress(p);
    }

    // 주소의 #sN 을 지금 페이지에 맞춰 두면 새로고침·북마크가 그 페이지로 돌아온다.
    // push=true 이면 기록을 하나 쌓아 브라우저의 뒤로 가기로 돌아올 수 있게 한다.
    function setHash(push) {
      var h = '#s' + (cur + 1);
      try {
        if (push) history.pushState(null, '', h);
        else if (location.hash !== h) history.replaceState(null, '', h);
      } catch (e) { /* file:// 에서 막히는 브라우저가 있어도 페이지 넘김은 동작한다 */ }
    }

    function show(i, silentLast, finished, push) {
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

      // 사이드바의 현재 페이지 항목이 목차 밖으로 밀려나 있으면 보이게 굴린다(본문은 굴리지 않는다)
      var on = screenItems[cur];
      if (on) {
        var top = on.offsetTop, bottom = top + on.offsetHeight;
        if (top < toc.scrollTop + 40 || bottom > toc.scrollTop + toc.clientHeight - 40) {
          toc.scrollTop = top - toc.clientHeight / 3;
        }
      }

      hideTip();
      try { window.scrollTo({ top: 0, behavior: 'instant' }); } catch (e) { window.scrollTo(0, 0); }
      setHash(push);
      remember(!silentLast, finished);
    }

    prevBtn.addEventListener('click', function () {
      if (cur === 0) { if (prevCh) location.href = prevCh.id + '.html#last'; return; }
      show(cur - 1);
    });
    nextBtn.addEventListener('click', function () {
      if (cur === screens.length - 1) {
        if (nextCh) {
          // 다음 장은 늘 첫 페이지부터 연다. 차례대로 넘어온 것이므로 '이어서 읽기' 기준점도 옮긴다.
          try { sessionStorage.setItem(NAV_KEY, 'seq'); } catch (e) {}
          location.href = nextCh.id + '.html#s1';
        }
        return;
      }
      show(cur + 1, false, cur + 1 === screens.length - 1);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { hideTip(); document.body.classList.remove('toc-open'); return; }
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.repeat || e.defaultPrevented) return;
      var t = e.target;
      if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || (t.closest && t.closest('[role=slider]'))) return;
      // PageUp/PageDown 은 긴 화면을 굴리는 데 쓰이므로 가로채지 않는다
      if (e.key === 'ArrowRight') { e.preventDefault(); nextBtn.click(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prevBtn.click(); }
    });

    highlightAll(book);
    initTerms(book);
    linkRefs(book, chId, screens.length);
    initTabs(book);
    initQuiz(book);
    initTip();

    /* ── 페이지 참조: 같은 장이면 바로 이동하고, 돌아가기 버튼을 띄운다 ── */
    var back = null;
    function showBack(label, onBack) {
      if (!back) {
        back = document.createElement('div');
        back.id = 'xback';
        back.innerHTML = '<a href="#"></a><button type="button" aria-label="돌아가기 버튼 닫기">✕</button>';
        document.body.appendChild(back);
        back.querySelector('button').addEventListener('click', function () { back.classList.remove('on'); });
      }
      var link = back.querySelector('a');
      link.textContent = '← ' + label + '(으)로 돌아가기';
      link.onclick = function (e) { e.preventDefault(); back.classList.remove('on'); onBack(); };
      back.classList.add('on');
    }

    function jumpTo(n) {
      var from = cur;
      show(n - 1, false, false, true);
      showBack('페이지 ' + (from + 1), function () { show(from, false, false, true); });
    }

    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a.xref');
      if (!a) return;
      if (a.classList.contains('xref-ch')) {
        try { sessionStorage.setItem(BACK_KEY, JSON.stringify({ id: chId, num: meta.num, screen: cur + 1 })); } catch (err) {}
        return;  // 다른 장은 그대로 이동한다
      }
      e.preventDefault();
      e.stopPropagation();
      var n = parseInt(a.getAttribute('data-screen'), 10);
      if (n - 1 !== cur) jumpTo(n);  // 같은 장: 바로 이동하고 돌아가기 버튼을 띄운다
    }, true);

    // 브라우저의 뒤로/앞으로 가기로 #sN 이 바뀌면 그 페이지를 보인다
    window.addEventListener('popstate', function () {
      var m = /^#s(\d+)$/.exec(location.hash);
      if (m) show(parseInt(m[1], 10) - 1);
      if (back) back.classList.remove('on');
    });
    window.addEventListener('hashchange', function () {
      var m = /^#s(\d+)$/.exec(location.hash);
      if (m && parseInt(m[1], 10) - 1 !== cur) show(parseInt(m[1], 10) - 1);
    });
    window.addEventListener('beforeprint', function () {
      Array.prototype.forEach.call(document.querySelectorAll('details.fold'), function (d) { d.open = true; });
    });

    // 시작 페이지 결정: #last → 마지막, #s3 → 3번째, 그 외에는 저장된 진도
    var start = 0;
    var hash = location.hash;
    var seq = false;
    try { seq = sessionStorage.getItem(NAV_KEY) === 'seq'; sessionStorage.removeItem(NAV_KEY); } catch (e) {}
    if (hash === '#last') {
      start = screens.length - 1;
    } else if (/^#s\d+$/.test(hash)) {
      start = parseInt(hash.slice(2), 10) - 1;
    } else {
      var saved = loadProgress()[chId];
      if (saved && typeof saved.screen === 'number') start = saved.screen;
    }
    show(start, !!hash && !seq);

    // 다른 장의 참조 링크로 왔으면 원래 자리로 돌아가는 버튼을 띄운다
    try {
      var from = JSON.parse(sessionStorage.getItem(BACK_KEY) || 'null');
      sessionStorage.removeItem(BACK_KEY);
      if (from && from.id !== chId) {
        showBack(from.num + ' 페이지 ' + from.screen, function () { location.href = from.id + '.html#s' + from.screen; });
      }
    } catch (e) {}
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
        var meta = ch.hours ? (ch.screens + '페이지 · ' + ch.hours + '시간') : '';
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
        resume.textContent = '이어서 읽기 — ' + target.num + ' 페이지 ' + (last.screen + 1);
      } else {
        resume.href = target.id + '.html';
        resume.textContent = '처음부터 읽기 — ' + target.num;
      }
    }

    highlightAll(document);
    initTerms(document);
    initTabs(document);
    initQuiz(document);
    initTip();
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (document.documentElement.dataset.page === 'cover') initCover();
    else initChapter();
  });
})();
