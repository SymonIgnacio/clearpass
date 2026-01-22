exports.up = async function up(knex) {
  const hasVulnerabilities = await knex.schema.hasTable('vulnerabilities');
  if (hasVulnerabilities) {
    const hasValidationStatus = await knex.schema.hasColumn('vulnerabilities', 'validation_status');
    const hasValidationNotes = await knex.schema.hasColumn('vulnerabilities', 'validation_notes');
    const hasValidatedBy = await knex.schema.hasColumn('vulnerabilities', 'validated_by');
    const hasValidatedAt = await knex.schema.hasColumn('vulnerabilities', 'validated_at');

    if (!hasValidationStatus || !hasValidationNotes || !hasValidatedBy || !hasValidatedAt) {
      await knex.schema.alterTable('vulnerabilities', table => {
        if (!hasValidationStatus) {
          table.enu('validation_status', ['pending', 'approved', 'rejected']).defaultTo('pending');
          table.index(['validation_status']);
        }
        if (!hasValidationNotes) {
          table.text('validation_notes').nullable();
        }
        if (!hasValidatedBy) {
          table.integer('validated_by').unsigned().nullable();
          table.index(['validated_by']);
        }
        if (!hasValidatedAt) {
          table.timestamp('validated_at').nullable();
          table.index(['validated_at']);
        }
      });
    }
  }

  const hasResidentApplications = await knex.schema.hasTable('resident_applications');
  if (hasResidentApplications) {
    const hasRejectionReason = await knex.schema.hasColumn(
      'resident_applications',
      'rejection_reason'
    );
    const hasReviewedBy = await knex.schema.hasColumn('resident_applications', 'reviewed_by');
    const hasReviewedAt = await knex.schema.hasColumn('resident_applications', 'reviewed_at');

    if (!hasRejectionReason || !hasReviewedBy || !hasReviewedAt) {
      await knex.schema.alterTable('resident_applications', table => {
        if (!hasRejectionReason) {
          table.text('rejection_reason').nullable();
        }
        if (!hasReviewedBy) {
          table.integer('reviewed_by').unsigned().nullable();
          table.index(['reviewed_by']);
        }
        if (!hasReviewedAt) {
          table.timestamp('reviewed_at').nullable();
          table.index(['reviewed_at']);
        }
      });
    }
  }
};

exports.down = async function down(knex) {
  const hasVulnerabilities = await knex.schema.hasTable('vulnerabilities');
  if (hasVulnerabilities) {
    const hasValidationStatus = await knex.schema.hasColumn('vulnerabilities', 'validation_status');
    const hasValidationNotes = await knex.schema.hasColumn('vulnerabilities', 'validation_notes');
    const hasValidatedBy = await knex.schema.hasColumn('vulnerabilities', 'validated_by');
    const hasValidatedAt = await knex.schema.hasColumn('vulnerabilities', 'validated_at');

    if (hasValidationStatus || hasValidationNotes || hasValidatedBy || hasValidatedAt) {
      await knex.schema.alterTable('vulnerabilities', table => {
        if (hasValidationStatus) table.dropColumn('validation_status');
        if (hasValidationNotes) table.dropColumn('validation_notes');
        if (hasValidatedBy) table.dropColumn('validated_by');
        if (hasValidatedAt) table.dropColumn('validated_at');
      });
    }
  }

  const hasResidentApplications = await knex.schema.hasTable('resident_applications');
  if (hasResidentApplications) {
    const hasRejectionReason = await knex.schema.hasColumn(
      'resident_applications',
      'rejection_reason'
    );
    const hasReviewedBy = await knex.schema.hasColumn('resident_applications', 'reviewed_by');
    const hasReviewedAt = await knex.schema.hasColumn('resident_applications', 'reviewed_at');

    if (hasRejectionReason || hasReviewedBy || hasReviewedAt) {
      await knex.schema.alterTable('resident_applications', table => {
        if (hasRejectionReason) table.dropColumn('rejection_reason');
        if (hasReviewedBy) table.dropColumn('reviewed_by');
        if (hasReviewedAt) table.dropColumn('reviewed_at');
      });
    }
  }
};
