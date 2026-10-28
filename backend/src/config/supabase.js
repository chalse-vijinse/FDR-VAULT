import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const SUPABASE_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'fdr-documents';

let supabase = null;
let isConfigured = false;

if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && SUPABASE_URL.startsWith('http')) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    isConfigured = true;
    console.log(`[Supabase] Successfully initialized Supabase client at: ${SUPABASE_URL}`);
  } catch (err) {
    console.warn('[Supabase] Failed to initialize Supabase client:', err.message);
  }
} else {
  console.log('[Supabase] Credentials not set in .env. Operating in standard local database mode.');
}

export function isSupabaseConfigured() {
  return isConfigured && supabase !== null;
}

export function getSupabaseClient() {
  return supabase;
}

/**
 * Upload a document to Supabase Storage if configured
 */
export async function uploadToSupabaseStorage(fileName, fileBuffer, mimeType) {
  if (!isSupabaseConfigured()) {
    return { success: false, reason: 'SUPABASE_NOT_CONFIGURED' };
  }

  try {
    const { data, error } = await supabase.storage
      .from(SUPABASE_STORAGE_BUCKET)
      .upload(fileName, fileBuffer, {
        contentType: mimeType,
        upsert: true
      });

    if (error) {
      console.warn('[Supabase Storage] Upload error:', error.message);
      return { success: false, error: error.message };
    }

    const { data: urlData } = supabase.storage
      .from(SUPABASE_STORAGE_BUCKET)
      .getPublicUrl(fileName);

    return {
      success: true,
      path: data.path,
      publicUrl: urlData?.publicUrl
    };
  } catch (err) {
    console.warn('[Supabase Storage] Unexpected error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Download a document from Supabase Storage
 */
export async function downloadFromSupabaseStorage(fileName) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } = await supabase.storage
      .from(SUPABASE_STORAGE_BUCKET)
      .download(fileName);

    if (error) {
      console.warn('[Supabase Storage] Download error:', error.message);
      return null;
    }

    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    console.warn('[Supabase Storage] Download exception:', err.message);
    return null;
  }
}

export default {
  isSupabaseConfigured,
  getSupabaseClient,
  uploadToSupabaseStorage,
  downloadFromSupabaseStorage
};
