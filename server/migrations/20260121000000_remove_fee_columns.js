exports.up = async function (knex) {
  const hasFee = await knex.schema.hasColumn('certificate_types', 'fee');
  if (hasFee) {
    await knex.schema.alterTable('certificate_types', function (table) {
      table.dropColumn('fee');
    });
  }

  const hasCertLog = await knex.schema.hasTable('certificates_log');
  if (hasCertLog) {
    const hasFeeAmount = await knex.schema.hasColumn('certificates_log', 'fee_amount');
    if (hasFeeAmount) {
      await knex.schema.alterTable('certificates_log', function (table) {
        table.dropColumn('fee_amount');
      });
    }
    const hasFeePaid = await knex.schema.hasColumn('certificates_log', 'fee_paid');
    if (hasFeePaid) {
      await knex.schema.alterTable('certificates_log', function (table) {
        table.dropColumn('fee_paid');
      });
    }
  }
};

exports.down = function (knex) {
  return knex.schema
    .alterTable('certificate_types', function (table) {
      table.decimal('fee', 10, 2).defaultTo(0.0);
    })
    .then(() => {
      return knex.schema.alterTable('certificates_log', function (table) {
        table.decimal('fee_amount', 10, 2);
        table.decimal('fee_paid', 10, 2);
      });
    });
};
