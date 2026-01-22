const path = require('path');
const mysql = require('mysql2/promise');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const getConfig = () => {
  return {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'barangay_management',
    port: Number.parseInt(process.env.DB_PORT || '3306', 10),
  };
};

describe('Blotter Case ID Enforcement', () => {
  let conn;

  beforeAll(async () => {
    conn = await mysql.createConnection(getConfig());
  });

  afterAll(async () => {
    if (conn) await conn.end();
  });

  test('accepts valid BLOT-YYYY-MM-NNNN format', async () => {
    const validId = `BLOT-${new Date().getFullYear()}-01-9999`;

    // We need valid FKs for insertion, so pick a resident/sitio
    const [residents] = await conn.execute('SELECT Resident_ID FROM residents LIMIT 1');
    const [sitios] = await conn.execute('SELECT name FROM sitios LIMIT 1');

    if (residents.length === 0 || sitios.length === 0) {
      console.warn('Skipping test: No residents or sitios found');
      return;
    }

    const rId = residents[0].Resident_ID;
    const sitio = sitios[0].name;

    try {
      await conn.execute(
        `
        INSERT INTO blotter (
          Case_Number, Complainant_Details, Incident_Type, Narrative, 
          DateTime_Incident, Location_Sitio, Status, complainant_resident_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          validId,
          JSON.stringify({ name: 'Test', id: rId }),
          'Physical Injury',
          'Test Narrative',
          new Date(),
          sitio,
          'Pending',
          rId,
        ]
      );

      // If successful, clean up
      await conn.execute('DELETE FROM blotter WHERE Case_Number = ?', [validId]);
    } catch (e) {
      throw new Error(`Failed to insert valid ID: ${e.message}`);
    }
  });

  test('rejects invalid ID format (CASE-...)', async () => {
    const invalidId = 'CASE-2025-001';

    const [residents] = await conn.execute('SELECT Resident_ID FROM residents LIMIT 1');
    const [sitios] = await conn.execute('SELECT name FROM sitios LIMIT 1');

    if (residents.length === 0) return;

    const rId = residents[0].Resident_ID;
    const sitio = sitios[0].name;

    await expect(
      conn.execute(
        `
      INSERT INTO blotter (
        Case_Number, Complainant_Details, Incident_Type, Narrative, 
        DateTime_Incident, Location_Sitio, Status, complainant_resident_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
        [
          invalidId,
          JSON.stringify({ name: 'Test', id: rId }),
          'Physical Injury',
          'Test Narrative',
          new Date(),
          sitio,
          'Pending',
          rId,
        ]
      )
    ).rejects.toThrow(/constraint/i);
  });

  test('rejects invalid ID format (Bad pattern)', async () => {
    const invalidId = 'BLOT-2025-1-123'; // Missing padding

    const [residents] = await conn.execute('SELECT Resident_ID FROM residents LIMIT 1');
    const [sitios] = await conn.execute('SELECT name FROM sitios LIMIT 1');

    if (residents.length === 0) return;

    const rId = residents[0].Resident_ID;
    const sitio = sitios[0].name;

    await expect(
      conn.execute(
        `
      INSERT INTO blotter (
        Case_Number, Complainant_Details, Incident_Type, Narrative, 
        DateTime_Incident, Location_Sitio, Status, complainant_resident_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
        [
          invalidId,
          JSON.stringify({ name: 'Test', id: rId }),
          'Physical Injury',
          'Test Narrative',
          new Date(),
          sitio,
          'Pending',
          rId,
        ]
      )
    ).rejects.toThrow(/constraint/i);
  });
});
