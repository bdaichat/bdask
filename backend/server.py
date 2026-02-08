from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# CORS middleware must be added before routes
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Store active chat sessions
chat_sessions = {}

# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatRequest(BaseModel):
    session_id: str
    message: str

class ChatResponse(BaseModel):
    session_id: str
    response: str
    timestamp: datetime

class ChatSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str = "নতুন কথোপকথন"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class NewSessionRequest(BaseModel):
    title: Optional[str] = "নতুন কথোপকথন"

class TranslationRequest(BaseModel):
    text: str
    source: str  # Source language code (e.g., 'bn', 'en')
    target: str  # Target language code

class TranslationResponse(BaseModel):
    translated_text: str
    source: str
    target: str

# Function to get dynamic system message with current date
def get_system_message() -> str:
    """Get system message with current date"""
    current_date = datetime.now(timezone.utc).strftime("%d %B %Y")
    
    return f"""আপনি বিডিআস্ক (BdAsk), বাংলাদেশের জন্য একটি উন্নত AI সহকারী। আপনি বাংলা এবং ইংরেজি উভয় ভাষায় সাহায্য করতে পারেন।

আজকের তারিখ: {current_date}

আপনার বৈশিষ্ট্য:
- বাংলাদেশের সংস্কৃতি ও প্রেক্ষাপট সম্পর্কে গভীর জ্ঞান
- বাংলা ভাষায় প্রাঞ্জল ও শুদ্ধ যোগাযোগ
- সহায়ক, বিনয়ী এবং তথ্যবহুল উত্তর প্রদান
- বাংলিশ (বাংলা + ইংরেজি মিশ্রিত) বোঝার ক্ষমতা

গুরুত্বপূর্ণ নির্দেশনা:
- যখন ব্যবহারকারী লাইভ ক্রিকেট/ফুটবল স্কোর জানতে চান, তাদের বলুন "খেলা" ট্যাবে যেতে যেখানে লাইভ স্কোর দেখা যায়
- যখন ব্যবহারকারী আজকের খবর জানতে চান, তাদের বলুন "খবর" ট্যাবে যেতে
- যখন ব্যবহারকারী মুদ্রার রেট জানতে চান, তাদের বলুন "মুদ্রা" ট্যাবে যেতে
- যখন ব্যবহারকারী নামাজের সময় জানতে চান, তাদের বলুন "নামাজ" ট্যাবে যেতে
- আপনার কাছে লাইভ স্পোর্টস ডেটা নেই, তাই পুরানো তথ্য দেবেন না

আপনি সাহায্য করতে পারেন:
- সাধারণ জ্ঞান ও তথ্য
- বাংলাদেশ সম্পর্কিত প্রশ্ন
- শিক্ষা ও গবেষণা
- দৈনন্দিন সমস্যার সমাধান
- সৃজনশীল লেখালেখি
- অনুবাদ (অনুবাদ ট্যাবে যেতে বলুন)
- এবং আরও অনেক কিছু!

সবসময় বিনয়ী, সহায়ক এবং সংক্ষিপ্ত উত্তর দিন। পুরানো বা অনুমানমূলক তথ্য দেবেন না।"""

def get_or_create_chat(session_id: str) -> LlmChat:
    """Get existing chat session or create a new one"""
    if session_id not in chat_sessions:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise ValueError("EMERGENT_LLM_KEY not found in environment variables")
        
        chat = LlmChat(
            api_key=api_key,
            session_id=session_id,
            system_message=get_system_message()  # Use dynamic system message
        ).with_model("gemini", "gemini-3-flash-preview")
        
        chat_sessions[session_id] = chat
        logger.info(f"Created new chat session: {session_id}")
    
    return chat_sessions[session_id]

