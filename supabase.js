import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 'https://vgzeszfngjmesepmqssl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnemVzemZuZ2ptZXNlcG1xc3NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NzM0NjAsImV4cCI6MjA5MzQ0OTQ2MH0.TWWvfAgkxW5-0sGQdQAVwzAPYIf4HqsNO6IHb4px47Y';

export const supabase = createClient(supabaseUrl, supabaseKey);
