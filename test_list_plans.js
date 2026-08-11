require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

admin.initializeApp({
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
});

async function test() {
  const db = admin.firestore();
  const users = await db.collection('users').limit(1).get();
  if (users.empty) {
    console.log("No users found");
    return;
  }
  const uid = users.docs[0].id;
  const plans = await db.collection(`users/${uid}/plans`).get();
  for (const plan of plans.docs) {
    const details = await plan.ref.collection('details').doc('main').get();
    console.log(plan.id, "details exists:", details.exists, "details data:", details.data());
  }
}
test().catch(console.error);
