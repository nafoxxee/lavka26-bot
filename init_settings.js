const { createClient } = require('@supabase/supabase-js');

// Конфигурация
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'your-anon-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function initSettings() {
    try {
        console.log('🔧 Инициализация таблицы settings...');
        
        // Пробуем создать таблицу через SQL
        const { error: createError } = await supabase.rpc('exec_sql', {
            sql: `
                CREATE TABLE IF NOT EXISTS settings (
                    id SERIAL PRIMARY KEY,
                    sbp_phone VARCHAR(20),
                    sbp_bank VARCHAR(255),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
                
                INSERT INTO settings (id, sbp_phone, sbp_bank) 
                SELECT 1, NULL, NULL 
                WHERE NOT EXISTS (SELECT 1 FROM settings WHERE id = 1);
            `
        });
        
        if (createError) {
            console.log('❌ Ошибка создания таблицы через RPC:', createError);
            
            // Пробуем прямой подход - просто вставляем запись
            console.log('🔄 Пробуем прямой подход...');
            const { data, error: insertError } = await supabase
                .from('settings')
                .upsert({ 
                    id: 1, 
                    sbp_phone: null, 
                    sbp_bank: null 
                }, {
                    onConflict: 'id'
                });
                
            if (insertError) {
                console.log('❌ Ошибка прямого подхода:', insertError);
                
                // Последний вариант - создаем через raw SQL
                console.log('🔄 Пробуем через raw SQL...');
                const { error: rawError } = await supabase
                    .from('settings')
                    .select('*')
                    .limit(1);
                    
                if (rawError && rawError.code === 'PGRST116') {
                    console.log('❌ Таблица settings не существует. Нужно создать вручную в Supabase Dashboard');
                    console.log('📝 SQL для создания:');
                    console.log(`
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    sbp_phone VARCHAR(20),
    sbp_bank VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO settings (id, sbp_phone, sbp_bank) 
VALUES (1, NULL, NULL);

ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
                    `);
                } else {
                    console.log('✅ Таблица settings существует!');
                }
            } else {
                console.log('✅ Таблица settings инициализирована!');
            }
        } else {
            console.log('✅ Таблица settings создана через RPC!');
        }
        
        // Проверяем, что таблица работает
        const { data: testData, error: testError } = await supabase
            .from('settings')
            .select('*')
            .eq('id', 1)
            .single();
            
        if (testError) {
            console.log('❌ Ошибка проверки таблицы:', testError);
        } else {
            console.log('✅ Таблица settings работает корректно:', testData);
        }
        
    } catch (error) {
        console.error('❌ Общая ошибка:', error);
    }
}

initSettings();
