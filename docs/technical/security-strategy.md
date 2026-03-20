# 🔒 Security Strategy - Rehearsal Scheduler

**Last Updated**: 2026-02-14  
**Status**: Enterprise-Grade, WCAG AAA + SOC 2 Ready  
**Compliance**: WCAG AAA, OWASP Top 10

---

## Table of Contents
1. [Security Architecture](#security-architecture)
2. [Authentication & Authorization](#authentication--authorization)
3. [API Key Management](#api-key-management)
4. [Database Security](#database-security)
5. [Backup & Disaster Recovery](#backup--disaster-recovery)
6. [Incident Response](#incident-response)
7. [Monitoring & Alerts](#monitoring--alerts)
8. [Compliance Checklist](#compliance-checklist)

---

## Security Architecture

### Defense-in-Depth Model

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: Transport Security (TLS 1.3)                       │
│ - All communication encrypted                               │
│ - HSTS headers enforced                                     │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: API Gateway & Rate Limiting                        │
│ - DDoS protection                                           │
│ - Rate limiting (100 req/min per user)                      │
│ - IP whitelisting (optional)                                │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: Authentication (Supabase Auth + JWT)               │
│ - OAuth 2.0 + PKCE flow                                     │
│ - MFA support (optional)                                    │
│ - Session tokens with 1-hour expiry                         │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 4: Authorization (Row-Level Security)                 │
│ - RLS policies on every table                               │
│ - Users only see their own productions                      │
│ - Role-based access (director, sm, actor, crew)             │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 5: Data Layer Security                                │
│ - Encryption at rest (AES-256)                              │
│ - Encrypted columns (sensitive data)                        │
│ - Audit logging on all changes                              │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 6: Infrastructure Security                            │
│ - Supabase managed security                                 │
│ - PostgreSQL hardened config                                │
│ - Automated backups + point-in-time recovery                │
└─────────────────────────────────────────────────────────────┘
```

---

## Authentication & Authorization

### User Roles & Permissions

| Role | Can Create Productions | Can Schedule | Can View All Actors | Can Export Data |
|------|------------------------|--------------|-------------------|-----------------|
| **Director** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Stage Manager** | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| **Actor** | ❌ No | ❌ No | ❌ Own Only | ❌ Own Only |
| **Crew** | ❌ No | ❌ No | ❌ Own Only | ❌ Own Only |
| **Admin** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |

### Authentication Flow

```
1. User enters email/password
   ↓
2. Supabase Auth validates credentials (never stored in our code)
   ↓
3. JWT token issued with 1-hour expiry
   ↓
4. Refresh token stored in httpOnly cookie (secure, inaccessible to JS)
   ↓
5. All API requests include JWT in Authorization header
   ↓
6. Supabase validates JWT on every request
   ↓
7. RLS policies check user_id matches
   ↓
8. Data returned or access denied
```

### Session Management

- **Access Token**: 1 hour expiry (JWT in memory)
- **Refresh Token**: 7 days expiry (httpOnly cookie, auto-renewed)
- **Auto-logout**: After 1 hour of inactivity
- **Force Logout**: Admin can revoke sessions immediately
- **MFA**: Optional per-user, enforced for admins

---

## API Key Management

### Key Types & Permissions

#### 1. **Anonymous Key** (Safe to commit)
- Used by frontend for public operations
- Restricted to:
  - User registration
  - Password reset
  - Limited public data
- No sensitive operations

#### 2. **Service Key** (NEVER commit)
- Used only in Edge Functions (server-side)
- Stored in GitHub Secrets
- Can perform admin operations
- Never exposed to frontend

#### 3. **Personal Access Tokens** (For CLI/scripts)
- Developer machines only
- Scoped to specific operations
- Rotated monthly
- Never shared

### Key Rotation Schedule

```
Monthly Rotation (1st of each month):
1. Generate new service key in Supabase
2. Add to GitHub Secrets as SUPABASE_SERVICE_KEY_NEW
3. Update Edge Functions to use new key
4. Test in staging
5. Deploy to production
6. Delete old key from Supabase
7. Remove old key from GitHub Secrets
8. Document in CHANGELOG
```

### Compromised Key Response (< 5 minutes)

```
IF key is leaked or suspected compromised:

1. IMMEDIATE (< 1 min)
   - Disable key in Supabase dashboard
   - Revoke all active sessions

2. URGENT (< 5 min)
   - Generate replacement key
   - Update GitHub Secrets
   - Deploy new key to Edge Functions
   - Alert team via Slack

3. FOLLOW-UP (< 30 min)
   - Review audit logs for unauthorized access
   - Check for suspicious API calls
   - Reset user passwords if needed
   - Document incident in security log

4. PREVENTION (by EOD)
   - Implement stricter key permissions
   - Enable IP whitelisting if not already done
   - Review access logs
   - Update monitoring rules
```

---

## Database Security

### Row-Level Security (RLS) Policies

Every table implements RLS to prevent users from seeing others' data:

```sql
-- productions table: Users only see productions they own or are part of
CREATE POLICY "Users see own productions"
ON productions FOR SELECT
USING (owner_id = auth.uid() OR id IN (
  SELECT production_id FROM production_members WHERE user_id = auth.uid()
));

-- sessions table: Users see sessions for their productions
CREATE POLICY "Users see sessions in their productions"
ON sessions FOR SELECT
USING (production_id IN (
  SELECT id FROM productions 
  WHERE owner_id = auth.uid() 
  OR id IN (SELECT production_id FROM production_members WHERE user_id = auth.uid())
));

-- Similar policies on: schedule_blocks, cast, crew, notifications, attendance
```

### Encrypted Columns

Sensitive data encrypted at application layer (before storage):

- `users.phone` (encrypted)
- `users.address` (encrypted)
- `productions.budget` (encrypted if shared)
- `cast.understudy_notes` (encrypted)

**Encryption Method**: 
- Algorithm: AES-256-GCM
- Key: Derived from Supabase master key
- Library: `tweetnacl.js` (proven crypto)

### Audit Logging

Every change tracked:

```sql
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL,  -- INSERT, UPDATE, DELETE
  old_values JSONB,
  new_values JSONB,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);
```

Triggers automatically log all changes. Admins can review who changed what and when.

---

## Backup & Disaster Recovery

### Backup Strategy: GitHub + Supabase

#### Daily Automated Backups (Supabase)
- ✅ Full database backup (24-hour retention)
- ✅ Point-in-time recovery (48 hours back)
- ✅ Automated to Supabase's secure storage
- ✅ Encrypted at rest (AES-256)

#### Weekly Export to GitHub
```bash
# Every Sunday at 2 AM UTC
# Via GitHub Actions workflow

1. Connect to Supabase via service key
2. Export schema + seed data
3. Commit to secure backup branch (protected)
4. Encrypt sensitive data
5. Delete local copy
6. Alert team if backup fails
```

#### Monthly Full Archive
```bash
# First day of each month
# Via GitHub Actions

1. Export entire database
2. Export all user data (for GDPR)
3. Create archive.tar.gz (encrypted)
4. Upload to GitHub Releases (draft, not public)
5. Verify integrity via checksum
6. Keep 12-month rolling archive
```

### Recovery Procedures

**Scenario 1: Data Corruption (User Error)**
- ⏱️ Recovery Time: < 1 minute
- Steps:
  1. Supabase dashboard → Backups
  2. Select point-in-time (within 48 hours)
  3. Restore to snapshot
  4. Verify data integrity
  5. Switch to restored database

**Scenario 2: Ransomware/Malicious Deletion**
- ⏱️ Recovery Time: < 10 minutes
- Steps:
  1. Immediately disconnect from internet
  2. Alert security team
  3. Review Supabase audit logs for unauthorized access
  4. Activate incident response
  5. Restore from latest clean backup
  6. Change all credentials

**Scenario 3: Regional Outage (Supabase Down)**
- ⏱️ Recovery Time: < 30 minutes
- Steps:
  1. Verify Supabase status page
  2. Contact Supabase support
  3. If RTO > 1 hour, activate failover:
     - Restore from GitHub backup
     - Spin up standby database in different region
     - Switch DNS to standby
     - Resume operations
  4. Migrate back when Supabase recovers

### Backup Verification

**Weekly backup test** (automated):
```bash
# Every Saturday at 1 AM UTC

1. Spin up test database from latest backup
2. Run data validation queries
3. Compare record counts to production
4. Test critical workflows
5. Email team pass/fail report
6. Tear down test database
```

---

## Incident Response

### Incident Severity Levels

| Level | Definition | Response Time |
|-------|-----------|----------------|
| **P1** | Security breach, data loss, service down | 15 min |
| **P2** | Suspected compromise, data anomaly | 1 hour |
| **P3** | Unusual activity, warning signs | 4 hours |
| **P4** | Informational, monitoring alert | Next business day |

### Incident Response Process

**1. Detection** (Automated + Manual)
- Security monitoring alerts
- Team reports suspicious activity
- Automated backup failure alerts

**2. Assessment** (< 15 min)
- Severity classification
- Scope of impact
- Root cause analysis
- Stakeholder notification

**3. Containment** (< 30 min)
- Disable compromised keys
- Revoke suspicious sessions
- Isolate affected databases
- Block suspicious IPs

**4. Eradication** (< 2 hours)
- Remove malicious access
- Rotate credentials
- Patch vulnerabilities
- Deploy security updates

**5. Recovery** (< 4 hours)
- Restore from clean backup
- Resume normal operations
- Run security tests
- Monitor for recurrence

**6. Post-Incident** (< 24 hours)
- Document timeline
- Root cause analysis
- Lessons learned
- Process improvements
- Team debrief

---

## Monitoring & Alerts

### Real-Time Monitoring

**Database Queries per Minute**: Alert if > 1000 (abuse detection)
**Failed Logins**: Alert if > 5 in 5 min from same IP (brute force)
**Unusual Data Access**: Alert if user access patterns deviate from norm
**Backup Failures**: Alert if daily backup doesn't complete
**SSL Certificate Expiry**: Alert 30 days before expiration

### Alert Channels

1. **Email**: Critical incidents (P1, P2)
2. **Slack**: All incidents with @security-team mention
3. **PagerDuty**: On-call rotation for P1 incidents
4. **Dashboard**: Real-time metrics visible to team
5. **Audit Log**: Permanent record of all alerts

### Weekly Security Report

**Sent Monday morning, includes:**
- Login attempts (successful + failed)
- API usage patterns
- Backup status
- Failed security tests
- New vulnerabilities detected
- Recommended actions

---

## Compliance Checklist

### WCAG AAA Accessibility
- [x] All UI components keyboard navigable
- [x] ARIA labels on all interactive elements
- [x] Color contrast ratio ≥ 7:1 (AAA standard)
- [x] Focus indicators visible
- [x] Captions for audio/video
- [x] Readable fonts (≥ 14px)
- [x] No time-based content auto-advancing
- [x] Skip navigation links

### OWASP Top 10 (2021)
- [x] A01: Broken Access Control (RLS policies)
- [x] A02: Cryptographic Failures (TLS 1.3 + AES-256)
- [x] A03: Injection (Parameterized queries)
- [x] A04: Insecure Design (Security by default)
- [x] A05: Security Misconfiguration (CIS benchmarks)
- [x] A06: Vulnerable & Outdated Components (Dependabot)
- [x] A07: Authentication Failures (Supabase Auth + MFA)
- [x] A08: Data Integrity Failures (Audit logging)
- [x] A09: Logging & Monitoring Failures (Comprehensive logs)
- [x] A10: SSRF (No external calls)

### SOC 2 Type II Readiness
- [x] Change management process
- [x] Backup & recovery procedures
- [x] Incident response plan
- [x] Access control policies
- [x] Encryption standards
- [x] Monitoring & alerting
- [x] Audit logging
- [x] Data retention policies
- [x] Security training records
- [x] Vendor risk management

### GDPR Compliance
- [x] User data export functionality
- [x] Right to be forgotten (data deletion)
- [x] Data processing agreements
- [x] Breach notification process (< 72 hours)
- [x] Privacy policy
- [x] Consent management
- [x] Data retention schedules
- [x] International data transfers (Supabase EU region available)

---

## Security Best Practices for Development

### Local Development

```bash
# .env.local (NEVER commit)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key-only

# Service key stays in GitHub Secrets only
# Never in .env.local
```

### Code Review Security Checklist

Before merging any PR:
- [ ] No API keys hardcoded
- [ ] Environment variables used for secrets
- [ ] RLS policies reviewed/updated if DB changes
- [ ] New API endpoints have rate limiting
- [ ] Input validation on all user-facing forms
- [ ] Audit log entry for sensitive operations
- [ ] Tests include security scenarios
- [ ] No SQL injection vulnerabilities
- [ ] CORS properly configured
- [ ] Error messages don't leak sensitive info

### Dependency Management

```bash
# Weekly dependency updates
npm audit
npm update

# Automated via Dependabot
# - Creates PR for security updates
# - Fails if vulnerabilities found
# - Blocks merge until fixed
```

---

## Emergency Contacts

**Security Incident**: security@rehearsal-scheduler.dev  
**On-Call**: PagerDuty integration (see team wiki)  
**Supabase Support**: https://supabase.com/support  
**GitHub Security**: https://github.com/security  

---

**Last Security Audit**: 2026-02-14  
**Next Scheduled Audit**: 2026-05-14 (quarterly)  
**Audit History**: See `docs/security/audit-log.md`
