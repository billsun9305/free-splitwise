// API Configuration
const API_CONFIG = {
  development: {
    baseURL: 'http://localhost:8080',
    endpoints: {
      authenticate: '/api/authenticate',
      groups: '/api/groups',
      groupsAll: '/api/groups/all',
      entries: '/api/entries',
      entriesAll: '/api/entries/all',
      entriesWithSplits: '/api/entries/with-splits',
      users: '/api/users',
      usersAll: '/api/users/all',
      splits: '/api/splits',
      splitsEqual: '/api/splits/equal',
      splitsPercentage: '/api/splits/percentage',
      splitsManual: '/api/splits/manual',
      splitsPay: '/api/splits/pay',
      splitsBalance: '/api/splits/balance',
      splitsMyBalance: '/api/splits/my-balance',
      splitsUnpaid: '/api/splits/unpaid',
      groupsSearch: '/api/groups/search',
      groupsJoin: '/api/groups/join',
      groupsLeave: '/api/groups/leave',
      groupsRemoveMember: '/api/groups/remove-member',
      groupsUpdatePassword: '/api/groups/update-password',
      logout: '/app/logout'
    }
  },
  production: {
    baseURL: 'https://free-splitwise-f7e9136cd3b7.herokuapp.com',
    endpoints: {
      authenticate: '/api/authenticate',
      groups: '/api/groups',
      groupsAll: '/api/groups/all',
      entries: '/api/entries',
      entriesAll: '/api/entries/all',
      entriesWithSplits: '/api/entries/with-splits',
      users: '/api/users',
      usersAll: '/api/users/all',
      splits: '/api/splits',
      splitsEqual: '/api/splits/equal',
      splitsPercentage: '/api/splits/percentage',
      splitsManual: '/api/splits/manual',
      splitsPay: '/api/splits/pay',
      splitsBalance: '/api/splits/balance',
      splitsMyBalance: '/api/splits/my-balance',
      splitsUnpaid: '/api/splits/unpaid',
      groupsSearch: '/api/groups/search',
      groupsJoin: '/api/groups/join',
      groupsLeave: '/api/groups/leave',
      groupsRemoveMember: '/api/groups/remove-member',
      groupsUpdatePassword: '/api/groups/update-password',
      logout: '/app/logout'
    }
  }
};

// Determine current environment
const getEnvironment = () => {
  // Check for custom environment variable first
  if (process.env.REACT_APP_API_ENV) {
    return process.env.REACT_APP_API_ENV;
  }
  
  // Fall back to NODE_ENV
  return process.env.NODE_ENV === 'production' ? 'production' : 'development';
};

// Get current configuration
const getCurrentConfig = () => {
  const env = getEnvironment();
  return API_CONFIG[env] || API_CONFIG.development;
};

// API Service class
class ApiService {
  constructor() {
    this.config = getCurrentConfig();
    this.baseURL = this.config.baseURL;
    this.endpoints = this.config.endpoints;
  }

  // Build full URL for endpoint
  buildUrl(endpoint) {
    return `${this.baseURL}${endpoint}`;
  }

