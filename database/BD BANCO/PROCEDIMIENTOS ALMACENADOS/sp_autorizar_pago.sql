-- =============================================
-- sp_autorizarPago - VERSIÓN CON ID DE NEGOCIO
-- Usa int_negocodigo en lugar de vch_negusuario
-- =============================================
USE Banco;
GO



-- Crear procedimiento desde cero con ID de negocio
CREATE OR ALTER PROCEDURE sp_autorizarPago
    @tarjcodigo VARCHAR(16),
    @monto DECIMAL(18, 2),
    @tarjfecha VARCHAR(5),
    @tarjcvv VARCHAR(4),
    @merchantid INT,  -- ✅ Cambiado a INT (int_negocodigo)
    @emplcodigo INT = 100,
    @tipocodigo INT = 2,
    @resultado VARCHAR(15) OUTPUT,
    @mensaje VARCHAR(100) OUTPUT,
    @cuentacodigo INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Variables para cliente
    DECLARE @int_cuencodigo_cliente INT;
    DECLARE @dec_cuensaldo_cliente DECIMAL(18, 2);
    DECLARE @nuevo_movinumero_cliente INT;
    
    -- Variables para negocio
    DECLARE @int_cuencodigo_negocio INT;
    DECLARE @dec_cuensaldo_negocio DECIMAL(18, 2);
    DECLARE @nuevo_movinumero_negocio INT;
    DECLARE @vch_negonombre VARCHAR(50);
    
    -- Variables para validación
    DECLARE @tarj_cvv_db VARCHAR(3);
    DECLARE @tarj_vencimiento_db DATETIME;
    DECLARE @transaccionId VARCHAR(20);  -- ✅ Máximo 20 caracteres
    
    -- Conversión de fecha ENVIADA por el cliente
    DECLARE @fecha_entrada_enviada DATE; 
    DECLARE @mes_enviado INT = CAST(SUBSTRING(@tarjfecha, 1, 2) AS INT);
    DECLARE @anio_corto_enviado VARCHAR(2) = SUBSTRING(@tarjfecha, 4, 2);
    DECLARE @anio_largo_enviado INT = 2000 + CAST(@anio_corto_enviado AS INT);
    
    -- Construir fecha del último día del mes enviado
    SET @fecha_entrada_enviada = EOMONTH(DATEFROMPARTS(@anio_largo_enviado, @mes_enviado, 1));
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- 1️⃣ Obtener datos del CLIENTE y la TARJETA
        SELECT 
            @int_cuencodigo_cliente = c.int_cuencodigo,
            @dec_cuensaldo_cliente = c.dec_cuensaldo,
            @tarj_cvv_db = t.chr_tarjcvv,
            @tarj_vencimiento_db = t.dtt_tarjfechavencimiento
        FROM Cuenta c
        INNER JOIN Tarjeta t ON c.int_cuencodigo = t.int_cuencodigo
        WHERE t.chr_tarjcodigo = @tarjcodigo
          AND c.vch_cuenestado = 'ACTIVO'
          AND t.vch_tarjestado = 'ACTIVO';

        -- 2️⃣ Obtener cuenta del NEGOCIO usando int_negocodigo
        SELECT 
            @int_cuencodigo_negocio = c.int_cuencodigo,
            @dec_cuensaldo_negocio = c.dec_cuensaldo,
            @vch_negonombre = n.vch_negonombre
        FROM Cuenta c
        INNER JOIN Negocio n ON c.int_negocodigo = n.int_negocodigo
        WHERE n.int_negocodigo = @merchantid  -- ✅ Usa int_negocodigo directamente
          AND c.vch_cuenestado = 'ACTIVO';

        -- ===== VALIDACIONES =====
        
        -- Validar que la tarjeta existe
        IF @int_cuencodigo_cliente IS NULL
        BEGIN
            SET @resultado = 'RECHAZADO';
            SET @mensaje = 'Tarjeta no válida o cuenta inactiva.';
            SET @cuentacodigo = NULL;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- Validar que el negocio existe
        IF @int_cuencodigo_negocio IS NULL
        BEGIN
            SET @resultado = 'RECHAZADO';
            SET @mensaje = 'Negocio ID ' + CAST(@merchantid AS VARCHAR) + ' no encontrado o cuenta inactiva.';
            SET @cuentacodigo = @int_cuencodigo_cliente;
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- ✅ Validar que el CVV coincida
        IF @tarjcvv != @tarj_cvv_db
        BEGIN
            SET @resultado = 'RECHAZADO';
            SET @mensaje = 'CVV incorrecto.';
            SET @cuentacodigo = @int_cuencodigo_cliente;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- ✅ Validar que la tarjeta NO esté expirada (fecha almacenada vs fecha actual)
        IF @tarj_vencimiento_db < GETDATE()
        BEGIN
            SET @resultado = 'RECHAZADO';
            SET @mensaje = 'Tarjeta expirada.';
            SET @cuentacodigo = @int_cuencodigo_cliente;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- ✅ Verificar que la fecha ENVIADA coincida con la fecha ALMACENADA
        DECLARE @mes_almacenado INT = MONTH(@tarj_vencimiento_db);
        DECLARE @anio_almacenado INT = YEAR(@tarj_vencimiento_db);
        
        IF @mes_enviado != @mes_almacenado OR @anio_largo_enviado != @anio_almacenado
        BEGIN
            SET @resultado = 'RECHAZADO';
            SET @mensaje = 'Fecha de vencimiento incorrecta.';
            SET @cuentacodigo = @int_cuencodigo_cliente;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- Validar saldo suficiente
        IF @dec_cuensaldo_cliente < @monto
        BEGIN
            SET @resultado = 'RECHAZADO';
            SET @mensaje = 'Fondos insuficientes.';
            SET @cuentacodigo = @int_cuencodigo_cliente;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- ✅ Generar ID de transacción CORTO (máximo 20 caracteres)
        -- Formato: PAG_YYYYMMDDHHMMSS_RND (20 caracteres exactos)
        DECLARE @timestamp VARCHAR(14) = CONVERT(VARCHAR, GETDATE(), 112) + REPLACE(CONVERT(VARCHAR(8), GETDATE(), 108), ':', '');
        DECLARE @random VARCHAR(3) = RIGHT('000' + CAST(ABS(CHECKSUM(NEWID())) % 1000 AS VARCHAR), 3);
        SET @transaccionId = 'P' + SUBSTRING(@timestamp, 3, 12) + @random;  -- P + 12 dígitos + 3 random = 16 chars

        -- 3️⃣ DEBITAR del cliente
        UPDATE Cuenta
        SET dec_cuensaldo = dec_cuensaldo - @monto
        WHERE int_cuencodigo = @int_cuencodigo_cliente;

        -- 4️⃣ ACREDITAR al negocio
        UPDATE Cuenta
        SET dec_cuensaldo = dec_cuensaldo + @monto
        WHERE int_cuencodigo = @int_cuencodigo_negocio;

        -- 5️⃣ Movimiento DÉBITO (cliente)
        SELECT @nuevo_movinumero_cliente = ISNULL(MAX(int_movinumero), 0) + 1 
        FROM Movimiento WHERE int_cuencodigo = @int_cuencodigo_cliente;

        INSERT INTO Movimiento (
            int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, 
            int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid
        )
        VALUES (
            @int_cuencodigo_cliente, @nuevo_movinumero_cliente, GETDATE(), 
            @emplcodigo, 2, @monto, @int_cuencodigo_negocio, 
            @transaccionId  -- ✅ ID corto (16 caracteres)
        );

        -- 6️⃣ Movimiento CRÉDITO (negocio)
        SELECT @nuevo_movinumero_negocio = ISNULL(MAX(int_movinumero), 0) + 1 
        FROM Movimiento WHERE int_cuencodigo = @int_cuencodigo_negocio;

        INSERT INTO Movimiento (
            int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, 
            int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid
        )
        VALUES (
            @int_cuencodigo_negocio, @nuevo_movinumero_negocio, GETDATE(), 
            @emplcodigo, 1, @monto, @int_cuencodigo_cliente, 
            @transaccionId  -- ✅ ID corto (16 caracteres)
        );

        -- 7️⃣ Éxito
        COMMIT TRANSACTION;
        SET @resultado = 'APROBADO';
        SET @mensaje = 'Transacción exitosa. Pago procesado en ' + @vch_negonombre + '.';
        SET @cuentacodigo = @int_cuencodigo_cliente;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET @resultado = 'RECHAZADO';
        SET @mensaje = 'Error interno al procesar el pago: ' + ERROR_MESSAGE();
        SET @cuentacodigo = NULL;
    END CATCH
END
GO

-- Verificar que se creó correctamente
PRINT '✅ sp_autorizarPago actualizado - Ahora usa int_negocodigo (ID) directamente';
PRINT '   Parámetro @merchantid ahora es INT en lugar de VARCHAR';
PRINT '   IDs de transacción son más cortos (máx 20 caracteres)';
GO