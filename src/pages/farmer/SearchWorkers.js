// src/pages/farmer/SearchWorkers.js
import React, { useState, useEffect, useCallback } from "react";
import { Search, SlidersHorizontal, X, RefreshCw, Lock } from "lucide-react";
import { getAllWorkers, createJobRequest, getSubscription, notifyJobRequest } from "../../firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import WorkerCard from "../../components/WorkerCard";
import { Button, Select, Input, Modal, Spinner, EmptyState } from "../../components/UI";
import { WORK_TYPES, calcDistance } from "../../utils/helpers";
import toast from "react-hot-toast";

const ALL_WORK_TYPES = [{ value: "", label: "All Types" }, ...WORK_TYPES];
const AVAIL_OPTIONS  = [
  { value: "all",       label: "All Workers" },
  { value: "available", label: "Available Now" },
  { value: "busy",      label: "Busy" },
];

const EMPTY_HIRE = { date: "", workersNeeded: 1, offeredWage: "", workType: "", workDescription: "" };
const MAX_DISTANCE = 10; // km

const getLatLng = (location) => {
  const lat = Number(location?.lat);
  const lng = Number(location?.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
};

export default function SearchWorkers() {
  const { userProfile } = useAuth();

  const [workers,      setWorkers]      = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [fetchError,   setFetchError]   = useState(null);
  const [showFilters,  setShowFilters]  = useState(false);
  const [search,       setSearch]       = useState("");
  const [nearbyOnly,   setNearbyOnly]   = useState(false); // NEW: nearby filter toggle
  const [filters,      setFilters]      = useState({
    workType:     "",
    availability: "available",
    maxWage:      "",
  });

  const [hireWorker,  setHireWorker]  = useState(null);
  const [hireForm,    setHireForm]    = useState(EMPTY_HIRE);
  const [hireLoading, setHireLoading] = useState(false);
  const [hireErrors,  setHireErrors]  = useState({});
  const [subscription, setSubscription] = useState(null);
  const [isDistanceSorted, setIsDistanceSorted] = useState(false); // Task 3: true when workers sorted by GPS distance

  // ── Load subscription once ─────────────────────────────────────────────────
  useEffect(() => {
    if (!userProfile?.id) return;
    getSubscription(userProfile.id)
      .then(setSubscription)
      .catch((err) => console.error("[SearchWorkers] getSubscription:", err));
  }, [userProfile?.id]);

  // ── Fetch workers ──────────────────────────────────────────────────────────
  const fetchWorkers = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await getAllWorkers({
        workType:     filters.workType     || undefined,
        availability: filters.availability || "all",
        maxWage:      filters.maxWage      || undefined,
      });

      // Calculate distance from stored farmer/worker GPS coordinates.
      const farmerCoords = getLatLng(userProfile?.location);
      let distanceSorted = false;

      if (farmerCoords) {
        data.forEach((w) => {
          const workerCoords = getLatLng(w.user?.location);
          if (workerCoords) {
            w.distance = calcDistance(
              farmerCoords.lat, farmerCoords.lng,
              workerCoords.lat, workerCoords.lng
            );
          }
          // Workers without GPS get undefined distance — sorted to the end
        });

        // Sort: workers with distance first (ascending), then no-GPS workers
        data.sort((a, b) => {
          const da = a.distance ?? Infinity;
          const db = b.distance ?? Infinity;
          return da - db;
        });

        distanceSorted = data.some((w) => w.distance !== undefined);
      }

      setWorkers(data);
      setIsDistanceSorted(distanceSorted);

      if (data.length === 0) {
        console.info("[SearchWorkers] Query returned 0 workers with filters:", filters);
      }
    } catch (err) {
      const msg =
        err?.message?.includes("timed out")
          ? "Could not reach database. Check your internet connection."
          : err?.message?.includes("index")
          ? "Database index missing — run: firebase deploy --only firestore:indexes"
          : "Error loading workers. Pull to refresh.";
      setFetchError(msg);
      toast.error(msg);
      console.error("[SearchWorkers] fetchWorkers:", err);
    } finally {
      setLoading(false);
    }
  }, [filters, userProfile]);

  useEffect(() => { fetchWorkers(); }, [fetchWorkers]);

  // ── Derived state ──────────────────────────────────────────────────────────
  const isPaid = subscription && new Date(subscription.endDate) > new Date();

  // Free plan: show only first 3 workers; paid plan: unlimited
  const FREE_LIMIT = 3;
  const workerLimit = isPaid ? Infinity : FREE_LIMIT;

  const farmerArea = userProfile?.location?.address?.split(",")[0]?.trim()?.toLowerCase() || "";
  const farmerCoords = getLatLng(userProfile?.location);

  const displayed = workers.filter((w) => {
    // Name search
    if (search && !w.user?.name?.toLowerCase().includes(search.toLowerCase())) return false;

    // Nearby filter: use only GPS distance from stored lat/lng values.
    if (nearbyOnly && farmerCoords) {
      return w.distance != null && w.distance <= MAX_DISTANCE;
    }

    return true;
  });

  // Workers visible to this user (sliced for free plan)
  const visibleWorkers = displayed.slice(0, workerLimit);
  const lockedCount    = Math.max(0, displayed.length - visibleWorkers.length);

  // ── Hire modal helpers ─────────────────────────────────────────────────────
  const openHireModal = (worker) => {
    setHireWorker(worker);
    setHireForm({
      ...EMPTY_HIRE,
      offeredWage: String(worker.wage || ""),
      workType:    worker.workType || "",
    });
    setHireErrors({});
  };

  const validateHire = () => {
    const e = {};
    if (!hireForm.date)        e.date        = "Select a date";
    if (!hireForm.offeredWage) e.offeredWage = "Enter wage";
    const w = Number(hireForm.offeredWage);
    if (isNaN(w) || w <= 0)    e.offeredWage = "Enter a valid wage";
    setHireErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleHire = async () => {
    if (!validateHire()) return;
    setHireLoading(true);
    try {
      await createJobRequest({
        farmerId:        userProfile.id,
        workerId:        hireWorker.id,
        date:            hireForm.date,
        workersNeeded:   Number(hireForm.workersNeeded) || 1,
        offeredWage:     Number(hireForm.offeredWage),
        workType:        hireForm.workType || hireWorker.workType || "",
        workDescription: hireForm.workDescription || "",
      });
      toast.success("Job request sent!");
      // Notify worker — fire-and-forget, never blocks UI
      notifyJobRequest(
        hireWorker.id,
        userProfile?.name,
        hireForm.workType || hireWorker.workType
      );
      setHireWorker(null);
      setHireForm(EMPTY_HIRE);
    } catch (err) {
      const msg = err?.message?.includes("timed out")
        ? "Request timed out. Please try again."
        : "Failed to send request. Try again.";
      toast.error(msg);
      console.error("[SearchWorkers] handleHire:", err);
    } finally {
      setHireLoading(false);
    }
  };

  const handleCall = (phone) => {
    if (phone) window.open(`tel:${phone}`);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="px-4 py-5 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-black text-gray-800">Find Workers</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchWorkers}
            disabled={loading}
            className="p-2 rounded-xl bg-white border border-gray-200 text-gray-500
                       hover:text-green-600 disabled:opacity-40 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors
              ${showFilters
                ? "bg-green-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-green-400"}`}>
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Search box */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
        <input
          type="search"
          placeholder="Search workers by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-9 py-3 rounded-xl border-2 border-gray-200
                     focus:border-green-400 outline-none text-base bg-white"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-3.5">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 space-y-3">
          <Select
            label="Work Type"
            options={ALL_WORK_TYPES}
            value={filters.workType}
            onChange={(e) => setFilters((f) => ({ ...f, workType: e.target.value }))}
          />
          <Select
            label="Availability"
            options={AVAIL_OPTIONS}
            value={filters.availability}
            onChange={(e) => setFilters((f) => ({ ...f, availability: e.target.value }))}
          />
          <Input
            label="Max Wage per day (Rs.)"
            type="number"
            inputMode="numeric"
            placeholder="e.g. 500"
            value={filters.maxWage}
            onChange={(e) => setFilters((f) => ({ ...f, maxWage: e.target.value }))}
          />
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="md"
              className="flex-1"
              onClick={() => {
                setFilters({ workType: "", availability: "available", maxWage: "" });
                setNearbyOnly(false);
              }}>
              Reset
            </Button>
            <Button variant="primary" size="md" className="flex-1" onClick={fetchWorkers}>
              Apply
            </Button>
          </div>

          {/* Nearby toggle — only useful when farmer has GPS coordinates */}
          {farmerCoords && (
            <button
              type="button"
              onClick={() => setNearbyOnly((v) => !v)}
              className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5
                          text-sm font-semibold border transition-colors
                          ${nearbyOnly
                            ? "bg-green-600 text-white border-green-600"
                            : "bg-white text-gray-600 border-gray-200 hover:border-green-400"}`}>
              <span>&#128205; Show nearby only ({farmerArea || `${MAX_DISTANCE} km`})</span>
              <span className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5
                               ${nearbyOnly ? "bg-white/30" : "bg-gray-200"}`}>
                <span className={`w-4 h-4 rounded-full bg-white shadow transition-transform
                                 ${nearbyOnly ? "translate-x-5" : "translate-x-0"}`} />
              </span>
            </button>
          )}
        </div>
      )}

      {/* Free plan notice */}
      {!isPaid && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-start gap-2">
          <span className="text-lg">&#128161;</span>
          <div>
            <p className="text-amber-800 text-xs font-semibold">
              Free Plan: See up to {FREE_LIMIT} {isDistanceSorted ? "nearest" : ""} workers
            </p>
            <p className="text-amber-600 text-xs">
              Upgrade to Pro to see all workers
            </p>
          </div>
        </div>
      )}

      {/* Error banner */}
      {fetchError && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-sm text-red-700">
          {fetchError}
        </div>
      )}

      {/* Results count */}
      {!loading && (
        <p className="text-sm text-gray-500 mb-3">
          {displayed.length} worker{displayed.length !== 1 ? "s" : ""} found
        </p>
      )}

      {/* List */}
      {loading ? (
        <div className="py-16"><Spinner /></div>
      ) : displayed.length === 0 ? (
        <EmptyState
          icon="&#128119;"
          title="No workers found"
          subtitle={
            nearbyOnly
              ? `No workers found near ${farmerArea}. Try turning off "nearby only".`
              : Object.values(filters).some(Boolean)
              ? "Try removing some filters"
              : "No workers have registered yet"
          }
          action={
            <Button variant="secondary" size="sm" onClick={fetchWorkers}>
              Refresh
            </Button>
          }
        />
      ) : (
        <>
          {visibleWorkers.map((w) => (
            <WorkerCard
              key={w.id}
              worker={w}
              distance={w.distance}
              onCall={() => handleCall(w.user?.phone)}
              onHire={() => openHireModal(w)}
            />
          ))}

          {/* Locked card — shown when free plan limit reached */}
          {lockedCount > 0 && (
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl
                            p-5 flex flex-col items-center justify-center text-center mb-3">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                <Lock className="w-6 h-6 text-gray-400" />
              </div>
              <p className="font-bold text-gray-700 text-sm">
                {lockedCount} more worker{lockedCount !== 1 ? "s" : ""} available
              </p>
              <p className="text-gray-400 text-xs mt-1 mb-3">
                {isDistanceSorted
                  ? `You're seeing the ${FREE_LIMIT} nearest workers. Upgrade to Pro to see all.`
                  : "Upgrade to Pro to see all workers in your area"}
              </p>
              <button
                type="button"
                onClick={() => toast("Pro plan coming soon! &#127775;", { icon: "&#127819;", duration: 3000 })}
                className="bg-green-600 text-white text-sm font-bold px-4 py-2
                           rounded-xl hover:bg-green-700 active:scale-95 transition-all">
                &#127775; Upgrade to Pro (Coming Soon)
              </button>
            </div>
          )}
        </>
      )}

      {/* Hire modal */}
      <Modal
        open={!!hireWorker}
        onClose={() => !hireLoading && setHireWorker(null)}
        title={`Hire ${hireWorker?.user?.name || "Worker"}`}>
        <div className="space-y-4">
          {/* Wage transparency notice */}
          <div className="bg-green-50 rounded-xl p-3">
            <p className="text-sm font-semibold text-green-700">
              Rs.{hireForm.offeredWage || hireWorker?.wage}/day
            </p>
            <p className="text-xs text-green-600 mt-0.5">
              No commission — direct payment to worker
            </p>
          </div>

          {/* Date */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Work Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={hireForm.date}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => {
                setHireForm((f) => ({ ...f, date: e.target.value }));
                if (hireErrors.date) setHireErrors((e) => ({ ...e, date: undefined }));
              }}
              className={`w-full px-4 py-3 rounded-xl border-2 outline-none text-base
                ${hireErrors.date
                  ? "border-red-400 bg-red-50"
                  : "border-gray-200 focus:border-green-400"}`}
            />
            {hireErrors.date && (
              <p className="text-xs text-red-500 mt-1">{hireErrors.date}</p>
            )}
          </div>

          <Input
            label="Workers Needed"
            type="number"
            inputMode="numeric"
            min={1}
            value={hireForm.workersNeeded}
            onChange={(e) => setHireForm((f) => ({ ...f, workersNeeded: e.target.value }))}
          />

          <Input
            label="Offered Wage per day (Rs.) *"
            type="number"
            inputMode="numeric"
            value={hireForm.offeredWage}
            error={hireErrors.offeredWage}
            onChange={(e) => {
              setHireForm((f) => ({ ...f, offeredWage: e.target.value }));
              if (hireErrors.offeredWage)
                setHireErrors((err) => ({ ...err, offeredWage: undefined }));
            }}
          />

          <Input
            label="Work Description (optional)"
            placeholder="e.g. Wheat harvesting, 2 acres"
            value={hireForm.workDescription}
            onChange={(e) => setHireForm((f) => ({ ...f, workDescription: e.target.value }))}
          />

          <div className="flex gap-3 pt-1">
            <Button
              variant="secondary"
              size="md"
              className="flex-1"
              disabled={hireLoading}
              onClick={() => setHireWorker(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              className="flex-1"
              loading={hireLoading}
              onClick={handleHire}>
              Send Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
