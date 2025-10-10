# Testing Authentication

## Default Admin Account

For testing purposes, a default admin account has been configured:

- **Email**: `admin@test.com`
- **Password**: `admin123`

## Existing Test Accounts from Seed Data

The database seed script also creates the following test accounts:

1. **Admin User**:
   - Email: `john@doe.com`
   - Password: `johndoe123`

2. **Manager User**:
   - Email: `alice@example.com`
   - Password: `password123`

3. **Member Users**:
   - Email: `bob@example.com`
   - Password: `password123`

   - Email: `carol@example.com`
   - Password: `password123`

## Creating the Default Admin User

To create the default admin user, run:

```bash
npm run create-admin
```

This will create an admin user with the credentials above if one doesn't already exist.

## Development Mode

In development mode, the authentication system will bypass password validation for the default admin account to make testing easier.

## Troubleshooting

If you're experiencing authentication issues:

1. Make sure the database is properly configured and accessible
2. Ensure the default admin user exists by running `npm run create-admin`
3. Check that the `NEXTAUTH_SECRET` environment variable is set
4. Verify that the database connection string is correctly configured in `DATABASE_URL`