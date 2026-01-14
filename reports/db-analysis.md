# Database Analysis Report

Generated: 2026-01-14T02:24:16.947Z
Database: barangay_management

## Summary

- Total tables: 41
- Total foreign keys: 18
- Top issues: 0

## Top Issues

_None_

## Blotter Quality Metrics

- Rows: 7
- Status column: status
- DateTime column: DateTime_Incident
- Invalid case IDs: 0

### Status Distribution

| status | count |
| --- | --- |
| Active | 5 |
| Pending | 1 |
| Scheduled for Mediation | 1 |

### Sitio Distribution

| sitio | count |
| --- | --- |
| Northville 5 | 2 |
| St. Martha | 2 |
| AFP/PNP | 2 |
| Batia Proper | 1 |

### Incident Type Distribution

| incidentType | count |
| --- | --- |
| Boundary Dispute | 2 |
| Unjust Vexation | 1 |
| Grave Threats | 1 |
| Theft (Petty) | 1 |
| Estafa (Swindling) | 1 |
| Noise Barrage | 1 |

## AI Data Requirements

```json
{
  "aiAnalytics": {
    "tables": [
      "blotter",
      "residents",
      "sitios"
    ],
    "requiredFields": [
      "blotter.Case_Number",
      "blotter.Incident_Type",
      "blotter.Location_Sitio",
      "blotter.DateTime_Incident",
      "blotter.Status|blotter.status"
    ]
  },
  "pythonPatrolSuggestions": {
    "tables": [
      "blotter"
    ],
    "requiredFields": [
      "blotter.Location_Sitio",
      "blotter.Incident_Type",
      "blotter.DateTime_Incident"
    ]
  }
}
```
