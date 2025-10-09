#!/bin/bash

# Database Setup Script for Vercel Deployment
echo "🚀 Setting up database for Team Task Manager..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    echo "Please set your DATABASE_URL first:"
    echo "export DATABASE_URL='your-database-connection-string'"
    exit 1
fi

echo "✅ DATABASE_URL is set"

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Push database schema
echo "🗄️  Pushing database schema..."
npx prisma db push

# Seed database (optional)
echo "🌱 Seeding database..."
npx prisma db seed

echo "✅ Database setup complete!"
echo "🎉 Your Team Task Manager is ready to deploy!"