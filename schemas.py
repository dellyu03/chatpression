from pydantic import BaseModel                                                                                                                                                           
from typing import List, Dict, Optional                                                                                                                                                  
                                                                                                                             
class ChatRequest(BaseModel):                                                                                                                                                            
    message: str                                                                                                                                                                         
    history: Optional[List[Dict[str, str]]] = []                                                                                                                                         
    user_age: int                                                                                                                                                                        
    bot_gender: str                                                                                                                                                                      
    bot_name: str                                                                                                                                                                        

class ChatResponse(BaseModel):                                                                                                                                                           
    content: str                                                                                                                                                                         
    role: str                                                                                                                                                                            
    timestamp: str      