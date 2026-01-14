import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from collections import Counter
from sklearn.linear_model import LinearRegression

# Define weights for different incident types to prioritize dangerous areas
SEVERITY_WEIGHTS = {
    'Physical Injury': 5,
    'Homicide': 10,
    'Grave Threats': 4,
    'Theft': 3,
    'Robbery': 4,
    'Drug Related': 5,
    'Sexual Harassment': 5,
    'Vandalism': 2,
    'Noise Complaint': 1,
    'Dispute': 2,
    'Other': 1
}

# Define keyword mappings for free-text classification
KEYWORD_MAPPING = {
    'Physical Injury': ['physical', 'injury', 'hurt', 'punch', 'hit', 'stab', 'cut', 'wound', 'beat', 'attack', 'maul', 'bugbog', 'suntok', 'sinaktan', 'nasugatan', 'binugbog', 'sinuntok', 'tinaga', 'sinaksak'],
    'Homicide': ['homicide', 'kill', 'murder', 'dead', 'death', 'patay', 'pinatay', 'bangkay'],
    'Grave Threats': ['threat', 'kill you', 'scare', 'intimidate', 'banta', 'tinakot', 'papatayin', 'papartayin'],
    'Theft': ['theft', 'steal', 'stolen', 'rob', 'missing', 'taken', 'snatch', 'nawala', 'ninakaw', 'kinuha', 'snatcher', 'pinitik'],
    'Robbery': ['robbery', 'hold up', 'holdup', 'holdap', 'hinoldap'],
    'Drug Related': ['drug', 'shabu', 'marijuana', 'weed', 'pushing', 'selling drugs', 'adikt', 'adik', 'droga', 'bato'],
    'Sexual Harassment': ['sexual', 'harass', 'rape', 'touch', 'lewd', 'bastos', 'nambastos', 'hinipo', 'manyak'],
    'Vandalism': ['vandal', 'destroy', 'break', 'damage', 'graffiti', 'sira', 'sinira', 'binasag', 'ginuhitan'],
    'Noise Complaint': ['noise', 'loud', 'music', 'videoke', 'karaoke', 'party', 'ingay', 'maingay', 'nagkakantahan', 'nag-iingay'],
    'Dispute': ['dispute', 'fight', 'quarrel', 'argument', 'conflict', 'misunderstanding', 'away', 'nag-away', 'nag-aaway', 'sigawan', 'talo', 'sagutan'],
}

def analyze_trends(df):
    """
    Analyze crime trends using Linear Regression to detect if incidents are increasing.
    Returns: "INCREASING", "DECREASING", or "STABLE"
    """
    try:
        if 'dt' not in df.columns or df.empty:
            return "STABLE"

        # Group by day
        daily_counts = df.groupby(df['dt'].dt.date).size().reset_index(name='counts')
        
        if len(daily_counts) < 3:
            return "STABLE" # Not enough data points

        # Prepare data for regression
        # X = days since start, y = counts
        daily_counts['date_ordinal'] = pd.to_datetime(daily_counts['dt']).map(datetime.toordinal)
        X = daily_counts['date_ordinal'].values.reshape(-1, 1)
        y = daily_counts['counts'].values

        model = LinearRegression()
        model.fit(X, y)
        
        slope = model.coef_[0]
        
        if slope > 0.1:
            return "INCREASING"
        elif slope < -0.1:
            return "DECREASING"
        else:
            return "STABLE"
            
    except Exception as e:
        print(f"Trend analysis error: {e}")
        return "STABLE"

def analyze_day_patterns(df):
    """
    Analyze incidents by day of the week to find dangerous days.
    Returns: Dictionary of {Day: Count}
    """
    try:
        if 'dt' not in df.columns or df.empty:
            return {}
            
        # 0=Monday, 6=Sunday
        df['day_name'] = df['dt'].dt.day_name()
        day_counts = df['day_name'].value_counts().to_dict()
        return day_counts
    except Exception as e:
        print(f"Day pattern analysis error: {e}")
        return {}

def normalize_incident_type(text):
    """
    Map free-text incident descriptions to standard categories using keywords.
    """
    if not text:
        return 'Other'
        
    text_lower = str(text).lower()
    
    # Check keyword mappings
    for category, keywords in KEYWORD_MAPPING.items():
        if any(keyword in text_lower for keyword in keywords):
            return category
            
    # Fallback: check if any standard category name is in the text
    for key in SEVERITY_WEIGHTS.keys():
        if key.lower() in text_lower:
            return key
            
    return 'Other'

def analyze_crime_patterns(blotter_data):
    """
    Analyze actual crime patterns from blotter data using weighted risk scoring.
    """
    if not blotter_data:
        return {"error": "No data provided"}
    
    df = pd.DataFrame(blotter_data)
    
    # Normalize incident types for better analytics
    if 'Incident_Type' in df.columns:
        df['Normalized_Type'] = df['Incident_Type'].apply(normalize_incident_type)
    else:
        df['Normalized_Type'] = 'Other'
    
    # Location analysis (Raw Counts)
    location_counts = df['Location_Sitio'].value_counts().to_dict() if 'Location_Sitio' in df.columns else {}
    
    # Weighted Risk Analysis
    risk_scores = {}
    if 'Location_Sitio' in df.columns:
        for _, row in df.iterrows():
            loc = row.get('Location_Sitio', 'Unknown')
            incident_type = row.get('Normalized_Type', 'Other')
            
            # Get weight based on normalized type
            weight = SEVERITY_WEIGHTS.get(incident_type, 1)
            
            risk_scores[loc] = risk_scores.get(loc, 0) + weight
    
    # Determine hotspots based on Risk Score if available, otherwise Counts
    hotspots = dict(sorted(risk_scores.items(), key=lambda x: x[1], reverse=True)) if risk_scores else location_counts

    # Time pattern analysis
    trend = "STABLE"
    peak_hours = {}
    day_counts = {}
    
    if 'DateTime_Incident' in df.columns:
        # Convert to datetime, handling errors
        df['dt'] = pd.to_datetime(df['DateTime_Incident'], errors='coerce')
        df = df.dropna(subset=['dt']) # Drop invalid dates
        
        if not df.empty:
            df['hour'] = df['dt'].dt.hour
            peak_hours = df['hour'].value_counts().head(3).to_dict()
            
            # Analyze Trend
            trend = analyze_trends(df)
            
            # Analyze Day Patterns
            day_counts = analyze_day_patterns(df)
    
    # Incident type analysis
    incident_types = df['Normalized_Type'].value_counts().to_dict() if 'Normalized_Type' in df.columns else {}
    
    return {
        "hotspots": hotspots,
        "raw_counts": location_counts,
        "peak_hours": peak_hours,
        "day_counts": day_counts,
        "incident_types": incident_types,
        "total_incidents": len(df),
        "trend": trend,
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
