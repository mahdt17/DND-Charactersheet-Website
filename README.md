# Adventurer's Ledger

D&D character manager built with React, Vite, and Supabase.

## Current foundation

- Supabase email/password authentication
- Per-user character storage with Row Level Security
- Character manager UI
- GitHub Pages deployment workflow
- Content database foundation for future rules/content browser

## Environment

Copy `.env.example` to `.env` for local development and provide:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Never put a Supabase secret/service-role key in frontend code.
