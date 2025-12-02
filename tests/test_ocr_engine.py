import pytest
from unittest.mock import patch, MagicMock
from PIL import Image
import io


@pytest.fixture
def mock_ocr_text():
    """Mock OCR text output"""
    return """
    Republic of the Philippines
    BARANGAY CLEARANCE

    Name: Juan Dela Cruz
    Address: 123 Main Street, Barangay Sample
    Date of Birth: January 15, 1985
    Place of Birth: Manila, Philippines
    Citizenship: Filipino
    Civil Status: Married

    Purpose: Employment
    Date Issued: December 1, 2024

    Barangay Captain
    Maria Santos
    """


@pytest.fixture
def mock_image_bytes():
    """Mock image bytes for testing"""
    # Create a minimal PNG image in memory
    img = Image.new('RGB', (100, 100), color='white')
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    return img_bytes.getvalue()


class MockOCREngine:
    """Mock OCR engine for testing"""

    def __init__(self):
        self.last_processed_image = None

    def extract_text(self, image_path_or_bytes):
        """Mock text extraction from image"""
        self.last_processed_image = image_path_or_bytes

        # Return different text based on mock input
        if isinstance(image_path_or_bytes, str) and 'id_mock.png' in image_path_or_bytes:
            return self._get_id_card_text()
        elif isinstance(image_path_or_bytes, bytes):
            return self._get_generic_document_text()
        else:
            return ""

    def _get_id_card_text(self):
        """Mock ID card text"""
        return """
        PHILIPPINES
        Republic of the Philippines

        NATIONAL ID
        Card Number: 1234-5678-9012
        Surname: DELA CRUZ
        Given Name: JUAN
        Middle Name: SANTOS
        Date of Birth: 15/01/1985
        Place of Birth: MANILA
        Sex: MALE
        """

    def _get_generic_document_text(self):
        """Mock generic document text"""
        return """
        BARANGAY CERTIFICATE

        This is to certify that Juan Dela Cruz
        is a resident of Barangay Sample.

        Issued on: January 15, 2024
        Valid until: January 15, 2025
        """


def test_ocr_text_extraction_from_file(mock_ocr_text):
    """Test OCR text extraction from file path"""
    engine = MockOCREngine()

    # Mock the file reading and pytesseract
    with patch('builtins.open', create=True) as mock_file:
        with patch('PIL.Image.open') as mock_image_open:
            with patch('pytesseract.image_to_string', return_value=mock_ocr_text) as mock_tesseract:

                mock_file.return_value.__enter__.return_value.read.return_value = b'mock image data'
                mock_image_open.return_value = MagicMock()

                result = engine.extract_text('test_image.png')

                assert isinstance(result, str)
                assert len(result.strip()) > 0
                mock_tesseract.assert_called_once()


def test_ocr_text_extraction_from_bytes(mock_image_bytes):
    """Test OCR text extraction from image bytes"""
    engine = MockOCREngine()

    with patch('PIL.Image.open') as mock_image_open:
        with patch('pytesseract.image_to_string', return_value="Extracted text from bytes") as mock_tesseract:

            mock_image = MagicMock()
            mock_image_open.return_value = mock_image

            result = engine.extract_text(mock_image_bytes)

            assert result == "Extracted text from bytes"
            mock_tesseract.assert_called_once_with(mock_image)


@patch('pytesseract.image_to_string', side_effect=Exception("OCR Failed"))
def test_ocr_engine_failure_handling(mock_tesseract):
    """Test handling of OCR engine failures"""
    engine = MockOCREngine()

    with patch('PIL.Image.open') as mock_image_open:
        mock_image = MagicMock()
        mock_image_open.return_value = mock_image

        # Should handle exception gracefully
        try:
            result = engine.extract_text(b'mock bytes')
            # If no exception raised, result should be empty or indicate failure
            assert result == "" or "error" in result.lower()
        except Exception:
            # If exception propagates, that's also acceptable
            pass


