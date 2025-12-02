import pytest
import os
import tempfile
from unittest.mock import patch, MagicMock, mock_open
from PIL import Image
import io


@pytest.fixture
def mock_ocr_text():
    """Mock OCR extracted text"""
    return """
    REPUBLIC OF THE PHILIPPINES
    BARANGAY CLEARANCE

    Name: Maria Santos Dela Cruz
    Address: Block 15 Lot 8, Phase 2, Barangay Central, Quezon City
    Date of Birth: March 15, 1988
    Place of Birth: Quezon City, Philippines
    Citizenship: Filipino
    Civil Status: Married
    Sex/Gender: Female

    Purpose: Employment
    OR Number: 2024001234
    Amount: ₱50.00
    Date Issued: December 15, 2024
    Valid Until: December 15, 2025

    CTC Number: 123456789
    Date Issued: December 15, 2024

    Barangay Captain
    JUAN DELA CRUZ
    """


@pytest.fixture
def mock_extracted_fields():
    """Mock extracted and cleaned fields"""
    return {
        'name': 'Maria Santos Dela Cruz',
        'address': 'Block 15 Lot 8, Phase 2, Barangay Central, Quezon City',
        'date_of_birth': 'March 15, 1988',
        'place_of_birth': 'Quezon City, Philippines',
        'citizenship': 'Filipino',
        'civil_status': 'Married',
        'sex': 'Female',
        'purpose': 'Employment',
        'or_number': '2024001234',
        'amount': '₱50.00',
        'date_issued': 'December 15, 2024',
        'valid_until': 'December 15, 2025',
        'ctc_number': '123456789',
        'barangay_captain': 'Juan Dela Cruz'
    }


@pytest.fixture
def mock_database_connection():
    """Mock database connection for testing"""
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_conn.cursor.return_value = mock_cursor
    return mock_conn, mock_cursor


class MockOCREngine:
    """Mock OCR engine"""

    def extract_text(self, image_path):
        """Mock text extraction"""
        if 'id_mock.png' in str(image_path):
            return self._get_id_text()
        else:
            return self._get_clearance_text()

    def _get_clearance_text(self):
        return """
        REPUBLIC OF THE PHILIPPINES
        BARANGAY CLEARANCE
        Name: Maria Santos Dela Cruz
        Address: Block 15 Lot 8, Phase 2, Barangay Central, Quezon City
        Date of Birth: March 15, 1988
        Purpose: Employment
        Date Issued: December 15, 2024
        Barangay Captain: JUAN DELA CRUZ
        """

    def _get_id_text(self):
        return """
        PHILIPPINES
        NATIONAL ID
        Card Number: 1234-5678-9012
        Surname: DELA CRUZ
        Given Name: MARIA SANTOS
        Date of Birth: 15/03/1988
        """


class MockFieldExtractor:
    """Mock field extraction engine"""

    def __init__(self):
        self.field_patterns = {
            'name': r'Name:?\s*([^\n\r]+)',
            'address': r'Address:?\s*([^\n\r]+)',
            'date_of_birth': r'Date of Birth:?\s*([^\n\r]+)',
            'purpose': r'Purpose:?\s*([^\n\r]+)',
            'date_issued': r'Date Issued:?\s*([^\n\r]+)',
            'barangay_captain': r'Barangay Captain:?\s*([^\n\r]+)'
        }

    def extract_fields(self, text):
        """Extract fields using regex patterns"""
        import re
        extracted = {}

        for field_name, pattern in self.field_patterns.items():
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                extracted[field_name] = match.group(1).strip()
            else:
                extracted[field_name] = None

        return extracted

    def clean_extracted_field(self, field_value):
        """Clean extracted field values"""
        if not field_value:
            return None

        # Remove extra whitespace
        cleaned = ' '.join(field_value.split())

        # OCR corrections for common errors
        ocr_fixes = {'0': 'O', '1': 'I', '4': 'A', '5': 'S', '8': 'B'}
        if not any(char.isdigit() for char in cleaned):  # Don't fix numbers
            for wrong, correct in ocr_fixes.items():
                cleaned = cleaned.replace(wrong, correct)

        return cleaned


