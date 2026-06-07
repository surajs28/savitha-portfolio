// js/admin.js - Authentication & CRUD logic for admin.html

document.addEventListener('DOMContentLoaded', () => {
  const supabase = window.supabase;

  // Handle database connection library failure
  const isClientReady = !!supabase;
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

  // Image / Photo References
  const postImageUrlInput = document.getElementById('post-image-url');
  const postImageFileInput = document.getElementById('post-image-file');
  const addImageUrlBtn = document.getElementById('add-image-url-btn');
  const galleryPreviewContainer = document.getElementById('gallery-preview-container');
  const galleryPreviewGrid = document.getElementById('gallery-preview-grid');
  const imageUploadStatus = document.getElementById('image-upload-status');

  let uploadedImages = [];

  // List References
  const postsList = document.getElementById('admin-posts-list');
  const postCountBadge = document.getElementById('post-count-badge');
  const messagesList = document.getElementById('admin-messages-list');
  const messageCountBadge = document.getElementById('message-count-badge');
  const tabPosts = document.getElementById('tab-posts');
  const tabMessages = document.getElementById('tab-messages');
  const formColumn = document.querySelector('.form-column');

  // Local cache for current data
  let cachedPosts = [];
  let cachedMessages = [];

  // Tabs logic
  const switchTab = (tabName) => {
    if (tabName === 'posts') {
      tabPosts.style.color = 'var(--color-primary)';
      tabPosts.querySelector('.tab-indicator').classList.remove('hidden');
      tabMessages.style.color = 'var(--color-secondary)';
      tabMessages.querySelector('.tab-indicator').classList.add('hidden');
      postsList.classList.remove('hidden');
      messagesList.classList.add('hidden');
      formColumn.classList.remove('hidden'); // Show post creation form
      loadPosts();
    } else {
      tabMessages.style.color = 'var(--color-primary)';
      tabMessages.querySelector('.tab-indicator').classList.remove('hidden');
      tabPosts.style.color = 'var(--color-secondary)';
      tabPosts.querySelector('.tab-indicator').classList.add('hidden');
      messagesList.classList.remove('hidden');
      postsList.classList.add('hidden');
      formColumn.classList.add('hidden'); // Hide post creation form when viewing messages
      loadMessages();
    }
  };

  tabPosts.addEventListener('click', () => switchTab('posts'));
  tabMessages.addEventListener('click', () => switchTab('messages'));

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
    // Load messages in the background to update the message count badge
    loadMessages();
  };

  // Login handler
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    loginError.classList.add('hidden');
    loginError.innerText = '';

    if (!email) {
      loginError.innerText = 'Please enter your email.';
      loginError.classList.remove('hidden');
      return;
    }

    if (!password) {
      loginError.innerText = 'Please enter your password';
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

  // Gallery preview update helper
  const updateGalleryPreview = () => {
    if (!galleryPreviewGrid || !galleryPreviewContainer) return;
    
    galleryPreviewGrid.innerHTML = '';
    
    if (uploadedImages.length > 0) {
      uploadedImages.forEach((url, index) => {
        const thumbWrapper = document.createElement('div');
        thumbWrapper.className = 'gallery-thumb-wrapper';
        thumbWrapper.style.position = 'relative';
        thumbWrapper.style.aspectRatio = '1';
        thumbWrapper.style.borderRadius = '4px';
        thumbWrapper.style.overflow = 'hidden';
        thumbWrapper.style.border = '1px solid var(--color-divider)';
        thumbWrapper.style.backgroundColor = '#f4f4f4';

        thumbWrapper.innerHTML = `
          <img src="${url}" style="width: 100%; height: 100%; object-fit: cover;" />
          <button type="button" class="btn-remove-thumb" data-index="${index}" style="position: absolute; top: 4px; right: 4px; background: rgba(0, 0, 0, 0.6); color: #fff; border: none; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 11px; cursor: pointer; padding: 0; transition: background 0.2s;" onmouseover="this.style.background='rgba(178, 34, 34, 0.95)'" onmouseout="this.style.background='rgba(0, 0, 0, 0.6)'">✕</button>
        `;
        
        galleryPreviewGrid.appendChild(thumbWrapper);
      });
      
      galleryPreviewContainer.style.display = 'flex';
    } else {
      galleryPreviewContainer.style.display = 'none';
    }
  };

  // Remove photo from gallery
  if (galleryPreviewGrid) {
    galleryPreviewGrid.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.btn-remove-thumb');
      if (removeBtn) {
        const index = parseInt(removeBtn.getAttribute('data-index'), 10);
        uploadedImages.splice(index, 1);
        updateGalleryPreview();
        showToast('Photo removed from gallery.', 'info');
      }
    });
  }

  // Add URL manually
  if (addImageUrlBtn && postImageUrlInput) {
    addImageUrlBtn.addEventListener('click', () => {
      const url = postImageUrlInput.value.trim();
      if (!url) {
        showToast('Please enter an image URL first.', 'error');
        return;
      }
      uploadedImages.push(url);
      postImageUrlInput.value = '';
      updateGalleryPreview();
      showToast('Image URL added to gallery!', 'success');
    });

    postImageUrlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addImageUrlBtn.click();
      }
    });
  }

  // File upload to Supabase Storage (multiple files)
  if (postImageFileInput) {
    postImageFileInput.addEventListener('change', async (e) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      imageUploadStatus.style.display = 'block';
      imageUploadStatus.textContent = `Uploading ${files.length} photo(s) to storage...`;
      imageUploadStatus.style.color = 'var(--color-accent)';

      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        imageUploadStatus.textContent = `Uploading photo ${i + 1} of ${files.length}...`;
        
        try {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
          const filePath = `post-images/${fileName}`;

          // Upload file to the 'post-images' bucket
          const { data, error } = await supabase.storage
            .from('post-images')
            .upload(filePath, file);

          let publicUrl = '';
          if (error) {
            // Try photos bucket fallback
            const { data: fbData, error: fbError } = await supabase.storage
              .from('photos')
              .upload(filePath, file);

            if (fbError) throw fbError;

            const { data: { publicUrl: fbUrl } } = supabase.storage
              .from('photos')
              .getPublicUrl(filePath);
            publicUrl = fbUrl;
          } else {
            const { data: { publicUrl: piUrl } } = supabase.storage
              .from('post-images')
              .getPublicUrl(filePath);
            publicUrl = piUrl;
          }

          if (publicUrl) {
            uploadedImages.push(publicUrl);
            successCount++;
          }
        } catch (err) {
          console.error(`File upload error for ${file.name}:`, err);
          failCount++;
        }
      }

      updateGalleryPreview();
      postImageFileInput.value = '';

      if (failCount === 0) {
        showToast(`Uploaded ${successCount} photo(s) successfully!`, 'success');
        imageUploadStatus.style.display = 'none';
      } else {
        showToast(`Uploaded ${successCount} successfully, ${failCount} failed.`, 'warning');
        imageUploadStatus.textContent = `Some uploads failed. Make sure a public bucket named "post-images" exists in Supabase Storage, or paste an external URL.`;
        imageUploadStatus.style.color = '#e74c3c';
      }
    });
  }

  // Reset form to default create state
  const resetForm = () => {
    postForm.reset();
    postIdInput.value = '';
    formTitle.innerText = 'Create New Post';
    postPublishedInput.checked = true;
    publishedStatusText.innerText = 'Publish Immediately';
    submitPostBtn.innerText = 'Publish Post';
    cancelEditBtn.classList.add('hidden');
    
    // Clear image elements
    uploadedImages = [];
    updateGalleryPreview();
    if (postImageUrlInput) postImageUrlInput.value = '';
    if (imageUploadStatus) imageUploadStatus.style.display = 'none';
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
    if (postImageUrlInput) postImageUrlInput.value = '';
    postLinkedinInput.value = post.linkedin_url || '';
    postPublishedInput.checked = post.published;
    
    uploadedImages = parseImages(post.image_url);
    updateGalleryPreview();
    if (imageUploadStatus) imageUploadStatus.style.display = 'none';
    
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
      image_url: uploadedImages.length > 0 ? JSON.stringify(uploadedImages) : null,
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

  // ==========================================
  // MESSAGES LOGIC
  // ==========================================
  const loadMessages = async () => {
    messagesList.innerHTML = '<div class="admin-loading">Loading messages...</div>';
    
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      cachedMessages = messages || [];
      renderMessagesList(cachedMessages);
      
      const unreadCount = cachedMessages.filter(m => !m.read).length;
      messageCountBadge.innerText = unreadCount > 0 ? unreadCount : '';
      messageCountBadge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
      
    } catch (err) {
      console.error('Error fetching messages:', err);
      showToast('Failed to load messages: ' + err.message, 'error');
      messagesList.innerHTML = '<div class="admin-error">Failed to fetch messages from database.</div>';
    }
  };

  const renderMessagesList = (messages) => {
    if (messages.length === 0) {
      messagesList.innerHTML = '<div class="admin-empty">No messages received yet.</div>';
      return;
    }

    messagesList.innerHTML = '';
    
    messages.forEach(msg => {
      const row = document.createElement('div');
      row.className = 'admin-post-row';
      // Gold left border for unread messages
      if (!msg.read) {
        row.style.borderLeft = '4px solid var(--color-accent)';
      }
      
      const createdDate = new Date(msg.created_at);
      const formattedDate = createdDate.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      row.innerHTML = `
        <div class="row-info" style="flex: 1;">
          <div class="row-title-line" style="margin-bottom: 0.25rem;">
            <span class="row-title" style="font-size: 1.1rem;">${escapeHTML(msg.name)}</span>
            <span class="row-date" style="font-size: 0.8rem; margin-left: auto;">${formattedDate}</span>
          </div>
          <div class="row-meta-line" style="margin-bottom: 0.75rem;">
            <a href="mailto:${escapeHTML(msg.email)}" class="row-category" style="color: var(--color-accent); text-decoration: underline;">${escapeHTML(msg.email)}</a>
          </div>
          <div style="font-size: 0.95rem; color: var(--color-secondary); line-height: 1.5; white-space: pre-wrap; background: var(--color-bg); padding: 1rem; border-radius: 4px;">${escapeHTML(msg.message)}</div>
        </div>
        <div class="row-actions" style="flex-direction: column; justify-content: flex-start; margin-left: 1rem; min-width: 100px;">
          <div id="msg-actions-${msg.id}" style="display: flex; flex-direction: column; gap: 0.5rem;">
            ${!msg.read ? `<button class="btn-action btn-mark-read" data-id="${msg.id}" style="color: var(--color-accent);">✓ Mark Read</button>` : '<span style="font-size: 0.8rem; color: var(--color-secondary); padding-left: 10px;">Read</span>'}
            <button class="btn-action btn-delete-msg" data-id="${msg.id}" style="color: #e74c3c;">🗑️ Delete</button>
          </div>
          <div class="row-confirm-delete hidden" id="msg-confirm-${msg.id}" style="display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.8rem; margin-top: 0;">
            <span class="confirm-text" style="color: #e74c3c;">Sure?</span>
            <button class="btn-confirm btn-yes-msg" data-id="${msg.id}">Yes</button>
            <button class="btn-confirm btn-no-msg" data-id="${msg.id}">No</button>
          </div>
        </div>
      `;

      messagesList.appendChild(row);
    });

    // Mark as read button handler
    document.querySelectorAll('.btn-mark-read').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        await markMessageRead(id);
      });
    });

    // Delete Button Click - Show confirmation UI
    document.querySelectorAll('.btn-delete-msg').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        document.getElementById(`msg-actions-${id}`).classList.add('hidden');
        document.getElementById(`msg-actions-${id}`).style.display = 'none';
        document.getElementById(`msg-confirm-${id}`).classList.remove('hidden');
      });
    });

    // Cancel Delete Button Click
    document.querySelectorAll('.btn-no-msg').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        document.getElementById(`msg-confirm-${id}`).classList.add('hidden');
        document.getElementById(`msg-actions-${id}`).classList.remove('hidden');
        document.getElementById(`msg-actions-${id}`).style.display = 'flex';
      });
    });

    // Confirm Delete Button Click
    document.querySelectorAll('.btn-yes-msg').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        await deleteMessage(id);
      });
    });
  };

  const deleteMessage = async (id) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      showToast('Message deleted successfully', 'success');
      loadMessages();
    } catch (err) {
      console.error('Error deleting message:', err);
      showToast('Failed to delete message', 'error');
    }
  };

  const markMessageRead = async (id) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;
      
      showToast('Message marked as read', 'success');
      loadMessages();
    } catch (err) {
      console.error('Error marking message as read:', err);
      showToast('Failed to mark as read', 'error');
    }
  };

  // Initialize
  checkSession();
});
