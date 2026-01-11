
exports.up = function(knex) {
  return knex.schema.table('certificate_types', function(table) {
    table.string('code', 50).nullable();
  }).then(async () => {
    // 1. Update existing types
    await knex('certificate_types')
      .where('name', 'Barangay Clearance')
      .update({ code: 'barangay_clearance' });

    // 2. Insert missing types if they don't exist
    const missingTypes = [
      {
        name: 'Indigency Certificate',
        code: 'indigency_certificate',
        fee: 0.00,
        validity_days: 180,
        description: 'Certifies that the resident belongs to an indigent family.',
        purpose: 'Medical assistance, Scholarship, Legal assistance',
        when_needed: 'Applying for government aid',
        required_data: JSON.stringify(['Valid ID', 'Purpose'])
      },
      {
        name: 'Bonafide Certificate',
        code: 'bonafide_certificate',
        fee: 30.00,
        validity_days: 180,
        description: 'Certifies residency status in the barangay.',
        purpose: 'Proof of residency',
        when_needed: 'School requirement, Bank account opening',
        required_data: JSON.stringify(['Valid ID', 'Purpose'])
      }
    ];

    for (const type of missingTypes) {
      const exists = await knex('certificate_types').where('name', type.name).first();
      if (!exists) {
        await knex('certificate_types').insert(type);
      } else {
        await knex('certificate_types').where('name', type.name).update({ code: type.code });
      }
    }
  });
};

exports.down = function(knex) {
  return knex.schema.table('certificate_types', function(table) {
    table.dropColumn('code');
  });
};
