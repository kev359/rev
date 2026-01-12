// ============================================
// AUTHENTICATION SERVICE
// ============================================

import { getSupabaseClient } from '../config.js';
import { redirect } from '../utils/helpers.js';

class AuthService {
  constructor() {
    this.supabase = getSupabaseClient();
    this.currentUser = null;
    this.currentDriver = null;
  }

  /**
   * Sign in with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} - { success, user, error }
   */
  async signIn(email, password) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Get driver profile
      const driver = await this.getDriverProfile(data.user.id);
      
      if (!driver) {
        await this.signOut();
        return { success: false, error: 'Driver profile not found. Please contact admin.' };
      }

      this.currentUser = data.user;
      this.currentDriver = driver;

      return { success: true, user: data.user, driver };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sign up new user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} - { success, data, error }
   */
  async signUp(email, password) {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sign out current user
   * @returns {Promise<Object>} - { success, error }
   */
  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut();
      
      if (error) {
        return { success: false, error: error.message };
      }

      this.currentUser = null;
      this.currentDriver = null;

      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send password reset email
   * @param {string} email - User email
   * @returns {Promise<Object>} - { success, error }
   */
  async resetPassword(email) {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password.html`,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} - { success, error }
   */
  async updatePassword(newPassword) {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Update password error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current session
   * @returns {Promise<Object>} - { session, user, driver }
   */
  async getSession() {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();

      if (error || !session) {
        return { session: null, user: null, driver: null };
      }

      this.currentUser = session.user;

      // Get driver profile
      const driver = await this.getDriverProfile(session.user.id);
      this.currentDriver = driver;

      return { session, user: session.user, driver };
    } catch (error) {
      console.error('Get session error:', error);
      return { session: null, user: null, driver: null };
    }
  }

  /**
   * Get driver profile from database
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} - Driver profile or null
   */
  async getDriverProfile(userId) {
    try {
      const { data, error } = await this.supabase
        .from('drivers')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Get driver profile error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Get driver profile error:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   * @returns {Promise<boolean>} - True if authenticated
   */
  async isAuthenticated() {
    const { session } = await this.getSession();
    return !!session;
  }

  /**
   * Check if user is admin
   * @returns {Promise<boolean>} - True if admin
   */
  async isAdmin() {
    const { driver } = await this.getSession();
    return driver && driver.role === 'admin';
  }

  /**
   * Require authentication (redirect to login if not authenticated)
   * @param {string} redirectUrl - URL to redirect to after login
   */
  async requireAuth(redirectUrl = null) {
    const authenticated = await this.isAuthenticated();
    
    if (!authenticated) {
      const returnUrl = redirectUrl || window.location.pathname;
      redirect(`index.html?return=${encodeURIComponent(returnUrl)}`);
      return false;
    }

    return true;
  }

  /**
   * Require admin role (redirect to dashboard if not admin)
   */
  async requireAdmin() {
    const authenticated = await this.requireAuth();
    if (!authenticated) return false;

    const admin = await this.isAdmin();
    
    if (!admin) {
      redirect('dashboard.html');
      return false;
    }

    return true;
  }

  /**
   * Get current user
   * @returns {Object|null} - Current user or null
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Get current driver
   * @returns {Object|null} - Current driver or null
   */
  getCurrentDriver() {
    return this.currentDriver;
  }

  /**
   * Listen for auth state changes
   * @param {Function} callback - Callback function
   */
  onAuthStateChange(callback) {
    this.supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        this.currentUser = session.user;
        this.currentDriver = await this.getDriverProfile(session.user.id);
      } else {
        this.currentUser = null;
        this.currentDriver = null;
      }

      callback(event, session, this.currentDriver);
    });
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;
