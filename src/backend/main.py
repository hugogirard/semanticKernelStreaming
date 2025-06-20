from fastapi import FastAPI
from dotenv import load_dotenv
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from semantic_kernel.contents import StreamingChatMessageContent
from fastapi.responses import StreamingResponse
from semantic_kernel import Kernel
from chat_service import ChatService
from typing import AsyncGenerator

chat_service = ChatService()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post('/api/chat')
async def chat(prompt:str) -> StreamingResponse:
     return StreamingResponse(chat_service.completion(prompt), media_type="text/plain")
    
@app.get('/', include_in_schema=False)
async def root():
    return RedirectResponse(url="/docs")       