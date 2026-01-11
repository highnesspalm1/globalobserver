"""
Global Observer - Telegram Ingestion Pipeline
Deterministic (No AI) content extraction from Telegram channels
"""

import os
import re
import json
import asyncio
from datetime import datetime, timezone
from typing import Optional, Dict, List, Tuple
from dataclasses import dataclass
from telethon import TelegramClient
from telethon.tl.types import Message
from supabase import create_client, Client

# Configuration
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
TELEGRAM_API_ID = os.environ.get("TELEGRAM_API_ID", "")
TELEGRAM_API_HASH = os.environ.get("TELEGRAM_API_HASH", "")

# OSINT Channels to monitor (public channels)
CHANNELS = [
    "ukrainenow",
    "truexanewsua",
    "operativnoZSU",
    "voyaborbu",
    "DeepStateUA",
]

@dataclass
class ExtractedData:
    """Extracted information from a message"""
    category: Optional[str]
    location_name: Optional[str]
    coordinates: Optional[Tuple[float, float]]
    confidence: float
    keywords_matched: List[str]


class DeterministicExtractor:
    """
    Rule-based content extraction without AI.
    Uses keyword matching, regex patterns, and gazetteer lookup.
    """
    
    # Category patterns (German/English/Ukrainian/Russian keywords)
    CATEGORY_PATTERNS = {
        'shelling': re.compile(
            r'(beschuss|артилер|shell|обстріл|удар|ракет|missile|rocket|'
            r'снаряд|мінометн|mortar|grad|mörser|artiller|РСЗВ|MLRS)',
            re.IGNORECASE
        ),
        'air_raid': re.compile(
            r'(luftalarm|повітряна тривога|air\s*raid|сирен|alarm|'
            r'авіаційн|воздушная тревога|air\s*alert)',
            re.IGNORECASE
        ),
        'drone': re.compile(
            r'(drohn|drone|БПЛА|shahed|герань|geran|UAV|'
            r'безпілотн|беспилотн|orlan|lancet)',
            re.IGNORECASE
        ),
        'combat': re.compile(
            r'(gefecht|бій|combat|fight|clash|assault|storm|'
            r'штурм|наступ|offensive|атака|attack)',
            re.IGNORECASE
        ),
        'movement': re.compile(
            r'(bewegung|рух|movement|колон|convoy|panzer|tank|'
            r'перемещен|техніка|equipment|advance|retreat)',
            re.IGNORECASE
        ),
        'naval': re.compile(
            r'(marine|флот|naval|ship|schiff|корабл|чорне море|'
            r'black sea|schwarzes meer|підводн|submarine)',
            re.IGNORECASE
        ),
        'infrastructure': re.compile(
            r'(infrastruktur|інфраструктур|infrastructure|энерго|'
            r'elektrizität|electricity|power|station|підстанц|'
            r'трансформатор|transformer)',
            re.IGNORECASE
        ),
        'humanitarian': re.compile(
            r'(humanitär|гуманітар|humanitarian|евакуац|'
            r'evacuation|refugees|flüchtling|біженц|civilians)',
            re.IGNORECASE
        ),
        'political': re.compile(
            r'(politik|політик|political|diplomati|president|'
            r'minister|санкц|sanction|переговор|negotiation)',
            re.IGNORECASE
        ),
    }
    
    # Severity indicators
    SEVERITY_PATTERNS = {
        'critical': re.compile(
            r'(massiv|масштабн|масивн|heavy|schwer|significant|'
            r'multiple|багато|mehrere|killed|загибл|погибл|casualties)',
            re.IGNORECASE
        ),
        'high': re.compile(
            r'(intense|intensiv|інтенсивн|damage|пошкоджен|'
            r'destroy|знищен|wounded|поранен)',
            re.IGNORECASE
        ),
        'medium': re.compile(
            r'(report|повідомля|сообщает|observed|спостеріга)',
            re.IGNORECASE
        ),
    }
    
    # Location gazetteer (major cities - expand as needed)
    LOCATIONS_GAZETTEER = {
        # Ukrainian cities with coordinates [lat, lng]
        'kyiv': (50.4501, 30.5234),
        'kiev': (50.4501, 30.5234),
        'київ': (50.4501, 30.5234),
        'kharkiv': (49.9935, 36.2304),
        'харків': (49.9935, 36.2304),
        'харьков': (49.9935, 36.2304),
        'charkiw': (49.9935, 36.2304),
        'odesa': (46.4825, 30.7233),
        'odessa': (46.4825, 30.7233),
        'одеса': (46.4825, 30.7233),
        'dnipro': (48.4647, 35.0462),
        'дніпро': (48.4647, 35.0462),
        'zaporizhzhia': (47.8388, 35.1396),
        'запоріжжя': (47.8388, 35.1396),
        'lviv': (49.8397, 24.0297),
        'львів': (49.8397, 24.0297),
        'lemberg': (49.8397, 24.0297),
        'mariupol': (47.0958, 37.5494),
        'маріуполь': (47.0958, 37.5494),
        'bakhmut': (48.5953, 38.0009),
        'бахмут': (48.5953, 38.0009),
        'artemivsk': (48.5953, 38.0009),
        'kherson': (46.6354, 32.6169),
        'херсон': (46.6354, 32.6169),
        'mykolaiv': (46.9750, 31.9946),
        'миколаїв': (46.9750, 31.9946),
        'sumy': (50.9077, 34.7981),
        'суми': (50.9077, 34.7981),
        'chernihiv': (51.4982, 31.2893),
        'чернігів': (51.4982, 31.2893),
        'donetsk': (48.0159, 37.8028),
        'донецьк': (48.0159, 37.8028),
        'luhansk': (48.5740, 39.3078),
        'луганськ': (48.5740, 39.3078),
        'sevastopol': (44.6054, 33.5220),
        'севастополь': (44.6054, 33.5220),
        'simferopol': (44.9521, 34.1024),
        'сімферополь': (44.9521, 34.1024),
        'crimea': (44.9521, 34.1024),
        'крим': (44.9521, 34.1024),
        'avdiivka': (48.1389, 37.7494),
        'авдіївка': (48.1389, 37.7494),
        'kupyansk': (49.7078, 37.6178),
        'куп\'янськ': (49.7078, 37.6178),
        'izium': (49.2108, 37.2547),
        'ізюм': (49.2108, 37.2547),
    }
    
    def extract(self, text: str) -> ExtractedData:
        """
        Extract structured data from message text using deterministic rules.
        """
        text_lower = text.lower()
        keywords_matched = []
        
        # 1. Determine category
        category = None
        max_matches = 0
        for cat, pattern in self.CATEGORY_PATTERNS.items():
            matches = pattern.findall(text)
            if len(matches) > max_matches:
                max_matches = len(matches)
                category = cat
                keywords_matched.extend(matches[:3])  # Keep top 3 matches
        
        # 2. Extract location
        location_name = None
        coordinates = None
        for loc_name, coords in self.LOCATIONS_GAZETTEER.items():
            if loc_name in text_lower:
                location_name = loc_name.title()
                coordinates = coords
                keywords_matched.append(loc_name)
                break
        
        # 3. Calculate confidence score (0-1)
        confidence = 0.0
        if category:
            confidence += 0.4
        if location_name:
            confidence += 0.4
        if max_matches > 1:
            confidence += 0.1
        if len(text) > 100:  # Longer messages tend to be more informative
            confidence += 0.1
        
        return ExtractedData(
            category=category,
            location_name=location_name,
            coordinates=coordinates,
            confidence=min(confidence, 1.0),
            keywords_matched=keywords_matched[:5]
        )
    
    def determine_severity(self, text: str) -> str:
        """Determine severity level from text"""
        for severity, pattern in self.SEVERITY_PATTERNS.items():
            if pattern.search(text):
                return severity
        return 'medium'


