import math
from datetime import datetime
from collections import Counter

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

def calculate_linear_regression_slope(x_values, y_values):
    """
    Calculate the slope of a linear regression line (y = mx + b).
    m = (N * sum(xy) - sum(x) * sum(y)) / (N * sum(x^2) - (sum(x))^2)
    """
    n = len(x_values)
    if n < 2:
        return 0.0
    
    sum_x = sum(x_values)
    sum_y = sum(y_values)
    sum_xy = sum(x * y for x, y in zip(x_values, y_values))
    sum_x_sq = sum(x**2 for x in x_values)
    
    denominator = (n * sum_x_sq - sum_x**2)
    if denominator == 0:
        return 0.0
        
    slope = (n * sum_xy - sum_x * sum_y) / denominator
    return slope

def analyze_trends(records):
    """
    Analyze crime trends using Linear Regression on daily counts.
    Returns: "INCREASING", "DECREASING", or "STABLE"
    """
    try:
        if not records:
            return "STABLE"
            
        # Group by date
        daily_counts = Counter()
        for r in records:
            if 'dt' in r and r['dt']:
                daily_counts[r['dt'].date()] += 1
                
        if len(daily_counts) < 3:
            return "STABLE"

        sorted_dates = sorted(daily_counts.keys())
        
        # X = ordinal date, Y = counts
        x_values = [d.toordinal() for d in sorted_dates]
        y_values = [daily_counts[d] for d in sorted_dates]
        
        slope = calculate_linear_regression_slope(x_values, y_values)
        
        if slope > 0.1:
            return "INCREASING"
        elif slope < -0.1:
            return "DECREASING"
        else:
            return "STABLE"
            
    except Exception as e:
        print(f"Trend analysis error: {e}")
        return "STABLE"

def analyze_day_patterns(records):
    """
    Analyze incidents by day of the week.
    Returns: Dictionary of {DayName: Count}
    """
    try:
        day_counts = Counter()
        for r in records:
            if 'dt' in r and r['dt']:
                day_counts[r['dt'].strftime('%A')] += 1
        return dict(day_counts)
    except Exception as e:
        print(f"Day pattern analysis error: {e}")
        return {}

def normalize_incident_type(text):
    """
    Map free-text incident descriptions to standard categories.
    """
    if not text:
        return 'Other'
        
    text_lower = str(text).lower()
    
    for category, keywords in KEYWORD_MAPPING.items():
        if any(keyword in text_lower for keyword in keywords):
            return category
            
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
    
    # Preprocess data
    processed_records = []
    for item in blotter_data:
        record = item.copy()
        
        # Normalize Type
        raw_type = record.get('Incident_Type', '')
        record['Normalized_Type'] = normalize_incident_type(raw_type)
        
        # Parse Date
        dt_str = record.get('DateTime_Incident')
        if dt_str:
            try:
                # Handle ISO format or fallback
                if 'T' in dt_str:
                    record['dt'] = datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
                else:
                    # Try basic parsing or ignore
                    pass
            except:
                pass
        
        processed_records.append(record)

    # Location Counts
    location_counts = Counter()
    for r in processed_records:
        loc = r.get('Location_Sitio', 'Unknown')
        location_counts[loc] += 1
    
    # Weighted Risk Analysis
    risk_scores = Counter()
    for r in processed_records:
        loc = r.get('Location_Sitio', 'Unknown')
        incident_type = r.get('Normalized_Type', 'Other')
        weight = SEVERITY_WEIGHTS.get(incident_type, 1)
        risk_scores[loc] += weight
        
    # Hotspots
    if risk_scores:
        hotspots = dict(sorted(risk_scores.items(), key=lambda x: x[1], reverse=True))
    else:
        hotspots = dict(location_counts)

    # Time Patterns
    hour_counts = Counter()
    for r in processed_records:
        if 'dt' in r and r['dt']:
            hour_counts[r['dt'].hour] += 1
            
    peak_hours = dict(sorted(hour_counts.items(), key=lambda x: x[1], reverse=True)[:3]) if hour_counts else {}
    
    trend = analyze_trends(processed_records)
    day_counts = analyze_day_patterns(processed_records)
    
    # Incident Types
    type_counts = Counter(r['Normalized_Type'] for r in processed_records)
    
    return {
        "hotspots": hotspots,
        "raw_counts": dict(location_counts),
        "peak_hours": peak_hours,
        "day_counts": day_counts,
        "incident_types": dict(type_counts),
        "total_incidents": len(processed_records),
        "trend": trend,
        "analysis_date": datetime.now().isoformat()
    }

def predict_certificate_demand(historical_data):
    """Predict certificate demand based on historical patterns"""
    if not historical_data:
        return {"error": "No historical data"}
    
    cert_demand = Counter()
    month_counts = Counter()
    
    for item in historical_data:
        cert_type = item.get('certificate_type')
        if cert_type:
            cert_demand[cert_type] += 1
            
        date_issued = item.get('date_issued')
        if date_issued:
            try:
                dt = datetime.fromisoformat(date_issued.replace('Z', '+00:00'))
                month_counts[dt.month] += 1
            except:
                pass
                
    return {
        "certificate_demand": dict(cert_demand),
        "monthly_trends": dict(sorted(month_counts.items())),
        "total_requests": len(historical_data),
        "prediction_date": datetime.now().isoformat()
    }
