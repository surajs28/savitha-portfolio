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
    excerpt: "The way one treats another can, for better or worse, be transforming. Drawing from George Bernard Shaw's 'Pygmalion' and psychological research, this piece explores the power of positive expectations in leadership.",
    content: `
      <p class="lead-text">
        Anyone who is familiar with the play ‘Pygmalion’ by George Bernard Shaw, would know about an experiment which started on a casual conversation and went on to become a serious study. In a nutshell this is a story about how Professor Higgins, a scientist of phonetics, lays a bet to Colonel Pickering that he will convert a mere flower girl, Eliza Doolittle, who is rough in her dialect and present her as poised and well-spoken as a Duchess. While Professor Higgins works and is successful on the physical transformation the insight is brilliantly put by Eliza: <em>“The difference between a lady and a flower girl is not how she behaves but how she is treated. I will always be a Flower girl to Prof. Higgins because he always treats me like a flower girl, but I know I can be a lady to you because you treat me as one and always will.”</em>
      </p>
      <p>
        This play is inspired by the ‘Pygmalion effect’. The Pygmalion effect is a psychological phenomenon wherein it is believed that high expectations can lead to improved performance. Its name comes from the story of Pygmalion, a mythical Greek sculptor. Pygmalion carved a statue of a woman and then became enamored with it. Unable to love a human, Pygmalion appealed to Aphrodite, the goddess of love. She took pity and brought the statue to life.
      </p>
      <p>
        The insights from Pygmalion effect are widely practiced in educational institutions. Research by Robert Rosenthal and Lenore Jacobson examined the influence of teachers’ expectations on students’ performance. Interesting studies have been carried out where students who were picked randomly were presented as ‘Gifted’, which in turn has had a positive psychological impact on teachers. These children in many cases ended up excelling as the teachers projected higher expectations and in many cases encouragement as well.
      </p>
      <p>
        The powerful influence of a person’s expectation, especially leaders or mentors on an individual’s behavior, has long been recognized by psychologists and even workplaces today.
        It presents a theory that many a times people outperform because of the positive expectations set on them by their managers or parents or teachers etc. To elaborate what it means is the way one person treats another can, for better or worse, be transforming. Managers who believe their team members have potential and frequently offer encouragement and positive reinforcements are likely to build more successful teams.
      </p>
      <p>
        Insights from ‘Pygmalion in Management’ by J Sterling Livingston, state many a time Managers unintentionally treat their subordinates in a way that could lead to lower expectations than the subordinate could be capable of. This is also because interestingly at a psychological level, people often believe they can only deliver what is expected of them.
      </p>
      <p>
        Often in coffee conversations with colleagues, when you discuss about managers who inspire them, apart from the domain competence it is often about: <em>“He believed in my ability even more than I did on myself,”</em> or <em>“She told me 'I know you can do this, you are not seeing it yet, but I can clearly see this.'”</em>
      </p>
      <p>
        There is common folk tale related to the Solomon Island where it is believed that a tree if it had to be brought down can be done so by the combined effort of the Islanders cursing negatively and yelling at the tree. While whether this is true or not is debatable, it does emphasize the impact of repeated negative expectations and statements on one’s psyche and hence performance as well.
      </p>
      <p>
        If we know this then what’s really the issue? Well, it’s easier said than done. Our own inhibitions, experiences and deep-rooted personality traits could come in the way of setting and communicating positive expectations from people around us. It is often difficult to recognize how easily we end up transmitting negative feelings.
      </p>
      <p>
        However, being aware of the impact of our expectations and the way it is communicated by managers can go a long way in building positivity. Feedback both positive as well as citing improvement areas could be motivating and further enhance performance. Research by McClelland and Atkinson also indicates that the Pygmalion effect drops if we see our chance of success as being less than 50%. This explains that while high expectations are beneficial, it is up to the point of diminishing returns.
      </p>
      <p>
        Whether consciously or not, leaders facilitate changes in behavior, hence a deliberate effort to state positive expectations and create positive reinforcement can do more good than harm.
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
