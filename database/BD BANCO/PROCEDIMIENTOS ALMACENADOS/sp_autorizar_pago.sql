-- =============================================
-- sp_autorizarPago - USANDO tu estructura existente
-- =============================================
CREATE OR ALTER PROCEDURE sp_autorizarPago
    @tarjcodigo VARCHAR(16),
    @monto DECIMAL(18, 2),
    @tarjfecha VARCHAR(5),        -- Formato MM/YY
    @tarjcvv VARCHAR(4),          -- CVV de la tarjeta
    @merchantid VARCHAR(50),      -- vch_negusuario del negocio
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
    
    -- Conversión de fecha
    DECLARE @fecha_entrada DATE; 
    DECLARE @mes VARCHAR(2) = SUBSTRING(@tarjfecha, 1, 2);
    DECLARE @anio_corto VARCHAR(2) = SUBSTRING(@tarjfecha, 4, 2);
    DECLARE @anio_largo VARCHAR(4) = '20' + @anio_corto;
    SET @fecha_entrada = CONVERT(DATE, @mes + '/01/' + @anio_largo, 101);
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- 1️⃣ Obtener datos del CLIENTE
        SELECT 
            @int_cuencodigo_cliente = c.int_cuencodigo,
            @dec_cuensaldo_cliente = c.dec_cuensaldo,
            @tarj_cvv_db = t.chr_tarjcvv,
            @tarj_vencimiento_db = t.dtt_tarjfechavencimiento
        FROM Cuenta c
        INNER JOIN Tarjeta t ON c.int_cuencodigo = t.int_cuencodigo
        WHERE t.chr_tarjcodigo = @tarjcodigo
          AND c.vch_cuenestado = 'ACTIVO';

        -- 2️⃣ Obtener cuenta del NEGOCIO usando tu estructura existente
        SELECT 
            @int_cuencodigo_negocio = c.int_cuencodigo,
            @dec_cuensaldo_negocio = c.dec_cuensaldo
        FROM Cuenta c
        INNER JOIN Negocio n ON c.int_negocodigo = n.int_negocodigo
        WHERE n.vch_negusuario = @merchantid  -- 🎯 Aquí usamos el merchantId
          AND c.vch_cuenestado = 'ACTIVO';

        -- VALIDACIONES
        IF @int_cuencodigo_cliente IS NULL
        BEGIN
            SET @resultado = 'RECHAZADO';
            SET @mensaje = 'Tarjeta no válida o cuenta inactiva.';
            SET @cuentacodigo = NULL;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        IF @int_cuencodigo_negocio IS NULL
        BEGIN
            SET @resultado = 'RECHAZADO';
            SET @mensaje = 'Negocio no encontrado o cuenta inactiva.';
            SET @cuentacodigo = @int_cuencodigo_cliente;
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        IF @tarjcvv != @tarj_cvv_db
        BEGIN
            SET @resultado = 'RECHAZADO';
            SET @mensaje = 'CVV incorrecto.';
            SET @cuentacodigo = @int_cuencodigo_cliente;
            ROLLBACK TRANSACTION;
            RETURN;
        END

        IF @tarj_vencimiento_db < GETDATE()
        BEGIN
            SET @resultado = 'RECHAZADO';
            SET @mensaje = 'Tarjeta expirada.';
            SET @cuentacodigo = @int_cuencodigo_cliente;
            ROLLBACK TRANSACTION;
            RETURN;
        END

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
        SET @mensaje = 'Error interno al procesar el pago.';
        SET @cuentacodigo = NULL;
        PRINT 'Error SQL: ' + ERROR_MESSAGE();
    END CATCH
END
GO