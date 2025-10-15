-- =============================================
-- sp_generarOrdenPago - Para que negocios generen órdenes de pago
-- =============================================
CREATE OR ALTER PROCEDURE sp_generarOrdenPago
    @negocioId INT,
    @monto DECIMAL(18, 2),
    @concepto VARCHAR(200),
    @vigenciaHoras INT,
    @codigoOrden VARCHAR(20) OUTPUT,
    @claveAcceso VARCHAR(8) OUTPUT,
    @fechaVencimiento DATETIME OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Generar código único
        SET @codigoOrden = 'ORD' + RIGHT('0000000' + CAST(ABS(CHECKSUM(NEWID())) % 1000000 AS VARCHAR), 7);
        
        -- Generar clave de acceso
        SET @claveAcceso = RIGHT('0000' + CAST(ABS(CHECKSUM(NEWID())) % 10000 AS VARCHAR), 4);
        
        -- Calcular fecha de vencimiento
        SET @fechaVencimiento = DATEADD(HOUR, @vigenciaHoras, GETDATE());
        
        -- Insertar orden
        INSERT INTO OrdenPago (int_negocodigo, vch_codigorden, vch_claveacceso, dec_monto, vch_concepto, dtt_fechavencimiento)
        VALUES (@negocioId, @codigoOrden, @claveAcceso, @monto, @concepto, @fechaVencimiento);
        
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO