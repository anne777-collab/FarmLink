const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.sendRequestNotification = functions.firestore
    .document("requests/{requestId}")
    .onCreate(async (snap, context) => {
      const request = snap.data();
      const workerId = request.workerId;

      const userDoc = await admin.firestore()
          .collection("users")
          .doc(workerId)
          .get();

      const fcmToken = userDoc.data().fcmToken;

      if (!fcmToken) return;

      await admin.messaging().send({
        token: fcmToken,
        notification: {
          title: "New Job Request",
          body: "You received a new request",
        },
      });
    });
