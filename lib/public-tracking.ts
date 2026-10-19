type PublicTrackingInput = {
  trackingId: string;
  category: string;
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED";
  createdAt: Date;
  updates: readonly { status: "PENDING" | "IN_PROGRESS" | "RESOLVED"; createdAt: Date }[];
};

export function toPublicTracking<T extends PublicTrackingInput>(request: T) {
  return {
    trackingId: request.trackingId,
    category: request.category,
    status: request.status,
    createdAt: request.createdAt,
    updates: request.updates.map(({ status, createdAt }) => ({ status, createdAt })),
  };
}
