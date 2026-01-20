// 시작하기 버튼 클릭 시 onboarding 페이지로 이동
document.addEventListener('DOMContentLoaded', function() {
    const startBtn = document.getElementById('startBtn');
    
    if (startBtn) {
        startBtn.addEventListener('click', function() {
            window.location.href = '/onboarding';
        });
    }
});
