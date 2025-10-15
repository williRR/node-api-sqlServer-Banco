-- =============================================
-- sp_autorizarPago - VERIFICAR Y RECREAR
-- =============================================
USE Banco_Backup;
GO

-- Eliminar el procedimiento existente si hay conflictos
IF OBJECT_ID('sp_autorizarPago', 'P') IS NOT NULL
    DROP PROCEDURE sp_autorizarPago;
GO

-- Crear procedimiento desde cero con validación de fecha mejorada
CREATE PROCEDURE sp_autorizarPago
    @tarjcodigo VARCHAR(16),
    @monto DECIMAL(18, 2),
    @tarjfecha VARCHAR(5),
    @tarjcvv VARCHAR(4),
    @merchantid VARCHAR(50),
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
    
    -- Variables para validación
    DECLARE @tarj_cvv_db VARCHAR(3);
    DECLARE @tarj_vencimiento_db DATETIME;
    
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

        -- 2️⃣ Obtener cuenta del NEGOCIO
        SELECT 
            @int_cuencodigo_negocio = c.int_cuencodigo,
            @dec_cuensaldo_negocio = c.dec_cuensaldo
        FROM Cuenta c
        INNER JOIN Negocio n ON c.int_negocodigo = n.int_negocodigo
        WHERE n.vch_negusuario = @merchantid
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
            SET @mensaje = 'Negocio no encontrado o cuenta inactiva.';
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

        -- ✅ NUEVA VALIDACIÓN: Verificar que la fecha ENVIADA coincida con la fecha ALMACENADA
        -- Comparar mes y año de la fecha enviada vs la fecha almacenada
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
            @emplcodigo, 2, @monto, @int_cuencodigo_negocio, 'PAGO_' + @merchantid
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
            @emplcodigo, 1, @monto, @int_cuencodigo_cliente, 'COBRO_' + @merchantid
        );

        -- 7️⃣ Éxito
        COMMIT TRANSACTION;
        SET @resultado = 'APROBADO';
        SET @mensaje = 'Transacción exitosa. Pago procesado.';
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
PRINT '✅ Procedimiento sp_autorizarPago recreado con validación de fecha mejorada';
PRINT '';
PRINT '📋 Validaciones implementadas:';
PRINT '   1. ✅ Tarjeta existe y está activa';
PRINT '   2. ✅ Negocio existe y está activo';
PRINT '   3. ✅ CVV coincide con el almacenado';
PRINT '   4. ✅ Tarjeta no expirada (vs fecha actual)';
PRINT '   5. ✅ Fecha enviada coincide con fecha almacenada (MES/AÑO)';
PRINT '   6. ✅ Saldo suficiente';
GO