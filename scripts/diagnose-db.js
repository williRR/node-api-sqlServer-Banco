import dotenv from 'dotenv';
import sql from 'mssql';

dotenv.config();

const dbSettings = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'willi2312',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || 'Banco_Backup',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    connectTimeout: 30000
  }
};

console.log('🔍 DIAGNÓSTICO COMPLETO DE BASE DE DATOS');
console.log('=========================================\n');

async function diagnose() {
  try {
    console.log('📋 Configuración de conexión:');
    console.log(`   Servidor: ${dbSettings.server}`);
    console.log(`   Base de datos: ${dbSettings.database}`);
    console.log(`   Usuario: ${dbSettings.user}`);
    console.log(`   Encrypt: ${dbSettings.options.encrypt}\n`);

    console.log('🔌 Conectando...\n');
    const pool = await sql.connect(dbSettings);
    console.log('✅ Conexión exitosa!\n');

    // 1. Verificar versión
    console.log('📊 Información del servidor:');
    const version = await pool.request().query('SELECT @@VERSION AS Version');
    console.log(`   ${version.recordset[0].Version.substring(0, 100)}...\n`);

    // 2. Verificar base de datos actual
    const currentDB = await pool.request().query('SELECT DB_NAME() AS DBName');
    console.log(`✅ Base de datos actual: ${currentDB.recordset[0].DBName}\n`);

    // 3. Listar todas las tablas
    console.log('📁 Tablas en la base de datos:');
    const tables = await pool.request().query(`
      SELECT TABLE_NAME, 
             (SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID(TABLE_SCHEMA + '.' + TABLE_NAME)) as Columns
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);

    if (tables.recordset.length === 0) {
      console.log('   ❌ No hay tablas en la base de datos\n');
      console.log('💡 SOLUCIÓN: Ejecuta el script de creación de BD en SSMS\n');
      await pool.close();
      process.exit(1);
    }

    console.log(`   Encontradas ${tables.recordset.length} tablas:\n`);
    tables.recordset.forEach(table => {
      console.log(`   • ${table.TABLE_NAME} (${table.Columns} columnas)`);
    });
    console.log('');

    // 4. Contar registros en tablas principales
    console.log('📊 Conteo de registros en tablas principales:\n');

    const tablesToCheck = ['Cliente', 'Negocio', 'Cuenta', 'Movimiento', 'Tarjeta', 'OrdenPago'];
    
    for (const tableName of tablesToCheck) {
      try {
        const count = await pool.request().query(`SELECT COUNT(*) as Total FROM ${tableName}`);
        const total = count.recordset[0].Total;
        
        if (total === 0) {
          console.log(`   ⚠️  ${tableName}: ${total} registros (VACÍA)`);
        } else {
          console.log(`   ✅ ${tableName}: ${total} registros`);
        }
      } catch (err) {
        console.log(`   ❌ ${tableName}: No existe o error (${err.message})`);
      }
    }
    console.log('');

    // 5. Mostrar algunos datos de ejemplo
    console.log('📋 Ejemplos de datos:\n');

    // Clientes
    try {
      const clientes = await pool.request().query('SELECT TOP 3 * FROM Cliente ORDER BY int_cliecodigo DESC');
      if (clientes.recordset.length > 0) {
        console.log('   👤 Últimos 3 clientes:');
        clientes.recordset.forEach(c => {
          console.log(`      ID: ${c.int_cliecodigo} - ${c.vch_clienombre} ${c.vch_cliepaterno}`);
        });
        console.log('');
      }
    } catch (err) {
      console.log('   ⚠️ No se pudieron obtener clientes\n');
    }

    // Negocios
    try {
      const negocios = await pool.request().query('SELECT TOP 3 * FROM Negocio ORDER BY int_negocodigo DESC');
      if (negocios.recordset.length > 0) {
        console.log('   🏢 Últimos 3 negocios:');
        negocios.recordset.forEach(n => {
          console.log(`      ID: ${n.int_negocodigo} - ${n.vch_negonombre} (NIT: ${n.chr_negnit})`);
        });
        console.log('');
      }
    } catch (err) {
      console.log('   ⚠️ No se pudieron obtener negocios\n');
    }

    // 6. Verificar estructura de columnas
    console.log('🔍 Estructura de tabla Cliente:');
    const clienteColumns = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Cliente'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('   Columnas encontradas:');
    clienteColumns.recordset.forEach(col => {
      const size = col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : '';
      console.log(`      • ${col.COLUMN_NAME}: ${col.DATA_TYPE}${size} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    console.log('');

    await pool.close();
    
    console.log('✅ DIAGNÓSTICO COMPLETADO\n');
    console.log('📝 Resumen:');
    console.log(`   • Base de datos: ${dbSettings.database}`);
    console.log(`   • Tablas: ${tables.recordset.length}`);
    console.log(`   • Conexión: Funcionando correctamente\n`);

    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR EN DIAGNÓSTICO:');
    console.error(`   Código: ${error.code}`);
    console.error(`   Mensaje: ${error.message}\n`);

    if (error.code === 'ELOGIN') {
      console.log('🔧 PROBLEMA DE AUTENTICACIÓN:');
      console.log('   1. Abre SQL Server Management Studio');
      console.log('   2. Ejecuta:');
      console.log('      USE master;');
      console.log('      ALTER LOGIN sa ENABLE;');
      console.log('      ALTER LOGIN sa WITH PASSWORD = \'willi2312\';');
      console.log('   3. Reinicia SQL Server\n');
    } else if (error.code === 'ESOCKET') {
      console.log('🔧 SQL SERVER NO RESPONDE:');
      console.log('   1. Verifica que SQL Server esté corriendo');
      console.log('   2. Abre services.msc');
      console.log('   3. Si usas SQL Express: DB_SERVER=localhost\\SQLEXPRESS\n');
    } else if (error.message.includes('Cannot open database')) {
      console.log('🔧 BASE DE DATOS NO EXISTE:');
      console.log(`   1. La BD "${dbSettings.database}" no existe`);
      console.log('   2. En SSMS ejecuta:');
      console.log(`      CREATE DATABASE ${dbSettings.database};`);
      console.log('   3. O cambia DB_DATABASE en .env a una BD existente\n');
    }

    process.exit(1);
  }
}

diagnose();
