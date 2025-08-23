# Use official Python runtime
FROM python:3.12-slim

# Prevent Python from writing .pyc files
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set working directory inside container
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy your code into the container
COPY . .

# Tell Cloud Run which port to use
ENV PORT=8080

# Run your app with uvicorn
CMD exec uvicorn app_server:app --host 0.0.0.0 --port $PORT
