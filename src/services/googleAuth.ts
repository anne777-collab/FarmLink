import {
  browserLocalPersistence,
  GoogleAuthProvider,
  setPersistence,
  signInWithPopup,
  type Auth,
  type User,
} from "firebase/auth";

export type GoogleAuthErrorCode =
  | "popup-closed"
  | "unauthorized-domain"
  | "network"
  | "duplicate-account"
  | "config"
  | "unknown";

export class GoogleAuthFlowError extends Error {
  code: GoogleAuthErrorCode;

  constructor(code: GoogleAuthErrorCode, message: string) {
    super(message);
    this.name = "GoogleAuthFlowError";
    this.code = code;
  }
}

const provider = new GoogleAuthProvider();
provider.addScope("email");
provider.addScope("profile");
provider.setCustomParameters({
  prompt: "select_account",
});

const mapGoogleAuthError = (error: any): GoogleAuthFlowError => {
  const code = String(error?.code || "");

  if (code.includes("popup-closed-by-user") || code.includes("cancelled-popup-request")) {
    return new GoogleAuthFlowError("popup-closed", "Google sign-in was cancelled. Please try again when you are ready.");
  }

  if (code.includes("unauthorized-domain")) {
    return new GoogleAuthFlowError(
      "unauthorized-domain",
      "This domain is not authorized for Google Sign-In. Add localhost and your Vercel domain in Firebase Authentication > Settings > Authorized domains."
    );
  }

  if (code.includes("network-request-failed")) {
    return new GoogleAuthFlowError("network", "Network connection failed during Google sign-in. Please check your internet and try again.");
  }

  if (code.includes("account-exists-with-different-credential") || code.includes("credential-already-in-use")) {
    return new GoogleAuthFlowError(
      "duplicate-account",
      "An account already exists with this email using another sign-in method. Please sign in with email/password first."
    );
  }

  if (code.includes("operation-not-allowed")) {
    return new GoogleAuthFlowError("config", "Google Sign-In is not enabled in Firebase Authentication. Enable the Google provider and try again.");
  }

  return new GoogleAuthFlowError("unknown", error?.message || "Google sign-in failed. Please try again.");
};

export const signInWithGooglePopupSafe = async (auth: Auth): Promise<User> => {
  try {
    auth.useDeviceLanguage();
    await setPersistence(auth, browserLocalPersistence);
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error: any) {
    throw mapGoogleAuthError(error);
  }
};
