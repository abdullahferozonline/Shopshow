*** Begin Patch
*** Update File: backend/src/index.ts
@@
-import express from 'express';
-import dotenv from 'dotenv';
-import productsRouter from './routes/products';
-
-dotenv.config();
-const app = express();
-app.use(express.json());
-
-app.use('/api/products', productsRouter);
-
-app.get('/health', (req, res) => res.json({ ok: true }));
-
-const port = process.env.PORT || 4000;
-app.listen(port, () => console.log(`Backend listening on ${port}`));
+import express from 'express';
+import dotenv from 'dotenv';
+import cors from 'cors';
+import productsRouter from './routes/products';
+import authRouter from './routes/auth';
+
+dotenv.config();
+const app = express();
+app.use(cors());
+app.use(express.json());
+
+// Public auth routes
+app.use('/api/auth', authRouter);
+
+// Product routes (can add requireAuth middleware to protect write routes later)
+app.use('/api/products', productsRouter);
+
+app.get('/health', (req, res) => res.json({ ok: true }));
+
+const port = process.env.PORT || 4000;
+app.listen(port, () => console.log(`Backend listening on ${port}`));
*** End Patch