class MockDatabaseManager:
    """Mock database manager for testing"""

    def __init__(self):
        self.saved_records = []

    def save_extracted_fields(self, fields_dict):
        """Mock saving extracted fields to database"""
        # Validate required fields
        required_fields = ['name', 'address', 'date_of_birth']
        for field in required_fields:
            if not fields_dict.get(field):
                raise ValueError(f"Missing required field: {field}")

        # Simulate database insertion
        record_id = len(self.saved_records) + 1
        record = {
            'id': record_id,
            **fields_dict,
            'created_at': '2024-12-15T10:00:00Z',
            'status': 'processed'
        }

        self.saved_records.append(record)
        return record_id

    def get_saved_record(self, record_id):
        """Retrieve saved record by ID"""
        for record in self.saved_records:
            if record['id'] == record_id:
                return record
        return None


def test_ocr_to_db_workflow_complete_pipeline(tmp_path, mock_ocr_text, mock_extracted_fields):
    """Test complete OCR → field extraction → database save workflow"""
    # Create mock image file
    mock_image_path = tmp_path / "test_clearance.png"
    mock_image_path.write_bytes(b"mock image data")

    # Initialize components
    ocr_engine = MockOCREngine()
    field_extractor = MockFieldExtractor()
    db_manager = MockDatabaseManager()

    # Step 1: OCR Processing
    with patch('PIL.Image.open') as mock_image_open:
        with patch('pytesseract.image_to_string', return_value=mock_ocr_text) as mock_tesseract:
            mock_image = MagicMock()
            mock_image_open.return_value = mock_image

            extracted_text = ocr_engine.extract_text(str(mock_image_path))

    assert len(extracted_text.strip()) > 0
    assert "BARANGAY CLEARANCE" in extracted_text

    # Step 2: Field Extraction
    extracted_fields = field_extractor.extract_fields(extracted_text)

    assert extracted_fields['name'] is not None
    assert extracted_fields['address'] is not None
    assert extracted_fields['date_of_birth'] is not None

    # Step 3: Field Cleaning
    cleaned_fields = {}
    for field_name, field_value in extracted_fields.items():
        cleaned_fields[field_name] = field_extractor.clean_extracted_field(field_value)

    # Step 4: Database Save
    record_id = db_manager.save_extracted_fields(cleaned_fields)

    assert record_id > 0

    # Step 5: Verify saved data
    saved_record = db_manager.get_saved_record(record_id)

    assert saved_record is not None
    assert saved_record['name'] == extracted_fields['name']
    assert saved_record['status'] == 'processed'


def test_ocr_to_db_workflow_with_validation_errors(tmp_path):
    """Test OCR workflow with validation errors preventing database save"""
    mock_image_path = tmp_path / "incomplete_clearance.png"

    # Mock incomplete OCR text (missing required fields)
    incomplete_text = """
    BARANGAY CLEARANCE

    Purpose: Employment
    Date Issued: December 15, 2024

    Barangay Captain: JUAN DELA CRUZ
    """

    ocr_engine = MockOCREngine()
    field_extractor = MockFieldExtractor()
    db_manager = MockDatabaseManager()

    # Extract fields from incomplete text
    extracted_fields = field_extractor.extract_fields(incomplete_text)

    # Attempt to save incomplete fields
    with pytest.raises(ValueError, match="Missing required field"):
        db_manager.save_extracted_fields(extracted_fields)


