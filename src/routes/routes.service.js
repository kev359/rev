// ============================================
// ROUTES SERVICE
// ============================================

import { getSupabaseClient } from '../config.js';

class RoutesService {
  constructor() {
    this.supabase = getSupabaseClient();
  }

  /**
   * Get all routes
   * @param {string} status - Filter by status (active, archived, or null for all)
   * @returns {Promise<Array>} - Array of routes
   */
  async getAll(status = 'active') {
    try {
      let query = this.supabase
        .from('routes')
        .select('*')
        .order('name', { ascending: true });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get routes error:', error);
      throw error;
    }
  }

  /**
   * Get route by ID
   * @param {string} id - Route ID
   * @returns {Promise<Object>} - Route object
   */
  async getById(id) {
    try {
      const { data, error } = await this.supabase
        .from('routes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get route error:', error);
      throw error;
    }
  }

  /**
   * Create new route
   * @param {Object} routeData - Route data
   * @returns {Promise<Object>} - Created route
   */
  async create(routeData) {
    try {
      const { data, error } = await this.supabase
        .from('routes')
        .insert([{
          name: routeData.name,
          vehicle_no: routeData.vehicle_no,
          areas: routeData.areas || [],
          term: routeData.term,
          year: routeData.year,
          status: 'active',
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create route error:', error);
      throw error;
    }
  }

  /**
   * Update route
   * @param {string} id - Route ID
   * @param {Object} routeData - Route data
   * @returns {Promise<Object>} - Updated route
   */
  async update(id, routeData) {
    try {
      const { data, error} = await this.supabase
        .from('routes')
        .update({
          name: routeData.name,
          vehicle_no: routeData.vehicle_no,
          areas: routeData.areas,
          term: routeData.term,
          year: routeData.year,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update route error:', error);
      throw error;
    }
  }

  /**
   * Archive route
   * @param {string} id - Route ID
   * @returns {Promise<Object>} - Archived route
   */
  async archive(id) {
    try {
      const { data, error } = await this.supabase
        .from('routes')
        .update({ status: 'archived' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Archive route error:', error);
      throw error;
    }
  }

  /**
   * Duplicate route for new term/year
   * @param {string} routeId - Route ID to duplicate
   * @param {string} newTerm - New term
   * @param {number} newYear - New year
   * @param {boolean} copyLearners - Whether to copy learners
   * @returns {Promise<Object>} - New route
   */
  async duplicate(routeId, newTerm, newYear, copyLearners = false) {
    try {
      // Call Supabase function
      const { data, error } = await this.supabase
        .rpc('duplicate_route', {
          p_route_id: routeId,
          p_new_term: newTerm,
          p_new_year: newYear,
          p_copy_learners: copyLearners,
        });

      if (error) throw error;
      
      // Get the new route
      return await this.getById(data);
    } catch (error) {
      console.error('Duplicate route error:', error);
      throw error;
    }
  }

  /**
   * Delete route (admin only)
   * @param {string} id - Route ID
   * @returns {Promise<void>}
   */
  async delete(id) {
    try {
      const { error } = await this.supabase
        .from('routes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Delete route error:', error);
      throw error;
    }
  }

  /**
   * Get route with learner count
   * @param {string} id - Route ID
   * @returns {Promise<Object>} - Route with learner count
   */
  async getWithLearnerCount(id) {
    try {
      const route = await this.getById(id);
      
      const { count, error } = await this.supabase
        .from('learners')
        .select('*', { count: 'exact', head: true })
        .eq('route_id', id)
        .eq('active', true);

      if (error) throw error;

      return {
        ...route,
        learner_count: count || 0,
      };
    } catch (error) {
      console.error('Get route with learner count error:', error);
      throw error;
    }
  }
}

// Create singleton instance
const routesService = new RoutesService();

export default routesService;
