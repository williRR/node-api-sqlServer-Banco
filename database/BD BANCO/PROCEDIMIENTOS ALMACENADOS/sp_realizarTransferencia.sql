USE Banco;
GO

-- =============================================
-- sp_realizarTransferencia - Para transferencias entre clientes
-- ✅ Actualizado con nombres de columnas correctos
-- =============================================
CREATE OR ALTER PROCEDURE sp_realizarTransferencia
    @clienteId INT,
    @cuentaDestino INT,
    @monto DECIMAL(18, 2),
    @concepto VARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT OFF;
    
    DECLARE @int_cuencodigo_origen INT;
    DECLARE @dec_saldo_origen DECIMAL(18, 2);
    DECLARE @dec_nuevo_saldo DECIMAL(18, 2);
    DECLARE @nuevo_mov_origen INT;
    DECLARE @nuevo_mov_destino INT;
    DECLARE @transaccionId VARCHAR(50);
    -- ✅ Nuevas variables para identificar tipo de cuenta destino
    DECLARE @tipoCuentaDestino VARCHAR(20);
    DECLARE @nombreDestino VARCHAR(100);
    
    BEGIN TRY
        -- Obtener cuenta origen (usando vch_cuenestado en lugar de chr_cuenestado)
        SELECT @int_cuencodigo_origen = int_cuencodigo, @dec_saldo_origen = dec_cuensaldo
        FROM Cuenta 
        WHERE int_cliecodigo = @clienteId AND vch_cuenestado = 'ACTIVO';
        
        IF @int_cuencodigo_origen IS NULL
        BEGIN
            SELECT 
                0 AS MovimientoID,
                'Cliente sin cuenta activa.' AS Mensaje,
                50001 AS ErrorNumero,
                0 AS Exito;
            RETURN;
        END
        
        IF @dec_saldo_origen < @monto
        BEGIN
            SELECT 
                0 AS MovimientoID,
                'Fondos insuficientes.' AS Mensaje,
                50002 AS ErrorNumero,
                0 AS Exito;
            RETURN;
        END
        
        -- ✅ Verificar cuenta destino Y obtener su tipo
        SELECT 
            @tipoCuentaDestino = CASE 
                WHEN int_cliecodigo IS NOT NULL THEN 'CLIENTE'
                WHEN int_negocodigo IS NOT NULL THEN 'NEGOCIO'
                ELSE 'DESCONOCIDO'
            END,
            @nombreDestino = CASE
                WHEN int_cliecodigo IS NOT NULL THEN 
                    (SELECT vch_clienombre FROM Cliente WHERE int_cliecodigo = c.int_cliecodigo)
                WHEN int_negocodigo IS NOT NULL THEN 
                    (SELECT vch_negonombre FROM Negocio WHERE int_negocodigo = c.int_negocodigo)
                ELSE 'Desconocido'
            END
        FROM Cuenta c
        WHERE int_cuencodigo = @cuentaDestino AND vch_cuenestado = 'ACTIVO';
        
        IF @tipoCuentaDestino IS NULL
        BEGIN
            SELECT 
                0 AS MovimientoID,
                'Cuenta destino no válida o inactiva.' AS Mensaje,
                50003 AS ErrorNumero,
                0 AS Exito;
            RETURN;
        END
        
        IF @int_cuencodigo_origen = @cuentaDestino
        BEGIN
            SELECT 
                0 AS MovimientoID,
                'No puede transferir a la misma cuenta.' AS Mensaje,
                50004 AS ErrorNumero,
                0 AS Exito;
            RETURN;
        END
        
        BEGIN TRANSACTION;
        
        -- ✅ Generar ID más corto (máximo 30 caracteres)
        -- Formato: TXF_timestamp (20 caracteres máximo)
        SET @transaccionId = 'TXF_' + CONVERT(VARCHAR(20), GETDATE(), 112) + REPLACE(CONVERT(VARCHAR(8), GETDATE(), 108), ':', '');
        
        -- Debitar cuenta origen
        UPDATE Cuenta 
        SET dec_cuensaldo = dec_cuensaldo - @monto
        WHERE int_cuencodigo = @int_cuencodigo_origen;
        
        -- Acreditar cuenta destino
        UPDATE Cuenta 
        SET dec_cuensaldo = dec_cuensaldo + @monto
        WHERE int_cuencodigo = @cuentaDestino;
        
        -- Registrar movimiento de SALIDA (sin vch_movidescripcion si no existe)
        SELECT @nuevo_mov_origen = ISNULL(MAX(int_movinumero), 0) + 1 
        FROM Movimiento 
        WHERE int_cuencodigo = @int_cuencodigo_origen;
        
        INSERT INTO Movimiento (
            int_cuencodigo, 
            int_movinumero, 
            dtt_movifecha, 
            int_emplcodigo, 
            int_tipocodigo, 
            dec_moviimporte, 
            int_cuenreferencia, 
            vch_movitransaccionid
        )
        VALUES (
            @int_cuencodigo_origen, 
            @nuevo_mov_origen, 
            GETDATE(), 
            100, 
            2, -- Tipo: Débito/Salida
            @monto, 
            @cuentaDestino, 
            @transaccionId
        );
        
        -- Registrar movimiento de ENTRADA
        SELECT @nuevo_mov_destino = ISNULL(MAX(int_movinumero), 0) + 1 
        FROM Movimiento 
        WHERE int_cuencodigo = @cuentaDestino;
        
        INSERT INTO Movimiento (
            int_cuencodigo, 
            int_movinumero, 
            dtt_movifecha, 
            int_emplcodigo, 
            int_tipocodigo, 
            dec_moviimporte, 
            int_cuenreferencia, 
            vch_movitransaccionid
        )
        VALUES (
            @cuentaDestino, 
            @nuevo_mov_destino, 
            GETDATE(), 
            100, 
            1, -- Tipo: Crédito/Entrada
            @monto, 
            @int_cuencodigo_origen, 
            @transaccionId
        );
        
        -- Obtener nuevo saldo
        SELECT @dec_nuevo_saldo = dec_cuensaldo 
        FROM Cuenta 
        WHERE int_cuencodigo = @int_cuencodigo_origen;
        
        COMMIT TRANSACTION;
        
        -- ✅ DEVOLVER RESULTADO CON INFO DEL TIPO DE CUENTA DESTINO
        SELECT 
            @nuevo_mov_origen AS MovimientoID,
            @int_cuencodigo_origen AS CuentaOrigen,
            @cuentaDestino AS CuentaDestino,
            @tipoCuentaDestino AS TipoCuentaDestino,
            @nombreDestino AS NombreDestino,
            @monto AS Monto,
            @dec_nuevo_saldo AS NuevoSaldo,
            @transaccionId AS TransaccionID,
            CASE 
                WHEN @tipoCuentaDestino = 'NEGOCIO' THEN 'Transferencia a negocio realizada exitosamente'
                ELSE 'Transferencia realizada exitosamente'
            END AS Mensaje,
            1 AS Exito;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        -- ✅ DEVOLVER ERROR CON SELECT
        SELECT 
            0 AS MovimientoID,
            ERROR_MESSAGE() AS Mensaje,
            ERROR_NUMBER() AS ErrorNumero,
            0 AS Exito;
    END CATCH
END
GO

PRINT '✅ sp_realizarTransferencia - Mejorado con detección de tipo de cuenta';
GO