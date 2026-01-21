// 분석 결과 페이지 JavaScript

// 데이터 저장소
let personalityTypes = {};
let indicatorsData = {};
let chatHistory = [];
let analysisResult = null;
let isUnlocked = false; // 잠금 해제 상태

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // 1. JSON 데이터 로드
        await loadData();

        // 2. 대화 히스토리 로드
        loadChatHistory();

        // 3. 지표 계산
        const indicators = calculateIndicators();

        // 4. 성격 유형 매칭
        const matchedType = matchPersonalityType(indicators);

        // 5. 분석 결과 생성
        analysisResult = generateAnalysisResult(matchedType, indicators);

        // 6. 페이지 렌더링
        renderAll();

        // 7. 광고 이벤트 리스너 설정
        setupAdListeners();

        // 8. 이전에 잠금 해제했는지 확인
        checkUnlockStatus();

    } catch (error) {
        console.error('분석 초기화 오류:', error);
        showError();
    }
});

// JSON 데이터 로드
async function loadData() {
    const [typesResponse, indicatorsResponse] = await Promise.all([
        fetch('/static/data/personality-types.json'),
        fetch('/static/data/indicators.json')
    ]);

    const typesData = await typesResponse.json();
    const indicatorsJson = await indicatorsResponse.json();

    personalityTypes = typesData.types;
    indicatorsData = indicatorsJson;
}

// 대화 히스토리 로드
function loadChatHistory() {
    const stored = sessionStorage.getItem('chatHistory');
    if (stored) {
        chatHistory = JSON.parse(stored);
    } else {
        // 데모용 샘플 데이터
        chatHistory = generateSampleHistory();
    }
}

// 샘플 히스토리 생성 (데모용)
function generateSampleHistory() {
    return [
        { role: 'assistant', content: '안녕하세요! 만나서 반가워요 😊' },
        { role: 'user', content: '안녕하세요! 저도 반가워요~' },
        { role: 'assistant', content: '오늘 날씨가 좋네요. 뭐하고 계셨어요?' },
        { role: 'user', content: '그냥 집에서 쉬고 있었어요. 요즘 좀 바빴거든요 ㅎㅎ' },
        { role: 'assistant', content: '아 그렇구나, 많이 힘드셨겠다' },
        { role: 'user', content: '네 좀 그랬어요. 근데 이제 좀 여유가 생겨서 다행이에요!' },
        { role: 'assistant', content: '다행이네요! 뭐 특별히 하고 싶은 거 있어요?' },
        { role: 'user', content: '음... 여행 가고 싶긴 한데, 어디가 좋을까요?' },
        { role: 'assistant', content: '여행이라! 국내 vs 해외 중에 어디가 더 끌려요?' },
        { role: 'user', content: '국내가 좋을 것 같아요. 가볍게 다녀올 수 있으니까요. 추천해주실 곳 있어요?' }
    ];
}

// 지표 계산
function calculateIndicators() {
    const userMessages = chatHistory.filter(m => m.role === 'user');

    if (userMessages.length === 0) {
        return getDefaultIndicators();
    }

    // 1. 평균 메시지 길이 (0-100 점수로 변환)
    const avgLength = userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length;
    const messageLength = normalizeScore(avgLength, 10, 150);

    // 2. 응답 속도 (데모에서는 랜덤 값 사용, 실제로는 타임스탬프 필요)
    const responseTime = Math.floor(Math.random() * 40) + 30; // 30-70 사이

    // 3. 질문 비율
    const questionCount = userMessages.filter(m =>
        m.content.includes('?') ||
        m.content.match(/뭐|어디|언제|왜|어떻게|누구|할까|일까|인가/)
    ).length;
    const questionRatio = (questionCount / userMessages.length) * 100;

    // 4. 감정 표현 밀도
    const emotionDensity = calculateEmotionDensity(userMessages);

    // 5. 구조화 지수
    const structureScore = calculateStructureScore(userMessages);

    return {
        messageLength: Math.round(messageLength),
        responseTime: Math.round(responseTime),
        questionRatio: Math.round(questionRatio),
        emotionDensity: Math.round(emotionDensity),
        structureScore: Math.round(structureScore)
    };
}

