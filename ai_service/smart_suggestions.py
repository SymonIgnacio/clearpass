#!/usr/bin/env python3
import sys
import json
import pandas as pd

def get_crime_hotspots(blotter_data):
    if not blotter_data:
        return {}
    df = pd.DataFrame(blotter_data)
    if 'Location_Sitio' not in df.columns and 'location' not in df.columns:
        return {}
    location_col = 'Location_Sitio' if 'Location_Sitio' in df.columns else 'location'
    hotspots = df[location_col].value_counts().to_dict()
    return {
        "hotspots": hotspots,
        "total_incidents": len(df),
        "high_risk_areas": [area for area, count in hotspots.items() if count >= 5]
    }

def get_certificate_demand(request_data):
    if not request_data:
        return {}
    df = pd.DataFrame(request_data)
    if 'document_type' not in df.columns and 'certificate_type' not in df.columns:
        return {}
    doc_col = 'document_type' if 'document_type' in df.columns else 'certificate_type'
    demand = df[doc_col].value_counts().to_dict()
    return {
        "certificate_demand": demand,
        "total_requests": len(df),
        "most_requested": max(demand.items(), key=lambda x: x[1])[0] if demand else None
    }

def main():
    try:
        input_data = json.loads(sys.stdin.read())
        analysis_type = input_data.get('type', 'hotspots')
        if analysis_type == 'hotspots':
            result = get_crime_hotspots(input_data.get('data', []))
        elif analysis_type == 'certificates':
            result = get_certificate_demand(input_data.get('data', []))
        else:
            result = {"error": "Unknown analysis type"}
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == '__main__':
    main()
