// js/admin.js - Authentication & CRUD logic for admin.html

document.addEventListener('DOMContentLoaded', () => {
  // Handle database connection library failure
  const isClientReady = window.supabase && typeof window.supabase.createClient !== 'function';
  if (!isClientReady) {
    document.body.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: 'DM Sans', sans-serif; background: #FAF7F2; padding: 20px; text-align: center;">
        <div style="background: white; border: 1px solid #E8E0D0; padding: 40px; max-width: 500px; border-radius: 2px; box-shadow: 0 10px 30px rgba(26,26,46,0.04); border-top: 4px solid #B22222;">
          <h1 style="color: #1A1A2E; font-size: 24px; margin-bottom: 20px; font-family: 'Cormorant Garamond', serif; font-weight: 600;">Connection Error</h1>
          <p style="color: #4A4A6A; line-height: 1.6; margin-bottom: 20px; font-weight: 300;">The Supabase database connection could not be established because the database library failed to load or initialize.</p>
          <p style="color: #4A4A6A; font-size: 14px; font-weight: 300;">Please make sure your Supabase keys are correct and <code>js/supabase.js</code> is present in your project directory.</p>
        </div>
      </div>
    `;
    return;
  }

  // DOM References
  const loginSection = document.getElementById('login-section');
  const dashboardSection = document.getElementById('dashboard-section');
  const loginForm = document.getElementById('login-form');
  const loginEmail = document.getElementById('login-email');
  const loginPassword = document.getElementById('login-password');
  const loginError = document.getElementById('login-error');
  const logoutBtn = document.getElementById('logout-btn');

  // Form References
  const postForm = document.getElementById('post-form');
  const formTitle = document.getElementById('form-title');
  const postIdInput = document.getElementById('post-id');
  const postTitleInput = document.getElementById('post-title');
  const postCategoryInput = document.getElementById('post-category');
  const postContentInput = document.getElementById('post-content');
  const postLinkedinInput = document.getElementById('post-linkedin');
  const postPublishedInput = document.getElementById('post-published');
  const publishedStatusText = document.getElementById('published-status-text');
  const submitPostBtn = document.getElementById('submit-post-btn');
  const cancelEditBtn = document.getElementById('cancel-edit-btn');

  // List References
  const postsList = document.getElementById('admin-posts-list');
  const postCountBadge = document.getElementById('post-count-badge');

  // Local cache for current posts
  let cachedPosts = [];

  // ==========================================
  // TOAST NOTIFICATIONS
  // ==========================================
  const showToast = (message, type = 'success') => {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerText = message;
    container.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      toast.classList.add('visible');
    }, 10);

    // Fade out and remove
    setTimeout(() => {
      toast.classList.remove('visible');
      toast.classList.add('fade-out');
      setTimeout(() => {
        toast.remove();
      }, 500);
    }, 3500);
  };

  // ==========================================
  // AUTHENTICATION LOGIC
  // ==========================================

  // Check Session
  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      if (session) {
        showDashboard();
      } else {
        showLogin();
      }
    } catch (err) {
      console.error('Session check error:', err);
      showLogin();
    }
  };

  const showLogin = () => {
    dashboardSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
    // Clear forms
    loginForm.reset();
    loginError.classList.add('hidden');
  };

  const showDashboard = () => {
    loginSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    loadPosts();
  };

  // Login handler
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    loginError.classList.add('hidden');
    loginError.innerText = '';

    if (!email || !password) {
      loginError.innerText = 'Please enter both email and password.';
      loginError.classList.remove('hidden');
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      showToast('Login successful!', 'success');
      showDashboard();
    } catch (err) {
      console.error('Login error:', err);
      loginError.innerText = err.message || 'Invalid email or password.';
      loginError.classList.remove('hidden');
    }
  });

  // Logout handler
  logoutBtn.addEventListener('click', async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      showToast('Logged out successfully.', 'info');
      showLogin();
    } catch (err) {
      console.error('Logout error:', err);
      showToast('Error during logout: ' + err.message, 'error');
    }
  });

  // Listener for auth state changes
  supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      showDashboard();
    } else {
      showLogin();
    }
  });

  // ==========================================
  // FORM INTERACTION LOGIC
  // ==========================================

  // Toggle status text on switch change
  postPublishedInput.addEventListener('change', () => {
    const isPublished = postPublishedInput.checked;
    publishedStatusText.innerText = isPublished ? 'Publish Immediately' : 'Save as Draft';
    
    // Update button text accordingly if not in edit mode
    if (!postIdInput.value) {
      submitPostBtn.innerText = isPublished ? 'Publish Post' : 'Save Draft';
    }
  });

  // Reset form to default create state
  const resetForm = () => {
    postForm.reset();
    postIdInput.value = '';
    formTitle.innerText = 'Create New Post';
    postPublishedInput.checked = true;
    publishedStatusText.innerText = 'Publish Immediately';
    submitPostBtn.innerText = 'Publish Post';
    cancelEditBtn.classList.add('hidden');
  };

  cancelEditBtn.addEventListener('click', (e) => {
    e.preventDefault();
    resetForm();
    showToast('Edit cancelled.', 'info');
  });

  // ==========================================
  // CRUD OPERATIONS
  // ==========================================

  // Load Posts list from Supabase
  const loadPosts = async () => {
    postsList.innerHTML = '<div class="admin-loading">Loading posts...</div>';
    
    try {
      const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      cachedPosts = posts || [];
      renderPostsList(cachedPosts);
    } catch (err) {
      console.error('Error fetching posts:', err);
      showToast('Failed to load posts: ' + err.message, 'error');
      postsList.innerHTML = '<div class="admin-error">Failed to fetch posts from database.</div>';
    }
  };

  // Render post rows in list
  const renderPostsList = (posts) => {
    postCountBadge.innerText = posts.length;
    
    if (posts.length === 0) {
      postsList.innerHTML = '<div class="admin-empty">No posts created yet.</div>';
      return;
    }

    postsList.innerHTML = '';
    
    posts.forEach(post => {
      const row = document.createElement('div');
      row.className = 'admin-post-row';
      row.id = `post-row-${post.id}`;

      const truncateTitle = post.title.length > 55 ? post.title.substring(0, 55) + '...' : post.title;
      const statusText = post.published ? 'Published' : 'Draft';
      const statusClass = post.published ? 'status-published' : 'status-draft';
      
      const createdDate = new Date(post.created_at);
      const formattedDate = createdDate.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

      row.innerHTML = `
        <div class="row-info">
          <div class="row-title-line">
            <span class="row-title">${escapeHTML(truncateTitle)}</span>
            <span class="status-pill-admin ${statusClass}">${statusText}</span>
          </div>
          <div class="row-meta-line">
            <span class="row-category">${escapeHTML(post.category)}</span>
            <span class="row-date">${formattedDate}</span>
          </div>
        </div>
        <div class="row-actions" id="actions-${post.id}">
          <button class="btn-action btn-edit" data-id="${post.id}">✏️ Edit</button>
          <button class="btn-action btn-delete" data-id="${post.id}">🗑️ Delete</button>
        </div>
        <div class="row-confirm-delete hidden" id="confirm-${post.id}">
          <span class="confirm-text">Are you sure?</span>
          <button class="btn-confirm btn-yes" data-id="${post.id}">Confirm</button>
          <button class="btn-confirm btn-no" data-id="${post.id}">Cancel</button>
        </div>
      `;

      postsList.appendChild(row);
    });

    setupListEventListeners();
  };

  // Helper to escape HTML and prevent XSS
  const escapeHTML = (str) => {
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  };

  // Set up event listeners for dynamically rendered buttons
  const setupListEventListeners = () => {
    // Edit Button Click
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        const post = cachedPosts.find(p => p.id === id);
        if (post) {
          enterEditMode(post);
        }
      });
    });

    // Delete Button Click - Show confirmation UI
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        document.getElementById(`actions-${id}`).classList.add('hidden');
        document.getElementById(`confirm-${id}`).classList.remove('hidden');
      });
    });

    // Cancel Delete Button Click
    document.querySelectorAll('.btn-no').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        document.getElementById(`confirm-${id}`).classList.add('hidden');
        document.getElementById(`actions-${id}`).classList.remove('hidden');
      });
    });

    // Confirm Delete Button Click
    document.querySelectorAll('.btn-yes').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        await deletePost(id);
      });
    });
  };

  // Shift form to Edit mode
  const enterEditMode = (post) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    postIdInput.value = post.id;
    postTitleInput.value = post.title;
    postCategoryInput.value = post.category || 'Leadership';
    postContentInput.value = post.content;
    postLinkedinInput.value = post.linkedin_url || '';
    postPublishedInput.checked = post.published;
    
    publishedStatusText.innerText = post.published ? 'Publish Immediately' : 'Save as Draft';
    formTitle.innerText = 'Edit Post';
    submitPostBtn.innerText = 'Update Post';
    cancelEditBtn.classList.remove('hidden');
    
    showToast('Editing post details...', 'info');
  };

  // Delete Post API Call
  const deletePost = async (id) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showToast('Post deleted successfully!', 'success');
      
      // If we are currently editing the deleted post, reset the form
      if (postIdInput.value === id) {
        resetForm();
      }
      
      // Reload posts
      loadPosts();
    } catch (err) {
      console.error('Error deleting post:', err);
      showToast('Failed to delete post: ' + err.message, 'error');
    }
  };

  // Create or Update Post Form Submit
  postForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = postIdInput.value;
    const title = postTitleInput.value.trim();
    const category = postCategoryInput.value;
    const content = postContentInput.value.trim();
    const linkedin_url = postLinkedinInput.value.trim();
    const published = postPublishedInput.checked;

    if (!title || !content) {
      showToast('Please enter both title and content.', 'error');
      return;
    }

    const postData = {
      title,
      category,
      content,
      linkedin_url: linkedin_url === '' ? null : linkedin_url,
      published
    };

    try {
      if (id) {
        // Edit Mode -> Update
        const { error } = await supabase
          .from('posts')
          .update(postData)
          .eq('id', id);

        if (error) throw error;
        showToast('Post updated successfully!', 'success');
      } else {
        // Create Mode -> Insert
        const { error } = await supabase
          .from('posts')
          .insert([postData]);

        if (error) throw error;
        showToast(published ? 'Post published successfully!' : 'Draft saved successfully!', 'success');
      }

      resetForm();
      loadPosts();
    } catch (err) {
      console.error('Error saving post:', err);
      showToast('Failed to save post: ' + err.message, 'error');
    }
  });

  // Initialize
  checkSession();
});
