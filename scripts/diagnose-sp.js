import dotenv from 'dotenv';
import sql from 'mssql';

dotenv.config();

const dbSettings = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || 'Banco_Backup',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

console.log('🔍 DIAGNÓSTICO DE PROCEDIMIENTO ALMACENADO sp_crearCliente\n');

async function testSP() {
  try {
    console.log('🔌 Conectando a la base de datos...');
    const pool = await sql.connect(dbSettings);
    console.log('✅ Conectado\n');

    // 1. Verificar si el SP existe
    console.log('1️⃣ Verificando si sp_crearCliente existe...');
    const spExists = await pool.request().query(`
      SELECT COUNT(*) as Existe 
      FROM sys.objects 
      WHERE type = 'P' AND name = 'sp_crearCliente'
    `);
    
    if (spExists.recordset[0].Existe === 0) {
      console.log('❌ El procedimiento sp_crearCliente NO existe');
      console.log('💡 Ejecuta el script: database/stored_procedures/sp_crearCliente.sql\n');
      process.exit(1);
    }
    console.log('✅ El procedimiento existe\n');

    // 2. Ver parámetros del SP
    console.log('2️⃣ Parámetros del procedimiento:');
    const params = await pool.request().query(`
      SELECT 
        PARAMETER_NAME,
        DATA_TYPE,
        CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.PARAMETERS
      WHERE SPECIFIC_NAME = 'sp_crearCliente'
      ORDER BY ORDINAL_POSITION
    `);
    
    params.recordset.forEach(p => {
      console.log(`   • ${p.PARAMETER_NAME}: ${p.DATA_TYPE}${p.CHARACTER_MAXIMUM_LENGTH ? `(${p.CHARACTER_MAXIMUM_LENGTH})` : ''}`);
    });
    console.log('');

    // 3. Ejecutar el SP de prueba
    console.log('3️⃣ Ejecutando procedimiento de prueba...\n');
    
    const request = pool.request();
    request.input('Paterno', sql.NVarChar(100), 'TestPaterno');
    request.input('Materno', sql.NVarChar(100), 'TestMaterno');
    request.input('Nombre', sql.NVarChar(100), 'TestNombre');
    request.input('DNI', sql.Char(13), '9999999999999');
    request.input('Nacimiento', sql.Date, '1990-01-01');
    request.input('Ciudad', sql.NVarChar(100), 'Guatemala');
    request.input('Direccion', sql.NVarChar(255), 'Direccion de prueba');
    request.input('Telefono', sql.VarChar(20), '99999999');
    request.input('Email', sql.NVarChar(100), 'test@diagnostico.com');
    request.input('Usuario', sql.NVarChar(50), 'testuser');
    request.input('Clave', sql.NVarChar(100), 'testpass');

    console.log('📤 Enviando parámetros...');
    const result = await request.execute('sp_crearCliente');
    
    console.log('📥 Respuesta recibida:\n');
    console.log('Resultado completo:', JSON.stringify(result, null, 2));
    
    if (result.recordset && result.recordset.length > 0) {
      console.log('\n✅ Recordset recibido:');
      console.log(result.recordset[0]);
      
      if (result.recordset[0].Exito === 1) {
        console.log('\n✅ PROCEDIMIENTO FUNCIONA CORRECTAMENTE');
        console.log(`   Cliente ID creado: ${result.recordset[0].ClienteID}`);
      } else {
        console.log('\n❌ Procedimiento devolvió error:');
        console.log(`   ${result.recordset[0].Mensaje}`);
      }
    } else {
      console.log('\n⚠️ El procedimiento no devolvió recordset');
      console.log('💡 Revisa que el SP tenga un SELECT al final');
    }

    await pool.close();
    process.exit(0);

  } catch (error) {
    console.error('\n💥 ERROR:');
    console.error('   Mensaje:', error.message);
    console.error('   Código:', error.code);
    console.error('   Stack:', error.stack);
    process.exit(1);
  }
}

testSP();
