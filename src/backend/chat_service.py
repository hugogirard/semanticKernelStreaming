from typing import AsyncGenerator, Dict, List
from semantic_kernel.connectors.ai.open_ai import AzureChatCompletion, AzureChatPromptExecutionSettings
from semantic_kernel.contents.chat_history import ChatHistory
from semantic_kernel.contents import StreamingChatMessageContent
from dotenv import load_dotenv
from semantic_kernel import Kernel
from azure.identity.aio import DefaultAzureCredential, get_bearer_token_provider
from message import Message
import os

class ChatService():

    def __init__(self):

        self.history:Dict[str,List[Message]] = {}

        load_dotenv(override=True)

        credential = DefaultAzureCredential()
        token_provider = get_bearer_token_provider(credential, "https://cognitiveservices.azure.com/.default")        

        chat_completion_service = AzureChatCompletion(
            deployment_name=os.getenv('DEPLOYMENT_NAME'),  
            endpoint=os.getenv('OPENAI_ENDPOINT'),
            ad_token_provider=token_provider,
            service_id="chat_completion",
            api_version=os.getenv('API_VERSION')
        )

        self.kernel = Kernel()

        self.kernel.add_service(chat_completion_service)
        self.execution_settings = AzureChatPromptExecutionSettings(
            service_id="chat_completion",
            temperature=0.7,
            max_tokens=4000
        )   
         
    async def completion(self,chat_id:str, prompt:str) -> AsyncGenerator[StreamingChatMessageContent, None]:
        
        history = ChatHistory()
        history.add_system_message("You are an AI assistant")
        messages: List[Message] = []

        if self.history.get(chat_id):           
            messages = self.history[chat_id]
            for message in messages:
                if message.role == "user":
                    history.add_user_message(message.content)
                else:
                    history.add_assistant_message(message.content)                            
        
        history.add_user_message(prompt)
        messages.append(Message(role="user", content=prompt))

        chat_completion_service:AzureChatCompletion = self.kernel.get_service(type=AzureChatCompletion)

        stream = chat_completion_service.get_streaming_chat_message_content(
            chat_history=history,
            settings=self.execution_settings,
        )

        content:str = ""
        async for chunk in stream:
            yield chunk.content
            content += chunk.content
            #print(chunk, end="", flush=True)  
        
        messages.append(Message(role="assistant", content=content))
        self.history[chat_id] = messages

    def delete_chat(self,chat_id:str) -> None:
        if chat_id in self.history:
            del self.history[chat_id]        