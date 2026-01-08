// ============================================
// PICKUP TIME CONFLICT CHECKER
// ============================================

import { getSupabaseClient } from '../config.js';

class ConflictChecker {
  constructor() {
    this.supabase = getSupabaseClient();
  }

  /**
   * Check for pickup time conflicts
   * @param {string} routeId - Route ID
   * @param {string} pickupTime - Pickup time (HH:mm)
   * @param {string} pickupArea - Pickup area
   * @param {string} excludeLearnerId - Learner ID to exclude (for updates)
   * @returns {Promise<Object>} - { hasConflict, conflicts }
   */
  async checkConflicts(routeId, pickupTime, pickupArea, excludeLearnerId = null) {
    try {
      // Call Supabase function to check conflicts
      const { data, error } = await this.supabase
        .rpc('check_pickup_time_conflicts', {
          p_route_id: routeId,
          p_pickup_time: pickupTime,
          p_pickup_area: pickupArea,
          p_learner_id: excludeLearnerId,
        });

      if (error) {
        console.error('Conflict check error:', error);
        // Fallback to manual check if function doesn't exist
        return await this.manualConflictCheck(routeId, pickupTime, pickupArea, excludeLearnerId);
      }

      return {
        hasConflict: data[0]?.conflict_exists || false,
        conflicts: data[0]?.conflicting_learners || [],
      };
    } catch (error) {
      console.error('Check conflicts error:', error);
      // Fallback to manual check
      return await this.manualConflictCheck(routeId, pickupTime, pickupArea, excludeLearnerId);
    }
  }

  /**
   * Manual conflict check (fallback)
   * @param {string} routeId - Route ID
   * @param {string} pickupTime - Pickup time
   * @param {string} pickupArea - Pickup area
   * @param {string} excludeLearnerId - Learner ID to exclude
   * @returns {Promise<Object>} - { hasConflict, conflicts }
   */
  async manualConflictCheck(routeId, pickupTime, pickupArea, excludeLearnerId = null) {
    try {
      let query = this.supabase
        .from('learners')
        .select('*')
        .eq('route_id', routeId)
        .eq('pickup_time', pickupTime)
        .neq('pickup_area', pickupArea)
        .eq('active', true);

      if (excludeLearnerId) {
        query = query.neq('id', excludeLearnerId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        hasConflict: data && data.length > 0,
        conflicts: data || [],
      };
    } catch (error) {
      console.error('Manual conflict check error:', error);
      return { hasConflict: false, conflicts: [] };
    }
  }

  /**
   * Format conflict message
   * @param {Array} conflicts - Array of conflicting learners
   * @returns {string} - Formatted message
   */
  formatConflictMessage(conflicts) {
    if (!conflicts || conflicts.length === 0) {
      return '';
    }

    const learnerList = conflicts.map(l => 
      `${l.name} (${l.pickup_area})`
    ).join(', ');

    return `The following learner(s) have the same pickup time in different areas: ${learnerList}. This may cause scheduling conflicts.`;
  }

  /**
   * Get all conflicts for a route
   * @param {string} routeId - Route ID
   * @returns {Promise<Array>} - Array of conflicts
   */
  async getAllConflicts(routeId) {
    try {
      const { data: learners, error } = await this.supabase
        .from('learners')
        .select('*')
        .eq('route_id', routeId)
        .eq('active', true)
        .order('pickup_time', { ascending: true });

      if (error) throw error;

      const conflicts = [];
      const timeGroups = {};

      // Group learners by pickup time
      learners.forEach(learner => {
        const time = learner.pickup_time;
        if (!timeGroups[time]) {
          timeGroups[time] = [];
        }
        timeGroups[time].push(learner);
      });

      // Find conflicts (same time, different areas)
      for (const [time, group] of Object.entries(timeGroups)) {
        if (group.length > 1) {
          const areas = [...new Set(group.map(l => l.pickup_area))];
          if (areas.length > 1) {
            conflicts.push({
              time,
              learners: group,
              areas,
            });
          }
        }
      }

      return conflicts;
    } catch (error) {
      console.error('Get all conflicts error:', error);
      return [];
    }
  }

  /**
   * Validate pickup time
   * @param {string} time - Time to validate (HH:mm)
   * @returns {boolean} - True if valid
   */
  validateTime(time) {
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }
}

// Create singleton instance
const conflictChecker = new ConflictChecker();

export default conflictChecker;