// 감정 표현 밀도 계산
function calculateEmotionDensity(messages) {
    const { emotionKeywords } = indicatorsData;
    const allKeywords = [
        ...emotionKeywords.positive,
        ...emotionKeywords.negative,
        ...emotionKeywords.exclamations
    ];

    let emotionCount = 0;
    let emojiCount = 0;

    messages.forEach(m => {
        const content = m.content;

        // 감정 키워드 체크
        allKeywords.forEach(keyword => {
            if (content.includes(keyword)) emotionCount++;
        });

        // 이모지 체크 (유니코드 이모지 패턴)
        const emojiMatches = content.match(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[ㅋㅎㅠㅜ]{2,}/gu);
        if (emojiMatches) emojiCount += emojiMatches.length;

        // 느낌표 체크
        const exclamationMatches = content.match(/!/g);
        if (exclamationMatches) emotionCount += exclamationMatches.length * 0.5;
    });

    const totalScore = (emotionCount + emojiCount * 2) / messages.length * 20;
    return Math.min(100, totalScore);
}

// 구조화 지수 계산
function calculateStructureScore(messages) {
    const { structurePatterns } = indicatorsData;
    let structureCount = 0;

    messages.forEach(m => {
        const content = m.content;

        // 번호 매기기 체크
        structurePatterns.numbering.forEach(pattern => {
            if (content.includes(pattern)) structureCount += 2;
        });

        // 글머리 기호 체크
        structurePatterns.bullets.forEach(pattern => {
            if (content.includes(pattern)) structureCount += 1;
        });

        // 요약 표현 체크
        structurePatterns.summary.forEach(pattern => {
            if (content.includes(pattern)) structureCount += 1.5;
        });

        // 줄바꿈 체크
        const lineBreaks = (content.match(/\n/g) || []).length;
        structureCount += lineBreaks * 0.5;
    });

    const score = (structureCount / messages.length) * 25;
    return Math.min(100, score);
}

// 점수 정규화 (0-100)
function normalizeScore(value, min, max) {
    const normalized = ((value - min) / (max - min)) * 100;
    return Math.max(0, Math.min(100, normalized));
}

// 기본 지표 (데이터 없을 때)
function getDefaultIndicators() {
    return {
        messageLength: 50,
        responseTime: 50,
        questionRatio: 25,
        emotionDensity: 40,
        structureScore: 30
    };
}

// 성격 유형 매칭
function matchPersonalityType(indicators) {
    const typeScores = {};

    // 각 유형별 점수 계산
    Object.keys(personalityTypes).forEach(typeCode => {
        const type = personalityTypes[typeCode];
        let score = 0;

        // 각 지표별로 유형 특성과 비교
        Object.keys(type.traits).forEach(traitKey => {
            const traitValue = type.traits[traitKey];
            const userValue = indicators[traitKey];

            score += calculateTraitMatch(traitKey, traitValue, userValue);
        });

        typeScores[typeCode] = score;
    });

    // 가장 높은 점수의 유형 반환
    const sortedTypes = Object.entries(typeScores)
        .sort((a, b) => b[1] - a[1]);

    return sortedTypes[0][0]; // 최고 점수 유형 코드
}

