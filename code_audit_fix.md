# Selokong Farms - Code Audit Report
**Date:** January 20, 2026

---

## Executive Summary

This audit identified **11 critical issues**, **8 high-severity issues**, and **15 medium-severity issues** across the codebase. The application has good architectural patterns but requires attention to security, type safety, error handling, and data validation.

---

## 🔴 CRITICAL ISSUES

### 1. **Logic Error in User Update - Server.js (Line 1249)**
**Severity:** CRITICAL  
**File:** [src/Application_backend/Server.js](src/Application_backend/Server.js#L1249)  
**Issue:** Incorrect comparison operator in conditional check.

```javascript
if (existingUser.rows.length < 0) {  // ❌ WRONG: length can never be < 0
    return res.status(404).json({ error: 'User not found' });
}
```

**Impact:** This condition will never execute, allowing invalid updates to proceed.

**Fix:**
```javascript
if (existingUser.rows.length === 0) {  // ✅ CORRECT
    return res.status(404).json({ error: 'User not found' });
}
```

---

### 2. **Hardcoded Credentials in Database Connection - DB.js**
**Severity:** CRITICAL  
**File:** [src/Application_backend/DB.js](src/Application_backend/DB.js#L10-L18)  
**Issue:** Database password hardcoded in source code.

```javascript
password: process.env.PG_PASSWORD || 'Password123',  // ❌ Exposed in code
```

**Impact:** Security breach if code is exposed. Credentials are visible in version control history.

**Fix:**
- Remove fallback password entirely
- Require `.env` file with proper secrets management
```javascript
password: process.env.PG_PASSWORD,  // ✅ No fallback
```

---

### 3. **Token Secret Hardcoded in Multiple Places - Server.js**
**Severity:** CRITICAL  
**File:** [src/Application_backend/Server.js](src/Application_backend/Server.js#L36-L45)  
**Issue:** JWT secrets have insecure fallback values.

```javascript
jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {  // ❌
```

**Impact:** Anyone reading the code knows the fallback secret, compromising all JWTs.

**Fix:**
```javascript
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET not configured');
jwt.verify(token, JWT_SECRET, (err, user) => {  // ✅
```

---

### 4. **Race Condition in Address Default Setting - Server.js (Line 1120)**
**Severity:** CRITICAL  
**File:** [src/Application_backend/Server.js](src/Application_backend/Server.js#L1120-L1150)  
**Issue:** Two separate database calls without proper locking can cause race conditions.

```javascript
// If user sets as default, unset others
if (is_default) {
    await client.query(
        'UPDATE addresses SET is_default = FALSE WHERE user_id = $1',
        [req.user.user_id]
    );
}
// Then update current address
const result = await client.query(`UPDATE addresses...`);
```

**Impact:** Two addresses could become default simultaneously if requests are made quickly.

**Fix:** Use a single atomic query or database trigger. **Pin**

---

### 5. **Missing Input Validation on Order Creation - Server.js (Line 781)**
**Severity:** CRITICAL  
**File:** [src/Application_backend/Server.js](src/Application_backend/Server.js#L781-L830)  
**Issue:** No validation of cart items, quantities, or prices before creating order.

```javascript
const { items, delivery_address, payment_method, subtotal, delivery_fee, total_amount } = req.body;
// ❌ No validation that items exist in inventory or prices match
```

**Impact:** Users could order invalid quantities, manipulate prices, or non-existent items.

**Fix:** Validate each item against database:
```typescript
for (const item of items) {
  const product = await client.query('SELECT stock_quantity, price FROM products WHERE product_id = $1', [item.product_id]);
  if (!product.rows[0]) throw new Error('Product not found');
  if (product.rows[0].stock_quantity < item.quantity) throw new Error('Insufficient stock');
  if (product.rows[0].price !== item.price) throw new Error('Price mismatch');
}
```

---

### 6. **Unauthenticated Public Endpoints Using Global State - page.tsx (Line 30)**
**Severity:** CRITICAL  
**File:** [src/app/page.tsx](src/app/page.tsx#L30-L40)  
**Issue:** API call with hardcoded localhost, no error handling, missing CORS config.

```typescript
useEffect(() => {
  async function fetchProducts() {
    try {
      const response = await fetch('http://localhost:4000/api/products');  // ❌ Hardcoded
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);  // Silent failure
    }
  }
  fetchProducts();
}, []);
```

**Impact:** 
- Breaks in production (localhost won't exist)
- No error display to user
- Works in dev but fails in deployment

**Fix:**
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
useEffect(() => {
  async function fetchProducts() {
    try {
      const response = await fetch(`${API_URL}/api/products`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products');  // Show to user
    }
  }
  fetchProducts();
}, []);
```

---

### 7. **Type Safety Violations with `any` Type - Multiple Files**
**Severity:** CRITICAL  
**Files:** 
- [src/context/authContext.tsx](src/context/authContext.tsx#L20)
- [src/context/CartContext.tsx](src/context/CartContext.tsx#L10)
- [src/services/adminService.ts](src/services/adminService.ts#L50)

**Issue:** Excessive use of `any` type defeats TypeScript's type safety.

```typescript
register: (userData: any) => Promise<void>;  // ❌ Any type
const addToCart = async (product: any, quantity: number) => {  // ❌
```

**Impact:** Runtime errors that TypeScript should have caught at compile time.

**Fix:**
```typescript
interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
}

register: (userData: RegisterData) => Promise<void>;  // ✅
```
**PIN**
---

### 8. **No JWT Expiration Handling - checkout/page.tsx**
**Severity:** CRITICAL  
**File:** [src/app/checkout/page.tsx](src/app/checkout/page.tsx#L200)  
**Issue:** Uses token without checking expiration; requests will fail silently.

```typescript
const token = authService.getToken();
if (!token) {
  setIsLoadingAddresses(false);
  return;
}

const response = await fetch(`${API_URL}/addresses`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
// No handling for 401 (expired token)
```

**Impact:** Users see broken UI without understanding why; need to manually refresh.

**Fix:**
```typescript
if (!response.ok) {
  if (response.status === 401) {
    // Token expired, attempt refresh
    try {
      await authService.refreshToken();
      // Retry request
    } catch {
      router.push('/login');
      return;
    }
  }
}
```

---

### 9. **Deprecated localStorage for Auth Tokens - AuthForm.tsx & AccountDropdown.tsx**
**Severity:** CRITICAL  
**Files:** [src/app/AccountDropdown.tsx](src/app/AccountDropdown.tsx#L26-L30)  
**Issue:** Mixed storage systems (localStorage vs sessionStorage) with XSS vulnerability.

```typescript
const token = localStorage.getItem("token");  // ❌ localStorage is XSS vulnerable
```

But [authService.ts](src/services/authService.ts#L36) uses `sessionStorage` (more secure).

**Impact:** Inconsistent auth state; XSS can steal tokens from localStorage.

**Fix:** Standardize on httpOnly cookies or consistent sessionStorage.

---

### 10. **Admin Query Injection Risk - Server.js (Line 390)**
**Severity:** CRITICAL  
**File:** [src/Application_backend/Server.js](src/Application_backend/Server.js#L386-L393)  
**Issue:** Sort column is validated but directly interpolated into query string.

```javascript
const validSortColumns = ['created_at', 'price', 'name', 'rating'];
const sortColumn = validSortColumns.includes(sort) ? sort : 'created_at';
query += ` ORDER BY p.${sortColumn} ${sortOrder}`;  // ⚠️ Direct interpolation
```

While validation helps, this is still considered unsafe practice.

**Fix:** Use parameterized approach or prepared statements consistently.

---

### 11. **Uncaught Promise Rejection in CartContext - CartContext.tsx (Line 100)**
**Severity:** CRITICAL  
**File:** [src/context/CartContext.tsx](src/context/CartContext.tsx#L95-L110)  
**Issue:** Promise not awaited, can leave cart in inconsistent state.

```typescript
const addToCart = async (product: any, quantity: number) => {
  // ... fetch call
  // No await, no error handling for network failures
  loadCart();  // This might execute before API call completes
};
```

**Impact:** Cart UI shows wrong state; items might not actually be added to database.

---

## 🟠 HIGH-SEVERITY ISSUES

### 1. **Missing Stock Validation Before Adding to Cart - cart.ts**
**Severity:** HIGH  
**File:** [src/app/utils/cart.ts](src/app/utils/cart.ts)  
**Issue:** Quantities aren't validated against available stock.

**Fix:** Add validation:
```typescript
if (quantity > item.stock_quantity) {
  throw new Error('Insufficient stock');
}
```

---

### 2. **No Error Boundary for Admin Panel - admin/page.tsx**
**Severity:** HIGH  
**File:** [src/app/admin/page.tsx](src/app/admin/page.tsx)  
**Issue:** No Error Boundary component; crashes take down entire admin interface.

**Fix:** Implement React Error Boundary.

---

### 3. **Unhandled Async Operations in useEffect - cart.ts (Line 60)**
**Severity:** HIGH  
**File:** [src/app/utils/cart.ts](src/app/utils/cart.ts)  
**Issue:** Event listener for 'cartUpdated' but no corresponding trigger.

```typescript
window.addEventListener('cartUpdated', handleCartUpdate);
```

No code actually dispatches this event.

**Fix:** Either remove or implement proper event dispatching.

---

### 4. **Missing CSRF Protection - Server.js**
**Severity:** HIGH  
**Issue:** No CSRF token validation on state-changing operations.

**Fix:** Implement CSRF middleware:
```javascript
const csrf = require('csurf');
app.use(csrf({ cookie: false, sessionKey: 'session' }));
```

---

### 5. **Disabled SSL Certificate Validation - DB.js (Line 18)**
**Severity:** HIGH  
**File:** [src/Application_backend/DB.js](src/Application_backend/DB.js#L18)  
**Issue:** `rejectUnauthorized: false` disables SSL verification.

```javascript
ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false  // ❌
```

**Impact:** Vulnerable to MITM attacks.

**Fix:**
```javascript
ssl: process.env.PG_SSL === 'true'  // ✅ or properly configured with certs
```

---

### 6. **No Rate Limiting - Server.js**
**Severity:** HIGH  
**Issue:** API endpoints have no rate limiting; vulnerable to brute force attacks.

**Fix:** Implement rate limiting:
```javascript
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);
```

---

### 7. **No Input Sanitization - Server.js (Line 360)**
**Severity:** HIGH  
**Issue:** Search input not sanitized; potential for NoSQL/SQL injection via ILIKE.

**Fix:** Validate and sanitize search input:
```javascript
if (search && typeof search !== 'string') {
  return res.status(400).json({ error: 'Invalid search' });
}
```

---

### 8. **Sensitive Data in Console Logs - Multiple Files**
**Severity:** HIGH  
**Files:** 
- [src/Application_backend/Server.js](src/Application_backend/Server.js#L202)
- [src/services/adminService.ts](src/services/adminService.ts#L120)

**Issue:** User data and sensitive info logged to console.

```javascript
console.log("User logged in:", user);  // ❌ Logs sensitive data
```

**Impact:** Exposed in server logs; security audit trail compromised.

---

## 🟡 MEDIUM-SEVERITY ISSUES

### 1. **Missing Null Checks in CartContext**
File: [src/context/CartContext.tsx](src/context/CartContext.tsx#L44-L50)  
Items can be null after filtering; should validate before rendering.

### 2. **No Pagination on Admin Orders View**
File: [src/services/adminService.ts](src/services/adminService.ts#L75)  
Could load thousands of records; memory leak risk.

### 3. **Hardcoded API URLs**
Multiple files use hardcoded `http://localhost:4000`  
Should use environment variable consistently.

### 4. **No Retry Logic for Failed API Calls**
Cart and checkout operations fail silently without retry.

### 5. **Missing Phone Number Validation**
File: [src/app/components/AuthForm.tsx](src/app/components/AuthForm.tsx#L82)  
Phone field accepts any string; should validate format.

### 6. **No Transaction Rollback on Partial Order Creation Failure**
File: [src/Application_backend/Server.js](src/Application_backend/Server.js#L820)  
Stock is decremented but order_items might not be created.

### 7. **Missing Email Validation**
Registration doesn't validate email format server-side.

### 8. **No Request Size Limits**
Server accepts unlimited request body size; DOS vulnerability.

```javascript
app.use(bodyParser.json());  // ❌ No size limit
// Should be:
app.use(bodyParser.json({ limit: '10mb' }));  // ✅
```

### 9. **Cart Items Not Validated on Checkout**
Could order items that are no longer in stock.

### 10. **No Loading State for Address Form**
Users don't see loading spinner while addresses load.

### 11. **Mock Data in Production Code**
File: [src/services/adminService.ts](src/services/adminService.ts#L40)  
Fallback mock data returns fake statistics.

### 12. **No Timeout for API Requests**
Fetch calls have no timeout; could hang indefinitely.

### 13. **Insufficient Logging**
No structured logging; hard to debug production issues.

### 14. **No Database Connection Pooling Configuration**
Uses default pool settings; could exhaust connections.

### 15. **No Admin Activity Logging**
Admin actions aren't logged for audit trail.

---

## 🟢 RECOMMENDATIONS

### Immediate Actions (This Week)
1. ✅ Fix logic error in user update (Issue #1)
2. ✅ Remove hardcoded credentials (Issues #2, #3)
3. ✅ Add input validation for orders (Issue #5)
4. ✅ Implement token expiration handling

### Short-term (Next 2 Weeks)
1. Replace `any` types with proper interfaces
2. Add Rate Limiting middleware
3. Implement Error Boundaries
4. Add request size limits
5. Standardize localStorage/sessionStorage usage
6. Remove sensitive data from console logs

### Medium-term (Next Month)
1. Implement CSRF protection
2. Add request timeouts
3. Set up structured logging
4. Add email verification
5. Implement admin activity logging
6. Add phone validation

### Long-term (Next Quarter)
1. Migrate to TypeScript strict mode
2. Add comprehensive test coverage
3. Implement API documentation (OpenAPI/Swagger)
4. Set up CI/CD with security scanning
5. Add monitoring and alerting
6. Implement feature flags

---

## Security Audit Checklist

- ❌ HTTPS/TLS enforcement: Not enforced in dev config
- ❌ CORS configuration: Allows all origins (`app.use(cors())`)
- ❌ Authentication: JWT with short expiration, but no refresh handling in UI
- ❌ Authorization: Role-based access control present but not comprehensive
- ❌ Input Validation: Inconsistent across endpoints
- ❌ Rate Limiting: Not implemented
- ❌ Logging: No structured logging or audit trail
- ❌ Secrets Management: Hardcoded fallbacks
- ❌ Dependencies: npm audit should be run regularly
- ❌ OWASP Top 10: Multiple issues present (A1, A2, A3, A7, A8, A9)

---

## Files Requiring Immediate Attention

1. **src/Application_backend/Server.js** - Multiple security issues
2. **src/Application_backend/DB.js** - Credentials exposure
3. **src/app/checkout/page.tsx** - Missing error handling
4. **src/context/CartContext.tsx** - Type safety and async issues
5. **src/services/authService.ts** - Token management
6. **src/app/components/AuthForm.tsx** - Input validation

---

## Testing Recommendations

1. **Unit Tests:** Needed for auth, cart, and order services
2. **Integration Tests:** Test API endpoints with various inputs
3. **E2E Tests:** Complete user flows (signup → browse → checkout)
4. **Security Tests:** SQL injection, XSS, CSRF attempts
5. **Load Tests:** Check behavior under high traffic

---

## Conclusion

The application has a solid foundation with good separation of concerns and context API usage. However, security hardening is critical before production deployment. Focus on fixing critical issues first, then address high-severity items within two weeks.

**Overall Risk Level: 🔴 HIGH**

Estimated effort to address all issues: **40-60 hours**

---

*Report generated: January 20, 2026*
*Auditor: Code Review System*
