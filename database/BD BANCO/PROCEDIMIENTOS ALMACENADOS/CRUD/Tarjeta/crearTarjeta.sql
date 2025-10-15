USE Banco
GO

CREATE OR ALTER PROCEDURE sp_crearTarjeta
    @cuencodigo INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Variables para datos generados
    DECLARE @tarjbase VARCHAR(15);
    DECLARE @tarjcodigo VARCHAR(16);
    DECLARE @luhnDigito CHAR(1);
    DECLARE @tarjcvv VARCHAR(3);
    
    -- 🚨 Variable para la fecha de expiracin segura
    DECLARE @fecha_expiracion_segura DATETIME;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Validar que la cuenta exista
        IF NOT EXISTS (SELECT 1 FROM Cuenta WHERE int_cuencodigo = @cuencodigo)
        BEGIN
            RAISERROR('El código de cuenta proporcionado no existe.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- 2. Validar que la cuenta no tenga una tarjeta
        IF EXISTS (SELECT 1 FROM Tarjeta WHERE int_cuencodigo = @cuencodigo)
        BEGIN
            RAISERROR('La cuenta ya tiene una tarjeta asociada.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- 3. Generar el número de tarjeta (Luhn)
        SET @tarjbase = '4' + RIGHT('00000000000000' + 
            CAST(ABS(CHECKSUM(NEWID())) % 1000000000000000 AS VARCHAR(14)), 14);
        SET @tarjbase = LEFT(@tarjbase, 15); -- Asegurar 15 dígitos
        
        SET @luhnDigito = dbo.fn_CalcularDigitoLuhn(@tarjbase); -- Se asume que esta funcin existe
        SET @tarjcodigo = @tarjbase + @luhnDigito;

        -- 4. Generar el CVV (3 dígitos)
        SET @tarjcvv = RIGHT('00' + CAST(ABS(CHECKSUM(NEWID())) % 1000 AS VARCHAR(3)), 3);

        -- 🚨 5. Calcular la fecha de expiración como el ÚLTIMO DÍA del mes
        -- Primero, suma 5 años a la fecha actual
        SET @fecha_expiracion_segura = DATEADD(year, 5, GETDATE());
        
        -- Luego, usa EOMONTH para establecerla en el ltimo da de ese mes (ej. 2030-10-31)
        SET @fecha_expiracion_segura = EOMONTH(@fecha_expiracion_segura);

        -- 6. Insertar la nueva tarjeta
        INSERT INTO Tarjeta (
            chr_tarjcodigo,
            int_cuencodigo,
            chr_tarjcvv,
            dtt_tarjfechavencimiento, -- Usa la fecha segura
            vch_tarjestado,
            vch_tarjetipo
        ) VALUES (
            @tarjcodigo,
            @cuencodigo,
            @tarjcvv,
            @fecha_expiracion_segura,
            'ACTIVO',
            'DEBITO'
        );

        COMMIT TRANSACTION;

        -- Devolver la tarjeta generada (útil para pruebas)
        SELECT
            @tarjcodigo AS TarjetaGenerada,
            @tarjcvv AS CVVGenerado,
            -- Extraer el MM/YY para la aplicacin (ej: '10/30')
            FORMAT(@fecha_expiracion_segura, 'MM/yy') AS FechaExpiracion; 

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END
GO