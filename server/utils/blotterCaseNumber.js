function pad2(value) {
  return String(value).padStart(2, '0');
}

function pad4(value) {
  return String(value).padStart(4, '0');
}

function getYearMonth(dateInput) {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput ?? Date.now());
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return { year, month, monthPadded: pad2(month) };
}

function formatCaseNumber(year, monthPadded, seq) {
  return `BLOT-${year}-${monthPadded}-${pad4(seq)}`;
}

function isValidBlotCaseNumber(caseNumber) {
  return typeof caseNumber === 'string' && /^BLOT-\d{4}-\d{2}-\d{4}$/.test(caseNumber);
}

async function getMaxExistingSequence(connection, year, monthPadded) {
  const likePrefix = `BLOT-${year}-${monthPadded}-%`;
  const regex = `^BLOT-${year}-${monthPadded}-[0-9]{4}$`;
  const [rows] = await connection.execute(
    `
      SELECT MAX(CAST(RIGHT(Case_Number, 4) AS UNSIGNED)) as maxSeq
      FROM blotter
      WHERE Case_Number LIKE ? AND Case_Number REGEXP ?
    `,
    [likePrefix, regex]
  );
  const maxSeq = Number(rows?.[0]?.maxSeq);
  return Number.isFinite(maxSeq) ? maxSeq : 0;
}

async function allocateBlotterCaseNumber(db, { incidentDate } = {}) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { year, month, monthPadded } = getYearMonth(incidentDate);

    const [rows] = await connection.execute(
      'SELECT next_seq FROM blotter_case_sequences WHERE year = ? AND month = ? FOR UPDATE',
      [year, month]
    );

    let nextSeq;
    if (!rows.length) {
      const maxExisting = await getMaxExistingSequence(connection, year, monthPadded);
      nextSeq = maxExisting + 1;
      await connection.execute(
        'INSERT INTO blotter_case_sequences (year, month, next_seq) VALUES (?, ?, ?)',
        [year, month, nextSeq]
      );
    } else {
      const current = Number(rows[0].next_seq);
      nextSeq = (Number.isFinite(current) ? current : 0) + 1;
      await connection.execute(
        'UPDATE blotter_case_sequences SET next_seq = ? WHERE year = ? AND month = ?',
        [nextSeq, year, month]
      );
    }

    const caseNumber = formatCaseNumber(year, monthPadded, nextSeq);
    await connection.commit();
    return caseNumber;
  } catch (err) {
    try {
      await connection.rollback();
    } catch (_) {}
    throw err;
  } finally {
    connection.release();
  }
}

module.exports = {
  allocateBlotterCaseNumber,
  formatCaseNumber,
  getYearMonth,
  isValidBlotCaseNumber,
};
