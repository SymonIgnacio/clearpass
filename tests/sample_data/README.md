# Sample Data for AI Module Tests

## Files Overview

### `sample_faq.json`
Contains sample FAQ data for chatbot testing with questions, answers, and keyword matching.

### `sample_blotter.csv`
Sample incident data for blotter analytics testing, including sitio locations, incident types, timestamps, and severity levels.

### `ocr_text_sample.txt`
Sample OCR text output for testing document processing and field extraction algorithms.

### `id_mock.png` (Not included)
This would be a real image file containing sample ID/document text for OCR processing.
Since we cannot include binary files in this test suite, OCR tests use mocked text output instead.

## Usage in Tests

These files are used by pytest fixtures in `conftest.py` to provide realistic test data without external dependencies. All tests use mocked external services (OCR, database, file I/O) to ensure reliable and fast test execution.
