import os

class Config:
    """Configuration class for AI Service"""

    # Flask configuration
    DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'
    try:
        PORT = int(os.environ.get('PORT', 5000))
    except (ValueError, TypeError):
        PORT = 5000

    # CORS settings
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:3001,http://localhost:5173').split(',')

    # Database settings (if needed in future)
    DB_HOST = os.environ.get('DB_HOST', 'localhost')
    DB_USER = os.environ.get('DB_USER', 'root')
    DB_PASSWORD = os.environ.get('DB_PASSWORD', '')
    DB_NAME = os.environ.get('DB_NAME', 'barangay_batia')

# Environment-specific configurations
class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False

# Configuration selector
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

def get_config():
    env = os.environ.get('FLASK_ENV', 'development')
    return config.get(env, config['default'])
