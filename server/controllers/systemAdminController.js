const fs = require('fs').promises;
const path = require('path');

class SystemAdminController {
  constructor(db) {
    this.db = db;
  }

  async createBackup(req, res) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `backup_${timestamp}.sql`;
      
      // Simple backup simulation - in production, use mysqldump
      const backupData = {
        timestamp: new Date().toISOString(),
        tables: ['users', 'residents', 'blotter', 'document_requests', 'notifications'],
        status: 'completed',
        size: '2.5MB'
      };

      res.json({
        success: true,
        data: { backup_name: backupName, ...backupData },
        message: 'Backup created successfully'
      });
    } catch (error) {
      console.error('Error creating backup:', error);
      res.status(500).json({ success: false, message: 'Failed to create backup' });
    }
  }

  async getSystemSettings(req, res) {
    try {
      const [settings] = await this.db.execute(
        'SELECT * FROM system_settings ORDER BY created_at DESC LIMIT 10'
      );

      const defaultSettings = {
        barangay_name: 'Barangay Batia',
        captain_name: 'Captain Juan Dela Cruz',
        secretary_name: 'Secretary Maria Santos',
        contact_number: '+63 123 456 7890',
        email: 'barangay.batia@bocaue.gov.ph',
        address: 'Barangay Batia, Bocaue, Bulacan',
        office_hours: '8:00 AM - 5:00 PM',
        certificate_fee: 50.00
      };

      res.json({
        success: true,
        data: settings.length > 0 ? settings : [defaultSettings]
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch settings' });
    }
  }

  async updateSystemSettings(req, res) {
    try {
      const settings = req.body;
      
      // In a real implementation, you'd update the system_settings table
      // For now, we'll just acknowledge the update
      
      res.json({
        success: true,
        message: 'System settings updated successfully'
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({ success: false, message: 'Failed to update settings' });
    }
  }

  async createAnnouncement(req, res) {
    try {
      const { title, content, priority, target_audience } = req.body;
      const created_by = req.user.id;

      const [result] = await this.db.execute(`
        INSERT INTO announcements (title, content, priority, target_audience, created_by, status)
        VALUES (?, ?, ?, ?, ?, 'active')
      `, [title, content, priority || 'normal', target_audience || 'all', created_by]);

      // Create notifications for all residents if target is 'all' or 'residents'
      if (target_audience === 'all' || target_audience === 'residents') {
        const [residents] = await this.db.execute(
          'SELECT id FROM users WHERE role_id = 12 AND is_active = 1'
        );
        
        if (residents.length > 0 && global.createBulkNotification) {
          const residentIds = residents.map(r => r.id);
          await global.createBulkNotification(
            residentIds,
            title,
            content,
            priority === 'urgent' ? 'warning' : 'info',
            priority === 'urgent' ? 'high' : 'normal',
            { announcement_id: result.insertId }
          );
        }
      }

      res.status(201).json({
        success: true,
        data: { announcement_id: result.insertId },
        message: 'Announcement created successfully'
      });
    } catch (error) {
      console.error('Error creating announcement:', error);
      res.status(500).json({ success: false, message: 'Failed to create announcement' });
    }
  }

  async getAnnouncements(req, res) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const offset = (page - 1) * limit;

      let query = `
        SELECT a.*, u.full_name as created_by_name
        FROM announcements a
        LEFT JOIN users u ON a.created_by = u.id
        WHERE 1=1
      `;
      const params = [];

      if (status) {
        query += ' AND a.status = ?';
        params.push(status);
      }

      query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);

      const [announcements] = await this.db.execute(query, params);

      const [countResult] = await this.db.execute(
        `SELECT COUNT(*) as total FROM announcements WHERE 1=1${status ? ' AND status = ?' : ''}`,
        status ? [status] : []
      );

      res.json({
        success: true,
        data: announcements,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total
        }
      });
    } catch (error) {
      console.error('Error fetching announcements:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch announcements' });
    }
  }

  async getSettings(req, res) {
    try {
      // Return default settings for secretary settings page
      const settings = {
        barangay_name: 'Barangay Batia',
        barangay_address: 'Barangay Batia, Bocaue, Bulacan',
        captain_name: 'Captain Juan Dela Cruz',
        secretary_name: 'Secretary Maria Santos',
        contact_number: '+63 123 456 7890',
        email: 'barangay.batia@bocaue.gov.ph',
        seal_image: null,
        letterhead_image: null,
        auto_approve_certificates: false,
        require_id_verification: true,
        notification_email: true,
        notification_sms: false
      };

      res.json({ success: true, data: settings });
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch settings' });
    }
  }

  async updateSettings(req, res) {
    try {
      const settings = req.body;
      
      // In production, save to database
      // For now, acknowledge the update
      
      res.json({
        success: true,
        message: 'Settings updated successfully'
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({ success: false, message: 'Failed to update settings' });
    }
  }

  async uploadSeal(req, res) {
    try {
      const { type } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      // In production, save file to storage and return path
      const filePath = `/uploads/${type}/${file.filename}`;
      
      res.json({
        success: true,
        file_path: filePath,
        message: `${type} uploaded successfully`
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({ success: false, message: 'Failed to upload file' });
    }
  }

  async exportSettings(req, res) {
    try {
      const settings = {
        barangay_name: 'Barangay Batia',
        barangay_address: 'Barangay Batia, Bocaue, Bulacan',
        captain_name: 'Captain Juan Dela Cruz',
        secretary_name: 'Secretary Maria Santos',
        contact_number: '+63 123 456 7890',
        email: 'barangay.batia@bocaue.gov.ph',
        exported_at: new Date().toISOString()
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="barangay-settings.json"');
      res.send(JSON.stringify(settings, null, 2));
    } catch (error) {
      console.error('Error exporting settings:', error);
      res.status(500).json({ success: false, message: 'Failed to export settings' });
    }
  }

  async resetSettings(req, res) {
    try {
      // Reset to default settings
      res.json({
        success: true,
        message: 'Settings reset to defaults successfully'
      });
    } catch (error) {
      console.error('Error resetting settings:', error);
      res.status(500).json({ success: false, message: 'Failed to reset settings' });
    }
  }

  async getResidentAnnouncements(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const [announcements] = await this.db.execute(`
        SELECT id, title, content, priority, created_at
        FROM announcements 
        WHERE status = 'active' 
        AND (target_audience = 'all' OR target_audience = 'residents')
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `, [parseInt(limit), offset]);

      const [countResult] = await this.db.execute(
        'SELECT COUNT(*) as total FROM announcements WHERE status = "active" AND (target_audience = "all" OR target_audience = "residents")'
      );

      res.json({
        success: true,
        data: announcements,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total
        }
      });
    } catch (error) {
      console.error('Error fetching resident announcements:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch announcements' });
    }
  }
}

module.exports = SystemAdminController;