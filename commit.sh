#!/bin/bash
cd /workspaces/miraimusic-f27bfe1a
git add .
git commit -m "feat: Add Review button for completed modules

- Students can now review completed modules
- Review button appears in both module card and modal views
- Clicking Review navigates to the lesson plan page
- Enables students to go back and review lesson content"
git push origin main
echo "Done!"
