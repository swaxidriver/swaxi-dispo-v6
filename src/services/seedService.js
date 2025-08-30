import { addDays, format } from 'date-fns';

import { EnhancedIndexedDBRepository } from '../repository/EnhancedIndexedDBRepository';
import { dayNamesToMask, isDayActive } from '../repository/schemas';

/**
 * Seed service for populating initial data according to P0 requirements:
 * - ShiftTemplate records
 * - ShiftInstance records for next 8 weeks
 */
export class SeedService {
  constructor(repository = null) {
    this.repository = repository || new EnhancedIndexedDBRepository();
  }

  /**
   * Default shift templates based on existing system patterns
   */
  getDefaultTemplates() {
    return [
      {
        id: 'template_frueh',
        name: 'Frueh',
        weekday_mask: dayNamesToMask(['Mo', 'Tu', 'We', 'Th', 'Fr']), // Weekdays only
        start_time: '06:00',
        end_time: '14:00',
        cross_midnight: false,
        color: '#3B82F6', // Blue
        active: true
      },
      {
        id: 'template_spaet',
        name: 'Spaet',
        weekday_mask: dayNamesToMask(['Mo', 'Tu', 'We', 'Th', 'Fr']), // Weekdays only
        start_time: '14:00',
        end_time: '22:00',
        cross_midnight: false,
        color: '#F59E0B', // Amber
        active: true
      },
      {
        id: 'template_nacht',
        name: 'Nacht',
        weekday_mask: dayNamesToMask(['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']), // All days
        start_time: '22:00',
        end_time: '06:00',
        cross_midnight: true,
        color: '#8B5CF6', // Purple
        active: true
      },
      {
        id: 'template_weekend_early',
        name: 'Weekend Early',
        weekday_mask: dayNamesToMask(['Sa', 'Su']), // Weekends only
        start_time: '11:45',
        end_time: '21:00',
        cross_midnight: false,
        color: '#10B981', // Emerald
        active: true
      },
      {
        id: 'template_weekend_night',
        name: 'Weekend Night',
        weekday_mask: dayNamesToMask(['Sa', 'Su']), // Weekends only
        start_time: '21:00',
        end_time: '05:30',
        cross_midnight: true,
        color: '#EF4444', // Red
        active: true
      }
    ];
  }

