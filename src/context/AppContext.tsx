import React, { createContext, useContext, useState, useEffect } from "react";
import { isFirebaseConfigured, auth as realAuth, db as realDb } from "../firebase";
import { 
  signInWithEmailAndPassword as fbSignIn,
  createUserWithEmailAndPassword as fbCreateUser,
  signOut as fbSignOut,
} from "firebase/auth";
import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  collection, 
  onSnapshot,
  updateDoc, 
  query,
  where,
} from "firebase/firestore";
import { LiveLocation, LocationRecord, calculateDistance, acquireLiveLocation } from "../utils/location";
import { signInWithGooglePopupSafe } from "../services/googleAuth";

// Interface Definitions
export interface UserProfile {
  uid: string;
  email: string;
  role: "farmer" | "worker";
  provider?: "password" | "google";
  createdAt?: string;
  distance?: number;
  fullName: string;
  mobileNum: string;
  village: string;
  district: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  lastUpdated?: string;
  location?: LocationRecord;
  profileCompleted: boolean;
  
  // Worker-specific fields
  skills?: string[];
  wageExpectation?: number;
  experience?: string;
  availability?: "Available Today" | "Busy / Booked" | "Available This Week";
  profilePhoto?: string;
  photoURL?: string;
  
  // Farmer-specific fields
  isPremium?: boolean;
  savedWorkers?: string[];
}

export type JobStatus = "posted" | "applied" | "accepted" | "in_progress" | "completed" | "rated" | "cancelled";
export type ApplicationStatus = "pending" | "accepted" | "rejected" | "withdrawn";
export type NotificationType = "info" | "success" | "warning" | "job_posted" | "application_received" | "job_accepted" | "work_started" | "work_completed" | "rating_received";

export interface JobPost {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerMobile?: string;
  workerId?: string;
  workerName?: string;
  title: string;
  workType: string;
  description: string;
  wage: number;
  workersNeeded: number;
  location: {
    village: string;
    district: string;
    state: string;
    latitude: number;
    longitude: number;
  };
  workDate: string;
  workTime: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
  ratingGiven: boolean;
  additionalNotes?: string;
  // Backward-compatible aliases used by the existing matching UI.
  wageOffered: number;
  village: string;
  district: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  dateTime: string;
  notes: string;
  distance?: number;
}

export interface JobRequest {
  id: string;
  jobId: string;
  workerId: string;
  farmerId: string;
  farmerName: string;
  farmerMobile: string;
  workerName: string;
  workerMobile: string;
  workType: string;
  wageOffered: number;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  farmerId: string;
  workerId: string;
  workerName: string;
  workerPhoto?: string;
  workerMobile?: string;
  status: ApplicationStatus;
  appliedAt: string;
}

export interface RatingItem {
  id: string;
  jobId: string;
  fromUserId: string;
  toUserId: string;
  rating: number;
  review?: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  createdAt: string;
  read: boolean;
}

interface AppContextType {
  user: UserProfile | null;
  loading: boolean;
  workers: UserProfile[];
  farmers: UserProfile[];
  jobs: JobPost[];
  requests: JobRequest[];
  jobApplications: JobApplication[];
  ratings: RatingItem[];
  notifications: NotificationItem[];
  isConfigured: boolean;
  
  // Auth Operations
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, role: "farmer" | "worker") => Promise<void>;
  loginWithGoogle: (role: "farmer" | "worker") => Promise<void>;
  logout: () => Promise<void>;
  completeUserProfile: (profileData: Partial<UserProfile>) => Promise<void>;
  
  // Location & Matching Operations
  refreshUserLocation: () => Promise<LiveLocation>;
  getNearbyWorkers: () => UserProfile[];
  getNearbyJobs: () => JobPost[];
  
  // Farmer Operations
  postNewJob: (job: {
    title?: string;
    workType: string;
    description?: string;
    workersNeeded: number;
    wage?: number;
    wageOffered?: number;
    village: string;
    district: string;
    state: string;
    pincode?: string;
    latitude: number;
    longitude: number;
    workDate?: string;
    workTime?: string;
    dateTime?: string;
    notes?: string;
    additionalNotes?: string;
  }) => Promise<void>;
  applyToJob: (jobId: string) => Promise<void>;
  acceptJobApplication: (applicationId: string) => Promise<void>;
  rejectJobApplication: (applicationId: string) => Promise<void>;
  updateJobStatus: (jobId: string, nextStatus: JobStatus) => Promise<void>;
  submitRating: (jobId: string, toUserId: string, rating: number, review?: string) => Promise<void>;
  getWorkerStats: (workerId: string) => { averageRating: number; jobsCompleted: number; totalReviews: number };
  toggleSaveWorker: (workerId: string) => Promise<void>;
  hireWorkerRequest: (workerId: string, jobId: string) => Promise<void>;
  upgradePremiumStatus: () => void;
  
  // Worker Operations
  updateRequestStatus: (requestId: string, status: "accepted" | "declined") => Promise<void>;
  
  // Common Operations
  addNotification: (userId: string, message: string, type: NotificationType, title?: string) => Promise<void>;
  markNotificationsAsRead: () => Promise<void>;
  
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const USERS_COLLECTION = "users";
const WORKERS_COLLECTION = "workers";
const FARMERS_COLLECTION = "farmers";
const JOBS_COLLECTION = "jobs";
const APPLICATIONS_COLLECTION = "jobApplications";
const RATINGS_COLLECTION = "ratings";
const NOTIFICATIONS_COLLECTION = "notifications";
const FALLBACK_LATITUDE = 28.2044;
const FALLBACK_LONGITUDE = 76.6155;

interface AuthUserRecord {
  uid: string;
  email: string;
  role: "farmer" | "worker";
  createdAt: string;
  profileCompleted: boolean;
  fullName?: string;
  photoURL?: string;
  provider?: "password" | "google";
}

const stripUndefined = <T extends object>(value: T): T => {
  const cleaned = Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  );

  return cleaned as T;
};

