"""
Barangay AI Chatbot Engine
Rule-based NLP chatbot for resident inquiries using keyword matching and intent classification
"""

import json
import random
from typing import Dict, List, Optional, Tuple, Any
from pathlib import Path

from ..shared.logger import ai_logger, PerformanceTimer
from ..shared.text_similarity import TextSimilarityEngine, IntentMatcher, FAQMatcher
from ..shared.preprocessing import text_processor
from ..shared.database import json_db


class ChatbotEngine:
    """
    Main chatbot engine for resident inquiries
    Uses rule-based NLP with keyword matching and fuzzy string similarity
    """

    def __init__(self, data_dir: str = "data"):
        """
        Initialize the chatbot engine

        Args:
            data_dir: Directory containing FAQ and intent data
        """
        self.data_dir = Path(data_dir)
        self.similarity_engine = TextSimilarityEngine(threshold=75.0)
        self.intent_matcher = IntentMatcher()
        self.faq_matcher = FAQMatcher()

        # Load configuration data
        self.intents = self._load_intents()
        self.responses = self._load_responses()
        self.faq_data = self._load_faq_data()

        # Initialize components with loaded data
        self._initialize_components()

        ai_logger.info("🤖 Chatbot Engine initialized successfully")

    def _load_intents(self) -> Dict:
        """Load intent definitions from JSON file"""
        intents_file = self.data_dir / "faq" / "barangay_faq_data.json"
        if not intents_file.exists():
            intents_file = Path("ai/chatbot/intents/faq_intents.json")

        try:
            with open(intents_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get('intents', [])
        except Exception as e:
            ai_logger.warning(f"Could not load intents: {e}")
            return []

    def _load_responses(self) -> Dict:
        """Load response templates"""
        responses_file = Path("ai/chatbot/intents/response_templates.json")
        try:
            with open(responses_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            ai_logger.warning(f"Could not load responses: {e}")
            return {"responses": {}, "fallback_responses": []}

    def _load_faq_data(self) -> List[Dict]:
        """Load FAQ database"""
        try:
            return json_db.load_collection("faqs")
        except Exception as e:
            ai_logger.warning(f"Could not load FAQ data: {e}")
            return []

    def _initialize_components(self):
        """Initialize matcher components with loaded data"""

        # Initialize intent matcher with intent definitions
        for intent in self.intents:
            self.intent_matcher.add_intent(
                intent_name=intent['name'],
                keywords=intent['keywords'],
                examples=intent.get('examples', [])
            )

        # Initialize FAQ matcher with FAQ data
        for faq in self.faq_data:
            self.faq_matcher.add_faq(
                question=faq['question'],
                answer=faq['answer'],
                keywords=faq.get('keywords')
            )

    def process_query(self, user_query: str) -> Dict[str, Any]:
        """
        Process user query and return appropriate response

        Args:
            user_query: User's question or message

        Returns:
            Dictionary containing response, confidence, and metadata
        """
        with PerformanceTimer(ai_logger, "chatbot_query_processing"):
            # Preprocess the query
            processed_query = self._preprocess_query(user_query)

            # Try different matching strategies
            faq_result = self._find_faq_match(processed_query)
            if faq_result:
                return faq_result

            intent_result = self._find_intent_match(processed_query)
            if intent_result:
                return intent_result

            # Fallback response
            return self._generate_fallback_response(processed_query)

    def _preprocess_query(self, query: str) -> Dict[str, Any]:
        """
        Preprocess user query for better matching

        Args:
            query: Raw user query

        Returns:
            Processed query data
        """
        if not query or not query.strip():
            return {
                'original': query,
                'cleaned': '',
                'tokens': [],
                'keywords': []
            }

        # Basic cleaning
        cleaned = text_processor.clean_text(query)

        # Extract keywords
        keywords = text_processor.extract_keywords(cleaned)

        return {
            'original': query,
            'cleaned': cleaned,
            'tokens': text_processor.tokenize_text(cleaned),
            'keywords': keywords
        }

    def _find_faq_match(self, processed_query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Try to find direct FAQ match

        Args:
            processed_query: Preprocessed query data

        Returns:
            FAQ match result or None
        """
        answer, confidence = self.faq_matcher.find_answer(processed_query['original'])

        if answer and confidence >= 75.0:
            return {
                'response': answer,
                'confidence': confidence,
                'match_type': 'faq_direct',
                'source': 'faq_database',
                'confidence_level': self._get_confidence_level(confidence)
            }

        return None

    def _find_intent_match(self, processed_query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Try to find intent-based match

        Args:
            processed_query: Preprocessed query data

        Returns:
            Intent match result or None
        """
        intent_name, confidence = self.intent_matcher.classify_intent(processed_query['original'])

        if intent_name != 'unknown' and confidence >= 70.0:
            response = self._get_intent_response(intent_name)

            if response:
                return {
                    'response': response,
                    'confidence': confidence,
                    'match_type': 'intent_based',
                    'intent': intent_name,
                    'source': 'intent_templates',
                    'confidence_level': self._get_confidence_level(confidence)
                }

        return None

    def _generate_fallback_response(self, processed_query: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate fallback response when no match found

        Args:
            processed_query: Preprocessed query data

        Returns:
            Fallback response
        """
        fallback_responses = self.responses.get('fallback_responses', [
            "I'm sorry, I didn't understand that. Could you please rephrase your question?"
        ])

        response = random.choice(fallback_responses)

        return {
            'response': response,
            'confidence': 0.0,
            'match_type': 'fallback',
            'source': 'fallback_templates',
            'confidence_level': 'low',
            'suggestions': self._generate_suggestions(processed_query)
        }

    def _get_intent_response(self, intent_name: str) -> Optional[str]:
        """
        Get response for identified intent

        Args:
            intent_name: Name of the identified intent

        Returns:
            Random response from intent templates
        """
        intent_responses = self.responses.get('responses', {}).get(intent_name, [])

        if intent_responses:
            return random.choice(intent_responses)

        return None

    def _get_confidence_level(self, confidence: float) -> str:
        """
        Convert confidence score to level

        Args:
            confidence: Confidence score (0-100)

        Returns:
            Confidence level string
        """
        if confidence >= 85:
            return 'high'
        elif confidence >= 70:
            return 'medium'
        else:
            return 'low'

    def _generate_suggestions(self, processed_query: Dict[str, Any]) -> List[str]:
        """
        Generate query suggestions based on processed input

        Args:
            processed_query: Preprocessed query data

        Returns:
            List of suggested queries
        """
        keywords = processed_query.get('keywords', [])

        # Simple suggestion logic based on keywords
        suggestions = []

        if any(word in keywords for word in ['clearance', 'certificate', 'requirements']):
            suggestions.extend([
                "What are the requirements for barangay clearance?",
                "How long does certificate processing take?",
                "What certificates are available?"
            ])

        elif any(word in keywords for word in ['blotter', 'report', 'incident']):
            suggestions.extend([
                "How do I report an incident?",
                "What happens after filing a blotter?",
                "How does the investigation process work?"
            ])

        elif any(word in keywords for word in ['id', 'identification', 'card']):
            suggestions.extend([
                "How do I get a barangay ID?",
                "What are the ID requirements?",
                "How long is the ID valid?"
            ])

        # Add general suggestions if no specific matches
        if not suggestions:
            suggestions.extend([
                "What are your office hours?",
                "How can I contact the barangay?",
                "What services are available?"
            ])

        return suggestions[:3]  # Return max 3 suggestions

    def add_custom_faq(self, question: str, answer: str, keywords: Optional[List[str]] = None):
        """
        Add custom FAQ to the knowledge base

        Args:
            question: FAQ question
            answer: FAQ answer
            keywords: Optional keywords for better matching
        """
        # Add to matcher
        self.faq_matcher.add_faq(question, answer, keywords)

        # Add to persistent storage
        faq_entry = {
            'question': question,
            'answer': answer,
            'keywords': keywords or text_processor.extract_keywords(question),
            'category': 'custom',
            'priority': 'medium'
        }

        self.faq_data.append(faq_entry)
        json_db.save_collection("faqs", self.faq_data)

        ai_logger.info(f"✅ Added custom FAQ: {question}")

    def get_statistics(self) -> Dict[str, Any]:
        """
        Get chatbot usage statistics

        Returns:
            Statistics dictionary
        """
        return {
            'total_faqs': len(self.faq_data),
            'total_intents': len(self.intents),
            'faq_categories': self._get_faq_categories(),
            'intent_categories': self._get_intent_categories()
        }

    def _get_faq_categories(self) -> Dict[str, int]:
        """Get FAQ count by category"""
        categories = {}
        for faq in self.faq_data:
            category = faq.get('category', 'uncategorized')
            categories[category] = categories.get(category, 0) + 1
        return categories

    def _get_intent_categories(self) -> Dict[str, int]:
        """Get intent count by category"""
        categories = {}
        for intent in self.intents:
            category = intent.get('category', 'uncategorized')
            categories[category] = categories.get(category, 0) + 1
        return categories

    def reload_data(self):
        """Reload all data from files"""
        ai_logger.info("🔄 Reloading chatbot data...")

        self.intents = self._load_intents()
        self.responses = self._load_responses()
        self.faq_data = self._load_faq_data()

        self._initialize_components()

        ai_logger.info("✅ Chatbot data reloaded")


# Example usage and testing
if __name__ == "__main__":
    # Initialize chatbot
    chatbot = ChatbotEngine()

    # Test queries
    test_queries = [
        "What do I need for barangay clearance?",
        "How long does it take to process certificates?",
        "How do I report an incident?",
        "What are your office hours?",
        "Some random question that doesn't match"
    ]

    print("🤖 Barangay AI Chatbot Demo")
    print("=" * 50)

    for query in test_queries:
        print(f"\n👤 User: {query}")

        result = chatbot.process_query(query)
        response = result['response']
        confidence = result['confidence']
        match_type = result['match_type']

        print(f"🤖 Bot ({match_type}, {confidence:.1f}%): {response}")

        if 'suggestions' in result and result['suggestions']:
            print(f"💡 Suggestions: {result['suggestions']}")

    print(f"\n📊 Statistics: {chatbot.get_statistics()}")
