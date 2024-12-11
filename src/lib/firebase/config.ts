interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export const getFirebaseConfig = (): FirebaseConfig => {
  console.log('Environment:', {
    isServer: typeof window === 'undefined',
    isDev: process.env.NODE_ENV === 'development',
    envVars: {
      apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      projectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    }
  });

  // If we're on the server, return dummy config
  if (typeof window === 'undefined') {
    console.log('Returning dummy config for server');
    return {
      apiKey: 'dummy-key',
      authDomain: 'dummy-domain',
      projectId: 'dummy-project',
      storageBucket: 'dummy-bucket',
      messagingSenderId: 'dummy-id',
      appId: 'dummy-app-id'
    };
  }

  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    console.error('Firebase API Key missing in client environment');
    console.log('Available env vars:', Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC')));
  }

  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!
  };

  console.log('Returning client config:', config);
  return config;
};