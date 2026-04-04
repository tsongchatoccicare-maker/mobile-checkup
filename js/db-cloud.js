// Cloud Database Layer — ใช้แทน localStorage
const supabase = window.supabase.createClient(zcmxmlhnftdxuxbnverl.supabase.co, eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjbXhtbGhuZnRkeHV4Ym52ZXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMDE2ODYsImV4cCI6MjA5MDg3NzY4Nn0.VZ08eCygZDPxMe3FFKDHb9qU8sIElCGrulV8z_j5vXc);

const CloudDB = {
  async getAll(dbName, tableName) {
    const { data, error } = await supabase
      .from('mck_store')
      .select('data')
      .eq('db_name', dbName)
      .eq('table_name', tableName)
      .single();
    if (error || !data) return [];
    return data.data || [];
  },

  async setAll(dbName, tableName, rows) {
    const { data: existing } = await supabase
      .from('mck_store')
      .select('id')
      .eq('db_name', dbName)
      .eq('table_name', tableName)
      .single();

    if (existing) {
      await supabase
        .from('mck_store')
        .update({ data: rows, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('mck_store')
        .insert({ db_name: dbName, table_name: tableName, data: rows });
    }
  }
};