// 특성 매칭 점수 계산
function calculateTraitMatch(traitKey, traitValue, userValue) {
    const thresholds = indicatorsData.indicators[traitKey]?.thresholds;
    if (!thresholds) return 0;

    let userLevel;

    // 사용자 값을 레벨로 변환
    if (traitKey === 'responseTime') {
        if (userValue <= thresholds.fast.max) userLevel = 'fast';
        else if (userValue >= thresholds.slow.min) userLevel = 'slow';
        else userLevel = 'medium';
    } else {
        if (userValue <= thresholds.low.max) userLevel = 'low';
        else if (userValue >= thresholds.high.min) userLevel = 'high';
        else userLevel = 'medium';
    }

    // 유형 특성과 비교
    if (traitValue === userLevel) return 20;
    if (traitValue === 'medium' || userLevel === 'medium') return 10;
    return 0;
}

// 분석 결과 생성
function generateAnalysisResult(typeCode, indicators) {
    const type = personalityTypes[typeCode];

    return {
        type: typeCode,
        typeData: type,
        indicators: indicators,
        strengths: type.strengths,
        weaknesses: type.weaknesses,
        improvements: type.improvements
    };
}

// 전체 렌더링
function renderAll() {
    renderPersonalityType();
    renderRadarChart();
    renderStrengths();
    renderWeaknesses();
    renderImprovements();
    // 개인 맞춤 분석 (잠금 콘텐츠)
    renderPersonalAnalysis();
    renderDetailList();
    renderPersonalTips();
}

// 성격 유형 렌더링
function renderPersonalityType() {
    const { typeData } = analysisResult;

    document.getElementById('typeBadge').textContent = typeData.code;
    document.getElementById('typeBadge').style.background = `linear-gradient(135deg, ${typeData.color}, ${adjustColor(typeData.color, 20)})`;
    document.getElementById('typeTitle').textContent = `${typeData.emoji} ${typeData.name}`;
    document.getElementById('typeDescription').textContent = typeData.description;
}

// 레이더 차트 렌더링
function renderRadarChart() {
    const ctx = document.getElementById('radarChart').getContext('2d');
    const { indicators } = analysisResult;

    const labels = Object.keys(indicatorsData.indicators).map(key =>
        indicatorsData.indicators[key].shortName
    );
    const scores = Object.keys(indicatorsData.indicators).map(key => indicators[key]);

    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: '나의 점수',
                data: scores,
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                borderColor: '#10B981',
                borderWidth: 3,
                pointBackgroundColor: '#10B981',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    min: 0,
                    ticks: {
                        stepSize: 20,
                        font: { size: 11 },
                        backdropColor: 'transparent'
                    },
                    pointLabels: {
                        font: { size: 13, weight: '600' },
                        color: '#2D3436'
                    },
                    grid: { color: 'rgba(16, 185, 129, 0.1)' },
                    angleLines: { color: 'rgba(16, 185, 129, 0.2)' }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#fff',
                    titleColor: '#2D3436',
                    bodyColor: '#636E72',
                    borderColor: '#10B981',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: (context) => `점수: ${context.raw}점`
                    }
                }
            }
        }
    });

    renderChartLegend(scores);
}

// 차트 범례 렌더링
function renderChartLegend(scores) {
    const legendContainer = document.getElementById('chartLegend');
    const indicatorKeys = Object.keys(indicatorsData.indicators);

    let html = '';
    indicatorKeys.forEach((key, index) => {
        const indicator = indicatorsData.indicators[key];
        const score = scores[index];
        html += `
            <div class="legend-item">
                <span class="legend-dot" style="background: ${getScoreColor(score)}"></span>
                <span>${indicator.shortName}</span>
                <span class="legend-value">${score}점</span>
            </div>
        `;
    });

    legendContainer.innerHTML = html;
}

// 장점 렌더링
function renderStrengths() {
    const container = document.getElementById('strengthsList');
    container.innerHTML = analysisResult.strengths
        .map(s => `<li>${s}</li>`)
        .join('');
}

// 단점 렌더링
function renderWeaknesses() {
    const container = document.getElementById('weaknessesList');
    container.innerHTML = analysisResult.weaknesses
        .map(w => `<li>${w}</li>`)
        .join('');
}

