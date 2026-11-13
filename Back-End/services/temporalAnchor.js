const { sendTemporalAnchorAlert, sendAnchorActivationAlert, sendAnchorDeactivationAlert } = require('./email');
const { getAddressFromCoordinates, isSafeZone } = require('./geolocation');

// In-memory storage for active anchors (in production, use database)
const activeAnchors = new Map();

class TemporalAnchorService {
  // Activate a temporal anchor
  async activateAnchor(anchorData) {
    try {
      const anchorId = `${anchorData.userId}_${Date.now()}`;
      
      // Get address from coordinates
      const addressInfo = await getAddressFromCoordinates(
        anchorData.location.latitude, 
        anchorData.location.longitude
      );
      
      // Check if location is in a safe zone
      const safeZoneInfo = isSafeZone(
        anchorData.location.latitude, 
        anchorData.location.longitude
      );
      
      const anchor = {
        id: anchorId,
        userId: anchorData.userId,
        userName: anchorData.userName,
        emergencyContacts: anchorData.emergencyContacts,
        startTime: new Date(),
        durationMinutes: anchorData.durationMinutes || 60, // Default 1 hour
        location: {
          ...anchorData.location,
          address: addressInfo.address,
          safeZone: safeZoneInfo
        },
        message: anchorData.message,
        status: 'active',
        updateCount: 0,
        intervalId: null
      };

      // Send activation email
      await sendAnchorActivationAlert({
        userName: anchor.userName,
        emergencyContacts: anchor.emergencyContacts,
        location: anchor.location,
        durationMinutes: anchor.durationMinutes,
        timestamp: anchor.startTime.toISOString(),
        message: anchor.message
      });

      // Set up 15-minute interval for location updates
      anchor.intervalId = setInterval(async () => {
        await this.sendPeriodicUpdate(anchorId);
      }, 15 * 60 * 1000); // 15 minutes in milliseconds

      // Set up auto-deactivation timer
      const deactivationTimer = setTimeout(async () => {
        await this.deactivateAnchor(anchorId, 'auto_timeout');
      }, anchor.durationMinutes * 60 * 1000);

      anchor.deactivationTimer = deactivationTimer;

      // Store the anchor
      activeAnchors.set(anchorId, anchor);

      console.log(`⚓ Temporal anchor activated: ${anchorId} for user ${anchor.userName}`);
      
      return {
        success: true,
        anchorId,
        message: 'Temporal anchor activated successfully',
        nextUpdateIn: '15 minutes'
      };

    } catch (error) {
      console.error('Error activating temporal anchor:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Send periodic location update
  async sendPeriodicUpdate(anchorId) {
    try {
      const anchor = activeAnchors.get(anchorId);
      
      if (!anchor || anchor.status !== 'active') {
        return;
      }

      anchor.updateCount++;
      const currentTime = new Date();
      const elapsedMinutes = Math.floor((currentTime - anchor.startTime) / (1000 * 60));

      // Check if anchor should be auto-deactivated
      if (elapsedMinutes >= anchor.durationMinutes) {
        await this.deactivateAnchor(anchorId, 'auto_timeout');
        return;
      }

      // Send update email with current location
      await sendTemporalAnchorAlert({
        userName: anchor.userName,
        emergencyContacts: anchor.emergencyContacts,
        location: anchor.location, // In production, get real-time location
        durationMinutes: anchor.durationMinutes,
        timestamp: currentTime.toISOString(),
        status: `Active (Update #${anchor.updateCount})`,
        message: anchor.message
      });

      console.log(`⚓ Sent periodic update #${anchor.updateCount} for anchor ${anchorId}`);

    } catch (error) {
      console.error('Error sending periodic update:', error);
    }
  }

  // Update location for an active anchor
  async updateLocation(anchorId, newLocation) {
    try {
      const anchor = activeAnchors.get(anchorId);
      
      if (!anchor || anchor.status !== 'active') {
        return {
          success: false,
          error: 'Anchor not found or not active'
        };
      }

      // Update location
      anchor.location = {
        ...anchor.location,
        ...newLocation,
        lastUpdated: new Date().toISOString()
      };

      console.log(`⚓ Location updated for anchor ${anchorId}`);
      
      return {
        success: true,
        message: 'Location updated successfully'
      };

    } catch (error) {
      console.error('Error updating location:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Deactivate a temporal anchor
  async deactivateAnchor(anchorId, reason = 'manual') {
    try {
      const anchor = activeAnchors.get(anchorId);
      
      if (!anchor) {
        return {
          success: false,
          error: 'Anchor not found'
        };
      }

      // Clear intervals and timers
      if (anchor.intervalId) {
        clearInterval(anchor.intervalId);
      }
      if (anchor.deactivationTimer) {
        clearTimeout(anchor.deactivationTimer);
      }

      // Calculate total duration
      const endTime = new Date();
      const totalDurationMinutes = Math.floor((endTime - anchor.startTime) / (1000 * 60));

      // Send deactivation email
      await sendAnchorDeactivationAlert({
        userName: anchor.userName,
        emergencyContacts: anchor.emergencyContacts,
        location: anchor.location,
        totalDurationMinutes,
        timestamp: endTime.toISOString()
      });

      // Update anchor status
      anchor.status = 'deactivated';
      anchor.endTime = endTime;
      anchor.reason = reason;

      console.log(`⚓ Temporal anchor deactivated: ${anchorId} (${reason})`);
      
      // Remove from active anchors
      activeAnchors.delete(anchorId);

      return {
        success: true,
        message: 'Temporal anchor deactivated successfully',
        totalDurationMinutes,
        reason
      };

    } catch (error) {
      console.error('Error deactivating temporal anchor:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get status of an anchor
  getAnchorStatus(anchorId) {
    const anchor = activeAnchors.get(anchorId);
    
    if (!anchor) {
      return {
        success: false,
        error: 'Anchor not found'
      };
    }

    const currentTime = new Date();
    const elapsedMinutes = Math.floor((currentTime - anchor.startTime) / (1000 * 60));
    const remainingMinutes = Math.max(0, anchor.durationMinutes - elapsedMinutes);

    return {
      success: true,
      anchor: {
        id: anchor.id,
        userId: anchor.userId,
        userName: anchor.userName,
        status: anchor.status,
        startTime: anchor.startTime,
        elapsedMinutes,
        remainingMinutes,
        updateCount: anchor.updateCount,
        location: anchor.location
      }
    };
  }

  // Get all active anchors for a user
  getUserActiveAnchors(userId) {
    const userAnchors = [];
    
    for (const [anchorId, anchor] of activeAnchors.entries()) {
      if (anchor.userId === userId && anchor.status === 'active') {
        userAnchors.push(this.getAnchorStatus(anchorId).anchor);
      }
    }

    return {
      success: true,
      anchors: userAnchors
    };
  }

  // Get all active anchors (admin function)
  getAllActiveAnchors() {
    const allAnchors = [];
    
    for (const [anchorId, anchor] of activeAnchors.entries()) {
      if (anchor.status === 'active') {
        allAnchors.push(this.getAnchorStatus(anchorId).anchor);
      }
    }

    return {
      success: true,
      anchors: allAnchors,
      count: allAnchors.length
    };
  }
}

module.exports = new TemporalAnchorService();
