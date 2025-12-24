# User Profile Management

This document explains the user profile management system in the `users` Django app. It covers the models, serializers, views, URLs, and provides step-by-step instructions for testing all endpoints from user registration to profile deletion.

## Overview

The `users` app handles user profile data, which extends the default Django User model with additional fields like gender, degree, department, etc. Profiles are automatically created when a new user registers (via a post_save signal in `apps.py`). The app uses Django REST Framework (DRF) for API endpoints, with JWT authentication required for all profile operations.

Key components:
- **Model**: `UserProfile` (OneToOne with User)
- **Serializer**: `UserProfileSerializer` (includes read-only user fields)
- **Views**: `UserProfileView` (CRUD operations) and `UserProfileCompletionView` (completion status)
- **Authentication**: JWT (from `rest_framework_simplejwt`)
- **URLs**: `/api/users/profile/` and `/api/users/profile/completion/`

## Models

### UserProfile
- **Fields**:
  - `user`: OneToOneField to Django's User model
  - `display_name`: CharField (optional)
  - `gender`: CharField with choices (M/F/O)
  - `degree`: CharField with choices (e.g., B.Tech, M.Tech)
  - `department`: CharField with choices (e.g., CSE, ECE)
  - `phone_number`: CharField
  - `college_name`: CharField (default: "Rajalakshmi Engineering College")
  - `profile_picture`: URLField (optional)
  - `is_profile_complete`: BooleanField (property-based on required fields)
  - `date_of_birth`: DateField (optional)
  - `bio`: TextField (optional)
  - `created_at`/`updated_at`: Auto timestamps
- **Property**: `is_profile_complete` checks if gender, degree, department, and phone_number are filled.
- **Choices**: Defined in `choices.py` for gender, degree, and department.

## Serializers

### UserProfileSerializer
- Serializes `UserProfile` with additional read-only fields from the User model: `username`, `email`, `first_name`, `last_name`.
- Read-only fields: `created_at`, `updated_at`, `is_profile_complete`.
- Used for GET/PUT/PATCH responses.

## Views

### UserProfileView (APIView)
- **Authentication**: JWT required (`JWTAuthentication`, `IsAuthenticated`)
- **Methods**:
  - `GET`: Retrieve the authenticated user's profile (200 OK or 404 if not found)
  - `PUT`: Fully update the profile (requires all fields; 200 OK or 400 for errors)
  - `PATCH`: Partially update the profile (doesn't require all fields; 200 OK or 400 for errors)
  - `DELETE`: Delete the profile (204 No Content or 404)

### UserProfileCompletionView (APIView)
- **Authentication**: JWT required
- **Methods**:
  - `GET`: Return profile completion status and missing fields (200 OK or 404)

## URLs

- `profile/`: Maps to `UserProfileView` (supports GET/PUT/PATCH/DELETE)
- `profile/completion/`: Maps to `UserProfileCompletionView` (supports GET)

Assuming the main `urls.py` prefixes with `/api/users/`, full paths are `/api/users/profile/` and `/api/users/profile/completion/`.

## Apps Configuration

- `apps.py`: Includes a `post_save` signal that creates a `UserProfile` automatically when a new User is created (e.g., via registration).

## Testing Endpoints (Step-by-Step)

This guide assumes:
- Django server is running: `python manage.py runserver`
- Postman or curl for testing
- JWT token from login

### Prerequisites
1. Register a user via `/api/auth/register/` (POST with username, email, password, etc.).
2. Login via `/api/auth/login/` (POST with credentials) to get JWT access token.
3. Use the token in `Authorization: Bearer <token>` header for all requests.

### 1. Register User
- **Endpoint**: `/api/auth/register/` (from `authentication` app)
- **Method**: POST
- **Body** (JSON):
  ```json
  {
    "username": "testuser",
    "email": "test@example.com",
    "password1": "strongpassword123",
    "password2": "strongpassword123",
    "firstname": "Test",
    "lastname": "User"
  }
  ```
- **Expected**: 201 Created. Profile is auto-created via signal.

### 2. Login and Get Token
- **Endpoint**: `/api/auth/login/`
- **Method**: POST
- **Body** (JSON):
  ```json
  {
    "username": "testuser",
    "password": "strongpassword123"
  }
  ```
- **Expected**: 200 OK with `{"access": "<token>", "refresh": "<refresh_token>"}`. Use `access` token for profile requests.

### 3. Get Profile
- **Endpoint**: `/api/users/profile/`
- **Method**: GET
- **Headers**: `Authorization: Bearer <token>`
- **Expected**: 200 OK with profile JSON (initially with empty fields except defaults).
- **Postman Steps**:
  1. New request > GET > URL: `http://127.0.0.1:8000/api/users/profile/`
  2. Headers: `Authorization` = `Bearer <token>`
  3. Send.

### 4. Update Profile (PUT)
- **Endpoint**: `/api/users/profile/`
- **Method**: PUT
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Body** (JSON): All fields, e.g.,
  ```json
  {
    "display_name": "My Name",
    "gender": "M",
    "degree": "BTech",
    "department": "CSE",
    "phone_number": "1234567890",
    "college_name": "Rajalakshmi Engineering College",
    "profile_picture": "https://example.com/pic.jpg",
    "date_of_birth": "1990-01-01",
    "bio": "My bio"
  }
  ```
- **Expected**: 200 OK with updated JSON.
- **Postman Steps**:
  1. Duplicate GET request > Change to PUT.
  2. Body tab > raw > JSON > Paste data.
  3. Send.

### 5. Partially Update Profile (PATCH)
- **Endpoint**: `/api/users/profile/`
- **Method**: PATCH
- **Headers**: Same as PUT
- **Body** (JSON): Only fields to update, e.g., `{"display_name": "Updated Name"}`
- **Expected**: 200 OK 
- **Postman Steps**: Similar to PUT, but PATCH method and partial body.

### 6. Check Profile Completion
- **Endpoint**: `/api/users/profile/completion/`
- **Method**: GET
- **Headers**: `Authorization: Bearer <token>`
- **Expected**: 200 OK with `{"is_complete": true/false, "missing_fields": ["field1", ...]}`
- **Postman Steps**: New request > GET > URL: `http://127.0.0.1:8000/api/users/profile/completion/` > Headers > Send.

### 7. Delete Profile
- **Endpoint**: `/api/users/profile/`
- **Method**: DELETE
- **Headers**: `Authorization: Bearer <token>`
- **Expected**: 204 No Content.
- **Postman Steps**:
  1. Duplicate GET request > Change to DELETE.
  2. Send (no body needed).

### Additional Notes
- **Errors**: 401 for invalid token, 404 for missing profile, 400 for validation errors.
- **Testing Tools**: Use Postman for GUI or curl (e.g., `curl -X GET -H "Authorization: Bearer <token>" http://127.0.0.1:8000/api/users/profile/`).
- **Unit Tests**: Add to `tests.py` using `APITestCase` for automated testing.
- **Fixes**: Change PATCH to `partial=True` in `views.py` for proper partial updates. Ensure `users` is in `INSTALLED_APPS`.