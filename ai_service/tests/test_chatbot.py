import unittest
from chatbot_engine import chatbot
from chatbot_data import INTENT_RESPONSES

class TestChatbotGuides(unittest.TestCase):
    def test_file_complaint_intent(self):
        intent, confidence, response = chatbot.predict("how to file a complaint")
        self.assertEqual(intent, "guide_file_complaint")
        self.assertGreater(confidence, 0.2)
        self.assertIn("text", response)
        self.assertEqual(response.get("type"), "guide")
        self.assertTrue(len(response.get("steps", [])) >= 5)

    def test_no_appointment_intent_present(self):
        self.assertNotIn("appointment_request", INTENT_RESPONSES)

if __name__ == "__main__":
    unittest.main()
