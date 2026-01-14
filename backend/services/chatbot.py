import os
from dotenv import load_dotenv
from openai import OpenAI
from typing import Dict, List

# .env 파일 경로 명시 (backend 디렉토리의 .env 파일)
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

#API키 수정 가능
api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    raise ValueError("서버에서 API 키를 찾을 수 없음")

#Client Generation
client = OpenAI(api_key = api_key)
print("OpenAI 클라이언트 초기화 완료")

#System Prompt
SYSTEM_PROMPT = """
당신은 사용자와 비슷한 나이대의 친구입니다.
  처음 만난 친구나 동료처럼 자연스럽고 편안하게 대화하세요.

  대화 가이드라인:
  1. 반말을 사용하며 친근하게 대화합니다
  2. 상대방의 이야기를 경청하고 공감하며 반응합니다
  3. 자연스러운 질문으로 대화를 이어갑니다 (한 번에 1-2개)
  4. 너무 깊거나 무거운 주제보다는 일상적인 대화를 나눕니다
  5. 상대방과 비슷한 관심사나 고민을 가진 친구처럼 행동합니다
  6. 설문조사나 인터뷰 같은 느낌을 주지 않습니다

  말투 예시:
  - "오 진짜? 그거 어땠어?"
  - "아 나도 그런 적 있어~"
  - "요즘 나는 ~~하는데 너는 어때?"
  - "완전 공감이다 ㅋㅋ"

  대화 주제: 일상, 취미, 관심사, 고민, 학교/직장 생활, 인간관계 등

  주의사항:
  - 너무 형식적이거나 정중한 말투는 피합니다
  - 지나치게 조언하거나 가르치려 들지 않습니다
  - 자연스러운 친구 대화를 유지합니다
"""

ChatHistory = List[Dict[str, str]]
SessionStore = Dict[str, ChatHistory]
chat_sessions: SessionStore = {}

#Create new Chat Session
def create_session(session_id: str) -> None:
    """
    새로운 채팅 세션을 생성

    Args:
        session_id: 세션 고유 식별자
    """
    if session_id in chat_sessions:
        return
    chat_sessions[session_id] = [
        {
            "role":"system",
            "content": SYSTEM_PROMPT
        }
    ]

    print(f"새 세션 생성 : {session_id}")

#get chat session history
def get_chat_history(session_id: str) -> ChatHistory:
    """
    세션의 대화 히스토리를 반환
    세션이 없으면 자동으로 생성

    Args:
        session_id: 세션 ID
    Returns:
        해당 세션의 메시지 리스트
    """
    if session_id not in chat_sessions:
        print("세션이 없어 새로운 세션을 생성합니다.")
        create_session(session_id)
    return chat_sessions[session_id]

# ADD message to Session
def add_message(session_id: str, role: str, content: str) -> None:
    """
    세션에 메시지를 추가합니다.

    Args:
        session_id : 세션 ID
        role : 'user' or 'assistant'
        content: '메시지 내용"
    """
    history = get_chat_history(session_id)

    history.append({
        "role" : role,
        "content" : content
    })
    print(f"메시지 추가[{role}] : {content[:30]}...")

# send_message to model
def send_message(session_id: str, user_message:str) -> str:
    """
    사용자 메시지를 받아 챗봇 응답을 반환

    Args:
        session_id: 세션 ID
        user_message : 사용자가 보낸 메시지
    
    Returns:
        챗봇의 응답 텍스트
    
    Raises:
        Exception: OpenAI API 호출 실패 시
    """
    history = get_chat_history(session_id)

    add_message(session_id, "user", user_message)

    try:
        print(f"채팅 모델 에게 전송 중...(히스토리 길이 : {len(history)})")
        response = client.chat.completions.create(
            model = "gpt-4o",
            messages = history,
            temperature = 0.8,
            max_tokens=500,
            top_p=1.0,
            frequency_penalty=0.3,
            presence_penalty=0.3
        )
        assistant_message = response.choices[0].message.content
        print(f"GPT 응답 : {assistant_message[:50]}")

        add_message(session_id, "assistant", assistant_message)

        return assistant_message

    except Exception as e:
        print(f"API 에러 : {str(e)}")
        raise
        
if __name__ == "__main__":
      print("\n" + "="*50)
      print("🧪 Chatbot 테스트 시작")
      print("="*50 + "\n")

      # 테스트 세션 ID
      test_session = "test_session_123"

      # 첫 번째 대화
      print("👤 사용자: 안녕!")
      response1 = send_message(test_session, "안녕!")
      print(f"🤖 챗봇: {response1}\n")

      # 두 번째 대화
      print("👤 사용자: 요즘 뭐해?")
      response2 = send_message(test_session, "요즘 뭐해?")
      print(f"🤖 챗봇: {response2}\n")

      # 히스토리 확인
      print("="*50)
      print("📚 대화 히스토리")
      print("="*50)
      history = get_chat_history(test_session)
      for i, msg in enumerate(history, 1):
          role_emoji = {"system": "⚙️", "user": "👤", "assistant": "🤖"}
          emoji = role_emoji.get(msg["role"], "")
          content = msg["content"][:50] + "..." if len(msg["content"]) > 50 else msg["content"]
          print(f"{i}. {emoji} {msg['role']}: {content}")

      print("\n✅ 테스트 완료!")
