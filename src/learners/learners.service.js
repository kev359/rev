// ============================================
// LEARNERS SERVICE
// ============================================

import { getSupabaseClient } from '../config.js';

class LearnersService {
  constructor() {
    this.supabase = getSupabaseClient();
  }

  /**
   * Get all learners
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} - Array of learners
   */
  async getAll(filters = {}) {
    try {
      let query = this.supabase
        .from('learners')
        .select('*')
        .order('pickup_time', { ascending: true });

      // Filter by route
      if (filters.route_id) {
        query = query.eq('route_id', filters.route_id);
      }

      // Filter by status
      if (filters.active !== undefined) {
        query = query.eq('active', filters.active);
      }

      // Filter by class
      if (filters.class) {
        query = query.eq('class', filters.class);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get learners error:', error);
      throw error;
    }
  }

  /**
   * Get learner by ID
   * @param {string} id - Learner ID
   * @returns {Promise<Object>} - Learner object
   */
  async getById(id) {
    try {
      const { data, error } = await this.supabase
        .from('learners')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get learner error:', error);
      throw error;
    }
  }

  /**
   * Create new learner
   * @param {Object} learnerData - Learner data
   * @returns {Promise<Object>} - Created learner
   */
  async create(learnerData) {
    try {
      const { data, error } = await this.supabase
        .from('learners')
        .insert([{
          name: learnerData.name,
          admission_no: learnerData.admission_no,
          class: learnerData.class,
          pickup_area: learnerData.pickup_area,
          pickup_time: learnerData.pickup_time,
          father_phone: learnerData.father_phone,
          mother_phone: learnerData.mother_phone,
          route_id: learnerData.route_id,
          active: true,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create learner error:', error);
      throw error;
    }
  }

  /**
   * Update learner
   * @param {string} id - Learner ID
   * @param {Object} learnerData - Learner data
   * @returns {Promise<Object>} - Updated learner
   */
  async update(id, learnerData) {
    try {
      const updateData = {
        name: learnerData.name,
        admission_no: learnerData.admission_no,
        class: learnerData.class,
        pickup_area: learnerData.pickup_area,
        pickup_time: learnerData.pickup_time,
        father_phone: learnerData.father_phone,
        mother_phone: learnerData.mother_phone,
        route_id: learnerData.route_id,
      };

      // Only include active if explicitly provided
      if (learnerData.active !== undefined) {
        updateData.active = learnerData.active;
      }

      const { data, error } = await this.supabase
        .from('learners')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update learner error:', error);
      throw error;
    }
  }

  /**
   * Deactivate learner
   * @param {string} id - Learner ID
   * @returns {Promise<Object>} - Updated learner
   */
  async deactivate(id) {
    try {
      const { data, error } = await this.supabase
        .from('learners')
        .update({ active: false })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Deactivate learner error:', error);
      throw error;
    }
  }

  /**
   * Reactivate learner
   * @param {string} id - Learner ID
   * @returns {Promise<Object>} - Updated learner
   */
  async reactivate(id) {
    try {
      const { data, error } = await this.supabase
        .from('learners')
        .update({ active: true })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Reactivate learner error:', error);
      throw error;
    }
  }

  /**
   * Check for duplicate admission number
   * @param {string} admissionNo - Admission number
   * @param {string} excludeId - Learner ID to exclude (for updates)
   * @returns {Promise<boolean>} - True if duplicate exists
   */
  async checkDuplicateAdmission(admissionNo, excludeId = null) {
    try {
      let query = this.supabase
        .from('learners')
        .select('id')
        .eq('admission_no', admissionNo);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data && data.length > 0;
    } catch (error) {
      console.error('Check duplicate admission error:', error);
      throw error;
    }
  }

  /**
   * Get learners by route
   * @param {string} routeId - Route ID
   * @param {boolean} activeOnly - Only active learners
   * @returns {Promise<Array>} - Array of learners
   */
  async getByRoute(routeId, activeOnly = true) {
    try {
      let query = this.supabase
        .from('learners')
        .select('*')
        .eq('route_id', routeId)
        .order('pickup_time', { ascending: true });

      if (activeOnly) {
        query = query.eq('active', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get learners by route error:', error);
      throw error;
    }
  }

  /**
   * Get unique classes
   * @returns {Promise<Array>} - Array of unique classes
   */
  async getUniqueClasses() {
    try {
      const { data, error } = await this.supabase
        .from('learners')
        .select('class')
        .order('class', { ascending: true });

      if (error) throw error;

      // Get unique classes
      const classes = [...new Set(data.map(l => l.class))];
      return classes;
    } catch (error) {
      console.error('Get unique classes error:', error);
      throw error;
    }
  }

  /**
   * Search learners
   * @param {string} searchTerm - Search term
   * @param {string} routeId - Optional route filter
   * @returns {Promise<Array>} - Array of learners
   */
  async search(searchTerm, routeId = null) {
    try {
      let query = this.supabase
        .from('learners')
        .select('*');

      if (routeId) {
        query = query.eq('route_id', routeId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter results by search term (client-side)
      const term = searchTerm.toLowerCase();
      const filtered = data.filter(learner => {
        return (
          learner.name.toLowerCase().includes(term) ||
          learner.admission_no.toLowerCase().includes(term) ||
          learner.class.toLowerCase().includes(term) ||
          learner.pickup_area.toLowerCase().includes(term)
        );
      });

      return filtered;
    } catch (error) {
      console.error('Search learners error:', error);
      throw error;
    }
  }

  /**
   * Get learner count by route
   * @param {string} routeId - Route ID
   * @param {boolean} activeOnly - Only active learners
   * @returns {Promise<number>} - Count of learners
   */
  async getCountByRoute(routeId, activeOnly = true) {
    try {
      let query = this.supabase
        .from('learners')
        .select('*', { count: 'exact', head: true })
        .eq('route_id', routeId);

      if (activeOnly) {
        query = query.eq('active', true);
      }

      const { count, error } = await query;

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Get learner count error:', error);
      throw error;
    }
  }
}

// Create singleton instance
const learnersService = new LearnersService();

export default learnersService;
