// 사용자 데이터 및 대화 히스토리
let userData = null;
let history = [];
let isSending = false; // 전송 중 플래그
let conversationCount = 0; // 대화 횟수 (사용자+AI = 1회)

// 대화 제한 설정
//TODO MIN_CONVERSATIONS 10으로 변경할 것
const MIN_CONVERSATIONS = 10; // 최소 대화 수
const MAX_CONVERSATIONS = 15; // 최대 대화 수

// DOM 요소
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');

// 초기화
document.addEventListener('DOMContentLoaded', function() {
    // sessionStorage에서 사용자 데이터 로드
    const storedData = sessionStorage.getItem('userData');
    if (storedData) {
        userData = JSON.parse(storedData);
        // 챗봇 설정 (반대 성별) - onboarding에서 male/female로 저장됨
        userData.botGender = userData.gender === 'male' ? '여성' : '남성';
        userData.botName = userData.gender === 'male' ? '민지' : '철수';
    } else {
        // 기본값
        userData = {
            name: '사용자',
            age: 25,
            gender: '남성',
            botGender: '여성',
            botName: '민지'
        };
    }

    // 헤더 정보 업데이트
    const botNameEl = document.getElementById('botName');
    const botAvatarEl = document.getElementById('botAvatar');
    const botStatusEl = document.getElementById('botStatus');

    if (botNameEl) {
        botNameEl.textContent = userData.botName;
    }
    if (botAvatarEl) {
        // 성별에 따른 아바타 이모지
        botAvatarEl.textContent = userData.botGender === '여성' ? '👩' : '👨';
    }
    if (botStatusEl) {
        botStatusEl.textContent = `${userData.age}살 · ${userData.botGender}`;
    }

    // 접속 안내 메시지 표시
    showSystemNotice(`${userData.botName}님이 접속했습니다`);

    // 첫 인사 메시지 표시 (스트리밍 효과)
    setTimeout(() => {
        const greeting = `${userData.name}씨 안녕하세요 😊`;
        showBotMessageWithTypingEffect(greeting);
    }, 1000);

    // 이벤트 리스너 (DOMContentLoaded 내부에서 한 번만 등록)
    sendBtn.addEventListener('click', handleSend);

    messageInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    // 모바일 키보드 대응: 입력창 포커스 시 스크롤 처리
    messageInput.addEventListener('focus', function() {
        // 키보드가 올라오는 시간을 고려하여 지연 후 스크롤
        setTimeout(() => {
            scrollToBottom();
        }, 300);
    });

    // visualViewport API를 통한 키보드 높이 감지 (iOS/Android 대응)
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleViewportResize);
    }

    // 분석 결과 보기 버튼 이벤트
    const endChatBtn = document.getElementById('endChatBtn');
    if (endChatBtn) {
        endChatBtn.addEventListener('click', handleEndChat);
    }

    // 대화 카운터 UI 업데이트
    updateConversationCounter();
});

// 시스템 알림 표시
function showSystemNotice(message) {
    const notice = document.createElement('div');
    notice.className = 'system-notice';
    notice.textContent = message;
    chatMessages.appendChild(notice);
    scrollToBottom();
}

// 봇 아바타 이모지 반환
function getBotAvatar() {
    return userData.botGender === '여성' ? '👩' : '👨';
}

// 봇 메시지를 타이핑 효과로 표시
function showBotMessageWithTypingEffect(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot';
    messageDiv.innerHTML = `
        <div class="message-avatar">${getBotAvatar()}</div>
        <div class="message-content"></div>
    `;
    chatMessages.appendChild(messageDiv);

    const contentDiv = messageDiv.querySelector('.message-content');
    let index = 0;

    function typeChar() {
        if (index < text.length) {
            contentDiv.textContent += text[index];
            index++;
            scrollToBottom();
            setTimeout(typeChar, 50);
        } else {
            // 히스토리에 추가
            history.push({ role: 'assistant', content: text });
        }
    }

    typeChar();
}

