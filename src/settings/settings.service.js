import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import config from '../config.js';

const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);

const TABLE_NAME = 'school_config';

const settingsService = {

  /**
   * Get all settings (grades and streams)
   * @returns {Promise<Object>} Object containing grades and streams arrays
   */
  async getAll() {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        // If table doesn't exist, return defaults for fallback or empty
        if (error.code === '42P01') { // undefined_table
            console.warn('Settings table not found. Using defaults.');
            return {
                grades: [
                    { name: 'Play Group' }, { name: 'PP1' }, { name: 'PP2' },
                    { name: 'Grade 1' }, { name: 'Grade 2' }, { name: 'Grade 3' },
                    { name: 'Grade 4' }, { name: 'Grade 5' }, { name: 'Grade 6' },
                    { name: 'Grade 7' }, { name: 'Grade 8' }, { name: 'Grade 9' }
                ],
                streams: [{ name: 'Red' }, { name: 'Blue' }]
            };
        }
        throw error;
      }

      const grades = data.filter(item => item.type === 'grade');
      const streams = data.filter(item => item.type === 'stream');

      return { grades, streams };
    } catch (error) {
      console.error('Get settings error:', error);
      return { grades: [], streams: [] };
    }
  },

  /**
   * Add a new setting (grade or stream)
   * @param {string} type - 'grade' or 'stream'
   * @param {string} name - Name of the grade or stream
   * @returns {Promise<Object>} Created item
   */
  async add(type, name) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([{ type, name }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a setting
   * @param {string} id - ID to delete
   * @returns {Promise<void>}
   */
  async delete(id) {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Fallback defaults if table missing
  defaults: {
      grades: ['Play Group', 'PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'],
      streams: ['Red', 'Blue', 'Green', 'Yellow']
  }
};

export default settingsService;
