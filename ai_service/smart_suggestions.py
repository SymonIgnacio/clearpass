from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from datetime import datetime, timedelta
import json
import math
import statistics
import re
from collections import defaultdict, Counter
import random

app = Flask(__name__)
CORS(app)

class AdvancedBarangayAI:
    """
    Advanced AI System for Barangay Management
    Features sophisticated algorithms for decision support
    """

    def __init__(self):
        # Configuration - can be made configurable via environment variables
        self.baseline_income = int(os.environ.get('BASELINE_INCOME', '15000'))  # Barangay average income
        self.emergency_keywords = ['emergency', 'accident', 'injury', 'medical', 'fire', 'theft', 'assault']
        self.vulnerability_weights = {
            'senior': float(os.environ.get('WEIGHT_SENIOR', '0.4')),
            'pwd': float(os.environ.get('WEIGHT_PWD', '0.35')),
            'single_parent': float(os.environ.get('WEIGHT_SINGLE_PARENT', '0.25')),
            'low_income': float(os.environ.get('WEIGHT_LOW_INCOME', '0.3')),
            'unemployed': float(os.environ.get('WEIGHT_UNEMPLOYED', '0.2'))
        }

    def calculate_social_aid_priority_advanced(self, resident_data, historical_data=None):
        """
        Advanced Social Aid Priority Algorithm with Multi-Factor Analysis

        Features:
        - Weighted vulnerability scoring
        - Trend analysis (if historical data available)
        - Dynamic threshold adjustment
        - Risk prediction modeling
        - Community impact assessment
        """

        # Extract resident features
        income = resident_data.get('monthly_income', 0)
        age = resident_data.get('age', 0)
        is_senior = resident_data.get('is_senior', False)
        is_pwd = resident_data.get('is_pwd', False)
        is_single_parent = resident_data.get('is_single_parent', False)
        employment_status = resident_data.get('employment_status', '').lower()
        sitio = resident_data.get('sitio_name', 'Unknown')

        # 1. VULNERABILITY SCORING (0-100 scale)
        vulnerability_score = 0

        # Age vulnerability
        if is_senior:
            vulnerability_score += self.vulnerability_weights['senior'] * 100
        elif age >= 60:
            vulnerability_score += 30
        elif age >= 50:
            vulnerability_score += 15

        # Disability factor
        if is_pwd:
            vulnerability_score += self.vulnerability_weights['pwd'] * 100

        # Family structure
        if is_single_parent:
            vulnerability_score += self.vulnerability_weights['single_parent'] * 100

        # Employment vulnerability
        if employment_status in ['unemployed', '']:
            vulnerability_score += self.vulnerability_weights['unemployed'] * 100
        elif employment_status == 'seasonal':
            vulnerability_score += 40

        # Income vulnerability with dynamic thresholds
        income_ratio = income / self.baseline_income
        if income_ratio < 0.4:
            vulnerability_score += self.vulnerability_weights['low_income'] * 100
        elif income_ratio < 0.6:
            vulnerability_score += 60
        elif income_ratio < 0.8:
            vulnerability_score += 30

        # Cap vulnerability score
        vulnerability_score = min(vulnerability_score, 100)

        # 2. TREND ANALYSIS (if historical data available)
        trend_factor = 1.0
        trend_analysis = {}

        if historical_data:
            income_trend = self.analyze_income_trend(historical_data)
            aid_history = self.analyze_aid_history(historical_data)
            trend_factor = (income_trend + aid_history) / 2
            trend_analysis = {
                'income_trend': income_trend,
                'aid_frequency': aid_history,
                'trend_factor': trend_factor
            }

        # 3. COMMUNITY IMPACT ASSESSMENT
        community_risk = self.assess_community_risk(sitio, resident_data)
        community_factor = 1 + (community_risk * 0.2)  # Up to 20% increase

        # 4. FINAL PRIORITY CALCULATION
        base_score = vulnerability_score * trend_factor * community_factor

        # Apply diminishing returns for extreme cases
        if base_score > 80:
            final_score = 80 + (base_score - 80) * 0.5
        else:
            final_score = base_score

        final_score = min(final_score, 100)

        # 5. DYNAMIC PRIORITY CLASSIFICATION
        if final_score >= 75:
            priority = "CRITICAL PRIORITY"
            urgency = "Immediate intervention required"
        elif final_score >= 60:
            priority = "HIGH PRIORITY"
            urgency = "Fast-tracked assistance needed"
        elif final_score >= 40:
            priority = "MEDIUM PRIORITY"
            urgency = "Scheduled assistance appropriate"
        elif final_score >= 20:
            priority = "LOW PRIORITY"
            urgency = "Monitor and support as needed"
        else:
            priority = "STANDARD PRIORITY"
            urgency = "Regular community support"

        # 6. RECOMMENDED ACTIONS
        recommended_actions = self.generate_recommended_actions(final_score, resident_data)

        return {
            "priority": priority,
            "urgency": urgency,
            "final_score": round(final_score, 2),
            "vulnerability_score": round(vulnerability_score, 2),
            "trend_factor": round(trend_factor, 2),
            "community_factor": round(community_factor, 2),
            "recommended_actions": recommended_actions,
            "analysis_breakdown": {
                "vulnerability_components": {
                    "senior_factor": is_senior,
                    "pwd_factor": is_pwd,
                    "single_parent_factor": is_single_parent,
                    "employment_factor": employment_status,
                    "income_ratio": round(income_ratio, 2)
                },
                "trend_analysis": trend_analysis,
                "community_risk": round(community_risk, 2)
            },
            "calculation_timestamp": datetime.now().isoformat(),
            "ai_model_version": "Advanced Multi-Factor Analysis v2.1"
        }

    def analyze_income_trend(self, historical_data):
        """Analyze income trends for risk assessment"""
        if not historical_data.get('income_history'):
            return 1.0

        incomes = historical_data['income_history']
        if len(incomes) < 2:
            return 1.0

        # Filter out invalid income values
        valid_incomes = [inc for inc in incomes if inc is not None and inc >= 0]
        if len(valid_incomes) < 2:
            return 1.0

        # Calculate trend (simplified linear regression slope)
        n = len(valid_incomes)
        x = list(range(n))
        y = valid_incomes

        slope = self.calculate_slope(x, y)
        avg_income = sum(valid_incomes) / len(valid_incomes)

        # Avoid division by zero
        if avg_income == 0:
            return 1.0

        # Normalize trend factor
        if slope < 0:  # Declining income = higher risk
            trend_factor = 1 + abs(slope) / avg_income
        else:  # Improving income = lower risk
            trend_factor = 1 - min(slope / avg_income, 0.3)

        return max(0.5, min(trend_factor, 2.0))

    def analyze_aid_history(self, historical_data):
        """Analyze aid request frequency"""
        if not historical_data.get('aid_history'):
            return 1.0

        aid_requests = historical_data['aid_history']
        if len(aid_requests) < 2:
            return 1.0

        # Calculate frequency factor (more frequent = higher need)
        total_requests = len(aid_requests)
        time_span_months = 12  # Assume last 12 months
        frequency = total_requests / time_span_months

        if frequency > 2:  # More than 2 requests per month
            return 1.5
        elif frequency > 1:
            return 1.3
        elif frequency > 0.5:
            return 1.1
        else:
            return 0.9

    def assess_community_risk(self, sitio, resident_data):
        """Assess community-level risk factors"""
        # Simplified community risk based on sitio characteristics
        sitio_risks = {
            'Batia Proper': 0.1,  # Urban area, better access
            'Northville 5': 0.2,  # Mixed area
            'St. Martha': 0.3,    # More rural, potentially higher vulnerability
            'AFP/PNP': 0.15       # Military area, better support systems
        }

        base_risk = sitio_risks.get(sitio, 0.2)

        # Adjust based on individual factors
        if resident_data.get('is_single_parent'):
            base_risk += 0.1
        if resident_data.get('monthly_income', 0) < 8000:
            base_risk += 0.15

        return min(base_risk, 1.0)

    def generate_recommended_actions(self, score, resident_data):
        """Generate specific recommended actions based on score and profile"""
        actions = []

        if score >= 75:
            actions.extend([
                "Immediate emergency aid distribution",
                "Connect with DSWD for crisis intervention",
                "Arrange medical checkup within 3 days",
                "Provide temporary shelter/food assistance"
            ])
        elif score >= 60:
            actions.extend([
                "Fast-tracked aid application processing",
                "Monthly financial assistance program",
                "Skills training and job placement support",
                "Medical subsidy program enrollment"
            ])
        elif score >= 40:
            actions.extend([
                "Scheduled aid distribution (monthly)",
                "Community support group referral",
                "Educational assistance for children",
                "Basic livelihood support programs"
            ])
        elif score >= 20:
            actions.extend([
                "Regular monitoring and support",
                "Community resource access programs",
                "Preventive health education",
                "Basic needs assistance when available"
            ])
        else:
            actions.extend([
                "Regular community programs participation",
                "Self-sufficiency support programs",
                "Community volunteer opportunities",
                "General welfare monitoring"
            ])

        # Add personalized actions based on profile
        if resident_data.get('is_senior'):
            actions.append("Senior citizen care program enrollment")
        if resident_data.get('is_pwd'):
            actions.append("PWD assistance and accessibility support")
        if resident_data.get('is_single_parent'):
            actions.append("Single parent support group referral")
        if resident_data.get('monthly_income', 0) < 5000:
            actions.append("Extreme poverty intervention programs")

        return actions[:5]  # Limit to top 5 actions

    def calculate_slope(self, x, y):
        """Calculate linear regression slope"""
        if len(x) != len(y) or len(x) < 2:
            return 0

        n = len(x)
        sum_x = sum(x)
        sum_y = sum(y)
        sum_xy = sum(xi * yi for xi, yi in zip(x, y))
        sum_xx = sum(xi * xi for xi in x)

        denominator = n * sum_xx - sum_x * sum_x
        if denominator == 0:
            return 0  # Avoid division by zero

        slope = (n * sum_xy - sum_x * sum_y) / denominator
        return slope

    def suggest_patrol_deployment(self, blotter_data):
        """
        AI Patrol Deployment Suggestions for Katarungang Pambarangay

        Features:
        - Filter recent cases (last 30 days)
        - Risk-weighted scoring by incident category
        - Sitio-based deployment recommendations
        - Focus on patrol-relevant incidents (excludes Civil & Family Disputes)
        """

        if not blotter_data:
            return {
                "patrol_recommendations": ["No incident data available for patrol suggestions"],
                "sitio_scores": {},
                "analysis": "No blotter data provided"
            }

        current_time = datetime.now()
        analysis_window = 30  # days

        # Risk weights per category (Civil & Family Disputes = 0)
        risk_weights = {
            "Offenses Against Persons": 5,
            "Offenses Against Property": 3,
            "Community & Ordinance": 3,
            "Civil & Family Disputes": 0  # Do not count for patrols
        }

        # 1. FILTER RECENT CASES AND CALCULATE SCORES
        sitio_scores = defaultdict(int)
        incident_counts = defaultdict(int)
        recent_cases = []

        for case in blotter_data:
            incident_date = case.get('DateTime_Incident') or case.get('date_time') or case.get('created_at')
            if not incident_date:
                continue

            try:
                if isinstance(incident_date, str):
                    incident_datetime = datetime.fromisoformat(incident_date.replace('Z', '+00:00'))
                else:
                    incident_datetime = incident_date

                days_diff = (current_time - incident_datetime).days
                if days_diff <= analysis_window:
                    recent_cases.append(case)
                    sitio = case.get('Location_Sitio') or case.get('sitio_name') or 'Unknown'
                    incident_type = case.get('Incident_Type') or case.get('incident_type') or ''

                    # Determine category from incident type
                    category = self._categorize_incident(incident_type)
                    weight = risk_weights.get(category, 0)

                    if weight > 0:  # Only count patrol-relevant incidents
                        sitio_scores[sitio] += weight
                        incident_counts[incident_type] += 1

            except Exception as e:
                print(f"Error processing case: {e}")
                continue

        # 2. GENERATE DEPLOYMENT RECOMMENDATIONS
        recommendations = []
        sitio_deployment_details = {}

        for sitio, score in sitio_scores.items():
            if score > 20:
                recommendation = f"Critical Zone: Deploy 4 Tanods to {sitio} immediately."
                deployment = "4 Tanods (Critical)"
            elif score > 10:
                recommendation = f"Watchlist: Deploy 2 Tanods to {sitio}."
                deployment = "2 Tanods (Watchlist)"
            else:
                recommendation = f"Monitor: Standard patrol for {sitio}."
                deployment = "Standard Patrol"

            recommendations.append(recommendation)
            sitio_deployment_details[sitio] = {
                "score": score,
                "deployment": deployment,
                "recommendation": recommendation
            }

        # 3. IDENTIFY TOP INCIDENT TYPE
        if incident_counts:
            top_incident = max(incident_counts.items(), key=lambda x: x[1])
            top_incident_msg = f"Most common issue is {top_incident[0]}. Advise Tanods to focus on this."
            recommendations.append(top_incident_msg)
        else:
            top_incident_msg = "No patrol-relevant incidents in analysis period."
            recommendations.append(top_incident_msg)

        # 4. SORT RECOMMENDATIONS BY PRIORITY
        priority_order = {"Critical Zone": 0, "Watchlist": 1, "Monitor": 2, "Most common": 3}
        recommendations.sort(key=lambda x: priority_order.get(x.split(':')[0], 99))

        return {
            "patrol_recommendations": recommendations,
            "sitio_scores": dict(sitio_scores),
            "sitio_deployment_details": sitio_deployment_details,
            "top_incident": top_incident[0] if incident_counts else None,
            "analysis_period_days": analysis_window,
            "total_relevant_incidents": sum(incident_counts.values()),
            "total_cases_analyzed": len(recent_cases),
            "ai_model_used": "Katarungang Pambarangay Patrol Deployment v1.0",
            "generated_at": datetime.now().isoformat()
        }

    def _categorize_incident(self, incident_type):
        """Categorize incident type into main categories"""
        if not incident_type:
            return "Unknown"

        # Define category mappings
        category_mappings = {
            "Offenses Against Persons": [
                'Physical Injury', 'Unjust Vexation', 'Grave Threats', 'Alarming and Scandal'
            ],
            "Offenses Against Property": [
                'Theft (Petty)', 'Malicious Mischief', 'Estafa (Swindling)', 'Trespassing'
            ],
            "Civil & Family Disputes": [
                'Collection of Sum of Money', 'Ejectment', 'Boundary Dispute', 'Family Dispute'
            ],
            "Community & Ordinance": [
                'Curfew Violation', 'Noise Barrage', 'Illegal Parking', 'Waste Management', 'Stray Animals'
            ]
        }

        for category, types in category_mappings.items():
            if any(inc_type.lower() in incident_type.lower() for inc_type in types):
                return category

        return "Unknown"

    def advanced_predictive_policing(self, blotter_data, historical_patterns=None):
        """
        Advanced Predictive Policing Algorithm

        Features:
        - Time series analysis
        - Pattern recognition
        - Risk modeling with multiple factors
        - Seasonal trend analysis
        - Hotspot identification with confidence scores
        """

        if not blotter_data:
            return {
                "overall_risk_assessment": "LOW",
                "confidence_score": 0.9,
                "recommendations": ["Maintain standard patrol levels"],
                "analysis": "No incident data available for analysis"
            }

        # 1. INCIDENT ANALYSIS BY TIME AND LOCATION
        sitio_stats = defaultdict(lambda: {
            'total_incidents': 0,
            'severity_distribution': defaultdict(int),
            'hourly_patterns': defaultdict(int),
            'weekly_patterns': defaultdict(int),
            'recent_trend': []
        })

        current_time = datetime.now()
        analysis_window = 30  # days

        for incident in blotter_data:
            sitio = incident.get('Location_Sitio') or incident.get('sitio_name', 'Unknown')
            incident_date = incident.get('DateTime_Incident') or incident.get('date_time') or incident.get('created_at')
            severity = incident.get('severity', 'Low')

            if incident_date:
                try:
                    if isinstance(incident_date, str):
                        incident_datetime = datetime.fromisoformat(incident_date.replace('Z', '+00:00'))
                    else:
                        incident_datetime = incident_date

                    days_diff = (current_time - incident_datetime).days

                    if days_diff <= analysis_window:
                        sitio_stats[sitio]['total_incidents'] += 1
                        sitio_stats[sitio]['severity_distribution'][severity] += 1

                        # Extract patterns
                        hour = incident_datetime.hour
                        weekday = incident_datetime.weekday()
                        sitio_stats[sitio]['hourly_patterns'][hour] += 1
                        sitio_stats[sitio]['weekly_patterns'][weekday] += 1

                        # Recent trend (last 7 days)
                        if days_diff <= 7:
                            sitio_stats[sitio]['recent_trend'].append(days_diff)

                except:
                    continue

        # 2. RISK SCORING ALGORITHM
        sitio_risk_scores = {}

        for sitio, stats in sitio_stats.items():
            risk_score = 0
            confidence_factors = []

            # Base incident frequency (normalized by time window)
            incident_rate = stats['total_incidents'] / analysis_window
            if incident_rate > 0.5:  # More than 0.5 incidents per day
                risk_score += 40
                confidence_factors.append("high_incident_rate")
            elif incident_rate > 0.2:
                risk_score += 20
                confidence_factors.append("moderate_incident_rate")

            # Severity weighting
            severity_score = (
                stats['severity_distribution']['Critical'] * 5 +
                stats['severity_distribution']['High'] * 3 +
                stats['severity_distribution']['Medium'] * 2 +
                stats['severity_distribution']['Low'] * 1
            )
            risk_score += min(severity_score * 2, 30)
            if severity_score > 10:
                confidence_factors.append("high_severity_incidents")

            # Temporal patterns
            peak_hour = max(stats['hourly_patterns'].items(), key=lambda x: x[1], default=(0, 0))[0]
            if 22 <= peak_hour <= 6:  # Night time incidents
                risk_score += 15
                confidence_factors.append("night_time_pattern")

            # Recent escalation
            recent_count = len(stats['recent_trend'])
            if recent_count >= 3:
                risk_score += 20
                confidence_factors.append("recent_escalation")

            # Pattern recognition
            if len(stats['weekly_patterns']) > 0:
                most_common_day = max(stats['weekly_patterns'].items(), key=lambda x: x[1])[0]
                if stats['weekly_patterns'][most_common_day] > stats['total_incidents'] * 0.3:
                    risk_score += 10
                    confidence_factors.append("weekly_pattern_detected")

            sitio_risk_scores[sitio] = {
                'risk_score': min(risk_score, 100),
                'confidence_factors': confidence_factors,
                'incident_rate': incident_rate,
                'severity_score': severity_score,
                'stats': stats
            }

        # 3. OVERALL ASSESSMENT AND RECOMMENDATIONS
        if not sitio_risk_scores:
            return {
                "overall_risk_assessment": "LOW",
                "confidence_score": 0.8,
                "recommendations": ["Standard patrol deployment"],
                "hotspots": [],
                "analysis": "Insufficient data for comprehensive analysis"
            }

        # Find hotspots
        hotspots = sorted(sitio_risk_scores.items(), key=lambda x: x[1]['risk_score'], reverse=True)[:3]
        max_risk_score = max(score['risk_score'] for score in sitio_risk_scores.values())

        # Overall risk classification
        if max_risk_score >= 70:
            overall_risk = "CRITICAL"
            confidence = 0.95
            recommendations = [
                "Deploy maximum patrol resources",
                "Request police assistance for high-risk areas",
                "Implement 24/7 monitoring in hotspots",
                "Activate emergency response protocols",
                "Increase community awareness campaigns"
            ]
        elif max_risk_score >= 50:
            overall_risk = "HIGH"
            confidence = 0.9
            recommendations = [
                "Deploy 4+ tanods per hotspot area",
                "Implement roving patrol system",
                "Install additional security cameras",
                "Conduct nightly foot patrols",
                "Coordinate with local police"
            ]
        elif max_risk_score >= 30:
            overall_risk = "MEDIUM"
            confidence = 0.8
            recommendations = [
                "Deploy 2-3 tanods per hotspot area",
                "Increase patrol frequency in high-risk zones",
                "Install motion-sensor lighting",
                "Conduct community watch programs",
                "Regular security assessments"
            ]
        elif max_risk_score >= 15:
            overall_risk = "ELEVATED"
            confidence = 0.7
            recommendations = [
                "Deploy 1-2 additional tanods during peak hours",
                "Focus patrols on identified hotspot areas",
                "Improve street lighting in vulnerable zones",
                "Community security education programs"
            ]
        else:
            overall_risk = "LOW"
            confidence = 0.85
            recommendations = [
                "Maintain standard patrol levels",
                "Continue regular security monitoring",
                "Preventive maintenance of security infrastructure"
            ]

        # Generate detailed hotspot analysis
        hotspot_analysis = []
        for sitio, data in hotspots:
            analysis = {
                "area": sitio,
                "risk_level": "CRITICAL" if data['risk_score'] >= 70 else
                             "HIGH" if data['risk_score'] >= 50 else
                             "MEDIUM" if data['risk_score'] >= 30 else "LOW",
                "risk_score": data['risk_score'],
                "key_factors": data['confidence_factors'],
                "incident_rate": round(data['incident_rate'], 2),
                "total_incidents": data['stats']['total_incidents'],
                "severity_breakdown": dict(data['stats']['severity_distribution'])
            }
            hotspot_analysis.append(analysis)

        return {
            "overall_risk_assessment": overall_risk,
            "confidence_score": confidence,
            "max_risk_score": max_risk_score,
            "hotspots": hotspot_analysis,
            "recommendations": recommendations,
            "detailed_analysis": {
                "sitio_breakdown": sitio_risk_scores,
                "analysis_period_days": analysis_window,
                "total_incidents_analyzed": len(blotter_data),
                "ai_model_used": "Advanced Predictive Policing v2.0"
            },
            "generated_at": datetime.now().isoformat()
        }

    def certificate_fraud_detection(self, certificate_data, resident_history):
        """
        Advanced Certificate Fraud Detection System

        Analyzes patterns to detect potential fraudulent certificates
        """
        fraud_score = 0
        risk_factors = []

        # 1. Frequency Analysis
        cert_count = len(certificate_data)
        if cert_count > 10:  # Too many certificates
            fraud_score += 30
            risk_factors.append("excessive_certificate_requests")

        # 2. Time Pattern Analysis
        dates = [datetime.fromisoformat(cert['issued_date']) for cert in certificate_data if cert.get('issued_date')]
        if len(dates) > 1:
            intervals = [(dates[i] - dates[i-1]).days for i in range(1, len(dates))]
            avg_interval = sum(intervals) / len(intervals)
            if avg_interval < 7:  # Certificates too frequent
                fraud_score += 25
                risk_factors.append("unusually_frequent_requests")

        # 3. Pattern Recognition
        types = [cert.get('certificate_type') for cert in certificate_data]
        type_counts = Counter(types)
        most_common = type_counts.most_common(1)[0] if type_counts else (None, 0)

        if most_common[1] > 5:  # Same type requested repeatedly
            fraud_score += 20
            risk_factors.append("repetitive_certificate_types")

        # 4. Cross-verification with resident history
        if resident_history.get('blotter_incidents', 0) > 5 and 'clearance' in types:
            fraud_score += 15
            risk_factors.append("clearance_requested_despite_incident_history")

        return {
            "fraud_risk_score": min(fraud_score, 100),
            "risk_level": "HIGH" if fraud_score >= 60 else "MEDIUM" if fraud_score >= 30 else "LOW",
            "risk_factors": risk_factors,
            "recommendations": [
                "Manual verification required" if fraud_score >= 60 else
                "Additional documentation needed" if fraud_score >= 30 else
                "Standard processing acceptable"
            ]
        }

    def resource_allocation_optimizer(self, program_data, budget_data, community_needs):
        """
        AI-Powered Resource Allocation for Community Programs

        Optimizes budget distribution across different programs
        """
        total_budget = budget_data.get('total_budget', 0)
        programs = program_data.get('programs', [])

        if not programs or total_budget <= 0:
            return {"error": "Insufficient data for optimization"}

        # Calculate priority scores for each program
        program_priorities = []
        for program in programs:
            priority_score = 0

            # Community need factor
            need_level = community_needs.get(program.get('target_group', 'general'), 1)
            priority_score += need_level * 30

            # Program effectiveness (historical success rate)
            success_rate = program.get('success_rate', 0.5)
            priority_score += success_rate * 40

            # Scalability factor
            scalability = program.get('scalability', 0.5)
            priority_score += scalability * 20

            # Urgency factor
            urgency = program.get('urgency', 1)
            priority_score += urgency * 10

            program_priorities.append({
                "program": program,
                "priority_score": min(priority_score, 100),
                "calculated_budget": 0
            })

        # Sort by priority
        program_priorities.sort(key=lambda x: x['priority_score'], reverse=True)

        # Allocate budget using priority-based distribution
        remaining_budget = total_budget
        for i, item in enumerate(program_priorities):
            if i == 0:  # Highest priority gets largest share
                allocation = min(remaining_budget * 0.4, item['program'].get('max_budget', remaining_budget))
            elif i == 1:
                allocation = min(remaining_budget * 0.3, item['program'].get('max_budget', remaining_budget))
            elif i == 2:
                allocation = min(remaining_budget * 0.2, item['program'].get('max_budget', remaining_budget))
            else:
                allocation = remaining_budget / (len(program_priorities) - i)

            allocation = min(allocation, remaining_budget)
            item['calculated_budget'] = round(allocation, 2)
            remaining_budget -= allocation

        return {
            "total_budget": total_budget,
            "allocations": program_priorities,
            "optimization_method": "Priority-based Resource Allocation v1.0",
            "efficiency_score": self.calculate_allocation_efficiency(program_priorities)
        }

    def calculate_allocation_efficiency(self, allocations):
        """Calculate how efficiently resources are allocated"""
        if not allocations:
            return 0

        total_priority = sum(item['priority_score'] for item in allocations)
        weighted_allocation = sum(
            item['priority_score'] * (item['calculated_budget'] / sum(a['calculated_budget'] for a in allocations))
            for item in allocations
        )

        return round((weighted_allocation / total_priority) * 100, 2)

    def emergency_response_predictor(self, incident_data, weather_data=None, time_data=None):
        """
        Emergency Response Prediction System

        Predicts potential emergency situations based on patterns
        """
        predictions = []
        risk_indicators = defaultdict(float)

        # Analyze incident patterns
        for incident in incident_data[-50:]:  # Last 50 incidents
            incident_type = incident.get('incident_type', '').lower()

            if any(keyword in incident_type for keyword in self.emergency_keywords):
                risk_indicators['emergency_incidents'] += 1

            # Time-based patterns
            if time_data and time_data.get('hour', 0) in [22, 23, 0, 1, 2, 3, 4, 5, 6]:
                risk_indicators['night_time_risk'] += 0.5

            # Weather impact
            if weather_data and weather_data.get('condition') in ['storm', 'heavy_rain', 'typhoon']:
                risk_indicators['weather_risk'] += 1

        # Generate predictions
        emergency_risk = min(risk_indicators['emergency_incidents'] * 5, 100)

        if emergency_risk >= 70:
            predictions.append({
                "type": "CRITICAL_EMERGENCY_RISK",
                "probability": emergency_risk,
                "recommended_actions": [
                    "Pre-position emergency response teams",
                    "Stock emergency supplies",
                    "Activate emergency hotlines",
                    "Coordinate with disaster response units"
                ]
            })

        return {
            "emergency_predictions": predictions,
            "risk_indicators": dict(risk_indicators),
            "overall_emergency_risk": emergency_risk
        }

    def analyze_community_health_patterns(self, resident_data, health_indicators):
        """
        Community Health Risk Assessment

        Analyzes health patterns across the community
        """
        total_residents = len(resident_data)
        if total_residents == 0:
            return {"error": "No resident data available"}

        health_risks = defaultdict(float)
        vulnerable_groups = defaultdict(int)

        for resident in resident_data:
            age = resident.get('age', 0)
            is_senior = resident.get('is_senior', False)
            is_pwd = resident.get('is_pwd', False)

            # Age-based health risks
            if is_senior:
                health_risks['senior_health_risk'] += 1
                vulnerable_groups['seniors'] += 1
            elif age >= 60:
                health_risks['elderly_risk'] += 0.5

            # Disability health considerations
            if is_pwd:
                health_risks['disability_health_needs'] += 1
                vulnerable_groups['pwd'] += 1

        # Calculate risk percentages
        health_assessment = {}
        for risk_type, count in health_risks.items():
            health_assessment[risk_type] = {
                "count": int(count),
                "percentage": round((count / total_residents) * 100, 2),
                "risk_level": "HIGH" if count/total_residents > 0.15 else "MEDIUM" if count/total_residents > 0.08 else "LOW"
            }

        return {
            "total_residents_analyzed": total_residents,
            "vulnerable_groups": dict(vulnerable_groups),
            "health_risk_assessment": health_assessment,
            "recommendations": self.generate_health_recommendations(health_assessment),
            "analysis_date": datetime.now().isoformat()
        }

    def forecast_aid_demands(self, historical_aid_data, population_trends):
        """
        Aid Demand Forecasting using Trend Analysis

        Predicts future aid demands based on historical patterns
        """
        if not historical_aid_data:
            return {
                "forecast": "Unable to forecast - no historical data",
                "confidence": 0,
                "recommendations": ["Collect more historical aid data for accurate forecasting"]
            }

        # Simple trend analysis
        monthly_aid = defaultdict(int)
        for aid_record in historical_aid_data:
            month_key = aid_record.get('month', 'unknown')
            monthly_aid[month_key] += 1

        # Calculate growth trend
        aid_counts = list(monthly_aid.values())
        if len(aid_counts) >= 3:
            trend = self.calculate_slope(list(range(len(aid_counts))), aid_counts)
            avg_aid = sum(aid_counts) / len(aid_counts)

            if trend > 0:
                forecast_type = "INCREASING"
                projected_increase = trend * 6  # 6 months projection
                confidence = min(abs(trend) / avg_aid * 100, 85)
            elif trend < 0:
                forecast_type = "DECREASING"
                projected_increase = trend * 6
                confidence = min(abs(trend) / avg_aid * 100, 85)
            else:
                forecast_type = "STABLE"
                projected_increase = 0
                confidence = 60
        else:
            forecast_type = "INSUFFICIENT_DATA"
            projected_increase = 0
            confidence = 30

        return {
            "forecast_type": forecast_type,
            "projected_monthly_aid_demand": max(0, avg_aid + projected_increase),
            "confidence_percentage": round(confidence, 2),
            "historical_average": round(avg_aid, 2),
            "trend_slope": round(trend, 2) if len(aid_counts) >= 3 else 0,
            "data_points_analyzed": len(aid_counts),
            "forecast_period": "6 months",
            "recommendations": self.generate_forecast_recommendations(forecast_type, confidence)
        }

    def generate_health_recommendations(self, health_assessment):
        """Generate health recommendations based on risk assessment"""
        recommendations = []

        for risk_type, data in health_assessment.items():
            if data['risk_level'] == 'HIGH':
                if 'senior' in risk_type:
                    recommendations.extend([
                        "Establish senior citizen health monitoring program",
                        "Partner with local health centers for regular checkups",
                        "Create emergency medical response network for seniors"
                    ])
                elif 'disability' in risk_type:
                    recommendations.extend([
                        "Implement PWD health accessibility programs",
                        "Provide specialized medical equipment and support",
                        "Train community health workers on disability care"
                    ])

        if not recommendations:
            recommendations = [
                "Maintain regular community health monitoring",
                "Continue preventive health education programs",
                "Strengthen partnerships with local healthcare providers"
            ]

        return recommendations[:5]

    def generate_forecast_recommendations(self, forecast_type, confidence):
        """Generate recommendations based on aid demand forecast"""
        if forecast_type == "INCREASING" and confidence > 70:
            return [
                "Increase aid budget allocation by 20-30%",
                "Stockpile emergency relief supplies",
                "Expand volunteer network for aid distribution",
                "Develop rapid response aid programs",
                "Strengthen partnerships with aid organizations"
            ]
        elif forecast_type == "DECREASING" and confidence > 70:
            return [
                "Optimize existing aid programs efficiency",
                "Redirect resources to preventive programs",
                "Focus on skill development and livelihood programs",
                "Conduct community needs reassessment"
            ]
        else:
            return [
                "Maintain current aid program levels",
                "Continue regular monitoring and assessment",
                "Build flexible response capacity",
                "Strengthen community resilience programs"
            ]

    def process_chatbot_message(self, user_message, session_id=None, user_context=None):
        """
        BANTAY Chatbot - Intelligent Conversational Assistant

        Features:
        - Rule-based intent detection
        - FAQ matching with fuzzy string matching
        - Appointment booking workflow
        - Contextual conversation management
        """

        # Normalize input
        message = user_message.lower().strip() if user_message else ""
        if not message:
            return {
                "response": "Hello! I'm BANTAY, your barangay assistant. How can I help you today?",
                "intent": "greeting",
                "actions": []
            }

        # Initialize response data
        response_data = {
            "response": "",
            "intent": "unknown",
            "confidence": 0.0,
            "actions": [],
            "appointment_booked": False,
            "requires_followup": False
        }

        # 1. INTENT DETECTION
        intent_result = self._detect_intent(message)
        response_data.update(intent_result)

        # 2. GENERATE RESPONSE BASED ON INTENT
        if intent_result["intent"] == "faq":
            response_data["response"] = self._handle_faq_query(message, intent_result.get("faq_match"))

        elif intent_result["intent"] == "appointment_request":
            response_data["response"] = self._handle_appointment_request(message, user_context)

        elif intent_result["intent"] == "certificate_inquiry":
            response_data["response"] = self._handle_certificate_inquiry(message)

        elif intent_result["intent"] == "blotter_inquiry":
            response_data["response"] = self._handle_blotter_inquiry(message)

        elif intent_result["intent"] == "general_inquiry":
            response_data["response"] = self._handle_general_inquiry(message)

        elif intent_result["intent"] == "greeting":
            response_data["response"] = "Hello! I'm BANTAY, your barangay assistant. I can help you with:\n\n• Certificate requests and requirements\n• Appointment scheduling\n• Filing blotter reports\n• General barangay information\n\nWhat would you like to know?"

        elif intent_result["intent"] == "gratitude":
            response_data["response"] = "You're welcome! Feel free to ask me anything about barangay services. Have a great day! 👋"

        else:
            # Fallback response
            response_data["response"] = "I understand you're asking about barangay services. Could you please provide more details about what you need help with? I can assist with certificates, appointments, blotter reports, and general information."

        return response_data

    def _detect_intent(self, message):
        """Detect user intent using keyword matching and pattern recognition"""

        # Define intent patterns with keywords and weights
        intent_patterns = {
            "greeting": {
                "keywords": ["hello", "hi", "good morning", "good afternoon", "good evening", "hey", "bantay"],
                "patterns": [r"^(hi|hello|hey|good\s+(morning|afternoon|evening))"],
                "weight": 1.0
            },
            "gratitude": {
                "keywords": ["thank you", "thanks", "thank you very much", "appreciate", "grateful"],
                "patterns": [r"(thank|thanks|appreciate)"],
                "weight": 1.0
            },
            "appointment_request": {
                "keywords": ["appointment", "schedule", "book", "meet", "see", "talk to", "speak with"],
                "patterns": [r"(appointment|schedule|book|meet|see)"],
                "weight": 0.9
            },
            "certificate_inquiry": {
                "keywords": ["certificate", "clearance", "residency", "indigency", "business", "good moral"],
                "patterns": [r"(certificate|clearance|residency|indigency|business|good moral)"],
                "weight": 0.8
            },
            "blotter_inquiry": {
                "keywords": ["blotter", "report", "complaint", "incident", "file", "complain"],
                "patterns": [r"(blotter|report|complaint|incident|file|complain)"],
                "weight": 0.8
            },
            "faq": {
                "keywords": ["hours", "open", "closed", "time", "office", "location", "address", "contact", "phone", "requirements"],
                "patterns": [],
                "weight": 0.7
            }
        }

        best_match = {"intent": "unknown", "confidence": 0.0}

        for intent, config in intent_patterns.items():
            confidence = 0.0

            # Keyword matching
            for keyword in config["keywords"]:
                if keyword in message:
                    confidence += config["weight"] * 0.3

            # Pattern matching
            for pattern in config["patterns"]:
                if re.search(pattern, message, re.IGNORECASE):
                    confidence += config["weight"] * 0.4

            # Fuzzy matching for FAQ
            if intent == "faq":
                faq_match = self._find_faq_match(message)
                if faq_match:
                    confidence += 0.5
                    best_match["faq_match"] = faq_match

            if confidence > best_match["confidence"]:
                best_match = {
                    "intent": intent,
                    "confidence": min(confidence, 1.0),
                    "faq_match": best_match.get("faq_match")
                }

        return best_match

    def _find_faq_match(self, message):
        """Find the best matching FAQ using fuzzy string matching"""
        try:
            from fuzzywuzzy import fuzz
        except ImportError:
            # Fallback to simple string matching if fuzzywuzzy not available
            return self._simple_faq_match(message)

        # This would require database integration
        # For now, return None - will be implemented with database
        return None

    def _simple_faq_match(self, message):
        """Simple FAQ matching without fuzzywuzzy"""
        faq_keywords = {
            "hours": "office_hours",
            "open": "office_hours",
            "closed": "office_hours",
            "time": "office_hours",
            "office": "office_hours",
            "requirements": "requirements",
            "clearance": "requirements",
            "contact": "contact",
            "phone": "contact",
            "address": "contact",
            "location": "contact"
        }

        for keyword, category in faq_keywords.items():
            if keyword in message:
                return {"category": category, "confidence": 0.8}

        return None

    def _handle_faq_query(self, message, faq_match):
        """Handle FAQ queries"""
        if faq_match and faq_match.get("category"):
            category = faq_match["category"]

            faq_responses = {
                "office_hours": "Our barangay office is open from Monday to Friday, 8:00 AM to 5:00 PM, and Saturday from 8:00 AM to 12:00 NN. We are closed on Sundays and holidays.",
                "requirements": "Requirements vary by certificate type. For barangay clearance, you need: valid ID, proof of residency, cedula, and P50 fee. Would you like me to help you schedule an appointment?",
                "contact": "You can reach us at: 📞 (02) 123-4567, 📧 info@barangay-batia.gov.ph, 📍 Barangay Hall, Batia Proper"
            }

            return faq_responses.get(category, "I can help you with information about office hours, requirements, and contact details. Could you be more specific?")

        return "I have information about office hours, requirements, and contact details. What would you like to know?"

    def _handle_appointment_request(self, message, user_context):
        """Handle appointment booking requests"""
        # Extract appointment type from message
        appointment_types = {
            "certificate": ["certificate", "clearance", "residency", "indigency"],
            "blotter": ["blotter", "complaint", "report", "incident"],
            "inquiry": ["inquiry", "question", "ask", "talk"]
        }

        detected_type = "inquiry"  # default

        for app_type, keywords in appointment_types.items():
            if any(keyword in message for keyword in keywords):
                detected_type = app_type
                break

        type_labels = {
            "certificate": "Certificate Request",
            "blotter": "Blotter Filing",
            "inquiry": "General Inquiry"
        }

        response = f"I can help you schedule an appointment for: **{type_labels.get(detected_type, 'General Inquiry')}**\n\n"
        response += "To proceed, please provide:\n"
        response += "• Your full name\n"
        response += "• Contact number\n"
        response += "• Preferred date and time\n"
        response += "• Brief description of your needs\n\n"
        response += "Or I can guide you through the process step by step. Would you like to start?"

        return response

    def _handle_certificate_inquiry(self, message):
        """Handle certificate-related inquiries"""
        certificates = {
            "clearance": "Barangay Clearance (P50) - Proves clean record",
            "residency": "Barangay Residency (P30) - Confirms residence",
            "indigency": "Certificate of Indigency (Free) - For financial assistance",
            "business": "Business Clearance (P100) - For business operations",
            "good moral": "Good Moral Certificate (P25) - Character reference"
        }

        response = "We offer several types of certificates:\n\n"
        for cert_type, description in certificates.items():
            if cert_type in message:
                response += f"**{description}**\n\n"
                if "clearance" in cert_type:
                    response += "Requirements: Valid ID, proof of residency, cedula, P50 fee\n"
                response += "Would you like to schedule an appointment to apply?"
                return response

        response += "\n".join([f"• {desc}" for desc in certificates.values()])
        response += "\n\nWhich certificate are you interested in? I can help you with the requirements and schedule an appointment."

        return response

    def _handle_blotter_inquiry(self, message):
        """Handle blotter/complaint inquiries"""
        response = "For filing a blotter report (complaint), you'll need:\n\n"
        response += "• Valid ID\n"
        response += "• At least one witness (if possible)\n"
        response += "• Detailed description of the incident\n"
        response += "• Any supporting evidence\n\n"
        response += "Our barangay officers will mediate and help resolve the issue through the Katarungang Pambarangay process.\n\n"
        response += "Would you like to schedule an appointment to file your complaint?"

        return response

    def _handle_general_inquiry(self, message):
        """Handle general inquiries"""
        return "I'm here to help with barangay services! I can assist you with:\n\n• Certificate applications and requirements\n• Scheduling appointments\n• Filing blotter reports\n• General information about our office\n\nWhat specific information do you need?"

    def book_appointment(self, appointment_data):
        """
        Book an appointment through the chatbot system

        appointment_data should contain:
        - visitor_name: Full name
        - visitor_contact: Phone number
        - appointment_type: Type of appointment
        - appointment_date: Preferred date
        - appointment_time: Preferred time
        - purpose: Description of needs
        """
        required_fields = ['visitor_name', 'visitor_contact', 'appointment_type', 'purpose']

        # Validate required fields
        for field in required_fields:
            if not appointment_data.get(field):
                return {
                    "success": False,
                    "error": f"Missing required field: {field}",
                    "appointment_id": None
                }

        # Generate appointment ID
        appointment_id = f"APP-{datetime.now().strftime('%Y%m%d')}-{random.randint(1000, 9999)}"

        # In a real implementation, this would save to database
        # For now, we'll return a mock successful response

        appointment_details = {
            "appointment_id": appointment_id,
            "status": "confirmed",
            "scheduled_date": appointment_data.get('appointment_date', 'Next available slot'),
            "scheduled_time": appointment_data.get('appointment_time', 'To be confirmed'),
            "assigned_staff": "Barangay Secretary",
            "confirmation_message": f"Your appointment has been scheduled. Please bring valid ID and required documents."
        }

        return {
            "success": True,
            "appointment": appointment_details,
            "message": "Appointment booked successfully! You'll receive a confirmation SMS."
        }

    def get_available_slots(self, appointment_type, preferred_date=None):
        """Get available appointment slots"""
        # Mock available slots - in real implementation, check database
        base_slots = {
            "certificate": ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM"],
            "blotter": ["9:00 AM", "11:00 AM", "1:00 PM", "3:00 PM"],
            "inquiry": ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"]
        }

        slots = base_slots.get(appointment_type, base_slots["inquiry"])

        return {
            "available_slots": slots,
            "next_available_date": preferred_date or datetime.now().strftime('%Y-%m-%d'),
            "note": "Slots are subject to availability and confirmation"
        }

    def generate_analytics_report(self, report_type, date_range=None, filters=None):
        """
        Ronda.ai - Generate comprehensive analytics reports

        Supports multiple report types with data aggregation and insights
        """
        if not date_range:
            # Default to last 30 days
            end_date = datetime.now()
            start_date = end_date - timedelta(days=30)
        else:
            start_date = datetime.fromisoformat(date_range.get('start', (datetime.now() - timedelta(days=30)).isoformat()))
            end_date = datetime.fromisoformat(date_range.get('end', datetime.now().isoformat()))

        report_data = {
            "report_type": report_type,
            "generated_at": datetime.now().isoformat(),
            "date_range": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat(),
                "days": (end_date - start_date).days
            },
            "filters": filters or {},
            "metrics": {},
            "insights": [],
            "recommendations": []
        }

        # This would query the database in a real implementation
        # For now, we'll generate mock analytics based on report type

        if report_type == "incident_analysis":
            report_data.update(self._generate_incident_analysis_report(start_date, end_date, filters))
        elif report_type == "trend_analysis":
            report_data.update(self._generate_trend_analysis_report(start_date, end_date, filters))
        elif report_type == "predictive_forecast":
            report_data.update(self._generate_predictive_forecast_report(start_date, end_date, filters))
        elif report_type == "resource_allocation":
            report_data.update(self._generate_resource_allocation_report(start_date, end_date, filters))

        return report_data

    def _generate_incident_analysis_report(self, start_date, end_date, filters):
        """Generate detailed incident analysis report"""
        # Mock data - in real implementation, query blotter table
        mock_incidents = [
            {"date": "2025-12-01", "type": "Physical Injury", "sitio": "Batia Proper", "severity": "High"},
            {"date": "2025-12-02", "type": "Theft", "sitio": "Northville 5", "severity": "Medium"},
            {"date": "2025-12-03", "type": "Unjust Vexation", "sitio": "St. Martha", "severity": "Low"},
            {"date": "2025-12-05", "type": "Physical Injury", "sitio": "Batia Proper", "severity": "High"},
            {"date": "2025-12-07", "type": "Malicious Mischief", "sitio": "Northville 5", "severity": "Medium"},
            {"date": "2025-12-10", "type": "Theft", "sitio": "St. Martha", "severity": "Medium"},
            {"date": "2025-12-12", "type": "Physical Injury", "sitio": "Batia Proper", "severity": "Critical"},
            {"date": "2025-12-15", "type": "Unjust Vexation", "sitio": "Northville 5", "severity": "Low"},
        ]

        # Filter by date range
        filtered_incidents = [
            inc for inc in mock_incidents
            if start_date <= datetime.fromisoformat(inc["date"]) <= end_date
        ]

        # Calculate metrics
        total_incidents = len(filtered_incidents)
        incidents_by_type = {}
        incidents_by_sitio = {}
        incidents_by_severity = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}

        for inc in filtered_incidents:
            incidents_by_type[inc["type"]] = incidents_by_type.get(inc["type"], 0) + 1
            incidents_by_sitio[inc["sitio"]] = incidents_by_sitio.get(inc["sitio"], 0) + 1
            incidents_by_severity[inc["severity"]] += 1

        # Generate insights
        insights = []
        if total_incidents > 0:
            avg_daily = total_incidents / max(1, (end_date - start_date).days)
            insights.append(f"Average of {avg_daily:.1f} incidents per day")

            top_type = max(incidents_by_type.items(), key=lambda x: x[1])
            insights.append(f"Most common incident: {top_type[0]} ({top_type[1]} cases)")

            top_sitio = max(incidents_by_sitio.items(), key=lambda x: x[1])
            insights.append(f"Highest incident area: {top_sitio[0]} ({top_sitio[1]} cases)")

            critical_count = incidents_by_severity["Critical"]
            if critical_count > 0:
                insights.append(f"⚠️ {critical_count} critical incidents requiring immediate attention")

        # Generate recommendations
        recommendations = []
        if incidents_by_severity["Critical"] > 2:
            recommendations.append("Increase patrol presence in high-risk areas")
        if len(incidents_by_type) > 3:
            recommendations.append("Implement targeted prevention programs for common incident types")
        if max(incidents_by_sitio.values()) > total_incidents * 0.4:
            recommendations.append("Focus community outreach in hotspot areas")

        return {
            "metrics": {
                "total_incidents": total_incidents,
                "incidents_by_type": incidents_by_type,
                "incidents_by_sitio": incidents_by_sitio,
                "incidents_by_severity": incidents_by_severity,
                "average_daily_incidents": round(total_incidents / max(1, (end_date - start_date).days), 2)
            },
            "insights": insights,
            "recommendations": recommendations,
            "chart_data": {
                "incident_trends": self._generate_trend_chart_data(filtered_incidents, start_date, end_date),
                "type_distribution": incidents_by_type,
                "sitio_distribution": incidents_by_sitio,
                "severity_distribution": incidents_by_severity
            }
        }

    def _generate_trend_analysis_report(self, start_date, end_date, filters):
        """Generate trend analysis with time series insights"""
        # Generate weekly trend data
        weeks = []
        current = start_date
        while current <= end_date:
            week_end = min(current + timedelta(days=6), end_date)
            weeks.append({
                "week": f"{current.strftime('%m/%d')}-{week_end.strftime('%m/%d')}",
                "incidents": random.randint(0, 8),  # Mock data
                "start_date": current.isoformat(),
                "end_date": week_end.isoformat()
            })
            current = week_end + timedelta(days=1)

        # Calculate trend
        incident_counts = [w["incidents"] for w in weeks]
        if len(incident_counts) >= 2:
            trend_slope = self.calculate_slope(list(range(len(incident_counts))), incident_counts)
            if trend_slope > 0.5:
                trend = "INCREASING"
                trend_description = "Incident rates are rising"
            elif trend_slope < -0.5:
                trend = "DECREASING"
                trend_description = "Incident rates are declining"
            else:
                trend = "STABLE"
                trend_description = "Incident rates are stable"
        else:
            trend = "INSUFFICIENT_DATA"
            trend_description = "Not enough data for trend analysis"
            trend_slope = 0

        # Seasonal analysis (mock)
        seasonal_patterns = {
            "weekday_avg": 3.2,
            "weekend_avg": 4.8,
            "peak_hour": "10:00 PM - 2:00 AM",
            "low_hour": "6:00 AM - 9:00 AM"
        }

        return {
            "metrics": {
                "trend_direction": trend,
                "trend_slope": round(trend_slope, 2),
                "total_period_incidents": sum(incident_counts),
                "peak_week_incidents": max(incident_counts),
                "low_week_incidents": min(incident_counts)
            },
            "insights": [
                trend_description,
                f"Peak week: {max(incident_counts)} incidents",
                f"Lowest week: {min(incident_counts)} incidents",
                "Weekend incidents are 50% higher than weekdays",
                f"Peak incident hours: {seasonal_patterns['peak_hour']}"
            ],
            "recommendations": [
                "Adjust patrol schedules based on peak hours",
                "Implement weekend-specific security measures" if seasonal_patterns["weekend_avg"] > seasonal_patterns["weekday_avg"] * 1.2 else "Continue standard patrol schedules",
                "Monitor trend closely - consider intervention if rising continues"
            ],
            "chart_data": {
                "weekly_trends": weeks,
                "seasonal_patterns": seasonal_patterns,
                "moving_average": self._calculate_moving_average(incident_counts, 2)
            }
        }

    def _generate_predictive_forecast_report(self, start_date, end_date, filters):
        """Generate predictive forecasting with confidence intervals"""
        # Simple linear regression forecasting
        historical_data = [5, 7, 4, 8, 6, 9, 5, 7, 6, 8]  # Mock historical data

        # Calculate trend and forecast next 4 weeks
        if len(historical_data) >= 3:
            x = list(range(len(historical_data)))
            slope = self.calculate_slope(x, historical_data)
            intercept = sum(historical_data) / len(historical_data) - slope * (len(x) - 1) / 2

            forecast_periods = 4
            forecast = []
            confidence_interval = []

            for i in range(forecast_periods):
                period = len(historical_data) + i
                predicted = slope * period + intercept
                forecast.append(max(0, predicted))  # Ensure non-negative

                # Simple confidence interval (±20% of prediction)
                ci_lower = max(0, predicted * 0.8)
                ci_upper = predicted * 1.2
                confidence_interval.append({"lower": ci_lower, "upper": ci_upper})

            forecast_accuracy = 85  # Mock accuracy percentage
        else:
            forecast = []
            confidence_interval = []
            forecast_accuracy = 0

        return {
            "metrics": {
                "forecast_period_weeks": 4,
                "forecast_accuracy": forecast_accuracy,
                "trend_slope": slope if len(historical_data) >= 3 else 0,
                "historical_data_points": len(historical_data)
            },
            "insights": [
                f"Next 4 weeks forecast: {sum(forecast):.0f} total incidents",
                f"Average weekly prediction: {sum(forecast)/len(forecast):.1f} incidents",
                f"Forecast confidence: {forecast_accuracy}%",
                "Trend indicates " + ("increasing" if slope > 0 else "decreasing") + " incident rates"
            ],
            "recommendations": [
                "Prepare resources based on forecast predictions",
                "Monitor actual vs predicted trends weekly",
                "Adjust prevention strategies based on forecast accuracy",
                "Consider additional patrols during predicted high periods"
            ],
            "chart_data": {
                "historical_data": historical_data,
                "forecast_data": forecast,
                "confidence_intervals": confidence_interval,
                "forecast_dates": [(end_date + timedelta(days=i*7)).strftime('%Y-%m-%d') for i in range(4)]
            }
        }

    def _generate_resource_allocation_report(self, start_date, end_date, filters):
        """Generate resource allocation optimization report"""
        # Mock resource allocation analysis
        current_allocation = {
            "tanods": 12,
            "vehicles": 3,
            "budget_monthly": 150000,
            "coverage_areas": 4
        }

        recommended_allocation = {
            "tanods": 15,
            "vehicles": 4,
            "budget_monthly": 185000,
            "coverage_areas": 4
        }

        efficiency_metrics = {
            "current_response_time": "12 minutes",
            "recommended_response_time": "8 minutes",
            "coverage_efficiency": 78,
            "resource_utilization": 82
        }

        return {
            "metrics": {
                "current_allocation": current_allocation,
                "recommended_allocation": recommended_allocation,
                "efficiency_improvement": {
                    "response_time_reduction": "33%",
                    "coverage_increase": "15%",
                    "cost_efficiency": "8%"
                }
            },
            "insights": [
                "Current allocation covers 78% of high-risk areas effectively",
                "Recommended changes would reduce response time by 33%",
                "Additional 3 tanods would improve weekend coverage significantly",
                "Vehicle allocation optimization could save 15% on fuel costs"
            ],
            "recommendations": [
                "Increase tanod count from 12 to 15 for better coverage",
                "Add one patrol vehicle for improved response times",
                "Implement shift rotation system for 24/7 coverage",
                "Allocate additional budget for training and equipment"
            ],
            "chart_data": {
                "allocation_comparison": {
                    "current": current_allocation,
                    "recommended": recommended_allocation
                },
                "efficiency_metrics": efficiency_metrics,
                "cost_benefit_analysis": {
                    "additional_cost": recommended_allocation["budget_monthly"] - current_allocation["budget_monthly"],
                    "expected_benefits": ["33% faster response", "15% better coverage", "20% reduction in incidents"]
                }
            }
        }

    def _generate_trend_chart_data(self, incidents, start_date, end_date):
        """Generate trend chart data for visualization"""
        daily_incidents = {}
        current = start_date
        while current <= end_date:
            daily_incidents[current.strftime('%Y-%m-%d')] = 0
            current += timedelta(days=1)

        for incident in incidents:
            date_key = incident["date"]
            daily_incidents[date_key] = daily_incidents.get(date_key, 0) + 1

        return {
            "dates": list(daily_incidents.keys()),
            "incident_counts": list(daily_incidents.values()),
            "cumulative": [sum(list(daily_incidents.values())[:i+1]) for i in range(len(daily_incidents))]
        }

    def _calculate_moving_average(self, data, window_size):
        """Calculate moving average for trend smoothing"""
        if len(data) < window_size:
            return data

        moving_avg = []
        for i in range(len(data)):
            start_idx = max(0, i - window_size + 1)
            avg = sum(data[start_idx:i+1]) / len(data[start_idx:i+1])
            moving_avg.append(round(avg, 2))

        return moving_avg

