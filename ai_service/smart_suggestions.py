import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from collections import Counter

def analyze_crime_patterns(blotter_data):
    """Analyze actual crime patterns from blotter data"""
    if not blotter_data:
        return {"error": "No data provided"}
    
    df = pd.DataFrame(blotter_data)
    
    # Location analysis
    location_counts = df['Location_Sitio'].value_counts().to_dict() if 'Location_Sitio' in df.columns else {}
    
    # Time pattern analysis
    if 'DateTime_Incident' in df.columns:
        df['hour'] = pd.to_datetime(df['DateTime_Incident']).dt.hour
        peak_hours = df['hour'].value_counts().head(3).to_dict()
    else:
        peak_hours = {}
    
    # Incident type analysis
    incident_types = df['Incident_Type'].value_counts().to_dict() if 'Incident_Type' in df.columns else {}
    
    return {
        "hotspots": location_counts,
        "peak_hours": peak_hours,
        "incident_types": incident_types,
        "total_incidents": len(df),
        "analysis_date": datetime.now().isoformat()
    }

def predict_certificate_demand(historical_data):
    """Predict certificate demand based on historical patterns"""
    if not historical_data:
        return {"error": "No historical data"}
    
    df = pd.DataFrame(historical_data)
    
    # Certificate type demand
    cert_demand = df['certificate_type'].value_counts().to_dict() if 'certificate_type' in df.columns else {}
    
    # Monthly trends
    if 'date_issued' in df.columns:
        df['month'] = pd.to_datetime(df['date_issued']).dt.month
        monthly_trend = df['month'].value_counts().sort_index().to_dict()
    else:
        monthly_trend = {}
    
    return {
        "certificate_demand": cert_demand,
        "monthly_trends": monthly_trend,
        "total_requests": len(df),
        "prediction_date": datetime.now().isoformat()
    }
