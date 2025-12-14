/**
 * Security Alerting System for Barangay Management System
 * Monitors for security events and sends alerts
 */

const { logger } = require('./monitoring');

class SecurityAlertManager {
  constructor() {
    this.alertThresholds = {
      failedLogins: 5, // Alert after 5 failed login attempts
      suspiciousRequests: 10, // Alert after 10 suspicious requests per minute
      certificateBlocks: 3, // Alert for blocked certificate issuances
      largeFileUploads: 50 * 1024 * 1024, // Alert for files > 50MB
      highErrorRate: 0.1 // Alert for > 10% error rate
    };

    this.alertHistory = [];
    this.alertCooldown = 5 * 60 * 1000; // 5 minutes cooldown between duplicate alerts

    // Initialize tracking maps
    this.failedLoginAttempts = new Map();
    this.suspiciousRequests = new Map();
  }

  /**
   * Send security alert
   */
  sendAlert(severity, type, details) {
    const alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      severity, // 'low', 'medium', 'high', 'critical'
      type, // 'login_attempts', 'suspicious_activity', 'certificate_block', etc.
      details,
      acknowledged: false
    };

    // Check for duplicate alerts within cooldown period
    const recentAlert = this.alertHistory.find(a =>
      a.type === type &&
      a.severity === severity &&
      (Date.now() - new Date(a.timestamp).getTime()) < this.alertCooldown
    );

    if (recentAlert) {
      logger.warn('Alert suppressed (duplicate)', { type, severity });
      return;
    }

    this.alertHistory.push(alert);

    // Keep only last 100 alerts
    if (this.alertHistory.length > 100) {
      this.alertHistory = this.alertHistory.slice(-100);
    }

    // Log the alert
    logger.error('SECURITY ALERT', alert);

    // In production, this would integrate with:
    // - Email notifications (Nodemailer)
    // - SMS alerts (Twilio/Semaphore)
    // - Slack/Discord webhooks
    // - SIEM systems (Splunk, ELK Stack)
    // - Incident management systems (PagerDuty, Opsgenie)

    console.log(`🚨 [${severity.toUpperCase()}] Security Alert: ${type}`);
    console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
  }

  /**
   * Monitor failed login attempts
   */
  trackFailedLogin(ip, username, reason = 'invalid_credentials') {
    // In a real implementation, this would use a cache/database to track
    const key = `failed_login_${ip}_${username}`;

    // Simple in-memory tracking for demo
    if (this.failedLoginAttempts[key]) {
      this.failedLoginAttempts[key]++;
    } else {
      this.failedLoginAttempts[key] = 1;
    }

    if (this.failedLoginAttempts[key] >= this.alertThresholds.failedLogins) {
      this.sendAlert('high', 'multiple_failed_logins', {
        ip,
        username,
        attempts: this.failedLoginAttempts[key],
        lastReason: reason,
        message: `Multiple failed login attempts detected for user: ${username}`
      });
    }
  }

  /**
   * Monitor suspicious requests
   */
  trackSuspiciousRequest(ip, url, reason = 'suspicious_pattern') {
    const key = `suspicious_${ip}`;

    if (this.suspiciousRequests[key]) {
      this.suspiciousRequests[key]++;
    } else {
      this.suspiciousRequests[key] = 1;
    }

    if (this.suspiciousRequests[key] >= this.alertThresholds.suspiciousRequests) {
      this.sendAlert('medium', 'suspicious_activity', {
        ip,
        url,
        requests: this.suspiciousRequests[key],
        reason,
        message: `High volume of suspicious requests from IP: ${ip}`
      });
    }
  }

  /**
   * Monitor certificate issuance blocks
   */
  trackCertificateBlock(residentId, certificateType, reason) {
    this.sendAlert('medium', 'certificate_issuance_blocked', {
      residentId,
      certificateType,
      reason,
      message: `Certificate issuance blocked for security reasons`
    });
  }

  /**
   * Monitor large file uploads
   */
  checkFileUpload(fileSize, fileName, uploader) {
    if (fileSize > this.alertThresholds.largeFileUploads) {
      this.sendAlert('low', 'large_file_upload', {
        fileName,
        fileSize,
        uploader,
        message: `Large file upload detected`
      });
    }
  }

  /**
   * Monitor application performance
   */
  checkErrorRate(currentErrorRate, totalRequests) {
    if (currentErrorRate > this.alertThresholds.highErrorRate && totalRequests > 10) {
      this.sendAlert('high', 'high_error_rate', {
        errorRate: currentErrorRate,
        totalRequests,
        message: `Application experiencing high error rate: ${(currentErrorRate * 100).toFixed(1)}%`
      });
    }
  }

  /**
   * Get recent alerts for dashboard
   */
  getRecentAlerts(limit = 10) {
    return this.alertHistory
      .slice(-limit)
      .reverse()
      .map(alert => ({
        id: alert.id,
        timestamp: alert.timestamp,
        severity: alert.severity,
        type: alert.type,
        message: alert.details.message,
        acknowledged: alert.acknowledged
      }));
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId) {
    const alert = this.alertHistory.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      logger.info('Alert acknowledged', { alertId });
      return true;
    }
    return false;
  }
}

// Initialize the alert manager
const alertManager = new SecurityAlertManager();

// Clean up old alert data periodically
setInterval(() => {
  const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // Keep 7 days
  alertManager.alertHistory = alertManager.alertHistory.filter(
    alert => new Date(alert.timestamp).getTime() > cutoffTime
  );
}, 60 * 60 * 1000); // Clean up hourly

module.exports = alertManager;
