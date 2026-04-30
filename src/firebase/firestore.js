// src/firebase/firestore.js
// Firebase v9 modular SDK
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  addDoc,
  serverTimestamp,
  limit,
  runTransaction,
  onSnapshot,
  arrayUnion,          // Task 3: store individual ratings in an array
} from "firebase/firestore";
import { db } from "./config";

// ─────────────────────────────────────────────────────────────────────────────
// TIMEOUT WRAPPER
// Prevents any Firestore promise from hanging forever (e.g. wrong project ID,
// no network, blocked security rules). Rejects after `ms` with a clear message.
// ─────────────────────────────────────────────────────────────────────────────
const withTimeout = (promise, ms = 10_000, label = "Firestore") => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(
        `[${label}] timed out after ${ms / 1000}s. ` +
        "Check Firebase config, Firestore rules, and network connection."
      )),
      ms
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

// ─────────────────────────────────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────────────────────────────────

export const createUser = async (uid, data) => {
  if (!uid) throw new Error("createUser: uid required");
  await withTimeout(
    setDoc(doc(db, "users", uid), { ...data, createdAt: serverTimestamp() }),
    10_000, "createUser"
  );
};

export const getUser = async (uid) => {
  if (!uid) return null;
  try {
    const snap = await withTimeout(getDoc(doc(db, "users", uid)), 8_000, "getUser");
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (err) {
    console.error("[getUser]", err);
    return null;
  }
};

export const updateUser = async (uid, data) => {
  if (!uid) throw new Error("updateUser: uid required");
  await withTimeout(
    updateDoc(doc(db, "users", uid), data),
    10_000, "updateUser"
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// WORKERS
// ─────────────────────────────────────────────────────────────────────────────

export const createWorkerProfile = async (userId, data) => {
  if (!userId) throw new Error("createWorkerProfile: userId required");
  const { workType, wage, availability = true } = data;
  if (!workType) throw new Error("createWorkerProfile: workType required");
  const parsedWage = Number(wage);
  if (!wage || isNaN(parsedWage) || parsedWage <= 0)
    throw new Error("createWorkerProfile: wage must be a positive number");

  await withTimeout(
    setDoc(doc(db, "workers", userId), {
      userId,
      workType,
      wage: parsedWage,
      availability,
      rating: 0,
      totalRatings: 0,
      totalJobs: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
    10_000, "createWorkerProfile"
  );
};

export const getWorkerProfile = async (userId) => {
  if (!userId) return null;
  try {
    const snap = await withTimeout(
      getDoc(doc(db, "workers", userId)), 8_000, "getWorkerProfile"
    );
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (err) {
    console.error("[getWorkerProfile]", err);
    return null;
  }
};

export const updateWorkerProfile = async (userId, data) => {
  if (!userId) throw new Error("updateWorkerProfile: userId required");
  await withTimeout(
    updateDoc(doc(db, "workers", userId), { ...data, updatedAt: serverTimestamp() }),
    10_000, "updateWorkerProfile"
  );
};

export const updateAvailability = async (userId, available) => {
  if (!userId) throw new Error("updateAvailability: userId required");
  if (typeof available !== "boolean")
    throw new Error("updateAvailability: available must be boolean");
  const ref = doc(db, "workers", userId);
  await withTimeout(
    runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error("Worker profile not found");
      tx.update(ref, { availability: available, updatedAt: serverTimestamp() });
    }),
    10_000, "updateAvailability"
  );
  return available;
};

/**
 * Fetch workers with optional filters.
 *
 * KEY FIX: Firestore does NOT support combining multiple inequality filters
 * on different fields, and requires a composite index for every unique
 * combination of where() + orderBy() fields. We solve this by:
 *
 *   1. Building the narrowest possible single-field Firestore query
 *      (using the most selective filter available).
 *   2. Doing all remaining filtering client-side after the fetch.
 *
 * This guarantees the query always works — even in test mode where indexes
 * may not yet exist — and avoids "The query requires an index" errors.
 */
export const getAllWorkers = async (filters = {}) => {
  const { workType, availability, maxWage } = filters;

  // ── Build the Firestore query with AT MOST one where() clause ──────────────
  // Priority: availability (most selective for UI) > workType > none
  let q;

  if (availability && availability !== "all") {
    const isAvailable = availability === "available";
    // availability + createdAt DESC — covered by index
    q = query(
      collection(db, "workers"),
      where("availability", "==", isAvailable),
      orderBy("createdAt", "desc")
    );
  } else if (workType) {
    // workType + createdAt DESC — covered by index
    q = query(
      collection(db, "workers"),
      where("workType", "==", workType),
      orderBy("createdAt", "desc")
    );
  } else {
    // No filter — just get all workers sorted by newest first
    q = query(
      collection(db, "workers"),
      orderBy("createdAt", "desc")
    );
  }

  let snap;
  try {
    snap = await withTimeout(getDocs(q), 10_000, "getAllWorkers");
  } catch (err) {
    console.error("[getAllWorkers] Firestore query failed:", err);
    throw err;
  }

  // ── Resolve user docs in parallel ─────────────────────────────────────────
  let workers = await Promise.all(
    snap.docs.map(async (d) => {
      const workerData = { id: d.id, ...d.data() };
      const userData = await getUser(workerData.userId);
      return { ...workerData, user: userData };
    })
  );

  // ── Client-side secondary filters ─────────────────────────────────────────
  // These cover any combination that wasn't handled in the Firestore query
  // without needing composite indexes.

  if (availability && availability !== "all" && workType) {
    // availability was handled in Firestore; now also filter by workType
    workers = workers.filter((w) => w.workType === workType);
  }

  if (maxWage) {
    const max = Number(maxWage);
    if (!isNaN(max) && max > 0) {
      workers = workers.filter((w) => w.wage <= max);
    }
  }

  return workers;
};

export const getWorkerWithUser = async (workerId) => {
  if (!workerId) return null;
  try {
    const wSnap = await withTimeout(
      getDoc(doc(db, "workers", workerId)), 8_000, "getWorkerWithUser"
    );
    if (!wSnap.exists()) return null;
    const userData = await getUser(wSnap.data().userId);
    return { id: wSnap.id, ...wSnap.data(), user: userData };
  } catch (err) {
    console.error("[getWorkerWithUser]", workerId, err);
    return null;
  }
};

/**
 * Role-safe profile loader.
 * - role === "worker"  → fetches workers/{uid}
 * - role === "farmer"  → returns null immediately (no crash, no toast)
 * - role === unknown   → returns null safely
 *
 * Use this in dashboards instead of calling getWorkerProfile directly,
 * so a farmer login never triggers "Worker profile not found."
 */
export const getProfileForRole = async (uid, role) => {
  if (!uid || !role) return null;
  if (role !== "worker") return null;  // farmers have no workers doc
  return getWorkerProfile(uid);
};

/**
 * Fetch all accepted job requests for a farmer,
 * with the worker + user details resolved.
 * Used to show the "Accepted Workers" section on FarmerDashboard.
 */
export const getAcceptedWorkersForFarmer = async (farmerId) => {
  if (!farmerId) return [];
  try {
    const q = query(
      collection(db, "jobRequests"),
      where("farmerId", "==", farmerId),
      where("status",   "==", "accepted"),
      orderBy("createdAt", "desc")
    );
    const snap = await withTimeout(getDocs(q), 10_000, "getAcceptedWorkersForFarmer");
    return Promise.all(
      snap.docs.map(async (d) => ({
        id: d.id,
        ...d.data(),
        worker: await getWorkerWithUser(d.data().workerId),
      }))
    );
  } catch (err) {
    console.error("[getAcceptedWorkersForFarmer]", err);
    return [];
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// JOB REQUESTS  (collection: "jobRequests")
// ─────────────────────────────────────────────────────────────────────────────

export const createJobRequest = async (data) => {
  const { farmerId, workerId, date, workersNeeded, offeredWage } = data;
  if (!farmerId || !workerId)
    throw new Error("createJobRequest: farmerId and workerId required");
  if (!date)        throw new Error("createJobRequest: date required");
  if (!offeredWage) throw new Error("createJobRequest: offeredWage required");

  const ref = await withTimeout(
    addDoc(collection(db, "jobRequests"), {
      farmerId,
      workerId,
      date,
      workersNeeded:   Number(workersNeeded) || 1,
      offeredWage:     Number(offeredWage),
      wage:            Number(offeredWage),      // alias for job system
      workType:        data.workType || "",
      status:          "pending",
      emergency:       data.emergency || false,
      workDescription: data.workDescription || "",
      createdAt:       serverTimestamp(),
      updatedAt:       serverTimestamp(),
    }),
    10_000, "createJobRequest"
  );
  return ref.id;
};

export const getJobRequestsForFarmer = async (farmerId) => {
  if (!farmerId) return [];
  try {
    const q = query(
      collection(db, "jobRequests"),
      where("farmerId", "==", farmerId),
      orderBy("createdAt", "desc")
    );
    const snap = await withTimeout(getDocs(q), 10_000, "getJobRequestsForFarmer");
    const jobs = await Promise.all(
      snap.docs.map(async (d) => ({
        id: d.id,
        ...d.data(),
        worker: await getWorkerWithUser(d.data().workerId),
      }))
    );
    return jobs;
  } catch (err) {
    console.error("[getJobRequestsForFarmer]", err);
    throw err;
  }
};

export const getJobRequestsForWorker = async (workerId) => {
  if (!workerId) return [];
  try {
    const q = query(
      collection(db, "jobRequests"),
      where("workerId", "==", workerId),
      orderBy("createdAt", "desc")
    );
    const snap = await withTimeout(getDocs(q), 10_000, "getJobRequestsForWorker");
    const jobs = await Promise.all(
      snap.docs.map(async (d) => ({
        id: d.id,
        ...d.data(),
        farmer: await getUser(d.data().farmerId),
      }))
    );
    return jobs;
  } catch (err) {
    console.error("[getJobRequestsForWorker]", err);
    throw err;
  }
};

export const updateJobStatus = async (jobId, status) => {
  if (!jobId) throw new Error("updateJobStatus: jobId required");
  const allowed = ["pending", "accepted", "rejected", "completed"];
  if (!allowed.includes(status))
    throw new Error(`updateJobStatus: invalid status "${status}"`);
  // Task 1: stamp completedAt when a job is marked completed so we can sort and count accurately
  const extra = status === "completed" ? { completedAt: serverTimestamp() } : {};
  await withTimeout(
    updateDoc(doc(db, "jobRequests", jobId), { status, updatedAt: serverTimestamp(), ...extra }),
    10_000, "updateJobStatus"
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// EMERGENCY BROADCAST
// ─────────────────────────────────────────────────────────────────────────────

export const sendEmergencyBroadcast = async (farmerId, data) => {
  if (!farmerId) throw new Error("sendEmergencyBroadcast: farmerId required");
  try {
    const snap = await withTimeout(
      getDocs(
        query(
          collection(db, "workers"),
          where("availability", "==", true),
          limit(20)
        )
      ),
      10_000, "sendEmergencyBroadcast"
    );
    if (snap.empty) return 0;
    await Promise.all(
      snap.docs.map((w) =>
        addDoc(collection(db, "jobRequests"), {
          farmerId,
          workerId:        w.id,
          status:          "pending",
          emergency:       true,
          date:            data.date || "",
          workersNeeded:   Number(data.workersNeeded) || 1,
          offeredWage:     Number(data.offeredWage) || 0,
          wage:            Number(data.offeredWage) || 0,
          workType:        data.workType || "",
          workDescription: data.workDescription || "",
          createdAt:       serverTimestamp(),
          updatedAt:       serverTimestamp(),
        })
      )
    );
    return snap.size;
  } catch (err) {
    console.error("[sendEmergencyBroadcast]", err);
    throw err;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// RATINGS
// Each farmer can rate each worker exactly once (1 document per pair).
// Document ID = `${farmerId}_${workerId}` — deterministic, prevents duplicates
// without needing a query + index.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check whether farmerId has already rated workerId.
 * Returns the existing rating document (or null).
 */
export const getExistingRating = async (farmerId, workerId) => {
  if (!farmerId || !workerId) return null;
  try {
    const ratingId = `${farmerId}_${workerId}`;
    const snap = await withTimeout(
      getDoc(doc(db, "ratings", ratingId)), 8_000, "getExistingRating"
    );
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (err) {
    console.error("[getExistingRating]", err);
    return null;
  }
};

/**
 * Submit (or update) a rating.
 *
 * Task 3 — Ratings are now stored as an array in both the ratings doc and
 * computed from that array so every individual vote is preserved.
 *
 * ratings/{farmerId}_{workerId}  →  { farmerId, workerId, ratings: [5,3,...], createdAt, updatedAt }
 * workers/{workerId}             →  { rating: <avg>, totalRatings: <count>, ... }
 *
 * One farmer, one worker = one doc. Each new vote appends to the array;
 * the worker's stored average is always recomputed from the full array.
 */
export const rateWorker = async (farmerId, workerId, newRating) => {
  if (!farmerId) throw new Error("rateWorker: farmerId required");
  if (!workerId) throw new Error("rateWorker: workerId required");
  if (newRating < 1 || newRating > 5) throw new Error("rateWorker: rating must be 1–5");

  const ratingId  = `${farmerId}_${workerId}`;
  const ratingRef = doc(db, "ratings", ratingId);
  const workerRef = doc(db, "workers", workerId);

  await withTimeout(
    runTransaction(db, async (tx) => {
      const [ratingSnap, workerSnap] = await Promise.all([
        tx.get(ratingRef),
        tx.get(workerRef),
      ]);

      if (!workerSnap.exists()) throw new Error("Worker profile not found");

      const { totalJobs: curJobs = 0 } = workerSnap.data();

      let updatedArray;

      if (ratingSnap.exists()) {
        // Append the new vote to the existing array
        const existingArr = ratingSnap.data().ratings ?? [];
        updatedArray = [...existingArr, newRating];
        tx.update(ratingRef, {
          ratings:   arrayUnion(newRating),   // Firestore arrayUnion keeps it atomic
          updatedAt: serverTimestamp(),
        });
      } else {
        // First rating from this farmer for this worker
        updatedArray = [newRating];
        tx.set(ratingRef, {
          farmerId,
          workerId,
          ratings:   [newRating],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      // Recompute true average from the full array
      const avg      = updatedArray.reduce((s, v) => s + v, 0) / updatedArray.length;
      const rounded  = Math.round(avg * 10) / 10; // 1 decimal

      tx.update(workerRef, {
        rating:       rounded,
        totalRatings: updatedArray.length,
        totalJobs:    Math.max(curJobs, updatedArray.length),
        updatedAt:    serverTimestamp(),
      });
    }),
    10_000, "rateWorker"
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SUBSCRIPTIONS
// ─────────────────────────────────────────────────────────────────────────────

export const getSubscription = async (userId) => {
  if (!userId) return null;
  try {
    const snap = await withTimeout(
      getDoc(doc(db, "subscriptions", userId)), 8_000, "getSubscription"
    );
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.error("[getSubscription]", err);
    return null;
  }
};

export const activatePaidPlan = async (userId) => {
  if (!userId) throw new Error("activatePaidPlan: userId required");
  const now = new Date();
  const end = new Date(now);
  end.setMonth(end.getMonth() + 2);
  await withTimeout(
    setDoc(doc(db, "subscriptions", userId), {
      userId,
      plan:      "paid",
      startDate: now.toISOString(),
      endDate:   end.toISOString(),
      createdAt: serverTimestamp(),
    }),
    10_000, "activatePaidPlan"
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// REAL-TIME LISTENERS  (onSnapshot)
//
// Each function returns the unsubscribe function produced by onSnapshot.
// Call it in a useEffect cleanup to prevent memory leaks:
//
//   useEffect(() => {
//     const unsub = getWorkerRequestsRealtime(id, setCb, errCb);
//     return () => unsub();
//   }, [id]);
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Real-time stream of job requests for a WORKER.
 * Ordered newest-first. Resolves farmer names in a secondary fetch.
 *
 * @param {string}   workerId
 * @param {function} onData   — called with enriched job array on every change
 * @param {function} onError  — called with Error on listener failure
 * @returns {function}  unsubscribe
 */
export const getWorkerRequestsRealtime = (workerId, onData, onError = console.error) => {
  if (!workerId) {
    onError(new Error("getWorkerRequestsRealtime: workerId required"));
    return () => {};
  }

  const q = query(
    collection(db, "jobRequests"),
    where("workerId", "==", workerId),
    orderBy("createdAt", "desc")
  );

  const unsub = onSnapshot(
    q,
    async (snap) => {
      try {
        // Resolve farmer user docs in parallel for every snapshot
        const jobs = await Promise.all(
          snap.docs.map(async (d) => {
            const data = { id: d.id, ...d.data() };
            // Fetch farmer name — getUser is safe (returns null on error)
            const farmer = await getUser(data.farmerId);
            return { ...data, farmer };
          })
        );
        onData(jobs);
      } catch (err) {
        console.error("[getWorkerRequestsRealtime] enrichment error:", err);
        // Still deliver raw data so the UI isn't blank
        onData(snap.docs.map((d) => ({ id: d.id, ...d.data(), farmer: null })));
      }
    },
    (err) => {
      console.error("[getWorkerRequestsRealtime] listener error:", err);
      onError(err);
    }
  );

  return unsub;
};

/**
 * Real-time stream of job requests sent BY a FARMER.
 * Ordered newest-first. Resolves worker name + workType in a secondary fetch.
 *
 * @param {string}   farmerId
 * @param {function} onData
 * @param {function} onError
 * @returns {function}  unsubscribe
 */
export const getFarmerRequestsRealtime = (farmerId, onData, onError = console.error) => {
  if (!farmerId) {
    onError(new Error("getFarmerRequestsRealtime: farmerId required"));
    return () => {};
  }

  const q = query(
    collection(db, "jobRequests"),
    where("farmerId", "==", farmerId),
    orderBy("createdAt", "desc")
  );

  const unsub = onSnapshot(
    q,
    async (snap) => {
      try {
        const jobs = await Promise.all(
          snap.docs.map(async (d) => {
            const data = { id: d.id, ...d.data() };
            const worker = await getWorkerWithUser(data.workerId);
            return { ...data, worker };
          })
        );
        onData(jobs);
      } catch (err) {
        console.error("[getFarmerRequestsRealtime] enrichment error:", err);
        onData(snap.docs.map((d) => ({ id: d.id, ...d.data(), worker: null })));
      }
    },
    (err) => {
      console.error("[getFarmerRequestsRealtime] listener error:", err);
      onError(err);
    }
  );

  return unsub;
};

/**
 * Real-time count of PENDING requests for a worker.
 * Lightweight — only fetches count metadata, no user enrichment.
 * Used to drive the notification badge in BottomNav.
 *
 * @param {string}   workerId
 * @param {function} onCount  — called with number on every change
 * @param {function} onError
 * @returns {function}  unsubscribe
 */
export const getPendingCountRealtime = (workerId, onCount, onError = console.error) => {
  if (!workerId) {
    onCount(0);
    return () => {};
  }

  const q = query(
    collection(db, "jobRequests"),
    where("workerId", "==", workerId),
    where("status",   "==", "pending")
  );

  const unsub = onSnapshot(
    q,
    (snap) => onCount(snap.size),
    (err) => {
      console.error("[getPendingCountRealtime] listener error:", err);
      onError(err);
    }
  );

  return unsub;
};

/**
 * Update the status of a single job request.
 * Allowed values: "pending" | "accepted" | "rejected" | "completed"
 *
 * @param {string} requestId
 * @param {string} status
 */
export const updateRequestStatus = async (requestId, status) => {
  if (!requestId) throw new Error("updateRequestStatus: requestId required");
  const allowed = ["pending", "accepted", "rejected", "completed"];
  if (!allowed.includes(status))
    throw new Error(`updateRequestStatus: invalid status "${status}"`);
  // Task 1: stamp completedAt when completed for accurate counting and sorting
  const extra = status === "completed" ? { completedAt: serverTimestamp() } : {};
  await withTimeout(
    updateDoc(doc(db, "jobRequests", requestId), {
      status,
      updatedAt: serverTimestamp(),
      ...extra,
    }),
    10_000,
    "updateRequestStatus"
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS  (appended — existing code untouched above)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Create a notification document for a user.
 * Called fire-and-forget — never throw to the caller.
 *
 * @param {string} userId  — recipient
 * @param {"job_request"|"accepted"|"rejected"|"completed"} type
 * @param {string} message — human-readable text
 */
export const createNotification = async (userId, type, message) => {
  if (!userId || !type || !message) return;
  try {
    await addDoc(collection(db, "notifications"), {
      userId,
      type,
      message,
      read:      false,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    // Notifications are non-critical — log but never crash the caller
    console.error("[createNotification]", err);
  }
};

/**
 * Mark a single notification as read.
 */
export const markNotificationRead = async (notifId) => {
  if (!notifId) return;
  try {
    await updateDoc(doc(db, "notifications", notifId), { read: true });
  } catch (err) {
    console.error("[markNotificationRead]", err);
  }
};

/**
 * Mark ALL unread notifications for a user as read.
 */
export const markAllNotificationsRead = async (userId) => {
  if (!userId) return;
  try {
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      where("read",   "==", false)
    );
    const snap = await getDocs(q);
    await Promise.all(
      snap.docs.map((d) => updateDoc(d.ref, { read: true }))
    );
  } catch (err) {
    console.error("[markAllNotificationsRead]", err);
  }
};

/**
 * Real-time listener for a user's notifications (newest first).
 * Returns unsubscribe function — call in useEffect cleanup.
 *
 * @param {string}   userId
 * @param {function} onData   — called with notification array on every change
 * @param {function} onError
 */
export const getNotificationsRealtime = (userId, onData, onError = console.error) => {
  if (!userId) { onData([]); return () => {}; }

  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(50)
  );

  return onSnapshot(q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err)  => { console.error("[getNotificationsRealtime]", err); onError(err); }
  );
};

/**
 * Convenience: send the three standard FarmLink notifications.
 * Import and call these from SearchWorkers (hire) and WorkerRequests (accept/reject).
 */
export const notifyJobRequest = (workerId, farmerName, workType) =>
  createNotification(
    workerId,
    "job_request",
    `${farmerName || "A farmer"} sent you a job request${workType ? ` for ${workType}` : ""}.`
  );

export const notifyJobAccepted = (farmerId, workerName) =>
  createNotification(
    farmerId,
    "accepted",
    `${workerName || "A worker"} accepted your job request.`
  );

export const notifyJobRejected = (farmerId, workerName) =>
  createNotification(
    farmerId,
    "rejected",
    `${workerName || "A worker"} rejected your job request.`
  );