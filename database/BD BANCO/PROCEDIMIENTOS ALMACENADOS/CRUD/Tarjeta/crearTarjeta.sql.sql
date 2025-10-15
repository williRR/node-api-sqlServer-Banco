USE Banco
GO

CREATE OR ALTER PROCEDURE sp_crearTarjeta
    @cuencodigo INT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. validar que la cuenta exista
        IF NOT EXISTS (SELECT 1 FROM Cuenta WHERE int_cuencodigo = @cuencodigo)
        BEGIN
            RAISERROR('El código de cuenta proporcionado no existe.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- 2. validar que la cuenta no tenga una tarjeta
        IF EXISTS (SELECT 1 FROM Tarjeta WHERE int_cuencodigo = @cuencodigo)
        BEGIN
            RAISERROR('La cuenta ya tiene una tarjeta asociada.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- 3. Generate the card number (16-digit valid Luhn number)
        DECLARE @tarjbase VARCHAR(15); -- Primeros 15 dígitos
        DECLARE @tarjcodigo VARCHAR(16); -- Número de tarjeta completo
        DECLARE @luhnDigito CHAR(1); -- Dígito de control

        -- Generar los primeros 15 dígitos. Asumimos que empieza por '4' (Visa)
        -- Genera 14 dígitos aleatorios
        SET @tarjbase = '4' + RIGHT('00000000000000' + 
            CAST(ABS(CHECKSUM(NEWID())) % 1000000000000000 AS VARCHAR(14)), 14);
        
        -- Asegurar que tiene exactamente 15 dígitos (solo para seguridad)
        SET @tarjbase = LEFT(@tarjbase, 15);

        -- Calcular el dígito de control de Luhn para los 15 dígitos generados
        SET @luhnDigito = dbo.fn_CalcularDigitoLuhn(@tarjbase);
        
        -- Concatenar para formar el número de tarjeta de 16 dígitos
        SET @tarjcodigo = @tarjbase + @luhnDigito;

        -- 4. Generate the CVV (e.g., a random 3-digit number)
        DECLARE @tarjcvv VARCHAR(3) = RIGHT('00' + CAST(ABS(CHECKSUM(NEWID())) % 1000 AS VARCHAR(3)), 3);

        -- 5. Insert the new card
        INSERT INTO Tarjeta (
            chr_tarjcodigo,
            int_cuencodigo,
            chr_tarjcvv,
            dtt_tarjfechavencimiento,
            vch_tarjestado,
            vch_tarjetipo
        ) VALUES (
            @tarjcodigo,
            @cuencodigo,
            @tarjcvv,
            DATEADD(year, 5, GETDATE()), -- Expiration date 5 years from now
            'ACTIVO',
            'DEBITO' -- Asumiendo DÉBITO, podrías cambiar a 'CREDITO' si el prefijo es de otro tipo (e.g., 5 para Mastercard)
        );

        COMMIT TRANSACTION;

        -- Return the new card number and CVV to the application
        SELECT
            @tarjcodigo AS TarjetaGenerada,
            @tarjcvv AS CVVGenerado;

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END
GO