// 개선 방향 렌더링
function renderImprovements() {
    const container = document.getElementById('improvementContent');
    container.innerHTML = analysisResult.improvements
        .map((item, index) => `
            <div class="improvement-item">
                <div class="improvement-number">${index + 1}</div>
                <div class="improvement-text">
                    <h4>${item.title}</h4>
                    <p>${item.description}</p>
                </div>
            </div>
        `)
        .join('');
}

// 상세 지표 렌더링
function renderDetailList() {
    const container = document.getElementById('detailList');
    const { indicators } = analysisResult;

    container.innerHTML = Object.keys(indicatorsData.indicators)
        .map(key => {
            const indicator = indicatorsData.indicators[key];
            const score = indicators[key];
            const feedback = getIndicatorFeedback(key, score);
            return `
                <div class="detail-item">
                    <div class="detail-header">
                        <span class="detail-name">
                            <span>${indicator.icon}</span>
                            ${indicator.name}
                        </span>
                        <span class="detail-score">${score}점</span>
                    </div>
                    <div class="detail-bar">
                        <div class="detail-bar-fill" style="width: ${score}%"></div>
                    </div>
                    <p class="detail-description">${feedback}</p>
                </div>
            `;
        })
        .join('');

    // 애니메이션
    setTimeout(() => {
        document.querySelectorAll('.detail-bar-fill').forEach(bar => {
            bar.style.transition = 'width 1s ease';
        });
    }, 100);
}

// 지표별 개인 피드백 생성
function getIndicatorFeedback(key, score) {
    const feedbacks = {
        messageLength: {
            high: `평균 ${Math.round(score * 1.5)}자의 메시지를 작성했어요. 풍부한 표현으로 생각을 잘 전달하는 편이에요.`,
            medium: `적절한 길이의 메시지를 작성했어요. 상황에 따라 유연하게 표현하는 스타일이에요.`,
            low: `간결하고 핵심적인 메시지를 작성했어요. 효율적인 소통을 선호하는 스타일이에요.`
        },
        responseTime: {
            fast: `빠르게 응답하는 편이에요. 즉각적인 반응으로 대화가 활발하게 진행됩니다.`,
            medium: `적절한 속도로 응답했어요. 생각을 정리한 후 답변하는 균형잡힌 스타일이에요.`,
            slow: `신중하게 응답하는 편이에요. 깊이 있는 답변을 준비하는 스타일이에요.`
        },
        questionRatio: {
            high: `전체 대화의 ${score}%가 질문이었어요. 상대방에게 관심을 표현하고 대화를 이끌어가는 스타일이에요.`,
            medium: `질문과 답변의 균형이 좋아요. 자연스러운 대화 흐름을 만들어요.`,
            low: `자신의 이야기를 주로 전달했어요. 명확한 의사 표현을 하는 스타일이에요.`
        },
        emotionDensity: {
            high: `감정 표현이 풍부해요! 이모지와 감탄사를 활용해 따뜻한 분위기를 만들었어요.`,
            medium: `적절한 감정 표현을 했어요. 상황에 맞게 리액션하는 스타일이에요.`,
            low: `차분하고 담백한 표현을 했어요. 내용 중심의 대화를 선호하는 스타일이에요.`
        },
        structureScore: {
            high: `체계적으로 메시지를 구성했어요. 정리된 표현으로 명확하게 전달해요.`,
            medium: `자연스러운 구조로 메시지를 작성했어요. 읽기 편한 대화를 만들어요.`,
            low: `자유로운 형식으로 표현했어요. 편안하고 친근한 대화 스타일이에요.`
        }
    };

    let level;
    if (key === 'responseTime') {
        level = score <= 30 ? 'fast' : score >= 70 ? 'slow' : 'medium';
    } else {
        level = score >= 70 ? 'high' : score <= 30 ? 'low' : 'medium';
    }

    return feedbacks[key]?.[level] || indicatorsData.indicators[key]?.description || '';
}

