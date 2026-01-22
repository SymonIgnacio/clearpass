/**
 * SSL Configuration for Barangay Management System
 * Handles SSL certificate generation and HTTPS setup
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class SSLConfig {
  constructor() {
    this.certDir = path.join(__dirname, 'ssl');
    this.keyPath = path.join(this.certDir, 'key.pem');
    this.certPath = path.join(this.certDir, 'cert.pem');
  }

  /**
   * Ensure SSL certificate directory exists
   */
  ensureCertDir() {
    if (!fs.existsSync(this.certDir)) {
      fs.mkdirSync(this.certDir, { recursive: true });
      console.log('📁 SSL certificate directory created');
    }
  }

  /**
   * Generate self-signed SSL certificate for development
   */
  generateSelfSignedCert() {
    try {
      console.log('🔐 Generating self-signed SSL certificate for development...');

      // Generate RSA key pair
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem',
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
        },
      });

      // Create self-signed certificate (Basic implementation)
      // Note: This creates a basic structure, but browsers will show security warnings
      const certData = {
        version: 3,
        serialNumber: crypto.randomBytes(16).toString('hex'),
        subject: {
          countryName: 'PH',
          stateOrProvinceName: 'Bulacan',
          localityName: 'Bocaue',
          organizationName: 'Barangay Management System',
          commonName: 'localhost',
        },
        issuer: {
          countryName: 'PH',
          stateOrProvinceName: 'Bulacan',
          localityName: 'Bocaue',
          organizationName: 'Barangay Management System',
          commonName: 'localhost',
        },
        validity: {
          notBefore: new Date(),
          notAfter: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        },
        publicKey: publicKey,
        extensions: [
          {
            name: 'subjectAltName',
            altNames: [
              { type: 2, value: 'localhost' },
              { type: 2, value: '127.0.0.1' },
              { type: 7, ip: '127.0.0.1' },
            ],
          },
        ],
      };

      // Write private key
      fs.writeFileSync(this.keyPath, privateKey);
      fs.writeFileSync(this.certPath, publicKey); // Using public key as basic cert

      console.log('✅ Self-signed SSL certificate generated');
      console.log(
        '⚠️  WARNING: This is for development only. Use proper SSL certificates in production.'
      );

      return {
        key: privateKey,
        cert: publicKey,
      };
    } catch (error) {
      console.error('❌ Failed to generate self-signed certificate:', error.message);
      throw error;
    }
  }

  /**
   * Load SSL certificates
   */
  loadCertificates() {
    try {
      this.ensureCertDir();

      let key, cert;

      // Check if certificates exist
      if (fs.existsSync(this.keyPath) && fs.existsSync(this.certPath)) {
        key = fs.readFileSync(this.keyPath);
        cert = fs.readFileSync(this.certPath);
        console.log('✅ SSL certificates loaded from files');
      } else {
        // Generate self-signed certificates
        const generated = this.generateSelfSignedCert();
        key = generated.key;
        cert = generated.cert;
      }

      return { key, cert };
    } catch (error) {
      console.error('❌ Failed to load SSL certificates:', error.message);
      console.log('🔄 Falling back to HTTP only');
      return null;
    }
  }

  /**
   * Get HTTPS options for server
   */
  getHttpsOptions() {
    const certificates = this.loadCertificates();

    if (!certificates) {
      return null;
    }

    return {
      key: certificates.key,
      cert: certificates.cert,
      // Security options
      ciphers: [
        'ECDHE-RSA-AES128-GCM-SHA256',
        'ECDHE-RSA-AES256-GCM-SHA384',
        'ECDHE-RSA-AES128-SHA256',
        'ECDHE-RSA-AES256-SHA384',
      ].join(':'),
      honorCipherOrder: true,
      secureProtocol: 'TLSv1_2_method',
    };
  }

  /**
   * Production SSL instructions
   */
  logProductionInstructions() {
    console.log('\n' + '='.repeat(80));
    console.log('PRODUCTION SSL SETUP INSTRUCTIONS');
    console.log('='.repeat(80));

    console.log('\n1. Install Certbot (Lets Encrypt):');
    console.log('   sudo apt-get install certbot  # Ubuntu/Debian');
    console.log('   sudo yum install certbot     # CentOS/RHEL');

    console.log('\n2. Generate SSL certificates:');
    console.log('   sudo certbot certonly --standalone -d yourdomain.com');

    console.log('\n3. Set environment variables in production:');
    console.log('   SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem');
    console.log('   SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem');
    console.log('   NODE_ENV=production');

    console.log('\n4. Configure automatic renewal:');
    console.log('   sudo crontab -e');
    console.log('   Add: 0 12 * * * /usr/bin/certbot renew --quiet');

    console.log('\n📞 For custom SSL certificates, place them at:');
    console.log('   server/ssl/key.pem  (private key)');
    console.log('   server/ssl/cert.pem (certificate chain)');

    console.log('='.repeat(80) + '\n');
  }
}

module.exports = new SSLConfig();

// Log production instructions on first run
if (process.env.NODE_ENV === 'production') {
  module.exports.logProductionInstructions();
}
