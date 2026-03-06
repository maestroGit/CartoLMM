# Production Balance Endpoint Fix - Action Checklist
**CRITICAL PRIORITY** - Balance queries failing in deployed CartoLMM

## TL;DR - What's Wrong?
Production CartoLMM has wrong API URL in `.env`:
```env
BLOCKCHAIN_API_URL=http://localhost:6001  # ❌ WRONG
```

Should be:
```env
BLOCKCHAIN_API_URL=https://app.blockswine.com  # ✅ CORRECT
```

---

## 🚀 IMMEDIATE ACTION (5 minutes)

### Step 1: SSH into Production Server
```bash
ssh user@production-cartoLMM-domain
cd /path/to/CartoLMM
```

### Step 2: Check Current Configuration
```bash
# Show current BLOCKCHAIN_API_URL
grep BLOCKCHAIN_API_URL .env
```

Expected output (WRONG):
```
BLOCKCHAIN_API_URL=http://localhost:6001
```

### Step 3: One-Line Fix
Option A - Using sed (Linux/Mac):
```bash
# Backup first
cp .env .env.backup

# Fix the URL
sed -i 's|^BLOCKCHAIN_API_URL=.*|BLOCKCHAIN_API_URL=https://app.blockswine.com|' .env

# Verify
grep BLOCKCHAIN_API_URL .env
```

Option B - Manual edit (Windows or if sed fails):
```bash
# Open editor
nano .env  # or vim, or your preferred editor

# Find: BLOCKCHAIN_API_URL=http://localhost:6001
# Replace: BLOCKCHAIN_API_URL=https://app.blockswine.com
# Save and exit
```

### Step 4: Restart CartoLMM Server
```bash
# If using pm2:
pm2 restart cartoLMM

# OR if using npm:
npm run dev
# (Kill current process with Ctrl+C first)
```

### Step 5: Verify Fix (30 seconds)
```bash
# Test endpoint directly
curl "https://your-domain.com/api/balance?address=04ba6200f"

# Expected: JSON response with balance (not 0 or error)
# Look for: "balance": XXXX, "source": "magnumsmaster-relay"
```

Check logs:
```bash
# Tail logs - you should see SUCCESS
pm2 logs cartoLMM | grep -i balance

# Expected output:
# ✅ [Balance] Respuesta exitosa desde magnumsmaster (relay)
# 📊 [Balance] Datos recibidos: { balance: XXXX, ...}
```

---

## 📋 VERIFICATION CHECKLIST

After making the fix, verify each item:

- [ ] `.env` file has `BLOCKCHAIN_API_URL=https://app.blockswine.com`
- [ ] `.env` file has `BLOCKCHAIN_LOCAL_URL=http://localhost:6001` (unchanged)
- [ ] CartoLMM server has been restarted
- [ ] Logs show: `✅ [Balance] Respuesta exitosa desde magnumsmaster`
- [ ] Balance endpoint returns numeric value (not 0 or `-`)
- [ ] Frontend displays balance correctly (not zero)

---

## 🔧 IF ENDPOINTS STILL FAIL (Advanced Troubleshooting)

If balance still returns 0 after URL fix, it might be an **authentication issue**:

### Step A: Test Endpoint Directly
```bash
# Test if endpoint is public (no auth)
curl "https://app.blockswine.com/utxo-balance/04ba..."

# If you get 401 Unauthorized: endpoint requires auth
# If you get error about missing wallet: endpoint is public but address not found
```

### Step B: Check magnusmasterAPI Client

Edit `src/api/magnusmasterAPI.js`, find `makeRequest()` method around line 94:

**Current (no credentials)**:
```javascript
const response = await fetch(url, {
  method: options.method || 'GET',
  headers: { 'Content-Type': 'application/json' },
  ...options
});
```

**Add credentials**:
```javascript
const response = await fetch(url, {
  method: options.method || 'GET',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',  // ← ADD THIS LINE
  ...options
});
```

Then restart: `pm2 restart cartoLMM`

### Step C: Check Endpoint Protection

In magnumsmaster, verify if endpoint requires auth:
```bash
# On magnumsmaster server
grep -n "getUTXOBalanceByAddress\|/utxo-balance" app/routes/*.js
```

Should show if endpoint has `requireAuth` middleware.

---

## 📚 Related Documentation

- **Full Diagnosis**: `docs/BALANCE-ENDPOINT-DIAGNOSIS.md`
- **Session Summary**: `docs/SESSION-SUMMARY.md`  
- **Automated Script**: `scripts/fix-balance-endpoint.sh`

---

## ⏱️ Expected Timeline

| Task | Time | Status |
|------|------|--------|
| SSH to production | 1 min | |
| Fix .env URL | 1 min | |
| Restart server | 1 min | |
| Manual verification | 2 min | |
| **TOTAL** | **~5 min** | |

---

## 📞 Questions?

If fix doesn't work:
1. Check magnumsmaster is running at `https://app.blockswine.com`
2. Verify network connectivity from production server to relay
3. Check if endpoints require API key or session auth
4. See `docs/BALANCE-ENDPOINT-DIAGNOSIS.md` for detailed troubleshooting

---

## 🔔 After Production Fix

Once balance endpoint is working:
1. ✅ Update team that balance queries are restored
2. ✅ Monitor logs for any recurrence: `pm2 logs cartoLMM | grep -i balance`
3. ⚠️ Consider if fallback to magnumslocal should be disabled in production
4. 📋 Test metrics display with `?debugMetrics=1` (separate issue)

---

Generated: Session fix documentation  
Priority: CRITICAL  
Action: URGENT - Production is broken
