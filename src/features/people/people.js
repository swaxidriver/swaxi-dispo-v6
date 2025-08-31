/**
 * People Feature - User and person management utilities
 *
 * This module contains utilities for managing users, their profiles,
 * preferences, and related functionality.
 */

/**
 * Create a new user profile
 * @param {Object} userData - User data
 * @returns {Object} Created user object
 */
export function createUserProfile(userData) {
  const requiredFields = ["name", "email", "role"];

  for (const field of requiredFields) {
    if (!userData[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  return {
    id: generateUserId(userData.name, userData.email),
    name: userData.name,
    email: userData.email,
    role: userData.role,
    preferences: userData.preferences || {},
    availability: userData.availability || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    active: true,
  };
}

/**
 * Update user preferences
 * @param {Object} user - User object
 * @param {Object} newPreferences - New preferences to merge
 * @returns {Object} Updated user object
 */
export function updateUserPreferences(user, newPreferences) {
  return {
    ...user,
    preferences: {
      ...user.preferences,
      ...newPreferences,
    },
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Get user's email notification preferences
 * @param {Object} user - User object
 * @returns {Object} Email notification preferences
 */
export function getUserEmailPreferences(user) {
  return {
    emailNotifications: user.preferences?.emailNotifications !== false, // Default to enabled
    digestTime: user.preferences?.digestTime || "18:30",
    immediateRemovalNotice: user.preferences?.immediateRemovalNotice !== false, // Default to enabled
  };
}

/**
 * Check if a user is available on a specific date
 * @param {Object} user - User object
 * @param {string} date - Date string (YYYY-MM-DD)
 * @returns {boolean} True if user is available
 */
export function isUserAvailableOnDate(user, date) {
  if (!user.availability) return true;

  // Check unavailable dates
  if (user.availability.unavailableDates?.includes(date)) {
    return false;
  }

  // Check recurring unavailability (e.g., weekends)
  if (user.availability.unavailableWeekdays) {
    const dayOfWeek = new Date(date).getDay();
    if (user.availability.unavailableWeekdays.includes(dayOfWeek)) {
      return false;
    }
  }

  return true;
}

/**
 * Get user's shift preferences
 * @param {Object} user - User object
 * @returns {Object} Shift preferences
 */
export function getUserShiftPreferences(user) {
  return {
    preferredShiftTypes: user.preferences?.preferredShiftTypes || [],
    preferredWorkLocation: user.preferences?.preferredWorkLocation || "office",
    maxShiftsPerWeek: user.preferences?.maxShiftsPerWeek || 5,
    minRestHours: user.preferences?.minRestHours || 8,
  };
}

/**
 * Generate a unique user ID
 * @param {string} name - User name
 * @param {string} email - User email
 * @returns {string} Generated user ID
 */
function generateUserId(name, email) {
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const emailPrefix = email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const timestamp = Date.now().toString(36);

  return `user_${cleanName}_${emailPrefix}_${timestamp}`;
}

/**
 * Validate user role
 * @param {string} role - Role to validate
 * @returns {boolean} True if role is valid
 */
export function isValidRole(role) {
  const validRoles = ["admin", "chief", "disponent", "analyst"];
  return validRoles.includes(role);
}

/**
 * Get users by role
 * @param {Array} users - Array of users
 * @param {string} role - Role to filter by
 * @returns {Array} Users with the specified role
 */
export function getUsersByRole(users, role) {
  return users.filter((user) => user.role === role && user.active);
}

/**
 * Search users by name or email
 * @param {Array} users - Array of users
 * @param {string} searchTerm - Search term
 * @returns {Array} Matching users
 */
export function searchUsers(users, searchTerm) {
  if (!searchTerm) return users;

  const term = searchTerm.toLowerCase();

  return users.filter(
    (user) =>
      user.name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term),
  );
}
