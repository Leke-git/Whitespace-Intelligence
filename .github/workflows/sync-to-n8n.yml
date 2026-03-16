name: Sync to n8n

on:
  push:
    branches:
      - main
    paths:
      - 'n8n/**'

jobs:
  sync:
    name: Sync Workflows to n8n
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Find changed workflow files
        id: changed
        run: |
          CHANGED=$(git diff --name-only HEAD~1 HEAD -- 'n8n/**/*.json' 2>/dev/null || \
                    git diff --name-only $(git hash-object -t tree /dev/null) HEAD -- 'n8n/**/*.json')
          echo "Changed files:"
          echo "$CHANGED"
          echo "files<<EOF" >> $GITHUB_OUTPUT
          echo "$CHANGED" >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT

      - name: Sync workflows to n8n
        if: steps.changed.outputs.files != ''
        env:
          N8N_BASE_URL: ${{ secrets.N8N_BASE_URL }}
          N8N_API_KEY: ${{ secrets.N8N_API_KEY }}
          CHANGED_FILES: ${{ steps.changed.outputs.files }}
        run: node scripts/sync.js

      - name: No workflow changes detected
        if: steps.changed.outputs.files == ''
        run: echo "No n8n workflow files changed. Skipping sync."
