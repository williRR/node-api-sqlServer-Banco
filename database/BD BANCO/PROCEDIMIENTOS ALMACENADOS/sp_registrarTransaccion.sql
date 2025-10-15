USE Banco;
GO

-- =============================================
-- SP_registrarTransaccion
-- Registra la petición inicial del Payment Gateway (Estado: PENDIENTE)
-- ✅ Corregido para usar SOLO las columnas que existen en TransaccionPasarela
-- =============================================
CREATE OR ALTER PROCEDURE sp_registrarTransaccion
    @merchantid VARCHAR(50),
    @monto DECIMAL(18, 2),
    @moneda VARCHAR(3) = 'GTQ',
    @ultimos4 VARCHAR(4)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT OFF;
    
    DECLARE @transaccionid INT;
    DECLARE @codigoMoneda VARCHAR(3);

    BEGIN TRY
        -- ✅ Mapear moneda (usar VARCHAR(3) en lugar de código interno)
        SET @codigoMoneda = CASE 
            WHEN @moneda IN ('GTQ', 'Q', 'QUETZAL', 'QUETZALES') THEN 'GTQ'
            WHEN @moneda IN ('USD', '$', 'DOLLAR', 'DOLARES') THEN 'USD'
            ELSE 'GTQ'  -- Por defecto Quetzales
        END;

        BEGIN TRANSACTION;
        
        -- ✅ Insertar SOLO con columnas que existen en tu modelo
        INSERT INTO TransaccionPasarela (
            vch_merchantid,
            dec_monto,
            vch_moneda,
            vch_tarjetaultimos4,
            vch_estado,
            vch_mensaje,
            dtt_fechahora
        ) VALUES (
            @merchantid,
            @monto,
            @codigoMoneda,  -- ✅ Ahora guarda 'GTQ' o 'USD' directamente
            @ultimos4,
            'PENDIENTE',
            'Petición enviada al banco.',
            GETDATE()
        );

        SET @transaccionid = SCOPE_IDENTITY();
        
        COMMIT TRANSACTION;

        -- ✅ DEVOLVER RESULTADO
        SELECT 
            @transaccionid AS TransaccionID,
            @merchantid AS MerchantID,
            @monto AS Monto,
            @codigoMoneda AS Moneda,
            @ultimos4 AS Ultimos4Digitos,
            'PENDIENTE' AS Estado,
            'Transacción de pasarela registrada exitosamente' AS Mensaje,
            1 AS Exito;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        SELECT 
            0 AS TransaccionID,
            ERROR_MESSAGE() AS Mensaje,
            ERROR_NUMBER() AS ErrorNumero,
            0 AS Exito;
    END CATCH
END
GO

PRINT '✅ sp_registrarTransaccion corregido - Solo usa columnas existentes';
GO