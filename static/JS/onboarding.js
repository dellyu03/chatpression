// 온보딩 단계 관리
let currentStep = 1;
const totalSteps = 4;

// DOM 요소 가져오기
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');
const submitBtn = document.getElementById('submitBtn');
const form = document.getElementById('onboardingForm');

// 각 단계별 유효성 검사 함수
function validateStep(step) {
    const errorMessages = {
        1: document.getElementById('nameError'),
        2: document.getElementById('ageError'),
        3: document.getElementById('genderError'),
        4: document.getElementById('occupationError')
    };

    // 에러 메시지 초기화
    if (errorMessages[step]) {
        errorMessages[step].textContent = '';
    }

    switch(step) {
        case 1:
            const userName = document.getElementById('userName').value.trim();
            if (!userName) {
                errorMessages[1].textContent = '이름을 입력해주세요.';
                return false;
            }
            if (userName.length < 2) {
                errorMessages[1].textContent = '이름은 2자 이상 입력해주세요.';
                return false;
            }
            return true;

        case 2:
            const userAge = document.getElementById('userAge').value;
            if (!userAge) {
                errorMessages[2].textContent = '나이를 입력해주세요.';
                return false;
            }
            const age = parseInt(userAge);
            if (age < 10 || age > 100) {
                errorMessages[2].textContent = '나이는 10세 이상 100세 이하여야 합니다.';
                return false;
            }
            return true;

        case 3:
            const userGender = document.getElementById('userGender').value;
            if (!userGender) {
                errorMessages[3].textContent = '성별을 선택해주세요.';
                return false;
            }
            return true;

        case 4:
            const userOccupation = document.getElementById('userOccupation').value;
            if (!userOccupation) {
                errorMessages[4].textContent = '직업을 선택해주세요.';
                return false;
            }
            // 기타 선택 시 직접 입력 필드 확인
            if (userOccupation === 'other') {
                const otherOccupation = document.getElementById('otherOccupation').value.trim();
                if (!otherOccupation) {
                    errorMessages[4].textContent = '직업을 입력해주세요.';
                    return false;
                }
            }
            return true;

        default:
            return true;
    }
}

// 단계 이동 함수
function goToStep(step) {
    // 현재 단계 숨기기
    const currentStepElement = document.querySelector(`.onboarding-step[data-step="${currentStep}"]`);
    const currentProgressStep = document.querySelector(`.progress-step[data-step="${currentStep}"]`);
    
    if (currentStepElement) {
        currentStepElement.classList.remove('active');
    }
    if (currentProgressStep) {
        currentProgressStep.classList.remove('active');
    }

    // 다음 단계 표시
    currentStep = step;
    const nextStepElement = document.querySelector(`.onboarding-step[data-step="${currentStep}"]`);
    const nextProgressStep = document.querySelector(`.progress-step[data-step="${currentStep}"]`);
    
    if (nextStepElement) {
        nextStepElement.classList.add('active');
    }
    if (nextProgressStep) {
        nextProgressStep.classList.add('active');
    }

    // 진행선 업데이트
    updateProgressLines();

    // 버튼 상태 업데이트
    updateButtons();

    // 입력 필드 포커스
    const firstInput = nextStepElement?.querySelector('input, select');
    if (firstInput && firstInput.type !== 'hidden') {
        setTimeout(() => firstInput.focus(), 100);
    }
}

// 진행선 업데이트
function updateProgressLines() {
    const progressLines = document.querySelectorAll('.progress-line');
    progressLines.forEach((line, index) => {
        if (index < currentStep - 1) {
            line.style.background = 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))';
        } else {
            line.style.background = '#E0E0E0';
        }
    });
}

// 버튼 상태 업데이트
function updateButtons() {
    // 이전 버튼
    if (currentStep === 1) {
        prevBtn.style.display = 'none';
    } else {
        prevBtn.style.display = 'block';
    }

    // 다음/완료 버튼
    if (currentStep === totalSteps) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'block';
    } else {
        nextBtn.style.display = 'block';
        submitBtn.style.display = 'none';
    }
}

