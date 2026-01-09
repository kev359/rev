import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import config from '../config.js';

const supabase = createClient(config.supabaseConfig.url, config.supabaseConfig.anonKey);

const TABLE_NAME = 'school_config';

const settingsService = {

  /**
   * Get all grades with their associated streams
   * @returns {Promise<Array>} Array of grades, each with a streams array
   */
  async getAllGrades() {
    try {
      // Get all items
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        if (error.code === '42P01') {
          console.warn('Settings table not found. Using defaults.');
          return this.getDefaultGrades();
        }
        throw error;
      }

      // Separate grades and streams
      const grades = data.filter(item => item.type === 'grade');
      const streams = data.filter(item => item.type === 'stream');

      // Attach streams to their parent grades
      return grades.map(grade => ({
        ...grade,
        streams: streams.filter(stream => stream.parent_id === grade.id)
      }));
    } catch (error) {
      console.error('Get all grades error:', error);
      return this.getDefaultGrades();
    }
  },

  /**
   * Get all settings (legacy format for backward compatibility)
   * @returns {Promise<Object>} Object containing grades and streams arrays
   */
  async getAll() {
    try {
      const gradesWithStreams = await this.getAllGrades();
      
      // Flatten for backward compatibility
      const allStreams = gradesWithStreams.reduce((acc, grade) => {
        return [...acc, ...grade.streams];
      }, []);

      return {
        grades: gradesWithStreams,
        streams: allStreams
      };
    } catch (error) {
      console.error('Get settings error:', error);
      return { grades: [], streams: [] };
    }
  },

  /**
   * Add a new grade
   * @param {string} name - Name of the grade
   * @param {Array<string>} streamNames - Array of stream names for this grade
   * @returns {Promise<Object>} Created grade with streams
   */
  async addGrade(name, streamNames = []) {
    try {
      // Insert the grade
      const { data: grades, error: gradeError } = await supabase
        .from(TABLE_NAME)
        .insert([{ type: 'grade', name, parent_id: null }])
        .select();

      if (gradeError) throw gradeError;
      const grade = grades[0];

      // Insert streams if provided
      if (streamNames.length > 0) {
        const streamsToInsert = streamNames.map(streamName => ({
          type: 'stream',
          name: streamName,
          parent_id: grade.id
        }));

        const { data: streams, error: streamsError } = await supabase
          .from(TABLE_NAME)
          .insert(streamsToInsert)
          .select();

        if (streamsError) throw streamsError;

        return { ...grade, streams };
      }

      return { ...grade, streams: [] };
    } catch (error) {
      console.error('Add grade error:', error);
      throw error;
    }
  },

  /**
   * Add a stream to an existing grade
   * @param {string} gradeId - ID of the parent grade
   * @param {string} streamName - Name of the stream
   * @returns {Promise<Object>} Created stream
   */
  async addStream(gradeId, streamName) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([{ type: 'stream', name: streamName, parent_id: gradeId }])
      .select();

    if (error) throw error;
    return data[0];
  },

  /**
   * Update a grade or stream
   * @param {string} id - ID to update
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated item
   */
  async update(id, updates) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    return data ? data[0] : null;
  },

  /**
   * Delete a grade or stream
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

  /**
   * Delete a stream from a grade
   * @param {string} streamId - Stream ID to delete
   * @returns {Promise<void>}
   */
  async deleteStream(streamId) {
    return this.delete(streamId);
  },

  /**
   * Get default grades (fallback)
   */
  getDefaultGrades() {
    return [
      { id: 'default-1', name: 'Play Group', streams: [] },
      { id: 'default-2', name: 'PP1', streams: [] },
      { id: 'default-3', name: 'PP2', streams: [] },
      { id: 'default-4', name: 'Grade 1', streams: [{ id: 'ds-1', name: 'Red' }, { id: 'ds-2', name: 'Blue' }] },
      { id: 'default-5', name: 'Grade 2', streams: [] },
      { id: 'default-6', name: 'Grade 3', streams: [] },
      { id: 'default-7', name: 'Grade 4', streams: [] },
      { id: 'default-8', name: 'Grade 5', streams: [] },
      { id: 'default-9', name: 'Grade 6', streams: [] },
      { id: 'default-10', name: 'Grade 7', streams: [] },
      { id: 'default-11', name: 'Grade 8', streams: [] },
      { id: 'default-12', name: 'Grade 9', streams: [] }
    ];
  }
};

export default settingsService;

