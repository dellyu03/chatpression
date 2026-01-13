// chat.js - 채팅 기능 처리

// API 엔드포인트 설정
const API_URL = 'http://localhost:8000';  // 백엔드 서버 주소에 맞게 수정하세요

// DOM 요소
let chatMessages, messageInput, sendBtn, endChatBtn;

// 세션 ID (채팅 세션 식별용)
let sessionId = null;

document.addEventListener('DOMContentLoaded', () => {
    // DOM 요소 가져오기
    chatMessages = document.getElementById('chatMessages');
    messageInput = document.getElementById('messageInput');
    sendBtn = document.getElementById('sendBtn');
    endChatBtn = document.getElementById('endChatBtn');

    // 인증 확인
    checkAuth();

    // 게스트 모드 확인 및 표시
    const isGuest = localStorage.getItem('isGuest') === 'true';
    if (isGuest) {
        const chatHeader = document.querySelector('.chat-header h2');
        if (chatHeader) {
            chatHeader.innerHTML = 'AI 챗봇 <span style="font-size: 0.8rem; opacity: 0.8;">(게스트 모드)</span>';
        }
    }

    // 세션 ID 생성 또는 복원
    sessionId = localStorage.getItem('sessionId') || generateSessionId();
    localStorage.setItem('sessionId', sessionId);

    // 이벤트 리스너 등록
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    endChatBtn.addEventListener('click', endChatAndAnalyze);
});

// 인증 확인
function checkAuth() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        // 토큰이 없으면 로그인 페이지로 리다이렉트
        alert('로그인이 필요합니다.');
        window.location.href = '/login';
    }
}

// 세션 ID 생성
function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 메시지 전송
async function sendMessage() {
    const message = messageInput.value.trim();

    if (!message) {
        return;
    }

    // 사용자 메시지 표시
    addMessage(message, 'user');

    // 입력 필드 초기화
    messageInput.value = '';

    // 타이핑 인디케이터 표시
    const typingId = showTypingIndicator();

    try {
        // 백엔드로 메시지 전송
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_URL}/chat/message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                session_id: sessionId,
                message: message
            })
        });

        if (!response.ok) {
            throw new Error('메시지 전송 실패');
        }

        const data = await response.json();

        // 타이핑 인디케이터 제거
        removeTypingIndicator(typingId);

        // 봇 응답 표시
        addMessage(data.response, 'bot');

    } catch (error) {
        console.error('메시지 전송 오류:', error);
        removeTypingIndicator(typingId);
        addMessage('죄송합니다. 메시지 전송 중 오류가 발생했습니다. 다시 시도해주세요.', 'bot');
    }
}

// 메시지 추가
function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;

    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    avatarDiv.textContent = sender === 'bot' ? '🤖' : '👤';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;

    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);

    chatMessages.appendChild(messageDiv);

    // 스크롤을 최하단으로 이동
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 타이핑 인디케이터 표시
function showTypingIndicator() {
    const typingId = 'typing_' + Date.now();
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot';
    messageDiv.id = typingId;

    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    avatarDiv.textContent = '🤖';

    const typingDiv = document.createElement('div');
    typingDiv.className = 'message-content';
    typingDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';

    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(typingDiv);

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return typingId;
}

// 타이핑 인디케이터 제거
function removeTypingIndicator(typingId) {
    const typingElement = document.getElementById(typingId);
    if (typingElement) {
        typingElement.remove();
    }
}

// 채팅 종료 및 분석 결과 보기
async function endChatAndAnalyze() {
    if (!confirm('대화를 종료하고 분석 결과를 확인하시겠습니까?')) {
        return;
    }

    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_URL}/chat/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                session_id: sessionId
            })
        });

        if (!response.ok) {
            throw new Error('분석 요청 실패');
        }

        const data = await response.json();

        // 분석 결과를 로컬 스토리지에 저장
        localStorage.setItem('analysisResult', JSON.stringify(data));

        // 분석 결과 페이지로 이동 (아직 만들지 않았다면 임시로 알림 표시)
        // window.location.href = 'result.html';
        alert(`분석 완료!\n\n성격 유형: ${data.personality_type || '분석 중'}\n\n${data.description || '상세 분석 결과는 백엔드에서 확인하세요.'}`);

    } catch (error) {
        console.error('분석 요청 오류:', error);
        alert('분석 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
}
