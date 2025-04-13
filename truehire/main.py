from fastapi import FastAPI, HTTPException, Request, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional, Dict, Union, Any
from datetime import datetime, timedelta
import uuid
import json
import os
import random
import string
import traceback
import re
import asyncio
import aiofiles
import logging

app = FastAPI()

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Session management (in-memory for now)
sessions = {}

# Static directory
STATIC_DIR = "static"

# Serve static files
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Main page
@app.get("/")
async def read_root():
    return FileResponse("static/index.html")

# Role selection page
@app.get("/role-selection")
async def read_role_selection():
    return FileResponse("static/role_selection.html")

# Permissions page
@app.get("/permissions")
async def read_permissions():
    return FileResponse("static/permissions.html")

# Assessment page
@app.get("/assessment")
async def read_assessment():
    return FileResponse("static/assessment-combined.html")

# Interview page
@app.get("/interview")
async def read_interview():
    return FileResponse("static/interview.html")

# Role selection endpoint
@app.post("/api/select-role")
async def select_role(role_data: dict):
    session_id = str(uuid.uuid4())
    sessions[session_id] = {
        "role": role_data["role"],
        "experience": role_data["experience"],
        "assessment_completed": False,
        "interview_completed": False,
        "permissions": {
            "camera": False,
            "microphone": False,
            "screen": False
        }
    }
    return {"session_id": session_id}

# Update permissions endpoint
@app.post("/api/permissions")
async def update_permissions(permissions: dict):
    session_id = permissions.get("session_id")
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    sessions[session_id]["permissions"].update({
        "camera": permissions.get("camera", False),
        "microphone": permissions.get("microphone", False),
        "screen": permissions.get("screen", False)
    })
    
    return {"success": True}

