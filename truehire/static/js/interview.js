// AI Interview JavaScript

// Global variables for interview state
let sessionId = localStorage.getItem('sessionId') || generateSessionId();
let interviewSessionId = null;
let currentQuestion = 1;
let totalQuestions = 5;
let currentQuestionText = '';
let isRecording = false;
let recordedChunks = [];
let mediaRecorder = null;
let micStream = null;
let recordingTimer = null;
let recordingDuration = 0;
let micActive = false;
let allPermissionsGranted = false;
let interviewStarted = false;

// Media state
let cameraActive = true;
let screenShareActive = true;
let localStream = null;
let screenStream = null;
let audioPlayerMuted = false;

// Track audio streams separately to prevent interference
let cameraStream = null;

// Interview state
let role = '';
let experience = '';
let interviewFinished = false;
let interviewTimestamp = new Date().toISOString();
let interviewTranscript = {
    sessionId: '',
    role: '',
    experience: '',
    timestamp: interviewTimestamp,
    responses: [],
    proctoring_logs: [] // Add proctoring logs array
};

// Proctoring state
let proctoringActive = false;
let sessionTerminated = false;
let tabVisibilityViolations = 0;
let fullscreenViolations = 0;
let mediaPermissionViolations = 0;
let lastProctoringLogTime = Date.now();
let proctoringInterval = null;
let visibilityChangeDetected = false;
let proctoringLog = [];
const MAX_VIOLATIONS = 1; // Maximum violations before session termination

// Constants
const minimumRecordingDuration = 10; // 10 seconds minimum
const maxRecordingDuration = 120; // 2 minutes maximum

// Helper function to generate a session ID if none exists
function generateSessionId() {
    const newId = 'session_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('sessionId', newId);
    console.log('Generated new session ID:', newId);
    return newId;
}