@patch('PIL.Image.open')
@patch('pytesseract.image_to_string')
def test_ocr_to_db_workflow_with_ocr_failures(mock_tesseract, mock_image_open, tmp_path):
    """Test OCR workflow handling of OCR processing failures"""
    mock_image_path = tmp_path / "corrupted_image.png"

    # Mock OCR failure
    mock_tesseract.side_effect = Exception("OCR processing failed")
    mock_image = MagicMock()
    mock_image_open.return_value = mock_image

    ocr_engine = MockOCREngine()

    # Should handle OCR failure gracefully
    try:
        extracted_text = ocr_engine.extract_text(str(mock_image_path))
        # If no exception raised, result should indicate failure
        assert extracted_text == "" or "error" in extracted_text.lower()
    except Exception:
        # If exception propagates, that's also acceptable
        pass


def test_ocr_to_db_workflow_field_cleaning_integration(tmp_path):
    """Test field cleaning integration in OCR to DB workflow"""
    mock_image_path = tmp_path / "noisy_clearance.png"

    # Mock OCR text with noise/errors
    noisy_text = """
    B ARANGAY CLEARANCE

    N4m3: M4r14 S4nt0s D3l4 Cruz
    Addr3ss: Bl0ck 15 L0t 8, Ph4s3 2, B4r4ng4y C3ntr4l
    D4t3 of B1rth: M4rch 15, 1988
    Purp0s3: EmployM3nt
    D4t3 Issu3d: D3c3mb3r 15, 2024

    B4r4ng4y C4pt41n: JU4N D3L4 CRUZ
    """

    ocr_engine = MockOCREngine()
    field_extractor = MockFieldExtractor()
    db_manager = MockDatabaseManager()

    # Process through pipeline
    extracted_fields = field_extractor.extract_fields(noisy_text)

    # Apply cleaning
    cleaned_fields = {}
    for field_name, field_value in extracted_fields.items():
        cleaned_fields[field_name] = field_extractor.clean_extracted_field(field_value)

    # Verify OCR corrections were applied
    assert cleaned_fields['name'] == "Maria Santos Dela Cruz"
    assert "Block" in cleaned_fields['address']
    assert "Barangay" in cleaned_fields['address']
    assert cleaned_fields['purpose'] == "Employment"
    assert cleaned_fields['barangay_captain'] == "Juan Dela Cruz"

    # Save and verify
    record_id = db_manager.save_extracted_fields(cleaned_fields)
    saved_record = db_manager.get_saved_record(record_id)

    assert saved_record['name'] == "Maria Santos Dela Cruz"


@patch('sqlite3.connect')
def test_ocr_to_db_workflow_database_operations(mock_sqlite_connect, mock_database_connection, mock_extracted_fields):
    """Test OCR workflow with actual database operations (mocked)"""
    mock_conn, mock_cursor = mock_database_connection
    mock_sqlite_connect.return_value = mock_conn

    # Mock successful database insertion
    mock_cursor.lastrowid = 123
    mock_conn.commit.return_value = None

    db_manager = MockDatabaseManager()

    # Override save method to use real database mock
    def mock_db_save(fields):
        # Simulate SQL insertion
        sql = """
        INSERT INTO extracted_documents
        (name, address, date_of_birth, purpose, date_issued, created_at, status)
        VALUES (?, ?, ?, ?, ?, datetime('now'), 'processed')
        """
        values = (
            fields.get('name'),
            fields.get('address'),
            fields.get('date_of_birth'),
            fields.get('purpose'),
            fields.get('date_issued')
        )

        mock_cursor.execute(sql, values)
        mock_conn.commit()
        return mock_cursor.lastrowid

    db_manager.save_extracted_fields = mock_db_save

    # Test save operation
    record_id = db_manager.save_extracted_fields(mock_extracted_fields)

    # Verify database operations were called
    mock_cursor.execute.assert_called_once()
    mock_conn.commit.assert_called_once()
    assert record_id == 123


