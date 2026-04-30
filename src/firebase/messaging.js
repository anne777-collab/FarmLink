import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { doc, updateDoc } from "firebase/firestore";
import app, { auth, db } from "./config";

const messaging = getMessaging(app);

export const requestNotificationPermission = async () => {
  const permission = await Notification.requestPermission();

  if (permission === "granted") {
    const token = await getToken(messaging, {
      vapidKey: "BDvwzDnCXWktJ0MoueKxWVMnjzfXk-TQvrra9zD6NNc__IVRk2YNkdFGD2DqgCREHrzAx_0s93DRTBfu1ZrmIHs",
    });

    console.log("FCM Token:", token);
    if (auth.currentUser?.uid) {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        fcmToken: token,
      });
    }

    return token;
  } else {
    console.log("Notification permission denied");
    return null;
  }
};

export { messaging, getToken, onMessage };
