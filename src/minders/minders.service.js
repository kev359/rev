// ============================================
// MINDERS SERVICE
// ============================================

import { getSupabaseClient } from '../config.js';

class MindersService {
  constructor() {
    this.supabase = getSupabaseClient();
  }

  /**
   * Get all minders
   * @returns {Promise<Array>} - Array of minders
   */
  async getAll() {
    try {
      const { data, error } = await this.supabase
        .from('minders')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get minders error:', error);
      throw error;
    }
  }

  /**
   * Get minder by ID
   * @param {string} id - Minder ID
   * @returns {Promise<Object>} - Minder object
   */
  async getById(id) {
    try {
      const { data, error } = await this.supabase
        .from('minders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get minder error:', error);
      throw error;
    }
  }

  /**
   * Get minder by driver ID
   * @param {string} driverId - Driver ID
   * @returns {Promise<Object|null>} - Minder object or null
   */
  async getByDriverId(driverId) {
    try {
      const { data, error } = await this.supabase
        .from('minders')
        .select('*')
        .eq('driver_id', driverId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get minder by driver error:', error);
      throw error;
    }
  }

  /**
   * Get minder by route ID
   * @param {string} routeId - Route ID
   * @returns {Promise<Object|null>} - Minder object or null
   */
  async getByRouteId(routeId) {
    try {
      const { data, error } = await this.supabase
        .from('minders')
        .select('*')
        .eq('route_id', routeId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get minder by route error:', error);
      throw error;
    }
  }

  /**
   * Create new minder
   * @param {Object} minderData - Minder data
   * @returns {Promise<Object>} - Created minder
   */
  async create(minderData) {
    try {
      const { data, error } = await this.supabase
        .from('minders')
        .insert([{
          name: minderData.name,
          phone: minderData.phone,
          driver_id: minderData.driver_id,
          route_id: minderData.route_id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create minder error:', error);
      throw error;
    }
  }

  /**
   * Update minder
   * @param {string} id - Minder ID
   * @param {Object} minderData - Minder data
   * @returns {Promise<Object>} - Updated minder
   */
  async update(id, minderData) {
    try {
      const { data, error } = await this.supabase
        .from('minders')
        .update({
          name: minderData.name,
          phone: minderData.phone,
          driver_id: minderData.driver_id,
          route_id: minderData.route_id,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update minder error:', error);
      throw error;
    }
  }

  /**
   * Delete minder
   * @param {string} id - Minder ID
   * @returns {Promise<void>}
   */
  async delete(id) {
    try {
      const { error } = await this.supabase
        .from('minders')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Delete minder error:', error);
      throw error;
    }
  }

  /**
   * Get minders with driver and route details
   * @returns {Promise<Array>} - Array of minders with details
   */
  async getAllWithDetails() {
    try {
      const minders = await this.getAll();
      
      // Get drivers and routes
      const { data: drivers } = await this.supabase
        .from('drivers')
        .select('id, name, route_id');

      const { data: routes } = await this.supabase
        .from('routes')
        .select('id, name');

      // Map details
      const mindersWithDetails = minders.map(minder => {
        const driver = drivers?.find(d => d.id === minder.driver_id);
        const route = routes?.find(r => r.id === minder.route_id);

        return {
          ...minder,
          driver_name: driver?.name || 'N/A',
          route_name: route?.name || 'N/A',
        };
      });

      return mindersWithDetails;
    } catch (error) {
      console.error('Get minders with details error:', error);
      throw error;
    }
  }
}

// Create singleton instance
const mindersService = new MindersService();

export default mindersService;