// 개인 맞춤 분석 렌더링
function renderPersonalAnalysis() {
    const container = document.getElementById('personalAnalysis');
    const { indicators } = analysisResult;
    const userMessages = chatHistory.filter(m => m.role === 'user');

    // 실제 대화 통계
    const totalMessages = userMessages.length;
    const avgLength = totalMessages > 0
        ? Math.round(userMessages.reduce((sum, m) => sum + m.content.length, 0) / totalMessages)
        : 0;
    const questionCount = userMessages.filter(m => m.content.includes('?')).length;
    const emojiCount = userMessages.reduce((count, m) => {
        const matches = m.content.match(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[ㅋㅎㅠㅜ]{2,}/gu);
        return count + (matches ? matches.length : 0);
    }, 0);

    // 자주 사용한 표현 분석
    const expressions = analyzeExpressions(userMessages);

    container.innerHTML = `
        <div class="personal-stats">
            <h4>📊 나의 대화 통계</h4>
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-value">${totalMessages}</span>
                    <span class="stat-label">총 메시지</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${avgLength}자</span>
                    <span class="stat-label">평균 길이</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${questionCount}개</span>
                    <span class="stat-label">질문 수</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${emojiCount}개</span>
                    <span class="stat-label">이모지 사용</span>
                </div>
            </div>
        </div>

        <div class="personal-expressions">
            <h4>💬 나의 대화 특징</h4>
            <ul class="expression-list">
                ${expressions.map(exp => `<li>${exp}</li>`).join('')}
            </ul>
        </div>
    `;
}

// 표현 분석
function analyzeExpressions(messages) {
    const expressions = [];
    const allText = messages.map(m => m.content).join(' ');

    // 질문 패턴
    const questionCount = messages.filter(m => m.content.includes('?')).length;
    if (questionCount > messages.length * 0.3) {
        expressions.push('상대방에게 질문을 자주 하며 관심을 표현했어요');
    } else if (questionCount < messages.length * 0.1) {
        expressions.push('자신의 이야기를 중심으로 대화를 이끌었어요');
    }

    // 긍정 표현
    const positiveWords = ['좋아', '좋은', '좋네', '좋겠', '감사', '고마', '기쁘', '행복', '최고'];
    const hasPositive = positiveWords.some(word => allText.includes(word));
    if (hasPositive) {
        expressions.push('긍정적인 표현을 사용해 밝은 분위기를 만들었어요');
    }

    // 공감 표현
    const empathyWords = ['그렇구나', '알겠', '이해', '맞아', '진짜', '정말'];
    const hasEmpathy = empathyWords.some(word => allText.includes(word));
    if (hasEmpathy) {
        expressions.push('공감 표현을 통해 상대방의 말에 반응했어요');
    }

    // 이모지/감탄사
    const emojiMatches = allText.match(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[ㅋㅎㅠㅜ]{2,}/gu);
    if (emojiMatches && emojiMatches.length > messages.length * 0.5) {
        expressions.push('이모지와 감탄사로 감정을 적극적으로 표현했어요');
    }

    // 장문/단문
    const avgLength = messages.reduce((sum, m) => sum + m.content.length, 0) / messages.length;
    if (avgLength > 50) {
        expressions.push('자세하고 풍부한 표현으로 생각을 전달했어요');
    } else if (avgLength < 20) {
        expressions.push('간결하고 핵심적인 메시지로 소통했어요');
    }

    // 기본 표현이 없으면 추가
    if (expressions.length < 2) {
        expressions.push('자연스럽고 편안한 대화 스타일을 보여줬어요');
    }

    return expressions.slice(0, 4); // 최대 4개
}

