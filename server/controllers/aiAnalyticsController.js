const AIAnalysisService = require('../services/AIAnalysisService');

class AIAnalyticsController {
  constructor(db) {
    this.db = db;
    this.aiService = new AIAnalysisService(db);
  }

  async getClerkWorkloadInsights(req, res) {
    try {
      // Certificate demand prediction
      const [certStats] = await this.db.execute(`
        SELECT 
          document_type,
          COUNT(*) as total_requests,
          AVG(DATEDIFF(updated_at, created_at)) as avg_processing_days,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
        FROM document_requests 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY document_type
        ORDER BY total_requests DESC
      `);

      // Workload analytics
      const [workloadStats] = await this.db.execute(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as daily_requests
        FROM document_requests 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date
      `);

      // Capacity planning
      const totalPending = certStats.reduce((sum, cert) => sum + cert.pending_count, 0);
      const avgProcessingTime =
        certStats.reduce((sum, cert) => sum + cert.avg_processing_days, 0) / certStats.length;

      res.json({
        success: true,
        data: {
          certificate_demand: certStats,
          workload_trend: workloadStats,
          capacity_metrics: {
            total_pending: totalPending,
            avg_processing_days: Math.round(avgProcessingTime * 10) / 10,
            recommended_capacity: Math.ceil(totalPending / 5), // 5 requests per day capacity
          },
        },
      });
    } catch (error) {
      console.error('Error fetching clerk insights:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch workload insights' });
    }
  }

  async getCaptainExecutiveInsights(req, res) {
    try {
      // Population forecasting
      const [populationStats] = await this.db.execute(`
        SELECT 
          COUNT(*) as total_residents,
          SUM(CASE WHEN Gender = 'Male' THEN 1 ELSE 0 END) as male_count,
          SUM(CASE WHEN Gender = 'Female' THEN 1 ELSE 0 END) as female_count,
          AVG(Age) as avg_age
        FROM residents 
        WHERE Residency_Status = 'Active'
      `);

      // Governance analytics
      const [serviceStats] = await this.db.execute(`
        SELECT 
          'Certificates' as service_type,
          COUNT(*) as total_requests,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_requests
        FROM document_requests
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        UNION ALL
        SELECT 
          'Blotter Cases' as service_type,
          COUNT(*) as total_requests,
          COUNT(CASE WHEN Status IN ('Amicably Settled', 'Dismissed') THEN 1 END) as completed_requests
        FROM blotter
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      `);

      // Decision support metrics
      const [vulnerabilityStats] = await this.db.execute(`
        SELECT 
          SUM(CASE WHEN Is_4Ps = 1 THEN 1 ELSE 0 END) as fourps_count,
          SUM(CASE WHEN Is_PWD = 1 THEN 1 ELSE 0 END) as pwd_count,
          SUM(CASE WHEN Is_Senior = 1 THEN 1 ELSE 0 END) as senior_count,
          AVG(Vulnerability_Score) as avg_vulnerability_score
        FROM vulnerabilities
      `);

      res.json({
        success: true,
        data: {
          population_overview: populationStats[0],
          service_performance: serviceStats,
          vulnerability_metrics: vulnerabilityStats[0],
          governance_score: Math.round(
            (serviceStats.reduce((sum, s) => sum + s.completed_requests / s.total_requests, 0) /
              serviceStats.length) *
              100
          ),
        },
      });
    } catch (error) {
      console.error('Error fetching captain insights:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch executive insights' });
    }
  }

  async getSecretaryRiskAnalytics(req, res) {
    try {
      // Vulnerability analysis
      const [riskAnalysis] = await this.db.execute(`
        SELECT 
          h.Sitio_ID,
          s.name as sitio_name,
          COUNT(r.Resident_ID) as total_residents,
          AVG(v.Vulnerability_Score) as avg_risk_score,
          COUNT(CASE WHEN v.Vulnerability_Score >= 3 THEN 1 END) as high_risk_count
        FROM households h
        LEFT JOIN sitios s ON h.Sitio_ID = s.id
        LEFT JOIN residents r ON h.Household_ID = r.Household_ID
        LEFT JOIN vulnerabilities v ON r.Resident_ID = v.Resident_ID
        WHERE r.Residency_Status = 'Active'
        GROUP BY h.Sitio_ID, s.name
        ORDER BY avg_risk_score DESC
      `);

      // Incident risk scoring
      const [incidentRisk] = await this.db.execute(`
        SELECT 
          Location_Sitio,
          COUNT(*) as incident_count,
          COUNT(CASE WHEN Incident_Type IN ('Physical Injury', 'Grave Threats') THEN 1 END) as high_severity_count
        FROM blotter 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
        GROUP BY Location_Sitio
        ORDER BY incident_count DESC
      `);

      // Intervention recommendations
      const recommendations = riskAnalysis.map(area => ({
        sitio: area.sitio_name,
        risk_level: area.avg_risk_score >= 2 ? 'High' : area.avg_risk_score >= 1 ? 'Medium' : 'Low',
        recommended_actions:
          area.avg_risk_score >= 2
            ? ['Increase social services', 'Community outreach programs', 'Regular monitoring']
            : area.avg_risk_score >= 1
              ? ['Preventive programs', 'Regular check-ins']
              : ['Maintain current services'],
      }));

      // --- AI Audit & Verification ---
      // 1. Calculate Confidence
      const totalResidentsAnalyzed = riskAnalysis.reduce((sum, r) => sum + r.total_residents, 0);
      const confidenceScore = this.aiService.calculateConfidence(totalResidentsAnalyzed);

      // 2. Log Analysis
      const facts = riskAnalysis.map(r => ({
        fact_type: 'RISK_SCORE',
        fact_value: { sitio: r.sitio_name, score: r.avg_risk_score },
        source: 'internal_db',
        confidence: confidenceScore,
      }));

      const runId = await this.aiService.logAnalysis({
        analysisType: 'SECRETARY_RISK_ANALYTICS',
        parameters: { range: '90_days' },
        results: {
          risk_areas: riskAnalysis.length,
          high_risk: riskAnalysis.filter(r => r.avg_risk_score >= 2).length,
        },
        confidenceScore,
        userId: req.user ? req.user.id : null,
        facts,
      });

      res.json({
        success: true,
        audit_id: runId,
        confidence_score: confidenceScore,
        data: {
          risk_by_area: riskAnalysis,
          incident_patterns: incidentRisk,
          intervention_recommendations: recommendations,
          overall_risk_score:
            Math.round(
              (riskAnalysis.reduce((sum, area) => sum + area.avg_risk_score, 0) /
                riskAnalysis.length) *
                10
            ) / 10,
        },
      });
    } catch (error) {
      console.error('Error fetching secretary analytics:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch risk analytics' });
    }
  }

  async getDashboardSummary(req, res) {
    try {
      // Active cases
      const [activeCases] = await this.db.execute(`
        SELECT COUNT(*) as count 
        FROM blotter 
        WHERE Status IN ('Pending', 'Active', 'Under Investigation', 'Hearing Scheduled')
      `);

      // 30-day incidents
      const [incidents30d] = await this.db.execute(`
        SELECT COUNT(*) as count 
        FROM blotter 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      `);

      // Previous 30-day incidents for trend
      const [incidentsPrev30d] = await this.db.execute(`
        SELECT COUNT(*) as count 
        FROM blotter 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY)
        AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
      `);

      // Calculate trend
      const current = incidents30d[0].count;
      const previous = incidentsPrev30d[0].count;
      const trend_direction =
        current > previous ? 'INCREASING' : current < previous ? 'DECREASING' : 'STABLE';

      // High risk areas (Top 3 sitios with most incidents in last 30 days)
      const [highRiskAreas] = await this.db.execute(`
        SELECT Location_Sitio 
        FROM blotter 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY Location_Sitio 
        ORDER BY COUNT(*) DESC 
        LIMIT 3
      `);

      // --- AI Audit ---
      // Confidence depends on sample size (current incidents)
      const confidenceScore = this.aiService.calculateConfidence(current);
      const runId = await this.aiService.logAnalysis({
        analysisType: 'DASHBOARD_SUMMARY',
        parameters: { range: '30_days' },
        results: { trend: trend_direction, active_cases: activeCases[0].count },
        confidenceScore,
        userId: req.user ? req.user.id : null,
        facts: highRiskAreas.map(a => ({
          fact_type: 'HIGH_RISK_AREA',
          fact_value: a.Location_Sitio,
          source: 'internal_db',
        })),
      });

      res.json({
        audit_id: runId,
        confidence_score: confidenceScore,
        active_cases: activeCases[0].count,
        total_incidents_30d: incidents30d[0].count,
        trend_direction,
        high_risk_areas: highRiskAreas.map(a => a.Location_Sitio).filter(Boolean),
      });
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch dashboard summary' });
    }
  }

  async getChartData(req, res) {
    try {
      const { type } = req.params;
      let data = {};

      switch (type) {
        case 'incident_trends':
          const [trends] = await this.db.execute(`
            SELECT DATE(created_at) as date, COUNT(*) as count 
            FROM blotter 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(created_at) 
            ORDER BY date
          `);
          data = {
            labels: trends.map(t => new Date(t.date).toLocaleDateString()),
            datasets: [{ data: trends.map(t => t.count) }],
          };
          break;

        case 'incident_types':
          const [types] = await this.db.execute(`
            SELECT Incident_Type, COUNT(*) as count 
            FROM blotter 
            GROUP BY Incident_Type
          `);
          data = {
            labels: types.map(t => t.Incident_Type),
            datasets: [{ data: types.map(t => t.count) }],
          };
          break;

        case 'sitio_distribution':
          const [sitios] = await this.db.execute(`
            SELECT Location_Sitio, COUNT(*) as count 
            FROM blotter 
            GROUP BY Location_Sitio
          `);
          data = {
            labels: sitios.map(t => t.Location_Sitio || 'Unknown'),
            datasets: [{ data: sitios.map(t => t.count) }],
          };
          break;

        case 'hourly_patterns':
          const [hours] = await this.db.execute(`
            SELECT HOUR(DateTime_Incident) as hour, COUNT(*) as count 
            FROM blotter 
            WHERE DateTime_Incident IS NOT NULL
            GROUP BY HOUR(DateTime_Incident)
            ORDER BY hour
          `);
          // Fill missing hours
          const hourlyData = Array(24).fill(0);
          hours.forEach(h => {
            if (h.hour >= 0 && h.hour < 24) hourlyData[h.hour] = h.count;
          });
          data = {
            labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
            datasets: [{ data: hourlyData }],
          };
          break;

        default:
          return res.status(400).json({ success: false, message: 'Invalid chart type' });
      }

      res.json(data);
    } catch (error) {
      console.error('Error fetching chart data:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch chart data' });
    }
  }

  async getPatrolSuggestions(req, res) {
    try {
      // 1. Analyze incidents by Sitio for the last 7 days (Weekly Deployment Cycle)
      const [sitioStats] = await this.db.execute(`
        SELECT 
          Location_Sitio,
          COUNT(*) as incident_count,
          GROUP_CONCAT(DISTINCT Incident_Type) as common_types
        FROM blotter 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        AND Location_Sitio IS NOT NULL AND Location_Sitio != ''
        GROUP BY Location_Sitio 
        ORDER BY incident_count DESC
      `);

      // 2. Analyze peak incident times (Hour of day) - Keep 30 days for better trend accuracy
      const [peakTimes] = await this.db.execute(`
        SELECT 
          HOUR(DateTime_Incident) as incident_hour,
          COUNT(*) as count
        FROM blotter 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND DateTime_Incident IS NOT NULL
        GROUP BY incident_hour 
        ORDER BY count DESC 
        LIMIT 1
      `);
      const peakHour = peakTimes.length > 0 ? peakTimes[0].incident_hour : 18; // Default to 6 PM

      // 3. Construct Structured Data for Matrix
      const patrolMatrix = {};
      let totalIncidentsWeek = 0;
      let maxIncidents = 0;
      let hotspotArea = null;

      // Helper to determine risk and action plan
      const getSitioPlan = (count, types) => {
        if (count >= 5)
          return {
            level: 'HIGH',
            plan: `Deploy 4-man team + Mobile Patrol. Focus on: ${types || 'General Order'}.`,
          };
        if (count >= 2)
          return {
            level: 'MEDIUM',
            plan: `Deploy 2-man static post. Monitor for: ${types || 'Disturbances'}.`,
          };
        return {
          level: 'LOW',
          plan: 'Standard roving patrol (1 pass/hour).',
        };
      };

      // Process existing stats
      sitioStats.forEach(stat => {
        totalIncidentsWeek += stat.incident_count;
        if (stat.incident_count > maxIncidents) {
          maxIncidents = stat.incident_count;
          hotspotArea = stat.Location_Sitio;
        }

        const { level, plan } = getSitioPlan(stat.incident_count, stat.common_types);

        patrolMatrix[stat.Location_Sitio] = {
          incidents_this_week: stat.incident_count,
          risk_level: level,
          patrol_suggestion: plan,
        };
      });

      // Ensure all major Sitios are represented (even with 0 incidents) if needed
      // For now, we'll just show what we have in the blotter + maybe a default "Station" if empty?
      // Better: If matrix is empty, return a default state so the table isn't blank
      if (Object.keys(patrolMatrix).length === 0) {
        patrolMatrix['Barangay Hall Area'] = {
          incidents_this_week: 0,
          risk_level: 'LOW',
          patrol_suggestion: 'Standard perimeter watch.',
        };
      }

      // 4. Calculate Overall Threat Level
      let overallRiskLevel = 'LOW';
      if (totalIncidentsWeek > 15 || maxIncidents >= 5) overallRiskLevel = 'HIGH';
      else if (totalIncidentsWeek > 5 || maxIncidents >= 2) overallRiskLevel = 'MEDIUM';

      // --- AI Audit & Validation ---
      const confidenceScore = this.aiService.calculateConfidence(totalIncidentsWeek);
      const runId = await this.aiService.logAnalysis({
        analysisType: 'PATROL_MATRIX_7D',
        parameters: { range: '7_days' },
        results: {
          overall_risk: overallRiskLevel,
          areas_covered: Object.keys(patrolMatrix).length,
        },
        confidenceScore,
        userId: req.user ? req.user.id : null,
        facts: sitioStats.map(r => ({
          fact_type: 'WEEKLY_INCIDENTS',
          fact_value: { sitio: r.Location_Sitio, count: r.incident_count },
          source: 'blotter',
        })),
      });

      res.json({
        audit_id: runId,
        confidence_score: confidenceScore,
        overall_risk_level: overallRiskLevel,
        hotspot_area: hotspotArea,
        max_incidents: maxIncidents,
        analysis_period: 'Last 7 Days',
        patrol_suggestions: patrolMatrix,
      });
    } catch (error) {
      console.error('Error generating patrol suggestions:', error);
      res.status(500).json({ success: false, message: 'Failed to generate patrol suggestions' });
    }
  }

  async generateReport(req, res) {
    try {
      // Handle both GET query and POST body
      const report_type = req.query.report_type || req.body.report_type;

      let reportData = {};

      switch (report_type) {
        case 'monthly_summary':
          const [monthlySummary] = await this.db.execute(`
            SELECT 
              COUNT(DISTINCT dr.request_id) as total_certificates,
              COUNT(DISTINCT b.Case_Number) as total_cases,
              COUNT(DISTINCT r.Resident_ID) as active_residents
            FROM document_requests dr
            CROSS JOIN blotter b
            CROSS JOIN residents r
            WHERE dr.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            AND b.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            AND r.Residency_Status = 'Active'
          `);
          reportData = monthlySummary[0];
          break;

        case 'incident_analysis':
        case 'trend_analysis':
        case 'predictive_forecast':
        case 'resource_allocation':
          // For now, return a generic structure for these specific reports
          // In a real implementation, these would have specific logic
          const [incidents] = await this.db.execute(`
            SELECT Incident_Type, Location_Sitio, Status, DateTime_Incident
            FROM blotter
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          `);
          reportData = {
            type: report_type,
            incident_count: incidents.length,
            details: incidents,
            generated_at: new Date().toISOString(),
          };
          break;

        default:
          reportData = { message: 'Report type not implemented' };
      }

      res.json({
        success: true,
        data: reportData,
        generated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error generating report:', error);
      res.status(500).json({ success: false, message: 'Failed to generate report' });
    }
  }
}

module.exports = AIAnalyticsController;
