"""
Resident Document Generator

A comprehensive PDF generation system for barangay documents with:
- 12+ document types for residents
- Two-phase workflow (request → approval → generation)
- Database integration for resident data
- Configurable validity periods
- QR code validation
- Audit trail support
"""

import os
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
import json
from io import BytesIO
from dataclasses import dataclass

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.graphics import renderPDF
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.lib.colors import black

# Built-in PDF Generator (extracted from removed pdf_generator.py)
@dataclass
class TemplateField:
    """Represents a field in a PDF template with its properties."""
    name: str
    x: float
    y: float
    width: float
    height: float
    font_name: str = 'Helvetica'
    font_size: int = 12
    alignment: str = 'left'  # left, center, right
    style: str = 'normal'   # normal, bold, italic


@dataclass
class PDFTemplate:
    """Represents a complete PDF template definition."""
    name: str
    page_size: tuple = A4
    fields: Dict[str, TemplateField] = None
    background_image: str = None
    title: str = ""

    def __post_init__(self):
        if self.fields is None:
            self.fields = {}


class PDFGeneratorError(Exception):
    """Base exception for PDF generation errors."""
    pass


class PDFGenerator:
    """
    A PDF generation class that creates documents from templates and dynamic data.

    Supports multiple document types with customizable layouts and styling.
    Uses ReportLab for robust PDF generation with dynamic content injection.
    """

    def __init__(self):
        """Initialize the PDF generator with default templates."""
        self.templates = self._load_default_templates()
        self._register_fonts()

    def _register_fonts(self):
        """Register custom fonts if available."""
        try:
            # Try to register a serif font for certificates
            pdfmetrics.registerFont(TTFont('Times-Roman', 'Times-Roman'))
            pdfmetrics.registerFont(TTFont('Times-Bold', 'Times-Bold'))
        except:
            # Fall back to built-in fonts if custom fonts not available
            pass

    def _load_default_templates(self) -> Dict[str, PDFTemplate]:
        """Load default template definitions."""
        templates = {}

        # Certificate of Completion Template
        cert_template = PDFTemplate(
            name='certificate_of_completion',
            page_size=A4,
            title='Certificate of Completion'
        )

        # Define fields for certificate
        cert_template.fields = {
            'title': TemplateField(
                name='title',
                x=2*inch, y=8*inch, width=5*inch, height=0.5*inch,
                font_name='Times-Bold', font_size=24, alignment='center'
            ),
            'recipient_name': TemplateField(
                name='recipient_name',
                x=2*inch, y=6.5*inch, width=5*inch, height=0.3*inch,
                font_name='Times-Bold', font_size=18, alignment='center'
            ),
            'subtitle': TemplateField(
                name='subtitle',
                x=2*inch, y=6*inch, width=5*inch, height=0.3*inch,
                font_name='Times-Roman', font_size=14, alignment='center'
            ),
            'course_title': TemplateField(
                name='course_title',
                x=2*inch, y=5.2*inch, width=5*inch, height=0.3*inch,
                font_name='Times-Bold', font_size=16, alignment='center'
            ),
            'completion_text': TemplateField(
                name='completion_text',
                x=2*inch, y=4.5*inch, width=5*inch, height=0.5*inch,
                font_name='Times-Roman', font_size=12, alignment='center'
            ),
            'date_issued': TemplateField(
                name='date_issued',
                x=2*inch, y=3.5*inch, width=5*inch, height=0.2*inch,
                font_name='Times-Roman', font_size=12, alignment='center'
            ),
            'certificate_id': TemplateField(
                name='certificate_id',
                x=2*inch, y=3*inch, width=5*inch, height=0.2*inch,
                font_name='Times-Roman', font_size=10, alignment='center'
            ),
            'signature_line': TemplateField(
                name='signature_line',
                x=2*inch, y=2*inch, width=5*inch, height=0.1*inch,
                font_name='Times-Roman', font_size=10, alignment='center'
            )
        }
        templates['certificate_of_completion'] = cert_template

        # Invoice Template
        invoice_template = PDFTemplate(
            name='invoice',
            page_size=A4,
            title='Invoice'
        )

        invoice_template.fields = {
            'invoice_number': TemplateField(
                name='invoice_number',
                x=1*inch, y=10*inch, width=2*inch, height=0.2*inch,
                font_name='Helvetica-Bold', font_size=12
            ),
            'date': TemplateField(
                name='date',
                x=5*inch, y=10*inch, width=2*inch, height=0.2*inch,
                font_name='Helvetica', font_size=12
            ),
            'bill_to': TemplateField(
                name='bill_to',
                x=1*inch, y=9*inch, width=3*inch, height=0.5*inch,
                font_name='Helvetica-Bold', font_size=12
            ),
            'customer_name': TemplateField(
                name='customer_name',
                x=1*inch, y=8.5*inch, width=3*inch, height=0.2*inch,
                font_name='Helvetica', font_size=12
            ),
            'total_amount': TemplateField(
                name='total_amount',
                x=5*inch, y=2*inch, width=2*inch, height=0.2*inch,
                font_name='Helvetica-Bold', font_size=14, alignment='right'
            )
        }
        templates['invoice'] = invoice_template

        return templates

    def add_template(self, template: PDFTemplate):
        """
        Add a custom template to the generator.

        Args:
            template: PDFTemplate instance to add
        """
        self.templates[template.name] = template

    def generate_pdf(self, template_name: str, data: Dict[str, Any]) -> BytesIO:
        """
        Generate a PDF document from a template and data.

        Args:
            template_name: Name of the template to use
            data: Dictionary containing data to inject into the template

        Returns:
            BytesIO object containing the generated PDF

        Raises:
            TemplateNotFoundError: If template_name is not found
            MissingDataError: If required fields are missing from data
        """
        if template_name not in self.templates:
            raise TemplateNotFoundError(f"Template '{template_name}' not found")

        template = self.templates[template_name]

        # Create PDF buffer
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=template.page_size)

        # Build the story (content elements)
        story = []

        # Add content based on template type
        if template_name == 'certificate_of_completion':
            # Validate required fields for certificate
            required_fields = {'recipient_name', 'course_title', 'date_issued', 'certificate_id'}
            provided_fields = set(data.keys())
            missing_fields = required_fields - provided_fields
            if missing_fields:
                raise MissingDataError(f"Missing required fields for certificate: {', '.join(missing_fields)}")
            story.extend(self._build_certificate_content(template, data))

        elif template_name == 'invoice':
            # Validate required fields for invoice
            required_fields = {'invoice_number', 'customer_name', 'total_amount'}
            provided_fields = set(data.keys())
            missing_fields = required_fields - provided_fields
            if missing_fields:
                raise MissingDataError(f"Missing required fields for invoice: {', '.join(missing_fields)}")
            story.extend(self._build_invoice_content(template, data))

        else:
            # Generic template rendering - validate all template fields
            required_fields = set(template.fields.keys())
            provided_fields = set(data.keys())
            missing_fields = required_fields - provided_fields
            if missing_fields:
                raise MissingDataError(f"Missing required fields: {', '.join(missing_fields)}")
            story.extend(self._build_generic_content(template, data))

        # Build the PDF
        doc.build(story)
        buffer.seek(0)

        return buffer

    def _build_certificate_content(self, template: PDFTemplate, data: Dict[str, Any]):
        """Build content elements for certificate template."""
        elements = []
        styles = getSampleStyleSheet()

        # Certificate title
        title_style = ParagraphStyle(
            'CertTitle',
            parent=styles['Title'],
            fontName='Times-Bold',
            fontSize=28,
            alignment=1,
            spaceAfter=20
        )
        elements.append(Paragraph(data.get('title', 'CERTIFICATE OF COMPLETION'), title_style))

        # Recipient name
        name_style = ParagraphStyle(
            'Name',
            parent=styles['Normal'],
            fontName='Times-Bold',
            fontSize=20,
            alignment=1,
            spaceAfter=15
        )
        elements.append(Paragraph(data.get('recipient_name', ''), name_style))

        # Subtitle
        subtitle_style = ParagraphStyle(
            'Subtitle',
            parent=styles['Normal'],
            fontName='Times-Roman',
            fontSize=16,
            alignment=1,
            spaceAfter=20
        )
        elements.append(Paragraph(data.get('subtitle', 'This certifies that'), subtitle_style))

        # Course/Program title
        course_style = ParagraphStyle(
            'Course',
            parent=styles['Normal'],
            fontName='Times-Bold',
            fontSize=18,
            alignment=1,
            spaceAfter=25
        )
        elements.append(Paragraph(data.get('course_title', ''), course_style))

        # Completion text
        completion_text = data.get('completion_text',
            'has successfully completed the requirements for the above-mentioned program.')
        completion_style = ParagraphStyle(
            'Completion',
            parent=styles['Normal'],
            fontName='Times-Roman',
            fontSize=12,
            alignment=1,
            spaceAfter=30
        )
        elements.append(Paragraph(completion_text, completion_style))

        # Date and ID
        date_style = ParagraphStyle(
            'Date',
            parent=styles['Normal'],
            fontName='Times-Roman',
            fontSize=12,
            alignment=1,
            spaceAfter=10
        )
        elements.append(Paragraph(f"Date Issued: {data.get('date_issued', '')}", date_style))

        id_style = ParagraphStyle(
            'ID',
            parent=styles['Normal'],
            fontName='Times-Roman',
            fontSize=10,
            alignment=1,
            spaceAfter=40
        )
        elements.append(Paragraph(f"Certificate ID: {data.get('certificate_id', '')}", id_style))

        # Signature line
        elements.append(Spacer(1, 1*inch))
        signature_style = ParagraphStyle(
            'Signature',
            parent=styles['Normal'],
            fontName='Times-Roman',
            fontSize=10,
            alignment=1
        )
        elements.append(Paragraph("_______________________________", signature_style))
        elements.append(Paragraph("Authorized Signature", signature_style))

        return elements

    def _build_invoice_content(self, template: PDFTemplate, data: Dict[str, Any]):
        """Build content elements for invoice template."""
        elements = []
        styles = getSampleStyleSheet()

        # Invoice header
        header_style = ParagraphStyle(
            'Header',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=20,
            spaceAfter=20
        )
        elements.append(Paragraph("INVOICE", header_style))

        # Invoice details
        details_data = [
            ['Invoice Number:', data.get('invoice_number', '')],
            ['Date:', data.get('date_issued', '')],
            ['Bill To:', data.get('bill_to', '')],
            ['Customer:', data.get('customer_name', '')]
        ]

        details_table = Table(details_data, colWidths=[2*inch, 4*inch])
        details_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        elements.append(details_table)
        elements.append(Spacer(1, 0.5*inch))

        # Items section (placeholder for now)
        if 'items' in data:
            items_data = [['Description', 'Quantity', 'Price', 'Total']]
            for item in data['items']:
                items_data.append([
                    item.get('description', ''),
                    str(item.get('quantity', '')),
                    f"${item.get('price', 0):.2f}",
                    f"${item.get('total', 0):.2f}"
                ])

            items_table = Table(items_data, colWidths=[3*inch, 1*inch, 1*inch, 1*inch])
            items_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ]))
            elements.append(items_table)
            elements.append(Spacer(1, 0.3*inch))

        # Total
        total_style = ParagraphStyle(
            'Total',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=14,
            alignment=2,  # right
        )
        elements.append(Paragraph(f"Total: ${data.get('total_amount', '0.00')}", total_style))

        return elements

    def _build_generic_content(self, template: PDFTemplate, data: Dict[str, Any]):
        """Build generic content for custom templates."""
        elements = []
        styles = getSampleStyleSheet()

        for field_name, field in template.fields.items():
            if field_name in data:
                style = ParagraphStyle(
                    f'Field_{field_name}',
                    parent=styles['Normal'],
                    fontName=field.font_name,
                    fontSize=field.font_size,
                    alignment={'left': 0, 'center': 1, 'right': 2}.get(field.alignment, 0)
                )
                elements.append(Paragraph(str(data[field_name]), style))
                elements.append(Spacer(1, 0.1*inch))

        return elements

    def save_pdf(self, pdf_buffer: BytesIO, filename: str):
        """
        Save a PDF buffer to a file.

        Args:
            pdf_buffer: BytesIO buffer containing PDF data
            filename: Output filename
        """
        with open(filename, 'wb') as f:
            f.write(pdf_buffer.getvalue())


