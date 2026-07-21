/**
 * @file server.ts
 * @description Express 4 + Apollo Server 4 bootstrap for the Contacts BFF.
 *
 * PATTERN: A fresh `emailLoader` is created in the per-request `context` so its
 *   batching/cache lives for exactly one GraphQL operation and never leaks
 *   between users. CORS is enabled for the Angular dev origin.
 *
 * SIMPLIFICATION: No auth. Production would validate a JWT here and pass the
 *   authenticated principal down through context.
 */

import 'dotenv/config'; // load bff/.env before any module reads process.env

import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { json } from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';

import { typeDefs } from './schema/typeDefs.js';
import { resolvers, type GraphQLContext } from './resolvers/index.js';
import { createEmailLoader } from './dataloaders/emailLoader.js';

async function bootstrap(): Promise<void> {
  const app = express();
  const httpServer = http.createServer(app);

  const apollo = new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
    // Graceful shutdown: stop accepting new connections when the process exits.
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await apollo.start();

  app.use(
    '/graphql',
    cors<cors.CorsRequest>(),
    json(),
    expressMiddleware(apollo, {
      // New DataLoader per request → correct batching, no cross-request cache.
      context: async (): Promise<GraphQLContext> => ({
        emailLoader: createEmailLoader(),
      }),
    }),
  );

  // Lightweight liveness probe (handy for `npm run dev` sanity checks).
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'contacts-bff' });
  });

  const port = Number(process.env['PORT'] ?? 4000);
  await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));

  // eslint-disable-next-line no-console
  console.log(`🚀 Contacts BFF ready at http://localhost:${port}/graphql`);
  if (!process.env['MOCKAPI_BASE_URL']) {
    // eslint-disable-next-line no-console
    console.warn(
      '⚠️  MOCKAPI_BASE_URL is not set — queries will fail until you add it to bff/.env',
    );
  }
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start BFF:', error);
  process.exit(1);
});
