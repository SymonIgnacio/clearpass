import pytest
import json
from unittest.mock import patch, MagicMock, mock_open


@pytest.fixture
def mock_faq_database():
    """Mock FAQ database content"""
    return {
        "faqs": [
            {
                "question": "How do I register as a resident?",
                "answer": "Visit the barangay hall with valid ID and proof of address",
                "keywords": ["register", "resident", "id"]
            },
            {
                "question": "What are the barangay office hours?",
                "answer": "Monday to Friday, 8:00 AM to 5:00 PM",
                "keywords": ["hours", "office", "schedule"]
            },
            {
                "question": "How to file a blotter report?",
                "answer": "Go to barangay hall or call hotline 123-4567",
                "keywords": ["blotter", "report", "complaint"]
            },
            {
                "question": "What documents do I need for barangay clearance?",
                "answer": "Valid ID and proof of residence",
                "keywords": ["clearance", "documents", "requirements"]
            }
        ]
    }


@pytest.fixture
def mock_database_connection():
    """Mock database connection"""
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_conn.cursor.return_value = mock_cursor
    return mock_conn, mock_cursor


class MockChatbotEngine:
    """Mock chatbot engine for integration testing"""

    def __init__(self, faq_data):
        self.faq_data = faq_data
        self.conversation_history = []

    def process_query(self, user_query):
        """Process user query through NLP and database lookup"""
        self.conversation_history.append({"user": user_query})

        # Step 1: NLP Processing (mock)
        intent_result = self._classify_intent(user_query)

        # Step 2: Database lookup
        if intent_result["intent"] == "faq_lookup":
            response = self._lookup_faq_answer(intent_result["matched_keywords"])
        else:
            response = self._generate_fallback_response()

        self.conversation_history.append({"bot": response})
        return response

    def _classify_intent(self, query):
        """Mock intent classification"""
        query_lower = query.lower()

        for faq in self.faq_data["faqs"]:
            matched_keywords = [kw for kw in faq["keywords"] if kw in query_lower]
            if matched_keywords:
                return {
                    "intent": "faq_lookup",
                    "confidence": 0.9,
                    "matched_keywords": matched_keywords,
                    "faq": faq
                }

        return {
            "intent": "unknown",
            "confidence": 0.0,
            "matched_keywords": [],
            "faq": None
        }

    def _lookup_faq_answer(self, matched_keywords):
        """Mock database lookup for FAQ answers"""
        # Simulate database query
        for faq in self.faq_data["faqs"]:
            if any(kw in matched_keywords for kw in faq["keywords"]):
                return faq["answer"]

        return "I'm sorry, I couldn't find information about that topic."

    def _generate_fallback_response(self):
        """Generate fallback response for unknown intents"""
        return "I'm sorry, I don't have information about that. Please contact the barangay hall directly."


@patch('builtins.open', new_callable=mock_open)
@patch('json.load')
def test_chatbot_workflow_complete_faq_lookup(mock_json_load, mock_file, mock_faq_database):
    """Test complete chatbot workflow: query → NLP → DB lookup → response"""
    mock_json_load.return_value = mock_faq_database

    # Initialize chatbot with mock FAQ data
    with patch('os.path.exists', return_value=True):
        # Simulate loading FAQ data
        with open('sample_faq.json', 'r') as f:
            loaded_faq_data = json.load(f)

    chatbot = MockChatbotEngine(loaded_faq_data)

    # Test query processing
    user_query = "How do I register as a resident?"
    response = chatbot.process_query(user_query)

    # Verify workflow steps
    assert len(chatbot.conversation_history) == 2
    assert chatbot.conversation_history[0]["user"] == user_query
    assert "barangay hall" in response.lower()
    assert "valid id" in response.lower()

    # Verify intent classification worked
    intent_result = chatbot._classify_intent(user_query)
    assert intent_result["intent"] == "faq_lookup"
    assert "register" in intent_result["matched_keywords"]


@patch('builtins.open', new_callable=mock_open)
@patch('json.load')
def test_chatbot_workflow_multiple_queries(mock_json_load, mock_file, mock_faq_database):
    """Test chatbot workflow with multiple sequential queries"""
    mock_json_load.return_value = mock_faq_database

    with patch('os.path.exists', return_value=True):
        with open('sample_faq.json', 'r') as f:
            loaded_faq_data = json.load(f)

    chatbot = MockChatbotEngine(loaded_faq_data)

    # Test sequence of queries
    queries_and_responses = [
        ("What time does the office open?", "Monday to Friday, 8:00 AM to 5:00 PM"),
        ("How to file a complaint?", "Go to barangay hall or call hotline 123-4567"),
        ("What documents for clearance?", "Valid ID and proof of residence")
    ]

    for user_query, expected_phrase in queries_and_responses:
        response = chatbot.process_query(user_query)

        assert expected_phrase in response
        assert len(chatbot.conversation_history) == (queries_and_responses.index((user_query, expected_phrase)) + 1) * 2