// Load permissions state from localStorage
const loadPersistedState = () => {
    const cameraPermissionState = localStorage.getItem('cameraPermission') === 'true';
    const micPermissionState = localStorage.getItem('microphonePermission') === 'true';
    const screenPermissionState = localStorage.getItem('screenPermission') === 'true';
    
    console.log('Loading persisted permissions:', { camera: cameraPermissionState, mic: micPermissionState, screen: screenPermissionState });
    
    if (cameraPermissionState) {
        setTimeout(() => {
            toggleCamera(true); // Silent activation
        }, 500);
    }
    
    if (micPermissionState) {
        setTimeout(() => {
            toggleMicrophone(true); // Silent activation
        }, 800);
    }
    
    if (screenPermissionState) {
        setTimeout(() => {
            toggleScreenShare(true); // Silent activation
        }, 1100);
    }
};

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    console.log('Interview page initialized');
    
    // Get role and experience from session
    role = localStorage.getItem('selectedRole') || 'Software Tech';
    experience = localStorage.getItem('selectedExperience') || '0+ years (Fresher)';
    
    // Initialize interview transcript
    interviewTranscript.sessionId = sessionId;
    interviewTranscript.role = role;
    interviewTranscript.experience = experience;
    
    // Permission section DOM elements
    const permissionsSection = document.getElementById('permissionsSection');
    const toggleCameraButton = document.getElementById('toggleCameraButton');
    const toggleMicButton = document.getElementById('toggleMicButton');
    const toggleScreenShareButton = document.getElementById('toggleScreenShareButton');
    const cameraStatus = document.getElementById('camera-status');
    const cameraStatusText = document.getElementById('camera-status-text');
    const micStatus = document.getElementById('mic-status');
    const micStatusText = document.getElementById('mic-status-text');
    const screenStatus = document.getElementById('screen-status');
    const screenStatusText = document.getElementById('screen-status-text');
    const videoElement = document.getElementById('videoElement');
    const videoPlaceholder = document.getElementById('videoPlaceholder');
    
    // Interview section DOM elements
    const questionCounter = document.getElementById('questionCounter');
    const interviewContainer = document.getElementById('interviewContainer');
    const audioPlayer = document.getElementById('audioPlayer');
    const recordButton = document.getElementById('recordButton');
    const recordingStatusText = document.getElementById('recordingStatusText');
    const recordingStatusIcon = document.getElementById('recordingStatusIcon');
    const progressBar = document.getElementById('progressBar');
    
    // Results section DOM elements
    const interviewSection = document.getElementById('interviewSection');
    const resultsSection = document.getElementById('resultsSection');
    const metricsContainer = document.getElementById('metricsContainer');
    const overallScore = document.getElementById('overallScore');
    const viewDetailsButton = document.getElementById('viewDetailsButton');
    const finishButton = document.getElementById('finishButton');

    // Pre-interview instructions section
    const preInterviewSection = document.createElement('div');
    preInterviewSection.id = 'preInterviewSection';
    preInterviewSection.className = 'pre-interview-section';
    preInterviewSection.innerHTML = `
        <h2>Before We Begin</h2>
        <p>Please ensure all permissions are granted for a smooth interview experience:</p>
        <ul>
            <li id="cameraStatusCheck">❌ Camera access</li>
            <li id="micStatusCheck">❌ Microphone access</li>
            <li id="screenStatusCheck">❌ Screen sharing</li>
        </ul>
        <p>Once all permissions are granted, you can start the interview.</p>
        <button id="startInterviewButton" class="btn-primary" disabled>Start Interview</button>
    `;
    
    if (interviewSection) {
        interviewSection.prepend(preInterviewSection);
    }
    
    const cameraStatusCheck = document.getElementById('cameraStatusCheck');
    const micStatusCheck = document.getElementById('micStatusCheck');
    const screenStatusCheck = document.getElementById('screenStatusCheck');
    
    // Get a reference to the startInterviewButton after adding it to the DOM
    const startInterviewButton = document.getElementById('startInterviewButton');
    
    // Hide interview questions initially
    const questionContainer = document.getElementById('interviewContainer');
    if (questionContainer) {
        questionContainer.style.display = 'none';
    }
    
    // Hide recording controls initially
    const actionsContainer = document.querySelector('.actions-container');
    if (actionsContainer) {
        actionsContainer.style.display = 'none';
    }
    
    // Initialize
    setupEventListeners();
    activateFullscreen();
    
    // Load persisted state after a short delay
    setTimeout(loadPersistedState, 1000);
    
    // Setup event listeners
    function setupEventListeners() {
        // Camera toggle
        if (toggleCameraButton) {
            toggleCameraButton.addEventListener('click', () => toggleCamera(false));
        }
        
        // Microphone toggle
        if (toggleMicButton) {
            toggleMicButton.addEventListener('click', () => toggleMicrophone(false));
        }
        
        // Screen share toggle
        if (toggleScreenShareButton) {
            toggleScreenShareButton.addEventListener('click', () => toggleScreenShare(false));
        }
        
        // Add event listener for the Start Interview button
        if (startInterviewButton) {
            startInterviewButton.addEventListener('click', () => {
                console.log('Start Interview button clicked');
                startInterview();
            });
        }
        
        // Record button
        if (recordButton) {
            recordButton.addEventListener('click', handleRecordButton);
        }
        
        // Handle audio player ended event
        if (audioPlayer) {
            audioPlayer.addEventListener('ended', function() {
                // Enable recording after audio playback ends
                if (recordButton) {
                    recordButton.disabled = false;
                    recordingStatusText.textContent = 'Ready to record your answer (minimum 10 seconds)';
                }
            });
        }
        
        // Visibility change detection for tab switching
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Fullscreen change detection
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);
        
        // Prevent context menu 
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            logProctoringViolation('Attempted to use context menu');
            return false;
        });
        
        // Prevent keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Block Alt+Tab, Ctrl+T, Ctrl+N, Alt+F4, etc.
            if (
                (e.altKey && (e.key === 'Tab' || e.key === 'F4')) ||
                (e.ctrlKey && (e.key === 't' || e.key === 'n' || e.key === 'w'))
            ) {
                e.preventDefault();
                logProctoringViolation(`Attempted to use blocked keyboard shortcut: ${e.key}`);
                return false;
            }
        });
        
        // Add media track ended event listeners
        window.addEventListener('mediaTrackEnded', handleMediaTrackEnded);
    }

    // Check if all permissions are granted and enable start button if they are
    function checkAllPermissions() {
        const allGranted = cameraActive && micActive && screenShareActive;
        
        // Update UI indicators
        if (cameraActive) {
            cameraStatusCheck.innerHTML = '✅ Camera access granted';
        } else {
            cameraStatusCheck.innerHTML = '❌ Camera access required';
        }
        
        if (micActive) {
            micStatusCheck.innerHTML = '✅ Microphone access granted';
        } else {
            micStatusCheck.innerHTML = '❌ Microphone access required';
        }
        
        if (screenShareActive) {
            screenStatusCheck.innerHTML = '✅ Screen sharing granted';
        } else {
            screenStatusCheck.innerHTML = '❌ Screen sharing required';
        }
        
        // Enable/disable start interview button
        const startInterviewButton = document.getElementById('startInterviewButton');
        if (startInterviewButton) {
            startInterviewButton.disabled = !allGranted;
            if (allGranted) {
                startInterviewButton.textContent = 'Start Interview';
                startInterviewButton.classList.add('ready');
                allPermissionsGranted = true;
                console.log('All permissions granted, interview ready to start');
            } else {
                allPermissionsGranted = false;
            }
        }
        
        return allGranted;
    }
    
    // Media permission functions
    async function toggleCamera(silentMode = false) {
        if (sessionTerminated) return;
        
        if (cameraActive) {
            // Turn off camera
            if (interviewStarted && !silentMode) {
                // Prevent turning off camera during interview
                logProctoringViolation('Attempted to turn off camera during interview');
                showWarningDialog('Camera must remain on during the interview');
                return;
            }
            
            if (localStream) {
                localStream.getVideoTracks().forEach(track => track.stop());
            }
            
            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
                cameraStream = null;
            }
            
            videoElement.srcObject = null;
            videoElement.style.display = 'none';
            videoPlaceholder.style.display = 'block';
            
            cameraActive = false;
            
            // Update UI
            toggleCameraButton.textContent = 'Turn On Camera';
            cameraStatus.classList.add('inactive');
            cameraStatus.classList.remove('active');
            cameraStatusText.textContent = 'Camera is inactive';
            
            if (interviewStarted && !silentMode) {
                terminateSession('Camera was turned off during the interview');
            }
        } else {
            try {
                // Request camera access with NO audio
                const constraints = { 
                    video: true,
                    audio: false  // Explicitly disable audio to prevent feedback
                };
                
                // Get video only stream
                cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
                
                if (localStream) {
                    // Create a new combined stream without audio from camera
                    const newStream = new MediaStream();
                    
                    // Add video track from camera
                    const videoTrack = cameraStream.getVideoTracks()[0];
                    newStream.addTrack(videoTrack);
                    
                    // Add existing audio track if present (from microphone)
                    if (micStream && micStream.getAudioTracks().length > 0) {
                        const audioTrack = micStream.getAudioTracks()[0];
                        newStream.addTrack(audioTrack);
                    }
                    
                    localStream = newStream;
                } else {
                    // Just use the camera stream with video only
                    localStream = cameraStream;
                }
                
                // Display camera feed
                videoElement.srcObject = localStream;
                videoElement.style.display = 'block';
                videoPlaceholder.style.display = 'none';
                
                // Add track ended event listener for proctoring
                cameraStream.getVideoTracks().forEach(track => {
                    track.addEventListener('ended', () => {
                        if (interviewStarted && !sessionTerminated) {
                            const event = new CustomEvent('mediaTrackEnded', {
                                detail: { type: 'camera', track: track }
                            });
                            window.dispatchEvent(event);
                        }
                    });
                });
                
                cameraActive = true;
                
                // Update UI
                toggleCameraButton.textContent = 'Turn Off Camera';
                cameraStatus.classList.remove('inactive');
                cameraStatus.classList.add('active');
                cameraStatusText.textContent = 'Camera is active';
                
            } catch (err) {
                console.error('Error accessing camera:', err);
                if (!silentMode) {
                    alert('Error accessing camera: ' + err.message);
                }
            }
        }
        
        // Check if all permissions are granted
        checkAllPermissions();
    }

    async function toggleMicrophone(silentMode = false) {
        if (sessionTerminated) return;
        
        if (micActive) {
            // Turn off microphone
            if (interviewStarted && !silentMode) {
                // Prevent turning off mic during interview
                logProctoringViolation('Attempted to turn off microphone during interview');
                showWarningDialog('Microphone must remain on during the interview');
                return;
            }
            
            if (localStream) {
                localStream.getAudioTracks().forEach(track => track.stop());
            }
            
            if (micStream) {
                micStream.getTracks().forEach(track => track.stop());
                micStream = null;
            }
            
            micActive = false;
            
            // Update UI
            toggleMicButton.textContent = 'Turn On Microphone';
            micStatus.classList.add('inactive');
            micStatus.classList.remove('active');
            micStatusText.textContent = 'Microphone is inactive';
            
            if (interviewStarted && !silentMode) {
                terminateSession('Microphone was turned off during the interview');
            }
        } else {
            try {
                // Request microphone access with enhanced echo cancellation
                const constraints = {
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    },
                    video: false  // Explicitly disable video to keep streams separate
                };
                
                // Get audio only stream
                micStream = await navigator.mediaDevices.getUserMedia(constraints);
                
                if (localStream) {
                    // Create a new combined stream with existing video and new audio
                    const newStream = new MediaStream();
                    
                    // Add existing video tracks if present
                    localStream.getVideoTracks().forEach(track => {
                        newStream.addTrack(track);
                    });
                    
                    // Add new audio track
                    const audioTrack = micStream.getAudioTracks()[0];
                    newStream.addTrack(audioTrack);
                    
                    localStream = newStream;
                } else {
                    // Just use the mic stream with audio only
                    localStream = micStream;
                }
                
                // Add track ended event listener for proctoring
                micStream.getAudioTracks().forEach(track => {
                    track.addEventListener('ended', () => {
                        if (interviewStarted && !sessionTerminated) {
                            const event = new CustomEvent('mediaTrackEnded', {
                                detail: { type: 'microphone', track: track }
                            });
                            window.dispatchEvent(event);
                        }
                    });
                });
                
                micActive = true;
                
                // Update UI
                toggleMicButton.textContent = 'Turn Off Microphone';
                micStatus.classList.remove('inactive');
                micStatus.classList.add('active');
                micStatusText.textContent = 'Microphone is active';
                
            } catch (err) {
                console.error('Error accessing microphone:', err);
                if (!silentMode) {
                    alert('Error accessing microphone: ' + err.message);
                }
            }
        }
        
        // Check if all permissions are granted
        checkAllPermissions();
    }

    async function toggleScreenShare(silentMode = false) {
        if (sessionTerminated) return;
        
        if (screenShareActive) {
            // Turn off screen sharing
            if (interviewStarted && !silentMode) {
                // Prevent turning off screen share during interview
                logProctoringViolation('Attempted to turn off screen sharing during interview');
                showWarningDialog('Screen sharing must remain on during the interview');
                return;
            }
            
            if (screenStream) {
                screenStream.getTracks().forEach(track => track.stop());
            }
            
            screenShareActive = false;
            
            // Update UI
            toggleScreenShareButton.textContent = 'Share Screen';
            screenStatus.classList.remove('active');
            screenStatus.classList.add('inactive');
            screenStatusText.textContent = 'Inactive';
            
            if (interviewStarted && !silentMode) {
                terminateSession('Screen sharing was turned off during the interview');
            }
        } else {
            try {
                // Force entire screen capture only
                const options = {
                    video: {
                        cursor: "always",
                        displaySurface: "monitor"
                    },
                    audio: false,
                    // This forces entire screen only - not allowing tabs or windows
                    preferCurrentTab: false,
                    selfBrowserSurface: "exclude",
                    systemAudio: "exclude",
                    surfaceSwitching: "exclude",
                    monitorTypeSurfaces: "include"
                };
                
                // Request screen sharing with strict options
                screenStream = await navigator.mediaDevices.getDisplayMedia(options);
                
                // Verify if the user selected the entire screen
                // Unfortunately, the API does not always tell us this directly
                // So we'll check the track settings as a best effort
                const track = screenStream.getVideoTracks()[0];
                const settings = track.getSettings();
                
                console.log('Screen share settings:', settings);
                
                // Listen for the end of screen sharing
                screenStream.getVideoTracks().forEach(track => {
                    track.addEventListener('ended', () => {
                        // This is triggered when the user stops sharing the screen
                        if (interviewStarted && !sessionTerminated) {
                            const event = new CustomEvent('mediaTrackEnded', {
                                detail: { type: 'screen', track: track }
                            });
                            window.dispatchEvent(event);
                        } else {
                            // Just update the UI if we're not in the interview
                            screenShareActive = false;
                            toggleScreenShareButton.textContent = 'Share Screen';
                            screenStatus.classList.remove('active');
                            screenStatus.classList.add('inactive');
                            screenStatusText.textContent = 'Inactive';
                        }
                    });
                });
                
                screenShareActive = true;
                
                // Update UI
                toggleScreenShareButton.textContent = 'Stop Screen Share';
                screenStatus.classList.remove('inactive');
                screenStatus.classList.add('active');
                screenStatusText.textContent = 'Active';
                
                // Add warning about screen share requirements
                if (!silentMode) {
                    showWarningDialog('You must keep sharing your entire screen during the interview. Stopping the screen share or switching to a window/tab share will terminate the session.');
                }
                
                console.log('Screen sharing enabled');
            } catch (error) {
                console.error('Error sharing screen:', error);
                
                if (!silentMode) {
                    // Show error message
                    showError(document.getElementById('mainContent'), 'Failed to share screen. Please ensure you grant the necessary permissions.');
                }
                
                screenShareActive = false;
                toggleScreenShareButton.textContent = 'Share Screen';
                screenStatus.classList.remove('active');
                screenStatus.classList.add('inactive');
                screenStatusText.textContent = 'Inactive';
            }
        }
    }
    
    try {
        // Show loading state
        showLoading(interviewContainer, 'Starting interview...');
        
        // Hide pre-interview section and show interview container
        const preInterviewSection = document.getElementById('preInterviewSection');
        if (preInterviewSection) {
            preInterviewSection.style.display = 'none';
        }
        
        if (interviewContainer) {
            interviewContainer.style.display = 'block';
        }
        
        // Get role and experience from localStorage
        role = localStorage.getItem('selectedRole') || 'Software Developer';
        experience = localStorage.getItem('experienceLevel') || 'Mid-level';
        
        console.log('Starting interview for role:', role, 'with experience:', experience);
        
        // Make API request to start a new interview
        const response = await fetch('/start_interview', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                role: role,
                difficulty: experience === 'Entry-level' ? 'easy' : (experience === 'Senior' ? 'hard' : 'medium'),
                duration: 3 // 3 minutes interview
            })
        });
        
        if (!response.ok) {
            throw new Error(`Failed to start interview: ${response.status}`);
        }
        
        // Get question info from headers
        const questionText = response.headers.get('X-Question-Text');
        const currentQuestionNum = parseInt(response.headers.get('X-Current-Question') || '1');
        const totalQuestionsNum = parseInt(response.headers.get('X-Total-Questions') || '5');
        
        // Parse and extract data
        if (questionText) {
            // From headers
            currentQuestionText = questionText;
            currentQuestion = currentQuestionNum;
            totalQuestions = totalQuestionsNum;
        } else {
            // Try to parse as JSON if no headers
            const data = await response.json();
            if (data.content) {
                currentQuestionText = data.content;
                currentQuestion = data.current_question || 1;
                totalQuestions = data.total_questions || 5;
            } else {
                throw new Error('No question received from server');
            }
        }
        
        // Display the question
        displayQuestion(currentQuestionText);
        
        // Check if we received audio
        const contentType = response.headers.get('Content-Type');
        if (contentType && contentType.includes('audio')) {
            // Get the audio blob
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // Play the audio
            const audioPlayer = document.getElementById('audioPlayer');
            if (audioPlayer) {
                audioPlayer.src = audioUrl;
                audioPlayer.play();
            }
        } else {
            // If no audio received, try to get audio for the question
            try {
                const audioResponse = await fetch(`/get_audio_question?text=${encodeURIComponent(currentQuestionText)}`);
                if (audioResponse.ok) {
                    const audioBlob = await audioResponse.blob();
                    const audioUrl = URL.createObjectURL(audioBlob);
                    
                    // Play the audio
                    const audioPlayer = document.getElementById('audioPlayer');
                    if (audioPlayer) {
                        audioPlayer.src = audioUrl;
                        audioPlayer.play();
                    }
                }
            } catch (audioError) {
                console.error('Error getting audio for question:', audioError);
            }
        }
        
        // Start proctoring
        startProctoring();
        
        // Set interview as started
        interviewStarted = true;
        
    } catch (error) {
        console.error('Error starting interview:', error);
        showError(interviewContainer, `Failed to start interview: ${error.message}. Please try again.`);
        
        // Show pre-interview section again
        const preInterviewSection = document.getElementById('preInterviewSection');
        if (preInterviewSection) {
            preInterviewSection.style.display = 'block';
        }
    }
}

    // Function to display the question with the original UI
    function displayQuestion(questionText) {
        if (!interviewContainer) return;
        
        // Clear any previous content
        interviewContainer.innerHTML = `
            <h1 class="interview-title">AI Interview</h1>
            <div class="question-text">${questionText || 'No question available'}</div>
        `;
        
        // Show the actions container
        const actionsContainer = document.querySelector('.actions-container');
        if (actionsContainer) {
            actionsContainer.style.display = 'flex';
        }
        
        // Update question counter
        if (questionCounter) {
            questionCounter.textContent = `Question ${currentQuestion} of ${totalQuestions}`;
        }
        
        // Update progress bar
        if (progressBar) {
            const progress = (currentQuestion / totalQuestions) * 100;
            progressBar.style.width = `${progress}%`;
        }
        
        // Enable the record button
        if (recordButton) {
            recordButton.disabled = false;
            recordButton.textContent = 'Start Recording';
            recordButton.classList.remove('recording');
        }
        
        // Reset recording status
        if (recordingStatusText) {
            recordingStatusText.textContent = 'Ready to record your answer';
        }
        
        // Disable continue button
        const continueButton = document.getElementById('continueButton');
        if (continueButton) {
            continueButton.disabled = true;
        }
    }

    async function handleRecordButton() {
        if (!micActive) {
            alert('Please enable your microphone before recording your answer.');
            return;
        }
        
        if (isRecording) {
            if (recordingDuration < minimumRecordingDuration) {
                alert(`Please continue recording for at least ${minimumRecordingDuration} seconds.`);
                return;
            }
            stopRecording();
        } else {
            startRecording();
        }
    }

    async function startRecording() {
        console.log("Starting recording...");
        
        // Reset recorded chunks
        recordedChunks = [];
        
        try {
            // Make sure the audio player is muted during recording
            if (audioPlayer) {
                audioPlayerMuted = audioPlayer.muted;
                audioPlayer.muted = true;
                audioPlayer.pause();
            }
            
            // Simple approach - get a dedicated recording stream
            const constraints = {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            };
            
            console.log("Requesting microphone access with constraints:", JSON.stringify(constraints));
            
            try {
                // Get fresh audio stream specifically for recording
                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                console.log("Got microphone stream with tracks:", stream.getTracks().length);
                
                // Log the track details for debugging
                stream.getTracks().forEach(track => {
                    console.log(`Track: ${track.kind}, state: ${track.readyState}, id: ${track.id}`);
                });
                
                // Check that we actually got a valid audio track
                if (stream.getAudioTracks().length === 0) {
                    throw new Error("No audio track was obtained from microphone");
                }
                
                const audioTrack = stream.getAudioTracks()[0];
                if (audioTrack.readyState !== 'live') {
                    throw new Error(`Audio track is not live: ${audioTrack.readyState}`);
                }
                
                // Start recording
                startRecordingWithStream(stream);
            } catch (err) {
                console.error("Error accessing microphone:", err);
                
                // Try a different approach with existing stream if available
                if (micStream && micStream.getAudioTracks().length > 0 && 
                    micStream.getAudioTracks()[0].readyState === 'live') {
                    
                    console.log("Falling back to existing micStream");
                    const audioTrack = micStream.getAudioTracks()[0];
                    const newStream = new MediaStream([audioTrack]);
                    startRecordingWithStream(newStream);
                } else {
                    throw new Error("Failed to access microphone after fallback attempt");
                }
            }
        } catch (error) {
            console.error('Error accessing microphone for recording:', error);
            
            // Restore audio player
            if (audioPlayer && audioPlayerMuted !== undefined) {
                audioPlayer.muted = audioPlayerMuted;
            }
            
            // Update UI
            recordButton.textContent = 'Start Recording';
            recordButton.classList.remove('recording');
            
            showError(interviewContainer, 'Failed to access microphone. Please check your microphone permissions and try again.');
        }
    }

    function startRecordingWithStream(stream) {
        try {
            console.log('Starting recording with stream...', stream);
            
            // Make sure we have valid audio tracks
            if (!stream || stream.getAudioTracks().length === 0) {
                throw new Error("No audio tracks available in the stream");
            }
            
            // Configure MediaRecorder with appropriate options for maximum compatibility
            let options = {};
            
            // Try different MIME types in order of preference
            const mimeTypes = [
                'audio/webm',
                'audio/mp4',
                'audio/ogg',
                'audio/wav'
            ];
            
            // Find the first supported MIME type
            for (const mimeType of mimeTypes) {
                if (MediaRecorder.isTypeSupported(mimeType)) {
                    options = { 
                        mimeType: mimeType,
                        audioBitsPerSecond: 128000 
                    };
                    console.log(`Using supported MIME type: ${mimeType}`);
                    break;
                }
            }
            
            // Create the MediaRecorder with the best options
            try {
                mediaRecorder = new MediaRecorder(stream, options);
                console.log("MediaRecorder created with options:", options);
            } catch (e) {
                console.warn(`MediaRecorder creation failed with options, trying without options`);
                mediaRecorder = new MediaRecorder(stream);
                console.log("MediaRecorder created without options");
            }
            
            // Set up event handlers
            mediaRecorder.ondataavailable = (event) => {
                console.log("Data available event, size:", event.data.size);
                if (event.data && event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
            };
            
            mediaRecorder.onstop = () => {
                console.log('MediaRecorder stopped - chunks:', recordedChunks.length);
                
                // Restore audio player state
                if (audioPlayer && audioPlayerMuted !== undefined) {
                    audioPlayer.muted = audioPlayerMuted;
                }
                
                // Clean up the recording stream
                stream.getTracks().forEach(track => track.stop());
                
                // Create the audio blob
                const mimeType = mediaRecorder.mimeType || 'audio/webm';
                const audioBlob = new Blob(recordedChunks, { type: mimeType });
                console.log("Recording complete:", audioBlob.size, "bytes, type:", mimeType);
                
                // Check if we got actual data
                if (audioBlob.size > 0) {
                    submitRecording(audioBlob);
                } else {
                    console.error("Empty recording");
                    
                    // Try to recover by creating a fallback audio blob
                    const emptyAudioArrayBuffer = createEmptyAudioBuffer();
                    if (emptyAudioArrayBuffer) {
                        const fallbackBlob = new Blob([emptyAudioArrayBuffer], { type: 'audio/wav' });
                        console.log("Created fallback audio blob:", fallbackBlob.size, "bytes");
                        submitRecording(fallbackBlob);
                        return;
                    }
                    
                    showError(interviewContainer, "Recording failed - no audio was captured. Please try again.");
                    
                    // Reset UI
                    recordButton.disabled = false;
                    recordButton.textContent = 'Start Recording';
                    recordButton.classList.remove('recording');
                    isRecording = false;
                    
                    // Reset timer display
                    recordingTimerDisplay.textContent = '00:00';
                    recordingTimerDisplay.classList.remove('recording');
                    recordingStatusText.textContent = 'Ready to record';
                }
            };
            
            mediaRecorder.onerror = (event) => {
                console.error("MediaRecorder error:", event);
                showError(interviewContainer, "Recording error occurred. Please try again.");
            };
            
            // Make sure to request data frequently to see if recording is actually working
            mediaRecorder.start(1000); // Request data every second
            console.log("MediaRecorder started");
            isRecording = true;
            
            // Update UI
            recordButton.textContent = 'Recording...';
            recordButton.classList.add('recording');
            
            // Update timer display
            recordingTimerDisplay.classList.add('recording');
            recordingStatusText.textContent = 'Recording in progress';
            
            // Start recording timer
            recordingDuration = 0;
            recordingTimer = setInterval(() => {
                recordingDuration++;
                const minutes = Math.floor(recordingDuration / 60);
                const seconds = recordingDuration % 60;
                
                // Update timer display if it exists
                if (recordingTimerDisplay) {
                    recordingTimerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                }
                
                // Enable stop button after minimum recording time
                if (recordingDuration >= minimumRecordingDuration && recordButton.disabled) {
                    recordButton.disabled = false;
                    recordButton.textContent = 'Stop Recording';
                } else if (recordingDuration < minimumRecordingDuration) {
                    recordButton.disabled = true; 
                    recordButton.textContent = `Recording... (${minimumRecordingDuration - recordingDuration}s more)`;
                }
                
                // Auto-stop recording after maxRecordingDuration (120 seconds)
                if (recordingDuration >= maxRecordingDuration) {
                    console.log('Auto-stopping recording after maximum duration');
                    stopRecording();
                }
            }, 1000);
            
            console.log('Recording started successfully');
            
        } catch (error) {
            console.error('Error in startRecordingWithStream:', error);
            
            // Restore audio player
            if (audioPlayer && audioPlayerMuted !== undefined) {
                audioPlayer.muted = audioPlayerMuted;
            }
            
            // Clean up stream if it exists
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            
            isRecording = false;
            recordButton.textContent = 'Start Recording';
            recordButton.classList.remove('recording');
            
            // Reset timer display
            recordingTimerDisplay.textContent = '00:00';
            recordingTimerDisplay.classList.remove('recording');
            recordingStatusText.textContent = 'Recording failed';
            
            showError(interviewContainer, 'Failed to start recording. Please check your microphone permissions and try again.');
        }
    }
    
    // Create an empty audio buffer as a fallback
    function createEmptyAudioBuffer() {
        try {
            // Create a 3-second silent audio buffer
            const sampleRate = 44100;
            const lengthInSamples = sampleRate * 3; // 3 seconds
            
            // Create WAV header
            const buffer = new ArrayBuffer(44 + lengthInSamples * 2);
            const view = new DataView(buffer);
            
            // RIFF chunk descriptor
            writeString(view, 0, 'RIFF');
            view.setUint32(4, 36 + lengthInSamples * 2, true);
            writeString(view, 8, 'WAVE');
            
            // "fmt " sub-chunk
            writeString(view, 12, 'fmt ');
            view.setUint32(16, 16, true); // subchunk1Size
            view.setUint16(20, 1, true); // audioFormat (PCM)
            view.setUint16(22, 1, true); // numChannels (mono)
            view.setUint32(24, sampleRate, true); // sampleRate
            view.setUint32(28, sampleRate * 2, true); // byteRate
            view.setUint16(32, 2, true); // blockAlign
            view.setUint16(34, 16, true); // bitsPerSample
            
            // "data" sub-chunk
            writeString(view, 36, 'data');
            view.setUint32(40, lengthInSamples * 2, true); // subchunk2Size
            
            // Fill with silence
            for (let i = 0; i < lengthInSamples; i++) {
                view.setInt16(44 + i * 2, 0, true);
            }
            
            return buffer;
        } catch (e) {
            console.error("Error creating empty audio buffer:", e);
            return null;
        }
    }
    
    function writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }
    
    // Submit recording for processing
    async function submitRecording(audioBlob) {
        if (!audioBlob || audioBlob.size === 0) {
            console.error("No audio data to submit");
            showError(interviewContainer, "No audio was recorded. Please try again.");
            return;
        }
        
        try {
            console.log('Submitting recording, blob size:', audioBlob.size);
            
            // Show loading state
            showLoading(interviewContainer, 'Processing your answer...');
            
            // Create form data with the audio blob
            const formData = new FormData();
            formData.append('audio', audioBlob, 'answer.webm');
            formData.append('session_id', interviewSessionId || sessionId);
            formData.append('question_number', currentQuestion);
            formData.append('role', role);
            formData.append('question', currentQuestionText);
            
            // Send the recording to the server
            const response = await fetch('/submit_answer', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server returned ${response.status}: ${errorText || 'Unknown error'}`);
            }
            
            // Try to get the next question
            const data = await response.json();
            console.log('Server response:', data);
            
            if (data.interview_complete || currentQuestion >= totalQuestions) {
                // Interview is complete, show the results section
                console.log('Interview complete, showing results section');
                
                // Hide interview container
                if (interviewContainer) {
                    interviewContainer.style.display = 'none';
                }
                
                // Show results section
                const resultsSection = document.getElementById('resultsSection');
                if (resultsSection) {
                    resultsSection.style.display = 'block';
                    
                    // Add event listener to finish button to redirect to job matching
                    const finishButton = document.getElementById('finishButton');
                    if (finishButton) {
                        finishButton.addEventListener('click', function() {
                            window.location.href = '/static/job_matching.html';
                        });
                    }
                }
                return;
            }
            
            // Get the next question
            if (data.next_question) {
                currentQuestionText = data.next_question;
                currentQuestion++;
                
                // Update the UI with the new question
                displayQuestion(currentQuestionText);
                
                // Reset recording state
                recordedChunks = [];
                recordingDuration = 0;
                if (timerDisplay) {
                    timerDisplay.textContent = '00:00';
                }
                
                console.log('Next question loaded successfully');
            } else {
                throw new Error('No next question received from server');
            }
        } catch (error) {
            console.error('Error submitting answer:', error);
            showError(interviewContainer, `Failed to submit your answer: ${error.message}. Please try again.`);
            
            // Enable the record button to try again
            if (recordButton) {
                recordButton.disabled = false;
            }
        }
    }

    // Parse and normalize response headers
    function parseResponseHeaders(response) {
        // Create a normalized object with header names as lowercase
        const headers = {};
        
        // Process all headers
        for (const [key, value] of response.headers.entries()) {
            const normalizedKey = key.toLowerCase().replace(/^x-/, '');
            headers[normalizedKey] = value;
        }
        
        // Log headers for debugging
        console.log('Response headers:', headers);
        
        return headers;
    }

    function stopRecording() {
        if (isRecording && mediaRecorder) {
            console.log('Stopping recording...');
            try {
                mediaRecorder.stop();
                clearInterval(recordingTimer);
                recordingTimer = null;
            } catch (e) {
                console.error('Error stopping recording:', e);
            }
        }
    }

    // Utility functions
    function showLoading(container, message = 'Loading...') {
        if (!container) return;
        
        container.innerHTML = `
            <div class="loading-container">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        `;
    }

    function showError(container, message) {
        if (!container) return;
        
        container.innerHTML = `
            <div class="error-container">
                <p>${message}</p>
                <button onclick="window.location.reload()">Retry</button>
            </div>
        `;
    }

    // Fullscreen functions
    function activateFullscreen() {
        try {
            const element = document.documentElement;
            
            if (element.requestFullscreen) {
                element.requestFullscreen();
            } else if (element.mozRequestFullScreen) { // Firefox
                element.mozRequestFullScreen();
            } else if (element.webkitRequestFullscreen) { // Chrome, Safari, Opera
                element.webkitRequestFullscreen();
            } else if (element.msRequestFullscreen) { // IE/Edge
                element.msRequestFullscreen();
            }
            
            console.log('Entered fullscreen mode');
        } catch (error) {
            console.error('Failed to enter fullscreen mode:', error);
        }
    }

    function handleFullscreenChange() {
        if (!document.fullscreenElement && 
            !document.webkitFullscreenElement && 
            !document.mozFullScreenElement && 
            !document.msFullscreenElement) {
            // Fullscreen was exited, try to re-enter if not finished
            if (!interviewFinished) {
                console.log('Fullscreen mode exited. Attempting to reenter...');
                setTimeout(activateFullscreen, 1000);
            }
        }
    }

    // Proctoring functions
    function startProctoring() {
        proctoringActive = true;
        proctoringInterval = setInterval(() => {
            // Check for tab visibility
            if (document.hidden) {
                tabVisibilityViolations++;
                logProctoringViolation('Tab visibility violation');
            }
            
            // Check for fullscreen mode
            if (!document.fullscreenElement && 
                !document.webkitFullscreenElement && 
                !document.mozFullScreenElement && 
                !document.msFullscreenElement) {
                fullscreenViolations++;
                logProctoringViolation('Fullscreen mode exited');
            }
            
            // Check for media permissions
            if (!cameraActive || !micActive || !screenShareActive) {
                mediaPermissionViolations++;
                logProctoringViolation('Media permission violation');
            }
            
            // Check for violations
            if (tabVisibilityViolations >= MAX_VIOLATIONS || 
                fullscreenViolations >= MAX_VIOLATIONS || 
                mediaPermissionViolations >= MAX_VIOLATIONS) {
                terminateSession('Proctoring violations exceeded');
            }
        }, 1000);
    }

    function logProctoringViolation(message) {
        const logEntry = {
            timestamp: Date.now(),
            message: message
        };
        proctoringLog.push(logEntry);
        console.log('Proctoring log:', logEntry);
    }

    function terminateSession(reason) {
        sessionTerminated = true;
        clearInterval(proctoringInterval);
        proctoringInterval = null;
        console.log('Session terminated:', reason);
        alert('Session terminated due to proctoring violation: ' + reason);
    }

    // Handle visibility change for tab switching detection
    function handleVisibilityChange() {
        if (document.hidden && interviewStarted && !sessionTerminated) {
            visibilityChangeDetected = true;
            tabVisibilityViolations++;
            logProctoringViolation('Tab switching detected');
            
            if (tabVisibilityViolations >= MAX_VIOLATIONS) {
                terminateSession('Multiple tab switching violations detected');
            } else {
                // Show warning when user returns
                setTimeout(() => {
                    if (!document.hidden && visibilityChangeDetected) {
                        visibilityChangeDetected = false;
                        showWarningDialog('WARNING: Tab switching is not allowed during the interview. Further violations will terminate your session.');
                    }
                }, 300);
            }
        }
    }

    // Handle media track ended events
    function handleMediaTrackEnded(event) {
        if (!interviewStarted || sessionTerminated) return;
        
        const type = event.detail.type;
        
        if (type === 'camera') {
            cameraActive = false;
            mediaPermissionViolations++;
            logProctoringViolation('Camera was turned off during interview');
            
            if (mediaPermissionViolations >= MAX_VIOLATIONS) {
                terminateSession('Camera was disabled multiple times during the interview');
            } else {
                showWarningDialog('WARNING: Camera must remain on during the interview. Attempting to reconnect...');
                toggleCamera(true);
            }
        } else if (type === 'microphone') {
            micActive = false;
            mediaPermissionViolations++;
            logProctoringViolation('Microphone was muted during interview');
            
            if (mediaPermissionViolations >= MAX_VIOLATIONS) {
                terminateSession('Microphone was disabled multiple times during the interview');
            } else {
                showWarningDialog('WARNING: Microphone must remain on during the interview. Attempting to reconnect...');
                toggleMicrophone(true);
            }
        } else if (type === 'screen') {
            screenShareActive = false;
            mediaPermissionViolations++;
            logProctoringViolation('Screen sharing was stopped during interview');
            
            if (mediaPermissionViolations >= MAX_VIOLATIONS) {
                terminateSession('Screen sharing was stopped multiple times during the interview');
            } else {
                showWarningDialog('WARNING: Screen sharing must remain active during the interview. Attempting to reconnect...');
                toggleScreenShare(true);
            }
        }
    }

    function handleFullscreenChange() {
        if (!document.fullscreenElement && 
            !document.webkitFullscreenElement && 
            !document.mozFullScreenElement && 
            !document.msFullscreenElement) {
            // Fullscreen was exited
            if (interviewStarted && !sessionTerminated) {
                fullscreenViolations++;
                logProctoringViolation('Fullscreen mode exited');
                
                if (fullscreenViolations >= MAX_VIOLATIONS) {
                    terminateSession('Multiple fullscreen exit violations detected');
                } else {
                    showWarningDialog('WARNING: Fullscreen mode is required. Returning to fullscreen...');
                    setTimeout(activateFullscreen, 1000);
                }
            }
        }
    }

    // Show warning dialog
    function showWarningDialog(message) {
        const warningOverlay = document.createElement('div');
        warningOverlay.className = 'warning-overlay';
        warningOverlay.innerHTML = `
            <div class="warning-dialog">
                <div class="warning-icon">⚠️</div>
                <div class="warning-message">${message}</div>
                <button class="warning-button">OK</button>
            </div>
        `;
        
        document.body.appendChild(warningOverlay);
        
        // Add click event to the button
        const warningButton = warningOverlay.querySelector('.warning-button');
        warningButton.addEventListener('click', () => {
            warningOverlay.remove();
        });
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            if (document.body.contains(warningOverlay)) {
                warningOverlay.remove();
            }
        }, 5000);
    }

    // Clean up when navigating away
    window.addEventListener('beforeunload', () => {
        // Save state
        localStorage.setItem('cameraPermission', cameraActive);
        localStorage.setItem('microphonePermission', micActive);
        localStorage.setItem('screenPermission', screenShareActive);
        
        // Revoke any object URLs
        if (currentAudioUrl) {
            URL.revokeObjectURL(currentAudioUrl);
        }
        
        // Stop recording if active
        if (isRecording && mediaRecorder) {
            mediaRecorder.stop();
            isRecording = false;
        }
        
        // Stop tracks
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        
        if (screenStream) {
            screenStream.getTracks().forEach(track => track.stop());
        }
        
        // Clear timers
        if (recordingTimer) {
            clearInterval(recordingTimer);
        }
    });

    // Create and initialize UI elements
    function initializeUI() {
        // Create main container
        interviewContainer = document.createElement('div');
        interviewContainer.id = 'interviewContainer';
        interviewContainer.className = 'interview-container';
        
        // Create header
        const header = document.createElement('div');
        header.className = 'interview-header';
        header.innerHTML = `
            <h1>AI Interview</h1>
            <div class="interview-controls">
                <div class="interview-progress">
                    <span id="questionCounter">Question 0 of 0</span>
                    <div class="progress-bar">
                        <div id="progressIndicator" class="progress-indicator"></div>
                    </div>
                </div>
            </div>
        `;
        
        // Add timer display to header
        const timerDisplay = document.createElement('div');
        timerDisplay.className = 'interview-timer';
        timerDisplay.innerHTML = `
            <div class="timer-container">
                <span id="recordingStatus">Ready to record</span>
                <span id="recordingTimer" class="recording-timer">00:00</span>
            </div>
        `;
        header.querySelector('.interview-controls').appendChild(timerDisplay);
        
        // Create content area
        const content = document.createElement('div');
        content.className = 'interview-content';
        
        // Question section
        const questionSection = document.createElement('div');
        questionSection.className = 'question-section';
        questionSection.innerHTML = `
            <div id="questionContainer" class="question-container">
                <p id="questionText" class="question-text">Preparing your interview questions...</p>
            </div>
        `;
        
        // Recording section
        const recordingSection = document.createElement('div');
        recordingSection.className = 'recording-section';
        recordingSection.innerHTML = `
            <div class="audio-controls">
                <button id="recordButton" class="record-button" disabled>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    Start Recording
                </button>
                <div id="recordingStatusText" class="recording-status">Ready to record your answer</div>
            </div>
            <audio id="audioPlayer" controls></audio>
        `;
        
        // Video feed section
        const videoSection = document.createElement('div');
        videoSection.className = 'video-section';
        videoSection.innerHTML = `
            <div class="video-container">
                <video id="videoElement" autoplay muted></video>
                <div id="videoPlaceholder" class="video-placeholder">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M23 7l-7 5 7 5V7z"></path>
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                    </svg>
                    <p>Camera is inactive</p>
                </div>
            </div>
        `;
        
        // Add sections to content
        content.appendChild(questionSection);
        content.appendChild(recordingSection);
        content.appendChild(videoSection);
        
        // Results section (hidden initially)
        const resultsSection = document.createElement('div');
        resultsSection.id = 'resultsSection';
        resultsSection.className = 'results-section hidden';
        resultsSection.innerHTML = `
            <h2>Interview Results</h2>
            <div id="overallScore" class="overall-score">Overall Score: 0%</div>
            <div id="metricsContainer" class="metrics-container"></div>
            <div class="results-footer">
                <p id="resultsMessage" class="results-message"></p>
                <button id="returnToHomeButton" class="button">Return to Home</button>
            </div>
        `;
        
        // Add header, content, and results to container
        interviewContainer.appendChild(header);
        interviewContainer.appendChild(content);
        interviewContainer.appendChild(resultsSection);
        
        // Get references to UI elements
        questionCounter = document.getElementById('questionCounter');
        progressIndicator = document.getElementById('progressIndicator');
        questionText = document.getElementById('questionText');
        recordButton = document.getElementById('recordButton');
        recordingTimerDisplay = document.getElementById('recordingTimer');
        recordingStatusText = document.getElementById('recordingStatus');
        audioPlayer = document.getElementById('audioPlayer');
        videoElement = document.getElementById('videoElement');
        videoPlaceholder = document.getElementById('videoPlaceholder');
        resultsSection = document.getElementById('resultsSection');
        overallScore = document.getElementById('overallScore');
        metricsContainer = document.getElementById('metricsContainer');
        resultsMessage = document.getElementById('resultsMessage');
        
        // Set up event listeners
        recordButton.addEventListener('click', handleRecordButton);
        audioPlayer.addEventListener('ended', onAudioEnded);
        document.getElementById('returnToHomeButton').addEventListener('click', returnToHome);
        
        // Style the timer display to be more prominent
        const timerStyle = `
            #recordingTimer {
                font-size: 20px;
                font-weight: bold;
                color: #e74c3c;
                margin-left: 10px;
                display: inline-block;
                width: 80px;
                text-align: center;
                background: rgba(0,0,0,0.05);
                padding: 3px 8px;
                border-radius: 4px;
            }
            #recordingTimer.recording {
                animation: pulse 1s infinite;
            }
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }
            .timer-container {
                display: flex;
                align-items: center;
                padding: 5px 10px;
                background: #f8f9fa;
                border-radius: 5px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
        `;
        
        // Add the style
        const styleElement = document.createElement('style');
        styleElement.textContent = timerStyle;
        document.head.appendChild(styleElement);
        
        return interviewContainer;
    }

    async function startRecordingWithStream(stream) {
        try {
            console.log('Starting recording with stream...');
            
            // Configure MediaRecorder with appropriate options
            const options = { 
                mimeType: 'audio/webm',
                audioBitsPerSecond: 128000
            };
            
            try {
                mediaRecorder = new MediaRecorder(stream, options);
            } catch (e) {
                console.warn(`${options.mimeType} is not supported, trying alternate format`);
                mediaRecorder = new MediaRecorder(stream);
            }
            
            // Set up event handlers
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
            };
            
            mediaRecorder.onstart = () => {
                console.log('Recording started');
                isRecording = true;
                
                // Update UI to show recording state
                const recordingStatus = document.querySelector('.recording-status');
                if (recordingStatus) {
                    recordingStatus.classList.add('active');
                }
                
                // Update button text
                if (recordButton) {
                    recordButton.textContent = 'Stop Recording';
                    recordButton.classList.add('recording');
                }
                
                // Start recording timer
                recordingDuration = 0;
                recordingTimer = setInterval(() => {
                    recordingDuration++;
                    updateRecordingTimer();
                    
                    // Enable continue button after minimum recording time
                    if (recordingDuration >= minimumRecordingDuration) {
                        const continueButton = document.getElementById('continueButton');
                        if (continueButton) {
                            continueButton.disabled = false;
                        }
                    }
                    
                    // Auto-stop at maximum duration
                    if (recordingDuration >= maxRecordingDuration) {
                        stopRecording();
                    }
                }, 1000);
            };
            
            mediaRecorder.onstop = () => {
                console.log('Recording stopped');
                isRecording = false;
                
                // Update UI to show recording completed
                const recordingStatus = document.querySelector('.recording-status');
                if (recordingStatus) {
                    recordingStatus.classList.remove('active');
                    recordingStatus.classList.add('completed');
                }
                
                // Update button text
                if (recordButton) {
                    recordButton.textContent = 'Record Again';
                    recordButton.classList.remove('recording');
                }
                
                // Stop and clear timer
                if (recordingTimer) {
                    clearInterval(recordingTimer);
                    recordingTimer = null;
                }
                
                // Enable continue button
                const continueButton = document.getElementById('continueButton');
                if (continueButton) {
                    continueButton.disabled = false;
                }
            };
            
            // Start recording
            mediaRecorder.start();
            
        } catch (error) {
            console.error('Error starting recording:', error);
            
            // Restore audio player
            if (audioPlayer && audioPlayerMuted !== undefined) {
                audioPlayer.muted = audioPlayerMuted;
            }
            
            // Clean up stream if it exists
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            
            isRecording = false;
            recordButton.textContent = 'Start Recording';
            recordButton.classList.remove('recording');
            
            // Reset timer display
            recordingTimerDisplay.textContent = '00:00';
            recordingTimerDisplay.classList.remove('recording');
            recordingStatusText.textContent = 'Recording failed';
            
            showError(interviewContainer, 'Failed to start recording. Please check your microphone permissions and try again.');
        }
    }

    // Function to update recording timer display
    function updateRecordingTimer() {
        const minutes = Math.floor(recordingDuration / 60);
        const seconds = recordingDuration % 60;
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} min`;
        
        const timerDisplay = document.querySelector('.recording-timer');
        if (timerDisplay) {
            timerDisplay.textContent = formattedTime;
        }
    }

    // Improved toggle microphone function
    function toggleMicrophone(silentMode = false) {
        console.log('Toggling microphone...');
        
        if (micActive) {
            // Turn off microphone
            if (micStream) {
                micStream.getTracks().forEach(track => track.stop());
                micStream = null;
            }
            
            micActive = false;
            
            // Update UI
            if (micStatus) {
                micStatus.classList.remove('active');
                micStatus.classList.add('inactive');
            }
            
            if (micStatusText) {
                micStatusText.textContent = 'Microphone is inactive';
            }
            
            if (micStatusCheck) {
                micStatusCheck.innerHTML = '❌ Microphone access required';
            }
            
            if (!silentMode) {
                alert('Microphone has been disabled. You need to enable it for the interview.');
            }
            
        } else {
            // Turn on microphone
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    // Store the microphone stream
                    micStream = stream;
                    micActive = true;
                    
                    // Update UI
                    if (micStatus) {
                        micStatus.classList.remove('inactive');
                        micStatus.classList.add('active');
                    }
                    
                    if (micStatusText) {
                        micStatusText.textContent = 'Microphone is active';
                    }
                    
                    if (micStatusCheck) {
                        micStatusCheck.innerHTML = '✅ Microphone access granted';
                    }
                    
                    // Check if all permissions are granted
                    checkAllPermissions();
                })
                .catch(error => {
                    console.error('Error accessing microphone:', error);
                    
                    if (!silentMode) {
                        alert(`Failed to access microphone: ${error.message}. Please grant permission in your browser settings.`);
                    }
                });
        }
    }
});

