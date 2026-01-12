// ============================================
// DRIVERS SERVICE
// ============================================

import { getSupabaseClient } from '../config.js';

class DriversService {
  constructor() {
    this.supabase = getSupabaseClient();
  }

  /**
   * Get all drivers
   * @returns {Promise<Array>} - Array of drivers
   */
  async getAll() {
    try {
      const { data, error } = await this.supabase
        .from('drivers')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get drivers error:', error);
      throw error;
    }
  }

  /**
   * Get driver by ID
   * @param {string} id - Driver ID
   * @returns {Promise<Object>} - Driver object
   */
  async getById(id) {
    try {
      const { data, error } = await this.supabase
        .from('drivers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get driver error:', error);
      throw error;
    }
  }

  /**
   * Get driver by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Driver object
   */
  async getByUserId(userId) {
    try {
      const { data, error } = await this.supabase
        .from('drivers')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get driver by user ID error:', error);
      throw error;
    }
  }

  /**
   * Create new driver (admin only)
   * Note: This creates the driver record. User account must be created separately via Supabase Auth.
   * @param {Object} driverData - Driver data
   * @returns {Promise<Object>} - Created driver
   */
  async create(driverData) {
    try {
      // First, create the auth user
      const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
        email: driverData.email,
        password: driverData.password,
        email_confirm: true,
      });

      if (authError) throw authError;

      // Then create the driver record
      const { data, error } = await this.supabase
        .from('drivers')
        .insert([{
          user_id: authData.user.id,
          name: driverData.name,
          email: driverData.email,
          phone: driverData.phone,
          route_id: driverData.route_id,
          role: driverData.role || 'driver',
        }])
        .select()
        .single();

      if (error) {
        // Cleanup: delete auth user if driver creation fails
        await this.supabase.auth.admin.deleteUser(authData.user.id);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Create driver error:', error);
      throw error;
    }
  }

  /**
   * Register new driver profile (public)
   * @param {Object} driverData - Driver data
   * @returns {Promise<Object>} - Created driver
   */
  async register(driverData) {
    try {
      const { data, error } = await this.supabase
        .from('drivers')
        .insert([{
          user_id: driverData.user_id,
          name: driverData.name,
          email: driverData.email,
          phone: driverData.phone,
          role: 'driver',
          route_id: driverData.route_id || null
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Register driver error:', error);
      throw error;
    }
  }

  /**
   * Update driver
   * @param {string} id - Driver ID
   * @param {Object} driverData - Driver data
   * @returns {Promise<Object>} - Updated driver
   */
  async update(id, driverData) {
    try {
      const updateData = {
        name: driverData.name,
        phone: driverData.phone,
        route_id: driverData.route_id,
      };

      // Only update role if provided (admin only)
      if (driverData.role) {
        updateData.role = driverData.role;
      }

      const { data, error } = await this.supabase
        .from('drivers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update email in auth if changed
      if (driverData.email && data.user_id) {
        await this.supabase.auth.admin.updateUserById(data.user_id, {
          email: driverData.email,
        });
      }

      return data;
    } catch (error) {
      console.error('Update driver error:', error);
      throw error;
    }
  }

  /**
   * Delete driver (admin only)
   * @param {string} id - Driver ID
   * @returns {Promise<void>}
   */
  async delete(id) {
    try {
      // Get driver to find user_id
      const driver = await this.getById(id);

      // Delete driver record
      const { error } = await this.supabase
        .from('drivers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Delete auth user
      if (driver.user_id) {
        await this.supabase.auth.admin.deleteUser(driver.user_id);
      }
    } catch (error) {
      console.error('Delete driver error:', error);
      throw error;
    }
  }

  /**
   * Get drivers by route
   * @param {string} routeId - Route ID
   * @returns {Promise<Array>} - Array of drivers
   */
  async getByRoute(routeId) {
    try {
      const { data, error } = await this.supabase
        .from('drivers')
        .select('*')
        .eq('route_id', routeId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get drivers by route error:', error);
      throw error;
    }
  }

  /**
   * Check if email exists
   * @param {string} email - Email to check
   * @param {string} excludeId - Driver ID to exclude
   * @returns {Promise<boolean>} - True if exists
   */
  async emailExists(email, excludeId = null) {
    try {
      let query = this.supabase
        .from('drivers')
        .select('id')
        .eq('email', email);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data && data.length > 0;
    } catch (error) {
      console.error('Check email exists error:', error);
      throw error;
    }
  }
}

// Create singleton instance
const driversService = new DriversService();

export default driversService;
