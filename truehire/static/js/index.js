// Script for the TrueHire landing page

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('TrueHire landing page initialized');
    
    // Handle the Get Started button click
    const exploreBtn = document.getElementById('exploreBtn');
    if (exploreBtn) {
        console.log('Get Started button found');
        exploreBtn.addEventListener('click', () => {
            console.log('Get Started button clicked');
            // Redirect to the role selection page
            window.location.href = '/role-selection';
        });
    } else {
        console.error('Get Started button not found!');
    }

    // Also make the "Get Started" buttons in the nav menu work
    const navButtons = document.querySelectorAll('.btn-signup');
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            console.log('Nav Get Started button clicked');
            window.location.href = '/role-selection';
        });
    });

    // Mobile menu toggle
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.querySelector('.nav-menu');
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Navigation link highlighting
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-menu a');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= sectionTop - 300) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
});