# Initialize AI system
ai_system = AdvancedBarangayAI()

@app.route('/suggest-aid', methods=['POST'])
def suggest_aid():
    """
    Advanced Social Aid Prioritizer with Multi-Factor Analysis
    """
    try:
        data = request.get_json()
        historical_data = data.get('historical_data')

        result = ai_system.calculate_social_aid_priority_advanced(data, historical_data)
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/suggest-patrol', methods=['POST'])
def suggest_patrol():
    """
    Advanced Predictive Policing with AI Analysis
    """
    try:
        data = request.get_json()
        blotter_data = data.get('blotter_data', [])
        historical_patterns = data.get('historical_patterns')

        result = ai_system.advanced_predictive_policing(blotter_data, historical_patterns)
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/suggest-patrol-deployment', methods=['POST'])
def suggest_patrol_deployment():
    """
    Katarungang Pambarangay Patrol Deployment Suggestions
    """
    try:
        data = request.get_json()
        blotter_data = data.get('blotter_data', [])

        result = ai_system.suggest_patrol_deployment(blotter_data)
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/detect-fraud', methods=['POST'])
def detect_fraud():
    """
    Certificate Fraud Detection System
    """
    try:
        data = request.get_json()
        certificate_data = data.get('certificate_data', [])
        resident_history = data.get('resident_history', {})

        result = ai_system.certificate_fraud_detection(certificate_data, resident_history)
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/optimize-budget', methods=['POST'])
def optimize_budget():
    """
    AI-Powered Budget Optimization for Programs
    """
    try:
        data = request.get_json()
        program_data = data.get('program_data', {})
        budget_data = data.get('budget_data', {})
        community_needs = data.get('community_needs', {})

        result = ai_system.resource_allocation_optimizer(program_data, budget_data, community_needs)
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/predict-emergency', methods=['POST'])
def predict_emergency():
    """
    Emergency Response Prediction System
    """
    try:
        data = request.get_json()
        incident_data = data.get('incident_data', [])
        weather_data = data.get('weather_data')
        time_data = data.get('time_data')

        result = ai_system.emergency_response_predictor(incident_data, weather_data, time_data)
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/analyze-community-health', methods=['POST'])
def analyze_community_health():
    """
    Community Health Risk Assessment
    """
    try:
        data = request.get_json()
        resident_data = data.get('resident_data', [])
        health_indicators = data.get('health_indicators', {})

        # Analyze community health patterns
        health_analysis = ai_system.analyze_community_health_patterns(resident_data, health_indicators)
        return jsonify(health_analysis)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/forecast-aid-demands', methods=['POST'])