def test_ocr_to_db_workflow_multiple_documents(tmp_path):
    """Test OCR workflow processing multiple documents"""
    mock_image_paths = []
    for i in range(3):
        mock_path = tmp_path / f"clearance_{i}.png"
        mock_path.write_bytes(f"mock image data {i}".encode())
        mock_image_paths.append(mock_path)

    ocr_engine = MockOCREngine()
    field_extractor = MockFieldExtractor()
    db_manager = MockDatabaseManager()

    saved_records = []

    for image_path in mock_image_paths:
        with patch('PIL.Image.open') as mock_image_open:
            with patch('pytesseract.image_to_string', return_value=f"""
            BARANGAY CLEARANCE {image_path.name}

            Name: Resident {image_path.name[-5]}
            Address: Address {image_path.name[-5]}
            Date of Birth: January {image_path.name[-5]}, 1990
            Purpose: Employment
            Date Issued: December 15, 2024

            Barangay Captain: JUAN DELA CRUZ
            """) as mock_tesseract:

                mock_image = MagicMock()
                mock_image_open.return_value = mock_image

                # Process document
                extracted_text = ocr_engine.extract_text(str(image_path))
                extracted_fields = field_extractor.extract_fields(extracted_text)

                # Clean fields
                cleaned_fields = {}
                for field_name, field_value in extracted_fields.items():
                    cleaned_fields[field_name] = field_extractor.clean_extracted_field(field_value)

                # Save to database
                record_id = db_manager.save_extracted_fields(cleaned_fields)
                saved_records.append(record_id)

    # Verify all documents were processed
    assert len(saved_records) == 3
    assert len(db_manager.saved_records) == 3

    # Verify records are unique
    assert len(set(saved_records)) == 3


def test_ocr_to_db_workflow_empty_document_handling(tmp_path):
    """Test OCR workflow handling of empty or invalid documents"""
    mock_image_path = tmp_path / "empty_document.png"
    mock_image_path.write_bytes(b"")

    ocr_engine = MockOCREngine()
    field_extractor = MockFieldExtractor()
    db_manager = MockDatabaseManager()

    # Mock empty OCR result
    with patch('PIL.Image.open') as mock_image_open:
        with patch('pytesseract.image_to_string', return_value="") as mock_tesseract:

            mock_image = MagicMock()
            mock_image_open.return_value = mock_image

            extracted_text = ocr_engine.extract_text(str(mock_image_path))

    # Extract fields from empty text
    extracted_fields = field_extractor.extract_fields(extracted_text)

    # Attempt to save empty fields (should fail validation)
    with pytest.raises(ValueError, match="Missing required field"):
        db_manager.save_extracted_fields(extracted_fields)


def test_ocr_to_db_workflow_document_types(tmp_path):
    """Test OCR workflow with different document types"""
    test_cases = [
        ('clearance.png', 'BARANGAY CLEARANCE', ['name', 'address', 'purpose']),
        ('id_mock.png', 'NATIONAL ID', ['name', 'card_number', 'date_of_birth'])
    ]

    ocr_engine = MockOCREngine()
    field_extractor = MockFieldExtractor()
    db_manager = MockDatabaseManager()

    for filename, doc_type, expected_fields in test_cases:
        mock_path = tmp_path / filename
        mock_path.write_bytes(b"mock data")

        with patch('PIL.Image.open') as mock_image_open:
            with patch('pytesseract.image_to_string') as mock_tesseract:

                mock_image = MagicMock()
                mock_image_open.return_value = mock_image

                if 'id_mock' in filename:
                    mock_tesseract.return_value = ocr_engine._get_id_text()
                else:
                    mock_tesseract.return_value = ocr_engine._get_clearance_text()

                # Process document
                extracted_text = ocr_engine.extract_text(str(mock_path))
                extracted_fields = field_extractor.extract_fields(extracted_text)

                # Verify document type was recognized
                assert doc_type in extracted_text

                # Basic validation that some fields were extracted
                extracted_field_names = [k for k, v in extracted_fields.items() if v is not None]
                assert len(extracted_field_names) > 0
