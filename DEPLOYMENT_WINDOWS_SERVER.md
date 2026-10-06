# Complete Production Deployment Guide
## Windows Server (IIS / RDP) + GoDaddy DNS + PostgreSQL

This guide covers everything required to deploy the **Janaseva Ashrama** Next.js platform to a **Dedicated Windows Server** with **IIS reverse proxy**, **GoDaddy DNS**, **PostgreSQL**, and **free automated Let's Encrypt SSL**.

---

### Table of Contents
1. [Overview & Architecture](#1-overview--architecture)
2. [Prerequisites on the Windows Server](#2-prerequisites-on-the-windows-server)
3. [Database Setup (PostgreSQL)](#3-database-setup-postgresql)
4. [Deploying the Application Code](#4-deploying-the-application-code)
5. [Running 24/7 as a Windows Service](#5-running-247-as-a-windows-service)
6. [IIS Reverse Proxy Configuration](#6-iis-reverse-proxy-configuration)
7. [GoDaddy DNS Configuration](#7-godaddy-dns-configuration)
8. [Free SSL Certificate (HTTPS) via Win-ACME](#8-free-ssl-certificate-https-via-win-acme)
9. [Razorpay Production Webhook Configuration](#9-razorpay-production-webhook-configuration)
10. [Health Check & Verification Checklist](#10-health-check--verification-checklist)

---

### 1. Overview & Architecture

```
[ Visitor / Donor Browser ]
             │
             │ HTTPS (Port 443) / HTTP (Port 80)
             ▼
  [ GoDaddy DNS Record (@ / www) ➔ Windows Server Public IP ]
             │
             ▼
 [ Windows Server: IIS (Internet Information Services) ]
   (SSL Termination via Win-ACME Let's Encrypt)
   (URL Rewrite + ARR Reverse Proxy)
             │
             │ HTTP (Port 3000)
             ▼
 [ Next.js Production Engine (Port 3000) ]
   (Managed 24/7 by PM2 or NSSM Windows Service)
             │
             ▼
 [ PostgreSQL Database (Port 5432) ]
```

---

### 2. Prerequisites on the Windows Server

Log into your Windows Server via **Remote Desktop (RDP)** as Administrator.

#### A. Install Node.js
1. Download **Node.js v20.x or v22.x LTS** Windows Installer (x64) from [nodejs.org](https://nodejs.org/).
2. Run installer with default settings.
3. Verify in PowerShell:
   ```powershell
   node -v
   npm -v
   ```

#### B. Install IIS, URL Rewrite & ARR
1. **Enable IIS**:
   - Open **Server Manager** ➔ **Manage** ➔ **Add Roles and Features**.
   - Select **Web Server (IIS)**. Ensure **WebSocket Protocol** is checked under `Application Development`.
   - Click Next and Install.
2. **Install URL Rewrite Module 2.1**:
   - Download official installer: [IIS URL Rewrite Module](https://www.iis.net/downloads/microsoft/url-rewrite)
3. **Install Application Request Routing (ARR) 3.0**:
   - Download official installer: [Application Request Routing](https://www.iis.net/downloads/microsoft/application-request-routing)

#### C. Enable Proxy in ARR
1. Open **IIS Manager** (`inetmgr`).
2. In the left Connections tree, click the **Server Name** (root).
3. In the center pane, double-click **Application Request Routing Cache**.
4. In the right **Actions** pane, click **Server Proxy Settings...**.
5. Check **Enable proxy**.
6. Uncheck **Reverse rewrite host in response headers** (if checked).
7. In the right Actions pane, click **Apply**.

---

### 3. Database Setup (PostgreSQL)

If PostgreSQL is not yet installed on the server:
1. Download PostgreSQL 16 or 17 from [postgresql.org/download/windows](https://www.postgresql.org/download/windows/).
2. Run installer, set a strong `postgres` superuser password, and keep default port `5432`.
3. Open **pgAdmin** or `psql` shell:
   ```sql
   CREATE DATABASE janaseva;
   CREATE USER janaseva_user WITH ENCRYPTED PASSWORD 'YourStrongDbPassword123!';
   GRANT ALL PRIVILEGES ON DATABASE janaseva TO janaseva_user;
   ```

---

### 4. Deploying the Application Code

1. Copy the project folder to the server, for example: `C:\inetpub\janaseva-app`.
   > **What to copy**:
   > - `.next` (the production build)
   > - `public`
   > - `src`
   > - `scripts`
   > - `db`
   > - `package.json`
   > - `package-lock.json`
   > - `web.config`
   > - `ecosystem.config.cjs`

2. Open PowerShell in `C:\inetpub\janaseva-app` and install dependencies:
   ```powershell
   npm install --omit=dev
   ```

3. Create the production `.env` file in `C:\inetpub\janaseva-app\.env`:
   ```env
   # Database
   DATABASE_URL=postgresql://janaseva_user:YourStrongDbPassword123!@localhost:5432/janaseva

   # Razorpay Production Keys
   RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxx
   RAZORPAY_WEBHOOK_SECRET=your_secret_webhook_key_xxxx

   # Admin Authentication
   ADMIN_EMAIL=admin@janasevaorphanage.org
   ADMIN_PASSWORD=SetYourUltraSecurePassword2026!
   ADMIN_SESSION_SECRET=create_a_random_32_character_string_here

   # Production Safety
   ALLOW_DEMO_SEED=false
   PORT=3000
   NODE_ENV=production
   ```

4. Push the schema and initialize tables in PostgreSQL:
   ```powershell
   npm run db:push
   ```

5. Test launch Next.js to verify:
   ```powershell
   npm run start
   ```
   Open browser at `http://localhost:3000`. You should see the site load smoothly. Press `Ctrl+C` to stop.

---

### 5. Running 24/7 as a Windows Service

To ensure the Next.js process starts automatically on server reboots and never stops, use **NSSM** or **PM2**.

#### Method 1: Using NSSM (Recommended for Windows Server)
1. Download NSSM from [nssm.cc/download](https://nssm.cc/download).
2. Extract `nssm.exe` (from `win64` folder) to `C:\Windows\System32\`.
3. In Administrator PowerShell, run:
   ```powershell
   nssm install JanasevaNextService
   ```
4. In the GUI popup:
   - **Path**: `C:\Program Files\nodejs\node.exe` (or path from `where.exe node`)
   - **Startup directory**: `C:\inetpub\janaseva-app`
   - **Arguments**: `node_modules\next\dist\bin\next start -p 3000`
5. Click **Install service**.
6. Start the service:
   ```powershell
   nssm start JanasevaNextService
   ```
   Verify status:
   ```powershell
   nssm status JanasevaNextService
   # Output: SERVICE_RUNNING
   ```

#### Method 2: Using PM2 with Windows Service
```powershell
npm install -g pm2 pm2-windows-service
pm2-service-install
pm2 start ecosystem.config.cjs
pm2 save
```

---

### 6. IIS Reverse Proxy Configuration

1. In **IIS Manager** (`inetmgr`), right-click **Sites** ➔ **Add Website...**.
   - **Site name**: `JanasevaAshrama`
   - **Physical path**: `C:\inetpub\janaseva-app` (where `web.config` is located)
   - **Binding**: Type `http`, Port `80`, Host name: leave blank or enter `janasevaorphanage.org`.
2. Click **OK**.
3. The included [`web.config`](file:///D:/jana_build/web.config) automatically forwards incoming requests to `http://127.0.0.1:3000/`.
4. Test locally on the server: Open `http://localhost` in the browser — IIS will proxy the request to port 3000!

---

### 7. GoDaddy DNS Configuration

1. Log into your [GoDaddy Account](https://dcc.godaddy.com/).
2. Go to **My Products** ➔ **Domains** ➔ Select your domain ➔ **Manage DNS** (or **DNS Records**).
3. Find your Windows Server's **Public Static IP** (you can check by visiting `api.ipify.org` from the server).
4. Configure these records:
   - **A Record**:
     - **Name**: `@`
     - **Value**: `<Your_Windows_Server_Public_IP>`
     - **TTL**: `1/2 Hour` (or Default)
   - **CNAME Record**:
     - **Name**: `www`
     - **Value**: `@`
     - **TTL**: `1/2 Hour`
5. Save changes. DNS usually propagates within 5 to 30 minutes.

---

### 8. Free SSL Certificate (HTTPS) via Win-ACME

Win-ACME automates Let's Encrypt certificates directly inside IIS.

1. Download the latest `win-acme` release (.zip) from [win-acme.com](https://www.win-acme.com/).
2. Extract to `C:\tools\win-acme\`.
3. Open PowerShell as **Administrator** and run:
   ```powershell
   C:\tools\win-acme\wacs.exe
   ```
4. In the menu:
   - Type **`N`** (Create certificate with default settings).
   - Select your IIS website (e.g. `1` for `JanasevaAshrama`).
   - Choose domain bindings: `janasevaorphanage.org` and `www.janasevaorphanage.org`.
   - Enter your email address for renewal notifications.
   - Accept terms.
5. Win-ACME will:
   - Verify domain ownership with Let's Encrypt.
   - Generate the certificate.
   - Bind HTTPS (Port 443) in IIS automatically.
   - Create a Windows Scheduled Task to auto-renew every 60 days!

---

### 9. Razorpay Production Webhook Configuration

1. Log into the [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Switch to **Live Mode**.
3. Go to **Settings** ➔ **Webhooks** ➔ **Add New Webhook**.
4. Configure:
   - **Webhook URL**: `https://yourdomain.com/api/razorpay/webhook`
   - **Secret**: Must match `RAZORPAY_WEBHOOK_SECRET` from your `.env`.
   - **Active Events**:
     - `payment.captured`
     - `order.paid`
5. Click **Create Webhook**.

---

### 10. Health Check & Verification Checklist

Once live, verify each endpoint:
- [ ] `https://yourdomain.com` ➔ Homepage loads with SSL padlock.
- [ ] `https://yourdomain.com/sitemap.xml` ➔ XML sitemap is reachable.
- [ ] `https://yourdomain.com/robots.txt` ➔ Search engine rules are active.
- [ ] `https://yourdomain.com/celebrate-birthday` ➔ Celebration form and schema active.
- [ ] `https://yourdomain.com/admin/login` ➔ Admin login panel functions.
- [ ] Test a live ₹10 donation ➔ Receipt generation, 80G tax document, masked donor info.
- [ ] Submit `https://yourdomain.com/sitemap.xml` to [Google Search Console](https://search.google.com/search-console).
