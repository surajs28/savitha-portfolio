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
  const sections = document.querySelectorAll('section[id], #accreditations');

  const highlightNav = () => {
    let scrollY = window.pageYOffset;
    
    sections.forEach(current => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 120; // Offset for sticky navbar
      const sectionId = current.getAttribute('id');
      
      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
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
