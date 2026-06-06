// main.js - handles navigation, scroll progress, IntersectionObserver animations, modal, and count-up stats.

document.addEventListener('DOMContentLoaded', () => {
  // 0. SIGNATURE PRELOADER AND SEQUENCE FLOW
  const canvas = document.getElementById('constellation-canvas');
  const dotEl = document.getElementById('signature-glowing-dot');
  const isFirstVisit = !sessionStorage.getItem('visited');

  // Easing function
  const easeInOutQuad = (x) => {
    return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  };

  // Cursive signature control points for "Savitha Krishnamoorthy"
  const signaturePoints = [
    // S
    { x: 100, y: 250 }, { x: 80,  y: 180 }, { x: 100, y: 120 }, { x: 140, y: 100 },
    { x: 120, y: 180 }, { x: 140, y: 240 }, { x: 110, y: 260 }, { x: 130, y: 240 },
    // a
    { x: 160, y: 200 }, { x: 145, y: 220 }, { x: 160, y: 240 }, { x: 170, y: 200 },
    { x: 175, y: 240 },
    // v
    { x: 190, y: 210 }, { x: 200, y: 240 }, { x: 210, y: 210 }, { x: 220, y: 205 },
    // i
    { x: 230, y: 240 }, { x: 235, y: 205 }, { x: 240, y: 240 },
    // t
    { x: 250, y: 150 }, { x: 255, y: 240 },
    // h
    { x: 275, y: 120 }, { x: 270, y: 150 }, { x: 275, y: 240 }, { x: 290, y: 210 },
    { x: 300, y: 240 },
    // a
    { x: 325, y: 210 }, { x: 315, y: 225 }, { x: 325, y: 240 }, { x: 335, y: 210 },
    { x: 340, y: 240 },
    // Sweep back to cross 't'
    { x: 300, y: 185 }, { x: 230, y: 185 }, { x: 270, y: 185 }, { x: 350, y: 210 },
    // K
    { x: 370, y: 240 }, { x: 365, y: 100 }, { x: 360, y: 130 }, { x: 370, y: 240 },
    { x: 400, y: 120 }, { x: 390, y: 170 }, { x: 395, y: 180 }, { x: 415, y: 240 },
    // r
    { x: 435, y: 210 }, { x: 440, y: 205 }, { x: 445, y: 210 }, { x: 450, y: 240 },
    // i
    { x: 465, y: 205 }, { x: 470, y: 240 },
    // s
    { x: 490, y: 205 }, { x: 480, y: 230 }, { x: 495, y: 240 },
    // h
    { x: 520, y: 120 }, { x: 515, y: 150 }, { x: 520, y: 240 }, { x: 535, y: 210 },
    { x: 545, y: 240 },
    // n
    { x: 565, y: 210 }, { x: 570, y: 240 }, { x: 585, y: 210 }, { x: 595, y: 240 },
    // a
    { x: 620, y: 210 }, { x: 610, y: 225 }, { x: 620, y: 240 }, { x: 630, y: 210 },
    { x: 635, y: 240 },
    // m
    { x: 655, y: 210 }, { x: 660, y: 240 }, { x: 675, y: 210 }, { x: 680, y: 240 },
    { x: 695, y: 210 }, { x: 705, y: 240 },
    // o
    { x: 730, y: 210 }, { x: 720, y: 225 }, { x: 730, y: 240 }, { x: 735, y: 210 },
    // o
    { x: 755, y: 210 }, { x: 745, y: 225 }, { x: 755, y: 240 }, { x: 760, y: 210 },
    // r
    { x: 780, y: 210 }, { x: 785, y: 205 }, { x: 790, y: 210 }, { x: 795, y: 240 },
    // t
    { x: 810, y: 150 }, { x: 815, y: 240 },
    // h
    { x: 835, y: 120 }, { x: 830, y: 150 }, { x: 835, y: 240 }, { x: 850, y: 210 },
    { x: 860, y: 240 },
    // y
    { x: 880, y: 210 }, { x: 885, y: 230 }, { x: 895, y: 210 }, { x: 900, y: 240 },
    { x: 890, y: 290 }, { x: 870, y: 310 }, { x: 910, y: 250 },
    // Underline flourish
    { x: 800, y: 260 }, { x: 600, y: 265 }, { x: 400, y: 265 }, { x: 300, y: 260 },
    { x: 500, y: 270 }, { x: 700, y: 275 }, { x: 930, y: 265 }
  ];

  // Catmull-Rom spline generator
  const generateSplinePoints = (controlPoints, segmentsPerStep = 60) => {
    const points = [];
    const n = controlPoints.length;
    if (n < 4) return controlPoints;

    const getCatmullRomPoint = (p0, p1, p2, p3, t) => {
      const t2 = t * t;
      const t3 = t2 * t;
      const x = 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
      const y = 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
      return { x, y };
    };

    for (let i = 0; i < n - 1; i++) {
      const p0 = controlPoints[Math.max(0, i - 1)];
      const p1 = controlPoints[i];
      const p2 = controlPoints[Math.min(n - 1, i + 1)];
      const p3 = controlPoints[Math.min(n - 1, i + 2)];

      for (let step = 0; step < segmentsPerStep; step++) {
        const t = step / segmentsPerStep;
        points.push(getCatmullRomPoint(p0, p1, p2, p3, t));
      }
    }
    points.push(controlPoints[n - 1]);
    return points;
  };

  const finishPreloader = () => {
    document.body.classList.remove('preloader-active');
    document.body.classList.add('hero-reveal-signature');
    if (!document.body.classList.contains('hero-start-reveal')) {
      document.body.classList.add('hero-start-reveal');
    }
    if (dotEl) dotEl.style.display = 'none';
  };

  const runSignaturePreloader = () => {
    sessionStorage.setItem('visited', 'true');
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    let width, height, scale, dx, dy, densePoints;

    const setupDimensions = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      // Recalculate signature scaling to fit proportionally
      const paddingX = width * 0.08;
      const paddingY = height * 0.15;
      const availW = width - paddingX * 2;
      const availH = height - paddingY * 2;

      const scaleX = availW / 850;
      const scaleY = availH / 220;
      scale = Math.min(scaleX, scaleY);

      dx = width / 2 - 515 * scale;
      dy = height / 2 - 205 * scale;

      const scaledControlPoints = signaturePoints.map(p => ({
        x: dx + p.x * scale,
        y: dy + p.y * scale
      }));

      densePoints = generateSplinePoints(scaledControlPoints, 60);
    };

    setupDimensions();
    window.addEventListener('resize', setupDimensions);

    let startTime = null;
    let animationFrameId = null;

    const draw = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      ctx.clearRect(0, 0, width, height);

      // Phase 1 (0s–0.5s): Dark screen. Nothing is visible.
      if (elapsed < 500) {
        if (dotEl) dotEl.style.display = 'none';
        animationFrameId = requestAnimationFrame(draw);
      }
      // Phase 2 (0.5s–3.3s): Signature writes (2.8s duration)
      else if (elapsed >= 500 && elapsed < 3300) {
        const t = (elapsed - 500) / 2800;
        const p = easeInOutQuad(t);
        const totalLen = densePoints.length;
        const currentIndex = Math.floor(p * (totalLen - 1));

        // Draw background base stroke
        ctx.beginPath();
        if (currentIndex > 0) {
          ctx.moveTo(densePoints[0].x, densePoints[0].y);
          for (let i = 1; i <= currentIndex; i++) {
            ctx.lineTo(densePoints[i].x, densePoints[i].y);
          }
        }
        ctx.strokeStyle = 'rgba(232, 168, 48, 0.85)'; // #e8a830
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Draw shimmer highlight (80 points behind)
        const shimmerStart = Math.max(0, currentIndex - 80);
        if (currentIndex > shimmerStart) {
          ctx.beginPath();
          ctx.moveTo(densePoints[shimmerStart].x, densePoints[shimmerStart].y);
          for (let i = shimmerStart + 1; i <= currentIndex; i++) {
            ctx.lineTo(densePoints[i].x, densePoints[i].y);
          }
          ctx.strokeStyle = 'rgba(255, 230, 120, 0.6)';
          ctx.lineWidth = 2.2;
          ctx.stroke();
        }

        // Position glowing dot at the tip
        if (dotEl && currentIndex >= 0) {
          const tip = densePoints[currentIndex];
          dotEl.style.display = 'block';
          dotEl.style.left = `${tip.x}px`;
          dotEl.style.top = `${tip.y}px`;
          dotEl.style.opacity = '1';
        }

        animationFrameId = requestAnimationFrame(draw);
      }
      // Phase 3 (3.3s–4.5s): Hold & Shimmer Travel (1.2s duration)
      else if (elapsed >= 3300 && elapsed < 4500) {
        const totalLen = densePoints.length;

        // Draw complete base signature
        ctx.beginPath();
        ctx.moveTo(densePoints[0].x, densePoints[0].y);
        for (let i = 1; i < totalLen; i++) {
          ctx.lineTo(densePoints[i].x, densePoints[i].y);
        }
        ctx.strokeStyle = 'rgba(232, 168, 48, 0.85)';
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Travel shimmer across completed stroke
        const shimmerProgress = (elapsed - 3300) / 1200;
        const shimmerStart = Math.min(totalLen - 1, Math.floor((totalLen - 1 - 80) + shimmerProgress * 80));
        const shimmerEnd = Math.min(totalLen - 1, shimmerStart + 80);

        if (shimmerEnd > shimmerStart) {
          ctx.beginPath();
          ctx.moveTo(densePoints[shimmerStart].x, densePoints[shimmerStart].y);
          for (let i = shimmerStart + 1; i <= shimmerEnd; i++) {
            ctx.lineTo(densePoints[i].x, densePoints[i].y);
          }
          ctx.strokeStyle = 'rgba(255, 230, 120, 0.6)';
          ctx.lineWidth = 2.2;
          ctx.stroke();
        }

        // Fade glowing dot
        if (dotEl) {
          const dotOpacity = 1.0 - (elapsed - 3300) / 600;
          dotEl.style.opacity = Math.max(0, dotOpacity).toString();
          if (dotOpacity <= 0) dotEl.style.display = 'none';
        }

        animationFrameId = requestAnimationFrame(draw);
      }
      // Phase 4 (4.5s–6.0s): Stroke slowly fades out while hero content starts revealing (1.5s duration)
      else if (elapsed >= 4500 && elapsed < 6000) {
        if (dotEl) dotEl.style.display = 'none';
        
        // Start the hero reveal sequence overlapping with the fade out
        if (!document.body.classList.contains('hero-start-reveal')) {
          document.body.classList.add('hero-start-reveal');
        }

        const totalLen = densePoints.length;
        const progress = (elapsed - 4500) / 1500;
        const strokeOpacity = 1.0 - progress;

        ctx.beginPath();
        ctx.moveTo(densePoints[0].x, densePoints[0].y);
        for (let i = 1; i < totalLen; i++) {
          ctx.lineTo(densePoints[i].x, densePoints[i].y);
        }
        ctx.strokeStyle = `rgba(232, 168, 48, ${Math.max(0, strokeOpacity * 0.85)})`;
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        animationFrameId = requestAnimationFrame(draw);
      }
      // Phase 5 (6.0s+): Final reveal state
      else {
        ctx.clearRect(0, 0, width, height);
        cancelAnimationFrame(animationFrameId);
        finishPreloader();
      }
    };

    animationFrameId = requestAnimationFrame(draw);
  };

  if (canvas && isFirstVisit) {
    runSignaturePreloader();
  } else {
    finishPreloader();
  }

  // Count-up stats observer for hero stats row
  const heroStatCols = document.querySelectorAll('.hero-stat-col');
  const countUpHero = (element, targetValue, suffix) => {
    let startTimestamp = null;
    const duration = 1800; // count duration 1.8s
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
            if (isFirstVisit) {
              const timeElapsed = performance.now();
              const delay = Math.max(0, 6200 - timeElapsed);
              setTimeout(() => {
                countUpHero(entry.target, target, suffix);
              }, delay);
            } else {
              setTimeout(() => {
                countUpHero(entry.target, target, suffix);
              }, 300);
            }
          }
        };

        startCount();
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
