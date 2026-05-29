import app from './app';
import logger from './utils/logger';

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

process.on('unhandledRejection', (err: any) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});
