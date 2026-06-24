// Entity + auth handles. Import these everywhere — never base44Client directly.
import { base44 } from "./base44Client";

export const Lecture = base44.entities.Lecture;
export const Enrollment = base44.entities.Enrollment;
export const Progress = base44.entities.Progress;
export const TranslationJob = base44.entities.TranslationJob;
export const CourseResource = base44.entities.CourseResource;
export const KitShipment = base44.entities.KitShipment;
export const Meeting = base44.entities.Meeting;
export const Stone = base44.entities.Stone;

// Base44 exposes the current-user / auth API as base44.auth.
export const User = base44.auth;

export { base44 };
