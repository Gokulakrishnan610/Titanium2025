# Multi-Club System Setup Guide

This guide explains how to set up and use the multi-club system for your event management platform.

## Overview

The multi-club system allows you to manage multiple clubs within a single platform. Each club can:
- Have its own events, members, and settings
- Use separate payment gateway credentials
- Maintain its own branding (logo, colors, banner)
- Have dedicated administrators and moderators
- Configure club-specific settings

## Installation Steps

### 1. Run Migrations

First, create and apply the database migrations for the new clubs app:

```bash
cd radiumB
python manage.py makemigrations clubs
python manage.py makemigrations event
python manage.py migrate
```

### 2. Create Default Club

Run the setup command to create a default club and migrate existing events:

```bash
python manage.py setup_default_club --club-name "DEVS REC" --club-email "devs@rajalakshmi.edu.in"
```

To add an admin user to the club:

```bash
python manage.py setup_default_club --admin-username your_admin_username
```

### 3. Access Admin Panel

Navigate to the Django admin panel at `http://localhost:8000/admin/` and you'll see new sections:
- **Clubs** - Manage clubs
- **Club Memberships** - Manage club members and roles
- **Club Settings** - Configure club-specific settings

## Creating a New Club

### Via Admin Panel

1. Go to **Clubs** → **Add Club**
2. Fill in the required information:
   - **Name**: Club name (e.g., "Tech Club")
   - **Slug**: URL-friendly identifier (auto-generated from name)
   - **Description**: Brief description of the club
   - **Club Type**: Select from technical, cultural, sports, etc.
   - **Email**: Official club email
   - **Status**: Active/Inactive/Suspended
   - **Payment Gateway**: Choose Cashfree or PayU
   - **Gateway Credentials**: Add payment gateway credentials in JSON format

3. Configure visual identity:
   - Upload logo and banner
   - Set primary and secondary colors

4. Add club members:
   - Use the inline form to add members
   - Assign roles (Admin, Moderator, Event Manager, Member)
   - Set permissions for each member

5. Configure club settings (optional):
   - Email signature
   - Default event duration
   - Registration settings
   - Payment terms
   - Social media links

### Via API

```bash
POST /api/clubs/
{
  "name": "Tech Club",
  "slug": "tech-club",
  "description": "Technology and innovation club",
  "club_type": "technical",
  "email": "tech@example.com",
  "status": "active",
  "payment_gateway": "cashfree"
}
```

## Managing Club Members

### Roles and Permissions

- **Admin**: Full control over club, events, members, and payments
- **Moderator**: Can create events, manage members, view analytics
- **Event Manager**: Can create events and view analytics
- **Member**: Basic membership, no special permissions

### Adding Members

1. Go to **Club Memberships** → **Add Club Membership**
2. Select the club and user
3. Choose a role
4. Set status (Active/Inactive/Pending)
5. Permissions are auto-assigned based on role

## Creating Events for a Club

When creating an event, you must now select which club is organizing it:

1. Go to **Events** → **Add Event**
2. Select the **Club** from the dropdown
3. Fill in event details as usual
4. The event will use the club's payment gateway credentials by default

## Payment Gateway Configuration

### Per-Club Credentials

Each club can have its own payment gateway credentials:

1. Go to **Clubs** → Select a club → Edit
2. Scroll to **Payment Configuration**
3. Select payment gateway (Cashfree or PayU)
4. Add credentials in JSON format:

**For Cashfree:**
```json
{
  "app_id": "your_app_id",
  "secret_key": "your_secret_key",
  "webhook_secret": "your_webhook_secret",
  "environment": "TEST"
}
```

**For PayU:**
```json
{
  "merchant_key": "your_merchant_key",
  "merchant_salt": "your_merchant_salt",
  "environment": "TEST"
}
```

### Fallback to System Credentials

If a club doesn't have custom credentials, the system will use the default credentials from environment variables.

## API Endpoints

### Clubs

- `GET /api/clubs/` - List all clubs
- `GET /api/clubs/{slug}/` - Get club details
- `POST /api/clubs/` - Create a new club (admin only)
- `PUT /api/clubs/{slug}/` - Update club
- `DELETE /api/clubs/{slug}/` - Delete club
- `GET /api/clubs/{slug}/events/` - Get club events
- `GET /api/clubs/{slug}/members/` - Get club members
- `GET /api/clubs/my_clubs/` - Get current user's clubs
- `POST /api/clubs/{slug}/join/` - Join a club
- `POST /api/clubs/{slug}/leave/` - Leave a club

### Club Memberships

- `GET /api/memberships/` - List memberships
- `POST /api/memberships/` - Create membership
- `POST /api/memberships/{id}/approve/` - Approve pending membership
- `POST /api/memberships/{id}/reject/` - Reject pending membership

### Club Settings

- `GET /api/settings/` - List club settings
- `GET /api/settings/{id}/` - Get specific club settings
- `PUT /api/settings/{id}/` - Update club settings

## Frontend Integration

### Fetching Clubs

```javascript
// Get all active clubs
const response = await fetch('/api/clubs/?status=active');
const clubs = await response.json();

// Get specific club
const clubResponse = await fetch('/api/clubs/tech-club/');
const club = await clubResponse.json();

// Get user's clubs
const myClubsResponse = await fetch('/api/clubs/my_clubs/');
const myClubs = await myClubsResponse.json();
```

### Filtering Events by Club

```javascript
// Get events for a specific club
const eventsResponse = await fetch('/api/clubs/tech-club/events/');
const events = await eventsResponse.json();
```

## Migration from Single-Club to Multi-Club

If you're migrating from a single-club system:

1. All existing events will be automatically assigned to the default club
2. Existing admin users should be added as club admins
3. Payment gateway credentials can be migrated to club-specific settings
4. No changes needed to existing event registrations or participants

## Best Practices

1. **Default Club**: Always have one default club for system-wide events
2. **Permissions**: Assign appropriate roles to prevent unauthorized access
3. **Payment Credentials**: Store sensitive credentials securely, use environment variables when possible
4. **Club Status**: Use "Inactive" instead of deleting clubs to preserve historical data
5. **Branding**: Maintain consistent branding across club materials

## Troubleshooting

### Events not showing club field

Run migrations:
```bash
python manage.py makemigrations event
python manage.py migrate
```

### Existing events have no club

Run the setup command:
```bash
python manage.py setup_default_club
```

### Payment gateway not working

1. Check club payment gateway configuration
2. Verify credentials are in correct JSON format
3. Check environment variables as fallback
4. Review payment gateway logs in admin panel

## Support

For issues or questions, contact the development team or refer to the main documentation.
