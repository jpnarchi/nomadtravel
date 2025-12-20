import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { issues } = await req.json();
    
    if (!issues || !Array.isArray(issues)) {
      return Response.json({ error: 'Invalid issues array' }, { status: 400 });
    }

    const fixed = [];
    const errors = [];
    
    // Timezone de referencia (America/Monterrey = UTC-6)
    const TIMEZONE_OFFSET = -6;

    function fixDateToLocal(dateString) {
      const dateObj = new Date(dateString);
      
      // Si es una fecha "solo día" (hora 00:00 UTC), ajustar al día correcto
      const utcHour = dateObj.getUTCHours();
      if (utcHour >= 0 && utcHour <= 6) {
        // Crear fecha en zona local sin conversión UTC
        const parts = dateString.split('T')[0].split('-');
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        const day = parseInt(parts[2]);
        
        // Crear fecha a las 12:00 PM local para evitar shifts
        const localDate = new Date(year, month, day, 12, 0, 0);
        return localDate.toISOString().split('T')[0]; // Retornar solo YYYY-MM-DD
      }
      
      return dateString;
    }

    for (const issue of issues) {
      try {
        const { recordId, entityName, fieldName, storedValue } = issue;
        const fixedDate = fixDateToLocal(storedValue);
        
        // Actualizar el registro
        await base44.asServiceRole.entities[entityName].update(recordId, {
          [fieldName]: fixedDate
        });
        
        fixed.push({
          recordId,
          entityName,
          fieldName,
          oldValue: storedValue,
          newValue: fixedDate
        });
      } catch (error) {
        errors.push({
          issue,
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      fixed: fixed.length,
      errors: errors.length,
      details: {
        fixed,
        errors
      }
    });

  } catch (error) {
    console.error('Error fixing dates:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});