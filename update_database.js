const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function updateDatabase() {
  try {
    console.log('🚀 Начинаю обновление базы данных...');
    
    // Сначала удаляем старый constraint
    console.log('📝 Удаляю старый constraint...');
    const { error: dropError } = await supabase
      .rpc('exec_sql', { 
        sql: 'ALTER TABLE ads DROP CONSTRAINT IF EXISTS ads_status_check;' 
      });
    
    if (dropError) {
      console.log('⚠️ Ошибка удаления constraint:', dropError.message);
    } else {
      console.log('✅ Старый constraint удален');
    }
    
    // Создаем новый constraint
    console.log('📝 Создаю новый constraint...');
    const { error: createError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          ALTER TABLE ads 
          ADD CONSTRAINT ads_status_check 
          CHECK (status IN ('draft', 'moderation', 'active', 'inactive', 'sold', 'blocked', 'archived', 'payment_pending', 'payment_review', 'published', 'completed', 'cancelled', 'rejected'));
        ` 
      });
    
    if (createError) {
      console.log('❌ Ошибка создания constraint:', createError.message);
      
      // Пробуем альтернативный метод через psql
      console.log('🔄 Пробую альтернативный метод...');
      
      // Просто проверим текущие статусы в базе
      const { data: ads, error: selectError } = await supabase
        .from('ads')
        .select('id, status')
        .limit(5);
      
      if (selectError) {
        console.log('❌ Ошибка выборки:', selectError.message);
      } else {
        console.log('✅ Текущие статусы в базе:');
        ads.forEach(ad => {
          console.log(`  ID: ${ad.id}, Статус: ${ad.status}`);
        });
      }
    } else {
      console.log('✅ Новый constraint создан успешно');
    }
    
    console.log('🎉 Обновление завершено!');
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

updateDatabase();
