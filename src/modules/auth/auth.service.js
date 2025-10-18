import jwt from 'jsonwebtoken';
import { getConnection, sql } from '../../config/db.js';

class AuthService {
  /**
   * Login por username o DPI/NIT y contraseña en texto plano
   */
  async login(username, password) {
    try {
      const pool = await getConnection();

      // 1) Buscar en Cliente
      const clienteResult = await pool.request()
        .input('username', sql.VarChar, username)
        .query(`
          SELECT 
            int_cliecodigo,
            vch_clienombre,
            vch_cliepaterno,
            vch_cliematerno,
            chr_cliedni,
            vch_clieemail,
            vch_clietelefono,
            dtt_clienacimiento,
            vch_cliedireccion,
            vch_clieciudad,
            vch_clieusuario,
            vch_clieclave
          FROM Cliente
          WHERE (vch_clieusuario = @username OR chr_cliedni = @username)
        `);

      if (clienteResult.recordset.length > 0) {
        const c = clienteResult.recordset[0];
        if (password !== c.vch_clieclave) throw new Error('INVALID_CREDENTIALS');

        const cuentas = await pool.request()
          .input('int_cliecodigo', sql.Int, c.int_cliecodigo)
          .query(`
            SELECT int_cuencodigo, dec_cuensaldo, vch_cuenestado, chr_monecodigo, dtt_cuenfechacreacion
            FROM Cuenta
            WHERE int_cliecodigo = @int_cliecodigo
            ORDER BY dtt_cuenfechacreacion DESC
          `);

        const token = jwt.sign({
          id: c.int_cliecodigo,
          username: c.vch_clieusuario,
          email: c.vch_clieemail,
          nombre: c.vch_clienombre,
          paterno: c.vch_cliepaterno,
          materno: c.vch_cliematerno,
          tipo: 'cliente'
        }, process.env.JWT_SECRET || 'secret_key_temporal', { expiresIn: process.env.JWT_EXPIRATION || '1h' });

        return {
          success: true,
          message: 'Login exitoso',
          token,
          usuario: {
            id: c.int_cliecodigo,
            nombre: c.vch_clienombre,
            paterno: c.vch_cliepaterno,
            materno: c.vch_cliematerno,
            nombreCompleto: `${c.vch_clienombre} ${c.vch_cliepaterno} ${c.vch_cliematerno}`,
            email: c.vch_clieemail,
            telefono: c.vch_clietelefono,
            fecha_nacimiento: c.dtt_clienacimiento,
            direccion: c.vch_cliedireccion,
            ciudad: c.vch_clieciudad,
            dpi: c.chr_cliedni,
            username: c.vch_clieusuario,
            tipo: 'cliente',
            cuentas: cuentas.recordset
          }
        };
      }

      // 2) Buscar en Negocio
      const negocioResult = await pool.request()
        .input('username', sql.VarChar, username)
        .query(`
          SELECT 
            int_negocodigo,
            vch_negonombre,
            chr_negnit,
            vch_negociudad,
            vch_negodireccion,
            vch_negotelefono,
            vch_negoemail,
            vch_negusuario,
            vch_negclave
          FROM Negocio
          WHERE (vch_negusuario = @username OR chr_negnit = @username)
        `);

      if (negocioResult.recordset.length > 0) {
        const n = negocioResult.recordset[0];
        if (password !== n.vch_negclave) throw new Error('INVALID_CREDENTIALS');

        const cuentas = await pool.request()
          .input('int_negocodigo', sql.Int, n.int_negocodigo)
          .query(`
            SELECT int_cuencodigo, dec_cuensaldo, vch_cuenestado, chr_monecodigo, dtt_cuenfechacreacion
            FROM Cuenta
            WHERE int_negocodigo = @int_negocodigo
            ORDER BY dtt_cuenfechacreacion DESC
          `);

        const token = jwt.sign({
          id: n.int_negocodigo,
          username: n.vch_negusuario,
          email: n.vch_negoemail,
          nombre: n.vch_negonombre,
          nit: n.chr_negnit,
          tipo: 'negocio'
        }, process.env.JWT_SECRET || 'secret_key_temporal', { expiresIn: process.env.JWT_EXPIRATION || '1h' });

        return {
          success: true,
          message: 'Login exitoso',
          token,
          usuario: {
            id: n.int_negocodigo,
            nombre: n.vch_negonombre,
            nit: n.chr_negnit,
            email: n.vch_negoemail,
            telefono: n.vch_negotelefono,
            ciudad: n.vch_negociudad,
            direccion: n.vch_negodireccion,
            username: n.vch_negusuario,
            tipo: 'negocio',
            cuentas: cuentas.recordset
          }
        };
      }

      throw new Error('INVALID_CREDENTIALS');
    } catch (error) {
      if (error.message === 'INVALID_CREDENTIALS') {
        throw new Error('Usuario o contraseña incorrectos');
      }
      throw error;
    }
  }

  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_temporal');
      const pool = await getConnection();

