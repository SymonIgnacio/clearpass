"""
Text similarity and fuzzy matching utilities for Barangay AI Engine
Uses RapidFuzz for fast, lightweight string matching
"""

import re
from typing import List, Dict, Tuple, Optional, Any
from rapidfuzz import fuzz, process
from rapidfuzz.utils import default_process

class TextSimilarityEngine:
    """
    Text similarity engine using fuzzy string matching
    """

    def __init__(self, threshold: float = 70.0):
        """
        Initialize similarity engine

        Args:
            threshold: Minimum similarity score (0-100) for matches
        """
        self.threshold = threshold

    def calculate_similarity(self, text1: str, text2: str) -> float:
        """
        Calculate similarity score between two texts

        Args:
            text1: First text string
            text2: Second text string

        Returns:
            Similarity score (0-100)
        """
        # Use token-based similarity for better accuracy
        token_score = fuzz.token_sort_ratio(text1, text2)

        # Also check partial ratio for substring matches
        partial_score = fuzz.partial_ratio(text1, text2)

        # Return the higher score
        return max(token_score, partial_score)

    def find_best_match(self, query: str, candidates: List[str]) -> Tuple[Optional[str], float]:
        """
        Find the best matching candidate for a query

        Args:
            query: Query string to match
            candidates: List of candidate strings

        Returns:
            Tuple of (best_match, similarity_score) or (None, 0.0)
        """
        if not candidates:
            return None, 0.0

        # Use RapidFuzz extractOne for best performance
        result = process.extractOne(
            query,
            candidates,
            scorer=fuzz.token_sort_ratio,
            score_cutoff=self.threshold
        )

        if result:
            return result[0], result[1]
        return None, 0.0

    def find_all_matches(self, query: str, candidates: List[str],
                        limit: Optional[int] = None) -> List[Tuple[str, float]]:
        """
        Find all matches above threshold

        Args:
            query: Query string to match
            candidates: List of candidate strings
            limit: Maximum number of results to return

        Returns:
            List of (match, score) tuples, sorted by score descending
        """
        if not candidates:
            return []

        # Use RapidFuzz extract for multiple results
        results = process.extract(
            query,
            candidates,
            scorer=fuzz.token_sort_ratio,
            score_cutoff=self.threshold,
            limit=limit
        )

        return [(match, score) for match, score, _ in results]

    def preprocess_text(self, text: str) -> str:
        """
        Preprocess text for better matching

        Args:
            text: Input text

        Returns:
            Preprocessed text
        """
        if not text:
            return ""

        # Convert to lowercase
        text = text.lower()

        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()

        # Remove punctuation but keep important symbols
        text = re.sub(r'[^\w\s\-]', '', text)

        return text

    def extract_keywords(self, text: str) -> List[str]:
        """
        Extract potential keywords from text

        Args:
            text: Input text

        Returns:
            List of extracted keywords
        """
        if not text:
            return []

        # Preprocess text
        processed = self.preprocess_text(text)

        # Split into words
        words = processed.split()

        # Filter out common stop words
        stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
            'should', 'may', 'might', 'must', 'can', 'shall', 'what', 'where',
            'when', 'why', 'how', 'who', 'which', 'that', 'this', 'these', 'those'
        }

        keywords = [word for word in words if len(word) > 2 and word not in stop_words]

        # Remove duplicates while preserving order
        seen = set()
        unique_keywords = []
        for keyword in keywords:
            if keyword not in seen:
                unique_keywords.append(keyword)
                seen.add(keyword)

        return unique_keywords

    def match_keywords(self, query_keywords: List[str],
                      target_keywords: List[str]) -> float:
        """
        Match keyword lists and return similarity score

        Args:
            query_keywords: Keywords from query
            target_keywords: Keywords from target

        Returns:
            Similarity score based on keyword overlap
        """
        if not query_keywords or not target_keywords:
            return 0.0

        # Count matches
        matches = 0
        for query_kw in query_keywords:
            best_score = 0.0
            for target_kw in target_keywords:
                score = self.calculate_similarity(query_kw, target_kw)
                best_score = max(best_score, score)

            if best_score >= self.threshold:
                matches += 1

        # Calculate percentage of query keywords that matched
        if len(query_keywords) == 0:
            return 0.0

        match_percentage = (matches / len(query_keywords)) * 100

        # Also check reverse (how many target keywords match query)
        reverse_matches = 0
        for target_kw in target_keywords:
            best_score = 0.0
            for query_kw in query_keywords:
                score = self.calculate_similarity(target_kw, query_kw)
                best_score = max(best_score, score)

            if best_score >= self.threshold:
                reverse_matches += 1

        reverse_percentage = (reverse_matches / len(target_keywords)) * 100 if target_keywords else 0

        # Return average of both directions
        return (match_percentage + reverse_percentage) / 2


