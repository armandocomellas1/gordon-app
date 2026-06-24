// Core integrations passthrough (LLM, email, uploads). Stubbed in demo mode.
import { base44 } from "./base44Client";

export const Core = base44.integrations?.Core;

export const InvokeLLM = (...args) => Core.InvokeLLM(...args);
export const SendEmail = (...args) => Core.SendEmail(...args);
export const UploadFile = (...args) => Core.UploadFile(...args);
