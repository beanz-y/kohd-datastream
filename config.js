// functions/config.js

export function onRequest(context) {
  // This function runs on the server and has secure access to your variables.
  const firebaseConfig = {
    apiKey: context.env.VITE_API_KEY,
    authDomain: context.env.VITE_AUTH_DOMAIN,
    databaseURL: context.env.VITE_DATABASE_URL,
    projectId: context.env.VITE_PROJECT_ID,
    storageBucket: context.env.VITE_STORAGE_BUCKET,
    messagingSenderId: context.env.VITE_MESSAGING_SENDER_ID,
    appId: context.env.VITE_APP_ID
  };

  // It sends the configuration to the browser as a JSON object.
  return new Response(JSON.stringify(firebaseConfig), {
    headers: { 'Content-Type': 'application/json' },
  });
}