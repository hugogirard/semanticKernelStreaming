from pydantic import BaseModel

class ChatRequest(BaseModel):
    id: str
    prompt: str