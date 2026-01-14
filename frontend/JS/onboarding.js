// onboarding.js - 온보딩 과정 처리

let currentStep = 1;
const totalSteps = 4;

document.addEventListener('DOMContentLoaded', () => {
    // 게스트 모드 체크
    const isGuest = localStorage.getItem('isGuest');
    if (isGuest !== 'true') {
        // 게스트가 아니면 로그인 페이지로
        window.location.href = '/login';
        return;
    }

    // 이미 온보딩 완료했으면 채팅으로 이동
    const onboardingCompleted = localStorage.getItem('onboardingCompleted');
    if (onboardingCompleted === 'true') {
        window.location.href = '/chat';
        return;
    }

    initializeOnboarding();
});

function initializeOnboarding() {
    const form = document.getElementById('onboardingForm');
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    const submitBtn = document.getElementById('submitBtn');
    const skipBtn = document.getElementById('skipOnboarding');

    // 성별 버튼 이벤트
    const genderBtns = document.querySelectorAll('.gender-btn');
    genderBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // 모든 버튼 비활성화
            genderBtns.forEach(b => b.classList.remove('selected'));
            // 선택된 버튼 활성화
            btn.classList.add('selected');
            // hidden input에 값 설정
            document.getElementById('userGender').value = btn.dataset.gender;
            // 에러 메시지 제거
            document.getElementById('genderError').textContent = '';
        });
    });

    // 직업 선택 이벤트 (기타 선택 시 입력 필드 표시)
    const occupationSelect = document.getElementById('userOccupation');
    const otherOccupationWrapper = document.getElementById('otherOccupationWrapper');
    const otherOccupationInput = document.getElementById('otherOccupation');

    occupationSelect.addEventListener('change', () => {
        if (occupationSelect.value === 'other') {
            otherOccupationWrapper.style.display = 'block';
            otherOccupationInput.focus();
        } else {
            otherOccupationWrapper.style.display = 'none';
            otherOccupationInput.value = '';
        }
        // 에러 메시지 제거
        document.getElementById('occupationError').textContent = '';
    });

    // 다음 버튼
    nextBtn.addEventListener('click', () => {
        if (validateCurrentStep()) {
            goToStep(currentStep + 1);
        }
    });

    // 이전 버튼
    prevBtn.addEventListener('click', () => {
        goToStep(currentStep - 1);
    });

    // 폼 제출
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (validateCurrentStep()) {
            completeOnboarding();
        }
    });

    // 건너뛰기
    skipBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('온보딩을 건너뛰시겠습니까? 나중에 더 나은 분석을 위해 정보를 입력하시는 것을 권장합니다.')) {
            skipOnboarding();
        }
    });

    // Enter 키로 다음 단계
    document.querySelectorAll('.onboarding-input').forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (currentStep < totalSteps) {
                    nextBtn.click();
                } else {
                    submitBtn.click();
                }
            }
        });
    });
}

function validateCurrentStep() {
    let isValid = true;
    const errorMessages = {
        name: document.getElementById('nameError'),
        age: document.getElementById('ageError'),
        gender: document.getElementById('genderError'),
        occupation: document.getElementById('occupationError')
    };

    // 에러 메시지 초기화
    Object.values(errorMessages).forEach(el => el.textContent = '');

    switch(currentStep) {
        case 1: // 이름
            const name = document.getElementById('userName').value.trim();
            if (!name) {
                errorMessages.name.textContent = '이름을 입력해주세요';
                isValid = false;
            } else if (name.length < 2) {
                errorMessages.name.textContent = '이름은 2글자 이상이어야 합니다';
                isValid = false;
            } else if (name.length > 20) {
                errorMessages.name.textContent = '이름은 20글자 이하여야 합니다';
                isValid = false;
            }
            break;

        case 2: // 나이
            const age = document.getElementById('userAge').value;
            if (!age) {
                errorMessages.age.textContent = '나이를 입력해주세요';
                isValid = false;
            } else if (age < 10 || age > 100) {
                errorMessages.age.textContent = '10세에서 100세 사이의 나이를 입력해주세요';
                isValid = false;
            }
            break;

        case 3: // 성별
            const gender = document.getElementById('userGender').value;
            if (!gender) {
                errorMessages.gender.textContent = '성별을 선택해주세요';
                isValid = false;
            }
            break;

        case 4: // 직업
            const occupation = document.getElementById('userOccupation').value;
            if (!occupation) {
                errorMessages.occupation.textContent = '직업을 선택해주세요';
                isValid = false;
            } else if (occupation === 'other') {
                // 기타 선택 시 직접 입력 검증
                const otherOccupation = document.getElementById('otherOccupation').value.trim();
                if (!otherOccupation) {
                    errorMessages.occupation.textContent = '직업을 입력해주세요';
                    isValid = false;
                } else if (otherOccupation.length < 2) {
                    errorMessages.occupation.textContent = '직업은 2글자 이상 입력해주세요';
                    isValid = false;
                } else if (otherOccupation.length > 20) {
                    errorMessages.occupation.textContent = '직업은 20글자 이하로 입력해주세요';
                    isValid = false;
                }
            }
            break;
    }

    return isValid;
}

function goToStep(step) {
    if (step < 1 || step > totalSteps) return;

    // 현재 단계 숨기기
    document.querySelectorAll('.onboarding-step').forEach(el => {
        el.classList.remove('active');
    });

    // 새 단계 표시
    const newStepEl = document.querySelector(`.onboarding-step[data-step="${step}"]`);
    if (newStepEl) {
        newStepEl.classList.add('active');
    }

    // 진행 상태 업데이트
    document.querySelectorAll('.progress-step').forEach(el => {
        const stepNum = parseInt(el.dataset.step);
        if (stepNum <= step) {
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    });

    // 버튼 표시/숨김
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');

    prevBtn.style.display = step === 1 ? 'none' : 'inline-block';
    nextBtn.style.display = step === totalSteps ? 'none' : 'inline-block';
    submitBtn.style.display = step === totalSteps ? 'inline-block' : 'none';

    currentStep = step;

    // 입력 필드에 자동 포커스
    setTimeout(() => {
        const input = newStepEl.querySelector('input, select');
        if (input) {
            input.focus();
        }
    }, 100);
}

function completeOnboarding() {
    // 사용자 정보 수집
    const occupationValue = document.getElementById('userOccupation').value;
    const otherOccupationValue = document.getElementById('otherOccupation').value.trim();

    const userInfo = {
        name: document.getElementById('userName').value.trim(),
        age: parseInt(document.getElementById('userAge').value),
        gender: document.getElementById('userGender').value,
        occupation: occupationValue === 'other' ? otherOccupationValue : occupationValue,
        occupationCategory: occupationValue, // 원래 선택 값 저장
        timestamp: new Date().toISOString()
    };

    // 로컬 스토리지에 저장
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
    localStorage.setItem('onboardingCompleted', 'true');

    console.log('✅ 온보딩 완료:', userInfo);

    // 채팅 페이지로 이동
    window.location.href = '/chat';
}

function skipOnboarding() {
    // 기본 정보만 저장 (이름은 '게스트'로)
    const userInfo = {
        name: '게스트',
        age: 25, // 기본 나이
        gender: 'male', // 기본 성별
        occupation: '친구',
        occupationCategory: 'other',
        skipped: true,
        timestamp: new Date().toISOString()
    };

    localStorage.setItem('userInfo', JSON.stringify(userInfo));
    localStorage.setItem('onboardingCompleted', 'true');

    console.log('⏭️ 온보딩 건너뛰기');

    // 채팅 페이지로 이동
    window.location.href = '/chat';
}
