# TrueHire

## Overview

TrueHire is a comprehensive web application designed to streamline the hiring process by providing role-based assessments, AI-driven interviews, and proctoring features. It leverages FastAPI for backend services and serves static files for the frontend interface.

## Problem Statement

The hiring process can be cumbersome and inefficient, often requiring multiple tools and manual coordination. TrueHire aims to simplify this by providing a unified platform for role selection, permissions management, assessments, AI-driven interviews, and proctoring.

## Features

- **Role Selection**: Users can select their desired role and experience level.
- **Permissions Management**: Manage permissions for camera, microphone, and screen sharing.
- **Role-Based Assessments**: Generate and submit assessments tailored to the selected role.
- **AI-Driven Interviews**: Conduct interviews with role-specific questions and audio response recording.
- **Proctoring**: Ensure the integrity of the interview process with audio recording and session management.
- **Results**: View assessment and interview results.

## Directory Structure
truehire/
│
├── main.py # Main application file
├── static/ # Directory for static files
│ ├── index.html # Main page
│ ├── role_selection.html# Role selection page
│ ├── permissions.html # Permissions page
│ ├── assessment-combined.html # Assessment page
│ ├── interview.html # Interview page
│ └── uploads/ # Directory for storing uploaded audio files
├── transcripts/ # Directory for storing interview transcripts
├── temp_audio/ # Temporary storage for audio files
└── .gitignore # Git ignore file

## Libraries and Documentation

- **FastAPI**: A modern, fast (high-performance) web framework for building APIs with Python 3.7+ based on standard Python type hints.
  - Documentation: [FastAPI Docs](https://fastapi.tiangolo.com/)
- **Pydantic**: Data validation and settings management using Python type annotations.
  - Documentation: [Pydantic Docs](https://pydantic-docs.helpmanual.io/)
- **aiofiles**: File support for asyncio.
  - Documentation: [aiofiles GitHub](https://github.com/Tinche/aiofiles)
- **CORS Middleware**: Middleware for handling Cross-Origin Resource Sharing (CORS).
  - Documentation: [CORS Middleware Docs](https://fastapi.tiangolo.com/tutorial/cors/)

## API Endpoints

- **GET /**: Serve the main page.
- **GET /role-selection**: Serve the role selection page.
- **GET /permissions**: Serve the permissions page.
- **GET /assessment**: Serve the assessment page.
- **GET /interview**: Serve the interview page.
- **POST /api/select-role**: Select a role and create a session.
- **POST /api/permissions**: Update permissions for a session.
- **GET /api/assessment/questions/{session_id}**: Get assessment questions based on role.
- **POST /api/assessment/submit**: Submit assessment answers.
- **POST /start_interview**: Start the interview process.
- **POST /submit_answer**: Submit interview answers with audio recording.
- **GET /results**: View results page.
- **GET /api/results/{session_id}**: Get results data for a session.

## Configuration

### API Keys

To use the Whisper API and Deepeek R1 Model, you need to set up API keys. Follow these steps:

1. **Whisper API Key**: Obtain your API key from [Whisper API](https://openai.com/research/whisper) and set it in your environment variables:
   ```bash
   export WHISPER_API_KEY='your_whisper_api_key'
   ```

2. **Deepeek R1 Model Key**: Obtain your API key from [Deepeek AI](https://deepeek.ai/models/r1) and set it in your environment variables:
   ```bash
   export DEEPEEK_R1_API_KEY='your_deepeek_r1_api_key'
   ```

## Getting Started

### Prerequisites

- Python 3.7+
- FastAPI
- aiofiles

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd truehire
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the application:
   ```bash
   uvicorn main:app --reload
   ```

4. Access the application at `http://localhost:8000`.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
