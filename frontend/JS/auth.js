// auth.js - 백엔드 중심 인증 처리

// API 엔드포인트 설정 (백엔드 서버 URL)
const API_URL = 'http://localhost:8000';

document.addEventListener('DOMContentLoaded', () => {
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    const guestLoginBtn = document.getElementById('guestLoginBtn');

    // 구글 로그인 (백엔드에서 처리)
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async () => {
            try {
                // 로딩 상태 표시
                googleLoginBtn.disabled = true;
                googleLoginBtn.innerHTML = '<span>로그인 중...</span>';

                // 백엔드의 Google OAuth URL로 리다이렉트
                // 백엔드에서 Google 로그인 후 콜백으로 돌아옴
                window.location.href = `${API_URL}/auth/google/login`;

            } catch (error) {
                console.error('❌ 로그인 오류:', error);
                alert('로그인 중 오류가 발생했습니다.');

                // 버튼 상태 복구
                googleLoginBtn.disabled = false;
                googleLoginBtn.innerHTML = `
                    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    구글로 시작하기
                `;
            }
        });
    }

    // 게스트 로그인 (백엔드에서 처리)
    if (guestLoginBtn) {
        guestLoginBtn.addEventListener('click', async () => {
            try {
                // 로딩 상태 표시
                guestLoginBtn.disabled = true;
                guestLoginBtn.textContent = '로그인 중...';

                // 백엔드에서 게스트 JWT 발급 요청
                const response = await fetch(`${API_URL}/auth/guest`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                if (!response.ok) {
                    throw new Error('게스트 로그인 실패');
                }

                const data = await response.json();

                // JWT 토큰을 로컬 스토리지에 저장
                localStorage.setItem('authToken', data.access_token);
                localStorage.setItem('isGuest', 'true');

                console.log('✅ 게스트 로그인 완료');

                // 채팅 페이지로 이동
                window.location.href = '/chat';

            } catch (error) {
                console.error('❌ 게스트 로그인 오류:', error);
                alert('게스트 로그인 중 오류가 발생했습니다. 다시 시도해주세요.');

                // 버튼 상태 복구
                guestLoginBtn.disabled = false;
                guestLoginBtn.textContent = '게스트로 시작하기';
            }
        });
    }

    // 로그인 성공 후 콜백 처리
    // Google 로그인 후 백엔드에서 리다이렉트할 때 URL 파라미터로 토큰을 받아옴
    handleAuthCallback();
});

// 로그인 콜백 처리
function handleAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const email = urlParams.get('email');
    const error = urlParams.get('error');

    if (error) {
        alert(`로그인 실패: ${error}`);
        // URL 파라미터 제거
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
    }

    if (token) {
        // 토큰을 로컬 스토리지에 저장
        localStorage.setItem('authToken', token);
        localStorage.setItem('isGuest', 'false');

        if (email) {
            localStorage.setItem('userEmail', email);
        }

        console.log('✅ Google 로그인 완료');

        // URL 파라미터 제거하고 채팅 페이지로 이동
        window.location.href = '/chat';
    }
}

// 로그아웃 함수
async function logout() {
    try {
        const token = localStorage.getItem('authToken');

        // 백엔드에 로그아웃 요청 (선택사항)
        if (token) {
            try {
                await fetch(`${API_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            } catch (error) {
                console.error('백엔드 로그아웃 요청 실패:', error);
            }
        }

        // 로컬 스토리지 정리
        localStorage.removeItem('authToken');
        localStorage.removeItem('isGuest');
        localStorage.removeItem('sessionId');
        localStorage.removeItem('userEmail');

        console.log('✅ 로그아웃 완료');

        // 홈으로 이동
        window.location.href = '/';
    } catch (error) {
        console.error('❌ 로그아웃 오류:', error);
        // 에러가 있어도 로컬 스토리지는 정리하고 홈으로 이동
        localStorage.clear();
        window.location.href = '/';
    }
}
