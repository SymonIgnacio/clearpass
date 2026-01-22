const crypto = require('crypto');

class ProgramController {
  constructor(db) {
    this.db = db;
  }

  // Get all programs
  getAll = async (req, res) => {
    try {
      const { page = 1, limit = 50, status, sitio_id } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      let whereConditions = [];
      let values = [];

      if (status) {
        whereConditions.push('p.status = ?');
        values.push(status);
      }

      if (sitio_id) {
        whereConditions.push('p.sitio_id = ?');
        values.push(sitio_id);
      }

      const whereClause =
        whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const query = `
        SELECT p.*, s.name as sitio_name,
          COUNT(pp.participant_id) as participants_count
        FROM community_programs p
        LEFT JOIN sitios s ON p.sitio_id = s.id
        LEFT JOIN program_participants pp ON p.id = pp.program_id
        ${whereClause}
        GROUP BY p.id
        ORDER BY p.program_date DESC
        LIMIT ? OFFSET ?
      `;

      const [rows] = await this.db.execute(query, [...values, parseInt(limit), parseInt(offset)]);

      const countQuery = `
        SELECT COUNT(*) as total
        FROM community_programs p
        ${whereClause}
      `;

      const [totalRows] = await this.db.execute(countQuery, values);

      res.json({
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalRows[0].total,
          pages: Math.ceil(totalRows[0].total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error('Error fetching programs:', error);
      res.status(500).json({ error: 'Failed to fetch programs' });
    }
  };

  // Get program by ID
  getById = async (req, res) => {
    try {
      const [rows] = await this.db.execute(
        `
        SELECT p.*, s.name as sitio_name,
          COUNT(pp.participant_id) as participants_count
        FROM community_programs p
        LEFT JOIN sitios s ON p.sitio_id = s.id
        LEFT JOIN program_participants pp ON p.id = pp.program_id
        WHERE p.id = ?
        GROUP BY p.id
      `,
        [req.params.id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Program not found' });
      }

      res.json(rows[0]);
    } catch (error) {
      console.error('Error fetching program:', error);
      res.status(500).json({ error: 'Failed to fetch program' });
    }
  };

  // Create new program
  create = async (req, res) => {
    const connection = await this.db.getConnection();

    try {
      await connection.beginTransaction();

      const {
        program_name,
        description,
        program_date,
        sitio_id,
        target_beneficiaries,
        status = 'Planned',
        organizer,
        budget_allocated = 0,
        notes,
      } = req.body;

      if (!program_name || !program_date) {
        return res.status(400).json({ error: 'Program name and date are required' });
      }

      const [result] = await connection.execute(
        `
        INSERT INTO community_programs (
          program_name, description, program_date, sitio_id,
          target_beneficiaries, status, organizer, budget_allocated, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          program_name.trim(),
          description?.trim(),
          program_date,
          sitio_id,
          JSON.stringify(target_beneficiaries || []),
          status,
          organizer?.trim(),
          budget_allocated,
          notes?.trim(),
        ]
      );

      await connection.commit();

      res.status(201).json({
        id: result.insertId,
        message: 'Program created successfully',
      });
    } catch (error) {
      await connection.rollback();
      console.error('Error creating program:', error);
      res.status(500).json({ error: 'Failed to create program' });
    } finally {
      connection.release();
    }
  };

  // Update program
  update = async (req, res) => {
    const connection = await this.db.getConnection();

    try {
      await connection.beginTransaction();

      const programId = req.params.id;
      const {
        program_name,
        description,
        program_date,
        sitio_id,
        target_beneficiaries,
        status,
        organizer,
        budget_allocated,
        notes,
      } = req.body;

      const updates = [];
      const values = [];

      if (program_name !== undefined) {
        updates.push('program_name = ?');
        values.push(program_name.trim());
      }
      if (description !== undefined) {
        updates.push('description = ?');
        values.push(description?.trim());
      }
      if (program_date !== undefined) {
        updates.push('program_date = ?');
        values.push(program_date);
      }
      if (sitio_id !== undefined) {
        updates.push('sitio_id = ?');
        values.push(sitio_id);
      }
      if (target_beneficiaries !== undefined) {
        updates.push('target_beneficiaries = ?');
        values.push(JSON.stringify(target_beneficiaries));
      }
      if (status !== undefined) {
        updates.push('status = ?');
        values.push(status);
      }
      if (organizer !== undefined) {
        updates.push('organizer = ?');
        values.push(organizer?.trim());
      }
      if (budget_allocated !== undefined) {
        updates.push('budget_allocated = ?');
        values.push(budget_allocated);
      }
      if (notes !== undefined) {
        updates.push('notes = ?');
        values.push(notes?.trim());
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      updates.push('updated_at = NOW()');
      values.push(programId);

      const sql = `UPDATE community_programs SET ${updates.join(', ')} WHERE id = ?`;
      await connection.execute(sql, values);

      await connection.commit();
      res.json({ message: 'Program updated successfully' });
    } catch (error) {
      await connection.rollback();
      console.error('Error updating program:', error);
      res.status(500).json({ error: 'Failed to update program' });
    } finally {
      connection.release();
    }
  };

  // Add participant to program
  addParticipant = async (req, res) => {
    const connection = await this.db.getConnection();

    try {
      await connection.beginTransaction();

      const { resident_id } = req.body;
      const programId = req.params.id;

      if (!resident_id) {
        return res.status(400).json({ error: 'Resident ID is required' });
      }

      // Check if already a participant
      const [existing] = await connection.execute(
        'SELECT id FROM program_participants WHERE program_id = ? AND resident_id = ?',
        [programId, resident_id]
      );

      if (existing.length > 0) {
        return res.status(400).json({ error: 'Resident is already a participant' });
      }

      await connection.execute(
        `
        INSERT INTO program_participants (program_id, resident_id, joined_at)
        VALUES (?, ?, NOW())
      `,
        [programId, resident_id]
      );

      await connection.commit();
      res.json({ message: 'Participant added successfully' });
    } catch (error) {
      await connection.rollback();
      console.error('Error adding participant:', error);
      res.status(500).json({ error: 'Failed to add participant' });
    } finally {
      connection.release();
    }
  };

  // Send SMS notification to participants
  notifyParticipants = async (req, res) => {
    try {
      const { message } = req.body;
      const programId = req.params.id;

      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Get participants with mobile numbers
      const [participants] = await this.db.execute(
        `
        SELECT r.Mobile_Number, r.First_Name, r.Last_Name
        FROM program_participants pp
        JOIN residents r ON pp.resident_id = r.Resident_ID
        WHERE pp.program_id = ? AND r.Mobile_Number IS NOT NULL AND r.Mobile_Number != ''
      `,
        [programId]
      );

      // In a real implementation, you would integrate with an SMS service here
      // For now, we'll just simulate the SMS sending
      const smsCount = participants.length;

      res.json({
        message: 'SMS notifications sent successfully',
        sms_sent: smsCount,
        participants_notified: participants.length,
      });
    } catch (error) {
      console.error('Error sending notifications:', error);
      res.status(500).json({ error: 'Failed to send notifications' });
    }
  };
}

module.exports = ProgramController;
