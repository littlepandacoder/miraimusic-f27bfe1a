#!/bin/bash

# Foundation Modules Migration Script
# Safely runs all pending migrations to Supabase

set -e

PROJECT_ID="ugpgsctazvnhkasqpclg"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🎹 Foundation Modules Migration Script"
echo "======================================"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install it:"
    echo "   brew install supabase/tap/supabase"
    exit 1
fi

echo "✓ Supabase CLI found"
echo ""

# Step 1: Check if user is authenticated
echo "📝 Step 1: Checking authentication..."
if supabase projects list &> /dev/null; then
    echo "✓ Already authenticated"
else
    echo "⚠️  Not authenticated. Redirecting to login..."
    supabase login
    echo "✓ Authentication complete"
fi

echo ""

# Step 2: Link project
echo "🔗 Step 2: Linking project..."
if [ ! -f "$PROJECT_DIR/supabase/.env.local" ]; then
    echo "   Linking to project: $PROJECT_ID"
    supabase link --project-ref "$PROJECT_ID"
    echo "✓ Project linked"
else
    echo "✓ Project already linked"
fi

echo ""

# Step 3: Check migration status
echo "📋 Step 3: Checking migration status..."
echo "   Pending migrations:"
supabase status || true
echo ""

# Step 4: Push migrations
echo "🚀 Step 4: Pushing migrations to Supabase..."
echo "   This will create foundation tables and seed default data"
echo ""

if supabase db push; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "📊 Created tables:"
    echo "   • foundation_modules (5 default modules)"
    echo "   • foundation_lessons (lessons for each module)"
    echo "   • student_foundation_progress (student tracking)"
    echo ""
    echo "🔒 Row Level Security policies applied"
    echo ""
    echo "📖 View your data:"
    echo "   1. Go to https://app.supabase.com"
    echo "   2. Select your project: $PROJECT_ID"
    echo "   3. Go to Table Editor → foundation_modules"
    echo ""
    echo "🎯 Next steps:"
    echo "   • Deploy your app"
    echo "   • Frontend will now save foundation module changes to database"
    echo "   • Student progress will be tracked automatically"
else
    echo ""
    echo "❌ Migration failed. Check the error above."
    echo "   Possible issues:"
    echo "   • Already applied (check: supabase status)"
    echo "   • Permission denied (check project access)"
    echo "   • Network issue (check internet connection)"
    exit 1
fi
