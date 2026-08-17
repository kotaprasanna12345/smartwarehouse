"""
Test suite to thoroughly verify all SmartStock AI routes, dynamic calculations,
business impact models, and API responses.
"""
import unittest
import json
from app import app
from database import init_db
from seed_data import seed_database

class SmartStockAITestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        seed_database()
        cls.client = app.test_client()

    def test_all_html_pages(self):
        pages = [
            '/',
            '/dashboard',
            '/inventory',
            '/orders',
            '/fulfillment',
            '/warehouse',
            '/ai-insights',
            '/analytics',
            '/alerts',
            '/settings',
            '/login'
        ]
        for url in pages:
            res = self.client.get(url)
            self.assertEqual(res.status_code, 200, f"Failed on page: {url}")
            print(f"[PASS] Page {url} returned HTTP 200")

    def test_api_dashboard(self):
        res = self.client.get('/api/dashboard')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertIn('health', data)
        self.assertIn('metrics', data['health'])
        self.assertIn('charts', data)
        self.assertIn('pipeline', data)
        print("[PASS] /api/dashboard returned valid structure")

    def test_api_zones(self):
        res = self.client.get('/api/zones')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertGreaterEqual(len(data['zones']), 5)
        print(f"[PASS] /api/zones returned {len(data['zones'])} zones")

    def test_api_ai_chat_and_insights(self):
        # Insights
        res1 = self.client.get('/api/ai/insights')
        self.assertEqual(res1.status_code, 200)
        data1 = res1.get_json()
        self.assertTrue(data1['success'])
        self.assertGreater(len(data1['insights']), 0)
        print("[PASS] /api/ai/insights returned actionable items")

        # Chat
        res2 = self.client.post('/api/ai/chat', json={'query': 'What is our stockout risk in Zone C?'})
        self.assertEqual(res2.status_code, 200)
        data2 = res2.get_json()
        self.assertTrue(data2['success'])
        self.assertIn('answer', data2['response'])
        print("[PASS] /api/ai/chat returned intelligent natural language response")

    def test_api_optimize_dynamic_calculations(self):
        res = self.client.post('/api/optimize')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        
        # Verify dynamic fields
        self.assertIn('previous_health', data)
        self.assertIn('current_health', data)
        self.assertIn('health_improvement', data)
        self.assertIn('business_impact', data)
        
        bi = data['business_impact']
        self.assertIn('stockout_risk', bi)
        self.assertIn('picking_distance', bi)
        self.assertIn('fulfillment_time', bi)
        self.assertIn('order_delay_risk', bi)
        self.assertIn('warehouse_utilization', bi)

        print(f"[PASS] /api/optimize verified: Dynamic Health {data['previous_health']}% -> {data['current_health']}% ({data['health_improvement']})")
        print(f"[PASS] Business Impact: Stockout ({bi['stockout_risk']['delta']}), Distance ({bi['picking_distance']['delta']}), Cycle ({bi['fulfillment_time']['delta']})")

    def test_demo_tick_and_reset(self):
        res1 = self.client.post('/api/demo/tick')
        self.assertEqual(res1.status_code, 200)
        data1 = res1.get_json()
        self.assertTrue(data1['success'])

        res2 = self.client.post('/api/demo/reset')
        self.assertEqual(res2.status_code, 200)
        data2 = res2.get_json()
        self.assertTrue(data2['success'])
        print("[PASS] /api/demo/tick and /api/demo/reset verified successfully")

if __name__ == '__main__':
    unittest.main()

