export interface CustomField {
  id: string;
  category: "details" | "camp" | "tags" | "company" | "events";
  type: string; // text, date, number, etc.
  label: string;
}

export interface ContactEvent {
  time: string;
  title: string;
  text: string;
}

export interface FormSubmission {
  name: string;
  page: string;
  date: string;
}

export interface Contact {
  id?: string;
  ownerId: string;
  status: "active" | "trashed";
  
  // Core Fields
  conta_name: string;
  f_m?: string;
  conta_phone: string;
  email?: string;
  gender?: string;
  
  // Address Fields
  mh_crm_city?: string;
  mh_crm_street?: string;
  
  // Tag Fields
  tg1?: string;
  tg2?: string;
  tg3?: string;

  // Company Fields
  company_name?: string;
  job_title?: string;
  lead_source?: string;

  // Other Contact Info
  work_phone?: string;
  website?: string;
  birth_date?: string; // YYYY-MM-DD
  notes?: string;
  events?: ContactEvent[];
  form_submissions?: FormSubmission[];

  // Form Tracking Fields
  last_form_name?: string;
  last_form_page?: string;
  last_form_submission_date?: string;
  
  // Message Tracking Fields
  last_message_read_status?: string;

  // WooCommerce Summary Fields
  total_spent?: number;
  order_count?: number;
  last_order_date?: string;

  // Camp / Family Fields
  child_first_name?: string;
  child_last_name?: string;
  child_grade?: string;
  child_id_number?: string;
  allergies_has?: "כן" | "לא" | string;
  allergies_details?: string;
  father_name?: string;
  mother_name?: string;
  father_phone?: string;
  mother_phone?: string;

  // Timestamps
  createdAt?: string;
  updatedAt?: string;

  // Dynamic custom fields
  [key: string]: any;
}
