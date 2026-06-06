// main.js - handles navigation, scroll progress, IntersectionObserver animations, modal, and count-up stats.

document.addEventListener('DOMContentLoaded', () => {
  // 0. LOTUS PRELOADER AND STAGGERED REVEAL SYSTEM
  const preloader = document.getElementById('preloader');
  const preloaderCanvas = document.getElementById('preloader-canvas');
  
  const finishPreloader = () => {
    if (preloader) preloader.style.display = 'none';
    document.body.classList.remove('preloader-active');
    document.body.classList.add('hero-reveal-start');
  };

  const runPreloader = (overlay, canvas) => {
    sessionStorage.setItem('visited', 'true');
    const ctx = canvas.getContext('2d');
    
    // Set dimensions based on client size
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const width = rect.width;
    const height = rect.height;
    const centerX = width / 2;
    const centerY = height / 2;
    
    const petalConfigs = [
      { angle: -Math.PI / 2, length: 70, width: 20, delay: 500, duration: 400 },      // 0: Top
      { angle: -Math.PI / 4, length: 65, width: 18, delay: 720, duration: 400 },      // 1: Top-Right
      { angle: -3 * Math.PI / 4, length: 65, width: 18, delay: 940, duration: 400 },  // 2: Top-Left
      { angle: 0, length: 68, width: 19, delay: 1160, duration: 400 },                // 3: Right
      { angle: Math.PI, length: 68, width: 19, delay: 1380, duration: 400 },           // 4: Left
      { angle: Math.PI / 4, length: 65, width: 18, delay: 1600, duration: 400 },      // 5: Bottom-Right
      { angle: 3 * Math.PI / 4, length: 65, width: 18, delay: 1820, duration: 400 },  // 6: Bottom-Left
      { angle: Math.PI / 2, length: 60, width: 17, delay: 2040, duration: 400 }       // 7: Bottom
    ];
    
    let animationFrameId;
    let startTime = null;
    const totalDuration = 4300; // 2.5s bloom + 1s hold + 0.8s fade out
    
    const draw = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      
      ctx.clearRect(0, 0, width, height);
      
      // 1. Center Seed
      let dotRadius = 0;
      let dotGlow = 0;
      
      if (elapsed < 500) {
        const progress = elapsed / 500;
        dotRadius = 4 * progress;
        dotGlow = 8 * progress;
      } else if (elapsed >= 500 && elapsed < 2500) {
        dotRadius = 4;
        dotGlow = 8;
      } else if (elapsed >= 2500 && elapsed < 3500) {
        const pulseProgress = (elapsed - 2500) / 1000;
        const pulseFactor = Math.sin(pulseProgress * Math.PI * 2);
        dotRadius = 4 + 1.5 * pulseFactor;
        dotGlow = 8 + 6 * Math.abs(pulseFactor);
      } else {
        dotRadius = 4;
        dotGlow = 8;
      }
      
      if (elapsed >= 0) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#e8a830';
        ctx.shadowColor = '#e8a830';
        ctx.shadowBlur = dotGlow;
        ctx.fill();
      }
      
      ctx.shadowBlur = 0;
      
      // 2. Draw Petals
      petalConfigs.forEach(petal => {
        if (elapsed >= petal.delay) {
          const petalProgress = Math.min((elapsed - petal.delay) / petal.duration, 1);
          
          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.rotate(petal.angle);
          
          ctx.beginPath();
          ctx.moveTo(0, 0);
          
          const curLength = petal.length * petalProgress;
          const curWidth = petal.width * Math.sin(petalProgress * Math.PI / 2);
          
          ctx.quadraticCurveTo(-curWidth, -curLength * 0.4, 0, -curLength);
          ctx.quadraticCurveTo(curWidth, -curLength * 0.4, 0, 0);
          
          ctx.strokeStyle = '#e8a830';
          ctx.lineWidth = 1.5;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          ctx.shadowColor = '#e8a830';
          ctx.shadowBlur = 12 * petalProgress;
          ctx.stroke();
          
          ctx.restore();
        }
      });
      
      ctx.shadowBlur = 0;
      
      // 3. Transitions
      if (elapsed < 3500) {
        animationFrameId = requestAnimationFrame(draw);
      } else if (elapsed >= 3500 && elapsed < totalDuration) {
        const fadeProgress = (elapsed - 3500) / 800;
        overlay.style.opacity = (1 - fadeProgress).toString();
        animationFrameId = requestAnimationFrame(draw);
      } else {
        cancelAnimationFrame(animationFrameId);
        finishPreloader();
      }
    };
    
    animationFrameId = requestAnimationFrame(draw);
  };

  if (preloader && preloaderCanvas && !sessionStorage.getItem('visited')) {
    runPreloader(preloader, preloaderCanvas);
  } else {
    finishPreloader();
  }

  // Count-up stats observer for hero stats row
  const heroStatCols = document.querySelectorAll('.hero-stat-col');
  const countUpHero = (element, targetValue, suffix) => {
    let startTimestamp = null;
    const duration = 1500;
    const numEl = element.querySelector('.hero-stat-num');

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const currentValue = Math.floor(progress * targetValue);
      if (numEl) {
        numEl.textContent = currentValue + suffix;
      }
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        if (numEl) numEl.textContent = targetValue + suffix;
      }
    };
    window.requestAnimationFrame(step);
  };

  const heroStatObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const startCount = () => {
          const target = parseInt(entry.target.getAttribute('data-count-target'), 10);
          const suffix = entry.target.getAttribute('data-count-suffix') || '';
          if (!isNaN(target)) {
            countUpHero(entry.target, target, suffix);
          }
        };

        if (document.body.classList.contains('preloader-active')) {
          const checkInterval = setInterval(() => {
            if (!document.body.classList.contains('preloader-active')) {
              clearInterval(checkInterval);
              setTimeout(startCount, 1200);
            }
          }, 100);
        } else {
          setTimeout(startCount, 1200);
        }
        
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  heroStatCols.forEach(col => heroStatObserver.observe(col));

  // 1. NAVIGATION MOBILE MENU
  const navToggle = document.getElementById('nav-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-item');

  if (navToggle && mobileMenu) {
    const toggleMenu = () => {
      const isOpen = navToggle.classList.toggle('open');
      mobileMenu.classList.toggle('hidden', !isOpen);
      navToggle.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    };

    navToggle.addEventListener('click', toggleMenu);

    // Close menu when clicking a link
    mobileNavLinks.forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('open');
        mobileMenu.classList.add('hidden');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  // 2. SCROLL PROGRESS BAR & NAVBAR BG TRANSITION
  const progressBar = document.getElementById('progress-bar');
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    if (progressBar) {
      progressBar.style.width = `${scrolled}%`;
    }
    if (navbar) {
      if (scrollTop > 50) {
        navbar.classList.add('navbar-scrolled');
      } else {
        navbar.classList.remove('navbar-scrolled');
      }
    }
  });

  // 3. SCROLL-TRIGGERED SECTION ANIMATIONS (IntersectionObserver)
  const animateElements = document.querySelectorAll('[data-animate]');
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const animationObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  animateElements.forEach(el => animationObserver.observe(el));

  // 4. STATS COUNT-UP ANIMATION
  const statContainers = document.querySelectorAll('.stat-box');
  
  const countUp = (element, targetValue) => {
    let startTimestamp = null;
    const duration = 2000; // 2 seconds count duration

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const currentValue = Math.floor(progress * targetValue);
      element.textContent = currentValue;
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        element.textContent = targetValue; // Ensure exact final value
      }
    };
    window.requestAnimationFrame(step);
  };

  const statObserverOptions = {
    threshold: 0.5,
    rootMargin: '0px'
  };

  const statObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const countValueEl = entry.target.querySelector('.count-value');
        if (countValueEl) {
          const target = parseInt(countValueEl.getAttribute('data-target'), 10);
          countUp(countValueEl, target);
        }
        observer.unobserve(entry.target);
      }
    });
  }, statObserverOptions);

  statContainers.forEach(box => statObserver.observe(box));

  // 5. THOUGHT LEADERSHIP ARTICLE MODAL
  const articleModal = document.getElementById('article-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');

  if (articleModal && closeModalBtn) {
    const closeModal = () => {
      articleModal.classList.add('hidden');
      articleModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };

    closeModalBtn.addEventListener('click', closeModal);

    // Close on overlay background click
    articleModal.addEventListener('click', (e) => {
      if (e.target === articleModal) {
        closeModal();
      }
    });

    // Close on Escape key press
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !articleModal.classList.contains('hidden')) {
        closeModal();
      }
    });

    // Event delegation for opening the modal via any static or dynamic button with id 'open-article-btn'
    document.addEventListener('click', (e) => {
      if (e.target && e.target.id === 'open-article-btn') {
        articleModal.classList.remove('hidden');
        articleModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
      }
    });
  }

  // 6. ACTIVE NAVIGATION LINK HIGHLIGHTING ON SCROLL
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('section[id]');

  const highlightNav = () => {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    
    sections.forEach(current => {
      const rect = current.getBoundingClientRect();
      const sectionTop = rect.top + scrollY - 120; // Absolute top position of the section
      const sectionHeight = rect.height;
      const sectionId = current.getAttribute('id');
      
      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        navItems.forEach(item => {
          item.classList.remove('active');
          if (item.getAttribute('href') === `#${sectionId}` || item.getAttribute('data-section') === sectionId) {
            item.classList.add('active');
          }
        });
      }
    });
  };

  window.addEventListener('scroll', highlightNav);

  // 7. CONTACT FORM AJAX SUBMISSION
  const contactForm = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');
  
  if (contactForm && formStatus) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(contactForm);
      const name = formData.get('name');
      const email = formData.get('email');
      const message = formData.get('message');
      
      try {
        const { error } = await window.supabase
          .from('messages')
          .insert([
            { name, email, message }
          ]);
        
        if (!error) {
          formStatus.textContent = "Thank you! Savitha will get back to you shortly.";
          formStatus.style.display = 'block';
          formStatus.style.color = 'var(--color-accent)';
          contactForm.reset();
        } else {
          console.error("Supabase error:", error);
          formStatus.textContent = "Something went wrong. Please try again.";
          formStatus.style.display = 'block';
          formStatus.style.color = '#e74c3c';
        }
      } catch (error) {
        console.error("Fetch error:", error);
        formStatus.textContent = "Something went wrong. Please try again.";
        formStatus.style.display = 'block';
        formStatus.style.color = '#e74c3c';
      }
    });
  }


});
