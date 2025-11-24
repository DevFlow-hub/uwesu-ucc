import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gwxitvevopdmuzwgqeis.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3eGl0dmV2b3BkbXV6d2dxZWlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4OTU5NDYsImV4cCI6MjA3OTQ3MTk0Nn0.PEgnf5fLyDiTnsZ-q3umPGCmQD13LHI78xaNf54H0dg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
