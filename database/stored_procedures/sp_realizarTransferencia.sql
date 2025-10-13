-- =============================================
-- sp_realizarTransferencia - Para transferencias entre clientes
-- =============================================
CREATE OR ALTER PROCEDURE sp_realizarTransferencia
    @clienteId INT,
    @cuentaDestino INT,
    @monto DECIMAL(18, 2),
    @concepto VARCHAR(200),
    @resultado VARCHAR(15) OUTPUT,
    @mensaje VARCHAR(100) OUTPUT,
    @transaccionId VARCHAR(50) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @int_cuencodigo_origen INT;
    DECLARE @dec_saldo_origen DECIMAL(18, 2);
    DECLARE @nuevo_mov_origen INT;
    DECLARE @nuevo_mov_destino INT;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Obtener cuenta origen
        SELECT @int_cuencodigo_origen = int_cuencodigo, @dec_saldo_origen = dec_cuensaldo
        FROM Cuenta WHERE int_cliecodigo = @clienteId AND vch_cuenestado = 'ACTIVO';
        
        -- Validaciones
        IF @int_cuencodigo_origen IS NULL
        BEGIN
            SET @resultado = 'RECHAZADO';
            SET @mensaje = 'Cliente sin cuenta activa.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        IF @dec_saldo_origen < @monto
        BEGIN
            SET @resultado = 'RECHAZADO';
            SET @mensaje = 'Fondos insuficientes.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- Verificar cuenta destino existe
        IF NOT EXISTS (SELECT 1 FROM Cuenta WHERE int_cuencodigo = @cuentaDestino AND vch_cuenestado = 'ACTIVO')
        BEGIN
            SET @resultado = 'RECHAZADO';
            SET @mensaje = 'Cuenta destino no válida.';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- Generar ID de transacción
        SET @transaccionId = 'TXF_' + CAST(NEWID() AS VARCHAR(36));
        
        -- Debitar cuenta origen
        UPDATE Cuenta SET dec_cuensaldo = dec_cuensaldo - @monto
        WHERE int_cuencodigo = @int_cuencodigo_origen;
        
        -- Acreditar cuenta destino
        UPDATE Cuenta SET dec_cuensaldo = dec_cuensaldo + @monto
        WHERE int_cuencodigo = @cuentaDestino;
        
        -- Registrar movimientos
        SELECT @nuevo_mov_origen = ISNULL(MAX(int_movinumero), 0) + 1 
        FROM Movimiento WHERE int_cuencodigo = @int_cuencodigo_origen;
        
        INSERT INTO Movimiento (int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid)
        VALUES (@int_cuencodigo_origen, @nuevo_mov_origen, GETDATE(), 100, 2, @monto, @cuentaDestino, @transaccionId);
        
        SELECT @nuevo_mov_destino = ISNULL(MAX(int_movinumero), 0) + 1 
        FROM Movimiento WHERE int_cuencodigo = @cuentaDestino;
        
        INSERT INTO Movimiento (int_cuencodigo, int_movinumero, dtt_movifecha, int_emplcodigo, int_tipocodigo, dec_moviimporte, int_cuenreferencia, vch_movitransaccionid)
        VALUES (@cuentaDestino, @nuevo_mov_destino, GETDATE(), 100, 1, @monto, @int_cuencodigo_origen, @transaccionId);
        
        COMMIT TRANSACTION;
        SET @resultado = 'EXITOSO';
        SET @mensaje = 'Transferencia realizada exitosamente.';
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET @resultado = 'RECHAZADO';
        SET @mensaje = 'Error interno al procesar transferencia.';
        SET @transaccionId = NULL;
    END CATCH
END
GO