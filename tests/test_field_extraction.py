import pytest
import re
from unittest.mock import patch, MagicMock


@pytest.fixture
def sample_ocr_text():
    """Sample OCR text for field extraction testing"""
    return """
    Republic of the Philippines
    BARANGAY CLEARANCE

    Name: Juan Dela Cruz Santos
    Address: 123 Main Street, Barangay Central, City of Manila
    Date of Birth: January 15, 1985
    Place of Birth: Manila, Philippines
    Citizenship: Filipino
    Civil Status: Married
    Sex/Gender: Male

    Purpose: Employment
    OR Number: 123456789
    Date Issued: December 1, 2024
    Valid Until: December 1, 2025

    Barangay Captain
    Maria Santos Rodriguez
    """


@pytest.fixture
def messy_ocr_text():
    """Messy OCR text with noise and formatting issues"""
    return """
    Republ1c of the Ph1l1ppines
    B ARANGAY CLEARANCE

    Name: Ju4n D3la Cruz
    Addr3ss: 123 M41n Str33t, B4r4ng4y C3ntr4l
    D4te of B1rth: J4nu4ry 15, 1985
    Pl4ce of B1rth: M4n1l4, Ph1l1ppin3s
    Citiz3nship: F1lipino
    Civil St4tus: M4rri3d

    Purp0se: EmployM3nt
    D4te Issu3d: D3c3mb3r 1, 2024

    B4r4ng4y C4pt41n
    M4ri4 S4nt0s
    """


@pytest.fixture
def incomplete_ocr_text():
    """OCR text with missing fields"""
    return """
    BARANGAY CLEARANCE

    Name: Juan Dela Cruz
    Address: 123 Main Street
    Date of Birth: January 15, 1985

    Purpose: Employment
    Date Issued: December 1, 2024

    Barangay Captain
    Maria Santos
    """


class MockFieldExtractor:
    """Mock field extraction engine"""

    def __init__(self):
        self.field_patterns = {
            'name': re.compile(r'Name:?\s*([^\n\r]+)', re.IGNORECASE),
            'address': re.compile(r'Address:?\s*([^\n\r]+)', re.IGNORECASE),
            'date_of_birth': re.compile(r'Date of Birth:?\s*([^\n\r]+)', re.IGNORECASE),
            'place_of_birth': re.compile(r'Place of Birth:?\s*([^\n\r]+)', re.IGNORECASE),
            'citizenship': re.compile(r'Citizenship:?\s*([^\n\r]+)', re.IGNORECASE),
            'civil_status': re.compile(r'Civil Status:?\s*([^\n\r]+)', re.IGNORECASE),
            'purpose': re.compile(r'Purpose:?\s*([^\n\r]+)', re.IGNORECASE),
            'date_issued': re.compile(r'Date Issued:?\s*([^\n\r]+)', re.IGNORECASE),
            'or_number': re.compile(r'OR Number:?\s*([^\n\r]+)', re.IGNORECASE),
            'barangay_captain': re.compile(r'Barangay Captain\s*([^\n\r]+)', re.IGNORECASE)
        }

    def extract_fields(self, text):
        """Extract fields from OCR text using regex patterns"""
        extracted = {}

        for field_name, pattern in self.field_patterns.items():
            match = pattern.search(text)
            if match:
                extracted[field_name] = match.group(1).strip()
            else:
                extracted[field_name] = None

        return extracted

    def clean_extracted_field(self, field_value):
        """Clean and normalize extracted field values"""
        if not field_value:
            return None

        # Remove extra whitespace
        cleaned = ' '.join(field_value.split())

        # Fix common OCR errors
        ocr_corrections = {
            '0': 'O', '1': 'I', '3': 'E', '4': 'A', '5': 'S',
            '6': 'G', '7': 'T', '8': 'B', '9': 'g'
        }

        # Only apply corrections for likely OCR errors (not in dates/numbers)
        if not re.search(r'\d{1,4}[-/]\d{1,2}[-/]\d{2,4}', cleaned):  # Not a date
            for wrong, correct in ocr_corrections.items():
                cleaned = cleaned.replace(wrong, correct)

        return cleaned

    def validate_extracted_fields(self, fields):
        """Validate extracted fields for completeness and format"""
        required_fields = ['name', 'address', 'date_of_birth']
        validation_results = {}

        for field in required_fields:
            value = fields.get(field)
            if not value or not value.strip():
                validation_results[field] = 'missing'
            else:
                validation_results[field] = 'present'

        # Additional validations
        if fields.get('date_of_birth'):
            # Check if date format is reasonable
            date_str = fields['date_of_birth'].strip()
            if not re.search(r'\d{1,2}[-/]\d{1,2}[-/]\d{4}', date_str) and \
               not re.search(r'(January|February|March|April|May|June|July|August|September|October|November|December)', date_str, re.IGNORECASE):
                validation_results['date_of_birth'] = 'invalid_format'

        return validation_results


def test_field_extraction_basic(sample_ocr_text):
    """Test basic field extraction from clean OCR text"""
    extractor = MockFieldExtractor()

    fields = extractor.extract_fields(sample_ocr_text)

    assert fields['name'] == 'Juan Dela Cruz Santos'
    assert 'Main Street' in fields['address']
    assert fields['date_of_birth'] == 'January 15, 1985'
    assert fields['purpose'] == 'Employment'
    assert fields['or_number'] == '123456789'


