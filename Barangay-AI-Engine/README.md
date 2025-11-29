# Barangay AI Engine (BMW AI Module)

A comprehensive AI-powered system for Barangay Management with rule-based NLP, pattern analytics, and OCR capabilities. Built without large language models or GPU training.

## 🚀 Features

### 1. **Resident Inquiry Chatbot**
- Rule-based NLP with keyword matching and intent classification
- Supports FAQs about barangay services, certificates, and procedures
- Dynamic database connectivity for real-time information
- Fuzzy string matching for better user experience

### 2. **Blotter Pattern Analytics**
- Analyzes incident reports for trends and patterns
- Time-of-day and location clustering analysis
- Forecasting using statistical methods (moving averages, ARIMA)
- Generates visual charts and JSON summaries
- Crime hotspot identification

### 3. **Smart Form Auto-fill (OCR)**
- Extracts text from ID cards and documents using Tesseract OCR
- Regex-based field detection for names, addresses, dates
- OpenCV preprocessing for image enhancement
- Returns structured JSON data for form population

## 🏗️ Architecture

```
Barangay-AI-Engine/
├── ai/
│   ├── chatbot/
│   │   ├── chatbot_engine.py      # Main chatbot logic
│   │   ├── intents/               # Intent definitions & responses
│   │   └── utils/                 # NLP helpers & keyword rules
│   ├── blotter_analytics/
│   │   ├── analytics_engine.py    # Pattern analysis
│   │   ├── forecast_engine.py     # Time series forecasting
│   │   └── visualizations/        # Chart generation
│   ├── ocr_autofill/
│   │   ├── ocr_engine.py          # OCR processing
│   │   ├── field_extraction.py    # Regex parsing
│   │   └── regex_patterns.json    # Field patterns
│   └── shared/
│       ├── database.py            # DB connectivity
│       ├── text_similarity.py      # Fuzzy matching
│       ├── preprocessing.py       # Text preprocessing
│       └── logger.py              # Logging utilities
├── data/
│   ├── faq/                       # FAQ database
│   ├── blotter/                   # Sample blotter data
│   └── ocr/                       # Sample images
├── main_demo.py                   # Demo script
├── requirements.txt               # Python dependencies
└── README.md
```

## 📋 Requirements

- **Python 3.10+**
- **No GPU required** - All processing is CPU-based
- **Lightweight dependencies** - Uses spaCy small model, NLTK, OpenCV, etc.

## 🛠️ Installation

```bash
# Clone or navigate to project directory
cd Barangay-AI-Engine

# Install dependencies
pip install -r requirements.txt

# Download spaCy small English model
python -m spacy download en_core_web_sm
```

## 🚀 Usage

### Quick Demo
```bash
python main_demo.py
```

### Individual Modules

#### Chatbot
```python
from ai.chatbot.chatbot_engine import ChatbotEngine

chatbot = ChatbotEngine()
response = chatbot.process_query("What are the requirements for barangay clearance?")
print(response)
```

#### Blotter Analytics
```python
from ai.blotter_analytics.analytics_engine import BlotterAnalyticsEngine

analytics = BlotterAnalyticsEngine()
results = analytics.analyze_patterns("data/blotter/blotter_records.csv")
analytics.generate_charts(results, "output/")
```

#### OCR Auto-fill
```python
from ai.ocr_autofill.ocr_engine import OCRAutoFillEngine

ocr = OCRAutoFillEngine()
fields = ocr.extract_fields("path/to/id_card.jpg")
print(fields)  # {"name": "John Doe", "address": "123 Main St", ...}
```

## 📊 Sample Data

### FAQ Database Structure
```json
{
  "faqs": [
    {
      "id": "clearance_req",
      "question": "What are the requirements for barangay clearance?",
      "answer": "Requirements include: Valid ID, Community Tax Certificate, Proof of residency...",
      "keywords": ["clearance", "requirements", "documents"],
      "category": "certificates"
    }
  ]
}
```

### Blotter Data Format
```csv
case_id,date_filed,time,incident_type,location,sitio_id,status,severity
BLT-001,2024-01-15,14:30,Noise Complaint,Block 1 Lot 1,1,Resolved,Low
BLT-002,2024-01-16,22:15,Theft,Block 2 Lot 3,1,Pending,High
```

## 🔧 Configuration

### Database Setup
Update `ai/shared/database.py` with your database credentials:

```python
DB_CONFIG = {
    'host': 'localhost',
    'user': 'your_user',
    'password': 'your_password',
    'database': 'barangay_db'
}
```

### OCR Configuration
Ensure Tesseract is installed and update path in `ai/ocr_autofill/ocr_engine.py`:

```python
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'  # Windows
# pytesseract.pytesseract.tesseract_cmd = '/usr/bin/tesseract'  # Linux/Mac
```

## 🎯 API Reference

### ChatbotEngine
- `process_query(query: str) -> dict`: Process user query and return response
- `add_faq(question: str, answer: str, keywords: list)`: Add new FAQ
- `update_intents()`: Reload intent definitions

### BlotterAnalyticsEngine
- `analyze_patterns(data_path: str) -> dict`: Analyze blotter data patterns
- `forecast_incidents(data: pd.DataFrame, periods: int) -> dict`: Forecast future incidents
- `generate_charts(results: dict, output_dir: str)`: Create visualization charts

### OCRAutoFillEngine
- `extract_fields(image_path: str) -> dict`: Extract fields from document image
- `preprocess_image(image: np.array) -> np.array`: Enhance image for OCR
- `validate_extracted_data(data: dict) -> bool`: Validate extracted information

## 📈 Performance & Limitations

### Strengths
- ✅ **Fast processing** - No model training required
- ✅ **Low resource usage** - Works on standard hardware
- ✅ **Rule-based reliability** - Consistent responses
- ✅ **Extensible** - Easy to add new rules/patterns

### Limitations
- ❌ **No contextual understanding** - Limited to keyword matching
- ❌ **Rule maintenance** - Requires manual rule updates
- ❌ **Language limited** - Currently English-focused
- ❌ **No learning** - Doesn't improve with use

## 🔄 Extension Guide

### Adding New Chatbot Intents
1. Add to `ai/chatbot/intents/faq_intents.json`
2. Update keyword rules in `ai/chatbot/utils/keyword_rules.json`
3. Test with `main_demo.py`

### Adding New OCR Fields
1. Define regex patterns in `ai/ocr_autofill/regex_patterns.json`
2. Update field extraction logic in `field_extraction.py`
3. Add validation rules

### Customizing Analytics
1. Modify analysis methods in `analytics_engine.py`
2. Add new chart types in `visualizations/`
3. Update forecasting algorithms in `forecast_engine.py`

## 🐛 Troubleshooting

### Common Issues

**OCR not working:**
- Ensure Tesseract is installed: `pip install pytesseract`
- Check Tesseract path in config
- Verify image quality and preprocessing

**Chatbot not responding:**
- Check FAQ database file exists and is valid JSON
- Verify keyword matching rules
- Check database connectivity

**Analytics charts not generating:**
- Ensure matplotlib is installed
- Check output directory permissions
- Verify pandas can read CSV data

## 📝 License

This project is part of the BMW Barangay Management System. All rights reserved.

## 👥 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📞 Support

For issues or questions, please check the troubleshooting section or create an issue in the repository.

---

**Built for efficient, reliable barangay management without complex AI infrastructure.**
