const admin = require("firebase-admin");

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function main() {
    const uid = "NZ0OLO8plGTdCqOYLa8fTFuWEZf2";
  await admin.auth().setCustomUserClaims(uid, { admin: true });
  console.log("Custom claim set for:", uid);
}

main().catch(console.error);