const knex = require('knex')(require('../knexfile')[process.env.NODE_ENV || 'development']);
const PDFDocument = require('pdfkit');
const db = require('../database'); // Keeping raw db connection for compatibility if needed, but preferring knex

/**
 * Report Controller
 * Handles generation of PDF reports for Residents and Blotter cases
 */
class ReportController {
  
  /**
   * Generate Residents Master List PDF
   */
  async generateResidentsPDF(req, res) {
    try {
      const { search, sitio_id, residency_status, show_vulnerable, dateFrom, dateTo, gender } = req.query;

      // Build query using Knex for better safety and flexibility
      let query = knex('residents')
        .select(
          'residents.*',
          'households.Household_Number',
          'sitios.name as sitio_name',
          'vulnerabilities.Is_4Ps',
          'vulnerabilities.Is_PWD',
          'vulnerabilities.Is_Senior',
          'vulnerabilities.Is_Solo_Parent',
          'vulnerabilities.Is_Out_of_School_Youth'
        )
        .leftJoin('households', 'residents.Household_ID', 'households.Household_ID')
        .leftJoin('sitios', 'households.Sitio_ID', 'sitios.id')
        .leftJoin('vulnerabilities', 'residents.Resident_ID', 'vulnerabilities.Resident_ID')
        .orderBy('residents.Last_Name', 'asc');

      // Apply filters
      if (search) {
        query.where(builder => {
          builder.where('residents.First_Name', 'like', `%${search}%`)
            .orWhere('residents.Last_Name', 'like', `%${search}%`)
            .orWhere('residents.Middle_Name', 'like', `%${search}%`)
            .orWhere('households.Household_Number', 'like', `%${search}%`)
            .orWhere('sitios.name', 'like', `%${search}%`)
            .orWhere('residents.Occupation', 'like', `%${search}%`);
        });
      }

      if (sitio_id) {
        // Handle both ID and Name if possible, but usually ID is better. 
        // Frontend sends name sometimes based on previous code.
        // Let's assume name if it's a string, or join check.
        // The previous code in residents.js used 'sitio' param which was name.
        // Let's check if the query param is sitio or sitio_id. 
        // Frontend sends 'sitio' param with value 'sitioFilter' which is name.
        // But backend adminController used 'sitio_id' (routes.js line 990).
        // Let's support both or check what frontend sends.
        // Frontend sends `sitio=${sitioFilter}`.
        // So we should check req.query.sitio as well.
        const sitioVal = sitio_id || req.query.sitio;
        if (sitioVal) {
             query.where('sitios.name', sitioVal);
        }
      }

      if (residency_status || req.query.residencyFilter) {
        query.where('residents.Residency_Status', residency_status || req.query.residencyFilter);
      }

      if (gender) {
        query.where('residents.Gender', gender);
      }

      if (show_vulnerable === 'true' || req.query.vulnerability === 'vulnerable') {
        query.where(builder => {
          builder.where('vulnerabilities.Is_4Ps', 1)
            .orWhere('vulnerabilities.Is_PWD', 1)
            .orWhere('vulnerabilities.Is_Senior', 1)
            .orWhere('vulnerabilities.Is_Solo_Parent', 1)
            .orWhere('vulnerabilities.Is_Out_of_School_Youth', 1);
        });
      } else if (req.query.vulnerability) {
         // Specific vulnerability
         const v = req.query.vulnerability;
         if (v === 'senior') query.where('vulnerabilities.Is_Senior', 1);
         if (v === 'pwd') query.where('vulnerabilities.Is_PWD', 1);
         if (v === '4ps') query.where('vulnerabilities.Is_4Ps', 1);
         if (v === 'solo_parent') query.where('vulnerabilities.Is_Solo_Parent', 1);
         if (v === 'osy') query.where('vulnerabilities.Is_Out_of_School_Youth', 1);
      }

      if (dateFrom) {
        query.where('residents.Date_Arrival', '>=', dateFrom);
      }

      if (dateTo) {
        query.where('residents.Date_Arrival', '<=', `${dateTo} 23:59:59`);
      }

      const residents = await query;

      // Create PDF
      const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' }); // Landscape for tables

      // Set headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="residents_report_${new Date().toISOString().split('T')[0]}.pdf"`);

      doc.pipe(res);

      // Header
      this._generateHeader(doc, 'RESIDENTS MASTER LIST');

      // Filters Info
      doc.fontSize(10).font('Helvetica').text(`Generated on: ${new Date().toLocaleString()}`, 30, 130);
      let filterText = 'Filters: ';
      if (search) filterText += `Search: "${search}" | `;
      if (gender) filterText += `Gender: ${gender} | `;
      if (sitio_id || req.query.sitio) filterText += `Sitio: ${sitio_id || req.query.sitio} | `;
      if (residency_status) filterText += `Status: ${residency_status} | `;
      doc.text(filterText, 30, 145);
      doc.moveDown();

      // Table Headers
      const tableTop = 170;
      const headers = ['Name', 'Age', 'Gender', 'Sitio', 'Status', 'Vulnerabilities', 'Occupation'];
      const colWidths = [180, 40, 60, 100, 80, 150, 120];
      let xPos = 30;

      doc.font('Helvetica-Bold').fontSize(10);
      headers.forEach((header, i) => {
        doc.text(header, xPos, tableTop);
        xPos += colWidths[i];
      });

      // Draw line
      doc.moveTo(30, tableTop + 15).lineTo(800, tableTop + 15).stroke();

      // Table Rows
      let yPos = tableTop + 25;
      doc.font('Helvetica').fontSize(9);

      residents.forEach((resident, index) => {
        // Page break if needed
        if (yPos > 500) {
          doc.addPage({ layout: 'landscape', margin: 30 });
          this._generateHeader(doc, 'RESIDENTS MASTER LIST (Cont.)');
          yPos = 170;
          
          // Redraw headers
          let hX = 30;
          doc.font('Helvetica-Bold').fontSize(10);
          headers.forEach((header, i) => {
            doc.text(header, hX, yPos);
            hX += colWidths[i];
          });
          doc.moveTo(30, yPos + 15).lineTo(800, yPos + 15).stroke();
          yPos += 25;
          doc.font('Helvetica').fontSize(9);
        }

        // Prepare data
        const name = `${resident.Last_Name}, ${resident.First_Name} ${resident.Middle_Name || ''}`.trim();
        const age = resident.Birthdate ? 
          Math.floor((new Date() - new Date(resident.Birthdate)) / 31557600000) : 'N/A';
        
        let vulns = [];
        if (resident.Is_Senior) vulns.push('Senior');
        if (resident.Is_PWD) vulns.push('PWD');
        if (resident.Is_4Ps) vulns.push('4Ps');
        if (resident.Is_Solo_Parent) vulns.push('Solo Parent');
        
        // Draw row
        let rX = 30;
        doc.text(name, rX, yPos, { width: colWidths[0] - 5 }); rX += colWidths[0];
        doc.text(String(age), rX, yPos, { width: colWidths[1] - 5 }); rX += colWidths[1];
        doc.text(resident.Gender || '-', rX, yPos, { width: colWidths[2] - 5 }); rX += colWidths[2];
        doc.text(resident.sitio_name || '-', rX, yPos, { width: colWidths[3] - 5 }); rX += colWidths[3];
        doc.text(resident.Residency_Status || '-', rX, yPos, { width: colWidths[4] - 5 }); rX += colWidths[4];
        doc.text(vulns.join(', ') || '-', rX, yPos, { width: colWidths[5] - 5 }); rX += colWidths[5];
        doc.text(resident.Occupation || '-', rX, yPos, { width: colWidths[6] - 5 });

        yPos += 20;
      });

      // Footer stats
      doc.moveDown(2);
      doc.font('Helvetica-Bold').text(`Total Records: ${residents.length}`, 30);

      doc.end();

    } catch (error) {
      console.error('Error generating residents PDF:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to generate PDF report' });
      }
    }
  }

  /**
   * Generate Blotter Cases PDF
   */
  async generateBlotterPDF(req, res) {
    try {
      const { search, status, dateFrom, dateTo } = req.query;

      let query = knex('blotter')
        .select('blotter.*', 'sitios.name as sitio_name')
        .leftJoin('sitios', 'blotter.Location_Sitio', 'sitios.name') // Usually stored as name in blotter
        .orderBy('DateTime_Incident', 'desc');

      if (search) {
        query.where(builder => {
          builder.where('Case_Number', 'like', `%${search}%`)
            .orWhere('Incident_Type', 'like', `%${search}%`)
            .orWhere('Complainant_Details', 'like', `%${search}%`);
        });
      }

      if (status) {
        query.where('Status', status);
      }

      if (dateFrom) {
        query.where('DateTime_Incident', '>=', dateFrom);
      }

      if (dateTo) {
        query.where('DateTime_Incident', '<=', `${dateTo} 23:59:59`);
      }

      const cases = await query;

      // Create PDF
      const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="blotter_report_${new Date().toISOString().split('T')[0]}.pdf"`);

      doc.pipe(res);

      this._generateHeader(doc, 'BLOTTER CASES REPORT');

      // Filters Info
      doc.fontSize(10).font('Helvetica').text(`Generated on: ${new Date().toLocaleString()}`, 30, 130);
      let filterText = 'Filters: ';
      if (search) filterText += `Search: "${search}" | `;
      if (status) filterText += `Status: ${status} | `;
      doc.text(filterText, 30, 145);
      doc.moveDown();

      // Table Headers
      const tableTop = 170;
      const headers = ['Case #', 'Date', 'Type', 'Location', 'Status', 'Complainant', 'Respondent'];
      const colWidths = [100, 80, 100, 100, 80, 120, 120];
      let xPos = 30;

      doc.font('Helvetica-Bold').fontSize(10);
      headers.forEach((header, i) => {
        doc.text(header, xPos, tableTop);
        xPos += colWidths[i];
      });

      doc.moveTo(30, tableTop + 15).lineTo(800, tableTop + 15).stroke();

      let yPos = tableTop + 25;
      doc.font('Helvetica').fontSize(9);

      for (const incident of cases) {
         if (yPos > 500) {
          doc.addPage({ layout: 'landscape', margin: 30 });
          this._generateHeader(doc, 'BLOTTER CASES REPORT (Cont.)');
          yPos = 170;
          
          let hX = 30;
          doc.font('Helvetica-Bold').fontSize(10);
          headers.forEach((header, i) => {
            doc.text(header, hX, yPos);
            hX += colWidths[i];
          });
          doc.moveTo(30, yPos + 15).lineTo(800, yPos + 15).stroke();
          yPos += 25;
          doc.font('Helvetica').fontSize(9);
        }

        // Parse JSON details if needed, but assuming simple strings for report
        let complainant = 'N/A';
        try {
            let cObj = incident.Complainant_Details;
            if (typeof cObj === 'string') {
              try {
                cObj = JSON.parse(cObj);
                // Handle double stringification
                if (typeof cObj === 'string') {
                  cObj = JSON.parse(cObj);
                }
              } catch (e) {
                // If parse fails, it might be just a name string (though unlikely given the schema)
              }
            }
            complainant = (typeof cObj === 'object' && cObj !== null) ? (cObj.name || 'N/A') : (cObj || 'N/A');
        } catch (e) { complainant = incident.Complainant_Details || 'N/A'; }

        let respondent = 'N/A';
        try {
            let rObj = incident.Respondent_Details;
             if (typeof rObj === 'string') {
              try {
                rObj = JSON.parse(rObj);
                // Handle double stringification
                if (typeof rObj === 'string') {
                  rObj = JSON.parse(rObj);
                }
              } catch (e) {
                 // If parse fails
              }
            }
            respondent = (typeof rObj === 'object' && rObj !== null) ? (rObj.name || 'N/A') : (rObj || 'N/A');
        } catch (e) { respondent = incident.Respondent_Details || 'N/A'; }

        let dateStr = incident.DateTime_Incident ? new Date(incident.DateTime_Incident).toLocaleDateString() : '-';

        let rX = 30;
        doc.text(incident.Case_Number || '-', rX, yPos, { width: colWidths[0] - 5 }); rX += colWidths[0];
        doc.text(dateStr, rX, yPos, { width: colWidths[1] - 5 }); rX += colWidths[1];
        doc.text(incident.Incident_Type || '-', rX, yPos, { width: colWidths[2] - 5 }); rX += colWidths[2];
        doc.text(incident.Location_Sitio || '-', rX, yPos, { width: colWidths[3] - 5 }); rX += colWidths[3];
        doc.text(incident.Status || '-', rX, yPos, { width: colWidths[4] - 5 }); rX += colWidths[4];
        doc.text(complainant, rX, yPos, { width: colWidths[5] - 5, height: 15, ellipsis: true }); rX += colWidths[5];
        doc.text(respondent, rX, yPos, { width: colWidths[6] - 5, height: 15, ellipsis: true });

        yPos += 20;
      }

      doc.moveDown(2);
      doc.font('Helvetica-Bold').text(`Total Cases: ${cases.length}`, 30);

      doc.end();

    } catch (error) {
      console.error('Error generating blotter PDF:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to generate PDF report' });
      }
    }
  }

  /**
   * Helper to generate consistent header
   */
  _generateHeader(doc, title) {
    const pageWidth = doc.page.width;
    
    doc.fontSize(14).font('Helvetica-Bold');
    doc.text('REPUBLIC OF THE PHILIPPINES', 0, 50, { align: 'center', width: pageWidth });
    doc.text('PROVINCE OF BULACAN', 0, 70, { align: 'center', width: pageWidth });
    doc.text('MUNICIPALITY OF BOCAUE', 0, 90, { align: 'center', width: pageWidth });
    doc.text('BARANGAY BATIA', 0, 110, { align: 'center', width: pageWidth });

    doc.fontSize(18).text(title, 0, 140, { align: 'center', width: pageWidth });
  }
}

module.exports = new ReportController();
