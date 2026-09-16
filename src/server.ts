import app from './app';
import prisma from './config/database';
import { initializeCronJobs, startCronJobs } from './utils/cron';

const PORT = process.env.PORT || 5000;
const ENABLE_CRON_JOBS = process.env.ENABLE_CRON_JOBS === 'true';

const startServer = async () => {
  try {
    // NOTE: Don't call $connect() explicitly - Prisma connects lazily
    // Calling it here wastes a connection in serverless environments
    // Prisma Client will connect automatically on first query
    // Just test with a simple query (only for non-serverless)
    if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Database connected successfully');
    } else {
      console.log('✅ Server starting (Prisma will connect on first query in serverless)');
    }
    
    // Log connection pool info if available
    const dbUrl = process.env.DATABASE_URL || '';
    if (dbUrl.includes('connection_limit')) {
      console.log('✅ Connection pooling configured in DATABASE_URL');
    } else {
      console.warn('⚠️  Consider adding connection_limit to DATABASE_URL to prevent connection exhaustion');
      console.warn('   Example: mysql://user:pass@host:3306/db?connection_limit=5&pool_timeout=20');
    }

    initializeCronJobs();

    if (ENABLE_CRON_JOBS) {
      startCronJobs();
      console.log('📅 Cron jobs are ENABLED');
    } else {
      console.log('📅 Cron jobs are DISABLED (set ENABLE_CRON_JOBS=true to enable)');
    }

    // Vercel invokes this Express app as a serverless function and manages the listener.
    // Keep the local listener code for normal Node.js development only.
    if (!process.env.VERCEL) {
      app.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
        console.log(`📍 Environment: ${process.env.NODE_ENV}`);
        console.log(`🔗 Health check: http://localhost:${PORT}/health`);
        console.log(`🔗 Test subscription expiry: http://localhost:${PORT}/api/subscriptions/check/expiring`);
      });
    }
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏳ Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Local Node.js startup is disabled on Vercel; Vercel imports the exported app.
if (!process.env.VERCEL) {
  startServer();
}

export default app;
