// main.js - handles navigation, scroll progress, IntersectionObserver animations, modal, and count-up stats.

document.addEventListener('DOMContentLoaded', () => {
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

  // 8. HTML5 CANVAS CONSTELLATION ANIMATION (HERO SECTION REDESIGN)
  const constellationCanvas = document.getElementById('constellation-canvas');
  if (constellationCanvas) {
    const initConstellation = (canvas) => {
      const ctx = canvas.getContext('2d');
      let animationFrameId;
      let isVisible = true;

      // Coordinates mapping (1000 x 600 virtual box)
      const points = [
        // 1. Head & Neck (Indices 0 - 5)
        { x: 500, y: 100, isSil: true }, // Head Top (0)
        { x: 480, y: 120, isSil: true }, // Head Left (1)
        { x: 520, y: 120, isSil: true }, // Head Right (2)
        { x: 500, y: 145, isSil: true }, // Chin (3)
        { x: 485, y: 160, isSil: true }, // Left Neck (4)
        { x: 515, y: 160, isSil: true }, // Right Neck (5)

        // 2. Shoulders & Arms (Indices 6 - 11)
        { x: 445, y: 175, isSil: true }, // Left Shoulder (6)
        { x: 555, y: 175, isSil: true }, // Right Shoulder (7)
        { x: 415, y: 220, isSil: true }, // Left Elbow (8)
        { x: 585, y: 220, isSil: true }, // Right Elbow (9)
        { x: 390, y: 275, isSil: true }, // Left Hand (10)
        { x: 610, y: 275, isSil: true }, // Right Hand (11)

        // 3. Torso (Indices 12 - 17)
        { x: 475, y: 215, isSil: true }, // Left Chest (12)
        { x: 525, y: 215, isSil: true }, // Right Chest (13)
        { x: 500, y: 200, isSil: true }, // Mid Chest (14)
        { x: 465, y: 275, isSil: true }, // Left Waist (15)
        { x: 535, y: 275, isSil: true }, // Right Waist (16)
        { x: 500, y: 275, isSil: true }, // Mid Waist (17)

        // 4. Hips & Legs (Indices 18 - 24)
        { x: 455, y: 345, isSil: true }, // Left Hip (18)
        { x: 545, y: 345, isSil: true }, // Right Hip (19)
        { x: 500, y: 345, isSil: true }, // Mid Hip (20)
        { x: 470, y: 440, isSil: true }, // Left Knee (21)
        { x: 530, y: 440, isSil: true }, // Right Knee (22)
        { x: 480, y: 535, isSil: true }, // Left Foot (23)
        { x: 520, y: 535, isSil: true }, // Right Foot (24)

        // 5. Scattered Outer Stars (Indices 25 - 34)
        { x: 300, y: 80, isSil: false },  // Top Left (25)
        { x: 700, y: 80, isSil: false },  // Top Right (26)
        { x: 220, y: 200, isSil: false }, // Mid Left Outer (27)
        { x: 780, y: 200, isSil: false }, // Mid Right Outer (28)
        { x: 260, y: 380, isSil: false }, // Low Left Outer (29)
        { x: 740, y: 380, isSil: false }, // Low Right Outer (30)
        { x: 340, y: 500, isSil: false }, // Bottom Left Outer (31)
        { x: 660, y: 500, isSil: false }, // Bottom Right Outer (32)
        { x: 380, y: 120, isSil: false }, // High Mid Left (33)
        { x: 620, y: 120, isSil: false }  // High Mid Right (34)
      ];

      const connections = [
        // Head
        [0, 1], [0, 2], [1, 3], [2, 3],
        // Neck
        [3, 4], [3, 5],
        // Shoulders & Chest
        [4, 6], [5, 7], [6, 12], [7, 13], [12, 14], [13, 14],
        // Arms
        [6, 8], [8, 10], [7, 9], [9, 11],
        // Torso
        [12, 15], [13, 16], [14, 17], [15, 17], [16, 17],
        // Hips
        [15, 18], [16, 19], [17, 20], [18, 20], [19, 20],
        // Legs
        [18, 21], [19, 22], [21, 23], [22, 24], [23, 24],

        // Outer Star Connections (drawing into the silhouette)
        [25, 1],  // Top Left to Head Left
        [26, 2],  // Top Right to Head Right
        [33, 6],  // High Mid Left to Left Shoulder
        [34, 7],  // High Mid Right to Right Shoulder
        [27, 8],  // Mid Left Outer to Left Elbow
        [28, 9],  // Mid Right Outer to Right Elbow
        [29, 15], // Low Left Outer to Left Waist
        [30, 16], // Low Right Outer to Right Waist
        [31, 21], // Bottom Left Outer to Left Knee
        [32, 22]  // Bottom Right Outer to Right Knee
      ];

      // Staggered appear times (0ms to 2500ms)
      points.forEach((p) => {
        p.appearTime = Math.random() * 2500;
        p.pulsePhase = Math.random() * Math.PI * 2;
        p.pulseSpeed = 0.0015 + Math.random() * 0.0015;
      });

      // Staggered line drawing start times (2500ms to 4200ms)
      const connectionsObj = connections.map(([i1, i2]) => {
        const p1 = points[i1];
        const p2 = points[i2];
        const earliestStart = Math.max(p1.appearTime, p2.appearTime, 2500);
        const drawStart = Math.max(2500, earliestStart + Math.random() * (4200 - earliestStart));
        return {
          i1,
          i2,
          drawStart,
          drawDuration: 1000
        };
      });

      let startTime = null;

      const resize = () => {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
      };

      window.addEventListener('resize', resize);
      resize();

      const draw = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const width = canvas.width / (window.devicePixelRatio || 1);
        const height = canvas.height / (window.devicePixelRatio || 1);

        // Centered contain scale matching aspect ratio of 1000 x 600
        const scale = Math.min(width / 1000, height / 600) * 0.85;
        const centerX = width / 2;
        const centerY = height / 2;

        const getRenderCoords = (p) => {
          return {
            x: centerX + (p.x - 500) * scale,
            y: centerY + (p.y - 300) * scale
          };
        };

        // Draw connection lines
        ctx.lineWidth = 1;
        connectionsObj.forEach(conn => {
          const p1 = points[conn.i1];
          const p2 = points[conn.i2];

          if (elapsed >= p1.appearTime && elapsed >= p2.appearTime) {
            if (elapsed < conn.drawStart) return;

            const progress = Math.min((elapsed - conn.drawStart) / conn.drawDuration, 1);
            const c1 = getRenderCoords(p1);
            const c2 = getRenderCoords(p2);

            ctx.beginPath();
            ctx.moveTo(c1.x, c1.y);
            ctx.lineTo(c1.x + (c2.x - c1.x) * progress, c1.y + (c2.y - c1.y) * progress);
            
            // Soft white-gold lines
            ctx.strokeStyle = `rgba(255, 220, 120, ${progress * 0.35})`;
            ctx.stroke();
          }
        });

        // Draw dots
        points.forEach(p => {
          if (elapsed >= p.appearTime) {
            const coords = getRenderCoords(p);
            let fadeOpacity = Math.min((elapsed - p.appearTime) / 300, 1);
            
            let pulseScale = 1;
            if (elapsed >= 5200) {
              pulseScale = 1 + 0.3 * Math.sin((elapsed - 5200) * p.pulseSpeed + p.pulsePhase);
            } else {
              pulseScale = Math.min((elapsed - p.appearTime) / 300, 1);
            }

            const radius = 2.5 * pulseScale;
            
            // Outer pulse glow
            ctx.beginPath();
            ctx.arc(coords.x, coords.y, radius * 3.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(232, 168, 48, ${fadeOpacity * 0.15})`;
            ctx.fill();

            // Inner gold dot
            ctx.beginPath();
            ctx.arc(coords.x, coords.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(232, 168, 48, ${fadeOpacity * 0.95})`;
            ctx.fill();
          }
        });

        if (isVisible) {
          animationFrameId = requestAnimationFrame(draw);
        }
      };

      const ob = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          isVisible = entry.isIntersecting;
          if (isVisible) {
            startTime = null;
            animationFrameId = requestAnimationFrame(draw);
          } else {
            cancelAnimationFrame(animationFrameId);
          }
        });
      }, { threshold: 0.05 });
      ob.observe(canvas);
    };

    initConstellation(constellationCanvas);
  }
});
