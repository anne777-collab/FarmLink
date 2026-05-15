import { JobPost, RatingItem, UserProfile } from "../context/AppContext";

export interface TrustProfile {
  averageRating: number;
  completedJobs: number;
  totalReviews: number;
  completionRate: number;
  responseRate: number;
  trustScore: number;
  badges: string[];
}

export interface WorkerMatch {
  worker: UserProfile;
  score: number;
  reasons: string[];
  trust: TrustProfile;
}

export interface JobMatch {
  job: JobPost;
  score: number;
  reasons: string[];
}

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

export const buildTrustProfile = (userId: string, ratings: RatingItem[], completedJobs: number, cancelledJobs = 0): TrustProfile => {
  const userRatings = ratings.filter(rating => rating.toUserId === userId);
  const totalReviews = userRatings.length;
  const averageRating = totalReviews
    ? userRatings.reduce((sum, item) => sum + item.rating, 0) / totalReviews
    : 0;
  const totalClosedJobs = completedJobs + cancelledJobs;
  const completionRate = totalClosedJobs ? Math.round((completedJobs / totalClosedJobs) * 100) : 100;
  const responseRate = completedJobs > 0 || totalReviews > 0 ? 92 : 75;
  const ratingScore = totalReviews ? (averageRating / 5) * 45 : 24;
  const volumeScore = Math.min(20, completedJobs * 4);
  const completionScore = completionRate * 0.2;
  const responseScore = responseRate * 0.15;
  const trustScore = Math.round(clamp(ratingScore + volumeScore + completionScore + responseScore));
  const badges: string[] = ["Verified User"];

  if (averageRating >= 4.5 && totalReviews >= 3) badges.push("Top Rated");
  if (responseRate >= 90) badges.push("Fast Response");
  if (trustScore >= 75) badges.push("Trusted Worker");
  if (completionRate >= 90 && completedJobs >= 3) badges.push("Reliable Completion");

  return {
    averageRating,
    completedJobs,
    totalReviews,
    completionRate,
    responseRate,
    trustScore,
    badges,
  };
};

export const rankWorkersForJob = (
  workers: UserProfile[],
  ratings: RatingItem[],
  completedJobsByWorker: Record<string, number>,
  preferredSkill = "All",
  farmerWageTarget?: number
): WorkerMatch[] => {
  return workers
    .map(worker => {
      const trust = buildTrustProfile(worker.uid, ratings, completedJobsByWorker[worker.uid] || 0);
      const distance = worker.distance ?? 25;
      const hasSkill = preferredSkill === "All" || worker.skills?.includes(preferredSkill);
      const skillScore = hasSkill ? 28 : 10;
      const proximityScore = clamp(25 - Math.min(distance, 25), 0, 25);
      const trustScore = trust.trustScore * 0.3;
      const availabilityScore = worker.availability === "Available Today" ? 14 : worker.availability === "Available This Week" ? 8 : 1;
      const wageGap = farmerWageTarget && worker.wageExpectation ? Math.abs(worker.wageExpectation - farmerWageTarget) : 0;
      const wageScore = farmerWageTarget ? clamp(12 - wageGap / 50, 0, 12) : 8;
      const score = Math.round(clamp(skillScore + proximityScore + trustScore + availabilityScore + wageScore));
      const reasons: string[] = [];

      if (distance <= 5) reasons.push("Closest Worker");
      if (trust.averageRating >= 4.5) reasons.push("Top Rated");
      if (worker.availability === "Available Today") reasons.push("Available Today");
      if (hasSkill && preferredSkill !== "All") reasons.push("Skill Match");
      if (wageScore >= 10) reasons.push("Wage Fit");
      if (reasons.length === 0) reasons.push("Good Local Match");

      return { worker, score, reasons, trust };
    })
    .sort((a, b) => b.score - a.score);
};

export const rankJobsForWorker = (jobs: JobPost[], worker: UserProfile): JobMatch[] => {
  return jobs
    .map(job => {
      const distance = job.distance ?? 25;
      const skillMatch = worker.skills?.includes(job.workType) ? 32 : 14;
      const proximityScore = clamp(28 - Math.min(distance, 28), 0, 28);
      const wageExpectation = worker.wageExpectation || 0;
      const wageScore = wageExpectation ? clamp(24 - Math.max(0, wageExpectation - job.wage) / 25, 0, 24) : 14;
      const urgencyScore = job.status === "posted" ? 12 : 8;
      const score = Math.round(clamp(skillMatch + proximityScore + wageScore + urgencyScore));
      const reasons: string[] = [];

      if (worker.skills?.includes(job.workType)) reasons.push("Skill Match");
      if (distance <= 8) reasons.push("Nearby Farm");
      if (!wageExpectation || job.wage >= wageExpectation) reasons.push("Good Wage");
      if (job.status === "posted") reasons.push("Fresh Opening");
      if (reasons.length === 0) reasons.push("Relevant Work");

      return { job, score, reasons };
    })
    .sort((a, b) => b.score - a.score);
};
