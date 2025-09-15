// Savart Homepage JavaScript

document.addEventListener('DOMContentLoaded', function() {
    
    // Header scroll effect
    const header = document.getElementById('header');
    const headerLogo = document.querySelector('.header_logo');
    const headerLogoDark = document.querySelector('.header-logo-dark');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            header.classList.add('stuck');
            if (headerLogo && headerLogoDark) {
                headerLogo.style.display = 'none';
                headerLogoDark.style.display = 'block';
            }
        } else {
            header.classList.remove('stuck');
            if (headerLogo && headerLogoDark) {
                headerLogo.style.display = 'block';
                headerLogoDark.style.display = 'none';
            }
        }
    });

    // Video auto-play functionality
    const video = document.getElementById('video');
    const playButton = document.getElementById('play_video');
    
    if (video && playButton) {
        // Use IntersectionObserver to autoplay the video when it's visible
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    video.play().catch(e => {
                        console.log('Auto-play prevented:', e);
                    });
                } else {
                    video.pause();
                }
            });
        }, {
            threshold: 0.5
        });
        
        observer.observe(video);
        
        // Play button click handler
        playButton.addEventListener('click', function() {
            if (video.paused) {
                video.play();
                playButton.style.display = 'none';
            } else {
                video.pause();
                playButton.style.display = 'block';
            }
        });
        
        // Hide play button when video starts
        video.addEventListener('play', function() {
            playButton.style.display = 'none';
        });
        
        // Show play button when video pauses
        video.addEventListener('pause', function() {
            playButton.style.display = 'block';
        });
    }

    // Slider functionality (simple implementation)
    const slider = document.querySelector('.slider');
    const slides = document.querySelectorAll('.banner.slide-banner-1, .banner.slide-banner-2');
    
    if (slider && slides.length > 0) {
        let currentSlide = 0;
        const totalSlides = slides.length;
        
        // Hide all slides except first
        slides.forEach((slide, index) => {
            if (index !== 0) {
                slide.style.display = 'none';
            }
        });
        
        // Auto-advance slides
        setInterval(() => {
            slides[currentSlide].style.display = 'none';
            currentSlide = (currentSlide + 1) % totalSlides;
            slides[currentSlide].style.display = 'block';
        }, 5000);
    }

    // Mobile menu toggle
    const hamburgerButtons = document.querySelectorAll('.hamburger, .hamburger-white');
    const closeButtons = document.querySelectorAll('.close, .close-white');
    const mobileMenu = document.querySelector('.mobile-nav');
    
    hamburgerButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Toggle mobile menu visibility
            if (mobileMenu) {
                mobileMenu.classList.toggle('active');
            }
            
            // Toggle hamburger/close icons
            const parent = button.closest('.html_topbar_left');
            if (parent) {
                const hamburgerDiv = parent.querySelector('.tombol-black, .tombol-white');
                hamburgerDiv.classList.toggle('menu-open');
            }
        });
    });
    
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Close mobile menu
            if (mobileMenu) {
                mobileMenu.classList.remove('active');
            }
            
            // Reset hamburger/close icons
            const parent = button.closest('.html_topbar_left');
            if (parent) {
                const hamburgerDiv = parent.querySelector('.tombol-black, .tombol-white');
                hamburgerDiv.classList.remove('menu-open');
            }
        });
    });

    // Dropdown menu functionality
    const dropdownItems = document.querySelectorAll('.menu-item-has-dropdown');
    
    dropdownItems.forEach(item => {
        const link = item.querySelector('.nav-top-link');
        const dropdown = item.querySelector('.sub-menu');
        
        if (link && dropdown) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Close other dropdowns
                dropdownItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        const otherDropdown = otherItem.querySelector('.sub-menu');
                        if (otherDropdown) {
                            otherDropdown.style.opacity = '0';
                            otherDropdown.style.visibility = 'hidden';
                        }
                    }
                });
                
                // Toggle current dropdown
                if (dropdown.style.opacity === '1') {
                    dropdown.style.opacity = '0';
                    dropdown.style.visibility = 'hidden';
                } else {
                    dropdown.style.opacity = '1';
                    dropdown.style.visibility = 'visible';
                }
            });
        }
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.menu-item-has-dropdown')) {
            dropdownItems.forEach(item => {
                const dropdown = item.querySelector('.sub-menu');
                if (dropdown) {
                    dropdown.style.opacity = '0';
                    dropdown.style.visibility = 'hidden';
                }
            });
        }
    });

    // Smooth scrolling for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            if (href === '#' || href === '#contact_us') {
                e.preventDefault();
                return;
            }
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const headerHeight = header ? header.offsetHeight : 80;
                const targetPosition = target.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Animation on scroll
    const animatedElements = document.querySelectorAll('[data-animate]');
    
    if (animatedElements.length > 0) {
        const animationObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const animationType = element.getAttribute('data-animate');
                    element.style.animation = `${animationType} 0.8s ease-out`;
                    animationObserver.unobserve(element);
                }
            });
        }, {
            threshold: 0.1
        });
        
        animatedElements.forEach(element => {
            animationObserver.observe(element);
        });
    }

    // Box hover effects
    const boxes = document.querySelectorAll('.box');
    
    boxes.forEach(box => {
        box.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
            this.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
        });
        
        box.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
    });

    // Loading spinner management
    const loadingSpinners = document.querySelectorAll('.loading-spin');
    
    // Hide loading spinners after content loads
    setTimeout(() => {
        loadingSpinners.forEach(spinner => {
            spinner.style.display = 'none';
        });
    }, 2000);

    // Image lazy loading
    const images = document.querySelectorAll('img[src]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.classList.add('loaded');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        images.forEach(img => {
            imageObserver.observe(img);
        });
    }

    // Console log for debugging
    console.log('Savart Homepage JavaScript loaded successfully');
    
    // Add any additional custom functionality here
    
    // Handle form submissions (if any forms are added later)
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Form submission intercepted');
            // Add form handling logic here
        });
    });

    // Social media link tracking (optional)
    const socialLinks = document.querySelectorAll('.sosmed a');
    socialLinks.forEach(link => {
        link.addEventListener('click', function() {
            const platform = this.href.includes('facebook') ? 'Facebook' :
                           this.href.includes('instagram') ? 'Instagram' :
                           this.href.includes('tiktok') ? 'TikTok' :
                           this.href.includes('linkedin') ? 'LinkedIn' : 'Unknown';
            
            console.log(`Social media click: ${platform}`);
            // Add analytics tracking here if needed
        });
    });
});

