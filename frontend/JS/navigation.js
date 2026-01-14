// navigation.js - 페이지 간 네비게이션 처리

// 시작하기 버튼 클릭 시 로그인 페이지로 이동
document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('startBtn');

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            // 로그인 페이지로 이동
            window.location.href = '/login';
        });
    }
});
