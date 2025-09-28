import { NextResponse } from 'next/server'

// GET /api-docs
export async function GET() {
  const swaggerDocument = {
    "openapi": "3.0.0",
    "info": {
      "title": "Team Task Manager API",
      "description": "Comprehensive API for team task management with authentication, analytics, and file attachments",
      "version": "2.0.0"
    },
    "servers": [
      {
        "url": "/api/v1",
        "description": "API v1"
      }
    ],
    "paths": {
      "/tasks": {
        "get": {
          "summary": "List tasks",
          "description": "Retrieve tasks with filtering and pagination",
          "responses": {
            "200": {
              "description": "List of tasks"
            }
          }
        }
      }
    }
  }
  
  return NextResponse.json(swaggerDocument)
}