const buildLocationRecord = (profile: Partial<UserProfile> & { location?: Partial<LocationRecord> }): LocationRecord | undefined => {
  const latitude = profile.location?.latitude ?? profile.latitude;
  const longitude = profile.location?.longitude ?? profile.longitude;

  if (
    profile.location ||
    profile.village ||
    profile.district ||
    profile.state ||
    profile.pincode ||
    typeof latitude === "number" ||
    typeof longitude === "number"
  ) {
    return {
      village: profile.location?.village ?? profile.village ?? "",
      district: profile.location?.district ?? profile.district ?? "",
      state: profile.location?.state ?? profile.state ?? "",
      pincode: profile.location?.pincode ?? profile.pincode ?? "",
      latitude: latitude ?? FALLBACK_LATITUDE,
      longitude: longitude ?? FALLBACK_LONGITUDE,
      accuracy: profile.location?.accuracy ?? 0,
      lastUpdated: profile.location?.lastUpdated ?? profile.lastUpdated ?? new Date().toISOString(),
    };
  }

  return undefined;
};

const resolveLatitude = (profile: { latitude: number; location?: Partial<LocationRecord> }) => {
  return profile.location?.latitude ?? profile.latitude ?? FALLBACK_LATITUDE;
};

const resolveLongitude = (profile: { longitude: number; location?: Partial<LocationRecord> }) => {
  return profile.location?.longitude ?? profile.longitude ?? FALLBACK_LONGITUDE;
};

const STATUS_ORDER: JobStatus[] = ["posted", "applied", "accepted", "in_progress", "completed", "rated"];

const canMoveJobStatus = (current: JobStatus, next: JobStatus) => {
  if (next === "cancelled") return current !== "completed" && current !== "rated";
  return STATUS_ORDER.indexOf(next) === STATUS_ORDER.indexOf(current) + 1;
};

const normalizeJobPost = (raw: Partial<JobPost>): JobPost => {
  const wage = raw.wage ?? raw.wageOffered ?? 0;
  const location = raw.location ?? {
    village: raw.village ?? "",
    district: raw.district ?? "",
    state: raw.state ?? "",
    latitude: raw.latitude ?? FALLBACK_LATITUDE,
    longitude: raw.longitude ?? FALLBACK_LONGITUDE,
  };
  const workDate = raw.workDate ?? raw.dateTime ?? "";
  const status = (raw.status as string) === "active" ? "posted" : (raw.status ?? "posted");

  return {
    id: raw.id ?? "",
    farmerId: raw.farmerId ?? "",
    farmerName: raw.farmerName ?? "",
    farmerMobile: raw.farmerMobile ?? "",
    workerId: raw.workerId,
    workerName: raw.workerName,
    title: raw.title ?? raw.workType ?? "Farm Work",
    workType: raw.workType ?? "Farm Work",
    description: raw.description ?? raw.notes ?? "",
    wage,
    workersNeeded: raw.workersNeeded ?? 1,
    location,
    workDate,
    workTime: raw.workTime ?? "",
    status: status as JobStatus,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? raw.createdAt ?? new Date().toISOString(),
    acceptedAt: raw.acceptedAt,
    startedAt: raw.startedAt,
    completedAt: raw.completedAt,
    ratingGiven: raw.ratingGiven ?? false,
    additionalNotes: raw.additionalNotes ?? raw.notes,
    wageOffered: wage,
    village: raw.village ?? location.village,
    district: raw.district ?? location.district,
    state: raw.state ?? location.state,
    pincode: raw.pincode ?? "",
    latitude: raw.latitude ?? location.latitude,
    longitude: raw.longitude ?? location.longitude,
    dateTime: raw.dateTime ?? workDate,
    notes: raw.notes ?? raw.additionalNotes ?? raw.description ?? "",
    distance: raw.distance,
  };
};

const getProfileCollectionName = (role: "farmer" | "worker") => {
  return role === "worker" ? WORKERS_COLLECTION : FARMERS_COLLECTION;
};

const getAuthRecord = (profile: UserProfile): AuthUserRecord => ({
  uid: profile.uid,
  email: profile.email,
  role: profile.role,
  createdAt: profile.createdAt || new Date().toISOString(),
  profileCompleted: profile.profileCompleted,
  fullName: profile.fullName || "",
  photoURL: profile.photoURL || profile.profilePhoto || "",
  provider: profile.provider || "password",
});

