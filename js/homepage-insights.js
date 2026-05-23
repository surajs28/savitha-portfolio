// js/homepage-insights.js - Dynamically loads the top 2 published posts from Supabase for index.html

document.addEventListener('DOMContentLoaded', () => {
  const dynamicPostsContainer = document.getElementById('dynamic-posts-container');
  const noInsightsMessage = document.getElementById('no-insights-message');
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
    if (!dynamicPostsContainer) return;
    const animateElements = dynamicPostsContainer.querySelectorAll('[data-animate]');
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

  const renderFallback = () => {
    if (dynamicPostsContainer) dynamicPostsContainer.innerHTML = '';
    if (noInsightsMessage) {
      noInsightsMessage.style.display = 'block';
    }
  };

  // Check if database client is ready
  const isClientReady = !!window.supabase;
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

      if (!dynamicPostsContainer) return;
      dynamicPostsContainer.innerHTML = '';

      if (!posts || posts.length === 0) {
        renderFallback();
        return;
      }

      // Hide message if there are posts
      if (noInsightsMessage) {
        noInsightsMessage.style.display = 'none';
      }

      posts.forEach((post, index) => {
        const articleElement = document.createElement('article');
        articleElement.className = 'featured-article-card';
        articleElement.setAttribute('data-animate', 'fade-up');
        articleElement.style.setProperty('--delay', (index + 3).toString());

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

        dynamicPostsContainer.appendChild(articleElement);

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

      setupScrollAnimations();

    } catch (e) {
      console.error('Error loading homepage insights:', e);
      renderFallback();
    }
  };

  fetchRecentPosts();
});
