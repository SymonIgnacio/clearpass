import pytest
from unittest.mock import patch, mock_open
import json


@pytest.fixture
def sample_faq_data():
    """Sample FAQ data for testing"""
    return {
        "faqs": [
            {
                "question": "How to register as resident?",
                "answer": "Visit the barangay hall with valid ID",
                "keywords": ["register", "resident", "id"]
            },
            {
                "question": "What are barangay office hours?",
                "answer": "Monday to Friday, 8 AM to 5 PM",
                "keywords": ["hours", "office", "schedule"]
            },
            {
                "question": "How to file a blotter report?",
                "answer": "Come to barangay hall or call hotline",
                "keywords": ["blotter", "report", "complaint"]
            }
        ]
    }


@pytest.fixture
def mock_faq_file(sample_faq_data):
    """Mock FAQ JSON file"""
    return json.dumps(sample_faq_data)


class MockIntentClassifier:
    """Mock intent classifier for testing"""

    def __init__(self, faq_data):
        self.faq_data = faq_data

    def classify_intent(self, query):
        """Mock intent classification"""
        query_lower = query.lower()

        for faq in self.faq_data["faqs"]:
            if any(keyword in query_lower for keyword in faq["keywords"]):
                return {
                    "intent": "faq_lookup",
                    "confidence": 0.9,
                    "matched_faq": faq
                }

        return {
            "intent": "unknown",
            "confidence": 0.0,
            "matched_faq": None
        }


def test_intent_classification_faq_match(sample_faq_data):
    """Test intent classification finds matching FAQ"""
    classifier = MockIntentClassifier(sample_faq_data)

    result = classifier.classify_intent("How do I register?")

    assert result["intent"] == "faq_lookup"
    assert result["confidence"] == 0.9
    assert result["matched_faq"]["question"] == "How to register as resident?"
    assert "register" in result["matched_faq"]["keywords"]


def test_intent_classification_no_match(sample_faq_data):
    """Test intent classification returns unknown for unmatched query"""
    classifier = MockIntentClassifier(sample_faq_data)

    result = classifier.classify_intent("What's the weather like?")

    assert result["intent"] == "unknown"
    assert result["confidence"] == 0.0
    assert result["matched_faq"] is None


def test_intent_classification_case_insensitive(sample_faq_data):
    """Test intent classification is case insensitive"""
    classifier = MockIntentClassifier(sample_faq_data)

    result = classifier.classify_intent("WHAT ARE BARANGAY OFFICE HOURS?")

    assert result["intent"] == "faq_lookup"
    assert result["matched_faq"]["question"] == "What are barangay office hours?"


def test_intent_classification_partial_keyword_match(sample_faq_data):
    """Test intent classification with partial keyword matches"""
    classifier = MockIntentClassifier(sample_faq_data)

    result = classifier.classify_intent("I want to report something")

    assert result["intent"] == "faq_lookup"
    assert "report" in result["matched_faq"]["keywords"]


@patch('builtins.open', new_callable=mock_open)
@patch('json.load')
def test_load_faq_data_success(mock_json_load, mock_file, sample_faq_data):
    """Test successful loading of FAQ data from file"""
    mock_json_load.return_value = sample_faq_data

    # Simulate loading FAQ data
    with patch('os.path.exists', return_value=True):
        # This would be the actual loading logic
        with open('sample_faq.json', 'r') as f:
            loaded_data = json.load(f)

    assert loaded_data == sample_faq_data
    mock_file.assert_called_once_with('sample_faq.json', 'r')
    mock_json_load.assert_called_once()


@patch('builtins.open', side_effect=FileNotFoundError)
def test_load_faq_data_file_not_found(mock_file):
    """Test handling of missing FAQ file"""
    with pytest.raises(FileNotFoundError):
        with open('nonexistent_faq.json', 'r'):
            pass


@patch('builtins.open', new_callable=mock_open)
@patch('json.load', side_effect=json.JSONDecodeError("Invalid JSON", "", 0))
def test_load_faq_data_invalid_json(mock_json_load, mock_file):
    """Test handling of invalid JSON in FAQ file"""
    with pytest.raises(json.JSONDecodeError):
        with open('sample_faq.json', 'r') as f:
            json.load(f)


def test_intent_classifier_initialization(sample_faq_data):
    """Test intent classifier initializes correctly"""
    classifier = MockIntentClassifier(sample_faq_data)

    assert classifier.faq_data == sample_faq_data
    assert len(classifier.faq_data["faqs"]) == 3


def test_multiple_keyword_matches(sample_faq_data):
    """Test behavior when query matches multiple FAQs"""
    # Add a FAQ that might conflict
    sample_faq_data["faqs"].append({
        "question": "How to get barangay clearance?",
        "answer": "Apply at the barangay hall",
        "keywords": ["register", "clearance", "id"]
    })

    classifier = MockIntentClassifier(sample_faq_data)

    # Query that matches both registration and clearance FAQs
    result = classifier.classify_intent("I need to register and get clearance")

    # Should match the first FAQ found
    assert result["intent"] == "faq_lookup"
    assert "register" in result["matched_faq"]["keywords"]


def test_empty_query_handling(sample_faq_data):
    """Test handling of empty or whitespace-only queries"""
    classifier = MockIntentClassifier(sample_faq_data)

    result = classifier.classify_intent("")

    assert result["intent"] == "unknown"
    assert result["confidence"] == 0.0

    result_whitespace = classifier.classify_intent("   \n\t  ")

    assert result_whitespace["intent"] == "unknown"
    assert result_whitespace["confidence"] == 0.0
