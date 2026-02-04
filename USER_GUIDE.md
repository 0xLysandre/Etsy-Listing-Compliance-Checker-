# Etsy Listing Compliance Checker - User Guide

A tool to help Etsy sellers ensure their listings comply with Etsy's policies and best practices.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Creating an Account](#creating-an-account)
3. [Logging In](#logging-in)
4. [Dashboard Overview](#dashboard-overview)
5. [Viewing Policy Rules](#viewing-policy-rules)
6. [Admin: Managing Policy Rules](#admin-managing-policy-rules)
7. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

### Running the Application

**Option 1: Use the startup script**

```bash
cd ~/Etsy-Listing-Compliance-Checker-
./start-dev.sh
```

This script automatically:
- Starts PostgreSQL
- Creates the database
- Installs dependencies
- Starts both frontend and backend servers

**Option 2: Manual startup**

Terminal 1 (Backend):
```bash
cd server
npm install
npm run dev
```

Terminal 2 (Frontend):
```bash
cd client
npm install
npm run dev
```

### Accessing the Application

Once running, open your browser and go to:

```
http://localhost:5173
```

---

## Creating an Account

1. Click **"Sign Up"** on the login page
2. Fill in your details:
   - **Email**: Your email address (used for verification)
   - **Password**: Must contain:
     - At least 8 characters
     - One uppercase letter
     - One number
     - One special character (!@#$%^&*)
   - **Confirm Password**: Re-enter your password
3. Click **"Create Account"**
4. Check your email for a verification link (in development mode, check the server console)
5. Click the verification link to activate your account

---

## Logging In

1. Go to the login page
2. Enter your **email** and **password**
3. Optional: Check **"Remember me"** to stay logged in for 30 days
4. Click **"Sign In"**

### Forgot Password?

1. Click **"Forgot password?"** on the login page
2. Enter your email address
3. Click **"Send Reset Link"**
4. Check your email for the reset link
5. Click the link and enter your new password

---

## Dashboard Overview

After logging in, you'll see the main dashboard with:

| Section | Description |
|---------|-------------|
| **Sidebar** | Navigation menu on the left |
| **Dashboard** | Overview of your compliance status |
| **Policy Rules** | View all active compliance rules |
| **Manage Rules** | Admin panel for rule management |

---

## Viewing Policy Rules

Navigate to **"Policy Rules"** in the sidebar to see all active compliance rules.

### Understanding Rule Categories

| Category | Description |
|----------|-------------|
| **Prohibited Items** | Items completely banned on Etsy |
| **Restricted Items** | Items with specific requirements |
| **Policy Violations** | Actions that violate Etsy's terms |
| **Listing Quality** | Best practices for titles/descriptions |
| **Shipping** | Shipping policy requirements |
| **Safety** | Safety-related compliance rules |
| **Digital Products** | Rules specific to digital items |

### Understanding Severity Levels

| Severity | Meaning | Action Required |
|----------|---------|-----------------|
| **CRITICAL** | Immediate account suspension risk | Fix immediately |
| **HIGH** | Listing removal likely | Fix before publishing |
| **MEDIUM** | May affect visibility/sales | Should fix soon |
| **LOW** | Best practice recommendation | Consider fixing |

---

## Admin: Managing Policy Rules

Access the admin panel by clicking **"Manage Rules"** in the sidebar.

### Viewing Rules

The admin panel shows:
- **Statistics cards** at the top showing rule counts by severity
- **Filter options** to narrow down rules
- **Rule list** with all policy rules

### Filtering Rules

Use the filters at the top to find specific rules:

1. **Category**: Filter by rule category (e.g., prohibited_items)
2. **Severity**: Filter by severity level (CRITICAL, HIGH, MEDIUM, LOW)
3. **Status**: Show Active, Inactive, or All rules
4. **Search**: Type keywords to search rule names and descriptions

### Creating a New Rule

1. Click the **"Add New Rule"** button
2. Fill in the form:
   - **Name**: Short descriptive name
   - **Description**: Detailed explanation of the rule
   - **Category**: Select from dropdown
   - **Severity**: Select importance level
   - **Keywords**: Add detection keywords (press Enter after each)
   - **Active**: Toggle on/off
3. Click **"Create Rule"**

### Editing a Rule

1. Find the rule in the list
2. Click the **pencil icon** (Edit button)
3. Modify the fields as needed
4. Click **"Save Changes"**

### Toggling Rule Status

- Click the **toggle switch** next to any rule to enable/disable it
- Disabled rules won't be used in compliance checks

### Deleting a Rule

1. Click the **trash icon** next to the rule
2. Confirm deletion in the popup dialog

**Warning**: Deleted rules cannot be recovered!

---

## Troubleshooting

### "Cannot connect to database"

1. Make sure PostgreSQL is running:
   ```bash
   pg_ctl -D ~/postgresql/data -l ~/postgresql/logfile -o "-k /tmp" status
   ```
2. If not running, start it:
   ```bash
   pg_ctl -D ~/postgresql/data -l ~/postgresql/logfile -o "-k /tmp" start
   ```

### "500 Internal Server Error"

1. Check the server terminal for error messages
2. Make sure the `.env` file exists in the `server` directory
3. Verify the database connection string is correct

### "Invalid credentials" on login

1. Make sure you verified your email
2. Check that you're using the correct email/password
3. Try resetting your password

### Page not loading / Blank screen

1. Check that both frontend and backend servers are running
2. Clear your browser cache
3. Check the browser console for errors (F12 > Console)

### Rules not showing up

1. Run the seed script to populate rules:
   ```bash
   cd server
   npm run db:seed
   ```

---

## Quick Reference

| Task | How To |
|------|--------|
| Start the app | Run `./start-dev.sh` |
| View rules | Sidebar > Policy Rules |
| Manage rules | Sidebar > Manage Rules |
| Create rule | Manage Rules > Add New Rule |
| Edit rule | Click pencil icon on rule |
| Delete rule | Click trash icon on rule |
| Filter rules | Use dropdowns at top of admin panel |
| Search rules | Type in search box |

---

## Need Help?

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section above
2. Review server logs in the terminal
3. Check browser console for frontend errors

---

*Etsy Listing Compliance Checker - Helping sellers stay compliant*