// 개인 맞춤 개선 포인트 렌더링
function renderPersonalTips() {
    const container = document.getElementById('personalTips');
    const { indicators } = analysisResult;

    const tips = generatePersonalTips(indicators);

    container.innerHTML = `
        <div class="tips-list">
            ${tips.map((tip, index) => `
                <div class="tip-item">
                    <div class="tip-number">${index + 1}</div>
                    <div class="tip-content">
                        <h4>${tip.title}</h4>
                        <p>${tip.description}</p>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// 개인 맞춤 팁 생성
function generatePersonalTips(indicators) {
    const tips = [];

    // 가장 낮은 지표 찾기
    const sortedIndicators = Object.entries(indicators)
        .sort((a, b) => a[1] - b[1]);

    const lowest = sortedIndicators[0];
    const secondLowest = sortedIndicators[1];

    // 낮은 지표에 따른 팁
    const tipsByIndicator = {
        messageLength: {
            title: '표현 풍부하게 하기',
            description: '간결한 것도 좋지만, 가끔은 자신의 생각이나 경험을 더 자세히 나눠보세요. 상대방이 당신을 더 잘 이해할 수 있어요.'
        },
        responseTime: {
            title: '적극적으로 반응하기',
            description: '완벽한 답변이 아니어도 괜찮아요. 먼저 간단히 반응하고, 이어서 생각을 덧붙여 보세요.'
        },
        questionRatio: {
            title: '질문으로 관심 표현하기',
            description: '상대방에게 질문을 던져보세요. "그래서 어떻게 됐어요?", "그건 어떤 느낌이었어요?" 같은 질문이 대화를 풍성하게 만들어요.'
        },
        emotionDensity: {
            title: '감정 표현 더하기',
            description: '가끔은 이모지나 감탄사를 사용해 보세요. "와 정말요?" 같은 표현이 상대방에게 관심을 전달해요.'
        },
        structureScore: {
            title: '생각 정리해서 전달하기',
            description: '여러 가지를 말할 때는 번호를 붙이거나 줄을 나눠보세요. 상대방이 이해하기 쉬워져요.'
        }
    };

    // 낮은 2개 지표에 대한 팁 추가
    if (lowest[1] < 50 && tipsByIndicator[lowest[0]]) {
        tips.push(tipsByIndicator[lowest[0]]);
    }
    if (secondLowest[1] < 50 && tipsByIndicator[secondLowest[0]]) {
        tips.push(tipsByIndicator[secondLowest[0]]);
    }

    // 높은 지표에 대한 강화 팁
    const highest = sortedIndicators[sortedIndicators.length - 1];
    const strengthTips = {
        messageLength: { title: '당신의 강점 활용하기', description: '풍부한 표현력이 장점이에요. 다만 상대방도 말할 기회를 주는 것을 잊지 마세요.' },
        questionRatio: { title: '당신의 강점 활용하기', description: '질문을 잘 하는 것이 장점이에요. 상대방의 답변에 대한 리액션도 함께 해주면 더 좋아요.' },
        emotionDensity: { title: '당신의 강점 활용하기', description: '감정 표현이 풍부한 것이 장점이에요. 진심이 느껴지는 표현을 계속 유지해 주세요.' }
    };

    if (highest[1] >= 70 && strengthTips[highest[0]]) {
        tips.push(strengthTips[highest[0]]);
    }

    // 최소 2개 팁 보장
    if (tips.length < 2) {
        tips.push({
            title: '대화 연습하기',
            description: '다양한 주제로 대화해 보세요. 연습할수록 자신만의 대화 스타일이 더 발전해요.'
        });
    }

    return tips.slice(0, 3); // 최대 3개
}

// 에러 표시
function showError() {
    document.getElementById('typeTitle').textContent = '분석 오류';
    document.getElementById('typeDescription').textContent = '분석 중 오류가 발생했습니다. 다시 시도해주세요.';
}

// 유틸리티 함수
function getScoreColor(score) {
    if (score >= 70) return '#10B981';
    if (score >= 40) return '#F59E0B';
    return '#EF4444';
}

function adjustColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 +
        (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)
    ).toString(16).slice(1);
}

