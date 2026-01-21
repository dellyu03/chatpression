from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from services.chatbot import SimpleChatbot
from schemas import ChatRequest, ChatResponse 

chatbot_instances = {}

app = FastAPI()
templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/onboarding", response_class=HTMLResponse)
async def onboarding(request: Request):
    return templates.TemplateResponse("onboarding.html", {"request": request})


@app.get("/chat", response_class=HTMLResponse)
async def chat(request: Request):
    return templates.TemplateResponse("chat.html", {"request": request})

@app.post("/api/chat", response_model=ChatResponse)
async def chat_api(request: ChatRequest):
    try:
        bot = SimpleChatbot(
            user_age=request.user_age,
            bot_gender=request.bot_gender,
            bot_name=request.bot_name
        )
        response = bot.chat(request.message, request.history)
        return ChatResponse(**response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chat/stream")
async def chat_stream_api(request: ChatRequest):
    """스트리밍 방식의 챗봇 응답 API (SSE)"""
    try:
        bot = SimpleChatbot(
            user_age=request.user_age,
            bot_gender=request.bot_gender,
            bot_name=request.bot_name
        )

        def generate():
            for chunk in bot.chat_stream(request.message, request.history):
                yield f"data: {chunk}\n\n"
            yield "data: [DONE]\n\n"

        return StreamingResponse(generate(), media_type="text/event-stream")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))  