// 사용자 메시지 표시
function showUserMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user';
    messageDiv.innerHTML = `
        <div class="message-avatar">😊</div>
        <div class="message-content">${escapeHtml(message)}</div>
    `;
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// 타이핑 인디케이터 표시
function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'message bot';
    indicator.id = 'typingIndicator';
    indicator.innerHTML = `
        <div class="message-avatar">${getBotAvatar()}</div>
        <div class="message-content">
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    chatMessages.appendChild(indicator);
    scrollToBottom();
}

// 타이핑 인디케이터 제거
function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

// 스트리밍 메시지 전송
async function sendMessageStream(message) {
    if (isSending) return; // 전송 중이면 무시
    isSending = true;

    showUserMessage(message);
    history.push({ role: 'user', content: message });

    showTypingIndicator();

    // 최소 딜레이 시간 (인간적인 타이핑 느낌)
    const minDelay = 3000;
    const startTime = Date.now();

    try {
        const response = await fetch('/api/chat/stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: message,
                history: history.slice(0, -1), // 현재 메시지 제외
                user_age: userData.age,
                bot_gender: userData.botGender,
                bot_name: userData.botName
            })
        });

        // 최소 딜레이 대기 (너무 빠른 응답 방지)
        const elapsed = Date.now() - startTime;
        if (elapsed < minDelay) {
            await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
        }

        removeTypingIndicator();

        // 봇 메시지 컨테이너 생성
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot';
        messageDiv.innerHTML = `
            <div class="message-avatar">${getBotAvatar()}</div>
            <div class="message-content"></div>
        `;
        chatMessages.appendChild(messageDiv);

        const contentDiv = messageDiv.querySelector('.message-content');
        let fullMessage = '';

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                    const text = line.slice(6);
                    fullMessage += text;
                    contentDiv.textContent = fullMessage;
                    scrollToBottom();
                }
            }
        }

        // 히스토리에 추가
        history.push({ role: 'assistant', content: fullMessage });

        // 대화 횟수 증가 (사용자 메시지 + AI 응답 = 1회)
        conversationCount++;
        updateConversationCounter();

        // 최대 대화 수 도달 시 자동으로 분석 페이지 이동
        if (conversationCount >= MAX_CONVERSATIONS) {
            disableChatInput();
            showSystemNotice('대화가 완료되었습니다. 분석 결과 페이지로 이동합니다.');
            setTimeout(() => {
                goToAnalyzePage();
            }, 2000);
        }

    } catch (error) {
        removeTypingIndicator();
        console.error('메시지 전송 오류:', error);
        showSystemNotice('메시지 전송에 실패했습니다. 다시 시도해주세요.');
    } finally {
        isSending = false; // 전송 완료
    }
}

// 메시지 전송 핸들러
function handleSend() {
    // 최대 대화 수 도달 시 전송 차단
    if (conversationCount >= MAX_CONVERSATIONS) {
        return;
    }

    const message = messageInput.value.trim();
    if (!message) return;

    messageInput.value = '';
    sendMessageStream(message);
}

// 유틸리티 함수
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 모바일 키보드 표시/숨김 시 뷰포트 조정
function handleViewportResize() {
    // 키보드가 올라오면 스크롤을 맨 아래로 이동
    if (document.activeElement === messageInput) {
        setTimeout(() => {
            scrollToBottom();
            // 입력창이 보이도록 스크롤
            messageInput.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 100);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 대화 카운터 UI 업데이트
function updateConversationCounter() {
    const botStatusEl = document.getElementById('botStatus');
    if (botStatusEl && userData) {
        const remaining = MAX_CONVERSATIONS - conversationCount;
        botStatusEl.textContent = `대화 ${conversationCount}/${MAX_CONVERSATIONS}`;
    }
}

// 분석 결과 보기 버튼 핸들러
function handleEndChat() {
    if (conversationCount < MIN_CONVERSATIONS) {
        const needed = MIN_CONVERSATIONS - conversationCount;
        showSystemNotice(`분석을 위해 ${needed}번 더 대화해 주세요. (최소 ${MIN_CONVERSATIONS}회 필요)`);
        return;
    }
    goToAnalyzePage();
}

// 분석 페이지로 이동
function goToAnalyzePage() {
    // 대화 히스토리 저장 (나중에 분석에 사용)
    sessionStorage.setItem('chatHistory', JSON.stringify(history));
    sessionStorage.setItem('conversationCount', conversationCount);
    window.location.href = '/analyze';
}

// 채팅 입력 비활성화
function disableChatInput() {
    messageInput.disabled = true;
    sendBtn.disabled = true;
    messageInput.placeholder = '대화가 종료되었습니다';
}
