"""
Provider AI: Mock, Gemini, Groq dengan fallback otomatis.
"""
import json
import random
import logging
import os
from typing import Optional

logger = logging.getLogger("faceai.providers")

# ==========================================
# Mock Provider (Development)
# ==========================================
class MockProvider:
    """Provider dummy yang mengembalikan respons berdasarkan data wajah."""
    
    def analyze(self, face_data: dict) -> dict:
        geometry = face_data.get("geometry", {})
        symmetry = geometry.get("symmetry", 50)
        harmony = geometry.get("harmony", 50)
        
        # Skor bervariasi berdasarkan data asli, bukan purely random
        base = (symmetry + harmony) / 2
        variation = random.uniform(-10, 10)
        overall = min(100, max(0, base + variation))
        
        def feature_score(base_val):
            return min(100, max(0, base_val + random.uniform(-12, 12)))
        
        return {
            "overall_score": round(overall, 1),
            "confidence": round(random.uniform(0.75, 0.92), 2),
            "summary": "Wajah memiliki proporsi yang cukup seimbang. " +
                      ("Simetri wajah cukup baik." if symmetry > 60 else "Beberapa area menunjukkan sedikit asimetri."),
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
            "strengths": [
                "Proporsi wajah yang seimbang",
                "Garis rahang yang terdefinisi",
                "Harmoni fitur wajah yang baik"
            ],
            "suggestions": [
                "Pastikan pencahayaan optimal saat pengambilan gambar",
                "Ekspresi natural akan meningkatkan hasil analisis",
                "Pertimbangkan gaya rambut yang membingkai wajah"
            ]
        }


# ==========================================
# Gemini Provider
# ==========================================
class GeminiProvider:
    def __init__(self, api_key: str):
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-2.0-flash')
            self.available = True
        except Exception as e:
            logger.warning(f"Gemini init failed: {e}")
            self.available = False
    
    def analyze(self, face_data: dict, system_prompt: str, user_prompt: str) -> Optional[dict]:
        if not self.available:
            return None
        try:
            from app.services.prompt_template import SYSTEM_PROMPT
            prompt = f"{SYSTEM_PROMPT}\n\n{user_prompt}"
            response = self.model.generate_content(prompt)
            text = response.text.strip()
            # Bersihkan markdown code fences jika ada
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
            return json.loads(text)
        except Exception as e:
            logger.warning(f"Gemini API error: {e}")
            self.available = False
            return None


# ==========================================
# Groq Provider
# ==========================================
class GroqProvider:
    def __init__(self, api_key: str):
        try:
            from groq import Groq
            self.client = Groq(api_key=api_key)
            self.available = True
        except Exception as e:
            logger.warning(f"Groq init failed: {e}")
            self.available = False
    
    def analyze(self, face_data: dict, system_prompt: str, user_prompt: str) -> Optional[dict]:
        if not self.available:
            return None
        try:
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            text = response.choices[0].message.content.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
            return json.loads(text)
        except Exception as e:
            logger.warning(f"Groq API error: {e}")
            self.available = False
            return None


# ==========================================
# Provider Router (Fallback Logic)
# ==========================================
class AIProviderRouter:
    def __init__(self):
        self.mock = MockProvider()
        self.providers = {}
        self._init_providers()
    
    def _init_providers(self):
        from app.core import config
        
        if config.GEMINI_API_KEY:
            self.providers["gemini"] = GeminiProvider(config.GEMINI_API_KEY)
        if config.GROQ_API_KEY:
            self.providers["groq"] = GroqProvider(config.GROQ_API_KEY)
    
    def analyze(self, face_data: dict) -> dict:
        from app.core import config
        from app.services.prompt_template import SYSTEM_PROMPT, build_user_prompt
        
        user_prompt = build_user_prompt(face_data)
        
        # Coba provider sesuai urutan
        for provider_name in config.AI_PROVIDER_ORDER:
            provider_name = provider_name.strip()
            if provider_name == "mock":
                result = self.mock.analyze(face_data)
                if result:
                    logger.info("Using mock provider")
                    return result
            elif provider_name in self.providers:
                provider = self.providers[provider_name]
                result = provider.analyze(face_data, SYSTEM_PROMPT, user_prompt)
                if result:
                    logger.info(f"Using {provider_name} provider")
                    return result
        
        # Fallback akhir: mock
        logger.warning("All providers failed, using mock as final fallback")
        return self.mock.analyze(face_data)


# Singleton
router = AIProviderRouter()