  /**
   * Generate shift instances from templates for a given date range
   * @param {Date} startDate - Start date for generation
   * @param {number} weeks - Number of weeks to generate
   * @returns {Array} Array of shift instances
   */
  async generateShiftInstances(startDate = new Date(), weeks = 8) {
    try {
      const templates = await this.repository.listShiftTemplates({ active: true });
      if (!templates || !Array.isArray(templates) || templates.length === 0) {
        console.warn('No active templates found for generating shift instances');
        return [];
      }

      const instances = [];
      const totalDays = weeks * 7;

      for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
        const currentDate = addDays(startDate, dayOffset);
        const dayOfWeek = currentDate.getDay(); // 0=Sunday, 1=Monday, etc.
        const dateString = format(currentDate, 'yyyy-MM-dd');

        for (const template of templates) {
          // Check if template is active for this day of week
          if (isDayActive(template.weekday_mask, dayOfWeek)) {
            const instance = this._createShiftInstanceFromTemplate(
              template,
              currentDate,
              dateString
            );
            instances.push(instance);
          }
        }
      }

      return instances;
    } catch (error) {
      console.error('Error generating shift instances:', error);
      return [];
    }
  }

  /**
   * Create a shift instance from a template
   * @private
   */
  _createShiftInstanceFromTemplate(template, date, dateString) {
    const { start_dt, end_dt } = this._calculateDatetimes(
      date,
      template.start_time,
      template.end_time,
      template.cross_midnight
    );

    return {
      id: `instance_${dateString}_${template.id}`,
      date: dateString,
      start_dt,
      end_dt,
      template_id: template.id,
      notes: null
    };
  }

  /**
   * Calculate start and end datetimes for a shift
   * @private
   */
  _calculateDatetimes(date, startTime, endTime, crossMidnight) {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const start_dt = new Date(date);
    start_dt.setHours(startHour, startMin, 0, 0);

    const end_dt = new Date(date);
    end_dt.setHours(endHour, endMin, 0, 0);

    // If shift crosses midnight, end time is next day
    if (crossMidnight) {
      end_dt.setDate(end_dt.getDate() + 1);
    }

    return { start_dt, end_dt };
  }

  /**
   * Seed default persons for demonstration
   */
  getDefaultPersons() {
    return [
      {
        id: 'person_admin',
        name: 'Admin User',
        email: 'admin@swaxi.local',
        role: 'admin'
      },
      {
        id: 'person_chief',
        name: 'Chief Dispatcher',
        email: 'chief@swaxi.local',
        role: 'chief'
      },
      {
        id: 'person_disp1',
        name: 'Dispatcher One',
        email: 'disp1@swaxi.local',
        role: 'disponent'
      },
      {
        id: 'person_disp2',
        name: 'Dispatcher Two',
        email: 'disp2@swaxi.local',
        role: 'disponent'
      },
      {
        id: 'person_analyst',
        name: 'Data Analyst',
        email: 'analyst@swaxi.local',
        role: 'analyst'
      }
    ];
  }

  /**
   * Check if database is empty and needs seeding
   */
  async needsSeeding() {
    try {
      const templates = await this.repository.listShiftTemplates();
      const instances = await this.repository.listShiftInstances();
      const persons = await this.repository.listPersons();
      
      return (templates && templates.length === 0) && 
             (instances && instances.length === 0) && 
             (persons && persons.length === 0);
    } catch (error) {
      console.warn('Could not check seeding status:', error);
      return true; // Assume needs seeding if we can't check
    }
  }

  /**
   * Perform initial seeding if database is empty
   */
  async seedIfEmpty() {
    const needsSeeding = await this.needsSeeding();
    
    if (!needsSeeding) {
      console.log('Database already has data, skipping seed');
      return { seeded: false, reason: 'Database not empty' };
    }

    return this.performSeed();
  }

  /**
   * Perform the actual seeding operation
   */
  async performSeed() {
    try {
      console.log('Starting database seeding...');
      const results = {
        templates: 0,
        instances: 0,
        persons: 0,
        errors: []
      };

      // 1. Seed shift templates
      const templates = this.getDefaultTemplates();
      for (const template of templates) {
        try {
          await this.repository.createShiftTemplate(template);
          results.templates++;
        } catch (error) {
          console.error(`Failed to create template ${template.name}:`, error);
          results.errors.push(`Template ${template.name}: ${error.message}`);
        }
      }

      // 2. Seed persons
      const persons = this.getDefaultPersons();
      for (const person of persons) {
        try {
          await this.repository.createPerson(person);
          results.persons++;
        } catch (error) {
          console.error(`Failed to create person ${person.name}:`, error);
          results.errors.push(`Person ${person.name}: ${error.message}`);
        }
      }

      // 3. Generate shift instances for next 8 weeks
      const instances = await this.generateShiftInstances();
      for (const instance of instances) {
        try {
          await this.repository.createShiftInstance(instance);
          results.instances++;
        } catch (error) {
          console.error(`Failed to create shift instance ${instance.id}:`, error);
          results.errors.push(`Instance ${instance.id}: ${error.message}`);
        }
      }

      console.log(`Seeding completed: ${results.templates} templates, ${results.instances} instances, ${results.persons} persons`);
      
      if (results.errors.length > 0) {
        console.warn('Seeding had errors:', results.errors);
      }

      return {
        seeded: true,
        results
      };
    } catch (error) {
      console.error('Seeding failed:', error);
      return {
        seeded: false,
        error: error.message
      };
    }
  }

  /**
   * Clear all data (for testing or reset)
   */
  async clearAll() {
    try {
      // Note: This would require implementation of delete methods in the repository
      console.warn('clearAll not implemented - would require delete methods in repository');
      return { cleared: false, reason: 'Not implemented' };
    } catch (error) {
      console.error('Clear failed:', error);
      return { cleared: false, error: error.message };
    }
  }
}

export default SeedService;