// When the continue button is clicked, submit the recorded answer
document.addEventListener('DOMContentLoaded', function() {
    // Add listener for the continue button
    const continueButton = document.getElementById('continueButton');
    if (continueButton) {
        continueButton.addEventListener('click', function() {
            console.log('Continue button clicked');
            
            // Create an audio blob from the recorded chunks
            if (recordedChunks.length > 0) {
                const audioBlob = new Blob(recordedChunks, { type: 'audio/webm' });
                submitRecording(audioBlob);
            } else {
                console.warn('No audio data recorded');
                alert('No audio was recorded. Please record your answer before continuing.');
            }
        });
    }
});

// Function to display the question with the original UI
function displayQuestion(questionText) {
    if (!interviewContainer) return;
    
    // Clear any previous content
    interviewContainer.innerHTML = `
        <h1 class="interview-title">AI Interview</h1>
        <div class="question-text">${questionText}</div>
    `;
    
    // Show the actions container
    const actionsContainer = document.querySelector('.actions-container');
    if (actionsContainer) {
        actionsContainer.style.display = 'flex';
    }
    
    // Update question counter
    if (questionCounter) {
        questionCounter.textContent = `Question ${currentQuestion} of ${totalQuestions}`;
    }
    
    // Update progress bar
    if (progressBar) {
        const progress = (currentQuestion / totalQuestions) * 100;
        progressBar.style.width = `${progress}%`;
    }
    
    // Enable the record button
    if (recordButton) {
        recordButton.disabled = false;
        recordButton.textContent = 'Start Recording';
        recordButton.classList.remove('recording');
    }
    
    // Reset recording status
    if (recordingStatusText) {
        recordingStatusText.textContent = 'Ready to record your answer';
    }
    
    // Disable continue button
    const continueButton = document.getElementById('continueButton');
    if (continueButton) {
        continueButton.disabled = true;
    }
}

