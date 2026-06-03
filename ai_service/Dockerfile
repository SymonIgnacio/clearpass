FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=5001

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN useradd --create-home --shell /bin/bash app && \
    chown -R app:app /app
USER app

EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD python -c "import os, urllib.request; urllib.request.urlopen('http://127.0.0.1:%s/health' % os.environ.get('PORT', '5001'), timeout=5)"

CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-5001} --workers ${GUNICORN_WORKERS:-4} --threads ${GUNICORN_THREADS:-2} --worker-class gthread --timeout ${GUNICORN_TIMEOUT:-120} suggestion_engine:app"]
