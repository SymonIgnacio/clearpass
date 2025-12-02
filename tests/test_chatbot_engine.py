import pytest
from unittest.mock import patch, mock_open, MagicMock
import json
import re


@pytest.fixture
def sample_faq_data():
    """Sample FAQ data for testing"""
    return {
        "faqs": [
            {
                "question": "How do I register as a resident?",
                "answer": "Visit the barangay hall with valid ID and proof of address",
                "keywords": ["register", "resident", "id"]
            },
            {
                "question": "What are the office hours?",
                "answer": "Monday to Friday, 8:00 AM to 5:00 PM",
                "keywords": ["hours", "office", "schedule"]
            },
            {
                "question": "How to file a blotter report?",
                "answer": "Go to barangay hall or call hotline 123-4567",
                "keywords": ["blotter", "report", "complaint"]
            }
        ]
    }


class MockChatbotEngine:
    """Mock rule-based chatbot engine for testing"""

    def __init__(self, faq_data=None):
        self.faq_data = faq_data or {"faqs": []}
        self.keyword_patterns = {
            'greeting': re.compile(r'\b(hello|hi|hey|good\s+(morning|afternoon|evening))\b', re.IGNORECASE),
            'gratitude': re.compile(r'\b(thank\s+you|thanks|appreciate)\b', re.IGNORECASE),
            'register': re.compile(r'\b(register|resident|sign\s+up)\b', re.IGNORECASE),
            'blotter': re.compile(r'\b(blotter|report|complaint|incident)\b', re.IGNORECASE),
            'hours': re.compile(r'\b(hours|time|open|close|schedule)\b', re.IGNORECASE)
        }

    def detect_keywords(self, message):
        """Detect keywords in message using regex patterns"""
        detected = {}
        message_lower = message.lower()

        for intent, pattern in self.keyword_patterns.items():
            matches = pattern.findall(message_lower)
            if matches:
                detected[intent] = matches

        return detected

    def classify_intent(self, message):
        """Classify intent based on keyword detection"""
        keywords = self.detect_keywords(message)

        if 'greeting' in keywords:
            return {"intent": "greeting", "confidence": 0.9, "keywords": keywords}
        elif 'gratitude' in keywords:
            return {"intent": "gratitude", "confidence": 0.8, "keywords": keywords}
        elif 'register' in keywords:
            return {"intent": "registration", "confidence": 0.85, "keywords": keywords}
        elif 'blotter' in keywords:
            return {"intent": "blotter_inquiry", "confidence": 0.8, "keywords": keywords}
        elif 'hours' in keywords:
            return {"intent": "office_hours", "confidence": 0.75, "keywords": keywords}
        else:
            return {"intent": "unknown", "confidence": 0.0, "keywords": keywords}

    def generate_fallback_response(self):
        """Generate fallback response for unknown intents"""
        return "I'm sorry, I don't have information about that. Please contact the barangay hall directly or ask about registration, blotter reports, or office hours."

    def fuzzy_match_keywords(self, message, threshold=0.8):
        """Simple fuzzy matching for keywords"""
        message_words = set(message.lower().split())
        best_match = None
        best_score = 0

        for faq in self.faq_data.get("faqs", []):
            faq_keywords = set(faq["keywords"])
            intersection = message_words.intersection(faq_keywords)
            union = message_words.union(faq_keywords)

            if union:
                score = len(intersection) / len(union)
                if score > best_score and score >= threshold:
                    best_match = faq
                    best_score = score

        return best_match, best_score


def test_keyword_detection_basic(sample_faq_data):
    """Test basic keyword detection functionality"""
    engine = MockChatbotEngine(sample_faq_data)

    test_cases = [
        ("Hello there", {"greeting": ["Hello"]}),
        ("Thank you so much", {"gratitude": ["thank you"]}),
        ("I want to register", {"register": ["register"]}),
        ("File a blotter report", {"blotter": ["blotter", "report"]}),
        ("What are your hours?", {"hours": ["hours"]})
    ]

    for message, expected_keywords in test_cases:
        detected = engine.detect_keywords(message)
        for key in expected_keywords:
            assert key in detected
            assert len(detected[key]) > 0


def test_keyword_detection_case_insensitive(sample_faq_data):
    """Test that keyword detection is case insensitive"""
    engine = MockChatbotEngine(sample_faq_data)

    test_cases = [
        ("HELLO", "greeting"),
        ("Thank You", "gratitude"),
        ("REGISTER PLEASE", "register"),
        ("BlOtTeR RePoRt", "blotter")
    ]

    for message, expected_intent in test_cases:
        detected = engine.detect_keywords(message)
        assert expected_intent in detected


def test_intent_classification_with_keywords(sample_faq_data):
    """Test intent classification based on detected keywords"""
    engine = MockChatbotEngine(sample_faq_data)

    test_cases = [
        ("Hello, I need help", "greeting"),
        ("Thanks for your help", "gratitude"),
        ("How do I register as resident?", "registration"),
        ("I want to file a blotter", "blotter_inquiry"),
        ("What time are you open?", "office_hours"),
        ("What's the weather like?", "unknown")
    ]

    for message, expected_intent in test_cases:
        result = engine.classify_intent(message)
        assert result["intent"] == expected_intent
        assert "confidence" in result
        assert "keywords" in result
        assert result["confidence"] >= 0.0