class ResidentDocumentError(PDFGeneratorError):
    """Base exception for resident document errors."""
    pass


class DocumentNotFoundError(ResidentDocumentError):
    """Raised when a document type is not found."""
    pass


class InvalidRequestError(ResidentDocumentError):
    """Raised when document request data is invalid."""
    pass


class DocumentRequest:
    """Represents a document request with all necessary data."""

    def __init__(self, request_id: str = None):
        self.request_id = request_id or str(uuid.uuid4())
        self.resident_id = None
        self.document_type = None
        self.status = 'pending'  # pending, approved, rejected, completed
        self.request_data = {}  # User input data
        self.resident_data = {}  # Auto-filled from database
        self.approval_data = {}  # Approval details
        self.created_at = datetime.now()
        self.updated_at = datetime.now()
        self.approved_at = None
        self.approved_by = None
        self.valid_until = None
        self.qr_code = None
        self.control_number = None

    def to_dict(self):
        """Convert request to dictionary for database storage."""
        return {
            'request_id': self.request_id,
            'resident_id': self.resident_id,
            'document_type': self.document_type,
            'status': self.status,
            'request_data': json.dumps(self.request_data),
            'resident_data': json.dumps(self.resident_data),
            'approval_data': json.dumps(self.approval_data),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'approved_by': self.approved_by,
            'valid_until': self.valid_until.isoformat() if self.valid_until else None,
            'qr_code': self.qr_code,
            'control_number': self.control_number
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'DocumentRequest':
        """Create request from dictionary data."""
        request = cls(data['request_id'])
        request.resident_id = data['resident_id']
        request.document_type = data['document_type']
        request.status = data['status']
        request.request_data = json.loads(data['request_data'] or '{}')
        request.resident_data = json.loads(data['resident_data'] or '{}')
        request.approval_data = json.loads(data['approval_data'] or '{}')
        request.created_at = datetime.fromisoformat(data['created_at'])
        request.updated_at = datetime.fromisoformat(data['updated_at'])
        request.approved_at = datetime.fromisoformat(data['approved_at']) if data['approved_at'] else None
        request.approved_by = data['approved_by']
        request.valid_until = datetime.fromisoformat(data['valid_until']) if data['valid_until'] else None
        request.qr_code = data['qr_code']
        request.control_number = data['control_number']
        return request


class ResidentDocumentGenerator(PDFGenerator):
    """
    Enhanced PDF generator specifically for barangay resident documents.

    Supports 12+ document types with resident data integration and approval workflow.
    Uses custom templates from database for flexible document customization.
    """

    def __init__(self, db_connection=None):
        super().__init__()
        self.db_connection = db_connection
        self.templates_cache = {}  # Cache for loaded templates
        self._load_resident_templates()
        self._register_custom_fonts()

    def _register_custom_fonts(self):
        """Register custom fonts for official documents."""
        try:
            # Try to register serif fonts for official documents
            pdfmetrics.registerFont(TTFont('Times-Roman', 'Times-Roman'))
            pdfmetrics.registerFont(TTFont('Times-Bold', 'Times-Bold'))
            pdfmetrics.registerFont(TTFont('Times-Italic', 'Times-Italic'))
        except:
            pass  # Fall back to built-in fonts

    def _load_resident_templates(self):
        """Load templates specific to resident documents."""
        # Template definitions are handled in individual builder methods
        pass

    def get_template_from_db(self, document_type):
        """
        Fetch active template for a document type from database.

        Args:
            document_type: Type of document (e.g., 'barangay_clearance')

        Returns:
            Template configuration dictionary or None if not found
        """
        if not self.db_connection:
            return None

        try:
            # Check cache first
            cache_key = f"{document_type}_active"
            if cache_key in self.templates_cache:
                return self.templates_cache[cache_key]

            # Query database for active template
            query = """
                SELECT template_content
                FROM document_templates
                WHERE document_type = ? AND is_active = TRUE
                ORDER BY updated_at DESC
                LIMIT 1
            """

            cursor = self.db_connection.cursor()
            cursor.execute(query, (document_type,))
            result = cursor.fetchone()

            if result:
                template_content = json.loads(result[0])
                # Cache the result
                self.templates_cache[cache_key] = template_content
                return template_content

        except Exception as e:
            print(f"Error fetching template from database: {e}")
            return None

        return None

    def clear_template_cache(self):
        """Clear the template cache to force reload from database."""
        self.templates_cache = {}

    def _generate_from_custom_template(self, request: DocumentRequest, template_config: dict) -> BytesIO:
        """
        Generate PDF document using custom template configuration.

        Args:
            request: Document request with all data
            template_config: Custom template configuration from database

        Returns:
            BytesIO buffer containing the generated PDF
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        story = []

        styles = getSampleStyleSheet()

        # Prepare template variables for substitution
        template_vars = self._prepare_template_variables(request)

        # Apply custom font settings
        font_family = template_config.get('font_family', 'Times-Roman')
        font_size = template_config.get('font_size', 12)

        # Generate content sections
        sections = [
            ('title', template_config.get('title', '')),
            ('header_text', template_config.get('header_text', '')),
            ('main_content', template_config.get('main_content', '')),
            ('additional_content', template_config.get('additional_content', '')),
            ('footer_text', template_config.get('footer_text', ''))
        ]

        for section_name, content in sections:
            if content and content.strip():
                # Substitute variables in content
                processed_content = self._substitute_template_variables(content, template_vars)

                # Create appropriate style based on section
                if section_name == 'title':
                    style = ParagraphStyle(
                        'CustomTitle',
                        parent=styles['Title'],
                        fontName=f"{font_family}-Bold" if 'Bold' not in font_family else font_family,
                        fontSize=font_size + 4,
                        alignment=1,
                        spaceAfter=20
                    )
                elif section_name == 'header_text':
                    style = ParagraphStyle(
                        'CustomHeader',
                        parent=styles['Normal'],
                        fontName=f"{font_family}-Bold" if 'Bold' not in font_family else font_family,
                        fontSize=font_size,
                        alignment=0,
                        spaceAfter=15
                    )
                else:
                    style = ParagraphStyle(
                        f'Custom{section_name.title()}',
                        parent=styles['Normal'],
                        fontName=font_family,
                        fontSize=font_size,
                        alignment=0,
                        spaceAfter=10
                    )

                story.append(Paragraph(processed_content, style))
                story.append(Spacer(1, 0.2*inch))

        # Add signature section
        signature_text = template_config.get('signature_text', '')
        if signature_text:
            processed_signature = self._substitute_template_variables(signature_text, template_vars)
            signature_style = ParagraphStyle(
                'CustomSignature',
                parent=styles['Normal'],
                fontName=font_family,
                fontSize=font_size - 2,
                alignment=0,
                spaceAfter=20
            )
            story.append(Paragraph(processed_signature, signature_style))

        # Add QR Code if enabled
        if template_config.get('show_qr_code', True) and request.qr_code:
            qr_drawing = self._create_qr_drawing(request.qr_code)
            story.append(qr_drawing)
            story.append(Spacer(1, 0.1*inch))

        # Add control number if enabled
        if template_config.get('show_control_number', True):
            control_style = ParagraphStyle(
                'ControlNumber',
                parent=styles['Normal'],
                fontName=font_family,
                fontSize=font_size - 2,
                alignment=1
            )
            story.append(Paragraph(f"Control Number: {request.control_number}", control_style))

        doc.build(story)
        buffer.seek(0)
        return buffer

    def _prepare_template_variables(self, request: DocumentRequest) -> dict:
        """
        Prepare template variables for substitution.

        Args:
            request: Document request with all data

        Returns:
            Dictionary of template variables
        """
        resident_name = self._get_full_name(request)
        address = self._get_full_address(request)

        # Calculate additional variables
        years_of_residency = "Several years"
        date_arrival = request.resident_data.get('date_arrival')
        if date_arrival:
            try:
                arrival_date = datetime.fromisoformat(date_arrival.replace('Z', '+00:00'))
                years = (datetime.now() - arrival_date).days // 365
                years_of_residency = f"{years} years"
            except:
                pass

        return {
            'resident_name': resident_name,
            'address': address,
            'age': request.resident_data.get('age', ''),
            'birthdate': request.resident_data.get('birthdate', ''),
            'years_of_residency': years_of_residency,
            'purpose': request.request_data.get('purpose', ''),
            'specific_purpose': request.request_data.get('specific_purpose', ''),
            'business_name': request.request_data.get('business_name', ''),
            'business_address': request.request_data.get('business_address', ''),
            'closure_date': request.request_data.get('closure_date', ''),
            'partner1_name': request.request_data.get('partner1_name', ''),
            'partner2_name': request.request_data.get('partner2_name', ''),
            'cohabitation_date': request.request_data.get('cohabitation_date', ''),
            'blotter_number': request.request_data.get('blotter_number', ''),
            'blotter_date': request.request_data.get('blotter_date', ''),
            'children_count': request.request_data.get('children_count', ''),
            'father_name': request.request_data.get('father_name', ''),
            'mother_name': request.request_data.get('mother_name', ''),
            'school_year': request.request_data.get('school_year', ''),
            'monthly_income': request.request_data.get('monthly_income', ''),
            'requestor_name': request.request_data.get('requestor_name', ''),
            'blotter_reference': request.request_data.get('blotter_reference', ''),
            'place_of_birth': request.request_data.get('place_of_birth', ''),
            'issued_date': request.approved_at.strftime('%B %d, %Y') if request.approved_at else '',
            'valid_until': request.valid_until.strftime('%B %d, %Y') if request.valid_until else '',
            'ctc_number': request.approval_data.get('ctc_number', ''),
            'or_number': request.approval_data.get('or_number', ''),
            'prepared_by': request.approval_data.get('prepared_by', '')
        }

    def _substitute_template_variables(self, template_text: str, variables: dict) -> str:
        """
        Substitute variables in template text.

        Args:
            template_text: Text containing {variable} placeholders
            variables: Dictionary of variable values

        Returns:
            Text with variables substituted
        """
        result = template_text
        for key, value in variables.items():
            placeholder = f"{{{key}}}"
            result = result.replace(placeholder, str(value))
        return result

    def create_document_request(self, resident_id: str, document_type: str,
                              request_data: Dict[str, Any]) -> DocumentRequest:
        """
        Create a new document request.

        Args:
            resident_id: Resident's unique ID
            document_type: Type of document requested
            request_data: User-provided data for the document

        Returns:
            DocumentRequest object
        """
        request = DocumentRequest()
        request.resident_id = resident_id
        request.document_type = document_type
        request.request_data = request_data

        # Validate document type
        if document_type not in self._get_supported_document_types():
            raise DocumentNotFoundError(f"Document type '{document_type}' not supported")

        # Validate required fields for this document type
        self._validate_request_data(document_type, request_data)

        return request

    def approve_document_request(self, request: DocumentRequest,
                               approval_data: Dict[str, Any],
                               approved_by: str) -> DocumentRequest:
        """
        Approve a document request and prepare for final generation.

        Args:
            request: The document request to approve
            approval_data: Approval details (CTC NO, OR NO, validity, etc.)
            approved_by: ID of the approving officer

        Returns:
            Updated DocumentRequest ready for PDF generation
        """
        request.status = 'approved'
        request.approval_data = approval_data
        request.approved_by = approved_by
        request.approved_at = datetime.now()
        request.updated_at = datetime.now()

        # Set validity period
        validity_days = approval_data.get('validity_days', 365)  # Default 1 year
        request.valid_until = request.approved_at + timedelta(days=validity_days)

        # Generate control number and QR code
        request.control_number = self._generate_control_number(request)
        request.qr_code = self._generate_qr_code(request)

        return request

    def generate_final_document(self, request: DocumentRequest) -> BytesIO:
        """
        Generate the final PDF document after approval.

        Args:
            request: Approved document request with all data

        Returns:
            BytesIO buffer containing the final PDF
        """
        if request.status != 'approved':
            raise InvalidRequestError("Document must be approved before final generation")

        # Generate PDF based on document type
        if request.document_type == 'barangay_clearance':
            return self._generate_barangay_clearance(request)
        elif request.document_type == 'bonafide_certificate':
            return self._generate_bonafide_certificate(request)
        elif request.document_type == 'building_permit':
            return self._generate_building_permit(request)
        elif request.document_type == 'business_closure':
            return self._generate_business_closure(request)
        elif request.document_type == 'cohabitation_certificate':
            return self._generate_cohabitation_certificate(request)
        elif request.document_type == 'excavation_permit':
            return self._generate_excavation_permit(request)
        elif request.document_type == 'fencing_permit':
            return self._generate_fencing_permit(request)
        elif request.document_type == 'good_moral_certificate':
            return self._generate_good_moral_certificate(request)
        elif request.document_type == 'indigency_certificate':
            return self._generate_indigency_certificate(request)
        elif request.document_type == 'late_registration':
            return self._generate_late_registration(request)
        elif request.document_type == 'ojt_certification':
            return self._generate_ojt_certification(request)
        elif request.document_type == 'low_income_housing':
            return self._generate_low_income_housing(request)
        elif request.document_type == 'medico_legal':
            return self._generate_medico_legal(request)
        else:
            raise DocumentNotFoundError(f"Document type '{request.document_type}' not supported")

    def _get_supported_document_types(self) -> List[str]:
        """Get list of supported document types."""
        return [
            'barangay_clearance', 'bonafide_certificate', 'building_permit',
            'business_closure', 'cohabitation_certificate', 'excavation_permit',
            'fencing_permit', 'good_moral_certificate', 'indigency_certificate',
            'late_registration', 'ojt_certification', 'low_income_housing', 'medico_legal'
        ]

    def _validate_request_data(self, document_type: str, request_data: Dict[str, Any]):
        """Validate request data for specific document types."""
        required_fields = {
            'barangay_clearance': ['purpose'],
            'bonafide_certificate': ['purpose'],
            'building_permit': [],
            'business_closure': ['business_name', 'business_address', 'closure_date'],
            'cohabitation_certificate': ['partner1_name', 'partner2_name', 'cohabitation_date',
                                       'blotter_number', 'blotter_date', 'children_count'],
            'excavation_permit': [],
            'fencing_permit': [],
            'good_moral_certificate': ['school_year', 'purpose'],
            'indigency_certificate': ['purpose', 'specific_purpose'],
            'late_registration': ['father_name', 'mother_name'],
            'ojt_certification': [],
            'low_income_housing': ['monthly_income'],
            'medico_legal': ['requestor_name', 'blotter_reference']
        }

        missing_fields = []
        for field in required_fields.get(document_type, []):
            if field not in request_data or not request_data[field]:
                missing_fields.append(field)

        if missing_fields:
            raise InvalidRequestError(f"Missing required fields: {', '.join(missing_fields)}")

    def _generate_control_number(self, request: DocumentRequest) -> str:
        """Generate a unique control number for the document."""
        timestamp = request.approved_at.strftime('%Y%m%d')
        doc_code = request.document_type[:3].upper()
        return f"{doc_code}-{timestamp}-{request.request_id[:8].upper()}"

    def _generate_qr_code(self, request: DocumentRequest) -> str:
        """Generate QR code data for document validation."""
        qr_data = {
            'control_number': request.control_number,
            'document_type': request.document_type,
            'resident_id': request.resident_id,
            'issued_date': request.approved_at.isoformat(),
            'valid_until': request.valid_until.isoformat(),
            'approved_by': request.approved_by
        }
        return json.dumps(qr_data)

    def _create_qr_drawing(self, qr_data: str, size: float = 1.5*inch) -> Drawing:
        """Create a QR code drawing for embedding in PDF."""
        qr = QrCodeWidget(qr_data)
        bounds = qr.getBounds()
        qr_width = bounds[2] - bounds[0]
        qr_height = bounds[3] - bounds[1]

        # Create a drawing with the QR code
        d = Drawing(size, size, transform=[size/qr_width, 0, 0, size/qr_height, 0, 0])
        d.add(qr)
        return d

    def _get_full_name(self, request: DocumentRequest) -> str:
        """Get the full name of the resident."""
        data = request.resident_data
        first_name = data.get('first_name', '')
        middle_name = data.get('middle_name', '')
        last_name = data.get('last_name', '')
        suffix = data.get('suffix', '')

        full_name = f"{first_name} {middle_name} {last_name}".strip()
        if suffix:
            full_name += f" {suffix}"
        return full_name

    def _get_full_address(self, request: DocumentRequest) -> str:
        """Get the complete address of the resident."""
        data = request.resident_data
        street = data.get('street_address', '')
        sitio = data.get('sitio_name', '')

        if street and sitio:
            return f"{street}, {sitio}, Batia, Bocaue, Bulacan"
        elif street:
            return f"{street}, Batia, Bocaue, Bulacan"
        else:
            return f"{sitio}, Batia, Bocaue, Bulacan"

    def _generate_barangay_clearance(self, request: DocumentRequest) -> BytesIO:
        """Generate Barangay Clearance document using custom template if available."""
        # Check for custom template first
        custom_template = self.get_template_from_db('barangay_clearance')

        if custom_template:
            return self._generate_from_custom_template(request, custom_template)

        # Fall back to default implementation
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        story = []

        styles = getSampleStyleSheet()

        # Header
        header_style = ParagraphStyle('Header', parent=styles['Heading1'],
                                    fontName='Times-Bold', fontSize=16, alignment=1)
        story.append(Paragraph("BARANGAY CLEARANCE", header_style))
        story.append(Spacer(1, 0.3*inch))

        # Main content
        content_style = ParagraphStyle('Content', parent=styles['Normal'],
                                     fontName='Times-Roman', fontSize=12)

        resident_name = self._get_full_name(request)
        address = self._get_full_address(request)
        birthdate = request.resident_data.get('birthdate', '')
        place_of_birth = request.request_data.get('place_of_birth', '')
        purpose = request.request_data.get('purpose', '')

        # Certificate text
        cert_text = f"""
        TO WHOM IT MAY CONCERN:

        This is to certify that the person whose name, signature, thumb marks and other personal data appearing hereon, has requested for a Barangay Clearance from this Office and the results are listed below.

        NAME: {resident_name}
        ADDRESS: {address}
        DATE OF BIRTH: {birthdate}
        PLACE OF BIRTH: {place_of_birth}
        PURPOSE: {purpose}

        This is to further certify that {resident_name} is a bona fide resident of this Barangay. {resident_name} is known to me with a good moral character, law abiding citizen in the community. {resident_name} has no criminal record found in our Barangay Records.
        """

        story.append(Paragraph(cert_text, content_style))
        story.append(Spacer(1, 0.5*inch))

        # Approval section
        approval_style = ParagraphStyle('Approval', parent=styles['Normal'],
                                      fontName='Times-Roman', fontSize=11)

        issued_on = request.approved_at.strftime('%B %d, %Y')
        valid_until = request.valid_until.strftime('%B %d, %Y')
        ctc_no = request.approval_data.get('ctc_number', '')
        or_no = request.approval_data.get('or_number', '')
        prepared_by = request.approval_data.get('prepared_by', '')

        approval_text = f"""
        Given this {issued_on}

        Valid until: {valid_until}
        CTC NO.: {ctc_no}
        ISSUED AT: Barangay Batia, Bocaue, Bulacan
        ISSUED ON: {issued_on}
        O.R. NO.: {or_no}
        PREPARED BY: {prepared_by}
        """

        story.append(Paragraph(approval_text, approval_style))
        story.append(Spacer(1, 0.5*inch))

        # QR Code
        if request.qr_code:
            qr_drawing = self._create_qr_drawing(request.qr_code)
            story.append(qr_drawing)
            story.append(Paragraph(f"Control Number: {request.control_number}", styles['Normal']))

        doc.build(story)
        buffer.seek(0)
        return buffer

    def _generate_bonafide_certificate(self, request: DocumentRequest) -> BytesIO:
        """Generate Bonafide Certificate document."""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        story = []

        styles = getSampleStyleSheet()

        # Header
        header_style = ParagraphStyle('Header', parent=styles['Heading1'],
                                    fontName='Times-Bold', fontSize=16, alignment=1)
        story.append(Paragraph("BONAFIDE CERTIFICATE", header_style))
        story.append(Spacer(1, 0.3*inch))

        resident_name = self._get_full_name(request)
        address = self._get_full_address(request)
        birthdate = request.resident_data.get('birthdate', '')
        place_of_birth = request.request_data.get('place_of_birth', '')
        purpose = request.request_data.get('purpose', '')

        # Calculate years of residency
        date_arrival = request.resident_data.get('date_arrival')
        years_residency = "Several years"
        if date_arrival:
            try:
                arrival_date = datetime.fromisoformat(date_arrival.replace('Z', '+00:00'))
                years = (datetime.now() - arrival_date).days // 365
                years_residency = f"{years} years"
            except:
                pass

        content_style = ParagraphStyle('Content', parent=styles['Normal'],
                                     fontName='Times-Roman', fontSize=12)

        cert_text = f"""
        TO WHOM IT MAY CONCERN:

        This is to certify that {resident_name}, {request.resident_data.get('age', '')} years old, is a bona fide resident of {address}.

        This further certifies that the above-named person has been residing in this barangay for {years_residency}.

        This certification is issued upon the request of the above-named person for {purpose}.
        """

        story.append(Paragraph(cert_text, content_style))
        story.append(Spacer(1, 0.5*inch))

        # Approval section (same as clearance)
        issued_on = request.approved_at.strftime('%B %d, %Y')
        valid_until = request.valid_until.strftime('%B %d, %Y')
        ctc_no = request.approval_data.get('ctc_number', '')
        or_no = request.approval_data.get('or_number', '')

        approval_text = f"Given this {issued_on}\n\nValid until: {valid_until}\nCTC NO.: {ctc_no}\nISSUED AT: Barangay Batia, Bocaue, Bulacan\nISSUED ON: {issued_on}\nO.R. NO.: {or_no}"

        approval_style = ParagraphStyle('Approval', parent=styles['Normal'],
                                      fontName='Times-Roman', fontSize=11)
        story.append(Paragraph(approval_text, approval_style))

        doc.build(story)
        buffer.seek(0)
        return buffer

    def _generate_business_closure(self, request: DocumentRequest) -> BytesIO:
        """Generate Business Closure Certificate."""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        story = []

        styles = getSampleStyleSheet()

        # Header
        header_style = ParagraphStyle('Header', parent=styles['Heading1'],
                                    fontName='Times-Bold', fontSize=16, alignment=1)
        story.append(Paragraph("CERTIFICATE OF BUSINESS CLOSURE", header_style))
        story.append(Spacer(1, 0.3*inch))

        business_name = request.request_data.get('business_name', '')
        business_address = request.request_data.get('business_address', '')
        owner_name = self._get_full_name(request)
        closure_date = request.request_data.get('closure_date', '')

        content_style = ParagraphStyle('Content', parent=styles['Normal'],
                                     fontName='Times-Roman', fontSize=12)

        cert_text = f"""
        TO WHOM IT MAY CONCERN:

        This is to certify that {business_name} located at {business_address}, Batia, Bocaue, Bulacan owned and operated by {owner_name} has been closed since {closure_date}.

        This certification is issued upon request for whatever legal purpose it may serve.
        """

        story.append(Paragraph(cert_text, content_style))
        story.append(Spacer(1, 0.5*inch))

        # Approval section
        issued_on = request.approved_at.strftime('%B %d, %Y')
        valid_until = request.valid_until.strftime('%B %d, %Y')

        approval_text = f"Given this {issued_on}\n\nValid until: {valid_until}"

        approval_style = ParagraphStyle('Approval', parent=styles['Normal'],
                                      fontName='Times-Roman', fontSize=11)
        story.append(Paragraph(approval_text, approval_style))

        doc.build(story)
        buffer.seek(0)
        return buffer

    def _generate_indigency_certificate(self, request: DocumentRequest) -> BytesIO:
        """Generate Indigency Certificate."""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        story = []

        styles = getSampleStyleSheet()

        # Header
        header_style = ParagraphStyle('Header', parent=styles['Heading1'],
                                    fontName='Times-Bold', fontSize=16, alignment=1)
        story.append(Paragraph("CERTIFICATE OF INDIGENCY", header_style))
        story.append(Spacer(1, 0.3*inch))

        resident_name = self._get_full_name(request)
        age = request.resident_data.get('age', '')
        address = self._get_full_address(request)
        purpose = request.request_data.get('purpose', '')
        specific_purpose = request.request_data.get('specific_purpose', '')

        content_style = ParagraphStyle('Content', parent=styles['Normal'],
                                     fontName='Times-Roman', fontSize=12)

        cert_text = f"""
        TO WHOM IT MAY CONCERN,

        This is to certify that {resident_name}, {age} years old, with address at {address}, is belonging to the Indigent Family in our Barangay.

        As per records of this office, subject person has NO DEROGATORY RECORDS.

        This certification is issued upon the request of the above person to be used for his/her {purpose}, {specific_purpose}.
        """

        story.append(Paragraph(cert_text, content_style))
        story.append(Spacer(1, 0.5*inch))

        # Approval section
        issued_on = request.approved_at.strftime('%B %d, %Y')
        valid_until = request.valid_until.strftime('%B %d, %Y')
        ctc_no = request.approval_data.get('ctc_number', '')
        or_no = request.approval_data.get('or_number', '')
        prepared_by = request.approval_data.get('prepared_by', '')

        approval_text = f"""
        Given this {issued_on} at Batia, Municipality of Bocaue, Bulacan.

        Valid until: {valid_until}
        CTC NO.: {ctc_no}
        ISSUED AT: Batia, Municipality of Bocaue, Bulacan
        ISSUED ON: {issued_on}
        O.R. NO.: {or_no}
        PREPARED BY: {prepared_by}
        """

        approval_style = ParagraphStyle('Approval', parent=styles['Normal'],
                                      fontName='Times-Roman', fontSize=11)
        story.append(Paragraph(approval_text, approval_style))

        doc.build(story)
        buffer.seek(0)
        return buffer

    def _generate_medico_legal(self, request: DocumentRequest) -> BytesIO:
        """Generate Medico-Legal Certificate."""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        story = []

        styles = getSampleStyleSheet()

        # Header
        header_style = ParagraphStyle('Header', parent=styles['Heading1'],
                                    fontName='Times-Bold', fontSize=16, alignment=1)
        story.append(Paragraph("MEDICO-LEGAL CERTIFICATE", header_style))
        story.append(Spacer(1, 0.3*inch))

        resident_name = self._get_full_name(request)
        age = request.resident_data.get('age', '')
        address = self._get_full_address(request)
        requestor_name = request.request_data.get('requestor_name', '')
        blotter_ref = request.request_data.get('blotter_reference', '')

        content_style = ParagraphStyle('Content', parent=styles['Normal'],
                                     fontName='Times-Roman', fontSize=12)

        cert_text = f"""
        NAME: {resident_name}
        AGE: {age}

        To Whom It May Concern,

        We would like to request your good office to issue MEDICO LEGAL to {resident_name}, {age} years of age and a resident of {address}, according to what likely was the condition of the complainant of an event in our Barangay.

        The victim has filed a complaint with Blotter Ref No. {blotter_ref} against a certain individual/s in our office and we need this report to verify their claims.

        The request has been issued upon the request of {requestor_name} for whatever legal intent and purpose it may serve.
        """

        story.append(Paragraph(cert_text, content_style))
        story.append(Spacer(1, 0.5*inch))

        # Approval section
        issued_on = request.approved_at.strftime('%B %d, %Y')

        approval_text = f"Issued this {issued_on}."

        approval_style = ParagraphStyle('Approval', parent=styles['Normal'],
                                      fontName='Times-Roman', fontSize=11)
        story.append(Paragraph(approval_text, approval_style))

        doc.build(story)
        buffer.seek(0)
        return buffer

    # Placeholder methods for other document types
    def _generate_building_permit(self, request: DocumentRequest) -> BytesIO:
        """Generate Building Permit - placeholder."""
        return self._generate_barangay_clearance(request)  # Similar structure

    def _generate_cohabitation_certificate(self, request: DocumentRequest) -> BytesIO:
        """Generate Cohabitation Certificate - placeholder."""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        story = []

        styles = getSampleStyleSheet()
        header_style = ParagraphStyle('Header', parent=styles['Heading1'],
                                    fontName='Times-Bold', fontSize=16, alignment=1)
        story.append(Paragraph("COHABITATION CERTIFICATE", header_style))

        # Add cohabitation-specific content here
        content_style = ParagraphStyle('Content', parent=styles['Normal'],
                                     fontName='Times-Roman', fontSize=12)

        partner1 = request.request_data.get('partner1_name', '')
        partner2 = request.request_data.get('partner2_name', '')
        cohabitation_date = request.request_data.get('cohabitation_date', '')
        address = self._get_full_address(request)
        blotter_number = request.request_data.get('blotter_number', '')
        blotter_date = request.request_data.get('blotter_date', '')
        children_count = request.request_data.get('children_count', '')

        cert_text = f"""
        This is to certify according to records that {partner1} and {partner2} both residents of {address} are Common-Law Husband-And-Wife who cohabitated with one another since {cohabitation_date} as evidenced by Barangay Blotter Entry No. {blotter_number} dated {blotter_date}.

        This further certifies that their fruitful cohabitation yielded {children_count} children.
        """

        story.append(Paragraph(cert_text, content_style))
        doc.build(story)
        buffer.seek(0)
        return buffer

    def _generate_excavation_permit(self, request: DocumentRequest) -> BytesIO:
        """Generate Excavation Permit - placeholder."""
        return self._generate_barangay_clearance(request)  # Similar structure

    def _generate_fencing_permit(self, request: DocumentRequest) -> BytesIO:
        """Generate Fencing Permit - placeholder."""
        return self._generate_barangay_clearance(request)  # Similar structure

    def _generate_good_moral_certificate(self, request: DocumentRequest) -> BytesIO:
        """Generate Good Moral Certificate - placeholder."""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        story = []

        styles = getSampleStyleSheet()
        header_style = ParagraphStyle('Header', parent=styles['Heading1'],
                                    fontName='Times-Bold', fontSize=16, alignment=1)
        story.append(Paragraph("CERTIFICATE OF GOOD MORAL CHARACTER", header_style))

        resident_name = self._get_full_name(request)
        address = self._get_full_address(request)
        school_year = request.request_data.get('school_year', '')
        purpose = request.request_data.get('purpose', '')

        content_style = ParagraphStyle('Content', parent=styles['Normal'],
                                     fontName='Times-Roman', fontSize=12)

        cert_text = f"""
        TO WHOM IT MAY CONCERN:

        This is to certify that {resident_name} is a resident of {address} and known to me to be of good and sound moral standing with NO DEROGATORY RECORD filed in this office.

        This certification is issued upon the request of the above-named person for {purpose}.
        """

        story.append(Paragraph(cert_text, content_style))
        doc.build(story)
        buffer.seek(0)
        return buffer

    def _generate_late_registration(self, request: DocumentRequest) -> BytesIO:
        """Generate Late Registration Certificate - placeholder."""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        story = []

        styles = getSampleStyleSheet()
        header_style = ParagraphStyle('Header', parent=styles['Heading1'],
                                    fontName='Times-Bold', fontSize=16, alignment=1)
        story.append(Paragraph("CERTIFICATE OF LATE REGISTRATION", header_style))

        resident_name = self._get_full_name(request)
        father_name = request.request_data.get('father_name', '')
        mother_name = request.request_data.get('mother_name', '')

        content_style = ParagraphStyle('Content', parent=styles['Normal'],
                                     fontName='Times-Roman', fontSize=12)

        cert_text = f"""
        TO WHOM IT MAY CONCERN:

        This is to certify that {resident_name} is the child of couple {father_name} and {mother_name}, both residents of {self._get_full_address(request)}.

        This further certifies that {resident_name} was born on {request.resident_data.get('birthdate', '')} and at {request.request_data.get('place_of_birth', '')}.

        This certification is issued upon the request of {resident_name} for Late Birth Registration.
        """

        story.append(Paragraph(cert_text, content_style))
        doc.build(story)
        buffer.seek(0)
        return buffer

    def _generate_ojt_certification(self, request: DocumentRequest) -> BytesIO:
        """Generate OJT Certification - placeholder."""
        return self._generate_barangay_clearance(request)  # Similar structure

    def _generate_low_income_housing(self, request: DocumentRequest) -> BytesIO:
        """Generate Low Income Housing Certificate - placeholder."""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        story = []

        styles = getSampleStyleSheet()
        header_style = ParagraphStyle('Header', parent=styles['Heading1'],
                                    fontName='Times-Bold', fontSize=16, alignment=1)
        story.append(Paragraph("LOW INCOME HOUSING CERTIFICATE", header_style))

        resident_name = self._get_full_name(request)
        address = self._get_full_address(request)
        monthly_income = request.request_data.get('monthly_income', '')

        content_style = ParagraphStyle('Content', parent=styles['Normal'],
                                     fontName='Times-Roman', fontSize=12)

        cert_text = f"""
        This is to certify that {resident_name}, of legal age, is a bona fide resident of {address}. This further certifies that he/she is a pharmacy assistant and earning an income of Php {monthly_income} monthly, and belongs to Low Income Family.

        This certification is hereby given by the undersigned to be used for any legal intent and purpose it may serve.
        """

        story.append(Paragraph(cert_text, content_style))

        # Add date
        issued_on = request.approved_at.strftime('%B %d, %Y')
        story.append(Paragraph(f"Given this {issued_on} at Barangay Batia, Bocaue, Bulacan.", content_style))

        doc.build(story)
        buffer.seek(0)
        return buffer


# Example usage and testing
if __name__ == "__main__":
    # Initialize generator
    generator = ResidentDocumentGenerator()

    # Create a sample document request
    request = generator.create_document_request(
        resident_id='RES-2025-001',
        document_type='barangay_clearance',
        request_data={
            'purpose': 'Job Application',
            'place_of_birth': 'Manila'
        }
    )

    # Simulate resident data (normally from database)
    request.resident_data = {
        'first_name': 'Juan',
        'middle_name': 'Garcia',
        'last_name': 'Dela Cruz',
        'suffix': '',
        'birthdate': '1985-03-15',
        'age': 40,
        'street_address': 'Block 1, Lot 1',
        'sitio_name': 'Batia Proper',
        'date_arrival': '2010-01-15'
    }

    # Approve the request
    request = generator.approve_document_request(
        request,
        approval_data={
            'ctc_number': '123456789',
            'or_number': '987654321',
            'prepared_by': 'Barangay Secretary Maria Santos',
            'validity_days': 365
        },
        approved_by='SEC-001'
    )

    # Generate final PDF
    try:
        pdf_buffer = generator.generate_final_document(request)
        generator.save_pdf(pdf_buffer, 'sample_barangay_clearance.pdf')
        print("✅ Barangay Clearance generated successfully!")
        print(f"Control Number: {request.control_number}")
    except Exception as e:
        print(f"❌ Error generating document: {e}")

    # Test another document type
    try:
        indigency_request = generator.create_document_request(
            resident_id='RES-2025-002',
            document_type='indigency_certificate',
            request_data={
                'purpose': 'Medical Assistance',
                'specific_purpose': 'Hospital Admission'
            }
        )

        indigency_request.resident_data = {
            'first_name': 'Maria',
            'middle_name': 'Reyes',
            'last_name': 'Santos',
            'birthdate': '1987-08-22',
            'age': 38,
            'street_address': 'Block 1, Lot 2',
            'sitio_name': 'Batia Proper'
        }

        indigency_request = generator.approve_document_request(
            indigency_request,
            approval_data={
                'ctc_number': '112233445',
                'or_number': '556677889',
                'prepared_by': 'Barangay Clerk Pedro Reyes'
            },
            approved_by='CLK-001'
        )

        pdf_buffer = generator.generate_final_document(indigency_request)
        generator.save_pdf(pdf_buffer, 'sample_indigency_certificate.pdf')
        print("✅ Indigency Certificate generated successfully!")
        print(f"Control Number: {indigency_request.control_number}")

    except Exception as e:
        print(f"❌ Error generating indigency certificate: {e}")
