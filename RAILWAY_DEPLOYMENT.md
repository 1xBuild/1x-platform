# Railway Deployment Guide

## Persistent SQLite Database Setup

This project uses SQLite as its database and requires persistent storage on Railway to prevent data loss during deployments and restarts.

### Configuration

1. **railway.toml**: Defines the volume mount configuration
   - Volume name: `sqlite-data`
   - Mount path: `/app/data`
   - The database file will be stored at `/app/data/local_db.db`

2. **Database path logic**: The application automatically detects the Railway environment and uses the appropriate database path:
   - **Production (Railway)**: `/app/data/local_db.db` (persistent volume)
   - **Development (Local)**: `./data/local_db.db` (local filesystem)

### Railway Volume Setup

The `railway.toml` file configures a persistent volume that ensures your SQLite database persists across deployments:

```toml
[[deploy.volumes]]
mountPath = "/app/data"
name = "sqlite-data"
```

### Important Notes

- The volume will be created automatically when you first deploy to Railway
- Data in the volume persists across deployments and container restarts
- The volume is specific to each Railway environment (production, staging, etc.)
- Make sure to backup your database regularly for production environments

### Local Development

For local development, the database will be stored in the `./data/` directory relative to your project root. This directory is ignored by git to prevent accidental commits of local database files.

### Migration from Ephemeral Storage

If you have existing data in an ephemeral deployment, you'll need to backup and restore it after setting up the persistent volume:

1. Export your existing data (before deploying the volume configuration)
2. Deploy the new configuration with persistent volumes
3. Import your data into the new persistent database 