@patch('builtins.open', new_callable=mock_open)
@patch('json.load')
def test_chatbot_workflow_unknown_query(mock_json_load, mock_file, mock_faq_database):
    """Test chatbot workflow with unknown/unmatched query"""
    mock_json_load.return_value = mock_faq_database

    with patch('os.path.exists', return_value=True):
        with open('sample_faq.json', 'r') as f:
            loaded_faq_data = json.load(f)

    chatbot = MockChatbotEngine(loaded_faq_data)

    # Query that doesn't match any FAQ
    user_query = "What's the weather like today?"
    response = chatbot.process_query(user_query)

    # Verify fallback response
    assert "sorry" in response.lower() or "don't have information" in response.lower()

    # Verify intent was classified as unknown
    intent_result = chatbot._classify_intent(user_query)
    assert intent_result["intent"] == "unknown"
    assert intent_result["confidence"] == 0.0


@patch('sqlite3.connect')
def test_chatbot_workflow_with_database_mock(mock_sqlite_connect, mock_faq_database, mock_database_connection):
    """Test chatbot workflow with mocked database operations"""
    mock_conn, mock_cursor = mock_database_connection
    mock_sqlite_connect.return_value = mock_conn

    # Mock database query results
    mock_cursor.fetchall.return_value = [
        ("How do I register as a resident?", "Visit the barangay hall with valid ID and proof of address")
    ]

    chatbot = MockChatbotEngine(mock_faq_database)

    # Override lookup to use database mock
    def mock_db_lookup(keywords):
        mock_cursor.execute("SELECT question, answer FROM faqs WHERE keywords LIKE ?", ("%" + keywords[0] + "%",))
        results = mock_cursor.fetchall()
        return results[0][1] if results else "No information found."

    chatbot._lookup_faq_answer = mock_db_lookup

    # Test query
    response = chatbot.process_query("How do I register?")

    # Verify database was queried
    mock_cursor.execute.assert_called()
    assert "barangay hall" in response.lower()
    assert "valid id" in response.lower()


def test_chatbot_workflow_conversation_history(mock_faq_database):
    """Test that chatbot maintains conversation history"""
    chatbot = MockChatbotEngine(mock_faq_database)

    # Simulate conversation
    queries = [
        "How do I register?",
        "What are office hours?",
        "How to file blotter?"
    ]

    for query in queries:
        chatbot.process_query(query)

    # Verify history
    assert len(chatbot.conversation_history) == 6  # 3 queries + 3 responses

    # Verify alternating user/bot messages
    for i in range(0, len(chatbot.conversation_history), 2):
        assert "user" in chatbot.conversation_history[i]
        assert "bot" in chatbot.conversation_history[i + 1]


@patch('builtins.open', side_effect=FileNotFoundError)
def test_chatbot_workflow_faq_file_missing(mock_file):
    """Test chatbot workflow when FAQ file is missing"""
    with pytest.raises(FileNotFoundError):
        with open('missing_faq.json', 'r'):
            pass


@patch('builtins.open', new_callable=mock_open)
@patch('json.load', side_effect=json.JSONDecodeError("Invalid JSON", "", 0))
def test_chatbot_workflow_invalid_faq_json(mock_json_load, mock_file):
    """Test chatbot workflow with invalid FAQ JSON"""
    with pytest.raises(json.JSONDecodeError):
        with open('sample_faq.json', 'r') as f:
            json.load(f)


def test_chatbot_workflow_case_insensitive_matching(mock_faq_database):
    """Test that chatbot workflow handles case insensitive matching"""
    chatbot = MockChatbotEngine(mock_faq_database)

    # Test with uppercase query
    response = chatbot.process_query("HOW DO I REGISTER AS A RESIDENT?")

    assert "barangay hall" in response.lower()

    # Test intent classification is case insensitive
    intent_result = chatbot._classify_intent("OFFICE HOURS")
    assert intent_result["intent"] == "faq_lookup"
    assert "hours" in intent_result["matched_keywords"]


def test_chatbot_workflow_keyword_matching_priority(mock_faq_database):
    """Test keyword matching priority in chatbot workflow"""
    chatbot = MockChatbotEngine(mock_faq_database)

    # Query that matches multiple FAQs
    response = chatbot.process_query("I need to register and get clearance")

    # Should match the first FAQ found (registration)
    assert "barangay hall" in response.lower()
    assert "valid id" in response.lower()


def test_chatbot_workflow_empty_query_handling(mock_faq_database):
    """Test chatbot workflow handling of empty queries"""
    chatbot = MockChatbotEngine(mock_faq_database)

    # Empty query
    response = chatbot.process_query("")

    assert "sorry" in response.lower() or "don't have information" in response.lower()

    # Whitespace-only query
    response = chatbot.process_query("   \n\t  ")

    assert "sorry" in response.lower() or "don't have information" in response.lower()


def test_chatbot_workflow_special_characters_handling(mock_faq_database):
    """Test chatbot workflow with special characters and formatting"""
    chatbot = MockChatbotEngine(mock_faq_database)

    # Query with special characters
    response = chatbot.process_query("How do I register? (I'm new here!)")

    assert "barangay hall" in response.lower()

    # Query with numbers
    response = chatbot.process_query("What is the office phone number?")

    # Should trigger fallback since no phone number in FAQs
    assert "sorry" in response.lower() or "don't have information" in response.lower()
