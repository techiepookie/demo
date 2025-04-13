// State management
const state = {
    currentStep: 1,
    totalSteps: 5,
    selectedRole: null,
    selectedExperience: null,
    sessionId: null
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('Role selection page initialized');
    
    // DOM elements
    const currentStepEl = document.getElementById('current-step');
    const totalStepsEl = document.getElementById('total-steps');
    const progressBarEl = document.getElementById('progress-bar');
    const backBtn = document.getElementById('back-btn');
    const nextBtn = document.getElementById('next-btn');
    
    // Role options
    const roleOptions = document.querySelectorAll('.option');
    console.log('Found role options:', roleOptions.length);
    
    roleOptions.forEach(option => {
        option.addEventListener('click', () => {
            console.log('Role option clicked:', option.getAttribute('data-role'));
            // Remove selected class from all options
            roleOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Add selected class to clicked option
            option.classList.add('selected');
            
            // Update state
            state.selectedRole = option.getAttribute('data-role');
            console.log('Selected role:', state.selectedRole);
            
            // Enable next button if both selections are made
            checkNextButtonState();
        });
    });
    
    // Experience options
    const experienceOptions = document.querySelectorAll('.experience-option');
    console.log('Found experience options:', experienceOptions.length);
    
    experienceOptions.forEach(option => {
        option.addEventListener('click', () => {
            console.log('Experience option clicked:', option.getAttribute('data-experience'));
            // Remove selected class from all options
            experienceOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Add selected class to clicked option
            option.classList.add('selected');
            
            // Update state
            state.selectedExperience = option.getAttribute('data-experience');
            console.log('Selected experience:', state.selectedExperience);
            
            // Enable next button if both selections are made
            checkNextButtonState();
        });
    });
    
    // Check if next button should be enabled
    function checkNextButtonState() {
        if (nextBtn) {
            if (state.selectedRole && state.selectedExperience) {
                nextBtn.removeAttribute('disabled');
            } else {
                nextBtn.setAttribute('disabled', 'disabled');
            }
        }
    }
    
    // Next button click handler
    if (nextBtn) {
        nextBtn.addEventListener('click', async () => {
            console.log('Next button clicked');
            try {
                // Show loading indicator
                nextBtn.innerHTML = '<span class="spinner"></span> Processing...';
                nextBtn.disabled = true;
                
                console.log('Sending data to backend:', {
                    role: state.selectedRole,
                    experience: state.selectedExperience
                });
                
                // Send role and experience to backend
                const response = await fetch('/api/select-role', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        role: state.selectedRole,
                        experience: state.selectedExperience
                    })
                });
    
                const data = await response.json();
                console.log('Backend response:', data);
                
                if (response.ok) {
                    state.sessionId = data.session_id;
                    // Store session ID and role information in localStorage for other pages
                    localStorage.setItem('sessionId', state.sessionId);
                    localStorage.setItem('selectedRole', state.selectedRole);
                    localStorage.setItem('experienceLevel', state.selectedExperience);
                    console.log('Redirecting to permissions page');
                    // Redirect to permissions page
                    window.location.href = '/permissions';
                } else {
                    console.error('API Error:', data);
                    nextBtn.innerHTML = 'Next';
                    nextBtn.disabled = false;
                    alert('An error occurred. Please try again.');
                }
            } catch (error) {
                console.error('Error:', error);
                nextBtn.innerHTML = 'Next';
                nextBtn.disabled = false;
                alert('An error occurred. Please try again.');
            }
        });
    }
    
    // Update progress bar
    function updateProgressBar() {
        if (currentStepEl) currentStepEl.textContent = state.currentStep;
        if (totalStepsEl) totalStepsEl.textContent = state.totalSteps;
        if (progressBarEl) {
            const progress = (state.currentStep - 1) / (state.totalSteps - 1) * 100;
            progressBarEl.style.width = `${progress}%`;
        }
    }
    
    // Initialize
    updateProgressBar();
});