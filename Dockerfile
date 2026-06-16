FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y gcc && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir \
    fastapi==0.110.1 \
    uvicorn==0.25.0 \
    requests>=2.31.0 \
    python-dotenv>=1.0.1 \
    pymongo==4.5.0 \
    motor==3.3.1 \
    pydantic>=2.6.4 \
    email-validator>=2.2.0 \
    pyjwt>=2.10.1 \
    bcrypt==4.1.3 \
    passlib>=1.7.4 \
    python-multipart>=0.0.9 \
    pillow>=10.3.0 \
    python-jose>=3.3.0 \
    cryptography>=42.0.8 \
    stripe>=7.0.0 \
    mercadopago>=2.2.0

COPY backend/server.py .

# Copy the pre-built React frontend (built locally before docker build)
COPY frontend/build ./static

EXPOSE 8080

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8080"]
