"""
Logging utilities for Barangay AI Engine
Provides structured logging for all AI modules
"""

import logging
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional

class AILogger:
    """
    Custom logger for AI engine operations
    """

    def __init__(self, name: str = "BarangayAI", log_level: str = "INFO",
                 log_file: Optional[str] = None):
        """
        Initialize logger

        Args:
            name: Logger name
            log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
            log_file: Optional log file path
        """
        self.logger = logging.getLogger(name)
        self.logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))

        # Remove existing handlers to avoid duplicates
        self.logger.handlers.clear()

        # Create formatter
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - [%(module)s:%(funcName)s:%(lineno)d] - %(message)s'
        )

        # Console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
        self.logger.addHandler(console_handler)

        # File handler (if specified)
        if log_file:
            log_path = Path(log_file)
            log_path.parent.mkdir(exist_ok=True)

            file_handler = logging.FileHandler(log_file, encoding='utf-8')
            file_handler.setFormatter(formatter)
            self.logger.addHandler(file_handler)

        self._log_startup()

    def _log_startup(self):
        """Log system startup"""
        self.logger.info("🚀 Barangay AI Engine initialized")
        self.logger.info(f"📅 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    def debug(self, message: str, *args, **kwargs):
        """Log debug message"""
        self.logger.debug(message, *args, **kwargs)

    def info(self, message: str, *args, **kwargs):
        """Log info message"""
        self.logger.info(message, *args, **kwargs)

    def warning(self, message: str, *args, **kwargs):
        """Log warning message"""
        self.logger.warning(message, *args, **kwargs)

    def error(self, message: str, *args, **kwargs):
        """Log error message"""
        self.logger.error(message, *args, **kwargs)

    def critical(self, message: str, *args, **kwargs):
        """Log critical message"""
        self.logger.critical(message, *args, **kwargs)

    def log_performance(self, operation: str, duration: float, success: bool = True):
        """
        Log performance metrics

        Args:
            operation: Operation name
            duration: Duration in seconds
            success: Whether operation succeeded
        """
        status = "✅ SUCCESS" if success else "❌ FAILED"
        self.logger.info(f"⏱️  {operation} - {duration:.3f}s - {status}")

    def log_ai_operation(self, module: str, operation: str, input_text: str = "",
                        confidence: Optional[float] = None, result: str = ""):
        """
        Log AI operation details

        Args:
            module: AI module name (chatbot, analytics, ocr)
            operation: Operation performed
            input_text: Input text (truncated if too long)
            confidence: Confidence score (if applicable)
            result: Operation result summary
        """
        # Truncate input if too long
        if len(input_text) > 100:
            input_text = input_text[:97] + "..."

        # Truncate result if too long
        if len(result) > 100:
            result = result[:97] + "..."

        confidence_str = f" (confidence: {confidence:.1f}%)" if confidence is not None else ""

        self.logger.info(f"🤖 {module.upper()} - {operation}: '{input_text}'{confidence_str} → '{result}'")


class PerformanceTimer:
    """
    Context manager for timing operations
    """

    def __init__(self, logger: AILogger, operation_name: str):
        """
        Initialize timer

        Args:
            logger: Logger instance
            operation_name: Name of operation being timed
        """
        self.logger = logger
        self.operation_name = operation_name
        self.start_time = None
        self.end_time = None

    def __enter__(self):
        self.start_time = datetime.now()
        self.logger.debug(f"▶️  Starting: {self.operation_name}")
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.end_time = datetime.now()
        duration = (self.end_time - self.start_time).total_seconds()

        success = exc_type is None
        self.logger.log_performance(self.operation_name, duration, success)

        if not success:
            self.logger.error(f"Operation failed: {exc_val}")


# Global logger instance
ai_logger = AILogger(
    name="BarangayAI",
    log_level="INFO",
    log_file="logs/ai_engine.log"
)