// 다음 버튼 클릭
if (nextBtn) {
    nextBtn.addEventListener('click', function() {
        // 현재 단계 유효성 검사
        if (validateStep(currentStep)) {
            if (currentStep < totalSteps) {
                goToStep(currentStep + 1);
            }
        }
    });
}

// 이전 버튼 클릭
if (prevBtn) {
    prevBtn.addEventListener('click', function() {
        if (currentStep > 1) {
            goToStep(currentStep - 1);
        }
    });
}

// 성별 선택 버튼
const genderButtons = document.querySelectorAll('.gender-btn');
genderButtons.forEach(button => {
    button.addEventListener('click', function() {
        // 기존 선택 제거
        genderButtons.forEach(btn => btn.classList.remove('selected'));
        
        // 현재 버튼 선택
        this.classList.add('selected');
        
        // hidden input에 값 저장
        const gender = this.getAttribute('data-gender');
        document.getElementById('userGender').value = gender;
        
        // 에러 메시지 제거
        document.getElementById('genderError').textContent = '';
    });
});

// 직업 선택 시 기타 옵션 처리
const occupationSelect = document.getElementById('userOccupation');
if (occupationSelect) {
    occupationSelect.addEventListener('change', function() {
        const otherWrapper = document.getElementById('otherOccupationWrapper');
        const otherInput = document.getElementById('otherOccupation');
        
        if (this.value === 'other') {
            otherWrapper.style.display = 'block';
            if (otherInput) {
                otherInput.required = true;
                setTimeout(() => otherInput.focus(), 100);
            }
        } else {
            otherWrapper.style.display = 'none';
            if (otherInput) {
                otherInput.required = false;
                otherInput.value = '';
            }
        }
        
        // 에러 메시지 제거
        document.getElementById('occupationError').textContent = '';
    });
}

// 폼 제출 처리
if (form) {
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // 마지막 단계 유효성 검사
        if (!validateStep(currentStep)) {
            return;
        }

        // 폼 데이터 수집
        const formData = {
            name: document.getElementById('userName').value.trim(),
            age: parseInt(document.getElementById('userAge').value),
            gender: document.getElementById('userGender').value,
            occupation: document.getElementById('userOccupation').value === 'other' 
                ? document.getElementById('otherOccupation').value.trim()
                : document.getElementById('userOccupation').value
        };

        // 데이터를 세션 스토리지에 저장 (다음 페이지에서 사용)
        sessionStorage.setItem('userData', JSON.stringify(formData));

        // 채팅 페이지로 이동
        window.location.href = '/chat';
    });
}

// 건너뛰기 버튼
const skipOnboarding = document.getElementById('skipOnboarding');
if (skipOnboarding) {
    skipOnboarding.addEventListener('click', function(e) {
        e.preventDefault();
        // 채팅 페이지로 이동
        window.location.href = '/chat';
    });
}

// Enter 키로 다음 단계 이동
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        const activeStep = document.querySelector('.onboarding-step.active');
        if (activeStep) {
            const activeInput = activeStep.querySelector('input:not([type="hidden"]), select');
            if (activeInput && document.activeElement === activeInput) {
                e.preventDefault();
                if (currentStep < totalSteps && nextBtn.style.display !== 'none') {
                    nextBtn.click();
                } else if (currentStep === totalSteps && submitBtn.style.display !== 'none') {
                    form.dispatchEvent(new Event('submit'));
                }
            }
        }
    }
});

// 초기화
document.addEventListener('DOMContentLoaded', function() {
    updateButtons();
    updateProgressLines();
    
    // 첫 번째 입력 필드에 포커스
    const firstInput = document.querySelector('.onboarding-step.active input');
    if (firstInput && firstInput.type !== 'hidden') {
        setTimeout(() => firstInput.focus(), 100);
    }
});
