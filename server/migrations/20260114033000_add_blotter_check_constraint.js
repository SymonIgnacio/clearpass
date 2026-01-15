exports.up = async function(knex) {
  // Add CHECK constraint for Case_Number format
  // MySQL 8.0.16+ supports CHECK constraints
  // Pattern: BLOT-YYYY-MM-NNNN
  // Note: We use \\d for digits in regex inside string
  await knex.raw(`
    ALTER TABLE blotter 
    ADD CONSTRAINT chk_blotter_case_number_format 
    CHECK (Case_Number REGEXP '^BLOT-[0-9]{4}-[0-9]{2}-[0-9]{4}$')
  `);
};

exports.down = async function(knex) {
  await knex.raw(`
    ALTER TABLE blotter 
    DROP CONSTRAINT chk_blotter_case_number_format
  `);
};
