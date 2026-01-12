import unittest
import json
from suggestion_engine import app
from chatbot_engine import chatbot
import pandas as pd
from smart_suggestions import analyze_trends

class TestAIService(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def test_health_check(self):
        response = self.app.get('/health')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'healthy')
        self.assertEqual(data['models']['chatbot_nlu'], 'loaded')

    def test_chatbot_intent(self):
        # Test greeting
        response = self.app.post('/chatbot/message', json={'message': 'hello bantay'})
        data = json.loads(response.data)
        self.assertEqual(data['intent'], 'greeting')
        
        # Test certificate inquiry
        response = self.app.post('/chatbot/message', json={'message': 'how to get clearance'})
        data = json.loads(response.data)
        self.assertEqual(data['intent'], 'certificate_inquiry')
        
        # Test unknown
        response = self.app.post('/chatbot/message', json={'message': 'xyz123 random text'})
        data = json.loads(response.data)
        # Should be fallback or low confidence
        self.assertTrue(data['intent'] == 'fallback' or data['confidence'] < 0.5)

    def test_trend_analysis(self):
        # Create synthetic increasing data
        dates = pd.date_range(start='2024-01-01', periods=10)
        counts = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        df = pd.DataFrame({'dt': dates, 'counts': counts})
        
        # We need to duplicate rows to match the analyze_trends input format which expects raw incident rows
        # But analyze_trends takes a DF with 'dt' column and groups by date.
        # So we can just pass a DF with many rows per date.
        
        # Let's mock the input for analyze_trends directly
        # It expects a DF with 'dt' column.
        rows = []
        for d, c in zip(dates, counts):
            for _ in range(c):
                rows.append({'dt': d})
        
        df_input = pd.DataFrame(rows)
        trend = analyze_trends(df_input)
        self.assertEqual(trend, "INCREASING")

        # Test decreasing
        counts_dec = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]
        rows = []
        for d, c in zip(dates, counts_dec):
            for _ in range(c):
                rows.append({'dt': d})
        df_dec = pd.DataFrame(rows)
        trend = analyze_trends(df_dec)
        self.assertEqual(trend, "DECREASING")

if __name__ == '__main__':
    unittest.main()
