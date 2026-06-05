// main.js - handles navigation, scroll progress, IntersectionObserver animations, modal, and count-up stats.

document.addEventListener('DOMContentLoaded', () => {
  // 0. THREAD WEAVING PRELOADER AND STAGGERED REVEAL SYSTEM
  const canvas = document.getElementById('constellation-canvas');
  const headline = document.querySelector('.hero-name-headline');
  const isFirstVisit = !sessionStorage.getItem('visited');

  // Count-up stats function for hero stats row
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
        const target = parseInt(entry.target.getAttribute('data-count-target'), 10);
        const suffix = entry.target.getAttribute('data-count-suffix') || '';
        if (!isNaN(target)) {
          setTimeout(() => {
            countUpHero(entry.target, target, suffix);
          }, 300);
        }
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  heroStatCols.forEach(col => heroStatObserver.observe(col));

  if (canvas && headline && isFirstVisit) {
    sessionStorage.setItem('visited', 'true');
    document.body.classList.add('preloader-active');
    document.body.classList.add('preloader-run-canvas');

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    // Canvas size adjustment
    const resizeCanvas = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0); // reset scale
      ctx.scale(dpr, dpr);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Text layout configuration variables
    let rect, lines, lineHeight, drawX, fontStr, isCentered;
    let textPoints = [];

    const updateTextLayout = () => {
      rect = headline.getBoundingClientRect();
      const style = window.getComputedStyle(headline);
      const fontSize = style.fontSize;
      const fontFamily = style.fontFamily;
      const fontWeight = style.fontWeight;
      fontStr = `${fontWeight} ${fontSize} ${fontFamily}`;
      isCentered = style.textAlign === 'center';
      drawX = isCentered ? (rect.left + rect.width / 2) : rect.left;
      lineHeight = parseFloat(fontSize) * 1.15;

      // Wrap text into lines
      const offCanvas = document.createElement('canvas');
      const offCtx = offCanvas.getContext('2d');
      offCtx.font = fontStr;
      const fullWidth = offCtx.measureText("Savitha Krishnamoorthy").width;
      if (fullWidth > rect.width) {
        lines = ["Savitha", "Krishnamoorthy"];
      } else {
        lines = ["Savitha Krishnamoorthy"];
      }
    };

    const sampleTextPoints = () => {
      const offCanvas = document.createElement('canvas');
      offCanvas.width = window.innerWidth;
      offCanvas.height = window.innerHeight;
      const offCtx = offCanvas.getContext('2d');

      offCtx.font = fontStr;
      offCtx.textBaseline = 'top';
      offCtx.fillStyle = '#ffffff';
      offCtx.textAlign = isCentered ? 'center' : 'left';

      lines.forEach((line, index) => {
        offCtx.fillText(line, drawX, rect.top + index * lineHeight);
      });

      const imgData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
      const data = imgData.data;
      const points = [];
      const step = window.innerWidth < 768 ? 4 : 3;

      for (let y = 0; y < offCanvas.height; y += step) {
        for (let x = 0; x < offCanvas.width; x += step) {
          const idx = (y * offCanvas.width + x) * 4;
          if (data[idx + 3] > 128) {
            points.push({ x, y });
          }
        }
      }

      // Fallback if no points sampled
      if (points.length === 0) {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        for (let i = 0; i < 200; i++) {
          points.push({
            x: centerX - 150 + Math.random() * 300,
            y: centerY - 20 + Math.random() * 40
          });
        }
      }

      return points;
    };

    const getRandomEdgePoint = (w, h) => {
      const edge = Math.floor(Math.random() * 4);
      let x, y;
      if (edge === 0) { // top
        x = Math.random() * w;
        y = -20;
      } else if (edge === 1) { // right
        x = w + 20;
        y = Math.random() * h;
      } else if (edge === 2) { // bottom
        x = Math.random() * w;
        y = h + 20;
      } else { // left
        x = -20;
        y = Math.random() * h;
      }
      return { x, y };
    };

    const getBezierPoint = (p0, p1, p2, t) => {
      const x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
      const y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;
      return { x, y };
    };

    const drawThread = (thread, opacity) => {
      if (thread.path.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(thread.path[0].x, thread.path[0].y);
      for (let i = 1; i < thread.path.length; i++) {
        ctx.lineTo(thread.path[i].x, thread.path[i].y);
      }
      ctx.strokeStyle = `rgba(232, 168, 48, ${opacity})`; // #e8a830
      ctx.lineWidth = thread.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = '#e8a830';
      ctx.shadowBlur = 4 * opacity;
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    const drawText = (opacity) => {
      ctx.font = fontStr;
      ctx.textBaseline = 'top';
      ctx.textAlign = isCentered ? 'center' : 'left';
      ctx.fillStyle = `rgba(242, 138, 34, ${opacity})`; // #f28a22
      ctx.shadowColor = `rgba(232, 168, 48, ${opacity})`; // #e8a830
      ctx.shadowBlur = 12 * opacity;
      lines.forEach((line, index) => {
        ctx.fillText(line, drawX, rect.top + index * lineHeight);
      });
      ctx.shadowBlur = 0;
    };

    const drawShimmerText = (offset) => {
      ctx.font = fontStr;
      ctx.textBaseline = 'top';
      ctx.textAlign = isCentered ? 'center' : 'left';

      const textWidth = window.innerWidth;
      const grad = ctx.createLinearGradient(0, 0, textWidth, 0);
      const baseColor = 'rgba(242, 138, 34, '; // #f28a22

      for (let i = 0; i <= 1; i += 0.2) {
        const stopX = i * textWidth;
        const phase = stopX * 0.005 - offset;
        const opacity = 0.85 + 0.15 * Math.sin(phase); // oscillates between 0.7 and 1.0
        grad.addColorStop(i, `${baseColor}${opacity})`);
      }

      ctx.fillStyle = grad;
      ctx.shadowColor = 'rgba(232, 168, 48, 0.4)';
      ctx.shadowBlur = 10;
      lines.forEach((line, index) => {
        ctx.fillText(line, drawX, rect.top + index * lineHeight);
      });
      ctx.shadowBlur = 0;
    };

    const threads = [];
    let animationFrameId;
    let startTime = null;

    // Initialize all components after fonts and layout are ready
    const initPreloader = () => {
      updateTextLayout();
      textPoints = sampleTextPoints();
      const pointsCount = textPoints.length;
      const maxThreads = window.innerWidth < 768 ? 60 : 100;
      const w = window.innerWidth;
      const h = window.innerHeight;

      // Generate threads
      for (let i = 0; i < maxThreads; i++) {
        const start = getRandomEdgePoint(w, h);
        const chaoticX = w * 0.15 + Math.random() * w * 0.7;
        const chaoticY = h * 0.15 + Math.random() * h * 0.7;

        // Control point for Phase 2 (random bulge)
        const ctrlX1 = (start.x + chaoticX) / 2 + (Math.random() - 0.5) * w * 0.4;
        const ctrlY1 = (start.y + chaoticY) / 2 + (Math.random() - 0.5) * h * 0.4;

        // Target point from sampled text
        const target = textPoints[Math.floor(Math.random() * pointsCount)];

        // Control point for Phase 3 (decelerating curve)
        const ctrlX2 = (chaoticX + target.x) / 2 + (Math.random() - 0.5) * w * 0.2;
        const ctrlY2 = (chaoticY + target.y) / 2 + (Math.random() - 0.5) * h * 0.2;

        threads.push({
          startX: start.x,
          startY: start.y,
          ctrlX1,
          ctrlY1,
          chaoticX,
          chaoticY,
          targetX: target.x,
          targetY: target.y,
          ctrlX2,
          ctrlY2,

          delay2: Math.random() * 0.3,
          speedRate2: 1 / (1 - (Math.random() * 0.2)),

          delay3: Math.random() * 0.3,
          speedRate3: 1 / (1 - (Math.random() * 0.2)),

          x: start.x,
          y: start.y,
          path: [],
          width: 0.8 + Math.random() * 0.7
        });
      }

      // Start draw loop
      animationFrameId = requestAnimationFrame(drawLoop);
    };

    // Listen to resize to keep positions aligned
    window.addEventListener('resize', () => {
      if (animationFrameId) {
        updateTextLayout();
      }
    });

    const drawLoop = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // Phase 1 (0.0s - 0.5s): Dark screen
      if (elapsed < 500) {
        // Just clear canvas
      }
      // Phase 2 (0.5s - 1.5s): Threads shoot in
      else if (elapsed >= 500 && elapsed < 1500) {
        const t = (elapsed - 500) / 1000;
        threads.forEach(thread => {
          let threadT = (t - thread.delay2) * thread.speedRate2;
          threadT = Math.max(0, Math.min(1, threadT));

          const pos = getBezierPoint(
            { x: thread.startX, y: thread.startY },
            { x: thread.ctrlX1, y: thread.ctrlY1 },
            { x: thread.chaoticX, y: thread.chaoticY },
            threadT
          );

          thread.x = pos.x;
          thread.y = pos.y;

          if (threadT > 0) {
            thread.path.push({ x: pos.x, y: pos.y });
            if (thread.path.length > 50) thread.path.shift();
          }

          drawThread(thread, 1.0);
        });
      }
      // Phase 3 (1.5s - 3.0s): Decelerating curve to letterforms
      else if (elapsed >= 1500 && elapsed < 3000) {
        const t = (elapsed - 1500) / 1500;
        threads.forEach(thread => {
          let threadT = (t - thread.delay3) * thread.speedRate3;
          threadT = Math.max(0, Math.min(1, threadT));

          const pos = getBezierPoint(
            { x: thread.chaoticX, y: thread.chaoticY },
            { x: thread.ctrlX2, y: thread.ctrlY2 },
            { x: thread.targetX, y: thread.targetY },
            threadT
          );

          thread.x = pos.x;
          thread.y = pos.y;

          thread.path.push({ x: pos.x, y: pos.y });
          if (thread.path.length > 60) thread.path.shift();

          drawThread(thread, 1.0);
        });

        // Let letters begin emerging
        const textOpacity = Math.max(0, (elapsed - 2000) / 1000) * 0.35;
        if (textOpacity > 0.01) {
          drawText(textOpacity);
        }
      }
      // Phase 4 (3.0s - 4.2s): Name solidifies, excess threads fade
      else if (elapsed >= 3000 && elapsed < 4200) {
        const t = (elapsed - 3000) / 1200;
        const textOpacity = 0.35 + t * 0.65;
        const threadOpacity = 1.0 - t;

        if (threadOpacity > 0.01) {
          threads.forEach(thread => {
            if (thread.path.length > 0) {
              if (Math.random() < 0.25) thread.path.shift();
            }
            drawThread(thread, threadOpacity);
          });
        }

        drawText(textOpacity);
      }
      // Phase 5 & 6 (4.2s+): Content reveals & Continuous shimmer
      else {
        if (document.body.classList.contains('preloader-active')) {
          document.body.classList.remove('preloader-active');
          document.body.classList.add('hero-reveal-start');
        }

        const shimmerOffset = elapsed * 0.003;
        drawShimmerText(shimmerOffset);
      }

      animationFrameId = requestAnimationFrame(drawLoop);
    };

    // Wait for fonts to be ready before starting to ensure correct sampling
    document.fonts.ready.then(() => {
      initPreloader();
    }).catch(() => {
      initPreloader();
    });
  } else {
    // Skip preloader on repeat visits or if requirements not met
    document.body.classList.remove('preloader-active');
    document.body.classList.add('hero-reveal-start');
  }

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
        // Silhouette: Head & Neck
        { x: 500, y: 100 }, // Head Top (0)
        { x: 500, y: 140 }, // Chin/Neck (1)

        // Silhouette: Shoulders & Arms
        { x: 400, y: 170 }, // Left Shoulder (2)
        { x: 600, y: 170 }, // Right Shoulder (3)
        { x: 330, y: 220 }, // Left Elbow (4)
        { x: 250, y: 270 }, // Left Hand (5)
        { x: 670, y: 220 }, // Right Elbow (6)
        { x: 750, y: 270 }, // Right Hand (7)

        // Silhouette: Torso
        { x: 430, y: 230 }, // Left Chest (8)
        { x: 570, y: 230 }, // Right Chest (9)
        { x: 500, y: 200 }, // Mid Chest/Spine (10)
        { x: 460, y: 310 }, // Left Waist (11)
        { x: 540, y: 310 }, // Right Waist (12)
        { x: 500, y: 310 }, // Mid Waist (13)

        // Silhouette: Hips & Legs
        { x: 450, y: 370 }, // Left Hip (14)
        { x: 550, y: 370 }, // Right Hip (15)
        { x: 500, y: 370 }, // Mid Hip (16)
        { x: 430, y: 470 }, // Left Knee (17)
        { x: 410, y: 560 }, // Left Foot (18)
        { x: 570, y: 470 }, // Right Knee (19)
        { x: 590, y: 560 }, // Right Foot (20)

        // Outer Constellation Stars (spanned wide to cover full canvas)
        { x: 100, y: 80  }, // Far Top Left (21)
        { x: 900, y: 80  }, // Far Top Right (22)
        { x: 150, y: 230 }, // Mid Left Outer (23)
        { x: 850, y: 230 }, // Mid Right Outer (24)
        { x: 120, y: 420 }, // Low Left Outer (25)
        { x: 880, y: 420 }, // Low Right Outer (26)
        { x: 200, y: 530 }, // Bottom Left Outer (27)
        { x: 800, y: 530 }, // Bottom Right Outer (28)
        { x: 300, y: 120 }, // Inner Top Left (29)
        { x: 700, y: 120 }, // Inner Top Right (30)
        { x: 320, y: 320 }, // Left Mid Star (31)
        { x: 680, y: 320 }, // Right Mid Star (32)
        { x: 300, y: 480 }, // Left Low Star (33)
        { x: 700, y: 480 }, // Right Low Star (34)
        { x: 500, y: 40  }, // Top Center Sky (35)
        { x: 500, y: 570 }  // Bottom Center Ground (36)
      ];

      const connections = [
        // Head & Neck
        [0, 1],
        // Shoulders
        [1, 2], [1, 3],
        // Left Arm
        [2, 4], [4, 5],
        // Right Arm
        [3, 6], [6, 7],
        // Torso / Chest
        [2, 8], [3, 9], [8, 10], [9, 10], [1, 10],
        // Torso / Waist
        [8, 11], [9, 12], [10, 13], [11, 13], [12, 13],
        // Hips
        [11, 14], [12, 15], [13, 16], [14, 16], [15, 16],
        // Left Leg
        [14, 17], [17, 18],
        // Right Leg
        [15, 19], [19, 20],

        // Outer Connections (draw lines from background stars to the figure)
        [21, 2],  // Far Top Left -> Left Shoulder
        [22, 3],  // Far Top Right -> Right Shoulder
        [23, 5],  // Mid Left Outer -> Left Hand
        [24, 7],  // Mid Right Outer -> Right Hand
        [25, 14], // Low Left Outer -> Left Hip
        [26, 15], // Low Right Outer -> Right Hip
        [27, 18], // Bottom Left Outer -> Left Foot
        [28, 20], // Bottom Right Outer -> Right Foot
        [29, 0],  // Inner Top Left -> Head Top
        [30, 0],  // Inner Top Right -> Head Top
        [31, 11], // Left Mid Star -> Left Waist
        [32, 12], // Right Mid Star -> Right Waist
        [33, 17], // Left Low Star -> Left Knee
        [34, 19], // Right Low Star -> Right Knee
        [35, 0],  // Top Center Sky -> Head Top
        [36, 18], // Bottom Center Ground -> Left Foot
        [36, 20]  // Bottom Center Ground -> Right Foot
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
