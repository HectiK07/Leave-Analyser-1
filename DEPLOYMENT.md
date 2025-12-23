# Leave Analyzer - Deployment Guide

This guide covers multiple deployment options application.

## Quick for your Leave Analyzer Deploy Options

### 1. Vercel (Recommended for Next.js)

**One-click deploy:**
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/leave-analyzer)

**Manual deployment:**
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables:
   - `DATABASE_URL` (if using Prisma)
   - `NODE_ENV=production`
4. Deploy automatically on every push

### 2. Netlify

**Manual deployment:**
1. Connect your GitHub repository to Netlify
2. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: 18
3. Add environment variables in Netlify dashboard
4. Deploy automatically on every push

### 3. Docker Deployment

**Build and run locally:**
```bash
# Build the Docker image
docker build -t leave-analyzer .

# Run the container
docker run -p 3000:3000 --env-file .env leave-analyzer
```

**Using Docker Compose:**
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f leave-analyzer
```

### 4. Railway

**One-click deploy:**
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template-url)

**Manual deployment:**
1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Initialize: `railway init`
4. Deploy: `railway up`

### 5. GitHub Actions CI/CD

The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically:
- Builds the application
- Runs security scans
- Deploys to multiple platforms
- Creates Docker images

**Required GitHub Secrets:**
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `RAILWAY_TOKEN`
- `DOCKER_USERNAME`
- `DOCKER_PASSWORD`
- `SNYK_TOKEN`

## Environment Variables

Required environment variables for production:

```env
NODE_ENV=production
DATABASE_URL=postgresql://username:password@host:port/database
```

## Performance Optimizations

### Build Optimization
The included configuration enables:
- Next.js standalone output
- Docker multi-stage builds
- Nginx reverse proxy
- Gzip compression
- Security headers

### Database Migration
Before deploying, run Prisma migrations:
```bash
npx prisma generate
npx prisma db push
```

## Monitoring

### Health Check Endpoint
Add this to your Next.js API routes:
```javascript
// app/api/health/route.js
export async function GET() {
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() });
}
```

### Logging
The Docker configuration includes logging. View logs:
```bash
docker-compose logs -f leave-analyzer
```

## SSL/HTTPS Setup

For production deployments, enable HTTPS:

1. **Vercel**: Automatic SSL certificates
2. **Netlify**: Automatic SSL certificates
3. **Docker**: Uncomment SSL configuration in `nginx.conf`
4. **Railway**: Automatic SSL certificates

## Troubleshooting

### Common Issues

1. **Build failures**:
   - Ensure all environment variables are set
   - Check Node.js version compatibility
   - Run `npm audit fix` to resolve dependency issues

2. **Runtime errors**:
   - Check database connection
   - Verify environment variables
   - Review application logs

3. **Performance issues**:
   - Enable compression
   - Use CDN for static assets
   - Optimize database queries

### Logs Location
- Vercel: Function logs in dashboard
- Netlify: Functions logs in dashboard
- Docker: `docker-compose logs`
- Railway: `railway logs`

## Security Considerations

1. **Environment Variables**: Never commit sensitive data
2. **HTTPS**: Always use HTTPS in production
3. **Headers**: Security headers are configured in nginx.conf
4. **Dependencies**: Regular security audits with `npm audit`

## Scaling

For high traffic:
1. Use multiple replicas (already configured in docker-compose)
2. Set up load balancing
3. Consider database connection pooling
4. Enable CDN for static assets

## Backup Strategy

1. **Database**: Set up automated backups
2. **Code**: Git repository serves as code backup
3. **Uploads**: Consider cloud storage for file uploads

## Support

For deployment issues:
1. Check the respective platform documentation
2. Review application logs
3. Verify environment variables
4. Test locally with production build: `npm run build && npm start`
