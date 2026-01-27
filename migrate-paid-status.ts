import { supabaseAPI } from './src/api/supabaseClient';

async function migrateConfirmedToPaid() {
  console.log('🔄 Iniciando migración de pagos confirmados a pagados...');

  try {
    // Primero, obtener todos los pagos que están confirmados pero no pagados
    const { data: paymentsToUpdate, error: fetchError } = await supabaseAPI.client
      .from('supplier_payments')
      .select('id, supplier, amount, confirmed, paid')
      .eq('confirmed', true)
      .neq('paid', true);

    if (fetchError) {
      console.error('❌ Error al obtener pagos:', fetchError);
      return;
    }

    if (!paymentsToUpdate || paymentsToUpdate.length === 0) {
      console.log('✅ No hay pagos para migrar. Todos los pagos confirmados ya están marcados como pagados.');
      return;
    }

    console.log(`📊 Se encontraron ${paymentsToUpdate.length} pagos para migrar`);

    // Actualizar todos los pagos confirmados a pagados
    const { error: updateError } = await supabaseAPI.client
      .from('supplier_payments')
      .update({ paid: true })
      .eq('confirmed', true)
      .neq('paid', true);

    if (updateError) {
      console.error('❌ Error al actualizar pagos:', updateError);
      return;
    }

    console.log(`✅ Migración completada exitosamente!`);
    console.log(`✅ ${paymentsToUpdate.length} pagos fueron marcados como "Pagado"`);

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  }
}

migrateConfirmedToPaid();
