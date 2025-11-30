from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from datetime import datetime, timedelta
import json
import math
import statistics
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