class IntentMatcher:
    """
    Intent classification using keyword-based rules
    """

    def __init__(self):
        """Initialize intent matcher"""
        self.intents = {}
        self.similarity_engine = TextSimilarityEngine()

    def add_intent(self, intent_name: str, keywords: List[str],
                  examples: Optional[List[str]] = None):
        """
        Add an intent with associated keywords

        Args:
            intent_name: Name of the intent
            keywords: Keywords associated with this intent
            examples: Example phrases for this intent
        """
        self.intents[intent_name] = {
            'keywords': keywords,
            'examples': examples or []
        }

    def classify_intent(self, text: str) -> Tuple[str, float]:
        """
        Classify text into an intent

        Args:
            text: Input text to classify

        Returns:
            Tuple of (intent_name, confidence_score)
        """
        if not text or not self.intents:
            return "unknown", 0.0

        text_keywords = self.similarity_engine.extract_keywords(text)
        best_intent = "unknown"
        best_score = 0.0

        for intent_name, intent_data in self.intents.items():
            intent_keywords = intent_data['keywords']

            # Calculate keyword similarity
            similarity_score = self.similarity_engine.match_keywords(
                text_keywords, intent_keywords
            )

            # Also check against examples if available
            if intent_data['examples']:
                example_score = 0.0
                for example in intent_data['examples']:
                    example_similarity = self.similarity_engine.calculate_similarity(text, example)
                    example_score = max(example_score, example_similarity)

                # Combine keyword and example scores
                combined_score = (similarity_score + example_score) / 2
            else:
                combined_score = similarity_score

            if combined_score > best_score:
                best_score = combined_score
                best_intent = intent_name

        # Only return intent if confidence is above threshold
        if best_score >= self.similarity_engine.threshold:
            return best_intent, best_score

        return "unknown", best_score


class FAQMatcher:
    """
    FAQ matching engine for question-answer pairs
    """

    def __init__(self):
        """Initialize FAQ matcher"""
        self.faqs = []
        self.similarity_engine = TextSimilarityEngine()

    def add_faq(self, question: str, answer: str, keywords: Optional[List[str]] = None):
        """
        Add a FAQ entry

        Args:
            question: The question
            answer: The answer
            keywords: Optional keywords for better matching
        """
        faq_entry = {
            'question': question,
            'answer': answer,
            'keywords': keywords or self.similarity_engine.extract_keywords(question)
        }
        self.faqs.append(faq_entry)

    def find_answer(self, query: str) -> Tuple[Optional[str], float]:
        """
        Find the best matching answer for a query

        Args:
            query: User query

        Returns:
            Tuple of (answer, confidence_score) or (None, 0.0)
        """
        if not query or not self.faqs:
            return None, 0.0

        query_keywords = self.similarity_engine.extract_keywords(query)
        best_answer = None
        best_score = 0.0

        for faq in self.faqs:
            # Check question similarity
            question_score = self.similarity_engine.calculate_similarity(query, faq['question'])

            # Check keyword similarity
            keyword_score = self.similarity_engine.match_keywords(
                query_keywords, faq['keywords']
            )

            # Combine scores (weighted average)
            combined_score = (question_score * 0.7) + (keyword_score * 0.3)

            if combined_score > best_score:
                best_score = combined_score
                best_answer = faq['answer']

        if best_score >= self.similarity_engine.threshold:
            return best_answer, best_score

        return None, best_score


# Global instances for easy access
similarity_engine = TextSimilarityEngine()
intent_matcher = IntentMatcher()
faq_matcher = FAQMatcher()
