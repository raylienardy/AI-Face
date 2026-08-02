# backend/app/services/ai_providers.py

import json
import random
import re
import logging
from typing import Optional
from app.core import config

logger = logging.getLogger("faceai.providers")

# ==========================================
# Mock Provider
# ==========================================
class MockProvider:
    def analyze(self, face_data: dict) -> dict:
        geometry = face_data.get("geometry", {})
        symmetry = geometry.get("symmetry", 50)
        harmony = geometry.get("harmony", 50)
        base = (symmetry + harmony) / 2
        variation = random.uniform(-10, 10)
        overall = min(100, max(0, base + variation))

        def feature_score(base_val):
            return min(100, max(0, base_val + random.uniform(-12, 12)))

        return {
            "overall_score": round(overall, 1),
            "confidence": round(random.uniform(0.75, 0.92), 2),
            "summary": "Wajah memiliki proporsi yang cukup seimbang.",
            "feature_scores": {
                "eyes": {"score": round(feature_score(65), 1), "comment": "Bentuk mata proporsional."},
                "eyebrows": {"score": round(feature_score(60), 1), "comment": "Alis memiliki ketebalan yang wajar."},
                "nose": {"score": round(feature_score(70), 1), "comment": "Hidung seimbang dengan wajah."},
                "lips": {"score": round(feature_score(68), 1), "comment": "Bibir proporsional."},
                "jaw": {"score": round(feature_score(72), 1), "comment": "Garis rahang terdefinisi."},
                "skin": {"score": round(feature_score(65), 1), "comment": "Kualitas kulit cukup baik."},
                "hair": {"score": round(feature_score(60), 1), "comment": "Rambut terlihat sehat."},
                "cheekbones": {"score": round(feature_score(70), 1), "comment": "Tulang pipi terdefinisi."},
                "facial_harmony": {"score": round(feature_score(harmony), 1), "comment": "Harmoni wajah cukup baik."},
                "facial_symmetry": {"score": round(feature_score(symmetry), 1), "comment": "Simetri wajah dalam batas normal."}
            },
            "strengths": ["Proporsi wajah yang seimbang", "Garis rahang yang terdefinisi"],
            "suggestions": ["Pastikan pencahayaan optimal", "Ekspresi natural"]
        }

# ==========================================
# Gemini Provider
# ==========================================
class GeminiProvider:
    def __init__(self, api_key: str):
        self.available = False
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-2.0-flash')
            self.available = True
        except Exception as e:
            logger.warning(f"Gemini init failed: {e}")

    def analyze(self, face_data: dict, system_prompt: str, user_prompt: str) -> Optional[dict]:
        if not self.available:
            return None
        try:
            prompt = f"{system_prompt}\n\n{user_prompt}"
            response = self.model.generate_content(prompt)
            text = response.text.strip()
            return self._parse_json(text)
        except Exception as e:
            logger.warning(f"Gemini API error: {e}")
            self.available = False
            return None

    @staticmethod
    def _parse_json(text: str) -> dict:
        text = re.sub(r'```(?:json)?\s*', '', text).strip()
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            text = match.group(0)
        text = re.sub(r',\s*}', '}', text)
        text = re.sub(r',\s*]', ']', text)
        return json.loads(text)

# ==========================================
# Groq Provider
# ==========================================
class GroqProvider:
    def __init__(self, api_key: str):
        self.available = False
        try:
            from groq import Groq
            self.client = Groq(api_key=api_key)
            self.available = True
        except Exception as e:
            logger.warning(f"Groq init failed: {e}")

    def analyze(self, face_data: dict, system_prompt: str, user_prompt: str) -> Optional[dict]:
        if not self.available:
            return None
        try:
            full_prompt = f"{system_prompt}\n\n{user_prompt}\n\nIMPORTANT: Return ONLY a valid JSON object. No other text."
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": full_prompt}],
                temperature=0.7,
                max_tokens=1000
            )
            text = response.choices[0].message.content.strip()
            return GeminiProvider._parse_json(text)
        except Exception as e:
            logger.warning(f"Groq API error: {e}")
            self.available = False
            return None

# ==========================================
# Provider Router
# ==========================================
class AIProviderRouter:
    def __init__(self):
        self.mock = MockProvider()
        self.providers = {}
        self._init_providers()

    def _init_providers(self):

        if config.GEMINI_API_KEY:
            logger.info("Initializing Gemini provider")
            self.providers["gemini"] = GeminiProvider(config.GEMINI_API_KEY)

        if config.GROQ_API_KEY:
            try:
                self.providers["groq"] = GroqProvider(config.GROQ_API_KEY)
                logger.info(f"Groq provider ready: {self.providers['groq'].available}")
            except Exception as e:
                logger.error(f"Groq provider failed to init: {e}")

    def analyze(self, face_data: dict) -> dict:
        from app.services.prompt_template import SYSTEM_PROMPT, build_user_prompt
        user_prompt = build_user_prompt(face_data)
        
        for provider_name in config.AI_PROVIDER_ORDER:
            provider_name = provider_name.strip()
            logger.info(f"Trying provider: {provider_name}")
            if provider_name == "mock":
                result = self.mock.analyze(face_data)
                if result:
                    return result
            elif provider_name in self.providers:
                provider = self.providers[provider_name]
                result = provider.analyze(face_data, SYSTEM_PROMPT, user_prompt)
                if result:
                    return result
                else:
                    logger.warning(f"{provider_name} provider failed, trying next")
            else:
                logger.warning(f"Unknown provider: {provider_name}")

        logger.warning("All providers failed, using mock as final fallback")
        return self.mock.analyze(face_data)

router = AIProviderRouter()