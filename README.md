# MGNREGA Dashboard Backend

Backend API for the "Our Voice, Our Rights" MGNREGA Dashboard project.

## Tech Stack

- **Node.js + Express** - REST API server
- **PostgreSQL** - Primary database for data storage
- **Redis** - Caching layer to reduce API and DB load
- **Axios** - HTTP client for government API calls
- **Node-cron** - Scheduled data synchronization

## Features

- ✅ Fetch data from official MGNREGA Open API
- ✅ Store data in PostgreSQL for offline access
- ✅ Redis caching for optimized performance
- ✅ Automated daily data refresh via cron jobs
- ✅ REST endpoints for states, districts, and performance data
- ✅ Fallback to cached/stored data if API is down
- ✅ Comprehensive error handling and logging

## Project Structure

```
/root/MHSite/
├── src/
│   ├── config/
│   │   └── index.js          # Configuration management
│   ├── db/
│   │   ├── postgres.js       # PostgreSQL connection
│   │   ├── redis.js          # Redis connection & helpers
│   │   └── schema.sql        # Database schema
│   ├── routes/
│   │   ├── index.js          # Root routes
│   │   ├── mgnrega.js        # MGNREGA data routes
│   │   └── admin.js          # Admin routes
│   ├── services/
│   │   └── mgnregaService.js # MGNREGA API service
│   ├── utils/
│   │   ├── cronJobs.js       # Cron job configuration
│   │   └── initDb.js         # Database initialization
│   └── index.js              # Main Express app
├── .env                       # Environment variables
├── .gitignore
├── package.json
└── README.md
```

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Initialize the database:**
   ```bash
   npm run init-db
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

## API Endpoints

### Public Endpoints

#### 1. Health Check
```
GET /api/health
```
Returns server health status.

#### 2. Get All States
```
GET /api/states
```
Returns list of all available states with MGNREGA data.

**Response:**
```json
{
  "success": true,
  "count": 28,
  "data": [
    {
      "state_name": "Andhra Pradesh",
      "state_code": "AP",
      "total_districts": 13,
      "last_synced": "2025-10-27T10:30:00.000Z"
    }
  ]
}
```

#### 3. Get Districts by State
```
GET /api/districts/:state
```
Returns all districts in a specific state.

**Example:**
```
GET /api/districts/Andhra Pradesh
```

#### 4. Get Performance Data
```
GET /api/performance/:district?year=YYYY
```
Returns performance data for a district, optionally filtered by year.

**Examples:**
```
GET /api/performance/Anantapur
GET /api/performance/Anantapur?year=2023-2024
```

**Response:**
```json
{
  "success": true,
  "district": "Anantapur",
  "year": "2023-2024",
  "data": [
    {
      "state_name": "Andhra Pradesh",
      "district_name": "Anantapur",
      "fin_year": "2023-2024",
      "total_expenditure": 15000000,
      "total_households_worked": 45000,
      "total_persondays_generated": 1200000,
      "total_women_persondays": 600000,
      "avg_days_employment_provided": 45.5,
      "last_updated": "2025-10-27T10:30:00.000Z"
    }
  ]
}
```

### Admin Endpoints

#### 1. Trigger Manual Sync
```
POST /api/admin/sync?state=StateName&year=YYYY
```
Manually trigger data synchronization from MGNREGA API.

**Examples:**
```
POST /api/admin/sync
POST /api/admin/sync?state=Andhra Pradesh&year=2023-2024
```

#### 2. Get Sync Status
```
GET /api/admin/sync-status?limit=10
```
Returns recent synchronization logs.

#### 3. Get Database Statistics
```
GET /api/admin/stats
```
Returns overall database statistics.

## Environment Variables

See `.env` file for configuration:

- `PORT` - Server port (default: 3000)
- `MGNREGA_API_KEY` - Government API key
- `MGNREGA_BASE_URL` - Government API endpoint
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_HOST` - Redis server host
- `REDIS_PORT` - Redis server port
- `REDIS_PASSWORD` - Redis password
- `CRON_SCHEDULE` - Cron schedule for auto-sync

## Caching Strategy

- **States list:** Cached for 1 hour
- **Districts list:** Cached for 1 hour per state
- **Performance data:** Cached for 30 minutes per district/year
- Cache is automatically cleared after successful sync

## Error Handling

The system implements comprehensive error handling:

1. **API Down:** Automatically serves from cache or database
2. **Database Errors:** Logged and returned with appropriate status codes
3. **Redis Errors:** Gracefully falls back to direct database queries
4. **Validation Errors:** Returns 400 with error details

## Logging

The system logs key operations:

- ✅ PostgreSQL connected successfully
- ⚡ Redis cache connected
- 🔄 API fetch success
- 💾 DB save success
- ❌ Error messages with details

## Scheduled Tasks

A cron job runs daily at 2 AM to refresh MGNREGA data automatically:
- Fetches latest data from government API
- Updates PostgreSQL database
- Clears Redis cache
- Logs sync results

## Development

```bash
# Install dependencies
npm install

# Initialize database
npm run init-db

# Run in development mode
npm run dev

# Run in production mode
npm start
```

## Testing

Test the endpoints:

```bash
# Health check
curl http://localhost:3000/api/health

# Get states
curl http://localhost:3000/api/states

# Get districts
curl http://localhost:3000/api/districts/Andhra%20Pradesh

# Get performance data
curl http://localhost:3000/api/performance/Anantapur?year=2023-2024

# Trigger manual sync
curl -X POST http://localhost:3000/api/admin/sync

# Get sync status
curl http://localhost:3000/api/admin/sync-status

# Get database stats
curl http://localhost:3000/api/admin/stats
```

## License

ISC

## Support

For issues and questions, please refer to the project documentation.