# Routes
@api_router.get("/")
async def root():
    return {"message": "BdAsk API - বাংলাদেশের AI সহকারী"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks

# Chat endpoints
@api_router.post("/chat/session", response_model=ChatSession)
async def create_chat_session(request: NewSessionRequest):
    """Create a new chat session"""
    session = ChatSession(title=request.title or "নতুন কথোপকথন")
    doc = session.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.chat_sessions.insert_one(doc)
    logger.info(f"Created chat session: {session.id}")
    return session

@api_router.get("/chat/sessions", response_model=List[ChatSession])
async def get_chat_sessions():
    """Get all chat sessions"""
    sessions = await db.chat_sessions.find({}, {"_id": 0}).sort("updated_at", -1).to_list(100)
    for session in sessions:
        if isinstance(session.get('created_at'), str):
            session['created_at'] = datetime.fromisoformat(session['created_at'])
        if isinstance(session.get('updated_at'), str):
            session['updated_at'] = datetime.fromisoformat(session['updated_at'])
    return sessions

@api_router.get("/chat/messages/{session_id}", response_model=List[ChatMessage])
async def get_chat_messages(session_id: str):
    """Get all messages for a session"""
    messages = await db.chat_messages.find(
        {"session_id": session_id}, 
        {"_id": 0}
    ).sort("timestamp", 1).to_list(1000)
    
    for msg in messages:
        if isinstance(msg.get('timestamp'), str):
            msg['timestamp'] = datetime.fromisoformat(msg['timestamp'])
    return messages

@api_router.post("/chat/send", response_model=ChatResponse)
async def send_chat_message(request: ChatRequest):
    """Send a message and get AI response"""
    try:
        # Save user message
        user_msg = ChatMessage(
            session_id=request.session_id,
            role="user",
            content=request.message
        )
        user_doc = user_msg.model_dump()
        user_doc['timestamp'] = user_doc['timestamp'].isoformat()
        await db.chat_messages.insert_one(user_doc)
        
        # Get or create chat session
        chat = get_or_create_chat(request.session_id)
        
        # Send message to AI
        user_message = UserMessage(text=request.message)
        response = await chat.send_message(user_message)
        
        # Save AI response
        ai_msg = ChatMessage(
            session_id=request.session_id,
            role="assistant",
            content=response
        )
        ai_doc = ai_msg.model_dump()
        ai_doc['timestamp'] = ai_doc['timestamp'].isoformat()
        await db.chat_messages.insert_one(ai_doc)
        
        # Update session timestamp
        await db.chat_sessions.update_one(
            {"id": request.session_id},
            {"$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        logger.info(f"Chat response sent for session: {request.session_id}")
        
        return ChatResponse(
            session_id=request.session_id,
            response=response,
            timestamp=datetime.now(timezone.utc)
        )
        
    except Exception as e:
        logger.error(f"Error in chat: {str(e)}")
        raise HTTPException(status_code=500, detail=f"চ্যাটে সমস্যা হয়েছে: {str(e)}")

@api_router.delete("/chat/session/{session_id}")
async def delete_chat_session(session_id: str):
    """Delete a chat session and its messages"""
    await db.chat_sessions.delete_one({"id": session_id})
    await db.chat_messages.delete_many({"session_id": session_id})
    
    if session_id in chat_sessions:
        del chat_sessions[session_id]
    
    logger.info(f"Deleted chat session: {session_id}")
    return {"message": "সেশন মুছে ফেলা হয়েছে"}

@api_router.post("/translate", response_model=TranslationResponse)
async def translate_text(request: TranslationRequest):
    """Translate text using Gemini LLM"""
    try:
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise ValueError("EMERGENT_LLM_KEY not found")
        
        # Use Gemini for translation
        chat = LlmChat(
            api_key=api_key,
            session_id=f"translate_{uuid.uuid4()}",
            system_message="You are a professional translator. Translate the given text accurately while preserving meaning, tone, and cultural nuances. Only respond with the translated text, nothing else."
        ).with_model("gemini", "gemini-3-flash-preview")
        
        # Language names for prompt
        lang_names = {
            'bn': 'Bengali', 'en': 'English', 'hi': 'Hindi', 'ur': 'Urdu',
            'ar': 'Arabic', 'es': 'Spanish', 'fr': 'French', 'de': 'German',
            'zh': 'Chinese', 'ja': 'Japanese', 'ko': 'Korean'
        }
        
        source_name = lang_names.get(request.source, request.source)
        target_name = lang_names.get(request.target, request.target)
        
        prompt = f"Translate the following text from {source_name} to {target_name}:\n\n{request.text}"
        
        user_message = UserMessage(text=prompt)
        translated = await chat.send_message(user_message)
        
        logger.info(f"Translation completed: {request.source} -> {request.target}")
        
        return TranslationResponse(
            translated_text=translated.strip(),
            source=request.source,
            target=request.target
        )
        
    except Exception as e:
        logger.error(f"Translation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"অনুবাদে সমস্যা হয়েছে: {str(e)}")

# Cricket API endpoint
@api_router.get("/cricket/live")
async def get_live_cricket():
    """Get live cricket scores from CricketData.org"""
    import httpx
    
    cricket_api_key = os.environ.get('CRICKET_API_KEY')
    if not cricket_api_key:
        raise HTTPException(status_code=500, detail="Cricket API key not configured")
    
    try:
        async with httpx.AsyncClient() as client:
            # Get current matches
            response = await client.get(
                f"https://api.cricapi.com/v1/currentMatches?apikey={cricket_api_key}&offset=0",
                timeout=10.0
            )
            data = response.json()
            
            if data.get('status') != 'success':
                logger.warning(f"Cricket API returned: {data}")
                return {"matches": [], "message": "No live matches found"}
            
            matches = []
            for match in data.get('data', [])[:10]:  # Limit to 10 matches
                # Check if match has required fields
                if not match.get('name'):
                    continue
                    
                match_info = {
                    "id": match.get('id', ''),
                    "name": match.get('name', ''),
                    "status": match.get('status', 'Unknown'),
                    "venue": match.get('venue', ''),
                    "date": match.get('date', ''),
                    "matchType": match.get('matchType', ''),
                    "teams": match.get('teams', []),
                    "score": match.get('score', []),
                    "series_id": match.get('series_id', ''),
                    "fantasyEnabled": match.get('fantasyEnabled', False),
                    "bbbEnabled": match.get('bbbEnabled', False),
                    "hasSquad": match.get('hasSquad', False),
                    "matchStarted": match.get('matchStarted', False),
                    "matchEnded": match.get('matchEnded', False)
                }
                matches.append(match_info)
            
            logger.info(f"Cricket API returned {len(matches)} matches")
            return {"matches": matches, "total": len(matches)}
            
    except httpx.TimeoutException:
        logger.error("Cricket API timeout")
        raise HTTPException(status_code=504, detail="Cricket API timeout")
    except Exception as e:
        logger.error(f"Cricket API error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Cricket API error: {str(e)}")

# News API endpoint
@api_router.get("/news")
async def get_news(category: str = None):
    """Get Bangladesh news from NewsData.io"""
    import httpx
    
    news_api_key = os.environ.get('NEWS_API_KEY')
    if not news_api_key:
        raise HTTPException(status_code=500, detail="News API key not configured")
    
    try:
        async with httpx.AsyncClient() as client:
            # Build URL with parameters
            url = f"https://newsdata.io/api/1/news?apikey={news_api_key}&country=bd&language=bn"
            
            # Add category filter if provided
            if category and category != 'all':
                category_map = {
                    'national': 'politics',
                    'international': 'world',
                    'economy': 'business',
                    'sports': 'sports',
                    'technology': 'technology',
                    'entertainment': 'entertainment'
                }
                mapped_category = category_map.get(category.lower(), category)
                url += f"&category={mapped_category}"
            
            response = await client.get(url, timeout=10.0)
            data = response.json()
            
            if data.get('status') != 'success':
                logger.warning(f"News API returned: {data}")
                return {"articles": [], "message": "No news found"}
            
            articles = []
            for article in data.get('results', [])[:15]:  # Limit to 15 articles
                article_info = {
                    "id": article.get('article_id', ''),
                    "title": article.get('title', ''),
                    "description": article.get('description', ''),
                    "content": article.get('content', ''),
                    "source": article.get('source_id', 'Unknown'),
                    "sourceUrl": article.get('source_url', ''),
                    "link": article.get('link', ''),
                    "image": article.get('image_url'),
                    "pubDate": article.get('pubDate', ''),
                    "category": article.get('category', ['general'])[0] if article.get('category') else 'general',
                    "country": article.get('country', ['bd']),
                    "language": article.get('language', 'bn')
                }
                articles.append(article_info)
            
            logger.info(f"News API returned {len(articles)} articles")
            return {"articles": articles, "total": len(articles)}
            
    except httpx.TimeoutException:
        logger.error("News API timeout")
        raise HTTPException(status_code=504, detail="News API timeout")
    except Exception as e:
        logger.error(f"News API error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"News API error: {str(e)}")

# Football API endpoint
@api_router.get("/football/live")
async def get_live_football():
    """Get live football scores from Football-Data.org"""
    import httpx
    
    football_api_key = os.environ.get('FOOTBALL_API_KEY')
    if not football_api_key:
        raise HTTPException(status_code=500, detail="Football API key not configured")
    
    try:
        async with httpx.AsyncClient() as client:
            # Get today's matches from major leagues
            headers = {"X-Auth-Token": football_api_key}
            
            # Get matches from multiple competitions
            matches = []
            
            # Premier League (PL), La Liga (PD), Champions League (CL)
            competitions = [
                {"code": "PL", "name": "প্রিমিয়ার লিগ", "nameEn": "Premier League"},
                {"code": "PD", "name": "লা লিগা", "nameEn": "La Liga"},
                {"code": "CL", "name": "চ্যাম্পিয়ন্স লিগ", "nameEn": "Champions League"},
                {"code": "BL1", "name": "বুন্দেসলিগা", "nameEn": "Bundesliga"},
                {"code": "SA", "name": "সেরি আ", "nameEn": "Serie A"},
            ]
            
            for comp in competitions:
                try:
                    response = await client.get(
                        f"https://api.football-data.org/v4/competitions/{comp['code']}/matches?status=SCHEDULED,LIVE,IN_PLAY,PAUSED,FINISHED",
                        headers=headers,
                        timeout=10.0
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        for match in data.get('matches', [])[:5]:  # Limit per competition
                            home_team = match.get('homeTeam', {}).get('name', 'Home')
                            away_team = match.get('awayTeam', {}).get('name', 'Away')
                            home_score = match.get('score', {}).get('fullTime', {}).get('home')
                            away_score = match.get('score', {}).get('fullTime', {}).get('away')
                            status = match.get('status', 'SCHEDULED')
                            
                            # Map status to Bengali
                            status_map = {
                                'SCHEDULED': 'আসন্ন',
                                'TIMED': 'আসন্ন',
                                'LIVE': 'লাইভ',
                                'IN_PLAY': 'লাইভ',
                                'PAUSED': 'বিরতি',
                                'FINISHED': 'সম্পন্ন',
                                'POSTPONED': 'স্থগিত',
                                'CANCELLED': 'বাতিল'
                            }
                            
                            is_live = status in ['LIVE', 'IN_PLAY', 'PAUSED']
                            
                            match_info = {
                                "id": match.get('id'),
                                "teams": f"{home_team} vs {away_team}",
                                "teamsEn": f"{home_team} vs {away_team}",
                                "homeScore": home_score if home_score is not None else 0,
                                "awayScore": away_score if away_score is not None else 0,
                                "status": status_map.get(status, status),
                                "statusEn": status,
                                "league": comp['name'],
                                "leagueEn": comp['nameEn'],
                                "minute": match.get('minute'),
                                "isLive": is_live,
                                "utcDate": match.get('utcDate')
                            }
                            matches.append(match_info)
                except Exception as e:
                    logger.warning(f"Error fetching {comp['code']}: {e}")
                    continue
            
            logger.info(f"Football API returned {len(matches)} matches")
            return {"matches": matches[:20], "total": len(matches)}  # Limit to 20 total
            
    except httpx.TimeoutException:
        logger.error("Football API timeout")
        raise HTTPException(status_code=504, detail="Football API timeout")
    except Exception as e:
        logger.error(f"Football API error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Football API error: {str(e)}")

# Exchange Rate API endpoint
@api_router.get("/exchange/rates")
async def get_exchange_rates():
    """Get live exchange rates from ExchangeRate-API"""
    import httpx
    
    exchange_api_key = os.environ.get('EXCHANGE_API_KEY')
    if not exchange_api_key:
        raise HTTPException(status_code=500, detail="Exchange API key not configured")
    
    try:
        async with httpx.AsyncClient() as client:
            # Get rates with BDT as base
            response = await client.get(
                f"https://v6.exchangerate-api.com/v6/{exchange_api_key}/latest/BDT",
                timeout=10.0
            )
            
            data = response.json()
            
            if data.get('result') != 'success':
                logger.warning(f"Exchange API returned: {data}")
                raise HTTPException(status_code=500, detail="Exchange API error")
            
            # Get specific currencies we need
            all_rates = data.get('conversion_rates', {})
            
            # Filter to relevant currencies
            currency_list = ['USD', 'EUR', 'GBP', 'INR', 'SAR', 'AED', 'MYR', 'SGD', 'JPY', 'CNY', 'AUD', 'CAD']
            
            rates = {}
            for curr in currency_list:
                if curr in all_rates:
                    rates[curr] = all_rates[curr]
            
            logger.info(f"Exchange API returned rates for {len(rates)} currencies")
            return {
                "base": "BDT",
                "rates": rates,
                "lastUpdated": data.get('time_last_update_utc', '')
            }
            
    except httpx.TimeoutException:
        logger.error("Exchange API timeout")
        raise HTTPException(status_code=504, detail="Exchange API timeout")
    except Exception as e:
        logger.error(f"Exchange API error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Exchange API error: {str(e)}")

# Include the router in the main app
app.include_router(api_router)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
