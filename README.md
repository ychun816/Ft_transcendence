# 🎮 Ft_transcendence - User Management & 2FA Authentication Module

<p align="center">
  
![Python](https://img.shields.io/badge/Python-Learned-FFD4B2?style=flat&logo=python&logoColor=white) <!-- pastel orange -->
![Git](https://img.shields.io/badge/Git-Learned-BFEFFF?style=flat&logo=git&logoColor=white) <!-- pastel blue -->
![Linux](https://img.shields.io/badge/Linux-Learned-FFC4D6?style=flat&logo=linux&logoColor=white) <!-- pastel pink -->
![Docker](https://img.shields.io/badge/Docker-Learned-C5A3E8?style=flat&logo=docker&logoColor=white) <!-- pastel purple -->
![Machine Learning](https://img.shields.io/badge/Machine%20Learning-Learned-FFF1A8?style=flat&logoColor=white) <!-- pastel yellow -->

</p>

![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![2FA](https://img.shields.io/badge/2FA-4285F4?style=for-the-badge&logo=google-authenticator&logoColor=white)
![Security](https://img.shields.io/badge/Security-FF6B6B?style=for-the-badge&logo=security&logoColor=white)

## 📑 Table of Contents

- [About / Project Overview](#-about--project-overview)
- [Resources & References](#-resources--references)
- [Token/2FA Authentication Brief & Resources](#-token2fa-authentication-brief--resources)
- [Structure & Workflow Diagrams](#-structure--workflow-diagrams)
  - [Whole Project Structure & Workflow](#1-whole-project-structure--workflow-diagram)
  - [Token/2FA Authentication Structure & Workflow](#2-token2fa-authentication-structure--workflow-diagram)
- [Test Commands](#-test-commands)
- [Key Concepts Learned](#-key-concepts-learned)
- [Skills Developed](#-skills-developed)

---

## 🎯 About / Project Overview

**Ft_transcendence** is a full-stack web application project that implements a multiplayer Pong game with advanced features including real-time gameplay, live chat, user management, and comprehensive security measures.

This repository focuses on the **User Management and 2FA Authentication Module**, which provides:

- **Standard User Management**: User registration, authentication, and profile management across tournaments
- **Remote Authentication**: Secure OAuth integration for third-party login providers
- **Two-Factor Authentication (2FA)**: TOTP-based second layer of security using authenticator apps
- **JWT Token Management**: Stateless authentication with refresh token rotation
- **Cybersecurity Best Practices**: Implementation of WAF/ModSecurity and HashiCorp Vault for secrets management

### 🏗️ Project Stack

- **Backend Framework**: NestJS (TypeScript)
- **Frontend Framework**: React/Next.js with TypeScript
- **Database**: PostgreSQL
- **Containerization**: Docker & Docker Compose
- **Authentication**: JWT + TOTP (Time-based One-Time Password)
- **Security**: ModSecurity WAF, HashiCorp Vault

### 👥 Team Contributions

- **Yichun**: User Management, 2FA/JWT Implementation, WAF/ModSecurity, HashiCorp Vault
- **Arthur**: Remote Authentication, Infrastructure & Log Management, DevOps
- **Armel**: Standard User Management & Tournament Integration
- **Diego**: Gameplay, Multiplayer, AI Opponent
- **Jojo**: Database, Live Chat, SSR Integration

---

## 📚 Resources & References

### 🔐 Authentication & Security
- [JWT.io - Official JWT Documentation](https://jwt.io/introduction)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [NestJS Authentication Guide](https://docs.nestjs.com/security/authentication)
- [Passport.js Documentation](http://www.passportjs.org/docs/)

### 🔢 Two-Factor Authentication
- [RFC 6238 - TOTP: Time-Based One-Time Password Algorithm](https://datatracker.ietf.org/doc/html/rfc6238)
- [Google Authenticator Implementation](https://github.com/google/google-authenticator)
- [Speakeasy - 2FA Library for Node.js](https://github.com/speakeasyapi/speakeasy)
- [QRCode.js - QR Code Generation](https://davidshimjs.github.io/qrcodejs/)

### 🛡️ Security Tools
- [ModSecurity Core Rule Set](https://coreruleset.org/)
- [HashiCorp Vault Documentation](https://developer.hashicorp.com/vault/docs)
- [OWASP Top 10 Security Risks](https://owasp.org/www-project-top-ten/)

### 🐳 Docker & DevOps
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [NestJS Dockerfile Best Practices](https://docs.nestjs.com/recipes/prisma#deployment)

---

## 🔐 Token/2FA Authentication Brief & Resources

### What is JWT (JSON Web Token)?

JWT is a compact, URL-safe token format used for securely transmitting information between parties. In this project, JWTs are used for stateless authentication, containing user identity and permissions.

**Key Features:**
- **Stateless**: No server-side session storage required
- **Secure**: Signed tokens prevent tampering
- **Scalable**: Easy to distribute across microservices
- **Self-contained**: Carries user information in the token payload

### What is 2FA (Two-Factor Authentication)?

2FA adds an extra security layer beyond passwords by requiring a second verification method. This project implements **TOTP (Time-based One-Time Password)** using authenticator apps like Google Authenticator or Authy.

**How TOTP Works:**
1. Server generates a secret key for the user
2. Secret is shared with user via QR code
3. User's authenticator app generates time-based 6-digit codes
4. Server validates codes by computing expected value based on shared secret and current time

### Implementation Resources

#### JWT Implementation
```typescript
// Access Token: Short-lived (15min), contains user info
// Refresh Token: Long-lived (7d), used to generate new access tokens
```

#### TOTP Implementation
- **Library**: `speakeasy` for TOTP generation/verification
- **QR Code**: `qrcode` for generating QR codes
- **Algorithm**: SHA-1 based HMAC (RFC 6238 standard)
- **Time Step**: 30 seconds
- **Code Length**: 6 digits

#### Security Measures
- Secrets stored in HashiCorp Vault
- Rate limiting on authentication endpoints
- Encrypted storage of 2FA secrets
- Backup codes for account recovery
- IP-based suspicious activity detection

---

## 📊 Structure & Workflow Diagrams

### 1. Whole Project Structure & Workflow Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         🌍 CLIENT / USER                                 │
│──────────────────────────────────────────────────────────────────────────│
│  Access via → https://localhost:3000 🔒                                  │
│  - Web Browser (React/Next.js Frontend)                                  │
│  - Authenticator App (Google Authenticator, Authy, etc.)                 │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                      🛡️ WAF / ModSecurity Layer                          │
│──────────────────────────────────────────────────────────────────────────│
│  • Request filtering & validation                                        │
│  • OWASP Core Rule Set (CRS)                                             │
│  • SQL Injection & XSS protection                                        │
│  • Rate limiting & DDoS mitigation                                       │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    🎮 NESTJS BACKEND APPLICATION                         │
│──────────────────────────────────────────────────────────────────────────│
│  📦 Module Structure:                                                    │
│  ├─ 🔐 Auth Module (JWT + 2FA)                                           │
│  │  ├─ Login/Logout endpoints                                            │
│  │  ├─ JWT token generation/validation                                   │
│  │  ├─ 2FA setup & verification                                          │
│  │  └─ Refresh token rotation                                            │
│  │                                                                       │
│  ├─ 👤 User Module                                                       │
│  │  ├─ User CRUD operations                                              │
│  │  ├─ Profile management                                                │
│  │  └─ Tournament participation tracking                                 │
│  │                                                                       │
│  ├─ 🎯 Game Module                                                       │
│  │  ├─ Multiplayer game logic                                            │
│  │  ├─ Real-time WebSocket connections                                   │
│  │  └─ AI opponent integration                                           │
│  │                                                                       │
│  ├─ 💬 Chat Module                                                       │
│  │  └─ Live chat functionality                                           │
│  │                                                                       │
│  └─ 📊 Stats Module                                                      │
│     └─ User & game statistics dashboard                                  │
│                                                                          │
│  🔒 Security Layer:                                                      │
│  ├─ Guards: JWT, 2FA, Role-based                                         │
│  ├─ Interceptors: Logging, transformation                                │
│  └─ Pipes: Validation, sanitization                                      │
└──────────────────────────────────────────────────────────────────────────┘
                    │                           │
                    ▼                           ▼
┌────────────────────────────────┐  ┌────────────────────────────────┐
│    🗄️ PostgreSQL Database      │  │  🔐 HashiCorp Vault           │
│────────────────────────────────│  │────────────────────────────────│
│  • Users table                 │  │  • JWT secrets                 │
│  • 2FA secrets (encrypted)     │  │  • Database credentials        │
│  • Game records                │  │  • API keys                    │
│  • Chat messages               │  │  • Encryption keys             │
│  • Tournament data             │  │  • OAuth client secrets        │
└────────────────────────────────┘  └────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    📊 Monitoring & Logging                               │
│──────────────────────────────────────────────────────────────────────────│
│  • ELK Stack (Elasticsearch, Logstash, Kibana)                           │
│  • Authentication attempts logging                                       │
│  • Security event monitoring                                             │
│  • Performance metrics                                                   │
└──────────────────────────────────────────────────────────────────────────┘
```

**Data Flow:**
1. **Client** → User accesses application via browser
2. **WAF** → Requests filtered through ModSecurity rules
3. **Backend** → NestJS handles business logic & authentication
4. **Database** → PostgreSQL stores user data & game state
5. **Vault** → Secrets management for sensitive credentials
6. **Monitoring** → Logs & metrics collected for analysis

---

### 2. Token/2FA Authentication Structure & Workflow Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    🔐 AUTHENTICATION FLOW                                │
└──────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════
                        📝 REGISTRATION PHASE
═══════════════════════════════════════════════════════════════════════════

┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Client    │         │   Backend   │         │  Database   │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │                       │                       │
       │ POST /auth/register   │                       │
       │ {email, password}     │                       │
       ├──────────────────────>│                       │
       │                       │                       │
       │                       │ Hash password         │
       │                       │ (bcrypt)              │
       │                       │                       │
       │                       │ CREATE user           │
       │                       ├──────────────────────>│
       │                       │                       │
       │                       │<──────────────────────┤
       │                       │ User created          │
       │                       │                       │
       │<──────────────────────┤                       │
       │ {success: true}       │                       │
       │                       │                       │


═══════════════════════════════════════════════════════════════════════════
                      🔑 INITIAL LOGIN (Without 2FA)
═══════════════════════════════════════════════════════════════════════════

┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Client    │         │   Backend   │         │  Database   │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │                       │                       │
       │ POST /auth/login      │                       │
       │ {email, password}     │                       │
       ├──────────────────────>│                       │
       │                       │                       │
       │                       │ Validate credentials  │
       │                       ├──────────────────────>│
       │                       │                       │
       │                       │<──────────────────────┤
       │                       │ User found            │
       │                       │                       │
       │                       │ Check 2FA enabled?    │
       │                       │   NO                  │
       │                       │                       │
       │                       │ Generate JWT tokens:  │
       │                       │ - Access Token (15m)  │
       │                       │ - Refresh Token (7d)  │
       │                       │                       │
       │<──────────────────────┤                       │
       │ {accessToken,         │                       │
       │  refreshToken}        │                       │
       │                       │                       │


═══════════════════════════════════════════════════════════════════════════
                        🔐 2FA SETUP PHASE
═══════════════════════════════════════════════════════════════════════════

┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │    │   Backend   │    │  Database   │    │    Vault    │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │                  │
       │ POST /2fa/setup  │                  │                  │
       │ {Authorization}  │                  │                  │
       ├─────────────────>│                  │                  │
       │                  │                  │                  │
       │                  │ Validate JWT     │                  │
       │                  │                  │                  │
       │                  │ Generate secret  │                  │
       │                  │ (32-char base32) │                  │
       │                  │                  │                  │
       │                  │ Store encrypted  │                  │
       │                  │ secret           │                  │
       │                  ├─────────────────>│                  │
       │                  │                  │                  │
       │                  │ Get encryption   │                  │
       │                  │ key              │                  │
       │                  ├──────────────────┼─────────────────>│
       │                  │                  │                  │
       │                  │<─────────────────┼──────────────────┤
       │                  │ Encryption key   │                  │
       │                  │                  │                  │
       │                  │ Generate QR code │                  │
       │                  │ (otpauth://...)  │                  │
       │                  │                  │                  │
       │<─────────────────┤                  │                  │
       │ {qrCode,         │                  │                  │
       │  secret,         │                  │                  │
       │  backupCodes}    │                  │                  │
       │                  │                  │                  │
       │ 📱 Scan QR with  │                  │                  │
       │ Authenticator App│                  │                  │
       │                  │                  │                  │


═══════════════════════════════════════════════════════════════════════════
                      ✅ 2FA VERIFICATION & ACTIVATION
═══════════════════════════════════════════════════════════════════════════

┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Client    │         │   Backend   │         │  Database   │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │                       │                       │
       │ POST /2fa/verify      │                       │
       │ {token: "123456"}     │                       │
       ├──────────────────────>│                       │
       │                       │                       │
       │                       │ Get user's secret     │
       │                       ├──────────────────────>│
       │                       │                       │
       │                       │<──────────────────────┤
       │                       │ Encrypted secret      │
       │                       │                       │
       │                       │ Decrypt secret        │
       │                       │                       │
       │                       │ Verify TOTP:          │
       │                       │ speakeasy.verify({    │
       │                       │   secret,             │
       │                       │   encoding: 'base32', │
       │                       │   token: '123456',    │
       │                       │   window: 1           │
       │                       │ })                    │
       │                       │                       │
       │                       │ Enable 2FA for user   │
       │                       ├──────────────────────>│
       │                       │                       │
       │<──────────────────────┤                       │
       │ {success: true,       │                       │
       │  twoFactorEnabled}    │                       │
       │                       │                       │


═══════════════════════════════════════════════════════════════════════════
                    🔑 LOGIN WITH 2FA (Complete Flow)
═══════════════════════════════════════════════════════════════════════════

┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Client    │         │   Backend   │         │  Database   │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │                       │                       │
       │ [STEP 1] POST /login  │                       │
       │ {email, password}     │                       │
       ├──────────────────────>│                       │
       │                       │                       │
       │                       │ Validate credentials  │
       │                       ├──────────────────────>│
       │                       │                       │
       │                       │<──────────────────────┤
       │                       │ User found            │
       │                       │                       │
       │                       │ Check 2FA enabled?    │
       │                       │   YES ✓               │
       │                       │                       │
       │                       │ Generate temp token   │
       │                       │ (5min expiry)         │
       │                       │                       │
       │<──────────────────────┤                       │
       │ {requires2FA: true,   │                       │
       │  tempToken}           │                       │
       │                       │                       │
       │ [STEP 2] Prompt user  │                       │
       │ for 2FA code          │                       │
       │ 📱 Get code from app  │                       │
       │ (e.g., "654321")      │                       │
       │                       │                       │
       │ POST /2fa/authenticate│                       │
       │ {tempToken, code}     │                       │
       ├──────────────────────>│                       │
       │                       │                       │
       │                       │ Validate temp token   │
       │                       │                       │
       │                       │ Get user's 2FA secret │
       │                       ├──────────────────────>│
       │                       │                       │
       │                       │<──────────────────────┤
       │                       │ Encrypted secret      │
       │                       │                       │
       │                       │ Verify TOTP code      │
       │                       │ ✓ Valid               │
       │                       │                       │
       │                       │ Generate final tokens:│
       │                       │ - Access Token (15m)  │
       │                       │ - Refresh Token (7d)  │
       │                       │                       │
       │                       │ Store refresh token   │
       │                       ├──────────────────────>│
       │                       │                       │
       │<──────────────────────┤                       │
       │ {accessToken,         │                       │
       │  refreshToken,        │                       │
       │  user}                │                       │
       │                       │                       │


═══════════════════════════════════════════════════════════════════════════
                        🔄 TOKEN REFRESH FLOW
═══════════════════════════════════════════════════════════════════════════

┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Client    │         │   Backend   │         │  Database   │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │                       │                       │
       │ POST /auth/refresh    │                       │
       │ {refreshToken}        │                       │
       ├──────────────────────>│                       │
       │                       │                       │
       │                       │ Verify refresh token  │
       │                       │ signature             │
       │                       │                       │
       │                       │ Check token in DB     │
       │                       ├──────────────────────>│
       │                       │                       │
       │                       │<──────────────────────┤
       │                       │ Token valid           │
       │                       │                       │
       │                       │ Generate new tokens:  │
       │                       │ - New Access (15m)    │
       │                       │ - New Refresh (7d)    │
       │                       │                       │
       │                       │ Revoke old refresh    │
       │                       │ Store new refresh     │
       │                       ├──────────────────────>│
       │                       │                       │
       │<──────────────────────┤                       │
       │ {accessToken,         │                       │
       │  refreshToken}        │                       │
       │                       │                       │


═══════════════════════════════════════════════════════════════════════════
                          🔓 LOGOUT FLOW
═══════════════════════════════════════════════════════════════════════════

┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Client    │         │   Backend   │         │  Database   │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │                       │                       │
       │ POST /auth/logout     │                       │
       │ {refreshToken}        │                       │
       ├──────────────────────>│                       │
       │                       │                       │
       │                       │ Revoke refresh token  │
       │                       ├──────────────────────>│
       │                       │                       │
       │                       │<──────────────────────┤
       │                       │ Token revoked         │
       │                       │                       │
       │<──────────────────────┤                       │
       │ {success: true}       │                       │
       │                       │                       │
       │ Clear local tokens    │                       │
       │                       │                       │
```

**Key Components:**

1. **JWT Token Structure**
   ```
   Access Token (15min):
   {
     "sub": "user-id",
     "email": "user@example.com",
     "roles": ["user"],
     "iat": 1234567890,
     "exp": 1234568790
   }
   
   Refresh Token (7 days):
   {
     "sub": "user-id",
     "tokenId": "unique-token-id",
     "iat": 1234567890,
     "exp": 1235172690
   }
   ```

2. **TOTP Algorithm**
   - **Time Step**: 30 seconds
   - **Code Length**: 6 digits
   - **Algorithm**: HMAC-SHA1
   - **Window**: ±1 (accepts codes from previous/next time step)

3. **Security Features**
   - Password hashing with bcrypt (salt rounds: 10)
   - 2FA secrets encrypted at rest
   - Refresh token rotation (each use generates new token)
   - Token blacklisting on logout
   - Rate limiting on auth endpoints (max 5 attempts/min)

---

## 🧪 Test Commands

### Development Setup

```bash
# Clone the repository
git clone https://github.com/ychun816/Ft_transcendence.git
cd Ft_transcendence

# Install Dev Container extension in VS Code
# Press Ctrl+Shift+P → "Dev Containers: Reopen in Container"

# Inside the container, start the development server
npm run dev

# Server will run on https://localhost:3000
```

### Testing 2FA Endpoints

#### 1. Register a New User
```bash
curl -X POST https://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "SecurePass123!",
    "username": "testuser"
  }'
```

#### 2. Login (Initial - Without 2FA)
```bash
curl -X POST https://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "SecurePass123!"
  }'
```

#### 3. Setup 2FA (Get QR Code)
```bash
# Replace {ACCESS_TOKEN} with the token from login response
curl -X POST https://localhost:3000/api/2fa/setup \
  -H "Authorization: Bearer {ACCESS_TOKEN}"

# Response includes:
# - qrCode: base64 image to scan with authenticator app
# - secret: manual entry key (if QR scan fails)
# - backupCodes: emergency recovery codes
```

Or use the temporary endpoint:
```bash
# Setup TOTP for a specific user (development only)
https://localhost:3000/api/2fa/setup-totp-temp/testuser
```

#### 4. Verify 2FA Code (Activate 2FA)
```bash
# Get 6-digit code from Google Authenticator app
curl -X POST https://localhost:3000/api/2fa/verify \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "123456"
  }'
```

Or use the temporary endpoint:
```bash
# Verify TOTP for a specific user (development only)
https://localhost:3000/api/2fa/verify-totp-temp/testuser/123456
```

#### 5. Login with 2FA (Two-Step Process)

**Step 1: Initial Login**
```bash
curl -X POST https://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "SecurePass123!"
  }'

# Response:
# {
#   "requires2FA": true,
#   "tempToken": "temporary-5min-token"
# }
```

**Step 2: Complete with 2FA**
```bash
# Get current 6-digit code from authenticator app
curl -X POST https://localhost:3000/api/2fa/authenticate \
  -H "Content-Type: application/json" \
  -d '{
    "tempToken": "temporary-5min-token",
    "code": "654321"
  }'

# Response:
# {
#   "accessToken": "jwt-access-token",
#   "refreshToken": "jwt-refresh-token",
#   "user": { ... }
# }
```

#### 6. Refresh Access Token
```bash
curl -X POST https://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "{REFRESH_TOKEN}"
  }'
```

#### 7. Access Protected Resource
```bash
curl -X GET https://localhost:3000/api/users/profile \
  -H "Authorization: Bearer {ACCESS_TOKEN}"
```

#### 8. Disable 2FA
```bash
curl -X POST https://localhost:3000/api/2fa/disable \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "SecurePass123!"
  }'
```

#### 9. Logout
```bash
curl -X POST https://localhost:3000/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "{REFRESH_TOKEN}"
  }'
```

### Docker Commands

```bash
# Remove all Docker images and containers (USE WITH CAUTION)
./reset_docker.sh

# View logs
docker-
```


