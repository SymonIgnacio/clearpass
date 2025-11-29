"""
Text preprocessing utilities for Barangay AI Engine
Handles text cleaning, normalization, and tokenization
"""

import re
import unicodedata
from typing import List, Dict, Any, Optional
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer

class TextPreprocessor:
    """
    Text preprocessing engine with multiple cleaning and normalization options
    """

    def __init__(self, language: str = "english"):
        """
        Initialize preprocessor

        Args:
            language: Language for stopwords and lemmatization
        """
        self.language = language
        self._ensure_nltk_data()

        # Initialize NLTK components
        try:
            self.stop_words = set(stopwords.words(language))
        except LookupError:
            self.stop_words = set()

        try:
            self.lemmatizer = WordNetLemmatizer()
        except LookupError:
            self.lemmatizer = None

    def _ensure_nltk_data(self):
        """Ensure required NLTK data is downloaded"""
        try:
            # Try to use existing data
            nltk.data.find('tokenizers/punkt')
            nltk.data.find('corpora/stopwords')
            nltk.data.find('corpora/wordnet')
        except LookupError:
            # Download required data if not available
            try:
                nltk.download('punkt', quiet=True)
                nltk.download('stopwords', quiet=True)
                nltk.download('wordnet', quiet=True)
            except Exception:
                # Continue without NLTK if download fails
                pass

    def normalize_unicode(self, text: str) -> str:
        """
        Normalize unicode characters to standard forms

        Args:
            text: Input text

        Returns:
            Unicode normalized text
        """
        if not text:
            return ""

        # Normalize unicode characters
        text = unicodedata.normalize('NFKC', text)

        # Handle common unicode issues
        replacements = {
            '"': '"',  # Left double quotation mark
            '"': '"',  # Right double quotation mark
            ''': "'",  # Left single quotation mark
            ''': "'",  # Right single quotation mark
            '–': '-',  # En dash
            '—': '-',  # Em dash
            '…': '...',  # Horizontal ellipsis
        }

        for old, new in replacements.items():
            text = text.replace(old, new)

        return text

    def clean_text(self, text: str, preserve_case: bool = False) -> str:
        """
        Clean and normalize text

        Args:
            text: Input text
            preserve_case: Whether to preserve original case

        Returns:
            Cleaned text
        """
        if not text:
            return ""

        # Unicode normalization
        text = self.normalize_unicode(text)

        # Convert to lowercase unless preserving case
        if not preserve_case:
            text = text.lower()

        # Remove URLs
        text = re.sub(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', '', text)

        # Remove email addresses
        text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '', text)

        # Remove phone numbers (basic pattern)
        text = re.sub(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', '', text)

        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()

        return text

    def tokenize_text(self, text: str) -> List[str]:
        """
        Tokenize text into words

        Args:
            text: Input text

        Returns:
            List of word tokens
        """
        if not text:
            return []

        try:
            # Use NLTK tokenization
            tokens = word_tokenize(text)
        except LookupError:
            # Fallback to simple split if NLTK not available
            tokens = re.findall(r'\b\w+\b', text)

        return tokens

    def remove_stopwords(self, tokens: List[str]) -> List[str]:
        """
        Remove stopwords from token list

        Args:
            tokens: List of tokens

        Returns:
            Tokens with stopwords removed
        """
        if not tokens:
            return []

        if not self.stop_words:
            return tokens

        return [token for token in tokens if token.lower() not in self.stop_words]

    def lemmatize_tokens(self, tokens: List[str]) -> List[str]:
        """
        Lemmatize tokens to base forms

        Args:
            tokens: List of tokens

        Returns:
            Lemmatized tokens
        """
        if not tokens or not self.lemmatizer:
            return tokens

        return [self.lemmatizer.lemmatize(token) for token in tokens]

    def extract_numbers(self, text: str) -> List[str]:
        """
        Extract numeric values from text

        Args:
            text: Input text

        Returns:
            List of numeric strings found
        """
        if not text:
            return []

        # Find all numeric patterns
        numbers = re.findall(r'\b\d+(?:\.\d+)?\b', text)
        return numbers

    def extract_dates(self, text: str) -> List[str]:
        """
        Extract date-like patterns from text

        Args:
            text: Input text

        Returns:
            List of potential date strings
        """
        if not text:
            return []

        # Common date patterns
        date_patterns = [
            r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b',  # MM/DD/YYYY or DD/MM/YYYY
            r'\b\d{4}[/-]\d{1,2}[/-]\d{1,2}\b',     # YYYY/MM/DD
            r'\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b',
            r'\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b'
        ]

        dates = []
        for pattern in date_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            dates.extend(matches)

        return list(set(dates))  # Remove duplicates

    def extract_addresses(self, text: str) -> List[str]:
        """
        Extract potential address patterns from text

        Args:
            text: Input text

        Returns:
            List of potential address strings
        """
        if not text:
            return []

        # Common address patterns (Barangay-specific)
        address_patterns = [
            r'\b(?:Sitio|Purok|Block|Lot|Phase)\s+[\w\s]+\b',
            r'\bBarangay\s+[\w\s]+\b',
            r'\b(?:Street|Avenue|Road|Drive)\s+[\w\s]+\b',
            r'\b\d+(?:st|nd|rd|th)?\s+(?:Street|Avenue|Road|Drive)\b'
        ]

        addresses = []
        for pattern in address_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            addresses.extend(matches)

        return list(set(addresses))  # Remove duplicates

    def preprocess_for_matching(self, text: str) -> str:
        """
        Preprocess text for fuzzy matching operations

        Args:
            text: Input text

        Returns:
            Preprocessed text optimized for matching
        """
        if not text:
            return ""

        # Clean text
        text = self.clean_text(text)

        # Remove punctuation but keep spaces
        text = re.sub(r'[^\w\s]', '', text)

        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()

        return text

    def preprocess_for_analysis(self, text: str) -> Dict[str, Any]:
        """
        Comprehensive preprocessing for text analysis

        Args:
            text: Input text

        Returns:
            Dictionary with various preprocessing results
        """
        if not text:
            return {
                'original': '',
                'cleaned': '',
                'tokens': [],
                'filtered_tokens': [],
                'lemmatized_tokens': [],
                'numbers': [],
                'dates': [],
                'addresses': [],
                'length': 0
            }

        # Basic preprocessing
        cleaned = self.clean_text(text)
        tokens = self.tokenize_text(cleaned)
        filtered_tokens = self.remove_stopwords(tokens)
        lemmatized_tokens = self.lemmatize_tokens(filtered_tokens)

        # Extract entities
        numbers = self.extract_numbers(text)
        dates = self.extract_dates(text)
        addresses = self.extract_addresses(text)

        return {
            'original': text,
            'cleaned': cleaned,
            'tokens': tokens,
            'filtered_tokens': filtered_tokens,
            'lemmatized_tokens': lemmatized_tokens,
            'numbers': numbers,
            'dates': dates,
            'addresses': addresses,
            'length': len(tokens)
        }


class DocumentPreprocessor:
    """
    Preprocessor for document-level text (multiple sentences/paragraphs)
    """

    def __init__(self, language: str = "english"):
        """
        Initialize document preprocessor

        Args:
            language: Language for processing
        """
        self.text_processor = TextPreprocessor(language)

    def split_sentences(self, text: str) -> List[str]:
        """
        Split text into sentences

        Args:
            text: Input text

        Returns:
            List of sentences
        """
        if not text:
            return []

        try:
            # Use NLTK sentence tokenization
            sentences = nltk.sent_tokenize(text)
        except LookupError:
            # Fallback to simple regex-based splitting
            sentences = re.split(r'[.!?]+', text)
            sentences = [s.strip() for s in sentences if s.strip()]

        return sentences

    def extract_keywords(self, text: str, max_keywords: int = 10) -> List[str]:
        """
        Extract key terms from document

        Args:
            text: Input document text
            max_keywords: Maximum number of keywords to return

        Returns:
            List of important keywords
        """
        if not text:
            return []

        # Preprocess text
        processed = self.text_processor.preprocess_for_analysis(text)
        tokens = processed['lemmatized_tokens']

        if not tokens:
            return []

        # Simple frequency-based keyword extraction
        # In a more advanced implementation, this could use TF-IDF or other methods
        word_freq = {}
        for token in tokens:
            if len(token) > 3:  # Skip very short words
                word_freq[token] = word_freq.get(token, 0) + 1

        # Sort by frequency and return top keywords
        sorted_keywords = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        keywords = [word for word, freq in sorted_keywords[:max_keywords]]

        return keywords

    def summarize_text(self, text: str, max_sentences: int = 3) -> str:
        """
        Simple extractive text summarization

        Args:
            text: Input text to summarize
            max_sentences: Maximum sentences in summary

        Returns:
            Summarized text
        """
        if not text:
            return ""

        sentences = self.split_sentences(text)

        if len(sentences) <= max_sentences:
            return text

        # Simple approach: take first and last sentences, plus middle ones
        # More advanced implementations would score sentences by importance
        summary_sentences = []

        # Always include first sentence
        summary_sentences.append(sentences[0])

        # Include middle sentences
        middle_start = len(sentences) // 3
        middle_end = 2 * len(sentences) // 3

        for i in range(middle_start, min(middle_end, len(sentences) - 1)):
            if len(summary_sentences) < max_sentences - 1:
                summary_sentences.append(sentences[i])

        # Include last sentence if space allows
        if len(summary_sentences) < max_sentences:
            summary_sentences.append(sentences[-1])

        return ' '.join(summary_sentences)


# Global instances for easy access
text_processor = TextPreprocessor()
document_processor = DocumentPreprocessor()
