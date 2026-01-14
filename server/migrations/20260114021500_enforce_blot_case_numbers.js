function toDate(value) {
  const d = value instanceof Date ? value : new Date(value ?? Date.now());
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function pad4(value) {
  return String(value).padStart(4, '0');
}

function formatCaseNumber(year, monthPadded, seq) {
  return `BLOT-${year}-${monthPadded}-${pad4(seq)}`;
}

async function allocateSeq(trx, { year, month, monthPadded }) {
  const [rows] = await trx.raw(
    'SELECT next_seq FROM blotter_case_sequences WHERE year = ? AND month = ? FOR UPDATE',
    [year, month]
  );

  if (!rows.length) {
    const likePrefix = `BLOT-${year}-${monthPadded}-%`;
    const regex = `^BLOT-${year}-${monthPadded}-[0-9]{4}$`;
    const [maxRows] = await trx.raw(
      `
        SELECT MAX(CAST(RIGHT(Case_Number, 4) AS UNSIGNED)) as maxSeq
        FROM blotter
        WHERE Case_Number LIKE ? AND Case_Number REGEXP ?
      `,
      [likePrefix, regex]
    );
    const currentMax = Number(maxRows?.[0]?.maxSeq);
    const nextSeq = (Number.isFinite(currentMax) ? currentMax : 0) + 1;
    await trx.raw('INSERT INTO blotter_case_sequences (year, month, next_seq) VALUES (?, ?, ?)', [
      year,
      month,
      nextSeq,
    ]);
    return nextSeq;
  }

  const current = Number(rows[0].next_seq);
  const nextSeq = (Number.isFinite(current) ? current : 0) + 1;
  await trx.raw('UPDATE blotter_case_sequences SET next_seq = ? WHERE year = ? AND month = ?', [
    nextSeq,
    year,
    month,
  ]);
  return nextSeq;
}

exports.up = async function up(knex) {
  await knex.schema.createTable('blotter_case_sequences', function createTable(table) {
    table.integer('year').notNullable();
    table.integer('month').notNullable();
    table.integer('next_seq').notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.primary(['year', 'month']);
  });

  await knex.transaction(async (trx) => {
    const invalidRows = await trx('blotter')
      .select(['Case_Number', 'DateTime_Incident'])
      .whereRaw(
        "Case_Number IS NULL OR Case_Number NOT REGEXP '^BLOT-[0-9]{4}-[0-9]{2}-[0-9]{4}$'"
      );

    for (const row of invalidRows) {
      const oldCaseNumber = row.Case_Number;
      const incidentDate = toDate(row.DateTime_Incident);
      const year = incidentDate.getFullYear();
      const month = incidentDate.getMonth() + 1;
      const monthPadded = pad2(month);

      const seq = await allocateSeq(trx, { year, month, monthPadded });
      const newCaseNumber = formatCaseNumber(year, monthPadded, seq);

      await trx('blotter').where('Case_Number', oldCaseNumber).update({ Case_Number: newCaseNumber });
      try {
        await trx('blotter_participants')
          .where('blotter_id', oldCaseNumber)
          .update({ blotter_id: newCaseNumber });
      } catch (_) {
      }
    }
  });

  try {
    await knex.raw(
      "ALTER TABLE blotter ADD CONSTRAINT chk_blot_case_number CHECK (Case_Number REGEXP '^BLOT-[0-9]{4}-[0-9]{2}-[0-9]{4}$')"
    );
  } catch (_) {
  }
};

exports.down = async function down(knex) {
  try {
    await knex.raw('ALTER TABLE blotter DROP CHECK chk_blot_case_number');
  } catch (_) {
  }
  await knex.schema.dropTableIfExists('blotter_case_sequences');
};
