FROM python:3.13-slim

RUN apt-get update && apt-get install -y celery

RUN groupadd app && useradd -m -g app app
USER app

WORKDIR /app
COPY requirements-development.txt .
RUN pip install -r requirements-development.txt

COPY . .

EXPOSE 8000

# TODO: for production set up uvicorn or other production ready server!!
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]