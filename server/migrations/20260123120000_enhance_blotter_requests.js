exports.up = async function (knex) {
  await knex.schema.alterTable('blotter_requests', function (table) {
    table.string('complainant_contact_method', 20).nullable();
    table.text('complainant_address').nullable();
    table.string('complainant_id_type', 50).nullable();
    table.string('complainant_id_number', 100).nullable();
    table.json('investigation_checklist').nullable();
    table.text('investigation_findings').nullable();
    table.timestamp('investigation_completed_at').nullable();
    table.string('rejection_reason_category', 50).nullable();
    table.boolean('allow_appeal').defaultTo(true);
    table.timestamp('appeal_requested_at').nullable();
    table.text('appeal_response').nullable();
  });

  const hasColumn = await knex.schema.hasColumn('blotter_requests', 'status');
  if (hasColumn) {
    const [rows] = await knex.raw(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'blotter_requests' 
      AND COLUMN_NAME = 'status'
    `);

    if (rows.length > 0) {
      const currentEnum = rows[0].COLUMN_TYPE;
      const existingStatuses = currentEnum.match(/'([^']+)'/g) || [];
      const existingValues = existingStatuses.map(s => s.replace(/'/g, ''));

      const newStatuses = ['awaiting_response', 'ready_for_decision', 'under_appeal'];
      const allStatuses = [...new Set([...existingValues, ...newStatuses])];

      await knex.raw(`
        ALTER TABLE blotter_requests 
        MODIFY COLUMN status ENUM(${allStatuses.map(s => `'${s}'`).join(', ')}) 
        NOT NULL DEFAULT 'pending_review'
      `);
    }
  }

  await knex.schema.alterTable('blotter_request_audits', function (table) {
    table.string('contact_method', 20).nullable();
    table.text('contact_notes').nullable();
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('blotter_requests', function (table) {
    table.dropColumn('complainant_contact_method');
    table.dropColumn('complainant_address');
    table.dropColumn('complainant_id_type');
    table.dropColumn('complainant_id_number');
    table.dropColumn('investigation_checklist');
    table.dropColumn('investigation_findings');
    table.dropColumn('investigation_completed_at');
    table.dropColumn('rejection_reason_category');
    table.dropColumn('allow_appeal');
    table.dropColumn('appeal_requested_at');
    table.dropColumn('appeal_response');
  });

  await knex.raw(`
    ALTER TABLE blotter_requests 
    MODIFY COLUMN status ENUM('pending_review', 'for_validation', 'approved', 'rejected') 
    NOT NULL DEFAULT 'pending_review'
  `);

  await knex.schema.alterTable('blotter_request_audits', function (table) {
    table.dropColumn('contact_method');
    table.dropColumn('contact_notes');
  });
};
