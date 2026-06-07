// js/articles.js - Dynamically loads published posts from Supabase for articles.html

document.addEventListener('DOMContentLoaded', () => {
  const postsFeed = document.getElementById('posts-feed');
  const supabase = window.supabase;

  // Handle database connection library failure
  const isClientReady = !!supabase;
  if (!isClientReady) {
    if (postsFeed) {
      postsFeed.innerHTML = `
        <div class="posts-error">
          <p>Unable to connect to the database. The database library failed to load or initialize.</p>
        </div>
      `;
    }
    return;
  }

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

  // Helper to escape HTML characters to prevent XSS
  const escapeHTML = (str) => {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  // Helper to parse image_url string into an array
  const parseImages = (imageUrlString) => {
    if (!imageUrlString || imageUrlString.trim() === '') return [];
    const trimmed = imageUrlString.trim();
    if (trimmed.startsWith('[')) {
      try {
        return JSON.parse(trimmed);
      } catch (e) {
        console.error('Failed to parse image_url JSON:', e);
      }
    }
    if (trimmed.includes(',')) {
      return trimmed.split(',').map(url => url.trim()).filter(url => url !== '');
    }
    return [trimmed];
  };

  // Helper to build gallery HTML
  const getGalleryHTML = (images, title) => {
    if (images.length === 0) return '';
    if (images.length === 1) {
      return `
        <div class="post-featured-image-wrapper">
          <img src="${escapeHTML(images[0])}" alt="${escapeHTML(title)}" class="post-featured-image" />
        </div>
      `;
    }
    const thumbs = images.map(url => `
      <img src="${escapeHTML(url)}" alt="${escapeHTML(title)}" class="post-gallery-img" onclick="window.open('${escapeHTML(url)}', '_blank')" style="cursor: pointer;" />
    `).join('');
    return `<div class="post-gallery-grid">${thumbs}</div>`;
  };

  // Setup scroll animation observer for dynamically loaded elements
  const setupScrollAnimations = () => {
    const posts = document.querySelectorAll('.editorial-post[data-animate]');
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

    posts.forEach(post => observer.observe(post));
  };

  // Fetch published posts from Supabase
  const fetchPosts = async () => {
    try {
      // Query supabase for posts ordered by created_at DESC
      const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Clear skeleton loader
      postsFeed.innerHTML = '';

      if (!posts || posts.length === 0) {
        // Render empty state
        postsFeed.innerHTML = `
          <div class="posts-empty" data-animate="fade-up">
            <em>New perspectives coming soon.</em>
          </div>
        `;
        setupScrollAnimations();
        return;
      }

      // Render posts editorial feed
      posts.forEach((post, index) => {
        const postElement = document.createElement('article');
        postElement.className = 'editorial-post';
        postElement.setAttribute('data-animate', 'fade-up');
        // Add manual delay staggered animations
        postElement.style.setProperty('--delay', index % 3);

        const categoryPill = `<span class="post-category-pill">${post.category || 'Leadership'}</span>`;
        const postDate = `<span class="post-date">${formatDate(post.created_at)}</span>`;
        const postTitle = `<h2 class="post-title">${post.title}</h2>`;
        
        // Handle newlines and markdown-like syntax securely
        const safeContent = document.createElement('div');
        safeContent.className = 'post-content modal-body-text';
        safeContent.style.whiteSpace = 'normal';
        
        // Using escapeHTML from outer scope

        const formattedContent = post.content.split('\n\n').map(p => {
          const trimmed = p.trim();
          if (trimmed.startsWith('###')) {
            return `<h3>${escapeHTML(trimmed.replace('###', '').trim())}</h3>`;
          }
          if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
            const listItems = trimmed.split('\n').map(item => {
              return `<li>${escapeHTML(item.replace(/^[*+-]\s*/, '').trim())}</li>`;
            }).join('');
            return `<ul>${listItems}</ul>`;
          }
          return `<p>${escapeHTML(trimmed)}</p>`;
        }).join('');

        safeContent.innerHTML = formattedContent;
        
        let linkedinLink = '';
        if (post.linkedin_url && post.linkedin_url.trim() !== '') {
          linkedinLink = `
            <a href="${post.linkedin_url}" class="post-linkedin-link" target="_blank" rel="noopener noreferrer">
              View on LinkedIn <span class="arrow">→</span>
            </a>
          `;
        }

        postElement.innerHTML = `
          <div class="post-header-meta">
            ${categoryPill}
            ${postDate}
          </div>
          ${postTitle}
        `;
        
        // Add featured image or gallery if present
        const images = parseImages(post.image_url);
        if (images.length > 0) {
          const galleryHTML = getGalleryHTML(images, post.title);
          if (galleryHTML !== '') {
            const galleryWrapper = document.createElement('div');
            galleryWrapper.innerHTML = galleryHTML;
            if (galleryWrapper.firstElementChild) {
              postElement.appendChild(galleryWrapper.firstElementChild);
            }
          }
        }
        
        // Append content and link nodes safely
        postElement.appendChild(safeContent);
        
        if (linkedinLink !== '') {
          const linkContainer = document.createElement('div');
          linkContainer.className = 'post-footer-links';
          linkContainer.innerHTML = linkedinLink;
          postElement.appendChild(linkContainer);
        }

        // Add a horizontal rule between posts, except after the last one
        if (index < posts.length - 1) {
          const hr = document.createElement('div');
          hr.className = 'post-divider';
          postElement.appendChild(hr);
        }

        postsFeed.appendChild(postElement);
      });

      // Run animation script on newly loaded elements
      setupScrollAnimations();

    } catch (error) {
      console.error('Error fetching posts:', error);
      postsFeed.innerHTML = `
        <div class="posts-error" data-animate="fade-up">
          <p>Failed to load insights. Please try again later.</p>
        </div>
      `;
      setupScrollAnimations();
    }
  };

  // Initialize fetch
  fetchPosts();
});
