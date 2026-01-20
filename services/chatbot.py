"""
간단한 OpenAI GPT 기반 챗봇 템플릿

- .env 파일(프로젝트 루트)에 OPENAI_API_KEY 를 설정해서 사용
- 필요에 따라 모델명, temperature, max_tokens 등을 수정해서 사용
"""

from multiprocessing import Value
import os
from typing import List, Dict, Optional
from datetime import datetime

from openai import OpenAI
from dotenv import load_dotenv


# ----- 환경 변수 로드 -----

# 기본적으로 현재 작업 디렉토리(프로젝트 루트)에서 .env 를 로드
load_dotenv()

def load_prompt(filename: str) -> str:
    """prompts 폴도에서 프롬프트 파일을 읽어 반환"""
    prompt_path = os.path.join(os.path.dirname(__file__), "..", "prompts", filename)
    with open(prompt_path, "r", encoding="utf-8") as f:
        return f.read().strip()


class SimpleChatbot:
    """
    OpenAI GPT 모델을 사용하는 간단한 챗봇 템플릿 클래스
    """
    def __init__(
        self,
        user_age: int,
        bot_gender: str,
        bot_name: str,
        api_key: Optional[str] = None,
        model: str = "gpt-4o-mini",
        temperature: float = 0.9,
        max_tokens: int = 500,
    ) -> None:
        """
        챗봇 초기화

        Args:
            user_age: 사용자 나이 (챗봇도 동일 나이로 설정)
            bot_gender: 챗봇 성별
            bot_name: 챗봇 이름
            api_key: OpenAI API 키 (None 이면 환경변수 OPENAI_API_KEY 사용)
            model: 사용할 OpenAI 모델 이름
            temperature: 생성 다양성 (0.0~2.0)
            max_tokens: 최대 응답 토큰 수
        """
        print("시스템 프롬프트를 가져옵니다.")
        prompt_template = load_prompt("system_prompt.txt")
        self.system_prompt = prompt_template.format(
            user_age=user_age,
            bot_gender=bot_gender,
            bot_name=bot_name
        )                  
        if not self.system_prompt:
            raise ValueError(
                "시스템 프롬프트를 불러오는데 실패했습니다."
            )
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError(
                "OPENAI_API_KEY 가 설정되지 않았습니다. "
                ".env 파일 또는 환경변수에 OPENAI_API_KEY 값을 추가하세요."
            )

        self.client = OpenAI(api_key=self.api_key)
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens

    def build_messages(
        self,
        user_message: str,
        history: Optional[List[Dict[str, str]]] = None,
    ) -> List[Dict[str, str]]:
        """
        OpenAI Chat API 에 전달할 messages 리스트 구성

        Args:
            user_message: 현재 사용자 입력
            history: 이전 대화 히스토리
                     예) [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]
        """
        messages: List[Dict[str, str]] = [
            {"role": "system", "content": self.system_prompt}
        ]

        if history:
            messages.extend(history)

        messages.append({"role": "user", "content": user_message})
        return messages

    def chat(
        self,
        user_message: str,
        history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, str]:
        """
        한 번의 사용자 메시지에 대해 챗봇 응답을 생성하는 메서드

        Args:
            user_message: 사용자 입력
            history: 이전 대화 히스토리

        Returns:
            {
                "content": 응답 텍스트,
                "role": "assistant",
                "timestamp": ISO 형식 문자열
            }
        """
        messages = self.build_messages(user_message, history)

        try:
            resp = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=self.temperature,
                max_tokens=self.max_tokens,
            )

            content = resp.choices[0].message.content

            return {
                "content": content,
                "role": "assistant",
                "timestamp": datetime.now().isoformat(),
            }
        except Exception as e:
            # 실제 서비스에서는 로깅 후, 사용자에게는 일반화된 메시지를 주는 것이 좋음
            raise RuntimeError(f"챗봇 응답 생성 중 오류 발생: {e}")

    def chat_stream(
        self,
        user_message: str,
        history: Optional[List[Dict[str, str]]] = None,
    ):
        """
        스트리밍 방식으로 챗봇 응답을 생성하는 메서드

        Args:
            user_message: 사용자 입력
            history: 이전 대화 히스토리

        Yields:
            응답 텍스트 청크
        """
        messages = self.build_messages(user_message, history)

        resp = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=self.temperature,
            max_tokens=self.max_tokens,
            stream=True,
        )

        for chunk in resp:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content


# 간단한 테스트용 실행 예시
if __name__ == "__main__":
    user_age = 24
    user_name = "승환"
    user_gender = "남성"
    bot_gender = "여성" if user_gender == "남성" else "남성"
    bot_name = "민지" if user_gender == "남성" else "철수"

    bot = SimpleChatbot(
        user_age=user_age,
        bot_gender=bot_gender,
        bot_name=bot_name
    )
    history: List[Dict[str, str]] = []

    print("챗봇 데모를 실행합니다....")

    while True:
        try:
            user_input = input("You: ").strip()
            print("메시지 전송 완료! \n 챗봇의 답변 기다리는 중...")
        except Exception as e:
            print(f"메시지 전송 실패! 오류 메시지: {e}")
            continue
        
        if not user_input:
            continue
        if user_input.lower() in {"quit", "exit"}:
            break

        res = bot.chat(user_input, history)
        print(f"Bot: {res['content']}\n")

        # 히스토리에 추가
        history.append({"role": "user", "content": user_input})
        history.append({"role": "assistant", "content": res["content"]})

