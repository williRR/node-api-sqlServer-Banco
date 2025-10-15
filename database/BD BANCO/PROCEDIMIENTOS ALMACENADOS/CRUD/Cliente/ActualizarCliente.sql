USE Banco
GO

CREATE OR ALTER PROCEDURE sp_actualizarCliente
    @cliecodigo INT,
    @cliepaterno VARCHAR(25) = NULL,
    @cliematerno VARCHAR(25) = NULL,
    @clienombre VARCHAR(30) = NULL,
    @clienacimiento DATE = NULL,
    @clieciudad VARCHAR(30) = NULL,
    @cliedireccion VARCHAR(50) = NULL,
    @clietelefono VARCHAR(20) = NULL,
    @clieemail VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION

        -- 1. Validar que el cliente exista
        IF NOT EXISTS (SELECT 1 FROM Cliente WHERE int_cliecodigo = @cliecodigo)
        BEGIN
            RAISERROR('El cliente con el código especificado no existe.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- 2. Validar que al menos un campo sea proporcionado para la actualización
        IF @cliepaterno IS NULL AND @cliematerno IS NULL AND @clienombre IS NULL AND @clienacimiento IS NULL AND @clieciudad IS NULL AND @cliedireccion IS NULL AND @clietelefono IS NULL AND @clieemail IS NULL
        BEGIN
            RAISERROR('Debe proporcionar al menos un campo para actualizar.', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END

        -- 3. Actualizar la tabla Cliente
        UPDATE Cliente
        SET
            vch_cliepaterno = ISNULL(@cliepaterno, vch_cliepaterno),
            vch_cliematerno = ISNULL(@cliematerno, vch_cliematerno),
            vch_clienombre = ISNULL(@clienombre, vch_clienombre),
            dtt_clienacimiento = ISNULL(@clienacimiento, dtt_clienacimiento),
            vch_clieciudad = ISNULL(@clieciudad, vch_clieciudad),
            vch_cliedireccion = ISNULL(@cliedireccion, vch_cliedireccion),
            vch_clietelefono = ISNULL(@clietelefono, vch_clietelefono),
            vch_clieemail = ISNULL(@clieemail, vch_clieemail)
        WHERE int_cliecodigo = @cliecodigo;

        -- 4. Confirmar la transacción
        COMMIT TRANSACTION;

    END TRY
    BEGIN CATCH
        -- 5. Manejar errores
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        DECLARE @ErrorMessage NVARCHAR(4000);
        DECLARE @ErrorSeverity INT;
        DECLARE @ErrorState INT;

        SELECT
            @ErrorMessage = ERROR_MESSAGE(),
            @ErrorSeverity = ERROR_SEVERITY(),
            @ErrorState = ERROR_STATE();

        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END


EXECUTE sp_actualizarCliente
    @cliecodigo = 108,
    @clieemail = 'carlos.gomez@example.com';
GO