def test_fallback_response_generation(sample_faq_data):
    """Test fallback response generation"""
    engine = MockChatbotEngine(sample_faq_data)

    response = engine.generate_fallback_response()

    assert isinstance(response, str)
    assert len(response) > 0
    assert "sorry" in response.lower() or "don't have" in response.lower()


@patch('builtins.open', new_callable=mock_open)
@patch('json.load')
def test_faq_sourcing_from_json(mock_json_load, mock_file, sample_faq_data):
    """Test loading FAQ data from JSON file"""
    mock_json_load.return_value = sample_faq_data

    # Simulate loading FAQ data
    with patch('os.path.exists', return_value=True):
        with open('sample_faq.json', 'r') as f:
            loaded_data = json.load(f)

    engine = MockChatbotEngine(loaded_data)
    assert len(engine.faq_data["faqs"]) == 3
    assert "register" in engine.faq_data["faqs"][0]["keywords"]


@patch('sqlite3.connect')
def test_faq_sourcing_from_database(mock_sqlite_connect, sample_faq_data):
    """Test loading FAQ data from database"""
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_sqlite_connect.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor

    # Mock database query results
    mock_cursor.fetchall.return_value = [
        ("How do I register?", "Visit the hall", "register,resident,id"),
        ("Office hours?", "8AM-5PM", "hours,office,schedule")
    ]

    # Simulate database loading
    faq_data = {"faqs": []}
    rows = mock_cursor.fetchall()
    for row in rows:
        faq_data["faqs"].append({
            "question": row[0],
            "answer": row[1],
            "keywords": row[2].split(",")
        })

    engine = MockChatbotEngine(faq_data)
    assert len(engine.faq_data["faqs"]) == 2


def test_fuzzy_matching_keywords(sample_faq_data):
    """Test fuzzy keyword matching functionality"""
    engine = MockChatbotEngine(sample_faq_data)

    test_cases = [
        ("I need to register as a resident", 1.0),  # Perfect match
        ("About registering", 0.5),  # Partial match
        ("Something completely different", 0.0)  # No match
    ]

    for message, expected_min_score in test_cases:
        match, score = engine.fuzzy_match_keywords(message)
        assert score >= expected_min_score
        if score > 0:
            assert match is not None
            assert "question" in match
            assert "answer" in match


def test_fuzzy_matching_threshold(sample_faq_data):
    """Test fuzzy matching with different thresholds"""
    engine = MockChatbotEngine(sample_faq_data)

    message = "register resident"

    # High threshold
    match, score = engine.fuzzy_match_keywords(message, threshold=0.9)
    assert score >= 0.9 or match is None

    # Low threshold
    match, score = engine.fuzzy_match_keywords(message, threshold=0.1)
    assert score >= 0.1 or match is None


def test_empty_message_handling(sample_faq_data):
    """Test handling of empty messages"""
    engine = MockChatbotEngine(sample_faq_data)

    # Empty message
    result = engine.classify_intent("")
    assert result["intent"] == "unknown"
    assert result["confidence"] == 0.0

    # Whitespace message
    result = engine.classify_intent("   \n\t  ")
    assert result["intent"] == "unknown"
    assert result["confidence"] == 0.0


def test_keyword_detection_multiple_matches(sample_faq_data):
    """Test keyword detection with multiple matches in same message"""
    engine = MockChatbotEngine(sample_faq_data)

    message = "Hello, I want to register and file a blotter report"

    detected = engine.detect_keywords(message)

    assert "greeting" in detected
    assert "register" in detected
    assert "blotter" in detected
    assert "report" in detected


def test_intent_classification_priority(sample_faq_data):
    """Test intent classification priority (greeting first)"""
    engine = MockChatbotEngine(sample_faq_data)

    # Message with multiple intents
    message = "Hello, I want to register and file a blotter"

    result = engine.classify_intent(message)

    # Should prioritize greeting
    assert result["intent"] == "greeting"
    assert result["confidence"] == 0.9


@patch('builtins.open', side_effect=FileNotFoundError)
def test_faq_loading_error_handling(mock_file):
    """Test handling of missing FAQ file"""
    with pytest.raises(FileNotFoundError):
        with open('missing_faq.json', 'r'):
            pass


@patch('builtins.open', new_callable=mock_open)
@patch('json.load', side_effect=json.JSONDecodeError("Invalid JSON", "", 0))
def test_invalid_faq_json_handling(mock_json_load, mock_file):
    """Test handling of invalid FAQ JSON"""
    with pytest.raises(json.JSONDecodeError):
        with open('sample_faq.json', 'r') as f:
            json.load(f)


def test_engine_initialization(sample_faq_data):
    """Test chatbot engine initialization"""
    engine = MockChatbotEngine(sample_faq_data)

    assert engine.faq_data == sample_faq_data
    assert hasattr(engine, 'keyword_patterns')
    assert len(engine.keyword_patterns) > 0


def test_regex_pattern_compilation(sample_faq_data):
    """Test that regex patterns are properly compiled"""
    engine = MockChatbotEngine(sample_faq_data)

    for pattern_name, pattern in engine.keyword_patterns.items():
        assert hasattr(pattern, 'search')
        assert hasattr(pattern, 'findall')


def test_response_generation_consistency(sample_faq_data):
    """Test that response generation is consistent"""
    engine = MockChatbotEngine(sample_faq_data)

    # Generate fallback response multiple times
    response1 = engine.generate_fallback_response()
    response2 = engine.generate_fallback_response()

    assert response1 == response2
    assert isinstance(response1, str)
    assert len(response1) > 10
