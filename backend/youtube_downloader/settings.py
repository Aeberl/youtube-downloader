from pathlib import Path
from dotenv import load_dotenv
import os
import sys

load_dotenv()  # Load environment variables from .env file

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Determine FFmpeg path
FFMPEG_PATH = None

if os.name == 'nt':  # Windows
    # Check common locations
    possible_paths = [
        BASE_DIR / 'ffmpeg' / 'bin' / 'ffmpeg.exe',
        Path('C:\\ffmpeg\\bin\\ffmpeg.exe'),
        Path('C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe'),
        Path('C:\\Program Files (x86)\\ffmpeg\\bin\\ffmpeg.exe')
    ]
    
    for path in possible_paths:
        if path.exists():
            FFMPEG_PATH = str(path)
            break
    
    if not FFMPEG_PATH:
        FFMPEG_PATH = 'ffmpeg.exe'
        print("WARNING: Using ffmpeg.exe from system PATH", file=sys.stderr)
else:  # Linux/Mac
    # Standard Linux/Mac paths
    possible_paths = [
        '/usr/bin/ffmpeg',
        '/usr/local/bin/ffmpeg',
        '/opt/homebrew/bin/ffmpeg',
        BASE_DIR / 'ffmpeg' / 'ffmpeg'
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            FFMPEG_PATH = path
            break
    
    if not FFMPEG_PATH:
        FFMPEG_PATH = 'ffmpeg'
        print("WARNING: Using ffmpeg from system PATH", file=sys.stderr)

# Set environment variables
os.environ['FFMPEG_BINARY'] = FFMPEG_PATH
# Add to system PATH
os.environ['PATH'] = os.pathsep.join([
    os.environ['PATH'],
    os.path.dirname(FFMPEG_PATH)
])

print(f"Using FFmpeg at: {FFMPEG_PATH}")

    
# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('SECRET_KEY', 'fallback-key-for-dev-only')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG', 'False') == 'True'

ALLOWED_HOSTS = ['*']  # Allow all hosts for now


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'api',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Add for static file serving
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]


ROOT_URLCONF = 'youtube_downloader.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'build'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'youtube_downloader.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}


# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

STATIC_URL = 'static/'
STATICFILES_DIRS = [BASE_DIR / 'build' / 'static']  # Point to React's static files
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'


# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Add to the bottom of settings.py
if not DEBUG:
    # Security settings
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_SSL_REDIRECT = True
    
    