// 결과 공유하기
function shareResult() {
    const { typeData } = analysisResult;
    const shareText = `나의 대화 첫인상 유형은 "${typeData.code} - ${typeData.name}"이에요! ChatPression에서 확인해 보세요.`;

    if (navigator.share) {
        navigator.share({
            title: 'ChatPression - 대화 분석 결과',
            text: shareText,
            url: window.location.origin
        }).catch(() => fallbackShare(shareText));
    } else {
        fallbackShare(shareText);
    }
}

function fallbackShare(text) {
    navigator.clipboard.writeText(text)
        .then(() => alert('결과가 클립보드에 복사되었습니다!'))
        .catch(() => alert('공유 기능을 사용할 수 없습니다.'));
}

// ========== 광고 관련 함수 ==========

// 광고 이벤트 리스너 설정
function setupAdListeners() {
    const watchAdBtn = document.getElementById('watchAdBtn');
    const skipAdBtn = document.getElementById('skipAdBtn');

    if (watchAdBtn) {
        watchAdBtn.addEventListener('click', showAdModal);
    }

    if (skipAdBtn) {
        skipAdBtn.addEventListener('click', closeAdAndUnlock);
    }
}

// 잠금 해제 상태 확인
function checkUnlockStatus() {
    const unlocked = sessionStorage.getItem('analysisUnlocked');
    if (unlocked === 'true') {
        unlockContent();
    }
}

// 광고 모달 표시
function showAdModal() {
    const modal = document.getElementById('adModal');
    modal.classList.add('show');

    // 광고 타이머 시작
    startAdTimer();
}

// 광고 타이머
let adTimerInterval = null;
const AD_DURATION = 15; // 15초

function startAdTimer() {
    let timeLeft = AD_DURATION;
    const timerEl = document.getElementById('adTimer');
    const progressBar = document.getElementById('adProgressBar');
    const skipBtn = document.getElementById('skipAdBtn');
    const skipBtnText = document.getElementById('skipBtnText');

    // 초기화
    timerEl.textContent = timeLeft;
    progressBar.style.width = '0%';
    skipBtn.disabled = true;
    skipBtnText.textContent = `${timeLeft}초 후 건너뛰기`;

    adTimerInterval = setInterval(() => {
        timeLeft--;
        timerEl.textContent = timeLeft;

        // 프로그레스 바 업데이트
        const progress = ((AD_DURATION - timeLeft) / AD_DURATION) * 100;
        progressBar.style.width = `${progress}%`;

        // 버튼 텍스트 업데이트
        if (timeLeft > 0) {
            skipBtnText.textContent = `${timeLeft}초 후 건너뛰기`;
        } else {
            // 타이머 완료
            clearInterval(adTimerInterval);
            skipBtn.disabled = false;
            skipBtnText.textContent = '결과 확인하기';
        }
    }, 1000);
}

// 광고 닫고 잠금 해제
function closeAdAndUnlock() {
    // 타이머 정리
    if (adTimerInterval) {
        clearInterval(adTimerInterval);
    }

    // 모달 닫기
    const modal = document.getElementById('adModal');
    modal.classList.remove('show');

    // 잠금 해제
    unlockContent();

    // 상태 저장
    sessionStorage.setItem('analysisUnlocked', 'true');
}

// 콘텐츠 잠금 해제
function unlockContent() {
    isUnlocked = true;

    // 광고 유도 카드 숨기기
    const adPromptCard = document.getElementById('adPromptCard');
    if (adPromptCard) {
        adPromptCard.classList.add('hidden');
    }

    // 잠금 섹션 해제
    const lockedSections = document.getElementById('lockedSections');
    if (lockedSections) {
        lockedSections.classList.add('unlocked');
    }

    // 스크롤 애니메이션
    setTimeout(() => {
        const strengthsCard = document.querySelector('.strengths-card');
        if (strengthsCard) {
            strengthsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 300);
}
