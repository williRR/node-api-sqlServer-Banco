USE Banco_Backup;
GO

-- Eliminar procedimiento existente
IF OBJECT_ID('sp_pagarOrdenPago', 'P') IS NOT NULL
    DROP PROCEDURE sp_pagarOrdenPago;
GO

-- =============================================
-- sp_pagarOrdenPago - Para que clientes paguen órdenes
-- =============================================
CREATE PROCEDURE sp_pagarOrdenPago
    @clienteId INT,
    @codigoOrden VARCHAR(20),
    @claveAcceso VARCHAR(8),
    @resultado VARCHAR(15) OUTPUT,
    @mensaje VARCHAR(100) OUTPUT,
    @ordenId INT OUTPUT,
    @monto DECIMAL(18, 2) OUTPUT,
    @negocio VARCHAR(100) OUTPUT,
    @transaccionId VARCHAR(50) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @int_cuencodigo_cliente INT;
    DECLARE @int_cuencodigo_negocio INT;
    DECLARE @dec_saldo_cliente DECIMAL(18, 2);
    DECLARE @int_negocodigo INT;
    DECLARE @nuevo_mov_cliente INT;
    DECLARE @nuevo_mov_negocio INT;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        PRINT '🔍 Buscando orden de pago...';
        
        -- ✅ Buscar orden de pago
        SELECT 
            @ordenId = int_ordenid, 
            @monto = dec_monto, 
            @int_negocodigo = int_negocodigo
        FROM OrdenPago 
        WHERE vch_codigorden = @codigoOrden 
          AND vch_claveacceso = @claveAcceso
          AND vch_estado = 'PENDIENTE'
          AND dtt_fechavencimiento > GETDATE();
        
        IF @ordenId IS NULL
        BEGIN
            SET @resultado = 'RECHAZADO';
            SET @mensaje = 'Orden no válida, ya pagada o vencida.';
            SET @ordenId = 0;
            SET @monto = 0;
            SET @negocio = NULL;
            SET @transaccionId = NULL;
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        PRINT '✅ Orden encontrada: ' + CAST(@ordenId AS VARCHAR);
        PRINT '🔍 Obteniendo cuentas...';
        
        -- ✅ Obtener cuenta del CLIENTE
        SELECT 
            @int_cuencodigo_cliente = int_cuencodigo, 
            @dec_saldo_cliente = dec_cuensaldo
        FROM Cuenta 
        WHERE int_cliecodigo = @clienteId 
          AND vch_cuenestado = 'ACTIVO';
        
        -- ✅ Obtener cuenta del NEGOCIO
        SELECT 
            @int_cuencodigo_negocio = c.int_cuencodigo, 
            @negocio = n.vch_negonombre
        FROM Cuenta c 
        INNER JOIN Negocio n ON c.int_negocodigo = n.int_negocodigo
        WHERE c.int_negocodigo = @int_negocodigo 
          AND c.vch_cuenestado = 'ACTIVO';
        
        -- ===== VALIDACIONES =====
        
        IF @int_cuencodigo_cliente IS NULL
        BEGIN
            SET @resultado = 'RECHAZADO';
            SET @mensaje = 'Cliente sin cuenta activa.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        IF @int_cuencodigo_negocio IS NULL
        BEGIN
            SET @resultado = 'RECHAZADO';
            SET @mensaje = 'Negocio no encontrado o cuenta inactiva.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        IF @dec_saldo_cliente < @monto
        BEGIN
            SET @resultado = 'RECHAZADO';
            SET @mensaje = 'Fondos insuficientes.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        PRINT '✅ Validaciones pasadas. Procesando pago...';
        
        -- ✅ Generar ID de transacción CORTO
        DECLARE @timestamp VARCHAR(14) = CONVERT(VARCHAR, GETDATE(), 112) + REPLACE(CONVERT(VARCHAR(8), GETDATE(), 108), ':', '');
        DECLARE @random VARCHAR(3) = RIGHT('000' + CAST(ABS(CHECKSUM(NEWID())) % 1000 AS VARCHAR), 3);
        SET @transaccionId = 'O' + SUBSTRING(@timestamp, 3, 12) + @random;  -- O + 12 dígitos + 3 random = 16 chars
        
        -- ✅ Debitar cliente
        UPDATE Cuenta 
        SET dec_cuensaldo = dec_cuensaldo - @monto
        WHERE int_cuencodigo = @int_cuencodigo_cliente;
        
        PRINT '💰 Cliente debitado: -' + CAST(@monto AS VARCHAR);
        
        -- ✅ Acreditar negocio
        UPDATE Cuenta 
        SET dec_cuensaldo = dec_cuensaldo + @monto
        WHERE int_cuencodigo = @int_cuencodigo_negocio;
        
        PRINT '💰 Negocio acreditado: +' + CAST(@monto AS VARCHAR);
        
        -- ✅ Registrar movimiento DÉBITO (cliente)
        SELECT @nuevo_mov_cliente = ISNULL(MAX(int_movinumero), 0) + 1 
        FROM Movimiento 
        WHERE int_cuencodigo = @int_cuencodigo_cliente;
        
        INSERT INTO Movimiento (
            int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, 
            int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid
        )
        VALUES (
            @int_cuencodigo_cliente, @nuevo_mov_cliente, GETDATE(), 
            100, 2, @monto, @int_cuencodigo_negocio, @transaccionId
        );
        
        -- ✅ Registrar movimiento CRÉDITO (negocio)
        SELECT @nuevo_mov_negocio = ISNULL(MAX(int_movinumero), 0) + 1 
        FROM Movimiento 
        WHERE int_cuencodigo = @int_cuencodigo_negocio;
        
        INSERT INTO Movimiento (
            int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, 
            int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid
        )
        VALUES (
            @int_cuencodigo_negocio, @nuevo_mov_negocio, GETDATE(), 
            100, 1, @monto, @int_cuencodigo_cliente, @transaccionId
        );
        
        PRINT '📝 Movimientos registrados';
        
        -- ✅ Marcar orden como pagada
        UPDATE OrdenPago 
        SET vch_estado = 'PAGADO', 
            dtt_fechapago = GETDATE(), 
            int_cliecodigo_pago = @clienteId,
            vch_transaccionid = @transaccionId
        WHERE int_ordenid = @ordenId;
        
        PRINT '✅ Orden marcada como PAGADA';
        
        COMMIT TRANSACTION;
        
        SET @resultado = 'EXITOSO';
        SET @mensaje = 'Orden pagada exitosamente.';
        
        PRINT '✅ Transacción completada exitosamente';
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 
            ROLLBACK TRANSACTION;
        
        SET @resultado = 'RECHAZADO';
        SET @mensaje = 'Error: ' + ERROR_MESSAGE();
        SET @ordenId = 0;
        SET @monto = 0;
        SET @negocio = NULL;
        SET @transaccionId = NULL;
        
        -- ✅ Imprimir error para debugging
        PRINT '❌ ERROR SQL: ' + ERROR_MESSAGE();
        PRINT '❌ Error Number: ' + CAST(ERROR_NUMBER() AS VARCHAR);
        PRINT '❌ Error Line: ' + CAST(ERROR_LINE() AS VARCHAR);
    END CATCH
END
GO

PRINT '✅ sp_pagarOrdenPago actualizado con mejor debugging';
GO