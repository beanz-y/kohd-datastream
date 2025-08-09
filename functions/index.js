const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.login = functions.https.onCall(async (data, context) => {
  const username = data.username.toLowerCase();
  const password = data.password;

  if (!username || !password) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Username and password are required."
    );
  }

  const userRef = admin.database().ref(`/users/${username}`);
  const snapshot = await userRef.once("value");

  if (!snapshot.exists() || snapshot.val().password !== password) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Invalid credentials."
    );
  }
  
  // If credentials are valid, create a custom auth token for the user.
  // We use the username as the UID for simplicity.
  const uid = username;
  const customToken = await admin.auth().createCustomToken(uid);

  return { token: customToken };
});