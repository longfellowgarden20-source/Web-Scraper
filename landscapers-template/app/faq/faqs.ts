// FAQs are now sourced from config/business.ts
// This file re-exports them for backwards compatibility with any import that uses this path.
import { business } from '../../config/business'

export const faqs = business.faqs
