import os
from dotenv import load_dotenv
from openai import OpenAI
from typing import Dict, List

load_dotenv()

#API키 수정 가능
api_key = os.getenv("OPEN_API_KEY")

if not api_key:
    raise ValueError("서버에서 API 키를 찾을 수 없음")

#Client Generation
client = OpenAI(api_key = api_key)

#System Prompt
SYSTEM_PROMPTS = {

}

DEFAULT_PROMPT = SYSTEM_PROMPTS["friendly"]

