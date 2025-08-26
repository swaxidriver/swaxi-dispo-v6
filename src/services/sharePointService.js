// src/services/sharePointService.js
import { logError, logInfo } from '../utils/logger';
/**
 * SharePoint Integration Service for Stadtwerke Augsburg
 * This service connects your React app to SharePoint Lists
 */

export class SharePointService {
  constructor() {
    this.baseUrl = 'https://stadtwerke-augsburg.sharepoint.com/sites/swaxi-dispo';
    this.listNames = {
      shifts: 'Shifts',
      users: 'Users', 
      applications: 'Applications',
      audit: 'AuditLog'
    };
  }

  async getAccessToken() {
    // This will use the browser's existing authentication
    // when accessed from within the Stadtwerke network
    const response = await fetch(`${this.baseUrl}/_api/contextinfo`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json;odata=verbose',
        'Content-Type': 'application/json;odata=verbose'
      },
      credentials: 'include'
    });
    
    const data = await response.json();
    return data.d.GetContextWebInformation.FormDigestValue;
  }

  async getShifts(filter = '') {
    try {
      const url = `${this.baseUrl}/_api/web/lists/getbytitle('${this.listNames.shifts}')/items${filter}`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json;odata=verbose'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.d.results.map(this.transformShiftFromSharePoint);
    } catch (error) {
      logError('Error fetching shifts from SharePoint:', error);
      // Fallback to localStorage for development
      return this.getShiftsFromLocalStorage();
    }
  }

  async createShift(shiftData) {
    try {
      const token = await this.getAccessToken();
      const transformedData = this.transformShiftToSharePoint(shiftData);
      
      const response = await fetch(
        `${this.baseUrl}/_api/web/lists/getbytitle('${this.listNames.shifts}')/items`,
        {
          method: 'POST',
          headers: {
            'Accept': 'application/json;odata=verbose',
            'Content-Type': 'application/json;odata=verbose',
            'X-RequestDigest': token
          },
          credentials: 'include',
          body: JSON.stringify(transformedData)
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return this.transformShiftFromSharePoint(data.d);
    } catch (error) {
      logError('Error creating shift in SharePoint:', error);
      // Fallback to localStorage
      return this.createShiftInLocalStorage(shiftData);
    }
  }

  async updateShift(shiftId, updates) {
    try {
      const token = await this.getAccessToken();
      const transformedData = this.transformShiftToSharePoint(updates);
      
      const response = await fetch(
        `${this.baseUrl}/_api/web/lists/getbytitle('${this.listNames.shifts}')/items(${shiftId})`,
        {
          method: 'POST',
          headers: {
            'Accept': 'application/json;odata=verbose',
            'Content-Type': 'application/json;odata=verbose',
            'X-RequestDigest': token,
            'X-HTTP-Method': 'MERGE',
            'If-Match': '*'
          },
          credentials: 'include',
          body: JSON.stringify(transformedData)
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return { success: true };
    } catch (error) {
      logError('Error updating shift in SharePoint:', error);
      return this.updateShiftInLocalStorage(shiftId, updates);
    }
  }

  async getUsers() {
    try {
      const response = await fetch(
        `${this.baseUrl}/_api/web/lists/getbytitle('${this.listNames.users}')/items`,
        {
          headers: {
            'Accept': 'application/json;odata=verbose'
          },
          credentials: 'include'
        }
      );
      
      const data = await response.json();
      return data.d.results.map(this.transformUserFromSharePoint);
    } catch (error) {
      logError('Error fetching users from SharePoint:', error);
      return this.getUsersFromLocalStorage();
    }
  }

  async logAudit(action, details) {
    try {
      const token = await this.getAccessToken();
      const auditData = {
        Title: `${action}_${Date.now()}`,
        Action: action,
        Details: JSON.stringify(details),
        UserEmail: this.getCurrentUserEmail(),
        Timestamp: new Date().toISOString()
      };
      
      await fetch(
        `${this.baseUrl}/_api/web/lists/getbytitle('${this.listNames.audit}')/items`,
        {
          method: 'POST',
          headers: {
            'Accept': 'application/json;odata=verbose',
            'Content-Type': 'application/json;odata=verbose',
            'X-RequestDigest': token
          },
          credentials: 'include',
          body: JSON.stringify(auditData)
        }
      );
    } catch (error) {
      logError('Error logging audit to SharePoint:', error);
      // Log to console as fallback
      logInfo('Audit Log:', { action, details, timestamp: new Date() });
    }
  }

  // Transform functions to convert between SharePoint and your app format
  transformShiftFromSharePoint(spItem) {
    return {
      id: spItem.Id || spItem.ID,
      date: new Date(spItem.ShiftDate),
      start: spItem.StartTime,
      end: spItem.EndTime,
      type: spItem.ShiftType,
      status: spItem.Status || 'open',
      assignedTo: spItem.AssignedTo ? spItem.AssignedTo.Title : null,
      workLocation: spItem.WorkLocation || 'office',
      conflicts: spItem.Conflicts ? JSON.parse(spItem.Conflicts) : [],
      createdAt: new Date(spItem.Created),
      updatedAt: new Date(spItem.Modified)
    };
  }

  transformShiftToSharePoint(shift) {
    return {
      Title: `Shift_${shift.date}_${shift.start}`,
      ShiftDate: shift.date instanceof Date ? shift.date.toISOString() : shift.date,
      StartTime: shift.start,
      EndTime: shift.end,
      ShiftType: shift.type,
      Status: shift.status,
      WorkLocation: shift.workLocation,
      Conflicts: JSON.stringify(shift.conflicts || [])
    };
  }

  transformUserFromSharePoint(spItem) {
    return {
      id: spItem.Id || spItem.ID,
      name: spItem.Title,
      email: spItem.Email,
      role: spItem.Role,
      active: spItem.Active,
      createdAt: new Date(spItem.Created)
    };
  }

  // Fallback methods for development/offline use
  getShiftsFromLocalStorage() {
    const data = JSON.parse(localStorage.getItem('swaxi-dispo-state') || '{"shifts": []}');
    return data.shifts || [];
  }

  createShiftInLocalStorage(shiftData) {
    const data = JSON.parse(localStorage.getItem('swaxi-dispo-state') || '{"shifts": []}');
    const newShift = {
      ...shiftData,
      id: Date.now(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    data.shifts = [...(data.shifts || []), newShift];
    localStorage.setItem('swaxi-dispo-state', JSON.stringify(data));
    return newShift;
  }

  updateShiftInLocalStorage(shiftId, updates) {
    const data = JSON.parse(localStorage.getItem('swaxi-dispo-state') || '{"shifts": []}');
    data.shifts = data.shifts.map(shift => 
      shift.id === shiftId ? { ...shift, ...updates, updatedAt: new Date() } : shift
    );
    localStorage.setItem('swaxi-dispo-state', JSON.stringify(data));
    return { success: true };
  }

  getUsersFromLocalStorage() {
    // Demo users for development
    return [
      { id: 1, name: 'Admin User', email: 'admin@stadtwerke-augsburg.de', role: 'admin', active: true },
      { id: 2, name: 'Chief Dispatcher', email: 'chief@stadtwerke-augsburg.de', role: 'chief', active: true },
      { id: 3, name: 'Dispatcher 1', email: 'disp1@stadtwerke-augsburg.de', role: 'disponent', active: true }
    ];
  }

  getCurrentUserEmail() {
    // This would normally come from SharePoint context
    // For development, use a default
    return localStorage.getItem('current-user-email') || 'dev@stadtwerke-augsburg.de';
  }

  // Utility method to check if SharePoint is available
  async isSharePointAvailable() {
    try {
      const response = await fetch(`${this.baseUrl}/_api/web`, {
        headers: { 'Accept': 'application/json;odata=verbose' },
        credentials: 'include'
      });
      return response.ok;
    } catch (_error) {
      return false;
    }
  }
}

// Export singleton instance
export const sharePointService = new SharePointService();