// Additional utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

    // Parallax effect for banner backgrounds
    const banners = document.querySelectorAll('.banner');

    window.addEventListener('scroll', throttle(() => {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;

        banners.forEach(banner => {
            const bg = banner.querySelector('.bg');
            if (bg) {
                bg.style.transform = `translateY(${rate}px)`;
            }
        });
    }, 16));

    // Sticky navigation enhancement
    let lastScrollTop = 0;
    const headerHeight = header ? header.offsetHeight : 80;

    window.addEventListener('scroll', throttle(() => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        if (scrollTop > lastScrollTop && scrollTop > headerHeight) {
            // Scrolling down
            if (header) {
                header.style.transform = 'translateY(-100%)';
            }
        } else {
            // Scrolling up
            if (header) {
                header.style.transform = 'translateY(0)';
            }
        }

        lastScrollTop = scrollTop;
    }, 16));

    // Enhanced image loading with fade-in effect
    const lazyImages = document.querySelectorAll('img[data-src]');

    if (lazyImages.length > 0) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.add('fade-in');
                    imageObserver.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px'
        });

        lazyImages.forEach(img => {
            imageObserver.observe(img);
        });
    }

    // Counter animation for statistics
    const counters = document.querySelectorAll('[data-counter]');

    if (counters.length > 0) {
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counter = entry.target;
                    const target = parseInt(counter.dataset.counter);
                    const duration = 2000;
                    const increment = target / (duration / 16);
                    let current = 0;

                    const updateCounter = () => {
                        current += increment;
                        if (current < target) {
                            counter.textContent = Math.floor(current);
                            requestAnimationFrame(updateCounter);
                        } else {
                            counter.textContent = target;
                        }
                    };

                    updateCounter();
                    counterObserver.unobserve(counter);
                }
            });
        });

        counters.forEach(counter => {
            counterObserver.observe(counter);
        });
    }

    // Enhanced slider with touch support
    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    if (slider) {
        slider.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            isDragging = true;
        });

        slider.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            currentX = e.touches[0].clientX;
            const diffX = startX - currentX;

            if (Math.abs(diffX) > 50) {
                if (diffX > 0) {
                    // Swipe left - next slide
                    nextSlide();
                } else {
                    // Swipe right - previous slide
                    previousSlide();
                }
                isDragging = false;
            }
        });

        slider.addEventListener('touchend', () => {
            isDragging = false;
        });
    }

    function nextSlide() {
        if (slides.length > 0) {
            slides[currentSlide].style.display = 'none';
            currentSlide = (currentSlide + 1) % slides.length;
            slides[currentSlide].style.display = 'block';
        }
    }

    function previousSlide() {
        if (slides.length > 0) {
            slides[currentSlide].style.display = 'none';
            currentSlide = (currentSlide - 1 + slides.length) % slides.length;
            slides[currentSlide].style.display = 'block';
        }
    }

    // Typewriter effect for hero text
    const typewriterElements = document.querySelectorAll('[data-typewriter]');

    typewriterElements.forEach(element => {
        const text = element.textContent;
        const speed = parseInt(element.dataset.typewriterSpeed) || 100;
        element.textContent = '';

        let i = 0;
        const typeWriter = () => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, speed);
            }
        };

        // Start typewriter when element comes into view
        const typewriterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    typeWriter();
                    typewriterObserver.unobserve(entry.target);
                }
            });
        });

        typewriterObserver.observe(element);
    });

    // Progress bar animation
    const progressBars = document.querySelectorAll('.progress-bar');

    if (progressBars.length > 0) {
        const progressObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const bar = entry.target;
                    const progress = bar.dataset.progress || 0;
                    bar.style.width = progress + '%';
                    progressObserver.unobserve(bar);
                }
            });
        });

        progressBars.forEach(bar => {
            progressObserver.observe(bar);
        });
    }

    // Modal functionality
    const modalTriggers = document.querySelectorAll('[data-modal]');
    const modals = document.querySelectorAll('.modal');
    const modalCloses = document.querySelectorAll('.modal-close, .close-btn');

    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            const modalId = trigger.dataset.modal;
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'block';
                document.body.style.overflow = 'hidden';
            }
        });
    });

    modalCloses.forEach(close => {
        close.addEventListener('click', () => {
            modals.forEach(modal => {
                modal.style.display = 'none';
            });
            document.body.style.overflow = 'auto';
        });
    });

    // Close modal on outside click
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    });

    // Scroll to top button
    const scrollToTopBtn = document.createElement('button');
    scrollToTopBtn.innerHTML = '↑';
    scrollToTopBtn.className = 'scroll-to-top';
    scrollToTopBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: var(--secondary-color);
        color: white;
        border: none;
        font-size: 20px;
        cursor: pointer;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        z-index: 1000;
    `;

    document.body.appendChild(scrollToTopBtn);

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollToTopBtn.style.opacity = '1';
            scrollToTopBtn.style.visibility = 'visible';
        } else {
            scrollToTopBtn.style.opacity = '0';
            scrollToTopBtn.style.visibility = 'hidden';
        }
    });

    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Performance monitoring
    const performanceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
            if (entry.entryType === 'largest-contentful-paint') {
                console.log('LCP:', entry.startTime);
            }
        });
    });

    try {
        performanceObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
        console.log('Performance Observer not supported');
    }
});

// Export functions if needed
window.SavartHomepage = {
    debounce,
    throttle
};
