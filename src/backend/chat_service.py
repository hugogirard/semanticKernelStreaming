from typing import AsyncGenerator
from semantic_kernel.connectors.ai.open_ai import AzureChatCompletion, AzureChatPromptExecutionSettings
from semantic_kernel.connectors.ai.function_choice_behavior import FunctionChoiceBehavior
from semantic_kernel.contents.chat_history import ChatHistory
from semantic_kernel.contents import StreamingChatMessageContent
from dotenv import load_dotenv
from semantic_kernel import Kernel
from azure.identity.aio import DefaultAzureCredential, get_bearer_token_provider
import os

class ChatService():

    def __init__(self):
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
    
    async def completion(self,prompt:str) -> AsyncGenerator[StreamingChatMessageContent, None]:

        history = ChatHistory()
        history.add_system_message("You are an AI assistant")
        history.add_user_message(prompt)

        chat_completion_service:AzureChatCompletion = self.kernel.get_service(type=AzureChatCompletion)

        stream = chat_completion_service.get_streaming_chat_message_content(
            chat_history=history,
            settings=self.execution_settings,
        )

        async for chunk in stream:
            yield chunk.content
            #content += chunk.content
            #print(chunk, end="", flush=True)  

        #return {"message": content}   