// Fix the createBlob function to handle potential MediaRecorder errors
function createAudioBlob() {
    if (recordedChunks.length === 0) {
        console.error('No audio data recorded');
        return null;
    }
    
    try {
        return new Blob(recordedChunks, { type: 'audio/webm' });
    } catch (error) {
        console.error('Error creating audio blob:', error);
        return null;
    }
}

// Improved startRecording function with better error handling
function startRecording() {
    if (isRecording) return;
    
    console.log('Starting recording...');
    
    // Get microphone stream if not already available
    if (!micStream) {
        // Show user a message that microphone is needed
        alert('Microphone access is required for recording. Please enable your microphone and try again.');
        toggleMicrophone(false);
        return;
    }
    
    try {
        // Create recorder with mic stream
        recordedChunks = [];
        const options = { mimeType: 'audio/webm' };
        
        try {
            mediaRecorder = new MediaRecorder(micStream, options);
        } catch (e) {
            console.error('MediaRecorder with audio/webm not supported, trying without options:', e);
            mediaRecorder = new MediaRecorder(micStream);
        }
        
        // Set up event handlers
        mediaRecorder.ondataavailable = (event) => {
            console.log("Data available event, size:", event.data.size);
            if (event.data && event.data.size > 0) {
                recordedChunks.push(event.data);
                console.log('Received data chunk:', event.data.size, 'bytes');
            }
        };
        
        mediaRecorder.onstart = () => {
            console.log('MediaRecorder started');
            isRecording = true;
            
            // Update UI
            if (recordButton) {
                recordButton.textContent = 'Stop Recording';
                recordButton.classList.add('recording');
            }
            
            if (recordingStatusText) {
                recordingStatusText.textContent = 'Recording in progress...';
            }
            
            // Start recording timer
            recordingDuration = 0;
            recordingTimer = setInterval(() => {
                recordingDuration++;
                
                // Update timer display
                const minutes = Math.floor(recordingDuration / 60);
                const seconds = recordingDuration % 60;
                const timeDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} min`;
                
                if (timerDisplay) {
                    timerDisplay.textContent = timeDisplay;
                }
                
                // Enable continue button after minimum recording duration
                if (recordingDuration >= minimumRecordingDuration) {
                    const continueButton = document.getElementById('continueButton');
                    if (continueButton) {
                        continueButton.disabled = false;
                    }
                }
                
                // Auto-stop at maximum duration
                if (recordingDuration >= maxRecordingDuration) {
                    stopRecording();
                }
            }, 1000);
        };
        
        mediaRecorder.onstop = () => {
            console.log('MediaRecorder stopped, chunks:', recordedChunks.length);
            isRecording = false;
            
            // Clear recording timer
            if (recordingTimer) {
                clearInterval(recordingTimer);
                recordingTimer = null;
            }
            
            // Update UI
            if (recordButton) {
                recordButton.textContent = 'Record Again';
                recordButton.classList.remove('recording');
            }
            
            if (recordingStatusText) {
                recordingStatusText.textContent = 'Recording complete. Press "Continue" to proceed.';
            }
            
            // Enable continue button
            const continueButton = document.getElementById('continueButton');
            if (continueButton) {
                continueButton.disabled = false;
            }
        };
        
        mediaRecorder.onerror = (event) => {
            console.error('MediaRecorder error:', event.error);
            alert(`Recording error: ${event.error.message || 'Unknown error'}`);
            stopRecording();
        };
        
        // Start recording with timeslice to get regular ondataavailable events
        mediaRecorder.start(1000);
        
    } catch (error) {
        console.error('Error starting recording:', error);
        alert(`Failed to start recording: ${error.message || 'Unknown error'}`);
    }
}

// Improved toggleMicrophone function with better error handling
async function toggleMicrophone(silentMode = false) {
    console.log('Toggling microphone...');
    
    if (micActive) {
        // Turn off microphone
        if (micStream) {
            micStream.getTracks().forEach(track => track.stop());
            micStream = null;
        }
        
        micActive = false;
        
        // Update UI
        if (micStatus) {
            micStatus.classList.remove('active');
            micStatus.classList.add('inactive');
        }
        
        if (micStatusText) {
            micStatusText.textContent = 'Microphone is inactive';
        }
        
        if (micStatusCheck) {
            micStatusCheck.innerHTML = '❌ Microphone access required';
        }
        
        checkAllPermissions();
        
    } else {
        try {
            // Try to access the microphone
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Store the stream
            micStream = stream;
            micActive = true;
            
            // Update UI
            if (micStatus) {
                micStatus.classList.remove('inactive');
                micStatus.classList.add('active');
            }
            
            if (micStatusText) {
                micStatusText.textContent = 'Microphone is active';
            }
            
            if (micStatusCheck) {
                micStatusCheck.innerHTML = '✅ Microphone access granted';
            }
            
            // Check all permissions
            checkAllPermissions();
            
        } catch (error) {
            console.error('Error accessing microphone:', error);
            
            if (!silentMode) {
                alert(`Failed to access microphone: ${error.message}. Please grant permission in your browser settings.`);
            }
        }
    }
}

// Updated startInterview function with better error handling and parameter validation
async function startInterview() {
    console.log('Starting interview...');
    
    try {
        // Don't start if not all permissions granted
        if (!allPermissionsGranted) {
            showError(document.getElementById('mainContent'), 'All permissions must be granted before starting the interview.');
            return;
        }
        
        interviewStarted = true;
        
        // Hide pre-interview section and show interview container
        const preInterviewSection = document.getElementById('preInterviewSection');
        if (preInterviewSection) {
            preInterviewSection.style.display = 'none';
        }
        
        // Show the interview container
        const interviewContainer = document.getElementById('interviewContainer');
        if (interviewContainer) {
            interviewContainer.style.display = 'block';
        }
        
        // Make sure the microphone is enabled
        if (!micActive) {
            await toggleMicrophone(false);
        }
        
        // Start proctoring
        startProctoring();
        
        // Ensure fullscreen
        activateFullscreen();
        
        // Get the selected role and experience
        const role = localStorage.getItem('selectedRole') || 'Software Developer';
        const experience = localStorage.getItem('experienceLevel') || 'Mid-level';
        
        // Make sure we have a valid session ID
        if (!sessionId) {
            sessionId = generateSessionId();
            console.log('Generated new session ID:', sessionId);
        }
        
        // Initialize interview state
        interviewSessionId = sessionId;
        currentQuestion = 1; // Start with first question
        totalQuestions = 5; // Default, will be updated from server
        
        // Show loading state
        showLoading(interviewContainer, 'Preparing your interview questions...');
        
        // Map experience level to difficulty
        const difficulty = experience === 'Entry-level' ? 'easy' : (experience === 'Senior' ? 'hard' : 'medium');
        
        console.log('Sending request to start interview with:', {
            role: role,
            difficulty: difficulty,
            duration: 3 // 3 minute interview
        });
        
        // Make API request to get first question
        const response = await fetch('/start_interview', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                role: role,
                difficulty: difficulty,
                duration: 3 // 3 minute interview
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server error:', response.status, errorText);
            throw new Error(`Server returned ${response.status}: ${errorText || 'Unknown error'}`);
        }
        
        // Get question info from headers or response
        const questionText = response.headers.get('X-Question-Text');
        if (questionText) {
            currentQuestionText = questionText;
            
            // Update question counter if available
            if (response.headers.get('X-Current-Question') && response.headers.get('X-Total-Questions')) {
                currentQuestion = parseInt(response.headers.get('X-Current-Question'));
                totalQuestions = parseInt(response.headers.get('X-Total-Questions'));
            }
            
            // Check if we received audio directly
            const contentType = response.headers.get('Content-Type');
            if (contentType && contentType.includes('audio')) {
                // Get the audio blob
                const audioBlob = await response.blob();
                const audioUrl = URL.createObjectURL(audioBlob);
                
                // Play the audio
                const audioPlayer = document.getElementById('audioPlayer');
                if (audioPlayer) {
                    audioPlayer.src = audioUrl;
                    audioPlayer.play();
                }
            }
        } else {
            // Try to parse from response body if not in headers
            const data = await response.json();
            if (data.content) {
                currentQuestionText = data.content;
                currentQuestion = data.current_question || 1;
                totalQuestions = data.total_questions || 5;
            } else {
                throw new Error('No question received from server');
            }
        }
        
        // Display the question
        displayQuestion(currentQuestionText);
        
        // Show the timer
        const timerContainer = document.getElementById('timerContainer');
        if (timerContainer) {
            timerContainer.style.display = 'flex';
        }
        
        // Enable the record button once the question is loaded
        if (recordButton) {
            recordButton.disabled = false;
        }
        
        console.log('Question loaded successfully, ready for user response');
    } catch (error) {
        console.error('Interview error:', error);
        console.error('Error details:', error.message, error.stack);
        
        // Show a user-friendly error message
        const errorContainer = interviewContainer || document.getElementById('mainContent');
        showError(errorContainer, `Failed to start the interview: ${error.message || 'Unknown error'}. Please refresh and try again.`);
        
        // Restore pre-interview section if needed
        const preInterviewSection = document.getElementById('preInterviewSection');
        if (preInterviewSection) {
            preInterviewSection.style.display = 'block';
        }
    }
}

// Function to submit the recording and move to the next question
async function submitRecording(audioBlob) {
    if (!audioBlob) {
        console.error('No audio data to submit');
        showError(interviewContainer, 'No audio data to submit. Please record your answer first.');
        return;
    }
    
    try {
        console.log('Submitting recording, blob size:', audioBlob.size);
        
        // Show loading state
        showLoading(interviewContainer, 'Processing your answer...');
        
        // Get role from localStorage
        const role = localStorage.getItem('selectedRole') || 'Software Developer';
        
        // Create form data with the audio blob
        const formData = new FormData();
        formData.append('audio', audioBlob, 'answer.webm');
        formData.append('role', role);
        formData.append('question', currentQuestionText);
        
        // Send the recording to the server
        const response = await fetch('/submit_audio_answer', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server returned ${response.status}: ${errorText || 'Unknown error'}`);
        }
        
        // Try to get the next question
        const data = await response.json();
        console.log('Server response:', data);
        
        // Increment question counter
        currentQuestion++;
        
        // Check if interview is complete
        if (currentQuestion > totalQuestions || data.interview_complete) {
            // Interview is complete, show the results page
            console.log('Interview complete, showing results section');
            
            // Hide interview container
            interviewContainer.style.display = 'none';
            
            // Show results section
            const resultsSection = document.getElementById('resultsSection');
            if (resultsSection) {
                resultsSection.style.display = 'block';
                
                // Redirect to job matching after a short delay
                setTimeout(function() {
                    window.location.href = '/static/job_matching.html';
                }, 3000); // 3 second delay to show results
            }
            return;
        }
        
        // Get the next question from the response or generate a new one
        let nextQuestion = data.next_question;
        
        if (!nextQuestion) {
            try {
                // If no next question in response, ask for one
                const nextQuestionResponse = await fetch('/get_next_question', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        role: role,
                        current_question: currentQuestionText,
                        current_question_number: currentQuestion,
                        total_questions: totalQuestions
                    })
                });
                
                if (nextQuestionResponse.ok) {
                    const nextData = await nextQuestionResponse.json();
                    nextQuestion = nextData.content || nextData.question;
                }
            } catch (nextError) {
                console.error('Error getting next question:', nextError);
                showError(interviewContainer, `Failed to get next question: ${nextError.message}. Please try again.`);
                return;
            }
        }
        
        if (!nextQuestion) {
            throw new Error('No next question available');
        }
        
        // Set the next question
        currentQuestionText = nextQuestion;
        
        // Update the UI with the new question
        displayQuestion(currentQuestionText);
        
        // Try to get audio for the question
        try {
            const audioResponse = await fetch(`/get_audio_question?text=${encodeURIComponent(currentQuestionText)}`);
            if (audioResponse.ok) {
                const audioBlob = await audioResponse.blob();
                const audioUrl = URL.createObjectURL(audioBlob);
                
                // Play the audio
                const audioPlayer = document.getElementById('audioPlayer');
                if (audioPlayer) {
                    audioPlayer.src = audioUrl;
                    audioPlayer.play();
                }
            }
        } catch (audioError) {
            console.error('Error getting audio for question:', audioError);
            // Continue even if audio fails
        }
        
        // Reset recording state
        recordedChunks = [];
        recordingDuration = 0;
        if (timerDisplay) {
            timerDisplay.textContent = '00:00';
        }
        
        console.log('Next question loaded successfully');
        
    } catch (error) {
        console.error('Error submitting answer:', error);
        showError(interviewContainer, `Failed to submit your answer: ${error.message}. Please try again.`);
        
        // Enable the record button to try again
        if (recordButton) {
            recordButton.disabled = false;
        }
    }
}

