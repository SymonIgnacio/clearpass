# CORS Configuration

## Current Status: PERMISSIVE (Needs Tightening)

### Production Configuration

**Allowed Origins:**
- Specific Netlify domains only
- No wildcard origins in production

**Allowed Methods:**
- GET, POST, PUT, DELETE, PATCH, OPTIONS

**Allowed Headers:**
- Content-Type
- Authorization
- X-Requested-With

**Credentials:**
- Enabled (required for JWT cookies)

### Development Configuration

**Allowed Origins:**
- http://localhost:5173
- http://localhost:5174
- http://localhost:3000
- http://127.0.0.1:5173
- http://127.0.0.1:5174

### Security Recommendations

1. **Remove Wildcard Origins**
   - Never use `origin: '*'` in production
   - Explicitly list all allowed domains

2. **Implement Origin Validation**
   - Validate origin against whitelist
   - Log rejected CORS requests

3. **Restrict Methods**
   - Only allow necessary HTTP methods
   - Remove OPTIONS if not needed

4. **Limit Headers**
   - Only allow required headers
   - Remove custom headers if unused

5. **Set Max Age**
   - Cache preflight requests
   - Reduce OPTIONS overhead

### Implementation

```javascript
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      'https://stalwart-sorbet-d70d32.netlify.app',
      'https://glistening-lamington-a9e2b7.netlify.app'
    ]
  : [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000'
    ];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
}));
```

### Monitoring

- Log all CORS rejections
- Monitor for unauthorized access attempts
- Review allowed origins quarterly
