=-- =============================================
-- sp_pagarOrdenPago - Para que clientes paguen órdenes
-- =============================================
CREATE OR ALTER PROCEDURE sp_pagarOrdenPago
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
        
        -- Buscar orden de pago
        SELECT @ordenId = int_ordenid, @monto = dec_monto, @int_negocodigo = int_negocodigo
        FROM OrdenPago 
        WHERE vch_codigorden = @codigoOrden 
          AND vch_claveacceso = @claveAcceso
          AND vch_estado = 'PENDIENTE'
          AND dtt_fechavencimiento > GETDATE();
        
        IF @ordenId IS NULL
        BEGIN
            SET @resultado = 'RECHAZADO';
            SET @mensaje = 'Orden no válida, ya pagada o vencida.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- Obtener cuentas
        SELECT @int_cuencodigo_cliente = int_cuencodigo, @dec_saldo_cliente = dec_cuensaldo
        FROM Cuenta WHERE int_cliecodigo = @clienteId AND vch_cuenestado = 'ACTIVO';
        
        SELECT @int_cuencodigo_negocio = int_cuencodigo, @negocio = n.vch_negonombre
        FROM Cuenta c INNER JOIN Negocio n ON c.int_negocodigo = n.int_negocodigo
        WHERE c.int_negocodigo = @int_negocodigo AND c.vch_cuenestado = 'ACTIVO';
        
        -- Validaciones
        IF @int_cuencodigo_cliente IS NULL
        BEGIN
            SET @resultado = 'RECHAZADO';
            SET @mensaje = 'Cliente sin cuenta activa.';
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
        
        -- Generar ID de transacción
        SET @transaccionId = 'ORD_' + @codigoOrden + '_' + CAST(NEWID() AS VARCHAR(36));
        
        -- Debitar cliente
        UPDATE Cuenta SET dec_cuensaldo = dec_cuensaldo - @monto
        WHERE int_cuencodigo = @int_cuencodigo_cliente;
        
        -- Acreditar negocio
        UPDATE Cuenta SET dec_cuensaldo = dec_cuensaldo + @monto
        WHERE int_cuencodigo = @int_cuencodigo_negocio;
        
        -- Registrar movimientos
        SELECT @nuevo_mov_cliente = ISNULL(MAX(int_movinumero), 0) + 1 
        FROM Movimiento WHERE int_cuencodigo = @int_cuencodigo_cliente;
        
        INSERT INTO Movimiento (int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid)
        VALUES (@int_cuencodigo_cliente, @nuevo_mov_cliente, GETDATE(), 100, 2, @monto, @int_cuencodigo_negocio, @transaccionId);
        
        SELECT @nuevo_mov_negocio = ISNULL(MAX(int_movinumero), 0) + 1 
        FROM Movimiento WHERE int_cuencodigo = @int_cuencodigo_negocio;
        
        INSERT INTO Movimiento (int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid)
        VALUES (@int_cuencodigo_negocio, @nuevo_mov_negocio, GETDATE(), 100, 1, @monto, @int_cuencodigo_cliente, @transaccionId);
        
        -- Marcar orden como pagada
        UPDATE OrdenPago 
        SET vch_estado = 'PAGADO', 
            dtt_fechapago = GETDATE(), 
            int_cliecodigo_pago = @clienteId,
            vch_transaccionid = @transaccionId
        WHERE int_ordenid = @ordenId;
        
        COMMIT TRANSACTION;
        SET @resultado = 'EXITOSO';
        SET @mensaje = 'Orden pagada exitosamente.';
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET @resultado = 'RECHAZADO';
        SET @mensaje = 'Error interno al procesar pago.';
    END CATCH
END
GO