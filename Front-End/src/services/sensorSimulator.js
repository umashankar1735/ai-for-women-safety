// Sensor simulation service for testing threat prediction
class SensorSimulator {
  constructor() {
    this.isSimulating = false;
    this.simulationInterval = null;
    this.listeners = [];
  }

  // Subscribe to sensor data
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  // Emit sensor data to all listeners
  emit(sensorData) {
    this.listeners.forEach(callback => callback(sensorData));
  }

  // Start continuous sensor simulation
  startSimulation() {
    if (this.isSimulating) return;
    
    this.isSimulating = true;
    this.simulationInterval = setInterval(() => {
      this.generateNormalSensorData();
    }, 1000); // Every second
  }

  // Stop sensor simulation
  stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    this.isSimulating = false;
  }

  // Generate normal/baseline sensor data
  generateNormalSensorData() {
    const sensorData = {
      timestamp: Date.now(),
      audio: {
        volume: 30 + Math.random() * 20, // 30-50 dB ambient
        screamDetected: false,
        confidence: 0.1 + Math.random() * 0.2,
        gunShotDetected: false,
        gunShotConfidence: 0.05 + Math.random() * 0.1
      },
      accelerometer: {
        x: -0.5 + Math.random(),
        y: -0.5 + Math.random(), 
        z: 9.8 + Math.random() * 0.5,
        magnitude: Math.random() * 2,
        fallDetected: false
      },
      heartRate: {
        current: 70 + Math.random() * 20, // 70-90 bpm normal
        trend: 'stable'
      },
      location: {
        latitude: 12.9716 + (Math.random() - 0.5) * 0.001,
        longitude: 77.5946 + (Math.random() - 0.5) * 0.001,
        accuracy: 5 + Math.random() * 10
      }
    };

    this.emit(sensorData);
  }

  // Simulate panic situation (Tier 2)
  simulatePanicSituation() {
    const panicData = {
      timestamp: Date.now(),
      audio: {
        volume: 85 + Math.random() * 15, // Loud scream
        screamDetected: true,
        confidence: 0.85 + Math.random() * 0.1,
        gunShotDetected: false,
        gunShotConfidence: 0.1
      },
      accelerometer: {
        x: -5 + Math.random() * 10,
        y: -5 + Math.random() * 10,
        z: 8 + Math.random() * 4,
        magnitude: 18 + Math.random() * 8, // High shake
        fallDetected: Math.random() > 0.5
      },
      heartRate: {
        current: 145 + Math.random() * 20, // Panic heart rate
        trend: 'rising'
      },
      location: {
        latitude: 12.9716 + (Math.random() - 0.5) * 0.001,
        longitude: 77.5946 + (Math.random() - 0.5) * 0.001,
        accuracy: 3
      }
    };

    this.emit(panicData);
    return panicData;
  }

  // Simulate suspicious activity (Tier 1)
  simulateSuspiciousActivity() {
    const suspiciousData = {
      timestamp: Date.now(),
      audio: {
        volume: 70 + Math.random() * 10,
        screamDetected: Math.random() > 0.3,
        confidence: 0.6 + Math.random() * 0.2,
        gunShotDetected: false,
        gunShotConfidence: 0.2
      },
      accelerometer: {
        x: -3 + Math.random() * 6,
        y: -3 + Math.random() * 6,
        z: 9 + Math.random() * 2,
        magnitude: 12 + Math.random() * 5, // Moderate shake
        fallDetected: false
      },
      heartRate: {
        current: 110 + Math.random() * 15, // Elevated heart rate
        trend: 'rising'
      },
      location: {
        latitude: 12.9716 + (Math.random() - 0.5) * 0.001,
        longitude: 77.5946 + (Math.random() - 0.5) * 0.001,
        accuracy: 5
      }
    };

    this.emit(suspiciousData);
    return suspiciousData;
  }

  // Simulate loud noise (Tier 0)
  simulateLoudNoise() {
    const noiseData = {
      timestamp: Date.now(),
      audio: {
        volume: 82 + Math.random() * 8, // Loud but not scream
        screamDetected: false,
        confidence: 0.3 + Math.random() * 0.2,
        gunShotDetected: false,
        gunShotConfidence: 0.15
      },
      accelerometer: {
        x: -1 + Math.random() * 2,
        y: -1 + Math.random() * 2,
        z: 9.5 + Math.random(),
        magnitude: 3 + Math.random() * 4, // Minimal movement
        fallDetected: false
      },
      heartRate: {
        current: 85 + Math.random() * 10, // Slightly elevated
        trend: 'stable'
      },
      location: {
        latitude: 12.9716 + (Math.random() - 0.5) * 0.001,
        longitude: 77.5946 + (Math.random() - 0.5) * 0.001,
        accuracy: 8
      }
    };

    this.emit(noiseData);
    return noiseData;
  }

  // Simulate gunshot detection
  simulateGunshotDetection() {
    const gunshotData = {
      timestamp: Date.now(),
      audio: {
        volume: 120 + Math.random() * 10, // Very loud
        screamDetected: false,
        confidence: 0.4,
        gunShotDetected: true,
        gunShotConfidence: 0.88 + Math.random() * 0.1
      },
      accelerometer: {
        x: -2 + Math.random() * 4,
        y: -2 + Math.random() * 4,
        z: 9 + Math.random() * 2,
        magnitude: 8 + Math.random() * 5, // Startle response
        fallDetected: false
      },
      heartRate: {
        current: 130 + Math.random() * 20, // Shock response
        trend: 'spiking'
      },
      location: {
        latitude: 12.9716 + (Math.random() - 0.5) * 0.001,
        longitude: 77.5946 + (Math.random() - 0.5) * 0.001,
        accuracy: 3
      }
    };

    this.emit(gunshotData);
    return gunshotData;
  }

  // Get real device sensors (if available)
  async getDeviceSensorData() {
    const sensorData = {
      timestamp: Date.now(),
      audio: await this.getAudioData(),
      accelerometer: await this.getAccelerometerData(),
      heartRate: await this.getHeartRateData(),
      location: await this.getLocationData()
    };

    return sensorData;
  }

  // Audio data from microphone
  async getAudioData() {
    try {
      // In a real implementation, this would analyze microphone input
      // For now, return simulated data
      return {
        volume: 35 + Math.random() * 15,
        screamDetected: false,
        confidence: 0.1 + Math.random() * 0.2,
        gunShotDetected: false,
        gunShotConfidence: 0.05 + Math.random() * 0.1
      };
    } catch (error) {
      console.error('Audio sensor error:', error);
      return null;
    }
  }

  // Accelerometer data from device
  async getAccelerometerData() {
    try {
      if ('DeviceMotionEvent' in window) {
        return new Promise((resolve) => {
          const handler = (event) => {
            window.removeEventListener('devicemotion', handler);
            const accel = event.accelerationIncludingGravity;
            const magnitude = Math.sqrt(
              accel.x * accel.x + accel.y * accel.y + accel.z * accel.z
            );
            
            resolve({
              x: accel.x,
              y: accel.y,
              z: accel.z,
              magnitude,
              fallDetected: magnitude > 20
            });
          };
          
          window.addEventListener('devicemotion', handler);
          
          // Fallback after 1 second
          setTimeout(() => {
            window.removeEventListener('devicemotion', handler);
            resolve({
              x: -0.5 + Math.random(),
              y: -0.5 + Math.random(),
              z: 9.8 + Math.random() * 0.5,
              magnitude: Math.random() * 2,
              fallDetected: false
            });
          }, 1000);
        });
      } else {
        // Fallback for non-mobile devices
        return {
          x: -0.5 + Math.random(),
          y: -0.5 + Math.random(),
          z: 9.8 + Math.random() * 0.5,
          magnitude: Math.random() * 2,
          fallDetected: false
        };
      }
    } catch (error) {
      console.error('Accelerometer sensor error:', error);
      return null;
    }
  }

  // Heart rate data (simulated - would need wearable integration)
  async getHeartRateData() {
    try {
      // In reality, this would connect to a fitness tracker or smartwatch
      return {
        current: 70 + Math.random() * 20,
        trend: 'stable'
      };
    } catch (error) {
      console.error('Heart rate sensor error:', error);
      return null;
    }
  }

  // Location data from GPS
  async getLocationData() {
    try {
      if ('geolocation' in navigator) {
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy
              });
            },
            (error) => {
              console.error('Location error:', error);
              // Fallback location
              resolve({
                latitude: 12.9716 + (Math.random() - 0.5) * 0.001,
                longitude: 77.5946 + (Math.random() - 0.5) * 0.001,
                accuracy: 10
              });
            },
            { enableHighAccuracy: true, timeout: 5000 }
          );
        });
      } else {
        // Fallback location
        return {
          latitude: 12.9716 + (Math.random() - 0.5) * 0.001,
          longitude: 77.5946 + (Math.random() - 0.5) * 0.001,
          accuracy: 10
        };
      }
    } catch (error) {
      console.error('Location sensor error:', error);
      return null;
    }
  }
}

// Export singleton instance
const sensorSimulator = new SensorSimulator();
export default sensorSimulator;