  // Generic fetch wrapper with common options
  async request(endpoint, options = {}) {
    const url = this.buildUrl(endpoint);
    
    // Get JWT token from localStorage
    const token = localStorage.getItem('jwt_token');
    
    const defaultOptions = {
      credentials: 'include',
      redirect: 'follow',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }), // Add JWT token if available
        ...options.headers
      }
    };

    const finalOptions = { ...defaultOptions, ...options };
    
    // Debug headers for troubleshooting
    if (endpoint.includes('leave')) {
      console.log('🔍 DEBUG request headers for leave:', {
        url,
        headers: finalOptions.headers,
        hasAuth: !!finalOptions.headers.Authorization
      });
    }
    
    try {
      const response = await fetch(url, finalOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Handle different response types
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return response;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Authentication
  async authenticate(token) {
    return this.request(this.endpoints.authenticate, {
      method: 'POST',
      body: JSON.stringify({ token })
    });
  }

  // Groups
  async getAllGroups() {
    return this.request(this.endpoints.groupsAll);
  }

  async createGroup(groupData) {
    return this.request(this.endpoints.groups, {
      method: 'POST',
      body: JSON.stringify(groupData)
    });
  }

  async searchGroups(name) {
    return this.request(`${this.endpoints.groupsSearch}?name=${encodeURIComponent(name)}`);
  }

  async joinGroup(joinData) {
    console.log('Data being sent to join group API:', joinData);
    return this.request(this.endpoints.groupsJoin, {
      method: 'POST',
      body: JSON.stringify(joinData)
    });
  }

  async leaveGroup(groupId) {
    console.log('🔍 DEBUG leaveGroup:', {
      groupId,
      token: localStorage.getItem('jwt_token') ? 'Present' : 'Missing',
      endpoint: `${this.endpoints.groupsLeave}/${groupId}`
    });
    
    return this.request(`${this.endpoints.groupsLeave}/${groupId}`, {
      method: 'POST'
    });
  }

  async removeMember(removeData) {
    return this.request(this.endpoints.groupsRemoveMember, {
      method: 'POST',
      body: JSON.stringify(removeData)
    });
  }

  async updateGroupPassword(groupId, passwordData) {
    return this.request(`${this.endpoints.groupsUpdatePassword}/${groupId}`, {
      method: 'PUT',
      body: JSON.stringify(passwordData)
    });
  }

  async getGroupById(groupId) {
    return this.request(`${this.endpoints.groups}/${groupId}`);
  }

  async deleteGroup(groupId) {
    return this.request(`${this.endpoints.groups}/${groupId}`, {
      method: 'DELETE'
    });
  }

  // Entries
  async getEntries(groupId) {
    return this.request(`${this.endpoints.entries}?groupId=${groupId}`);
  }

  async createEntry(entryData) {
    return this.request(this.endpoints.entries, {
      method: 'POST',
      body: JSON.stringify(entryData)
    });
  }

  async updateEntry(entryData) {
    return this.request(this.endpoints.entries, {
      method: 'PUT',
      body: JSON.stringify(entryData)
    });
  }

  async deleteEntry(entryId) {
    return this.request(`${this.endpoints.entries}/${entryId}`, {
      method: 'DELETE'
    });
  }

  // Logout
  async logout() {
    return this.request(this.endpoints.logout, {
      method: 'POST'
    });
  }

  // Users
  async getAllUsers() {
    return this.request(this.endpoints.usersAll);
  }

  async getGroupMembers(groupId) {
    return this.request(`${this.endpoints.groups}/${groupId}/members`);
  }

  async getUserById(userId) {
    return this.request(`${this.endpoints.users}/${userId}`);
  }

  // Enhanced Entries with Splits
  async getAllEntries() {
    return this.request(this.endpoints.entriesAll);
  }

  async createEntryWithSplits(entryData) {
    return this.request(this.endpoints.entriesWithSplits, {
      method: 'POST',
      body: JSON.stringify(entryData)
    });
  }

  // Split Management
  async createEqualSplits(splitData) {
    return this.request(this.endpoints.splitsEqual, {
      method: 'POST',
      body: JSON.stringify(splitData)
    });
  }

  async createPercentageSplits(splitData) {
    return this.request(this.endpoints.splitsPercentage, {
      method: 'POST',
      body: JSON.stringify(splitData)
    });
  }

  async createManualSplits(splitData) {
    return this.request(this.endpoints.splitsManual, {
      method: 'POST',
      body: JSON.stringify(splitData)
    });
  }

  async markSplitAsPaid(paymentData) {
    return this.request(this.endpoints.splitsPay, {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
  }

  async markSplitAsUnpaid(paymentData) {
    return this.request(`${this.endpoints.splits}/unpay`, {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
  }

  // Balance & Tracking
  async getUserBalance(groupId, userId) {
    return this.request(`${this.endpoints.splitsBalance}?groupId=${groupId}&userId=${userId}`);
  }

  async getMyBalance(groupId) {
    return this.request(`${this.endpoints.splitsMyBalance}?groupId=${groupId}`);
  }

  async getUnpaidSplits(groupId, userId) {
    return this.request(`${this.endpoints.splitsUnpaid}?groupId=${groupId}&userId=${userId}`);
  }
}

// Token management utilities
export const tokenManager = {
  getToken: () => localStorage.getItem('jwt_token'),
  setToken: (token) => localStorage.setItem('jwt_token', token),
  clearToken: () => localStorage.removeItem('jwt_token'),
  isAuthenticated: () => !!localStorage.getItem('jwt_token')
};

// Export singleton instance
const apiService = new ApiService();
export default apiService;

// Export configuration info for debugging
export const getApiInfo = () => ({
  environment: getEnvironment(),
  baseURL: getCurrentConfig().baseURL,
  config: getCurrentConfig()
}); 