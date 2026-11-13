// API Service for AI Guardian App
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Helper method to get auth headers
  getAuthHeaders() {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
    return {
      'Content-Type': 'application/json',
      ...(user?.token && { 'Authorization': `Bearer ${user.token}` })
    };
  }

  // Helper method to make API calls
  async makeRequest(endpoint, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const config = {
        headers: this.getAuthHeaders(),
        ...options
      };

      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Auth APIs
  async login(email, password) {
    return this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async register(userData) {
    return this.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  // Community Guardian APIs
  async joinAsGuardian(guardianData) {
    return this.makeRequest('/community/join', {
      method: 'POST',
      body: JSON.stringify(guardianData)
    });
  }

  async getNearbyUsers(latitude, longitude, radius = 2) {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      radius: radius.toString()
    });
    
    return this.makeRequest(`/community/nearby?${params}`);
  }

  async updateLocation(latitude, longitude, isActive = true) {
    return this.makeRequest('/community/location', {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude, isActive })
    });
  }

  async getGuardianLeaderboard(limit = 10) {
    return this.makeRequest(`/community/leaderboard?limit=${limit}`);
  }

  async reportHelpAction(alertId, actionType, location) {
    return this.makeRequest('/community/help-action', {
      method: 'POST',
      body: JSON.stringify({ alertId, actionType, location })
    });
  }

  // SOS APIs
  async sendSOS(location, message, emergencyContacts) {
    return this.makeRequest('/sos/send', {
      method: 'POST',
      body: JSON.stringify({ location, message, emergencyContacts })
    });
  }

  async getSosAlerts(latitude, longitude, radius = 5) {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      radius: radius.toString()
    });
    
    return this.makeRequest(`/sos/alerts?${params}`);
  }

  // Gamification APIs
  async getProfile() {
    return this.makeRequest('/gamification/profile');
  }

  async updateSafetyScore(points, reason) {
    return this.makeRequest('/gamification/score', {
      method: 'POST',
      body: JSON.stringify({ points, reason })
    });
  }

  async getAchievements() {
    return this.makeRequest('/gamification/achievements');
  }

  async getLeaderboard(type = 'safety', limit = 10) {
    const params = new URLSearchParams({
      type,
      limit: limit.toString()
    });
    
    return this.makeRequest(`/gamification/leaderboard?${params}`);
  }

  // Safety Anchor APIs
  async createAnchor(anchorData) {
    return this.makeRequest('/anchor/create', {
      method: 'POST',
      body: JSON.stringify(anchorData)
    });
  }

  async getNearbyAnchors(latitude, longitude, radius = 1) {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      radius: radius.toString()
    });
    
    return this.makeRequest(`/anchor/nearby?${params}`);
  }

  async deleteAnchor(anchorId) {
    return this.makeRequest(`/anchor/${anchorId}`, {
      method: 'DELETE'
    });
  }

  // Health check
  async healthCheck() {
    return this.makeRequest('/health');
  }

  // Threat Prediction APIs
  async analyzeThreat(sensorData, userContext, evidence) {
    return this.makeRequest('/threat-prediction/analyze', {
      method: 'POST',
      body: JSON.stringify({ sensorData, userContext, evidence })
    });
  }

  async incidentAction(incidentId, action, method) {
    return this.makeRequest(`/threat-prediction/incident/${incidentId}/action`, {
      method: 'POST',
      body: JSON.stringify({ action, method })
    });
  }

  async getThreatIncidents(limit = 20) {
    return this.makeRequest(`/threat-prediction/incidents?limit=${limit}`);
  }

  async reportFalseAlarm(incidentId, reporterType, reporterInfo) {
    return this.makeRequest('/threat-prediction/report-false-alarm', {
      method: 'POST',
      body: JSON.stringify({ incidentId, reporterType, reporterInfo })
    });
  }

  async getThreatStats() {
    return this.makeRequest('/threat-prediction/stats');
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;