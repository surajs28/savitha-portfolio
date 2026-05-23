// js/homepage-insights.js - Dynamically loads the top 2 published posts from Supabase for index.html

document.addEventListener('DOMContentLoaded', () => {
  const homepageInsightsContainer = document.getElementById('homepage-insights-container');
  const articleModal = document.getElementById('article-modal');
  const modalTag = articleModal ? articleModal.querySelector('.modal-tag') : null;
  const modalTitle = articleModal ? articleModal.querySelector('.modal-title') : null;
  const modalBody = articleModal ? articleModal.querySelector('.modal-body-text') : null;

  // Format date to "DD Month YYYY" (e.g., 14 May 2025)
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const options = { day: 'numeric', month: 'long', year: 'numeric' };
      return date.toLocaleDateString('en-GB', options);
    } catch (e) {
      console.error('Error formatting date:', e);
      return '';
    }
  };

  const setupScrollAnimations = () => {
    const animateElements = document.querySelectorAll('#homepage-insights-container [data-animate]');
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    animateElements.forEach(el => observer.observe(el));
  };

  // Default fallback Pygmalion article details
  const fallbackArticle = {
    title: "Power of Expectations – The Pygmalion Way",
    category: "Leadership · Psychology · Management",
    date: "14 May 2025",
    excerpt: "High expectations from leaders can be transformative. Drawing from the Pygmalion effect and research by Rosenthal & Jacobson, this piece explores how managers who believe in their people — and show it — build consistently stronger, more motivated teams.",
    content: `
      <p class="lead-text">
        It is one of the most compelling insights in behavioral psychology: the expectations we hold of others can directly dictate their performance. Known as the <strong>Pygmalion Effect</strong>, this phenomenon suggests that human capability is not fixed; it is elastic, reacting dynamically to the belief systems of those who lead.
      </p>
      <p>
        In their seminal 1968 study, researchers Robert Rosenthal and Lenore Jacobson demonstrated that when teachers were led to believe certain students were "academic bloomers," those students showed significant, measurable IQ improvements by the end of the year—solely because of the teachers' subtle, non-verbal changes in attention, support, and feedback.
      </p>
      <h3>The HR Application: Setting the Ceiling</h3>
      <p>
        In an organizational context, the Pygmalion Effect operates as a silent architect of culture. When managers believe their employees are inherently capable, resourceful, and motivated, they interact with them in ways that manifest those traits. They delegate more challenging work, offer constructive guidance rather than punitive correction, and provide the psychological safety required for innovation.
      </p>
      <p>
        Conversely, the <strong>Golem Effect</strong>—the negative counterpart—shows that low expectations lead to diminished performance. Micro-management is the ultimate corporate manifestation of the Golem Effect; it signals a lack of trust, causing employees to withdraw, second-guess their instincts, and eventually perform to the low bar set for them.
      </p>
      <blockquote>
        "Treat a man as he is and he will remain as he is. Treat a man as he can be and should be, and he will become as he can and should be." <br>
        <cite>— Johann Wolfgang von Goethe</cite>
      </blockquote>
      <h3>Practical Strategies for Leaders</h3>
      <p>
        To harness the power of expectations, organizations must build cultures that train managers to:
      </p>
      <ul>
        <li><strong>Frame feedback constructively:</strong> Focus on potential and future performance rather than historic failures.</li>
        <li><strong>Provide stretch assignments:</strong> Actively push team members beyond their comfortable boundaries, accompanied by clear structural support.</li>
        <li><strong>Deconstruct systemic biases:</strong> Regularly review assessment criteria to ensure managers' subjective expectations do not skew evaluations.</li>
      </ul>
      <p>
        Expectations are not mere passive thoughts; they are active forces. By elevating what we believe our teams can achieve, we don't just measure capability—we create it.
      </p>
    `
  };

  const renderFallback = () => {
    if (!homepageInsightsContainer) return;
    homepageInsightsContainer.innerHTML = `
      <article class="featured-article-card" data-animate="fade-up" style="--delay: 2;">
        <div class="article-meta">
          <span class="article-tag">${fallbackArticle.category}</span>
        </div>
        <h3 class="article-title">${fallbackArticle.title}</h3>
        <p class="article-excerpt">${fallbackArticle.excerpt}</p>
        <button id="open-article-btn" class="article-cta-btn">Read Article <span class="arrow">→</span></button>
      </article>

      <article class="placeholder-article-card" data-animate="fade-up" style="--delay: 3;">
        <div class="placeholder-content">
          <h3 class="placeholder-title">More articles coming soon</h3>
          <p class="placeholder-desc">Reflections on future organizational models, compensation structures, and corporate culture shifts.</p>
        </div>
      </article>
    `;
    setupScrollAnimations();
    
    // Bind click event to open fallback article in the modal
    const openBtn = document.getElementById('open-article-btn');
    if (openBtn && articleModal && modalTag && modalTitle && modalBody) {
      openBtn.addEventListener('click', () => {
        modalTag.innerHTML = `Perspectives &bull; Leadership &bull; Psychology`;
        modalTitle.textContent = fallbackArticle.title;
        modalBody.innerHTML = fallbackArticle.content;
        
        articleModal.classList.remove('hidden');
        articleModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
      });
    }
  };

  // Check if database client is ready
  const isClientReady = window.supabase && typeof window.supabase.createClient === 'function';
  if (!isClientReady) {
    renderFallback();
    return;
  }

  // Fetch the 2 most recent published posts
  const fetchRecentPosts = async () => {
    try {
      const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(2);

      if (error) {
        throw error;
      }

      if (!posts || posts.length === 0) {
        renderFallback();
        return;
      }

      homepageInsightsContainer.innerHTML = '';

      posts.forEach((post, index) => {
        const articleElement = document.createElement('article');
        articleElement.className = 'featured-article-card';
        articleElement.setAttribute('data-animate', 'fade-up');
        articleElement.style.setProperty('--delay', (index + 2).toString());

        const tag = post.category || 'Leadership';
        const dateStr = formatDate(post.created_at);
        const excerptText = post.content.length > 220 ? post.content.substring(0, 217) + '...' : post.content;

        articleElement.innerHTML = `
          <div class="article-meta">
            <span class="article-tag">${tag} &bull; ${dateStr}</span>
          </div>
          <h3 class="article-title">${post.title}</h3>
          <p class="article-excerpt">${excerptText}</p>
          <button class="article-cta-btn read-dynamic-btn">Read Article <span class="arrow">→</span></button>
        `;

        homepageInsightsContainer.appendChild(articleElement);

        // Bind modal open event
        const readBtn = articleElement.querySelector('.read-dynamic-btn');
        if (readBtn && articleModal && modalTag && modalTitle && modalBody) {
          readBtn.addEventListener('click', () => {
            modalTag.innerHTML = `Perspectives &bull; ${tag} &bull; ${dateStr}`;
            modalTitle.textContent = post.title;
            
            // Format HTML body text from content newlines
            const formattedContent = post.content.split('\n\n').map(p => {
              if (p.startsWith('###')) {
                return `<h3>${p.replace('###', '').trim()}</h3>`;
              }
              if (p.startsWith('*') || p.startsWith('-')) {
                const listItems = p.split('\n').map(item => `<li>${item.replace(/^[*+-]/, '').trim()}</li>`).join('');
                return `<ul>${listItems}</ul>`;
              }
              return `<p>${p.trim()}</p>`;
            }).join('');
            
            modalBody.innerHTML = formattedContent;

            // Handle LinkedIn Link in modal if present
            if (post.linkedin_url && post.linkedin_url.trim() !== '') {
              const linkHTML = `
                <div class="modal-footer-links" style="margin-top: 2rem; border-top: 1px solid var(--color-divider); padding-top: 1.5rem;">
                  <a href="${post.linkedin_url}" class="post-linkedin-link" target="_blank" rel="noopener noreferrer">
                    View on LinkedIn <span class="arrow">→</span>
                  </a>
                </div>
              `;
              modalBody.insertAdjacentHTML('beforeend', linkHTML);
            }

            articleModal.classList.remove('hidden');
            articleModal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
          });
        }
      });

      // If only 1 post exists, render a placeholder next to it
      if (posts.length === 1) {
        const placeholder = document.createElement('article');
        placeholder.className = 'placeholder-article-card';
        placeholder.setAttribute('data-animate', 'fade-up');
        placeholder.style.setProperty('--delay', '3');
        placeholder.innerHTML = `
          <div class="placeholder-content">
            <h3 class="placeholder-title">More articles coming soon</h3>
            <p class="placeholder-desc">Reflections on future organizational models, compensation structures, and corporate culture shifts.</p>
          </div>
        `;
        homepageInsightsContainer.appendChild(placeholder);
      }

      setupScrollAnimations();

    } catch (e) {
      console.error('Error loading homepage insights:', e);
      renderFallback();
    }
  };

  fetchRecentPosts();
});