      if (decoded.tipo === 'cliente') {
        const r = await pool.request()
          .input('int_cliecodigo', sql.Int, decoded.id)
          .query(`
            SELECT int_cliecodigo, vch_clienombre, vch_cliepaterno, vch_cliematerno, vch_clieusuario, vch_clieemail
            FROM Cliente
            WHERE int_cliecodigo = @int_cliecodigo
          `);
        if (r.recordset.length === 0) throw new Error('Usuario no encontrado');
        return { success: true, usuario: { ...decoded, ...r.recordset[0] } };
      }

      if (decoded.tipo === 'negocio') {
        const r = await pool.request()
          .input('int_negocodigo', sql.Int, decoded.id)
          .query(`
            SELECT int_negocodigo, vch_negonombre, vch_negusuario, vch_negoemail, chr_negnit
            FROM Negocio
            WHERE int_negocodigo = @int_negocodigo
          `);
        if (r.recordset.length === 0) throw new Error('Usuario no encontrado');
        return { success: true, usuario: { ...decoded, ...r.recordset[0] } };
      }

      throw new Error('Tipo de usuario no válido');
    } catch {
      throw new Error('Token inválido o expirado');
    }
  }

  async cambiarPassword(userId, userType, passwordActual, passwordNueva) {
    const pool = await getConnection();

    if (userType === 'cliente') {
      const r = await pool.request()
        .input('int_cliecodigo', sql.Int, userId)
        .query(`SELECT vch_clieclave FROM Cliente WHERE int_cliecodigo = @int_cliecodigo`);
      if (r.recordset.length === 0) throw new Error('Usuario no encontrado');
      if (passwordActual !== r.recordset[0].vch_clieclave) throw new Error('Contraseña actual incorrecta');
      if (passwordNueva.length < 6) throw new Error('La nueva contraseña debe tener al menos 6 caracteres');
      await pool.request()
        .input('int_cliecodigo', sql.Int, userId)
        .input('vch_clieclave', sql.VarChar, passwordNueva)
        .query(`UPDATE Cliente SET vch_clieclave = @vch_clieclave WHERE int_cliecodigo = @int_cliecodigo`);
      return { success: true, message: 'Contraseña actualizada exitosamente' };
    }

    if (userType === 'negocio') {
      const r = await pool.request()
        .input('int_negocodigo', sql.Int, userId)
        .query(`SELECT vch_negclave FROM Negocio WHERE int_negocodigo = @int_negocodigo`);
      if (r.recordset.length === 0) throw new Error('Usuario no encontrado');
      if (passwordActual !== r.recordset[0].vch_negclave) throw new Error('Contraseña actual incorrecta');
      if (passwordNueva.length < 6) throw new Error('La nueva contraseña debe tener al menos 6 caracteres');
      await pool.request()
        .input('int_negocodigo', sql.Int, userId)
        .input('vch_negclave', sql.VarChar, passwordNueva)
        .query(`UPDATE Negocio SET vch_negclave = @vch_negclave WHERE int_negocodigo = @int_negocodigo`);
      return { success: true, message: 'Contraseña actualizada exitosamente' };
    }

    throw new Error('Tipo de usuario no válido');
  }

  async obtenerPerfilCompleto(userId, userType) {
    const pool = await getConnection();

    if (userType === 'cliente') {
      const r = await pool.request()
        .input('int_cliecodigo', sql.Int, userId)
        .query(`
          SELECT int_cliecodigo, vch_clienombre, vch_cliepaterno, vch_cliematerno, vch_clieemail, vch_clietelefono,
                 dtt_clienacimiento, vch_cliedireccion, vch_clieciudad, chr_cliedni, vch_clieusuario
          FROM Cliente
          WHERE int_cliecodigo = @int_cliecodigo
        `);
      if (r.recordset.length === 0) throw new Error('Usuario no encontrado');
      const c = r.recordset[0];

      const cuentas = await pool.request()
        .input('int_cliecodigo', sql.Int, userId)
        .query(`
          SELECT int_cuencodigo, dec_cuensaldo, vch_cuenestado, chr_monecodigo, dtt_cuenfechacreacion
          FROM Cuenta
          WHERE int_cliecodigo = @int_cliecodigo
          ORDER BY dtt_cuenfechacreacion DESC
        `);

      const tarjetas = await pool.request()
        .input('int_cliecodigo', sql.Int, userId)
        .query(`
          SELECT T.chr_tarjcodigo, T.int_cuencodigo, T.dtt_tarjfechavencimiento, T.vch_tarjestado, T.vch_tarjetipo
          FROM Tarjeta T
          INNER JOIN Cuenta C ON T.int_cuencodigo = C.int_cuencodigo
          WHERE C.int_cliecodigo = @int_cliecodigo
          ORDER BY T.dtt_tarjfechavencimiento DESC
        `);

      return {
        success: true,
        usuario: {
          id: c.int_cliecodigo,
          nombre: c.vch_clienombre,
          paterno: c.vch_cliepaterno,
          materno: c.vch_cliematerno,
          nombreCompleto: `${c.vch_clienombre} ${c.vch_cliepaterno} ${c.vch_cliematerno}`,
          email: c.vch_clieemail,
          telefono: c.vch_clietelefono,
          fecha_nacimiento: c.dtt_clienacimiento,
          direccion: c.vch_cliedireccion,
          ciudad: c.vch_clieciudad,
          dpi: c.chr_cliedni,
          username: c.vch_clieusuario,
          tipo: 'cliente',
          cuentas: cuentas.recordset,
          tarjetas: tarjetas.recordset.map(t => ({
            ...t,
            chr_tarjcodigo: this.enmascararTarjeta(t.chr_tarjcodigo)
          }))
        }
      };
    }

    if (userType === 'negocio') {
      const r = await pool.request()
        .input('int_negocodigo', sql.Int, userId)
        .query(`
          SELECT int_negocodigo, vch_negonombre, chr_negnit, vch_negociudad, vch_negodireccion,
                 vch_negotelefono, vch_negoemail, vch_negusuario
          FROM Negocio
          WHERE int_negocodigo = @int_negocodigo
        `);
      if (r.recordset.length === 0) throw new Error('Usuario no encontrado');
      const n = r.recordset[0];

      const cuentas = await pool.request()
        .input('int_negocodigo', sql.Int, userId)
        .query(`
          SELECT int_cuencodigo, dec_cuensaldo, vch_cuenestado, chr_monecodigo, dtt_cuenfechacreacion
          FROM Cuenta
          WHERE int_negocodigo = @int_negocodigo
          ORDER BY dtt_cuenfechacreacion DESC
        `);

      const tarjetas = await pool.request()
        .input('int_negocodigo', sql.Int, userId)
        .query(`
          SELECT T.chr_tarjcodigo, T.int_cuencodigo, T.dtt_tarjfechavencimiento, T.vch_tarjestado, T.vch_tarjetipo
          FROM Tarjeta T
          INNER JOIN Cuenta C ON T.int_cuencodigo = C.int_cuencodigo
          WHERE C.int_negocodigo = @int_negocodigo
          ORDER BY T.dtt_tarjfechavencimiento DESC
        `);

      return {
        success: true,
        usuario: {
          id: n.int_negocodigo,
          nombre: n.vch_negonombre,
          nit: n.chr_negnit,
          ciudad: n.vch_negociudad,
          direccion: n.vch_negodireccion,
          telefono: n.vch_negotelefono,
          email: n.vch_negoemail,
          username: n.vch_negusuario,
          tipo: 'negocio',
          cuentas: cuentas.recordset,
          tarjetas: tarjetas.recordset.map(t => ({
            ...t,
            chr_tarjcodigo: this.enmascararTarjeta(t.chr_tarjcodigo)
          }))
        }
      };
    }

    throw new Error('Tipo de usuario no válido');
  }

  enmascararTarjeta(numero) {
    if (!numero || numero.length < 4) return '****';
    return '**** **** **** ' + numero.slice(-4);
  }
}

export default new AuthService();