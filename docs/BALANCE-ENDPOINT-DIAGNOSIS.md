# Balance Endpoint Failure Diagnosis
**Date**: 2024  
**Status**: DIAGNOSED - Root cause identified  
**Severity**: HIGH - Blocks balance queries in production  

## Executive Summary

**The problem is NOT authentication directly**, but rather **two composite issues**:

1. **Wrong API URL in production environment** - CartoLMM production is configured to use `http://localhost:6001` as primary API, but magnumsmaster relay is at `https://app.blockswine.com`
2. **Missing credentials in fallback requests** - If magnumsmaster endpoint requires authentication, requests fail silently

## Root Cause Analysis

### Problem 1: Incorrect BLOCKCHAIN_API_URL

**Current State (WRONG)**:
```bash
# Production .env
BLOCKCHAIN_API_URL=http://localhost:6001
BLOCKCHAIN_LOCAL_URL=http://localhost:6001
```

**What Should Be**:
```bash
# Production .env
BLOCKCHAIN_API_URL=https://app.blockswine.com
BLOCKCHAIN_LOCAL_URL=http://localhost:6001
```

**Impact**:
- CartoLMM tries to fetch balance from `http://localhost:6001` (doesn't exist on production server)
- Fails silently after 3 retries
- Falls back to `magnumslocal` at `http://localhost:6001` (also doesn't exist)
- User sees balance = 0 with warning

**How This Happens**:
1. `routes.js` line 13: `const magnusmasterClient = new MagnusmasterAPI(config.blockchainApiUrl);`
2. `config.js` line 27: `blockchainApiUrl: process.env.BLOCKCHAIN_API_URL || 'https://app.blockswine.com'`
3. `.env` file override: `BLOCKCHAIN_API_URL=http://localhost:6001` ← WRONG VALUE

### Problem 2: Authentication Requirements on Blockchain Endpoints

**Endpoint Analysis**:

- `/utxo-balance/:address` route in `magnumsmaster` requires:
  ```javascript
  router.get('/:address', 
    requireAuth,                              // ← Requires logged-in user
    requireRole('admin', 'winery'),           // ← Requires role
    requireGlobalWalletOwnership,              // ← Requires wallet ownership
    getUTXOBalanceByAddress
  );
  ```

- `/wallet/balance` route in `magnumsmaster` also requires:
  ```javascript
  router.get('/balance', 
    requireAuth,                              // ← Requires logged-in user
    requireRole('admin', 'winery'),           // ← Requires role
    requireGlobalWalletOwnership,              // ← Requires wallet ownership
    getBalance
  );
  ```

**Missing Credentials in CartoLMM Client**:
- `magnusmasterAPI.js` makes requests without `credentials: 'include'`
- Current code (line ~55):
  ```javascript
  async makeRequest(endpoint, options = {}) {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: { 'Content-Type': 'application/json' },
      // ❌ Missing: credentials: 'include'
    });
  }
  ```

**Why This Matters**:
- Even if URL is correct, requests to protected endpoints will fail with 401 Unauthorized
- CartoLMM backend doesn't have a user session with magnumsmaster
- Endpoints may need public variant or API key authentication

## Verification Evidence

### Local Version Works
```
✅ [Balance] Respuesta exitosa desde magnumsmaster (relay)
📊 [Balance] Datos recibidos: { balance: 1500, utxosDisponibles: [...] }
```

**Why?** On local dev machine:
- CartoLMM (.env) points to `http://localhost:6001` ✓
- magnumslocal is running on `localhost:6001` ✓
- OR CartoLMM bypasses auth somehow locally

### Production Version Fails
```
⚠️ [Balance] magnumsmaster no disponible. Intentando magnumslocal...
🔄 Intento 1/3 falló para /utxo-balance/04ba62...: request to http://localhost:6001/... failed, reason:
```

**Why?** On production server:
- CartoLMM (.env) points to `http://localhost:6001` (WRONG)
- magnumslocal NOT running on `localhost:6001`
- Result: Connection refused

## Solution

### Step 1: Fix Environment Variable (REQUIRED)
**File**: Production server's `.env` for CartoLMM

**Change**:
```bash
# BEFORE
BLOCKCHAIN_API_URL=http://localhost:6001

# AFTER
BLOCKCHAIN_API_URL=https://app.blockswine.com
```

**Then restart** CartoLMM server:
```bash
npm run dev
# or
pm2 restart CartLMM
```

### Step 2: Add Authentication to MagnusmasterAPI (CONDITIONAL)

**If endpoints require authentication**, update `src/api/magnusmasterAPI.js`:

**Option A** - Add credentials cookie support:
```javascript
async makeRequest(endpoint, options = {}) {
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',  // ← Add this line
    ...options
  });
}
```

**Option B** - Add API key header (if using token auth):
```javascript
async makeRequest(endpoint, options = {}) {
  const apiKey = process.env.BLOCKCHAIN_API_KEY;
  const headers = {
    'Content-Type': 'application/json',
    ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
  };
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    ...options
  });
}
```

### Step 3: Verify magnumsmaster Endpoints Are Public or Have Fallback

**Test from CLI** (on production server):
```bash
# Test if endpoint is public (no auth required)
curl https://app.blockswine.com/utxo-balance/04ba6200f...

# If 401 Unauthorized: endpoint requires auth
# If 200 OK: endpoint is public
```

**Options**:
- **If public**: Update `.env` is sufficient (Step 1 only)
- **If protected**: Need to either:
  - Add API key to `.env` and pass it in headers (Step 2-B)
  - Create public variant of endpoint in magnumsmaster
  - Use session-based auth with CartoLMM backend login

### Step 4: Optional - Disable Fallback in Production

**File**: `src/api/routes.js` line 585-590

**Current behavior**: If magnumsmaster fails, retries magnumslocal

**To disable in production** (add environment check):
```javascript
// Comment out magnumslocal retry in production
const localResponse = 
  process.env.NODE_ENV === 'production' 
    ? { success: false, error: 'Disabled in production' }
    : await magnumslocalClient.getUTXOBalance(address);
```

Or update config to disable fallback:
```bash
# In .env
ENABLE_MAGNUMSLOCAL_FALLBACK=false
```

## Debug Logs

To verify fix is working, you can add these debug environment variables:

```bash
# Enable API request logging
ENABLE_REQUEST_LOGS=true

# Enable blockchain service debug
DEBUG=carriglmm:*
```

Then monitor logs:
```bash
tail -f logs/cartoLMM.log | grep -i balance
```

Expected output after fix:
```
✅ [Balance] Respuesta exitosa desde magnumsmaster (relay)
📊 [Balance] Datos recibidos: { balance: XXXX, utxosDisponibles: [...] }
```

## Files Modified

| File | Change | Priority |
|------|--------|----------|
| `.env` (production) | Fix BLOCKCHAIN_API_URL | **CRITICAL** |
| `src/api/magnusmasterAPI.js` | Add `credentials: 'include'` | Medium (if endpoints require auth) |
| `src/api/routes.js` | Optional disable fallback | Low |

## Testing Checklist

After implementing fixes:

- [ ] Verify `.env` BLOCKCHAIN_API_URL points to `https://app.blockswine.com`
- [ ] Verify CartoLMM server has restarted
- [ ] Test balance endpoint: `curl https://production-cartoLMM/api/balance?address=04ba...`
- [ ] Check logs for success message: `✅ [Balance] Respuesta exitosa desde magnumsmaster`
- [ ] Verify balance displays correctly in frontend (not 0 or `-`)
- [ ] Confirm no 401 Unauthorized errors in logs

## Related Issues

- **Metrics Display**: Separate issue with `/api/dashboard-metrics` - see `docs/METRICS-DEBUG.md`
- **Auth Logout Fix**: Already implemented in `magnumsmaster/public/js/auth-component.js`
- **Image Loading Fix**: Already implemented in `public/list-winery.js`

## Questions to Answer

1. **Is `/utxo-balance/:address` endpoint truly protected in magnumsmaster?**
   - Check actual endpoint in `magnumsmaster/app/routes/utxoRoutes.js`
   - Verify middleware requirements

2. **What authentication method does magnumsmaster use?**
   - Express-session cookies?
   - JWT tokens?
   - API keys?

3. **Does CartoLMM backend need to authenticate with magnumsmaster?**
   - Or does it only aggregate public data?
   - Check `src/services/businessStatsService.js`

4. **Is localhost:6001 available on production server?**
   - Should fallback be disabled entirely?
   - Or only on production environment?

## Next Steps

1. **Immediate**: SSH to production server and verify/fix `.env` file
2. **Verify**: Test `/utxo-balance/:address` endpoint manually
3. **Monitor**: Check logs for success after restart
4. **If still failing**: Implement Step 2 (add authentication to MagnusmasterAPI)
5. **Follow-up**: Decide whether to disable fallback in production
