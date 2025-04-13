    // Get session ID from localStorage
const sessionId = localStorage.getItem('sessionId');
if (!sessionId) {
    window.location.href = '/role-selection';
}

// DOM elements
const videoElement = document.getElementById('videoElement');
const videoPlaceholder = document.getElementById('videoPlaceholder');
const toggleCameraButton = document.getElementById('toggleCamera');
const cameraStatusText = document.getElementById('camera-status-text');
const cameraStatus = document.getElementById('camera-status');
const toggleMicButton = document.getElementById('toggleMic');
const micStatus = document.getElementById('mic-status');
const micStatusText = document.getElementById('mic-status-text');
const toggleScreenShareButton = document.getElementById('toggleScreenShare');
const screenStatus = document.getElementById('screen-status');
const screenStatusText = document.getElementById('screen-status-text');
const nextButton = document.getElementById('nextButton');

// State
let cameraActive = false;
let micActive = false;
let screenShareActive = false;
let localStream = null;
let screenStream = null;

// Function to check if all permissions are granted
function checkAllPermissions() {
    if (cameraActive && micActive && screenShareActive) {
        nextButton.disabled = false;
        return true;
    } else {
        nextButton.disabled = true;
        return false;
    }
}

// Camera functionality
toggleCameraButton.addEventListener('click', async () => {
    console.log('Toggle camera button clicked');
    if (cameraActive) {
        // Turn off camera
        if (localStream) {
            localStream.getVideoTracks().forEach(track => track.stop());
        }
        videoElement.style.display = 'none';
        videoPlaceholder.style.display = 'block';
        toggleCameraButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M23 7l-7 5 7 5V7z"></path>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
            </svg>
            Turn On
        `;
        cameraStatusText.textContent = 'Inactive';
        cameraStatus.classList.add('inactive');
        cameraStatus.classList.remove('active');
        cameraActive = false;
    } else {
        try {
            // Request camera access
            localStream = await navigator.mediaDevices.getUserMedia({ video: true });
            videoElement.srcObject = localStream;
            videoElement.style.display = 'block';
            videoPlaceholder.style.display = 'none';
            toggleCameraButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M23 7l-7 5 7 5V7z"></path>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                </svg>
                Turn Off
            `;
            cameraStatusText.textContent = 'Active';
            cameraStatus.classList.remove('inactive');
            cameraStatus.classList.add('active');
            cameraActive = true;
        } catch (err) {
            console.error('Error accessing camera:', err);
            alert('Error accessing camera: ' + err.message);
        }
    }
    checkAllPermissions();
});

// Microphone functionality
toggleMicButton.addEventListener('click', async () => {
    console.log('Toggle mic button clicked');
    if (micActive) {
        // Mute microphone
        if (localStream) {
            localStream.getAudioTracks().forEach(track => track.stop());
        }
        toggleMicButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="1" y1="1" x2="23" y2="23"></line>
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
            Turn On
        `;
        micStatusText.textContent = 'Inactive';
        micStatus.classList.add('inactive');
        micStatus.classList.remove('active');
        micActive = false;
    } else {
        try {
            // Request microphone access
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (localStream) {
                audioStream.getAudioTracks().forEach(track => {
                    localStream.addTrack(track);
                });
            } else {
                localStream = audioStream;
            }
            toggleMicButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
                Turn Off
            `;
            micStatusText.textContent = 'Active';
            micStatus.classList.remove('inactive');
            micStatus.classList.add('active');
            micActive = true;
        } catch (err) {
            console.error('Error accessing microphone:', err);
            alert('Error accessing microphone: ' + err.message);
        }
    }
    checkAllPermissions();
});

// Screen sharing functionality
toggleScreenShareButton.addEventListener('click', async () => {
    console.log('Toggle screen share button clicked');
    if (screenShareActive) {
        // Stop screen sharing
        if (screenStream) {
            screenStream.getTracks().forEach(track => track.stop());
            screenStream = null;
        }
        toggleScreenShareButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
            Turn On
        `;
        screenStatusText.textContent = 'Inactive';
        screenStatus.classList.add('inactive');
        screenStatus.classList.remove('active');
        screenShareActive = false;
    } else {
        try {
            // Request screen sharing
            screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            toggleScreenShareButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
                Turn Off
            `;
            screenStatusText.textContent = 'Active';
            screenStatus.classList.remove('inactive');
            screenStatus.classList.add('active');
            screenShareActive = true;
            
            // Auto-stop when user ends sharing via browser UI
            screenStream.getVideoTracks()[0].addEventListener('ended', () => {
                if (screenShareActive) {
                    screenShareActive = false;
                    screenStatusText.textContent = 'Inactive';
                    screenStatus.classList.add('inactive');
                    screenStatus.classList.remove('active');
                    toggleScreenShareButton.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                            <line x1="8" y1="21" x2="16" y2="21"></line>
                            <line x1="12" y1="17" x2="12" y2="21"></line>
                        </svg>
                        Turn On
                    `;
                    checkAllPermissions();
                }
            });
        } catch (err) {
            console.error('Error sharing screen:', err);
            alert('Error sharing screen: ' + err.message);
        }
    }
    checkAllPermissions();
});

// Next button functionality
nextButton.addEventListener('click', async () => {
    console.log('Next button clicked');
    if (checkAllPermissions()) {
        try {
            // Show loading state
            nextButton.innerHTML = '<span class="spinner"></span> Processing...';
            nextButton.disabled = true;
            
            // Prepare permission data
            const permissionsData = {
                session_id: sessionId,
                camera: cameraActive,
                microphone: micActive,
                screen: screenShareActive
            };
            
            console.log('Sending permissions data:', permissionsData);
            
            // Send permissions status to backend
            const response = await fetch('/api/permissions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(permissionsData)
            });

            if (response.ok) {
                console.log('Permissions saved successfully');
                // Redirect to assessment page
                window.location.href = '/assessment';
            } else {
                const errorData = await response.json();
                console.error('Error saving permissions:', errorData);
                nextButton.innerHTML = 'Next';
                nextButton.disabled = false;
                alert('An error occurred. Please try again.');
            }
        } catch (error) {
            console.error('Error:', error);
            nextButton.innerHTML = 'Next';
            nextButton.disabled = false;
            alert('An error occurred. Please try again.');
        }
    }
});

// Check browser compatibility
function checkMediaDevices() {
    console.log('Checking media device compatibility');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('Camera and microphone access not supported');
        alert('Your browser does not support camera and microphone access. Please use a modern browser like Chrome, Firefox, or Edge.');
        toggleCameraButton.disabled = true;
        toggleMicButton.disabled = true;
    }
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        console.error('Screen sharing not supported');
        alert('Your browser does not support screen sharing. Please use a modern browser like Chrome, Firefox, or Edge.');
        toggleScreenShareButton.disabled = true;
    }
}

// Initialize
checkMediaDevices();