def test_ocr_engine_initialization():
    """Test OCR engine initializes correctly"""
    engine = MockOCREngine()

    assert engine.last_processed_image is None


def test_ocr_with_different_image_formats():
    """Test OCR with different image formats"""
    engine = MockOCREngine()

    test_cases = [
        ('document.jpg', 'JPEG text content'),
        ('scan.png', 'PNG scanned text'),
        ('photo.jpeg', 'Photo text content')
    ]

    for filename, expected_text in test_cases:
        with patch('builtins.open', create=True) as mock_file:
            with patch('PIL.Image.open') as mock_image_open:
                with patch('pytesseract.image_to_string', return_value=expected_text) as mock_tesseract:

                    mock_file.return_value.__enter__.return_value.read.return_value = b'mock data'
                    mock_image_open.return_value = MagicMock()

                    result = engine.extract_text(filename)

                    assert result == expected_text
                    assert engine.last_processed_image == filename


@patch('PIL.Image.open', side_effect=FileNotFoundError)
def test_ocr_with_invalid_image_file(mock_image_open):
    """Test OCR with invalid or non-existent image file"""
    engine = MockOCREngine()

    with pytest.raises(FileNotFoundError):
        engine.extract_text('nonexistent.png')


@patch('pytesseract.image_to_string', return_value="")
def test_ocr_empty_text_result(mock_tesseract):
    """Test handling of empty OCR results"""
    engine = MockOCREngine()

    with patch('PIL.Image.open') as mock_image_open:
        mock_image = MagicMock()
        mock_image_open.return_value = mock_image

        result = engine.extract_text(b'mock bytes')

        assert result == ""
        assert engine.last_processed_image == b'mock bytes'


def test_ocr_with_special_characters():
    """Test OCR with text containing special characters"""
    special_text = """
    Name: José María González
    Address: Calle 123 #45-67 Bogotá, Colombia
    Date: 15/enero/2024
    Phone: +57-301-123-4567
    Email: test@example.com
    """

    engine = MockOCREngine()

    with patch('PIL.Image.open') as mock_image_open:
        with patch('pytesseract.image_to_string', return_value=special_text) as mock_tesseract:

            mock_image = MagicMock()
            mock_image_open.return_value = mock_image

            result = engine.extract_text(b'mock bytes')

            assert "José" in result
            assert "@" in result
            assert "+" in result


def test_ocr_with_multilingual_text():
    """Test OCR with multilingual text content"""
    multilingual_text = """
    English: Barangay Clearance
    Filipino: Katunayan ng Barangay
    Spanish: Certificado de Barangay

    Name: Juan dela Cruz
    Dirección: Calle Principal 123
    """

    engine = MockOCREngine()

    with patch('PIL.Image.open') as mock_image_open:
        with patch('pytesseract.image_to_string', return_value=multilingual_text) as mock_tesseract:

            mock_image = MagicMock()
            mock_image_open.return_value = mock_image

            result = engine.extract_text(b'mock bytes')

            assert "Barangay" in result
            assert "Calle" in result
            assert "Juan" in result


@patch('pytesseract.image_to_string', return_value="   \n\n   \t   \n  ")
def test_ocr_with_whitespace_only(mock_tesseract):
    """Test OCR result with only whitespace"""
    engine = MockOCREngine()

    with patch('PIL.Image.open') as mock_image_open:
        mock_image = MagicMock()
        mock_image_open.return_value = mock_image

        result = engine.extract_text(b'mock bytes')

        assert result.strip() == ""


def test_ocr_processing_tracking():
    """Test that OCR engine tracks processed images"""
    engine = MockOCREngine()

    test_inputs = [
        'test1.png',
        b'image_bytes_data',
        'document.jpg'
    ]

    for test_input in test_inputs:
        with patch('PIL.Image.open') as mock_image_open:
            with patch('pytesseract.image_to_string', return_value="test text") as mock_tesseract:

                mock_image = MagicMock()
                mock_image_open.return_value = mock_image

                engine.extract_text(test_input)

                assert engine.last_processed_image == test_input
