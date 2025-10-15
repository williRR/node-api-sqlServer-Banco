USE Banco;
GO

-- =============================================
-- SP_registrarTransaccion
-- Registra la petición inicial del Payment Gateway (Estado: PENDIENTE)
-- =============================================
CREATE OR ALTER PROCEDURE sp_registrarTransaccion
    @merchantid VARCHAR(50),
    @monto DECIMAL(18, 2),
    @moneda VARCHAR(3),
    @ultimos4 VARCHAR(4)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT OFF;
    
    DECLARE @transaccionid INT;

    BEGIN TRY
        BEGIN TRANSACTION;
        
        INSERT INTO TransaccionPasarela (
            vch_merchantid,
            dec_monto,
            vch_moneda,
            vch_tarjetaultimos4,
            vch_estado,
            vch_mensaje
        ) VALUES (
            @merchantid,
            @monto,
            @moneda,
            @ultimos4,
            'PENDIENTE',
            'Petición enviada al banco.'
        );

        -- Capturar el ID generado
        SET @transaccionid = SCOPE_IDENTITY();
        
        COMMIT TRANSACTION;

        -- ✅ DEVOLVER RESULTADO CON SELECT
        SELECT 
            @transaccionid AS TransaccionID,
            @merchantid AS MerchantID,
            @monto AS Monto,
            @moneda AS Moneda,
            @ultimos4 AS Ultimos4Digitos,
            'PENDIENTE' AS Estado,
            'Petición enviada al banco.' AS Mensaje,
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