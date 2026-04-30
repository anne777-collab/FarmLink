// src/components/WorkerCard.js
import React from "react";
import { Phone, MapPin, Star, CheckCircle, Clock } from "lucide-react";
import { Card, Badge, Button } from "./UI";
import { WORK_TYPE_MAP, formatDistance } from "../utils/helpers";

export default function WorkerCard({ worker, onHire, onCall, distance }) {
  const { user, workType, wage, availability, rating, totalJobs } = worker;
  const name = user?.name || "Worker";

  return (
    <Card className="mb-3">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xl font-bold">{name[0]?.toUpperCase()}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800 text-base truncate">{name}</h3>
            <Badge color={availability ? "green" : "red"}>
              {availability ? "✓ Available" : "Busy"}
            </Badge>
          </div>

          <p className="text-sm text-gray-500 mt-0.5">
            {WORK_TYPE_MAP[workType] || workType}
          </p>

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="flex items-center gap-1 text-sm font-semibold text-green-700">
              <span>₹{wage}/day</span>
            </span>
            {rating > 0 && (
              <span className="flex items-center gap-1 text-sm text-yellow-600">
                <Star className="w-3.5 h-3.5 fill-yellow-400 stroke-yellow-400" />
                <span>{rating.toFixed(1)} ({totalJobs || 0} jobs)</span>
              </span>
            )}
            {distance != null && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <MapPin className="w-3 h-3" />
                {formatDistance(distance)}
              </span>
            )}
          </div>

          {user?.location?.address && (
            <p className="text-xs text-gray-400 mt-1 truncate">
              📍 {user.location.address}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        {onCall && (
          user?.phone ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onCall(user.phone)}
              className="flex-1">
              <Phone className="w-4 h-4" />
              Call
            </Button>
          ) : (
            <div className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2
                            bg-gray-100 rounded-xl text-xs text-gray-400 font-medium">
              <Phone className="w-3.5 h-3.5" />
              Phone not available
            </div>
          )
        )}
        {onHire && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onHire(worker)}
            disabled={!availability}
            className="flex-1">
            Hire / काम दें
          </Button>
        )}
      </div>
    </Card>
  );
}
