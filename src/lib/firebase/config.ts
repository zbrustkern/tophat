interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const getEnvVar = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    console.error(`Missing environment variable: ${key}`);
    return '';
  }
  return value;
};

export const firebaseConfig = {
  apiKey: getEnvVar('NEXT_PUBLIC_FIREBASE_API_KEY'),
  authDomain: getEnvVar('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('NEXT_PUBLIC_FIREBASE_APP_ID'),
};

console.log('Firebase Config:', JSON.stringify({
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey ? '***' : undefined
}, null, 2));

const missingKeys = Object.entries(firebaseConfig)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingKeys.length > 0) {
  console.error(`Missing Firebase configuration keys: ${missingKeys.join(', ')}`);
  if (typeof window === 'undefined') {
    throw new Error('Firebase configuration is incomplete. Check your environment variables.');
  }
}