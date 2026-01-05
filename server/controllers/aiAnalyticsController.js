class AIAnalyticsController {
  constructor(db) {
    this.db = db;
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
      const avgProcessingTime = certStats.reduce((sum, cert) => sum + cert.avg_processing_days, 0) / certStats.length;

      res.json({
        success: true,
        data: {
          certificate_demand: certStats,
          workload_trend: workloadStats,
          capacity_metrics: {
            total_pending: totalPending,
            avg_processing_days: Math.round(avgProcessingTime * 10) / 10,
            recommended_capacity: Math.ceil(totalPending / 5) // 5 requests per day capacity
          }
        }
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
          governance_score: Math.round((serviceStats.reduce((sum, s) => sum + (s.completed_requests / s.total_requests), 0) / serviceStats.length) * 100)
        }
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
        recommended_actions: area.avg_risk_score >= 2 ? 
          ['Increase social services', 'Community outreach programs', 'Regular monitoring'] :
          area.avg_risk_score >= 1 ? 
          ['Preventive programs', 'Regular check-ins'] :
          ['Maintain current services']
      }));

      res.json({
        success: true,
        data: {
          risk_by_area: riskAnalysis,
          incident_patterns: incidentRisk,
          intervention_recommendations: recommendations,
          overall_risk_score: Math.round((riskAnalysis.reduce((sum, area) => sum + area.avg_risk_score, 0) / riskAnalysis.length) * 10) / 10
        }
      });
    } catch (error) {
      console.error('Error fetching secretary analytics:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch risk analytics' });
    }
  }

  async generateReport(req, res) {
    try {
      const { report_type, date_range } = req.query;
      
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
          
        default:
          reportData = { message: 'Report type not implemented' };
      }

      res.json({
        success: true,
        data: reportData,
        generated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error generating report:', error);
      res.status(500).json({ success: false, message: 'Failed to generate report' });
    }
  }
}

module.exports = AIAnalyticsController;