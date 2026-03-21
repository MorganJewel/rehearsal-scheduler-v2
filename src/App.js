// ============================================================
// REHEARSAL SCHEDULER - MAIN APPLICATION
// Entry point for Phase 1 development
// ============================================================

import './styles/main.css';
import { initializeAuth, getCurrentUser, logout } from './utils/auth.js';

// ============================================================
// APPLICATION STATE
// ============================================================

let currentUser = null;
let currentPage = 'login';

// ============================================================
// PAGE TEMPLATES
// ============================================================

// Login/Signup Page
const renderLoginPage = () => {
  return `
    <div class="auth-container">
      <div class="auth-card">
        <h1>🎭 Rehearsal Scheduler</h1>
        <p class="subtitle">Enterprise-grade theater production coordination</p>
        
        <form id="authForm">
          <div class="form-group">
            <label for="email">Email</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              placeholder="you@example.com"
              required
              aria-label="Email address"
            />
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              placeholder="••••••••"
              required
              aria-label="Password"
            />
          </div>
          
          <div class="form-group">
            <label for="fullName" id="fullNameLabel" style="display: none;">Full Name</label>
            <input 
              type="text" 
              id="fullName" 
              name="fullName" 
              placeholder="Your full name"
              aria-label="Full name"
              style="display: none;"
            />
          </div>
          
          <button type="submit" class="btn-primary" id="authBtn">Sign In</button>
        </form>
        
        <div class="auth-toggle">
          <p>
            <span id="toggleText">Don't have an account? </span>
            <button 
              type="button" 
              id="toggleBtn" 
              class="link-button"
              aria-label="Toggle between sign in and sign up"
            >
              Sign Up
            </button>
          </p>
        </div>
        
        <div id="errorMessage" class="error-message" role="alert" aria-live="polite"></div>
      </div>
    </div>
  `;
};

// Dashboard Page (After Login)
const renderDashboard = (user) => {
  return `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <div class="header-title">
          <h1>🎭 Rehearsal Scheduler</h1>
          <p class="welcome">Welcome, ${user.full_name || user.email}</p>
        </div>
        <button 
          id="logoutBtn" 
          class="btn-secondary"
          aria-label="Sign out"
        >
          Sign Out
        </button>
      </header>
      
      <main class="dashboard-main">
        <div class="dashboard-grid">
          <section class="dashboard-card">
            <h2>Productions</h2>
            <p>Manage your theater productions</p>
            <button class="btn-primary" id="createProductionBtn">
              ➕ Create New Production
            </button>
            <div id="productionsList" class="items-list">
              <p class="placeholder">No productions yet. Create one to get started!</p>
            </div>
          </section>
          
          <section class="dashboard-card">
            <h2>Recent Rehearsals</h2>
            <p>Your upcoming rehearsals</p>
            <div id="rehearsalsList" class="items-list">
              <p class="placeholder">No upcoming rehearsals</p>
            </div>
          </section>
          
          <section class="dashboard-card">
            <h2>Profile</h2>
            <p>Your account information</p>
            <div class="profile-info">
              <p><strong>Email:</strong> ${user.email}</p>
              <p><strong>Role:</strong> ${user.role}</p>
              <p><strong>Timezone:</strong> ${user.timezone}</p>
            </div>
            <button class="btn-secondary" id="editProfileBtn">
              ✏️ Edit Profile
            </button>
          </section>
        </div>
      </main>
      
      <footer class="dashboard-footer">
        <p>🔒 Your data is secure with Row-Level Security</p>
        <p>✅ Enterprise-grade encryption</p>
      </footer>
    </div>
  `;
};

// ============================================================
// RENDER FUNCTIONS
// ============================================================

const renderPage = () => {
  const app = document.getElementById('app');
  
  if (currentUser) {
    app.innerHTML = renderDashboard(currentUser);
    attachDashboardListeners();
  } else {
    app.innerHTML = renderLoginPage();
    attachAuthListeners();
  }
};

// ============================================================
// EVENT LISTENERS
// ============================================================

const attachAuthListeners = () => {
  const form = document.getElementById('authForm');
  const toggleBtn = document.getElementById('toggleBtn');
  const toggleText = document.getElementById('toggleText');
  const fullNameLabel = document.getElementById('fullNameLabel');
  const fullNameInput = document.getElementById('fullName');
  const authBtn = document.getElementById('authBtn');
  const errorMessage = document.getElementById('errorMessage');
  
  let isSignUp = false;
  
  // Toggle between sign in and sign up
  toggleBtn.addEventListener('click', () => {
    isSignUp = !isSignUp;
    toggleBtn.textContent = isSignUp ? 'Sign In' : 'Sign Up';
    toggleText.textContent = isSignUp ? 'Already have an account? ' : "Don't have an account? ";
    authBtn.textContent = isSignUp ? 'Create Account' : 'Sign In';
    
    if (isSignUp) {
      fullNameLabel.style.display = 'block';
      fullNameInput.style.display = 'block';
      fullNameInput.required = true;
    } else {
      fullNameLabel.style.display = 'none';
      fullNameInput.style.display = 'none';
      fullNameInput.required = false;
    }
  });
  
  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMessage.textContent = '';
    authBtn.disabled = true;
    authBtn.textContent = 'Loading...';
    
    try {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const fullName = document.getElementById('fullName').value;
      
      if (isSignUp) {
        // Sign up
        const { user, error } = await window.supabaseAuth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName
            }
          }
        });
        
        if (error) throw error;
        
        errorMessage.textContent = 'Account created! Check your email to verify, then sign in.';
        errorMessage.className = 'success-message';
        form.reset();
      } else {
        // Sign in
        const { data, error } = await window.supabaseAuth.signInWithPassword({
          email,
          password
        });
        
        if (error) throw error;
        if (!data.user) throw new Error('No user returned');
        
        // Get user profile
        currentUser = await getCurrentUser();
        if (currentUser) {
          renderPage();
          return;
        } else {
          throw new Error('Could not load user profile');
        }
      }
    } catch (error) {
      errorMessage.textContent = error.message || 'Authentication failed';
      console.error('Auth error:', error);
    } finally {
      authBtn.disabled = false;
      authBtn.textContent = isSignUp ? 'Create Account' : 'Sign In';
    }
  });
};

const attachDashboardListeners = () => {
  const logoutBtn = document.getElementById('logoutBtn');
  const createProductionBtn = document.getElementById('createProductionBtn');
  const editProfileBtn = document.getElementById('editProfileBtn');
  
  logoutBtn.addEventListener('click', async () => {
    try {
      await logout();
      currentUser = null;
      renderPage();
    } catch (error) {
      console.error('Logout error:', error);
    }
  });
  
  createProductionBtn.addEventListener('click', () => {
    alert('Production creation coming soon in Phase 1!');
  });
  
  editProfileBtn.addEventListener('click', () => {
    alert('Profile editing coming soon in Phase 1!');
  });
};

// ============================================================
// INITIALIZATION
// ============================================================

const init = async () => {
  try {
    // Initialize Supabase
    await initializeAuth();
    
    // Check if user is logged in
    currentUser = await getCurrentUser();
    
    // Render initial page
    renderPage();
  } catch (error) {
    console.error('Initialization error:', error);
    document.getElementById('app').innerHTML = `
      <div class="error-container">
        <p>❌ Failed to initialize application</p>
        <p>${error.message}</p>
      </div>
    `;
  }
};

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', init);