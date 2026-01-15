import logging
import os
import csv
import math
import re
from datetime import datetime
from collections import Counter
from chatbot_data import TRAINING_DATA, INTENT_RESPONSES

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MISSED_QUERIES_LOG = 'missed_queries.csv'

class SimpleTokenizer:
    @staticmethod
    def tokenize(text):
        # Simple tokenization: lowercase and remove non-alphanumeric
        text = text.lower()
        return re.findall(r'\b\w+\b', text)

class SimpleChatbotEngine:
    def __init__(self):
        self.training_data = TRAINING_DATA
        self.corpus_words = set()
        self.documents = []
        self._train_model()

    def _train_model(self):
        """Prepare the simple vectorizer"""
        logger.info("Initializing Simple Chatbot Engine...")
        
        # Build vocabulary and document vectors
        for text, intent in self.training_data:
            tokens = SimpleTokenizer.tokenize(text)
            self.corpus_words.update(tokens)
            self.documents.append({
                'tokens': tokens,
                'intent': intent,
                'vector': self._text_to_vector(tokens)
            })
            
        logger.info("Simple Chatbot Engine initialized.")

    def _text_to_vector(self, tokens):
        """Convert tokens to a simple frequency vector"""
        return Counter(tokens)

    def _get_cosine(self, vec1, vec2):
        """Compute cosine similarity between two frequency vectors"""
        intersection = set(vec1.keys()) & set(vec2.keys())
        numerator = sum([vec1[x] * vec2[x] for x in intersection])

        sum1 = sum([vec1[x]**2 for x in vec1.keys()])
        sum2 = sum([vec2[x]**2 for x in vec2.keys()])
        denominator = math.sqrt(sum1) * math.sqrt(sum2)

        if not denominator:
            return 0.0
        return float(numerator) / denominator

    def _log_missed_query(self, message, confidence, predicted_intent):
        """Log low confidence queries for active learning"""
        try:
            file_exists = os.path.exists(MISSED_QUERIES_LOG)
            # In Vercel, writing to filesystem might fail or be ephemeral, so we wrap in try/except
            # Also, we might want to skip logging in production if read-only
            if os.environ.get('VERCEL_ENV'): 
                return

            with open(MISSED_QUERIES_LOG, 'a', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                if not file_exists:
                    writer.writerow(['timestamp', 'message', 'confidence', 'predicted_intent'])
                writer.writerow([datetime.now().isoformat(), message, confidence, predicted_intent])
        except Exception as e:
            logger.warning(f"Failed to log missed query (expected in serverless): {e}")

    def predict(self, message):
        """
        Predict intent from user message using Cosine Similarity.
        Returns: (intent, confidence, response_data)
        """
        if not message.strip():
            return "fallback", 0.0, INTENT_RESPONSES['fallback']

        try:
            input_tokens = SimpleTokenizer.tokenize(message)
            input_vector = self._text_to_vector(input_tokens)
            
            best_intent = "fallback"
            best_score = 0.0

            # Find best match in training data
            # Note: For larger datasets, this O(N) scan is inefficient, but for <100 examples it's instant.
            for doc in self.documents:
                score = self._get_cosine(input_vector, doc['vector'])
                if score > best_score:
                    best_score = score
                    best_intent = doc['intent']

            logger.info(f"Message: '{message}' -> Intent: {best_intent} (Score: {best_score:.2f})")

            # Threshold
            if best_score < 0.2:
                self._log_missed_query(message, best_score, best_intent)
                return "fallback", best_score, INTENT_RESPONSES['fallback']
            
            response_data = INTENT_RESPONSES.get(best_intent, INTENT_RESPONSES['fallback'])
            return best_intent, best_score, response_data

        except Exception as e:
            logger.error(f"Prediction error: {e}")
            return "error", 0.0, INTENT_RESPONSES['fallback']

    def force_retrain(self):
        """No-op for simple engine"""
        self._train_model()
        return True

# Singleton instance
chatbot = SimpleChatbotEngine()
