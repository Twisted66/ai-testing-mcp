# Deployment Guide

## Automated Deployment with GitHub Actions

This repository includes automated deployment to Railway via GitHub Actions.

### Setup Steps

#### 1. Get Railway Token
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click your profile → **Account Settings**
3. Go to **Tokens** tab
4. Create new token → Copy the token

#### 2. Add GitHub Secret
1. Go to your GitHub repo: https://github.com/Twisted66/ai-testing-mcp
2. Go to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `RAILWAY_TOKEN`
5. Value: Paste your Railway token
6. Click **Add secret**

#### 3. Create Railway Project
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **New Project**
3. Select **Deploy from GitHub repo**
4. Choose `Twisted66/ai-testing-mcp`
5. Railway will create the project and give you a URL

#### 4. Auto-Deploy Setup Complete!
Now every time you push to `master` branch:
- GitHub Actions runs tests
- Builds the TypeScript
- Deploys to Railway automatically
- Your MCP server updates instantly

### Manual Deployment (Alternative)

If you prefer manual deployment:

#### Option 1: Railway Web Dashboard
1. Go to [railway.app](https://railway.app)
2. Login with GitHub
3. **New Project** → **Deploy from GitHub repo** 
4. Select `Twisted66/ai-testing-mcp`
5. Railway auto-deploys

#### Option 2: Railway CLI (if available)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

### Environment Variables

Railway automatically sets:
- `NODE_ENV=production`
- `PORT` (Railway provides this)

### Monitoring Deployment

#### GitHub Actions
- Go to **Actions** tab in your repo
- Watch the deployment progress
- Green checkmark = successful deployment

#### Railway Dashboard
- View logs in Railway dashboard
- Monitor server health
- Get deployment URL

### Claude Code Configuration

Once deployed, update your Claude Code config:

```json
{
  "mcpServers": {
    "ai-testing": {
      "command": "node",
      "args": ["dist/index.js"],
      "transport": {
        "type": "http", 
        "url": "https://your-project-name.up.railway.app"
      }
    }
  }
}
```

Replace `your-project-name.up.railway.app` with your actual Railway URL.

### Troubleshooting

#### Build Fails
- Check GitHub Actions logs
- Ensure `package.json` has correct scripts
- Verify TypeScript compiles locally

#### Deployment Fails
- Check `RAILWAY_TOKEN` secret is set correctly
- Verify Railway project exists
- Check Railway logs for errors

#### MCP Server Not Responding
- Verify Railway URL is correct in Claude Code config
- Check Railway logs for runtime errors
- Test server endpoint directly: `curl https://your-url/health`

### Adding Health Check

The server includes a basic health check. Test with:
```bash
curl https://your-railway-url.up.railway.app/health
```

Should return server status and available tools.

## Success! 🎉

Your AI Testing MCP server is now:
- ✅ Auto-deployed on every code push
- ✅ Always-on and globally accessible  
- ✅ Monitored with GitHub Actions
- ✅ Ready for Claude Code integration