// Helper function to generate a session ID if none exists
function generateSessionId() {
    return 'session_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Improved displayQuestion function with better error handling
function displayQuestion(questionText) {
    if (!interviewContainer) {
        console.error('Interview container not found');
        return;
    }
    
    try {
        // Clear any previous content
        interviewContainer.innerHTML = `
            <h1 class="interview-title">AI Interview</h1>
            <div class="question-text">${questionText || 'No question available'}</div>
        `;
        
        // Show the actions container
        const actionsContainer = document.querySelector('.actions-container');
        if (actionsContainer) {
            actionsContainer.style.display = 'flex';
        } else {
            console.warn('Actions container not found');
        }
        
        // Update question counter
        if (questionCounter) {
            questionCounter.textContent = `Question ${currentQuestion} of ${totalQuestions}`;
        }
        
        // Update progress bar
        if (progressBar) {
            const progress = (currentQuestion / totalQuestions) * 100;
            progressBar.style.width = `${progress}%`;
        }
        
        // Enable the record button
        if (recordButton) {
            recordButton.disabled = false;
            recordButton.textContent = 'Start Recording';
            recordButton.classList.remove('recording');
        }
        
        // Reset recording status
        if (recordingStatusText) {
            recordingStatusText.textContent = 'Ready to record your answer';
        }
        
        // Disable continue button
        const continueButton = document.getElementById('continueButton');
        if (continueButton) {
            continueButton.disabled = true;
        }
    } catch (error) {
        console.error('Error displaying question:', error);
        showError(interviewContainer, `Error displaying question: ${error.message}. Please refresh and try again.`);
    }
}

// Event handler when document is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Document loaded, initializing interview page');
    
    // Initialize global variables
    interviewContainer = document.getElementById('interviewContainer');
    recordButton = document.getElementById('recordButton');
    recordingStatusText = document.getElementById('recordingStatus');
    questionCounter = document.getElementById('questionCounter');
    progressBar = document.getElementById('progressBar');
    timerDisplay = document.getElementById('timerDisplay');
    micStatus = document.getElementById('micStatus');
    micStatusText = document.getElementById('micStatusText');
    micStatusCheck = document.getElementById('microphoneCheck');
    
    // Initialize session ID if needed
    if (!sessionId) {
        sessionId = generateSessionId();
        console.log('Generated new session ID:', sessionId);
    }
    
    // Add listeners for the record button
    if (recordButton) {
        recordButton.addEventListener('click', function() {
            if (isRecording) {
                stopRecording();
            } else {
                startRecording();
            }
        });
    }
    
    // Add listener for the continue button
    const continueButton = document.getElementById('continueButton');
    if (continueButton) {
        continueButton.addEventListener('click', function() {
            console.log('Continue button clicked');
            
            // Create an audio blob from the recorded chunks
            if (recordedChunks && recordedChunks.length > 0) {
                const audioBlob = new Blob(recordedChunks, { type: 'audio/webm' });
                submitRecording(audioBlob);
            } else {
                console.warn('No audio data recorded');
                alert('No audio was recorded. Please record your answer before continuing.');
            }
        });
    }
    
    // Add listener for the microphone button
    const micButton = document.getElementById('micButton');
    if (micButton) {
        micButton.addEventListener('click', function() {
            toggleMicrophone();
        });
    }
    
    // Add listener for the start interview button
    const startButton = document.getElementById('startInterviewButton');
    if (startButton) {
        startButton.addEventListener('click', function() {
            startInterview();
        });
    }
    
    console.log('Event listeners attached');
});
