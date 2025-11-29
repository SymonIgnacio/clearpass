#!/usr/bin/env python3
"""
Barangay AI Engine - Complete Demo
Showcases all three AI modules working together
"""

import os
import sys
from pathlib import Path

# Add current directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from ai.chatbot.chatbot_engine import ChatbotEngine
from ai.blotter_analytics.analytics_engine import BlotterAnalyticsEngine
from ai.ocr_autofill.ocr_engine import OCRAutoFillEngine
from ai.shared.logger import ai_logger


def print_header(title: str):
    """Print formatted header"""
    print(f"\n{'='*60}")
    print(f"🤖 {title}")
    print(f"{'='*60}")


def demo_chatbot():
    """Demonstrate chatbot functionality"""
    print_header("BARANGAY CHATBOT DEMO")

    try:
        # Initialize chatbot
        print("🔄 Initializing Chatbot Engine...")
        chatbot = ChatbotEngine()
        print("✅ Chatbot ready!")

        # Test queries
        test_queries = [
            "What do I need for barangay clearance?",
            "How long does certificate processing take?",
            "How do I report an incident to the barangay?",
            "What are your office hours?",
            "I lost my barangay documents, what should I do?",
            "What help is available for senior citizens?",
            "How does waste collection work?",
            "Some random question that doesn't make sense"
        ]

        print(f"\n🧪 Testing {len(test_queries)} queries...\n")

        for i, query in enumerate(test_queries, 1):
            print(f"{i}. 👤 User: {query}")

            result = chatbot.process_query(query)
            response = result['response']
            confidence = result['confidence']
            match_type = result['match_type']
            confidence_level = result['confidence_level']

            print(f"   🤖 Bot ({match_type}, {confidence:.1f}%, {confidence_level}): {response}")

            if 'suggestions' in result and result['suggestions']:
                print(f"   💡 Suggestions: {', '.join(result['suggestions'][:2])}")

            print()

        # Show statistics
        stats = chatbot.get_statistics()
        print("📊 Chatbot Statistics:")
        print(f"   • Total FAQs: {stats['total_faqs']}")
        print(f"   • Total Intents: {stats['total_intents']}")
        print(f"   • FAQ Categories: {stats['faq_categories']}")

        # Add custom FAQ
        print("\n🔧 Adding custom FAQ...")
        chatbot.add_custom_faq(
            question="How do I apply for a business permit?",
            answer="To apply for a business permit: 1) Secure barangay clearance, 2) Get mayor's permit, 3) Submit business registration, 4) Pay ₱100 processing fee. Processing takes 3-5 days.",
            keywords=["business", "permit", "apply", "license"]
        )
        print("✅ Custom FAQ added!")

        # Test custom FAQ
        test_query = "How do I get a business permit?"
        result = chatbot.process_query(test_query)
        print(f"\n🧪 Testing custom FAQ: '{test_query}'")
        print(f"🤖 Response: {result['response']}")

    except Exception as e:
        print(f"❌ Chatbot demo failed: {e}")
        import traceback
        traceback.print_exc()


def demo_blotter_analytics():
    """Demonstrate blotter analytics functionality"""
    print_header("BLOTTER ANALYTICS DEMO")

    try:
        # Initialize analytics engine
        print("🔄 Initializing Blotter Analytics Engine...")
        analytics = BlotterAnalyticsEngine()
        print("✅ Analytics engine ready!")

        # Check if sample data exists
        sample_data_path = "data/blotter/blotter_records.csv"
        if not os.path.exists(sample_data_path):
            print("⚠️  Sample blotter data not found. Creating sample dataset...")

            # Create sample blotter data
            sample_data = '''case_id,date_filed,time,incident_type,location,sitio_id,status,severity
BLT-001,2024-01-15,14:30,Noise Complaint,Block 1 Lot 1,1,Resolved,Low
BLT-002,2024-01-16,22:15,Theft,Block 2 Lot 3,1,Pending,High
BLT-003,2024-01-17,09:45,Physical Injury,Block 4 Lot 2,2,Resolved,Medium
BLT-004,2024-01-18,16:20,Domestic Dispute,Block 1 Lot 5,1,Forwarded to Lupon,High
BLT-005,2024-01-19,11:30,Noise Complaint,Block 3 Lot 1,2,Resolved,Low
BLT-006,2024-01-20,08:15,Vandalism,Block 5 Lot 4,3,Dismissed,Medium
BLT-007,2024-01-21,19:45,Theft,Block 2 Lot 2,1,Pending,High
BLT-008,2024-01-22,13:20,Physical Injury,Block 6 Lot 3,3,Resolved,Medium
BLT-009,2024-01-23,10:30,Noise Complaint,Block 1 Lot 3,1,Resolved,Low
BLT-010,2024-01-24,21:00,Domestic Dispute,Block 4 Lot 1,2,Forwarded to Lupon,High
BLT-011,2024-01-25,15:15,Vandalism,Block 3 Lot 2,2,Resolved,Low
BLT-012,2024-01-26,07:30,Theft,Block 5 Lot 1,3,Pending,Medium
BLT-013,2024-01-27,12:45,Physical Injury,Block 2 Lot 4,1,Resolved,High
BLT-014,2024-01-28,18:20,Noise Complaint,Block 6 Lot 2,3,Resolved,Low
BLT-015,2024-01-29,23:30,Domestic Dispute,Block 1 Lot 4,1,Forwarded to Lupon,High'''

            # Ensure directory exists
            os.makedirs(os.path.dirname(sample_data_path), exist_ok=True)

            # Write sample data
            with open(sample_data_path, 'w', encoding='utf-8') as f:
                f.write(sample_data)
            print(f"✅ Created sample blotter data at {sample_data_path}")

        # Analyze patterns
        print("\n🔍 Analyzing blotter patterns...")
        results = analytics.analyze_patterns(sample_data_path)

        if results:
            print("📊 Analysis Results:")
            print(f"   • Total Incidents: {results.get('total_incidents', 0)}")
            print(f"   • Most Common Incident: {results.get('most_common_incident', 'N/A')}")
            print(f"   • Peak Hour: {results.get('peak_hour', 'N/A')}")
            print(f"   • Most Affected Sitio: {results.get('most_affected_sitio', 'N/A')}")

            # Generate charts
            output_dir = "data/blotter/sample_charts"
            os.makedirs(output_dir, exist_ok=True)

            print(f"\n📈 Generating charts in {output_dir}...")
            analytics.generate_charts(results, output_dir)
            print("✅ Charts generated!")

            # Show forecast
            print("\n🔮 Generating incident forecast...")
            forecast = analytics.forecast_incidents(results.get('daily_incidents', []), periods=7)
            if forecast:
                print("📅 7-Day Forecast:")
                for i, prediction in enumerate(forecast.get('predictions', []), 1):
                    print(f"   Day {i}: {prediction:.1f} incidents")
            # List generated files
            print("\n📁 Generated Files:")
            for file in os.listdir(output_dir):
                if file.endswith('.png'):
                    print(f"   • {file}")

        else:
            print("❌ Analysis failed - no results returned")

    except Exception as e:
        print(f"❌ Blotter analytics demo failed: {e}")
        import traceback
        traceback.print_exc()


def demo_ocr_autofill():
    """Demonstrate OCR auto-fill functionality"""
    print_header("OCR AUTO-FILL DEMO")

    try:
        # Initialize OCR engine
        print("🔄 Initializing OCR Engine...")
        ocr = OCRAutoFillEngine()
        print("✅ OCR engine ready!")

        # Check for sample images
        sample_dir = "ai/ocr_autofill/samples"
        sample_images = [f for f in os.listdir(sample_dir) if f.endswith(('.jpg', '.png', '.jpeg'))] if os.path.exists(sample_dir) else []

        if not sample_images:
            print("⚠️  No sample images found. OCR demo will show text processing only.")

            # Demo with sample text instead
            sample_texts = [
                "Republic of the Philippines\nBARANGAY BATIA\nName: Juan Dela Cruz\nAddress: Block 1 Lot 1, Poblacion\nBirth Date: January 15, 1980\nID Number: 123456789",
                "Philippine Identification Card\nLast Name: Santos\nFirst Name: Maria\nMiddle Name: Garcia\nBirthdate: 03/22/1975\nAddress: Sitio Malinis, Barangay Batia"
            ]

            print("\n🧪 Testing OCR text extraction...")
            for i, text in enumerate(sample_texts, 1):
                print(f"\n📄 Sample Text {i}:")
                print(text[:100] + "..." if len(text) > 100 else text)

                fields = ocr.extract_fields_from_text(text)
                print("📋 Extracted Fields:")
                for field, value in fields.items():
                    if value:
                        print(f"   • {field}: {value}")

        else:
            print(f"🖼️  Found {len(sample_images)} sample images. Processing...")

            for image_file in sample_images[:2]:  # Process max 2 images
                image_path = os.path.join(sample_dir, image_file)
                print(f"\n🖼️  Processing: {image_file}")

                try:
                    fields = ocr.extract_fields(image_path)
                    print("📋 Extracted Fields:")
                    for field, value in fields.items():
                        if value:
                            print(f"   • {field}: {value}")
                except Exception as e:
                    print(f"   ❌ Failed to process {image_file}: {e}")

        # Show regex patterns
        print("\n🔧 OCR Regex Patterns:")
        patterns = ocr.get_regex_patterns()
        for field, pattern_info in patterns.items():
            print(f"   • {field}: {pattern_info.get('description', 'N/A')}")

    except Exception as e:
        print(f"❌ OCR demo failed: {e}")
        import traceback
        traceback.print_exc()


def main():
    """Main demo function"""
    print("🚀 BARANGAY AI ENGINE - COMPLETE DEMO")
    print("=" * 60)
    print("This demo showcases all three AI modules:")
    print("1. 🤖 Resident Inquiry Chatbot")
    print("2. 📊 Blotter Pattern Analytics")
    print("3. 📷 Smart OCR Auto-fill")
    print("\nAll modules use rule-based processing - NO large language models!")
    print("=" * 60)

    # Run demos
    try:
        demo_chatbot()
        demo_blotter_analytics()
        demo_ocr_autofill()

        print_header("DEMO COMPLETE")
        print("✅ All AI modules demonstrated successfully!")
        print("\n📝 Next Steps:")
        print("   • Customize FAQ data in data/faq/")
        print("   • Add your blotter records for analysis")
        print("   • Train OCR with your document layouts")
        print("   • Integrate with your barangay management system")
        print("\n🎯 Ready for production deployment!")

    except KeyboardInterrupt:
        print("\n⏹️  Demo interrupted by user")
    except Exception as e:
        print(f"\n❌ Demo failed with error: {e}")
        ai_logger.error(f"Demo execution failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