class IngestionPipeline:
    """
    Main ingestion pipeline for Telegram data.
    """
    
    def __init__(self):
        self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        self.extractor = DeterministicExtractor()
        self.telegram: Optional[TelegramClient] = None
    
    async def connect_telegram(self):
        """Initialize Telegram client"""
        self.telegram = TelegramClient(
            'global_observer_session',
            int(TELEGRAM_API_ID),
            TELEGRAM_API_HASH
        )
        await self.telegram.start()
        print("✅ Connected to Telegram")
    
    async def disconnect_telegram(self):
        """Disconnect Telegram client"""
        if self.telegram:
            await self.telegram.disconnect()
    
    async def fetch_channel_messages(
        self, 
        channel: str, 
        limit: int = 100
    ) -> List[Message]:
        """Fetch recent messages from a channel"""
        messages = []
        try:
            async for message in self.telegram.iter_messages(channel, limit=limit):
                if message.text:  # Only text messages
                    messages.append(message)
        except Exception as e:
            print(f"❌ Error fetching from {channel}: {e}")
        return messages
    
    def store_raw_report(
        self, 
        message: Message, 
        channel: str,
        extracted: ExtractedData
    ) -> Optional[str]:
        """Store raw message in database"""
        try:
            # Prepare coordinates
            coords = None
            if extracted.coordinates:
                coords = f"POINT({extracted.coordinates[1]} {extracted.coordinates[0]})"
            
            data = {
                "source": "telegram",
                "source_channel": channel,
                "source_url": f"https://t.me/{channel}/{message.id}",
                "source_message_id": str(message.id),
                "content": message.text[:2000],  # Limit length
                "extracted_category": extracted.category,
                "extracted_location": extracted.location_name,
                "confidence_score": extracted.confidence,
                "raw_data": {
                    "keywords": extracted.keywords_matched,
                    "message_date": message.date.isoformat() if message.date else None,
                    "views": message.views,
                }
            }
            
            result = self.supabase.table("raw_reports").insert(data).execute()
            return result.data[0]["id"] if result.data else None
            
        except Exception as e:
            print(f"❌ Error storing raw report: {e}")
            return None
    
    def create_event_from_report(
        self, 
        report_id: str, 
        extracted: ExtractedData,
        message_text: str,
        message_date: datetime,
        source_url: str
    ) -> Optional[str]:
        """Create a verified event from an extracted report"""
        if not extracted.category or not extracted.coordinates:
            return None
        
        try:
            severity = self.extractor.determine_severity(message_text)
            
            # Create title from first sentence or first 100 chars
            title = message_text.split('.')[0][:100]
            if len(title) < len(message_text):
                title += "..."
            
            data = {
                "event_date": message_date.isoformat(),
                "title": title,
                "description": message_text[:500],
                "category": extracted.category,
                "severity": severity,
                "latitude": extracted.coordinates[0],
                "longitude": extracted.coordinates[1],
                "location_name": extracted.location_name,
                "source_url": source_url,
                "source_type": "telegram",
                "raw_report_id": report_id,
                "verified": False,  # Needs manual verification
                "tags": extracted.keywords_matched,
            }
            
            result = self.supabase.table("events").insert(data).execute()
            return result.data[0]["id"] if result.data else None
            
        except Exception as e:
            print(f"❌ Error creating event: {e}")
            return None
    
    async def process_channel(self, channel: str, limit: int = 50):
        """Process messages from a single channel"""
        print(f"\n📡 Processing channel: {channel}")
        messages = await self.fetch_channel_messages(channel, limit)
        
        stats = {"total": 0, "stored": 0, "events": 0, "skipped": 0}
        
        for message in messages:
            stats["total"] += 1
            
            # Check if already processed
            existing = self.supabase.table("raw_reports").select("id").eq(
                "source_message_id", str(message.id)
            ).eq("source_channel", channel).execute()
            
            if existing.data:
                stats["skipped"] += 1
                continue
            
            # Extract data
            extracted = self.extractor.extract(message.text)
            
            # Only store if we found something relevant
            if extracted.confidence < 0.3:
                stats["skipped"] += 1
                continue
            
            # Store raw report
            report_id = self.store_raw_report(message, channel, extracted)
            if report_id:
                stats["stored"] += 1
                
                # Auto-create event if high confidence
                if extracted.confidence >= 0.7 and extracted.coordinates:
                    event_id = self.create_event_from_report(
                        report_id,
                        extracted,
                        message.text,
                        message.date or datetime.now(timezone.utc),
                        f"https://t.me/{channel}/{message.id}"
                    )
                    if event_id:
                        stats["events"] += 1
        
        print(f"   📊 Stats: {stats}")
        return stats
    
    async def run(self, channels: List[str] = None, limit: int = 50):
        """Run the full ingestion pipeline"""
        channels = channels or CHANNELS
        
        print("🚀 Starting Global Observer Ingestion Pipeline")
        print(f"   Mode: Deterministic (No AI)")
        print(f"   Channels: {len(channels)}")
        
        await self.connect_telegram()
        
        total_stats = {"total": 0, "stored": 0, "events": 0, "skipped": 0}
        
        for channel in channels:
            try:
                stats = await self.process_channel(channel, limit)
                for key in total_stats:
                    total_stats[key] += stats[key]
            except Exception as e:
                print(f"❌ Error processing {channel}: {e}")
        
        await self.disconnect_telegram()
        
        print("\n" + "="*50)
        print("📈 PIPELINE COMPLETE")
        print(f"   Total messages: {total_stats['total']}")
        print(f"   Stored reports: {total_stats['stored']}")
        print(f"   Events created: {total_stats['events']}")
        print(f"   Skipped: {total_stats['skipped']}")
        print("="*50)


# Entry point for GitHub Actions
async def main():
    pipeline = IngestionPipeline()
    await pipeline.run()


if __name__ == "__main__":
    asyncio.run(main())
