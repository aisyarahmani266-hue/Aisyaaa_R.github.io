// Mobile Menu Toggle
const mobileMenu = document.getElementById('mobile-menu');
const navLinks = document.querySelector('.nav-links');

mobileMenu.addEventListener('click', () => {
    navLinks.classList.toggle('active');

    // Hamburger animation
    const bars = document.querySelectorAll('.bar');
    // Simple toggle logic can be added for animation classes if needed
});

// Close menu when clicking a link
document.querySelectorAll('.nav-links li a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
    });
});

// Smooth Scrolling for Anchor Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);

        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 70, // Adjust for navbar height
                behavior: 'smooth'
            });
        }
    });
});

// Scroll Reveal Animation (Simple version)
const revealElements = document.querySelectorAll('.project-card, .skill-card, .education-card');

const revealOnScroll = () => {
    const windowHeight = window.innerHeight;
    const elementVisible = 150;

    revealElements.forEach((element) => {
        const elementTop = element.getBoundingClientRect().top;

        if (elementTop < windowHeight - elementVisible) {
            element.classList.add('active');
            element.style.opacity = "1";
            element.style.transform = "translateY(0)";
        }
    });
};

// Initial style for reveal animation
revealElements.forEach(el => {
    el.style.opacity = "0";
    el.style.transform = "translateY(50px)";
    el.style.transition = "all 0.6s ease-out";
});

window.addEventListener('scroll', revealOnScroll);
// Trigger once on load
revealOnScroll();

// Spark/Particle Effect on Click
document.addEventListener('click', (e) => {
    createSparks(e.pageX, e.pageY);
});

function createSparks(x, y) {
    const particleCount = 12;

    for (let i = 0; i < particleCount; i++) {
        const spark = document.createElement('div');
        spark.classList.add('spark');

        // Random destination within a radius
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 80 + 40; // distance

        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;

        spark.style.setProperty('--tx', `${tx}px`);
        spark.style.setProperty('--ty', `${ty}px`);

        // Random color alternate between primary and secondary
        spark.style.backgroundColor = Math.random() > 0.5 ? 'var(--primary-color)' : 'var(--secondary-color)';

        spark.style.left = `${x}px`;
        spark.style.top = `${y}px`;

        document.body.appendChild(spark);

        // Remove after animation
        setTimeout(() => {
            spark.remove();
        }, 800);
    }
}
