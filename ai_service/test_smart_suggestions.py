import pytest
from unittest.mock import Mock, patch
import sys
import os

# Add the ai_service directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from smart_suggestions import AdvancedBarangayAI, app


class TestAdvancedBarangayAI:
    """Test suite for AdvancedBarangayAI class"""

    def setup_method(self):
        """Setup test fixtures"""
        self.ai_system = AdvancedBarangayAI()

    def test_calculate_social_aid_priority_advanced_high_priority(self):
        """Test high priority social aid calculation"""
        resident_data = {
            'monthly_income': 3000,
            'is_senior': True,
            'is_pwd': True,
            'is_single_parent': True,
            'employment_status': 'unemployed',
            'age': 70,
            'sitio_name': 'Batia Proper'
        }

        result = self.ai_system.calculate_social_aid_priority_advanced(resident_data)

        assert result['priority'] == 'CRITICAL PRIORITY'
        assert result['final_score'] >= 75
        assert 'senior_factor' in result['analysis_breakdown']['vulnerability_components']
        assert len(result['recommended_actions']) > 0

    def test_calculate_social_aid_priority_advanced_low_income(self):
        """Test priority calculation for low income resident"""
        resident_data = {
            'monthly_income': 2000,
            'is_senior': False,
            'is_pwd': False,
            'is_single_parent': False,
            'employment_status': 'employed',
            'age': 30,
            'sitio_name': 'Northville 5'
        }

        result = self.ai_system.calculate_social_aid_priority_advanced(resident_data)

        assert result['final_score'] > 20  # Should have some priority due to low income
        assert 'income_ratio' in result['analysis_breakdown']['vulnerability_components']

    def test_calculate_social_aid_priority_advanced_employed_high_income(self):
        """Test low priority for employed high income resident"""
        resident_data = {
            'monthly_income': 30000,
            'is_senior': False,
            'is_pwd': False,
            'is_single_parent': False,
            'employment_status': 'employed',
            'age': 35,
            'sitio_name': 'Batia Proper'
        }

        result = self.ai_system.calculate_social_aid_priority_advanced(resident_data)

        assert result['priority'] in ['STANDARD PRIORITY', 'LOW PRIORITY']
        assert result['final_score'] < 30

    def test_calculate_social_aid_priority_advanced_with_historical_data(self):
        """Test priority calculation with historical trend analysis"""
        resident_data = {
            'monthly_income': 10000,
            'is_senior': False,
            'is_pwd': False,
            'is_single_parent': False,
            'employment_status': 'employed',
            'age': 40,
            'sitio_name': 'Batia Proper'
        }

        historical_data = {
            'income_history': [12000, 11000, 10000, 9000, 8000],  # Declining income
            'aid_history': [{'date': '2025-01-01'}, {'date': '2025-02-01'}]  # Recent aid requests
        }

        result = self.ai_system.calculate_social_aid_priority_advanced(resident_data, historical_data)

        assert result['trend_factor'] > 1.0  # Should increase priority due to declining income
        assert 'income_trend' in result['analysis_breakdown']['trend_analysis']

    def test_advanced_predictive_policing_high_risk(self):
        """Test predictive policing with high risk data"""
        blotter_data = [
            {
                'sitio_name': 'Batia Proper',
                'date_filed': '2025-01-15T10:00:00Z',
                'incident_type': 'Theft',
                'severity': 'High'
            },
            {
                'sitio_name': 'Batia Proper',
                'date_filed': '2025-01-14T10:00:00Z',
                'incident_type': 'Assault',
                'severity': 'Critical'
            },
            {
                'sitio_name': 'Batia Proper',
                'date_filed': '2025-01-13T10:00:00Z',
                'incident_type': 'Vandalism',
                'severity': 'High'
            }
        ]

        result = self.ai_system.advanced_predictive_policing(blotter_data)

        assert result['overall_risk_assessment'] in ['HIGH', 'CRITICAL']
        assert result['confidence_score'] >= 0.8
        assert len(result['recommendations']) > 0
        assert len(result['hotspots']) > 0

    def test_advanced_predictive_policing_no_incidents(self):
        """Test predictive policing with no incident data"""
        result = self.ai_system.advanced_predictive_policing([])

        assert result['overall_risk_assessment'] == 'LOW'
        assert result['confidence_score'] >= 0.8
        assert 'No incident data available' in result['analysis']

    def test_certificate_fraud_detection_suspicious_pattern(self):
        """Test fraud detection for suspicious certificate patterns"""
        certificate_data = [
            {'certificate_type': 'Barangay Clearance', 'issued_date': '2025-01-01'},
            {'certificate_type': 'Barangay Clearance', 'issued_date': '2025-01-02'},
            {'certificate_type': 'Barangay Clearance', 'issued_date': '2025-01-03'},
            {'certificate_type': 'Barangay Clearance', 'issued_date': '2025-01-04'},
            {'certificate_type': 'Barangay Clearance', 'issued_date': '2025-01-05'},
            {'certificate_type': 'Barangay Clearance', 'issued_date': '2025-01-06'},  # Too frequent
        ]

        resident_history = {'blotter_incidents': 0}

        result = self.ai_system.certificate_fraud_detection(certificate_data, resident_history)

        assert result['fraud_risk_score'] >= 45  # High score due to frequency
        assert 'unusually_frequent_requests' in result['risk_factors']

    def test_certificate_fraud_detection_clearance_with_incidents(self):
        """Test fraud detection for clearance requested despite incident history"""
        certificate_data = [
            {'certificate_type': 'Barangay Clearance', 'issued_date': '2025-01-01'}
        ]

        resident_history = {'blotter_incidents': 10}  # Many incidents

        result = self.ai_system.certificate_fraud_detection(certificate_data, resident_history)

        assert result['fraud_risk_score'] >= 15  # Score for clearance despite incidents
        assert 'clearance_requested_despite_incident_history' in result['risk_factors']

    def test_resource_allocation_optimizer(self):
        """Test budget optimization for community programs"""
        program_data = {
            'programs': [
                {'name': 'Senior Care', 'target_group': 'seniors', 'success_rate': 0.9, 'scalability': 0.8, 'urgency': 2, 'max_budget': 50000},
                {'name': 'Youth Education', 'target_group': 'youth', 'success_rate': 0.7, 'scalability': 0.9, 'urgency': 1, 'max_budget': 30000},
                {'name': 'PWD Support', 'target_group': 'pwd', 'success_rate': 0.8, 'scalability': 0.6, 'urgency': 1.5, 'max_budget': 40000}
            ]
        }

        budget_data = {'total_budget': 100000}
        community_needs = {'seniors': 3, 'pwd': 2, 'youth': 1}

        result = self.ai_system.resource_allocation_optimizer(program_data, budget_data, community_needs)

        assert result['total_budget'] == 100000
        assert len(result['allocations']) == 3
        assert sum(item['calculated_budget'] for item in result['allocations']) <= 100000
        assert result['efficiency_score'] > 0

    def test_analyze_community_health_patterns(self):
        """Test community health pattern analysis"""
        resident_data = [
            {'age': 70, 'is_senior': True, 'is_pwd': False},
            {'age': 65, 'is_senior': True, 'is_pwd': True},
            {'age': 30, 'is_senior': False, 'is_pwd': False},
            {'age': 25, 'is_senior': False, 'is_pwd': True}
        ]

        health_indicators = {}

        result = self.ai_system.analyze_community_health_patterns(resident_data, health_indicators)

        assert result['total_residents_analyzed'] == 4
        assert result['vulnerable_groups']['seniors'] == 2
        assert result['vulnerable_groups']['pwd'] == 2
        assert 'senior_health_risk' in result['health_risk_assessment']
        assert len(result['recommendations']) > 0

    def test_forecast_aid_demands_increasing_trend(self):
        """Test aid demand forecasting with increasing trend"""
        historical_aid_data = [
            {'month': '2024-01', 'aid_count': 10},
            {'month': '2024-02', 'aid_count': 12},
            {'month': '2024-03', 'aid_count': 15},
            {'month': '2024-04', 'aid_count': 18},
            {'month': '2024-05', 'aid_count': 22},
            {'month': '2024-06', 'aid_count': 25}
        ]

        population_trends = {}

        result = self.ai_system.forecast_aid_demands(historical_aid_data, population_trends)

        assert result['forecast_type'] == 'INCREASING'
        assert result['confidence_percentage'] > 50
        assert result['projected_monthly_aid_demand'] > result['historical_average']

    def test_calculate_slope(self):
        """Test linear regression slope calculation"""
        x = [1, 2, 3, 4, 5]
        y = [2, 4, 6, 8, 10]  # Perfect positive correlation

        slope = self.ai_system.calculate_slope(x, y)
        assert slope == pytest.approx(2.0, abs=0.1)

    def test_calculate_slope_insufficient_data(self):
        """Test slope calculation with insufficient data"""
        slope = self.ai_system.calculate_slope([1], [2])
        assert slope == 0

    def test_calculate_slope_division_by_zero(self):
        """Test slope calculation with division by zero"""
        x = [1, 1, 1]  # All same x values
        y = [1, 2, 3]

        slope = self.ai_system.calculate_slope(x, y)
        assert slope == 0  # Should return 0 for division by zero

    def test_analyze_income_trend_with_invalid_data(self):
        """Test income trend analysis with invalid/null income values"""
        historical_data = {
            'income_history': [10000, None, 8000, -500, 12000]  # Mixed valid/invalid values
        }

        result = self.ai_system.analyze_income_trend(historical_data)
        assert isinstance(result, float)  # Should handle gracefully and return a float

    def test_assess_community_risk(self):
        """Test community risk assessment"""
        risk = self.ai_system.assess_community_risk('Batia Proper', {
            'is_single_parent': True,
            'monthly_income': 5000
        })

        assert 0 <= risk <= 1
        assert risk > 0.1  # Should be higher due to low income and single parent

    def test_generate_recommended_actions_critical(self):
        """Test recommended actions for critical priority"""
        actions = self.ai_system.generate_recommended_actions(85, {
            'is_senior': True,
            'is_pwd': True,
            'is_single_parent': True,
            'monthly_income': 2000
        })

        assert len(actions) > 0
        assert any('emergency' in action.lower() for action in actions)
        assert any('immediate' in action.lower() for action in actions)