def test_field_extraction_case_insensitive(sample_ocr_text):
    """Test field extraction is case insensitive"""
    extractor = MockFieldExtractor()

    # Convert text to uppercase
    upper_text = sample_ocr_text.upper()
    fields = extractor.extract_fields(upper_text)

    assert fields['name'] is not None
    assert fields['address'] is not None
    assert 'MAIN STREET' in fields['address']


def test_field_extraction_missing_fields(incomplete_ocr_text):
    """Test field extraction with missing fields"""
    extractor = MockFieldExtractor()

    fields = extractor.extract_fields(incomplete_ocr_text)

    assert fields['name'] == 'Juan Dela Cruz'
    assert fields['place_of_birth'] is None
    assert fields['citizenship'] is None
    assert fields['civil_status'] is None


def test_field_cleaning_basic():
    """Test basic field cleaning functionality"""
    extractor = MockFieldExtractor()

    test_cases = [
        ("  Juan   Dela   Cruz  ", "Juan Dela Cruz"),
        ("Ju4n D3l4 Cruz", "Juan Dela Cruz"),  # OCR corrections
        ("", None),
        ("   ", None),
        (None, None)
    ]

    for input_val, expected in test_cases:
        result = extractor.clean_extracted_field(input_val)
        assert result == expected


def test_field_cleaning_ocr_corrections():
    """Test OCR error corrections in field cleaning"""
    extractor = MockFieldExtractor()

    corrections = {
        "Ju4n D3l4 Cruz": "Juan Dela Cruz",
        "M4n1l4": "Manila",
        "Ph1l1pp1n3s": "Philippines",
        "C3ntr4l": "Central",
        "B4r4ng4y": "Barangay"
    }

    for input_text, expected in corrections.items():
        result = extractor.clean_extracted_field(input_text)
        assert result == expected


def test_field_cleaning_preserves_dates():
    """Test that field cleaning preserves date formats"""
    extractor = MockFieldExtractor()

    date_cases = [
        "15/01/1985",
        "January 15, 1985",
        "12-25-2024",
        "01/15/85"
    ]

    for date_str in date_cases:
        result = extractor.clean_extracted_field(date_str)
        assert result == date_str  # Should not apply OCR corrections to dates


def test_field_validation_complete_data(sample_ocr_text):
    """Test field validation with complete data"""
    extractor = MockFieldExtractor()

    fields = extractor.extract_fields(sample_ocr_text)
    validation = extractor.validate_extracted_fields(fields)

    assert validation['name'] == 'present'
    assert validation['address'] == 'present'
    assert validation['date_of_birth'] == 'present'


def test_field_validation_missing_data(incomplete_ocr_text):
    """Test field validation with missing data"""
    extractor = MockFieldExtractor()

    fields = extractor.extract_fields(incomplete_ocr_text)
    validation = extractor.validate_extracted_fields(fields)

    assert validation['name'] == 'present'
    assert validation['address'] == 'present'
    assert validation['date_of_birth'] == 'present'
    # Other fields not validated as required


def test_field_validation_date_formats():
    """Test field validation for different date formats"""
    extractor = MockFieldExtractor()

    test_cases = [
        ("15/01/1985", 'present'),
        ("January 15, 1985", 'present'),
        ("Invalid Date Format", 'invalid_format'),
        ("", 'missing'),
        (None, 'missing')
    ]

    for date_val, expected in test_cases:
        fields = {'name': 'Test', 'address': 'Test Address', 'date_of_birth': date_val}
        validation = extractor.validate_extracted_fields(fields)
        assert validation['date_of_birth'] == expected


def test_regex_pattern_compilation():
    """Test that regex patterns are properly compiled"""
    extractor = MockFieldExtractor()

    assert hasattr(extractor, 'field_patterns')
    assert len(extractor.field_patterns) > 0

    for field_name, pattern in extractor.field_patterns.items():
        assert hasattr(pattern, 'search')  # Should be compiled regex
        assert hasattr(pattern, 'match')


@patch('re.compile')
def test_regex_pattern_creation(mock_compile):
    """Test regex pattern creation with mocking"""
    mock_pattern = MagicMock()
    mock_compile.return_value = mock_pattern

    # This would test the pattern creation logic if it were dynamic
    extractor = MockFieldExtractor()

    # Verify patterns exist
    assert 'name' in extractor.field_patterns
    assert 'address' in extractor.field_patterns


def test_field_extraction_with_noise(messy_ocr_text):
    """Test field extraction with noisy OCR text"""
    extractor = MockFieldExtractor()

    fields = extractor.extract_fields(messy_ocr_text)

    assert fields['name'] is not None
    assert 'Ju4n' in fields['name']  # Raw extraction should include OCR errors
    assert fields['address'] is not None
    assert fields['date_of_birth'] is not None


def test_field_extraction_empty_text():
    """Test field extraction with empty or whitespace-only text"""
    extractor = MockFieldExtractor()

    test_cases = ["", "   ", "\n\n\t  \n", None]

    for empty_text in test_cases:
        fields = extractor.extract_fields(empty_text or "")

        # All fields should be None for empty input
        for field_value in fields.values():
            assert field_value is None


def test_multiple_matches_handling():
    """Test handling when regex matches multiple occurrences"""
    extractor = MockFieldExtractor()

    text_with_multiple = """
    Name: First Name
    Address: First Address
    Name: Second Name
    Address: Second Address
    """

    fields = extractor.extract_fields(text_with_multiple)

    # Should return first match for each field
    assert fields['name'] == 'First Name'
    assert fields['address'] == 'First Address'