def forecast_aid_demands():
    """
    Aid Demand Forecasting using Trend Analysis
    """
    try:
        data = request.get_json()
        historical_aid_data = data.get('historical_aid_data', [])
        population_trends = data.get('population_trends', {})

        # Forecast future aid demands
        forecast = ai_system.forecast_aid_demands(historical_aid_data, population_trends)
        return jsonify(forecast)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/chatbot/message', methods=['POST'])
def chatbot_message():
    """
    BANTAY Chatbot Message Processing
    """
    try:
        data = request.get_json()
        user_message = data.get('message', '')
        session_id = data.get('session_id')
        user_context = data.get('context', {})

        if not user_message:
            return jsonify({"error": "Message is required"}), 400

        # Process message through BANTAY chatbot
        response = ai_system.process_chatbot_message(user_message, session_id, user_context)

        return jsonify({
            "response": response["response"],
            "intent": response["intent"],
            "confidence": response["confidence"],
            "actions": response["actions"],
            "appointment_booked": response["appointment_booked"],
            "requires_followup": response["requires_followup"],
            "timestamp": datetime.now().isoformat()
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/chatbot/appointment/book', methods=['POST'])
def book_appointment():
    """
    Book an appointment through BANTAY chatbot
    """
    try:
        appointment_data = request.get_json()

        # Validate required fields
        required_fields = ['visitor_name', 'visitor_contact', 'appointment_type', 'purpose']
        for field in required_fields:
            if not appointment_data.get(field):
                return jsonify({
                    "success": False,
                    "error": f"Missing required field: {field}"
                }), 400

        # Book appointment using AI system
        result = ai_system.book_appointment(appointment_data)

        return jsonify(result)

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/chatbot/appointment/slots', methods=['GET'])
def get_appointment_slots():
    """
    Get available appointment slots
    """
    try:
        appointment_type = request.args.get('type', 'inquiry')
        preferred_date = request.args.get('date')

        slots = ai_system.get_available_slots(appointment_type, preferred_date)

        return jsonify(slots)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/chatbot/faq', methods=['GET'])
def get_faq():
    """
    Get chatbot FAQ data
    """
    try:
        # In a real implementation, this would query the database
        # For now, return static FAQ data
        faq_data = [
            {
                "category": "office_hours",
                "question": "What are your office hours?",
                "answer": "Our barangay office is open from Monday to Friday, 8:00 AM to 5:00 PM, and Saturday from 8:00 AM to 12:00 NN. We are closed on Sundays and holidays.",
                "keywords": "hours, open, closed, time, schedule"
            },
            {
                "category": "requirements",
                "question": "What are the requirements for barangay clearance?",
                "answer": "Requirements for Barangay Clearance:\n1. Valid ID (any government-issued)\n2. Proof of residency (utility bill, lease agreement, etc.)\n3. Community Tax Certificate (Cedula)\n4. Payment of P50.00 fee\nProcessing time: 10-15 minutes",
                "keywords": "clearance, requirements, documents, needed, cedula"
            },
            {
                "category": "contact",
                "question": "How can I contact the barangay?",
                "answer": "You can reach us through:\n📞 Phone: (02) 123-4567\n📧 Email: info@barangay-batia.gov.ph\n📍 Address: Barangay Hall, Batia Proper",
                "keywords": "contact, phone, email, address, reach"
            }
        ]

        return jsonify({"faq": faq_data})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/analytics/generate-report', methods=['POST'])
def generate_analytics_report():
    """
    Generate comprehensive analytics reports
    """
    try:
        data = request.get_json()
        report_type = data.get('report_type', 'incident_analysis')
        date_range = data.get('date_range')
        filters = data.get('filters', {})

        if report_type not in ['incident_analysis', 'trend_analysis', 'predictive_forecast', 'resource_allocation']:
            return jsonify({"error": "Invalid report type"}), 400

        # Generate report using AI system
        report = ai_system.generate_analytics_report(report_type, date_range, filters)

        return jsonify(report)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/analytics/dashboard-summary', methods=['GET'])
def get_dashboard_summary():
    """
    Get dashboard summary data for Ronda.ai
    """
    try:
        # Generate quick summary for dashboard
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)

        # Mock summary data - in real implementation, query database
        summary = {
            "total_incidents_30d": 28,
            "active_cases": 5,
            "high_risk_areas": ["Batia Proper", "Northville 5"],
            "trend_direction": "STABLE",
            "forecast_next_week": 8,
            "response_time_avg": "12 minutes",
            "coverage_percentage": 78,
            "generated_at": datetime.now().isoformat()
        }

        return jsonify(summary)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/analytics/charts/<chart_type>', methods=['GET'])
def get_chart_data(chart_type):
    """
    Get specific chart data for analytics dashboard
    """
    try:
        # Generate chart data based on type
        if chart_type == 'incident_trends':
            # Last 30 days incident trends
            dates = [(datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d') for i in range(29, -1, -1)]
            data = [random.randint(0, 5) for _ in range(30)]
            chart_data = {
                "labels": dates,
                "datasets": [{
                    "label": "Daily Incidents",
                    "data": data,
                    "borderColor": "#1DB954",
                    "backgroundColor": "rgba(29, 185, 84, 0.1)",
                    "tension": 0.4
                }]
            }

        elif chart_type == 'incident_types':
            chart_data = {
                "labels": ["Physical Injury", "Theft", "Unjust Vexation", "Malicious Mischief", "Other"],
                "datasets": [{
                    "label": "Incidents by Type",
                    "data": [8, 6, 4, 3, 7],
                    "backgroundColor": [
                        "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"
                    ]
                }]
            }

        elif chart_type == 'sitio_distribution':
            chart_data = {
                "labels": ["Batia Proper", "Northville 5", "St. Martha", "AFP/PNP"],
                "datasets": [{
                    "label": "Incidents by Sitio",
                    "data": [12, 8, 5, 3],
                    "backgroundColor": [
                        "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"
                    ]
                }]
            }

        elif chart_type == 'hourly_patterns':
            chart_data = {
                "labels": [f"{i}:00" for i in range(24)],
                "datasets": [{
                    "label": "Incidents by Hour",
                    "data": [random.randint(0, 3) for _ in range(24)],
                    "borderColor": "#1DB954",
                    "backgroundColor": "rgba(29, 185, 84, 0.1)",
                    "fill": true
                }]
            }

        else:
            return jsonify({"error": "Unknown chart type"}), 400

        return jsonify(chart_data)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/analytics/export/<report_id>', methods=['GET'])
def export_analytics_report(report_id):
    """
    Export analytics report (PDF/Excel format)
    """
    try:
        # In a real implementation, this would generate and return a file
        # For now, return mock response
        export_data = {
            "report_id": report_id,
            "export_format": "pdf",
            "file_size": "2.3 MB",
            "download_url": f"/downloads/reports/{report_id}.pdf",
            "generated_at": datetime.now().isoformat()
        }

        return jsonify(export_data)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "Advanced Barangay AI System",
        "version": "3.0.0",
        "features": [
            "Advanced Social Aid Prioritizer (Multi-Factor Analysis)",
            "Advanced Predictive Policing (Time Series + Pattern Recognition)",
            "Certificate Fraud Detection System",
            "AI Budget Optimization Engine",
            "Emergency Response Prediction",
            "Community Health Risk Assessment",
            "Aid Demand Forecasting"
        ],
        "ai_model_versions": {
            "social_aid": "Advanced Multi-Factor Analysis v2.1",
            "predictive_policing": "Advanced Time Series Analysis v2.0",
            "fraud_detection": "Pattern Recognition Engine v1.0",
            "budget_optimization": "Priority-based Allocation v1.0",
            "emergency_prediction": "Risk Assessment Model v1.0",
            "health_analysis": "Community Health Patterns v1.0",
            "demand_forecasting": "Trend Analysis Engine v1.0"
        }
    })

@app.route('/', methods=['GET'])
def index():
    """API information"""
    return jsonify({
        "service": "Advanced Barangay AI Decision Support System",
        "version": "3.0.0",
        "description": "Comprehensive AI-powered platform for barangay administration and community management",
        "capabilities": [
            "Intelligent Social Aid Prioritization",
            "Advanced Predictive Policing",
            "Certificate Fraud Detection",
            "Resource Allocation Optimization",
            "Emergency Response Prediction",
            "Community Health Assessment",
            "Aid Demand Forecasting"
        ],
        "endpoints": {
            "POST /suggest-aid": "Advanced multi-factor social aid priority calculation with trend analysis",
            "POST /suggest-patrol": "AI-powered predictive policing with time series analysis",
            "POST /detect-fraud": "Certificate fraud detection using pattern recognition",
            "POST /optimize-budget": "AI budget optimization for community programs",
            "POST /predict-emergency": "Emergency response prediction system",
            "POST /analyze-community-health": "Community health risk assessment",
            "POST /forecast-aid-demands": "Aid demand forecasting with trend analysis",
            "GET /health": "System health and capabilities check"
        },
        "ai_algorithms": {
            "vulnerability_scoring": "Weighted multi-factor analysis with dynamic thresholds",
            "risk_modeling": "Time series analysis with pattern recognition",
            "trend_analysis": "Linear regression with confidence intervals",
            "pattern_recognition": "Statistical anomaly detection",
            "optimization_engine": "Priority-based resource allocation",
            "predictive_modeling": "Machine learning-inspired risk prediction"
        },
        "data_processing": {
            "real_time_analysis": True,
            "historical_trend_analysis": True,
            "multi_factor_correlation": True,
            "predictive_forecasting": True,
            "anomaly_detection": True
        }
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Barangay AI Service running on port {port}")
    print("Available endpoints:")
    print("  POST /suggest-aid - Social aid prioritization")
    print("  POST /suggest-patrol - Patrol deployment suggestions")
    print("  GET /health - Health check")
    app.run(debug=True, host='0.0.0.0', port=port)
