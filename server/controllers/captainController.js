function getKnex() {
  return require('knex')(require('./knexfile')[process.env.NODE_ENV || 'development']);
}

/**
 * THEMIS CLEARPASS CAPTAIN CONTROLLER
 * Handles executive read-only analytics and oversight
 */

// Get executive dashboard with population growth and heatmaps
async function getExecutiveDashboard(req, res) {
  try {
    const knex = getKnex();
    // Population statistics
    const [populationStats] = await knex('residents').select(
      knex.raw('COUNT(*) as total_residents'),
      knex.raw(
        'SUM(CASE WHEN DATE_FORMAT(NOW(), "%Y") - DATE_FORMAT(Birthdate, "%Y") < 18 THEN 1 ELSE 0 END) as minors'
      ),
      knex.raw(
        'SUM(CASE WHEN DATE_FORMAT(NOW(), "%Y") - DATE_FORMAT(Birthdate, "%Y") BETWEEN 18 AND 59 THEN 1 ELSE 0 END) as adults'
      ),
      knex.raw(
        'SUM(CASE WHEN DATE_FORMAT(NOW(), "%Y") - DATE_FORMAT(Birthdate, "%Y") >= 60 THEN 1 ELSE 0 END) as seniors'
      ),
      knex.raw('SUM(CASE WHEN Gender = "Male" THEN 1 ELSE 0 END) as males'),
      knex.raw('SUM(CASE WHEN Gender = "Female" THEN 1 ELSE 0 END) as females'),
      knex.raw('COUNT(DISTINCT Household_ID) as total_households')
    );

    // Monthly population growth trend (last 12 months)
    const populationGrowth = await knex('residents')
      .select(
        knex.raw('YEAR(Date_Arrival) as year'),
        knex.raw('MONTH(Date_Arrival) as month'),
        knex.raw('COUNT(*) as new_residents')
      )
      .whereRaw('Date_Arrival >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)')
      .groupBy('year', 'month')
      .orderBy('year', 'desc')
      .orderBy('month', 'desc');

    // Residency status distribution
    const residencyStatus = await knex('residents')
      .select('Residency_Status')
      .count('* as count')
      .groupBy('Residency_Status');

    // Household size distribution
    const householdSizes = await knex('households')
      .select(
        knex.raw(
          'CASE WHEN resident_count <= 3 THEN "Small (1-3)" WHEN resident_count <= 5 THEN "Medium (4-5)" ELSE "Large (6+)" END as size_category'
        ),
        knex.raw('COUNT(*) as household_count')
      )
      .groupByRaw(
        'CASE WHEN resident_count <= 3 THEN "Small (1-3)" WHEN resident_count <= 5 THEN "Medium (4-5)" ELSE "Large (6+)" END'
      );

    // Certificate issuance trends
    const certificateTrends = await knex('certificates_log')
      .select(
        knex.raw('YEAR(date_issued) as year'),
        knex.raw('MONTH(date_issued) as month'),
        knex.raw('COUNT(*) as certificates_issued'),
        'certificate_type'
      )
      .whereRaw('date_issued >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)')
      .groupBy('year', 'month', 'certificate_type')
      .orderBy('year', 'desc')
      .orderBy('month', 'desc');

    // Heatmap data - incidents by sitio
    const incidentHeatmap = await knex('blotter')
      .select('Location_Sitio')
      .count('* as incident_count')
      .whereNotNull('Location_Sitio')
      .groupBy('Location_Sitio')
      .orderBy('incident_count', 'desc');

    // Vulnerable groups monitoring
    const vulnerableGroups = await knex('vulnerabilities')
      .select(
        knex.raw('SUM(CASE WHEN Is_Senior = 1 THEN 1 ELSE 0 END) as seniors_count'),
        knex.raw('SUM(CASE WHEN Is_PWD = 1 THEN 1 ELSE 0 END) as pwd_count'),
        knex.raw('SUM(CASE WHEN Is_Solo_Parent = 1 THEN 1 ELSE 0 END) as solo_parent_count')
      )
      .first();

    // Community program effectiveness
    const programStats = await knex('community_programs')
      .select(
        knex.raw('COUNT(*) as total_programs'),
        knex.raw('SUM(CASE WHEN status = "Completed" THEN 1 ELSE 0 END) as completed_programs'),
        knex.raw('AVG(target_beneficiaries) as avg_beneficiaries')
      )
      .first();

    res.json({
      success: true,
      dashboard: {
        population_overview: {
          total_residents: populationStats[0]?.total_residents || 0,
          demographics: {
            minors: populationStats[0]?.minors || 0,
            adults: populationStats[0]?.adults || 0,
            seniors: populationStats[0]?.seniors || 0,
          },
          gender_distribution: {
            males: populationStats[0]?.males || 0,
            females: populationStats[0]?.females || 0,
          },
          households: populationStats[0]?.total_households || 0,
        },
        population_growth: populationGrowth,
        residency_distribution: residencyStatus,
        household_sizes: householdSizes,
        certificate_trends: certificateTrends,
        incident_heatmap: incidentHeatmap,
        vulnerable_groups: {
          seniors: vulnerableGroups?.seniors_count || 0,
          pwd: vulnerableGroups?.pwd_count || 0,
          solo_parents: vulnerableGroups?.solo_parent_count || 0,
        },
        community_programs: {
          total_programs: programStats?.total_programs || 0,
          completion_rate: programStats?.total_programs
            ? (
                ((programStats.completed_programs || 0) / programStats.total_programs) *
                100
              ).toFixed(1)
            : 0,
          average_beneficiaries: Math.round(programStats?.avg_beneficiaries || 0),
        },
      },
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Captain dashboard error:', error);
    res.status(500).json({ error: 'Failed to load executive dashboard' });
  }
}

module.exports = {
  getExecutiveDashboard,
};