# Get assessment questions based on role
@app.get("/api/assessment/questions/{session_id}")
async def get_assessment_questions(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    role = sessions[session_id]["role"]
    experience = sessions[session_id]["experience"]
    
    # Generate role and experience specific questions
    questions = generate_assessment_questions(role, experience)
    
    return {"questions": questions}

def generate_assessment_questions(role: str, experience: str):
    # Common questions for all roles
    common_questions = [
        {
            "question": "What is the primary purpose of version control systems?",
            "options": [
                "To track changes in source code over time",
                "To optimize code for performance",
                "To automatically fix bugs in the code",
                "To deploy applications to production"
            ],
            "correct_answer": "To track changes in source code over time"
        },
        {
            "question": "Which of the following is NOT a principle of Agile methodology?",
            "options": [
                "Customer collaboration over contract negotiation",
                "Responding to change over following a plan",
                "Comprehensive documentation over working software",
                "Individuals and interactions over processes and tools"
            ],
            "correct_answer": "Comprehensive documentation over working software"
        },
        {
            "question": "What is the purpose of a code review?",
            "options": [
                "To catch bugs and improve code quality",
                "To evaluate developer performance",
                "To assign blame for issues",
                "To determine developer salaries"
            ],
            "correct_answer": "To catch bugs and improve code quality"
        }
    ]
    
    # Role-specific questions
    role_questions = {
        "Software Developer": [
            {
                "question": "What is encapsulation in object-oriented programming?",
                "options": [
                    "The bundling of data and methods that operate on that data within a single unit",
                    "The ability of a class to inherit from multiple parent classes",
                    "The process of converting source code into machine code",
                    "The practice of writing self-documenting code"
                ],
                "correct_answer": "The bundling of data and methods that operate on that data within a single unit"
            },
            {
                "question": "What is a RESTful API?",
                "options": [
                    "An API that follows specific architectural constraints",
                    "An API that requires authentication",
                    "An API that only works with JavaScript",
                    "An API that performs better than GraphQL"
                ],
                "correct_answer": "An API that follows specific architectural constraints"
            },
            {
                "question": "Which data structure would be most efficient for implementing a priority queue?",
                "options": [
                    "Heap",
                    "Linked List",
                    "Array",
                    "Hash Table"
                ],
                "correct_answer": "Heap"
            }
        ],
        "Data Scientist": [
            {
                "question": "What is the bias-variance tradeoff in machine learning?",
                "options": [
                    "A balance between underfitting and overfitting",
                    "A balance between training time and model accuracy",
                    "A balance between model complexity and interpretability",
                    "A balance between supervised and unsupervised learning"
                ],
                "correct_answer": "A balance between underfitting and overfitting"
            },
            {
                "question": "Which of the following is NOT a supervised learning algorithm?",
                "options": [
                    "K-means clustering",
                    "Random Forest",
                    "Logistic Regression",
                    "Support Vector Machine"
                ],
                "correct_answer": "K-means clustering"
            },
            {
                "question": "What is the purpose of cross-validation in machine learning?",
                "options": [
                    "To evaluate model performance on unseen data",
                    "To clean and preprocess the data",
                    "To visualize model predictions",
                    "To optimize the learning rate"
                ],
                "correct_answer": "To evaluate model performance on unseen data"
            }
        ],
        "UX Designer": [
            {
                "question": "What is the purpose of a user persona?",
                "options": [
                    "To create a realistic representation of key user segments",
                    "To document the personality of the design team",
                    "To create fictional characters for marketing materials",
                    "To establish the company's brand identity"
                ],
                "correct_answer": "To create a realistic representation of key user segments"
            },
            {
                "question": "What is the principle of 'progressive disclosure' in UX design?",
                "options": [
                    "Showing only necessary information at each step of a process",
                    "Gradually revealing a new design to users over time",
                    "Using animations to reveal content as users scroll",
                    "Collecting increasing amounts of user data over time"
                ],
                "correct_answer": "Showing only necessary information at each step of a process"
            },
            {
                "question": "What is the primary goal of a heuristic evaluation?",
                "options": [
                    "To identify usability problems in a user interface",
                    "To test a design with real users",
                    "To generate new design ideas",
                    "To document the design process"
                ],
                "correct_answer": "To identify usability problems in a user interface"
            }
        ]
    }
    
    # Default to Software Developer if role not found
    role_specific = role_questions.get(role, role_questions["Software Developer"])
    
    # Combine questions
    all_questions = common_questions + role_specific
    
    # Randomize question order
    random.shuffle(all_questions)
    
    return all_questions[:5]  # Return 5 questions for the assessment

# Submit assessment endpoint
@app.post("/api/assessment/submit")
async def submit_assessment(assessment_data: dict):
    try:
        session_id = assessment_data.get("session_id")
        answers = assessment_data.get("answers", [])
        
        if not session_id or session_id not in sessions:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Calculate score
        score = 0
        total_questions = len(answers)
        
        if total_questions > 0:
            for answer in answers:
                if answer.get("selected") == answer.get("correct"):
                    score += 1
            
            score_percentage = (score / total_questions) * 100
            
            # Update session data
            sessions[session_id]["assessment_completed"] = True
            sessions[session_id]["assessment_score"] = score_percentage
            
            return {
                "success": True,
                "score": score_percentage,
                "total_questions": total_questions,
                "correct_answers": score
            }
        else:
            return {
                "success": False,
                "error": "No answers submitted"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit assessment: {str(e)}")

# Start interview endpoint
@app.post("/start_interview")
async def start_interview(request: Request):
    try:
        # Parse the request body
        data = await request.json()
        role = data.get("role", "Software Developer")
        experience = data.get("experience", "Mid-level")
        session_id = data.get("session_id")
        
        if not session_id:
            return JSONResponse(
                status_code=400,
                content={"error": "Missing session_id"}
            )
        
        # Generate interview questions based on role and experience
        questions = generate_interview_questions(role, experience)
        
        # Store the questions in the session
        sessions[session_id] = {
            "questions": questions,
            "current_question": 1,
            "total_questions": len(questions),
            "answers": {},
            "role": role,
            "experience": experience
        }
        
        # Get the first question
        first_question = questions[0]["question"]
        
        # Set headers with question info
        headers = {
            "X-Question-Text": first_question,
            "X-Current-Question": "1",
            "X-Total-Questions": str(len(questions))
        }
        
        # Return the response with headers
        return JSONResponse(
            content={"question": first_question, "success": True},
            headers=headers
        )
    except Exception as e:
        logging.error(f"Error starting interview: {str(e)}")
        logging.error(traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to start interview: {str(e)}"}
        )

@app.post("/submit_answer")
async def submit_answer(request: Request):
    try:
        form = await request.form()
        audio_file = form.get("audio")
        session_id = form.get("session_id")
        question_number = int(form.get("question_number", "1"))
        
        if not session_id or session_id not in sessions:
            return JSONResponse(
                status_code=400,
                content={"error": "Invalid or missing session_id"}
            )
        
        session = sessions[session_id]
        
        # Save the audio answer (in a real app, process this with speech-to-text)
        if audio_file:
            # Get the file content
            audio_content = await audio_file.read()
            
            # In a real app, you would process the audio with speech-to-text
            # and evaluate the answer, for now we'll just save it
            
            # Create a unique filename for the audio
            filename = f"answer_{session_id}_{question_number}.webm"
            
            # Ensure uploads directory exists
            uploads_dir = os.path.join("static", "uploads")
            os.makedirs(uploads_dir, exist_ok=True)
            
            file_path = os.path.join(uploads_dir, filename)
            
            # Save the file
            with open(file_path, "wb") as f:
                f.write(audio_content)
            
            # Store the answer in the session
            session["answers"][question_number] = {
                "audio_path": file_path,
                "feedback": "Good answer! You provided a clear and thoughtful response."
            }
        
        # Check if this was the last question
        if question_number >= session["total_questions"]:
            # Interview is complete
            return JSONResponse(content={
                "interview_complete": True,
                "redirect_url": f"/results?session_id={session_id}"
            })
        
        # Get the next question
        next_question_idx = question_number  # Current question is 1-based, list is 0-based
        if next_question_idx < len(session["questions"]):
            next_question = session["questions"][next_question_idx]["question"]
            return JSONResponse(content={
                "next_question": next_question,
                "current_question": question_number + 1,
                "total_questions": session["total_questions"]
            })
        else:
            # No more questions, interview complete
            return JSONResponse(content={
                "interview_complete": True,
                "redirect_url": f"/results?session_id={session_id}"
            })
    except Exception as e:
        logging.error(f"Error submitting answer: {str(e)}")
        logging.error(traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to process answer: {str(e)}"}
        )

def generate_interview_questions(role, experience):
    """Generate interview questions based on role and experience"""
    # Standard behavioral questions for all roles
    behavioral_questions = [
        {"question": "Tell me about a time when you faced a significant challenge at work. How did you overcome it?"},
        {"question": "Describe a situation where you had to work with a difficult team member. How did you handle it?"},
        {"question": "Give an example of a time when you had to adapt to a significant change at work. How did you approach it?"},
        {"question": "Describe a project where you demonstrated leadership skills. What was the outcome?"},
        {"question": "Tell me about a time when you failed at something. What did you learn from it?"}
    ]
    
    # Role-specific technical questions
    role_questions = {
        "Software Developer": [
            {"question": "Explain your approach to debugging a complex software issue. What steps do you take?"},
            {"question": "How do you ensure the code you write is maintainable and scalable?"},
            {"question": "Describe a time when you optimized a slow-performing piece of code or application."},
            {"question": "How do you stay updated with the latest programming languages and technologies?"},
            {"question": "Explain your experience with version control systems and your preferred workflow."}
        ],
        "Data Scientist": [
            {"question": "Describe a complex data analysis project you've worked on. What techniques did you use?"},
            {"question": "How do you validate your machine learning models and ensure they're reliable?"},
            {"question": "Explain how you would approach a dataset with significant missing values."},
            {"question": "How do you communicate technical findings to non-technical stakeholders?"},
            {"question": "Describe your experience with big data technologies and processing large datasets."}
        ],
        "Project Manager": [
            {"question": "How do you prioritize tasks when managing multiple projects with competing deadlines?"},
            {"question": "Describe how you handle scope creep in a project."},
            {"question": "What methodologies do you use to track project progress and report to stakeholders?"},
            {"question": "How do you motivate team members during challenging phases of a project?"},
            {"question": "Describe a time when you had to make a difficult decision that affected the timeline or budget of a project."}
        ]
    }
    
    # Default to Software Developer if role not found
    selected_role_questions = role_questions.get(role, role_questions["Software Developer"])
    
    # Select questions based on experience level
    if experience.lower() in ["beginner", "entry-level", "junior"]:
        # For beginners, focus more on behavioral and basic technical questions
        all_questions = behavioral_questions[:3] + selected_role_questions[:2]
    elif experience.lower() in ["advanced", "senior", "expert"]:
        # For advanced, focus more on complex technical and leadership questions
        all_questions = behavioral_questions[3:] + selected_role_questions[2:]
    else:
        # For mid-level, provide a balance
        all_questions = behavioral_questions[1:4] + selected_role_questions[1:3]
    
    # Shuffle the questions to keep interviews varied
    random.shuffle(all_questions)
    
    # Limit to 5 questions
    return all_questions[:5]

@app.get("/results")
async def results_page(request: Request, session_id: str = None):
    if not session_id or session_id not in sessions:
        return FileResponse("static/error.html")
    
    # Just serve the results page HTML
    return FileResponse("static/results.html")

@app.get("/api/results/{session_id}")
async def get_results_data(session_id: str):
    if not session_id or session_id not in sessions:
        return JSONResponse(
            status_code=404,
            content={"error": "Invalid session ID. Please start a new interview."}
        )
    
    session = sessions[session_id]
    
    # Prepare feedback data
    feedback = []
    for q_num, answer in session["answers"].items():
        question_idx = int(q_num) - 1
        if question_idx < len(session["questions"]):
            feedback.append({
                "question": session["questions"][question_idx]["question"],
                "feedback": answer["feedback"]
            })
    
    return JSONResponse(content={
        "session_id": session_id,
        "role": session["role"],
        "experience": session["experience"],
        "feedback": feedback
    })

# Logger setup
logging.basicConfig(level=logging.INFO)

# Run the app
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
