USE Banco;
GO

-- =============================================
-- SP_registrarTransaccion
-- Registra la peticin inicial del Payment Gateway (Estado: PENDIENTE)
-- =============================================
CREATE OR ALTER PROCEDURE sp_registrarTransaccion
    @merchantid VARCHAR(50),
    @monto DECIMAL(18, 2),
    @moneda VARCHAR(3),
    @ultimos4 VARCHAR(4),
    @transaccionid INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
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
            'Peticin enviada al banco.'
        );

        -- Devuelve el ID de transaccin generado
        SET @transaccionid = SCOPE_IDENTITY();
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO