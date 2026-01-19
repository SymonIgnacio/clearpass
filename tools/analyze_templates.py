import os
import zipfile
import re
import glob

TEMPLATE_DIR = r"C:\xampp\htdocs\clearpass\Certificate Templates"

def analyze_docx(file_path):
    try:
        with zipfile.ZipFile(file_path) as zf:
            xml_content = zf.read('word/document.xml').decode('utf-8')
            # Regex to find placeholders like {resident_name}
            # Handles simple cases. Complex cases might have XML tags inside the braces
            # e.g. {<w:t>resident</w:t>_<w:t>name</w:t>} - this is common in Word
            # So we first strip xml tags? Or use a more robust regex.
            
            # Simple approach: remove all XML tags then find {...}
            text_only = re.sub(r'<[^>]+>', '', xml_content)
            variables = re.findall(r'\{[a-zA-Z0-9_]+\}', text_only)
            return list(set(variables))
    except Exception as e:
        return [f"Error: {str(e)}"]

def main():
    print(f"Scanning directory: {TEMPLATE_DIR}")
    
    if not os.path.exists(TEMPLATE_DIR):
        print("Directory not found!")
        return

    all_files = os.listdir(TEMPLATE_DIR)
    docx_files = [f for f in all_files if f.lower().endswith('.docx')]
    doc_files = [f for f in all_files if f.lower().endswith('.doc')]
    
    print("\n--- File Summary ---")
    print(f"Total files: {len(all_files)}")
    print(f".docx files (Compatible): {len(docx_files)}")
    print(f".doc files (Incompatible - Need Conversion): {len(doc_files)}")
    
    print("\n--- Incompatible Files (.doc) ---")
    for f in doc_files:
        print(f" - {f}")

    print("\n--- Variable Analysis (.docx) ---")
    for f in docx_files:
        path = os.path.join(TEMPLATE_DIR, f)
        vars_found = analyze_docx(path)
        print(f"\nFile: {f}")
        if vars_found:
            print(f"  Variables: {', '.join(vars_found)}")
        else:
            print("  No variables found (or parsing failed)")

if __name__ == "__main__":
    main()
