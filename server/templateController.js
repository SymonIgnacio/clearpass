/**
 * Document Template Management Controller
 * Handles CRUD operations for document templates
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'barangay_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

class TemplateController {
  /**
   * Get all document templates
   */
  async getAllTemplates(req, res) {
    const connection = await mysql.createConnection(dbConfig);

    try {
      const { document_type, is_active } = req.query;

      let whereConditions = [];
      let values = [];

      if (document_type) {
        whereConditions.push('document_type = ?');
        values.push(document_type);
      }

      if (is_active !== undefined) {
        whereConditions.push('is_active = ?');
        values.push(is_active === 'true');
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const [templates] = await connection.execute(`
        SELECT id, template_name, document_type, template_content,
               file_data, file_encoding, is_active,
               created_by, updated_by, created_at, updated_at
        FROM document_templates
        ${whereClause}
        ORDER BY document_type, template_name
      `, values);

      // Parse template_content JSON for each template
      const parsedTemplates = templates.map(template => ({
        ...template,
        template_content: JSON.parse(template.template_content)
      }));

      res.json({
        success: true,
        data: parsedTemplates,
        count: parsedTemplates.length
      });

    } catch (error) {
      console.error('Error fetching templates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch templates',
        error: error.message
      });
    } finally {
      await connection.end();
    }
  }

  /**
   * Get a specific template by ID
   */
  async getTemplateById(req, res) {
    const connection = await mysql.createConnection(dbConfig);

    try {
      const { id } = req.params;

      const [templates] = await connection.execute(
        'SELECT * FROM document_templates WHERE id = ?',
        [id]
      );

      if (templates.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }

      const template = templates[0];

      // Parse template content
      const parsedTemplate = {
        ...template,
        template_content: JSON.parse(template.template_content)
      };

      res.json({
        success: true,
        data: parsedTemplate
      });

    } catch (error) {
      console.error('Error fetching template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch template',
        error: error.message
      });
    } finally {
      await connection.end();
    }
  }

  /**
   * Create a new template
   */
  async createTemplate(req, res) {
    const connection = await mysql.createConnection(dbConfig);

    try {
      const {
        template_name,
        document_type,
        template_content,
        is_active = true
      } = req.body;

      // Validate required fields
      if (!template_name || !document_type || !template_content) {
        return res.status(400).json({
          success: false,
          message: 'Template name, document type, and content are required'
        });
      }

      // Check if template name already exists
      const [existingTemplates] = await connection.execute(
        'SELECT id FROM document_templates WHERE template_name = ?',
        [template_name]
      );

      if (existingTemplates.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Template name already exists'
        });
      }

      // Validate template content is valid JSON
      let parsedContent;
      try {
        parsedContent = typeof template_content === 'string'
          ? JSON.parse(template_content)
          : template_content;
      } catch (jsonError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid template content JSON'
        });
      }

      const [result] = await connection.execute(`
        INSERT INTO document_templates (
          template_name, document_type, template_content, is_active,
          created_by, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        template_name,
        document_type,
        JSON.stringify(parsedContent),
        is_active,
        req.user?.id || null,
        req.user?.id || null
      ]);

      // Fetch the created template
      const [newTemplates] = await connection.execute(
        'SELECT * FROM document_templates WHERE id = ?',
        [result.insertId]
      );

      const newTemplate = newTemplates[0];
      const parsedTemplate = {
        ...newTemplate,
        template_content: JSON.parse(newTemplate.template_content)
      };

      res.status(201).json({
        success: true,
        message: 'Template created successfully',
        data: parsedTemplate
      });

    } catch (error) {
      console.error('Error creating template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create template',
        error: error.message
      });
    } finally {
      await connection.end();
    }
  }

  /**
   * Update an existing template
   */
  async updateTemplate(req, res) {
    const connection = await mysql.createConnection(dbConfig);

    try {
      const { id } = req.params;
      const {
        template_name,
        document_type,
        template_content,
        is_active
      } = req.body;

      // Check if template exists
      const [existingTemplates] = await connection.execute(
        'SELECT * FROM document_templates WHERE id = ?',
        [id]
      );

      if (existingTemplates.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }

      const existingTemplate = existingTemplates[0];

      // Check if new template name conflicts with existing ones (excluding current)
      if (template_name && template_name !== existingTemplate.template_name) {
        const [nameConflicts] = await connection.execute(
          'SELECT id FROM document_templates WHERE template_name = ? AND id != ?',
          [template_name, id]
        );

        if (nameConflicts.length > 0) {
          return res.status(409).json({
            success: false,
            message: 'Template name already exists'
          });
        }
      }

      // Prepare update data
      const updateFields = [];
      const values = [];

      if (template_name !== undefined) {
        updateFields.push('template_name = ?');
        values.push(template_name);
      }
      if (document_type !== undefined) {
        updateFields.push('document_type = ?');
        values.push(document_type);
      }
      if (is_active !== undefined) {
        updateFields.push('is_active = ?');
        values.push(is_active);
      }

      // Handle template content
      if (template_content !== undefined) {
        try {
          const parsedContent = typeof template_content === 'string'
            ? JSON.parse(template_content)
            : template_content;
          updateFields.push('template_content = ?');
          values.push(JSON.stringify(parsedContent));
        } catch (jsonError) {
          return res.status(400).json({
            success: false,
            message: 'Invalid template content JSON'
          });
        }
      }

      updateFields.push('updated_by = ?');
      values.push(req.user?.id || null);
      values.push(id);

      const sql = `UPDATE document_templates SET ${updateFields.join(', ')} WHERE id = ?`;

      await connection.execute(sql, values);

      // Fetch updated template
      const [updatedTemplates] = await connection.execute(
        'SELECT * FROM document_templates WHERE id = ?',
        [id]
      );

      const updatedTemplate = updatedTemplates[0];
      const parsedTemplate = {
        ...updatedTemplate,
        template_content: JSON.parse(updatedTemplate.template_content)
      };

      res.json({
        success: true,
        message: 'Template updated successfully',
        data: parsedTemplate
      });

    } catch (error) {
      console.error('Error updating template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update template',
        error: error.message
      });
    } finally {
      await connection.end();
    }
  }

  /**
   * Delete a template
   */
  async deleteTemplate(req, res) {
    const connection = await mysql.createConnection(dbConfig);

    try {
      const { id } = req.params;

      // Check if template exists
      const [templates] = await connection.execute(
        'SELECT * FROM document_templates WHERE id = ?',
        [id]
      );

      if (templates.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }

      const template = templates[0];

      // Prevent deletion of default templates
      if (template.template_name.startsWith('Default ')) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete default templates'
        });
      }

      // Delete the template
      await connection.execute('DELETE FROM document_templates WHERE id = ?', [id]);

      res.json({
        success: true,
        message: 'Template deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete template',
        error: error.message
      });
    } finally {
      await connection.end();
    }
  }

  /**
   * Get active template for a document type
   */
  async getActiveTemplate(req, res) {
    const connection = await mysql.createConnection(dbConfig);

    try {
      const { document_type } = req.params;

      const [templates] = await connection.execute(`
        SELECT * FROM document_templates
        WHERE document_type = ? AND is_active = true
        ORDER BY updated_at DESC
        LIMIT 1
      `, [document_type]);

      if (templates.length === 0) {
        return res.status(404).json({
          success: false,
          message: `No active template found for document type: ${document_type}`
        });
      }

      const template = templates[0];
      const parsedTemplate = {
        ...template,
        template_content: JSON.parse(template.template_content)
      };

      res.json({
        success: true,
        data: parsedTemplate
      });

    } catch (error) {
      console.error('Error fetching active template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch active template',
        error: error.message
      });
    } finally {
      await connection.end();
    }
  }

  /**
   * Duplicate an existing template
   */
  async duplicateTemplate(req, res) {
    const connection = await mysql.createConnection(dbConfig);

    try {
      const { id } = req.params;
      const { new_template_name } = req.body;

      if (!new_template_name) {
        return res.status(400).json({
          success: false,
          message: 'New template name is required'
        });
      }

      // Get the original template
      const [originalTemplates] = await connection.execute(
        'SELECT * FROM document_templates WHERE id = ?',
        [id]
      );

      if (originalTemplates.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Original template not found'
        });
      }

      const originalTemplate = originalTemplates[0];

      // Check if new name already exists
      const [existingNames] = await connection.execute(
        'SELECT id FROM document_templates WHERE template_name = ?',
        [new_template_name]
      );

      if (existingNames.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Template name already exists'
        });
      }

      // Create duplicate
      const [result] = await connection.execute(`
        INSERT INTO document_templates (
          template_name, document_type, template_content, is_active,
          created_by, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        new_template_name,
        originalTemplate.document_type,
        originalTemplate.template_content,
        false, // Start as inactive
        req.user?.id || null,
        req.user?.id || null
      ]);

      // Fetch the new template
      const [newTemplates] = await connection.execute(
        'SELECT * FROM document_templates WHERE id = ?',
        [result.insertId]
      );

      const newTemplate = newTemplates[0];
      const parsedTemplate = {
        ...newTemplate,
        template_content: JSON.parse(newTemplate.template_content)
      };

      res.status(201).json({
        success: true,
        message: 'Template duplicated successfully',
        data: parsedTemplate
      });

    } catch (error) {
      console.error('Error duplicating template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to duplicate template',
        error: error.message
      });
    } finally {
      await connection.end();
    }
  }

  /**
   * Upload a template file (stored in database)
   */
  async uploadTemplateFile(req, res) {
    console.log('=== UPLOAD TEMPLATE FILE STARTED ===');
    console.log('Request body:', { template_name: req.body?.template_name, document_type: req.body?.document_type });
    console.log('File received:', req.file ? `${req.file.originalname} (${req.file.size} bytes, ${req.file.mimetype})` : 'NO FILE');

    const connection = await mysql.createConnection(dbConfig);

    try {
      if (!req.file) {
        console.log('ERROR: No file in request');
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const { template_name, document_type } = req.body;

      if (!template_name || !document_type) {
        console.log('ERROR: Missing required fields');
        return res.status(400).json({
          success: false,
          message: 'Template name and document type are required'
        });
      }

      console.log('✅ Required fields validated');

      // Check if template name already exists
      console.log('Checking for duplicate template name...');
      const [existingTemplates] = await connection.execute(
        'SELECT id FROM document_templates WHERE template_name = ?',
        [template_name]
      );

      if (existingTemplates.length > 0) {
        console.log('ERROR: Template name already exists');
        return res.status(409).json({
          success: false,
          message: 'Template name already exists'
        });
      }

      console.log('✅ Template name is unique');

      // File data is already in buffer from multer memory storage
      const fileData = req.file.buffer;
      console.log('File buffer size:', fileData?.length || 0);

      // Create template record in database with file stored as BLOB
      const templateContent = JSON.stringify({
        title: template_name,
        header_text: 'Uploaded Template',
        main_content: 'This template was uploaded as a file.',
        footer_text: 'Generated from uploaded file',
        location: 'Barangay Batia, Bocaue, Bulacan',
        show_qr_code: true,
        show_control_number: true,
        font_family: 'Times-Roman',
        font_size: 12
      });

      console.log('Template content JSON created');

      console.log('Inserting into database...');
      const [result] = await connection.execute(`
        INSERT INTO document_templates (
          template_name, document_type, template_content,
          file_data, file_encoding, is_active, created_by, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        template_name,
        document_type,
        templateContent,
        fileData,           // Store file as BLOB
        'buffer',          // Encoding type
        true,
        req.user?.id || null,
        req.user?.id || null
      ]);

      console.log('✅ Database insert successful, ID:', result.insertId);

      // Fetch the created template
      const [newTemplates] = await connection.execute(
        'SELECT * FROM document_templates WHERE id = ?',
        [result.insertId]
      );

      const newTemplate = newTemplates[0];
      const parsedTemplate = {
        ...newTemplate,
        template_content: JSON.parse(newTemplate.template_content)
      };

      console.log('✅ Template upload completed successfully');

      res.status(201).json({
        success: true,
        message: 'Template file uploaded and stored in database successfully',
        data: parsedTemplate
      });

    } catch (error) {
      console.error('❌ Error uploading template file:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);

      // Clean up uploaded file on error (though not needed for memory storage)
      if (req.file && req.file.path) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('❌ Error cleaning up failed upload:', unlinkError);
        }
      }

      res.status(500).json({
        success: false,
        message: 'Failed to upload template file',
        error: error.message
      });
    } finally {
      await connection.end();
      console.log('=== UPLOAD TEMPLATE FILE FINISHED ===');
    }
  }

  /**
   * Delete a template and its file
   */
  async deleteTemplateWithFile(req, res) {
    const connection = await mysql.createConnection(dbConfig);

    try {
      const { id } = req.params;

      // Check if template exists
      const [templates] = await connection.execute(
        'SELECT * FROM document_templates WHERE id = ?',
        [id]
      );

      if (templates.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }

      const template = templates[0];

      // Prevent deletion of default templates
      if (template.template_name.startsWith('Default ')) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete default templates'
        });
      }

      // Delete the file if it exists
      if (template.file_path) {
        try {
          const fullPath = path.join(__dirname, template.file_path);
          await fs.unlink(fullPath);
        } catch (fileError) {
          console.error('Error deleting template file:', fileError);
          // Continue with database deletion even if file deletion fails
        }
      }

      // Delete the template record
      await connection.execute('DELETE FROM document_templates WHERE id = ?', [id]);

      res.json({
        success: true,
        message: 'Template and file deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting template with file:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete template and file',
        error: error.message
      });
    } finally {
      await connection.end();
    }
  }

  /**
   * Download a template file (from database)
   */
  async downloadTemplateFile(req, res) {
    const connection = await mysql.createConnection(dbConfig);

    try {
      const { id } = req.params;

      const [templates] = await connection.execute(
        'SELECT * FROM document_templates WHERE id = ?',
        [id]
      );

      if (templates.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }

      const template = templates[0];

      // Check if file data exists in database
      if (!template.file_data) {
        return res.status(404).json({
          success: false,
          message: 'No file data associated with this template'
        });
      }

      // Set headers for file download
      const filename = `${template.template_name}.pdf`;
      const contentType = 'application/pdf';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', template.file_data.length);

      // Send the file buffer directly from database
      res.end(template.file_data);

    } catch (error) {
      console.error('Error downloading template file:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to download template file',
        error: error.message
      });
    } finally {
      await connection.end();
    }
  }

/**
 * Get certificate types for dropdown selection
 */
async getCertificateTypes(req, res) {
  const connection = await mysql.createConnection(dbConfig);

  try {
    const [certificateTypes] = await connection.execute(
      'SELECT id, name, fee, validity_days, purpose FROM certificate_types WHERE is_active = 1 ORDER BY name'
    );

    const formattedTypes = certificateTypes.map(type => ({
      id: type.id,
      value: type.name.toLowerCase().replace(/\s+/g, '_'), // Convert for backend use
      label: type.name
    }));

    res.json({
      success: true,
      data: formattedTypes
    });

  } catch (error) {
    console.error('Error fetching certificate types:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch certificate types',
      error: error.message
    });
  } finally {
    await connection.end();
  }
}

/**
 * Get template statistics
 */
  async getTemplateStats(req, res) {
    const connection = await mysql.createConnection(dbConfig);

    try {
      const [stats] = await connection.execute(`
        SELECT document_type, COUNT(id) as count
        FROM document_templates
        GROUP BY document_type
      `);

      const [totalRows] = await connection.execute(
        'SELECT COUNT(id) as total FROM document_templates'
      );

      const [activeRows] = await connection.execute(
        'SELECT COUNT(id) as active FROM document_templates WHERE is_active = true'
      );

      const totalCount = totalRows[0].total;
      const activeCount = activeRows[0].active;

      res.json({
        success: true,
        data: {
          by_type: stats,
          total: parseInt(totalCount),
          active: parseInt(activeCount),
          inactive: parseInt(totalCount) - parseInt(activeCount)
        }
      });

    } catch (error) {
      console.error('Error fetching template stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch template statistics',
        error: error.message
      });
    } finally {
      await connection.end();
    }
  }
}

module.exports = new TemplateController();
