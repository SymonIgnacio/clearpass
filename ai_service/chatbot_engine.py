import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from chatbot_data import TRAINING_DATA, INTENT_RESPONSES
import logging
import joblib
import os
import csv
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MODEL_PATH = 'chatbot_model.pkl'
MISSED_QUERIES_LOG = 'missed_queries.csv'

class ChatbotEngine:
    def __init__(self):
        self.pipeline = None
        self.is_trained = False
        self._initialize_model()

    def _initialize_model(self):
        """Load model from disk or train if not exists"""
        if os.path.exists(MODEL_PATH):
            try:
                self.pipeline = joblib.load(MODEL_PATH)
                self.is_trained = True
                logger.info("Loaded pre-trained Chatbot NLU Model.")
                return
            except Exception as e:
                logger.warning(f"Failed to load model: {e}. Retraining...")
        
        self._train_model()

    def _train_model(self):
        """Train the NLU model and save to disk"""
        try:
            logger.info("Training Chatbot NLU Model...")
            
            # Prepare data
            df = pd.DataFrame(TRAINING_DATA, columns=['text', 'intent'])
            X = df['text']
            y = df['intent']
            
            # Create pipeline: TF-IDF -> Logistic Regression
            self.pipeline = Pipeline([
                ('tfidf', TfidfVectorizer(ngram_range=(1, 2))),
                ('clf', LogisticRegression(random_state=42, C=10.0, max_iter=1000))
            ])
            
            self.pipeline.fit(X, y)
            self.is_trained = True
            
            # Persist model
            joblib.dump(self.pipeline, MODEL_PATH)
            logger.info("Chatbot NLU Model trained and saved successfully.")
            
        except Exception as e:
            logger.error(f"Failed to train Chatbot NLU Model: {e}")
            self.is_trained = False

    def _log_missed_query(self, message, confidence, predicted_intent):
        """Log low confidence queries for active learning"""
        try:
            file_exists = os.path.exists(MISSED_QUERIES_LOG)
            with open(MISSED_QUERIES_LOG, 'a', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                if not file_exists:
                    writer.writerow(['timestamp', 'message', 'confidence', 'predicted_intent'])
                writer.writerow([datetime.now().isoformat(), message, confidence, predicted_intent])
        except Exception as e:
            logger.error(f"Failed to log missed query: {e}")

    def predict(self, message):
        """
        Predict intent from user message.
        Returns: (intent, confidence, response_data)
        """
        if not self.is_trained or not message.strip():
            return "fallback", 0.0, INTENT_RESPONSES['fallback']

        try:
            # Predict intent
            intent = self.pipeline.predict([message])[0]
            
            # Get confidence score
            probs = self.pipeline.predict_proba([message])[0]
            confidence = max(probs)
            
            logger.info(f"Message: '{message}' -> Intent: {intent} (Conf: {confidence:.2f})")

            # Threshold for fallback (e.g., if confidence is too low)
            if confidence < 0.2:
                self._log_missed_query(message, confidence, intent)
                return "fallback", confidence, INTENT_RESPONSES['fallback']
            
            response_data = INTENT_RESPONSES.get(intent, INTENT_RESPONSES['fallback'])
            return intent, confidence, response_data

        except Exception as e:
            logger.error(f"Prediction error: {e}")
            return "error", 0.0, INTENT_RESPONSES['fallback']

    def force_retrain(self):
        """Manually trigger retraining (useful after updating data)"""
        self._train_model()
        return self.is_trained

# Singleton instance
chatbot = ChatbotEngine()
