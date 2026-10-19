// SECURITY KILL SWITCH - 2026-10-19
// This backend is retired. FluentWave's study-abroad layer moves into the FluentWave app
// (https://fluentwave-app.vercel.app) on one Supabase database with Google sign-in and row-level security.
// Every request now gets 503 and the Express app is never loaded, so none of its routes,
// its database connection or any seeding code can run.
export default function handler(_req: any, res: any) {
  res.statusCode = 503;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify({ status: 'offline', moved_to: 'https://fluentwave-app.vercel.app' }));
}