const composeUserProfile = (authData: AuthUserRecord, roleData?: Partial<UserProfile> | null): UserProfile => {
  const hasCompletedRoleProfile = authData.profileCompleted && !!roleData;

  return {
    uid: authData.uid,
    email: authData.email,
    role: authData.role,
    provider: authData.provider,
    createdAt: authData.createdAt,
    fullName: roleData?.fullName || authData.fullName || "",
    mobileNum: roleData?.mobileNum || "",
    village: roleData?.village || "",
    district: roleData?.district || "",
    state: roleData?.state || "",
    pincode: roleData?.pincode || "",
    latitude: roleData?.latitude ?? FALLBACK_LATITUDE,
    longitude: roleData?.longitude ?? FALLBACK_LONGITUDE,
    lastUpdated: roleData?.lastUpdated,
    location: roleData?.location,
    profileCompleted: hasCompletedRoleProfile,
    skills: roleData?.skills,
    wageExpectation: roleData?.wageExpectation,
    experience: roleData?.experience,
    availability: roleData?.availability,
    profilePhoto: roleData?.profilePhoto,
    photoURL: roleData?.photoURL || authData.photoURL,
    isPremium: roleData?.isPremium,
    savedWorkers: roleData?.savedWorkers,
  };
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState<UserProfile[]>([]);
  const [farmers, setFarmers] = useState<UserProfile[]>([]);
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [requests, setRequests] = useState<JobRequest[]>([]);
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [ratings, setRatings] = useState<RatingItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Simulation fallback states (persisted in localStorage)
  const [simUsers, setSimUsers] = useState<Record<string, UserProfile>>(() => {
    const saved = localStorage.getItem("farmlink_users");
    return saved ? JSON.parse(saved) : {};
  });
  const [simJobs, setSimJobs] = useState<JobPost[]>(() => {
    const saved = localStorage.getItem("farmlink_jobs");
    return saved ? JSON.parse(saved) : [];
  });
  const [simRequests, setSimRequests] = useState<JobRequest[]>(() => {
    const saved = localStorage.getItem("farmlink_requests");
    return saved ? JSON.parse(saved) : [];
  });
  const [simApplications, setSimApplications] = useState<JobApplication[]>(() => {
    const saved = localStorage.getItem("farmlink_job_applications");
    return saved ? JSON.parse(saved) : [];
  });
  const [simRatings, setSimRatings] = useState<RatingItem[]>(() => {
    const saved = localStorage.getItem("farmlink_ratings");
    return saved ? JSON.parse(saved) : [];
  });
  const [simNotifications, setSimNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem("farmlink_notifications");
    return saved ? JSON.parse(saved) : [];
  });

  // Keep localStorage in sync for simulated mode
  useEffect(() => {
    if (!isFirebaseConfigured) {
      localStorage.setItem("farmlink_users", JSON.stringify(simUsers));
    }
  }, [simUsers]);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      localStorage.setItem("farmlink_jobs", JSON.stringify(simJobs));
    }
  }, [simJobs]);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      localStorage.setItem("farmlink_requests", JSON.stringify(simRequests));
    }
  }, [simRequests]);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      localStorage.setItem("farmlink_job_applications", JSON.stringify(simApplications));
    }
  }, [simApplications]);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      localStorage.setItem("farmlink_ratings", JSON.stringify(simRatings));
    }
  }, [simRatings]);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      localStorage.setItem("farmlink_notifications", JSON.stringify(simNotifications));
    }
  }, [simNotifications]);

  // Sync data dynamically based on active system
  useEffect(() => {
    if (isFirebaseConfigured) {
      setLoading(true);

      const unsubscribeWorkers = onSnapshot(collection(realDb, WORKERS_COLLECTION), (snapshot) => {
        const nextWorkers = snapshot.docs
          .map((docSnap) => docSnap.data() as UserProfile)
          .filter((profile) => profile.role === "worker" && profile.profileCompleted !== false);
        setWorkers(nextWorkers);
      }, (error) => {
        console.error("Error listening to workers collection:", error);
      });

      const unsubscribeFarmers = onSnapshot(collection(realDb, FARMERS_COLLECTION), (snapshot) => {
        const nextFarmers = snapshot.docs
          .map((docSnap) => docSnap.data() as UserProfile)
          .filter((profile) => profile.role === "farmer" && profile.profileCompleted !== false);
        setFarmers(nextFarmers);
      }, (error) => {
        console.error("Error listening to farmers collection:", error);
      });

      const unsubscribeJobs = onSnapshot(collection(realDb, JOBS_COLLECTION), (snapshot) => {
        setJobs(snapshot.docs.map((docSnap) => normalizeJobPost({ id: docSnap.id, ...(docSnap.data() as Partial<JobPost>) })));
      }, (error) => {
        console.error("Error listening to jobs collection:", error);
      });

      const unsubscribeRequests = onSnapshot(collection(realDb, "requests"), (snapshot) => {
        setRequests(snapshot.docs.map((docSnap) => docSnap.data() as JobRequest));
      }, (error) => {
        console.error("Error listening to requests collection:", error);
      });

      const unsubscribeApplications = onSnapshot(collection(realDb, APPLICATIONS_COLLECTION), (snapshot) => {
        setJobApplications(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<JobApplication, "id">) })));
      }, (error) => {
        console.error("Error listening to job applications collection:", error);
      });

      const unsubscribeRatings = onSnapshot(collection(realDb, RATINGS_COLLECTION), (snapshot) => {
        setRatings(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Omit<RatingItem, "id">) })));
      }, (error) => {
        console.error("Error listening to ratings collection:", error);
      });

      const unsubscribeNotifications = onSnapshot(collection(realDb, NOTIFICATIONS_COLLECTION), (snapshot) => {
        setNotifications(snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as Partial<NotificationItem>;
          return {
            id: data.id ?? docSnap.id,
            userId: data.userId ?? "",
            title: data.title ?? "FarmLink update",
            message: data.message ?? "",
            type: data.type ?? "info",
            createdAt: data.createdAt ?? new Date().toISOString(),
            read: data.read ?? false,
          } as NotificationItem;
        }));
      }, (error) => {
        console.error("Error listening to notifications collection:", error);
      });

      setLoading(false);

      return () => {
        unsubscribeWorkers();
        unsubscribeFarmers();
        unsubscribeJobs();
        unsubscribeRequests();
        unsubscribeApplications();
        unsubscribeRatings();
        unsubscribeNotifications();
      };
    }

    const workersList = Object.values(simUsers).filter(u => u.role === "worker" && u.profileCompleted);
    const farmersList = Object.values(simUsers).filter(u => u.role === "farmer" && u.profileCompleted);
    setWorkers(workersList);
    setFarmers(farmersList);
    setJobs(simJobs.map(job => normalizeJobPost(job)));
    setRequests(simRequests);
    setJobApplications(simApplications);
    setRatings(simRatings);
    setNotifications(simNotifications);
    setLoading(false);
  }, [isFirebaseConfigured, simUsers, simJobs, simRequests, simApplications, simRatings, simNotifications]);

  // Auth observer
  useEffect(() => {
    if (isFirebaseConfigured) {
      const unsubscribe = realAuth.onAuthStateChanged(async (fbUser: any) => {
        if (fbUser) {
          try {
              const authDocRef = doc(realDb, USERS_COLLECTION, fbUser.uid);
              const authDoc = await getDoc(authDocRef);
              if (authDoc.exists()) {
                const authData = authDoc.data() as AuthUserRecord;
                const profileCollection = getProfileCollectionName(authData.role);
                const profileDoc = await getDoc(doc(realDb, profileCollection, fbUser.uid));
                const roleData = profileDoc.exists() ? (profileDoc.data() as Partial<UserProfile>) : null;
                console.debug("[FarmLink][Firestore] hydrated login profile", {
                  role: authData.role,
                  authPath: `${USERS_COLLECTION}/${fbUser.uid}`,
                  profilePath: `${profileCollection}/${fbUser.uid}`,
                  hasRolePhoto: !!roleData?.photoURL || !!roleData?.profilePhoto,
                });
                setUser(composeUserProfile(authData, roleData));
            } else {
              const pendingRole = sessionStorage.getItem("farmlink_pending_google_role") as "farmer" | "worker" | null;
              const selectedRole = pendingRole === "farmer" || pendingRole === "worker" ? pendingRole : "farmer";
              const createdAt = new Date().toISOString();
              const googleUser: UserProfile = {
                uid: fbUser.uid,
                email: fbUser.email || "",
                role: selectedRole,
                provider: "google",
                createdAt,
                fullName: fbUser.displayName || "",
                mobileNum: "",
                village: "",
                district: "",
                state: "",
                pincode: "",
                latitude: FALLBACK_LATITUDE,
                longitude: FALLBACK_LONGITUDE,
                profileCompleted: false,
                photoURL: fbUser.photoURL || "",
                profilePhoto: fbUser.photoURL || "",
              };
              await setDoc(authDocRef, getAuthRecord(googleUser), { merge: true });
              sessionStorage.removeItem("farmlink_pending_google_role");
              setUser(googleUser);
            }
          } catch (error) {
            console.error("Error getting user document:", error);
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      });
      return unsubscribe;
    } else {
      // Local simulation auth check
      const sessionUser = sessionStorage.getItem("farmlink_session");
      if (sessionUser) {
        setUser(JSON.parse(sessionUser));
      }
      setLoading(false);
    }
  }, []);

  // --- AUTH ACTIONS ---

  const signup = async (email: string, password: string, role: "farmer" | "worker") => {
    setLoading(true);
    if (isFirebaseConfigured) {
      try {
        const credentials = await fbCreateUser(realAuth, email, password);
        const createdAt = new Date().toISOString();
        const newUser: UserProfile = {
          uid: credentials.user.uid,
          email,
          role,
          provider: "password",
          createdAt,
          fullName: "",
          mobileNum: "",
          village: "",
          district: "",
          state: "",
          pincode: "",
          latitude: 28.2044,
          longitude: 76.6155,
          profileCompleted: false,
        };
        await setDoc(doc(realDb, USERS_COLLECTION, credentials.user.uid), getAuthRecord(newUser));
        console.debug("[FarmLink][Firestore] created auth user", {
          path: `${USERS_COLLECTION}/${credentials.user.uid}`,
          role,
        });
        setUser(newUser);
      } catch (err: any) {
        setLoading(false);
        throw new Error(err.message || "Signup failed");
      }
    } else {
      // Local simulation
      const userExists = Object.values(simUsers).some(u => u.email === email);
      if (userExists) {
        setLoading(false);
        throw new Error("Email already registered!");
      }
      const uid = "sim_user_" + Math.random().toString(36).substring(2, 9);
      const newUser: UserProfile = {
        uid,
        email,
        role,
        provider: "password",
        fullName: "",
        mobileNum: "",
        village: "",
        district: "",
        state: "",
        pincode: "",
        latitude: 28.2044,
        longitude: 76.6155,
        profileCompleted: false,
      };
      setSimUsers(prev => ({ ...prev, [uid]: newUser }));
      sessionStorage.setItem("farmlink_session", JSON.stringify(newUser));
      setUser(newUser);
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    if (isFirebaseConfigured) {
      try {
        const credentials = await fbSignIn(realAuth, email, password);
        const authDocRef = doc(realDb, USERS_COLLECTION, credentials.user.uid);
        const userDoc = await getDoc(authDocRef);
        if (userDoc.exists()) {
          const authData = userDoc.data() as AuthUserRecord;
          const profileCollection = getProfileCollectionName(authData.role);
          const profileDoc = await getDoc(doc(realDb, profileCollection, credentials.user.uid));
          const roleData = profileDoc.exists() ? (profileDoc.data() as Partial<UserProfile>) : null;
          console.debug("[FarmLink][Firestore] login role fetch", {
            role: authData.role,
            authPath: `${USERS_COLLECTION}/${credentials.user.uid}`,
            profilePath: `${profileCollection}/${credentials.user.uid}`,
          });
          setUser(composeUserProfile(authData, roleData));
        } else {
          throw new Error("User profile not found in database.");
        }
      } catch (err: any) {
        setLoading(false);
        throw new Error(err.message || "Invalid credentials.");
      }
    } else {
      // Local Simulation
      const matched = Object.values(simUsers).find(u => u.email === email);
      if (!matched) {
        setLoading(false);
        throw new Error("Email address not registered.");
      }
      // Simple verification bypass for local testing
      sessionStorage.setItem("farmlink_session", JSON.stringify(matched));
      setUser(matched);
      setLoading(false);
    }
  };

  const loginWithGoogle = async (role: "farmer" | "worker") => {
    setLoading(true);
    setUser(null);
    if (isFirebaseConfigured) {
      try {
        if (!realAuth || !realDb) {
          throw new Error("Firebase is not configured. Please verify your VITE_FIREBASE_* environment variables.");
        }

        sessionStorage.setItem("farmlink_pending_google_role", role);
        const fbUser = await signInWithGooglePopupSafe(realAuth);
        const docRef = doc(realDb, USERS_COLLECTION, fbUser.uid);
        const userDoc = await getDoc(docRef);

        if (userDoc.exists()) {
          const authData = userDoc.data() as AuthUserRecord;
          const profileCollection = getProfileCollectionName(authData.role);
          const profileDoc = await getDoc(doc(realDb, profileCollection, fbUser.uid));
          const roleData = profileDoc.exists() ? (profileDoc.data() as Partial<UserProfile>) : null;
          console.debug("[FarmLink][Firestore] google login fetch", {
            role: authData.role,
            authPath: `${USERS_COLLECTION}/${fbUser.uid}`,
            profilePath: `${profileCollection}/${fbUser.uid}`,
          });
          sessionStorage.removeItem("farmlink_pending_google_role");
          setUser(composeUserProfile(authData, roleData));
          setLoading(false);
        } else {
          const createdAt = new Date().toISOString();
          const newUser: UserProfile = {
            uid: fbUser.uid,
            email: fbUser.email || "",
            role,
            provider: "google",
            createdAt,
            fullName: fbUser.displayName || "",
            mobileNum: "",
            village: "",
            district: "",
            state: "",
            pincode: "",
            latitude: FALLBACK_LATITUDE,
            longitude: FALLBACK_LONGITUDE,
            profileCompleted: false,
            photoURL: fbUser.photoURL || "",
            profilePhoto: fbUser.photoURL || "",
          };
          await setDoc(docRef, getAuthRecord(newUser), { merge: true });
          console.debug("[FarmLink][Firestore] created google auth user", {
            path: `${USERS_COLLECTION}/${fbUser.uid}`,
            role,
          });
          sessionStorage.removeItem("farmlink_pending_google_role");
          setUser(newUser);
          setLoading(false);
        }
      } catch (err: any) {
        sessionStorage.removeItem("farmlink_pending_google_role");
        if (realAuth?.currentUser) {
          await fbSignOut(realAuth).catch(() => undefined);
        }
        setLoading(false);
        setUser(null);
        throw new Error(err.message || "Google Authentication failed.");
      }
    } else {
      // Local simulation
      const email = `google_user_${Math.random().toString(36).substring(2, 6)}@gmail.com`;
      const uid = "sim_g_" + Math.random().toString(36).substring(2, 9);
      const newUser: UserProfile = {
        uid,
        email,
        role,
        provider: "google",
        fullName: role === "farmer" ? "Ram Singh" : "Hari Dev",
        mobileNum: "",
        village: "",
        district: "",
        state: "",
        pincode: "",
        latitude: 28.2044,
        longitude: 76.6155,
        profileCompleted: false,
      };
      setSimUsers(prev => ({ ...prev, [uid]: newUser }));
      sessionStorage.setItem("farmlink_session", JSON.stringify(newUser));
      setUser(newUser);
      setLoading(false);
    }
  };

  const logout = async () => {
    if (isFirebaseConfigured) {
      await fbSignOut(realAuth);
    } else {
      sessionStorage.removeItem("farmlink_session");
    }
    sessionStorage.removeItem("farmlink_last_stable_location");
    setUser(null);
  };

  const completeUserProfile = async (profileData: Partial<UserProfile>) => {
    if (!user) throw new Error("No active user session.");
    setLoading(true);
    const nextLocation = buildLocationRecord({ ...user, ...profileData });
    const updatedUser: UserProfile = {
      ...user,
      ...profileData,
      ...(nextLocation ? { location: nextLocation } : {}),
      profileCompleted: true,
    };
    const sanitizedUser = stripUndefined(updatedUser);
    const authRecord = getAuthRecord(updatedUser);
    const profileCollection = getProfileCollectionName(user.role);
    const profilePayload = stripUndefined({
      ...sanitizedUser,
      photoURL: updatedUser.photoURL || updatedUser.profilePhoto,
      profilePhoto: updatedUser.profilePhoto || updatedUser.photoURL,
    });

    if (isFirebaseConfigured) {
      try {
        console.debug("[FarmLink][Firestore] saving role profile", {
          authPath: `${USERS_COLLECTION}/${user.uid}`,
          profilePath: `${profileCollection}/${user.uid}`,
          role: user.role,
        });
        await setDoc(doc(realDb, USERS_COLLECTION, user.uid), authRecord, { merge: true });
        await setDoc(doc(realDb, profileCollection, user.uid), profilePayload, { merge: true });
        setUser(updatedUser);
      } catch (err: any) {
        setLoading(false);
        throw new Error("Failed to save profile: " + err.message);
      }
    } else {
      setSimUsers(prev => ({
        ...prev,
        [user.uid]: updatedUser
      }));
      sessionStorage.setItem("farmlink_session", JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
    setLoading(false);
  };

  // --- LOCATION ACTIONS ---

  const refreshUserLocation = async (): Promise<LiveLocation> => {
    if (!user) throw new Error("Please log in to refresh location.");
    
    // Fetch live position with retry-based GPS
    const liveLoc = await acquireLiveLocation({
      previousLocation: user.location ?? {
        latitude: user.latitude || FALLBACK_LATITUDE,
        longitude: user.longitude || FALLBACK_LONGITUDE,
        accuracy: 0,
      },
    });

    const nextLocation: LocationRecord = {
      village: liveLoc.village,
      district: liveLoc.district,
      state: liveLoc.state,
      pincode: liveLoc.pincode,
      latitude: liveLoc.latitude,
      longitude: liveLoc.longitude,
      accuracy: liveLoc.accuracy,
      lastUpdated: liveLoc.lastUpdated,
    };

    // Update locally or in DB
    const updatedUser: UserProfile = {
      ...user,
      village: nextLocation.village,
      district: nextLocation.district,
      state: nextLocation.state,
      pincode: nextLocation.pincode,
      latitude: nextLocation.latitude,
      longitude: nextLocation.longitude,
      lastUpdated: nextLocation.lastUpdated,
      location: nextLocation,
    };
    const locationPayload = stripUndefined({
      village: nextLocation.village,
      district: nextLocation.district,
      state: nextLocation.state,
      pincode: nextLocation.pincode,
      latitude: nextLocation.latitude,
      longitude: nextLocation.longitude,
      accuracy: nextLocation.accuracy,
      lastUpdated: nextLocation.lastUpdated,
    });
    const roleCollection = getProfileCollectionName(user.role);

    if (isFirebaseConfigured) {
      console.debug("[FarmLink][Firestore] refreshing role location", {
        profilePath: `${roleCollection}/${user.uid}`,
        role: user.role,
      });
      await setDoc(doc(realDb, roleCollection, user.uid), {
        location: locationPayload,
        village: nextLocation.village,
        district: nextLocation.district,
        state: nextLocation.state,
        pincode: nextLocation.pincode,
        latitude: nextLocation.latitude,
        longitude: nextLocation.longitude,
        lastUpdated: nextLocation.lastUpdated,
      }, { merge: true });
    } else {
      setSimUsers(prev => ({
        ...prev,
        [user.uid]: updatedUser
      }));
    }

    setUser(updatedUser);
    sessionStorage.setItem("farmlink_session", JSON.stringify(updatedUser));
    return liveLoc;
  };

  // Filter nearby workers based on current farmer's coordinates
  const getNearbyWorkers = (): UserProfile[] => {
    if (!user || user.role !== "farmer") return [];
    const matched = workers.map(worker => {
      const distance = calculateDistance(
        resolveLatitude(user),
        resolveLongitude(user),
        resolveLatitude(worker),
        resolveLongitude(worker)
      );
      return { ...worker, distance };
    });

    // Sort ascending (nearest first)
    matched.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    return matched as unknown as UserProfile[];
  };

  // Get jobs in the worker's district or nearby radius
  const getNearbyJobs = (): JobPost[] => {
    if (!user || user.role !== "worker") return [];

    const matched = jobs.filter(job => ["posted", "applied"].includes(job.status)).map(job => {
      const distance = calculateDistance(
        resolveLatitude(user),
        resolveLongitude(user),
        job.latitude || 28.2044,
        job.longitude || 76.6155
      );
      return { ...job, distance };
    });

    matched.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    return matched as unknown as JobPost[];
  };

  // --- FARMER ACTIONS ---

  const postNewJob = async (jobData: {
    title?: string;
    workType: string;
    description?: string;
    workersNeeded: number;
    wage?: number;
    wageOffered?: number;
    village: string;
    district: string;
    state: string;
    pincode?: string;
    latitude: number;
    longitude: number;
    workDate?: string;
    workTime?: string;
    dateTime?: string;
    notes?: string;
    additionalNotes?: string;
  }) => {
    if (!user) throw new Error("Must be logged in.");
    if (user.role !== "farmer") throw new Error("Only farmers can post jobs.");
    const id = "job_" + Math.random().toString(36).substring(2, 9);
    const createdAt = new Date().toISOString();
    const wage = Number(jobData.wage ?? jobData.wageOffered ?? 0);
    const workDate = jobData.workDate ?? jobData.dateTime ?? "";
    const notes = jobData.additionalNotes ?? jobData.notes ?? "";
    const newJob: JobPost = normalizeJobPost({
      id,
      farmerId: user.uid,
      farmerName: user.fullName || "A Farmer",
      farmerMobile: user.mobileNum || "",
      title: jobData.title || `${jobData.workType} needed`,
      workType: jobData.workType,
      description: jobData.description || notes,
      wage,
      workersNeeded: Number(jobData.workersNeeded),
      location: {
        village: jobData.village,
        district: jobData.district,
        state: jobData.state,
        latitude: jobData.latitude,
        longitude: jobData.longitude,
      },
      workDate,
      workTime: jobData.workTime || "",
      status: "posted",
      createdAt,
      updatedAt: createdAt,
      ratingGiven: false,
      additionalNotes: notes,
      wageOffered: wage,
      village: jobData.village,
      district: jobData.district,
      state: jobData.state,
      pincode: jobData.pincode || user.pincode || "",
      latitude: jobData.latitude,
      longitude: jobData.longitude,
      dateTime: workDate,
      notes,
    });

    if (isFirebaseConfigured) {
      await setDoc(doc(realDb, JOBS_COLLECTION, id), newJob);
    } else {
      setSimJobs(prev => [newJob, ...prev]);
    }

    // Automatically trigger notification creation for nearby workers
    // In our simulated or real database, find workers in same district/village
    const nearbyWorkers = workers.filter(w => w.district === user.district || w.pincode === user.pincode);
    for (const worker of nearbyWorkers) {
      await addNotification(
        worker.uid,
        `New ${jobData.workType} job in ${jobData.village} offers ₹${wage}/day.`,
        "job_posted",
        "New job posted"
      );
    }
  };

  const setWorkerAvailability = async (workerId: string, availability: UserProfile["availability"]) => {
    const target = workers.find(w => w.uid === workerId) || simUsers[workerId];
    const updatedWorker = target ? { ...target, availability } : undefined;

    if (isFirebaseConfigured) {
      await setDoc(doc(realDb, WORKERS_COLLECTION, workerId), { availability }, { merge: true });
    } else if (updatedWorker) {
      setSimUsers(prev => ({ ...prev, [workerId]: updatedWorker }));
      if (user?.uid === workerId) {
        const updatedUser = { ...user, availability };
        setUser(updatedUser);
        sessionStorage.setItem("farmlink_session", JSON.stringify(updatedUser));
      }
    }
  };

  const applyToJob = async (jobId: string) => {
    if (!user || user.role !== "worker") throw new Error("Only workers can apply to jobs.");
    const job = jobs.find(j => j.id === jobId);
    if (!job) throw new Error("Job not found.");
    if (!["posted", "applied"].includes(job.status)) throw new Error("This job is no longer accepting applications.");
    if (jobApplications.some(app => app.jobId === jobId && app.workerId === user.uid && app.status !== "withdrawn")) {
      throw new Error("You have already applied to this job.");
    }

    const id = "app_" + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();
    const application: JobApplication = {
      id,
      jobId,
      farmerId: job.farmerId,
      workerId: user.uid,
      workerName: user.fullName || "Farm Worker",
      workerPhoto: user.profilePhoto || user.photoURL,
      workerMobile: user.mobileNum,
      status: "pending",
      appliedAt: now,
    };
    const nextJob = normalizeJobPost({ ...job, status: job.status === "posted" ? "applied" : job.status, updatedAt: now });

    if (isFirebaseConfigured) {
      await setDoc(doc(realDb, APPLICATIONS_COLLECTION, id), application);
      await setDoc(doc(realDb, JOBS_COLLECTION, jobId), { status: nextJob.status, updatedAt: now }, { merge: true });
    } else {
      setSimApplications(prev => [application, ...prev]);
      setSimJobs(prev => prev.map(item => item.id === jobId ? nextJob : item));
    }

    await addNotification(
      job.farmerId,
      `${user.fullName || "A worker"} applied for ${job.workType}. Review their profile and accept or reject the application.`,
      "application_received",
      "Application received"
    );
  };

  const acceptJobApplication = async (applicationId: string) => {
    if (!user || user.role !== "farmer") throw new Error("Only farmers can accept applications.");
    const application = jobApplications.find(app => app.id === applicationId);
    if (!application) throw new Error("Application not found.");
    const job = jobs.find(j => j.id === application.jobId);
    if (!job || job.farmerId !== user.uid) throw new Error("You can only manage your own jobs.");
    if (job.status !== "applied") throw new Error("This job must be in applied status before accepting a worker.");

    const now = new Date().toISOString();
    const jobPatch = {
      status: "accepted" as JobStatus,
      workerId: application.workerId,
      workerName: application.workerName,
      acceptedAt: now,
      updatedAt: now,
    };
    const updatedJob = normalizeJobPost({ ...job, ...jobPatch });

    if (isFirebaseConfigured) {
      await updateDoc(doc(realDb, APPLICATIONS_COLLECTION, applicationId), { status: "accepted" });
      await setDoc(doc(realDb, JOBS_COLLECTION, job.id), jobPatch, { merge: true });
    } else {
      setSimApplications(prev => prev.map(app => app.id === applicationId ? { ...app, status: "accepted" } : app.jobId === job.id ? { ...app, status: "rejected" } : app));
      setSimJobs(prev => prev.map(item => item.id === job.id ? updatedJob : item));
    }

    await setWorkerAvailability(application.workerId, "Busy / Booked");
    await addNotification(application.workerId, `Your application for ${job.workType} was accepted by ${user.fullName}.`, "job_accepted", "Job accepted");
  };

  const rejectJobApplication = async (applicationId: string) => {
    if (!user || user.role !== "farmer") throw new Error("Only farmers can reject applications.");
    const application = jobApplications.find(app => app.id === applicationId);
    if (!application) throw new Error("Application not found.");
    const job = jobs.find(j => j.id === application.jobId);
    if (!job || job.farmerId !== user.uid) throw new Error("You can only manage your own jobs.");

    if (isFirebaseConfigured) {
      await updateDoc(doc(realDb, APPLICATIONS_COLLECTION, applicationId), { status: "rejected" });
    } else {
      setSimApplications(prev => prev.map(app => app.id === applicationId ? { ...app, status: "rejected" } : app));
    }

    await addNotification(application.workerId, `Your application for ${job.workType} was not selected this time.`, "warning", "Application update");
  };

  const updateJobStatus = async (jobId: string, nextStatus: JobStatus) => {
    if (!user) throw new Error("Must be logged in.");
    const job = jobs.find(j => j.id === jobId);
    if (!job) throw new Error("Job not found.");

    const isFarmerOwner = user.role === "farmer" && job.farmerId === user.uid;
    const isAssignedWorker = user.role === "worker" && job.workerId === user.uid;
    if (!isFarmerOwner && !isAssignedWorker) throw new Error("You are not allowed to update this job.");
    if (nextStatus !== "cancelled" && !canMoveJobStatus(job.status, nextStatus)) {
      throw new Error(`Invalid workflow transition: ${job.status} to ${nextStatus}.`);
    }
    if (nextStatus === "in_progress" && !isAssignedWorker && !isFarmerOwner) throw new Error("Only the assigned job participants can start work.");
    if (nextStatus === "completed" && !isAssignedWorker && !isFarmerOwner) throw new Error("Only the assigned job participants can complete work.");

    const now = new Date().toISOString();
    const patch: Partial<JobPost> = { status: nextStatus, updatedAt: now };
    if (nextStatus === "in_progress") patch.startedAt = now;
    if (nextStatus === "completed") patch.completedAt = now;
    const updatedJob = normalizeJobPost({ ...job, ...patch });

    if (isFirebaseConfigured) {
      await setDoc(doc(realDb, JOBS_COLLECTION, jobId), patch, { merge: true });
    } else {
      setSimJobs(prev => prev.map(item => item.id === jobId ? updatedJob : item));
    }

    if (nextStatus === "completed" && job.workerId) {
      await setWorkerAvailability(job.workerId, "Available Today");
    }

    const notifyUserId = user.uid === job.farmerId ? job.workerId : job.farmerId;
    if (notifyUserId) {
      const type = nextStatus === "in_progress" ? "work_started" : nextStatus === "completed" ? "work_completed" : "info";
      await addNotification(notifyUserId, `${job.workType} is now ${nextStatus.replace("_", " ")}.`, type, "Job status updated");
    }
  };

  const submitRating = async (jobId: string, toUserId: string, rating: number, review?: string) => {
    if (!user) throw new Error("Must be logged in.");
    const job = jobs.find(j => j.id === jobId);
    if (!job || !["completed", "rated"].includes(job.status)) throw new Error("Ratings are available only after completion.");
    const participates = user.uid === job.farmerId || user.uid === job.workerId;
    if (!participates || (toUserId !== job.farmerId && toUserId !== job.workerId) || toUserId === user.uid) {
      throw new Error("You can only rate the other participant in this job.");
    }
    if (ratings.some(item => item.jobId === jobId && item.fromUserId === user.uid)) {
      throw new Error("You have already rated this job.");
    }

    const id = "rating_" + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();
    const newRating: RatingItem = {
      id,
      jobId,
      fromUserId: user.uid,
      toUserId,
      rating: Math.min(5, Math.max(1, Number(rating))),
      review: review?.trim() || "",
      createdAt: now,
    };
    const jobPatch = { status: "rated" as JobStatus, ratingGiven: true, updatedAt: now };

    if (isFirebaseConfigured) {
      await setDoc(doc(realDb, RATINGS_COLLECTION, id), newRating);
      await setDoc(doc(realDb, JOBS_COLLECTION, jobId), jobPatch, { merge: true });
    } else {
      setSimRatings(prev => [newRating, ...prev]);
      setSimJobs(prev => prev.map(item => item.id === jobId ? normalizeJobPost({ ...item, ...jobPatch }) : item));
    }

    await addNotification(toUserId, `${user.fullName || "A FarmLink user"} rated you ${newRating.rating}/5 for ${job.workType}.`, "rating_received", "Rating received");
  };

  const getWorkerStats = (workerId: string) => {
    const workerRatings = ratings.filter(item => item.toUserId === workerId);
    const totalReviews = workerRatings.length;
    const averageRating = totalReviews
      ? workerRatings.reduce((sum, item) => sum + item.rating, 0) / totalReviews
      : 0;
    const jobsCompleted = jobs.filter(job => job.workerId === workerId && ["completed", "rated"].includes(job.status)).length;

    return {
      averageRating,
      jobsCompleted,
      totalReviews,
    };
  };

  const toggleSaveWorker = async (workerId: string) => {
    if (!user || user.role !== "farmer") return;
    const currentSaved = user.savedWorkers || [];
    let updated: string[];
    if (currentSaved.includes(workerId)) {
      updated = currentSaved.filter(id => id !== workerId);
    } else {
      updated = [...currentSaved, workerId];
    }

    const updatedUser = { ...user, savedWorkers: updated };
    if (isFirebaseConfigured) {
      await setDoc(doc(realDb, FARMERS_COLLECTION, user.uid), { savedWorkers: updated }, { merge: true });
    } else {
      setSimUsers(prev => ({ ...prev, [user.uid]: updatedUser }));
    }
    setUser(updatedUser);
    sessionStorage.setItem("farmlink_session", JSON.stringify(updatedUser));
  };

  const hireWorkerRequest = async (workerId: string, jobId: string) => {
    if (!user) return;
    const selectedJob = jobs.find(j => j.id === jobId);
    const targetWorker = workers.find(w => w.uid === workerId);
    if (!selectedJob || !targetWorker) return;

    const id = "req_" + Math.random().toString(36).substring(2, 9);
    const newRequest: JobRequest = {
      id,
      jobId,
      workerId,
      farmerId: user.uid,
      farmerName: user.fullName,
      farmerMobile: user.mobileNum,
      workerName: targetWorker.fullName,
      workerMobile: targetWorker.mobileNum,
      workType: selectedJob.workType,
      wageOffered: selectedJob.wageOffered,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured) {
      await setDoc(doc(realDb, "requests", id), newRequest);
    } else {
      setSimRequests(prev => [newRequest, ...prev]);
    }

    // Notify worker
    await addNotification(
      workerId,
      `📩 Direct hire request from farmer ${user.fullName} for ${selectedJob.workType}!`,
      "success"
    );
  };

  const upgradePremiumStatus = () => {
    if (!user || user.role !== "farmer") return;
    console.info("[FarmLink] Premium plans are coming soon.");
  };

  // --- WORKER ACTIONS ---

  const updateRequestStatus = async (requestId: string, status: "accepted" | "declined") => {
    if (isFirebaseConfigured) {
      await updateDoc(doc(realDb, "requests", requestId), { status });
    } else {
      setSimRequests(prev => prev.map(r => r.id === requestId ? { ...r, status } : r));
    }

    const req = requests.find(r => r.id === requestId);
    if (req) {
      const message = status === "accepted"
        ? `✅ Worker ${req.workerName} accepted your hire request for ${req.workType}! Contact them: +91 ${req.workerMobile}`
        : `❌ Worker ${req.workerName} declined your hire request for ${req.workType}.`;
      await addNotification(req.farmerId, message, status === "accepted" ? "success" : "warning");
    }
  };

  // --- NOTIFICATION ACTIONS ---

  const addNotification = async (userId: string, message: string, type: NotificationType, title = "FarmLink update") => {
    const id = "notif_" + Math.random().toString(36).substring(2, 9);
    const newNotif: NotificationItem = {
      id,
      userId,
      title,
      message,
      type,
      createdAt: new Date().toISOString(),
      read: false,
    };

    if (isFirebaseConfigured) {
      await setDoc(doc(realDb, NOTIFICATIONS_COLLECTION, id), newNotif);
    } else {
      setSimNotifications(prev => [newNotif, ...prev]);
    }
  };

  const markNotificationsAsRead = async () => {
    if (!user) return;
    if (isFirebaseConfigured) {
      const unread = await getDocs(query(
        collection(realDb, NOTIFICATIONS_COLLECTION),
        where("userId", "==", user.uid),
        where("read", "==", false)
      ));
      await Promise.all(unread.docs.map((docSnap) => updateDoc(doc(realDb, NOTIFICATIONS_COLLECTION, docSnap.id), { read: true })));
    } else {
      setSimNotifications(prev => prev.map(n => n.userId === user.uid ? { ...n, read: true } : n));
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        loading,
        workers,
        farmers,
        jobs,
        requests,
        jobApplications,
        ratings,
        notifications,
        isConfigured: isFirebaseConfigured,
        login,
        signup,
        loginWithGoogle,
        logout,
        completeUserProfile,
        refreshUserLocation,
        getNearbyWorkers,
        getNearbyJobs,
        postNewJob,
        applyToJob,
        acceptJobApplication,
        rejectJobApplication,
        updateJobStatus,
        submitRating,
        getWorkerStats,
        toggleSaveWorker,
        hireWorkerRequest,
        upgradePremiumStatus,
        updateRequestStatus,
        addNotification,
        markNotificationsAsRead
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
