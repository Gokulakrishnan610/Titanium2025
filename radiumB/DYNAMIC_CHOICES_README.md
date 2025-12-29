# Dynamic Year and Department Choices

## Overview
Year and Department choices are now **dynamic** and can be managed from the Django admin panel instead of being hardcoded in the source code.

## Features

### ✅ What Changed
- **Before**: Year and department choices were hardcoded in `users/choices.py`
- **After**: Choices are stored in the database and can be managed via Django admin

### 🎯 Benefits
1. **Admin Control**: Add, edit, or deactivate years and departments without code changes
2. **Flexibility**: Easily add new departments or academic years
3. **Order Management**: Control the display order of choices
4. **Category Filtering**: Filter departments by category (UG, PG, PhD)
5. **Active/Inactive**: Temporarily disable choices without deleting them

## Database Models

### Year Model
- `code`: Year code (e.g., '1', '2', 'PG1', 'PhD')
- `display_name`: Display name (e.g., '1st Year', '2nd Year')
- `is_active`: Whether this year is currently active
- `order`: Display order (lower numbers appear first)

### Department Model
- `code`: Department code (e.g., 'CSE', 'ECE', 'MBA')
- `full_name`: Full department name
- `category`: UG (Undergraduate), PG (Postgraduate), or PhD (Doctoral)
- `is_active`: Whether this department is currently active
- `order`: Display order within category

## Admin Panel

### Managing Years
1. Go to Django Admin → **Academic Years**
2. Add new years, edit existing ones, or deactivate old ones
3. Use the `order` field to control display sequence
4. Toggle `is_active` to show/hide choices

### Managing Departments
1. Go to Django Admin → **Departments**
2. Add new departments with code, full name, and category
3. Filter by category (UG/PG/PhD) using the sidebar
4. Reorder departments using the `order` field
5. Toggle `is_active` to show/hide choices

## API Endpoints

### Get All Active Years
```
GET /api/users/choices/years/
```

**Response:**
```json
[
  {"code": "1", "display_name": "1st Year"},
  {"code": "2", "display_name": "2nd Year"},
  {"code": "3", "display_name": "3rd Year"},
  {"code": "4", "display_name": "4th Year"},
  {"code": "PG1", "display_name": "PG 1st Year"},
  {"code": "PG2", "display_name": "PG 2nd Year"},
  {"code": "PhD", "display_name": "Ph.D."}
]
```

### Get All Active Departments
```
GET /api/users/choices/departments/
```

**Response:**
```json
[
  {
    "code": "CSE",
    "full_name": "Computer Science & Engineering",
    "category": "UG"
  },
  {
    "code": "ECE",
    "full_name": "Electronics & Communication Engineering",
    "category": "UG"
  },
  ...
]
```

### Get Departments by Category
```
GET /api/users/choices/departments/?category=UG
GET /api/users/choices/departments/?category=PG
GET /api/users/choices/departments/?category=PhD
```

## Management Commands

### Populate Default Data
```bash
python manage.py populate_dynamic_choices
```

This command populates the database with all existing year and department choices from the hardcoded lists.

### Clear and Repopulate
```bash
python manage.py populate_dynamic_choices --clear
```

This clears all existing data and repopulates with defaults. **Use with caution!**

## User Profile Integration

### Display Names
The `UserProfile` model now has properties to get display names:

```python
user_profile = UserProfile.objects.get(user=user)

# Get year display name
print(user_profile.year_display)  # "2nd Year"

# Get department display name
print(user_profile.department_display)  # "Computer Science & Engineering"
```

### API Serializer
The `UserProfileSerializer` now includes:
- `year_display`: Read-only field showing the year's display name
- `department_display`: Read-only field showing the department's full name

## Frontend Integration

### Fetching Choices
```javascript
// Fetch years
const years = await fetch('/api/users/choices/years/').then(r => r.json());

// Fetch all departments
const departments = await fetch('/api/users/choices/departments/').then(r => r.json());

// Fetch only UG departments
const ugDepartments = await fetch('/api/users/choices/departments/?category=UG').then(r => r.json());
```

### Building Dropdowns
```javascript
// Year dropdown
<select name="year">
  {years.map(year => (
    <option key={year.code} value={year.code}>
      {year.display_name}
    </option>
  ))}
</select>

// Department dropdown
<select name="department">
  {departments.map(dept => (
    <option key={dept.code} value={dept.code}>
      {dept.full_name}
    </option>
  ))}
</select>
```

## Migration

### Existing Data
All existing user profiles will continue to work. The year and department codes remain the same, but now they reference the dynamic database tables.

### Backward Compatibility
The system falls back to hardcoded choices if dynamic models don't exist, ensuring backward compatibility.

## Default Data Included

### Years (7 total)
- 1st Year, 2nd Year, 3rd Year, 4th Year
- PG 1st Year, PG 2nd Year
- Ph.D.

### Departments (36 total)

**Undergraduate (19)**
- Aeronautical, Automobile, Biomedical, Civil
- Computer Science & Design, CSE, CSE (Cyber Security)
- EEE, ECE, Mechanical, Mechatronics, Robotics
- AI & Data Science, AI & Machine Learning
- Biotechnology, Chemical, CSBS, Food Technology, IT

**Postgraduate (9)**
- Avionics, Communication Systems, Engineering Design
- Embedded Systems, Medical Electronics
- CSE (PG), Biotechnology (PG), Data Science, MBA

**Doctoral (8)**
- PhD in: Biotechnology, BME, Chemistry, CSE, ECE, EEE, Mathematics, Mechanical

## Best Practices

1. **Don't Delete**: Use `is_active=False` instead of deleting choices
2. **Order Matters**: Use the `order` field to control display sequence
3. **Consistent Codes**: Keep department codes consistent across the system
4. **Test Changes**: Test in development before making changes in production
5. **Backup First**: Always backup the database before running `--clear`

## Troubleshooting

### Choices Not Showing
- Check if choices are marked as `is_active=True`
- Run `python manage.py populate_dynamic_choices` if database is empty

### API Returns Empty
- Ensure migrations are run: `python manage.py migrate`
- Populate data: `python manage.py populate_dynamic_choices`

### Old Hardcoded Choices Still Showing
- Clear browser cache
- Restart Django server
- Check that frontend is using the new API endpoints

## Support

For issues or questions, contact the development team or check the Django admin panel for managing choices.
