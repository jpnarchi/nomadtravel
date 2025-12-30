import { createClient } from '@supabase/supabase-js';

// Obtener las variables de entorno de Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validar que las variables de entorno estén configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Faltan las variables de entorno de Supabase');
  console.error('Por favor configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env');
}

// Crear el cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Helper functions para interactuar con las tablas de manera similar a base44

export const createSupabaseAPI = () => {
  // Función helper genérica para crear métodos CRUD para cualquier tabla
  const createEntityMethods = (tableName) => ({
    // Listar todos los registros
    list: async () => {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('created_date', { ascending: false });

      if (error) {
        console.error(`Error listing ${tableName}:`, error);
        throw error;
      }
      return data || [];
    },

    // Filtrar registros
    filter: async (filters = {}) => {
      let query = supabase.from(tableName).select('*');

      // Aplicar cada filtro
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      query = query.order('created_date', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error(`Error filtering ${tableName}:`, error);
        throw error;
      }
      return data || [];
    },

    // Obtener un registro por ID
    get: async (id) => {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error(`Error getting ${tableName}:`, error);
        throw error;
      }
      return data;
    },

    // Crear un nuevo registro
    create: async (newData) => {
      const { data, error } = await supabase
        .from(tableName)
        .insert([newData])
        .select()
        .single();

      if (error) {
        console.error(`Error creating ${tableName}:`, error);
        throw error;
      }
      return data;
    },

    // Actualizar un registro existente
    update: async (id, updates) => {
      const { data, error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error(`Error updating ${tableName}:`, error);
        throw error;
      }
      return data;
    },

    // Eliminar un registro (soft delete - marca como eliminado)
    delete: async (id) => {
      const { data, error } = await supabase
        .from(tableName)
        .update({
          is_deleted: true
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error(`Error deleting ${tableName}:`, error);
        throw error;
      }
      return data;
    },

    // Eliminar permanentemente (hard delete - solo usar cuando sea necesario)
    hardDelete: async (id) => {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) {
        console.error(`Error hard deleting ${tableName}:`, error);
        throw error;
      }
      return { success: true };
    }
  });

  return {
    // Autenticación
    auth: {
      signUp: async (email, password, metadata = {}) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: metadata
          }
        });
        if (error) throw error;
        return data;
      },

      signIn: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        return data;
      },

      signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      },

      getCurrentUser: async () => {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return user;
      },

      getSession: async () => {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        return session;
      },

      onAuthStateChange: (callback) => {
        return supabase.auth.onAuthStateChange(callback);
      }
    },

    // Storage - Manejo de archivos
    storage: {
      uploadFile: async (file, bucket = 'documents', path = null) => {
        try {
          // Generar un nombre único para el archivo
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = path ? `${path}/${fileName}` : fileName;

          // Subir el archivo al bucket
          const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (error) {
            console.error('Error uploading file:', error);
            throw error;
          }

          // Obtener la URL pública del archivo
          const { data: publicUrlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(data.path);

          return {
            file_url: publicUrlData.publicUrl,
            file_path: data.path,
            file_name: file.name
          };
        } catch (error) {
          console.error('Error in uploadFile:', error);
          throw error;
        }
      },

      deleteFile: async (filePath, bucket = 'documents') => {
        const { error } = await supabase.storage
          .from(bucket)
          .remove([filePath]);

        if (error) {
          console.error('Error deleting file:', error);
          throw error;
        }
        return { success: true };
      },

      getPublicUrl: (filePath, bucket = 'documents') => {
        const { data } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);
        return data.publicUrl;
      }
    },

    // Entidades del CRM - crear métodos para cada tabla
    entities: {
      User: createEntityMethods('users'),
      Client: createEntityMethods('clients'),
      Trip: createEntityMethods('trips'),
      SoldTrip: createEntityMethods('sold_trips'),
      Task: createEntityMethods('tasks'),
      TripService: createEntityMethods('trip_services'),
      ClientPayment: createEntityMethods('client_payments'),
      SupplierPayment: createEntityMethods('supplier_payments'),
      Supplier: createEntityMethods('suppliers'),
      Reminder: createEntityMethods('reminders'),
      Credential: createEntityMethods('credentials'),
      Review: createEntityMethods('reviews'),
      Attendance: createEntityMethods('attendance'),
      FamTrip: createEntityMethods('fam_trips'),
      IndustryFair: createEntityMethods('industry_fairs'),
      Commission: createEntityMethods('commissions'),
      TravelDocument: createEntityMethods('travel_documents'),
      LearningMaterial: createEntityMethods('learning_materials')
    }
  };
};

// Exportar la API
export const supabaseAPI = createSupabaseAPI();

// Re-export del cliente para uso directo cuando sea necesario
export default supabase;