class TestFlaskApp:
    """Test suite for Flask API endpoints"""

    def setup_method(self):
        """Setup test client"""
        self.app = app.test_client()

    def test_health_check(self):
        """Test health check endpoint"""
        response = self.app.get('/health')
        assert response.status_code == 200

        data = response.get_json()
        assert data['status'] == 'healthy'
        assert 'Advanced Barangay AI System' in data['service']
        assert 'features' in data
        assert len(data['features']) > 0

    def test_index_endpoint(self):
        """Test index endpoint"""
        response = self.app.get('/')
        assert response.status_code == 200

        data = response.get_json()
        assert 'Advanced Barangay AI Decision Support System' in data['service']
        assert 'capabilities' in data
        assert 'endpoints' in data

    @patch('smart_suggestions.ai_system.calculate_social_aid_priority_advanced')
    def test_suggest_aid_endpoint(self, mock_calculate):
        """Test suggest-aid endpoint"""
        mock_calculate.return_value = {
            'priority': 'HIGH',
            'final_score': 75,
            'recommended_actions': ['Test action']
        }

        test_data = {
            'monthly_income': 5000,
            'is_senior': True,
            'is_pwd': False
        }

        response = self.app.post('/suggest-aid',
                               json=test_data,
                               content_type='application/json')

        assert response.status_code == 200
        data = response.get_json()
        assert data['priority'] == 'HIGH'
        assert data['final_score'] == 75
        mock_calculate.assert_called_once_with(test_data, None)

    @patch('smart_suggestions.ai_system.advanced_predictive_policing')
    def test_suggest_patrol_endpoint(self, mock_predictive):
        """Test suggest-patrol endpoint"""
        mock_predictive.return_value = {
            'overall_risk_assessment': 'HIGH',
            'confidence_score': 0.9,
            'recommendations': ['Deploy additional patrols']
        }

        test_data = {
            'blotter_data': [
                {'sitio_name': 'Test Area', 'incident_type': 'Theft'}
            ]
        }

        response = self.app.post('/suggest-patrol',
                               json=test_data,
                               content_type='application/json')

        assert response.status_code == 200
        data = response.get_json()
        assert data['overall_risk_assessment'] == 'HIGH'
        mock_predictive.assert_called_once()

    def test_suggest_aid_invalid_data(self):
        """Test suggest-aid with invalid data"""
        response = self.app.post('/suggest-aid',
                               json={},  # Empty data
                               content_type='application/json')

        assert response.status_code == 200  # Should handle gracefully
        data = response.get_json()
        assert 'priority' in data or 'error' in data

    def test_suggest_patrol_empty_data(self):
        """Test suggest-patrol with empty blotter data"""
        test_data = {'blotter_data': []}

        response = self.app.post('/suggest-patrol',
                               json=test_data,
                               content_type='application/json')

        assert response.status_code == 200
        data = response.get_json()
        assert 'overall_risk_assessment' in data

    @patch('smart_suggestions.ai_system.certificate_fraud_detection')
    def test_detect_fraud_endpoint(self, mock_detect):
        """Test fraud detection endpoint"""
        mock_detect.return_value = {
            'fraud_risk_score': 25,
            'risk_level': 'LOW',
            'risk_factors': []
        }

        test_data = {
            'certificate_data': [],
            'resident_history': {}
        }

        response = self.app.post('/detect-fraud',
                               json=test_data,
                               content_type='application/json')

        assert response.status_code == 200
        data = response.get_json()
        assert data['fraud_risk_score'] == 25
        assert data['risk_level'] == 'LOW'

    @patch('smart_suggestions.ai_system.resource_allocation_optimizer')
    def test_optimize_budget_endpoint(self, mock_optimize):
        """Test budget optimization endpoint"""
        mock_optimize.return_value = {
            'total_budget': 100000,
            'allocations': [],
            'efficiency_score': 85.5
        }

        test_data = {
            'program_data': {},
            'budget_data': {'total_budget': 100000},
            'community_needs': {}
        }

        response = self.app.post('/optimize-budget',
                               json=test_data,
                               content_type='application/json')

        assert response.status_code == 200
        data = response.get_json()
        assert data['total_budget'] == 100000
        assert data['efficiency_score'] == 85.5

    def test_endpoint_error_handling(self):
        """Test error handling in endpoints"""
        # Test with invalid JSON
        response = self.app.post('/suggest-aid',
                               data='invalid json',
                               content_type='application/json')

        assert response.status_code == 400 or response.status_code == 200  # Flask handles differently

    def test_unknown_endpoint(self):
        """Test unknown endpoint"""
        response = self.app.get('/unknown-endpoint')
        assert response.status_code == 404
