# API Configuration System

This directory contains the centralized API configuration for the Free Splitwise app.

## Files

- `api.js` - Main API service with environment-based configuration

## How It Works

The API service automatically detects the environment and uses the appropriate API endpoints:

- **Development**: `http://localhost:8080` (for local backend)
- **Production**: `https://api.splitwise.world` (for production backend)

## Environment Configuration

### Automatic Detection

The system automatically detects the environment using:

1. `process.env.REACT_APP_API_ENV` (custom override)
2. `process.env.NODE_ENV` (fallback)

### Manual Override

You can override the API environment by creating environment files:

#### For Development (.env.development)
```
REACT_APP_API_ENV=development
```

#### For Production (.env.production)
```
REACT_APP_API_ENV=production
```

#### For Local Testing (.env.local)
```
# Override for local development
REACT_APP_API_ENV=development

# Or use production APIs locally
REACT_APP_API_ENV=production
```

## Usage in Components

Instead of using `fetch()` directly, import and use the API service:

```javascript
import apiService from '../config/api';

// Get all groups
const groups = await apiService.getAllGroups();

// Create a group
const newGroup = await apiService.createGroup('My Group');

// Authenticate user
await apiService.authenticate(googleToken);

// Get entries for a group
const entries = await apiService.getEntries(groupId);
```

## Available Methods

- `authenticate(token)` - Authenticate with Google token
- `getAllGroups()` - Get all user groups
- `createGroup(name)` - Create a new group
- `getEntries(groupId)` - Get entries for a group
- `createEntry(entryData)` - Create a new entry
- `updateEntry(entryData)` - Update an existing entry
- `deleteEntry(entryId)` - Delete an entry
- `logout()` - Logout user

## Debugging

To check which API configuration is being used:

```javascript
import { getApiInfo } from '../config/api';

console.log(getApiInfo());
// Shows: { environment: 'development', baseURL: 'http://localhost:8080', config: {...} }
```

## Adding New Endpoints

To add new API endpoints:

1. Add the endpoint to both `development` and `production` configs in `api.js`
2. Add a method to the `ApiService` class
3. Export the method for use in components

Example:
```javascript
// In API_CONFIG
endpoints: {
  // ... existing endpoints
  newEndpoint: '/api/new-endpoint'
}

// In ApiService class
async callNewEndpoint(data) {
  return this.request(this.endpoints.newEndpoint, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}
``` 